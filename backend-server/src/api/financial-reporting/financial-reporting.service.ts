import { AggregateType } from '@/common/events/financial-event-sourcing/financial-aggregate.entity';
import { FinancialEventSourcingService } from '@/common/events/financial-event-sourcing/financial-event-sourcing.service';
import { FinancialEventType } from '@/common/events/financial-event-sourcing/financial-event.entity';
import { BookingEntity } from '@/database/entities/booking.entity';
import { PaymentEntity } from '@/database/entities/payment.entity';
import { RefundEntity } from '@/database/entities/refund.entity';
import { WalletTransactionEntity } from '@/database/entities/wallet-transaction.entity';
import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, LessThan, MoreThan, Repository } from 'typeorm';

export interface FinancialMetrics {
  totalRevenue: number;
  totalRefunds: number;
  netRevenue: number;
  totalTransactions: number;
  averageTransactionValue: number;
  commissionEarned: number;
  partnerPayouts: number;
  walletBalance: number;
  pendingPayments: number;
  failedTransactions: number;
  refundRate: number;
  conversionRate: number;
}

export interface RevenueBreakdown {
  bookingRevenue: number;
  commissionRevenue: number;
  feeRevenue: number;
  otherRevenue: number;
  totalRevenue: number;
}

export interface TransactionTrends {
  period: string;
  revenue: number;
  transactions: number;
  refunds: number;
  averageValue: number;
}

export interface FinancialDashboardData {
  metrics: FinancialMetrics;
  revenueBreakdown: RevenueBreakdown;
  trends: TransactionTrends[];
  topPartners: Array<{
    partnerId: string;
    partnerName: string;
    revenue: number;
    transactions: number;
    commission: number;
  }>;
  recentTransactions: Array<{
    id: string;
    type: string;
    amount: number;
    status: string;
    createdAt: Date;
    description: string;
  }>;
  alerts: Array<{
    type: 'warning' | 'error' | 'info';
    message: string;
    timestamp: Date;
    severity: 'low' | 'medium' | 'high' | 'critical';
  }>;
}

export interface FinancialReportFilters {
  startDate?: Date;
  endDate?: Date;
  partnerId?: string;
  currency?: string;
  transactionType?: string;
  status?: string;
  minAmount?: number;
  maxAmount?: number;
}

@Injectable()
export class FinancialReportingService {
  private readonly logger = new Logger(FinancialReportingService.name);

  constructor(
    @InjectRepository(PaymentEntity)
    private paymentRepository: Repository<PaymentEntity>,
    @InjectRepository(RefundEntity)
    private refundRepository: Repository<RefundEntity>,
    @InjectRepository(WalletTransactionEntity)
    private walletTransactionRepository: Repository<WalletTransactionEntity>,
    @InjectRepository(BookingEntity)
    private bookingRepository: Repository<BookingEntity>,
    private financialEventSourcingService: FinancialEventSourcingService,
    private eventEmitter: EventEmitter2,
  ) {}

  async getFinancialDashboard(
    filters: FinancialReportFilters = {},
  ): Promise<FinancialDashboardData> {
    const startDate =
      filters.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
    const endDate = filters.endDate || new Date();

    try {
      const [
        metrics,
        revenueBreakdown,
        trends,
        topPartners,
        recentTransactions,
        alerts,
      ] = await Promise.all([
        this.getFinancialMetrics(filters),
        this.getRevenueBreakdown(filters),
        this.getTransactionTrends(startDate, endDate),
        this.getTopPartners(filters),
        this.getRecentTransactions(10),
        this.getFinancialAlerts(),
      ]);

      return {
        metrics,
        revenueBreakdown,
        trends,
        topPartners,
        recentTransactions,
        alerts,
      };
    } catch (error) {
      this.logger.error('Failed to generate financial dashboard:', error);
      throw error;
    }
  }

