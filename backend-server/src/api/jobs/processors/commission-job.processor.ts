import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Job } from 'bullmq';
import { Repository } from 'typeorm';

import { CommissionService } from '../../commission/commission.service';
import { NotificationService } from '../../notification/notification.service';
import { WalletService } from '../../wallet/wallet.service';

import {
  NotificationPriority,
  NotificationType,
} from '@/common/enums/notification.enum';
import { TransactionStatus, TransactionType } from '@/common/enums/wallet.enum';
import { Uuid } from '@/common/types/common.type';
import { BookingEntity } from '@/database/entities/booking.entity';
import { NotificationCategory } from '@/database/entities/notification.entity';
import {
  TransactionSource,
  WalletTransactionEntity,
} from '@/database/entities/wallet-transaction.entity';
import { CommissionJobData } from '../jobs.service';

@Processor('commission-processing')
@Injectable()
export class CommissionJobProcessor extends WorkerHost {
  private readonly logger = new Logger(CommissionJobProcessor.name);

  constructor(
    @InjectRepository(BookingEntity)
    private readonly bookingRepository: Repository<BookingEntity>,
    @InjectRepository(WalletTransactionEntity)
    private readonly walletTransactionRepository: Repository<WalletTransactionEntity>,
    private readonly commissionService: CommissionService,
    private readonly walletService: WalletService,
    private readonly notificationService: NotificationService,
  ) {
    super();
  }

  async process(job: Job<CommissionJobData>): Promise<void> {
    const { bookingId, userId, partnerId, totalAmount, completedAt } = job.data;

    this.logger.log(
      `Processing commission calculation for booking ${bookingId}`,
    );

    try {
      switch (job.name) {
        case 'calculate-commission':
          await this.calculateCommission(job.data);
          break;
        default:
          this.logger.warn(`Unknown job type: ${job.name}`);
      }
    } catch (error) {
      this.logger.error(`Commission job failed: ${error.message}`, error);
      throw error;
    }
  }

  private async calculateCommission(data: CommissionJobData): Promise<void> {
    const { bookingId, userId, partnerId, totalAmount, completedAt } = data;

    try {
      // Get booking details
      const booking = await this.bookingRepository.findOne({
        where: { id: bookingId },
        relations: [
          'spaceOption',
          'spaceOption.space',
          'spaceOption.space.listing',
        ],
      });

      if (!booking) {
        throw new Error(`Booking ${bookingId} not found`);
      }

      // Calculate commission (10% platform commission)
      const commissionRate = 0.1;
      const commissionAmount = totalAmount * commissionRate;
      const partnerAmount = totalAmount - commissionAmount;

      // Create commission calculation record
      const commissionCalculation =
        await this.commissionService.calculateCommissionForBooking(
          bookingId,
          userId,
        );

      // Process partner payout
      await this.walletService.addBalance(
        partnerId,
        partnerAmount,
        'BOOKING_PAYOUT',
        `Payout for completed booking ${bookingId}`,
        bookingId,
      );

      // Record platform commission
      await this.walletTransactionRepository.save({
        userId: 'platform' as Uuid, // Special platform user ID
        walletBalanceId: 'platform-wallet' as Uuid,
        transactionId: `commission-${bookingId}-${Date.now()}`,
        type: TransactionType.CREDIT,
        source: TransactionSource.ADMIN_ADJUSTMENT,
        amount: commissionAmount,
        balanceAfter: 0, // Platform balance tracking
        currency: 'INR',
        status: TransactionStatus.COMPLETED,
        description: `Platform commission for booking ${bookingId}`,
        referenceId: bookingId,
        referenceType: 'booking',
        processedAt: new Date(),
        metadata: {
          initiatedBy: 'system',
          notes: 'Platform commission from booking',
        },
      });

      // Send notifications
      await this.notificationService.createNotification({
        userId: partnerId,
        type: NotificationType.SYSTEM_UPDATE,
        category: NotificationCategory.WALLET,
        priority: NotificationPriority.MEDIUM,
        title: 'Booking Payout Processed',
        message: `Your payout of ₹${partnerAmount} for booking ${bookingId} has been processed.`,
        referenceId: bookingId,
        referenceType: 'booking',
        data: {
          variables: {
            bookingId,
            amount: partnerAmount,
            commissionAmount,
            type: 'payout',
          },
        },
      });

      this.logger.log(
        `Commission processed successfully: Partner: ₹${partnerAmount}, Platform: ₹${commissionAmount}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to calculate commission: ${error.message}`,
        error,
      );
      throw error;
    }
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job) {
    this.logger.log(`Commission job ${job.id} completed successfully`);
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job, err: Error) {
    this.logger.error(`Commission job ${job.id} failed: ${err.message}`, err);
  }

  @OnWorkerEvent('progress')
  onProgress(job: Job, progress: number) {
    this.logger.log(`Commission job ${job.id} progress: ${progress}%`);
  }
}
