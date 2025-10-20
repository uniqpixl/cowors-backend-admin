import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Repository } from 'typeorm';
import { PartnerCategoryEntity } from '../database/entities/partner-category.entity';
import { PartnerOfferingEntity } from '../database/entities/partner-offering.entity';
import { PartnerSubcategoryEntity } from '../database/entities/partner-subcategory.entity';
import { PartnerEntity } from '../database/entities/partner.entity';
import { CreatePartnerOfferingDto } from '../dto/partner-offering/create-partner-offering.dto';
import { PartnerOfferingResponseDto } from '../dto/partner-offering/partner-offering-response.dto';
import { UpdatePartnerOfferingDto } from '../dto/partner-offering/update-partner-offering.dto';

@Injectable()
export class PartnerOfferingService {
  constructor(
    @InjectRepository(PartnerOfferingEntity)
    private readonly offeringRepository: Repository<PartnerOfferingEntity>,
    @InjectRepository(PartnerEntity)
    private readonly partnerRepository: Repository<PartnerEntity>,
    @InjectRepository(PartnerCategoryEntity)
    private readonly categoryRepository: Repository<PartnerCategoryEntity>,
    @InjectRepository(PartnerSubcategoryEntity)
    private readonly subcategoryRepository: Repository<PartnerSubcategoryEntity>,
  ) {}

  async create(
    createDto: CreatePartnerOfferingDto,
  ): Promise<PartnerOfferingResponseDto> {
    // Validate partner exists
    const partner = await this.partnerRepository.findOne({
      where: { id: createDto.partnerId },
    });
    if (!partner) {
      throw new NotFoundException(
        `Partner with ID ${createDto.partnerId} not found`,
      );
    }

    // Validate category exists
    const category = await this.categoryRepository.findOne({
      where: { id: createDto.categoryId },
    });
    if (!category) {
      throw new NotFoundException(
        `Category with ID ${createDto.categoryId} not found`,
      );
    }

    // Validate subcategory if provided
    if (createDto.subcategoryId) {
      const subcategory = await this.subcategoryRepository.findOne({
        where: {
          id: createDto.subcategoryId,
          categoryId: createDto.categoryId,
        },
      });
      if (!subcategory) {
        throw new NotFoundException(
          `Subcategory with ID ${createDto.subcategoryId} not found in category ${createDto.categoryId}`,
        );
      }
    }

    // Generate slug if not provided
    let slug = createDto.slug;
    if (!slug) {
      slug = this.generateSlug(createDto.title);
    }

    // Check for slug conflicts within the same partner
    const existingOffering = await this.offeringRepository.findOne({
      where: { partnerId: createDto.partnerId, slug },
    });
    if (existingOffering) {
      throw new ConflictException(
        `An offering with slug '${slug}' already exists for this partner`,
      );
    }

    // Validate pricing structure
    this.validatePricing(createDto.pricing);

    // Validate availability structure
    this.validateAvailability(createDto.availability);

    // Transform DTO data to match entity structure
    const transformedData = {
      ...createDto,
      slug,
      // Transform pricing to match entity structure
      pricing: {
        basePrice: createDto.pricing.basePrice || 0,
        currency: createDto.pricing.currency || 'USD',
        pricingModel: createDto.pricing.type as any,
        discounts: [],
        additionalCharges: [],
      },
      // Transform availability to match entity structure
      availability: {
        schedule: {
          monday: { isAvailable: true, startTime: '09:00', endTime: '17:00' },
          tuesday: { isAvailable: true, startTime: '09:00', endTime: '17:00' },
          wednesday: {
            isAvailable: true,
            startTime: '09:00',
            endTime: '17:00',
          },
          thursday: { isAvailable: true, startTime: '09:00', endTime: '17:00' },
          friday: { isAvailable: true, startTime: '09:00', endTime: '17:00' },
          saturday: {
            isAvailable: false,
            startTime: '09:00',
            endTime: '17:00',
          },
          sunday: { isAvailable: false, startTime: '09:00', endTime: '17:00' },
        },
        advanceBooking: createDto.availability.advanceBookingTime || 0,
        maxBookingDuration: createDto.availability.maxAdvanceBooking || 0,
        bufferTime: createDto.availability.bufferTime || 0,
        blackoutDates: createDto.availability.blackoutDates || [],
        specialAvailability: [],
      },
      // Transform features to match entity structure
      features: {
        allowInstantBooking: createDto.availability?.bookingType === 'instant',
        allowCancellation: true,
        cancellationPolicy: 'Standard cancellation policy',
        refundPolicy: 'Standard refund policy',
        amenities: createDto.features?.map((f) => f.name) || [],
        capacity: { min: 1, max: 10, optimal: 5 },
        equipment: [],
        specialFeatures:
          createDto.features?.map((f) => f.description).filter(Boolean) || [],
      },
      // Transform requirements to match entity structure
      requirements: {
        minimumAge: 18,
        identificationRequired: true,
        backgroundCheckRequired: false,
        certificationRequired:
          createDto.requirements?.some((r) => r.type === 'certification') ||
          false,
        insuranceRequired: false,
        specialRequirements:
          createDto.requirements?.map((r) => r.description) || [],
      },
      // Transform media to match entity structure
      media: {
        images:
          createDto.media
            ?.filter((m) => m.type === 'image')
            .map((m) => ({
              url: m.url,
              alt: m.title || '',
              caption: m.description || '',
              isPrimary: m.isPrimary || false,
              sortOrder: m.sortOrder || 0,
            })) || [],
        videos:
          createDto.media
            ?.filter((m) => m.type === 'video')
            .map((m) => ({
              url: m.url,
              title: m.title || '',
              description: m.description || '',
              thumbnail: '',
              duration: 0,
              sortOrder: m.sortOrder || 0,
            })) || [],
        documents:
          createDto.media
            ?.filter((m) => m.type === 'document')
            .map((m) => ({
              url: m.url,
              title: m.title || '',
              description: m.description || '',
              fileType: 'pdf',
              fileSize: 0,
              sortOrder: m.sortOrder || 0,
            })) || [],
      },
    };

    // Create the offering
    const offering = this.offeringRepository.create(transformedData);

    const savedOffering = await this.offeringRepository.save(offering);
    return this.toResponseDto(savedOffering);
  }

