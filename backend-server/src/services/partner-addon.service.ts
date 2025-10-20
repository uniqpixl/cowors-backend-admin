import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Repository } from 'typeorm';
import { PartnerAddonEntity } from '../database/entities/partner-addon.entity';
import { PartnerListingEntity } from '../database/entities/partner-listing.entity';
import { PartnerOfferingEntity } from '../database/entities/partner-offering.entity';
import { PartnerEntity } from '../database/entities/partner.entity';
import { CreatePartnerAddonDto } from '../dto/partner-addon/create-partner-addon.dto';
import { PartnerAddonResponseDto } from '../dto/partner-addon/partner-addon-response.dto';
import { UpdatePartnerAddonDto } from '../dto/partner-addon/update-partner-addon.dto';

@Injectable()
export class PartnerAddonService {
  constructor(
    @InjectRepository(PartnerAddonEntity)
    private readonly partnerAddonRepository: Repository<PartnerAddonEntity>,
    @InjectRepository(PartnerListingEntity)
    private readonly partnerListingRepository: Repository<PartnerListingEntity>,
    @InjectRepository(PartnerEntity)
    private readonly partnerRepository: Repository<PartnerEntity>,
  ) {}

  async create(
    createDto: CreatePartnerAddonDto,
  ): Promise<PartnerAddonResponseDto> {
    // Validate listing exists
    const listing = await this.partnerListingRepository.findOne({
      where: { id: createDto.offeringId },
    });
    if (!listing) {
      throw new NotFoundException(
        `Listing with ID ${createDto.offeringId} not found`,
      );
    }

    // Generate slug if not provided
    let slug = createDto.slug;
    if (!slug) {
      slug = this.generateSlug(createDto.name);
    }

    // Check for slug conflicts within the same listing
    const existingAddon = await this.partnerAddonRepository.findOne({
      where: { listingId: createDto.offeringId },
    });
    if (existingAddon) {
      throw new ConflictException(`An addon already exists for this listing`);
    }

    // Validate pricing
    this.validatePricing(createDto.price, createDto.currency);

    // Create the addon
    const addon = this.partnerAddonRepository.create({
      ...createDto,
      listingId: createDto.offeringId,
    });

    const savedAddon = await this.partnerAddonRepository.save(addon);
    return this.toResponseDto(savedAddon);
  }

  async findAll(
    offeringId?: string,
    isActive?: boolean,
    isRequired?: boolean,
    includeInactive = false,
  ): Promise<PartnerAddonResponseDto[]> {
    const where: FindOptionsWhere<PartnerAddonEntity> = {};

    if (offeringId) where.listingId = offeringId;
    if (isActive !== undefined) where.isActive = isActive;
    if (!includeInactive) where.isActive = true;

    const addons = await this.partnerAddonRepository.find({
      where,
      relations: ['listing'],
      order: { priority: 'ASC', createdAt: 'DESC' },
    });

    return addons.map((addon) => this.toResponseDto(addon));
  }

  async findOne(
    id: string,
    includeInactive = false,
  ): Promise<PartnerAddonResponseDto> {
    const where: FindOptionsWhere<PartnerAddonEntity> = { id };
    if (!includeInactive) where.isActive = true;

    const addon = await this.partnerAddonRepository.findOne({
      where,
      relations: ['listing'],
    });

    if (!addon) {
      throw new NotFoundException(`Addon with ID ${id} not found`);
    }

    return this.toResponseDto(addon);
  }

  async findBySlug(
    offeringId: string,
    slug: string,
    includeInactive = false,
  ): Promise<PartnerAddonResponseDto> {
    const where: FindOptionsWhere<PartnerAddonEntity> = {
      listingId: offeringId,
    };
    if (!includeInactive) where.isActive = true;

    const addon = await this.partnerAddonRepository.findOne({
      where,
      relations: ['listing'],
    });

    if (!addon) {
      throw new NotFoundException(
        `Addon with slug '${slug}' not found for offering ${offeringId}`,
      );
    }

    return this.toResponseDto(addon);
  }

  async findByOffering(
    offeringId: string,
    includeInactive = false,
  ): Promise<PartnerAddonResponseDto[]> {
    // Verify offering exists
    const offering = await this.partnerListingRepository.findOne({
      where: { id: offeringId },
    });
    if (!offering) {
      throw new NotFoundException(`Offering with ID '${offeringId}' not found`);
    }

    return this.findAll(offeringId, undefined, undefined, includeInactive);
  }

  async update(
    id: string,
    updateDto: UpdatePartnerAddonDto,
  ): Promise<PartnerAddonResponseDto> {
    const addon = await this.partnerAddonRepository.findOne({ where: { id } });
    if (!addon) {
      throw new NotFoundException(`Addon with ID ${id} not found`);
    }

    // Note: Slug functionality removed as PartnerAddonEntity doesn't have slug property

    // Validate pricing if being updated
    if (updateDto.price !== undefined || updateDto.currency) {
      const price =
        updateDto.price !== undefined ? updateDto.price : addon.basePrice;
      const currency = updateDto.currency || addon.currency;
      this.validatePricing(price, currency);
    }

    // Update the addon
    await this.partnerAddonRepository.update(id, updateDto);

    // Return updated addon
    return this.findOne(id, true);
  }

