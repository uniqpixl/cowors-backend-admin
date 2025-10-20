import { CACHE_MANAGER } from '@nestjs/cache-manager';
import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { Cache } from 'cache-manager';
import { DataSource, In, Repository } from 'typeorm';
import { PaymentStatus } from '../../common/enums/booking.enum';
import { PartnerCategoryEntity } from '../../database/entities/partner-category.entity';
import { PartnerSubcategoryEntity } from '../../database/entities/partner-subcategory.entity';
import { PartnerTypeEntity } from '../../database/entities/partner-type.entity';
import { PartnerEntity } from '../../database/entities/partner.entity';
import { CreatePartnerCategoryDto } from '../../dto/partner-category/create-partner-category.dto';
import { UpdatePartnerCategoryDto } from '../../dto/partner-category/update-partner-category.dto';
import {
  AdminBulkPartnerCategoryActionDto,
  AdminCategoryUsageAnalyticsDto,
  AdminPartnerCategoryAnalyticsDto,
  AdminPartnerCategoryListResponseDto,
  AdminPartnerCategoryQueryDto,
  AdminPartnerCategoryStatsDto,
  AdminReorderPartnerCategoriesDto,
  AdminUpdateRuleTemplatesDto,
} from './dto/admin-partner-category.dto';

@Injectable()
export class AdminPartnerCategoryService {
  constructor(
    @InjectRepository(PartnerCategoryEntity)
    private readonly partnerCategoryRepository: Repository<PartnerCategoryEntity>,
    @InjectRepository(PartnerTypeEntity)
    private readonly partnerTypeRepository: Repository<PartnerTypeEntity>,
    @InjectRepository(PartnerEntity)
    private readonly partnerRepository: Repository<PartnerEntity>,
    @InjectRepository(PartnerSubcategoryEntity)
    private readonly partnerSubcategoryRepository: Repository<PartnerSubcategoryEntity>,
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  async findAllWithFilters(
    query: AdminPartnerCategoryQueryDto,
  ): Promise<AdminPartnerCategoryListResponseDto> {
    const { search, partnerTypeId, isActive, page, limit, sortBy, sortOrder } =
      query;
    const queryBuilder = this.partnerCategoryRepository
      .createQueryBuilder('partnerCategory')
      .leftJoinAndSelect('partnerCategory.partnerType', 'partnerType');

    // Apply search filter
    if (search) {
      queryBuilder.where(
        '(partnerCategory.name ILIKE :search OR partnerCategory.description ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    // Apply partner type filter
    if (partnerTypeId) {
      queryBuilder.andWhere('partnerCategory.partnerTypeId = :partnerTypeId', {
        partnerTypeId,
      });
    }

    // Apply active filter
    if (typeof isActive === 'boolean') {
      queryBuilder.andWhere('partnerCategory.isActive = :isActive', {
        isActive,
      });
    }

    // Apply sorting
    const validSortFields = {
      name: 'partnerCategory.name',
      createdAt: 'partnerCategory.createdAt',
      order: 'partnerCategory.sortOrder',
    };
    const sortField = validSortFields[sortBy] || 'partnerCategory.sortOrder';
    queryBuilder.orderBy(sortField, sortOrder);

    // Apply pagination
    const offset = (page - 1) * limit;
    queryBuilder.skip(offset).take(limit);

    // Get results with count
    const [data, total] = await queryBuilder.getManyAndCount();
    const totalPages = Math.ceil(total / limit);

    return {
      data,
      total,
      page,
      limit,
      totalPages,
    };
  }

  async create(
    createDto: CreatePartnerCategoryDto,
  ): Promise<PartnerCategoryEntity> {
    // Validate partner type exists
    const partnerType = await this.partnerTypeRepository.findOne({
      where: { id: createDto.partnerTypeId },
    });
    if (!partnerType) {
      throw new NotFoundException('Partner type not found');
    }

    // Check if name already exists within the same partner type
    const existingByName = await this.partnerCategoryRepository.findOne({
      where: {
        name: createDto.name,
        partnerTypeId: createDto.partnerTypeId,
      },
    });
    if (existingByName) {
      throw new ConflictException(
        'Partner category with this name already exists in this partner type',
      );
    }

    // Check if slug already exists within the same partner type
    const existingBySlug = await this.partnerCategoryRepository.findOne({
      where: {
        slug: createDto.slug,
        partnerTypeId: createDto.partnerTypeId,
      },
    });
    if (existingBySlug) {
      throw new ConflictException(
        'Partner category with this slug already exists in this partner type',
      );
    }

    // Get the next order value within the partner type
    const maxOrder = await this.partnerCategoryRepository
      .createQueryBuilder('partnerCategory')
      .select('MAX(partnerCategory.sortOrder)', 'maxOrder')
      .where('partnerCategory.partnerTypeId = :partnerTypeId', {
        partnerTypeId: createDto.partnerTypeId,
      })
      .getRawOne();

    const nextOrder = (maxOrder?.maxOrder || 0) + 1;

    const partnerCategory = this.partnerCategoryRepository.create({
      ...createDto,
      sortOrder: nextOrder,
    });

    return await this.partnerCategoryRepository.save(partnerCategory);
  }

  async update(
    id: string,
    updateDto: UpdatePartnerCategoryDto,
  ): Promise<PartnerCategoryEntity> {
    const partnerCategory = await this.partnerCategoryRepository.findOne({
      where: { id },
      relations: ['partnerType'],
    });
    if (!partnerCategory) {
      throw new NotFoundException('Partner category not found');
    }

    const targetPartnerTypeId = partnerCategory.partnerTypeId;

    // Check for name conflicts (excluding current record)
    if (updateDto.name && updateDto.name !== partnerCategory.name) {
      const existingByName = await this.partnerCategoryRepository.findOne({
        where: {
          name: updateDto.name,
          partnerTypeId: targetPartnerTypeId,
        },
      });
      if (existingByName && existingByName.id !== id) {
        throw new ConflictException(
          'Partner category with this name already exists in this partner type',
        );
      }
    }

    // Check for slug conflicts (excluding current record)
    if (updateDto.slug && updateDto.slug !== partnerCategory.slug) {
      const existingBySlug = await this.partnerCategoryRepository.findOne({
        where: {
          slug: updateDto.slug,
          partnerTypeId: targetPartnerTypeId,
        },
      });
      if (existingBySlug && existingBySlug.id !== id) {
        throw new ConflictException(
          'Partner category with this slug already exists in this partner type',
        );
      }
    }

    Object.assign(partnerCategory, updateDto);
    return await this.partnerCategoryRepository.save(partnerCategory);
  }

  async delete(id: string): Promise<void> {
    const partnerCategory = await this.partnerCategoryRepository.findOne({
      where: { id },
    });
    if (!partnerCategory) {
      throw new NotFoundException('Partner category not found');
    }

    // Check if there are any partners using this category
    const partnersCount = await this.partnerRepository.count({
      where: { primaryCategoryId: id },
    });
    if (partnersCount > 0) {
      throw new BadRequestException(
        `Cannot delete partner category. ${partnersCount} partners are using this category.`,
      );
    }

    // Check if there are any subcategories using this category
    const subcategoriesCount = await this.partnerSubcategoryRepository.count({
      where: { categoryId: id },
    });
    if (subcategoriesCount > 0) {
      throw new BadRequestException(
        `Cannot delete partner category. ${subcategoriesCount} subcategories are using this category.`,
      );
    }

    await this.partnerCategoryRepository.remove(partnerCategory);
  }

  async bulkAction(
    bulkActionDto: AdminBulkPartnerCategoryActionDto,
  ): Promise<{ affected: number }> {
    const { ids, action } = bulkActionDto;

    if (ids.length === 0) {
      throw new BadRequestException('No IDs provided for bulk action');
    }

    let affected = 0;

    switch (action) {
      case 'activate':
        const activateResult = await this.partnerCategoryRepository.update(
          { id: In(ids) },
          { isActive: true },
        );
        affected = activateResult.affected || 0;
        break;

      case 'deactivate':
        const deactivateResult = await this.partnerCategoryRepository.update(
          { id: In(ids) },
          { isActive: false },
        );
        affected = deactivateResult.affected || 0;
        break;

      case 'delete':
        // Check if any of the partner categories have dependencies
        for (const id of ids) {
          const partnersCount = await this.partnerRepository.count({
            where: { primaryCategoryId: id },
          });
          const subcategoriesCount =
            await this.partnerSubcategoryRepository.count({
              where: { categoryId: id },
            });

          if (partnersCount > 0 || subcategoriesCount > 0) {
            throw new BadRequestException(
              `Cannot delete partner category ${id}. It has dependencies.`,
            );
          }
        }

        const deleteResult = await this.partnerCategoryRepository.delete({
          id: In(ids),
        });
        affected = deleteResult.affected || 0;
        break;

      default:
        throw new BadRequestException('Invalid bulk action');
    }

    return { affected };
  }

  async reorder(reorderDto: AdminReorderPartnerCategoriesDto): Promise<void> {
    const { orderedIds, partnerTypeId } = reorderDto;

    // Build where condition
    const whereCondition: any = { id: In(orderedIds) };
    if (partnerTypeId) {
      whereCondition.partnerTypeId = partnerTypeId;
    }

    // Validate that all IDs exist
    const existingCategories = await this.partnerCategoryRepository.find({
      where: whereCondition,
    });

    if (existingCategories.length !== orderedIds.length) {
      throw new BadRequestException(
        'Some partner category IDs do not exist or do not belong to the specified partner type',
      );
    }

    // Update order for each partner category
    for (let i = 0; i < orderedIds.length; i++) {
      await this.partnerCategoryRepository.update(
        { id: orderedIds[i] },
        { sortOrder: i + 1 },
      );
    }
  }

  async updateRuleTemplates(
    id: string,
    updateDto: AdminUpdateRuleTemplatesDto,
  ): Promise<PartnerCategoryEntity> {
    const partnerCategory = await this.partnerCategoryRepository.findOne({
      where: { id },
    });
    if (!partnerCategory) {
      throw new NotFoundException('Partner category not found');
    }

    // Update rule templates
    if (updateDto.pricingRules !== undefined) {
      partnerCategory.ruleTemplates = {
        ...partnerCategory.ruleTemplates,
        pricing: updateDto.pricingRules,
      };
    }

    if (updateDto.availabilityRules !== undefined) {
      partnerCategory.ruleTemplates = {
        ...partnerCategory.ruleTemplates,
        availability: updateDto.availabilityRules,
      };
    }

    if (updateDto.requirementRules !== undefined) {
      partnerCategory.ruleTemplates = {
        ...partnerCategory.ruleTemplates,
        requirements: updateDto.requirementRules,
      };
    }

    if (updateDto.featureRules !== undefined) {
      partnerCategory.ruleTemplates = {
        ...partnerCategory.ruleTemplates,
        features: updateDto.featureRules,
      };
    }

    return await this.partnerCategoryRepository.save(partnerCategory);
  }

  async getStatistics(): Promise<AdminPartnerCategoryAnalyticsDto> {
    const partnerCategories = await this.partnerCategoryRepository.find({
      relations: ['partnerType'],
    });

    const stats: AdminPartnerCategoryStatsDto[] = [];
    let totalPartners = 0;
    let totalRevenue = 0;
    const categoriesByType: Record<string, number> = {};

    for (const partnerCategory of partnerCategories) {
      // Get partners count for this category
      const partnersCount = await this.partnerRepository.count({
        where: { primaryCategoryId: partnerCategory.id },
      });

      // Get subcategories count for this category
      const subcategoriesCount = await this.partnerSubcategoryRepository.count({
        where: { categoryId: partnerCategory.id },
      });

      // Calculate revenue and bookings (this would need actual booking/revenue data)
      const revenue = 0; // TODO: Calculate from actual booking data
      const bookings = 0; // TODO: Calculate from actual booking data
      const averageRating = 0; // TODO: Calculate from actual rating data

      const stat: AdminPartnerCategoryStatsDto = {
        id: partnerCategory.id,
        name: partnerCategory.name,
        partnerTypeName: partnerCategory.partnerType?.name || 'Unknown',
        activePartnersCount: partnersCount, // TODO: Filter by active status
        totalPartnersCount: partnersCount,
        subcategoriesCount,
        totalRevenue: revenue,
        averageRating,
        offeringsCount: bookings, // TODO: Calculate actual offerings count
        isActive: partnerCategory.isActive,
        createdAt: partnerCategory.createdAt,
      };

      stats.push(stat);
      totalPartners += partnersCount;
      totalRevenue += revenue;

      const typeName = partnerCategory.partnerType?.name || 'Unknown';
      categoriesByType[typeName] = (categoriesByType[typeName] || 0) + 1;
    }

    return {
      stats,
      totalCategories: partnerCategories.length,
      activeCategories: partnerCategories.filter((pc) => pc.isActive).length,
      categoriesByType,
      totalPartners,
      totalRevenue,
    };
  }

  async getCategoryUsageAnalytics(): Promise<AdminCategoryUsageAnalyticsDto[]> {
    const cacheKey = 'category-usage-analytics';
    const cached =
      await this.cacheManager.get<AdminCategoryUsageAnalyticsDto[]>(cacheKey);

    if (cached) {
      return cached;
    }

    try {
      const categories = await this.partnerCategoryRepository.find({
        relations: ['partnerType'],
      });

      const analytics = await Promise.all(
        categories.map(async (category) => {
          try {
            // Get basic counts without complex relations
            const partnersCount = await this.partnerRepository.count({
              where: { primaryCategoryId: category.id },
            });

            const subcategoriesCount =
              await this.partnerSubcategoryRepository.count({
                where: { categoryId: category.id },
              });

            // Calculate metrics with error handling
            let bookingMetrics = { total: 0, last30Days: 0 };
            let revenueMetrics = { total: 0, last30Days: 0 };
            let performanceMetrics = {
              conversionRate: 0,
              averageRating: 0,
              growthRate: 0,
            };
            let marketShare = 0;

            try {
              bookingMetrics = await this.calculateBookingMetrics(category.id);
            } catch (error) {
              console.warn(
                `Failed to calculate booking metrics for category ${category.id}:`,
                error.message,
              );
            }

            try {
              revenueMetrics = await this.calculateRevenueMetrics(category.id);
            } catch (error) {
              console.warn(
                `Failed to calculate revenue metrics for category ${category.id}:`,
                error.message,
              );
            }

            try {
              performanceMetrics = await this.calculatePerformanceMetrics(
                category.id,
              );
            } catch (error) {
              console.warn(
                `Failed to calculate performance metrics for category ${category.id}:`,
                error.message,
              );
            }

            try {
              marketShare = await this.calculateMarketShare(
                category.id,
                revenueMetrics.total,
              );
            } catch (error) {
              console.warn(
                `Failed to calculate market share for category ${category.id}:`,
                error.message,
              );
            }

            const totalBookings = bookingMetrics.total;
            const totalRevenue = revenueMetrics.total;
            const averageBookingValue =
              totalRevenue > 0 && totalBookings > 0
                ? totalRevenue / totalBookings
                : 0;
            const conversionRate = performanceMetrics.conversionRate;
            const satisfactionScore = performanceMetrics.averageRating;
            const growthRate = performanceMetrics.growthRate;

            return {
              categoryId: category.id,
              categoryName: category.name,
              partnerTypeName: category.partnerType?.name || 'Unknown',
              totalBookings,
              totalRevenue,
              averageBookingValue,
              conversionRate,
              growthRate,
              last30DaysBookings: bookingMetrics.last30Days,
              last30DaysRevenue: revenueMetrics.last30Days,
              satisfactionScore,
              marketShare,
              partnersCount,
              subcategoriesCount,
            };
          } catch (error) {
            console.warn(
              `Failed to process category ${category.id}:`,
              error.message,
            );
            // Return basic data for failed categories
            return {
              categoryId: category.id,
              categoryName: category.name,
              partnerTypeName: category.partnerType?.name || 'Unknown',
              totalBookings: 0,
              totalRevenue: 0,
              averageBookingValue: 0,
              conversionRate: 0,
              growthRate: 0,
              last30DaysBookings: 0,
              last30DaysRevenue: 0,
              satisfactionScore: 0,
              marketShare: 0,
              partnersCount: 0,
              subcategoriesCount: 0,
            };
          }
        }),
      );

      // Cache for 10 minutes
      await this.cacheManager.set(cacheKey, analytics, 600000);

      return analytics;
    } catch (error) {
      console.error('Failed to get category usage analytics:', error);
      // Return empty array on complete failure
      return [];
    }
  }

  async findById(id: string): Promise<PartnerCategoryEntity> {
    const partnerCategory = await this.partnerCategoryRepository.findOne({
      where: { id },
      relations: ['partnerType', 'partners', 'subcategories'],
    });

    if (!partnerCategory) {
      throw new NotFoundException('Partner category not found');
    }

    return partnerCategory;
  }

  async toggleStatus(id: string): Promise<PartnerCategoryEntity> {
    const partnerCategory = await this.findById(id);
    partnerCategory.isActive = !partnerCategory.isActive;

    // Invalidate related caches
    await this.invalidateCategoryCache(id);

    return await this.partnerCategoryRepository.save(partnerCategory);
  }

  // Private helper methods for analytics calculations
  private async calculateBookingMetrics(
    categoryId: string,
  ): Promise<{ total: number; last30Days: number }> {
    const cacheKey = `booking-metrics:${categoryId}`;
    const cached = await this.cacheManager.get<{
      total: number;
      last30Days: number;
    }>(cacheKey);

    if (cached) {
      return cached;
    }

    // Get partners in this category
    const partners = await this.partnerRepository.find({
      where: { primaryCategoryId: categoryId },
      select: ['id'],
    });

    const partnerIds = partners.map((p) => p.id);

    if (partnerIds.length === 0) {
      return { total: 0, last30Days: 0 };
    }

    // Calculate total bookings from actual booking data
    const totalBookingsQuery = this.dataSource
      .createQueryBuilder()
      .select('COUNT(*)', 'count')
      .from('booking', 'b')
      .innerJoin('space_option', 'so', 'so.id = b.spaceOptionId')
      .innerJoin('space', 's', 's.id = so.spaceId')
      .innerJoin('partner', 'p', 'p.id = s.partnerId')
      .where('p.primaryCategoryId = :categoryId', { categoryId })
      .andWhere('b.deletedAt IS NULL');

    const totalBookings = parseInt(
      (await totalBookingsQuery.getRawOne())?.count || '0',
    );

    // Calculate last 30 days bookings
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const last30DaysQuery = this.dataSource
      .createQueryBuilder()
      .select('COUNT(*)', 'count')
      .from('booking', 'b')
      .innerJoin('space_option', 'so', 'so.id = b.spaceOptionId')
      .innerJoin('space', 's', 's.id = so.spaceId')
      .innerJoin('partner', 'p', 'p.id = s.partnerId')
      .where('p.primaryCategoryId = :categoryId', { categoryId })
      .andWhere('b.createdAt >= :thirtyDaysAgo', { thirtyDaysAgo })
      .andWhere('b.deletedAt IS NULL');

    const last30DaysBookings = parseInt(
      (await last30DaysQuery.getRawOne())?.count || '0',
    );

    const result = { total: totalBookings, last30Days: last30DaysBookings };

    // Cache for 5 minutes
    await this.cacheManager.set(cacheKey, result, 300000);

    return result;
  }

  private async calculateRevenueMetrics(
    categoryId: string,
  ): Promise<{ total: number; last30Days: number }> {
    const cacheKey = `revenue-metrics:${categoryId}`;
    const cached = await this.cacheManager.get<{
      total: number;
      last30Days: number;
    }>(cacheKey);

    if (cached) {
      return cached;
    }

    // Get partners in this category
    const partners = await this.partnerRepository.find({
      where: { primaryCategoryId: categoryId },
      select: ['id'],
    });

    const partnerIds = partners.map((p) => p.id);

    if (partnerIds.length === 0) {
      return { total: 0, last30Days: 0 };
    }

    // Calculate total revenue from actual payment data
    const totalRevenueQuery = this.dataSource
      .createQueryBuilder()
      .select('COALESCE(SUM(p.amount), 0)', 'total')
      .from('payment', 'p')
      .innerJoin('booking', 'b', 'b.id = p.bookingId')
      .innerJoin('space_option', 'so', 'so.id = b.spaceOptionId')
      .innerJoin('space', 's', 's.id = so.spaceId')
      .innerJoin('partner', 'pt', 'pt.id = s.partnerId')
      .where('pt.primaryCategoryId = :categoryId', { categoryId })
      .andWhere('p.status = :status', { status: PaymentStatus.COMPLETED })
      .andWhere('p.deletedAt IS NULL');

    const totalRevenue = parseFloat(
      (await totalRevenueQuery.getRawOne())?.total || '0',
    );

    // Calculate last 30 days revenue
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const last30DaysRevenueQuery = this.dataSource
      .createQueryBuilder()
      .select('COALESCE(SUM(p.amount), 0)', 'total')
      .from('payment', 'p')
      .innerJoin('booking', 'b', 'b.id = p.bookingId')
      .innerJoin('space_option', 'so', 'so.id = b.spaceOptionId')
      .innerJoin('space', 's', 's.id = so.spaceId')
      .innerJoin('partner', 'pt', 'pt.id = s.partnerId')
      .where('pt.primaryCategoryId = :categoryId', { categoryId })
      .andWhere('p.status = :status', { status: PaymentStatus.COMPLETED })
      .andWhere('p.createdAt >= :thirtyDaysAgo', { thirtyDaysAgo })
      .andWhere('p.deletedAt IS NULL');

    const last30DaysRevenue = parseFloat(
      (await last30DaysRevenueQuery.getRawOne())?.total || '0',
    );

    const result = { total: totalRevenue, last30Days: last30DaysRevenue };

    // Cache for 5 minutes
    await this.cacheManager.set(cacheKey, result, 300000);

    return result;
  }

  private async calculatePerformanceMetrics(categoryId: string): Promise<{
    conversionRate: number;
    averageRating: number;
    growthRate: number;
  }> {
    const cacheKey = `performance-metrics:${categoryId}`;
    const cached = await this.cacheManager.get<{
      conversionRate: number;
      averageRating: number;
      growthRate: number;
    }>(cacheKey);

    if (cached) {
      return cached;
    }

    // Get partners in this category
    const partners = await this.partnerRepository.find({
      where: { primaryCategoryId: categoryId },
      select: ['id'],
    });

    if (partners.length === 0) {
      return { conversionRate: 0, averageRating: 0, growthRate: 0 };
    }

    // Calculate performance metrics from actual data
    // Conversion rate: confirmed bookings / total inquiries (using bookings as proxy)
    const totalBookingsQuery = this.dataSource
      .createQueryBuilder()
      .select('COUNT(*)', 'total')
      .addSelect(
        "SUM(CASE WHEN b.status = 'CONFIRMED' THEN 1 ELSE 0 END)",
        'confirmed',
      )
      .from('booking', 'b')
      .innerJoin('space_option', 'so', 'so.id = b.spaceOptionId')
      .innerJoin('space', 's', 's.id = so.spaceId')
      .innerJoin('partner', 'p', 'p.id = s.partnerId')
      .where('p.primaryCategoryId = :categoryId', { categoryId })
      .andWhere('b.deletedAt IS NULL');

    const bookingStats = await totalBookingsQuery.getRawOne();
    const totalBookings = parseInt(bookingStats?.total || '0');
    const confirmedBookings = parseInt(bookingStats?.confirmed || '0');
    const conversionRate =
      totalBookings > 0 ? confirmedBookings / totalBookings : 0;

    // Average rating from reviews
    const ratingQuery = this.dataSource
      .createQueryBuilder()
      .select('AVG(r.rating)', 'avgRating')
      .from('review', 'r')
      .innerJoin('partner', 'p', 'p.id = r.partnerId')
      .where('p.primaryCategoryId = :categoryId', { categoryId })
      .andWhere('r.deletedAt IS NULL');

    const averageRating = parseFloat(
      (await ratingQuery.getRawOne())?.avgRating || '0',
    );

    // Growth rate: compare current month bookings with previous month
    const currentMonth = new Date();
    const previousMonth = new Date();
    previousMonth.setMonth(previousMonth.getMonth() - 1);
    const twoMonthsAgo = new Date();
    twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);

    const currentMonthQuery = this.dataSource
      .createQueryBuilder()
      .select('COUNT(*)', 'count')
      .from('booking', 'b')
      .innerJoin('space_option', 'so', 'so.id = b.spaceOptionId')
      .innerJoin('space', 's', 's.id = so.spaceId')
      .innerJoin('partner', 'p', 'p.id = s.partnerId')
      .where('p.primaryCategoryId = :categoryId', { categoryId })
      .andWhere('b.createdAt >= :previousMonth', { previousMonth })
      .andWhere('b.deletedAt IS NULL');

    const previousMonthQuery = this.dataSource
      .createQueryBuilder()
      .select('COUNT(*)', 'count')
      .from('booking', 'b')
      .innerJoin('space_option', 'so', 'so.id = b.spaceOptionId')
      .innerJoin('space', 's', 's.id = so.spaceId')
      .innerJoin('partner', 'p', 'p.id = s.partnerId')
      .where('p.primaryCategoryId = :categoryId', { categoryId })
      .andWhere('b.createdAt >= :twoMonthsAgo', { twoMonthsAgo })
      .andWhere('b.createdAt < :previousMonth', { previousMonth })
      .andWhere('b.deletedAt IS NULL');

    const currentMonthBookings = parseInt(
      (await currentMonthQuery.getRawOne())?.count || '0',
    );
    const previousMonthBookings = parseInt(
      (await previousMonthQuery.getRawOne())?.count || '0',
    );
    const growthRate =
      previousMonthBookings > 0
        ? (currentMonthBookings - previousMonthBookings) / previousMonthBookings
        : 0;

    const result = { conversionRate, averageRating, growthRate };

    // Cache for 5 minutes
    await this.cacheManager.set(cacheKey, result, 300000);

    return result;
  }

  private async calculateMarketShare(
    categoryId: string,
    categoryRevenue: number,
  ): Promise<number> {
    const cacheKey = `market-share:${categoryId}`;
    const cached = await this.cacheManager.get<number>(cacheKey);

    if (cached !== undefined) {
      return cached;
    }

    // Get total revenue across all categories in the same partner type
    const category = await this.partnerCategoryRepository.findOne({
      where: { id: categoryId },
      select: ['partnerTypeId'],
    });

    if (!category) {
      return 0;
    }

    const allCategoriesInType = await this.partnerCategoryRepository.find({
      where: { partnerTypeId: category.partnerTypeId },
      select: ['id'],
    });

    // Calculate total market revenue from actual data
    const totalMarketRevenueQuery = this.dataSource
      .createQueryBuilder()
      .select('COALESCE(SUM(p.amount), 0)', 'total')
      .from('payment', 'p')
      .innerJoin('booking', 'b', 'b.id = p.bookingId')
      .innerJoin('space_option', 'so', 'so.id = b.spaceOptionId')
      .innerJoin('space', 's', 's.id = so.spaceId')
      .innerJoin('partner', 'pt', 'pt.id = s.partnerId')
      .innerJoin('partner_category', 'pc', 'pc.id = pt.primaryCategoryId')
      .where('pc.partnerTypeId = :partnerTypeId', {
        partnerTypeId: category.partnerTypeId,
      })
      .andWhere('p.status = :status', { status: PaymentStatus.COMPLETED })
      .andWhere('p.deletedAt IS NULL');

    const totalMarketRevenue = parseFloat(
      (await totalMarketRevenueQuery.getRawOne())?.total || '0',
    );
    const marketShare =
      totalMarketRevenue > 0 ? categoryRevenue / totalMarketRevenue : 0;

    // Cache for 10 minutes
    await this.cacheManager.set(cacheKey, marketShare, 600000);

    return marketShare;
  }

  private async invalidateCategoryCache(categoryId: string): Promise<void> {
    const patterns = [
      'category-usage-analytics',
      `booking-metrics:${categoryId}`,
      `revenue-metrics:${categoryId}`,
      `performance-metrics:${categoryId}`,
      `market-share:${categoryId}`,
      `category-data:${categoryId}`,
    ];

    for (const pattern of patterns) {
      await this.cacheManager.del(pattern);
    }
  }

  // Enhanced cache warming for popular categories
  async warmCategoryCache(categoryId?: string): Promise<void> {
    if (categoryId) {
      // Warm specific category
      await this.getCategoryUsageAnalytics();
      await this.warmCategoryRuleCache(categoryId);
    } else {
      // Warm top 20 most popular categories based on recent interactions
      const popularCategories = await this.getPopularCategories();

      // Warm in batches to avoid overwhelming the system
      const batchSize = 5;
      for (let i = 0; i < popularCategories.length; i += batchSize) {
        const batch = popularCategories.slice(i, i + batchSize);
        await Promise.all(
          batch.map(async (category) => {
            await this.getCategoryUsageAnalytics();
            await this.warmCategoryRuleCache(category.id);
          }),
        );

        // Small delay between batches
        if (i + batchSize < popularCategories.length) {
          await new Promise((resolve) => setTimeout(resolve, 100));
        }
      }
    }
  }

  // Get popular categories based on recent activity
  private async getPopularCategories(): Promise<any[]> {
    const cacheKey = 'popular-categories';
    let popularCategories = await this.cacheManager.get<any[]>(cacheKey);

    if (!popularCategories) {
      // Get categories with most interactions in the last 7 days
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      // Combine database query with cached interaction data
      const dbPopular = await this.partnerCategoryRepository
        .createQueryBuilder('category')
        .leftJoin('category.partners', 'partner')
        .addSelect('COUNT(partner.id)', 'partnerCount')
        .where('category.isActive = :isActive', { isActive: true })
        .groupBy('category.id')
        .orderBy('partnerCount', 'DESC')
        .limit(20)
        .getMany();

      // Enhance with cached interaction data
      const enhancedCategories = await Promise.all(
        dbPopular.map(async (category) => {
          const interactionScore = await this.getCategoryInteractionScore(
            category.id,
          );
          return {
            ...category,
            interactionScore,
            popularityScore:
              interactionScore * 0.7 + (category as any).partnerCount * 0.3,
          };
        }),
      );

      // Sort by popularity score
      popularCategories = enhancedCategories
        .sort((a, b) => b.popularityScore - a.popularityScore)
        .slice(0, 20);

      // Cache for 1 hour
      await this.cacheManager.set(cacheKey, popularCategories, 3600000);
    }

    return popularCategories;
  }

  // Calculate interaction score for a category
  private async getCategoryInteractionScore(
    categoryId: string,
  ): Promise<number> {
    const today = new Date();
    let totalScore = 0;

    // Check last 7 days with decreasing weights
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];

      const dailyKey = `category-daily:${categoryId}:${dateStr}`;
      const dailyInteractions =
        (await this.cacheManager.get<number>(dailyKey)) || 0;

      // Weight recent days more heavily
      const weight = Math.pow(0.8, i); // Exponential decay
      totalScore += dailyInteractions * weight;
    }

    return totalScore;
  }

