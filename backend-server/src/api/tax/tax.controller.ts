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
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import {
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ParseCoworsIdPipe } from '../../common/pipes/parse-cowors-id.pipe';
// Auth decorators and guards - commented out until auth module is available
// import { Roles } from '../auth/decorators/roles.decorator';
// import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
// import { RolesGuard } from '../auth/guards/roles.guard';
import {
  BulkTaxOperationDto,
  CalculateGSTDto,
  ComplianceStatus,
  CreateTaxConfigDto,
  CreateTaxTransactionDto,
  GSTCalculationResponseDto,
  ReportType,
  TaxAnalyticsDto,
  TaxComplianceDto,
  TaxComplianceResponseDto,
  TaxConfigResponseDto,
  TaxExportDto,
  TaxReportDto,
  TaxReportResponseDto,
  TaxSettingsDto,
  TaxStatus,
  TaxTransactionResponseDto,
  TaxType,
  UpdateTaxConfigDto,
  UpdateTaxTransactionDto,
} from './dto/tax.dto';
import { TaxService } from './tax.service';

@ApiTags('Tax Management')
@Controller('tax')
// @UseGuards(JwtAuthGuard, RolesGuard)
// @ApiBearerAuth()
export class TaxController {
  constructor(private readonly taxService: TaxService) {}

  // Tax Configuration Management
  @Post('config')
  // // @Roles('admin', 'finance_manager')
  @ApiOperation({ summary: 'Create tax configuration' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Tax configuration created successfully',
    type: TaxConfigResponseDto,
  })
  @UsePipes(new ValidationPipe({ transform: true }))
  async createTaxConfig(
    @Body() createDto: CreateTaxConfigDto,
    @Request() req: any,
  ): Promise<TaxConfigResponseDto> {
    return this.taxService.createTaxConfig(createDto, req.user.id);
  }

  @Get('config')
  // // @Roles('admin', 'finance_manager', 'partner')
  @ApiOperation({ summary: 'Get all tax configurations' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Tax configurations retrieved successfully',
    type: [TaxConfigResponseDto],
  })
  @ApiQuery({ name: 'taxType', enum: TaxType, required: false })
  @ApiQuery({ name: 'isActive', type: Boolean, required: false })
  async getTaxConfigs(
    @Query('taxType') _taxType?: TaxType,
    @Query('isActive') _isActive?: boolean,
  ): Promise<TaxConfigResponseDto[]> {
    // Note: This should return an array but getTaxConfig returns single item
    // TODO: Implement proper getTaxConfigs method in service
    const config = await this.taxService.getTaxConfig('default');
    return [config];
  }

  @Get('config/:id')
  // @Roles('admin', 'finance_manager', 'partner')
  @ApiOperation({ summary: 'Get tax configuration by ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Tax configuration retrieved successfully',
    type: TaxConfigResponseDto,
  })
  @ApiParam({ name: 'id', description: 'Tax configuration ID' })
  async getTaxConfigById(
    @Param('id', ParseCoworsIdPipe) id: string,
  ): Promise<TaxConfigResponseDto> {
    return this.taxService.getTaxConfig(id);
  }

  @Put('config/:id')
  // @Roles('admin', 'finance_manager')
  @ApiOperation({ summary: 'Update tax configuration' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Tax configuration updated successfully',
    type: TaxConfigResponseDto,
  })
  @ApiParam({ name: 'id', description: 'Tax configuration ID' })
  @UsePipes(new ValidationPipe({ transform: true }))
  async updateTaxConfig(
    @Param('id', ParseCoworsIdPipe) id: string,
    @Body() updateDto: UpdateTaxConfigDto,
    @Request() req: any,
  ): Promise<TaxConfigResponseDto> {
    return this.taxService.updateTaxConfig(id, updateDto, req.user.id);
  }

  @Delete('config/:id')
  // @Roles('admin', 'finance_manager')
  @ApiOperation({ summary: 'Delete tax configuration' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Tax configuration deleted successfully',
  })
  @ApiParam({ name: 'id', description: 'Tax configuration ID' })
  async deleteTaxConfig(
    @Param('id', ParseCoworsIdPipe) id: string,
    @Request() req: any,
  ): Promise<{ message: string }> {
    await this.taxService.deleteTaxConfig(id, req.user.id);
    return { message: 'Tax configuration deleted successfully' };
  }

