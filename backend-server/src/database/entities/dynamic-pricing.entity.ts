import { BaseModel } from '@/database/models/base.model';
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { EntityType } from '../../utils/id-generator.service';
import { PartnerEntity } from './partner.entity';
import { SpaceEntity } from './space.entity';

export enum PricingRuleType {
  PEAK_HOURS = 'peak_hours',
  SEASONAL = 'seasonal',
  DEMAND_BASED = 'demand_based',
  SPECIAL_EVENT = 'special_event',
  BULK_DISCOUNT = 'bulk_discount',
}

export enum DayOfWeek {
  SUNDAY = 0,
  MONDAY = 1,
  TUESDAY = 2,
  WEDNESDAY = 3,
  THURSDAY = 4,
  FRIDAY = 5,
  SATURDAY = 6,
}

@Entity('dynamic_pricing')
export class DynamicPricingEntity extends BaseModel {
  @Index({ where: '"deletedAt" IS NULL' })
  @Column()
  partnerId: string;

  @ManyToOne(() => PartnerEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'partnerId' })
  partner: PartnerEntity;

  @Index({ where: '"deletedAt" IS NULL' })
  @Column({ nullable: true })
  spaceId: string;

  @ManyToOne(() => SpaceEntity, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'spaceId' })
  space: SpaceEntity;

  @Column({ length: 255 })
  name: string;

  @Column('text', { nullable: true })
  description: string;

  @Column({
    type: 'enum',
    enum: PricingRuleType,
  })
  ruleType: PricingRuleType;

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  multiplier: number; // e.g., 1.5 for 50% increase, 0.8 for 20% discount

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'int', default: 0 })
  priority: number; // Higher number = higher priority when multiple rules apply

  @Column({ type: 'timestamp', nullable: true })
  validFrom: Date;

  @Column({ type: 'timestamp', nullable: true })
  validUntil: Date;

  @Column('jsonb')
  conditions: {
    // Peak hours configuration
    peakHours?: {
      startTime: string; // HH:mm format
      endTime: string; // HH:mm format
      daysOfWeek: DayOfWeek[]; // Array of day numbers (0-6)
    }[];

    // Seasonal pricing
    dateRanges?: {
      startDate: string; // YYYY-MM-DD format
      endDate: string; // YYYY-MM-DD format
      description?: string;
    }[];

    // Demand-based pricing
    demandThresholds?: {
      occupancyPercentage: number; // 0-100
      multiplier: number;
    }[];

    // Minimum advance booking hours
    minAdvanceHours?: number;

    // Maximum advance booking days
    maxAdvanceDays?: number;

    // Booking duration thresholds
    durationThresholds?: {
      minHours: number;
      maxHours?: number;
      multiplier: number;
    }[];

    // Special conditions
    specialConditions?: {
      condition: string;
      value: any;
    }[];
  };

  @Column('jsonb', { nullable: true })
  metadata: {
    createdBy?: string;
    lastModifiedBy?: string;
    approvalRequired?: boolean;
    approvedBy?: string;
    approvedAt?: string;
    notes?: string;
    tags?: string[];
  };

  // Composite indexes for efficient queries
  @Index(['partnerId', 'isActive', 'validFrom', 'validUntil'])
  static partnerActiveIndex: void;

  @Index(['spaceId', 'isActive', 'ruleType'])
  static spaceRuleIndex: void;

  @Index(['ruleType', 'isActive', 'priority'])
  static rulePriorityIndex: void;

  protected getEntityType(): EntityType {
    return EntityType.SPACE;
  }
}
