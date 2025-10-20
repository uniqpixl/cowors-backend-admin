import { UserEntity } from '@/auth/entities/user.entity';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, FindOptionsWhere, In, Like, Repository } from 'typeorm';
import { BookingEntity } from '../../database/entities/booking.entity';
import {
  BulkOperationResponseDto,
  BulkOperationType,
  BulkTransactionOperationDto,
  CashFlowReportResponseDto,
  CreateTransactionDto,
  ExportResponseDto,
  ExportStatus,
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
import {
  FinancialTransactionEntity,
  TransactionAuditTrailEntity,
  TransactionExportEntity,
  TransactionReportEntity,
  TransactionSettingsEntity,
} from './entities/financial-transaction.entity';

@Injectable()
export class FinancialTransactionService {
  constructor(
    @InjectRepository(FinancialTransactionEntity)
    private readonly transactionRepository: Repository<FinancialTransactionEntity>,
    @InjectRepository(TransactionAuditTrailEntity)
    private readonly auditRepository: Repository<TransactionAuditTrailEntity>,
    @InjectRepository(TransactionExportEntity)
    private readonly exportRepository: Repository<TransactionExportEntity>,
    @InjectRepository(TransactionReportEntity)
    private readonly reportRepository: Repository<TransactionReportEntity>,
    @InjectRepository(TransactionSettingsEntity)
    private readonly settingsRepository: Repository<TransactionSettingsEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    @InjectRepository(BookingEntity)
    private readonly bookingRepository: Repository<BookingEntity>,
  ) {}

  // Transaction Management
  async createTransaction(
    dto: CreateTransactionDto,
    createdBy: string,
  ): Promise<TransactionResponseDto> {
    // Validate user and partner if provided
    if (dto.userId) {
      const user = await this.userRepository.findOne({
        where: { id: dto.userId },
      });
      if (!user) {
        throw new NotFoundException('User not found');
      }
    }

    if (dto.partnerId) {
      const partner = await this.userRepository.findOne({
        where: { id: dto.partnerId },
      });
      if (!partner) {
        throw new NotFoundException('Partner not found');
      }
    }

    if (dto.bookingId) {
      const booking = await this.bookingRepository.findOne({
        where: { id: dto.bookingId },
      });
      if (!booking) {
        throw new NotFoundException('Booking not found');
      }
    }

    // Check for duplicate external transaction ID
    if (dto.externalTransactionId) {
      const existing = await this.transactionRepository.findOne({
        where: { externalTransactionId: dto.externalTransactionId },
      });
      if (existing) {
        throw new ConflictException(
          'Transaction with this external ID already exists',
        );
      }
    }

    const transaction = this.transactionRepository.create({
      ...dto,
      createdBy,
    });

    const savedTransaction = await this.transactionRepository.save(transaction);

    // Create audit trail
    await this.createAuditTrail(
      savedTransaction.id,
      'CREATE',
      null,
      savedTransaction,
      createdBy,
    );

    return this.mapToResponseDto(savedTransaction);
  }

  async getTransactions(
    dto: GetTransactionsDto,
    user: UserEntity,
  ): Promise<{ transactions: TransactionResponseDto[]; total: number }> {
    const {
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
    } = dto;
    const skip = (page - 1) * limit;

    const where: FindOptionsWhere<FinancialTransactionEntity> = {};

    // Apply filters
    if (dto.search) {
      where.description = Like(`%${dto.search}%`);
    }

    if (dto.status) {
      where.status = dto.status;
    }

    if (dto.type) {
      where.type = dto.type;
    }

    if (dto.category) {
      where.category = dto.category;
    }

    if (dto.paymentMethod) {
      where.paymentMethod = dto.paymentMethod;
    }

    if (dto.userId) {
      where.userId = dto.userId;
    }

    if (dto.partnerId) {
      where.partnerId = dto.partnerId;
    }

    if (dto.bookingId) {
      where.bookingId = dto.bookingId;
    }

    // Date range filter
    if (dto.startDate && dto.endDate) {
      where.transactionDate = Between(
        new Date(dto.startDate),
        new Date(dto.endDate),
      );
    }

    // Amount range filter
    if (dto.minAmount !== undefined || dto.maxAmount !== undefined) {
      const amountConditions: any = {};
      if (dto.minAmount !== undefined) {
        amountConditions.gte = dto.minAmount;
      }
      if (dto.maxAmount !== undefined) {
        amountConditions.lte = dto.maxAmount;
      }
      where.amount = amountConditions;
    }

    // Role-based access control
    if (user.role === 'Partner') {
      where.partnerId = user.id;
    }

    const [transactions, total] = await this.transactionRepository.findAndCount(
      {
        where,
        relations: ['user', 'partner', 'creator', 'updater'],
        skip,
        take: limit,
        order: { [sortBy]: sortOrder },
      },
    );

    return {
      transactions: transactions.map((transaction) =>
        this.mapToResponseDto(transaction),
      ),
      total,
    };
  }

  async getTransactionById(
    id: string,
    user: UserEntity,
  ): Promise<TransactionResponseDto> {
    const transaction = await this.transactionRepository.findOne({
      where: { id },
      relations: [
        'user',
        'partner',
        'booking',
        'creator',
        'updater',
        'auditTrail',
      ],
    });

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    // Role-based access control
    if (user.role === 'Partner' && transaction.partnerId !== user.id) {
      throw new ForbiddenException('Access denied');
    }

    return this.mapToResponseDto(transaction);
  }

  async updateTransaction(
    id: string,
    dto: UpdateTransactionDto,
    updatedBy: string,
  ): Promise<TransactionResponseDto> {
    const transaction = await this.transactionRepository.findOne({
      where: { id },
    });

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    if (!transaction.canBeModified()) {
      throw new BadRequestException(
        'Transaction cannot be modified in current status',
      );
    }

    const oldValues = { ...transaction };
    Object.assign(transaction, dto, { updatedBy });

    const updatedTransaction =
      await this.transactionRepository.save(transaction);

    // Create audit trail
    await this.createAuditTrail(
      id,
      'UPDATE',
      oldValues,
      updatedTransaction,
      updatedBy,
    );

    return this.mapToResponseDto(updatedTransaction);
  }

  async deleteTransaction(id: string, deletedBy: string): Promise<void> {
    const transaction = await this.transactionRepository.findOne({
      where: { id },
    });

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    if (!transaction.canBeModified()) {
      throw new BadRequestException(
        'Transaction cannot be deleted in current status',
      );
    }

    // Create audit trail before deletion
    await this.createAuditTrail(id, 'DELETE', transaction, null, deletedBy);

    await this.transactionRepository.remove(transaction);
  }

  // Status Management
  async approveTransaction(
    id: string,
    approvedBy: string,
  ): Promise<TransactionResponseDto> {
    const transaction = await this.transactionRepository.findOne({
      where: { id },
    });

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    if (!transaction.canBeApproved()) {
      throw new BadRequestException(
        'Transaction cannot be approved in current status',
      );
    }

    const oldValues = { ...transaction };
    transaction.status = TransactionStatus.APPROVED;
    transaction.updatedBy = approvedBy;

    const updatedTransaction =
      await this.transactionRepository.save(transaction);

    await this.createAuditTrail(
      id,
      'APPROVE',
      oldValues,
      updatedTransaction,
      approvedBy,
    );

    return this.mapToResponseDto(updatedTransaction);
  }

  async rejectTransaction(
    id: string,
    reason: string,
    rejectedBy: string,
  ): Promise<TransactionResponseDto> {
    const transaction = await this.transactionRepository.findOne({
      where: { id },
    });

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    if (!transaction.canBeRejected()) {
      throw new BadRequestException(
        'Transaction cannot be rejected in current status',
      );
    }

    const oldValues = { ...transaction };
    transaction.status = TransactionStatus.REJECTED;
    transaction.notes = reason;
    transaction.updatedBy = rejectedBy;

    const updatedTransaction =
      await this.transactionRepository.save(transaction);

    await this.createAuditTrail(
      id,
      'REJECT',
      oldValues,
      updatedTransaction,
      rejectedBy,
      reason,
    );

    return this.mapToResponseDto(updatedTransaction);
  }

  async completeTransaction(
    id: string,
    completedBy: string,
  ): Promise<TransactionResponseDto> {
    const transaction = await this.transactionRepository.findOne({
      where: { id },
    });

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    const oldValues = { ...transaction };
    transaction.status = TransactionStatus.COMPLETED;
    transaction.updatedBy = completedBy;

    const updatedTransaction =
      await this.transactionRepository.save(transaction);

    await this.createAuditTrail(
      id,
      'COMPLETE',
      oldValues,
      updatedTransaction,
      completedBy,
    );

    return this.mapToResponseDto(updatedTransaction);
  }

  async cancelTransaction(
    id: string,
    reason: string,
    cancelledBy: string,
  ): Promise<TransactionResponseDto> {
    const transaction = await this.transactionRepository.findOne({
      where: { id },
    });

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    if (!transaction.canBeCancelled()) {
      throw new BadRequestException(
        'Transaction cannot be cancelled in current status',
      );
    }

    const oldValues = { ...transaction };
    transaction.status = TransactionStatus.CANCELLED;
    transaction.notes = reason;
    transaction.updatedBy = cancelledBy;

    const updatedTransaction =
      await this.transactionRepository.save(transaction);

    await this.createAuditTrail(
      id,
      'CANCEL',
      oldValues,
      updatedTransaction,
      cancelledBy,
      reason,
    );

    return this.mapToResponseDto(updatedTransaction);
  }

  // Bulk Operations
  async bulkOperation(
    dto: BulkTransactionOperationDto,
    performedBy: string,
  ): Promise<BulkOperationResponseDto> {
    const operationId = `bulk_${Date.now()}`;
    const startedAt = new Date();
    let successfulItems = 0;
    let failedItems = 0;
    const errors: Array<{ transactionId: string; error: string }> = [];

    for (const transactionId of dto.transactionIds) {
      try {
        switch (dto.operation) {
          case BulkOperationType.APPROVE:
            await this.approveTransaction(transactionId, performedBy);
            break;
          case BulkOperationType.REJECT:
            await this.rejectTransaction(
              transactionId,
              dto.reason || 'Bulk rejection',
              performedBy,
            );
            break;
          case BulkOperationType.COMPLETE:
            await this.completeTransaction(transactionId, performedBy);
            break;
          case BulkOperationType.CANCEL:
            await this.cancelTransaction(
              transactionId,
              dto.reason || 'Bulk cancellation',
              performedBy,
            );
            break;
          case BulkOperationType.DELETE:
            await this.deleteTransaction(transactionId, performedBy);
            break;
          default:
            throw new BadRequestException(
              `Unsupported operation: ${dto.operation}`,
            );
        }
        successfulItems++;
      } catch (error) {
        failedItems++;
        errors.push({
          transactionId,
          error: error.message,
        });
      }
    }

    return {
      operationId,
      operation: dto.operation,
      totalItems: dto.transactionIds.length,
      successfulItems,
      failedItems,
      status: failedItems === 0 ? 'completed' : 'partial',
      errors: errors.length > 0 ? errors : undefined,
      startedAt,
      completedAt: new Date(),
    };
  }

  // Analytics and Reporting
  async getAnalytics(
    dto: TransactionAnalyticsDto,
    user: UserEntity,
  ): Promise<TransactionAnalyticsResponseDto> {
    const {
      startDate,
      endDate,
      groupBy = 'day',
      type,
      category,
      partnerId,
    } = dto;

    const where: FindOptionsWhere<FinancialTransactionEntity> = {};

    if (startDate && endDate) {
      where.transactionDate = Between(new Date(startDate), new Date(endDate));
    }

    if (type) {
      where.type = type;
    }

    if (category) {
      where.category = category;
    }

    if (partnerId) {
      where.partnerId = partnerId;
    }

    // Role-based access control
    if (user.role === 'Partner') {
      where.partnerId = user.id;
    }

    const transactions = await this.transactionRepository.find({
      where,
      relations: ['user', 'partner'],
    });

    // Calculate analytics
    const totalTransactions = transactions.length;
    const totalAmount = transactions.reduce(
      (sum, t) => sum + Number(t.amount),
      0,
    );
    const averageAmount =
      totalTransactions > 0 ? totalAmount / totalTransactions : 0;

    // Group by status
    const transactionsByStatus = this.groupByField(transactions, 'status');
    const transactionsByType = this.groupByField(transactions, 'type');
    const transactionsByCategory = this.groupByField(transactions, 'category');
    const topPaymentMethods = this.groupByField(transactions, 'paymentMethod');

    // Group by time period
    const transactionsOverTime = this.groupByTimePeriod(transactions, groupBy);

    return {
      totalTransactions,
      totalAmount,
      averageAmount,
      transactionsByStatus,
      transactionsByType,
      transactionsByCategory,
      transactionsOverTime,
      topPaymentMethods,
      analysisPeriod: {
        startDate: startDate
          ? new Date(startDate)
          : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        endDate: endDate ? new Date(endDate) : new Date(),
      },
    };
  }

  async getSummary(
    dto: TransactionAnalyticsDto,
    user: UserEntity,
  ): Promise<TransactionSummaryResponseDto> {
    const { startDate, endDate } = dto;

    const where: FindOptionsWhere<FinancialTransactionEntity> = {};

    if (startDate && endDate) {
      where.transactionDate = Between(new Date(startDate), new Date(endDate));
    }

    // Role-based access control
    if (user.role === 'Partner') {
      where.partnerId = user.id;
    }

    const transactions = await this.transactionRepository.find({ where });

    const totalRevenue = this.calculateTotalByTypes(transactions, [
      TransactionType.PAYMENT,
      TransactionType.CREDIT,
    ]);
    const totalPayouts = this.calculateTotalByTypes(transactions, [
      TransactionType.PAYOUT,
    ]);
    const totalRefunds = this.calculateTotalByTypes(transactions, [
      TransactionType.REFUND,
    ]);
    const totalFees = this.calculateTotalByTypes(transactions, [
      TransactionType.FEE,
    ]);
    const totalTaxes = this.calculateTotalByTypes(transactions, [
      TransactionType.TAX,
    ]);
    const pendingAmount = this.calculateTotalByStatus(
      transactions,
      TransactionStatus.PENDING,
    );
    const failedAmount = this.calculateTotalByStatus(
      transactions,
      TransactionStatus.FAILED,
    );

    const netIncome =
      totalRevenue - totalPayouts - totalRefunds - totalFees - totalTaxes;

    // Calculate growth rate (simplified)
    const growthRate = 0; // TODO: Implement growth rate calculation

    return {
      totalRevenue,
      totalPayouts,
      totalRefunds,
      totalFees,
      totalTaxes,
      netIncome,
      pendingAmount,
      failedAmount,
      growthRate,
      currency: 'INR',
      period: {
        startDate: startDate
          ? new Date(startDate)
          : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        endDate: endDate ? new Date(endDate) : new Date(),
      },
    };
  }

  async getCashFlowReport(
    dto: TransactionAnalyticsDto,
    user: UserEntity,
  ): Promise<CashFlowReportResponseDto> {
    const { startDate, endDate, groupBy = 'month' } = dto;

    const where: FindOptionsWhere<FinancialTransactionEntity> = {};

    if (startDate && endDate) {
      where.transactionDate = Between(new Date(startDate), new Date(endDate));
    }

    // Role-based access control
    if (user.role === 'Partner') {
      where.partnerId = user.id;
    }

    const transactions = await this.transactionRepository.find({ where });

    const inflows = transactions.filter((t) => t.isIncome());
    const outflows = transactions.filter((t) => t.isExpense());

    const cashInflows = this.groupByField(inflows, 'category').map((item) => ({
      category: item.category,
      amount: item.amount,
      percentage:
        (item.amount / inflows.reduce((sum, t) => sum + Number(t.amount), 0)) *
        100,
    }));

    const cashOutflows = this.groupByField(outflows, 'category').map(
      (item) => ({
        category: item.category,
        amount: item.amount,
        percentage:
          (item.amount /
            outflows.reduce((sum, t) => sum + Number(t.amount), 0)) *
          100,
      }),
    );

    const totalInflow = inflows.reduce((sum, t) => sum + Number(t.amount), 0);
    const totalOutflow = outflows.reduce((sum, t) => sum + Number(t.amount), 0);
    const netCashFlow = totalInflow - totalOutflow;

    const cashFlowByPeriod = this.groupByTimePeriod(transactions, groupBy).map(
      (item) => ({
        period: item.period,
        inflow: item.transactions
          .filter((t) => t.isIncome())
          .reduce((sum, t) => sum + Number(t.amount), 0),
        outflow: item.transactions
          .filter((t) => t.isExpense())
          .reduce((sum, t) => sum + Number(t.amount), 0),
        netFlow: item.transactions.reduce(
          (sum, t) =>
            sum + (t.isIncome() ? Number(t.amount) : -Number(t.amount)),
          0,
        ),
      }),
    );

    return {
      cashInflows,
      cashOutflows,
      netCashFlow,
      openingBalance: 0, // TODO: Implement opening balance calculation
      closingBalance: netCashFlow, // Simplified
      cashFlowByPeriod,
      reportPeriod: {
        startDate: startDate
          ? new Date(startDate)
          : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        endDate: endDate ? new Date(endDate) : new Date(),
      },
    };
  }

  // Export and Download
  async exportTransactions(
    dto: ExportTransactionsDto,
    createdBy: string,
  ): Promise<ExportResponseDto> {
    const exportEntity = this.exportRepository.create({
      name: dto.name || `transactions_export_${Date.now()}`,
      format: dto.format,
      filters: dto.filters,
      includeFields: dto.includeFields,
      createdBy,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    });

    const savedExport = await this.exportRepository.save(exportEntity);

    // TODO: Implement actual export processing in background
    // For now, we'll simulate the export
    setTimeout(async () => {
      try {
        const transactions = await this.getTransactionsForExport(dto.filters);
        savedExport.totalRecords = transactions.length;
        savedExport.status = ExportStatus.COMPLETED;
        savedExport.completedAt = new Date();
        savedExport.downloadUrl = `/api/financial-transactions/exports/${savedExport.id}/download`;
        await this.exportRepository.save(savedExport);
      } catch (error) {
        savedExport.status = ExportStatus.FAILED;
        savedExport.errorMessage = error.message;
        await this.exportRepository.save(savedExport);
      }
    }, 1000);

    return {
      exportId: savedExport.id,
      status: savedExport.status,
      format: savedExport.format,
      totalRecords: savedExport.totalRecords,
      createdAt: savedExport.createdAt,
    };
  }

  async downloadExport(
    exportId: string,
    userId: string,
  ): Promise<{ downloadUrl: string }> {
    const exportEntity = await this.exportRepository.findOne({
      where: { id: exportId, createdBy: userId },
    });

    if (!exportEntity) {
      throw new NotFoundException('Export not found');
    }

    if (!exportEntity.isCompleted()) {
      throw new BadRequestException('Export is not ready for download');
    }

    if (exportEntity.isExpired()) {
      throw new BadRequestException('Export has expired');
    }

    return {
      downloadUrl: exportEntity.downloadUrl,
    };
  }

  // Settings Management
  async getSettings(): Promise<TransactionSettingsResponseDto> {
    let settings = await this.settingsRepository.findOne({ where: {} });

    if (!settings) {
      settings = this.settingsRepository.create({});
      settings = await this.settingsRepository.save(settings);
    }

    return this.mapSettingsToResponseDto(settings);
  }

  async updateSettings(
    dto: TransactionSettingsDto,
    updatedBy: string,
  ): Promise<TransactionSettingsResponseDto> {
    let settings = await this.settingsRepository.findOne({ where: {} });

    if (!settings) {
      settings = this.settingsRepository.create(dto);
    } else {
      Object.assign(settings, dto);
    }

    settings.updatedBy = updatedBy;
    const updatedSettings = await this.settingsRepository.save(settings);

    return this.mapSettingsToResponseDto(updatedSettings);
  }

  // Utility Methods
  async validateTransaction(
    dto: CreateTransactionDto,
  ): Promise<{ isValid: boolean; errors?: string[] }> {
    const errors: string[] = [];

    // Validate amount
    if (dto.amount <= 0) {
      errors.push('Amount must be greater than 0');
    }

    // Validate currency
    if (!['INR', 'USD', 'EUR'].includes(dto.currency)) {
      errors.push('Invalid currency code');
    }

    // Validate user exists
    if (dto.userId) {
      const user = await this.userRepository.findOne({
        where: { id: dto.userId },
      });
      if (!user) {
        errors.push('User not found');
      }
    }

    // Validate partner exists
    if (dto.partnerId) {
      const partner = await this.userRepository.findOne({
        where: { id: dto.partnerId },
      });
      if (!partner) {
        errors.push('Partner not found');
      }
    }

    // Validate booking exists
    if (dto.bookingId) {
      const booking = await this.bookingRepository.findOne({
        where: { id: dto.bookingId },
      });
      if (!booking) {
        errors.push('Booking not found');
      }
    }

    return {
      isValid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
    };
  }

  async getUserBalance(
    userId: string,
    user: UserEntity,
  ): Promise<{ balance: number; currency: string }> {
    // Role-based access control
    if (user.role === 'Partner' && userId !== user.id) {
      throw new ForbiddenException('Access denied');
    }

    const transactions = await this.transactionRepository.find({
      where: {
        userId,
        status: TransactionStatus.COMPLETED,
      },
    });

    const balance = transactions.reduce((sum, transaction) => {
      return (
        sum +
        (transaction.isIncome()
          ? Number(transaction.amount)
          : -Number(transaction.amount))
      );
    }, 0);

    return {
      balance,
      currency: 'INR',
    };
  }

  async getUserHistory(
    userId: string,
    dto: GetTransactionsDto,
    user: UserEntity,
  ): Promise<{ transactions: TransactionResponseDto[]; total: number }> {
    // Role-based access control
    if (user.role === 'Partner' && userId !== user.id) {
      throw new ForbiddenException('Access denied');
    }

    const modifiedDto = { ...dto, userId };
    return this.getTransactions(modifiedDto, user);
  }

  async getBookingTransactions(
    bookingId: string,
    user: UserEntity,
  ): Promise<TransactionResponseDto[]> {
    const transactions = await this.transactionRepository.find({
      where: { bookingId },
      relations: ['user', 'partner', 'creator', 'updater'],
      order: { createdAt: 'DESC' },
    });

    // Role-based access control
    if (user.role === 'Partner') {
      const filteredTransactions = transactions.filter(
        (t) => t.partnerId === user.id,
      );
      return filteredTransactions.map((t) => this.mapToResponseDto(t));
    }

    return transactions.map((t) => this.mapToResponseDto(t));
  }

  async getPartnerTransactions(
    partnerId: string,
    dto: GetTransactionsDto,
    user: UserEntity,
  ): Promise<{ transactions: TransactionResponseDto[]; total: number }> {
    // Role-based access control
    if (user.role === 'Partner' && partnerId !== user.id) {
      throw new ForbiddenException('Access denied');
    }

    const modifiedDto = { ...dto, partnerId };
    return this.getTransactions(modifiedDto, user);
  }

  // Helper Methods
  private async createAuditTrail(
    transactionId: string,
    action: string,
    oldValues: any,
    newValues: any,
    performedBy: string,
    reason?: string,
  ): Promise<void> {
    const auditTrail = this.auditRepository.create({
      transactionId,
      action,
      oldValues,
      newValues,
      reason,
      performedBy,
    });

    await this.auditRepository.save(auditTrail);
  }

  private mapToResponseDto(
    transaction: FinancialTransactionEntity,
  ): TransactionResponseDto {
    return {
      id: transaction.id,
      type: transaction.type,
      category: transaction.category,
      status: transaction.status,
      amount: Number(transaction.amount),
      currency: transaction.currency,
      description: transaction.description,
      paymentMethod: transaction.paymentMethod,
      user: transaction.user
        ? {
            id: transaction.user.id,
            name:
              `${transaction.user.firstName || ''} ${transaction.user.lastName || ''}`.trim() ||
              transaction.user.username,
            email: transaction.user.email,
          }
        : undefined,
      partner: transaction.partner
        ? {
            id: transaction.partner.id,
            name:
              `${transaction.partner.firstName || ''} ${transaction.partner.lastName || ''}`.trim() ||
              transaction.partner.username,
            email: transaction.partner.email,
          }
        : undefined,
      booking: transaction.bookingId
        ? {
            id: transaction.bookingId,
            bookingNumber: null, // Booking relation is not available
          }
        : undefined,
      externalTransactionId: transaction.externalTransactionId,
      paymentGateway: transaction.paymentGateway,
      gatewayTransactionId: transaction.gatewayTransactionId,
      gatewayResponse: transaction.gatewayResponse,
      taxAmount: transaction.taxAmount
        ? Number(transaction.taxAmount)
        : undefined,
      feeAmount: transaction.feeAmount
        ? Number(transaction.feeAmount)
        : undefined,
      netAmount: transaction.netAmount
        ? Number(transaction.netAmount)
        : undefined,
      notes: transaction.notes,
      metadata: transaction.metadata,
      transactionDate: transaction.transactionDate,
      dueDate: transaction.dueDate,
      createdAt: transaction.createdAt,
      updatedAt: transaction.updatedAt,
      createdBy: transaction.creator
        ? {
            id: transaction.creator.id,
            name:
              `${transaction.creator.firstName || ''} ${transaction.creator.lastName || ''}`.trim() ||
              transaction.creator.username,
          }
        : undefined,
      updatedBy: transaction.updater
        ? {
            id: transaction.updater.id,
            name:
              `${transaction.updater.firstName || ''} ${transaction.updater.lastName || ''}`.trim() ||
              transaction.updater.username,
          }
        : undefined,
    };
  }

  private mapSettingsToResponseDto(
    settings: TransactionSettingsEntity,
  ): TransactionSettingsResponseDto {
    return {
      id: settings.id,
      autoApproveThreshold: Number(settings.autoApproveThreshold),
      defaultCurrency: settings.defaultCurrency,
      enableNotifications: settings.enableNotifications,
      notificationEmail: settings.notificationEmail,
      transactionTimeout: settings.transactionTimeout,
      maxRetryAttempts: settings.maxRetryAttempts,
      enableAuditTrail: settings.enableAuditTrail,
      dataRetentionDays: settings.dataRetentionDays,
      createdAt: settings.createdAt,
      updatedAt: settings.updatedAt,
      updatedBy: settings.updater
        ? {
            id: settings.updater.id,
            name:
              `${settings.updater.firstName || ''} ${settings.updater.lastName || ''}`.trim() ||
              settings.updater.username,
          }
        : undefined,
    };
  }

  private groupByField(
    transactions: FinancialTransactionEntity[],
    field: string,
  ): any[] {
    const groups = transactions.reduce((acc, transaction) => {
      const key = transaction[field] || 'unknown';
      if (!acc[key]) {
        acc[key] = { count: 0, amount: 0 };
      }
      acc[key].count++;
      acc[key].amount += Number(transaction.amount);
      return acc;
    }, {});

    return Object.entries(groups).map(([key, value]: [string, any]) => ({
      [field]: key,
      count: value.count,
      amount: value.amount,
    }));
  }

  private groupByTimePeriod(
    transactions: FinancialTransactionEntity[],
    groupBy: string,
  ): any[] {
    const groups = transactions.reduce((acc, transaction) => {
      const date = new Date(transaction.transactionDate);
      let key: string;

      switch (groupBy) {
        case 'day':
          key = date.toISOString().split('T')[0];
          break;
        case 'week':
          const weekStart = new Date(
            date.setDate(date.getDate() - date.getDay()),
          );
          key = weekStart.toISOString().split('T')[0];
          break;
        case 'month':
          key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          break;
        case 'year':
          key = String(date.getFullYear());
          break;
        default:
          key = date.toISOString().split('T')[0];
      }

      if (!acc[key]) {
        acc[key] = { count: 0, amount: 0, transactions: [] };
      }
      acc[key].count++;
      acc[key].amount += Number(transaction.amount);
      acc[key].transactions.push(transaction);
      return acc;
    }, {});

    return Object.entries(groups).map(([period, value]: [string, any]) => ({
      period,
      count: value.count,
      amount: value.amount,
      transactions: value.transactions,
    }));
  }

  private calculateTotalByTypes(
    transactions: FinancialTransactionEntity[],
    types: TransactionType[],
  ): number {
    return transactions
      .filter(
        (t) =>
          types.includes(t.type) && t.status === TransactionStatus.COMPLETED,
      )
      .reduce((sum, t) => sum + Number(t.amount), 0);
  }

  private calculateTotalByStatus(
    transactions: FinancialTransactionEntity[],
    status: TransactionStatus,
  ): number {
    return transactions
      .filter((t) => t.status === status)
      .reduce((sum, t) => sum + Number(t.amount), 0);
  }

  private async getTransactionsForExport(
    filters?: GetTransactionsDto,
  ): Promise<FinancialTransactionEntity[]> {
    const where: FindOptionsWhere<FinancialTransactionEntity> = {};

    if (filters) {
      if (filters.status) where.status = filters.status;
      if (filters.type) where.type = filters.type;
      if (filters.category) where.category = filters.category;
      if (filters.userId) where.userId = filters.userId;
      if (filters.partnerId) where.partnerId = filters.partnerId;
      if (filters.startDate && filters.endDate) {
        where.transactionDate = Between(
          new Date(filters.startDate),
          new Date(filters.endDate),
        );
      }
    }

    return this.transactionRepository.find({
      where,
      relations: ['user', 'partner', 'creator', 'updater'],
      order: { createdAt: 'DESC' },
    });
  }
}