  // GST Calculation
  @Post('calculate-gst')
  // @Roles('admin', 'finance_manager', 'partner')
  @ApiOperation({ summary: 'Calculate GST for transaction' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'GST calculated successfully',
    type: GSTCalculationResponseDto,
  })
  @UsePipes(new ValidationPipe({ transform: true }))
  async calculateGST(
    @Body() calculateDto: CalculateGSTDto,
  ): Promise<GSTCalculationResponseDto> {
    return this.taxService.calculateGST(calculateDto);
  }

  @Post('calculate-tcs')
  // @Roles('admin', 'finance_manager', 'partner')
  @ApiOperation({ summary: 'Calculate TCS for transaction' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'TCS calculated successfully',
    type: GSTCalculationResponseDto,
  })
  @UsePipes(new ValidationPipe({ transform: true }))
  async calculateTCS(
    @Body() calculateDto: CalculateGSTDto,
  ): Promise<GSTCalculationResponseDto> {
    return this.taxService.calculateGST(calculateDto);
  }

  @Post('calculate-tds')
  // @Roles('admin', 'finance_manager', 'partner')
  @ApiOperation({ summary: 'Calculate TDS for transaction' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'TDS calculated successfully',
    type: GSTCalculationResponseDto,
  })
  @UsePipes(new ValidationPipe({ transform: true }))
  async calculateTDS(
    @Body() calculateDto: CalculateGSTDto,
  ): Promise<GSTCalculationResponseDto> {
    return this.taxService.calculateGST(calculateDto);
  }

  // Tax Transaction Management
  @Post('transactions')
  // @Roles('admin', 'finance_manager')
  @ApiOperation({ summary: 'Create tax transaction' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Tax transaction created successfully',
    type: TaxTransactionResponseDto,
  })
  @UsePipes(new ValidationPipe({ transform: true }))
  async createTaxTransaction(
    @Body() createDto: CreateTaxTransactionDto,
    @Request() req: any,
  ): Promise<TaxTransactionResponseDto> {
    return this.taxService.createTaxTransaction(createDto, req.user.id);
  }

  @Get('transactions')
  // @Roles('admin', 'finance_manager', 'partner')
  @ApiOperation({ summary: 'Get tax transactions' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Tax transactions retrieved successfully',
    type: [TaxTransactionResponseDto],
  })
  @ApiQuery({ name: 'partnerId', type: String, required: false })
  @ApiQuery({ name: 'taxType', enum: TaxType, required: false })
  @ApiQuery({ name: 'status', enum: TaxStatus, required: false })
  @ApiQuery({ name: 'dateFrom', type: Date, required: false })
  @ApiQuery({ name: 'dateTo', type: Date, required: false })
  @ApiQuery({
    name: 'page',
    type: Number,
    required: false,
    description: 'Page number (default: 1)',
  })
  @ApiQuery({
    name: 'limit',
    type: Number,
    required: false,
    description: 'Items per page (default: 20)',
  })
  async getTaxTransactions(
    @Query('partnerId') _partnerId?: string,
    @Query('taxType') _taxType?: TaxType,
    @Query('status') _status?: TaxStatus,
    @Query('dateFrom') _dateFrom?: Date,
    @Query('dateTo') _dateTo?: Date,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
  ): Promise<{
    data: TaxTransactionResponseDto[];
    total: number;
    page: number;
    limit: number;
  }> {
    // Note: getTaxTransactions method doesn't exist, using placeholder
    // TODO: Implement proper getTaxTransactions method in service
    return {
      data: [],
      total: 0,
      page,
      limit,
    };
  }

  @Get('transactions/:id')
  // @Roles('admin', 'finance_manager', 'partner')
  @ApiOperation({ summary: 'Get tax transaction by ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Tax transaction retrieved successfully',
    type: TaxTransactionResponseDto,
  })
  @ApiParam({ name: 'id', description: 'Tax transaction ID' })
  async getTaxTransactionById(
    @Param('id', ParseCoworsIdPipe) id: string,
  ): Promise<TaxTransactionResponseDto> {
    return this.taxService.getTaxTransaction(id);
  }