  async getFinancialMetrics(
    filters: FinancialReportFilters = {},
  ): Promise<FinancialMetrics> {
    const whereClause = this.buildWhereClause(filters);

    try {
      // Get payment metrics
      const paymentMetrics = await this.paymentRepository
        .createQueryBuilder('payment')
        .select([
          "SUM(CASE WHEN payment.status = 'COMPLETED' THEN payment.amount ELSE 0 END) as totalRevenue",
          "COUNT(CASE WHEN payment.status = 'COMPLETED' THEN 1 END) as completedTransactions",
          "COUNT(CASE WHEN payment.status = 'PENDING' THEN 1 END) as pendingPayments",
          "COUNT(CASE WHEN payment.status = 'FAILED' THEN 1 END) as failedTransactions",
          "AVG(CASE WHEN payment.status = 'COMPLETED' THEN payment.amount END) as averageTransactionValue",
        ])
        .where(whereClause.payments)
        .getRawOne();

      // Get refund metrics
      const refundMetrics = await this.refundRepository
        .createQueryBuilder('refund')
        .select([
          "SUM(CASE WHEN refund.status = 'COMPLETED' THEN refund.amount ELSE 0 END) as totalRefunds",
          "COUNT(CASE WHEN refund.status = 'COMPLETED' THEN 1 END) as completedRefunds",
        ])
        .where(whereClause.refunds)
        .getRawOne();

      // Get wallet metrics
      const walletMetrics = await this.walletTransactionRepository
        .createQueryBuilder('wallet')
        .select([
          "SUM(CASE WHEN wallet.type = 'COMMISSION' THEN wallet.amount ELSE 0 END) as commissionEarned",
          "SUM(CASE WHEN wallet.type = 'PAYOUT' THEN wallet.amount ELSE 0 END) as partnerPayouts",
          'SUM(wallet.balanceAfter) as totalWalletBalance',
        ])
        .where(whereClause.walletTransactions)
        .getRawOne();

      const totalRevenue = parseFloat(paymentMetrics.totalRevenue) || 0;
      const totalRefunds = parseFloat(refundMetrics.totalRefunds) || 0;
      const completedTransactions =
        parseInt(paymentMetrics.completedTransactions) || 0;
      const completedRefunds = parseInt(refundMetrics.completedRefunds) || 0;

      return {
        totalRevenue,
        totalRefunds,
        netRevenue: totalRevenue - totalRefunds,
        totalTransactions: completedTransactions,
        averageTransactionValue:
          parseFloat(paymentMetrics.averageTransactionValue) || 0,
        commissionEarned: parseFloat(walletMetrics.commissionEarned) || 0,
        partnerPayouts: parseFloat(walletMetrics.partnerPayouts) || 0,
        walletBalance: parseFloat(walletMetrics.totalWalletBalance) || 0,
        pendingPayments: parseInt(paymentMetrics.pendingPayments) || 0,
        failedTransactions: parseInt(paymentMetrics.failedTransactions) || 0,
        refundRate:
          completedTransactions > 0
            ? (completedRefunds / completedTransactions) * 100
            : 0,
        conversionRate: this.calculateConversionRate(
          completedTransactions,
          parseInt(paymentMetrics.failedTransactions) || 0,
        ),
      };
    } catch (error) {
      this.logger.error('Failed to get financial metrics:', error);
      throw error;
    }
  }

  async getRevenueBreakdown(
    filters: FinancialReportFilters = {},
  ): Promise<RevenueBreakdown> {
    const whereClause = this.buildWhereClause(filters);

    try {
      const breakdown = await this.paymentRepository
        .createQueryBuilder('payment')
        .leftJoin('payment.booking', 'booking')
        .select([
          "SUM(CASE WHEN payment.type = 'BOOKING' THEN payment.amount ELSE 0 END) as bookingRevenue",
          "SUM(CASE WHEN payment.type = 'COMMISSION' THEN payment.amount ELSE 0 END) as commissionRevenue",
          "SUM(CASE WHEN payment.type = 'FEE' THEN payment.amount ELSE 0 END) as feeRevenue",
          "SUM(CASE WHEN payment.type NOT IN ('BOOKING', 'COMMISSION', 'FEE') THEN payment.amount ELSE 0 END) as otherRevenue",
          'SUM(payment.amount) as totalRevenue',
        ])
        .where(whereClause.payments)
        .andWhere('payment.status = :status', { status: 'COMPLETED' })
        .getRawOne();

      return {
        bookingRevenue: parseFloat(breakdown.bookingRevenue) || 0,
        commissionRevenue: parseFloat(breakdown.commissionRevenue) || 0,
        feeRevenue: parseFloat(breakdown.feeRevenue) || 0,
        otherRevenue: parseFloat(breakdown.otherRevenue) || 0,
        totalRevenue: parseFloat(breakdown.totalRevenue) || 0,
      };
    } catch (error) {
      this.logger.error('Failed to get revenue breakdown:', error);
      throw error;
    }
  }

