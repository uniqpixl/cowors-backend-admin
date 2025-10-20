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
import {
  ComplianceStatus,
  DeadlineStatus,
  DeadlineType,
  ExportFormat,
  ExportStatus,
  TaxCategory,
  TaxCollectionStatus,
  TaxPeriod,
  TaxRuleStatus,
  TaxType,
} from '../dto/tax-management.dto';

@Entity('tax_rules')
@Index(['taxType', 'category'])
@Index(['status', 'effectiveFrom', 'effectiveUntil'])
@Index(['applicableRegions'], { where: 'applicable_regions IS NOT NULL' })
export class TaxRuleEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({
    type: 'enum',
    enum: TaxType,
  })
  taxType: TaxType;

  @Column({
    type: 'enum',
    enum: TaxCategory,
  })
  category: TaxCategory;

  @Column({ type: 'decimal', precision: 8, scale: 4 })
  rate: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  minAmount: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  maxAmount: number;

  @Column({ type: 'json', nullable: true })
  applicableRegions: string[];

  @Column({ type: 'timestamp', nullable: true })
  effectiveFrom: Date;

  @Column({ type: 'timestamp', nullable: true })
  effectiveUntil: Date;

  @Column({ type: 'json', nullable: true })
  conditions: Record<string, any>;

  @Column({
    type: 'enum',
    enum: TaxRuleStatus,
    default: TaxRuleStatus.DRAFT,
  })
  status: TaxRuleStatus;

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

  @OneToMany(() => TaxCollectionEntity, (collection) => collection.taxRule)
  collections: TaxCollectionEntity[];

  @OneToMany(() => TaxAuditTrailEntity, (audit) => audit.taxRule)
  auditTrail: TaxAuditTrailEntity[];

  // Hooks
  @BeforeInsert()
  @BeforeUpdate()
  validateDates() {
    if (this.effectiveFrom && this.effectiveUntil) {
      if (this.effectiveFrom >= this.effectiveUntil) {
        throw new Error(
          'Effective from date must be before effective until date',
        );
      }
    }
  }

  // Helper methods
  isActive(): boolean {
    const now = new Date();
    return (
      this.status === TaxRuleStatus.ACTIVE &&
      (!this.effectiveFrom || this.effectiveFrom <= now) &&
      (!this.effectiveUntil || this.effectiveUntil > now)
    );
  }

  isApplicableForRegion(region: string): boolean {
    return !this.applicableRegions || this.applicableRegions.includes(region);
  }

  isApplicableForAmount(amount: number): boolean {
    const minCheck = !this.minAmount || amount >= this.minAmount;
    const maxCheck = !this.maxAmount || amount <= this.maxAmount;
    return minCheck && maxCheck;
  }

  calculateTax(baseAmount: number): number {
    return (baseAmount * this.rate) / 100;
  }
}

@Entity('tax_collections')
@Index(['transactionId'])
@Index(['status', 'taxPeriod'])
@Index(['periodStart', 'periodEnd'])
@Index(['createdAt'])
export class TaxCollectionEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  transactionId: string;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  baseAmount: number;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  taxAmount: number;

  @Column({
    type: 'enum',
    enum: TaxPeriod,
  })
  taxPeriod: TaxPeriod;

  @Column({ type: 'timestamp' })
  periodStart: Date;

  @Column({ type: 'timestamp' })
  periodEnd: Date;

  @Column({ type: 'json' })
  appliedRules: string[];

  @Column({
    type: 'enum',
    enum: TaxCollectionStatus,
    default: TaxCollectionStatus.PENDING,
  })
  status: TaxCollectionStatus;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'json', nullable: true })
  metadata: Record<string, any>;

  @Column({ type: 'uuid' })
  createdBy: string;

  @Column({ type: 'uuid', nullable: true })
  updatedBy: string;

  @Column({ type: 'timestamp', nullable: true })
  submittedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  approvedAt: Date;

  @Column({ type: 'uuid', nullable: true })
  taxRuleId: string;

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

  @ManyToOne(() => TaxRuleEntity, (rule) => rule.collections)
  @JoinColumn({ name: 'taxRuleId' })
  taxRule: TaxRuleEntity;

  @OneToMany(() => TaxAuditTrailEntity, (audit) => audit.taxCollection)
  auditTrail: TaxAuditTrailEntity[];

  // Helper methods
  isOverdue(): boolean {
    const now = new Date();
    return this.status === TaxCollectionStatus.PENDING && this.periodEnd < now;
  }

  canBeSubmitted(): boolean {
    return [
      TaxCollectionStatus.CALCULATED,
      TaxCollectionStatus.COLLECTED,
    ].includes(this.status);
  }

  canBeApproved(): boolean {
    return this.status === TaxCollectionStatus.SUBMITTED;
  }

  getTaxRate(): number {
    return this.baseAmount > 0 ? (this.taxAmount / this.baseAmount) * 100 : 0;
  }
}

