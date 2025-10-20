import { OffsetPaginationDto } from '@/common/dto/offset-pagination/offset-pagination.dto';
import { PageOptionsDto } from '@/common/dto/offset-pagination/page-options.dto';
import { OffsetPaginatedDto } from '@/common/dto/offset-pagination/paginated.dto';
import {
  ErrorCodes,
  ErrorResponseUtil,
} from '@/common/utils/error-response.util';
import { BookingEntity } from '@/database/entities/booking.entity';
import {
  CouponEntity,
  CouponScope,
  CouponStatus,
  CouponType,
} from '@/database/entities/coupon.entity';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  DataSource,
  FindManyOptions,
  LessThanOrEqual,
  Like,
  MoreThanOrEqual,
  Repository,
} from 'typeorm';
import {
  CouponQueryDto,
  CouponUsageDto,
  ValidateCouponDto,
} from './dto/coupon-query.dto';
import { CreateCouponDto } from './dto/create-coupon.dto';
import { UpdateCouponDto } from './dto/update-coupon.dto';

@Injectable()
export class CouponService {
  constructor(
    @InjectRepository(CouponEntity)
    private readonly couponRepository: Repository<CouponEntity>,
    @InjectRepository(BookingEntity)
    private readonly bookingRepository: Repository<BookingEntity>,
    private readonly dataSource: DataSource,
  ) {}

  async create(createCouponDto: CreateCouponDto): Promise<CouponEntity> {
    // Check if coupon code already exists
    const existingCoupon = await this.couponRepository.findOne({
      where: { code: createCouponDto.code },
    });

    if (existingCoupon) {
      throw ErrorResponseUtil.conflict(
        'Coupon code already exists',
        ErrorCodes.RESOURCE_CONFLICT,
      );
    }

    // Validate dates
    const validFrom = new Date(createCouponDto.validFrom);
    const validTo = new Date(createCouponDto.validTo);

    if (validFrom >= validTo) {
      throw ErrorResponseUtil.badRequest(
        'Valid from date must be before valid to date',
        ErrorCodes.INVALID_INPUT,
      );
    }

    // Validate percentage coupon
    if (
      createCouponDto.type === CouponType.PERCENTAGE &&
      createCouponDto.value > 100
    ) {
      throw ErrorResponseUtil.badRequest(
        'Percentage discount cannot exceed 100%',
        ErrorCodes.INVALID_INPUT,
      );
    }

    // Validate partner-specific coupon
    if (
      createCouponDto.scope === CouponScope.PARTNER_SPECIFIC &&
      !createCouponDto.partnerId
    ) {
      throw ErrorResponseUtil.badRequest(
        'Partner ID is required for partner-specific coupons',
        ErrorCodes.INVALID_INPUT,
      );
    }

    const coupon = this.couponRepository.create({
      ...createCouponDto,
      validFrom,
      validTo,
      usageCount: 0,
    });

    return await this.couponRepository.save(coupon);
  }

  async findAll(
    query: CouponQueryDto,
  ): Promise<OffsetPaginatedDto<CouponEntity>> {
    const {
      page = 1,
      limit = 10,
      status,
      scope,
      type,
      partnerId,
      search,
      validFrom,
      validTo,
      activeOnly,
    } = query;
    const skip = (page - 1) * limit;

    const whereConditions: any = {};

    if (status) {
      whereConditions.status = status;
    }

    if (scope) {
      whereConditions.scope = scope;
    }

    if (type) {
      whereConditions.type = type;
    }

    if (partnerId) {
      whereConditions.partnerId = partnerId;
    }

    if (search) {
      whereConditions.code = Like(`%${search}%`);
    }

    if (validFrom) {
      whereConditions.validFrom = MoreThanOrEqual(new Date(validFrom));
    }

    if (validTo) {
      whereConditions.validTo = LessThanOrEqual(new Date(validTo));
    }

    if (activeOnly) {
      const now = new Date();
      whereConditions.status = CouponStatus.ACTIVE;
      whereConditions.validFrom = LessThanOrEqual(now);
      whereConditions.validTo = MoreThanOrEqual(now);
    }

    const options: FindManyOptions<CouponEntity> = {
      where: whereConditions,
      skip,
      take: limit,
      order: { createdAt: 'DESC' },
      relations: ['partner'],
    };

    const [items, total] = await this.couponRepository.findAndCount(options);

    const pageOptions = Object.assign(new PageOptionsDto(), { page, limit });

    const pagination = new OffsetPaginationDto(total, pageOptions);
    return new OffsetPaginatedDto(items, pagination);
  }

