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

export interface EscrowHoldDto {
  amount: number;
  currency: string;
  description?: string;
  referenceId: string;
  referenceType: string;
  expiresAt?: Date;
  metadata?: Record<string, any>;
}

export interface EscrowReleaseDto {
  holdId: string;
  amount?: number; // Partial release if specified
  description?: string;
  metadata?: Record<string, any>;
}

@Injectable()
export class WalletEscrowService {
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
   * Create an escrow hold on wallet funds
   */
  async createEscrowHold(
    partnerId: string,
    escrowDto: EscrowHoldDto,
    userId: string,
  ): Promise<WalletTransactionEntity> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const wallet = await queryRunner.manager.findOne(WalletEntity, {
        where: { partnerId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!wallet) {
        throw new NotFoundException('Wallet not found');
      }

      if (wallet.availableBalance < escrowDto.amount) {
        throw new BadRequestException(
          'Insufficient available balance for escrow hold',
        );
      }

      // Create hold transaction
      const holdTransaction = queryRunner.manager.create(
        WalletTransactionEntity,
        {
          userId: partnerId,
          walletBalanceId: wallet.id,
          transactionId: this.idGeneratorService.generateId(
            EntityType.TRANSACTION,
          ),
          type: TransactionType.DEBIT,
          source: TransactionSource.ESCROW_HOLD,
          amount: escrowDto.amount,
          balanceAfter: wallet.balance, // Balance doesn't change, only available balance
          currency: escrowDto.currency,
          status: TransactionStatus.PENDING,
          description: escrowDto.description || 'Escrow hold',
          referenceId: escrowDto.referenceId,
          referenceType: escrowDto.referenceType,
          processedAt: new Date(),
          metadata: {
            initiatedBy: userId,
            escrowHold: true,
            expiresAt: escrowDto.expiresAt?.toISOString(),
            ...escrowDto.metadata,
          },
        },
      );

      // Update wallet balances
      wallet.pendingBalance += escrowDto.amount;
      wallet.availableBalance = wallet.balance - wallet.pendingBalance;
      wallet.lastTransactionAt = new Date();

      await queryRunner.manager.save(WalletEntity, wallet);
      const savedTransaction = await queryRunner.manager.save(
        WalletTransactionEntity,
        holdTransaction,
      );

      await queryRunner.commitTransaction();

      // Emit events
      this.eventEmitter.emit('wallet.escrow.hold.created', {
        walletId: wallet.id,
        partnerId: wallet.partnerId,
        amount: escrowDto.amount,
        currency: escrowDto.currency,
        transactionId: savedTransaction.transactionId,
        holdId: savedTransaction.transactionId,
        referenceId: escrowDto.referenceId,
        referenceType: escrowDto.referenceType,
        expiresAt: escrowDto.expiresAt,
        metadata: savedTransaction.metadata,
      });

      // Store financial event
      await this.financialEventSourcingService.storeEvent({
        aggregateId: wallet.partnerId,
        aggregateType: AggregateType.WALLET,
        eventType: FinancialEventType.ESCROW_HOLD_CREATED,
        eventData: {
          walletId: wallet.id,
          amount: escrowDto.amount,
          currency: escrowDto.currency,
          transactionId: savedTransaction.transactionId,
          holdId: savedTransaction.transactionId,
          referenceId: escrowDto.referenceId,
          referenceType: escrowDto.referenceType,
          availableBalanceAfter: wallet.availableBalance,
          pendingBalanceAfter: wallet.pendingBalance,
          expiresAt: escrowDto.expiresAt?.toISOString(),
        },
        metadata: {
          initiatedBy: userId,
          timestamp: new Date().toISOString(),
          ...escrowDto.metadata,
        },
        userId: partnerId,
        partnerId: wallet.partnerId,
        amount: escrowDto.amount,
        currency: escrowDto.currency,
      });

      return savedTransaction;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Release escrow hold and transfer funds
   */
  async releaseEscrowHold(
    partnerId: string,
    releaseDto: EscrowReleaseDto,
    userId: string,
  ): Promise<WalletTransactionEntity> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const wallet = await queryRunner.manager.findOne(WalletEntity, {
        where: { partnerId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!wallet) {
        throw new NotFoundException('Wallet not found');
      }

      // Find the hold transaction
      const holdTransaction = await queryRunner.manager.findOne(
        WalletTransactionEntity,
        {
          where: {
            transactionId: releaseDto.holdId,
            walletBalanceId: wallet.id,
            source: TransactionSource.ESCROW_HOLD,
            status: TransactionStatus.PENDING,
          },
        },
      );

      if (!holdTransaction) {
        throw new NotFoundException(
          'Escrow hold not found or already processed',
        );
      }

      const releaseAmount = releaseDto.amount || holdTransaction.amount;

      if (releaseAmount > holdTransaction.amount) {
        throw new BadRequestException(
          'Release amount cannot exceed hold amount',
        );
      }

      // Create release transaction
      const releaseTransaction = queryRunner.manager.create(
        WalletTransactionEntity,
        {
          userId: partnerId,
          walletBalanceId: wallet.id,
          transactionId: this.idGeneratorService.generateId(
            EntityType.TRANSACTION,
          ),
          type: TransactionType.CREDIT,
          source: TransactionSource.ESCROW_RELEASE,
          amount: releaseAmount,
          balanceAfter: wallet.balance,
          currency: holdTransaction.currency,
          status: TransactionStatus.COMPLETED,
          description: releaseDto.description || 'Escrow release',
          referenceId: holdTransaction.referenceId,
          referenceType: holdTransaction.referenceType,
          processedAt: new Date(),
          metadata: {
            initiatedBy: userId,
            escrowRelease: true,
            originalHoldId: holdTransaction.transactionId,
            ...releaseDto.metadata,
          },
        },
      );

      // Update hold transaction status
      if (releaseAmount === holdTransaction.amount) {
        holdTransaction.status = TransactionStatus.COMPLETED;
      } else {
        // Partial release - update hold amount
        holdTransaction.amount -= releaseAmount;
        const currentReleased = holdTransaction.metadata?.notes?.includes(
          'Released:',
        )
          ? parseFloat(
              holdTransaction.metadata.notes
                .split('Released: ')[1]
                ?.split(' ')[0] || '0',
            )
          : 0;
        const totalReleased = currentReleased + releaseAmount;
        holdTransaction.metadata = {
          ...holdTransaction.metadata,
          notes: `Partial release. Released: ${totalReleased} ${holdTransaction.currency}`,
        };
      }

      // Update wallet balances
      wallet.pendingBalance -= releaseAmount;
      wallet.availableBalance = wallet.balance - wallet.pendingBalance;
      wallet.lastTransactionAt = new Date();

      await queryRunner.manager.save(WalletEntity, wallet);
      await queryRunner.manager.save(WalletTransactionEntity, holdTransaction);
      const savedTransaction = await queryRunner.manager.save(
        WalletTransactionEntity,
        releaseTransaction,
      );

      await queryRunner.commitTransaction();

      // Emit events
      this.eventEmitter.emit('wallet.escrow.hold.released', {
        walletId: wallet.id,
        partnerId: wallet.partnerId,
        amount: releaseAmount,
        currency: holdTransaction.currency,
        transactionId: savedTransaction.transactionId,
        holdId: holdTransaction.transactionId,
        referenceId: holdTransaction.referenceId,
        referenceType: holdTransaction.referenceType,
        isPartialRelease: releaseAmount < holdTransaction.amount,
        metadata: savedTransaction.metadata,
      });

      // Store financial event
      await this.financialEventSourcingService.storeEvent({
        aggregateId: wallet.partnerId,
        aggregateType: AggregateType.WALLET,
        eventType: FinancialEventType.ESCROW_HOLD_RELEASED,
        eventData: {
          walletId: wallet.id,
          amount: releaseAmount,
          currency: holdTransaction.currency,
          transactionId: savedTransaction.transactionId,
          holdId: holdTransaction.transactionId,
          referenceId: holdTransaction.referenceId,
          referenceType: holdTransaction.referenceType,
          availableBalanceAfter: wallet.availableBalance,
          pendingBalanceAfter: wallet.pendingBalance,
          isPartialRelease: releaseAmount < holdTransaction.amount,
        },
        metadata: {
          initiatedBy: userId,
          timestamp: new Date().toISOString(),
          ...releaseDto.metadata,
        },
        userId: partnerId,
        partnerId: wallet.partnerId,
        amount: releaseAmount,
        currency: holdTransaction.currency,
      });

      return savedTransaction;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Cancel escrow hold and return funds to available balance
   */
  async cancelEscrowHold(
    partnerId: string,
    holdId: string,
    userId: string,
    reason?: string,
  ): Promise<WalletTransactionEntity> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const wallet = await queryRunner.manager.findOne(WalletEntity, {
        where: { partnerId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!wallet) {
        throw new NotFoundException('Wallet not found');
      }

      // Find the hold transaction
      const holdTransaction = await queryRunner.manager.findOne(
        WalletTransactionEntity,
        {
          where: {
            transactionId: holdId,
            walletBalanceId: wallet.id,
            source: TransactionSource.ESCROW_HOLD,
            status: TransactionStatus.PENDING,
          },
        },
      );

      if (!holdTransaction) {
        throw new NotFoundException(
          'Escrow hold not found or already processed',
        );
      }

      // Create cancellation transaction
      const cancelTransaction = queryRunner.manager.create(
        WalletTransactionEntity,
        {
          userId: partnerId,
          walletBalanceId: wallet.id,
          transactionId: this.idGeneratorService.generateId(
            EntityType.TRANSACTION,
          ),
          type: TransactionType.CREDIT,
          source: TransactionSource.ESCROW_CANCEL,
          amount: holdTransaction.amount,
          balanceAfter: wallet.balance,
          currency: holdTransaction.currency,
          status: TransactionStatus.COMPLETED,
          description: reason || 'Escrow hold cancelled',
          referenceId: holdTransaction.referenceId,
          referenceType: holdTransaction.referenceType,
          processedAt: new Date(),
          metadata: {
            initiatedBy: userId,
            escrowCancel: true,
            originalHoldId: holdTransaction.transactionId,
            reason,
          },
        },
      );

      // Update hold transaction status
      holdTransaction.status = TransactionStatus.CANCELLED;

      // Update wallet balances
      wallet.pendingBalance -= holdTransaction.amount;
      wallet.availableBalance = wallet.balance - wallet.pendingBalance;
      wallet.lastTransactionAt = new Date();

      await queryRunner.manager.save(WalletEntity, wallet);
      await queryRunner.manager.save(WalletTransactionEntity, holdTransaction);
      const savedTransaction = await queryRunner.manager.save(
        WalletTransactionEntity,
        cancelTransaction,
      );

      await queryRunner.commitTransaction();

      // Emit events
      this.eventEmitter.emit('wallet.escrow.hold.cancelled', {
        walletId: wallet.id,
        partnerId: wallet.partnerId,
        amount: holdTransaction.amount,
        currency: holdTransaction.currency,
        transactionId: savedTransaction.transactionId,
        holdId: holdTransaction.transactionId,
        referenceId: holdTransaction.referenceId,
        referenceType: holdTransaction.referenceType,
        reason,
        metadata: savedTransaction.metadata,
      });

      // Store financial event
      await this.financialEventSourcingService.storeEvent({
        aggregateId: wallet.partnerId,
        aggregateType: AggregateType.WALLET,
        eventType: FinancialEventType.ESCROW_HOLD_CANCELLED,
        eventData: {
          walletId: wallet.id,
          amount: holdTransaction.amount,
          currency: holdTransaction.currency,
          transactionId: savedTransaction.transactionId,
          holdId: holdTransaction.transactionId,
          referenceId: holdTransaction.referenceId,
          referenceType: holdTransaction.referenceType,
          availableBalanceAfter: wallet.availableBalance,
          pendingBalanceAfter: wallet.pendingBalance,
          reason,
        },
        metadata: {
          initiatedBy: userId,
          timestamp: new Date().toISOString(),
          reason,
        },
        userId: partnerId,
        partnerId: wallet.partnerId,
        amount: holdTransaction.amount,
        currency: holdTransaction.currency,
      });

      return savedTransaction;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Get all active escrow holds for a wallet
   */
  async getActiveEscrowHolds(
    partnerId: string,
  ): Promise<WalletTransactionEntity[]> {
    const wallet = await this.walletRepository.findOne({
      where: { partnerId },
    });

    if (!wallet) {
      throw new NotFoundException('Wallet not found');
    }

    return this.transactionRepository.find({
      where: {
        walletBalanceId: wallet.id,
        source: TransactionSource.ESCROW_HOLD,
        status: TransactionStatus.PENDING,
      },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Get escrow hold by ID
   */
  async getEscrowHoldById(
    partnerId: string,
    holdId: string,
  ): Promise<WalletTransactionEntity> {
    const wallet = await this.walletRepository.findOne({
      where: { partnerId },
    });

    if (!wallet) {
      throw new NotFoundException('Wallet not found');
    }

    const hold = await this.transactionRepository.findOne({
      where: {
        transactionId: holdId,
        walletBalanceId: wallet.id,
        source: TransactionSource.ESCROW_HOLD,
      },
    });

    if (!hold) {
      throw new NotFoundException('Escrow hold not found');
    }

    return hold;
  }

  /**
   * Auto-expire escrow holds that have passed their expiration date
   */
  async expireEscrowHolds(): Promise<void> {
    const expiredHolds = await this.transactionRepository
      .createQueryBuilder('transaction')
      .where('transaction.source = :source', {
        source: TransactionSource.ESCROW_HOLD,
      })
      .andWhere('transaction.status = :status', {
        status: TransactionStatus.PENDING,
      })
      .andWhere("transaction.metadata->>'expiresAt' IS NOT NULL")
      .andWhere("(transaction.metadata->>'expiresAt')::timestamp < :now", {
        now: new Date(),
      })
      .getMany();

    for (const hold of expiredHolds) {
      try {
        const wallet = await this.walletRepository.findOne({
          where: { id: hold.walletBalanceId },
        });

        if (wallet) {
          await this.cancelEscrowHold(
            wallet.partnerId,
            hold.transactionId,
            'system',
            'Escrow hold expired',
          );
        }
      } catch (error) {
        console.error(
          `Failed to expire escrow hold ${hold.transactionId}:`,
          error,
        );
      }
    }
  }
}