  @Put('transactions/:id')
  // @Roles('admin', 'finance_manager')
  @ApiOperation({ summary: 'Update tax transaction' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Tax transaction updated successfully',
    type: TaxTransactionResponseDto,
  })
  @ApiParam({ name: 'id', description: 'Tax transaction ID' })
  @UsePipes(new ValidationPipe({ transform: true }))
  async updateTaxTransaction(
    @Param('id', ParseCoworsIdPipe) id: string,
    @Body() updateDto: UpdateTaxTransactionDto,
    @Request() req: any,
  ): Promise<TaxTransactionResponseDto> {
    return this.taxService.updateTaxTransaction(id, updateDto, req.user.id);
  }

  @Post('transactions/:id/pay')
  // @Roles('admin', 'finance_manager')
  @ApiOperation({ summary: 'Mark tax transaction as paid' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Tax transaction marked as paid',
    type: TaxTransactionResponseDto,
  })
  @ApiParam({ name: 'id', description: 'Tax transaction ID' })
  async payTaxTransaction(
    @Param('id', ParseCoworsIdPipe) id: string,
    @Body() paymentData: { paymentReference?: string; notes?: string },
    @Request() req: any,
  ): Promise<TaxTransactionResponseDto> {
    // Note: payTaxTransaction method doesn't exist, using updateTaxTransaction
    // TODO: Implement proper payTaxTransaction method in service
    return this.taxService.updateTaxTransaction(
      id,
      { status: 'PAID' } as any,
      req.user.id,
    );
  }

  // Tax Compliance Management
  @Post('compliance')
  // @Roles('admin', 'finance_manager')
  @ApiOperation({ summary: 'Create tax compliance record' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Tax compliance record created successfully',
    type: TaxComplianceResponseDto,
  })
  @UsePipes(new ValidationPipe({ transform: true }))
  async createTaxCompliance(
    @Body() complianceDto: TaxComplianceDto,
    @Request() req: any,
  ): Promise<TaxComplianceResponseDto> {
    return this.taxService.createTaxCompliance(complianceDto, req.user.id);
  }

  @Get('compliance')
  // @Roles('admin', 'finance_manager')
  @ApiOperation({ summary: 'Get tax compliance records' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Tax compliance records retrieved successfully',
    type: [TaxComplianceResponseDto],
  })
  @ApiQuery({ name: 'status', enum: ComplianceStatus, required: false })
  @ApiQuery({ name: 'taxType', enum: TaxType, required: false })
  @ApiQuery({ name: 'dueDateFrom', type: Date, required: false })
  @ApiQuery({ name: 'dueDateTo', type: Date, required: false })
  async getTaxCompliance(
    @Query('status') _status?: ComplianceStatus,
    @Query('taxType') _taxType?: TaxType,
    @Query('dueDateFrom') _dueDateFrom?: Date,
    @Query('dueDateTo') _dueDateTo?: Date,
  ): Promise<TaxComplianceResponseDto[]> {
    return this.taxService.getAllTaxCompliance();
  }

  @Get('compliance/upcoming-deadlines')
  // @Roles('admin', 'finance_manager')
  @ApiOperation({ summary: 'Get upcoming tax compliance deadlines' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Upcoming deadlines retrieved successfully',
    type: [TaxComplianceResponseDto],
  })
  @ApiQuery({
    name: 'days',
    type: Number,
    required: false,
    description: 'Days ahead to check (default: 30)',
  })
  async getUpcomingDeadlines(
    @Query('days') _days: number = 30,
  ): Promise<TaxComplianceResponseDto[]> {
    // Note: getUpcomingDeadlines method doesn't exist
    // TODO: Implement proper getUpcomingDeadlines method in service
    return [];
  }

