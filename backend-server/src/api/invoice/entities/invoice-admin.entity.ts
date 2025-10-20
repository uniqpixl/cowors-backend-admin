import { UserEntity } from '@/auth/entities/user.entity';
import { BookingEntity } from '@/database/entities/booking.entity';
import { PartnerEntity } from '@/database/entities/partner.entity';
import { EntityType, IdGeneratorService } from '@/utils/id-generator.service';
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
  ExportFormat,
  InvoiceStatus,
  InvoiceType,
  PaymentStatus,
  ReportType,
} from '../dto/invoice-admin.dto';

@Entity('invoice')
@Index(['status', 'type'])
@Index(['customerId', 'status'])
@Index(['partnerId', 'status'])
@Index(['invoiceDate', 'dueDate'])
@Index(['totalAmount', 'paidAmount'])
@Index(['createdAt'])
export class InvoiceEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  @Index()
  invoiceNumber: string;

  @Column({
    type: 'enum',
    enum: InvoiceType,
    default: InvoiceType.BOOKING,
  })
  type: InvoiceType;

  @Column({
    type: 'enum',
    enum: InvoiceStatus,
    default: InvoiceStatus.DRAFT,
  })
  @Index()
  status: InvoiceStatus;

  // Customer Information
  @Column('uuid')
  @Index()
  customerId: string;

  @Column('uuid')
  @Index()
  userId: string;

  @Column()
  customerName: string;

  @Column()
  customerEmail: string;

  @Column({ nullable: true })
  customerPhone?: string;

  @Column('jsonb', { nullable: true })
  customerAddress?: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };

  @Column('jsonb', { nullable: true })
  billingAddress?: Record<string, any>;

  @Column({ nullable: true })
  customerTaxId?: string;

  // Partner Information (for commission invoices)
  @Column('uuid', { nullable: true })
  @Index()
  partnerId?: string;

  @ManyToOne(() => PartnerEntity, { nullable: true })
  @JoinColumn({ name: 'partnerId' })
  partner?: PartnerEntity;

  // Booking Information (for booking invoices)
  @Column('uuid', { nullable: true })
  @Index()
  bookingId?: string;

  @ManyToOne(() => BookingEntity, { nullable: true })
  @JoinColumn({ name: 'bookingId' })
  booking?: BookingEntity;

  // Line Items
  @Column('jsonb')
  lineItems: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    discountPercentage?: number;
    taxPercentage?: number;
    metadata?: Record<string, any>;
  }>;

  // Financial Information
  @Column('decimal', { precision: 12, scale: 2 })
  @Index()
  subtotal: number;

  @Column('decimal', { precision: 12, scale: 2, default: 0, name: 'totalTax' })
  taxAmount: number;

  @Column('jsonb', { nullable: true })
  taxBreakdown?: Record<string, any>;

  @Column({ type: 'varchar', nullable: true })
  taxType?: string;

  @Column('decimal', { precision: 12, scale: 2, default: 0 })
  discountAmount: number;

  @Column('decimal', { precision: 12, scale: 2 })
  @Index()
  totalAmount: number;

  @Column('decimal', { precision: 12, scale: 2, default: 0 })
  @Index()
  paidAmount: number;

  @Column('decimal', { precision: 12, scale: 2, default: 0 })
  @Index()
  outstandingAmount: number;

  @Column({ length: 3, default: 'INR' })
  currency: string;

  @Column('decimal', { precision: 5, scale: 2, nullable: true })
  taxRate?: number;

  @Column('decimal', { precision: 5, scale: 2, nullable: true })
  discountPercentage?: number;

  // Dates
  @Column('timestamp', { name: 'issueDate' })
  @Index()
  invoiceDate: Date;

  @Column('timestamp', { nullable: true })
  @Index()
  dueDate?: Date;

  @Column('timestamp', { nullable: true })
  sentAt?: Date;

  @Column('timestamp', { nullable: true })
  paidAt?: Date;

  @Column('timestamp', { nullable: true })
  lastReminderDate?: Date;

  // Content
  @Column('text', { nullable: true })
  notes?: string;

  @Column('text', { nullable: true })
  cancellationReason?: string;

  @Column('text', { nullable: true })
  terms?: string;

  @Column({ nullable: true })
  templateId?: string;

  @Column({ nullable: true })
  pdfUrl?: string;

  @Column({ nullable: true })
  pdfPath?: string;

  // Metadata
  @Column('jsonb', { nullable: true })
  metadata?: Record<string, any>;

  // Audit Information
  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column('uuid')
  createdBy: string;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'createdBy' })
  creator: UserEntity;

  @Column('uuid', { nullable: true })
  updatedBy?: string;

  @ManyToOne(() => UserEntity, { nullable: true })
  @JoinColumn({ name: 'updatedBy' })
  updater?: UserEntity;

  // Relationships
  @OneToMany(() => InvoicePaymentEntity, (payment) => payment.invoice)
  payments: InvoicePaymentEntity[];

  @OneToMany(() => InvoiceRefundEntity, (refund) => refund.invoice)
  refunds: InvoiceRefundEntity[];

  @OneToMany(() => InvoiceAuditTrailEntity, (audit) => audit.invoice)
  auditTrail: InvoiceAuditTrailEntity[];

  // Hooks
  @BeforeInsert()
  generateInvoiceNumber() {
    if (!this.invoiceNumber) {
      const idGenerator = new IdGeneratorService();
      this.invoiceNumber = idGenerator.generateId(EntityType.INVOICE);
    }
  }

  @BeforeInsert()
  @BeforeUpdate()
  calculateAmounts() {
    // Calculate subtotal
    this.subtotal = this.lineItems.reduce((sum, item) => {
      const lineTotal = item.quantity * item.unitPrice;
      const discount = item.discountPercentage
        ? (lineTotal * item.discountPercentage) / 100
        : 0;
      return sum + (lineTotal - discount);
    }, 0);

    // Calculate discount amount
    this.discountAmount = this.discountPercentage
      ? (this.subtotal * this.discountPercentage) / 100
      : 0;

    // Calculate tax amount
    const taxableAmount = this.subtotal - this.discountAmount;
    this.taxAmount = this.taxRate ? (taxableAmount * this.taxRate) / 100 : 0;

    // Calculate total amount
    this.totalAmount = this.subtotal - this.discountAmount + this.taxAmount;

    // Calculate outstanding amount
    this.outstandingAmount = this.totalAmount - this.paidAmount;
  }

  @BeforeInsert()
  setDefaultDates() {
    if (!this.invoiceDate) {
      this.invoiceDate = new Date();
    }
    if (!this.dueDate && this.invoiceDate) {
      this.dueDate = new Date(
        this.invoiceDate.getTime() + 30 * 24 * 60 * 60 * 1000,
      ); // 30 days
    }
  }

  // Helper Methods
  isOverdue(): boolean {
    return (
      this.dueDate && new Date() > this.dueDate && this.outstandingAmount > 0
    );
  }

  isPaid(): boolean {
    return this.status === InvoiceStatus.PAID || this.outstandingAmount <= 0;
  }

  isPartiallyPaid(): boolean {
    return this.paidAmount > 0 && this.outstandingAmount > 0;
  }

  getDaysOverdue(): number {
    if (!this.isOverdue()) return 0;
    const today = new Date();
    const diffTime = today.getTime() - this.dueDate!.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  getPaymentProgress(): number {
    if (this.totalAmount === 0) return 0;
    return (this.paidAmount / this.totalAmount) * 100;
  }
}

