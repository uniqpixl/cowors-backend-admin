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
import { SpaceEntity } from '../../../database/entities/space.entity';
import {
  CommissionRuleType,
  CommissionStatus,
  ExportFormat,
  PaymentStatus,
  ReportType,
} from '../dto/commission.dto';

@Entity('commission_rules')
@Index(['partnerId', 'spaceId'])
@Index(['type', 'isActive'])
@Index(['validFrom', 'validUntil'])
@Index(['priority', 'isActive'])
export class CommissionRuleEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({
    type: 'enum',
    enum: CommissionRuleType,
    default: CommissionRuleType.PERCENTAGE,
  })
  type: CommissionRuleType;

  @Column({ type: 'uuid', nullable: true })
  partnerId: string;

  @Column({ type: 'uuid', nullable: true })
  spaceId: string;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  percentage: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  fixedAmount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  minBookingAmount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  maxBookingAmount: number;

  @Column({ type: 'jsonb', nullable: true })
  tieredRates: {
    minAmount: number;
    maxAmount?: number;
    rate: number;
  }[];

  @Column({ type: 'jsonb', nullable: true })
  performanceRules: {
    metric: string;
    threshold: number;
    bonusPercentage: number;
  }[];

  @Column({ type: 'timestamp', nullable: true })
  validFrom: Date;

  @Column({ type: 'timestamp', nullable: true })
  validUntil: Date;

  @Column({ type: 'int', default: 1 })
  priority: number;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'uuid' })
  createdBy: string;

  @Column({ type: 'uuid', nullable: true })
  updatedBy: string;

  // Relations
  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'partnerId' })
  partner: UserEntity;

  @ManyToOne(() => SpaceEntity)
  @JoinColumn({ name: 'spaceId' })
  space: SpaceEntity;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'createdBy' })
  creator: UserEntity;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'updatedBy' })
  updater: UserEntity;

  @OneToMany(
    () => CommissionCalculationEntity,
    (calculation) => calculation.rule,
  )
  calculations: CommissionCalculationEntity[];

  @OneToMany(() => CommissionAuditTrailEntity, (audit) => audit.ruleId)
  auditTrail: CommissionAuditTrailEntity[];

  // Hooks
  @BeforeInsert()
  @BeforeUpdate()
  validateRule() {
    if (this.type === CommissionRuleType.PERCENTAGE && !this.percentage) {
      throw new Error('Percentage is required for percentage-based rules');
    }
    if (this.type === CommissionRuleType.FIXED_AMOUNT && !this.fixedAmount) {
      throw new Error('Fixed amount is required for fixed amount rules');
    }
    if (
      this.validFrom &&
      this.validUntil &&
      this.validFrom >= this.validUntil
    ) {
      throw new Error('Valid from date must be before valid until date');
    }
  }

  // Helper methods
  isValidForDate(date: Date): boolean {
    const checkDate = date || new Date();
    if (this.validFrom && checkDate < this.validFrom) return false;
    if (this.validUntil && checkDate > this.validUntil) return false;
    return this.isActive;
  }

  isApplicableForBooking(
    bookingAmount: number,
    partnerId?: string,
    spaceId?: string,
  ): boolean {
    if (!this.isActive) return false;
    if (this.partnerId && this.partnerId !== partnerId) return false;
    if (this.spaceId && this.spaceId !== spaceId) return false;
    if (this.minBookingAmount && bookingAmount < this.minBookingAmount)
      return false;
    if (this.maxBookingAmount && bookingAmount > this.maxBookingAmount)
      return false;
    return true;
  }

  calculateCommission(bookingAmount: number): number {
    switch (this.type) {
      case CommissionRuleType.PERCENTAGE:
        return (bookingAmount * this.percentage) / 100;
      case CommissionRuleType.FIXED_AMOUNT:
        return this.fixedAmount;
      case CommissionRuleType.TIERED:
        return this.calculateTieredCommission(bookingAmount);
      default:
        return 0;
    }
  }

  private calculateTieredCommission(bookingAmount: number): number {
    if (!this.tieredRates || this.tieredRates.length === 0) return 0;

    for (const tier of this.tieredRates) {
      if (
        bookingAmount >= tier.minAmount &&
        (!tier.maxAmount || bookingAmount <= tier.maxAmount)
      ) {
        return (bookingAmount * tier.rate) / 100;
      }
    }
    return 0;
  }
}

