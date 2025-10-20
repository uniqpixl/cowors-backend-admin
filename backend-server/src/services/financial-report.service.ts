import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';

import { UserEntity } from '@/auth/entities/user.entity';
import { TransactionType } from '@/common/enums/wallet.enum';
import { BookingEntity } from '@/database/entities/booking.entity';
import { PayoutEntity } from '@/database/entities/payout.entity';
import { WalletTransactionEntity } from '@/database/entities/wallet-transaction.entity';
import {
  FinancialReportEntity,
  ReportStatus,
  ReportType,
} from '../database/entities/financial-report.entity';
import { CreateFinancialReportDto } from '../dto/create-financial-report.dto';

@Injectable()
export class FinancialReportService {
  constructor(
    @InjectRepository(FinancialReportEntity)
    private readonly reportRepository: Repository<FinancialReportEntity>,
    @InjectRepository(BookingEntity)
    private readonly bookingRepository: Repository<BookingEntity>,
    @InjectRepository(PayoutEntity)
    private readonly payoutRepository: Repository<PayoutEntity>,
    @InjectRepository(WalletTransactionEntity)
    private readonly walletTransactionRepository: Repository<WalletTransactionEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
  ) {}

  async create(
    createReportDto: CreateFinancialReportDto,
    generatedBy: string,
  ): Promise<FinancialReportEntity> {
    const report = this.reportRepository.create({
      ...createReportDto,
      periodStart: new Date(createReportDto.periodStart),
      periodEnd: new Date(createReportDto.periodEnd),
      generatedBy,
      status: ReportStatus.GENERATING,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    });

    const savedReport = await this.reportRepository.save(report);

    // Generate report data asynchronously
    this.generateReportData(savedReport.id).catch((error) => {
      // Log error using proper logger instead of console
      this.updateReportStatus(savedReport.id, ReportStatus.FAILED, {
        errorMessage: error.message,
      });
    });

    return savedReport;
  }

