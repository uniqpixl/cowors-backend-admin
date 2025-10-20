import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindManyOptions, FindOptionsWhere, Repository } from 'typeorm';
import { PackageType, PricingType } from '../dto/space-inventory.dto';
import {
  EnhancedPricingType,
  SpacePackageEntity,
} from '../entities/space-inventory.entity';

@Injectable()
export class SpacePackageRepository {
  constructor(
    @InjectRepository(SpacePackageEntity)
    private readonly repository: Repository<SpacePackageEntity>,
  ) {}

  async create(
    spacePackageData: Partial<SpacePackageEntity>,
  ): Promise<SpacePackageEntity> {
    const spacePackage = this.repository.create(spacePackageData);
    return await this.repository.save(spacePackage);
  }

  async findById(id: string): Promise<SpacePackageEntity | null> {
    return await this.repository.findOne({
      where: { id },
      relations: [
        'spaceOption',
        'spaceOption.space',
        'spaceOption.space.partner',
        'creator',
        'updater',
      ],
    });
  }

  async findBySpaceOptionId(
    spaceOptionId: string,
    options?: {
      packageType?: PackageType;
      pricingType?: EnhancedPricingType;
      isActive?: boolean;
    },
  ): Promise<SpacePackageEntity[]> {
    const where: FindOptionsWhere<SpacePackageEntity> = { spaceOptionId };

    if (options?.packageType) {
      where.packageType = options.packageType;
    }
    if (options?.pricingType) {
      where.pricingType = options.pricingType;
    }
    if (options?.isActive !== undefined) {
      where.isActive = options.isActive;
    }

    return await this.repository.find({
      where,
      relations: ['spaceOption', 'spaceOption.space'],
      order: { priority: 'DESC', createdAt: 'ASC' },
    });
  }

  async findMany(
    options: FindManyOptions<SpacePackageEntity> = {},
  ): Promise<SpacePackageEntity[]> {
    return await this.repository.find({
      ...options,
      relations: [
        'spaceOption',
        'spaceOption.space',
        'spaceOption.space.partner',
        'creator',
        'updater',
      ],
    });
  }

  async findByPartnerId(
    partnerId: string,
    options?: {
      packageType?: PackageType;
      pricingType?: EnhancedPricingType;
      isActive?: boolean;
    },
  ): Promise<SpacePackageEntity[]> {
    const queryBuilder = this.repository
      .createQueryBuilder('spacePackage')
      .leftJoinAndSelect('spacePackage.spaceOption', 'spaceOption')
      .leftJoinAndSelect('spaceOption.space', 'space')
      .leftJoinAndSelect('space.partner', 'partner')
      .where('partner.id = :partnerId', { partnerId });

    if (options?.packageType) {
      queryBuilder.andWhere('spacePackage.packageType = :packageType', {
        packageType: options.packageType,
      });
    }
    if (options?.pricingType) {
      queryBuilder.andWhere('spacePackage.pricingType = :pricingType', {
        pricingType: options.pricingType,
      });
    }
    if (options?.isActive !== undefined) {
      queryBuilder.andWhere('spacePackage.isActive = :isActive', {
        isActive: options.isActive,
      });
    }

    return await queryBuilder
      .orderBy('spacePackage.priority', 'DESC')
      .addOrderBy('spacePackage.createdAt', 'ASC')
      .getMany();
  }

  async findByPriceRange(
    minPrice: number,
    maxPrice: number,
    currency: string = 'USD',
  ): Promise<SpacePackageEntity[]> {
    const queryBuilder = this.repository
      .createQueryBuilder('spacePackage')
      .leftJoinAndSelect('spacePackage.spaceOption', 'spaceOption')
      .leftJoinAndSelect('spaceOption.space', 'space')
      .where('spacePackage.isActive = :isActive', { isActive: true })
      .andWhere('spacePackage.currency = :currency', { currency })
      .andWhere('spacePackage.basePrice >= :minPrice', { minPrice })
      .andWhere('spacePackage.basePrice <= :maxPrice', { maxPrice });

    return await queryBuilder
      .orderBy('spacePackage.basePrice', 'ASC')
      .addOrderBy('spacePackage.priority', 'DESC')
      .getMany();
  }

  async findByPricingType(
    pricingType: EnhancedPricingType,
  ): Promise<SpacePackageEntity[]> {
    return await this.repository.find({
      where: { pricingType, isActive: true },
      relations: ['spaceOption', 'spaceOption.space'],
      order: { priority: 'DESC', basePrice: 'ASC' },
    });
  }

  async update(
    id: string,
    updateData: Partial<SpacePackageEntity>,
  ): Promise<SpacePackageEntity | null> {
    await this.repository.update(id, updateData);
    return await this.findById(id);
  }

