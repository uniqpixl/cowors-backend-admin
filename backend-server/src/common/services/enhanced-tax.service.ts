import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import {
  ConfigurationScope,
  ConfigurationType,
} from '../types/financial-configuration.types';
import { FinancialConfigIntegrationService } from './financial-config-integration.service';

export interface EnhancedTaxSettings {
  defaultGSTRate: number;
  defaultTCSRate: number;
  defaultTDSRate: number;
  autoCalculateTax: boolean;
  autoCollectTax: boolean;
  taxExemptCategories: string[];
  complianceSettings: {
    gstinValidationRequired: boolean;
    panValidationRequired: boolean;
    automaticFilingEnabled: boolean;
    reminderDays: number;
    penaltyCalculationEnabled: boolean;
  };
  stateSpecificRates?: Array<{
    stateCode: string;
    gstRate: number;
    cessRate?: number;
    additionalTaxes?: Record<string, number>;
  }>;
  categorySpecificRates?: Array<{
    category: string;
    gstRate: number;
    tcsRate?: number;
    tdsRate?: number;
    exemptFromTax?: boolean;
  }>;
  thresholdLimits?: {
    tcsThreshold: number;
    tdsThreshold: number;
    gstRegistrationThreshold: number;
  };
}

export interface TaxCalculationContext {
  partnerId: string;
  category?: string;
  stateCode?: string;
  transactionAmount: number;
  transactionType: string;
  bookingId?: string;
  spaceId?: string;
  customerGstin?: string;
  partnerGstin?: string;
  isInterstate?: boolean;
}

export interface TaxCalculationResult {
  gstAmount: number;
  tcsAmount: number;
  tdsAmount: number;
  cessAmount: number;
  totalTaxAmount: number;
  taxBreakdown: {
    cgst: number;
    sgst: number;
    igst: number;
    tcs: number;
    tds: number;
    cess: number;
  };
  appliedRates: {
    gstRate: number;
    tcsRate: number;
    tdsRate: number;
    cessRate: number;
  };
  appliedSettings: EnhancedTaxSettings;
  exemptions: {
    gstExempt: boolean;
    tcsExempt: boolean;
    tdsExempt: boolean;
    exemptionReason?: string;
  };
  complianceInfo: {
    gstinRequired: boolean;
    panRequired: boolean;
    filingRequired: boolean;
    nextFilingDate?: Date;
  };
}

export interface TaxComplianceStatus {
  partnerId: string;
  gstinStatus: 'valid' | 'invalid' | 'pending' | 'not_required';
  panStatus: 'valid' | 'invalid' | 'pending' | 'not_required';
  filingStatus: 'up_to_date' | 'overdue' | 'pending' | 'not_required';
  nextFilingDate?: Date;
  overdueAmount?: number;
  penaltyAmount?: number;
  lastUpdated: Date;
}

/**
 * Enhanced Tax Service that uses dynamic configuration system
 * for real-time tax rate management and calculation
 */
@Injectable()
export class EnhancedTaxService implements OnModuleInit {
  private readonly logger = new Logger(EnhancedTaxService.name);
  private cachedSettings = new Map<string, EnhancedTaxSettings>();
  private complianceCache = new Map<string, TaxComplianceStatus>();

  constructor(
    private readonly configIntegrationService: FinancialConfigIntegrationService,
  ) {}

  async onModuleInit() {
    // Load initial settings
    await this.loadInitialSettings();
    this.logger.log('Enhanced Tax Service initialized');
  }

  /**
   * Load initial tax settings from dynamic configuration
   */
  private async loadInitialSettings(): Promise<void> {
    try {
      const globalSettings =
        await this.configIntegrationService.getTaxSettings();
      this.cachedSettings.set('global', globalSettings);
      this.logger.log('Initial tax settings loaded');
    } catch (error) {
      this.logger.error('Failed to load initial tax settings', error.stack);
    }
  }

  /**
   * Get tax settings for a specific context
   */
  async getTaxSettings(
    partnerId?: string,
    stateCode?: string,
    category?: string,
  ): Promise<EnhancedTaxSettings> {
    const cacheKey = this.buildCacheKey(partnerId, stateCode, category);

    if (this.cachedSettings.has(cacheKey)) {
      return this.cachedSettings.get(cacheKey)!;
    }

    // Get effective configuration from dynamic config service
    const config = await this.configIntegrationService.getTaxSettings(
      partnerId,
      stateCode,
    );

    // Apply category and state overrides if applicable
    const enhancedSettings = await this.applyContextualOverrides(
      config,
      stateCode,
      category,
    );

    this.cachedSettings.set(cacheKey, enhancedSettings);
    return enhancedSettings;
  }

