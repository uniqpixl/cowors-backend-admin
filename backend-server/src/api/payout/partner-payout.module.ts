import { UserEntity } from '@/auth/entities/user.entity';
import { BookingEntity } from '@/database/entities/booking.entity';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  BankAccountEntity,
  PartnerWalletEntity,
  PayoutAuditTrailEntity,
  PayoutExportEntity,
  PayoutReportEntity,
  PayoutRequestEntity,
  PayoutSettingsEntity,
  WalletTransactionEntity,
} from './entities/partner-payout.entity';
import { PartnerPayoutController } from './partner-payout.controller';
import { PartnerPayoutService } from './partner-payout.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PayoutRequestEntity,
      BankAccountEntity,
      PartnerWalletEntity,
      WalletTransactionEntity,
      PayoutAuditTrailEntity,
      PayoutExportEntity,
      PayoutReportEntity,
      PayoutSettingsEntity,
      UserEntity,
      BookingEntity,
    ]),
  ],
  controllers: [PartnerPayoutController],
  providers: [PartnerPayoutService],
  exports: [PartnerPayoutService],
})
export class PartnerPayoutModule {}
