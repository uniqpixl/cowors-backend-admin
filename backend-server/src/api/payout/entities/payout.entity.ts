import { UserEntity } from '@/auth/entities/user.entity';
import { BookingEntity } from '@/database/entities/booking.entity';
import {
  BeforeInsert,
  BeforeUpdate,
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
  EntityType,
  IdGeneratorService,
} from '../../../utils/id-generator.service';
import {
  BankAccountStatus,
  BankAccountType,
  PayoutMethod,
  PayoutSchedule,
  PayoutStatus,
  PayoutType,
  ProcessingFeeType,
  WalletTransactionType,
} from '../dto/payout.dto';

// Bank Account Entity (moved before PayoutRequestEntity to avoid circular reference)
@Entity('partner_bank_accounts')
@Index(['partnerId', 'isPrimary'])
@Index(['accountNumber'], { unique: true })
@Index(['ifscCode'])
@Index(['status'])
export class BankAccountEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  @Index()
  partnerId: string;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'partnerId' })
  partner: UserEntity;

  @Column({ length: 100 })
  accountHolderName: string;

  @Column({ length: 20, unique: true })
  accountNumber: string;

  @Column({ length: 11 })
  ifscCode: string;

  @Column({ length: 100 })
  bankName: string;

  @Column({ length: 100 })
  branchName: string;

  @Column({
    type: 'enum',
    enum: BankAccountType,
  })
  accountType: BankAccountType;

  @Column({
    type: 'enum',
    enum: BankAccountStatus,
    default: BankAccountStatus.PENDING,
  })
  status: BankAccountStatus;

  @Column('boolean', { default: false })
  isPrimary: boolean;

  @Column('timestamp', { nullable: true })
  verifiedDate?: Date;

  @Column({ length: 100, nullable: true })
  verificationMethod?: string;

  @Column({ length: 100, nullable: true })
  verificationReference?: string;

  @Column('text', { nullable: true })
  notes?: string;

  @Column('text', { nullable: true })
  rejectionReason?: string;

  @Column('timestamp', { nullable: true })
  cancelledDate?: Date;

  @Column('text', { nullable: true })
  cancellationReason?: string;

  @Column('json', { nullable: true })
  metadata?: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column('uuid', { nullable: true })
  verifiedBy?: string;

  @ManyToOne(() => UserEntity, { nullable: true })
  @JoinColumn({ name: 'verifiedBy' })
  verifier?: UserEntity;

  @OneToMany(() => PayoutRequestEntity, (request) => request.bankAccount)
  payoutRequests: PayoutRequestEntity[];

  @OneToMany(() => PayoutEntity, (payout) => payout.bankAccount)
  payouts: PayoutEntity[];

  // Helper methods
  canBeUsedForPayout(): boolean {
    return this.status === BankAccountStatus.VERIFIED;
  }

  isVerified(): boolean {
    return this.status === BankAccountStatus.VERIFIED;
  }

  isPending(): boolean {
    return this.status === BankAccountStatus.PENDING;
  }

  isRejected(): boolean {
    return this.status === BankAccountStatus.REJECTED;
  }

  getMaskedAccountNumber(): string {
    if (this.accountNumber.length <= 4) {
      return this.accountNumber;
    }
    const visibleDigits = this.accountNumber.slice(-4);
    const maskedPart = '*'.repeat(this.accountNumber.length - 4);
    return maskedPart + visibleDigits;
  }
}

