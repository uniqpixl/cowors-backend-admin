import {
  AfterLoad,
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
// import { BookingEntity } from '../../booking/entities/booking.entity';
import { UserEntity } from '@/auth/entities/user.entity';
import {
  ExportFormat,
  ExportStatus,
  PaymentMethod,
  TransactionCategory,
  TransactionStatus,
  TransactionType,
} from '../dto/financial-transaction.dto';

@Entity('financial_transactions')
@Index(['status', 'type', 'category'])
@Index(['userId', 'createdAt'])
@Index(['partnerId', 'createdAt'])
@Index(['bookingId'])
@Index(['transactionDate'])
@Index(['amount'])
@Index(['externalTransactionId'])
@Index(['gatewayTransactionId'])
export class FinancialTransactionEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: TransactionType,
    nullable: false,
  })
  type: TransactionType;

  @Column({
    type: 'enum',
    enum: TransactionCategory,
    nullable: false,
  })
  category: TransactionCategory;

  @Column({
    type: 'enum',
    enum: TransactionStatus,
    default: TransactionStatus.PENDING,
  })
  status: TransactionStatus;

  @Column({
    type: 'decimal',
    precision: 15,
    scale: 2,
    nullable: false,
  })
  amount: number;

  @Column({
    type: 'varchar',
    length: 3,
    default: 'INR',
  })
  currency: string;

  @Column({
    type: 'text',
    nullable: false,
  })
  description: string;

  @Column({
    type: 'enum',
    enum: PaymentMethod,
    nullable: true,
  })
  paymentMethod: PaymentMethod;

  @Column({
    type: 'uuid',
    nullable: true,
  })
  userId: string;

  @Column({
    type: 'uuid',
    nullable: true,
  })
  partnerId: string;

  @Column({
    type: 'uuid',
    nullable: true,
  })
  bookingId: string;

  @Column({
    type: 'uuid',
    nullable: true,
  })
  invoiceId: string;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: true,
    unique: true,
  })
  externalTransactionId: string;

  @Column({
    type: 'varchar',
    length: 100,
    nullable: true,
  })
  paymentGateway: string;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  gatewayTransactionId: string;

  @Column({
    type: 'jsonb',
    nullable: true,
  })
  gatewayResponse: any;

  @Column({
    type: 'decimal',
    precision: 15,
    scale: 2,
    default: 0,
  })
  taxAmount: number;

  @Column({
    type: 'decimal',
    precision: 15,
    scale: 2,
    default: 0,
  })
  feeAmount: number;

  @Column({
    type: 'decimal',
    precision: 15,
    scale: 2,
    nullable: true,
  })
  netAmount: number;

  @Column({
    type: 'text',
    nullable: true,
  })
  notes: string;

  @Column({
    type: 'jsonb',
    nullable: true,
  })
  metadata: any;

  @Column({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
  })
  transactionDate: Date;

  @Column({
    type: 'timestamp',
    nullable: true,
  })
  dueDate: Date;

  @Column({
    type: 'uuid',
    nullable: true,
  })
  createdBy: string;

  @Column({
    type: 'uuid',
    nullable: true,
  })
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

  // @ManyToOne(() => BookingEntity, { nullable: true })
  // @JoinColumn({ name: 'bookingId' })
  // booking: BookingEntity;

  @ManyToOne(() => UserEntity, { nullable: true })
  @JoinColumn({ name: 'createdBy' })
  creator: UserEntity;

  @ManyToOne(() => UserEntity, { nullable: true })
  @JoinColumn({ name: 'updatedBy' })
  updater: UserEntity;

  @OneToMany(() => TransactionAuditTrailEntity, (audit) => audit.transaction)
  auditTrail: TransactionAuditTrailEntity[];

  // Hooks
  @BeforeInsert()
  @BeforeUpdate()
  calculateNetAmount() {
    if (this.amount !== undefined) {
      this.netAmount =
        this.amount - (this.taxAmount || 0) - (this.feeAmount || 0);
    }
  }

  @BeforeInsert()
  setDefaults() {
    if (!this.transactionDate) {
      this.transactionDate = new Date();
    }
    if (!this.currency) {
      this.currency = 'INR';
    }
  }

  // Helper methods
  isCompleted(): boolean {
    return this.status === TransactionStatus.COMPLETED;
  }

  isPending(): boolean {
    return this.status === TransactionStatus.PENDING;
  }

  isFailed(): boolean {
    return this.status === TransactionStatus.FAILED;
  }

  canBeModified(): boolean {
    return [TransactionStatus.PENDING, TransactionStatus.PROCESSING].includes(
      this.status,
    );
  }

  canBeApproved(): boolean {
    return this.status === TransactionStatus.PENDING;
  }

  canBeRejected(): boolean {
    return [TransactionStatus.PENDING, TransactionStatus.PROCESSING].includes(
      this.status,
    );
  }

  canBeCancelled(): boolean {
    return [
      TransactionStatus.PENDING,
      TransactionStatus.PROCESSING,
      TransactionStatus.APPROVED,
    ].includes(this.status);
  }

  getTotalAmount(): number {
    return this.amount + (this.taxAmount || 0) + (this.feeAmount || 0);
  }

  getFormattedAmount(): string {
    return `${this.currency} ${this.amount.toFixed(2)}`;
  }

  isIncome(): boolean {
    return [
      TransactionType.PAYMENT,
      TransactionType.CREDIT,
      TransactionType.REWARD,
    ].includes(this.type);
  }

  isExpense(): boolean {
    return [
      TransactionType.PAYOUT,
      TransactionType.REFUND,
      TransactionType.FEE,
      TransactionType.TAX,
    ].includes(this.type);
  }
}

