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
  CalculationStatus,
  ComplianceStatus,
  ComplianceType,
  ExportFormat,
  ExportStatus,
  ReturnStatus,
  TaxCategory,
  TaxStatus,
  TaxType,
} from '../dto/tax-gst.dto';

@Entity('tax_rules')
@Index(['type', 'status'])
@Index(['effectiveFrom', 'effectiveTo'])
@Index(['category', 'status'])
@Index(['createdAt'])
export class TaxRuleEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  @Index()
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({
    type: 'enum',
    enum: TaxType,
  })
  type: TaxType;

  @Column({ type: 'decimal', precision: 8, scale: 4 })
  rate: number;

  @Column({
    type: 'enum',
    enum: TaxCategory,
    default: TaxCategory.SERVICES,
  })
  category: TaxCategory;

  @Column({
    type: 'enum',
    enum: TaxStatus,
    default: TaxStatus.ACTIVE,
  })
  @Index()
  status: TaxStatus;

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  minAmount: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  maxAmount: number;

  @Column({ type: 'timestamp', nullable: true })
  effectiveFrom: Date;

  @Column({ type: 'timestamp', nullable: true })
  effectiveTo: Date;

  @Column({ type: 'json', nullable: true })
  hsnSacCodes: string[];

  @Column({ type: 'json', nullable: true })
  applicableStates: string[];

  @Column({ type: 'json', nullable: true })
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

  @OneToMany(() => TaxCalculationEntity, (calculation) => calculation.taxRule)
  calculations: TaxCalculationEntity[];

  // Hooks
  @BeforeInsert()
  @BeforeUpdate()
  validateDates() {
    if (
      this.effectiveFrom &&
      this.effectiveTo &&
      this.effectiveFrom > this.effectiveTo
    ) {
      throw new Error('Effective from date cannot be after effective to date');
    }
  }

  // Helper methods
  isActive(): boolean {
    return this.status === TaxStatus.ACTIVE;
  }

  isEffective(date: Date = new Date()): boolean {
    const effectiveFrom = this.effectiveFrom || new Date(0);
    const effectiveTo = this.effectiveTo || new Date('2099-12-31');
    return date >= effectiveFrom && date <= effectiveTo;
  }

  appliesToHsnSac(code: string): boolean {
    if (!this.hsnSacCodes || this.hsnSacCodes.length === 0) {
      return true; // Apply to all if no specific codes
    }
    return this.hsnSacCodes.includes(code);
  }

  appliesToState(state: string): boolean {
    if (!this.applicableStates || this.applicableStates.length === 0) {
      return true; // Apply to all if no specific states
    }
    return this.applicableStates.includes(state);
  }
}

@Entity('tax_calculations')
@Index(['referenceId', 'referenceType'])
@Index(['taxType', 'status'])
@Index(['transactionDate'])
@Index(['stateCode'])
@Index(['hsnSacCode'])
@Index(['createdAt'])
export class TaxCalculationEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @Index()
  referenceId: string;

  @Column({ type: 'varchar', length: 100 })
  referenceType: string;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  baseAmount: number;

  @Column({
    type: 'enum',
    enum: TaxType,
  })
  taxType: TaxType;

  @Column({ type: 'decimal', precision: 8, scale: 4 })
  taxRate: number;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  taxAmount: number;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  totalAmount: number;

  @Column({
    type: 'enum',
    enum: CalculationStatus,
    default: CalculationStatus.PENDING,
  })
  @Index()
  status: CalculationStatus;

  @Column({ type: 'varchar', length: 20, nullable: true })
  hsnSacCode: string;

  @Column({ type: 'varchar', length: 10, nullable: true })
  stateCode: string;

  @Column({ type: 'varchar', length: 15, nullable: true })
  customerGstNumber: string;

  @Column({ type: 'varchar', length: 15, nullable: true })
  supplierGstNumber: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  placeOfSupply: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  transactionDate: Date;

  @Column({ type: 'json', nullable: true })
  calculationBreakdown: Record<string, any>;

  @Column({ type: 'json', nullable: true })
  calculationParams: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'uuid' })
  createdBy: string;

  @Column({ type: 'uuid', nullable: true })
  updatedBy: string;

  @Column({ type: 'uuid', nullable: true })
  taxRuleId: string;

  // Relations
  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'createdBy' })
  creator: UserEntity;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'updatedBy' })
  updater: UserEntity;

  @ManyToOne(() => TaxRuleEntity, (rule) => rule.calculations)
  @JoinColumn({ name: 'taxRuleId' })
  taxRule: TaxRuleEntity;

  @ManyToOne(() => BookingEntity, { nullable: true })
  @JoinColumn({ name: 'referenceId' })
  booking: BookingEntity;

  // Helper methods
  isCalculated(): boolean {
    return (
      this.status === CalculationStatus.CALCULATED ||
      this.status === CalculationStatus.VERIFIED
    );
  }

  isApplied(): boolean {
    return this.status === CalculationStatus.APPLIED;
  }

  getEffectiveRate(): number {
    return this.taxRate;
  }

  getTaxPercentage(): string {
    return `${this.taxRate}%`;
  }
}

