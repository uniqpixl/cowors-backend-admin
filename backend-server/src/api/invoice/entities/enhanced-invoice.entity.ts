import { UserEntity } from '@/auth/entities/user.entity';
import { BookingEntity } from '@/database/entities/booking.entity';
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
  Currency,
  ExportFormat,
  ExportStatus,
  InvoiceStatus,
  InvoiceType,
  PaymentMethod,
  PaymentStatus,
  RecurrenceFrequency,
  ReminderType,
  TaxType,
} from '../dto/enhanced-invoice.dto';

@Entity('enhanced_invoices')
@Index(['status', 'type'])
@Index(['customerId', 'status'])
@Index(['partnerId', 'status'])
@Index(['bookingId'])
@Index(['invoiceNumber'], { unique: true })
@Index(['issueDate', 'dueDate'])
@Index(['totalAmount'])
@Index(['paymentStatus'])
@Index(['createdAt'])
export class EnhancedInvoiceEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, length: 50 })
  @Index()
  invoiceNumber: string;

  @Column({
    type: 'enum',
    enum: InvoiceType,
    default: InvoiceType.STANDARD,
  })
  type: InvoiceType;

  @Column({
    type: 'enum',
    enum: InvoiceStatus,
    default: InvoiceStatus.DRAFT,
  })
  status: InvoiceStatus;

  @Column({
    type: 'enum',
    enum: PaymentStatus,
    default: PaymentStatus.PENDING,
  })
  paymentStatus: PaymentStatus;

  @Column({ type: 'uuid', nullable: true })
  @Index()
  customerId: string;

  @Column({ type: 'uuid', nullable: true })
  @Index()
  partnerId: string;

  @Column({ type: 'uuid', nullable: true })
  @Index()
  bookingId: string;

  @Column({ type: 'jsonb' })
  billTo: {
    name: string;
    email: string;
    phone?: string;
    address?: {
      street: string;
      city: string;
      state: string;
      postalCode: string;
      country: string;
    };
  };

  @Column({ type: 'jsonb', nullable: true })
  shipTo?: {
    name: string;
    email: string;
    phone?: string;
    address?: {
      street: string;
      city: string;
      state: string;
      postalCode: string;
      country: string;
    };
  };

  @Column({ type: 'jsonb' })
  items: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
    taxes?: Array<{
      type: TaxType;
      rate: number;
      amount: number;
      description?: string;
    }>;
    discountPercentage?: number;
    discountAmount?: number;
  }>;

  @Column({ type: 'date' })
  @Index()
  issueDate: Date;

  @Column({ type: 'date' })
  @Index()
  dueDate: Date;

  @Column({
    type: 'enum',
    enum: Currency,
    default: Currency.INR,
  })
  currency: Currency;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  subtotal: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  discountAmount: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  taxAmount: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  shippingAmount: number;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  @Index()
  totalAmount: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  paidAmount: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  balanceAmount: number;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Column({ type: 'text', nullable: true })
  terms?: string;

  @Column({ type: 'jsonb', nullable: true })
  customFields?: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  taxes?: Array<{
    type: TaxType;
    rate: number;
    amount: number;
    description?: string;
  }>;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  discountPercentage: number;

  @Column({ type: 'text', nullable: true })
  pdfUrl?: string;

  @Column({ type: 'timestamp', nullable: true })
  sentAt?: Date;

  @Column({ type: 'timestamp', nullable: true })
  viewedAt?: Date;

  @Column({ type: 'timestamp', nullable: true })
  paidAt?: Date;

  @Column({ type: 'timestamp', nullable: true })
  approvedAt?: Date;

  @Column({ type: 'timestamp', nullable: true })
  rejectedAt?: Date;

  @Column({ type: 'timestamp', nullable: true })
  cancelledAt?: Date;

  @Column({ type: 'timestamp', nullable: true })
  voidedAt?: Date;

  @Column({ type: 'text', nullable: true })
  rejectionReason?: string;

  @Column({ type: 'text', nullable: true })
  cancellationReason?: string;

  @Column({ type: 'text', nullable: true })
  voidReason?: string;

  @Column({ type: 'uuid' })
  createdBy: string;

  @Column({ type: 'uuid', nullable: true })
  updatedBy?: string;

  @Column({ type: 'uuid', nullable: true })
  approvedBy?: string;

  @Column({ type: 'uuid', nullable: true })
  rejectedBy?: string;

  @Column({ type: 'uuid', nullable: true })
  cancelledBy?: string;

  @Column({ type: 'uuid', nullable: true })
  voidedBy?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @ManyToOne(() => UserEntity, { nullable: true })
  @JoinColumn({ name: 'customerId' })
  customer?: UserEntity;

  @ManyToOne(() => UserEntity, { nullable: true })
  @JoinColumn({ name: 'partnerId' })
  partner?: UserEntity;

  @ManyToOne(() => BookingEntity, { nullable: true })
  @JoinColumn({ name: 'bookingId' })
  booking?: BookingEntity;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'createdBy' })
  creator: UserEntity;

  @ManyToOne(() => UserEntity, { nullable: true })
  @JoinColumn({ name: 'updatedBy' })
  updater?: UserEntity;

  @OneToMany(() => InvoicePaymentEntity, (payment) => payment.invoice, {
    cascade: true,
  })
  payments: InvoicePaymentEntity[];

  @OneToMany(() => InvoiceAuditTrailEntity, (audit) => audit.invoice, {
    cascade: true,
  })
  auditTrail: InvoiceAuditTrailEntity[];

  @OneToMany(() => InvoiceReminderEntity, (reminder) => reminder.invoice, {
    cascade: true,
  })
  reminders: InvoiceReminderEntity[];

  // Hooks
  @BeforeInsert()
  @BeforeUpdate()
  calculateAmounts() {
    // Calculate subtotal
    this.subtotal = this.items.reduce((sum, item) => sum + item.total, 0);

    // Calculate tax amount
    this.taxAmount = this.items.reduce((sum, item) => {
      const itemTaxes = item.taxes || [];
      return sum + itemTaxes.reduce((taxSum, tax) => taxSum + tax.amount, 0);
    }, 0);

    // Add additional taxes
    if (this.taxes) {
      this.taxAmount += this.taxes.reduce((sum, tax) => sum + tax.amount, 0);
    }

    // Calculate total amount
    this.totalAmount =
      this.subtotal -
      this.discountAmount +
      this.taxAmount +
      this.shippingAmount;

    // Calculate balance amount
    this.balanceAmount = this.totalAmount - this.paidAmount;
  }

  @BeforeInsert()
  setDefaults() {
    if (!this.issueDate) {
      this.issueDate = new Date();
    }
    if (!this.dueDate) {
      const dueDate = new Date(this.issueDate);
      dueDate.setDate(dueDate.getDate() + 30); // Default 30 days
      this.dueDate = dueDate;
    }
  }

  // Helper methods
  isOverdue(): boolean {
    return (
      new Date() > this.dueDate &&
      this.paymentStatus !== PaymentStatus.COMPLETED
    );
  }

  isDraft(): boolean {
    return this.status === InvoiceStatus.DRAFT;
  }

  isPaid(): boolean {
    return this.paymentStatus === PaymentStatus.COMPLETED;
  }

  isPartiallyPaid(): boolean {
    return this.paidAmount > 0 && this.paidAmount < this.totalAmount;
  }

  canBeEdited(): boolean {
    return [InvoiceStatus.DRAFT, InvoiceStatus.PENDING].includes(this.status);
  }

  canBeCancelled(): boolean {
    return ![
      InvoiceStatus.PAID,
      InvoiceStatus.CANCELLED,
      InvoiceStatus.VOIDED,
    ].includes(this.status);
  }

  getPaymentProgress(): number {
    return this.totalAmount > 0
      ? (this.paidAmount / this.totalAmount) * 100
      : 0;
  }

  getDaysOverdue(): number {
    if (!this.isOverdue()) return 0;
    const today = new Date();
    const diffTime = today.getTime() - this.dueDate.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
}

