import {
  ErrorCodes,
  ErrorResponseUtil,
} from '@/common/utils/error-response.util';
import { CouponEntity } from '@/database/entities/coupon.entity';
import { DynamicPricingService } from '@/services/dynamic-pricing.service';
import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, In, LessThan, MoreThan, Not, Repository } from 'typeorm';
import { CouponService } from '../coupon/coupon.service';
import { NotificationService } from '../notification/notification.service';

import { UserSession } from '@/auth/auth.type';
import { UserEntity } from '@/auth/entities/user.entity';
import { CursorPaginationDto } from '@/common/dto/cursor-pagination/cursor-pagination.dto';
import { CursorPaginatedDto } from '@/common/dto/cursor-pagination/paginated.dto';
import { OffsetPaginationDto } from '@/common/dto/offset-pagination/offset-pagination.dto';
import { OffsetPaginatedDto } from '@/common/dto/offset-pagination/paginated.dto';
import { BookingStatus } from '@/common/enums/booking.enum';
import { Uuid } from '@/common/types/common.type';
import { BookingEntity } from '@/database/entities/booking.entity';
import { PartnerEntity } from '@/database/entities/partner.entity';
import { SpaceEntity } from '@/database/entities/space.entity';
import { buildPaginator } from '@/utils/pagination/cursor-pagination';
import { paginate } from '@/utils/pagination/offset-pagination';
import {
  AvailabilityResponseDto,
  BookingKycStatus,
  BookingKycStatusDto,
  CheckAvailabilityDto,
  CreateBookingDto,
  QueryBookingsCursorDto,
  QueryBookingsOffsetDto,
  UpdateBookingDto,
} from './booking.dto';
import {
  BookingCancelledEvent,
  BookingCompletedEvent,
  BookingConfirmedEvent,
  BookingCreatedEvent,
  BookingModifiedEvent,
} from './events/booking.events';

