import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindManyOptions, FindOptionsWhere, Repository } from 'typeorm';
import {
  SpaceOptionEntity,
  SpaceOptionStatus,
  SpaceOptionType,
} from '../../../database/entities/space-option.entity';

@Injectable()
export class SpaceOptionRepository {
  constructor(
    @InjectRepository(SpaceOptionEntity)
    private readonly repository: Repository<SpaceOptionEntity>,
  ) {}

  async create(
    spaceOptionData: Partial<SpaceOptionEntity>,
  ): Promise<SpaceOptionEntity> {
    const spaceOption = this.repository.create(spaceOptionData);
    return await this.repository.save(spaceOption);
  }

  async findById(id: string): Promise<SpaceOptionEntity | null> {
    return await this.repository.findOne({
      where: { id },
      relations: [
        'space',
        'space.partner',
        'spaceOptionExtras',
        'spaceOptionExtras.partnerExtras',
      ],
    });
  }

  async findBySpaceId(
    spaceId: string,
    options?: {
      status?: SpaceOptionStatus;
      optionType?: SpaceOptionType;
      isActive?: boolean;
    },
  ): Promise<SpaceOptionEntity[]> {
    const where: FindOptionsWhere<SpaceOptionEntity> = { spaceId };

    if (options?.status) {
      where.status = options.status;
    }
    if (options?.optionType) {
      where.optionType = options.optionType;
    }
    if (options?.isActive !== undefined) {
      where.isActive = options.isActive;
    }

    return await this.repository.find({
      where,
      relations: [
        'space',
        'spaceOptionExtras',
        'spaceOptionExtras.partnerExtras',
      ],
      order: { priority: 'DESC', createdAt: 'ASC' },
    });
  }

  async findMany(
    options: FindManyOptions<SpaceOptionEntity> = {},
  ): Promise<SpaceOptionEntity[]> {
    return await this.repository.find({
      ...options,
      relations: [
        'space',
        'space.partner',
        'spaceOptionExtras',
        'spaceOptionExtras.partnerExtras',
      ],
    });
  }

  async findByPartnerId(
    partnerId: string,
    options?: {
      status?: SpaceOptionStatus;
      optionType?: SpaceOptionType;
      isActive?: boolean;
    },
  ): Promise<SpaceOptionEntity[]> {
    const queryBuilder = this.repository
      .createQueryBuilder('spaceOption')
      .leftJoinAndSelect('spaceOption.space', 'space')
      .leftJoinAndSelect('space.partner', 'partner')
      .leftJoinAndSelect('spaceOption.spaceOptionExtras', 'spaceOptionExtras')
      .leftJoinAndSelect('spaceOptionExtras.partnerExtras', 'partnerExtras')
      .where('partner.id = :partnerId', { partnerId });

    if (options?.status) {
      queryBuilder.andWhere('spaceOption.status = :status', {
        status: options.status,
      });
    }
    if (options?.optionType) {
      queryBuilder.andWhere('spaceOption.optionType = :optionType', {
        optionType: options.optionType,
      });
    }
    if (options?.isActive !== undefined) {
      queryBuilder.andWhere('spaceOption.isActive = :isActive', {
        isActive: options.isActive,
      });
    }

    return await queryBuilder
      .orderBy('spaceOption.priority', 'DESC')
      .addOrderBy('spaceOption.createdAt', 'ASC')
      .getMany();
  }

  async findAvailableByCapacity(
    minCapacity: number,
    maxCapacity?: number,
  ): Promise<SpaceOptionEntity[]> {
    const queryBuilder = this.repository
      .createQueryBuilder('spaceOption')
      .leftJoinAndSelect('spaceOption.space', 'space')
      .leftJoinAndSelect('space.partner', 'partner')
      .where('spaceOption.isActive = :isActive', { isActive: true })
      .andWhere('spaceOption.status = :status', {
        status: SpaceOptionStatus.ACTIVE,
      })
      .andWhere(
        '(spaceOption.maxCapacity IS NULL OR spaceOption.maxCapacity >= :minCapacity)',
        { minCapacity },
      );

    if (maxCapacity) {
      queryBuilder.andWhere(
        '(spaceOption.minCapacity IS NULL OR spaceOption.minCapacity <= :maxCapacity)',
        { maxCapacity },
      );
    }

    return await queryBuilder
      .orderBy('spaceOption.rating', 'DESC')
      .addOrderBy('spaceOption.priority', 'DESC')
      .getMany();
  }

