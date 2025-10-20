import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { EntityType } from '../../utils/id-generator.service';
import { BaseModel } from '../models/base.model';
// import { PartnerEntity } from './partner.entity'; // Removed to avoid circular dependency
// import { PartnerCategoryEntity } from './partner-category.entity'; // Removed to avoid circular dependency
// import { PartnerSubcategoryEntity } from './partner-subcategory.entity'; // Removed to avoid circular dependency

@Entity('partner_offerings')
export class PartnerOfferingEntity extends BaseModel {
  @Column({ length: 200 })
  @Index()
  title: string;

  @Column({ length: 200 })
  @Index()
  slug: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'boolean', default: true })
  @Index()
  isActive: boolean;

  @Column({ type: 'boolean', default: false })
  isFeatured: boolean;

  @Column({ type: 'int', default: 0 })
  sortOrder: number;

  @Column('jsonb', { nullable: true })
  pricing?: {
    basePrice: number;
    currency: string;
    pricingModel: 'hourly' | 'daily' | 'monthly' | 'fixed' | 'custom';
    discounts?: {
      type: 'percentage' | 'fixed';
      value: number;
      validFrom?: Date;
      validTo?: Date;
      conditions?: string;
    }[];
    additionalCharges?: {
      name: string;
      amount: number;
      type: 'fixed' | 'percentage';
      optional: boolean;
    }[];
  };

  @Column('jsonb', { nullable: true })
  availability?: {
    schedule?: {
      [key: string]: {
        open: string;
        close: string;
        isAvailable: boolean;
      };
    };
    advanceBooking: number; // days
    maxBookingDuration: number; // hours
    bufferTime: number; // minutes
    blackoutDates?: Date[];
    specialAvailability?: {
      date: Date;
      slots: {
        start: string;
        end: string;
        available: boolean;
      }[];
    }[];
  };

  @Column('jsonb', { nullable: true })
  features?: {
    allowInstantBooking: boolean;
    allowCancellation: boolean;
    cancellationPolicy: string;
    refundPolicy?: string;
    amenities?: string[];
    capacity?: {
      min: number;
      max: number;
      optimal?: number;
    };
    equipment?: string[];
    specialFeatures?: string[];
  };

  @Column('jsonb', { nullable: true })
  requirements?: {
    verification: string[];
    documents: string[];
    minimumRating?: number;
    ageRestriction?: {
      min?: number;
      max?: number;
    };
    specialRequirements?: string[];
  };

  @Column('jsonb', { nullable: true })
  media?: {
    images?: {
      url: string;
      alt: string;
      isPrimary: boolean;
      order: number;
    }[];
    videos?: {
      url: string;
      title: string;
      thumbnail?: string;
    }[];
    documents?: {
      url: string;
      name: string;
      type: string;
    }[];
  };

  @Column('jsonb', { nullable: true })
  location?: {
    address?: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
    accessibility?: string[];
    parking?: {
      available: boolean;
      type?: 'free' | 'paid' | 'valet';
      spaces?: number;
    };
    publicTransport?: string[];
  };

  @Column('jsonb', { nullable: true })
  metadata?: {
    keywords?: string[];
    tags?: string[];
    searchTerms?: string[];
    seoTitle?: string;
    seoDescription?: string;
    popularityScore?: number;
    viewCount?: number;
    bookingCount?: number;
    lastBookedAt?: Date;
  };

  @Column({ type: 'decimal', precision: 3, scale: 2, default: 0 })
  rating: number;

  @Column({ type: 'int', default: 0 })
  reviewCount: number;

  // Foreign Keys
  @Column()
  @Index()
  partnerId: string;

  @Column()
  @Index()
  categoryId: string;

  @Column({ nullable: true })
  @Index()
  subcategoryId?: string;

  // Relationships
  @ManyToOne('PartnerEntity', (partner: any) => partner.offerings, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'partnerId' })
  partner: any;

  @ManyToOne('PartnerCategoryEntity', (category: any) => category.offerings, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'categoryId' })
  category: any;

  @ManyToOne(
    'PartnerSubcategoryEntity',
    (subcategory: any) => subcategory.offerings,
    {
      onDelete: 'SET NULL',
    },
  )
  @JoinColumn({ name: 'subcategoryId' })
  subcategory?: any;

  // Helper methods
  getEffectivePrice(): number {
    return this.pricing?.basePrice || 0;
  }

  getCurrency(): string {
    return this.pricing?.currency || 'USD';
  }

  getPricingModel(): string {
    return this.pricing?.pricingModel || 'hourly';
  }

  isInstantBookingAllowed(): boolean {
    return this.features?.allowInstantBooking || false;
  }

  isCancellationAllowed(): boolean {
    return this.features?.allowCancellation || false;
  }

  getCapacity(): { min: number; max: number; optimal?: number } | null {
    return this.features?.capacity || null;
  }

  getAmenities(): string[] {
    return this.features?.amenities || [];
  }

  getPrimaryImage(): string | null {
    const primaryImage = this.media?.images?.find((img) => img.isPrimary);
    return primaryImage?.url || this.media?.images?.[0]?.url || null;
  }

  getAllImages(): string[] {
    return this.media?.images?.map((img) => img.url) || [];
  }

  hasLocation(): boolean {
    return !!(this.location?.address || this.location?.coordinates);
  }

  getCoordinates(): { latitude: number; longitude: number } | null {
    return this.location?.coordinates || null;
  }

  protected getEntityType(): EntityType {
    return EntityType.PARTNER;
  }

  // Static method to create slug from title
  static createSlug(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  // Generate unique slug within partner
  static async generateUniqueSlug(
    title: string,
    partnerId: string,
    excludeId?: string,
  ): Promise<string> {
    // This would be implemented in the service layer
    return this.createSlug(title);
  }
}
