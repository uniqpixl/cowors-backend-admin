import { UserEntity } from '@/auth/entities/user.entity';
import { GetUser } from '@/decorators/auth/get-user.decorator';
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
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { ParseCoworsIdPipe } from '../../common/pipes/parse-cowors-id.pipe';
import { Roles } from '../../decorators/roles.decorator';
import { RolesGuard } from '../../guards/roles.guard';
import {
  BulkOperationResponseDto,
  BulkOperationType,
  BulkTransactionOperationDto,
  CashFlowReportResponseDto,
  CreateTransactionDto,
  ExportFormat,
  ExportResponseDto,
  ExportTransactionsDto,
  GetTransactionsDto,
  PaymentMethod,
  TransactionAnalyticsDto,
  TransactionAnalyticsResponseDto,
  TransactionCategory,
  TransactionResponseDto,
  TransactionSettingsDto,
  TransactionSettingsResponseDto,
  TransactionStatus,
  TransactionSummaryResponseDto,
  TransactionType,
  UpdateTransactionDto,
} from './dto/financial-transaction.dto';
import { FinancialTransactionService } from './financial-transaction.service';

@ApiTags('Financial Transactions')
@Controller('financial-transactions')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class FinancialTransactionController {
  constructor(
    private readonly transactionService: FinancialTransactionService,
  ) {}

  // Transaction Management
  @Post()
  @Roles('admin', 'finance_manager')
  @ApiOperation({ summary: 'Create a new financial transaction' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Transaction created successfully',
    type: TransactionResponseDto,
  })
  async createTransaction(
    @Body() dto: CreateTransactionDto,
    @GetUser() user: UserEntity,
  ): Promise<TransactionResponseDto> {
    return this.transactionService.createTransaction(dto, user.id);
  }

  @Get()
  @Roles('admin', 'finance_manager', 'partner')
  @ApiOperation({ summary: 'Get transactions with filtering and pagination' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Transactions retrieved successfully',
    type: [TransactionResponseDto],
  })
  async getTransactions(
    @Query() dto: GetTransactionsDto,
    @GetUser() user: UserEntity,
  ): Promise<{ transactions: TransactionResponseDto[]; total: number }> {
    return this.transactionService.getTransactions(dto, user);
  }

  @Get(':id')
  @Roles('admin', 'finance_manager', 'partner')
  @ApiOperation({ summary: 'Get transaction by ID' })
  @ApiParam({ name: 'id', description: 'Transaction ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Transaction retrieved successfully',
    type: TransactionResponseDto,
  })
  async getTransactionById(
    @Param('id', ParseCoworsIdPipe) id: string,
    @GetUser() user: UserEntity,
  ): Promise<TransactionResponseDto> {
    return this.transactionService.getTransactionById(id, user);
  }

  @Put(':id')
  @Roles('admin', 'finance_manager')
  @ApiOperation({ summary: 'Update transaction' })
  @ApiParam({ name: 'id', description: 'Transaction ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Transaction updated successfully',
    type: TransactionResponseDto,
  })
  async updateTransaction(
    @Param('id', ParseCoworsIdPipe) id: string,
    @Body() dto: UpdateTransactionDto,
    @GetUser() user: UserEntity,
  ): Promise<TransactionResponseDto> {
    return this.transactionService.updateTransaction(id, dto, user.id);
  }

  @Delete(':id')
  @Roles('admin')
  @ApiOperation({ summary: 'Delete transaction' })
  @ApiParam({ name: 'id', description: 'Transaction ID' })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Transaction deleted successfully',
  })
  async deleteTransaction(
    @Param('id', ParseCoworsIdPipe) id: string,
    @GetUser() user: UserEntity,
  ): Promise<void> {
    return this.transactionService.deleteTransaction(id, user.id);
  }

  // Status Management
  @Put(':id/approve')
  @Roles('admin', 'finance_manager')
  @ApiOperation({ summary: 'Approve transaction' })
  @ApiParam({ name: 'id', description: 'Transaction ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Transaction approved successfully',
    type: TransactionResponseDto,
  })
  async approveTransaction(
    @Param('id', ParseCoworsIdPipe) id: string,
    @GetUser() user: UserEntity,
  ): Promise<TransactionResponseDto> {
    return this.transactionService.approveTransaction(id, user.id);
  }

  @Put(':id/reject')
  @Roles('admin', 'finance_manager')
  @ApiOperation({ summary: 'Reject transaction' })
  @ApiParam({ name: 'id', description: 'Transaction ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Transaction rejected successfully',
    type: TransactionResponseDto,
  })
  async rejectTransaction(
    @Param('id', ParseCoworsIdPipe) id: string,
    @Body('reason') reason: string,
    @GetUser() user: UserEntity,
  ): Promise<TransactionResponseDto> {
    return this.transactionService.rejectTransaction(id, reason, user.id);
  }

  @Put(':id/complete')
  @Roles('admin', 'finance_manager')
  @ApiOperation({ summary: 'Mark transaction as completed' })
  @ApiParam({ name: 'id', description: 'Transaction ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Transaction completed successfully',
    type: TransactionResponseDto,
  })
  async completeTransaction(
    @Param('id', ParseCoworsIdPipe) id: string,
    @GetUser() user: UserEntity,
  ): Promise<TransactionResponseDto> {
    return this.transactionService.completeTransaction(id, user.id);
  }

  @Put(':id/cancel')
  @Roles('admin', 'finance_manager')
  @ApiOperation({ summary: 'Cancel transaction' })
  @ApiParam({ name: 'id', description: 'Transaction ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Transaction cancelled successfully',
    type: TransactionResponseDto,
  })
  async cancelTransaction(
    @Param('id', ParseCoworsIdPipe) id: string,
    @Body('reason') reason: string,
    @GetUser() user: UserEntity,
  ): Promise<TransactionResponseDto> {
    return this.transactionService.cancelTransaction(id, reason, user.id);
  }

  // Bulk Operations
  @Post('bulk-operation')
  @Roles('admin', 'finance_manager')
  @ApiOperation({ summary: 'Perform bulk operations on transactions' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Bulk operation completed',
    type: BulkOperationResponseDto,
  })
  async bulkOperation(
    @Body() dto: BulkTransactionOperationDto,
    @GetUser() user: UserEntity,
  ): Promise<BulkOperationResponseDto> {
    return this.transactionService.bulkOperation(dto, user.id);
  }

  // Analytics and Reporting
  @Get('analytics/summary')
  @Roles('admin', 'finance_manager')
  @ApiOperation({ summary: 'Get transaction analytics summary' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Analytics retrieved successfully',
    type: TransactionAnalyticsResponseDto,
  })
  async getAnalytics(
    @Query() dto: TransactionAnalyticsDto,
    @GetUser() user: UserEntity,
  ): Promise<TransactionAnalyticsResponseDto> {
    return this.transactionService.getAnalytics(dto, user);
  }

  @Get('analytics/summary-overview')
  @Roles('admin', 'finance_manager')
  @ApiOperation({ summary: 'Get transaction summary overview' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Summary retrieved successfully',
    type: TransactionSummaryResponseDto,
  })
  async getSummary(
    @Query() dto: TransactionAnalyticsDto,
    @GetUser() user: UserEntity,
  ): Promise<TransactionSummaryResponseDto> {
    return this.transactionService.getSummary(dto, user);
  }

  @Get('analytics/cash-flow')
  @Roles('admin', 'finance_manager')
  @ApiOperation({ summary: 'Get cash flow report' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Cash flow report retrieved successfully',
    type: CashFlowReportResponseDto,
  })
  async getCashFlowReport(
    @Query() dto: TransactionAnalyticsDto,
    @GetUser() user: UserEntity,
  ): Promise<CashFlowReportResponseDto> {
    return this.transactionService.getCashFlowReport(dto, user);
  }

  // Export and Download
  @Post('export')
  @Roles('admin', 'finance_manager')
  @ApiOperation({ summary: 'Export transactions' })
  @ApiResponse({
    status: HttpStatus.ACCEPTED,
    description: 'Export initiated successfully',
    type: ExportResponseDto,
  })
  async exportTransactions(
    @Body() dto: ExportTransactionsDto,
    @GetUser() user: UserEntity,
  ): Promise<ExportResponseDto> {
    return this.transactionService.exportTransactions(dto, user.id);
  }

  @Get('exports/:exportId/download')
  @Roles('admin', 'finance_manager')
  @ApiOperation({ summary: 'Download exported transactions' })
  @ApiParam({ name: 'exportId', description: 'Export ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Download URL retrieved successfully',
  })
  async downloadExport(
    @Param('exportId', ParseCoworsIdPipe) exportId: string,
    @GetUser() user: UserEntity,
  ): Promise<{ downloadUrl: string }> {
    return this.transactionService.downloadExport(exportId, user.id);
  }

  // Settings Management
  @Get('settings')
  @Roles('admin', 'finance_manager')
  @ApiOperation({ summary: 'Get transaction settings' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Settings retrieved successfully',
    type: TransactionSettingsResponseDto,
  })
  async getSettings(): Promise<TransactionSettingsResponseDto> {
    return this.transactionService.getSettings();
  }

  @Put('settings')
  @Roles('admin')
  @ApiOperation({ summary: 'Update transaction settings' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Settings updated successfully',
    type: TransactionSettingsResponseDto,
  })
  async updateSettings(
    @Body() dto: TransactionSettingsDto,
    @GetUser() user: UserEntity,
  ): Promise<TransactionSettingsResponseDto> {
    return this.transactionService.updateSettings(dto, user.id);
  }

  // Utility Methods
  @Get('utils/statuses')
  @ApiOperation({ summary: 'Get available transaction statuses' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Statuses retrieved successfully',
  })
  getStatuses(): { statuses: TransactionStatus[] } {
    return {
      statuses: Object.values(TransactionStatus),
    };
  }

  @Get('utils/types')
  @ApiOperation({ summary: 'Get available transaction types' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Types retrieved successfully',
  })
  getTypes(): { types: TransactionType[] } {
    return {
      types: Object.values(TransactionType),
    };
  }

  @Get('utils/categories')
  @ApiOperation({ summary: 'Get available transaction categories' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Categories retrieved successfully',
  })
  getCategories(): { categories: TransactionCategory[] } {
    return {
      categories: Object.values(TransactionCategory),
    };
  }

  @Get('utils/payment-methods')
  @ApiOperation({ summary: 'Get available payment methods' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Payment methods retrieved successfully',
  })
  getPaymentMethods(): { paymentMethods: PaymentMethod[] } {
    return {
      paymentMethods: Object.values(PaymentMethod),
    };
  }

  @Post('validate')
  @Roles('admin', 'finance_manager')
  @ApiOperation({ summary: 'Validate transaction data' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Validation completed',
  })
  async validateTransaction(
    @Body() dto: CreateTransactionDto,
  ): Promise<{ isValid: boolean; errors?: string[] }> {
    return this.transactionService.validateTransaction(dto);
  }

  @Get('user/:userId/balance')
  @Roles('admin', 'finance_manager', 'partner')
  @ApiOperation({ summary: 'Get user balance' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Balance retrieved successfully',
  })
  async getUserBalance(
    @Param('userId', ParseCoworsIdPipe) userId: string,
    @GetUser() user: UserEntity,
  ): Promise<{ balance: number; currency: string }> {
    return this.transactionService.getUserBalance(userId, user);
  }

  @Get('user/:userId/history')
  @Roles('admin', 'finance_manager', 'partner')
  @ApiOperation({ summary: 'Get user transaction history' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'History retrieved successfully',
    type: [TransactionResponseDto],
  })
  async getUserHistory(
    @Param('userId', ParseCoworsIdPipe) userId: string,
    @Query() dto: GetTransactionsDto,
    @GetUser() user: UserEntity,
  ): Promise<{ transactions: TransactionResponseDto[]; total: number }> {
    return this.transactionService.getUserHistory(userId, dto, user);
  }

  @Get('booking/:bookingId/transactions')
  @Roles('admin', 'finance_manager', 'partner')
  @ApiOperation({ summary: 'Get transactions for a booking' })
  @ApiParam({ name: 'bookingId', description: 'Booking ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Transactions retrieved successfully',
    type: [TransactionResponseDto],
  })
  async getBookingTransactions(
    @Param('bookingId', ParseCoworsIdPipe) bookingId: string,
    @GetUser() user: UserEntity,
  ): Promise<TransactionResponseDto[]> {
    return this.transactionService.getBookingTransactions(bookingId, user);
  }

  @Get('partner/:partnerId/transactions')
  @Roles('admin', 'finance_manager', 'partner')
  @ApiOperation({ summary: 'Get transactions for a partner' })
  @ApiParam({ name: 'partnerId', description: 'Partner ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Transactions retrieved successfully',
    type: [TransactionResponseDto],
  })
  async getPartnerTransactions(
    @Param('partnerId', ParseCoworsIdPipe) partnerId: string,
    @Query() dto: GetTransactionsDto,
    @GetUser() user: UserEntity,
  ): Promise<{ transactions: TransactionResponseDto[]; total: number }> {
    return this.transactionService.getPartnerTransactions(partnerId, dto, user);
  }
}
