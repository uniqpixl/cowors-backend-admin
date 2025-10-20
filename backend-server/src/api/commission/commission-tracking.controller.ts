import { GetUser } from '@/decorators/auth/get-user.decorator';
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
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { ParseCoworsIdPipe } from '../../common/pipes/parse-cowors-id.pipe';
import { CommissionTrackingService } from './commission-tracking.service';
import {
  BulkCommissionCalculationDto,
  BulkCommissionUpdateDto,
  CommissionAnalyticsDto,
  CommissionAuditDto,
  CommissionCalculationResponseDto,
  CommissionExportDto,
  CommissionForecastDto,
  CommissionPayoutResponseDto,
  CommissionReconciliationDto,
  CommissionReportDto,
  CommissionRuleResponseDto,
  CommissionSettingsDto,
  CommissionStatsDto,
  CommissionSummaryDto,
  CreateCommissionCalculationDto,
  CreateCommissionPayoutDto,
  CreateCommissionRuleDto,
  CreatePartnerCommissionDto,
  GetCommissionCalculationsDto,
  GetCommissionPayoutsDto,
  GetCommissionRulesDto,
  GetCommissionSummaryDto,
  GetPartnerCommissionsDto,
  PartnerCommissionResponseDto,
  PartnerPerformanceDto,
  TransactionType,
  UpdateCommissionCalculationDto,
  UpdateCommissionPayoutDto,
  UpdateCommissionRuleDto,
  UpdatePartnerCommissionDto,
} from './dto/commission-tracking.dto';