@Entity('invoice_payments')
@Index(['invoiceId', 'status'])
@Index(['paymentDate'])
@Index(['amount'])
@Index(['method'])
export class InvoicePaymentEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @Index()
  invoiceId: string;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  amount: number;

  @Column({
    type: 'enum',
    enum: PaymentMethod,
  })
  method: PaymentMethod;

  @Column({
    type: 'enum',
    enum: PaymentStatus,
    default: PaymentStatus.COMPLETED,
  })
  status: PaymentStatus;

  @Column({ type: 'date' })
  paymentDate: Date;

  @Column({ type: 'varchar', length: 100, nullable: true })
  reference?: string;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Column({ type: 'jsonb', nullable: true })
  bankDetails?: Record<string, any>;

  @Column({ type: 'uuid' })
  recordedBy: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @ManyToOne(() => EnhancedInvoiceEntity, (invoice) => invoice.payments, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'invoiceId' })
  invoice: EnhancedInvoiceEntity;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'recordedBy' })
  recorder: UserEntity;
}

@Entity('invoice_templates')
@Index(['type', 'isActive'])
@Index(['name'])
export class InvoiceTemplateEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({
    type: 'enum',
    enum: InvoiceType,
  })
  type: InvoiceType;

  @Column({ type: 'jsonb' })
  templateData: Record<string, any>;

  @Column({ type: 'text', nullable: true })
  defaultTerms?: string;

  @Column({ type: 'text', nullable: true })
  defaultNotes?: string;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'uuid' })
  createdBy: string;

  @Column({ type: 'uuid', nullable: true })
  updatedBy?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'createdBy' })
  creator: UserEntity;

  @ManyToOne(() => UserEntity, { nullable: true })
  @JoinColumn({ name: 'updatedBy' })
  updater?: UserEntity;

  @OneToMany(() => RecurringInvoiceEntity, (recurring) => recurring.template)
  recurringInvoices: RecurringInvoiceEntity[];
}

