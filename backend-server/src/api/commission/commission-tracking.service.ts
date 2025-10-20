import { UserEntity } from '@/auth/entities/user.entity';
import { PartnerEntity } from '@/database/entities/partner.entity';
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Between,
  In,
  IsNull,
  LessThan,
  MoreThan,
  Not,
  Repository,
} from 'typeorm';
import { EnhancedCommissionService } from '../../common/services/enhanced-commission.service';
import { FinancialConfigIntegrationService } from '../../common/services/financial-config-integration.service';
import { ConfigurationScope } from '../../common/types/financial-configuration.types';
import {
  BulkCommissionCalculationDto,
  BulkCommissionUpdateDto,
  CommissionAnalyticsDto,
  CommissionCalculationResponseDto,
  CommissionCalculationStatus,
  CommissionPayoutResponseDto,
  CommissionPayoutStatus,
  CommissionReconciliationDto,
  CommissionReportDto,
  CommissionRuleResponseDto,
  CommissionRuleType,
  CommissionSettingsDto,
  CommissionSummaryDto,
  CreateCommissionCalculationDto,
  CreateCommissionPayoutDto,
  CreateCommissionRuleDto,
  CreatePartnerCommissionDto,
  ExportType,
  GetCommissionCalculationsDto,
  GetCommissionPayoutsDto,
  GetCommissionRulesDto,
  GetCommissionSummaryDto,
  GetPartnerCommissionsDto,
  PartnerCommissionResponseDto,
  PartnerTier,
  ReportFormat,
  TransactionType,
  UpdateCommissionPayoutDto,
  UpdateCommissionRuleDto,
  UpdatePartnerCommissionDto,
} from './dto/commission-tracking.dto';
import { CommissionPayoutEntity } from './entities/commission-payout.entity';
import {
  CommissionAuditTrailEntity,
  CommissionCalculationEntity,
  CommissionExportEntity,
  CommissionReportEntity,
  CommissionRuleEntity,
  CommissionSettingsEntity,
  PartnerCommissionEntity,
} from './entities/commission-tracking.entity';

@Injectable()
export class CommissionTrackingService {
  constructor(
    @InjectRepository(CommissionRuleEntity)
    private commissionRuleRepository: Repository<CommissionRuleEntity>,
    @InjectRepository(CommissionCalculationEntity)
    private commissionCalculationRepository: Repository<CommissionCalculationEntity>,
    @InjectRepository(PartnerCommissionEntity)
    private partnerCommissionRepository: Repository<PartnerCommissionEntity>,
    @InjectRepository(CommissionPayoutEntity)
    private commissionPayoutRepository: Repository<CommissionPayoutEntity>,
    @InjectRepository(CommissionExportEntity)
    private commissionExportRepository: Repository<CommissionExportEntity>,
    @InjectRepository(CommissionReportEntity)
    private commissionReportRepository: Repository<CommissionReportEntity>,
    @InjectRepository(CommissionAuditTrailEntity)
    private commissionAuditTrailRepository: Repository<CommissionAuditTrailEntity>,
    @InjectRepository(CommissionSettingsEntity)
    private commissionSettingsRepository: Repository<CommissionSettingsEntity>,
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
    @InjectRepository(PartnerEntity)
    private partnerRepository: Repository<PartnerEntity>,
    private readonly configIntegrationService: FinancialConfigIntegrationService,
    private readonly enhancedCommissionService: EnhancedCommissionService,
  ) {}

  // Commission Rules Management
  async createCommissionRule(
    dto: CreateCommissionRuleDto,
    userId: string,
  ): Promise<CommissionRuleResponseDto> {
    const rule = this.commissionRuleRepository.create({
      ...dto,
      createdBy: userId,
    });

    const savedRule = await this.commissionRuleRepository.save(rule);

    await this.createAuditEntry(
      'CommissionRule',
      savedRule.id,
      'CREATE',
      userId,
      null,
      savedRule,
    );

    return this.mapCommissionRuleToResponse(savedRule);
  }

  // Missing methods for controller
  async updatePartnerCommission(
    id: string,
    updateData: any,
    userId: string,
  ): Promise<PartnerCommissionResponseDto> {
    const commission = await this.partnerCommissionRepository.findOne({
      where: { id },
      relations: ['partner', 'calculation', 'payout', 'creator', 'updater'],
    });

    if (!commission) {
      throw new Error('Partner commission not found');
    }

    // Store old values for audit
    const oldValues = { ...commission };

    // Update commission
    Object.assign(commission, updateData, {
      updatedBy: userId,
      updatedAt: new Date(),
    });

    const updatedCommission =
      await this.partnerCommissionRepository.save(commission);

    // Create audit entry
    await this.createAuditEntry(
      'PartnerCommission',
      commission.id,
      'UPDATE',
      userId,
      oldValues,
      updatedCommission,
    );

    return this.mapPartnerCommissionToResponse(updatedCommission);
  }

  async deletePartnerCommission(id: string, userId: string): Promise<void> {
    const commission = await this.partnerCommissionRepository.findOne({
      where: { id },
    });

    if (!commission) {
      throw new Error('Partner commission not found');
    }

    // Create audit entry before deletion
    await this.createAuditEntry(
      'PartnerCommission',
      commission.id,
      'DELETE',
      userId,
      commission,
    );

    await this.partnerCommissionRepository.remove(commission);
  }

  async getCommissionPayoutById(
    id: string,
  ): Promise<CommissionPayoutResponseDto> {
    const payout = await this.commissionPayoutRepository.findOne({
      where: { id },
      relations: ['partner', 'commissions', 'creator', 'updater', 'processor'],
    });

    if (!payout) {
      throw new Error('Commission payout not found');
    }

    return this.mapCommissionPayoutToResponse(payout);
  }

  async getCommissionCalculationById(
    id: string,
  ): Promise<CommissionCalculationResponseDto> {
    const calculation = await this.commissionCalculationRepository.findOne({
      where: { id },
      relations: ['partner', 'rule', 'creator', 'updater', 'approver'],
    });

    if (!calculation) {
      throw new Error('Commission calculation not found');
    }

    return this.mapCommissionCalculationToResponse(calculation);
  }

