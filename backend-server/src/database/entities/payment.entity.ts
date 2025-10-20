import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
} from 'typeorm';
import { UserEntity } from '../../auth/entities/user.entity';
import {
  PaymentGateway,
  PaymentStatus,
  RefundStatus,
} from '../../common/enums/booking.enum';
import { PaymentMethod } from '../../common/enums/payment.enum';
import { EntityType } from '../../utils/id-generator.service';
import { BaseModel } from '../models/base.model';
import { BookingEntity } from './booking.entity';
import { RefundEntity } from './refund.entity';

export interface GatewayResponse {
  transactionId?: string;
  authCode?: string;
  bankRefNumber?: string;
  cardType?: string;
  cardLast4?: string;
  bankName?: string;
  upiTransactionId?: string;
  errorCode?: string;
  errorDescription?: string;
  rawResponse?: any;
  // Stripe specific fields
  clientSecret?: string;
  paymentIntentId?: string;
  // Razorpay specific fields
  orderId?: string;
  // Additional gateway fields
  [key: string]: any;
}

export interface PaymentBreakdown {
  baseAmount: number;
  extrasAmount: number;
  taxAmount: number;
  discountAmount: number;
  convenienceFee: number;
  gatewayFee: number;
  totalAmount: number;
}

export interface PaymentMetadata {
  ipAddress?: string;
  userAgent?: string;
  deviceId?: string;
  attemptCount?: number;
  retryAfter?: Date;
  notes?: string;
  kycRequired?: boolean;
  kycVerificationId?: string;
  kycCompletedAt?: Date;
}

@Entity('payment')
export class PaymentEntity extends BaseModel {
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
  bookingId: string;

  @OneToOne(() => BookingEntity, 'payment', {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'bookingId' })
  booking: BookingEntity;

  @Column({ length: 50, unique: true })
  paymentId: string;

  @Column({ length: 100, nullable: true })
  gatewayPaymentId: string;

  @Column({ length: 100, nullable: true })
  gatewayOrderId: string;

  @Column({
    type: 'enum',
    enum: () => PaymentGateway,
  })
  gateway: PaymentGateway;

  @Column({
    type: 'enum',
    enum: () => PaymentMethod,
  })
  method: PaymentMethod;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column({ length: 3, default: 'INR' })
  currency: string;

  @Column({
    type: 'enum',
    enum: () => PaymentStatus,
    default: PaymentStatus.PENDING,
  })
  status: PaymentStatus;

  @Column({ type: 'timestamp', nullable: true })
  paidAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  completedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  failedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  cancelledAt: Date;

  @Column('text', { nullable: true })
  failureReason: string;

  @Column('jsonb', { nullable: true })
  gatewayResponse: GatewayResponse;

  @Column('jsonb', { nullable: true })
  breakdown: PaymentBreakdown;

  @Column('jsonb', { nullable: true })
  metadata: PaymentMetadata;

  @OneToMany(() => RefundEntity, 'payment')
  refunds: RefundEntity[];

  // Indexes for efficient queries
  @Index(['userId', 'status'])
  static userStatusIndex: void;

  @Index(['gateway', 'gatewayPaymentId'])
  static gatewayIndex: void;

  @Index(['status', 'createdAt'])
  static statusTimeIndex: void;

  protected getEntityType(): EntityType {
    return EntityType.BOOKING;
  }
}
