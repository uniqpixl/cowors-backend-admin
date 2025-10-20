import { UserEntity } from '@/auth/entities/user.entity';
import { EnhancedTaxService } from '@/common/services/enhanced-tax.service';
import { FinancialConfigIntegrationService } from '@/common/services/financial-config-integration.service';
import { BookingEntity } from '@/database/entities/booking.entity';
import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
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
import {
  BulkOperationResponseDto,
  BulkOperationType,
  BulkTaxOperationDto,
  CalculationStatus,
  ComplianceStatus,
  ComplianceType,
  CreateTaxCalculationDto,
  CreateTaxComplianceDto,
  CreateTaxReturnDto,
  CreateTaxRuleDto,
  ExportFormat,
  ExportResponseDto,
  ExportStatus,
  ExportTaxDataDto,
  GetTaxCalculationsDto,
  GetTaxComplianceDto,
  GetTaxReturnsDto,
  GetTaxRulesDto,
  ReturnStatus,
  TaxAnalyticsDto,
  TaxAnalyticsResponseDto,
  TaxCalculationResponseDto,
  TaxComplianceResponseDto,
  TaxReturnResponseDto,
  TaxRuleResponseDto,
  TaxSettingsDto,
  TaxSettingsResponseDto,
  TaxStatus,
  TaxSummaryResponseDto,
  TaxType,
  UpdateTaxCalculationDto,
  UpdateTaxComplianceDto,
  UpdateTaxReturnDto,
  UpdateTaxRuleDto,
} from './dto/tax-gst.dto';
import {
  CalculateTaxDto,
  TaxCategory,
  BulkOperationResponseDto as TaxManagementBulkOperationResponseDto,
  TaxComplianceResponseDto as TaxManagementComplianceResponseDto,
  ComplianceStatus as TaxManagementComplianceStatus,
} from './dto/tax-management.dto';
import {
  TaxAuditTrailEntity,
  TaxCalculationEntity,
  TaxComplianceEntity,
  TaxExportEntity,
  TaxReportEntity,
  TaxReturnEntity,
  TaxRuleEntity,
  TaxSettingsEntity,
} from './entities/tax-gst.entity';

@Injectable()
export class TaxGstService {
  private readonly logger = new Logger(TaxGstService.name);
  constructor(
    @InjectRepository(TaxRuleEntity)
    private readonly taxRuleRepository: Repository<TaxRuleEntity>,
    @InjectRepository(TaxCalculationEntity)
    private readonly taxCalculationRepository: Repository<TaxCalculationEntity>,
    @InjectRepository(TaxReturnEntity)
    private readonly taxReturnRepository: Repository<TaxReturnEntity>,
    @InjectRepository(TaxComplianceEntity)
    private readonly taxComplianceRepository: Repository<TaxComplianceEntity>,
    @InjectRepository(TaxAuditTrailEntity)
    private readonly taxAuditTrailRepository: Repository<TaxAuditTrailEntity>,
    @InjectRepository(TaxExportEntity)
    private readonly taxExportRepository: Repository<TaxExportEntity>,
    @InjectRepository(TaxReportEntity)
    private readonly taxReportRepository: Repository<TaxReportEntity>,
    @InjectRepository(TaxSettingsEntity)
    private readonly taxSettingsRepository: Repository<TaxSettingsEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    @InjectRepository(BookingEntity)
    private readonly bookingRepository: Repository<BookingEntity>,
    private readonly configIntegrationService: FinancialConfigIntegrationService,
    private readonly enhancedTaxService: EnhancedTaxService,
  ) {}

  // Tax Rule Management
  async createTaxRule(
    createTaxRuleDto: CreateTaxRuleDto,
    userId: string,
  ): Promise<TaxRuleResponseDto> {
    // Check for duplicate rule
    const existingRule = await this.taxRuleRepository.findOne({
      where: {
        name: createTaxRuleDto.name,
        type: createTaxRuleDto.type,
        status: Not(TaxStatus.DELETED),
      },
    });

    if (existingRule) {
      throw new ConflictException(
        'Tax rule with this name and type already exists',
      );
    }

    const taxRule = this.taxRuleRepository.create({
      ...createTaxRuleDto,
      createdBy: userId,
    });

    const savedRule = await this.taxRuleRepository.save(taxRule);

    // Create audit trail
    await this.createAuditTrail(
      'TaxRule',
      savedRule.id,
      'CREATE',
      null,
      savedRule,
      userId,
    );

    return this.mapTaxRuleToResponse(savedRule);
  }

  async getTaxRules(getTaxRulesDto: GetTaxRulesDto): Promise<{
    data: TaxRuleResponseDto[];
    total: number;
    page: number;
    limit: number;
  }> {
    const {
      page = 1,
      limit = 10,
      search,
      type,
      status,
      category,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
    } = getTaxRulesDto;
    const skip = (page - 1) * limit;

    const queryBuilder = this.taxRuleRepository
      .createQueryBuilder('rule')
      .leftJoinAndSelect('rule.creator', 'creator')
      .leftJoinAndSelect('rule.updater', 'updater');

    if (search) {
      queryBuilder.andWhere(
        '(rule.name ILIKE :search OR rule.description ILIKE :search)',
        {
          search: `%${search}%`,
        },
      );
    }

    if (type) {
      queryBuilder.andWhere('rule.type = :type', { type });
    }

    if (status) {
      queryBuilder.andWhere('rule.status = :status', { status });
    }

    if (category) {
      queryBuilder.andWhere('rule.category = :category', { category });
    }

    queryBuilder.orderBy(`rule.${sortBy}`, sortOrder).skip(skip).take(limit);

    const [rules, total] = await queryBuilder.getManyAndCount();

    return {
      data: rules.map((rule) => this.mapTaxRuleToResponse(rule)),
      total,
      page,
      limit,
    };
  }

  async getTaxRuleById(id: string): Promise<TaxRuleResponseDto> {
    const rule = await this.taxRuleRepository.findOne({
      where: { id },
      relations: ['creator', 'updater', 'calculations'],
    });

    if (!rule) {
      throw new NotFoundException('Tax rule not found');
    }

    return this.mapTaxRuleToResponse(rule);
  }