  async findOne(id: string): Promise<CouponEntity> {
    const coupon = await this.couponRepository.findOne({
      where: { id },
      relations: ['partner', 'bookings'],
    });

    if (!coupon) {
      throw ErrorResponseUtil.notFound('Coupon', id);
    }

    return coupon;
  }

  async findByCode(code: string): Promise<CouponEntity> {
    const coupon = await this.couponRepository.findOne({
      where: { code },
      relations: ['partner'],
    });

    if (!coupon) {
      throw ErrorResponseUtil.notFound('Coupon', code);
    }

    return coupon;
  }

  async update(
    id: string,
    updateCouponDto: UpdateCouponDto,
  ): Promise<CouponEntity> {
    const coupon = await this.findOne(id);

    // Validate dates if provided
    if (updateCouponDto.validFrom || updateCouponDto.validTo) {
      const validFrom = updateCouponDto.validFrom
        ? new Date(updateCouponDto.validFrom)
        : coupon.validFrom;
      const validTo = updateCouponDto.validTo
        ? new Date(updateCouponDto.validTo)
        : coupon.validTo;

      if (validFrom >= validTo) {
        throw ErrorResponseUtil.badRequest(
          'Valid from date must be before valid to date',
          ErrorCodes.INVALID_INPUT,
        );
      }
    }

    // Validate percentage coupon
    if (
      updateCouponDto.type === CouponType.PERCENTAGE &&
      updateCouponDto.value &&
      updateCouponDto.value > 100
    ) {
      throw ErrorResponseUtil.badRequest(
        'Percentage discount cannot exceed 100%',
        ErrorCodes.INVALID_INPUT,
      );
    }

    // Validate partner-specific coupon
    if (
      updateCouponDto.scope === CouponScope.PARTNER_SPECIFIC &&
      !updateCouponDto.partnerId &&
      !coupon.partnerId
    ) {
      throw ErrorResponseUtil.badRequest(
        'Partner ID is required for partner-specific coupons',
        ErrorCodes.INVALID_INPUT,
      );
    }

    Object.assign(coupon, updateCouponDto);
    return await this.couponRepository.save(coupon);
  }

  async remove(id: string): Promise<void> {
    const coupon = await this.findOne(id);
    await this.couponRepository.remove(coupon);
  }

