import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
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
  BookingAnalytics,
  CustomerAnalytics,
  PartnerAnalyticsService,
  PartnerDashboardAnalytics,
  RevenueAnalytics,
  SpaceAnalytics,
} from '../services/partner-analytics.service';

@ApiTags('Partner Analytics')
@ApiBearerAuth()
@Controller('v1/partners')
@UseGuards(AuthGuard, RolesGuard)
export class PartnerAnalyticsController {
  constructor(
    private readonly partnerAnalyticsService: PartnerAnalyticsService,
  ) {}

  @Get(':partnerId/analytics/dashboard')
  @Roles('admin', 'partner')
  @ApiOperation({ summary: 'Get partner dashboard analytics' })
  @ApiQuery({
    name: 'startDate',
    required: false,
    description: 'Start date for analytics (ISO string)',
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    description: 'End date for analytics (ISO string)',
  })
  @ApiResponse({
    status: 200,
    description: 'Dashboard analytics retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async getDashboardAnalytics(
    @Param('partnerId') partnerId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ): Promise<PartnerDashboardAnalytics> {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;

    return await this.partnerAnalyticsService.getDashboardAnalytics(
      partnerId,
      start,
      end,
    );
  }

  @Get(':partnerId/analytics/revenue')
  @Roles('admin', 'partner')
  @ApiOperation({ summary: 'Get partner revenue analytics' })
  @ApiQuery({
    name: 'startDate',
    required: false,
    description: 'Start date for analytics (ISO string)',
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    description: 'End date for analytics (ISO string)',
  })
  @ApiResponse({
    status: 200,
    description: 'Revenue analytics retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async getRevenueAnalytics(
    @Param('partnerId') partnerId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ): Promise<RevenueAnalytics> {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;

    return await this.partnerAnalyticsService.getRevenueAnalytics(
      partnerId,
      start,
      end,
    );
  }

  @Get(':partnerId/analytics/bookings')
  @Roles('admin', 'partner')
  @ApiOperation({ summary: 'Get partner booking analytics' })
  @ApiQuery({
    name: 'startDate',
    required: false,
    description: 'Start date for analytics (ISO string)',
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    description: 'End date for analytics (ISO string)',
  })
  @ApiResponse({
    status: 200,
    description: 'Booking analytics retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async getBookingAnalytics(
    @Param('partnerId') partnerId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ): Promise<BookingAnalytics> {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;

    return await this.partnerAnalyticsService.getBookingAnalytics(
      partnerId,
      start,
      end,
    );
  }

  @Get(':partnerId/analytics/spaces')
  @Roles('admin', 'partner')
  @ApiOperation({ summary: 'Get partner space analytics' })
  @ApiQuery({
    name: 'startDate',
    required: false,
    description: 'Start date for analytics (ISO string)',
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    description: 'End date for analytics (ISO string)',
  })
  @ApiResponse({
    status: 200,
    description: 'Space analytics retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async getSpaceAnalytics(
    @Param('partnerId') partnerId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ): Promise<SpaceAnalytics> {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;

    return await this.partnerAnalyticsService.getSpaceAnalytics(
      partnerId,
      start,
      end,
    );
  }

  @Get(':partnerId/analytics/customers')
  @Roles('admin', 'partner')
  @ApiOperation({ summary: 'Get partner customer analytics' })
  @ApiQuery({
    name: 'startDate',
    required: false,
    description: 'Start date for analytics (ISO string)',
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    description: 'End date for analytics (ISO string)',
  })
  @ApiResponse({
    status: 200,
    description: 'Customer analytics retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async getCustomerAnalytics(
    @Param('partnerId') partnerId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ): Promise<CustomerAnalytics> {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;

    return await this.partnerAnalyticsService.getCustomerAnalytics(
      partnerId,
      start,
      end,
    );
  }

  @Get(':partnerId/commission-history')
  @Roles('admin', 'partner')
  @ApiOperation({ summary: 'Get partner commission history' })
  @ApiQuery({
    name: 'startDate',
    required: false,
    description: 'Start date for commission history (ISO string)',
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    description: 'End date for commission history (ISO string)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Number of records to return',
    type: Number,
  })
  @ApiQuery({
    name: 'offset',
    required: false,
    description: 'Number of records to skip',
    type: Number,
  })
  @ApiResponse({
    status: 200,
    description: 'Commission history retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async getCommissionHistory(
    @Param('partnerId') partnerId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ): Promise<{
    commissions: Array<{
      id: string;
      bookingId: string;
      amount: number;
      commissionRate: number;
      commissionAmount: number;
      status: string;
      createdAt: Date;
    }>;
    total: number;
    totalCommission: number;
  }> {
    // This would typically be implemented in a separate commission service
    // For now, returning a mock response structure
    return {
      commissions: [],
      total: 0,
      totalCommission: 0,
    };
  }

  @Get(':partnerId/commission-analytics')
  @Roles('admin', 'partner')
  @ApiOperation({ summary: 'Get partner commission analytics' })
  @ApiQuery({
    name: 'startDate',
    required: false,
    description: 'Start date for analytics (ISO string)',
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    description: 'End date for analytics (ISO string)',
  })
  @ApiResponse({
    status: 200,
    description: 'Commission analytics retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async getCommissionAnalytics(
    @Param('partnerId') partnerId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ): Promise<{
    totalCommission: number;
    averageCommissionRate: number;
    monthlyCommissions: Array<{
      month: string;
      commission: number;
      bookings: number;
    }>;
    commissionBySpaceType: Array<{
      spaceType: string;
      commission: number;
      percentage: number;
    }>;
  }> {
    // This would typically be implemented in a separate commission service
    // For now, returning a mock response structure
    return {
      totalCommission: 0,
      averageCommissionRate: 0,
      monthlyCommissions: [],
      commissionBySpaceType: [],
    };
  }
}
