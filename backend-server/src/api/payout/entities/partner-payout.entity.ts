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
  ExportStatus,
  PayoutStatus,
  PayoutType,
  WalletTransactionType,
} from '../dto/partner-payout.dto';
import { BankAccountEntity } from './bank-account.entity';

@Entity('payout_requests')
@Index(['partnerId', 'status'])
@Index(['status', 'createdAt'])
@Index(['type', 'amount'])
@Index(['scheduledDate'])
@Index(['priority', 'createdAt'])
export class PayoutRequestEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'partner_id', type: 'uuid' })
  @Index()
  partnerId: string;

  @Column({
    type: 'enum',
    enum: PayoutStatus,
    default: PayoutStatus.PENDING,
  })
  status: PayoutStatus;

  @Column({
    type: 'enum',
    enum: PayoutType,
  })
  type: PayoutType;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  amount: number;

  @Column({ type: 'varchar', length: 3, default: 'INR' })
  currency: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ name: 'bank_account_id', type: 'uuid', nullable: true })
  bankAccountId: string;

  @Column({
    name: 'reference_id',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  @Index()
  referenceId: string;

  @Column({
    name: 'reference_type',
    type: 'varchar',
    length: 100,
    nullable: true,
  })
  referenceType: string;

  @Column({
    name: 'transaction_id',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  @Index()
  transactionId: string;

  @Column({
    name: 'processing_fee',
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
  })
  processingFee: number;

  @Column({
    name: 'net_amount',
    type: 'decimal',
    precision: 12,
    scale: 2,
    nullable: true,
  })
  netAmount: number;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @Column({ name: 'scheduled_date', type: 'timestamp', nullable: true })
  scheduledDate: Date;

  @Column({ name: 'processed_date', type: 'timestamp', nullable: true })
  processedDate: Date;

  @Column({ type: 'int', default: 3 })
  priority: number;

  @Column({ name: 'rejection_reason', type: 'text', nullable: true })
  rejectionReason: string;

  @Column({ name: 'failure_reason', type: 'text', nullable: true })
  failureReason: string;

  @Column({ name: 'retry_count', type: 'int', default: 0 })
  retryCount: number;

  @Column({ name: 'max_retries', type: 'int', default: 3 })
  maxRetries: number;

  @Column({ name: 'next_retry_at', type: 'timestamp', nullable: true })
  nextRetryAt: Date;

  @Column({ name: 'created_by', type: 'uuid', nullable: true })
  createdBy: string;

  @Column({ name: 'updated_by', type: 'uuid', nullable: true })
  updatedBy: string;

  @Column({ name: 'approved_by', type: 'uuid', nullable: true })
  approvedBy: string;

  @Column({ name: 'approved_at', type: 'timestamp', nullable: true })
  approvedAt: Date;

  @Column({ name: 'rejected_by', type: 'uuid', nullable: true })
  rejectedBy: string;

  @Column({ name: 'rejected_at', type: 'timestamp', nullable: true })
  rejectedAt: Date;

  @Column({ name: 'cancelled_date', type: 'timestamp', nullable: true })
  cancelledDate: Date;

  @Column({ name: 'cancellation_reason', type: 'text', nullable: true })
  cancellationReason: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relations
  @ManyToOne(() => UserEntity, { eager: false })
  @JoinColumn({ name: 'partner_id' })
  partner: UserEntity;

  @ManyToOne(() => BankAccountEntity, { eager: false })
  @JoinColumn({ name: 'bank_account_id' })
  bankAccount: BankAccountEntity;

  @ManyToOne(() => UserEntity, { eager: false })
  @JoinColumn({ name: 'created_by' })
  creator: UserEntity;

  @ManyToOne(() => UserEntity, { eager: false })
  @JoinColumn({ name: 'updated_by' })
  updater: UserEntity;

  @ManyToOne(() => UserEntity, { eager: false })
  @JoinColumn({ name: 'approved_by' })
  approver: UserEntity;

  @ManyToOne(() => UserEntity, { eager: false })
  @JoinColumn({ name: 'rejected_by' })
  rejector: UserEntity;

  @OneToMany(() => PayoutAuditTrailEntity, (audit) => audit.payoutRequest)
  auditTrail: PayoutAuditTrailEntity[];

  // Hooks
  @BeforeInsert()
  @BeforeUpdate()
  calculateNetAmount() {
    if (this.amount && this.processingFee !== undefined) {
      this.netAmount = this.amount - this.processingFee;
    }
  }

  @BeforeInsert()
  setDefaults() {
    if (!this.currency) {
      this.currency = 'INR';
    }
    if (!this.priority) {
      this.priority = 3;
    }
  }

  // Helper methods
  canBeApproved(): boolean {
    return this.status === PayoutStatus.PENDING;
  }

  canBeRejected(): boolean {
    return [PayoutStatus.PENDING, PayoutStatus.APPROVED].includes(this.status);
  }

  canBeProcessed(): boolean {
    return this.status === PayoutStatus.APPROVED;
  }

  canBeCancelled(): boolean {
    return [PayoutStatus.PENDING, PayoutStatus.APPROVED].includes(this.status);
  }

  canBeRetried(): boolean {
    return (
      this.status === PayoutStatus.FAILED && this.retryCount < this.maxRetries
    );
  }

  isOverdue(): boolean {
    if (!this.scheduledDate) return false;
    return (
      new Date() > this.scheduledDate && this.status === PayoutStatus.APPROVED
    );
  }

  getStatusColor(): string {
    const colors = {
      [PayoutStatus.PENDING]: '#FFA500',
      [PayoutStatus.APPROVED]: '#4CAF50',
      [PayoutStatus.REJECTED]: '#F44336',
      [PayoutStatus.PROCESSING]: '#2196F3',
      [PayoutStatus.COMPLETED]: '#4CAF50',
      [PayoutStatus.FAILED]: '#F44336',
      [PayoutStatus.CANCELLED]: '#9E9E9E',
    };
    return colors[this.status] || '#9E9E9E';
  }

  getFormattedAmount(): string {
    return `${this.currency} ${this.amount.toFixed(2)}`;
  }

  getDaysOverdue(): number {
    if (!this.isOverdue()) return 0;
    const diffTime = Math.abs(
      new Date().getTime() - this.scheduledDate.getTime(),
    );
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
}

@Entity('payout_audit_trail')
@Index(['payoutRequestId', 'createdAt'])
@Index(['action', 'createdAt'])
@Index(['performedBy'])
export class PayoutAuditTrailEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'payout_request_id', type: 'uuid' })
  @Index()
  payoutRequestId: string;

  @Column({ type: 'varchar', length: 100 })
  action: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ name: 'old_values', type: 'jsonb', nullable: true })
  oldValues: Record<string, any>;

  @Column({ name: 'new_values', type: 'jsonb', nullable: true })
  newValues: Record<string, any>;

  @Column({ type: 'text', nullable: true })
  reason: string;

  @Column({ name: 'performed_by', type: 'uuid' })
  performedBy: string;

  @Column({ name: 'ip_address', type: 'varchar', length: 45, nullable: true })
  ipAddress: string;

  @Column({ name: 'user_agent', type: 'text', nullable: true })
  userAgent: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  // Relations
  @ManyToOne(() => PayoutRequestEntity, (payout) => payout.auditTrail)
  @JoinColumn({ name: 'payout_request_id' })
  payoutRequest: PayoutRequestEntity;

  @ManyToOne(() => UserEntity, { eager: false })
  @JoinColumn({ name: 'performed_by' })
  performer: UserEntity;

  // Helper methods
  getFormattedAction(): string {
    return this.action.replace(/_/g, ' ').toUpperCase();
  }

  hasChanges(): boolean {
    return !!(this.oldValues || this.newValues);
  }
}

