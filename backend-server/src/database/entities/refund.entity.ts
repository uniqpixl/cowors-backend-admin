import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { UserEntity } from '../../auth/entities/user.entity';
import { RefundStatus } from '../../common/enums/booking.enum';
import { EntityType } from '../../utils/id-generator.service';
import { BaseModel } from '../models/base.model';

export enum RefundType {
  FULL = 'full',
  PARTIAL = 'partial',
  CANCELLATION = 'cancellation',
  ADJUSTMENT = 'adjustment',
}

export enum RefundMethod {
  ORIGINAL_SOURCE = 'original_source',
  WALLET = 'wallet',
  BANK_TRANSFER = 'bank_transfer',
  CASH = 'cash',
}

@Entity('refund')
export class RefundEntity extends BaseModel {
  @Index({ where: '"deletedAt" IS NULL' })
  @Column()
  userId: string;

  @ManyToOne(() => UserEntity, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'userId' })
  user: UserEntity;

  @Index({ where: '"deletedAt" IS NULL' })
  @Column()
  paymentId: string;

  @ManyToOne('PaymentEntity', 'refunds', {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'paymentId' })
  payment: any;

  @Column({ length: 50, unique: true })
  refundId: string;

  @Column({ length: 100, nullable: true })
  gatewayRefundId: string;

  @Column({
    type: 'enum',
    enum: () => RefundType,
  })
  type: RefundType;

  @Column({
    type: 'enum',
    enum: () => RefundMethod,
    default: RefundMethod.ORIGINAL_SOURCE,
  })
  method: RefundMethod;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column({ length: 3, default: 'INR' })
  currency: string;

  @Column({
    type: 'enum',
    enum: () => RefundStatus,
    default: RefundStatus.PENDING,
  })
  status: RefundStatus;

  @Column('text')
  reason: string;

  @Column('text', { nullable: true })
  adminNotes: string;

  @Column({ type: 'timestamp', nullable: true })
  processedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  completedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  failedAt: Date;

  @Column('text', { nullable: true })
  failureReason: string;

  @Column('jsonb', { nullable: true })
  gatewayResponse: {
    transactionId?: string;
    refundTransactionId?: string;
    bankRefNumber?: string;
    processingTime?: string;
    errorCode?: string;
    errorDescription?: string;
    rawResponse?: any;
  };

  @Column('jsonb', { nullable: true })
  breakdown: {
    baseRefund: number;
    extrasRefund: number;
    taxRefund: number;
    convenienceFeeRefund: number;
    penaltyAmount: number;
    totalRefund: number;
  };

  @Column('jsonb', { nullable: true })
  metadata: {
    initiatedBy?: string; // user, admin, system
    approvedBy?: string;
    processingDays?: number;
    bankDetails?: {
      accountNumber?: string;
      ifscCode?: string;
      accountHolderName?: string;
    };
    walletTransactionId?: string;
  };

  // Indexes for efficient queries
  @Index(['userId', 'status'])
  static userStatusIndex: void;

  @Index(['paymentId', 'type'])
  static paymentTypeIndex: void;

  @Index(['status', 'createdAt'])
  static statusTimeIndex: void;

  protected getEntityType(): EntityType {
    return EntityType.BOOKING;
  }
}
