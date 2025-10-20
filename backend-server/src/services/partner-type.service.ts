import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { plainToClass } from 'class-transformer';
import { FindOptionsWhere, Repository } from 'typeorm';
import { PartnerTypeEntity } from '../database/entities/partner-type.entity';
import { CreatePartnerTypeDto } from '../dto/partner-type/create-partner-type.dto';
import { PartnerTypeResponseDto } from '../dto/partner-type/partner-type-response.dto';
import { UpdatePartnerTypeDto } from '../dto/partner-type/update-partner-type.dto';

@Injectable()
export class PartnerTypeService {
  constructor(
    @InjectRepository(PartnerTypeEntity)
    private readonly partnerTypeRepository: Repository<PartnerTypeEntity>,
  ) {}

  async create(
    createPartnerTypeDto: CreatePartnerTypeDto,
  ): Promise<PartnerTypeResponseDto> {
    // Check if name or slug already exists
    const existingByName = await this.partnerTypeRepository.findOne({
      where: { name: createPartnerTypeDto.name },
    });
    if (existingByName) {
      throw new ConflictException(
        `Partner type with name '${createPartnerTypeDto.name}' already exists`,
      );
    }

    const existingBySlug = await this.partnerTypeRepository.findOne({
      where: { slug: createPartnerTypeDto.slug },
    });
    if (existingBySlug) {
      throw new ConflictException(
        `Partner type with slug '${createPartnerTypeDto.slug}' already exists`,
      );
    }

    const partnerType = this.partnerTypeRepository.create(createPartnerTypeDto);
    const savedPartnerType = await this.partnerTypeRepository.save(partnerType);

    return this.toResponseDto(savedPartnerType);
  }

  async findAll(includeInactive = false): Promise<PartnerTypeResponseDto[]> {
    console.log('=== PartnerTypeService.findAll called ===');
    console.log('includeInactive:', includeInactive);
    console.log('partnerTypeRepository exists:', !!this.partnerTypeRepository);
    console.log(
      'partnerTypeRepository type:',
      typeof this.partnerTypeRepository,
    );

    try {
      const whereCondition: FindOptionsWhere<PartnerTypeEntity> = {};
      if (!includeInactive) {
        whereCondition.isActive = true;
      }

      console.log('whereCondition:', whereCondition);
      console.log('About to call partnerTypeRepository.find...');

      const partnerTypes = await this.partnerTypeRepository.find({
        where: whereCondition,
        order: { sortOrder: 'ASC', name: 'ASC' },
      });

      console.log('partnerTypeRepository.find completed');
      console.log('Found partner types:', partnerTypes?.length);
      console.log('Partner types data:', partnerTypes);

      const result = partnerTypes.map((partnerType) =>
        this.toResponseDto(partnerType, false),
      );
      console.log('Mapped to DTOs, returning result');
      return result;
    } catch (error) {
      console.error('=== Error in PartnerTypeService.findAll ===');
      console.error('Error type:', error?.constructor?.name);
      console.error('Error message:', error?.message);
      console.error('Error stack:', error?.stack);
      throw error;
    }
  }

  async findOne(id: string): Promise<PartnerTypeResponseDto> {
    const partnerType = await this.partnerTypeRepository.findOne({
      where: { id },
      relations: ['categories', 'partners'],
    });

    if (!partnerType) {
      throw new NotFoundException(`Partner type with ID '${id}' not found`);
    }

    return this.toResponseDto(partnerType, true);
  }

  async findBySlug(slug: string): Promise<PartnerTypeResponseDto> {
    const partnerType = await this.partnerTypeRepository.findOne({
      where: { slug },
      relations: ['categories', 'partners'],
    });

    if (!partnerType) {
      throw new NotFoundException(`Partner type with slug '${slug}' not found`);
    }

    return this.toResponseDto(partnerType, true);
  }

  async update(
    id: string,
    updatePartnerTypeDto: UpdatePartnerTypeDto,
  ): Promise<PartnerTypeResponseDto> {
    const partnerType = await this.partnerTypeRepository.findOne({
      where: { id },
    });
    if (!partnerType) {
      throw new NotFoundException(`Partner type with ID '${id}' not found`);
    }

    // Check for conflicts if name or slug is being updated
    if (
      updatePartnerTypeDto.name &&
      updatePartnerTypeDto.name !== partnerType.name
    ) {
      const existingByName = await this.partnerTypeRepository.findOne({
        where: { name: updatePartnerTypeDto.name },
      });
      if (existingByName && existingByName.id !== id) {
        throw new ConflictException(
          `Partner type with name '${updatePartnerTypeDto.name}' already exists`,
        );
      }
    }

    if (
      updatePartnerTypeDto.slug &&
      updatePartnerTypeDto.slug !== partnerType.slug
    ) {
      const existingBySlug = await this.partnerTypeRepository.findOne({
        where: { slug: updatePartnerTypeDto.slug },
      });
      if (existingBySlug && existingBySlug.id !== id) {
        throw new ConflictException(
          `Partner type with slug '${updatePartnerTypeDto.slug}' already exists`,
        );
      }
    }

    Object.assign(partnerType, updatePartnerTypeDto);
    const updatedPartnerType =
      await this.partnerTypeRepository.save(partnerType);

    return this.toResponseDto(updatedPartnerType);
  }

