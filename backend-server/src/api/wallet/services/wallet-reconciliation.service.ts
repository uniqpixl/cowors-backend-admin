import { FinancialEventSourcingService } from '@/common/events/financial-event-sourcing';
import { AggregateType } from '@/common/events/financial-event-sourcing/financial-aggregate.entity';
import { FinancialEventType } from '@/common/events/financial-event-sourcing/financial-event.entity';
import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import {
  PaymentStatus,
  RefundStatus,
} from '../../../common/enums/booking.enum';
import {
  TransactionStatus,
  TransactionType,
} from '../../../common/enums/wallet.enum';
import { PaymentEntity } from '../../../database/entities/payment.entity';
import { RefundEntity } from '../../../database/entities/refund.entity';
import { WalletTransactionEntity } from '../../../database/entities/wallet-transaction.entity';
import { WalletEntity } from '../entities/wallet.entity';

export interface ReconciliationReport {
  walletId: string;
  partnerId: string;
  currency: string;
  expectedBalance: number;
  actualBalance: number;
  discrepancy: number;
  discrepancyPercentage: number;
  lastReconciliation: Date;
  transactionCount: number;
  issues: ReconciliationIssue[];
  status: 'BALANCED' | 'DISCREPANCY' | 'CRITICAL';
}

export interface ReconciliationIssue {
  type:
    | 'MISSING_TRANSACTION'
    | 'DUPLICATE_TRANSACTION'
    | 'AMOUNT_MISMATCH'
    | 'STATUS_MISMATCH';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  description: string;
  transactionId?: string;
  paymentId?: string;
  refundId?: string;
  expectedAmount?: number;
  actualAmount?: number;
  metadata?: Record<string, any>;
}

export interface ReconciliationSummary {
  totalWallets: number;
  balancedWallets: number;
  walletsWithDiscrepancies: number;
  criticalIssues: number;
  totalDiscrepancyAmount: number;
  lastReconciliationRun: Date;
  nextScheduledRun: Date;
  processingTime: number;
}

@Injectable()
export class WalletReconciliationService {
  private readonly logger = new Logger(WalletReconciliationService.name);

  constructor(
    @InjectRepository(WalletEntity)
    private walletRepository: Repository<WalletEntity>,
    @InjectRepository(WalletTransactionEntity)
    private transactionRepository: Repository<WalletTransactionEntity>,
    @InjectRepository(PaymentEntity)
    private paymentRepository: Repository<PaymentEntity>,
    @InjectRepository(RefundEntity)
    private refundRepository: Repository<RefundEntity>,
    private dataSource: DataSource,
    private financialEventSourcingService: FinancialEventSourcingService,
    private eventEmitter: EventEmitter2,
  ) {}

  /**
   * Run automated reconciliation every day at 2 AM
   */
  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async runScheduledReconciliation(): Promise<void> {
    this.logger.log('Starting scheduled wallet reconciliation');

    try {
      const summary = await this.reconcileAllWallets();

      this.logger.log(
        `Reconciliation completed: ${summary.balancedWallets}/${summary.totalWallets} wallets balanced`,
      );

      if (summary.criticalIssues > 0) {
        this.logger.error(`Critical issues found: ${summary.criticalIssues}`);

        // Emit alert for critical issues
        this.eventEmitter.emit('wallet.reconciliation.critical.alert', {
          summary,
          timestamp: new Date(),
        });
      }
    } catch (error) {
      this.logger.error('Scheduled reconciliation failed:', error);

      this.eventEmitter.emit('wallet.reconciliation.failed', {
        error: error.message,
        timestamp: new Date(),
      });
    }
  }