@Entity('transaction_audit_trail')
@Index(['transactionId', 'createdAt'])
@Index(['action', 'createdAt'])
export class TransactionAuditTrailEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'uuid',
    nullable: false,
  })
  transactionId: string;

  @Column({
    type: 'varchar',
    length: 50,
    nullable: false,
  })
  action: string;

  @Column({
    type: 'jsonb',
    nullable: true,
  })
  oldValues: any;

  @Column({
    type: 'jsonb',
    nullable: true,
  })
  newValues: any;

  @Column({
    type: 'text',
    nullable: true,
  })
  reason: string;

  @Column({
    type: 'varchar',
    length: 45,
    nullable: true,
  })
  ipAddress: string;

  @Column({
    type: 'text',
    nullable: true,
  })
  userAgent: string;

  @Column({
    type: 'uuid',
    nullable: false,
  })
  performedBy: string;

  @CreateDateColumn()
  createdAt: Date;

  // Relations
  @ManyToOne(
    () => FinancialTransactionEntity,
    (transaction) => transaction.auditTrail,
  )
  @JoinColumn({ name: 'transactionId' })
  transaction: FinancialTransactionEntity;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'performedBy' })
  performer: UserEntity;
}

@Entity('transaction_exports')
@Index(['status', 'createdAt'])
@Index(['createdBy', 'createdAt'])
export class TransactionExportEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'varchar',
    length: 100,
    nullable: false,
  })
  name: string;

  @Column({
    type: 'enum',
    enum: ExportFormat,
    nullable: false,
  })
  format: ExportFormat;

  @Column({
    type: 'enum',
    enum: ExportStatus,
    default: ExportStatus.PENDING,
  })
  status: ExportStatus;

  @Column({
    type: 'jsonb',
    nullable: true,
  })
  filters: any;

  @Column({
    type: 'jsonb',
    nullable: true,
  })
  includeFields: string[];

  @Column({
    type: 'integer',
    default: 0,
  })
  totalRecords: number;

  @Column({
    type: 'varchar',
    length: 500,
    nullable: true,
  })
  filePath: string;

  @Column({
    type: 'varchar',
    length: 500,
    nullable: true,
  })
  downloadUrl: string;

  @Column({
    type: 'bigint',
    nullable: true,
  })
  fileSize: number;

  @Column({
    type: 'timestamp',
    nullable: true,
  })
  completedAt: Date;

  @Column({
    type: 'timestamp',
    nullable: true,
  })
  expiresAt: Date;

  @Column({
    type: 'text',
    nullable: true,
  })
  errorMessage: string;

  @Column({
    type: 'uuid',
    nullable: false,
  })
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
    return this.status === ExportStatus.COMPLETED;
  }

  isFailed(): boolean {
    return this.status === ExportStatus.FAILED;
  }

  isExpired(): boolean {
    return this.expiresAt && new Date() > this.expiresAt;
  }

  getFormattedFileSize(): string {
    if (!this.fileSize) return 'Unknown';

    const units = ['B', 'KB', 'MB', 'GB'];
    let size = this.fileSize;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(2)} ${units[unitIndex]}`;
  }
}

@Entity('transaction_reports')
@Index(['reportType', 'createdAt'])
@Index(['createdBy', 'createdAt'])
export class TransactionReportEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'varchar',
    length: 100,
    nullable: false,
  })
  name: string;

  @Column({
    type: 'varchar',
    length: 50,
    nullable: false,
  })
  reportType: string;

  @Column({
    type: 'jsonb',
    nullable: true,
  })
  parameters: any;

  @Column({
    type: 'jsonb',
    nullable: false,
  })
  data: any;

  @Column({
    type: 'timestamp',
    nullable: false,
  })
  periodStart: Date;

  @Column({
    type: 'timestamp',
    nullable: false,
  })
  periodEnd: Date;

  @Column({
    type: 'uuid',
    nullable: false,
  })
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
  getPeriodDuration(): number {
    return this.periodEnd.getTime() - this.periodStart.getTime();
  }

  getFormattedPeriod(): string {
    const start = this.periodStart.toLocaleDateString();
    const end = this.periodEnd.toLocaleDateString();
    return `${start} - ${end}`;
  }
}

@Entity('transaction_settings')
export class TransactionSettingsEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'decimal',
    precision: 15,
    scale: 2,
    default: 0,
  })
  autoApproveThreshold: number;

  @Column({
    type: 'varchar',
    length: 3,
    default: 'INR',
  })
  defaultCurrency: string;

  @Column({
    type: 'boolean',
    default: true,
  })
  enableNotifications: boolean;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  notificationEmail: string;

  @Column({
    type: 'integer',
    default: 30,
  })
  transactionTimeout: number;

  @Column({
    type: 'integer',
    default: 3,
  })
  maxRetryAttempts: number;

  @Column({
    type: 'boolean',
    default: true,
  })
  enableAuditTrail: boolean;

  @Column({
    type: 'integer',
    default: 365,
  })
  dataRetentionDays: number;

  @Column({
    type: 'uuid',
    nullable: true,
  })
  updatedBy: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @ManyToOne(() => UserEntity, { nullable: true })
  @JoinColumn({ name: 'updatedBy' })
  updater: UserEntity;
}