  async remove(id: string): Promise<void> {
    const partnerType = await this.partnerTypeRepository.findOne({
      where: { id },
      relations: ['categories', 'partners'],
    });

    if (!partnerType) {
      throw new NotFoundException(`Partner type with ID '${id}' not found`);
    }

    // Check if there are associated categories or partners
    if (partnerType.categories && partnerType.categories.length > 0) {
      throw new BadRequestException(
        `Cannot delete partner type '${partnerType.name}' because it has ${partnerType.categories.length} associated categories`,
      );
    }

    if (partnerType.partners && partnerType.partners.length > 0) {
      throw new BadRequestException(
        `Cannot delete partner type '${partnerType.name}' because it has ${partnerType.partners.length} associated partners`,
      );
    }

    await this.partnerTypeRepository.softDelete(id);
  }

  async toggleActive(id: string): Promise<PartnerTypeResponseDto> {
    const partnerType = await this.partnerTypeRepository.findOne({
      where: { id },
    });
    if (!partnerType) {
      throw new NotFoundException(`Partner type with ID '${id}' not found`);
    }

    partnerType.isActive = !partnerType.isActive;
    const updatedPartnerType =
      await this.partnerTypeRepository.save(partnerType);

    return this.toResponseDto(updatedPartnerType);
  }

  async reorder(
    reorderData: { id: string; sortOrder: number }[],
  ): Promise<PartnerTypeResponseDto[]> {
    const updatePromises = reorderData.map(async ({ id, sortOrder }) => {
      const partnerType = await this.partnerTypeRepository.findOne({
        where: { id },
      });
      if (!partnerType) {
        throw new NotFoundException(`Partner type with ID '${id}' not found`);
      }
      partnerType.sortOrder = sortOrder;
      return this.partnerTypeRepository.save(partnerType);
    });

    const updatedPartnerTypes = await Promise.all(updatePromises);
    return updatedPartnerTypes.map((partnerType) =>
      this.toResponseDto(partnerType),
    );
  }

  /**
   * Get effective pricing rules for a partner type
   * This is the base level of rule inheritance
   */
  async getEffectivePricingRules(id: string): Promise<Record<string, any>> {
    const partnerType = await this.partnerTypeRepository.findOne({
      where: { id },
    });
    if (!partnerType) {
      throw new NotFoundException(`Partner type with ID '${id}' not found`);
    }

    return partnerType.pricingRules || {};
  }

  /**
   * Get effective feature rules for a partner type
   * This is the base level of rule inheritance
   */
  async getEffectiveFeatureRules(id: string): Promise<Record<string, any>> {
    const partnerType = await this.partnerTypeRepository.findOne({
      where: { id },
    });
    if (!partnerType) {
      throw new NotFoundException(`Partner type with ID '${id}' not found`);
    }

    return partnerType.featureRules || {};
  }

  /**
   * Get effective validation rules for a partner type
   * This is the base level of rule inheritance
   */
  async getEffectiveValidationRules(id: string): Promise<Record<string, any>> {
    const partnerType = await this.partnerTypeRepository.findOne({
      where: { id },
    });
    if (!partnerType) {
      throw new NotFoundException(`Partner type with ID '${id}' not found`);
    }

    return partnerType.validationRules || {};
  }

  /**
   * Update pricing rules for a partner type
   */
  async updatePricingRules(
    id: string,
    pricingRules: Record<string, any>,
  ): Promise<PartnerTypeResponseDto> {
    const partnerType = await this.partnerTypeRepository.findOne({
      where: { id },
    });
    if (!partnerType) {
      throw new NotFoundException(`Partner type with ID '${id}' not found`);
    }

    partnerType.pricingRules = pricingRules;
    const updatedPartnerType =
      await this.partnerTypeRepository.save(partnerType);

    return this.toResponseDto(updatedPartnerType);
  }

  /**
   * Update feature rules for a partner type
   */
  async updateFeatureRules(
    id: string,
    featureRules: Record<string, any>,
  ): Promise<PartnerTypeResponseDto> {
    const partnerType = await this.partnerTypeRepository.findOne({
      where: { id },
    });
    if (!partnerType) {
      throw new NotFoundException(`Partner type with ID '${id}' not found`);
    }

    partnerType.featureRules = featureRules;
    const updatedPartnerType =
      await this.partnerTypeRepository.save(partnerType);

    return this.toResponseDto(updatedPartnerType);
  }

  /**
   * Update validation rules for a partner type
   */
  async updateValidationRules(
    id: string,
    validationRules: Record<string, any>,
  ): Promise<PartnerTypeResponseDto> {
    const partnerType = await this.partnerTypeRepository.findOne({
      where: { id },
    });
    if (!partnerType) {
      throw new NotFoundException(`Partner type with ID '${id}' not found`);
    }

    partnerType.validationRules = validationRules;
    const updatedPartnerType =
      await this.partnerTypeRepository.save(partnerType);

    return this.toResponseDto(updatedPartnerType);
  }

  private toResponseDto(
    partnerType: PartnerTypeEntity,
    includeCounts = false,
  ): PartnerTypeResponseDto {
    // Temporary fix: return plain object instead of using plainToClass
    const responseDto: PartnerTypeResponseDto = {
      id: partnerType.id,
      name: partnerType.name,
      slug: partnerType.slug,
      description: partnerType.description,
      icon: partnerType.icon,
      color: partnerType.color,
      isActive: partnerType.isActive,
      sortOrder: partnerType.sortOrder,
      createdAt: partnerType.createdAt,
      updatedAt: partnerType.updatedAt,
      pricingRules: partnerType.pricingRules,
      featureRules: partnerType.featureRules,
      validationRules: partnerType.validationRules,
    };

    if (includeCounts) {
      responseDto.categoryCount = partnerType.categories?.length || 0;
      responseDto.partnerCount = partnerType.partners?.length || 0;
    }

    return responseDto;
  }
}