  /**
   * Calculate tax for a given context
   */
  async calculateTax(
    context: TaxCalculationContext,
  ): Promise<TaxCalculationResult> {
    const settings = await this.getTaxSettings(
      context.partnerId,
      context.stateCode,
      context.category,
    );

    // Check for exemptions
    const exemptions = this.checkTaxExemptions(settings, context);

    // Get applicable rates
    const appliedRates = this.getApplicableRates(settings, context);

    // Calculate individual tax components
    const gstAmount = exemptions.gstExempt
      ? 0
      : this.calculateGST(
          context.transactionAmount,
          appliedRates.gstRate,
          context.isInterstate,
        );
    const tcsAmount = exemptions.tcsExempt
      ? 0
      : this.calculateTCS(
          context.transactionAmount,
          appliedRates.tcsRate,
          settings.thresholdLimits?.tcsThreshold,
        );
    const tdsAmount = exemptions.tdsExempt
      ? 0
      : this.calculateTDS(
          context.transactionAmount,
          appliedRates.tdsRate,
          settings.thresholdLimits?.tdsThreshold,
        );
    const cessAmount = this.calculateCess(
      context.transactionAmount,
      appliedRates.cessRate,
    );

    // Calculate GST breakdown
    const taxBreakdown = this.calculateGSTBreakdown(
      gstAmount,
      context.isInterstate,
    );

    const totalTaxAmount = gstAmount + tcsAmount + tdsAmount + cessAmount;

    // Get compliance information
    const complianceInfo = await this.getComplianceInfo(
      context.partnerId,
      settings,
    );

    return {
      gstAmount,
      tcsAmount,
      tdsAmount,
      cessAmount,
      totalTaxAmount,
      taxBreakdown: {
        ...taxBreakdown,
        tcs: tcsAmount,
        tds: tdsAmount,
        cess: cessAmount,
      },
      appliedRates,
      appliedSettings: settings,
      exemptions,
      complianceInfo,
    };
  }

  /**
   * Update tax settings with real-time propagation
   */
  async updateTaxSettings(
    settings: Partial<EnhancedTaxSettings>,
    scope: ConfigurationScope = ConfigurationScope.GLOBAL,
    scopeId?: string,
    userId?: string,
    reason?: string,
  ): Promise<void> {
    await this.configIntegrationService.updateTaxSettings(
      settings,
      scope,
      scopeId,
      userId,
      reason,
    );

    // Clear relevant cache entries
    this.clearCacheForScope(scope, scopeId);

    this.logger.log(`Tax settings updated for ${scope}:${scopeId || 'global'}`);
  }

  /**
   * Get tax calculation history for audit
   */
  async getTaxHistory(
    scope: ConfigurationScope = ConfigurationScope.GLOBAL,
    scopeId?: string,
  ): Promise<any[]> {
    return await this.configIntegrationService.getConfigurationHistory(
      ConfigurationType.TAX_SETTINGS,
      scope,
      scopeId,
    );
  }

  /**
   * Rollback tax settings to a previous version
   */
  async rollbackTaxSettings(
    targetVersion: number,
    scope: ConfigurationScope = ConfigurationScope.GLOBAL,
    scopeId?: string,
    userId?: string,
    reason?: string,
  ): Promise<void> {
    await this.configIntegrationService.rollbackConfiguration(
      ConfigurationType.TAX_SETTINGS,
      targetVersion,
      scope,
      scopeId,
      userId,
      reason,
    );

    // Clear relevant cache entries
    this.clearCacheForScope(scope, scopeId);

    this.logger.log(`Tax settings rolled back to version ${targetVersion}`);
  }

  /**
   * Validate tax settings before applying
   */
  async validateTaxSettings(
    settings: Partial<EnhancedTaxSettings>,
  ): Promise<{ isValid: boolean; errors?: string[] }> {
    return await this.configIntegrationService.validateConfiguration(
      ConfigurationType.TAX_SETTINGS,
      settings,
    );
  }

  /**
   * Get tax compliance status for a partner
   */
  async getTaxComplianceStatus(
    partnerId: string,
  ): Promise<TaxComplianceStatus> {
    if (this.complianceCache.has(partnerId)) {
      const cached = this.complianceCache.get(partnerId)!;
      // Check if cache is still valid (less than 1 hour old)
      if (Date.now() - cached.lastUpdated.getTime() < 3600000) {
        return cached;
      }
    }

    // Fetch fresh compliance status
    const status = await this.fetchComplianceStatus(partnerId);
    this.complianceCache.set(partnerId, status);
    return status;
  }

