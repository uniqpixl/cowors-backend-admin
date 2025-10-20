import { BookingEntity } from '@/database/entities/booking.entity';
import {
  DayOfWeek,
  DynamicPricingEntity,
  PricingRuleType,
} from '@/database/entities/dynamic-pricing.entity';
import { SpaceEntity } from '@/database/entities/space.entity';
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

export interface PricingCalculationRequest {
  spaceId: string;
  startDateTime: Date;
  endDateTime: Date;
  basePrice: number;
  bookingDuration: number; // in hours
}

export interface PricingCalculationResult {
  originalPrice: number;
  finalPrice: number;
  totalDiscount: number;
  totalSurcharge: number;
  appliedRules: {
    ruleId: string;
    ruleName: string;
    ruleType: PricingRuleType;
    multiplier: number;
    priceImpact: number;
    description?: string;
  }[];
  breakdown: {
    basePrice: number;
    peakHoursSurcharge?: number;
    seasonalAdjustment?: number;
    demandSurcharge?: number;
    bulkDiscount?: number;
    specialEventSurcharge?: number;
  };
}

@Injectable()
export class DynamicPricingService {
  private readonly logger = new Logger(DynamicPricingService.name);

  constructor(
    @InjectRepository(DynamicPricingEntity)
    private readonly dynamicPricingRepository: Repository<DynamicPricingEntity>,
    @InjectRepository(SpaceEntity)
    private readonly spaceRepository: Repository<SpaceEntity>,
    @InjectRepository(BookingEntity)
    private readonly bookingRepository: Repository<BookingEntity>,
  ) {}

  async calculateDynamicPrice(
    request: PricingCalculationRequest,
  ): Promise<PricingCalculationResult> {
    const { spaceId, startDateTime, endDateTime, basePrice, bookingDuration } =
      request;

    // Get space details
    const space = await this.spaceRepository.findOne({
      where: { id: spaceId },
      relations: ['partner'],
    });

    if (!space) {
      throw new Error('Space not found');
    }

    // Get applicable pricing rules
    const applicableRules = await this.getApplicablePricingRules(
      space.listing?.partner?.id,
      spaceId,
      startDateTime,
      endDateTime,
      bookingDuration,
    );

    // Calculate price with all applicable rules
    const result = await this.applyPricingRules(
      basePrice,
      applicableRules,
      request,
    );

    this.logger.debug(
      `Dynamic pricing calculated for space ${spaceId}: ${basePrice} -> ${result.finalPrice}`,
    );

    return result;
  }

  private async getApplicablePricingRules(
    partnerId: string,
    spaceId: string,
    startDateTime: Date,
    endDateTime: Date,
    bookingDuration: number,
  ): Promise<DynamicPricingEntity[]> {
    const now = new Date();

    // Get all active pricing rules for the partner and space
    const queryBuilder = this.dynamicPricingRepository
      .createQueryBuilder('pricing')
      .where('pricing.partnerId = :partnerId', { partnerId })
      .andWhere('pricing.isActive = :isActive', { isActive: true })
      .andWhere('(pricing.validFrom IS NULL OR pricing.validFrom <= :now)', {
        now,
      })
      .andWhere('(pricing.validUntil IS NULL OR pricing.validUntil >= :now)', {
        now,
      })
      .andWhere('(pricing.spaceId IS NULL OR pricing.spaceId = :spaceId)', {
        spaceId,
      })
      .orderBy('pricing.priority', 'DESC')
      .addOrderBy('pricing.createdAt', 'ASC');

    const allRules = await queryBuilder.getMany();

    // Filter rules based on conditions
    const applicableRules: DynamicPricingEntity[] = [];

    for (const rule of allRules) {
      if (
        await this.isRuleApplicable(
          rule,
          startDateTime,
          endDateTime,
          bookingDuration,
        )
      ) {
        applicableRules.push(rule);
      }
    }

    return applicableRules;
  }

  private async isRuleApplicable(
    rule: DynamicPricingEntity,
    startDateTime: Date,
    endDateTime: Date,
    bookingDuration: number,
  ): Promise<boolean> {
    const conditions = rule.conditions;

    switch (rule.ruleType) {
      case PricingRuleType.PEAK_HOURS:
        return this.isPeakHoursApplicable(
          conditions.peakHours,
          startDateTime,
          endDateTime,
        );

      case PricingRuleType.SEASONAL:
        return this.isSeasonalApplicable(
          conditions.dateRanges,
          startDateTime,
          endDateTime,
        );

      case PricingRuleType.DEMAND_BASED:
        return await this.isDemandBasedApplicable(
          rule.spaceId,
          conditions.demandThresholds,
          startDateTime,
          endDateTime,
        );

      case PricingRuleType.BULK_DISCOUNT:
        return this.isBulkDiscountApplicable(
          conditions.durationThresholds,
          bookingDuration,
        );

      case PricingRuleType.SPECIAL_EVENT:
        return this.isSpecialEventApplicable(
          conditions.dateRanges,
          startDateTime,
          endDateTime,
        );

      default:
        return false;
    }
  }

