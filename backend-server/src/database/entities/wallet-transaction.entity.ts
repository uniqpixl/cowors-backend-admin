import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { UserEntity } from '../../auth/entities/user.entity';
import {
  TransactionStatus,
  TransactionType,
} from '../../common/enums/wallet.enum';
import { EntityType } from '../../utils/id-generator.service';
import { BaseModel } from '../models/base.model';
export enum TransactionSource {
  BOOKING_PAYMENT = 'booking_payment',
  BOOKING_REFUND = 'booking_refund',
  CASHBACK = 'cashback',
  REFERRAL_BONUS = 'referral_bonus',
  PROMOTIONAL_CREDIT = 'promotional_credit',
  ADMIN_ADJUSTMENT = 'admin_adjustment',
  WITHDRAWAL = 'withdrawal',
  TOP_UP = 'top_up',
  TRANSFER = 'transfer',
  WALLET_CREATION = 'wallet_creation',
  ESCROW_HOLD = 'escrow_hold',
  ESCROW_RELEASE = 'escrow_release',
  ESCROW_CANCEL = 'escrow_cancel',
  CURRENCY_EXCHANGE = 'currency_exchange',
}

@Entity('wallet_transaction')
export class WalletTransactionEntity extends BaseModel {
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
  walletBalanceId: string;

  @ManyToOne('WalletBalanceEntity', 'transactions', {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'walletBalanceId' })
  walletBalance: any;

  @Column({ length: 50, unique: true })
  transactionId: string;

  @Column({
    type: 'enum',
    enum: () => TransactionType,
  })
  type: TransactionType;

  @Column({
    type: 'enum',
    enum: () => TransactionSource,
  })
  source: TransactionSource;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  amount: number;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  balanceAfter: number;

  @Column({ length: 3, default: 'INR' })
  currency: string;

  @Column({
    type: 'enum',
    enum: () => TransactionStatus,
    default: TransactionStatus.PENDING,
  })
  status: TransactionStatus;

  @Column('text')
  description: string;

  @Column({ length: 100, nullable: true })
  referenceId: string; // booking ID, payment ID, etc.

  @Column({ length: 50, nullable: true })
  referenceType: string; // booking, payment, refund, etc.

  @Column({ type: 'timestamp', nullable: true })
  processedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  failedAt: Date;

  @Column('text', { nullable: true })
  failureReason: string;

  @Column('jsonb', { nullable: true })
  metadata: {
    initiatedBy?: string; // user, admin, system
    approvedBy?: string;
    gatewayTransactionId?: string;
    bankTransactionId?: string;
    promocode?: string;
    campaignId?: string;
    partnerCommission?: {
      partnerId: string;
      rate: number;
      amount: number;
    };
    taxDetails?: {
      cgst?: number;
      sgst?: number;
      igst?: number;
      tds?: number;
    };
    notes?: string;
  };

  // Indexes for efficient queries
  @Index(['userId', 'type'])
  static userTypeIndex: void;

  @Index(['walletBalanceId', 'createdAt'])
  static balanceTimeIndex: void;

  @Index(['referenceId', 'referenceType'])
  static referenceIndex: void;

  @Index(['status', 'createdAt'])
  static statusTimeIndex: void;

  @Index(['source', 'createdAt'])
  static sourceTimeIndex: void;

  protected getEntityType(): EntityType {
    return EntityType.USER;
  }
}
