import { UserEntity } from '@/auth/entities/user.entity';
import { BookingEntity } from '@/database/entities/booking.entity';
import {
  AfterLoad,
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
import { SpacePackageEntity } from '../../space/entities/space-inventory.entity';
import {
  DiscountType,
  ExportFormat,
  ExportStatus,
  ExtrasType,
  InventoryStatus,
  PackageType,
  PricingType,
  ReportType,
} from '../dto/space-inventory.dto';

// SpacePackageEntity moved to space module to avoid conflicts
// Use: import { SpacePackageEntity } from '../../space/entities/space-inventory.entity';

// @Entity('space_packages')
// @Index(['type', 'location'])
// @Index(['isActive', 'createdAt'])
// @Index(['location', 'floor'])
// export class SpacePackageEntity {
//   @PrimaryGeneratedColumn('uuid')
//   id: string;
//
//   @Column({ name: 'space_option_id' })
//   @Index()
//   spaceOptionId: string;
//
//   @Column({ length: 100 })
//   @Index()
//   name: string;
//
//   @Column({ type: 'text' })
//   description: string;
//
//   @Column({
//     type: 'enum',
//     enum: PackageType,
//   })
//   @Index()
//   type: PackageType;
//
//   @Column({ type: 'decimal', precision: 10, scale: 2 })
//   basePrice: number;
//
//   @Column({
//     type: 'enum',
//     enum: PricingType,
//   })
//   pricingType: PricingType;
//
//   @Column({ type: 'int' })
//   capacity: number;
//
//   @Column({ type: 'decimal', precision: 10, scale: 2 })
//   area: number;
//
//   @Column({ length: 100 })
//   @Index()
//   location: string;
//
//   @Column({ length: 10 })
//   floor: string;
//
//   @Column({ length: 20, nullable: true })
//   roomNumber?: string;
//
//   @Column({ type: 'json', nullable: true })
//   features?: string[];
//
//   @Column({ type: 'json', nullable: true })
//   amenities?: string[];
//
//   @Column({ type: 'json', nullable: true })
//   images?: string[];
//
//   @Column({ type: 'int', nullable: true })
//   minBookingDuration?: number;
//
//   @Column({ type: 'int', nullable: true })
//   maxBookingDuration?: number;
//
//   @Column({ type: 'int', nullable: true, default: 0 })
//   advanceBookingRequired?: number;
//
//   @Column({ type: 'text', nullable: true })
//   cancellationPolicy?: string;
//
//   @Column({ type: 'text', nullable: true })
//   termsAndConditions?: string;
//
//   @Column({ type: 'json', nullable: true })
//   metadata?: Record<string, any>;
//
//   @Column({ type: 'boolean', default: true })
//   @Index()
//   isActive: boolean;
//
//   @CreateDateColumn()
//   @Index()
//   createdAt: Date;
//
//   @UpdateDateColumn()
//   updatedAt: Date;
//
//   @Column({ type: 'uuid', nullable: true })
//   createdBy?: string;
//
//   @Column({ type: 'uuid', nullable: true })
//   updatedBy?: string;
//
//   // Relations
//   @ManyToOne('SpaceOptionEntity', 'packages', {
//     onDelete: 'CASCADE',
//   })
//   @JoinColumn({ name: 'space_option_id' })
//   spaceOption: any;
//
//   @ManyToOne(() => UserEntity, { nullable: true })
//   @JoinColumn({ name: 'created_by' })
//   creator?: UserEntity;
//
//   @ManyToOne(() => UserEntity, { nullable: true })
//   @JoinColumn({ name: 'updatedBy' })
//   updater?: UserEntity;
//
//   @OneToMany(() => InventoryEntity, (inventory) => inventory.spacePackage)
//   inventory: InventoryEntity[];
//
//   @OneToMany(() => PricingRuleEntity, (rule) => rule.spacePackage)
//   pricingRules: PricingRuleEntity[];
//
//   @OneToMany(() => BookingEntity, (booking) => booking.spaceOption)
//   bookings: BookingEntity[];
//
//   // Computed properties
//   currentPrice?: number;
//   availableQuantity?: number;
//   totalBookings?: number;
//   averageRating?: number;
//
//   @BeforeInsert()
//   @BeforeUpdate()
//   validateData() {
//     if (this.minBookingDuration && this.maxBookingDuration) {
//       if (this.minBookingDuration > this.maxBookingDuration) {
//         throw new Error(
//           'Minimum booking duration cannot be greater than maximum',
//         );
//       }
//     }
//
//     if (this.basePrice < 0) {
//       throw new Error('Base price cannot be negative');
//     }
//
//     if (this.capacity <= 0) {
//       throw new Error('Capacity must be greater than zero');
//     }
//
//     if (this.area <= 0) {
//       throw new Error('Area must be greater than zero');
//     }
//   }
//
//   @AfterLoad()
//   computeProperties() {
//     // These would be computed based on related data
//     // Implementation would depend on business logic
//   }
//
//   // Helper methods
//   isAvailable(): boolean {
//     return this.isActive;
//   }
//
//   getDisplayName(): string {
//     return `${this.name} (${this.location} - ${this.floor})`;
//   }
//
//   calculatePrice(duration: number, quantity: number = 1): number {
//     let price = this.basePrice;
//
//     switch (this.pricingType) {
//       case PricingType.HOURLY:
//         price = this.basePrice * duration;
//         break;
//       case PricingType.DAILY:
//         price = this.basePrice * Math.ceil(duration / 24);
//         break;
//       case PricingType.WEEKLY:
//         price = this.basePrice * Math.ceil(duration / (24 * 7));
//         break;
//       case PricingType.MONTHLY:
//         price = this.basePrice * Math.ceil(duration / (24 * 30));
//         break;
//       case PricingType.YEARLY:
//         price = this.basePrice * Math.ceil(duration / (24 * 365));
//         break;
//       default:
//         price = this.basePrice;
//     }
//
//     return price * quantity;
//   }
// }

@Entity('extras')
@Index(['type', 'isActive'])
@Index(['category', 'isActive'])
export class ExtrasEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100 })
  @Index()
  name: string;

  @Column({ type: 'text' })
  description: string;

  @Column({
    type: 'enum',
    enum: ExtrasType,
  })
  @Index()
  type: ExtrasType;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @Column({
    type: 'enum',
    enum: PricingType,
  })
  pricingType: PricingType;

  @Column({ type: 'int', nullable: true })
  quantity?: number;

  @Column({ length: 50, nullable: true })
  @Index()
  category?: string;

  @Column({ type: 'json', nullable: true })
  tags?: string[];

  @Column({ type: 'json', nullable: true })
  images?: string[];

  @Column({ type: 'json', nullable: true })
  metadata?: Record<string, any>;

  @Column({ type: 'boolean', default: true })
  @Index()
  isActive: boolean;

  @CreateDateColumn()
  @Index()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'uuid', nullable: true })
  createdBy?: string;

  @Column({ type: 'uuid', nullable: true })
  updatedBy?: string;

  // Relations
  @ManyToOne(() => UserEntity, { nullable: true })
  @JoinColumn({ name: 'createdBy' })
  creator?: UserEntity;

  @ManyToOne(() => UserEntity, { nullable: true })
  @JoinColumn({ name: 'updatedBy' })
  updater?: UserEntity;

  @OneToMany(() => PricingRuleEntity, (rule) => rule.extras)
  pricingRules: PricingRuleEntity[];

  @BeforeInsert()
  @BeforeUpdate()
  validateData() {
    if (this.price < 0) {
      throw new Error('Price cannot be negative');
    }

    if (
      this.quantity !== null &&
      this.quantity !== undefined &&
      this.quantity < 0
    ) {
      throw new Error('Quantity cannot be negative');
    }
  }

  // Helper methods
  isAvailable(): boolean {
    return (
      this.isActive &&
      (this.quantity === null ||
        this.quantity === undefined ||
        this.quantity > 0)
    );
  }

  calculatePrice(duration: number, quantity: number = 1): number {
    let price = this.price;

    switch (this.pricingType) {
      case PricingType.HOURLY:
        price = this.price * duration;
        break;
      case PricingType.DAILY:
        price = this.price * Math.ceil(duration / 24);
        break;
      case PricingType.WEEKLY:
        price = this.price * Math.ceil(duration / (24 * 7));
        break;
      case PricingType.MONTHLY:
        price = this.price * Math.ceil(duration / (24 * 30));
        break;
      case PricingType.YEARLY:
        price = this.price * Math.ceil(duration / (24 * 365));
        break;
      default:
        price = this.price;
    }

    return price * quantity;
  }
}

