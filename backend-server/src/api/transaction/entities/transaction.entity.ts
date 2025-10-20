import { UserEntity } from '@/auth/entities/user.entity';
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
import { BookingEntity } from '../../../database/entities/booking.entity';
import {
  EntityType,
  IdGeneratorService,
} from '../../../utils/id-generator.service';
import {
  ExportFormat,
  PaymentMethod,
  ReportType,
  TransactionCategory,
  TransactionStatus,
  TransactionType,
} from '../dto/transaction.dto';

@Entity('transactions')
@Index(['status', 'type', 'category'])
@Index(['userId', 'transactionDate'])
@Index(['partnerId', 'transactionDate'])
@Index(['bookingId'])
@Index(['invoiceId'])
@Index(['transactionReference'], { unique: true })
@Index(['externalTransactionId'])
@Index(['paymentGatewayReference'])
@Index(['bankReference'])
@Index(['transactionDate', 'status'])
@Index(['amount', 'currency'])
export class TransactionEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, length: 50 })
  transactionReference: string;

  @Column({
    type: 'enum',
    enum: TransactionType,
  })
  type: TransactionType;

  @Column({
    type: 'enum',
    enum: TransactionCategory,
  })
  category: TransactionCategory;

  @Column({
    type: 'enum',
    enum: TransactionStatus,
    default: TransactionStatus.PENDING,
  })
  status: TransactionStatus;

  @Column('decimal', { precision: 15, scale: 2 })
  amount: number;

  @Column({ length: 3, default: 'INR' })
  currency: string;

  @Column('text')
  description: string;

  @Column('uuid', { nullable: true })
  userId: string;

  @Column('uuid', { nullable: true })
  partnerId: string;

  @Column('uuid', { nullable: true })
  bookingId: string;

  @Column('uuid', { nullable: true })
  invoiceId: string;

  @Column({
    type: 'enum',
    enum: PaymentMethod,
    nullable: true,
  })
  paymentMethod: PaymentMethod;

  @Column({ length: 255, nullable: true })
  paymentGatewayReference: string;

  @Column({ length: 255, nullable: true })
  bankReference: string;

  @Column({ length: 255, nullable: true })
  externalTransactionId: string;

  @Column('timestamp')
  transactionDate: Date;

  @Column('timestamp', { nullable: true })
  processingDate: Date;

  @Column('timestamp', { nullable: true })
  completionDate: Date;

  @Column('timestamp', { nullable: true })
  reconciliationDate: Date;

  @Column('text', { nullable: true })
  notes: string;

  @Column('text', { nullable: true })
  reconciliationNotes: string;

  @Column('jsonb', { nullable: true })
  metadata: Record<string, any>;

  @Column('uuid', { nullable: true })
  createdBy: string;

  @Column('uuid', { nullable: true })
  updatedBy: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @ManyToOne(() => UserEntity, { nullable: true })
  @JoinColumn({ name: 'userId' })
  user: UserEntity;

  @ManyToOne(() => UserEntity, { nullable: true })
  @JoinColumn({ name: 'partnerId' })
  partner: UserEntity;

  @ManyToOne(() => BookingEntity, { nullable: true })
  @JoinColumn({ name: 'bookingId' })
  booking: BookingEntity;

  @OneToMany(() => TransactionAuditTrailEntity, (audit) => audit.transaction)
  auditTrail: TransactionAuditTrailEntity[];

  // Hooks
  @BeforeInsert()
  generateTransactionReference() {
    if (!this.transactionReference) {
      this.transactionReference = IdGeneratorService.generateId(
        EntityType.TRANSACTION,
      );
    }
    if (!this.transactionDate) {
      this.transactionDate = new Date();
    }
  }

  @BeforeUpdate()
  updateTimestamps() {
    if (this.status === TransactionStatus.PROCESSING && !this.processingDate) {
      this.processingDate = new Date();
    }
    if (this.status === TransactionStatus.COMPLETED && !this.completionDate) {
      this.completionDate = new Date();
    }
    if (this.reconciliationDate && !this.reconciliationNotes) {
      this.reconciliationNotes = 'Auto-reconciled';
    }
  }

  // Helper methods
  isCredit(): boolean {
    return this.type === TransactionType.CREDIT;
  }

  isDebit(): boolean {
    return this.type === TransactionType.DEBIT;
  }

  isCompleted(): boolean {
    return this.status === TransactionStatus.COMPLETED;
  }

  isPending(): boolean {
    return this.status === TransactionStatus.PENDING;
  }

  isFailed(): boolean {
    return this.status === TransactionStatus.FAILED;
  }

  canBeReversed(): boolean {
    return (
      this.status === TransactionStatus.COMPLETED &&
      this.type === TransactionType.DEBIT
    );
  }

  getFormattedAmount(): string {
    return `${this.currency} ${this.amount.toFixed(2)}`;
  }

  getDurationInMinutes(): number {
    if (!this.completionDate) return 0;
    return Math.floor(
      (this.completionDate.getTime() - this.transactionDate.getTime()) /
        (1000 * 60),
    );
  }
}

