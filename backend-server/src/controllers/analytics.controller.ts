import { Controller, Get, Query, UseGuards, Version } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { AuthGuard } from '@/auth/auth.guard';
import { Roles } from '../decorators/roles.decorator';
import { RolesGuard } from '../guards/roles.guard';
import {
  AnalyticsService,
  BookingTrendsData,
  DashboardKPIs,
  RevenueTrendsData,
  SpaceUtilizationData,
  UserGrowthData,
} from '../services/analytics.service';

@ApiTags('Admin Analytics')
@ApiBearerAuth()
@Controller('admin/analytics')
@UseGuards(AuthGuard, RolesGuard)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('dashboard/kpis')
  @Roles('admin')
  @ApiOperation({ summary: 'Get dashboard KPIs for admin' })
  @ApiResponse({
    status: 200,
    description: 'Dashboard KPIs retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async getDashboardKPIs(): Promise<DashboardKPIs> {
    return await this.analyticsService.getDashboardKPIs();
  }

  @Get('booking-trends')
  @Roles('admin')
  @ApiOperation({ summary: 'Get booking trends over time' })
  @ApiQuery({
    name: 'period',
    required: false,
    enum: ['day', 'week', 'month', 'year'],
    description: 'Time period for aggregation',
  })
  @ApiQuery({
    name: 'startDate',
    required: false,
    description: 'Start date for custom range (ISO string)',
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    description: 'End date for custom range (ISO string)',
  })
  @ApiQuery({
    name: 'granularity',
    required: false,
    enum: ['hour', 'day', 'week', 'month'],
    description: 'Data granularity',
  })
  @ApiResponse({
    status: 200,
    description: 'Booking trends retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async getBookingTrends(
    @Query('period') period?: 'day' | 'week' | 'month' | 'year',
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('granularity') granularity?: 'hour' | 'day' | 'week' | 'month',
  ): Promise<BookingTrendsData> {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;

    return await this.analyticsService.getBookingTrends(
      period,
      start,
      end,
      granularity,
    );
  }

  @Get('revenue-trends')
  @Roles('admin')
  @ApiOperation({ summary: 'Get revenue trends over time' })
  @ApiQuery({
    name: 'period',
    required: false,
    enum: ['day', 'week', 'month', 'year'],
    description: 'Time period for aggregation',
  })
  @ApiQuery({
    name: 'startDate',
    required: false,
    description: 'Start date for custom range (ISO string)',
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    description: 'End date for custom range (ISO string)',
  })
  @ApiQuery({
    name: 'granularity',
    required: false,
    enum: ['hour', 'day', 'week', 'month'],
    description: 'Data granularity',
  })
  @ApiResponse({
    status: 200,
    description: 'Revenue trends retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async getRevenueTrends(
    @Query('period') period?: 'day' | 'week' | 'month' | 'year',
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('granularity') granularity?: 'hour' | 'day' | 'week' | 'month',
  ): Promise<RevenueTrendsData> {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;

    return await this.analyticsService.getRevenueTrends(
      period,
      start,
      end,
      granularity,
    );
  }

  @Get('user-growth')
  @Roles('admin')
  @ApiOperation({ summary: 'Get user registration trends' })
  @ApiQuery({
    name: 'period',
    required: false,
    enum: ['day', 'week', 'month', 'year'],
    description: 'Time period for aggregation',
  })
  @ApiQuery({
    name: 'startDate',
    required: false,
    description: 'Start date for custom range (ISO string)',
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    description: 'End date for custom range (ISO string)',
  })
  @ApiQuery({
    name: 'granularity',
    required: false,
    enum: ['hour', 'day', 'week', 'month'],
    description: 'Data granularity',
  })
  @ApiResponse({
    status: 200,
    description: 'User growth trends retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async getUserGrowth(
    @Query('period') period?: 'day' | 'week' | 'month' | 'year',
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('granularity') granularity?: 'hour' | 'day' | 'week' | 'month',
  ): Promise<UserGrowthData> {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;

    return await this.analyticsService.getUserGrowth(
      period,
      start,
      end,
      granularity,
    );
  }

  @Get('space-utilization')
  @Roles('admin')
  @ApiOperation({ summary: 'Get space booking rates over time' })
  @ApiQuery({
    name: 'period',
    required: false,
    enum: ['day', 'week', 'month', 'year'],
    description: 'Time period for aggregation',
  })
  @ApiQuery({
    name: 'startDate',
    required: false,
    description: 'Start date for custom range (ISO string)',
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    description: 'End date for custom range (ISO string)',
  })
  @ApiQuery({
    name: 'granularity',
    required: false,
    enum: ['hour', 'day', 'week', 'month'],
    description: 'Data granularity',
  })
  @ApiResponse({
    status: 200,
    description: 'Space utilization trends retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async getSpaceUtilization(
    @Query('period') period?: 'day' | 'week' | 'month' | 'year',
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('granularity') granularity?: 'hour' | 'day' | 'week' | 'month',
  ): Promise<SpaceUtilizationData> {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;

    return await this.analyticsService.getSpaceUtilization(
      period,
      start,
      end,
      granularity,
    );
  }
}
