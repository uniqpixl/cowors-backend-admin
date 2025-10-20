import { UserEntity } from '@/auth/entities/user.entity';
import { BookingEntity } from '@/database/entities/booking.entity';
import { EntityType, IdGeneratorService } from '@/utils/id-generator.service';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Between,
  DataSource,
  In,
  LessThan,
  MoreThan,
  QueryRunner,
  Repository,
} from 'typeorm';
import {
  BankAccountResponseDto,
  BankAccountStatus,
  BulkOperationResponseDto,
  BulkOperationType,
  BulkPayoutOperationDto,
  CreateBankAccountDto,
  CreatePayoutRequestDto,
  CreateWalletTransactionDto,
  ExportPayoutsDto,
  ExportResponseDto,
  ExportStatus,
  GetPayoutRequestsDto,
  WalletTransactionType as PartnerWalletTransactionType,
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
import { WalletTransactionType } from './dto/payout.dto';
import {
  BankAccountEntity,
  PartnerWalletEntity,
  PayoutAuditTrailEntity,
  PayoutExportEntity,
  PayoutReportEntity,
  PayoutRequestEntity,
  PayoutSettingsEntity,
  WalletTransactionEntity,
} from './entities/partner-payout.entity';

@Injectable()
export class PartnerPayoutService {
  constructor(
    @InjectRepository(PayoutRequestEntity)
    private payoutRequestRepository: Repository<PayoutRequestEntity>,
    @InjectRepository(BankAccountEntity)
    private bankAccountRepository: Repository<BankAccountEntity>,
    @InjectRepository(PartnerWalletEntity)
    private walletRepository: Repository<PartnerWalletEntity>,
    @InjectRepository(WalletTransactionEntity)
    private walletTransactionRepository: Repository<WalletTransactionEntity>,
    @InjectRepository(PayoutAuditTrailEntity)
    private auditTrailRepository: Repository<PayoutAuditTrailEntity>,
    @InjectRepository(PayoutExportEntity)
    private exportRepository: Repository<PayoutExportEntity>,
    @InjectRepository(PayoutReportEntity)
    private reportRepository: Repository<PayoutReportEntity>,
    @InjectRepository(PayoutSettingsEntity)
    private settingsRepository: Repository<PayoutSettingsEntity>,
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
    @InjectRepository(BookingEntity)
    private bookingRepository: Repository<BookingEntity>,
    private dataSource: DataSource,
    private idGeneratorService: IdGeneratorService,
  ) {}

  // Payout Request Management
  async createPayoutRequest(
    createDto: CreatePayoutRequestDto,
    userId: string,
  ): Promise<PayoutRequestResponseDto> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Validate partner exists
      const partner = await this.userRepository.findOne({
        where: { id: createDto.partnerId },
      });
      if (!partner) {
        throw new NotFoundException('Partner not found');
      }

      // Validate bank account if provided
      if (createDto.bankAccountId) {
        const bankAccount = await this.bankAccountRepository.findOne({
          where: {
            id: createDto.bankAccountId,
            partnerId: createDto.partnerId,
            status: BankAccountStatus.VERIFIED,
          },
        });
        if (!bankAccount) {
          throw new BadRequestException('Invalid or unverified bank account');
        }
      }

      // Check wallet balance for withdrawal type
      if (createDto.type === PayoutType.WITHDRAWAL) {
        const wallet = await this.getOrCreateWallet(createDto.partnerId);
        if (!wallet.canDebit(createDto.amount)) {
          throw new BadRequestException('Insufficient wallet balance');
        }
      }

      // Get settings for validation
      const settings = await this.getSettings();
      if (createDto.amount < settings.minPayoutAmount) {
        throw new BadRequestException(
          `Minimum payout amount is ${settings.minPayoutAmount}`,
        );
      }
      if (createDto.amount > settings.maxPayoutAmount) {
        throw new BadRequestException(
          `Maximum payout amount is ${settings.maxPayoutAmount}`,
        );
      }

      // Create payout request
      const payoutRequest = this.payoutRequestRepository.create({
        ...createDto,
        createdBy: userId,
        status:
          createDto.amount <= settings.autoApproveThreshold
            ? PayoutStatus.APPROVED
            : PayoutStatus.PENDING,
      });

      const savedRequest = await queryRunner.manager.save(payoutRequest);

      // Create audit trail
      await this.createAuditTrail(
        savedRequest.id,
        'CREATED',
        null,
        savedRequest,
        userId,
        queryRunner,
      );

      // If auto-approved, process immediately
      if (savedRequest.status === PayoutStatus.APPROVED) {
        await this.createAuditTrail(
          savedRequest.id,
          'AUTO_APPROVED',
          { status: PayoutStatus.PENDING },
          { status: PayoutStatus.APPROVED },
          userId,
          queryRunner,
        );
      }

      await queryRunner.commitTransaction();
      return this.mapToPayoutResponseDto(savedRequest);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async getPayoutRequests(filters: GetPayoutRequestsDto): Promise<{
    data: PayoutRequestResponseDto[];
    total: number;
    page: number;
    limit: number;
  }> {
    const queryBuilder = this.payoutRequestRepository
      .createQueryBuilder('payout')
      .leftJoinAndSelect('payout.partner', 'partner')
      .leftJoinAndSelect('payout.bankAccount', 'bankAccount')
      .leftJoinAndSelect('payout.creator', 'creator')
      .leftJoinAndSelect('payout.approver', 'approver');

    // Apply filters
    if (filters.search) {
      queryBuilder.andWhere(
        '(partner.name ILIKE :search OR partner.email ILIKE :search OR payout.description ILIKE :search OR payout.referenceId ILIKE :search)',
        { search: `%${filters.search}%` },
      );
    }

    if (filters.status) {
      queryBuilder.andWhere('payout.status = :status', {
        status: filters.status,
      });
    }

    if (filters.type) {
      queryBuilder.andWhere('payout.type = :type', { type: filters.type });
    }

    if (filters.partnerId) {
      queryBuilder.andWhere('payout.partnerId = :partnerId', {
        partnerId: filters.partnerId,
      });
    }

    if (filters.startDate) {
      queryBuilder.andWhere('payout.createdAt >= :startDate', {
        startDate: filters.startDate,
      });
    }

    if (filters.endDate) {
      queryBuilder.andWhere('payout.createdAt <= :endDate', {
        endDate: filters.endDate,
      });
    }

    if (filters.minAmount) {
      queryBuilder.andWhere('payout.amount >= :minAmount', {
        minAmount: filters.minAmount,
      });
    }

    if (filters.maxAmount) {
      queryBuilder.andWhere('payout.amount <= :maxAmount', {
        maxAmount: filters.maxAmount,
      });
    }

    // Apply sorting
    queryBuilder.orderBy(`payout.${filters.sortBy}`, filters.sortOrder);

    // Apply pagination
    const total = await queryBuilder.getCount();
    const data = await queryBuilder
      .skip((filters.page - 1) * filters.limit)
      .take(filters.limit)
      .getMany();

    return {
      data: data.map(this.mapToPayoutResponseDto),
      total,
      page: filters.page,
      limit: filters.limit,
    };
  }

  async getPayoutRequestById(id: string): Promise<PayoutRequestResponseDto> {
    const payoutRequest = await this.payoutRequestRepository.findOne({
      where: { id },
      relations: ['partner', 'bankAccount', 'creator', 'approver', 'rejector'],
    });

    if (!payoutRequest) {
      throw new NotFoundException('Payout request not found');
    }

    return this.mapToPayoutResponseDto(payoutRequest);
  }

  async updatePayoutRequest(
    id: string,
    updateDto: UpdatePayoutRequestDto,
    userId: string,
  ): Promise<PayoutRequestResponseDto> {
    const payoutRequest = await this.payoutRequestRepository.findOne({
      where: { id },
    });
    if (!payoutRequest) {
      throw new NotFoundException('Payout request not found');
    }

    if (payoutRequest.status !== PayoutStatus.PENDING) {
      throw new BadRequestException('Can only update pending payout requests');
    }

    const oldValues = { ...payoutRequest };
    Object.assign(payoutRequest, updateDto, { updatedBy: userId });

    const updatedRequest =
      await this.payoutRequestRepository.save(payoutRequest);

    // Create audit trail
    await this.createAuditTrail(
      id,
      'UPDATED',
      oldValues,
      updatedRequest,
      userId,
    );

    return this.mapToPayoutResponseDto(updatedRequest);
  }

  async deletePayoutRequest(id: string, userId: string): Promise<void> {
    const payoutRequest = await this.payoutRequestRepository.findOne({
      where: { id },
    });
    if (!payoutRequest) {
      throw new NotFoundException('Payout request not found');
    }

    if (
      ![PayoutStatus.PENDING, PayoutStatus.REJECTED].includes(
        payoutRequest.status,
      )
    ) {
      throw new BadRequestException(
        'Can only delete pending or rejected payout requests',
      );
    }

    await this.createAuditTrail(id, 'DELETED', payoutRequest, null, userId);
    await this.payoutRequestRepository.remove(payoutRequest);
  }

  // Payout Status Management
  async approvePayoutRequest(
    id: string,
    userId: string,
  ): Promise<PayoutRequestResponseDto> {
    return this.updatePayoutStatus(id, PayoutStatus.APPROVED, userId);
  }

  async rejectPayoutRequest(
    id: string,
    reason: string,
    userId: string,
  ): Promise<PayoutRequestResponseDto> {
    const payoutRequest = await this.payoutRequestRepository.findOne({
      where: { id },
    });
    if (!payoutRequest) {
      throw new NotFoundException('Payout request not found');
    }

    if (!payoutRequest.canBeRejected()) {
      throw new BadRequestException('Payout request cannot be rejected');
    }

    const oldValues = { ...payoutRequest };
    payoutRequest.status = PayoutStatus.REJECTED;
    payoutRequest.rejectionReason = reason;
    payoutRequest.rejectedBy = userId;
    payoutRequest.rejectedAt = new Date();
    payoutRequest.updatedBy = userId;

    const updatedRequest =
      await this.payoutRequestRepository.save(payoutRequest);

    await this.createAuditTrail(
      id,
      'REJECTED',
      oldValues,
      updatedRequest,
      userId,
      null,
      reason,
    );

    return this.mapToPayoutResponseDto(updatedRequest);
  }

  async processPayoutRequest(
    id: string,
    userId: string,
  ): Promise<PayoutRequestResponseDto> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const payoutRequest = await this.payoutRequestRepository.findOne({
        where: { id },
      });
      if (!payoutRequest) {
        throw new NotFoundException('Payout request not found');
      }

      if (!payoutRequest.canBeProcessed()) {
        throw new BadRequestException('Payout request cannot be processed');
      }

      const oldValues = { ...payoutRequest };
      payoutRequest.status = PayoutStatus.PROCESSING;
      payoutRequest.updatedBy = userId;

      await queryRunner.manager.save(payoutRequest);

      // Simulate payment processing (integrate with actual payment gateway)
      const success = await this.processPayment(payoutRequest);

      if (success) {
        payoutRequest.status = PayoutStatus.COMPLETED;
        payoutRequest.processedDate = new Date();
        payoutRequest.transactionId = this.generateTransactionId();

        // Update wallet for withdrawal type
        if (payoutRequest.type === PayoutType.WITHDRAWAL) {
          await this.debitWallet(
            payoutRequest.partnerId,
            payoutRequest.amount,
            'Payout withdrawal',
            payoutRequest.id,
            userId,
            queryRunner,
          );
        }
      } else {
        payoutRequest.status = PayoutStatus.FAILED;
        payoutRequest.failureReason = 'Payment processing failed';
        payoutRequest.retryCount += 1;

        if (payoutRequest.canBeRetried()) {
          payoutRequest.nextRetryAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
        }
      }

      const updatedRequest = await queryRunner.manager.save(payoutRequest);

      await this.createAuditTrail(
        id,
        success ? 'COMPLETED' : 'FAILED',
        oldValues,
        updatedRequest,
        userId,
        queryRunner,
      );

      await queryRunner.commitTransaction();
      return this.mapToPayoutResponseDto(updatedRequest);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async cancelPayoutRequest(
    id: string,
    userId: string,
  ): Promise<PayoutRequestResponseDto> {
    return this.updatePayoutStatus(id, PayoutStatus.CANCELLED, userId);
  }

  // Bank Account Management
  async createBankAccount(
    createDto: CreateBankAccountDto,
    userId: string,
  ): Promise<BankAccountResponseDto> {
    // Check if partner exists
    const partner = await this.userRepository.findOne({
      where: { id: createDto.partnerId },
    });
    if (!partner) {
      throw new NotFoundException('Partner not found');
    }

    // Check for duplicate account number
    const existingAccount = await this.bankAccountRepository.findOne({
      where: {
        partnerId: createDto.partnerId,
        accountNumber: createDto.accountNumber,
      },
    });
    if (existingAccount) {
      throw new ConflictException('Bank account already exists');
    }

    // If setting as primary, unset other primary accounts
    if (createDto.isPrimary) {
      await this.bankAccountRepository.update(
        { partnerId: createDto.partnerId, isPrimary: true },
        { isPrimary: false },
      );
    }

    const bankAccount = this.bankAccountRepository.create({
      ...createDto,
      accountNumberEncrypted: this.encryptAccountNumber(
        createDto.accountNumber,
      ),
    });

    const savedAccount = await this.bankAccountRepository.save(bankAccount);
    return this.mapToBankAccountResponseDto(savedAccount);
  }

  async getBankAccounts(partnerId: string): Promise<BankAccountResponseDto[]> {
    const accounts = await this.bankAccountRepository.find({
      where: { partnerId },
      order: { isPrimary: 'DESC', createdAt: 'DESC' },
    });

    return accounts.map(this.mapToBankAccountResponseDto);
  }

  async getBankAccountById(id: string): Promise<BankAccountResponseDto> {
    const account = await this.bankAccountRepository.findOne({ where: { id } });
    if (!account) {
      throw new NotFoundException('Bank account not found');
    }

    return this.mapToBankAccountResponseDto(account);
  }

  async updateBankAccount(
    id: string,
    updateDto: UpdateBankAccountDto,
    userId: string,
  ): Promise<BankAccountResponseDto> {
    const account = await this.bankAccountRepository.findOne({ where: { id } });
    if (!account) {
      throw new NotFoundException('Bank account not found');
    }

    if (account.status !== BankAccountStatus.PENDING) {
      throw new BadRequestException('Can only update pending bank accounts');
    }

    // If setting as primary, unset other primary accounts
    if (updateDto.isPrimary) {
      await this.bankAccountRepository.update(
        { partnerId: account.partnerId, isPrimary: true },
        { isPrimary: false },
      );
    }

    Object.assign(account, updateDto);
    if (updateDto.accountNumber) {
      account.accountNumberEncrypted = this.encryptAccountNumber(
        updateDto.accountNumber,
      );
    }

    const updatedAccount = await this.bankAccountRepository.save(account);
    return this.mapToBankAccountResponseDto(updatedAccount);
  }

  async deleteBankAccount(id: string): Promise<void> {
    const account = await this.bankAccountRepository.findOne({ where: { id } });
    if (!account) {
      throw new NotFoundException('Bank account not found');
    }

    // Check if account is being used in pending payouts
    const pendingPayouts = await this.payoutRequestRepository.count({
      where: {
        bankAccountId: id,
        status: In([
          PayoutStatus.PENDING,
          PayoutStatus.APPROVED,
          PayoutStatus.PROCESSING,
        ]),
      },
    });

    if (pendingPayouts > 0) {
      throw new BadRequestException(
        'Cannot delete bank account with pending payouts',
      );
    }

    await this.bankAccountRepository.remove(account);
  }

  async verifyBankAccount(
    id: string,
    userId: string,
  ): Promise<BankAccountResponseDto> {
    const account = await this.bankAccountRepository.findOne({ where: { id } });
    if (!account) {
      throw new NotFoundException('Bank account not found');
    }

    if (!account.canBeVerified()) {
      throw new BadRequestException('Bank account cannot be verified');
    }

    account.status = BankAccountStatus.VERIFIED;
    account.verifiedAt = new Date();
    account.verifiedBy = userId;

    const updatedAccount = await this.bankAccountRepository.save(account);
    return this.mapToBankAccountResponseDto(updatedAccount);
  }

  // Wallet Management
  async getWallet(partnerId: string): Promise<WalletResponseDto> {
    const wallet = await this.getOrCreateWallet(partnerId);
    return this.mapToWalletResponseDto(wallet);
  }

  async getWalletTransactions(
    partnerId: string,
    page: number = 1,
    limit: number = 10,
  ): Promise<{ data: WalletTransactionResponseDto[]; total: number }> {
    const wallet = await this.getOrCreateWallet(partnerId);

    const [transactions, total] =
      await this.walletTransactionRepository.findAndCount({
        where: { walletId: wallet.id },
        relations: ['creator'],
        order: { createdAt: 'DESC' },
        skip: (page - 1) * limit,
        take: limit,
      });

    return {
      data: transactions.map(this.mapToWalletTransactionResponseDto),
      total,
    };
  }

  async createWalletTransaction(
    partnerId: string,
    createDto: CreateWalletTransactionDto,
    userId: string,
  ): Promise<WalletTransactionResponseDto> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const wallet = await this.getOrCreateWallet(partnerId);

      // Validate transaction
      if (
        (createDto.type === PartnerWalletTransactionType.DEBIT ||
          createDto.type === PartnerWalletTransactionType.WITHDRAWAL) &&
        !wallet.canDebit(createDto.amount)
      ) {
        throw new BadRequestException('Insufficient wallet balance');
      }

      const balanceBefore = wallet.availableBalance;
      let balanceAfter = balanceBefore;

      // Update wallet balance
      switch (createDto.type) {
        case PartnerWalletTransactionType.CREDIT:
          balanceAfter = balanceBefore + createDto.amount;
          wallet.availableBalance = balanceAfter;
          break;
        case PartnerWalletTransactionType.DEBIT:
          balanceAfter = balanceBefore - createDto.amount;
          wallet.availableBalance = balanceAfter;
          break;
        case PartnerWalletTransactionType.HOLD:
          wallet.pendingBalance += createDto.amount;
          wallet.availableBalance -= createDto.amount;
          balanceAfter = wallet.availableBalance;
          break;
        case PartnerWalletTransactionType.RELEASE:
          wallet.pendingBalance -= createDto.amount;
          wallet.availableBalance += createDto.amount;
          balanceAfter = wallet.availableBalance;
          break;
        case PartnerWalletTransactionType.TRANSFER:
          // For transfers, this could be either credit or debit depending on context
          balanceAfter = balanceBefore + createDto.amount;
          wallet.availableBalance = balanceAfter;
          break;
        case PartnerWalletTransactionType.WITHDRAWAL:
          balanceAfter = balanceBefore - createDto.amount;
          wallet.availableBalance = balanceAfter;
          break;
      }

      // Update total balance
      wallet.updateBalances();
      wallet.lastTransactionDate = new Date();
      await queryRunner.manager.save(wallet);

      // Map PartnerWalletTransactionType to WalletTransactionType
      const typeMapping = {
        [PartnerWalletTransactionType.CREDIT]: WalletTransactionType.CREDIT,
        [PartnerWalletTransactionType.DEBIT]: WalletTransactionType.DEBIT,
        [PartnerWalletTransactionType.HOLD]: WalletTransactionType.CREDIT,
        [PartnerWalletTransactionType.RELEASE]: WalletTransactionType.CREDIT,
        [PartnerWalletTransactionType.TRANSFER]: WalletTransactionType.CREDIT,
        [PartnerWalletTransactionType.WITHDRAWAL]: WalletTransactionType.DEBIT,
      };

      // Create transaction record
      const transaction = this.walletTransactionRepository.create({
        walletId: wallet.id,
        partnerId,
        type: typeMapping[createDto.type] || WalletTransactionType.CREDIT,
        amount: createDto.amount,
        currency: createDto.currency,
        description: createDto.description,
        referenceId: createDto.referenceId,
        metadata: createDto.metadata,
        balanceBefore,
        balanceAfter,
        createdBy: userId,
      });

      const savedTransaction = await queryRunner.manager.save(
        WalletTransactionEntity,
        transaction,
      );

      await queryRunner.commitTransaction();
      return this.mapToWalletTransactionResponseDto(
        savedTransaction as WalletTransactionEntity,
      );
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  // Bulk Operations
  async bulkPayoutOperation(
    bulkDto: BulkPayoutOperationDto,
    userId: string,
  ): Promise<BulkOperationResponseDto> {
    const operationId = this.generateOperationId();
    const startedAt = new Date();
    let successfulItems = 0;
    let failedItems = 0;
    const errors: Array<{ payoutId: string; error: string }> = [];

    for (const payoutId of bulkDto.payoutIds) {
      try {
        switch (bulkDto.operation) {
          case BulkOperationType.APPROVE:
            await this.approvePayoutRequest(payoutId, userId);
            break;
          case BulkOperationType.REJECT:
            await this.rejectPayoutRequest(
              payoutId,
              bulkDto.reason || 'Bulk rejection',
              userId,
            );
            break;
          case BulkOperationType.PROCESS:
            await this.processPayoutRequest(payoutId, userId);
            break;
          case BulkOperationType.CANCEL:
            await this.cancelPayoutRequest(payoutId, userId);
            break;
          case BulkOperationType.DELETE:
            await this.deletePayoutRequest(payoutId, userId);
            break;
        }
        successfulItems++;
      } catch (error) {
        failedItems++;
        errors.push({ payoutId, error: error.message });
      }
    }

    return {
      operationId,
      operation: bulkDto.operation,
      totalItems: bulkDto.payoutIds.length,
      successfulItems,
      failedItems,
      status: failedItems === 0 ? 'completed' : 'partial',
      errors: errors.length > 0 ? errors : undefined,
      startedAt,
      completedAt: new Date(),
    };
  }

  // Analytics and Reporting
  async getPayoutAnalytics(
    filters: PayoutAnalyticsDto,
  ): Promise<PayoutAnalyticsResponseDto> {
    const startDate = filters.startDate
      ? new Date(filters.startDate)
      : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const endDate = filters.endDate ? new Date(filters.endDate) : new Date();

    const queryBuilder = this.payoutRequestRepository
      .createQueryBuilder('payout')
      .leftJoin('payout.partner', 'partner')
      .where('payout.createdAt BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      });

    if (filters.partnerId) {
      queryBuilder.andWhere('payout.partnerId = :partnerId', {
        partnerId: filters.partnerId,
      });
    }

    if (filters.type) {
      queryBuilder.andWhere('payout.type = :type', { type: filters.type });
    }

    const payouts = await queryBuilder.getMany();

    // Calculate analytics
    const totalRequests = payouts.length;
    const totalAmount = payouts.reduce(
      (sum, payout) => sum + Number(payout.amount),
      0,
    );
    const averageAmount = totalRequests > 0 ? totalAmount / totalRequests : 0;

    // Group by status
    const payoutsByStatus = Object.values(PayoutStatus).map((status) => {
      const statusPayouts = payouts.filter((p) => p.status === status);
      return {
        status,
        count: statusPayouts.length,
        amount: statusPayouts.reduce((sum, p) => sum + Number(p.amount), 0),
      };
    });

    // Group by type
    const payoutsByType = Object.values(PayoutType).map((type) => {
      const typePayouts = payouts.filter((p) => p.type === type);
      return {
        type,
        count: typePayouts.length,
        amount: typePayouts.reduce((sum, p) => sum + Number(p.amount), 0),
      };
    });

    // Group by time period
    const payoutsOverTime = this.groupPayoutsByPeriod(
      payouts,
      filters.groupBy || 'day',
    );

    // Top partners
    const partnerMap = new Map();
    payouts.forEach((payout) => {
      const key = payout.partnerId;
      if (!partnerMap.has(key)) {
        partnerMap.set(key, {
          partnerId: payout.partnerId,
          partnerName: payout.partner
            ? `${payout.partner.firstName || ''} ${payout.partner.lastName || ''}`.trim() ||
              'Unknown'
            : 'Unknown',
          amount: 0,
          count: 0,
        });
      }
      const partner = partnerMap.get(key);
      partner.amount += Number(payout.amount);
      partner.count += 1;
    });

    const topPartners = Array.from(partnerMap.values())
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 10);

    return {
      totalRequests,
      totalAmount,
      averageAmount,
      payoutsByStatus,
      payoutsByType,
      payoutsOverTime,
      topPartners,
      analysisPeriod: { startDate, endDate },
    };
  }

  async getPayoutSummary(): Promise<PayoutSummaryResponseDto> {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const now = new Date();

    const payouts = await this.payoutRequestRepository.find({
      where: { createdAt: Between(thirtyDaysAgo, now) },
    });

    const summary = {
      totalPending: 0,
      totalApproved: 0,
      totalProcessed: 0,
      totalCompleted: 0,
      totalFailed: 0,
      totalFees: 0,
      netAmount: 0,
      growthRate: 0,
      currency: 'INR',
      period: { startDate: thirtyDaysAgo, endDate: now },
    };

    payouts.forEach((payout) => {
      const amount = Number(payout.amount);
      const fee = Number(payout.processingFee || 0);

      switch (payout.status) {
        case PayoutStatus.PENDING:
          summary.totalPending += amount;
          break;
        case PayoutStatus.APPROVED:
          summary.totalApproved += amount;
          break;
        case PayoutStatus.PROCESSING:
          summary.totalProcessed += amount;
          break;
        case PayoutStatus.COMPLETED:
          summary.totalCompleted += amount;
          break;
        case PayoutStatus.FAILED:
          summary.totalFailed += amount;
          break;
      }

      summary.totalFees += fee;
      summary.netAmount += amount - fee;
    });

    // Calculate growth rate (simplified)
    const previousPeriodPayouts = await this.payoutRequestRepository.find({
      where: {
        createdAt: Between(
          new Date(thirtyDaysAgo.getTime() - 30 * 24 * 60 * 60 * 1000),
          thirtyDaysAgo,
        ),
      },
    });

    const previousTotal = previousPeriodPayouts.reduce(
      (sum, p) => sum + Number(p.amount),
      0,
    );
    const currentTotal = summary.totalCompleted;

    if (previousTotal > 0) {
      summary.growthRate =
        ((currentTotal - previousTotal) / previousTotal) * 100;
    }

    return summary;
  }

  // Export and Download
  async exportPayouts(
    exportDto: ExportPayoutsDto,
    userId: string,
  ): Promise<ExportResponseDto> {
    const exportEntity = this.exportRepository.create({
      name: exportDto.name || `Payouts Export ${new Date().toISOString()}`,
      format: exportDto.format,
      filters: exportDto.filters || {},
      includeFields: exportDto.includeFields,
      createdBy: userId,
    });

    const savedExport = await this.exportRepository.save(exportEntity);

    // Start export process asynchronously
    this.processExport(savedExport.id).catch(console.error);

    return {
      exportId: savedExport.id,
      status: savedExport.status,
      format: savedExport.format,
      createdAt: savedExport.createdAt,
    };
  }

  async getExportStatus(exportId: string): Promise<ExportResponseDto> {
    const exportEntity = await this.exportRepository.findOne({
      where: { id: exportId },
    });
    if (!exportEntity) {
      throw new NotFoundException('Export not found');
    }

    return {
      exportId: exportEntity.id,
      status: exportEntity.status,
      format: exportEntity.format,
      totalRecords: exportEntity.totalRecords,
      createdAt: exportEntity.createdAt,
      completedAt: exportEntity.completedAt,
      downloadUrl: exportEntity.downloadUrl,
    };
  }

  // Settings Management
  async getSettings(): Promise<PayoutSettingsResponseDto> {
    let settings = await this.settingsRepository.findOne({ where: {} });
    if (!settings) {
      settings = await this.createDefaultSettings();
    }
    return this.mapToSettingsResponseDto(settings);
  }

  async updateSettings(
    updateDto: PayoutSettingsDto,
    userId: string,
  ): Promise<PayoutSettingsResponseDto> {
    let settings = await this.settingsRepository.findOne({ where: {} });
    if (!settings) {
      settings = await this.createDefaultSettings();
    }

    Object.assign(settings, updateDto, { updatedBy: userId });
    const updatedSettings = await this.settingsRepository.save(settings);
    return this.mapToSettingsResponseDto(updatedSettings);
  }

  // Utility Methods
  async getPayoutStatuses(): Promise<PayoutStatus[]> {
    return Object.values(PayoutStatus);
  }

  async getPayoutTypes(): Promise<PayoutType[]> {
    return Object.values(PayoutType);
  }

  async validatePayoutRequest(
    createDto: CreatePayoutRequestDto,
  ): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];

    // Validate partner
    const partner = await this.userRepository.findOne({
      where: { id: createDto.partnerId },
    });
    if (!partner) {
      errors.push('Partner not found');
    }

    // Validate amount
    const settings = await this.getSettings();
    if (createDto.amount < settings.minPayoutAmount) {
      errors.push(`Minimum payout amount is ${settings.minPayoutAmount}`);
    }
    if (createDto.amount > settings.maxPayoutAmount) {
      errors.push(`Maximum payout amount is ${settings.maxPayoutAmount}`);
    }

    // Validate bank account
    if (createDto.bankAccountId) {
      const bankAccount = await this.bankAccountRepository.findOne({
        where: {
          id: createDto.bankAccountId,
          partnerId: createDto.partnerId,
          status: BankAccountStatus.VERIFIED,
        },
      });
      if (!bankAccount) {
        errors.push('Invalid or unverified bank account');
      }
    }

    return { valid: errors.length === 0, errors };
  }

  async getNextPayoutNumber(): Promise<string> {
    const count = await this.payoutRequestRepository.count();
    return `PO${String(count + 1).padStart(6, '0')}`;
  }

  async getPartnerPayoutHistory(
    partnerId: string,
    page: number = 1,
    limit: number = 10,
  ): Promise<{ data: PayoutRequestResponseDto[]; total: number }> {
    const [payouts, total] = await this.payoutRequestRepository.findAndCount({
      where: { partnerId },
      relations: ['bankAccount', 'creator'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      data: payouts.map(this.mapToPayoutResponseDto),
      total,
    };
  }

  async getPartnerBalance(
    partnerId: string,
  ): Promise<{ balance: number; pendingBalance: number; currency: string }> {
    const wallet = await this.getOrCreateWallet(partnerId);
    return {
      balance: wallet.availableBalance,
      pendingBalance: wallet.pendingBalance,
      currency: wallet.currency,
    };
  }

  // Private Helper Methods
  private async getOrCreateWallet(
    partnerId: string,
  ): Promise<PartnerWalletEntity> {
    let wallet = await this.walletRepository.findOne({ where: { partnerId } });
    if (!wallet) {
      wallet = this.walletRepository.create({ partnerId });
      wallet = await this.walletRepository.save(wallet);
    }
    return wallet;
  }

  private async updatePayoutStatus(
    id: string,
    status: PayoutStatus,
    userId: string,
  ): Promise<PayoutRequestResponseDto> {
    const payoutRequest = await this.payoutRequestRepository.findOne({
      where: { id },
    });
    if (!payoutRequest) {
      throw new NotFoundException('Payout request not found');
    }

    const oldValues = { ...payoutRequest };
    payoutRequest.status = status;
    payoutRequest.updatedBy = userId;

    if (status === PayoutStatus.APPROVED) {
      if (!payoutRequest.canBeApproved()) {
        throw new BadRequestException('Payout request cannot be approved');
      }
      payoutRequest.approvedBy = userId;
      payoutRequest.approvedAt = new Date();
    }

    const updatedRequest =
      await this.payoutRequestRepository.save(payoutRequest);

    await this.createAuditTrail(
      id,
      status.toUpperCase(),
      oldValues,
      updatedRequest,
      userId,
    );

    return this.mapToPayoutResponseDto(updatedRequest);
  }

  private async createAuditTrail(
    payoutRequestId: string,
    action: string,
    oldValues: any,
    newValues: any,
    userId: string,
    queryRunner?: QueryRunner,
    reason?: string,
  ): Promise<void> {
    const auditTrail = this.auditTrailRepository.create({
      payoutRequestId,
      action,
      oldValues,
      newValues,
      reason,
      performedBy: userId,
    });

    if (queryRunner) {
      await queryRunner.manager.save(auditTrail);
    } else {
      await this.auditTrailRepository.save(auditTrail);
    }
  }

  private async debitWallet(
    partnerId: string,
    amount: number,
    description: string,
    referenceId: string,
    userId: string,
    queryRunner: QueryRunner,
  ): Promise<void> {
    const wallet = await this.getOrCreateWallet(partnerId);

    if (!wallet.canDebit(amount)) {
      throw new BadRequestException('Insufficient wallet balance');
    }

    const balanceBefore = wallet.availableBalance;
    wallet.availableBalance -= amount;
    wallet.lastTransactionDate = new Date();

    await queryRunner.manager.save(wallet);

    const transaction = this.walletTransactionRepository.create({
      walletId: wallet.id,
      type: WalletTransactionType.DEBIT,
      amount,
      currency: wallet.currency,
      balanceBefore,
      balanceAfter: wallet.availableBalance,
      description,
      referenceId,
      createdBy: userId,
    });

    await queryRunner.manager.save(transaction);
  }

  private async processPayment(
    payoutRequest: PayoutRequestEntity,
  ): Promise<boolean> {
    // Simulate payment processing
    // In real implementation, integrate with payment gateway
    await new Promise((resolve) => setTimeout(resolve, 1000));
    return Math.random() > 0.1; // 90% success rate
  }

  private generateTransactionId(): string {
    return this.idGeneratorService.generateId(EntityType.PAYOUT_TRANSACTION);
  }

  private generateOperationId(): string {
    return this.idGeneratorService.generateId(EntityType.PAYOUT_OPERATION);
  }

  private encryptAccountNumber(accountNumber: string): string {
    // In real implementation, use proper encryption
    return Buffer.from(accountNumber).toString('base64');
  }

  private groupPayoutsByPeriod(
    payouts: PayoutRequestEntity[],
    groupBy: string,
  ): Array<{ period: string; count: number; amount: number }> {
    const groups = new Map();

    payouts.forEach((payout) => {
      let period: string;
      const date = new Date(payout.createdAt);

      switch (groupBy) {
        case 'day':
          period = date.toISOString().split('T')[0];
          break;
        case 'week':
          const weekStart = new Date(
            date.setDate(date.getDate() - date.getDay()),
          );
          period = weekStart.toISOString().split('T')[0];
          break;
        case 'month':
          period = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          break;
        case 'year':
          period = String(date.getFullYear());
          break;
        default:
          period = date.toISOString().split('T')[0];
      }

      if (!groups.has(period)) {
        groups.set(period, { period, count: 0, amount: 0 });
      }

      const group = groups.get(period);
      group.count += 1;
      group.amount += Number(payout.amount);
    });

    return Array.from(groups.values()).sort((a, b) =>
      a.period.localeCompare(b.period),
    );
  }

  private async processExport(exportId: string): Promise<void> {
    try {
      const exportEntity = await this.exportRepository.findOne({
        where: { id: exportId },
      });
      if (!exportEntity) return;

      exportEntity.status = ExportStatus.PROCESSING;
      exportEntity.startedAt = new Date();
      await this.exportRepository.save(exportEntity);

      // Simulate export processing
      await new Promise((resolve) => setTimeout(resolve, 5000));

      exportEntity.status = ExportStatus.COMPLETED;
      exportEntity.completedAt = new Date();
      exportEntity.downloadUrl = `/api/exports/${exportId}/download`;
      exportEntity.downloadExpiresAt = new Date(
        Date.now() + 24 * 60 * 60 * 1000,
      ); // 24 hours
      exportEntity.totalRecords = 100; // Mock data
      exportEntity.processedRecords = 100;

      await this.exportRepository.save(exportEntity);
    } catch (error) {
      const exportEntity = await this.exportRepository.findOne({
        where: { id: exportId },
      });
      if (exportEntity) {
        exportEntity.status = ExportStatus.FAILED;
        exportEntity.errorMessage = error.message;
        await this.exportRepository.save(exportEntity);
      }
    }
  }

  private async createDefaultSettings(): Promise<PayoutSettingsEntity> {
    const settings = this.settingsRepository.create({});
    return await this.settingsRepository.save(settings);
  }

  // Mapping Methods
  private mapToPayoutResponseDto(
    entity: PayoutRequestEntity,
  ): PayoutRequestResponseDto {
    return {
      id: entity.id,
      status: entity.status,
      type: entity.type,
      amount: Number(entity.amount),
      currency: entity.currency,
      description: entity.description,
      partner: entity.partner
        ? {
            id: entity.partner.id,
            name:
              `${entity.partner.firstName || ''} ${entity.partner.lastName || ''}`.trim() ||
              'Unknown',
            email: entity.partner.email,
          }
        : undefined,
      bankAccount: entity.bankAccount
        ? {
            id: entity.bankAccount.id,
            accountNumber: entity.bankAccount.accountNumber,
            bankName: entity.bankAccount.bankName,
            accountHolderName: entity.bankAccount.accountHolderName,
          }
        : undefined,
      referenceId: entity.referenceId,
      referenceType: entity.referenceType,
      transactionId: entity.transactionId,
      processingFee: Number(entity.processingFee),
      netAmount: entity.netAmount ? Number(entity.netAmount) : undefined,
      metadata: entity.metadata,
      scheduledDate: entity.scheduledDate,
      processedDate: entity.processedDate,
      priority: entity.priority,
      rejectionReason: entity.rejectionReason,
      failureReason: entity.failureReason,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
      createdBy: entity.creator
        ? {
            id: entity.creator.id,
            name:
              `${entity.creator.firstName || ''} ${entity.creator.lastName || ''}`.trim() ||
              'Unknown',
          }
        : undefined,
      updatedBy: entity.updater
        ? {
            id: entity.updater.id,
            name:
              `${entity.updater.firstName || ''} ${entity.updater.lastName || ''}`.trim() ||
              'Unknown',
          }
        : undefined,
    };
  }

  private mapToBankAccountResponseDto(
    entity: BankAccountEntity,
  ): BankAccountResponseDto {
    return {
      id: entity.id,
      partnerId: entity.partnerId,
      accountHolderName: entity.accountHolderName,
      accountNumber: entity.accountNumber,
      ifscCode: entity.ifscCode,
      bankName: entity.bankName,
      branchName: entity.branchName,
      accountType: entity.accountType,
      status: entity.status,
      isPrimary: entity.isPrimary,
      verifiedAt: entity.verifiedAt,
      rejectionReason: entity.rejectionReason,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }

  private mapToWalletResponseDto(
    entity: PartnerWalletEntity,
  ): WalletResponseDto {
    return {
      id: entity.id,
      partnerId: entity.partnerId,
      balance: Number(entity.availableBalance),
      pendingBalance: Number(entity.pendingBalance),
      totalEarnings: Number(entity.totalBalance),
      totalWithdrawals: 0, // This field doesn't exist in the entity, setting to 0
      currency: entity.currency,
      lastTransactionAt: entity.lastTransactionDate,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }

  private mapToWalletTransactionResponseDto(
    entity: WalletTransactionEntity,
  ): WalletTransactionResponseDto {
    // Map entity WalletTransactionType (from payout.dto) to PartnerWalletTransactionType (from partner-payout.dto)
    const typeMapping: Record<
      WalletTransactionType,
      PartnerWalletTransactionType
    > = {
      [WalletTransactionType.CREDIT]: PartnerWalletTransactionType.CREDIT,
      [WalletTransactionType.DEBIT]: PartnerWalletTransactionType.DEBIT,
      [WalletTransactionType.COMMISSION_EARNED]:
        PartnerWalletTransactionType.CREDIT,
      [WalletTransactionType.PAYOUT_DEDUCTED]:
        PartnerWalletTransactionType.WITHDRAWAL,
      [WalletTransactionType.REFUND_RECEIVED]:
        PartnerWalletTransactionType.CREDIT,
      [WalletTransactionType.BONUS_ADDED]: PartnerWalletTransactionType.CREDIT,
      [WalletTransactionType.ADJUSTMENT]: PartnerWalletTransactionType.TRANSFER,
      [WalletTransactionType.FEE_DEDUCTED]: PartnerWalletTransactionType.DEBIT,
    };

    return {
      id: entity.id,
      walletId: entity.walletId,
      type: typeMapping[entity.type] || PartnerWalletTransactionType.CREDIT,
      amount: Number(entity.amount),
      currency: entity.currency,
      balanceAfter: Number(entity.balanceAfter),
      description: entity.description,
      referenceId: entity.referenceId,
      metadata: entity.metadata,
      transactionDate: entity.createdAt,
      createdAt: entity.createdAt,
      createdBy: entity.creator
        ? {
            id: entity.creator.id,
            name:
              `${entity.creator.firstName || ''} ${entity.creator.lastName || ''}`.trim() ||
              'Unknown',
          }
        : undefined,
    };
  }

  private mapToSettingsResponseDto(
    entity: PayoutSettingsEntity,
  ): PayoutSettingsResponseDto {
    return {
      id: entity.id,
      minPayoutAmount: Number(entity.minPayoutAmount),
      maxPayoutAmount: Number(entity.maxPayoutAmount),
      autoApproveThreshold: Number(entity.autoApproveThreshold),
      defaultCurrency: entity.defaultCurrency,
      enableNotifications: entity.enableNotifications,
      notificationEmail: entity.notificationEmail,
      processingTimeout: entity.processingTimeout,
      maxRetryAttempts: entity.maxRetryAttempts,
      enableAuditTrail: entity.enableAuditTrail,
      dataRetentionDays: entity.dataRetentionDays,
      businessDays: entity.businessDays,
      processingStartTime: entity.processingStartTime,
      processingEndTime: entity.processingEndTime,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
      updatedBy: entity.updater
        ? {
            id: entity.updater.id,
            name:
              `${entity.updater.firstName || ''} ${entity.updater.lastName || ''}`.trim() ||
              'Unknown',
          }
        : undefined,
    };
  }
}
