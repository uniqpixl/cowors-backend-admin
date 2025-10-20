import { NotificationService } from '@/api/notification/notification.service';
import { BookingStatus, PaymentStatus } from '@/common/enums/booking.enum';
import {
  PaymentCompletedEvent,
  PaymentFailedEvent,
  PaymentInitiatedEvent,
  PaymentKycCompletedEvent,
} from '@/common/events/domain-events/payment.events';
import { BookingEntity } from '@/database/entities/booking.entity';
import { KycVerificationEntity } from '@/database/entities/kyc-verification.entity';
import { PaymentEntity } from '@/database/entities/payment.entity';
import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaymentService } from '../payment.service';

@Injectable()
export class PaymentEventHandler {
  private readonly logger = new Logger(PaymentEventHandler.name);

  constructor(
    @InjectRepository(PaymentEntity)
    private paymentRepository: Repository<PaymentEntity>,
    @InjectRepository(BookingEntity)
    private bookingRepository: Repository<BookingEntity>,
    @InjectRepository(KycVerificationEntity)
    private kycVerificationRepository: Repository<KycVerificationEntity>,
    private paymentService: PaymentService,
    private notificationService: NotificationService,
  ) {}

  @OnEvent('payment.initiated')
  async handlePaymentInitiated(event: PaymentInitiatedEvent) {
    this.logger.log(
      `Payment initiated: ${event.paymentId}, KYC Required: ${event.kycRequired}`,
    );

    try {
      // Send payment initiated notification
      await this.notificationService.sendPaymentInitiated(event.userId, {
        paymentId: event.paymentId,
        bookingId: event.bookingId,
        amount: event.amount,
        currency: event.currency,
        kycRequired: event.kycRequired,
      });

      // If KYC is required, send KYC notification
      if (event.kycRequired) {
        await this.notificationService.sendKycRequired(event.userId, {
          paymentId: event.paymentId,
          bookingId: event.bookingId,
          amount: event.amount,
        });
      }
    } catch (error) {
      this.logger.error(
        `Failed to handle payment initiated event: ${error.message}`,
        error.stack,
      );
    }
  }

  @OnEvent('payment.completed')
  async handlePaymentCompleted(event: PaymentCompletedEvent) {
    this.logger.log(
      `Payment completed: ${event.paymentId}, KYC Completed: ${event.kycCompleted}`,
    );

    try {
      // Send payment success notification
      await this.notificationService.sendPaymentConfirmation(event.userId, {
        paymentId: event.paymentId,
        bookingId: event.bookingId,
        amount: event.amount,
        currency: event.currency,
        bookingStatus: event.bookingStatus,
      });

      // Trigger commission calculation if booking is confirmed
      if (event.bookingStatus === 'CONFIRMED') {
        // Commission calculation will be handled by the commission event handler
        // when booking.completed event is emitted
        this.logger.log(
          `Payment confirmed for booking ${event.bookingId}, commission calculation will be triggered on booking completion`,
        );
      }
    } catch (error) {
      this.logger.error(
        `Failed to handle payment completed event: ${error.message}`,
        error.stack,
      );
    }
  }

  @OnEvent('payment.failed')
  async handlePaymentFailed(event: PaymentFailedEvent) {
    this.logger.log(
      `Payment failed: ${event.paymentId}, Reason: ${event.failureReason}`,
    );

    try {
      // Send payment failure notification
      await this.notificationService.sendPaymentFailed(event.userId, {
        paymentId: event.paymentId,
        bookingId: event.bookingId,
        amount: event.amount,
        currency: event.currency,
        failureReason: event.failureReason,
        errorCode: event.errorCode,
      });

      // Update booking status back to pending if needed
      const booking = await this.bookingRepository.findOne({
        where: { id: event.bookingId },
      });

      if (booking && booking.status === BookingStatus.PENDING_KYC) {
        booking.status = BookingStatus.PENDING;
        await this.bookingRepository.save(booking);
      }
    } catch (error) {
      this.logger.error(
        `Failed to handle payment failed event: ${error.message}`,
        error.stack,
      );
    }
  }

  @OnEvent('payment.kyc_completed')
  async handlePaymentKycCompleted(event: PaymentKycCompletedEvent) {
    this.logger.log(
      `Payment KYC completed: ${event.paymentId}, KYC ID: ${event.kycVerificationId}`,
    );

    try {
      // Handle KYC completion for payment
      await this.paymentService.handleKycCompletion(
        event.userId,
        event.kycVerificationId,
      );

      // Send KYC completion notification
      await this.notificationService.sendKycCompleted(event.userId, {
        paymentId: event.paymentId,
        bookingId: event.bookingId,
        kycVerificationId: event.kycVerificationId,
      });
    } catch (error) {
      this.logger.error(
        `Failed to handle payment KYC completed event: ${error.message}`,
        error.stack,
      );
    }
  }

  @OnEvent('kyc.completed')
  async handleKycCompleted(event: any) {
    this.logger.log(
      `KYC completed for user: ${event.userId}, KYC ID: ${event.verificationId}`,
    );

    try {
      // Find completed payments with PENDING_KYC bookings for this user
      const completedPayments = await this.paymentRepository.find({
        where: {
          userId: event.userId,
          status: PaymentStatus.COMPLETED,
        },
        relations: ['booking'],
      });

      for (const payment of completedPayments) {
        if (
          payment.metadata?.kycRequired &&
          payment.booking?.status === BookingStatus.PENDING_KYC &&
          !payment.metadata?.kycVerificationId
        ) {
          // Handle KYC completion for this payment
          await this.paymentService.handleKycCompletion(
            event.userId,
            event.verificationId,
          );
        }
      }
    } catch (error) {
      this.logger.error(
        `Failed to handle KYC completed event: ${error.message}`,
        error.stack,
      );
    }
  }
}
