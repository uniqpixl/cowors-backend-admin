import { PartnerEntity } from '@/database/entities/partner.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum CommissionRateType {
  PERCENTAGE = 'percentage',
  FIXED_AMOUNT = 'fixed_amount',
  TIERED = 'tiered',
  HYBRID = 'hybrid',
}

export enum CommissionTrigger {
  BOOKING_CREATED = 'booking_created',
  BOOKING_COMPLETED = 'booking_completed',
  PAYMENT_RECEIVED = 'payment_received',
  SERVICE_DELIVERED = 'service_delivered',
}

export interface CommissionTier {
  minAmount: number;
  maxAmount?: number;
  rate: number;
  fixedAmount?: number;
}

export interface CommissionRule {
  serviceType?: string;
  spaceType?: string;
  userType?: string;
  bookingDuration?: {
    min?: number;
    max?: number;
    unit: 'hours' | 'days' | 'weeks';
  };
  timeOfDay?: {
    start: string; // HH:mm format
    end: string;
  };
  dayOfWeek?: number[]; // 0-6, Sunday = 0
  seasonality?: {
    startDate: string; // MM-DD format
    endDate: string;
    multiplier: number;
  };
}

@Entity('commission_rate_configs')
export class CommissionRateConfigEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'enum', enum: CommissionRateType })
  rateType: CommissionRateType;

  @Column({ type: 'enum', enum: CommissionTrigger })
  trigger: CommissionTrigger;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'boolean', default: false })
  isDefault: boolean;

  // Basic rate configuration
  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  baseRate: number; // Percentage or fixed amount

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  minimumCommission: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  maximumCommission: number;

  // Tiered configuration
  @Column({ type: 'json', nullable: true })
  commissionTiers: CommissionTier[];

  // Advanced rules
  @Column({ type: 'json', nullable: true })
  rules: CommissionRule[];

  // Partner association
  @Column({ type: 'uuid', nullable: true })
  partnerId: string;

  @ManyToOne(() => PartnerEntity, { nullable: true })
  @JoinColumn({ name: 'partnerId' })
  partner: PartnerEntity;

  // Time-based configurations
  @Column({ type: 'timestamp', nullable: true })
  effectiveFrom: Date;

  @Column({ type: 'timestamp', nullable: true })
  effectiveTo: Date;

  // Performance-based adjustments
  @Column({ type: 'json', nullable: true })
  performanceMultipliers: {
    rating?: {
      threshold: number;
      multiplier: number;
    };
    volume?: {
      threshold: number;
      multiplier: number;
    };
    retention?: {
      threshold: number;
      multiplier: number;
    };
  };

  // Payment terms
  @Column({ type: 'integer', default: 30 })
  paymentTermDays: number;

  @Column({ type: 'boolean', default: false })
  autoPayment: boolean;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  holdbackPercentage: number; // Percentage to hold back

  @Column({ type: 'integer', default: 0 })
  holdbackDays: number; // Days to hold commission

  // Audit fields
  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'uuid', nullable: true })
  createdBy: string;

  @Column({ type: 'uuid', nullable: true })
  updatedBy: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  changeReason: string;

  // Version control
  @Column({ type: 'integer', default: 1 })
  version: number;

  @Column({ type: 'uuid', nullable: true })
  parentConfigId: string; // Reference to previous version
}