  async updateTaxRule(
    id: string,
    updateTaxRuleDto: UpdateTaxRuleDto,
    userId: string,
  ): Promise<TaxRuleResponseDto> {
    const rule = await this.taxRuleRepository.findOne({ where: { id } });

    if (!rule) {
      throw new NotFoundException('Tax rule not found');
    }

    const oldValues = { ...rule };
    Object.assign(rule, updateTaxRuleDto, { updatedBy: userId });

    const updatedRule = await this.taxRuleRepository.save(rule);

    // Create audit trail
    await this.createAuditTrail(
      'TaxRule',
      id,
      'UPDATE',
      oldValues,
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

    // Check if rule is being used in calculations
    const calculationsCount = await this.taxCalculationRepository.count({
      where: { taxRuleId: id },
    });

    if (calculationsCount > 0) {
      // Soft delete by marking as deleted
      rule.status = TaxStatus.DELETED;
      rule.updatedBy = userId;
      await this.taxRuleRepository.save(rule);
    } else {
      // Hard delete if no calculations exist
      await this.taxRuleRepository.remove(rule);
    }

    // Create audit trail
    await this.createAuditTrail('TaxRule', id, 'DELETE', rule, null, userId);
  }

  async activateTaxRule(
    id: string,
    userId: string,
  ): Promise<TaxRuleResponseDto> {
    return this.updateTaxRuleStatus(id, TaxStatus.ACTIVE, userId);
  }

  async deactivateTaxRule(
    id: string,
    userId: string,
  ): Promise<TaxRuleResponseDto> {
    return this.updateTaxRuleStatus(id, TaxStatus.INACTIVE, userId);
  }

  private async updateTaxRuleStatus(
    id: string,
    status: TaxStatus,
    userId: string,
  ): Promise<TaxRuleResponseDto> {
    const rule = await this.taxRuleRepository.findOne({ where: { id } });

    if (!rule) {
      throw new NotFoundException('Tax rule not found');
    }

    const oldStatus = rule.status;
    rule.status = status;
    rule.updatedBy = userId;

    const updatedRule = await this.taxRuleRepository.save(rule);

    // Create audit trail
    await this.createAuditTrail(
      'TaxRule',
      id,
      'STATUS_CHANGE',
      { status: oldStatus },
      { status },
      userId,
    );

    return this.mapTaxRuleToResponse(updatedRule);
  }

  // Tax Calculation Management
  async createTaxCalculation(
    createTaxCalculationDto: CreateTaxCalculationDto,
    userId: string,
  ): Promise<TaxCalculationResponseDto> {
    const calculation = this.taxCalculationRepository.create({
      ...createTaxCalculationDto,
      createdBy: userId,
    });

    const savedCalculation =
      await this.taxCalculationRepository.save(calculation);

    // Create audit trail
    await this.createAuditTrail(
      'TaxCalculation',
      savedCalculation.id,
      'CREATE',
      null,
      savedCalculation,
      userId,
    );

    return this.mapTaxCalculationToResponse(savedCalculation);
  }

  async calculateTax(
    calculateTaxDto: CalculateTaxDto,
  ): Promise<TaxCalculationResponseDto> {
    const {
      amount: baseAmount,
      category,
      region: stateCode,
      transactionDate,
      customerType,
    } = calculateTaxDto;

    // Default tax type based on category
    const taxType =
      category === TaxCategory.BOOKING ? TaxType.GST : TaxType.GST;

    // Find applicable tax rules
    const applicableRules = await this.findApplicableTaxRules(
      taxType,
      undefined, // hsnSacCode not available in this DTO
      stateCode,
    );

    if (applicableRules.length === 0) {
      throw new BadRequestException('No applicable tax rules found');
    }

    const calculations = [];
    let totalTaxAmount = 0;

    for (const rule of applicableRules) {
      const taxAmount = this.calculateTaxAmount(baseAmount, rule.rate);
      totalTaxAmount += taxAmount;

      calculations.push({
        taxType: rule.type,
        taxRate: rule.rate,
        taxAmount,
        ruleName: rule.name,
        ruleId: rule.id,
      });
    }

    const totalAmount = baseAmount + totalTaxAmount;

    // Create a tax calculation record
    const taxCalculation = this.taxCalculationRepository.create({
      referenceId: `calc-${Date.now()}`,
      referenceType: 'manual',
      baseAmount,
      taxType,
      taxRate: (totalTaxAmount / baseAmount) * 100,
      taxAmount: totalTaxAmount,
      totalAmount,
      status: CalculationStatus.CALCULATED,
      hsnSacCode: '',
      stateCode: '',
      customerGstNumber: '',
      supplierGstNumber: '',
      placeOfSupply: '',
      transactionDate: new Date(),
      calculationBreakdown: {
        cgst: this.getCgstAmount(calculations),
        sgst: this.getSgstAmount(calculations),
        igst: this.getIgstAmount(calculations),
        cess: this.getCessAmount(calculations),
      },
      createdBy: 'system',
    });

    const savedCalculation =
      await this.taxCalculationRepository.save(taxCalculation);
    return this.mapTaxCalculationToResponse(savedCalculation);
  }

  async getTaxCalculations(
    getTaxCalculationsDto: GetTaxCalculationsDto,
  ): Promise<{
    data: TaxCalculationResponseDto[];
    total: number;
    page: number;
    limit: number;
  }> {
    const {
      page = 1,
      limit = 10,
      search,
      taxType,
      status,
      referenceType,
      startDate,
      endDate,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
    } = getTaxCalculationsDto;
    const skip = (page - 1) * limit;

    const queryBuilder = this.taxCalculationRepository
      .createQueryBuilder('calculation')
      .leftJoinAndSelect('calculation.creator', 'creator')
      .leftJoinAndSelect('calculation.taxRule', 'taxRule');

    if (search) {
      queryBuilder.andWhere('calculation.referenceId ILIKE :search', {
        search: `%${search}%`,
      });
    }

    if (taxType) {
      queryBuilder.andWhere('calculation.taxType = :taxType', { taxType });
    }

    if (status) {
      queryBuilder.andWhere('calculation.status = :status', { status });
    }

    if (referenceType) {
      queryBuilder.andWhere('calculation.referenceType = :referenceType', {
        referenceType,
      });
    }

    if (startDate && endDate) {
      queryBuilder.andWhere(
        'calculation.transactionDate BETWEEN :startDate AND :endDate',
        {
          startDate,
          endDate,
        },
      );
    }

    queryBuilder
      .orderBy(`calculation.${sortBy}`, sortOrder)
      .skip(skip)
      .take(limit);

    const [calculations, total] = await queryBuilder.getManyAndCount();

    return {
      data: calculations.map((calc) => this.mapTaxCalculationToResponse(calc)),
      total,
      page,
      limit,
    };
  }

  async getTaxCalculationById(id: string): Promise<TaxCalculationResponseDto> {
    const calculation = await this.taxCalculationRepository.findOne({
      where: { id },
      relations: ['creator', 'updater', 'taxRule', 'booking'],
    });

    if (!calculation) {
      throw new NotFoundException('Tax calculation not found');
    }

    return this.mapTaxCalculationToResponse(calculation);
  }

  async updateTaxCalculation(
    id: string,
    updateTaxCalculationDto: UpdateTaxCalculationDto,
    userId: string,
  ): Promise<TaxCalculationResponseDto> {
    const calculation = await this.taxCalculationRepository.findOne({
      where: { id },
    });

    if (!calculation) {
      throw new NotFoundException('Tax calculation not found');
    }

    const oldValues = { ...calculation };
    Object.assign(calculation, updateTaxCalculationDto, { updatedBy: userId });

    const updatedCalculation =
      await this.taxCalculationRepository.save(calculation);

    // Create audit trail
    await this.createAuditTrail(
      'TaxCalculation',
      id,
      'UPDATE',
      oldValues,
      updatedCalculation,
      userId,
    );

    return this.mapTaxCalculationToResponse(updatedCalculation);
  }

  async deleteTaxCalculation(id: string, userId: string): Promise<void> {
    const calculation = await this.taxCalculationRepository.findOne({
      where: { id },
    });

    if (!calculation) {
      throw new NotFoundException('Tax calculation not found');
    }

    await this.taxCalculationRepository.remove(calculation);

    // Create audit trail
    await this.createAuditTrail(
      'TaxCalculation',
      id,
      'DELETE',
      calculation,
      null,
      userId,
    );
  }

  // Tax Return Management
  async createTaxReturn(
    createTaxReturnDto: CreateTaxReturnDto,
    userId: string,
  ): Promise<TaxReturnResponseDto> {
    // Check for duplicate return for the same period
    const existingReturn = await this.taxReturnRepository.findOne({
      where: {
        returnPeriod: createTaxReturnDto.returnPeriod,
        returnType: createTaxReturnDto.returnType,
        taxType: createTaxReturnDto.taxType,
      },
    });

    if (existingReturn) {
      throw new ConflictException('Tax return for this period already exists');
    }

    const taxReturn = this.taxReturnRepository.create({
      ...createTaxReturnDto,
      createdBy: userId,
    });

    const savedReturn = await this.taxReturnRepository.save(taxReturn);

    // Create audit trail
    await this.createAuditTrail(
      'TaxReturn',
      savedReturn.id,
      'CREATE',
      null,
      savedReturn,
      userId,
    );

    return this.mapTaxReturnToResponse(savedReturn);
  }

  async getTaxReturns(getTaxReturnsDto: GetTaxReturnsDto): Promise<{
    data: TaxReturnResponseDto[];
    total: number;
    page: number;
    limit: number;
  }> {
    const {
      page = 1,
      limit = 10,
      search,
      taxType,
      status,
      returnType,
      startDate,
      endDate,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
    } = getTaxReturnsDto;
    const skip = (page - 1) * limit;

    const queryBuilder = this.taxReturnRepository
      .createQueryBuilder('taxReturn')
      .leftJoinAndSelect('taxReturn.creator', 'creator')
      .leftJoinAndSelect('taxReturn.approver', 'approver');

    if (search) {
      queryBuilder.andWhere('taxReturn.returnPeriod ILIKE :search', {
        search: `%${search}%`,
      });
    }

    if (taxType) {
      queryBuilder.andWhere('taxReturn.taxType = :taxType', { taxType });
    }

    if (status) {
      queryBuilder.andWhere('taxReturn.status = :status', { status });
    }

    if (returnType) {
      queryBuilder.andWhere('taxReturn.returnType = :returnType', {
        returnType,
      });
    }

    if (startDate && endDate) {
      queryBuilder.andWhere(
        'taxReturn.dueDate BETWEEN :startDate AND :endDate',
        {
          startDate,
          endDate,
        },
      );
    }

    queryBuilder
      .orderBy(`taxReturn.${sortBy}`, sortOrder)
      .skip(skip)
      .take(limit);

    const [returns, total] = await queryBuilder.getManyAndCount();

    return {
      data: returns.map((ret) => this.mapTaxReturnToResponse(ret)),
      total,
      page,
      limit,
    };
  }

  async getTaxReturnById(id: string): Promise<TaxReturnResponseDto> {
    const taxReturn = await this.taxReturnRepository.findOne({
      where: { id },
      relations: ['creator', 'updater', 'approver'],
    });

    if (!taxReturn) {
      throw new NotFoundException('Tax return not found');
    }

    return this.mapTaxReturnToResponse(taxReturn);
  }

  async updateTaxReturn(
    id: string,
    updateTaxReturnDto: UpdateTaxReturnDto,
    userId: string,
  ): Promise<TaxReturnResponseDto> {
    const taxReturn = await this.taxReturnRepository.findOne({ where: { id } });

    if (!taxReturn) {
      throw new NotFoundException('Tax return not found');
    }

    if (taxReturn.status === ReturnStatus.FILED) {
      throw new BadRequestException('Cannot update a filed tax return');
    }

    const oldValues = { ...taxReturn };
    Object.assign(taxReturn, updateTaxReturnDto, { updatedBy: userId });

    const updatedReturn = await this.taxReturnRepository.save(taxReturn);

    // Create audit trail
    await this.createAuditTrail(
      'TaxReturn',
      id,
      'UPDATE',
      oldValues,
      updatedReturn,
      userId,
    );

    return this.mapTaxReturnToResponse(updatedReturn);
  }

  async deleteTaxReturn(id: string, userId: string): Promise<void> {
    const taxReturn = await this.taxReturnRepository.findOne({ where: { id } });

    if (!taxReturn) {
      throw new NotFoundException('Tax return not found');
    }

    if (taxReturn.status === ReturnStatus.FILED) {
      throw new BadRequestException('Cannot delete a filed tax return');
    }

    await this.taxReturnRepository.remove(taxReturn);

    // Create audit trail
    await this.createAuditTrail(
      'TaxReturn',
      id,
      'DELETE',
      taxReturn,
      null,
      userId,
    );
  }

  async submitTaxReturn(
    id: string,
    userId: string,
  ): Promise<TaxReturnResponseDto> {
    return this.updateTaxReturnStatus(id, ReturnStatus.SUBMITTED, userId);
  }

  async approveTaxReturn(
    id: string,
    userId: string,
  ): Promise<TaxReturnResponseDto> {
    const taxReturn = await this.taxReturnRepository.findOne({ where: { id } });

    if (!taxReturn) {
      throw new NotFoundException('Tax return not found');
    }

    if (taxReturn.status !== ReturnStatus.SUBMITTED) {
      throw new BadRequestException(
        'Tax return must be submitted before approval',
      );
    }

    taxReturn.status = ReturnStatus.APPROVED;
    taxReturn.approvedBy = userId;
    taxReturn.approvedAt = new Date();
    taxReturn.updatedBy = userId;

    const updatedReturn = await this.taxReturnRepository.save(taxReturn);

    // Create audit trail
    await this.createAuditTrail(
      'TaxReturn',
      id,
      'APPROVE',
      { status: ReturnStatus.SUBMITTED },
      { status: ReturnStatus.APPROVED },
      userId,
    );

    return this.mapTaxReturnToResponse(updatedReturn);
  }

  async rejectTaxReturn(
    id: string,
    rejectionReason: string,
    userId: string,
  ): Promise<TaxReturnResponseDto> {
    const taxReturn = await this.taxReturnRepository.findOne({ where: { id } });

    if (!taxReturn) {
      throw new NotFoundException('Tax return not found');
    }

    if (taxReturn.status !== ReturnStatus.SUBMITTED) {
      throw new BadRequestException(
        'Tax return must be submitted before rejection',
      );
    }

    taxReturn.status = ReturnStatus.REJECTED;
    taxReturn.rejectionReason = rejectionReason;
    taxReturn.updatedBy = userId;

    const updatedReturn = await this.taxReturnRepository.save(taxReturn);

    // Create audit trail
    await this.createAuditTrail(
      'TaxReturn',
      id,
      'REJECT',
      { status: ReturnStatus.SUBMITTED },
      { status: ReturnStatus.REJECTED, rejectionReason },
      userId,
    );

    return this.mapTaxReturnToResponse(updatedReturn);
  }

  private async updateTaxReturnStatus(
    id: string,
    status: ReturnStatus,
    userId: string,
  ): Promise<TaxReturnResponseDto> {
    const taxReturn = await this.taxReturnRepository.findOne({ where: { id } });

    if (!taxReturn) {
      throw new NotFoundException('Tax return not found');
    }

    const oldStatus = taxReturn.status;
    taxReturn.status = status;
    taxReturn.updatedBy = userId;

    if (status === ReturnStatus.FILED) {
      taxReturn.filedDate = new Date();
    }

    const updatedReturn = await this.taxReturnRepository.save(taxReturn);

    // Create audit trail
    await this.createAuditTrail(
      'TaxReturn',
      id,
      'STATUS_CHANGE',
      { status: oldStatus },
      { status },
      userId,
    );

    return this.mapTaxReturnToResponse(updatedReturn);
  }

  // Tax Compliance Management
  async createTaxCompliance(
    createTaxComplianceDto: CreateTaxComplianceDto,
    userId: string,
  ): Promise<TaxComplianceResponseDto> {
    const compliance = this.taxComplianceRepository.create({
      ...createTaxComplianceDto,
      createdBy: userId,
    });

    const savedCompliance = await this.taxComplianceRepository.save(compliance);

    // Create audit trail
    await this.createAuditTrail(
      'TaxCompliance',
      savedCompliance.id,
      'CREATE',
      null,
      savedCompliance,
      userId,
    );

    return this.mapTaxComplianceToResponse(savedCompliance);
  }

  async getTaxCompliance(getTaxComplianceDto: GetTaxComplianceDto): Promise<{
    data: TaxComplianceResponseDto[];
    total: number;
    page: number;
    limit: number;
  }> {
    const {
      page = 1,
      limit = 10,
      search,
      complianceType,
      taxType,
      status,
      startDate,
      endDate,
      sortBy = 'dueDate',
      sortOrder = 'ASC',
    } = getTaxComplianceDto;
    const skip = (page - 1) * limit;

    const queryBuilder = this.taxComplianceRepository
      .createQueryBuilder('compliance')
      .leftJoinAndSelect('compliance.creator', 'creator');

    if (search) {
      queryBuilder.andWhere(
        '(compliance.compliancePeriod ILIKE :search OR compliance.description ILIKE :search)',
        {
          search: `%${search}%`,
        },
      );
    }

    if (complianceType) {
      queryBuilder.andWhere('compliance.complianceType = :complianceType', {
        complianceType,
      });
    }

    if (taxType) {
      queryBuilder.andWhere('compliance.taxType = :taxType', { taxType });
    }

    if (status) {
      queryBuilder.andWhere('compliance.status = :status', { status });
    }

    if (startDate && endDate) {
      queryBuilder.andWhere(
        'compliance.dueDate BETWEEN :startDate AND :endDate',
        {
          startDate,
          endDate,
        },
      );
    }

    queryBuilder
      .orderBy(`compliance.${sortBy}`, sortOrder)
      .skip(skip)
      .take(limit);

    const [compliance, total] = await queryBuilder.getManyAndCount();

    return {
      data: compliance.map((comp) => this.mapTaxComplianceToResponse(comp)),
      total,
      page,
      limit,
    };
  }

  async getTaxComplianceById(id: string): Promise<TaxComplianceResponseDto> {
    const compliance = await this.taxComplianceRepository.findOne({
      where: { id },
      relations: ['creator', 'updater'],
    });

    if (!compliance) {
      throw new NotFoundException('Tax compliance not found');
    }

    return this.mapTaxComplianceToResponse(compliance);
  }

  async updateTaxCompliance(
    id: string,
    updateTaxComplianceDto: UpdateTaxComplianceDto,
    userId: string,
  ): Promise<TaxComplianceResponseDto> {
    const compliance = await this.taxComplianceRepository.findOne({
      where: { id },
    });

    if (!compliance) {
      throw new NotFoundException('Tax compliance not found');
    }

    const oldValues = { ...compliance };
    Object.assign(compliance, updateTaxComplianceDto, { updatedBy: userId });

    const updatedCompliance =
      await this.taxComplianceRepository.save(compliance);

    // Create audit trail
    await this.createAuditTrail(
      'TaxCompliance',
      id,
      'UPDATE',
      oldValues,
      updatedCompliance,
      userId,
    );

    return this.mapTaxComplianceToResponse(updatedCompliance);
  }

  async deleteTaxCompliance(id: string, userId: string): Promise<void> {
    const compliance = await this.taxComplianceRepository.findOne({
      where: { id },
    });

    if (!compliance) {
      throw new NotFoundException('Tax compliance not found');
    }

    await this.taxComplianceRepository.remove(compliance);

    // Create audit trail
    await this.createAuditTrail(
      'TaxCompliance',
      id,
      'DELETE',
      compliance,
      null,
      userId,
    );
  }

  async getUpcomingCompliance(): Promise<TaxComplianceResponseDto[]> {
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    const upcomingCompliance = await this.taxComplianceRepository.find({
      where: {
        dueDate: LessThan(thirtyDaysFromNow),
        status: Not(ComplianceStatus.COMPLIANT),
      },
      order: { dueDate: 'ASC' },
      take: 10,
    });

    return upcomingCompliance.map((compliance) =>
      this.mapTaxComplianceToResponse(compliance),
    );
  }

  // Bulk Operations
  async bulkTaxOperations(
    bulkOperationDto: BulkTaxOperationDto,
    userId: string,
  ): Promise<BulkOperationResponseDto> {
    const { operation, entityType, entityIds, data } = bulkOperationDto;
    const results = {
      successful: [],
      failed: [],
      total: entityIds.length,
    };

    for (const entityId of entityIds) {
      try {
        switch (entityType) {
          case 'tax_rule':
            await this.processBulkTaxRuleOperation(
              operation,
              entityId,
              data,
              userId,
            );
            break;
          case 'tax_calculation':
            await this.processBulkTaxCalculationOperation(
              operation,
              entityId,
              data,
              userId,
            );
            break;
          case 'tax_return':
            await this.processBulkTaxReturnOperation(
              operation,
              entityId,
              data,
              userId,
            );
            break;
          case 'tax_compliance':
            await this.processBulkTaxComplianceOperation(
              operation,
              entityId,
              data,
              userId,
            );
            break;
          default:
            throw new Error(`Unsupported entity type: ${entityType}`);
        }
        results.successful.push(entityId);
      } catch (error) {
        results.failed.push({ entityId, error: error.message });
      }
    }

    return {
      operationId: `bulk-${Date.now()}`,
      operation: bulkOperationDto.operation,
      totalItems: bulkOperationDto.entityIds.length,
      successCount: results.successful.length,
      failureCount: results.failed.length,
      results: [
        ...results.successful.map((id) => ({ id, success: true })),
        ...results.failed.map((item) => ({
          id: item.entityId,
          success: false,
          error: item.error,
        })),
      ],
      status: 'completed',
      startedAt: new Date(),
      completedAt: new Date(),
    };
  }

  // Analytics and Reporting
  async getTaxAnalytics(
    analyticsDto: TaxAnalyticsDto,
  ): Promise<TaxAnalyticsResponseDto> {
    const { startDate, endDate, taxType, groupBy = 'month' } = analyticsDto;

    const queryBuilder = this.taxCalculationRepository
      .createQueryBuilder('calculation')
      .where('calculation.transactionDate BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      });

    if (taxType) {
      queryBuilder.andWhere('calculation.taxType = :taxType', { taxType });
    }

    const calculations = await queryBuilder.getMany();

    const analytics = this.processAnalyticsData(calculations, groupBy);

    return {
      period: { startDate, endDate },
      totalTaxCollected: calculations.reduce(
        (sum, calc) => sum + Number(calc.taxAmount),
        0,
      ),
      totalTaxLiability: calculations.reduce(
        (sum, calc) => sum + Number(calc.baseAmount),
        0,
      ),
      taxByType: this.getTaxByType(calculations),
      taxByState: this.getTaxByState(calculations),
      monthlyTrends: this.getMonthlyTrends(calculations),
      complianceRate: 95, // placeholder
      overdueReturns: 0, // placeholder
      pendingCalculations: calculations.length,
    };
  }

  private getTaxByType(calculations: any[]): Record<string, number> {
    const result: Record<string, number> = {};
    Object.values(TaxType).forEach((type) => {
      result[type] = calculations
        .filter((c) => c.taxRule?.taxType === type)
        .reduce((sum, c) => sum + Number(c.taxAmount), 0);
    });
    return result;
  }

  private getTaxByState(calculations: any[]): Record<string, number> {
    const result: Record<string, number> = {};
    calculations.forEach((calc) => {
      const state = calc.placeOfSupply || 'Unknown';
      if (!result[state]) {
        result[state] = 0;
      }
      result[state] += Number(calc.taxAmount);
    });
    return result;
  }

  private getMonthlyTrends(calculations: any[]): any[] {
    const monthlyGroups = calculations.reduce((acc, calc) => {
      const date = new Date(calc.transactionDate);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (!acc[monthKey]) {
        acc[monthKey] = {
          period: monthKey,
          amount: 0,
          count: 0,
        };
      }
      acc[monthKey].amount += Number(calc.taxAmount);
      acc[monthKey].count += 1;
      return acc;
    }, {});
    return Object.values(monthlyGroups);
  }

  async getTaxSummary(): Promise<TaxSummaryResponseDto> {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    const [
      totalRules,
      activeRules,
      monthlyCalculations,
      pendingReturns,
      overdueCompliance,
    ] = await Promise.all([
      this.taxRuleRepository.count(),
      this.taxRuleRepository.count({ where: { status: TaxStatus.ACTIVE } }),
      this.taxCalculationRepository.count({
        where: { transactionDate: Between(startOfMonth, endOfMonth) },
      }),
      this.taxReturnRepository.count({ where: { status: ReturnStatus.DRAFT } }),
      this.taxComplianceRepository.count({
        where: {
          dueDate: LessThan(today),
          status: Not(ComplianceStatus.COMPLIANT),
        },
      }),
    ]);

    const monthlyTaxAmount = await this.taxCalculationRepository
      .createQueryBuilder('calculation')
      .select('SUM(calculation.taxAmount)', 'total')
      .where('calculation.transactionDate BETWEEN :startDate AND :endDate', {
        startDate: startOfMonth,
        endDate: endOfMonth,
      })
      .getRawOne();

    return {
      currentMonthLiability: Number(monthlyTaxAmount?.total || 0),
      currentMonthCollected: Number(monthlyTaxAmount?.total || 0),
      pendingReturns,
      overdueCompliance,
      activeTaxRules: activeRules,
      totalRules,
      recentCalculations: monthlyCalculations,
      upcomingDeadlines: [],
      taxRateSummary: [],
    };
  }

  async getComplianceReport(): Promise<TaxManagementComplianceResponseDto> {
    const today = new Date();
    const thirtyDaysFromNow = new Date(
      today.getTime() + 30 * 24 * 60 * 60 * 1000,
    );

    const [compliant, nonCompliant, upcoming, overdue] = await Promise.all([
      this.taxComplianceRepository.count({
        where: { status: ComplianceStatus.COMPLIANT },
      }),
      this.taxComplianceRepository.count({
        where: { status: ComplianceStatus.NON_COMPLIANT },
      }),
      this.taxComplianceRepository.count({
        where: {
          dueDate: Between(today, thirtyDaysFromNow),
          status: Not(ComplianceStatus.COMPLIANT),
        },
      }),
      this.taxComplianceRepository.count({
        where: {
          dueDate: LessThan(today),
          status: Not(ComplianceStatus.COMPLIANT),
        },
      }),
    ]);

    const complianceRate =
      compliant + nonCompliant > 0
        ? (compliant / (compliant + nonCompliant)) * 100
        : 0;

    return {
      overallStatus:
        compliant > nonCompliant
          ? TaxManagementComplianceStatus.COMPLIANT
          : TaxManagementComplianceStatus.NON_COMPLIANT,
      complianceScore: complianceRate,
      issues: [],
      filingStatus: [],
      paymentStatus: [],
      checkedAt: new Date().toISOString(),
    };
  }

  // Export and Download
  async exportTaxData(
    exportDto: ExportTaxDataDto,
    userId: string,
  ): Promise<ExportResponseDto> {
    const exportEntity = this.taxExportRepository.create({
      ...exportDto,
      userId,
      startedAt: new Date(),
    });

    const savedExport = await this.taxExportRepository.save(exportEntity);

    // Process export asynchronously
    this.processExportAsync(savedExport.id, exportDto);

    return {
      exportId: savedExport.id,
      status: savedExport.status,
      format: savedExport.format,
      dataType: savedExport.dataType,
      startedAt: savedExport.startedAt,
      completedAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      totalRecords: 0,
      fileSize: 0,
      downloadUrl: '',
    };
  }

  async getExportStatus(exportId: string): Promise<ExportResponseDto> {
    const exportEntity = await this.taxExportRepository.findOne({
      where: { id: exportId },
    });

    if (!exportEntity) {
      throw new NotFoundException('Export not found');
    }

    return {
      exportId: exportEntity.id,
      status: exportEntity.status,
      format: exportEntity.format,
      dataType: exportEntity.dataType,
      totalRecords: exportEntity.totalRecords,
      fileSize: exportEntity.fileSize,
      downloadUrl: exportEntity.downloadUrl,
      startedAt: exportEntity.createdAt,
      completedAt: exportEntity.completedAt,
      expiresAt: new Date(
        exportEntity.createdAt.getTime() + 7 * 24 * 60 * 60 * 1000,
      ), // 7 days from creation
      errorMessage: exportEntity.errorMessage,
    };
  }

  async downloadExport(
    exportId: string,
  ): Promise<{ filePath: string; fileName: string }> {
    const exportEntity = await this.taxExportRepository.findOne({
      where: { id: exportId, status: ExportStatus.COMPLETED },
    });

    if (!exportEntity) {
      throw new NotFoundException('Export not found or not completed');
    }

    if (exportEntity.isExpired()) {
      throw new BadRequestException('Export has expired');
    }

    return {
      filePath: exportEntity.filePath,
      fileName: `tax_export_${exportEntity.dataType}_${exportEntity.id}.${exportEntity.format}`,
    };
  }

  // Settings Management
  async getTaxSettings(): Promise<TaxSettingsResponseDto> {
    try {
      // Get settings from dynamic configuration system
      const dynamicSettings = await this.enhancedTaxService.getTaxSettings();

      // Convert enhanced settings to legacy format for backward compatibility
      return {
        id: null,
        defaultTaxType: TaxType.GST,
        companyGstNumber: null,
        companyPanNumber: null,
        defaultPlaceOfSupply: null,
        autoCalculateTaxes: dynamicSettings.autoCalculateTax,
        sendComplianceReminders:
          dynamicSettings.complianceSettings?.gstinValidationRequired || true,
        reminderDays: dynamicSettings.complianceSettings?.reminderDays || 7,
        additionalSettings: {
          defaultGSTRate: dynamicSettings.defaultGSTRate,
          defaultTCSRate: dynamicSettings.defaultTCSRate,
          defaultTDSRate: dynamicSettings.defaultTDSRate,
          autoCollectTax: dynamicSettings.autoCollectTax,
          taxExemptCategories: dynamicSettings.taxExemptCategories || [],
        },
        updatedAt: new Date(),
        updatedBy: null,
      };
    } catch (error) {
      this.logger.error(
        'Failed to get dynamic tax settings, falling back to database',
        error instanceof Error ? error.stack : undefined,
      );

      // Fallback to database settings
      const settings = await this.taxSettingsRepository.findOne({
        where: {},
        relations: ['updater'],
      });

      if (!settings) {
        // Return default settings
        return {
          id: null,
          defaultTaxType: TaxType.GST,
          companyGstNumber: null,
          companyPanNumber: null,
          defaultPlaceOfSupply: null,
          autoCalculateTaxes: true,
          sendComplianceReminders: true,
          reminderDays: 7,
          additionalSettings: {},
          updatedAt: null,
          updatedBy: null,
        };
      }

      return this.mapTaxSettingsToResponse(settings);
    }
  }

  async updateTaxSettings(
    settingsDto: TaxSettingsDto,
    userId: string,
  ): Promise<TaxSettingsResponseDto> {
    try {
      // Convert legacy settings to enhanced format
      const enhancedSettings = {
        defaultGSTRate: 18, // Default value
        defaultTCSRate: 1, // Default value
        defaultTDSRate: 2, // Default value
        autoCalculateTax: settingsDto.autoCalculateTaxes || true,
        autoCollectTax: settingsDto.additionalSettings?.autoCollectTax || false,
        taxExemptCategories:
          settingsDto.additionalSettings?.taxExemptCategories || [],
        complianceSettings: {
          gstinValidationRequired: settingsDto.sendComplianceReminders || true,
          panValidationRequired: true,
          automaticFilingEnabled: false,
          reminderDays: settingsDto.reminderDays || 7,
          penaltyCalculationEnabled: false,
        },
      };

      // Update through dynamic configuration system
      await this.enhancedTaxService.updateTaxSettings(
        enhancedSettings,
        undefined, // Global scope
        undefined, // No scope ID
        userId,
        'Updated via legacy tax GST settings API',
      );

      // Create audit trail for successful dynamic update
      await this.createAuditTrail(
        'TaxSettings',
        'global',
        'UPDATE',
        {},
        enhancedSettings,
        userId,
        'Updated via dynamic configuration system',
      );

      // Return updated settings in legacy format
      return await this.getTaxSettings();
    } catch (error) {
      this.logger.error(
        'Failed to update dynamic tax settings, falling back to database',
        error instanceof Error ? error.stack : undefined,
      );

      // Fallback to database update for backward compatibility
      let settings = await this.taxSettingsRepository.findOne({ where: {} });

      if (!settings) {
        settings = this.taxSettingsRepository.create({
          ...settingsDto,
          updatedBy: userId,
        });
      } else {
        Object.assign(settings, settingsDto, { updatedBy: userId });
      }

      const savedSettings = await this.taxSettingsRepository.save(settings);

      return this.mapTaxSettingsToResponse(savedSettings);
    }
  }

  // Utility Methods
  async getTaxStatuses(): Promise<string[]> {
    return Object.values(TaxStatus);
  }

  async getTaxTypes(): Promise<string[]> {
    return Object.values(TaxType);
  }

  async getTaxCategories(): Promise<string[]> {
    return Object.values(TaxCategory);
  }

  async getComplianceTypes(): Promise<string[]> {
    return Object.values(ComplianceType);
  }

  async validateTaxRule(
    ruleData: Partial<CreateTaxRuleDto>,
  ): Promise<{ isValid: boolean; errors: string[] }> {
    const errors = [];

    if (ruleData.rate < 0 || ruleData.rate > 100) {
      errors.push('Tax rate must be between 0 and 100');
    }

    if (
      ruleData.effectiveFrom &&
      ruleData.effectiveTo &&
      ruleData.effectiveFrom > ruleData.effectiveTo
    ) {
      errors.push('Effective from date cannot be after effective to date');
    }

    if (
      ruleData.minAmount &&
      ruleData.maxAmount &&
      ruleData.minAmount > ruleData.maxAmount
    ) {
      errors.push('Minimum amount cannot be greater than maximum amount');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  async getTaxRatesByType(
    taxType: TaxType,
  ): Promise<{ rate: number; ruleName: string; ruleId: string }[]> {
    const rules = await this.taxRuleRepository.find({
      where: {
        type: taxType,
        status: TaxStatus.ACTIVE,
      },
      select: ['id', 'name', 'rate'],
    });

    return rules.map((rule) => ({
      rate: Number(rule.rate),
      ruleName: rule.name,
      ruleId: rule.id,
    }));
  }

  // Private Helper Methods
  private async findApplicableTaxRules(
    taxType: TaxType,
    hsnSacCode?: string,
    stateCode?: string,
  ): Promise<TaxRuleEntity[]> {
    const queryBuilder = this.taxRuleRepository
      .createQueryBuilder('rule')
      .where('rule.type = :taxType', { taxType })
      .andWhere('rule.status = :status', { status: TaxStatus.ACTIVE })
      .andWhere('(rule.effectiveFrom IS NULL OR rule.effectiveFrom <= :now)', {
        now: new Date(),
      })
      .andWhere('(rule.effectiveTo IS NULL OR rule.effectiveTo >= :now)', {
        now: new Date(),
      });

    if (hsnSacCode) {
      queryBuilder.andWhere(
        '(rule.hsnSacCodes IS NULL OR :hsnSacCode = ANY(rule.hsnSacCodes))',
        { hsnSacCode },
      );
    }

    if (stateCode) {
      queryBuilder.andWhere(
        '(rule.applicableStates IS NULL OR :stateCode = ANY(rule.applicableStates))',
        { stateCode },
      );
    }

    return queryBuilder.getMany();
  }

  private calculateTaxAmount(baseAmount: number, rate: number): number {
    return Math.round(((baseAmount * rate) / 100) * 100) / 100;
  }

  private getCgstAmount(calculations: any[]): number {
    return calculations
      .filter((calc) => calc.taxType === TaxType.CGST)
      .reduce((sum, calc) => sum + calc.taxAmount, 0);
  }

  private getSgstAmount(calculations: any[]): number {
    return calculations
      .filter((calc) => calc.taxType === TaxType.SGST)
      .reduce((sum, calc) => sum + calc.taxAmount, 0);
  }

  private getIgstAmount(calculations: any[]): number {
    return calculations
      .filter((calc) => calc.taxType === TaxType.IGST)
      .reduce((sum, calc) => sum + calc.taxAmount, 0);
  }

  private getCessAmount(calculations: any[]): number {
    return calculations
      .filter((calc) => calc.taxType === TaxType.CESS)
      .reduce((sum, calc) => sum + calc.taxAmount, 0);
  }

  private processAnalyticsData(
    calculations: TaxCalculationEntity[],
    groupBy: string,
  ): any {
    // Group calculations by the specified period
    const grouped = calculations.reduce((acc, calc) => {
      const key = this.getGroupKey(calc.transactionDate, groupBy);
      if (!acc[key]) {
        acc[key] = {
          period: key,
          totalAmount: 0,
          taxAmount: 0,
          count: 0,
        };
      }
      acc[key].totalAmount += Number(calc.totalAmount);
      acc[key].taxAmount += Number(calc.taxAmount);
      acc[key].count += 1;
      return acc;
    }, {});

    return Object.values(grouped);
  }

  private getGroupKey(date: Date, groupBy: string): string {
    switch (groupBy) {
      case 'day':
        return date.toISOString().split('T')[0];
      case 'week': {
        const week = this.getWeekNumber(date);
        return `${date.getFullYear()}-W${week}`;
      }
      case 'month':
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      case 'year':
        return String(date.getFullYear());
      default:
        return date.toISOString().split('T')[0];
    }
  }

  private getWeekNumber(date: Date): number {
    const d = new Date(
      Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()),
    );
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  }

  private calculateAverageTaxRate(
    calculations: TaxCalculationEntity[],
  ): number {
    if (calculations.length === 0) return 0;
    const totalRate = calculations.reduce(
      (sum, calc) => sum + Number(calc.taxRate),
      0,
    );
    return totalRate / calculations.length;
  }

  private getTaxBreakdown(calculations: TaxCalculationEntity[]): any {
    const breakdown = {};
    calculations.forEach((calc) => {
      if (!breakdown[calc.taxType]) {
        breakdown[calc.taxType] = {
          count: 0,
          totalAmount: 0,
          taxAmount: 0,
        };
      }
      breakdown[calc.taxType].count += 1;
      breakdown[calc.taxType].totalAmount += Number(calc.totalAmount);
      breakdown[calc.taxType].taxAmount += Number(calc.taxAmount);
    });
    return breakdown;
  }

  private async processBulkTaxRuleOperation(
    operation: BulkOperationType,
    entityId: string,
    data: any,
    userId: string,
  ): Promise<void> {
    switch (operation) {
      case BulkOperationType.ACTIVATE:
        await this.activateTaxRule(entityId, userId);
        break;
      case BulkOperationType.DEACTIVATE:
        await this.deactivateTaxRule(entityId, userId);
        break;
      case BulkOperationType.DELETE:
        await this.deleteTaxRule(entityId, userId);
        break;
      case BulkOperationType.UPDATE:
        await this.updateTaxRule(entityId, data, userId);
        break;
      default:
        throw new Error(`Unsupported operation: ${operation}`);
    }
  }

  private async processBulkTaxCalculationOperation(
    operation: BulkOperationType,
    entityId: string,
    data: any,
    userId: string,
  ): Promise<void> {
    switch (operation) {
      case BulkOperationType.DELETE:
        await this.deleteTaxCalculation(entityId, userId);
        break;
      case BulkOperationType.UPDATE:
        await this.updateTaxCalculation(entityId, data, userId);
        break;
      default:
        throw new Error(`Unsupported operation: ${operation}`);
    }
  }

  private async processBulkTaxReturnOperation(
    operation: BulkOperationType,
    entityId: string,
    data: any,
    userId: string,
  ): Promise<void> {
    switch (operation) {
      case BulkOperationType.ACTIVATE:
        await this.updateTaxReturnStatus(
          entityId,
          ReturnStatus.APPROVED,
          userId,
        );
        break;
      case BulkOperationType.DEACTIVATE:
        await this.updateTaxReturnStatus(entityId, ReturnStatus.DRAFT, userId);
        break;
      case BulkOperationType.DELETE:
        await this.deleteTaxReturn(entityId, userId);
        break;
      case BulkOperationType.UPDATE:
        await this.updateTaxReturn(entityId, data, userId);
        break;
      case BulkOperationType.UPDATE_STATUS:
        await this.updateTaxReturnStatus(entityId, data.status, userId);
        break;
      case BulkOperationType.RECALCULATE:
        await this.updateTaxCalculation(entityId, data, userId);
        break;
      case BulkOperationType.EXPORT:
        await this.exportTaxData(
          { format: ExportFormat.JSON, dataType: 'returns' },
          userId,
        );
        break;
      default:
        throw new Error(`Unsupported operation: ${operation}`);
    }
  }

  private async processBulkTaxComplianceOperation(
    operation: BulkOperationType,
    entityId: string,
    data: any,
    userId: string,
  ): Promise<void> {
    switch (operation) {
      case BulkOperationType.ACTIVATE:
        await this.updateTaxCompliance(
          entityId,
          { status: ComplianceStatus.COMPLIANT },
          userId,
        );
        break;
      case BulkOperationType.DEACTIVATE:
        await this.updateTaxCompliance(
          entityId,
          { status: ComplianceStatus.NON_COMPLIANT },
          userId,
        );
        break;
      case BulkOperationType.DELETE:
        await this.deleteTaxCompliance(entityId, userId);
        break;
      case BulkOperationType.UPDATE:
        await this.updateTaxCompliance(entityId, data, userId);
        break;
      case BulkOperationType.UPDATE_STATUS:
        await this.updateTaxCompliance(
          entityId,
          { status: data.status as ComplianceStatus },
          userId,
        );
        break;
      case BulkOperationType.RECALCULATE:
        await this.updateTaxCompliance(entityId, data, userId);
        break;
      case BulkOperationType.EXPORT:
        await this.exportTaxData(
          { format: ExportFormat.JSON, dataType: 'compliance' },
          userId,
        );
        break;
      default:
        throw new Error(`Unsupported operation: ${operation}`);
    }
  }

  private async processExportAsync(
    exportId: string,
    exportDto: ExportTaxDataDto,
  ): Promise<void> {
    try {
      const exportEntity = await this.taxExportRepository.findOne({
        where: { id: exportId },
      });
      if (!exportEntity) return;

      exportEntity.status = ExportStatus.PROCESSING;
      await this.taxExportRepository.save(exportEntity);

      // Simulate export processing
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Generate mock file path and data
      const filePath = `/exports/tax_${exportDto.dataType}_${exportId}.${exportDto.format}`;
      const downloadUrl = `${process.env.BASE_URL}/api/tax/exports/${exportId}/download`;

      exportEntity.status = ExportStatus.COMPLETED;
      exportEntity.filePath = filePath;
      exportEntity.downloadUrl = downloadUrl;
      exportEntity.totalRecords = 100; // Mock data
      exportEntity.fileSize = 1024 * 50; // 50KB mock size
      exportEntity.completedAt = new Date();

      await this.taxExportRepository.save(exportEntity);
    } catch (error) {
      const exportEntity = await this.taxExportRepository.findOne({
        where: { id: exportId },
      });
      if (exportEntity) {
        exportEntity.status = ExportStatus.FAILED;
        exportEntity.errorMessage = error.message;
        await this.taxExportRepository.save(exportEntity);
      }
    }
  }

  private async createAuditTrail(
    entityType: string,
    entityId: string,
    action: string,
    oldValues: any,
    newValues: any,
    userId: string,
    reason?: string,
  ): Promise<void> {
    const auditTrail = this.taxAuditTrailRepository.create({
      entityType,
      entityId,
      action,
      oldValues,
      newValues,
      reason,
      userId,
    });

    await this.taxAuditTrailRepository.save(auditTrail);
  }

  // Mapping Methods
  private mapTaxRuleToResponse(rule: TaxRuleEntity): TaxRuleResponseDto {
    return {
      id: rule.id,
      name: rule.name,
      description: rule.description,
      type: rule.type,
      rate: Number(rule.rate),
      category: rule.category,
      status: rule.status,
      minAmount: rule.minAmount ? Number(rule.minAmount) : null,
      maxAmount: rule.maxAmount ? Number(rule.maxAmount) : null,
      effectiveFrom: rule.effectiveFrom,
      effectiveTo: rule.effectiveTo,
      hsnSacCodes: rule.hsnSacCodes,
      applicableStates: rule.applicableStates,
      metadata: rule.metadata,
      createdAt: rule.createdAt,
      updatedAt: rule.updatedAt,
      createdBy: rule.createdBy,
      updatedBy: rule.updatedBy,
    };
  }

  private mapTaxCalculationToResponse(
    calculation: TaxCalculationEntity,
  ): TaxCalculationResponseDto {
    return {
      id: calculation.id,
      referenceId: calculation.referenceId,
      referenceType: calculation.referenceType,
      baseAmount: Number(calculation.baseAmount),
      taxType: calculation.taxType,
      taxRate: Number(calculation.taxRate),
      taxAmount: Number(calculation.taxAmount),
      totalAmount: Number(calculation.totalAmount),
      status: calculation.status,
      hsnSacCode: calculation.hsnSacCode,
      stateCode: calculation.stateCode,
      customerGstNumber: calculation.customerGstNumber,
      supplierGstNumber: calculation.supplierGstNumber,
      placeOfSupply: calculation.placeOfSupply,
      transactionDate: calculation.transactionDate,
      calculationBreakdown: calculation.calculationBreakdown,
      createdAt: calculation.createdAt,
      updatedAt: calculation.updatedAt,
      createdBy: calculation.createdBy,
      // taxRuleId: calculation.taxRuleId,
    };
  }

  private mapTaxReturnToResponse(
    taxReturn: TaxReturnEntity,
  ): TaxReturnResponseDto {
    return {
      id: taxReturn.id,
      returnPeriod: taxReturn.returnPeriod,
      returnType: taxReturn.returnType,
      taxType: taxReturn.taxType,
      status: taxReturn.status,
      dueDate: taxReturn.dueDate,
      filedDate: taxReturn.filedDate,
      totalTaxLiability: Number(taxReturn.totalTaxLiability),
      totalTaxPaid: Number(taxReturn.totalTaxPaid),
      balanceAmount: Number(taxReturn.balanceAmount),
      acknowledgmentNumber: taxReturn.acknowledgmentNumber,
      returnData: taxReturn.returnData,
      supportingDocuments: taxReturn.supportingDocuments,
      notes: taxReturn.notes,
      createdAt: taxReturn.createdAt,
      updatedAt: taxReturn.updatedAt,
      createdBy: taxReturn.createdBy,
      // approvedBy: taxReturn.approvedBy,
      // approvedAt: taxReturn.approvedAt,
    };
  }

  private mapTaxComplianceToResponse(
    compliance: TaxComplianceEntity,
  ): TaxComplianceResponseDto {
    return {
      id: compliance.id,
      complianceType: compliance.complianceType,
      taxType: compliance.taxType,
      compliancePeriod: compliance.compliancePeriod,
      status: compliance.status,
      dueDate: compliance.dueDate,
      completionDate: compliance.completionDate,
      description: compliance.description,
      requiredDocuments: compliance.requiredDocuments,
      submittedDocuments: compliance.submittedDocuments,
      penaltyAmount: Number(compliance.penaltyAmount),
      notes: compliance.notes,
      metadata: compliance.metadata,
      createdAt: compliance.createdAt,
      updatedAt: compliance.updatedAt,
      createdBy: compliance.createdBy,
    };
  }

  private mapTaxSettingsToResponse(
    settings: TaxSettingsEntity,
  ): TaxSettingsResponseDto {
    return {
      id: settings.id,
      defaultTaxType: settings.defaultTaxType,
      companyGstNumber: settings.companyGstNumber,
      companyPanNumber: settings.companyPanNumber,
      defaultPlaceOfSupply: settings.defaultPlaceOfSupply,
      autoCalculateTaxes: settings.autoCalculateTaxes,
      sendComplianceReminders: settings.sendComplianceReminders,
      reminderDays: settings.reminderDays,
      additionalSettings: settings.additionalSettings,
      updatedAt: settings.updatedAt,
      updatedBy: settings.updatedBy,
    };
  }

  // Validation Methods
  async validateGstNumber(
    gstNumber: string,
  ): Promise<{ valid: boolean; message?: string }> {
    // GST number format: 15 characters (2 state code + 10 PAN + 1 entity number + 1 Z + 1 checksum)
    const gstRegex =
      /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

    if (!gstRegex.test(gstNumber)) {
      return {
        valid: false,
        message:
          'Invalid GST number format. GST number should be 15 characters long.',
      };
    }

    return {
      valid: true,
      message: 'Valid GST number format.',
    };
  }

  async validatePanNumber(
    panNumber: string,
  ): Promise<{ valid: boolean; message?: string }> {
    // PAN number format: 10 characters (5 letters + 4 digits + 1 letter)
    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;

    if (!panRegex.test(panNumber)) {
      return {
        valid: false,
        message: 'Invalid PAN number format. PAN should be 10 characters long.',
      };
    }

    return {
      valid: true,
      message: 'Valid PAN number format.',
    };
  }

  async getReturnStatuses(): Promise<any[]> {
    // Return mock data for tax return statuses
    return [
      { status: 'FILED', description: 'Return Filed' },
      { status: 'PENDING', description: 'Return Pending' },
      { status: 'OVERDUE', description: 'Return Overdue' },
    ];
  }

  async getGstSummaryReport(startDate: Date, endDate: Date): Promise<any> {
    // Return mock GST summary report
    return {
      period: { startDate, endDate },
      totalSales: 100000,
      totalPurchases: 80000,
      totalTaxCollected: 18000,
      totalTaxPaid: 14400,
      netTaxLiability: 3600,
    };
  }

  async getTcsTdsReport(startDate: Date, endDate: Date): Promise<any> {
    // Return mock TCS/TDS report
    return {
      period: { startDate, endDate },
      tcsCollected: 5000,
      tdsDeducted: 3000,
      netAmount: 2000,
    };
  }

  async getComplianceStatuses(): Promise<any[]> {
    // Return mock compliance statuses
    return [
      { status: 'COMPLIANT', description: 'All compliances up to date' },
      { status: 'PENDING', description: 'Some compliances pending' },
      { status: 'OVERDUE', description: 'Compliances overdue' },
    ];
  }

  async getUpcomingDeadlines(days?: number): Promise<any[]> {
    // Return mock upcoming deadlines
    const daysAhead = days || 30;
    const today = new Date();
    const futureDate = new Date(
      today.getTime() + daysAhead * 24 * 60 * 60 * 1000,
    );

    return [
      {
        type: 'GST_RETURN',
        description: 'GST Return Filing',
        dueDate: futureDate,
        status: 'PENDING',
      },
      {
        type: 'TDS_RETURN',
        description: 'TDS Return Filing',
        dueDate: futureDate,
        status: 'PENDING',
      },
    ];
  }
}