// Payout Request Entity
@Entity('payout_requests')
@Index(['partnerId', 'status'])
@Index(['type', 'status'])
@Index(['requestedDate'])
@Index(['createdAt'])
export class PayoutRequestEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  @Index()
  requestReference: string;

  @Column({
    type: 'enum',
    enum: PayoutType,
  })
  type: PayoutType;

  @Column({
    type: 'enum',
    enum: PayoutStatus,
    default: PayoutStatus.PENDING,
  })
  status: PayoutStatus;

  @Column('decimal', { precision: 15, scale: 2 })
  amount: number;

  @Column({ length: 3, default: 'INR' })
  currency: string;

  @Column({ length: 500 })
  description: string;

  @Column('uuid')
  @Index()
  partnerId: string;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'partnerId' })
  partner: UserEntity;

  @Column('uuid', { nullable: true })
  bankAccountId?: string;

  @ManyToOne(() => BankAccountEntity, { nullable: true })
  @JoinColumn({ name: 'bankAccountId' })
  bankAccount?: BankAccountEntity;

  @Column({
    type: 'enum',
    enum: PayoutMethod,
  })
  payoutMethod: PayoutMethod;

  @Column('timestamp', { nullable: true })
  requestedDate?: Date;

  @Column('timestamp', { nullable: true })
  approvedDate?: Date;

  @Column('timestamp', { nullable: true })
  rejectedDate?: Date;

  @Column('timestamp', { nullable: true })
  processedDate?: Date;

  @Column('timestamp', { nullable: true })
  completedDate?: Date;

  @Column('decimal', { precision: 15, scale: 2, nullable: true })
  processingFee?: number;

  @Column('decimal', { precision: 15, scale: 2, nullable: true })
  netAmount?: number;

  @Column('text', { nullable: true })
  notes?: string;

  @Column('text', { nullable: true })
  rejectionReason?: string;

  @Column('timestamp', { nullable: true })
  cancelledDate?: Date;

  @Column('text', { nullable: true })
  cancellationReason?: string;

  @Column('json', { nullable: true })
  metadata?: Record<string, any>;

  @Column('boolean', { default: false })
  autoApprove: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column('uuid', { nullable: true })
  createdBy?: string;

  @ManyToOne(() => UserEntity, { nullable: true })
  @JoinColumn({ name: 'createdBy' })
  creator?: UserEntity;

  @Column('uuid', { nullable: true })
  updatedBy?: string;

  @ManyToOne(() => UserEntity, { nullable: true })
  @JoinColumn({ name: 'updatedBy' })
  updater?: UserEntity;

  @Column('uuid', { nullable: true })
  approvedBy?: string;

  @ManyToOne(() => UserEntity, { nullable: true })
  @JoinColumn({ name: 'approvedBy' })
  approver?: UserEntity;

  @OneToMany(() => PayoutEntity, (payout) => payout.request)
  payouts: PayoutEntity[];

  @OneToMany(() => PayoutAuditTrailEntity, (audit) => audit.payoutRequest)
  auditTrail: PayoutAuditTrailEntity[];

  @BeforeInsert()
  generateRequestReference() {
    if (!this.requestReference) {
      this.requestReference = IdGeneratorService.generateId(
        EntityType.PAYOUT_REQUEST,
      );
    }
  }

  @BeforeUpdate()
  calculateNetAmount() {
    if (this.amount && this.processingFee !== undefined) {
      this.netAmount = this.amount - this.processingFee;
    }
  }

  // Helper methods
  canBeApproved(): boolean {
    return this.status === PayoutStatus.PENDING;
  }

  canBeRejected(): boolean {
    return this.status === PayoutStatus.PENDING;
  }

  canBeProcessed(): boolean {
    return this.status === PayoutStatus.APPROVED;
  }

  canBeCancelled(): boolean {
    return [PayoutStatus.PENDING, PayoutStatus.APPROVED].includes(this.status);
  }

  isCompleted(): boolean {
    return this.status === PayoutStatus.COMPLETED;
  }

  isFailed(): boolean {
    return this.status === PayoutStatus.FAILED;
  }
}

