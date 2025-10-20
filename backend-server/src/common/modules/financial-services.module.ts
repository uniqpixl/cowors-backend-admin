import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationModule } from '../../api/notification/notification.module';
import {
  FinancialConfigurationChangeEntity,
  FinancialConfigurationEntity,
  FinancialConfigurationVersionEntity,
} from '../entities/financial-configuration.entity';
import { DynamicFinancialConfigService } from '../services/dynamic-financial-config.service';
import { EnhancedCommissionService } from '../services/enhanced-commission.service';
import { EnhancedTaxService } from '../services/enhanced-tax.service';
import { FinancialConfigIntegrationService } from '../services/financial-config-integration.service';
import { RealTimeConfigService } from '../services/real-time-config.service';

/**
 * Shared module that provides financial configuration services
 * to avoid circular dependencies and ensure proper service injection
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([
      FinancialConfigurationEntity,
      FinancialConfigurationVersionEntity,
      FinancialConfigurationChangeEntity,
    ]),
    EventEmitterModule,
    NotificationModule,
  ],
  providers: [
    DynamicFinancialConfigService,
    FinancialConfigIntegrationService,
    EnhancedCommissionService,
    EnhancedTaxService,
    RealTimeConfigService,
  ],
  exports: [
    DynamicFinancialConfigService,
    FinancialConfigIntegrationService,
    EnhancedCommissionService,
    EnhancedTaxService,
    RealTimeConfigService,
  ],
})
export class FinancialServicesModule {}
