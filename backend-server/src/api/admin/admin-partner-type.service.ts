import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { PartnerCategoryEntity } from '../../database/entities/partner-category.entity';
import { PartnerTypeEntity } from '../../database/entities/partner-type.entity';
import { PartnerEntity } from '../../database/entities/partner.entity';
import { CreatePartnerTypeDto } from '../../dto/partner-type/create-partner-type.dto';
import { UpdatePartnerTypeDto } from '../../dto/partner-type/update-partner-type.dto';
import {
  AdminBulkPartnerTypeActionDto,
  AdminPartnerTypeAnalyticsDto,
  AdminPartnerTypeListResponseDto,
  AdminPartnerTypeQueryDto,
  AdminPartnerTypeStatsDto,
  AdminReorderPartnerTypesDto,
} from './dto/admin-partner-type.dto';

@Injectable()
export class AdminPartnerTypeService {
  constructor(
    @InjectRepository(PartnerTypeEntity)
    private readonly partnerTypeRepository: Repository<PartnerTypeEntity>,
    @InjectRepository(PartnerEntity)
    private readonly partnerRepository: Repository<PartnerEntity>,
    @InjectRepository(PartnerCategoryEntity)
    private readonly partnerCategoryRepository: Repository<PartnerCategoryEntity>,
  ) {}

