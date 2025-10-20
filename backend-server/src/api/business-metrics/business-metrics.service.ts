import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';

import { WebSocketService } from '@/api/notification/services/websocket.service';
import { UserEntity } from '@/auth/entities/user.entity';
import { BookingStatus } from '@/common/enums/booking.enum';
import { SpaceStatus } from '@/common/enums/space.enum';
import { BookingEntity } from '@/database/entities/booking.entity';
import { PartnerEntity } from '@/database/entities/partner.entity';
import { PaymentEntity } from '@/database/entities/payment.entity';
import { ReviewEntity } from '@/database/entities/review.entity';
import { SpaceEntity } from '@/database/entities/space.entity';
import { WalletTransactionEntity } from '@/database/entities/wallet-transaction.entity';

export interface BusinessMetrics {
  // User Metrics
  totalUsers: number;
  activeUsers: number;
  newUsersToday: number;
  userGrowthRate: number;
  userRetentionRate: number;

  // Partner Metrics
  totalPartners: number;
  activePartners: number;
  newPartnersToday: number;
  partnerGrowthRate: number;
  averagePartnerRating: number;

  // Booking Metrics
  totalBookings: number;
  completedBookings: number;
  cancelledBookings: number;
  bookingCompletionRate: number;
  averageBookingValue: number;
  bookingsToday: number;

  // Revenue Metrics
  totalRevenue: number;
  revenueToday: number;
  averageRevenuePerUser: number;
  averageRevenuePerBooking: number;
  monthlyRecurringRevenue: number;

  // Space Metrics
  totalSpaces: number;
  activeSpaces: number;
  averageSpaceUtilization: number;
  topPerformingSpaces: Array<{
    spaceId: string;
    spaceName: string;
    bookings: number;
    revenue: number;
    rating: number;
  }>;

  // Performance Metrics
  averageResponseTime: number;
  systemUptime: number;
  errorRate: number;

  // Engagement Metrics
  averageSessionDuration: number;
  pageViews: number;
  conversionRate: number;
  customerSatisfactionScore: number;
}

export interface MetricsTrend {
  period: string;
  value: number;
  change: number;
  changePercentage: number;
}

export interface BusinessAlert {
  id: string;
  type:
    | 'revenue'
    | 'bookings'
    | 'users'
    | 'partners'
    | 'system'
    | 'performance';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  value: number;
  threshold: number;
  timestamp: Date;
  acknowledged: boolean;
}

@Injectable()
export class BusinessMetricsService {
  private readonly logger = new Logger(BusinessMetricsService.name);
  private metricsCache: BusinessMetrics | null = null;
  private lastCacheUpdate: Date | null = null;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  constructor(
    @InjectRepository(BookingEntity)
    private bookingRepository: Repository<BookingEntity>,
    @InjectRepository(PaymentEntity)
    private paymentRepository: Repository<PaymentEntity>,
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
    @InjectRepository(PartnerEntity)
    private partnerRepository: Repository<PartnerEntity>,
    @InjectRepository(SpaceEntity)
    private spaceRepository: Repository<SpaceEntity>,
    @InjectRepository(ReviewEntity)
    private reviewRepository: Repository<ReviewEntity>,
    @InjectRepository(WalletTransactionEntity)
    private walletTransactionRepository: Repository<WalletTransactionEntity>,
    private webSocketService: WebSocketService,
    private eventEmitter: EventEmitter2,
  ) {}