  private isPeakHoursApplicable(
    peakHours: any[],
    startDateTime: Date,
    endDateTime: Date,
  ): boolean {
    if (!peakHours || peakHours.length === 0) return false;

    for (const peak of peakHours) {
      const dayOfWeek = startDateTime.getDay();

      if (!peak.daysOfWeek.includes(dayOfWeek)) continue;

      const startTime = this.parseTime(peak.startTime);
      const endTime = this.parseTime(peak.endTime);
      const bookingStartTime =
        startDateTime.getHours() * 60 + startDateTime.getMinutes();
      const bookingEndTime =
        endDateTime.getHours() * 60 + endDateTime.getMinutes();

      // Check if booking overlaps with peak hours
      if (
        this.timeRangesOverlap(
          bookingStartTime,
          bookingEndTime,
          startTime,
          endTime,
        )
      ) {
        return true;
      }
    }

    return false;
  }

  private isSeasonalApplicable(
    dateRanges: any[],
    startDateTime: Date,
    endDateTime: Date,
  ): boolean {
    if (!dateRanges || dateRanges.length === 0) return false;

    const startDate = startDateTime.toISOString().split('T')[0];
    const endDate = endDateTime.toISOString().split('T')[0];

    for (const range of dateRanges) {
      if (startDate <= range.endDate && endDate >= range.startDate) {
        return true;
      }
    }

    return false;
  }

  private async isDemandBasedApplicable(
    spaceId: string,
    demandThresholds: any[],
    startDateTime: Date,
    endDateTime: Date,
  ): Promise<boolean> {
    if (!demandThresholds || demandThresholds.length === 0) return false;

    // Calculate current occupancy for the time period
    const occupancyPercentage = await this.calculateOccupancyPercentage(
      spaceId,
      startDateTime,
      endDateTime,
    );

    for (const threshold of demandThresholds) {
      if (occupancyPercentage >= threshold.occupancyPercentage) {
        return true;
      }
    }

    return false;
  }

  private isBulkDiscountApplicable(
    durationThresholds: any[],
    bookingDuration: number,
  ): boolean {
    if (!durationThresholds || durationThresholds.length === 0) return false;

    for (const threshold of durationThresholds) {
      if (
        bookingDuration >= threshold.minHours &&
        (!threshold.maxHours || bookingDuration <= threshold.maxHours)
      ) {
        return true;
      }
    }

    return false;
  }

  private isSpecialEventApplicable(
    dateRanges: any[],
    startDateTime: Date,
    endDateTime: Date,
  ): boolean {
    return this.isSeasonalApplicable(dateRanges, startDateTime, endDateTime);
  }

  private async applyPricingRules(
    basePrice: number,
    rules: DynamicPricingEntity[],
    request: PricingCalculationRequest,
  ): Promise<PricingCalculationResult> {
    let currentPrice = basePrice;
    const appliedRules: any[] = [];
    const breakdown: any = { basePrice };

    let totalDiscount = 0;
    let totalSurcharge = 0;

    for (const rule of rules) {
      const priceBeforeRule = currentPrice;
      const adjustment = currentPrice * (rule.multiplier - 1);
      currentPrice = currentPrice * rule.multiplier;

      const priceImpact = currentPrice - priceBeforeRule;

      appliedRules.push({
        ruleId: rule.id,
        ruleName: rule.name,
        ruleType: rule.ruleType,
        multiplier: rule.multiplier,
        priceImpact,
        description: rule.description,
      });

      // Update breakdown
      switch (rule.ruleType) {
        case PricingRuleType.PEAK_HOURS:
          breakdown.peakHoursSurcharge =
            (breakdown.peakHoursSurcharge || 0) + adjustment;
          break;
        case PricingRuleType.SEASONAL:
          breakdown.seasonalAdjustment =
            (breakdown.seasonalAdjustment || 0) + adjustment;
          break;
        case PricingRuleType.DEMAND_BASED:
          breakdown.demandSurcharge =
            (breakdown.demandSurcharge || 0) + adjustment;
          break;
        case PricingRuleType.BULK_DISCOUNT:
          breakdown.bulkDiscount = (breakdown.bulkDiscount || 0) + adjustment;
          break;
        case PricingRuleType.SPECIAL_EVENT:
          breakdown.specialEventSurcharge =
            (breakdown.specialEventSurcharge || 0) + adjustment;
          break;
      }

      if (adjustment > 0) {
        totalSurcharge += adjustment;
      } else {
        totalDiscount += Math.abs(adjustment);
      }
    }

    return {
      originalPrice: basePrice,
      finalPrice: Math.round(currentPrice * 100) / 100, // Round to 2 decimal places
      totalDiscount,
      totalSurcharge,
      appliedRules,
      breakdown,
    };
  }