  async findAll(
    partnerId?: string,
    categoryId?: string,
    subcategoryId?: string,
    isActive?: boolean,
    isFeatured?: boolean,
    includeInactive = false,
  ): Promise<PartnerOfferingResponseDto[]> {
    const where: FindOptionsWhere<PartnerOfferingEntity> = {};

    if (partnerId) where.partnerId = partnerId;
    if (categoryId) where.categoryId = categoryId;
    if (subcategoryId) where.subcategoryId = subcategoryId;
    if (isActive !== undefined) where.isActive = isActive;
    if (isFeatured !== undefined) where.isFeatured = isFeatured;
    if (!includeInactive) where.isActive = true;

    const offerings = await this.offeringRepository.find({
      where,
      relations: ['category', 'subcategory'],
      order: { sortOrder: 'ASC', createdAt: 'DESC' },
    });

    return offerings.map((offering) => this.toResponseDto(offering));
  }

  async findOne(
    id: string,
    includeInactive = false,
  ): Promise<PartnerOfferingResponseDto> {
    const where: FindOptionsWhere<PartnerOfferingEntity> = { id };
    if (!includeInactive) where.isActive = true;

    const offering = await this.offeringRepository.findOne({
      where,
      relations: ['category', 'subcategory'],
    });

    if (!offering) {
      throw new NotFoundException(`Offering with ID ${id} not found`);
    }

    return this.toResponseDto(offering);
  }

  async findBySlug(
    partnerId: string,
    slug: string,
    includeInactive = false,
  ): Promise<PartnerOfferingResponseDto> {
    const where: FindOptionsWhere<PartnerOfferingEntity> = { partnerId, slug };
    if (!includeInactive) where.isActive = true;

    const offering = await this.offeringRepository.findOne({
      where,
      relations: ['category', 'subcategory'],
    });

    if (!offering) {
      throw new NotFoundException(
        `Offering with slug '${slug}' not found for partner ${partnerId}`,
      );
    }

    return this.toResponseDto(offering);
  }