@Entity('tax_audit_trail')
@Index(['entityId', 'entityType'])
@Index(['performedAt'])
@Index(['performedBy'])
export class TaxAuditTrailEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  entityId: string;

  @Column({ type: 'varchar', length: 100 })
  entityType: string;

  @Column({ type: 'varchar', length: 100 })
  action: string;

  @Column({ type: 'json', nullable: true })
  changes: Record<string, any>;

  @Column({ type: 'json', nullable: true })
  previousValues: Record<string, any>;

  @Column({ type: 'json', nullable: true })
  newValues: Record<string, any>;

  @Column({ type: 'uuid' })
  performedBy: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  performedAt: Date;

  @Column({ type: 'json', nullable: true })
  metadata: Record<string, any>;

  @Column({ type: 'uuid', nullable: true })
  taxRuleId: string;

  @Column({ type: 'uuid', nullable: true })
  taxCollectionId: string;

  // Relations
  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'performedBy' })
  performer: UserEntity;

  @ManyToOne(() => TaxRuleEntity, (rule) => rule.auditTrail)
  @JoinColumn({ name: 'taxRuleId' })
  taxRule: TaxRuleEntity;

  @ManyToOne(() => TaxCollectionEntity, (collection) => collection.auditTrail)
  @JoinColumn({ name: 'taxCollectionId' })
  taxCollection: TaxCollectionEntity;
}

@Entity('tax_exports')
@Index(['status'])
@Index(['createdAt'])
@Index(['createdBy'])
export class TaxExportEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: ExportFormat,
  })
  format: ExportFormat;

  @Column({
    type: 'enum',
    enum: ExportStatus,
    default: ExportStatus.PENDING,
  })
  status: ExportStatus;

  @Column({ type: 'json', nullable: true })
  filters: Record<string, any>;

  @Column({ type: 'varchar', length: 500, nullable: true })
  filePath: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  downloadUrl: string;

  @Column({ type: 'int', default: 0 })
  progress: number;

  @Column({ type: 'timestamp', nullable: true })
  estimatedCompletion: Date;

  @Column({ type: 'timestamp', nullable: true })
  completedAt: Date;

  @Column({ type: 'text', nullable: true })
  errorMessage: string;

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
  isCompleted(): boolean {
    return this.status === ExportStatus.COMPLETED;
  }

  isFailed(): boolean {
    return this.status === ExportStatus.FAILED;
  }

  updateProgress(progress: number): void {
    this.progress = Math.min(100, Math.max(0, progress));
    if (this.progress === 100) {
      this.status = ExportStatus.COMPLETED;
      this.completedAt = new Date();
    }
  }
}

@Entity('tax_reports')
@Index(['type'])
@Index(['status'])
@Index(['generatedAt'])
@Index(['generatedBy'])
export class TaxReportEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 100 })
  type: string;

  @Column({ type: 'timestamp' })
  startDate: Date;

  @Column({ type: 'timestamp' })
  endDate: Date;

  @Column({ type: 'json', nullable: true })
  filters: Record<string, any>;

  @Column({
    type: 'enum',
    enum: ExportFormat,
    default: ExportFormat.PDF,
  })
  format: ExportFormat;

  @Column({ type: 'varchar', length: 100, default: 'pending' })
  status: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  fileUrl: string;

  @Column({ type: 'json', nullable: true })
  reportData: Record<string, any>;

  @Column({ type: 'uuid' })
  generatedBy: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  generatedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'generatedBy' })
  generator: UserEntity;

  // Helper methods
  isReady(): boolean {
    return this.status === 'completed' && !!this.fileUrl;
  }

  getDateRange(): { start: Date; end: Date } {
    return {
      start: this.startDate,
      end: this.endDate,
    };
  }
}

