import {
  BeforeInsert,
  BeforeUpdate,
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { EntityType } from '../../utils/id-generator.service';
import { BaseModel } from '../models/base.model';
import {
  PartnerAddonEntity,
  PricingType,
  RecurringInterval,
  UsageUnit,
} from './partner-addon.entity';

export enum OverrideType {
  NONE = 'none',
  PRICE_ONLY = 'price_only',
  FULL_OVERRIDE = 'full_override',
  DISABLED = 'disabled',
}

@Entity('space_option_extras')
@Index(['spaceOptionId', 'partnerAddonId'], { unique: true })
@Index(['spaceOptionId', 'isActive'])
@Index(['partnerAddonId', 'isActive'])
@Index(['overrideType'])
@Index(['createdAt'])
export class SpaceOptionExtrasEntity extends BaseModel {
  @Column({ name: 'space_option_id' })
  @Index()
  spaceOptionId: string;

  @Column({ name: 'partner_addon_id' })
  @Index()
  partnerAddonId: string;

  @Column({
    type: 'enum',
    enum: OverrideType,
    enumName: 'override_type_enum',
    default: OverrideType.NONE,
    name: 'override_type',
  })
  overrideType: OverrideType;

  // Override pricing fields (only used when overrideType is not NONE)
  @Column({
    type: 'enum',
    enum: PricingType,
    enumName: 'pricing_type_enum',
    nullable: true,
    name: 'override_pricing_type',
  })
  overridePricingType: PricingType;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
    name: 'override_base_price',
  })
  overrideBasePrice: number;

  @Column({ length: 3, nullable: true, name: 'override_currency' })
  overrideCurrency: string;

  // Override recurring pricing fields
  @Column({
    type: 'enum',
    enum: RecurringInterval,
    enumName: 'recurring_interval_enum',
    nullable: true,
    name: 'override_recurring_interval',
  })
  overrideRecurringInterval: RecurringInterval;

  @Column({ type: 'int', nullable: true, name: 'override_recurring_count' })
  overrideRecurringCount: number;

  // Override usage-based pricing fields
  @Column({
    type: 'enum',
    enum: UsageUnit,
    enumName: 'usage_unit_enum',
    nullable: true,
    name: 'override_usage_unit',
  })
  overrideUsageUnit: UsageUnit;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
    name: 'override_min_usage',
  })
  overrideMinUsage: number;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
    name: 'override_max_usage',
  })
  overrideMaxUsage: number;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
    name: 'override_usage_increment',
  })
  overrideUsageIncrement: number;

  // Override tiered pricing
  @Column('jsonb', { nullable: true, name: 'override_pricing_tiers' })
  overridePricingTiers: {
    minQuantity: number;
    maxQuantity: number;
    pricePerUnit: number;
  }[];

  // Override availability and stock
  @Column({ type: 'int', nullable: true, name: 'override_stock_quantity' })
  overrideStockQuantity: number;

  @Column({ type: 'int', nullable: true, name: 'override_min_order_quantity' })
  overrideMinOrderQuantity: number;

  @Column({ type: 'int', nullable: true, name: 'override_max_order_quantity' })
  overrideMaxOrderQuantity: number;

  @Column({
    type: 'boolean',
    nullable: true,
    name: 'override_requires_approval',
  })
  overrideRequiresApproval: boolean;

  @Column({ type: 'int', nullable: true, name: 'override_lead_time_hours' })
  overrideLeadTimeHours: number;

  // Space option specific fields
  @Column({ type: 'boolean', default: true, name: 'is_active' })
  isActive: boolean;

  @Column({ type: 'boolean', default: false, name: 'is_included' })
  isIncluded: boolean; // Whether this extra is included in the space option price

  @Column({ type: 'boolean', default: false, name: 'is_mandatory' })
  isMandatory: boolean; // Whether this extra is mandatory for this space option

  @Column({ type: 'int', default: 0 })
  priority: number; // Display priority for this space option

  @Column({ type: 'text', nullable: true, name: 'space_specific_description' })
  spaceSpecificDescription: string; // Override description for this space option

  @Column('jsonb', { nullable: true, name: 'space_specific_terms' })
  spaceSpecificTerms: {
    description?: string;
    cancellationPolicy?: string;
    refundPolicy?: string;
    additionalNotes?: string;
  };

  @Column('jsonb', { nullable: true })
  metadata: Record<string, any>;

  // Relations
  @ManyToOne('SpaceOptionEntity', 'extras', {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'space_option_id' })
  spaceOption: any;

  @ManyToOne(
    () => PartnerAddonEntity,
    (partnerAddon) => partnerAddon.spaceOptionExtras,
    {
      onDelete: 'CASCADE',
    },
  )
  @JoinColumn({ name: 'partner_addon_id' })
  partnerAddon: PartnerAddonEntity;

  // Hooks
  @BeforeInsert()
  @BeforeUpdate()
  validateOverrideData() {
    // Validate override pricing data
    if (
      this.overrideType === OverrideType.PRICE_ONLY ||
      this.overrideType === OverrideType.FULL_OVERRIDE
    ) {
      if (this.overrideBasePrice !== null && this.overrideBasePrice < 0) {
        throw new Error('Override base price cannot be negative');
      }

      // Validate recurring pricing overrides
      if (this.overridePricingType === PricingType.RECURRING) {
        if (!this.overrideRecurringInterval) {
          throw new Error(
            'Override recurring interval is required for recurring pricing override',
          );
        }
        if (this.overrideRecurringCount && this.overrideRecurringCount < 1) {
          throw new Error('Override recurring count must be at least 1');
        }
      }

      // Validate usage-based pricing overrides
      if (this.overridePricingType === PricingType.USAGE_BASED) {
        if (!this.overrideUsageUnit) {
          throw new Error(
            'Override usage unit is required for usage-based pricing override',
          );
        }
        if (
          this.overrideMinUsage &&
          this.overrideMaxUsage &&
          this.overrideMinUsage > this.overrideMaxUsage
        ) {
          throw new Error(
            'Override minimum usage cannot be greater than maximum usage',
          );
        }
        if (this.overrideMinUsage && this.overrideMinUsage < 0) {
          throw new Error('Override minimum usage cannot be negative');
        }
      }
    }

    // Validate stock and order quantity overrides
    if (
      this.overrideMinOrderQuantity &&
      this.overrideMaxOrderQuantity &&
      this.overrideMinOrderQuantity > this.overrideMaxOrderQuantity
    ) {
      throw new Error(
        'Override minimum order quantity cannot be greater than maximum order quantity',
      );
    }

    if (this.overrideStockQuantity && this.overrideStockQuantity < 0) {
      throw new Error('Override stock quantity cannot be negative');
    }

    if (this.priority < 0) {
      throw new Error('Priority cannot be negative');
    }
  }

  // Helper methods
  getEffectivePricingType(): PricingType {
    if (this.overrideType === OverrideType.DISABLED) {
      throw new Error('Extra is disabled for this space option');
    }

    if (
      (this.overrideType === OverrideType.PRICE_ONLY ||
        this.overrideType === OverrideType.FULL_OVERRIDE) &&
      this.overridePricingType
    ) {
      return this.overridePricingType;
    }

    return this.partnerAddon.pricingType;
  }

  getEffectiveBasePrice(): number {
    if (this.overrideType === OverrideType.DISABLED) {
      throw new Error('Extra is disabled for this space option');
    }

    if (
      (this.overrideType === OverrideType.PRICE_ONLY ||
        this.overrideType === OverrideType.FULL_OVERRIDE) &&
      this.overrideBasePrice !== null
    ) {
      return this.overrideBasePrice;
    }

    return this.partnerAddon.basePrice;
  }

  getEffectiveCurrency(): string {
    if (this.overrideType === OverrideType.DISABLED) {
      throw new Error('Extra is disabled for this space option');
    }

    if (
      (this.overrideType === OverrideType.PRICE_ONLY ||
        this.overrideType === OverrideType.FULL_OVERRIDE) &&
      this.overrideCurrency
    ) {
      return this.overrideCurrency;
    }

    return this.partnerAddon.currency;
  }

  getEffectiveStockQuantity(): number | null {
    if (this.overrideType === OverrideType.DISABLED) {
      return 0;
    }

    if (
      this.overrideType === OverrideType.FULL_OVERRIDE &&
      this.overrideStockQuantity !== null
    ) {
      return this.overrideStockQuantity;
    }

    return this.partnerAddon.stockQuantity;
  }

  getEffectiveMinOrderQuantity(): number | null {
    if (this.overrideType === OverrideType.DISABLED) {
      return null;
    }

    if (
      this.overrideType === OverrideType.FULL_OVERRIDE &&
      this.overrideMinOrderQuantity !== null
    ) {
      return this.overrideMinOrderQuantity;
    }

    return this.partnerAddon.minOrderQuantity;
  }

  getEffectiveMaxOrderQuantity(): number | null {
    if (this.overrideType === OverrideType.DISABLED) {
      return null;
    }

    if (
      this.overrideType === OverrideType.FULL_OVERRIDE &&
      this.overrideMaxOrderQuantity !== null
    ) {
      return this.overrideMaxOrderQuantity;
    }

    return this.partnerAddon.maxOrderQuantity;
  }

  getEffectiveRequiresApproval(): boolean {
    if (this.overrideType === OverrideType.DISABLED) {
      return false;
    }

    if (
      this.overrideType === OverrideType.FULL_OVERRIDE &&
      this.overrideRequiresApproval !== null
    ) {
      return this.overrideRequiresApproval;
    }

    return this.partnerAddon.requiresApproval;
  }

  getEffectiveLeadTimeHours(): number | null {
    if (this.overrideType === OverrideType.DISABLED) {
      return null;
    }

    if (
      this.overrideType === OverrideType.FULL_OVERRIDE &&
      this.overrideLeadTimeHours !== null
    ) {
      return this.overrideLeadTimeHours;
    }

    return this.partnerAddon.leadTimeHours;
  }

  calculatePrice(quantity: number = 1, duration: number = 1): number {
    if (this.overrideType === OverrideType.DISABLED) {
      throw new Error('Extra is disabled for this space option');
    }

    if (this.isIncluded) {
      return 0; // No additional cost if included in space option
    }

    const pricingType = this.getEffectivePricingType();
    const basePrice = this.getEffectiveBasePrice();
    let totalPrice = 0;

    switch (pricingType) {
      case PricingType.FLAT:
        totalPrice = basePrice;
        break;

      case PricingType.RECURRING:
        const intervals = this.getEffectiveRecurringCount() || duration;
        totalPrice = basePrice * intervals;
        break;

      case PricingType.USAGE_BASED:
        const tiers = this.getEffectivePricingTiers();
        if (tiers && tiers.length > 0) {
          totalPrice = this.calculateTieredPrice(quantity, tiers);
        } else {
          totalPrice = basePrice * quantity;
        }
        break;

      default:
        totalPrice = basePrice;
    }

    return Math.round(totalPrice * 100) / 100;
  }

  private getEffectiveRecurringCount(): number | null {
    if (
      this.overrideType === OverrideType.FULL_OVERRIDE &&
      this.overrideRecurringCount !== null
    ) {
      return this.overrideRecurringCount;
    }
    return this.partnerAddon.recurringCount;
  }

  private getEffectivePricingTiers(): any[] | null {
    if (
      this.overrideType === OverrideType.FULL_OVERRIDE &&
      this.overridePricingTiers
    ) {
      return this.overridePricingTiers;
    }
    return this.partnerAddon.pricingTiers;
  }

  private calculateTieredPrice(quantity: number, tiers: any[]): number {
    let totalPrice = 0;
    let remainingQuantity = quantity;

    for (const tier of tiers) {
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
    if (this.overrideType === OverrideType.DISABLED || !this.isActive) {
      return false;
    }

    const minQuantity = this.getEffectiveMinOrderQuantity();
    const maxQuantity = this.getEffectiveMaxOrderQuantity();
    const stockQuantity = this.getEffectiveStockQuantity();

    if (minQuantity && quantity < minQuantity) return false;
    if (maxQuantity && quantity > maxQuantity) return false;
    if (stockQuantity !== null && quantity > stockQuantity) return false;

    return true;
  }

  isInStock(): boolean {
    if (this.overrideType === OverrideType.DISABLED || !this.isActive) {
      return false;
    }

    const stockQuantity = this.getEffectiveStockQuantity();
    return stockQuantity === null || stockQuantity > 0;
  }

  canOrderWithLeadTime(hoursInAdvance: number): boolean {
    if (this.overrideType === OverrideType.DISABLED || !this.isActive) {
      return false;
    }

    const leadTime = this.getEffectiveLeadTimeHours();
    if (!leadTime) return true;
    return hoursInAdvance >= leadTime;
  }

  getEffectiveDescription(): string {
    return this.spaceSpecificDescription || this.partnerAddon.description;
  }

  getEffectiveTerms(): any {
    return this.spaceSpecificTerms || this.partnerAddon.termsAndConditions;
  }

  protected getEntityType(): EntityType {
    return EntityType.SPACE;
  }
}
