import { Uuid } from '@/common/types/common.type';
import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { Queue } from 'bullmq';

export interface CommissionJobData {
  bookingId: Uuid;
  userId: Uuid;
  partnerId: Uuid;
  totalAmount: number;
  completedAt: Date;
}

export interface WalletOperationJobData {
  userId: Uuid;
  amount: number;
  type: 'CREDIT' | 'DEBIT';
  description: string;
  referenceId?: Uuid;
  referenceType?: string;
}

@Injectable()
export class JobsService {
  private readonly logger = new Logger(JobsService.name);

  constructor(
    @InjectQueue('commission-processing')
    private readonly commissionQueue: Queue,
    @InjectQueue('wallet-operations')
    private readonly walletQueue: Queue,
  ) {}

  async processCommissionCalculation(data: CommissionJobData): Promise<void> {
    try {
      await this.commissionQueue.add('calculate-commission', data, {
        delay: 5000, // 5 second delay to ensure booking is fully processed
        priority: 10,
      });
      this.logger.log(
        `Commission calculation job queued for booking ${data.bookingId}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to queue commission calculation: ${error.message}`,
        error,
      );
      throw error;
    }
  }

  async processWalletOperation(data: WalletOperationJobData): Promise<void> {
    try {
      await this.walletQueue.add('wallet-operation', data, {
        priority: 5,
      });
      this.logger.log(`Wallet operation job queued for user ${data.userId}`);
    } catch (error) {
      this.logger.error(
        `Failed to queue wallet operation: ${error.message}`,
        error,
      );
      throw error;
    }
  }

  async processPartnerPayout(data: {
    partnerId: Uuid;
    amount: number;
    bookingId: Uuid;
    commissionAmount: number;
  }): Promise<void> {
    try {
      await this.walletQueue.add('partner-payout', data, {
        priority: 8,
      });
      this.logger.log(
        `Partner payout job queued for partner ${data.partnerId}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to queue partner payout: ${error.message}`,
        error,
      );
      throw error;
    }
  }

  async processRefund(data: {
    bookingId: Uuid;
    userId: Uuid;
    amount: number;
    reason: string;
  }): Promise<void> {
    try {
      await this.walletQueue.add('process-refund', data, {
        priority: 15, // High priority for refunds
      });
      this.logger.log(
        `Refund processing job queued for booking ${data.bookingId}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to queue refund processing: ${error.message}`,
        error,
      );
      throw error;
    }
  }

  // Queue monitoring methods
  async getQueueStats(): Promise<{
    commission: any;
    wallet: any;
  }> {
    const [commissionStats, walletStats] = await Promise.all([
      this.commissionQueue.getJobCounts(),
      this.walletQueue.getJobCounts(),
    ]);

    return {
      commission: commissionStats,
      wallet: walletStats,
    };
  }

  async getFailedJobs(): Promise<{
    commission: any[];
    wallet: any[];
  }> {
    const [commissionFailed, walletFailed] = await Promise.all([
      this.commissionQueue.getFailed(),
      this.walletQueue.getFailed(),
    ]);

    return {
      commission: commissionFailed,
      wallet: walletFailed,
    };
  }
}
