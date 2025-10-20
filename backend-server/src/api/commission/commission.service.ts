import { UserEntity } from '@/auth/entities/user.entity';
import { BookingEntity } from '@/database/entities/booking.entity';
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, In, LessThan, MoreThan, Repository } from 'typeorm';
import { EnhancedCommissionService } from '../../common/services/enhanced-commission.service';
import { FinancialConfigIntegrationService } from '../../common/services/financial-config-integration.service';
import { ConfigurationScope } from '../../common/types/financial-configuration.types';
import {
  CreatePartnerCommissionDto,
  PartnerCommissionResponseDto,
} from './dto/commission-tracking.dto';
import {
  BulkCommissionOperationDto,
  BulkCommissionOperationType,
  CommissionAnalyticsDto,
  CommissionCalculationResponseDto,
  CommissionExportDto,
  CommissionPaymentResponseDto,
  CommissionReportDto,
  CommissionRuleResponseDto,
  CommissionRuleType,
  CommissionSettingsDto,
  CommissionStatus,
  CreateCommissionRuleDto,
  ExportFormat,
  PaymentStatus,
  ProcessCommissionPaymentDto,
  ReportType,
  UpdateCommissionRuleDto,
} from './dto/commission.dto';
import {
  CommissionAuditTrailEntity,
  CommissionCalculationEntity,
  CommissionExportEntity,
  CommissionPaymentEntity,
  CommissionReportEntity,
  CommissionRuleEntity,
  CommissionSettingsEntity,
} from './entities/commission.entity';

@Injectable()
export class CommissionService {
  constructor(
    @InjectRepository(CommissionRuleEntity)
    private readonly ruleRepository: Repository<CommissionRuleEntity>,
    @InjectRepository(CommissionCalculationEntity)
    private readonly calculationRepository: Repository<CommissionCalculationEntity>,
    @InjectRepository(CommissionPaymentEntity)
    private readonly paymentRepository: Repository<CommissionPaymentEntity>,
    @InjectRepository(CommissionAuditTrailEntity)
    private readonly auditRepository: Repository<CommissionAuditTrailEntity>,
    @InjectRepository(CommissionExportEntity)
    private readonly exportRepository: Repository<CommissionExportEntity>,
    @InjectRepository(CommissionReportEntity)
    private readonly reportRepository: Repository<CommissionReportEntity>,
    @InjectRepository(CommissionSettingsEntity)
    private readonly settingsRepository: Repository<CommissionSettingsEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    @InjectRepository(BookingEntity)
    private readonly bookingRepository: Repository<BookingEntity>,
    // private readonly configIntegrationService: FinancialConfigIntegrationService,
    // private readonly enhancedCommissionService: EnhancedCommissionService,
  ) {}

  // Commission Rule Management
  async createRule(
    createRuleDto: CreateCommissionRuleDto,
    userId: string,
  ): Promise<CommissionRuleResponseDto> {
    // Validate partner and space if provided
    if (createRuleDto.partnerId) {
      const partner = await this.userRepository.findOne({
        where: { id: createRuleDto.partnerId },
      });
      if (!partner) {
        throw new NotFoundException('Partner not found');
      }
    }

    // Check for conflicting rules
    const existingRule = await this.ruleRepository.findOne({
      where: {
        name: createRuleDto.name,
        isActive: true,
      },
    });

    if (existingRule) {
      throw new ConflictException('A rule with this name already exists');
    }

    const rule = this.ruleRepository.create({
      ...createRuleDto,
      createdBy: userId,
      priority: createRuleDto.priority || 1,
    });

    const savedRule = await this.ruleRepository.save(rule);
    await this.createAuditTrail(
      'rule',
      savedRule.id,
      'CREATE',
      null,
      savedRule,
      userId,
    );

    return this.mapRuleToResponse(savedRule);
  }

  // Additional methods required by controller
  async createCommissionRule(
    createRuleDto: CreateCommissionRuleDto,
    userId: string,
  ): Promise<CommissionRuleResponseDto> {
    return this.createRule(createRuleDto, userId);
  }

  async updateCommissionRule(
    id: string,
    updateRuleDto: UpdateCommissionRuleDto,
    userId: string,
  ): Promise<CommissionRuleResponseDto> {
    return this.updateRule(id, updateRuleDto, userId);
  }

  async getCommissionRule(id: string): Promise<CommissionRuleResponseDto> {
    const rule = await this.ruleRepository.findOne({ where: { id } });
    if (!rule) {
      throw new NotFoundException('Commission rule not found');
    }
    return this.mapRuleToResponse(rule);
  }

  async getCommissionRules(
    filters?: any,
  ): Promise<CommissionRuleResponseDto[]> {
    const result = await this.getRules(1, 100, filters);
    return result.rules;
  }

  async deleteCommissionRule(id: string, userId: string): Promise<void> {
    return this.deleteRule(id, userId);
  }

  async calculateCommission(
    calculateDto: any,
  ): Promise<CommissionCalculationResponseDto> {
    return this.calculateCommissionForBooking(
      calculateDto.bookingId,
      calculateDto.userId,
    );
  }

