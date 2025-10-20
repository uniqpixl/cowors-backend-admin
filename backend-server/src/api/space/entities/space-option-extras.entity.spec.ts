import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PartnerAddonEntity } from '../../../database/entities/partner-addon.entity';
import {
  EnhancedPricingType,
  RecurringInterval,
  UsageUnit,
} from '../../../database/entities/space-inventory.entity';
import { PricingTierDto } from '../../pricing/dto/pricing.dto';
import { UserEntity } from '../../user/entities/user.entity';
import { SpaceOptionExtrasEntity } from './space-option-extras.entity';
import { SpaceOptionEntity } from './space-option.entity';

describe('SpaceOptionExtrasEntity', () => {
  let spaceOptionExtrasRepository: Repository<SpaceOptionExtrasEntity>;
  let spaceOptionRepository: Repository<SpaceOptionEntity>;
  let partnerExtrasRepository: Repository<PartnerAddonEntity>;
  let userRepository: Repository<UserEntity>;

  const mockSpaceOptionExtrasRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    createQueryBuilder: jest.fn(() => ({
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      getMany: jest.fn(),
      getOne: jest.fn(),
    })),
  };

  const mockSpaceOptionRepository = {
    findOne: jest.fn(),
  };

  const mockPartnerExtrasRepository = {
    findOne: jest.fn(),
  };

  const mockUserRepository = {
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: getRepositoryToken(SpaceOptionExtrasEntity),
          useValue: mockSpaceOptionExtrasRepository,
        },
        {
          provide: getRepositoryToken(SpaceOptionEntity),
          useValue: mockSpaceOptionRepository,
        },
        {
          provide: getRepositoryToken(PartnerAddonEntity),
          useValue: mockPartnerExtrasRepository,
        },
        {
          provide: getRepositoryToken(UserEntity),
          useValue: mockUserRepository,
        },
      ],
    }).compile();

    spaceOptionExtrasRepository = module.get<
      Repository<SpaceOptionExtrasEntity>
    >(getRepositoryToken(SpaceOptionExtrasEntity));
    spaceOptionRepository = module.get<Repository<SpaceOptionEntity>>(
      getRepositoryToken(SpaceOptionEntity),
    );
    partnerExtrasRepository = module.get<Repository<PartnerAddonEntity>>(
      getRepositoryToken(PartnerAddonEntity),
    );
    userRepository = module.get<Repository<UserEntity>>(
      getRepositoryToken(UserEntity),
    );
  });

  // Mock data
  const mockUser: Partial<UserEntity> = {
    id: 'user-1',
    email: 'user@example.com',
    firstName: 'John',
    lastName: 'Doe',
  };

  const mockSpaceOption: Partial<SpaceOptionEntity> = {
    id: 'space-option-1',
    name: 'Private Office',
    description: 'A private office space',
  };

  const mockPartnerExtra: Partial<PartnerAddonEntity> = {
    id: 'partner-extra-1',
    name: 'Premium WiFi',
    description: 'High-speed internet access',
  };

  describe('Basic Entity Creation', () => {
    const mockSpaceOptionExtra: Partial<SpaceOptionExtrasEntity> = {
      id: 'space-option-extra-1',
      spaceOption: mockSpaceOption as SpaceOptionEntity,
      partnerExtras: mockPartnerExtra as PartnerAddonEntity,
      isIncluded: true,
      isMandatory: false,
      priority: 1,
      createdBy: mockUser as UserEntity,
    };

    it('should create a space option extra entity', () => {
      const spaceOptionExtra = new SpaceOptionExtrasEntity();
      Object.assign(spaceOptionExtra, mockSpaceOptionExtra);

      expect(spaceOptionExtra.isIncluded).toBe(true);
      expect(spaceOptionExtra.isMandatory).toBe(false);
      expect(spaceOptionExtra.priority).toBe(1);
      expect(spaceOptionExtra.spaceOption.id).toBe('space-option-1');
      expect(spaceOptionExtra.partnerExtras.id).toBe('partner-extra-1');
    });

    it('should have proper default values', () => {
      const spaceOptionExtra = new SpaceOptionExtrasEntity();

      expect(spaceOptionExtra.isIncluded).toBe(false);
      expect(spaceOptionExtra.isMandatory).toBe(false);
      expect(spaceOptionExtra.priority).toBe(0);
    });
  });

  describe('Included Extra (No Custom Pricing)', () => {
    const mockIncludedExtra: Partial<SpaceOptionExtrasEntity> = {
      id: 'included-extra-1',
      spaceOption: mockSpaceOption as SpaceOptionEntity,
      partnerExtras: mockPartnerExtra as PartnerAddonEntity,
      isIncluded: true,
      isMandatory: true,
      priority: 1,
      createdBy: mockUser as UserEntity,
    };

    it('should create included extra without custom pricing', () => {
      const spaceOptionExtra = new SpaceOptionExtrasEntity();
      Object.assign(spaceOptionExtra, mockIncludedExtra);

      expect(spaceOptionExtra.isIncluded).toBe(true);
      expect(spaceOptionExtra.isMandatory).toBe(true);
      expect(spaceOptionExtra.pricingType).toBeUndefined();
      expect(spaceOptionExtra.basePrice).toBeUndefined();
    });

    it('should validate included extra logic', () => {
      const spaceOptionExtra = new SpaceOptionExtrasEntity();
      Object.assign(spaceOptionExtra, mockIncludedExtra);

      // Included extras should not have custom pricing
      expect(spaceOptionExtra.isIncluded).toBe(true);
      expect(spaceOptionExtra.pricingType).toBeUndefined();
    });
  });

  describe('Optional Extra with Flat Pricing Override', () => {
    const mockFlatPricingExtra: Partial<SpaceOptionExtrasEntity> = {
      id: 'flat-pricing-extra-1',
      spaceOption: mockSpaceOption as SpaceOptionEntity,
      partnerExtras: mockPartnerExtra as PartnerAddonEntity,
      isIncluded: false,
      isMandatory: false,
      pricingType: EnhancedPricingType.FLAT,
      basePrice: 15,
      currency: 'USD',
      priority: 2,
      createdBy: mockUser as UserEntity,
    };

    it('should create optional extra with flat pricing override', () => {
      const spaceOptionExtra = new SpaceOptionExtrasEntity();
      Object.assign(spaceOptionExtra, mockFlatPricingExtra);

      expect(spaceOptionExtra.isIncluded).toBe(false);
      expect(spaceOptionExtra.pricingType).toBe(EnhancedPricingType.FLAT);
      expect(spaceOptionExtra.basePrice).toBe(15);
      expect(spaceOptionExtra.currency).toBe('USD');
    });

    it('should validate flat pricing override constraints', () => {
      const spaceOptionExtra = new SpaceOptionExtrasEntity();
      Object.assign(spaceOptionExtra, mockFlatPricingExtra);

      expect(spaceOptionExtra.basePrice).toBeGreaterThan(0);
      expect(spaceOptionExtra.currency).toBeDefined();
      expect(spaceOptionExtra.recurringInterval).toBeUndefined();
      expect(spaceOptionExtra.usageUnit).toBeUndefined();
    });
  });

  describe('Optional Extra with Recurring Pricing Override', () => {
    const mockRecurringExtra: Partial<SpaceOptionExtrasEntity> = {
      id: 'recurring-extra-1',
      spaceOption: mockSpaceOption as SpaceOptionEntity,
      partnerExtras: mockPartnerExtra as PartnerAddonEntity,
      isIncluded: false,
      isMandatory: false,
      pricingType: EnhancedPricingType.RECURRING,
      basePrice: 30,
      currency: 'USD',
      recurringInterval: RecurringInterval.WEEKLY,
      recurringCount: 1,
      priority: 3,
      createdBy: mockUser as UserEntity,
    };

    it('should create optional extra with recurring pricing override', () => {
      const spaceOptionExtra = new SpaceOptionExtrasEntity();
      Object.assign(spaceOptionExtra, mockRecurringExtra);

      expect(spaceOptionExtra.isIncluded).toBe(false);
      expect(spaceOptionExtra.pricingType).toBe(EnhancedPricingType.RECURRING);
      expect(spaceOptionExtra.basePrice).toBe(30);
      expect(spaceOptionExtra.recurringInterval).toBe(RecurringInterval.WEEKLY);
      expect(spaceOptionExtra.recurringCount).toBe(1);
    });

    it('should validate recurring pricing override constraints', () => {
      const spaceOptionExtra = new SpaceOptionExtrasEntity();
      Object.assign(spaceOptionExtra, mockRecurringExtra);

      expect(spaceOptionExtra.basePrice).toBeGreaterThan(0);
      expect(spaceOptionExtra.currency).toBeDefined();
      expect(spaceOptionExtra.recurringInterval).toBeDefined();
      expect(spaceOptionExtra.recurringCount).toBeGreaterThan(0);
    });
  });

  describe('Optional Extra with Usage-Based Pricing Override', () => {
    const mockUsageExtra: Partial<SpaceOptionExtrasEntity> = {
      id: 'usage-extra-1',
      spaceOption: mockSpaceOption as SpaceOptionEntity,
      partnerExtras: mockPartnerExtra as PartnerAddonEntity,
      isIncluded: false,
      isMandatory: false,
      pricingType: EnhancedPricingType.USAGE_BASED,
      basePrice: 5,
      currency: 'USD',
      usageUnit: UsageUnit.PER_HOUR,
      minUsage: 1,
      maxUsage: 12,
      usageIncrement: 0.25,
      priority: 4,
      createdBy: mockUser as UserEntity,
    };

    it('should create optional extra with usage-based pricing override', () => {
      const spaceOptionExtra = new SpaceOptionExtrasEntity();
      Object.assign(spaceOptionExtra, mockUsageExtra);

      expect(spaceOptionExtra.isIncluded).toBe(false);
      expect(spaceOptionExtra.pricingType).toBe(
        EnhancedPricingType.USAGE_BASED,
      );
      expect(spaceOptionExtra.basePrice).toBe(5);
      expect(spaceOptionExtra.usageUnit).toBe(UsageUnit.PER_HOUR);
      expect(spaceOptionExtra.minUsage).toBe(1);
      expect(spaceOptionExtra.maxUsage).toBe(12);
      expect(spaceOptionExtra.usageIncrement).toBe(0.25);
    });

    it('should validate usage-based pricing override constraints', () => {
      const spaceOptionExtra = new SpaceOptionExtrasEntity();
      Object.assign(spaceOptionExtra, mockUsageExtra);

      expect(spaceOptionExtra.basePrice).toBeGreaterThan(0);
      expect(spaceOptionExtra.currency).toBeDefined();
      expect(spaceOptionExtra.usageUnit).toBeDefined();
      expect(spaceOptionExtra.minUsage).toBeGreaterThan(0);
      expect(spaceOptionExtra.maxUsage).toBeGreaterThanOrEqual(
        spaceOptionExtra.minUsage!,
      );
    });
  });

  describe('Optional Extra with Tiered Pricing Override', () => {
    const mockTieredExtra: Partial<SpaceOptionExtrasEntity> = {
      id: 'tiered-extra-1',
      spaceOption: mockSpaceOption as SpaceOptionEntity,
      partnerExtras: mockPartnerExtra as PartnerAddonEntity,
      isIncluded: false,
      isMandatory: false,
      pricingType: EnhancedPricingType.TIERED,
      currency: 'USD',
      pricingTiers: [
        { minQuantity: 1, maxQuantity: 5, pricePerUnit: 10 },
        { minQuantity: 6, maxQuantity: 20, pricePerUnit: 8 },
        { minQuantity: 21, maxQuantity: null, pricePerUnit: 6 },
      ] as PricingTierDto[],
      priority: 5,
      createdBy: mockUser as UserEntity,
    };

    it('should create optional extra with tiered pricing override', () => {
      const spaceOptionExtra = new SpaceOptionExtrasEntity();
      Object.assign(spaceOptionExtra, mockTieredExtra);

      expect(spaceOptionExtra.isIncluded).toBe(false);
      expect(spaceOptionExtra.pricingType).toBe(EnhancedPricingType.TIERED);
      expect(spaceOptionExtra.pricingTiers).toHaveLength(3);
      expect(spaceOptionExtra.pricingTiers![0].pricePerUnit).toBe(10);
      expect(spaceOptionExtra.pricingTiers![2].maxQuantity).toBeNull();
    });

    it('should validate tiered pricing override structure', () => {
      const spaceOptionExtra = new SpaceOptionExtrasEntity();
      Object.assign(spaceOptionExtra, mockTieredExtra);

      expect(spaceOptionExtra.currency).toBeDefined();
      expect(spaceOptionExtra.pricingTiers).toBeDefined();
      expect(spaceOptionExtra.pricingTiers!.length).toBeGreaterThan(0);

      const tiers = spaceOptionExtra.pricingTiers!;
      expect(tiers[0].minQuantity).toBe(1);
      expect(tiers[1].minQuantity).toBe(6);
      expect(tiers[2].minQuantity).toBe(21);
    });
  });

  describe('Business Logic and Validation', () => {
    it('should handle mandatory vs optional extras', () => {
      const mandatoryExtra = new SpaceOptionExtrasEntity();
      const optionalExtra = new SpaceOptionExtrasEntity();

      mandatoryExtra.isMandatory = true;
      mandatoryExtra.isIncluded = true;

      optionalExtra.isMandatory = false;
      optionalExtra.isIncluded = false;

      expect(mandatoryExtra.isMandatory).toBe(true);
      expect(mandatoryExtra.isIncluded).toBe(true);
      expect(optionalExtra.isMandatory).toBe(false);
      expect(optionalExtra.isIncluded).toBe(false);
    });

    it('should handle priority ordering', () => {
      const extra1 = new SpaceOptionExtrasEntity();
      const extra2 = new SpaceOptionExtrasEntity();

      extra1.priority = 1;
      extra2.priority = 2;

      expect(extra1.priority).toBeLessThan(extra2.priority);
    });

    it('should validate pricing override logic', () => {
      const includedExtra = new SpaceOptionExtrasEntity();
      const paidExtra = new SpaceOptionExtrasEntity();

      // Included extra should not have pricing override
      includedExtra.isIncluded = true;
      expect(includedExtra.pricingType).toBeUndefined();

      // Paid extra can have pricing override
      paidExtra.isIncluded = false;
      paidExtra.pricingType = EnhancedPricingType.FLAT;
      paidExtra.basePrice = 20;
      paidExtra.currency = 'USD';

      expect(paidExtra.pricingType).toBe(EnhancedPricingType.FLAT);
      expect(paidExtra.basePrice).toBe(20);
    });
  });

  describe('Pricing Metadata', () => {
    it('should handle pricing metadata for overrides', () => {
      const spaceOptionExtra = new SpaceOptionExtrasEntity();
      const metadata = {
        overrideReason: 'Special discount for this space option',
        validFrom: '2024-01-01',
        validUntil: '2024-12-31',
        conditions: ['minimum_booking_duration'],
      };

      spaceOptionExtra.pricingMetadata = metadata;

      expect(spaceOptionExtra.pricingMetadata).toEqual(metadata);
      expect(spaceOptionExtra.pricingMetadata.overrideReason).toBe(
        'Special discount for this space option',
      );
      expect(spaceOptionExtra.pricingMetadata.conditions).toContain(
        'minimum_booking_duration',
      );
    });
  });

  describe('Relationships', () => {
    it('should have relationship with SpaceOptionEntity', () => {
      const spaceOptionExtra = new SpaceOptionExtrasEntity();
      spaceOptionExtra.spaceOption = mockSpaceOption as SpaceOptionEntity;

      expect(spaceOptionExtra.spaceOption).toBeDefined();
      expect(spaceOptionExtra.spaceOption.id).toBe('space-option-1');
      expect(spaceOptionExtra.spaceOption.name).toBe('Private Office');
    });

    it('should have relationship with PartnerAddonEntity', () => {
      const spaceOptionExtra = new SpaceOptionExtrasEntity();
      spaceOptionExtra.partnerExtras = mockPartnerExtra as PartnerAddonEntity;

      expect(spaceOptionExtra.partnerExtras).toBeDefined();
      expect(spaceOptionExtra.partnerExtras.id).toBe('partner-extra-1');
      expect(spaceOptionExtra.partnerExtras.name).toBe('Premium WiFi');
    });

    it('should have relationship with UserEntity (createdBy)', () => {
      const spaceOptionExtra = new SpaceOptionExtrasEntity();
      spaceOptionExtra.createdBy = mockUser as UserEntity;

      expect(spaceOptionExtra.createdBy).toBeDefined();
      expect(spaceOptionExtra.createdBy.id).toBe('user-1');
      expect(spaceOptionExtra.createdBy.email).toBe('user@example.com');
    });
  });

  describe('Repository Operations', () => {
    it('should save space option extra entity', async () => {
      const spaceOptionExtra = {
        id: 'space-option-extra-1',
        spaceOption: mockSpaceOption,
        partnerExtras: mockPartnerExtra,
        createdBy: mockUser,
      } as SpaceOptionExtrasEntity;

      mockSpaceOptionExtrasRepository.save.mockResolvedValue(spaceOptionExtra);

      const result = await spaceOptionExtrasRepository.save(spaceOptionExtra);

      expect(mockSpaceOptionExtrasRepository.save).toHaveBeenCalledWith(
        spaceOptionExtra,
      );
      expect(result).toEqual(spaceOptionExtra);
    });

    it('should find space option extra by id', async () => {
      const spaceOptionExtra = {
        id: 'space-option-extra-1',
      } as SpaceOptionExtrasEntity;
      mockSpaceOptionExtrasRepository.findOne.mockResolvedValue(
        spaceOptionExtra,
      );

      const result = await spaceOptionExtrasRepository.findOne({
        where: { id: 'space-option-extra-1' },
      });

      expect(mockSpaceOptionExtrasRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'space-option-extra-1' },
      });
      expect(result).toEqual(spaceOptionExtra);
    });

    it('should find extras by space option', async () => {
      const spaceOptionExtras = [
        { id: 'extra-1', isIncluded: true },
        { id: 'extra-2', isIncluded: false },
      ] as SpaceOptionExtrasEntity[];

      mockSpaceOptionExtrasRepository.find.mockResolvedValue(spaceOptionExtras);

      const result = await spaceOptionExtrasRepository.find({
        where: { spaceOption: { id: 'space-option-1' } },
      });

      expect(mockSpaceOptionExtrasRepository.find).toHaveBeenCalledWith({
        where: { spaceOption: { id: 'space-option-1' } },
      });
      expect(result).toEqual(spaceOptionExtras);
    });

    it('should find mandatory extras', async () => {
      const mandatoryExtras = [
        { id: 'extra-1', isMandatory: true },
      ] as SpaceOptionExtrasEntity[];

      mockSpaceOptionExtrasRepository.find.mockResolvedValue(mandatoryExtras);

      const result = await spaceOptionExtrasRepository.find({
        where: { isMandatory: true },
      });

      expect(mockSpaceOptionExtrasRepository.find).toHaveBeenCalledWith({
        where: { isMandatory: true },
      });
      expect(result).toEqual(mandatoryExtras);
    });

    it('should find included extras', async () => {
      const includedExtras = [
        { id: 'extra-1', isIncluded: true },
      ] as SpaceOptionExtrasEntity[];

      mockSpaceOptionExtrasRepository.find.mockResolvedValue(includedExtras);

      const result = await spaceOptionExtrasRepository.find({
        where: { isIncluded: true },
      });

      expect(mockSpaceOptionExtrasRepository.find).toHaveBeenCalledWith({
        where: { isIncluded: true },
      });
      expect(result).toEqual(includedExtras);
    });
  });
});