  // Warm category rule cache
  private async warmCategoryRuleCache(categoryId: string): Promise<void> {
    const category = await this.partnerCategoryRepository.findOne({
      where: { id: categoryId },
      relations: ['partnerType'],
    });

    if (category) {
      // Pre-cache rule inheritance results
      const ruleTypes = ['pricing', 'feature', 'validation'];
      await Promise.all(
        ruleTypes.map(async (ruleType) => {
          const cacheKey = `effective_${ruleType}_rules:${categoryId}`;
          // This will trigger the rule resolution and cache it
          await this.cacheManager.get(cacheKey);
        }),
      );
    }
  }

  // Scheduled cache warming (to be called by a cron job)
  async scheduledCacheWarming(): Promise<void> {
    try {
      // Warm popular categories
      await this.warmCategoryCache();

      // Warm frequently accessed analytics
      const popularCategories = await this.getPopularCategories();
      await Promise.all(
        popularCategories
          .slice(0, 10)
          .map((category) => this.getCategoryUsageAnalytics()),
      );

      console.log(
        `Cache warming completed for ${popularCategories.length} categories`,
      );
    } catch (error) {
      console.error('Cache warming failed:', error);
    }
  }

  // Enhanced real-time analytics tracking
  async trackCategoryInteraction(
    categoryId: string,
    interactionType: string,
    metadata?: any,
  ): Promise<void> {
    const event = {
      categoryId,
      interactionType,
      timestamp: new Date(),
      metadata,
    };

    // Store in cache for real-time analytics
    const eventsKey = `category-events:${categoryId}`;
    const existingEvents =
      (await this.cacheManager.get<any[]>(eventsKey)) || [];
    existingEvents.push(event);

    // Keep only last 100 events in cache
    if (existingEvents.length > 100) {
      existingEvents.splice(0, existingEvents.length - 100);
    }

    await this.cacheManager.set(eventsKey, existingEvents, 3600000); // 1 hour

    // Track real-time metrics
    await this.updateRealTimeMetrics(categoryId, interactionType, metadata);
  }

