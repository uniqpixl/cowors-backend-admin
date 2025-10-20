import { FinancialEventSourcingService } from '@/common/events/financial-event-sourcing';
import { AggregateType } from '@/common/events/financial-event-sourcing/financial-aggregate.entity';
import { FinancialEventType } from '@/common/events/financial-event-sourcing/financial-event.entity';
import { EntityType, IdGeneratorService } from '@/utils/id-generator.service';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import {
  TransactionStatus,
  TransactionType,
} from '../../../common/enums/wallet.enum';
import {
  TransactionSource,
  WalletTransactionEntity,
} from '../../../database/entities/wallet-transaction.entity';
import { WalletEntity } from '../entities/wallet.entity';

export interface CurrencyExchangeDto {
  fromCurrency: string;
  toCurrency: string;
  amount: number;
  exchangeRate: number;
  description?: string;
  metadata?: Record<string, any>;
}

export interface MultiCurrencyWalletDto {
  partnerId: string;
  currencies: string[];
  baseCurrency: string;
  autoConversion?: boolean;
  conversionThresholds?: Record<string, number>;
}

@Injectable()
export class WalletMultiCurrencyService {
  constructor(
    @InjectRepository(WalletEntity)
    private walletRepository: Repository<WalletEntity>,
    @InjectRepository(WalletTransactionEntity)
    private transactionRepository: Repository<WalletTransactionEntity>,
    private dataSource: DataSource,
    private idGeneratorService: IdGeneratorService,
    private financialEventSourcingService: FinancialEventSourcingService,
    private eventEmitter: EventEmitter2,
  ) {}

  /**
   * Create multi-currency wallet support for a partner
   */
  async enableMultiCurrency(
    partnerId: string,
    currencies: string[],
    baseCurrency: string,
    userId: string,
  ): Promise<WalletEntity[]> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Check if primary wallet exists
      const primaryWallet = await queryRunner.manager.findOne(WalletEntity, {
        where: { partnerId, currency: baseCurrency },
      });

      if (!primaryWallet) {
        throw new NotFoundException('Primary wallet not found');
      }

      const wallets: WalletEntity[] = [primaryWallet];

      // Create additional currency wallets
      for (const currency of currencies) {
        if (currency === baseCurrency) continue;

        const existingWallet = await queryRunner.manager.findOne(WalletEntity, {
          where: { partnerId, currency },
        });

        if (!existingWallet) {
          const newWallet = queryRunner.manager.create(WalletEntity, {
            id: this.idGeneratorService.generateId(EntityType.WALLET),
            partnerId,
            balance: 0,
            availableBalance: 0,
            pendingBalance: 0,
            currency,
            status: primaryWallet.status,
            minBalanceThreshold: 0,
            maxBalanceLimit: primaryWallet.maxBalanceLimit,
            autoPayoutEnabled: false,
            autoPayoutThreshold: 0,
            metadata: {
              isMultiCurrency: true,
              baseCurrency,
              createdBy: userId,
            },
          });

          const savedWallet = await queryRunner.manager.save(
            WalletEntity,
            newWallet,
          );
          wallets.push(savedWallet);

          // Create initial transaction for new wallet
          const initialTransaction = queryRunner.manager.create(
            WalletTransactionEntity,
            {
              userId: partnerId,
              walletBalanceId: savedWallet.id,
              transactionId: this.idGeneratorService.generateId(
                EntityType.TRANSACTION,
              ),
              type: TransactionType.CREDIT,
              source: TransactionSource.WALLET_CREATION,
              amount: 0,
              balanceAfter: 0,
              currency,
              status: TransactionStatus.COMPLETED,
              description: `Multi-currency wallet created for ${currency}`,
              processedAt: new Date(),
              metadata: {
                initiatedBy: 'system',
                notes: `Initial transaction for multi-currency wallet creation. Base currency: ${baseCurrency}. Created by: ${userId}`,
              },
            },
          );

          await queryRunner.manager.save(
            WalletTransactionEntity,
            initialTransaction,
          );
        } else {
          wallets.push(existingWallet);
        }
      }

      // Update primary wallet metadata
      primaryWallet.metadata = {
        ...primaryWallet.metadata,
        isMultiCurrency: true,
        supportedCurrencies: currencies,
        baseCurrency,
      };
      await queryRunner.manager.save(WalletEntity, primaryWallet);

      await queryRunner.commitTransaction();

      // Emit event
      this.eventEmitter.emit('wallet.multi.currency.enabled', {
        partnerId,
        currencies,
        baseCurrency,
        walletIds: wallets.map((w) => w.id),
        metadata: { enabledBy: userId },
      });

      // Store financial event
      await this.financialEventSourcingService.storeEvent({
        aggregateId: partnerId,
        aggregateType: AggregateType.WALLET,
        eventType: FinancialEventType.MULTI_CURRENCY_ENABLED,
        eventData: {
          partnerId,
          currencies,
          baseCurrency,
          walletIds: wallets.map((w) => w.id),
        },
        metadata: {
          enabledBy: userId,
          timestamp: new Date().toISOString(),
        },
        userId: partnerId,
        partnerId,
      });

