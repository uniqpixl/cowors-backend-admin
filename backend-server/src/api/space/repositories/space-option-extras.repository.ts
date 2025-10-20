import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindManyOptions, FindOptionsWhere, Repository } from 'typeorm';
import {
  OverrideType,
  SpaceOptionExtrasEntity,
} from '../../../database/entities/space-option-extras.entity';

@Injectable()
export class SpaceOptionExtrasRepository {
  constructor(
    @InjectRepository(SpaceOptionExtrasEntity)
    private readonly repository: Repository<SpaceOptionExtrasEntity>,
  ) {}

  async create(
    spaceOptionExtrasData: Partial<SpaceOptionExtrasEntity>,
  ): Promise<SpaceOptionExtrasEntity> {
    const spaceOptionExtras = this.repository.create(spaceOptionExtrasData);
    return await this.repository.save(spaceOptionExtras);
  }

  async bulkCreate(
    spaceOptionExtrasData: Partial<SpaceOptionExtrasEntity>[],
  ): Promise<SpaceOptionExtrasEntity[]> {
    const spaceOptionExtras = this.repository.create(spaceOptionExtrasData);
    return await this.repository.save(spaceOptionExtras);
  }

  async findById(id: string): Promise<SpaceOptionExtrasEntity | null> {
    return await this.repository.findOne({
      where: { id },
      relations: [
        'spaceOption',
        'spaceOption.space',
        'partnerExtras',
        'partnerExtras.partner',
      ],
    });
  }

  async findBySpaceOptionId(
    spaceOptionId: string,
    options?: {
      isActive?: boolean;
      isIncluded?: boolean;
      isMandatory?: boolean;
    },
  ): Promise<SpaceOptionExtrasEntity[]> {
    const where: FindOptionsWhere<SpaceOptionExtrasEntity> = { spaceOptionId };

    if (options?.isActive !== undefined) {
      where.isActive = options.isActive;
    }
    if (options?.isIncluded !== undefined) {
      where.isIncluded = options.isIncluded;
    }
    if (options?.isMandatory !== undefined) {
      where.isMandatory = options.isMandatory;
    }

    return await this.repository.find({
      where,
      relations: ['partnerExtras', 'partnerExtras.partner'],
      order: { priority: 'DESC', createdAt: 'ASC' },
    });
  }

  async findByPartnerExtrasId(
    partnerExtraId: string,
    options?: {
      isActive?: boolean;
      isIncluded?: boolean;
      isMandatory?: boolean;
    },
  ): Promise<SpaceOptionExtrasEntity[]> {
    const where: FindOptionsWhere<SpaceOptionExtrasEntity> = {
      partnerAddonId: partnerExtraId,
    };

    if (options?.isActive !== undefined) {
      where.isActive = options.isActive;
    }
    if (options?.isIncluded !== undefined) {
      where.isIncluded = options.isIncluded;
    }
    if (options?.isMandatory !== undefined) {
      where.isMandatory = options.isMandatory;
    }

    return await this.repository.find({
      where,
      relations: ['spaceOption', 'spaceOption.space'],
      order: { priority: 'DESC', createdAt: 'ASC' },
    });
  }

  async findBySpaceOptionAndPartnerExtras(
    spaceOptionId: string,
    partnerExtrasId: string,
  ): Promise<SpaceOptionExtrasEntity | null> {
    return await this.repository.findOne({
      where: { spaceOptionId, partnerAddonId: partnerExtrasId },
      relations: [
        'spaceOption',
        'spaceOption.space',
        'partnerExtras',
        'partnerExtras.partner',
      ],
    });
  }

  async findMany(
    options: FindManyOptions<SpaceOptionExtrasEntity> = {},
  ): Promise<SpaceOptionExtrasEntity[]> {
    return await this.repository.find({
      ...options,
      relations: [
        'spaceOption',
        'spaceOption.space',
        'partnerExtras',
        'partnerExtras.partner',
      ],
    });
  }

  async findIncludedExtras(
    spaceOptionId: string,
  ): Promise<SpaceOptionExtrasEntity[]> {
    return await this.repository.find({
      where: {
        spaceOptionId,
        isActive: true,
        isIncluded: true,
      },
      relations: ['partnerExtras', 'partnerExtras.partner'],
      order: { priority: 'DESC', createdAt: 'ASC' },
    });
  }

