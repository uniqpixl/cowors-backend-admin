import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  CommissionRateConfigEntity,
  CommissionRateType,
  CommissionTrigger,
} from '../entities/commission-rate-config.entity';
import { CommissionSettingsEntity } from '../entities/commission.entity';

export interface DynamicConfigUpdate {
  configId: string;
  configType: 'commission_rate' | 'commission_settings' | 'global_settings';
  changes: Record<string, any>;
  version: number;
  effectiveAt?: Date;
  reason?: string;
  updatedBy: string;
}

export interface ConfigVersionInfo {
  id: string;
  version: number;
  parentConfigId?: string;
  changes: Record<string, any>;
  createdAt: Date;
  createdBy: string;
  reason?: string;
  isActive: boolean;
  rollbackAvailable: boolean;
}

export interface ConfigValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  affectedEntities: string[];
}

export interface RealTimeConfigEvent {
  type:
    | 'config_updated'
    | 'config_created'
    | 'config_deleted'
    | 'config_rollback';
  configId: string;
  configType: string;
  changes?: Record<string, any>;
  version: number;
  timestamp: Date;
  userId: string;
}

@Injectable()
export class DynamicCommissionConfigService {
  private readonly logger = new Logger(DynamicCommissionConfigService.name);
  private readonly configCache = new Map<string, any>();
  private readonly versionHistory = new Map<string, ConfigVersionInfo[]>();

  constructor(
    @InjectRepository(CommissionRateConfigEntity)
    private readonly rateConfigRepository: Repository<CommissionRateConfigEntity>,
    @InjectRepository(CommissionSettingsEntity)
    private readonly settingsRepository: Repository<CommissionSettingsEntity>,
    private readonly eventEmitter: EventEmitter2,
  ) {
    this.initializeConfigCache();
  }

  /**
   * Initialize configuration cache on service startup
   */
  private async initializeConfigCache(): Promise<void> {
    try {
      // Load all active commission rate configs
      const rateConfigs = await this.rateConfigRepository.find({
        where: { isActive: true },
        order: { version: 'DESC' },
      });

      // Load commission settings
      const settings = await this.settingsRepository.find({
        order: { updatedAt: 'DESC' },
      });

      // Cache rate configs
      for (const config of rateConfigs) {
        this.configCache.set(`rate_config_${config.id}`, config);
      }

      // Cache settings
      for (const setting of settings) {
        this.configCache.set(`settings_${setting.id}`, setting);
      }

      this.logger.log(
        `Initialized config cache with ${rateConfigs.length} rate configs and ${settings.length} settings`,
      );
    } catch (error) {
      this.logger.error('Failed to initialize config cache', error);
    }
  }

  /**
   * Create new commission rate configuration
   */
  async createCommissionRateConfig(
    configData: Partial<CommissionRateConfigEntity>,
    userId: string,
  ): Promise<CommissionRateConfigEntity> {
    // Validate configuration
    const validation = await this.validateCommissionRateConfig(configData);
    if (!validation.isValid) {
      throw new Error(
        `Configuration validation failed: ${validation.errors.join(', ')}`,
      );
    }

    // Create new configuration
    const config = this.rateConfigRepository.create({
      ...configData,
      createdBy: userId,
      version: 1,
      isActive: true,
    });

    const savedConfig = await this.rateConfigRepository.save(config);

    // Update cache
    this.configCache.set(`rate_config_${savedConfig.id}`, savedConfig);

    // Emit real-time event
    await this.emitConfigEvent({
      type: 'config_created',
      configId: savedConfig.id,
      configType: 'commission_rate',
      version: savedConfig.version,
      timestamp: new Date(),
      userId,
    });

    this.logger.log(`Created new commission rate config: ${savedConfig.id}`);
    return savedConfig;
  }

