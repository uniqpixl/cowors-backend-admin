import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { EntityType } from '../../utils/id-generator.service';
import { BaseModel } from '../models/base.model';
import { PartnerEntity } from './partner.entity';

export enum RefundPolicyType {
  FLEXIBLE = 'flexible',
  MODERATE = 'moderate',
  STRICT = 'strict',
  CUSTOM = 'custom',
}

export enum RefundCalculationType {
  PERCENTAGE = 'percentage',
  FIXED_AMOUNT = 'fixed_amount',
  TIERED = 'tiered',
}

export interface RefundTier {
  hoursBeforeStart: number;
  refundPercentage: number;
  fixedFee?: number;
  description?: string;
}

@Entity('refund_policy')
export class RefundPolicyEntity extends BaseModel {
  @Index({ where: '"deletedAt" IS NULL' })
  @Column()
  partnerId: string;

  @ManyToOne(() => PartnerEntity, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'partnerId' })
  partner: PartnerEntity;

  @Column({ length: 100 })
  name: string;

  @Column('text', { nullable: true })
  description: string;

  @Column({
    type: 'enum',
    enum: () => RefundPolicyType,
    default: RefundPolicyType.MODERATE,
  })
  type: RefundPolicyType;

  @Column({
    type: 'enum',
    enum: () => RefundCalculationType,
    default: RefundCalculationType.PERCENTAGE,
  })
  calculationType: RefundCalculationType;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'boolean', default: false })
  isDefault: boolean;

  // Time-based refund configuration
  @Column({ type: 'integer', default: 24 })
  minimumNoticeHours: number; // Minimum hours before booking start for refund

  @Column({ type: 'integer', default: 0 })
  noRefundHours: number; // Hours before start when no refund is allowed

  // Simple percentage-based refund
  @Column({ type: 'decimal', precision: 5, scale: 2, default: 100 })
  defaultRefundPercentage: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  fixedCancellationFee: number;

  // Tiered refund structure
  @Column('jsonb', { nullable: true })
  refundTiers: RefundTier[];

  // Special conditions
  @Column({ type: 'boolean', default: false })
  allowSameDayRefund: boolean;

  @Column({ type: 'boolean', default: true })
  allowPartialRefund: boolean;

  @Column({ type: 'boolean', default: false })
  requireApproval: boolean; // Whether refunds need manual approval

  @Column({ type: 'integer', default: 5 })
  processingDays: number; // Days to process refund

  // Applicable to specific booking types
  @Column('jsonb', { nullable: true })
  applicableSpaceTypes: string[]; // Space types this policy applies to

  @Column('jsonb', { nullable: true })
  excludedDates: string[]; // Dates when this policy doesn't apply

  // Emergency/force majeure conditions
  @Column({ type: 'boolean', default: false })
  forceMajeureFullRefund: boolean;

  @Column('text', { nullable: true })
  terms: string; // Legal terms and conditions

  @Column('jsonb', { nullable: true })
  metadata: {
    createdBy?: string;
    lastModifiedBy?: string;
    version?: number;
    approvedBy?: string;
    approvedAt?: Date;
  };

  // Indexes for efficient queries
  @Index(['partnerId', 'isActive'])
  static partnerActiveIndex: void;

  @Index(['partnerId', 'isDefault'])
  static partnerDefaultIndex: void;

  @Index(['type', 'isActive'])
  static typeActiveIndex: void;

  protected getEntityType(): EntityType {
    return EntityType.PARTNER;
  }
}
