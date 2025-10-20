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
  ComplianceStatus,
  ExportFormat,
  GSTCategory,
  HSNCategory,
  ReportType,
  TaxPeriod,
  TaxStatus,
  TaxType,
} from '../dto/tax.dto';

@Entity('tax_configurations')
@Index(['taxType', 'isActive'])
@Index(['hsnCode'])
@Index(['stateCode'])
@Index(['effectiveFrom', 'effectiveTo'])
export class TaxConfigurationEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: TaxType,
    comment: 'Type of tax (GST, TCS, TDS, etc.)',
  })
  taxType: TaxType;

  @Column({ length: 100, comment: 'Tax configuration name' })
  name: string;

  @Column({ type: 'text', nullable: true, comment: 'Tax description' })
  description: string;

  @Column({
    type: 'decimal',
    precision: 8,
    scale: 4,
    comment: 'Tax rate percentage',
  })
  rate: number;

  @Column({ length: 10, nullable: true, comment: 'HSN/SAC code' })
  hsnCode: string;

  @Column({
    type: 'enum',
    enum: HSNCategory,
    nullable: true,
    comment: 'HSN category (goods/services)',
  })
  hsnCategory: HSNCategory;

  @Column({
    length: 3,
    nullable: true,
    comment: 'State code for state-specific taxes',
  })
  stateCode: string;

  @Column({
    type: 'decimal',
    precision: 15,
    scale: 2,
    nullable: true,
    comment: 'Minimum threshold amount',
  })
  thresholdAmount: number;

  @Column({
    type: 'decimal',
    precision: 15,
    scale: 2,
    nullable: true,
    comment: 'Maximum threshold amount',
  })
  maxThresholdAmount: number;

  @Column({ type: 'timestamp', nullable: true, comment: 'Effective from date' })
  effectiveFrom: Date;

  @Column({ type: 'timestamp', nullable: true, comment: 'Effective to date' })
  effectiveTo: Date;

  @Column({
    type: 'boolean',
    default: true,
    comment: 'Whether configuration is active',
  })
  isActive: boolean;

  @Column({ type: 'jsonb', nullable: true, comment: 'Additional metadata' })
  metadata: Record<string, any>;

  @CreateDateColumn({ comment: 'Record creation timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ comment: 'Record last update timestamp' })
  updatedAt: Date;

  @Column({ type: 'uuid', nullable: true, comment: 'Created by user ID' })
  createdBy: string;

  @Column({ type: 'uuid', nullable: true, comment: 'Updated by user ID' })
  updatedBy: string;

  // Relationships
  @ManyToOne(() => UserEntity, { nullable: true })
  @JoinColumn({ name: 'createdBy' })
  creator: UserEntity;

  @ManyToOne(() => UserEntity, { nullable: true })
  @JoinColumn({ name: 'updatedBy' })
  updater: UserEntity;

  @OneToMany(
    () => TaxTransactionEntity,
    (transaction) => transaction.taxConfiguration,
  )
  transactions: TaxTransactionEntity[];

  // Helper methods
  isEffective(date: Date = new Date()): boolean {
    const checkDate = date.getTime();
    const fromDate = this.effectiveFrom ? this.effectiveFrom.getTime() : 0;
    const toDate = this.effectiveTo ? this.effectiveTo.getTime() : Infinity;

    return checkDate >= fromDate && checkDate <= toDate;
  }

  isApplicableForAmount(amount: number): boolean {
    if (this.thresholdAmount && amount < this.thresholdAmount) {
      return false;
    }
    if (this.maxThresholdAmount && amount > this.maxThresholdAmount) {
      return false;
    }
    return true;
  }

  calculateTaxAmount(baseAmount: number): number {
    if (!this.isApplicableForAmount(baseAmount)) {
      return 0;
    }
    return (baseAmount * this.rate) / 100;
  }
}

@Entity('tax_transactions')
@Index(['partnerId', 'taxType'])
@Index(['bookingId'])
@Index(['status'])
@Index(['dueDate'])
@Index(['createdAt'])
@Index(['transactionReference'], { unique: true })
export class TaxTransactionEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, comment: 'Unique transaction reference' })
  transactionReference: string;

  @Column({ type: 'uuid', comment: 'Partner ID' })
  partnerId: string;

  @Column({ type: 'uuid', nullable: true, comment: 'Booking ID' })
  bookingId: string;

  @Column({ type: 'uuid', comment: 'Tax configuration ID' })
  taxConfigurationId: string;

  @Column({
    type: 'enum',
    enum: TaxType,
    comment: 'Type of tax',
  })
  taxType: TaxType;

  @Column({
    type: 'enum',
    enum: TaxStatus,
    default: TaxStatus.PENDING,
    comment: 'Tax transaction status',
  })
  status: TaxStatus;

  @Column({
    type: 'decimal',
    precision: 15,
    scale: 2,
    comment: 'Base amount for tax calculation',
  })
  baseAmount: number;

  @Column({
    type: 'decimal',
    precision: 15,
    scale: 2,
    comment: 'Calculated tax amount',
  })
  taxAmount: number;

  @Column({
    type: 'decimal',
    precision: 8,
    scale: 4,
    comment: 'Tax rate applied',
  })
  taxRate: number;

  @Column({ length: 3, default: 'INR', comment: 'Currency code' })
  currency: string;

  @Column({ length: 10, nullable: true, comment: 'HSN/SAC code' })
  hsnCode: string;

  @Column({ type: 'text', nullable: true, comment: 'Transaction description' })
  description: string;

  @Column({ length: 100, nullable: true, comment: 'Payment reference' })
  paymentReference: string;

  @Column({ type: 'timestamp', nullable: true, comment: 'Payment date' })
  paymentDate: Date;

  @Column({
    type: 'timestamp',
    nullable: true,
    comment: 'Due date for payment',
  })
  dueDate: Date;

  @Column({ type: 'text', nullable: true, comment: 'Additional notes' })
  notes: string;

  @Column({ type: 'jsonb', nullable: true, comment: 'Additional metadata' })
  metadata: Record<string, any>;

  @CreateDateColumn({ comment: 'Record creation timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ comment: 'Record last update timestamp' })
  updatedAt: Date;

  @Column({ type: 'uuid', nullable: true, comment: 'Created by user ID' })
  createdBy: string;

  @Column({ type: 'uuid', nullable: true, comment: 'Updated by user ID' })
  updatedBy: string;

  // Relationships
  @ManyToOne(() => UserEntity, { nullable: true })
  @JoinColumn({ name: 'partnerId' })
  partner: UserEntity;

  @ManyToOne(() => BookingEntity, { nullable: true })
  @JoinColumn({ name: 'bookingId' })
  booking: BookingEntity;

  @ManyToOne(() => TaxConfigurationEntity, (config) => config.transactions)
  @JoinColumn({ name: 'taxConfigurationId' })
  taxConfiguration: TaxConfigurationEntity;

  @ManyToOne(() => UserEntity, { nullable: true })
  @JoinColumn({ name: 'createdBy' })
  creator: UserEntity;

  @ManyToOne(() => UserEntity, { nullable: true })
  @JoinColumn({ name: 'updatedBy' })
  updater: UserEntity;

  @OneToMany(() => TaxAuditTrailEntity, (audit) => audit.taxTransaction)
  auditTrail: TaxAuditTrailEntity[];

  // Hooks
  @BeforeInsert()
  generateTransactionReference() {
    if (!this.transactionReference) {
      this.transactionReference = IdGeneratorService.generateId(
        EntityType.TAX_TRANSACTION,
      );
    }
  }

  // Helper methods
  isOverdue(): boolean {
    if (!this.dueDate) return false;
    return new Date() > this.dueDate && this.status !== TaxStatus.PAID;
  }

  isPaid(): boolean {
    return this.status === TaxStatus.PAID;
  }

  canBePaid(): boolean {
    return [
      TaxStatus.PENDING,
      TaxStatus.CALCULATED,
      TaxStatus.COLLECTED,
    ].includes(this.status);
  }

  getTotalAmount(): number {
    return this.baseAmount + this.taxAmount;
  }

  getDaysUntilDue(): number {
    if (!this.dueDate) return Infinity;
    const diffTime = this.dueDate.getTime() - new Date().getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
}

@Entity('tax_compliance')
@Index(['taxType', 'period'])
@Index(['status'])
@Index(['dueDate'])
@Index(['periodStart', 'periodEnd'])
@Index(['complianceReference'], { unique: true })
export class TaxComplianceEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, comment: 'Unique compliance reference' })
  complianceReference: string;

  @Column({
    type: 'enum',
    enum: TaxType,
    comment: 'Type of tax for compliance',
  })
  taxType: TaxType;

  @Column({
    type: 'enum',
    enum: ComplianceStatus,
    default: ComplianceStatus.PENDING,
    comment: 'Compliance status',
  })
  status: ComplianceStatus;

  @Column({
    type: 'enum',
    enum: TaxPeriod,
    comment: 'Compliance period',
  })
  period: TaxPeriod;

  @Column({ type: 'timestamp', comment: 'Period start date' })
  periodStart: Date;

  @Column({ type: 'timestamp', comment: 'Period end date' })
  periodEnd: Date;

  @Column({ type: 'timestamp', comment: 'Compliance due date' })
  dueDate: Date;

  @Column({ type: 'timestamp', nullable: true, comment: 'Completion date' })
  completedDate: Date;

  @Column({ length: 100, nullable: true, comment: 'Filing reference number' })
  filingReference: string;

  @Column({ type: 'text', nullable: true, comment: 'Compliance description' })
  description: string;

  @Column({ type: 'jsonb', nullable: true, comment: 'Required documents list' })
  requiredDocuments: string[];

  @Column({ type: 'text', nullable: true, comment: 'Additional notes' })
  notes: string;

  @Column({ type: 'jsonb', nullable: true, comment: 'Additional metadata' })
  metadata: Record<string, any>;

  @CreateDateColumn({ comment: 'Record creation timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ comment: 'Record last update timestamp' })
  updatedAt: Date;

  @Column({ type: 'uuid', nullable: true, comment: 'Created by user ID' })
  createdBy: string;

  @Column({ type: 'uuid', nullable: true, comment: 'Updated by user ID' })
  updatedBy: string;

  // Relationships
  @ManyToOne(() => UserEntity, { nullable: true })
  @JoinColumn({ name: 'createdBy' })
  creator: UserEntity;

  @ManyToOne(() => UserEntity, { nullable: true })
  @JoinColumn({ name: 'updatedBy' })
  updater: UserEntity;

  @OneToMany(() => TaxAuditTrailEntity, (audit) => audit.taxCompliance)
  auditTrail: TaxAuditTrailEntity[];

  // Hooks
  @BeforeInsert()
  generateComplianceReference() {
    if (!this.complianceReference) {
      this.complianceReference = IdGeneratorService.generateId(
        EntityType.TAX_COMPLIANCE,
      );
    }
  }

  // Helper methods
  isOverdue(): boolean {
    return (
      new Date() > this.dueDate && this.status !== ComplianceStatus.COMPLETED
    );
  }

  isCompleted(): boolean {
    return (
      this.status === ComplianceStatus.COMPLETED ||
      this.status === ComplianceStatus.FILED
    );
  }

  getDaysUntilDue(): number {
    const diffTime = this.dueDate.getTime() - new Date().getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  getPeriodDuration(): number {
    const diffTime = this.periodEnd.getTime() - this.periodStart.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
}

@Entity('tax_audit_trail')
@Index(['taxTransactionId'])
@Index(['taxComplianceId'])
@Index(['action'])
@Index(['createdAt'])
export class TaxAuditTrailEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', nullable: true, comment: 'Tax transaction ID' })
  taxTransactionId: string;

  @Column({ type: 'uuid', nullable: true, comment: 'Tax compliance ID' })
  taxComplianceId: string;

  @Column({ length: 100, comment: 'Action performed' })
  action: string;

  @Column({ type: 'text', nullable: true, comment: 'Action description' })
  description: string;

  @Column({ type: 'jsonb', nullable: true, comment: 'Previous values' })
  previousValues: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true, comment: 'New values' })
  newValues: Record<string, any>;

  @Column({ type: 'inet', nullable: true, comment: 'IP address' })
  ipAddress: string;

  @Column({ length: 500, nullable: true, comment: 'User agent' })
  userAgent: string;

  @Column({ type: 'jsonb', nullable: true, comment: 'Additional metadata' })
  metadata: Record<string, any>;

  @CreateDateColumn({ comment: 'Record creation timestamp' })
  createdAt: Date;

  @Column({ type: 'uuid', nullable: true, comment: 'Created by user ID' })
  createdBy: string;

  // Relationships
  @ManyToOne(
    () => TaxTransactionEntity,
    (transaction) => transaction.auditTrail,
    { nullable: true },
  )
  @JoinColumn({ name: 'taxTransactionId' })
  taxTransaction: TaxTransactionEntity;

  @ManyToOne(() => TaxComplianceEntity, (compliance) => compliance.auditTrail, {
    nullable: true,
  })
  @JoinColumn({ name: 'taxComplianceId' })
  taxCompliance: TaxComplianceEntity;

  @ManyToOne(() => UserEntity, { nullable: true })
  @JoinColumn({ name: 'createdBy' })
  creator: UserEntity;
}