  async findAllWithFilters(
    query: AdminPartnerTypeQueryDto,
  ): Promise<AdminPartnerTypeListResponseDto> {
    const { search, isActive, page, limit, sortBy, sortOrder } = query;
    const queryBuilder =
      this.partnerTypeRepository.createQueryBuilder('partnerType');

    // Apply search filter
    if (search) {
      queryBuilder.where(
        '(partnerType.name ILIKE :search OR partnerType.description ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    // Apply active filter
    if (typeof isActive === 'boolean') {
      queryBuilder.andWhere('partnerType.isActive = :isActive', { isActive });
    }

    // Apply sorting
    const sortField = sortBy === 'order' ? 'sortOrder' : sortBy;
    queryBuilder.orderBy(`partnerType.${sortField}`, sortOrder);

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

  async create(createDto: CreatePartnerTypeDto): Promise<PartnerTypeEntity> {
    // Check if name already exists
    const existingByName = await this.partnerTypeRepository.findOne({
      where: { name: createDto.name },
    });
    if (existingByName) {
      throw new ConflictException('Partner type with this name already exists');
    }

    // Check if slug already exists
    const existingBySlug = await this.partnerTypeRepository.findOne({
      where: { slug: createDto.slug },
    });
    if (existingBySlug) {
      throw new ConflictException('Partner type with this slug already exists');
    }

    // Get the next order value
    const maxOrder = await this.partnerTypeRepository
      .createQueryBuilder('partnerType')
      .select('MAX(partnerType.sortOrder)', 'maxOrder')
      .getRawOne();

    const nextOrder = (maxOrder?.maxOrder || 0) + 1;

    const partnerType = this.partnerTypeRepository.create({
      ...createDto,
      sortOrder: nextOrder,
    });

    return await this.partnerTypeRepository.save(partnerType);
  }

  async update(
    id: string,
    updateDto: UpdatePartnerTypeDto,
  ): Promise<PartnerTypeEntity> {
    const partnerType = await this.partnerTypeRepository.findOne({
      where: { id },
    });
    if (!partnerType) {
      throw new NotFoundException('Partner type not found');
    }

    // Check for name conflicts (excluding current record)
    if (updateDto.name && updateDto.name !== partnerType.name) {
      const existingByName = await this.partnerTypeRepository.findOne({
        where: { name: updateDto.name },
      });
      if (existingByName && existingByName.id !== id) {
        throw new ConflictException(
          'Partner type with this name already exists',
        );
      }
    }

    // Check for slug conflicts (excluding current record)
    if (updateDto.slug && updateDto.slug !== partnerType.slug) {
      const existingBySlug = await this.partnerTypeRepository.findOne({
        where: { slug: updateDto.slug },
      });
      if (existingBySlug && existingBySlug.id !== id) {
        throw new ConflictException(
          'Partner type with this slug already exists',
        );
      }
    }

    Object.assign(partnerType, updateDto);
    return await this.partnerTypeRepository.save(partnerType);
  }

  async delete(id: string): Promise<void> {
    const partnerType = await this.partnerTypeRepository.findOne({
      where: { id },
    });
    if (!partnerType) {
      throw new NotFoundException('Partner type not found');
    }

    // Check if there are any partners using this type
    const partnersCount = await this.partnerRepository.count({
      where: { partnerTypeId: id },
    });
    if (partnersCount > 0) {
      throw new BadRequestException(
        `Cannot delete partner type. ${partnersCount} partners are using this type.`,
      );
    }

    // Check if there are any categories using this type
    const categoriesCount = await this.partnerCategoryRepository.count({
      where: { partnerTypeId: id },
    });
    if (categoriesCount > 0) {
      throw new BadRequestException(
        `Cannot delete partner type. ${categoriesCount} categories are using this type.`,
      );
    }

    await this.partnerTypeRepository.remove(partnerType);
  }

  async bulkAction(
    bulkActionDto: AdminBulkPartnerTypeActionDto,
  ): Promise<{ affected: number }> {
    const { ids, action } = bulkActionDto;

    if (ids.length === 0) {
      throw new BadRequestException('No IDs provided for bulk action');
    }

    let affected = 0;

    switch (action) {
      case 'activate':
        const activateResult = await this.partnerTypeRepository.update(
          { id: In(ids) },
          { isActive: true },
        );
        affected = activateResult.affected || 0;
        break;

      case 'deactivate':
        const deactivateResult = await this.partnerTypeRepository.update(
          { id: In(ids) },
          { isActive: false },
        );
        affected = deactivateResult.affected || 0;
        break;

      case 'delete':
        // Check if any of the partner types have dependencies
        for (const id of ids) {
          const partnersCount = await this.partnerRepository.count({
            where: { partnerTypeId: id },
          });
          const categoriesCount = await this.partnerCategoryRepository.count({
            where: { partnerTypeId: id },
          });

          if (partnersCount > 0 || categoriesCount > 0) {
            throw new BadRequestException(
              `Cannot delete partner type ${id}. It has dependencies.`,
            );
          }
        }

        const deleteResult = await this.partnerTypeRepository.delete({
          id: In(ids),
        });
        affected = deleteResult.affected || 0;
        break;

      default:
        throw new BadRequestException('Invalid bulk action');
    }

    return { affected };
  }

  async reorder(reorderDto: AdminReorderPartnerTypesDto): Promise<void> {
    const { orderedIds } = reorderDto;

    // Validate that all IDs exist
    const existingTypes = await this.partnerTypeRepository.find({
      where: { id: In(orderedIds) },
    });

    if (existingTypes.length !== orderedIds.length) {
      throw new BadRequestException('Some partner type IDs do not exist');
    }

    // Update order for each partner type
    for (let i = 0; i < orderedIds.length; i++) {
      await this.partnerTypeRepository.update(
        { id: orderedIds[i] },
        { sortOrder: i + 1 },
      );
    }
  }

  async getStatistics(): Promise<AdminPartnerTypeAnalyticsDto> {
    const partnerTypes = await this.partnerTypeRepository.find({
      relations: ['partners', 'categories'],
    });

    const stats: AdminPartnerTypeStatsDto[] = [];
    let totalPartners = 0;
    let totalRevenue = 0;
    const partnersByType: Record<string, number> = {};

    for (const partnerType of partnerTypes) {
      const partnersCount = partnerType.partners?.length || 0;
      const categoriesCount = partnerType.categories?.length || 0;

      // Calculate revenue and bookings (this would need actual booking/revenue data)
      const revenue = 0; // TODO: Calculate from actual booking data
      const bookings = 0; // TODO: Calculate from actual booking data
      const averageRating = 0; // TODO: Calculate from actual rating data

      const stat: AdminPartnerTypeStatsDto = {
        id: partnerType.id,
        name: partnerType.name,
        activePartnersCount: partnersCount, // TODO: Filter by active status
        totalPartnersCount: partnersCount,
        categoriesCount,
        offeringsCount: bookings, // TODO: Calculate actual offerings count
        totalRevenue: revenue,
        isActive: partnerType.isActive,
        createdAt: partnerType.createdAt,
      };

      stats.push(stat);
      totalPartners += partnersCount;
      totalRevenue += revenue;
      partnersByType[partnerType.name] = partnersCount;
    }

    return {
      stats,
      totalTypes: partnerTypes.length,
      activeTypes: partnerTypes.filter((pt) => pt.isActive).length,
      totalPartners,
      totalRevenue,
    };
  }

  async findById(id: string): Promise<PartnerTypeEntity> {
    const partnerType = await this.partnerTypeRepository.findOne({
      where: { id },
      relations: ['partners', 'categories'],
    });

    if (!partnerType) {
      throw new NotFoundException('Partner type not found');
    }

    return partnerType;
  }

  async toggleStatus(id: string): Promise<PartnerTypeEntity> {
    const partnerType = await this.findById(id);
    partnerType.isActive = !partnerType.isActive;
    return await this.partnerTypeRepository.save(partnerType);
  }
}
