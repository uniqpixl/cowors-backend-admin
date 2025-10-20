import { UserEntity } from '@/auth/entities/user.entity';
import { BookingEntity } from '@/database/entities/booking.entity';
import { IdGeneratorService } from '@/utils/id-generator.service';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommissionController } from './commission.controller';
import { CommissionService } from './commission.service';
import { CommissionPayoutEntity } from './entities/commission-payout.entity';
import { PartnerCommissionEntity } from './entities/commission-tracking.entity';
import {
  CommissionAuditTrailEntity,
  CommissionCalculationEntity,
  CommissionExportEntity,
  CommissionPaymentEntity,
  CommissionReportEntity,
  CommissionRuleEntity,
  CommissionSettingsEntity,
} from './entities/commission.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      // Core commission entities
      CommissionRuleEntity,
      CommissionCalculationEntity,
      CommissionPaymentEntity,
      PartnerCommissionEntity,
      CommissionPayoutEntity,

      // Audit and tracking entities
      CommissionAuditTrailEntity,

      // Export and reporting entities
      CommissionExportEntity,
      CommissionReportEntity,

      // Settings entity
      CommissionSettingsEntity,

      // Related entities
      UserEntity,
      BookingEntity,
    ]),
  ],
  controllers: [CommissionController],
  providers: [CommissionService, IdGeneratorService],
  exports: [CommissionService],
})
export class CommissionModule {}
