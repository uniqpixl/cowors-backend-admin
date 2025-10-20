import { UserEntity } from '@/auth/entities/user.entity';
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
import {
  CommissionCalculationStatus,
  CommissionFrequency,
  CommissionPayoutStatus,
  CommissionRuleType,
  ExportType,
  PartnerTier,
  ReportFormat,
  TransactionType,
} from '../dto/commission-tracking.dto';
// Forward reference to avoid circular dependency

@Entity('commission_rules')
@Index(['type', 'isActive'])
@Index(['partnerTier', 'isActive'])
@Index(['startDate', 'endDate'])
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

  @Column({ type: 'decimal', precision: 10, scale: 4 })
  rate: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  minAmount: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  maxAmount: number;

  @Column({
    type: 'enum',
    enum: PartnerTier,
    nullable: true,
  })
  partnerTier: PartnerTier;

  @Column({ type: 'simple-array', nullable: true })
  transactionTypes: TransactionType[];

  @Column({ type: 'json', nullable: true })
  conditions: any;

  @Column({ type: 'timestamp', nullable: true })
  startDate: Date;

  @Column({ type: 'timestamp', nullable: true })
  endDate: Date;

  @Column({ type: 'int', default: 1 })
  priority: number;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'uuid' })
  createdBy: string;

  @Column({ type: 'uuid', nullable: true })
  updatedBy: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
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

  // Hooks
  @BeforeInsert()
  @BeforeUpdate()
  validateDates() {
    if (this.startDate && this.endDate && this.startDate >= this.endDate) {
      throw new Error('Start date must be before end date');
    }
  }

  @BeforeInsert()
  @BeforeUpdate()
  validateAmounts() {
    if (this.minAmount && this.maxAmount && this.minAmount >= this.maxAmount) {
      throw new Error('Minimum amount must be less than maximum amount');
    }
  }

  // Helper methods
  isValidForDate(date: Date): boolean {
    const checkDate = date || new Date();
    if (this.startDate && checkDate < this.startDate) return false;
    if (this.endDate && checkDate > this.endDate) return false;
    return this.isActive;
  }

  isValidForAmount(amount: number): boolean {
    if (this.minAmount && amount < this.minAmount) return false;
    if (this.maxAmount && amount > this.maxAmount) return false;
    return true;
  }

  calculateCommission(amount: number): number {
    if (!this.isValidForAmount(amount)) return 0;

    switch (this.type) {
      case CommissionRuleType.PERCENTAGE:
        return (amount * this.rate) / 100;
      case CommissionRuleType.FIXED:
        return this.rate;
      case CommissionRuleType.TIERED:
        return this.calculateTieredCommission(amount);
      case CommissionRuleType.HYBRID:
        return this.calculateHybridCommission(amount);
      default:
        return 0;
    }
  }

  private calculateTieredCommission(amount: number): number {
    // Implementation for tiered commission calculation
    // This would use the conditions field to define tiers
    if (!this.conditions || !this.conditions.tiers) return 0;

    let commission = 0;
    let remainingAmount = amount;

    for (const tier of this.conditions.tiers) {
      if (remainingAmount <= 0) break;

      const tierAmount = Math.min(
        remainingAmount,
        tier.maxAmount - tier.minAmount,
      );
      commission += (tierAmount * tier.rate) / 100;
      remainingAmount -= tierAmount;
    }

    return commission;
  }

  private calculateHybridCommission(amount: number): number {
    // Implementation for hybrid commission calculation
    // This would combine fixed and percentage components
    if (!this.conditions) return 0;

    const fixedComponent = this.conditions.fixedAmount || 0;
    const percentageComponent = this.conditions.percentageRate
      ? (amount * this.conditions.percentageRate) / 100
      : 0;

    return fixedComponent + percentageComponent;
  }
}