@Entity('inventory')
@Index(['spacePackageId', 'status'])
@Index(['status', 'createdAt'])
@Index(['lowStockThreshold', 'availableQuantity'])
export class InventoryEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @Index()
  spacePackageId: string;

  @Column({ type: 'int' })
  totalQuantity: number;

  @Column({ type: 'int' })
  availableQuantity: number;

  @Column({ type: 'int', default: 0 })
  reservedQuantity: number;

  @Column({
    type: 'enum',
    enum: InventoryStatus,
    default: InventoryStatus.AVAILABLE,
  })
  @Index()
  status: InventoryStatus;

  @Column({ type: 'int', nullable: true })
  lowStockThreshold?: number;

  @Column({ type: 'int', nullable: true })
  reorderPoint?: number;

  @Column({ type: 'int', nullable: true })
  maxStockLevel?: number;

  @Column({ type: 'text', nullable: true })
  locationDetails?: string;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Column({ type: 'json', nullable: true })
  metadata?: Record<string, any>;

  @Column({ type: 'timestamp', nullable: true })
  scheduledFor?: Date;

  @Column({ type: 'text', nullable: true })
  downloadUrl?: string;

  @CreateDateColumn()
  @Index()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'uuid', nullable: true })
  createdBy?: string;

  @Column({ type: 'uuid', nullable: true })
  updatedBy?: string;

  // Relations
  @ManyToOne(() => SpacePackageEntity, (spacePackage) => spacePackage.inventory)
  @JoinColumn({ name: 'spacePackageId' })
  spacePackage: SpacePackageEntity;

  @ManyToOne(() => UserEntity, { nullable: true })
  @JoinColumn({ name: 'createdBy' })
  creator?: UserEntity;

  @ManyToOne(() => UserEntity, { nullable: true })
  @JoinColumn({ name: 'updatedBy' })
  updater?: UserEntity;

  @OneToMany(() => InventoryAuditTrailEntity, (audit) => audit.inventory)
  auditTrail: InventoryAuditTrailEntity[];

  // Computed properties
  isLowStock?: boolean;
  utilizationRate?: number;

  @BeforeInsert()
  @BeforeUpdate()
  validateData() {
    if (this.totalQuantity < 0) {
      throw new Error('Total quantity cannot be negative');
    }

    if (this.availableQuantity < 0) {
      throw new Error('Available quantity cannot be negative');
    }

    if (this.reservedQuantity < 0) {
      throw new Error('Reserved quantity cannot be negative');
    }

    if (this.availableQuantity + this.reservedQuantity > this.totalQuantity) {
      throw new Error(
        'Available + Reserved quantity cannot exceed total quantity',
      );
    }

    if (this.lowStockThreshold && this.lowStockThreshold < 0) {
      throw new Error('Low stock threshold cannot be negative');
    }

    if (this.reorderPoint && this.reorderPoint < 0) {
      throw new Error('Reorder point cannot be negative');
    }

    if (this.maxStockLevel && this.maxStockLevel < 0) {
      throw new Error('Max stock level cannot be negative');
    }
  }

  @AfterLoad()
  computeProperties() {
    this.isLowStock = this.lowStockThreshold
      ? this.availableQuantity <= this.lowStockThreshold
      : false;
    this.utilizationRate =
      this.totalQuantity > 0
        ? ((this.totalQuantity - this.availableQuantity) / this.totalQuantity) *
          100
        : 0;
  }

  // Helper methods
  canReserve(quantity: number): boolean {
    return (
      this.availableQuantity >= quantity &&
      this.status === InventoryStatus.AVAILABLE
    );
  }

  reserve(quantity: number): void {
    if (!this.canReserve(quantity)) {
      throw new Error('Insufficient available quantity for reservation');
    }
    this.availableQuantity -= quantity;
    this.reservedQuantity += quantity;
  }

  release(quantity: number): void {
    if (this.reservedQuantity < quantity) {
      throw new Error('Cannot release more than reserved quantity');
    }
    this.reservedQuantity -= quantity;
    this.availableQuantity += quantity;
  }

  adjustStock(quantity: number): void {
    const newTotal = this.totalQuantity + quantity;
    if (newTotal < 0) {
      throw new Error(
        'Stock adjustment would result in negative total quantity',
      );
    }

    this.totalQuantity = newTotal;
    if (quantity > 0) {
      this.availableQuantity += quantity;
    } else {
      // Reduce from available first, then reserved if necessary
      const reduction = Math.abs(quantity);
      if (this.availableQuantity >= reduction) {
        this.availableQuantity -= reduction;
      } else {
        const remainingReduction = reduction - this.availableQuantity;
        this.availableQuantity = 0;
        this.reservedQuantity = Math.max(
          0,
          this.reservedQuantity - remainingReduction,
        );
      }
    }
  }

  needsReorder(): boolean {
    return this.reorderPoint
      ? this.availableQuantity <= this.reorderPoint
      : false;
  }
}

