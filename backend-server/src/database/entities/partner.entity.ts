import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { UserEntity } from '../../auth/entities/user.entity';
import {
  EventSubtype,
  PartnerStatus,
  PartnerType,
  ServiceSubtype,
  SpaceSubtype,
  VerificationStatus,
} from '../../common/enums/partner.enum';
import { EntityType } from '../../utils/id-generator.service';
import { BaseModel } from '../models/base.model';
import { PartnerCategoryEntity } from './partner-category.entity';
import { PartnerListingEntity } from './partner-listing.entity';
import { PartnerLocationEntity } from './partner-location.entity';
import { PartnerSubcategoryEntity } from './partner-subcategory.entity';
import { PartnerTypeEntity } from './partner-type.entity';
// Removed direct import to avoid circular dependency
// import { PartnerOfferingEntity } from './partner-offering.entity';

@Entity('partner')
export class PartnerEntity extends BaseModel {
  @Index({ where: '"deletedAt" IS NULL' })
  @Column()
  userId: string;

  @ManyToOne(() => UserEntity, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'userId' })
  user: UserEntity;

  @Column({ length: 255 })
  businessName: string;

  @Column({
    type: 'enum',
    enum: PartnerType,
    default: PartnerType.SPACE,
  })
  businessType: PartnerType;

  @Column({ type: 'varchar', length: 100, nullable: true })
  businessSubtype: SpaceSubtype | ServiceSubtype | EventSubtype;

  // New dynamic category system fields
  @Column({ nullable: true })
  @Index()
  partnerTypeId?: string;

  @Column({ nullable: true })
  @Index()
  primaryCategoryId?: string;

  @Column({ nullable: true })
  @Index()
  primarySubcategoryId?: string;

  // Address removed - now handled by PartnerLocationEntity

  @Column('jsonb', { nullable: true })
  contactInfo: {
    phone: string;
    email: string;
    website?: string;
    socialMedia?: {
      instagram?: string;
      facebook?: string;
      twitter?: string;
    };
  };

  @Column({
    type: 'enum',
    enum: VerificationStatus,
    default: VerificationStatus.PENDING,
  })
  verificationStatus: VerificationStatus;

  @Column({
    type: 'enum',
    enum: PartnerStatus,
    default: PartnerStatus.ACTIVE,
  })
  status: PartnerStatus;

  @Column('jsonb', { nullable: true })
  businessDetails: {
    description?: string;
    establishedYear?: number;
    licenseNumber?: string;
    taxId?: string;
    bankDetails?: {
      accountNumber: string;
      routingNumber: string;
      bankName: string;
    };
    adminNotes?: string;
    rejectionReason?: string;
    subscription?: any;
    suspension?: any;
    reactivatedAt?: Date;
    reactivationNotes?: string;
  };

  @Column('jsonb', { nullable: true })
  operatingHours: {
    [key: string]: {
      open: string;
      close: string;
      isOpen: boolean;
    };
  };

  @Column({ type: 'decimal', precision: 3, scale: 2, default: 0 })
  rating: number;

  @Column({ type: 'int', default: 0 })
  reviewCount: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  commissionRate: number;

  @Column({
    type: 'enum',
    enum: ['bronze', 'silver', 'gold', 'platinum', 'diamond'],
    default: 'bronze',
  })
  tier: string;

  @OneToMany(() => PartnerLocationEntity, (location) => location.partner)
  locations: PartnerLocationEntity[];

  @OneToMany(() => PartnerListingEntity, (listing) => listing.partner)
  listings: PartnerListingEntity[];

  // New dynamic category relationships
  @ManyToOne(() => PartnerTypeEntity, (partnerType) => partnerType.partners, {
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'partnerTypeId' })
  partnerType?: PartnerTypeEntity;

  @ManyToOne(() => PartnerCategoryEntity, (category) => category.partners, {
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'primaryCategoryId' })
  primaryCategory?: PartnerCategoryEntity;

  @ManyToOne(
    () => PartnerSubcategoryEntity,
    (subcategory) => subcategory.partners,
    {
      onDelete: 'SET NULL',
    },
  )
  @JoinColumn({ name: 'primarySubcategoryId' })
  primarySubcategory?: PartnerSubcategoryEntity;

  @OneToMany('PartnerOfferingEntity', (offering: any) => offering.partner)
  offerings: any[];

  @OneToMany('SpaceEntity', (space: any) => space.partner)
  spaces: any[];

  @OneToMany('PartnerAddonEntity', (addon: any) => addon.partner)
  addons: any[];

  @OneToMany('ReviewEntity', 'partner')
  reviews: any[];

  // Helper methods
  getPrimaryLocation(): PartnerLocationEntity | undefined {
    return (
      this.locations?.find((location) => location.is_active) ||
      this.locations?.[0]
    );
  }

  getActiveListings(): PartnerListingEntity[] {
    return this.listings?.filter((listing) => listing.is_active) || [];
  }

  getListingsByType(listingType: string): PartnerListingEntity[] {
    return (
      this.listings?.filter(
        (listing) => listing.listing_type === listingType && listing.is_active,
      ) || []
    );
  }

  getTotalActiveListings(): number {
    return this.getActiveListings().length;
  }

  // New dynamic category helper methods
  getActiveOfferings(): any[] {
    return this.offerings?.filter((offering) => offering.isActive) || [];
  }

  getFeaturedOfferings(): any[] {
    return (
      this.offerings?.filter(
        (offering) => offering.isActive && offering.isFeatured,
      ) || []
    );
  }

  getOfferingsByCategory(categoryId: string): any[] {
    return (
      this.offerings?.filter(
        (offering) => offering.categoryId === categoryId && offering.isActive,
      ) || []
    );
  }

  getOfferingsBySubcategory(subcategoryId: string): any[] {
    return (
      this.offerings?.filter(
        (offering) =>
          offering.subcategoryId === subcategoryId && offering.isActive,
      ) || []
    );
  }

  getTotalActiveOfferings(): number {
    return this.getActiveOfferings().length;
  }

  // Check if partner uses dynamic category system
  usesDynamicCategories(): boolean {
    return !!(this.partnerTypeId || this.offerings?.length);
  }

  // Get effective partner type (dynamic or legacy)
  getEffectivePartnerType(): string {
    if (this.partnerType?.name) {
      return this.partnerType.name;
    }
    return this.businessType;
  }

  protected getEntityType(): EntityType {
    return EntityType.PARTNER;
  }
}