@Entity('recurring_invoices')
@Index(['templateId', 'isActive'])
@Index(['customerId', 'isActive'])
@Index(['nextGenerationDate'])
@Index(['frequency'])
export class RecurringInvoiceEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @Index()
  templateId: string;

  @Column({ type: 'uuid' })
  @Index()
  customerId: string;

  @Column({
    type: 'enum',
    enum: RecurrenceFrequency,
  })
  frequency: RecurrenceFrequency;

  @Column({ type: 'date' })
  startDate: Date;

  @Column({ type: 'date', nullable: true })
  endDate?: Date;

  @Column({ type: 'int', nullable: true })
  maxOccurrences?: number;

  @Column({ type: 'int', default: 0 })
  currentOccurrences: number;

  @Column({ type: 'date' })
  nextGenerationDate: Date;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'boolean', default: false })
  autoSend: boolean;

  @Column({ type: 'uuid' })
  createdBy: string;

  @Column({ type: 'uuid', nullable: true })
  updatedBy?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @ManyToOne(
    () => InvoiceTemplateEntity,
    (template) => template.recurringInvoices,
  )
  @JoinColumn({ name: 'templateId' })
  template: InvoiceTemplateEntity;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'customerId' })
  customer: UserEntity;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'createdBy' })
  creator: UserEntity;

  @ManyToOne(() => UserEntity, { nullable: true })
  @JoinColumn({ name: 'updatedBy' })
  updater?: UserEntity;

  @OneToMany(() => EnhancedInvoiceEntity, (invoice) => invoice.id)
  generatedInvoices: EnhancedInvoiceEntity[];

  // Helper methods
  shouldGenerate(): boolean {
    if (!this.isActive) return false;
    if (this.endDate && new Date() > this.endDate) return false;
    if (this.maxOccurrences && this.currentOccurrences >= this.maxOccurrences)
      return false;
    return new Date() >= this.nextGenerationDate;
  }

  calculateNextGenerationDate(): Date {
    const next = new Date(this.nextGenerationDate);

    switch (this.frequency) {
      case RecurrenceFrequency.DAILY:
        next.setDate(next.getDate() + 1);
        break;
      case RecurrenceFrequency.WEEKLY:
        next.setDate(next.getDate() + 7);
        break;
      case RecurrenceFrequency.MONTHLY:
        next.setMonth(next.getMonth() + 1);
        break;
      case RecurrenceFrequency.QUARTERLY:
        next.setMonth(next.getMonth() + 3);
        break;
      case RecurrenceFrequency.YEARLY:
        next.setFullYear(next.getFullYear() + 1);
        break;
    }

    return next;
  }
}

