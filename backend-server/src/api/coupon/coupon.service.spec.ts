import { BookingEntity } from '@/database/entities/booking.entity';
import {
  CouponEntity,
  CouponScope,
  CouponStatus,
  CouponType,
} from '@/database/entities/coupon.entity';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource, QueryRunner, Repository } from 'typeorm';
import { CouponService } from './coupon.service';
import { CouponQueryDto } from './dto/coupon-query.dto';
import { CreateCouponDto } from './dto/create-coupon.dto';
import { UpdateCouponDto } from './dto/update-coupon.dto';

describe('CouponService', () => {
  let service: CouponService;
  let repository: Repository<CouponEntity>;
  let dataSource: DataSource;
  let queryRunner: QueryRunner;

  const mockCoupon = {
    id: '1',
    code: 'SAVE20',
    name: 'Save 20% Discount',
    description: 'Test coupon description',
    type: CouponType.PERCENTAGE,
    value: 20,
    minOrderValue: 100,
    maxDiscountAmount: 200,
    status: CouponStatus.ACTIVE,
    scope: CouponScope.GLOBAL,
    usageLimit: 100,
    usageCount: 10,
    userUsageLimit: 1,
    partnerId: null,
    validFrom: new Date('2024-01-01'),
    validTo: new Date('2025-12-31'),
    metadata: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    partner: null,
    bookings: [],
    get isExpired() {
      return false;
    },
    get isActive() {
      return true;
    },
    get remainingUsage() {
      return 90;
    },
  } as CouponEntity;

  const mockRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    findAndCount: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    remove: jest.fn(),
    createQueryBuilder: jest.fn(),
    increment: jest.fn(),
    count: jest.fn(),
  };

  mockRepository.findOne.mockResolvedValue(mockCoupon);
  mockRepository.save.mockResolvedValue(mockCoupon);
  mockRepository.create.mockReturnValue(mockCoupon);
  mockRepository.find.mockResolvedValue([mockCoupon]);
  mockRepository.findAndCount.mockResolvedValue([[mockCoupon], 1]);

  const mockQueryRunner = {
    connect: jest.fn(),
    startTransaction: jest.fn(),
    commitTransaction: jest.fn(),
    rollbackTransaction: jest.fn(),
    release: jest.fn(),
    manager: {
      findOne: jest.fn(),
      save: jest.fn(),
    },
  };

  const mockDataSource = {
    createQueryRunner: jest.fn().mockReturnValue(mockQueryRunner),
    transaction: jest.fn().mockImplementation(async (callback) => {
      const mockManager = {
        findOne: jest.fn().mockResolvedValue(mockCoupon),
        save: jest.fn().mockResolvedValue(mockCoupon),
        increment: jest.fn(),
        count: jest.fn().mockResolvedValue(0),
      };
      return await callback(mockManager);
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CouponService,
        {
          provide: getRepositoryToken(CouponEntity),
          useValue: mockRepository,
        },
        {
          provide: getRepositoryToken(BookingEntity),
          useValue: mockRepository,
        },
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
      ],
    }).compile();

    service = module.get<CouponService>(CouponService);
    repository = module.get<Repository<CouponEntity>>(
      getRepositoryToken(CouponEntity),
    );
    dataSource = module.get<DataSource>(DataSource);
    queryRunner = mockQueryRunner as any;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new coupon', async () => {
      const createCouponDto: CreateCouponDto = {
        code: 'WELCOME20',
        name: 'Welcome Discount',
        type: CouponType.PERCENTAGE,
        value: 20,
        scope: CouponScope.GLOBAL,
        status: CouponStatus.ACTIVE,
        usageLimit: 100,
        userUsageLimit: 1,
        minOrderValue: 50,
        validFrom: '2024-01-01',
        validTo: '2025-12-31',
      };

      // Mock findOne to return null for new coupon creation
      mockRepository.findOne.mockResolvedValueOnce(null);
      mockRepository.create.mockReturnValue(mockCoupon);
      mockRepository.save.mockResolvedValue(mockCoupon);

      const result = await service.create(createCouponDto);

      expect(mockRepository.create).toHaveBeenCalledWith({
        ...createCouponDto,
        usageCount: 0,
        validFrom: new Date('2024-01-01'),
        validTo: new Date('2025-12-31'),
      });
      expect(mockRepository.save).toHaveBeenCalledWith(mockCoupon);
      expect(result).toEqual(mockCoupon);
    });
  });

  describe('validateCoupon', () => {
    it('should validate a valid coupon', async () => {
      const orderValue = 100;
      const userId = 'user1';

      mockRepository.findOne.mockResolvedValue(mockCoupon);
      mockRepository.count.mockResolvedValue(0);

      const result = await service.validateCoupon({
        code: 'SAVE20',
        orderAmount: orderValue,
        userId,
      });

      expect(result.valid).toBe(true);
      expect(result.discountAmount).toBe(20); // 20% of 100
      expect(result.coupon).toEqual(mockCoupon);
    });

    it('should reject inactive coupon', async () => {
      const inactiveCoupon = { ...mockCoupon, status: CouponStatus.INACTIVE };
      mockRepository.findOne.mockResolvedValue(inactiveCoupon);

      const result = await service.validateCoupon({
        code: 'SAVE20',
        orderAmount: 100,
        userId: 'user1',
      });

      expect(result.valid).toBe(false);
      expect(result.message).toBe('Coupon is not active');
    });

    it('should reject expired coupon', async () => {
      const expiredCoupon = { ...mockCoupon, validTo: new Date('2023-12-31') };
      mockRepository.findOne.mockResolvedValue(expiredCoupon);

      const result = await service.validateCoupon({
        code: 'SAVE20',
        orderAmount: 100,
        userId: 'user1',
      });

      expect(result.valid).toBe(false);
      expect(result.message).toBe('Coupon has expired or is not yet valid');
    });

    it('should reject coupon with insufficient order value', async () => {
      mockRepository.findOne.mockResolvedValue(mockCoupon);
      const result = await service.validateCoupon({
        code: 'SAVE20',
        orderAmount: 30,
        userId: 'user1',
      }); // Below minimum 50

      expect(result.valid).toBe(false);
      expect(result.message).toBe('Minimum order value of 100 required');
    });

    it('should reject coupon that has reached usage limit', async () => {
      const maxUsedCoupon = { ...mockCoupon, usageCount: 100, usageLimit: 100 };
      mockRepository.findOne.mockResolvedValue(maxUsedCoupon);

      const result = await service.validateCoupon({
        code: 'SAVE20',
        orderAmount: 100,
        userId: 'user1',
      });

      expect(result.valid).toBe(false);
      expect(result.message).toBe('Coupon usage limit exceeded');
    });

    it('should reject non-existent coupon', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      const result = await service.validateCoupon({
        code: 'INVALID',
        orderAmount: 100,
        userId: 'user1',
      });

      expect(result.valid).toBe(false);
      expect(result.message).toBe('Invalid coupon code');
    });
  });

  describe('applyCouponAtomic', () => {
    it('should apply coupon atomically', async () => {
      const orderValue = 100;
      const userId = 'user1';

      mockQueryRunner.manager.findOne.mockResolvedValue(mockCoupon);
      mockQueryRunner.manager.save.mockResolvedValue({
        ...mockCoupon,
        usageCount: 11,
      });

      const result = await service.applyCouponAtomic(
        'SAVE20',
        userId,
        orderValue,
      );

      expect(mockDataSource.transaction).toHaveBeenCalled();
      expect(result.discountAmount).toBe(20);
    });

    it('should rollback transaction on error', async () => {
      // Mock the transaction to throw an error during save
      mockDataSource.transaction.mockImplementation(async (callback) => {
        const mockManager = {
          findOne: jest.fn().mockResolvedValue(mockCoupon),
          save: jest.fn().mockRejectedValue(new Error('Database error')),
          increment: jest.fn(),
          count: jest.fn().mockResolvedValue(0),
        };
        return await callback(mockManager);
      });

      await expect(
        service.applyCouponAtomic('SAVE20', 'user1', 100),
      ).rejects.toThrow('Database error');
    });
  });

  describe('findAll', () => {
    it('should return all coupons', async () => {
      const coupons = [mockCoupon];
      mockRepository.find.mockResolvedValue(coupons);
      mockRepository.findAndCount.mockResolvedValue([[mockCoupon], 1]);

      const result = await service.findAll({ page: 1, limit: 10, offset: 0 });

      expect(mockRepository.findAndCount).toHaveBeenCalled();
      expect(result.data).toEqual([mockCoupon]);
      expect(result.pagination.totalRecords).toBe(1);
    });
  });

  describe('findOne', () => {
    it('should return a coupon by id', async () => {
      mockRepository.findOne.mockResolvedValue(mockCoupon);

      const result = await service.findOne('1');

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: '1' },
        relations: ['partner', 'bookings'],
      });
      expect(result).toEqual(mockCoupon);
    });

    it('should throw NotFoundException when coupon not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('999')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update a coupon', async () => {
      const updateCouponDto: UpdateCouponDto = {
        value: 25,
        status: CouponStatus.ACTIVE,
      };

      mockRepository.findOne.mockResolvedValue(mockCoupon);
      mockRepository.save.mockResolvedValue({
        ...mockCoupon,
        ...updateCouponDto,
      });

      const result = await service.update('1', updateCouponDto);

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: '1' },
        relations: ['partner', 'bookings'],
      });
      expect(mockRepository.save).toHaveBeenCalled();
      expect(result.value).toBe(25);
    });

    it('should throw NotFoundException when updating non-existent coupon', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.update('999', {})).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('remove', () => {
    it('should remove a coupon', async () => {
      mockRepository.findOne.mockResolvedValue(mockCoupon);
      mockRepository.delete.mockResolvedValue({ affected: 1 });

      await service.remove('1');

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: '1' },
        relations: ['partner', 'bookings'],
      });
      expect(mockRepository.remove).toHaveBeenCalledWith(mockCoupon);
    });

    it('should throw NotFoundException when removing non-existent coupon', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.remove('999')).rejects.toThrow(NotFoundException);
    });
  });

  describe('getCouponStats', () => {
    it('should return coupon statistics', async () => {
      mockRepository.findOne.mockResolvedValue(mockCoupon);
      mockRepository.createQueryBuilder.mockReturnValue({
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([
          { userId: 'user1', userUsageCount: '2' },
          { userId: 'user2', userUsageCount: '1' },
        ]),
      });

      const result = await service.getCouponStats('1');

      expect(result.totalUsage).toBe(1);
      expect(result.remainingUsage).toBe(99);
      expect(result.userUsageBreakdown).toHaveLength(1);
    });
  });
});
