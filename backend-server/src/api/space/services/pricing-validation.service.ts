import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  PartnerAddonEntity,
  PricingType,
} from '../../../database/entities/partner-addon.entity';
import {
  OverrideType,
  SpaceOptionExtrasEntity,
} from '../../../database/entities/space-option-extras.entity';
import {
  EnhancedPricingType,
  RecurringInterval,
  UsageUnit,
} from '../dto/pricing.dto';
import { SpacePackageEntity } from '../entities/space-inventory.entity';

export interface PricingCalculationRequest {
  pricingType: EnhancedPricingType;
  basePrice: number;
  currency: string;
  quantity?: number;
  duration?: number;
  usageAmount?: number;
  recurringPeriods?: number;
  discountPercentage?: number;
  taxPercentage?: number;
  // For tiered pricing
  pricingTiers?: Array<{
    minQuantity: number;
    maxQuantity?: number;
    pricePerUnit: number;
  }>;
  // For recurring pricing
  recurringInterval?: RecurringInterval;
  recurringCount?: number;
  // For usage-based pricing
  usageUnit?: UsageUnit;
  pricePerUnit?: number;
  minUsage?: number;
  maxUsage?: number;
}

export interface PricingCalculationResult {
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  currency: string;
  breakdown: {
    baseAmount: number;
    tierBreakdown?: Array<{
      tier: number;
      quantity: number;
      pricePerUnit: number;
      amount: number;
    }>;
    recurringBreakdown?: {
      periodsCalculated: number;
      amountPerPeriod: number;
    };
    usageBreakdown?: {
      usageCalculated: number;
      pricePerUnit: number;
    };
  };
  validationErrors?: string[];
}

export interface EffectivePricingResult {
  pricingType: EnhancedPricingType;
  basePrice: number;
  currency: string;
  recurringInterval?: RecurringInterval;
  recurringCount?: number;
  usageUnit?: UsageUnit;
  pricePerUnit?: number;
  minUsage?: number;
  maxUsage?: number;
  pricingTiers?: Array<{
    minQuantity: number;
    maxQuantity?: number;
    pricePerUnit: number;
  }>;
  source: 'original' | 'override';
  overrideDetails?: {
    overrideType: OverrideType;
    appliedFields: string[];
  };
}

@Injectable()
export class PricingValidationService {
  /**
   * Convert PricingType to EnhancedPricingType
   */
  private convertPricingType(pricingType: PricingType): EnhancedPricingType {
    switch (pricingType) {
      case PricingType.FLAT:
        return EnhancedPricingType.FLAT;
      case PricingType.RECURRING:
        return EnhancedPricingType.RECURRING;
      case PricingType.USAGE_BASED:
        return EnhancedPricingType.USAGE_BASED;
      default:
        throw new Error(`Unsupported pricing type: ${pricingType}`);
    }
  }
  constructor(
    @InjectRepository(SpacePackageEntity)
    private readonly spacePackageRepository: Repository<SpacePackageEntity>,
    @InjectRepository(PartnerAddonEntity)
    private readonly partnerAddonRepository: Repository<PartnerAddonEntity>,
    @InjectRepository(SpaceOptionExtrasEntity)
    private readonly spaceOptionExtrasRepository: Repository<SpaceOptionExtrasEntity>,
  ) {}

