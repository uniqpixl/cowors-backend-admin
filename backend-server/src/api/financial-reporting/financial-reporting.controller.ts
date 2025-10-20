import {
  Body,
  Controller,
  DefaultValuePipe,
  Get,
  HttpStatus,
  Logger,
  ParseIntPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

import { Role as UserRole } from '@/api/user/user.enum';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { Roles } from '@/decorators/roles.decorator';
import { RolesGuard } from '@/guards/roles.guard';

import {
  FinancialReportFilters,
  FinancialReportingService,
} from './financial-reporting.service';

export class FinancialReportFiltersDto {
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsString()
  partnerId?: string;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsString()
  transactionType?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  minAmount?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  maxAmount?: number;
}

export class TrendIntervalDto {
  @IsOptional()
  @IsEnum(['day', 'week', 'month'])
  interval?: 'day' | 'week' | 'month' = 'day';
}

@ApiTags('Financial Reporting')
@Controller('financial-reporting')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class FinancialReportingController {
  private readonly logger = new Logger(FinancialReportingController.name);

  constructor(
    private readonly financialReportingService: FinancialReportingService,
  ) {}

  @Get('dashboard')
  @Roles(UserRole.Admin, UserRole.SuperAdmin)
  @ApiOperation({
    summary: 'Get financial dashboard data',
    description:
      'Retrieve comprehensive financial dashboard with metrics, trends, and alerts',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Financial dashboard data retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        metrics: {
          type: 'object',
          properties: {
            totalRevenue: { type: 'number' },
            totalRefunds: { type: 'number' },
            netRevenue: { type: 'number' },
            totalTransactions: { type: 'number' },
            averageTransactionValue: { type: 'number' },
            commissionEarned: { type: 'number' },
            partnerPayouts: { type: 'number' },
            walletBalance: { type: 'number' },
            pendingPayments: { type: 'number' },
            failedTransactions: { type: 'number' },
            refundRate: { type: 'number' },
            conversionRate: { type: 'number' },
          },
        },
        revenueBreakdown: {
          type: 'object',
          properties: {
            bookingRevenue: { type: 'number' },
            commissionRevenue: { type: 'number' },
            feeRevenue: { type: 'number' },
            otherRevenue: { type: 'number' },
            totalRevenue: { type: 'number' },
          },
        },
        trends: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              period: { type: 'string' },
              revenue: { type: 'number' },
              transactions: { type: 'number' },
              refunds: { type: 'number' },
              averageValue: { type: 'number' },
            },
          },
        },
        topPartners: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              partnerId: { type: 'string' },
              partnerName: { type: 'string' },
              revenue: { type: 'number' },
              transactions: { type: 'number' },
              commission: { type: 'number' },
            },
          },
        },
        recentTransactions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              type: { type: 'string' },
              amount: { type: 'number' },
              status: { type: 'string' },
              createdAt: { type: 'string', format: 'date-time' },
              description: { type: 'string' },
            },
          },
        },
        alerts: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              type: { type: 'string', enum: ['warning', 'error', 'info'] },
              message: { type: 'string' },
              timestamp: { type: 'string', format: 'date-time' },
              severity: {
                type: 'string',
                enum: ['low', 'medium', 'high', 'critical'],
              },
            },
          },
        },
      },
    },
  })
  @ApiQuery({
    name: 'startDate',
    required: false,
    type: String,
    description: 'Start date for filtering (ISO string)',
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    type: String,
    description: 'End date for filtering (ISO string)',
  })
  @ApiQuery({
    name: 'partnerId',
    required: false,
    type: String,
    description: 'Filter by partner ID',
  })
  @ApiQuery({
    name: 'currency',
    required: false,
    type: String,
    description: 'Filter by currency',
  })
  async getFinancialDashboard(@Query() filtersDto: FinancialReportFiltersDto) {
    try {
      const filters: FinancialReportFilters = {
        ...filtersDto,
        startDate: filtersDto.startDate
          ? new Date(filtersDto.startDate)
          : undefined,
        endDate: filtersDto.endDate ? new Date(filtersDto.endDate) : undefined,
      };

      const dashboard =
        await this.financialReportingService.getFinancialDashboard(filters);

      this.logger.log(
        `Financial dashboard retrieved for filters: ${JSON.stringify(filters)}`,
      );

      return {
        success: true,
        data: dashboard,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error('Failed to get financial dashboard:', error);
      throw error;
    }
  }

  @Get('metrics')
  @Roles(UserRole.Admin, UserRole.SuperAdmin)
  @ApiOperation({
    summary: 'Get financial metrics',
    description: 'Retrieve key financial metrics and KPIs',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Financial metrics retrieved successfully',
  })
  async getFinancialMetrics(@Query() filtersDto: FinancialReportFiltersDto) {
    try {
      const filters: FinancialReportFilters = {
        ...filtersDto,
        startDate: filtersDto.startDate
          ? new Date(filtersDto.startDate)
          : undefined,
        endDate: filtersDto.endDate ? new Date(filtersDto.endDate) : undefined,
      };

      const metrics =
        await this.financialReportingService.getFinancialMetrics(filters);

      return {
        success: true,
        data: metrics,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error('Failed to get financial metrics:', error);
      throw error;
    }
  }

  @Get('revenue-breakdown')
  @Roles(UserRole.Admin, UserRole.SuperAdmin)
  @ApiOperation({
    summary: 'Get revenue breakdown',
    description: 'Retrieve detailed breakdown of revenue by type',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Revenue breakdown retrieved successfully',
  })
  async getRevenueBreakdown(@Query() filtersDto: FinancialReportFiltersDto) {
    try {
      const filters: FinancialReportFilters = {
        ...filtersDto,
        startDate: filtersDto.startDate
          ? new Date(filtersDto.startDate)
          : undefined,
        endDate: filtersDto.endDate ? new Date(filtersDto.endDate) : undefined,
      };

      const breakdown =
        await this.financialReportingService.getRevenueBreakdown(filters);

      return {
        success: true,
        data: breakdown,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error('Failed to get revenue breakdown:', error);
      throw error;
    }
  }

  @Get('trends')
  @Roles(UserRole.Admin, UserRole.SuperAdmin)
  @ApiOperation({
    summary: 'Get transaction trends',
    description:
      'Retrieve transaction trends over time with configurable intervals',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Transaction trends retrieved successfully',
  })
  @ApiQuery({
    name: 'startDate',
    required: true,
    type: String,
    description: 'Start date (ISO string)',
  })
  @ApiQuery({
    name: 'endDate',
    required: true,
    type: String,
    description: 'End date (ISO string)',
  })
  @ApiQuery({
    name: 'interval',
    required: false,
    enum: ['day', 'week', 'month'],
    description: 'Time interval for trends',
  })
  async getTransactionTrends(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('interval', new DefaultValuePipe('day'))
    interval: 'day' | 'week' | 'month',
  ) {
    try {
      const trends = await this.financialReportingService.getTransactionTrends(
        new Date(startDate),
        new Date(endDate),
        interval,
      );

      return {
        success: true,
        data: trends,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error('Failed to get transaction trends:', error);
      throw error;
    }
  }

  @Get('top-partners')
  @Roles(UserRole.Admin, UserRole.SuperAdmin)
  @ApiOperation({
    summary: 'Get top performing partners',
    description: 'Retrieve top partners by revenue and transaction volume',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Top partners retrieved successfully',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Number of top partners to return',
  })
  async getTopPartners(
    @Query() filtersDto: FinancialReportFiltersDto,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    try {
      const filters: FinancialReportFilters = {
        ...filtersDto,
        startDate: filtersDto.startDate
          ? new Date(filtersDto.startDate)
          : undefined,
        endDate: filtersDto.endDate ? new Date(filtersDto.endDate) : undefined,
      };

      const topPartners = await this.financialReportingService.getTopPartners(
        filters,
        limit,
      );

      return {
        success: true,
        data: topPartners,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error('Failed to get top partners:', error);
      throw error;
    }
  }

  @Get('recent-transactions')
  @Roles(UserRole.Admin, UserRole.SuperAdmin)
  @ApiOperation({
    summary: 'Get recent transactions',
    description: 'Retrieve most recent financial transactions',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Recent transactions retrieved successfully',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Number of transactions to return',
  })
  async getRecentTransactions(
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    try {
      const transactions =
        await this.financialReportingService.getRecentTransactions(limit);

      return {
        success: true,
        data: transactions,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error('Failed to get recent transactions:', error);
      throw error;
    }
  }

  @Get('alerts')
  @Roles(UserRole.Admin, UserRole.SuperAdmin)
  @ApiOperation({
    summary: 'Get financial alerts',
    description: 'Retrieve current financial alerts and warnings',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Financial alerts retrieved successfully',
  })
  async getFinancialAlerts() {
    try {
      const alerts = await this.financialReportingService.getFinancialAlerts();

      return {
        success: true,
        data: alerts,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error('Failed to get financial alerts:', error);
      throw error;
    }
  }

  @Post('generate-report')
  @Roles(UserRole.Admin, UserRole.SuperAdmin)
  @ApiOperation({
    summary: 'Generate comprehensive financial report',
    description:
      'Generate a detailed financial report with all metrics and data',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Financial report generated successfully',
  })
  @ApiBody({
    type: FinancialReportFiltersDto,
    description: 'Filters for the financial report',
  })
  async generateFinancialReport(@Body() filtersDto: FinancialReportFiltersDto) {
    try {
      const filters: FinancialReportFilters = {
        ...filtersDto,
        startDate: filtersDto.startDate
          ? new Date(filtersDto.startDate)
          : undefined,
        endDate: filtersDto.endDate ? new Date(filtersDto.endDate) : undefined,
      };

      const report =
        await this.financialReportingService.generateFinancialReport(filters);

      this.logger.log(
        `Financial report generated for period: ${report.period.startDate} to ${report.period.endDate}`,
      );

      return {
        success: true,
        data: report,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error('Failed to generate financial report:', error);
      throw error;
    }
  }

  @Get('export')
  @Roles(UserRole.Admin, UserRole.SuperAdmin)
  @ApiOperation({
    summary: 'Export financial data',
    description: 'Export financial data in various formats (CSV, Excel, PDF)',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Financial data exported successfully',
  })
  @ApiQuery({
    name: 'format',
    required: false,
    enum: ['csv', 'excel', 'pdf'],
    description: 'Export format',
  })
  async exportFinancialData(
    @Query() filtersDto: FinancialReportFiltersDto,
    @Query('format', new DefaultValuePipe('csv'))
    format: 'csv' | 'excel' | 'pdf',
  ) {
    try {
      const filters: FinancialReportFilters = {
        ...filtersDto,
        startDate: filtersDto.startDate
          ? new Date(filtersDto.startDate)
          : undefined,
        endDate: filtersDto.endDate ? new Date(filtersDto.endDate) : undefined,
      };

      // For now, return the data - actual export functionality would be implemented here
      const report =
        await this.financialReportingService.generateFinancialReport(filters);

      this.logger.log(`Financial data export requested in ${format} format`);

      return {
        success: true,
        data: {
          format,
          report,
          downloadUrl: `/api/financial-reporting/download/${Date.now()}.${format}`, // Mock URL
        },
        message: `Financial data prepared for ${format.toUpperCase()} export`,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error('Failed to export financial data:', error);
      throw error;
    }
  }

  @Get('real-time-metrics')
  @Roles(UserRole.Admin, UserRole.SuperAdmin)
  @ApiOperation({
    summary: 'Get real-time financial metrics',
    description: 'Retrieve live financial metrics for real-time monitoring',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Real-time metrics retrieved successfully',
  })
  async getRealTimeMetrics() {
    try {
      // Get metrics for the last hour for real-time view
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      const now = new Date();

      const filters: FinancialReportFilters = {
        startDate: oneHourAgo,
        endDate: now,
      };

      const [metrics, alerts, recentTransactions] = await Promise.all([
        this.financialReportingService.getFinancialMetrics(filters),
        this.financialReportingService.getFinancialAlerts(),
        this.financialReportingService.getRecentTransactions(5),
      ]);

      return {
        success: true,
        data: {
          metrics,
          alerts: alerts.filter(
            (alert) =>
              alert.severity === 'high' || alert.severity === 'critical',
          ),
          recentTransactions,
          lastUpdated: new Date().toISOString(),
        },
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error('Failed to get real-time metrics:', error);
      throw error;
    }
  }
}
