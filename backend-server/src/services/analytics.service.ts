import { PartnerStatus } from '@/common/enums/partner.enum';
import { SpaceStatus } from '@/common/enums/space.enum';
import { KycStatus } from '@/database/entities/kyc-verification.entity';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Cache } from 'cache-manager';
import { Repository } from 'typeorm';

import { UserEntity } from '@/auth/entities/user.entity';
import { BookingEntity } from '@/database/entities/booking.entity';
import { KycVerificationEntity } from '@/database/entities/kyc-verification.entity';
import { PartnerEntity } from '@/database/entities/partner.entity';
import { PaymentEntity } from '@/database/entities/payment.entity';
import { SpaceEntity } from '@/database/entities/space.entity';

export interface DashboardKPIs {
  totalUsers: number;
  activeSpaces: number;
  totalBookings: number;
  platformRevenue: number;
  activePartners: number;
  pendingVerifications: number;
  recentActivity: {
    newUsers: number;
    newBookings: number;
    newPartners: number;
  };
  growthMetrics: {
    userGrowth: number;
    revenueGrowth: number;
    bookingGrowth: number;
  };
}

export interface TimeSeriesDataPoint {
  date: string;
  value: number;
}

export interface BookingTrendsData {
  data: TimeSeriesDataPoint[];
  metadata: {
    total: number;
    average: number;
    growthRate: number;
    period: string;
  };
}

export interface RevenueTrendsData {
  data: TimeSeriesDataPoint[];
  metadata: {
    total: number;
    average: number;
    growthRate: number;
    period: string;
  };
}

export interface UserGrowthData {
  data: TimeSeriesDataPoint[];
  metadata: {
    total: number;
    average: number;
    growthRate: number;
    period: string;
  };
}