@Entity('transaction_audit_trail')
@Index(['transactionId', 'createdAt'])
@Index(['action', 'createdAt'])
@Index(['createdBy', 'createdAt'])
export class TransactionAuditTrailEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  transactionId: string;

  @Column({ length: 100 })
  action: string;

  @Column('jsonb', { nullable: true })
  oldValues: Record<string, any>;

  @Column('jsonb', { nullable: true })
  newValues: Record<string, any>;

  @Column('text', { nullable: true })
  reason: string;

  @Column('uuid', { nullable: true })
  createdBy: string;

  @CreateDateColumn()
  createdAt: Date;

  @Column('inet', { nullable: true })
  ipAddress: string;

  @Column({ length: 500, nullable: true })
  userAgent: string;

  // Relations
  @ManyToOne(() => TransactionEntity, (transaction) => transaction.auditTrail)
  @JoinColumn({ name: 'transactionId' })
  transaction: TransactionEntity;

  @ManyToOne(() => UserEntity, { nullable: true })
  @JoinColumn({ name: 'createdBy' })
  creator: UserEntity;
}

@Entity('transaction_exports')
@Index(['status', 'createdAt'])
@Index(['createdBy', 'createdAt'])
@Index(['exportType', 'format'])
export class TransactionExportEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100 })
  exportType: string;

  @Column({
    type: 'enum',
    enum: ExportFormat,
  })
  format: ExportFormat;

  @Column({
    type: 'enum',
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending',
  })
  status: string;

  @Column('jsonb', { nullable: true })
  filters: Record<string, any>;

  @Column('jsonb', { nullable: true })
  parameters: Record<string, any>;

  @Column({ length: 500, nullable: true })
  fileName: string;

  @Column({ length: 1000, nullable: true })
  filePath: string;

  @Column('bigint', { nullable: true })
  fileSize: number;

  @Column('int', { nullable: true })
  recordCount: number;

  @Column('timestamp', { nullable: true })
  startedAt: Date;

  @Column('timestamp', { nullable: true })
  completedAt: Date;

  @Column('text', { nullable: true })
  errorMessage: string;

  @Column('uuid')
  createdBy: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'createdBy' })
  creator: UserEntity;

  // Helper methods
  isCompleted(): boolean {
    return this.status === 'completed';
  }

  isFailed(): boolean {
    return this.status === 'failed';
  }

  getFormattedFileSize(): string {
    if (!this.fileSize) return '0 B';
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(this.fileSize) / Math.log(1024));
    return `${(this.fileSize / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
  }

  getDurationInSeconds(): number {
    if (!this.startedAt || !this.completedAt) return 0;
    return Math.floor(
      (this.completedAt.getTime() - this.startedAt.getTime()) / 1000,
    );
  }
}

@Entity('transaction_reports')
@Index(['reportType', 'createdAt'])
@Index(['status', 'createdAt'])
@Index(['createdBy', 'createdAt'])
export class TransactionReportEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: ReportType,
  })
  reportType: ReportType;

  @Column({ length: 200 })
  reportName: string;

  @Column({
    type: 'enum',
    enum: ExportFormat,
  })
  format: ExportFormat;

  @Column({
    type: 'enum',
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending',
  })
  status: string;

  @Column('timestamp', { nullable: true })
  dateFrom: Date;

  @Column('timestamp', { nullable: true })
  dateTo: Date;

  @Column('jsonb', { nullable: true })
  filters: Record<string, any>;

  @Column('jsonb', { nullable: true })
  parameters: Record<string, any>;

  @Column('jsonb', { nullable: true })
  reportData: Record<string, any>;

  @Column({ length: 500, nullable: true })
  fileName: string;

  @Column({ length: 1000, nullable: true })
  filePath: string;

  @Column('bigint', { nullable: true })
  fileSize: number;

  @Column('timestamp', { nullable: true })
  startedAt: Date;

  @Column('timestamp', { nullable: true })
  completedAt: Date;

  @Column('text', { nullable: true })
  errorMessage: string;

  @Column('uuid')
  createdBy: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'createdBy' })
  creator: UserEntity;

  // Helper methods
  isCompleted(): boolean {
    return this.status === 'completed';
  }

  isFailed(): boolean {
    return this.status === 'failed';
  }

  getDateRange(): string {
    if (!this.dateFrom || !this.dateTo) return 'All time';
    return `${this.dateFrom.toISOString().split('T')[0]} to ${this.dateTo.toISOString().split('T')[0]}`;
  }

  getFormattedFileSize(): string {
    if (!this.fileSize) return '0 B';
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(this.fileSize) / Math.log(1024));
    return `${(this.fileSize / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
  }
}

