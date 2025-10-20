import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Between,
  FindOptionsWhere,
  In,
  LessThan,
  MoreThan,
  Repository,
} from 'typeorm';
import {
  EnhancedPricingType,
  SpacePackageEntity,
} from '../space/entities/space-inventory.entity';

import {
  BulkInventoryOperationDto,
  BulkOperationResponseDto,
  BulkOperationType,
  CalculatePricingDto,
  CreateExtrasDto,
  CreateInventoryDto,
  CreatePricingRuleDto,
  CreateSpacePackageDto,
  DiscountType,
  ExportFormat,
  ExportInventoryDto,
  ExportResponseDto,
  ExportStatus,
  ExtrasResponseDto,
  ExtrasType,
  GetExtrasDto,
  GetInventoryDto,
  GetSpacePackagesDto,
  InventoryAnalyticsDto,
  InventoryAnalyticsResponseDto,
  InventoryResponseDto,
  InventorySettingsDto,
  InventorySettingsResponseDto,
  InventoryStatus,
  InventorySummaryResponseDto,
  PackageType,
  PricingCalculationResponseDto,
  PricingRuleResponseDto,
  SpacePackageResponseDto,
  UpdateExtrasDto,
  UpdateInventoryDto,
  UpdatePricingRuleDto,
  UpdateSpacePackageDto,
} from './dto/space-inventory.dto';
import {
  ExtrasEntity,
  InventoryAuditTrailEntity,
  InventoryEntity,
  InventoryExportEntity,
  InventoryReportEntity,
  InventorySettingsEntity,
  PricingRuleEntity,
} from './entities/space-inventory.entity';

@Injectable()
export class SpaceInventoryService {
  constructor(
    @InjectRepository(SpacePackageEntity)
    private readonly spacePackageRepository: Repository<SpacePackageEntity>,
    @InjectRepository(ExtrasEntity)
    private readonly extrasRepository: Repository<ExtrasEntity>,
    @InjectRepository(InventoryEntity)
    private readonly inventoryRepository: Repository<InventoryEntity>,
    @InjectRepository(PricingRuleEntity)
    private readonly pricingRuleRepository: Repository<PricingRuleEntity>,
    @InjectRepository(InventoryAuditTrailEntity)
    private readonly auditTrailRepository: Repository<InventoryAuditTrailEntity>,
    @InjectRepository(InventoryExportEntity)
    private readonly exportRepository: Repository<InventoryExportEntity>,
    @InjectRepository(InventoryReportEntity)
    private readonly reportRepository: Repository<InventoryReportEntity>,
    @InjectRepository(InventorySettingsEntity)
    private readonly settingsRepository: Repository<InventorySettingsEntity>,
  ) {}

  // Space Package Management
  async createSpacePackage(
    createDto: CreateSpacePackageDto,
    userId: string,
  ): Promise<SpacePackageResponseDto> {
    try {
      // Convert the space-inventory PricingType to EnhancedPricingType
      let enhancedPricingType: EnhancedPricingType;
      switch (createDto.pricingType) {
        case 'fixed':
        case 'hourly':
        case 'daily':
        case 'weekly':
        case 'monthly':
        case 'yearly':
          enhancedPricingType = EnhancedPricingType.FLAT;
          break;
        case 'usage_based':
          enhancedPricingType = EnhancedPricingType.USAGE_BASED;
          break;
        default:
          enhancedPricingType = EnhancedPricingType.FLAT;
      }

      const spacePackage = this.spacePackageRepository.create({
        spaceOptionId: 'default-space-option-id', // TODO: Get from space option
        name: createDto.name,
        description: createDto.description,
        packageType: createDto.type as any, // Type assertion for enum compatibility
        pricingType: enhancedPricingType,
        basePrice: createDto.basePrice,
        maxCapacity: createDto.capacity,
        includedAmenities: createDto.amenities || [],
        features: createDto.features || [],
        advanceBookingHours: createDto.advanceBookingRequired,
        maxBookingHours: createDto.maxBookingDuration,
        termsAndConditions: createDto.termsAndConditions,
        cancellationPolicy: createDto.cancellationPolicy,
        metadata: createDto.metadata,
        isActive: createDto.isActive,
        createdBy: userId,
      });

      const savedResult = await this.spacePackageRepository.save(spacePackage);
      const savedPackage = Array.isArray(savedResult)
        ? savedResult[0]
        : savedResult;

      // Fetch the saved package with relations
      const packageWithRelations = await this.spacePackageRepository.findOne({
        where: { id: savedPackage.id },
        relations: ['inventory', 'pricingRules', 'creator'],
      });

      // Create initial inventory entry
      if (createDto.initialQuantity && createDto.initialQuantity > 0) {
        await this.createInventory(
          {
            spacePackageId: savedPackage.id,
            totalQuantity: createDto.initialQuantity,
            availableQuantity: createDto.initialQuantity,
            reservedQuantity: 0,
            status: InventoryStatus.AVAILABLE,
            lowStockThreshold: createDto.lowStockThreshold,
          },
          userId,
        );
      }

      return this.mapSpacePackageToResponse(
        packageWithRelations || savedPackage,
      );
    } catch (error) {
      if (error.code === '23505') {
        throw new ConflictException(
          'Space package with this name already exists',
        );
      }
      throw error;
    }
  }

