import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { BullBoardModule } from '@bull-board/nestjs';
import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { CommissionModule } from '../commission/commission.module';
import { NotificationModule } from '../notification/notification.module';
import { PaymentModule } from '../payment/payment.module';
import { WalletModule } from '../wallet/wallet.module';

import { JobsService } from './jobs.service';
import { CommissionJobProcessor } from './processors/commission-job.processor';
import { WalletJobProcessor } from './processors/wallet-job.processor';

import { BookingEntity } from '@/database/entities/booking.entity';
import { PaymentEntity } from '@/database/entities/payment.entity';
import { WalletTransactionEntity } from '@/database/entities/wallet-transaction.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      BookingEntity,
      PaymentEntity,
      WalletTransactionEntity,
    ]),
    BullModule.registerQueue(
      {
        name: 'commission-processing',
        defaultJobOptions: {
          removeOnComplete: 100,
          removeOnFail: 50,
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 2000,
          },
        },
      },
      {
        name: 'wallet-operations',
        defaultJobOptions: {
          removeOnComplete: 100,
          removeOnFail: 50,
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 2000,
          },
        },
      },
    ),
    BullBoardModule.forFeature(
      {
        name: 'commission-processing',
        adapter: BullMQAdapter as any,
      },
      {
        name: 'wallet-operations',
        adapter: BullMQAdapter as any,
      },
    ),
    CommissionModule,
    PaymentModule,
    WalletModule,
    NotificationModule,
  ],
  providers: [JobsService, CommissionJobProcessor, WalletJobProcessor],
  exports: [JobsService],
})
export class JobsModule {}
