import { UserEntity } from '@/auth/entities/user.entity';
import { BookingEntity } from '@/database/entities/booking.entity';
import { SpaceEntity } from '@/database/entities/space.entity';
import {
  BadRequestException,
  ConflictException,
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
import {
  ExtrasType,
  ReportType,
} from '../space-inventory/dto/space-inventory.dto';
import {
  InventoryAuditTrailEntity,
  InventoryExportEntity,
  InventoryReportEntity,
  InventorySettingsEntity,
  PricingRuleEntity,
} from '../space-inventory/entities/space-inventory.entity';
import {
  BulkInventoryOperationDto,
  BulkInventoryOperationType,
  CreatePricingConfigDto,
  CreateSpaceExtrasDto,
  CreateSpacePackageDto,
  ExportFormat,
  InventoryStatus,
  PricingConfigResponseDto,
  PricingType,
  SpaceExtrasResponseDto,
  SpaceInventoryAnalyticsDto,
  SpaceInventoryExportDto,
  SpaceInventoryReportDto,
  SpaceInventoryReportResponseDto,
  SpaceInventoryResponseDto,
  SpaceInventorySettingsDto,
  SpacePackageResponseDto,
  UpdateInventoryDto,
  UpdatePricingConfigDto,
  UpdateSpaceExtrasDto,
  UpdateSpacePackageDto,
} from './dto/space-inventory.dto';
import {
  SpaceExtrasEntity,
  SpaceInventoryEntity,
  SpacePackageEntity,
} from './entities/space-inventory.entity';

@Injectable()
export class SpaceInventoryService {
  constructor(
    @InjectRepository(SpacePackageEntity)
    private spacePackageRepository: Repository<SpacePackageEntity>,
    @InjectRepository(SpaceExtrasEntity)
    private spaceExtrasRepository: Repository<SpaceExtrasEntity>,
    @InjectRepository(SpaceInventoryEntity)
    private inventoryRepository: Repository<SpaceInventoryEntity>,
    @InjectRepository(PricingRuleEntity)
    private pricingRuleRepository: Repository<PricingRuleEntity>,
    @InjectRepository(InventoryAuditTrailEntity)
    private auditTrailRepository: Repository<InventoryAuditTrailEntity>,
    @InjectRepository(InventoryExportEntity)
    private exportRepository: Repository<InventoryExportEntity>,
    @InjectRepository(InventoryReportEntity)
    private reportRepository: Repository<InventoryReportEntity>,
    @InjectRepository(InventorySettingsEntity)
    private settingsRepository: Repository<InventorySettingsEntity>,
    @InjectRepository(SpaceEntity)
    private spaceRepository: Repository<SpaceEntity>,
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
    @InjectRepository(BookingEntity)
    private bookingRepository: Repository<BookingEntity>,
  ) {}

  // Space Package Management
  async createSpacePackage(
    createDto: CreateSpacePackageDto,
    userId: string,
  ): Promise<SpacePackageResponseDto> {
    const space = await this.spaceRepository.findOne({
      where: { id: createDto.spaceId },
    });
    if (!space) {
      throw new NotFoundException('Space not found');
    }

    const spacePackage = this.spacePackageRepository.create({
      ...createDto,
      createdBy: userId,
      updatedBy: userId,
    });

    const savedPackage = await this.spacePackageRepository.save(spacePackage);

    await this.createAuditTrail(
      createDto.spaceId,
      'CREATE_PACKAGE',
      `Created space package: ${createDto.name}`,
      null,
      savedPackage,
      userId,
    );

    return this.mapToSpacePackageResponse(savedPackage);
  }

  async updateSpacePackage(
    packageId: string,
    updateDto: UpdateSpacePackageDto,
    userId: string,
  ): Promise<SpacePackageResponseDto> {
    const spacePackage = await this.spacePackageRepository.findOne({
      where: { id: packageId },
      relations: ['space'],
    });

    if (!spacePackage) {
      throw new NotFoundException('Space package not found');
    }

    const oldValues = { ...spacePackage };
    Object.assign(spacePackage, updateDto, { updatedBy: userId });

    const savedPackage = await this.spacePackageRepository.save(spacePackage);

    await this.createAuditTrail(
      spacePackage.spaceOptionId,
      'UPDATE_PACKAGE',
      `Updated space package: ${spacePackage.name}`,
      oldValues,
      savedPackage,
      userId,
    );

    return this.mapToSpacePackageResponse(savedPackage);
  }

  async getSpacePackage(packageId: string): Promise<SpacePackageResponseDto> {
    const spacePackage = await this.spacePackageRepository.findOne({
      where: { id: packageId },
      relations: [
        'spaceOption',
        'spaceOption.space',
        'spaceOption.space.partner',
      ],
    });

    if (!spacePackage) {
      throw new NotFoundException('Space package not found');
    }

    return this.mapToSpacePackageResponse(spacePackage);
  }

  async getSpacePackages(
    filters: any = {},
  ): Promise<SpacePackageResponseDto[]> {
    const queryBuilder = this.spacePackageRepository
      .createQueryBuilder('package')
      .leftJoinAndSelect('package.spaceOption', 'spaceOption')
      .leftJoinAndSelect('spaceOption.space', 'space')
      .leftJoinAndSelect('space.partner', 'partner');

    if (filters.spaceId) {
      queryBuilder.andWhere('space.id = :spaceId', {
        spaceId: filters.spaceId,
      });
    }

    if (filters.packageType) {
      queryBuilder.andWhere('package.packageType = :packageType', {
        packageType: filters.packageType,
      });
    }

    if (filters.isActive !== undefined) {
      queryBuilder.andWhere('package.isActive = :isActive', {
        isActive: filters.isActive,
      });
    }

    if (filters.partnerId) {
      queryBuilder.andWhere('space.partnerId = :partnerId', {
        partnerId: filters.partnerId,
      });
    }

    queryBuilder
      .orderBy('package.priority', 'DESC')
      .addOrderBy('package.createdAt', 'DESC');

    const packages = await queryBuilder.getMany();
    return packages.map((pkg) => this.mapToSpacePackageResponse(pkg));
  }

  async deleteSpacePackage(packageId: string, userId: string): Promise<void> {
    const spacePackage = await this.spacePackageRepository.findOne({
      where: { id: packageId },
    });
    if (!spacePackage) {
      throw new NotFoundException('Space package not found');
    }

    // Check if package is being used in active bookings
    const activeBookings = await this.bookingRepository.count({
      where: {
        spaceOptionId: spacePackage.spaceOptionId,
        status: In(['confirmed', 'checked_in']),
      },
    });

    if (activeBookings > 0) {
      throw new ConflictException('Cannot delete package with active bookings');
    }

    await this.createAuditTrail(
      spacePackage.spaceOptionId,
      'DELETE_PACKAGE',
      `Deleted space package: ${spacePackage.name}`,
      spacePackage,
      null,
      userId,
    );

    await this.spacePackageRepository.remove(spacePackage);
  }

  // Space Extras Management
  async createSpaceExtras(
    createDto: CreateSpaceExtrasDto,
    userId: string,
  ): Promise<SpaceExtrasResponseDto> {
    const space = await this.spaceRepository.findOne({
      where: { id: createDto.spaceId },
    });
    if (!space) {
      throw new NotFoundException('Space not found');
    }

    const spaceExtras = this.spaceExtrasRepository.create({
      ...createDto,
      createdBy: userId,
      updatedBy: userId,
    });

    const savedExtras = await this.spaceExtrasRepository.save(spaceExtras);

    await this.createAuditTrail(
      createDto.spaceId,
      'CREATE_EXTRAS',
      `Created space extras: ${createDto.name}`,
      null,
      savedExtras,
      userId,
    );

    return this.mapToSpaceExtrasResponse(savedExtras);
  }

  async updateSpaceExtras(
    extrasId: string,
    updateDto: UpdateSpaceExtrasDto,
    userId: string,
  ): Promise<SpaceExtrasResponseDto> {
    const spaceExtras = await this.spaceExtrasRepository.findOne({
      where: { id: extrasId },
      relations: ['space'],
    });

    if (!spaceExtras) {
      throw new NotFoundException('Space extras not found');
    }

    const oldValues = { ...spaceExtras };
    Object.assign(spaceExtras, updateDto, { updatedBy: userId });

    const savedExtras = await this.spaceExtrasRepository.save(spaceExtras);

    await this.createAuditTrail(
      spaceExtras.spaceId,
      'UPDATE_EXTRAS',
      `Updated space extras: ${spaceExtras.name}`,
      oldValues,
      savedExtras,
      userId,
    );

    return this.mapToSpaceExtrasResponse(savedExtras);
  }

  async getSpaceExtrasById(extrasId: string): Promise<SpaceExtrasResponseDto> {
    const spaceExtras = await this.spaceExtrasRepository.findOne({
      where: { id: extrasId },
      relations: ['space', 'space.partner'],
    });

    if (!spaceExtras) {
      throw new NotFoundException('Space extras not found');
    }

    return this.mapToSpaceExtrasResponse(spaceExtras);
  }

  async getSpaceExtras(filters: any = {}): Promise<SpaceExtrasResponseDto[]> {
    const queryBuilder = this.spaceExtrasRepository
      .createQueryBuilder('extras')
      .leftJoinAndSelect('extras.space', 'space')
      .leftJoinAndSelect('space.partner', 'partner');

    if (filters.spaceId) {
      queryBuilder.andWhere('extras.spaceId = :spaceId', {
        spaceId: filters.spaceId,
      });
    }

    if (filters.extrasType) {
      queryBuilder.andWhere('extras.extrasType = :extrasType', {
        extrasType: filters.extrasType,
      });
    }

    if (filters.category) {
      queryBuilder.andWhere('extras.category = :category', {
        category: filters.category,
      });
    }

    if (filters.isActive !== undefined) {
      queryBuilder.andWhere('extras.isActive = :isActive', {
        isActive: filters.isActive,
      });
    }

    if (filters.partnerId) {
      queryBuilder.andWhere('space.partnerId = :partnerId', {
        partnerId: filters.partnerId,
      });
    }

    queryBuilder
      .orderBy('extras.priority', 'DESC')
      .addOrderBy('extras.createdAt', 'DESC');

    const extras = await queryBuilder.getMany();
    return extras.map((extra) => this.mapToSpaceExtrasResponse(extra));
  }

  async deleteSpaceExtras(extrasId: string, userId: string): Promise<void> {
    const spaceExtras = await this.spaceExtrasRepository.findOne({
      where: { id: extrasId },
    });
    if (!spaceExtras) {
      throw new NotFoundException('Space extras not found');
    }

    await this.createAuditTrail(
      spaceExtras.spaceId,
      'DELETE_EXTRAS',
      `Deleted space extras: ${spaceExtras.name}`,
      spaceExtras,
      null,
      userId,
    );

    await this.spaceExtrasRepository.remove(spaceExtras);
  }

  // Inventory Management
  async updateInventory(
    spaceId: string,
    updateDto: UpdateInventoryDto,
    userId: string,
  ): Promise<SpaceInventoryResponseDto> {
    let inventory = await this.inventoryRepository.findOne({
      where: { spaceId: spaceId },
      relations: ['space', 'space.partner'],
    });

    if (!inventory) {
      // Create initial inventory if it doesn't exist
      const space = await this.spaceRepository.findOne({
        where: { id: spaceId },
      });
      if (!space) {
        throw new NotFoundException('Space not found');
      }

      inventory = this.inventoryRepository.create({
        spaceId,
        totalCapacity: space.totalCapacity || 0,
        availableCapacity: space.totalCapacity || 0,
        reservedCapacity: 0,
        occupiedCapacity: 0,
        status: InventoryStatus.AVAILABLE,
        updatedBy: userId,
      });
    }

    const oldValues = { ...inventory };
    Object.assign(inventory, updateDto, { updatedBy: userId });

    const savedInventory = await this.inventoryRepository.save(inventory);

    await this.createAuditTrail(
      spaceId,
      'UPDATE_INVENTORY',
      'Updated space inventory',
      oldValues,
      savedInventory,
      userId,
    );

    return this.mapToSpaceInventoryResponse(savedInventory);
  }

  async getInventory(spaceId: string): Promise<SpaceInventoryResponseDto> {
    const inventory = await this.inventoryRepository.findOne({
      where: { spaceId },
      relations: ['space', 'space.partner'],
    });

    if (!inventory) {
      throw new NotFoundException('Space inventory not found');
    }

    return this.mapToSpaceInventoryResponse(inventory);
  }

  async getInventories(
    filters: any = {},
  ): Promise<SpaceInventoryResponseDto[]> {
    const queryBuilder = this.inventoryRepository
      .createQueryBuilder('inventory')
      .leftJoinAndSelect('inventory.space', 'space')
      .leftJoinAndSelect('space.partner', 'partner');

    if (filters.status) {
      queryBuilder.andWhere('inventory.status = :status', {
        status: filters.status,
      });
    }

    if (filters.isLowStock !== undefined) {
      queryBuilder.andWhere('inventory.isLowStock = :isLowStock', {
        isLowStock: filters.isLowStock,
      });
    }

    if (filters.partnerId) {
      queryBuilder.andWhere('space.partnerId = :partnerId', {
        partnerId: filters.partnerId,
      });
    }

    if (filters.utilizationMin !== undefined) {
      queryBuilder.andWhere('inventory.utilizationRate >= :utilizationMin', {
        utilizationMin: filters.utilizationMin,
      });
    }

    if (filters.utilizationMax !== undefined) {
      queryBuilder.andWhere('inventory.utilizationRate <= :utilizationMax', {
        utilizationMax: filters.utilizationMax,
      });
    }

    queryBuilder.orderBy('inventory.updatedAt', 'DESC');

    const inventories = await queryBuilder.getMany();
    return inventories.map((inventory) =>
      this.mapToSpaceInventoryResponse(inventory),
    );
  }

  // Pricing Configuration Management
  async createPricingConfig(
    createDto: CreatePricingConfigDto,
    userId: string,
  ): Promise<PricingConfigResponseDto> {
    const space = await this.spaceRepository.findOne({
      where: { id: createDto.spaceId },
    });
    if (!space) {
      throw new NotFoundException('Space not found');
    }

    const pricingConfig = this.pricingRuleRepository.create({
      ...createDto,
      createdBy: userId,
      updatedBy: userId,
    });

    const savedConfig: PricingRuleEntity =
      await this.pricingRuleRepository.save(pricingConfig);

    await this.createAuditTrail(
      createDto.spaceId,
      'CREATE_PRICING_CONFIG',
      `Created pricing configuration: ${createDto.name}`,
      null,
      savedConfig,
      userId,
    );

    // Load the saved config with relations
    const configWithRelations = await this.pricingRuleRepository.findOne({
      where: { id: savedConfig.id },
      relations: [
        'spacePackage',
        'spacePackage.spaceOption',
        'spacePackage.spaceOption.space',
      ],
    });

    const configSpace = configWithRelations?.spacePackage?.spaceOption?.space;
    return this.mapToPricingConfigResponse(savedConfig, configSpace);
  }

  async updatePricingConfig(
    configId: string,
    updateDto: UpdatePricingConfigDto,
    userId: string,
  ): Promise<PricingConfigResponseDto> {
    const pricingConfig = await this.pricingRuleRepository.findOne({
      where: { id: configId },
      relations: [
        'spacePackage',
        'spacePackage.spaceOption',
        'spacePackage.spaceOption.space',
      ],
    });

    if (!pricingConfig) {
      throw new NotFoundException('Pricing configuration not found');
    }

    const oldValues = { ...pricingConfig };
    Object.assign(pricingConfig, updateDto, { updatedBy: userId });

    const savedConfig: PricingRuleEntity =
      await this.pricingRuleRepository.save(pricingConfig);

    await this.createAuditTrail(
      pricingConfig.spacePackageId || 'unknown',
      'UPDATE_PRICING_CONFIG',
      `Updated pricing configuration: ${pricingConfig.name}`,
      oldValues,
      savedConfig,
      userId,
    );

    const space = savedConfig.spacePackage?.spaceOption?.space;
    return this.mapToPricingConfigResponse(savedConfig, space);
  }

  async getPricingConfig(configId: string): Promise<PricingConfigResponseDto> {
    const pricingRule = await this.pricingRuleRepository.findOne({
      where: { id: configId },
      relations: [
        'spacePackage',
        'spacePackage.spaceOption',
        'spacePackage.spaceOption.space',
      ],
    });

    if (!pricingRule) {
      throw new NotFoundException('Pricing configuration not found');
    }

    const space = pricingRule.spacePackage?.spaceOption?.space;
    return this.mapToPricingConfigResponse(pricingRule, space);
  }

  async getPricingConfigs(
    filters: any = {},
  ): Promise<PricingConfigResponseDto[]> {
    const queryBuilder = this.pricingRuleRepository
      .createQueryBuilder('rule')
      .leftJoinAndSelect('rule.spacePackage', 'spacePackage')
      .leftJoinAndSelect('spacePackage.spaceOption', 'spaceOption')
      .leftJoinAndSelect('spaceOption.space', 'space');

    if (filters.spaceId) {
      queryBuilder.andWhere('space.id = :spaceId', {
        spaceId: filters.spaceId,
      });
    }

    if (filters.pricingType) {
      queryBuilder.andWhere('rule.pricingType = :pricingType', {
        pricingType: filters.pricingType,
      });
    }

    if (filters.isActive !== undefined) {
      queryBuilder.andWhere('rule.isActive = :isActive', {
        isActive: filters.isActive,
      });
    }

    if (filters.effectiveDate) {
      const date = new Date(filters.effectiveDate);
      queryBuilder.andWhere(
        '(rule.effectiveFrom IS NULL OR rule.effectiveFrom <= :date) AND (rule.effectiveTo IS NULL OR rule.effectiveTo >= :date)',
        { date },
      );
    }

    queryBuilder
      .orderBy('rule.priority', 'DESC')
      .addOrderBy('rule.createdAt', 'DESC');

    const rules = await queryBuilder.getMany();
    return rules.map((rule) => {
      const space = rule.spacePackage?.spaceOption?.space;
      return this.mapToPricingConfigResponse(rule, space);
    });
  }

  async deletePricingConfig(configId: string, userId: string): Promise<void> {
    const pricingRule = await this.pricingRuleRepository.findOne({
      where: { id: configId },
      relations: [
        'spacePackage',
        'spacePackage.spaceOption',
        'spacePackage.spaceOption.space',
      ],
    });
    if (!pricingRule) {
      throw new NotFoundException('Pricing configuration not found');
    }

    const space = pricingRule.spacePackage?.spaceOption?.space;
    await this.createAuditTrail(
      space?.id || 'unknown',
      'DELETE_PRICING_CONFIG',
      `Deleted pricing configuration: ${pricingRule.name}`,
      pricingRule,
      null,
      userId,
    );

    await this.pricingRuleRepository.remove(pricingRule);
  }

  // Bulk Operations
  async performBulkOperation(
    operationDto: BulkInventoryOperationDto,
    userId: string,
  ): Promise<{ success: number; failed: number; errors: string[] }> {
    const results = { success: 0, failed: 0, errors: [] };

    for (const spaceId of operationDto.spaceIds) {
      try {
        switch (operationDto.operation) {
          case BulkInventoryOperationType.UPDATE_PRICING:
            await this.bulkUpdatePricing(spaceId, operationDto.data, userId);
            break;
          case BulkInventoryOperationType.UPDATE_AVAILABILITY:
            await this.bulkUpdateAvailability(
              spaceId,
              operationDto.data,
              userId,
            );
            break;
          case BulkInventoryOperationType.UPDATE_STATUS:
            await this.bulkUpdateStatus(spaceId, operationDto.data, userId);
            break;
          case BulkInventoryOperationType.APPLY_DISCOUNT:
            await this.bulkApplyDiscount(spaceId, operationDto.data, userId);
            break;
          case BulkInventoryOperationType.BULK_ACTIVATE:
            await this.bulkActivatePackages(spaceId, userId);
            break;
          case BulkInventoryOperationType.BULK_DEACTIVATE:
            await this.bulkDeactivatePackages(spaceId, userId);
            break;
          default:
            throw new BadRequestException(
              `Unsupported operation: ${operationDto.operation}`,
            );
        }
        results.success++;
      } catch (error) {
        results.failed++;
        results.errors.push(`Space ${spaceId}: ${error.message}`);
      }
    }

    await this.createAuditTrail(
      null,
      'BULK_OPERATION',
      `Performed bulk operation: ${operationDto.operation}`,
      { operation: operationDto.operation, spaceIds: operationDto.spaceIds },
      results,
      userId,
    );

    return results;
  }

  // Pricing Calculation
  async calculatePricing(
    spaceId: string,
    calculationData: any,
  ): Promise<{
    basePrice: number;
    packagePrice: number;
    extrasPrice: number;
    discountAmount: number;
    totalPrice: number;
    breakdown: any;
  }> {
    // Mock pricing calculation - implement actual logic
    const basePrice = calculationData.basePrice || 80;
    const packagePrice = calculationData.packagePrice || 100;
    const extrasPrice = calculationData.extrasPrice || 20;
    const discountAmount = calculationData.discountAmount || 0;
    const totalPrice = packagePrice + extrasPrice - discountAmount;

    return {
      basePrice,
      packagePrice,
      extrasPrice,
      discountAmount,
      totalPrice,
      breakdown: {
        base: { price: basePrice },
        package: { price: packagePrice },
        extras: { price: extrasPrice },
        discount: { amount: discountAmount },
        tax: 0,
        total: totalPrice,
      },
    };
  }

  // Bulk Operations (renamed method)
  async performBulkInventoryOperation(
    operationDto: BulkInventoryOperationDto,
    userId: string,
  ): Promise<{ success: number; failed: number; errors: string[] }> {
    return this.performBulkOperation(operationDto, userId);
  }

  // Analytics and Reporting
  async getInventoryAnalytics(
    filters: any = {},
  ): Promise<SpaceInventoryAnalyticsDto> {
    return this.getAnalytics(filters);
  }

  async getAnalytics(filters: any = {}): Promise<SpaceInventoryAnalyticsDto> {
    const queryBuilder = this.inventoryRepository
      .createQueryBuilder('inventory')
      .leftJoinAndSelect('inventory.spacePackage', 'spacePackage')
      .leftJoinAndSelect('spacePackage.spaceOption', 'spaceOption')
      .leftJoinAndSelect('spaceOption.space', 'space')
      .leftJoinAndSelect('space.partner', 'partner');

    if (filters.partnerId) {
      queryBuilder.andWhere('space.partnerId = :partnerId', {
        partnerId: filters.partnerId,
      });
    }

    if (filters.dateFrom && filters.dateTo) {
      queryBuilder.andWhere(
        'inventory.updatedAt BETWEEN :dateFrom AND :dateTo',
        {
          dateFrom: filters.dateFrom,
          dateTo: filters.dateTo,
        },
      );
    }

    const inventories = await queryBuilder.getMany();

    // Calculate basic metrics
    const totalSpaces = inventories.length;
    const availableSpaces = inventories.filter(
      (inv) => inv.status === InventoryStatus.AVAILABLE,
    ).length;
    const occupiedSpaces = inventories.filter(
      (inv) => inv.status === InventoryStatus.OCCUPIED,
    ).length;
    const maintenanceSpaces = inventories.filter(
      (inv) => inv.status === InventoryStatus.MAINTENANCE,
    ).length;
    const utilizationRate =
      totalSpaces > 0 ? (occupiedSpaces / totalSpaces) * 100 : 0;

    // Get package analytics
    const packageAnalytics = await this.getPackageAnalytics(filters);
    const extrasAnalytics = await this.getExtrasAnalytics(filters);
    const utilizationByType = await this.getUtilizationByType(filters);
    const monthlyTrends = await this.getMonthlyTrends(filters);
    const peakHours = await this.getPeakHours(filters);
    const lowStockItems = inventories.filter((inv) => inv.isLowStock);

    return {
      totalSpaces,
      availableSpaces,
      occupiedSpaces,
      maintenanceSpaces,
      utilizationRate: Math.round(utilizationRate * 100) / 100,
      totalRevenue:
        packageAnalytics.totalRevenue + extrasAnalytics.totalRevenue,
      averageBookingDuration: packageAnalytics.averageBookingDuration,
      totalPackages: packageAnalytics.totalPackages,
      activePackages: packageAnalytics.activePackages,
      totalExtras: extrasAnalytics.totalExtras,
      popularPackages: packageAnalytics.popularPackages,
      popularExtras: extrasAnalytics.popularExtras,
      utilizationByType,
      monthlyTrends,
      peakHours,
      lowStockItems: lowStockItems.map((item) => ({
        spaceId: item.spaceId,
        spaceName: item.space?.name || 'Unknown',
        currentStock: item.availableCapacity,
        threshold: item.lowStockThreshold || 0,
      })),
    };
  }

  // Export and Download
  async exportInventoryData(exportDto: any, userId: string): Promise<string> {
    const exportEntity = await this.exportData(exportDto, userId);
    return exportEntity.id;
  }

  async exportData(
    exportDto: any,
    userId: string,
  ): Promise<InventoryExportEntity> {
    const exportEntity = this.exportRepository.create({
      format: exportDto.format,
      filters: exportDto.filters,
      fields: exportDto.fields,
      includeRelated: exportDto.includeRelated || false,
      createdBy: userId,
    });

    const savedExport = await this.exportRepository.save(exportEntity);

    // Process export asynchronously
    this.processExport(savedExport.id).catch((error) => {
      console.error('Export processing failed:', error);
    });

    return savedExport;
  }

  async getExports(userId: string): Promise<InventoryExportEntity[]> {
    return this.exportRepository.find({
      where: { createdBy: userId },
      order: { createdAt: 'DESC' },
    });
  }

  async downloadExport(exportId: string, userId: string): Promise<string> {
    const exportEntity = await this.exportRepository.findOne({
      where: { id: exportId, createdBy: userId },
    });

    if (!exportEntity) {
      throw new NotFoundException('Export not found');
    }

    if (exportEntity.status !== 'completed') {
      throw new BadRequestException('Export is not ready for download');
    }

    if (exportEntity.isExpired()) {
      throw new BadRequestException('Export has expired');
    }

    return exportEntity.downloadUrl;
  }

  // Report Generation
  async generateInventoryReport(
    reportDto: any,
    userId: string,
  ): Promise<SpaceInventoryReportResponseDto> {
    return this.generateReport(reportDto, userId);
  }

  async getAllInventoryReports(
    filters: any = {},
  ): Promise<SpaceInventoryReportResponseDto[]> {
    const queryBuilder = this.reportRepository.createQueryBuilder('report');

    if (filters.reportType) {
      queryBuilder.andWhere('report.reportType = :reportType', {
        reportType: filters.reportType,
      });
    }

    if (filters.status) {
      queryBuilder.andWhere('report.status = :status', {
        status: filters.status,
      });
    }

    const reports = await queryBuilder
      .orderBy('report.createdAt', 'DESC')
      .getMany();
    return reports.map((report) => this.mapToReportResponseDto(report));
  }

  async getInventoryReport(
    id: string,
  ): Promise<SpaceInventoryReportResponseDto> {
    const report = await this.reportRepository.findOne({ where: { id } });
    if (!report) {
      throw new NotFoundException('Report not found');
    }
    return this.mapToReportResponseDto(report);
  }

  async generateReport(
    reportDto: any,
    userId: string,
  ): Promise<SpaceInventoryReportResponseDto> {
    const reportEntity = this.reportRepository.create({
      title: reportDto.reportName,
      reportType: reportDto.reportType,
      format: reportDto.format || ExportFormat.PDF,
      dateFrom: reportDto.dateFrom ? new Date(reportDto.dateFrom) : null,
      dateTo: reportDto.dateTo ? new Date(reportDto.dateTo) : null,
      parameters: reportDto.parameters,
      scheduledFor: reportDto.scheduledFor
        ? new Date(reportDto.scheduledFor)
        : null,
      createdBy: userId,
    });

    const savedReport = await this.reportRepository.save(reportEntity);

    // Process report asynchronously if not scheduled
    if (!reportEntity.scheduledFor) {
      this.processReport(savedReport.id).catch((error) => {
        console.error('Report processing failed:', error);
      });
    }

    return this.mapToReportResponse(savedReport);
  }

  async getReports(userId: string): Promise<SpaceInventoryReportResponseDto[]> {
    const reports = await this.reportRepository.find({
      where: { createdBy: userId },
      order: { createdAt: 'DESC' },
    });

    return reports.map((report) => this.mapToReportResponse(report));
  }

  async downloadReport(reportId: string, userId: string): Promise<string> {
    const report = await this.reportRepository.findOne({
      where: { id: reportId, createdBy: userId },
    });

    if (!report) {
      throw new NotFoundException('Report not found');
    }

    if (report.status !== 'completed') {
      throw new BadRequestException('Report is not ready for download');
    }

    return report.downloadUrl;
  }

  // Settings Management
  async updateSettings(
    settingsDto: SpaceInventorySettingsDto,
    userId: string,
  ): Promise<InventorySettingsEntity> {
    let settings = await this.settingsRepository.findOne({ where: {} });

    if (!settings) {
      settings = this.settingsRepository.create({
        defaultLowStockThreshold: settingsDto.defaultLowStockThreshold,
        autoReorderEnabled: settingsDto.autoUpdateInventory || false,
        defaultReorderQuantity: settingsDto.defaultLowStockThreshold,
        notificationSettings: {
          sendLowStockAlerts: settingsDto.sendLowStockAlerts,
          alertThresholdDays: settingsDto.alertThresholdDays,
          enableNotifications: settingsDto.enableNotifications,
        },
        pricingSettings: {
          enableDynamicPricing: settingsDto.enableDynamicPricing,
          priceAdjustmentFactor: settingsDto.priceAdjustmentFactor,
        },
        bookingSettings: {
          enableOverbooking: settingsDto.enableOverbooking,
          overbookingPercentage: settingsDto.overbookingPercentage,
        },
        updatedBy: userId,
      });
    } else {
      Object.assign(settings, {
        defaultLowStockThreshold: settingsDto.defaultLowStockThreshold,
        autoReorderEnabled:
          settingsDto.autoUpdateInventory || settings.autoReorderEnabled,
        defaultReorderQuantity:
          settingsDto.defaultLowStockThreshold ||
          settings.defaultReorderQuantity,
        notificationSettings: {
          ...settings.notificationSettings,
          sendLowStockAlerts: settingsDto.sendLowStockAlerts,
          alertThresholdDays: settingsDto.alertThresholdDays,
          enableNotifications: settingsDto.enableNotifications,
        },
        pricingSettings: {
          ...settings.pricingSettings,
          enableDynamicPricing: settingsDto.enableDynamicPricing,
          priceAdjustmentFactor: settingsDto.priceAdjustmentFactor,
        },
        bookingSettings: {
          ...settings.bookingSettings,
          enableOverbooking: settingsDto.enableOverbooking,
          overbookingPercentage: settingsDto.overbookingPercentage,
        },
        updatedBy: userId,
      });
    }

    return this.settingsRepository.save(settings);
  }

  async getSettings(): Promise<InventorySettingsEntity> {
    let settings = await this.settingsRepository.findOne({ where: {} });

    if (!settings) {
      settings = this.settingsRepository.create({
        defaultLowStockThreshold: 5,
        autoReorderEnabled: true,
        defaultReorderQuantity: 10,
        notificationSettings: {
          sendLowStockAlerts: true,
          alertThresholdDays: 7,
          enableNotifications: true,
        },
        pricingSettings: {
          enableDynamicPricing: false,
          priceAdjustmentFactor: 1.0,
        },
        bookingSettings: {
          enableOverbooking: false,
          overbookingPercentage: 0,
        },
      });
      await this.settingsRepository.save(settings);
    }

    return settings;
  }

  // Utility Methods
  async getUtilizationMetrics(
    spaceId: string,
    dateFrom?: Date,
    dateTo?: Date,
  ): Promise<any> {
    const queryBuilder = this.bookingRepository
      .createQueryBuilder('booking')
      .innerJoin('booking.spaceOption', 'spaceOption')
      .where('spaceOption.spaceId = :spaceId', { spaceId })
      .andWhere('booking.status IN (:...statuses)', {
        statuses: ['confirmed', 'completed'],
      });

    if (dateFrom && dateTo) {
      queryBuilder.andWhere('booking.startTime BETWEEN :dateFrom AND :dateTo', {
        dateFrom,
        dateTo,
      });
    }

    const bookings = await queryBuilder.getMany();

    const totalBookings = bookings.length;
    const totalHours = bookings.reduce((sum, booking) => {
      const duration =
        (new Date(booking.endDateTime).getTime() -
          new Date(booking.startDateTime).getTime()) /
        (1000 * 60 * 60);
      return sum + duration;
    }, 0);

    const averageDuration = totalBookings > 0 ? totalHours / totalBookings : 0;
    const totalRevenue = bookings.reduce(
      (sum, booking) => sum + (booking.totalAmount || 0),
      0,
    );

    return {
      totalBookings,
      totalHours: Math.round(totalHours * 100) / 100,
      averageDuration: Math.round(averageDuration * 100) / 100,
      totalRevenue: Math.round(totalRevenue * 100) / 100,
    };
  }

  async getDemandForecast(spaceId: string, days: number = 30): Promise<any> {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const bookings = await this.bookingRepository.find({
      where: {
        spaceOption: {
          spaceId,
        },
        startDateTime: Between(startDate, endDate),
        status: In(['confirmed', 'completed']),
      },
      order: { startDateTime: 'ASC' },
    });

    // Simple demand forecast based on historical data
    const dailyBookings = new Map<string, number>();
    bookings.forEach((booking) => {
      const date = booking.startDateTime.toISOString().split('T')[0];
      dailyBookings.set(date, (dailyBookings.get(date) || 0) + 1);
    });

    const averageDailyBookings =
      Array.from(dailyBookings.values()).reduce(
        (sum, count) => sum + count,
        0,
      ) / days;
    const trend = this.calculateTrend(Array.from(dailyBookings.values()));

    return {
      averageDailyBookings: Math.round(averageDailyBookings * 100) / 100,
      trend,
      forecastNextWeek:
        Math.round(averageDailyBookings * 7 * (1 + trend) * 100) / 100,
      forecastNextMonth:
        Math.round(averageDailyBookings * 30 * (1 + trend) * 100) / 100,
    };
  }

  // Private Helper Methods
  private async createAuditTrail(
    spaceId: string,
    action: string,
    description: string,
    oldValues: any,
    newValues: any,
    userId: string,
    metadata?: any,
  ): Promise<void> {
    const auditEntry = InventoryAuditTrailEntity.createAuditEntry(
      spaceId,
      action,
      description,
      oldValues,
      newValues,
      userId,
      metadata,
    );

    await this.auditTrailRepository.save(auditEntry);
  }

  private mapToSpacePackageResponse(
    entity: SpacePackageEntity,
  ): SpacePackageResponseDto {
    return {
      id: entity.id,
      space: {
        id: entity.spaceOption?.space?.id || 'unknown',
        name: entity.spaceOption?.space?.name || 'Unknown',
        location: entity.spaceOption?.space?.space_specific_location
          ? `${entity.spaceOption.space.space_specific_location.floor || ''} ${entity.spaceOption.space.space_specific_location.access_instructions || ''}`.trim() ||
            'Unknown'
          : 'Unknown',
      },
      name: entity.name,
      description: entity.description,
      packageType: entity.packageType as any,
      basePrice: entity.basePrice,
      currency: 'INR',
      durationHours: entity.durationHours,
      maxCapacity: entity.maxCapacity,
      minCapacity: entity.minCapacity,
      includedAmenities: entity.includedAmenities || [],
      features: entity.features || [],
      termsAndConditions: entity.termsAndConditions,
      cancellationPolicy: entity.cancellationPolicy,
      advanceBookingHours: entity.advanceBookingHours,
      maxBookingHours: entity.maxBookingHours,
      isActive: entity.isActive !== false,
      priority: entity.priority,
      metadata: entity.metadata,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
      createdBy: entity.createdBy,
      updatedBy: entity.updatedBy,
    };
  }

  private mapToSpaceExtrasResponse(
    entity: SpaceExtrasEntity,
  ): SpaceExtrasResponseDto {
    return {
      id: entity.id,
      space: {
        id: 'unknown',
        name: 'Unknown',
        location: 'Unknown',
      },
      name: entity.name,
      description: entity.description,
      extrasType: entity.extrasType as any,
      category: entity.category || 'general',
      pricePerUnit: entity.pricePerUnit,
      currency: 'INR',
      unit: 'unit',
      minQuantity: 1,
      maxQuantity: entity.maxQuantity || 999,
      availableQuantity: entity.availableQuantity || 0,
      setupTimeMinutes: 0,
      advanceBookingHours: 24,
      isActive: entity.isActive,
      priority: 1,
      metadata: entity.metadata,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
      createdBy: entity.createdBy,
      updatedBy: entity.updatedBy,
    };
  }

  private mapToSpaceInventoryResponse(
    entity: SpaceInventoryEntity,
  ): SpaceInventoryResponseDto {
    return {
      id: entity.id,
      space: {
        id: entity.space?.id || entity.spaceId,
        name: entity.space?.name || 'Unknown',
        location:
          typeof entity.space?.space_specific_location === 'string'
            ? entity.space.space_specific_location
            : entity.space?.space_specific_location
              ? `${entity.space.space_specific_location.floor || ''} ${entity.space.space_specific_location.building || ''} ${entity.space.space_specific_location.room_number || ''}`.trim() ||
                'Unknown'
              : 'Unknown',
        partner: {
          id: entity.space?.listing?.partner?.id || 'Unknown',
          name: entity.space?.listing?.partner?.businessName || 'Unknown',
        },
      },
      status: entity.status,
      totalCapacity: entity.totalCapacity,
      availableCapacity: entity.availableCapacity,
      reservedCapacity: entity.reservedCapacity,
      occupiedCapacity: entity.occupiedCapacity,
      utilizationRate: entity.utilizationRate,
      isLowStock: entity.isLowStock,
      lowStockThreshold: entity.lowStockThreshold,
      maintenanceNotes: entity.maintenanceNotes,
      lastMaintenanceDate: entity.lastMaintenanceDate,
      nextMaintenanceDate: entity.nextMaintenanceDate,
      metadata: entity.metadata,
      updatedAt: entity.updatedAt,
      updatedBy: entity.updatedBy,
    };
  }

  private mapToPricingConfigResponse(
    entity: PricingRuleEntity,
    space?: SpaceEntity,
  ): PricingConfigResponseDto {
    return {
      id: entity.id,
      space: {
        id: space?.id || 'unknown',
        name: space?.name || 'Unknown',
        location:
          typeof space?.space_specific_location === 'string'
            ? space.space_specific_location
            : space?.space_specific_location
              ? `${space.space_specific_location.floor || ''} ${space.space_specific_location.building || ''}`.trim() ||
                'Unknown'
              : 'Unknown',
      },
      name: entity.name,
      description: entity.description,
      pricingType: 'FLAT' as any, // Default since PricingRuleEntity doesn't have this field
      basePrice: 0, // Default since PricingRuleEntity doesn't have this field
      currency: 'INR', // Default currency
      pricingRules: entity.conditions || {}, // Use conditions as pricing rules
      discountRules: {
        type: entity.discountType,
        value: entity.discountValue,
        minQuantity: entity.minQuantity,
        maxQuantity: entity.maxQuantity,
        minDuration: entity.minDuration,
      },
      effectiveFrom: entity.validFrom,
      effectiveTo: entity.validUntil,
      isActive: entity.isActive,
      priority: 1, // Default priority since PricingRuleEntity doesn't have this field
      metadata: entity.conditions || {},
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
      createdBy: entity.createdBy,
      updatedBy: entity.updatedBy,
    };
  }

  private mapToReportResponse(
    entity: InventoryReportEntity,
  ): SpaceInventoryReportResponseDto {
    return {
      id: entity.id,
      reportName: entity.title,
      reportType: entity.reportType as any,
      status: entity.status,
      format: entity.format,
      dateFrom: entity.dateFrom,
      dateTo: entity.dateTo,
      parameters: entity.parameters,
      filePath: entity.filePath,
      downloadUrl: entity.downloadUrl,
      createdAt: entity.createdAt,
      completedAt: entity.completedAt,
      createdBy: entity.createdBy,
    };
  }

  // Bulk operation helper methods
  private async bulkUpdatePricing(
    spaceId: string,
    data: any,
    userId: string,
  ): Promise<void> {
    const packages = await this.spacePackageRepository.find({
      where: { spaceOptionId: spaceId },
    });

    for (const pkg of packages) {
      if (data.priceAdjustment) {
        pkg.basePrice = pkg.basePrice * (1 + data.priceAdjustment / 100);
        pkg.updatedBy = userId;
      }
    }

    await this.spacePackageRepository.save(packages);
  }

  private async bulkUpdateAvailability(
    spaceId: string,
    data: any,
    userId: string,
  ): Promise<void> {
    const inventory = await this.inventoryRepository.findOne({
      where: { spaceId: spaceId },
    });

    if (inventory && data.availableCapacity !== undefined) {
      inventory.availableCapacity = data.availableCapacity;
      await this.inventoryRepository.save(inventory);
    }
  }

  private async bulkUpdateStatus(
    spaceId: string,
    data: any,
    userId: string,
  ): Promise<void> {
    const inventory = await this.inventoryRepository.findOne({
      where: { spaceId: spaceId },
    });

    if (inventory && data.status) {
      inventory.status = data.status;
      await this.inventoryRepository.save(inventory);
    }
  }

  private async bulkApplyDiscount(
    spaceId: string,
    data: any,
    userId: string,
  ): Promise<void> {
    const packages = await this.spacePackageRepository.find({
      where: { spaceOptionId: spaceId },
    });

    for (const pkg of packages) {
      if (data.discountPercentage) {
        pkg.basePrice = pkg.basePrice * (1 - data.discountPercentage / 100);
        pkg.updatedBy = userId;
      }
    }

    await this.spacePackageRepository.save(packages);
  }

  private async bulkActivatePackages(
    spaceId: string,
    userId: string,
  ): Promise<void> {
    await this.spacePackageRepository.update(
      { spaceOptionId: spaceId },
      { isActive: true, updatedBy: userId },
    );
  }

  private async bulkDeactivatePackages(
    spaceId: string,
    userId: string,
  ): Promise<void> {
    await this.spacePackageRepository.update(
      { spaceOptionId: spaceId },
      { isActive: false, updatedBy: userId },
    );
  }

  // Analytics helper methods
  private async getPackageAnalytics(filters: any): Promise<any> {
    const packages = await this.spacePackageRepository.find({
      relations: ['bookings'],
    });

    const totalPackages = packages.length;
    const activePackages = packages.filter((pkg) => pkg.isActive).length;

    // Calculate popular packages and revenue
    const packageStats = packages.map((pkg) => {
      const bookingCount = pkg.bookings?.length || 0;
      const revenue =
        pkg.bookings?.reduce(
          (sum, booking) => sum + (booking.totalAmount || 0),
          0,
        ) || 0;
      const totalDuration =
        pkg.bookings?.reduce((sum, booking) => {
          const duration =
            (new Date(booking.endDateTime).getTime() -
              new Date(booking.startDateTime).getTime()) /
            (1000 * 60 * 60);
          return sum + duration;
        }, 0) || 0;

      return {
        packageId: pkg.id,
        packageName: pkg.name,
        bookingCount,
        revenue: Math.round(revenue * 100) / 100,
        totalDuration,
      };
    });

    const popularPackages = packageStats
      .sort((a, b) => b.bookingCount - a.bookingCount)
      .slice(0, 5);

    const totalRevenue = packageStats.reduce(
      (sum, stat) => sum + stat.revenue,
      0,
    );
    const totalBookings = packageStats.reduce(
      (sum, stat) => sum + stat.bookingCount,
      0,
    );
    const totalDuration = packageStats.reduce(
      (sum, stat) => sum + stat.totalDuration,
      0,
    );
    const averageBookingDuration =
      totalBookings > 0 ? totalDuration / totalBookings : 0;

    return {
      totalPackages,
      activePackages,
      popularPackages,
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      averageBookingDuration: Math.round(averageBookingDuration * 100) / 100,
    };
  }

  private async getExtrasAnalytics(filters: any): Promise<any> {
    const extras = await this.spaceExtrasRepository.find();
    const totalExtras = extras.length;

    // Mock popular extras data (would need booking_extras table in real implementation)
    const popularExtras = extras.slice(0, 5).map((extra) => ({
      extrasId: extra.id,
      extrasName: extra.name,
      usageCount: Math.floor(Math.random() * 50),
      revenue: Math.round(Math.random() * 10000 * 100) / 100,
    }));

    const totalRevenue = popularExtras.reduce(
      (sum, extra) => sum + extra.revenue,
      0,
    );

    return {
      totalExtras,
      popularExtras,
      totalRevenue: Math.round(totalRevenue * 100) / 100,
    };
  }

  private async getUtilizationByType(filters: any): Promise<any[]> {
    // Mock data - would need proper space type categorization
    return [
      {
        spaceType: 'Meeting Room',
        totalSpaces: 10,
        utilizationRate: 75.5,
        revenue: 25000,
      },
      {
        spaceType: 'Hot Desk',
        totalSpaces: 20,
        utilizationRate: 60.2,
        revenue: 15000,
      },
      {
        spaceType: 'Private Office',
        totalSpaces: 5,
        utilizationRate: 90.1,
        revenue: 35000,
      },
    ];
  }

  private async getMonthlyTrends(filters: any): Promise<any[]> {
    // Mock data - would calculate from actual booking data
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    return months.map((month) => ({
      month,
      bookings: Math.floor(Math.random() * 100) + 50,
      revenue: Math.round(Math.random() * 50000 * 100) / 100,
      utilizationRate: Math.round((Math.random() * 40 + 60) * 100) / 100,
    }));
  }

  private async getPeakHours(filters: any): Promise<any[]> {
    // Mock data - would calculate from actual booking data
    const hours = Array.from({ length: 24 }, (_, i) => i);
    return hours.map((hour) => ({
      hour,
      bookingCount: Math.floor(Math.random() * 20),
      utilizationRate: Math.round(Math.random() * 100 * 100) / 100,
    }));
  }

  // Settings Management
  async getInventorySettings(): Promise<SpaceInventorySettingsDto> {
    // Mock settings - implement actual settings retrieval
    return {
      defaultLowStockThreshold: 5,
      autoUpdateInventory: true,
      sendLowStockAlerts: true,
      alertThresholdDays: 7,
      enableDynamicPricing: false,
      priceAdjustmentFactor: 1.0,
      enableOverbooking: false,
      overbookingPercentage: 0,
      maintenanceReminderDays: 30,
      enableNotifications: true,
    };
  }

  async updateInventorySettings(
    settingsDto: SpaceInventorySettingsDto,
    userId: string,
  ): Promise<SpaceInventorySettingsDto> {
    // Mock settings update - implement actual settings persistence
    await this.createAuditTrail(
      null,
      'UPDATE_SETTINGS',
      'Updated inventory settings',
      {},
      settingsDto,
      userId,
    );
    return settingsDto;
  }

  private mapToReportResponseDto(report: any): SpaceInventoryReportResponseDto {
    return {
      id: report.id,
      reportName: report.reportName,
      reportType: report.reportType,
      status: report.status,
      format: report.format,
      parameters: report.parameters,
      filePath: report.filePath,
      downloadUrl: report.downloadUrl,
      createdAt: report.createdAt,
      completedAt: report.completedAt,
      expiresAt: report.expiresAt,
      errorMessage: report.errorMessage,
    };
  }

  private calculateTrend(values: number[]): number {
    if (values.length < 2) return 0;

    const firstHalf = values.slice(0, Math.floor(values.length / 2));
    const secondHalf = values.slice(Math.floor(values.length / 2));

    const firstAvg =
      firstHalf.reduce((sum, val) => sum + val, 0) / firstHalf.length;
    const secondAvg =
      secondHalf.reduce((sum, val) => sum + val, 0) / secondHalf.length;

    return firstAvg > 0 ? (secondAvg - firstAvg) / firstAvg : 0;
  }

  private async processExport(exportId: string): Promise<void> {
    // Mock export processing - would implement actual file generation
    const exportEntity = await this.exportRepository.findOne({
      where: { id: exportId },
    });
    if (!exportEntity) return;

    try {
      // Simulate processing time
      await new Promise((resolve) => setTimeout(resolve, 5000));

      const filePath = `/exports/space-inventory-${exportId}.${exportEntity.format}`;
      const downloadUrl = `https://api.example.com${filePath}`;

      exportEntity.markAsCompleted(filePath, downloadUrl, 100);
      await this.exportRepository.save(exportEntity);
    } catch (error) {
      exportEntity.markAsFailed(error.message);
      await this.exportRepository.save(exportEntity);
    }
  }

  private async processReport(reportId: string): Promise<void> {
    // Mock report processing - would implement actual report generation
    const reportEntity = await this.reportRepository.findOne({
      where: { id: reportId },
    });
    if (!reportEntity) return;

    try {
      // Simulate processing time
      await new Promise((resolve) => setTimeout(resolve, 10000));

      const filePath = `/reports/space-inventory-${reportId}.${reportEntity.format}`;
      const downloadUrl = `https://api.example.com${filePath}`;

      reportEntity.markAsCompleted(filePath, downloadUrl);
      await this.reportRepository.save(reportEntity);
    } catch (error) {
      reportEntity.markAsFailed(error.message);
      await this.reportRepository.save(reportEntity);
    }
  }

  async getSpaceUtilization(
    spaceId: string,
    filters: { dateFrom?: string; dateTo?: string },
  ): Promise<{
    utilizationRate: number;
    totalBookings: number;
    totalRevenue: number;
    averageBookingDuration: number;
    peakHours: any[];
    trends: any[];
  }> {
    const dateFrom = filters.dateFrom ? new Date(filters.dateFrom) : undefined;
    const dateTo = filters.dateTo ? new Date(filters.dateTo) : undefined;

    return this.getUtilizationMetrics(spaceId, dateFrom, dateTo);
  }

  async getSpaceForecast(
    spaceId: string,
    days: number = 30,
  ): Promise<{
    forecastPeriod: { startDate: Date; endDate: Date };
    predictedBookings: number;
    predictedRevenue: number;
    demandTrends: any[];
    recommendations: string[];
  }> {
    return this.getDemandForecast(spaceId, days);
  }
}
