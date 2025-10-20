import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TaxRuleStatus } from '../dto/tax-management.dto';
import {
  TaxRuleEntity,
  TaxSettingsEntity,
} from '../entities/tax-management.entity';

// Interfaces for dynamic tax configuration
export interface DynamicTaxConfigUpdate {
  configType: 'tax_rule' | 'tax_settings';
  configId: string;
  configuration: any;
  region?: string;
  taxType?: string;
  effectiveDate?: Date;
  expiryDate?: Date;
  priority?: number;
  updatedBy: string;
  reason: string;
  metadata?: Record<string, any>;
}

export interface TaxConfigVersionInfo {
  version: number;
  configId: string;
  configType: string;
  configuration: any;
  effectiveDate: Date;
  expiryDate?: Date;
  updatedBy: string;
  updatedAt: Date;
  reason: string;
  metadata?: Record<string, any>;
}

export interface TaxConfigValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  suggestions: string[];
}

export interface RealTimeTaxConfigEvent {
  eventType: 'created' | 'updated' | 'deleted' | 'rollback';
  configType: 'tax_rule' | 'tax_settings';
  configId: string;
  configuration: any;
  previousConfiguration?: any;
  effectiveDate: Date;
  updatedBy: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

@Injectable()
export class DynamicTaxConfigService {
  private readonly logger = new Logger(DynamicTaxConfigService.name);
  private readonly configCache = new Map<string, any>();
  private readonly versionHistory = new Map<string, TaxConfigVersionInfo[]>();
  private readonly configSubscriptions = new Map<string, Set<string>>();

  constructor(
    @InjectRepository(TaxRuleEntity)
    private taxRuleRepository: Repository<TaxRuleEntity>,
    @InjectRepository(TaxSettingsEntity)
    private taxSettingsRepository: Repository<TaxSettingsEntity>,
    private eventEmitter: EventEmitter2,
  ) {
    this.initializeConfigCache();
  }

  private async initializeConfigCache(): Promise<void> {
    try {
      // Load all active tax rules into cache
      const taxRules = await this.taxRuleRepository.find({
        where: { status: TaxRuleStatus.ACTIVE },
      });

      for (const rule of taxRules) {
        this.configCache.set(`tax_rule_${rule.id}`, rule);
      }

      // Load tax settings into cache
      const taxSettings = await this.taxSettingsRepository.find();
      for (const setting of taxSettings) {
        this.configCache.set(`tax_settings_${setting.id}`, setting);
      }

      this.logger.log(
        `Initialized tax configuration cache with ${this.configCache.size} entries`,
      );
    } catch (error) {
      this.logger.error('Failed to initialize tax configuration cache', error);
    }
  }

  // Tax Rule Configuration Management
  async createTaxRuleConfig(
    update: DynamicTaxConfigUpdate,
  ): Promise<{ config: TaxRuleEntity; version: TaxConfigVersionInfo }> {
    try {
      // Validate configuration
      const validation = await this.validateTaxConfiguration(
        update.configType,
        update.configuration,
        update.region,
        update.taxType,
      );

      if (!validation.isValid) {
        throw new BadRequestException(
          `Invalid tax rule configuration: ${validation.errors.join(', ')}`,
        );
      }

      // Create new tax rule
      const taxRuleData = Array.isArray(update.configuration)
        ? update.configuration[0]
        : update.configuration;
      const taxRule = this.taxRuleRepository.create({
        ...taxRuleData,
        applicableRegions: update.region ? [update.region] : [],
        taxType: update.taxType,
        effectiveFrom: update.effectiveDate || new Date(),
        effectiveUntil: update.expiryDate,
        status: TaxRuleStatus.ACTIVE,
        createdBy: update.updatedBy,
      });

      const savedRuleResult = await this.taxRuleRepository.save(taxRule);
      const savedRule = Array.isArray(savedRuleResult)
        ? savedRuleResult[0]
        : savedRuleResult;

      // Update cache
      this.configCache.set(`tax_rule_${savedRule.id}`, savedRule);

      // Create version info
      const versionInfo = await this.storeVersionHistory(
        'tax_rule',
        savedRule.id,
        savedRule,
        update.updatedBy,
        update.reason,
        update.metadata,
      );

      // Emit real-time event
      await this.emitRealTimeConfigEvent({
        eventType: 'created',
        configType: 'tax_rule',
        configId: savedRule.id,
        configuration: savedRule,
        effectiveDate: savedRule.effectiveFrom,
        updatedBy: update.updatedBy,
        timestamp: new Date(),
        metadata: update.metadata,
      });

      this.logger.log(`Created tax rule configuration: ${savedRule.id}`);
      return { config: savedRule, version: versionInfo };
    } catch (error) {
      this.logger.error('Failed to create tax rule configuration', error);
      throw error;
    }
  }