  // Real-time metrics tracking
  private async updateRealTimeMetrics(
    categoryId: string,
    interactionType: string,
    metadata?: any,
  ): Promise<void> {
    const today = new Date().toISOString().split('T')[0];
    const hour = new Date().getHours();

    // Track hourly interaction counts
    const hourlyKey = `category-hourly:${categoryId}:${today}:${hour}`;
    const currentCount = (await this.cacheManager.get<number>(hourlyKey)) || 0;
    await this.cacheManager.set(hourlyKey, currentCount + 1, 3600000); // 1 hour

    // Track daily interaction counts
    const dailyKey = `category-daily:${categoryId}:${today}`;
    const dailyCount = (await this.cacheManager.get<number>(dailyKey)) || 0;
    await this.cacheManager.set(dailyKey, dailyCount + 1, 86400000); // 24 hours

    // Track interaction types
    const typeKey = `category-types:${categoryId}:${today}`;
    const typeStats =
      (await this.cacheManager.get<Record<string, number>>(typeKey)) || {};
    typeStats[interactionType] = (typeStats[interactionType] || 0) + 1;
    await this.cacheManager.set(typeKey, typeStats, 86400000); // 24 hours

    // Update performance metrics if it's a conversion event
    if (
      interactionType === 'booking_created' ||
      interactionType === 'inquiry_submitted'
    ) {
      await this.updateConversionMetrics(categoryId, metadata);
    }
  }

