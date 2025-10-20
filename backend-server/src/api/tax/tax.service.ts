import { UserEntity } from '@/auth/entities/user.entity';
import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EnhancedTaxService } from '../../common/services/enhanced-tax.service';
import { FinancialConfigIntegrationService } from '../../common/services/financial-config-integration.service';
import { BookingEntity } from '../../database/entities/booking.entity';
import {
  BulkTaxOperationDto,
  BulkTaxOperationType,
  CalculateGSTDto,
  ComplianceStatus,
  CreateTaxConfigDto,
  CreateTaxTransactionDto,
  GSTCalculationResponseDto,
  GSTCategory,
  TaxAnalyticsDto,
  TaxComplianceDto,
  TaxComplianceResponseDto,
  TaxConfigResponseDto,
  TaxExportDto,
  TaxReportDto,
  TaxReportResponseDto,
  TaxSettingsDto,
  TaxStatus,
  TaxTransactionResponseDto,
  TaxType,
  UpdateTaxConfigDto,
  UpdateTaxTransactionDto,
} from './dto/tax.dto';
import {
  TaxAuditTrailEntity,
  TaxComplianceEntity,
  TaxConfigurationEntity,
  TaxExportEntity,
  TaxReportEntity,
  TaxSettingsEntity,
  TaxTransactionEntity,
} from './entities/tax.entity';

@Injectable()
export class TaxService {
  private readonly logger = new Logger(TaxService.name);

