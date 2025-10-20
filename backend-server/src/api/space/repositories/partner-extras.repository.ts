import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindManyOptions, FindOptionsWhere, Repository } from 'typeorm';
import {
  ExtraCategory,
  ExtraStatus,
  PartnerAddonEntity,
} from '../../../database/entities/partner-addon.entity';

@Injectable()
export class PartnerExtrasRepository {
  constructor(
    @InjectRepository(PartnerAddonEntity)
    private readonly repository: Repository<PartnerAddonEntity>,
  ) {}

  async create(
    partnerExtrasData: Partial<PartnerAddonEntity>,
  ): Promise<PartnerAddonEntity> {
    const partnerExtras = this.repository.create(partnerExtrasData);
    return await this.repository.save(partnerExtras);
  }

  async findById(id: string): Promise<PartnerAddonEntity | null> {
    return await this.repository.findOne({
      where: { id },
      relations: [
        'partner',
        'spaceOptionExtras',
        'spaceOptionExtras.spaceOption',
      ],
    });
  }

  async findByPartnerId(
    partnerId: string,
    options?: {
      category?: ExtraCategory;
      status?: ExtraStatus;
      isActive?: boolean;
    },
  ): Promise<PartnerAddonEntity[]> {
    const where: FindOptionsWhere<PartnerAddonEntity> = { partnerId };

    if (options?.category) {
      where.category = options.category;
    }
    if (options?.status) {
      where.status = options.status;
    }
    if (options?.isActive !== undefined) {
      where.isActive = options.isActive;
    }

    return await this.repository.find({
      where,
      relations: ['partner', 'spaceOptionExtras'],
      order: { priority: 'DESC', createdAt: 'ASC' },
    });
  }

  async findMany(
    options: FindManyOptions<PartnerAddonEntity> = {},
  ): Promise<PartnerAddonEntity[]> {
    return await this.repository.find({
      ...options,
      relations: [
        'partner',
        'spaceOptionExtras',
        'spaceOptionExtras.spaceOption',
      ],
    });
  }

  async findByCategory(
    category: ExtraCategory,
    options?: {
      partnerId?: string;
      status?: ExtraStatus;
      isActive?: boolean;
    },
  ): Promise<PartnerAddonEntity[]> {
    const where: FindOptionsWhere<PartnerAddonEntity> = { category };

    if (options?.partnerId) {
      where.partnerId = options.partnerId;
    }
    if (options?.status) {
      where.status = options.status;
    }
    if (options?.isActive !== undefined) {
      where.isActive = options.isActive;
    }

    return await this.repository.find({
      where,
      relations: ['partner'],
      order: { priority: 'DESC', rating: 'DESC', createdAt: 'ASC' },
    });
  }

  async findAvailableExtras(partnerId?: string): Promise<PartnerAddonEntity[]> {
    const queryBuilder = this.repository
      .createQueryBuilder('partnerExtras')
      .leftJoinAndSelect('partnerExtras.partner', 'partner')
      .where('partnerExtras.isActive = :isActive', { isActive: true })
      .andWhere('partnerExtras.status = :status', {
        status: ExtraStatus.ACTIVE,
      })
      .andWhere(
        '(partnerExtras.stockQuantity IS NULL OR partnerExtras.stockQuantity > 0)',
      );

    if (partnerId) {
      queryBuilder.andWhere('partnerExtras.partnerId = :partnerId', {
        partnerId,
      });
    }

    return await queryBuilder
      .orderBy('partnerExtras.priority', 'DESC')
      .addOrderBy('partnerExtras.rating', 'DESC')
      .addOrderBy('partnerExtras.createdAt', 'ASC')
      .getMany();
  }

  async findLowStockItems(
    partnerId?: string,
    threshold: number = 10,
  ): Promise<PartnerAddonEntity[]> {
    const queryBuilder = this.repository
      .createQueryBuilder('partnerExtras')
      .leftJoinAndSelect('partnerExtras.partner', 'partner')
      .where('partnerExtras.isActive = :isActive', { isActive: true })
      .andWhere('partnerExtras.stockQuantity IS NOT NULL')
      .andWhere('partnerExtras.stockQuantity <= :threshold', { threshold });

    if (partnerId) {
      queryBuilder.andWhere('partnerExtras.partnerId = :partnerId', {
        partnerId,
      });
    }

    return await queryBuilder
      .orderBy('partnerExtras.stockQuantity', 'ASC')
      .addOrderBy('partnerExtras.priority', 'DESC')
      .getMany();
  }

  async update(
    id: string,
    updateData: Partial<PartnerAddonEntity>,
  ): Promise<PartnerAddonEntity | null> {
    await this.repository.update(id, updateData);
    return await this.findById(id);
  }

  async updateStock(
    id: string,
    quantity: number,
    operation: 'add' | 'subtract' | 'set' = 'set',
  ): Promise<PartnerAddonEntity | null> {
    const partnerExtras = await this.findById(id);
    if (!partnerExtras) {
      return null;
    }

    let newStock: number;
    switch (operation) {
      case 'add':
        newStock = (partnerExtras.stockQuantity || 0) + quantity;
        break;
      case 'subtract':
        newStock = Math.max(0, (partnerExtras.stockQuantity || 0) - quantity);
        break;
      case 'set':
      default:
        newStock = Math.max(0, quantity);
        break;
    }

    await this.repository.update(id, { stockQuantity: newStock });
    return await this.findById(id);
  }

