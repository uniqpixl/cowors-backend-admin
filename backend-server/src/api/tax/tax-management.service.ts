import { UserEntity } from '@/auth/entities/user.entity';
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, In, LessThan, MoreThan, Repository } from 'typeorm';
import { EnhancedTaxService } from '../../common/services/enhanced-tax.service';
import { FinancialConfigIntegrationService } from '../../common/services/financial-config-integration.service';
import {
  BulkOperationResponseDto,
  BulkTaxOperationDto,
  CalculateTaxDto,
  ComplianceStatus,
  CreateTaxCollectionDto,
  CreateTaxRuleDto,
  DeadlineStatus,
  ExportFormat,
  ExportResponseDto,
  ExportStatus,
  ExportTaxDataDto,
  GetTaxCollectionsDto,
  GetTaxRulesDto,
  TaxAnalyticsDto,
  TaxAnalyticsResponseDto,
  TaxAuditTrailResponseDto,
  TaxCalculationResponseDto,
  TaxCategory,
  TaxCollectionResponseDto,
  TaxCollectionStatus,
  TaxComplianceDto,
  TaxComplianceResponseDto,
  TaxDeadlineDto,
  TaxDeadlineResponseDto,
  TaxPeriod,
  TaxReportDto,
  TaxReportResponseDto,
  TaxRuleResponseDto,
  TaxRuleStatus,
  TaxSettingsDto,
  TaxSettingsResponseDto,
  TaxSummaryResponseDto,
  TaxType,
  UpdateTaxCollectionDto,
  UpdateTaxRuleDto,
} from './dto/tax-management.dto';
import {
  TaxAuditTrailEntity,
  TaxCollectionEntity,
  TaxComplianceEntity,
  TaxDeadlineEntity,
  TaxExportEntity,
  TaxReportEntity,
  TaxRuleEntity,
  TaxSettingsEntity,
} from './entities/tax-management.entity';

@Injectable()
export class TaxManagementService {
  private readonly logger = new Logger(TaxManagementService.name);
  constructor(
    @InjectRepository(TaxRuleEntity)
    private taxRuleRepository: Repository<TaxRuleEntity>,
    @InjectRepository(TaxCollectionEntity)
    private taxCollectionRepository: Repository<TaxCollectionEntity>,
    @InjectRepository(TaxAuditTrailEntity)
    private auditTrailRepository: Repository<TaxAuditTrailEntity>,
    @InjectRepository(TaxExportEntity)
    private exportRepository: Repository<TaxExportEntity>,
    @InjectRepository(TaxReportEntity)
    private reportRepository: Repository<TaxReportEntity>,
    @InjectRepository(TaxDeadlineEntity)
    private deadlineRepository: Repository<TaxDeadlineEntity>,
    @InjectRepository(TaxSettingsEntity)
    private settingsRepository: Repository<TaxSettingsEntity>,
    @InjectRepository(TaxComplianceEntity)
    private complianceRepository: Repository<TaxComplianceEntity>,
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
    private readonly configIntegrationService: FinancialConfigIntegrationService,
    private readonly enhancedTaxService: EnhancedTaxService,
  ) {}

  // Tax Rule Management
  async createTaxRule(
    createDto: CreateTaxRuleDto,
    userId: string,
  ): Promise<TaxRuleResponseDto> {
    const taxRule = this.taxRuleRepository.create({
      ...createDto,
      createdBy: userId,
    });

    const savedRule = await this.taxRuleRepository.save(taxRule);
    await this.createAuditTrail(
      'tax_rule',
      savedRule.id,
      'CREATE',
      {},
      savedRule,
      userId,
    );

    return this.mapTaxRuleToResponse(savedRule);
  }

