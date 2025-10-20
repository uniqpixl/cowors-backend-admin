import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { plainToClass } from 'class-transformer';
import { FindOptionsWhere, Repository } from 'typeorm';
import { PartnerCategoryEntity } from '../database/entities/partner-category.entity';
import { PartnerSubcategoryEntity } from '../database/entities/partner-subcategory.entity';
import { CreatePartnerSubcategoryDto } from '../dto/partner-subcategory/create-partner-subcategory.dto';
import { PartnerSubcategoryResponseDto } from '../dto/partner-subcategory/partner-subcategory-response.dto';
import { UpdatePartnerSubcategoryDto } from '../dto/partner-subcategory/update-partner-subcategory.dto';
import { PartnerCategoryService } from './partner-category.service';

@Injectable()
export class PartnerSubcategoryService {
  constructor(
    @InjectRepository(PartnerSubcategoryEntity)
    private readonly partnerSubcategoryRepository: Repository<PartnerSubcategoryEntity>,
    @InjectRepository(PartnerCategoryEntity)
    private readonly partnerCategoryRepository: Repository<PartnerCategoryEntity>,
    private readonly partnerCategoryService: PartnerCategoryService,
  ) {}

  async create(
    createPartnerSubcategoryDto: CreatePartnerSubcategoryDto,
  ): Promise<PartnerSubcategoryResponseDto> {
    // Verify parent category exists
    const category = await this.partnerCategoryRepository.findOne({
      where: { id: createPartnerSubcategoryDto.partnerCategoryId },
    });
    if (!category) {
      throw new NotFoundException(
        `Partner category with ID '${createPartnerSubcategoryDto.partnerCategoryId}' not found`,
      );
    }

    // Generate slug if not provided
    const slug =
      createPartnerSubcategoryDto.slug ||
      this.generateSlug(createPartnerSubcategoryDto.name);

    // Check if name or slug already exists within the same category
    const existingByName = await this.partnerSubcategoryRepository.findOne({
      where: {
        name: createPartnerSubcategoryDto.name,
        categoryId: createPartnerSubcategoryDto.partnerCategoryId,
      },
    });
    if (existingByName) {
      throw new ConflictException(
        `Partner subcategory with name '${createPartnerSubcategoryDto.name}' already exists in this category`,
      );
    }

    const existingBySlug = await this.partnerSubcategoryRepository.findOne({
      where: {
        slug,
        categoryId: createPartnerSubcategoryDto.partnerCategoryId,
      },
    });
    if (existingBySlug) {
      throw new ConflictException(
        `Partner subcategory with slug '${slug}' already exists in this category`,
      );
    }

    const partnerSubcategory = this.partnerSubcategoryRepository.create({
      ...createPartnerSubcategoryDto,
      categoryId: createPartnerSubcategoryDto.partnerCategoryId,
      slug,
    });
    const savedPartnerSubcategory =
      await this.partnerSubcategoryRepository.save(partnerSubcategory);

    return this.toResponseDto(savedPartnerSubcategory);
  }

  async findAll(
    categoryId?: string,
    includeInactive = false,
  ): Promise<PartnerSubcategoryResponseDto[]> {
    const whereCondition: FindOptionsWhere<PartnerSubcategoryEntity> = {};

    if (categoryId) {
      whereCondition.categoryId = categoryId;
    }

    if (!includeInactive) {
      whereCondition.isActive = true;
    }

    const partnerSubcategories = await this.partnerSubcategoryRepository.find({
      where: whereCondition,
      order: { sortOrder: 'ASC', name: 'ASC' },
    });

    return partnerSubcategories.map((subcategory) =>
      this.toResponseDto(subcategory, true),
    );
  }

  async findOne(id: string): Promise<PartnerSubcategoryResponseDto> {
    const partnerSubcategory = await this.partnerSubcategoryRepository.findOne({
      where: { id },
    });

    if (!partnerSubcategory) {
      throw new NotFoundException(
        `Partner subcategory with ID '${id}' not found`,
      );
    }

    return this.toResponseDto(partnerSubcategory, true);
  }