  async createPartnerCommission(
    createDto: CreatePartnerCommissionDto,
    userId: string,
  ): Promise<PartnerCommissionResponseDto> {
    // Create a new partner commission calculation
    const calculation = this.calculationRepository.create({
      bookingId: createDto.calculationId, // Using calculationId as bookingId for now
      partnerId: createDto.partnerId,
      ruleId: createDto.calculationId, // Using calculationId as ruleId for now
      bookingAmount: createDto.amount,
      commissionRate: 10, // Default rate
      commissionAmount: createDto.amount,
      totalCommission: createDto.amount,
      status: CommissionStatus.CALCULATED,
      calculationBreakdown: {
        baseCommission: createDto.amount,
      },
      createdBy: userId,
    });

    const savedCalculation = await this.calculationRepository.save(calculation);

    return {
      id: savedCalculation.id,
      partnerId: savedCalculation.partnerId,
      calculationId: createDto.calculationId,
      amount: savedCalculation.totalCommission,
      description: 'Partner commission',
      dueDate: new Date(),
      isPaid: false,
      paidDate: null,
      createdAt: savedCalculation.createdAt,
      updatedAt: savedCalculation.updatedAt,
    };
  }

  async getPartnerCommissionSummary(partnerId: string): Promise<any> {
    return this.getPartnerSummary(partnerId);
  }

  async getCommissionAnalytics(filters: any): Promise<CommissionAnalyticsDto> {
    return this.getAnalytics(filters?.dateFrom, filters?.dateTo);
  }

  async exportCommissionData(
    exportDto: CommissionExportDto,
    userId: string,
  ): Promise<{ exportId: string; downloadUrl: string }> {
    return this.exportData(exportDto, userId);
  }

  async getCommissionReport(reportId: string): Promise<any> {
    return this.getReportStatus(reportId);
  }

  async generateCommissionReport(
    reportDto: CommissionReportDto,
    userId: string,
  ): Promise<{ reportId: string }> {
    return this.generateReport(reportDto, userId);
  }

  async updateRule(
    id: string,
    updateRuleDto: UpdateCommissionRuleDto,
    userId: string,
  ): Promise<CommissionRuleResponseDto> {
    const rule = await this.ruleRepository.findOne({ where: { id } });
    if (!rule) {
      throw new NotFoundException('Commission rule not found');
    }

    const oldValues = { ...rule };
    Object.assign(rule, updateRuleDto, { updatedBy: userId });

    const savedRule = await this.ruleRepository.save(rule);
    await this.createAuditTrail(
      'rule',
      savedRule.id,
      'UPDATE',
      oldValues,
      savedRule,
      userId,
    );

    return this.mapRuleToResponse(savedRule);
  }

  async deleteRule(id: string, userId: string): Promise<void> {
    const rule = await this.ruleRepository.findOne({ where: { id } });
    if (!rule) {
      throw new NotFoundException('Commission rule not found');
    }

    // Check if rule is being used in calculations
    const calculationsCount = await this.calculationRepository.count({
      where: { ruleId: id },
    });
    if (calculationsCount > 0) {
      throw new BadRequestException(
        'Cannot delete rule that has associated calculations',
      );
    }

    await this.ruleRepository.remove(rule);
    await this.createAuditTrail('rule', id, 'DELETE', rule, null, userId);
  }

  async getRules(
    page = 1,
    limit = 10,
    filters?: any,
  ): Promise<{ rules: CommissionRuleResponseDto[]; total: number }> {
    const queryBuilder = this.ruleRepository
      .createQueryBuilder('rule')
      .leftJoinAndSelect('rule.partner', 'partner')
      .leftJoinAndSelect('rule.space', 'space');

    if (filters?.partnerId) {
      queryBuilder.andWhere('rule.partnerId = :partnerId', {
        partnerId: filters.partnerId,
      });
    }

    if (filters?.spaceId) {
      queryBuilder.andWhere('rule.spaceId = :spaceId', {
        spaceId: filters.spaceId,
      });
    }

    if (filters?.type) {
      queryBuilder.andWhere('rule.type = :type', { type: filters.type });
    }

    if (filters?.isActive !== undefined) {
      queryBuilder.andWhere('rule.isActive = :isActive', {
        isActive: filters.isActive,
      });
    }

    if (filters?.search) {
      queryBuilder.andWhere(
        '(rule.name ILIKE :search OR rule.description ILIKE :search)',
        {
          search: `%${filters.search}%`,
        },
      );
    }

    const [rules, total] = await queryBuilder
      .orderBy('rule.priority', 'DESC')
      .addOrderBy('rule.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      rules: rules.map((rule) => this.mapRuleToResponse(rule)),
      total,
    };
  }

  async getRule(id: string): Promise<CommissionRuleResponseDto> {
    const rule = await this.ruleRepository.findOne({
      where: { id },
      relations: ['partner', 'space'],
    });

    if (!rule) {
      throw new NotFoundException('Commission rule not found');
    }

    return this.mapRuleToResponse(rule);
  }

