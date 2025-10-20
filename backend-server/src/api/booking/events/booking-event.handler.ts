import { JobsService } from '@/api/jobs/jobs.service';
import { NotificationService } from '@/api/notification/notification.service';
import { WebSocketService } from '@/api/notification/services/websocket.service';
import { RefundPolicyService } from '@/api/refund-policy/refund-policy.service';
import { WalletService } from '@/api/wallet/wallet.service';
import { BookingStatus } from '@/common/enums/booking.enum';
import {
  NotificationPriority,
  NotificationType,
} from '@/common/enums/notification.enum';
import {
  BookingCancelledEvent,
  BookingCompletedEvent,
  BookingConfirmedEvent,
  BookingCreatedEvent,
  BookingModifiedEvent,
} from '@/common/events/domain-events/booking.events';
import {
  PaymentCompletedEvent,
  PaymentKycCompletedEvent,
} from '@/common/events/domain-events/payment.events';
import { BookingEntity } from '@/database/entities/booking.entity';
import { NotificationCategory } from '@/database/entities/notification.entity';
import { PaymentEntity } from '@/database/entities/payment.entity';
import { WalletTransactionEntity } from '@/database/entities/wallet-transaction.entity';
import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class BookingEventHandler {
  private readonly logger = new Logger(BookingEventHandler.name);

  constructor(
    @InjectRepository(BookingEntity)
    private bookingRepository: Repository<BookingEntity>,
    @InjectRepository(PaymentEntity)
    private paymentRepository: Repository<PaymentEntity>,
    @InjectRepository(WalletTransactionEntity)
    private walletTransactionRepository: Repository<WalletTransactionEntity>,
    private notificationService: NotificationService,
    private walletService: WalletService,
    private jobsService: JobsService,
    private refundPolicyService: RefundPolicyService,
    private webSocketService: WebSocketService,
  ) {}

  @OnEvent('booking.created')
  async handleBookingCreated(event: BookingCreatedEvent) {
    this.logger.log(`Booking created: ${event.bookingId}`);

    try {
      // Send booking confirmation notification
      await this.notificationService.sendBookingConfirmation(event.userId, {
        bookingId: event.bookingId,
        startDateTime: event.startDate,
        endDateTime: event.endDate,
        totalAmount: event.totalAmount,
      });

      // Send real-time booking update via WebSocket
      await this.webSocketService.sendBookingUpdate(event.userId, {
        bookingId: event.bookingId,
        status: 'PENDING',
        startDateTime: event.startDate,
        endDateTime: event.endDate,
        totalAmount: event.totalAmount,
        message: `New booking created`,
        timestamp: new Date(),
      });

      // Notify partner about new booking
      if (event.partnerId) {
        await this.webSocketService.sendNewBookingAlert(event.partnerId, {
          bookingId: event.bookingId,
          customerName: 'Customer',
          checkIn: event.startDate,
          checkOut: event.endDate,
          amount: event.totalAmount,
        });
      }

      this.logger.log(
        `Booking confirmation notification sent for booking: ${event.bookingId}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to send booking confirmation notification: ${error.message}`,
        error,
      );
    }
  }

  @OnEvent('booking.confirmed')
  async handleBookingConfirmed(event: BookingConfirmedEvent) {
    this.logger.log(`Booking confirmed: ${event.bookingId}`);

    try {
      // Update booking status in database
      await this.bookingRepository.update(
        { id: event.bookingId },
        {
          status: BookingStatus.CONFIRMED,
          confirmedAt: new Date(),
        },
      );

      // Send confirmation notification to user
      await this.notificationService.createNotification({
        userId: event.userId,
        type: NotificationType.SYSTEM_UPDATE,
        category: NotificationCategory.BOOKING,
        priority: NotificationPriority.HIGH,
        title: 'Booking Confirmed',
        message: `Your booking has been confirmed by the partner.`,
        referenceId: event.bookingId,
        referenceType: 'booking',
        data: {
          templateId: 'booking-confirmed',
          variables: {
            bookingId: event.bookingId,
          },
        },
      });

      // Send real-time booking update via WebSocket
      await this.webSocketService.sendBookingUpdate(event.userId, {
        bookingId: event.bookingId,
        status: 'CONFIRMED',
        message: `Your booking has been confirmed`,
        timestamp: new Date(),
      });

      this.logger.log(
        `Booking confirmed notification sent for booking: ${event.bookingId}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to handle booking confirmation: ${error.message}`,
        error,
      );
    }
  }

  @OnEvent('booking.completed')
  async handleBookingCompleted(event: BookingCompletedEvent) {
    this.logger.log(`Booking completed: ${event.bookingId}`);

    try {
      // Update booking status
      await this.bookingRepository.update(
        { id: event.bookingId },
        {
          status: BookingStatus.COMPLETED,
          checkedOutAt: new Date(),
        },
      );

      // Queue commission calculation and wallet operations for background processing
      await this.jobsService.processCommissionCalculation({
        bookingId: event.bookingId as any,
        userId: event.userId as any,
        partnerId: event.partnerId as any,
        totalAmount: event.totalAmount,
        completedAt: new Date(),
      });

      // Send completion notification
      await this.notificationService.createNotification({
        userId: event.userId,
        type: NotificationType.SYSTEM_UPDATE,
        category: NotificationCategory.BOOKING,
        priority: NotificationPriority.MEDIUM,
        title: 'Booking Completed',
        message: `Your booking has been completed successfully.`,
        referenceId: event.bookingId,
        referenceType: 'booking',
        data: {
          templateId: 'booking-completed',
          variables: {
            bookingId: event.bookingId,
            totalAmount: event.totalAmount,
          },
        },
      });

      // Send real-time booking update via WebSocket
      await this.webSocketService.sendBookingUpdate(event.userId, {
        bookingId: event.bookingId,
        status: 'COMPLETED',
        totalAmount: event.totalAmount,
        message: `Your booking has been completed`,
        timestamp: new Date(),
      });

      this.logger.log(
        `Booking completion processed for booking: ${event.bookingId}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to handle booking completion: ${error.message}`,
        error,
      );
    }
  }

  @OnEvent('booking.cancelled')
  async handleBookingCancelled(event: BookingCancelledEvent) {
    this.logger.log(`Booking cancelled: ${event.bookingId}`);

    try {
      // Update booking status
      await this.bookingRepository.update(
        { id: event.bookingId },
        {
          status: BookingStatus.CANCELLED,
          cancelledAt: new Date(),
          cancellationReason: event.cancellationReason,
        },
      );

      // Queue refund processing if applicable
      if (event.refundAmount && event.refundAmount > 0) {
        await this.jobsService.processRefund({
          bookingId: event.bookingId as any,
          userId: event.userId as any,
          amount: event.refundAmount,
          reason: event.cancellationReason,
        });
      }

      // Send cancellation notification
      const message =
        event.refundAmount > 0
          ? `Your booking has been cancelled. A refund of ₹${event.refundAmount} will be processed.`
          : `Your booking has been cancelled.`;

      await this.notificationService.createNotification({
        userId: event.userId,
        type: NotificationType.SYSTEM_UPDATE,
        category: NotificationCategory.BOOKING,
        priority: NotificationPriority.HIGH,
        title: 'Booking Cancelled',
        message,
        referenceId: event.bookingId,
        referenceType: 'booking',
        data: {
          templateId: 'booking-cancelled',
          variables: {
            bookingId: event.bookingId,
            refundAmount: event.refundAmount,
            cancellationFee: event.cancellationFee,
            reason: event.cancellationReason,
          },
        },
      });

      // Send real-time booking update via WebSocket
      await this.webSocketService.sendBookingUpdate(event.userId, {
        bookingId: event.bookingId,
        status: 'CANCELLED',
        refundAmount: event.refundAmount,
        cancellationFee: event.cancellationFee,
        message: message,
        timestamp: new Date(),
      });

      this.logger.log(
        `Booking cancellation processed for booking: ${event.bookingId}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to handle booking cancellation: ${error.message}`,
        error,
      );
    }
  }

  @OnEvent('booking.modified')
  async handleBookingModified(event: BookingModifiedEvent) {
    this.logger.log(`Booking modified: ${event.bookingId}`);

    try {
      // Send modification notification
      await this.notificationService.createNotification({
        userId: event.userId,
        type: NotificationType.SYSTEM_UPDATE,
        category: NotificationCategory.BOOKING,
        priority: NotificationPriority.MEDIUM,
        title: 'Booking Modified',
        message: `Your booking details have been updated.`,
        referenceId: event.bookingId,
        referenceType: 'booking',
        data: {
          templateId: 'booking-modified',
          variables: {
            bookingId: event.bookingId,
            changes: event.changes,
          },
        },
      });

      // Send real-time booking update via WebSocket
      await this.webSocketService.sendBookingUpdate(event.userId, {
        bookingId: event.bookingId,
        status: 'MODIFIED',
        changes: event.changes,
        message: `Your booking details have been updated`,
        timestamp: new Date(),
      });

      this.logger.log(
        `Booking modification notification sent for booking: ${event.bookingId}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to handle booking modification: ${error.message}`,
        error,
      );
    }
  }

  @OnEvent('payment.completed')
  async handlePaymentCompleted(event: PaymentCompletedEvent) {
    this.logger.log(`Payment completed for booking: ${event.bookingId}`);

    try {
      // Auto-confirm booking if payment is successful
      const booking = await this.bookingRepository.findOne({
        where: { id: event.bookingId },
      });

      if (booking && booking.status === BookingStatus.PENDING) {
        await this.bookingRepository.update(
          { id: event.bookingId },
          {
            status: BookingStatus.CONFIRMED,
            confirmedAt: new Date(),
          },
        );

        // Send auto-confirmation notification
        await this.notificationService.createNotification({
          userId: event.userId,
          type: NotificationType.SYSTEM_UPDATE,
          category: NotificationCategory.BOOKING,
          priority: NotificationPriority.HIGH,
          title: 'Booking Auto-Confirmed',
          message:
            'Your booking has been automatically confirmed after successful payment.',
          referenceId: event.bookingId,
          referenceType: 'booking',
        });

        // Send real-time booking update via WebSocket
        await this.webSocketService.sendBookingUpdate(event.userId, {
          bookingId: event.bookingId,
          status: 'CONFIRMED',
          message:
            'Your booking has been automatically confirmed after successful payment',
          timestamp: new Date(),
        });
      }

      // Send payment completion update via WebSocket
      await this.webSocketService.sendPaymentUpdate(event.userId, {
        paymentId: event.paymentId,
        bookingId: event.bookingId,
        status: 'COMPLETED',
        amount: event.amount,
        message: 'Payment completed successfully',
        timestamp: new Date(),
      });

      this.logger.log(
        `Payment completion processed for booking: ${event.bookingId}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to handle payment completion: ${error.message}`,
        error,
      );
    }
  }

  @OnEvent('payment.kyc_completed')
  async handlePaymentKycCompleted(event: PaymentKycCompletedEvent) {
    this.logger.log(
      `KYC completed for payment: ${event.paymentId}, booking: ${event.bookingId}`,
    );

    try {
      // Get current booking to check status
      const booking = await this.bookingRepository.findOne({
        where: { id: event.bookingId },
      });

      if (!booking) {
        this.logger.error(`Booking not found: ${event.bookingId}`);
        return;
      }

      // Update booking status from PENDING_KYC to CONFIRMED and update KYC status
      if (booking.status === BookingStatus.PENDING_KYC) {
        await this.bookingRepository.update(
          { id: event.bookingId },
          {
            status: BookingStatus.CONFIRMED,
            kycStatus: 'completed',
            kycCompletedAt: new Date(),
            confirmedAt: new Date(),
          },
        );

        // Send booking confirmation notification
        await this.notificationService.createNotification({
          userId: event.userId,
          type: NotificationType.SYSTEM_UPDATE,
          category: NotificationCategory.BOOKING,
          priority: NotificationPriority.HIGH,
          title: 'Booking Confirmed',
          message:
            'Your booking has been confirmed after successful KYC verification.',
          referenceId: event.bookingId,
          referenceType: 'booking',
        });

        // Send real-time booking update via WebSocket
        await this.webSocketService.sendBookingUpdate(event.userId, {
          bookingId: event.bookingId,
          status: 'CONFIRMED',
          message:
            'Your booking has been confirmed after successful KYC verification',
          timestamp: new Date(),
        });

        this.logger.log(
          `Booking ${event.bookingId} status updated from PENDING_KYC to CONFIRMED`,
        );
      } else {
        // Just update KYC status if booking is not in PENDING_KYC state
        await this.bookingRepository.update(
          { id: event.bookingId },
          {
            kycStatus: 'completed',
            kycCompletedAt: new Date(),
          },
        );
      }

      // Send KYC completion notification
      await this.notificationService.sendKycCompleted(event.userId, {
        bookingId: event.bookingId,
        paymentId: event.paymentId,
      });

      this.logger.log(
        `KYC completion processed for booking: ${event.bookingId}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to handle KYC completion: ${error.message}`,
        error,
      );
    }
  }

  private async processCommissionAndWalletOperations(
    event: BookingCompletedEvent,
  ) {
    try {
      // Calculate commission (assuming 10% platform commission)
      const commissionRate = 0.1;
      const commissionAmount = event.totalAmount * commissionRate;
      const partnerAmount = event.totalAmount - commissionAmount;

      // Create wallet transaction for partner
      await this.walletService.addBalance(
        event.partnerId,
        partnerAmount,
        'BOOKING_PAYOUT',
        `Payout for completed booking ${event.bookingId}`,
        event.bookingId,
      );

      // Record platform commission
      const commissionTransaction = this.walletTransactionRepository.create({
        userId: 'platform', // Special platform user ID
        amount: commissionAmount,
        type: 'CREDIT' as any,
        description: `Platform commission for booking ${event.bookingId}`,
        referenceId: event.bookingId,
        referenceType: 'booking',
        status: 'COMPLETED' as any,
      });
      await this.walletTransactionRepository.save(commissionTransaction);

      this.logger.log(
        `Commission processed: Partner: ₹${partnerAmount}, Platform: ₹${commissionAmount}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to process commission and wallet operations: ${error.message}`,
        error,
      );
      throw error;
    }
  }

  private async processRefund(event: BookingCancelledEvent) {
    try {
      // Get booking details for refund calculation
      const booking = await this.bookingRepository.findOne({
        where: { id: event.bookingId },
        relations: ['spaceOption'],
      });

      if (!booking) {
        this.logger.error(`Booking not found for refund: ${event.bookingId}`);
        return;
      }

      // Calculate refund using dynamic policy
      const refundCalculation = await this.refundPolicyService.calculateRefund({
        bookingAmount: booking.totalAmount,
        bookingStartTime: booking.startDateTime,
        cancellationTime: booking.cancelledAt || new Date(),
        partnerId: event.partnerId,
        spaceType: booking.spaceOption?.optionType || 'default',
        isEmergency: false, // Could be determined from cancellation reason
      });

      this.logger.log(
        `Refund calculation: ${JSON.stringify(refundCalculation)}`,
      );

      if (
        refundCalculation.isRefundable &&
        refundCalculation.refundAmount > 0
      ) {
        // Add refund amount back to user's wallet
        await this.walletService.addBalance(
          event.userId,
          refundCalculation.refundAmount,
          'REFUND',
          `${refundCalculation.reason} - Booking ${event.bookingId}`,
          event.bookingId,
        );
      }

      // Record cancellation fee if applicable
      if (refundCalculation.cancellationFee > 0) {
        const walletTransaction = this.walletTransactionRepository.create({
          userId: event.userId,
          amount: -refundCalculation.cancellationFee,
          type: 'DEBIT' as any,
          description: `Cancellation fee for booking ${event.bookingId} - ${refundCalculation.reason}`,
          referenceId: event.bookingId,
          referenceType: 'booking',
          status: 'COMPLETED' as any,
        });
        await this.walletTransactionRepository.save(walletTransaction);
      }

      // Log refund details (booking entity doesn't have refund fields)
      this.logger.log(
        `Refund details for booking ${event.bookingId}: Amount: ₹${refundCalculation.refundAmount}, Fee: ₹${refundCalculation.cancellationFee}`,
      );

      this.logger.log(
        `Refund processed: ₹${refundCalculation.refundAmount}, Fee: ₹${refundCalculation.cancellationFee}, Reason: ${refundCalculation.reason}`,
      );
    } catch (error) {
      this.logger.error(`Failed to process refund: ${error.message}`, error);
      throw error;
    }
  }
}