@Entity('invoice_payments')
@Index(['invoiceId', 'status'])
@Index(['paymentDate'])
@Index(['amount'])
export class InvoicePaymentEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  @Index()
  invoiceId: string;

  @ManyToOne(() => InvoiceEntity, (invoice) => invoice.payments)
  @JoinColumn({ name: 'invoiceId' })
  invoice: InvoiceEntity;

  @Column('decimal', { precision: 12, scale: 2 })
  amount: number;

  @Column()
  paymentMethod: string;

  @Column({ nullable: true })
  paymentReference?: string;

  @Column({ nullable: true })
  transactionId?: string;

  @Column({
    type: 'enum',
    enum: PaymentStatus,
    default: PaymentStatus.PENDING,
  })
  status: PaymentStatus;

  @Column('timestamp')
  paymentDate: Date;

  @Column('timestamp', { nullable: true })
  processedDate?: Date;

  @Column('text', { nullable: true })
  notes?: string;

  @Column('jsonb', { nullable: true })
  paymentDetails?: Record<string, any>;

  @Column('jsonb', { nullable: true })
  gatewayResponse?: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column('uuid')
  createdBy: string;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'createdBy' })
  creator: UserEntity;
}

@Entity('invoice_refunds')
@Index(['invoiceId', 'status'])
@Index(['refundDate'])
@Index(['amount'])
export class InvoiceRefundEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  @Index()
  invoiceId: string;

  @ManyToOne(() => InvoiceEntity, (invoice) => invoice.refunds)
  @JoinColumn({ name: 'invoiceId' })
  invoice: InvoiceEntity;

  @Column('uuid', { nullable: true })
  paymentId?: string;

  @ManyToOne(() => InvoicePaymentEntity, { nullable: true })
  @JoinColumn({ name: 'paymentId' })
  payment?: InvoicePaymentEntity;

  @Column('decimal', { precision: 12, scale: 2 })
  amount: number;

  @Column()
  reason: string;

  @Column({ nullable: true })
  refundMethod?: string;

  @Column({ nullable: true })
  refundReference?: string;

  @Column({ default: 'pending' })
  status: string;

  @Column('timestamp')
  refundDate: Date;

  @Column('timestamp', { nullable: true })
  processedDate?: Date;

  @Column('text', { nullable: true })
  notes?: string;

  @Column('jsonb', { nullable: true })
  refundDetails?: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column('uuid')
  createdBy: string;

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

  @Column('uuid')
  @Index()
  invoiceId: string;

  @ManyToOne(() => InvoiceEntity, (invoice) => invoice.auditTrail)
  @JoinColumn({ name: 'invoiceId' })
  invoice: InvoiceEntity;

  @Column()
  action: string;

  @Column('text', { nullable: true })
  description?: string;

  @Column('jsonb', { nullable: true })
  oldValues?: Record<string, any>;

  @Column('jsonb', { nullable: true })
  newValues?: Record<string, any>;

  @Column('jsonb', { nullable: true })
  metadata?: Record<string, any>;

  @Column('timestamp', { default: () => 'CURRENT_TIMESTAMP' })
  performedAt: Date;

  @Column('uuid')
  performedBy: string;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'performedBy' })
  performer: UserEntity;

  @Column({ nullable: true })
  ipAddress?: string;

  @Column({ nullable: true })
  userAgent?: string;
}

