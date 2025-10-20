import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';

import { UserEntity } from '@/auth/entities/user.entity';
import { PartnerStatus } from '@/common/enums/partner.enum';
import { SpaceStatus } from '@/common/enums/space.enum';
import { BookingEntity } from '@/database/entities/booking.entity';
import { SpaceEntity } from '@/database/entities/space.entity';
import { WalletTransactionEntity } from '@/database/entities/wallet-transaction.entity';

export interface PartnerDashboardAnalytics {
  totalRevenue: number;
  totalBookings: number;
  totalSpaces: number;
  activeSpaces: number;
  averageRating: number;
  revenueGrowth: number;
  bookingGrowth: number;
  topPerformingSpaces: Array<{
    spaceId: string;
    spaceName: string;
    revenue: number;
    bookings: number;
  }>;
}

export interface RevenueAnalytics {
  totalRevenue: number;
  monthlyRevenue: Array<{
    month: string;
    revenue: number;
    bookings: number;
  }>;
  revenueBySpaceType: Array<{
    spaceType: string;
    revenue: number;
    percentage: number;
  }>;
  averageBookingValue: number;
}

export interface BookingAnalytics {
  totalBookings: number;
  completedBookings: number;
  cancelledBookings: number;
  pendingBookings: number;
  bookingTrends: Array<{
    date: string;
    bookings: number;
  }>;
  peakHours: Array<{
    hour: number;
    bookings: number;
  }>;
  averageBookingDuration: number;
}

export interface SpaceAnalytics {
  totalSpaces: number;
  activeSpaces: number;
  spaceUtilization: Array<{
    spaceId: string;
    spaceName: string;
    utilizationRate: number;
    totalBookings: number;
    revenue: number;
  }>;
  spacePerformance: Array<{
    spaceId: string;
    spaceName: string;
    rating: number;
    bookings: number;
    revenue: number;
  }>;
}

export interface CustomerAnalytics {
  totalCustomers: number;
  newCustomers: number;
  returningCustomers: number;
  customerDemographics: Array<{
    ageGroup: string;
    count: number;
    percentage: number;
  }>;
  topCustomers: Array<{
    userId: string;
    userName: string;
    totalBookings: number;
    totalSpent: number;
  }>;
}

@Injectable()
export class PartnerAnalyticsService {
  constructor(
    @InjectRepository(BookingEntity)
    private readonly bookingRepository: Repository<BookingEntity>,
    @InjectRepository(SpaceEntity)
    private readonly spaceRepository: Repository<SpaceEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    @InjectRepository(WalletTransactionEntity)
    private readonly walletTransactionRepository: Repository<WalletTransactionEntity>,
  ) {}

  async getDashboardAnalytics(
    partnerId: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<PartnerDashboardAnalytics> {
    const dateFilter = this.buildDateFilter(startDate, endDate);

    // Get partner's spaces
    const spaces = await this.spaceRepository.find({
      where: {
        listing: {
          partner: {
            id: partnerId,
          },
        },
      },
      relations: ['listing', 'listing.partner'],
    });

    const spaceIds = spaces.map((space) => space.id);

    // Get bookings for partner's spaces
    const bookings = await this.bookingRepository
      .createQueryBuilder('booking')
      .innerJoin('booking.spaceOption', 'spaceOption')
      .where('spaceOption.spaceId IN (:...spaceIds)', { spaceIds })
      .andWhere(dateFilter.where, dateFilter.params)
      .getMany();

    // Calculate metrics
    const totalRevenue = bookings.reduce(
      (sum, booking) => sum + Number(booking.totalAmount),
      0,
    );
    const totalBookings = bookings.length;
    const totalSpaces = spaces.length;
    const activeSpaces = spaces.filter(
      (space) => space.status === SpaceStatus.ACTIVE,
    ).length;

    // Calculate average rating
    const spacesWithRatings = spaces.filter((space) => space.rating > 0);
    const averageRating =
      spacesWithRatings.length > 0
        ? spacesWithRatings.reduce(
            (sum, space) => sum + Number(space.rating),
            0,
          ) / spacesWithRatings.length
        : 0;

    // Calculate growth metrics (compare with previous period)
    const previousPeriodFilter = this.buildPreviousPeriodFilter(
      startDate,
      endDate,
    );
    const previousBookings = await this.bookingRepository
      .createQueryBuilder('booking')
      .innerJoin('booking.spaceOption', 'spaceOption')
      .where('spaceOption.spaceId IN (:...spaceIds)', { spaceIds })
      .andWhere(previousPeriodFilter.where, previousPeriodFilter.params)
      .getMany();

    const previousRevenue = previousBookings.reduce(
      (sum, booking) => sum + Number(booking.totalAmount),
      0,
    );
    const previousBookingCount = previousBookings.length;

    const revenueGrowth =
      previousRevenue > 0
        ? ((totalRevenue - previousRevenue) / previousRevenue) * 100
        : 0;
    const bookingGrowth =
      previousBookingCount > 0
        ? ((totalBookings - previousBookingCount) / previousBookingCount) * 100
        : 0;

    // Get top performing spaces
    const spacePerformance = await this.getSpacePerformanceData(
      spaceIds,
      dateFilter,
    );
    const topPerformingSpaces = spacePerformance
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5)
      .map((space) => ({
        spaceId: space.spaceId,
        spaceName: space.spaceName,
        revenue: space.revenue,
        bookings: space.bookings,
      }));

    return {
      totalRevenue,
      totalBookings,
      totalSpaces,
      activeSpaces,
      averageRating,
      revenueGrowth,
      bookingGrowth,
      topPerformingSpaces,
    };
  }