  /**
   * Update commission rate configuration with versioning
   */
  async updateCommissionRateConfig(
    configId: string,
    updates: Partial<CommissionRateConfigEntity>,
    userId: string,
    reason?: string,
  ): Promise<CommissionRateConfigEntity> {
    const existingConfig = await this.rateConfigRepository.findOne({
      where: { id: configId },
    });

    if (!existingConfig) {
      throw new NotFoundException('Commission rate config not found');
    }

    // Validate updates
    const validation = await this.validateCommissionRateConfig({
      ...existingConfig,
      ...updates,
    });

    if (!validation.isValid) {
      throw new Error(
        `Configuration validation failed: ${validation.errors.join(', ')}`,
      );
    }

    // Create new version
    const newVersion = existingConfig.version + 1;
    const updatedConfig = this.rateConfigRepository.create({
      ...existingConfig,
      ...updates,
      id: undefined, // Generate new ID for new version
      parentConfigId: configId,
      version: newVersion,
      updatedBy: userId,
      changeReason: reason,
    });

    // Deactivate old version
    await this.rateConfigRepository.update(configId, { isActive: false });

    // Save new version
    const savedConfig = await this.rateConfigRepository.save(updatedConfig);

    // Update cache
    this.configCache.set(`rate_config_${savedConfig.id}`, savedConfig);
    this.configCache.delete(`rate_config_${configId}`);

    // Store version history
    await this.storeVersionHistory(
      configId,
      existingConfig,
      savedConfig,
      userId,
      reason,
    );

    // Emit real-time event
    await this.emitConfigEvent({
      type: 'config_updated',
      configId: savedConfig.id,
      configType: 'commission_rate',
      changes: this.getChanges(existingConfig, updates),
      version: newVersion,
      timestamp: new Date(),
      userId,
    });

    this.logger.log(
      `Updated commission rate config: ${configId} -> ${savedConfig.id} (v${newVersion})`,
    );
    return savedConfig;
  }

  /**
   * Update commission settings dynamically
   */
  async updateCommissionSettings(
    settingsId: string,
    updates: Partial<CommissionSettingsEntity>,
    userId: string,
  ): Promise<CommissionSettingsEntity> {
    const existingSettings = await this.settingsRepository.findOne({
      where: { id: settingsId },
    });

    if (!existingSettings) {
      throw new NotFoundException('Commission settings not found');
    }

    // Validate settings
    const validation = await this.validateCommissionSettings({
      ...existingSettings,
      ...updates,
    });

    if (!validation.isValid) {
      throw new Error(
        `Settings validation failed: ${validation.errors.join(', ')}`,
      );
    }

    // Update settings
    await this.settingsRepository.update(settingsId, {
      ...updates,
      updatedBy: userId,
    });

    const updatedSettings = await this.settingsRepository.findOne({
      where: { id: settingsId },
    });

    // Update cache
    this.configCache.set(`settings_${settingsId}`, updatedSettings);

    // Emit real-time event
    await this.emitConfigEvent({
      type: 'config_updated',
      configId: settingsId,
      configType: 'commission_settings',
      changes: this.getChanges(existingSettings, updates),
      version: 1, // Settings don't have versioning yet
      timestamp: new Date(),
      userId,
    });

    this.logger.log(`Updated commission settings: ${settingsId}`);
    return updatedSettings;
  }

  /**
   * Get configuration from cache or database
   */
  async getConfiguration(configId: string, configType: string): Promise<any> {
    const cacheKey = `${configType}_${configId}`;

    // Try cache first
    if (this.configCache.has(cacheKey)) {
      return this.configCache.get(cacheKey);
    }

    // Fallback to database
    let config;
    if (configType === 'rate_config') {
      config = await this.rateConfigRepository.findOne({
        where: { id: configId, isActive: true },
      });
    } else if (configType === 'settings') {
      config = await this.settingsRepository.findOne({
        where: { id: configId },
      });
    }

    if (config) {
      this.configCache.set(cacheKey, config);
    }

    return config;
  }

  /**
   * Get all active configurations
   */
  async getAllActiveConfigurations(): Promise<{
    rateConfigs: CommissionRateConfigEntity[];
    settings: CommissionSettingsEntity[];
  }> {
    const rateConfigs = await this.rateConfigRepository.find({
      where: { isActive: true },
      order: { createdAt: 'DESC' },
    });

    const settings = await this.settingsRepository.find({
      order: { updatedAt: 'DESC' },
    });

    return { rateConfigs, settings };
  }

  /**
   * Rollback configuration to previous version
   */
  async rollbackConfiguration(
    configId: string,
    targetVersion: number,
    userId: string,
    reason: string,
  ): Promise<CommissionRateConfigEntity> {
    // Find target version
    const targetConfig = await this.rateConfigRepository.findOne({
      where: { parentConfigId: configId, version: targetVersion },
    });

    if (!targetConfig) {
      throw new NotFoundException(
        `Version ${targetVersion} not found for config ${configId}`,
      );
    }

    // Create new version based on target
    const newVersion = await this.getNextVersion(configId);
    const rolledBackConfig = this.rateConfigRepository.create({
      ...targetConfig,
      id: undefined,
      parentConfigId: configId,
      version: newVersion,
      updatedBy: userId,
      changeReason: `Rollback to version ${targetVersion}: ${reason}`,
      isActive: true,
    });

    // Deactivate current version
    await this.rateConfigRepository.update(
      { parentConfigId: configId, isActive: true },
      { isActive: false },
    );

    // Save rolled back version
    const savedConfig = await this.rateConfigRepository.save(rolledBackConfig);

    // Update cache
    this.configCache.set(`rate_config_${savedConfig.id}`, savedConfig);

    // Emit real-time event
    await this.emitConfigEvent({
      type: 'config_rollback',
      configId: savedConfig.id,
      configType: 'commission_rate',
      version: newVersion,
      timestamp: new Date(),
      userId,
    });

    this.logger.log(
      `Rolled back config ${configId} to version ${targetVersion} as new version ${newVersion}`,
    );
    return savedConfig;
  }

