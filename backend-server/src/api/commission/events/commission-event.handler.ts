import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { JobsService } from '@/api/jobs/jobs.service';
import { NotificationService } from '@/api/notification/notification.service';
import { WalletService } from '@/api/wallet/wallet.service';
import {
  NotificationPriority,
  NotificationType,
} from '@/common/enums/notification.enum';
import { EventRetryService } from '@/common/events/retry/event-retry.service';
import { NotificationCategory } from '@/database/entities/notification.entity';
import { CommissionTrackingService } from '../commission-tracking.service';
import { CommissionService } from '../commission.service';
import { TransactionType } from '../dto/commission-tracking.dto';

import {
  CommissionApprovedEvent,
  CommissionCalculatedEvent,
  CommissionCalculationRequestedEvent,
  CommissionPayoutCompletedEvent,
  CommissionPayoutFailedEvent,
  CommissionPayoutInitiatedEvent,
} from '@/common/events/domain-events/commission.events';

import { BookingCompletedEvent } from '@/common/events/domain-events/booking.events';
import { PaymentCompletedEvent } from '@/common/events/domain-events/payment.events';

import { BookingEntity } from '@/database/entities/booking.entity';
import { CommissionCalculationEntity } from '../entities/commission-tracking.entity';

import {
  CriticalEventHandler,
  NonCriticalEventHandler,
} from '@/common/events/decorators/event-error-handler.decorator';

@Injectable()
export class CommissionEventHandler {
  private readonly logger = new Logger(CommissionEventHandler.name);

  constructor(
    @InjectRepository(CommissionCalculationEntity)
    private readonly calculationRepository: Repository<CommissionCalculationEntity>,
    @InjectRepository(BookingEntity)
    private readonly bookingRepository: Repository<BookingEntity>,
    private readonly commissionService: CommissionService,
    private readonly commissionTrackingService: CommissionTrackingService,
    private readonly walletService: WalletService,
    private readonly notificationService: NotificationService,
    private readonly jobsService: JobsService,
    private readonly eventEmitter: EventEmitter2,
    private readonly eventRetryService: EventRetryService,
  ) {}

  @OnEvent('booking.completed')
  @CriticalEventHandler({
    maxRetries: 3,
    baseDelay: 1000,
  })
  async handleBookingCompleted(event: BookingCompletedEvent) {
    this.logger.log(
      `Triggering commission calculation for completed booking: ${event.bookingId}`,
    );

    try {
      // Emit commission calculation requested event
      const commissionEvent = new CommissionCalculationRequestedEvent(
        event.bookingId,
        event.userId,
        event.partnerId,
        event.totalAmount,
        'BOOKING_COMPLETION',
        event.spaceId,
        {
          duration: event.duration,
          completedAt: event.completedAt,
        },
      );

      this.eventEmitter.emit(
        'commission.calculation.requested',
        commissionEvent,
      );
    } catch (error) {
      this.logger.error(
        `Failed to trigger commission calculation: ${error.message}`,
        error,
      );
    }
  }

  @OnEvent('payment.completed')
  async handlePaymentCompleted(event: PaymentCompletedEvent) {
    this.logger.log(
      `Payment completed, checking for commission calculation: ${event.paymentId}`,
    );

    try {
      // Only trigger commission calculation if booking is confirmed
      if (event.bookingStatus === 'CONFIRMED') {
        // Queue commission calculation as background job
        await this.jobsService.processCommissionCalculation({
          bookingId: event.bookingId as any,
          userId: event.userId as any,
          partnerId: 'unknown' as any, // Will be resolved in the job processor
          totalAmount: event.amount,
          completedAt: new Date(),
        });
      }
    } catch (error) {
      this.logger.error(
        `Failed to handle payment completion for commission: ${error.message}`,
        error,
      );
    }
  }

