import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum FraudAlertType {
  PAYMENT_FRAUD = 'payment_fraud',
  USER_BEHAVIOR = 'user_behavior',
  BOOKING_FRAUD = 'booking_fraud',
  IDENTITY_FRAUD = 'identity_fraud',
  SYSTEM_ANOMALY = 'system_anomaly',
}

export enum FraudAlertSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export enum FraudAlertStatus {
  PENDING = 'pending',
  INVESTIGATING = 'investigating',
  RESOLVED = 'resolved',
  FALSE_POSITIVE = 'false_positive',
  CONFIRMED = 'confirmed',
}

@Entity('fraud_alerts')
@Index(['type', 'severity'])
@Index(['status', 'createdAt'])
@Index(['userId'])
@Index(['riskScore'])
export class FraudAlert {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: FraudAlertType,
  })
  type: FraudAlertType;

  @Column({
    type: 'enum',
    enum: FraudAlertSeverity,
  })
  severity: FraudAlertSeverity;

  @Column({
    type: 'enum',
    enum: FraudAlertStatus,
    default: FraudAlertStatus.PENDING,
  })
  status: FraudAlertStatus;

  @Column({ type: 'uuid', nullable: true })
  userId?: string;

  @Column({ type: 'uuid', nullable: true })
  bookingId?: string;

  @Column({ type: 'uuid', nullable: true })
  paymentId?: string;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'jsonb' })
  metadata: Record<string, any>;

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  riskScore: number;

  @Column({ type: 'text', array: true, default: [] })
  flags: string[];

  @Column({ type: 'uuid', nullable: true })
  assignedTo?: string;

  @Column({ type: 'uuid', nullable: true })
  resolvedBy?: string;

  @Column({ type: 'text', nullable: true })
  resolution?: string;

  @Column({ type: 'timestamp', nullable: true })
  resolvedAt?: Date;

  @Column({ type: 'varchar', length: 45, nullable: true })
  ipAddress?: string;

  @Column({ type: 'text', nullable: true })
  userAgent?: string;

  @Column({ type: 'jsonb', nullable: true })
  location?: {
    country?: string;
    city?: string;
    coordinates?: [number, number];
  };

  @Column({ type: 'jsonb', default: [] })
  actionHistory: {
    action: string;
    timestamp: Date;
    userId: string;
    notes?: string;
  }[];

  @Column({ type: 'boolean', default: false })
  isArchived: boolean;

  @Column({ type: 'varchar', nullable: true })
  externalReferenceId?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
