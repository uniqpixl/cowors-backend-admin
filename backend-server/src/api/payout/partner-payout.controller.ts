import { AuthGuard } from '@/auth/auth.guard';
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
import { ParseCoworsIdPipe } from '../../common/pipes/parse-cowors-id.pipe';

import { CurrentUserSession } from '@/decorators/auth/current-user-session.decorator';

import {
  BankAccountResponseDto,
  BankAccountStatus,
  BulkOperationResponseDto,
  BulkPayoutOperationDto,
  CreateBankAccountDto,
  CreatePayoutRequestDto,
  CreateWalletTransactionDto,
  ExportPayoutsDto,
  ExportResponseDto,
  GetPayoutRequestsDto,
  PayoutAnalyticsDto,
  PayoutAnalyticsResponseDto,
  PayoutRequestResponseDto,
  PayoutSettingsDto,
  PayoutSettingsResponseDto,
  PayoutStatus,
  PayoutSummaryResponseDto,
  PayoutType,
  UpdateBankAccountDto,
  UpdatePayoutRequestDto,
  WalletResponseDto,
  WalletTransactionResponseDto,
} from './dto/partner-payout.dto';
import { PartnerPayoutService } from './partner-payout.service';

@ApiTags('Partner Payouts')
@Controller('partner-payouts')
@UseGuards(AuthGuard)
@ApiBearerAuth()
export class PartnerPayoutController {
  constructor(private readonly payoutService: PartnerPayoutService) {}

  // Payout Request Management
  @Post('requests')
  @ApiOperation({ summary: 'Create payout request' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Payout request created successfully',
    type: PayoutRequestResponseDto,
  })
  @UsePipes(new ValidationPipe({ transform: true }))
  async createPayoutRequest(
    @Body() dto: CreatePayoutRequestDto,
    @CurrentUserSession() user: any,
  ): Promise<PayoutRequestResponseDto> {
    return this.payoutService.createPayoutRequest(dto, user.id);
  }