  async getSpacePackages(queryDto: GetSpacePackagesDto): Promise<{
    data: SpacePackageResponseDto[];
    total: number;
    page: number;
    limit: number;
  }> {
    const {
      page = 1,
      limit = 10,
      search,
      type,
      location,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
    } = queryDto;

    const queryBuilder = this.spacePackageRepository
      .createQueryBuilder('package')
      .leftJoinAndSelect('package.inventory', 'inventory')
      .leftJoinAndSelect('package.pricingRules', 'pricingRules')
      .leftJoinAndSelect('package.creator', 'creator');

    if (search) {
      queryBuilder.andWhere(
        '(package.name ILIKE :search OR package.description ILIKE :search OR package.location ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    if (type) {
      queryBuilder.andWhere('package.type = :type', { type });
    }

    if (location) {
      queryBuilder.andWhere('package.location ILIKE :location', {
        location: `%${location}%`,
      });
    }

    queryBuilder.orderBy(`package.${sortBy}`, sortOrder);

    const [packages, total] = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      data: packages.map((pkg) => this.mapSpacePackageToResponse(pkg)),
      total,
      page,
      limit,
    };
  }

  async getSpacePackageById(id: string): Promise<SpacePackageResponseDto> {
    const spacePackage = await this.spacePackageRepository.findOne({
      where: { id },
      relations: ['inventory', 'pricingRules', 'creator'],
    });

    if (!spacePackage) {
      throw new NotFoundException('Space package not found');
    }

    return this.mapSpacePackageToResponse(spacePackage);
  }

  async updateSpacePackage(
    id: string,
    updateDto: UpdateSpacePackageDto,
    userId: string,
  ): Promise<SpacePackageResponseDto> {
    const spacePackage = await this.spacePackageRepository.findOne({
      where: { id },
      relations: ['inventory', 'pricingRules', 'creator'],
    });

    if (!spacePackage) {
      throw new NotFoundException('Space package not found');
    }

    Object.assign(spacePackage, updateDto, { updatedBy: userId });
    const updatedPackage = await this.spacePackageRepository.save(spacePackage);

    // Fetch updated package with relations
    const packageWithRelations = await this.spacePackageRepository.findOne({
      where: { id: updatedPackage.id },
      relations: ['inventory', 'pricingRules', 'creator'],
    });

    return this.mapSpacePackageToResponse(
      packageWithRelations || updatedPackage,
    );
  }

  async deleteSpacePackage(id: string): Promise<void> {
    const spacePackage = await this.spacePackageRepository.findOne({
      where: { id },
      relations: ['inventory'],
    });

    if (!spacePackage) {
      throw new NotFoundException('Space package not found');
    }

    // Check if there are active bookings or reservations
    const hasActiveInventory = spacePackage.inventory.some(
      (inv) => inv.reservedQuantity > 0,
    );

    if (hasActiveInventory) {
      throw new BadRequestException(
        'Cannot delete space package with active reservations',
      );
    }

    await this.spacePackageRepository.remove(spacePackage);
  }

  async activateSpacePackage(
    id: string,
    userId: string,
  ): Promise<SpacePackageResponseDto> {
    return this.updateSpacePackageStatus(id, true, userId);
  }

  async deactivateSpacePackage(
    id: string,
    userId: string,
  ): Promise<SpacePackageResponseDto> {
    return this.updateSpacePackageStatus(id, false, userId);
  }

  private async updateSpacePackageStatus(
    id: string,
    isActive: boolean,
    userId: string,
  ): Promise<SpacePackageResponseDto> {
    const spacePackage = await this.spacePackageRepository.findOne({
      where: { id },
      relations: ['inventory', 'pricingRules', 'creator'],
    });

    if (!spacePackage) {
      throw new NotFoundException('Space package not found');
    }

    spacePackage.isActive = isActive;
    spacePackage.updatedBy = userId;
    const updatedPackage = await this.spacePackageRepository.save(spacePackage);

    // Fetch updated package with relations
    const packageWithRelations = await this.spacePackageRepository.findOne({
      where: { id: updatedPackage.id },
      relations: ['inventory', 'pricingRules', 'creator'],
    });

    return this.mapSpacePackageToResponse(
      packageWithRelations || updatedPackage,
    );
  }

