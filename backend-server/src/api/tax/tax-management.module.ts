import { UserEntity } from '@/auth/entities/user.entity';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  TaxAuditTrailEntity,
  TaxCollectionEntity,
  TaxComplianceEntity,
  TaxDeadlineEntity,
  TaxExportEntity,
  TaxReportEntity,
  TaxRuleEntity,
  TaxSettingsEntity,
} from './entities/tax-management.entity';
import { TaxManagementController } from './tax-management.controller';
import { TaxManagementService } from './tax-management.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      TaxRuleEntity,
      TaxCollectionEntity,
      TaxAuditTrailEntity,
      TaxExportEntity,
      TaxReportEntity,
      TaxDeadlineEntity,
      TaxSettingsEntity,
      TaxComplianceEntity,
      UserEntity,
    ]),
  ],
  controllers: [TaxManagementController],
  providers: [TaxManagementService],
  exports: [TaxManagementService],
})
export class TaxManagementModule {}
