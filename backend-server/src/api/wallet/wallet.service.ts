import { UserEntity } from '@/auth/entities/user.entity';
import { FinancialEventSourcingService } from '@/common/events/financial-event-sourcing';
import { AggregateType } from '@/common/events/financial-event-sourcing/financial-aggregate.entity';
import { FinancialEventType } from '@/common/events/financial-event-sourcing/financial-event.entity';
import { EntityType, IdGeneratorService } from '@/utils/id-generator.service';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, DataSource, FindOptionsWhere, In, Repository } from 'typeorm';
import {
  TransactionStatus,
  TransactionType,
  WalletStatus,
} from '../../common/enums/wallet.enum';
import {
  TransactionSource,
  WalletTransactionEntity,
} from '../../database/entities/wallet-transaction.entity';
import {
  CreateWalletDto,
  GetWalletTransactionsDto,
  UpdateWalletDto,
  WalletResponseDto,
  WalletStatsDto,
  WalletSummaryDto,
  WalletTransactionDto,
  WalletTransactionResponseDto,
  WalletTransactionStatus,
  WalletTransactionType,
} from './dto/wallet.dto';
import { WalletEntity } from './entities/wallet.entity';

@Injectable()
export class WalletService {
  constructor(
    @InjectRepository(WalletEntity)
    private walletRepository: Repository<WalletEntity>,
    @InjectRepository(WalletTransactionEntity)
    private transactionRepository: Repository<WalletTransactionEntity>,
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
    private dataSource: DataSource,
    private idGeneratorService: IdGeneratorService,
    private financialEventSourcingService: FinancialEventSourcingService,
    private eventEmitter: EventEmitter2,
  ) {}

