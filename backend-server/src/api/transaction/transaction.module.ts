import { UserEntity } from '@/auth/entities/user.entity';
import { BookingEntity } from '@/database/entities/booking.entity';
import { IdGeneratorService } from '@/utils/id-generator.service';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  TransactionAuditTrailEntity,
  TransactionEntity,
  TransactionExportEntity,
  TransactionReportEntity,
  TransactionSettingsEntity,
} from './entities/transaction.entity';
import { TransactionController } from './transaction.controller';
import { TransactionService } from './transaction.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      // Core transaction entities
      TransactionEntity,
      TransactionAuditTrailEntity,
      TransactionExportEntity,
      TransactionReportEntity,
      TransactionSettingsEntity,
      // Related entities
      UserEntity,
      BookingEntity,
    ]),
  ],
  controllers: [TransactionController],
  providers: [TransactionService, IdGeneratorService],
  exports: [TransactionService],
})
export class TransactionModule {}
