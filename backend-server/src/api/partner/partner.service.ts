import { UserEntity } from '@/auth/entities/user.entity';
import { CursorPaginationDto } from '@/common/dto/cursor-pagination/cursor-pagination.dto';
import { CursorPaginatedDto } from '@/common/dto/cursor-pagination/paginated.dto';
import { OffsetPaginatedDto } from '@/common/dto/offset-pagination/paginated.dto';
import { PartnerStatus, VerificationStatus } from '@/common/enums/partner.enum';
import { Uuid } from '@/common/types/common.type';
import {
  ErrorCodes,
  ErrorResponseUtil,
} from '@/common/utils/error-response.util';
import { PartnerCategoryEntity } from '@/database/entities/partner-category.entity';
import { PartnerSubcategoryEntity } from '@/database/entities/partner-subcategory.entity';
import { PartnerTypeEntity } from '@/database/entities/partner-type.entity';
import { PartnerEntity } from '@/database/entities/partner.entity';
import { CurrentUserSession } from '@/decorators/auth/current-user-session.decorator';
import { I18nTranslations } from '@/generated/i18n.generated';
import { buildPaginator } from '@/utils/pagination/cursor-pagination';
import { paginate } from '@/utils/pagination/offset-pagination';
import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { I18nService } from 'nestjs-i18n';
import { FindManyOptions, FindOneOptions, Repository } from 'typeorm';
import { CreatePartnerDto } from './dto/create-partner.dto';
import {
  QueryPartnersCursorDto,
  QueryPartnersOffsetDto,
} from './dto/partner.dto';
import {
  UpdatePartnerDto,
  UpdatePartnerVerificationDto,
} from './dto/update-partner.dto';

@Injectable()
export class PartnerService {
  constructor(
    @InjectRepository(PartnerEntity)
    private readonly partnerRepository: Repository<PartnerEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    @InjectRepository(PartnerTypeEntity)
    private readonly partnerTypeRepository: Repository<PartnerTypeEntity>,
    @InjectRepository(PartnerCategoryEntity)
    private readonly partnerCategoryRepository: Repository<PartnerCategoryEntity>,
    @InjectRepository(PartnerSubcategoryEntity)
    private readonly partnerSubcategoryRepository: Repository<PartnerSubcategoryEntity>,
    private readonly i18n: I18nService<I18nTranslations>,
  ) {}

  async createPartner(
    createPartnerDto: CreatePartnerDto,
    currentUser: CurrentUserSession,
  ): Promise<PartnerEntity> {
    const userId = currentUser.user.id;

    // Check if partner already exists for this user
    const existingPartner = await this.partnerRepository.findOne({
      where: { userId },
    });

    if (existingPartner) {
      throw ErrorResponseUtil.conflict(
        'Partner profile already exists for this user',
        ErrorCodes.RESOURCE_CONFLICT,
      );
    }

    // Verify user exists
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw ErrorResponseUtil.notFound('User', userId);
    }

    // Validate dynamic category fields if provided
    if (createPartnerDto.partnerTypeId) {
      const partnerType = await this.partnerTypeRepository.findOne({
        where: { id: createPartnerDto.partnerTypeId, isActive: true },
      });
      if (!partnerType) {
        throw ErrorResponseUtil.notFound(
          'Partner Type',
          createPartnerDto.partnerTypeId,
        );
      }
    }

    if (createPartnerDto.primaryCategoryId) {
      const category = await this.partnerCategoryRepository.findOne({
        where: { id: createPartnerDto.primaryCategoryId, isActive: true },
      });
      if (!category) {
        throw ErrorResponseUtil.notFound(
          'Partner Category',
          createPartnerDto.primaryCategoryId,
        );
      }
    }

    if (createPartnerDto.primarySubcategoryId) {
      const subcategory = await this.partnerSubcategoryRepository.findOne({
        where: { id: createPartnerDto.primarySubcategoryId, isActive: true },
      });
      if (!subcategory) {
        throw ErrorResponseUtil.notFound(
          'Partner Subcategory',
          createPartnerDto.primarySubcategoryId,
        );
      }
    }

