import { UserEntity } from '@/auth/entities/user.entity';
import { IdGeneratorService } from '@/utils/id-generator.service';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BookingEntity } from '../../database/entities/booking.entity';
import {
  FinancialTransactionEntity,
  TransactionAuditTrailEntity,
  TransactionExportEntity,
  TransactionReportEntity,
  TransactionSettingsEntity,
} from './entities/financial-transaction.entity';
import { FinancialTransactionController } from './financial-transaction.controller';
import { FinancialTransactionService } from './financial-transaction.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      FinancialTransactionEntity,
      TransactionAuditTrailEntity,
      TransactionExportEntity,
      TransactionReportEntity,
      TransactionSettingsEntity,
      UserEntity,
      BookingEntity,
    ]),
  ],
  controllers: [FinancialTransactionController],
  providers: [FinancialTransactionService, IdGeneratorService],
  exports: [FinancialTransactionService],
})
export class FinancialTransactionModule {}