@Injectable()
export class BookingService {
  constructor(
    @InjectRepository(BookingEntity)
    private readonly bookingRepository: Repository<BookingEntity>,
    @InjectRepository(SpaceEntity)
    private readonly spaceRepository: Repository<SpaceEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    @InjectRepository(PartnerEntity)
    private readonly partnerRepository: Repository<PartnerEntity>,
    private readonly couponService: CouponService,
    private readonly notificationService: NotificationService,
    private readonly dynamicPricingService: DynamicPricingService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async checkAvailability(
    checkAvailabilityDto: CheckAvailabilityDto,
  ): Promise<AvailabilityResponseDto> {
    const { spaceId, startDateTime, endDateTime } = checkAvailabilityDto;

    // Validate space exists
    const space = await this.spaceRepository.findOne({
      where: { id: spaceId },
    });
    if (!space) {
      throw ErrorResponseUtil.notFound('Space', spaceId);
    }

    const conflictingBookings = await this.bookingRepository.find({
      where: {
        spaceOption: {
          spaceId: checkAvailabilityDto.spaceId,
        },
        status: Not(In([BookingStatus.CANCELLED])),
        startDateTime: LessThan(new Date(endDateTime)),
        endDateTime: MoreThan(new Date(startDateTime)),
      },
      relations: [
        'spaceOption',
        'spaceOption.space',
        'spaceOption.space.listing',
      ],
    });

    return {
      available: conflictingBookings.length === 0,
      conflicts:
        conflictingBookings.length > 0
          ? conflictingBookings.map((booking) => ({
              id: booking.id as Uuid,
              spaceId: booking.spaceOption?.spaceId as Uuid,
              userId: booking.userId as Uuid,
              partnerId:
                (booking.spaceOption?.space?.listing?.partner_id as Uuid) ||
                ('' as Uuid),
              startDateTime: booking.startDateTime,
              endDateTime: booking.endDateTime,
              guests: booking.guestCount,
              notes: booking.specialRequests,
              totalAmount: Number(booking.totalAmount),
              status: booking.status,
              createdAt: booking.createdAt,
              updatedAt: booking.updatedAt,
            }))
          : undefined,
    };
  }

  async createBooking(
    userId: Uuid,
    createBookingDto: CreateBookingDto,
  ): Promise<BookingEntity> {
    const { spaceId, startDateTime, endDateTime, guests, notes, couponCode } =
      createBookingDto;

    // Validate user exists
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw ErrorResponseUtil.notFound('User', userId);
    }

    // Validate space exists and is active
    const space = await this.spaceRepository.findOne({
      where: { id: spaceId },
      relations: ['partner'],
    });
    if (!space) {
      throw ErrorResponseUtil.notFound('Space', spaceId);
    }

    // Validate space status
    if (space.status !== 'active') {
      throw ErrorResponseUtil.badRequest(
        'Space is not available for booking',
        ErrorCodes.INVALID_STATUS,
      );
    }

    // Check availability
    const availability = await this.checkAvailability({
      spaceId,
      startDateTime,
      endDateTime,
    });

    if (!availability.available) {
      throw ErrorResponseUtil.conflict(
        'Space is not available for the requested time slot',
        ErrorCodes.BOOKING_CONFLICT,
      );
    }

    // TODO: Implement guest capacity validation based on space options
    // Note: Capacity validation should be implemented based on space option configuration

    // Validate date range
    const startDate = new Date(startDateTime);
    const endDate = new Date(endDateTime);

    if (startDate >= endDate) {
      throw ErrorResponseUtil.badRequest(
        'Start date and time must be before end date and time',
        ErrorCodes.INVALID_INPUT,
      );
    }

    // Calculate dynamic pricing
    const durationHours =
      (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60);

    // Get dynamic pricing calculation
    const pricingResult =
      await this.dynamicPricingService.calculateDynamicPrice({
        spaceId,
        startDateTime: startDate,
        endDateTime: endDate,
        basePrice: 100, // TODO: Implement proper pricing from space options
        bookingDuration: durationHours,
      });

    const baseAmount = pricingResult.finalPrice;

    // Apply coupon if provided
    let coupon: CouponEntity | null = null;
    let discountAmount = 0;
    if (couponCode) {
      const couponResult = await this.couponService.applyCouponAtomic(
        couponCode,
        userId,
        baseAmount,
      );

      coupon = couponResult.coupon;
      discountAmount = couponResult.discountAmount;
    }

    // Calculate final total amount
    const totalAmount = baseAmount - discountAmount;

    // Create booking
    const booking = this.bookingRepository.create({
      userId,
      spaceOptionId: spaceId, // Using spaceId as spaceOptionId for now
      startDateTime: new Date(startDateTime),
      endDateTime: new Date(endDateTime),
      guestCount: guests,
      specialRequests: notes,
      baseAmount,
      discountAmount,
      totalAmount,
      couponCode: couponCode || null,
      couponId: coupon?.id || null,
      duration: durationHours * 60, // convert to minutes
      bookingNumber: `BK${Date.now()}`,
      status: BookingStatus.PENDING,
    });

    // Check if KYC is required and set initial status
    const kycRequired = this.isKycRequired(booking);
    if (kycRequired) {
      booking.kycStatus = BookingKycStatus.PENDING;
      booking.kycRequiredAt = new Date();
    } else {
      booking.kycStatus = BookingKycStatus.NOT_REQUIRED;
    }

    const savedBooking = await this.bookingRepository.save(booking);

    // Emit booking created event
    const bookingCreatedEvent = new BookingCreatedEvent(
      savedBooking.id as Uuid,
      savedBooking.userId as Uuid,
      spaceId,
      space.listing?.partner?.id || ('' as Uuid),
      savedBooking.totalAmount,
      savedBooking.startDateTime,
      savedBooking.endDateTime,
      savedBooking.guestCount,
      kycRequired,
    );
    this.eventEmitter.emit('booking.created', bookingCreatedEvent);

    // Note: Coupon usage is already incremented atomically in applyCouponAtomic method

    // Send booking confirmation email with discount information
    if (user) {
      const bookingData = {
        customerName: `${user.firstName} ${user.lastName}`,
        userEmail: user.email,
        bookingId: savedBooking.bookingNumber,
        spaceName: space.name,
        spaceAddress:
          space.listing?.location?.address || 'Location not specified',
        checkInDate: savedBooking.startDateTime,
        checkOutDate: savedBooking.endDateTime,
        totalAmount: savedBooking.totalAmount,
        originalAmount: discountAmount > 0 ? baseAmount : undefined,
        discountAmount: discountAmount > 0 ? discountAmount : undefined,
        couponCode: couponCode || undefined,
        paymentMethod: 'Pending', // Will be updated when payment is processed
        bookingUrl: `${process.env.FRONTEND_URL}/bookings/${savedBooking.id}`,
      };

      await this.notificationService.sendBookingConfirmation(
        userId,
        bookingData,
      );
    }

    return savedBooking;
  }

