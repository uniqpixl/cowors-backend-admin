import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { SpaceSubtype } from '../../common/enums/partner.enum';
import { SpaceStatus } from '../../common/enums/space.enum';
import { EntityType } from '../../utils/id-generator.service';
import { BaseModel } from '../models/base.model';
import { PartnerAddonEntity } from './partner-addon.entity';
import { PartnerListingEntity } from './partner-listing.entity';
import { ReviewEntity } from './review.entity';
import { SpaceAvailabilityEntity } from './space-availability.entity';
import { SpaceOptionEntity } from './space-option.entity';

@Entity('space')
@Index(['listing_id', 'status'])
@Index(['spaceType', 'status'])
@Index(['createdAt'])
export class SpaceEntity extends BaseModel {
  @Index({ where: '"deletedAt" IS NULL' })
  @Column({ type: 'uuid', nullable: false })
  listing_id: string;

  @ManyToOne(() => PartnerListingEntity, (listing) => listing.spaces, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'listing_id' })
  listing: PartnerListingEntity;

  @Column({ length: 255 })
  name: string;

  @Column('text')
  description: string;

  @Column({
    type: 'enum',
    enum: SpaceSubtype,
  })
  spaceType: SpaceSubtype;

  // Space-level capacity (total across all space options)
  @Column({ type: 'int', nullable: true, name: 'total_capacity' })
  totalCapacity: number;

  // Space-level amenities (common across all space options)
  @Column('jsonb', { nullable: true })
  commonAmenities: string[];

  // Location information now handled by PartnerListingEntity
  @Column('jsonb', { nullable: true })
  space_specific_location: {
    floor?: string;
    building?: string;
    room_number?: string;
    access_instructions?: string;
  };

  // Space-level contact and operational information
  @Column('jsonb', { nullable: true, name: 'contact_info' })
  contactInfo: {
    phone?: string;
    email?: string;
    website?: string;
    socialMedia?: {
      facebook?: string;
      instagram?: string;
      linkedin?: string;
    };
  };

  // Space operating hours (applies to all space options unless overridden)
  @Column('jsonb', { nullable: true, name: 'operating_hours' })
  operatingHours: {
    [key: string]: {
      open: string;
      close: string;
      isAvailable: boolean;
    };
  };

  // Space-level policies (default for all space options)
  @Column('jsonb', { nullable: true, name: 'space_policies' })
  spacePolicies: {
    cancellationPolicy?: {
      freeUntilHours: number;
      partialRefundUntilHours: number;
      refundPercentage: number;
    };
    advanceBookingDays?: number;
    minimumNoticeHours?: number;
    blackoutDates?: string[];
    checkInInstructions?: string;
    checkOutInstructions?: string;
    securityDeposit?: {
      amount: number;
      currency: string;
      refundable: boolean;
    };
  };

  // Space-level images (lobby, exterior, common areas)
  @Column('jsonb', { nullable: true })
  images: {
    url: string;
    alt: string;
    isPrimary: boolean;
    category: 'exterior' | 'lobby' | 'common_area' | 'amenity' | 'other';
  }[];

  @Column({
    type: 'enum',
    enum: SpaceStatus,
    default: SpaceStatus.ACTIVE,
  })
  status: SpaceStatus;

  @Column({ type: 'decimal', precision: 3, scale: 2, default: 0 })
  rating: number;

  @Column({ type: 'int', default: 0 })
  reviewCount: number;

  @Column({ type: 'int', default: 0 })
  totalBookings: number;

  // Space-level metadata and features
  @Column('jsonb', { nullable: true })
  metadata: {
    wifi?: boolean;
    parking?: {
      available: boolean;
      type: 'free' | 'paid' | 'valet';
      spaces?: number;
      instructions?: string;
    };
    accessibility?: {
      wheelchairAccessible: boolean;
      elevatorAccess: boolean;
      accessibleParking: boolean;
      accessibleRestrooms: boolean;
    };
    petFriendly?: boolean;
    smokingAllowed?: boolean;
    alcoholAllowed?: boolean;
    cateringAvailable?: boolean;
    securityFeatures?: string[];
    certifications?: string[];
    awards?: string[];
  };

  // Space statistics
  @Column({ type: 'int', default: 0, name: 'total_space_options' })
  totalSpaceOptions: number;

  // Relations
  @OneToMany(() => SpaceOptionEntity, (spaceOption) => spaceOption.space)
  spaceOptions: SpaceOptionEntity[];

  @OneToMany(() => PartnerAddonEntity, (addon) => addon.partner)
  addons: PartnerAddonEntity[];

  @OneToMany(
    () => SpaceAvailabilityEntity,
    (availability) => availability.space,
  )
  availability: SpaceAvailabilityEntity[];

  @OneToMany(() => ReviewEntity, (review) => review.space)
  reviews: ReviewEntity[];

  // Helper methods
  updateSpaceOptionCount(): void {
    // This should be called when space options are added/removed
    // Implementation will be handled by the service layer
  }

  getActiveSpaceOptions(): SpaceOptionEntity[] {
    return this.spaceOptions?.filter((option) => option.isActive) || [];
  }

  getTotalCapacity(): number {
    if (this.totalCapacity) {
      return this.totalCapacity;
    }

    // Calculate from active space options if not set
    return this.getActiveSpaceOptions().reduce(
      (total, option) => total + (option.maxCapacity || 0),
      0,
    );
  }

  hasCommonAmenity(amenity: string): boolean {
    return this.commonAmenities?.includes(amenity) || false;
  }

  isOperatingAt(dayOfWeek: string, time: string): boolean {
    const daySchedule = this.operatingHours?.[dayOfWeek];
    if (!daySchedule || !daySchedule.isAvailable) {
      return false;
    }

    // Simple time comparison (assumes HH:MM format)
    return time >= daySchedule.open && time <= daySchedule.close;
  }

  getAverageRating(): number {
    return this.rating;
  }

  incrementTotalBookings(): void {
    this.totalBookings += 1;
  }

  updateRating(newRating: number): void {
    const totalRating = this.rating * this.reviewCount + newRating;
    this.reviewCount += 1;
    this.rating = Math.round((totalRating / this.reviewCount) * 100) / 100;
  }

  getEffectivePricingType(): string {
    // Return the most common pricing type from active space options
    const activeOptions = this.getActiveSpaceOptions();
    if (activeOptions.length === 0) {
      return 'FLAT'; // Default pricing type
    }

    // For now, return the pricing type of the first active option
    // In a more complex scenario, you might want to analyze all options
    return activeOptions[0].packages?.[0]?.pricingType || 'FLAT';
  }

  protected getEntityType(): EntityType {
    return EntityType.SPACE;
  }
}