  async update(
    id: string,
    updateDto: UpdatePartnerOfferingDto,
  ): Promise<PartnerOfferingResponseDto> {
    const offering = await this.offeringRepository.findOne({ where: { id } });
    if (!offering) {
      throw new NotFoundException(`Offering with ID ${id} not found`);
    }

    // Validate subcategory if being updated
    if (updateDto.subcategoryId) {
      const subcategory = await this.subcategoryRepository.findOne({
        where: { id: updateDto.subcategoryId, categoryId: offering.categoryId },
      });
      if (!subcategory) {
        throw new NotFoundException(
          `Subcategory with ID ${updateDto.subcategoryId} not found in current category`,
        );
      }
    }

    // Handle slug updates
    if (updateDto.slug && updateDto.slug !== offering.slug) {
      const existingOffering = await this.offeringRepository.findOne({
        where: { partnerId: offering.partnerId, slug: updateDto.slug },
      });
      if (existingOffering && existingOffering.id !== id) {
        throw new ConflictException(
          `An offering with slug '${updateDto.slug}' already exists for this partner`,
        );
      }
    }

    // Generate new slug if title is updated but slug is not provided
    if (updateDto.title && !updateDto.slug) {
      const newSlug = this.generateSlug(updateDto.title);
      if (newSlug !== offering.slug) {
        const existingOffering = await this.offeringRepository.findOne({
          where: { partnerId: offering.partnerId, slug: newSlug },
        });
        if (!existingOffering || existingOffering.id === id) {
          updateDto.slug = newSlug;
        }
      }
    }

    // Validate pricing if being updated
    if (updateDto.pricing) {
      this.validatePricing(updateDto.pricing);
    }

    // Validate availability if being updated
    if (updateDto.availability) {
      this.validateAvailability(updateDto.availability);
    }

    // Transform update DTO data to match entity structure
    const transformedUpdateData: any = { ...updateDto };

    if (updateDto.pricing) {
      transformedUpdateData.pricing = {
        basePrice: updateDto.pricing.basePrice || 0,
        currency: updateDto.pricing.currency || 'USD',
        pricingModel: updateDto.pricing.type as any,
        discounts: [],
        additionalCharges: [],
      };
    }

    if (updateDto.availability) {
      transformedUpdateData.availability = {
        schedule: {
          monday: { isAvailable: true, startTime: '09:00', endTime: '17:00' },
          tuesday: { isAvailable: true, startTime: '09:00', endTime: '17:00' },
          wednesday: {
            isAvailable: true,
            startTime: '09:00',
            endTime: '17:00',
          },
          thursday: { isAvailable: true, startTime: '09:00', endTime: '17:00' },
          friday: { isAvailable: true, startTime: '09:00', endTime: '17:00' },
          saturday: {
            isAvailable: false,
            startTime: '09:00',
            endTime: '17:00',
          },
          sunday: { isAvailable: false, startTime: '09:00', endTime: '17:00' },
        },
        advanceBooking: updateDto.availability.advanceBookingTime || 0,
        maxBookingDuration: updateDto.availability.maxAdvanceBooking || 0,
        bufferTime: updateDto.availability.bufferTime || 0,
        blackoutDates: updateDto.availability.blackoutDates || [],
        specialAvailability: [],
      };
    }

    if (updateDto.features) {
      transformedUpdateData.features = {
        allowInstantBooking: updateDto.availability?.bookingType === 'instant',
        allowCancellation: true,
        cancellationPolicy: 'Standard cancellation policy',
        refundPolicy: 'Standard refund policy',
        amenities: updateDto.features?.map((f) => f.name) || [],
        capacity: { min: 1, max: 10, optimal: 5 },
        equipment: [],
        specialFeatures:
          updateDto.features?.map((f) => f.description).filter(Boolean) || [],
      };
    }

    if (updateDto.requirements) {
      transformedUpdateData.requirements = {
        minimumAge: 18,
        identificationRequired: true,
        backgroundCheckRequired: false,
        certificationRequired:
          updateDto.requirements?.some((r) => r.type === 'certification') ||
          false,
        insuranceRequired: false,
        specialRequirements:
          updateDto.requirements?.map((r) => r.description) || [],
      };
    }

    if (updateDto.media) {
      transformedUpdateData.media = {
        images:
          updateDto.media
            ?.filter((m) => m.type === 'image')
            .map((m) => ({
              url: m.url,
              alt: m.title || '',
              caption: m.description || '',
              isPrimary: m.isPrimary || false,
              sortOrder: m.sortOrder || 0,
            })) || [],
        videos:
          updateDto.media
            ?.filter((m) => m.type === 'video')
            .map((m) => ({
              url: m.url,
              title: m.title || '',
              description: m.description || '',
              thumbnail: '',
              duration: 0,
              sortOrder: m.sortOrder || 0,
            })) || [],
        documents:
          updateDto.media
            ?.filter((m) => m.type === 'document')
            .map((m) => ({
              url: m.url,
              title: m.title || '',
              description: m.description || '',
              fileType: 'pdf',
              fileSize: 0,
              sortOrder: m.sortOrder || 0,
            })) || [],
      };
    }

    // Update the offering
    await this.offeringRepository.update(id, transformedUpdateData);

    // Return updated offering
    return this.findOne(id, true);
  }