  @OnEvent('commission.calculation.requested')
  async handleCommissionCalculationRequested(
    event: CommissionCalculationRequestedEvent,
  ) {
    this.logger.log(
      `Processing commission calculation request for booking: ${event.bookingId}`,
    );

    try {
      // Get booking details to determine partner
      const booking = await this.bookingRepository.findOne({
        where: { id: event.bookingId },
        relations: [
          'spaceOption',
          'spaceOption.space',
          'spaceOption.space.listing',
        ],
      });

      if (!booking) {
        throw new Error(`Booking ${event.bookingId} not found`);
      }

      const partnerId =
        booking.spaceOption?.space?.listing?.partner_id || event.partnerId;

      // Create commission calculation
      const calculation =
        await this.commissionTrackingService.createCommissionCalculation(
          {
            partnerId,
            transactionId: event.bookingId,
            transactionAmount: event.totalAmount,
            transactionType: event.transactionType as TransactionType,
            notes: `Automatic commission calculation for ${event.transactionType}`,
          },
          'system',
        );

      // Emit commission calculated event
      const calculatedEvent = new CommissionCalculatedEvent(
        calculation.id,
        event.bookingId,
        partnerId,
        event.totalAmount,
        calculation.commissionAmount,
        calculation.rateApplied,
        calculation.ruleId,
        {
          calculationMethod: 'automatic',
          triggeredBy: event.eventType,
        },
      );

      this.eventEmitter.emit('commission.calculated', calculatedEvent);
    } catch (error) {
      this.logger.error(
        `Failed to process commission calculation request: ${error.message}`,
        error,
      );
    }
  }

  @OnEvent('commission.calculated')
  async handleCommissionCalculated(event: CommissionCalculatedEvent) {
    this.logger.log(
      `Commission calculated: ${event.calculationId}, Amount: ₹${event.commissionAmount}`,
    );

    try {
      // Check if auto-approval is enabled
      const calculation = await this.calculationRepository.findOne({
        where: { id: event.calculationId },
        relations: ['rule'],
      });

      if (!calculation) {
        throw new Error(
          `Commission calculation ${event.calculationId} not found`,
        );
      }

      // Auto-approve if conditions are met
      if (this.shouldAutoApprove(calculation)) {
        await this.commissionTrackingService.approveCommissionCalculation(
          event.calculationId,
          'system',
        );

        // Emit approval event
        const approvedEvent = new CommissionApprovedEvent(
          event.calculationId,
          event.partnerId,
          event.commissionAmount,
          'system',
          new Date(),
          {
            autoApproved: true,
            reason: 'Auto-approved based on system rules',
          },
        );

        this.eventEmitter.emit('commission.approved', approvedEvent);
      } else {
        // Send notification for manual approval
        await this.notificationService.createNotification({
          userId: 'admin', // Send to admin for approval
          type: NotificationType.SYSTEM_UPDATE,
          category: NotificationCategory.SYSTEM,
          priority: NotificationPriority.MEDIUM,
          title: 'Commission Calculation Requires Approval',
          message: `Commission calculation of ₹${event.commissionAmount} for partner ${event.partnerId} requires manual approval.`,
          referenceId: event.calculationId,
          referenceType: 'commission_calculation',
          data: {
            variables: {
              calculationId: event.calculationId,
              partnerId: event.partnerId,
              amount: event.commissionAmount,
            },
          },
        });
      }
    } catch (error) {
      this.logger.error(
        `Failed to handle commission calculated event: ${error.message}`,
        error,
      );
    }
  }

  @OnEvent('commission.approved')
  async handleCommissionApproved(event: CommissionApprovedEvent) {
    this.logger.log(
      `Commission approved: ${event.calculationId}, Amount: ₹${event.commissionAmount}`,
    );

    try {
      // Create partner commission record
      await this.commissionTrackingService.createPartnerCommission(
        {
          partnerId: event.partnerId,
          calculationId: event.calculationId,
          amount: event.commissionAmount,
          description: `Approved commission for calculation ${event.calculationId}`,
          dueDate: new Date(
            Date.now() + 30 * 24 * 60 * 60 * 1000,
          ).toISOString(), // 30 days from now
        },
        event.approvedBy,
      );

      // Send approval notification to partner
      await this.notificationService.createNotification({
        userId: event.partnerId,
        type: NotificationType.PAYMENT_SUCCESS,
        category: NotificationCategory.PAYMENT,
        priority: NotificationPriority.HIGH,
        title: 'Commission Approved',
        message: `Your commission of ₹${event.commissionAmount} has been approved and will be paid out soon.`,
        referenceId: event.calculationId,
        referenceType: 'commission_calculation',
        data: {
          variables: {
            calculationId: event.calculationId,
            amount: event.commissionAmount,
            approvedBy: event.approvedBy,
            approvedAt: event.approvedAt?.toISOString(),
          },
        },
      });
    } catch (error) {
      this.logger.error(
        `Failed to handle commission approved event: ${error.message}`,
        error,
      );
    }
  }

