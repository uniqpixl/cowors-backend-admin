import {
  ConfigurationScope,
  ConfigurationType,
} from '@/common/types/financial-configuration.types';
import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { DynamicFinancialConfigService } from './dynamic-financial-config.service';

/**
 * Integration service that bridges the gap between the dynamic financial configuration
 * system and existing commission/tax services, providing real-time configuration updates
 */
@Injectable()
export class FinancialConfigIntegrationService implements OnModuleInit {
  private readonly logger = new Logger(FinancialConfigIntegrationService.name);
  private readonly configSubscriptions = new Map<string, () => void>();

  constructor(
    private readonly dynamicConfigService: DynamicFinancialConfigService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async onModuleInit() {
    await this.initializeConfigurationSubscriptions();
    this.logger.log('Financial Configuration Integration Service initialized');
  }

  /**
   * Initialize subscriptions to configuration changes
   */
  private async initializeConfigurationSubscriptions(): Promise<void> {
    // Subscribe to commission settings changes
    const commissionUnsubscribe =
      this.dynamicConfigService.subscribeToConfiguration(
        ConfigurationType.COMMISSION_SETTINGS,
        ConfigurationScope.GLOBAL,
        undefined,
        (config) => this.handleCommissionConfigChange(config),
      );
    this.configSubscriptions.set('commission_global', commissionUnsubscribe);

    // Subscribe to tax settings changes
    const taxUnsubscribe = this.dynamicConfigService.subscribeToConfiguration(
      ConfigurationType.TAX_SETTINGS,
      ConfigurationScope.GLOBAL,
      undefined,
      (config) => this.handleTaxConfigChange(config),
    );
    this.configSubscriptions.set('tax_global', taxUnsubscribe);

    // Subscribe to payment settings changes
    const paymentUnsubscribe =
      this.dynamicConfigService.subscribeToConfiguration(
        ConfigurationType.PAYMENT_SETTINGS,
        ConfigurationScope.GLOBAL,
        undefined,
        (config) => this.handlePaymentConfigChange(config),
      );
    this.configSubscriptions.set('payment_global', paymentUnsubscribe);

    // Subscribe to payout settings changes
    const payoutUnsubscribe =
      this.dynamicConfigService.subscribeToConfiguration(
        ConfigurationType.PAYOUT_SETTINGS,
        ConfigurationScope.GLOBAL,
        undefined,
        (config) => this.handlePayoutConfigChange(config),
      );
    this.configSubscriptions.set('payout_global', payoutUnsubscribe);

    // Subscribe to fee settings changes
    const feeUnsubscribe = this.dynamicConfigService.subscribeToConfiguration(
      ConfigurationType.FEE_SETTINGS,
      ConfigurationScope.GLOBAL,
      undefined,
      (config) => this.handleFeeConfigChange(config),
    );
    this.configSubscriptions.set('fee_global', feeUnsubscribe);
  }

  /**
   * Get commission settings for a specific partner or global
   */
  async getCommissionSettings(partnerId?: string): Promise<any> {
    return await this.dynamicConfigService.getEffectiveConfiguration(
      ConfigurationType.COMMISSION_SETTINGS,
      partnerId,
    );
  }

  /**
   * Get tax settings for a specific partner or global
   */
  async getTaxSettings(partnerId?: string, region?: string): Promise<any> {
    return await this.dynamicConfigService.getEffectiveConfiguration(
      ConfigurationType.TAX_SETTINGS,
      partnerId,
      region,
    );
  }

  /**
   * Get payment settings for a specific partner or global
   */
  async getPaymentSettings(partnerId?: string): Promise<any> {
    return await this.dynamicConfigService.getEffectiveConfiguration(
      ConfigurationType.PAYMENT_SETTINGS,
      partnerId,
    );
  }

  /**
   * Get payout settings for a specific partner or global
   */
  async getPayoutSettings(partnerId?: string): Promise<any> {
    return await this.dynamicConfigService.getEffectiveConfiguration(
      ConfigurationType.PAYOUT_SETTINGS,
      partnerId,
    );
  }

  /**
   * Get fee settings for a specific partner or global
   */
  async getFeeSettings(partnerId?: string, category?: string): Promise<any> {
    return await this.dynamicConfigService.getEffectiveConfiguration(
      ConfigurationType.FEE_SETTINGS,
      partnerId,
      undefined,
      category,
    );
  }

  /**
   * Update commission settings with validation and versioning
   */
  async updateCommissionSettings(
    configuration: any,
    scope: ConfigurationScope = ConfigurationScope.GLOBAL,
    scopeId?: string,
    userId?: string,
    reason?: string,
  ): Promise<any> {
    // Convert flat configuration to structured format
    const structuredConfig = this.convertToStructuredConfig(
      configuration,
      ConfigurationType.COMMISSION_SETTINGS,
    );

    return await this.dynamicConfigService.updateConfiguration(
      ConfigurationType.COMMISSION_SETTINGS,
      structuredConfig,
      scope,
      scopeId,
      userId,
      reason,
    );
  }

  /**
   * Update tax settings with validation and versioning
   */
  async updateTaxSettings(
    configuration: any,
    scope: ConfigurationScope = ConfigurationScope.GLOBAL,
    scopeId?: string,
    userId?: string,
    reason?: string,
  ): Promise<any> {
    // Convert flat configuration to structured format
    const structuredConfig = this.convertToStructuredConfig(
      configuration,
      ConfigurationType.TAX_SETTINGS,
    );

    return await this.dynamicConfigService.updateConfiguration(
      ConfigurationType.TAX_SETTINGS,
      structuredConfig,
      scope,
      scopeId,
      userId,
      reason,
    );
  }

  /**
   * Update payment settings with validation and versioning
   */
  async updatePaymentSettings(
    configuration: any,
    scope: ConfigurationScope = ConfigurationScope.GLOBAL,
    scopeId?: string,
    userId?: string,
    reason?: string,
  ): Promise<any> {
    // Convert flat configuration to structured format
    const structuredConfig = this.convertToStructuredConfig(
      configuration,
      ConfigurationType.PAYMENT_SETTINGS,
    );

    return await this.dynamicConfigService.updateConfiguration(
      ConfigurationType.PAYMENT_SETTINGS,
      structuredConfig,
      scope,
      scopeId,
      userId,
      reason,
    );
  }

  /**
   * Update payout settings with validation and versioning
   */
  async updatePayoutSettings(
    configuration: any,
    scope: ConfigurationScope = ConfigurationScope.GLOBAL,
    scopeId?: string,
    userId?: string,
    reason?: string,
  ): Promise<any> {
    // Convert flat configuration to structured format
    const structuredConfig = this.convertToStructuredConfig(
      configuration,
      ConfigurationType.PAYOUT_SETTINGS,
    );

    return await this.dynamicConfigService.updateConfiguration(
      ConfigurationType.PAYOUT_SETTINGS,
      structuredConfig,
      scope,
      scopeId,
      userId,
      reason,
    );
  }

  /**
   * Update fee settings with validation and versioning
   */
  async updateFeeSettings(
    configuration: any,
    scope: ConfigurationScope = ConfigurationScope.GLOBAL,
    scopeId?: string,
    userId?: string,
    reason?: string,
  ): Promise<any> {
    // Convert flat configuration to structured format
    const structuredConfig = this.convertToStructuredConfig(
      configuration,
      ConfigurationType.FEE_SETTINGS,
    );

    return await this.dynamicConfigService.updateConfiguration(
      ConfigurationType.FEE_SETTINGS,
      structuredConfig,
      scope,
      scopeId,
      userId,
      reason,
    );
  }

  /**
   * Get configuration history for audit purposes
   */
  async getConfigurationHistory(
    type: ConfigurationType,
    scope: ConfigurationScope = ConfigurationScope.GLOBAL,
    scopeId?: string,
  ): Promise<any[]> {
    return await this.dynamicConfigService.getConfigurationVersions(
      type,
      scope,
      scopeId,
    );
  }

  /**
   * Rollback configuration to a previous version
   */
  async rollbackConfiguration(
    type: ConfigurationType,
    targetVersion: number,
    scope: ConfigurationScope = ConfigurationScope.GLOBAL,
    scopeId?: string,
    userId?: string,
    reason?: string,
  ): Promise<any> {
    return await this.dynamicConfigService.rollbackConfiguration(
      type,
      targetVersion,
      scope,
      scopeId,
      userId,
      reason,
    );
  }

  /**
   * Handle commission configuration changes
   */
  private handleCommissionConfigChange(config: any): void {
    this.logger.log('Commission configuration changed, notifying services');
    this.eventEmitter.emit('financial.config.commission.changed', {
      config,
      timestamp: new Date(),
    });
  }

  /**
   * Handle tax configuration changes
   */
  private handleTaxConfigChange(config: any): void {
    this.logger.log('Tax configuration changed, notifying services');
    this.eventEmitter.emit('financial.config.tax.changed', {
      config,
      timestamp: new Date(),
    });
  }

  /**
   * Handle payment configuration changes
   */
  private handlePaymentConfigChange(config: any): void {
    this.logger.log('Payment configuration changed, notifying services');
    this.eventEmitter.emit('financial.config.payment.changed', {
      config,
      timestamp: new Date(),
    });
  }

  /**
   * Handle payout configuration changes
   */
  private handlePayoutConfigChange(config: any): void {
    this.logger.log('Payout configuration changed, notifying services');
    this.eventEmitter.emit('financial.config.payout.changed', {
      config,
      timestamp: new Date(),
    });
  }

  /**
   * Handle fee configuration changes
   */
  private handleFeeConfigChange(config: any): void {
    this.logger.log('Fee configuration changed, notifying services');
    this.eventEmitter.emit('financial.config.fee.changed', {
      config,
      timestamp: new Date(),
    });
  }

  /**
   * Convert flat configuration to structured format required by dynamic config service
   */
  private convertToStructuredConfig(
    config: any,
    type: ConfigurationType,
  ): Record<string, any> {
    const structuredConfig: Record<string, any> = {};

    for (const [key, value] of Object.entries(config)) {
      if (value !== undefined && value !== null) {
        structuredConfig[key] = {
          value,
          dataType: this.inferDataType(value),
          metadata: {
            updatedAt: new Date().toISOString(),
            source: 'integration_service',
          },
        };
      }
    }

    return structuredConfig;
  }

  /**
   * Infer data type from value
   */
  private inferDataType(value: any): string {
    if (typeof value === 'boolean') return 'boolean';
    if (typeof value === 'number') return 'number';
    if (typeof value === 'string') return 'string';
    if (Array.isArray(value)) return 'array';
    if (typeof value === 'object') return 'object';
    return 'string';
  }

  /**
   * Subscribe to partner-specific configuration changes
   */
  async subscribeToPartnerConfig(
    partnerId: string,
    type: ConfigurationType,
    callback: (config: any) => void,
  ): Promise<() => void> {
    const unsubscribe = this.dynamicConfigService.subscribeToConfiguration(
      type,
      ConfigurationScope.PARTNER,
      partnerId,
      callback,
    );

    const subscriptionKey = `${type}_partner_${partnerId}`;
    this.configSubscriptions.set(subscriptionKey, unsubscribe);

    return () => {
      unsubscribe();
      this.configSubscriptions.delete(subscriptionKey);
    };
  }

  /**
   * Subscribe to category-specific configuration changes
   */
  async subscribeToCategoryConfig(
    category: string,
    type: ConfigurationType,
    callback: (config: any) => void,
  ): Promise<() => void> {
    const unsubscribe = this.dynamicConfigService.subscribeToConfiguration(
      type,
      ConfigurationScope.CATEGORY,
      category,
      callback,
    );

    const subscriptionKey = `${type}_category_${category}`;
    this.configSubscriptions.set(subscriptionKey, unsubscribe);

    return () => {
      unsubscribe();
      this.configSubscriptions.delete(subscriptionKey);
    };
  }

  /**
   * Get all active configurations for monitoring
   */
  async getAllActiveConfigurations(): Promise<{
    commission: any;
    tax: any;
    payment: any;
    payout: any;
    fee: any;
    currency: any;
  }> {
    const [commission, tax, payment, payout, fee, currency] = await Promise.all(
      [
        this.dynamicConfigService.getConfiguration(
          ConfigurationType.COMMISSION_SETTINGS,
        ),
        this.dynamicConfigService.getConfiguration(
          ConfigurationType.TAX_SETTINGS,
        ),
        this.dynamicConfigService.getConfiguration(
          ConfigurationType.PAYMENT_SETTINGS,
        ),
        this.dynamicConfigService.getConfiguration(
          ConfigurationType.PAYOUT_SETTINGS,
        ),
        this.dynamicConfigService.getConfiguration(
          ConfigurationType.FEE_SETTINGS,
        ),
        this.dynamicConfigService.getConfiguration(
          ConfigurationType.CURRENCY_SETTINGS,
        ),
      ],
    );

    return {
      commission,
      tax,
      payment,
      payout,
      fee,
      currency,
    };
  }

  /**
   * Cleanup subscriptions on module destroy
   */
  onModuleDestroy() {
    for (const unsubscribe of this.configSubscriptions.values()) {
      unsubscribe();
    }
    this.configSubscriptions.clear();
    this.logger.log('Financial Configuration Integration Service destroyed');
  }

  /**
   * Event handlers for configuration changes
   */
  @OnEvent('financial.config.*.changed')
  handleAnyConfigChange(payload: { config: any; timestamp: Date }) {
    this.logger.log(`Financial configuration changed at ${payload.timestamp}`);
    // Additional global handling can be added here
  }

  /**
   * Validate configuration before applying
   */
  async validateConfiguration(
    type: ConfigurationType,
    configuration: any,
  ): Promise<{ isValid: boolean; errors?: string[] }> {
    const structuredConfig = this.convertToStructuredConfig(
      configuration,
      type,
    );
    return await this.dynamicConfigService.validateConfigurationOnly(
      type,
      structuredConfig,
    );
  }

  /**
   * Get configuration schema for frontend validation
   */
  getConfigurationSchema(type: ConfigurationType): Record<string, any> {
    return this.dynamicConfigService.getValidationSchema(type);
  }

  /**
   * Export configurations for backup
   */
  async exportConfigurations(types?: ConfigurationType[]): Promise<any[]> {
    return await this.dynamicConfigService.exportConfigurations(types);
  }

  /**
   * Import configurations from backup
   */
  async importConfigurations(
    configurations: any[],
    overwriteExisting: boolean = false,
    userId?: string,
  ): Promise<{ imported: number; failed: number; errors: string[] }> {
    return await this.dynamicConfigService.importConfigurations(
      configurations,
      overwriteExisting,
      userId,
    );
  }
}