  async findAll(
    page: number = 1,
    limit: number = 10,
    reportType?: ReportType,
    status?: ReportStatus,
    generatedBy?: string,
  ): Promise<{
    reports: FinancialReportEntity[];
    total: number;
    totalPages: number;
    currentPage: number;
  }> {
    const queryBuilder = this.reportRepository
      .createQueryBuilder('report')
      .leftJoinAndSelect('report.generatedByUser', 'generatedByUser');

    if (reportType) {
      queryBuilder.andWhere('report.reportType = :reportType', { reportType });
    }

    if (status) {
      queryBuilder.andWhere('report.status = :status', { status });
    }

    if (generatedBy) {
      queryBuilder.andWhere('report.generatedBy = :generatedBy', {
        generatedBy,
      });
    }

    const total = await queryBuilder.getCount();
    const reports = await queryBuilder
      .orderBy('report.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getMany();

    return {
      reports,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
    };
  }

  async findOne(id: string): Promise<FinancialReportEntity> {
    const report = await this.reportRepository.findOne({
      where: { id },
      relations: ['generatedByUser'],
    });

    if (!report) {
      throw new NotFoundException('Financial report not found');
    }

    return report;
  }

  async remove(id: string): Promise<void> {
    const report = await this.findOne(id);
    await this.reportRepository.remove(report);
  }

  private async generateReportData(reportId: string): Promise<void> {
    const report = await this.findOne(reportId);

    try {
      let reportData: any;

      switch (report.reportType) {
        case ReportType.REVENUE:
          reportData = await this.generateRevenueReport(
            report.periodStart,
            report.periodEnd,
            report.filters,
          );
          break;
        case ReportType.COMMISSION:
          reportData = await this.generateCommissionReport(
            report.periodStart,
            report.periodEnd,
            report.filters,
          );
          break;
        case ReportType.PAYOUT:
          reportData = await this.generatePayoutReport(
            report.periodStart,
            report.periodEnd,
            report.filters,
          );
          break;
        case ReportType.PARTNER_PERFORMANCE:
          reportData = await this.generatePartnerPerformanceReport(
            report.periodStart,
            report.periodEnd,
            report.filters,
          );
          break;
        case ReportType.BOOKING_ANALYTICS:
          reportData = await this.generateBookingAnalyticsReport(
            report.periodStart,
            report.periodEnd,
            report.filters,
          );
          break;
        case ReportType.FINANCIAL_SUMMARY:
          reportData = await this.generateFinancialSummaryReport(
            report.periodStart,
            report.periodEnd,
            report.filters,
          );
          break;
        default:
          throw new Error(`Unsupported report type: ${report.reportType}`);
      }

      await this.updateReportStatus(reportId, ReportStatus.COMPLETED, {
        reportData,
        completedAt: new Date(),
        downloadUrl: `/api/financial-reports/${reportId}/download`,
      });
    } catch (error) {
      await this.updateReportStatus(reportId, ReportStatus.FAILED, {
        errorMessage: error.message,
      });
    }
  }

  private async updateReportStatus(
    reportId: string,
    status: ReportStatus,
    updates: Partial<FinancialReportEntity>,
  ): Promise<void> {
    await this.reportRepository.update(reportId, {
      status,
      ...updates,
    });
  }

  private async generateRevenueReport(
    startDate: Date,
    endDate: Date,
    filters?: any,
  ): Promise<any> {
    const queryBuilder = this.bookingRepository
      .createQueryBuilder('booking')
      .leftJoinAndSelect('booking.spaceOption', 'spaceOption')
      .leftJoinAndSelect('spaceOption.space', 'space')
      .leftJoinAndSelect('space.partner', 'partner')
      .leftJoinAndSelect('partner.user', 'user')
      .where('booking.createdAt BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      })
      .andWhere('booking.status IN (:...statuses)', {
        statuses: ['confirmed', 'completed'],
      });

    if (filters?.partnerIds?.length) {
      queryBuilder.andWhere('space.partnerId IN (:...partnerIds)', {
        partnerIds: filters.partnerIds,
      });
    }

    if (filters?.spaceTypes?.length) {
      queryBuilder.andWhere('space.type IN (:...spaceTypes)', {
        spaceTypes: filters.spaceTypes,
      });
    }

    const bookings = await queryBuilder.getMany();

    const totalRevenue = bookings.reduce(
      (sum, booking) => sum + Number(booking.totalAmount),
      0,
    );

    const revenueByPartner = bookings.reduce(
      (acc, booking) => {
        const partnerId = booking.spaceOption.space.listing?.partner?.id;
        acc[partnerId] = (acc[partnerId] || 0) + Number(booking.totalAmount);
        return acc;
      },
      {} as Record<string, number>,
    );

    const revenueBySpaceType = bookings.reduce(
      (acc, booking) => {
        const spaceType = booking.spaceOption.space.spaceType;
        acc[spaceType] = (acc[spaceType] || 0) + Number(booking.totalAmount);
        return acc;
      },
      {} as Record<string, number>,
    );

    return {
      summary: {
        totalBookings: bookings.length,
        totalRevenue,
        averageBookingValue: totalRevenue / bookings.length || 0,
      },
      revenueByPartner,
      revenueBySpaceType,
      bookings: bookings.map((booking) => ({
        id: booking.id,
        spaceId: booking.spaceOption.space.id,
        spaceName: booking.spaceOption.space.name,
        partnerId: booking.spaceOption.space.listing?.partner?.id,
        partnerName:
          booking.spaceOption.space.listing?.partner?.businessName || 'Unknown',
        amount: booking.totalAmount,
        bookingDate: booking.startDateTime,
        status: booking.status,
      })),
    };
  }

  private async generateCommissionReport(
    startDate: Date,
    endDate: Date,
    filters?: any,
  ): Promise<any> {
    const transactions = await this.walletTransactionRepository.find({
      where: {
        createdAt: Between(startDate, endDate),
        type: TransactionType.CREDIT,
      },
      relations: ['user'],
    });

    const totalCommission = transactions.reduce(
      (sum, tx) => sum + Number(tx.amount),
      0,
    );

    const commissionByPartner = transactions.reduce(
      (acc, tx) => {
        const partnerId = tx.userId;
        acc[partnerId] = (acc[partnerId] || 0) + Number(tx.amount);
        return acc;
      },
      {} as Record<string, number>,
    );

    return {
      summary: {
        totalTransactions: transactions.length,
        totalCommission,
        averageCommission: totalCommission / transactions.length || 0,
      },
      commissionByPartner,
      transactions: transactions.map((tx) => ({
        id: tx.id,
        partnerId: tx.userId,
        partnerName: tx.user
          ? `${tx.user.firstName || ''} ${tx.user.lastName || ''}`.trim() ||
            tx.user.username
          : 'Unknown',
        amount: tx.amount,
        date: tx.createdAt,
        description: tx.description,
      })),
    };
  }

  private async generatePayoutReport(
    startDate: Date,
    endDate: Date,
    filters?: any,
  ): Promise<any> {
    const queryBuilder = this.payoutRepository
      .createQueryBuilder('payout')
      .leftJoinAndSelect('payout.partner', 'partner')
      .leftJoin(
        'partner_entity',
        'partnerEntity',
        'partnerEntity.userId = payout.partnerId',
      )
      .addSelect('partnerEntity.businessName', 'businessName')
      .where('payout.createdAt BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      });

    if (filters?.partnerIds?.length) {
      queryBuilder.andWhere('payout.partnerId IN (:...partnerIds)', {
        partnerIds: filters.partnerIds,
      });
    }

    const payouts = await queryBuilder.getMany();

    const totalPayouts = payouts.reduce(
      (sum, payout) => sum + Number(payout.amount),
      0,
    );

    const payoutsByStatus = payouts.reduce(
      (acc, payout) => {
        acc[payout.status] = (acc[payout.status] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    return {
      summary: {
        totalPayouts: payouts.length,
        totalAmount: totalPayouts,
        averagePayoutAmount: totalPayouts / payouts.length || 0,
      },
      payoutsByStatus,
      payouts: payouts.map((payout) => ({
        id: payout.id,
        partnerId: payout.partnerId,
        partnerName:
          (payout as any).businessName ||
          `${payout.partner?.firstName || ''} ${payout.partner?.lastName || ''}`.trim() ||
          payout.partner?.username ||
          'Unknown Partner',
        amount: payout.amount,
        status: payout.status,
        payoutMethod: payout.payoutMethod,
        createdAt: payout.createdAt,
      })),
    };
  }

  private async generatePartnerPerformanceReport(
    startDate: Date,
    endDate: Date,
    filters?: any,
  ): Promise<any> {
    // This would combine booking, revenue, and commission data by partner
    const bookings = await this.bookingRepository
      .createQueryBuilder('booking')
      .leftJoinAndSelect('booking.spaceOption', 'spaceOption')
      .leftJoinAndSelect('spaceOption.space', 'space')
      .leftJoinAndSelect('space.listing', 'listing')
      .leftJoinAndSelect('listing.partner', 'partner')
      .where('booking.createdAt BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      })
      .getMany();

    const partnerPerformance = bookings.reduce(
      (acc, booking) => {
        const partnerId = booking.spaceOption.space.listing?.partner?.id;
        if (!acc[partnerId]) {
          acc[partnerId] = {
            partnerId,
            partnerName:
              booking.spaceOption.space.listing?.partner?.businessName ||
              `${booking.spaceOption.space.listing?.partner?.user?.firstName || ''} ${booking.spaceOption.space.listing?.partner?.user?.lastName || ''}`.trim() ||
              booking.spaceOption.space.listing?.partner?.user?.username ||
              'Unknown Partner',
            totalBookings: 0,
            totalRevenue: 0,
            averageBookingValue: 0,
          };
        }
        acc[partnerId].totalBookings += 1;
        acc[partnerId].totalRevenue += Number(booking.totalAmount);
        return acc;
      },
      {} as Record<string, any>,
    );

    // Calculate averages
    Object.values(partnerPerformance).forEach((partner: any) => {
      partner.averageBookingValue =
        partner.totalRevenue / partner.totalBookings;
    });

    return {
      summary: {
        totalPartners: Object.keys(partnerPerformance).length,
        totalBookings: bookings.length,
        totalRevenue: bookings.reduce(
          (sum, b) => sum + Number(b.totalAmount),
          0,
        ),
      },
      partnerPerformance: Object.values(partnerPerformance),
    };
  }

  private async generateBookingAnalyticsReport(
    startDate: Date,
    endDate: Date,
    filters?: any,
  ): Promise<any> {
    const bookings = await this.bookingRepository.find({
      where: {
        createdAt: Between(startDate, endDate),
      },
      relations: [
        'spaceOption',
        'spaceOption.space',
        'spaceOption.space.listing',
        'spaceOption.space.listing.partner',
        'user',
      ],
    });

    const bookingsByStatus = bookings.reduce(
      (acc, booking) => {
        acc[booking.status] = (acc[booking.status] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    const bookingsBySpaceType = bookings.reduce(
      (acc, booking) => {
        const spaceType = booking.spaceOption.space.spaceType;
        acc[spaceType] = (acc[spaceType] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    return {
      summary: {
        totalBookings: bookings.length,
        uniqueCustomers: new Set(bookings.map((b) => b.userId)).size,
        uniqueSpaces: new Set(bookings.map((b) => b.spaceOption.space.id)).size,
      },
      bookingsByStatus,
      bookingsBySpaceType,
      bookings: bookings.slice(0, 100), // Limit for performance
    };
  }

  private async generateFinancialSummaryReport(
    startDate: Date,
    endDate: Date,
    filters?: any,
  ): Promise<any> {
    // Combine all financial data for a comprehensive summary
    const [revenueData, commissionData, payoutData] = await Promise.all([
      this.generateRevenueReport(startDate, endDate, filters),
      this.generateCommissionReport(startDate, endDate, filters),
      this.generatePayoutReport(startDate, endDate, filters),
    ]);

    return {
      period: { startDate, endDate },
      revenue: revenueData.summary,
      commission: commissionData.summary,
      payouts: payoutData.summary,
      netRevenue:
        revenueData.summary.totalRevenue - payoutData.summary.totalAmount,
    };
  }

  async getReportDownloadUrl(id: string): Promise<string> {
    const report = await this.findOne(id);

    if (report.status !== ReportStatus.COMPLETED) {
      throw new Error('Report is not ready for download');
    }

    return report.downloadUrl || '';
  }
}