  async findMandatoryExtras(
    spaceOptionId: string,
  ): Promise<SpaceOptionExtrasEntity[]> {
    return await this.repository.find({
      where: {
        spaceOptionId,
        isActive: true,
        isMandatory: true,
      },
      relations: ['partnerExtras', 'partnerExtras.partner'],
      order: { priority: 'DESC', createdAt: 'ASC' },
    });
  }

  async findOptionalExtras(
    spaceOptionId: string,
  ): Promise<SpaceOptionExtrasEntity[]> {
    return await this.repository.find({
      where: {
        spaceOptionId,
        isActive: true,
        isIncluded: false,
        isMandatory: false,
      },
      relations: ['partnerExtras', 'partnerExtras.partner'],
      order: { priority: 'DESC', createdAt: 'ASC' },
    });
  }

  async findWithPricingOverrides(
    spaceOptionId: string,
  ): Promise<SpaceOptionExtrasEntity[]> {
    return await this.repository
      .createQueryBuilder('spaceOptionExtras')
      .leftJoinAndSelect('spaceOptionExtras.partnerExtras', 'partnerExtras')
      .leftJoinAndSelect('partnerExtras.partner', 'partner')
      .leftJoinAndSelect('spaceOptionExtras.spaceOption', 'spaceOption')
      .where('spaceOptionExtras.spaceOptionId = :spaceOptionId', {
        spaceOptionId,
      })
      .andWhere('spaceOptionExtras.isActive = :isActive', { isActive: true })
      .andWhere('spaceOptionExtras.override->>"overrideType" != :noneType', {
        noneType: OverrideType.NONE,
      })
      .orderBy('spaceOptionExtras.priority', 'DESC')
      .addOrderBy('spaceOptionExtras.createdAt', 'ASC')
      .getMany();
  }

  async findByPartnerId(partnerId: string): Promise<SpaceOptionExtrasEntity[]> {
    return await this.repository
      .createQueryBuilder('spaceOptionExtras')
      .leftJoinAndSelect('spaceOptionExtras.spaceOption', 'spaceOption')
      .leftJoinAndSelect('spaceOption.space', 'space')
      .leftJoinAndSelect('spaceOptionExtras.partnerExtras', 'partnerExtras')
      .leftJoinAndSelect('partnerExtras.partner', 'partner')
      .where('partner.id = :partnerId', { partnerId })
      .andWhere('spaceOptionExtras.isActive = :isActive', { isActive: true })
      .orderBy('spaceOptionExtras.priority', 'DESC')
      .addOrderBy('spaceOptionExtras.createdAt', 'ASC')
      .getMany();
  }

  async update(
    id: string,
    updateData: Partial<SpaceOptionExtrasEntity>,
  ): Promise<SpaceOptionExtrasEntity | null> {
    await this.repository.update(id, updateData);
    return await this.findById(id);
  }

  async bulkUpdate(
    updates: Array<{ id: string; data: Partial<SpaceOptionExtrasEntity> }>,
  ): Promise<SpaceOptionExtrasEntity[]> {
    const results: SpaceOptionExtrasEntity[] = [];

    for (const update of updates) {
      const result = await this.update(update.id, update.data);
      if (result) {
        results.push(result);
      }
    }

    return results;
  }

  async updatePriorities(
    spaceOptionId: string,
    priorityUpdates: Array<{ id: string; priority: number }>,
  ): Promise<void> {
    for (const update of priorityUpdates) {
      await this.repository.update(
        { id: update.id, spaceOptionId },
        { priority: update.priority },
      );
    }
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.repository.delete(id);
    return result.affected > 0;
  }

  async deleteBySpaceOptionAndPartnerExtras(
    spaceOptionId: string,
    partnerExtraId: string,
  ): Promise<boolean> {
    const result = await this.repository.delete({
      spaceOptionId,
      partnerAddonId: partnerExtraId,
    });
    return result.affected > 0;
  }

  async softDelete(id: string): Promise<boolean> {
    const result = await this.repository.update(id, { isActive: false });
    return result.affected > 0;
  }

  async bulkDelete(ids: string[]): Promise<number> {
    const result = await this.repository.delete(ids);
    return result.affected || 0;
  }

