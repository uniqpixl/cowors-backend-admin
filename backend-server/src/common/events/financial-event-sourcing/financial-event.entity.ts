import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

export enum FinancialEventType {
  PAYMENT_INITIATED = 'payment.initiated',
  PAYMENT_COMPLETED = 'payment.completed',
  PAYMENT_FAILED = 'payment.failed',
  COMMISSION_CALCULATED = 'commission.calculated',
  COMMISSION_PAID = 'commission.paid',
  WALLET_CREDITED = 'wallet.credited',
  WALLET_DEBITED = 'wallet.debited',
  WALLET_HOLD_CREATED = 'wallet.hold.created',
  WALLET_HOLD_RELEASED = 'wallet.hold.released',
  REFUND_INITIATED = 'refund.initiated',
  REFUND_COMPLETED = 'refund.completed',
  PAYOUT_REQUESTED = 'payout.requested',
  PAYOUT_COMPLETED = 'payout.completed',
  TAX_CALCULATED = 'tax.calculated',
  RECONCILIATION_COMPLETED = 'reconciliation.completed',
  MANUAL_RECONCILIATION = 'manual.reconciliation',
  MULTI_CURRENCY_ENABLED = 'multi.currency.enabled',
  CURRENCY_EXCHANGED = 'currency.exchanged',
  ESCROW_HOLD_CREATED = 'escrow.hold.created',
  ESCROW_HOLD_RELEASED = 'escrow.hold.released',
  ESCROW_HOLD_CANCELLED = 'escrow.hold.cancelled',
  REPORT_GENERATED = 'report.generated',
}

export enum FinancialEventStatus {
  PENDING = 'pending',
  PROCESSED = 'processed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

@Entity('financial_events')
@Index(['aggregateId', 'eventType'])
@Index(['aggregateId', 'version'])
@Index(['eventType', 'createdAt'])
@Index(['status'])
export class FinancialEventEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'aggregate_id', type: 'uuid' })
  @Index()
  aggregateId: string;

  @Column({ name: 'aggregate_type', type: 'varchar', length: 100 })
  aggregateType: string;

  @Column({ name: 'event_type', type: 'enum', enum: FinancialEventType })
  @Index()
  eventType: FinancialEventType;

  @Column({ name: 'event_version', type: 'int', default: 1 })
  version: number;

  @Column({ name: 'schema_version', type: 'int', default: 1 })
  schemaVersion: number;

  @Column({ name: 'original_event_id', type: 'uuid', nullable: true })
  originalEventId: string;

  @Column({ name: 'event_data', type: 'jsonb' })
  eventData: Record<string, any>;

  @Column({ name: 'metadata', type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @Column({
    name: 'status',
    type: 'enum',
    enum: FinancialEventStatus,
    default: FinancialEventStatus.PENDING,
  })
  @Index()
  status: FinancialEventStatus;

  @Column({ name: 'user_id', type: 'uuid', nullable: true })
  @Index()
  userId: string;

  @Column({ name: 'partner_id', type: 'uuid', nullable: true })
  @Index()
  partnerId: string;

  @Column({ name: 'booking_id', type: 'uuid', nullable: true })
  @Index()
  bookingId: string;

  @Column({ name: 'transaction_id', type: 'uuid', nullable: true })
  @Index()
  transactionId: string;

  @Column({
    name: 'amount',
    type: 'decimal',
    precision: 15,
    scale: 2,
    nullable: true,
  })
  amount: number;

  @Column({ name: 'currency', type: 'varchar', length: 3, default: 'INR' })
  currency: string;

  @Column({ name: 'processed_at', type: 'timestamp', nullable: true })
  processedAt: Date;

  @Column({ name: 'failed_at', type: 'timestamp', nullable: true })
  failedAt: Date;

  @Column({ name: 'error_message', type: 'text', nullable: true })
  errorMessage: string;

  @Column({ name: 'retry_count', type: 'int', default: 0 })
  retryCount: number;

  @Column({ name: 'correlation_id', type: 'uuid', nullable: true })
  @Index()
  correlationId: string;

  @Column({ name: 'causation_id', type: 'uuid', nullable: true })
  @Index()
  causationId: string;

  @CreateDateColumn({ name: 'created_at' })
  @Index()
  createdAt: Date;

  // Computed properties
  get isProcessed(): boolean {
    return this.status === FinancialEventStatus.PROCESSED;
  }

  get isFailed(): boolean {
    return this.status === FinancialEventStatus.FAILED;
  }

  get isPending(): boolean {
    return this.status === FinancialEventStatus.PENDING;
  }
}