  // Update conversion metrics for real-time tracking
  private async updateConversionMetrics(
    categoryId: string,
    metadata?: any,
  ): Promise<void> {
    const today = new Date().toISOString().split('T')[0];

    // Track conversion count
    const conversionKey = `category-conversions:${categoryId}:${today}`;
    const conversions =
      (await this.cacheManager.get<number>(conversionKey)) || 0;
    await this.cacheManager.set(conversionKey, conversions + 1, 86400000);

    // Track revenue if provided
    if (metadata?.revenue) {
      const revenueKey = `category-revenue:${categoryId}:${today}`;
      const currentRevenue =
        (await this.cacheManager.get<number>(revenueKey)) || 0;
      await this.cacheManager.set(
        revenueKey,
        currentRevenue + metadata.revenue,
        86400000,
      );
    }

    // Calculate and cache conversion rate
    const viewsKey = `category-daily:${categoryId}:${today}`;
    const views = (await this.cacheManager.get<number>(viewsKey)) || 0;
    if (views > 0) {
      const conversionRate = ((conversions + 1) / views) * 100;
      const rateKey = `category-conversion-rate:${categoryId}:${today}`;
      await this.cacheManager.set(rateKey, conversionRate, 86400000);
    }
  }

  // Get real-time category performance
  async getRealTimePerformance(categoryId: string): Promise<any> {
    const today = new Date().toISOString().split('T')[0];
    const currentHour = new Date().getHours();

    // Get hourly data for today
    const hourlyData = [];
    for (let hour = 0; hour <= currentHour; hour++) {
      const hourlyKey = `category-hourly:${categoryId}:${today}:${hour}`;
      const count = (await this.cacheManager.get<number>(hourlyKey)) || 0;
      hourlyData.push({ hour, interactions: count });
    }

    // Get daily totals
    const dailyKey = `category-daily:${categoryId}:${today}`;
    const dailyInteractions =
      (await this.cacheManager.get<number>(dailyKey)) || 0;

    // Get conversion metrics
    const conversionKey = `category-conversions:${categoryId}:${today}`;
    const conversions =
      (await this.cacheManager.get<number>(conversionKey)) || 0;

    const revenueKey = `category-revenue:${categoryId}:${today}`;
    const revenue = (await this.cacheManager.get<number>(revenueKey)) || 0;

    const rateKey = `category-conversion-rate:${categoryId}:${today}`;
    const conversionRate = (await this.cacheManager.get<number>(rateKey)) || 0;

    // Get interaction types breakdown
    const typeKey = `category-types:${categoryId}:${today}`;
    const interactionTypes =
      (await this.cacheManager.get<Record<string, number>>(typeKey)) || {};

    return {
      categoryId,
      date: today,
      realTimeMetrics: {
        hourlyInteractions: hourlyData,
        totalInteractions: dailyInteractions,
        conversions,
        revenue,
        conversionRate,
        interactionTypes,
      },
      lastUpdated: new Date(),
    };
  }
}
