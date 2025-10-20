import { CACHE_MANAGER } from '@nestjs/cache-manager';
import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Cache } from 'cache-manager';
import { plainToClass } from 'class-transformer';
import { FindOptionsWhere, Repository } from 'typeorm';
import { PartnerCategoryEntity } from '../database/entities/partner-category.entity';
import { PartnerTypeEntity } from '../database/entities/partner-type.entity';
import { CreatePartnerCategoryDto } from '../dto/partner-category/create-partner-category.dto';
import { PartnerCategoryResponseDto } from '../dto/partner-category/partner-category-response.dto';
import { UpdatePartnerCategoryDto } from '../dto/partner-category/update-partner-category.dto';
import { RuleInheritanceResult } from '../interfaces/rule-templates.interface';
import { PartnerTypeService } from './partner-type.service';
import { RuleTemplateService } from './rule-template.service';

@Injectable()
export class PartnerCategoryService {
  constructor(
    @InjectRepository(PartnerCategoryEntity)
    private readonly partnerCategoryRepository: Repository<PartnerCategoryEntity>,
    @InjectRepository(PartnerTypeEntity)
    private readonly partnerTypeRepository: Repository<PartnerTypeEntity>,
    private readonly partnerTypeService: PartnerTypeService,
    private readonly ruleTemplateService: RuleTemplateService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {}

  async create(
    createPartnerCategoryDto: CreatePartnerCategoryDto,
  ): Promise<PartnerCategoryResponseDto> {
    // Verify partner type exists
    const partnerType = await this.partnerTypeRepository.findOne({
      where: { id: createPartnerCategoryDto.partnerTypeId },
    });
    if (!partnerType) {
      throw new NotFoundException(
        `Partner type with ID '${createPartnerCategoryDto.partnerTypeId}' not found`,
      );
    }

    // Check if name or slug already exists within the same partner type
    const existingByName = await this.partnerCategoryRepository.findOne({
      where: {
        name: createPartnerCategoryDto.name,
        partnerTypeId: createPartnerCategoryDto.partnerTypeId,
      },
    });
    if (existingByName) {
      throw new ConflictException(
        `Partner category with name '${createPartnerCategoryDto.name}' already exists in this partner type`,
      );
    }

    const existingBySlug = await this.partnerCategoryRepository.findOne({
      where: {
        slug: createPartnerCategoryDto.slug,
        partnerTypeId: createPartnerCategoryDto.partnerTypeId,
      },
    });
    if (existingBySlug) {
      throw new ConflictException(
        `Partner category with slug '${createPartnerCategoryDto.slug}' already exists in this partner type`,
      );
    }

    const partnerCategory = this.partnerCategoryRepository.create(
      createPartnerCategoryDto,
    );
    const savedPartnerCategory =
      await this.partnerCategoryRepository.save(partnerCategory);

    return this.toResponseDto(savedPartnerCategory);
  }

  async findAll(
    partnerTypeId?: string,
    includeInactive = false,
  ): Promise<PartnerCategoryResponseDto[]> {
    const whereCondition: FindOptionsWhere<PartnerCategoryEntity> = {};

    if (partnerTypeId) {
      whereCondition.partnerTypeId = partnerTypeId;
    }

    if (!includeInactive) {
      whereCondition.isActive = true;
    }

    const partnerCategories = await this.partnerCategoryRepository.find({
      where: whereCondition,
      order: { sortOrder: 'ASC', name: 'ASC' },
    });

    return partnerCategories.map((category) =>
      this.toResponseDto(category, true),
    );
  }

  async findOne(id: string): Promise<PartnerCategoryResponseDto> {
    const partnerCategory = await this.partnerCategoryRepository.findOne({
      where: { id },
      relations: ['partnerType', 'subcategories', 'offerings'],
    });

    if (!partnerCategory) {
      throw new NotFoundException(`Partner category with ID '${id}' not found`);
    }

    return this.toResponseDto(partnerCategory, true);
  }

  async findBySlug(
    slug: string,
    partnerTypeId?: string,
  ): Promise<PartnerCategoryResponseDto> {
    const whereCondition: FindOptionsWhere<PartnerCategoryEntity> = { slug };
    if (partnerTypeId) {
      whereCondition.partnerTypeId = partnerTypeId;
    }

    const partnerCategory = await this.partnerCategoryRepository.findOne({
      where: whereCondition,
      relations: ['partnerType', 'subcategories', 'offerings'],
    });

    if (!partnerCategory) {
      throw new NotFoundException(
        `Partner category with slug '${slug}' not found`,
      );
    }

    return this.toResponseDto(partnerCategory, true);
  }

  async findByPartnerType(
    partnerTypeId: string,
    includeInactive = false,
  ): Promise<PartnerCategoryResponseDto[]> {
    // Verify partner type exists
    const partnerType = await this.partnerTypeRepository.findOne({
      where: { id: partnerTypeId },
    });
    if (!partnerType) {
      throw new NotFoundException(
        `Partner type with ID '${partnerTypeId}' not found`,
      );
    }

    return this.findAll(partnerTypeId, includeInactive);
  }

  async update(
    id: string,
    updatePartnerCategoryDto: UpdatePartnerCategoryDto,
  ): Promise<PartnerCategoryResponseDto> {
    const partnerCategory = await this.partnerCategoryRepository.findOne({
      where: { id },
      relations: ['partnerType'],
    });
    if (!partnerCategory) {
      throw new NotFoundException(`Partner category with ID '${id}' not found`);
    }

    // Check for conflicts if name or slug is being updated
    if (
      updatePartnerCategoryDto.name &&
      updatePartnerCategoryDto.name !== partnerCategory.name
    ) {
      const existingByName = await this.partnerCategoryRepository.findOne({
        where: {
          name: updatePartnerCategoryDto.name,
          partnerTypeId: partnerCategory.partnerTypeId,
        },
      });
      if (existingByName && existingByName.id !== id) {
        throw new ConflictException(
          `Partner category with name '${updatePartnerCategoryDto.name}' already exists in this partner type`,
        );
      }
    }

    if (
      updatePartnerCategoryDto.slug &&
      updatePartnerCategoryDto.slug !== partnerCategory.slug
    ) {
      const existingBySlug = await this.partnerCategoryRepository.findOne({
        where: {
          slug: updatePartnerCategoryDto.slug,
          partnerTypeId: partnerCategory.partnerTypeId,
        },
      });
      if (existingBySlug && existingBySlug.id !== id) {
        throw new ConflictException(
          `Partner category with slug '${updatePartnerCategoryDto.slug}' already exists in this partner type`,
        );
      }
    }

    Object.assign(partnerCategory, updatePartnerCategoryDto);
    const updatedPartnerCategory =
      await this.partnerCategoryRepository.save(partnerCategory);

    return this.toResponseDto(updatedPartnerCategory);
  }

  async remove(id: string): Promise<void> {
    const partnerCategory = await this.partnerCategoryRepository.findOne({
      where: { id },
      relations: ['subcategories', 'offerings'],
    });

    if (!partnerCategory) {
      throw new NotFoundException(`Partner category with ID '${id}' not found`);
    }

    // Check if there are associated subcategories or offerings
    if (
      partnerCategory.subcategories &&
      partnerCategory.subcategories.length > 0
    ) {
      throw new BadRequestException(
        `Cannot delete partner category '${partnerCategory.name}' because it has ${partnerCategory.subcategories.length} associated subcategories`,
      );
    }

    if (partnerCategory.offerings && partnerCategory.offerings.length > 0) {
      throw new BadRequestException(
        `Cannot delete partner category '${partnerCategory.name}' because it has ${partnerCategory.offerings.length} associated offerings`,
      );
    }

    await this.partnerCategoryRepository.softDelete(id);
  }

  async toggleActive(id: string): Promise<PartnerCategoryResponseDto> {
    const partnerCategory = await this.partnerCategoryRepository.findOne({
      where: { id },
    });
    if (!partnerCategory) {
      throw new NotFoundException(`Partner category with ID '${id}' not found`);
    }

    partnerCategory.isActive = !partnerCategory.isActive;
    const updatedPartnerCategory =
      await this.partnerCategoryRepository.save(partnerCategory);

    return this.toResponseDto(updatedPartnerCategory);
  }

  async reorder(
    reorderData: { id: string; sortOrder: number }[],
  ): Promise<PartnerCategoryResponseDto[]> {
    const updatePromises = reorderData.map(async ({ id, sortOrder }) => {
      const partnerCategory = await this.partnerCategoryRepository.findOne({
        where: { id },
      });
      if (!partnerCategory) {
        throw new NotFoundException(
          `Partner category with ID '${id}' not found`,
        );
      }
      partnerCategory.sortOrder = sortOrder;
      return this.partnerCategoryRepository.save(partnerCategory);
    });

    const updatedPartnerCategories = await Promise.all(updatePromises);
    return updatedPartnerCategories.map((category) =>
      this.toResponseDto(category),
    );
  }

  // Enhanced rule inheritance methods with caching and validation
  async getEffectivePricingRules(id: string): Promise<RuleInheritanceResult> {
    const cacheKey = `pricing-rules:${id}`;
    const cached = await this.cacheManager.get<RuleInheritanceResult>(cacheKey);

    if (cached) {
      return cached;
    }

    const partnerCategory = await this.partnerCategoryRepository.findOne({
      where: { id },
      relations: ['partnerType'],
    });
    if (!partnerCategory) {
      throw new NotFoundException(`Partner category with ID '${id}' not found`);
    }

    // Use enhanced rule template service for inheritance
    const result = await this.ruleTemplateService.resolveRuleInheritance(
      id,
      'pricing',
    );

    // Cache for 15 minutes
    await this.cacheManager.set(cacheKey, result, 900000);

    // Track access for analytics
    await this.ruleTemplateService.trackRuleTemplateAccess(
      id,
      'pricing',
      'read',
    );

    return result;
  }

  async getEffectiveFeatureRules(id: string): Promise<RuleInheritanceResult> {
    const cacheKey = `feature-rules:${id}`;
    const cached = await this.cacheManager.get<RuleInheritanceResult>(cacheKey);

    if (cached) {
      return cached;
    }

    const partnerCategory = await this.partnerCategoryRepository.findOne({
      where: { id },
      relations: ['partnerType'],
    });
    if (!partnerCategory) {
      throw new NotFoundException(`Partner category with ID '${id}' not found`);
    }

    // Use enhanced rule template service for inheritance
    const result = await this.ruleTemplateService.resolveRuleInheritance(
      id,
      'feature',
    );

    // Cache for 15 minutes
    await this.cacheManager.set(cacheKey, result, 900000);

    // Track access for analytics
    await this.ruleTemplateService.trackRuleTemplateAccess(
      id,
      'feature',
      'read',
    );

    return result;
  }

  async getEffectiveValidationRules(
    id: string,
  ): Promise<RuleInheritanceResult> {
    const cacheKey = `validation-rules:${id}`;
    const cached = await this.cacheManager.get<RuleInheritanceResult>(cacheKey);

    if (cached) {
      return cached;
    }

    const partnerCategory = await this.partnerCategoryRepository.findOne({
      where: { id },
      relations: ['partnerType'],
    });
    if (!partnerCategory) {
      throw new NotFoundException(`Partner category with ID '${id}' not found`);
    }

    // Use enhanced rule template service for inheritance
    const result = await this.ruleTemplateService.resolveRuleInheritance(
      id,
      'validation',
    );

    // Cache for 15 minutes
    await this.cacheManager.set(cacheKey, result, 900000);

    // Track access for analytics
    await this.ruleTemplateService.trackRuleTemplateAccess(
      id,
      'validation',
      'read',
    );

    return result;
  }

  // Enhanced rule update methods with validation and versioning
  async updatePricingRules(
    id: string,
    pricingRules: any,
  ): Promise<PartnerCategoryResponseDto> {
    const partnerCategory = await this.partnerCategoryRepository.findOne({
      where: { id },
    });
    if (!partnerCategory) {
      throw new NotFoundException(`Partner category with ID '${id}' not found`);
    }

    // Validate the new rules
    const validation =
      await this.ruleTemplateService.validateRuleTemplate(pricingRules);
    if (!validation.isValid) {
      throw new BadRequestException(
        `Invalid pricing rules: ${validation.errors.join(', ')}`,
      );
    }

    // Create version backup before updating
    if (partnerCategory.pricingRules) {
      await this.ruleTemplateService.createRuleTemplateVersion(
        id,
        'pricing',
        partnerCategory.pricingRules,
      );
    }

    partnerCategory.pricingRules = pricingRules;
    const updatedPartnerCategory =
      await this.partnerCategoryRepository.save(partnerCategory);

    // Track write access
    await this.ruleTemplateService.trackRuleTemplateAccess(
      id,
      'pricing',
      'write',
    );

    // Invalidate related caches
    await this.invalidateRuleCache(id, 'pricing');

    return this.toResponseDto(updatedPartnerCategory);
  }

  async updateFeatureRules(
    id: string,
    featureRules: any,
  ): Promise<PartnerCategoryResponseDto> {
    const partnerCategory = await this.partnerCategoryRepository.findOne({
      where: { id },
    });
    if (!partnerCategory) {
      throw new NotFoundException(`Partner category with ID '${id}' not found`);
    }

    // Validate the new rules
    const validation =
      await this.ruleTemplateService.validateRuleTemplate(featureRules);
    if (!validation.isValid) {
      throw new BadRequestException(
        `Invalid feature rules: ${validation.errors.join(', ')}`,
      );
    }

    // Create version backup before updating
    if (partnerCategory.featureRules) {
      await this.ruleTemplateService.createRuleTemplateVersion(
        id,
        'feature',
        partnerCategory.featureRules,
      );
    }

    partnerCategory.featureRules = featureRules;
    const updatedPartnerCategory =
      await this.partnerCategoryRepository.save(partnerCategory);

    // Track write access
    await this.ruleTemplateService.trackRuleTemplateAccess(
      id,
      'feature',
      'write',
    );

    // Invalidate related caches
    await this.invalidateRuleCache(id, 'feature');

    return this.toResponseDto(updatedPartnerCategory);
  }

  async updateValidationRules(
    id: string,
    validationRules: any,
  ): Promise<PartnerCategoryResponseDto> {
    const partnerCategory = await this.partnerCategoryRepository.findOne({
      where: { id },
    });
    if (!partnerCategory) {
      throw new NotFoundException(`Partner category with ID '${id}' not found`);
    }

    // Validate the new rules
    const validation =
      await this.ruleTemplateService.validateRuleTemplate(validationRules);
    if (!validation.isValid) {
      throw new BadRequestException(
        `Invalid validation rules: ${validation.errors.join(', ')}`,
      );
    }

    // Create version backup before updating
    if (partnerCategory.validationRules) {
      await this.ruleTemplateService.createRuleTemplateVersion(
        id,
        'validation',
        partnerCategory.validationRules,
      );
    }

    partnerCategory.validationRules = validationRules;
    const updatedPartnerCategory =
      await this.partnerCategoryRepository.save(partnerCategory);

    // Track write access
    await this.ruleTemplateService.trackRuleTemplateAccess(
      id,
      'validation',
      'write',
    );

    // Invalidate related caches
    await this.invalidateRuleCache(id, 'validation');

    return this.toResponseDto(updatedPartnerCategory);
  }

  // Cache invalidation helper method
  private async invalidateRuleCache(
    categoryId: string,
    ruleType: string,
  ): Promise<void> {
    const cacheKeys = [
      `effective_${ruleType}_rules_${categoryId}`,
      `category_analytics_${categoryId}`,
      `category_data_${categoryId}`,
    ];

    for (const key of cacheKeys) {
      await this.cacheManager.del(key);
    }
  }

  private toResponseDto(
    partnerCategory: PartnerCategoryEntity,
    includeCounts = false,
  ): PartnerCategoryResponseDto {
    const responseDto = plainToClass(
      PartnerCategoryResponseDto,
      partnerCategory,
      {
        excludeExtraneousValues: true,
      },
    );

    if (includeCounts) {
      responseDto.subcategoryCount = partnerCategory.subcategories?.length || 0;
      responseDto.offeringCount = partnerCategory.offerings?.length || 0;
    }

    return responseDto;
  }
}