  async getBusinessMetrics(useCache: boolean = true): Promise<BusinessMetrics> {
    if (useCache && this.isCacheValid()) {
      return this.metricsCache!;
    }

    try {
      const now = new Date();
      const startOfDay = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
      );
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

      const [
        userMetrics,
        partnerMetrics,
        bookingMetrics,
        revenueMetrics,
        spaceMetrics,
        performanceMetrics,
        engagementMetrics,
      ] = await Promise.all([
        this.getUserMetrics(
          startOfDay,
          startOfMonth,
          lastMonth,
          endOfLastMonth,
        ),
        this.getPartnerMetrics(
          startOfDay,
          startOfMonth,
          lastMonth,
          endOfLastMonth,
        ),
        this.getBookingMetrics(startOfDay, startOfMonth),
        this.getRevenueMetrics(startOfDay, startOfMonth),
        this.getSpaceMetrics(),
        this.getPerformanceMetrics(),
        this.getEngagementMetrics(),
      ]);

      const metrics: BusinessMetrics = {
        ...userMetrics,
        ...partnerMetrics,
        ...bookingMetrics,
        ...revenueMetrics,
        ...spaceMetrics,
        ...performanceMetrics,
        ...engagementMetrics,
      };

      this.metricsCache = metrics;
      this.lastCacheUpdate = new Date();

      // Emit metrics update event
      this.eventEmitter.emit('business.metrics.updated', { metrics });

      return metrics;
    } catch (error) {
      this.logger.error('Failed to get business metrics:', error);
      throw error;
    }
  }

  async getMetricsTrends(
    metric: keyof BusinessMetrics,
    period: 'day' | 'week' | 'month' = 'day',
    days: number = 30,
  ): Promise<MetricsTrend[]> {
    try {
      const trends: MetricsTrend[] = [];
      const now = new Date();

      for (let i = days - 1; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);

        const startOfPeriod = new Date(
          date.getFullYear(),
          date.getMonth(),
          date.getDate(),
        );
        const endOfPeriod = new Date(startOfPeriod);
        endOfPeriod.setDate(endOfPeriod.getDate() + 1);

        const value = await this.getMetricValueForPeriod(
          metric,
          startOfPeriod,
          endOfPeriod,
        );
        const previousValue =
          i < days - 1 ? trends[trends.length - 1]?.value || 0 : 0;

        const change = value - previousValue;
        const changePercentage =
          previousValue > 0 ? (change / previousValue) * 100 : 0;

        trends.push({
          period: startOfPeriod.toISOString().split('T')[0],
          value,
          change,
          changePercentage,
        });
      }

      return trends;
    } catch (error) {
      this.logger.error(`Failed to get trends for metric ${metric}:`, error);
      throw error;
    }
  }

  async getBusinessAlerts(): Promise<BusinessAlert[]> {
    try {
      const metrics = await this.getBusinessMetrics();
      const alerts: BusinessAlert[] = [];

      // Revenue alerts
      if (metrics.revenueToday < 10000) {
        // Less than ₹10,000 today
        alerts.push({
          id: `revenue-low-${Date.now()}`,
          type: 'revenue',
          severity: 'medium',
          title: 'Low Daily Revenue',
          message: `Today's revenue (₹${metrics.revenueToday.toLocaleString()}) is below expected threshold`,
          value: metrics.revenueToday,
          threshold: 10000,
          timestamp: new Date(),
          acknowledged: false,
        });
      }

      // Booking alerts
      if (metrics.bookingCompletionRate < 80) {
        alerts.push({
          id: `booking-completion-${Date.now()}`,
          type: 'bookings',
          severity: 'high',
          title: 'Low Booking Completion Rate',
          message: `Booking completion rate (${metrics.bookingCompletionRate.toFixed(1)}%) is below 80%`,
          value: metrics.bookingCompletionRate,
          threshold: 80,
          timestamp: new Date(),
          acknowledged: false,
        });
      }

      // User growth alerts
      if (metrics.userGrowthRate < 0) {
        alerts.push({
          id: `user-growth-${Date.now()}`,
          type: 'users',
          severity: 'high',
          title: 'Negative User Growth',
          message: `User growth rate (${metrics.userGrowthRate.toFixed(1)}%) is negative`,
          value: metrics.userGrowthRate,
          threshold: 0,
          timestamp: new Date(),
          acknowledged: false,
        });
      }

      // Partner alerts
      if (metrics.averagePartnerRating < 4.0) {
        alerts.push({
          id: `partner-rating-${Date.now()}`,
          type: 'partners',
          severity: 'medium',
          title: 'Low Partner Rating',
          message: `Average partner rating (${metrics.averagePartnerRating.toFixed(1)}) is below 4.0`,
          value: metrics.averagePartnerRating,
          threshold: 4.0,
          timestamp: new Date(),
          acknowledged: false,
        });
      }

      // System performance alerts
      if (metrics.errorRate > 5) {
        alerts.push({
          id: `error-rate-${Date.now()}`,
          type: 'system',
          severity: 'critical',
          title: 'High Error Rate',
          message: `System error rate (${metrics.errorRate.toFixed(1)}%) exceeds 5%`,
          value: metrics.errorRate,
          threshold: 5,
          timestamp: new Date(),
          acknowledged: false,
        });
      }

      return alerts;
    } catch (error) {
      this.logger.error('Failed to get business alerts:', error);
      return [];
    }
  }

  @Cron(CronExpression.EVERY_5_MINUTES)
  async updateMetricsCache(): Promise<void> {
    try {
      this.logger.log('Updating business metrics cache...');
      await this.getBusinessMetrics(false);
      this.logger.log('Business metrics cache updated successfully');
    } catch (error) {
      this.logger.error('Failed to update metrics cache:', error);
    }
  }

  @Cron(CronExpression.EVERY_10_MINUTES)
  async checkBusinessAlerts(): Promise<void> {
    try {
      const alerts = await this.getBusinessAlerts();
      const criticalAlerts = alerts.filter(
        (alert) => alert.severity === 'critical',
      );
      const highAlerts = alerts.filter((alert) => alert.severity === 'high');

      if (criticalAlerts.length > 0 || highAlerts.length > 0) {
        // Send real-time alerts via WebSocket
        const priority = criticalAlerts.length > 0 ? 'high' : 'medium';
        const message = `${criticalAlerts.length + highAlerts.length} business alerts require attention`;
        this.webSocketService.sendSystemAlert(message, priority);

        // Emit event for other services
        this.eventEmitter.emit('business.alerts.detected', {
          criticalAlerts,
          highAlerts,
          totalAlerts: alerts.length,
        });
      }
    } catch (error) {
      this.logger.error('Failed to check business alerts:', error);
    }
  }

  // Private helper methods
  private isCacheValid(): boolean {
    return (
      this.metricsCache !== null &&
      this.lastCacheUpdate !== null &&
      Date.now() - this.lastCacheUpdate.getTime() < this.CACHE_DURATION
    );
  }

  private async getUserMetrics(
    startOfDay: Date,
    startOfMonth: Date,
    lastMonth: Date,
    endOfLastMonth: Date,
  ) {
    const [
      totalUsers,
      newUsersToday,
      newUsersThisMonth,
      newUsersLastMonth,
      activeUsers,
    ] = await Promise.all([
      this.userRepository.count(),
      this.userRepository.count({
        where: { createdAt: Between(startOfDay, new Date()) },
      }),
      this.userRepository.count({
        where: { createdAt: Between(startOfMonth, new Date()) },
      }),
      this.userRepository.count({
        where: { createdAt: Between(lastMonth, endOfLastMonth) },
      }),
      this.userRepository.count({
        where: { lastLoginAt: Between(startOfMonth, new Date()) },
      }),
    ]);

    const userGrowthRate =
      newUsersLastMonth > 0
        ? ((newUsersThisMonth - newUsersLastMonth) / newUsersLastMonth) * 100
        : 0;
    const userRetentionRate =
      totalUsers > 0 ? (activeUsers / totalUsers) * 100 : 0;

    return {
      totalUsers,
      activeUsers,
      newUsersToday,
      userGrowthRate,
      userRetentionRate,
    };
  }

  private async getPartnerMetrics(
    startOfDay: Date,
    startOfMonth: Date,
    lastMonth: Date,
    endOfLastMonth: Date,
  ) {
    const [
      totalPartners,
      newPartnersToday,
      newPartnersThisMonth,
      newPartnersLastMonth,
      averageRating,
    ] = await Promise.all([
      this.partnerRepository.count(),
      this.partnerRepository.count({
        where: { createdAt: Between(startOfDay, new Date()) },
      }),
      this.partnerRepository.count({
        where: { createdAt: Between(startOfMonth, new Date()) },
      }),
      this.partnerRepository.count({
        where: { createdAt: Between(lastMonth, endOfLastMonth) },
      }),
      this.getAveragePartnerRating(),
    ]);

    const activePartners = await this.partnerRepository
      .createQueryBuilder('partner')
      .leftJoin('partner.listings', 'listing')
      .leftJoin('listing.spaces', 'space')
      .leftJoin('space.spaceOptions', 'spaceOption')
      .leftJoin('spaceOption.bookings', 'booking')
      .where('booking.createdAt >= :startOfMonth', { startOfMonth })
      .distinct(true)
      .getCount();

    const partnerGrowthRate =
      newPartnersLastMonth > 0
        ? ((newPartnersThisMonth - newPartnersLastMonth) /
            newPartnersLastMonth) *
          100
        : 0;

    return {
      totalPartners,
      activePartners,
      newPartnersToday,
      partnerGrowthRate,
      averagePartnerRating: averageRating,
    };
  }

  private async getBookingMetrics(startOfDay: Date, startOfMonth: Date) {
    const [
      totalBookings,
      completedBookings,
      cancelledBookings,
      bookingsToday,
      averageValue,
    ] = await Promise.all([
      this.bookingRepository.count(),
      this.bookingRepository.count({
        where: { status: BookingStatus.COMPLETED },
      }),
      this.bookingRepository.count({
        where: { status: BookingStatus.CANCELLED },
      }),
      this.bookingRepository.count({
        where: { createdAt: Between(startOfDay, new Date()) },
      }),
      this.getAverageBookingValue(),
    ]);

    const bookingCompletionRate =
      totalBookings > 0 ? (completedBookings / totalBookings) * 100 : 0;

    return {
      totalBookings,
      completedBookings,
      cancelledBookings,
      bookingCompletionRate,
      averageBookingValue: averageValue,
      bookingsToday,
    };
  }

  private async getRevenueMetrics(startOfDay: Date, startOfMonth: Date) {
    const [
      totalRevenue,
      revenueToday,
      monthlyRevenue,
      totalUsers,
      totalBookings,
    ] = await Promise.all([
      this.getTotalRevenue(),
      this.getRevenueForPeriod(startOfDay, new Date()),
      this.getRevenueForPeriod(startOfMonth, new Date()),
      this.userRepository.count(),
      this.bookingRepository.count({
        where: { status: BookingStatus.COMPLETED },
      }),
    ]);

    const averageRevenuePerUser =
      totalUsers > 0 ? totalRevenue / totalUsers : 0;
    const averageRevenuePerBooking =
      totalBookings > 0 ? totalRevenue / totalBookings : 0;

    return {
      totalRevenue,
      revenueToday,
      averageRevenuePerUser,
      averageRevenuePerBooking,
      monthlyRecurringRevenue: monthlyRevenue,
    };
  }

  private async getSpaceMetrics() {
    const [totalSpaces, activeSpaces, topSpaces] = await Promise.all([
      this.spaceRepository.count(),
      this.spaceRepository.count({ where: { status: SpaceStatus.ACTIVE } }),
      this.getTopPerformingSpaces(),
    ]);

    const averageSpaceUtilization = await this.getAverageSpaceUtilization();

    return {
      totalSpaces,
      activeSpaces,
      averageSpaceUtilization,
      topPerformingSpaces: topSpaces,
    };
  }

  private async getPerformanceMetrics() {
    // Mock performance metrics - in real implementation, these would come from monitoring systems
    return {
      averageResponseTime: 150, // ms
      systemUptime: 99.9, // percentage
      errorRate: 0.5, // percentage
    };
  }

  private async getEngagementMetrics() {
    // Mock engagement metrics - in real implementation, these would come from analytics
    return {
      averageSessionDuration: 25, // minutes
      pageViews: 15000,
      conversionRate: 3.2, // percentage
      customerSatisfactionScore: 4.3,
    };
  }

  private async getAveragePartnerRating(): Promise<number> {
    const result = await this.reviewRepository
      .createQueryBuilder('review')
      .select('AVG(review.rating)', 'averageRating')
      .where('review.revieweeType = :type', { type: 'PARTNER' })
      .getRawOne();

    return parseFloat(result.averageRating) || 0;
  }

  private async getAverageBookingValue(): Promise<number> {
    const result = await this.paymentRepository
      .createQueryBuilder('payment')
      .select('AVG(payment.amount)', 'averageAmount')
      .where('payment.status = :status', { status: 'COMPLETED' })
      .getRawOne();

    return parseFloat(result.averageAmount) || 0;
  }

  private async getTotalRevenue(): Promise<number> {
    const result = await this.paymentRepository
      .createQueryBuilder('payment')
      .select('SUM(payment.amount)', 'totalRevenue')
      .where('payment.status = :status', { status: 'COMPLETED' })
      .getRawOne();

    return parseFloat(result.totalRevenue) || 0;
  }

  private async getRevenueForPeriod(
    startDate: Date,
    endDate: Date,
  ): Promise<number> {
    const result = await this.paymentRepository
      .createQueryBuilder('payment')
      .select('SUM(payment.amount)', 'revenue')
      .where('payment.status = :status', { status: 'COMPLETED' })
      .andWhere('payment.createdAt BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      })
      .getRawOne();

    return parseFloat(result.revenue) || 0;
  }

  private async getTopPerformingSpaces() {
    const spaces = await this.spaceRepository
      .createQueryBuilder('space')
      .leftJoin('space.spaceOptions', 'spaceOption')
      .leftJoin('spaceOption.bookings', 'booking')
      .leftJoin('booking.payments', 'payment')
      .leftJoin('space.reviews', 'review')
      .select([
        'space.id as spaceId',
        'space.name as spaceName',
        'COUNT(DISTINCT booking.id) as bookings',
        "SUM(CASE WHEN payment.status = 'COMPLETED' THEN payment.amount ELSE 0 END) as revenue",
        'AVG(review.rating) as rating',
      ])
      .where('booking.status = :status', { status: 'COMPLETED' })
      .groupBy('space.id, space.name')
      .orderBy('revenue', 'DESC')
      .limit(5)
      .getRawMany();

    return spaces.map((space) => ({
      spaceId: space.spaceId,
      spaceName: space.spaceName,
      bookings: parseInt(space.bookings) || 0,
      revenue: parseFloat(space.revenue) || 0,
      rating: parseFloat(space.rating) || 0,
    }));
  }

  private async getAverageSpaceUtilization(): Promise<number> {
    // Mock calculation - in real implementation, this would calculate based on booking hours vs available hours
    return 65.5; // percentage
  }

  private async getMetricValueForPeriod(
    metric: keyof BusinessMetrics,
    startDate: Date,
    endDate: Date,
  ): Promise<number> {
    // This is a simplified implementation - in practice, you'd have specific queries for each metric
    switch (metric) {
      case 'totalRevenue':
        return this.getRevenueForPeriod(startDate, endDate);
      case 'totalBookings':
        return this.bookingRepository.count({
          where: { createdAt: Between(startDate, endDate) },
        });
      case 'totalUsers':
        return this.userRepository.count({
          where: { createdAt: Between(startDate, endDate) },
        });
      default:
        return 0;
    }
  }
}
