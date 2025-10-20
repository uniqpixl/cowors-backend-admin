import { Role } from '@/api/user/user.enum';
import { AuthGuard } from '@/auth/auth.guard';
import { Roles } from '@/decorators/roles.decorator';
import { RolesGuard } from '@/guards/roles.guard';
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
  Version,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ParseCoworsIdPipe } from '../../common/pipes/parse-cowors-id.pipe';
import { AnalyticsService } from './analytics.service';
import {
  AnalyticsDto,
  AnalyticsQueryDto,
  AnalyticsStatsDto,
  BulkCreateAnalyticsDto,
  CreateAnalyticsDto,
  DashboardDto,
  MetricTrendDto,
  UpdateAnalyticsDto,
} from './dto/analytics.dto';
import {
  AnalyticsType,
  MetricCategory,
  PREDEFINED_METRICS,
  TimeGranularity,
} from './entities/analytics.entity';

@ApiTags('Analytics')
@Controller('analytics')
@UseGuards(AuthGuard, RolesGuard)
@ApiBearerAuth()
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Post()
  @Roles(Role.Admin, Role.Moderator)
  @ApiOperation({ summary: 'Create a new analytics record' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Analytics record created successfully',
    type: AnalyticsDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data or duplicate record',
  })
  async create(@Body() createAnalyticsDto: CreateAnalyticsDto) {
    const analytics = await this.analyticsService.create(createAnalyticsDto);
    return new AnalyticsDto(analytics);
  }

  @Post('bulk')
  @Roles(Role.Admin, Role.Moderator)
  @ApiOperation({ summary: 'Create multiple analytics records in bulk' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Bulk analytics records created',
    schema: {
      type: 'object',
      properties: {
        created: {
          type: 'array',
          items: { $ref: '#/components/schemas/AnalyticsDto' },
        },
        errors: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              index: { type: 'number' },
              error: { type: 'string' },
            },
          },
        },
      },
    },
  })
  async bulkCreate(@Body() bulkCreateDto: BulkCreateAnalyticsDto) {
    const result = await this.analyticsService.bulkCreate(bulkCreateDto);
    return {
      created: result.created.map((analytics) => new AnalyticsDto(analytics)),
      errors: result.errors,
    };
  }

  @Get()
  @Roles(Role.Admin, Role.Moderator, Role.Partner, Role.User)
  @ApiOperation({
    summary: 'Get all analytics records with filtering and pagination',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Analytics records retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: { $ref: '#/components/schemas/AnalyticsDto' },
        },
        total: { type: 'number' },
        page: { type: 'number' },
        limit: { type: 'number' },
        totalPages: { type: 'number' },
      },
    },
  })
  async findAll(@Query() query: AnalyticsQueryDto) {
    const result = await this.analyticsService.findAll(query);
    return {
      ...result,
      data: result.data.map((analytics) => new AnalyticsDto(analytics)),
    };
  }

  @Get('stats')
  @Roles(Role.Admin, Role.Moderator)
  @ApiOperation({ summary: 'Get analytics statistics and summary' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Analytics statistics retrieved successfully',
    type: AnalyticsStatsDto,
  })
  async getStats(): Promise<AnalyticsStatsDto> {
    return await this.analyticsService.getStats();
  }

  @Get('dashboard')
  @Roles(Role.Admin, Role.Moderator, Role.Partner)
  @ApiOperation({
    summary: 'Get analytics dashboard with KPIs, trends, and alerts',
  })
  @ApiQuery({
    name: 'startDate',
    required: false,
    description: 'Start date (YYYY-MM-DD)',
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    description: 'End date (YYYY-MM-DD)',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Analytics dashboard retrieved successfully',
    type: DashboardDto,
  })
  async getDashboard(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ): Promise<DashboardDto> {
    return await this.analyticsService.getDashboard(startDate, endDate);
  }

  @Get('predefined-metrics')
  @Roles(Role.Admin, Role.Moderator)
  @ApiOperation({ summary: 'Get predefined metric configurations' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Predefined metrics retrieved successfully',
    schema: {
      type: 'object',
      additionalProperties: {
        type: 'object',
        properties: {
          type: { type: 'string', enum: Object.values(AnalyticsType) },
          category: { type: 'string', enum: Object.values(MetricCategory) },
          metricName: { type: 'string' },
          unit: { type: 'string' },
          description: { type: 'string' },
        },
      },
    },
  })
  async getPredefinedMetrics() {
    return await this.analyticsService.getPredefinedMetrics();
  }

  @Post('initialize-predefined')
  @Roles(Role.Admin)
  @ApiOperation({
    summary: 'Initialize predefined metrics with default values',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Predefined metrics initialized successfully',
    type: [AnalyticsDto],
  })
  async initializePredefinedMetrics() {
    const analytics = await this.analyticsService.initializePredefinedMetrics();
    return analytics.map((record) => new AnalyticsDto(record));
  }

  @Get('trends/:metricName')
  @Roles(Role.Admin, Role.Moderator, Role.Partner)
  @ApiOperation({ summary: 'Get trend analysis for a specific metric' })
  @ApiParam({
    name: 'metricName',
    description: 'Name of the metric to analyze',
  })
  @ApiQuery({
    name: 'startDate',
    required: true,
    description: 'Start date (YYYY-MM-DD)',
  })
  @ApiQuery({
    name: 'endDate',
    required: true,
    description: 'End date (YYYY-MM-DD)',
  })
  @ApiQuery({
    name: 'granularity',
    required: false,
    enum: TimeGranularity,
    description: 'Time granularity for the trend analysis',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Metric trend analysis retrieved successfully',
    type: MetricTrendDto,
  })
  async getMetricTrend(
    @Param('metricName') metricName: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('granularity') granularity?: TimeGranularity,
  ): Promise<MetricTrendDto> {
    return await this.analyticsService.getMetricTrend(
      metricName,
      startDate,
      endDate,
      granularity,
    );
  }

  @Get('by-type/:type')
  @Roles(Role.Admin, Role.Moderator, Role.Partner)
  @ApiOperation({ summary: 'Get analytics records by type' })
  @ApiParam({
    name: 'type',
    enum: AnalyticsType,
    description: 'Analytics type to filter by',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Analytics records by type retrieved successfully',
    type: [AnalyticsDto],
  })
  async getMetricsByType(@Param('type') type: AnalyticsType) {
    const analytics = await this.analyticsService.getMetricsByType(type);
    return analytics.map((record) => new AnalyticsDto(record));
  }

  @Get('by-category/:category')
  @Roles(Role.Admin, Role.Moderator, Role.Partner)
  @ApiOperation({ summary: 'Get analytics records by category' })
  @ApiParam({
    name: 'category',
    enum: MetricCategory,
    description: 'Metric category to filter by',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Analytics records by category retrieved successfully',
    type: [AnalyticsDto],
  })
  async getMetricsByCategory(@Param('category') category: MetricCategory) {
    const analytics =
      await this.analyticsService.getMetricsByCategory(category);
    return analytics.map((record) => new AnalyticsDto(record));
  }

  @Get('by-entity/:entityType/:entityId')
  @Roles(Role.Admin, Role.Moderator, Role.Partner)
  @ApiOperation({ summary: 'Get analytics records for a specific entity' })
  @ApiParam({
    name: 'entityType',
    description: 'Type of entity (user, booking, partner, etc.)',
  })
  @ApiParam({ name: 'entityId', description: 'ID of the specific entity' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Analytics records for entity retrieved successfully',
    type: [AnalyticsDto],
  })
  async getMetricsByEntity(
    @Param('entityType') entityType: string,
    @Param('entityId', ParseCoworsIdPipe) entityId: string,
  ) {
    const analytics = await this.analyticsService.getMetricsByEntity(
      entityType,
      entityId,
    );
    return analytics.map((record) => new AnalyticsDto(record));
  }

  @Get(':id')
  @Roles(Role.Admin, Role.Moderator, Role.Partner)
  @ApiOperation({ summary: 'Get a specific analytics record by ID' })
  @ApiParam({ name: 'id', description: 'Analytics record ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Analytics record retrieved successfully',
    type: AnalyticsDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Analytics record not found',
  })
  async findOne(@Param('id', ParseCoworsIdPipe) id: string) {
    const analytics = await this.analyticsService.findOne(id);
    return new AnalyticsDto(analytics);
  }

  @Patch(':id')
  @Roles(Role.Admin, Role.Moderator)
  @ApiOperation({ summary: 'Update an analytics record' })
  @ApiParam({ name: 'id', description: 'Analytics record ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Analytics record updated successfully',
    type: AnalyticsDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Analytics record not found',
  })
  async update(
    @Param('id', ParseCoworsIdPipe) id: string,
    @Body() updateAnalyticsDto: UpdateAnalyticsDto,
  ) {
    const analytics = await this.analyticsService.update(
      id,
      updateAnalyticsDto,
    );
    return new AnalyticsDto(analytics);
  }

  @Patch(':id/toggle-status')
  @Roles(Role.Admin, Role.Moderator)
  @ApiOperation({ summary: 'Toggle the active status of an analytics record' })
  @ApiParam({ name: 'id', description: 'Analytics record ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Analytics record status toggled successfully',
    type: AnalyticsDto,
  })
  async toggleStatus(@Param('id', ParseCoworsIdPipe) id: string) {
    const analytics = await this.analyticsService.toggleMetricStatus(id);
    return new AnalyticsDto(analytics);
  }

  @Patch(':id/toggle-visibility')
  @Roles(Role.Admin, Role.Moderator)
  @ApiOperation({
    summary: 'Toggle the public visibility of an analytics record',
  })
  @ApiParam({ name: 'id', description: 'Analytics record ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Analytics record visibility toggled successfully',
    type: AnalyticsDto,
  })
  async toggleVisibility(@Param('id', ParseCoworsIdPipe) id: string) {
    const analytics = await this.analyticsService.toggleMetricVisibility(id);
    return new AnalyticsDto(analytics);
  }

  @Delete(':id')
  @Roles(Role.Admin)
  @ApiOperation({ summary: 'Delete an analytics record' })
  @ApiParam({ name: 'id', description: 'Analytics record ID' })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Analytics record deleted successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Analytics record not found',
  })
  async remove(@Param('id', ParseCoworsIdPipe) id: string) {
    await this.analyticsService.remove(id);
  }
}