  /**
   * Validate pricing configuration
   */
  validatePricingConfiguration(pricing: any): string[] {
    const errors: string[] = [];

    if (!pricing.pricingType) {
      errors.push('Pricing type is required');
      return errors;
    }

    // Validate base price
    if (pricing.basePrice <= 0) {
      errors.push('Base price must be greater than 0');
    }

    // Validate currency
    if (!pricing.currency || pricing.currency.length !== 3) {
      errors.push('Valid 3-letter currency code is required');
    }

    // Type-specific validations
    switch (pricing.pricingType) {
      case EnhancedPricingType.FLAT:
        // No additional validation needed for flat pricing
        break;

      case EnhancedPricingType.RECURRING:
        if (!pricing.recurringInterval) {
          errors.push('Recurring interval is required for recurring pricing');
        }
        if (!pricing.recurringCount || pricing.recurringCount <= 0) {
          errors.push('Recurring count must be greater than 0');
        }
        break;

      case EnhancedPricingType.USAGE_BASED:
        if (!pricing.usageUnit) {
          errors.push('Usage unit is required for usage-based pricing');
        }
        if (!pricing.pricePerUnit || pricing.pricePerUnit <= 0) {
          errors.push(
            'Price per unit must be greater than 0 for usage-based pricing',
          );
        }
        if (
          pricing.minUsage &&
          pricing.maxUsage &&
          pricing.minUsage > pricing.maxUsage
        ) {
          errors.push('Minimum usage cannot be greater than maximum usage');
        }
        break;

      default:
        errors.push('Invalid pricing type');
    }

    return errors;
  }

  /**
   * Validate pricing tiers
   */
  private validatePricingTiers(tiers: any[]): string[] {
    const errors: string[] = [];

    // Sort tiers by minQuantity for validation
    const sortedTiers = [...tiers].sort(
      (a, b) => a.minQuantity - b.minQuantity,
    );

    for (let i = 0; i < sortedTiers.length; i++) {
      const tier = sortedTiers[i];

      // Validate tier structure
      if (!tier.minQuantity || tier.minQuantity <= 0) {
        errors.push(`Tier ${i + 1}: Minimum quantity must be greater than 0`);
      }

      if (!tier.pricePerUnit || tier.pricePerUnit <= 0) {
        errors.push(`Tier ${i + 1}: Price per unit must be greater than 0`);
      }

      if (tier.maxQuantity && tier.maxQuantity <= tier.minQuantity) {
        errors.push(
          `Tier ${i + 1}: Maximum quantity must be greater than minimum quantity`,
        );
      }

      // Validate tier continuity
      if (i > 0) {
        const prevTier = sortedTiers[i - 1];
        if (
          prevTier.maxQuantity &&
          tier.minQuantity !== prevTier.maxQuantity + 1
        ) {
          errors.push(
            `Tier ${i + 1}: Gap or overlap detected with previous tier`,
          );
        }
      }
    }

    return errors;
  }

  /**
   * Calculate pricing based on configuration
   */
  async calculatePricing(
    request: PricingCalculationRequest,
  ): Promise<PricingCalculationResult> {
    const errors = this.validatePricingConfiguration(request);

    if (errors.length > 0) {
      throw new BadRequestException(
        `Pricing validation failed: ${errors.join(', ')}`,
      );
    }

    let subtotal = 0;
    const breakdown: any = {};

    switch (request.pricingType) {
      case EnhancedPricingType.FLAT:
        subtotal = request.basePrice;
        breakdown.baseAmount = request.basePrice;
        break;

      case EnhancedPricingType.RECURRING:
        const periods = request.recurringPeriods || request.recurringCount || 1;
        subtotal = request.basePrice * periods;
        breakdown.baseAmount = request.basePrice;
        breakdown.recurringBreakdown = {
          periodsCalculated: periods,
          amountPerPeriod: request.basePrice,
        };
        break;

      case EnhancedPricingType.USAGE_BASED:
        const usage = request.usageAmount || request.minUsage || 1;
        const pricePerUnit = request.pricePerUnit || request.basePrice;

        // Validate usage limits
        if (request.minUsage && usage < request.minUsage) {
          throw new BadRequestException(
            `Usage amount ${usage} is below minimum ${request.minUsage}`,
          );
        }
        if (request.maxUsage && usage > request.maxUsage) {
          throw new BadRequestException(
            `Usage amount ${usage} exceeds maximum ${request.maxUsage}`,
          );
        }

        subtotal = usage * pricePerUnit;
        breakdown.baseAmount = request.basePrice;
        breakdown.usageBreakdown = {
          usageCalculated: usage,
          pricePerUnit,
        };
        break;

      default:
        throw new BadRequestException('Unsupported pricing type');
    }

    // Apply discount
    const discount = request.discountPercentage
      ? (subtotal * request.discountPercentage) / 100
      : 0;
    const afterDiscount = subtotal - discount;

    // Apply tax
    const tax = request.taxPercentage
      ? (afterDiscount * request.taxPercentage) / 100
      : 0;
    const total = afterDiscount + tax;

    return {
      subtotal,
      discount,
      tax,
      total,
      currency: request.currency,
      breakdown,
      validationErrors: errors.length > 0 ? errors : undefined,
    };
  }