  // Extras Management
  async createExtras(
    createDto: CreateExtrasDto,
    userId: string,
  ): Promise<ExtrasResponseDto> {
    try {
      const extras = this.extrasRepository.create({
        ...createDto,
        createdBy: userId,
      });

      const savedExtras = await this.extrasRepository.save(extras);
      return this.mapExtrasToResponse(savedExtras);
    } catch (error) {
      if (error.code === '23505') {
        throw new ConflictException('Extras with this name already exists');
      }
      throw error;
    }
  }

  async getExtras(queryDto: GetExtrasDto): Promise<{
    data: ExtrasResponseDto[];
    total: number;
    page: number;
    limit: number;
  }> {
    const {
      page = 1,
      limit = 10,
      search,
      type,
      category,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
    } = queryDto;

    const queryBuilder = this.extrasRepository
      .createQueryBuilder('extras')
      .leftJoinAndSelect('extras.pricingRules', 'pricingRules')
      .leftJoinAndSelect('extras.creator', 'creator');

    if (search) {
      queryBuilder.andWhere(
        '(extras.name ILIKE :search OR extras.description ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    if (type) {
      queryBuilder.andWhere('extras.type = :type', { type });
    }

    if (category) {
      queryBuilder.andWhere('extras.category ILIKE :category', {
        category: `%${category}%`,
      });
    }

    queryBuilder.orderBy(`extras.${sortBy}`, sortOrder);

    const [extras, total] = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      data: extras.map((extra) => this.mapExtrasToResponse(extra)),
      total,
      page,
      limit,
    };
  }

  async getExtrasById(id: string): Promise<ExtrasResponseDto> {
    const extras = await this.extrasRepository.findOne({
      where: { id },
      relations: ['pricingRules', 'creator'],
    });

    if (!extras) {
      throw new NotFoundException('Extras not found');
    }

    return this.mapExtrasToResponse(extras);
  }

  async updateExtras(
    id: string,
    updateDto: UpdateExtrasDto,
    userId: string,
  ): Promise<ExtrasResponseDto> {
    const extras = await this.extrasRepository.findOne({ where: { id } });

    if (!extras) {
      throw new NotFoundException('Extras not found');
    }

    Object.assign(extras, updateDto, { updatedBy: userId });
    const updatedExtras = await this.extrasRepository.save(extras);

    return this.mapExtrasToResponse(updatedExtras);
  }

  async deleteExtras(id: string): Promise<void> {
    const extras = await this.extrasRepository.findOne({ where: { id } });

    if (!extras) {
      throw new NotFoundException('Extras not found');
    }

    await this.extrasRepository.remove(extras);
  }

  // Inventory Management
  async createInventory(
    createDto: CreateInventoryDto,
    userId: string,
  ): Promise<InventoryResponseDto> {
    const spacePackage = await this.spacePackageRepository.findOne({
      where: { id: createDto.spacePackageId },
    });

    if (!spacePackage) {
      throw new NotFoundException('Space package not found');
    }

    const inventory = this.inventoryRepository.create({
      ...createDto,
      createdBy: userId,
    });

    const savedInventory = await this.inventoryRepository.save(inventory);

    // Create audit trail
    await this.createAuditTrail(
      savedInventory.id,
      'CREATE',
      null,
      savedInventory,
      'Inventory created',
      userId,
    );

    return this.mapInventoryToResponse(savedInventory);
  }

