import { UserEntity } from '@/auth/entities/user.entity';
import { BookingEntity } from '@/database/entities/booking.entity';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  TaxAuditTrailEntity,
  TaxCalculationEntity,
  TaxComplianceEntity,
  TaxExportEntity,
  TaxReportEntity,
  TaxReturnEntity,
  TaxRuleEntity,
  TaxSettingsEntity,
} from './entities/tax-gst.entity';
import { TaxGstController } from './tax-gst.controller';
import { TaxGstService } from './tax-gst.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      TaxRuleEntity,
      TaxCalculationEntity,
      TaxReturnEntity,
      TaxComplianceEntity,
      TaxAuditTrailEntity,
      TaxExportEntity,
      TaxReportEntity,
      TaxSettingsEntity,
      UserEntity,
      BookingEntity,
    ]),
  ],
  controllers: [TaxGstController],
  providers: [TaxGstService],
  exports: [TaxGstService],
})
export class TaxGstModule {}
