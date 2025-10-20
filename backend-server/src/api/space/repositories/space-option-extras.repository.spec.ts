import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { SpaceOptionExtrasEntity } from '../../../database/entities/space-option-extras.entity';
import { EnhancedPricingType } from '../dto/pricing.dto';
import { OverrideType } from '../dto/space-option-extras.dto';
import { SpaceOptionExtrasRepository } from './space-option-extras.repository';

describe('SpaceOptionExtrasRepository', () => {
  let repository: SpaceOptionExtrasRepository;
  let mockRepository: Partial<Repository<SpaceOptionExtrasEntity>>;
  let mockQueryBuilder: Partial<SelectQueryBuilder<SpaceOptionExtrasEntity>>;

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
      getRawOne: jest.fn(),
    };

    mockRepository = {
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
      find: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      softDelete: jest.fn(),
      count: jest.fn(),
      createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SpaceOptionExtrasRepository,
        {
          provide: getRepositoryToken(SpaceOptionExtrasEntity),
          useValue: mockRepository,
        },
      ],
    }).compile();

    repository = module.get<SpaceOptionExtrasRepository>(
      SpaceOptionExtrasRepository,
    );
  });

  describe('create', () => {
    it('should create a new space option extras', async () => {
      const createDto = {
        spaceOptionId: 'option-1',
        partnerExtrasId: 'extras-1',
        isActive: true,
        isIncluded: false,
        isMandatory: false,
        priority: 1,
        override: {
          overrideType: OverrideType.PRICING,
          pricingOverride: {
            pricingType: EnhancedPricingType.FLAT,
            basePrice: 40,
            currency: 'USD',
          },
        },
      };

      const mockEntity = {
        id: 'soe-1',
        ...createDto,
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

  describe('bulkCreate', () => {
    it('should create multiple space option extras', async () => {
      const createDtos = [
        {
          spaceOptionId: 'option-1',
          partnerExtrasId: 'extras-1',
          isActive: true,
          isIncluded: false,
          isMandatory: false,
          priority: 1,
        },
        {
          spaceOptionId: 'option-1',
          partnerExtrasId: 'extras-2',
          isActive: true,
          isIncluded: true,
          isMandatory: true,
          priority: 2,
        },
      ];

      const mockEntities = createDtos.map((dto, index) => ({
        id: `soe-${index + 1}`,
        ...dto,
        createdAt: new Date(),
        updatedAt: new Date(),
      }));

      mockRepository.create = jest.fn().mockImplementation((data) => data);
      mockRepository.save = jest.fn().mockResolvedValue(mockEntities);

      const result = await repository.bulkCreate(createDtos);

      expect(mockRepository.create).toHaveBeenCalledWith(createDtos);
      expect(mockRepository.save).toHaveBeenCalledWith(createDtos);
      expect(result).toEqual(mockEntities);
    });
  });

  describe('findById', () => {
    it('should find space option extras by id with relations', async () => {
      const mockEntity = {
        id: 'soe-1',
        spaceOptionId: 'option-1',
        partnerExtrasId: 'extras-1',
        spaceOption: { id: 'option-1', name: 'Meeting Room A' },
        partnerExtras: { id: 'extras-1', name: 'Projector' },
      };

      mockRepository.findOne = jest.fn().mockResolvedValue(mockEntity);

      const result = await repository.findById('soe-1');

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'soe-1' },
        relations: [
          'spaceOption',
          'spaceOption.space',
          'partnerExtras',
          'partnerExtras.partner',
        ],
      });
      expect(result).toEqual(mockEntity);
    });

    it('should return null if space option extras not found', async () => {
      mockRepository.findOne = jest.fn().mockResolvedValue(null);

      const result = await repository.findById('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('findBySpaceOptionId', () => {
    it('should find space option extras by space option id', async () => {
      const mockEntities = [
        {
          id: 'soe-1',
          spaceOptionId: 'option-1',
          partnerExtrasId: 'extras-1',
          priority: 1,
        },
        {
          id: 'soe-2',
          spaceOptionId: 'option-1',
          partnerExtrasId: 'extras-2',
          priority: 2,
        },
      ];

      mockQueryBuilder.getMany = jest.fn().mockResolvedValue(mockEntities);

      const result = await repository.findBySpaceOptionId('option-1');

      expect(mockRepository.createQueryBuilder).toHaveBeenCalledWith(
        'spaceOptionExtras',
      );
      expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith(
        'spaceOptionExtras.partnerExtras',
        'partnerExtras',
      );
      expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith(
        'partnerExtras.partner',
        'partner',
      );
      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'spaceOptionExtras.spaceOptionId = :spaceOptionId',
        { spaceOptionId: 'option-1' },
      );
      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith(
        'spaceOptionExtras.priority',
        'ASC',
      );
      expect(result).toEqual(mockEntities);
    });

    it('should filter by active status when provided', async () => {
      const mockEntities = [];
      mockQueryBuilder.getMany = jest.fn().mockResolvedValue(mockEntities);

      await repository.findBySpaceOptionId('option-1', true);

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'spaceOptionExtras.isActive = :isActive',
        { isActive: true },
      );
    });
  });

  describe('findByPartnerExtrasId', () => {
    it('should find space option extras by partner extras id', async () => {
      const mockEntities = [
        {
          id: 'soe-1',
          spaceOptionId: 'option-1',
          partnerExtrasId: 'extras-1',
        },
        {
          id: 'soe-2',
          spaceOptionId: 'option-2',
          partnerExtrasId: 'extras-1',
        },
      ];

      mockQueryBuilder.getMany = jest.fn().mockResolvedValue(mockEntities);

      const result = await repository.findByPartnerExtrasId('extras-1');

      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'spaceOptionExtras.partnerExtrasId = :partnerExtrasId',
        { partnerExtrasId: 'extras-1' },
      );
      expect(result).toEqual(mockEntities);
    });
  });

  describe('findBySpaceOptionAndPartnerExtras', () => {
    it('should find space option extras by both ids', async () => {
      const mockEntity = {
        id: 'soe-1',
        spaceOptionId: 'option-1',
        partnerExtrasId: 'extras-1',
      };

      mockRepository.findOne = jest.fn().mockResolvedValue(mockEntity);

      const result = await repository.findBySpaceOptionAndPartnerExtras(
        'option-1',
        'extras-1',
      );

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: {
          spaceOptionId: 'option-1',
          partnerExtrasId: 'extras-1',
        },
        relations: ['spaceOption', 'partnerExtras'],
      });
      expect(result).toEqual(mockEntity);
    });
  });

  describe('findIncluded', () => {
    it('should find included extras for space option', async () => {
      const mockEntities = [
        {
          id: 'soe-1',
          spaceOptionId: 'option-1',
          isIncluded: true,
          isActive: true,
        },
      ];

      mockQueryBuilder.getMany = jest.fn().mockResolvedValue(mockEntities);

      const result = await repository.findIncluded('option-1');

      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'spaceOptionExtras.spaceOptionId = :spaceOptionId',
        { spaceOptionId: 'option-1' },
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'spaceOptionExtras.isIncluded = :isIncluded',
        { isIncluded: true },
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'spaceOptionExtras.isActive = :isActive',
        { isActive: true },
      );
      expect(result).toEqual(mockEntities);
    });
  });

  describe('findMandatory', () => {
    it('should find mandatory extras for space option', async () => {
      const mockEntities = [
        {
          id: 'soe-1',
          spaceOptionId: 'option-1',
          isMandatory: true,
          isActive: true,
        },
      ];

      mockQueryBuilder.getMany = jest.fn().mockResolvedValue(mockEntities);

      const result = await repository.findMandatory('option-1');

      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'spaceOptionExtras.spaceOptionId = :spaceOptionId',
        { spaceOptionId: 'option-1' },
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'spaceOptionExtras.isMandatory = :isMandatory',
        { isMandatory: true },
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'spaceOptionExtras.isActive = :isActive',
        { isActive: true },
      );
      expect(result).toEqual(mockEntities);
    });
  });

  describe('findOptional', () => {
    it('should find optional extras for space option', async () => {
      const mockEntities = [
        {
          id: 'soe-1',
          spaceOptionId: 'option-1',
          isIncluded: false,
          isMandatory: false,
          isActive: true,
        },
      ];

      mockQueryBuilder.getMany = jest.fn().mockResolvedValue(mockEntities);

      const result = await repository.findOptional('option-1');

      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'spaceOptionExtras.spaceOptionId = :spaceOptionId',
        { spaceOptionId: 'option-1' },
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'spaceOptionExtras.isIncluded = :isIncluded',
        { isIncluded: false },
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'spaceOptionExtras.isMandatory = :isMandatory',
        { isMandatory: false },
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'spaceOptionExtras.isActive = :isActive',
        { isActive: true },
      );
      expect(result).toEqual(mockEntities);
    });
  });

  describe('findWithPricingOverrides', () => {
    it('should find extras with pricing overrides', async () => {
      const mockEntities = [
        {
          id: 'soe-1',
          spaceOptionId: 'option-1',
          override: {
            overrideType: OverrideType.PRICING,
            pricingOverride: {
              pricingType: EnhancedPricingType.FLAT,
              basePrice: 40,
              currency: 'USD',
            },
          },
        },
      ];

      mockQueryBuilder.getMany = jest.fn().mockResolvedValue(mockEntities);

      const result = await repository.findWithPricingOverrides('option-1');

      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'spaceOptionExtras.spaceOptionId = :spaceOptionId',
        { spaceOptionId: 'option-1' },
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        "spaceOptionExtras.override->>'overrideType' IN (:...overrideTypes)",
        { overrideTypes: [OverrideType.PRICING, OverrideType.BOTH] },
      );
      expect(result).toEqual(mockEntities);
    });
  });

  describe('findByPartnerId', () => {
    it('should find space option extras by partner id', async () => {
      const mockEntities = [
        {
          id: 'soe-1',
          partnerExtras: {
            partnerId: 'partner-1',
          },
        },
      ];

      mockQueryBuilder.getMany = jest.fn().mockResolvedValue(mockEntities);

      const result = await repository.findByPartnerId('partner-1');

      expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith(
        'spaceOptionExtras.partnerExtras',
        'partnerExtras',
      );
      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'partnerExtras.partnerId = :partnerId',
        { partnerId: 'partner-1' },
      );
      expect(result).toEqual(mockEntities);
    });
  });

  describe('update', () => {
    it('should update space option extras', async () => {
      const updateDto = {
        isActive: false,
        priority: 5,
        override: {
          overrideType: OverrideType.STOCK,
          stockOverride: {
            stockQuantity: 20,
            minOrderQuantity: 2,
            maxOrderQuantity: 10,
          },
        },
      };

      const mockUpdatedEntity = {
        id: 'soe-1',
        ...updateDto,
        updatedAt: new Date(),
      };

      mockRepository.update = jest.fn().mockResolvedValue({ affected: 1 });
      mockRepository.findOne = jest.fn().mockResolvedValue(mockUpdatedEntity);

      const result = await repository.update('soe-1', updateDto);

      expect(mockRepository.update).toHaveBeenCalledWith('soe-1', updateDto);
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'soe-1' },
        relations: ['spaceOption', 'partnerExtras'],
      });
      expect(result).toEqual(mockUpdatedEntity);
    });

    it('should return null if space option extras not found', async () => {
      mockRepository.update = jest.fn().mockResolvedValue({ affected: 0 });

      const result = await repository.update('non-existent', {
        isActive: false,
      });

      expect(result).toBeNull();
    });
  });

  describe('bulkUpdate', () => {
    it('should bulk update space option extras', async () => {
      const updates = [
        { id: 'soe-1', isActive: false },
        { id: 'soe-2', priority: 10 },
      ];

      const mockUpdatedEntities = updates.map((update) => ({
        ...update,
        updatedAt: new Date(),
      }));

      mockRepository.save = jest.fn().mockResolvedValue(mockUpdatedEntities);

      const result = await repository.bulkUpdate(updates);

      expect(mockRepository.save).toHaveBeenCalledWith(updates);
      expect(result).toEqual(mockUpdatedEntities);
    });
  });

  describe('updatePriority', () => {
    it('should update priority for space option extras', async () => {
      const priorityUpdates = [
        { id: 'soe-1', priority: 1 },
        { id: 'soe-2', priority: 2 },
      ];

      mockRepository.save = jest.fn().mockResolvedValue(priorityUpdates);

      const result = await repository.updatePriority(priorityUpdates);

      expect(mockRepository.save).toHaveBeenCalledWith(priorityUpdates);
      expect(result).toEqual(priorityUpdates);
    });
  });

  describe('delete', () => {
    it('should delete space option extras', async () => {
      mockRepository.delete = jest.fn().mockResolvedValue({ affected: 1 });

      const result = await repository.delete('soe-1');

      expect(mockRepository.delete).toHaveBeenCalledWith('soe-1');
      expect(result).toBe(true);
    });

    it('should return false if space option extras not found', async () => {
      mockRepository.delete = jest.fn().mockResolvedValue({ affected: 0 });

      const result = await repository.delete('non-existent');

      expect(result).toBe(false);
    });
  });

  describe('softDelete', () => {
    it('should soft delete space option extras', async () => {
      mockRepository.softDelete = jest.fn().mockResolvedValue({ affected: 1 });

      const result = await repository.softDelete('soe-1');

      expect(mockRepository.softDelete).toHaveBeenCalledWith('soe-1');
      expect(result).toBe(true);
    });
  });

  describe('bulkDelete', () => {
    it('should bulk delete space option extras', async () => {
      const ids = ['soe-1', 'soe-2', 'soe-3'];

      mockRepository.delete = jest.fn().mockResolvedValue({ affected: 3 });

      const result = await repository.bulkDelete(ids);

      expect(mockRepository.delete).toHaveBeenCalledWith(ids);
      expect(result).toBe(3);
    });
  });

  describe('getEffectivePricing', () => {
    it('should get effective pricing for space option extras', async () => {
      const mockEntity = {
        id: 'soe-1',
        override: {
          overrideType: OverrideType.PRICING,
          pricingOverride: {
            pricingType: EnhancedPricingType.FLAT,
            basePrice: 40,
            currency: 'USD',
          },
        },
        partnerExtras: {
          pricing: {
            pricingType: EnhancedPricingType.FLAT,
            basePrice: 50,
            currency: 'USD',
          },
        },
        getEffectivePricing: jest.fn().mockReturnValue({
          pricingType: EnhancedPricingType.FLAT,
          basePrice: 40,
          currency: 'USD',
        }),
      };

      mockRepository.findOne = jest.fn().mockResolvedValue(mockEntity);

      const result = await repository.getEffectivePricing('soe-1');

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'soe-1' },
        relations: ['partnerExtras'],
      });
      expect(mockEntity.getEffectivePricing).toHaveBeenCalled();
      expect(result.basePrice).toBe(40);
    });
  });

  describe('getEffectiveStock', () => {
    it('should get effective stock for space option extras', async () => {
      const mockEntity = {
        id: 'soe-1',
        override: {
          overrideType: OverrideType.STOCK,
          stockOverride: {
            stockQuantity: 20,
            minOrderQuantity: 2,
            maxOrderQuantity: 10,
          },
        },
        partnerExtras: {
          stockQuantity: 100,
          minOrderQuantity: 1,
          maxOrderQuantity: 50,
        },
        getEffectiveStock: jest.fn().mockReturnValue({
          stockQuantity: 20,
          minOrderQuantity: 2,
          maxOrderQuantity: 10,
        }),
      };

      mockRepository.findOne = jest.fn().mockResolvedValue(mockEntity);

      const result = await repository.getEffectiveStock('soe-1');

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'soe-1' },
        relations: ['partnerExtras'],
      });
      expect(mockEntity.getEffectiveStock).toHaveBeenCalled();
      expect(result.stockQuantity).toBe(20);
    });
  });

  describe('getStatsBySpaceOptionId', () => {
    it('should get statistics for space option', async () => {
      const mockStats = {
        totalExtras: 10,
        activeExtras: 8,
        includedExtras: 3,
        mandatoryExtras: 2,
        optionalExtras: 5,
        extrasWithOverrides: 4,
      };

      mockQueryBuilder.getRawOne = jest.fn().mockResolvedValue({
        totalExtras: '10',
        activeExtras: '8',
        includedExtras: '3',
        mandatoryExtras: '2',
        optionalExtras: '5',
        extrasWithOverrides: '4',
      });

      const result = await repository.getStatsBySpaceOptionId('option-1');

      expect(result.totalExtras).toBe(10);
      expect(result.activeExtras).toBe(8);
      expect(result.includedExtras).toBe(3);
      expect(result.mandatoryExtras).toBe(2);
      expect(result.optionalExtras).toBe(5);
      expect(result.extrasWithOverrides).toBe(4);
    });
  });

  describe('count', () => {
    it('should count space option extras', async () => {
      mockRepository.count = jest.fn().mockResolvedValue(25);

      const result = await repository.count();

      expect(mockRepository.count).toHaveBeenCalled();
      expect(result).toBe(25);
    });

    it('should count with filters', async () => {
      const filters = {
        spaceOptionId: 'option-1',
        isActive: true,
        isIncluded: false,
      };

      mockRepository.count = jest.fn().mockResolvedValue(8);

      const result = await repository.count(filters);

      expect(mockRepository.count).toHaveBeenCalledWith({ where: filters });
      expect(result).toBe(8);
    });
  });

  describe('exists', () => {
    it('should check if space option extras exists', async () => {
      mockRepository.count = jest.fn().mockResolvedValue(1);

      const result = await repository.exists('option-1', 'extras-1');

      expect(mockRepository.count).toHaveBeenCalledWith({
        where: { spaceOptionId: 'option-1', partnerExtrasId: 'extras-1' },
      });
      expect(result).toBe(true);
    });

    it('should return false if space option extras does not exist', async () => {
      mockRepository.count = jest.fn().mockResolvedValue(0);

      const result = await repository.exists(
        'non-existent',
        'non-existent-extras',
      );

      expect(result).toBe(false);
    });
  });

  describe('findDuplicateAssignments', () => {
    it('should find duplicate assignments', async () => {
      const mockDuplicates = [
        {
          spaceOptionId: 'option-1',
          partnerExtrasId: 'extras-1',
          count: '2',
        },
      ];

      mockQueryBuilder.getRawMany = jest.fn().mockResolvedValue(mockDuplicates);

      const result = await repository.findDuplicateAssignments();

      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'spaceOptionExtras.deletedAt IS NULL',
      );
      expect(result).toEqual(mockDuplicates);
    });
  });
});