  /**
   * Update tax compliance status
   */
  async updateTaxComplianceStatus(
    partnerId: string,
    status: Partial<TaxComplianceStatus>,
  ): Promise<TaxComplianceStatus> {
    const currentStatus = await this.getTaxComplianceStatus(partnerId);
    const updatedStatus = {
      ...currentStatus,
      ...status,
      lastUpdated: new Date(),
    };

    this.complianceCache.set(partnerId, updatedStatus);

    // Emit event for compliance status change
    this.logger.log(`Tax compliance status updated for partner ${partnerId}`);

    return updatedStatus;
  }

  /**
   * Subscribe to partner-specific tax changes
   */
  async subscribeToPartnerTaxChanges(
    partnerId: string,
    callback: (settings: EnhancedTaxSettings) => void,
  ): Promise<() => void> {
    return await this.configIntegrationService.subscribeToPartnerConfig(
      partnerId,
      ConfigurationType.TAX_SETTINGS,
      (config) => {
        this.clearCacheForPartner(partnerId);
        callback(config);
      },
    );
  }

  /**
   * Subscribe to state-specific tax changes
   */
  async subscribeToStateTaxChanges(
    stateCode: string,
    callback: (settings: EnhancedTaxSettings) => void,
  ): Promise<() => void> {
    return await this.configIntegrationService.subscribeToCategoryConfig(
      stateCode,
      ConfigurationType.TAX_SETTINGS,
      (config) => {
        this.clearCacheForState(stateCode);
        callback(config);
      },
    );
  }

  /**
   * Handle tax configuration changes
   */
  @OnEvent('financial.config.tax.changed')
  handleTaxConfigChange(payload: { config: any; timestamp: Date }) {
    this.logger.log('Tax configuration changed, clearing cache');
    this.cachedSettings.clear();

    // Reload global settings
    this.loadInitialSettings();
  }

  /**
   * Calculate GST amount
   */
  private calculateGST(
    amount: number,
    rate: number,
    isInterstate?: boolean,
  ): number {
    return (amount * rate) / 100;
  }

  /**
   * Calculate TCS amount with threshold check
   */
  private calculateTCS(
    amount: number,
    rate: number,
    threshold?: number,
  ): number {
    if (threshold && amount < threshold) {
      return 0;
    }
    return (amount * rate) / 100;
  }

  /**
   * Calculate TDS amount with threshold check
   */
  private calculateTDS(
    amount: number,
    rate: number,
    threshold?: number,
  ): number {
    if (threshold && amount < threshold) {
      return 0;
    }
    return (amount * rate) / 100;
  }

  /**
   * Calculate Cess amount
   */
  private calculateCess(amount: number, rate: number): number {
    return (amount * rate) / 100;
  }

  /**
   * Calculate GST breakdown (CGST/SGST or IGST)
   */
  private calculateGSTBreakdown(
    gstAmount: number,
    isInterstate?: boolean,
  ): {
    cgst: number;
    sgst: number;
    igst: number;
  } {
    if (isInterstate) {
      return {
        cgst: 0,
        sgst: 0,
        igst: gstAmount,
      };
    } else {
      return {
        cgst: gstAmount / 2,
        sgst: gstAmount / 2,
        igst: 0,
      };
    }
  }

  /**
   * Check for tax exemptions
   */
  private checkTaxExemptions(
    settings: EnhancedTaxSettings,
    context: TaxCalculationContext,
  ): TaxCalculationResult['exemptions'] {
    let gstExempt = false;
    let tcsExempt = false;
    let tdsExempt = false;
    let exemptionReason: string | undefined;

    // Check category exemptions
    if (
      context.category &&
      settings.taxExemptCategories.includes(context.category)
    ) {
      gstExempt = true;
      exemptionReason = `Category ${context.category} is exempt from GST`;
    }

    // Check category-specific exemptions
    if (context.category && settings.categorySpecificRates) {
      const categoryRate = settings.categorySpecificRates.find(
        (rate) => rate.category === context.category,
      );
      if (categoryRate?.exemptFromTax) {
        gstExempt = true;
        tcsExempt = true;
        tdsExempt = true;
        exemptionReason = `Category ${context.category} is fully exempt from taxes`;
      }
    }

    return {
      gstExempt,
      tcsExempt,
      tdsExempt,
      exemptionReason,
    };
  }

