import { UserEntity } from '@/auth/entities/user.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import {
  TransactionStatus,
  WalletStatus,
} from '../../../common/enums/wallet.enum';
import { WalletTransactionEntity } from '../../../database/entities/wallet-transaction.entity';

@Entity('wallets')
@Index(['partnerId'])
@Index(['status'])
@Index(['createdAt'])
export class WalletEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'partner_id', type: 'uuid' })
  @Index()
  partnerId: string;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  balance: number;

  @Column({
    name: 'available_balance',
    type: 'decimal',
    precision: 15,
    scale: 2,
    default: 0,
  })
  availableBalance: number;

  @Column({
    name: 'pending_balance',
    type: 'decimal',
    precision: 15,
    scale: 2,
    default: 0,
  })
  pendingBalance: number;

  @Column({ type: 'varchar', length: 3, default: 'INR' })
  currency: string;

  @Column({
    type: 'enum',
    enum: WalletStatus,
    default: WalletStatus.ACTIVE,
  })
  status: WalletStatus;

  @Column({
    name: 'min_balance_threshold',
    type: 'decimal',
    precision: 15,
    scale: 2,
    nullable: true,
  })
  minBalanceThreshold?: number;

  @Column({
    name: 'max_balance_limit',
    type: 'decimal',
    precision: 15,
    scale: 2,
    nullable: true,
  })
  maxBalanceLimit?: number;

  @Column({ name: 'auto_payout_enabled', type: 'boolean', default: false })
  autoPayoutEnabled: boolean;

  @Column({
    name: 'auto_payout_threshold',
    type: 'decimal',
    precision: 15,
    scale: 2,
    nullable: true,
  })
  autoPayoutThreshold?: number;

  @Column({ name: 'last_transaction_at', type: 'timestamp', nullable: true })
  lastTransactionAt?: Date;

  @Column({ name: 'frozen_at', type: 'timestamp', nullable: true })
  frozenAt?: Date;

  @Column({ name: 'frozen_reason', type: 'text', nullable: true })
  frozenReason?: string;

  @Column({ name: 'frozen_by', type: 'uuid', nullable: true })
  frozenBy?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>;

  // Relations
  @ManyToOne(() => UserEntity, { eager: true })
  @JoinColumn({ name: 'partner_id' })
  partner: UserEntity;

  @OneToMany(
    () => WalletTransactionEntity,
    (transaction) => transaction.walletBalance,
  )
  transactions: WalletTransactionEntity[];

  // Virtual properties
  get isActive(): boolean {
    return this.status === WalletStatus.ACTIVE;
  }

  get isFrozen(): boolean {
    return this.status === WalletStatus.FROZEN;
  }

  get canTransact(): boolean {
    return this.status === WalletStatus.ACTIVE;
  }

  get hasAutoPayoutEnabled(): boolean {
    return this.autoPayoutEnabled && this.autoPayoutThreshold > 0;
  }

  get isEligibleForAutoPayout(): boolean {
    return (
      this.hasAutoPayoutEnabled &&
      this.availableBalance >= this.autoPayoutThreshold
    );
  }
}

// WalletTransactionEntity is imported from database/entities/wallet-transaction.entity.ts

// Wallet metadata interface for additional wallet information
export interface WalletMetadata {
  bankDetails?: {
    accountNumber: string;
    ifscCode: string;
    bankName: string;
    accountHolderName: string;
    verified: boolean;
    verifiedAt?: Date;
  };
  upiDetails?: {
    upiId: string;
    verified: boolean;
    verifiedAt?: Date;
  };
  kycDetails?: {
    panNumber: string;
    aadharNumber: string;
    verified: boolean;
    verifiedAt?: Date;
    documents: string[];
  };
  preferences?: {
    payoutFrequency: 'daily' | 'weekly' | 'monthly';
    payoutMethod: 'bank' | 'upi';
    notifications: {
      email: boolean;
      sms: boolean;
      push: boolean;
    };
  };
  limits?: {
    dailyTransactionLimit: number;
    monthlyTransactionLimit: number;
    maxSingleTransactionAmount: number;
  };
  compliance?: {
    tdsApplicable: boolean;
    tdsRate: number;
    gstApplicable: boolean;
    gstRate: number;
  };
}

// Transaction metadata interface for additional transaction information
export interface TransactionMetadata {
  commission?: {
    rate: number;
    amount: number;
    type: 'percentage' | 'fixed';
  };
  tax?: {
    tds: {
      rate: number;
      amount: number;
    };
    gst: {
      rate: number;
      amount: number;
    };
  };
  payout?: {
    method: 'bank' | 'upi';
    accountDetails: string;
    processingFee: number;
    expectedDate: Date;
  };
  booking?: {
    bookingId: string;
    spaceId: string;
    spaceName: string;
    checkIn: Date;
    checkOut: Date;
  };
  refund?: {
    originalTransactionId: string;
    refundReason: string;
    refundType: 'full' | 'partial';
    originalAmount: number;
  };
  adjustment?: {
    reason: string;
    adjustmentType: 'correction' | 'penalty' | 'bonus';
    approvedBy: string;
    approvalDate: Date;
  };
}
