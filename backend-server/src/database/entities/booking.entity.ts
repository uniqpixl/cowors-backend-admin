import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
} from 'typeorm';
import { BaseModel } from '../models/base.model';
import { BookingItemEntity } from './booking-item.entity';
import { CouponEntity } from './coupon.entity';

import { UserEntity } from '../../auth/entities/user.entity';
import { BookingStatus } from '../../common/enums/booking.enum';
import { EntityType } from '../../utils/id-generator.service';
import { SpaceOptionEntity } from './space-option.entity';

@Entity('booking')
export class BookingEntity extends BaseModel {
  @Index({ where: '"deletedAt" IS NULL' })
  @Column()
  userId: string;

  @ManyToOne(() => UserEntity, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'userId' })
  user: UserEntity;

  @Index({ where: '"deletedAt" IS NULL' })
  @Column()
  spaceOptionId: string;

  @ManyToOne(() => SpaceOptionEntity, (spaceOption) => spaceOption.bookings, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'spaceOptionId' })
  spaceOption: SpaceOptionEntity;

  @Column({ length: 20, unique: true })
  bookingNumber: string;

  @Column({ length: 50, unique: true })
  bookingReference: string;

  @Index()
  @Column({ type: 'timestamp' })
  startDateTime: Date;

  @Index()
  @Column({ type: 'timestamp' })
  endDateTime: Date;

  @Column({ type: 'int' })
  duration: number; // in minutes

  @Column({ type: 'int', default: 1 })
  guestCount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  baseAmount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  extrasAmount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  discountAmount: number;

  @Column({ type: 'varchar', length: 50, nullable: true })
  couponCode: string;

  @Column({ type: 'uuid', nullable: true })
  couponId: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  taxAmount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  totalAmount: number;

  @Column({ length: 3, default: 'INR' })
  currency: string;

  @Column({
    type: 'enum',
    enum: () => BookingStatus,
    default: BookingStatus.PENDING,
  })
  status: BookingStatus;

  @Column('text', { nullable: true })
  specialRequests: string;

  @Column('text', { nullable: true })
  cancellationReason: string;

  @Column({ type: 'timestamp', nullable: true })
  cancelledAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  confirmedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  checkedInAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  checkedOutAt: Date;

  @Column('jsonb', { nullable: true })
  contactInfo: {
    name: string;
    email: string;
    phone: string;
  };

  @Column('jsonb', { nullable: true })
  pricing: {
    pricePerHour?: number;
    pricePerDay?: number;
    appliedDiscounts?: {
      type: string;
      amount: number;
      percentage?: number;
    }[];
    breakdown: {
      base: number;
      extras: number;
      taxes: number;
      discounts: number;
      total: number;
    };
  };

  @Column('jsonb', { nullable: true })
  metadata: {
    source?: string; // web, mobile, partner
    referenceId?: string;
    notes?: string;
    checkInCode?: string;
    qrCode?: string;
    remindersSent?: {
      type: string;
      sentAt: Date;
    }[];
  };

  @OneToMany(() => BookingItemEntity, (item) => item.booking)
  items: BookingItemEntity[];

  @OneToOne('PaymentEntity', 'booking')
  payment: any;

  @ManyToOne(() => CouponEntity, (coupon) => coupon.bookings, {
    nullable: true,
  })
  @JoinColumn({ name: 'couponId' })
  coupon: CouponEntity;

  // Composite indexes for efficient queries
  @Index(['userId', 'status'])
  static userStatusIndex: void;

  @Index(['spaceOptionId', 'startDateTime', 'endDateTime'])
  static spaceTimeIndex: void;

  @Index(['status', 'startDateTime'])
  static statusTimeIndex: void;

  // KYC-related fields
  @Column({
    type: 'enum',
    enum: () => ({
      NOT_REQUIRED: 'not_required',
      PENDING: 'pending',
      IN_PROGRESS: 'in_progress',
      COMPLETED: 'completed',
      FAILED: 'failed',
    }),
    default: 'not_required',
  })
  kycStatus:
    | 'not_required'
    | 'pending'
    | 'in_progress'
    | 'completed'
    | 'failed';

  @Column({ nullable: true })
  kycVerificationId?: string;

  @Column({ nullable: true })
  paymentHoldId?: string;

  @Column({ type: 'timestamp', nullable: true })
  kycRequiredAt?: Date;

  @Column({ type: 'timestamp', nullable: true })
  kycCompletedAt?: Date;

  @Index(['kycStatus', 'createdAt'])
  static kycStatusTimeIndex: void;

  protected getEntityType(): EntityType {
    return EntityType.BOOKING;
  }
}