  /**
   * Get applicable tax rates for context
   */
  private getApplicableRates(
    settings: EnhancedTaxSettings,
    context: TaxCalculationContext,
  ): TaxCalculationResult['appliedRates'] {
    let gstRate = settings.defaultGSTRate;
    let tcsRate = settings.defaultTCSRate;
    let tdsRate = settings.defaultTDSRate;
    let cessRate = 0;

    // Apply state-specific rates
    if (context.stateCode && settings.stateSpecificRates) {
      const stateRate = settings.stateSpecificRates.find(
        (rate) => rate.stateCode === context.stateCode,
      );
      if (stateRate) {
        gstRate = stateRate.gstRate;
        cessRate = stateRate.cessRate || 0;
      }
    }

    // Apply category-specific rates
    if (context.category && settings.categorySpecificRates) {
      const categoryRate = settings.categorySpecificRates.find(
        (rate) => rate.category === context.category,
      );
      if (categoryRate) {
        gstRate = categoryRate.gstRate;
        tcsRate = categoryRate.tcsRate || tcsRate;
        tdsRate = categoryRate.tdsRate || tdsRate;
      }
    }

    return {
      gstRate,
      tcsRate,
      tdsRate,
      cessRate,
    };
  }

  /**
   * Get compliance information for a partner
   */
  private async getComplianceInfo(
    partnerId: string,
    settings: EnhancedTaxSettings,
  ): Promise<TaxCalculationResult['complianceInfo']> {
    const complianceStatus = await this.getTaxComplianceStatus(partnerId);

    return {
      gstinRequired: settings.complianceSettings.gstinValidationRequired,
      panRequired: settings.complianceSettings.panValidationRequired,
      filingRequired: settings.complianceSettings.automaticFilingEnabled,
      nextFilingDate: complianceStatus.nextFilingDate,
    };
  }

  /**
   * Fetch compliance status from external sources or database
   */
  private async fetchComplianceStatus(
    partnerId: string,
  ): Promise<TaxComplianceStatus> {
    // This would typically fetch from database or external compliance APIs
    // For now, return a default status
    return {
      partnerId,
      gstinStatus: 'pending',
      panStatus: 'pending',
      filingStatus: 'up_to_date',
      lastUpdated: new Date(),
    };
  }

  /**
   * Apply contextual overrides to base configuration
   */
  private async applyContextualOverrides(
    baseConfig: any,
    stateCode?: string,
    category?: string,
  ): Promise<EnhancedTaxSettings> {
    // This method can be extended to apply state-specific or category-specific overrides
    return baseConfig;
  }

  /**
   * Build cache key for settings
   */
  private buildCacheKey(
    partnerId?: string,
    stateCode?: string,
    category?: string,
  ): string {
    const parts = ['tax'];
    if (partnerId) parts.push(`partner:${partnerId}`);
    if (stateCode) parts.push(`state:${stateCode}`);
    if (category) parts.push(`category:${category}`);
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
        scope === ConfigurationScope.REGION &&
        scopeId &&
        key.includes(`state:${scopeId}`)
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

    // Also clear compliance cache
    this.complianceCache.delete(partnerId);
  }

  /**
   * Clear cache for specific state
   */
  private clearCacheForState(stateCode: string): void {
    const keysToDelete: string[] = [];

    for (const key of this.cachedSettings.keys()) {
      if (key.includes(`state:${stateCode}`)) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach((key) => this.cachedSettings.delete(key));
  }

  /**
   * Get tax statistics for monitoring
   */
  async getTaxStatistics(): Promise<{
    totalCachedSettings: number;
    totalComplianceRecords: number;
    globalSettings: EnhancedTaxSettings | null;
    cacheKeys: string[];
  }> {
    return {
      totalCachedSettings: this.cachedSettings.size,
      totalComplianceRecords: this.complianceCache.size,
      globalSettings: this.cachedSettings.get('global') || null,
      cacheKeys: Array.from(this.cachedSettings.keys()),
    };
  }

  /**
   * Export tax settings for backup
   */
  async exportTaxSettings(): Promise<any[]> {
    return await this.configIntegrationService.exportConfigurations([
      ConfigurationType.TAX_SETTINGS,
    ]);
  }

  /**
   * Import tax settings from backup
   */
  async importTaxSettings(
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
    this.complianceCache.clear();
    await this.loadInitialSettings();

    return result;
  }
}
