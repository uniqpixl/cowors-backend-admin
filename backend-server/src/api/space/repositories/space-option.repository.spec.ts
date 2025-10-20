import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SpaceOptionEntity } from '../../../database/entities/space-option.entity';
import {
  SpaceOptionStatus,
  SpaceOptionType,
} from '../entities/space-option.entity';
import { SpaceOptionRepository } from './space-option.repository';

describe('SpaceOptionRepository', () => {
  let repository: SpaceOptionRepository;
  let mockTypeOrmRepository: jest.Mocked<Repository<SpaceOptionEntity>>;

  const mockSpaceOption: Partial<SpaceOptionEntity> = {
    id: '1',
    spaceId: 'space-1',
    name: 'Test Space Option',
    optionType: SpaceOptionType.MEETING_ROOM,
    status: SpaceOptionStatus.ACTIVE,
    maxCapacity: 10,
    minCapacity: 1,
    isActive: true,
    rating: 4.5,
    totalBookings: 25,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const mockRepository = {
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
      find: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
      createQueryBuilder: jest.fn(() => ({
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        addOrderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        offset: jest.fn().mockReturnThis(),
        getMany: jest.fn(),
        getOne: jest.fn(),
        getRawOne: jest.fn(),
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
      })),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SpaceOptionRepository,
        {
          provide: getRepositoryToken(SpaceOptionEntity),
          useValue: mockRepository,
        },
      ],
    }).compile();

    repository = module.get<SpaceOptionRepository>(SpaceOptionRepository);
    mockTypeOrmRepository = module.get(getRepositoryToken(SpaceOptionEntity));
  });

  it('should be defined', () => {
    expect(repository).toBeDefined();
  });

  describe('create', () => {
    it('should create a new space option', async () => {
      const spaceOptionData = {
        spaceId: 'space-1',
        name: 'Test Space Option',
        optionType: SpaceOptionType.MEETING_ROOM,
      };

      mockTypeOrmRepository.create.mockReturnValue(
        mockSpaceOption as SpaceOptionEntity,
      );
      mockTypeOrmRepository.save.mockResolvedValue(
        mockSpaceOption as SpaceOptionEntity,
      );

      const result = await repository.create(spaceOptionData);

      expect(mockTypeOrmRepository.create).toHaveBeenCalledWith(
        spaceOptionData,
      );
      expect(mockTypeOrmRepository.save).toHaveBeenCalledWith(mockSpaceOption);
      expect(result).toEqual(mockSpaceOption);
    });
  });

  describe('findById', () => {
    it('should find space option by id with relations', async () => {
      mockTypeOrmRepository.findOne.mockResolvedValue(
        mockSpaceOption as SpaceOptionEntity,
      );

      const result = await repository.findById('1');

      expect(mockTypeOrmRepository.findOne).toHaveBeenCalledWith({
        where: { id: '1' },
        relations: [
          'space',
          'spaceOptionExtras',
          'spaceOptionExtras.partnerExtras',
        ],
      });
      expect(result).toEqual(mockSpaceOption);
    });

    it('should return null if space option not found', async () => {
      mockTypeOrmRepository.findOne.mockResolvedValue(null);

      const result = await repository.findById('999');

      expect(result).toBeNull();
    });
  });

  describe('findBySpaceId', () => {
    it('should find space options by space id', async () => {
      const spaceOptions = [mockSpaceOption];
      mockTypeOrmRepository.find.mockResolvedValue(
        spaceOptions as SpaceOptionEntity[],
      );

      const result = await repository.findBySpaceId('space-1');

      expect(mockTypeOrmRepository.find).toHaveBeenCalledWith({
        where: { spaceId: 'space-1' },
        relations: [
          'space',
          'spaceOptionExtras',
          'spaceOptionExtras.partnerExtras',
        ],
        order: { priority: 'DESC', createdAt: 'ASC' },
      });
      expect(result).toEqual(spaceOptions);
    });

    it('should filter by status when provided', async () => {
      const spaceOptions = [mockSpaceOption];
      mockTypeOrmRepository.find.mockResolvedValue(
        spaceOptions as SpaceOptionEntity[],
      );

      await repository.findBySpaceId('space-1', {
        status: SpaceOptionStatus.ACTIVE,
      });

      expect(mockTypeOrmRepository.find).toHaveBeenCalledWith({
        where: { spaceId: 'space-1', status: SpaceOptionStatus.ACTIVE },
        relations: [
          'space',
          'spaceOptionExtras',
          'spaceOptionExtras.partnerExtras',
        ],
        order: { priority: 'DESC', createdAt: 'ASC' },
      });
    });
  });

  describe('update', () => {
    it('should update space option and return updated entity', async () => {
      const updateData = { name: 'Updated Name', maxCapacity: 15 };
      const updatedSpaceOption = { ...mockSpaceOption, ...updateData };

      mockTypeOrmRepository.update.mockResolvedValue({ affected: 1 } as any);
      mockTypeOrmRepository.findOne.mockResolvedValue(
        updatedSpaceOption as SpaceOptionEntity,
      );

      const result = await repository.update('1', updateData);

      expect(mockTypeOrmRepository.update).toHaveBeenCalledWith(
        '1',
        updateData,
      );
      expect(result).toEqual(updatedSpaceOption);
    });

    it('should return null if space option not found', async () => {
      mockTypeOrmRepository.update.mockResolvedValue({ affected: 0 } as any);
      mockTypeOrmRepository.findOne.mockResolvedValue(null);

      const result = await repository.update('999', { name: 'Updated' });

      expect(result).toBeNull();
    });
  });

  describe('softDelete', () => {
    it('should soft delete space option by setting isActive to false', async () => {
      mockTypeOrmRepository.update.mockResolvedValue({ affected: 1 } as any);

      const result = await repository.softDelete('1');

      expect(mockTypeOrmRepository.update).toHaveBeenCalledWith('1', {
        isActive: false,
      });
      expect(result).toBe(true);
    });

    it('should return false if space option not found', async () => {
      mockTypeOrmRepository.update.mockResolvedValue({ affected: 0 } as any);

      const result = await repository.softDelete('999');

      expect(result).toBe(false);
    });
  });

  describe('updateRating', () => {
    it('should update space option rating', async () => {
      mockTypeOrmRepository.update.mockResolvedValue({ affected: 1 } as any);

      const result = await repository.updateRating('1', 4.8);

      expect(mockTypeOrmRepository.update).toHaveBeenCalledWith('1', {
        rating: 4.8,
      });
      expect(result).toBe(true);
    });
  });

  describe('incrementBookings', () => {
    it('should increment total bookings count', async () => {
      const queryBuilder = {
        update: jest.fn().mockReturnThis(),
        set: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        execute: jest.fn().mockResolvedValue({ affected: 1 }),
      };
      mockTypeOrmRepository.createQueryBuilder.mockReturnValue(
        queryBuilder as any,
      );

      const result = await repository.incrementBookings('1');

      expect(queryBuilder.update).toHaveBeenCalledWith(SpaceOptionEntity);
      expect(queryBuilder.set).toHaveBeenCalledWith({
        totalBookings: () => 'totalBookings + 1',
      });
      expect(queryBuilder.where).toHaveBeenCalledWith('id = :id', { id: '1' });
      expect(result).toBe(true);
    });
  });

  describe('getStatistics', () => {
    it('should return space option statistics', async () => {
      const mockStats = {
        totalSpaceOptions: '10',
        activeSpaceOptions: '8',
        averageRating: '4.2',
        totalBookings: '150',
      };

      const queryBuilder = {
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue(mockStats),
      };
      mockTypeOrmRepository.createQueryBuilder.mockReturnValue(
        queryBuilder as any,
      );

      const result = await repository.getStatistics('space-1');

      expect(result).toEqual({
        totalSpaceOptions: 10,
        activeSpaceOptions: 8,
        averageRating: 4.2,
        totalBookings: 150,
      });
    });
  });

  describe('searchByName', () => {
    it('should search space options by name', async () => {
      const spaceOptions = [mockSpaceOption];
      const queryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        offset: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(spaceOptions),
      };
      mockTypeOrmRepository.createQueryBuilder.mockReturnValue(
        queryBuilder as any,
      );

      const result = await repository.searchByName('Test', {
        spaceId: 'space-1',
        limit: 10,
        offset: 0,
      });

      expect(queryBuilder.where).toHaveBeenCalledWith(
        'LOWER(spaceOption.name) LIKE LOWER(:searchTerm)',
        {
          searchTerm: '%Test%',
        },
      );
      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        'spaceOption.spaceId = :spaceId',
        {
          spaceId: 'space-1',
        },
      );
      expect(result).toEqual(spaceOptions);
    });
  });

  describe('findByAmenities', () => {
    it('should find space options by amenities', async () => {
      const spaceOptions = [mockSpaceOption];
      const queryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(spaceOptions),
      };
      mockTypeOrmRepository.createQueryBuilder.mockReturnValue(
        queryBuilder as any,
      );

      const result = await repository.findByAmenities(
        ['WiFi', 'Projector'],
        'space-1',
      );

      expect(queryBuilder.where).toHaveBeenCalledWith(
        'spaceOption.amenities @> :amenities',
        {
          amenities: JSON.stringify(['WiFi', 'Projector']),
        },
      );
      expect(result).toEqual(spaceOptions);
    });
  });
});