  async findAllBookings(
    queryDto: QueryBookingsOffsetDto,
  ): Promise<OffsetPaginatedDto<BookingEntity>> {
    const { limit, offset, q, status, spaceId, partnerId } = queryDto;

    const queryBuilder = this.bookingRepository
      .createQueryBuilder('booking')
      .leftJoinAndSelect('booking.user', 'user')
      .leftJoinAndSelect('booking.spaceOption', 'spaceOption')
      .leftJoinAndSelect('spaceOption.space', 'space')
      .leftJoinAndSelect('space.listing', 'listing')
      .leftJoinAndSelect('listing.partner', 'partner');

    if (q) {
      queryBuilder.andWhere(
        '(user.firstName ILIKE :search OR user.lastName ILIKE :search OR space.name ILIKE :search)',
        { search: `%${q}%` },
      );
    }

    if (status) {
      queryBuilder.andWhere('booking.status = :status', { status });
    }

    if (spaceId) {
      queryBuilder.andWhere('spaceOption.spaceId = :spaceId', { spaceId });
    }

    if (partnerId) {
      queryBuilder.andWhere('listing.partner_id = :partnerId', { partnerId });
    }

    const [bookings, total] = await queryBuilder
      .orderBy('booking.createdAt', 'DESC')
      .limit(limit)
      .offset(offset)
      .getManyAndCount();

    const result = await paginate(queryBuilder, queryDto);
    return new OffsetPaginatedDto(result[0], result[1]);
  }

  async findAllBookingsCursor(
    queryDto: QueryBookingsCursorDto,
  ): Promise<CursorPaginatedDto<BookingEntity>> {
    const { limit, q, status, spaceId, partnerId, afterCursor, beforeCursor } =
      queryDto;

    const queryBuilder = this.bookingRepository
      .createQueryBuilder('booking')
      .leftJoinAndSelect('booking.user', 'user')
      .leftJoinAndSelect('booking.spaceOption', 'spaceOption')
      .leftJoinAndSelect('spaceOption.space', 'space')
      .leftJoinAndSelect('space.listing', 'listing')
      .leftJoinAndSelect('listing.partner', 'partner');

    if (q) {
      queryBuilder.andWhere(
        '(user.firstName ILIKE :search OR user.lastName ILIKE :search OR space.name ILIKE :search)',
        { search: `%${q}%` },
      );
    }

    if (status) {
      queryBuilder.andWhere('booking.status = :status', { status });
    }

    if (spaceId) {
      queryBuilder.andWhere('spaceOption.spaceId = :spaceId', { spaceId });
    }

    if (partnerId) {
      queryBuilder.andWhere('listing.partner_id = :partnerId', { partnerId });
    }

    const paginator = buildPaginator({
      entity: BookingEntity,
      alias: 'booking',
      paginationKeys: ['id'],
      query: {
        limit: limit,
        order: 'DESC',
        afterCursor,
        beforeCursor,
      },
    });

    const { data, cursor } = await paginator.paginate(queryBuilder);

    const paginationMeta = new CursorPaginationDto(
      data.length,
      cursor.afterCursor,
      cursor.beforeCursor,
      { limit: limit },
    );

    return new CursorPaginatedDto(data, paginationMeta);
  }

  async getLatestBookings(limit: number = 5): Promise<BookingEntity[]> {
    return this.bookingRepository.find({
      relations: [
        'user',
        'spaceOption',
        'spaceOption.space',
        'spaceOption.space.listing',
        'spaceOption.space.listing.partner',
      ],
      order: {
        createdAt: 'DESC',
      },
      take: limit,
    });
  }

  async findOneBooking(id: Uuid): Promise<BookingEntity> {
    const booking = await this.bookingRepository.findOne({
      where: { id },
      relations: [
        'user',
        'spaceOption',
        'spaceOption.space',
        'spaceOption.space.listing',
        'spaceOption.space.listing.partner',
      ],
    });

    if (!booking) {
      throw ErrorResponseUtil.notFound('Booking', id);
    }

    return booking;
  }