  async updateTaxRuleConfig(
    update: DynamicTaxConfigUpdate,
  ): Promise<{ config: TaxRuleEntity; version: TaxConfigVersionInfo }> {
    try {
      const existingRule = await this.taxRuleRepository.findOne({
        where: { id: update.configId },
      });

      if (!existingRule) {
        throw new NotFoundException(
          `Tax rule configuration not found: ${update.configId}`,
        );
      }

      // Validate configuration
      const validation = await this.validateTaxConfiguration(
        update.configType,
        update.configuration,
        update.region,
        update.taxType,
      );

      if (!validation.isValid) {
        throw new BadRequestException(
          `Invalid tax rule configuration: ${validation.errors.join(', ')}`,
        );
      }

      const previousConfig = { ...existingRule };

      // Update tax rule
      Object.assign(existingRule, {
        ...update.configuration,
        applicableRegions: update.region
          ? [update.region]
          : existingRule.applicableRegions,
        taxType: update.taxType || existingRule.taxType,
        effectiveFrom: update.effectiveDate || existingRule.effectiveFrom,
        effectiveUntil: update.expiryDate || existingRule.effectiveUntil,
        updatedAt: new Date(),
        updatedBy: update.updatedBy,
      });

      const savedRule = await this.taxRuleRepository.save(existingRule);

      // Update cache
      this.configCache.set(`tax_rule_${savedRule.id}`, savedRule);

      // Create version info
      const versionInfo = await this.storeVersionHistory(
        'tax_rule',
        savedRule.id,
        savedRule,
        update.updatedBy,
        update.reason,
        update.metadata,
      );

      // Emit real-time event
      await this.emitRealTimeConfigEvent({
        eventType: 'updated',
        configType: 'tax_rule',
        configId: savedRule.id,
        configuration: savedRule,
        previousConfiguration: previousConfig,
        effectiveDate: savedRule.effectiveFrom,
        updatedBy: update.updatedBy,
        timestamp: new Date(),
        metadata: update.metadata,
      });

      this.logger.log(`Updated tax rule configuration: ${savedRule.id}`);
      return { config: savedRule, version: versionInfo };
    } catch (error) {
      this.logger.error('Failed to update tax rule configuration', error);
      throw error;
    }
  }

  async getTaxRuleConfig(configId: string): Promise<TaxRuleEntity> {
    // Try cache first
    const cached = this.configCache.get(`tax_rule_${configId}`);
    if (cached) {
      return cached;
    }

    // Fallback to database
    const config = await this.taxRuleRepository.findOne({
      where: { id: configId },
    });

    if (!config) {
      throw new NotFoundException(
        `Tax rule configuration not found: ${configId}`,
      );
    }

    // Update cache
    this.configCache.set(`tax_rule_${configId}`, config);
    return config;
  }

  async getTaxRuleConfigs(filters: {
    region?: string;
    taxType?: string;
    isActive?: boolean;
    effectiveDate?: Date;
    tags?: string[];
  }): Promise<TaxRuleEntity[]> {
    const queryBuilder = this.taxRuleRepository.createQueryBuilder('rule');

    if (filters.region) {
      queryBuilder.andWhere('rule.region = :region', {
        region: filters.region,
      });
    }

    if (filters.taxType) {
      queryBuilder.andWhere('rule.taxType = :taxType', {
        taxType: filters.taxType,
      });
    }

    if (filters.isActive !== undefined) {
      queryBuilder.andWhere('rule.isActive = :isActive', {
        isActive: filters.isActive,
      });
    }

    if (filters.effectiveDate) {
      queryBuilder.andWhere('rule.effectiveDate <= :effectiveDate', {
        effectiveDate: filters.effectiveDate,
      });
      queryBuilder.andWhere(
        '(rule.expiryDate IS NULL OR rule.expiryDate > :effectiveDate)',
        {
          effectiveDate: filters.effectiveDate,
        },
      );
    }

    queryBuilder.orderBy('rule.priority', 'DESC');
    queryBuilder.addOrderBy('rule.effectiveDate', 'DESC');

    return await queryBuilder.getMany();
  }