  constructor(
    @InjectRepository(TaxConfigurationEntity)
    private readonly taxConfigRepository: Repository<TaxConfigurationEntity>,
    @InjectRepository(TaxTransactionEntity)
    private readonly taxTransactionRepository: Repository<TaxTransactionEntity>,
    @InjectRepository(TaxComplianceEntity)
    private readonly taxComplianceRepository: Repository<TaxComplianceEntity>,
    @InjectRepository(TaxAuditTrailEntity)
    private readonly taxAuditRepository: Repository<TaxAuditTrailEntity>,
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

  // Tax Configuration Management
  async createTaxConfig(
    createDto: CreateTaxConfigDto,
    userId?: string,
  ): Promise<TaxConfigResponseDto> {
    try {
      const taxConfig = this.taxConfigRepository.create({
        ...createDto,
        createdBy: userId,
        updatedBy: userId,
      });

      const savedConfig = await this.taxConfigRepository.save(taxConfig);

      await this.createAuditTrail({
        action: 'CREATE_TAX_CONFIG',
        description: `Created tax configuration: ${savedConfig.name}`,
        newValues: savedConfig,
        createdBy: userId,
      });

      return this.mapTaxConfigToResponse(savedConfig);
    } catch (error) {
      this.logger.error('Error creating tax configuration:', error);
      throw new BadRequestException('Failed to create tax configuration');
    }
  }

  async updateTaxConfig(
    id: string,
    updateDto: UpdateTaxConfigDto,
    userId?: string,
  ): Promise<TaxConfigResponseDto> {
    const taxConfig = await this.taxConfigRepository.findOne({ where: { id } });
    if (!taxConfig) {
      throw new NotFoundException('Tax configuration not found');
    }

    const previousValues = { ...taxConfig };
    Object.assign(taxConfig, updateDto, { updatedBy: userId });

    const updatedConfig = await this.taxConfigRepository.save(taxConfig);

    await this.createAuditTrail({
      action: 'UPDATE_TAX_CONFIG',
      description: `Updated tax configuration: ${updatedConfig.name}`,
      previousValues,
      newValues: updatedConfig,
      createdBy: userId,
    });

    return this.mapTaxConfigToResponse(updatedConfig);
  }

  async getTaxConfig(id: string): Promise<TaxConfigResponseDto> {
    const taxConfig = await this.taxConfigRepository.findOne({ where: { id } });
    if (!taxConfig) {
      throw new NotFoundException('Tax configuration not found');
    }
    return this.mapTaxConfigToResponse(taxConfig);
  }

  async getAllTaxConfigs(filters?: any): Promise<TaxConfigResponseDto[]> {
    const queryBuilder = this.taxConfigRepository.createQueryBuilder('config');

    if (filters?.taxType) {
      queryBuilder.andWhere('config.taxType = :taxType', {
        taxType: filters.taxType,
      });
    }

    if (filters?.isActive !== undefined) {
      queryBuilder.andWhere('config.isActive = :isActive', {
        isActive: filters.isActive,
      });
    }

    if (filters?.stateCode) {
      queryBuilder.andWhere('config.stateCode = :stateCode', {
        stateCode: filters.stateCode,
      });
    }

    const configs = await queryBuilder
      .orderBy('config.createdAt', 'DESC')
      .getMany();
    return configs.map((config) => this.mapTaxConfigToResponse(config));
  }

  async deleteTaxConfig(id: string, userId?: string): Promise<void> {
    const taxConfig = await this.taxConfigRepository.findOne({ where: { id } });
    if (!taxConfig) {
      throw new NotFoundException('Tax configuration not found');
    }

    await this.taxConfigRepository.remove(taxConfig);

    await this.createAuditTrail({
      action: 'DELETE_TAX_CONFIG',
      description: `Deleted tax configuration: ${taxConfig.name}`,
      previousValues: taxConfig,
      createdBy: userId,
    });
  }

  // GST Calculation
  async calculateGST(
    calculateDto: CalculateGSTDto,
  ): Promise<GSTCalculationResponseDto> {
    try {
      const { baseAmount, stateCode, customerStateCode, hsnCode, gstCategory } =
        calculateDto;

      // Determine if it's inter-state or intra-state transaction
      const isInterState =
        stateCode && customerStateCode && stateCode !== customerStateCode;

      // Get applicable GST rates
      const gstRates = await this.getApplicableGSTRates(hsnCode, gstCategory);

      let cgstAmount = 0;
      let sgstAmount = 0;
      let igstAmount = 0;
      let utgstAmount = 0;
      let cessAmount = 0;

      let cgstRate = 0;
      let sgstRate = 0;
      let igstRate = 0;
      let utgstRate = 0;
      let cessRate = 0;

      if (isInterState) {
        // Inter-state: IGST
        igstRate = gstRates.totalRate;
        igstAmount = (baseAmount * igstRate) / 100;
      } else {
        // Intra-state: CGST + SGST/UTGST
        cgstRate = gstRates.totalRate / 2;
        sgstRate = gstRates.totalRate / 2;

        cgstAmount = (baseAmount * cgstRate) / 100;
        sgstAmount = (baseAmount * sgstRate) / 100;

        // Check if it's a Union Territory
        if (this.isUnionTerritory(stateCode)) {
          utgstRate = sgstRate;
          utgstAmount = sgstAmount;
          sgstRate = 0;
          sgstAmount = 0;
        }
      }

      // Calculate CESS if applicable
      if (gstRates.cessRate > 0) {
        cessRate = gstRates.cessRate;
        cessAmount = (baseAmount * cessRate) / 100;
      }

      const totalTaxAmount =
        cgstAmount + sgstAmount + igstAmount + utgstAmount + cessAmount;
      const totalAmount = baseAmount + totalTaxAmount;

      return {
        baseAmount,
        cgstAmount: this.roundToDecimal(cgstAmount),
        sgstAmount: this.roundToDecimal(sgstAmount),
        igstAmount: this.roundToDecimal(igstAmount),
        utgstAmount: this.roundToDecimal(utgstAmount),
        cessAmount: this.roundToDecimal(cessAmount),
        totalTaxAmount: this.roundToDecimal(totalTaxAmount),
        totalAmount: this.roundToDecimal(totalAmount),
        cgstRate,
        sgstRate,
        igstRate,
        utgstRate,
        cessRate,
        isInterState,
        hsnCode,
        currency: calculateDto.currency || 'INR',
        breakdown: {
          gstCategory,
          applicableRates: gstRates,
          calculationMethod: isInterState ? 'IGST' : 'CGST+SGST',
        },
      };
    } catch (error) {
      this.logger.error('Error calculating GST:', error);
      throw new BadRequestException('Failed to calculate GST');
    }
  }

  // Tax Transaction Management
  async createTaxTransaction(
    createDto: CreateTaxTransactionDto,
    userId?: string,
  ): Promise<TaxTransactionResponseDto> {
    try {
      // Verify partner exists
      const partner = await this.userRepository.findOne({
        where: { id: createDto.partnerId },
      });
      if (!partner) {
        throw new NotFoundException('Partner not found');
      }

      // Verify booking exists if provided
      if (createDto.bookingId) {
        const booking = await this.bookingRepository.findOne({
          where: { id: createDto.bookingId },
        });
        if (!booking) {
          throw new NotFoundException('Booking not found');
        }
      }

      const taxTransaction = this.taxTransactionRepository.create({
        ...createDto,
        createdBy: userId,
        updatedBy: userId,
      });

      const savedTransaction =
        await this.taxTransactionRepository.save(taxTransaction);

      await this.createAuditTrail({
        taxTransactionId: savedTransaction.id,
        action: 'CREATE_TAX_TRANSACTION',
        description: `Created tax transaction: ${savedTransaction.transactionReference}`,
        newValues: savedTransaction,
        createdBy: userId,
      });

      return this.mapTaxTransactionToResponse(savedTransaction);
    } catch (error) {
      this.logger.error('Error creating tax transaction:', error);
      throw new BadRequestException('Failed to create tax transaction');
    }
  }

  async updateTaxTransaction(
    id: string,
    updateDto: UpdateTaxTransactionDto,
    userId?: string,
  ): Promise<TaxTransactionResponseDto> {
    const transaction = await this.taxTransactionRepository.findOne({
      where: { id },
      relations: ['partner', 'booking'],
    });

    if (!transaction) {
      throw new NotFoundException('Tax transaction not found');
    }

    const previousValues = { ...transaction };
    Object.assign(transaction, updateDto, { updatedBy: userId });

    const updatedTransaction =
      await this.taxTransactionRepository.save(transaction);

    await this.createAuditTrail({
      taxTransactionId: updatedTransaction.id,
      action: 'UPDATE_TAX_TRANSACTION',
      description: `Updated tax transaction: ${updatedTransaction.transactionReference}`,
      previousValues,
      newValues: updatedTransaction,
      createdBy: userId,
    });

    return this.mapTaxTransactionToResponse(updatedTransaction);
  }

  async getTaxTransaction(id: string): Promise<TaxTransactionResponseDto> {
    const transaction = await this.taxTransactionRepository.findOne({
      where: { id },
      relations: ['partner', 'booking', 'taxConfiguration'],
    });

    if (!transaction) {
      throw new NotFoundException('Tax transaction not found');
    }

    return this.mapTaxTransactionToResponse(transaction);
  }

  async getAllTaxTransactions(
    filters?: any,
  ): Promise<TaxTransactionResponseDto[]> {
    const queryBuilder = this.taxTransactionRepository
      .createQueryBuilder('transaction')
      .leftJoinAndSelect('transaction.partner', 'partner')
      .leftJoinAndSelect('transaction.booking', 'booking')
      .leftJoinAndSelect('transaction.taxConfiguration', 'config');

    if (filters?.partnerId) {
      queryBuilder.andWhere('transaction.partnerId = :partnerId', {
        partnerId: filters.partnerId,
      });
    }

    if (filters?.taxType) {
      queryBuilder.andWhere('transaction.taxType = :taxType', {
        taxType: filters.taxType,
      });
    }

    if (filters?.status) {
      queryBuilder.andWhere('transaction.status = :status', {
        status: filters.status,
      });
    }

    if (filters?.dateFrom && filters?.dateTo) {
      queryBuilder.andWhere(
        'transaction.createdAt BETWEEN :dateFrom AND :dateTo',
        {
          dateFrom: filters.dateFrom,
          dateTo: filters.dateTo,
        },
      );
    }

    const transactions = await queryBuilder
      .orderBy('transaction.createdAt', 'DESC')
      .getMany();
    return transactions.map((transaction) =>
      this.mapTaxTransactionToResponse(transaction),
    );
  }

  async updateTaxTransactionStatus(
    id: string,
    status: TaxStatus,
    userId?: string,
  ): Promise<TaxTransactionResponseDto> {
    const transaction = await this.taxTransactionRepository.findOne({
      where: { id },
    });
    if (!transaction) {
      throw new NotFoundException('Tax transaction not found');
    }

    const previousStatus = transaction.status;
    transaction.status = status;
    transaction.updatedBy = userId;

    if (status === TaxStatus.PAID) {
      transaction.paymentDate = new Date();
    }

    const updatedTransaction =
      await this.taxTransactionRepository.save(transaction);

    await this.createAuditTrail({
      taxTransactionId: updatedTransaction.id,
      action: 'UPDATE_TAX_STATUS',
      description: `Updated tax status from ${previousStatus} to ${status}`,
      previousValues: { status: previousStatus },
      newValues: { status },
      createdBy: userId,
    });

    return this.mapTaxTransactionToResponse(updatedTransaction);
  }

  // Tax Compliance Management
  async createTaxCompliance(
    complianceDto: TaxComplianceDto,
    userId?: string,
  ): Promise<TaxComplianceResponseDto> {
    try {
      const compliance = this.taxComplianceRepository.create({
        ...complianceDto,
        createdBy: userId,
        updatedBy: userId,
      });

      const savedCompliance =
        await this.taxComplianceRepository.save(compliance);

      await this.createAuditTrail({
        taxComplianceId: savedCompliance.id,
        action: 'CREATE_TAX_COMPLIANCE',
        description: `Created tax compliance: ${savedCompliance.complianceReference}`,
        newValues: savedCompliance,
        createdBy: userId,
      });

      return this.mapTaxComplianceToResponse(savedCompliance);
    } catch (error) {
      this.logger.error('Error creating tax compliance:', error);
      throw new BadRequestException('Failed to create tax compliance');
    }
  }

  async updateTaxComplianceStatus(
    id: string,
    status: ComplianceStatus,
    userId?: string,
  ): Promise<TaxComplianceResponseDto> {
    const compliance = await this.taxComplianceRepository.findOne({
      where: { id },
    });
    if (!compliance) {
      throw new NotFoundException('Tax compliance not found');
    }

    const previousStatus = compliance.status;
    compliance.status = status;
    compliance.updatedBy = userId;

    if (
      status === ComplianceStatus.COMPLETED ||
      status === ComplianceStatus.FILED
    ) {
      compliance.completedDate = new Date();
    }

    const updatedCompliance =
      await this.taxComplianceRepository.save(compliance);

    await this.createAuditTrail({
      taxComplianceId: updatedCompliance.id,
      action: 'UPDATE_COMPLIANCE_STATUS',
      description: `Updated compliance status from ${previousStatus} to ${status}`,
      previousValues: { status: previousStatus },
      newValues: { status },
      createdBy: userId,
    });

    return this.mapTaxComplianceToResponse(updatedCompliance);
  }

  async getAllTaxCompliance(
    filters?: any,
  ): Promise<TaxComplianceResponseDto[]> {
    const queryBuilder =
      this.taxComplianceRepository.createQueryBuilder('compliance');

    if (filters?.taxType) {
      queryBuilder.andWhere('compliance.taxType = :taxType', {
        taxType: filters.taxType,
      });
    }

    if (filters?.status) {
      queryBuilder.andWhere('compliance.status = :status', {
        status: filters.status,
      });
    }

    if (filters?.period) {
      queryBuilder.andWhere('compliance.period = :period', {
        period: filters.period,
      });
    }

    const compliances = await queryBuilder
      .orderBy('compliance.dueDate', 'ASC')
      .getMany();
    return compliances.map((compliance) =>
      this.mapTaxComplianceToResponse(compliance),
    );
  }

  // Bulk Operations
  async performBulkTaxOperation(
    operationDto: BulkTaxOperationDto,
    userId?: string,
  ): Promise<{ success: number; failed: number; errors: string[] }> {
    const {
      operation,
      transactionIds,
      reason: _reason,
      data: _data,
    } = operationDto;
    const results = { success: 0, failed: 0, errors: [] };

    for (const transactionId of transactionIds) {
      try {
        switch (operation) {
          case BulkTaxOperationType.CALCULATE_TAX:
            await this.recalculateTaxTransaction(transactionId, userId);
            break;
          case BulkTaxOperationType.COLLECT_TAX:
            await this.updateTaxTransactionStatus(
              transactionId,
              TaxStatus.COLLECTED,
              userId,
            );
            break;
          case BulkTaxOperationType.PAY_TAX:
            await this.updateTaxTransactionStatus(
              transactionId,
              TaxStatus.PAID,
              userId,
            );
            break;
          case BulkTaxOperationType.CANCEL_TAX:
            await this.updateTaxTransactionStatus(
              transactionId,
              TaxStatus.CANCELLED,
              userId,
            );
            break;
          case BulkTaxOperationType.UPDATE_STATUS:
            if (_data?.status) {
              await this.updateTaxTransactionStatus(
                transactionId,
                _data.status,
                userId,
              );
            }
            break;
          default:
            throw new BadRequestException(
              `Unsupported operation: ${operation}`,
            );
        }
        results.success++;
      } catch (error) {
        results.failed++;
        results.errors.push(`Transaction ${transactionId}: ${error.message}`);
      }
    }

    await this.createAuditTrail({
      action: 'BULK_TAX_OPERATION',
      description: `Performed bulk operation: ${operation} on ${transactionIds.length} transactions`,
      newValues: {
        operation,
        transactionIds,
        reason: _reason,
        data: _data,
        results,
      },
      createdBy: userId,
    });

    return results;
  }

  // Analytics and Reporting
  async getTaxAnalytics(filters?: any): Promise<TaxAnalyticsDto> {
    const queryBuilder =
      this.taxTransactionRepository.createQueryBuilder('transaction');

    if (filters?.dateFrom && filters?.dateTo) {
      queryBuilder.andWhere(
        'transaction.createdAt BETWEEN :dateFrom AND :dateTo',
        {
          dateFrom: filters.dateFrom,
          dateTo: filters.dateTo,
        },
      );
    }

    if (filters?.partnerId) {
      queryBuilder.andWhere('transaction.partnerId = :partnerId', {
        partnerId: filters.partnerId,
      });
    }

    const transactions = await queryBuilder.getMany();

    const totalTaxCollected = transactions
      .filter(
        (t) => t.status === TaxStatus.COLLECTED || t.status === TaxStatus.PAID,
      )
      .reduce((sum, t) => sum + Number(t.taxAmount), 0);

    const totalTaxPaid = transactions
      .filter((t) => t.status === TaxStatus.PAID)
      .reduce((sum, t) => sum + Number(t.taxAmount), 0);

    const totalTaxPending = transactions
      .filter(
        (t) =>
          t.status === TaxStatus.PENDING || t.status === TaxStatus.CALCULATED,
      )
      .reduce((sum, t) => sum + Number(t.taxAmount), 0);

    const gstCollected = transactions
      .filter(
        (t) =>
          [TaxType.GST, TaxType.CGST, TaxType.SGST, TaxType.IGST].includes(
            t.taxType,
          ) &&
          (t.status === TaxStatus.COLLECTED || t.status === TaxStatus.PAID),
      )
      .reduce((sum, t) => sum + Number(t.taxAmount), 0);

    const tcsCollected = transactions
      .filter(
        (t) =>
          t.taxType === TaxType.TCS &&
          (t.status === TaxStatus.COLLECTED || t.status === TaxStatus.PAID),
      )
      .reduce((sum, t) => sum + Number(t.taxAmount), 0);

    const tdsDeducted = transactions
      .filter(
        (t) =>
          t.taxType === TaxType.TDS &&
          (t.status === TaxStatus.COLLECTED || t.status === TaxStatus.PAID),
      )
      .reduce((sum, t) => sum + Number(t.taxAmount), 0);

    // Collection by type
    const collectionByType = Object.values(TaxType).map((taxType) => {
      const typeTransactions = transactions.filter(
        (t) =>
          t.taxType === taxType &&
          (t.status === TaxStatus.COLLECTED || t.status === TaxStatus.PAID),
      );
      return {
        taxType,
        amount: typeTransactions.reduce(
          (sum, t) => sum + Number(t.taxAmount),
          0,
        ),
        count: typeTransactions.length,
      };
    });

    // Monthly trends (last 12 months)
    const monthlyTrends = await this.getMonthlyTaxTrends(filters);

    // Compliance distribution
    const complianceDistribution =
      await this.getComplianceDistribution(filters);

    // Top partners
    const topPartners = await this.getTopTaxPayingPartners(filters);

    return {
      totalTaxCollected,
      totalTaxPaid,
      totalTaxPending,
      totalTransactions: transactions.length,
      gstCollected,
      tcsCollected,
      tdsDeducted,
      collectionByType,
      monthlyTrends,
      complianceDistribution,
      topPartners,
    };
  }

  // Export and Download
  async exportTaxData(
    exportDto: TaxExportDto,
    userId?: string,
  ): Promise<string> {
    try {
      const exportRecord = this.taxExportRepository.create({
        exportType: exportDto.exportType,
        format: exportDto.format,
        dateFrom: exportDto.dateFrom,
        dateTo: exportDto.dateTo,
        filters: exportDto.filters,
        includeArchived: exportDto.includeArchived,
        createdBy: userId,
      });

      const savedExport = await this.taxExportRepository.save(exportRecord);

      // TODO: Implement actual export logic based on format
      // This would typically involve generating CSV/Excel/PDF files

      return savedExport.id;
    } catch (error) {
      this.logger.error('Error exporting tax data:', error);
      throw new BadRequestException('Failed to export tax data');
    }
  }

  // Report Generation
  async generateTaxReport(
    reportDto: TaxReportDto,
    userId?: string,
  ): Promise<TaxReportResponseDto> {
    try {
      const report = this.taxReportRepository.create({
        ...reportDto,
        createdBy: userId,
      });

      const savedReport = await this.taxReportRepository.save(report);

      // TODO: Implement actual report generation logic
      // This would typically involve generating reports based on reportType

      return this.mapTaxReportToResponse(savedReport);
    } catch (error) {
      this.logger.error('Error generating tax report:', error);
      throw new BadRequestException('Failed to generate tax report');
    }
  }

  async getAllTaxReports(filters?: any): Promise<TaxReportResponseDto[]> {
    const queryBuilder = this.taxReportRepository.createQueryBuilder('report');

    if (filters?.reportType) {
      queryBuilder.andWhere('report.reportType = :reportType', {
        reportType: filters.reportType,
      });
    }

    if (filters?.status) {
      queryBuilder.andWhere('report.status = :status', {
        status: filters.status,
      });
    }

    const reports = await queryBuilder
      .orderBy('report.createdAt', 'DESC')
      .getMany();
    return reports.map((report) => this.mapTaxReportToResponse(report));
  }

  // Settings Management
  async getTaxSettings(): Promise<TaxSettingsDto> {
    try {
      // Get settings from dynamic configuration system
      const dynamicSettings = await this.enhancedTaxService.getTaxSettings();

      // Convert enhanced settings to legacy format for backward compatibility
      return {
        defaultGSTRate: dynamicSettings.defaultGSTRate,
        defaultTCSRate: dynamicSettings.defaultTCSRate,
        defaultTDSRate: dynamicSettings.defaultTDSRate,
        autoCalculateTax: dynamicSettings.autoCalculateTax,
        autoCollectTax: dynamicSettings.autoCollectTax,
        paymentReminderDays:
          dynamicSettings.complianceSettings?.reminderDays || 7,
        complianceReminderDays:
          dynamicSettings.complianceSettings?.reminderDays || 15,
        enableNotifications: true, // Default value
        calculationPrecision: 2, // Default value
      };
    } catch (error) {
      this.logger.error(
        'Failed to get dynamic tax settings, falling back to database',
        error.stack,
      );

      // Fallback to database settings
      const settings = await this.taxSettingsRepository.findOne({ where: {} });
      if (!settings) {
        // Return default settings
        return {
          defaultGSTRate: 18,
          defaultTCSRate: 1,
          defaultTDSRate: 2,
          autoCalculateTax: true,
          autoCollectTax: false,
          paymentReminderDays: 7,
          complianceReminderDays: 15,
          enableNotifications: true,
          calculationPrecision: 2,
        };
      }
      return this.mapTaxSettingsToDto(settings);
    }
  }

  async updateTaxSettings(
    settingsDto: TaxSettingsDto,
    userId?: string,
  ): Promise<TaxSettingsDto> {
    try {
      // Convert legacy settings to enhanced format
      const enhancedSettings = {
        defaultGSTRate: settingsDto.defaultGSTRate,
        defaultTCSRate: settingsDto.defaultTCSRate,
        defaultTDSRate: settingsDto.defaultTDSRate,
        autoCalculateTax: settingsDto.autoCalculateTax,
        autoCollectTax: settingsDto.autoCollectTax,
        complianceSettings: {
          gstinValidationRequired: true,
          panValidationRequired: true,
          automaticFilingEnabled: false,
          reminderDays: settingsDto.paymentReminderDays || 7,
          penaltyCalculationEnabled: false,
        },
      };

      // Update through dynamic configuration system
      await this.enhancedTaxService.updateTaxSettings(
        enhancedSettings,
        undefined, // Global scope
        undefined, // No scope ID
        userId,
        'Updated via legacy tax settings API',
      );

      // Also update database for backward compatibility
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

      await this.createAuditTrail({
        action: 'UPDATE_TAX_SETTINGS',
        description: 'Updated tax settings via dynamic configuration',
        newValues: savedSettings,
        createdBy: userId,
      });

      return this.mapTaxSettingsToDto(savedSettings);
    } catch (error) {
      this.logger.error(
        'Failed to update dynamic tax settings, falling back to database only',
        error.stack,
      );

      // Fallback to database-only update
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

      await this.createAuditTrail({
        action: 'UPDATE_TAX_SETTINGS',
        description: 'Updated tax settings (database fallback)',
        newValues: savedSettings,
        createdBy: userId,
      });

      return this.mapTaxSettingsToDto(savedSettings);
    }
  }

  // Utility Methods
  async validateGSTIN(
    gstin: string,
  ): Promise<{ isValid: boolean; details?: any }> {
    // Basic GSTIN validation
    const gstinRegex =
      /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

    if (!gstinRegex.test(gstin)) {
      return { isValid: false };
    }

    // TODO: Implement actual GSTIN validation with government API
    return {
      isValid: true,
      details: {
        stateCode: gstin.substring(0, 2),
        entityCode: gstin.substring(2, 7),
        registrationNumber: gstin.substring(7, 11),
        entityType: gstin.substring(11, 12),
        checkDigit: gstin.substring(12, 13),
        defaultFlag: gstin.substring(13, 14),
        checksum: gstin.substring(14, 15),
      },
    };
  }

  async validatePAN(pan: string): Promise<{ isValid: boolean; details?: any }> {
    // Basic PAN validation
    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;

    if (!panRegex.test(pan)) {
      return { isValid: false };
    }

    // TODO: Implement actual PAN validation with government API
    return {
      isValid: true,
      details: {
        entityType: pan.substring(3, 4),
        lastNameInitial: pan.substring(4, 5),
      },
    };
  }

  // Helper Methods
  private async getApplicableGSTRates(
    hsnCode?: string,
    gstCategory?: GSTCategory,
  ): Promise<{ totalRate: number; cessRate: number }> {
    // Default GST rates - in real implementation, this would come from tax configuration
    const defaultRates = {
      [GSTCategory.REGULAR]: { totalRate: 18, cessRate: 0 },
      [GSTCategory.COMPOSITION]: { totalRate: 1, cessRate: 0 },
      [GSTCategory.EXEMPT]: { totalRate: 0, cessRate: 0 },
      [GSTCategory.NIL_RATED]: { totalRate: 0, cessRate: 0 },
      [GSTCategory.ZERO_RATED]: { totalRate: 0, cessRate: 0 },
    };

    if (gstCategory && defaultRates[gstCategory]) {
      return defaultRates[gstCategory];
    }

    // TODO: Implement HSN-based rate lookup
    return { totalRate: 18, cessRate: 0 };
  }

  private isUnionTerritory(stateCode: string): boolean {
    const unionTerritories = ['07', '25', '26', '31', '34', '35', '37', '38']; // UT state codes
    return unionTerritories.includes(stateCode);
  }

  private roundToDecimal(amount: number, precision: number = 2): number {
    return (
      Math.round(amount * Math.pow(10, precision)) / Math.pow(10, precision)
    );
  }

  private async recalculateTaxTransaction(
    transactionId: string,
    userId?: string,
  ): Promise<void> {
    const transaction = await this.taxTransactionRepository.findOne({
      where: { id: transactionId },
    });
    if (!transaction) {
      throw new NotFoundException('Tax transaction not found');
    }

    // Recalculate tax amount based on current rates
    const gstCalculation = await this.calculateGST({
      baseAmount: transaction.baseAmount,
      hsnCode: transaction.hsnCode,
    });

    transaction.taxAmount = gstCalculation.totalTaxAmount;
    transaction.updatedBy = userId;

    await this.taxTransactionRepository.save(transaction);
  }

  private async getMonthlyTaxTrends(
    _filters?: any,
  ): Promise<
    Array<{ month: string; collected: number; paid: number; pending: number }>
  > {
    // TODO: Implement monthly trends calculation
    return [];
  }

  private async getComplianceDistribution(
    _filters?: any,
  ): Promise<
    Array<{ status: ComplianceStatus; count: number; percentage: number }>
  > {
    const compliances = await this.taxComplianceRepository.find();
    const total = compliances.length;

    const distribution = Object.values(ComplianceStatus).map((status) => {
      const count = compliances.filter((c) => c.status === status).length;
      return {
        status,
        count,
        percentage: total > 0 ? (count / total) * 100 : 0,
      };
    });

    return distribution;
  }

  private async getTopTaxPayingPartners(_filters?: any): Promise<
    Array<{
      partnerId: string;
      partnerName: string;
      totalTax: number;
      transactionCount: number;
    }>
  > {
    // TODO: Implement top partners calculation
    return [];
  }

  private async createAuditTrail(
    auditData: Partial<TaxAuditTrailEntity>,
  ): Promise<void> {
    try {
      const audit = this.taxAuditRepository.create(auditData);
      await this.taxAuditRepository.save(audit);
    } catch (error) {
      this.logger.error('Error creating audit trail:', error);
    }
  }

  // Mapping Methods
  private mapTaxConfigToResponse(
    config: TaxConfigurationEntity,
  ): TaxConfigResponseDto {
    return {
      id: config.id,
      taxType: config.taxType,
      name: config.name,
      description: config.description,
      rate: Number(config.rate),
      hsnCode: config.hsnCode,
      hsnCategory: config.hsnCategory,
      stateCode: config.stateCode,
      thresholdAmount: config.thresholdAmount
        ? Number(config.thresholdAmount)
        : undefined,
      maxThresholdAmount: config.maxThresholdAmount
        ? Number(config.maxThresholdAmount)
        : undefined,
      effectiveFrom: config.effectiveFrom,
      effectiveTo: config.effectiveTo,
      isActive: config.isActive,
      metadata: config.metadata,
      createdAt: config.createdAt,
      updatedAt: config.updatedAt,
      createdBy: config.createdBy,
      updatedBy: config.updatedBy,
    };
  }

  private mapTaxTransactionToResponse(
    transaction: TaxTransactionEntity,
  ): TaxTransactionResponseDto {
    return {
      id: transaction.id,
      transactionReference: transaction.transactionReference,
      partner: transaction.partner
        ? {
            id: transaction.partner.id,
            name: transaction.partner.email, // Using email as name since name property doesn't exist
            email: transaction.partner.email,
            gstin: 'N/A', // gstin property doesn't exist on UserEntity
          }
        : {
            id: transaction.partnerId,
            name: 'Unknown Partner',
            email: '',
          },
      booking: transaction.booking
        ? {
            id: transaction.booking.id,
            bookingReference: transaction.booking.bookingReference,
          }
        : undefined,
      taxType: transaction.taxType,
      status: transaction.status,
      baseAmount: Number(transaction.baseAmount),
      taxAmount: Number(transaction.taxAmount),
      taxRate: Number(transaction.taxRate),
      currency: transaction.currency,
      hsnCode: transaction.hsnCode,
      description: transaction.description,
      paymentReference: transaction.paymentReference,
      paymentDate: transaction.paymentDate,
      dueDate: transaction.dueDate,
      notes: transaction.notes,
      metadata: transaction.metadata,
      createdAt: transaction.createdAt,
      updatedAt: transaction.updatedAt,
      createdBy: transaction.createdBy,
      updatedBy: transaction.updatedBy,
    };
  }

  private mapTaxComplianceToResponse(
    compliance: TaxComplianceEntity,
  ): TaxComplianceResponseDto {
    return {
      id: compliance.id,
      complianceReference: compliance.complianceReference,
      taxType: compliance.taxType,
      status: compliance.status,
      period: compliance.period,
      periodStart: compliance.periodStart,
      periodEnd: compliance.periodEnd,
      dueDate: compliance.dueDate,
      completedDate: compliance.completedDate,
      filingReference: compliance.filingReference,
      description: compliance.description,
      requiredDocuments: compliance.requiredDocuments,
      notes: compliance.notes,
      metadata: compliance.metadata,
      createdAt: compliance.createdAt,
      updatedAt: compliance.updatedAt,
      createdBy: compliance.createdBy,
      updatedBy: compliance.updatedBy,
    };
  }

  private mapTaxReportToResponse(
    report: TaxReportEntity,
  ): TaxReportResponseDto {
    return {
      id: report.id,
      reportName: report.reportName,
      reportType: report.reportType,
      status: report.status,
      format: report.format,
      dateFrom: report.dateFrom,
      dateTo: report.dateTo,
      parameters: report.parameters,
      filePath: report.filePath,
      downloadUrl: report.downloadUrl,
      createdAt: report.createdAt,
      completedAt: report.completedAt,
      createdBy: report.createdBy,
    };
  }

  private mapTaxSettingsToDto(settings: TaxSettingsEntity): TaxSettingsDto {
    return {
      defaultGSTRate: settings.defaultGSTRate
        ? Number(settings.defaultGSTRate)
        : undefined,
      defaultTCSRate: settings.defaultTCSRate
        ? Number(settings.defaultTCSRate)
        : undefined,
      defaultTDSRate: settings.defaultTDSRate
        ? Number(settings.defaultTDSRate)
        : undefined,
      autoCalculateTax: settings.autoCalculateTax,
      autoCollectTax: settings.autoCollectTax,
      paymentReminderDays: settings.paymentReminderDays,
      complianceReminderDays: settings.complianceReminderDays,
      enableNotifications: settings.enableNotifications,
      calculationPrecision: settings.calculationPrecision,
      additionalSettings: settings.additionalSettings,
    };
  }
}
