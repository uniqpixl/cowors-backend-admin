import {
  ConfigurationScope,
  ConfigurationType,
} from '@/common/types/financial-configuration.types';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { FinancialConfigIntegrationService } from './financial-config-integration.service';

export interface EnhancedCommissionSettings {
  defaultCommissionPercentage: number;
  minimumCommission: number;
  maximumCommission: number;
  paymentTermDays: number;
  autoPayment: boolean;
  holdbackPercentage: number;
  paymentTerms?: {
    schedule: string;
    autoApproval: boolean;
    paymentDays: number;
  };
  performanceMultipliers: {
    bronze: number;
    silver: number;
    gold: number;
    platinum: number;
  };
  categoryOverrides?: Array<{
    category: string;
    commissionPercentage: number;
    minimumCommission?: number;
    maximumCommission?: number;
  }>;
  partnerTiers?: Array<{
    partnerId: string;
    tier: string;
    multiplier: number;
    customRates?: Record<string, number>;
  }>;
}

export interface CommissionCalculationContext {
  partnerId: string;
  category?: string;
  region?: string;
  transactionAmount: number;
  transactionType: string;
  bookingId?: string;
  spaceId?: string;
}

export interface CommissionCalculationResult {
  baseCommission: number;
  performanceBonus: number;
  categoryAdjustment: number;
  partnerTierAdjustment: number;
  totalCommission: number;
  effectiveRate: number;
  appliedSettings: EnhancedCommissionSettings;
  calculationBreakdown: {
    baseRate: number;
    performanceMultiplier: number;
    categoryMultiplier: number;
    partnerMultiplier: number;
    minimumApplied: boolean;
    maximumApplied: boolean;
  };
}

/**
 * Enhanced Commission Service that uses dynamic configuration system
 * for real-time commission rate management and calculation
 */
@Injectable()
export class EnhancedCommissionService implements OnModuleInit {
  private readonly logger = new Logger(EnhancedCommissionService.name);
  private cachedSettings = new Map<string, EnhancedCommissionSettings>();

  constructor(
    private readonly configIntegrationService: FinancialConfigIntegrationService,
  ) {}

  async onModuleInit() {
    // Load initial settings
    await this.loadInitialSettings();
    this.logger.log('Enhanced Commission Service initialized');
  }

  /**
   * Load initial commission settings from dynamic configuration
   */
  private async loadInitialSettings(): Promise<void> {
    try {
      const globalSettings =
        await this.configIntegrationService.getCommissionSettings();
      this.cachedSettings.set('global', globalSettings);
      this.logger.log('Initial commission settings loaded');
    } catch (error) {
      this.logger.error(
        'Failed to load initial commission settings',
        error.stack,
      );
    }
  }

  /**
   * Get commission settings for a specific context
   */
  async getCommissionSettings(
    partnerId?: string,
    category?: string,
    region?: string,
  ): Promise<EnhancedCommissionSettings> {
    const cacheKey = this.buildCacheKey(partnerId, category, region);

    if (this.cachedSettings.has(cacheKey)) {
      return this.cachedSettings.get(cacheKey)!;
    }

    // Get effective configuration from dynamic config service
    const config =
      await this.configIntegrationService.getCommissionSettings(partnerId);

    // Apply category and region overrides if applicable
    const enhancedSettings = await this.applyContextualOverrides(
      config,
      category,
      region,
    );

    this.cachedSettings.set(cacheKey, enhancedSettings);
    return enhancedSettings;
  }

  /**
   * Calculate commission for a given context
   */
  async calculateCommission(
    context: CommissionCalculationContext,
  ): Promise<CommissionCalculationResult> {
    const settings = await this.getCommissionSettings(
      context.partnerId,
      context.category,
      context.region,
    );

    // Base commission calculation
    const baseRate = this.getBaseCommissionRate(settings, context);
    const baseCommission = (context.transactionAmount * baseRate) / 100;

    // Performance bonus calculation
    const performanceMultiplier = this.getPerformanceMultiplier(
      settings,
      context.partnerId,
    );
    const performanceBonus = baseCommission * (performanceMultiplier - 1);

    // Category adjustment
    const categoryMultiplier = this.getCategoryMultiplier(
      settings,
      context.category,
    );
    const categoryAdjustment = baseCommission * (categoryMultiplier - 1);

    // Partner tier adjustment
    const partnerMultiplier = await this.getPartnerTierMultiplier(
      settings,
      context.partnerId,
    );
    const partnerTierAdjustment = baseCommission * (partnerMultiplier - 1);

    // Calculate total before min/max constraints
    let totalCommission =
      baseCommission +
      performanceBonus +
      categoryAdjustment +
      partnerTierAdjustment;

    // Apply minimum and maximum constraints
    const minimumApplied = totalCommission < settings.minimumCommission;
    const maximumApplied = totalCommission > settings.maximumCommission;

    if (minimumApplied) {
      totalCommission = settings.minimumCommission;
    } else if (maximumApplied) {
      totalCommission = settings.maximumCommission;
    }

    const effectiveRate = (totalCommission / context.transactionAmount) * 100;

    return {
      baseCommission,
      performanceBonus,
      categoryAdjustment,
      partnerTierAdjustment,
      totalCommission,
      effectiveRate,
      appliedSettings: settings,
      calculationBreakdown: {
        baseRate,
        performanceMultiplier,
        categoryMultiplier,
        partnerMultiplier,
        minimumApplied,
        maximumApplied,
      },
    };
  }