  async updateCommissionCalculation(
    id: string,
    updateData: any,
    userId: string,
  ): Promise<CommissionCalculationResponseDto> {
    const calculation = await this.commissionCalculationRepository.findOne({
      where: { id },
      relations: ['partner', 'rule', 'creator', 'updater', 'approver'],
    });

    if (!calculation) {
      throw new Error('Commission calculation not found');
    }

    const oldValues = { ...calculation };
    Object.assign(calculation, updateData, {
      updatedBy: userId,
      updatedAt: new Date(),
    });

    const updatedCalculation =
      await this.commissionCalculationRepository.save(calculation);

    await this.createAuditEntry(
      'CommissionCalculation',
      calculation.id,
      'UPDATE',
      userId,
      oldValues,
      updatedCalculation,
    );

    return this.mapCommissionCalculationToResponse(updatedCalculation);
  }

  async getCommissionStats(query: any): Promise<any> {
    const { period = 'month' } = query;

    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth(), 1);

    const [totalCommissions, pendingCommissions, paidCommissions] =
      await Promise.all([
        this.commissionCalculationRepository.count(),
        this.commissionCalculationRepository.count({
          where: { status: CommissionCalculationStatus.PENDING },
        }),
        this.commissionCalculationRepository.count({
          where: { status: CommissionCalculationStatus.APPROVED },
        }),
      ]);