@Entity('tax_returns')
@Index(['returnPeriod', 'returnType'])
@Index(['taxType', 'status'])
@Index(['dueDate'])
@Index(['filedDate'])
@Index(['createdAt'])
export class TaxReturnEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 20 })
  @Index()
  returnPeriod: string;

  @Column({
    type: 'enum',
    enum: ComplianceType,
  })
  returnType: ComplianceType;

  @Column({
    type: 'enum',
    enum: TaxType,
  })
  taxType: TaxType;

  @Column({
    type: 'enum',
    enum: ReturnStatus,
    default: ReturnStatus.DRAFT,
  })
  @Index()
  status: ReturnStatus;

  @Column({ type: 'timestamp' })
  dueDate: Date;

  @Column({ type: 'timestamp', nullable: true })
  filedDate: Date;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  totalTaxLiability: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  totalTaxPaid: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  balanceAmount: number;

  @Column({ type: 'varchar', length: 50, nullable: true })
  acknowledgmentNumber: string;

  @Column({ type: 'json', nullable: true })
  returnData: Record<string, any>;

  @Column({ type: 'json', nullable: true })
  supportingDocuments: string[];

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'text', nullable: true })
  rejectionReason: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'uuid' })
  createdBy: string;

  @Column({ type: 'uuid', nullable: true })
  updatedBy: string;

  @Column({ type: 'uuid', nullable: true })
  approvedBy: string;

  @Column({ type: 'timestamp', nullable: true })
  approvedAt: Date;

  // Relations
  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'createdBy' })
  creator: UserEntity;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'updatedBy' })
  updater: UserEntity;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'approvedBy' })
  approver: UserEntity;

  // Hooks
  @BeforeUpdate()
  updateBalanceAmount() {
    this.balanceAmount = this.totalTaxLiability - this.totalTaxPaid;
  }

  // Helper methods
  isOverdue(): boolean {
    return new Date() > this.dueDate && this.status !== ReturnStatus.FILED;
  }

  isDraft(): boolean {
    return this.status === ReturnStatus.DRAFT;
  }

  isSubmitted(): boolean {
    return this.status === ReturnStatus.SUBMITTED;
  }

  isFiled(): boolean {
    return this.status === ReturnStatus.FILED;
  }

  getDaysUntilDue(): number {
    const today = new Date();
    const diffTime = this.dueDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  getComplianceStatus(): string {
    if (this.isFiled()) return 'Compliant';
    if (this.isOverdue()) return 'Overdue';
    return 'Pending';
  }
}

@Entity('tax_compliance')
@Index(['complianceType', 'taxType'])
@Index(['status', 'dueDate'])
@Index(['compliancePeriod'])
@Index(['createdAt'])
export class TaxComplianceEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: ComplianceType,
  })
  complianceType: ComplianceType;

  @Column({
    type: 'enum',
    enum: TaxType,
  })
  taxType: TaxType;

  @Column({ type: 'varchar', length: 50 })
  @Index()
  compliancePeriod: string;

  @Column({
    type: 'enum',
    enum: ComplianceStatus,
    default: ComplianceStatus.PENDING_REVIEW,
  })
  @Index()
  status: ComplianceStatus;

  @Column({ type: 'timestamp' })
  dueDate: Date;

  @Column({ type: 'timestamp', nullable: true })
  completionDate: Date;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'json', nullable: true })
  requiredDocuments: string[];

  @Column({ type: 'json', nullable: true })
  submittedDocuments: string[];

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  penaltyAmount: number;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'json', nullable: true })
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

  // Helper methods
  isOverdue(): boolean {
    return (
      new Date() > this.dueDate && this.status !== ComplianceStatus.COMPLIANT
    );
  }

  isCompliant(): boolean {
    return this.status === ComplianceStatus.COMPLIANT;
  }

  isPending(): boolean {
    return this.status === ComplianceStatus.PENDING_REVIEW;
  }

  getDaysUntilDue(): number {
    const today = new Date();
    const diffTime = this.dueDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  getDocumentCompletionRate(): number {
    if (!this.requiredDocuments || this.requiredDocuments.length === 0) {
      return 100;
    }
    const submitted = this.submittedDocuments || [];
    return (submitted.length / this.requiredDocuments.length) * 100;
  }
}

@Entity('tax_audit_trail')
@Index(['entityType', 'entityId'])
@Index(['action', 'createdAt'])
@Index(['userId', 'createdAt'])
export class TaxAuditTrailEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 50 })
  @Index()
  entityType: string;

  @Column({ type: 'uuid' })
  @Index()
  entityId: string;

  @Column({ type: 'varchar', length: 100 })
  action: string;

  @Column({ type: 'json', nullable: true })
  oldValues: Record<string, any>;

  @Column({ type: 'json', nullable: true })
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

  // Helper methods
  getChangedFields(): string[] {
    if (!this.oldValues || !this.newValues) {
      return [];
    }
    return Object.keys(this.newValues).filter(
      (key) => this.oldValues[key] !== this.newValues[key],
    );
  }
}