// Payout Entity
@Entity('payouts')
@Index(['requestId', 'status'])
@Index(['partnerId', 'status'])
@Index(['payoutMethod'])
@Index(['processedDate'])
@Index(['completedDate'])
export class PayoutEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  @Index()
  payoutReference: string;

  @Column('uuid')
  @Index()
  requestId: string;

  @ManyToOne(() => PayoutRequestEntity, (request) => request.payouts, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'requestId' })
  request: PayoutRequestEntity;

  @Column('uuid')
  @Index()
  partnerId: string;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'partnerId' })
  partner: UserEntity;

  @Column({
    type: 'enum',
    enum: PayoutStatus,
    default: PayoutStatus.PROCESSING,
  })
  status: PayoutStatus;

  @Column('decimal', { precision: 15, scale: 2 })
  amount: number;

  @Column('decimal', { precision: 15, scale: 2, default: 0 })
  processingFee: number;

  @Column('decimal', { precision: 15, scale: 2 })
  netAmount: number;

  @Column({ length: 3, default: 'INR' })
  currency: string;

  @Column('uuid', { nullable: true })
  bankAccountId?: string;

  @ManyToOne(() => BankAccountEntity, { nullable: true })
  @JoinColumn({ name: 'bankAccountId' })
  bankAccount?: BankAccountEntity;

  @Column({
    type: 'enum',
    enum: PayoutMethod,
  })
  payoutMethod: PayoutMethod;

  @Column({ length: 100, nullable: true })
  bankReference?: string;

  @Column({ length: 100, nullable: true })
  externalTransactionId?: string;

  @Column('timestamp', { nullable: true })
  scheduledDate?: Date;

  @Column('timestamp', { nullable: true })
  processedDate?: Date;

  @Column('timestamp', { nullable: true })
  completedDate?: Date;

  @Column('timestamp', { nullable: true })
  failedDate?: Date;

  @Column('text', { nullable: true })
  notes?: string;

  @Column('text', { nullable: true })
  failureReason?: string;

  @Column('json', { nullable: true })
  metadata?: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column('uuid', { nullable: true })
  processedBy?: string;

  @ManyToOne(() => UserEntity, { nullable: true })
  @JoinColumn({ name: 'processedBy' })
  processor?: UserEntity;

  @OneToMany(() => PayoutAuditTrailEntity, (audit) => audit.payout)
  auditTrail: PayoutAuditTrailEntity[];

  @BeforeInsert()
  generatePayoutReference() {
    if (!this.payoutReference) {
      this.payoutReference = IdGeneratorService.generateId(EntityType.PAYOUT);
    }
  }

  @BeforeUpdate()
  updateTimestamps() {
    if (this.status === PayoutStatus.COMPLETED && !this.completedDate) {
      this.completedDate = new Date();
    }
    if (this.status === PayoutStatus.FAILED && !this.failedDate) {
      this.failedDate = new Date();
    }
  }

  // Helper methods
  canBeCompleted(): boolean {
    return this.status === PayoutStatus.PROCESSING;
  }

  canBeFailed(): boolean {
    return this.status === PayoutStatus.PROCESSING;
  }

  canBeReversed(): boolean {
    return this.status === PayoutStatus.COMPLETED;
  }

  isSuccessful(): boolean {
    return this.status === PayoutStatus.COMPLETED;
  }

  isPending(): boolean {
    return this.status === PayoutStatus.PROCESSING;
  }
}

// Wallet Entity
@Entity('partner_wallets')
@Index(['partnerId'], { unique: true })
export class PartnerWalletEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid', { unique: true })
  @Index()
  partnerId: string;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'partnerId' })
  partner: UserEntity;

  @Column('decimal', { precision: 15, scale: 2, default: 0 })
  availableBalance: number;

  @Column('decimal', { precision: 15, scale: 2, default: 0 })
  pendingBalance: number;

  @Column('decimal', { precision: 15, scale: 2, default: 0 })
  totalBalance: number;

  @Column({ length: 3, default: 'INR' })
  currency: string;

  @Column('timestamp', { nullable: true })
  lastTransactionDate?: Date;

  @Column({ length: 20, default: 'active' })
  status: string;

  @Column('boolean', { default: false })
  isBlocked: boolean;

  @Column('text', { nullable: true })
  blockReason?: string;

  @Column('json', { nullable: true })
  metadata?: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => WalletTransactionEntity, (transaction) => transaction.wallet)
  transactions: WalletTransactionEntity[];

  // Helper methods
  canDebit(amount: number): boolean {
    return this.availableBalance >= amount && !this.isBlocked;
  }

  updateBalances() {
    this.totalBalance = this.availableBalance + this.pendingBalance;
  }

  isActive(): boolean {
    return this.status === 'active' && !this.isBlocked;
  }
}

