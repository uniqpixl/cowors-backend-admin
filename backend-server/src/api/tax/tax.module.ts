import { UserEntity } from '@/auth/entities/user.entity';
import { FinancialServicesModule } from '@/common/modules/financial-services.module';
import { BookingEntity } from '@/database/entities/booking.entity';
import { IdGeneratorService } from '@/utils/id-generator.service';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  TaxAuditTrailEntity,
  TaxComplianceEntity,
  TaxConfigurationEntity,
  TaxExportEntity,
  TaxReportEntity,
  TaxSettingsEntity,
  TaxTransactionEntity,
} from './entities/tax.entity';
import { TaxController } from './tax.controller';
import { TaxService } from './tax.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      // Core Tax Entities
      TaxConfigurationEntity,
      TaxTransactionEntity,
      TaxComplianceEntity,

      // Audit and Tracking
      TaxAuditTrailEntity,

      // Export and Reporting
      TaxExportEntity,
      TaxReportEntity,

      // Settings
      TaxSettingsEntity,

      // Related Entities
      UserEntity,
      BookingEntity,
    ]),
    FinancialServicesModule,
  ],
  controllers: [TaxController],
  providers: [TaxService, IdGeneratorService],
  exports: [TaxService],
})
export class TaxModule {}
