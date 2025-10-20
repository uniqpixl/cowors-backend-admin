import {
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
import { BookingEntity } from './booking.entity';
import { PartnerEntity } from './partner.entity';

export enum CouponType {
  PERCENTAGE = 'percentage',
  FIXED_AMOUNT = 'fixed_amount',
}

export enum CouponStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  EXPIRED = 'expired',
}

export enum CouponScope {
  GLOBAL = 'global',
  PARTNER_SPECIFIC = 'partner_specific',
  FIRST_TIME_USER = 'first_time_user',
}

@Entity('coupons')
@Index(['code'], { unique: true })
@Index(['partnerId'])
@Index(['status'])
@Index(['validFrom', 'validTo'])
export class CouponEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 50, unique: true })
  code: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({
    type: 'enum',
    enum: CouponType,
    default: CouponType.PERCENTAGE,
  })
  type: CouponType;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  value: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  minOrderValue: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  maxDiscountAmount: number;

  @Column({ type: 'int', nullable: true })
  usageLimit: number;

  @Column({ type: 'int', default: 0 })
  usageCount: number;

  @Column({ type: 'int', nullable: true })
  userUsageLimit: number;

  @Column({
    type: 'enum',
    enum: CouponScope,
    default: CouponScope.GLOBAL,
  })
  scope: CouponScope;

  @Column({ type: 'uuid', nullable: true })
  partnerId: string;

  @Column({
    type: 'enum',
    enum: CouponStatus,
    default: CouponStatus.ACTIVE,
  })
  status: CouponStatus;

  @Column({ type: 'timestamp' })
  validFrom: Date;

  @Column({ type: 'timestamp' })
  validTo: Date;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @ManyToOne(() => PartnerEntity, { nullable: true })
  @JoinColumn({ name: 'partnerId' })
  partner: PartnerEntity;

  @OneToMany(() => BookingEntity, (booking) => booking.coupon)
  bookings: BookingEntity[];

  // Computed properties
  get isExpired(): boolean {
    return new Date() > this.validTo;
  }

  get isActive(): boolean {
    const now = new Date();
    return (
      this.status === CouponStatus.ACTIVE &&
      now >= this.validFrom &&
      now <= this.validTo &&
      (this.usageLimit === null || this.usageCount < this.usageLimit)
    );
  }

  get remainingUsage(): number | null {
    if (this.usageLimit === null) return null;
    return Math.max(0, this.usageLimit - this.usageCount);
  }
}