@Entity('invoice_reminders')
@Index(['invoiceId', 'type'])
@Index(['sentAt'])
@Index(['scheduledFor'])
export class InvoiceReminderEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @Index()
  invoiceId: string;

  @Column({
    type: 'enum',
    enum: ReminderType,
  })
  type: ReminderType;

  @Column({ type: 'text', nullable: true })
  message?: string;

  @Column({ type: 'jsonb', nullable: true })
  additionalEmails?: string[];

  @Column({ type: 'timestamp', nullable: true })
  scheduledFor?: Date;

  @Column({ type: 'timestamp', nullable: true })
  sentAt?: Date;

  @Column({ type: 'boolean', default: false })
  isSent: boolean;

  @Column({ type: 'text', nullable: true })
  errorMessage?: string;

  @Column({ type: 'uuid' })
  createdBy: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @ManyToOne(() => EnhancedInvoiceEntity, (invoice) => invoice.reminders, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'invoiceId' })
  invoice: EnhancedInvoiceEntity;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'createdBy' })
  creator: UserEntity;
}

@Entity('invoice_audit_trail')
@Index(['invoiceId', 'action'])
@Index(['performedAt'])
@Index(['performedBy'])
export class InvoiceAuditTrailEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @Index()
  invoiceId: string;

  @Column({ type: 'varchar', length: 50 })
  action: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'jsonb', nullable: true })
  oldValues?: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  newValues?: Record<string, any>;

  @Column({ type: 'varchar', length: 45, nullable: true })
  ipAddress?: string;

  @Column({ type: 'text', nullable: true })
  userAgent?: string;

  @Column({ type: 'uuid' })
  performedBy: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  performedAt: Date;

  // Relations
  @ManyToOne(() => EnhancedInvoiceEntity, (invoice) => invoice.auditTrail, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'invoiceId' })
  invoice: EnhancedInvoiceEntity;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'performedBy' })
  performer: UserEntity;
}

@Entity('invoice_exports')
@Index(['status'])
@Index(['format'])
@Index(['createdAt'])
@Index(['expiresAt'])
export class InvoiceExportEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: ExportStatus,
    default: ExportStatus.PENDING,
  })
  status: ExportStatus;

  @Column({
    type: 'enum',
    enum: ExportFormat,
  })
  format: ExportFormat;

  @Column({ type: 'jsonb', nullable: true })
  filters?: Record<string, any>;

  @Column({ type: 'int', default: 0 })
  totalRecords: number;

  @Column({ type: 'int', default: 0 })
  processedRecords: number;

  @Column({ type: 'text', nullable: true })
  downloadUrl?: string;

  @Column({ type: 'text', nullable: true })
  errorMessage?: string;

  @Column({ type: 'uuid' })
  requestedBy: string;

  @Column({ type: 'timestamp', nullable: true })
  completedAt?: Date;

  @Column({ type: 'timestamp' })
  expiresAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'requestedBy' })
  requester: UserEntity;

  // Helper methods
  isExpired(): boolean {
    return new Date() > this.expiresAt;
  }

  getProgress(): number {
    return this.totalRecords > 0
      ? (this.processedRecords / this.totalRecords) * 100
      : 0;
  }
}

@Entity('invoice_settings')
export class InvoiceSettingsEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: Currency,
    default: Currency.INR,
  })
  defaultCurrency: Currency;

  @Column({ type: 'int', default: 30 })
  defaultPaymentTerms: number;

  @Column({ type: 'boolean', default: true })
  autoGenerateNumbers: boolean;

  @Column({ type: 'varchar', length: 10, default: 'INV' })
  numberPrefix: string;

  @Column({ type: 'int', default: 1 })
  nextNumber: number;

  @Column({ type: 'text', nullable: true })
  defaultTerms?: string;

  @Column({ type: 'text', nullable: true })
  defaultNotes?: string;

  @Column({ type: 'boolean', default: true })
  enableReminders: boolean;

  @Column({ type: 'jsonb', default: [7, 3, 1] })
  reminderSchedule: number[];

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  lateFeePercentage: number;

  @Column({ type: 'boolean', default: false })
  enableLateFees: boolean;

  @Column({ type: 'text', nullable: true })
  logoUrl?: string;

  @Column({ type: 'jsonb', nullable: true })
  companyDetails?: {
    name: string;
    email: string;
    phone?: string;
    address?: {
      street: string;
      city: string;
      state: string;
      postalCode: string;
      country: string;
    };
  };

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
  generateNextInvoiceNumber(): string {
    const number = this.nextNumber.toString().padStart(4, '0');
    return `${this.numberPrefix}-${number}`;
  }

  incrementNextNumber(): void {
    this.nextNumber += 1;
  }
}