@Entity('payout_exports')
@Index(['status', 'createdAt'])
@Index(['format'])
@Index(['createdBy'])
export class PayoutExportEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  name: string;

  @Column({ type: 'varchar', length: 20 })
  format: string;

  @Column({
    type: 'enum',
    enum: ExportStatus,
    default: ExportStatus.PENDING,
  })
  status: ExportStatus;

  @Column({ type: 'jsonb', nullable: true })
  filters: Record<string, any>;

  @Column({ name: 'include_fields', type: 'jsonb', nullable: true })
  includeFields: string[];

  @Column({ name: 'total_records', type: 'int', nullable: true })
  totalRecords: number;

  @Column({ name: 'processed_records', type: 'int', default: 0 })
  processedRecords: number;

  @Column({ name: 'file_path', type: 'varchar', length: 500, nullable: true })
  filePath: string;

  @Column({ name: 'file_size', type: 'bigint', nullable: true })
  fileSize: number;

  @Column({ name: 'download_url', type: 'text', nullable: true })
  downloadUrl: string;

  @Column({ name: 'download_expires_at', type: 'timestamp', nullable: true })
  downloadExpiresAt: Date;

  @Column({ name: 'error_message', type: 'text', nullable: true })
  errorMessage: string;

  @Column({ name: 'created_by', type: 'uuid' })
  createdBy: string;

  @Column({ name: 'started_at', type: 'timestamp', nullable: true })
  startedAt: Date;

  @Column({ name: 'completed_at', type: 'timestamp', nullable: true })
  completedAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relations
  @ManyToOne(() => UserEntity, { eager: false })
  @JoinColumn({ name: 'created_by' })
  creator: UserEntity;

  // Helper methods
  getProgress(): number {
    if (!this.totalRecords || this.totalRecords === 0) return 0;
    return Math.round((this.processedRecords / this.totalRecords) * 100);
  }

  isDownloadable(): boolean {
    return (
      this.status === ExportStatus.COMPLETED &&
      this.downloadUrl &&
      this.downloadExpiresAt &&
      new Date() < this.downloadExpiresAt
    );
  }

  getFormattedFileSize(): string {
    if (!this.fileSize) return 'Unknown';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(this.fileSize) / Math.log(1024));
    return (
      Math.round((this.fileSize / Math.pow(1024, i)) * 100) / 100 +
      ' ' +
      sizes[i]
    );
  }

  getDurationInMinutes(): number {
    if (!this.startedAt || !this.completedAt) return 0;
    return Math.round(
      (this.completedAt.getTime() - this.startedAt.getTime()) / (1000 * 60),
    );
  }
}

