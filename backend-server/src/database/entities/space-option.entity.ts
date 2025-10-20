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
import { SpacePackageEntity } from '../../api/space/entities/space-inventory.entity';
import { EntityType } from '../../utils/id-generator.service';
import { BaseModel } from '../models/base.model';
import { SpaceOptionExtrasEntity } from './space-option-extras.entity';
import { SpaceEntity } from './space.entity';

export enum SpaceOptionType {
  MEETING_ROOM = 'meeting_room',
  CONFERENCE_ROOM = 'conference_room',
  PRIVATE_OFFICE = 'private_office',
  HOT_DESK = 'hot_desk',
  DEDICATED_DESK = 'dedicated_desk',
  PHONE_BOOTH = 'phone_booth',
  EVENT_SPACE = 'event_space',
  TRAINING_ROOM = 'training_room',
  STUDIO = 'studio',
  WORKSHOP_SPACE = 'workshop_space',
  LOUNGE = 'lounge',
  KITCHEN = 'kitchen',
  STORAGE = 'storage',
  PARKING_SPOT = 'parking_spot',
  OTHER = 'other',
}

export enum SpaceOptionStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  MAINTENANCE = 'maintenance',
  COMING_SOON = 'coming_soon',
}

@Entity('space_option')
@Index(['spaceId', 'status'])
@Index(['optionType', 'status'])
@Index(['isActive', 'priority'])
@Index(['createdAt'])
export class SpaceOptionEntity extends BaseModel {
  @Column({ name: 'space_id' })
  @Index()
  spaceId: string;

  @Column({ length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({
    type: 'enum',
    enum: SpaceOptionType,
    name: 'option_type',
  })
  optionType: SpaceOptionType;

  @Column({
    type: 'enum',
    enum: SpaceOptionStatus,
    default: SpaceOptionStatus.ACTIVE,
  })
  status: SpaceOptionStatus;

  @Column({ type: 'int', name: 'max_capacity' })
  maxCapacity: number;

  @Column({ type: 'int', name: 'min_capacity', default: 1 })
  minCapacity: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  area: number; // in square meters/feet

  @Column({ length: 10, nullable: true, name: 'area_unit' })
  areaUnit: string; // 'sqm' or 'sqft'

  @Column('jsonb', { nullable: true })
  amenities: string[];

  @Column('jsonb', { nullable: true })
  features: string[];

  @Column('jsonb', { nullable: true })
  equipment: string[];

  @Column('jsonb', { nullable: true })
  location: {
    floor?: string;
    room?: string;
    area?: string;
    building?: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
  };

  @Column('jsonb', { nullable: true })
  images: {
    url: string;
    alt?: string;
    isPrimary?: boolean;
  }[];

  @Column('jsonb', { nullable: true, name: 'availability_rules' })
  availabilityRules: {
    advanceBookingDays?: number;
    minimumNoticeHours?: number;
    maximumBookingDuration?: number; // in hours
    operatingHours?: {
      [key: string]: {
        open: string;
        close: string;
        isAvailable: boolean;
      };
    };
    blackoutDates?: string[];
    recurringUnavailability?: {
      dayOfWeek: number;
      startTime: string;
      endTime: string;
    }[];
  };

  @Column('jsonb', { nullable: true, name: 'cancellation_policy' })
  cancellationPolicy: {
    freeUntilHours: number;
    partialRefundUntilHours: number;
    refundPercentage: number;
    noRefundAfterHours: number;
  };

  @Column({ type: 'boolean', default: true, name: 'is_active' })
  isActive: boolean;

  @Column({ type: 'int', default: 0 })
  priority: number;

  @Column({ type: 'decimal', precision: 3, scale: 2, default: 0 })
  rating: number;

  @Column({ type: 'int', default: 0, name: 'review_count' })
  reviewCount: number;

  @Column({ type: 'int', default: 0, name: 'total_bookings' })
  totalBookings: number;

  @Column('jsonb', { nullable: true })
  metadata: Record<string, any>;

  // Override deletedAt from BaseModel since this table doesn't have soft delete
  @Column({ select: false, insert: false, update: false, nullable: true })
  deletedAt: Date | null = null;

  // Relations
  @ManyToOne(() => SpaceEntity, (space) => space.spaceOptions, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'space_id' })
  space: SpaceEntity;

  @OneToMany(() => SpacePackageEntity, (pkg) => pkg.spaceOption, {
    cascade: true,
  })
  packages: SpacePackageEntity[];

  @OneToMany(() => SpaceOptionExtrasEntity, (extra) => extra.spaceOption)
  extras: SpaceOptionExtrasEntity[];

  @OneToMany('BookingEntity', 'spaceOption')
  bookings: any[];

  // Hooks
  @BeforeInsert()
  @BeforeUpdate()
  validateData() {
    if (this.minCapacity > this.maxCapacity) {
      throw new Error(
        'Minimum capacity cannot be greater than maximum capacity',
      );
    }
    if (this.minCapacity < 1) {
      throw new Error('Minimum capacity must be at least 1');
    }
    if (this.area && this.area < 0) {
      throw new Error('Area cannot be negative');
    }
    if (this.priority < 0) {
      throw new Error('Priority cannot be negative');
    }
  }

  // Helper methods
  isAvailableForCapacity(capacity: number): boolean {
    return capacity >= this.minCapacity && capacity <= this.maxCapacity;
  }

  canBookInAdvance(hoursInAdvance: number): boolean {
    if (!this.availabilityRules?.advanceBookingDays) return true;
    const maxAdvanceHours = this.availabilityRules.advanceBookingDays * 24;
    return hoursInAdvance <= maxAdvanceHours;
  }

  hasMinimumNotice(hoursFromNow: number): boolean {
    if (!this.availabilityRules?.minimumNoticeHours) return true;
    return hoursFromNow >= this.availabilityRules.minimumNoticeHours;
  }

  isWithinOperatingHours(dayOfWeek: string, time: string): boolean {
    if (!this.availabilityRules?.operatingHours) return true;
    const dayRules = this.availabilityRules.operatingHours[dayOfWeek];
    if (!dayRules || !dayRules.isAvailable) return false;
    return time >= dayRules.open && time <= dayRules.close;
  }

  isBlackedOut(date: string): boolean {
    if (!this.availabilityRules?.blackoutDates) return false;
    return this.availabilityRules.blackoutDates.includes(date);
  }

  updateRating(newRating: number): void {
    const totalRating = this.rating * this.reviewCount + newRating;
    this.reviewCount += 1;
    this.rating = Math.round((totalRating / this.reviewCount) * 100) / 100;
  }

  incrementBookingCount(): void {
    this.totalBookings += 1;
  }

  protected getEntityType(): EntityType {
    return EntityType.SPACE;
  }
}
