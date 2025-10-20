import { UserEntity } from '@/auth/entities/user.entity';
import { BookingEntity } from '@/database/entities/booking.entity';
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as csv from 'csv-writer';
import * as fs from 'fs';
import * as path from 'path';
import {
  Between,
  In,
  LessThan,
  MoreThan,
  Repository,
  SelectQueryBuilder,
} from 'typeorm';
import {
  BulkTransactionOperationDto,
  BulkTransactionOperationType,
  CreateTransactionDto,
  ExportFormat,
  PaymentMethod,
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
import {
  TransactionAuditTrailEntity,
  TransactionEntity,
  TransactionExportEntity,
  TransactionReportEntity,
  TransactionSettingsEntity,
} from './entities/transaction.entity';

@Injectable()
export class TransactionService {
  constructor(
    @InjectRepository(TransactionEntity)
    private transactionRepository: Repository<TransactionEntity>,
    @InjectRepository(TransactionAuditTrailEntity)
    private auditTrailRepository: Repository<TransactionAuditTrailEntity>,
    @InjectRepository(TransactionExportEntity)
    private exportRepository: Repository<TransactionExportEntity>,
    @InjectRepository(TransactionReportEntity)
    private reportRepository: Repository<TransactionReportEntity>,
    @InjectRepository(TransactionSettingsEntity)
    private settingsRepository: Repository<TransactionSettingsEntity>,
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
    @InjectRepository(BookingEntity)
    private bookingRepository: Repository<BookingEntity>,
  ) {}

  // Transaction Management
  async createTransaction(
    createTransactionDto: CreateTransactionDto,
    createdBy?: string,
  ): Promise<TransactionResponseDto> {
    try {
      // Validate related entities
      await this.validateRelatedEntities(createTransactionDto);

      // Check settings for auto-approval
      const settings = await this.getSettings();
      let status = TransactionStatus.PENDING;

      if (
        createTransactionDto.autoApprove ||
        (settings && settings.shouldAutoApprove(createTransactionDto.amount))
      ) {
        status = TransactionStatus.COMPLETED;
      }

      const transaction = this.transactionRepository.create({
        ...createTransactionDto,
        status,
        createdBy,
        transactionDate: createTransactionDto.transactionDate || new Date(),
      });

      const savedTransaction =
        await this.transactionRepository.save(transaction);

      // Create audit trail
      await this.createAuditTrail(
        savedTransaction.id,
        'CREATE',
        null,
        savedTransaction,
        'Transaction created',
        createdBy,
      );

      return this.mapToResponseDto(savedTransaction);
    } catch (error) {
      throw new BadRequestException(
        `Failed to create transaction: ${error.message}`,
      );
    }
  }

  async getTransactionById(id: string): Promise<TransactionResponseDto> {
    const transaction = await this.transactionRepository.findOne({
      where: { id },
      relations: ['user', 'partner'],
    });

    if (!transaction) {
      throw new NotFoundException(`Transaction with ID ${id} not found`);
    }

    return this.mapToResponseDto(transaction);
  }

  async getTransactions(
    page: number = 1,
    limit: number = 10,
    filters?: {
      status?: TransactionStatus[];
      type?: TransactionType[];
      category?: TransactionCategory[];
      userId?: string;
      partnerId?: string;
      bookingId?: string;
      dateFrom?: Date;
      dateTo?: Date;
      minAmount?: number;
      maxAmount?: number;
      search?: string;
    },
  ): Promise<{
    transactions: TransactionResponseDto[];
    total: number;
    page: number;
    limit: number;
  }> {
    const queryBuilder = this.transactionRepository
      .createQueryBuilder('transaction')
      .leftJoinAndSelect('transaction.user', 'user')
      .leftJoinAndSelect('transaction.partner', 'partner');

    // Apply filters
    this.applyTransactionFilters(queryBuilder, filters);

    // Apply pagination
    const offset = (page - 1) * limit;
    queryBuilder.skip(offset).take(limit);

    // Order by creation date
    queryBuilder.orderBy('transaction.createdAt', 'DESC');

    const [transactions, total] = await queryBuilder.getManyAndCount();

    return {
      transactions: transactions.map((transaction) =>
        this.mapToResponseDto(transaction),
      ),
      total,
      page,
      limit,
    };
  }

  async updateTransaction(
    id: string,
    updateTransactionDto: UpdateTransactionDto,
    updatedBy?: string,
  ): Promise<TransactionResponseDto> {
    const transaction = await this.transactionRepository.findOne({
      where: { id },
    });
    if (!transaction) {
      throw new NotFoundException(`Transaction with ID ${id} not found`);
    }

    // Store old values for audit trail
    const oldValues = { ...transaction };

    // Update transaction
    Object.assign(transaction, updateTransactionDto, { updatedBy });
    const updatedTransaction =
      await this.transactionRepository.save(transaction);

    // Create audit trail
    await this.createAuditTrail(
      id,
      'UPDATE',
      oldValues,
      updatedTransaction,
      'Transaction updated',
      updatedBy,
    );

    return this.getTransactionById(id);
  }

  async deleteTransaction(id: string, deletedBy?: string): Promise<void> {
    const transaction = await this.transactionRepository.findOne({
      where: { id },
    });
    if (!transaction) {
      throw new NotFoundException(`Transaction with ID ${id} not found`);
    }

    // Check if transaction can be deleted
    if (transaction.status === TransactionStatus.COMPLETED) {
      throw new BadRequestException('Cannot delete completed transaction');
    }

    // Create audit trail before deletion
    await this.createAuditTrail(
      id,
      'DELETE',
      transaction,
      null,
      'Transaction deleted',
      deletedBy,
    );

    await this.transactionRepository.remove(transaction);
  }

  // Status Management
  async updateTransactionStatus(
    id: string,
    status: TransactionStatus,
    reason?: string,
    updatedBy?: string,
  ): Promise<TransactionResponseDto> {
    const transaction = await this.transactionRepository.findOne({
      where: { id },
    });
    if (!transaction) {
      throw new NotFoundException(`Transaction with ID ${id} not found`);
    }

    const oldStatus = transaction.status;
    transaction.status = status;
    transaction.updatedBy = updatedBy;

    // Update status-specific timestamps
    if (status === TransactionStatus.PROCESSING) {
      transaction.processingDate = new Date();
    } else if (status === TransactionStatus.COMPLETED) {
      transaction.completionDate = new Date();
    }

    const updatedTransaction =
      await this.transactionRepository.save(transaction);

    // Create audit trail
    await this.createAuditTrail(
      id,
      'STATUS_UPDATE',
      { status: oldStatus },
      { status },
      reason || `Status updated from ${oldStatus} to ${status}`,
      updatedBy,
    );

    return this.mapToResponseDto(updatedTransaction);
  }

  async approveTransaction(
    id: string,
    approvedBy?: string,
  ): Promise<TransactionResponseDto> {
    return this.updateTransactionStatus(
      id,
      TransactionStatus.COMPLETED,
      'Transaction approved',
      approvedBy,
    );
  }

  async rejectTransaction(
    id: string,
    reason: string,
    rejectedBy?: string,
  ): Promise<TransactionResponseDto> {
    return this.updateTransactionStatus(
      id,
      TransactionStatus.FAILED,
      reason,
      rejectedBy,
    );
  }

  async reverseTransaction(
    id: string,
    reason: string,
    reversedBy?: string,
  ): Promise<TransactionResponseDto> {
    const transaction = await this.transactionRepository.findOne({
      where: { id },
    });
    if (!transaction) {
      throw new NotFoundException(`Transaction with ID ${id} not found`);
    }

    if (!transaction.canBeReversed()) {
      throw new BadRequestException('Transaction cannot be reversed');
    }

    // Create reverse transaction
    const reverseTransactionDto: CreateTransactionDto = {
      type:
        transaction.type === TransactionType.CREDIT
          ? TransactionType.DEBIT
          : TransactionType.CREDIT,
      category: transaction.category,
      amount: transaction.amount,
      currency: transaction.currency,
      description: `Reversal of ${transaction.description}`,
      userId: transaction.userId,
      partnerId: transaction.partnerId,
      bookingId: transaction.bookingId,
      invoiceId: transaction.invoiceId,
      paymentMethod: transaction.paymentMethod,
      notes: `Reversal reason: ${reason}`,
      metadata: {
        ...transaction.metadata,
        originalTransactionId: transaction.id,
        reversalReason: reason,
      },
      autoApprove: true,
    };

    const reverseTransaction = await this.createTransaction(
      reverseTransactionDto,
      reversedBy,
    );

    // Update original transaction status
    await this.updateTransactionStatus(
      id,
      TransactionStatus.REVERSED,
      reason,
      reversedBy,
    );

    return reverseTransaction;
  }

  // Bulk Operations
  async bulkOperation(
    bulkOperationDto: BulkTransactionOperationDto,
    operatedBy?: string,
  ): Promise<{ success: number; failed: number; errors: string[] }> {
    const { operation, transactionIds, data, reason } = bulkOperationDto;
    const results = { success: 0, failed: 0, errors: [] };

    for (const transactionId of transactionIds) {
      try {
        switch (operation) {
          case BulkTransactionOperationType.UPDATE_STATUS:
            if (data?.status) {
              await this.updateTransactionStatus(
                transactionId,
                data.status,
                reason,
                operatedBy,
              );
            }
            break;
          case BulkTransactionOperationType.APPROVE_TRANSACTIONS:
            await this.approveTransaction(transactionId, operatedBy);
            break;
          case BulkTransactionOperationType.REJECT_TRANSACTIONS:
            await this.rejectTransaction(
              transactionId,
              reason || 'Bulk rejection',
              operatedBy,
            );
            break;
          case BulkTransactionOperationType.REVERSE_TRANSACTIONS:
            await this.reverseTransaction(
              transactionId,
              reason || 'Bulk reversal',
              operatedBy,
            );
            break;
          case BulkTransactionOperationType.RECONCILE_TRANSACTIONS:
            await this.reconcileTransaction(transactionId, data, operatedBy);
            break;
          case BulkTransactionOperationType.DELETE_TRANSACTIONS:
            await this.deleteTransaction(transactionId, operatedBy);
            break;
          default:
            throw new BadRequestException(
              `Unsupported operation: ${operation}`,
            );
        }
        results.success++;
      } catch (error) {
        results.failed++;
        results.errors.push(`Transaction ${transactionId}: ${error.message}`);
      }
    }

    return results;
  }

  // Analytics and Reporting
  async getTransactionAnalytics(
    dateFrom?: Date,
    dateTo?: Date,
    filters?: {
      userId?: string;
      partnerId?: string;
      category?: TransactionCategory[];
      status?: TransactionStatus[];
    },
  ): Promise<TransactionAnalyticsDto> {
    const queryBuilder =
      this.transactionRepository.createQueryBuilder('transaction');

    // Apply date range
    if (dateFrom && dateTo) {
      queryBuilder.andWhere(
        'transaction.transactionDate BETWEEN :dateFrom AND :dateTo',
        {
          dateFrom,
          dateTo,
        },
      );
    }

    // Apply filters
    if (filters?.userId) {
      queryBuilder.andWhere('transaction.userId = :userId', {
        userId: filters.userId,
      });
    }
    if (filters?.partnerId) {
      queryBuilder.andWhere('transaction.partnerId = :partnerId', {
        partnerId: filters.partnerId,
      });
    }
    if (filters?.category?.length) {
      queryBuilder.andWhere('transaction.category IN (:...categories)', {
        categories: filters.category,
      });
    }
    if (filters?.status?.length) {
      queryBuilder.andWhere('transaction.status IN (:...statuses)', {
        statuses: filters.status,
      });
    }

    const transactions = await queryBuilder.getMany();

    // Calculate analytics
    const totalVolume = transactions.reduce(
      (sum, t) => sum + Number(t.amount),
      0,
    );
    const totalCredits = transactions
      .filter((t) => t.type === TransactionType.CREDIT)
      .reduce((sum, t) => sum + Number(t.amount), 0);
    const totalDebits = transactions
      .filter((t) => t.type === TransactionType.DEBIT)
      .reduce((sum, t) => sum + Number(t.amount), 0);
    const completedTransactions = transactions.filter(
      (t) => t.status === TransactionStatus.COMPLETED,
    ).length;
    const pendingTransactions = transactions.filter(
      (t) => t.status === TransactionStatus.PENDING,
    ).length;
    const failedTransactions = transactions.filter(
      (t) => t.status === TransactionStatus.FAILED,
    ).length;

    // Volume by category
    const volumeByCategory = Object.values(TransactionCategory)
      .map((category) => {
        const categoryTransactions = transactions.filter(
          (t) => t.category === category,
        );
        return {
          category,
          volume: categoryTransactions.reduce(
            (sum, t) => sum + Number(t.amount),
            0,
          ),
          count: categoryTransactions.length,
        };
      })
      .filter((item) => item.count > 0);

    // Volume by payment method
    const volumeByPaymentMethod = Object.values(PaymentMethod)
      .map((method) => {
        const methodTransactions = transactions.filter(
          (t) => t.paymentMethod === method,
        );
        return {
          method,
          volume: methodTransactions.reduce(
            (sum, t) => sum + Number(t.amount),
            0,
          ),
          count: methodTransactions.length,
        };
      })
      .filter((item) => item.count > 0);

    // Daily trends (last 30 days)
    const dailyTrends = this.calculateDailyTrends(
      transactions,
      dateFrom,
      dateTo,
    );

    // Top partners
    const topPartners = await this.getTopPartnersByVolume(transactions);

    // Status distribution
    const statusDistribution = Object.values(TransactionStatus)
      .map((status) => {
        const count = transactions.filter((t) => t.status === status).length;
        return {
          status,
          count,
          percentage:
            transactions.length > 0 ? (count / transactions.length) * 100 : 0,
        };
      })
      .filter((item) => item.count > 0);

    return {
      totalVolume,
      totalCredits,
      totalDebits,
      netAmount: totalCredits - totalDebits,
      totalTransactions: transactions.length,
      completedTransactions,
      pendingTransactions,
      failedTransactions,
      averageTransactionAmount:
        transactions.length > 0 ? totalVolume / transactions.length : 0,
      successRate:
        transactions.length > 0
          ? (completedTransactions / transactions.length) * 100
          : 0,
      volumeByCategory,
      volumeByPaymentMethod,
      dailyTrends,
      topPartners,
      statusDistribution,
    };
  }

  // Export and Download
  async createExport(
    exportDto: TransactionExportDto,
    createdBy: string,
  ): Promise<string> {
    const exportEntity = this.exportRepository.create({
      exportType: exportDto.exportType,
      format: exportDto.format,
      filters: exportDto.filters,
      parameters: {
        fields: exportDto.fields,
        includeAuditTrail: exportDto.includeAuditTrail,
        includeMetadata: exportDto.includeMetadata,
      },
      createdBy,
    });

    const savedExport = await this.exportRepository.save(exportEntity);

    // Process export asynchronously
    this.processExport(savedExport.id).catch((error) => {
      console.error(`Export processing failed for ${savedExport.id}:`, error);
    });

    return savedExport.id;
  }

  async getExportStatus(exportId: string): Promise<TransactionExportEntity> {
    const exportEntity = await this.exportRepository.findOne({
      where: { id: exportId },
    });
    if (!exportEntity) {
      throw new NotFoundException(`Export with ID ${exportId} not found`);
    }
    return exportEntity;
  }

  async downloadExport(
    exportId: string,
  ): Promise<{ filePath: string; fileName: string }> {
    const exportEntity = await this.getExportStatus(exportId);
    if (exportEntity.status !== 'completed') {
      throw new BadRequestException('Export is not ready for download');
    }
    return {
      filePath: exportEntity.filePath,
      fileName: exportEntity.fileName,
    };
  }

  // Report Generation
  async generateReport(
    reportDto: TransactionReportDto,
    createdBy: string,
  ): Promise<string> {
    const reportEntity = this.reportRepository.create({
      reportType: reportDto.reportType,
      reportName: this.generateReportName(
        reportDto.reportType,
        reportDto.dateFrom,
        reportDto.dateTo,
      ),
      format: reportDto.format,
      dateFrom: reportDto.dateFrom,
      dateTo: reportDto.dateTo,
      filters: {
        userIds: reportDto.userIds,
        partnerIds: reportDto.partnerIds,
      },
      parameters: reportDto.parameters,
      createdBy,
    });

    const savedReport = await this.reportRepository.save(reportEntity);

    // Process report asynchronously
    this.processReport(savedReport.id).catch((error) => {
      console.error(`Report processing failed for ${savedReport.id}:`, error);
    });

    return savedReport.id;
  }

  async getReportStatus(reportId: string): Promise<TransactionReportEntity> {
    const reportEntity = await this.reportRepository.findOne({
      where: { id: reportId },
    });
    if (!reportEntity) {
      throw new NotFoundException(`Report with ID ${reportId} not found`);
    }
    return reportEntity;
  }

  async downloadReport(
    reportId: string,
  ): Promise<{ filePath: string; fileName: string }> {
    const reportEntity = await this.getReportStatus(reportId);
    if (reportEntity.status !== 'completed') {
      throw new BadRequestException('Report is not ready for download');
    }
    return {
      filePath: reportEntity.filePath,
      fileName: reportEntity.fileName,
    };
  }

  // Settings Management
  async getSettings(): Promise<TransactionSettingsEntity> {
    let settings = await this.settingsRepository.findOne({ where: {} });
    if (!settings) {
      settings = this.settingsRepository.create({});
      settings = await this.settingsRepository.save(settings);
    }
    return settings;
  }

  async updateSettings(
    settingsDto: TransactionSettingsDto,
    updatedBy?: string,
  ): Promise<TransactionSettingsEntity> {
    const settings = await this.getSettings();
    Object.assign(settings, settingsDto, { updatedBy });
    return this.settingsRepository.save(settings);
  }

  // Helper Methods
  private async validateRelatedEntities(
    dto: CreateTransactionDto,
  ): Promise<void> {
    if (dto.userId) {
      const user = await this.userRepository.findOne({
        where: { id: dto.userId },
      });
      if (!user) {
        throw new NotFoundException(`User with ID ${dto.userId} not found`);
      }
    }

    if (dto.partnerId) {
      const partner = await this.userRepository.findOne({
        where: { id: dto.partnerId },
      });
      if (!partner) {
        throw new NotFoundException(
          `Partner with ID ${dto.partnerId} not found`,
        );
      }
    }

    if (dto.bookingId) {
      const booking = await this.bookingRepository.findOne({
        where: { id: dto.bookingId },
      });
      if (!booking) {
        throw new NotFoundException(
          `Booking with ID ${dto.bookingId} not found`,
        );
      }
    }
  }

  private applyTransactionFilters(
    queryBuilder: SelectQueryBuilder<TransactionEntity>,
    filters?: any,
  ): void {
    if (!filters) return;

    if (filters.status?.length) {
      queryBuilder.andWhere('transaction.status IN (:...statuses)', {
        statuses: filters.status,
      });
    }
    if (filters.type?.length) {
      queryBuilder.andWhere('transaction.type IN (:...types)', {
        types: filters.type,
      });
    }
    if (filters.category?.length) {
      queryBuilder.andWhere('transaction.category IN (:...categories)', {
        categories: filters.category,
      });
    }
    if (filters.userId) {
      queryBuilder.andWhere('transaction.userId = :userId', {
        userId: filters.userId,
      });
    }
    if (filters.partnerId) {
      queryBuilder.andWhere('transaction.partnerId = :partnerId', {
        partnerId: filters.partnerId,
      });
    }
    if (filters.bookingId) {
      queryBuilder.andWhere('transaction.bookingId = :bookingId', {
        bookingId: filters.bookingId,
      });
    }
    if (filters.dateFrom && filters.dateTo) {
      queryBuilder.andWhere(
        'transaction.transactionDate BETWEEN :dateFrom AND :dateTo',
        {
          dateFrom: filters.dateFrom,
          dateTo: filters.dateTo,
        },
      );
    }
    if (filters.minAmount !== undefined) {
      queryBuilder.andWhere('transaction.amount >= :minAmount', {
        minAmount: filters.minAmount,
      });
    }
    if (filters.maxAmount !== undefined) {
      queryBuilder.andWhere('transaction.amount <= :maxAmount', {
        maxAmount: filters.maxAmount,
      });
    }
    if (filters.search) {
      queryBuilder.andWhere(
        '(transaction.description ILIKE :search OR transaction.transactionReference ILIKE :search OR transaction.bankReference ILIKE :search)',
        { search: `%${filters.search}%` },
      );
    }
  }

  private async createAuditTrail(
    transactionId: string,
    action: string,
    oldValues: any,
    newValues: any,
    reason: string,
    createdBy?: string,
  ): Promise<void> {
    const auditTrail = this.auditTrailRepository.create({
      transactionId,
      action,
      oldValues,
      newValues,
      reason,
      createdBy,
    });
    await this.auditTrailRepository.save(auditTrail);
  }

  private mapToResponseDto(
    transaction: TransactionEntity,
  ): TransactionResponseDto {
    return {
      id: transaction.id,
      transactionReference: transaction.transactionReference,
      type: transaction.type,
      category: transaction.category,
      status: transaction.status,
      amount: Number(transaction.amount),
      currency: transaction.currency,
      description: transaction.description,
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
      booking: transaction.booking
        ? {
            id: transaction.booking.id,
            spaceId: transaction.booking.spaceOption?.space?.id,
            spaceName:
              transaction.booking.spaceOption?.space?.name || 'Unknown Space',
            startDate: transaction.booking.startDateTime,
            endDate: transaction.booking.endDateTime,
          }
        : undefined,
      paymentMethod: transaction.paymentMethod,
      paymentGatewayReference: transaction.paymentGatewayReference,
      bankReference: transaction.bankReference,
      externalTransactionId: transaction.externalTransactionId,
      transactionDate: transaction.transactionDate,
      processingDate: transaction.processingDate,
      completionDate: transaction.completionDate,
      reconciliationDate: transaction.reconciliationDate,
      notes: transaction.notes,
      reconciliationNotes: transaction.reconciliationNotes,
      metadata: transaction.metadata,
      createdAt: transaction.createdAt,
      updatedAt: transaction.updatedAt,
      createdBy: transaction.createdBy,
      updatedBy: transaction.updatedBy,
    };
  }

  private async reconcileTransaction(
    transactionId: string,
    data: any,
    reconciledBy?: string,
  ): Promise<void> {
    const transaction = await this.transactionRepository.findOne({
      where: { id: transactionId },
    });
    if (!transaction) {
      throw new NotFoundException(
        `Transaction with ID ${transactionId} not found`,
      );
    }

    transaction.reconciliationDate = data?.reconciliationDate || new Date();
    transaction.reconciliationNotes = data?.notes || 'Bulk reconciliation';
    transaction.bankReference =
      data?.bankReference || transaction.bankReference;
    transaction.updatedBy = reconciledBy;

    await this.transactionRepository.save(transaction);

    await this.createAuditTrail(
      transactionId,
      'RECONCILE',
      null,
      { reconciliationDate: transaction.reconciliationDate },
      'Transaction reconciled',
      reconciledBy,
    );
  }

  private calculateDailyTrends(
    transactions: TransactionEntity[],
    dateFrom?: Date,
    dateTo?: Date,
  ): Array<{
    date: string;
    volume: number;
    count: number;
    credits: number;
    debits: number;
  }> {
    const endDate = dateTo || new Date();
    const startDate =
      dateFrom || new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
    const trends = [];

    for (
      let d = new Date(startDate);
      d <= endDate;
      d.setDate(d.getDate() + 1)
    ) {
      const dateStr = d.toISOString().split('T')[0];
      const dayTransactions = transactions.filter(
        (t) => t.transactionDate.toISOString().split('T')[0] === dateStr,
      );

      const volume = dayTransactions.reduce(
        (sum, t) => sum + Number(t.amount),
        0,
      );
      const credits = dayTransactions
        .filter((t) => t.type === TransactionType.CREDIT)
        .reduce((sum, t) => sum + Number(t.amount), 0);
      const debits = dayTransactions
        .filter((t) => t.type === TransactionType.DEBIT)
        .reduce((sum, t) => sum + Number(t.amount), 0);

      trends.push({
        date: dateStr,
        volume,
        count: dayTransactions.length,
        credits,
        debits,
      });
    }

    return trends;
  }

  private async getTopPartnersByVolume(
    transactions: TransactionEntity[],
  ): Promise<
    Array<{
      partnerId: string;
      partnerName: string;
      volume: number;
      transactionCount: number;
    }>
  > {
    const partnerMap = new Map();

    for (const transaction of transactions) {
      if (transaction.partnerId) {
        const existing = partnerMap.get(transaction.partnerId) || {
          partnerId: transaction.partnerId,
          partnerName:
            `${transaction.partner?.firstName || ''} ${transaction.partner?.lastName || ''}`.trim() ||
            transaction.partner?.username ||
            'Unknown Partner',
          volume: 0,
          transactionCount: 0,
        };
        existing.volume += Number(transaction.amount);
        existing.transactionCount += 1;
        partnerMap.set(transaction.partnerId, existing);
      }
    }

    return Array.from(partnerMap.values())
      .sort((a, b) => b.volume - a.volume)
      .slice(0, 10);
  }

  private async processExport(exportId: string): Promise<void> {
    const exportEntity = await this.exportRepository.findOne({
      where: { id: exportId },
    });
    if (!exportEntity) return;

    try {
      exportEntity.status = 'processing';
      exportEntity.startedAt = new Date();
      await this.exportRepository.save(exportEntity);

      // Get transactions based on filters
      const queryBuilder = this.transactionRepository
        .createQueryBuilder('transaction')
        .leftJoinAndSelect('transaction.user', 'user')
        .leftJoinAndSelect('transaction.partner', 'partner')
        .leftJoinAndSelect('transaction.booking', 'booking');

      this.applyTransactionFilters(queryBuilder, exportEntity.filters);
      const transactions = await queryBuilder.getMany();

      // Generate file
      const fileName = `transactions_export_${Date.now()}.${exportEntity.format}`;
      const filePath = path.join(process.cwd(), 'uploads', 'exports', fileName);

      // Ensure directory exists
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      if (exportEntity.format === ExportFormat.CSV) {
        await this.generateCSVExport(
          transactions,
          filePath,
          exportEntity.parameters,
        );
      }
      // Add other format handlers as needed

      const stats = fs.statSync(filePath);
      exportEntity.status = 'completed';
      exportEntity.fileName = fileName;
      exportEntity.filePath = filePath;
      exportEntity.fileSize = stats.size;
      exportEntity.recordCount = transactions.length;
      exportEntity.completedAt = new Date();
    } catch (error) {
      exportEntity.status = 'failed';
      exportEntity.errorMessage = error.message;
    }

    await this.exportRepository.save(exportEntity);
  }

  private async generateCSVExport(
    transactions: TransactionEntity[],
    filePath: string,
    parameters: any,
  ): Promise<void> {
    const csvWriter = csv.createObjectCsvWriter({
      path: filePath,
      header: [
        { id: 'transactionReference', title: 'Transaction Reference' },
        { id: 'type', title: 'Type' },
        { id: 'category', title: 'Category' },
        { id: 'status', title: 'Status' },
        { id: 'amount', title: 'Amount' },
        { id: 'currency', title: 'Currency' },
        { id: 'description', title: 'Description' },
        { id: 'transactionDate', title: 'Transaction Date' },
        { id: 'userName', title: 'User Name' },
        { id: 'partnerName', title: 'Partner Name' },
      ],
    });

    const records = transactions.map((transaction) => ({
      transactionReference: transaction.transactionReference,
      type: transaction.type,
      category: transaction.category,
      status: transaction.status,
      amount: transaction.amount,
      currency: transaction.currency,
      description: transaction.description,
      transactionDate: transaction.transactionDate.toISOString(),
      userName:
        `${transaction.user?.firstName || ''} ${transaction.user?.lastName || ''}`.trim() ||
        transaction.user?.username ||
        '',
      partnerName:
        `${transaction.partner?.firstName || ''} ${transaction.partner?.lastName || ''}`.trim() ||
        transaction.partner?.username ||
        '',
    }));

    await csvWriter.writeRecords(records);
  }

  private async processReport(reportId: string): Promise<void> {
    const reportEntity = await this.reportRepository.findOne({
      where: { id: reportId },
    });
    if (!reportEntity) return;

    try {
      reportEntity.status = 'processing';
      reportEntity.startedAt = new Date();
      await this.reportRepository.save(reportEntity);

      // Generate report data based on type
      let reportData: any;
      switch (reportEntity.reportType) {
        case ReportType.TRANSACTION_SUMMARY:
          reportData =
            await this.generateTransactionSummaryReport(reportEntity);
          break;
        case ReportType.CASH_FLOW:
          reportData = await this.generateCashFlowReport(reportEntity);
          break;
        // Add other report types as needed
        default:
          throw new Error(
            `Unsupported report type: ${reportEntity.reportType}`,
          );
      }

      reportEntity.reportData = reportData;
      reportEntity.status = 'completed';
      reportEntity.completedAt = new Date();
    } catch (error) {
      reportEntity.status = 'failed';
      reportEntity.errorMessage = error.message;
    }

    await this.reportRepository.save(reportEntity);
  }

  private async generateTransactionSummaryReport(
    reportEntity: TransactionReportEntity,
  ): Promise<any> {
    const analytics = await this.getTransactionAnalytics(
      reportEntity.dateFrom,
      reportEntity.dateTo,
      reportEntity.filters,
    );
    return analytics;
  }

  private async generateCashFlowReport(
    reportEntity: TransactionReportEntity,
  ): Promise<any> {
    // Implement cash flow report logic
    return {
      reportType: 'cash_flow',
      dateRange: reportEntity.getDateRange(),
      // Add cash flow specific data
    };
  }

  private generateReportName(
    reportType: ReportType,
    dateFrom?: Date,
    dateTo?: Date,
  ): string {
    const typeNames = {
      [ReportType.TRANSACTION_SUMMARY]: 'Transaction Summary',
      [ReportType.CASH_FLOW]: 'Cash Flow Report',
      [ReportType.RECONCILIATION]: 'Reconciliation Report',
      [ReportType.TAX_REPORT]: 'Tax Report',
      [ReportType.PARTNER_STATEMENT]: 'Partner Statement',
      [ReportType.CUSTOMER_STATEMENT]: 'Customer Statement',
      [ReportType.AUDIT_TRAIL]: 'Audit Trail Report',
    };

    const typeName = typeNames[reportType] || 'Report';
    const dateRange =
      dateFrom && dateTo
        ? `${dateFrom.toISOString().split('T')[0]} to ${dateTo.toISOString().split('T')[0]}`
        : 'All Time';

    return `${typeName} - ${dateRange}`;
  }

  // Analytics Methods
  async getAnalytics(
    dateFrom?: Date,
    dateTo?: Date,
    filters?: any,
  ): Promise<TransactionAnalyticsDto> {
    const analytics = await this.getTransactionAnalytics(
      dateFrom,
      dateTo,
      filters,
    );
    return analytics;
  }

  async getCashFlowAnalytics(
    period: 'daily' | 'weekly' | 'monthly' = 'monthly',
    dateFrom?: Date,
    dateTo?: Date,
  ): Promise<any> {
    // Implement cash flow analytics logic
    return {
      period,
      dateRange: { from: dateFrom, to: dateTo },
      cashFlow: [],
    };
  }

  async exportTransactions(
    exportDto: TransactionExportDto,
    createdBy: string,
  ): Promise<any> {
    // Create export entity
    const exportEntity = this.exportRepository.create({
      fileName: `transactions_export_${Date.now()}`,
      format: exportDto.format,
      filters: exportDto.filters,
      createdBy,
      status: 'pending',
    });

    const savedExport = await this.exportRepository.save(exportEntity);

    // Process export in background
    setTimeout(() => this.processExport(savedExport.id), 1000);

    return savedExport;
  }
}