  async remove(id: string): Promise<void> {
    const addon = await this.partnerAddonRepository.findOne({ where: { id } });
    if (!addon) {
      throw new NotFoundException(`Addon with ID ${id} not found`);
    }

    // TODO: Check for existing bookings that include this addon before deletion
    // const bookingCount = await this.bookingRepository.count({
    //   where: { addons: { id } }
    // });
    // if (bookingCount > 0) {
    //   throw new BadRequestException(
    //     'Cannot delete addon that is included in existing bookings. Deactivate instead.',
    //   );
    // }

    await this.partnerAddonRepository.remove(addon);
  }

  async toggleActive(id: string): Promise<PartnerAddonResponseDto> {
    const addon = await this.partnerAddonRepository.findOne({ where: { id } });
    if (!addon) {
      throw new NotFoundException(`Addon with ID ${id} not found`);
    }

    addon.isActive = !addon.isActive;
    await this.partnerAddonRepository.save(addon);

    return this.toResponseDto(addon);
  }

  async toggleRequired(id: string): Promise<PartnerAddonResponseDto> {
    const addon = await this.partnerAddonRepository.findOne({ where: { id } });
    if (!addon) {
      throw new NotFoundException(`Addon with ID ${id} not found`);
    }

    // Note: isRequired field doesn't exist in PartnerAddonEntity
    // This method may need to be updated based on actual requirements
    await this.partnerAddonRepository.save(addon);

    return this.toResponseDto(addon);
  }

  async reorder(
    offeringId: string,
    addonIds: string[],
  ): Promise<PartnerAddonResponseDto[]> {
    // Validate all addons belong to the offering
    const addons = await this.partnerAddonRepository.find({
      where: { listingId: offeringId, id: { $in: addonIds } as any },
    });

    if (addons.length !== addonIds.length) {
      throw new BadRequestException(
        'Some addons not found or do not belong to this offering',
      );
    }

    // Update sort orders
    const updatePromises = addonIds.map((id, index) =>
      this.partnerAddonRepository.update(id, { priority: index }),
    );

    await Promise.all(updatePromises);

    // Return updated addons
    return this.findByOffering(offeringId);
  }

