import { UserEntity } from '@/auth/entities/user.entity';
import { BookingEntity } from '@/database/entities/booking.entity';
import {
  BankAccountEntity,
  PartnerWalletEntity,
  PayoutAuditTrailEntity,
  PayoutEntity,
  PayoutExportEntity,
  PayoutReportEntity,
  PayoutRequestEntity,
  PayoutSettingsEntity,
  WalletTransactionEntity,
} from '@/database/entities/payout.entity';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, DataSource, In, Not, Repository } from 'typeorm';
import {
  BankAccountDto,
  BankAccountResponseDto,
  BankAccountStatus,
  BulkPayoutOperationDto,
  BulkPayoutOperationType,
  CreatePayoutRequestDto,
  ExportFormat,
  PayoutAnalyticsDto,
  PayoutExportDto,
  PayoutMethod,
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

@Injectable()
export class PayoutService {
  constructor(
    @InjectRepository(PayoutRequestEntity)
    private payoutRequestRepository: Repository<PayoutRequestEntity>,
    @InjectRepository(PayoutEntity)
    private payoutRepository: Repository<PayoutEntity>,
    @InjectRepository(PartnerWalletEntity)
    private walletRepository: Repository<PartnerWalletEntity>,
    @InjectRepository(WalletTransactionEntity)
    private walletTransactionRepository: Repository<WalletTransactionEntity>,
    @InjectRepository(BankAccountEntity)
    private bankAccountRepository: Repository<BankAccountEntity>,
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
      // Determine partner ID
      const partnerId = createDto.partnerId || userId;

      // Validate partner exists
      const partner = await this.userRepository.findOne({
        where: { id: partnerId },
      });
      if (!partner) {
        throw new NotFoundException('Partner not found');
      }

      // Check wallet balance if applicable
      if (createDto.type === PayoutType.WITHDRAWAL) {
        const wallet = await this.getOrCreateWallet(partnerId);
        if (!wallet.canDebit(createDto.amount)) {
          throw new BadRequestException('Insufficient wallet balance');
        }
      }

      // Validate bank account if provided
      if (createDto.bankAccountId) {
        const bankAccount = await this.bankAccountRepository.findOne({
          where: { id: createDto.bankAccountId, partnerId },
        });
        if (!bankAccount || !bankAccount.canBeUsedForPayout()) {
          throw new BadRequestException('Invalid or unverified bank account');
        }
      }

      // Check settings for auto-approval
      const settings = await this.getSettings();
      const shouldAutoApprove =
        createDto.autoApprove &&
        settings.autoApprovalThreshold &&
        createDto.amount <= settings.autoApprovalThreshold;

      // Create payout request
      const payoutRequest = this.payoutRequestRepository.create({
        ...createDto,
        partnerId,
        createdBy: userId,
        status: shouldAutoApprove
          ? PayoutStatus.APPROVED
          : PayoutStatus.PENDING,
        approvedDate: shouldAutoApprove ? new Date() : undefined,
        approvedBy: shouldAutoApprove ? userId : undefined,
      });

      const savedRequest = await queryRunner.manager.save(payoutRequest);

      // Create audit trail
      await this.createAuditTrail(
        {
          payoutRequestId: savedRequest.id,
          action: 'created',
          description: `Payout request created for ${createDto.amount} ${createDto.currency}`,
          performedBy: userId,
        },
        queryRunner.manager,
      );

      if (shouldAutoApprove) {
        await this.createAuditTrail(
          {
            payoutRequestId: savedRequest.id,
            action: 'auto_approved',
            description: 'Payout request auto-approved based on settings',
            performedBy: userId,
          },
          queryRunner.manager,
        );
      }

      await queryRunner.commitTransaction();
      return this.mapPayoutRequestToResponse(savedRequest);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async getPayoutRequests(
    partnerId?: string,
    status?: PayoutStatus,
    type?: PayoutType,
    page: number = 1,
    limit: number = 20,
  ): Promise<{
    data: PayoutRequestResponseDto[];
    total: number;
    page: number;
    limit: number;
  }> {
    const queryBuilder = this.payoutRequestRepository
      .createQueryBuilder('request')
      .leftJoinAndSelect('request.partner', 'partner')
      .leftJoinAndSelect('request.bankAccount', 'bankAccount')
      .leftJoinAndSelect('request.creator', 'creator')
      .leftJoinAndSelect('request.approver', 'approver');

    if (partnerId) {
      queryBuilder.andWhere('request.partnerId = :partnerId', { partnerId });
    }
    if (status) {
      queryBuilder.andWhere('request.status = :status', { status });
    }
    if (type) {
      queryBuilder.andWhere('request.type = :type', { type });
    }

    queryBuilder
      .orderBy('request.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [requests, total] = await queryBuilder.getManyAndCount();

    return {
      data: requests.map((request) => this.mapPayoutRequestToResponse(request)),
      total,
      page,
      limit,
    };
  }

  async getPayouts(
    partnerId?: string,
    status?: PayoutStatus,
    page: number = 1,
    limit: number = 20,
  ): Promise<{
    data: PayoutResponseDto[];
    total: number;
    page: number;
    limit: number;
  }> {
    const queryBuilder = this.payoutRepository
      .createQueryBuilder('payout')
      .leftJoinAndSelect('payout.partner', 'partner')
      .leftJoinAndSelect('payout.request', 'request')
      .leftJoinAndSelect('payout.bankAccount', 'bankAccount');

    if (partnerId) {
      queryBuilder.andWhere('payout.partnerId = :partnerId', { partnerId });
    }
    if (status) {
      queryBuilder.andWhere('payout.status = :status', { status });
    }

    queryBuilder
      .orderBy('payout.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [payouts, total] = await queryBuilder.getManyAndCount();

    return {
      data: payouts.map((payout) => this.mapPayoutToResponse(payout)),
      total,
      page,
      limit,
    };
  }

  async getPayoutById(id: string): Promise<PayoutResponseDto> {
    const payout = await this.payoutRepository.findOne({
      where: { id },
      relations: ['partner', 'request', 'bankAccount'],
    });

    if (!payout) {
      throw new NotFoundException('Payout not found');
    }

    return this.mapPayoutToResponse(payout);
  }

  async getPayoutRequestById(id: string): Promise<PayoutRequestResponseDto> {
    const request = await this.payoutRequestRepository.findOne({
      where: { id },
      relations: ['partner', 'bankAccount', 'creator', 'approver'],
    });

    if (!request) {
      throw new NotFoundException('Payout request not found');
    }

    return this.mapPayoutRequestToResponse(request);
  }

  async updatePayoutRequest(
    id: string,
    updateDto: UpdatePayoutRequestDto,
    userId: string,
  ): Promise<PayoutRequestResponseDto> {
    const request = await this.payoutRequestRepository.findOne({
      where: { id },
      relations: ['partner'],
    });

    if (!request) {
      throw new NotFoundException('Payout request not found');
    }

    if (!request.canBeApproved()) {
      throw new BadRequestException(
        'Payout request cannot be updated in current status',
      );
    }

    // Update request
    Object.assign(request, updateDto);
    request.updatedBy = userId;

    const updatedRequest = await this.payoutRequestRepository.save(request);

    // Create audit trail
    await this.createAuditTrail({
      payoutRequestId: id,
      action: 'updated',
      description: 'Payout request updated',
      changes: updateDto,
      performedBy: userId,
    });

    return this.mapPayoutRequestToResponse(updatedRequest);
  }

  async approvePayoutRequest(
    id: string,
    processPayoutDto: ProcessPayoutDto,
    userId: string,
  ): Promise<PayoutRequestResponseDto> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const request = await this.payoutRequestRepository.findOne({
        where: { id },
        relations: ['partner'],
      });

      if (!request) {
        throw new NotFoundException('Payout request not found');
      }

      if (!request.canBeApproved()) {
        throw new BadRequestException(
          'Payout request cannot be approved in current status',
        );
      }

      // Update request status
      request.status = PayoutStatus.APPROVED;
      request.approvedDate = new Date();
      request.approvedBy = userId;
      request.updatedBy = userId;
      if (processPayoutDto.notes) {
        request.notes = processPayoutDto.notes;
      }

      const updatedRequest = await queryRunner.manager.save(request);

      // Create audit trail
      await this.createAuditTrail(
        {
          payoutRequestId: id,
          action: 'approved',
          previousStatus: PayoutStatus.PENDING,
          newStatus: PayoutStatus.APPROVED,
          description: processPayoutDto.notes || 'Payout request approved',
          performedBy: userId,
        },
        queryRunner.manager,
      );

      await queryRunner.commitTransaction();
      return this.mapPayoutRequestToResponse(updatedRequest);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async rejectPayoutRequest(
    id: string,
    processPayoutDto: ProcessPayoutDto,
    userId: string,
  ): Promise<PayoutRequestResponseDto> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const request = await this.payoutRequestRepository.findOne({
        where: { id },
        relations: ['partner'],
      });

      if (!request) {
        throw new NotFoundException('Payout request not found');
      }

      if (!request.canBeRejected()) {
        throw new BadRequestException(
          'Payout request cannot be rejected in current status',
        );
      }

      // Update request status
      request.status = PayoutStatus.REJECTED;
      request.rejectedDate = new Date();
      request.rejectionReason = processPayoutDto.notes || 'Request rejected';
      request.updatedBy = userId;

      const updatedRequest = await queryRunner.manager.save(request);

      // Create audit trail
      await this.createAuditTrail(
        {
          payoutRequestId: id,
          action: 'rejected',
          previousStatus: PayoutStatus.PENDING,
          newStatus: PayoutStatus.REJECTED,
          description: processPayoutDto.notes || 'Request rejected',
          performedBy: userId,
        },
        queryRunner.manager,
      );

      await queryRunner.commitTransaction();
      return this.mapPayoutRequestToResponse(updatedRequest);
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
    reason?: string,
  ): Promise<PayoutRequestResponseDto> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const request = await this.payoutRequestRepository.findOne({
        where: { id },
        relations: ['partner'],
      });

      if (!request) {
        throw new NotFoundException('Payout request not found');
      }

      if (
        ![PayoutStatus.PENDING, PayoutStatus.APPROVED].includes(request.status)
      ) {
        throw new BadRequestException(
          'Payout request cannot be cancelled in current status',
        );
      }

      // Update request status
      request.status = PayoutStatus.CANCELLED;
      request.rejectedDate = new Date();
      request.rejectionReason = reason;
      request.updatedBy = userId;

      const updatedRequest = await queryRunner.manager.save(request);

      // Create audit trail
      await this.createAuditTrail(
        {
          payoutRequestId: id,
          action: 'cancelled',
          previousStatus: request.status,
          newStatus: PayoutStatus.CANCELLED,
          description: reason || 'Payout request cancelled',
          performedBy: userId,
        },
        queryRunner.manager,
      );

      await queryRunner.commitTransaction();
      return this.mapPayoutRequestToResponse(updatedRequest);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  // Payout Processing
  async processPayoutRequest(
    requestId: string,
    processDto: ProcessPayoutDto,
    userId: string,
  ): Promise<PayoutResponseDto> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const request = await this.payoutRequestRepository.findOne({
        where: { id: requestId },
        relations: ['partner', 'bankAccount'],
      });

      if (!request) {
        throw new NotFoundException('Payout request not found');
      }

      if (!request.canBeProcessed()) {
        throw new BadRequestException(
          'Payout request cannot be processed in current status',
        );
      }

      // Calculate processing fee
      const settings = await this.getSettings();
      const processingFee =
        processDto.processingFee || settings.processingFee || 0;
      const netAmount = request.amount - processingFee;

      if (netAmount <= 0) {
        throw new BadRequestException('Net amount after fees must be positive');
      }

      // Create payout entity
      const payout = this.payoutRepository.create({
        requestId: request.id,
        partnerId: request.partnerId,
        amount: request.amount,
        processingFee,
        netAmount,
        currency: request.currency,
        bankAccountId: request.bankAccountId,
        payoutMethod: request.payoutMethod,
        scheduledDate: processDto.scheduledDate,
        bankReference: processDto.bankReference,
        externalTransactionId: processDto.externalTransactionId,
        notes: processDto.notes,
        metadata: processDto.metadata,
        processedBy: userId,
        processedDate: new Date(),
      });

      const savedPayout = await queryRunner.manager.save(payout);

      // Update request status
      request.status = PayoutStatus.PROCESSING;
      request.processedDate = new Date();
      request.processingFee = processingFee;
      request.netAmount = netAmount;
      request.updatedBy = userId;

      await queryRunner.manager.save(request);

      // Update wallet if withdrawal
      if (request.type === PayoutType.WITHDRAWAL) {
        await this.debitWallet(
          request.partnerId,
          request.amount,
          WalletTransactionType.PAYOUT_DEDUCTED,
          `Payout processed: ${savedPayout.payoutReference}`,
          savedPayout.id,
          userId,
          queryRunner.manager,
        );
      }

      // Create audit trails
      await this.createAuditTrail(
        {
          payoutRequestId: request.id,
          action: 'processing_started',
          previousStatus: PayoutStatus.APPROVED,
          newStatus: PayoutStatus.PROCESSING,
          description: 'Payout processing initiated',
          performedBy: userId,
        },
        queryRunner.manager,
      );

      await this.createAuditTrail(
        {
          payoutId: savedPayout.id,
          action: 'created',
          description: `Payout created for processing: ${savedPayout.payoutReference}`,
          performedBy: userId,
        },
        queryRunner.manager,
      );

      await queryRunner.commitTransaction();
      return this.mapPayoutToResponse(savedPayout);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async completePayoutProcessing(
    payoutId: string,
    userId: string,
    bankReference?: string,
    notes?: string,
  ): Promise<PayoutResponseDto> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const payout = await this.payoutRepository.findOne({
        where: { id: payoutId },
        relations: ['request', 'partner'],
      });

      if (!payout) {
        throw new NotFoundException('Payout not found');
      }

      if (!payout.canBeCompleted()) {
        throw new BadRequestException(
          'Payout cannot be completed in current status',
        );
      }

      // Update payout status
      payout.status = PayoutStatus.COMPLETED;
      payout.completedDate = new Date();
      if (bankReference) {
        payout.bankReference = bankReference;
      }
      if (notes) {
        payout.notes = notes;
      }

      const updatedPayout = await queryRunner.manager.save(payout);

      // Update request status
      if (payout.request) {
        payout.request.status = PayoutStatus.COMPLETED;
        payout.request.completedDate = new Date();
        payout.request.updatedBy = userId;
        await queryRunner.manager.save(payout.request);
      }

      // Create audit trail
      await this.createAuditTrail(
        {
          payoutId: payoutId,
          action: 'completed',
          previousStatus: PayoutStatus.PROCESSING,
          newStatus: PayoutStatus.COMPLETED,
          description: notes || 'Payout completed successfully',
          performedBy: userId,
        },
        queryRunner.manager,
      );

      await queryRunner.commitTransaction();
      return this.mapPayoutToResponse(updatedPayout);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async failPayoutProcessing(
    payoutId: string,
    userId: string,
    reason: string,
  ): Promise<PayoutResponseDto> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const payout = await this.payoutRepository.findOne({
        where: { id: payoutId },
        relations: ['request', 'partner'],
      });

      if (!payout) {
        throw new NotFoundException('Payout not found');
      }

      if (!payout.canBeFailed()) {
        throw new BadRequestException(
          'Payout cannot be failed in current status',
        );
      }

      // Update payout status
      payout.status = PayoutStatus.FAILED;
      payout.failedDate = new Date();
      payout.failureReason = reason;

      const updatedPayout = await queryRunner.manager.save(payout);

      // Update request status
      if (payout.request) {
        payout.request.status = PayoutStatus.FAILED;
        payout.request.updatedBy = userId;
        await queryRunner.manager.save(payout.request);
      }

      // Reverse wallet transaction if applicable
      if (payout.request?.type === PayoutType.WITHDRAWAL) {
        await this.creditWallet(
          payout.partnerId,
          payout.amount,
          WalletTransactionType.REFUND_RECEIVED,
          `Payout failed - amount refunded: ${payout.payoutReference}`,
          payout.id,
          userId,
          queryRunner.manager,
        );
      }

      // Create audit trail
      await this.createAuditTrail(
        {
          payoutId: payoutId,
          action: 'failed',
          previousStatus: PayoutStatus.PROCESSING,
          newStatus: PayoutStatus.FAILED,
          description: reason,
          performedBy: userId,
        },
        queryRunner.manager,
      );

      await queryRunner.commitTransaction();
      return this.mapPayoutToResponse(updatedPayout);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  // Wallet Management
  async getWalletBalance(
    partnerId: string,
    userId: string,
    roles: string[],
  ): Promise<WalletBalanceResponseDto> {
    // Check permissions - partners can only access their own wallet
    if (roles.includes('partner') && partnerId !== userId) {
      throw new ForbiddenException('Access denied to wallet');
    }

    const wallet = await this.getOrCreateWallet(partnerId);
    return this.mapWalletToResponse(wallet);
  }

  async updateWallet(
    partnerId: string,
    updateWalletDto: UpdateWalletDto,
    userId: string,
  ): Promise<WalletBalanceResponseDto> {
    return this.updateWalletBalance(partnerId, updateWalletDto, userId);
  }

  async updateWalletBalance(
    partnerId: string,
    updateDto: UpdateWalletDto,
    userId: string,
  ): Promise<WalletBalanceResponseDto> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      if (
        updateDto.transactionType === WalletTransactionType.CREDIT ||
        updateDto.transactionType === WalletTransactionType.COMMISSION_EARNED ||
        updateDto.transactionType === WalletTransactionType.REFUND_RECEIVED ||
        updateDto.transactionType === WalletTransactionType.BONUS_ADDED
      ) {
        await this.creditWallet(
          partnerId,
          updateDto.amount,
          updateDto.transactionType,
          updateDto.description,
          updateDto.referenceId,
          userId,
          queryRunner.manager,
          updateDto.notes,
          updateDto.metadata,
        );
      } else {
        await this.debitWallet(
          partnerId,
          updateDto.amount,
          updateDto.transactionType,
          updateDto.description,
          updateDto.referenceId,
          userId,
          queryRunner.manager,
          updateDto.notes,
          updateDto.metadata,
        );
      }

      const wallet = await this.getOrCreateWallet(partnerId);
      await queryRunner.commitTransaction();
      return this.mapWalletToResponse(wallet);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async getWalletTransactions(
    partnerId: string,
    page: number = 1,
    limit: number = 20,
    filters?: {
      type?: WalletTransactionType[];
      dateFrom?: Date;
      dateTo?: Date;
    },
    userId?: string,
    roles?: string[],
  ): Promise<{
    transactions: WalletTransactionResponseDto[];
    total: number;
    page: number;
    limit: number;
  }> {
    // Permission check - partners can only access their own transactions
    if (
      userId &&
      roles &&
      !roles.includes('admin') &&
      !roles.includes('finance')
    ) {
      if (partnerId !== userId) {
        throw new ForbiddenException('Access denied to wallet transactions');
      }
    }

    const queryBuilder = this.walletTransactionRepository
      .createQueryBuilder('transaction')
      .leftJoinAndSelect('transaction.creator', 'creator')
      .where('transaction.partnerId = :partnerId', { partnerId });

    if (filters?.type && filters.type.length > 0) {
      queryBuilder.andWhere('transaction.type IN (:...types)', {
        types: filters.type,
      });
    }

    if (filters?.dateFrom) {
      queryBuilder.andWhere('transaction.createdAt >= :dateFrom', {
        dateFrom: filters.dateFrom,
      });
    }

    if (filters?.dateTo) {
      queryBuilder.andWhere('transaction.createdAt <= :dateTo', {
        dateTo: filters.dateTo,
      });
    }

    queryBuilder
      .orderBy('transaction.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [transactions, total] = await queryBuilder.getManyAndCount();

    return {
      transactions: transactions.map((transaction) =>
        this.mapWalletTransactionToResponse(transaction),
      ),
      total,
      page,
      limit,
    };
  }

  // Bank Account Management
  async addBankAccount(
    bankAccountDto: BankAccountDto,
    userId: string,
  ): Promise<BankAccountResponseDto> {
    const partnerId = bankAccountDto.partnerId || userId;

    // Check if account number already exists
    const existingAccount = await this.bankAccountRepository.findOne({
      where: { accountNumber: bankAccountDto.accountNumber },
    });

    if (existingAccount) {
      throw new ConflictException('Bank account already exists');
    }

    // If setting as primary, update existing primary accounts
    if (bankAccountDto.isPrimary) {
      await this.bankAccountRepository.update(
        { partnerId, isPrimary: true },
        { isPrimary: false },
      );
    }

    const bankAccount = this.bankAccountRepository.create({
      ...bankAccountDto,
      partnerId,
    });

    const savedAccount = await this.bankAccountRepository.save(bankAccount);
    return this.mapBankAccountToResponse(savedAccount);
  }

  async getBankAccounts(
    partnerId: string,
    status?: BankAccountStatus,
  ): Promise<BankAccountResponseDto[]> {
    const queryBuilder = this.bankAccountRepository
      .createQueryBuilder('account')
      .leftJoinAndSelect('account.partner', 'partner')
      .where('account.partnerId = :partnerId', { partnerId });

    if (status) {
      queryBuilder.andWhere('account.status = :status', { status });
    }

    queryBuilder
      .orderBy('account.isPrimary', 'DESC')
      .addOrderBy('account.createdAt', 'DESC');

    const accounts = await queryBuilder.getMany();
    return accounts.map((account) => this.mapBankAccountToResponse(account));
  }

  async getBankAccountById(
    accountId: string,
    userId: string,
    roles: string[],
  ): Promise<BankAccountResponseDto> {
    const account = await this.bankAccountRepository.findOne({
      where: { id: accountId },
      relations: ['partner'],
    });

    if (!account) {
      throw new NotFoundException('Bank account not found');
    }

    // Check permissions - partners can only see their own accounts
    if (roles.includes('partner') && account.partnerId !== userId) {
      throw new ForbiddenException('Access denied to this bank account');
    }

    return this.mapBankAccountToResponse(account);
  }

  async verifyBankAccount(
    accountId: string,
    verifyDto: VerifyBankAccountDto,
    userId: string,
  ): Promise<BankAccountResponseDto> {
    const account = await this.bankAccountRepository.findOne({
      where: { id: accountId },
      relations: ['partner'],
    });

    if (!account) {
      throw new NotFoundException('Bank account not found');
    }

    if (account.status !== BankAccountStatus.PENDING) {
      throw new BadRequestException('Bank account is not in pending status');
    }

    // Update account status
    account.status = BankAccountStatus.VERIFIED;
    account.verifiedDate = new Date();
    account.verificationMethod = verifyDto.verificationMethod;
    account.verificationReference = verifyDto.verificationReference;
    account.verifiedBy = userId;
    if (verifyDto.notes) {
      account.notes = verifyDto.notes;
    }
    if (verifyDto.metadata) {
      account.metadata = verifyDto.metadata;
    }

    const updatedAccount = await this.bankAccountRepository.save(account);
    return this.mapBankAccountToResponse(updatedAccount);
  }

  async updateBankAccount(
    id: string,
    bankAccountDto: BankAccountDto,
    userId: string,
  ): Promise<BankAccountResponseDto> {
    const account = await this.bankAccountRepository.findOne({
      where: { id },
      relations: ['partner'],
    });

    if (!account) {
      throw new NotFoundException('Bank account not found');
    }

    // Update account details
    if (bankAccountDto.accountHolderName) {
      account.accountHolderName = bankAccountDto.accountHolderName;
    }
    if (bankAccountDto.bankName) {
      account.bankName = bankAccountDto.bankName;
    }
    if (bankAccountDto.branchName) {
      account.branchName = bankAccountDto.branchName;
    }
    if (bankAccountDto.ifscCode) {
      account.ifscCode = bankAccountDto.ifscCode;
    }

    const updatedAccount = await this.bankAccountRepository.save(account);
    return this.mapBankAccountToResponse(updatedAccount);
  }

  async deleteBankAccount(id: string, userId: string): Promise<void> {
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

  async setPrimaryBankAccount(
    id: string,
    userId: string,
  ): Promise<BankAccountResponseDto> {
    const account = await this.bankAccountRepository.findOne({
      where: { id },
      relations: ['partner'],
    });

    if (!account) {
      throw new NotFoundException('Bank account not found');
    }

    if (account.status !== BankAccountStatus.VERIFIED) {
      throw new BadRequestException(
        'Only verified accounts can be set as primary',
      );
    }

    // Remove primary status from other accounts
    await this.bankAccountRepository.update(
      { partnerId: account.partnerId, isPrimary: true },
      { isPrimary: false },
    );

    // Set this account as primary
    account.isPrimary = true;
    const updatedAccount = await this.bankAccountRepository.save(account);
    return this.mapBankAccountToResponse(updatedAccount);
  }

  async rejectBankAccount(
    accountId: string,
    reason: string,
    userId: string,
  ): Promise<BankAccountResponseDto> {
    const account = await this.bankAccountRepository.findOne({
      where: { id: accountId },
      relations: ['partner'],
    });

    if (!account) {
      throw new NotFoundException('Bank account not found');
    }

    if (account.status !== BankAccountStatus.PENDING) {
      throw new BadRequestException('Bank account is not in pending status');
    }

    // Update account status
    account.status = BankAccountStatus.REJECTED;
    account.rejectionReason = reason;
    account.verifiedBy = userId;

    const updatedAccount = await this.bankAccountRepository.save(account);
    return this.mapBankAccountToResponse(updatedAccount);
  }

  // Bulk Operations
  async bulkPayoutOperation(
    bulkDto: BulkPayoutOperationDto,
    userId: string,
  ): Promise<{ success: number; failed: number; errors: string[] }> {
    const results = { success: 0, failed: 0, errors: [] };

    for (const payoutId of bulkDto.payoutIds) {
      try {
        switch (bulkDto.operation) {
          case BulkPayoutOperationType.APPROVE_REQUESTS:
            await this.approvePayoutRequest(
              payoutId,
              { notes: bulkDto.reason },
              userId,
            );
            break;
          case BulkPayoutOperationType.REJECT_REQUESTS:
            await this.rejectPayoutRequest(
              payoutId,
              { notes: bulkDto.reason || 'Bulk rejection' },
              userId,
            );
            break;
          case BulkPayoutOperationType.PROCESS_PAYOUTS:
            await this.processPayoutRequest(
              payoutId,
              bulkDto.data || {},
              userId,
            );
            break;
          case BulkPayoutOperationType.CANCEL_REQUESTS:
            // Implementation for cancellation
            break;
          default:
            throw new BadRequestException(
              `Unsupported operation: ${bulkDto.operation}`,
            );
        }
        results.success++;
      } catch (error) {
        results.failed++;
        results.errors.push(`${payoutId}: ${error.message}`);
      }
    }

    return results;
  }

  // Analytics and Reporting
  async getPayoutAnalytics(
    dateFrom?: Date,
    dateTo?: Date,
    partnerId?: string,
  ): Promise<PayoutAnalyticsDto> {
    const queryBuilder = this.payoutRepository.createQueryBuilder('payout');

    if (dateFrom && dateTo) {
      queryBuilder.andWhere('payout.createdAt BETWEEN :dateFrom AND :dateTo', {
        dateFrom,
        dateTo,
      });
    }

    if (partnerId) {
      queryBuilder.andWhere('payout.partnerId = :partnerId', { partnerId });
    }

    const payouts = await queryBuilder.getMany();

    // Calculate analytics
    const totalVolume = payouts.reduce(
      (sum, payout) => sum + Number(payout.amount),
      0,
    );
    const totalPayouts = payouts.length;
    const completedPayouts = payouts.filter(
      (p) => p.status === PayoutStatus.COMPLETED,
    ).length;
    const pendingPayouts = payouts.filter(
      (p) => p.status === PayoutStatus.PROCESSING,
    ).length;
    const failedPayouts = payouts.filter(
      (p) => p.status === PayoutStatus.FAILED,
    ).length;
    const averagePayoutAmount =
      totalPayouts > 0 ? totalVolume / totalPayouts : 0;
    const successRate =
      totalPayouts > 0 ? (completedPayouts / totalPayouts) * 100 : 0;
    const totalProcessingFees = payouts.reduce(
      (sum, payout) => sum + Number(payout.processingFee || 0),
      0,
    );

    // Group by type and method
    const volumeByType = this.groupPayoutsByField(payouts, 'type');
    const volumeByMethod = this.groupPayoutsByField(payouts, 'payoutMethod');
    const statusDistribution = this.getStatusDistribution(payouts);

    return {
      totalVolume,
      totalPayouts,
      completedPayouts,
      pendingPayouts,
      failedPayouts,
      averagePayoutAmount,
      successRate,
      totalProcessingFees,
      volumeByType,
      volumeByMethod,
      dailyTrends: [], // Implementation needed
      topPartners: [], // Implementation needed
      statusDistribution,
    };
  }

  // Export and Download
  async exportPayouts(
    exportDto: PayoutExportDto,
    userId: string,
  ): Promise<string> {
    const exportEntity = this.exportRepository.create({
      exportType: exportDto.exportType,
      format: exportDto.format,
      filters: exportDto.filters,
      createdBy: userId,
      startedAt: new Date(),
    });

    const savedExport = await this.exportRepository.save(exportEntity);

    // Implementation for actual export logic would go here
    // This would typically involve querying data and generating files

    return savedExport.id;
  }

  async createExport(
    exportDto: PayoutExportDto,
    userId: string,
  ): Promise<string> {
    return this.exportPayouts(exportDto, userId);
  }

  async getExportStatus(exportId: string): Promise<any> {
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
      createdAt: exportEntity.createdAt,
      completedAt: exportEntity.completedAt,
    };
  }

  async downloadExport(
    exportId: string,
  ): Promise<{ filePath: string; fileName: string }> {
    const exportEntity = await this.exportRepository.findOne({
      where: { id: exportId },
    });

    if (!exportEntity) {
      throw new NotFoundException('Export not found');
    }

    if (exportEntity.status !== 'completed') {
      throw new BadRequestException('Export is not ready for download');
    }

    return {
      filePath: exportEntity.filePath || '',
      fileName: exportEntity.fileName || `export_${exportId}.csv`,
    };
  }

  // Report Generation
  async generateReport(
    reportDto: PayoutReportDto,
    userId: string,
  ): Promise<string> {
    return this.generatePayoutReport(reportDto, userId);
  }

  async generatePayoutReport(
    reportDto: PayoutReportDto,
    userId: string,
  ): Promise<string> {
    const reportEntity = this.reportRepository.create({
      reportType: reportDto.reportType,
      reportName: `${reportDto.reportType}_${Date.now()}`,
      format: reportDto.format,
      dateFrom: reportDto.dateFrom,
      dateTo: reportDto.dateTo,
      parameters: reportDto.parameters,
      createdBy: userId,
    });

    const savedReport = await this.reportRepository.save(reportEntity);

    // Implementation for actual report generation would go here

    return savedReport.id;
  }

  async getReportStatus(reportId: string): Promise<any> {
    const reportEntity = await this.reportRepository.findOne({
      where: { id: reportId },
    });

    if (!reportEntity) {
      throw new NotFoundException('Report not found');
    }

    return {
      reportId: reportEntity.id,
      status: reportEntity.status,
      reportType: reportEntity.reportType,
      createdAt: reportEntity.createdAt,
      completedAt: reportEntity.completedAt,
    };
  }

  async downloadReport(
    reportId: string,
  ): Promise<{ filePath: string; fileName: string }> {
    const reportEntity = await this.reportRepository.findOne({
      where: { id: reportId },
    });

    if (!reportEntity) {
      throw new NotFoundException('Report not found');
    }

    if (reportEntity.status !== 'completed') {
      throw new BadRequestException('Report is not ready for download');
    }

    return {
      filePath: reportEntity.filePath || '',
      fileName: reportEntity.fileName || `report_${reportId}.pdf`,
    };
  }

  async getPartnerPayoutSummary(
    partnerId: string,
    dateFrom?: Date,
    dateTo?: Date,
    userId?: string,
    userRoles?: string[],
  ): Promise<any> {
    // Build query conditions
    const whereConditions: any = {
      partnerId,
    };

    if (dateFrom && dateTo) {
      whereConditions.createdAt = Between(dateFrom, dateTo);
    }

    // Get payout requests for the partner
    const payoutRequests = await this.payoutRequestRepository.find({
      where: whereConditions,
      relations: ['partner'],
    });

    // Calculate summary statistics
    const totalRequests = payoutRequests.length;
    const totalAmount = payoutRequests.reduce(
      (sum, payout) => sum + Number(payout.amount),
      0,
    );
    const approvedAmount = payoutRequests
      .filter((p) => p.status === 'approved')
      .reduce((sum, payout) => sum + Number(payout.amount), 0);
    const pendingAmount = payoutRequests
      .filter((p) => p.status === 'pending')
      .reduce((sum, payout) => sum + Number(payout.amount), 0);
    const rejectedAmount = payoutRequests
      .filter((p) => p.status === 'rejected')
      .reduce((sum, payout) => sum + Number(payout.amount), 0);

    return {
      partnerId,
      totalRequests,
      totalAmount,
      approvedAmount,
      pendingAmount,
      rejectedAmount,
      statusBreakdown: {
        pending: payoutRequests.filter((p) => p.status === 'pending').length,
        approved: payoutRequests.filter((p) => p.status === 'approved').length,
        rejected: payoutRequests.filter((p) => p.status === 'rejected').length,
        processing: payoutRequests.filter((p) => p.status === 'processing')
          .length,
        completed: payoutRequests.filter((p) => p.status === 'completed')
          .length,
      },
    };
  }

  // Settings Management
  async getSettings(): Promise<PayoutSettingsEntity> {
    let settings = await this.settingsRepository.findOne({ where: {} });
    if (!settings) {
      settings = this.settingsRepository.create({});
      settings = await this.settingsRepository.save(settings);
    }
    return settings;
  }

  async updateSettings(
    settingsDto: PayoutSettingsDto,
    userId: string,
  ): Promise<PayoutSettingsEntity> {
    const settings = await this.getSettings();
    Object.assign(settings, settingsDto);
    settings.updatedBy = userId;
    return this.settingsRepository.save(settings);
  }

  // Helper Methods
  private async getOrCreateWallet(
    partnerId: string,
  ): Promise<PartnerWalletEntity> {
    let wallet = await this.walletRepository.findOne({
      where: { partnerId },
    });

    if (!wallet) {
      wallet = this.walletRepository.create({
        partnerId,
        availableBalance: 0,
        pendingBalance: 0,
        totalBalance: 0,
      });
      wallet = await this.walletRepository.save(wallet);
    }

    return wallet;
  }

  private async creditWallet(
    partnerId: string,
    amount: number,
    type: WalletTransactionType,
    description: string,
    referenceId?: string,
    userId?: string,
    manager?: any,
    notes?: string,
    metadata?: Record<string, any>,
  ): Promise<WalletTransactionEntity> {
    const repository = manager || this.walletTransactionRepository;
    const walletRepo = manager
      ? manager.getRepository(PartnerWalletEntity)
      : this.walletRepository;

    const wallet = await this.getOrCreateWallet(partnerId);
    const balanceBefore = wallet.availableBalance;
    const balanceAfter = balanceBefore + amount;

    // Update wallet balance
    wallet.availableBalance = balanceAfter;
    wallet.lastTransactionDate = new Date();
    wallet.updateBalances();
    await walletRepo.save(wallet);

    // Create transaction record
    const transaction = repository.create({
      walletId: wallet.id,
      partnerId,
      type,
      amount,
      balanceBefore,
      balanceAfter,
      description,
      referenceId,
      notes,
      metadata,
      createdBy: userId,
    });

    return repository.save(transaction);
  }

  private async debitWallet(
    partnerId: string,
    amount: number,
    type: WalletTransactionType,
    description: string,
    referenceId?: string,
    userId?: string,
    manager?: any,
    notes?: string,
    metadata?: Record<string, any>,
  ): Promise<WalletTransactionEntity> {
    const repository = manager || this.walletTransactionRepository;
    const walletRepo = manager
      ? manager.getRepository(PartnerWalletEntity)
      : this.walletRepository;

    const wallet = await this.getOrCreateWallet(partnerId);

    if (!wallet.canDebit(amount)) {
      throw new BadRequestException('Insufficient wallet balance');
    }

    const balanceBefore = wallet.availableBalance;
    const balanceAfter = balanceBefore - amount;

    // Update wallet balance
    wallet.availableBalance = balanceAfter;
    wallet.lastTransactionDate = new Date();
    wallet.updateBalances();
    await walletRepo.save(wallet);

    // Create transaction record
    const transaction = repository.create({
      walletId: wallet.id,
      partnerId,
      type,
      amount,
      balanceBefore,
      balanceAfter,
      description,
      referenceId,
      notes,
      metadata,
      createdBy: userId,
    });

    return repository.save(transaction);
  }

  private async createAuditTrail(
    auditData: Partial<PayoutAuditTrailEntity>,
    manager?: any,
  ): Promise<PayoutAuditTrailEntity> {
    const repository = manager || this.auditTrailRepository;
    const audit = repository.create(auditData);
    return repository.save(audit);
  }

  private groupPayoutsByField(payouts: PayoutEntity[], field: string): any[] {
    const groups = payouts.reduce((acc, payout) => {
      const key = payout[field];
      if (!acc[key]) {
        acc[key] = { volume: 0, count: 0 };
      }
      acc[key].volume += Number(payout.amount);
      acc[key].count += 1;
      return acc;
    }, {});

    return Object.entries(groups).map(([key, value]: [string, any]) => ({
      [field === 'type' ? 'type' : 'method']: key,
      volume: value.volume,
      count: value.count,
    }));
  }

  private getStatusDistribution(payouts: PayoutEntity[]): any[] {
    const total = payouts.length;
    const statusCounts = payouts.reduce((acc, payout) => {
      acc[payout.status] = (acc[payout.status] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(statusCounts).map(
      ([status, count]: [string, number]) => ({
        status,
        count,
        percentage: total > 0 ? (count / total) * 100 : 0,
      }),
    );
  }

  // Mapping Methods
  private mapPayoutRequestToResponse(
    request: PayoutRequestEntity,
  ): PayoutRequestResponseDto {
    return {
      id: request.id,
      requestReference: request.requestReference,
      type: request.type,
      status: request.status,
      amount: Number(request.amount),
      currency: request.currency,
      description: request.description,
      partner: request.partner
        ? {
            id: request.partner.id,
            name:
              request.partner.firstName && request.partner.lastName
                ? `${request.partner.firstName} ${request.partner.lastName}`
                : request.partner.username,
            email: request.partner.email,
          }
        : undefined,
      bankAccount: request.bankAccount
        ? {
            id: request.bankAccount.id,
            accountNumber: request.bankAccount.getMaskedAccountNumber(),
            bankName: request.bankAccount.bankName,
            accountHolderName: request.bankAccount.accountHolderName,
          }
        : undefined,
      payoutMethod: request.payoutMethod,
      requestedDate: request.requestedDate,
      approvedDate: request.approvedDate,
      processedDate: request.processedDate,
      completedDate: request.completedDate,
      processingFee: request.processingFee
        ? Number(request.processingFee)
        : undefined,
      netAmount: request.netAmount ? Number(request.netAmount) : undefined,
      notes: request.notes,
      metadata: request.metadata,
      createdAt: request.createdAt,
      updatedAt: request.updatedAt,
      createdBy: request.createdBy,
      updatedBy: request.updatedBy,
    };
  }

  private mapPayoutToResponse(payout: PayoutEntity): PayoutResponseDto {
    return {
      id: payout.id,
      payoutReference: payout.payoutReference,
      requestId: payout.requestId,
      status: payout.status,
      amount: Number(payout.amount),
      processingFee: Number(payout.processingFee),
      netAmount: Number(payout.netAmount),
      currency: payout.currency,
      partner: payout.partner
        ? {
            id: payout.partner.id,
            name:
              payout.partner.firstName && payout.partner.lastName
                ? `${payout.partner.firstName} ${payout.partner.lastName}`
                : payout.partner.username,
            email: payout.partner.email,
          }
        : undefined,
      bankAccount: payout.bankAccount
        ? {
            id: payout.bankAccount.id,
            accountNumber: payout.bankAccount.getMaskedAccountNumber(),
            bankName: payout.bankAccount.bankName,
            accountHolderName: payout.bankAccount.accountHolderName,
          }
        : undefined,
      payoutMethod: payout.payoutMethod,
      bankReference: payout.bankReference,
      externalTransactionId: payout.externalTransactionId,
      processedDate: payout.processedDate,
      completedDate: payout.completedDate,
      notes: payout.notes,
      metadata: payout.metadata,
      createdAt: payout.createdAt,
      updatedAt: payout.updatedAt,
    };
  }

  private mapWalletToResponse(
    wallet: PartnerWalletEntity,
  ): WalletBalanceResponseDto {
    return {
      partnerId: wallet.partnerId,
      availableBalance: Number(wallet.availableBalance),
      pendingBalance: Number(wallet.pendingBalance),
      totalBalance: Number(wallet.totalBalance),
      currency: wallet.currency,
      lastTransactionDate: wallet.lastTransactionDate,
      status: wallet.status,
      updatedAt: wallet.updatedAt,
    };
  }

  private mapWalletTransactionToResponse(
    transaction: WalletTransactionEntity,
  ): WalletTransactionResponseDto {
    return {
      id: transaction.id,
      transactionReference: transaction.transactionReference,
      type: transaction.type,
      amount: Number(transaction.amount),
      balanceAfter: Number(transaction.balanceAfter),
      currency: transaction.currency,
      description: transaction.description,
      referenceId: transaction.referenceId,
      notes: transaction.notes,
      metadata: transaction.metadata,
      createdAt: transaction.createdAt,
      createdBy: transaction.createdBy,
    };
  }

  private mapBankAccountToResponse(
    account: BankAccountEntity,
  ): BankAccountResponseDto {
    return {
      id: account.id,
      accountHolderName: account.accountHolderName,
      accountNumber: account.getMaskedAccountNumber(),
      ifscCode: account.ifscCode,
      bankName: account.bankName,
      branchName: account.branchName,
      accountType: account.accountType,
      status: account.status,
      isPrimary: account.isPrimary,
      partner: account.partner
        ? {
            id: account.partner.id,
            name:
              account.partner.firstName && account.partner.lastName
                ? `${account.partner.firstName} ${account.partner.lastName}`
                : account.partner.username,
            email: account.partner.email,
          }
        : undefined,
      verifiedDate: account.verifiedDate,
      notes: account.notes,
      createdAt: account.createdAt,
      updatedAt: account.updatedAt,
    };
  }

  async getDashboardStats(): Promise<any> {
    const [totalPayouts, pendingPayouts, completedPayouts, totalVolume] =
      await Promise.all([
        this.payoutRepository.count(),
        this.payoutRepository.count({
          where: { status: PayoutStatus.PENDING },
        }),
        this.payoutRepository.count({
          where: { status: PayoutStatus.COMPLETED },
        }),
        this.payoutRepository
          .createQueryBuilder('payout')
          .select('SUM(payout.amount)', 'total')
          .getRawOne(),
      ]);

    return {
      totalPayouts,
      pendingPayouts,
      completedPayouts,
      totalVolume: Number(totalVolume?.total || 0),
      successRate:
        totalPayouts > 0 ? (completedPayouts / totalPayouts) * 100 : 0,
    };
  }

  async reconcilePayouts(
    reconciliationData: any,
    userId: string,
  ): Promise<any> {
    // Implementation for payout reconciliation
    const pendingPayouts = await this.payoutRepository.find({
      where: { status: PayoutStatus.PENDING },
      relations: ['partner', 'bankAccount'],
    });

    const reconciliationResults = [];
    for (const payout of pendingPayouts) {
      // Add reconciliation logic here
      reconciliationResults.push({
        payoutId: payout.id,
        status: 'reconciled',
        message: 'Payout reconciled successfully',
      });
    }

    return {
      totalReconciled: reconciliationResults.length,
      results: reconciliationResults,
    };
  }
}