      return wallets;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Exchange currency between wallets
   */
  async exchangeCurrency(
    partnerId: string,
    exchangeDto: CurrencyExchangeDto,
    userId: string,
  ): Promise<{
    debitTransaction: WalletTransactionEntity;
    creditTransaction: WalletTransactionEntity;
  }> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Get source wallet
      const sourceWallet = await queryRunner.manager.findOne(WalletEntity, {
        where: { partnerId, currency: exchangeDto.fromCurrency },
        lock: { mode: 'pessimistic_write' },
      });

      if (!sourceWallet) {
        throw new NotFoundException(
          `Source wallet for ${exchangeDto.fromCurrency} not found`,
        );
      }

      // Get destination wallet
      const destWallet = await queryRunner.manager.findOne(WalletEntity, {
        where: { partnerId, currency: exchangeDto.toCurrency },
        lock: { mode: 'pessimistic_write' },
      });

      if (!destWallet) {
        throw new NotFoundException(
          `Destination wallet for ${exchangeDto.toCurrency} not found`,
        );
      }

      if (sourceWallet.availableBalance < exchangeDto.amount) {
        throw new BadRequestException(
          'Insufficient balance for currency exchange',
        );
      }

      const convertedAmount = exchangeDto.amount * exchangeDto.exchangeRate;

      // Create debit transaction for source wallet
      const debitTransaction = queryRunner.manager.create(
        WalletTransactionEntity,
        {
          userId: partnerId,
          walletBalanceId: sourceWallet.id,
          transactionId: this.idGeneratorService.generateId(
            EntityType.TRANSACTION,
          ),
          type: TransactionType.DEBIT,
          source: TransactionSource.CURRENCY_EXCHANGE,
          amount: exchangeDto.amount,
          balanceAfter: sourceWallet.balance - exchangeDto.amount,
          currency: exchangeDto.fromCurrency,
          status: TransactionStatus.COMPLETED,
          description:
            exchangeDto.description ||
            `Currency exchange: ${exchangeDto.fromCurrency} to ${exchangeDto.toCurrency}`,
          processedAt: new Date(),
          metadata: {
            exchangeRate: exchangeDto.exchangeRate,
            toCurrency: exchangeDto.toCurrency,
            convertedAmount,
            initiatedBy: userId,
            ...exchangeDto.metadata,
          },
        },
      );

      // Create credit transaction for destination wallet
      const creditTransaction = queryRunner.manager.create(
        WalletTransactionEntity,
        {
          userId: partnerId,
          walletBalanceId: destWallet.id,
          transactionId: this.idGeneratorService.generateId(
            EntityType.TRANSACTION,
          ),
          type: TransactionType.CREDIT,
          source: TransactionSource.CURRENCY_EXCHANGE,
          amount: convertedAmount,
          balanceAfter: destWallet.balance + convertedAmount,
          currency: exchangeDto.toCurrency,
          status: TransactionStatus.COMPLETED,
          description:
            exchangeDto.description ||
            `Currency exchange: ${exchangeDto.fromCurrency} to ${exchangeDto.toCurrency}`,
          referenceId: debitTransaction.transactionId,
          processedAt: new Date(),
          metadata: {
            exchangeRate: exchangeDto.exchangeRate,
            fromCurrency: exchangeDto.fromCurrency,
            originalAmount: exchangeDto.amount,
            initiatedBy: userId,
            ...exchangeDto.metadata,
          },
        },
      );

      // Update wallet balances
      sourceWallet.balance -= exchangeDto.amount;
      sourceWallet.availableBalance =
        sourceWallet.balance - sourceWallet.pendingBalance;
      sourceWallet.lastTransactionAt = new Date();

      destWallet.balance += convertedAmount;
      destWallet.availableBalance =
        destWallet.balance - destWallet.pendingBalance;
      destWallet.lastTransactionAt = new Date();

      await queryRunner.manager.save(WalletEntity, sourceWallet);
      await queryRunner.manager.save(WalletEntity, destWallet);
      const savedDebitTransaction = await queryRunner.manager.save(
        WalletTransactionEntity,
        debitTransaction,
      );
      const savedCreditTransaction = await queryRunner.manager.save(
        WalletTransactionEntity,
        creditTransaction,
      );

      await queryRunner.commitTransaction();

      // Emit events
      this.eventEmitter.emit('wallet.currency.exchanged', {
        partnerId,
        fromCurrency: exchangeDto.fromCurrency,
        toCurrency: exchangeDto.toCurrency,
        originalAmount: exchangeDto.amount,
        convertedAmount,
        exchangeRate: exchangeDto.exchangeRate,
        debitTransactionId: savedDebitTransaction.transactionId,
        creditTransactionId: savedCreditTransaction.transactionId,
        metadata: exchangeDto.metadata,
      });