  /**
   * Reconcile all wallets
   */
  async reconcileAllWallets(): Promise<ReconciliationSummary> {
    const startTime = Date.now();

    const wallets = await this.walletRepository.find({
      relations: ['partner'],
    });

    const reports: ReconciliationReport[] = [];
    let totalDiscrepancyAmount = 0;
    let criticalIssues = 0;

    for (const wallet of wallets) {
      try {
        const report = await this.reconcileWallet(
          wallet.partnerId,
          wallet.currency,
        );
        reports.push(report);

        totalDiscrepancyAmount += Math.abs(report.discrepancy);

        if (report.status === 'CRITICAL') {
          criticalIssues += report.issues.filter(
            (i) => i.severity === 'CRITICAL',
          ).length;
        }
      } catch (error) {
        this.logger.error(`Failed to reconcile wallet ${wallet.id}:`, error);
      }
    }

    const processingTime = Date.now() - startTime;

    const summary: ReconciliationSummary = {
      totalWallets: wallets.length,
      balancedWallets: reports.filter((r) => r.status === 'BALANCED').length,
      walletsWithDiscrepancies: reports.filter((r) => r.status !== 'BALANCED')
        .length,
      criticalIssues,
      totalDiscrepancyAmount,
      lastReconciliationRun: new Date(),
      nextScheduledRun: new Date(Date.now() + 24 * 60 * 60 * 1000), // Next day
      processingTime,
    };

    // Store reconciliation event
    await this.financialEventSourcingService.storeEvent({
      aggregateId: 'SYSTEM',
      aggregateType: AggregateType.WALLET,
      eventType: FinancialEventType.RECONCILIATION_COMPLETED,
      eventData: {
        summary,
        reports: reports.filter((r) => r.status !== 'BALANCED'), // Only store problematic reports
      },
      metadata: {
        timestamp: new Date().toISOString(),
        processingTime,
        automated: true,
      },
    });

    return summary;
  }

  /**
   * Reconcile a specific wallet
   */
  async reconcileWallet(
    partnerId: string,
    currency: string,
  ): Promise<ReconciliationReport> {
    const wallet = await this.walletRepository.findOne({
      where: { partnerId, currency },
      relations: ['partner'],
    });

    if (!wallet) {
      throw new Error(
        `Wallet not found for partner ${partnerId} and currency ${currency}`,
      );
    }

    const issues: ReconciliationIssue[] = [];

    // Calculate expected balance from transactions
    const expectedBalance = await this.calculateExpectedBalance(wallet.id);

    // Get actual balance
    const actualBalance = wallet.balance;

    // Calculate discrepancy
    const discrepancy = actualBalance - expectedBalance;
    const discrepancyPercentage =
      expectedBalance !== 0 ? (discrepancy / expectedBalance) * 100 : 0;

    // Check for transaction issues
    await this.checkTransactionIntegrity(wallet.id, issues);

    // Check payment reconciliation
    await this.checkPaymentReconciliation(partnerId, currency, issues);

    // Check refund reconciliation
    await this.checkRefundReconciliation(partnerId, currency, issues);

    // Determine status
    let status: 'BALANCED' | 'DISCREPANCY' | 'CRITICAL' = 'BALANCED';

    if (Math.abs(discrepancy) > 0.01) {
      // Allow for minor rounding differences
      status = 'DISCREPANCY';
    }

    if (
      Math.abs(discrepancyPercentage) > 5 ||
      issues.some((i) => i.severity === 'CRITICAL')
    ) {
      status = 'CRITICAL';
    }

    const transactionCount = await this.transactionRepository.count({
      where: { walletBalanceId: wallet.id },
    });

    const report: ReconciliationReport = {
      walletId: wallet.id,
      partnerId: wallet.partnerId,
      currency: wallet.currency,
      expectedBalance,
      actualBalance,
      discrepancy,
      discrepancyPercentage,
      lastReconciliation: new Date(),
      transactionCount,
      issues,
      status,
    };

    // Update wallet metadata with reconciliation info
    wallet.metadata = {
      ...wallet.metadata,
      lastReconciliation: new Date().toISOString(),
      reconciliationStatus: status,
      lastDiscrepancy: discrepancy,
    };

    await this.walletRepository.save(wallet);

    // Emit reconciliation event
    this.eventEmitter.emit('wallet.reconciliation.completed', {
      walletId: wallet.id,
      partnerId: wallet.partnerId,
      currency: wallet.currency,
      status,
      discrepancy,
      issueCount: issues.length,
      report,
    });

    return report;
  }