  async validateCoupon(validateDto: ValidateCouponDto): Promise<{
    valid: boolean;
    coupon?: CouponEntity;
    discountAmount?: number;
    message?: string;
  }> {
    const { code, orderAmount = 0, userId, partnerId } = validateDto;

    try {
      const coupon = await this.findByCode(code);
      const now = new Date();

      // Check if coupon is active
      if (coupon.status !== CouponStatus.ACTIVE) {
        return { valid: false, message: 'Coupon is not active' };
      }

      // Check validity dates
      if (now < coupon.validFrom || now > coupon.validTo) {
        return {
          valid: false,
          message: 'Coupon has expired or is not yet valid',
        };
      }

      // Check usage limit
      if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) {
        return { valid: false, message: 'Coupon usage limit exceeded' };
      }

      // Check minimum order value
      if (coupon.minOrderValue && orderAmount < coupon.minOrderValue) {
        return {
          valid: false,
          message: `Minimum order value of ${coupon.minOrderValue} required`,
        };
      }

      // Check scope
      if (
        coupon.scope === CouponScope.PARTNER_SPECIFIC &&
        coupon.partnerId !== partnerId
      ) {
        return {
          valid: false,
          message: 'Coupon is not valid for this partner',
        };
      }

      // Check user usage limit
      if (userId && coupon.userUsageLimit) {
        const userUsageCount = await this.bookingRepository.count({
          where: { userId, couponId: coupon.id },
        });

        if (userUsageCount >= coupon.userUsageLimit) {
          return {
            valid: false,
            message: 'User usage limit exceeded for this coupon',
          };
        }
      }

      // Calculate discount amount
      let discountAmount = 0;
      if (coupon.type === CouponType.PERCENTAGE) {
        discountAmount = (orderAmount * coupon.value) / 100;
        if (
          coupon.maxDiscountAmount &&
          discountAmount > coupon.maxDiscountAmount
        ) {
          discountAmount = coupon.maxDiscountAmount;
        }
      } else {
        discountAmount = coupon.value;
      }

      return {
        valid: true,
        coupon,
        discountAmount: Math.min(discountAmount, orderAmount),
      };
    } catch (error) {
      return { valid: false, message: 'Invalid coupon code' };
    }
  }

  async applyCoupon(usageDto: CouponUsageDto): Promise<CouponEntity> {
    const validation = await this.validateCoupon({
      code: usageDto.code,
      orderAmount: usageDto.orderAmount,
      userId: usageDto.userId,
    });

    if (!validation.valid || !validation.coupon) {
      throw ErrorResponseUtil.badRequest(
        validation.message || 'Invalid coupon',
        ErrorCodes.INVALID_INPUT,
      );
    }

    // Update coupon usage count
    validation.coupon.usageCount += 1;
    await this.couponRepository.save(validation.coupon);

    return validation.coupon;
  }

  async getCouponStats(id: string): Promise<{
    totalUsage: number;
    remainingUsage: number;
    userUsageBreakdown: Array<{ userId: string; usageCount: number }>;
    revenueImpact: number;
  }> {
    const coupon = await this.findOne(id);

    const bookings = await this.bookingRepository.find({
      where: { couponId: id },
      relations: ['user'],
    });

    const totalUsage = bookings.length;
    const remainingUsage = coupon.usageLimit
      ? coupon.usageLimit - totalUsage
      : null;

    // Calculate user usage breakdown
    const userUsageMap = new Map<string, number>();
    let totalRevenue = 0;

    bookings.forEach((booking) => {
      const count = userUsageMap.get(booking.userId) || 0;
      userUsageMap.set(booking.userId, count + 1);
      totalRevenue += booking.discountAmount;
    });

    const userUsageBreakdown = Array.from(userUsageMap.entries()).map(
      ([userId, usageCount]) => ({
        userId,
        usageCount,
      }),
    );

    return {
      totalUsage,
      remainingUsage,
      userUsageBreakdown,
      revenueImpact: totalRevenue,
    };
  }

  async deactivateCoupon(id: string): Promise<CouponEntity> {
    const coupon = await this.findOne(id);
    coupon.status = CouponStatus.INACTIVE;
    return await this.couponRepository.save(coupon);
  }

  async activateCoupon(id: string): Promise<CouponEntity> {
    const coupon = await this.findOne(id);
    coupon.status = CouponStatus.ACTIVE;
    return await this.couponRepository.save(coupon);
  }

  // Simplified validation method for booking service
  async validateCouponForBooking(
    code: string,
    userId: string,
    orderAmount: number,
  ): Promise<CouponEntity> {
    const validation = await this.validateCoupon({
      code,
      userId,
      orderAmount,
    });

    if (!validation.valid || !validation.coupon) {
      throw ErrorResponseUtil.badRequest(
        validation.message || 'Invalid coupon',
        ErrorCodes.INVALID_INPUT,
      );
    }

    return validation.coupon;
  }

  // Method to increment coupon usage
  async incrementUsage(couponId: string, userId: string): Promise<void> {
    const coupon = await this.findOne(couponId);
    coupon.usageCount += 1;
    await this.couponRepository.save(coupon);
  }

  // Atomic method to apply coupon with transaction safety
  async applyCouponAtomic(
    code: string,
    userId: string,
    orderAmount: number,
  ): Promise<{
    coupon: CouponEntity;
    discountAmount: number;
  }> {
    return await this.dataSource.transaction(async (manager) => {
      // Lock the coupon row for update to prevent race conditions
      const coupon = await manager.findOne(CouponEntity, {
        where: { code },
        lock: { mode: 'pessimistic_write' },
      });

      if (!coupon) {
        throw ErrorResponseUtil.badRequest(
          'Invalid coupon code',
          ErrorCodes.INVALID_INPUT,
        );
      }

      const now = new Date();

      // Check if coupon is active
      if (coupon.status !== CouponStatus.ACTIVE) {
        throw ErrorResponseUtil.badRequest(
          'Coupon is not active',
          ErrorCodes.INVALID_STATUS,
        );
      }

      // Check validity dates
      if (now < coupon.validFrom || now > coupon.validTo) {
        throw ErrorResponseUtil.badRequest(
          'Coupon has expired or is not yet valid',
          ErrorCodes.INVALID_STATUS,
        );
      }

      // Check usage limit
      if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) {
        throw ErrorResponseUtil.badRequest(
          'Coupon usage limit exceeded',
          ErrorCodes.INVALID_STATUS,
        );
      }

      // Check minimum order value
      if (coupon.minOrderValue && orderAmount < coupon.minOrderValue) {
        throw ErrorResponseUtil.badRequest(
          `Minimum order value of ${coupon.minOrderValue} required`,
          ErrorCodes.INVALID_INPUT,
        );
      }

      // Check user usage limit
      if (userId && coupon.userUsageLimit) {
        const userUsageCount = await manager.count(BookingEntity, {
          where: { userId, couponId: coupon.id },
        });

        if (userUsageCount >= coupon.userUsageLimit) {
          throw ErrorResponseUtil.badRequest(
            'User usage limit exceeded for this coupon',
            ErrorCodes.INVALID_STATUS,
          );
        }
      }

      // Calculate discount amount
      let discountAmount = 0;
      if (coupon.type === CouponType.PERCENTAGE) {
        discountAmount = (orderAmount * coupon.value) / 100;
        if (
          coupon.maxDiscountAmount &&
          discountAmount > coupon.maxDiscountAmount
        ) {
          discountAmount = coupon.maxDiscountAmount;
        }
      } else {
        discountAmount = coupon.value;
      }

      discountAmount = Math.min(discountAmount, orderAmount);

      // Increment usage count atomically
      coupon.usageCount += 1;
      await manager.save(CouponEntity, coupon);

      return {
        coupon,
        discountAmount,
      };
    });
  }

  // Method to check if coupon usage limits are enforced properly
  async validateUsageLimits(couponId: string): Promise<{
    isValid: boolean;
    totalUsage: number;
    usageLimit: number | null;
    userUsageBreakdown: Array<{
      userId: string;
      usageCount: number;
      limit: number | null;
    }>;
  }> {
    const coupon = await this.findOne(couponId);
    const bookings = await this.bookingRepository.find({
      where: { couponId },
      select: ['userId'],
    });

    const totalUsage = bookings.length;
    const userUsageMap = new Map<string, number>();

    bookings.forEach((booking) => {
      const count = userUsageMap.get(booking.userId) || 0;
      userUsageMap.set(booking.userId, count + 1);
    });

    const userUsageBreakdown = Array.from(userUsageMap.entries()).map(
      ([userId, usageCount]) => ({
        userId,
        usageCount,
        limit: coupon.userUsageLimit,
      }),
    );

    const isValid =
      (!coupon.usageLimit || totalUsage <= coupon.usageLimit) &&
      (!coupon.userUsageLimit ||
        userUsageBreakdown.every((user) => user.usageCount <= user.limit!));

    return {
      isValid,
      totalUsage,
      usageLimit: coupon.usageLimit,
      userUsageBreakdown,
    };
  }
}