  /**
   * Calculate tiered pricing
   */
  private calculateTieredPricing(
    tiers: any[],
    quantity: number,
  ): {
    total: number;
    breakdown: Array<{
      tier: number;
      quantity: number;
      pricePerUnit: number;
      amount: number;
    }>;
  } {
    const sortedTiers = [...tiers].sort(
      (a, b) => a.minQuantity - b.minQuantity,
    );
    const breakdown: any[] = [];
    let total = 0;
    let remainingQuantity = quantity;

    for (let i = 0; i < sortedTiers.length && remainingQuantity > 0; i++) {
      const tier = sortedTiers[i];
      const tierMin = tier.minQuantity;
      const tierMax = tier.maxQuantity || Infinity;

      if (quantity >= tierMin) {
        const tierQuantity = Math.min(remainingQuantity, tierMax - tierMin + 1);
        const tierAmount = tierQuantity * tier.pricePerUnit;

        breakdown.push({
          tier: i + 1,
          quantity: tierQuantity,
          pricePerUnit: tier.pricePerUnit,
          amount: tierAmount,
        });

        total += tierAmount;
        remainingQuantity -= tierQuantity;
      }
    }

    return { total, breakdown };
  }

  /**
   * Get effective pricing for space option extras
   */
  async getEffectivePricing(
    spaceOptionExtrasId: string,
  ): Promise<EffectivePricingResult> {
    const spaceOptionExtras = await this.spaceOptionExtrasRepository.findOne({
      where: { id: spaceOptionExtrasId },
      relations: ['partnerExtras'],
    });

    if (!spaceOptionExtras) {
      throw new BadRequestException('Space option extras not found');
    }

    const originalPricing = spaceOptionExtras.partnerAddon;
    const override = spaceOptionExtras.overrideType;

    // If no override or override type is NONE, return original pricing
    if (!override || override === OverrideType.NONE) {
      return {
        pricingType: this.convertPricingType(originalPricing.pricingType),
        basePrice: originalPricing.basePrice,
        currency: originalPricing.currency,
        recurringInterval: originalPricing.recurringInterval,
        recurringCount: originalPricing.recurringCount,
        usageUnit: originalPricing.usageUnit,
        pricePerUnit: originalPricing.basePrice, // Use basePrice as pricePerUnit for compatibility
        minUsage: originalPricing.minUsage,
        maxUsage: originalPricing.maxUsage,
        pricingTiers: originalPricing.pricingTiers,
        source: 'original',
      };
    }

    // Apply overrides based on type
    const effectivePricing = { ...originalPricing };
    const appliedFields: string[] = [];

    switch (spaceOptionExtras.overrideType) {
      case OverrideType.NONE:
        // No overrides to apply
        break;

      case OverrideType.PRICE_ONLY:
        // Apply only price overrides
        if (spaceOptionExtras.overrideBasePrice !== undefined) {
          effectivePricing.basePrice = spaceOptionExtras.overrideBasePrice;
          appliedFields.push('basePrice');
        }
        if (spaceOptionExtras.overrideCurrency) {
          effectivePricing.currency = spaceOptionExtras.overrideCurrency;
          appliedFields.push('currency');
        }
        break;

      case OverrideType.FULL_OVERRIDE:
        // Apply full override with all specified properties
        if (spaceOptionExtras.overridePricingType) {
          effectivePricing.pricingType =
            spaceOptionExtras.overridePricingType as any;
          appliedFields.push('pricingType');
        }
        if (spaceOptionExtras.overrideBasePrice !== undefined) {
          effectivePricing.basePrice = spaceOptionExtras.overrideBasePrice;
          appliedFields.push('basePrice');
        }
        if (spaceOptionExtras.overrideCurrency) {
          effectivePricing.currency = spaceOptionExtras.overrideCurrency;
          appliedFields.push('currency');
        }
        if (spaceOptionExtras.overrideRecurringInterval) {
          effectivePricing.recurringInterval =
            spaceOptionExtras.overrideRecurringInterval as any;
          appliedFields.push('recurringInterval');
        }
        if (spaceOptionExtras.overrideUsageUnit) {
          effectivePricing.usageUnit =
            spaceOptionExtras.overrideUsageUnit as any;
          appliedFields.push('usageUnit');
        }
        if (spaceOptionExtras.overridePricingTiers) {
          effectivePricing.pricingTiers =
            spaceOptionExtras.overridePricingTiers;
          appliedFields.push('pricingTiers');
        }
        break;

      case OverrideType.DISABLED:
        // Return null or empty pricing when disabled
        return null;
    }

    return {
      pricingType: this.convertPricingType(effectivePricing.pricingType),
      basePrice: effectivePricing.basePrice,
      currency: effectivePricing.currency,
      recurringInterval: effectivePricing.recurringInterval,
      recurringCount: effectivePricing.recurringCount,
      usageUnit: effectivePricing.usageUnit,
      pricePerUnit: effectivePricing.basePrice, // Use basePrice as pricePerUnit for compatibility
      minUsage: effectivePricing.minUsage,
      maxUsage: effectivePricing.maxUsage,
      pricingTiers: effectivePricing.pricingTiers,
      source: 'override',
      overrideDetails: {
        overrideType: spaceOptionExtras.overrideType,
        appliedFields,
      },
    };
  }