  async getTransactionTrends(
    startDate: Date,
    endDate: Date,
    interval: 'day' | 'week' | 'month' = 'day',
  ): Promise<TransactionTrends[]> {
    try {
      const dateFormat = this.getDateFormat(interval);

      const trends = await this.paymentRepository
        .createQueryBuilder('payment')
        .select([
          `DATE_FORMAT(payment.createdAt, '${dateFormat}') as period`,
          "SUM(CASE WHEN payment.status = 'COMPLETED' THEN payment.amount ELSE 0 END) as revenue",
          "COUNT(CASE WHEN payment.status = 'COMPLETED' THEN 1 END) as transactions",
          "COUNT(CASE WHEN payment.status = 'FAILED' THEN 1 END) as failedTransactions",
          "AVG(CASE WHEN payment.status = 'COMPLETED' THEN payment.amount END) as averageValue",
        ])
        .where('payment.createdAt BETWEEN :startDate AND :endDate', {
          startDate,
          endDate,
        })
        .groupBy('period')
        .orderBy('period', 'ASC')
        .getRawMany();

      // Get refund data for the same periods
      const refundTrends = await this.refundRepository
        .createQueryBuilder('refund')
        .select([
          `DATE_FORMAT(refund.createdAt, '${dateFormat}') as period`,
          "SUM(CASE WHEN refund.status = 'COMPLETED' THEN refund.amount ELSE 0 END) as refunds",
        ])
        .where('refund.createdAt BETWEEN :startDate AND :endDate', {
          startDate,
          endDate,
        })
        .groupBy('period')
        .getRawMany();

      // Merge payment and refund data
      const refundMap = new Map(
        refundTrends.map((r) => [r.period, parseFloat(r.refunds) || 0]),
      );

      return trends.map((trend) => ({
        period: trend.period,
        revenue: parseFloat(trend.revenue) || 0,
        transactions: parseInt(trend.transactions) || 0,
        refunds: refundMap.get(trend.period) || 0,
        averageValue: parseFloat(trend.averageValue) || 0,
      }));
    } catch (error) {
      this.logger.error('Failed to get transaction trends:', error);
      throw error;
    }
  }

  async getTopPartners(
    filters: FinancialReportFilters = {},
    limit: number = 10,
  ): Promise<
    Array<{
      partnerId: string;
      partnerName: string;
      revenue: number;
      transactions: number;
      commission: number;
    }>
  > {
    try {
      const whereClause = this.buildWhereClause(filters);

      const topPartners = await this.paymentRepository
        .createQueryBuilder('payment')
        .leftJoin('payment.booking', 'booking')
        .leftJoin('booking.spaceOption', 'spaceOption')
        .leftJoin('spaceOption.space', 'space')
        .leftJoin('space.listing', 'listing')
        .leftJoin('listing.partner', 'partner')
        .select([
          'partner.id as partnerId',
          'partner.businessName as partnerName',
          "SUM(CASE WHEN payment.status = 'COMPLETED' THEN payment.amount ELSE 0 END) as revenue",
          "COUNT(CASE WHEN payment.status = 'COMPLETED' THEN 1 END) as transactions",
          "SUM(CASE WHEN payment.status = 'COMPLETED' THEN payment.amount * 0.1 ELSE 0 END) as commission", // Assuming 10% commission
        ])
        .where(whereClause.payments)
        .andWhere('partner.id IS NOT NULL')
        .groupBy('partner.id, partner.businessName')
        .orderBy('revenue', 'DESC')
        .limit(limit)
        .getRawMany();

      return topPartners.map((partner) => ({
        partnerId: partner.partnerId,
        partnerName: partner.partnerName || 'Unknown Partner',
        revenue: parseFloat(partner.revenue) || 0,
        transactions: parseInt(partner.transactions) || 0,
        commission: parseFloat(partner.commission) || 0,
      }));
    } catch (error) {
      this.logger.error('Failed to get top partners:', error);
      return [];
    }
  }