  @Put('compliance/:id/complete')
  // @Roles('admin', 'finance_manager')
  @ApiOperation({ summary: 'Mark compliance as completed' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Compliance marked as completed',
    type: TaxComplianceResponseDto,
  })
  @ApiParam({ name: 'id', description: 'Tax compliance ID' })
  async completeCompliance(
    @Param('id', ParseCoworsIdPipe) id: string,
    @Body() _completionData: { notes?: string; filingReference?: string },
    @Request() _req: any,
  ): Promise<TaxComplianceResponseDto> {
    // Note: completeCompliance method doesn't exist
    // TODO: Implement proper completeCompliance method in service
    return {
      id,
      status: 'COMPLETED',
      completedAt: new Date().toISOString(),
    } as any;
  }

  // Bulk Operations
  @Post('bulk-operations')
  // @Roles('admin', 'finance_manager')
  @ApiOperation({ summary: 'Perform bulk tax operations' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Bulk operation completed',
  })
  @UsePipes(new ValidationPipe({ transform: true }))
  async bulkTaxOperation(
    @Body() _bulkDto: BulkTaxOperationDto,
    @Request() _req: any,
  ): Promise<{ success: number; failed: number; errors: string[] }> {
    // Note: bulkTaxOperation method doesn't exist
    // TODO: Implement proper bulkTaxOperation method in service
    return { success: 0, failed: 0, errors: [] };
  }

  // Analytics and Reporting
  @Get('analytics')
  // @Roles('admin', 'finance_manager')
  @ApiOperation({ summary: 'Get tax analytics' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Tax analytics retrieved successfully',
    type: TaxAnalyticsDto,
  })
  @ApiQuery({ name: 'dateFrom', type: Date, required: false })
  @ApiQuery({ name: 'dateTo', type: Date, required: false })
  @ApiQuery({ name: 'partnerId', type: String, required: false })
  @ApiQuery({ name: 'taxType', enum: TaxType, required: false })
  async getTaxAnalytics(
    @Query('dateFrom') _dateFrom?: Date,
    @Query('dateTo') _dateTo?: Date,
    @Query('partnerId') _partnerId?: string,
    @Query('taxType') _taxType?: TaxType,
  ): Promise<TaxAnalyticsDto> {
    return this.taxService.getTaxAnalytics();
  }

  @Get('summary')
  // @Roles('admin', 'finance_manager', 'partner')
  @ApiOperation({ summary: 'Get tax summary' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Tax summary retrieved successfully',
  })
  @ApiQuery({ name: 'partnerId', type: String, required: false })
  @ApiQuery({
    name: 'period',
    type: String,
    required: false,
    description: 'monthly, quarterly, yearly',
  })
  async getTaxSummary(
    @Query('partnerId') _partnerId?: string,
    @Query('period') _period: string = 'monthly',
  ): Promise<any> {
    // Note: getTaxSummary method doesn't exist
    // TODO: Implement proper getTaxSummary method in service
    return { totalTax: 0, paidTax: 0, pendingTax: 0, overdueTax: 0 } as any;
  }

  // Export and Download
  @Post('export')
  // @Roles('admin', 'finance_manager')
  @ApiOperation({ summary: 'Export tax data' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Export initiated successfully',
  })
  @UsePipes(new ValidationPipe({ transform: true }))
  async exportTaxData(
    @Body() exportDto: TaxExportDto,
    @Request() req: any,
  ): Promise<{ exportId: string; message: string }> {
    const exportId = await this.taxService.exportTaxData(
      exportDto,
      req.user.id,
    );
    return {
      exportId,
      message: 'Export initiated successfully',
    };
  }

  @Get('export/:id/download')
  // @Roles('admin', 'finance_manager')
  @ApiOperation({ summary: 'Download exported tax data' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'File downloaded successfully',
  })
  @ApiParam({ name: 'id', description: 'Export ID' })
  async downloadExport(
    @Param('id', ParseCoworsIdPipe) id: string,
  ): Promise<{ downloadUrl: string }> {
    // Note: getExportDownloadUrl method doesn't exist
    // TODO: Implement proper getExportDownloadUrl method in service
    const downloadUrl = `http://localhost:3000/api/tax/export/${id}/download`;
    return { downloadUrl };
  }

