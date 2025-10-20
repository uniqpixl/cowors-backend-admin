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
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ParseCoworsIdPipe } from '../../common/pipes/parse-cowors-id.pipe';
import {
  BankAccountDto,
  BankAccountResponseDto,
  BulkPayoutOperationDto,
  BulkPayoutOperationType,
  CreatePayoutRequestDto,
  ExportFormat,
  PayoutAnalyticsDto,
  PayoutExportDto,
  PayoutReportDto,
  PayoutRequestResponseDto,
  PayoutResponseDto,
  PayoutSettingsDto,
  PayoutStatus,
  PayoutType,
  ProcessPayoutDto,
  ReportType,
  UpdatePayoutRequestDto,
  UpdateWalletDto,
  VerifyBankAccountDto,
  WalletBalanceResponseDto,
  WalletTransactionResponseDto,
  WalletTransactionType,
} from './dto/payout.dto';
import { PayoutService } from './payout.service';

@ApiTags('Payout Management')
@Controller('payout')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class PayoutController {
  constructor(private readonly payoutService: PayoutService) {}

  // Payout Request Management
  @Post('requests')
  @Roles('partner', 'admin')
  @ApiOperation({ summary: 'Create payout request' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Payout request created successfully',
    type: PayoutRequestResponseDto,
  })
  @UsePipes(new ValidationPipe({ transform: true }))
  async createPayoutRequest(
    @Body() createPayoutRequestDto: CreatePayoutRequestDto,
    @Request() req: any,
  ): Promise<PayoutRequestResponseDto> {
    return this.payoutService.createPayoutRequest(
      createPayoutRequestDto,
      req.user.id,
    );
  }

  @Get('requests')
  @Roles('admin', 'finance')
  @ApiOperation({ summary: 'Get all payout requests with filtering' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Payout requests retrieved successfully',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Items per page',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: PayoutStatus,
    isArray: true,
    description: 'Filter by status',
  })
  @ApiQuery({
    name: 'type',
    required: false,
    enum: PayoutType,
    isArray: true,
    description: 'Filter by type',
  })
  @ApiQuery({
    name: 'partnerId',
    required: false,
    type: String,
    description: 'Filter by partner ID',
  })
  @ApiQuery({
    name: 'dateFrom',
    required: false,
    type: Date,
    description: 'Filter from date',
  })
  @ApiQuery({
    name: 'dateTo',
    required: false,
    type: Date,
    description: 'Filter to date',
  })
  @ApiQuery({
    name: 'minAmount',
    required: false,
    type: Number,
    description: 'Minimum amount filter',
  })
  @ApiQuery({
    name: 'maxAmount',
    required: false,
    type: Number,
    description: 'Maximum amount filter',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description: 'Search in description or reference',
  })
  async getPayoutRequests(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('status') status?: PayoutStatus[],
    @Query('type') type?: PayoutType[],
    @Query('partnerId') partnerId?: string,
    @Query('dateFrom') dateFrom?: Date,
    @Query('dateTo') dateTo?: Date,
    @Query('minAmount') minAmount?: number,
    @Query('maxAmount') maxAmount?: number,
    @Query('search') search?: string,
  ): Promise<{
    requests: PayoutRequestResponseDto[];
    total: number;
    page: number;
    limit: number;
  }> {
    const result = await this.payoutService.getPayoutRequests(
      partnerId,
      status?.[0], // Take first status if array provided
      type?.[0], // Take first type if array provided
      page,
      limit,
    );
    return {
      requests: result.data,
      total: result.total,
      page: result.page,
      limit: result.limit,
    };
  }

  @Get('requests/my')
  @Roles('partner')
  @ApiOperation({ summary: 'Get partner own payout requests' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Partner payout requests retrieved successfully',
  })
  async getMyPayoutRequests(
    @Request() req: any,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('status') status?: PayoutStatus[],
  ): Promise<{
    requests: PayoutRequestResponseDto[];
    total: number;
    page: number;
    limit: number;
  }> {
    const result = await this.payoutService.getPayoutRequests(
      req.user.id,
      status?.[0], // Take first status if array provided
      undefined, // type
      page,
      limit,
    );
    return {
      requests: result.data,
      total: result.total,
      page: result.page,
      limit: result.limit,
    };
  }

  @Get('requests/:id')
  @Roles('admin', 'finance', 'partner')
  @ApiOperation({ summary: 'Get payout request by ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Payout request retrieved successfully',
    type: PayoutRequestResponseDto,
  })
  async getPayoutRequestById(
    @Param('id', ParseCoworsIdPipe) id: string,
    @Request() req: any,
  ): Promise<PayoutRequestResponseDto> {
    return this.payoutService.getPayoutRequestById(id);
  }

  @Put('requests/:id')
  @Roles('admin', 'finance', 'partner')
  @ApiOperation({ summary: 'Update payout request' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Payout request updated successfully',
    type: PayoutRequestResponseDto,
  })
  @UsePipes(new ValidationPipe({ transform: true }))
  async updatePayoutRequest(
    @Param('id', ParseCoworsIdPipe) id: string,
    @Body() updatePayoutRequestDto: UpdatePayoutRequestDto,
    @Request() req: any,
  ): Promise<PayoutRequestResponseDto> {
    return this.payoutService.updatePayoutRequest(
      id,
      updatePayoutRequestDto,
      req.user.id,
    );
  }

  @Delete('requests/:id')
  @Roles('admin', 'partner')
  @ApiOperation({ summary: 'Cancel payout request' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Payout request cancelled successfully',
  })
  async cancelPayoutRequest(
    @Param('id', ParseCoworsIdPipe) id: string,
    @Request() req: any,
  ): Promise<void> {
    await this.payoutService.cancelPayoutRequest(id, req.user.id);
  }

  // Payout Processing
  @Post('requests/:id/approve')
  @Roles('admin', 'finance')
  @ApiOperation({ summary: 'Approve payout request' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Payout request approved successfully',
    type: PayoutRequestResponseDto,
  })
  async approvePayoutRequest(
    @Param('id', ParseCoworsIdPipe) id: string,
    @Body() processPayoutDto: ProcessPayoutDto,
    @Request() req: any,
  ): Promise<PayoutRequestResponseDto> {
    return this.payoutService.approvePayoutRequest(
      id,
      processPayoutDto,
      req.user.id,
    );
  }

  @Post('requests/:id/reject')
  @Roles('admin', 'finance')
  @ApiOperation({ summary: 'Reject payout request' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Payout request rejected successfully',
    type: PayoutRequestResponseDto,
  })
  async rejectPayoutRequest(
    @Param('id', ParseCoworsIdPipe) id: string,
    @Body() processPayoutDto: ProcessPayoutDto,
    @Request() req: any,
  ): Promise<PayoutRequestResponseDto> {
    return this.payoutService.rejectPayoutRequest(
      id,
      processPayoutDto,
      req.user.id,
    );
  }

  @Post('requests/:id/process')
  @Roles('admin', 'finance')
  @ApiOperation({ summary: 'Process approved payout request' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Payout processed successfully',
    type: PayoutResponseDto,
  })
  @UsePipes(new ValidationPipe({ transform: true }))
  async processPayoutRequest(
    @Param('id', ParseCoworsIdPipe) id: string,
    @Body() processPayoutDto: ProcessPayoutDto,
    @Request() req: any,
  ): Promise<PayoutResponseDto> {
    return this.payoutService.processPayoutRequest(
      id,
      processPayoutDto,
      req.user.id,
    );
  }

  @Get('payouts')
  @Roles('admin', 'finance')
  @ApiOperation({ summary: 'Get all processed payouts' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Payouts retrieved successfully',
  })
  async getPayouts(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('status') status?: PayoutStatus[],
    @Query('partnerId') partnerId?: string,
    @Query('dateFrom') dateFrom?: Date,
    @Query('dateTo') dateTo?: Date,
  ): Promise<{
    payouts: PayoutResponseDto[];
    total: number;
    page: number;
    limit: number;
  }> {
    const result = await this.payoutService.getPayouts(
      partnerId,
      status?.[0], // Take first status if array provided
      page,
      limit,
    );
    return {
      payouts: result.data,
      total: result.total,
      page: result.page,
      limit: result.limit,
    };
  }

  @Get('payouts/:id')
  @Roles('admin', 'finance', 'partner')
  @ApiOperation({ summary: 'Get payout by ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Payout retrieved successfully',
    type: PayoutResponseDto,
  })
  async getPayoutById(
    @Param('id', ParseCoworsIdPipe) id: string,
    @Request() req: any,
  ): Promise<PayoutResponseDto> {
    return this.payoutService.getPayoutById(id);
  }

  // Wallet Management
  @Get('wallet/:partnerId/balance')
  @Roles('admin', 'finance', 'partner')
  @ApiOperation({ summary: 'Get partner wallet balance' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Wallet balance retrieved successfully',
    type: WalletBalanceResponseDto,
  })
  async getWalletBalance(
    @Param('partnerId', ParseCoworsIdPipe) partnerId: string,
    @Request() req: any,
  ): Promise<WalletBalanceResponseDto> {
    return this.payoutService.getWalletBalance(
      partnerId,
      req.user.id,
      req.user.roles,
    );
  }

  @Get('wallet/my/balance')
  @Roles('partner')
  @ApiOperation({ summary: 'Get own wallet balance' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Wallet balance retrieved successfully',
    type: WalletBalanceResponseDto,
  })
  async getMyWalletBalance(
    @Request() req: any,
  ): Promise<WalletBalanceResponseDto> {
    return this.payoutService.getWalletBalance(req.user.id, req.user.id, [
      'partner',
    ]);
  }

  @Put('wallet/:partnerId')
  @Roles('admin', 'finance')
  @ApiOperation({ summary: 'Update partner wallet' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Wallet updated successfully',
    type: WalletBalanceResponseDto,
  })
  @UsePipes(new ValidationPipe({ transform: true }))
  async updateWallet(
    @Param('partnerId', ParseCoworsIdPipe) partnerId: string,
    @Body() updateWalletDto: UpdateWalletDto,
    @Request() req: any,
  ): Promise<WalletBalanceResponseDto> {
    return this.payoutService.updateWallet(
      partnerId,
      updateWalletDto,
      req.user.id,
    );
  }

  @Get('wallet/:partnerId/transactions')
  @Roles('admin', 'finance', 'partner')
  @ApiOperation({ summary: 'Get partner wallet transactions' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Wallet transactions retrieved successfully',
  })
  async getWalletTransactions(
    @Param('partnerId', ParseCoworsIdPipe) partnerId: string,
    @Request() req: any,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('type') type?: WalletTransactionType[],
    @Query('dateFrom') dateFrom?: Date,
    @Query('dateTo') dateTo?: Date,
  ): Promise<{
    transactions: WalletTransactionResponseDto[];
    total: number;
    page: number;
    limit: number;
  }> {
    return this.payoutService.getWalletTransactions(
      partnerId,
      page,
      limit,
      {
        type,
        dateFrom,
        dateTo,
      },
      req.user.id,
      req.user.roles,
    );
  }

  @Get('wallet/my/transactions')
  @Roles('partner')
  @ApiOperation({ summary: 'Get own wallet transactions' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Wallet transactions retrieved successfully',
  })
  async getMyWalletTransactions(
    @Request() req: any,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('type') type?: WalletTransactionType[],
    @Query('dateFrom') dateFrom?: Date,
    @Query('dateTo') dateTo?: Date,
  ): Promise<{
    transactions: WalletTransactionResponseDto[];
    total: number;
    page: number;
    limit: number;
  }> {
    return this.payoutService.getWalletTransactions(
      req.user.id,
      page,
      limit,
      {
        type,
        dateFrom,
        dateTo,
      },
      req.user.id,
      ['partner'],
    );
  }

  // Bank Account Management
  @Post('bank-accounts')
  @Roles('partner', 'admin')
  @ApiOperation({ summary: 'Add bank account' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Bank account added successfully',
    type: BankAccountResponseDto,
  })
  @UsePipes(new ValidationPipe({ transform: true }))
  async addBankAccount(
    @Body() bankAccountDto: BankAccountDto,
    @Request() req: any,
  ): Promise<BankAccountResponseDto> {
    return this.payoutService.addBankAccount(bankAccountDto, req.user.id);
  }

  @Get('bank-accounts')
  @Roles('partner', 'admin', 'finance')
  @ApiOperation({ summary: 'Get bank accounts' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Bank accounts retrieved successfully',
  })
  async getBankAccounts(
    @Request() req: any,
    @Query('partnerId') partnerId?: string,
  ): Promise<BankAccountResponseDto[]> {
    const targetPartnerId = partnerId || req.user.id;
    return this.payoutService.getBankAccounts(targetPartnerId, req.user.id);
  }

  @Get('bank-accounts/:id')
  @Roles('partner', 'admin', 'finance')
  @ApiOperation({ summary: 'Get bank account by ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Bank account retrieved successfully',
    type: BankAccountResponseDto,
  })
  async getBankAccountById(
    @Param('id', ParseCoworsIdPipe) id: string,
    @Request() req: any,
  ): Promise<BankAccountResponseDto> {
    return this.payoutService.getBankAccountById(
      id,
      req.user.id,
      req.user.roles,
    );
  }

  @Put('bank-accounts/:id')
  @Roles('partner', 'admin')
  @ApiOperation({ summary: 'Update bank account' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Bank account updated successfully',
    type: BankAccountResponseDto,
  })
  @UsePipes(new ValidationPipe({ transform: true }))
  async updateBankAccount(
    @Param('id', ParseCoworsIdPipe) id: string,
    @Body() bankAccountDto: BankAccountDto,
    @Request() req: any,
  ): Promise<BankAccountResponseDto> {
    return this.payoutService.updateBankAccount(
      id,
      bankAccountDto,
      req.user.id,
    );
  }

  @Delete('bank-accounts/:id')
  @Roles('partner', 'admin')
  @ApiOperation({ summary: 'Delete bank account' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Bank account deleted successfully',
  })
  async deleteBankAccount(
    @Param('id', ParseCoworsIdPipe) id: string,
    @Request() req: any,
  ): Promise<void> {
    await this.payoutService.deleteBankAccount(id, req.user.id);
  }

  @Post('bank-accounts/:id/verify')
  @Roles('admin', 'finance')
  @ApiOperation({ summary: 'Verify bank account' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Bank account verification initiated',
    type: BankAccountResponseDto,
  })
  @UsePipes(new ValidationPipe({ transform: true }))
  async verifyBankAccount(
    @Param('id', ParseCoworsIdPipe) id: string,
    @Body() verifyBankAccountDto: VerifyBankAccountDto,
    @Request() req: any,
  ): Promise<BankAccountResponseDto> {
    return this.payoutService.verifyBankAccount(
      id,
      verifyBankAccountDto,
      req.user.id,
    );
  }

  @Post('bank-accounts/:id/set-primary')
  @Roles('partner', 'admin')
  @ApiOperation({ summary: 'Set bank account as primary' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Bank account set as primary successfully',
    type: BankAccountResponseDto,
  })
  async setPrimaryBankAccount(
    @Param('id', ParseCoworsIdPipe) id: string,
    @Request() req: any,
  ): Promise<BankAccountResponseDto> {
    return this.payoutService.setPrimaryBankAccount(id, req.user.id);
  }

  // Bulk Operations
  @Post('bulk-operations')
  @Roles('admin', 'finance')
  @ApiOperation({ summary: 'Perform bulk payout operations' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Bulk operation completed',
  })
  @UsePipes(new ValidationPipe({ transform: true }))
  async bulkOperation(
    @Body() bulkOperationDto: BulkPayoutOperationDto,
    @Request() req: any,
  ): Promise<{ success: number; failed: number; errors: string[] }> {
    return this.payoutService.bulkPayoutOperation(
      bulkOperationDto,
      req.user.id,
    );
  }

  // Analytics and Reporting
  @Get('analytics')
  @Roles('admin', 'finance')
  @ApiOperation({ summary: 'Get payout analytics' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Payout analytics retrieved successfully',
    type: PayoutAnalyticsDto,
  })
  async getPayoutAnalytics(
    @Query('dateFrom') dateFrom?: Date,
    @Query('dateTo') dateTo?: Date,
    @Query('partnerId') partnerId?: string,
    @Query('type') type?: PayoutType[],
  ): Promise<PayoutAnalyticsDto> {
    return this.payoutService.getPayoutAnalytics(dateFrom, dateTo, partnerId);
  }

  // Export and Download
  @Post('export')
  @Roles('admin', 'finance')
  @ApiOperation({ summary: 'Create payout export' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Export created successfully',
  })
  @UsePipes(new ValidationPipe({ transform: true }))
  async createExport(
    @Body() exportDto: PayoutExportDto,
    @Request() req: any,
  ): Promise<{ exportId: string }> {
    const exportId = await this.payoutService.createExport(
      exportDto,
      req.user.id,
    );
    return { exportId };
  }

  @Get('export/:exportId/status')
  @Roles('admin', 'finance')
  @ApiOperation({ summary: 'Get export status' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Export status retrieved successfully',
  })
  async getExportStatus(
    @Param('exportId', ParseCoworsIdPipe) exportId: string,
  ): Promise<any> {
    return this.payoutService.getExportStatus(exportId);
  }

  @Get('export/:exportId/download')
  @Roles('admin', 'finance')
  @ApiOperation({ summary: 'Download export file' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Export file downloaded successfully',
  })
  async downloadExport(
    @Param('exportId', ParseCoworsIdPipe) exportId: string,
  ): Promise<{ filePath: string; fileName: string }> {
    return this.payoutService.downloadExport(exportId);
  }

  // Report Generation
  @Post('reports')
  @Roles('admin', 'finance')
  @ApiOperation({ summary: 'Generate payout report' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Report generation started successfully',
  })
  @UsePipes(new ValidationPipe({ transform: true }))
  async generateReport(
    @Body() reportDto: PayoutReportDto,
    @Request() req: any,
  ): Promise<{ reportId: string }> {
    const reportId = await this.payoutService.generateReport(
      reportDto,
      req.user.id,
    );
    return { reportId };
  }

  @Get('reports/:reportId/status')
  @Roles('admin', 'finance')
  @ApiOperation({ summary: 'Get report status' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Report status retrieved successfully',
  })
  async getReportStatus(
    @Param('reportId', ParseCoworsIdPipe) reportId: string,
  ): Promise<any> {
    return this.payoutService.getReportStatus(reportId);
  }

  @Get('reports/:reportId/download')
  @Roles('admin', 'finance')
  @ApiOperation({ summary: 'Download report file' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Report file downloaded successfully',
  })
  async downloadReport(
    @Param('reportId', ParseCoworsIdPipe) reportId: string,
  ): Promise<{ filePath: string; fileName: string }> {
    return this.payoutService.downloadReport(reportId);
  }

  // Settings Management
  @Get('settings')
  @Roles('admin', 'finance')
  @ApiOperation({ summary: 'Get payout settings' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Payout settings retrieved successfully',
    type: PayoutSettingsDto,
  })
  async getSettings(): Promise<PayoutSettingsDto> {
    const settings = await this.payoutService.getSettings();
    return {
      minimumPayoutAmount: settings.minimumPayoutAmount,
      maximumPayoutAmount: settings.maximumPayoutAmount,
      autoApprovalThreshold: settings.autoApprovalThreshold,
      processingFee: settings.processingFee,
      processingFeeType: settings.processingFeeType,
      payoutSchedule: settings.payoutSchedule,
      allowedPayoutMethods: settings.allowedPayoutMethods,
      requireBankVerification: settings.requireBankVerification,
      autoProcessApprovedPayouts: settings.autoProcessApprovedPayouts,
      notificationSettings: settings.notificationSettings,
    };
  }

  @Put('settings')
  @Roles('admin')
  @ApiOperation({ summary: 'Update payout settings' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Payout settings updated successfully',
    type: PayoutSettingsDto,
  })
  @UsePipes(new ValidationPipe({ transform: true }))
  async updateSettings(
    @Body() settingsDto: PayoutSettingsDto,
    @Request() req: any,
  ): Promise<PayoutSettingsDto> {
    const settings = await this.payoutService.updateSettings(
      settingsDto,
      req.user.id,
    );
    return {
      minimumPayoutAmount: settings.minimumPayoutAmount,
      maximumPayoutAmount: settings.maximumPayoutAmount,
      autoApprovalThreshold: settings.autoApprovalThreshold,
      processingFee: settings.processingFee,
      processingFeeType: settings.processingFeeType,
      payoutSchedule: settings.payoutSchedule,
      allowedPayoutMethods: settings.allowedPayoutMethods,
      requireBankVerification: settings.requireBankVerification,
      autoProcessApprovedPayouts: settings.autoProcessApprovedPayouts,
      notificationSettings: settings.notificationSettings,
    };
  }

  // Utility Methods
  @Get('partner/:partnerId/summary')
  @Roles('admin', 'finance', 'partner')
  @ApiOperation({ summary: 'Get partner payout summary' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Partner payout summary retrieved successfully',
  })
  async getPartnerPayoutSummary(
    @Param('partnerId', ParseCoworsIdPipe) partnerId: string,
    @Request() req: any,
    @Query('dateFrom') dateFrom?: Date,
    @Query('dateTo') dateTo?: Date,
  ): Promise<any> {
    return this.payoutService.getPartnerPayoutSummary(
      partnerId,
      dateFrom,
      dateTo,
      req.user.id,
      req.user.roles,
    );
  }

  @Get('my/summary')
  @Roles('partner')
  @ApiOperation({ summary: 'Get own payout summary' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Payout summary retrieved successfully',
  })
  async getMyPayoutSummary(
    @Request() req: any,
    @Query('dateFrom') dateFrom?: Date,
    @Query('dateTo') dateTo?: Date,
  ): Promise<any> {
    return this.payoutService.getPartnerPayoutSummary(
      req.user.id,
      dateFrom,
      dateTo,
      req.user.id,
      ['partner'],
    );
  }

  @Get('dashboard-stats')
  @Roles('admin', 'finance')
  @ApiOperation({ summary: 'Get payout dashboard statistics' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Dashboard statistics retrieved successfully',
  })
  async getDashboardStats(): Promise<any> {
    return this.payoutService.getDashboardStats();
  }

  @Post('reconcile')
  @Roles('admin', 'finance')
  @ApiOperation({ summary: 'Reconcile payouts with bank statements' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Reconciliation completed successfully',
  })
  async reconcilePayouts(
    @Body() reconciliationData: any,
    @Request() req: any,
  ): Promise<{ reconciled: number; unmatched: number; errors: string[] }> {
    return this.payoutService.reconcilePayouts(reconciliationData, req.user.id);
  }
}