  async getRecentTransactions(limit: number = 20): Promise<
    Array<{
      id: string;
      type: string;
      amount: number;
      status: string;
      createdAt: Date;
      description: string;
    }>
  > {
    try {
      const recentPayments = await this.paymentRepository
        .createQueryBuilder('payment')
        .select([
          'payment.id as id',
          "'PAYMENT' as type",
          'payment.amount as amount',
          'payment.status as status',
          'payment.createdAt as createdAt',
          'payment.description as description',
        ])
        .orderBy('payment.createdAt', 'DESC')
        .limit(limit / 2)
        .getRawMany();

      const recentRefunds = await this.refundRepository
        .createQueryBuilder('refund')
        .select([
          'refund.id as id',
          "'REFUND' as type",
          'refund.amount as amount',
          'refund.status as status',
          'refund.createdAt as createdAt',
          'refund.reason as description',
        ])
        .orderBy('refund.createdAt', 'DESC')
        .limit(limit / 2)
        .getRawMany();

      const allTransactions = [...recentPayments, ...recentRefunds]
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        )
        .slice(0, limit);

      return allTransactions.map((transaction) => ({
        id: transaction.id,
        type: transaction.type,
        amount: parseFloat(transaction.amount) || 0,
        status: transaction.status,
        createdAt: new Date(transaction.createdAt),
        description:
          transaction.description || `${transaction.type} transaction`,
      }));
    } catch (error) {
      this.logger.error('Failed to get recent transactions:', error);
      return [];
    }
  }

  async getFinancialAlerts(): Promise<
    Array<{
      type: 'warning' | 'error' | 'info';
      message: string;
      timestamp: Date;
      severity: 'low' | 'medium' | 'high' | 'critical';
    }>
  > {
    const alerts = [];
    const now = new Date();
    const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    try {
      // Check for high failure rate
      const failureRate = await this.getFailureRate(last24Hours, now);
      if (failureRate > 10) {
        alerts.push({
          type: 'error' as const,
          message: `High payment failure rate detected: ${failureRate.toFixed(1)}%`,
          timestamp: now,
          severity:
            failureRate > 20 ? ('critical' as const) : ('high' as const),
        });
      }

      // Check for unusual refund activity
      const refundRate = await this.getRefundRate(last24Hours, now);
      if (refundRate > 15) {
        alerts.push({
          type: 'warning' as const,
          message: `Elevated refund rate: ${refundRate.toFixed(1)}%`,
          timestamp: now,
          severity: refundRate > 25 ? ('high' as const) : ('medium' as const),
        });
      }

      // Check for large pending amounts
      const pendingAmount = await this.getPendingPaymentAmount();
      if (pendingAmount > 100000) {
        // ₹1 lakh
        alerts.push({
          type: 'warning' as const,
          message: `Large amount pending: ₹${pendingAmount.toLocaleString()}`,
          timestamp: now,
          severity:
            pendingAmount > 500000 ? ('high' as const) : ('medium' as const),
        });
      }

      // Check for reconciliation issues
      const reconciliationIssues = await this.checkReconciliationIssues();
      if (reconciliationIssues > 0) {
        alerts.push({
          type: 'error' as const,
          message: `${reconciliationIssues} wallet reconciliation issues detected`,
          timestamp: now,
          severity:
            reconciliationIssues > 10
              ? ('critical' as const)
              : ('high' as const),
        });
      }

      return alerts;
    } catch (error) {
      this.logger.error('Failed to get financial alerts:', error);
      return [
        {
          type: 'error' as const,
          message: 'Failed to check financial alerts',
          timestamp: now,
          severity: 'medium' as const,
        },
      ];
    }
  }

  async generateFinancialReport(filters: FinancialReportFilters): Promise<{
    summary: FinancialMetrics;
    breakdown: RevenueBreakdown;
    trends: TransactionTrends[];
    details: any[];
    generatedAt: Date;
    period: { startDate: Date; endDate: Date };
  }> {
    try {
      const startDate =
        filters.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const endDate = filters.endDate || new Date();

      const [summary, breakdown, trends, details] = await Promise.all([
        this.getFinancialMetrics(filters),
        this.getRevenueBreakdown(filters),
        this.getTransactionTrends(startDate, endDate),
        this.getDetailedTransactions(filters),
      ]);

      // Store report generation event
      await this.financialEventSourcingService.storeEvent({
        aggregateId: `financial-report-${Date.now()}`,
        aggregateType: AggregateType.FINANCIAL_REPORT,
        eventType: FinancialEventType.REPORT_GENERATED,
        eventData: {
          filters,
          summary,
          breakdown,
          trendsCount: trends.length,
          detailsCount: details.length,
        },
        metadata: {
          generatedAt: new Date(),
          reportType: 'FINANCIAL_SUMMARY',
        },
      });

      return {
        summary,
        breakdown,
        trends,
        details,
        generatedAt: new Date(),
        period: { startDate, endDate },
      };
    } catch (error) {
      this.logger.error('Failed to generate financial report:', error);
      throw error;
    }
  }

  // Private helper methods
  private buildWhereClause(filters: FinancialReportFilters) {
    const conditions = {
      payments: '1=1',
      refunds: '1=1',
      walletTransactions: '1=1',
    };

    if (filters.startDate) {
      conditions.payments += ` AND payment.createdAt >= '${filters.startDate.toISOString()}'`;
      conditions.refunds += ` AND refund.createdAt >= '${filters.startDate.toISOString()}'`;
      conditions.walletTransactions += ` AND wallet.createdAt >= '${filters.startDate.toISOString()}'`;
    }

    if (filters.endDate) {
      conditions.payments += ` AND payment.createdAt <= '${filters.endDate.toISOString()}'`;
      conditions.refunds += ` AND refund.createdAt <= '${filters.endDate.toISOString()}'`;
      conditions.walletTransactions += ` AND wallet.createdAt <= '${filters.endDate.toISOString()}'`;
    }

    if (filters.partnerId) {
      conditions.payments += ` AND payment.partnerId = '${filters.partnerId}'`;
    }

    if (filters.currency) {
      conditions.payments += ` AND payment.currency = '${filters.currency}'`;
      conditions.refunds += ` AND refund.currency = '${filters.currency}'`;
      conditions.walletTransactions += ` AND wallet.currency = '${filters.currency}'`;
    }

    if (filters.status) {
      conditions.payments += ` AND payment.status = '${filters.status}'`;
      conditions.refunds += ` AND refund.status = '${filters.status}'`;
    }

    if (filters.minAmount) {
      conditions.payments += ` AND payment.amount >= ${filters.minAmount}`;
      conditions.refunds += ` AND refund.amount >= ${filters.minAmount}`;
    }

    if (filters.maxAmount) {
      conditions.payments += ` AND payment.amount <= ${filters.maxAmount}`;
      conditions.refunds += ` AND refund.amount <= ${filters.maxAmount}`;
    }

    return conditions;
  }

  private getDateFormat(interval: 'day' | 'week' | 'month'): string {
    switch (interval) {
      case 'day':
        return '%Y-%m-%d';
      case 'week':
        return '%Y-%u';
      case 'month':
        return '%Y-%m';
      default:
        return '%Y-%m-%d';
    }
  }

  private calculateConversionRate(successful: number, failed: number): number {
    const total = successful + failed;
    return total > 0 ? (successful / total) * 100 : 0;
  }

  private async getFailureRate(
    startDate: Date,
    endDate: Date,
  ): Promise<number> {
    const result = await this.paymentRepository
      .createQueryBuilder('payment')
      .select([
        "COUNT(CASE WHEN payment.status = 'FAILED' THEN 1 END) as failed",
        'COUNT(*) as total',
      ])
      .where('payment.createdAt BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      })
      .getRawOne();

    const total = parseInt(result.total) || 0;
    const failed = parseInt(result.failed) || 0;
    return total > 0 ? (failed / total) * 100 : 0;
  }

  private async getRefundRate(startDate: Date, endDate: Date): Promise<number> {
    const paymentCount = await this.paymentRepository
      .createQueryBuilder('payment')
      .where('payment.createdAt BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      })
      .andWhere('payment.status = :status', { status: 'COMPLETED' })
      .getCount();

    const refundCount = await this.refundRepository
      .createQueryBuilder('refund')
      .where('refund.createdAt BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      })
      .andWhere('refund.status = :status', { status: 'COMPLETED' })
      .getCount();

    return paymentCount > 0 ? (refundCount / paymentCount) * 100 : 0;
  }

  private async getPendingPaymentAmount(): Promise<number> {
    const result = await this.paymentRepository
      .createQueryBuilder('payment')
      .select('SUM(payment.amount) as pendingAmount')
      .where('payment.status = :status', { status: 'PENDING' })
      .getRawOne();

    return parseFloat(result.pendingAmount) || 0;
  }

  private async checkReconciliationIssues(): Promise<number> {
    // This would integrate with the wallet reconciliation service
    // For now, return a mock value
    return 0;
  }

  private async getDetailedTransactions(
    filters: FinancialReportFilters,
  ): Promise<any[]> {
    const whereClause = this.buildWhereClause(filters);

    const transactions = await this.paymentRepository
      .createQueryBuilder('payment')
      .leftJoin('payment.booking', 'booking')
      .leftJoin('booking.user', 'user')
      .select([
        'payment.id',
        'payment.amount',
        'payment.currency',
        'payment.status',
        'payment.type',
        'payment.createdAt',
        'payment.description',
        'booking.id as bookingId',
        'user.email as userEmail',
      ])
      .where(whereClause.payments)
      .orderBy('payment.createdAt', 'DESC')
      .limit(1000) // Limit for performance
      .getRawMany();

    return transactions;
  }
}