  /**
   * Get effective stock information
   */
  async getEffectiveStock(spaceOptionExtrasId: string): Promise<{
    stockQuantity?: number;
    minOrderQuantity: number;
    maxOrderQuantity?: number;
    isAvailable: boolean;
    source: 'original' | 'override';
    overrideDetails?: {
      appliedFields: string[];
    };
  }> {
    const spaceOptionExtras = await this.spaceOptionExtrasRepository.findOne({
      where: { id: spaceOptionExtrasId },
      relations: ['partnerExtras'],
    });

    if (!spaceOptionExtras) {
      throw new BadRequestException('Space option extras not found');
    }

    const original = spaceOptionExtras.partnerAddon;
    const appliedFields: string[] = [];
    let source: 'original' | 'override' = 'original';

    // Start with original values
    let stockQuantity = original.stockQuantity;
    let minOrderQuantity = original.minOrderQuantity;
    let maxOrderQuantity = original.maxOrderQuantity;

    // Apply overrides if they exist
    if (spaceOptionExtras.overrideStockQuantity !== undefined) {
      stockQuantity = spaceOptionExtras.overrideStockQuantity;
      appliedFields.push('stockQuantity');
      source = 'override';
    }

    if (spaceOptionExtras.overrideMinOrderQuantity !== undefined) {
      minOrderQuantity = spaceOptionExtras.overrideMinOrderQuantity;
      appliedFields.push('minOrderQuantity');
      source = 'override';
    }

    if (spaceOptionExtras.overrideMaxOrderQuantity !== undefined) {
      maxOrderQuantity = spaceOptionExtras.overrideMaxOrderQuantity;
      appliedFields.push('maxOrderQuantity');
      source = 'override';
    }

    // Check availability
    const isAvailable = stockQuantity === undefined || stockQuantity > 0;

    return {
      stockQuantity,
      minOrderQuantity,
      maxOrderQuantity,
      isAvailable,
      source,
      overrideDetails: source === 'override' ? { appliedFields } : undefined,
    };
  }