  async remove(id: string): Promise<void> {
    const offering = await this.offeringRepository.findOne({ where: { id } });
    if (!offering) {
      throw new NotFoundException(`Offering with ID ${id} not found`);
    }

    // TODO: Check for existing bookings before deletion
    // const bookingCount = await this.bookingRepository.count({ where: { offeringId: id } });
    // if (bookingCount > 0) {
    //   throw new BadRequestException(
    //     'Cannot delete offering with existing bookings. Deactivate instead.',
    //   );
    // }

    await this.offeringRepository.remove(offering);
  }

  async toggleActive(id: string): Promise<PartnerOfferingResponseDto> {
    const offering = await this.offeringRepository.findOne({ where: { id } });
    if (!offering) {
      throw new NotFoundException(`Offering with ID ${id} not found`);
    }

    offering.isActive = !offering.isActive;
    await this.offeringRepository.save(offering);

    return this.toResponseDto(offering);
  }

  async toggleFeatured(id: string): Promise<PartnerOfferingResponseDto> {
    const offering = await this.offeringRepository.findOne({ where: { id } });
    if (!offering) {
      throw new NotFoundException(`Offering with ID ${id} not found`);
    }

    offering.isFeatured = !offering.isFeatured;
    await this.offeringRepository.save(offering);

    return this.toResponseDto(offering);
  }

  async reorder(
    partnerId: string,
    offeringIds: string[],
  ): Promise<PartnerOfferingResponseDto[]>;
  async reorder(
    reorderData: { id: string; sortOrder: number }[],
  ): Promise<void>;
  async reorder(
    partnerIdOrReorderData: string | { id: string; sortOrder: number }[],
    offeringIds?: string[],
  ): Promise<PartnerOfferingResponseDto[] | void> {
    if (typeof partnerIdOrReorderData === 'string') {
      // Original method: reorder by partner ID and offering IDs
      const partnerId = partnerIdOrReorderData;

      // Validate all offerings belong to the partner
      const offerings = await this.offeringRepository.find({
        where: { partnerId, id: { $in: offeringIds } as any },
      });

      if (offerings.length !== offeringIds.length) {
        throw new BadRequestException(
          'Some offerings not found or do not belong to this partner',
        );
      }

      // Update sort orders
      const updatePromises = offeringIds.map((id, index) =>
        this.offeringRepository.update(id, { sortOrder: index }),
      );

      await Promise.all(updatePromises);

      // Return updated offerings
      return this.findAll(partnerId);
    } else {
      // Admin method: reorder by array of { id, sortOrder }
      const reorderData = partnerIdOrReorderData;

      const updatePromises = reorderData.map(async ({ id, sortOrder }) => {
        const offering = await this.offeringRepository.findOne({
          where: { id },
        });
        if (!offering) {
          throw new NotFoundException(
            `Partner offering with ID '${id}' not found`,
          );
        }
        offering.sortOrder = sortOrder;
        return this.offeringRepository.save(offering);
      });

      await Promise.all(updatePromises);
    }
  }

  private generateSlug(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim()
      .replace(/^-+|-+$/g, '');
  }

