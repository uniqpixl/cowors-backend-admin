import { UserEntity } from '@/auth/entities/user.entity';
import { BaseModel } from '@/database/models/base.model';
import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToOne,
} from 'typeorm';
import { EntityType } from '../../utils/id-generator.service';
import { BookingEntity } from './booking.entity';
import { PartnerEntity } from './partner.entity';
import { PaymentEntity } from './payment.entity';

export enum InvoiceStatus {
  DRAFT = 'draft',
  SENT = 'sent',
  PAID = 'paid',
  OVERDUE = 'overdue',
  CANCELLED = 'cancelled',
}

export enum InvoiceType {
  BOOKING = 'booking',
  COMMISSION = 'commission',
  REFUND = 'refund',
  ADJUSTMENT = 'adjustment',
}

export enum TaxType {
  GST = 'gst', // Indian GST
  VAT = 'vat', // International VAT
  NONE = 'none',
}

export interface TaxBreakdown {
  // GST breakdown (India)
  cgst?: {
    rate: number;
    amount: number;
  };
  sgst?: {
    rate: number;
    amount: number;
  };
  igst?: {
    rate: number;
    amount: number;
  };
  // VAT breakdown (International)
  vat?: {
    rate: number;
    amount: number;
  };
  // Total tax
  totalTaxRate: number;
  totalTaxAmount: number;
}

export interface InvoiceLineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  taxRate?: number;
  taxAmount?: number;
  hsnCode?: string; // HSN code for GST
  sacCode?: string; // SAC code for services
}

export interface BillingAddress {
  name: string;
  email: string;
  phone?: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  gstNumber?: string; // GSTIN for Indian businesses
  vatNumber?: string; // VAT number for international
}

export interface InvoiceMetadata {
  placeOfSupply?: string; // For GST determination
  reverseCharge?: boolean;
  exportType?: 'goods' | 'services'; // For export invoices
  currency: string;
  exchangeRate?: number;
  paymentTerms?: string;
  dueDate?: Date;
  notes?: string;
}

@Entity('invoice')
export class InvoiceEntity extends BaseModel {
  @Column({ length: 50, unique: true })
  invoiceNumber: string;

  @Column({
    type: 'enum',
    enum: () => InvoiceType,
    default: InvoiceType.BOOKING,
  })
  type: InvoiceType;

  @Index({ where: '"deletedAt" IS NULL' })
  @Column()
  userId: string;

  @ManyToOne(() => UserEntity, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'userId' })
  user: UserEntity;

  @Index({ where: '"deletedAt" IS NULL' })
  @Column({ nullable: true })
  partnerId: string;

  @ManyToOne(() => PartnerEntity, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'partnerId' })
  partner: PartnerEntity;

  @Index({ where: '"deletedAt" IS NULL' })
  @Column({ nullable: true })
  bookingId: string;

  @OneToOne(() => BookingEntity, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'bookingId' })
  booking: BookingEntity;

  @Column({ nullable: true })
  paymentId: string;

  @OneToOne(() => PaymentEntity, {
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'paymentId' })
  payment: PaymentEntity;

  @Column({
    type: 'enum',
    enum: () => InvoiceStatus,
    default: InvoiceStatus.DRAFT,
  })
  status: InvoiceStatus;

  @Column({
    type: 'enum',
    enum: () => TaxType,
    default: TaxType.GST,
  })
  taxType: TaxType;

  @Column({ type: 'date' })
  issueDate: Date;

  @Column({ type: 'date', nullable: true })
  dueDate: Date;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  subtotal: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  discountAmount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  totalTax: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  totalAmount: number;

  @Column({ length: 3, default: 'INR' })
  currency: string;

  // Customer Information (for admin compatibility)
  @Column({ nullable: true })
  customerId: string;

  @Column({ nullable: true })
  customerName: string;

  @Column({ nullable: true })
  customerEmail: string;

  @Column({ nullable: true })
  customerPhone: string;

  @Column('jsonb', { nullable: true })
  customerAddress: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };

  @Column({ nullable: true })
  customerTaxId: string;

  // Additional admin fields
  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  paidAmount: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  outstandingAmount: number;

  @Column({ type: 'timestamp', nullable: true })
  paidDate: Date;

  @Column({ nullable: true })
  terms: string;

  @Column('jsonb')
  billingAddress: BillingAddress;

  @Column('jsonb')
  lineItems: InvoiceLineItem[];

  @Column('jsonb')
  taxBreakdown: TaxBreakdown;

  @Column('jsonb', { nullable: true })
  metadata: InvoiceMetadata;

  @Column({ type: 'timestamp', nullable: true })
  sentAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  paidAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  cancelledAt: Date;

  @Column('text', { nullable: true })
  cancellationReason: string;

  @Column('text', { nullable: true })
  notes: string;

  // File storage for PDF invoice
  @Column({ nullable: true })
  pdfUrl: string;

  // Indexes for efficient queries
  @Index(['userId', 'status'])
  static userStatusIndex: void;

  @Index(['partnerId', 'status'])
  static partnerStatusIndex: void;

  @Index(['status', 'dueDate'])
  static statusDueDateIndex: void;

  @Index(['issueDate'])
  static issueDateIndex: void;

  protected getEntityType(): EntityType {
    return EntityType.BOOKING;
  }
}