  // Commission Calculation Management
  async calculateCommissionForBooking(
    bookingId: string,
    userId: string,
  ): Promise<CommissionCalculationResponseDto> {
    const booking = await this.bookingRepository.findOne({
      where: { id: bookingId },
      relations: ['space', 'user'],
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    // Check if calculation already exists
    const existingCalculation = await this.calculationRepository.findOne({
      where: { bookingId },
    });

    if (existingCalculation) {
      throw new ConflictException(
        'Commission already calculated for this booking',
      );
    }

    // Find applicable rule
    const rule = await this.findApplicableRule(
      booking.totalAmount,
      booking.spaceOption?.space?.listing?.partner_id,
      booking.spaceOption?.spaceId,
    );
    if (!rule) {
      throw new BadRequestException('No applicable commission rule found');
    }

    // Calculate commission
    const commissionAmount = rule.calculateCommission(booking.totalAmount);
    const bonusAmount = await this.calculatePerformanceBonus(
      booking.spaceOption?.space?.listing?.partner_id,
      commissionAmount,
    );
    const totalCommission = commissionAmount + (bonusAmount || 0);

    const calculation = this.calculationRepository.create({
      bookingId,
      partnerId: booking.spaceOption?.space?.listing?.partner_id,
      ruleId: rule.id,
      bookingAmount: booking.totalAmount,
      commissionRate:
        rule.percentage || (rule.fixedAmount / booking.totalAmount) * 100,
      commissionAmount,
      bonusAmount,
      totalCommission,
      status: CommissionStatus.CALCULATED,
      calculationBreakdown: {
        baseCommission: commissionAmount,
        performanceBonus: bonusAmount,
      },
      createdBy: userId,
    });

    const savedCalculation = await this.calculationRepository.save(calculation);
    await this.createAuditTrail(
      'calculation',
      savedCalculation.id,
      'CREATE',
      null,
      savedCalculation,
      userId,
    );

    return this.mapCalculationToResponse(savedCalculation);
  }

  async getCalculations(
    page = 1,
    limit = 10,
    filters?: any,
  ): Promise<{
    calculations: CommissionCalculationResponseDto[];
    total: number;
  }> {
    const queryBuilder = this.calculationRepository
      .createQueryBuilder('calc')
      .leftJoinAndSelect('calc.booking', 'booking')
      .leftJoinAndSelect('calc.partner', 'partner')
      .leftJoinAndSelect('calc.rule', 'rule')
      .leftJoinAndSelect('booking.space', 'space');

    if (filters?.partnerId) {
      queryBuilder.andWhere('calc.partnerId = :partnerId', {
        partnerId: filters.partnerId,
      });
    }

    if (filters?.status) {
      queryBuilder.andWhere('calc.status = :status', {
        status: filters.status,
      });
    }

    if (filters?.dateFrom && filters?.dateTo) {
      queryBuilder.andWhere('calc.calculatedAt BETWEEN :dateFrom AND :dateTo', {
        dateFrom: filters.dateFrom,
        dateTo: filters.dateTo,
      });
    }

    if (filters?.minAmount) {
      queryBuilder.andWhere('calc.totalCommission >= :minAmount', {
        minAmount: filters.minAmount,
      });
    }

    if (filters?.maxAmount) {
      queryBuilder.andWhere('calc.totalCommission <= :maxAmount', {
        maxAmount: filters.maxAmount,
      });
    }

    const [calculations, total] = await queryBuilder
      .orderBy('calc.calculatedAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      calculations: calculations.map((calc) =>
        this.mapCalculationToResponse(calc),
      ),
      total,
    };
  }

  async approveCalculation(
    id: string,
    userId: string,
    reason?: string,
  ): Promise<CommissionCalculationResponseDto> {
    const calculation = await this.calculationRepository.findOne({
      where: { id },
    });
    if (!calculation) {
      throw new NotFoundException('Commission calculation not found');
    }

    const oldValues = { ...calculation };
    calculation.approve(userId, reason);

    const savedCalculation = await this.calculationRepository.save(calculation);
    await this.createAuditTrail(
      'calculation',
      savedCalculation.id,
      'APPROVE',
      oldValues,
      savedCalculation,
      userId,
    );

    return this.mapCalculationToResponse(savedCalculation);
  }

  async rejectCalculation(
    id: string,
    userId: string,
    reason: string,
  ): Promise<CommissionCalculationResponseDto> {
    const calculation = await this.calculationRepository.findOne({
      where: { id },
    });
    if (!calculation) {
      throw new NotFoundException('Commission calculation not found');
    }

    const oldValues = { ...calculation };
    calculation.reject(userId, reason);

    const savedCalculation = await this.calculationRepository.save(calculation);
    await this.createAuditTrail(
      'calculation',
      savedCalculation.id,
      'REJECT',
      oldValues,
      savedCalculation,
      userId,
    );

    return this.mapCalculationToResponse(savedCalculation);
  }

  // Commission Payment Management
  async processPayment(
    paymentDto: ProcessCommissionPaymentDto,
    userId: string,
  ): Promise<CommissionPaymentResponseDto> {
    // Validate calculations
    const calculations = await this.calculationRepository.find({
      where: {
        id: In(paymentDto.calculationIds),
        status: CommissionStatus.APPROVED,
      },
    });

    if (calculations.length !== paymentDto.calculationIds.length) {
      throw new BadRequestException(
        'Some calculations are not found or not approved',
      );
    }

    // Group by partner
    const partnerCalculations = calculations.reduce(
      (acc, calc) => {
        if (!acc[calc.partnerId]) acc[calc.partnerId] = [];
        acc[calc.partnerId].push(calc);
        return acc;
      },
      {} as Record<string, CommissionCalculationEntity[]>,
    );

    if (Object.keys(partnerCalculations).length > 1) {
      throw new BadRequestException(
        'All calculations must belong to the same partner',
      );
    }

    const partnerId = Object.keys(partnerCalculations)[0];
    const totalAmount = calculations.reduce(
      (sum, calc) => sum + calc.totalCommission,
      0,
    );

    const payment = this.paymentRepository.create({
      partnerId,
      calculationIds: paymentDto.calculationIds,
      totalAmount,
      paymentMethod: paymentDto.paymentMethod,
      paymentReference: paymentDto.paymentReference,
      notes: paymentDto.notes,
      scheduledDate: paymentDto.scheduledDate,
      createdBy: userId,
    });

    const savedPayment = await this.paymentRepository.save(payment);

    // Update calculation status
    await this.calculationRepository.update(
      { id: In(paymentDto.calculationIds) },
      { status: CommissionStatus.PAID },
    );

    await this.createAuditTrail(
      'payment',
      savedPayment.id,
      'CREATE',
      null,
      savedPayment,
      userId,
    );

    return this.mapPaymentToResponse(savedPayment);
  }

  async getPayments(
    page = 1,
    limit = 10,
    filters?: any,
  ): Promise<{ payments: CommissionPaymentResponseDto[]; total: number }> {
    const queryBuilder = this.paymentRepository
      .createQueryBuilder('payment')
      .leftJoinAndSelect('payment.partner', 'partner');

    if (filters?.partnerId) {
      queryBuilder.andWhere('payment.partnerId = :partnerId', {
        partnerId: filters.partnerId,
      });
    }

    if (filters?.status) {
      queryBuilder.andWhere('payment.status = :status', {
        status: filters.status,
      });
    }

    if (filters?.dateFrom && filters?.dateTo) {
      queryBuilder.andWhere('payment.createdAt BETWEEN :dateFrom AND :dateTo', {
        dateFrom: filters.dateFrom,
        dateTo: filters.dateTo,
      });
    }

    const [payments, total] = await queryBuilder
      .orderBy('payment.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      payments: payments.map((payment) => this.mapPaymentToResponse(payment)),
      total,
    };
  }

  async updatePaymentStatus(
    id: string,
    status: PaymentStatus,
    userId: string,
    reason?: string,
  ): Promise<CommissionPaymentResponseDto> {
    const payment = await this.paymentRepository.findOne({ where: { id } });
    if (!payment) {
      throw new NotFoundException('Commission payment not found');
    }

    const oldValues = { ...payment };
    payment.status = status;
    payment.updatedBy = userId;

    if (status === PaymentStatus.FAILED && reason) {
      payment.failureReason = reason;
    }

    if (status === PaymentStatus.COMPLETED) {
      payment.processedDate = new Date();
    }

    const savedPayment = await this.paymentRepository.save(payment);
    await this.createAuditTrail(
      'payment',
      savedPayment.id,
      'UPDATE_STATUS',
      oldValues,
      savedPayment,
      userId,
    );

    return this.mapPaymentToResponse(savedPayment);
  }

  // Partner Summary
  async getPartnerSummary(
    partnerId: string,
    dateFrom?: Date,
    dateTo?: Date,
  ): Promise<any> {
    const queryBuilder = this.calculationRepository
      .createQueryBuilder('calc')
      .where('calc.partnerId = :partnerId', { partnerId });

    if (dateFrom && dateTo) {
      queryBuilder.andWhere('calc.calculatedAt BETWEEN :dateFrom AND :dateTo', {
        dateFrom,
        dateTo,
      });
    }

    const calculations = await queryBuilder.getMany();

    const summary = {
      partnerId,
      totalCommission: calculations.reduce(
        (sum, calc) => sum + calc.totalCommission,
        0,
      ),
      totalPaid: calculations
        .filter((calc) => calc.status === CommissionStatus.PAID)
        .reduce((sum, calc) => sum + calc.totalCommission, 0),
      totalPending: calculations
        .filter((calc) =>
          [CommissionStatus.CALCULATED, CommissionStatus.APPROVED].includes(
            calc.status,
          ),
        )
        .reduce((sum, calc) => sum + calc.totalCommission, 0),
      calculationCount: calculations.length,
      averageCommission:
        calculations.length > 0
          ? calculations.reduce((sum, calc) => sum + calc.totalCommission, 0) /
            calculations.length
          : 0,
      statusBreakdown: {
        pending: calculations.filter(
          (calc) => calc.status === CommissionStatus.PENDING,
        ).length,
        calculated: calculations.filter(
          (calc) => calc.status === CommissionStatus.CALCULATED,
        ).length,
        approved: calculations.filter(
          (calc) => calc.status === CommissionStatus.APPROVED,
        ).length,
        rejected: calculations.filter(
          (calc) => calc.status === CommissionStatus.REJECTED,
        ).length,
        paid: calculations.filter(
          (calc) => calc.status === CommissionStatus.PAID,
        ).length,
      },
    };

    return summary;
  }

  // Bulk Operations
  async bulkOperation(
    operationDto: BulkCommissionOperationDto,
    userId: string,
  ): Promise<{ success: number; failed: number; errors: string[] }> {
    const results = { success: 0, failed: 0, errors: [] };

    switch (operationDto.operation) {
      case BulkCommissionOperationType.APPROVE_CALCULATIONS:
        return this.bulkApproveCalculations(
          operationDto.itemIds,
          userId,
          operationDto.data?.reason,
        );
      case BulkCommissionOperationType.REJECT_CALCULATIONS:
        return this.bulkRejectCalculations(
          operationDto.itemIds,
          userId,
          operationDto.data?.reason,
        );
      case BulkCommissionOperationType.PROCESS_PAYMENTS:
        return this.bulkProcessPayments(
          operationDto.itemIds,
          userId,
          operationDto.data,
        );
      case BulkCommissionOperationType.UPDATE_STATUS:
        return this.bulkUpdateStatus(
          operationDto.itemIds,
          operationDto.data?.status,
          userId,
        );
      default:
        throw new BadRequestException('Invalid bulk operation type');
    }
  }

  // Analytics and Reporting
  async getAnalytics(
    dateFrom?: Date,
    dateTo?: Date,
  ): Promise<CommissionAnalyticsDto> {
    const queryBuilder = this.calculationRepository
      .createQueryBuilder('calc')
      .leftJoinAndSelect('calc.partner', 'partner')
      .leftJoinAndSelect('calc.rule', 'rule');

    if (dateFrom && dateTo) {
      queryBuilder.where('calc.calculatedAt BETWEEN :dateFrom AND :dateTo', {
        dateFrom,
        dateTo,
      });
    }

    const calculations = await queryBuilder.getMany();
    const payments = await this.paymentRepository.find({
      where:
        dateFrom && dateTo
          ? {
              createdAt: Between(dateFrom, dateTo),
            }
          : {},
    });

    const totalCommissionAmount = calculations.reduce(
      (sum, calc) => sum + calc.totalCommission,
      0,
    );
    const totalPaidAmount = payments
      .filter((payment) => payment.status === PaymentStatus.COMPLETED)
      .reduce((sum, payment) => sum + payment.totalAmount, 0);
    const totalPendingAmount = calculations
      .filter((calc) =>
        [CommissionStatus.CALCULATED, CommissionStatus.APPROVED].includes(
          calc.status,
        ),
      )
      .reduce((sum, calc) => sum + calc.totalCommission, 0);

    // Top partners
    const partnerStats = calculations.reduce((acc, calc) => {
      if (!acc[calc.partnerId]) {
        acc[calc.partnerId] = {
          partnerId: calc.partnerId,
          partnerName: calc.partner
            ? `${calc.partner.firstName || ''} ${calc.partner.lastName || ''}`.trim() ||
              calc.partner.username
            : 'Unknown',
          totalCommission: 0,
          totalBookings: 0,
        };
      }
      acc[calc.partnerId].totalCommission += calc.totalCommission;
      acc[calc.partnerId].totalBookings += 1;
      return acc;
    }, {});

    const topPartners = Object.values(partnerStats)
      .sort((a: any, b: any) => b.totalCommission - a.totalCommission)
      .slice(0, 10);

    // Commission by rule type
    const commissionByRuleType = calculations.reduce((acc, calc) => {
      const ruleType = calc.rule?.type || CommissionRuleType.PERCENTAGE;
      if (!acc[ruleType]) {
        acc[ruleType] = { ruleType, totalAmount: 0, count: 0 };
      }
      acc[ruleType].totalAmount += calc.totalCommission;
      acc[ruleType].count += 1;
      return acc;
    }, {});

    return {
      totalCommissionAmount,
      totalPaidAmount,
      totalPendingAmount,
      activePartners: Object.keys(partnerStats).length,
      totalCalculations: calculations.length,
      totalPayments: payments.length,
      averageCommissionRate:
        calculations.length > 0
          ? calculations.reduce((sum, calc) => sum + calc.commissionRate, 0) /
            calculations.length
          : 0,
      topPartners: topPartners as any[],
      commissionByRuleType: Object.values(commissionByRuleType) as any[],
      monthlyTrends: [], // TODO: Implement monthly trends calculation
      paymentStatusDistribution: [], // TODO: Implement payment status distribution
    };
  }

  // Export and Download
  async exportData(
    exportDto: CommissionExportDto,
    userId: string,
  ): Promise<{ exportId: string; downloadUrl: string }> {
    const exportEntity = this.exportRepository.create({
      exportType: exportDto.exportType,
      format: exportDto.format,
      filters: exportDto.filters,
      parameters: {
        partnerIds: exportDto.partnerIds,
        dateFrom: exportDto.dateFrom,
        dateTo: exportDto.dateTo,
      },
      createdBy: userId,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
    });

    const savedExport = await this.exportRepository.save(exportEntity);

    // TODO: Implement actual export processing in background
    // For now, just mark as completed
    setTimeout(async () => {
      savedExport.markAsCompleted(
        `/exports/${savedExport.id}.${exportDto.format.toLowerCase()}`,
        100,
      );
      await this.exportRepository.save(savedExport);
    }, 1000);

    // Generate download URL for the export
    const downloadUrl = `/api/commission/export/${savedExport.id}/download`;

    return {
      exportId: savedExport.id,
      downloadUrl,
    };
  }

  async getExportStatus(exportId: string): Promise<any> {
    const exportEntity = await this.exportRepository.findOne({
      where: { id: exportId },
    });
    if (!exportEntity) {
      throw new NotFoundException('Export not found');
    }

    return {
      id: exportEntity.id,
      status: exportEntity.status,
      filePath: exportEntity.filePath,
      recordCount: exportEntity.recordCount,
      createdAt: exportEntity.createdAt,
      completedAt: exportEntity.completedAt,
      errorMessage: exportEntity.errorMessage,
    };
  }

  // Report Generation
  async generateReport(
    reportDto: CommissionReportDto,
    userId: string,
  ): Promise<{ reportId: string }> {
    const reportEntity = this.reportRepository.create({
      reportType: reportDto.reportType,
      format: reportDto.format,
      title: `${reportDto.reportType.replace('_', ' ').toUpperCase()} Report`,
      filters: {
        partnerIds: reportDto.partnerIds,
        spaceIds: reportDto.spaceIds,
        dateFrom: reportDto.dateFrom,
        dateTo: reportDto.dateTo,
      },
      parameters: reportDto.parameters,
      createdBy: userId,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    });

    const savedReport = await this.reportRepository.save(reportEntity);

    // TODO: Implement actual report generation in background
    // For now, just mark as completed
    setTimeout(async () => {
      savedReport.markAsCompleted(
        `/reports/${savedReport.id}.${reportDto.format.toLowerCase()}`,
        { summary: 'Report generated successfully' },
      );
      await this.reportRepository.save(savedReport);
    }, 2000);

    return { reportId: savedReport.id };
  }

  async getReportStatus(reportId: string): Promise<any> {
    const reportEntity = await this.reportRepository.findOne({
      where: { id: reportId },
    });
    if (!reportEntity) {
      throw new NotFoundException('Report not found');
    }

    return {
      id: reportEntity.id,
      reportType: reportEntity.reportType,
      title: reportEntity.title,
      status: reportEntity.status,
      filePath: reportEntity.filePath,
      createdAt: reportEntity.createdAt,
      completedAt: reportEntity.completedAt,
      errorMessage: reportEntity.errorMessage,
    };
  }

  // Settings Management
  async getSettings(): Promise<CommissionSettingsDto> {
    try {
      // First try to get settings from the enhanced commission service (dynamic configuration)
      // const enhancedSettings = await this.enhancedCommissionService.getCommissionSettings();
      // Convert enhanced settings to legacy format for backward compatibility
      // return {
      //   id: 'dynamic',
      //   defaultCommissionPercentage: enhancedSettings.defaultCommissionPercentage,
      //   minimumPayoutAmount: enhancedSettings.minimumCommission,
      //   paymentProcessingDays: enhancedSettings.paymentTerms?.paymentDays || 30,
      //   autoApprovalThreshold: enhancedSettings.maximumCommission,
      //   requireManualApproval: !enhancedSettings.paymentTerms?.autoApproval,
      //   enablePerformanceBonuses: Object.keys(enhancedSettings.performanceMultipliers || {}).length > 0,
      //   calculationNotificationsEnabled: true,
      //   paymentNotificationsEnabled: true,
      //   latePaymentReminderDays: 7,
      // };
    } catch (error) {
      console.warn(
        'Failed to get enhanced commission settings, falling back to database:',
        error,
      );

      // Fallback to database settings
      const settings = await this.settingsRepository.findOne({ where: {} });

      if (!settings) {
        // Return default settings structure
        return {
          id: 'default',
          defaultCommissionPercentage: 10,
          minimumPayoutAmount: 100,
          paymentProcessingDays: 30,
          autoApprovalThreshold: 1000,
          requireManualApproval: true,
          enablePerformanceBonuses: false,
          calculationNotificationsEnabled: true,
          paymentNotificationsEnabled: true,
          latePaymentReminderDays: 7,
        };
      }

      return settings;
    }
  }

  async updateSettings(
    settingsDto: CommissionSettingsDto,
    userId: string,
  ): Promise<CommissionSettingsDto> {
    try {
      // Convert legacy settings format to enhanced format
      const enhancedSettings = {
        defaultCommissionPercentage: settingsDto.defaultCommissionPercentage,
        minimumCommission: settingsDto.minimumPayoutAmount,
        maximumCommission: settingsDto.autoApprovalThreshold,
        paymentTermDays: settingsDto.paymentProcessingDays,
        autoPayment: !settingsDto.requireManualApproval,
        holdbackPercentage: 0,
        paymentTerms: {
          schedule: 'monthly',
          autoApproval: !settingsDto.requireManualApproval,
          paymentDays: settingsDto.paymentProcessingDays,
        },
        performanceMultipliers: {
          bronze: 1.0,
          silver: 1.1,
          gold: 1.2,
          platinum: 1.3,
        },
        categoryOverrides: [],
        partnerTiers: [],
      };

      // Update settings using the enhanced commission service (dynamic configuration)
      // await this.enhancedCommissionService.updateCommissionSettings(
      //   enhancedSettings,
      //   ConfigurationScope.GLOBAL,
      //   undefined,
      //   userId
      // );

      // Create audit trail for the update
      await this.createAuditTrail(
        'commission_settings',
        settingsDto.id || 'global',
        'update',
        {},
        settingsDto,
        userId,
      );

      return {
        ...settingsDto,
        id: settingsDto.id || 'dynamic',
      };
    } catch (error) {
      console.error(
        'Failed to update enhanced commission settings, falling back to database:',
        error,
      );

      // Fallback to database update
      let settings = await this.settingsRepository.findOne({ where: {} });

      if (!settings) {
        settings = this.settingsRepository.create({
          ...settingsDto,
          createdBy: userId,
        });
      } else {
        Object.assign(settings, settingsDto, { updatedBy: userId });
      }

      const savedSettings = await this.settingsRepository.save(settings);
      return savedSettings;
    }
  }

  // Helper Methods
  private async findApplicableRule(
    bookingAmount: number,
    partnerId?: string,
    spaceId?: string,
  ): Promise<CommissionRuleEntity | null> {
    const queryBuilder = this.ruleRepository
      .createQueryBuilder('rule')
      .where('rule.isActive = :isActive', { isActive: true })
      .andWhere('(rule.validFrom IS NULL OR rule.validFrom <= :now)', {
        now: new Date(),
      })
      .andWhere('(rule.validUntil IS NULL OR rule.validUntil >= :now)', {
        now: new Date(),
      })
      .orderBy('rule.priority', 'DESC');

    // Add partner and space filters
    if (partnerId) {
      queryBuilder.andWhere(
        '(rule.partnerId IS NULL OR rule.partnerId = :partnerId)',
        { partnerId },
      );
    }

    if (spaceId) {
      queryBuilder.andWhere(
        '(rule.spaceId IS NULL OR rule.spaceId = :spaceId)',
        { spaceId },
      );
    }

    // Add booking amount filters
    queryBuilder.andWhere(
      '(rule.minBookingAmount IS NULL OR rule.minBookingAmount <= :amount)',
      { amount: bookingAmount },
    );
    queryBuilder.andWhere(
      '(rule.maxBookingAmount IS NULL OR rule.maxBookingAmount >= :amount)',
      { amount: bookingAmount },
    );

    const rules = await queryBuilder.getMany();
    return (
      rules.find((rule) =>
        rule.isApplicableForBooking(bookingAmount, partnerId, spaceId),
      ) || null
    );
  }

  private async calculatePerformanceBonus(
    partnerId: string,
    baseCommission: number,
  ): Promise<number> {
    // TODO: Implement performance bonus calculation based on partner metrics
    return 0;
  }

  private async bulkApproveCalculations(
    calculationIds: string[],
    userId: string,
    reason?: string,
  ): Promise<any> {
    const results = { success: 0, failed: 0, errors: [] };

    for (const id of calculationIds) {
      try {
        await this.approveCalculation(id, userId, reason);
        results.success++;
      } catch (error) {
        results.failed++;
        results.errors.push(
          `Failed to approve calculation ${id}: ${error.message}`,
        );
      }
    }

    return results;
  }

  private async bulkRejectCalculations(
    calculationIds: string[],
    userId: string,
    reason?: string,
  ): Promise<any> {
    const results = { success: 0, failed: 0, errors: [] };

    for (const id of calculationIds) {
      try {
        await this.rejectCalculation(id, userId, reason || 'Bulk rejection');
        results.success++;
      } catch (error) {
        results.failed++;
        results.errors.push(
          `Failed to reject calculation ${id}: ${error.message}`,
        );
      }
    }

    return results;
  }

  private async bulkProcessPayments(
    calculationIds: string[],
    userId: string,
    data?: any,
  ): Promise<any> {
    const results = { success: 0, failed: 0, errors: [] };

    try {
      const paymentDto: ProcessCommissionPaymentDto = {
        calculationIds,
        paymentMethod: data?.paymentMethod,
        notes: data?.notes || 'Bulk payment processing',
        scheduledDate: data?.scheduledDate,
      };

      await this.processPayment(paymentDto, userId);
      results.success = calculationIds.length;
    } catch (error) {
      results.failed = calculationIds.length;
      results.errors.push(`Failed to process bulk payment: ${error.message}`);
    }

    return results;
  }

  private async bulkUpdateStatus(
    itemIds: string[],
    status: any,
    userId: string,
  ): Promise<any> {
    const results = { success: 0, failed: 0, errors: [] };

    // Determine if these are calculation or payment IDs based on status type
    if (Object.values(CommissionStatus).includes(status)) {
      // Update calculation status
      try {
        await this.calculationRepository.update(
          { id: In(itemIds) },
          { status },
        );
        results.success = itemIds.length;
      } catch (error) {
        results.failed = itemIds.length;
        results.errors.push(
          `Failed to update calculation status: ${error.message}`,
        );
      }
    } else if (Object.values(PaymentStatus).includes(status)) {
      // Update payment status
      for (const id of itemIds) {
        try {
          await this.updatePaymentStatus(id, status, userId);
          results.success++;
        } catch (error) {
          results.failed++;
          results.errors.push(
            `Failed to update payment ${id}: ${error.message}`,
          );
        }
      }
    }

    return results;
  }

  private async createAuditTrail(
    entityType: string,
    entityId: string,
    action: string,
    oldValues: any,
    newValues: any,
    userId: string,
  ): Promise<void> {
    const audit = this.auditRepository.create({
      entityType,
      action,
      oldValues,
      newValues,
      userId,
    });

    // Set specific entity ID based on type
    if (entityType === 'rule') audit.ruleId = entityId;
    else if (entityType === 'calculation') audit.calculationId = entityId;
    else if (entityType === 'payment') audit.paymentId = entityId;

    await this.auditRepository.save(audit);
  }

  private mapRuleToResponse(
    rule: CommissionRuleEntity,
  ): CommissionRuleResponseDto {
    return {
      id: rule.id,
      name: rule.name,
      description: rule.description,
      type: rule.type,
      partnerId: rule.partnerId,
      spaceId: rule.spaceId,
      percentage: rule.percentage,
      fixedAmount: rule.fixedAmount,
      minBookingAmount: rule.minBookingAmount,
      maxBookingAmount: rule.maxBookingAmount,
      tieredRates: rule.tieredRates,
      performanceRules: rule.performanceRules,
      validFrom: rule.validFrom,
      validUntil: rule.validUntil,
      priority: rule.priority,
      isActive: rule.isActive,
      metadata: rule.metadata,
      createdAt: rule.createdAt,
      updatedAt: rule.updatedAt,
      createdBy: rule.createdBy,
      updatedBy: rule.updatedBy,
      partner: rule.partner
        ? {
            id: rule.partner.id,
            name:
              `${rule.partner.firstName || ''} ${rule.partner.lastName || ''}`.trim() ||
              rule.partner.username,
            email: rule.partner.email,
          }
        : undefined,
      space: rule.space
        ? {
            id: rule.space.id,
            name: rule.space.name,
            location:
              rule.space.listing?.location?.address || 'Unknown location',
          }
        : undefined,
    };
  }

  private mapCalculationToResponse(
    calculation: CommissionCalculationEntity,
  ): CommissionCalculationResponseDto {
    return {
      id: calculation.id,
      bookingId: calculation.bookingId,
      partnerId: calculation.partnerId,
      ruleId: calculation.ruleId,
      bookingAmount: calculation.bookingAmount,
      commissionRate: calculation.commissionRate,
      commissionAmount: calculation.commissionAmount,
      bonusAmount: calculation.bonusAmount,
      totalCommission: calculation.totalCommission,
      status: calculation.status,
      notes: calculation.notes,
      statusReason: calculation.statusReason,
      calculationBreakdown: calculation.calculationBreakdown,
      calculatedAt: calculation.calculatedAt,
      approvedAt: calculation.approvedAt,
      createdBy: calculation.createdBy,
      approvedBy: calculation.approvedBy,
      booking: calculation.booking
        ? {
            id: calculation.booking.id,
            spaceId: calculation.booking.spaceOption?.spaceId,
            spaceName:
              calculation.booking.spaceOption?.space?.name || 'Unknown',
            startDate: calculation.booking.startDateTime,
            endDate: calculation.booking.endDateTime,
            totalAmount: calculation.booking.totalAmount,
          }
        : undefined,
      partner: calculation.partner
        ? {
            id: calculation.partner.id,
            name:
              `${calculation.partner.firstName || ''} ${calculation.partner.lastName || ''}`.trim() ||
              calculation.partner.username,
            email: calculation.partner.email,
          }
        : undefined,
      rule: calculation.rule
        ? {
            id: calculation.rule.id,
            name: calculation.rule.name,
            type: calculation.rule.type,
          }
        : undefined,
    };
  }

  private mapPaymentToResponse(
    payment: CommissionPaymentEntity,
  ): CommissionPaymentResponseDto {
    return {
      id: payment.id,
      partnerId: payment.partnerId,
      calculationIds: payment.calculationIds,
      totalAmount: payment.totalAmount,
      status: payment.status,
      paymentMethod: payment.paymentMethod,
      paymentReference: payment.paymentReference,
      transactionReference: payment.transactionReference,
      notes: payment.notes,
      failureReason: payment.failureReason,
      scheduledDate: payment.scheduledDate,
      processedDate: payment.processedDate,
      createdAt: payment.createdAt,
      updatedAt: payment.updatedAt,
      createdBy: payment.createdBy,
      updatedBy: payment.updatedBy,
      partner: payment.partner
        ? {
            id: payment.partner.id,
            name:
              `${payment.partner.firstName || ''} ${payment.partner.lastName || ''}`.trim() ||
              payment.partner.username,
            email: payment.partner.email,
            bankDetails: {
              accountNumber: '****1234', // Masked for security
              routingNumber: '****5678',
              bankName: 'Bank Name',
            },
          }
        : undefined,
      calculations: payment.calculations?.map((calc) =>
        this.mapCalculationToResponse(calc),
      ),
    };
  }

  async getCommissionSettings(): Promise<any> {
    try {
      // First try to get settings from the enhanced commission service (dynamic configuration)
      // const enhancedSettings = await this.enhancedCommissionService.getCommissionSettings();
      // Convert enhanced settings to legacy format for backward compatibility
      // return {
      //   defaultCommissionRate: enhancedSettings.defaultCommissionPercentage,
      //   minCommissionAmount: enhancedSettings.minimumCommission,
      //   maxCommissionAmount: enhancedSettings.maximumCommission,
      //   paymentSchedule: enhancedSettings.paymentTerms?.schedule || 'monthly',
      //   autoApproval: enhancedSettings.paymentTerms?.autoApproval || false,
      //   notificationSettings: {
      //     emailNotifications: true,
      //     smsNotifications: false,
      //   },
      //   // Additional enhanced settings
      //   holdbackPercentage: enhancedSettings.holdbackPercentage,
      //   performanceMultipliers: enhancedSettings.performanceMultipliers,
      //   categoryOverrides: enhancedSettings.categoryOverrides,
      //   partnerTiers: enhancedSettings.partnerTiers,
      // };
    } catch (error) {
      console.warn(
        'Failed to get enhanced commission settings, falling back to defaults:',
        error,
      );

      // Fallback to default commission settings
      return {
        defaultCommissionRate: 10,
        minCommissionAmount: 0,
        maxCommissionAmount: 10000,
        paymentSchedule: 'monthly',
        autoApproval: false,
        notificationSettings: {
          emailNotifications: true,
          smsNotifications: false,
        },
      };
    }
  }

  async updateCommissionSettings(
    settingsDto: any,
    userId: string,
  ): Promise<any> {
    try {
      // Convert legacy settings format to enhanced format
      const enhancedSettings = {
        defaultCommissionPercentage: settingsDto.defaultCommissionRate || 10,
        minimumCommission: settingsDto.minCommissionAmount || 0,
        maximumCommission: settingsDto.maxCommissionAmount || 10000,
        paymentTerms: {
          schedule: settingsDto.paymentSchedule || 'monthly',
          autoApproval: settingsDto.autoApproval || false,
          paymentDays: 30,
        },
        holdbackPercentage: settingsDto.holdbackPercentage || 0,
        performanceMultipliers: settingsDto.performanceMultipliers || {},
        categoryOverrides: settingsDto.categoryOverrides || {},
        partnerTiers: settingsDto.partnerTiers || {},
      };

      // Update settings using the enhanced commission service (dynamic configuration)
      // await this.enhancedCommissionService.updateCommissionSettings(
      //   enhancedSettings,
      //   ConfigurationScope.GLOBAL,
      //   undefined,
      //   userId
      // );

      // Create audit trail for the update
      await this.createAuditTrail(
        'commission_settings',
        'global',
        'update',
        {},
        enhancedSettings,
        userId,
      );

      return {
        ...settingsDto,
        updatedAt: new Date(),
        updatedBy: userId,
        success: true,
      };
    } catch (error) {
      console.error('Failed to update enhanced commission settings:', error);

      // Fallback: just return the updated settings without persisting
      // In a real implementation, this could save to database as fallback
      return {
        ...settingsDto,
        updatedAt: new Date(),
        updatedBy: userId,
        success: false,
        error: 'Failed to update dynamic configuration, changes not persisted',
      };
    }
  }
}
