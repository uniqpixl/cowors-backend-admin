import { UserEntity } from '@/auth/entities/user.entity';
import { FinancialEventSourcingModule } from '@/common/events/financial-event-sourcing/financial-event-sourcing.module';
import { BookingEntity } from '@/database/entities/booking.entity';
import { PaymentEntity } from '@/database/entities/payment.entity';
import { RefundEntity } from '@/database/entities/refund.entity';
import { WalletTransactionEntity } from '@/database/entities/wallet-transaction.entity';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FinancialReportingController } from './financial-reporting.controller';
import { FinancialReportingService } from './financial-reporting.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PaymentEntity,
      RefundEntity,
      WalletTransactionEntity,
      BookingEntity,
      UserEntity,
    ]),
    FinancialEventSourcingModule,
  ],
  controllers: [FinancialReportingController],
  providers: [FinancialReportingService],
  exports: [FinancialReportingService],
})
export class FinancialReportingModule {}