      // Store financial event
      await this.financialEventSourcingService.storeEvent({
        aggregateId: partnerId,
        aggregateType: AggregateType.WALLET,
        eventType: FinancialEventType.CURRENCY_EXCHANGED,
        eventData: {
          partnerId,
          fromCurrency: exchangeDto.fromCurrency,
          toCurrency: exchangeDto.toCurrency,
          originalAmount: exchangeDto.amount,
          convertedAmount,
          exchangeRate: exchangeDto.exchangeRate,
          debitTransactionId: savedDebitTransaction.transactionId,
          creditTransactionId: savedCreditTransaction.transactionId,
          sourceWalletBalanceAfter: sourceWallet.balance,
          destWalletBalanceAfter: destWallet.balance,
        },
        metadata: {
          initiatedBy: userId,
          timestamp: new Date().toISOString(),
          ...exchangeDto.metadata,
        },
        userId: partnerId,
        partnerId,
        amount: exchangeDto.amount,
        currency: exchangeDto.fromCurrency,
      });

      return {
        debitTransaction: savedDebitTransaction,
        creditTransaction: savedCreditTransaction,
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Get all wallets for a partner (multi-currency view)
   */
  async getMultiCurrencyWallets(partnerId: string): Promise<WalletEntity[]> {
    return this.walletRepository.find({
      where: { partnerId },
      order: { currency: 'ASC' },
      relations: ['partner'],
    });
  }

  /**
   * Get wallet balance in specific currency
   */
  async getWalletBalance(
    partnerId: string,
    currency: string,
  ): Promise<WalletEntity> {
    const wallet = await this.walletRepository.findOne({
      where: { partnerId, currency },
      relations: ['partner'],
    });

    if (!wallet) {
      throw new NotFoundException(`Wallet for currency ${currency} not found`);
    }

    return wallet;
  }

  /**
   * Get consolidated balance in base currency
   */
  async getConsolidatedBalance(
    partnerId: string,
    baseCurrency: string,
    exchangeRates: Record<string, number>,
  ): Promise<{
    totalBalance: number;
    totalAvailableBalance: number;
    totalPendingBalance: number;
    baseCurrency: string;
    walletBreakdown: Array<{
      currency: string;
      balance: number;
      availableBalance: number;
      pendingBalance: number;
      balanceInBaseCurrency: number;
      exchangeRate: number;
    }>;
  }> {
    const wallets = await this.getMultiCurrencyWallets(partnerId);

    let totalBalance = 0;
    let totalAvailableBalance = 0;
    let totalPendingBalance = 0;

    const walletBreakdown = wallets.map((wallet) => {
      const exchangeRate =
        wallet.currency === baseCurrency
          ? 1
          : exchangeRates[wallet.currency] || 0;
      const balanceInBaseCurrency = wallet.balance * exchangeRate;
      const availableBalanceInBaseCurrency =
        wallet.availableBalance * exchangeRate;
      const pendingBalanceInBaseCurrency = wallet.pendingBalance * exchangeRate;

      totalBalance += balanceInBaseCurrency;
      totalAvailableBalance += availableBalanceInBaseCurrency;
      totalPendingBalance += pendingBalanceInBaseCurrency;

      return {
        currency: wallet.currency,
        balance: wallet.balance,
        availableBalance: wallet.availableBalance,
        pendingBalance: wallet.pendingBalance,
        balanceInBaseCurrency,
        exchangeRate,
      };
    });

    return {
      totalBalance,
      totalAvailableBalance,
      totalPendingBalance,
      baseCurrency,
      walletBreakdown,
    };
  }

  /**
   * Auto-convert currency based on thresholds
   */
  async autoConvertCurrency(
    partnerId: string,
    fromCurrency: string,
    toCurrency: string,
    threshold: number,
    exchangeRate: number,
    userId: string,
  ): Promise<void> {
    const sourceWallet = await this.walletRepository.findOne({
      where: { partnerId, currency: fromCurrency },
    });

    if (!sourceWallet || sourceWallet.availableBalance < threshold) {
      return; // No conversion needed
    }

    const amountToConvert = sourceWallet.availableBalance - threshold;

    if (amountToConvert > 0) {
      await this.exchangeCurrency(
        partnerId,
        {
          fromCurrency,
          toCurrency,
          amount: amountToConvert,
          exchangeRate,
          description: `Auto-conversion: ${fromCurrency} to ${toCurrency}`,
          metadata: {
            autoConversion: true,
            threshold,
          },
        },
        userId,
      );
    }
  }

  /**
   * Get exchange history for a partner
   */
  async getExchangeHistory(
    partnerId: string,
    limit: number = 50,
    offset: number = 0,
  ): Promise<{
    transactions: WalletTransactionEntity[];
    total: number;
  }> {
    const wallets = await this.walletRepository.find({
      where: { partnerId },
      select: ['id'],
    });

    const walletIds = wallets.map((w) => w.id);

    const [transactions, total] = await this.transactionRepository.findAndCount(
      {
        where: {
          walletBalanceId: walletIds.length > 0 ? walletIds[0] : undefined,
          source: TransactionSource.CURRENCY_EXCHANGE,
        },
        order: { createdAt: 'DESC' },
        take: limit,
        skip: offset,
      },
    );

    return { transactions, total };
  }
}