  async bulkUpdateStock(
    updates: Array<{
      id: string;
      quantity: number;
      operation?: 'add' | 'subtract' | 'set';
    }>,
  ): Promise<void> {
    for (const update of updates) {
      await this.updateStock(
        update.id,
        update.quantity,
        update.operation || 'set',
      );
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

  async updateRating(id: string, newRating: number): Promise<void> {
    const partnerExtras = await this.findById(id);
    if (partnerExtras) {
      partnerExtras.updateRating(newRating);
      await this.repository.save(partnerExtras);
    }
  }

  async incrementOrders(id: string): Promise<void> {
    await this.repository.increment({ id }, 'totalOrders', 1);
  }

  async searchByName(
    searchTerm: string,
    options?: {
      partnerId?: string;
      category?: ExtraCategory;
      limit?: number;
    },
  ): Promise<PartnerAddonEntity[]> {
    const queryBuilder = this.repository
      .createQueryBuilder('partnerExtras')
      .leftJoinAndSelect('partnerExtras.partner', 'partner')
      .where('partnerExtras.isActive = :isActive', { isActive: true })
      .andWhere('partnerExtras.status = :status', {
        status: ExtraStatus.ACTIVE,
      })
      .andWhere(
        '(partnerExtras.name ILIKE :searchTerm OR partnerExtras.description ILIKE :searchTerm)',
        {
          searchTerm: `%${searchTerm}%`,
        },
      );

    if (options?.partnerId) {
      queryBuilder.andWhere('partnerExtras.partnerId = :partnerId', {
        partnerId: options.partnerId,
      });
    }

    if (options?.category) {
      queryBuilder.andWhere('partnerExtras.category = :category', {
        category: options.category,
      });
    }

    return await queryBuilder
      .orderBy('partnerExtras.rating', 'DESC')
      .addOrderBy('partnerExtras.priority', 'DESC')
      .limit(options?.limit || 20)
      .getMany();
  }

  async getStatsByPartnerId(partnerId: string): Promise<{
    totalExtras: number;
    activeExtras: number;
    averageRating: number;
    totalOrders: number;
    lowStockCount: number;
  }> {
    const result = await this.repository
      .createQueryBuilder('partnerExtras')
      .select('COUNT(*)', 'totalExtras')
      .addSelect(
        'COUNT(CASE WHEN partnerExtras.isActive = true AND partnerExtras.status = :activeStatus THEN 1 END)',
        'activeExtras',
      )
      .addSelect('AVG(partnerExtras.rating)', 'averageRating')
      .addSelect('SUM(partnerExtras.totalOrders)', 'totalOrders')
      .addSelect(
        'COUNT(CASE WHEN partnerExtras.stockQuantity IS NOT NULL AND partnerExtras.stockQuantity <= 10 THEN 1 END)',
        'lowStockCount',
      )
      .where('partnerExtras.partnerId = :partnerId', { partnerId })
      .setParameter('activeStatus', ExtraStatus.ACTIVE)
      .getRawOne();

    return {
      totalExtras: parseInt(result.totalExtras) || 0,
      activeExtras: parseInt(result.activeExtras) || 0,
      averageRating: parseFloat(result.averageRating) || 0,
      totalOrders: parseInt(result.totalOrders) || 0,
      lowStockCount: parseInt(result.lowStockCount) || 0,
    };
  }

  async findByPriceRange(
    minPrice: number,
    maxPrice: number,
    options?: {
      partnerId?: string;
      category?: ExtraCategory;
    },
  ): Promise<PartnerAddonEntity[]> {
    const queryBuilder = this.repository
      .createQueryBuilder('partnerExtras')
      .leftJoinAndSelect('partnerExtras.partner', 'partner')
      .where('partnerExtras.isActive = :isActive', { isActive: true })
      .andWhere('partnerExtras.status = :status', {
        status: ExtraStatus.ACTIVE,
      })
      .andWhere(
        'CAST(partnerExtras.pricing->>"basePrice" AS DECIMAL) BETWEEN :minPrice AND :maxPrice',
        {
          minPrice,
          maxPrice,
        },
      );

    if (options?.partnerId) {
      queryBuilder.andWhere('partnerExtras.partnerId = :partnerId', {
        partnerId: options.partnerId,
      });
    }

    if (options?.category) {
      queryBuilder.andWhere('partnerExtras.category = :category', {
        category: options.category,
      });
    }

    return await queryBuilder
      .orderBy('CAST(partnerExtras.pricing->>"basePrice" AS DECIMAL)', 'ASC')
      .addOrderBy('partnerExtras.rating', 'DESC')
      .getMany();
  }

  async count(where?: FindOptionsWhere<PartnerAddonEntity>): Promise<number> {
    return await this.repository.count({ where });
  }

  async exists(id: string): Promise<boolean> {
    const count = await this.repository.count({ where: { id } });
    return count > 0;
  }

  async findRequiringApproval(
    partnerId?: string,
  ): Promise<PartnerAddonEntity[]> {
    const where: FindOptionsWhere<PartnerAddonEntity> = {
      requiresApproval: true,
      isActive: true,
      status: ExtraStatus.ACTIVE,
    };

    if (partnerId) {
      where.partnerId = partnerId;
    }

    return await this.repository.find({
      where,
      relations: ['partner'],
      order: { priority: 'DESC', createdAt: 'ASC' },
    });
  }
}