  async createWallet(
    createWalletDto: CreateWalletDto,
  ): Promise<WalletResponseDto> {
    // Check if partner exists
    const partner = await this.userRepository.findOne({
      where: { id: createWalletDto.partnerId },
    });

    if (!partner) {
      throw new NotFoundException('Partner not found');
    }

    // Check if wallet already exists for this partner
    const existingWallet = await this.walletRepository.findOne({
      where: { partnerId: createWalletDto.partnerId },
    });

    if (existingWallet) {
      throw new ConflictException('Wallet already exists for this partner');
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Create wallet
      const wallet = this.walletRepository.create({
        ...createWalletDto,
        balance: createWalletDto.initialBalance || 0,
        availableBalance: createWalletDto.initialBalance || 0,
        pendingBalance: 0,
        status: WalletStatus.ACTIVE,
      });

      const savedWallet = await queryRunner.manager.save(WalletEntity, wallet);

      // Create initial transaction if there's an initial balance
      if (createWalletDto.initialBalance > 0) {
        const initialTransaction = this.transactionRepository.create({
          userId: createWalletDto.partnerId,
          walletBalanceId: savedWallet.id,
          transactionId: this.idGeneratorService.generateId(
            EntityType.TRANSACTION,
          ),
          type: TransactionType.CREDIT,
          source: TransactionSource.TOP_UP,
          amount: createWalletDto.initialBalance,
          balanceAfter: createWalletDto.initialBalance,
          currency: savedWallet.currency,
          status: TransactionStatus.COMPLETED,
          description: 'Initial wallet balance',
          processedAt: new Date(),
        });

        await queryRunner.manager.save(
          WalletTransactionEntity,
          initialTransaction,
        );
      }

      await queryRunner.commitTransaction();

      return this.mapToWalletResponse(savedWallet);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async getWalletByPartnerId(partnerId: string): Promise<WalletResponseDto> {
    const wallet = await this.walletRepository.findOne({
      where: { partnerId },
      relations: ['partner'],
    });

    if (!wallet) {
      throw new NotFoundException('Wallet not found');
    }

    return this.mapToWalletResponse(wallet);
  }

  async getWalletById(walletId: string): Promise<WalletResponseDto> {
    const wallet = await this.walletRepository.findOne({
      where: { id: walletId },
      relations: ['partner'],
    });

    if (!wallet) {
      throw new NotFoundException('Wallet not found');
    }

    return this.mapToWalletResponse(wallet);
  }

  async getAllWallets(
    page: number = 1,
    limit: number = 20,
    status?: WalletStatus,
    search?: string,
  ): Promise<{
    wallets: WalletResponseDto[];
    total: number;
    totalPages: number;
  }> {
    const queryBuilder = this.walletRepository
      .createQueryBuilder('wallet')
      .leftJoinAndSelect('wallet.partner', 'partner')
      .orderBy('wallet.createdAt', 'DESC');

    if (status) {
      queryBuilder.andWhere('wallet.status = :status', { status });
    }

    if (search) {
      queryBuilder.andWhere(
        '(partner.businessName ILIKE :search OR partner.email ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    const [wallets, total] = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      wallets: wallets.map((wallet) => this.mapToWalletResponse(wallet)),
      total,
      totalPages: Math.ceil(total / limit),
    };
  }

  async updateWallet(
    walletId: string,
    updateWalletDto: UpdateWalletDto,
    updatedBy: string,
  ): Promise<WalletResponseDto> {
    const wallet = await this.walletRepository.findOne({
      where: { id: walletId },
      relations: ['partner'],
    });

    if (!wallet) {
      throw new NotFoundException('Wallet not found');
    }

    // Handle status changes
    if (updateWalletDto.status && updateWalletDto.status !== wallet.status) {
      if (updateWalletDto.status === WalletStatus.FROZEN) {
        wallet.frozenAt = new Date();
        wallet.frozenBy = updatedBy;
        wallet.frozenReason = updateWalletDto.notes || 'Wallet frozen by admin';
      } else if (wallet.status === WalletStatus.FROZEN) {
        wallet.frozenAt = null;
        wallet.frozenBy = null;
        wallet.frozenReason = null;
      }
    }

    Object.assign(wallet, updateWalletDto);
    const updatedWallet = await this.walletRepository.save(wallet);

    return this.mapToWalletResponse(updatedWallet);
  }

  // Removed duplicate methods - using the ones at the end of the file

  async processTransaction(
    walletId: string,
    transactionDto: WalletTransactionDto,
    processedBy?: string,
  ): Promise<WalletTransactionResponseDto> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Get wallet with lock
      const wallet = await queryRunner.manager.findOne(WalletEntity, {
        where: { id: walletId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!wallet) {
        throw new NotFoundException('Wallet not found');
      }

      if (!wallet.canTransact) {
        throw new ForbiddenException('Wallet is not active for transactions');
      }

      const isCredit = [
        WalletTransactionType.CREDIT,
        WalletTransactionType.COMMISSION,
        WalletTransactionType.REFUND,
      ].includes(transactionDto.type);

      const isDebit = [
        WalletTransactionType.DEBIT,
        WalletTransactionType.PAYOUT,
        WalletTransactionType.FEE,
      ].includes(transactionDto.type);

      // Check balance for debit transactions
      if (isDebit && wallet.availableBalance < transactionDto.amount) {
        throw new BadRequestException('Insufficient balance');
      }

      // Calculate new balances
      const balanceBefore = wallet.balance;
      let balanceAfter: number;

      if (isCredit) {
        balanceAfter = balanceBefore + transactionDto.amount;
        wallet.balance = balanceAfter;
        wallet.availableBalance = balanceAfter - wallet.pendingBalance;
      } else if (isDebit) {
        balanceAfter = balanceBefore - transactionDto.amount;
        wallet.balance = balanceAfter;
        wallet.availableBalance = balanceAfter - wallet.pendingBalance;
      } else {
        balanceAfter = balanceBefore;
      }

      // Create transaction record
      const transaction = this.transactionRepository.create({
        walletBalanceId: wallet.id,
        userId: wallet.partnerId,
        type: TransactionType.CREDIT,
        amount: transactionDto.amount,
        balanceAfter,
        status: TransactionStatus.COMPLETED,
        description: transactionDto.description,
        referenceId: transactionDto.referenceId,
        referenceType: transactionDto.referenceType,
        metadata: transactionDto.metadata,
        processedAt: new Date(),
        source: TransactionSource.TOP_UP,
        transactionId: this.idGeneratorService.generateId(
          EntityType.TRANSACTION,
        ),
      });

      // Update wallet
      wallet.lastTransactionAt = new Date();
      await queryRunner.manager.save(WalletEntity, wallet);

      // Save transaction
      const savedTransaction = await queryRunner.manager.save(
        WalletTransactionEntity,
        transaction,
      );

      await queryRunner.commitTransaction();

      return this.mapToTransactionResponse(savedTransaction);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async getWalletTransactions(
    partnerId: string,
    query: GetWalletTransactionsDto,
    user?: any,
  ): Promise<{
    transactions: WalletTransactionResponseDto[];
    total: number;
    totalPages: number;
  }> {
    // Find wallet by partnerId
    const wallet = await this.walletRepository.findOne({
      where: { partnerId },
    });

    if (!wallet) {
      throw new NotFoundException('Wallet not found');
    }

    const queryBuilder = this.transactionRepository
      .createQueryBuilder('transaction')
      .where('transaction.walletBalanceId = :walletId', { walletId: wallet.id })
      .orderBy(`transaction.${query.sortBy}`, query.sortOrder);

    if (query.type) {
      queryBuilder.andWhere('transaction.type = :type', { type: query.type });
    }

    if (query.status) {
      queryBuilder.andWhere('transaction.status = :status', {
        status: query.status,
      });
    }

    if (query.startDate && query.endDate) {
      queryBuilder.andWhere(
        'transaction.createdAt BETWEEN :startDate AND :endDate',
        {
          startDate: query.startDate,
          endDate: query.endDate,
        },
      );
    }

    if (query.search) {
      queryBuilder.andWhere(
        '(transaction.description ILIKE :search OR transaction.referenceId ILIKE :search)',
        { search: `%${query.search}%` },
      );
    }

    const [transactions, total] = await queryBuilder
      .skip((query.page - 1) * query.limit)
      .take(query.limit)
      .getManyAndCount();

    return {
      transactions: transactions.map((transaction) =>
        this.mapToTransactionResponse(transaction),
      ),
      total,
      totalPages: Math.ceil(total / query.limit),
    };
  }

  async getWalletStats(
    walletId: string,
    days: number = 30,
  ): Promise<WalletStatsDto> {
    const wallet = await this.walletRepository.findOne({
      where: { id: walletId },
    });
    if (!wallet) {
      throw new NotFoundException('Wallet not found');
    }

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get transaction statistics
    const transactions = await this.transactionRepository.find({
      where: {
        walletBalanceId: walletId,
        createdAt: Between(startDate, new Date()),
        status: TransactionStatus.COMPLETED,
      },
      order: { createdAt: 'ASC' },
    });

    const stats = {
      totalCredits: 0,
      totalDebits: 0,
      totalCommissions: 0,
      totalPayouts: 0,
      totalTransactions: transactions.length,
      averageTransactionAmount: 0,
      currentBalance: wallet.balance,
      pendingAmount: wallet.pendingBalance,
      monthlyGrowth: 0,
      transactionsByType: {} as Record<WalletTransactionType, number>,
      transactionsByStatus: {} as Record<
        keyof typeof WalletTransactionStatus,
        number
      >,
      dailyTrends: [] as Array<{
        date: string;
        credits: number;
        debits: number;
        balance: number;
        transactionCount: number;
      }>,
    };

    // Calculate totals and categorize transactions
    let totalAmount = 0;
    const dailyData = new Map<string, any>();

    transactions.forEach((transaction) => {
      totalAmount += transaction.amount;

      // Type-based totals
      if (transaction.type === TransactionType.CREDIT) {
        stats.totalCredits += transaction.amount;
      } else if (transaction.type === TransactionType.DEBIT) {
        stats.totalDebits += transaction.amount;
      }

      if (transaction.type === TransactionType.CREDIT) {
        stats.totalCommissions += transaction.amount;
      }

      if (transaction.type === TransactionType.WITHDRAWAL) {
        stats.totalPayouts += transaction.amount;
      }

      // Count by type and status
      const walletTransactionType = this.mapTransactionTypeToWalletType(
        transaction.type,
      );
      stats.transactionsByType[walletTransactionType] =
        (stats.transactionsByType[walletTransactionType] || 0) + 1;

      const walletTransactionStatus = this.mapTransactionStatusToWalletStatus(
        transaction.status,
      );
      stats.transactionsByStatus[walletTransactionStatus] =
        (stats.transactionsByStatus[walletTransactionStatus] || 0) + 1;

      // Daily trends
      const dateKey = transaction.createdAt.toISOString().split('T')[0];
      if (!dailyData.has(dateKey)) {
        dailyData.set(dateKey, {
          date: dateKey,
          credits: 0,
          debits: 0,
          balance: transaction.balanceAfter,
          transactionCount: 0,
        });
      }

      const dayData = dailyData.get(dateKey);
      if (transaction.type === TransactionType.CREDIT) {
        dayData.credits += transaction.amount;
      } else if (transaction.type === TransactionType.DEBIT) {
        dayData.debits += transaction.amount;
      }
      dayData.transactionCount++;
      dayData.balance = transaction.balanceAfter;
    });

    stats.averageTransactionAmount =
      transactions.length > 0 ? totalAmount / transactions.length : 0;
    stats.dailyTrends = Array.from(dailyData.values()).sort((a, b) =>
      a.date.localeCompare(b.date),
    );

    // Calculate monthly growth (simplified)
    if (stats.dailyTrends.length > 1) {
      const firstBalance = stats.dailyTrends[0].balance;
      const lastBalance =
        stats.dailyTrends[stats.dailyTrends.length - 1].balance;
      stats.monthlyGrowth =
        firstBalance > 0
          ? ((lastBalance - firstBalance) / firstBalance) * 100
          : 0;
    }

    return stats;
  }

  async getPartnerWallet(
    partnerId: string,
    user?: any,
  ): Promise<WalletResponseDto> {
    return this.getWalletByPartnerId(partnerId);
  }

  async getPartnerWalletStats(
    partnerId: string,
    options: { startDate?: Date; endDate?: Date },
    user?: any,
  ): Promise<WalletStatsDto> {
    const wallet = await this.walletRepository.findOne({
      where: { partnerId },
    });

    if (!wallet) {
      throw new NotFoundException('Wallet not found');
    }

    const now = new Date();
    const startDate =
      options.startDate || new Date(now.getFullYear(), now.getMonth(), 1);
    const endDate = options.endDate || now;

    const transactions = await this.transactionRepository.find({
      where: {
        walletBalanceId: wallet.id,
        createdAt: Between(startDate, endDate),
        status: TransactionStatus.COMPLETED,
      },
      order: { createdAt: 'ASC' },
    });

    const totalCredits = transactions
      .filter((t) => t.type === TransactionType.CREDIT)
      .reduce((sum, t) => sum + t.amount, 0);

    const totalDebits = transactions
      .filter((t) => t.type === TransactionType.DEBIT)
      .reduce((sum, t) => sum + t.amount, 0);

    const totalCommissions = transactions
      .filter((t) => t.type === TransactionType.COMMISSION)
      .reduce((sum, t) => sum + t.amount, 0);

    const totalPayouts = transactions
      .filter((t) => t.type === TransactionType.WITHDRAWAL)
      .reduce((sum, t) => sum + t.amount, 0);

    const averageTransactionAmount =
      transactions.length > 0
        ? transactions.reduce((sum, t) => sum + t.amount, 0) /
          transactions.length
        : 0;

    // Group transactions by type
    const transactionsByType = transactions.reduce(
      (acc, t) => {
        const walletType = this.mapTransactionTypeToWalletType(t.type);
        acc[walletType] = (acc[walletType] || 0) + 1;
        return acc;
      },
      {} as Record<WalletTransactionType, number>,
    );

    // Group transactions by status
    const transactionsByStatus = transactions.reduce(
      (acc, t) => {
        const walletStatus = this.mapTransactionStatusToWalletStatus(t.status);
        acc[walletStatus] = (acc[walletStatus] || 0) + 1;
        return acc;
      },
      {} as Record<keyof typeof WalletTransactionStatus, number>,
    );

    // Generate daily trends (simplified)
    const dailyTrends = [];

    return {
      totalTransactions: transactions.length,
      totalCredits,
      totalDebits,
      totalCommissions,
      totalPayouts,
      averageTransactionAmount,
      currentBalance: wallet.balance,
      pendingAmount: wallet.pendingBalance,
      monthlyGrowth: 0,
      transactionsByType,
      transactionsByStatus,
      dailyTrends,
    };
  }

  async getWalletSummary(
    partnerId: string,
    user?: any,
  ): Promise<WalletSummaryDto> {
    const wallet = await this.walletRepository.findOne({
      where: { partnerId },
    });

    if (!wallet) {
      throw new NotFoundException('Wallet not found');
    }

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Get recent transactions
    const recentTransactions = await this.transactionRepository.find({
      where: { walletBalanceId: wallet.id },
      order: { createdAt: 'DESC' },
      take: 5,
    });

    // Get monthly stats
    const monthlyTransactions = await this.transactionRepository.find({
      where: {
        walletBalanceId: wallet.id,
        createdAt: Between(startOfMonth, now),
        status: TransactionStatus.COMPLETED,
      },
    });

    const thisMonthEarnings = monthlyTransactions
      .filter((t) => t.type === TransactionType.CREDIT)
      .reduce((sum, t) => sum + t.amount, 0);

    const thisMonthPayouts = monthlyTransactions
      .filter((t) => t.type === TransactionType.WITHDRAWAL)
      .reduce((sum, t) => sum + t.amount, 0);

    // Get all-time stats
    const allTransactions = await this.transactionRepository.find({
      where: {
        walletBalanceId: wallet.id,
        status: TransactionStatus.COMPLETED,
      },
    });

    const totalEarnings = allTransactions
      .filter((t) => t.type === TransactionType.CREDIT)
      .reduce((sum, t) => sum + t.amount, 0);

    const totalPayouts = allTransactions
      .filter((t) => t.type === TransactionType.WITHDRAWAL)
      .reduce((sum, t) => sum + t.amount, 0);

    // Get pending payout requests (assuming they exist in another table)
    const pendingPayoutRequests = 0; // This would come from payout requests table

    // Get last payout date
    const lastPayout = await this.transactionRepository.findOne({
      where: {
        walletBalanceId: wallet.id,
        type: In([TransactionType.WITHDRAWAL]),
        status: TransactionStatus.COMPLETED,
      },
      order: { createdAt: 'DESC' },
    });

    return {
      currentBalance: wallet.balance,
      availableBalance: wallet.availableBalance,
      pendingBalance: wallet.pendingBalance,
      totalEarnings,
      totalPayouts,
      thisMonthEarnings,
      thisMonthPayouts,
      pendingPayoutRequests,
      lastPayoutDate: lastPayout?.createdAt,
      nextPayoutDate: null, // This would be calculated based on payout schedule
      recentTransactions: recentTransactions.map((t) => ({
        id: t.id,
        type: this.mapTransactionTypeToWalletType(t.type),
        amount: t.amount,
        description: t.description || '',
        createdAt: t.createdAt,
        status: this.mapTransactionStatusToWalletStatus(t.status),
      })),
      quickStats: {
        totalTransactions: allTransactions.length,
        successRate:
          allTransactions.length > 0
            ? (allTransactions.filter(
                (t) => t.status === TransactionStatus.COMPLETED,
              ).length /
                allTransactions.length) *
              100
            : 0,
        averageTransactionAmount:
          allTransactions.length > 0
            ? allTransactions.reduce((sum, t) => sum + t.amount, 0) /
              allTransactions.length
            : 0,
        monthlyGrowthRate: 0, // This would be calculated based on historical data
      },
    };
  }

  async freezeWallet(
    partnerId: string,
    reason: string,
    frozenBy: string,
  ): Promise<WalletResponseDto> {
    const wallet = await this.walletRepository.findOne({
      where: { partnerId },
    });

    if (!wallet) {
      throw new NotFoundException('Wallet not found');
    }

    return this.updateWallet(
      wallet.id,
      {
        status: WalletStatus.FROZEN,
        notes: reason,
      },
      frozenBy,
    );
  }

  async unfreezeWallet(
    partnerId: string,
    reason: string,
    unfrozenBy: string,
  ): Promise<WalletResponseDto> {
    const wallet = await this.walletRepository.findOne({
      where: { partnerId },
    });

    if (!wallet) {
      throw new NotFoundException('Wallet not found');
    }

    return this.updateWallet(
      wallet.id,
      {
        status: WalletStatus.ACTIVE,
        notes: reason || 'Wallet unfrozen',
      },
      unfrozenBy,
    );
  }

  async getWalletBalance(partnerId: string, user?: any) {
    const wallet = await this.walletRepository.findOne({
      where: { partnerId },
    });

    if (!wallet) {
      throw new NotFoundException('Wallet not found');
    }

    return {
      balance: wallet.balance,
      availableBalance: wallet.availableBalance,
      pendingBalance: wallet.pendingBalance,
      currency: wallet.currency,
    };
  }

  /**
   * Add balance to user wallet (for backward compatibility with wallet-job.processor)
   */
  async addBalance(
    userId: string,
    amount: number,
    type: string,
    description: string,
    referenceId?: string,
  ): Promise<WalletTransactionResponseDto> {
    const transactionDto: WalletTransactionDto = {
      amount,
      type: type as WalletTransactionType,
      description,
      referenceId,
      referenceType: 'system',
      metadata: {
        source: 'job_processor',
        originalType: type,
      },
    };

    return this.creditWallet(userId, transactionDto, 'system');
  }

  /**
   * Deduct balance from user wallet (for backward compatibility with wallet-job.processor)
   */
  async deductBalance(
    userId: string,
    amount: number,
    type: string,
    description: string,
    referenceId?: string,
  ): Promise<WalletTransactionResponseDto> {
    const transactionDto: WalletTransactionDto = {
      amount,
      type: type as WalletTransactionType,
      description,
      referenceId,
      referenceType: 'system',
      metadata: {
        source: 'job_processor',
        originalType: type,
      },
    };

    return this.debitWallet(userId, transactionDto, 'system');
  }

  async getPendingSettlements(partnerId: string, user?: any) {
    const wallet = await this.walletRepository.findOne({
      where: { partnerId },
    });

    if (!wallet) {
      throw new NotFoundException('Wallet not found');
    }

    const pendingTransactions = await this.transactionRepository.find({
      where: {
        walletBalanceId: wallet.id,
        status: TransactionStatus.PENDING,
      },
      order: { createdAt: 'DESC' },
    });

    return {
      settlements: pendingTransactions.map((t) =>
        this.mapToTransactionResponse(t),
      ),
      totalAmount: pendingTransactions.reduce((sum, t) => sum + t.amount, 0),
      count: pendingTransactions.length,
    };
  }

  async creditWallet(
    partnerId: string,
    transactionDto: WalletTransactionDto,
    userId: string,
  ) {
    const wallet = await this.walletRepository.findOne({
      where: { partnerId },
    });

    if (!wallet) {
      throw new NotFoundException('Wallet not found');
    }

    const transaction = this.transactionRepository.create({
      userId: partnerId,
      walletBalanceId: wallet.id,
      transactionId: this.idGeneratorService.generateId(EntityType.TRANSACTION),
      type: TransactionType.CREDIT,
      source: TransactionSource.ADMIN_ADJUSTMENT,
      amount: transactionDto.amount,
      balanceAfter: wallet.balance + transactionDto.amount,
      currency: wallet.currency,
      status: TransactionStatus.COMPLETED,
      description: transactionDto.description || 'Credit transaction',
      referenceId: transactionDto.referenceId,
      referenceType: transactionDto.referenceType,
      processedAt: new Date(),
      metadata: {
        initiatedBy: userId,
        ...transactionDto.metadata,
      },
    });

    // Update wallet balance
    wallet.balance += transactionDto.amount;
    wallet.availableBalance = wallet.balance - wallet.pendingBalance;
    wallet.lastTransactionAt = new Date();

    await this.walletRepository.save(wallet);
    const savedTransaction = await this.transactionRepository.save(transaction);

    // Emit wallet credited event
    this.eventEmitter.emit('wallet.credited', {
      walletId: wallet.id,
      partnerId: wallet.partnerId,
      amount: transactionDto.amount,
      currency: wallet.currency,
      transactionId: savedTransaction.transactionId,
      balanceAfter: wallet.balance,
      metadata: savedTransaction.metadata,
    });

    // Store financial event
    await this.financialEventSourcingService.storeEvent({
      aggregateId: wallet.partnerId,
      aggregateType: AggregateType.WALLET,
      eventType: FinancialEventType.WALLET_CREDITED,
      eventData: {
        walletId: wallet.id,
        amount: transactionDto.amount,
        currency: wallet.currency,
        transactionId: savedTransaction.transactionId,
        balanceAfter: wallet.balance,
        availableBalanceAfter: wallet.availableBalance,
        description: transactionDto.description,
        source: TransactionSource.ADMIN_ADJUSTMENT,
      },
      metadata: {
        initiatedBy: userId,
        timestamp: new Date().toISOString(),
        ...transactionDto.metadata,
      },
      userId: partnerId,
      partnerId: wallet.partnerId,
      amount: transactionDto.amount,
      currency: wallet.currency,
    });

    return this.mapToTransactionResponse(savedTransaction);
  }

  async debitWallet(
    partnerId: string,
    transactionDto: WalletTransactionDto,
    userId: string,
  ) {
    const wallet = await this.walletRepository.findOne({
      where: { partnerId },
    });

    if (!wallet) {
      throw new NotFoundException('Wallet not found');
    }

    if (wallet.availableBalance < transactionDto.amount) {
      throw new BadRequestException('Insufficient balance');
    }

    const transaction = this.transactionRepository.create({
      userId: partnerId,
      walletBalanceId: wallet.id,
      transactionId: this.idGeneratorService.generateId(EntityType.TRANSACTION),
      type: TransactionType.DEBIT,
      source: TransactionSource.ADMIN_ADJUSTMENT,
      amount: transactionDto.amount,
      balanceAfter: wallet.balance - transactionDto.amount,
      currency: wallet.currency,
      status: TransactionStatus.COMPLETED,
      description: transactionDto.description || 'Debit transaction',
      referenceId: transactionDto.referenceId,
      referenceType: transactionDto.referenceType,
      processedAt: new Date(),
      metadata: {
        initiatedBy: userId,
        ...transactionDto.metadata,
      },
    });

    // Update wallet balance
    wallet.balance -= transactionDto.amount;
    wallet.availableBalance = wallet.balance - wallet.pendingBalance;
    wallet.lastTransactionAt = new Date();

    await this.walletRepository.save(wallet);
    const savedTransaction = await this.transactionRepository.save(transaction);

    // Emit wallet debited event
    this.eventEmitter.emit('wallet.debited', {
      walletId: wallet.id,
      partnerId: wallet.partnerId,
      amount: transactionDto.amount,
      currency: wallet.currency,
      transactionId: savedTransaction.transactionId,
      balanceAfter: wallet.balance,
      metadata: savedTransaction.metadata,
    });

    // Store financial event
    await this.financialEventSourcingService.storeEvent({
      aggregateId: wallet.partnerId,
      aggregateType: AggregateType.WALLET,
      eventType: FinancialEventType.WALLET_DEBITED,
      eventData: {
        walletId: wallet.id,
        amount: transactionDto.amount,
        currency: wallet.currency,
        transactionId: savedTransaction.transactionId,
        balanceAfter: wallet.balance,
        availableBalanceAfter: wallet.availableBalance,
        description: transactionDto.description,
        source: TransactionSource.ADMIN_ADJUSTMENT,
      },
      metadata: {
        initiatedBy: userId,
        timestamp: new Date().toISOString(),
        ...transactionDto.metadata,
      },
      userId: partnerId,
      partnerId: wallet.partnerId,
      amount: transactionDto.amount,
      currency: wallet.currency,
    });

    return this.mapToTransactionResponse(savedTransaction);
  }

  async requestPayout(
    partnerId: string,
    body: { amount: number; notes?: string },
    user: any,
  ) {
    const wallet = await this.walletRepository.findOne({
      where: { partnerId },
    });

    if (!wallet) {
      throw new NotFoundException('Wallet not found');
    }

    if (wallet.availableBalance < body.amount) {
      throw new BadRequestException('Insufficient balance for payout');
    }

    const transaction = this.transactionRepository.create({
      userId: partnerId,
      walletBalanceId: wallet.id,
      transactionId: this.idGeneratorService.generateId(EntityType.TRANSACTION),
      type: TransactionType.WITHDRAWAL,
      source: TransactionSource.WITHDRAWAL,
      amount: body.amount,
      balanceAfter: wallet.balance - body.amount,
      currency: wallet.currency,
      status: TransactionStatus.PENDING,
      description: body.notes || 'Payout request',
      processedAt: null,
      metadata: {
        initiatedBy: user?.id || partnerId,
        notes: body.notes,
      },
    });

    // Update wallet pending balance
    wallet.pendingBalance += body.amount;
    wallet.availableBalance = wallet.balance - wallet.pendingBalance;
    wallet.lastTransactionAt = new Date();

    await this.walletRepository.save(wallet);
    const savedTransaction = await this.transactionRepository.save(transaction);

    return this.mapToTransactionResponse(savedTransaction);
  }

  private mapToWalletResponse(wallet: WalletEntity): WalletResponseDto {
    return {
      id: wallet.id,
      partnerId: wallet.partnerId,
      balance: wallet.balance,
      availableBalance: wallet.availableBalance,
      pendingBalance: wallet.pendingBalance,
      currency: wallet.currency,
      status: wallet.status,
      minBalanceThreshold: wallet.minBalanceThreshold,
      maxBalanceLimit: wallet.maxBalanceLimit,
      autoPayoutEnabled: wallet.autoPayoutEnabled,
      autoPayoutThreshold: wallet.autoPayoutThreshold,
      createdAt: wallet.createdAt,
      updatedAt: wallet.updatedAt,
      lastTransactionAt: wallet.lastTransactionAt,
      partner: wallet.partner
        ? {
            id: wallet.partner.id,
            businessName:
              (wallet.partner as any).businessName ||
              wallet.partner.firstName + ' ' + wallet.partner.lastName,
            email: wallet.partner.email,
          }
        : undefined,
    };
  }

  private mapTransactionType(
    type: WalletTransactionType,
  ): WalletTransactionType {
    // Return the same type since it's already WalletTransactionType
    return type;
  }

  private mapTransactionTypeToWalletType(
    type: TransactionType,
  ): WalletTransactionType {
    const typeMapping = {
      [TransactionType.CREDIT]: WalletTransactionType.CREDIT,
      [TransactionType.DEBIT]: WalletTransactionType.DEBIT,
      [TransactionType.TRANSFER]: WalletTransactionType.ADJUSTMENT,
      [TransactionType.WITHDRAWAL]: WalletTransactionType.PAYOUT,
    };
    return typeMapping[type] || WalletTransactionType.ADJUSTMENT;
  }

  private mapTransactionStatusToWalletStatus(
    status: TransactionStatus,
  ): keyof typeof WalletTransactionStatus {
    const statusMapping = {
      [TransactionStatus.PENDING]: 'PENDING' as const,
      [TransactionStatus.COMPLETED]: 'COMPLETED' as const,
      [TransactionStatus.FAILED]: 'FAILED' as const,
      [TransactionStatus.CANCELLED]: 'CANCELLED' as const,
    };
    return statusMapping[status] || 'PENDING';
  }

  private mapToTransactionResponse(
    transaction: WalletTransactionEntity,
  ): WalletTransactionResponseDto {
    // Map TransactionType to WalletTransactionType
    const typeMapping = {
      [TransactionType.CREDIT]: WalletTransactionType.CREDIT,
      [TransactionType.DEBIT]: WalletTransactionType.DEBIT,
      [TransactionType.TRANSFER]: WalletTransactionType.ADJUSTMENT,
      [TransactionType.WITHDRAWAL]: WalletTransactionType.PAYOUT,
    };

    // Map TransactionStatus to WalletTransactionStatus keys
    const statusMapping = {
      [TransactionStatus.PENDING]: 'PENDING' as const,
      [TransactionStatus.COMPLETED]: 'COMPLETED' as const,
      [TransactionStatus.FAILED]: 'FAILED' as const,
      [TransactionStatus.CANCELLED]: 'CANCELLED' as const,
    };

    return {
      id: transaction.id,
      walletId: transaction.walletBalanceId,
      partnerId: transaction.userId, // Using userId as partnerId
      type: typeMapping[transaction.type] || WalletTransactionType.ADJUSTMENT,
      amount: transaction.amount,
      balanceBefore: 0, // Not available in current entity
      balanceAfter: transaction.balanceAfter,
      status: statusMapping[transaction.status] || 'PENDING',
      description: transaction.description,
      referenceId: transaction.referenceId,
      referenceType: transaction.referenceType,
      metadata: transaction.metadata,
      createdAt: transaction.createdAt,
      updatedAt: transaction.updatedAt,
      processedBy: transaction.metadata?.initiatedBy || null,
      processedAt: transaction.processedAt,
    };
  }
}
