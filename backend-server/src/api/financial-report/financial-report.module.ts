import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from '../../auth/entities/user.entity';
import { FinancialReportController } from '../../controllers/financial-report.controller';
import { BookingEntity } from '../../database/entities/booking.entity';
import { FinancialReportEntity } from '../../database/entities/financial-report.entity';
import { PayoutEntity } from '../../database/entities/payout.entity';
import { WalletTransactionEntity } from '../../database/entities/wallet-transaction.entity';
import { FinancialReportService } from '../../services/financial-report.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      FinancialReportEntity,
      UserEntity,
      BookingEntity,
      WalletTransactionEntity,
      PayoutEntity,
    ]),
  ],
  controllers: [FinancialReportController],
  providers: [FinancialReportService],
  exports: [FinancialReportService],
})
export class FinancialReportModule {}
