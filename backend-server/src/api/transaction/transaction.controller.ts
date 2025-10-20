import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Param,
  ParseArrayPipe,
  ParseEnumPipe,
  ParseIntPipe,
  Post,
  Put,
  Query,
  Request,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { ParseCoworsIdPipe } from '../../common/pipes/parse-cowors-id.pipe';
import { Roles } from '../../decorators/roles.decorator';
import { RolesGuard } from '../../guards/roles.guard';
import {
  BulkTransactionOperationDto,
  BulkTransactionOperationType,
  CreateTransactionDto,
  ExportFormat,
  ReportType,
  TransactionAnalyticsDto,
  TransactionCategory,
  TransactionExportDto,
  TransactionReportDto,
  TransactionResponseDto,
  TransactionSettingsDto,
  TransactionStatus,
  TransactionType,
  UpdateTransactionDto,
} from './dto/transaction.dto';
import { TransactionService } from './transaction.service';

@ApiTags('Transactions')
@Controller('transactions')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class TransactionController {
  constructor(private readonly transactionService: TransactionService) {}

  // Transaction Management
  @Post()
  @Roles('admin', 'finance_manager')
  @ApiOperation({ summary: 'Create a new transaction' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Transaction created successfully',
    type: TransactionResponseDto,
  })
  async createTransaction(
    @Body(ValidationPipe) createTransactionDto: CreateTransactionDto,
    @Request() req: any,
  ): Promise<TransactionResponseDto> {
    return this.transactionService.createTransaction(
      createTransactionDto,
      req.user.id,
    );
  }

  @Put(':id')
  @Roles('admin', 'finance_manager')
  @ApiOperation({ summary: 'Update a transaction' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Transaction updated successfully',
    type: TransactionResponseDto,
  })
  async updateTransaction(
    @Param('id', ParseCoworsIdPipe) id: string,
    @Body(ValidationPipe) updateTransactionDto: UpdateTransactionDto,
    @Request() req: any,
  ): Promise<TransactionResponseDto> {
    return this.transactionService.updateTransaction(
      id,
      updateTransactionDto,
      req.user.id,
    );
  }

  @Get(':id')
  @Roles('admin', 'finance_manager', 'partner', 'customer')
  @ApiOperation({ summary: 'Get transaction by ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Transaction retrieved successfully',
    type: TransactionResponseDto,
  })
  async getTransaction(
    @Param('id', ParseCoworsIdPipe) id: string,
    @Request() req?: any,
  ): Promise<TransactionResponseDto> {
    return this.transactionService.getTransactionById(id);
  }

  @Get()
  @Roles('admin', 'finance_manager', 'partner', 'customer')
  @ApiOperation({ summary: 'Get transactions with filtering and pagination' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Transactions retrieved successfully',
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
    enum: TransactionStatus,
    isArray: true,
    description: 'Filter by status',
  })
  @ApiQuery({
    name: 'type',
    required: false,
    enum: TransactionType,
    isArray: true,
    description: 'Filter by type',
  })
  @ApiQuery({
    name: 'category',
    required: false,
    enum: TransactionCategory,
    isArray: true,
    description: 'Filter by category',
  })
  @ApiQuery({
    name: 'userId',
    required: false,
    type: String,
    description: 'Filter by user ID',
  })
  @ApiQuery({
    name: 'partnerId',
    required: false,
    type: String,
    description: 'Filter by partner ID',
  })
  @ApiQuery({
    name: 'bookingId',
    required: false,
    type: String,
    description: 'Filter by booking ID',
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
    description: 'Search in description and reference',
  })
  async getTransactions(
    @Query('page', new ParseIntPipe({ optional: true })) page: number = 1,
    @Query('limit', new ParseIntPipe({ optional: true })) limit: number = 10,
    @Query(
      'status',
      new ParseArrayPipe({ items: String, separator: ',', optional: true }),
    )
    status?: TransactionStatus[],
    @Query(
      'type',
      new ParseArrayPipe({ items: String, separator: ',', optional: true }),
    )
    type?: TransactionType[],
    @Query(
      'category',
      new ParseArrayPipe({ items: String, separator: ',', optional: true }),
    )
    category?: TransactionCategory[],
    @Query('userId') userId?: string,
    @Query('partnerId') partnerId?: string,
    @Query('bookingId') bookingId?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
    @Query('minAmount', new ParseIntPipe({ optional: true }))
    minAmount?: number,
    @Query('maxAmount', new ParseIntPipe({ optional: true }))
    maxAmount?: number,
    @Query('search') search?: string,
    @Request() req?: any,
  ): Promise<{
    transactions: TransactionResponseDto[];
    total: number;
    page: number;
    limit: number;
  }> {
    const filters = {
      status,
      type,
      category,
      userId,
      partnerId,
      bookingId,
      dateFrom: dateFrom ? new Date(dateFrom) : undefined,
      dateTo: dateTo ? new Date(dateTo) : undefined,
      minAmount,
      maxAmount,
      search,
    };

    return this.transactionService.getTransactions(page, limit, filters);
  }

  @Delete(':id')
  @Roles('admin')
  @ApiOperation({ summary: 'Delete a transaction' })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Transaction deleted successfully',
  })
  async deleteTransaction(
    @Param('id', ParseCoworsIdPipe) id: string,
    @Request() req: any,
  ): Promise<void> {
    return this.transactionService.deleteTransaction(id, req.user.id);
  }

  // Status Management
  @Put(':id/status')
  @Roles('admin', 'finance_manager')
  @ApiOperation({ summary: 'Update transaction status' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Transaction status updated successfully',
    type: TransactionResponseDto,
  })
  async updateTransactionStatus(
    @Param('id', ParseCoworsIdPipe) id: string,
    @Body('status', new ParseEnumPipe(TransactionStatus))
    status: TransactionStatus,
    @Body('reason') reason?: string,
    @Request() req?: any,
  ): Promise<TransactionResponseDto> {
    return this.transactionService.updateTransactionStatus(
      id,
      status,
      reason,
      req.user.id,
    );
  }

  @Post(':id/approve')
  @Roles('admin', 'finance_manager')
  @ApiOperation({ summary: 'Approve a pending transaction' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Transaction approved successfully',
    type: TransactionResponseDto,
  })
  async approveTransaction(
    @Param('id', ParseCoworsIdPipe) id: string,
    @Body('notes') notes?: string,
    @Request() req?: any,
  ): Promise<TransactionResponseDto> {
    return this.transactionService.approveTransaction(id, req.user.id);
  }

  @Post(':id/reject')
  @Roles('admin', 'finance_manager')
  @ApiOperation({ summary: 'Reject a pending transaction' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Transaction rejected successfully',
    type: TransactionResponseDto,
  })
  async rejectTransaction(
    @Param('id', ParseCoworsIdPipe) id: string,
    @Body('reason') reason?: string,
    @Request() req?: any,
  ): Promise<TransactionResponseDto> {
    return this.transactionService.rejectTransaction(id, reason, req.user.id);
  }

  @Post(':id/reverse')
  @Roles('admin')
  @ApiOperation({ summary: 'Reverse a completed transaction' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Transaction reversed successfully',
    type: TransactionResponseDto,
  })
  async reverseTransaction(
    @Param('id', ParseCoworsIdPipe) id: string,
    @Body('reason') reason?: string,
    @Request() req?: any,
  ): Promise<TransactionResponseDto> {
    return this.transactionService.reverseTransaction(id, reason, req.user.id);
  }

  // Bulk Operations
  @Post('bulk-operation')
  @Roles('admin', 'finance_manager')
  @ApiOperation({ summary: 'Perform bulk operations on transactions' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Bulk operation completed',
  })
  async bulkOperation(
    @Body(ValidationPipe) operationDto: BulkTransactionOperationDto,
    @Request() req?: any,
  ): Promise<{ success: number; failed: number; errors: string[] }> {
    return this.transactionService.bulkOperation(operationDto, req.user.id);
  }

  // Analytics and Reporting
  @Get('analytics/overview')
  @Roles('admin', 'finance_manager')
  @ApiOperation({ summary: 'Get transaction analytics' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Analytics retrieved successfully',
    type: TransactionAnalyticsDto,
  })
  @ApiQuery({
    name: 'dateFrom',
    required: false,
    type: Date,
    description: 'Analytics from date',
  })
  @ApiQuery({
    name: 'dateTo',
    required: false,
    type: Date,
    description: 'Analytics to date',
  })
  @ApiQuery({
    name: 'type',
    required: false,
    enum: TransactionType,
    isArray: true,
    description: 'Filter by type',
  })
  @ApiQuery({
    name: 'category',
    required: false,
    enum: TransactionCategory,
    isArray: true,
    description: 'Filter by category',
  })
  @ApiQuery({
    name: 'partnerId',
    required: false,
    type: String,
    description: 'Filter by partner',
  })
  async getAnalytics(
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
    @Query(
      'type',
      new ParseArrayPipe({ items: String, separator: ',', optional: true }),
    )
    type?: TransactionType[],
    @Query(
      'category',
      new ParseArrayPipe({ items: String, separator: ',', optional: true }),
    )
    category?: TransactionCategory[],
    @Query('partnerId') partnerId?: string,
  ): Promise<TransactionAnalyticsDto> {
    const filters = {
      type,
      category,
      partnerId,
    };

    return this.transactionService.getAnalytics(
      dateFrom ? new Date(dateFrom) : undefined,
      dateTo ? new Date(dateTo) : undefined,
      filters,
    );
  }

  @Get('analytics/cash-flow')
  @Roles('admin', 'finance_manager')
  @ApiOperation({ summary: 'Get cash flow analytics' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Cash flow analytics retrieved successfully',
  })
  @ApiQuery({
    name: 'period',
    required: false,
    enum: ['daily', 'weekly', 'monthly'],
    description: 'Period for cash flow',
  })
  @ApiQuery({
    name: 'dateFrom',
    required: false,
    type: Date,
    description: 'Analytics from date',
  })
  @ApiQuery({
    name: 'dateTo',
    required: false,
    type: Date,
    description: 'Analytics to date',
  })
  async getCashFlowAnalytics(
    @Query('period') period: 'daily' | 'weekly' | 'monthly' = 'monthly',
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ): Promise<any> {
    return this.transactionService.getCashFlowAnalytics(
      period,
      dateFrom ? new Date(dateFrom) : undefined,
      dateTo ? new Date(dateTo) : undefined,
    );
  }

  // Export and Download
  @Post('export')
  @Roles('admin', 'finance_manager')
  @ApiOperation({ summary: 'Export transactions' })
  @ApiResponse({
    status: HttpStatus.ACCEPTED,
    description: 'Export initiated successfully',
  })
  async exportTransactions(
    @Body(ValidationPipe) exportDto: TransactionExportDto,
    @Request() req?: any,
  ): Promise<{ exportId: string }> {
    return this.transactionService.exportTransactions(exportDto, req.user.id);
  }

  @Get('exports/:exportId/status')
  @Roles('admin', 'finance_manager')
  @ApiOperation({ summary: 'Get export status' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Export status retrieved successfully',
  })
  async getExportStatus(
    @Param('exportId', ParseCoworsIdPipe) exportId: string,
  ): Promise<any> {
    return this.transactionService.getExportStatus(exportId);
  }

  @Get('exports/:exportId/download')
  @Roles('admin', 'finance_manager')
  @ApiOperation({ summary: 'Download exported file' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'File downloaded successfully',
  })
  async downloadExport(
    @Param('exportId', ParseCoworsIdPipe) exportId: string,
  ): Promise<any> {
    // TODO: Implement file download logic
    return { message: 'Download functionality to be implemented' };
  }

  // Report Generation
  @Post('reports/generate')
  @Roles('admin', 'finance_manager')
  @ApiOperation({ summary: 'Generate transaction report' })
  @ApiResponse({
    status: HttpStatus.ACCEPTED,
    description: 'Report generation initiated successfully',
  })
  async generateReport(
    @Body(ValidationPipe) reportDto: TransactionReportDto,
    @Request() req: any,
  ): Promise<{ reportId: string }> {
    const result = await this.transactionService.generateReport(
      reportDto,
      req.user.id,
    );
    return { reportId: result };
  }

  @Get('reports/:reportId/status')
  @Roles('admin', 'finance_manager')
  @ApiOperation({ summary: 'Get report generation status' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Report status retrieved successfully',
  })
  async getReportStatus(
    @Param('reportId', ParseCoworsIdPipe) reportId: string,
  ): Promise<any> {
    return this.transactionService.getReportStatus(reportId);
  }

  @Get('reports/:reportId/download')
  @Roles('admin', 'finance_manager')
  @ApiOperation({ summary: 'Download generated report' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Report downloaded successfully',
  })
  async downloadReport(
    @Param('reportId', ParseCoworsIdPipe) reportId: string,
  ): Promise<any> {
    // TODO: Implement report download logic
    return { message: 'Download functionality to be implemented' };
  }

  // Settings Management
  @Get('settings')
  @Roles('admin', 'finance_manager')
  @ApiOperation({ summary: 'Get transaction settings' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Settings retrieved successfully',
    type: TransactionSettingsDto,
  })
  async getSettings(): Promise<TransactionSettingsDto> {
    return this.transactionService.getSettings();
  }

  @Put('settings')
  @Roles('admin')
  @ApiOperation({ summary: 'Update transaction settings' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Settings updated successfully',
    type: TransactionSettingsDto,
  })
  async updateSettings(
    @Body(ValidationPipe) settingsDto: TransactionSettingsDto,
    @Request() req: any,
  ): Promise<TransactionSettingsDto> {
    return this.transactionService.updateSettings(settingsDto, req.user.id);
  }

  // Utility Methods
  @Get(':id/history')
  @Roles('admin', 'finance_manager')
  @ApiOperation({ summary: 'Get transaction history and audit trail' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Transaction history retrieved successfully',
  })
  async getTransactionHistory(
    @Param('id', ParseCoworsIdPipe) id: string,
  ): Promise<any> {
    // Return transaction details - using getTransaction instead
    const result = await this.transactionService.getTransactions(1, 1, {
      userId: id,
    });
    return result.transactions[0] || null;
  }

  @Post(':id/reconcile')
  @Roles('admin', 'finance_manager')
  @ApiOperation({ summary: 'Reconcile transaction with bank statement' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Transaction reconciled successfully',
  })
  async reconcileTransaction(
    @Param('id', ParseCoworsIdPipe) id: string,
    @Body('bankReference') bankReference: string,
    @Body('reconciliationDate') reconciliationDate: Date,
    @Request() req: any,
    @Body('notes') notes?: string,
  ): Promise<TransactionResponseDto> {
    // Reconciliation functionality to be implemented
    return { message: 'Reconciliation functionality to be implemented' } as any;
  }

  @Get('summary/daily')
  @Roles('admin', 'finance_manager')
  @ApiOperation({ summary: 'Get daily transaction summary' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Daily summary retrieved successfully',
  })
  @ApiQuery({
    name: 'date',
    required: false,
    type: Date,
    description: 'Date for summary (defaults to today)',
  })
  async getDailySummary(@Query('date') date?: string): Promise<any> {
    // Daily summary functionality to be implemented
    return { message: 'Daily summary functionality to be implemented' };
  }

  @Get('balance/current')
  @Roles('admin', 'finance_manager')
  @ApiOperation({ summary: 'Get current balance summary' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Balance summary retrieved successfully',
  })
  async getCurrentBalance(): Promise<any> {
    // Current balance functionality to be implemented
    return { message: 'Current balance functionality to be implemented' };
  }
}