@Entity('pricing_rules')
@Index(['spacePackageId', 'isActive'])
@Index(['extrasId', 'isActive'])
@Index(['validFrom', 'validUntil'])
export class PricingRuleEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100 })
  name: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'uuid', nullable: true })
  spacePackageId?: string;

  @Column({ type: 'uuid', nullable: true })
  extrasId?: string;

  @Column({
    type: 'enum',
    enum: DiscountType,
  })
  discountType: DiscountType;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  discountValue: number;

  @Column({ type: 'int', nullable: true })
  minQuantity?: number;

  @Column({ type: 'int', nullable: true })
  maxQuantity?: number;

  @Column({ type: 'int', nullable: true })
  minDuration?: number;

  @Column({ type: 'timestamp', nullable: true })
  validFrom?: Date;

  @Column({ type: 'timestamp', nullable: true })
  validUntil?: Date;

  @Column({ type: 'json', nullable: true })
  conditions?: Record<string, any>;

  @Column({ type: 'boolean', default: true })
  @Index()
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'uuid', nullable: true })
  createdBy?: string;

  @Column({ type: 'uuid', nullable: true })
  updatedBy?: string;

  // Relations
  @ManyToOne(
    () => SpacePackageEntity,
    (spacePackage) => spacePackage.pricingRules,
    { nullable: true },
  )
  @JoinColumn({ name: 'spacePackageId' })
  spacePackage?: SpacePackageEntity;

  @ManyToOne(() => ExtrasEntity, (extras) => extras.pricingRules, {
    nullable: true,
  })
  @JoinColumn({ name: 'extrasId' })
  extras?: ExtrasEntity;

  @ManyToOne(() => UserEntity, { nullable: true })
  @JoinColumn({ name: 'createdBy' })
  creator?: UserEntity;

  @ManyToOne(() => UserEntity, { nullable: true })
  @JoinColumn({ name: 'updatedBy' })
  updater?: UserEntity;

  @BeforeInsert()
  @BeforeUpdate()
  validateData() {
    if (this.discountValue < 0) {
      throw new Error('Discount value cannot be negative');
    }

    if (
      this.discountType === DiscountType.PERCENTAGE &&
      this.discountValue > 100
    ) {
      throw new Error('Percentage discount cannot exceed 100%');
    }

    if (
      this.minQuantity &&
      this.maxQuantity &&
      this.minQuantity > this.maxQuantity
    ) {
      throw new Error(
        'Minimum quantity cannot be greater than maximum quantity',
      );
    }

    if (this.validFrom && this.validUntil && this.validFrom > this.validUntil) {
      throw new Error('Valid from date cannot be after valid until date');
    }

    if (!this.spacePackageId && !this.extrasId) {
      throw new Error(
        'Pricing rule must be associated with either a space package or extras',
      );
    }
  }

  // Helper methods
  isValidForDate(date: Date): boolean {
    const now = date || new Date();

    if (this.validFrom && now < this.validFrom) {
      return false;
    }

    if (this.validUntil && now > this.validUntil) {
      return false;
    }

    return this.isActive;
  }

  isApplicable(quantity: number, duration?: number): boolean {
    if (!this.isActive) {
      return false;
    }

    if (this.minQuantity && quantity < this.minQuantity) {
      return false;
    }

    if (this.maxQuantity && quantity > this.maxQuantity) {
      return false;
    }

    if (this.minDuration && duration && duration < this.minDuration) {
      return false;
    }

    return this.isValidForDate(new Date());
  }

  calculateDiscount(basePrice: number, quantity: number): number {
    if (!this.isApplicable(quantity)) {
      return 0;
    }

    switch (this.discountType) {
      case DiscountType.PERCENTAGE:
        return (basePrice * this.discountValue) / 100;
      case DiscountType.FIXED_AMOUNT:
        return this.discountValue;
      case DiscountType.BUY_X_GET_Y:
        // Implementation would depend on specific business logic
        return 0;
      default:
        return 0;
    }
  }
}