  private validatePricing(pricing: any): void {
    if (!pricing.type) {
      throw new BadRequestException('Pricing type is required');
    }

    const validTypes = [
      'fixed',
      'hourly',
      'daily',
      'weekly',
      'monthly',
      'custom',
    ];
    if (!validTypes.includes(pricing.type)) {
      throw new BadRequestException(
        `Invalid pricing type. Must be one of: ${validTypes.join(', ')}`,
      );
    }

    // Validate that at least one price is set
    const priceFields = [
      'basePrice',
      'hourlyRate',
      'dailyRate',
      'weeklyRate',
      'monthlyRate',
    ];
    const hasPrice = priceFields.some(
      (field) => pricing[field] !== undefined && pricing[field] > 0,
    );

    if (!hasPrice && pricing.type !== 'custom') {
      throw new BadRequestException('At least one price must be specified');
    }

    // Validate duration constraints
    if (
      pricing.minDuration &&
      pricing.maxDuration &&
      pricing.minDuration > pricing.maxDuration
    ) {
      throw new BadRequestException(
        'Minimum duration cannot be greater than maximum duration',
      );
    }
  }

  private validateAvailability(availability: any): void {
    if (!availability.bookingType) {
      throw new BadRequestException('Booking type is required');
    }

    const validBookingTypes = ['instant', 'request', 'quote'];
    if (!validBookingTypes.includes(availability.bookingType)) {
      throw new BadRequestException(
        `Invalid booking type. Must be one of: ${validBookingTypes.join(', ')}`,
      );
    }

    // Validate time slots if provided
    if (availability.timeSlots && Array.isArray(availability.timeSlots)) {
      for (const slot of availability.timeSlots) {
        if (slot.dayOfWeek < 0 || slot.dayOfWeek > 6) {
          throw new BadRequestException(
            'Day of week must be between 0 (Sunday) and 6 (Saturday)',
          );
        }

        if (!slot.startTime || !slot.endTime) {
          throw new BadRequestException(
            'Start time and end time are required for time slots',
          );
        }

        // Basic time format validation (HH:MM)
        const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
        if (!timeRegex.test(slot.startTime) || !timeRegex.test(slot.endTime)) {
          throw new BadRequestException('Time must be in HH:MM format');
        }

        // Validate start time is before end time
        const [startHour, startMin] = slot.startTime.split(':').map(Number);
        const [endHour, endMin] = slot.endTime.split(':').map(Number);
        const startMinutes = startHour * 60 + startMin;
        const endMinutes = endHour * 60 + endMin;

        if (startMinutes >= endMinutes) {
          throw new BadRequestException('Start time must be before end time');
        }
      }
    }
  }

  private toResponseDto(
    offering: PartnerOfferingEntity,
  ): PartnerOfferingResponseDto {
    return {
      id: offering.id,
      title: offering.title,
      slug: offering.slug,
      description: offering.description,
      isActive: offering.isActive,
      isFeatured: offering.isFeatured,
      sortOrder: offering.sortOrder,
      partnerId: offering.partnerId,
      categoryId: offering.categoryId,
      subcategoryId: offering.subcategoryId,
      pricing: offering.pricing,
      availability: offering.availability,
      features: offering.features,
      requirements: offering.requirements,
      media: offering.media,
      location: offering.location,
      metadata: offering.metadata,
      createdAt: offering.createdAt,
      updatedAt: offering.updatedAt,
      category: offering.category
        ? {
            id: offering.category.id,
            name: offering.category.name,
            slug: offering.category.slug,
            description: offering.category.description,
            icon: offering.category.icon,
            color: offering.category.color,
            isActive: offering.category.isActive,
            sortOrder: offering.category.sortOrder,
            requiresSubcategory: offering.category.requiresSubcategory,
            partnerTypeId: offering.category.partnerTypeId,
            ruleTemplates: offering.category.ruleTemplates,
            metadata: offering.category.metadata,
            createdAt: offering.category.createdAt,
            updatedAt: offering.category.updatedAt,
          }
        : undefined,
      subcategory: offering.subcategory
        ? {
            id: offering.subcategory.id,
            name: offering.subcategory.name,
            slug: offering.subcategory.slug,
            description: offering.subcategory.description,
            icon: offering.subcategory.icon,
            color: offering.subcategory.color,
            isActive: offering.subcategory.isActive,
            sortOrder: offering.subcategory.sortOrder,
            categoryId: offering.subcategory.categoryId,
            ruleOverrides: offering.subcategory.ruleOverrides,
            metadata: offering.subcategory.metadata,
            createdAt: offering.subcategory.createdAt,
            updatedAt: offering.subcategory.updatedAt,
          }
        : undefined,
    };
  }
}