@Entity('transaction_settings')
export class TransactionSettingsEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('decimal', { precision: 15, scale: 2, nullable: true })
  autoApprovalThreshold: number;

  @Column({ default: true })
  requireApprovalForLargeTransactions: boolean;

  @Column('decimal', { precision: 15, scale: 2, nullable: true })
  largeTransactionThreshold: number;

  @Column({ default: false })
  enableAutoReconciliation: boolean;

  @Column('int', { default: 2555 }) // 7 years
  retentionPeriodDays: number;

  @Column({ length: 3, default: 'INR' })
  defaultCurrency: string;

  @Column('jsonb', { nullable: true })
  supportedCurrencies: string[];

  @Column({ default: true })
  enableNotifications: boolean;

  @Column('jsonb', { nullable: true })
  notificationSettings: {
    emailNotifications?: boolean;
    smsNotifications?: boolean;
    webhookNotifications?: boolean;
    notifyOnStatus?: TransactionStatus[];
    notifyOnAmount?: number;
  };

  @Column('jsonb', { nullable: true })
  fraudDetectionSettings: {
    enableFraudDetection?: boolean;
    maxDailyTransactionAmount?: number;
    maxTransactionCount?: number;
    suspiciousPatternDetection?: boolean;
  };

  @Column('jsonb', { nullable: true })
  additionalSettings: Record<string, any>;

  @Column('uuid', { nullable: true })
  updatedBy: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @ManyToOne(() => UserEntity, { nullable: true })
  @JoinColumn({ name: 'updatedBy' })
  updater: UserEntity;

  // Helper methods
  isAutoApprovalEnabled(): boolean {
    return (
      this.autoApprovalThreshold !== null && this.autoApprovalThreshold > 0
    );
  }

  shouldAutoApprove(amount: number): boolean {
    return this.isAutoApprovalEnabled() && amount <= this.autoApprovalThreshold;
  }

  isLargeTransaction(amount: number): boolean {
    return (
      this.largeTransactionThreshold !== null &&
      amount >= this.largeTransactionThreshold
    );
  }

  isCurrencySupported(currency: string): boolean {
    if (!this.supportedCurrencies || this.supportedCurrencies.length === 0) {
      return currency === this.defaultCurrency;
    }
    return this.supportedCurrencies.includes(currency);
  }

  shouldNotifyForStatus(status: TransactionStatus): boolean {
    if (
      !this.enableNotifications ||
      !this.notificationSettings?.notifyOnStatus
    ) {
      return false;
    }
    return this.notificationSettings.notifyOnStatus.includes(status);
  }

  shouldNotifyForAmount(amount: number): boolean {
    if (
      !this.enableNotifications ||
      !this.notificationSettings?.notifyOnAmount
    ) {
      return false;
    }
    return amount >= this.notificationSettings.notifyOnAmount;
  }
}
