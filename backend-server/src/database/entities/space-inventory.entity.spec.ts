import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PricingTierDto } from '../../api/pricing/dto/pricing.dto';
import { SpaceOptionEntity } from '../../api/space/entities/space-option.entity';
import { UserEntity } from '../../api/user/entities/user.entity';
import {
  EnhancedPricingType,
  RecurringInterval,
  SpacePackageEntity,
  UsageUnit,
} from './space-inventory.entity';

describe('SpacePackageEntity', () => {
  let spacePackageRepository: Repository<SpacePackageEntity>;
  let spaceOptionRepository: Repository<SpaceOptionEntity>;
  let userRepository: Repository<UserEntity>;

  const mockSpacePackageRepository = {
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

  const mockUserRepository = {
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: getRepositoryToken(SpacePackageEntity),
          useValue: mockSpacePackageRepository,
        },
        {
          provide: getRepositoryToken(SpaceOptionEntity),
          useValue: mockSpaceOptionRepository,
        },
        {
          provide: getRepositoryToken(UserEntity),
          useValue: mockUserRepository,
        },
      ],
    }).compile();

    spacePackageRepository = module.get<Repository<SpacePackageEntity>>(
      getRepositoryToken(SpacePackageEntity),
    );
    spaceOptionRepository = module.get<Repository<SpaceOptionEntity>>(
      getRepositoryToken(SpaceOptionEntity),
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

  describe('Flat Pricing Package', () => {
    const mockFlatPackage: Partial<SpacePackageEntity> = {
      id: 'package-1',
      name: 'Day Pass',
      description: 'Full day access',
      pricingType: EnhancedPricingType.FLAT,
      basePrice: 50,
      currency: 'USD',
      spaceOption: mockSpaceOption as SpaceOptionEntity,
      createdBy: mockUser as UserEntity,
      isActive: true,
      priority: 1,
    };

    it('should create a flat pricing package', () => {
      const spacePackage = new SpacePackageEntity();
      Object.assign(spacePackage, mockFlatPackage);

      expect(spacePackage.name).toBe('Day Pass');
      expect(spacePackage.pricingType).toBe(EnhancedPricingType.FLAT);
      expect(spacePackage.basePrice).toBe(50);
      expect(spacePackage.currency).toBe('USD');
    });

    it('should have proper default values for flat pricing', () => {
      const spacePackage = new SpacePackageEntity();
      spacePackage.pricingType = EnhancedPricingType.FLAT;

      expect(spacePackage.isActive).toBe(true);
      expect(spacePackage.priority).toBe(0);
      expect(spacePackage.totalBookings).toBe(0);
      expect(spacePackage.totalOrders).toBe(0);
    });

    it('should validate flat pricing constraints', () => {
      const spacePackage = new SpacePackageEntity();
      Object.assign(spacePackage, mockFlatPackage);

      // Should have basePrice and currency for flat pricing
      expect(spacePackage.basePrice).toBeGreaterThan(0);
      expect(spacePackage.currency).toBeDefined();
      expect(spacePackage.recurringInterval).toBeUndefined();
      expect(spacePackage.usageUnit).toBeUndefined();
    });
  });

  describe('Recurring Pricing Package', () => {
    const mockRecurringPackage: Partial<SpacePackageEntity> = {
      id: 'package-2',
      name: 'Monthly Membership',
      description: 'Monthly access to workspace',
      pricingType: EnhancedPricingType.RECURRING,
      basePrice: 200,
      currency: 'USD',
      recurringInterval: RecurringInterval.MONTHLY,
      recurringCount: 1,
      spaceOption: mockSpaceOption as SpaceOptionEntity,
      createdBy: mockUser as UserEntity,
      isActive: true,
    };

    it('should create a recurring pricing package', () => {
      const spacePackage = new SpacePackageEntity();
      Object.assign(spacePackage, mockRecurringPackage);

      expect(spacePackage.name).toBe('Monthly Membership');
      expect(spacePackage.pricingType).toBe(EnhancedPricingType.RECURRING);
      expect(spacePackage.basePrice).toBe(200);
      expect(spacePackage.recurringInterval).toBe(RecurringInterval.MONTHLY);
      expect(spacePackage.recurringCount).toBe(1);
    });

    it('should validate recurring pricing constraints', () => {
      const spacePackage = new SpacePackageEntity();
      Object.assign(spacePackage, mockRecurringPackage);

      // Should have recurring fields for recurring pricing
      expect(spacePackage.basePrice).toBeGreaterThan(0);
      expect(spacePackage.currency).toBeDefined();
      expect(spacePackage.recurringInterval).toBeDefined();
      expect(spacePackage.recurringCount).toBeGreaterThan(0);
    });

    it('should handle different recurring intervals', () => {
      const spacePackage = new SpacePackageEntity();

      // Daily recurring
      spacePackage.recurringInterval = RecurringInterval.DAILY;
      expect(spacePackage.recurringInterval).toBe(RecurringInterval.DAILY);

      // Weekly recurring
      spacePackage.recurringInterval = RecurringInterval.WEEKLY;
      expect(spacePackage.recurringInterval).toBe(RecurringInterval.WEEKLY);

      // Annual recurring
      spacePackage.recurringInterval = RecurringInterval.ANNUAL;
      expect(spacePackage.recurringInterval).toBe(RecurringInterval.ANNUAL);
    });
  });

  describe('Usage-Based Pricing Package', () => {
    const mockUsagePackage: Partial<SpacePackageEntity> = {
      id: 'package-3',
      name: 'Hourly Rate',
      description: 'Pay per hour usage',
      pricingType: EnhancedPricingType.USAGE_BASED,
      basePrice: 15,
      currency: 'USD',
      usageUnit: UsageUnit.PER_HOUR,
      minUsage: 1,
      maxUsage: 24,
      usageIncrement: 0.5,
      spaceOption: mockSpaceOption as SpaceOptionEntity,
      createdBy: mockUser as UserEntity,
      isActive: true,
    };

    it('should create a usage-based pricing package', () => {
      const spacePackage = new SpacePackageEntity();
      Object.assign(spacePackage, mockUsagePackage);

      expect(spacePackage.name).toBe('Hourly Rate');
      expect(spacePackage.pricingType).toBe(EnhancedPricingType.USAGE_BASED);
      expect(spacePackage.basePrice).toBe(15);
      expect(spacePackage.usageUnit).toBe(UsageUnit.PER_HOUR);
      expect(spacePackage.minUsage).toBe(1);
      expect(spacePackage.maxUsage).toBe(24);
      expect(spacePackage.usageIncrement).toBe(0.5);
    });

    it('should validate usage-based pricing constraints', () => {
      const spacePackage = new SpacePackageEntity();
      Object.assign(spacePackage, mockUsagePackage);

      // Should have usage fields for usage-based pricing
      expect(spacePackage.basePrice).toBeGreaterThan(0);
      expect(spacePackage.currency).toBeDefined();
      expect(spacePackage.usageUnit).toBeDefined();
      expect(spacePackage.minUsage).toBeGreaterThan(0);
      expect(spacePackage.maxUsage).toBeGreaterThanOrEqual(
        spacePackage.minUsage!,
      );
    });

    it('should handle different usage units', () => {
      const spacePackage = new SpacePackageEntity();

      // Per hour
      spacePackage.usageUnit = UsageUnit.PER_HOUR;
      expect(spacePackage.usageUnit).toBe(UsageUnit.PER_HOUR);

      // Per day
      spacePackage.usageUnit = UsageUnit.PER_DAY;
      expect(spacePackage.usageUnit).toBe(UsageUnit.PER_DAY);

      // Per person
      spacePackage.usageUnit = UsageUnit.PER_PERSON;
      expect(spacePackage.usageUnit).toBe(UsageUnit.PER_PERSON);
    });
  });

  describe('Tiered Pricing Package', () => {
    const mockTieredPackage: Partial<SpacePackageEntity> = {
      id: 'package-4',
      name: 'Volume Discount',
      description: 'Bulk booking discounts',
      pricingType: EnhancedPricingType.TIERED,
      currency: 'USD',
      pricingTiers: [
        { minQuantity: 1, maxQuantity: 10, pricePerUnit: 50 },
        { minQuantity: 11, maxQuantity: 50, pricePerUnit: 45 },
        { minQuantity: 51, maxQuantity: null, pricePerUnit: 40 },
      ] as PricingTierDto[],
      spaceOption: mockSpaceOption as SpaceOptionEntity,
      createdBy: mockUser as UserEntity,
      isActive: true,
    };

    it('should create a tiered pricing package', () => {
      const spacePackage = new SpacePackageEntity();
      Object.assign(spacePackage, mockTieredPackage);

      expect(spacePackage.name).toBe('Volume Discount');
      expect(spacePackage.pricingType).toBe(EnhancedPricingType.TIERED);
      expect(spacePackage.pricingTiers).toHaveLength(3);
      expect(spacePackage.pricingTiers![0].pricePerUnit).toBe(50);
      expect(spacePackage.pricingTiers![2].maxQuantity).toBeNull();
    });

    it('should validate tiered pricing structure', () => {
      const spacePackage = new SpacePackageEntity();
      Object.assign(spacePackage, mockTieredPackage);

      // Should have pricing tiers for tiered pricing
      expect(spacePackage.currency).toBeDefined();
      expect(spacePackage.pricingTiers).toBeDefined();
      expect(spacePackage.pricingTiers!.length).toBeGreaterThan(0);

      // Validate tier structure
      const tiers = spacePackage.pricingTiers!;
      expect(tiers[0].minQuantity).toBe(1);
      expect(tiers[1].minQuantity).toBe(11);
      expect(tiers[2].minQuantity).toBe(51);
    });
  });

  describe('Pricing Metadata', () => {
    it('should handle pricing metadata', () => {
      const spacePackage = new SpacePackageEntity();
      const metadata = {
        discountCode: 'EARLY_BIRD',
        validUntil: '2024-12-31',
        restrictions: ['weekdays_only', 'advance_booking_required'],
      };

      spacePackage.pricingMetadata = metadata;

      expect(spacePackage.pricingMetadata).toEqual(metadata);
      expect(spacePackage.pricingMetadata.discountCode).toBe('EARLY_BIRD');
      expect(spacePackage.pricingMetadata.restrictions).toContain(
        'weekdays_only',
      );
    });

    it('should handle empty pricing metadata', () => {
      const spacePackage = new SpacePackageEntity();

      expect(spacePackage.pricingMetadata).toBeUndefined();

      spacePackage.pricingMetadata = {};
      expect(spacePackage.pricingMetadata).toEqual({});
    });
  });

  describe('Business Logic', () => {
    it('should track booking statistics', () => {
      const spacePackage = new SpacePackageEntity();

      spacePackage.totalBookings = 50;
      spacePackage.totalOrders = 30;

      expect(spacePackage.totalBookings).toBe(50);
      expect(spacePackage.totalOrders).toBe(30);
    });

    it('should handle priority ordering', () => {
      const package1 = new SpacePackageEntity();
      const package2 = new SpacePackageEntity();

      package1.priority = 1;
      package2.priority = 2;

      expect(package1.priority).toBeLessThan(package2.priority);
    });

    it('should handle active/inactive status', () => {
      const spacePackage = new SpacePackageEntity();

      // Active by default
      expect(spacePackage.isActive).toBe(true);

      // Can be deactivated
      spacePackage.isActive = false;
      expect(spacePackage.isActive).toBe(false);
    });
  });

  describe('Relationships', () => {
    it('should have relationship with SpaceOptionEntity', () => {
      const spacePackage = new SpacePackageEntity();
      spacePackage.spaceOption = mockSpaceOption as SpaceOptionEntity;

      expect(spacePackage.spaceOption).toBeDefined();
      expect(spacePackage.spaceOption.id).toBe('space-option-1');
      expect(spacePackage.spaceOption.name).toBe('Private Office');
    });

    it('should have relationship with UserEntity (createdBy)', () => {
      const spacePackage = new SpacePackageEntity();
      spacePackage.createdBy = mockUser as UserEntity;

      expect(spacePackage.createdBy).toBeDefined();
      expect(spacePackage.createdBy.id).toBe('user-1');
      expect(spacePackage.createdBy.email).toBe('user@example.com');
    });
  });

  describe('Repository Operations', () => {
    it('should save space package entity', async () => {
      const spacePackage = {
        ...mockFlatPackage,
        spaceOption: mockSpaceOption,
        createdBy: mockUser,
      } as SpacePackageEntity;

      mockSpacePackageRepository.save.mockResolvedValue(spacePackage);

      const result = await spacePackageRepository.save(spacePackage);

      expect(mockSpacePackageRepository.save).toHaveBeenCalledWith(
        spacePackage,
      );
      expect(result).toEqual(spacePackage);
    });

    it('should find space package by id', async () => {
      const spacePackage = mockFlatPackage as SpacePackageEntity;
      mockSpacePackageRepository.findOne.mockResolvedValue(spacePackage);

      const result = await spacePackageRepository.findOne({
        where: { id: 'package-1' },
      });

      expect(mockSpacePackageRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'package-1' },
      });
      expect(result).toEqual(spacePackage);
    });

    it('should find packages by space option', async () => {
      const spacePackages = [mockFlatPackage] as SpacePackageEntity[];
      mockSpacePackageRepository.find.mockResolvedValue(spacePackages);

      const result = await spacePackageRepository.find({
        where: { spaceOption: { id: 'space-option-1' } },
      });

      expect(mockSpacePackageRepository.find).toHaveBeenCalledWith({
        where: { spaceOption: { id: 'space-option-1' } },
      });
      expect(result).toEqual(spacePackages);
    });

    it('should find packages by pricing type', async () => {
      const spacePackages = [mockFlatPackage] as SpacePackageEntity[];
      mockSpacePackageRepository.find.mockResolvedValue(spacePackages);

      const result = await spacePackageRepository.find({
        where: { pricingType: EnhancedPricingType.FLAT },
      });

      expect(mockSpacePackageRepository.find).toHaveBeenCalledWith({
        where: { pricingType: EnhancedPricingType.FLAT },
      });
      expect(result).toEqual(spacePackages);
    });
  });
});
