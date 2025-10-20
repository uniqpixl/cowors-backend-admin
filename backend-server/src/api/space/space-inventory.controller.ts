import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { CurrentUserSession } from '@/decorators/auth/current-user-session.decorator';
import { Roles } from '@/decorators/roles.decorator';
import { RolesGuard } from '@/guards/roles.guard';
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ParseCoworsIdPipe } from '../../common/pipes/parse-cowors-id.pipe';
import {
  BulkInventoryOperationDto,
  BulkInventoryOperationType,
  CreatePricingConfigDto,
  CreateSpaceExtrasDto,
  CreateSpacePackageDto,
  ExportFormat,
  ExtrasType,
  InventoryStatus,
  PackageType,
  PricingConfigResponseDto,
  PricingType,
  ReportType,
  SpaceExtrasResponseDto,
  SpaceInventoryAnalyticsDto,
  SpaceInventoryExportDto,
  SpaceInventoryReportDto,
  SpaceInventoryReportResponseDto,
  SpaceInventoryResponseDto,
  SpaceInventorySettingsDto,
  SpacePackageResponseDto,
  UpdateInventoryDto,
  UpdatePricingConfigDto,
  UpdateSpaceExtrasDto,
  UpdateSpacePackageDto,
} from './dto/space-inventory.dto';
import { SpaceInventoryService } from './space-inventory.service';