@Entity('inventory_audit_trail')
@Index(['inventoryId', 'createdAt'])
@Index(['action', 'createdAt'])
export class InventoryAuditTrailEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  inventoryId: string;

  @Column({ length: 50 })
  @Index()
  action: string;

  @Column({ type: 'json', nullable: true })
  oldValues?: Record<string, any>;

  @Column({ type: 'json', nullable: true })
  newValues?: Record<string, any>;

  @Column({ type: 'text', nullable: true })
  reason?: string;

  @Column({ type: 'json', nullable: true })
  metadata?: Record<string, any>;

  @CreateDateColumn()
  @Index()
  createdAt: Date;

  @Column({ type: 'uuid', nullable: true })
  createdBy?: string;

  // Relations
  @ManyToOne(() => InventoryEntity, (inventory) => inventory.auditTrail)
  @JoinColumn({ name: 'inventoryId' })
  inventory: InventoryEntity;

  @ManyToOne(() => UserEntity, { nullable: true })
  @JoinColumn({ name: 'createdBy' })
  creator?: UserEntity;

  // Static helper method
  static createAuditEntry(
    inventoryId: string,
    action: string,
    reason?: string,
    oldValues?: Record<string, any>,
    newValues?: Record<string, any>,
    createdBy?: string,
    metadata?: Record<string, any>,
  ): InventoryAuditTrailEntity {
    const auditEntry = new InventoryAuditTrailEntity();
    auditEntry.inventoryId = inventoryId;
    auditEntry.action = action;
    auditEntry.reason = reason;
    auditEntry.oldValues = oldValues;
    auditEntry.newValues = newValues;
    auditEntry.createdBy = createdBy;
    auditEntry.metadata = metadata;
    return auditEntry;
  }
}

