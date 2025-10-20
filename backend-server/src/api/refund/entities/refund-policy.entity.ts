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

export enum RefundPolicyType {
  PERCENTAGE = 'percentage',
  FIXED_AMOUNT = 'fixed_amount',
  TIERED = 'tiered',
  NO_REFUND = 'no_refund',
}

export enum RefundTimeUnit {
  HOURS = 'hours',
  DAYS = 'days',
  WEEKS = 'weeks',
}

export interface RefundTier {
  hoursBeforeBooking: number;
  refundPercentage: number;
  fixedAmount?: number;
}

@Entity('refund_policies')
export class RefundPolicyEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'enum', enum: RefundPolicyType })
  type: RefundPolicyType;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'boolean', default: false })
  isDefault: boolean;

  // For percentage and fixed amount policies
  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  refundPercentage: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  fixedRefundAmount: number;

  // Time-based configurations
  @Column({ type: 'integer', nullable: true })
  minimumNoticeHours: number;

  @Column({ type: 'integer', nullable: true })
  maximumRefundHours: number;

  // For tiered policies
  @Column({ type: 'json', nullable: true })
  refundTiers: RefundTier[];

  // Processing fees
  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  processingFeePercentage: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  processingFeeFixed: number;

  // Partner association
  @Column({ type: 'uuid', nullable: true })
  partnerId: string;

  @ManyToOne(() => PartnerEntity, { nullable: true })
  @JoinColumn({ name: 'partnerId' })
  partner: PartnerEntity;

  // Conditions
  @Column({ type: 'boolean', default: false })
  allowPartialRefunds: boolean;

  @Column({ type: 'boolean', default: true })
  requireApproval: boolean;

  @Column({ type: 'json', nullable: true })
  conditions: {
    minBookingAmount?: number;
    maxBookingAmount?: number;
    applicableServices?: string[];
    excludedServices?: string[];
    userTypes?: string[];
  };

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'uuid', nullable: true })
  createdBy: string;

  @Column({ type: 'uuid', nullable: true })
  updatedBy: string;
}
