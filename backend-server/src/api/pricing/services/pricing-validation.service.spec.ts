import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import {
  BasePricingDto,
  PricingCalculationRequestDto,
  PricingTierDto,
  PricingType,
  RecurringInterval,
  UsageUnit,
} from '../dto/pricing.dto';
import { PricingValidationService } from './pricing-validation.service';

describe('PricingValidationService', () => {
  let service: PricingValidationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PricingValidationService],
    }).compile();

    service = module.get<PricingValidationService>(PricingValidationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validateFlatPricing', () => {
    it('should validate flat pricing successfully', () => {
      const pricing: BasePricingDto = {
        pricingType: PricingType.FLAT,
        basePrice: 100,
      };

      const errors: string[] = [];
      const warnings: string[] = [];
      service['validateFlatPricing'](pricing, errors, warnings);
      expect(errors).toHaveLength(0);
    });

    it('should add warnings for unused fields in flat pricing', () => {
      const pricing: BasePricingDto = {
        pricingType: PricingType.FLAT,
        basePrice: 100,
        recurringInterval: RecurringInterval.MONTHLY, // Should be ignored
        usageUnit: UsageUnit.PER_HOUR, // Should be ignored
      };

      const errors: string[] = [];
      const warnings: string[] = [];
      service['validateFlatPricing'](pricing, errors, warnings);
      expect(warnings.length).toBeGreaterThan(0);
    });

    it('should not add warnings for clean flat pricing', () => {
      const pricing: BasePricingDto = {
        pricingType: PricingType.FLAT,
        basePrice: 100,
      };

      const errors: string[] = [];
      const warnings: string[] = [];
      service['validateFlatPricing'](pricing, errors, warnings);
      expect(warnings).toHaveLength(0);
    });
  });

  describe('validateRecurringPricing', () => {
    it('should validate recurring pricing successfully', () => {
      const pricing: BasePricingDto = {
        pricingType: PricingType.RECURRING,
        basePrice: 100,
        currency: 'USD',
        recurringInterval: RecurringInterval.MONTHLY,
        recurringCount: 1,
      };

      const errors: string[] = [];
      const warnings: string[] = [];
      service['validateRecurringPricing'](pricing, errors, warnings);
      expect(errors).toHaveLength(0);
    });

    it('should add errors for missing recurring interval', () => {
      const pricing: BasePricingDto = {
        pricingType: PricingType.RECURRING,
        basePrice: 100,
        currency: 'USD',
        recurringCount: 1,
      };

      const errors: string[] = [];
      const warnings: string[] = [];
      service['validateRecurringPricing'](pricing, errors, warnings);
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should throw error for invalid recurring count', () => {
      const pricing: BasePricingDto = {
        pricingType: PricingType.RECURRING,
        basePrice: 100,
        currency: 'USD',
        recurringInterval: RecurringInterval.MONTHLY,
        recurringCount: -1, // Invalid - negative value
      };

      const errors: string[] = [];
      const warnings: string[] = [];
      service['validateRecurringPricing'](pricing, errors, warnings);
      expect(errors.length).toBeGreaterThan(0);
    });
  });

  describe('validateUsageBasedPricing', () => {
    it('should validate usage-based pricing successfully', () => {
      const pricing: BasePricingDto = {
        pricingType: PricingType.USAGE_BASED,
        basePrice: 100,
        usageUnit: UsageUnit.PER_HOUR,
        minUsage: 1,
        maxUsage: 10,
        usageIncrement: 1,
      };

      const errors: string[] = [];
      const warnings: string[] = [];
      service['validateUsageBasedPricing'](pricing, errors, warnings);
      expect(errors).toHaveLength(0);
    });

    it('should add errors for invalid usage-based pricing', () => {
      const pricing: BasePricingDto = {
        pricingType: PricingType.USAGE_BASED,
        basePrice: 100,
        // Missing usageUnit
        minUsage: -1, // Invalid
      };

      const errors: string[] = [];
      const warnings: string[] = [];
      service['validateUsageBasedPricing'](pricing, errors, warnings);
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should add errors for missing usage unit', () => {
      const pricing: BasePricingDto = {
        pricingType: PricingType.USAGE_BASED,
        basePrice: 100,
        minUsage: 1,
        maxUsage: 24,
      };

      const errors: string[] = [];
      const warnings: string[] = [];
      service['validateUsageBasedPricing'](pricing, errors, warnings);
      expect(errors.length).toBeGreaterThan(0);
    });
  });

  describe('validateTieredPricing', () => {
    it('should validate tiered pricing successfully', () => {
      const pricingTiers: PricingTierDto[] = [
        { minQuantity: 1, maxQuantity: 5, pricePerUnit: 100 },
        { minQuantity: 6, maxQuantity: 10, pricePerUnit: 90 },
        { minQuantity: 11, maxQuantity: undefined, pricePerUnit: 80 },
      ];

      const errors: string[] = [];
      const warnings: string[] = [];
      service['validatePricingTiers'](pricingTiers, errors, warnings);
      expect(errors).toHaveLength(0);
    });

    it('should add errors for overlapping tiers', () => {
      const pricingTiers: PricingTierDto[] = [
        { minQuantity: 1, maxQuantity: 5, pricePerUnit: 100 },
        { minQuantity: 4, maxQuantity: 10, pricePerUnit: 90 }, // Overlaps
      ];

      const errors: string[] = [];
      const warnings: string[] = [];
      service['validatePricingTiers'](pricingTiers, errors, warnings);
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should add errors for invalid tier quantities', () => {
      const pricingTiers: PricingTierDto[] = [
        { minQuantity: -1, maxQuantity: 5, pricePerUnit: 100 }, // Invalid min
      ];

      const errors: string[] = [];
      const warnings: string[] = [];
      service['validatePricingTiers'](pricingTiers, errors, warnings);
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should add errors for invalid tier prices', () => {
      const pricingTiers: PricingTierDto[] = [
        { minQuantity: 1, maxQuantity: 5, pricePerUnit: -10 }, // Invalid price
      ];

      const errors: string[] = [];
      const warnings: string[] = [];
      service['validatePricingTiers'](pricingTiers, errors, warnings);
      expect(errors.length).toBeGreaterThan(0);
    });
  });

  describe('calculatePrice - Flat', () => {
    it('should calculate flat price correctly', () => {
      const pricing: BasePricingDto = {
        pricingType: PricingType.FLAT,
        basePrice: 100,
        currency: 'USD',
      };

      const result = service.calculatePrice(pricing, 2);
      expect(result.totalPrice).toBe(200);
      expect(result.pricingType).toBe(PricingType.FLAT);
    });
  });

  describe('calculatePrice - Recurring', () => {
    it('should calculate recurring price for monthly interval', () => {
      const pricing: BasePricingDto = {
        pricingType: PricingType.RECURRING,
        basePrice: 100,
        currency: 'USD',
        recurringInterval: RecurringInterval.MONTHLY,
        recurringCount: 3,
      };

      const result = service.calculatePrice(pricing, 1, 3);
      expect(result.totalPrice).toBe(900);
      expect(result.pricingType).toBe(PricingType.RECURRING);
    });

    it('should calculate recurring price for daily interval', () => {
      const pricing: BasePricingDto = {
        pricingType: PricingType.RECURRING,
        basePrice: 50,
        currency: 'USD',
        recurringInterval: RecurringInterval.DAILY,
        recurringCount: 1,
      };

      const result = service.calculatePrice(pricing, 1, 7);
      expect(result.totalPrice).toBe(350);
      expect(result.pricingType).toBe(PricingType.RECURRING);
    });
  });

  describe('calculatePrice - Usage Based', () => {
    it('should calculate usage-based price correctly', () => {
      const pricing: BasePricingDto = {
        pricingType: PricingType.USAGE_BASED,
        basePrice: 10,
        currency: 'USD',
        usageUnit: UsageUnit.PER_HOUR,
        minUsage: 1,
        maxUsage: 24,
        usageIncrement: 1,
      };

      const result = service.calculatePrice(pricing, 1, 1, 8);
      expect(result.totalPrice).toBe(80);
      expect(result.pricingType).toBe(PricingType.USAGE_BASED);
    });

    it('should enforce minimum usage', () => {
      const pricing: BasePricingDto = {
        pricingType: PricingType.USAGE_BASED,
        basePrice: 10,
        currency: 'USD',
        usageUnit: UsageUnit.PER_HOUR,
        minUsage: 2,
        maxUsage: 24,
        usageIncrement: 1,
      };

      expect(() => service.calculatePrice(pricing, 1, 1, 1)).toThrow(
        BadRequestException,
      );
    });

    it('should enforce maximum usage', () => {
      const pricing: BasePricingDto = {
        pricingType: PricingType.USAGE_BASED,
        basePrice: 10,
        currency: 'USD',
        usageUnit: UsageUnit.PER_HOUR,
        minUsage: 1,
        maxUsage: 10,
        usageIncrement: 1,
      };

      expect(() => service.calculatePrice(pricing, 1, 1, 15)).toThrow(
        BadRequestException,
      );
    });
  });

  describe('calculatePrice - Tiered', () => {
    it('should calculate tiered price correctly', () => {
      const pricing: BasePricingDto = {
        pricingType: PricingType.USAGE_BASED,
        basePrice: 50,
        currency: 'USD',
        usageUnit: UsageUnit.PER_HOUR,
        pricingTiers: [
          { minQuantity: 1, maxQuantity: 10, pricePerUnit: 100 },
          { minQuantity: 11, maxQuantity: 50, pricePerUnit: 90 },
          { minQuantity: 51, maxQuantity: undefined, pricePerUnit: 80 },
        ],
      };

      const result1 = service.calculatePrice(pricing, 1, 1, 5);
      expect(result1.totalPrice).toBe(500);

      const result2 = service.calculatePrice(pricing, 1, 1, 25);
      expect(result2.totalPrice).toBe(2250);

      const result3 = service.calculatePrice(pricing, 1, 1, 100);
      expect(result3.totalPrice).toBe(8000);
    });
  });

  describe('validateCalculationRequest', () => {
    it('should validate calculation request successfully', () => {
      const request: PricingCalculationRequestDto = {
        entityType: 'space_package' as const,
        entityId: 'test-id',
        quantity: 1,
        duration: 1,
      };

      expect(() => service.validateCalculationRequest(request)).not.toThrow();
    });

    it('should throw error for invalid pricing type', () => {
      const request = {
        entityType: 'invalid_type' as any,
        entityId: 'test-id',
        quantity: -1,
        duration: 0,
      };

      const result = service.validateCalculationRequest(request);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('comparePricingSchemas', () => {
    it('should compare pricing schemas correctly', () => {
      const schema1: BasePricingDto = {
        pricingType: PricingType.FLAT,
        basePrice: 100,
        currency: 'USD',
      };

      const schema2: BasePricingDto = {
        pricingType: PricingType.FLAT,
        basePrice: 150,
        currency: 'USD',
      };

      const result = service.comparePricingSchemas(schema1, schema2);
      expect(result.differences.length).toBeGreaterThan(0);
      expect(result.differences[0]).toContain('price difference');
    });

    it('should identify identical schemas', () => {
      const schema1: BasePricingDto = {
        pricingType: PricingType.FLAT,
        basePrice: 100,
        currency: 'USD',
      };

      const schema2: BasePricingDto = {
        pricingType: PricingType.FLAT,
        basePrice: 100,
        currency: 'USD',
      };

      const result = service.comparePricingSchemas(schema1, schema2);
      expect(result.differences.length).toBe(0);
      expect(result.differences).toHaveLength(0);
    });
  });

  describe('generatePricingSummary', () => {
    it('should generate flat pricing summary', () => {
      const pricing: BasePricingDto = {
        pricingType: PricingType.FLAT,
        basePrice: 100,
        currency: 'USD',
      };

      const summary = service.generatePricingSummary(pricing);
      expect(summary.type).toBe('flat');
      expect(summary.features).toContain('One-time flat rate');
    });

    it('should generate recurring pricing summary', () => {
      const pricing: BasePricingDto = {
        pricingType: PricingType.RECURRING,
        basePrice: 100,
        currency: 'USD',
        recurringInterval: RecurringInterval.MONTHLY,
        recurringCount: 1,
      };

      const summary = service.generatePricingSummary(pricing);
      expect(summary.type).toBe('recurring');
      expect(summary.features).toContain('Recurring monthly');
    });

    it('should generate usage-based pricing summary', () => {
      const pricing: BasePricingDto = {
        pricingType: PricingType.USAGE_BASED,
        basePrice: 10,
        currency: 'USD',
        usageUnit: UsageUnit.PER_HOUR,
        minUsage: 1,
        maxUsage: 24,
      };

      const summary = service.generatePricingSummary(pricing);
      expect(summary.type).toBe('usage_based');
      expect(summary.features).toContain('Usage-based (per_hour)');
    });
  });
});