  async getRevenueAnalytics(
    partnerId: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<RevenueAnalytics> {
    const dateFilter = this.buildDateFilter(startDate, endDate);

    const spaces = await this.spaceRepository.find({
      where: {
        listing: {
          partner: {
            id: partnerId,
          },
        },
      },
      relations: ['listing', 'listing.partner'],
    });
    const spaceIds = spaces.map((space) => space.id);

    const bookings = await this.bookingRepository
      .createQueryBuilder('booking')
      .leftJoinAndSelect('booking.space', 'space')
      .innerJoin('booking.spaceOption', 'spaceOption')
      .where('spaceOption.spaceId IN (:...spaceIds)', { spaceIds })
      .andWhere(dateFilter.where, dateFilter.params)
      .getMany();

    const totalRevenue = bookings.reduce(
      (sum, booking) => sum + Number(booking.totalAmount),
      0,
    );

    // Monthly revenue breakdown
    const monthlyRevenue = this.calculateMonthlyRevenue(bookings);

    // Revenue by space type
    const revenueBySpaceType = this.calculateRevenueBySpaceType(
      bookings,
      totalRevenue,
    );

    const averageBookingValue =
      bookings.length > 0 ? totalRevenue / bookings.length : 0;

    return {
      totalRevenue,
      monthlyRevenue,
      revenueBySpaceType,
      averageBookingValue,
    };
  }

  async getBookingAnalytics(
    partnerId: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<BookingAnalytics> {
    const dateFilter = this.buildDateFilter(startDate, endDate);

    const spaces = await this.spaceRepository.find({
      where: {
        listing: {
          partner: {
            id: partnerId,
          },
        },
      },
      relations: ['listing', 'listing.partner'],
    });
    const spaceIds = spaces.map((space) => space.id);

    const bookings = await this.bookingRepository
      .createQueryBuilder('booking')
      .innerJoin('booking.spaceOption', 'spaceOption')
      .where('spaceOption.spaceId IN (:...spaceIds)', { spaceIds })
      .andWhere(dateFilter.where, dateFilter.params)
      .getMany();

    const totalBookings = bookings.length;
    const completedBookings = bookings.filter(
      (b) => b.status === 'completed',
    ).length;
    const cancelledBookings = bookings.filter(
      (b) => b.status === 'cancelled',
    ).length;
    const pendingBookings = bookings.filter(
      (b) => b.status === 'pending',
    ).length;

    const bookingTrends = this.calculateBookingTrends(bookings);
    const peakHours = this.calculatePeakHours(bookings);
    const averageBookingDuration =
      this.calculateAverageBookingDuration(bookings);

    return {
      totalBookings,
      completedBookings,
      cancelledBookings,
      pendingBookings,
      bookingTrends,
      peakHours,
      averageBookingDuration,
    };
  }

  async getSpaceAnalytics(
    partnerId: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<SpaceAnalytics> {
    const dateFilter = this.buildDateFilter(startDate, endDate);

    const spaces = await this.spaceRepository.find({
      where: {
        listing: {
          partner: {
            id: partnerId,
          },
        },
      },
      relations: ['listing', 'listing.partner'],
    });

    const totalSpaces = spaces.length;
    const activeSpaces = spaces.filter(
      (space) => space.status === SpaceStatus.ACTIVE,
    ).length;

    const spaceIds = spaces.map((space) => space.id);
    const spacePerformance = await this.getSpacePerformanceData(
      spaceIds,
      dateFilter,
    );

    const spaceUtilization = spacePerformance.map((space) => ({
      spaceId: space.spaceId,
      spaceName: space.spaceName,
      utilizationRate: this.calculateUtilizationRate(
        space.bookings,
        space.spaceId,
      ),
      totalBookings: space.bookings,
      revenue: space.revenue,
    }));

    return {
      totalSpaces,
      activeSpaces,
      spaceUtilization,
      spacePerformance,
    };
  }

  async getCustomerAnalytics(
    partnerId: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<CustomerAnalytics> {
    const dateFilter = this.buildDateFilter(startDate, endDate);

    const spaces = await this.spaceRepository.find({
      where: {
        listing: {
          partner: {
            id: partnerId,
          },
        },
      },
      relations: ['listing', 'listing.partner'],
    });
    const spaceIds = spaces.map((space) => space.id);

    const bookings = await this.bookingRepository
      .createQueryBuilder('booking')
      .leftJoinAndSelect('booking.user', 'user')
      .where('booking.spaceId IN (:...spaceIds)', { spaceIds })
      .andWhere(dateFilter.where, dateFilter.params)
      .getMany();

    const uniqueCustomers = new Set(bookings.map((b) => b.userId));
    const totalCustomers = uniqueCustomers.size;

    // Calculate new vs returning customers
    const customerBookingCounts = this.calculateCustomerBookingCounts(bookings);
    const newCustomers = customerBookingCounts.filter(
      (c) => c.bookingCount === 1,
    ).length;
    const returningCustomers = totalCustomers - newCustomers;

    // Customer demographics (simplified)
    const customerDemographics = this.calculateCustomerDemographics(bookings);

    // Top customers
    const topCustomers = customerBookingCounts
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, 10)
      .map((customer) => ({
        userId: customer.userId,
        userName: customer.userName,
        totalBookings: customer.bookingCount,
        totalSpent: customer.totalSpent,
      }));

    return {
      totalCustomers,
      newCustomers,
      returningCustomers,
      customerDemographics,
      topCustomers,
    };
  }

  private buildDateFilter(startDate?: Date, endDate?: Date) {
    if (!startDate && !endDate) {
      return { where: '1=1', params: {} };
    }

    const conditions = [];
    const params: any = {};

    if (startDate) {
      conditions.push('booking.createdAt >= :startDate');
      params.startDate = startDate;
    }

    if (endDate) {
      conditions.push('booking.createdAt <= :endDate');
      params.endDate = endDate;
    }

    return {
      where: conditions.join(' AND '),
      params,
    };
  }

  private buildPreviousPeriodFilter(startDate?: Date, endDate?: Date) {
    if (!startDate || !endDate) {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 60);
      const sixtyDaysAgo = new Date();
      sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 30);
      return this.buildDateFilter(sixtyDaysAgo, thirtyDaysAgo);
    }

    const periodLength = endDate.getTime() - startDate.getTime();
    const previousEndDate = new Date(startDate.getTime() - 1);
    const previousStartDate = new Date(startDate.getTime() - periodLength);

    return this.buildDateFilter(previousStartDate, previousEndDate);
  }

  private async getSpacePerformanceData(spaceIds: string[], dateFilter: any) {
    const query = this.bookingRepository
      .createQueryBuilder('booking')
      .leftJoinAndSelect('booking.spaceOption', 'spaceOption')
      .leftJoinAndSelect('spaceOption.space', 'space')
      .select([
        'space.id as spaceId',
        'space.name as spaceName',
        'space.averageRating as rating',
        'COUNT(booking.id) as bookings',
        'SUM(booking.totalAmount) as revenue',
      ])
      .where('spaceOption.space.id IN (:...spaceIds)', { spaceIds })
      .andWhere(dateFilter.where, dateFilter.params)
      .groupBy('space.id, space.name, space.averageRating');

    const results = await query.getRawMany();
    return results.map((result) => ({
      spaceId: result.spaceId,
      spaceName: result.spaceName,
      rating: Number(result.rating) || 0,
      bookings: Number(result.bookings),
      revenue: Number(result.revenue) || 0,
    }));
  }

  private calculateMonthlyRevenue(bookings: BookingEntity[]) {
    const monthlyData = new Map<
      string,
      { revenue: number; bookings: number }
    >();

    bookings.forEach((booking) => {
      const month = booking.createdAt.toISOString().substring(0, 7); // YYYY-MM
      const current = monthlyData.get(month) || { revenue: 0, bookings: 0 };
      current.revenue += Number(booking.totalAmount);
      current.bookings += 1;
      monthlyData.set(month, current);
    });

    return Array.from(monthlyData.entries()).map(([month, data]) => ({
      month,
      revenue: data.revenue,
      bookings: data.bookings,
    }));
  }

  private calculateRevenueBySpaceType(
    bookings: BookingEntity[],
    totalRevenue: number,
  ) {
    const spaceTypeRevenue = new Map<string, number>();

    bookings.forEach((booking) => {
      const spaceType = booking.spaceOption?.space?.spaceType || 'unknown';
      const current = spaceTypeRevenue.get(spaceType) || 0;
      spaceTypeRevenue.set(spaceType, current + Number(booking.totalAmount));
    });

    return Array.from(spaceTypeRevenue.entries()).map(
      ([spaceType, revenue]) => ({
        spaceType,
        revenue,
        percentage: totalRevenue > 0 ? (revenue / totalRevenue) * 100 : 0,
      }),
    );
  }

  private calculateBookingTrends(bookings: BookingEntity[]) {
    const dailyBookings = new Map<string, number>();

    bookings.forEach((booking) => {
      const date = booking.createdAt.toISOString().substring(0, 10); // YYYY-MM-DD
      const current = dailyBookings.get(date) || 0;
      dailyBookings.set(date, current + 1);
    });

    return Array.from(dailyBookings.entries()).map(([date, bookings]) => ({
      date,
      bookings,
    }));
  }

  private calculatePeakHours(bookings: BookingEntity[]) {
    const hourlyBookings = new Map<number, number>();

    bookings.forEach((booking) => {
      const hour = booking.startDateTime.getHours();
      const current = hourlyBookings.get(hour) || 0;
      hourlyBookings.set(hour, current + 1);
    });

    return Array.from(hourlyBookings.entries()).map(([hour, bookings]) => ({
      hour,
      bookings,
    }));
  }

  private calculateAverageBookingDuration(bookings: BookingEntity[]): number {
    if (bookings.length === 0) return 0;

    const totalDuration = bookings.reduce((sum, booking) => {
      const duration =
        booking.endDateTime.getTime() - booking.startDateTime.getTime();
      return sum + duration;
    }, 0);

    return totalDuration / bookings.length / (1000 * 60 * 60); // Convert to hours
  }

  private calculateUtilizationRate(bookings: number, spaceId: string): number {
    // Simplified calculation - in reality, this would consider available hours
    // For now, we'll use a basic metric based on booking frequency
    const daysInPeriod = 30; // Assume 30-day period
    const maxPossibleBookings = daysInPeriod * 12; // Assume 12 possible bookings per day
    return Math.min((bookings / maxPossibleBookings) * 100, 100);
  }

  private calculateCustomerBookingCounts(bookings: BookingEntity[]) {
    const customerData = new Map<
      string,
      {
        userId: string;
        userName: string;
        bookingCount: number;
        totalSpent: number;
      }
    >();

    bookings.forEach((booking) => {
      const userId = booking.userId;
      const current = customerData.get(userId) || {
        userId,
        userName: booking.user
          ? `${booking.user.firstName || ''} ${booking.user.lastName || ''}`.trim() ||
            booking.user.username
          : 'Unknown',
        bookingCount: 0,
        totalSpent: 0,
      };
      current.bookingCount += 1;
      current.totalSpent += Number(booking.totalAmount);
      customerData.set(userId, current);
    });

    return Array.from(customerData.values());
  }

  private calculateCustomerDemographics(bookings: BookingEntity[]) {
    // Simplified demographics - in reality, this would use actual user data
    const ageGroups = {
      '18-25': 0,
      '26-35': 0,
      '36-45': 0,
      '46-55': 0,
      '55+': 0,
    };

    const uniqueCustomers = new Set(bookings.map((b) => b.userId));
    const totalCustomers = uniqueCustomers.size;

    // Mock distribution for now
    ageGroups['26-35'] = Math.floor(totalCustomers * 0.4);
    ageGroups['18-25'] = Math.floor(totalCustomers * 0.25);
    ageGroups['36-45'] = Math.floor(totalCustomers * 0.2);
    ageGroups['46-55'] = Math.floor(totalCustomers * 0.1);
    ageGroups['55+'] =
      totalCustomers -
      (ageGroups['26-35'] +
        ageGroups['18-25'] +
        ageGroups['36-45'] +
        ageGroups['46-55']);

    return Object.entries(ageGroups).map(([ageGroup, count]) => ({
      ageGroup,
      count,
      percentage: totalCustomers > 0 ? (count / totalCustomers) * 100 : 0,
    }));
  }
}