  async findBySlug(
    slug: string,
    categoryId?: string,
  ): Promise<PartnerSubcategoryResponseDto> {
    const whereCondition: FindOptionsWhere<PartnerSubcategoryEntity> = { slug };
    if (categoryId) {
      whereCondition.categoryId = categoryId;
    }

    const partnerSubcategory = await this.partnerSubcategoryRepository.findOne({
      where: whereCondition,
    });

    if (!partnerSubcategory) {
      throw new NotFoundException(
        `Partner subcategory with slug '${slug}' not found`,
      );
    }

    return this.toResponseDto(partnerSubcategory, true);
  }

  async findByCategory(
    categoryId: string,
    includeInactive = false,
  ): Promise<PartnerSubcategoryResponseDto[]> {
    // Verify category exists
    const category = await this.partnerCategoryRepository.findOne({
      where: { id: categoryId },
    });
    if (!category) {
      throw new NotFoundException(
        `Partner category with ID '${categoryId}' not found`,
      );
    }

    return this.findAll(categoryId, includeInactive);
  }

  async update(
    id: string,
    updatePartnerSubcategoryDto: UpdatePartnerSubcategoryDto,
  ): Promise<PartnerSubcategoryResponseDto> {
    const partnerSubcategory = await this.partnerSubcategoryRepository.findOne({
      where: { id },
    });
    if (!partnerSubcategory) {
      throw new NotFoundException(
        `Partner subcategory with ID '${id}' not found`,
      );
    }

    // Generate slug if name is being updated and slug is not provided
    let slug = updatePartnerSubcategoryDto.slug;
    if (updatePartnerSubcategoryDto.name && !slug) {
      slug = this.generateSlug(updatePartnerSubcategoryDto.name);
    }

    // Check for conflicts if name or slug is being updated
    if (
      updatePartnerSubcategoryDto.name &&
      updatePartnerSubcategoryDto.name !== partnerSubcategory.name
    ) {
      const existingByName = await this.partnerSubcategoryRepository.findOne({
        where: {
          name: updatePartnerSubcategoryDto.name,
          categoryId: partnerSubcategory.categoryId,
        },
      });
      if (existingByName && existingByName.id !== id) {
        throw new ConflictException(
          `Partner subcategory with name '${updatePartnerSubcategoryDto.name}' already exists in this category`,
        );
      }
    }

    if (slug && slug !== partnerSubcategory.slug) {
      const existingBySlug = await this.partnerSubcategoryRepository.findOne({
        where: {
          slug,
          categoryId: partnerSubcategory.categoryId,
        },
      });
      if (existingBySlug && existingBySlug.id !== id) {
        throw new ConflictException(
          `Partner subcategory with slug '${slug}' already exists in this category`,
        );
      }
    }

    Object.assign(partnerSubcategory, updatePartnerSubcategoryDto);
    if (slug) {
      partnerSubcategory.slug = slug;
    }

    const updatedPartnerSubcategory =
      await this.partnerSubcategoryRepository.save(partnerSubcategory);

    return this.toResponseDto(updatedPartnerSubcategory);
  }

  async remove(id: string): Promise<void> {
    const partnerSubcategory = await this.partnerSubcategoryRepository.findOne({
      where: { id },
    });

    if (!partnerSubcategory) {
      throw new NotFoundException(
        `Partner subcategory with ID '${id}' not found`,
      );
    }

    // TODO: Check if there are associated offerings
    // This check is temporarily disabled until PartnerOfferingEntity is properly integrated

    await this.partnerSubcategoryRepository.softDelete(id);
  }

