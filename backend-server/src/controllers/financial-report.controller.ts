import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
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

import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { CurrentUserSession } from '@/decorators/auth/current-user-session.decorator';
import {
  FinancialReportEntity,
  ReportStatus,
  ReportType,
} from '../database/entities/financial-report.entity';
import { Roles } from '../decorators/roles.decorator';
import { CreateFinancialReportDto } from '../dto/create-financial-report.dto';
import { UpdateFinancialReportDto } from '../dto/update-financial-report.dto';
import { RolesGuard } from '../guards/roles.guard';
import { FinancialReportService } from '../services/financial-report.service';

@ApiTags('Financial Reports')
@Controller('financial-reports')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class FinancialReportController {
  constructor(
    private readonly financialReportService: FinancialReportService,
  ) {}

  @Post()
  @Roles('admin', 'finance')
  @ApiOperation({ summary: 'Generate a new financial report' })
  @ApiResponse({
    status: 201,
    description: 'Financial report generation started',
    type: FinancialReportEntity,
  })
  async create(
    @Body() createReportDto: CreateFinancialReportDto,
    @CurrentUserSession() user: any,
  ): Promise<FinancialReportEntity> {
    return await this.financialReportService.create(createReportDto, user.id);
  }

  @Get()
  @Roles('admin', 'finance')
  @ApiOperation({
    summary: 'Get all financial reports with pagination and filters',
  })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiQuery({
    name: 'reportType',
    required: false,
    enum: ReportType,
    example: ReportType.REVENUE,
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ReportStatus,
    example: ReportStatus.COMPLETED,
  })
  @ApiQuery({
    name: 'generatedBy',
    required: false,
    type: String,
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Financial reports retrieved successfully',
  })
  async findAll(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('reportType') reportType?: ReportType,
    @Query('status') status?: ReportStatus,
    @Query('generatedBy') generatedBy?: string,
  ): Promise<{
    reports: FinancialReportEntity[];
    total: number;
    totalPages: number;
    currentPage: number;
  }> {
    return await this.financialReportService.findAll(
      page,
      limit,
      reportType,
      status,
      generatedBy,
    );
  }

  @Get('types')
  @Roles('admin', 'finance')
  @ApiOperation({ summary: 'Get available report types' })
  @ApiResponse({
    status: 200,
    description: 'Report types retrieved successfully',
  })
  async getReportTypes(): Promise<{
    reportTypes: { value: string; label: string; description: string }[];
  }> {
    const reportTypes = [
      {
        value: ReportType.REVENUE,
        label: 'Revenue Report',
        description:
          'Detailed revenue analysis by partner, space type, and time period',
      },
      {
        value: ReportType.COMMISSION,
        label: 'Commission Report',
        description: 'Commission earnings and distribution analysis',
      },
      {
        value: ReportType.PAYOUT,
        label: 'Payout Report',
        description: 'Partner payout history and status tracking',
      },
      {
        value: ReportType.TAX,
        label: 'Tax Report',
        description: 'Tax-related financial data and calculations',
      },
      {
        value: ReportType.PARTNER_PERFORMANCE,
        label: 'Partner Performance Report',
        description: 'Comprehensive partner performance metrics',
      },
      {
        value: ReportType.BOOKING_ANALYTICS,
        label: 'Booking Analytics Report',
        description: 'Booking trends, patterns, and customer behavior analysis',
      },
      {
        value: ReportType.FINANCIAL_SUMMARY,
        label: 'Financial Summary Report',
        description: 'High-level financial overview and key metrics',
      },
    ];

    return { reportTypes };
  }

  @Get('templates')
  @Roles('admin', 'finance')
  @ApiOperation({ summary: 'Get report templates and common filters' })
  @ApiResponse({
    status: 200,
    description: 'Report templates retrieved successfully',
  })
  async getReportTemplates(): Promise<{
    templates: {
      name: string;
      reportType: ReportType;
      defaultFilters: any;
      description: string;
    }[];
  }> {
    const templates = [
      {
        name: 'Monthly Revenue Summary',
        reportType: ReportType.REVENUE,
        defaultFilters: {
          periodType: 'monthly',
          includePartnerBreakdown: true,
          includeSpaceTypeBreakdown: true,
        },
        description: 'Monthly revenue breakdown by partners and space types',
      },
      {
        name: 'Partner Commission Statement',
        reportType: ReportType.COMMISSION,
        defaultFilters: {
          groupByPartner: true,
          includePayoutStatus: true,
        },
        description: 'Commission earnings statement for partners',
      },
      {
        name: 'Quarterly Financial Summary',
        reportType: ReportType.FINANCIAL_SUMMARY,
        defaultFilters: {
          periodType: 'quarterly',
          includeComparisons: true,
        },
        description: 'Comprehensive quarterly financial overview',
      },
      {
        name: 'Partner Performance Dashboard',
        reportType: ReportType.PARTNER_PERFORMANCE,
        defaultFilters: {
          includeBookingMetrics: true,
          includeRevenueMetrics: true,
          includeCustomerMetrics: true,
        },
        description: 'Complete partner performance analysis',
      },
    ];

    return { templates };
  }

  @Get(':id')
  @Roles('admin', 'finance')
  @ApiOperation({ summary: 'Get a specific financial report by ID' })
  @ApiResponse({
    status: 200,
    description: 'Financial report retrieved successfully',
    type: FinancialReportEntity,
  })
  async findOne(@Param('id') id: string): Promise<FinancialReportEntity> {
    return await this.financialReportService.findOne(id);
  }

  @Get(':id/download')
  @Roles('admin', 'finance')
  @ApiOperation({ summary: 'Get download URL for a completed report' })
  @ApiResponse({
    status: 200,
    description: 'Download URL retrieved successfully',
  })
  async getDownloadUrl(
    @Param('id') id: string,
  ): Promise<{ downloadUrl: string }> {
    const downloadUrl =
      await this.financialReportService.getReportDownloadUrl(id);
    return { downloadUrl };
  }

  @Delete(':id')
  @Roles('admin', 'finance')
  @ApiOperation({ summary: 'Delete a financial report' })
  @ApiResponse({
    status: 200,
    description: 'Financial report deleted successfully',
  })
  async remove(@Param('id') id: string): Promise<{ message: string }> {
    await this.financialReportService.remove(id);
    return { message: 'Financial report deleted successfully' };
  }

  @Post('bulk-generate')
  @Roles('admin', 'finance')
  @ApiOperation({ summary: 'Generate multiple reports in bulk' })
  @ApiResponse({
    status: 201,
    description: 'Bulk report generation started',
  })
  async bulkGenerate(
    @Body()
    bulkReportDto: {
      reports: CreateFinancialReportDto[];
      scheduleFor?: string;
    },
    @CurrentUserSession() user: any,
  ): Promise<{
    message: string;
    reportIds: string[];
  }> {
    const reportPromises = bulkReportDto.reports.map((reportDto) =>
      this.financialReportService.create(reportDto, user.id),
    );

    const reports = await Promise.all(reportPromises);
    const reportIds = reports.map((report) => report.id);

    return {
      message: `${reports.length} reports queued for generation`,
      reportIds,
    };
  }

  @Get('analytics/dashboard')
  @Roles('admin', 'finance')
  @ApiOperation({ summary: 'Get financial dashboard analytics' })
  @ApiQuery({
    name: 'period',
    required: false,
    type: String,
    example: '30d',
    description: 'Time period: 7d, 30d, 90d, 1y',
  })
  @ApiResponse({
    status: 200,
    description: 'Financial dashboard data retrieved successfully',
  })
  async getFinancialDashboard(
    @Query('period') period: string = '30d',
  ): Promise<{
    summary: {
      totalReports: number;
      completedReports: number;
      failedReports: number;
      pendingReports: number;
    };
    recentReports: FinancialReportEntity[];
    reportsByType: Record<string, number>;
    reportsByStatus: Record<string, number>;
  }> {
    // Calculate date range based on period
    const endDate = new Date();
    const startDate = new Date();

    switch (period) {
      case '7d':
        startDate.setDate(endDate.getDate() - 7);
        break;
      case '90d':
        startDate.setDate(endDate.getDate() - 90);
        break;
      case '1y':
        startDate.setFullYear(endDate.getFullYear() - 1);
        break;
      default: // 30d
        startDate.setDate(endDate.getDate() - 30);
    }

    const { reports } = await this.financialReportService.findAll(
      1,
      1000, // Get all reports for analytics
    );

    const periodReports = reports.filter(
      (report) => report.createdAt >= startDate && report.createdAt <= endDate,
    );

    const summary = {
      totalReports: periodReports.length,
      completedReports: periodReports.filter(
        (r) => r.status === ReportStatus.COMPLETED,
      ).length,
      failedReports: periodReports.filter(
        (r) => r.status === ReportStatus.FAILED,
      ).length,
      pendingReports: periodReports.filter(
        (r) => r.status === ReportStatus.GENERATING,
      ).length,
    };

    const recentReports = reports.slice(0, 10);

    const reportsByType = periodReports.reduce(
      (acc, report) => {
        acc[report.reportType] = (acc[report.reportType] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    const reportsByStatus = periodReports.reduce(
      (acc, report) => {
        acc[report.status] = (acc[report.status] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    return {
      summary,
      recentReports,
      reportsByType,
      reportsByStatus,
    };
  }
}