  /**
   * Calculate expected balance from transaction history
   */
  private async calculateExpectedBalance(walletId: string): Promise<number> {
    const result = await this.transactionRepository
      .createQueryBuilder('transaction')
      .select(
        "SUM(CASE WHEN transaction.type = 'CREDIT' THEN transaction.amount ELSE -transaction.amount END)",
        'balance',
      )
      .where('transaction.walletBalanceId = :walletId', { walletId })
      .andWhere('transaction.status = :status', {
        status: TransactionStatus.COMPLETED,
      })
      .getRawOne();

    return parseFloat(result.balance) || 0;
  }

  /**
   * Check transaction integrity
   */
  private async checkTransactionIntegrity(
    walletId: string,
    issues: ReconciliationIssue[],
  ): Promise<void> {
    // Check for duplicate transactions
    const duplicates = await this.transactionRepository
      .createQueryBuilder('t1')
      .innerJoin(
        'wallet_transaction',
        't2',
        't1.referenceId = t2.referenceId AND t1.amount = t2.amount AND t1.id != t2.id',
      )
      .where('t1.walletBalanceId = :walletId', { walletId })
      .andWhere('t1.referenceId IS NOT NULL')
      .getMany();

    for (const duplicate of duplicates) {
      issues.push({
        type: 'DUPLICATE_TRANSACTION',
        severity: 'HIGH',
        description: `Duplicate transaction found with reference ID: ${duplicate.referenceId}`,
        transactionId: duplicate.transactionId,
        metadata: {
          referenceId: duplicate.referenceId,
          amount: duplicate.amount,
        },
      });
    }

    // Check for transactions with inconsistent balance_after values
    const transactions = await this.transactionRepository.find({
      where: { walletBalanceId: walletId },
      order: { createdAt: 'ASC' },
    });

    let runningBalance = 0;
    for (const transaction of transactions) {
      if (transaction.status === TransactionStatus.COMPLETED) {
        if (transaction.type === TransactionType.CREDIT) {
          runningBalance += transaction.amount;
        } else {
          runningBalance -= transaction.amount;
        }

        if (Math.abs(runningBalance - transaction.balanceAfter) > 0.01) {
          issues.push({
            type: 'AMOUNT_MISMATCH',
            severity: 'MEDIUM',
            description: `Transaction balance_after mismatch`,
            transactionId: transaction.transactionId,
            expectedAmount: runningBalance,
            actualAmount: transaction.balanceAfter,
          });
        }
      }
    }
  }

  /**
   * Check payment reconciliation
   */
  private async checkPaymentReconciliation(
    partnerId: string,
    currency: string,
    issues: ReconciliationIssue[],
  ): Promise<void> {
    // Find completed payments that should have corresponding wallet transactions
    const completedPayments = await this.paymentRepository.find({
      where: {
        currency,
        status: PaymentStatus.COMPLETED,
      },
    });

    for (const payment of completedPayments) {
      const walletTransaction = await this.transactionRepository.findOne({
        where: {
          referenceId: payment.id,
          referenceType: 'PAYMENT',
        },
      });

      if (!walletTransaction) {
        issues.push({
          type: 'MISSING_TRANSACTION',
          severity: 'CRITICAL',
          description: `Missing wallet transaction for completed payment`,
          paymentId: payment.id,
          expectedAmount: payment.amount,
        });
      } else if (Math.abs(walletTransaction.amount - payment.amount) > 0.01) {
        issues.push({
          type: 'AMOUNT_MISMATCH',
          severity: 'HIGH',
          description: `Payment amount mismatch with wallet transaction`,
          paymentId: payment.id,
          transactionId: walletTransaction.transactionId,
          expectedAmount: payment.amount,
          actualAmount: walletTransaction.amount,
        });
      }
    }
  }