@Entity('tax_exports')
@Index(['exportType'])
@Index(['status'])
@Index(['createdAt'])
export class TaxExportEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100, comment: 'Export type' })
  exportType: string;

  @Column({
    type: 'enum',
    enum: ExportFormat,
    comment: 'Export format',
  })
  format: ExportFormat;

  @Column({ length: 50, default: 'pending', comment: 'Export status' })
  status: string;

  @Column({ type: 'timestamp', nullable: true, comment: 'Date range start' })
  dateFrom: Date;

  @Column({ type: 'timestamp', nullable: true, comment: 'Date range end' })
  dateTo: Date;

  @Column({ type: 'jsonb', nullable: true, comment: 'Export filters' })
  filters: Record<string, any>;

  @Column({
    type: 'boolean',
    default: false,
    comment: 'Include archived records',
  })
  includeArchived: boolean;

  @Column({ length: 500, nullable: true, comment: 'File path' })
  filePath: string;

  @Column({ length: 500, nullable: true, comment: 'Download URL' })
  downloadUrl: string;

  @Column({ type: 'bigint', nullable: true, comment: 'File size in bytes' })
  fileSize: number;

  @Column({
    type: 'integer',
    nullable: true,
    comment: 'Number of records exported',
  })
  recordCount: number;

  @Column({
    type: 'timestamp',
    nullable: true,
    comment: 'Export completion timestamp',
  })
  completedAt: Date;

  @Column({
    type: 'timestamp',
    nullable: true,
    comment: 'Export expiry timestamp',
  })
  expiresAt: Date;

  @Column({ type: 'text', nullable: true, comment: 'Error message if failed' })
  errorMessage: string;

  @Column({ type: 'jsonb', nullable: true, comment: 'Additional metadata' })
  metadata: Record<string, any>;

  @CreateDateColumn({ comment: 'Record creation timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ comment: 'Record last update timestamp' })
  updatedAt: Date;

  @Column({ type: 'uuid', nullable: true, comment: 'Created by user ID' })
  createdBy: string;

  // Relationships
  @ManyToOne(() => UserEntity, { nullable: true })
  @JoinColumn({ name: 'createdBy' })
  creator: UserEntity;

  // Helper methods
  isExpired(): boolean {
    return this.expiresAt ? new Date() > this.expiresAt : false;
  }

  isCompleted(): boolean {
    return this.status === 'completed';
  }

  isFailed(): boolean {
    return this.status === 'failed';
  }
}

@Entity('tax_reports')
@Index(['reportType'])
@Index(['status'])
@Index(['createdAt'])
export class TaxReportEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100, comment: 'Report name' })
  reportName: string;

  @Column({
    type: 'enum',
    enum: ReportType,
    comment: 'Report type',
  })
  reportType: ReportType;

  @Column({
    length: 50,
    default: 'pending',
    comment: 'Report generation status',
  })
  status: string;

  @Column({
    type: 'enum',
    enum: ExportFormat,
    comment: 'Report format',
  })
  format: ExportFormat;

  @Column({ type: 'timestamp', nullable: true, comment: 'Date range start' })
  dateFrom: Date;

  @Column({ type: 'timestamp', nullable: true, comment: 'Date range end' })
  dateTo: Date;

  @Column({ type: 'jsonb', nullable: true, comment: 'Report parameters' })
  parameters: Record<string, any>;

  @Column({ type: 'boolean', default: false, comment: 'Include summary' })
  includeSummary: boolean;

  @Column({ type: 'boolean', default: false, comment: 'Include charts' })
  includeCharts: boolean;

  @Column({ length: 500, nullable: true, comment: 'File path' })
  filePath: string;

  @Column({ length: 500, nullable: true, comment: 'Download URL' })
  downloadUrl: string;

  @Column({ type: 'bigint', nullable: true, comment: 'File size in bytes' })
  fileSize: number;

  @Column({
    type: 'timestamp',
    nullable: true,
    comment: 'Report completion timestamp',
  })
  completedAt: Date;

  @Column({ type: 'text', nullable: true, comment: 'Error message if failed' })
  errorMessage: string;

  @Column({ type: 'jsonb', nullable: true, comment: 'Additional metadata' })
  metadata: Record<string, any>;

  @CreateDateColumn({ comment: 'Record creation timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ comment: 'Record last update timestamp' })
  updatedAt: Date;

  @Column({ type: 'uuid', nullable: true, comment: 'Created by user ID' })
  createdBy: string;

  // Relationships
  @ManyToOne(() => UserEntity, { nullable: true })
  @JoinColumn({ name: 'createdBy' })
  creator: UserEntity;

  // Helper methods
  isCompleted(): boolean {
    return this.status === 'completed';
  }

  isFailed(): boolean {
    return this.status === 'failed';
  }

  getFormattedSize(): string {
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

@Entity('tax_settings')
export class TaxSettingsEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'decimal',
    precision: 8,
    scale: 4,
    nullable: true,
    comment: 'Default GST rate',
  })
  defaultGSTRate: number;

  @Column({
    type: 'decimal',
    precision: 8,
    scale: 4,
    nullable: true,
    comment: 'Default TCS rate',
  })
  defaultTCSRate: number;

  @Column({
    type: 'decimal',
    precision: 8,
    scale: 4,
    nullable: true,
    comment: 'Default TDS rate',
  })
  defaultTDSRate: number;

  @Column({ type: 'boolean', default: true, comment: 'Auto-calculate taxes' })
  autoCalculateTax: boolean;

  @Column({ type: 'boolean', default: false, comment: 'Auto-collect taxes' })
  autoCollectTax: boolean;

  @Column({ type: 'integer', default: 7, comment: 'Tax payment reminder days' })
  paymentReminderDays: number;

  @Column({ type: 'integer', default: 15, comment: 'Compliance reminder days' })
  complianceReminderDays: number;

  @Column({
    type: 'boolean',
    default: true,
    comment: 'Enable tax notifications',
  })
  enableNotifications: boolean;

  @Column({ type: 'integer', default: 2, comment: 'Tax calculation precision' })
  calculationPrecision: number;

  @Column({ type: 'jsonb', nullable: true, comment: 'Additional settings' })
  additionalSettings: Record<string, any>;

  @CreateDateColumn({ comment: 'Record creation timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ comment: 'Record last update timestamp' })
  updatedAt: Date;

  @Column({ type: 'uuid', nullable: true, comment: 'Updated by user ID' })
  updatedBy: string;

  // Relationships
  @ManyToOne(() => UserEntity, { nullable: true })
  @JoinColumn({ name: 'updatedBy' })
  updater: UserEntity;

  // Helper methods
  getEffectiveGSTRate(): number {
    return this.defaultGSTRate || 18; // Default 18% GST
  }

  getEffectiveTCSRate(): number {
    return this.defaultTCSRate || 1; // Default 1% TCS
  }

  getEffectiveTDSRate(): number {
    return this.defaultTDSRate || 2; // Default 2% TDS
  }

  shouldAutoCalculate(): boolean {
    return this.autoCalculateTax;
  }

  shouldAutoCollect(): boolean {
    return this.autoCollectTax;
  }

  getReminderThreshold(type: 'payment' | 'compliance'): number {
    return type === 'payment'
      ? this.paymentReminderDays
      : this.complianceReminderDays;
  }
}
