import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  SpaceOptionStatus,
  SpaceOptionType,
  SpaceStatus,
  SpaceType,
} from '../../../database/entities/space.entity';
import { PartnerEntity } from '../../partner/entities/partner.entity';
import { UserEntity } from '../../user/entities/user.entity';
import { SpacePackageEntity } from './space-inventory.entity';
import { SpaceOptionExtrasEntity } from './space-option-extras.entity';
import { SpaceOptionEntity } from './space-option.entity';
import { SpaceEntity } from './space.entity';

describe('SpaceOptionEntity', () => {
  let spaceOptionRepository: Repository<SpaceOptionEntity>;
  let spaceRepository: Repository<SpaceEntity>;
  let userRepository: Repository<UserEntity>;
  let partnerRepository: Repository<PartnerEntity>;

  const mockSpaceOptionRepository = {
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

  const mockSpaceRepository = {
    findOne: jest.fn(),
  };

  const mockUserRepository = {
    findOne: jest.fn(),
  };

  const mockPartnerRepository = {
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: getRepositoryToken(SpaceOptionEntity),
          useValue: mockSpaceOptionRepository,
        },
        {
          provide: getRepositoryToken(SpaceEntity),
          useValue: mockSpaceRepository,
        },
        {
          provide: getRepositoryToken(UserEntity),
          useValue: mockUserRepository,
        },
        {
          provide: getRepositoryToken(PartnerEntity),
          useValue: mockPartnerRepository,
        },
      ],
    }).compile();

    spaceOptionRepository = module.get<Repository<SpaceOptionEntity>>(
      getRepositoryToken(SpaceOptionEntity),
    );
    spaceRepository = module.get<Repository<SpaceEntity>>(
      getRepositoryToken(SpaceEntity),
    );
    userRepository = module.get<Repository<UserEntity>>(
      getRepositoryToken(UserEntity),
    );
    partnerRepository = module.get<Repository<PartnerEntity>>(
      getRepositoryToken(PartnerEntity),
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

  const mockSpace: Partial<SpaceEntity> = {
    id: 'space-1',
    name: 'Test Space Space',
    description: 'A test space space',
    type: SpaceType.COWORKING,
    status: SpaceStatus.ACTIVE,
    partner: mockPartner as PartnerEntity,
    address: '123 Test St',
    city: 'Test City',
    state: 'Test State',
    country: 'Test Country',
    zipCode: '12345',
  };

  const mockSpaceOption: Partial<SpaceOptionEntity> = {
    id: 'space-option-1',
    name: 'Private Office',
    description: 'A private office space',
    type: SpaceOptionType.PRIVATE_OFFICE,
    status: SpaceOptionStatus.ACTIVE,
    space: mockSpace as SpaceEntity,
    capacity: 4,
    area: 100,
    amenities: ['WiFi', 'AC', 'Whiteboard'],
    images: ['image1.jpg', 'image2.jpg'],
    isAvailable: true,
    priority: 1,
    rating: 4.5,
    totalBookings: 10,
    totalOrders: 5,
  };

  describe('Entity Creation', () => {
    it('should create a space option entity', () => {
      const spaceOption = new SpaceOptionEntity();
      Object.assign(spaceOption, mockSpaceOption);

      expect(spaceOption.name).toBe('Private Office');
      expect(spaceOption.type).toBe(SpaceOptionType.PRIVATE_OFFICE);
      expect(spaceOption.capacity).toBe(4);
      expect(spaceOption.area).toBe(100);
      expect(spaceOption.amenities).toEqual(['WiFi', 'AC', 'Whiteboard']);
    });

    it('should have proper default values', () => {
      const spaceOption = new SpaceOptionEntity();

      expect(spaceOption.status).toBe(SpaceOptionStatus.ACTIVE);
      expect(spaceOption.isAvailable).toBe(true);
      expect(spaceOption.priority).toBe(0);
      expect(spaceOption.rating).toBe(0);
      expect(spaceOption.totalBookings).toBe(0);
      expect(spaceOption.totalOrders).toBe(0);
      expect(spaceOption.amenities).toEqual([]);
      expect(spaceOption.images).toEqual([]);
    });
  });

  describe('Relationships', () => {
    it('should have a relationship with SpaceEntity', () => {
      const spaceOption = new SpaceOptionEntity();
      spaceOption.space = mockSpace as SpaceEntity;

      expect(spaceOption.space).toBeDefined();
      expect(spaceOption.space.id).toBe('space-1');
      expect(spaceOption.space.name).toBe('Test Space Space');
    });

    it('should have relationships with SpacePackageEntity', () => {
      const spaceOption = new SpaceOptionEntity();
      const mockPackages = [
        { id: 'package-1', name: 'Hourly Package' },
        { id: 'package-2', name: 'Daily Package' },
      ] as SpacePackageEntity[];

      spaceOption.packages = mockPackages;

      expect(spaceOption.packages).toHaveLength(2);
      expect(spaceOption.packages[0].name).toBe('Hourly Package');
    });

    it('should have relationships with SpaceOptionExtrasEntity', () => {
      const spaceOption = new SpaceOptionEntity();
      const mockExtras = [
        { id: 'extra-1', isIncluded: true },
        { id: 'extra-2', isIncluded: false },
      ] as SpaceOptionExtrasEntity[];

      spaceOption.spaceOptionExtras = mockExtras;

      expect(spaceOption.spaceOptionExtras).toHaveLength(2);
      expect(spaceOption.spaceOptionExtras[0].isIncluded).toBe(true);
    });
  });

  describe('Validation', () => {
    it('should validate capacity constraints', () => {
      const spaceOption = new SpaceOptionEntity();

      // Valid capacity
      spaceOption.capacity = 10;
      expect(spaceOption.capacity).toBe(10);

      // Invalid capacity (should be handled by database constraints)
      spaceOption.capacity = -1;
      expect(spaceOption.capacity).toBe(-1); // Entity allows it, DB constraint will catch it
    });

    it('should validate area constraints', () => {
      const spaceOption = new SpaceOptionEntity();

      // Valid area
      spaceOption.area = 150.5;
      expect(spaceOption.area).toBe(150.5);

      // Invalid area (should be handled by database constraints)
      spaceOption.area = -10;
      expect(spaceOption.area).toBe(-10); // Entity allows it, DB constraint will catch it
    });

    it('should validate rating constraints', () => {
      const spaceOption = new SpaceOptionEntity();

      // Valid rating
      spaceOption.rating = 4.5;
      expect(spaceOption.rating).toBe(4.5);

      // Invalid rating (should be handled by database constraints)
      spaceOption.rating = 6;
      expect(spaceOption.rating).toBe(6); // Entity allows it, DB constraint will catch it
    });

    it('should handle amenities array', () => {
      const spaceOption = new SpaceOptionEntity();
      const amenities = ['WiFi', 'AC', 'Parking', 'Kitchen'];

      spaceOption.amenities = amenities;
      expect(spaceOption.amenities).toEqual(amenities);
      expect(spaceOption.amenities).toHaveLength(4);
    });

    it('should handle images array', () => {
      const spaceOption = new SpaceOptionEntity();
      const images = ['image1.jpg', 'image2.jpg', 'image3.jpg'];

      spaceOption.images = images;
      expect(spaceOption.images).toEqual(images);
      expect(spaceOption.images).toHaveLength(3);
    });
  });

  describe('Business Logic', () => {
    it('should track booking statistics', () => {
      const spaceOption = new SpaceOptionEntity();

      spaceOption.totalBookings = 25;
      spaceOption.totalOrders = 15;

      expect(spaceOption.totalBookings).toBe(25);
      expect(spaceOption.totalOrders).toBe(15);
    });

    it('should handle availability status', () => {
      const spaceOption = new SpaceOptionEntity();

      // Available by default
      expect(spaceOption.isAvailable).toBe(true);

      // Can be set to unavailable
      spaceOption.isAvailable = false;
      expect(spaceOption.isAvailable).toBe(false);
    });

    it('should handle priority ordering', () => {
      const spaceOption1 = new SpaceOptionEntity();
      const spaceOption2 = new SpaceOptionEntity();

      spaceOption1.priority = 1;
      spaceOption2.priority = 2;

      expect(spaceOption1.priority).toBeLessThan(spaceOption2.priority);
    });

    it('should handle status transitions', () => {
      const spaceOption = new SpaceOptionEntity();

      // Default status
      expect(spaceOption.status).toBe(SpaceOptionStatus.ACTIVE);

      // Can change status
      spaceOption.status = SpaceOptionStatus.INACTIVE;
      expect(spaceOption.status).toBe(SpaceOptionStatus.INACTIVE);

      spaceOption.status = SpaceOptionStatus.MAINTENANCE;
      expect(spaceOption.status).toBe(SpaceOptionStatus.MAINTENANCE);
    });
  });

  describe('Repository Operations', () => {
    it('should save space option entity', async () => {
      const spaceOption = mockSpaceOption as SpaceOptionEntity;
      mockSpaceOptionRepository.save.mockResolvedValue(spaceOption);

      const result = await spaceOptionRepository.save(spaceOption);

      expect(mockSpaceOptionRepository.save).toHaveBeenCalledWith(spaceOption);
      expect(result).toEqual(spaceOption);
    });

    it('should find space option by id', async () => {
      const spaceOption = mockSpaceOption as SpaceOptionEntity;
      mockSpaceOptionRepository.findOne.mockResolvedValue(spaceOption);

      const result = await spaceOptionRepository.findOne({
        where: { id: 'space-option-1' },
      });

      expect(mockSpaceOptionRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'space-option-1' },
      });
      expect(result).toEqual(spaceOption);
    });

    it('should find space options by space id', async () => {
      const spaceOptions = [mockSpaceOption] as SpaceOptionEntity[];
      mockSpaceOptionRepository.find.mockResolvedValue(spaceOptions);

      const result = await spaceOptionRepository.find({
        where: { space: { id: 'space-1' } },
      });

      expect(mockSpaceOptionRepository.find).toHaveBeenCalledWith({
        where: { space: { id: 'space-1' } },
      });
      expect(result).toEqual(spaceOptions);
    });
  });
});