  /**
   * Validate pricing compatibility between entities
   */
  validatePricingCompatibility(
    spacePricing: any,
    packagePricing: any,
    extrasPricing: any,
  ): string[] {
    const errors: string[] = [];

    // Check currency consistency
    const currencies = [
      spacePricing?.currency,
      packagePricing?.currency,
      extrasPricing?.currency,
    ].filter(Boolean);

    if (currencies.length > 1) {
      const uniqueCurrencies = [...new Set(currencies)];
      if (uniqueCurrencies.length > 1) {
        errors.push(`Currency mismatch: ${uniqueCurrencies.join(', ')}`);
      }
    }

    // Check pricing type compatibility
    if (
      packagePricing?.pricingType === EnhancedPricingType.USAGE_BASED &&
      extrasPricing?.pricingType === EnhancedPricingType.RECURRING
    ) {
      errors.push('Usage-based packages cannot have recurring extras');
    }

    return errors;
  }

  /**
   * Calculate total cost for a booking
   */
  async calculateBookingCost(request: {
    spacePackageId: string;
    extrasIds: string[];
    quantity: number;
    duration?: number;
    usageAmount?: number;
    discountPercentage?: number;
    taxPercentage?: number;
  }): Promise<{
    packageCost: PricingCalculationResult;
    extrasCosts: PricingCalculationResult[];
    totalCost: {
      subtotal: number;
      discount: number;
      tax: number;
      total: number;
      currency: string;
    };
  }> {
    // Get package pricing
    const spacePackage = await this.spacePackageRepository.findOne({
      where: { id: request.spacePackageId },
    });

    if (!spacePackage) {
      throw new BadRequestException('Space package not found');
    }

    // Calculate package cost
    const packageCost = await this.calculatePricing({
      pricingType: this.convertPricingType(spacePackage.pricingType as any),
      basePrice: spacePackage.basePrice,
      currency: spacePackage.currency,
      recurringInterval: spacePackage.recurringInterval,
      recurringCount: spacePackage.recurringCount,
      usageUnit: spacePackage.usageUnit,
      pricePerUnit: spacePackage.basePrice,
      minUsage: spacePackage.minUsage,
      maxUsage: spacePackage.maxUsage,
      pricingTiers: spacePackage.pricingTiers,
      quantity: request.quantity,
      duration: request.duration,
      usageAmount: request.usageAmount,
      discountPercentage: request.discountPercentage,
      taxPercentage: request.taxPercentage,
    });

    // Calculate extras costs
    const extrasCosts: PricingCalculationResult[] = [];
    for (const extrasId of request.extrasIds) {
      const effectivePricing = await this.getEffectivePricing(extrasId);
      const extrasCost = await this.calculatePricing({
        ...effectivePricing,
        quantity: request.quantity,
        duration: request.duration,
        usageAmount: request.usageAmount,
        discountPercentage: request.discountPercentage,
        taxPercentage: request.taxPercentage,
      });
      extrasCosts.push(extrasCost);
    }

    // Calculate total
    const totalSubtotal =
      packageCost.subtotal +
      extrasCosts.reduce((sum, cost) => sum + cost.subtotal, 0);
    const totalDiscount =
      packageCost.discount +
      extrasCosts.reduce((sum, cost) => sum + cost.discount, 0);
    const totalTax =
      packageCost.tax + extrasCosts.reduce((sum, cost) => sum + cost.tax, 0);
    const totalTotal =
      packageCost.total +
      extrasCosts.reduce((sum, cost) => sum + cost.total, 0);

    return {
      packageCost,
      extrasCosts,
      totalCost: {
        subtotal: totalSubtotal,
        discount: totalDiscount,
        tax: totalTax,
        total: totalTotal,
        currency: packageCost.currency,
      },
    };
  }
}
