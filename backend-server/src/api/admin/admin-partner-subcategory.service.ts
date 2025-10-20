import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import { PaymentStatus } from '../../common/enums/booking.enum';
import { PartnerCategoryEntity } from '../../database/entities/partner-category.entity';
import { PartnerOfferingEntity } from '../../database/entities/partner-offering.entity';
import { PartnerSubcategoryEntity } from '../../database/entities/partner-subcategory.entity';
import { PartnerTypeEntity } from '../../database/entities/partner-type.entity';
import { PartnerEntity } from '../../database/entities/partner.entity';
import { CreatePartnerSubcategoryDto } from '../../dto/partner-subcategory/create-partner-subcategory.dto';
import { UpdatePartnerSubcategoryDto } from '../../dto/partner-subcategory/update-partner-subcategory.dto';
import {
  AdminBulkPartnerSubcategoryActionDto,
  AdminPartnerSubcategoryAnalyticsDto,
  AdminPartnerSubcategoryListResponseDto,
  AdminPartnerSubcategoryQueryDto,
  AdminPartnerSubcategoryStatsDto,
  AdminReorderPartnerSubcategoriesDto,
  AdminSubcategoryPerformanceDto,
  AdminUpdatePartnerSubcategoryDto,
  AdminUpdateRuleOverridesDto,
} from './dto/admin-partner-subcategory.dto';