    const partner = this.partnerRepository.create({
      userId,
      businessName: createPartnerDto.businessName,
      // Legacy fields for backward compatibility
      businessType: createPartnerDto.businessType,
      businessSubtype: createPartnerDto.businessSubtype,
      // New dynamic category fields
      partnerTypeId: createPartnerDto.partnerTypeId,
      primaryCategoryId: createPartnerDto.primaryCategoryId,
      primarySubcategoryId: createPartnerDto.primarySubcategoryId,
      contactInfo: createPartnerDto.contactInfo,
      businessDetails: createPartnerDto.businessDetails,
      operatingHours: createPartnerDto.operatingHours as any,
      commissionRate: createPartnerDto.commissionRate || 10,
      verificationStatus: VerificationStatus.PENDING,
      status: PartnerStatus.ACTIVE,
      rating: 0,
      reviewCount: 0,
    });

    const savedPartner = await this.partnerRepository.save(partner);
    return savedPartner;
  }

  async findAllPartners(
    queryDto: QueryPartnersOffsetDto,
  ): Promise<OffsetPaginatedDto<PartnerEntity>> {
    const queryBuilder = this.partnerRepository.createQueryBuilder('partner');

    // Apply filters
    if (queryDto.businessType) {
      queryBuilder.andWhere('partner.businessType = :businessType', {
        businessType: queryDto.businessType,
      });
    }

    if (queryDto.status) {
      queryBuilder.andWhere('partner.status = :status', {
        status: queryDto.status,
      });
    }

    if (queryDto.verificationStatus) {
      queryBuilder.andWhere(
        'partner.verificationStatus = :verificationStatus',
        {
          verificationStatus: queryDto.verificationStatus,
        },
      );
    }

    // Add ordering
    queryBuilder.orderBy('partner.createdAt', 'DESC');

    const result = await paginate(queryBuilder, queryDto);
    return {
      data: result[0],
      pagination: result[1],
    } as OffsetPaginatedDto<PartnerEntity>;
  }

  async findAllPartnersCursor(
    queryDto: QueryPartnersCursorDto,
  ): Promise<CursorPaginatedDto<PartnerEntity>> {
    const queryBuilder = this.partnerRepository.createQueryBuilder('partner');

    const paginator = buildPaginator({
      entity: PartnerEntity,
      paginationKeys: ['id'],
      query: {
        limit: queryDto.limit || 10,
        order: 'ASC',
      },
    });

    const result = await paginator.paginate(queryBuilder);

    const pagination = {
      limit: queryDto.limit,
      afterCursor: result.cursor.afterCursor || '',
      beforeCursor: result.cursor.beforeCursor || '',
      totalRecords: result.data.length,
    } as CursorPaginationDto;

    return new CursorPaginatedDto(result.data, pagination);
  }

  async findOnePartner(id: Uuid): Promise<PartnerEntity> {
    const partner = await this.partnerRepository.findOne({
      where: { id },
      relations: ['user'],
    });

    if (!partner) {
      throw ErrorResponseUtil.notFound('Partner', id);
    }

    return partner;
  }

  async findPartnerByUserId(userId: Uuid): Promise<PartnerEntity | null> {
    return this.partnerRepository.findOne({
      where: { userId },
      relations: ['user'],
    });
  }

  async updatePartner(
    id: Uuid,
    updatePartnerDto: UpdatePartnerDto,
    currentUser: CurrentUserSession,
  ): Promise<PartnerEntity> {
    const partner = await this.findOnePartner(id);

    // Check if user owns this partner profile
    if (partner.userId !== currentUser.user.id) {
      throw ErrorResponseUtil.forbidden(
        'Not authorized to update this partner profile',
        ErrorCodes.FORBIDDEN,
      );
    }

    // Validate dynamic category fields if provided
    if (updatePartnerDto.partnerTypeId) {
      const partnerType = await this.partnerTypeRepository.findOne({
        where: { id: updatePartnerDto.partnerTypeId, isActive: true },
      });
      if (!partnerType) {
        throw ErrorResponseUtil.notFound(
          'Partner Type',
          updatePartnerDto.partnerTypeId,
        );
      }
    }

    if (updatePartnerDto.primaryCategoryId) {
      const category = await this.partnerCategoryRepository.findOne({
        where: { id: updatePartnerDto.primaryCategoryId, isActive: true },
      });
      if (!category) {
        throw ErrorResponseUtil.notFound(
          'Partner Category',
          updatePartnerDto.primaryCategoryId,
        );
      }
    }

    if (updatePartnerDto.primarySubcategoryId) {
      const subcategory = await this.partnerSubcategoryRepository.findOne({
        where: { id: updatePartnerDto.primarySubcategoryId, isActive: true },
      });
      if (!subcategory) {
        throw ErrorResponseUtil.notFound(
          'Partner Subcategory',
          updatePartnerDto.primarySubcategoryId,
        );
      }
    }

    Object.assign(partner, updatePartnerDto);
    return this.partnerRepository.save(partner);
  }

  async updatePartnerVerification(
    id: Uuid,
    updateVerificationDto: UpdatePartnerVerificationDto,
  ): Promise<PartnerEntity> {
    const partner = await this.findOnePartner(id);

    Object.assign(partner, updateVerificationDto);

    // Auto-activate partner if verified
    if (
      updateVerificationDto.verificationStatus === VerificationStatus.VERIFIED
    ) {
      partner.status = PartnerStatus.ACTIVE;
    }

    return this.partnerRepository.save(partner);
  }

  async deletePartner(
    id: Uuid,
    currentUser: CurrentUserSession,
  ): Promise<PartnerEntity> {
    const partner = await this.findOnePartner(id);

    // Check if user owns this partner profile
    if (partner.userId !== currentUser.user.id) {
      throw ErrorResponseUtil.forbidden(
        'Not authorized to delete this partner profile',
        ErrorCodes.FORBIDDEN,
      );
    }

    // Soft delete
    partner.status = PartnerStatus.INACTIVE;
    partner.deletedAt = new Date();

    return this.partnerRepository.save(partner);
  }

  async getAllPartners(): Promise<PartnerEntity[]> {
    return this.partnerRepository.find({
      relations: ['user'],
      order: { createdAt: 'DESC' },
    });
  }

  async getPartnerStats(partnerId: Uuid) {
    const partner = await this.findOnePartner(partnerId);

    // TODO: Implement stats calculation when booking module is ready
    return {
      totalBookings: 0,
      totalRevenue: 0,
      averageRating: partner.rating,
      totalReviews: partner.reviewCount,
    };
  }

  // Dynamic category system methods
  async findPartnersByType(partnerTypeId: Uuid): Promise<PartnerEntity[]> {
    return this.partnerRepository.find({
      where: { partnerTypeId, status: PartnerStatus.ACTIVE },
      relations: [
        'user',
        'partnerType',
        'primaryCategory',
        'primarySubcategory',
      ],
      order: { createdAt: 'DESC' },
    });
  }

  async findPartnersByCategory(categoryId: Uuid): Promise<PartnerEntity[]> {
    return this.partnerRepository.find({
      where: { primaryCategoryId: categoryId, status: PartnerStatus.ACTIVE },
      relations: [
        'user',
        'partnerType',
        'primaryCategory',
        'primarySubcategory',
      ],
      order: { createdAt: 'DESC' },
    });
  }

  async findPartnersBySubcategory(
    subcategoryId: Uuid,
  ): Promise<PartnerEntity[]> {
    return this.partnerRepository.find({
      where: {
        primarySubcategoryId: subcategoryId,
        status: PartnerStatus.ACTIVE,
      },
      relations: [
        'user',
        'partnerType',
        'primaryCategory',
        'primarySubcategory',
      ],
      order: { createdAt: 'DESC' },
    });
  }

  async getPartnerWithCategories(id: Uuid): Promise<PartnerEntity> {
    const partner = await this.partnerRepository.findOne({
      where: { id },
      relations: [
        'user',
        'partnerType',
        'primaryCategory',
        'primarySubcategory',
      ],
    });

    if (!partner) {
      throw ErrorResponseUtil.notFound('Partner', id);
    }

    return partner;
  }
}