  async bulkUpdate(
    updates: Array<{ id: string; data: Partial<SpacePackageEntity> }>,
  ): Promise<void> {
    for (const update of updates) {
      await this.repository.update(update.id, update.data);
    }
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.repository.delete(id);
    return result.affected > 0;
  }

  async softDelete(id: string): Promise<boolean> {
    const result = await this.repository.update(id, { isActive: false });
    return result.affected > 0;
  }

  async incrementBookings(id: string): Promise<void> {
    await this.repository.increment({ id }, 'totalBookings', 1);
  }

  async updatePriority(id: string, priority: number): Promise<void> {
    await this.repository.update(id, { priority });
  }

  async getStatsBySpaceOptionId(spaceOptionId: string): Promise<{
    totalPackages: number;
    activePackages: number;
    averagePrice: number;
    totalBookings: number;
  }> {
    const result = await this.repository
      .createQueryBuilder('spacePackage')
      .select('COUNT(*)', 'totalPackages')
      .addSelect(
        'COUNT(CASE WHEN spacePackage.isActive = true THEN 1 END)',
        'activePackages',
      )
      .addSelect('AVG(spacePackage.basePrice)', 'averagePrice')
      .addSelect('SUM(spacePackage.totalBookings)', 'totalBookings')
      .where('spacePackage.spaceOptionId = :spaceOptionId', { spaceOptionId })
      .getRawOne();

    return {
      totalPackages: parseInt(result.totalPackages) || 0,
      activePackages: parseInt(result.activePackages) || 0,
      averagePrice: parseFloat(result.averagePrice) || 0,
      totalBookings: parseInt(result.totalBookings) || 0,
    };
  }

  async searchByName(
    searchTerm: string,
    limit: number = 20,
  ): Promise<SpacePackageEntity[]> {
    return await this.repository
      .createQueryBuilder('spacePackage')
      .leftJoinAndSelect('spacePackage.spaceOption', 'spaceOption')
      .leftJoinAndSelect('spaceOption.space', 'space')
      .leftJoinAndSelect('space.partner', 'partner')
      .where('spacePackage.isActive = :isActive', { isActive: true })
      .andWhere(
        '(spacePackage.name ILIKE :searchTerm OR spacePackage.description ILIKE :searchTerm)',
        {
          searchTerm: `%${searchTerm}%`,
        },
      )
      .orderBy('spacePackage.priority', 'DESC')
      .addOrderBy('spacePackage.basePrice', 'ASC')
      .limit(limit)
      .getMany();
  }

  async findRecurringPackages(
    recurringInterval?: string,
  ): Promise<SpacePackageEntity[]> {
    const queryBuilder = this.repository
      .createQueryBuilder('spacePackage')
      .leftJoinAndSelect('spacePackage.spaceOption', 'spaceOption')
      .where('spacePackage.isActive = :isActive', { isActive: true })
      .andWhere('spacePackage.pricingType = :pricingType', {
        pricingType: EnhancedPricingType.RECURRING,
      });

    if (recurringInterval) {
      queryBuilder.andWhere(
        'spacePackage.recurringInterval = :recurringInterval',
        { recurringInterval },
      );
    }

    return await queryBuilder
      .orderBy('spacePackage.basePrice', 'ASC')
      .getMany();
  }

  async findUsageBasedPackages(
    usageUnit?: string,
  ): Promise<SpacePackageEntity[]> {
    const queryBuilder = this.repository
      .createQueryBuilder('spacePackage')
      .leftJoinAndSelect('spacePackage.spaceOption', 'spaceOption')
      .where('spacePackage.isActive = :isActive', { isActive: true })
      .andWhere('spacePackage.pricingType = :pricingType', {
        pricingType: EnhancedPricingType.USAGE_BASED,
      });

    if (usageUnit) {
      queryBuilder.andWhere('spacePackage.usageUnit = :usageUnit', {
        usageUnit,
      });
    }

    return await queryBuilder
      .orderBy('spacePackage.basePrice', 'ASC')
      .getMany();
  }

  async count(where?: FindOptionsWhere<SpacePackageEntity>): Promise<number> {
    return await this.repository.count({ where });
  }

  async exists(id: string): Promise<boolean> {
    const count = await this.repository.count({ where: { id } });
    return count > 0;
  }

  async calculatePrice(
    id: string,
    usage?: number,
    duration?: number,
  ): Promise<number> {
    const spacePackage = await this.findById(id);
    if (!spacePackage) {
      throw new Error('Space package not found');
    }

    return spacePackage.calculatePrice(usage, duration);
  }

  async validatePricingSchema(id: string): Promise<boolean> {
    const spacePackage = await this.findById(id);
    if (!spacePackage) {
      return false;
    }

    return spacePackage.validatePricingSchema();
  }
}