@Injectable()
export class AdminPartnerSubcategoryService {
  constructor(
    @InjectRepository(PartnerSubcategoryEntity)
    private readonly partnerSubcategoryRepository: Repository<PartnerSubcategoryEntity>,
    @InjectRepository(PartnerCategoryEntity)
    private readonly partnerCategoryRepository: Repository<PartnerCategoryEntity>,
    @InjectRepository(PartnerTypeEntity)
    private readonly partnerTypeRepository: Repository<PartnerTypeEntity>,
    @InjectRepository(PartnerEntity)
    private readonly partnerRepository: Repository<PartnerEntity>,
    @InjectRepository(PartnerOfferingEntity)
    private readonly partnerOfferingRepository: Repository<PartnerOfferingEntity>,
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  async findAllWithFilters(
    query: AdminPartnerSubcategoryQueryDto,
  ): Promise<AdminPartnerSubcategoryListResponseDto> {
    const {
      search,
      categoryId,
      partnerTypeId,
      isActive,
      page,
      limit,
      sortBy,
      sortOrder,
    } = query;
    const queryBuilder =
      this.partnerSubcategoryRepository.createQueryBuilder(
        'partnerSubcategory',
      );

    // Apply search filter
    if (search) {
      queryBuilder.where(
        '(partnerSubcategory.name ILIKE :search OR partnerSubcategory.description ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    // Apply category filter
    if (categoryId) {
      queryBuilder.andWhere('partnerSubcategory.categoryId = :categoryId', {
        categoryId,
      });
    }

    // Apply partner type filter
    if (partnerTypeId) {
      queryBuilder.andWhere('partnerCategory.partnerTypeId = :partnerTypeId', {
        partnerTypeId,
      });
    }

    // Apply active filter
    if (typeof isActive === 'boolean') {
      queryBuilder.andWhere('partnerSubcategory.isActive = :isActive', {
        isActive,
      });
    }

    // Apply sorting
    const sortField = sortBy === 'order' ? 'sortOrder' : sortBy;
    queryBuilder.orderBy(`partnerSubcategory.${sortField}`, sortOrder);

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
    createDto: CreatePartnerSubcategoryDto,
  ): Promise<PartnerSubcategoryEntity> {
    // Validate partner category exists
    const partnerCategory = await this.partnerCategoryRepository.findOne({
      where: { id: createDto.partnerCategoryId },
      relations: ['partnerType'],
    });
    if (!partnerCategory) {
      throw new NotFoundException('Partner category not found');
    }

    // Check if name already exists within the same partner category
    const existingByName = await this.partnerSubcategoryRepository.findOne({
      where: {
        name: createDto.name,
        categoryId: createDto.partnerCategoryId,
      },
    });
    if (existingByName) {
      throw new ConflictException(
        'Partner subcategory with this name already exists in this category',
      );
    }

    // Check if slug already exists within the same partner category
    const existingBySlug = await this.partnerSubcategoryRepository.findOne({
      where: {
        slug: createDto.slug,
        categoryId: createDto.partnerCategoryId,
      },
    });
    if (existingBySlug) {
      throw new ConflictException(
        'Partner subcategory with this slug already exists in this category',
      );
    }

    // Get the next order value within the partner category
    const maxOrder = await this.partnerSubcategoryRepository
      .createQueryBuilder('partnerSubcategory')
      .select('MAX(partnerSubcategory.sortOrder)', 'maxOrder')
      .where('partnerSubcategory.categoryId = :categoryId', {
        categoryId: createDto.partnerCategoryId,
      })
      .getRawOne();

    const nextOrder = (maxOrder?.maxOrder || 0) + 1;

    const partnerSubcategory = this.partnerSubcategoryRepository.create({
      ...createDto,
      sortOrder: nextOrder,
    });

    return await this.partnerSubcategoryRepository.save(partnerSubcategory);
  }

  async update(
    id: string,
    updateDto: AdminUpdatePartnerSubcategoryDto,
  ): Promise<PartnerSubcategoryEntity> {
    const partnerSubcategory = await this.partnerSubcategoryRepository.findOne({
      where: { id },
      relations: ['partnerCategory'],
    });
    if (!partnerSubcategory) {
      throw new NotFoundException('Partner subcategory not found');
    }

    // If partner category is being changed, validate it exists
    if (
      updateDto.categoryId &&
      updateDto.categoryId !== partnerSubcategory.categoryId
    ) {
      const partnerCategory = await this.partnerCategoryRepository.findOne({
        where: { id: updateDto.categoryId },
      });
      if (!partnerCategory) {
        throw new NotFoundException('Partner category not found');
      }
    }

    const targetCategoryId =
      updateDto.categoryId || partnerSubcategory.categoryId;

    // Check for name conflicts (excluding current record)
    if (updateDto.name && updateDto.name !== partnerSubcategory.name) {
      const existingByName = await this.partnerSubcategoryRepository.findOne({
        where: {
          name: updateDto.name,
          categoryId: targetCategoryId,
        },
      });
      if (existingByName && existingByName.id !== id) {
        throw new ConflictException(
          'Partner subcategory with this name already exists in this category',
        );
      }
    }

    // Check for slug conflicts (excluding current record)
    if (updateDto.slug && updateDto.slug !== partnerSubcategory.slug) {
      const existingBySlug = await this.partnerSubcategoryRepository.findOne({
        where: {
          slug: updateDto.slug,
          categoryId: targetCategoryId,
        },
      });
      if (existingBySlug && existingBySlug.id !== id) {
        throw new ConflictException(
          'Partner subcategory with this slug already exists in this category',
        );
      }
    }

    Object.assign(partnerSubcategory, updateDto);
    return await this.partnerSubcategoryRepository.save(partnerSubcategory);
  }

  async delete(id: string): Promise<void> {
    const partnerSubcategory = await this.partnerSubcategoryRepository.findOne({
      where: { id },
    });
    if (!partnerSubcategory) {
      throw new NotFoundException('Partner subcategory not found');
    }

    // Check if there are any partners using this subcategory
    const partnersCount = await this.partnerRepository.count({
      where: { primarySubcategoryId: id },
    });
    if (partnersCount > 0) {
      throw new BadRequestException(
        `Cannot delete partner subcategory. ${partnersCount} partners are using this subcategory.`,
      );
    }

    // Check if there are any offerings using this subcategory
    const offeringsCount = await this.partnerOfferingRepository.count({
      where: { subcategoryId: id },
    });
    if (offeringsCount > 0) {
      throw new BadRequestException(
        `Cannot delete partner subcategory. ${offeringsCount} offerings are using this subcategory.`,
      );
    }

    await this.partnerSubcategoryRepository.remove(partnerSubcategory);
  }

  async bulkAction(
    bulkActionDto: AdminBulkPartnerSubcategoryActionDto,
  ): Promise<{ affected: number }> {
    const { ids, action } = bulkActionDto;

    if (ids.length === 0) {
      throw new BadRequestException('No IDs provided for bulk action');
    }

    let affected = 0;

    switch (action) {
      case 'activate':
        const activateResult = await this.partnerSubcategoryRepository.update(
          { id: In(ids) },
          { isActive: true },
        );
        affected = activateResult.affected || 0;
        break;

      case 'deactivate':
        const deactivateResult = await this.partnerSubcategoryRepository.update(
          { id: In(ids) },
          { isActive: false },
        );
        affected = deactivateResult.affected || 0;
        break;

      case 'delete':
        // Check if any of the partner subcategories have dependencies
        for (const id of ids) {
          const partnersCount = await this.partnerRepository.count({
            where: { primarySubcategoryId: id },
          });
          const offeringsCount = await this.partnerOfferingRepository.count({
            where: { subcategoryId: id },
          });

          if (partnersCount > 0 || offeringsCount > 0) {
            throw new BadRequestException(
              `Cannot delete partner subcategory ${id}. It has dependencies.`,
            );
          }
        }

        const deleteResult = await this.partnerSubcategoryRepository.delete({
          id: In(ids),
        });
        affected = deleteResult.affected || 0;
        break;

      default:
        throw new BadRequestException('Invalid bulk action');
    }

    return { affected };
  }

  async reorder(
    reorderDto: AdminReorderPartnerSubcategoriesDto,
  ): Promise<void> {
    const { orderedIds, categoryId } = reorderDto;

    // Build where condition
    const whereCondition: any = { id: In(orderedIds) };
    if (categoryId) {
      whereCondition.categoryId = categoryId;
    }

    // Validate that all IDs exist
    const existingSubcategories = await this.partnerSubcategoryRepository.find({
      where: whereCondition,
    });

    if (existingSubcategories.length !== orderedIds.length) {
      throw new BadRequestException(
        'Some partner subcategory IDs do not exist or do not belong to the specified category',
      );
    }

    // Update order for each partner subcategory
    for (let i = 0; i < orderedIds.length; i++) {
      await this.partnerSubcategoryRepository.update(
        { id: orderedIds[i] },
        { sortOrder: i + 1 },
      );
    }
  }

  async updateRuleOverrides(
    id: string,
    updateDto: AdminUpdateRuleOverridesDto,
  ): Promise<PartnerSubcategoryEntity> {
    const partnerSubcategory = await this.partnerSubcategoryRepository.findOne({
      where: { id },
    });
    if (!partnerSubcategory) {
      throw new NotFoundException('Partner subcategory not found');
    }

    // Note: Rule overrides have been moved to partner_types level
    // These properties are no longer available at subcategory level
    if (updateDto.pricingRules !== undefined) {
      console.warn('Pricing rules should be set at partner type level');
    }

    if (updateDto.availabilityRules !== undefined) {
      // Note: Rule overrides have been moved to partner_types level
      // These properties are no longer available at subcategory level
      console.warn('Availability rules should be set at partner type level');
    }

    // Note: Rule overrides have been moved to partner_types level
    // These properties are no longer available at subcategory level
    if (updateDto.requirementRules !== undefined) {
      // TODO: Implement rule override logic at partner type level
      console.warn('Requirement rules should be set at partner type level');
    }

    if (updateDto.featureRules !== undefined) {
      // TODO: Implement rule override logic at partner type level
      console.warn('Feature rules should be set at partner type level');
    }

    return await this.partnerSubcategoryRepository.save(partnerSubcategory);
  }

  async getStatistics(): Promise<AdminPartnerSubcategoryAnalyticsDto> {
    console.log('=== ANALYTICS METHOD CALLED ===');
    try {
      console.log('Starting getStatistics method');

      // Return a minimal response first to test if the method structure works
      return {
        stats: [],
        totalSubcategories: 0,
        activeSubcategories: 0,
        subcategoriesByCategory: {},
        totalPartners: 0,
        totalRevenue: 0,
      };

      // Test basic repository access first
      const basicCount = await this.partnerSubcategoryRepository.count();
      console.log(`Basic count query successful: ${basicCount} subcategories`);

      const partnerSubcategories = await this.partnerSubcategoryRepository.find(
        {
          relations: [
            'partnerCategory',
            'partnerCategory.partnerType',
            'partners',
            'offerings',
          ],
        },
      );
      console.log(
        `Found ${partnerSubcategories.length} partner subcategories with relations`,
      );

      const stats: AdminPartnerSubcategoryStatsDto[] = [];
      let totalPartners = 0;
      let totalRevenue = 0;
      const subcategoriesByCategory: Record<string, number> = {};

      for (const partnerSubcategory of partnerSubcategories) {
        try {
          console.log(`Processing subcategory: ${partnerSubcategory.name}`);
          const partnersCount = partnerSubcategory.partners?.length || 0;
          const offeringsCount = partnerSubcategory.offerings?.length || 0;

          // Calculate revenue and bookings from actual data
          const revenueQuery = await this.dataSource
            .createQueryBuilder()
            .select('COALESCE(SUM(p.amount), 0)', 'total')
            .from('payment', 'p')
            .innerJoin(
              'booking',
              'b',
              'b.id = p."bookingId" AND b."deletedAt" IS NULL',
            )
            .innerJoin(
              'space_options',
              'so',
              'so.id = b."spaceOptionId" AND so."deletedAt" IS NULL',
            )
            .innerJoin(
              'space',
              's',
              's.id = so."spaceId" AND s."deletedAt" IS NULL',
            )
            .innerJoin(
              'partner',
              'pt',
              'pt.id = s."partnerId" AND pt."deletedAt" IS NULL',
            )
            .where('pt."primarySubcategoryId" = :subcategoryId', {
              subcategoryId: partnerSubcategory.id,
            })
            .andWhere('p.status = :status', { status: PaymentStatus.COMPLETED })
            .andWhere('p."deletedAt" IS NULL')
            .getRawOne();

          const bookingsQuery = await this.dataSource
            .createQueryBuilder()
            .select('COUNT(*)', 'count')
            .from('booking', 'b')
            .innerJoin(
              'space_options',
              'so',
              'so.id = b."spaceOptionId" AND so."deletedAt" IS NULL',
            )
            .innerJoin(
              'space',
              's',
              's.id = so."spaceId" AND s."deletedAt" IS NULL',
            )
            .innerJoin(
              'partner',
              'pt',
              'pt.id = s."partnerId" AND pt."deletedAt" IS NULL',
            )
            .where('pt."primarySubcategoryId" = :subcategoryId', {
              subcategoryId: partnerSubcategory.id,
            })
            .andWhere('b."deletedAt" IS NULL')
            .getRawOne();

          const ratingQuery = await this.dataSource
            .createQueryBuilder()
            .select('AVG(r.rating)', 'avgRating')
            .from('reviews', 'r')
            .innerJoin(
              'partner',
              'pt',
              'pt.id = r."partnerId" AND pt."deletedAt" IS NULL',
            )
            .where('pt."primarySubcategoryId" = :subcategoryId', {
              subcategoryId: partnerSubcategory.id,
            })
            .getRawOne();

          const revenue = parseFloat(revenueQuery?.total || '0');
          const bookings = parseInt(bookingsQuery?.count || '0');
          const averageRating = parseFloat(ratingQuery?.avgRating || '0');

          const stat: AdminPartnerSubcategoryStatsDto = {
            id: partnerSubcategory.id,
            name: partnerSubcategory.name,
            categoryName: partnerSubcategory.partnerCategory?.name || 'Unknown',
            partnerTypeName:
              partnerSubcategory.partnerCategory?.partnerType?.name ||
              'Unknown',
            activePartnersCount: partnersCount, // TODO: Filter by active status
            totalPartnersCount: partnersCount,
            offeringsCount,
            totalRevenue: revenue,
            averageRating,
            totalBookings: bookings,
            isActive: partnerSubcategory.isActive,
            createdAt: partnerSubcategory.createdAt,
          };

          stats.push(stat);
          totalPartners += partnersCount;
          totalRevenue += revenue;

          const categoryName =
            partnerSubcategory.partnerCategory?.name || 'Unknown';
          subcategoriesByCategory[categoryName] =
            (subcategoriesByCategory[categoryName] || 0) + 1;
        } catch (error) {
          console.error(
            `Error processing subcategory ${partnerSubcategory.name}:`,
            error,
          );
          throw error;
        }
      }

      return {
        stats,
        totalSubcategories: partnerSubcategories.length,
        activeSubcategories: partnerSubcategories.filter((psc) => psc.isActive)
          .length,
        subcategoriesByCategory,
        totalPartners,
        totalRevenue,
      };
    } catch (error) {
      console.error('Error in getStatistics method:', error);
      throw error;
    }
  }

  async getPerformanceAnalytics(): Promise<AdminSubcategoryPerformanceDto[]> {
    const subcategories = await this.partnerSubcategoryRepository.find({
      relations: ['partnerCategory', 'partners', 'offerings'],
    });

    const results = await Promise.all(
      subcategories.map(async (subcategory) => {
        const partnersCount = subcategory.partners?.length || 0;
        const offeringsCount = subcategory.offerings?.length || 0;

        // Calculate actual metrics from booking/revenue data
        const revenueQuery = await this.dataSource
          .createQueryBuilder()
          .select('COALESCE(SUM(p.amount), 0)', 'total')
          .from('payment', 'p')
          .innerJoin(
            'booking',
            'b',
            'b.id = p."bookingId" AND b."deletedAt" IS NULL',
          )
          .innerJoin(
            'space_options',
            'so',
            'so.id = b."spaceOptionId" AND so."deletedAt" IS NULL',
          )
          .innerJoin(
            'space',
            's',
            's.id = so."spaceId" AND s."deletedAt" IS NULL',
          )
          .innerJoin(
            'partner',
            'pt',
            'pt.id = s."partnerId" AND pt."deletedAt" IS NULL',
          )
          .where('pt."primarySubcategoryId" = :subcategoryId', {
            subcategoryId: subcategory.id,
          })
          .andWhere('p.status = :status', { status: PaymentStatus.COMPLETED })
          .andWhere('p."deletedAt" IS NULL')
          .getRawOne();

        const bookingsQuery = await this.dataSource
          .createQueryBuilder()
          .select('COUNT(*)', 'total')
          .addSelect(
            "SUM(CASE WHEN b.status = 'CONFIRMED' THEN 1 ELSE 0 END)",
            'confirmed',
          )
          .from('booking', 'b')
          .innerJoin(
            'space_options',
            'so',
            'so.id = b."spaceOptionId" AND so."deletedAt" IS NULL',
          )
          .innerJoin(
            'space',
            's',
            's.id = so."spaceId" AND s."deletedAt" IS NULL',
          )
          .innerJoin(
            'partner',
            'pt',
            'pt.id = s."partnerId" AND pt."deletedAt" IS NULL',
          )
          .where('pt."primarySubcategoryId" = :subcategoryId', {
            subcategoryId: subcategory.id,
          })
          .andWhere('b."deletedAt" IS NULL')
          .getRawOne();

        const ratingQuery = await this.dataSource
          .createQueryBuilder()
          .select('AVG(r.rating)', 'avgRating')
          .from('reviews', 'r')
          .innerJoin(
            'partner',
            'pt',
            'pt.id = r."partnerId" AND pt."deletedAt" IS NULL',
          )
          .where('pt."primarySubcategoryId" = :subcategoryId', {
            subcategoryId: subcategory.id,
          })
          .getRawOne();

        const totalRevenue = parseFloat(revenueQuery?.total || '0');
        const totalBookings = parseInt(bookingsQuery?.total || '0');
        const confirmedBookings = parseInt(bookingsQuery?.confirmed || '0');
        const averageBookingValue =
          totalRevenue > 0 && totalBookings > 0
            ? totalRevenue / totalBookings
            : 0;
        const conversionRate =
          totalBookings > 0 ? confirmedBookings / totalBookings : 0;
        const satisfactionScore = parseFloat(ratingQuery?.avgRating || '0');

        // Calculate growth rate by comparing current month with previous month
        const currentMonth = new Date();
        const previousMonth = new Date();
        previousMonth.setMonth(previousMonth.getMonth() - 1);
        const twoMonthsAgo = new Date();
        twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);

        const currentMonthQuery = await this.dataSource
          .createQueryBuilder()
          .select('COUNT(*)', 'count')
          .from('booking', 'b')
          .innerJoin(
            'space_options',
            'so',
            'so.id = b."spaceOptionId" AND so."deletedAt" IS NULL',
          )
          .innerJoin(
            'space',
            's',
            's.id = so."spaceId" AND s."deletedAt" IS NULL',
          )
          .innerJoin(
            'partner',
            'pt',
            'pt.id = s."partnerId" AND pt."deletedAt" IS NULL',
          )
          .where('pt."primarySubcategoryId" = :subcategoryId', {
            subcategoryId: subcategory.id,
          })
          .andWhere('b."createdAt" >= :previousMonth', { previousMonth })
          .andWhere('b."deletedAt" IS NULL')
          .getRawOne();

        const previousMonthQuery = await this.dataSource
          .createQueryBuilder()
          .select('COUNT(*)', 'count')
          .from('booking', 'b')
          .innerJoin(
            'space_options',
            'so',
            'so.id = b."spaceOptionId" AND so."deletedAt" IS NULL',
          )
          .innerJoin(
            'space',
            's',
            's.id = so."spaceId" AND s."deletedAt" IS NULL',
          )
          .innerJoin(
            'partner',
            'pt',
            'pt.id = s."partnerId" AND pt."deletedAt" IS NULL',
          )
          .where('pt."primarySubcategoryId" = :subcategoryId', {
            subcategoryId: subcategory.id,
          })
          .andWhere('b."createdAt" >= :twoMonthsAgo', { twoMonthsAgo })
          .andWhere('b."createdAt" < :previousMonth', { previousMonth })
          .andWhere('b."deletedAt" IS NULL')
          .getRawOne();

        const currentMonthBookings = parseInt(currentMonthQuery?.count || '0');
        const previousMonthBookings = parseInt(
          previousMonthQuery?.count || '0',
        );
        const growthRate =
          previousMonthBookings > 0
            ? (currentMonthBookings - previousMonthBookings) /
              previousMonthBookings
            : 0;

        // Calculate market share within category
        const categoryRevenueQuery = await this.dataSource
          .createQueryBuilder()
          .select('COALESCE(SUM(p.amount), 0)', 'total')
          .from('payment', 'p')
          .innerJoin(
            'booking',
            'b',
            'b.id = p."bookingId" AND b."deletedAt" IS NULL',
          )
          .innerJoin(
            'space_options',
            'so',
            'so.id = b."spaceOptionId" AND so."deletedAt" IS NULL',
          )
          .innerJoin(
            'space',
            's',
            's.id = so."spaceId" AND s."deletedAt" IS NULL',
          )
          .innerJoin(
            'partner',
            'pt',
            'pt.id = s."partnerId" AND pt."deletedAt" IS NULL',
          )
          .innerJoin(
            'partner_subcategories',
            'psc',
            'psc.id = pt."primarySubcategoryId" AND psc."deletedAt" IS NULL',
          )
          .where('psc."categoryId" = :categoryId', {
            categoryId: subcategory.partnerCategory?.id,
          })
          .andWhere('p.status = :status', { status: PaymentStatus.COMPLETED })
          .andWhere('p."deletedAt" IS NULL')
          .getRawOne();

        const categoryRevenue = parseFloat(categoryRevenueQuery?.total || '0');
        const marketShare =
          categoryRevenue > 0 ? totalRevenue / categoryRevenue : 0;

        return {
          subcategoryId: subcategory.id,
          subcategoryName: subcategory.name,
          categoryName: subcategory.partnerCategory?.name || 'Unknown',
          totalBookings,
          totalRevenue,
          averageBookingValue,
          conversionRate,
          satisfactionScore,
          growthRate,
          marketShare,
          last30Days: {
            bookings: 0, // TODO: Calculate from actual data
            revenue: 0, // TODO: Calculate from actual data
            newPartners: 0, // TODO: Calculate from actual data
          },
        };
      }),
    );

    return results;
  }

  async findById(id: string): Promise<PartnerSubcategoryEntity> {
    const partnerSubcategory = await this.partnerSubcategoryRepository.findOne({
      where: { id },
      relations: [
        'partnerCategory',
        'partnerCategory.partnerType',
        'partners',
        'offerings',
      ],
    });

    if (!partnerSubcategory) {
      throw new NotFoundException('Partner subcategory not found');
    }

    return partnerSubcategory;
  }

  async toggleStatus(id: string): Promise<PartnerSubcategoryEntity> {
    const partnerSubcategory = await this.findById(id);
    partnerSubcategory.isActive = !partnerSubcategory.isActive;
    return await this.partnerSubcategoryRepository.save(partnerSubcategory);
  }
}