  async deleteTaxRuleConfig(
    configId: string,
    deletedBy: string,
  ): Promise<void> {
    const config = await this.getTaxRuleConfig(configId);

    // Soft delete by setting status to inactive
    config.status = TaxRuleStatus.INACTIVE;
    config.updatedBy = deletedBy;
    config.updatedAt = new Date();

    await this.taxRuleRepository.save(config);

    // Remove from cache
    this.configCache.delete(`tax_rule_${configId}`);

    // Emit real-time event
    await this.emitRealTimeConfigEvent({
      eventType: 'deleted',
      configType: 'tax_rule',
      configId,
      configuration: config,
      effectiveDate: config.effectiveFrom,
      updatedBy: deletedBy,
      timestamp: new Date(),
    });

    this.logger.log(`Deleted tax rule configuration: ${configId}`);
  }

  // Tax Settings Configuration Management
  async updateTaxSettings(
    update: DynamicTaxConfigUpdate,
  ): Promise<{ config: TaxSettingsEntity; version: TaxConfigVersionInfo }> {
    try {
      // Validate configuration
      const validation = await this.validateTaxConfiguration(
        update.configType,
        update.configuration,
      );

      if (!validation.isValid) {
        throw new BadRequestException(
          `Invalid tax settings configuration: ${validation.errors.join(', ')}`,
        );
      }

      let taxSettings = await this.taxSettingsRepository.findOne({
        where: { id: update.configId },
      });

      const previousConfig = taxSettings ? { ...taxSettings } : null;

      if (!taxSettings) {
        // Create new settings
        const settingsData = Array.isArray(update.configuration)
          ? update.configuration[0]
          : update.configuration;
        const createdSettings = this.taxSettingsRepository.create({
          ...settingsData,
          updatedBy: update.updatedBy,
        });
        taxSettings = Array.isArray(createdSettings)
          ? createdSettings[0]
          : createdSettings;
      } else {
        // Update existing settings
        Object.assign(taxSettings, {
          ...update.configuration,
          updatedAt: new Date(),
          updatedBy: update.updatedBy,
        });
      }

      const savedSettingsResult =
        await this.taxSettingsRepository.save(taxSettings);
      const savedSettings = Array.isArray(savedSettingsResult)
        ? savedSettingsResult[0]
        : savedSettingsResult;

      // Update cache
      this.configCache.set(`tax_settings_${savedSettings.id}`, savedSettings);

      // Create version info
      const versionInfo = await this.storeVersionHistory(
        'tax_settings',
        savedSettings.id,
        savedSettings,
        update.updatedBy,
        update.reason,
        update.metadata,
      );

      // Emit real-time event
      await this.emitRealTimeConfigEvent({
        eventType: previousConfig ? 'updated' : 'created',
        configType: 'tax_settings',
        configId: savedSettings.id,
        configuration: savedSettings,
        previousConfiguration: previousConfig,
        effectiveDate: new Date(),
        updatedBy: update.updatedBy,
        timestamp: new Date(),
        metadata: update.metadata,
      });

      this.logger.log(
        `Updated tax settings configuration: ${savedSettings.id}`,
      );
      return { config: savedSettings, version: versionInfo };
    } catch (error) {
      this.logger.error('Failed to update tax settings configuration', error);
      throw error;
    }
  }

  async getTaxSettings(): Promise<TaxSettingsEntity> {
    // Try to get the first (and usually only) tax settings record
    const cached = Array.from(this.configCache.values()).find(
      (config) => config.constructor.name === 'TaxSettingsEntity',
    );

    if (cached) {
      return cached;
    }

    const settings = await this.taxSettingsRepository.findOne({
      order: { createdAt: 'DESC' },
    });

    if (!settings) {
      throw new NotFoundException('Tax settings configuration not found');
    }

    // Update cache
    this.configCache.set(`tax_settings_${settings.id}`, settings);
    return settings;
  }

  // Configuration Versioning and Rollback
  async getVersionHistory(
    configType: string,
    configId: string,
    limit?: number,
  ): Promise<TaxConfigVersionInfo[]> {
    const key = `${configType}_${configId}`;
    const versions = this.versionHistory.get(key) || [];

    if (limit) {
      return versions.slice(0, limit);
    }

    return versions;
  }

