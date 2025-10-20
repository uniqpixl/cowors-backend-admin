import { UserEntity } from '@/auth/entities/user.entity';
import {
  BookingStatus,
  PaymentGateway,
  PaymentStatus,
  RefundStatus,
} from '@/common/enums/booking.enum';
import { PaymentMethod } from '@/common/enums/payment.enum';
import {
  BalanceType,
  TransactionStatus,
  TransactionType,
} from '@/common/enums/wallet.enum';
import { PaymentInitiatedEvent } from '@/common/events/domain-events/payment.events';
import { FinancialEventSourcingService } from '@/common/events/financial-event-sourcing';
import { AggregateType } from '@/common/events/financial-event-sourcing/financial-aggregate.entity';
import { FinancialEventType } from '@/common/events/financial-event-sourcing/financial-event.entity';
import {
  ErrorCodes,
  ErrorResponseUtil,
} from '@/common/utils/error-response.util';
import { BookingEntity } from '@/database/entities/booking.entity';
import {
  KycProvider,
  KycStatus,
  KycVerificationEntity,
  KycVerificationType,
  UserType,
} from '@/database/entities/kyc-verification.entity';
import {
  GatewayResponse,
  PaymentBreakdown,
  PaymentEntity,
  PaymentMetadata,
} from '@/database/entities/payment.entity';
import {
  RefundEntity,
  RefundMethod,
  RefundType,
} from '@/database/entities/refund.entity';
import { WalletBalanceEntity } from '@/database/entities/wallet-balance.entity';
import { WalletTransactionEntity } from '@/database/entities/wallet-transaction.entity';
import { EntityType, IdGeneratorService } from '@/utils/id-generator.service';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import Stripe from 'stripe';
import { DataSource, In, Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { KycVerificationService } from '../user/kyc-verification.service';
import { WalletTransactionType } from '../wallet/dto/wallet.dto';
import { WalletService } from '../wallet/wallet.service';
import {
  CreatePaymentDto,
  CreateRefundDto,
  ProcessPaymentDto,
} from './dto/payment.dto';

// DTOs are imported from ./dto/payment.dto

@Injectable()
export class PaymentService {
  private stripe: Stripe;
  private razorpayKeyId: string;
  private razorpayKeySecret: string;

  constructor(
    @InjectRepository(PaymentEntity)
    private paymentRepository: Repository<PaymentEntity>,
    @InjectRepository(RefundEntity)
    private refundRepository: Repository<RefundEntity>,
    @InjectRepository(BookingEntity)
    private bookingRepository: Repository<BookingEntity>,
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
    @InjectRepository(KycVerificationEntity)
    private kycVerificationRepository: Repository<KycVerificationEntity>,
    private walletService: WalletService,
    private kycVerificationService: KycVerificationService,
    private configService: ConfigService,
    private dataSource: DataSource,
    private idGeneratorService: IdGeneratorService,
    private eventEmitter: EventEmitter2,
    private financialEventSourcingService: FinancialEventSourcingService,
  ) {
    // Initialize Stripe
    const stripeSecretKey = this.configService.get<string>('STRIPE_SECRET_KEY');
    if (stripeSecretKey) {
      this.stripe = new Stripe(stripeSecretKey, {
        apiVersion: '2025-08-27.basil',
      });
    }

    // Initialize Razorpay credentials
    this.razorpayKeyId = this.configService.get<string>('RAZORPAY_KEY_ID');
    this.razorpayKeySecret = this.configService.get<string>(
      'RAZORPAY_KEY_SECRET',
    );
  }

  /**
   * Check if user is a first-time user based on payment history
   */
  async isFirstTimeUser(userId: string): Promise<boolean> {
    const existingPayments = await this.paymentRepository.count({
      where: {
        userId,
        status: PaymentStatus.COMPLETED,
      },
    });

    return existingPayments === 0;
  }

  /**
   * Check if KYC is required for the payment based on business rules
   * KYC is ONLY required for first-time users making their first booking
   */
  async isKycRequiredForPayment(
    userId: string,
    amount: number,
    bookingId?: string,
  ): Promise<boolean> {
    // Check if user already has approved KYC
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (user?.kycVerified) {
      return false; // User already KYC verified
    }

    // Check if user is first-time user (no completed payments)
    const isFirstTime = await this.isFirstTimeUser(userId);

    // KYC is ONLY required for first-time users
    return isFirstTime;
  }

  /**
   * Trigger KYC verification process for a user
   */
  async triggerKycVerification(
    userId: string,
    bookingId?: string,
    paymentId?: string,
  ): Promise<{
    kycRequired: boolean;
    verificationId?: string;
    verificationUrl?: string;
  }> {
    try {
      // Check if there's already a pending KYC verification
      const existingVerification = await this.kycVerificationRepository.findOne(
        {
          where: {
            userId,
            status: KycStatus.PENDING,
          },
        },
      );

      if (existingVerification) {
        return {
          kycRequired: true,
          verificationId: existingVerification.id,
          verificationUrl: existingVerification.providerData?.verificationUrl,
        };
      }

      // Initiate new KYC verification
      const kycResponse =
        await this.kycVerificationService.initiateVerification(userId, {
          provider: KycProvider.CASHFREE, // Using Cashfree as the KYC provider
          verificationType: KycVerificationType.IDENTITY,
          userType: UserType.USER,
          bookingId,
          returnUrl: `${process.env.FRONTEND_URL}/payment/kyc-callback?paymentId=${paymentId}`,
        });

      return {
        kycRequired: true,
        verificationId: kycResponse.verificationId,
        verificationUrl: kycResponse.verificationUrl,
      };
    } catch (error) {
      console.error('Error triggering KYC verification:', error);
      return { kycRequired: false };
    }
  }

  async createPayment(
    createPaymentDto: CreatePaymentDto & { userId?: string },
  ): Promise<PaymentEntity> {
    const paymentId = this.generatePaymentId();

    // Fetch booking details to calculate payment breakdown
    const booking = await this.bookingRepository.findOne({
      where: { id: createPaymentDto.bookingId },
      relations: ['space'],
    });

    if (!booking) {
      throw ErrorResponseUtil.notFound('Booking', createPaymentDto.bookingId);
    }

    // Calculate payment breakdown with discount information
    const breakdown: PaymentBreakdown = {
      baseAmount: booking.baseAmount || createPaymentDto.amount,
      extrasAmount: 0, // Can be extended for extras
      taxAmount: 0, // Can be extended for taxes
      discountAmount: booking.discountAmount || 0,
      convenienceFee: 0, // Can be extended for convenience fees
      gatewayFee: 0, // Can be extended for gateway fees
      totalAmount: createPaymentDto.amount,
    };

    const payment = this.paymentRepository.create({
      ...createPaymentDto,
      paymentId,
      status: PaymentStatus.PENDING,
      currency: createPaymentDto.currency || 'INR',
      breakdown: createPaymentDto.breakdown || breakdown,
    });

    const savedPayment = await this.paymentRepository.save(payment);

    return savedPayment;
  }

  async createStripePaymentIntent(
    paymentId: string,
    amount: number,
    currency: string = 'inr',
    metadata?: any,
  ): Promise<any> {
    if (!this.stripe) {
      throw ErrorResponseUtil.internalServerError(
        'Stripe not configured',
        ErrorCodes.CONFIGURATION_ERROR,
      );
    }

    try {
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to smallest currency unit
        currency: currency.toLowerCase(),
        metadata: {
          paymentId,
          ...metadata,
        },
        automatic_payment_methods: {
          enabled: true,
        },
      });

      // Update payment with Stripe payment intent ID
      const stripeGatewayResponse: GatewayResponse = {
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
      };

      await this.paymentRepository.update(
        { paymentId },
        {
          gatewayOrderId: paymentIntent.id,
          gatewayResponse: stripeGatewayResponse,
        },
      );

      return {
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
      };
    } catch (error) {
      throw ErrorResponseUtil.internalServerError(
        `Stripe payment intent creation failed: ${error.message}`,
        ErrorCodes.PAYMENT_GATEWAY_ERROR,
      );
    }
  }

  async createRazorpayOrder(
    paymentId: string,
    amount: number,
    currency: string = 'INR',
    metadata?: any,
  ): Promise<any> {
    if (!this.razorpayKeyId || !this.razorpayKeySecret) {
      throw ErrorResponseUtil.internalServerError(
        'Razorpay not configured',
        ErrorCodes.CONFIGURATION_ERROR,
      );
    }

    try {
      // Note: In a real implementation, you would use the Razorpay SDK
      // For now, we'll simulate the order creation
      const orderId = this.idGeneratorService.generateId(EntityType.ORDER);

      // Update payment with Razorpay order ID
      const gatewayResponse: GatewayResponse = {
        orderId,
        amount: amount * 100, // Razorpay expects amount in paise
        currency,
      };

      await this.paymentRepository.update(
        { paymentId },
        {
          gatewayOrderId: orderId,
          gatewayResponse,
        },
      );

      return {
        orderId,
        amount: amount * 100,
        currency,
        keyId: this.razorpayKeyId,
      };
    } catch (error) {
      throw ErrorResponseUtil.internalServerError(
        `Razorpay order creation failed: ${error.message}`,
        ErrorCodes.PAYMENT_GATEWAY_ERROR,
      );
    }
  }

  async processPayment(
    paymentIntentId: string,
    userId: string,
    paymentMethodId: string,
    metadata?: any,
  ): Promise<PaymentEntity> {
    // Find payment by payment intent ID or create a new one
    // This is a simplified implementation
    const payment = await this.paymentRepository.findOne({
      where: { gatewayPaymentId: paymentIntentId },
    });

    if (!payment) {
      throw ErrorResponseUtil.notFound('Payment', paymentIntentId);
    }

    if (payment.status !== PaymentStatus.PENDING) {
      throw ErrorResponseUtil.badRequest(
        'Payment is not in pending status',
        ErrorCodes.INVALID_STATUS,
      );
    }

    await this.paymentRepository.update(
      { id: payment.id },
      {
        status: PaymentStatus.COMPLETED,
        gatewayPaymentId: paymentIntentId,
        metadata,
        completedAt: new Date(),
      },
    );

    return this.paymentRepository.findOne({ where: { id: payment.id } });
  }

  /**
   * Enhanced payment processing with KYC flow for first-time users
   * KYC is triggered AFTER payment success for first-time users only
   */
  async processPaymentDto(
    processPaymentDto: ProcessPaymentDto,
  ): Promise<
    PaymentEntity & { kycRequired?: boolean; kycVerificationUrl?: string }
  > {
    const { paymentId, gatewayPaymentId, gatewayOrderId, gatewayResponse } =
      processPaymentDto;

    const payment = await this.paymentRepository.findOne({
      where: { paymentId },
      relations: ['booking', 'booking.user'],
    });

    if (!payment) {
      throw ErrorResponseUtil.notFound('Payment', paymentId);
    }

    if (payment.status !== PaymentStatus.PENDING) {
      throw ErrorResponseUtil.badRequest(
        'Payment is not in pending status',
        ErrorCodes.INVALID_STATUS,
      );
    }

    // Update payment as successful
    const updatedGatewayResponse: GatewayResponse = {
      ...payment.gatewayResponse,
      ...gatewayResponse,
      transactionId: gatewayResponse?.id || gatewayResponse?.transactionId,
    };

    await this.paymentRepository.update(
      { id: payment.id },
      {
        status: PaymentStatus.COMPLETED,
        gatewayPaymentId,
        gatewayOrderId,
        gatewayResponse: updatedGatewayResponse,
        completedAt: new Date(),
        paidAt: new Date(),
      },
    );

    // Check if KYC is required AFTER payment success (for first-time users only)
    let kycRequired = false;
    let kycVerificationUrl: string | undefined;

    if (payment.userId && payment.booking) {
      kycRequired = await this.isKycRequiredForPayment(
        payment.userId,
        payment.amount,
        payment.bookingId,
      );

      if (kycRequired) {
        // Set booking status to PENDING with KYC_PENDING reason
        payment.booking.status = BookingStatus.PENDING_KYC;
        payment.booking.kycStatus = 'pending';
        payment.booking.kycRequiredAt = new Date();

        // Trigger KYC verification
        const kycResult = await this.triggerKycVerification(
          payment.userId,
          payment.bookingId,
          paymentId,
        );

        if (kycResult.kycRequired && kycResult.verificationUrl) {
          kycVerificationUrl = kycResult.verificationUrl;

          // Update payment metadata with KYC requirement
          await this.paymentRepository.update(
            { id: payment.id },
            {
              metadata: {
                ...payment.metadata,
                kycRequired: true,
                kycVerificationId: kycResult.verificationId,
              },
            },
          );

          // Update booking with KYC verification ID
          payment.booking.kycVerificationId = kycResult.verificationId;
        }
      } else {
        // KYC not required, move directly to CONFIRMED
        payment.booking.status = BookingStatus.CONFIRMED;
        payment.booking.kycStatus = 'not_required';
      }

      await this.bookingRepository.save(payment.booking);

      // Emit payment success event
      this.eventEmitter.emit('payment.completed', {
        paymentId: payment.paymentId,
        bookingId: payment.bookingId,
        userId: payment.userId,
        amount: payment.amount,
        currency: payment.currency,
        kycRequired,
        kycVerificationUrl,
        bookingStatus: payment.booking.status,
      });

      // Store financial event for audit trail
      await this.financialEventSourcingService.storeEvent({
        aggregateId: payment.paymentId,
        aggregateType: AggregateType.PAYMENT,
        eventType: FinancialEventType.PAYMENT_COMPLETED,
        eventData: {
          transactionId: gatewayPaymentId,
          gatewayOrderId,
          kycRequired,
          bookingStatus: payment.booking.status,
          completedAt: new Date(),
        },
        metadata: {
          gatewayResponse: updatedGatewayResponse,
          kycVerificationId: kycRequired
            ? payment.booking.kycVerificationId
            : undefined,
        },
        userId: payment.userId,
        bookingId: payment.bookingId,
        transactionId: gatewayPaymentId,
        amount: payment.amount,
        currency: payment.currency,
      });
    }

    const updatedPayment = await this.paymentRepository.findOne({
      where: { id: payment.id },
      relations: ['booking'],
    });

    // Add KYC properties to the response
    return {
      ...updatedPayment,
      kycRequired,
      kycVerificationUrl,
    } as PaymentEntity & { kycRequired?: boolean; kycVerificationUrl?: string };
  }

  /**
   * Handle KYC completion event to update booking status to CONFIRMED
   */
  async handleKycCompletion(
    userId: string,
    kycVerificationId: string,
  ): Promise<void> {
    // Find completed payments with PENDING_KYC bookings for this user
    const completedPayments = await this.paymentRepository.find({
      where: {
        userId,
        status: PaymentStatus.COMPLETED,
      },
      relations: ['booking'],
    });

    for (const payment of completedPayments) {
      if (
        payment.metadata?.kycRequired &&
        payment.booking?.status === BookingStatus.PENDING_KYC
      ) {
        // Update payment metadata with KYC completion
        payment.metadata = {
          ...payment.metadata,
          kycVerificationId,
          kycCompletedAt: new Date(),
        };

        await this.paymentRepository.save(payment);

        // Update booking status from PENDING_KYC to CONFIRMED
        if (payment.booking) {
          payment.booking.status = BookingStatus.CONFIRMED;
          payment.booking.kycStatus = 'completed';
          payment.booking.kycCompletedAt = new Date();
          payment.booking.kycVerificationId = kycVerificationId;
          await this.bookingRepository.save(payment.booking);

          // Emit event that KYC is completed and booking is now confirmed
          this.eventEmitter.emit('payment.kyc_completed', {
            paymentId: payment.paymentId,
            bookingId: payment.bookingId,
            userId,
            kycVerificationId,
            bookingStatus: BookingStatus.CONFIRMED,
          });

          // Emit booking confirmed event
          this.eventEmitter.emit('booking.confirmed', {
            bookingId: payment.bookingId,
            userId,
            paymentId: payment.paymentId,
            kycVerificationId,
          });
        }
      }
    }
  }

  /**
   * Get payment status with KYC information
   */
  async getPaymentWithKycStatus(paymentId: string): Promise<any> {
    const payment = await this.paymentRepository.findOne({
      where: { paymentId },
      relations: ['booking', 'user'],
    });

    if (!payment) {
      throw ErrorResponseUtil.notFound('Payment', paymentId);
    }

    const kycStatus = payment.metadata?.kycRequired
      ? {
          required: true,
          completed: !!payment.metadata?.kycVerificationId,
          verificationId: payment.metadata?.kycVerificationId,
          completedAt: payment.metadata?.kycCompletedAt,
        }
      : {
          required: false,
          completed: true,
        };

    return {
      ...payment,
      kycStatus,
      canProcess:
        !payment.metadata?.kycRequired || !!payment.metadata?.kycVerificationId,
    };
  }

  async failPayment(
    paymentId: string,
    failureReason: string,
    gatewayResponse?: any,
  ): Promise<PaymentEntity> {
    const failedGatewayResponse: GatewayResponse = gatewayResponse || {};

    const payment = await this.paymentRepository.findOne({
      where: { paymentId },
    });

    await this.paymentRepository.update(
      { paymentId },
      {
        status: PaymentStatus.FAILED,
        failedAt: new Date(),
        failureReason,
        gatewayResponse: failedGatewayResponse,
      },
    );

    // Store financial event for audit trail
    if (payment) {
      await this.financialEventSourcingService.storeEvent({
        aggregateId: paymentId,
        aggregateType: AggregateType.PAYMENT,
        eventType: FinancialEventType.PAYMENT_FAILED,
        eventData: {
          reason: failureReason,
          gatewayResponse: failedGatewayResponse,
          failedAt: new Date(),
        },
        metadata: {
          originalAmount: payment.amount,
          originalCurrency: payment.currency,
        },
        userId: payment.userId,
        bookingId: payment.bookingId,
        amount: payment.amount,
        currency: payment.currency,
      });
    }

    return this.paymentRepository.findOne({ where: { paymentId } });
  }

  async createRefund(
    createRefundDto: CreateRefundDto & { userId?: string },
  ): Promise<RefundEntity> {
    const {
      paymentId,
      amount,
      type,
      method,
      reason,
      adminNotes,
      metadata,
      userId,
    } = createRefundDto;

    const payment = await this.paymentRepository.findOne({
      where: { paymentId },
    });

    if (!payment) {
      throw ErrorResponseUtil.notFound('Payment', paymentId);
    }

    if (payment.status !== PaymentStatus.COMPLETED) {
      throw ErrorResponseUtil.badRequest(
        'Cannot refund incomplete payment',
        ErrorCodes.INVALID_STATUS,
      );
    }

    const refundId = this.generateRefundId();

    const refund = this.refundRepository.create({
      userId: userId || payment.userId,
      paymentId: payment.id,
      refundId,
      type,
      method: method || RefundMethod.ORIGINAL_SOURCE,
      amount,
      currency: payment.currency,
      reason,
      adminNotes,
      status: RefundStatus.PENDING,
      metadata,
    });

    const savedRefund = await this.refundRepository.save(refund);

    // Store financial event for audit trail
    await this.financialEventSourcingService.storeEvent({
      aggregateId: refundId,
      aggregateType: AggregateType.REFUND,
      eventType: FinancialEventType.REFUND_INITIATED,
      eventData: {
        paymentId: payment.paymentId,
        type,
        method: method || RefundMethod.ORIGINAL_SOURCE,
        reason,
        initiatedAt: new Date(),
      },
      metadata: {
        adminNotes,
        originalPaymentAmount: payment.amount,
      },
      userId: userId || payment.userId,
      bookingId: payment.bookingId,
      amount,
      currency: payment.currency,
    });

    return savedRefund;
  }

  async processRefund(
    refundId: string,
    userId?: string,
  ): Promise<RefundEntity> {
    const whereCondition: any = { refundId };
    if (userId) {
      whereCondition.userId = userId;
    }

    const refund = await this.refundRepository.findOne({
      where: whereCondition,
      relations: ['payment'],
    });

    if (!refund) {
      throw ErrorResponseUtil.notFound('Refund', refundId);
    }

    if (refund.status !== RefundStatus.PENDING) {
      throw ErrorResponseUtil.badRequest(
        'Refund is not in pending status',
        ErrorCodes.INVALID_STATUS,
      );
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Process refund based on method
      if (refund.method === RefundMethod.WALLET) {
        // Add refund to user's wallet
        const userWallet = await this.walletService.getWalletByPartnerId(
          refund.userId,
        );
        await this.walletService.creditWallet(
          userWallet.id,
          {
            amount: refund.amount,
            type: WalletTransactionType.REFUND,
            description: `Refund for payment ${refund.payment.paymentId}`,
            referenceId: refund.refundId,
            referenceType: 'refund',
            metadata: refund.metadata,
          },
          refund.userId,
        );

        // Mark refund as completed
        await queryRunner.manager.update(
          RefundEntity,
          { refundId },
          {
            status: RefundStatus.COMPLETED,
            processedAt: new Date(),
            completedAt: new Date(),
          },
        );

        // Store financial event for audit trail
        await this.financialEventSourcingService.storeEvent({
          aggregateId: refundId,
          aggregateType: AggregateType.REFUND,
          eventType: FinancialEventType.REFUND_COMPLETED,
          eventData: {
            paymentId: refund.payment.paymentId,
            method: refund.method,
            reason: refund.reason,
            completedAt: new Date(),
          },
          metadata: {
            walletCredited: true,
            originalPaymentAmount: refund.payment.amount,
          },
          userId: refund.userId,
          bookingId: refund.payment.bookingId,
          transactionId: refundId,
          amount: refund.amount,
          currency: refund.currency,
        });
      } else {
        // For original source refunds, mark as processing
        // In a real implementation, you would call the payment gateway's refund API
        await queryRunner.manager.update(
          RefundEntity,
          { refundId },
          {
            status: RefundStatus.PROCESSING,
            processedAt: new Date(),
          },
        );
      }

      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }

    return this.refundRepository.findOne({ where: { refundId } });
  }

  async getPaymentById(paymentId: string): Promise<PaymentEntity> {
    return this.paymentRepository.findOne({
      where: { paymentId },
      relations: ['user', 'booking', 'refunds'],
    });
  }

  async getPaymentsByUser(
    userId: string,
    limit: number = 20,
    offset: number = 0,
  ): Promise<PaymentEntity[]> {
    return this.paymentRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: limit,
      skip: offset,
      relations: ['refunds'],
    });
  }

  async getRefundById(refundId: string): Promise<RefundEntity> {
    return this.refundRepository.findOne({
      where: { refundId },
      relations: ['payment', 'user'],
    });
  }

  async getRefundsByUser(
    userId: string,
    limit: number = 20,
    offset: number = 0,
  ): Promise<RefundEntity[]> {
    return this.refundRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: limit,
      skip: offset,
      relations: ['payment'],
    });
  }

  async updatePayment(
    paymentId: string,
    updateData: any,
    userId: string,
  ): Promise<PaymentEntity> {
    const payment = await this.paymentRepository.findOne({
      where: { paymentId, userId },
    });

    if (!payment) {
      throw ErrorResponseUtil.notFound('Payment', paymentId);
    }

    await this.paymentRepository.update({ paymentId }, updateData);
    return this.paymentRepository.findOne({ where: { paymentId } });
  }

  async cancelPayment(
    paymentId: string,
    userId: string,
  ): Promise<PaymentEntity> {
    const payment = await this.paymentRepository.findOne({
      where: { paymentId, userId },
    });

    if (!payment) {
      throw ErrorResponseUtil.notFound('Payment', paymentId);
    }

    if (payment.status !== PaymentStatus.PENDING) {
      throw ErrorResponseUtil.badRequest(
        'Cannot cancel non-pending payment',
        ErrorCodes.INVALID_STATUS,
      );
    }

    await this.paymentRepository.update(
      { paymentId },
      { status: PaymentStatus.CANCELLED, cancelledAt: new Date() },
    );

    return this.paymentRepository.findOne({ where: { paymentId } });
  }

  async updateRefund(
    refundId: string,
    updateData: any,
    userId: string,
  ): Promise<RefundEntity> {
    const refund = await this.refundRepository.findOne({
      where: { refundId, userId },
    });

    if (!refund) {
      throw ErrorResponseUtil.notFound('Refund', refundId);
    }

    await this.refundRepository.update({ refundId }, updateData);
    return this.refundRepository.findOne({ where: { refundId } });
  }

  async createPaymentIntent(
    bookingId: string,
    amount: number,
    userId: string,
  ): Promise<string> {
    // This is a placeholder implementation for creating payment intent
    // In a real implementation, you would create a payment intent with the gateway
    const paymentIntentId = this.idGeneratorService.generateId(
      EntityType.PAYMENT_INTENT,
    );
    return paymentIntentId;
  }

  async findAllPayments(
    filters: any,
  ): Promise<{ data: PaymentEntity[]; total: number }> {
    const {
      page = 1,
      limit = 10,
      status,
      paymentMethod,
      bookingId,
      userId,
      startDate,
      endDate,
      minAmount,
      maxAmount,
    } = filters;

    const queryBuilder = this.paymentRepository
      .createQueryBuilder('payment')
      .leftJoinAndSelect('payment.user', 'user')
      .leftJoinAndSelect('payment.booking', 'booking')
      .leftJoinAndSelect('payment.refunds', 'refunds');

    if (userId) {
      queryBuilder.andWhere('payment.userId = :userId', { userId });
    }

    if (status) {
      queryBuilder.andWhere('payment.status = :status', { status });
    }

    if (paymentMethod) {
      queryBuilder.andWhere('payment.method = :paymentMethod', {
        paymentMethod,
      });
    }

    if (bookingId) {
      queryBuilder.andWhere('payment.bookingId = :bookingId', { bookingId });
    }

    if (startDate) {
      queryBuilder.andWhere('payment.createdAt >= :startDate', { startDate });
    }

    if (endDate) {
      queryBuilder.andWhere('payment.createdAt <= :endDate', { endDate });
    }

    if (minAmount) {
      queryBuilder.andWhere('payment.amount >= :minAmount', { minAmount });
    }

    if (maxAmount) {
      queryBuilder.andWhere('payment.amount <= :maxAmount', { maxAmount });
    }

    const [data, total] = await queryBuilder
      .orderBy('payment.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { data, total };
  }

  async findPaymentsByUserId(
    userId: string,
    options: { page: number; limit: number },
  ): Promise<{ data: PaymentEntity[]; total: number }> {
    const { page, limit } = options;
    const [data, total] = await this.paymentRepository.findAndCount({
      where: { userId },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
      relations: ['refunds', 'booking'],
    });

    return { data, total };
  }

  async findOnePayment(id: string, userId: string): Promise<PaymentEntity> {
    const payment = await this.paymentRepository.findOne({
      where: { id, userId },
      relations: ['user', 'booking', 'refunds'],
    });

    if (!payment) {
      throw ErrorResponseUtil.notFound('Payment', id);
    }

    return payment;
  }

  async findAllRefunds(
    filters: any,
  ): Promise<{ data: RefundEntity[]; total: number }> {
    const {
      page = 1,
      limit = 10,
      status,
      paymentId,
      userId,
      startDate,
      endDate,
    } = filters;

    const queryBuilder = this.refundRepository
      .createQueryBuilder('refund')
      .leftJoinAndSelect('refund.payment', 'payment')
      .leftJoinAndSelect('refund.user', 'user');

    if (userId) {
      queryBuilder.andWhere('refund.userId = :userId', { userId });
    }

    if (status) {
      queryBuilder.andWhere('refund.status = :status', { status });
    }

    if (paymentId) {
      queryBuilder.andWhere('refund.paymentId = :paymentId', { paymentId });
    }

    if (startDate) {
      queryBuilder.andWhere('refund.createdAt >= :startDate', { startDate });
    }

    if (endDate) {
      queryBuilder.andWhere('refund.createdAt <= :endDate', { endDate });
    }

    const [data, total] = await queryBuilder
      .orderBy('refund.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { data, total };
  }

  async findRefundsByUserId(
    userId: string,
    options: { page: number; limit: number },
  ): Promise<{ data: RefundEntity[]; total: number }> {
    const { page, limit } = options;
    const [data, total] = await this.refundRepository.findAndCount({
      where: { userId },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
      relations: ['payment'],
    });

    return { data, total };
  }

  async findOneRefund(id: string, userId: string): Promise<RefundEntity> {
    const refund = await this.refundRepository.findOne({
      where: { id, userId },
      relations: ['payment', 'user'],
    });

    if (!refund) {
      throw ErrorResponseUtil.notFound('Refund', id);
    }

    return refund;
  }

  async getPaymentStats(
    userId: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<any> {
    const queryBuilder = this.paymentRepository
      .createQueryBuilder('payment')
      .where('payment.userId = :userId', { userId });

    if (startDate) {
      queryBuilder.andWhere('payment.createdAt >= :startDate', { startDate });
    }

    if (endDate) {
      queryBuilder.andWhere('payment.createdAt <= :endDate', { endDate });
    }

    const totalPayments = await queryBuilder.getCount();
    const totalAmount = await queryBuilder
      .select('SUM(payment.amount)', 'total')
      .getRawOne();

    const successfulPayments = await queryBuilder
      .andWhere('payment.status = :status', { status: PaymentStatus.COMPLETED })
      .getCount();

    const pendingPayments = await queryBuilder
      .andWhere('payment.status = :status', { status: PaymentStatus.PENDING })
      .getCount();

    const failedPayments = await queryBuilder
      .andWhere('payment.status = :status', { status: PaymentStatus.FAILED })
      .getCount();

    return {
      totalPayments,
      totalAmount: parseFloat(totalAmount?.total || '0'),
      successfulPayments,
      pendingPayments,
      failedPayments,
    };
  }

  private generatePaymentId(): string {
    return this.idGeneratorService.generateId(EntityType.PAYMENT);
  }

  private generateRefundId(): string {
    return this.idGeneratorService.generateId(EntityType.REFUND);
  }

  // Webhook handlers for payment gateways
  async handleStripeWebhook(event: any): Promise<void> {
    switch (event.type) {
      case 'payment_intent.succeeded':
        await this.handleStripePaymentSuccess(event.data.object);
        break;
      case 'payment_intent.payment_failed':
        await this.handleStripePaymentFailure(event.data.object);
        break;
      default:
        console.log(`Unhandled Stripe event type: ${event.type}`);
    }
  }

  private async handleStripePaymentSuccess(paymentIntent: any): Promise<void> {
    const paymentId = paymentIntent.metadata?.paymentId;
    if (paymentId) {
      await this.processPaymentDto({
        paymentId,
        gatewayPaymentId: paymentIntent.id,
        gatewayResponse: paymentIntent,
      });
    }
  }

  private async handleStripePaymentFailure(paymentIntent: any): Promise<void> {
    const paymentId = paymentIntent.metadata?.paymentId;
    if (paymentId) {
      await this.failPayment(
        paymentId,
        paymentIntent.last_payment_error?.message || 'Payment failed',
        paymentIntent,
      );
    }
  }

  async handleRazorpayWebhook(event: any): Promise<void> {
    switch (event.event) {
      case 'payment.captured':
        await this.handleRazorpayPaymentSuccess(event.payload.payment.entity);
        break;
      case 'payment.failed':
        await this.handleRazorpayPaymentFailure(event.payload.payment.entity);
        break;
      default:
        console.log(`Unhandled Razorpay event type: ${event.event}`);
    }
  }

  private async handleRazorpayPaymentSuccess(payment: any): Promise<void> {
    // Find payment by gateway order ID
    const existingPayment = await this.paymentRepository.findOne({
      where: { gatewayOrderId: payment.order_id },
    });

    if (existingPayment) {
      await this.processPaymentDto({
        paymentId: existingPayment.paymentId,
        gatewayPaymentId: payment.id,
        gatewayResponse: payment,
      });
    }
  }

  private async handleRazorpayPaymentFailure(payment: any): Promise<void> {
    const existingPayment = await this.paymentRepository.findOne({
      where: { gatewayOrderId: payment.order_id },
    });

    if (existingPayment) {
      await this.failPayment(
        existingPayment.paymentId,
        payment.error_description || 'Payment failed',
        payment,
      );
    }
  }
}