// Wallet Transaction Entity
@Entity('wallet_transactions')
@Index(['walletId', 'type'])
@Index(['partnerId', 'type'])
@Index(['createdAt'])
@Index(['referenceId'])
export class WalletTransactionEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  @Index()
  transactionReference: string;

  @Column('uuid')
  @Index()
  walletId: string;

  @ManyToOne(() => PartnerWalletEntity, (wallet) => wallet.transactions, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'walletId' })
  wallet: PartnerWalletEntity;

  @Column('uuid')
  @Index()
  partnerId: string;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'partnerId' })
  partner: UserEntity;

  @Column({
    type: 'enum',
    enum: WalletTransactionType,
  })
  type: WalletTransactionType;

  @Column('decimal', { precision: 15, scale: 2 })
  amount: number;

  @Column('decimal', { precision: 15, scale: 2 })
  balanceBefore: number;

  @Column('decimal', { precision: 15, scale: 2 })
  balanceAfter: number;

  @Column({ length: 3, default: 'INR' })
  currency: string;

  @Column({ length: 500 })
  description: string;

  @Column({ length: 100, nullable: true })
  @Index()
  referenceId?: string;

  @Column('text', { nullable: true })
  notes?: string;

  @Column('json', { nullable: true })
  metadata?: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @Column('uuid', { nullable: true })
  createdBy?: string;

  @ManyToOne(() => UserEntity, { nullable: true })
  @JoinColumn({ name: 'createdBy' })
  creator?: UserEntity;

  @BeforeInsert()
  generateTransactionReference() {
    if (!this.transactionReference) {
      this.transactionReference = IdGeneratorService.generateId(
        EntityType.WALLET_TRANSACTION,
      );
    }
  }

  // Helper methods
  isCredit(): boolean {
    return [
      WalletTransactionType.CREDIT,
      WalletTransactionType.COMMISSION_EARNED,
      WalletTransactionType.REFUND_RECEIVED,
      WalletTransactionType.BONUS_ADDED,
    ].includes(this.type);
  }

  isDebit(): boolean {
    return [
      WalletTransactionType.DEBIT,
      WalletTransactionType.PAYOUT_DEDUCTED,
      WalletTransactionType.FEE_DEDUCTED,
    ].includes(this.type);
  }
}

// Payout Audit Trail Entity
@Entity('payout_audit_trail')
@Index(['payoutRequestId', 'action'])
@Index(['payoutId', 'action'])
@Index(['performedBy'])
@Index(['createdAt'])
export class PayoutAuditTrailEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid', { nullable: true })
  payoutRequestId?: string;

  @ManyToOne(() => PayoutRequestEntity, (request) => request.auditTrail, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'payoutRequestId' })
  payoutRequest?: PayoutRequestEntity;

  @Column('uuid', { nullable: true })
  payoutId?: string;

  @ManyToOne(() => PayoutEntity, (payout) => payout.auditTrail, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'payoutId' })
  payout?: PayoutEntity;

  @Column({ length: 50 })
  action: string;

  @Column({ length: 50, nullable: true })
  previousStatus?: string;

  @Column({ length: 50, nullable: true })
  newStatus?: string;

  @Column('text', { nullable: true })
  description?: string;

  @Column('json', { nullable: true })
  changes?: Record<string, any>;

  @Column('json', { nullable: true })
  metadata?: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @Column('uuid', { nullable: true })
  performedBy?: string;

  @ManyToOne(() => UserEntity, { nullable: true })
  @JoinColumn({ name: 'performedBy' })
  performer?: UserEntity;

  @Column({ length: 45, nullable: true })
  ipAddress?: string;

  @Column({ length: 500, nullable: true })
  userAgent?: string;
}