  async rollbackConfiguration(
    configType: string,
    configId: string,
    targetVersion: number,
    rolledBackBy: string,
    reason: string,
  ): Promise<{ config: any; version: TaxConfigVersionInfo }> {
    const versions = await this.getVersionHistory(configType, configId);
    const targetVersionInfo = versions.find((v) => v.version === targetVersion);

    if (!targetVersionInfo) {
      throw new NotFoundException(
        `Version ${targetVersion} not found for ${configType} ${configId}`,
      );
    }

    const rollbackUpdate: DynamicTaxConfigUpdate = {
      configType: configType as 'tax_rule' | 'tax_settings',
      configId,
      configuration: targetVersionInfo.configuration,
      effectiveDate: new Date(),
      updatedBy: rolledBackBy,
      reason: `Rollback to version ${targetVersion}: ${reason}`,
      metadata: {
        rollback: true,
        targetVersion,
        originalReason: reason,
      },
    };

    if (configType === 'tax_rule') {
      const result = await this.updateTaxRuleConfig(rollbackUpdate);

      // Emit rollback event
      await this.emitRealTimeConfigEvent({
        eventType: 'rollback',
        configType: 'tax_rule',
        configId,
        configuration: result.config,
        effectiveDate: new Date(),
        updatedBy: rolledBackBy,
        timestamp: new Date(),
        metadata: { targetVersion, reason },
      });

      return result;
    } else {
      const result = await this.updateTaxSettings(rollbackUpdate);

      // Emit rollback event
      await this.emitRealTimeConfigEvent({
        eventType: 'rollback',
        configType: 'tax_settings',
        configId,
        configuration: result.config,
        effectiveDate: new Date(),
        updatedBy: rolledBackBy,
        timestamp: new Date(),
        metadata: { targetVersion, reason },
      });

      return result;
    }
  }

  // Configuration Validation
  async validateTaxConfiguration(
    configType: string,
    configuration: any,
    region?: string,
    taxType?: string,
  ): Promise<TaxConfigValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];
    const suggestions: string[] = [];

