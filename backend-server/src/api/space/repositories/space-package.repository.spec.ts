import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import {
  EnhancedPricingType,
  RecurringInterval,
  SpacePackageEntity,
  UsageUnit,
} from '../../../database/entities/space-inventory.entity';
import {
  CreateSpacePackageDto,
  UpdateSpacePackageDto,
} from '../../pricing/dto/pricing.dto';
import { UserEntity } from '../../user/entities/user.entity';
import { SpaceOptionEntity } from '../entities/space-option.entity';
import { SpacePackageRepository } from './space-package.repository';

describe('SpacePackageRepository', () => {
  let repository: SpacePackageRepository;
  let typeormRepository: Repository<SpacePackageEntity>;
  let queryBuilder: SelectQueryBuilder<SpacePackageEntity>;

  const mockQueryBuilder = {
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    getMany: jest.fn(),
    getOne: jest.fn(),
    getCount: jest.fn(),
    select: jest.fn().mockReturnThis(),
    addSelect: jest.fn().mockReturnThis(),
    groupBy: jest.fn().mockReturnThis(),
    getRawMany: jest.fn(),
  };

  const mockTypeormRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
    createQueryBuilder: jest.fn(() => mockQueryBuilder),
    increment: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SpacePackageRepository,
        {
          provide: getRepositoryToken(SpacePackageEntity),
          useValue: mockTypeormRepository,
        },
      ],
    }).compile();

    repository = module.get<SpacePackageRepository>(SpacePackageRepository);
    typeormRepository = module.get<Repository<SpacePackageEntity>>(
      getRepositoryToken(SpacePackageEntity),
    );
    queryBuilder = mockQueryBuilder as any;
  });

  afterEach(() => {
    jest.clearAllMocks();
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

  const mockFlatPackage: Partial<SpacePackageEntity> = {
    id: 'package-1',
    name: 'Basic Package',
    description: 'Basic office package',
    pricingType: EnhancedPricingType.FLAT,
    basePrice: 100,
    currency: 'USD',
    spaceOption: mockSpaceOption as SpaceOptionEntity,
    createdBy: mockUser as UserEntity,
    isActive: true,
    priority: 1,
  };

  const mockRecurringPackage: Partial<SpacePackageEntity> = {
    id: 'package-2',
    name: 'Monthly Package',
    description: 'Monthly subscription package',
    pricingType: EnhancedPricingType.RECURRING,
    basePrice: 500,
    currency: 'USD',
    recurringInterval: RecurringInterval.MONTHLY,
    recurringCount: 1,
    spaceOption: mockSpaceOption as SpaceOptionEntity,
    createdBy: mockUser as UserEntity,
    isActive: true,
    priority: 2,
  };

  const mockUsagePackage: Partial<SpacePackageEntity> = {
    id: 'package-3',
    name: 'Hourly Package',
    description: 'Pay per hour package',
    pricingType: EnhancedPricingType.USAGE_BASED,
    basePrice: 25,
    currency: 'USD',
    usageUnit: UsageUnit.PER_HOUR,
    minUsage: 1,
    maxUsage: 8,
    spaceOption: mockSpaceOption as SpaceOptionEntity,
    createdBy: mockUser as UserEntity,
    isActive: true,
    priority: 3,
  };

  describe('create', () => {
    it('should create a flat pricing package', async () => {
      const createDto: CreateSpacePackageDto = {
        name: 'Basic Package',
        description: 'Basic office package',
        pricingType: EnhancedPricingType.FLAT,
        basePrice: 100,
        currency: 'USD',
        spaceOptionId: 'space-option-1',
        priority: 1,
      };

      mockTypeormRepository.create.mockReturnValue(mockFlatPackage);
      mockTypeormRepository.save.mockResolvedValue(mockFlatPackage);

      const result = await repository.create(createDto, mockUser as UserEntity);

      expect(mockTypeormRepository.create).toHaveBeenCalledWith({
        ...createDto,
        spaceOption: { id: createDto.spaceOptionId },
        createdBy: mockUser,
      });
      expect(mockTypeormRepository.save).toHaveBeenCalledWith(mockFlatPackage);
      expect(result).toEqual(mockFlatPackage);
    });

    it('should create a recurring pricing package', async () => {
      const createDto: CreateSpacePackageDto = {
        name: 'Monthly Package',
        description: 'Monthly subscription package',
        pricingType: EnhancedPricingType.RECURRING,
        basePrice: 500,
        currency: 'USD',
        recurringInterval: RecurringInterval.MONTHLY,
        recurringCount: 1,
        spaceOptionId: 'space-option-1',
        priority: 2,
      };

      mockTypeormRepository.create.mockReturnValue(mockRecurringPackage);
      mockTypeormRepository.save.mockResolvedValue(mockRecurringPackage);

      const result = await repository.create(createDto, mockUser as UserEntity);

      expect(result.pricingType).toBe(EnhancedPricingType.RECURRING);
      expect(result.recurringInterval).toBe(RecurringInterval.MONTHLY);
      expect(result.recurringCount).toBe(1);
    });

    it('should create a usage-based pricing package', async () => {
      const createDto: CreateSpacePackageDto = {
        name: 'Hourly Package',
        description: 'Pay per hour package',
        pricingType: EnhancedPricingType.USAGE_BASED,
        basePrice: 25,
        currency: 'USD',
        usageUnit: UsageUnit.PER_HOUR,
        minUsage: 1,
        maxUsage: 8,
        spaceOptionId: 'space-option-1',
        priority: 3,
      };

      mockTypeormRepository.create.mockReturnValue(mockUsagePackage);
      mockTypeormRepository.save.mockResolvedValue(mockUsagePackage);

      const result = await repository.create(createDto, mockUser as UserEntity);

      expect(result.pricingType).toBe(EnhancedPricingType.USAGE_BASED);
      expect(result.usageUnit).toBe(UsageUnit.PER_HOUR);
      expect(result.minUsage).toBe(1);
      expect(result.maxUsage).toBe(8);
    });
  });

  describe('findById', () => {
    it('should find package by id with relations', async () => {
      mockTypeormRepository.findOne.mockResolvedValue(mockFlatPackage);

      const result = await repository.findById('package-1');

      expect(mockTypeormRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'package-1' },
        relations: ['spaceOption', 'createdBy'],
      });
      expect(result).toEqual(mockFlatPackage);
    });

    it('should return null if package not found', async () => {
      mockTypeormRepository.findOne.mockResolvedValue(null);

      const result = await repository.findById('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('findBySpaceOptionId', () => {
    it('should find packages by space option id', async () => {
      const packages = [mockFlatPackage, mockRecurringPackage];
      mockQueryBuilder.getMany.mockResolvedValue(packages);

      const result = await repository.findBySpaceOptionId('space-option-1');

      expect(mockTypeormRepository.createQueryBuilder).toHaveBeenCalledWith(
        'package',
      );
      expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith(
        'package.spaceOption',
        'spaceOption',
      );
      expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith(
        'package.createdBy',
        'createdBy',
      );
      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'package.spaceOptionId = :spaceOptionId',
        {
          spaceOptionId: 'space-option-1',
        },
      );
      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith(
        'package.priority',
        'ASC',
      );
      expect(result).toEqual(packages);
    });
  });

  describe('findMany', () => {
    it('should find packages with pagination and filters', async () => {
      const packages = [mockFlatPackage, mockRecurringPackage];
      mockQueryBuilder.getMany.mockResolvedValue(packages);

      const filters = {
        isActive: true,
        pricingType: EnhancedPricingType.FLAT,
      };
      const pagination = { page: 1, limit: 10 };

      const result = await repository.findMany(filters, pagination);

      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'package.isActive = :isActive',
        {
          isActive: true,
        },
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'package.pricingType = :pricingType',
        {
          pricingType: EnhancedPricingType.FLAT,
        },
      );
      expect(mockQueryBuilder.skip).toHaveBeenCalledWith(0);
      expect(mockQueryBuilder.take).toHaveBeenCalledWith(10);
      expect(result).toEqual(packages);
    });

    it('should find packages without filters', async () => {
      const packages = [
        mockFlatPackage,
        mockRecurringPackage,
        mockUsagePackage,
      ];
      mockQueryBuilder.getMany.mockResolvedValue(packages);

      const result = await repository.findMany();

      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith(
        'package.priority',
        'ASC',
      );
      expect(result).toEqual(packages);
    });
  });

  describe('findByPartnerId', () => {
    it('should find packages by partner id', async () => {
      const packages = [mockFlatPackage];
      mockQueryBuilder.getMany.mockResolvedValue(packages);

      const result = await repository.findByPartnerId('partner-1');

      expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith(
        'package.spaceOption',
        'spaceOption',
      );
      expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith(
        'spaceOption.space',
        'space',
      );
      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'space.partnerId = :partnerId',
        {
          partnerId: 'partner-1',
        },
      );
      expect(result).toEqual(packages);
    });
  });

  describe('findByPriceRange', () => {
    it('should find packages within price range', async () => {
      const packages = [mockFlatPackage];
      mockQueryBuilder.getMany.mockResolvedValue(packages);

      const result = await repository.findByPriceRange(50, 150);

      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'package.basePrice >= :minPrice AND package.basePrice <= :maxPrice',
        { minPrice: 50, maxPrice: 150 },
      );
      expect(result).toEqual(packages);
    });
  });

  describe('findByPricingType', () => {
    it('should find packages by pricing type', async () => {
      const packages = [mockRecurringPackage];
      mockQueryBuilder.getMany.mockResolvedValue(packages);

      const result = await repository.findByPricingType(
        EnhancedPricingType.RECURRING,
      );

      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'package.pricingType = :pricingType',
        {
          pricingType: EnhancedPricingType.RECURRING,
        },
      );
      expect(result).toEqual(packages);
    });
  });

  describe('update', () => {
    it('should update package successfully', async () => {
      const updateDto: UpdateSpacePackageDto = {
        name: 'Updated Package',
        basePrice: 120,
        isActive: false,
      };

      const updatedPackage = { ...mockFlatPackage, ...updateDto };
      mockTypeormRepository.findOne.mockResolvedValue(mockFlatPackage);
      mockTypeormRepository.save.mockResolvedValue(updatedPackage);

      const result = await repository.update('package-1', updateDto);

      expect(mockTypeormRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'package-1' },
      });
      expect(mockTypeormRepository.save).toHaveBeenCalledWith({
        ...mockFlatPackage,
        ...updateDto,
      });
      expect(result).toEqual(updatedPackage);
    });

    it('should throw NotFoundException if package not found', async () => {
      mockTypeormRepository.findOne.mockResolvedValue(null);

      await expect(repository.update('non-existent', {})).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('bulkUpdate', () => {
    it('should bulk update packages', async () => {
      const updateData = { isActive: false };
      const updateResult = { affected: 2 };
      mockTypeormRepository.update.mockResolvedValue(updateResult);

      const result = await repository.bulkUpdate(
        ['package-1', 'package-2'],
        updateData,
      );

      expect(mockTypeormRepository.update).toHaveBeenCalledWith(
        { id: expect.arrayContaining(['package-1', 'package-2']) },
        updateData,
      );
      expect(result).toEqual(updateResult);
    });
  });

  describe('delete', () => {
    it('should delete package successfully', async () => {
      const deleteResult = { affected: 1 };
      mockTypeormRepository.delete.mockResolvedValue(deleteResult);

      const result = await repository.delete('package-1');

      expect(mockTypeormRepository.delete).toHaveBeenCalledWith('package-1');
      expect(result).toEqual(deleteResult);
    });
  });

  describe('softDelete', () => {
    it('should soft delete package by setting isActive to false', async () => {
      const updatedPackage = { ...mockFlatPackage, isActive: false };
      mockTypeormRepository.findOne.mockResolvedValue(mockFlatPackage);
      mockTypeormRepository.save.mockResolvedValue(updatedPackage);

      const result = await repository.softDelete('package-1');

      expect(mockTypeormRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'package-1' },
      });
      expect(mockTypeormRepository.save).toHaveBeenCalledWith({
        ...mockFlatPackage,
        isActive: false,
      });
      expect(result).toEqual(updatedPackage);
    });
  });

  describe('incrementBookings', () => {
    it('should increment booking count', async () => {
      const incrementResult = { affected: 1 };
      mockTypeormRepository.increment.mockResolvedValue(incrementResult);

      const result = await repository.incrementBookings('package-1', 2);

      expect(mockTypeormRepository.increment).toHaveBeenCalledWith(
        { id: 'package-1' },
        'totalBookings',
        2,
      );
      expect(result).toEqual(incrementResult);
    });
  });

  describe('updatePriority', () => {
    it('should update package priority', async () => {
      const updatedPackage = { ...mockFlatPackage, priority: 5 };
      mockTypeormRepository.findOne.mockResolvedValue(mockFlatPackage);
      mockTypeormRepository.save.mockResolvedValue(updatedPackage);

      const result = await repository.updatePriority('package-1', 5);

      expect(mockTypeormRepository.save).toHaveBeenCalledWith({
        ...mockFlatPackage,
        priority: 5,
      });
      expect(result).toEqual(updatedPackage);
    });
  });

  describe('getStatsBySpaceOptionId', () => {
    it('should get statistics by space option id', async () => {
      const stats = [
        {
          total_packages: '3',
          active_packages: '2',
          avg_price: '200.00',
          min_price: '100.00',
          max_price: '500.00',
        },
      ];
      mockQueryBuilder.getRawMany.mockResolvedValue(stats);

      const result = await repository.getStatsBySpaceOptionId('space-option-1');

      expect(mockQueryBuilder.select).toHaveBeenCalledWith(
        'COUNT(*)',
        'total_packages',
      );
      expect(mockQueryBuilder.addSelect).toHaveBeenCalledWith(
        'COUNT(CASE WHEN package.isActive = true THEN 1 END)',
        'active_packages',
      );
      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'package.spaceOptionId = :spaceOptionId',
        {
          spaceOptionId: 'space-option-1',
        },
      );
      expect(result).toEqual(stats[0]);
    });
  });

  describe('searchByName', () => {
    it('should search packages by name', async () => {
      const packages = [mockFlatPackage];
      mockQueryBuilder.getMany.mockResolvedValue(packages);

      const result = await repository.searchByName('Basic');

      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'LOWER(package.name) LIKE LOWER(:searchTerm)',
        { searchTerm: '%Basic%' },
      );
      expect(result).toEqual(packages);
    });
  });

  describe('findRecurringPackages', () => {
    it('should find recurring packages', async () => {
      const packages = [mockRecurringPackage];
      mockQueryBuilder.getMany.mockResolvedValue(packages);

      const result = await repository.findRecurringPackages();

      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'package.pricingType = :pricingType',
        {
          pricingType: EnhancedPricingType.RECURRING,
        },
      );
      expect(result).toEqual(packages);
    });
  });

  describe('findUsageBasedPackages', () => {
    it('should find usage-based packages', async () => {
      const packages = [mockUsagePackage];
      mockQueryBuilder.getMany.mockResolvedValue(packages);

      const result = await repository.findUsageBasedPackages();

      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'package.pricingType = :pricingType',
        {
          pricingType: EnhancedPricingType.USAGE_BASED,
        },
      );
      expect(result).toEqual(packages);
    });
  });

  describe('count', () => {
    it('should count packages with filters', async () => {
      mockQueryBuilder.getCount.mockResolvedValue(5);

      const filters = { isActive: true };
      const result = await repository.count(filters);

      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'package.isActive = :isActive',
        {
          isActive: true,
        },
      );
      expect(mockQueryBuilder.getCount).toHaveBeenCalled();
      expect(result).toBe(5);
    });
  });

  describe('exists', () => {
    it('should check if package exists', async () => {
      mockTypeormRepository.count.mockResolvedValue(1);

      const result = await repository.exists('package-1');

      expect(mockTypeormRepository.count).toHaveBeenCalledWith({
        where: { id: 'package-1' },
      });
      expect(result).toBe(true);
    });

    it('should return false if package does not exist', async () => {
      mockTypeormRepository.count.mockResolvedValue(0);

      const result = await repository.exists('non-existent');

      expect(result).toBe(false);
    });
  });

  describe('calculatePrice', () => {
    it('should calculate flat pricing', () => {
      const result = repository.calculatePrice(
        mockFlatPackage as SpacePackageEntity,
        1,
      );
      expect(result).toBe(100);
    });

    it('should calculate recurring pricing', () => {
      const result = repository.calculatePrice(
        mockRecurringPackage as SpacePackageEntity,
        2,
      );
      expect(result).toBe(1000); // 500 * 2 periods
    });

    it('should calculate usage-based pricing', () => {
      const result = repository.calculatePrice(
        mockUsagePackage as SpacePackageEntity,
        4,
      );
      expect(result).toBe(100); // 25 * 4 hours
    });

    it('should enforce minimum usage for usage-based pricing', () => {
      const result = repository.calculatePrice(
        mockUsagePackage as SpacePackageEntity,
        0.5,
      );
      expect(result).toBe(25); // Minimum 1 hour
    });

    it('should enforce maximum usage for usage-based pricing', () => {
      const result = repository.calculatePrice(
        mockUsagePackage as SpacePackageEntity,
        10,
      );
      expect(result).toBe(200); // Maximum 8 hours
    });

    it('should throw error for unsupported pricing type', () => {
      const invalidPackage = {
        ...mockFlatPackage,
        pricingType: 'INVALID' as any,
      } as SpacePackageEntity;

      expect(() => repository.calculatePrice(invalidPackage, 1)).toThrow(
        BadRequestException,
      );
    });
  });

  describe('validatePricingSchema', () => {
    it('should validate flat pricing schema', () => {
      expect(() =>
        repository.validatePricingSchema(mockFlatPackage as SpacePackageEntity),
      ).not.toThrow();
    });

    it('should validate recurring pricing schema', () => {
      expect(() =>
        repository.validatePricingSchema(
          mockRecurringPackage as SpacePackageEntity,
        ),
      ).not.toThrow();
    });

    it('should validate usage-based pricing schema', () => {
      expect(() =>
        repository.validatePricingSchema(
          mockUsagePackage as SpacePackageEntity,
        ),
      ).not.toThrow();
    });

    it('should throw error for invalid flat pricing', () => {
      const invalidPackage = {
        ...mockFlatPackage,
        basePrice: undefined,
      } as SpacePackageEntity;

      expect(() => repository.validatePricingSchema(invalidPackage)).toThrow(
        BadRequestException,
      );
    });

    it('should throw error for invalid recurring pricing', () => {
      const invalidPackage = {
        ...mockRecurringPackage,
        recurringInterval: undefined,
      } as SpacePackageEntity;

      expect(() => repository.validatePricingSchema(invalidPackage)).toThrow(
        BadRequestException,
      );
    });

    it('should throw error for invalid usage-based pricing', () => {
      const invalidPackage = {
        ...mockUsagePackage,
        usageUnit: undefined,
      } as SpacePackageEntity;

      expect(() => repository.validatePricingSchema(invalidPackage)).toThrow(
        BadRequestException,
      );
    });
  });
});
