import { UserEntity } from '@/auth/entities/user.entity';
import { BookingEntity } from '@/database/entities/booking.entity';
// import { SpaceOptionEntity } from '@/database/entities/space-option.entity'; // Removed to prevent circular dependency
import {
  BeforeInsert,
  BeforeUpdate,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
// Import entities from space-inventory module
import type {
  InventoryEntity,
  PricingRuleEntity,
} from '../../space-inventory/entities/space-inventory.entity';
import {
  BulkInventoryOperationType,
  ExportFormat,
  ExtrasType,
  InventoryStatus,
  PackageType,
  PricingType,
  ReportType,
} from '../dto/space-inventory.dto';

// Enhanced pricing enums
export enum EnhancedPricingType {
  FLAT = 'flat',
  RECURRING = 'recurring',
  USAGE_BASED = 'usage_based',
  TIERED = 'tiered',
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

// Enhanced Space Package Entity
@Entity('space_packages')
@Index(['spaceOptionId', 'packageType'])
@Index(['isActive', 'priority'])
@Index(['pricingType'])
@Index(['createdAt'])
export class SpacePackageEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'space_option_id' })
  @Index()
  spaceOptionId: string;

  @Column({ length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({
    type: 'enum',
    enum: PackageType,
    name: 'package_type',
  })
  packageType: PackageType;

  // Enhanced Pricing Schema
  @Column({
    type: 'enum',
    enum: EnhancedPricingType,
    name: 'pricing_type',
  })
  pricingType: EnhancedPricingType;

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

  // Legacy fields (for backward compatibility)
  @Column({ type: 'int', nullable: true, name: 'duration_hours' })
  durationHours: number;

  @Column({ type: 'int', nullable: true, name: 'max_capacity' })
  maxCapacity: number;

  @Column({ type: 'int', nullable: true, name: 'min_capacity' })
  minCapacity: number;

  @Column({ type: 'json', nullable: true, name: 'included_amenities' })
  includedAmenities: string[];

  @Column({ type: 'json', nullable: true })
  features: string[];

  @Column({ type: 'text', nullable: true, name: 'terms_and_conditions' })
  termsAndConditions: string;

  @Column({ type: 'text', nullable: true, name: 'cancellation_policy' })
  cancellationPolicy: string;

  @Column({ type: 'int', nullable: true, name: 'advance_booking_hours' })
  advanceBookingHours: number;

  @Column({ type: 'int', nullable: true, name: 'max_booking_hours' })
  maxBookingHours: number;

  @Column({ type: 'boolean', default: true, name: 'is_active' })
  isActive: boolean;

  @Column({ type: 'int', default: 0 })
  priority: number;

  @Column({ type: 'json', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Column({ nullable: true, name: 'created_by' })
  createdBy: string;

  @Column({ nullable: true, name: 'updated_by' })
  updatedBy: string;

  // Relations
  @ManyToOne('SpaceOptionEntity', (spaceOption: any) => spaceOption.packages, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'space_option_id' })
  spaceOption: any;

  @ManyToOne(() => UserEntity, { nullable: true })
  @JoinColumn({ name: 'created_by' })
  creator: UserEntity;

  @ManyToOne(() => UserEntity, { nullable: true })
  @JoinColumn({ name: 'updated_by' })
  updater: UserEntity;

  @OneToMany(() => BookingEntity, (booking) => booking.spaceOption)
  bookings: BookingEntity[];

  @OneToMany('InventoryEntity', (inventory: any) => inventory.spacePackage)
  inventory: InventoryEntity[];

  @OneToMany('PricingRuleEntity', (rule: any) => rule.spacePackage)
  pricingRules: PricingRuleEntity[];

  // Hooks
  @BeforeInsert()
  @BeforeUpdate()
  validateData() {
    if (
      this.minCapacity &&
      this.maxCapacity &&
      this.minCapacity > this.maxCapacity
    ) {
      throw new Error(
        'Minimum capacity cannot be greater than maximum capacity',
      );
    }
    if (this.basePrice < 0) {
      throw new Error('Base price cannot be negative');
    }

    // Validate recurring pricing
    if (this.pricingType === EnhancedPricingType.RECURRING) {
      if (!this.recurringInterval) {
        throw new Error('Recurring interval is required for recurring pricing');
      }
      if (this.recurringCount && this.recurringCount < 1) {
        throw new Error('Recurring count must be at least 1');
      }
    }

    // Validate usage-based pricing
    if (this.pricingType === EnhancedPricingType.USAGE_BASED) {
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
  }

  // Enhanced Helper methods
  calculatePrice(quantity: number = 1, duration: number = 1): number {
    let totalPrice = 0;

    switch (this.pricingType) {
      case EnhancedPricingType.FLAT:
        totalPrice = this.basePrice;
        break;

      case EnhancedPricingType.RECURRING:
        const intervals = this.recurringCount || duration;
        totalPrice = this.basePrice * intervals;
        break;

      case EnhancedPricingType.USAGE_BASED:
        if (this.pricingTiers && this.pricingTiers.length > 0) {
          // Use tiered pricing
          totalPrice = this.calculateTieredPrice(quantity);
        } else {
          // Simple usage-based pricing
          totalPrice = this.basePrice * quantity;
        }
        break;

      default:
        // Fallback to legacy calculation for backward compatibility
        totalPrice = this.calculateLegacyPrice(duration, quantity);
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

  private calculateLegacyPrice(duration: number, capacity: number): number {
    let price = this.basePrice;

    if (this.packageType === PackageType.HOURLY && this.durationHours) {
      price = (this.basePrice / this.durationHours) * duration;
    }

    // Add capacity-based pricing if needed
    if (this.maxCapacity && capacity > this.maxCapacity * 0.8) {
      price *= 1.2; // 20% premium for high capacity usage
    }

    return price;
  }

  isAvailableForCapacity(capacity: number): boolean {
    if (this.minCapacity && capacity < this.minCapacity) return false;
    if (this.maxCapacity && capacity > this.maxCapacity) return false;
    return true;
  }

  canBookInAdvance(hoursInAdvance: number): boolean {
    if (!this.advanceBookingHours) return true;
    return hoursInAdvance >= this.advanceBookingHours;
  }

  isValidUsageQuantity(quantity: number): boolean {
    if (this.pricingType !== EnhancedPricingType.USAGE_BASED) return true;

    if (this.minUsage && quantity < this.minUsage) return false;
    if (this.maxUsage && quantity > this.maxUsage) return false;

    if (this.usageIncrement && this.minUsage) {
      const adjustedQuantity = quantity - this.minUsage;
      return adjustedQuantity % this.usageIncrement === 0;
    }

    return true;
  }

  getEffectivePriceForUsage(quantity: number): number {
    if (!this.isValidUsageQuantity(quantity)) {
      throw new Error('Invalid usage quantity for this package');
    }

    return this.calculatePrice(quantity, 1);
  }

  validatePricingSchema(): boolean {
    // Validate base pricing requirements
    if (!this.basePrice || this.basePrice <= 0) {
      throw new Error('Base price must be greater than 0');
    }

    if (!this.currency) {
      throw new Error('Currency is required');
    }

    // Validate pricing type specific requirements
    switch (this.pricingType) {
      case EnhancedPricingType.RECURRING:
        if (!this.recurringInterval) {
          throw new Error(
            'Recurring interval is required for recurring pricing',
          );
        }
        break;

      case EnhancedPricingType.USAGE_BASED:
        if (!this.usageUnit) {
          throw new Error('Usage unit is required for usage-based pricing');
        }
        if (this.minUsage && this.maxUsage && this.minUsage > this.maxUsage) {
          throw new Error('Minimum usage cannot be greater than maximum usage');
        }
        break;

      case EnhancedPricingType.TIERED:
        if (!this.pricingTiers || this.pricingTiers.length === 0) {
          throw new Error('Pricing tiers are required for tiered pricing');
        }
        // Validate tier structure
        for (const tier of this.pricingTiers) {
          if (tier.minQuantity < 0 || tier.pricePerUnit <= 0) {
            throw new Error('Invalid pricing tier configuration');
          }
        }
        break;
    }

    return true;
  }
}

// Space Extras Entity (renamed from Space Add-On)
@Entity('space_extras')
@Index(['spaceId', 'extrasType'])
@Index(['isActive', 'priority'])
@Index(['createdAt'])
export class SpaceExtrasEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'space_id' })
  spaceId: string;

  @Column({ length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({
    type: 'enum',
    enum: ExtrasType,
    name: 'extras_type',
  })
  extrasType: ExtrasType;

  @Column({ length: 100, nullable: true })
  category: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'price_per_unit' })
  pricePerUnit: number;

  @Column({ length: 3, default: 'INR' })
  currency: string;

  @Column({ length: 50, nullable: true })
  unit: string;

  @Column({ type: 'int', nullable: true, name: 'min_quantity' })
  minQuantity: number;

  @Column({ type: 'int', nullable: true, name: 'max_quantity' })
  maxQuantity: number;

  @Column({ type: 'int', nullable: true, name: 'available_quantity' })
  availableQuantity: number;

  @Column({ type: 'int', nullable: true, name: 'setup_time_minutes' })
  setupTimeMinutes: number;

  @Column({ type: 'int', nullable: true, name: 'advance_booking_hours' })
  advanceBookingHours: number;

  @Column({ type: 'boolean', default: true, name: 'is_active' })
  isActive: boolean;

  @Column({ type: 'int', default: 0 })
  priority: number;

  @Column({ type: 'json', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Column({ nullable: true, name: 'created_by' })
  createdBy: string;

  @Column({ nullable: true, name: 'updated_by' })
  updatedBy: string;

  // Relations
  @ManyToOne('SpaceEntity', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'space_id' })
  space: any; // SpaceEntity - using any to avoid circular dependency

  @ManyToOne(() => UserEntity, { nullable: true })
  @JoinColumn({ name: 'created_by' })
  creator: UserEntity;

  @ManyToOne(() => UserEntity, { nullable: true })
  @JoinColumn({ name: 'updated_by' })
  updater: UserEntity;

  // Hooks
  @BeforeInsert()
  @BeforeUpdate()
  validateData() {
    if (
      this.minQuantity &&
      this.maxQuantity &&
      this.minQuantity > this.maxQuantity
    ) {
      throw new Error(
        'Minimum quantity cannot be greater than maximum quantity',
      );
    }
    if (this.pricePerUnit < 0) {
      throw new Error('Price per unit cannot be negative');
    }
    if (this.availableQuantity && this.availableQuantity < 0) {
      throw new Error('Available quantity cannot be negative');
    }
  }

  // Helper methods
  calculateTotalPrice(quantity: number): number {
    return Math.round(this.pricePerUnit * quantity * 100) / 100;
  }

  isQuantityAvailable(requestedQuantity: number): boolean {
    if (this.minQuantity && requestedQuantity < this.minQuantity) return false;
    if (this.maxQuantity && requestedQuantity > this.maxQuantity) return false;
    if (this.availableQuantity && requestedQuantity > this.availableQuantity)
      return false;
    return true;
  }

  reduceAvailableQuantity(quantity: number): void {
    if (this.availableQuantity) {
      this.availableQuantity = Math.max(0, this.availableQuantity - quantity);
    }
  }

  restoreAvailableQuantity(quantity: number): void {
    if (
      this.availableQuantity !== null &&
      this.availableQuantity !== undefined
    ) {
      this.availableQuantity += quantity;
    }
  }
}

// Space Inventory Entity (keeping existing structure)
@Entity('space_inventory')
@Index(['spaceId', 'status'])
@Index(['utilizationRate'])
@Index(['isLowStock'])
@Index(['updatedAt'])
export class SpaceInventoryEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'space_id', unique: true })
  spaceId: string;

  @Column({
    type: 'enum',
    enum: InventoryStatus,
    default: InventoryStatus.AVAILABLE,
  })
  status: InventoryStatus;

  @Column({ type: 'int', name: 'total_capacity' })
  totalCapacity: number;

  @Column({ type: 'int', name: 'available_capacity' })
  availableCapacity: number;

  @Column({ type: 'int', default: 0, name: 'reserved_capacity' })
  reservedCapacity: number;

  @Column({ type: 'int', default: 0, name: 'occupied_capacity' })
  occupiedCapacity: number;

  @Column({
    type: 'decimal',
    precision: 5,
    scale: 2,
    default: 0,
    name: 'utilization_rate',
  })
  utilizationRate: number;

  @Column({ type: 'boolean', default: false, name: 'is_low_stock' })
  isLowStock: boolean;

  @Column({ type: 'int', nullable: true, name: 'low_stock_threshold' })
  lowStockThreshold: number;

  @Column({ type: 'text', nullable: true, name: 'maintenance_notes' })
  maintenanceNotes: string;

  @Column({ type: 'timestamp', nullable: true, name: 'last_maintenance_date' })
  lastMaintenanceDate: Date;

  @Column({ type: 'timestamp', nullable: true, name: 'next_maintenance_date' })
  nextMaintenanceDate: Date;

  @Column({ type: 'json', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Column({ nullable: true, name: 'updated_by' })
  updatedBy: string;

  // Relations
  @ManyToOne('SpaceEntity', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'space_id' })
  space: any; // SpaceEntity - using any to avoid circular dependency

  @ManyToOne(() => UserEntity, { nullable: true })
  @JoinColumn({ name: 'updated_by' })
  updater: UserEntity;

  // Hooks
  @BeforeInsert()
  @BeforeUpdate()
  calculateUtilizationAndStock() {
    // Calculate utilization rate
    if (this.totalCapacity > 0) {
      this.utilizationRate =
        Math.round(
          ((this.totalCapacity - this.availableCapacity) / this.totalCapacity) *
            100 *
            100,
        ) / 100;
    }

    // Check low stock
    if (this.lowStockThreshold) {
      this.isLowStock = this.availableCapacity <= this.lowStockThreshold;
    }

    // Validate capacity constraints
    if (this.availableCapacity < 0) {
      throw new Error('Available capacity cannot be negative');
    }
    if (this.reservedCapacity < 0) {
      throw new Error('Reserved capacity cannot be negative');
    }
    if (this.occupiedCapacity < 0) {
      throw new Error('Occupied capacity cannot be negative');
    }
    if (
      this.availableCapacity + this.reservedCapacity + this.occupiedCapacity >
      this.totalCapacity
    ) {
      throw new Error('Total allocated capacity exceeds total capacity');
    }
  }

  // Helper methods
  reserveCapacity(capacity: number): boolean {
    if (this.availableCapacity >= capacity) {
      this.availableCapacity -= capacity;
      this.reservedCapacity += capacity;
      return true;
    }
    return false;
  }

  releaseReservedCapacity(capacity: number): void {
    const releaseAmount = Math.min(capacity, this.reservedCapacity);
    this.reservedCapacity -= releaseAmount;
    this.availableCapacity += releaseAmount;
  }

  occupyReservedCapacity(capacity: number): boolean {
    if (this.reservedCapacity >= capacity) {
      this.reservedCapacity -= capacity;
      this.occupiedCapacity += capacity;
      return true;
    }
    return false;
  }

  releaseOccupiedCapacity(capacity: number): void {
    const releaseAmount = Math.min(capacity, this.occupiedCapacity);
    this.occupiedCapacity -= releaseAmount;
    this.availableCapacity += releaseAmount;
  }

  getUtilizationPercentage(): number {
    return this.utilizationRate;
  }

  isFullyUtilized(): boolean {
    return this.availableCapacity === 0;
  }

  needsMaintenance(): boolean {
    if (!this.nextMaintenanceDate) return false;
    return new Date() >= this.nextMaintenanceDate;
  }

  updateMaintenanceSchedule(nextDate: Date, notes?: string): void {
    this.lastMaintenanceDate = new Date();
    this.nextMaintenanceDate = nextDate;
    if (notes) {
      this.maintenanceNotes = notes;
    }
  }
}
