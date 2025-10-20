import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PartnerAddonEntity } from '../../../database/entities/partner-addon.entity';
import {
  EnhancedPricingType,
  RecurringInterval,
  UsageUnit,
} from '../../../database/entities/space-inventory.entity';
import { PartnerExtrasCategory } from '../../../database/entities/space.entity';
import { PartnerEntity } from '../../partner/entities/partner.entity';
import { PricingTierDto } from '../../pricing/dto/pricing.dto';
import { UserEntity } from '../../user/entities/user.entity';

describe('PartnerAddonEntity', () => {
  let partnerExtrasRepository: Repository<PartnerAddonEntity>;
  let partnerRepository: Repository<PartnerEntity>;
  let userRepository: Repository<UserEntity>;

  const mockPartnerAddonRepository = {
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

  const mockPartnerRepository = {
    findOne: jest.fn(),
  };

  const mockUserRepository = {
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: getRepositoryToken(PartnerAddonEntity),
          useValue: mockPartnerAddonRepository,
        },
        {
          provide: getRepositoryToken(PartnerEntity),
          useValue: mockPartnerRepository,
        },
        {
          provide: getRepositoryToken(UserEntity),
          useValue: mockUserRepository,
        },
      ],
    }).compile();

    partnerExtrasRepository = module.get<Repository<PartnerAddonEntity>>(
      getRepositoryToken(PartnerAddonEntity),
    );
    partnerRepository = module.get<Repository<PartnerEntity>>(
      getRepositoryToken(PartnerEntity),
    );
    userRepository = module.get<Repository<UserEntity>>(
      getRepositoryToken(UserEntity),
    );
  });

  // Mock data
  const mockUser: Partial<UserEntity> = {
    id: 'user-1',
    email: 'partner@example.com',
    firstName: 'John',
    lastName: 'Doe',
  };

  const mockPartner: Partial<PartnerEntity> = {
    id: 'partner-1',
    businessName: 'Test Space',
    user: mockUser as UserEntity,
  };

  describe('Basic Entity Creation', () => {
    const mockPartnerExtra: Partial<PartnerAddonEntity> = {
      id: 'extra-1',
      name: 'Premium WiFi',
      description: 'High-speed internet access',
      category: PartnerExtrasCategory.TECHNOLOGY,
      partner: mockPartner as PartnerEntity,
      createdBy: mockUser as UserEntity,
      isActive: true,
      priority: 1,
      stock: 100,
      rating: 4.5,
    };

    it('should create a partner extra entity', () => {
      const partnerExtra = new PartnerAddonEntity();
      Object.assign(partnerExtra, mockPartnerExtra);

      expect(partnerExtra.name).toBe('Premium WiFi');
      expect(partnerExtra.description).toBe('High-speed internet access');
      expect(partnerExtra.category).toBe(PartnerExtrasCategory.TECHNOLOGY);
      expect(partnerExtra.stock).toBe(100);
      expect(partnerExtra.rating).toBe(4.5);
    });

    it('should have proper default values', () => {
      const partnerExtra = new PartnerAddonEntity();

      expect(partnerExtra.isActive).toBe(true);
      expect(partnerExtra.priority).toBe(0);
      expect(partnerExtra.stock).toBe(0);
      expect(partnerExtra.rating).toBe(0);
      expect(partnerExtra.totalBookings).toBe(0);
      expect(partnerExtra.totalOrders).toBe(0);
    });
  });

  describe('Flat Pricing Partner Extra', () => {
    const mockFlatPricingExtra: Partial<PartnerAddonEntity> = {
      id: 'extra-flat-1',
      name: 'Parking Space',
      description: 'Reserved parking spot',
      category: PartnerExtrasCategory.PARKING,
      pricingType: EnhancedPricingType.FLAT,
      basePrice: 25,
      currency: 'USD',
      partner: mockPartner as PartnerEntity,
      createdBy: mockUser as UserEntity,
      isActive: true,
    };

    it('should create flat pricing partner extra', () => {
      const partnerExtra = new PartnerAddonEntity();
      Object.assign(partnerExtra, mockFlatPricingExtra);

      expect(partnerExtra.name).toBe('Parking Space');
      expect(partnerExtra.pricingType).toBe(EnhancedPricingType.FLAT);
      expect(partnerExtra.basePrice).toBe(25);
      expect(partnerExtra.currency).toBe('USD');
    });

    it('should validate flat pricing constraints', () => {
      const partnerExtra = new PartnerAddonEntity();
      Object.assign(partnerExtra, mockFlatPricingExtra);

      expect(partnerExtra.basePrice).toBeGreaterThan(0);
      expect(partnerExtra.currency).toBeDefined();
      expect(partnerExtra.recurringInterval).toBeUndefined();
      expect(partnerExtra.usageUnit).toBeUndefined();
    });
  });

  describe('Recurring Pricing Partner Extra', () => {
    const mockRecurringExtra: Partial<PartnerAddonEntity> = {
      id: 'extra-recurring-1',
      name: 'Locker Rental',
      description: 'Monthly locker rental',
      category: PartnerExtrasCategory.STORAGE,
      pricingType: EnhancedPricingType.RECURRING,
      basePrice: 50,
      currency: 'USD',
      recurringInterval: RecurringInterval.MONTHLY,
      recurringCount: 1,
      partner: mockPartner as PartnerEntity,
      createdBy: mockUser as UserEntity,
      isActive: true,
    };

    it('should create recurring pricing partner extra', () => {
      const partnerExtra = new PartnerAddonEntity();
      Object.assign(partnerExtra, mockRecurringExtra);

      expect(partnerExtra.name).toBe('Locker Rental');
      expect(partnerExtra.pricingType).toBe(EnhancedPricingType.RECURRING);
      expect(partnerExtra.basePrice).toBe(50);
      expect(partnerExtra.recurringInterval).toBe(RecurringInterval.MONTHLY);
      expect(partnerExtra.recurringCount).toBe(1);
    });

    it('should validate recurring pricing constraints', () => {
      const partnerExtra = new PartnerAddonEntity();
      Object.assign(partnerExtra, mockRecurringExtra);

      expect(partnerExtra.basePrice).toBeGreaterThan(0);
      expect(partnerExtra.currency).toBeDefined();
      expect(partnerExtra.recurringInterval).toBeDefined();
      expect(partnerExtra.recurringCount).toBeGreaterThan(0);
    });
  });

  describe('Usage-Based Pricing Partner Extra', () => {
    const mockUsageExtra: Partial<PartnerAddonEntity> = {
      id: 'extra-usage-1',
      name: 'Meeting Room',
      description: 'Hourly meeting room rental',
      category: PartnerExtrasCategory.MEETING_ROOMS,
      pricingType: EnhancedPricingType.USAGE_BASED,
      basePrice: 30,
      currency: 'USD',
      usageUnit: UsageUnit.PER_HOUR,
      minUsage: 1,
      maxUsage: 8,
      usageIncrement: 0.5,
      partner: mockPartner as PartnerEntity,
      createdBy: mockUser as UserEntity,
      isActive: true,
    };

    it('should create usage-based pricing partner extra', () => {
      const partnerExtra = new PartnerAddonEntity();
      Object.assign(partnerExtra, mockUsageExtra);

      expect(partnerExtra.name).toBe('Meeting Room');
      expect(partnerExtra.pricingType).toBe(EnhancedPricingType.USAGE_BASED);
      expect(partnerExtra.basePrice).toBe(30);
      expect(partnerExtra.usageUnit).toBe(UsageUnit.PER_HOUR);
      expect(partnerExtra.minUsage).toBe(1);
      expect(partnerExtra.maxUsage).toBe(8);
      expect(partnerExtra.usageIncrement).toBe(0.5);
    });

    it('should validate usage-based pricing constraints', () => {
      const partnerExtra = new PartnerAddonEntity();
      Object.assign(partnerExtra, mockUsageExtra);

      expect(partnerExtra.basePrice).toBeGreaterThan(0);
      expect(partnerExtra.currency).toBeDefined();
      expect(partnerExtra.usageUnit).toBeDefined();
      expect(partnerExtra.minUsage).toBeGreaterThan(0);
      expect(partnerExtra.maxUsage).toBeGreaterThanOrEqual(
        partnerExtra.minUsage!,
      );
    });
  });

  describe('Tiered Pricing Partner Extra', () => {
    const mockTieredExtra: Partial<PartnerAddonEntity> = {
      id: 'extra-tiered-1',
      name: 'Catering Service',
      description: 'Bulk catering with volume discounts',
      category: PartnerExtrasCategory.CATERING,
      pricingType: EnhancedPricingType.TIERED,
      currency: 'USD',
      pricingTiers: [
        { minQuantity: 1, maxQuantity: 10, pricePerUnit: 15 },
        { minQuantity: 11, maxQuantity: 50, pricePerUnit: 12 },
        { minQuantity: 51, maxQuantity: null, pricePerUnit: 10 },
      ] as PricingTierDto[],
      partner: mockPartner as PartnerEntity,
      createdBy: mockUser as UserEntity,
      isActive: true,
    };

    it('should create tiered pricing partner extra', () => {
      const partnerExtra = new PartnerAddonEntity();
      Object.assign(partnerExtra, mockTieredExtra);

      expect(partnerExtra.name).toBe('Catering Service');
      expect(partnerExtra.pricingType).toBe(EnhancedPricingType.TIERED);
      expect(partnerExtra.pricingTiers).toHaveLength(3);
      expect(partnerExtra.pricingTiers![0].pricePerUnit).toBe(15);
      expect(partnerExtra.pricingTiers![2].maxQuantity).toBeNull();
    });

    it('should validate tiered pricing structure', () => {
      const partnerExtra = new PartnerAddonEntity();
      Object.assign(partnerExtra, mockTieredExtra);

      expect(partnerExtra.currency).toBeDefined();
      expect(partnerExtra.pricingTiers).toBeDefined();
      expect(partnerExtra.pricingTiers!.length).toBeGreaterThan(0);

      const tiers = partnerExtra.pricingTiers!;
      expect(tiers[0].minQuantity).toBe(1);
      expect(tiers[1].minQuantity).toBe(11);
      expect(tiers[2].minQuantity).toBe(51);
    });
  });

  describe('Categories and Business Logic', () => {
    it('should handle different categories', () => {
      const partnerExtra = new PartnerAddonEntity();

      // Technology category
      partnerExtra.category = PartnerExtrasCategory.TECHNOLOGY;
      expect(partnerExtra.category).toBe(PartnerExtrasCategory.TECHNOLOGY);

      // Food & Beverage category
      partnerExtra.category = PartnerExtrasCategory.FOOD_BEVERAGE;
      expect(partnerExtra.category).toBe(PartnerExtrasCategory.FOOD_BEVERAGE);

      // Equipment category
      partnerExtra.category = PartnerExtrasCategory.EQUIPMENT;
      expect(partnerExtra.category).toBe(PartnerExtrasCategory.EQUIPMENT);
    });

    it('should track stock levels', () => {
      const partnerExtra = new PartnerAddonEntity();

      partnerExtra.stock = 50;
      expect(partnerExtra.stock).toBe(50);

      // Simulate stock reduction
      partnerExtra.stock -= 5;
      expect(partnerExtra.stock).toBe(45);
    });

    it('should track booking and order statistics', () => {
      const partnerExtra = new PartnerAddonEntity();

      partnerExtra.totalBookings = 25;
      partnerExtra.totalOrders = 15;

      expect(partnerExtra.totalBookings).toBe(25);
      expect(partnerExtra.totalOrders).toBe(15);
    });

    it('should handle priority ordering', () => {
      const extra1 = new PartnerAddonEntity();
      const extra2 = new PartnerAddonEntity();

      extra1.priority = 1;
      extra2.priority = 2;

      expect(extra1.priority).toBeLessThan(extra2.priority);
    });

    it('should handle active/inactive status', () => {
      const partnerExtra = new PartnerAddonEntity();

      // Active by default
      expect(partnerExtra.isActive).toBe(true);

      // Can be deactivated
      partnerExtra.isActive = false;
      expect(partnerExtra.isActive).toBe(false);
    });

    it('should handle rating system', () => {
      const partnerExtra = new PartnerAddonEntity();

      partnerExtra.rating = 4.7;
      expect(partnerExtra.rating).toBe(4.7);

      // Rating should be between 0 and 5 (enforced by DB constraints)
      partnerExtra.rating = 5.0;
      expect(partnerExtra.rating).toBe(5.0);
    });
  });

  describe('Pricing Metadata', () => {
    it('should handle pricing metadata', () => {
      const partnerExtra = new PartnerAddonEntity();
      const metadata = {
        seasonalPricing: true,
        peakHours: ['09:00-12:00', '14:00-17:00'],
        discountEligible: true,
        minimumNotice: '24 hours',
      };

      partnerExtra.pricingMetadata = metadata;

      expect(partnerExtra.pricingMetadata).toEqual(metadata);
      expect(partnerExtra.pricingMetadata.seasonalPricing).toBe(true);
      expect(partnerExtra.pricingMetadata.peakHours).toContain('09:00-12:00');
    });
  });

  describe('Relationships', () => {
    it('should have relationship with PartnerEntity', () => {
      const partnerExtra = new PartnerAddonEntity();
      partnerExtra.partner = mockPartner as PartnerEntity;

      expect(partnerExtra.partner).toBeDefined();
      expect(partnerExtra.partner.id).toBe('partner-1');
      expect(partnerExtra.partner.businessName).toBe('Test Space');
    });

    it('should have relationship with UserEntity (createdBy)', () => {
      const partnerExtra = new PartnerAddonEntity();
      partnerExtra.createdBy = mockUser as UserEntity;

      expect(partnerExtra.createdBy).toBeDefined();
      expect(partnerExtra.createdBy.id).toBe('user-1');
      expect(partnerExtra.createdBy.email).toBe('partner@example.com');
    });
  });

  describe('Repository Operations', () => {
    it('should save partner extra entity', async () => {
      const partnerExtra = {
        id: 'extra-1',
        name: 'Test Extra',
        partner: mockPartner,
        createdBy: mockUser,
      } as PartnerAddonEntity;

      mockPartnerExtrasRepository.save.mockResolvedValue(partnerExtra);

      const result = await partnerExtrasRepository.save(partnerExtra);

      expect(mockPartnerExtrasRepository.save).toHaveBeenCalledWith(
        partnerExtra,
      );
      expect(result).toEqual(partnerExtra);
    });

    it('should find partner extra by id', async () => {
      const partnerExtra = {
        id: 'extra-1',
        name: 'Test Extra',
      } as PartnerAddonEntity;
      mockPartnerExtrasRepository.findOne.mockResolvedValue(partnerExtra);

      const result = await partnerExtrasRepository.findOne({
        where: { id: 'extra-1' },
      });

      expect(mockPartnerExtrasRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'extra-1' },
      });
      expect(result).toEqual(partnerExtra);
    });

    it('should find extras by partner', async () => {
      const partnerExtras = [
        { id: 'extra-1', name: 'Extra 1' },
        { id: 'extra-2', name: 'Extra 2' },
      ] as PartnerAddonEntity[];

      mockPartnerExtrasRepository.find.mockResolvedValue(partnerExtras);

      const result = await partnerExtrasRepository.find({
        where: { partner: { id: 'partner-1' } },
      });

      expect(mockPartnerExtrasRepository.find).toHaveBeenCalledWith({
        where: { partner: { id: 'partner-1' } },
      });
      expect(result).toEqual(partnerExtras);
    });

    it('should find extras by category', async () => {
      const partnerExtras = [
        { id: 'extra-1', category: PartnerExtrasCategory.TECHNOLOGY },
      ] as PartnerAddonEntity[];

      mockPartnerExtrasRepository.find.mockResolvedValue(partnerExtras);

      const result = await partnerExtrasRepository.find({
        where: { category: PartnerExtrasCategory.TECHNOLOGY },
      });

      expect(mockPartnerExtrasRepository.find).toHaveBeenCalledWith({
        where: { category: PartnerExtrasCategory.TECHNOLOGY },
      });
      expect(result).toEqual(partnerExtras);
    });
  });
});