  async getEffectivePricing(id: string): Promise<any> {
    const spaceOptionExtras = await this.findById(id);
    if (!spaceOptionExtras) {
      return null;
    }
    return {
      pricingType: spaceOptionExtras.getEffectivePricingType(),
      basePrice: spaceOptionExtras.getEffectiveBasePrice(),
      currency: spaceOptionExtras.getEffectiveCurrency(),
    };
  }

  async getEffectiveStock(id: string): Promise<{
    stockQuantity: number | null;
    minOrderQuantity: number;
    maxOrderQuantity: number | null;
  } | null> {
    const spaceOptionExtras = await this.findById(id);
    if (!spaceOptionExtras) {
      return null;
    }
    return {
      stockQuantity: spaceOptionExtras.getEffectiveStockQuantity(),
      minOrderQuantity: spaceOptionExtras.getEffectiveMinOrderQuantity(),
      maxOrderQuantity: spaceOptionExtras.getEffectiveMaxOrderQuantity(),
    };
  }

  async getStatsBySpaceOptionId(spaceOptionId: string): Promise<{
    totalExtras: number;
    activeExtras: number;
    includedExtras: number;
    mandatoryExtras: number;
    optionalExtras: number;
    extrasWithOverrides: number;
  }> {
    const result = await this.repository
      .createQueryBuilder('spaceOptionExtras')
      .select('COUNT(*)', 'totalExtras')
      .addSelect(
        'COUNT(CASE WHEN spaceOptionExtras.isActive = true THEN 1 END)',
        'activeExtras',
      )
      .addSelect(
        'COUNT(CASE WHEN spaceOptionExtras.isActive = true AND spaceOptionExtras.isIncluded = true THEN 1 END)',
        'includedExtras',
      )
      .addSelect(
        'COUNT(CASE WHEN spaceOptionExtras.isActive = true AND spaceOptionExtras.isMandatory = true THEN 1 END)',
        'mandatoryExtras',
      )
      .addSelect(
        'COUNT(CASE WHEN spaceOptionExtras.isActive = true AND spaceOptionExtras.isIncluded = false AND spaceOptionExtras.isMandatory = false THEN 1 END)',
        'optionalExtras',
      )
      .addSelect(
        'COUNT(CASE WHEN spaceOptionExtras.isActive = true AND spaceOptionExtras.override->>"overrideType" != :noneType THEN 1 END)',
        'extrasWithOverrides',
      )
      .where('spaceOptionExtras.spaceOptionId = :spaceOptionId', {
        spaceOptionId,
      })
      .setParameter('noneType', OverrideType.NONE)
      .getRawOne();

    return {
      totalExtras: parseInt(result.totalExtras) || 0,
      activeExtras: parseInt(result.activeExtras) || 0,
      includedExtras: parseInt(result.includedExtras) || 0,
      mandatoryExtras: parseInt(result.mandatoryExtras) || 0,
      optionalExtras: parseInt(result.optionalExtras) || 0,
      extrasWithOverrides: parseInt(result.extrasWithOverrides) || 0,
    };
  }

  async count(
    where?: FindOptionsWhere<SpaceOptionExtrasEntity>,
  ): Promise<number> {
    return await this.repository.count({ where });
  }

  async exists(
    spaceOptionId: string,
    partnerExtraId: string,
  ): Promise<boolean> {
    const count = await this.repository.count({
      where: { spaceOptionId, partnerAddonId: partnerExtraId },
    });
    return count > 0;
  }

  async findDuplicateAssignments(): Promise<SpaceOptionExtrasEntity[]> {
    return await this.repository
      .createQueryBuilder('spaceOptionExtras')
      .leftJoinAndSelect('spaceOptionExtras.spaceOption', 'spaceOption')
      .leftJoinAndSelect('spaceOptionExtras.partnerExtras', 'partnerExtras')
      .where((qb) => {
        const subQuery = qb
          .subQuery()
          .select('COUNT(*)')
          .from(SpaceOptionExtrasEntity, 'soe')
          .where('soe.spaceOptionId = spaceOptionExtras.spaceOptionId')
          .andWhere('soe.partnerAddonId = spaceOptionExtras.partnerAddonId')
          .getQuery();
        return `(${subQuery}) > 1`;
      })
      .getMany();
  }
}