@ApiTags('Commission Tracking')
@Controller('commission')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class CommissionTrackingController {
  constructor(
    private readonly commissionTrackingService: CommissionTrackingService,
  ) {}

  // Commission Rules Management
  @Post('rules')
  @Roles('admin', 'manager')
  @ApiOperation({ summary: 'Create commission rule' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Commission rule created successfully',
    type: CommissionRuleResponseDto,
  })
  @UsePipes(new ValidationPipe({ transform: true }))
  async createCommissionRule(
    @Body() createDto: CreateCommissionRuleDto,
    @GetUser('id') userId: string,
  ): Promise<CommissionRuleResponseDto> {
    return this.commissionTrackingService.createCommissionRule(
      createDto,
      userId,
    );
  }

  @Get('rules')
  @Roles('admin', 'manager', 'partner')
  @ApiOperation({ summary: 'Get commission rules' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Commission rules retrieved successfully',
  })
  async getCommissionRules(@Query() query: GetCommissionRulesDto): Promise<{
    data: CommissionRuleResponseDto[];
    total: number;
    page: number;
    limit: number;
  }> {
    return this.commissionTrackingService.getCommissionRules(query);
  }

  @Get('rules/:id')
  @Roles('admin', 'manager', 'partner')
  @ApiOperation({ summary: 'Get commission rule by ID' })
  @ApiParam({ name: 'id', description: 'Commission rule ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Commission rule retrieved successfully',
    type: CommissionRuleResponseDto,
  })
  async getCommissionRuleById(
    @Param('id', ParseCoworsIdPipe) id: string,
  ): Promise<CommissionRuleResponseDto> {
    return this.commissionTrackingService.getCommissionRuleById(id);
  }

  @Put('rules/:id')
  @Roles('admin', 'manager')
  @ApiOperation({ summary: 'Update commission rule' })
  @ApiParam({ name: 'id', description: 'Commission rule ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Commission rule updated successfully',
    type: CommissionRuleResponseDto,
  })
  @UsePipes(new ValidationPipe({ transform: true }))
  async updateCommissionRule(
    @Param('id', ParseCoworsIdPipe) id: string,
    @Body() updateDto: UpdateCommissionRuleDto,
    @GetUser('id') userId: string,
  ): Promise<CommissionRuleResponseDto> {
    return this.commissionTrackingService.updateCommissionRule(
      id,
      updateDto,
      userId,
    );
  }

  @Delete('rules/:id')
  @Roles('admin', 'manager')
  @ApiOperation({ summary: 'Delete commission rule' })
  @ApiParam({ name: 'id', description: 'Commission rule ID' })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Commission rule deleted successfully',
  })
  async deleteCommissionRule(
    @Param('id', ParseCoworsIdPipe) id: string,
    @GetUser('id') userId: string,
  ): Promise<void> {
    return this.commissionTrackingService.deleteCommissionRule(id, userId);
  }

  @Put('rules/:id/activate')
  @Roles('admin', 'manager')
  @ApiOperation({ summary: 'Activate commission rule' })
  @ApiParam({ name: 'id', description: 'Commission rule ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Commission rule activated successfully',
    type: CommissionRuleResponseDto,
  })
  async activateCommissionRule(
    @Param('id', ParseCoworsIdPipe) id: string,
    @GetUser('id') userId: string,
  ): Promise<CommissionRuleResponseDto> {
    return this.commissionTrackingService.activateCommissionRule(id, userId);
  }

  @Put('rules/:id/deactivate')
  @Roles('admin', 'manager')
  @ApiOperation({ summary: 'Deactivate commission rule' })
  @ApiParam({ name: 'id', description: 'Commission rule ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Commission rule deactivated successfully',
    type: CommissionRuleResponseDto,
  })
  async deactivateCommissionRule(
    @Param('id', ParseCoworsIdPipe) id: string,
    @GetUser('id') userId: string,
  ): Promise<CommissionRuleResponseDto> {
    return this.commissionTrackingService.deactivateCommissionRule(id, userId);
  }

  // Commission Calculations
  @Post('calculations')
  @Roles('admin', 'manager', 'system')
  @ApiOperation({ summary: 'Create commission calculation' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Commission calculation created successfully',
    type: CommissionCalculationResponseDto,
  })
  @UsePipes(new ValidationPipe({ transform: true }))
  async createCommissionCalculation(
    @Body() createDto: CreateCommissionCalculationDto,
    @GetUser('id') userId: string,
  ): Promise<CommissionCalculationResponseDto> {
    return this.commissionTrackingService.createCommissionCalculation(
      createDto,
      userId,
    );
  }

  @Post('calculations/bulk')
  @Roles('admin', 'manager', 'system')
  @ApiOperation({ summary: 'Create bulk commission calculations' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Bulk commission calculations created successfully',
  })
  @UsePipes(new ValidationPipe({ transform: true }))
  async createBulkCommissionCalculations(
    @Body() bulkDto: BulkCommissionCalculationDto,
    @GetUser('id') userId: string,
  ): Promise<{ created: number; failed: number; errors: any[] }> {
    const result =
      await this.commissionTrackingService.bulkCreateCommissionCalculations(
        bulkDto,
        userId,
      );
    return {
      created: result.calculations.length,
      failed: result.errors.length,
      errors: result.errors,
    };
  }

  @Get('calculations')
  @Roles('admin', 'manager', 'partner')
  @ApiOperation({ summary: 'Get commission calculations' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Commission calculations retrieved successfully',
  })
  async getCommissionCalculations(
    @Query() query: GetCommissionCalculationsDto,
  ): Promise<{
    data: CommissionCalculationResponseDto[];
    total: number;
    page: number;
    limit: number;
  }> {
    return this.commissionTrackingService.getCommissionCalculations(query);
  }

  @Get('calculations/:id')
  @Roles('admin', 'manager', 'partner')
  @ApiOperation({ summary: 'Get commission calculation by ID' })
  @ApiParam({ name: 'id', description: 'Commission calculation ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Commission calculation retrieved successfully',
    type: CommissionCalculationResponseDto,
  })
  async getCommissionCalculationById(
    @Param('id', ParseCoworsIdPipe) id: string,
  ): Promise<CommissionCalculationResponseDto> {
    return this.commissionTrackingService.getCommissionCalculationById(id);
  }

  @Put('calculations/:id')
  @Roles('admin', 'manager')
  @ApiOperation({ summary: 'Update commission calculation' })
  @ApiParam({ name: 'id', description: 'Commission calculation ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Commission calculation updated successfully',
    type: CommissionCalculationResponseDto,
  })
  @UsePipes(new ValidationPipe({ transform: true }))
  async updateCommissionCalculation(
    @Param('id', ParseCoworsIdPipe) id: string,
    @Body() updateDto: UpdateCommissionCalculationDto,
    @GetUser('id') userId: string,
  ): Promise<CommissionCalculationResponseDto> {
    return this.commissionTrackingService.updateCommissionCalculation(
      id,
      updateDto,
      userId,
    );
  }

  @Put('calculations/:id/approve')
  @Roles('admin', 'manager')
  @ApiOperation({ summary: 'Approve commission calculation' })
  @ApiParam({ name: 'id', description: 'Commission calculation ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Commission calculation approved successfully',
    type: CommissionCalculationResponseDto,
  })
  async approveCommissionCalculation(
    @Param('id', ParseCoworsIdPipe) id: string,
    @GetUser('id') userId: string,
  ): Promise<CommissionCalculationResponseDto> {
    return this.commissionTrackingService.approveCommissionCalculation(
      id,
      userId,
    );
  }

  @Put('calculations/:id/reject')
  @Roles('admin', 'manager')
  @ApiOperation({ summary: 'Reject commission calculation' })
  @ApiParam({ name: 'id', description: 'Commission calculation ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Commission calculation rejected successfully',
    type: CommissionCalculationResponseDto,
  })
  async rejectCommissionCalculation(
    @Param('id', ParseCoworsIdPipe) id: string,
    @GetUser('id') userId: string,
  ): Promise<CommissionCalculationResponseDto> {
    return this.commissionTrackingService.rejectCommissionCalculation(
      id,
      userId,
    );
  }

  // Partner Commission Management
  @Post('partners')
  @Roles('admin', 'manager')
  @ApiOperation({ summary: 'Create partner commission' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Partner commission created successfully',
    type: PartnerCommissionResponseDto,
  })
  @UsePipes(new ValidationPipe({ transform: true }))
  async createPartnerCommission(
    @Body() createDto: CreatePartnerCommissionDto,
    @GetUser('id') userId: string,
  ): Promise<PartnerCommissionResponseDto> {
    return this.commissionTrackingService.createPartnerCommission(
      createDto,
      userId,
    );
  }

  @Get('partners')
  @Roles('admin', 'manager', 'partner')
  @ApiOperation({ summary: 'Get partner commissions' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Partner commissions retrieved successfully',
  })
  async getPartnerCommissions(
    @Query() query: GetPartnerCommissionsDto,
  ): Promise<{
    data: PartnerCommissionResponseDto[];
    total: number;
    page: number;
    limit: number;
  }> {
    return this.commissionTrackingService.getPartnerCommissions(query);
  }

  @Get('partners/:id')
  @Roles('admin', 'manager', 'partner')
  @ApiOperation({ summary: 'Get partner commission by ID' })
  @ApiParam({ name: 'id', description: 'Partner commission ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Partner commission retrieved successfully',
    type: PartnerCommissionResponseDto,
  })
  async getPartnerCommissionById(
    @Param('id', ParseCoworsIdPipe) id: string,
  ): Promise<PartnerCommissionResponseDto> {
    return this.commissionTrackingService.getPartnerCommissionById(id);
  }

  @Put('partners/:id')
  @Roles('admin', 'manager')
  @ApiOperation({ summary: 'Update partner commission' })
  @ApiParam({ name: 'id', description: 'Partner commission ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Partner commission updated successfully',
    type: PartnerCommissionResponseDto,
  })
  @UsePipes(new ValidationPipe({ transform: true }))
  async updatePartnerCommission(
    @Param('id', ParseCoworsIdPipe) id: string,
    @Body() updateDto: UpdatePartnerCommissionDto,
    @GetUser('id') userId: string,
  ): Promise<PartnerCommissionResponseDto> {
    return this.commissionTrackingService.updatePartnerCommission(
      id,
      updateDto,
      userId,
    );
  }

  @Delete('partners/:id')
  @Roles('admin', 'manager')
  @ApiOperation({ summary: 'Delete partner commission' })
  @ApiParam({ name: 'id', description: 'Partner commission ID' })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Partner commission deleted successfully',
  })
  async deletePartnerCommission(
    @Param('id', ParseCoworsIdPipe) id: string,
    @GetUser('id') userId: string,
  ): Promise<void> {
    return this.commissionTrackingService.deletePartnerCommission(id, userId);
  }

  // Commission Payouts
  @Post('payouts')
  @Roles('admin', 'manager')
  @ApiOperation({ summary: 'Create commission payout' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Commission payout created successfully',
    type: CommissionPayoutResponseDto,
  })
  @UsePipes(new ValidationPipe({ transform: true }))
  async createCommissionPayout(
    @Body() createDto: CreateCommissionPayoutDto,
    @GetUser('id') userId: string,
  ): Promise<CommissionPayoutResponseDto> {
    return this.commissionTrackingService.createCommissionPayout(
      createDto,
      userId,
    );
  }

  @Get('payouts')
  @Roles('admin', 'manager', 'partner')
  @ApiOperation({ summary: 'Get commission payouts' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Commission payouts retrieved successfully',
  })
  async getCommissionPayouts(@Query() query: GetCommissionPayoutsDto): Promise<{
    data: CommissionPayoutResponseDto[];
    total: number;
    page: number;
    limit: number;
  }> {
    return this.commissionTrackingService.getCommissionPayouts(query);
  }

  @Get('payouts/:id')
  @Roles('admin', 'manager', 'partner')
  @ApiOperation({ summary: 'Get commission payout by ID' })
  @ApiParam({ name: 'id', description: 'Commission payout ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Commission payout retrieved successfully',
    type: CommissionPayoutResponseDto,
  })
  async getCommissionPayoutById(
    @Param('id', ParseCoworsIdPipe) id: string,
  ): Promise<CommissionPayoutResponseDto> {
    return this.commissionTrackingService.getCommissionPayoutById(id);
  }

  @Put('payouts/:id')
  @Roles('admin', 'manager')
  @ApiOperation({ summary: 'Update commission payout' })
  @ApiParam({ name: 'id', description: 'Commission payout ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Commission payout updated successfully',
    type: CommissionPayoutResponseDto,
  })
  @UsePipes(new ValidationPipe({ transform: true }))
  async updateCommissionPayout(
    @Param('id', ParseCoworsIdPipe) id: string,
    @Body() updateDto: UpdateCommissionPayoutDto,
    @GetUser('id') userId: string,
  ): Promise<CommissionPayoutResponseDto> {
    return this.commissionTrackingService.updateCommissionPayout(
      id,
      updateDto,
      userId,
    );
  }

  @Put('payouts/:id/process')
  @Roles('admin', 'manager')
  @ApiOperation({ summary: 'Process commission payout' })
  @ApiParam({ name: 'id', description: 'Commission payout ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Commission payout processed successfully',
    type: CommissionPayoutResponseDto,
  })
  async processCommissionPayout(
    @Param('id', ParseCoworsIdPipe) id: string,
    @GetUser('id') userId: string,
  ): Promise<CommissionPayoutResponseDto> {
    return this.commissionTrackingService.processCommissionPayout(id, userId);
  }

  @Put('payouts/:id/complete')
  @Roles('admin', 'manager')
  @ApiOperation({ summary: 'Complete commission payout' })
  @ApiParam({ name: 'id', description: 'Commission payout ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Commission payout completed successfully',
    type: CommissionPayoutResponseDto,
  })
  async completeCommissionPayout(
    @Param('id', ParseCoworsIdPipe) id: string,
    @GetUser('id') userId: string,
  ): Promise<CommissionPayoutResponseDto> {
    return this.commissionTrackingService.completeCommissionPayout(id, userId);
  }

  // Bulk Operations
  @Put('bulk-update')
  @Roles('admin', 'manager')
  @ApiOperation({ summary: 'Bulk update commissions' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Bulk commission update completed',
  })
  @UsePipes(new ValidationPipe({ transform: true }))
  async bulkUpdateCommissions(
    @Body() bulkDto: BulkCommissionUpdateDto,
    @GetUser('id') userId: string,
  ): Promise<{ updated: number; failed: number; errors: any[] }> {
    return this.commissionTrackingService.bulkUpdateCommissions(
      bulkDto,
      userId,
    );
  }

  // Analytics and Reporting
  @Get('analytics')
  @Roles('admin', 'manager')
  @ApiOperation({ summary: 'Get commission analytics' })
  @ApiQuery({
    name: 'partnerId',
    required: false,
    description: 'Partner ID for filtering',
  })
  @ApiQuery({
    name: 'dateFrom',
    required: false,
    description: 'Start date for analytics',
  })
  @ApiQuery({
    name: 'dateTo',
    required: false,
    description: 'End date for analytics',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Commission analytics retrieved successfully',
    type: CommissionAnalyticsDto,
  })
  async getCommissionAnalytics(
    @Query('partnerId') partnerId?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ): Promise<CommissionAnalyticsDto> {
    const dto = {
      partnerId,
      startDate: dateFrom ? new Date(dateFrom) : undefined,
      endDate: dateTo ? new Date(dateTo) : undefined,
    };
    return this.commissionTrackingService.getCommissionAnalytics(dto);
  }

  @Get('summary')
  @Roles('admin', 'manager', 'partner')
  @ApiOperation({ summary: 'Get commission summary' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Commission summary retrieved successfully',
    type: CommissionSummaryDto,
  })
  async getCommissionSummary(
    @Query() query: GetCommissionSummaryDto,
  ): Promise<CommissionSummaryDto> {
    return this.commissionTrackingService.getCommissionSummary(query);
  }

  @Get('stats')
  @Roles('admin', 'manager')
  @ApiOperation({ summary: 'Get commission statistics' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Commission statistics retrieved successfully',
    type: CommissionStatsDto,
  })
  async getCommissionStats(): Promise<CommissionStatsDto> {
    return this.commissionTrackingService.getCommissionStats({});
  }

  @Get('partner-performance')
  @Roles('admin', 'manager')
  @ApiOperation({ summary: 'Get partner performance metrics' })
  @ApiQuery({
    name: 'partnerId',
    required: false,
    description: 'Partner ID for filtering',
  })
  @ApiQuery({
    name: 'dateFrom',
    required: false,
    description: 'Start date for performance metrics',
  })
  @ApiQuery({
    name: 'dateTo',
    required: false,
    description: 'End date for performance metrics',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Partner performance metrics retrieved successfully',
    type: PartnerPerformanceDto,
  })
  async getPartnerPerformance(
    @Query('partnerId') partnerId?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ): Promise<PartnerPerformanceDto[]> {
    return this.commissionTrackingService.getPartnerPerformance(
      partnerId,
      dateFrom,
      dateTo,
    );
  }

  @Get('forecast')
  @Roles('admin', 'manager')
  @ApiOperation({ summary: 'Get commission forecast' })
  @ApiQuery({
    name: 'partnerId',
    required: false,
    description: 'Partner ID for filtering',
  })
  @ApiQuery({
    name: 'months',
    required: false,
    description: 'Number of months to forecast',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Commission forecast retrieved successfully',
    type: CommissionForecastDto,
  })
  async getCommissionForecast(
    @Query('partnerId') partnerId?: string,
    @Query('months') months?: number,
  ): Promise<CommissionForecastDto> {
    return this.commissionTrackingService.getCommissionForecast(
      partnerId,
      months,
    );
  }

  // Export and Download
  @Post('export')
  @Roles('admin', 'manager')
  @ApiOperation({ summary: 'Export commission data' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Commission data export initiated',
  })
  @UsePipes(new ValidationPipe({ transform: true }))
  async exportCommissionData(
    @Body() exportDto: CommissionExportDto,
    @GetUser('id') userId: string,
  ): Promise<{ filename: string }> {
    const filename = await this.commissionTrackingService.exportCommissionData(
      exportDto,
      userId,
    );
    return { filename };
  }

  @Post('reports/generate')
  @Roles('admin', 'manager')
  @ApiOperation({ summary: 'Generate commission report' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Commission report generation initiated',
  })
  @UsePipes(new ValidationPipe({ transform: true }))
  async generateCommissionReport(
    @Body() reportDto: CommissionReportDto,
    @GetUser('id') userId: string,
  ): Promise<{ reportId: string }> {
    const reportId =
      await this.commissionTrackingService.generateCommissionReport(
        reportDto,
        userId,
      );
    return { reportId };
  }

  @Get('reports/:id/download')
  @Roles('admin', 'manager')
  @ApiOperation({ summary: 'Download commission report' })
  @ApiParam({ name: 'id', description: 'Report ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Commission report downloaded successfully',
  })
  async downloadCommissionReport(
    @Param('id', ParseCoworsIdPipe) id: string,
  ): Promise<any> {
    return this.commissionTrackingService.downloadCommissionReport(id);
  }

  // Reconciliation
  @Post('reconciliation')
  @Roles('admin', 'manager')
  @ApiOperation({ summary: 'Perform commission reconciliation' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Commission reconciliation completed',
  })
  @UsePipes(new ValidationPipe({ transform: true }))
  async performCommissionReconciliation(
    @Body() reconciliationDto: CommissionReconciliationDto,
    @GetUser('id') userId: string,
  ): Promise<{ reconciled: number; discrepancies: number; details: any[] }> {
    return this.commissionTrackingService.performCommissionReconciliation(
      reconciliationDto,
      userId,
    );
  }

  // Settings
  @Get('settings')
  @Roles('admin', 'manager')
  @ApiOperation({ summary: 'Get commission settings' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Commission settings retrieved successfully',
    type: CommissionSettingsDto,
  })
  async getCommissionSettings(): Promise<CommissionSettingsDto> {
    return this.commissionTrackingService.getCommissionSettings();
  }

  @Put('settings')
  @Roles('admin')
  @ApiOperation({ summary: 'Update commission settings' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Commission settings updated successfully',
    type: CommissionSettingsDto,
  })
  @UsePipes(new ValidationPipe({ transform: true }))
  async updateCommissionSettings(
    @Body() settingsDto: CommissionSettingsDto,
    @GetUser('id') userId: string,
  ): Promise<CommissionSettingsDto> {
    return this.commissionTrackingService.updateCommissionSettings(
      settingsDto,
      userId,
    );
  }

  // Audit Trail
  @Get('audit')
  @Roles('admin', 'manager')
  @ApiOperation({ summary: 'Get commission audit trail' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Commission audit trail retrieved successfully',
  })
  async getCommissionAuditTrail(
    @Query() query: CommissionAuditDto,
  ): Promise<{ data: any[]; total: number; page: number; limit: number }> {
    return this.commissionTrackingService.getCommissionAuditTrail(query);
  }

  // Utility Methods
  @Get('calculate/:partnerId/:amount/:type')
  @ApiOperation({ summary: 'Calculate commission for a transaction' })
  @ApiParam({ name: 'partnerId', description: 'Partner ID' })
  @ApiParam({ name: 'amount', description: 'Transaction amount' })
  @ApiParam({ name: 'type', description: 'Transaction type' })
  @ApiResponse({
    status: 200,
    description: 'Commission calculated successfully',
    type: Number,
  })
  async calculateCommission(
    @Param('partnerId') partnerId: string,
    @Param('amount') amount: string,
    @Param('type') type: string,
  ): Promise<number> {
    const transactionAmount = parseFloat(amount);
    const transactionType = type as TransactionType;
    return this.commissionTrackingService.calculateCommission(
      partnerId,
      transactionAmount,
      transactionType,
    );
  }

  @Get('partner/:partnerId/balance')
  @ApiOperation({ summary: 'Get partner commission balance' })
  @ApiParam({ name: 'partnerId', description: 'Partner ID' })
  @ApiResponse({
    status: 200,
    description: 'Partner commission balance retrieved successfully',
  })
  async getPartnerCommissionBalance(
    @Param('partnerId') partnerId: string,
  ): Promise<{
    totalEarned: number;
    totalPaid: number;
    pendingAmount: number;
  }> {
    return this.commissionTrackingService.getPartnerCommissionBalance(
      partnerId,
    );
  }

  @Get('partner/:partnerId/history')
  @ApiOperation({ summary: 'Get partner commission history' })
  @ApiParam({ name: 'partnerId', description: 'Partner ID' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({
    status: 200,
    description: 'Partner commission history retrieved successfully',
  })
  async getPartnerCommissionHistory(
    @Param('partnerId') partnerId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ): Promise<{ commissions: PartnerCommissionResponseDto[]; total: number }> {
    return this.commissionTrackingService.getPartnerCommissionHistory(
      partnerId,
      page,
      limit,
    );
  }

  @Post('validate-rule')
  @Roles('admin', 'manager')
  @ApiOperation({ summary: 'Validate commission rule' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Commission rule validation completed',
  })
  async validateCommissionRule(
    @Body() ruleData: any,
  ): Promise<{ isValid: boolean; errors: string[]; warnings: string[] }> {
    return this.commissionTrackingService.validateCommissionRule(ruleData);
  }
}