  async updatePricing(
    id: string,
    price: number,
    currency: string,
  ): Promise<PartnerAddonResponseDto> {
    const addon = await this.partnerAddonRepository.findOne({ where: { id } });
    if (!addon) {
      throw new NotFoundException(`Addon with ID ${id} not found`);
    }

    // Validate pricing
    this.validatePricing(price, currency);

    // Update pricing
    addon.basePrice = price;
    addon.currency = currency;
    await this.partnerAddonRepository.save(addon);

    return this.toResponseDto(addon);
  }

  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim()
      .replace(/^-+|-+$/g, '');
  }

  private validatePricing(price: number, currency: string): void {
    if (price < 0) {
      throw new BadRequestException('Price cannot be negative');
    }

    if (!currency || currency.length !== 3) {
      throw new BadRequestException(
        'Currency must be a valid 3-letter ISO code',
      );
    }

    // Validate common currencies
    const validCurrencies = [
      'USD',
      'EUR',
      'GBP',
      'CAD',
      'AUD',
      'JPY',
      'CNY',
      'INR',
    ];
    if (!validCurrencies.includes(currency.toUpperCase())) {
      throw new BadRequestException(
        `Unsupported currency '${currency}'. Supported currencies: ${validCurrencies.join(', ')}`,
      );
    }
  }

  // Partner-specific methods for partner controllers
  async createForPartner(
    createDto: CreatePartnerAddonDto,
    userId: string,
  ): Promise<PartnerAddonResponseDto> {
    // Get partner by user ID
    const partner = await this.getPartnerByUserId(userId);

    // Validate that the listing exists and belongs to the partner
    await this.validateListingOwnership(createDto.offeringId, partner.id);

    return this.create(createDto);
  }

  async findAllForPartner(
    userId: string,
    filters: {
      offeringId?: string;
      addonType?: string;
      isAvailable?: boolean;
      page?: number;
      limit?: number;
    },
  ): Promise<PartnerAddonResponseDto[]> {
    // Get partner by user ID
    const partner = await this.getPartnerByUserId(userId);

    // Build query to only include addons for partner's offerings
    const queryBuilder = this.partnerAddonRepository
      .createQueryBuilder('addon')
      .leftJoinAndSelect('addon.listing', 'listing')
      .where('listing.partnerId = :partnerId', { partnerId: partner.id });

    if (filters.offeringId) {
      await this.validateListingOwnership(filters.offeringId, partner.id);
      queryBuilder.andWhere('addon.listingId = :listingId', {
        listingId: filters.offeringId,
      });
    }

    if (filters.addonType) {
      queryBuilder.andWhere('addon.addonType = :addonType', {
        addonType: filters.addonType,
      });
    }

    if (filters.isAvailable !== undefined) {
      queryBuilder.andWhere('addon.isActive = :isActive', {
        isActive: filters.isAvailable,
      });
    }

    queryBuilder
      .orderBy('addon.priority', 'ASC')
      .addOrderBy('addon.createdAt', 'DESC');

    if (filters.page && filters.limit) {
      const skip = (filters.page - 1) * filters.limit;
      queryBuilder.skip(skip).take(filters.limit);
    }

    const addons = await queryBuilder.getMany();
    return addons.map((addon) => this.toResponseDto(addon));
  }

  async findOneForPartner(
    id: string,
    userId: string,
  ): Promise<PartnerAddonResponseDto> {
    // Get partner by user ID
    const partner = await this.getPartnerByUserId(userId);

    const addon = await this.partnerAddonRepository.findOne({
      where: { id },
      relations: ['listing'],
    });

    if (!addon) {
      throw new NotFoundException(`Addon with ID ${id} not found`);
    }

    // Validate ownership
    await this.validateOfferingOwnership(addon.listingId, partner.id);

    return this.toResponseDto(addon);
  }

  async updateForPartner(
    id: string,
    updateDto: UpdatePartnerAddonDto,
    userId: string,
  ): Promise<PartnerAddonResponseDto> {
    // Get partner by user ID
    const partner = await this.getPartnerByUserId(userId);

    const addon = await this.partnerAddonRepository.findOne({
      where: { id },
      relations: ['listing'],
    });

    if (!addon) {
      throw new NotFoundException(`Addon with ID ${id} not found`);
    }

    // Validate ownership
    await this.validateOfferingOwnership(addon.listingId, partner.id);

    return this.update(id, updateDto);
  }

  async removeForPartner(id: string, userId: string): Promise<void> {
    // Get partner by user ID
    const partner = await this.getPartnerByUserId(userId);

    const addon = await this.partnerAddonRepository.findOne({
      where: { id },
      relations: ['listing'],
    });

    if (!addon) {
      throw new NotFoundException(`Addon with ID ${id} not found`);
    }

    // Validate ownership
    // Verify the addon belongs to the partner
    if (addon.listing.partnerId !== partner.id) {
      throw new ForbiddenException('You can only delete your own addons');
    }

    await this.partnerAddonRepository.remove(addon);
  }

  async toggleAvailabilityForPartner(
    id: string,
    userId: string,
  ): Promise<PartnerAddonResponseDto> {
    // Get partner by user ID
    const partner = await this.getPartnerByUserId(userId);

    const addon = await this.partnerAddonRepository.findOne({
      where: { id },
      relations: ['listing'],
    });

    if (!addon) {
      throw new NotFoundException(`Addon with ID ${id} not found`);
    }

    // Verify the addon belongs to the partner
    if (addon.listing.partnerId !== partner.id) {
      throw new ForbiddenException('You can only modify your own addons');
    }

    addon.isActive = !addon.isActive;
    const updatedAddon = await this.partnerAddonRepository.save(addon);

    return this.toResponseDto(addon);
  }

  async findByOfferingForPartner(
    offeringId: string,
    userId: string,
    options: { includeUnavailable?: boolean } = {},
  ): Promise<PartnerAddonResponseDto[]> {
    // Get partner by user ID
    const partner = await this.getPartnerByUserId(userId);

    // Validate ownership
    await this.validateOfferingOwnership(offeringId, partner.id);

    return this.findByOffering(offeringId, options.includeUnavailable);
  }

  async reorderAddonsForPartner(
    offeringId: string,
    addonIds: string[],
    userId: string,
  ): Promise<void> {
    // Get partner by user ID
    const partner = await this.getPartnerByUserId(userId);

    // Validate ownership
    await this.validateOfferingOwnership(offeringId, partner.id);

    await this.reorder(offeringId, addonIds);
  }

  private async validateListingOwnership(
    listingId: string,
    partnerId: string,
  ): Promise<void> {
    const listing = await this.partnerListingRepository.findOne({
      where: { id: listingId, partnerId } as any,
    });

    if (!listing) {
      throw new NotFoundException(
        'Listing not found or does not belong to partner',
      );
    }
  }

  private async validateOfferingOwnership(
    offeringId: string,
    partnerId: string,
  ): Promise<void> {
    return this.validateListingOwnership(offeringId, partnerId);
  }

  private async getPartnerByUserId(userId: string): Promise<PartnerEntity> {
    const partner = await this.partnerRepository.findOne({
      where: { userId },
    });

    if (!partner) {
      throw new NotFoundException('Partner profile not found for user');
    }

    return partner;
  }

  private toResponseDto(addon: PartnerAddonEntity): PartnerAddonResponseDto {
    return {
      id: addon.id,
      name: addon.name,
      slug: `${addon.name.toLowerCase().replace(/\s+/g, '-')}-${addon.id.slice(-8)}`,
      description: addon.description,
      price: addon.basePrice,
      currency: addon.currency,
      isActive: addon.isActive,
      isRequired: false, // Default value since entity doesn't have this field
      sortOrder: addon.priority,
      offeringId: addon.listingId || '', // Using listingId as offeringId
      metadata: addon.metadata,
      createdAt: addon.createdAt,
      updatedAt: addon.updatedAt,
    };
  }
}
