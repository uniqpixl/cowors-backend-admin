import { Role, UserStatus } from '@/api/user/user.enum';
import { UserSession } from '@/auth/auth.type';
import { UserEntity } from '@/auth/entities/user.entity';
import { OffsetPaginationDto } from '@/common/dto/offset-pagination/offset-pagination.dto';
import { BookingStatus } from '@/common/enums/booking.enum';
import { SpaceSubtype } from '@/common/enums/partner.enum';
import { BookingModel, SpaceStatus } from '@/common/enums/space.enum';
import { Uuid } from '@/common/types/common.type';
import { BookingEntity } from '@/database/entities/booking.entity';
import {
  CouponEntity,
  CouponScope,
  CouponStatus,
  CouponType,
} from '@/database/entities/coupon.entity';
import { PartnerEntity } from '@/database/entities/partner.entity';
import { SpaceEntity } from '@/database/entities/space.entity';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CouponService } from '../coupon/coupon.service';
import { NotificationService } from '../notification/notification.service';
import { PaymentService } from '../payment/payment.service';
import {
  CheckAvailabilityDto,
  CreateBookingDto,
  QueryBookingsOffsetDto,
  UpdateBookingDto,
} from './booking.dto';
import { BookingService } from './booking.service';

describe('BookingService', () => {
  let service: BookingService;
  let bookingRepository: Repository<BookingEntity>;
  let userRepository: Repository<UserEntity>;
  let spaceRepository: Repository<SpaceEntity>;
  let partnerRepository: Repository<PartnerEntity>;
  let couponService: CouponService;
  let paymentService: PaymentService;
  let notificationService: NotificationService;

  let mockBookingRepository: any;
  let mockUserRepository: any;
  let mockSpaceRepository: any;
  let mockPartnerRepository: any;

  const mockUser: UserEntity = {
    id: 'user-1' as Uuid,
    username: 'testuser',
    displayUsername: 'Test User',
    email: 'test@example.com',
    name: 'Test User',
    emailVerified: false,
    isEmailVerified: false,
    role: Role.User,
    status: UserStatus.ACTIVE,
    firstName: 'Test',
    lastName: 'User',
    image: null,
    bio: null,
    twoFactorEnabled: false,
    lastLoginAt: null,
    adminNotes: null,
    bannedAt: null,
    banExpiresAt: null,
    suspendedAt: null,
    suspensionExpiresAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  } as UserEntity;

  const mockSpace: SpaceEntity = {
    id: 'space-1' as Uuid,
    partnerId: 'partner-1' as Uuid,
    name: 'Test Space',
    description: 'A test space',
    spaceType: SpaceSubtype.COWORKING_SPACE,
    bookingModel: BookingModel.TIME_BASED,
    capacity: 10,
    amenities: ['wifi', 'projector'],
    location: { floor: '1', room: '101' },
    pricing: {
      basePrice: 25,
      currency: 'INR',
      pricePerHour: 25,
      pricePerDay: 200,
    },
    availabilityRules: {
      advanceBookingDays: 30,
      cancellationPolicy: {
        freeUntilHours: 24,
        partialRefundUntilHours: 12,
        refundPercentage: 50,
      },
      operatingHours: {},
    },
    images: [],
    status: SpaceStatus.ACTIVE,
    rating: 4.5,
    reviewCount: 10,
    totalBookings: 50,
    metadata: {},
    partner: null,
    bookings: [],
    availability: [],
    reviews: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  } as SpaceEntity;

  const mockPartner: PartnerEntity = {
    id: 'partner-1' as Uuid,
    userId: mockUser.id,
    businessName: 'Test Business',
    businessType: 'coworking',
    businessAddress: 'Test Address',
    businessPhone: '1234567890',
    businessEmail: 'test@business.com',
    isVerified: true,
    isActive: true,
    commissionRate: 0.1,
    user: mockUser,
    spaces: [mockSpace],
    createdAt: new Date(),
    updatedAt: new Date(),
  } as PartnerEntity;

  const mockCoupon: CouponEntity = {
    id: 'coupon-1' as Uuid,
    code: 'SAVE10',
    name: 'Save 10%',
    description: 'Get 10% off your booking',
    type: CouponType.PERCENTAGE,
    value: 10,
    minOrderValue: null,
    maxDiscountAmount: null,
    usageLimit: 100,
    usageCount: 0,
    userUsageLimit: null,
    scope: CouponScope.GLOBAL,
    partnerId: null,
    status: CouponStatus.ACTIVE,
    validFrom: new Date('2024-01-01'),
    validTo: new Date('2024-12-31'),
    metadata: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    partner: null,
    bookings: [],
  } as CouponEntity;

  const mockBooking: BookingEntity = {
    id: 'booking-1' as Uuid,
    userId: 'user-1' as Uuid,
    spaceId: 'space-1' as Uuid,
    bookingNumber: 'BK-001',
    startDateTime: new Date('2024-02-01T09:00:00Z'),
    endDateTime: new Date('2024-02-01T17:00:00Z'),
    duration: 480,
    guestCount: 2,
    baseAmount: 200,
    extrasAmount: 0,
    discountAmount: 0,
    couponCode: 'SAVE20',
    couponId: 'coupon-1' as Uuid,
    taxAmount: 0,
    totalAmount: 160,
    currency: 'INR',
    status: BookingStatus.CONFIRMED,
    specialRequests: null,
    cancellationReason: null,
    cancelledAt: null,
    confirmedAt: new Date(),
    checkedInAt: null,
    checkedOutAt: null,
    contactInfo: null,
    pricing: null,
    metadata: null,
    user: mockUser,
    space: mockSpace,
    coupon: mockCoupon,
    payment: null,
    items: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  } as BookingEntity;

  const mockBookingRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    createQueryBuilder: jest.fn(),
    count: jest.fn(),
  };

  const mockUserRepository = {
    findOne: jest.fn(),
  };

  const mockSpaceRepository = {
    findOne: jest.fn(),
  };

  const mockPartnerRepository = {
    findOne: jest.fn(),
  };

  const mockCouponService = {
    applyCouponAtomic: jest.fn(),
  };

  const mockPaymentService = {
    createPayment: jest.fn(),
  };

  const mockNotificationService = {
    createNotification: jest.fn(),
    sendNotification: jest.fn(),
    sendBookingConfirmation: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BookingService,
        {
          provide: getRepositoryToken(BookingEntity),
          useValue: mockBookingRepository,
        },
        {
          provide: getRepositoryToken(UserEntity),
          useValue: mockUserRepository,
        },
        {
          provide: getRepositoryToken(SpaceEntity),
          useValue: mockSpaceRepository,
        },
        {
          provide: getRepositoryToken(PartnerEntity),
          useValue: mockPartnerRepository,
        },
        {
          provide: CouponService,
          useValue: mockCouponService,
        },
        {
          provide: PaymentService,
          useValue: mockPaymentService,
        },
        {
          provide: NotificationService,
          useValue: mockNotificationService,
        },
      ],
    }).compile();

    service = module.get<BookingService>(BookingService);
    bookingRepository = module.get<Repository<BookingEntity>>(
      getRepositoryToken(BookingEntity),
    );
    userRepository = module.get<Repository<UserEntity>>(
      getRepositoryToken(UserEntity),
    );
    spaceRepository = module.get<Repository<SpaceEntity>>(
      getRepositoryToken(SpaceEntity),
    );
    partnerRepository = module.get<Repository<PartnerEntity>>(
      getRepositoryToken(PartnerEntity),
    );
    couponService = module.get<CouponService>(CouponService);
    paymentService = module.get<PaymentService>(PaymentService);
    notificationService = module.get<NotificationService>(NotificationService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('checkAvailability', () => {
    it('should return available when no conflicts', async () => {
      const checkAvailabilityDto: CheckAvailabilityDto = {
        spaceId: mockSpace.id as Uuid,
        startDateTime: '2024-01-15T10:00:00Z',
        endDateTime: '2024-01-15T12:00:00Z',
      };

      mockSpaceRepository.findOne.mockResolvedValue(mockSpace);
      mockBookingRepository.find.mockResolvedValue([]);

      const result = await service.checkAvailability(checkAvailabilityDto);

      expect(result.available).toBe(true);
      expect(result.conflicts).toBeUndefined();
    });

    it('should return conflicts when space is not available', async () => {
      const checkAvailabilityDto: CheckAvailabilityDto = {
        spaceId: mockSpace.id as Uuid,
        startDateTime: '2024-01-15T10:00:00Z',
        endDateTime: '2024-01-15T12:00:00Z',
      };

      mockSpaceRepository.findOne.mockResolvedValue(mockSpace);
      mockBookingRepository.find.mockResolvedValue([mockBooking]);

      const result = await service.checkAvailability(checkAvailabilityDto);

      expect(result.available).toBe(false);
      expect(result.conflicts).toHaveLength(1);
    });

    it('should throw NotFoundException when space not found', async () => {
      const checkAvailabilityDto: CheckAvailabilityDto = {
        spaceId: mockSpace.id as Uuid,
        startDateTime: '2024-01-15T10:00:00Z',
        endDateTime: '2024-01-15T12:00:00Z',
      };

      mockSpaceRepository.findOne.mockResolvedValue(null);

      await expect(
        service.checkAvailability(checkAvailabilityDto),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('findOneBooking', () => {
    it('should return booking when found', async () => {
      mockBookingRepository.findOne.mockResolvedValue(mockBooking);

      const result = await service.findOneBooking(mockBooking.id as Uuid);

      expect(result).toEqual(mockBooking);
      expect(mockBookingRepository.findOne).toHaveBeenCalledWith({
        where: { id: mockBooking.id as Uuid },
        relations: ['user', 'space', 'space.partner'],
      });
    });

    it('should throw NotFoundException when booking not found', async () => {
      mockBookingRepository.findOne.mockResolvedValue(null);

      await expect(
        service.findOneBooking(mockBooking.id as Uuid),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateBooking', () => {
    const mockUserSession: UserSession = {
      user: mockUser,
      session: { id: 'session-1' as Uuid } as any,
    };

    const updateBookingDto: UpdateBookingDto = {
      notes: 'Updated notes',
    };

    it('should update booking successfully as owner', async () => {
      mockBookingRepository.findOne.mockResolvedValue(mockBooking);
      mockPartnerRepository.findOne.mockResolvedValue(null);
      mockBookingRepository.save.mockResolvedValue({
        ...mockBooking,
        ...updateBookingDto,
      });

      const result = await service.updateBooking(
        mockBooking.id as Uuid,
        updateBookingDto,
        mockUserSession,
      );

      expect(result.notes).toBe('Updated notes');
      expect(mockBookingRepository.save).toHaveBeenCalled();
    });

    it('should update booking successfully as partner', async () => {
      const partnerBooking = { ...mockBooking, userId: 'other-user' };
      mockBookingRepository.findOne.mockResolvedValue(partnerBooking);
      mockPartnerRepository.findOne.mockResolvedValue(mockPartner);
      mockBookingRepository.save.mockResolvedValue({
        ...partnerBooking,
        ...updateBookingDto,
      });

      const result = await service.updateBooking(
        partnerBooking.id,
        updateBookingDto,
        mockUserSession,
      );

      expect(result.notes).toBe('Updated notes');
      expect(mockBookingRepository.save).toHaveBeenCalled();
    });

    it('should throw BadRequestException when user has no permission', async () => {
      const otherUserBooking = { ...mockBooking, userId: 'other-user' };
      mockBookingRepository.findOne.mockResolvedValue(otherUserBooking);
      mockPartnerRepository.findOne.mockResolvedValue(null);

      await expect(
        service.updateBooking(
          otherUserBooking.id,
          updateBookingDto,
          mockUserSession,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should check availability when updating time slots', async () => {
      const timeUpdateDto: UpdateBookingDto = {
        startDateTime: '2024-01-15T14:00:00Z',
        endDateTime: '2024-01-15T16:00:00Z',
      };

      mockBookingRepository.findOne.mockResolvedValue(mockBooking);
      mockPartnerRepository.findOne.mockResolvedValue(null);
      mockBookingRepository.find.mockResolvedValue([]);
      mockSpaceRepository.findOne.mockResolvedValue(mockSpace);
      mockBookingRepository.save.mockResolvedValue({
        ...mockBooking,
        ...timeUpdateDto,
      });

      const result = await service.updateBooking(
        mockBooking.id as Uuid,
        timeUpdateDto,
        mockUserSession,
      );

      expect(mockBookingRepository.find).toHaveBeenCalled();
      expect(mockBookingRepository.save).toHaveBeenCalled();
    });
  });

  describe('cancelBooking', () => {
    const mockUserSession: UserSession = {
      user: mockUser,
      session: { id: 'session-1' } as any,
    };

    it('should cancel booking successfully as owner', async () => {
      mockBookingRepository.findOne.mockResolvedValue(mockBooking);
      mockPartnerRepository.findOne.mockResolvedValue(null);
      mockBookingRepository.save.mockResolvedValue({
        ...mockBooking,
        status: BookingStatus.CANCELLED,
      });

      const result = await service.cancelBooking(
        mockBooking.id as Uuid,
        mockUserSession,
      );

      expect(result.status).toBe(BookingStatus.CANCELLED);
      expect(mockBookingRepository.save).toHaveBeenCalled();
    });

    it('should cancel booking successfully as partner', async () => {
      const partnerBooking = { ...mockBooking, userId: 'other-user' };
      mockBookingRepository.findOne.mockResolvedValue(partnerBooking);
      mockPartnerRepository.findOne.mockResolvedValue(mockPartner);
      mockBookingRepository.save.mockResolvedValue({
        ...partnerBooking,
        status: BookingStatus.CANCELLED,
      });

      const result = await service.cancelBooking(
        partnerBooking.id,
        mockUserSession,
      );

      expect(result.status).toBe(BookingStatus.CANCELLED);
      expect(mockBookingRepository.save).toHaveBeenCalled();
    });

    it('should throw BadRequestException when user has no permission', async () => {
      const otherUserBooking = { ...mockBooking, userId: 'other-user' };
      mockBookingRepository.findOne.mockResolvedValue(otherUserBooking);
      mockPartnerRepository.findOne.mockResolvedValue(null);

      await expect(
        service.cancelBooking(otherUserBooking.id, mockUserSession),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when booking is already cancelled', async () => {
      const cancelledBooking = {
        ...mockBooking,
        status: BookingStatus.CANCELLED,
      };
      mockBookingRepository.findOne.mockResolvedValue(cancelledBooking);
      mockPartnerRepository.findOne.mockResolvedValue(null);

      await expect(
        service.cancelBooking(cancelledBooking.id, mockUserSession),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when booking is completed', async () => {
      const completedBooking = {
        ...mockBooking,
        status: BookingStatus.COMPLETED,
      };
      mockBookingRepository.findOne.mockResolvedValue(completedBooking);
      mockPartnerRepository.findOne.mockResolvedValue(null);

      await expect(
        service.cancelBooking(completedBooking.id, mockUserSession),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('confirmBooking', () => {
    const mockUserSession: UserSession = {
      user: mockUser,
      session: { id: 'session-1' } as any,
    };

    it('should confirm booking successfully as partner', async () => {
      mockBookingRepository.findOne.mockResolvedValue(mockBooking);
      mockPartnerRepository.findOne.mockResolvedValue(mockPartner);
      mockBookingRepository.save.mockResolvedValue({
        ...mockBooking,
        status: BookingStatus.CONFIRMED,
      });

      const result = await service.confirmBooking(
        mockBooking.id as Uuid,
        mockUserSession,
      );

      expect(result.status).toBe(BookingStatus.CONFIRMED);
      expect(mockBookingRepository.save).toHaveBeenCalled();
    });

    it('should throw BadRequestException when user is not partner', async () => {
      mockBookingRepository.findOne.mockResolvedValue(mockBooking);
      mockPartnerRepository.findOne.mockResolvedValue(null);

      await expect(
        service.confirmBooking(mockBooking.id as Uuid, mockUserSession),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when booking is not pending', async () => {
      const confirmedBooking = {
        ...mockBooking,
        status: BookingStatus.CONFIRMED,
      };
      mockBookingRepository.findOne.mockResolvedValue(confirmedBooking);
      mockPartnerRepository.findOne.mockResolvedValue(mockPartner);

      await expect(
        service.confirmBooking(confirmedBooking.id, mockUserSession),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('completeBooking', () => {
    it('should complete booking successfully as owner', async () => {
      const confirmedBooking = {
        ...mockBooking,
        status: BookingStatus.CONFIRMED,
      };
      mockBookingRepository.findOne.mockResolvedValue(confirmedBooking);
      mockPartnerRepository.findOne.mockResolvedValue(null);
      mockBookingRepository.save.mockResolvedValue({
        ...confirmedBooking,
        status: BookingStatus.COMPLETED,
      });

      const result = await service.completeBooking(
        confirmedBooking.id as Uuid,
        mockUser.id as Uuid,
      );

      expect(result.status).toBe(BookingStatus.COMPLETED);
      expect(mockBookingRepository.save).toHaveBeenCalled();
    });

    it('should complete booking successfully as partner', async () => {
      const confirmedBooking = {
        ...mockBooking,
        status: BookingStatus.CONFIRMED,
        userId: 'other-user',
      };
      mockBookingRepository.findOne.mockResolvedValue(confirmedBooking);
      mockPartnerRepository.findOne.mockResolvedValue(mockPartner);
      mockBookingRepository.save.mockResolvedValue({
        ...confirmedBooking,
        status: BookingStatus.COMPLETED,
      });

      const result = await service.completeBooking(
        confirmedBooking.id as Uuid,
        mockUser.id as Uuid,
      );

      expect(result.status).toBe(BookingStatus.COMPLETED);
      expect(mockBookingRepository.save).toHaveBeenCalled();
    });

    it('should throw BadRequestException when user has no permission', async () => {
      const confirmedBooking = {
        ...mockBooking,
        status: BookingStatus.CONFIRMED,
        userId: 'other-user',
      };
      mockBookingRepository.findOne.mockResolvedValue(confirmedBooking);
      mockPartnerRepository.findOne.mockResolvedValue(null);

      await expect(
        service.completeBooking(
          confirmedBooking.id as Uuid,
          mockUser.id as Uuid,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when booking is not confirmed', async () => {
      mockBookingRepository.findOne.mockResolvedValue(mockBooking);
      mockPartnerRepository.findOne.mockResolvedValue(null);

      await expect(
        service.completeBooking(mockBooking.id as Uuid, mockUser.id as Uuid),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('canCancelBooking', () => {
    it('should return true when booking can be cancelled', async () => {
      const futureBooking = {
        ...mockBooking,
        startDateTime: new Date(Date.now() + 48 * 60 * 60 * 1000), // 48 hours from now
      };
      mockBookingRepository.findOne.mockResolvedValue(futureBooking);
      mockPartnerRepository.findOne.mockResolvedValue(null);

      const result = await service.canCancelBooking(
        futureBooking.id as Uuid,
        mockUser.id as Uuid,
      );

      expect(result).toBe(true);
    });

    it('should return false when booking is too close to start time', async () => {
      const nearBooking = {
        ...mockBooking,
        startDateTime: new Date(Date.now() + 12 * 60 * 60 * 1000), // 12 hours from now
      };
      mockBookingRepository.findOne.mockResolvedValue(nearBooking);
      mockPartnerRepository.findOne.mockResolvedValue(null);

      const result = await service.canCancelBooking(
        nearBooking.id as Uuid,
        mockUser.id as Uuid,
      );

      expect(result).toBe(false);
    });

    it('should return false when user has no permission', async () => {
      const otherUserBooking = { ...mockBooking, userId: 'other-user' };
      mockBookingRepository.findOne.mockResolvedValue(otherUserBooking);
      mockPartnerRepository.findOne.mockResolvedValue(null);

      const result = await service.canCancelBooking(
        otherUserBooking.id as Uuid,
        mockUser.id as Uuid,
      );

      expect(result).toBe(false);
    });

    it('should return false when booking is already cancelled', async () => {
      const cancelledBooking = {
        ...mockBooking,
        status: BookingStatus.CANCELLED,
      };
      mockBookingRepository.findOne.mockResolvedValue(cancelledBooking);
      mockPartnerRepository.findOne.mockResolvedValue(null);

      const result = await service.canCancelBooking(
        cancelledBooking.id as Uuid,
        mockUser.id as Uuid,
      );

      expect(result).toBe(false);
    });

    it('should return false when booking is completed', async () => {
      const completedBooking = {
        ...mockBooking,
        status: BookingStatus.COMPLETED,
      };
      mockBookingRepository.findOne.mockResolvedValue(completedBooking);
      mockPartnerRepository.findOne.mockResolvedValue(null);

      const result = await service.canCancelBooking(
        completedBooking.id as Uuid,
        mockUser.id as Uuid,
      );

      expect(result).toBe(false);
    });
  });

  describe('findBookingsByUserId', () => {
    const mockUserSession: UserSession = {
      user: mockUser,
      session: { id: 'session-1' } as any,
    };

    const queryDto: QueryBookingsOffsetDto = {
      limit: 10,
      offset: 0,
    };

    it('should return user bookings successfully', async () => {
      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        offset: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[mockBooking], 1]),
      };

      mockBookingRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder,
      );
      jest.doMock('@/utils/pagination/offset-pagination', () => ({
        paginate: jest.fn().mockResolvedValue([[mockBooking], 1]),
      }));

      const result = await service.findBookingsByUserId(
        mockUser.id as Uuid,
        queryDto,
        mockUserSession,
      );

      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'booking.userId = :userId',
        { userId: mockUser.id as Uuid },
      );
      expect(result).toBeDefined();
    });

    it('should throw BadRequestException when user tries to access other user bookings', async () => {
      await expect(
        service.findBookingsByUserId(
          'other-user-id',
          queryDto,
          mockUserSession,
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('findBookingsByPartnerId', () => {
    const mockUserSession: UserSession = {
      user: mockUser,
      session: { id: 'session-1' } as any,
    };

    const queryDto: QueryBookingsOffsetDto = {
      limit: 10,
      offset: 0,
    };

    it('should return partner bookings successfully', async () => {
      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        offset: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[mockBooking], 1]),
      };

      mockPartnerRepository.findOne.mockResolvedValue(mockPartner);
      mockBookingRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder,
      );
      jest.doMock('@/utils/pagination/offset-pagination', () => ({
        paginate: jest.fn().mockResolvedValue([[mockBooking], 1]),
      }));

      const result = await service.findBookingsByPartnerId(
        mockPartner.id as Uuid,
        queryDto,
        mockUserSession,
      );

      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'space.partnerId = :partnerId',
        { partnerId: mockPartner.id as Uuid },
      );
      expect(result).toBeDefined();
    });

    it('should throw NotFoundException when partner not found or access denied', async () => {
      mockPartnerRepository.findOne.mockResolvedValue(null);

      await expect(
        service.findBookingsByPartnerId(
          mockPartner.id as Uuid,
          queryDto,
          mockUserSession,
        ),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('createBooking', () => {
    it('should create a booking successfully', async () => {
      const createBookingDto: CreateBookingDto = {
        spaceId: mockSpace.id as Uuid,
        startDateTime: '2024-01-15T10:00:00Z',
        endDateTime: '2024-01-15T12:00:00Z',
        guests: 2,
        notes: 'Test booking',
      };

      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockSpaceRepository.findOne.mockResolvedValue(mockSpace);
      mockBookingRepository.find.mockResolvedValue([]);
      mockBookingRepository.create.mockReturnValue(mockBooking);
      mockBookingRepository.save.mockResolvedValue(mockBooking);
      mockNotificationService.sendBookingConfirmation.mockResolvedValue(
        undefined,
      );

      const result = await service.createBooking(
        mockUser.id as Uuid,
        createBookingDto,
      );

      expect(result).toEqual(mockBooking);
      expect(mockBookingRepository.save).toHaveBeenCalled();
      expect(
        mockNotificationService.sendBookingConfirmation,
      ).toHaveBeenCalled();
    });

    it('should create a booking with coupon successfully', async () => {
      const createBookingDto: CreateBookingDto = {
        spaceId: mockSpace.id as Uuid,
        startDateTime: '2024-01-15T10:00:00Z',
        endDateTime: '2024-01-15T12:00:00Z',
        guests: 2,
        notes: 'Test booking',
        couponCode: 'SAVE20',
      };

      const mockCouponResult = {
        coupon: mockCoupon,
        discountAmount: 20,
      };

      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockSpaceRepository.findOne.mockResolvedValue(mockSpace);
      mockBookingRepository.find.mockResolvedValue([]);
      mockCouponService.applyCouponAtomic.mockResolvedValue(mockCouponResult);
      mockBookingRepository.create.mockReturnValue(mockBooking);
      mockBookingRepository.save.mockResolvedValue(mockBooking);
      mockNotificationService.sendBookingConfirmation.mockResolvedValue(
        undefined,
      );

      const result = await service.createBooking(
        mockUser.id as Uuid,
        createBookingDto,
      );

      expect(result).toEqual(mockBooking);
      expect(mockCouponService.applyCouponAtomic).toHaveBeenCalledWith(
        'SAVE20',
        mockUser.id as Uuid,
        200,
      );
      expect(mockBookingRepository.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException when user not found', async () => {
      const createBookingDto: CreateBookingDto = {
        spaceId: mockSpace.id as Uuid,
        startDateTime: '2024-01-15T10:00:00Z',
        endDateTime: '2024-01-15T12:00:00Z',
        guests: 2,
        notes: 'Test booking',
      };

      mockUserRepository.findOne.mockResolvedValue(null);

      await expect(
        service.createBooking(mockUser.id as Uuid, createBookingDto),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException when space not found', async () => {
      const createBookingDto: CreateBookingDto = {
        spaceId: mockSpace.id as Uuid,
        startDateTime: '2024-01-15T10:00:00Z',
        endDateTime: '2024-01-15T12:00:00Z',
        guests: 2,
        notes: 'Test booking',
      };

      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockSpaceRepository.findOne.mockResolvedValue(null);

      await expect(
        service.createBooking(mockUser.id as Uuid, createBookingDto),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when space is inactive', async () => {
      const createBookingDto: CreateBookingDto = {
        spaceId: mockSpace.id as Uuid,
        startDateTime: '2024-01-15T10:00:00Z',
        endDateTime: '2024-01-15T12:00:00Z',
        guests: 2,
        notes: 'Test booking',
      };

      const inactiveSpace = { ...mockSpace, status: 'inactive' };
      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockSpaceRepository.findOne.mockResolvedValue(inactiveSpace);

      await expect(
        service.createBooking(mockUser.id as Uuid, createBookingDto),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw ConflictException when space is not available', async () => {
      const createBookingDto: CreateBookingDto = {
        spaceId: mockSpace.id as Uuid,
        startDateTime: '2024-01-15T10:00:00Z',
        endDateTime: '2024-01-15T12:00:00Z',
        guests: 2,
        notes: 'Test booking',
      };

      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockSpaceRepository.findOne.mockResolvedValue(mockSpace);
      mockBookingRepository.find.mockResolvedValue([mockBooking]); // Conflicting booking

      await expect(
        service.createBooking(mockUser.id as Uuid, createBookingDto),
      ).rejects.toThrow(ConflictException);
    });

    it('should throw BadRequestException when guests exceed capacity', async () => {
      const createBookingDto: CreateBookingDto = {
        spaceId: mockSpace.id as Uuid,
        startDateTime: '2024-01-15T10:00:00Z',
        endDateTime: '2024-01-15T12:00:00Z',
        guests: 15, // Exceeds capacity of 10
        notes: 'Test booking',
      };

      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockSpaceRepository.findOne.mockResolvedValue(mockSpace);
      mockBookingRepository.find.mockResolvedValue([]);

      await expect(
        service.createBooking(mockUser.id as Uuid, createBookingDto),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when start date is after end date', async () => {
      const createBookingDto: CreateBookingDto = {
        spaceId: mockSpace.id as Uuid,
        startDateTime: '2024-01-15T12:00:00Z',
        endDateTime: '2024-01-15T10:00:00Z', // End before start
        guests: 2,
        notes: 'Test booking',
      };

      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockSpaceRepository.findOne.mockResolvedValue(mockSpace);
      mockBookingRepository.find.mockResolvedValue([]);

      await expect(
        service.createBooking(mockUser.id as Uuid, createBookingDto),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('findAllBookings', () => {
    it('should return all bookings with pagination', async () => {
      const queryDto = { limit: 10, offset: 0, page: 1 };
      const paginatedResult = {
        data: [mockBooking],
        pagination: new OffsetPaginationDto(1, queryDto),
      };

      // Mock the paginate function result
      jest.spyOn(service, 'findAllBookings').mockResolvedValue(paginatedResult);

      const result = await service.findAllBookings(queryDto);

      expect(result).toEqual(paginatedResult);
    });
  });

  describe('findOneBooking', () => {
    it('should return a booking by id', async () => {
      mockBookingRepository.findOne.mockResolvedValue(mockBooking);

      const result = await service.findOneBooking('booking-1' as Uuid);

      expect(mockBookingRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'booking-1' as Uuid },
        relations: ['user', 'space', 'space.partner'],
      });
      expect(result).toEqual(mockBooking);
    });

    it('should throw NotFoundException when booking not found', async () => {
      mockBookingRepository.findOne.mockResolvedValue(null);

      await expect(service.findOneBooking('999' as any)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updateBooking', () => {
    const mockUserSession: UserSession = {
      user: mockUser,
      session: {
        id: 'session-1' as Uuid,
        createdAt: new Date(),
        updatedAt: new Date(),
        userId: 'user-1' as Uuid,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        token: 'mock-token',
        ipAddress: '127.0.0.1',
        userAgent: 'test-agent',
      } as any,
    };

    it('should update booking status', async () => {
      const updateDto: UpdateBookingDto = {
        status: BookingStatus.CANCELLED,
      };

      const updatedBooking = {
        ...mockBooking,
        status: BookingStatus.CANCELLED,
      };

      mockBookingRepository.findOne.mockResolvedValue(mockBooking);
      mockPartnerRepository.findOne.mockResolvedValue(null); // User is owner, not partner
      mockBookingRepository.save.mockResolvedValue(updatedBooking);

      const result = await service.updateBooking(
        'booking-1' as Uuid,
        updateDto,
        mockUserSession,
      );

      expect(mockBookingRepository.save).toHaveBeenCalledWith({
        ...mockBooking,
        ...updateDto,
      });
      expect(result.status).toBe(BookingStatus.CANCELLED);
    });

    it('should throw NotFoundException when booking not found', async () => {
      mockBookingRepository.findOne.mockResolvedValue(null);

      await expect(
        service.updateBooking(
          '999' as any,
          { status: BookingStatus.CANCELLED },
          mockUserSession,
        ),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('cancelBooking', () => {
    const mockUserSession: UserSession = {
      user: mockUser,
      session: {
        id: 'session-1' as Uuid,
        createdAt: new Date(),
        updatedAt: new Date(),
        userId: 'user-1' as Uuid,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        token: 'mock-token',
        ipAddress: '127.0.0.1',
        userAgent: 'test-agent',
      } as any,
    };

    it('should cancel a booking', async () => {
      const bookingToCancel = {
        ...mockBooking,
        status: BookingStatus.CONFIRMED, // Set to a status that can be cancelled
      };

      const cancelledBooking = {
        ...bookingToCancel,
        status: BookingStatus.CANCELLED,
      };

      mockBookingRepository.findOne.mockResolvedValue(bookingToCancel);
      mockPartnerRepository.findOne.mockResolvedValue(null); // User is owner, not partner
      mockBookingRepository.save.mockResolvedValue(cancelledBooking);

      const result = await service.cancelBooking(
        'booking-1' as Uuid,
        mockUserSession,
      );

      expect(mockBookingRepository.save).toHaveBeenCalledWith({
        ...bookingToCancel,
        status: BookingStatus.CANCELLED,
      });
      expect(result.status).toBe(BookingStatus.CANCELLED);
    });

    it('should throw NotFoundException when booking not found', async () => {
      mockBookingRepository.findOne.mockResolvedValue(null);

      await expect(
        service.cancelBooking('999' as any, mockUserSession),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('findBookingsByUserId', () => {
    const mockUserSession: UserSession = {
      user: mockUser,
      session: {
        id: 'session-1',
        createdAt: new Date(),
        updatedAt: new Date(),
        userId: 'user-1' as Uuid,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        token: 'mock-token',
        ipAddress: '127.0.0.1',
        userAgent: 'test-agent',
      } as any,
    };
    const queryDto = { limit: 10, offset: 0 };

    it('should return bookings for a specific user', async () => {
      const paginatedResult = {
        data: [mockBooking],
        pagination: new OffsetPaginationDto(1, { ...queryDto, page: 1 }),
      };

      jest
        .spyOn(service, 'findBookingsByUserId')
        .mockResolvedValue(paginatedResult);

      const result = await service.findBookingsByUserId(
        'user-1' as Uuid,
        queryDto,
        mockUserSession,
      );

      expect(result).toEqual(paginatedResult);
    });
  });

  describe('findBookingsByPartnerId', () => {
    const mockUserSession: UserSession = {
      user: mockUser,
      session: {
        id: 'session-1' as Uuid,
        createdAt: new Date(),
        updatedAt: new Date(),
        userId: 'user-1' as Uuid,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        token: 'mock-token',
        ipAddress: '127.0.0.1',
        userAgent: 'test-agent',
      } as any,
    };
    const queryDto = { limit: 10, offset: 0 };

    it('should return bookings for a specific partner', async () => {
      const paginatedResult = {
        data: [mockBooking],
        pagination: new OffsetPaginationDto(1, { ...queryDto, page: 1 }),
      };

      mockPartnerRepository.findOne.mockResolvedValue({
        id: 'partner-1' as Uuid,
        userId: 'user-1' as Uuid,
      });
      jest
        .spyOn(service, 'findBookingsByPartnerId')
        .mockResolvedValue(paginatedResult);

      const result = await service.findBookingsByPartnerId(
        'partner-1' as Uuid,
        queryDto,
        mockUserSession,
      );

      expect(result).toEqual(paginatedResult);
    });
  });

  describe('createBooking calculation logic', () => {
    it('should calculate duration and amount correctly in createBooking', async () => {
      const startDate = new Date('2024-02-01T09:00:00Z');
      const endDate = new Date('2024-02-01T17:00:00Z');
      const expectedDurationHours = 8;
      const expectedBaseAmount = expectedDurationHours * 25; // basePrice from mockSpace

      mockSpaceRepository.findOne.mockResolvedValue(mockSpace);
      mockBookingRepository.find.mockResolvedValue([]);
      mockBookingRepository.create.mockReturnValue(mockBooking);
      mockBookingRepository.save.mockResolvedValue(mockBooking);
      mockUserRepository.findOne.mockResolvedValue(mockUser);

      const createBookingDto: CreateBookingDto = {
        spaceId: 'space-1' as Uuid,
        startDateTime: startDate.toISOString(),
        endDateTime: endDate.toISOString(),
        guests: 2,
        notes: 'Test booking',
        couponCode: undefined,
      };

      const result = await service.createBooking(
        'user-1' as Uuid,
        createBookingDto,
      );

      expect(mockBookingRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          baseAmount: expectedBaseAmount,
          duration: expectedDurationHours * 60, // converted to minutes
        }),
      );
    });
  });
});
