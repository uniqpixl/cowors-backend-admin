import { BadRequestException, Injectable } from '@nestjs/common';
import {
  BasePricingDto,
  PricingCalculationRequestDto,
  PricingCalculationResponseDto,
  PricingTierDto,
  PricingType,
  RecurringInterval,
  UsageUnit,
} from '../dto/pricing.dto';

@Injectable()
export class PricingValidationService {
  /**
   * Validates a pricing schema for consistency and business rules
   */
  validatePricingSchema(pricing: BasePricingDto): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Base price validation
    if (pricing.basePrice <= 0) {
      errors.push('Base price must be greater than 0');
    }

    // Pricing type specific validations
    switch (pricing.pricingType) {
      case PricingType.RECURRING:
        this.validateRecurringPricing(pricing, errors, warnings);
        break;
      case PricingType.USAGE_BASED:
        this.validateUsageBasedPricing(pricing, errors, warnings);
        break;
      case PricingType.FLAT:
        this.validateFlatPricing(pricing, errors, warnings);
        break;
    }

    // Pricing tiers validation
    if (pricing.pricingTiers && pricing.pricingTiers.length > 0) {
      this.validatePricingTiers(pricing.pricingTiers, errors, warnings);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Validates recurring pricing specific fields
   */
  private validateRecurringPricing(
    pricing: BasePricingDto,
    errors: string[],
    warnings: string[],
  ): void {
    if (!pricing.recurringInterval) {
      errors.push('Recurring interval is required for recurring pricing');
    }

    if (pricing.recurringCount && pricing.recurringCount < 1) {
      errors.push('Recurring count must be at least 1');
    }

    // Warn about usage-based fields in recurring pricing
    if (pricing.usageUnit || pricing.minUsage || pricing.maxUsage) {
      warnings.push('Usage-based fields are ignored in recurring pricing type');
    }
  }

  /**
   * Validates usage-based pricing specific fields
   */
  private validateUsageBasedPricing(
    pricing: BasePricingDto,
    errors: string[],
    warnings: string[],
  ): void {
    if (!pricing.usageUnit) {
      errors.push('Usage unit is required for usage-based pricing');
    }

    if (pricing.minUsage !== undefined && pricing.minUsage < 0) {
      errors.push('Minimum usage cannot be negative');
    }

    if (pricing.maxUsage !== undefined && pricing.maxUsage < 0) {
      errors.push('Maximum usage cannot be negative');
    }

    if (
      pricing.minUsage !== undefined &&
      pricing.maxUsage !== undefined &&
      pricing.minUsage > pricing.maxUsage
    ) {
      errors.push('Minimum usage cannot be greater than maximum usage');
    }

    if (pricing.usageIncrement && pricing.usageIncrement <= 0) {
      errors.push('Usage increment must be greater than 0');
    }

    // Warn about recurring fields in usage-based pricing
    if (pricing.recurringInterval || pricing.recurringCount) {
      warnings.push('Recurring fields are ignored in usage-based pricing type');
    }
  }

  /**
   * Validates flat pricing specific fields
   */
  private validateFlatPricing(
    pricing: BasePricingDto,
    errors: string[],
    warnings: string[],
  ): void {
    // Warn about unused fields in flat pricing
    const unusedFields = [];
    if (pricing.recurringInterval) unusedFields.push('recurringInterval');
    if (pricing.recurringCount) unusedFields.push('recurringCount');
    if (pricing.usageUnit) unusedFields.push('usageUnit');
    if (pricing.minUsage) unusedFields.push('minUsage');
    if (pricing.maxUsage) unusedFields.push('maxUsage');
    if (pricing.usageIncrement) unusedFields.push('usageIncrement');

    if (unusedFields.length > 0) {
      warnings.push(
        `The following fields are ignored in flat pricing: ${unusedFields.join(', ')}`,
      );
    }
  }

  /**
   * Validates pricing tiers for consistency
   */
  private validatePricingTiers(
    tiers: PricingTierDto[],
    errors: string[],
    warnings: string[],
  ): void {
    // Sort tiers by minQuantity for validation
    const sortedTiers = [...tiers].sort(
      (a, b) => a.minQuantity - b.minQuantity,
    );

    for (let i = 0; i < sortedTiers.length; i++) {
      const tier = sortedTiers[i];

      // Validate individual tier
      if (tier.minQuantity < 0) {
        errors.push(`Tier ${i + 1}: Minimum quantity cannot be negative`);
      }

      if (
        tier.maxQuantity !== undefined &&
        tier.maxQuantity < tier.minQuantity
      ) {
        errors.push(
          `Tier ${i + 1}: Maximum quantity cannot be less than minimum quantity`,
        );
      }

      if (tier.pricePerUnit <= 0) {
        errors.push(`Tier ${i + 1}: Price per unit must be greater than 0`);
      }

      // Validate tier overlaps
      if (i > 0) {
        const prevTier = sortedTiers[i - 1];
        if (
          prevTier.maxQuantity !== undefined &&
          tier.minQuantity <= prevTier.maxQuantity
        ) {
          errors.push(
            `Tier ${i + 1}: Overlaps with previous tier (${prevTier.minQuantity}-${prevTier.maxQuantity})`,
          );
        }
      }
    }

    // Check for gaps in tier coverage
    for (let i = 1; i < sortedTiers.length; i++) {
      const prevTier = sortedTiers[i - 1];
      const currentTier = sortedTiers[i];

      if (
        prevTier.maxQuantity !== undefined &&
        currentTier.minQuantity > prevTier.maxQuantity + 1
      ) {
        warnings.push(
          `Gap in tier coverage between ${prevTier.maxQuantity} and ${currentTier.minQuantity}`,
        );
      }
    }
  }

  /**
   * Calculates the total price based on pricing schema and parameters
   */
  calculatePrice(
    pricing: BasePricingDto,
    quantity: number = 1,
    duration: number = 1,
    usageAmount?: number,
  ): PricingCalculationResponseDto {
    // Validate pricing schema first
    const validation = this.validatePricingSchema(pricing);
    if (!validation.isValid) {
      throw new BadRequestException(
        `Invalid pricing schema: ${validation.errors.join(', ')}`,
      );
    }

    let totalPrice = 0;
    let tierApplied: string | undefined;
    const breakdown = {
      baseAmount: pricing.basePrice,
      quantity,
      duration,
      usageAmount,
      tierApplied,
      discounts: 0,
      taxes: 0,
    };

    switch (pricing.pricingType) {
      case PricingType.FLAT:
        totalPrice = this.calculateFlatPrice(pricing, quantity);
        break;
      case PricingType.RECURRING:
        totalPrice = this.calculateRecurringPrice(pricing, quantity, duration);
        break;
      case PricingType.USAGE_BASED:
        if (usageAmount === undefined) {
          throw new BadRequestException(
            'Usage amount is required for usage-based pricing',
          );
        }
        const usageResult = this.calculateUsageBasedPrice(
          pricing,
          quantity,
          usageAmount,
        );
        totalPrice = usageResult.totalPrice;
        tierApplied = usageResult.tierApplied;
        breakdown.tierApplied = tierApplied;
        break;
    }

    return {
      basePrice: pricing.basePrice,
      totalPrice: Math.round(totalPrice * 100) / 100, // Round to 2 decimal places
      currency: pricing.currency || 'INR',
      breakdown,
      pricingType: pricing.pricingType,
      warnings: validation.warnings,
    };
  }

  /**
   * Calculates flat pricing
   */
  private calculateFlatPrice(
    pricing: BasePricingDto,
    quantity: number,
  ): number {
    return pricing.basePrice * quantity;
  }

  /**
   * Calculates recurring pricing
   */
  private calculateRecurringPrice(
    pricing: BasePricingDto,
    quantity: number,
    duration: number,
  ): number {
    const recurringCount = pricing.recurringCount || 1;
    return pricing.basePrice * quantity * duration * recurringCount;
  }

  /**
   * Calculates usage-based pricing with tier support
   */
  private calculateUsageBasedPrice(
    pricing: BasePricingDto,
    quantity: number,
    usageAmount: number,
  ): { totalPrice: number; tierApplied?: string } {
    // Validate usage constraints
    if (pricing.minUsage !== undefined && usageAmount < pricing.minUsage) {
      throw new BadRequestException(
        `Usage amount ${usageAmount} is below minimum ${pricing.minUsage}`,
      );
    }

    if (pricing.maxUsage !== undefined && usageAmount > pricing.maxUsage) {
      throw new BadRequestException(
        `Usage amount ${usageAmount} exceeds maximum ${pricing.maxUsage}`,
      );
    }

    // Check usage increment
    if (pricing.usageIncrement && usageAmount % pricing.usageIncrement !== 0) {
      throw new BadRequestException(
        `Usage amount must be in increments of ${pricing.usageIncrement}`,
      );
    }

    let pricePerUnit = pricing.basePrice;
    let tierApplied: string | undefined;

    // Apply tiered pricing if available
    if (pricing.pricingTiers && pricing.pricingTiers.length > 0) {
      const applicableTier = this.findApplicableTier(
        pricing.pricingTiers,
        usageAmount,
      );
      if (applicableTier) {
        pricePerUnit = applicableTier.pricePerUnit;
        tierApplied = `${applicableTier.minQuantity}-${applicableTier.maxQuantity || '∞'}`;
      }
    }

    return {
      totalPrice: pricePerUnit * usageAmount * quantity,
      tierApplied,
    };
  }

  /**
   * Finds the applicable pricing tier for a given usage amount
   */
  private findApplicableTier(
    tiers: PricingTierDto[],
    usageAmount: number,
  ): PricingTierDto | null {
    const sortedTiers = [...tiers].sort(
      (a, b) => a.minQuantity - b.minQuantity,
    );

    for (const tier of sortedTiers) {
      if (
        usageAmount >= tier.minQuantity &&
        (tier.maxQuantity === undefined || usageAmount <= tier.maxQuantity)
      ) {
        return tier;
      }
    }

    return null;
  }

  /**
   * Validates pricing calculation request
   */
  validateCalculationRequest(request: PricingCalculationRequestDto): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (request.quantity <= 0) {
      errors.push('Quantity must be greater than 0');
    }

    if (request.duration <= 0) {
      errors.push('Duration must be greater than 0');
    }

    if (request.usageAmount !== undefined && request.usageAmount < 0) {
      errors.push('Usage amount cannot be negative');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Compares two pricing schemas for compatibility
   */
  comparePricingSchemas(
    schema1: BasePricingDto,
    schema2: BasePricingDto,
  ): {
    isCompatible: boolean;
    differences: string[];
    recommendations: string[];
  } {
    const differences: string[] = [];
    const recommendations: string[] = [];

    // Compare pricing types
    if (schema1.pricingType !== schema2.pricingType) {
      differences.push(
        `Pricing type differs: ${schema1.pricingType} vs ${schema2.pricingType}`,
      );
      recommendations.push(
        'Consider standardizing pricing types for consistency',
      );
    }

    // Compare currencies
    if (schema1.currency !== schema2.currency) {
      differences.push(
        `Currency differs: ${schema1.currency} vs ${schema2.currency}`,
      );
      recommendations.push('Ensure currency consistency for calculations');
    }

    // Compare base prices (with tolerance)
    const priceDifference = Math.abs(schema1.basePrice - schema2.basePrice);
    const priceThreshold = Math.max(schema1.basePrice, schema2.basePrice) * 0.1; // 10% threshold
    if (priceDifference > priceThreshold) {
      differences.push(
        `Significant price difference: ${schema1.basePrice} vs ${schema2.basePrice}`,
      );
      recommendations.push('Review pricing strategy for consistency');
    }

    return {
      isCompatible: differences.length === 0,
      differences,
      recommendations,
    };
  }

  /**
   * Generates pricing summary for reporting
   */
  generatePricingSummary(pricing: BasePricingDto): {
    type: string;
    basePrice: number;
    currency: string;
    features: string[];
    constraints: string[];
  } {
    const features: string[] = [];
    const constraints: string[] = [];

    // Add type-specific features
    switch (pricing.pricingType) {
      case PricingType.RECURRING:
        features.push(`Recurring ${pricing.recurringInterval}`);
        if (pricing.recurringCount) {
          features.push(`${pricing.recurringCount} intervals`);
        }
        break;
      case PricingType.USAGE_BASED:
        features.push(`Usage-based (${pricing.usageUnit})`);
        if (pricing.pricingTiers && pricing.pricingTiers.length > 0) {
          features.push(`${pricing.pricingTiers.length} pricing tiers`);
        }
        break;
      case PricingType.FLAT:
        features.push('One-time flat rate');
        break;
    }

    // Add constraints
    if (pricing.minUsage !== undefined) {
      constraints.push(`Min usage: ${pricing.minUsage}`);
    }
    if (pricing.maxUsage !== undefined) {
      constraints.push(`Max usage: ${pricing.maxUsage}`);
    }
    if (pricing.usageIncrement) {
      constraints.push(`Usage increment: ${pricing.usageIncrement}`);
    }

    return {
      type: pricing.pricingType,
      basePrice: pricing.basePrice,
      currency: pricing.currency || 'INR',
      features,
      constraints,
    };
  }
}