@Entity('tax_exports')
@Index(['status', 'createdAt'])
@Index(['dataType', 'format'])
@Index(['userId', 'createdAt'])
export class TaxExportEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: ExportStatus,
    default: ExportStatus.PENDING,
  })
  @Index()
  status: ExportStatus;

  @Column({
    type: 'enum',
    enum: ExportFormat,
  })
  format: ExportFormat;

  @Column({ type: 'varchar', length: 100 })
  dataType: string;

  @Column({ type: 'json', nullable: true })
  filters: Record<string, any>;

  @Column({ type: 'int', default: 0 })
  totalRecords: number;

  @Column({ type: 'bigint', default: 0 })
  fileSize: number;

  @Column({ type: 'varchar', length: 500, nullable: true })
  filePath: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  downloadUrl: string;

  @Column({ type: 'text', nullable: true })
  errorMessage: string;

  @Column({ type: 'timestamp', nullable: true })
  startedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  completedAt: Date;

  @Column({ type: 'timestamp' })
  expiresAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'uuid' })
  userId: string;

  // Relations
  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'userId' })
  user: UserEntity;

  // Hooks
  @BeforeInsert()
  setExpiryDate() {
    // Set expiry to 7 days from creation
    this.expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  }

  // Helper methods
  isExpired(): boolean {
    return new Date() > this.expiresAt;
  }

  isCompleted(): boolean {
    return this.status === ExportStatus.COMPLETED;
  }

  isFailed(): boolean {
    return this.status === ExportStatus.FAILED;
  }

  getProcessingTime(): number | null {
    if (!this.startedAt || !this.completedAt) {
      return null;
    }
    return this.completedAt.getTime() - this.startedAt.getTime();
  }

  getFileSizeFormatted(): string {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (this.fileSize === 0) return '0 Bytes';
    const i = Math.floor(Math.log(this.fileSize) / Math.log(1024));
    return (
      Math.round((this.fileSize / Math.pow(1024, i)) * 100) / 100 +
      ' ' +
      sizes[i]
    );
  }
}

@Entity('tax_reports')
@Index(['reportType', 'period'])
@Index(['generatedAt'])
@Index(['userId', 'createdAt'])
export class TaxReportEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100 })
  @Index()
  reportType: string;

  @Column({ type: 'varchar', length: 50 })
  period: string;

  @Column({ type: 'timestamp' })
  startDate: Date;

  @Column({ type: 'timestamp' })
  endDate: Date;

  @Column({ type: 'json' })
  reportData: Record<string, any>;

  @Column({ type: 'json', nullable: true })
  parameters: Record<string, any>;

  @Column({ type: 'varchar', length: 500, nullable: true })
  filePath: string;

  @Column({ type: 'timestamp' })
  generatedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ type: 'uuid' })
  userId: string;

  // Relations
  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'userId' })
  user: UserEntity;

  // Helper methods
  isRecent(): boolean {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    return this.generatedAt > oneDayAgo;
  }

  getPeriodDisplay(): string {
    return `${this.startDate.toLocaleDateString()} - ${this.endDate.toLocaleDateString()}`;
  }
}

@Entity('tax_settings')
export class TaxSettingsEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: TaxType,
    default: TaxType.GST,
  })
  defaultTaxType: TaxType;

  @Column({ type: 'varchar', length: 15, nullable: true })
  companyGstNumber: string;

  @Column({ type: 'varchar', length: 10, nullable: true })
  companyPanNumber: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  defaultPlaceOfSupply: string;

  @Column({ type: 'boolean', default: true })
  autoCalculateTaxes: boolean;

  @Column({ type: 'boolean', default: true })
  sendComplianceReminders: boolean;

  @Column({ type: 'int', default: 7 })
  reminderDays: number;

  @Column({ type: 'json', nullable: true })
  additionalSettings: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'uuid', nullable: true })
  updatedBy: string;

  // Relations
  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'updatedBy' })
  updater: UserEntity;

  // Helper methods
  shouldSendReminder(dueDate: Date): boolean {
    if (!this.sendComplianceReminders) {
      return false;
    }
    const reminderDate = new Date(
      dueDate.getTime() - this.reminderDays * 24 * 60 * 60 * 1000,
    );
    const today = new Date();
    return today >= reminderDate && today <= dueDate;
  }

  isValidGstNumber(): boolean {
    if (!this.companyGstNumber) {
      return false;
    }
    // Basic GST number validation (15 characters)
    const gstRegex =
      /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
    return gstRegex.test(this.companyGstNumber);
  }

  isValidPanNumber(): boolean {
    if (!this.companyPanNumber) {
      return false;
    }
    // Basic PAN number validation (10 characters)
    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
    return panRegex.test(this.companyPanNumber);
  }
}