  async findBookingsByUserId(
    userId: Uuid,
    queryDto: QueryBookingsOffsetDto,
    user: UserSession,
  ): Promise<OffsetPaginatedDto<BookingEntity>> {
    // Ensure user can only access their own bookings
    if (user.user.id !== userId) {
      throw ErrorResponseUtil.forbidden('Access denied', ErrorCodes.FORBIDDEN);
    }

    const { limit, offset, q, status, spaceId } = queryDto;

    const queryBuilder = this.bookingRepository
      .createQueryBuilder('booking')
      .leftJoinAndSelect('booking.user', 'user')
      .leftJoinAndSelect('booking.spaceOption', 'spaceOption')
      .leftJoinAndSelect('spaceOption.space', 'space')
      .where('booking.userId = :userId', { userId });

    if (q) {
      queryBuilder.andWhere('space.name ILIKE :search', { search: `%${q}%` });
    }

    if (status) {
      queryBuilder.andWhere('booking.status = :status', { status });
    }

    if (spaceId) {
      queryBuilder.andWhere('spaceOption.spaceId = :spaceId', { spaceId });
    }

    const [bookings, total] = await queryBuilder
      .orderBy('booking.createdAt', 'DESC')
      .limit(limit)
      .offset(offset)
      .getManyAndCount();

    const result = await paginate(queryBuilder, queryDto);
    return new OffsetPaginatedDto(result[0], result[1]);
  }

  async findBookingsByPartnerId(
    partnerId: Uuid,
    queryDto: QueryBookingsOffsetDto,
    user: UserSession,
  ): Promise<OffsetPaginatedDto<BookingEntity>> {
    // Verify user owns the partner
    const partner = await this.partnerRepository.findOne({
      where: { id: partnerId, userId: user.user.id },
    });

    if (!partner) {
      throw ErrorResponseUtil.notFound('Partner', partnerId);
    }

    const { limit, offset, q, status, spaceId } = queryDto;

    const queryBuilder = this.bookingRepository
      .createQueryBuilder('booking')
      .leftJoinAndSelect('booking.user', 'user')
      .leftJoinAndSelect('booking.spaceOption', 'spaceOption')
      .leftJoinAndSelect('spaceOption.space', 'space')
      .leftJoinAndSelect('space.listing', 'listing')
      .where('listing.partner_id = :partnerId', { partnerId });

    if (q) {
      queryBuilder.andWhere(
        '(user.firstName ILIKE :search OR user.lastName ILIKE :search OR space.name ILIKE :search)',
        { search: `%${q}%` },
      );
    }

    if (status) {
      queryBuilder.andWhere('booking.status = :status', { status });
    }

    if (spaceId) {
      queryBuilder.andWhere('spaceOption.spaceId = :spaceId', { spaceId });
    }

    const [bookings, total] = await queryBuilder
      .orderBy('booking.createdAt', 'DESC')
      .limit(limit)
      .offset(offset)
      .getManyAndCount();

    const result = await paginate(queryBuilder, queryDto);
    return new OffsetPaginatedDto(result[0], result[1]);
  }

  async updateBooking(
    id: Uuid,
    updateBookingDto: UpdateBookingDto,
    user: UserSession,
  ): Promise<BookingEntity> {
    const booking = await this.findOneBooking(id);

    // Check if user has permission to update (owner or partner)
    const isOwner = booking.userId === user.user.id;
    const isPartner = await this.partnerRepository.findOne({
      where: {
        id: booking.spaceOption?.space?.listing?.partner_id,
        userId: user.user.id,
      },
    });

    if (!isOwner && !isPartner) {
      throw ErrorResponseUtil.forbidden('Access denied', ErrorCodes.FORBIDDEN);
    }

    // If updating time slots, check availability
    if (updateBookingDto.startDateTime || updateBookingDto.endDateTime) {
      const startTime =
        updateBookingDto.startDateTime || booking.startDateTime.toISOString();
      const endTime =
        updateBookingDto.endDateTime || booking.endDateTime.toISOString();

      const availability = await this.checkAvailability({
        spaceId: booking.spaceOption?.spaceId as Uuid,
        startDateTime: startTime,
        endDateTime: endTime,
      });

      // Filter out current booking from conflicts
      if (availability.conflicts) {
        availability.conflicts = availability.conflicts.filter(
          (conflict) => conflict.id !== booking.id,
        );
        availability.available = availability.conflicts.length === 0;
      }

      if (!availability.available) {
        throw ErrorResponseUtil.conflict(
          'Space is not available for the requested time slot',
          ErrorCodes.BOOKING_CONFLICT,
        );
      }

      // Recalculate total amount if time changed
      if (updateBookingDto.startDateTime || updateBookingDto.endDateTime) {
        const space = await this.spaceRepository.findOne({
          where: { id: booking.spaceOption?.spaceId },
        });
        const startDate = new Date(startTime);
        const endDate = new Date(endTime);
        const durationHours =
          (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60);
        // TODO: Implement proper pricing calculation based on space options
        const totalAmount = durationHours * 100; // Placeholder rate
        Object.assign(updateBookingDto, { totalAmount });
      }
    }

    Object.assign(booking, updateBookingDto);
    return this.bookingRepository.save(booking);
  }