@Entity('commission_calculations')
@Index(['bookingId', 'partnerId'])
@Index(['status', 'calculatedAt'])
@Index(['partnerId', 'status'])
@Index(['ruleId', 'status'])
export class CommissionCalculationEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  bookingId: string;

  @Column({ type: 'uuid' })
  partnerId: string;

  @Column({ type: 'uuid' })
  ruleId: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  bookingAmount: number;

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  commissionRate: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  commissionAmount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  bonusAmount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  totalCommission: number;

  @Column({
    type: 'enum',
    enum: CommissionStatus,
    default: CommissionStatus.PENDING,
  })
  status: CommissionStatus;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'text', nullable: true })
  statusReason: string;

  @Column({ type: 'jsonb' })
  calculationBreakdown: {
    baseCommission: number;
    performanceBonus?: number;
    adjustments?: {
      type: string;
      amount: number;
      reason: string;
    }[];
  };

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  calculatedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  approvedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'uuid' })
  createdBy: string;

  @Column({ type: 'uuid', nullable: true })
  approvedBy: string;

  // Relations
  @ManyToOne(() => BookingEntity)
  @JoinColumn({ name: 'bookingId' })
  booking: BookingEntity;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'partnerId' })
  partner: UserEntity;

  @ManyToOne(() => CommissionRuleEntity)
  @JoinColumn({ name: 'ruleId' })
  rule: CommissionRuleEntity;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'createdBy' })
  creator: UserEntity;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'approvedBy' })
  approver: UserEntity;

  @OneToMany(() => CommissionPaymentEntity, (payment) => payment.calculations)
  payments: CommissionPaymentEntity[];

  @OneToMany(() => CommissionAuditTrailEntity, (audit) => audit.calculationId)
  auditTrail: CommissionAuditTrailEntity[];

  // Hooks
  @BeforeInsert()
  @BeforeUpdate()
  calculateTotalCommission() {
    this.totalCommission = this.commissionAmount + (this.bonusAmount || 0);
  }

  // Helper methods
  canBeApproved(): boolean {
    return this.status === CommissionStatus.CALCULATED;
  }

  canBeRejected(): boolean {
    return [CommissionStatus.CALCULATED, CommissionStatus.PENDING].includes(
      this.status,
    );
  }

  canBePaid(): boolean {
    return this.status === CommissionStatus.APPROVED;
  }

  approve(approvedBy: string, reason?: string): void {
    if (!this.canBeApproved()) {
      throw new Error(
        'Commission calculation cannot be approved in current status',
      );
    }
    this.status = CommissionStatus.APPROVED;
    this.approvedBy = approvedBy;
    this.approvedAt = new Date();
    if (reason) this.statusReason = reason;
  }

  reject(rejectedBy: string, reason: string): void {
    if (!this.canBeRejected()) {
      throw new Error(
        'Commission calculation cannot be rejected in current status',
      );
    }
    this.status = CommissionStatus.REJECTED;
    this.approvedBy = rejectedBy;
    this.statusReason = reason;
  }
}

@Entity('commission_payments')
@Index(['partnerId', 'status'])
@Index(['status', 'scheduledDate'])
@Index(['createdAt', 'status'])
export class CommissionPaymentEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  partnerId: string;

  @Column({ type: 'uuid', array: true })
  calculationIds: string[];

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  totalAmount: number;

  @Column({
    type: 'enum',
    enum: PaymentStatus,
    default: PaymentStatus.PENDING,
  })
  status: PaymentStatus;

  @Column({ type: 'varchar', length: 100, nullable: true })
  paymentMethod: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  paymentReference: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  transactionReference: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'text', nullable: true })
  failureReason: string;

  @Column({ type: 'timestamp', nullable: true })
  scheduledDate: Date;

  @Column({ type: 'timestamp', nullable: true })
  processedDate: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'uuid' })
  createdBy: string;

  @Column({ type: 'uuid', nullable: true })
  updatedBy: string;

  // Relations
  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'partnerId' })
  partner: UserEntity;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'createdBy' })
  creator: UserEntity;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'updatedBy' })
  updater: UserEntity;

  @OneToMany(
    () => CommissionCalculationEntity,
    (calculation) => calculation.payments,
  )
  calculations: CommissionCalculationEntity[];

  @OneToMany(() => CommissionAuditTrailEntity, (audit) => audit.paymentId)
  auditTrail: CommissionAuditTrailEntity[];

  // Helper methods
  canBeProcessed(): boolean {
    return [PaymentStatus.PENDING, PaymentStatus.FAILED].includes(this.status);
  }

  canBeCancelled(): boolean {
    return [PaymentStatus.PENDING, PaymentStatus.PROCESSING].includes(
      this.status,
    );
  }

  markAsProcessing(updatedBy: string): void {
    if (!this.canBeProcessed()) {
      throw new Error('Payment cannot be processed in current status');
    }
    this.status = PaymentStatus.PROCESSING;
    this.updatedBy = updatedBy;
  }

  markAsCompleted(transactionRef: string, updatedBy: string): void {
    this.status = PaymentStatus.COMPLETED;
    this.transactionReference = transactionRef;
    this.processedDate = new Date();
    this.updatedBy = updatedBy;
  }

  markAsFailed(reason: string, updatedBy: string): void {
    this.status = PaymentStatus.FAILED;
    this.failureReason = reason;
    this.updatedBy = updatedBy;
  }

  cancel(reason: string, updatedBy: string): void {
    if (!this.canBeCancelled()) {
      throw new Error('Payment cannot be cancelled in current status');
    }
    this.status = PaymentStatus.CANCELLED;
    this.failureReason = reason;
    this.updatedBy = updatedBy;
  }
}