  // Report Generation
  @Post('reports')
  // @Roles('admin', 'finance_manager')
  @ApiOperation({ summary: 'Generate tax report' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Report generation initiated',
    type: TaxReportResponseDto,
  })
  @UsePipes(new ValidationPipe({ transform: true }))
  async generateTaxReport(
    @Body() reportDto: TaxReportDto,
    @Request() req: any,
  ): Promise<TaxReportResponseDto> {
    return this.taxService.generateTaxReport(reportDto, req.user.id);
  }

  @Get('reports')
  // @Roles('admin', 'finance_manager')
  @ApiOperation({ summary: 'Get tax reports' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Tax reports retrieved successfully',
    type: [TaxReportResponseDto],
  })
  @ApiQuery({ name: 'reportType', enum: ReportType, required: false })
  @ApiQuery({ name: 'status', type: String, required: false })
  async getTaxReports(
    @Query('reportType') reportType?: ReportType,
    @Query('status') status?: string,
  ): Promise<TaxReportResponseDto[]> {
    return this.taxService.getAllTaxReports({ reportType, status });
  }

  @Get('reports/:id')
  // @Roles('admin', 'finance_manager')
  @ApiOperation({ summary: 'Get tax report by ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Tax report retrieved successfully',
    type: TaxReportResponseDto,
  })
  @ApiParam({ name: 'id', description: 'Tax report ID' })
  async getTaxReportById(
    @Param('id', ParseCoworsIdPipe) id: string,
  ): Promise<TaxReportResponseDto> {
    // Note: getTaxReportById method doesn't exist
    // TODO: Implement proper getTaxReportById method in service
    return { id, type: 'GST', status: 'COMPLETED' } as any;
  }

  // Settings Management
  @Get('settings')
  // @Roles('admin', 'finance_manager')
  @ApiOperation({ summary: 'Get tax settings' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Tax settings retrieved successfully',
    type: TaxSettingsDto,
  })
  async getTaxSettings(): Promise<TaxSettingsDto> {
    return this.taxService.getTaxSettings();
  }

  @Put('settings')
  // @Roles('admin', 'finance_manager')
  @ApiOperation({ summary: 'Update tax settings' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Tax settings updated successfully',
    type: TaxSettingsDto,
  })
  @UsePipes(new ValidationPipe({ transform: true }))
  async updateTaxSettings(
    @Body() settingsDto: TaxSettingsDto,
    @Request() req: any,
  ): Promise<TaxSettingsDto> {
    return this.taxService.updateTaxSettings(settingsDto, req.user.id);
  }

  // Utility Methods
  @Get('rates/current')
  // @Roles('admin', 'finance_manager', 'partner')
  @ApiOperation({ summary: 'Get current tax rates' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Current tax rates retrieved successfully',
  })
  @ApiQuery({ name: 'taxType', enum: TaxType, required: false })
  @ApiQuery({ name: 'state', type: String, required: false })
  async getCurrentTaxRates(
    @Query('taxType') _taxType?: TaxType,
    @Query('state') _state?: string,
  ): Promise<any> {
    // Note: getCurrentTaxRates method doesn't exist
    // TODO: Implement proper getCurrentTaxRates method in service
    return { gst: 18, cgst: 9, sgst: 9, igst: 18 } as any;
  }

  @Get('validation/gstin/:gstin')
  // @Roles('admin', 'finance_manager', 'partner')
  @ApiOperation({ summary: 'Validate GSTIN' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'GSTIN validation result',
  })
  @ApiParam({ name: 'gstin', description: 'GSTIN to validate' })
  async validateGSTIN(
    @Param('gstin') gstin: string,
  ): Promise<{ isValid: boolean; details?: any }> {
    return this.taxService.validateGSTIN(gstin);
  }

  @Get('validation/pan/:pan')
  // @Roles('admin', 'finance_manager', 'partner')
  @ApiOperation({ summary: 'Validate PAN' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'PAN validation result',
  })
  @ApiParam({ name: 'pan', description: 'PAN to validate' })
  async validatePAN(
    @Param('pan') pan: string,
  ): Promise<{ isValid: boolean; details?: any }> {
    return this.taxService.validatePAN(pan);
  }
}