  @OnEvent('commission.payout.initiated')
  async handleCommissionPayoutInitiated(event: CommissionPayoutInitiatedEvent) {
    this.logger.log(
      `Commission payout initiated: ${event.payoutId}, Amount: ₹${event.totalAmount}`,
    );

    try {
      // Send payout initiated notification
      await this.notificationService.createNotification({
        userId: event.partnerId,
        type: NotificationType.PAYMENT_SUCCESS,
        category: NotificationCategory.PAYMENT,
        priority: NotificationPriority.HIGH,
        title: 'Payout Initiated',
        message: `Your payout of ₹${event.totalAmount} has been initiated and will be processed soon.`,
        referenceId: event.payoutId as any,
        referenceType: 'commission_payout',
        data: {
          variables: {
            payoutId: event.payoutId,
            amount: event.totalAmount,
            paymentMethod: event.paymentMethod,
            scheduledDate: event.scheduledDate?.toISOString(),
          },
        },
      });

      // Queue wallet operation for background processing
      await this.jobsService.processWalletOperation({
        userId: event.partnerId as any,
        amount: event.totalAmount,
        type: 'CREDIT',
        description: `Commission payout ${event.payoutId}`,
        referenceId: event.payoutId as any,
        referenceType: 'commission_payout',
      });
    } catch (error) {
      this.logger.error(
        `Failed to handle commission payout initiated event: ${error.message}`,
        error,
      );
    }
  }

  @OnEvent('commission.payout.completed')
  async handleCommissionPayoutCompleted(event: CommissionPayoutCompletedEvent) {
    this.logger.log(
      `Commission payout completed: ${event.payoutId}, Amount: ₹${event.totalAmount}`,
    );

    try {
      // Send payout completion notification
      await this.notificationService.createNotification({
        userId: event.partnerId,
        type: NotificationType.PAYMENT_SUCCESS,
        category: NotificationCategory.PAYMENT,
        priority: NotificationPriority.HIGH,
        title: 'Payout Completed',
        message: `Your payout of ₹${event.totalAmount} has been completed successfully.`,
        referenceId: event.payoutId,
        referenceType: 'commission_payout',
        data: {
          variables: {
            payoutId: event.payoutId,
            amount: event.totalAmount,
            paymentReference: event.paymentReference,
            completedAt: event.completedAt?.toISOString(),
            processedBy: event.processedBy,
          },
        },
      });

      // Update partner wallet balance
      await this.walletService.addBalance(
        event.partnerId,
        event.totalAmount,
        'COMMISSION_PAYOUT',
        `Commission payout completed: ${event.payoutId}`,
        event.payoutId,
      );
    } catch (error) {
      this.logger.error(
        `Failed to handle commission payout completed event: ${error.message}`,
        error,
      );
    }
  }

  @OnEvent('commission.payout.failed')
  async handleCommissionPayoutFailed(event: CommissionPayoutFailedEvent) {
    this.logger.log(
      `Commission payout failed: ${event.payoutId}, Reason: ${event.failureReason}`,
    );

    try {
      // Send payout failure notification
      await this.notificationService.createNotification({
        userId: event.partnerId,
        type: NotificationType.PAYMENT_FAILED,
        category: NotificationCategory.PAYMENT,
        priority: NotificationPriority.HIGH,
        title: 'Payout Failed',
        message: `Your payout of ₹${event.totalAmount} has failed. Reason: ${event.failureReason}`,
        referenceId: event.payoutId,
        referenceType: 'commission_payout',
        data: {
          variables: {
            payoutId: event.payoutId,
            amount: event.totalAmount,
            failureReason: event.failureReason,
            errorCode: event.errorCode,
          },
        },
      });

      // Send alert to admin
      await this.notificationService.createNotification({
        userId: 'admin',
        type: NotificationType.SYSTEM_UPDATE,
        category: NotificationCategory.SYSTEM,
        priority: NotificationPriority.HIGH,
        title: 'Commission Payout Failed',
        message: `Commission payout ${event.payoutId} for partner ${event.partnerId} failed: ${event.failureReason}`,
        referenceId: event.payoutId,
        referenceType: 'commission_payout',
        data: {
          variables: {
            payoutId: event.payoutId,
            partnerId: event.partnerId,
            amount: event.totalAmount,
            failureReason: event.failureReason,
            errorCode: event.errorCode,
          },
        },
      });
    } catch (error) {
      this.logger.error(
        `Failed to handle commission payout failed event: ${error.message}`,
        error,
      );
    }
  }

  private shouldAutoApprove(calculation: CommissionCalculationEntity): boolean {
    // Auto-approve if amount is below threshold and rule allows it
    const autoApprovalThreshold = 10000; // ₹10,000
    return calculation.commissionAmount <= autoApprovalThreshold;
  }
}