export interface SpaceUtilizationData {
  data: TimeSeriesDataPoint[];
  metadata: {
    averageUtilization: number;
    totalSpaces: number;
    activeSpaces: number;
    period: string;
  };
}

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    @InjectRepository(BookingEntity)
    private readonly bookingRepository: Repository<BookingEntity>,
    @InjectRepository(SpaceEntity)
    private readonly spaceRepository: Repository<SpaceEntity>,
    @InjectRepository(PartnerEntity)
    private readonly partnerRepository: Repository<PartnerEntity>,
    @InjectRepository(PaymentEntity)
    private readonly paymentRepository: Repository<PaymentEntity>,
    @InjectRepository(KycVerificationEntity)
    private readonly kycRepository: Repository<KycVerificationEntity>,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async getDashboardKPIs(): Promise<DashboardKPIs> {
    const cacheKey = 'dashboard-kpis';
    const cached = await this.cacheManager.get<DashboardKPIs>(cacheKey);
    if (cached) {
      return cached;
    }

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

    // Current metrics
    const totalUsers = await this.userRepository.count();
    const activeSpaces = await this.spaceRepository.count({
      where: { status: SpaceStatus.ACTIVE },
    });
    const totalBookings = await this.bookingRepository.count();
    const platformRevenue = await this.calculateTotalRevenue();
    const activePartners = await this.partnerRepository.count({
      where: { status: PartnerStatus.ACTIVE },
    });
    const pendingVerifications = await this.kycRepository.count({
      where: { status: KycStatus.PENDING },
    });

    // Recent activity (last 30 days)
    const newUsers = await this.userRepository.count({
      where: {
        createdAt: new Date(thirtyDaysAgo.getTime()),
      },
    });
    const newBookings = await this.bookingRepository.count({
      where: {
        createdAt: new Date(thirtyDaysAgo.getTime()),
      },
    });
    const newPartners = await this.partnerRepository.count({
      where: {
        createdAt: new Date(thirtyDaysAgo.getTime()),
      },
    });

    // Growth metrics (compare last 30 days vs previous 30 days)
    const previousUsers = await this.userRepository.count({
      where: {
        createdAt: new Date(sixtyDaysAgo.getTime()),
      },
    });
    const previousBookings = await this.bookingRepository.count({
      where: {
        createdAt: new Date(sixtyDaysAgo.getTime()),
      },
    });
    const previousRevenue = await this.calculateRevenueForPeriod(
      sixtyDaysAgo,
      thirtyDaysAgo,
    );
    const currentRevenue = await this.calculateRevenueForPeriod(
      thirtyDaysAgo,
      now,
    );

    const userGrowth = this.calculateGrowthRate(newUsers, previousUsers);
    const bookingGrowth = this.calculateGrowthRate(
      newBookings,
      previousBookings,
    );
    const revenueGrowth = this.calculateGrowthRate(
      currentRevenue,
      previousRevenue,
    );

    const kpis: DashboardKPIs = {
      totalUsers,
      activeSpaces,
      totalBookings,
      platformRevenue,
      activePartners,
      pendingVerifications,
      recentActivity: {
        newUsers,
        newBookings,
        newPartners,
      },
      growthMetrics: {
        userGrowth,
        revenueGrowth,
        bookingGrowth,
      },
    };

    // Cache for 5 minutes
    await this.cacheManager.set(cacheKey, kpis, 300000);
    return kpis;
  }

  async getBookingTrends(
    period?: 'day' | 'week' | 'month' | 'year',
    startDate?: Date,
    endDate?: Date,
    granularity?: 'hour' | 'day' | 'week' | 'month',
  ): Promise<BookingTrendsData> {
    const { start, end } = this.getDateRange(period, startDate, endDate);
    const gran = granularity || this.getDefaultGranularity(period);

    const cacheKey = `booking-trends-${period || 'custom'}-${gran}-${start.getTime()}-${end.getTime()}`;
    const cached = await this.cacheManager.get<BookingTrendsData>(cacheKey);
    if (cached) {
      return cached;
    }

    const bookings = await this.bookingRepository
      .createQueryBuilder('booking')
      .where('booking.createdAt >= :start', { start })
      .andWhere('booking.createdAt <= :end', { end })
      .orderBy('booking.createdAt', 'ASC')
      .getMany();

    const data = this.aggregateDataByPeriod(
      bookings,
      gran,
      start,
      end,
      'count',
    );
    const total = bookings.length;
    const average = data.length > 0 ? total / data.length : 0;
    const growthRate = await this.calculateBookingGrowthRate(
      start,
      end,
      period,
    );

    const result: BookingTrendsData = {
      data,
      metadata: {
        total,
        average,
        growthRate,
        period: period || 'custom',
      },
    };

    // Cache for 10 minutes
    await this.cacheManager.set(cacheKey, result, 600000);
    return result;
  }

  async getRevenueTrends(
    period?: 'day' | 'week' | 'month' | 'year',
    startDate?: Date,
    endDate?: Date,
    granularity?: 'hour' | 'day' | 'week' | 'month',
  ): Promise<RevenueTrendsData> {
    const { start, end } = this.getDateRange(period, startDate, endDate);
    const gran = granularity || this.getDefaultGranularity(period);

    const cacheKey = `revenue-trends-${period || 'custom'}-${gran}-${start.getTime()}-${end.getTime()}`;
    const cached = await this.cacheManager.get<RevenueTrendsData>(cacheKey);
    if (cached) {
      return cached;
    }

    const payments = await this.paymentRepository
      .createQueryBuilder('payment')
      .where('payment.createdAt >= :start', { start })
      .andWhere('payment.createdAt <= :end', { end })
      .andWhere('payment.status = :status', { status: 'completed' })
      .orderBy('payment.createdAt', 'ASC')
      .getMany();

    const data = this.aggregateDataByPeriod(
      payments,
      gran,
      start,
      end,
      'revenue',
    );
    const total = payments.reduce(
      (sum, payment) => sum + Number(payment.amount),
      0,
    );
    const average = data.length > 0 ? total / data.length : 0;
    const growthRate = await this.calculateRevenueGrowthRate(
      start,
      end,
      period,
    );

    const result: RevenueTrendsData = {
      data,
      metadata: {
        total,
        average,
        growthRate,
        period: period || 'custom',
      },
    };

    // Cache for 10 minutes
    await this.cacheManager.set(cacheKey, result, 600000);
    return result;
  }

  async getUserGrowth(
    period?: 'day' | 'week' | 'month' | 'year',
    startDate?: Date,
    endDate?: Date,
    granularity?: 'hour' | 'day' | 'week' | 'month',
  ): Promise<UserGrowthData> {
    const { start, end } = this.getDateRange(period, startDate, endDate);
    const gran = granularity || this.getDefaultGranularity(period);

    const cacheKey = `user-growth-${period || 'custom'}-${gran}-${start.getTime()}-${end.getTime()}`;
    const cached = await this.cacheManager.get<UserGrowthData>(cacheKey);
    if (cached) {
      return cached;
    }

    const users = await this.userRepository
      .createQueryBuilder('user')
      .where('user.createdAt >= :start', { start })
      .andWhere('user.createdAt <= :end', { end })
      .orderBy('user.createdAt', 'ASC')
      .getMany();

    const data = this.aggregateDataByPeriod(users, gran, start, end, 'count');
    const total = users.length;
    const average = data.length > 0 ? total / data.length : 0;
    const growthRate = await this.calculateUserGrowthRate(start, end, period);

    const result: UserGrowthData = {
      data,
      metadata: {
        total,
        average,
        growthRate,
        period: period || 'custom',
      },
    };

    // Cache for 10 minutes
    await this.cacheManager.set(cacheKey, result, 600000);
    return result;
  }

  async getSpaceUtilization(
    period?: 'day' | 'week' | 'month' | 'year',
    startDate?: Date,
    endDate?: Date,
    granularity?: 'hour' | 'day' | 'week' | 'month',
  ): Promise<SpaceUtilizationData> {
    const { start, end } = this.getDateRange(period, startDate, endDate);
    const gran = granularity || this.getDefaultGranularity(period);

    const cacheKey = `space-utilization-${period || 'custom'}-${gran}-${start.getTime()}-${end.getTime()}`;
    const cached = await this.cacheManager.get<SpaceUtilizationData>(cacheKey);
    if (cached) {
      return cached;
    }

    const bookings = await this.bookingRepository
      .createQueryBuilder('booking')
      .leftJoinAndSelect('booking.space', 'space')
      .where('booking.createdAt >= :start', { start })
      .andWhere('booking.createdAt <= :end', { end })
      .orderBy('booking.createdAt', 'ASC')
      .getMany();

    const totalSpaces = await this.spaceRepository.count();
    const activeSpaces = await this.spaceRepository.count({
      where: { status: SpaceStatus.ACTIVE },
    });

    // Calculate utilization rate for each time period
    const data = this.aggregateUtilizationByPeriod(
      bookings,
      gran,
      start,
      end,
      totalSpaces,
    );
    const averageUtilization =
      data.length > 0
        ? data.reduce((sum, point) => sum + point.value, 0) / data.length
        : 0;

    const result: SpaceUtilizationData = {
      data,
      metadata: {
        averageUtilization,
        totalSpaces,
        activeSpaces,
        period: period || 'custom',
      },
    };

    // Cache for 10 minutes
    await this.cacheManager.set(cacheKey, result, 600000);
    return result;
  }

  private getDateRange(
    period?: 'day' | 'week' | 'month' | 'year',
    startDate?: Date,
    endDate?: Date,
  ): { start: Date; end: Date } {
    const now = new Date();

    if (startDate && endDate) {
      return { start: startDate, end: endDate };
    }

    switch (period) {
      case 'day':
        return {
          start: new Date(now.getTime() - 24 * 60 * 60 * 1000),
          end: now,
        };
      case 'week':
        return {
          start: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
          end: now,
        };
      case 'month':
        return {
          start: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
          end: now,
        };
      case 'year':
        return {
          start: new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000),
          end: now,
        };
      default:
        return {
          start: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
          end: now,
        };
    }
  }

  private getDefaultGranularity(
    period?: 'day' | 'week' | 'month' | 'year',
  ): 'hour' | 'day' | 'week' | 'month' {
    switch (period) {
      case 'day':
        return 'hour';
      case 'week':
        return 'day';
      case 'month':
        return 'day';
      case 'year':
        return 'month';
      default:
        return 'day';
    }
  }

  private aggregateDataByPeriod(
    data: any[],
    granularity: 'hour' | 'day' | 'week' | 'month',
    start: Date,
    end: Date,
    type: 'count' | 'revenue',
  ): TimeSeriesDataPoint[] {
    const result: TimeSeriesDataPoint[] = [];
    const current = new Date(start);

    while (current <= end) {
      const periodStart = new Date(current);
      const periodEnd = this.getNextPeriod(current, granularity);

      const periodData = data.filter(
        (item) =>
          new Date(item.createdAt) >= periodStart &&
          new Date(item.createdAt) < periodEnd,
      );

      const value =
        type === 'count'
          ? periodData.length
          : periodData.reduce(
              (sum, item) => sum + Number(item.amount || item.totalAmount || 0),
              0,
            );

      result.push({
        date: this.formatDate(periodStart, granularity),
        value,
      });

      current.setTime(periodEnd.getTime());
    }

    return result;
  }

  private aggregateUtilizationByPeriod(
    bookings: any[],
    granularity: 'hour' | 'day' | 'week' | 'month',
    start: Date,
    end: Date,
    totalSpaces: number,
  ): TimeSeriesDataPoint[] {
    const result: TimeSeriesDataPoint[] = [];
    const current = new Date(start);

    while (current <= end) {
      const periodStart = new Date(current);
      const periodEnd = this.getNextPeriod(current, granularity);

      const periodBookings = bookings.filter(
        (booking) =>
          new Date(booking.createdAt) >= periodStart &&
          new Date(booking.createdAt) < periodEnd,
      );

      const uniqueSpaces = new Set(periodBookings.map((b) => b.spaceId)).size;
      const utilizationRate =
        totalSpaces > 0 ? (uniqueSpaces / totalSpaces) * 100 : 0;

      result.push({
        date: this.formatDate(periodStart, granularity),
        value: Math.round(utilizationRate * 100) / 100, // Round to 2 decimal places
      });

      current.setTime(periodEnd.getTime());
    }

    return result;
  }

  private getNextPeriod(
    date: Date,
    granularity: 'hour' | 'day' | 'week' | 'month',
  ): Date {
    const next = new Date(date);

    switch (granularity) {
      case 'hour':
        next.setHours(next.getHours() + 1);
        break;
      case 'day':
        next.setDate(next.getDate() + 1);
        break;
      case 'week':
        next.setDate(next.getDate() + 7);
        break;
      case 'month':
        next.setMonth(next.getMonth() + 1);
        break;
    }

    return next;
  }

  private formatDate(
    date: Date,
    granularity: 'hour' | 'day' | 'week' | 'month',
  ): string {
    switch (granularity) {
      case 'hour':
        return date.toISOString().slice(0, 13) + ':00:00.000Z';
      case 'day':
        return date.toISOString().slice(0, 10);
      case 'week':
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        return weekStart.toISOString().slice(0, 10);
      case 'month':
        return date.toISOString().slice(0, 7);
      default:
        return date.toISOString().slice(0, 10);
    }
  }

  private async calculateTotalRevenue(): Promise<number> {
    const result = await this.paymentRepository
      .createQueryBuilder('payment')
      .select('SUM(payment.amount)', 'total')
      .where('payment.status = :status', { status: 'completed' })
      .getRawOne();

    return Number(result?.total || 0);
  }

  private async calculateRevenueForPeriod(
    start: Date,
    end: Date,
  ): Promise<number> {
    const result = await this.paymentRepository
      .createQueryBuilder('payment')
      .select('SUM(payment.amount)', 'total')
      .where('payment.status = :status', { status: 'completed' })
      .andWhere('payment.createdAt >= :start', { start })
      .andWhere('payment.createdAt <= :end', { end })
      .getRawOne();

    return Number(result?.total || 0);
  }

  private calculateGrowthRate(current: number, previous: number): number {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 100 * 100) / 100;
  }

  private async calculateBookingGrowthRate(
    start: Date,
    end: Date,
    period?: string,
  ): Promise<number> {
    const duration = end.getTime() - start.getTime();
    const previousStart = new Date(start.getTime() - duration);
    const previousEnd = start;

    const currentCount = await this.bookingRepository.count({
      where: {
        createdAt: new Date(start.getTime()),
      },
    });

    const previousCount = await this.bookingRepository.count({
      where: {
        createdAt: new Date(previousStart.getTime()),
      },
    });

    return this.calculateGrowthRate(currentCount, previousCount);
  }

  private async calculateRevenueGrowthRate(
    start: Date,
    end: Date,
    period?: string,
  ): Promise<number> {
    const duration = end.getTime() - start.getTime();
    const previousStart = new Date(start.getTime() - duration);
    const previousEnd = start;

    const currentRevenue = await this.calculateRevenueForPeriod(start, end);
    const previousRevenue = await this.calculateRevenueForPeriod(
      previousStart,
      previousEnd,
    );

    return this.calculateGrowthRate(currentRevenue, previousRevenue);
  }

  private async calculateUserGrowthRate(
    start: Date,
    end: Date,
    period?: string,
  ): Promise<number> {
    const duration = end.getTime() - start.getTime();
    const previousStart = new Date(start.getTime() - duration);
    const previousEnd = start;

    const currentCount = await this.userRepository.count({
      where: {
        createdAt: new Date(start.getTime()),
      },
    });

    const previousCount = await this.userRepository.count({
      where: {
        createdAt: new Date(previousStart.getTime()),
      },
    });

    return this.calculateGrowthRate(currentCount, previousCount);
  }
}
