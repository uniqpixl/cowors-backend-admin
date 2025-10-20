import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
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
  Request,
  UseGuards,
  UsePipes,
  ValidationPipe,
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
import {
  BulkInventoryOperationDto,
  BulkOperationResponseDto,
  CalculatePricingDto,
  CreateExtrasDto,
  CreateInventoryDto,
  CreatePricingRuleDto,
  CreateSpacePackageDto,
  ExportInventoryDto,
  ExportResponseDto,
  ExtrasResponseDto,
  ExtrasType,
  GetExtrasDto,
  GetInventoryDto,
  GetSpacePackagesDto,
  InventoryAnalyticsDto,
  InventoryAnalyticsResponseDto,
  InventoryResponseDto,
  InventorySettingsDto,
  InventorySettingsResponseDto,
  InventoryStatus,
  InventorySummaryResponseDto,
  PackageType,
  PricingCalculationResponseDto,
  PricingRuleResponseDto,
  SpacePackageResponseDto,
  UpdateExtrasDto,
  UpdateInventoryDto,
  UpdatePricingRuleDto,
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
  @Roles('admin', 'manager')
  @ApiOperation({ summary: 'Create a new space package' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Space package created successfully',
    type: SpacePackageResponseDto,
  })
  @UsePipes(new ValidationPipe({ transform: true }))
  async createSpacePackage(
    @Body() createDto: CreateSpacePackageDto,
    @Request() req: any,
  ): Promise<SpacePackageResponseDto> {
    return this.spaceInventoryService.createSpacePackage(
      createDto,
      req.user.id,
    );
  }

  @Get('packages')
  @Roles('admin', 'manager', 'staff')
  @ApiOperation({ summary: 'Get space packages with filtering and pagination' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Space packages retrieved successfully',
  })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'type', required: false, enum: PackageType })
  @ApiQuery({ name: 'status', required: false, type: String })
  @ApiQuery({ name: 'location', required: false, type: String })
  async getSpacePackages(
    @Query() queryDto: GetSpacePackagesDto,
  ): Promise<{ packages: SpacePackageResponseDto[]; total: number }> {
    const result = await this.spaceInventoryService.getSpacePackages(queryDto);
    return {
      packages: result.data,
      total: result.total,
    };
  }

  @Get('packages/:id')
  @Roles('admin', 'manager', 'staff')
  @ApiOperation({ summary: 'Get space package by ID' })
  @ApiParam({ name: 'id', description: 'Space package ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Space package retrieved successfully',
    type: SpacePackageResponseDto,
  })
  async getSpacePackageById(
    @Param('id', ParseCoworsIdPipe) id: string,
  ): Promise<SpacePackageResponseDto> {
    return this.spaceInventoryService.getSpacePackageById(id);
  }

  @Put('packages/:id')
  @Roles('admin', 'manager')
  @ApiOperation({ summary: 'Update space package' })
  @ApiParam({ name: 'id', description: 'Space package ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Space package updated successfully',
    type: SpacePackageResponseDto,
  })
  @UsePipes(new ValidationPipe({ transform: true }))
  async updateSpacePackage(
    @Param('id', ParseCoworsIdPipe) id: string,
    @Body() updateDto: UpdateSpacePackageDto,
    @Request() req: any,
  ): Promise<SpacePackageResponseDto> {
    return this.spaceInventoryService.updateSpacePackage(
      id,
      updateDto,
      req.user.id,
    );
  }

  @Delete('packages/:id')
  @Roles('admin')
  @ApiOperation({ summary: 'Delete space package' })
  @ApiParam({ name: 'id', description: 'Space package ID' })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Space package deleted successfully',
  })
  async deleteSpacePackage(
    @Param('id', ParseCoworsIdPipe) id: string,
    @Request() req: any,
  ): Promise<void> {
    return this.spaceInventoryService.deleteSpacePackage(id);
  }

  @Put('packages/:id/activate')
  @Roles('admin', 'manager')
  @ApiOperation({ summary: 'Activate space package' })
  @ApiParam({ name: 'id', description: 'Space package ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Space package activated successfully',
    type: SpacePackageResponseDto,
  })
  async activateSpacePackage(
    @Param('id', ParseCoworsIdPipe) id: string,
    @Request() req: any,
  ): Promise<SpacePackageResponseDto> {
    return this.spaceInventoryService.activateSpacePackage(id, req.user.id);
  }

  @Put('packages/:id/deactivate')
  @Roles('admin', 'manager')
  @ApiOperation({ summary: 'Deactivate space package' })
  @ApiParam({ name: 'id', description: 'Space package ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Space package deactivated successfully',
    type: SpacePackageResponseDto,
  })
  async deactivateSpacePackage(
    @Param('id', ParseCoworsIdPipe) id: string,
    @Request() req: any,
  ): Promise<SpacePackageResponseDto> {
    return this.spaceInventoryService.deactivateSpacePackage(id, req.user.id);
  }

  // Extras Management
  @Post('extras')
  @Roles('admin', 'manager')
  @ApiOperation({ summary: 'Create a new extras' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Extras created successfully',
    type: ExtrasResponseDto,
  })
  @UsePipes(new ValidationPipe({ transform: true }))
  async createExtras(
    @Body() createDto: CreateExtrasDto,
    @Request() req: any,
  ): Promise<ExtrasResponseDto> {
    return this.spaceInventoryService.createExtras(createDto, req.user.id);
  }

  @Get('extras')
  @Roles('admin', 'manager', 'staff')
  @ApiOperation({ summary: 'Get extras with filtering and pagination' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Extras retrieved successfully',
  })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'type', required: false, enum: ExtrasType })
  @ApiQuery({ name: 'status', required: false, type: String })
  async getExtras(
    @Query() queryDto: GetExtrasDto,
  ): Promise<{ extras: ExtrasResponseDto[]; total: number }> {
    const result = await this.spaceInventoryService.getExtras(queryDto);
    return {
      extras: result.data,
      total: result.total,
    };
  }

  @Get('extras/:id')
  @Roles('admin', 'manager', 'staff')
  @ApiOperation({ summary: 'Get extras by ID' })
  @ApiParam({ name: 'id', description: 'Extras ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Extras retrieved successfully',
    type: ExtrasResponseDto,
  })
  async getExtrasById(
    @Param('id', ParseCoworsIdPipe) id: string,
  ): Promise<ExtrasResponseDto> {
    return this.spaceInventoryService.getExtrasById(id);
  }

  @Put('extras/:id')
  @Roles('admin', 'manager')
  @ApiOperation({ summary: 'Update extras' })
  @ApiParam({ name: 'id', description: 'Extras ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Extras updated successfully',
    type: ExtrasResponseDto,
  })
  @UsePipes(new ValidationPipe({ transform: true }))
  async updateExtras(
    @Param('id', ParseCoworsIdPipe) id: string,
    @Body() updateDto: UpdateExtrasDto,
    @Request() req: any,
  ): Promise<ExtrasResponseDto> {
    return this.spaceInventoryService.updateExtras(id, updateDto, req.user.id);
  }

  @Delete('extras/:id')
  @Roles('admin')
  @ApiOperation({ summary: 'Delete extras' })
  @ApiParam({ name: 'id', description: 'Extras ID' })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Extras deleted successfully',
  })
  async deleteExtras(
    @Param('id', ParseCoworsIdPipe) id: string,
    @Request() req: any,
  ): Promise<void> {
    return this.spaceInventoryService.deleteExtras(id);
  }

  // Inventory Management
  @Post('inventory')
  @Roles('admin', 'manager')
  @ApiOperation({ summary: 'Create inventory record' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Inventory record created successfully',
    type: InventoryResponseDto,
  })
  @UsePipes(new ValidationPipe({ transform: true }))
  async createInventory(
    @Body() createDto: CreateInventoryDto,
    @Request() req: any,
  ): Promise<InventoryResponseDto> {
    return this.spaceInventoryService.createInventory(createDto, req.user.id);
  }

  @Get('inventory')
  @Roles('admin', 'manager', 'staff')
  @ApiOperation({ summary: 'Get inventory with filtering and pagination' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Inventory retrieved successfully',
  })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, enum: InventoryStatus })
  @ApiQuery({ name: 'location', required: false, type: String })
  @ApiQuery({ name: 'lowStock', required: false, type: Boolean })
  async getInventory(@Query() queryDto: GetInventoryDto): Promise<{
    data: InventoryResponseDto[];
    total: number;
    page: number;
    limit: number;
  }> {
    return this.spaceInventoryService.getInventory(queryDto);
  }

  @Get('inventory/:id')
  @Roles('admin', 'manager', 'staff')
  @ApiOperation({ summary: 'Get inventory by ID' })
  @ApiParam({ name: 'id', description: 'Inventory ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Inventory retrieved successfully',
    type: InventoryResponseDto,
  })
  async getInventoryById(
    @Param('id', ParseCoworsIdPipe) id: string,
  ): Promise<InventoryResponseDto> {
    return this.spaceInventoryService.getInventoryById(id);
  }

  @Put('inventory/:id')
  @Roles('admin', 'manager')
  @ApiOperation({ summary: 'Update inventory' })
  @ApiParam({ name: 'id', description: 'Inventory ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Inventory updated successfully',
    type: InventoryResponseDto,
  })
  @UsePipes(new ValidationPipe({ transform: true }))
  async updateInventory(
    @Param('id', ParseCoworsIdPipe) id: string,
    @Body() updateDto: UpdateInventoryDto,
    @Request() req: any,
  ): Promise<InventoryResponseDto> {
    return this.spaceInventoryService.updateInventory(
      id,
      updateDto,
      req.user.id,
    );
  }

  @Delete('inventory/:id')
  @Roles('admin')
  @ApiOperation({ summary: 'Delete inventory record' })
  @ApiParam({ name: 'id', description: 'Inventory ID' })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Inventory record deleted successfully',
  })
  async deleteInventory(
    @Param('id', ParseCoworsIdPipe) id: string,
    @Request() req: any,
  ): Promise<void> {
    return this.spaceInventoryService.deleteInventory(id);
  }

  @Put('inventory/:id/adjust-stock')
  @Roles('admin', 'manager')
  @ApiOperation({ summary: 'Adjust inventory stock' })
  @ApiParam({ name: 'id', description: 'Inventory ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Inventory stock adjusted successfully',
    type: InventoryResponseDto,
  })
  async adjustInventoryStock(
    @Param('id', ParseCoworsIdPipe) id: string,
    @Body() adjustmentDto: { quantity: number; reason: string },
    @Request() req: any,
  ): Promise<InventoryResponseDto> {
    return this.spaceInventoryService.adjustStock(
      id,
      adjustmentDto.quantity,
      adjustmentDto.reason,
      req.user.id,
    );
  }

  @Put('inventory/:id/reserve')
  @Roles('admin', 'manager', 'staff')
  @ApiOperation({ summary: 'Reserve inventory' })
  @ApiParam({ name: 'id', description: 'Inventory ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Inventory reserved successfully',
    type: InventoryResponseDto,
  })
  async reserveInventory(
    @Param('id', ParseCoworsIdPipe) id: string,
    @Body()
    reservationDto: { quantity: number; reservedFor: string; notes?: string },
    @Request() req: any,
  ): Promise<InventoryResponseDto> {
    return this.spaceInventoryService.reserveInventory(
      id,
      reservationDto.quantity,
      req.user.id,
    );
  }

  @Put('inventory/:id/release')
  @Roles('admin', 'manager', 'staff')
  @ApiOperation({ summary: 'Release reserved inventory' })
  @ApiParam({ name: 'id', description: 'Inventory ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Inventory released successfully',
    type: InventoryResponseDto,
  })
  async releaseInventory(
    @Param('id', ParseCoworsIdPipe) id: string,
    @Body() releaseDto: { quantity: number; notes?: string },
    @Request() req: any,
  ): Promise<InventoryResponseDto> {
    return this.spaceInventoryService.releaseInventory(
      id,
      releaseDto.quantity,
      req.user.id,
    );
  }

  // Bulk Operations
  @Post('inventory/bulk-operation')
  @Roles('admin', 'manager')
  @ApiOperation({ summary: 'Perform bulk inventory operations' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Bulk operation completed',
    type: BulkOperationResponseDto,
  })
  @UsePipes(new ValidationPipe({ transform: true }))
  async bulkInventoryOperation(
    @Body() operationDto: BulkInventoryOperationDto,
    @Request() req: any,
  ): Promise<BulkOperationResponseDto> {
    return this.spaceInventoryService.bulkInventoryOperation(
      operationDto,
      req.user.id,
    );
  }

  // Pricing Management
  @Post('pricing-rules')
  @Roles('admin', 'manager')
  @ApiOperation({ summary: 'Create pricing rule' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Pricing rule created successfully',
    type: PricingRuleResponseDto,
  })
  @UsePipes(new ValidationPipe({ transform: true }))
  async createPricingRule(
    @Body() createDto: CreatePricingRuleDto,
    @Request() req: any,
  ): Promise<PricingRuleResponseDto> {
    return this.spaceInventoryService.createPricingRule(createDto, req.user.id);
  }

  @Get('pricing-rules')
  @Roles('admin', 'manager', 'staff')
  @ApiOperation({ summary: 'Get pricing rules' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Pricing rules retrieved successfully',
  })
  async getPricingRules(): Promise<PricingRuleResponseDto[]> {
    return this.spaceInventoryService.getPricingRules();
  }

  @Put('pricing-rules/:id')
  @Roles('admin', 'manager')
  @ApiOperation({ summary: 'Update pricing rule' })
  @ApiParam({ name: 'id', description: 'Pricing rule ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Pricing rule updated successfully',
    type: PricingRuleResponseDto,
  })
  @UsePipes(new ValidationPipe({ transform: true }))
  async updatePricingRule(
    @Param('id', ParseCoworsIdPipe) id: string,
    @Body() updateDto: UpdatePricingRuleDto,
    @Request() req: any,
  ): Promise<PricingRuleResponseDto> {
    return this.spaceInventoryService.updatePricingRule(
      id,
      updateDto,
      req.user.id,
    );
  }

  @Delete('pricing-rules/:id')
  @Roles('admin')
  @ApiOperation({ summary: 'Delete pricing rule' })
  @ApiParam({ name: 'id', description: 'Pricing rule ID' })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Pricing rule deleted successfully',
  })
  async deletePricingRule(
    @Param('id', ParseCoworsIdPipe) id: string,
    @Request() req: any,
  ): Promise<void> {
    return this.spaceInventoryService.deletePricingRule(id);
  }

  @Post('calculate-pricing')
  @Roles('admin', 'manager', 'staff')
  @ApiOperation({ summary: 'Calculate pricing for space and extras' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Pricing calculated successfully',
    type: PricingCalculationResponseDto,
  })
  @UsePipes(new ValidationPipe({ transform: true }))
  async calculatePricing(
    @Body() calculationDto: CalculatePricingDto,
  ): Promise<PricingCalculationResponseDto> {
    return this.spaceInventoryService.calculatePricing(calculationDto);
  }

  // Analytics and Reporting
  @Get('analytics')
  @Roles('admin', 'manager')
  @ApiOperation({ summary: 'Get inventory analytics' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Analytics retrieved successfully',
    type: InventoryAnalyticsResponseDto,
  })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  @ApiQuery({ name: 'location', required: false, type: String })
  @ApiQuery({ name: 'groupBy', required: false, type: String })
  async getInventoryAnalytics(
    @Query() analyticsDto: InventoryAnalyticsDto,
  ): Promise<InventoryAnalyticsResponseDto> {
    return this.spaceInventoryService.getInventoryAnalytics(analyticsDto);
  }

  @Get('summary')
  @Roles('admin', 'manager', 'staff')
  @ApiOperation({ summary: 'Get inventory summary' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Summary retrieved successfully',
    type: InventorySummaryResponseDto,
  })
  async getInventorySummary(): Promise<InventorySummaryResponseDto> {
    return this.spaceInventoryService.getInventorySummary();
  }

  // Export and Download
  @Post('export')
  @Roles('admin', 'manager')
  @ApiOperation({ summary: 'Export inventory data' })
  @ApiResponse({
    status: HttpStatus.ACCEPTED,
    description: 'Export initiated successfully',
    type: ExportResponseDto,
  })
  @UsePipes(new ValidationPipe({ transform: true }))
  async exportInventoryData(
    @Body() exportDto: ExportInventoryDto,
    @Request() req: any,
  ): Promise<ExportResponseDto> {
    return this.spaceInventoryService.exportInventory(exportDto, req.user.id);
  }

  @Get('exports/:exportId/status')
  @Roles('admin', 'manager')
  @ApiOperation({ summary: 'Get export status' })
  @ApiParam({ name: 'exportId', description: 'Export ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Export status retrieved successfully',
    type: ExportResponseDto,
  })
  async getExportStatus(
    @Param('exportId', ParseCoworsIdPipe) exportId: string,
  ): Promise<ExportResponseDto> {
    return this.spaceInventoryService.getExportStatus(exportId);
  }

  // Settings Management
  @Get('settings')
  @Roles('admin', 'manager')
  @ApiOperation({ summary: 'Get inventory settings' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Settings retrieved successfully',
    type: InventorySettingsResponseDto,
  })
  async getInventorySettings(): Promise<InventorySettingsResponseDto> {
    return this.spaceInventoryService.getInventorySettings();
  }

  @Put('settings')
  @Roles('admin')
  @ApiOperation({ summary: 'Update inventory settings' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Settings updated successfully',
    type: InventorySettingsResponseDto,
  })
  @UsePipes(new ValidationPipe({ transform: true }))
  async updateInventorySettings(
    @Body() settingsDto: InventorySettingsDto,
    @Request() req: any,
  ): Promise<InventorySettingsResponseDto> {
    return this.spaceInventoryService.updateInventorySettings(
      settingsDto,
      req.user.id,
    );
  }

  // Utility Methods
  @Get('package-types')
  @Roles('admin', 'manager', 'staff')
  @ApiOperation({ summary: 'Get available package types' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Package types retrieved successfully',
  })
  async getPackageTypes(): Promise<string[]> {
    return this.spaceInventoryService.getPackageTypes();
  }

  @Get('extras-types')
  @Roles('admin', 'manager', 'staff')
  @ApiOperation({ summary: 'Get available extras types' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Extras types retrieved successfully',
  })
  async getExtrasTypes(): Promise<string[]> {
    return this.spaceInventoryService.getExtrasTypes();
  }

  @Get('inventory-statuses')
  @Roles('admin', 'manager', 'staff')
  @ApiOperation({ summary: 'Get available inventory statuses' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Inventory statuses retrieved successfully',
  })
  async getInventoryStatuses(): Promise<string[]> {
    return this.spaceInventoryService.getInventoryStatuses();
  }

  @Post('validate-package')
  @Roles('admin', 'manager')
  @ApiOperation({ summary: 'Validate space package configuration' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Package validation completed',
  })
  async validateSpacePackage(
    @Body() packageData: any,
  ): Promise<{ isValid: boolean; errors: string[] }> {
    return this.spaceInventoryService.validateSpacePackage(packageData);
  }

  @Get('availability/:packageId')
  @Roles('admin', 'manager', 'staff')
  @ApiOperation({ summary: 'Check space availability' })
  @ApiParam({ name: 'packageId', description: 'Space package ID' })
  @ApiQuery({ name: 'startDate', required: true, type: String })
  @ApiQuery({ name: 'endDate', required: true, type: String })
  @ApiQuery({ name: 'quantity', required: false, type: Number })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Availability checked successfully',
  })
  async checkSpaceAvailability(
    @Param('packageId', ParseCoworsIdPipe) packageId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('quantity') quantity?: number,
  ): Promise<{
    available: boolean;
    availableQuantity: number;
    conflicts: any[];
  }> {
    const result = await this.spaceInventoryService.checkSpaceAvailability(
      packageId,
      quantity || 1,
    );
    return {
      ...result,
      conflicts: [],
    };
  }
}
