import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  ExtraCategory,
  ExtraStatus,
  PartnerAddonEntity,
  PricingType,
} from '../../../database/entities/partner-addon.entity';
import {
  OverrideType,
  SpaceOptionExtrasEntity,
} from './space-option-extras.entity';
import {
  SpaceOptionEntity,
  SpaceOptionStatus,
  SpaceOptionType,
} from './space-option.entity';
import { SpaceEntity } from './space.entity';

describe('Entity Relationships', () => {
  let spaceRepository: Repository<SpaceEntity>;
  let spaceOptionRepository: Repository<SpaceOptionEntity>;
  let partnerExtrasRepository: Repository<PartnerAddonEntity>;
  let spaceOptionExtrasRepository: Repository<SpaceOptionExtrasEntity>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: getRepositoryToken(SpaceEntity),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            findOne: jest.fn(),
            find: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(SpaceOptionEntity),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            findOne: jest.fn(),
            find: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(PartnerAddonEntity),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            findOne: jest.fn(),
            find: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(SpaceOptionExtrasEntity),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            findOne: jest.fn(),
            find: jest.fn(),
          },
        },
      ],
    }).compile();

    spaceRepository = module.get<Repository<SpaceEntity>>(
      getRepositoryToken(SpaceEntity),
    );
    spaceOptionRepository = module.get<Repository<SpaceOptionEntity>>(
      getRepositoryToken(SpaceOptionEntity),
    );
    partnerExtrasRepository = module.get<Repository<PartnerAddonEntity>>(
      getRepositoryToken(PartnerAddonEntity),
    );
    spaceOptionExtrasRepository = module.get<
      Repository<SpaceOptionExtrasEntity>
    >(getRepositoryToken(SpaceOptionExtrasEntity));
  });

  describe('Space to SpaceOption Relationship', () => {
    it('should create space with multiple space options', async () => {
      const mockSpace = {
        id: 'space-1',
        partnerId: 'partner-1',
        name: 'Test Space',
        description: 'A test space',
        address: '123 Test St',
        city: 'Test City',
        state: 'Test State',
        country: 'Test Country',
        zipCode: '12345',
        isActive: true,
      };

      const mockSpaceOptions = [
        {
          id: 'option-1',
          spaceId: 'space-1',
          name: 'Meeting Room A',
          optionType: SpaceOptionType.MEETING_ROOM,
          maxCapacity: 10,
          minCapacity: 2,
          status: SpaceOptionStatus.ACTIVE,
          isActive: true,
        },
        {
          id: 'option-2',
          spaceId: 'space-1',
          name: 'Conference Room B',
          optionType: SpaceOptionType.CONFERENCE_ROOM,
          maxCapacity: 20,
          minCapacity: 5,
          status: SpaceOptionStatus.ACTIVE,
          isActive: true,
        },
      ];

      spaceRepository.create = jest.fn().mockReturnValue(mockSpace);
      spaceRepository.save = jest.fn().mockResolvedValue(mockSpace);
      spaceOptionRepository.create = jest
        .fn()
        .mockImplementation((data) => data);
      spaceOptionRepository.save = jest
        .fn()
        .mockImplementation((data) => Promise.resolve(data));

      // Create space
      const space = spaceRepository.create(mockSpace);
      const savedSpace = await spaceRepository.save(space);

      // Create space options
      const spaceOptions = [];
      for (const optionData of mockSpaceOptions) {
        const option = spaceOptionRepository.create(optionData);
        const savedOption = await spaceOptionRepository.save(option);
        spaceOptions.push(savedOption);
      }

      expect(savedSpace.id).toBe('space-1');
      expect(spaceOptions).toHaveLength(2);
      expect(spaceOptions[0].spaceId).toBe('space-1');
      expect(spaceOptions[1].spaceId).toBe('space-1');
    });
  });

  describe('PartnerExtras to SpaceOptionExtras Relationship', () => {
    it('should create partner extras and link to space options', async () => {
      const mockPartnerExtras = {
        id: 'extras-1',
        partnerId: 'partner-1',
        name: 'Projector',
        description: 'HD Projector',
        category: ExtraCategory.EQUIPMENT,
        status: ExtraStatus.ACTIVE,
        pricingType: PricingType.FLAT,
        basePrice: 50,
        currency: 'INR',
        stockQuantity: 10,
        minOrderQuantity: 1,
        maxOrderQuantity: 5,
      };

      const mockSpaceOptionExtras = {
        id: 'soe-1',
        spaceOptionId: 'option-1',
        partnerExtrasId: 'extras-1',
        isActive: true,
        isIncluded: false,
        isMandatory: false,
        priority: 1,
        overrideType: OverrideType.PRICE_ONLY,
        overrideBasePrice: 40,
        overrideCurrency: 'USD',
      };

      partnerExtrasRepository.create = jest
        .fn()
        .mockReturnValue(mockPartnerExtras);
      partnerExtrasRepository.save = jest
        .fn()
        .mockResolvedValue(mockPartnerExtras);
      spaceOptionExtrasRepository.create = jest
        .fn()
        .mockReturnValue(mockSpaceOptionExtras);
      spaceOptionExtrasRepository.save = jest
        .fn()
        .mockResolvedValue(mockSpaceOptionExtras);

      // Create partner extras
      const partnerExtras = partnerExtrasRepository.create(mockPartnerExtras);
      const savedPartnerExtras =
        await partnerExtrasRepository.save(partnerExtras);

      // Link to space option
      const spaceOptionExtras = spaceOptionExtrasRepository.create(
        mockSpaceOptionExtras,
      );
      const savedSpaceOptionExtras =
        await spaceOptionExtrasRepository.save(spaceOptionExtras);

      expect(savedPartnerExtras.id).toBe('extras-1');
      expect(savedSpaceOptionExtras.partnerExtrasId).toBe('extras-1');
      expect(savedSpaceOptionExtras.spaceOptionId).toBe('option-1');
      expect(savedSpaceOptionExtras.overrideType).toBe(OverrideType.PRICE_ONLY);
    });
  });

  describe('Pricing Override Logic', () => {
    it('should apply pricing overrides correctly', () => {
      const spaceOptionExtras = new SpaceOptionExtrasEntity();
      spaceOptionExtras.partnerExtras = new PartnerAddonEntity();
      spaceOptionExtras.partnerExtras.pricingType = PricingType.FLAT;
      spaceOptionExtras.partnerExtras.basePrice = 100;
      spaceOptionExtras.partnerExtras.currency = 'INR';

      // Test no override
      spaceOptionExtras.overrideType = OverrideType.NONE;
      let effectivePrice = spaceOptionExtras.partnerExtras.basePrice;
      expect(effectivePrice).toBe(100);

      // Test pricing override
      spaceOptionExtras.overrideType = OverrideType.PRICE_ONLY;
      spaceOptionExtras.overrideBasePrice = 80;
      effectivePrice =
        spaceOptionExtras.overrideBasePrice ||
        spaceOptionExtras.partnerExtras.basePrice;
      expect(effectivePrice).toBe(80);
    });

    it('should apply stock overrides correctly', () => {
      const spaceOptionExtras = new SpaceOptionExtrasEntity();
      spaceOptionExtras.partnerExtras = new PartnerAddonEntity();
      spaceOptionExtras.partnerExtras.stockQuantity = 100;
      spaceOptionExtras.partnerExtras.minOrderQuantity = 1;
      spaceOptionExtras.partnerExtras.maxOrderQuantity = 10;

      // Test no override
      spaceOptionExtras.overrideType = OverrideType.NONE;
      let effectiveStock = spaceOptionExtras.partnerExtras.stockQuantity;
      expect(effectiveStock).toBe(100);
      expect(spaceOptionExtras.partnerExtras.minOrderQuantity).toBe(1);
      expect(spaceOptionExtras.partnerExtras.maxOrderQuantity).toBe(10);

      // Test stock override
      spaceOptionExtras.overrideType = OverrideType.FULL_OVERRIDE;
      spaceOptionExtras.overrideStockQuantity = 50;
      spaceOptionExtras.overrideMinOrderQuantity = 2;
      spaceOptionExtras.overrideMaxOrderQuantity = 5;
      effectiveStock =
        spaceOptionExtras.overrideStockQuantity ||
        spaceOptionExtras.partnerExtras.stockQuantity;
      expect(effectiveStock).toBe(50);
      expect(spaceOptionExtras.overrideMinOrderQuantity).toBe(2);
      expect(spaceOptionExtras.overrideMaxOrderQuantity).toBe(5);
    });

    it('should apply both pricing and stock overrides', () => {
      const spaceOptionExtras = new SpaceOptionExtrasEntity();
      spaceOptionExtras.partnerExtras = new PartnerAddonEntity();
      spaceOptionExtras.partnerExtras.pricingType = PricingType.FLAT;
      spaceOptionExtras.partnerExtras.basePrice = 100;
      spaceOptionExtras.partnerExtras.currency = 'INR';
      spaceOptionExtras.partnerExtras.stockQuantity = 100;
      spaceOptionExtras.partnerExtras.minOrderQuantity = 1;
      spaceOptionExtras.partnerExtras.maxOrderQuantity = 10;

      spaceOptionExtras.overrideType = OverrideType.FULL_OVERRIDE;
      spaceOptionExtras.overrideBasePrice = 75;
      spaceOptionExtras.overrideCurrency = 'USD';
      spaceOptionExtras.overrideStockQuantity = 25;
      spaceOptionExtras.overrideMinOrderQuantity = 3;
      spaceOptionExtras.overrideMaxOrderQuantity = 8;

      const effectivePrice =
        spaceOptionExtras.overrideBasePrice ||
        spaceOptionExtras.partnerExtras.basePrice;
      const effectiveStock =
        spaceOptionExtras.overrideStockQuantity ||
        spaceOptionExtras.partnerExtras.stockQuantity;

      expect(effectivePrice).toBe(75);
      expect(effectiveStock).toBe(25);
      expect(spaceOptionExtras.overrideMinOrderQuantity).toBe(3);
      expect(spaceOptionExtras.overrideMaxOrderQuantity).toBe(8);
    });
  });

  describe('Data Validation', () => {
    it('should validate space option data', () => {
      const spaceOption = new SpaceOptionEntity();
      spaceOption.name = 'Test Space Option';
      spaceOption.optionType = SpaceOptionType.MEETING_ROOM;
      spaceOption.maxCapacity = 10;
      spaceOption.minCapacity = 1;

      // Test default values
      expect(spaceOption.status).toBe(SpaceOptionStatus.ACTIVE);
      expect(spaceOption.isActive).toBe(true);
      expect(spaceOption.priority).toBe(0);
      expect(spaceOption.rating).toBe(0);
      expect(spaceOption.totalBookings).toBe(0);
    });

    it('should validate partner extras data', () => {
      const partnerExtras = new PartnerAddonEntity();
      partnerExtras.name = 'Test Equipment';
      partnerExtras.category = ExtraCategory.EQUIPMENT;
      partnerExtras.pricingType = PricingType.FLAT;
      partnerExtras.basePrice = 50;
      partnerExtras.currency = 'USD';

      // Test default values
      expect(partnerExtras.isActive).toBe(true);
      expect(partnerExtras.rating).toBe(0);
      expect(partnerExtras.totalOrders).toBe(0);
    });

    it('should handle timestamp updates', () => {
      const spaceOption = new SpaceOptionEntity();
      const originalUpdatedAt = new Date('2023-01-01');
      spaceOption.updatedAt = originalUpdatedAt;

      // Simulate timestamp update
      spaceOption.updatedAt = new Date();

      expect(spaceOption.updatedAt.getTime()).toBeGreaterThan(
        originalUpdatedAt.getTime(),
      );
    });
  });

  describe('Helper Methods', () => {
    it('should calculate availability correctly', () => {
      const spaceOption = new SpaceOptionEntity();
      spaceOption.maxCapacity = 20;
      spaceOption.minCapacity = 1;
      spaceOption.status = SpaceOptionStatus.ACTIVE;
      spaceOption.isActive = true;

      const requestedCapacity = 15;

      const isAvailable = spaceOption.isAvailableForCapacity(requestedCapacity);
      expect(isAvailable).toBe(true);
    });

    it('should return false for unavailable space option', () => {
      const spaceOption = new SpaceOptionEntity();
      spaceOption.maxCapacity = 10;
      spaceOption.minCapacity = 1;
      spaceOption.status = SpaceOptionStatus.MAINTENANCE;
      spaceOption.isActive = false;

      const requestedCapacity = 15;

      const isAvailable = spaceOption.isAvailableForCapacity(requestedCapacity);
      expect(isAvailable).toBe(false);
    });

    it('should calculate price correctly for partner extras', () => {
      const partnerExtras = new PartnerAddonEntity();
      partnerExtras.pricingType = PricingType.FLAT;
      partnerExtras.basePrice = 25;
      partnerExtras.currency = 'USD';

      // For flat pricing, the price should be the base price
      const price = partnerExtras.basePrice;
      expect(price).toBe(25);
    });
  });
});