  @Get('requests')
  @ApiOperation({
    summary: 'Get payout requests with filtering and pagination',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Payout requests retrieved successfully',
    type: [PayoutRequestResponseDto],
  })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, enum: PayoutStatus })
  @ApiQuery({ name: 'type', required: false, enum: PayoutType })
  @ApiQuery({ name: 'partnerId', required: false, type: String })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  @ApiQuery({ name: 'minAmount', required: false, type: Number })
  @ApiQuery({ name: 'maxAmount', required: false, type: Number })
  @ApiQuery({ name: 'sortBy', required: false, type: String })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['ASC', 'DESC'] })
  async getPayoutRequests(
    @Query() dto: GetPayoutRequestsDto,
    @CurrentUserSession() user: any,
  ): Promise<{ requests: PayoutRequestResponseDto[]; total: number }> {
    const result = await this.payoutService.getPayoutRequests(dto);
    return {
      requests: result.data,
      total: result.total,
    };
  }

  @Get('requests/:id')
  @ApiOperation({ summary: 'Get payout request by ID' })
  @ApiParam({ name: 'id', description: 'Payout request ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Payout request retrieved successfully',
    type: PayoutRequestResponseDto,
  })
  async getPayoutRequestById(
    @Param('id') id: string,
    @CurrentUserSession() user: any,
  ): Promise<PayoutRequestResponseDto> {
    return this.payoutService.getPayoutRequestById(id);
  }

  @Put('requests/:id')
  @ApiOperation({ summary: 'Update payout request' })
  @ApiParam({ name: 'id', description: 'Payout request ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Payout request updated successfully',
    type: PayoutRequestResponseDto,
  })
  @UsePipes(new ValidationPipe({ transform: true }))
  async updatePayoutRequest(
    @Param('id', ParseCoworsIdPipe) id: string,
    @Body() dto: UpdatePayoutRequestDto,
    @CurrentUserSession() user: any,
  ): Promise<PayoutRequestResponseDto> {
    return this.payoutService.updatePayoutRequest(id, dto, user.id);
  }

  @Delete('requests/:id')
  @ApiOperation({ summary: 'Delete payout request' })
  @ApiParam({ name: 'id', description: 'Payout request ID' })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Payout request deleted successfully',
  })
  async deletePayoutRequest(
    @Param('id', ParseCoworsIdPipe) id: string,
    @CurrentUserSession() user: any,
  ): Promise<void> {
    return this.payoutService.deletePayoutRequest(id, user.id);
  }

  // Payout Status Management
  @Post('requests/:id/approve')
  @ApiOperation({ summary: 'Approve payout request' })
  @ApiParam({ name: 'id', description: 'Payout request ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Payout request approved successfully',
    type: PayoutRequestResponseDto,
  })
  async approvePayoutRequest(
    @Param('id', ParseCoworsIdPipe) id: string,
    @CurrentUserSession() user: any,
  ): Promise<PayoutRequestResponseDto> {
    return this.payoutService.approvePayoutRequest(id, user.id);
  }

  @Post('requests/:id/reject')
  @ApiOperation({ summary: 'Reject payout request' })
  @ApiParam({ name: 'id', description: 'Payout request ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Payout request rejected successfully',
    type: PayoutRequestResponseDto,
  })
  async rejectPayoutRequest(
    @Param('id', ParseCoworsIdPipe) id: string,
    @Body('reason') reason: string,
    @CurrentUserSession() user: any,
  ): Promise<PayoutRequestResponseDto> {
    return this.payoutService.rejectPayoutRequest(id, reason, user.id);
  }

  @Post('requests/:id/process')
  @ApiOperation({ summary: 'Process payout request' })
  @ApiParam({ name: 'id', description: 'Payout request ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Payout request processed successfully',
    type: PayoutRequestResponseDto,
  })
  async processPayoutRequest(
    @Param('id', ParseCoworsIdPipe) id: string,
    @CurrentUserSession() user: any,
  ): Promise<PayoutRequestResponseDto> {
    return this.payoutService.processPayoutRequest(id, user.id);
  }

  @Post('requests/:id/complete')
  @ApiOperation({ summary: 'Complete payout request' })
  @ApiParam({ name: 'id', description: 'Payout request ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Payout request completed successfully',
    type: PayoutRequestResponseDto,
  })
  async completePayoutRequest(
    @Param('id', ParseCoworsIdPipe) id: string,
    @Body('transactionId') transactionId: string,
    @CurrentUserSession() user: any,
  ): Promise<PayoutRequestResponseDto> {
    throw new Error(
      'Complete payout request functionality not implemented in service',
    );
  }

  @Post('requests/:id/fail')
  @ApiOperation({ summary: 'Mark payout request as failed' })
  @ApiParam({ name: 'id', description: 'Payout request ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Payout request marked as failed',
    type: PayoutRequestResponseDto,
  })
  async failPayoutRequest(
    @Param('id', ParseCoworsIdPipe) id: string,
    @Body('reason') reason: string,
    @CurrentUserSession() user: any,
  ): Promise<PayoutRequestResponseDto> {
    // This method needs to be implemented in the service
    throw new Error('Method not implemented');
  }

  // Bulk Operations
  @Post('requests/bulk')
  @ApiOperation({ summary: 'Perform bulk operations on payout requests' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Bulk operation completed',
    type: BulkOperationResponseDto,
  })
  @UsePipes(new ValidationPipe({ transform: true }))
  async bulkOperation(
    @Body() dto: BulkPayoutOperationDto,
    @CurrentUserSession() user: any,
  ): Promise<BulkOperationResponseDto> {
    return this.payoutService.bulkPayoutOperation(dto, user.id);
  }

  // Bank Account Management
  @Post('bank-accounts')
  @ApiOperation({ summary: 'Add bank account' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Bank account added successfully',
    type: BankAccountResponseDto,
  })
  @UsePipes(new ValidationPipe({ transform: true }))
  async addBankAccount(
    @Body() dto: CreateBankAccountDto,
    @CurrentUserSession() user: any,
  ): Promise<BankAccountResponseDto> {
    return this.payoutService.createBankAccount(dto, user.id);
  }

  @Get('bank-accounts')
  @ApiOperation({ summary: 'Get bank accounts' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Bank accounts retrieved successfully',
    type: [BankAccountResponseDto],
  })
  @ApiQuery({ name: 'partnerId', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, enum: BankAccountStatus })
  async getBankAccounts(
    @Query('partnerId') partnerId?: string,
    @Query('status') status?: BankAccountStatus,
    @CurrentUserSession() user?: any,
  ): Promise<BankAccountResponseDto[]> {
    return this.payoutService.getBankAccounts(partnerId || user.id);
  }

  @Get('bank-accounts/:id')
  @ApiOperation({ summary: 'Get bank account by ID' })
  @ApiParam({ name: 'id', description: 'Bank account ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Bank account retrieved successfully',
    type: BankAccountResponseDto,
  })
  async getBankAccountById(
    @Param('id', ParseCoworsIdPipe) id: string,
    @CurrentUserSession() user: any,
  ): Promise<BankAccountResponseDto> {
    return this.payoutService.getBankAccountById(id);
  }

  @Put('bank-accounts/:id')
  @ApiOperation({ summary: 'Update bank account' })
  @ApiParam({ name: 'id', description: 'Bank account ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Bank account updated successfully',
    type: BankAccountResponseDto,
  })
  @UsePipes(new ValidationPipe({ transform: true }))
  async updateBankAccount(
    @Param('id', ParseCoworsIdPipe) id: string,
    @Body() dto: UpdateBankAccountDto,
    @CurrentUserSession() user: any,
  ): Promise<BankAccountResponseDto> {
    return this.payoutService.updateBankAccount(id, dto, user.id);
  }

  @Delete('bank-accounts/:id')
  @ApiOperation({ summary: 'Delete bank account' })
  @ApiParam({ name: 'id', description: 'Bank account ID' })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Bank account deleted successfully',
  })
  async deleteBankAccount(
    @Param('id', ParseCoworsIdPipe) id: string,
    @CurrentUserSession() user: any,
  ): Promise<void> {
    return this.payoutService.deleteBankAccount(id);
  }

  @Post('bank-accounts/:id/verify')
  @ApiOperation({ summary: 'Verify bank account' })
  @ApiParam({ name: 'id', description: 'Bank account ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Bank account verified successfully',
    type: BankAccountResponseDto,
  })
  async verifyBankAccount(
    @Param('id', ParseCoworsIdPipe) id: string,
    @CurrentUserSession() user: any,
  ): Promise<BankAccountResponseDto> {
    return this.payoutService.verifyBankAccount(id, user.id);
  }

  @Post('bank-accounts/:id/reject')
  @ApiOperation({ summary: 'Reject bank account verification' })
  @ApiParam({ name: 'id', description: 'Bank account ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Bank account verification rejected',
    type: BankAccountResponseDto,
  })
  async rejectBankAccount(
    @Param('id', ParseCoworsIdPipe) id: string,
    @Body('reason') reason: string,
    @CurrentUserSession() user: any,
  ): Promise<BankAccountResponseDto> {
    // This method needs to be implemented in the service
    throw new Error('Method not implemented');
  }

  // Wallet Management
  @Get('wallets/:partnerId')
  @ApiOperation({ summary: 'Get partner wallet' })
  @ApiParam({ name: 'partnerId', description: 'Partner ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Wallet retrieved successfully',
    type: WalletResponseDto,
  })
  async getWallet(
    @Param('partnerId', ParseCoworsIdPipe) partnerId: string,
    @CurrentUserSession() user: any,
  ): Promise<WalletResponseDto> {
    return this.payoutService.getWallet(partnerId);
  }

  @Get('wallets/:partnerId/transactions')
  @ApiOperation({ summary: 'Get wallet transactions' })
  @ApiParam({ name: 'partnerId', description: 'Partner ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Wallet transactions retrieved successfully',
    type: [WalletTransactionResponseDto],
  })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  async getWalletTransactions(
    @Param('partnerId', ParseCoworsIdPipe) partnerId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @CurrentUserSession() user?: any,
  ): Promise<{ transactions: WalletTransactionResponseDto[]; total: number }> {
    const result = await this.payoutService.getWalletTransactions(
      partnerId,
      page || 1,
      limit || 10,
    );
    return {
      transactions: result.data,
      total: result.total,
    };
  }

  @Post('wallets/:partnerId/transactions')
  @ApiOperation({ summary: 'Create wallet transaction' })
  @ApiParam({ name: 'partnerId', description: 'Partner ID' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Wallet transaction created successfully',
    type: WalletTransactionResponseDto,
  })
  @UsePipes(new ValidationPipe({ transform: true }))
  async createWalletTransaction(
    @Param('partnerId', ParseCoworsIdPipe) partnerId: string,
    @Body() dto: CreateWalletTransactionDto,
    @CurrentUserSession() user: any,
  ): Promise<WalletTransactionResponseDto> {
    return this.payoutService.createWalletTransaction(partnerId, dto, user.id);
  }

  // Analytics and Reporting
  @Get('analytics')
  @ApiOperation({ summary: 'Get payout analytics' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Analytics retrieved successfully',
    type: PayoutAnalyticsResponseDto,
  })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  @ApiQuery({
    name: 'groupBy',
    required: false,
    enum: ['day', 'week', 'month', 'year'],
  })
  @ApiQuery({ name: 'partnerId', required: false, type: String })
  @ApiQuery({ name: 'type', required: false, enum: PayoutType })
  async getAnalytics(
    @Query() dto: PayoutAnalyticsDto,
    @CurrentUserSession() user: any,
  ): Promise<PayoutAnalyticsResponseDto> {
    return this.payoutService.getPayoutAnalytics(dto);
  }

  @Get('summary')
  @ApiOperation({ summary: 'Get payout summary' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Summary retrieved successfully',
    type: PayoutSummaryResponseDto,
  })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  @ApiQuery({ name: 'partnerId', required: false, type: String })
  async getSummary(
    @Query() dto: PayoutAnalyticsDto,
    @CurrentUserSession() user: any,
  ): Promise<PayoutSummaryResponseDto> {
    // This method needs to be implemented in the service
    throw new Error('Method not implemented');
  }

  // Export and Download
  @Post('export')
  @ApiOperation({ summary: 'Export payout requests' })
  @ApiResponse({
    status: HttpStatus.ACCEPTED,
    description: 'Export initiated successfully',
    type: ExportResponseDto,
  })
  @UsePipes(new ValidationPipe({ transform: true }))
  async exportPayouts(
    @Body() dto: ExportPayoutsDto,
    @CurrentUserSession() user: any,
  ): Promise<ExportResponseDto> {
    // This method needs to be implemented in the service
    throw new Error('Method not implemented');
  }

  @Get('exports/:exportId/download')
  @ApiOperation({ summary: 'Download exported payout data' })
  @ApiParam({ name: 'exportId', description: 'Export ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Download URL retrieved successfully',
  })
  async downloadExport(
    @Param('exportId', ParseCoworsIdPipe) exportId: string,
    @CurrentUserSession() user: any,
  ): Promise<{ downloadUrl: string }> {
    // This method needs to be implemented in the service
    throw new Error('Method not implemented');
  }

  // Settings Management
  @Get('settings')
  @ApiOperation({ summary: 'Get payout settings' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Settings retrieved successfully',
    type: PayoutSettingsResponseDto,
  })
  async getSettings(): Promise<PayoutSettingsResponseDto> {
    return this.payoutService.getSettings();
  }

  @Put('settings')
  @ApiOperation({ summary: 'Update payout settings' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Settings updated successfully',
    type: PayoutSettingsResponseDto,
  })
  @UsePipes(new ValidationPipe({ transform: true }))
  async updateSettings(
    @Body() dto: PayoutSettingsDto,
    @CurrentUserSession() user: any,
  ): Promise<PayoutSettingsResponseDto> {
    return this.payoutService.updateSettings(dto, user.id);
  }

  // Utility Methods
  @Get('statuses')
  @ApiOperation({ summary: 'Get available payout statuses' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Statuses retrieved successfully',
  })
  async getPayoutStatuses(): Promise<{ statuses: PayoutStatus[] }> {
    const statuses = await this.payoutService.getPayoutStatuses();
    return { statuses };
  }

  @Get('types')
  @ApiOperation({ summary: 'Get available payout types' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Types retrieved successfully',
  })
  async getPayoutTypes(): Promise<{ types: PayoutType[] }> {
    const types = await this.payoutService.getPayoutTypes();
    return { types };
  }

  @Post('validate')
  @ApiOperation({ summary: 'Validate payout request data' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Validation completed',
  })
  @UsePipes(new ValidationPipe({ transform: true }))
  async validatePayoutRequest(
    @Body() dto: CreatePayoutRequestDto,
  ): Promise<{ isValid: boolean; errors?: string[] }> {
    const result = await this.payoutService.validatePayoutRequest(dto);
    return {
      isValid: result.valid,
      errors: result.errors,
    };
  }

  @Get('partners/:partnerId/balance')
  @ApiOperation({ summary: 'Get partner balance' })
  @ApiParam({ name: 'partnerId', description: 'Partner ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Balance retrieved successfully',
  })
  async getPartnerBalance(
    @Param('partnerId', ParseCoworsIdPipe) partnerId: string,
    @CurrentUserSession() user: any,
  ): Promise<{ balance: number; currency: string; lastUpdated: Date }> {
    // This method needs to be implemented in the service
    throw new Error('Method not implemented');
  }

  @Get('partners/:partnerId/history')
  @ApiOperation({ summary: 'Get partner payout history' })
  @ApiParam({ name: 'partnerId', description: 'Partner ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'History retrieved successfully',
    type: [PayoutRequestResponseDto],
  })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  async getPartnerHistory(
    @Param('partnerId', ParseCoworsIdPipe) partnerId: string,
    @Query() dto: GetPayoutRequestsDto,
    @CurrentUserSession() user: any,
  ): Promise<{ requests: PayoutRequestResponseDto[]; total: number }> {
    // This method needs to be implemented in the service
    throw new Error('Method not implemented');
  }
}
