import { UserEntity } from '@/auth/entities/user.entity';
import { BookingEntity } from '@/database/entities/booking.entity';
import {
  BankAccountEntity,
  PartnerWalletEntity,
  PayoutAuditTrailEntity,
  PayoutEntity,
  PayoutExportEntity,
  PayoutReportEntity,
  PayoutRequestEntity,
  PayoutSettingsEntity,
  WalletTransactionEntity,
} from '@/database/entities/payout.entity';
import { IdGeneratorService } from '@/utils/id-generator.service';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PayoutController } from './payout.controller';
import { PayoutService } from './payout.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      // Core payout entities
      PayoutRequestEntity,
      PayoutEntity,

      // Wallet management entities
      PartnerWalletEntity,
      WalletTransactionEntity,

      // Bank account entities
      BankAccountEntity,

      // Audit and tracking entities
      PayoutAuditTrailEntity,

      // Export and report entities
      PayoutExportEntity,
      PayoutReportEntity,

      // Settings entity
      PayoutSettingsEntity,

      // Related entities
      UserEntity,
      BookingEntity,
    ]),
  ],
  controllers: [PayoutController],
  providers: [PayoutService, IdGeneratorService],
  exports: [PayoutService],
})
export class PayoutModule {}
