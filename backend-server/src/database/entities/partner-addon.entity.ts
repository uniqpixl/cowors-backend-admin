import {
  BeforeInsert,
  BeforeUpdate,
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { EntityType } from '../../utils/id-generator.service';
import { BaseModel } from '../models/base.model';
import { SpaceOptionExtrasEntity } from './space-option-extras.entity';

export enum PricingType {
  FLAT = 'flat',
  RECURRING = 'recurring',
  USAGE_BASED = 'usage_based',
}

export enum RecurringInterval {
  HOURLY = 'hourly',
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
}

export enum UsageUnit {
  PER_PERSON = 'per_person',
  PER_HOUR = 'per_hour',
  PER_DAY = 'per_day',
  PER_ITEM = 'per_item',
  PER_SESSION = 'per_session',
}

export enum ExtraCategory {
  CATERING = 'catering',
  EQUIPMENT = 'equipment',
  SERVICES = 'services',
  AMENITIES = 'amenities',
  TECHNOLOGY = 'technology',
  FURNITURE = 'furniture',
  CLEANING = 'cleaning',
  SECURITY = 'security',
  PARKING = 'parking',
  OTHER = 'other',
}

export enum ExtraStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  OUT_OF_STOCK = 'out_of_stock',
  COMING_SOON = 'coming_soon',
}

@Entity('partner_addons')
@Index(['partnerId', 'category'])
@Index(['category', 'status'])
@Index(['isActive', 'priority'])
@Index(['createdAt'])
@Index(['offeringId', 'isActive'])
@Index(['categoryId', 'addonType'])
@Index(['addonType', 'status'])
export class PartnerAddonEntity extends BaseModel {
  @Column({ name: 'partner_id' })
  @Index()
  partnerId: string;

  @Column({ type: 'uuid', nullable: true, name: 'listing_id' })
  listingId: string;

  @Column({ type: 'uuid', nullable: true, name: 'offering_id' })
  @Index()
  offeringId: string;

  @Column({ type: 'uuid', nullable: true, name: 'category_id' })
  @Index()
  categoryId: string;

  @Column({ type: 'varchar', length: 50, nullable: true, name: 'addon_type' })
  addonType: string; // 'equipment', 'service', 'amenity', 'catering', etc.

  @Column({
    type: 'varchar',
    length: 50,
    nullable: true,
    name: 'pricing_model',
  })
  pricingModel: string; // 'fixed', 'hourly', 'daily', 'per_person', etc.

  @Column({ length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({
    type: 'enum',
    enum: ExtraCategory,
  })
  category: ExtraCategory;

  @Column({
    type: 'enum',
    enum: ExtraStatus,
    default: ExtraStatus.ACTIVE,
  })
  status: ExtraStatus;

  // Pricing Schema
  @Column({
    type: 'enum',
    enum: PricingType,
    name: 'pricing_type',
  })
  pricingType: PricingType;

  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'base_price' })
  basePrice: number;

  @Column({ length: 3, default: 'INR' })
  currency: string;

  // Recurring pricing fields
  @Column({
    type: 'enum',
    enum: RecurringInterval,
    nullable: true,
    name: 'recurring_interval',
  })
  recurringInterval: RecurringInterval;

  @Column({ type: 'int', nullable: true, name: 'recurring_count' })
  recurringCount: number; // Number of intervals