  /**
   * Update commission settings with real-time propagation
   */
  async updateCommissionSettings(
    settings: Partial<EnhancedCommissionSettings>,
    scope: ConfigurationScope = ConfigurationScope.GLOBAL,
    scopeId?: string,
    userId?: string,
    reason?: string,
  ): Promise<void> {
    await this.configIntegrationService.updateCommissionSettings(
      settings,
      scope,
      scopeId,
      userId,
      reason,
    );

    // Clear relevant cache entries
    this.clearCacheForScope(scope, scopeId);

    this.logger.log(
      `Commission settings updated for ${scope}:${scopeId || 'global'}`,
    );
  }

  /**
   * Get commission calculation history for audit
   */
  async getCommissionHistory(
    scope: ConfigurationScope = ConfigurationScope.GLOBAL,
    scopeId?: string,
  ): Promise<any[]> {
    return await this.configIntegrationService.getConfigurationHistory(
      ConfigurationType.COMMISSION_SETTINGS,
      scope,
      scopeId,
    );
  }

  /**
   * Rollback commission settings to a previous version
   */
  async rollbackCommissionSettings(
    targetVersion: number,
    scope: ConfigurationScope = ConfigurationScope.GLOBAL,
    scopeId?: string,
    userId?: string,
    reason?: string,
  ): Promise<void> {
    await this.configIntegrationService.rollbackConfiguration(
      ConfigurationType.COMMISSION_SETTINGS,
      targetVersion,
      scope,
      scopeId,
      userId,
      reason,
    );

    // Clear relevant cache entries
    this.clearCacheForScope(scope, scopeId);

    this.logger.log(
      `Commission settings rolled back to version ${targetVersion}`,
    );
  }

  /**
   * Validate commission settings before applying
   */
  async validateCommissionSettings(
    settings: Partial<EnhancedCommissionSettings>,
  ): Promise<{ isValid: boolean; errors?: string[] }> {
    return await this.configIntegrationService.validateConfiguration(
      ConfigurationType.COMMISSION_SETTINGS,
      settings,
    );
  }

  /**
   * Subscribe to partner-specific commission changes
   */
  async subscribeToPartnerCommissionChanges(
    partnerId: string,
    callback: (settings: EnhancedCommissionSettings) => void,
  ): Promise<() => void> {
    return await this.configIntegrationService.subscribeToPartnerConfig(
      partnerId,
      ConfigurationType.COMMISSION_SETTINGS,
      (config) => {
        this.clearCacheForPartner(partnerId);
        callback(config);
      },
    );
  }

  /**
   * Subscribe to category-specific commission changes
   */
  async subscribeToCategoryCommissionChanges(
    category: string,
    callback: (settings: EnhancedCommissionSettings) => void,
  ): Promise<() => void> {
    return await this.configIntegrationService.subscribeToCategoryConfig(
      category,
      ConfigurationType.COMMISSION_SETTINGS,
      (config) => {
        this.clearCacheForCategory(category);
        callback(config);
      },
    );
  }

  /**
   * Handle commission configuration changes
   */
  @OnEvent('financial.config.commission.changed')
  handleCommissionConfigChange(payload: { config: any; timestamp: Date }) {
    this.logger.log('Commission configuration changed, clearing cache');
    this.cachedSettings.clear();

    // Reload global settings
    this.loadInitialSettings();
  }

  /**
   * Get base commission rate considering category overrides
   */
  private getBaseCommissionRate(
    settings: EnhancedCommissionSettings,
    context: CommissionCalculationContext,
  ): number {
    if (context.category && settings.categoryOverrides) {
      const categoryOverride = settings.categoryOverrides.find(
        (override) => override.category === context.category,
      );
      if (categoryOverride) {
        return categoryOverride.commissionPercentage;
      }
    }
    return settings.defaultCommissionPercentage;
  }