@Entity('invoice_exports')
@Index(['exportType', 'status'])
@Index(['createdAt'])
@Index(['createdBy'])
export class InvoiceExportEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  exportType: string;

  @Column({
    type: 'enum',
    enum: ExportFormat,
  })
  format: ExportFormat;

  @Column('jsonb', { nullable: true })
  filters?: Record<string, any>;

  @Column('jsonb', { nullable: true })
  parameters?: Record<string, any>;

  @Column({ default: 'pending' })
  status: string;

  @Column({ nullable: true })
  fileName?: string;

  @Column({ nullable: true })
  filePath?: string;

  @Column({ nullable: true })
  downloadUrl?: string;

  @Column('int', { nullable: true })
  recordCount?: number;

  @Column('int', { nullable: true })
  fileSize?: number;

  @Column('timestamp', { nullable: true })
  startedAt?: Date;

  @Column('timestamp', { nullable: true })
  completedAt?: Date;

  @Column('timestamp', { nullable: true })
  expiresAt?: Date;

  @Column('text', { nullable: true })
  errorMessage?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column('uuid')
  createdBy: string;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'createdBy' })
  creator: UserEntity;
}

@Entity('invoice_reports')
@Index(['reportType', 'status'])
@Index(['createdAt'])
@Index(['createdBy'])
export class InvoiceReportEntity {
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

  @Column('jsonb', { nullable: true })
  parameters?: Record<string, any>;

  @Column('jsonb', { nullable: true })
  filters?: Record<string, any>;

  @Column({ default: 'pending' })
  status: string;

  @Column({ nullable: true })
  fileName?: string;

  @Column({ nullable: true })
  filePath?: string;

  @Column({ nullable: true })
  downloadUrl?: string;

  @Column('jsonb', { nullable: true })
  reportData?: Record<string, any>;

  @Column('timestamp', { nullable: true })
  startedAt?: Date;

  @Column('timestamp', { nullable: true })
  completedAt?: Date;

  @Column('timestamp', { nullable: true })
  expiresAt?: Date;

  @Column('text', { nullable: true })
  errorMessage?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column('uuid')
  createdBy: string;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'createdBy' })
  creator: UserEntity;
}

@Entity('invoice_settings')
export class InvoiceSettingsEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  defaultTemplate?: string;

  @Column('int', { nullable: true })
  defaultPaymentTerms?: number;

  @Column({ length: 3, nullable: true })
  defaultCurrency?: string;

  @Column('decimal', { precision: 5, scale: 2, nullable: true })
  defaultTaxRate?: number;

  @Column({ default: false })
  autoSendInvoices: boolean;

  @Column({ default: true })
  sendPaymentReminders: boolean;

  @Column('simple-array', { nullable: true })
  paymentReminderDays?: number[];

  @Column('decimal', { precision: 5, scale: 2, nullable: true })
  latePaymentFeePercentage?: number;

  @Column({ nullable: true })
  invoiceNumberPrefix?: string;

  @Column({ nullable: true })
  invoiceNumberFormat?: string;

  @Column('jsonb', { nullable: true })
  companyInfo?: {
    name: string;
    address: {
      street: string;
      city: string;
      state: string;
      postalCode: string;
      country: string;
    };
    phone?: string;
    email?: string;
    website?: string;
    taxId?: string;
    logo?: string;
  };

  @Column('jsonb', { nullable: true })
  emailTemplates?: {
    invoiceSent?: string;
    paymentReminder?: string;
    paymentReceived?: string;
    overdue?: string;
  };

  @Column('jsonb', { nullable: true })
  integrations?: {
    paymentGateways?: string[];
    accountingSoftware?: string;
    emailProvider?: string;
  };

  @Column('jsonb', { nullable: true })
  notifications?: {
    emailNotifications?: boolean;
    smsNotifications?: boolean;
    webhookUrl?: string;
  };

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column('uuid')
  createdBy: string;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'createdBy' })
  creator: UserEntity;

  @Column('uuid', { nullable: true })
  updatedBy?: string;

  @ManyToOne(() => UserEntity, { nullable: true })
  @JoinColumn({ name: 'updatedBy' })
  updater?: UserEntity;
}