  async cancelBooking(id: Uuid, user: UserSession): Promise<BookingEntity> {
    const booking = await this.findOneBooking(id);

    // Check if user has permission to cancel (owner or partner)
    const isOwner = booking.userId === user.user.id;
    const isPartner = await this.partnerRepository.findOne({
      where: {
        id: booking.spaceOption?.space?.listing?.partner_id,
        userId: user.user.id,
      },
    });

    if (!isOwner && !isPartner) {
      throw ErrorResponseUtil.forbidden('Access denied', ErrorCodes.FORBIDDEN);
    }

    // Check if booking can be cancelled
    if (booking.status === BookingStatus.CANCELLED) {
      throw ErrorResponseUtil.badRequest(
        'Booking is already cancelled',
        ErrorCodes.INVALID_STATUS,
      );
    }

    if (booking.status === BookingStatus.COMPLETED) {
      throw ErrorResponseUtil.badRequest(
        'Cannot cancel completed booking',
        ErrorCodes.INVALID_STATUS,
      );
    }

    booking.status = BookingStatus.CANCELLED;
    const cancelledAt = new Date();
    const savedBooking = await this.bookingRepository.save(booking);

    // Emit booking cancelled event
    const bookingCancelledEvent = new BookingCancelledEvent(
      savedBooking.id as Uuid,
      savedBooking.userId as Uuid,
      (savedBooking.spaceOption?.spaceId as Uuid) || ('' as Uuid),
      (savedBooking.spaceOption?.space?.listing?.partner_id as Uuid) ||
        ('' as Uuid),
      savedBooking.totalAmount,
      cancelledAt,
      'User cancelled', // Default reason
    );
    this.eventEmitter.emit('booking.cancelled', bookingCancelledEvent);

    return savedBooking;
  }

  async confirmBooking(id: Uuid, user: UserSession): Promise<BookingEntity> {
    const booking = await this.findOneBooking(id);

    // Only partner can confirm bookings
    const isPartner = await this.partnerRepository.findOne({
      where: {
        id: booking.spaceOption?.space?.listing?.partner_id,
        userId: user.user.id,
      },
    });

    if (!isPartner) {
      throw ErrorResponseUtil.forbidden(
        'Only partner can confirm bookings',
        ErrorCodes.FORBIDDEN,
      );
    }

    if (booking.status !== BookingStatus.PENDING) {
      throw ErrorResponseUtil.badRequest(
        'Only pending bookings can be confirmed',
        ErrorCodes.INVALID_STATUS,
      );
    }

    booking.status = BookingStatus.CONFIRMED;
    const savedBooking = await this.bookingRepository.save(booking);

    // Emit booking confirmed event
    const bookingConfirmedEvent = new BookingConfirmedEvent(
      savedBooking.id as Uuid,
      savedBooking.userId as Uuid,
      (savedBooking.spaceOption?.spaceId as Uuid) || ('' as Uuid),
      (savedBooking.spaceOption?.space?.listing?.partner_id as Uuid) ||
        ('' as Uuid),
      savedBooking.totalAmount,
      savedBooking.startDateTime,
      savedBooking.endDateTime,
    );
    this.eventEmitter.emit('booking.confirmed', bookingConfirmedEvent);

    return savedBooking;
  }