@Entity('commission_calculations')
@Index(['partnerId', 'status'])
@Index(['transactionId'])
@Index(['ruleId'])
@Index(['createdAt'])
@Index(['status', 'createdAt'])
export class CommissionCalculationEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  partnerId: string;

  @Column({ type: 'uuid' })
  transactionId: string;

  @Column({ type: 'uuid' })
  ruleId: string;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  transactionAmount: number;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  commissionAmount: number;

  @Column({ type: 'decimal', precision: 10, scale: 4 })
  rateApplied: number;

  @Column({
    type: 'enum',
    enum: CommissionCalculationStatus,
    default: CommissionCalculationStatus.PENDING,
  })
  status: CommissionCalculationStatus;

  @Column({ type: 'json', nullable: true })
  calculationDetails: any;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'uuid' })
  createdBy: string;

  @Column({ type: 'uuid', nullable: true })
  updatedBy: string;

  @Column({ type: 'timestamp', nullable: true })
  approvedAt: Date;

  @Column({ type: 'uuid', nullable: true })
  approvedBy: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'partnerId' })
  partner: UserEntity;

  @ManyToOne(() => CommissionRuleEntity, (rule) => rule.calculations)
  @JoinColumn({ name: 'ruleId' })
  rule: CommissionRuleEntity;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'createdBy' })
  creator: UserEntity;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'updatedBy' })
  updater: UserEntity;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'approvedBy' })
  approver: UserEntity;

  @OneToMany(
    () => PartnerCommissionEntity,
    (commission) => commission.calculation,
  )
  partnerCommissions: PartnerCommissionEntity[];

  // Helper methods
  canBeApproved(): boolean {
    return this.status === CommissionCalculationStatus.CALCULATED;
  }

  canBeRejected(): boolean {
    return [
      CommissionCalculationStatus.PENDING,
      CommissionCalculationStatus.CALCULATED,
    ].includes(this.status);
  }

  approve(userId: string): void {
    if (!this.canBeApproved()) {
      throw new Error(
        'Commission calculation cannot be approved in current status',
      );
    }
    this.status = CommissionCalculationStatus.APPROVED;
    this.approvedBy = userId;
    this.approvedAt = new Date();
    this.updatedBy = userId;
  }

  reject(userId: string): void {
    if (!this.canBeRejected()) {
      throw new Error(
        'Commission calculation cannot be rejected in current status',
      );
    }
    this.status = CommissionCalculationStatus.REJECTED;
    this.updatedBy = userId;
  }
}

@Entity('partner_commissions')
@Index(['partnerId', 'isPaid'])
@Index(['calculationId'])
@Index(['dueDate'])
@Index(['isPaid', 'dueDate'])
export class PartnerCommissionEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  partnerId: string;

  @Column({ type: 'uuid' })
  calculationId: string;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  amount: number;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'timestamp', nullable: true })
  dueDate: Date;

  @Column({ type: 'boolean', default: false })
  isPaid: boolean;

  @Column({ type: 'timestamp', nullable: true })
  paidDate: Date;

  @Column({ type: 'uuid', nullable: true })
  payoutId: string;

  @Column({ type: 'uuid' })
  createdBy: string;

  @Column({ type: 'uuid', nullable: true })
  updatedBy: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'partnerId' })
  partner: UserEntity;

  @ManyToOne(
    () => CommissionCalculationEntity,
    (calculation) => calculation.partnerCommissions,
  )
  @JoinColumn({ name: 'calculationId' })
  calculation: CommissionCalculationEntity;

  @ManyToOne('CommissionPayoutEntity', (payout: any) => payout.commissions)
  @JoinColumn({ name: 'payoutId' })
  payout: any;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'createdBy' })
  creator: UserEntity;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'updatedBy' })
  updater: UserEntity;

  // Helper methods
  isOverdue(): boolean {
    if (!this.dueDate || this.isPaid) return false;
    return new Date() > this.dueDate;
  }

  markAsPaid(payoutId: string, userId: string): void {
    this.isPaid = true;
    this.paidDate = new Date();
    this.payoutId = payoutId;
    this.updatedBy = userId;
  }

  getDaysUntilDue(): number {
    if (!this.dueDate || this.isPaid) return 0;
    const today = new Date();
    const diffTime = this.dueDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
}

@Entity('commission_exports')
@Index(['createdBy'])
@Index(['createdAt'])
export class CommissionExportEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: ExportType,
  })
  exportType: ExportType;

  @Column({
    type: 'enum',
    enum: ReportFormat,
  })
  format: ReportFormat;

  @Column({ type: 'varchar', length: 255 })
  filename: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  filePath: string;

  @Column({ type: 'json', nullable: true })
  filters: any;

  @Column({ type: 'json', nullable: true })
  metadata: any;

  @Column({ type: 'int', default: 0 })
  recordCount: number;

  @Column({ type: 'bigint', default: 0 })
  fileSize: number;

  @Column({ type: 'varchar', length: 50, default: 'pending' })
  status: string;

  @Column({ type: 'timestamp', nullable: true })
  completedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  expiresAt: Date;

  @Column({ type: 'uuid' })
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
  isExpired(): boolean {
    return this.expiresAt ? new Date() > this.expiresAt : false;
  }

  markAsCompleted(
    filePath: string,
    recordCount: number,
    fileSize: number,
  ): void {
    this.status = 'completed';
    this.filePath = filePath;
    this.recordCount = recordCount;
    this.fileSize = fileSize;
    this.completedAt = new Date();
    // Set expiration to 7 days from completion
    this.expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  }

  markAsFailed(error: string): void {
    this.status = 'failed';
    this.metadata = { ...this.metadata, error };
  }
}