// Payout Export Entity
@Entity('payout_exports')
@Index(['exportType'])
@Index(['status'])
@Index(['createdBy'])
@Index(['createdAt'])
export class PayoutExportEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 50 })
  exportType: string;

  @Column({ length: 20 })
  format: string;

  @Column({ length: 20, default: 'pending' })
  status: string;

  @Column({ length: 500, nullable: true })
  fileName?: string;

  @Column({ length: 1000, nullable: true })
  filePath?: string;

  @Column('int', { nullable: true })
  totalRecords?: number;

  @Column('json', { nullable: true })
  filters?: Record<string, any>;

  @Column('json', { nullable: true })
  parameters?: Record<string, any>;

  @Column('timestamp', { nullable: true })
  startedAt?: Date;

  @Column('timestamp', { nullable: true })
  completedAt?: Date;

  @Column('text', { nullable: true })
  errorMessage?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column('uuid')
  createdBy: string;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'createdBy' })
  creator: UserEntity;
}

// Payout Report Entity
@Entity('payout_reports')
@Index(['reportType'])
@Index(['status'])
@Index(['createdBy'])
@Index(['createdAt'])
export class PayoutReportEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 50 })
  reportType: string;

  @Column({ length: 100 })
  reportName: string;

  @Column({ length: 20 })
  format: string;

  @Column({ length: 20, default: 'pending' })
  status: string;

  @Column({ length: 500, nullable: true })
  fileName?: string;

  @Column({ length: 1000, nullable: true })
  filePath?: string;

  @Column('timestamp', { nullable: true })
  dateFrom?: Date;

  @Column('timestamp', { nullable: true })
  dateTo?: Date;

  @Column('json', { nullable: true })
  parameters?: Record<string, any>;

  @Column('json', { nullable: true })
  summary?: Record<string, any>;

  @Column('timestamp', { nullable: true })
  generatedAt?: Date;

  @Column('timestamp', { nullable: true })
  completedAt?: Date;

  @Column('text', { nullable: true })
  errorMessage?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column('uuid')
  createdBy: string;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'createdBy' })
  creator: UserEntity;
}

// Payout Settings Entity
@Entity('payout_settings')
export class PayoutSettingsEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('decimal', { precision: 15, scale: 2, nullable: true })
  minimumPayoutAmount?: number;

  @Column('decimal', { precision: 15, scale: 2, nullable: true })
  maximumPayoutAmount?: number;

  @Column('decimal', { precision: 15, scale: 2, nullable: true })
  autoApprovalThreshold?: number;

  @Column('decimal', { precision: 15, scale: 2, nullable: true })
  processingFee?: number;

  @Column({
    type: 'enum',
    enum: ProcessingFeeType,
    nullable: true,
  })
  processingFeeType?: ProcessingFeeType;

  @Column({
    type: 'enum',
    enum: PayoutSchedule,
    nullable: true,
  })
  payoutSchedule?: PayoutSchedule;

  @Column('simple-array', { nullable: true })
  allowedPayoutMethods?: PayoutMethod[];

  @Column('boolean', { default: true })
  requireBankVerification: boolean;

  @Column('boolean', { default: false })
  autoProcessApprovedPayouts: boolean;

  @Column('json', { nullable: true })
  notificationSettings?: Record<string, any>;

  @Column('json', { nullable: true })
  metadata?: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column('uuid', { nullable: true })
  updatedBy?: string;

  @ManyToOne(() => UserEntity, { nullable: true })
  @JoinColumn({ name: 'updatedBy' })
  updater?: UserEntity;
}
