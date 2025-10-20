import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { UserEntity } from '@/auth/entities/user.entity';
import { BookingEntity } from '@/database/entities/booking.entity';
import { WalletTransactionEntity } from '@/database/entities/wallet-transaction.entity';
import { PayoutController } from '../controllers/payout.controller';
import { FinancialReportEntity } from '../database/entities/financial-report.entity';
import { PayoutEntity } from '../database/entities/payout.entity';
import { FinancialReportService } from '../services/financial-report.service';
import { PayoutService } from '../services/payout.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PayoutEntity,
      FinancialReportEntity,
      UserEntity,
      BookingEntity,
      WalletTransactionEntity,
    ]),
  ],
  controllers: [PayoutController],
  providers: [PayoutService, FinancialReportService],
  exports: [PayoutService, FinancialReportService],
})
export class FinancialManagementModule {}