  async toggleActive(id: string): Promise<PartnerSubcategoryResponseDto> {
    const partnerSubcategory = await this.partnerSubcategoryRepository.findOne({
      where: { id },
    });
    if (!partnerSubcategory) {
      throw new NotFoundException(
        `Partner subcategory with ID '${id}' not found`,
      );
    }

    partnerSubcategory.isActive = !partnerSubcategory.isActive;
    const updatedPartnerSubcategory =
      await this.partnerSubcategoryRepository.save(partnerSubcategory);

    return this.toResponseDto(updatedPartnerSubcategory);
  }

  async reorder(
    reorderData: { id: string; sortOrder: number }[],
  ): Promise<PartnerSubcategoryResponseDto[]> {
    const updatePromises = reorderData.map(async ({ id, sortOrder }) => {
      const partnerSubcategory =
        await this.partnerSubcategoryRepository.findOne({ where: { id } });
      if (!partnerSubcategory) {
        throw new NotFoundException(
          `Partner subcategory with ID '${id}' not found`,
        );
      }
      partnerSubcategory.sortOrder = sortOrder;
      return this.partnerSubcategoryRepository.save(partnerSubcategory);
    });

    const updatedPartnerSubcategories = await Promise.all(updatePromises);
    return updatedPartnerSubcategories.map((subcategory) =>
      this.toResponseDto(subcategory),
    );
  }

  // Rule inheritance methods
  async getEffectivePricingRules(id: string): Promise<any> {
    const partnerSubcategory = await this.partnerSubcategoryRepository.findOne({
      where: { id },
      relations: ['category'],
    });
    if (!partnerSubcategory) {
      throw new NotFoundException(
        `Partner subcategory with ID '${id}' not found`,
      );
    }

    // Use helper method from entity to get effective pricing rules
    return partnerSubcategory.getEffectivePricingRules();
  }

  async getEffectiveFeatureRules(id: string): Promise<any> {
    const partnerSubcategory = await this.partnerSubcategoryRepository.findOne({
      where: { id },
      relations: ['category'],
    });
    if (!partnerSubcategory) {
      throw new NotFoundException(
        `Partner subcategory with ID '${id}' not found`,
      );
    }

    // Use helper method from entity to get effective feature rules
    return partnerSubcategory.getEffectiveFeatures();
  }

  async getEffectiveValidationRules(id: string): Promise<any> {
    const partnerSubcategory = await this.partnerSubcategoryRepository.findOne({
      where: { id },
      relations: ['category'],
    });
    if (!partnerSubcategory) {
      throw new NotFoundException(
        `Partner subcategory with ID '${id}' not found`,
      );
    }

    // Use helper method from entity to get effective requirements
    return partnerSubcategory.getEffectiveRequirements();
  }

  // Note: Rule update methods have been removed as rules are now managed at partner type level
  // These methods should be implemented at the partner type service level instead

  async updatePricingRules(
    id: string,
    pricingRules: any,
  ): Promise<PartnerSubcategoryResponseDto> {
    throw new Error(
      'Pricing rules are now managed at partner type level. Use partner type service instead.',
    );
  }

  async updateFeatureRules(
    id: string,
    featureRules: any,
  ): Promise<PartnerSubcategoryResponseDto> {
    throw new Error(
      'Feature rules are now managed at partner type level. Use partner type service instead.',
    );
  }

  async updateValidationRules(
    id: string,
    validationRules: any,
  ): Promise<PartnerSubcategoryResponseDto> {
    throw new Error(
      'Validation rules are now managed at partner type level. Use partner type service instead.',
    );
  }

  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  }

  private toResponseDto(
    partnerSubcategory: PartnerSubcategoryEntity,
    includeCounts = false,
  ): PartnerSubcategoryResponseDto {
    const responseDto = plainToClass(
      PartnerSubcategoryResponseDto,
      partnerSubcategory,
      {
        excludeExtraneousValues: true,
      },
    );

    if (includeCounts) {
      // Note: offeringCount will be 0 since we're not loading relations
      // This can be optimized later with a separate count query if needed
      responseDto.offeringCount = 0;
    }

    return responseDto;
  }
}
