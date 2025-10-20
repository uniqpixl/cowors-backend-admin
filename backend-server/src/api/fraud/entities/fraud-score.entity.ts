import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

// Define RiskLevel enum locally to avoid circular dependencies
export enum RiskLevel {
  VERY_LOW = 'very_low',
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  VERY_HIGH = 'very_high',
}

export interface ScoreFactors {
  paymentHistory?: number;
  bookingBehavior?: number;
  identityVerification?: number;
  deviceTrust?: number;
  locationConsistency?: number;
  socialSignals?: number;
}

@Entity('fraud_scores')
@Index(['userId'], { unique: true })
@Index(['riskLevel'])
@Index(['overallScore'])
@Index(['lastCalculatedAt'])
export class FraudScore {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', unique: true })
  userId: string;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 50 })
  overallScore: number;

  @Column({
    type: 'enum',
    enum: RiskLevel,
    default: RiskLevel.MEDIUM,
  })
  riskLevel: RiskLevel;

  @Column({ type: 'jsonb', default: {} })
  scoreFactors: {
    paymentHistory?: number;
    bookingBehavior?: number;
    identityVerification?: number;
    deviceTrust?: number;
    locationConsistency?: number;
    socialSignals?: number;
  };

  @Column({ type: 'jsonb', default: {} })
  behaviorMetrics: {
    averageBookingValue?: number;
    bookingFrequency?: number;
    cancellationRate?: number;
    disputeRate?: number;
    responseTime?: number;
    profileCompleteness?: number;
  };

  @Column({ type: 'jsonb', default: [] })
  scoreHistory: Array<{
    score: number;
    timestamp: Date;
    reason: string;
    factors: Record<string, number>;
  }>;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  lastCalculatedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  nextCalculationDue: Date;

  @Column({ type: 'text', array: true, default: [] })
  activeFlags: string[];

  @Column({ type: 'jsonb', default: [] })
  deviceFingerprints: Array<{
    deviceId: string;
    fingerprint: string;
    firstSeen: Date;
    lastSeen: Date;
    trustScore: number;
  }>;

  @Column({ type: 'jsonb', default: [] })
  locationHistory: Array<{
    country: string;
    city?: string;
    coordinates?: [number, number];
    timestamp: Date;
    ipAddress: string;
  }>;

  @Column({ type: 'boolean', default: false })
  isBlacklisted: boolean;

  @Column({ type: 'boolean', default: false })
  isWhitelisted: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
