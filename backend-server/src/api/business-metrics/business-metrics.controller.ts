import { Role as UserRole } from '@/api/user/user.enum';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { Roles } from '@/decorators/roles.decorator';
import { RolesGuard } from '@/guards/roles.guard';
import {
  Controller,
  DefaultValuePipe,
  Get,
  HttpStatus,
  Logger,
  ParseIntPipe,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsNumber, IsOptional, Max, Min } from 'class-validator';
import { BusinessMetricsService } from './business-metrics.service';

export class MetricsTrendsQueryDto {
  @IsOptional()
  @IsEnum(['day', 'week', 'month'])
  period?: 'day' | 'week' | 'month' = 'day';

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(365)
  days?: number = 30;
}

@ApiTags('Business Metrics')
@Controller('business-metrics')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class BusinessMetricsController {
  private readonly logger = new Logger(BusinessMetricsController.name);

  constructor(
    private readonly businessMetricsService: BusinessMetricsService,
  ) {}

  @Get('overview')
  @Roles(UserRole.Admin)
  @ApiOperation({
    summary: 'Get business metrics overview',
    description:
      'Retrieve comprehensive business metrics including users, partners, bookings, revenue, and performance data',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Business metrics retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        data: {
          type: 'object',
          properties: {
            // User Metrics
            totalUsers: { type: 'number' },
            activeUsers: { type: 'number' },
            newUsersToday: { type: 'number' },
            userGrowthRate: { type: 'number' },
            userRetentionRate: { type: 'number' },

            // Partner Metrics
            totalPartners: { type: 'number' },
            activePartners: { type: 'number' },
            newPartnersToday: { type: 'number' },
            partnerGrowthRate: { type: 'number' },
            averagePartnerRating: { type: 'number' },

            // Booking Metrics
            totalBookings: { type: 'number' },
            completedBookings: { type: 'number' },
            cancelledBookings: { type: 'number' },
            bookingCompletionRate: { type: 'number' },
            averageBookingValue: { type: 'number' },
            bookingsToday: { type: 'number' },

            // Revenue Metrics
            totalRevenue: { type: 'number' },
            revenueToday: { type: 'number' },
            averageRevenuePerUser: { type: 'number' },
            averageRevenuePerBooking: { type: 'number' },
            monthlyRecurringRevenue: { type: 'number' },

            // Space Metrics
            totalSpaces: { type: 'number' },
            activeSpaces: { type: 'number' },
            averageSpaceUtilization: { type: 'number' },
            topPerformingSpaces: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  spaceId: { type: 'string' },
                  spaceName: { type: 'string' },
                  bookings: { type: 'number' },
                  revenue: { type: 'number' },
                  rating: { type: 'number' },
                },
              },
            },

            // Performance Metrics
            averageResponseTime: { type: 'number' },
            systemUptime: { type: 'number' },
            errorRate: { type: 'number' },

            // Engagement Metrics
            averageSessionDuration: { type: 'number' },
            pageViews: { type: 'number' },
            conversionRate: { type: 'number' },
            customerSatisfactionScore: { type: 'number' },
          },
        },
        timestamp: { type: 'string', format: 'date-time' },
      },
    },
  })
  @ApiQuery({
    name: 'useCache',
    required: false,
    type: Boolean,
    description: 'Whether to use cached metrics (default: true)',
  })
  async getBusinessMetricsOverview(
    @Query('useCache', new DefaultValuePipe(true)) useCache: boolean,
  ) {
    try {
      const metrics =
        await this.businessMetricsService.getBusinessMetrics(useCache);

      this.logger.log(
        `Business metrics overview retrieved (cache: ${useCache})`,
      );

      return {
        success: true,
        data: metrics,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error('Failed to get business metrics overview:', error);
      throw error;
    }
  }

  @Get('trends')
  @Roles(UserRole.Admin)
  @ApiOperation({
    summary: 'Get metrics trends',
    description: 'Retrieve trends for specific business metrics over time',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Metrics trends retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        data: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              period: { type: 'string' },
              value: { type: 'number' },
              change: { type: 'number' },
              changePercentage: { type: 'number' },
            },
          },
        },
        timestamp: { type: 'string', format: 'date-time' },
      },
    },
  })
  @ApiQuery({
    name: 'metric',
    required: true,
    type: String,
    description:
      'Metric to get trends for (e.g., totalRevenue, totalBookings, totalUsers)',
    enum: [
      'totalUsers',
      'activeUsers',
      'newUsersToday',
      'userGrowthRate',
      'userRetentionRate',
      'totalPartners',
      'activePartners',
      'newPartnersToday',
      'partnerGrowthRate',
      'averagePartnerRating',
      'totalBookings',
      'completedBookings',
      'cancelledBookings',
      'bookingCompletionRate',
      'averageBookingValue',
      'bookingsToday',
      'totalRevenue',
      'revenueToday',
      'averageRevenuePerUser',
      'averageRevenuePerBooking',
      'monthlyRecurringRevenue',
      'totalSpaces',
      'activeSpaces',
      'averageSpaceUtilization',
      'averageResponseTime',
      'systemUptime',
      'errorRate',
      'averageSessionDuration',
      'pageViews',
      'conversionRate',
      'customerSatisfactionScore',
    ],
  })
  @ApiQuery({
    name: 'period',
    required: false,
    enum: ['day', 'week', 'month'],
    description: 'Time period for trends',
  })
  @ApiQuery({
    name: 'days',
    required: false,
    type: Number,
    description: 'Number of days to include (1-365)',
  })
  async getMetricsTrends(
    @Query('metric') metric: string,
    @Query() queryDto: MetricsTrendsQueryDto,
  ) {
    try {
      const trends = await this.businessMetricsService.getMetricsTrends(
        metric as any,
        queryDto.period,
        queryDto.days,
      );

      this.logger.log(
        `Metrics trends retrieved for ${metric} (${queryDto.period}, ${queryDto.days} days)`,
      );

      return {
        success: true,
        data: trends,
        metadata: {
          metric,
          period: queryDto.period,
          days: queryDto.days,
        },
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error(`Failed to get trends for metric ${metric}:`, error);
      throw error;
    }
  }

  @Get('alerts')
  @Roles(UserRole.Admin)
  @ApiOperation({
    summary: 'Get business alerts',
    description:
      'Retrieve current business alerts and warnings based on metrics thresholds',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Business alerts retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        data: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              type: {
                type: 'string',
                enum: [
                  'revenue',
                  'bookings',
                  'users',
                  'partners',
                  'system',
                  'performance',
                ],
              },
              severity: {
                type: 'string',
                enum: ['low', 'medium', 'high', 'critical'],
              },
              title: { type: 'string' },
              message: { type: 'string' },
              value: { type: 'number' },
              threshold: { type: 'number' },
              timestamp: { type: 'string', format: 'date-time' },
              acknowledged: { type: 'boolean' },
            },
          },
        },
        summary: {
          type: 'object',
          properties: {
            total: { type: 'number' },
            critical: { type: 'number' },
            high: { type: 'number' },
            medium: { type: 'number' },
            low: { type: 'number' },
          },
        },
        timestamp: { type: 'string', format: 'date-time' },
      },
    },
  })
  async getBusinessAlerts() {
    try {
      const alerts = await this.businessMetricsService.getBusinessAlerts();

      const summary = {
        total: alerts.length,
        critical: alerts.filter((a) => a.severity === 'critical').length,
        high: alerts.filter((a) => a.severity === 'high').length,
        medium: alerts.filter((a) => a.severity === 'medium').length,
        low: alerts.filter((a) => a.severity === 'low').length,
      };

      this.logger.log(
        `Business alerts retrieved: ${alerts.length} total, ${summary.critical} critical, ${summary.high} high`,
      );

      return {
        success: true,
        data: alerts,
        summary,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error('Failed to get business alerts:', error);
      throw error;
    }
  }

  @Get('kpis')
  @Roles(UserRole.Admin)
  @ApiOperation({
    summary: 'Get key performance indicators',
    description: 'Retrieve the most important KPIs for business monitoring',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'KPIs retrieved successfully',
  })
  async getKeyPerformanceIndicators() {
    try {
      const metrics = await this.businessMetricsService.getBusinessMetrics();

      const kpis = {
        revenue: {
          total: metrics.totalRevenue,
          today: metrics.revenueToday,
          monthly: metrics.monthlyRecurringRevenue,
          averagePerUser: metrics.averageRevenuePerUser,
          averagePerBooking: metrics.averageRevenuePerBooking,
        },
        growth: {
          userGrowthRate: metrics.userGrowthRate,
          partnerGrowthRate: metrics.partnerGrowthRate,
          newUsersToday: metrics.newUsersToday,
          newPartnersToday: metrics.newPartnersToday,
        },
        performance: {
          bookingCompletionRate: metrics.bookingCompletionRate,
          userRetentionRate: metrics.userRetentionRate,
          conversionRate: metrics.conversionRate,
          customerSatisfactionScore: metrics.customerSatisfactionScore,
        },
        operational: {
          totalBookings: metrics.totalBookings,
          bookingsToday: metrics.bookingsToday,
          activeUsers: metrics.activeUsers,
          activePartners: metrics.activePartners,
          spaceUtilization: metrics.averageSpaceUtilization,
        },
        system: {
          uptime: metrics.systemUptime,
          responseTime: metrics.averageResponseTime,
          errorRate: metrics.errorRate,
        },
      };

      return {
        success: true,
        data: kpis,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error('Failed to get KPIs:', error);
      throw error;
    }
  }

  @Get('real-time')
  @Roles(UserRole.Admin)
  @ApiOperation({
    summary: 'Get real-time business metrics',
    description:
      'Retrieve live business metrics for real-time monitoring dashboard',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Real-time metrics retrieved successfully',
  })
  async getRealTimeMetrics() {
    try {
      const [metrics, alerts] = await Promise.all([
        this.businessMetricsService.getBusinessMetrics(false), // Force fresh data
        this.businessMetricsService.getBusinessAlerts(),
      ]);

      const criticalAlerts = alerts.filter(
        (alert) => alert.severity === 'critical' || alert.severity === 'high',
      );

      const realTimeData = {
        metrics: {
          revenueToday: metrics.revenueToday,
          bookingsToday: metrics.bookingsToday,
          newUsersToday: metrics.newUsersToday,
          newPartnersToday: metrics.newPartnersToday,
          activeUsers: metrics.activeUsers,
          systemUptime: metrics.systemUptime,
          errorRate: metrics.errorRate,
          averageResponseTime: metrics.averageResponseTime,
        },
        alerts: criticalAlerts,
        status: {
          overall: criticalAlerts.length === 0 ? 'healthy' : 'warning',
          revenue: metrics.revenueToday > 10000 ? 'good' : 'low',
          bookings: metrics.bookingCompletionRate > 80 ? 'good' : 'poor',
          system:
            metrics.errorRate < 5 && metrics.systemUptime > 99
              ? 'stable'
              : 'unstable',
        },
        lastUpdated: new Date().toISOString(),
      };

      return {
        success: true,
        data: realTimeData,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error('Failed to get real-time metrics:', error);
      throw error;
    }
  }

  @Get('summary')
  @Roles(UserRole.Admin)
  @ApiOperation({
    summary: 'Get business metrics summary',
    description: 'Retrieve a condensed summary of key business metrics',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Business metrics summary retrieved successfully',
  })
  async getBusinessMetricsSummary() {
    try {
      const metrics = await this.businessMetricsService.getBusinessMetrics();

      const summary = {
        users: {
          total: metrics.totalUsers,
          active: metrics.activeUsers,
          growth: metrics.userGrowthRate,
          retention: metrics.userRetentionRate,
        },
        partners: {
          total: metrics.totalPartners,
          active: metrics.activePartners,
          growth: metrics.partnerGrowthRate,
          rating: metrics.averagePartnerRating,
        },
        bookings: {
          total: metrics.totalBookings,
          completed: metrics.completedBookings,
          completion_rate: metrics.bookingCompletionRate,
          average_value: metrics.averageBookingValue,
        },
        revenue: {
          total: metrics.totalRevenue,
          today: metrics.revenueToday,
          monthly: metrics.monthlyRecurringRevenue,
          per_user: metrics.averageRevenuePerUser,
        },
        performance: {
          conversion_rate: metrics.conversionRate,
          satisfaction: metrics.customerSatisfactionScore,
          uptime: metrics.systemUptime,
          response_time: metrics.averageResponseTime,
        },
      };

      return {
        success: true,
        data: summary,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error('Failed to get business metrics summary:', error);
      throw error;
    }
  }
}