  // Usage-based pricing fields
  @Column({
    type: 'enum',
    enum: UsageUnit,
    nullable: true,
    name: 'usage_unit',
  })
  usageUnit: UsageUnit;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
    name: 'min_usage',
  })
  minUsage: number;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
    name: 'max_usage',
  })
  maxUsage: number;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
    name: 'usage_increment',
  })
  usageIncrement: number;

  // Tiered pricing for usage-based
  @Column('jsonb', { nullable: true, name: 'pricing_tiers' })
  pricingTiers: {
    minQuantity: number;
    maxQuantity: number;
    pricePerUnit: number;
  }[];

  // General fields
  @Column({ type: 'int', nullable: true, name: 'stock_quantity' })
  stockQuantity: number;

  @Column({ type: 'int', nullable: true, name: 'min_order_quantity' })
  minOrderQuantity: number;

  @Column({ type: 'int', nullable: true, name: 'max_order_quantity' })
  maxOrderQuantity: number;

  @Column({ type: 'boolean', default: false, name: 'requires_approval' })
  requiresApproval: boolean;

  @Column({ type: 'int', nullable: true, name: 'lead_time_hours' })
  leadTimeHours: number; // How many hours in advance this needs to be ordered

  @Column('jsonb', { nullable: true })
  images: {
    url: string;
    alt?: string;
    isPrimary?: boolean;
  }[];

  @Column('jsonb', { nullable: true })
  specifications: Record<string, any>;

  @Column('jsonb', { nullable: true, name: 'terms_and_conditions' })
  termsAndConditions: {
    description: string;
    cancellationPolicy?: string;
    refundPolicy?: string;
    additionalNotes?: string;
  };

  @Column({ type: 'boolean', default: true, name: 'is_active' })
  isActive: boolean;

  @Column({ type: 'int', default: 0 })
  priority: number;

  @Column({ type: 'decimal', precision: 3, scale: 2, default: 0 })
  rating: number;

  @Column({ type: 'int', default: 0, name: 'review_count' })
  reviewCount: number;

  @Column({ type: 'int', default: 0, name: 'total_orders' })
  totalOrders: number;

  @Column('jsonb', { nullable: true })
  metadata: Record<string, any>;

  @Column('jsonb', { nullable: true, name: 'availability_rules' })
  availabilityRules: {
    timeSlots?: {
      start: string;
      end: string;
      daysOfWeek: number[];
    }[];
    blackoutDates?: string[];
    advanceBookingDays?: number;
    maxBookingDuration?: number;
    seasonalAvailability?: {
      startDate: string;
      endDate: string;
      isAvailable: boolean;
    }[];
  };

  // Relations
  @ManyToOne('PartnerEntity', 'extras', {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'partner_id' })
  partner: any;

  @ManyToOne('PartnerListingEntity', 'extras', {
    onDelete: 'CASCADE',
    nullable: true,
  })
  @JoinColumn({ name: 'listing_id' })
  listing: any;

  @ManyToOne('PartnerOfferingEntity', 'addons', {
    onDelete: 'CASCADE',
    nullable: true,
  })
  @JoinColumn({ name: 'offering_id' })
  offering: any;

  @ManyToOne('PartnerCategoryEntity', 'addons', {
    onDelete: 'SET NULL',
    nullable: true,
  })
  @JoinColumn({ name: 'category_id' })
  partnerCategory: any;

  @OneToMany(
    () => SpaceOptionExtrasEntity,
    (spaceOptionExtra) => spaceOptionExtra.partnerAddon,
  )
  spaceOptionExtras: SpaceOptionExtrasEntity[];

  // Hooks
  @BeforeInsert()
  @BeforeUpdate()
  validatePricingData() {
    if (this.basePrice < 0) {
      throw new Error('Base price cannot be negative');
    }

    // Validate recurring pricing
    if (this.pricingType === PricingType.RECURRING) {
      if (!this.recurringInterval) {
        throw new Error('Recurring interval is required for recurring pricing');
      }
      if (this.recurringCount && this.recurringCount < 1) {
        throw new Error('Recurring count must be at least 1');
      }
    }

    // Validate usage-based pricing
    if (this.pricingType === PricingType.USAGE_BASED) {
      if (!this.usageUnit) {
        throw new Error('Usage unit is required for usage-based pricing');
      }
      if (this.minUsage && this.maxUsage && this.minUsage > this.maxUsage) {
        throw new Error('Minimum usage cannot be greater than maximum usage');
      }
      if (this.minUsage && this.minUsage < 0) {
        throw new Error('Minimum usage cannot be negative');
      }
    }

    // Validate stock and order quantities
    if (
      this.minOrderQuantity &&
      this.maxOrderQuantity &&
      this.minOrderQuantity > this.maxOrderQuantity
    ) {
      throw new Error(
        'Minimum order quantity cannot be greater than maximum order quantity',
      );
    }

    if (this.stockQuantity && this.stockQuantity < 0) {
      throw new Error('Stock quantity cannot be negative');
    }

    if (this.priority < 0) {
      throw new Error('Priority cannot be negative');
    }
  }

  // Helper methods
  calculatePrice(quantity: number = 1, duration: number = 1): number {
    let totalPrice = 0;

    switch (this.pricingType) {
      case PricingType.FLAT:
        totalPrice = this.basePrice;
        break;

      case PricingType.RECURRING:
        const intervals = this.recurringCount || duration;
        totalPrice = this.basePrice * intervals;
        break;

      case PricingType.USAGE_BASED:
        if (this.pricingTiers && this.pricingTiers.length > 0) {
          // Use tiered pricing
          totalPrice = this.calculateTieredPrice(quantity);
        } else {
          // Simple usage-based pricing
          totalPrice = this.basePrice * quantity;
        }
        break;

      default:
        totalPrice = this.basePrice;
    }

    return Math.round(totalPrice * 100) / 100;
  }

  private calculateTieredPrice(quantity: number): number {
    let totalPrice = 0;
    let remainingQuantity = quantity;

    for (const tier of this.pricingTiers) {
      if (remainingQuantity <= 0) break;

      const tierQuantity = Math.min(
        remainingQuantity,
        tier.maxQuantity - tier.minQuantity + 1,
      );

      totalPrice += tierQuantity * tier.pricePerUnit;
      remainingQuantity -= tierQuantity;
    }

    return totalPrice;
  }

  isAvailableForQuantity(quantity: number): boolean {
    if (this.minOrderQuantity && quantity < this.minOrderQuantity) return false;
    if (this.maxOrderQuantity && quantity > this.maxOrderQuantity) return false;
    if (this.stockQuantity !== null && quantity > this.stockQuantity)
      return false;
    return true;
  }

  isInStock(): boolean {
    return this.stockQuantity === null || this.stockQuantity > 0;
  }

  canOrderWithLeadTime(hoursInAdvance: number): boolean {
    if (!this.leadTimeHours) return true;
    return hoursInAdvance >= this.leadTimeHours;
  }

  updateRating(newRating: number): void {
    const totalRating = this.rating * this.reviewCount + newRating;
    this.reviewCount += 1;
    this.rating = Math.round((totalRating / this.reviewCount) * 100) / 100;
  }

  incrementOrderCount(): void {
    this.totalOrders += 1;
  }

  decrementStock(quantity: number): void {
    if (this.stockQuantity !== null) {
      this.stockQuantity = Math.max(0, this.stockQuantity - quantity);
      if (this.stockQuantity === 0) {
        this.status = ExtraStatus.OUT_OF_STOCK;
      }
    }
  }

  restockItem(quantity: number): void {
    if (this.stockQuantity !== null) {
      this.stockQuantity += quantity;
      if (this.status === ExtraStatus.OUT_OF_STOCK && this.stockQuantity > 0) {
        this.status = ExtraStatus.ACTIVE;
      }
    }
  }

  protected getEntityType(): EntityType {
    return EntityType.PARTNER;
  }
}
