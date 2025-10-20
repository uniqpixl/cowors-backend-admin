import { UserEntity } from '@/auth/entities/user.entity';
import { BookingEntity } from '@/database/entities/booking.entity';
import { PartnerEntity } from '@/database/entities/partner.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum DisputeType {
  BOOKING_ISSUE = 'booking_issue',
  PAYMENT_DISPUTE = 'payment_dispute',
  SERVICE_QUALITY = 'service_quality',
  CANCELLATION_DISPUTE = 'cancellation_dispute',
  REFUND_REQUEST = 'refund_request',
  PROPERTY_DAMAGE = 'property_damage',
  POLICY_VIOLATION = 'policy_violation',
  OTHER = 'other',
}

export enum DisputeStatus {
  PENDING = 'pending',
  UNDER_REVIEW = 'under_review',
  INVESTIGATING = 'investigating',
  AWAITING_RESPONSE = 'awaiting_response',
  ESCALATED = 'escalated',
  RESOLVED = 'resolved',
  CLOSED = 'closed',
  REJECTED = 'rejected',
}

export enum DisputePriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
}

export enum DisputeResolution {
  REFUND_ISSUED = 'refund_issued',
  PARTIAL_REFUND = 'partial_refund',
  NO_REFUND = 'no_refund',
  SERVICE_CREDIT = 'service_credit',
  REBOOKING = 'rebooking',
  POLICY_CLARIFICATION = 'policy_clarification',
  MEDIATION_REQUIRED = 'mediation_required',
  LEGAL_ACTION = 'legal_action',
}

@Entity('disputes')
export class DisputeEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: 'enum', enum: DisputeType })
  type: DisputeType;

  @Index()
  @Column({ type: 'enum', enum: DisputeStatus, default: DisputeStatus.PENDING })
  status: DisputeStatus;

  @Column({
    type: 'enum',
    enum: DisputePriority,
    default: DisputePriority.MEDIUM,
  })
  priority: DisputePriority;

  @Column({ length: 200 })
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Index()
  @Column({ type: 'uuid', name: 'complainant_id' })
  complainantId: string;

  @Index()
  @Column({ type: 'uuid', name: 'respondent_id' })
  respondentId: string;

  @Index()
  @Column({ type: 'uuid', name: 'booking_id', nullable: true })
  bookingId?: string;

  @Index()
  @Column({ type: 'uuid', name: 'assigned_to', nullable: true })
  assignedTo?: string;

  @Column({ type: 'uuid', name: 'resolved_by', nullable: true })
  resolvedBy?: string;

  @Column({ type: 'jsonb', nullable: true })
  evidence?: {
    files?: string[];
    screenshots?: string[];
    communications?: string[];
    witnesses?: string[];
  };

  @Column({ type: 'jsonb', nullable: true })
  timeline?: {
    event: string;
    timestamp: Date;
    actor: string;
    details?: string;
  }[];

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  disputedAmount?: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  resolvedAmount?: number;

  @Column({ type: 'enum', enum: DisputeResolution, nullable: true })
  resolution?: DisputeResolution;

  @Column({ type: 'text', nullable: true })
  resolutionNotes?: string;

  @Column({ type: 'timestamp', nullable: true })
  resolvedAt?: Date;

  @Column({ type: 'timestamp', nullable: true })
  escalatedAt?: Date;

  @Column({ type: 'timestamp', nullable: true })
  dueDate?: Date;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>;

  @Column({ type: 'boolean', default: false })
  isEscalated: boolean;

  @Column({ type: 'boolean', default: false })
  requiresLegalAction: boolean;

  @Column({ type: 'text', nullable: true })
  internalNotes?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relations
  @ManyToOne(() => UserEntity, { eager: false })
  @JoinColumn({ name: 'complainant_id' })
  complainant: UserEntity;

  @ManyToOne(() => UserEntity, { eager: false })
  @JoinColumn({ name: 'respondent_id' })
  respondent: UserEntity;

  @ManyToOne(() => BookingEntity, { eager: false, nullable: true })
  @JoinColumn({ name: 'booking_id' })
  booking?: BookingEntity;

  @ManyToOne(() => UserEntity, { eager: false, nullable: true })
  @JoinColumn({ name: 'assigned_to' })
  assignee?: UserEntity;

  @ManyToOne(() => UserEntity, { eager: false, nullable: true })
  @JoinColumn({ name: 'resolved_by' })
  resolver?: UserEntity;
}