@Entity('commission_audit_trail')
@Index(['entityType', 'action'])
@Index(['action', 'createdAt'])
@Index(['userId', 'createdAt'])
export class CommissionAuditTrailEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 50 })
  entityType: string; // 'rule', 'calculation', 'payment'

  @Column({ type: 'uuid', nullable: true })
  ruleId: string;

  @Column({ type: 'uuid', nullable: true })
  calculationId: string;

  @Column({ type: 'uuid', nullable: true })
  paymentId: string;

  @Column({ type: 'varchar', length: 100 })
  action: string;

  @Column({ type: 'jsonb', nullable: true })
  oldValues: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  newValues: Record<string, any>;

  @Column({ type: 'text', nullable: true })
  reason: string;

  @Column({ type: 'varchar', length: 45, nullable: true })
  ipAddress: string;

  @Column({ type: 'text', nullable: true })
  userAgent: string;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ type: 'uuid' })
  userId: string;

  // Relations
  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'userId' })
  user: UserEntity;

  @ManyToOne(() => CommissionRuleEntity)
  @JoinColumn({ name: 'ruleId' })
  rule: CommissionRuleEntity;

  @ManyToOne(() => CommissionCalculationEntity)
  @JoinColumn({ name: 'calculationId' })
  calculation: CommissionCalculationEntity;

  @ManyToOne(() => CommissionPaymentEntity)
  @JoinColumn({ name: 'paymentId' })
  payment: CommissionPaymentEntity;
}

@Entity('commission_exports')
@Index(['status', 'createdAt'])
@Index(['exportType', 'createdAt'])
export class CommissionExportEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100 })
  exportType: string;

  @Column({
    type: 'enum',
    enum: ExportFormat,
  })
  format: ExportFormat;

  @Column({ type: 'varchar', length: 50, default: 'pending' })
  status: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  filePath: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  fileName: string;

  @Column({ type: 'int', nullable: true })
  recordCount: number;

  @Column({ type: 'jsonb', nullable: true })
  filters: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  parameters: Record<string, any>;

  @Column({ type: 'text', nullable: true })
  errorMessage: string;

  @Column({ type: 'timestamp', nullable: true })
  completedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  expiresAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'uuid' })
  createdBy: string;

  // Relations
  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'createdBy' })
  creator: UserEntity;

  // Helper methods
  isExpired(): boolean {
    return this.expiresAt && new Date() > this.expiresAt;
  }

  markAsCompleted(filePath: string, recordCount: number): void {
    this.status = 'completed';
    this.filePath = filePath;
    this.recordCount = recordCount;
    this.completedAt = new Date();
  }

  markAsFailed(errorMessage: string): void {
    this.status = 'failed';
    this.errorMessage = errorMessage;
  }
}

@Entity('commission_reports')
@Index(['reportType', 'createdAt'])
@Index(['status', 'createdAt'])
export class CommissionReportEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: ReportType,
  })
  reportType: ReportType;

  @Column({
    type: 'enum',
    enum: ExportFormat,
  })
  format: ExportFormat;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'varchar', length: 50, default: 'pending' })
  status: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  filePath: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  fileName: string;

  @Column({ type: 'jsonb', nullable: true })
  filters: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  parameters: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  reportData: Record<string, any>;

  @Column({ type: 'text', nullable: true })
  errorMessage: string;

  @Column({ type: 'timestamp', nullable: true })
  completedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  expiresAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'uuid' })
  createdBy: string;

  // Relations
  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'createdBy' })
  creator: UserEntity;

  // Helper methods
  isExpired(): boolean {
    return this.expiresAt && new Date() > this.expiresAt;
  }

  markAsCompleted(filePath: string, reportData: Record<string, any>): void {
    this.status = 'completed';
    this.filePath = filePath;
    this.reportData = reportData;
    this.completedAt = new Date();
  }

  markAsFailed(errorMessage: string): void {
    this.status = 'failed';
    this.errorMessage = errorMessage;
  }
}

@Entity('commission_settings')
export class CommissionSettingsEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  defaultCommissionPercentage: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  minimumPayoutAmount: number;

  @Column({ type: 'int', nullable: true })
  paymentProcessingDays: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  autoApprovalThreshold: number;

  @Column({ type: 'boolean', default: false })
  requireManualApproval: boolean;

  @Column({ type: 'boolean', default: false })
  enablePerformanceBonuses: boolean;

  @Column({ type: 'boolean', default: true })
  calculationNotificationsEnabled: boolean;

  @Column({ type: 'boolean', default: true })
  paymentNotificationsEnabled: boolean;

  @Column({ type: 'int', nullable: true })
  latePaymentReminderDays: number;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'uuid' })
  createdBy: string;

  @Column({ type: 'uuid', nullable: true })
  updatedBy: string;

  // Relations
  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'createdBy' })
  creator: UserEntity;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'updatedBy' })
  updater: UserEntity;
}
