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
  BulkOperationResponseDto,
  BulkTaxOperationDto,
  CalculateTaxDto,
  CreateTaxCollectionDto,
  CreateTaxRuleDto,
  ExportResponseDto,
  ExportTaxDataDto,
  GetTaxCollectionsDto,
  GetTaxRulesDto,
  TaxAnalyticsDto,
  TaxAnalyticsResponseDto,
  TaxAuditTrailResponseDto,
  TaxCalculationResponseDto,
  TaxCollectionResponseDto,
  TaxComplianceDto,
  TaxComplianceResponseDto,
  TaxDeadlineDto,
  TaxDeadlineResponseDto,
  TaxReportDto,
  TaxReportResponseDto,
  TaxRuleResponseDto,
  TaxSettingsDto,
  TaxSettingsResponseDto,
  TaxSummaryResponseDto,
  UpdateTaxCollectionDto,
  UpdateTaxRuleDto,
} from './dto/tax-management.dto';
import { TaxManagementService } from './tax-management.service';

@ApiTags('Tax Management')
@Controller('tax')
@UseGuards(AuthGuard, RolesGuard)
@ApiBearerAuth()
export class TaxManagementController {
  constructor(private readonly taxManagementService: TaxManagementService) {}

  // Tax Rule Management
  @Post('rules')
  // @Roles('admin', 'finance_manager')
  @ApiOperation({ summary: 'Create a new tax rule' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Tax rule created successfully',
    type: TaxRuleResponseDto,
  })
  async createTaxRule(
    @Body() createTaxRuleDto: CreateTaxRuleDto,
    @CurrentUserSession() user: any,
  ): Promise<TaxRuleResponseDto> {
    return this.taxManagementService.createTaxRule(createTaxRuleDto, user.id);
  }

  @Get('rules')
  // @Roles('admin', 'finance_manager', 'finance_user')
  @ApiOperation({ summary: 'Get all tax rules with filtering and pagination' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Tax rules retrieved successfully',
  })
  async getTaxRules(
    @Query() getTaxRulesDto: GetTaxRulesDto,
  ): Promise<{ data: TaxRuleResponseDto[]; total: number }> {
    const result = await this.taxManagementService.getTaxRules(getTaxRulesDto);
    return { data: result.rules, total: result.total };
  }

  @Get('rules/:id')
  // @Roles('admin', 'finance_manager', 'finance_user')
  @ApiOperation({ summary: 'Get tax rule by ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Tax rule retrieved successfully',
    type: TaxRuleResponseDto,
  })
  async getTaxRuleById(
    @Param('id', ParseCoworsIdPipe) id: string,
  ): Promise<TaxRuleResponseDto> {
    return this.taxManagementService.getTaxRuleById(id);
  }

  @Put('rules/:id')
  // @Roles('admin', 'finance_manager')
  @ApiOperation({ summary: 'Update tax rule' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Tax rule updated successfully',
    type: TaxRuleResponseDto,
  })
  async updateTaxRule(
    @Param('id', ParseCoworsIdPipe) id: string,
    @Body() updateTaxRuleDto: UpdateTaxRuleDto,
    @CurrentUserSession() user: any,
  ): Promise<TaxRuleResponseDto> {
    return this.taxManagementService.updateTaxRule(
      id,
      updateTaxRuleDto,
      user.id,
    );
  }