@Entity('commission_reports')
@Index(['createdBy'])
@Index(['createdAt'])
@Index(['reportType'])
export class CommissionReportEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  reportName: string;

  @Column({ type: 'varchar', length: 100 })
  reportType: string;

  @Column({
    type: 'enum',
    enum: ReportFormat,
  })
  format: ReportFormat;

  @Column({ type: 'varchar', length: 255 })
  filename: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  filePath: string;

  @Column({ type: 'json', nullable: true })
  parameters: any;

  @Column({ type: 'json', nullable: true })
  data: any;

  @Column({ type: 'varchar', length: 50, default: 'pending' })
  status: string;

  @Column({ type: 'timestamp', nullable: true })
  generatedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  expiresAt: Date;

  @Column({ type: 'uuid' })
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
  isExpired(): boolean {
    return this.expiresAt ? new Date() > this.expiresAt : false;
  }

  markAsGenerated(filePath: string, data: any): void {
    this.status = 'completed';
    this.filePath = filePath;
    this.data = data;
    this.generatedAt = new Date();
    // Set expiration to 30 days from generation
    this.expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  }

  markAsFailed(error: string): void {
    this.status = 'failed';
    this.data = { error };
  }
}

@Entity('commission_audit_trail')
@Index(['entityType', 'entityId'])
@Index(['action'])
@Index(['userId'])
@Index(['createdAt'])
export class CommissionAuditTrailEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100 })
  entityType: string;

  @Column({ type: 'uuid' })
  entityId: string;

  @Column({ type: 'varchar', length: 100 })
  action: string;

  @Column({ type: 'json', nullable: true })
  oldValues: any;

  @Column({ type: 'json', nullable: true })
  newValues: any;

  @Column({ type: 'json', nullable: true })
  metadata: any;

  @Column({ type: 'varchar', length: 45, nullable: true })
  ipAddress: string;

  @Column({ type: 'text', nullable: true })
  userAgent: string;

  @Column({ type: 'uuid' })
  userId: string;

  @CreateDateColumn()
  createdAt: Date;

  // Relations
  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'userId' })
  user: UserEntity;

  // Helper methods
  static createAuditEntry(
    entityType: string,
    entityId: string,
    action: string,
    userId: string,
    oldValues?: any,
    newValues?: any,
    metadata?: any,
  ): CommissionAuditTrailEntity {
    const audit = new CommissionAuditTrailEntity();
    audit.entityType = entityType;
    audit.entityId = entityId;
    audit.action = action;
    audit.userId = userId;
    audit.oldValues = oldValues;
    audit.newValues = newValues;
    audit.metadata = metadata;
    return audit;
  }
}

@Entity('commission_settings')
export class CommissionSettingsEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'decimal', precision: 10, scale: 4, nullable: true })
  defaultCommissionRate: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  minimumPayoutAmount: number;

  @Column({
    type: 'enum',
    enum: CommissionFrequency,
    nullable: true,
  })
  defaultPayoutFrequency: CommissionFrequency;

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  autoApprovalThreshold: number;

  @Column({ type: 'int', nullable: true })
  calculationDelay: number;

  @Column({ type: 'boolean', default: true })
  enableEmailNotifications: boolean;

  @Column({ type: 'boolean', default: false })
  enableSmsNotifications: boolean;

  @Column({ type: 'decimal', precision: 10, scale: 4, nullable: true })
  taxRate: number;

  @Column({ type: 'json', nullable: true })
  additionalSettings: any;

  @Column({ type: 'uuid' })
  updatedBy: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'updatedBy' })
  updater: UserEntity;

  // Helper methods
  shouldAutoApprove(amount: number): boolean {
    return this.autoApprovalThreshold
      ? amount <= this.autoApprovalThreshold
      : false;
  }

  getCalculationDelayHours(): number {
    return this.calculationDelay || 0;
  }

  calculateTax(amount: number): number {
    return this.taxRate ? (amount * this.taxRate) / 100 : 0;
  }

  getNetCommission(grossAmount: number): number {
    const tax = this.calculateTax(grossAmount);
    return grossAmount - tax;
  }
}
