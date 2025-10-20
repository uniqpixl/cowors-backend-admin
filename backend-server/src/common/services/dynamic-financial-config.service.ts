import {
  FinancialConfigurationChangeEntity,
  FinancialConfigurationEntity,
  FinancialConfigurationVersionEntity,
} from '@/common/entities/financial-configuration.entity';
import {
  ConfigurationChange,
  ConfigurationScope,
  ConfigurationType,
  ConfigurationValue,
  ConfigurationVersion,
} from '@/common/types/financial-configuration.types';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class DynamicFinancialConfigService implements OnModuleInit {
  private readonly logger = new Logger(DynamicFinancialConfigService.name);
  private readonly configCache = new Map<string, any>();
  private readonly subscribers = new Map<string, Set<(config: any) => void>>();
  private readonly configVersions = new Map<string, ConfigurationVersion[]>();

  constructor(
    @InjectRepository(FinancialConfigurationEntity)
    private readonly configRepository: Repository<FinancialConfigurationEntity>,
    @InjectRepository(FinancialConfigurationVersionEntity)
    private readonly versionRepository: Repository<FinancialConfigurationVersionEntity>,
    @InjectRepository(FinancialConfigurationChangeEntity)
    private readonly changeRepository: Repository<FinancialConfigurationChangeEntity>,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async onModuleInit() {
    await this.loadAllConfigurations();
    this.logger.log('Dynamic Financial Configuration Service initialized');
  }

  /**
   * Get configuration value with caching and real-time updates
   */
  async getConfiguration<T = any>(
    type: ConfigurationType,
    scope: ConfigurationScope = ConfigurationScope.GLOBAL,
    scopeId?: string,
  ): Promise<T | null> {
    const cacheKey = this.buildCacheKey(type, scope, scopeId);

    if (this.configCache.has(cacheKey)) {
      return this.configCache.get(cacheKey);
    }

    // Load from database if not in cache
    const config = await this.loadConfigurationFromDatabase(
      type,
      scope,
      scopeId,
    );
    if (config) {
      this.configCache.set(cacheKey, config);
    }

    return config;
  }

  /**
   * Update configuration with validation and versioning
   */
  async updateConfiguration(
    type: ConfigurationType,
    configuration: Record<string, ConfigurationValue>,
    scope: ConfigurationScope = ConfigurationScope.GLOBAL,
    scopeId?: string,
    userId?: string,
    reason?: string,
  ): Promise<ConfigurationVersion> {
    const cacheKey = this.buildCacheKey(type, scope, scopeId);
    const oldConfig = await this.getConfiguration(type, scope, scopeId);

    // Validate configuration
    await this.validateConfiguration(type, configuration);

    // Create new version
    const version = await this.createConfigurationVersion(
      type,
      configuration,
      scope,
      scopeId,
      userId,
      reason,
    );

    // Update cache
    const processedConfig = this.processConfiguration(configuration);
    this.configCache.set(cacheKey, processedConfig);

    // Record change
    await this.recordConfigurationChange({
      configId: cacheKey,
      oldValue: oldConfig,
      newValue: processedConfig,
      changedBy: userId || 'system',
      changedAt: new Date(),
      reason,
      rollbackData: oldConfig,
    });

    // Notify subscribers
    await this.notifyConfigurationChange(
      type,
      scope,
      scopeId,
      processedConfig,
      oldConfig,
    );

    // Emit event for other services
    this.eventEmitter.emit('financial.config.updated', {
      type,
      scope,
      scopeId,
      oldConfig,
      newConfig: processedConfig,
      version: version.version,
      changedBy: userId,
    });

    this.logger.log(
      `Configuration updated: ${type} (${scope}${scopeId ? ':' + scopeId : ''}) - Version ${version.version}`,
    );

    return version;
  }

  /**
   * Subscribe to configuration changes
   */
  subscribeToConfiguration(
    type: ConfigurationType,
    scope: ConfigurationScope,
    scopeId: string | undefined,
    callback: (config: any) => void,
  ): () => void {
    const cacheKey = this.buildCacheKey(type, scope, scopeId);

    if (!this.subscribers.has(cacheKey)) {
      this.subscribers.set(cacheKey, new Set());
    }

    this.subscribers.get(cacheKey)!.add(callback);

    // Return unsubscribe function
    return () => {
      this.subscribers.get(cacheKey)?.delete(callback);
    };
  }

  /**
   * Get configuration history and versions
   */
  async getConfigurationVersions(
    type: ConfigurationType,
    scope: ConfigurationScope = ConfigurationScope.GLOBAL,
    scopeId?: string,
  ): Promise<ConfigurationVersion[]> {
    try {
      // First find the configuration
      const config = await this.configRepository.findOne({
        where: {
          type,
          scope,
          scopeId: scopeId || null,
        },
      });

      if (!config) {
        return [];
      }

      // Then find all versions for this configuration
      const versions = await this.versionRepository.find({
        where: {
          configurationId: config.id,
        },
        order: { version: 'DESC' },
      });

      return versions.map((version) => ({
        id: version.id,
        configId: version.configurationId,
        version: version.version,
        configuration: version.configuration,
        createdBy: version.createdBy || '',
        createdAt: version.createdAt,
        description: version.description,
        isActive: version.isActive,
      }));
    } catch (error) {
      this.logger.error(
        `Failed to load configuration versions: ${error.message}`,
        error.stack,
      );
      return [];
    }
  }

  /**
   * Rollback to a previous configuration version
   */
  async rollbackConfiguration(
    type: ConfigurationType,
    targetVersion: number,
    scope: ConfigurationScope = ConfigurationScope.GLOBAL,
    scopeId?: string,
    userId?: string,
    reason?: string,
  ): Promise<ConfigurationVersion> {
    const versions = await this.getConfigurationVersions(type, scope, scopeId);
    const targetVersionData = versions.find((v) => v.version === targetVersion);

    if (!targetVersionData) {
      throw new Error(
        `Version ${targetVersion} not found for configuration ${type}`,
      );
    }

    return await this.updateConfiguration(
      type,
      targetVersionData.configuration,
      scope,
      scopeId,
      userId,
      reason || `Rollback to version ${targetVersion}`,
    );
  }

  /**
   * Get effective configuration (with inheritance and overrides)
   */
  async getEffectiveConfiguration<T = any>(
    type: ConfigurationType,
    partnerId?: string,
    region?: string,
    category?: string,
  ): Promise<T> {
    // Start with global configuration
    let config =
      (await this.getConfiguration(type, ConfigurationScope.GLOBAL)) || {};

    // Apply region-specific overrides
    if (region) {
      const regionConfig = await this.getConfiguration(
        type,
        ConfigurationScope.REGION,
        region,
      );
      if (regionConfig) {
        config = this.mergeConfigurations(config, regionConfig);
      }
    }

    // Apply category-specific overrides
    if (category) {
      const categoryConfig = await this.getConfiguration(
        type,
        ConfigurationScope.CATEGORY,
        category,
      );
      if (categoryConfig) {
        config = this.mergeConfigurations(config, categoryConfig);
      }
    }

    // Apply partner-specific overrides (highest priority)
    if (partnerId) {
      const partnerConfig = await this.getConfiguration(
        type,
        ConfigurationScope.PARTNER,
        partnerId,
      );
      if (partnerConfig) {
        config = this.mergeConfigurations(config, partnerConfig);
      }
    }

    return config;
  }

  /**
   * Validate configuration against schema and business rules
   */
  private async validateConfiguration(
    type: ConfigurationType,
    configuration: Record<string, ConfigurationValue>,
  ): Promise<void> {
    const schema = this.getConfigurationSchema(type);

    for (const [key, value] of Object.entries(configuration)) {
      const fieldSchema = schema[key];
      if (!fieldSchema) {
        throw new Error(`Unknown configuration field: ${key}`);
      }

      // Type validation
      if (!this.validateDataType(value.value, value.dataType)) {
        throw new Error(
          `Invalid data type for ${key}: expected ${value.dataType}`,
        );
      }

      // Validation rules
      if (value.validation) {
        await this.validateFieldRules(key, value.value, value.validation);
      }

      // Business rule validation
      await this.validateBusinessRules(type, key, value.value);
    }
  }

  /**
   * Get configuration schema for validation
   */
  private getConfigurationSchema(type: ConfigurationType): Record<string, any> {
    const schemas = {
      [ConfigurationType.TAX_SETTINGS]: {
        defaultGSTRate: { type: 'number', min: 0, max: 100 },
        defaultTCSRate: { type: 'number', min: 0, max: 100 },
        defaultTDSRate: { type: 'number', min: 0, max: 100 },
        autoCalculateTax: { type: 'boolean' },
        autoCollectTax: { type: 'boolean' },
        taxExemptCategories: { type: 'array' },
        complianceSettings: { type: 'object' },
      },
      [ConfigurationType.COMMISSION_SETTINGS]: {
        defaultCommissionPercentage: { type: 'number', min: 0, max: 100 },
        minimumCommission: { type: 'number', min: 0 },
        maximumCommission: { type: 'number', min: 0 },
        paymentTermDays: { type: 'number', min: 1, max: 365 },
        autoPayment: { type: 'boolean' },
        holdbackPercentage: { type: 'number', min: 0, max: 100 },
        performanceMultipliers: { type: 'object' },
      },
      [ConfigurationType.PAYMENT_SETTINGS]: {
        allowedPaymentMethods: { type: 'array' },
        defaultCurrency: { type: 'string' },
        paymentTimeout: { type: 'number', min: 60, max: 3600 },
        autoRefundEnabled: { type: 'boolean' },
        refundProcessingDays: { type: 'number', min: 1, max: 30 },
      },
      [ConfigurationType.PAYOUT_SETTINGS]: {
        minimumPayoutAmount: { type: 'number', min: 0 },
        payoutSchedule: {
          type: 'string',
          enum: ['daily', 'weekly', 'monthly'],
        },
        payoutMethods: { type: 'array' },
        verificationRequired: { type: 'boolean' },
        holdbackDays: { type: 'number', min: 0, max: 90 },
      },
      [ConfigurationType.FEE_SETTINGS]: {
        platformFeePercentage: { type: 'number', min: 0, max: 100 },
        processingFeeFixed: { type: 'number', min: 0 },
        processingFeePercentage: { type: 'number', min: 0, max: 100 },
        cancellationFeePercentage: { type: 'number', min: 0, max: 100 },
      },
      [ConfigurationType.CURRENCY_SETTINGS]: {
        supportedCurrencies: { type: 'array' },
        defaultCurrency: { type: 'string' },
        exchangeRateProvider: { type: 'string' },
        autoConversion: { type: 'boolean' },
        conversionMarkup: { type: 'number', min: 0, max: 10 },
      },
    };

    return schemas[type] || {};
  }

  /**
   * Validate data type
   */
  private validateDataType(value: any, expectedType: string): boolean {
    switch (expectedType) {
      case 'string':
        return typeof value === 'string';
      case 'number':
        return typeof value === 'number' && !isNaN(value);
      case 'boolean':
        return typeof value === 'boolean';
      case 'object':
        return (
          typeof value === 'object' && value !== null && !Array.isArray(value)
        );
      case 'array':
        return Array.isArray(value);
      default:
        return false;
    }
  }

  /**
   * Validate field rules
   */
  private async validateFieldRules(
    field: string,
    value: any,
    rules: ConfigurationValue['validation'],
  ): Promise<void> {
    if (!rules) return;

    if (rules.required && (value === null || value === undefined)) {
      throw new Error(`Field ${field} is required`);
    }

    if (typeof value === 'number') {
      if (rules.min !== undefined && value < rules.min) {
        throw new Error(`Field ${field} must be at least ${rules.min}`);
      }
      if (rules.max !== undefined && value > rules.max) {
        throw new Error(`Field ${field} must be at most ${rules.max}`);
      }
    }

    if (typeof value === 'string' && rules.pattern) {
      const regex = new RegExp(rules.pattern);
      if (!regex.test(value)) {
        throw new Error(`Field ${field} does not match required pattern`);
      }
    }

    if (rules.enum && !rules.enum.includes(value)) {
      throw new Error(
        `Field ${field} must be one of: ${rules.enum.join(', ')}`,
      );
    }
  }

  /**
   * Validate business rules
   */
  private async validateBusinessRules(
    type: ConfigurationType,
    field: string,
    value: any,
  ): Promise<void> {
    // Add business-specific validation logic here
    switch (type) {
      case ConfigurationType.COMMISSION_SETTINGS:
        if (field === 'defaultCommissionPercentage' && value > 50) {
          throw new Error('Commission percentage cannot exceed 50%');
        }
        break;
      case ConfigurationType.TAX_SETTINGS:
        if (field === 'defaultGSTRate' && value > 28) {
          throw new Error('GST rate cannot exceed 28%');
        }
        break;
    }
  }

  /**
   * Process configuration values
   */
  private processConfiguration(
    configuration: Record<string, ConfigurationValue>,
  ): any {
    const processed: any = {};

    for (const [key, configValue] of Object.entries(configuration)) {
      processed[key] = configValue.value;
    }

    return processed;
  }

  /**
   * Create configuration version
   */
  private async createConfigurationVersion(
    type: ConfigurationType,
    configuration: Record<string, ConfigurationValue>,
    scope: ConfigurationScope,
    scopeId?: string,
    userId?: string,
    description?: string,
  ): Promise<ConfigurationVersion> {
    try {
      // Find or create the main configuration record
      let config = await this.configRepository.findOne({
        where: {
          type,
          scope,
          scopeId: scopeId || null,
        },
      });

      if (!config) {
        config = this.configRepository.create({
          type,
          scope,
          scopeId: scopeId || null,
          configuration,
          version: 1,
          isActive: true,
          createdBy: userId,
          updatedBy: userId,
          description,
        });
        await this.configRepository.save(config);
      } else {
        // Update existing configuration
        config.configuration = configuration;
        config.version += 1;
        config.updatedBy = userId;
        config.description = description;
        await this.configRepository.save(config);
      }

      // Deactivate previous versions
      await this.versionRepository.update(
        { configurationId: config.id },
        { isActive: false },
      );

      // Create new version record
      const versionEntity = this.versionRepository.create({
        configurationId: config.id,
        version: config.version,
        configuration,
        isActive: true,
        description,
        createdBy: userId,
      });
      await this.versionRepository.save(versionEntity);

      return {
        id: versionEntity.id,
        configId: config.id,
        version: config.version,
        configuration,
        createdBy: userId || 'system',
        createdAt: versionEntity.createdAt,
        description,
        isActive: true,
      };
    } catch (error) {
      this.logger.error(
        `Failed to create configuration version: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Record configuration change for audit
   */
  private async recordConfigurationChange(
    change: ConfigurationChange,
  ): Promise<void> {
    try {
      // Find the configuration entity
      const config = await this.configRepository.findOne({
        where: { id: change.configId },
      });

      if (!config) {
        this.logger.warn(
          `Configuration not found for change record: ${change.configId}`,
        );
        return;
      }

      // Create change record
      const changeEntity = this.changeRepository.create({
        configurationId: config.id,
        version: config.version,
        changeType: 'UPDATE',
        previousValues: change.oldValue,
        newValues: change.newValue,
        reason: change.reason,
        userId: change.changedBy,
        metadata: {
          rollbackData: change.rollbackData,
        },
      });

      await this.changeRepository.save(changeEntity);

      this.logger.log(
        `Configuration change recorded: ${change.configId} by ${change.changedBy}`,
      );

      // Emit audit event
      this.eventEmitter.emit('financial.config.change', change);
    } catch (error) {
      this.logger.error(
        `Failed to record configuration change: ${error.message}`,
        error.stack,
      );
    }
  }

  /**
   * Notify configuration subscribers
   */
  private async notifyConfigurationChange(
    type: ConfigurationType,
    scope: ConfigurationScope,
    scopeId: string | undefined,
    newConfig: any,
    oldConfig: any,
  ): Promise<void> {
    const cacheKey = this.buildCacheKey(type, scope, scopeId);
    const subscribers = this.subscribers.get(cacheKey);

    if (subscribers) {
      for (const callback of subscribers) {
        try {
          callback(newConfig);
        } catch (error) {
          this.logger.error(
            `Error notifying configuration subscriber: ${error.message}`,
          );
        }
      }
    }
  }

  /**
   * Merge configurations with priority
   */
  private mergeConfigurations(base: any, override: any): any {
    return { ...base, ...override };
  }

  /**
   * Build cache key
   */
  private buildCacheKey(
    type: ConfigurationType,
    scope: ConfigurationScope,
    scopeId?: string,
  ): string {
    return `${type}:${scope}${scopeId ? ':' + scopeId : ''}`;
  }

  /**
   * Load configuration from database
   */
  private async loadConfigurationFromDatabase(
    type: ConfigurationType,
    scope: ConfigurationScope,
    scopeId?: string,
  ): Promise<any> {
    try {
      const config = await this.configRepository.findOne({
        where: {
          type,
          scope,
          scopeId: scopeId || null,
          isActive: true,
        },
        order: { version: 'DESC' },
      });

      if (!config) {
        return this.getDefaultConfiguration(type);
      }

      return this.processConfiguration(config.configuration);
    } catch (error) {
      this.logger.error(
        `Failed to load configuration from database: ${error.message}`,
        error.stack,
      );
      return this.getDefaultConfiguration(type);
    }
  }

  /**
   * Load all configurations on startup
   */
  private async loadAllConfigurations(): Promise<void> {
    // Load all configuration types and scopes from database
    // For now, load defaults
    for (const type of Object.values(ConfigurationType)) {
      const config = this.getDefaultConfiguration(type);
      const cacheKey = this.buildCacheKey(type, ConfigurationScope.GLOBAL);
      this.configCache.set(cacheKey, config);
    }
  }

  /**
   * Get default configuration for a type
   */
  private getDefaultConfiguration(type: ConfigurationType): any {
    const defaults = {
      [ConfigurationType.TAX_SETTINGS]: {
        defaultGSTRate: 18,
        defaultTCSRate: 1,
        defaultTDSRate: 2,
        autoCalculateTax: true,
        autoCollectTax: true,
        taxExemptCategories: [],
        complianceSettings: {
          gstinValidationRequired: true,
          panValidationRequired: true,
          automaticFilingEnabled: false,
        },
      },
      [ConfigurationType.COMMISSION_SETTINGS]: {
        defaultCommissionPercentage: 10,
        minimumCommission: 100,
        maximumCommission: 50000,
        paymentTermDays: 30,
        autoPayment: false,
        holdbackPercentage: 5,
        performanceMultipliers: {
          bronze: 1.0,
          silver: 1.1,
          gold: 1.2,
          platinum: 1.3,
        },
      },
      [ConfigurationType.PAYMENT_SETTINGS]: {
        allowedPaymentMethods: ['card', 'upi', 'netbanking', 'wallet'],
        defaultCurrency: 'INR',
        paymentTimeout: 900,
        autoRefundEnabled: true,
        refundProcessingDays: 7,
      },
      [ConfigurationType.PAYOUT_SETTINGS]: {
        minimumPayoutAmount: 1000,
        payoutSchedule: 'weekly',
        payoutMethods: ['bank_transfer', 'upi'],
        verificationRequired: true,
        holdbackDays: 7,
      },
      [ConfigurationType.FEE_SETTINGS]: {
        platformFeePercentage: 2.5,
        processingFeeFixed: 5,
        processingFeePercentage: 2,
        cancellationFeePercentage: 10,
      },
      [ConfigurationType.CURRENCY_SETTINGS]: {
        supportedCurrencies: ['INR', 'USD', 'EUR'],
        defaultCurrency: 'INR',
        exchangeRateProvider: 'fixer.io',
        autoConversion: false,
        conversionMarkup: 1.5,
      },
    };

    return defaults[type] || {};
  }

  /**
   * Periodic cache refresh
   */
  @Cron(CronExpression.EVERY_5_MINUTES)
  async refreshConfigurationCache(): Promise<void> {
    this.logger.debug('Refreshing configuration cache...');

    // In a real implementation, this would check for database changes
    // and update the cache accordingly

    // For now, just log the refresh
    this.logger.debug(
      `Configuration cache refreshed. ${this.configCache.size} configurations cached.`,
    );
  }

  /**
   * Clear configuration cache
   */
  async clearCache(type?: ConfigurationType): Promise<void> {
    if (type) {
      // Clear specific configuration type
      const keysToDelete = Array.from(this.configCache.keys()).filter((key) =>
        key.startsWith(type),
      );
      keysToDelete.forEach((key) => this.configCache.delete(key));
      this.logger.log(`Cleared cache for configuration type: ${type}`);
    } else {
      // Clear all cache
      this.configCache.clear();
      this.logger.log('Cleared all configuration cache');
    }
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): {
    totalConfigurations: number;
    totalVersions: number;
    totalSubscribers: number;
    cacheKeys: string[];
  } {
    return {
      totalConfigurations: this.configCache.size,
      totalVersions: Array.from(this.configVersions.values()).reduce(
        (total, versions) => total + versions.length,
        0,
      ),
      totalSubscribers: Array.from(this.subscribers.values()).reduce(
        (total, subs) => total + subs.size,
        0,
      ),
      cacheKeys: Array.from(this.configCache.keys()),
    };
  }

  /**
   * Get validation schema for configuration type
   */
  getValidationSchema(type: ConfigurationType): Record<string, any> {
    return this.getConfigurationSchema(type);
  }

  /**
   * Validate configuration without saving
   */
  async validateConfigurationOnly(
    type: ConfigurationType,
    configuration: Record<string, ConfigurationValue>,
  ): Promise<{ isValid: boolean; errors?: string[] }> {
    try {
      await this.validateConfiguration(type, configuration);
      return { isValid: true };
    } catch (error) {
      return {
        isValid: false,
        errors: [error.message],
      };
    }
  }

  /**
   * Export configurations
   */
  async exportConfigurations(
    types?: ConfigurationType[],
    scopes?: ConfigurationScope[],
  ): Promise<any[]> {
    try {
      const whereConditions: any = {};

      if (types && types.length > 0) {
        whereConditions.type = types;
      }

      if (scopes && scopes.length > 0) {
        whereConditions.scope = scopes;
      }

      const configurations = await this.configRepository.find({
        where: whereConditions,
        order: { type: 'ASC', scope: 'ASC', version: 'DESC' },
      });

      return configurations.map((config) => ({
        type: config.type,
        scope: config.scope,
        scopeId: config.scopeId,
        configuration: config.configuration,
        version: config.version,
        description: config.description,
        isActive: config.isActive,
        createdAt: config.createdAt,
        updatedAt: config.updatedAt,
      }));
    } catch (error) {
      this.logger.error(
        `Failed to export configurations: ${error.message}`,
        error.stack,
      );
      return [];
    }
  }

  /**
   * Import configurations in bulk
   */
  async importConfigurations(
    configurations: Array<{
      type: ConfigurationType;
      scope: ConfigurationScope;
      scopeId?: string;
      configuration: Record<string, ConfigurationValue>;
      description?: string;
    }>,
    overwriteExisting: boolean = false,
    userId?: string,
  ): Promise<{ imported: number; failed: number; errors: string[] }> {
    const result = { imported: 0, failed: 0, errors: [] };

    for (const config of configurations) {
      try {
        // Check if configuration already exists
        const existing = await this.configRepository.findOne({
          where: {
            type: config.type,
            scope: config.scope,
            scopeId: config.scopeId || null,
          },
        });

        if (existing && !overwriteExisting) {
          result.failed++;
          result.errors.push(
            `Configuration ${config.type}:${config.scope} already exists`,
          );
          continue;
        }

        await this.updateConfiguration(
          config.type,
          config.configuration,
          config.scope,
          config.scopeId,
          userId,
          config.description || 'Bulk import',
        );

        result.imported++;
      } catch (error) {
        result.failed++;
        result.errors.push(
          `Failed to import ${config.type}:${config.scope}: ${error.message}`,
        );
      }
    }

    return result;
  }

  /**
   * Get configuration change audit trail
   */
  async getConfigurationAuditTrail(
    filters: {
      type?: ConfigurationType;
      scope?: ConfigurationScope;
      scopeId?: string;
      userId?: string;
      from?: Date;
      to?: Date;
    } = {},
    limit: number = 100,
  ): Promise<{ changes: any[]; totalCount: number }> {
    try {
      const whereConditions: any = {};

      if (filters.userId) {
        whereConditions.userId = filters.userId;
      }

      if (filters.from || filters.to) {
        whereConditions.createdAt = {};
        if (filters.from) {
          whereConditions.createdAt.gte = filters.from;
        }
        if (filters.to) {
          whereConditions.createdAt.lte = filters.to;
        }
      }

      // Add configuration filters if provided
      if (filters.type || filters.scope || filters.scopeId) {
        whereConditions.configuration = {};
        if (filters.type) {
          whereConditions.configuration.type = filters.type;
        }
        if (filters.scope) {
          whereConditions.configuration.scope = filters.scope;
        }
        if (filters.scopeId) {
          whereConditions.configuration.scopeId = filters.scopeId;
        }
      }

      const [changes, totalCount] = await this.changeRepository.findAndCount({
        where: whereConditions,
        relations: ['configuration'],
        order: { createdAt: 'DESC' },
        take: limit,
      });

      return {
        changes: changes.map((change) => ({
          id: change.id,
          configurationId: change.configurationId,
          version: change.version,
          changeType: change.changeType,
          previousValues: change.previousValues,
          newValues: change.newValues,
          reason: change.reason,
          userId: change.userId,
          createdAt: change.createdAt,
          metadata: change.metadata,
          configuration: {
            type: change.configuration.type,
            scope: change.configuration.scope,
            scopeId: change.configuration.scopeId,
          },
        })),
        totalCount,
      };
    } catch (error) {
      this.logger.error(
        `Failed to get audit trail: ${error.message}`,
        error.stack,
      );
      return { changes: [], totalCount: 0 };
    }
  }
}