@Entity('tax_deadlines')
@Index(['type'])
@Index(['status'])
@Index(['dueDate'])
export class TaxDeadlineEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({
    type: 'enum',
    enum: DeadlineType,
  })
  type: DeadlineType;

  @Column({ type: 'timestamp' })
  dueDate: Date;

  @Column({
    type: 'enum',
    enum: DeadlineStatus,
    default: DeadlineStatus.UPCOMING,
  })
  status: DeadlineStatus;

  @Column({ type: 'int', default: 7 })
  reminderDays: number;

  @Column({ type: 'boolean', default: false })
  reminderSent: boolean;

  @Column({ type: 'timestamp', nullable: true })
  completedAt: Date;

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

  // Helper methods
  getDaysRemaining(): number {
    const now = new Date();
    const diffTime = this.dueDate.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  isOverdue(): boolean {
    return (
      this.getDaysRemaining() < 0 && this.status !== DeadlineStatus.COMPLETED
    );
  }

  isDueToday(): boolean {
    return (
      this.getDaysRemaining() === 0 && this.status !== DeadlineStatus.COMPLETED
    );
  }

  shouldSendReminder(): boolean {
    const daysRemaining = this.getDaysRemaining();
    return (
      !this.reminderSent &&
      daysRemaining <= this.reminderDays &&
      daysRemaining >= 0 &&
      this.status === DeadlineStatus.UPCOMING
    );
  }

  markCompleted(): void {
    this.status = DeadlineStatus.COMPLETED;
    this.completedAt = new Date();
  }

  updateStatus(): void {
    if (this.status === DeadlineStatus.COMPLETED) {
      return;
    }

    const daysRemaining = this.getDaysRemaining();
    if (daysRemaining < 0) {
      this.status = DeadlineStatus.OVERDUE;
    } else if (daysRemaining === 0) {
      this.status = DeadlineStatus.DUE_TODAY;
    } else {
      this.status = DeadlineStatus.UPCOMING;
    }
  }
}

@Entity('tax_settings')
export class TaxSettingsEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100, default: 'standard' })
  defaultCalculationMethod: string;

  @Column({ type: 'boolean', default: true })
  autoCalculate: boolean;

  @Column({ type: 'boolean', default: false })
  autoSubmit: boolean;

  @Column({
    type: 'enum',
    enum: TaxPeriod,
    default: TaxPeriod.MONTHLY,
  })
  defaultPeriod: TaxPeriod;

  @Column({ type: 'json', nullable: true })
  notifications: Record<string, any>;

  @Column({ type: 'json', nullable: true })
  compliance: Record<string, any>;

  @Column({ type: 'json', nullable: true })
  integrations: Record<string, any>;

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
  getNotificationSetting(key: string): any {
    return this.notifications?.[key];
  }

  getComplianceSetting(key: string): any {
    return this.compliance?.[key];
  }

  updateNotificationSetting(key: string, value: any): void {
    if (!this.notifications) {
      this.notifications = {};
    }
    this.notifications[key] = value;
  }

  updateComplianceSetting(key: string, value: any): void {
    if (!this.compliance) {
      this.compliance = {};
    }
    this.compliance[key] = value;
  }
}

@Entity('tax_compliance_checks')
@Index(['checkDate'])
@Index(['status'])
export class TaxComplianceEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'timestamp' })
  checkDate: Date;

  @Column({
    type: 'enum',
    enum: TaxPeriod,
  })
  period: TaxPeriod;

  @Column({
    type: 'enum',
    enum: ComplianceStatus,
  })
  status: ComplianceStatus;

  @Column({ type: 'int', default: 0 })
  complianceScore: number;

  @Column({ type: 'json', nullable: true })
  issues: {
    type: string;
    severity: string;
    description: string;
    recommendation: string;
  }[];

  @Column({ type: 'json', nullable: true })
  filingStatus: Record<string, any>;

  @Column({ type: 'json', nullable: true })
  paymentStatus: Record<string, any>;

  @Column({ type: 'json', nullable: true })
  recommendations: string[];

  @Column({ type: 'uuid' })
  checkedBy: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'checkedBy' })
  checker: UserEntity;

  // Helper methods
  isCompliant(): boolean {
    return this.status === ComplianceStatus.COMPLIANT;
  }

  hasIssues(): boolean {
    return this.issues && this.issues.length > 0;
  }

  getCriticalIssues(): any[] {
    return this.issues?.filter((issue) => issue.severity === 'critical') || [];
  }

  getComplianceGrade(): string {
    if (this.complianceScore >= 90) return 'A';
    if (this.complianceScore >= 80) return 'B';
    if (this.complianceScore >= 70) return 'C';
    if (this.complianceScore >= 60) return 'D';
    return 'F';
  }
}
