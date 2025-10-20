import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  EnhancedPricingType,
  OverrideType,
  RecurringInterval,
  UsageUnit,
} from '../dto/pricing.dto';
import {
  PricingCalculationRequest,
  PricingValidationService,
} from './pricing-validation.service';
// Mock entities for testing
const SpacePackageEntity = {};
const PartnerAddonEntity = {};
const SpaceOptionExtrasEntity = {};

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

  describe('validatePricingConfiguration', () => {
    it('should validate flat pricing configuration', () => {
      const pricing = {
        pricingType: EnhancedPricingType.FLAT,
        basePrice: 100,
        currency: 'USD',
      };

      const result = service.validatePricingConfiguration(pricing);
      expect(result).toHaveLength(0);
    });

    it('should validate recurring pricing configuration', () => {
      const pricing = {
        pricingType: EnhancedPricingType.RECURRING,
        basePrice: 100,
        currency: 'USD',
        recurringPricing: {
          interval: RecurringInterval.MONTHLY,
          intervalCount: 1,
        },
      };

      const result = service.validatePricingConfiguration(pricing);
      expect(result).toHaveLength(0);
    });

    it('should validate usage-based pricing configuration', () => {
      const pricing = {
        pricingType: EnhancedPricingType.USAGE_BASED,
        basePrice: 0,
        currency: 'USD',
        usageBasedPricing: {
          unit: UsageUnit.PER_HOUR,
          pricePerUnit: 50,
          minimumUnits: 1,
          maximumUnits: 24,
        },
      };

      const result = service.validatePricingConfiguration(pricing);
      expect(result).toHaveLength(0);
    });

    it('should fail validation for recurring pricing without interval', () => {
      const pricing = {
        pricingType: EnhancedPricingType.RECURRING,
        basePrice: 100,
        currency: 'USD',
      };

      const result = service.validatePricingConfiguration(pricing);
      expect(result).toContain(
        'Recurring pricing requires interval configuration',
      );
    });

    it('should fail validation for usage-based pricing without unit configuration', () => {
      const pricing = {
        pricingType: EnhancedPricingType.USAGE_BASED,
        basePrice: 0,
        currency: 'USD',
      };

      const result = service.validatePricingConfiguration(pricing);
      expect(result).toContain(
        'Usage-based pricing requires unit configuration',
      );
    });

    it('should fail validation for negative base price', () => {
      const pricing = {
        pricingType: EnhancedPricingType.FLAT,
        basePrice: -10,
        currency: 'USD',
      };

      const result = service.validatePricingConfiguration(pricing);
      expect(result).toContain('Base price cannot be negative');
    });
  });

  describe('calculatePricing', () => {
    it('should calculate flat pricing correctly', async () => {
      const request = {
        pricingType: EnhancedPricingType.FLAT,
        basePrice: 100,
        currency: 'USD',
        quantity: 2,
        duration: 4,
      };

      const result = await service.calculatePricing(request);
      expect(result.total).toBe(200); // 100 * 2
      expect(result.breakdown).toBeDefined();
    });

    it('should calculate usage-based pricing correctly', async () => {
      const request = {
        pricingType: EnhancedPricingType.USAGE_BASED,
        basePrice: 0,
        currency: 'USD',
        usageBasedPricing: {
          unit: UsageUnit.PER_HOUR,
          pricePerUnit: 25,
          minimumUnits: 1,
          maximumUnits: 24,
        },
        quantity: 1,
        duration: 4,
      };

      const result = await service.calculatePricing(request);
      expect(result.total).toBe(100); // 25 * 4 hours
      expect(result.breakdown).toBeDefined();
    });

    it('should apply minimum units for usage-based pricing', async () => {
      const request = {
        pricingType: EnhancedPricingType.USAGE_BASED,
        basePrice: 0,
        currency: 'USD',
        usageBasedPricing: {
          unit: UsageUnit.PER_HOUR,
          pricePerUnit: 25,
          minimumUnits: 2,
          maximumUnits: 24,
        },
        quantity: 1,
        duration: 1, // Less than minimum
      };

      const result = await service.calculatePricing(request);
      expect(result.total).toBe(50); // 25 * 2 (minimum units)
      expect(result.breakdown).toBeDefined();
    });

    it('should apply maximum units for usage-based pricing', async () => {
      const request = {
        pricingType: EnhancedPricingType.USAGE_BASED,
        basePrice: 0,
        currency: 'USD',
        usageBasedPricing: {
          unit: UsageUnit.PER_HOUR,
          pricePerUnit: 50,
          minimumUnits: 1,
          maximumUnits: 10,
        },
        quantity: 1,
        duration: 12, // More than maximum
      };

      const result = await service.calculatePricing(request);
      expect(result.total).toBe(200); // 25 * 8 (maximum units)
      expect(result.breakdown).toBeDefined();
    });
  });

  describe('getEffectivePricing', () => {
    it('should return original pricing when no override', async () => {
      const mockSpaceOptionExtras = {
        id: 'extras-1',
        partnerExtras: {
          pricing: {
            pricingType: EnhancedPricingType.FLAT,
            basePrice: 100,
            currency: 'USD',
          },
        },
        override: {
          overrideType: OverrideType.NONE,
        },
      };

      const mockSpaceOptionExtrasRepository = {
        findOne: jest.fn().mockResolvedValue(mockSpaceOptionExtras),
      };
      (service as any).spaceOptionExtrasRepository =
        mockSpaceOptionExtrasRepository;

      const result = await service.getEffectivePricing('extras-1');
      expect(result.basePrice).toBe(100);
      expect(result.source).toBe('original');
    });

    it('should apply flat price override', async () => {
      const mockSpaceOptionExtras = {
        id: 'extras-1',
        partnerExtras: {
          pricing: {
            pricingType: EnhancedPricingType.RECURRING,
            basePrice: 100,
            currency: 'USD',
            recurringInterval: RecurringInterval.MONTHLY,
            recurringCount: 12,
          },
        },
        override: {
          overrideType: OverrideType.FLAT,
          flatPrice: 75,
          flatCurrency: 'EUR',
        },
      };

      const mockSpaceOptionExtrasRepository = {
        findOne: jest.fn().mockResolvedValue(mockSpaceOptionExtras),
      };
      (service as any).spaceOptionExtrasRepository =
        mockSpaceOptionExtrasRepository;

      const result = await service.getEffectivePricing('extras-1');
      expect(result.basePrice).toBe(75);
      expect(result.currency).toBe('EUR');
      expect(result.pricingType).toBe(EnhancedPricingType.FLAT);
      expect(result.source).toBe('override');
    });

    it('should apply stock override when specified', async () => {
      const mockSpaceOptionExtras = {
        id: 'extras-1',
        partnerExtras: {
          stockQuantity: 100,
          minOrderQuantity: 1,
          maxOrderQuantity: 10,
        },
        overrideStockQuantity: 50,
        overrideMinOrderQuantity: 2,
        overrideMaxOrderQuantity: 5,
      };

      const mockSpaceOptionExtrasRepository = {
        findOne: jest.fn().mockResolvedValue(mockSpaceOptionExtras),
      };
      (service as any).spaceOptionExtrasRepository =
        mockSpaceOptionExtrasRepository;

      const result = await service.getEffectiveStock('extras-1');
      expect(result.stockQuantity).toBe(50);
      expect(result.minOrderQuantity).toBe(2);
      expect(result.maxOrderQuantity).toBe(5);
    });

    it('should return original stock when no overrides', async () => {
      const mockSpaceOptionExtras = {
        id: 'extras-1',
        partnerExtras: {
          stockQuantity: 100,
          minOrderQuantity: 1,
          maxOrderQuantity: 10,
        },
        overrideStockQuantity: undefined,
        overrideMinOrderQuantity: undefined,
        overrideMaxOrderQuantity: undefined,
      };

      const mockSpaceOptionExtrasRepository = {
        findOne: jest.fn().mockResolvedValue(mockSpaceOptionExtras),
      };
      (service as any).spaceOptionExtrasRepository =
        mockSpaceOptionExtrasRepository;

      const result = await service.getEffectiveStock('extras-1');

      expect(result.stockQuantity).toBe(100);
      expect(result.minOrderQuantity).toBe(1);
      expect(result.maxOrderQuantity).toBe(10);
      expect(result.isAvailable).toBe(true);
      expect(result.source).toBe('original');
    });

    it('should apply overrides when present', async () => {
      const mockSpaceOptionExtras = {
        id: 'extras-1',
        partnerExtras: {
          stockQuantity: 100,
          minOrderQuantity: 1,
          maxOrderQuantity: 10,
        },
        overrideStockQuantity: 50,
        overrideMinOrderQuantity: 2,
        overrideMaxOrderQuantity: 5,
      };

      const mockSpaceOptionExtrasRepository = {
        findOne: jest.fn().mockResolvedValue(mockSpaceOptionExtras),
      };
      (service as any).spaceOptionExtrasRepository =
        mockSpaceOptionExtrasRepository;

      const result = await service.getEffectiveStock('extras-1');

      expect(result.stockQuantity).toBe(50);
      expect(result.minOrderQuantity).toBe(2);
      expect(result.maxOrderQuantity).toBe(5);
      expect(result.isAvailable).toBe(true);
      expect(result.source).toBe('override');
      expect(result.overrideDetails?.appliedFields).toContain('stockQuantity');
    });
  });

  describe('validatePricingCompatibility', () => {
    it('should detect currency mismatch', () => {
      const spacePricing = { currency: 'USD' };
      const packagePricing = { currency: 'EUR' };
      const extrasPricing = { currency: 'GBP' };

      const result = service.validatePricingCompatibility(
        spacePricing,
        packagePricing,
        extrasPricing,
      );

      expect(result).toContain('Currency mismatch: USD, EUR, GBP');
    });

    it('should detect incompatible pricing types', () => {
      const spacePricing = {
        pricingType: EnhancedPricingType.FLAT,
        currency: 'USD',
      };
      const packagePricing = {
        pricingType: EnhancedPricingType.USAGE_BASED,
        currency: 'USD',
      };
      const extrasPricing = {
        pricingType: EnhancedPricingType.RECURRING,
        currency: 'USD',
      };

      const result = service.validatePricingCompatibility(
        spacePricing,
        packagePricing,
        extrasPricing,
      );

      expect(result).toContain(
        'Usage-based packages cannot have recurring extras',
      );
    });

    it('should pass for compatible pricing', () => {
      const spacePricing = {
        pricingType: EnhancedPricingType.FLAT,
        currency: 'USD',
      };
      const packagePricing = {
        pricingType: EnhancedPricingType.FLAT,
        currency: 'USD',
      };
      const extrasPricing = {
        pricingType: EnhancedPricingType.FLAT,
        currency: 'USD',
      };

      const result = service.validatePricingCompatibility(
        spacePricing,
        packagePricing,
        extrasPricing,
      );

      expect(result).toHaveLength(0);
    });
  });

  describe('calculateBookingCost', () => {
    it('should calculate total cost with package and extras', async () => {
      const mockPackage = {
        id: 'package-1',
        pricing: {
          pricingType: EnhancedPricingType.FLAT,
          basePrice: 100,
          currency: 'USD',
        },
      };

      const mockCalculationResult = {
        subtotal: 100,
        discount: 10,
        tax: 8,
        total: 98,
        currency: 'USD',
        breakdown: {
          baseAmount: 100,
          discountAmount: 10,
          taxAmount: 8,
        },
      };

      jest
        .spyOn(service, 'calculatePricing')
        .mockResolvedValue(mockCalculationResult);
      jest.spyOn(service, 'getEffectivePricing').mockResolvedValue({
        pricingType: EnhancedPricingType.FLAT,
        basePrice: 20,
        currency: 'USD',
      } as any);

      // Mock repository
      const mockSpacePackageRepository = {
        findOne: jest.fn().mockResolvedValue(mockPackage),
      };
      (service as any).spacePackageRepository = mockSpacePackageRepository;

      const result = await service.calculateBookingCost({
        spacePackageId: 'package-1',
        extrasIds: ['extras-1'],
        quantity: 1,
        discountPercentage: 10,
        taxPercentage: 8,
      });

      expect(result.packageCost).toEqual(mockCalculationResult);
      expect(result.extrasCosts).toHaveLength(1);
      expect(result.totalCost.subtotal).toBe(200); // 100 + 100
      expect(result.totalCost.currency).toBe('USD');
    });

    it('should handle package not found', async () => {
      const mockSpacePackageRepository = {
        findOne: jest.fn().mockResolvedValue(null),
      };
      (service as any).spacePackageRepository = mockSpacePackageRepository;

      await expect(
        service.calculateBookingCost({
          spacePackageId: 'non-existent',
          extrasIds: [],
          quantity: 1,
        }),
      ).rejects.toThrow('Space package not found');
    });
  });
});