@Entity('inventory_exports')
@Index(['status', 'createdAt'])
@Index(['format', 'createdAt'])
export class InventoryExportEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: ExportFormat,
  })
  format: ExportFormat;

  @Column({
    type: 'enum',
    enum: ExportStatus,
    default: ExportStatus.PENDING,
  })
  @Index()
  status: ExportStatus;

  @Column({ type: 'json', nullable: true })
  filters?: Record<string, any>;

  @Column({ type: 'json', nullable: true })
  fields?: string[];

  @Column({ type: 'boolean', default: false })
  includeRelated: boolean;

  @Column({ type: 'text', nullable: true })
  downloadUrl?: string;

  @Column({ type: 'bigint', nullable: true })
  fileSize?: number;

  @Column({ type: 'int', nullable: true })
  recordCount?: number;

  @Column({ type: 'timestamp', nullable: true })
  completedAt?: Date;

  @Column({ type: 'timestamp', nullable: true })
  expiresAt?: Date;

  @Column({ type: 'text', nullable: true })
  errorMessage?: string;

  @CreateDateColumn()
  @Index()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'uuid', nullable: true })
  createdBy?: string;

  // Relations
  @ManyToOne(() => UserEntity, { nullable: true })
  @JoinColumn({ name: 'createdBy' })
  creator?: UserEntity;

  @BeforeInsert()
  setExpiryDate() {
    // Set expiry to 7 days from creation
    this.expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  }

  // Helper methods
  isExpired(): boolean {
    return this.expiresAt ? new Date() > this.expiresAt : false;
  }

  canDownload(): boolean {
    return (
      this.status === ExportStatus.COMPLETED &&
      !this.isExpired() &&
      !!this.downloadUrl
    );
  }

  markAsCompleted(
    filePath: string,
    downloadUrl: string,
    recordCount: number,
  ): void {
    this.status = ExportStatus.COMPLETED;
    this.downloadUrl = downloadUrl;
    this.recordCount = recordCount;
    this.completedAt = new Date();
  }

  markAsFailed(errorMessage: string): void {
    this.status = ExportStatus.FAILED;
    this.errorMessage = errorMessage;
    this.completedAt = new Date();
  }
}