  /**
   * Get performance multiplier based on partner tier
   */
  private getPerformanceMultiplier(
    settings: EnhancedCommissionSettings,
    partnerId: string,
  ): number {
    if (settings.partnerTiers) {
      const partnerTier = settings.partnerTiers.find(
        (tier) => tier.partnerId === partnerId,
      );
      if (partnerTier) {
        const tierMultiplier =
          settings.performanceMultipliers[
            partnerTier.tier as keyof typeof settings.performanceMultipliers
          ];
        return tierMultiplier || 1.0;
      }
    }
    return settings.performanceMultipliers.bronze; // Default tier
  }

  /**
   * Get category-specific multiplier
   */
  private getCategoryMultiplier(
    settings: EnhancedCommissionSettings,
    category?: string,
  ): number {
    // This can be extended to include category-specific multipliers
    return 1.0;
  }

  /**
   * Get partner tier multiplier
   */
  private async getPartnerTierMultiplier(
    settings: EnhancedCommissionSettings,
    partnerId: string,
  ): Promise<number> {
    if (settings.partnerTiers) {
      const partnerTier = settings.partnerTiers.find(
        (tier) => tier.partnerId === partnerId,
      );
      if (partnerTier) {
        return partnerTier.multiplier;
      }
    }
    return 1.0;
  }

  /**
   * Apply contextual overrides to base configuration
   */
  private async applyContextualOverrides(
    baseConfig: any,
    category?: string,
    region?: string,
  ): Promise<EnhancedCommissionSettings> {
    // This method can be extended to apply region-specific or category-specific overrides
    return baseConfig;
  }

  /**
   * Build cache key for settings
   */
  private buildCacheKey(
    partnerId?: string,
    category?: string,
    region?: string,
  ): string {
    const parts = ['commission'];
    if (partnerId) parts.push(`partner:${partnerId}`);
    if (category) parts.push(`category:${category}`);
    if (region) parts.push(`region:${region}`);
    return parts.join('_');
  }

  /**
   * Clear cache for specific scope
   */
  private clearCacheForScope(
    scope: ConfigurationScope,
    scopeId?: string,
  ): void {
    const keysToDelete: string[] = [];

    for (const key of this.cachedSettings.keys()) {
      if (scope === ConfigurationScope.GLOBAL && !scopeId) {
        // Clear all cache for global changes
        keysToDelete.push(key);
      } else if (
        scope === ConfigurationScope.PARTNER &&
        scopeId &&
        key.includes(`partner:${scopeId}`)
      ) {
        keysToDelete.push(key);
      } else if (
        scope === ConfigurationScope.CATEGORY &&
        scopeId &&
        key.includes(`category:${scopeId}`)
      ) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach((key) => this.cachedSettings.delete(key));
  }

  /**
   * Clear cache for specific partner
   */
  private clearCacheForPartner(partnerId: string): void {
    const keysToDelete: string[] = [];

    for (const key of this.cachedSettings.keys()) {
      if (key.includes(`partner:${partnerId}`)) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach((key) => this.cachedSettings.delete(key));
  }

  /**
   * Clear cache for specific category
   */
  private clearCacheForCategory(category: string): void {
    const keysToDelete: string[] = [];

    for (const key of this.cachedSettings.keys()) {
      if (key.includes(`category:${category}`)) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach((key) => this.cachedSettings.delete(key));
  }

  /**
   * Get commission statistics for monitoring
   */
  async getCommissionStatistics(): Promise<{
    totalCachedSettings: number;
    globalSettings: EnhancedCommissionSettings | null;
    cacheKeys: string[];
  }> {
    return {
      totalCachedSettings: this.cachedSettings.size,
      globalSettings: this.cachedSettings.get('global') || null,
      cacheKeys: Array.from(this.cachedSettings.keys()),
    };
  }

  /**
   * Export commission settings for backup
   */
  async exportCommissionSettings(): Promise<any[]> {
    return await this.configIntegrationService.exportConfigurations([
      ConfigurationType.COMMISSION_SETTINGS,
    ]);
  }

  /**
   * Import commission settings from backup
   */
  async importCommissionSettings(
    configurations: any[],
    overwriteExisting: boolean = false,
    userId?: string,
  ): Promise<{ imported: number; failed: number; errors: string[] }> {
    const result = await this.configIntegrationService.importConfigurations(
      configurations,
      overwriteExisting,
      userId,
    );

    // Clear cache after import
    this.cachedSettings.clear();
    await this.loadInitialSettings();

    return result;
  }
}