    return {
      totalCommissions,
      pendingCommissions,
      paidCommissions,
      period,
    };
  }

  async getPartnerPerformance(
    partnerId?: string,
    dateFrom?: string,
    dateTo?: string,
  ): Promise<any> {
    const queryBuilder = this.commissionCalculationRepository
      .createQueryBuilder('calculation')
      .leftJoin('calculation.partner', 'partner')
      .select([
        'calculation.partnerId',
        'partner.name as partnerName',
        'SUM(calculation.commissionAmount) as totalCommissions',
        'COUNT(calculation.id) as totalTransactions',
        'AVG(calculation.commissionAmount) as averageCommission',
      ])
      .groupBy('calculation.partnerId, partner.name')
      .orderBy('totalCommissions', 'DESC');

    if (partnerId) {
      queryBuilder.andWhere('calculation.partnerId = :partnerId', {
        partnerId,
      });
    }
    if (dateFrom) {
      queryBuilder.andWhere('calculation.createdAt >= :dateFrom', { dateFrom });
    }
    if (dateTo) {
      queryBuilder.andWhere('calculation.createdAt <= :dateTo', { dateTo });
    }

    const results = await queryBuilder.getRawMany();
    return results.map((item) => ({
      partnerId: item.partnerId,
      partnerName: item.partnerName,
      totalCommissions: parseFloat(item.totalCommissions) || 0,
      totalTransactions: parseInt(item.totalTransactions) || 0,
      averageCommission: parseFloat(item.averageCommission) || 0,
    }));
  }

  async getCommissionForecast(
    partnerId?: string,
    months?: number,
  ): Promise<any> {
    const forecastMonths = months || 3;

    // Simple forecast based on historical data
    const now = new Date();
    const startDate = new Date(
      now.getFullYear(),
      now.getMonth() - forecastMonths,
      1,
    );

    const queryBuilder = this.commissionCalculationRepository
      .createQueryBuilder('calculation')
      .select([
        'AVG(calculation.commissionAmount) as averageMonthly',
        'COUNT(calculation.id) as totalTransactions',
      ])
      .where('calculation.createdAt >= :startDate', { startDate });

    if (partnerId) {
      queryBuilder.andWhere('calculation.partnerId = :partnerId', {
        partnerId,
      });
    }

    const result = await queryBuilder.getRawOne();
    const averageMonthly = parseFloat(result.averageMonthly) || 0;

    return {
      forecastPeriod: forecastMonths,
      averageMonthlyCommission: averageMonthly,
      projectedCommissions: averageMonthly * forecastMonths,
      basedOnTransactions: parseInt(result.totalTransactions) || 0,
    };
  }

  async exportCommissionData(exportDto: any, userId: string): Promise<string> {
    const { format = 'csv', startDate, endDate, partnerId } = exportDto;

    const queryBuilder = this.commissionCalculationRepository
      .createQueryBuilder('calculation')
      .leftJoinAndSelect('calculation.partner', 'partner')
      .leftJoinAndSelect('calculation.rule', 'rule');

    if (startDate) {
      queryBuilder.andWhere('calculation.createdAt >= :startDate', {
        startDate,
      });
    }
    if (endDate) {
      queryBuilder.andWhere('calculation.createdAt <= :endDate', { endDate });
    }
    if (partnerId) {
      queryBuilder.andWhere('calculation.partnerId = :partnerId', {
        partnerId,
      });
    }

    const calculations = await queryBuilder.getMany();

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `commission-export-${timestamp}.${format}`;

    // In a real implementation, you would generate the actual file
    // For now, just return the filename
    return filename;
  }

  async generateCommissionReport(
    reportDto: any,
    userId: string,
  ): Promise<string> {
    const { type = 'summary', startDate, endDate, partnerId } = reportDto;

    const reportId = `report-${Date.now()}`;

    // In a real implementation, you would generate the actual report
    // and store it with the reportId

    return reportId;
  }

  async downloadCommissionReport(reportId: string): Promise<any> {
    // In a real implementation, you would retrieve the actual report file
    return {
      reportId,
      downloadUrl: `/api/reports/${reportId}/download`,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
    };
  }

  async performCommissionReconciliation(
    reconciliationDto: any,
    userId: string,
  ): Promise<{ reconciled: number; discrepancies: number; details: any[] }> {
    const { startDate, endDate, partnerId } = reconciliationDto;

    // Get all commission calculations for the period
    const queryBuilder = this.commissionCalculationRepository
      .createQueryBuilder('calculation')
      .leftJoinAndSelect('calculation.partner', 'partner');

    if (startDate) {
      queryBuilder.andWhere('calculation.createdAt >= :startDate', {
        startDate,
      });
    }
    if (endDate) {
      queryBuilder.andWhere('calculation.createdAt <= :endDate', { endDate });
    }
    if (partnerId) {
      queryBuilder.andWhere('calculation.partnerId = :partnerId', {
        partnerId,
      });
    }

    const calculations = await queryBuilder.getMany();

    // Perform reconciliation logic
    const reconciled = calculations.length;
    const discrepancies = 0; // In real implementation, check for actual discrepancies
    const details = calculations.map((calc) => ({
      calculationId: calc.id,
      partnerId: calc.partnerId,
      amount: calc.commissionAmount,
      status: 'reconciled',
    }));

    return {
      reconciled,
      discrepancies,
      details,
    };
  }

  async getCommissionAuditTrail(query: any): Promise<any> {
    const { entityType, entityId, page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;

    const queryBuilder = this.commissionAuditTrailRepository
      .createQueryBuilder('audit')
      .orderBy('audit.createdAt', 'DESC')
      .skip(skip)
      .take(limit);

    if (entityType) {
      queryBuilder.andWhere('audit.entityType = :entityType', { entityType });
    }
    if (entityId) {
      queryBuilder.andWhere('audit.entityId = :entityId', { entityId });
    }

    const [auditEntries, total] = await queryBuilder.getManyAndCount();

    return {
      data: auditEntries,
      total,
      page,
      limit,
    };
  }

  async getCommissionRules(dto: GetCommissionRulesDto): Promise<{
    data: CommissionRuleResponseDto[];
    total: number;
    page: number;
    limit: number;
  }> {
    const queryBuilder = this.commissionRuleRepository
      .createQueryBuilder('rule')
      .leftJoinAndSelect('rule.creator', 'creator')
      .leftJoinAndSelect('rule.updater', 'updater');

    // Apply filters
    if (dto.type) {
      queryBuilder.andWhere('rule.type = :type', { type: dto.type });
    }

    if (dto.partnerTier) {
      queryBuilder.andWhere('rule.partnerTier = :partnerTier', {
        partnerTier: dto.partnerTier,
      });
    }

    if (dto.isActive !== undefined) {
      queryBuilder.andWhere('rule.isActive = :isActive', {
        isActive: dto.isActive,
      });
    }

    if (dto.startDate) {
      queryBuilder.andWhere('rule.startDate >= :startDate', {
        startDate: dto.startDate,
      });
    }

    if (dto.endDate) {
      queryBuilder.andWhere('rule.endDate <= :endDate', {
        endDate: dto.endDate,
      });
    }

    if (dto.search) {
      queryBuilder.andWhere(
        '(rule.name ILIKE :search OR rule.description ILIKE :search)',
        { search: `%${dto.search}%` },
      );
    }

    // Apply sorting
    const sortField = dto.sortBy || 'createdAt';
    const sortOrder = dto.sortOrder || 'DESC';
    queryBuilder.orderBy(`rule.${sortField}`, sortOrder);

    // Apply pagination
    const page = dto.page || 1;
    const limit = dto.limit || 10;
    const skip = (page - 1) * limit;

    queryBuilder.skip(skip).take(limit);

    const [rules, total] = await queryBuilder.getManyAndCount();

    return {
      data: rules.map((rule) => this.mapCommissionRuleToResponse(rule)),
      total,
      page,
      limit,
    };
  }

  async getCommissionRuleById(id: string): Promise<CommissionRuleResponseDto> {
    const rule = await this.commissionRuleRepository.findOne({
      where: { id },
      relations: ['creator', 'updater'],
    });

    if (!rule) {
      throw new NotFoundException('Commission rule not found');
    }

    return this.mapCommissionRuleToResponse(rule);
  }

  async updateCommissionRule(
    id: string,
    dto: UpdateCommissionRuleDto,
    userId: string,
  ): Promise<CommissionRuleResponseDto> {
    const rule = await this.commissionRuleRepository.findOne({ where: { id } });

    if (!rule) {
      throw new NotFoundException('Commission rule not found');
    }

    const oldValues = { ...rule };
    Object.assign(rule, dto, { updatedBy: userId });

    const savedRule = await this.commissionRuleRepository.save(rule);

    await this.createAuditEntry(
      'CommissionRule',
      savedRule.id,
      'UPDATE',
      userId,
      oldValues,
      savedRule,
    );

    return this.mapCommissionRuleToResponse(savedRule);
  }

  async deleteCommissionRule(id: string, userId: string): Promise<void> {
    const rule = await this.commissionRuleRepository.findOne({ where: { id } });

    if (!rule) {
      throw new NotFoundException('Commission rule not found');
    }

    // Check if rule is being used in calculations
    const calculationsCount = await this.commissionCalculationRepository.count({
      where: { ruleId: id },
    });

    if (calculationsCount > 0) {
      throw new BadRequestException(
        'Cannot delete commission rule that has associated calculations',
      );
    }

    await this.commissionRuleRepository.remove(rule);

    await this.createAuditEntry(
      'CommissionRule',
      id,
      'DELETE',
      userId,
      rule,
      null,
    );
  }

  async activateCommissionRule(
    id: string,
    userId: string,
  ): Promise<CommissionRuleResponseDto> {
    const rule = await this.commissionRuleRepository.findOne({ where: { id } });

    if (!rule) {
      throw new NotFoundException('Commission rule not found');
    }

    rule.isActive = true;
    rule.updatedBy = userId;

    const savedRule = await this.commissionRuleRepository.save(rule);

    await this.createAuditEntry(
      'CommissionRule',
      savedRule.id,
      'ACTIVATE',
      userId,
      { isActive: false },
      { isActive: true },
    );

    return this.mapCommissionRuleToResponse(savedRule);
  }

  async deactivateCommissionRule(
    id: string,
    userId: string,
  ): Promise<CommissionRuleResponseDto> {
    const rule = await this.commissionRuleRepository.findOne({ where: { id } });

    if (!rule) {
      throw new NotFoundException('Commission rule not found');
    }

    rule.isActive = false;
    rule.updatedBy = userId;

    const savedRule = await this.commissionRuleRepository.save(rule);

    await this.createAuditEntry(
      'CommissionRule',
      savedRule.id,
      'DEACTIVATE',
      userId,
      { isActive: true },
      { isActive: false },
    );

    return this.mapCommissionRuleToResponse(savedRule);
  }

  // Commission Calculations
  async createCommissionCalculation(
    dto: CreateCommissionCalculationDto,
    userId: string,
  ): Promise<CommissionCalculationResponseDto> {
    // Find applicable rule if not provided
    let rule: CommissionRuleEntity;
    if (dto.ruleId) {
      rule = await this.commissionRuleRepository.findOne({
        where: { id: dto.ruleId, isActive: true },
      });
      if (!rule) {
        throw new BadRequestException('Commission rule not found');
      }
    } else {
      rule = await this.findApplicableRule(
        dto.partnerId,
        dto.transactionAmount,
        dto.transactionType,
      );
      if (!rule) {
        throw new BadRequestException('No applicable commission rule found');
      }
    }

    // Calculate commission if not provided
    const commissionAmount =
      dto.commissionAmount ?? rule.calculateCommission(dto.transactionAmount);
    const rateApplied = dto.rateApplied ?? rule.rate;

    const calculation = this.commissionCalculationRepository.create({
      partnerId: dto.partnerId,
      transactionId: dto.transactionId,
      ruleId: rule.id,
      transactionAmount: dto.transactionAmount,
      commissionAmount,
      rateApplied,
      calculationDetails: {
        ruleType: rule.type,
        ruleName: rule.name,
        conditions: rule.conditions,
      },
      notes: dto.notes,
      createdBy: userId,
    });

    const savedCalculation =
      await this.commissionCalculationRepository.save(calculation);

    await this.createAuditEntry(
      'CommissionCalculation',
      savedCalculation.id,
      'CREATE',
      userId,
      null,
      savedCalculation,
    );

    return this.mapCommissionCalculationToResponse(savedCalculation);
  }

  async bulkCreateCommissionCalculations(
    dto: BulkCommissionCalculationDto,
    userId: string,
  ): Promise<{
    calculations: CommissionCalculationResponseDto[];
    errors: any[];
  }> {
    const calculations: CommissionCalculationResponseDto[] = [];
    const errors: any[] = [];

    for (const item of dto.calculations) {
      try {
        const calculation = await this.createCommissionCalculation(
          item,
          userId,
        );
        calculations.push(calculation);
      } catch (error) {
        errors.push({
          item,
          error: error.message,
        });
      }
    }

    return { calculations, errors };
  }

  async getCommissionCalculations(dto: GetCommissionCalculationsDto): Promise<{
    data: CommissionCalculationResponseDto[];
    total: number;
    page: number;
    limit: number;
  }> {
    const queryBuilder = this.commissionCalculationRepository
      .createQueryBuilder('calculation')
      .leftJoinAndSelect('calculation.partner', 'partner')
      .leftJoinAndSelect('calculation.rule', 'rule')
      .leftJoinAndSelect('calculation.creator', 'creator');

    // Apply filters
    if (dto.partnerId) {
      queryBuilder.andWhere('calculation.partnerId = :partnerId', {
        partnerId: dto.partnerId,
      });
    }

    if (dto.status) {
      queryBuilder.andWhere('calculation.status = :status', {
        status: dto.status,
      });
    }

    if (dto.ruleId) {
      queryBuilder.andWhere('calculation.ruleId = :ruleId', {
        ruleId: dto.ruleId,
      });
    }

    if (dto.startDate && dto.endDate) {
      queryBuilder.andWhere(
        'calculation.createdAt BETWEEN :startDate AND :endDate',
        {
          startDate: dto.startDate,
          endDate: dto.endDate,
        },
      );
    }

    if (dto.minAmount) {
      queryBuilder.andWhere('calculation.commissionAmount >= :minAmount', {
        minAmount: dto.minAmount,
      });
    }

    if (dto.maxAmount) {
      queryBuilder.andWhere('calculation.commissionAmount <= :maxAmount', {
        maxAmount: dto.maxAmount,
      });
    }

    // Apply sorting
    const sortField = dto.sortBy || 'createdAt';
    const sortOrder = dto.sortOrder || 'DESC';
    queryBuilder.orderBy(`calculation.${sortField}`, sortOrder);

    // Apply pagination
    const page = dto.page || 1;
    const limit = dto.limit || 10;
    const skip = (page - 1) * limit;

    queryBuilder.skip(skip).take(limit);

    const [calculations, total] = await queryBuilder.getManyAndCount();

    return {
      data: calculations.map((calc) =>
        this.mapCommissionCalculationToResponse(calc),
      ),
      total,
      page,
      limit,
    };
  }

  async approveCommissionCalculation(
    id: string,
    userId: string,
  ): Promise<CommissionCalculationResponseDto> {
    const calculation = await this.commissionCalculationRepository.findOne({
      where: { id },
    });

    if (!calculation) {
      throw new NotFoundException('Commission calculation not found');
    }

    calculation.approve(userId);
    const savedCalculation =
      await this.commissionCalculationRepository.save(calculation);

    // Create partner commission entry
    await this.createPartnerCommissionFromCalculation(savedCalculation, userId);

    await this.createAuditEntry(
      'CommissionCalculation',
      savedCalculation.id,
      'APPROVE',
      userId,
      { status: CommissionCalculationStatus.CALCULATED },
      { status: CommissionCalculationStatus.APPROVED },
    );

    return this.mapCommissionCalculationToResponse(savedCalculation);
  }

  async rejectCommissionCalculation(
    id: string,
    userId: string,
  ): Promise<CommissionCalculationResponseDto> {
    const calculation = await this.commissionCalculationRepository.findOne({
      where: { id },
    });

    if (!calculation) {
      throw new NotFoundException('Commission calculation not found');
    }

    calculation.reject(userId);
    const savedCalculation =
      await this.commissionCalculationRepository.save(calculation);

    await this.createAuditEntry(
      'CommissionCalculation',
      savedCalculation.id,
      'REJECT',
      userId,
      { status: calculation.status },
      { status: CommissionCalculationStatus.REJECTED },
    );

    return this.mapCommissionCalculationToResponse(savedCalculation);
  }

  // Partner Commission Management
  async createPartnerCommission(
    createDto: CreatePartnerCommissionDto,
    userId: string,
  ): Promise<PartnerCommissionResponseDto> {
    // Validate calculation exists
    const calculation = await this.commissionCalculationRepository.findOne({
      where: { id: createDto.calculationId },
      relations: ['partner'],
    });

    if (!calculation) {
      throw new NotFoundException('Commission calculation not found');
    }

    const commission = this.partnerCommissionRepository.create({
      partnerId: createDto.partnerId,
      calculationId: createDto.calculationId,
      amount: createDto.amount,
      description: createDto.description,
      dueDate: createDto.dueDate,
      createdBy: userId,
    });

    const savedCommission =
      await this.partnerCommissionRepository.save(commission);

    // Create audit entry
    await this.createAuditEntry(
      'PartnerCommission',
      savedCommission.id,
      'CREATE',
      userId,
      savedCommission,
    );

    return this.mapPartnerCommissionToResponse(savedCommission);
  }

  async getPartnerCommissionById(
    id: string,
  ): Promise<PartnerCommissionResponseDto> {
    const commission = await this.partnerCommissionRepository.findOne({
      where: { id },
      relations: ['partner', 'calculation', 'payout', 'creator', 'updater'],
    });

    if (!commission) {
      throw new NotFoundException('Partner commission not found');
    }

    return this.mapPartnerCommissionToResponse(commission);
  }

  async getPartnerCommissions(dto: GetPartnerCommissionsDto): Promise<{
    data: PartnerCommissionResponseDto[];
    total: number;
    page: number;
    limit: number;
  }> {
    const queryBuilder = this.partnerCommissionRepository
      .createQueryBuilder('commission')
      .leftJoinAndSelect('commission.partner', 'partner')
      .leftJoinAndSelect('commission.calculation', 'calculation')
      .leftJoinAndSelect('commission.payout', 'payout');

    // Apply filters
    if (dto.partnerId) {
      queryBuilder.andWhere('commission.partnerId = :partnerId', {
        partnerId: dto.partnerId,
      });
    }

    if (dto.isPaid !== undefined) {
      queryBuilder.andWhere('commission.isPaid = :isPaid', {
        isPaid: dto.isPaid,
      });
    }

    if (dto.startDate && dto.endDate) {
      queryBuilder.andWhere(
        'commission.createdAt BETWEEN :startDate AND :endDate',
        {
          startDate: dto.startDate,
          endDate: dto.endDate,
        },
      );
    }

    if (dto.minAmount) {
      queryBuilder.andWhere('commission.amount >= :minAmount', {
        minAmount: dto.minAmount,
      });
    }

    if (dto.maxAmount) {
      queryBuilder.andWhere('commission.amount <= :maxAmount', {
        maxAmount: dto.maxAmount,
      });
    }

    // Apply sorting
    const sortField = dto.sortBy || 'createdAt';
    const sortOrder = dto.sortOrder || 'DESC';
    queryBuilder.orderBy(`commission.${sortField}`, sortOrder);

    // Apply pagination
    const page = dto.page || 1;
    const limit = dto.limit || 10;
    const skip = (page - 1) * limit;

    queryBuilder.skip(skip).take(limit);

    const [commissions, total] = await queryBuilder.getManyAndCount();

    return {
      data: commissions.map((comm) =>
        this.mapPartnerCommissionToResponse(comm),
      ),
      total,
      page,
      limit,
    };
  }

  async getPartnerCommissionBalance(partnerId: string): Promise<{
    totalEarned: number;
    totalPaid: number;
    pendingAmount: number;
  }> {
    const result = await this.partnerCommissionRepository
      .createQueryBuilder('commission')
      .select([
        'SUM(commission.amount) as totalEarned',
        'SUM(CASE WHEN commission.isPaid = true THEN commission.amount ELSE 0 END) as totalPaid',
        'SUM(CASE WHEN commission.isPaid = false THEN commission.amount ELSE 0 END) as pendingAmount',
      ])
      .where('commission.partnerId = :partnerId', { partnerId })
      .getRawOne();

    return {
      totalEarned: parseFloat(result.totalEarned) || 0,
      totalPaid: parseFloat(result.totalPaid) || 0,
      pendingAmount: parseFloat(result.pendingAmount) || 0,
    };
  }

  async getPartnerCommissionHistory(
    partnerId: string,
    page = 1,
    limit = 10,
  ): Promise<{ commissions: PartnerCommissionResponseDto[]; total: number }> {
    const skip = (page - 1) * limit;

    const [commissions, total] =
      await this.partnerCommissionRepository.findAndCount({
        where: { partnerId },
        relations: ['calculation', 'payout'],
        order: { createdAt: 'DESC' },
        skip,
        take: limit,
      });

    return {
      commissions: commissions.map((comm) =>
        this.mapPartnerCommissionToResponse(comm),
      ),
      total,
    };
  }

  // Commission Payouts
  async createCommissionPayout(
    dto: CreateCommissionPayoutDto,
    userId: string,
  ): Promise<CommissionPayoutResponseDto> {
    // Validate commission IDs
    const commissions = await this.partnerCommissionRepository.find({
      where: {
        id: In(dto.commissionIds),
        partnerId: dto.partnerId,
        isPaid: false,
      },
    });

    if (commissions.length !== dto.commissionIds.length) {
      throw new BadRequestException(
        'Some commission IDs are invalid or already paid',
      );
    }

    const totalAmount = commissions.reduce((sum, comm) => sum + comm.amount, 0);

    const payout = this.commissionPayoutRepository.create({
      partnerId: dto.partnerId,
      amount: totalAmount,
      commissionIds: dto.commissionIds,
      description: dto.description,
      scheduledDate: dto.scheduledDate,
      createdBy: userId,
    });

    const savedPayout = await this.commissionPayoutRepository.save(payout);

    await this.createAuditEntry(
      'CommissionPayout',
      savedPayout.id,
      'CREATE',
      userId,
      null,
      savedPayout,
    );

    return this.mapCommissionPayoutToResponse(savedPayout);
  }

  async getCommissionPayouts(dto: GetCommissionPayoutsDto): Promise<{
    data: CommissionPayoutResponseDto[];
    total: number;
    page: number;
    limit: number;
  }> {
    const queryBuilder = this.commissionPayoutRepository
      .createQueryBuilder('payout')
      .leftJoinAndSelect('payout.partner', 'partner')
      .leftJoinAndSelect('payout.creator', 'creator');

    // Apply filters
    if (dto.partnerId) {
      queryBuilder.andWhere('payout.partnerId = :partnerId', {
        partnerId: dto.partnerId,
      });
    }

    if (dto.status) {
      queryBuilder.andWhere('payout.status = :status', { status: dto.status });
    }

    if (dto.startDate && dto.endDate) {
      queryBuilder.andWhere(
        'payout.createdAt BETWEEN :startDate AND :endDate',
        {
          startDate: dto.startDate,
          endDate: dto.endDate,
        },
      );
    }

    if (dto.minAmount) {
      queryBuilder.andWhere('payout.amount >= :minAmount', {
        minAmount: dto.minAmount,
      });
    }

    if (dto.maxAmount) {
      queryBuilder.andWhere('payout.amount <= :maxAmount', {
        maxAmount: dto.maxAmount,
      });
    }

    // Apply sorting
    const sortField = dto.sortBy || 'createdAt';
    const sortOrder = dto.sortOrder || 'DESC';
    queryBuilder.orderBy(`payout.${sortField}`, sortOrder);

    // Apply pagination
    const page = dto.page || 1;
    const limit = dto.limit || 10;
    const skip = (page - 1) * limit;

    queryBuilder.skip(skip).take(limit);

    const [payouts, total] = await queryBuilder.getManyAndCount();

    return {
      data: payouts.map((payout) => this.mapCommissionPayoutToResponse(payout)),
      total,
      page,
      limit,
    };
  }

  async processCommissionPayout(
    id: string,
    userId: string,
    paymentReference?: string,
  ): Promise<CommissionPayoutResponseDto> {
    const payout = await this.commissionPayoutRepository.findOne({
      where: { id },
    });

    if (!payout) {
      throw new NotFoundException('Commission payout not found');
    }

    payout.process(userId, paymentReference);
    const savedPayout = await this.commissionPayoutRepository.save(payout);

    await this.createAuditEntry(
      'CommissionPayout',
      savedPayout.id,
      'PROCESS',
      userId,
      { status: CommissionPayoutStatus.PENDING },
      { status: CommissionPayoutStatus.PROCESSING },
    );

    return this.mapCommissionPayoutToResponse(savedPayout);
  }

  async completeCommissionPayout(
    id: string,
    userId: string,
    paymentReference?: string,
  ): Promise<CommissionPayoutResponseDto> {
    const payout = await this.commissionPayoutRepository.findOne({
      where: { id },
    });

    if (!payout) {
      throw new NotFoundException('Commission payout not found');
    }

    payout.complete(userId, paymentReference);
    const savedPayout = await this.commissionPayoutRepository.save(payout);

    // Mark associated commissions as paid
    await this.partnerCommissionRepository.update(
      { id: In(payout.commissionIds) },
      {
        isPaid: true,
        paidDate: new Date(),
        payoutId: payout.id,
        updatedBy: userId,
      },
    );

    await this.createAuditEntry(
      'CommissionPayout',
      savedPayout.id,
      'COMPLETE',
      userId,
      { status: CommissionPayoutStatus.PROCESSING },
      { status: CommissionPayoutStatus.COMPLETED },
    );

    return this.mapCommissionPayoutToResponse(savedPayout);
  }

  async updateCommissionPayout(
    id: string,
    updateDto: any,
    userId: string,
  ): Promise<CommissionPayoutResponseDto> {
    const payout = await this.commissionPayoutRepository.findOne({
      where: { id },
    });

    if (!payout) {
      throw new NotFoundException('Commission payout not found');
    }

    Object.assign(payout, updateDto);
    payout.updatedBy = userId;
    const savedPayout = await this.commissionPayoutRepository.save(payout);

    await this.createAuditEntry(
      'CommissionPayout',
      savedPayout.id,
      'UPDATE',
      userId,
      payout,
      savedPayout,
    );

    return this.mapCommissionPayoutToResponse(savedPayout);
  }

  async bulkUpdateCommissions(
    bulkDto: any,
    userId: string,
  ): Promise<{ updated: number; failed: number; errors: any[] }> {
    const results = { updated: 0, failed: 0, errors: [] };

    for (const commissionId of bulkDto.commissionIds) {
      try {
        await this.updatePartnerCommission(
          commissionId,
          bulkDto.updateData,
          userId,
        );
        results.updated++;
      } catch (error) {
        results.failed++;
        results.errors.push({ commissionId, error: error.message });
      }
    }

    return results;
  }

  // Analytics and Reporting
  async getCommissionAnalytics(dto: {
    partnerId?: string;
    startDate?: Date;
    endDate?: Date;
  }): Promise<any> {
    const queryBuilder = this.commissionCalculationRepository
      .createQueryBuilder('calculation')
      .leftJoin('calculation.partner', 'partner');

    // Apply date filter
    if (dto.startDate && dto.endDate) {
      queryBuilder.andWhere(
        'calculation.createdAt BETWEEN :startDate AND :endDate',
        {
          startDate: dto.startDate,
          endDate: dto.endDate,
        },
      );
    }

    // Apply partner filter
    if (dto.partnerId) {
      queryBuilder.andWhere('calculation.partnerId = :partnerId', {
        partnerId: dto.partnerId,
      });
    }

    const analytics = await queryBuilder
      .select([
        'COUNT(calculation.id) as totalCalculations',
        'SUM(calculation.commissionAmount) as totalCommission',
        'AVG(calculation.commissionAmount) as averageCommission',
        'SUM(calculation.transactionAmount) as totalTransactionAmount',
        'COUNT(DISTINCT calculation.partnerId) as uniquePartners',
      ])
      .getRawOne();

    // Get status breakdown
    const statusBreakdown = await queryBuilder
      .select([
        'calculation.status',
        'COUNT(calculation.id) as count',
        'SUM(calculation.commissionAmount) as amount',
      ])
      .groupBy('calculation.status')
      .getRawMany();

    // Get monthly trends if date range is provided
    let monthlyTrends = [];
    if (dto.startDate && dto.endDate) {
      monthlyTrends = await queryBuilder
        .select([
          "DATE_TRUNC('month', calculation.createdAt) as month",
          'COUNT(calculation.id) as count',
          'SUM(calculation.commissionAmount) as amount',
        ])
        .groupBy('month')
        .orderBy('month', 'ASC')
        .getRawMany();
    }

    return {
      summary: {
        totalCalculations: parseInt(analytics.totalCalculations) || 0,
        totalCommission: parseFloat(analytics.totalCommission) || 0,
        averageCommission: parseFloat(analytics.averageCommission) || 0,
        totalTransactionAmount:
          parseFloat(analytics.totalTransactionAmount) || 0,
        uniquePartners: parseInt(analytics.uniquePartners) || 0,
      },
      statusBreakdown: statusBreakdown.map((item) => ({
        status: item.status,
        count: parseInt(item.count),
        amount: parseFloat(item.amount) || 0,
      })),
      monthlyTrends: monthlyTrends.map((item) => ({
        month: item.month,
        count: parseInt(item.count),
        amount: parseFloat(item.amount) || 0,
      })),
    };
  }

  async getCommissionSummary(
    dto: GetCommissionSummaryDto,
  ): Promise<CommissionSummaryDto> {
    const summary = {
      totalRules: 0,
      activeRules: 0,
      calculationsThisMonth: 0,
      payoutsThisMonth: 0,
      pendingApprovalCount: 0,
      totalCommissionThisMonth: 0,
    };

    // Get rules summary
    const rulesData = await this.commissionRuleRepository
      .createQueryBuilder('rule')
      .select([
        'COUNT(rule.id) as totalRules',
        'SUM(CASE WHEN rule.isActive = true THEN 1 ELSE 0 END) as activeRules',
      ])
      .getRawOne();

    summary.totalRules = parseInt(rulesData.totalRules) || 0;
    summary.activeRules = parseInt(rulesData.activeRules) || 0;

    // Get calculations summary
    const calculationsQuery =
      this.commissionCalculationRepository.createQueryBuilder('calculation');

    if (dto.startDate && dto.endDate) {
      calculationsQuery.andWhere(
        'calculation.createdAt BETWEEN :startDate AND :endDate',
        {
          startDate: dto.startDate,
          endDate: dto.endDate,
        },
      );
    }

    const calculationsData = await calculationsQuery
      .select([
        'COUNT(calculation.id) as totalCalculations',
        'SUM(CASE WHEN calculation.status = :pending THEN 1 ELSE 0 END) as pendingCalculations',
        'SUM(CASE WHEN calculation.status = :approved THEN 1 ELSE 0 END) as approvedCalculations',
        'SUM(calculation.commissionAmount) as totalCommissionAmount',
      ])
      .setParameters({
        pending: CommissionCalculationStatus.PENDING,
        approved: CommissionCalculationStatus.APPROVED,
      })
      .getRawOne();

    summary.calculationsThisMonth =
      parseInt(calculationsData.totalCalculations) || 0;
    summary.pendingApprovalCount =
      parseInt(calculationsData.pendingCalculations) || 0;
    summary.totalCommissionThisMonth =
      parseFloat(calculationsData.totalCommissionAmount) || 0;

    // Get payouts summary
    const payoutsQuery =
      this.commissionPayoutRepository.createQueryBuilder('payout');

    if (dto.startDate && dto.endDate) {
      payoutsQuery.andWhere(
        'payout.createdAt BETWEEN :startDate AND :endDate',
        {
          startDate: dto.startDate,
          endDate: dto.endDate,
        },
      );
    }

    const payoutsData = await payoutsQuery
      .select([
        'COUNT(payout.id) as totalPayouts',
        'SUM(CASE WHEN payout.status = :pending THEN 1 ELSE 0 END) as pendingPayouts',
        'SUM(CASE WHEN payout.status = :completed THEN 1 ELSE 0 END) as completedPayouts',
        'SUM(payout.amount) as totalPayoutAmount',
      ])
      .setParameters({
        pending: CommissionPayoutStatus.PENDING,
        completed: CommissionPayoutStatus.COMPLETED,
      })
      .getRawOne();

    summary.payoutsThisMonth = parseInt(payoutsData.totalPayouts) || 0;

    return summary;
  }

  // Settings Management
  async getCommissionSettings(): Promise<CommissionSettingsDto> {
    try {
      // First try to get settings from the enhanced commission service (dynamic configuration)
      const enhancedSettings =
        await this.enhancedCommissionService.getCommissionSettings();

      // Convert enhanced settings to legacy format for backward compatibility
      return {
        id: 'dynamic',
        defaultCommissionRate: enhancedSettings.defaultCommissionPercentage,
        minimumPayoutAmount: enhancedSettings.minimumCommission,
        defaultPayoutFrequency: null,
        autoApprovalThreshold: enhancedSettings.maximumCommission,
        calculationDelay: 24,
        enableEmailNotifications: true,
        enableSmsNotifications: false,
        taxRate: 0.0,
        additionalSettings: {
          holdbackPercentage: enhancedSettings.holdbackPercentage,
          performanceMultipliers: enhancedSettings.performanceMultipliers,
          categoryOverrides: enhancedSettings.categoryOverrides,
          partnerTiers: enhancedSettings.partnerTiers,
          paymentTerms: enhancedSettings.paymentTerms,
        },
        updatedBy: null,
      };
    } catch (error) {
      console.warn(
        'Failed to get enhanced commission settings, falling back to database:',
        error,
      );

      // Fallback to database settings
      const settings = await this.commissionSettingsRepository.findOne({
        relations: ['updater'],
      });

      if (!settings) {
        // Return default settings
        return {
          id: null,
          defaultCommissionRate: 5.0,
          minimumPayoutAmount: 100.0,
          defaultPayoutFrequency: null,
          autoApprovalThreshold: 1000.0,
          calculationDelay: 24,
          enableEmailNotifications: true,
          enableSmsNotifications: false,
          taxRate: 0.0,
          additionalSettings: {},
          updatedBy: null,
        };
      }

      return this.mapCommissionSettingsToResponse(settings);
    }
  }

  async updateCommissionSettings(
    dto: CommissionSettingsDto,
    userId: string,
  ): Promise<CommissionSettingsDto> {
    try {
      // Convert legacy settings format to enhanced format
      const enhancedSettings = {
        defaultPercentage: dto.defaultCommissionRate || 5.0,
        minimumCommission: dto.minimumPayoutAmount || 100.0,
        maximumCommission: dto.autoApprovalThreshold || 1000.0,
        paymentTerms: {
          schedule: 'monthly',
          autoApproval: false,
          paymentDays: 30,
        },
        holdbackPercentage: dto.additionalSettings?.holdbackPercentage || 0,
        performanceMultipliers:
          dto.additionalSettings?.performanceMultipliers || {},
        categoryOverrides: dto.additionalSettings?.categoryOverrides || {},
        partnerTiers: dto.additionalSettings?.partnerTiers || {},
      };

      // Update settings using the enhanced commission service (dynamic configuration)
      await this.enhancedCommissionService.updateCommissionSettings(
        enhancedSettings,
        ConfigurationScope.GLOBAL,
        undefined,
        userId,
      );

      // Create audit trail for the update
      await this.createAuditEntry(
        'CommissionSettings',
        dto.id || 'dynamic',
        'UPDATE',
        userId,
        null,
        dto,
      );

      return {
        ...dto,
        id: dto.id || 'dynamic',
        updatedBy: userId,
      };
    } catch (error) {
      console.error(
        'Failed to update enhanced commission settings, falling back to database:',
        error,
      );

      // Fallback to database update
      let settings = await this.commissionSettingsRepository.findOne({});

      if (!settings) {
        settings = this.commissionSettingsRepository.create({
          ...dto,
          updatedBy: userId,
        });
      } else {
        Object.assign(settings, dto, { updatedBy: userId });
      }

      const savedSettings =
        await this.commissionSettingsRepository.save(settings);

      await this.createAuditEntry(
        'CommissionSettings',
        savedSettings.id,
        'UPDATE',
        userId,
        null,
        savedSettings,
      );

      return this.mapCommissionSettingsToResponse(savedSettings);
    }
  }

  // Utility Methods
  async calculateCommission(
    partnerId: string,
    transactionAmount: number,
    transactionType: TransactionType,
  ): Promise<number> {
    const rule = await this.findApplicableRule(
      partnerId,
      transactionAmount,
      transactionType,
    );

    if (!rule) {
      return 0;
    }

    return rule.calculateCommission(transactionAmount);
  }

  async validateCommissionRule(
    dto: CreateCommissionRuleDto | UpdateCommissionRuleDto,
  ): Promise<{ isValid: boolean; errors: string[]; warnings: string[] }> {
    const errors: string[] = [];

    // Validate rate
    if (dto.rate <= 0) {
      errors.push('Commission rate must be greater than 0');
    }

    if (dto.type === CommissionRuleType.PERCENTAGE && dto.rate > 100) {
      errors.push('Percentage rate cannot exceed 100%');
    }

    // Validate amounts
    if (dto.minAmount && dto.maxAmount && dto.minAmount >= dto.maxAmount) {
      errors.push('Minimum amount must be less than maximum amount');
    }

    // Validate dates
    if (dto.startDate && dto.endDate && dto.startDate >= dto.endDate) {
      errors.push('Start date must be before end date');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings: [],
    };
  }

  // Private Helper Methods
  private async findApplicableRule(
    partnerId: string,
    transactionAmount: number,
    transactionType: TransactionType,
  ): Promise<CommissionRuleEntity | null> {
    // Get partner to determine tier
    const partner = await this.partnerRepository.findOne({
      where: { userId: partnerId },
    });
    if (!partner) return null;

    const partnerTier = partner.tier as PartnerTier;

    const rules = await this.commissionRuleRepository.find({
      where: {
        isActive: true,
        ...(partnerTier && { partnerTier }),
      },
      order: { priority: 'ASC' },
    });

    for (const rule of rules) {
      // Check if rule is valid for current date
      if (!rule.isValidForDate(new Date())) continue;

      // Check if rule is valid for transaction amount
      if (!rule.isValidForAmount(transactionAmount)) continue;

      // Check if rule applies to transaction type
      if (rule.transactionTypes && rule.transactionTypes.length > 0) {
        if (!rule.transactionTypes.includes(transactionType)) continue;
      }

      return rule;
    }

    return null;
  }

  private async createPartnerCommissionFromCalculation(
    calculation: CommissionCalculationEntity,
    userId: string,
  ): Promise<PartnerCommissionEntity> {
    const commission = this.partnerCommissionRepository.create({
      partnerId: calculation.partnerId,
      calculationId: calculation.id,
      amount: calculation.commissionAmount,
      description: `Commission for transaction ${calculation.transactionId}`,
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      createdBy: userId,
    });

    return await this.partnerCommissionRepository.save(commission);
  }

  private async createAuditEntry(
    entityType: string,
    entityId: string,
    action: string,
    userId: string,
    oldValues?: any,
    newValues?: any,
  ): Promise<void> {
    const audit = CommissionAuditTrailEntity.createAuditEntry(
      entityType,
      entityId,
      action,
      userId,
      oldValues,
      newValues,
      null, // metadata parameter
    );

    await this.commissionAuditTrailRepository.save(audit);
  }

  // Mapping Methods
  private mapCommissionRuleToResponse(
    rule: CommissionRuleEntity,
  ): CommissionRuleResponseDto {
    return {
      id: rule.id,
      name: rule.name,
      description: rule.description,
      type: rule.type,
      rate: rule.rate,
      minAmount: rule.minAmount,
      maxAmount: rule.maxAmount,
      partnerTier: rule.partnerTier,
      transactionTypes: rule.transactionTypes,
      conditions: rule.conditions,
      startDate: rule.startDate,
      endDate: rule.endDate,
      priority: rule.priority,
      isActive: rule.isActive,
      createdAt: rule.createdAt,
      updatedAt: rule.updatedAt,
    };
  }

  private mapCommissionCalculationToResponse(
    calculation: CommissionCalculationEntity,
  ): CommissionCalculationResponseDto {
    return {
      id: calculation.id,
      partnerId: calculation.partnerId,
      transactionId: calculation.transactionId,
      ruleId: calculation.ruleId,
      transactionAmount: calculation.transactionAmount,
      commissionAmount: calculation.commissionAmount,
      rateApplied: calculation.rateApplied,
      status: calculation.status,
      calculationDetails: calculation.calculationDetails,
      notes: calculation.notes,
      createdAt: calculation.createdAt,
      updatedAt: calculation.updatedAt,
    };
  }

  private mapPartnerCommissionToResponse(
    commission: PartnerCommissionEntity,
  ): PartnerCommissionResponseDto {
    return {
      id: commission.id,
      partnerId: commission.partnerId,
      calculationId: commission.calculationId,
      amount: commission.amount,
      description: commission.description,
      dueDate: commission.dueDate,
      isPaid: commission.isPaid,
      paidDate: commission.paidDate,
      createdAt: commission.createdAt,
      updatedAt: commission.updatedAt,
    };
  }

  private mapCommissionPayoutToResponse(
    payout: CommissionPayoutEntity,
  ): CommissionPayoutResponseDto {
    return {
      id: payout.id,
      partnerId: payout.partnerId,
      amount: payout.amount,
      commissionIds: payout.commissionIds,
      description: payout.description,
      scheduledDate: payout.scheduledDate,
      status: payout.status,
      paymentReference: payout.paymentReference,
      processedDate: payout.processedDate,
      createdBy: payout.createdBy,
      updatedBy: payout.updatedBy,
      processedBy: payout.processedBy,
      partner: payout.partner,
      commissions: payout.commissions,
      creator: payout.creator,
      updater: payout.updater,
      processor: payout.processor,
      createdAt: payout.createdAt,
      updatedAt: payout.updatedAt,
    };
  }

  private mapCommissionSettingsToResponse(
    settings: CommissionSettingsEntity,
  ): CommissionSettingsDto {
    return {
      id: settings.id,
      defaultCommissionRate: settings.defaultCommissionRate,
      minimumPayoutAmount: settings.minimumPayoutAmount,
      defaultPayoutFrequency: settings.defaultPayoutFrequency,
      autoApprovalThreshold: settings.autoApprovalThreshold,
      calculationDelay: settings.calculationDelay,
      enableEmailNotifications: settings.enableEmailNotifications,
      enableSmsNotifications: settings.enableSmsNotifications,
      taxRate: settings.taxRate,
      additionalSettings: settings.additionalSettings,
      updatedBy: settings.updatedBy,
    };
  }
}