@Entity('inventory_reports')
@Index(['reportType', 'createdAt'])
@Index(['period', 'createdAt'])
export class InventoryReportEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'enum', enum: ReportType })
  @Index()
  reportType: ReportType;

  @Column({ length: 100 })
  title: string;

  @Column({ type: 'enum', enum: ExportFormat, default: ExportFormat.CSV })
  format: ExportFormat;

  @Column({ type: 'enum', enum: ExportStatus, default: ExportStatus.PENDING })
  status: ExportStatus;

  @Column({ type: 'timestamp', nullable: true })
  scheduledFor?: Date;

  @Column({ type: 'text', nullable: true })
  downloadUrl?: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ length: 50 })
  @Index()
  period: string;

  @Column({ type: 'timestamp' })
  startDate: Date;

  @Column({ type: 'timestamp' })
  endDate: Date;

  @Column({ type: 'date', nullable: true })
  dateFrom: Date;

  @Column({ type: 'date', nullable: true })
  dateTo: Date;

  @Column({ type: 'json', nullable: true })
  parameters?: Record<string, any>;

  @Column({ type: 'text', nullable: true })
  filePath?: string;

  @Column({ type: 'json' })
  data: Record<string, any>;

  @Column({ type: 'json', nullable: true })
  filters?: Record<string, any>;

  @Column({ type: 'json', nullable: true })
  metadata?: Record<string, any>;

  @CreateDateColumn()
  @Index()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  completedAt?: Date;

  @Column({ type: 'uuid', nullable: true })
  createdBy?: string;

  // Relations
  @ManyToOne(() => UserEntity, { nullable: true })
  @JoinColumn({ name: 'createdBy' })
  creator?: UserEntity;

  // Helper methods
  isDue(): boolean {
    if (!this.scheduledFor) {
      return true; // If no schedule, process immediately
    }
    return new Date() >= this.scheduledFor;
  }

  markAsCompleted(filePath: string, downloadUrl: string): void {
    // For reports, we can store the file path in metadata
    this.status = ExportStatus.COMPLETED;
    this.downloadUrl = downloadUrl;
    this.metadata = {
      ...this.metadata,
      filePath,
      downloadUrl,
      completedAt: new Date().toISOString(),
    };
  }

  markAsFailed(errorMessage: string): void {
    this.status = ExportStatus.FAILED;
    this.metadata = {
      ...this.metadata,
      error: errorMessage,
      failedAt: new Date().toISOString(),
    };
  }
}

@Entity('inventory_settings')
export class InventorySettingsEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'int', nullable: true })
  defaultLowStockThreshold?: number;

  @Column({ type: 'boolean', default: false })
  autoReorderEnabled: boolean;

  @Column({ type: 'int', nullable: true })
  defaultReorderQuantity?: number;

  @Column({ type: 'json', nullable: true })
  notificationSettings?: Record<string, any>;

  @Column({ type: 'json', nullable: true })
  pricingSettings?: Record<string, any>;

  @Column({ type: 'json', nullable: true })
  bookingSettings?: Record<string, any>;

  @Column({ type: 'json', nullable: true })
  integrationSettings?: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'uuid', nullable: true })
  updatedBy?: string;

  // Relations
  @ManyToOne(() => UserEntity, { nullable: true })
  @JoinColumn({ name: 'updatedBy' })
  updater?: UserEntity;
}