  /**
   * Get configuration version history
   */
  async getConfigurationHistory(
    configId: string,
  ): Promise<ConfigVersionInfo[]> {
    const versions = await this.rateConfigRepository.find({
      where: [{ id: configId }, { parentConfigId: configId }],
      order: { version: 'DESC' },
    });

    return versions.map((version) => ({
      id: version.id,
      version: version.version,
      parentConfigId: version.parentConfigId,
      changes: {}, // Would need to calculate from previous version
      createdAt: version.createdAt,
      createdBy: version.createdBy,
      reason: version.changeReason,
      isActive: version.isActive,
      rollbackAvailable: version.version > 1,
    }));
  }

  /**
   * Validate commission rate configuration
   */
  private async validateCommissionRateConfig(
    config: Partial<CommissionRateConfigEntity>,
  ): Promise<ConfigValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];
    const affectedEntities: string[] = [];

    // Basic validation
    if (!config.name || config.name.trim().length === 0) {
      errors.push('Configuration name is required');
    }

    if (!config.rateType) {
      errors.push('Rate type is required');
    }

    if (!config.trigger) {
      errors.push('Trigger is required');
    }

    // Rate-specific validation
    if (config.rateType === CommissionRateType.PERCENTAGE) {
      if (!config.baseRate || config.baseRate <= 0 || config.baseRate > 100) {
        errors.push('Base rate must be between 0 and 100 for percentage type');
      }
    }

    if (config.rateType === CommissionRateType.FIXED_AMOUNT) {
      if (!config.baseRate || config.baseRate <= 0) {
        errors.push('Base rate must be greater than 0 for fixed amount type');
      }
    }

    if (config.rateType === CommissionRateType.TIERED) {
      if (!config.commissionTiers || config.commissionTiers.length === 0) {
        errors.push('Commission tiers are required for tiered rate type');
      } else {
        // Validate tier structure
        for (let i = 0; i < config.commissionTiers.length; i++) {
          const tier = config.commissionTiers[i];
          if (tier.minAmount < 0) {
            errors.push(`Tier ${i + 1}: Minimum amount cannot be negative`);
          }
          if (tier.maxAmount && tier.maxAmount <= tier.minAmount) {
            errors.push(
              `Tier ${i + 1}: Maximum amount must be greater than minimum amount`,
            );
          }
          if (tier.rate <= 0) {
            errors.push(`Tier ${i + 1}: Rate must be greater than 0`);
          }
        }
      }
    }

    // Date validation
    if (config.effectiveFrom && config.effectiveTo) {
      if (config.effectiveFrom >= config.effectiveTo) {
        errors.push('Effective from date must be before effective to date');
      }
    }

    // Check for conflicts with existing configurations
    if (config.partnerId) {
      const conflictingConfigs = await this.rateConfigRepository.find({
        where: {
          partnerId: config.partnerId,
          isActive: true,
        },
      });

      if (conflictingConfigs.length > 0) {
        warnings.push(
          `Partner ${config.partnerId} already has active configurations`,
        );
        affectedEntities.push(...conflictingConfigs.map((c) => c.id));
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      affectedEntities,
    };
  }

  /**
   * Validate commission settings
   */
  private async validateCommissionSettings(
    settings: Partial<CommissionSettingsEntity>,
  ): Promise<ConfigValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (settings.defaultCommissionPercentage !== undefined) {
      if (
        settings.defaultCommissionPercentage < 0 ||
        settings.defaultCommissionPercentage > 100
      ) {
        errors.push('Default commission percentage must be between 0 and 100');
      }
    }

    if (
      settings.minimumPayoutAmount !== undefined &&
      settings.minimumPayoutAmount < 0
    ) {
      errors.push('Minimum payout amount cannot be negative');
    }

    if (
      settings.paymentProcessingDays !== undefined &&
      settings.paymentProcessingDays < 0
    ) {
      errors.push('Payment processing days cannot be negative');
    }

    if (
      settings.autoApprovalThreshold !== undefined &&
      settings.autoApprovalThreshold < 0
    ) {
      errors.push('Auto approval threshold cannot be negative');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      affectedEntities: [],
    };
  }

  /**
   * Store version history for auditing
   */
  private async storeVersionHistory(
    originalConfigId: string,
    oldConfig: CommissionRateConfigEntity,
    newConfig: CommissionRateConfigEntity,
    userId: string,
    reason?: string,
  ): Promise<void> {
    const versionInfo: ConfigVersionInfo = {
      id: newConfig.id,
      version: newConfig.version,
      parentConfigId: originalConfigId,
      changes: this.getChanges(oldConfig, newConfig),
      createdAt: newConfig.createdAt,
      createdBy: userId,
      reason,
      isActive: newConfig.isActive,
      rollbackAvailable: true,
    };

    if (!this.versionHistory.has(originalConfigId)) {
      this.versionHistory.set(originalConfigId, []);
    }

    this.versionHistory.get(originalConfigId).push(versionInfo);
  }

  /**
   * Get changes between two configurations
   */
  private getChanges(oldConfig: any, newConfig: any): Record<string, any> {
    const changes: Record<string, any> = {};

    for (const key in newConfig) {
      if (newConfig[key] !== oldConfig[key]) {
        changes[key] = {
          from: oldConfig[key],
          to: newConfig[key],
        };
      }
    }

    return changes;
  }

  /**
   * Get next version number for a configuration
   */
  private async getNextVersion(configId: string): Promise<number> {
    const latestVersion = await this.rateConfigRepository.findOne({
      where: [{ id: configId }, { parentConfigId: configId }],
      order: { version: 'DESC' },
    });

    return latestVersion ? latestVersion.version + 1 : 1;
  }

  /**
   * Emit real-time configuration event
   */
  private async emitConfigEvent(event: RealTimeConfigEvent): Promise<void> {
    // Emit to event system for WebSocket broadcasting
    this.eventEmitter.emit('commission.config.updated', event);

    // Also emit specific event types
    this.eventEmitter.emit(`commission.config.${event.type}`, event);

    this.logger.debug(
      `Emitted config event: ${event.type} for ${event.configId}`,
    );
  }

  /**
   * Clear configuration cache (for testing or manual refresh)
   */
  async clearCache(): Promise<void> {
    this.configCache.clear();
    await this.initializeConfigCache();
    this.logger.log('Configuration cache cleared and reinitialized');
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.configCache.size,
      keys: Array.from(this.configCache.keys()),
    };
  }

  /**
   * Get current commission settings configuration
   */
  async getCommissionSettings(): Promise<CommissionSettingsEntity> {
    const settings = await this.settingsRepository.findOne({
      where: {},
      order: { createdAt: 'DESC' },
    });

    if (!settings) {
      throw new NotFoundException('Commission settings not found');
    }

    return settings;
  }

  async getCommissionRateConfig(
    configId: string,
  ): Promise<CommissionRateConfigEntity> {
    const config = await this.rateConfigRepository.findOne({
      where: { id: configId },
    });

    if (!config) {
      throw new NotFoundException(
        `Commission rate configuration with ID ${configId} not found`,
      );
    }

    return config;
  }

  async getCommissionRateConfigs(
    filters: any = {},
  ): Promise<CommissionRateConfigEntity[]> {
    const queryBuilder = this.rateConfigRepository.createQueryBuilder('config');

    if (filters.partnerId) {
      queryBuilder.andWhere('config.partnerId = :partnerId', {
        partnerId: filters.partnerId,
      });
    }

    if (filters.spaceId) {
      queryBuilder.andWhere('config.spaceId = :spaceId', {
        spaceId: filters.spaceId,
      });
    }

    if (filters.isActive !== undefined) {
      queryBuilder.andWhere('config.isActive = :isActive', {
        isActive: filters.isActive,
      });
    }

    if (filters.effectiveDate) {
      queryBuilder.andWhere('config.effectiveDate <= :effectiveDate', {
        effectiveDate: filters.effectiveDate,
      });
    }

    if (filters.tags && filters.tags.length > 0) {
      queryBuilder.andWhere('config.metadata @> :tags', {
        tags: JSON.stringify({ tags: filters.tags }),
      });
    }

    return await queryBuilder.getMany();
  }

  /**
   * Get configuration version history
   */
  async getVersionHistory(
    configType: string,
    configId: string,
    limit?: number,
  ): Promise<ConfigVersionInfo[]> {
    const key = `${configType}:${configId}`;
    const history = this.versionHistory.get(key) || [];

    if (limit) {
      return history.slice(0, limit);
    }

    return history;
  }
}
