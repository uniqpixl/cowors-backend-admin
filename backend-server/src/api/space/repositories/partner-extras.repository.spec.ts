import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { PartnerAddonEntity } from '../../../database/entities/partner-addon.entity';
import {
  PartnerExtrasCategory,
  PartnerExtrasStatus,
} from '../dto/partner-extras.dto';
import { EnhancedPricingType } from '../dto/pricing.dto';
import { PartnerExtrasRepository } from './partner-extras.repository';

describe('PartnerExtrasRepository', () => {
  let repository: PartnerExtrasRepository;
  let mockRepository: Partial<Repository<PartnerAddonEntity>>;
  let mockQueryBuilder: Partial<SelectQueryBuilder<PartnerAddonEntity>>;

  beforeEach(async () => {
    mockQueryBuilder = {
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getMany: jest.fn(),
      getOne: jest.fn(),
      getCount: jest.fn(),
    };

    mockRepository = {
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
      find: jest.fn(),
      update: jest.fn(),
      softDelete: jest.fn(),
      count: jest.fn(),
      createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PartnerExtrasRepository,
        {
          provide: getRepositoryToken(PartnerAddonEntity),
          useValue: mockRepository,
        },
      ],
    }).compile();

    repository = module.get<PartnerExtrasRepository>(PartnerExtrasRepository);
  });

  describe('create', () => {
    it('should create a new partner extras', async () => {
      const createDto = {
        partnerId: 'partner-1',
        name: 'Projector',
        description: 'HD Projector',
        category: PartnerExtrasCategory.EQUIPMENT,
        pricing: {
          pricingType: EnhancedPricingType.FLAT,
          basePrice: 50,
          currency: 'USD',
        },
        stockQuantity: 10,
        minOrderQuantity: 1,
        maxOrderQuantity: 5,
      };

      const mockEntity = {
        id: 'extras-1',
        ...createDto,
        status: PartnerExtrasStatus.AVAILABLE,
        isActive: true,
        priority: 0,
        rating: 0,
        totalOrders: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockRepository.create = jest.fn().mockReturnValue(mockEntity);
      mockRepository.save = jest.fn().mockResolvedValue(mockEntity);

      const result = await repository.create(createDto);

      expect(mockRepository.create).toHaveBeenCalledWith(createDto);
      expect(mockRepository.save).toHaveBeenCalledWith(mockEntity);
      expect(result).toEqual(mockEntity);
    });
  });

  describe('findById', () => {
    it('should find partner extras by id with relations', async () => {
      const mockEntity = {
        id: 'extras-1',
        name: 'Projector',
        partner: { id: 'partner-1', businessName: 'Test Business' },
        spaceOptionExtras: [],
      };

      mockRepository.findOne = jest.fn().mockResolvedValue(mockEntity);

      const result = await repository.findById('extras-1');

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'extras-1' },
        relations: [
          'partner',
          'spaceOptionExtras',
          'spaceOptionExtras.spaceOption',
        ],
      });
      expect(result).toEqual(mockEntity);
    });

    it('should return null if partner extras not found', async () => {
      mockRepository.findOne = jest.fn().mockResolvedValue(null);

      const result = await repository.findById('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('findByPartnerId', () => {
    it('should find partner extras by partner id', async () => {
      const mockEntities = [
        {
          id: 'extras-1',
          partnerId: 'partner-1',
          name: 'Projector',
          category: PartnerExtrasCategory.EQUIPMENT,
        },
        {
          id: 'extras-2',
          partnerId: 'partner-1',
          name: 'Catering',
          category: PartnerExtrasCategory.CATERING,
        },
      ];

      mockQueryBuilder.getMany = jest.fn().mockResolvedValue(mockEntities);

      const result = await repository.findByPartnerId('partner-1');

      expect(mockRepository.createQueryBuilder).toHaveBeenCalledWith(
        'partnerExtras',
      );
      expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith(
        'partnerExtras.partner',
        'partner',
      );
      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'partnerExtras.partnerId = :partnerId',
        { partnerId: 'partner-1' },
      );
      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith(
        'partnerExtras.priority',
        'ASC',
      );
      expect(result).toEqual(mockEntities);
    });

    it('should filter by category when provided', async () => {
      const mockEntities = [
        {
          id: 'extras-1',
          partnerId: 'partner-1',
          name: 'Projector',
          category: PartnerExtrasCategory.EQUIPMENT,
        },
      ];

      mockQueryBuilder.getMany = jest.fn().mockResolvedValue(mockEntities);

      const result = await repository.findByPartnerId(
        'partner-1',
        PartnerExtrasCategory.EQUIPMENT,
      );

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'partnerExtras.category = :category',
        { category: PartnerExtrasCategory.EQUIPMENT },
      );
      expect(result).toEqual(mockEntities);
    });
  });

  describe('findByCategory', () => {
    it('should find partner extras by category', async () => {
      const mockEntities = [
        {
          id: 'extras-1',
          category: PartnerExtrasCategory.EQUIPMENT,
          name: 'Projector',
        },
        {
          id: 'extras-2',
          category: PartnerExtrasCategory.EQUIPMENT,
          name: 'Sound System',
        },
      ];

      mockQueryBuilder.getMany = jest.fn().mockResolvedValue(mockEntities);

      const result = await repository.findByCategory(
        PartnerExtrasCategory.EQUIPMENT,
      );

      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'partnerExtras.category = :category',
        { category: PartnerExtrasCategory.EQUIPMENT },
      );
      expect(result).toEqual(mockEntities);
    });
  });

  describe('findAvailable', () => {
    it('should find available partner extras', async () => {
      const mockEntities = [
        {
          id: 'extras-1',
          status: PartnerExtrasStatus.AVAILABLE,
          isActive: true,
          stockQuantity: 10,
        },
      ];

      mockQueryBuilder.getMany = jest.fn().mockResolvedValue(mockEntities);

      const result = await repository.findAvailable();

      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'partnerExtras.status = :status',
        { status: PartnerExtrasStatus.AVAILABLE },
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'partnerExtras.isActive = :isActive',
        { isActive: true },
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'partnerExtras.stockQuantity > 0',
      );
      expect(result).toEqual(mockEntities);
    });

    it('should filter by partner id when provided', async () => {
      const mockEntities = [];
      mockQueryBuilder.getMany = jest.fn().mockResolvedValue(mockEntities);

      await repository.findAvailable('partner-1');

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'partnerExtras.partnerId = :partnerId',
        { partnerId: 'partner-1' },
      );
    });
  });

  describe('update', () => {
    it('should update partner extras', async () => {
      const updateDto = {
        name: 'Updated Projector',
        description: 'Updated HD Projector',
        pricing: {
          pricingType: EnhancedPricingType.FLAT,
          basePrice: 60,
          currency: 'USD',
        },
      };

      const mockUpdatedEntity = {
        id: 'extras-1',
        ...updateDto,
        updatedAt: new Date(),
      };

      mockRepository.update = jest.fn().mockResolvedValue({ affected: 1 });
      mockRepository.findOne = jest.fn().mockResolvedValue(mockUpdatedEntity);

      const result = await repository.update('extras-1', updateDto);

      expect(mockRepository.update).toHaveBeenCalledWith('extras-1', updateDto);
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'extras-1' },
        relations: ['partner', 'spaceOptionExtras'],
      });
      expect(result).toEqual(mockUpdatedEntity);
    });

    it('should return null if partner extras not found', async () => {
      mockRepository.update = jest.fn().mockResolvedValue({ affected: 0 });

      const result = await repository.update('non-existent', {
        name: 'Updated',
      });

      expect(result).toBeNull();
    });
  });

  describe('updateStock', () => {
    it('should update stock quantity', async () => {
      const mockUpdatedEntity = {
        id: 'extras-1',
        stockQuantity: 15,
        updatedAt: new Date(),
      };

      mockRepository.update = jest.fn().mockResolvedValue({ affected: 1 });
      mockRepository.findOne = jest.fn().mockResolvedValue(mockUpdatedEntity);

      const result = await repository.updateStock('extras-1', 15);

      expect(mockRepository.update).toHaveBeenCalledWith('extras-1', {
        stockQuantity: 15,
      });
      expect(result).toEqual(mockUpdatedEntity);
    });
  });

  describe('updateRating', () => {
    it('should update rating', async () => {
      const mockUpdatedEntity = {
        id: 'extras-1',
        rating: 4.5,
        updatedAt: new Date(),
      };

      mockRepository.update = jest.fn().mockResolvedValue({ affected: 1 });
      mockRepository.findOne = jest.fn().mockResolvedValue(mockUpdatedEntity);

      const result = await repository.updateRating('extras-1', 4.5);

      expect(mockRepository.update).toHaveBeenCalledWith('extras-1', {
        rating: 4.5,
      });
      expect(result).toEqual(mockUpdatedEntity);
    });
  });

  describe('softDelete', () => {
    it('should soft delete partner extras', async () => {
      mockRepository.softDelete = jest.fn().mockResolvedValue({ affected: 1 });

      const result = await repository.softDelete('extras-1');

      expect(mockRepository.softDelete).toHaveBeenCalledWith('extras-1');
      expect(result).toBe(true);
    });

    it('should return false if partner extras not found', async () => {
      mockRepository.softDelete = jest.fn().mockResolvedValue({ affected: 0 });

      const result = await repository.softDelete('non-existent');

      expect(result).toBe(false);
    });
  });

  describe('incrementOrders', () => {
    it('should increment total orders', async () => {
      mockRepository.update = jest.fn().mockResolvedValue({ affected: 1 });

      const result = await repository.incrementOrders('extras-1', 3);

      expect(mockRepository.update).toHaveBeenCalledWith(
        'extras-1',
        expect.objectContaining({
          totalOrders: expect.any(Function),
        }),
      );
      expect(result).toBe(true);
    });
  });

  describe('searchByName', () => {
    it('should search partner extras by name', async () => {
      const mockEntities = [
        {
          id: 'extras-1',
          name: 'HD Projector',
        },
        {
          id: 'extras-2',
          name: 'Projector Screen',
        },
      ];

      mockQueryBuilder.getMany = jest.fn().mockResolvedValue(mockEntities);

      const result = await repository.searchByName('projector');

      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'LOWER(partnerExtras.name) LIKE LOWER(:searchTerm)',
        { searchTerm: '%projector%' },
      );
      expect(result).toEqual(mockEntities);
    });

    it('should filter by partner id when provided', async () => {
      const mockEntities = [];
      mockQueryBuilder.getMany = jest.fn().mockResolvedValue(mockEntities);

      await repository.searchByName('projector', 'partner-1');

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'partnerExtras.partnerId = :partnerId',
        { partnerId: 'partner-1' },
      );
    });
  });

  describe('getStatistics', () => {
    it('should get partner extras statistics', async () => {
      const mockStats = {
        totalExtras: 25,
        availableExtras: 20,
        outOfStockExtras: 3,
        averageRating: 4.2,
        totalOrders: 150,
      };

      mockQueryBuilder.getCount = jest
        .fn()
        .mockResolvedValueOnce(25) // total
        .mockResolvedValueOnce(20) // available
        .mockResolvedValueOnce(3); // out of stock

      // Mock for average rating and total orders
      const mockRawResult = [
        {
          avgRating: '4.2',
          totalOrders: '150',
        },
      ];
      mockQueryBuilder.getRawOne = jest
        .fn()
        .mockResolvedValue(mockRawResult[0]);

      const result = await repository.getStatistics('partner-1');

      expect(result.totalExtras).toBe(25);
      expect(result.availableExtras).toBe(20);
      expect(result.outOfStockExtras).toBe(3);
      expect(result.averageRating).toBe(4.2);
      expect(result.totalOrders).toBe(150);
    });
  });

  describe('findByPriceRange', () => {
    it('should find partner extras by price range', async () => {
      const mockEntities = [
        {
          id: 'extras-1',
          pricing: { basePrice: 50 },
        },
        {
          id: 'extras-2',
          pricing: { basePrice: 75 },
        },
      ];

      mockQueryBuilder.getMany = jest.fn().mockResolvedValue(mockEntities);

      const result = await repository.findByPriceRange(40, 80);

      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        "partnerExtras.pricing->>'basePrice' BETWEEN :minPrice AND :maxPrice",
        {
          minPrice: '40',
          maxPrice: '80',
        },
      );
      expect(result).toEqual(mockEntities);
    });
  });

  describe('count', () => {
    it('should count partner extras', async () => {
      mockRepository.count = jest.fn().mockResolvedValue(42);

      const result = await repository.count();

      expect(mockRepository.count).toHaveBeenCalled();
      expect(result).toBe(42);
    });

    it('should count with filters', async () => {
      const filters = {
        partnerId: 'partner-1',
        category: PartnerExtrasCategory.EQUIPMENT,
        status: PartnerExtrasStatus.AVAILABLE,
      };

      mockRepository.count = jest.fn().mockResolvedValue(15);

      const result = await repository.count(filters);

      expect(mockRepository.count).toHaveBeenCalledWith({ where: filters });
      expect(result).toBe(15);
    });
  });

  describe('exists', () => {
    it('should check if partner extras exists', async () => {
      mockRepository.count = jest.fn().mockResolvedValue(1);

      const result = await repository.exists('extras-1');

      expect(mockRepository.count).toHaveBeenCalledWith({
        where: { id: 'extras-1' },
      });
      expect(result).toBe(true);
    });

    it('should return false if partner extras does not exist', async () => {
      mockRepository.count = jest.fn().mockResolvedValue(0);

      const result = await repository.exists('non-existent');

      expect(result).toBe(false);
    });
  });

  describe('findRequiringApproval', () => {
    it('should find partner extras requiring approval', async () => {
      const mockEntities = [
        {
          id: 'extras-1',
          requiresApproval: true,
          status: PartnerExtrasStatus.PENDING_APPROVAL,
        },
      ];

      mockQueryBuilder.getMany = jest.fn().mockResolvedValue(mockEntities);

      const result = await repository.findRequiringApproval();

      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'partnerExtras.requiresApproval = :requiresApproval',
        { requiresApproval: true },
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'partnerExtras.status = :status',
        { status: PartnerExtrasStatus.PENDING_APPROVAL },
      );
      expect(result).toEqual(mockEntities);
    });

    it('should filter by partner id when provided', async () => {
      const mockEntities = [];
      mockQueryBuilder.getMany = jest.fn().mockResolvedValue(mockEntities);

      await repository.findRequiringApproval('partner-1');

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'partnerExtras.partnerId = :partnerId',
        { partnerId: 'partner-1' },
      );
    });
  });
});