@ApiTags('Space Inventory Management')
@Controller('space-inventory')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class SpaceInventoryController {
  constructor(private readonly spaceInventoryService: SpaceInventoryService) {}

  // Space Package Management
  @Post('packages')
  @Roles('admin', 'partner')
  @ApiOperation({ summary: 'Create space package' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Package created successfully',
    type: SpacePackageResponseDto,
  })
  @UsePipes(new ValidationPipe({ transform: true }))
  async createSpacePackage(
    @Body() createDto: CreateSpacePackageDto,
    @CurrentUserSession('user') user: any,
  ): Promise<SpacePackageResponseDto> {
    return this.spaceInventoryService.createSpacePackage(createDto, user.id);
  }

  @Put('packages/:id')
  @Roles('admin', 'partner')
  @ApiOperation({ summary: 'Update space package' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Package updated successfully',
    type: SpacePackageResponseDto,
  })
  @UsePipes(new ValidationPipe({ transform: true }))
  async updateSpacePackage(
    @Param('id', ParseCoworsIdPipe) id: string,
    @Body() updateDto: UpdateSpacePackageDto,
    @CurrentUserSession('user') user: any,
  ): Promise<SpacePackageResponseDto> {
    return this.spaceInventoryService.updateSpacePackage(
      id,
      updateDto,
      user.id,
    );
  }

  @Get('packages/:id')
  @Roles('admin', 'partner', 'customer')
  @ApiOperation({ summary: 'Get space package by ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Package retrieved successfully',
    type: SpacePackageResponseDto,
  })
  async getSpacePackage(
    @Param('id', ParseCoworsIdPipe) id: string,
  ): Promise<SpacePackageResponseDto> {
    return this.spaceInventoryService.getSpacePackage(id);
  }

  @Get('packages')
  @Roles('admin', 'partner', 'customer')
  @ApiOperation({ summary: 'Get all space packages' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Packages retrieved successfully',
    type: [SpacePackageResponseDto],
  })
  @ApiQuery({
    name: 'spaceId',
    required: false,
    description: 'Filter by space ID',
  })
  @ApiQuery({
    name: 'packageType',
    required: false,
    enum: PackageType,
    description: 'Filter by package type',
  })
  @ApiQuery({
    name: 'isActive',
    required: false,
    type: Boolean,
    description: 'Filter by active status',
  })
  @ApiQuery({
    name: 'priceMin',
    required: false,
    type: Number,
    description: 'Minimum price filter',
  })
  @ApiQuery({
    name: 'priceMax',
    required: false,
    type: Number,
    description: 'Maximum price filter',
  })
  async getAllSpacePackages(
    @Query('spaceId') spaceId?: string,
    @Query('packageType') packageType?: PackageType,
    @Query('isActive') isActive?: boolean,
    @Query('priceMin') priceMin?: number,
    @Query('priceMax') priceMax?: number,
  ): Promise<SpacePackageResponseDto[]> {
    return this.spaceInventoryService.getSpacePackages({
      spaceId,
      packageType,
      isActive,
      priceMin,
      priceMax,
    });
  }

  @Delete('packages/:id')
  @Roles('admin', 'partner')
  @ApiOperation({ summary: 'Delete space package' })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Package deleted successfully',
  })
  async deleteSpacePackage(
    @Param('id', ParseCoworsIdPipe) id: string,
    @CurrentUserSession('user') user: any,
  ): Promise<void> {
    return this.spaceInventoryService.deleteSpacePackage(id, user.id);
  }

  // Space Extras Management
  @Post('extras')
  @Roles('admin', 'partner')
  @ApiOperation({ summary: 'Create space extras' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Extras created successfully',
    type: SpaceExtrasResponseDto,
  })
  @UsePipes(new ValidationPipe({ transform: true }))
  async createSpaceExtras(
    @Body() createDto: CreateSpaceExtrasDto,
    @CurrentUserSession('user') user: any,
  ): Promise<SpaceExtrasResponseDto> {
    return this.spaceInventoryService.createSpaceExtras(createDto, user.id);
  }

  @Put('extras/:id')
  @Roles('admin', 'partner')
  @ApiOperation({ summary: 'Update space extras' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Extras updated successfully',
    type: SpaceExtrasResponseDto,
  })
  @UsePipes(new ValidationPipe({ transform: true }))
  async updateSpaceExtras(
    @Param('id', ParseCoworsIdPipe) id: string,
    @Body() updateDto: UpdateSpaceExtrasDto,
    @CurrentUserSession('user') user: any,
  ): Promise<SpaceExtrasResponseDto> {
    return this.spaceInventoryService.updateSpaceExtras(id, updateDto, user.id);
  }

  @Get('extras/:id')
  @Roles('admin', 'partner', 'customer')
  @ApiOperation({ summary: 'Get space extras by ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Extras retrieved successfully',
    type: SpaceExtrasResponseDto,
  })
  async getSpaceExtrasById(
    @Param('id', ParseCoworsIdPipe) id: string,
  ): Promise<SpaceExtrasResponseDto> {
    return this.spaceInventoryService.getSpaceExtrasById(id);
  }

  @Get('extras')
  @Roles('admin', 'partner', 'customer')
  @ApiOperation({ summary: 'Get all space extras' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Extras retrieved successfully',
    type: [SpaceExtrasResponseDto],
  })
  @ApiQuery({
    name: 'spaceId',
    required: false,
    description: 'Filter by space ID',
  })
  @ApiQuery({
    name: 'extrasType',
    required: false,
    enum: ExtrasType,
    description: 'Filter by extras type',
  })
  @ApiQuery({
    name: 'isActive',
    required: false,
    type: Boolean,
    description: 'Filter by active status',
  })
  @ApiQuery({
    name: 'category',
    required: false,
    description: 'Filter by category',
  })
  async getAllSpaceExtras(
    @Query('spaceId') spaceId?: string,
    @Query('extrasType') extrasType?: ExtrasType,
    @Query('isActive') isActive?: boolean,
    @Query('category') category?: string,
  ): Promise<SpaceExtrasResponseDto[]> {
    return this.spaceInventoryService.getSpaceExtras({
      spaceId,
      extrasType,
      isActive,
      category,
    });
  }

  @Delete('extras/:id')
  @Roles('admin', 'partner')
  @ApiOperation({ summary: 'Delete space extras' })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Extras deleted successfully',
  })
  async deleteSpaceExtras(
    @Param('id', ParseCoworsIdPipe) id: string,
    @CurrentUserSession('user') user: any,
  ): Promise<void> {
    return this.spaceInventoryService.deleteSpaceExtras(id, user.id);
  }

  // Inventory Tracking
  @Put('inventory/:spaceId')
  @Roles('admin', 'partner')
  @ApiOperation({ summary: 'Update space inventory' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Inventory updated successfully',
    type: SpaceInventoryResponseDto,
  })
  @UsePipes(new ValidationPipe({ transform: true }))
  async updateInventory(
    @Param('spaceId', ParseCoworsIdPipe) spaceId: string,
    @Body() updateDto: UpdateInventoryDto,
    @CurrentUserSession('user') user: any,
  ): Promise<SpaceInventoryResponseDto> {
    return this.spaceInventoryService.updateInventory(
      spaceId,
      updateDto,
      user.id,
    );
  }

  @Get('inventory/:spaceId')
  @Roles('admin', 'partner', 'customer')
  @ApiOperation({ summary: 'Get space inventory' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Inventory retrieved successfully',
    type: SpaceInventoryResponseDto,
  })
  async getInventory(
    @Param('spaceId', ParseCoworsIdPipe) spaceId: string,
  ): Promise<SpaceInventoryResponseDto> {
    return this.spaceInventoryService.getInventory(spaceId);
  }

  @Get('inventory')
  @Roles('admin', 'partner')
  @ApiOperation({ summary: 'Get all space inventories' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Inventories retrieved successfully',
    type: [SpaceInventoryResponseDto],
  })
  @ApiQuery({
    name: 'partnerId',
    required: false,
    description: 'Filter by partner ID',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: InventoryStatus,
    description: 'Filter by inventory status',
  })
  @ApiQuery({
    name: 'lowStock',
    required: false,
    type: Boolean,
    description: 'Filter by low stock status',
  })
  @ApiQuery({
    name: 'dateFrom',
    required: false,
    description: 'Filter from date (YYYY-MM-DD)',
  })
  @ApiQuery({
    name: 'dateTo',
    required: false,
    description: 'Filter to date (YYYY-MM-DD)',
  })
  async getAllInventories(
    @Query('partnerId') partnerId?: string,
    @Query('status') status?: InventoryStatus,
    @Query('lowStock') lowStock?: boolean,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ): Promise<SpaceInventoryResponseDto[]> {
    return this.spaceInventoryService.getInventories({
      partnerId,
      status,
      lowStock,
      dateFrom,
      dateTo,
    });
  }

  @Post('inventory/:spaceId/check-availability')
  @Roles('admin', 'partner', 'customer')
  @ApiOperation({ summary: 'Check space availability' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Availability checked successfully',
  })
  async checkAvailability(
    @Param('spaceId', ParseCoworsIdPipe) spaceId: string,
    @Body() checkData: { startDate: Date; endDate: Date; capacity?: number },
  ): Promise<{
    available: boolean;
    availableCapacity: number;
    conflictingBookings: any[];
  }> {
    // TODO: Implement space availability check
    return {
      available: true,
      availableCapacity: 100,
      conflictingBookings: [],
    };
  }

  // Pricing Configuration
  @Post('pricing')
  @Roles('admin', 'partner')
  @ApiOperation({ summary: 'Create pricing configuration' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Pricing configuration created successfully',
    type: PricingConfigResponseDto,
  })
  @UsePipes(new ValidationPipe({ transform: true }))
  async createPricingConfig(
    @Body() createDto: CreatePricingConfigDto,
    @CurrentUserSession('user') user: any,
  ): Promise<PricingConfigResponseDto> {
    return this.spaceInventoryService.createPricingConfig(createDto, user.id);
  }

  @Put('pricing/:id')
  @Roles('admin', 'partner')
  @ApiOperation({ summary: 'Update pricing configuration' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Pricing configuration updated successfully',
    type: PricingConfigResponseDto,
  })
  @UsePipes(new ValidationPipe({ transform: true }))
  async updatePricingConfig(
    @Param('id', ParseCoworsIdPipe) id: string,
    @Body() updateDto: UpdatePricingConfigDto,
    @CurrentUserSession('user') user: any,
  ): Promise<PricingConfigResponseDto> {
    return this.spaceInventoryService.updatePricingConfig(
      id,
      updateDto,
      user.id,
    );
  }

  @Get('pricing/:id')
  @Roles('admin', 'partner', 'customer')
  @ApiOperation({ summary: 'Get pricing configuration by ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Pricing configuration retrieved successfully',
    type: PricingConfigResponseDto,
  })
  async getPricingConfig(
    @Param('id', ParseCoworsIdPipe) id: string,
  ): Promise<PricingConfigResponseDto> {
    return this.spaceInventoryService.getPricingConfig(id);
  }

  @Get('pricing')
  @Roles('admin', 'partner', 'customer')
  @ApiOperation({ summary: 'Get all pricing configurations' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Pricing configurations retrieved successfully',
    type: [PricingConfigResponseDto],
  })
  @ApiQuery({
    name: 'spaceId',
    required: false,
    description: 'Filter by space ID',
  })
  @ApiQuery({
    name: 'pricingType',
    required: false,
    enum: PricingType,
    description: 'Filter by pricing type',
  })
  @ApiQuery({
    name: 'isActive',
    required: false,
    type: Boolean,
    description: 'Filter by active status',
  })
  async getAllPricingConfigs(
    @Query('spaceId') spaceId?: string,
    @Query('pricingType') pricingType?: PricingType,
    @Query('isActive') isActive?: boolean,
  ): Promise<PricingConfigResponseDto[]> {
    return this.spaceInventoryService.getPricingConfigs({
      spaceId,
      pricingType,
      isActive,
    });
  }

  @Delete('pricing/:id')
  @Roles('admin', 'partner')
  @ApiOperation({ summary: 'Delete pricing configuration' })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Pricing configuration deleted successfully',
  })
  async deletePricingConfig(
    @Param('id', ParseCoworsIdPipe) id: string,
    @CurrentUserSession('user') user: any,
  ): Promise<void> {
    return this.spaceInventoryService.deletePricingConfig(id, user.id);
  }

  @Post('pricing/:spaceId/calculate')
  @Roles('admin', 'partner', 'customer')
  @ApiOperation({ summary: 'Calculate pricing for space booking' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Pricing calculated successfully',
  })
  async calculatePricing(
    @Param('spaceId', ParseCoworsIdPipe) spaceId: string,
    @Body()
    calculationData: {
      startDate: Date;
      endDate: Date;
      capacity?: number;
      packageId?: string;
      extrasIds?: string[];
      discountCode?: string;
    },
  ): Promise<{
    basePrice: number;
    packagePrice: number;
    extrasPrice: number;
    discountAmount: number;
    totalPrice: number;
    breakdown: any;
  }> {
    return this.spaceInventoryService.calculatePricing(
      spaceId,
      calculationData,
    );
  }

  // Bulk Operations
  @Post('bulk-operations')
  @Roles('admin')
  @ApiOperation({ summary: 'Perform bulk inventory operations' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Bulk operation completed',
  })
  @UsePipes(new ValidationPipe({ transform: true }))
  async performBulkOperation(
    @Body() operationDto: BulkInventoryOperationDto,
    @CurrentUserSession('user') user: any,
  ): Promise<{ success: number; failed: number; errors: string[] }> {
    return this.spaceInventoryService.performBulkInventoryOperation(
      operationDto,
      user.id,
    );
  }

  // Analytics and Reporting
  @Get('analytics')
  @Roles('admin', 'partner')
  @ApiOperation({ summary: 'Get space inventory analytics' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Analytics retrieved successfully',
    type: SpaceInventoryAnalyticsDto,
  })
  @ApiQuery({
    name: 'partnerId',
    required: false,
    description: 'Filter by partner ID',
  })
  @ApiQuery({
    name: 'dateFrom',
    required: false,
    description: 'Filter from date (YYYY-MM-DD)',
  })
  @ApiQuery({
    name: 'dateTo',
    required: false,
    description: 'Filter to date (YYYY-MM-DD)',
  })
  async getInventoryAnalytics(
    @Query('partnerId') partnerId?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ): Promise<SpaceInventoryAnalyticsDto> {
    return this.spaceInventoryService.getInventoryAnalytics({
      partnerId,
      dateFrom,
      dateTo,
    });
  }

  // Export and Download
  @Post('export')
  @Roles('admin', 'partner')
  @ApiOperation({ summary: 'Export space inventory data' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Export initiated successfully',
  })
  @UsePipes(new ValidationPipe({ transform: true }))
  async exportInventoryData(
    @Body() exportDto: SpaceInventoryExportDto,
    @CurrentUserSession('user') user: any,
  ): Promise<{ exportId: string; message: string }> {
    const exportId = await this.spaceInventoryService.exportInventoryData(
      exportDto,
      user.id,
    );
    return {
      exportId,
      message:
        'Export initiated successfully. You will be notified when ready.',
    };
  }

  // Report Generation
  @Post('reports')
  @Roles('admin', 'partner')
  @ApiOperation({ summary: 'Generate space inventory report' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Report generation initiated',
    type: SpaceInventoryReportResponseDto,
  })
  @UsePipes(new ValidationPipe({ transform: true }))
  async generateInventoryReport(
    @Body() reportDto: SpaceInventoryReportDto,
    @CurrentUserSession('user') user: any,
  ): Promise<SpaceInventoryReportResponseDto> {
    return this.spaceInventoryService.generateInventoryReport(
      reportDto,
      user.id,
    );
  }

  @Get('reports')
  @Roles('admin', 'partner')
  @ApiOperation({ summary: 'Get all space inventory reports' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Reports retrieved successfully',
    type: [SpaceInventoryReportResponseDto],
  })
  @ApiQuery({
    name: 'reportType',
    required: false,
    enum: ReportType,
    description: 'Filter by report type',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    description: 'Filter by report status',
  })
  async getAllInventoryReports(
    @Query('reportType') reportType?: ReportType,
    @Query('status') status?: string,
  ): Promise<SpaceInventoryReportResponseDto[]> {
    return this.spaceInventoryService.getAllInventoryReports({
      reportType,
      status,
    });
  }

  @Get('reports/:id')
  @Roles('admin', 'partner')
  @ApiOperation({ summary: 'Get space inventory report by ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Report retrieved successfully',
    type: SpaceInventoryReportResponseDto,
  })
  async getInventoryReport(
    @Param('id', ParseCoworsIdPipe) id: string,
  ): Promise<SpaceInventoryReportResponseDto> {
    return this.spaceInventoryService.getInventoryReport(id);
  }

  // Settings Management
  @Get('settings')
  @Roles('admin', 'partner')
  @ApiOperation({ summary: 'Get space inventory settings' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Settings retrieved successfully',
    type: SpaceInventorySettingsDto,
  })
  async getInventorySettings(): Promise<SpaceInventorySettingsDto> {
    return this.spaceInventoryService.getInventorySettings();
  }

  @Put('settings')
  @Roles('admin')
  @ApiOperation({ summary: 'Update space inventory settings' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Settings updated successfully',
    type: SpaceInventorySettingsDto,
  })
  @UsePipes(new ValidationPipe({ transform: true }))
  async updateInventorySettings(
    @Body() settingsDto: SpaceInventorySettingsDto,
    @CurrentUserSession('user') user: any,
  ): Promise<SpaceInventorySettingsDto> {
    return this.spaceInventoryService.updateInventorySettings(
      settingsDto,
      user.id,
    );
  }

  // Utility Methods
  @Get('spaces/:spaceId/utilization')
  @Roles('admin', 'partner')
  @ApiOperation({ summary: 'Get space utilization metrics' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Utilization metrics retrieved successfully',
  })
  @ApiQuery({
    name: 'dateFrom',
    required: false,
    description: 'Filter from date (YYYY-MM-DD)',
  })
  @ApiQuery({
    name: 'dateTo',
    required: false,
    description: 'Filter to date (YYYY-MM-DD)',
  })
  async getSpaceUtilization(
    @Param('spaceId', ParseCoworsIdPipe) spaceId: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ): Promise<{
    utilizationRate: number;
    totalBookings: number;
    totalRevenue: number;
    averageBookingDuration: number;
    peakHours: any[];
    trends: any[];
  }> {
    return this.spaceInventoryService.getSpaceUtilization(spaceId, {
      dateFrom,
      dateTo,
    });
  }

  @Get('spaces/:spaceId/forecast')
  @Roles('admin', 'partner')
  @ApiOperation({ summary: 'Get space demand forecast' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Demand forecast retrieved successfully',
  })
  @ApiQuery({
    name: 'days',
    required: false,
    type: Number,
    description: 'Number of days to forecast (default: 30)',
  })
  async getSpaceForecast(
    @Param('spaceId', ParseCoworsIdPipe) spaceId: string,
    @Query('days') days?: number,
  ): Promise<{
    forecastPeriod: { startDate: Date; endDate: Date };
    predictedBookings: number;
    predictedRevenue: number;
    demandTrends: any[];
    recommendations: string[];
  }> {
    return this.spaceInventoryService.getSpaceForecast(spaceId, days || 30);
  }
}