  async getInventory(queryDto: GetInventoryDto): Promise<{
    data: InventoryResponseDto[];
    total: number;
    page: number;
    limit: number;
  }> {
    const {
      page = 1,
      limit = 10,
      spacePackageId,
      status,
      lowStock,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
    } = queryDto;

    const queryBuilder = this.inventoryRepository
      .createQueryBuilder('inventory')
      .leftJoinAndSelect('inventory.spacePackage', 'spacePackage')
      .leftJoinAndSelect('inventory.creator', 'creator');

    if (spacePackageId) {
      queryBuilder.andWhere('inventory.spacePackageId = :spacePackageId', {
        spacePackageId,
      });
    }

    if (status) {
      queryBuilder.andWhere('inventory.status = :status', { status });
    }

    if (lowStock) {
      queryBuilder.andWhere(
        'inventory.lowStockThreshold IS NOT NULL AND inventory.availableQuantity <= inventory.lowStockThreshold',
      );
    }

    queryBuilder.orderBy(`inventory.${sortBy}`, sortOrder);

    const [inventory, total] = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      data: inventory.map((inv) => this.mapInventoryToResponse(inv)),
      total,
      page,
      limit,
    };
  }

  async getInventoryById(id: string): Promise<InventoryResponseDto> {
    const inventory = await this.inventoryRepository.findOne({
      where: { id },
      relations: ['spacePackage', 'creator', 'auditTrail'],
    });

    if (!inventory) {
      throw new NotFoundException('Inventory not found');
    }

    return this.mapInventoryToResponse(inventory);
  }

  async updateInventory(
    id: string,
    updateDto: UpdateInventoryDto,
    userId: string,
  ): Promise<InventoryResponseDto> {
    const inventory = await this.inventoryRepository.findOne({ where: { id } });

    if (!inventory) {
      throw new NotFoundException('Inventory not found');
    }

    const oldValues = { ...inventory };
    Object.assign(inventory, updateDto, { updatedBy: userId });
    const updatedInventory = await this.inventoryRepository.save(inventory);

    // Create audit trail
    await this.createAuditTrail(
      id,
      'UPDATE',
      oldValues,
      updatedInventory,
      'Inventory updated',
      userId,
    );

    return this.mapInventoryToResponse(updatedInventory);
  }

  async deleteInventory(id: string): Promise<void> {
    const inventory = await this.inventoryRepository.findOne({ where: { id } });

    if (!inventory) {
      throw new NotFoundException('Inventory not found');
    }

    if (inventory.reservedQuantity > 0) {
      throw new BadRequestException(
        'Cannot delete inventory with active reservations',
      );
    }

    await this.inventoryRepository.remove(inventory);
  }

  async adjustStock(
    id: string,
    quantity: number,
    reason: string,
    userId: string,
  ): Promise<InventoryResponseDto> {
    const inventory = await this.inventoryRepository.findOne({ where: { id } });

    if (!inventory) {
      throw new NotFoundException('Inventory not found');
    }

    const oldValues = { ...inventory };
    inventory.adjustStock(quantity);
    inventory.updatedBy = userId;
    const updatedInventory = await this.inventoryRepository.save(inventory);

    // Create audit trail
    await this.createAuditTrail(
      id,
      'STOCK_ADJUSTMENT',
      oldValues,
      updatedInventory,
      reason,
      userId,
    );

    return this.mapInventoryToResponse(updatedInventory);
  }

  async reserveInventory(
    id: string,
    quantity: number,
    userId: string,
  ): Promise<InventoryResponseDto> {
    const inventory = await this.inventoryRepository.findOne({ where: { id } });

    if (!inventory) {
      throw new NotFoundException('Inventory not found');
    }

    const oldValues = { ...inventory };
    inventory.reserve(quantity);
    inventory.updatedBy = userId;
    const updatedInventory = await this.inventoryRepository.save(inventory);

    // Create audit trail
    await this.createAuditTrail(
      id,
      'RESERVE',
      oldValues,
      updatedInventory,
      `Reserved ${quantity} units`,
      userId,
    );

    return this.mapInventoryToResponse(updatedInventory);
  }

  async releaseInventory(
    id: string,
    quantity: number,
    userId: string,
  ): Promise<InventoryResponseDto> {
    const inventory = await this.inventoryRepository.findOne({ where: { id } });

    if (!inventory) {
      throw new NotFoundException('Inventory not found');
    }

    const oldValues = { ...inventory };
    inventory.release(quantity);
    inventory.updatedBy = userId;
    const updatedInventory = await this.inventoryRepository.save(inventory);

    // Create audit trail
    await this.createAuditTrail(
      id,
      'RELEASE',
      oldValues,
      updatedInventory,
      `Released ${quantity} units`,
      userId,
    );

    return this.mapInventoryToResponse(updatedInventory);
  }

  // Bulk Operations
  async bulkInventoryOperation(
    operationDto: BulkInventoryOperationDto,
    userId: string,
  ): Promise<BulkOperationResponseDto> {
    const { operation, inventoryIds, data } = operationDto;
    const results = [];
    const errors = [];

    for (const inventoryId of inventoryIds) {
      try {
        let result;
        switch (operation) {
          case BulkOperationType.UPDATE_STATUS:
            result = await this.updateInventory(
              inventoryId,
              { status: data.status },
              userId,
            );
            break;
          case BulkOperationType.ADJUST_STOCK:
            result = await this.adjustStock(
              inventoryId,
              data.quantity,
              data.reason || 'Bulk stock adjustment',
              userId,
            );
            break;
          case BulkOperationType.DELETE:
            await this.deleteInventory(inventoryId);
            result = { id: inventoryId, deleted: true };
            break;
          default:
            throw new BadRequestException(
              `Unsupported operation: ${operation}`,
            );
        }
        results.push({ id: inventoryId, success: true, data: result });
      } catch (error) {
        errors.push({
          id: inventoryId,
          success: false,
          error: error.message,
        });
      }
    }

    return {
      totalProcessed: inventoryIds.length,
      successCount: results.length,
      failureCount: errors.length,
      errors: errors.map((e) => e.error),
      details: { results, errors },
    };
  }

  // Pricing Management
  async createPricingRule(
    createDto: CreatePricingRuleDto,
    userId: string,
  ): Promise<PricingRuleResponseDto> {
    const pricingRule = this.pricingRuleRepository.create({
      ...createDto,
      createdBy: userId,
    });

    const savedRule = await this.pricingRuleRepository.save(pricingRule);
    return this.mapPricingRuleToResponse(savedRule);
  }

  async getPricingRules(
    spacePackageId?: string,
    extrasId?: string,
  ): Promise<PricingRuleResponseDto[]> {
    const where: FindOptionsWhere<PricingRuleEntity> = { isActive: true };

    if (spacePackageId) {
      where.spacePackageId = spacePackageId;
    }

    if (extrasId) {
      where.extrasId = extrasId;
    }

    const rules = await this.pricingRuleRepository.find({
      where,
      relations: ['spacePackage', 'extras', 'creator'],
      order: { createdAt: 'DESC' },
    });

    return rules.map((rule) => this.mapPricingRuleToResponse(rule));
  }

  async updatePricingRule(
    id: string,
    updateDto: UpdatePricingRuleDto,
    userId: string,
  ): Promise<PricingRuleResponseDto> {
    const pricingRule = await this.pricingRuleRepository.findOne({
      where: { id },
    });

    if (!pricingRule) {
      throw new NotFoundException('Pricing rule not found');
    }

    Object.assign(pricingRule, updateDto, { updatedBy: userId });
    const updatedRule = await this.pricingRuleRepository.save(pricingRule);

    return this.mapPricingRuleToResponse(updatedRule);
  }

  async deletePricingRule(id: string): Promise<void> {
    const pricingRule = await this.pricingRuleRepository.findOne({
      where: { id },
    });

    if (!pricingRule) {
      throw new NotFoundException('Pricing rule not found');
    }

    await this.pricingRuleRepository.remove(pricingRule);
  }

  async calculatePricing(
    calculationDto: CalculatePricingDto,
  ): Promise<PricingCalculationResponseDto> {
    const { spacePackageId, extrasIds, quantity, duration, startDate } =
      calculationDto;
    const bookingDate = startDate ? new Date(startDate) : new Date();

    let totalPrice = 0;
    let totalDiscount = 0;
    const breakdown = [];

    // Calculate space package price
    if (spacePackageId) {
      const spacePackage = await this.spacePackageRepository.findOne({
        where: { id: spacePackageId },
        relations: ['pricingRules'],
      });

      if (!spacePackage) {
        throw new NotFoundException('Space package not found');
      }

      const basePrice = spacePackage.calculatePrice(duration, quantity);
      let packageDiscount = 0;

      // Apply pricing rules
      const applicableRules = spacePackage.pricingRules.filter(
        (rule) =>
          rule.isApplicable(quantity, duration) &&
          rule.isValidForDate(bookingDate),
      );

      for (const rule of applicableRules) {
        packageDiscount += rule.calculateDiscount(basePrice, quantity);
      }

      const finalPrice = Math.max(0, basePrice - packageDiscount);
      totalPrice += finalPrice;
      totalDiscount += packageDiscount;

      breakdown.push({
        type: 'space_package',
        id: spacePackage.id,
        name: spacePackage.name,
        basePrice,
        discount: packageDiscount,
        finalPrice,
        quantity,
        duration,
      });
    }

    // Calculate extras prices
    if (extrasIds && extrasIds.length > 0) {
      const extras = await this.extrasRepository.find({
        where: { id: In(extrasIds) },
        relations: ['pricingRules'],
      });

      for (const extra of extras) {
        const basePrice = extra.calculatePrice(duration, quantity);
        let extrasDiscount = 0;

        // Apply pricing rules
        const applicableRules = extra.pricingRules.filter(
          (rule) =>
            rule.isApplicable(quantity, duration) &&
            rule.isValidForDate(bookingDate),
        );

        for (const rule of applicableRules) {
          extrasDiscount += rule.calculateDiscount(basePrice, quantity);
        }

        const finalPrice = Math.max(0, basePrice - extrasDiscount);
        totalPrice += finalPrice;
        totalDiscount += extrasDiscount;

        breakdown.push({
          type: 'extras',
          id: extra.id,
          name: extra.name,
          basePrice,
          discount: extrasDiscount,
          finalPrice,
          quantity,
          duration,
        });
      }
    }

    return {
      basePrice: totalPrice - totalDiscount,
      extrasPrice: 0, // Calculate from breakdown if needed
      subtotal: totalPrice - totalDiscount,
      discountAmount: totalDiscount,
      taxAmount: 0, // Calculate tax if needed
      totalPrice: totalPrice,
      appliedRules: [], // Map from applicable rules if needed
      breakdown,
    };
  }

  // Analytics and Reporting
  async getInventoryAnalytics(
    analyticsDto: InventoryAnalyticsDto,
  ): Promise<InventoryAnalyticsResponseDto> {
    const { startDate, endDate, location, groupBy } = analyticsDto;

    const queryBuilder = this.inventoryRepository
      .createQueryBuilder('inventory')
      .leftJoin('inventory.spacePackage', 'spacePackage')
      .leftJoin('inventory.auditTrail', 'auditTrail');

    if (location) {
      queryBuilder.andWhere('spacePackage.space.location LIKE :location', {
        location: `%${location}%`,
      });
    }

    if (startDate) {
      queryBuilder.andWhere('inventory.createdAt >= :startDate', { startDate });
    }

    if (endDate) {
      queryBuilder.andWhere('inventory.createdAt <= :endDate', { endDate });
    }

    const inventory = await queryBuilder.getMany();

    // Calculate analytics
    const totalInventory = inventory.length;
    const totalQuantity = inventory.reduce(
      (sum, inv) => sum + inv.totalQuantity,
      0,
    );
    const availableQuantity = inventory.reduce(
      (sum, inv) => sum + inv.availableQuantity,
      0,
    );
    const reservedQuantity = inventory.reduce(
      (sum, inv) => sum + inv.reservedQuantity,
      0,
    );
    const lowStockItems = inventory.filter((inv) => inv.isLowStock).length;
    const outOfStockItems = inventory.filter(
      (inv) => inv.availableQuantity === 0,
    ).length;
    const utilizationRate =
      totalQuantity > 0
        ? ((totalQuantity - availableQuantity) / totalQuantity) * 100
        : 0;

    // Group by logic would be implemented based on requirements
    const groupedData = this.groupInventoryData(inventory, groupBy);

    return {
      totalSpaces: totalInventory,
      availableSpaces: availableQuantity,
      occupiedSpaces: totalQuantity - availableQuantity,
      reservedSpaces: reservedQuantity,
      utilizationRate,
      revenuePerSpace: 0, // Would need booking data to calculate
      popularSpaceTypes: {},
      lowStockAlerts: lowStockItems,
      trends: groupedData,
      period: {
        startDate: startDate ? new Date(startDate) : new Date(),
        endDate: endDate ? new Date(endDate) : new Date(),
      },
    };
  }

  async getInventorySummary(): Promise<InventorySummaryResponseDto> {
    const [totalPackages, totalExtras, totalInventory] = await Promise.all([
      this.spacePackageRepository.count({ where: { isActive: true } }),
      this.extrasRepository.count({ where: { isActive: true } }),
      this.inventoryRepository.count(),
    ]);

    const lowStockInventory = await this.inventoryRepository.count({
      where: {
        status: InventoryStatus.AVAILABLE,
      },
    });

    const outOfStockInventory = await this.inventoryRepository.count({
      where: {
        availableQuantity: 0,
      },
    });

    return {
      totalItems: totalInventory,
      activeItems: totalPackages + totalExtras,
      inactiveItems: 0, // Would need to calculate based on isActive flags
      lowStockItems: lowStockInventory,
      outOfStockItems: outOfStockInventory,
      totalValue: 0, // Would need pricing data to calculate
      statusBreakdown: {},
      locationBreakdown: {},
      typeBreakdown: { packages: totalPackages, extras: totalExtras },
    };
  }

  // Export and Download
  async exportInventory(
    exportDto: ExportInventoryDto,
    userId: string,
  ): Promise<ExportResponseDto> {
    const exportEntity = this.exportRepository.create({
      format: exportDto.format,
      filters: exportDto.filters,
      fields: exportDto.fields,
      includeRelated: exportDto.includeRelated || false,
      createdBy: userId,
    });

    const savedExport = await this.exportRepository.save(exportEntity);

    // In a real implementation, this would trigger an async job
    // For now, we'll simulate the export process
    setTimeout(async () => {
      try {
        // Simulate export processing
        const downloadUrl = await this.processExport(savedExport.id, exportDto);

        await this.exportRepository.update(savedExport.id, {
          status: ExportStatus.COMPLETED,
          downloadUrl,
          completedAt: new Date(),
          recordCount: 100, // This would be the actual count
          fileSize: 1024 * 1024, // This would be the actual file size
        });
      } catch (error) {
        await this.exportRepository.update(savedExport.id, {
          status: ExportStatus.FAILED,
          errorMessage: error.message,
        });
      }
    }, 1000);

    return {
      exportId: savedExport.id,
      status: savedExport.status,
      format: savedExport.format,
      createdAt: savedExport.createdAt,
    };
  }

  async getExportStatus(exportId: string): Promise<ExportResponseDto> {
    const exportEntity = await this.exportRepository.findOne({
      where: { id: exportId },
    });

    if (!exportEntity) {
      throw new NotFoundException('Export not found');
    }

    return {
      exportId: exportEntity.id,
      status: exportEntity.status,
      format: exportEntity.format,
      downloadUrl: exportEntity.downloadUrl,
      recordCount: exportEntity.recordCount,
      fileSize: exportEntity.fileSize,
      completedAt: exportEntity.completedAt,
      expiresAt: exportEntity.expiresAt,
      errorMessage: exportEntity.errorMessage,
      createdAt: exportEntity.createdAt,
    };
  }

  async downloadExport(exportId: string): Promise<string> {
    const exportEntity = await this.exportRepository.findOne({
      where: { id: exportId },
    });

    if (!exportEntity) {
      throw new NotFoundException('Export not found');
    }

    if (!exportEntity.canDownload()) {
      throw new BadRequestException('Export is not available for download');
    }

    return exportEntity.downloadUrl;
  }

  // Settings Management
  async getInventorySettings(): Promise<InventorySettingsResponseDto> {
    const settings = await this.settingsRepository.findOne({
      where: {},
      order: { createdAt: 'DESC' },
    });

    if (!settings) {
      // Return default settings
      return {
        id: null,
        defaultLowStockThreshold: 10,
        autoReorderEnabled: false,
        defaultReorderQuantity: 50,
        notificationSettings: {
          lowStockAlerts: true,
          outOfStockAlerts: true,
          reorderAlerts: false,
        },
        pricingSettings: {
          allowDynamicPricing: true,
          maxDiscountPercentage: 50,
        },
        bookingSettings: {
          allowOverbooking: false,
          maxAdvanceBookingDays: 365,
        },
        integrationSettings: {},
        updatedAt: new Date(),
      };
    }

    return this.mapSettingsToResponse(settings);
  }

  async updateInventorySettings(
    settingsDto: InventorySettingsDto,
    userId: string,
  ): Promise<InventorySettingsResponseDto> {
    let settings = await this.settingsRepository.findOne({
      where: {},
      order: { createdAt: 'DESC' },
    });

    if (!settings) {
      settings = this.settingsRepository.create({
        ...settingsDto,
        updatedBy: userId,
      });
    } else {
      Object.assign(settings, settingsDto, { updatedBy: userId });
    }

    const savedSettings = await this.settingsRepository.save(settings);
    return this.mapSettingsToResponse(savedSettings);
  }

  // Utility Methods
  async getPackageTypes(): Promise<string[]> {
    return Object.values(PackageType);
  }

  async getExtrasTypes(): Promise<string[]> {
    return Object.values(ExtrasType);
  }

  async getInventoryStatuses(): Promise<string[]> {
    return Object.values(InventoryStatus);
  }

  async validatePackageAvailability(
    spacePackageId: string,
    quantity: number,
    startDate: Date,
    endDate: Date,
  ): Promise<boolean> {
    const inventory = await this.inventoryRepository.findOne({
      where: { spacePackageId },
    });

    if (!inventory) {
      return false;
    }

    return inventory.canReserve(quantity);
  }

  async checkSpaceAvailability(
    spacePackageId: string,
    quantity: number,
  ): Promise<{ available: boolean; availableQuantity: number }> {
    const inventory = await this.inventoryRepository.findOne({
      where: { spacePackageId },
    });

    if (!inventory) {
      return { available: false, availableQuantity: 0 };
    }

    return {
      available: inventory.canReserve(quantity),
      availableQuantity: inventory.availableQuantity,
    };
  }

  async validateSpacePackage(
    packageData: any,
  ): Promise<{ isValid: boolean; errors: string[] }> {
    const errors: string[] = [];

    // Basic validation
    if (!packageData.name || packageData.name.trim().length === 0) {
      errors.push('Package name is required');
    }

    if (!packageData.basePrice || packageData.basePrice <= 0) {
      errors.push('Base price must be greater than 0');
    }

    if (!packageData.capacity || packageData.capacity <= 0) {
      errors.push('Capacity must be greater than 0');
    }

    if (packageData.minBookingDuration && packageData.maxBookingDuration) {
      if (packageData.minBookingDuration > packageData.maxBookingDuration) {
        errors.push('Minimum booking duration cannot be greater than maximum');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  // Private Helper Methods
  private async createAuditTrail(
    inventoryId: string,
    action: string,
    oldValues: any,
    newValues: any,
    reason: string,
    userId: string,
  ): Promise<void> {
    const auditTrail = this.auditTrailRepository.create({
      inventoryId,
      action,
      oldValues,
      newValues,
      reason,
      createdBy: userId,
    });

    await this.auditTrailRepository.save(auditTrail);
  }

  private async processExport(
    exportId: string,
    exportDto: ExportInventoryDto,
  ): Promise<string> {
    // This would implement the actual export logic
    // For now, return a mock URL
    return `https://example.com/exports/${exportId}.${exportDto.format}`;
  }

  private groupInventoryData(
    inventory: InventoryEntity[],
    groupBy?: string,
  ): any[] {
    // Implementation would depend on groupBy parameter
    // For now, return empty array
    return [];
  }

  // Mapping Methods

  private mapSpacePackageToResponse(
    spacePackage: SpacePackageEntity,
  ): SpacePackageResponseDto {
    return {
      id: spacePackage.id,
      name: spacePackage.name,
      description: spacePackage.description,
      type: spacePackage.packageType as any,
      basePrice: spacePackage.basePrice,
      pricingType: spacePackage.pricingType as any,
      capacity: spacePackage.maxCapacity,
      area: null, // Not available in current entity
      location: null, // Not available in current entity
      floor: null, // Not available in current entity
      roomNumber: null, // Not available in current entity
      features: spacePackage.features,
      amenities: spacePackage.includedAmenities,
      images: [], // Not available in current entity
      minBookingDuration: spacePackage.advanceBookingHours,
      maxBookingDuration: spacePackage.maxBookingHours,
      advanceBookingRequired: spacePackage.advanceBookingHours || 0,
      cancellationPolicy: spacePackage.cancellationPolicy,
      termsAndConditions: spacePackage.termsAndConditions,
      metadata: spacePackage.metadata,
      isActive: spacePackage.isActive,
      createdAt: spacePackage.createdAt,
      updatedAt: spacePackage.updatedAt,
      createdBy: spacePackage.createdBy,
      updatedBy: spacePackage.updatedBy,
    };
  }

  private mapExtrasToResponse(extras: ExtrasEntity): ExtrasResponseDto {
    return {
      id: extras.id,
      name: extras.name,
      description: extras.description,
      type: extras.type,
      price: extras.price,
      pricingType: extras.pricingType,
      quantity: extras.quantity,
      category: extras.category,
      tags: extras.tags,
      images: extras.images,
      metadata: extras.metadata,
      isActive: extras.isActive,
      createdAt: extras.createdAt,
      updatedAt: extras.updatedAt,
      createdBy: extras.createdBy,
      updatedBy: extras.updatedBy,
    };
  }

  private mapInventoryToResponse(
    inventory: InventoryEntity,
  ): InventoryResponseDto {
    return {
      id: inventory.id,
      spacePackageId: inventory.spacePackageId,
      spacePackage: inventory.spacePackage
        ? this.mapSpacePackageToResponse(inventory.spacePackage)
        : null,
      totalQuantity: inventory.totalQuantity,
      availableQuantity: inventory.availableQuantity,
      reservedQuantity: inventory.reservedQuantity,
      status: inventory.status,
      lowStockThreshold: inventory.lowStockThreshold,
      reorderPoint: inventory.reorderPoint,
      maxStockLevel: inventory.maxStockLevel,
      locationDetails: inventory.locationDetails,
      notes: inventory.notes,
      metadata: inventory.metadata,
      createdAt: inventory.createdAt,
      updatedAt: inventory.updatedAt,
      createdBy: inventory.createdBy,
      updatedBy: inventory.updatedBy,
    };
  }

  private mapPricingRuleToResponse(
    rule: PricingRuleEntity,
  ): PricingRuleResponseDto {
    return {
      id: rule.id,
      name: rule.name,
      description: rule.description,
      spacePackageId: rule.spacePackageId,
      extrasId: rule.extrasId,
      discountType: rule.discountType,
      discountValue: rule.discountValue,
      minQuantity: rule.minQuantity,
      maxQuantity: rule.maxQuantity,
      minDuration: rule.minDuration,
      validFrom: rule.validFrom,
      validUntil: rule.validUntil,
      conditions: rule.conditions,
      isActive: rule.isActive,
      createdAt: rule.createdAt,
      updatedAt: rule.updatedAt,
      createdBy: rule.createdBy,
      updatedBy: rule.updatedBy,
    };
  }

  private mapSettingsToResponse(
    settings: InventorySettingsEntity,
  ): InventorySettingsResponseDto {
    return {
      id: settings.id,
      defaultLowStockThreshold: settings.defaultLowStockThreshold,
      autoReorderEnabled: settings.autoReorderEnabled,
      defaultReorderQuantity: settings.defaultReorderQuantity,
      notificationSettings: settings.notificationSettings,
      pricingSettings: settings.pricingSettings,
      bookingSettings: settings.bookingSettings,
      integrationSettings: settings.integrationSettings,
      updatedAt: settings.updatedAt,
      updatedBy: settings.updatedBy,
    };
  }
}