  /**
   * Check refund reconciliation
   */
  private async checkRefundReconciliation(
    partnerId: string,
    currency: string,
    issues: ReconciliationIssue[],
  ): Promise<void> {
    // Find completed refunds that should have corresponding wallet transactions
    const completedRefunds = await this.refundRepository.find({
      where: {
        currency,
        status: RefundStatus.COMPLETED,
      },
    });

    for (const refund of completedRefunds) {
      const walletTransaction = await this.transactionRepository.findOne({
        where: {
          referenceId: refund.id,
          referenceType: 'REFUND',
        },
      });

      if (!walletTransaction) {
        issues.push({
          type: 'MISSING_TRANSACTION',
          severity: 'CRITICAL',
          description: `Missing wallet transaction for completed refund`,
          refundId: refund.id,
          expectedAmount: -refund.amount, // Negative because it's a debit
        });
      } else if (
        Math.abs(Math.abs(walletTransaction.amount) - refund.amount) > 0.01
      ) {
        issues.push({
          type: 'AMOUNT_MISMATCH',
          severity: 'HIGH',
          description: `Refund amount mismatch with wallet transaction`,
          refundId: refund.id,
          transactionId: walletTransaction.transactionId,
          expectedAmount: refund.amount,
          actualAmount: Math.abs(walletTransaction.amount),
        });
      }
    }
  }

  /**
   * Get reconciliation history
   */
  async getReconciliationHistory(
    partnerId?: string,
    limit: number = 50,
    offset: number = 0,
  ): Promise<{
    reports: any[];
    total: number;
  }> {
    // Get reconciliation events from financial event sourcing
    const { events } =
      await this.financialEventSourcingService.getEventsByCriteria({
        eventTypes: [FinancialEventType.RECONCILIATION_COMPLETED],
        partnerId,
        limit,
        offset,
      });

    return {
      reports: events.map((event) => event.eventData),
      total: events.length,
    };
  }

  /**
   * Force reconciliation for a specific wallet
   */
  async forceReconciliation(
    partnerId: string,
    currency: string,
    userId: string,
  ): Promise<ReconciliationReport> {
    this.logger.log(
      `Force reconciliation requested for wallet ${partnerId}/${currency} by user ${userId}`,
    );

    const report = await this.reconcileWallet(partnerId, currency);

    // Store manual reconciliation event
    await this.financialEventSourcingService.storeEvent({
      aggregateId: partnerId,
      aggregateType: AggregateType.WALLET,
      eventType: FinancialEventType.MANUAL_RECONCILIATION,
      eventData: {
        report,
        triggeredBy: userId,
      },
      metadata: {
        timestamp: new Date().toISOString(),
        manual: true,
        userId,
      },
      userId: partnerId,
      partnerId,
    });

    return report;
  }

  /**
   * Get reconciliation statistics
   */
  async getReconciliationStats(): Promise<{
    totalWallets: number;
    lastReconciliationRun: Date | null;
    walletsWithIssues: number;
    criticalIssues: number;
    averageDiscrepancy: number;
  }> {
    const totalWallets = await this.walletRepository.count();

    const walletsWithMetadata = await this.walletRepository
      .createQueryBuilder('wallet')
      .where("wallet.metadata->>'reconciliationStatus' IS NOT NULL")
      .getMany();

    const walletsWithIssues = walletsWithMetadata.filter(
      (w) => w.metadata?.reconciliationStatus !== 'BALANCED',
    ).length;

    const criticalIssues = walletsWithMetadata.filter(
      (w) => w.metadata?.reconciliationStatus === 'CRITICAL',
    ).length;

    const discrepancies = walletsWithMetadata
      .map((w) => parseFloat(w.metadata?.lastDiscrepancy || '0'))
      .filter((d) => !isNaN(d));

    const averageDiscrepancy =
      discrepancies.length > 0
        ? discrepancies.reduce((sum, d) => sum + Math.abs(d), 0) /
          discrepancies.length
        : 0;

    const lastReconciliationRun =
      walletsWithMetadata.length > 0
        ? new Date(
            Math.max(
              ...walletsWithMetadata
                .map((w) =>
                  new Date(w.metadata?.lastReconciliation || 0).getTime(),
                )
                .filter((t) => !isNaN(t)),
            ),
          )
        : null;

    return {
      totalWallets,
      lastReconciliationRun,
      walletsWithIssues,
      criticalIssues,
      averageDiscrepancy,
    };
  }
}
