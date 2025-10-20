import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Job } from 'bullmq';
import { Repository } from 'typeorm';

import { NotificationService } from '../../notification/notification.service';
import { PaymentService } from '../../payment/payment.service';
import { WalletService } from '../../wallet/wallet.service';

import {
  NotificationPriority,
  NotificationType,
} from '@/common/enums/notification.enum';
import { Uuid } from '@/common/types/common.type';
import { BookingEntity } from '@/database/entities/booking.entity';
import { NotificationCategory } from '@/database/entities/notification.entity';
import { RefundType } from '@/database/entities/refund.entity';
import { WalletTransactionEntity } from '@/database/entities/wallet-transaction.entity';
import { WalletOperationJobData } from '../jobs.service';

@Processor('wallet-operations')
@Injectable()
export class WalletJobProcessor extends WorkerHost {
  private readonly logger = new Logger(WalletJobProcessor.name);

  constructor(
    @InjectRepository(WalletTransactionEntity)
    private readonly walletTransactionRepository: Repository<WalletTransactionEntity>,
    @InjectRepository(BookingEntity)
    private readonly bookingRepository: Repository<BookingEntity>,
    private readonly walletService: WalletService,
    private readonly notificationService: NotificationService,
    private readonly paymentService: PaymentService,
  ) {
    super();
  }

  async process(job: Job): Promise<void> {
    this.logger.log(`Processing wallet operation job: ${job.name}`);

    try {
      switch (job.name) {
        case 'wallet-operation':
          await this.processWalletOperation(job.data as WalletOperationJobData);
          break;
        case 'partner-payout':
          await this.processPartnerPayout(job.data);
          break;
        case 'process-refund':
          await this.processRefund(job.data);
          break;
        default:
          this.logger.warn(`Unknown job type: ${job.name}`);
      }
    } catch (error) {
      this.logger.error(`Wallet operation job failed: ${error.message}`, error);
      throw error;
    }
  }

  private async processWalletOperation(
    data: WalletOperationJobData,
  ): Promise<void> {
    const { userId, amount, type, description, referenceId, referenceType } =
      data;

    try {
      if (type === 'CREDIT') {
        await this.walletService.addBalance(
          userId,
          amount,
          'CREDIT',
          description,
          referenceId,
        );
      } else {
        await this.walletService.deductBalance(
          userId,
          amount,
          'DEBIT',
          description,
          referenceId,
        );
      }

      // Send notification
      await this.notificationService.sendWalletUpdate(userId, {
        type,
        amount,
        description,
        referenceId,
        referenceType,
      });

      this.logger.log(
        `Wallet operation completed: ${type} ₹${amount} for user ${userId}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to process wallet operation: ${error.message}`,
        error,
      );
      throw error;
    }
  }

  private async processPartnerPayout(data: {
    partnerId: Uuid;
    amount: number;
    bookingId: Uuid;
    commissionAmount: number;
  }): Promise<void> {
    const { partnerId, amount, bookingId, commissionAmount } = data;

    try {
      // Add balance to partner wallet
      await this.walletService.addBalance(
        partnerId,
        amount,
        'BOOKING_PAYOUT',
        `Payout for completed booking ${bookingId}`,
        bookingId,
      );

      // Send payout notification
      await this.notificationService.createNotification({
        userId: partnerId,
        type: NotificationType.SYSTEM_UPDATE,
        category: NotificationCategory.WALLET,
        priority: NotificationPriority.MEDIUM,
        title: 'Booking Payout Processed',
        message: `Your payout of ₹${amount} for booking ${bookingId} has been processed.`,
        referenceId: bookingId,
        referenceType: 'booking',
        data: {
          variables: {
            bookingId,
            amount,
            commissionAmount,
            type: 'payout',
          },
        },
      });

      this.logger.log(
        `Partner payout processed: ₹${amount} for partner ${partnerId}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to process partner payout: ${error.message}`,
        error,
      );
      throw error;
    }
  }

  private async processRefund(data: {
    bookingId: Uuid;
    userId: Uuid;
    amount: number;
    reason: string;
  }): Promise<void> {
    const { bookingId, userId, amount, reason } = data;

    try {
      // Get booking details
      const booking = await this.bookingRepository.findOne({
        where: { id: bookingId },
        relations: ['payment'],
      });

      if (!booking) {
        throw new Error(`Booking ${bookingId} not found`);
      }

      // Process refund through payment service
      if (booking.payment && booking.payment.length > 0) {
        const payment = booking.payment[0]; // Get the first payment

        // First create a refund record, then process it
        const refund = await this.paymentService.createRefund({
          paymentId: payment.paymentId,
          amount,
          reason,
          type: RefundType.PARTIAL, // or RefundType.FULL based on amount vs payment amount
          method: 'ORIGINAL_SOURCE' as any,
          currency: 'INR',
          userId,
        });

        // Then process the refund
        await this.paymentService.processRefund(refund.refundId, userId);
      } else {
        // If no payment found, credit wallet directly
        await this.walletService.addBalance(
          userId,
          amount,
          'REFUND',
          `Refund for booking ${bookingId}: ${reason}`,
        );
      }

      // Send refund notification
      await this.notificationService.createNotification({
        userId,
        type: NotificationType.REFUND_PROCESSED,
        category: NotificationCategory.WALLET,
        priority: NotificationPriority.MEDIUM,
        title: 'Refund Processed',
        message: `Your refund of ₹${amount} for booking ${bookingId} has been processed.`,
        referenceId: bookingId,
        referenceType: 'booking',
        data: {
          variables: {
            bookingId,
            amount,
            reason,
            type: 'refund',
          },
        },
      });

      this.logger.log(`Refund processed: ₹${amount} for booking ${bookingId}`);
    } catch (error) {
      this.logger.error(`Failed to process refund: ${error.message}`, error);
      throw error;
    }
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job) {
    this.logger.log(`Wallet operation job ${job.id} completed successfully`);
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job, err: Error) {
    this.logger.error(
      `Wallet operation job ${job.id} failed: ${err.message}`,
      err,
    );
  }

  @OnWorkerEvent('progress')
  onProgress(job: Job, progress: number) {
    this.logger.log(`Wallet operation job ${job.id} progress: ${progress}%`);
  }
}