  async update(
    id: string,
    updateData: Partial<SpaceOptionEntity>,
  ): Promise<SpaceOptionEntity | null> {
    await this.repository.update(id, updateData);
    return await this.findById(id);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.repository.delete(id);
    return result.affected > 0;
  }

  async softDelete(id: string): Promise<boolean> {
    const result = await this.repository.update(id, { isActive: false });
    return result.affected > 0;
  }

  async updateRating(id: string, newRating: number): Promise<void> {
    const spaceOption = await this.findById(id);
    if (spaceOption) {
      spaceOption.updateRating(newRating);
      await this.repository.save(spaceOption);
    }
  }

  async incrementBookings(id: string): Promise<void> {
    await this.repository.increment({ id }, 'totalBookings', 1);
  }

  async getStatsBySpaceId(spaceId: string): Promise<{
    totalOptions: number;
    activeOptions: number;
    averageRating: number;
    totalBookings: number;
  }> {
    const result = await this.repository
      .createQueryBuilder('spaceOption')
      .select('COUNT(*)', 'totalOptions')
      .addSelect(
        'COUNT(CASE WHEN spaceOption.isActive = true AND spaceOption.status = :activeStatus THEN 1 END)',
        'activeOptions',
      )
      .addSelect('AVG(spaceOption.rating)', 'averageRating')
      .addSelect('SUM(spaceOption.totalBookings)', 'totalBookings')
      .where('spaceOption.spaceId = :spaceId', { spaceId })
      .setParameter('activeStatus', SpaceOptionStatus.ACTIVE)
      .getRawOne();

    return {
      totalOptions: parseInt(result.totalOptions) || 0,
      activeOptions: parseInt(result.activeOptions) || 0,
      averageRating: parseFloat(result.averageRating) || 0,
      totalBookings: parseInt(result.totalBookings) || 0,
    };
  }

  async searchByName(
    searchTerm: string,
    limit: number = 20,
  ): Promise<SpaceOptionEntity[]> {
    return await this.repository
      .createQueryBuilder('spaceOption')
      .leftJoinAndSelect('spaceOption.space', 'space')
      .leftJoinAndSelect('space.partner', 'partner')
      .where('spaceOption.isActive = :isActive', { isActive: true })
      .andWhere('spaceOption.status = :status', {
        status: SpaceOptionStatus.ACTIVE,
      })
      .andWhere(
        '(spaceOption.name ILIKE :searchTerm OR spaceOption.description ILIKE :searchTerm)',
        {
          searchTerm: `%${searchTerm}%`,
        },
      )
      .orderBy('spaceOption.rating', 'DESC')
      .addOrderBy('spaceOption.priority', 'DESC')
      .limit(limit)
      .getMany();
  }

  async findByAmenities(amenities: string[]): Promise<SpaceOptionEntity[]> {
    const queryBuilder = this.repository
      .createQueryBuilder('spaceOption')
      .leftJoinAndSelect('spaceOption.space', 'space')
      .leftJoinAndSelect('space.partner', 'partner')
      .where('spaceOption.isActive = :isActive', { isActive: true })
      .andWhere('spaceOption.status = :status', {
        status: SpaceOptionStatus.ACTIVE,
      });

    amenities.forEach((amenity, index) => {
      queryBuilder.andWhere(
        `JSON_EXTRACT_PATH_TEXT(spaceOption.amenities, '${index}') = :amenity${index} OR ` +
          `spaceOption.amenities @> :amenityJson${index}`,
        {
          [`amenity${index}`]: amenity,
          [`amenityJson${index}`]: JSON.stringify([amenity]),
        },
      );
    });

    return await queryBuilder
      .orderBy('spaceOption.rating', 'DESC')
      .addOrderBy('spaceOption.priority', 'DESC')
      .getMany();
  }

  async count(where?: FindOptionsWhere<SpaceOptionEntity>): Promise<number> {
    return await this.repository.count({ where });
  }

  async exists(id: string): Promise<boolean> {
    const count = await this.repository.count({ where: { id } });
    return count > 0;
  }
}