  private async calculateOccupancyPercentage(
    spaceId: string,
    startDateTime: Date,
    endDateTime: Date,
  ): Promise<number> {
    // Get total bookings for the space in the given time period
    const bookingCount = await this.bookingRepository
      .createQueryBuilder('booking')
      .innerJoin('booking.spaceOption', 'spaceOption')
      .where('spaceOption.spaceId = :spaceId', { spaceId })
      .andWhere('booking.startDateTime < :endDateTime', { endDateTime })
      .andWhere('booking.endDateTime > :startDateTime', { startDateTime })
      .andWhere('booking.status IN (:...statuses)', {
        statuses: ['confirmed', 'checked_in', 'completed'],
      })
      .getCount();

    // For simplicity, assume 100% occupancy = 10 bookings per day
    // This should be configurable based on space capacity and business rules
    const maxBookingsPerDay = 10;
    const occupancyPercentage = Math.min(
      (bookingCount / maxBookingsPerDay) * 100,
      100,
    );

    return occupancyPercentage;
  }

  private parseTime(timeString: string): number {
    const [hours, minutes] = timeString.split(':').map(Number);
    return hours * 60 + minutes;
  }

  private timeRangesOverlap(
    start1: number,
    end1: number,
    start2: number,
    end2: number,
  ): boolean {
    return start1 < end2 && end1 > start2;
  }

  // Partner management methods
  async createPricingRule(
    partnerId: string,
    ruleData: Partial<DynamicPricingEntity>,
  ): Promise<DynamicPricingEntity> {
    const rule = this.dynamicPricingRepository.create({
      ...ruleData,
      partnerId,
    });

    return await this.dynamicPricingRepository.save(rule);
  }

  async updatePricingRule(
    ruleId: string,
    updateData: Partial<DynamicPricingEntity>,
    partnerId?: string,
  ): Promise<DynamicPricingEntity> {
    const whereCondition = partnerId
      ? { id: ruleId, partnerId }
      : { id: ruleId };

    await this.dynamicPricingRepository.update(whereCondition, updateData);

    const updatedRule = await this.dynamicPricingRepository.findOne({
      where: whereCondition,
    });

    if (!updatedRule) {
      throw new Error('Pricing rule not found');
    }

    return updatedRule;
  }

  async deletePricingRule(ruleId: string, partnerId: string): Promise<void> {
    await this.dynamicPricingRepository.softDelete({ id: ruleId, partnerId });
  }

  async getPartnerPricingRules(
    partnerId: string,
  ): Promise<DynamicPricingEntity[]> {
    return await this.dynamicPricingRepository.find({
      where: { partnerId },
      order: { priority: 'DESC', createdAt: 'ASC' },
    });
  }

  // Alias methods for controller compatibility
  async getPricingRules(
    partnerId: string,
    filters?: { spaceId?: string; isActive?: boolean },
    pagination?: { page?: number; limit?: number },
  ): Promise<{ data: DynamicPricingEntity[]; pagination: any }> {
    const queryBuilder = this.dynamicPricingRepository
      .createQueryBuilder('rule')
      .where('rule.partnerId = :partnerId', { partnerId })
      .orderBy('rule.priority', 'DESC')
      .addOrderBy('rule.createdAt', 'ASC');

    if (filters?.spaceId) {
      queryBuilder.andWhere('rule.spaceId = :spaceId', {
        spaceId: filters.spaceId,
      });
    }

    if (filters?.isActive !== undefined) {
      queryBuilder.andWhere('rule.isActive = :isActive', {
        isActive: filters.isActive,
      });
    }

    const page = pagination?.page || 1;
    const limit = pagination?.limit || 10;
    const skip = (page - 1) * limit;

    const [data, total] = await queryBuilder
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    const totalPages = Math.ceil(total / limit);

    return {
      data,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems: total,
        limit,
        hasPreviousPage: page > 1,
        hasNextPage: page < totalPages,
      },
    };
  }

  async getPricingRule(
    ruleId: string,
    partnerId: string,
  ): Promise<DynamicPricingEntity> {
    const rule = await this.dynamicPricingRepository.findOne({
      where: { id: ruleId, partnerId },
    });

    if (!rule) {
      throw new Error('Pricing rule not found');
    }

    return rule;
  }
}