  async completeBooking(id: Uuid, userId: string): Promise<BookingEntity> {
    const booking = await this.findOneBooking(id);

    // Check if user has permission to complete (owner or partner)
    const isOwner = booking.userId === userId;
    const isPartner = await this.partnerRepository.findOne({
      where: { id: booking.spaceOption?.space?.listing?.partner_id, userId },
    });

    if (!isOwner && !isPartner) {
      throw ErrorResponseUtil.forbidden('Access denied', ErrorCodes.FORBIDDEN);
    }

    if (booking.status !== BookingStatus.CONFIRMED) {
      throw ErrorResponseUtil.badRequest(
        'Only confirmed bookings can be completed',
        ErrorCodes.INVALID_STATUS,
      );
    }

    booking.status = BookingStatus.COMPLETED;
    const completedAt = new Date();
    const savedBooking = await this.bookingRepository.save(booking);

    // Emit booking completed event
    const bookingCompletedEvent = new BookingCompletedEvent(
      savedBooking.id as Uuid,
      savedBooking.userId as Uuid,
      (savedBooking.spaceOption?.spaceId as Uuid) || ('' as Uuid),
      (savedBooking.spaceOption?.space?.listing?.partner_id as Uuid) ||
        ('' as Uuid),
      savedBooking.totalAmount,
      savedBooking.startDateTime,
      savedBooking.endDateTime,
      completedAt,
    );
    this.eventEmitter.emit('booking.completed', bookingCompletedEvent);

    return savedBooking;
  }

  async canCancelBooking(id: Uuid, userId: string): Promise<boolean> {
    const booking = await this.findOneBooking(id);

    // Check if user has permission to cancel (owner or partner)
    const isOwner = booking.userId === userId;
    const isPartner = await this.partnerRepository.findOne({
      where: { id: booking.spaceOption?.space?.listing?.partner_id, userId },
    });

    if (!isOwner && !isPartner) {
      return false;
    }

    // Check if booking can be cancelled
    if (
      booking.status === BookingStatus.CANCELLED ||
      booking.status === BookingStatus.COMPLETED
    ) {
      return false;
    }

    // Check if booking is too close to start time (e.g., within 24 hours)
    const now = new Date();
    const startTime = new Date(booking.startDateTime);
    const timeDiff = startTime.getTime() - now.getTime();
    const hoursDiff = timeDiff / (1000 * 60 * 60);

    // Allow cancellation if more than 24 hours before start time
    return hoursDiff > 24;
  }

  async getBookingKycStatus(
    id: Uuid,
    user: UserSession,
  ): Promise<BookingKycStatusDto> {
    const booking = await this.findOneBooking(id);

    // Check if user has permission to view (owner or partner)
    const isOwner = booking.userId === user.user.id;
    const isPartner = await this.partnerRepository.findOne({
      where: {
        id: booking.spaceOption?.space?.listing?.partner_id,
        userId: user.user.id,
      },
    });

    if (!isOwner && !isPartner) {
      throw ErrorResponseUtil.forbidden('Access denied', ErrorCodes.FORBIDDEN);
    }

    // Determine if KYC is required based on booking amount or other criteria
    const kycRequired = this.isKycRequired(booking);

    return {
      bookingId: booking.id,
      kycStatus:
        (booking.kycStatus as BookingKycStatus) ||
        BookingKycStatus.NOT_REQUIRED,
      kycVerificationId: booking.kycVerificationId || undefined,
      kycRequiredAt: booking.kycRequiredAt || undefined,
      kycCompletedAt: booking.kycCompletedAt || undefined,
      kycRequired,
    };
  }

  async requireKycForBooking(
    id: Uuid,
    user: UserSession,
  ): Promise<BookingEntity> {
    const booking = await this.findOneBooking(id);

    // Only partner can require KYC for bookings
    const isPartner = await this.partnerRepository.findOne({
      where: {
        id: booking.spaceOption?.space?.listing?.partner_id,
        userId: user.user.id,
      },
    });

    if (!isPartner) {
      throw ErrorResponseUtil.forbidden(
        'Only partner can require KYC for bookings',
        ErrorCodes.FORBIDDEN,
      );
    }

    // Check if booking is in a state where KYC can be required
    if (
      booking.status === BookingStatus.CANCELLED ||
      booking.status === BookingStatus.COMPLETED
    ) {
      throw ErrorResponseUtil.badRequest(
        'Cannot require KYC for cancelled or completed bookings',
        ErrorCodes.INVALID_STATUS,
      );
    }

    // Update booking to require KYC
    booking.kycStatus = BookingKycStatus.PENDING;
    booking.kycRequiredAt = new Date();

    return this.bookingRepository.save(booking);
  }

  private isKycRequired(booking: BookingEntity): boolean {
    // Define KYC requirements based on business rules
    // For example: bookings over a certain amount, specific space types, etc.
    const KYC_THRESHOLD = 1000; // $1000 threshold

    return booking.totalAmount >= KYC_THRESHOLD;
  }
}