    try {
      if (configType === 'tax_rule') {
        // Validate tax rule configuration
        if (!configuration.name || configuration.name.trim().length === 0) {
          errors.push('Tax rule name is required');
        }

        if (!configuration.taxType) {
          errors.push('Tax type is required');
        }

        if (!configuration.rate && configuration.rate !== 0) {
          errors.push('Tax rate is required');
        }

        if (configuration.rate < 0 || configuration.rate > 100) {
          errors.push('Tax rate must be between 0 and 100');
        }

        if (!configuration.region) {
          warnings.push('Region not specified - rule will apply globally');
        }

        // Check for conflicting rules
        const existingRules = await this.getTaxRuleConfigs({
          region: region || configuration.region,
          taxType: taxType || configuration.taxType,
          isActive: true,
        });

        if (existingRules.length > 0) {
          warnings.push(
            `${existingRules.length} existing active rules found for this region and tax type`,
          );
          suggestions.push(
            'Consider setting priority to ensure correct rule precedence',
          );
        }
      } else if (configType === 'tax_settings') {
        // Validate tax settings configuration
        if (
          configuration.defaultTaxRate &&
          (configuration.defaultTaxRate < 0 ||
            configuration.defaultTaxRate > 100)
        ) {
          errors.push('Default tax rate must be between 0 and 100');
        }

        if (
          configuration.taxCalculationPrecision &&
          configuration.taxCalculationPrecision < 0
        ) {
          errors.push('Tax calculation precision must be non-negative');
        }

        if (
          configuration.roundingMethod &&
          !['round', 'floor', 'ceil'].includes(configuration.roundingMethod)
        ) {
          errors.push('Rounding method must be one of: round, floor, ceil');
        }
      }

      return {
        isValid: errors.length === 0,
        errors,
        warnings,
        suggestions,
      };
    } catch (error) {
      this.logger.error('Error validating tax configuration', error);
      return {
        isValid: false,
        errors: ['Validation failed due to internal error'],
        warnings: [],
        suggestions: [],
      };
    }
  }

  // Private helper methods
  private async storeVersionHistory(
    configType: string,
    configId: string,
    configuration: any,
    updatedBy: string,
    reason: string,
    metadata?: Record<string, any>,
  ): Promise<TaxConfigVersionInfo> {
    const key = `${configType}_${configId}`;
    const versions = this.versionHistory.get(key) || [];

    const versionInfo: TaxConfigVersionInfo = {
      version: this.getNextVersionNumber(key),
      configId,
      configType,
      configuration: JSON.parse(JSON.stringify(configuration)), // Deep copy
      effectiveDate: configuration.effectiveDate || new Date(),
      expiryDate: configuration.expiryDate,
      updatedBy,
      updatedAt: new Date(),
      reason,
      metadata,
    };

    versions.unshift(versionInfo); // Add to beginning

    // Keep only last 50 versions
    if (versions.length > 50) {
      versions.splice(50);
    }

    this.versionHistory.set(key, versions);
    return versionInfo;
  }

  private getNextVersionNumber(key: string): number {
    const versions = this.versionHistory.get(key) || [];
    return versions.length > 0
      ? Math.max(...versions.map((v) => v.version)) + 1
      : 1;
  }

  private async emitRealTimeConfigEvent(
    event: RealTimeTaxConfigEvent,
  ): Promise<void> {
    try {
      this.eventEmitter.emit(`tax.config.${event.eventType}`, event);
      this.logger.debug(
        `Emitted tax config event: ${event.eventType} for ${event.configType} ${event.configId}`,
      );
    } catch (error) {
      this.logger.error('Failed to emit real-time tax config event', error);
    }
  }

  // Cache management
  clearCache(): void {
    this.configCache.clear();
    this.logger.log('Tax configuration cache cleared');
  }

  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.configCache.size,
      keys: Array.from(this.configCache.keys()),
    };
  }

  // Additional methods required by the controller
  async calculateTax(
    amount: number,
    region?: string,
    taxType?: string,
  ): Promise<{
    originalAmount: number;
    taxAmount: number;
    totalAmount: number;
    appliedRules: any[];
    breakdown: any[];
  }> {
    try {
      const applicableRules = await this.getTaxRuleConfigs({
        region,
        taxType,
        isActive: true,
        effectiveDate: new Date(),
      });

      let totalTaxAmount = 0;
      const appliedRules = [];
      const breakdown = [];

      for (const rule of applicableRules) {
        const taxAmount = (amount * rule.rate) / 100;
        totalTaxAmount += taxAmount;

        appliedRules.push({
          id: rule.id,
          name: rule.name,
          rate: rule.rate,
          taxAmount,
        });

        breakdown.push({
          ruleId: rule.id,
          ruleName: rule.name,
          rate: rule.rate,
          baseAmount: amount,
          taxAmount,
        });
      }

      return {
        originalAmount: amount,
        taxAmount: totalTaxAmount,
        totalAmount: amount + totalTaxAmount,
        appliedRules,
        breakdown,
      };
    } catch (error) {
      this.logger.error('Failed to calculate tax', error);
      throw error;
    }
  }

  async getTaxConfigStatistics(): Promise<{
    totalRules: number;
    activeRules: number;
    inactiveRules: number;
    regionCoverage: string[];
    taxTypes: string[];
    lastUpdated: Date;
  }> {
    try {
      const allRules = await this.taxRuleRepository.find();
      const activeRules = allRules.filter(
        (rule) => rule.status === TaxRuleStatus.ACTIVE,
      );
      const inactiveRules = allRules.filter(
        (rule) => rule.status !== TaxRuleStatus.ACTIVE,
      );

      const regions = new Set<string>();
      const taxTypes = new Set<string>();
      let lastUpdated = new Date(0);

      for (const rule of allRules) {
        if (rule.applicableRegions) {
          rule.applicableRegions.forEach((region) => regions.add(region));
        }
        if (rule.taxType) {
          taxTypes.add(rule.taxType);
        }
        if (rule.updatedAt && rule.updatedAt > lastUpdated) {
          lastUpdated = rule.updatedAt;
        }
      }

      return {
        totalRules: allRules.length,
        activeRules: activeRules.length,
        inactiveRules: inactiveRules.length,
        regionCoverage: Array.from(regions),
        taxTypes: Array.from(taxTypes),
        lastUpdated,
      };
    } catch (error) {
      this.logger.error('Failed to get tax config statistics', error);
      throw error;
    }
  }

  async exportTaxConfigurations(): Promise<{
    taxRules: TaxRuleEntity[];
    taxSettings: TaxSettingsEntity[];
    exportedAt: Date;
    version: string;
  }> {
    try {
      const taxRules = await this.taxRuleRepository.find();
      const taxSettings = await this.taxSettingsRepository.find();

      return {
        taxRules,
        taxSettings,
        exportedAt: new Date(),
        version: '1.0',
      };
    } catch (error) {
      this.logger.error('Failed to export tax configurations', error);
      throw error;
    }
  }

  async importTaxConfigurations(
    importData: {
      taxRules?: any[];
      taxSettings?: any[];
      overwriteExisting?: boolean;
    },
    importedBy: string,
  ): Promise<{
    imported: {
      taxRules: number;
      taxSettings: number;
    };
    skipped: {
      taxRules: number;
      taxSettings: number;
    };
    errors: string[];
  }> {
    try {
      const result = {
        imported: { taxRules: 0, taxSettings: 0 },
        skipped: { taxRules: 0, taxSettings: 0 },
        errors: [],
      };

      // Import tax rules
      if (importData.taxRules) {
        for (const ruleData of importData.taxRules) {
          try {
            const existingRule = await this.taxRuleRepository.findOne({
              where: { name: ruleData.name },
            });

            if (existingRule && !importData.overwriteExisting) {
              result.skipped.taxRules++;
              continue;
            }

            if (existingRule && importData.overwriteExisting) {
              Object.assign(existingRule, {
                ...ruleData,
                updatedAt: new Date(),
                updatedBy: importedBy,
              });
              await this.taxRuleRepository.save(existingRule);
            } else {
              const newRule = this.taxRuleRepository.create({
                ...ruleData,
                createdBy: importedBy,
                updatedBy: importedBy,
              });
              await this.taxRuleRepository.save(newRule);
            }

            result.imported.taxRules++;
          } catch (error) {
            result.errors.push(
              `Failed to import tax rule ${ruleData.name}: ${error.message}`,
            );
          }
        }
      }

      // Import tax settings
      if (importData.taxSettings) {
        for (const settingData of importData.taxSettings) {
          try {
            const existingSetting = await this.taxSettingsRepository.findOne({
              where: { id: settingData.id },
            });

            if (existingSetting && !importData.overwriteExisting) {
              result.skipped.taxSettings++;
              continue;
            }

            if (existingSetting && importData.overwriteExisting) {
              Object.assign(existingSetting, {
                ...settingData,
                updatedAt: new Date(),
                updatedBy: importedBy,
              });
              await this.taxSettingsRepository.save(existingSetting);
            } else {
              const newSetting = this.taxSettingsRepository.create({
                ...settingData,
                createdBy: importedBy,
                updatedBy: importedBy,
              });
              await this.taxSettingsRepository.save(newSetting);
            }

            result.imported.taxSettings++;
          } catch (error) {
            result.errors.push(
              `Failed to import tax setting for ${settingData.region}: ${error.message}`,
            );
          }
        }
      }

      // Refresh cache after import
      await this.initializeConfigCache();

      this.logger.log(`Import completed: ${JSON.stringify(result)}`);
      return result;
    } catch (error) {
      this.logger.error('Failed to import tax configurations', error);
      throw error;
    }
  }

  async validateTaxRuleConfig(
    configId: string,
  ): Promise<TaxConfigValidationResult> {
    try {
      const rule = await this.taxRuleRepository.findOne({
        where: { id: configId },
      });

      if (!rule) {
        return {
          isValid: false,
          errors: [`Tax rule with ID ${configId} not found`],
          warnings: [],
          suggestions: [],
        };
      }

      return await this.validateTaxConfiguration('tax_rule', rule);
    } catch (error) {
      this.logger.error('Failed to validate tax rule config', error);
      return {
        isValid: false,
        errors: [`Validation failed: ${error.message}`],
        warnings: [],
        suggestions: [],
      };
    }
  }

  async rollbackTaxRuleConfig(
    id: string,
    targetVersion: number,
    userId: string,
    reason: string,
  ): Promise<any> {
    // Implementation for rolling back tax rule configuration to a previous version
    const history = await this.getVersionHistory('tax_rule', id);
    const targetConfig = history.find((h) => h.version === targetVersion);

    if (!targetConfig) {
      throw new Error(`Version ${targetVersion} not found for tax rule ${id}`);
    }

    // Update the current configuration with the target version's data
    const rollbackData: DynamicTaxConfigUpdate = {
      configType: 'tax_rule',
      configId: id,
      configuration: targetConfig.configuration,
      updatedBy: userId,
      reason: reason,
      metadata: {
        rollback: true,
        targetVersion,
      },
    };

    return await this.updateTaxRuleConfig(rollbackData);
  }
}