  async getTaxRules(
    queryDto: GetTaxRulesDto,
  ): Promise<{ rules: TaxRuleResponseDto[]; total: number }> {
    const {
      page = 1,
      limit = 10,
      search,
      taxType,
      category,
      status,
      region,
    } = queryDto;

    const queryBuilder = this.taxRuleRepository
      .createQueryBuilder('rule')
      .leftJoinAndSelect('rule.creator', 'creator')
      .leftJoinAndSelect('rule.updater', 'updater');

    if (search) {
      queryBuilder.andWhere(
        '(rule.name ILIKE :search OR rule.description ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    if (taxType) {
      queryBuilder.andWhere('rule.taxType = :taxType', { taxType });
    }

    if (category) {
      queryBuilder.andWhere('rule.category = :category', { category });
    }

    if (status) {
      queryBuilder.andWhere('rule.status = :status', { status });
    }

    if (region) {
      queryBuilder.andWhere(
        '(rule.applicableRegions IS NULL OR :region = ANY(rule.applicableRegions))',
        { region },
      );
    }

    queryBuilder
      .orderBy('rule.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [rules, total] = await queryBuilder.getManyAndCount();

    return {
      rules: rules.map((rule) => this.mapTaxRuleToResponse(rule)),
      total,
    };
  }

  async getTaxRuleById(id: string): Promise<TaxRuleResponseDto> {
    const rule = await this.taxRuleRepository.findOne({
      where: { id },
      relations: ['creator', 'updater', 'collections'],
    });

    if (!rule) {
      throw new NotFoundException('Tax rule not found');
    }

    return this.mapTaxRuleToResponse(rule);
  }

  async updateTaxRule(
    id: string,
    updateDto: UpdateTaxRuleDto,
    userId: string,
  ): Promise<TaxRuleResponseDto> {
    const rule = await this.taxRuleRepository.findOne({ where: { id } });
    if (!rule) {
      throw new NotFoundException('Tax rule not found');
    }

    const previousValues = { ...rule };
    Object.assign(rule, updateDto, { updatedBy: userId });

    const updatedRule = await this.taxRuleRepository.save(rule);
    await this.createAuditTrail(
      'tax_rule',
      id,
      'UPDATE',
      previousValues,
      updatedRule,
      userId,
    );

    return this.mapTaxRuleToResponse(updatedRule);
  }

  async deleteTaxRule(id: string, userId: string): Promise<void> {
    const rule = await this.taxRuleRepository.findOne({ where: { id } });
    if (!rule) {
      throw new NotFoundException('Tax rule not found');
    }

    // Check if rule is being used in collections
    const collectionsCount = await this.taxCollectionRepository.count({
      where: { taxRuleId: id },
    });

    if (collectionsCount > 0) {
      throw new BadRequestException(
        'Cannot delete tax rule that is being used in collections',
      );
    }

    await this.taxRuleRepository.remove(rule);
    await this.createAuditTrail('tax_rule', id, 'DELETE', rule, {}, userId);
  }

  async activateTaxRule(
    id: string,
    userId: string,
  ): Promise<TaxRuleResponseDto> {
    return this.updateTaxRuleStatus(id, TaxRuleStatus.ACTIVE, userId);
  }

  async deactivateTaxRule(
    id: string,
    userId: string,
  ): Promise<TaxRuleResponseDto> {
    return this.updateTaxRuleStatus(id, TaxRuleStatus.INACTIVE, userId);
  }

  private async updateTaxRuleStatus(
    id: string,
    status: TaxRuleStatus,
    userId: string,
  ): Promise<TaxRuleResponseDto> {
    const rule = await this.taxRuleRepository.findOne({ where: { id } });
    if (!rule) {
      throw new NotFoundException('Tax rule not found');
    }

    const previousStatus = rule.status;
    rule.status = status;
    rule.updatedBy = userId;

    const updatedRule = await this.taxRuleRepository.save(rule);
    await this.createAuditTrail(
      'tax_rule',
      id,
      'STATUS_CHANGE',
      { status: previousStatus },
      { status },
      userId,
    );

    return this.mapTaxRuleToResponse(updatedRule);
  }

  // Tax Calculation
  async calculateTax(
    calculateDto: CalculateTaxDto,
  ): Promise<TaxCalculationResponseDto> {
    const { amount, category, region, transactionDate } = calculateDto;

    const applicableRules = await this.getApplicableTaxRules(
      undefined,
      category,
      region,
      transactionDate ? new Date(transactionDate) : new Date(),
      amount,
    );

    if (applicableRules.length === 0) {
      return {
        baseAmount: amount,
        totalTaxAmount: 0,
        finalAmount: amount,
        taxBreakdown: [],
        appliedRules: [],
        calculatedAt: new Date().toISOString(),
      };
    }

    let totalTaxAmount = 0;
    const breakdown = [];
    const appliedRuleIds = [];

    for (const rule of applicableRules) {
      const taxAmount = rule.calculateTax(amount);
      totalTaxAmount += taxAmount;
      appliedRuleIds.push(rule.id);

      breakdown.push({
        ruleId: rule.id,
        ruleName: rule.name,
        taxType: rule.taxType,
        rate: rule.rate,
        taxAmount,
      });
    }

    return {
      baseAmount: amount,
      totalTaxAmount: totalTaxAmount,
      finalAmount: amount + totalTaxAmount,
      taxBreakdown: breakdown.map((item) => ({
        taxType: item.taxType,
        rate: item.rate,
        amount: item.taxAmount,
        ruleId: item.ruleId,
      })),
      appliedRules: appliedRuleIds,
      calculatedAt: new Date().toISOString(),
    };
  }

  async calculateBulkTax(
    bulkDto: BulkTaxOperationDto,
  ): Promise<BulkOperationResponseDto> {
    const successfulIds = [];
    const failedItems = [];
    let successful = 0;
    let failed = 0;

    for (const id of bulkDto.ids) {
      try {
        // Process the tax collection with the given ID
        // This is a placeholder - actual implementation would depend on the operation type
        successfulIds.push(id);
        successful++;
      } catch (error) {
        failedItems.push({
          id,
          error: error.message,
        });
        failed++;
      }
    }

    return {
      operation: 'bulk_operation',
      totalProcessed: bulkDto.ids.length,
      successful,
      failed,
      successfulIds,
      failedItems,
      processedAt: new Date().toISOString(),
    };
  }

  private async getApplicableTaxRules(
    taxType?: TaxType,
    category?: TaxCategory,
    region?: string,
    transactionDate?: Date,
    amount?: number,
  ): Promise<TaxRuleEntity[]> {
    const queryBuilder = this.taxRuleRepository
      .createQueryBuilder('rule')
      .where('rule.status = :status', { status: TaxRuleStatus.ACTIVE });

    if (taxType) {
      queryBuilder.andWhere('rule.taxType = :taxType', { taxType });
    }

    if (category) {
      queryBuilder.andWhere('rule.category = :category', { category });
    }

    const date = transactionDate || new Date();
    queryBuilder.andWhere(
      '(rule.effectiveFrom IS NULL OR rule.effectiveFrom <= :date) AND (rule.effectiveUntil IS NULL OR rule.effectiveUntil > :date)',
      { date },
    );

    if (region) {
      queryBuilder.andWhere(
        '(rule.applicableRegions IS NULL OR :region = ANY(rule.applicableRegions))',
        { region },
      );
    }

    if (amount !== undefined) {
      queryBuilder.andWhere(
        '(rule.minAmount IS NULL OR rule.minAmount <= :amount) AND (rule.maxAmount IS NULL OR rule.maxAmount >= :amount)',
        { amount },
      );
    }

    return queryBuilder.getMany();
  }

  // Tax Collection Management
  async createTaxCollection(
    createDto: CreateTaxCollectionDto,
    userId: string,
  ): Promise<TaxCollectionResponseDto> {
    // Calculate tax if not provided
    let taxAmount = createDto.taxAmount;
    let appliedRules = createDto.appliedRules || [];

    if (!taxAmount) {
      const calculation = await this.calculateTax({
        amount: createDto.baseAmount,
        category: TaxCategory.BOOKING, // Default category from TaxCategory enum
        region: 'IN', // Default region
        transactionDate: new Date().toISOString(),
      });
      taxAmount = calculation.totalTaxAmount;
      appliedRules = calculation.appliedRules;
    }

    const collection = this.taxCollectionRepository.create({
      ...createDto,
      taxAmount,
      appliedRules,
      createdBy: userId,
    });

    const savedCollection = await this.taxCollectionRepository.save(collection);
    await this.createAuditTrail(
      'tax_collection',
      savedCollection.id,
      'CREATE',
      {},
      savedCollection,
      userId,
    );

    return this.mapTaxCollectionToResponse(savedCollection);
  }

  async getTaxCollections(
    queryDto: GetTaxCollectionsDto,
  ): Promise<{ collections: TaxCollectionResponseDto[]; total: number }> {
    const {
      page = 1,
      limit = 10,
      status,
      taxPeriod,
      periodStart,
      periodEnd,
      transactionId,
    } = queryDto;

    const queryBuilder = this.taxCollectionRepository
      .createQueryBuilder('collection')
      .leftJoinAndSelect('collection.creator', 'creator')
      .leftJoinAndSelect('collection.updater', 'updater')
      .leftJoinAndSelect('collection.taxRule', 'taxRule');

    if (transactionId) {
      queryBuilder.andWhere('collection.transactionId ILIKE :transactionId', {
        transactionId: `%${transactionId}%`,
      });
    }

    if (status) {
      queryBuilder.andWhere('collection.status = :status', { status });
    }

    if (taxPeriod) {
      queryBuilder.andWhere('collection.taxPeriod = :taxPeriod', { taxPeriod });
    }

    if (periodStart && periodEnd) {
      queryBuilder.andWhere(
        'collection.periodStart >= :periodStart AND collection.periodEnd <= :periodEnd',
        {
          periodStart,
          periodEnd,
        },
      );
    }

    queryBuilder
      .orderBy('collection.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [collections, total] = await queryBuilder.getManyAndCount();

    return {
      collections: collections.map((collection) =>
        this.mapTaxCollectionToResponse(collection),
      ),
      total,
    };
  }

  async getTaxCollectionById(id: string): Promise<TaxCollectionResponseDto> {
    const collection = await this.taxCollectionRepository.findOne({
      where: { id },
      relations: ['creator', 'updater', 'taxRule'],
    });

    if (!collection) {
      throw new NotFoundException('Tax collection not found');
    }

    return this.mapTaxCollectionToResponse(collection);
  }

  async updateTaxCollection(
    id: string,
    updateDto: UpdateTaxCollectionDto,
    userId: string,
  ): Promise<TaxCollectionResponseDto> {
    const collection = await this.taxCollectionRepository.findOne({
      where: { id },
    });
    if (!collection) {
      throw new NotFoundException('Tax collection not found');
    }

    const previousValues = { ...collection };
    Object.assign(collection, updateDto, { updatedBy: userId });

    const updatedCollection =
      await this.taxCollectionRepository.save(collection);
    await this.createAuditTrail(
      'tax_collection',
      id,
      'UPDATE',
      previousValues,
      updatedCollection,
      userId,
    );

    return this.mapTaxCollectionToResponse(updatedCollection);
  }

  async deleteTaxCollection(id: string, userId: string): Promise<void> {
    const collection = await this.taxCollectionRepository.findOne({
      where: { id },
    });
    if (!collection) {
      throw new NotFoundException('Tax collection not found');
    }

    if (collection.status === TaxCollectionStatus.SUBMITTED) {
      throw new BadRequestException('Cannot delete submitted tax collection');
    }

    await this.taxCollectionRepository.remove(collection);
    await this.createAuditTrail(
      'tax_collection',
      id,
      'DELETE',
      collection,
      {},
      userId,
    );
  }

  async submitTaxCollection(
    id: string,
    userId: string,
  ): Promise<TaxCollectionResponseDto> {
    return this.updateTaxCollectionStatus(
      id,
      TaxCollectionStatus.SUBMITTED,
      userId,
    );
  }

  async approveTaxCollection(
    id: string,
    userId: string,
  ): Promise<TaxCollectionResponseDto> {
    const collection = await this.updateTaxCollectionStatus(
      id,
      TaxCollectionStatus.APPROVED,
      userId,
    );

    // Update approved timestamp
    await this.taxCollectionRepository.update(id, {
      approvedAt: new Date(),
    });

    return collection;
  }

  async rejectTaxCollection(
    id: string,
    userId: string,
    reason?: string,
  ): Promise<TaxCollectionResponseDto> {
    const collection = await this.updateTaxCollectionStatus(
      id,
      TaxCollectionStatus.REJECTED,
      userId,
    );

    if (reason) {
      await this.taxCollectionRepository.update(id, {
        notes: reason,
      });
    }

    return collection;
  }

  private async updateTaxCollectionStatus(
    id: string,
    status: TaxCollectionStatus,
    userId: string,
  ): Promise<TaxCollectionResponseDto> {
    const collection = await this.taxCollectionRepository.findOne({
      where: { id },
    });
    if (!collection) {
      throw new NotFoundException('Tax collection not found');
    }

    const previousStatus = collection.status;
    collection.status = status;
    collection.updatedBy = userId;

    if (status === TaxCollectionStatus.SUBMITTED) {
      collection.submittedAt = new Date();
    }

    const updatedCollection =
      await this.taxCollectionRepository.save(collection);
    await this.createAuditTrail(
      'tax_collection',
      id,
      'STATUS_CHANGE',
      { status: previousStatus },
      { status },
      userId,
    );

    return this.mapTaxCollectionToResponse(updatedCollection);
  }

  // Bulk Operations
  async bulkTaxCollectionOperation(
    operationDto: BulkTaxOperationDto,
    userId: string,
  ): Promise<BulkOperationResponseDto> {
    const { ids: collectionIds, reason } = operationDto;
    const results = [];

    for (const id of collectionIds) {
      try {
        // For now, we'll implement a default bulk operation (archive)
        // The operation type should be determined from the DTO structure
        await this.taxCollectionRepository.update(id, {
          status: TaxCollectionStatus.CANCELLED, // Using CANCELLED instead of ARCHIVED
        });
        const result = { id, status: 'archived' };
        results.push({ id, success: true, data: result });
      } catch (error) {
        results.push({ id, success: false, error: error.message });
      }
    }

    const successCount = results.filter((r) => r.success).length;
    const failureCount = results.filter((r) => !r.success).length;

    return {
      operation: 'bulk_operation',
      totalProcessed: collectionIds.length,
      successful: successCount,
      failed: failureCount,
      successfulIds: results.filter((r) => r.success).map((r) => r.id),
      failedItems: results
        .filter((r) => !r.success)
        .map((r) => ({ id: r.id, error: r.error || 'Unknown error' })),
      processedAt: new Date().toISOString(),
    };
  }

  // Analytics and Reporting
  async getTaxAnalytics(
    analyticsDto: TaxAnalyticsDto,
  ): Promise<TaxAnalyticsResponseDto> {
    const {
      startDate,
      endDate,
      taxType,
      category,
      groupBy = 'month',
    } = analyticsDto;

    const queryBuilder = this.taxCollectionRepository
      .createQueryBuilder('collection')
      .where('collection.createdAt BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      });

    if (taxType) {
      queryBuilder
        .innerJoin('collection.taxRule', 'rule')
        .andWhere('rule.taxType = :taxType', { taxType });
    }

    if (category) {
      queryBuilder
        .innerJoin('collection.taxRule', 'rule')
        .andWhere('rule.category = :category', { category });
    }

    const collections = await queryBuilder.getMany();

    // Calculate metrics
    const _totalCollections = collections.length;
    const totalBaseAmount = collections.reduce(
      (sum, c) => sum + Number(c.baseAmount),
      0,
    );
    const totalTaxAmount = collections.reduce(
      (sum, c) => sum + Number(c.taxAmount),
      0,
    );
    const averageTaxRate =
      totalBaseAmount > 0 ? (totalTaxAmount / totalBaseAmount) * 100 : 0;

    // Group by period
    const groupedData = this.groupCollectionsByPeriod(collections, groupBy);

    // Status distribution
    const _statusDistribution = collections.reduce((acc, collection) => {
      acc[collection.status] = (acc[collection.status] || 0) + 1;
      return acc;
    }, {});

    // Calculate tax by type and category
    const taxByType = Object.values(TaxType).map((type) => ({
      taxType: type,
      amount: collections
        .filter((c) => c.taxRule?.taxType === type)
        .reduce((sum, c) => sum + Number(c.taxAmount), 0),
      percentage: 0, // Will be calculated based on total
    }));

    const taxByCategory = Object.values(TaxCategory).map((category) => ({
      category,
      amount: collections
        .filter((c) => c.taxRule?.category === category)
        .reduce((sum, c) => sum + Number(c.taxAmount), 0),
      percentage: 0, // Will be calculated based on total
    }));

    // Calculate tax by period
    const taxByPeriod = groupedData.map((item: any) => ({
      period: item.period,
      amount: item.taxAmount,
      count: item.collections,
    }));

    // Calculate trends with proper structure
    const trends = groupedData.map((item: any, index: number) => {
      const previousItem = index > 0 ? (groupedData[index - 1] as any) : null;
      const growth =
        previousItem && previousItem.taxAmount
          ? ((item.taxAmount - previousItem.taxAmount) /
              previousItem.taxAmount) *
            100
          : 0;
      return {
        period: item.period,
        growth,
        amount: item.taxAmount,
      };
    });

    return {
      totalTaxCollected: totalTaxAmount,
      totalBaseAmount,
      averageTaxRate,
      taxByType,
      taxByCategory,
      taxByPeriod,
      trends,
      generatedAt: new Date().toISOString(),
    };
  }

  async getTaxSummary(): Promise<TaxSummaryResponseDto> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    // Current month metrics
    const monthlyCollections = await this.taxCollectionRepository.find({
      where: {
        createdAt: MoreThan(startOfMonth),
      },
    });

    // Current year metrics
    const yearlyCollections = await this.taxCollectionRepository.find({
      where: {
        createdAt: MoreThan(startOfYear),
      },
    });

    // Pending collections
    const pendingCollections = await this.taxCollectionRepository.count({
      where: {
        status: TaxCollectionStatus.PENDING,
      },
    });

    // Overdue collections
    const overdueCollections = await this.taxCollectionRepository.count({
      where: {
        status: TaxCollectionStatus.PENDING,
        periodEnd: LessThan(now),
      },
    });

    // Active rules
    const _activeRules = await this.taxRuleRepository.count({
      where: {
        status: TaxRuleStatus.ACTIVE,
      },
    });

    return {
      monthlyTaxCollected: monthlyCollections.reduce(
        (sum, c) => sum + Number(c.taxAmount),
        0,
      ),
      quarterlyTaxCollected: 0, // TODO: Implement quarterly calculation
      yearlyTaxCollected: yearlyCollections.reduce(
        (sum, c) => sum + Number(c.taxAmount),
        0,
      ),
      pendingCollections,
      overdueCollections,
      upcomingDeadlines: 0, // TODO: Implement upcoming deadlines calculation
      complianceStatus: 'COMPLIANT' as any, // TODO: Implement proper compliance status
      recentActivities: [], // TODO: Implement recent activities
    };
  }

  private groupCollectionsByPeriod(
    collections: TaxCollectionEntity[],
    groupBy: string,
  ) {
    const grouped = collections.reduce((acc, collection) => {
      let key: string;
      const date = collection.createdAt;

      switch (groupBy) {
        case 'day':
          key = date.toISOString().split('T')[0];
          break;
        case 'week': {
          const weekStart = new Date(date);
          weekStart.setDate(date.getDate() - date.getDay());
          key = weekStart.toISOString().split('T')[0];
          break;
        }
        case 'month':
          key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          break;
        case 'year':
          key = String(date.getFullYear());
          break;
        default:
          key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      }

      if (!acc[key]) {
        acc[key] = {
          period: key,
          collections: 0,
          baseAmount: 0,
          taxAmount: 0,
        };
      }

      acc[key].collections++;
      acc[key].baseAmount += Number(collection.baseAmount);
      acc[key].taxAmount += Number(collection.taxAmount);

      return acc;
    }, {});

    return Object.values(grouped);
  }

  // Export and Download
  async exportTaxData(
    exportDto: ExportTaxDataDto,
    userId: string,
  ): Promise<ExportResponseDto> {
    const exportRecord = this.exportRepository.create({
      format: exportDto.format,
      createdBy: userId,
    });

    const savedExport = await this.exportRepository.save(exportRecord);

    // Start async export process
    this.processExport(savedExport.id, exportDto).catch((error) => {
      this.logger.error(
        'Export failed',
        error instanceof Error ? error.stack : undefined,
      );
      this.exportRepository.update(savedExport.id, {
        status: ExportStatus.FAILED,
        errorMessage: error.message,
      });
    });

    return {
      exportId: savedExport.id,
      status: savedExport.status,
      format: exportDto.format,
      downloadUrl: '',
      progress: 0,
      estimatedCompletion:
        savedExport.estimatedCompletion?.toISOString() ||
        new Date().toISOString(),
      createdAt: savedExport.createdAt.toISOString(),
      completedAt: '',
    };
  }

  async getExportStatus(exportId: string): Promise<ExportResponseDto> {
    const exportRecord = await this.exportRepository.findOne({
      where: { id: exportId },
    });

    if (!exportRecord) {
      throw new NotFoundException('Export not found');
    }

    return {
      exportId: exportRecord.id,
      status: exportRecord.status,
      format: exportRecord.format || ExportFormat.CSV,
      downloadUrl: exportRecord.downloadUrl || '',
      progress: exportRecord.progress || 0,
      estimatedCompletion:
        exportRecord.estimatedCompletion?.toISOString() || '',
      createdAt: exportRecord.createdAt.toISOString(),
      completedAt: exportRecord.completedAt?.toISOString() || '',
    };
  }

  private async processExport(
    exportId: string,
    exportDto: ExportTaxDataDto,
  ): Promise<void> {
    const exportRecord = await this.exportRepository.findOne({
      where: { id: exportId },
    });
    if (!exportRecord) return;

    try {
      exportRecord.status = ExportStatus.PROCESSING;
      await this.exportRepository.save(exportRecord);

      // Simulate export processing
      const data = await this.getExportData({});
      const filePath = await this.generateExportFile(data, exportDto.format);

      exportRecord.status = ExportStatus.COMPLETED;
      exportRecord.filePath = filePath;
      exportRecord.downloadUrl = `/api/tax/exports/${exportId}/download`;
      exportRecord.progress = 100;
      exportRecord.completedAt = new Date();

      await this.exportRepository.save(exportRecord);
    } catch (error) {
      exportRecord.status = ExportStatus.FAILED;
      exportRecord.errorMessage = error.message;
      await this.exportRepository.save(exportRecord);
    }
  }

  private async getExportData(filters: any): Promise<any[]> {
    const queryBuilder = this.taxCollectionRepository
      .createQueryBuilder('collection')
      .leftJoinAndSelect('collection.taxRule', 'rule')
      .leftJoinAndSelect('collection.creator', 'creator');

    if (filters.startDate && filters.endDate) {
      queryBuilder.andWhere(
        'collection.createdAt BETWEEN :startDate AND :endDate',
        {
          startDate: filters.startDate,
          endDate: filters.endDate,
        },
      );
    }

    if (filters.status) {
      queryBuilder.andWhere('collection.status = :status', {
        status: filters.status,
      });
    }

    return queryBuilder.getMany();
  }

  private async generateExportFile(
    data: any[],
    format: string,
  ): Promise<string> {
    // Implement file generation logic based on format
    // This is a placeholder implementation
    const timestamp = Date.now();
    return `/exports/tax_data_${timestamp}.${format.toLowerCase()}`;
  }

  // Compliance Management
  async getTaxCompliance(
    complianceDto: TaxComplianceDto,
  ): Promise<TaxComplianceResponseDto> {
    const { period, checkDate = new Date() } = complianceDto;

    // Run compliance checks
    const complianceCheck = await this.runComplianceCheck(
      period,
      new Date(checkDate),
    );

    return {
      checkedAt:
        typeof checkDate === 'string' ? checkDate : checkDate.toISOString(),
      overallStatus: 'COMPLIANT' as any,
      complianceScore: complianceCheck.complianceScore,
      issues: complianceCheck.issues,
      filingStatus: [],
      paymentStatus: [],
    };
  }

  private async runComplianceCheck(
    period: any,
    checkDate: Date,
  ): Promise<TaxComplianceEntity> {
    // Implement compliance checking logic
    const complianceCheck = this.complianceRepository.create({
      checkDate,
      period,
      status: ComplianceStatus.COMPLIANT,
      complianceScore: 95,
      issues: [],
      recommendations: [],
      filingStatus: {},
      paymentStatus: {},
      checkedBy: 'system',
    });

    return this.complianceRepository.save(complianceCheck);
  }

  // Settings Management
  async getTaxSettings(): Promise<TaxSettingsResponseDto> {
    try {
      // Get settings from dynamic configuration system
      const dynamicSettings = await this.enhancedTaxService.getTaxSettings();

      // Convert enhanced settings to legacy format for backward compatibility
      return {
        id: '',
        defaultCalculationMethod: 'standard',
        autoCalculate: dynamicSettings.autoCalculateTax,
        autoSubmit: dynamicSettings.autoCollectTax,
        defaultPeriod: TaxPeriod.MONTHLY,
        notifications: {
          emailEnabled: true,
          smsEnabled: false,
          reminderDays: dynamicSettings.complianceSettings?.reminderDays || 7,
        },
        compliance: {
          gstinValidationRequired:
            dynamicSettings.complianceSettings?.gstinValidationRequired || true,
          panValidationRequired:
            dynamicSettings.complianceSettings?.panValidationRequired || true,
          automaticFilingEnabled:
            dynamicSettings.complianceSettings?.automaticFilingEnabled || false,
        },
        updatedAt: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error(
        'Failed to get dynamic tax settings, falling back to database',
        error instanceof Error ? error.stack : undefined,
      );

      // Fallback to database settings
      const settings = await this.settingsRepository.findOne({
        where: {},
        relations: ['updater'],
      });

      if (!settings) {
        // Return default settings
        return {
          id: '',
          defaultCalculationMethod: 'standard',
          autoCalculate: true,
          autoSubmit: false,
          defaultPeriod: TaxPeriod.MONTHLY,
          notifications: {},
          compliance: {},
          updatedAt: new Date().toISOString(),
        };
      }

      return this.mapTaxSettingsToResponse(settings);
    }
  }

  async updateTaxSettings(
    settingsDto: TaxSettingsDto,
    userId: string,
  ): Promise<TaxSettingsResponseDto> {
    let settings = await this.settingsRepository.findOne({ where: {} });

    if (!settings) {
      settings = this.settingsRepository.create({
        ...settingsDto,
        updatedBy: userId,
      });
    } else {
      Object.assign(settings, settingsDto, { updatedBy: userId });
    }

    const savedSettings = await this.settingsRepository.save(settings);
    return this.mapTaxSettingsToResponse(savedSettings);
  }

  // Deadline Management
  async createTaxDeadline(
    createDto: TaxDeadlineDto,
    userId: string,
  ): Promise<TaxDeadlineResponseDto> {
    const deadline = this.deadlineRepository.create({
      ...createDto,
      createdBy: userId,
    });

    const savedDeadline = await this.deadlineRepository.save(deadline);
    return this.mapTaxDeadlineToResponse(savedDeadline);
  }

  async getTaxDeadlines(): Promise<TaxDeadlineResponseDto[]> {
    const deadlines = await this.deadlineRepository.find({
      relations: ['creator', 'updater'],
      order: { dueDate: 'ASC' },
    });

    return deadlines.map((deadline) => this.mapTaxDeadlineToResponse(deadline));
  }

  async updateTaxDeadline(
    id: string,
    updateDto: TaxDeadlineDto,
    userId: string,
  ): Promise<TaxDeadlineResponseDto> {
    const deadline = await this.deadlineRepository.findOne({ where: { id } });
    if (!deadline) {
      throw new NotFoundException('Tax deadline not found');
    }

    Object.assign(deadline, updateDto, { updatedBy: userId });
    const updatedDeadline = await this.deadlineRepository.save(deadline);

    return this.mapTaxDeadlineToResponse(updatedDeadline);
  }

  async markDeadlineCompleted(
    id: string,
    userId: string,
  ): Promise<TaxDeadlineResponseDto> {
    const deadline = await this.deadlineRepository.findOne({ where: { id } });
    if (!deadline) {
      throw new NotFoundException('Tax deadline not found');
    }

    deadline.markCompleted();
    deadline.updatedBy = userId;
    const updatedDeadline = await this.deadlineRepository.save(deadline);

    return this.mapTaxDeadlineToResponse(updatedDeadline);
  }

  // Report Management
  async generateTaxReport(
    reportDto: TaxReportDto,
    userId: string,
  ): Promise<TaxReportResponseDto> {
    const report = this.reportRepository.create({
      name: reportDto.name,
      type: reportDto.type,
      startDate: new Date(reportDto.startDate),
      endDate: new Date(reportDto.endDate),
      filters: reportDto.filters || {},
      format: reportDto.format || ExportFormat.PDF,
      status: 'pending',
      generatedBy: userId,
      reportData: null,
    });

    const saved = await this.reportRepository.save(report);

    // Create audit trail for report generation
    await this.createAuditTrail(
      'TaxReport',
      saved.id,
      'CREATE',
      null,
      saved,
      userId,
    );

    // For now, mark report as ready with placeholder data
    saved.status = 'ready';
    saved.reportData = {
      summary: 'Report generated successfully',
      totals: {},
      filters: saved.filters,
      dateRange: { start: reportDto.startDate, end: reportDto.endDate },
    };
    const finalized = await this.reportRepository.save(saved);

    return this.mapTaxReportToResponse(finalized);
  }

  async getTaxReports(
    page = 1,
    limit = 10,
  ): Promise<{ reports: TaxReportResponseDto[]; total: number }> {
    const take = Math.max(1, Math.min(100, Number(limit) || 10));
    const skip = Math.max(0, (Number(page) || 1) - 1) * take;

    const [rows, total] = await this.reportRepository.findAndCount({
      order: { generatedAt: 'DESC' },
      relations: ['generator'],
      skip,
      take,
    });

    return {
      reports: rows.map((r) => this.mapTaxReportToResponse(r)),
      total,
    };
  }

  async getTaxReportById(id: string): Promise<TaxReportResponseDto> {
    const report = await this.reportRepository.findOne({
      where: { id },
      relations: ['generator'],
    });
    if (!report) {
      throw new NotFoundException('Tax report not found');
    }
    return this.mapTaxReportToResponse(report);
  }

  async downloadTaxReport(id: string): Promise<{ downloadUrl: string }> {
    const report = await this.reportRepository.findOne({ where: { id } });
    if (!report) {
      throw new NotFoundException('Tax report not found');
    }

    if (!report.fileUrl) {
      if (report.status !== 'ready') {
        throw new BadRequestException('Report not ready for download');
      }
      // Placeholder download URL generation
      report.fileUrl = `/downloads/tax-reports/${report.id}.${(
        report.format || ExportFormat.PDF
      ).toLowerCase()}`;
      await this.reportRepository.save(report);
    }

    return { downloadUrl: report.fileUrl };
  }

  async deleteTaxDeadline(id: string, userId: string): Promise<void> {
    const deadline = await this.deadlineRepository.findOne({ where: { id } });
    if (!deadline) {
      throw new NotFoundException('Tax deadline not found');
    }

    await this.deadlineRepository.remove(deadline);

    await this.createAuditTrail(
      'TaxDeadline',
      id,
      'DELETE',
      deadline,
      null,
      userId,
    );
  }

  async getTaxAuditTrail(
    entityId?: string,
    entityType?: string,
    page = 1,
    limit = 10,
  ): Promise<{ data: TaxAuditTrailResponseDto[]; total: number }> {
    const where: Record<string, any> = {};
    if (entityId) where.entityId = entityId;
    if (entityType) where.entityType = entityType;

    const take = Math.max(1, Math.min(100, Number(limit) || 10));
    const skip = Math.max(0, (Number(page) || 1) - 1) * take;

    const [rows, total] = await this.auditTrailRepository.findAndCount({
      where,
      order: { performedAt: 'DESC' },
      relations: ['performer'],
      skip,
      take,
    });

    return {
      data: rows.map((a) => this.mapTaxAuditTrailToResponse(a)),
      total,
    };
  }

  async validateTaxCalculation(
    calculateDto: CalculateTaxDto,
  ): Promise<{ isValid: boolean; errors: string[] }> {
    const errors: string[] = [];

    if (calculateDto.amount === undefined || calculateDto.amount < 0) {
      errors.push('Valid amount is required');
    }
    if (!calculateDto.category) {
      errors.push('Tax category is required');
    }

    // Validate applicable rules exist for given inputs
    const rules = await this.getApplicableTaxRules(
      undefined,
      calculateDto.category,
      calculateDto.region,
      calculateDto.transactionDate
        ? new Date(calculateDto.transactionDate)
        : undefined,
      calculateDto.amount,
    );
    if (!rules || rules.length === 0) {
      errors.push('No applicable tax rules found for given inputs');
    }

    return { isValid: errors.length === 0, errors };
  }

  // Audit Trail
  private async createAuditTrail(
    entityType: string,
    entityId: string,
    action: string,
    previousValues: any,
    newValues: any,
    userId: string,
  ): Promise<void> {
    const auditTrail = this.auditTrailRepository.create({
      entityType,
      entityId,
      action,
      previousValues,
      newValues,
      changes: this.calculateChanges(previousValues, newValues),
      performedBy: userId,
      performedAt: new Date(),
    });

    await this.auditTrailRepository.save(auditTrail);
  }

  private calculateChanges(previous: any, current: any): Record<string, any> {
    const changes = {};
    const allKeys = new Set([
      ...Object.keys(previous || {}),
      ...Object.keys(current || {}),
    ]);

    for (const key of allKeys) {
      if (previous?.[key] !== current?.[key]) {
        changes[key] = {
          from: previous?.[key],
          to: current?.[key],
        };
      }
    }

    return changes;
  }

  // Utility Methods
  async getTaxTypes(): Promise<string[]> {
    return Object.values(TaxType);
  }

  async getTaxCategories(): Promise<string[]> {
    return Object.values(TaxCategory);
  }

  async getTaxStatuses(): Promise<string[]> {
    return Object.values(TaxCollectionStatus);
  }

  async validateTaxRule(
    ruleData: any,
  ): Promise<{ isValid: boolean; errors: string[] }> {
    const errors = [];

    if (!ruleData.name) {
      errors.push('Tax rule name is required');
    }

    if (!ruleData.taxType) {
      errors.push('Tax type is required');
    }

    if (!ruleData.category) {
      errors.push('Tax category is required');
    }

    if (ruleData.rate === undefined || ruleData.rate < 0) {
      errors.push('Valid tax rate is required');
    }

    if (ruleData.effectiveFrom && ruleData.effectiveUntil) {
      if (
        new Date(ruleData.effectiveFrom) >= new Date(ruleData.effectiveUntil)
      ) {
        errors.push('Effective from date must be before effective until date');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  // Mapping Methods
  private mapTaxRuleToResponse(rule: TaxRuleEntity): TaxRuleResponseDto {
    return {
      id: rule.id,
      name: rule.name,
      description: rule.description,
      taxType: rule.taxType,
      category: rule.category,
      rate: Number(rule.rate),
      minAmount: rule.minAmount ? Number(rule.minAmount) : undefined,
      maxAmount: rule.maxAmount ? Number(rule.maxAmount) : undefined,
      applicableRegions: rule.applicableRegions,
      effectiveFrom: rule.effectiveFrom?.toISOString() || '',
      effectiveUntil: rule.effectiveUntil?.toISOString(),
      conditions: rule.conditions,
      status: rule.status,
      createdBy: rule.createdBy,
      updatedBy: rule.updatedBy,
      createdAt: rule.createdAt.toISOString(),
      updatedAt: rule.updatedAt.toISOString(),
    };
  }

  private mapTaxCollectionToResponse(
    collection: TaxCollectionEntity,
  ): TaxCollectionResponseDto {
    return {
      id: collection.id,
      transactionId: collection.transactionId,
      baseAmount: Number(collection.baseAmount),
      taxAmount: Number(collection.taxAmount),
      taxPeriod: collection.taxPeriod,
      periodStart: collection.periodStart.toISOString(),
      periodEnd: collection.periodEnd.toISOString(),
      appliedRules: collection.appliedRules,
      status: collection.status,
      notes: collection.notes,
      metadata: collection.metadata,
      createdBy: collection.createdBy,
      updatedBy: collection.updatedBy,
      submittedAt: collection.submittedAt?.toISOString() || '',
      approvedAt: collection.approvedAt?.toISOString() || '',
      createdAt: collection.createdAt.toISOString(),
      updatedAt: collection.updatedAt.toISOString(),
    };
  }

  private mapTaxSettingsToResponse(
    settings: TaxSettingsEntity,
  ): TaxSettingsResponseDto {
    return {
      id: settings.id,
      defaultCalculationMethod: settings.defaultCalculationMethod,
      autoCalculate: settings.autoCalculate,
      autoSubmit: settings.autoSubmit,
      defaultPeriod: settings.defaultPeriod,
      notifications: settings.notifications,
      compliance: settings.compliance,

      updatedAt: settings.updatedAt.toISOString(),
    };
  }

  private mapTaxDeadlineToResponse(
    deadline: TaxDeadlineEntity,
  ): TaxDeadlineResponseDto {
    return {
      id: deadline.id,
      title: deadline.title,
      description: deadline.description,
      type: deadline.type,
      dueDate: deadline.dueDate.toISOString(),
      status: deadline.status,
      reminderDays: deadline.reminderDays,

      daysRemaining: deadline.getDaysRemaining(),
      createdAt: deadline.createdAt.toISOString(),
      updatedAt: deadline.updatedAt.toISOString(),
    };
  }

  private mapTaxReportToResponse(
    report: TaxReportEntity,
  ): TaxReportResponseDto {
    return {
      id: report.id,
      name: report.name,
      type: report.type,
      startDate: report.startDate.toISOString(),
      endDate: report.endDate.toISOString(),
      status: report.status,
      fileUrl: report.fileUrl,
      format: report.format,
      generatedBy: report.generatedBy,
      generatedAt: report.generatedAt.toISOString(),
    };
  }

  private mapTaxAuditTrailToResponse(
    audit: TaxAuditTrailEntity,
  ): TaxAuditTrailResponseDto {
    return {
      id: audit.id,
      entityId: audit.entityId,
      entityType: audit.entityType,
      action: audit.action,
      changes: audit.changes,
      performedBy: audit.performedBy,
      performedAt: audit.performedAt.toISOString(),
      metadata: audit.metadata,
    };
  }
}
