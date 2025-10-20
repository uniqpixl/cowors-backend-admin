import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum AggregateType {
  PAYMENT = 'payment',
  WALLET = 'wallet',
  COMMISSION = 'commission',
  REFUND = 'refund',
  PAYOUT = 'payout',
  TRANSACTION = 'transaction',
  FINANCIAL_REPORT = 'financial_report',
}

export enum AggregateStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  ARCHIVED = 'archived',
}

@Entity('financial_aggregates')
@Index(['aggregateType', 'status'])
@Index(['lastEventVersion'])
export class FinancialAggregateEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'aggregate_type', type: 'enum', enum: AggregateType })
  @Index()
  aggregateType: AggregateType;

  @Column({ name: 'current_state', type: 'jsonb' })
  currentState: Record<string, any>;

  @Column({ name: 'last_event_version', type: 'int', default: 0 })
  @Index()
  lastEventVersion: number;

  @Column({
    name: 'status',
    type: 'enum',
    enum: AggregateStatus,
    default: AggregateStatus.ACTIVE,
  })
  @Index()
  status: AggregateStatus;

  @Column({ name: 'user_id', type: 'uuid', nullable: true })
  @Index()
  userId: string;

  @Column({ name: 'partner_id', type: 'uuid', nullable: true })
  @Index()
  partnerId: string;

  @Column({ name: 'booking_id', type: 'uuid', nullable: true })
  @Index()
  bookingId: string;

  @Column({ name: 'metadata', type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  @Index()
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Computed properties
  get isActive(): boolean {
    return this.status === AggregateStatus.ACTIVE;
  }

  get isArchived(): boolean {
    return this.status === AggregateStatus.ARCHIVED;
  }
}
