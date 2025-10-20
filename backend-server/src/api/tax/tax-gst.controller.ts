import { AuthGuard } from '@/auth/auth.guard';
import { UserEntity } from '@/auth/entities/user.entity';
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
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ParseCoworsIdPipe } from '../../common/pipes/parse-cowors-id.pipe';
import {
  BulkOperationResponseDto,
  BulkTaxOperationDto,
  ComplianceStatus,
  CreateTaxCalculationDto,
  CreateTaxComplianceDto,
  CreateTaxReturnDto,
  CreateTaxRuleDto,
  ExportResponseDto,
  ExportTaxDataDto,
  GetTaxCalculationsDto,
  GetTaxComplianceDto,
  GetTaxReturnsDto,
  GetTaxRulesDto,
  ReturnStatus,
  TaxAnalyticsDto,
  TaxAnalyticsResponseDto,
  TaxCalculationResponseDto,
  TaxComplianceResponseDto,
  TaxReturnResponseDto,
  TaxRuleResponseDto,
  TaxSettingsDto,
  TaxSettingsResponseDto,
  TaxStatus,
  TaxSummaryResponseDto,
  TaxType,
  UpdateTaxCalculationDto,
  UpdateTaxComplianceDto,
  UpdateTaxReturnDto,
  UpdateTaxRuleDto,
} from './dto/tax-gst.dto';
import { CalculateTaxDto } from './dto/tax-management.dto';
import { TaxGstService } from './tax-gst.service';

@ApiTags('Tax & GST Management')
@Controller('tax')
@UseGuards(AuthGuard, RolesGuard)
@ApiBearerAuth()
export class TaxGstController {
  constructor(private readonly taxGstService: TaxGstService) {}

  // Tax Rule Management
  @Post('rules')
  // @Roles('admin', 'finance_manager')
  @ApiOperation({ summary: 'Create a new tax rule' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Tax rule created successfully',
    type: TaxRuleResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Insufficient permissions',
  })
  @UsePipes(new ValidationPipe({ transform: true }))
  async createTaxRule(
    @Body() createDto: CreateTaxRuleDto,
    @CurrentUserSession() user: any,
  ): Promise<TaxRuleResponseDto> {
    return this.taxGstService.createTaxRule(createDto, user.id);
  }