@Entity('payout_reports')
@Index(['reportType', 'createdAt'])
@Index(['period'])
@Index(['createdBy'])
export class PayoutReportEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'report_type', type: 'varchar', length: 100 })
  reportType: string;

  @Column({ type: 'varchar', length: 50 })
  period: string;

  @Column({ name: 'start_date', type: 'date' })
  startDate: Date;

  @Column({ name: 'end_date', type: 'date' })
  endDate: Date;

  @Column({ type: 'jsonb' })
  data: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  filters: Record<string, any>;

  @Column({ name: 'total_records', type: 'int' })
  totalRecords: number;

  @Column({ name: 'total_amount', type: 'decimal', precision: 15, scale: 2 })
  totalAmount: number;

  @Column({ name: 'created_by', type: 'uuid' })
  createdBy: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relations
  @ManyToOne(() => UserEntity, { eager: false })
  @JoinColumn({ name: 'created_by' })
  creator: UserEntity;

  // Helper methods
  getFormattedPeriod(): string {
    return `${this.startDate.toLocaleDateString()} - ${this.endDate.toLocaleDateString()}`;
  }

  getFormattedAmount(): string {
    return `INR ${this.totalAmount.toFixed(2)}`;
  }
}

@Entity('payout_settings')
export class PayoutSettingsEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    name: 'min_payout_amount',
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 100,
  })
  minPayoutAmount: number;

  @Column({
    name: 'max_payout_amount',
    type: 'decimal',
    precision: 12,
    scale: 2,
    default: 100000,
  })
  maxPayoutAmount: number;

  @Column({
    name: 'auto_approve_threshold',
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 1000,
  })
  autoApproveThreshold: number;

  @Column({
    name: 'default_currency',
    type: 'varchar',
    length: 3,
    default: 'INR',
  })
  defaultCurrency: string;

  @Column({ name: 'enable_notifications', type: 'boolean', default: true })
  enableNotifications: boolean;

  @Column({
    name: 'notification_email',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  notificationEmail: string;

  @Column({ name: 'processing_timeout', type: 'int', default: 60 })
  processingTimeout: number;

  @Column({ name: 'max_retry_attempts', type: 'int', default: 3 })
  maxRetryAttempts: number;

  @Column({ name: 'enable_audit_trail', type: 'boolean', default: true })
  enableAuditTrail: boolean;

  @Column({ name: 'data_retention_days', type: 'int', default: 365 })
  dataRetentionDays: number;

  @Column({
    name: 'business_days',
    type: 'jsonb',
    default: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
  })
  businessDays: string[];

  @Column({ name: 'processing_start_time', type: 'time', nullable: true })
  processingStartTime: string;

  @Column({ name: 'processing_end_time', type: 'time', nullable: true })
  processingEndTime: string;

  @Column({ name: 'updated_by', type: 'uuid', nullable: true })
  updatedBy: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relations
  @ManyToOne(() => UserEntity, { eager: false })
  @JoinColumn({ name: 'updated_by' })
  updater: UserEntity;

  // Helper methods
  isWithinProcessingHours(): boolean {
    if (!this.processingStartTime || !this.processingEndTime) return true;

    const now = new Date();
    const currentTime = now.toTimeString().slice(0, 5);

    return (
      currentTime >= this.processingStartTime &&
      currentTime <= this.processingEndTime
    );
  }

  isBusinessDay(date: Date = new Date()): boolean {
    const dayNames = [
      'sunday',
      'monday',
      'tuesday',
      'wednesday',
      'thursday',
      'friday',
      'saturday',
    ];
    const dayName = dayNames[date.getDay()];
    return this.businessDays.includes(dayName);
  }

  canProcessPayouts(): boolean {
    return this.isBusinessDay() && this.isWithinProcessingHours();
  }

  getFormattedProcessingWindow(): string {
    if (!this.processingStartTime || !this.processingEndTime) return '24/7';
    return `${this.processingStartTime} - ${this.processingEndTime}`;
  }
}

// Re-export entities for other modules
export { BankAccountEntity };

// Import and re-export PartnerWalletEntity and WalletTransactionEntity from payout.entity.ts
export { PartnerWalletEntity, WalletTransactionEntity } from './payout.entity';