  @Delete('rules/:id')
  // @Roles('admin', 'finance_manager')
  @ApiOperation({ summary: 'Delete tax rule' })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Tax rule deleted successfully',
  })
  async deleteTaxRule(
    @Param('id', ParseCoworsIdPipe) id: string,
    @CurrentUserSession() user: any,
  ): Promise<void> {
    return this.taxManagementService.deleteTaxRule(id, user.id);
  }

  @Post('rules/:id/activate')
  // @Roles('admin', 'finance_manager')
  @ApiOperation({ summary: 'Activate tax rule' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Tax rule activated successfully',
    type: TaxRuleResponseDto,
  })
  async activateTaxRule(
    @Param('id', ParseCoworsIdPipe) id: string,
    @CurrentUserSession() user: any,
  ): Promise<TaxRuleResponseDto> {
    return this.taxManagementService.activateTaxRule(id, user.id);
  }

  @Post('rules/:id/deactivate')
  // @Roles('admin', 'finance_manager')
  @ApiOperation({ summary: 'Deactivate tax rule' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Tax rule deactivated successfully',
    type: TaxRuleResponseDto,
  })
  async deactivateTaxRule(
    @Param('id', ParseCoworsIdPipe) id: string,
    @CurrentUserSession() user: any,
  ): Promise<TaxRuleResponseDto> {
    return this.taxManagementService.deactivateTaxRule(id, user.id);
  }

  // Tax Calculation
  @Post('calculate')
  // @Roles('admin', 'finance_manager', 'finance_user', 'partner')
  @ApiOperation({ summary: 'Calculate tax for given parameters' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Tax calculated successfully',
    type: TaxCalculationResponseDto,
  })
  async calculateTax(
    @Body() calculateTaxDto: CalculateTaxDto,
  ): Promise<TaxCalculationResponseDto> {
    return this.taxManagementService.calculateTax(calculateTaxDto);
  }

  @Post('calculate/bulk')
  // @Roles('admin', 'finance_manager', 'finance_user')
  @ApiOperation({ summary: 'Calculate tax for multiple transactions' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Bulk tax calculation completed',
  })
  async bulkCalculateTax(
    @Body() calculations: CalculateTaxDto[],
  ): Promise<TaxCalculationResponseDto[]> {
    const results = [];
    for (const calculation of calculations) {
      const result = await this.taxManagementService.calculateTax(calculation);
      results.push(result);
    }
    return results;
  }

  // Tax Collection Management
  @Post('collections')
  // @Roles('admin', 'finance_manager')
  @ApiOperation({ summary: 'Create a new tax collection record' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Tax collection created successfully',
    type: TaxCollectionResponseDto,
  })
  async createTaxCollection(
    @Body() createTaxCollectionDto: CreateTaxCollectionDto,
    @CurrentUserSession() user: any,
  ): Promise<TaxCollectionResponseDto> {
    return this.taxManagementService.createTaxCollection(
      createTaxCollectionDto,
      user.id,
    );
  }

  @Get('collections')
  // @Roles('admin', 'finance_manager', 'finance_user')
  @ApiOperation({
    summary: 'Get all tax collections with filtering and pagination',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Tax collections retrieved successfully',
  })
  async getTaxCollections(
    @Query() getTaxCollectionsDto: GetTaxCollectionsDto,
  ): Promise<{ data: TaxCollectionResponseDto[]; total: number }> {
    const result =
      await this.taxManagementService.getTaxCollections(getTaxCollectionsDto);
    return { data: result.collections, total: result.total };
  }

  @Get('collections/:id')
  // @Roles('admin', 'finance_manager', 'finance_user')
  @ApiOperation({ summary: 'Get tax collection by ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Tax collection retrieved successfully',
    type: TaxCollectionResponseDto,
  })
  async getTaxCollectionById(
    @Param('id', ParseCoworsIdPipe) id: string,
  ): Promise<TaxCollectionResponseDto> {
    return this.taxManagementService.getTaxCollectionById(id);
  }

  @Put('collections/:id')
  // @Roles('admin', 'finance_manager')
  @ApiOperation({ summary: 'Update tax collection' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Tax collection updated successfully',
    type: TaxCollectionResponseDto,
  })
  async updateTaxCollection(
    @Param('id', ParseCoworsIdPipe) id: string,
    @Body() updateTaxCollectionDto: UpdateTaxCollectionDto,
    @CurrentUserSession() user: any,
  ): Promise<TaxCollectionResponseDto> {
    return this.taxManagementService.updateTaxCollection(
      id,
      updateTaxCollectionDto,
      user.id,
    );
  }

  @Delete('collections/:id')
  // @Roles('admin', 'finance_manager')
  @ApiOperation({ summary: 'Delete tax collection' })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Tax collection deleted successfully',
  })
  async deleteTaxCollection(
    @Param('id', ParseCoworsIdPipe) id: string,
    @CurrentUserSession() user: any,
  ): Promise<void> {
    return this.taxManagementService.deleteTaxCollection(id, user.id);
  }

  @Post('collections/:id/submit')
  // @Roles('admin', 'finance_manager')
  @ApiOperation({ summary: 'Submit tax collection to authorities' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Tax collection submitted successfully',
    type: TaxCollectionResponseDto,
  })
  async submitTaxCollection(
    @Param('id', ParseCoworsIdPipe) id: string,
    @CurrentUserSession() user: any,
  ): Promise<TaxCollectionResponseDto> {
    return this.taxManagementService.submitTaxCollection(id, user.id);
  }

  @Post('collections/:id/approve')
  // @Roles('admin', 'finance_manager')
  @ApiOperation({ summary: 'Approve tax collection' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Tax collection approved successfully',
    type: TaxCollectionResponseDto,
  })
  async approveTaxCollection(
    @Param('id', ParseCoworsIdPipe) id: string,
    @Body('notes') notes: string,
    @CurrentUserSession() user: any,
  ): Promise<TaxCollectionResponseDto> {
    return this.taxManagementService.approveTaxCollection(id, user.id);
  }

  @Post('collections/:id/reject')
  // @Roles('admin', 'finance_manager')
  @ApiOperation({ summary: 'Reject tax collection' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Tax collection rejected successfully',
    type: TaxCollectionResponseDto,
  })
  async rejectTaxCollection(
    @Param('id', ParseCoworsIdPipe) id: string,
    @Body('reason') reason: string,
    @CurrentUserSession() user: any,
  ): Promise<TaxCollectionResponseDto> {
    return this.taxManagementService.rejectTaxCollection(id, reason, user.id);
  }

  // Bulk Operations
  @Post('collections/bulk/approve')
  // @Roles('admin', 'finance_manager')
  @ApiOperation({ summary: 'Bulk approve tax collections' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Bulk approval completed',
  })
  async bulkApproveTaxCollections(
    @Body() bulkOperationDto: BulkTaxOperationDto,
    @CurrentUserSession() user: any,
  ): Promise<BulkOperationResponseDto> {
    const operationDto = { ...bulkOperationDto, operation: 'approve' };
    return this.taxManagementService.bulkTaxCollectionOperation(
      operationDto,
      user.id,
    );
  }

  @Post('collections/bulk/reject')
  // @Roles('admin', 'finance_manager')
  @ApiOperation({ summary: 'Bulk reject tax collections' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Bulk rejection completed',
  })
  async bulkRejectTaxCollections(
    @Body() bulkOperationDto: BulkTaxOperationDto,
    @CurrentUserSession() user: any,
  ): Promise<BulkOperationResponseDto> {
    const operationDto = { ...bulkOperationDto, operation: 'reject' };
    return this.taxManagementService.bulkTaxCollectionOperation(
      operationDto,
      user.id,
    );
  }

  @Post('collections/bulk/submit')
  // @Roles('admin', 'finance_manager')
  @ApiOperation({ summary: 'Bulk submit tax collections' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Bulk submission completed',
  })
  async bulkSubmitTaxCollections(
    @Body() bulkOperationDto: BulkTaxOperationDto,
    @CurrentUserSession() user: any,
  ): Promise<BulkOperationResponseDto> {
    const operationDto = { ...bulkOperationDto, operation: 'submit' };
    return this.taxManagementService.bulkTaxCollectionOperation(
      operationDto,
      user.id,
    );
  }

  @Post('collections/bulk/delete')
  // @Roles('admin', 'finance_manager')
  @ApiOperation({ summary: 'Bulk delete tax collections' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Bulk deletion completed',
  })
  async bulkDeleteTaxCollections(
    @Body() bulkOperationDto: BulkTaxOperationDto,
    @CurrentUserSession() user: any,
  ): Promise<BulkOperationResponseDto> {
    const operationDto = { ...bulkOperationDto, operation: 'delete' };
    return this.taxManagementService.bulkTaxCollectionOperation(
      operationDto,
      user.id,
    );
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
    @Query() analyticsDto: TaxAnalyticsDto,
  ): Promise<TaxAnalyticsResponseDto> {
    return this.taxManagementService.getTaxAnalytics(analyticsDto);
  }

  @Get('summary')
  // @Roles('admin', 'finance_manager', 'finance_user')
  @ApiOperation({ summary: 'Get tax summary for dashboard' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Tax summary retrieved successfully',
    type: TaxSummaryResponseDto,
  })
  async getTaxSummary(): Promise<TaxSummaryResponseDto> {
    return this.taxManagementService.getTaxSummary();
  }

  @Post('reports/generate')
  // @Roles('admin', 'finance_manager', 'finance_user')
  @ApiOperation({ summary: 'Generate tax report' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Tax report generated successfully',
    type: TaxReportResponseDto,
  })
  async generateTaxReport(
    @Body() reportDto: TaxReportDto,
    @CurrentUserSession() user: any,
  ): Promise<TaxReportResponseDto> {
    return this.taxManagementService.generateTaxReport(reportDto, user.id);
  }

  @Get('reports')
  // @Roles('admin', 'finance_manager', 'finance_user')
  @ApiOperation({ summary: 'Get all tax reports' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Tax reports retrieved successfully',
  })
  async getTaxReports(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ): Promise<{ data: TaxReportResponseDto[]; total: number }> {
    const { reports, total } = await this.taxManagementService.getTaxReports(
      Number(page) || 1,
      Number(limit) || 10,
    );
    return { data: reports, total };
  }

  @Get('reports/:id')
  // @Roles('admin', 'finance_manager', 'finance_user')
  @ApiOperation({ summary: 'Get tax report by ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Tax report retrieved successfully',
    type: TaxReportResponseDto,
  })
  async getTaxReportById(
    @Param('id', ParseCoworsIdPipe) id: string,
  ): Promise<TaxReportResponseDto> {
    return this.taxManagementService.getTaxReportById(id);
  }

  @Get('reports/:id/download')
  // @Roles('admin', 'finance_manager', 'finance_user')
  @ApiOperation({ summary: 'Download tax report' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Tax report download URL',
  })
  async downloadTaxReport(
    @Param('id', ParseCoworsIdPipe) id: string,
  ): Promise<{ downloadUrl: string }> {
    return this.taxManagementService.downloadTaxReport(id);
  }

  // Export and Download
  @Post('export')
  // @Roles('admin', 'finance_manager', 'finance_user')
  @ApiOperation({ summary: 'Export tax data' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Tax data export initiated',
    type: ExportResponseDto,
  })
  async exportTaxData(
    @Body() exportDto: ExportTaxDataDto,
    @CurrentUserSession() user: any,
  ): Promise<ExportResponseDto> {
    return this.taxManagementService.exportTaxData(exportDto, user.id);
  }

  @Get('export/:exportId/status')
  // @Roles('admin', 'finance_manager', 'finance_user')
  @ApiOperation({ summary: 'Get export status' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Export status retrieved',
    type: ExportResponseDto,
  })
  async getExportStatus(
    @Param('exportId', ParseCoworsIdPipe) exportId: string,
  ): Promise<ExportResponseDto> {
    return this.taxManagementService.getExportStatus(exportId);
  }

  // Compliance Management
  @Get('compliance')
  // @Roles('admin', 'finance_manager', 'finance_user')
  @ApiOperation({ summary: 'Get tax compliance status' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Tax compliance status retrieved',
    type: TaxComplianceResponseDto,
  })
  async getTaxCompliance(
    @Query() complianceDto: TaxComplianceDto,
  ): Promise<TaxComplianceResponseDto> {
    return this.taxManagementService.getTaxCompliance(complianceDto);
  }

  @Get('deadlines')
  // @Roles('admin', 'finance_manager', 'finance_user')
  @ApiOperation({ summary: 'Get upcoming tax deadlines' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Tax deadlines retrieved successfully',
  })
  async getTaxDeadlines(): Promise<{
    data: TaxDeadlineResponseDto[];
    total: number;
  }> {
    const deadlines = await this.taxManagementService.getTaxDeadlines();
    return { data: deadlines, total: deadlines.length };
  }

  @Post('deadlines')
  // @Roles('admin', 'finance_manager')
  @ApiOperation({ summary: 'Create tax deadline reminder' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Tax deadline created successfully',
    type: TaxDeadlineResponseDto,
  })
  async createTaxDeadline(
    @Body() deadlineDto: TaxDeadlineDto,
    @CurrentUserSession() user: any,
  ): Promise<TaxDeadlineResponseDto> {
    return this.taxManagementService.createTaxDeadline(deadlineDto, user.id);
  }

  @Put('deadlines/:id')
  // @Roles('admin', 'finance_manager')
  @ApiOperation({ summary: 'Update tax deadline' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Tax deadline updated successfully',
    type: TaxDeadlineResponseDto,
  })
  async updateTaxDeadline(
    @Param('id', ParseCoworsIdPipe) id: string,
    @Body() deadlineDto: TaxDeadlineDto,
    @CurrentUserSession() user: any,
  ): Promise<TaxDeadlineResponseDto> {
    return this.taxManagementService.updateTaxDeadline(
      id,
      deadlineDto,
      user.id,
    );
  }

  @Delete('deadlines/:id')
  // @Roles('admin', 'finance_manager')
  @ApiOperation({ summary: 'Delete tax deadline' })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Tax deadline deleted successfully',
  })
  async deleteTaxDeadline(
    @Param('id', ParseCoworsIdPipe) id: string,
    @CurrentUserSession() user: any,
  ): Promise<void> {
    return this.taxManagementService.deleteTaxDeadline(id, user.id);
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
    return this.taxManagementService.getTaxSettings();
  }

  @Put('settings')
  // @Roles('admin', 'finance_manager')
  @ApiOperation({ summary: 'Update tax settings' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Tax settings updated successfully',
    type: TaxSettingsResponseDto,
  })
  async updateTaxSettings(
    @Body() settingsDto: TaxSettingsDto,
    @CurrentUserSession() user: any,
  ): Promise<TaxSettingsResponseDto> {
    return this.taxManagementService.updateTaxSettings(settingsDto, user.id);
  }

  // Audit Trail
  @Get('audit-trail')
  // @Roles('admin', 'finance_manager')
  @ApiOperation({ summary: 'Get tax audit trail' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Tax audit trail retrieved successfully',
  })
  async getTaxAuditTrail(
    @Query('entityId') entityId?: string,
    @Query('entityType') entityType?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ): Promise<{ data: TaxAuditTrailResponseDto[]; total: number }> {
    return this.taxManagementService.getTaxAuditTrail(
      entityId,
      entityType,
      Number(page) || 1,
      Number(limit) || 10,
    );
  }

  // Utility Endpoints
  @Get('types')
  // @Roles('admin', 'finance_manager', 'finance_user', 'partner')
  @ApiOperation({ summary: 'Get available tax types' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Tax types retrieved successfully',
  })
  async getTaxTypes(): Promise<string[]> {
    return this.taxManagementService.getTaxTypes();
  }

  @Get('categories')
  // @Roles('admin', 'finance_manager', 'finance_user', 'partner')
  @ApiOperation({ summary: 'Get available tax categories' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Tax categories retrieved successfully',
  })
  async getTaxCategories(): Promise<string[]> {
    return this.taxManagementService.getTaxCategories();
  }

  @Get('statuses')
  @Roles('admin', 'finance_manager', 'finance_user')
  @ApiOperation({ summary: 'Get available tax collection statuses' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Tax statuses retrieved successfully',
  })
  async getTaxStatuses(): Promise<string[]> {
    return this.taxManagementService.getTaxStatuses();
  }

  @Post('validate')
  @Roles('admin', 'finance_manager', 'finance_user')
  @ApiOperation({ summary: 'Validate tax calculation' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Tax calculation validation result',
  })
  async validateTaxCalculation(
    @Body() calculateTaxDto: CalculateTaxDto,
  ): Promise<{ isValid: boolean; errors: string[] }> {
    return this.taxManagementService.validateTaxCalculation(calculateTaxDto);
  }
}