  @Get('rules')
  // @Roles('admin', 'finance_manager', 'finance_user')
  @ApiOperation({ summary: 'Get tax rules with filtering and pagination' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Tax rules retrieved successfully',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Search term for rule name or description',
  })
  @ApiQuery({
    name: 'type',
    required: false,
    enum: TaxType,
    description: 'Filter by tax type',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: TaxStatus,
    description: 'Filter by status',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number (default: 1)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Items per page (default: 10)',
  })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    description: 'Sort field (default: createdAt)',
  })
  @ApiQuery({
    name: 'sortOrder',
    required: false,
    enum: ['ASC', 'DESC'],
    description: 'Sort order (default: DESC)',
  })
  async getTaxRules(@Query() filters: GetTaxRulesDto) {
    return this.taxGstService.getTaxRules(filters);
  }

  @Get('rules/:id')
  // @Roles('admin', 'finance_manager', 'finance_user')
  @ApiOperation({ summary: 'Get tax rule by ID' })
  @ApiParam({ name: 'id', description: 'Tax rule ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Tax rule retrieved successfully',
    type: TaxRuleResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Tax rule not found',
  })
  async getTaxRuleById(
    @Param('id', ParseCoworsIdPipe) id: string,
  ): Promise<TaxRuleResponseDto> {
    return this.taxGstService.getTaxRuleById(id);
  }

  @Put('rules/:id')
  // @Roles('admin', 'finance_manager')
  @ApiOperation({ summary: 'Update tax rule' })
  @ApiParam({ name: 'id', description: 'Tax rule ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Tax rule updated successfully',
    type: TaxRuleResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Tax rule not found',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data',
  })
  @UsePipes(new ValidationPipe({ transform: true }))
  async updateTaxRule(
    @Param('id', ParseCoworsIdPipe) id: string,
    @Body() updateDto: UpdateTaxRuleDto,
    @CurrentUserSession() user: any,
  ): Promise<TaxRuleResponseDto> {
    return this.taxGstService.updateTaxRule(id, updateDto, user.id);
  }

  @Delete('rules/:id')
  // @Roles('admin', 'finance_manager')
  @ApiOperation({ summary: 'Delete tax rule' })
  @ApiParam({ name: 'id', description: 'Tax rule ID' })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Tax rule deleted successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Tax rule not found',
  })
  async deleteTaxRule(
    @Param('id', ParseCoworsIdPipe) id: string,
    @CurrentUserSession() user: any,
  ): Promise<void> {
    return this.taxGstService.deleteTaxRule(id, user.id);
  }

  @Put('rules/:id/activate')
  // @Roles('admin', 'finance_manager')
  @ApiOperation({ summary: 'Activate tax rule' })
  @ApiParam({ name: 'id', description: 'Tax rule ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Tax rule activated successfully',
    type: TaxRuleResponseDto,
  })
  async activateTaxRule(
    @Param('id', ParseCoworsIdPipe) id: string,
    @CurrentUserSession() user: any,
  ): Promise<TaxRuleResponseDto> {
    return this.taxGstService.activateTaxRule(id, user.id);
  }

  @Put('rules/:id/deactivate')
  // @Roles('admin', 'finance_manager')
  @ApiOperation({ summary: 'Deactivate tax rule' })
  @ApiParam({ name: 'id', description: 'Tax rule ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Tax rule deactivated successfully',
    type: TaxRuleResponseDto,
  })
  async deactivateTaxRule(
    @Param('id', ParseCoworsIdPipe) id: string,
    @CurrentUserSession() user: any,
  ): Promise<TaxRuleResponseDto> {
    return this.taxGstService.deactivateTaxRule(id, user.id);
  }

  // Tax Calculation Management
  @Post('calculations')
  // @Roles('admin', 'finance_manager', 'finance_user')
  @ApiOperation({ summary: 'Create a new tax calculation' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Tax calculation created successfully',
    type: TaxCalculationResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data',
  })
  @UsePipes(new ValidationPipe({ transform: true }))
  async createTaxCalculation(
    @Body() createDto: CreateTaxCalculationDto,
    @CurrentUserSession() user: any,
  ): Promise<TaxCalculationResponseDto> {
    return this.taxGstService.createTaxCalculation(createDto, user.id);
  }

  @Get('calculations')
  // @Roles('admin', 'finance_manager', 'finance_user')
  @ApiOperation({
    summary: 'Get tax calculations with filtering and pagination',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Tax calculations retrieved successfully',
  })
  async getTaxCalculations(@Query() filters: GetTaxCalculationsDto) {
    return this.taxGstService.getTaxCalculations(filters);
  }

  @Get('calculations/:id')
  // @Roles('admin', 'finance_manager', 'finance_user')
  @ApiOperation({ summary: 'Get tax calculation by ID' })
  @ApiParam({ name: 'id', description: 'Tax calculation ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Tax calculation retrieved successfully',
    type: TaxCalculationResponseDto,
  })
  async getTaxCalculationById(
    @Param('id', ParseCoworsIdPipe) id: string,
  ): Promise<TaxCalculationResponseDto> {
    return this.taxGstService.getTaxCalculationById(id);
  }

  @Put('calculations/:id')
  // @Roles('admin', 'finance_manager', 'finance_user')
  @ApiOperation({ summary: 'Update tax calculation' })
  @ApiParam({ name: 'id', description: 'Tax calculation ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Tax calculation updated successfully',
    type: TaxCalculationResponseDto,
  })
  @UsePipes(new ValidationPipe({ transform: true }))
  async updateTaxCalculation(
    @Param('id', ParseCoworsIdPipe) id: string,
    @Body() updateDto: UpdateTaxCalculationDto,
    @CurrentUserSession() user: any,
  ): Promise<TaxCalculationResponseDto> {
    return this.taxGstService.updateTaxCalculation(id, updateDto, user.id);
  }

  @Delete('calculations/:id')
  // @Roles('admin', 'finance_manager')
  @ApiOperation({ summary: 'Delete tax calculation' })
  @ApiParam({ name: 'id', description: 'Tax calculation ID' })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Tax calculation deleted successfully',
  })
  async deleteTaxCalculation(
    @Param('id', ParseCoworsIdPipe) id: string,
    @CurrentUserSession() user: any,
  ): Promise<void> {
    return this.taxGstService.deleteTaxCalculation(id, user.id);
  }

  @Post('calculations/calculate')
  // @Roles('admin', 'finance_manager', 'finance_user')
  @ApiOperation({ summary: 'Calculate tax for given parameters' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Tax calculated successfully',
  })
  @ApiBody({ type: CalculateTaxDto })
  async calculateTax(
    @Body() calculateDto: CalculateTaxDto,
    @CurrentUserSession() user: any,
  ) {
    return this.taxGstService.calculateTax(calculateDto);
  }

  // Tax Return Management
  @Post('returns')
  // @Roles('admin', 'finance_manager')
  @ApiOperation({ summary: 'Create a new tax return' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Tax return created successfully',
    type: TaxReturnResponseDto,
  })
  @UsePipes(new ValidationPipe({ transform: true }))
  async createTaxReturn(
    @Body() createDto: CreateTaxReturnDto,
    @CurrentUserSession() user: any,
  ): Promise<TaxReturnResponseDto> {
    return this.taxGstService.createTaxReturn(createDto, user.id);
  }

  @Get('returns')
  // @Roles('admin', 'finance_manager', 'finance_user')
  @ApiOperation({ summary: 'Get tax returns with filtering and pagination' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Tax returns retrieved successfully',
  })
  async getTaxReturns(@Query() filters: GetTaxReturnsDto) {
    return this.taxGstService.getTaxReturns(filters);
  }

  @Get('returns/:id')
  // @Roles('admin', 'finance_manager', 'finance_user')
  @ApiOperation({ summary: 'Get tax return by ID' })
  @ApiParam({ name: 'id', description: 'Tax return ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Tax return retrieved successfully',
    type: TaxReturnResponseDto,
  })
  async getTaxReturnById(
    @Param('id', ParseCoworsIdPipe) id: string,
  ): Promise<TaxReturnResponseDto> {
    return this.taxGstService.getTaxReturnById(id);
  }

  @Put('returns/:id')
  // @Roles('admin', 'finance_manager')
  @ApiOperation({ summary: 'Update tax return' })
  @ApiParam({ name: 'id', description: 'Tax return ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Tax return updated successfully',
    type: TaxReturnResponseDto,
  })
  @UsePipes(new ValidationPipe({ transform: true }))
  async updateTaxReturn(
    @Param('id', ParseCoworsIdPipe) id: string,
    @Body() updateDto: UpdateTaxReturnDto,
    @CurrentUserSession() user: any,
  ): Promise<TaxReturnResponseDto> {
    return this.taxGstService.updateTaxReturn(id, updateDto, user.id);
  }

  @Delete('returns/:id')
  // @Roles('admin', 'finance_manager')
  @ApiOperation({ summary: 'Delete tax return' })
  @ApiParam({ name: 'id', description: 'Tax return ID' })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Tax return deleted successfully',
  })
  async deleteTaxReturn(
    @Param('id', ParseCoworsIdPipe) id: string,
    @CurrentUserSession() user: any,
  ): Promise<void> {
    return this.taxGstService.deleteTaxReturn(id, user.id);
  }

  @Put('returns/:id/submit')
  // @Roles('admin', 'finance_manager')
  @ApiOperation({ summary: 'Submit tax return' })
  @ApiParam({ name: 'id', description: 'Tax return ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Tax return submitted successfully',
    type: TaxReturnResponseDto,
  })
  async submitTaxReturn(
    @Param('id', ParseCoworsIdPipe) id: string,
    @CurrentUserSession() user: any,
  ): Promise<TaxReturnResponseDto> {
    return this.taxGstService.submitTaxReturn(id, user.id);
  }

  @Put('returns/:id/approve')
  // @Roles('admin', 'finance_manager')
  @ApiOperation({ summary: 'Approve tax return' })
  @ApiParam({ name: 'id', description: 'Tax return ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Tax return approved successfully',
    type: TaxReturnResponseDto,
  })
  async approveTaxReturn(
    @Param('id', ParseCoworsIdPipe) id: string,
    @CurrentUserSession() user: any,
  ): Promise<TaxReturnResponseDto> {
    return this.taxGstService.approveTaxReturn(id, user.id);
  }

  @Put('returns/:id/reject')
  // @Roles('admin', 'finance_manager')
  @ApiOperation({ summary: 'Reject tax return' })
  @ApiParam({ name: 'id', description: 'Tax return ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Tax return rejected successfully',
    type: TaxReturnResponseDto,
  })
  @ApiBody({
    schema: { type: 'object', properties: { reason: { type: 'string' } } },
  })
  async rejectTaxReturn(
    @Param('id', ParseCoworsIdPipe) id: string,
    @Body('reason') reason: string,
    @CurrentUserSession() user: any,
  ): Promise<TaxReturnResponseDto> {
    return this.taxGstService.rejectTaxReturn(id, reason, user.id);
  }

  // Tax Compliance Management
  @Post('compliance')
  // @Roles('admin', 'finance_manager')
  @ApiOperation({ summary: 'Create a new tax compliance record' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Tax compliance record created successfully',
    type: TaxComplianceResponseDto,
  })
  @UsePipes(new ValidationPipe({ transform: true }))
  async createTaxCompliance(
    @Body() createDto: CreateTaxComplianceDto,
    @CurrentUserSession() user: any,
  ): Promise<TaxComplianceResponseDto> {
    return this.taxGstService.createTaxCompliance(createDto, user.id);
  }

  @Get('compliance')
  // @Roles('admin', 'finance_manager', 'finance_user')
  @ApiOperation({
    summary: 'Get tax compliance records with filtering and pagination',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Tax compliance records retrieved successfully',
  })
  async getTaxCompliance(@Query() filters: GetTaxComplianceDto) {
    return this.taxGstService.getTaxCompliance(filters);
  }

  @Get('compliance/:id')
  // @Roles('admin', 'finance_manager', 'finance_user')
  @ApiOperation({ summary: 'Get tax compliance record by ID' })
  @ApiParam({ name: 'id', description: 'Tax compliance ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Tax compliance record retrieved successfully',
    type: TaxComplianceResponseDto,
  })
  async getTaxComplianceById(
    @Param('id', ParseCoworsIdPipe) id: string,
  ): Promise<TaxComplianceResponseDto> {
    return this.taxGstService.getTaxComplianceById(id);
  }

  @Put('compliance/:id')
  // @Roles('admin', 'finance_manager')
  @ApiOperation({ summary: 'Update tax compliance record' })
  @ApiParam({ name: 'id', description: 'Tax compliance ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Tax compliance record updated successfully',
    type: TaxComplianceResponseDto,
  })
  @UsePipes(new ValidationPipe({ transform: true }))
  async updateTaxCompliance(
    @Param('id', ParseCoworsIdPipe) id: string,
    @Body() updateDto: UpdateTaxComplianceDto,
    @CurrentUserSession() user: any,
  ): Promise<TaxComplianceResponseDto> {
    return this.taxGstService.updateTaxCompliance(id, updateDto, user.id);
  }

  @Delete('compliance/:id')
  // @Roles('admin', 'finance_manager')
  @ApiOperation({ summary: 'Delete tax compliance record' })
  @ApiParam({ name: 'id', description: 'Tax compliance ID' })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Tax compliance record deleted successfully',
  })
  async deleteTaxCompliance(
    @Param('id', ParseCoworsIdPipe) id: string,
    @CurrentUserSession() user: any,
  ): Promise<void> {
    return this.taxGstService.deleteTaxCompliance(id, user.id);
  }

  @Get('compliance/deadlines/upcoming')
  // @Roles('admin', 'finance_manager', 'finance_user')
  @ApiOperation({ summary: 'Get upcoming tax compliance deadlines' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Upcoming deadlines retrieved successfully',
  })
  @ApiQuery({
    name: 'days',
    required: false,
    type: Number,
    description: 'Number of days to look ahead (default: 30)',
  })
  async getUpcomingDeadlines(@Query('days') days?: number) {
    return this.taxGstService.getUpcomingDeadlines(days);
  }

  // Bulk Operations
  @Post('bulk-operations')
  // @Roles('admin', 'finance_manager')
  @ApiOperation({ summary: 'Perform bulk operations on tax records' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Bulk operation completed',
    type: BulkOperationResponseDto,
  })
  @UsePipes(new ValidationPipe({ transform: true }))
  async bulkTaxOperation(
    @Body() bulkDto: BulkTaxOperationDto,
    @CurrentUserSession() user: any,
  ): Promise<BulkOperationResponseDto> {
    return this.taxGstService.bulkTaxOperations(bulkDto, user.id);
  }

  // Analytics and Reporting
  @Get('analytics')
  // @Roles('admin', 'finance_manager', 'finance_user')
  @ApiOperation({ summary: 'Get tax analytics and insights' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Tax analytics retrieved successfully',
    type: TaxAnalyticsResponseDto,
  })
  async getTaxAnalytics(
    @Query() filters: TaxAnalyticsDto,
  ): Promise<TaxAnalyticsResponseDto> {
    return this.taxGstService.getTaxAnalytics(filters);
  }

  @Get('summary')
  // @Roles('admin', 'finance_manager', 'finance_user')
  @ApiOperation({ summary: 'Get tax summary dashboard data' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Tax summary retrieved successfully',
    type: TaxSummaryResponseDto,
  })
  async getTaxSummary(): Promise<TaxSummaryResponseDto> {
    return this.taxGstService.getTaxSummary();
  }

  @Get('reports/gst-summary')
  // @Roles('admin', 'finance_manager', 'finance_user')
  @ApiOperation({ summary: 'Get GST summary report' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'GST summary report retrieved successfully',
  })
  @ApiQuery({
    name: 'startDate',
    required: false,
    type: Date,
    description: 'Start date for the report',
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    type: Date,
    description: 'End date for the report',
  })
  async getGstSummaryReport(
    @Query('startDate') startDate?: Date,
    @Query('endDate') endDate?: Date,
  ) {
    return this.taxGstService.getGstSummaryReport(startDate, endDate);
  }

  @Get('reports/tcs-tds')
  // @Roles('admin', 'finance_manager', 'finance_user')
  @ApiOperation({ summary: 'Get TCS/TDS report' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'TCS/TDS report retrieved successfully',
  })
  @ApiQuery({
    name: 'startDate',
    required: false,
    type: Date,
    description: 'Start date for the report',
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    type: Date,
    description: 'End date for the report',
  })
  async getTcsTdsReport(
    @Query('startDate') startDate?: Date,
    @Query('endDate') endDate?: Date,
  ) {
    return this.taxGstService.getTcsTdsReport(startDate, endDate);
  }

  // Export and Download
  @Post('export')
  // @Roles('admin', 'finance_manager')
  @ApiOperation({ summary: 'Export tax data' })
  @ApiResponse({
    status: HttpStatus.ACCEPTED,
    description: 'Export initiated successfully',
    type: ExportResponseDto,
  })
  @UsePipes(new ValidationPipe({ transform: true }))
  async exportTaxData(
    @Body() exportDto: ExportTaxDataDto,
    @CurrentUserSession() user: any,
  ): Promise<ExportResponseDto> {
    return this.taxGstService.exportTaxData(exportDto, user.id);
  }

  @Get('export/:exportId/status')
  // @Roles('admin', 'finance_manager', 'finance_user')
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
    return this.taxGstService.getExportStatus(exportId);
  }

  // Settings Management
  @Get('settings')
  // @Roles('admin', 'finance_manager', 'finance_user')
  @ApiOperation({ summary: 'Get tax settings' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Tax settings retrieved successfully',
    type: TaxSettingsResponseDto,
  })
  async getTaxSettings(): Promise<TaxSettingsResponseDto> {
    return this.taxGstService.getTaxSettings();
  }

  @Put('settings')
  // @Roles('admin', 'finance_manager')
  @ApiOperation({ summary: 'Update tax settings' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Tax settings updated successfully',
    type: TaxSettingsResponseDto,
  })
  @UsePipes(new ValidationPipe({ transform: true }))
  async updateTaxSettings(
    @Body() updateDto: TaxSettingsDto,
    @CurrentUserSession() user: any,
  ): Promise<TaxSettingsResponseDto> {
    return this.taxGstService.updateTaxSettings(updateDto, user.id);
  }

  // Utility Endpoints
  @Get('statuses')
  // @Roles('admin', 'finance_manager', 'finance_user')
  @ApiOperation({ summary: 'Get available tax statuses' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Tax statuses retrieved successfully',
  })
  async getTaxStatuses(): Promise<string[]> {
    return this.taxGstService.getTaxStatuses();
  }

  @Get('types')
  // @Roles('admin', 'finance_manager', 'finance_user')
  @ApiOperation({ summary: 'Get available tax types' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Tax types retrieved successfully',
  })
  async getTaxTypes(): Promise<string[]> {
    return this.taxGstService.getTaxTypes();
  }

  @Get('compliance-statuses')
  // @Roles('admin', 'finance_manager', 'finance_user')
  @ApiOperation({ summary: 'Get available compliance statuses' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Compliance statuses retrieved successfully',
  })
  async getComplianceStatuses(): Promise<string[]> {
    return this.taxGstService.getComplianceStatuses();
  }

  @Get('return-statuses')
  // @Roles('admin', 'finance_manager', 'finance_user')
  @ApiOperation({ summary: 'Get available return statuses' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Return statuses retrieved successfully',
  })
  async getReturnStatuses(): Promise<string[]> {
    return this.taxGstService.getReturnStatuses();
  }

  @Post('validate-gst-number')
  // @Roles('admin', 'finance_manager', 'finance_user')
  @ApiOperation({ summary: 'Validate GST number' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'GST number validation result',
  })
  @ApiBody({
    schema: { type: 'object', properties: { gstNumber: { type: 'string' } } },
  })
  async validateGstNumber(@Body('gstNumber') gstNumber: string) {
    return this.taxGstService.validateGstNumber(gstNumber);
  }

  @Post('validate-pan-number')
  // @Roles('admin', 'finance_manager', 'finance_user')
  @ApiOperation({ summary: 'Validate PAN number' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'PAN number validation result',
  })
  @ApiBody({
    schema: { type: 'object', properties: { panNumber: { type: 'string' } } },
  })
  async validatePanNumber(@Body('panNumber') panNumber: string) {
    return this.taxGstService.validatePanNumber(panNumber);
  }

  @Get('tax-rates')
  // @Roles('admin', 'finance_manager', 'finance_user')
  @ApiOperation({ summary: 'Get current tax rates' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Tax rates retrieved successfully',
  })
  @ApiQuery({
    name: 'type',
    required: false,
    enum: TaxType,
    description: 'Filter by tax type',
  })
  @ApiQuery({
    name: 'effectiveDate',
    required: false,
    type: Date,
    description: 'Effective date for rates',
  })
  async getTaxRates(
    @Query('type') type?: TaxType,
    @Query('effectiveDate') effectiveDate?: Date,
  ) {
    return this.taxGstService.getTaxRules({
      category: type as any,
      effectiveDate: effectiveDate?.toISOString(),
    });
  }
}
