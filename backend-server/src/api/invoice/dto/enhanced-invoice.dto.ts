import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsDate,
  IsDateString,
  IsEmail,
  IsEnum,
  IsJSON,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsPhoneNumber,
  IsString,
  IsUrl,
  IsUUID,
  Length,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';

// Enums
export enum InvoiceStatus {
  DRAFT = 'draft',
  PENDING = 'pending',
  SENT = 'sent',
  VIEWED = 'viewed',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  PAID = 'paid',
  PARTIALLY_PAID = 'partially_paid',
  OVERDUE = 'overdue',
  CANCELLED = 'cancelled',
  VOIDED = 'voided',
  REFUNDED = 'refunded',
}

export enum InvoiceType {
  STANDARD = 'standard',
  PROFORMA = 'proforma',
  RECURRING = 'recurring',
  CREDIT_NOTE = 'credit_note',
  DEBIT_NOTE = 'debit_note',
  BOOKING = 'booking',
  COMMISSION = 'commission',
  REFUND = 'refund',
  ADJUSTMENT = 'adjustment',
}

export enum PaymentStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded',
  PARTIALLY_REFUNDED = 'partially_refunded',
}

export enum PaymentMethod {
  CASH = 'cash',
  CARD = 'card',
  BANK_TRANSFER = 'bank_transfer',
  UPI = 'upi',
  WALLET = 'wallet',
  CHEQUE = 'cheque',
  ONLINE = 'online',
  OTHER = 'other',
}

export enum Currency {
  INR = 'INR',
  USD = 'USD',
  EUR = 'EUR',
  GBP = 'GBP',
}

export enum TaxType {
  GST = 'gst',
  CGST = 'cgst',
  SGST = 'sgst',
  IGST = 'igst',
  CESS = 'cess',
  TCS = 'tcs',
  TDS = 'tds',
  VAT = 'vat',
}

export enum ExportFormat {
  PDF = 'pdf',
  EXCEL = 'excel',
  CSV = 'csv',
  JSON = 'json',
}

export enum ExportStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

export enum BulkOperationType {
  SEND = 'send',
  APPROVE = 'approve',
  REJECT = 'reject',
  CANCEL = 'cancel',
  MARK_PAID = 'mark_paid',
  MARK_OVERDUE = 'mark_overdue',
  DELETE = 'delete',
  EXPORT = 'export',
  SEND_REMINDER = 'send_reminder',
}

export enum RecurrenceFrequency {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  YEARLY = 'yearly',
}

export enum ReminderType {
  EMAIL = 'email',
  SMS = 'sms',
  PUSH = 'push',
  WHATSAPP = 'whatsapp',
}

// Base DTOs
export class AddressDto {
  @ApiProperty({ description: 'Street address' })
  @IsString()
  @IsNotEmpty()
  street: string;

  @ApiProperty({ description: 'City' })
  @IsString()
  @IsNotEmpty()
  city: string;

  @ApiProperty({ description: 'State' })
  @IsString()
  @IsNotEmpty()
  state: string;

  @ApiProperty({ description: 'Postal code' })
  @IsString()
  @IsNotEmpty()
  postalCode: string;

  @ApiProperty({ description: 'Country' })
  @IsString()
  @IsNotEmpty()
  country: string;
}

export class ContactDto {
  @ApiProperty({ description: 'Contact name' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'Email address' })
  @IsEmail()
  email: string;

  @ApiPropertyOptional({ description: 'Phone number' })
  @IsOptional()
  @IsPhoneNumber()
  phone?: string;

  @ApiPropertyOptional({ description: 'Address' })
  @IsOptional()
  @ValidateNested()
  @Type(() => AddressDto)
  address?: AddressDto;
}

export class TaxDto {
  @ApiProperty({ description: 'Tax type', enum: TaxType })
  @IsEnum(TaxType)
  type: TaxType;

  @ApiProperty({ description: 'Tax rate percentage' })
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0)
  @Max(100)
  rate: number;

  @ApiProperty({ description: 'Tax amount' })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  amount: number;

  @ApiPropertyOptional({ description: 'Tax description' })
  @IsOptional()
  @IsString()
  description?: string;
}

export class InvoiceItemDto {
  @ApiProperty({ description: 'Item description' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ description: 'Quantity' })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  quantity: number;

  @ApiProperty({ description: 'Unit price' })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  unitPrice: number;

  @ApiProperty({ description: 'Total amount' })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  total: number;

  @ApiPropertyOptional({ description: 'Item taxes' })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TaxDto)
  taxes?: TaxDto[];

  @ApiPropertyOptional({ description: 'Discount percentage' })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(100)
  discountPercentage?: number;

  @ApiPropertyOptional({ description: 'Discount amount' })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  discountAmount?: number;
}

// Invoice Management DTOs
export class CreateInvoiceDto {
  @ApiProperty({ description: 'Invoice type', enum: InvoiceType })
  @IsEnum(InvoiceType)
  type: InvoiceType;

  @ApiPropertyOptional({ description: 'Customer ID' })
  @IsOptional()
  @IsUUID()
  customerId?: string;

  @ApiPropertyOptional({ description: 'Partner ID' })
  @IsOptional()
  @IsUUID()
  partnerId?: string;

  @ApiPropertyOptional({ description: 'Booking ID' })
  @IsOptional()
  @IsUUID()
  bookingId?: string;

  @ApiPropertyOptional({ description: 'Invoice number' })
  @IsOptional()
  @IsString()
  invoiceNumber?: string;

  @ApiProperty({ description: 'Bill to contact' })
  @ValidateNested()
  @Type(() => ContactDto)
  billTo: ContactDto;

  @ApiPropertyOptional({ description: 'Ship to contact' })
  @IsOptional()
  @ValidateNested()
  @Type(() => ContactDto)
  shipTo?: ContactDto;

  @ApiProperty({ description: 'Invoice items' })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => InvoiceItemDto)
  items: InvoiceItemDto[];

  @ApiProperty({ description: 'Issue date' })
  @IsDateString()
  issueDate: string;

  @ApiProperty({ description: 'Due date' })
  @IsDateString()
  dueDate: string;

  @ApiProperty({ description: 'Currency', enum: Currency })
  @IsEnum(Currency)
  currency: Currency;

  @ApiPropertyOptional({ description: 'Notes' })
  @IsOptional()
  @IsString()
  @Length(0, 1000)
  notes?: string;

  @ApiPropertyOptional({ description: 'Terms and conditions' })
  @IsOptional()
  @IsString()
  @Length(0, 2000)
  terms?: string;

  @ApiPropertyOptional({ description: 'Discount percentage' })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(100)
  discountPercentage?: number;

  @ApiPropertyOptional({ description: 'Discount amount' })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  discountAmount?: number;

  @ApiPropertyOptional({ description: 'Shipping amount' })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  shippingAmount?: number;

  @ApiPropertyOptional({ description: 'Additional taxes' })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TaxDto)
  taxes?: TaxDto[];

  @ApiPropertyOptional({ description: 'Custom fields' })
  @IsOptional()
  @IsObject()
  customFields?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Auto-send invoice' })
  @IsOptional()
  @IsBoolean()
  autoSend?: boolean;
}

export class UpdateInvoiceDto {
  @ApiPropertyOptional({ description: 'Invoice type', enum: InvoiceType })
  @IsOptional()
  @IsEnum(InvoiceType)
  type?: InvoiceType;

  @ApiPropertyOptional({ description: 'Bill to contact' })
  @IsOptional()
  @ValidateNested()
  @Type(() => ContactDto)
  billTo?: ContactDto;

  @ApiPropertyOptional({ description: 'Ship to contact' })
  @IsOptional()
  @ValidateNested()
  @Type(() => ContactDto)
  shipTo?: ContactDto;

  @ApiPropertyOptional({ description: 'Invoice items' })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => InvoiceItemDto)
  items?: InvoiceItemDto[];

  @ApiPropertyOptional({ description: 'Issue date' })
  @IsOptional()
  @IsDateString()
  issueDate?: string;

  @ApiPropertyOptional({ description: 'Due date' })
  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @ApiPropertyOptional({ description: 'Currency', enum: Currency })
  @IsOptional()
  @IsEnum(Currency)
  currency?: Currency;

  @ApiPropertyOptional({ description: 'Notes' })
  @IsOptional()
  @IsString()
  @Length(0, 1000)
  notes?: string;

  @ApiPropertyOptional({ description: 'Terms and conditions' })
  @IsOptional()
  @IsString()
  @Length(0, 2000)
  terms?: string;

  @ApiPropertyOptional({ description: 'Discount percentage' })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(100)
  discountPercentage?: number;

  @ApiPropertyOptional({ description: 'Discount amount' })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  discountAmount?: number;

  @ApiPropertyOptional({ description: 'Shipping amount' })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  shippingAmount?: number;

  @ApiPropertyOptional({ description: 'Additional taxes' })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TaxDto)
  taxes?: TaxDto[];

  @ApiPropertyOptional({ description: 'Custom fields' })
  @IsOptional()
  @IsObject()
  customFields?: Record<string, any>;
}

export class GetInvoicesDto {
  @ApiPropertyOptional({ description: 'Page number' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Items per page' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @ApiPropertyOptional({ description: 'Search term' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Customer ID' })
  @IsOptional()
  @IsUUID()
  customerId?: string;

  @ApiPropertyOptional({ description: 'Partner ID' })
  @IsOptional()
  @IsUUID()
  partnerId?: string;

  @ApiPropertyOptional({ description: 'Booking ID' })
  @IsOptional()
  @IsUUID()
  bookingId?: string;

  @ApiPropertyOptional({ description: 'Invoice status', enum: InvoiceStatus })
  @IsOptional()
  @IsEnum(InvoiceStatus)
  status?: InvoiceStatus;

  @ApiPropertyOptional({ description: 'Invoice type', enum: InvoiceType })
  @IsOptional()
  @IsEnum(InvoiceType)
  type?: InvoiceType;

  @ApiPropertyOptional({ description: 'Payment status', enum: PaymentStatus })
  @IsOptional()
  @IsEnum(PaymentStatus)
  paymentStatus?: PaymentStatus;

  @ApiPropertyOptional({ description: 'Start date' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'End date' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ description: 'Minimum amount' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minAmount?: number;

  @ApiPropertyOptional({ description: 'Maximum amount' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  maxAmount?: number;

  @ApiPropertyOptional({ description: 'Sort by field' })
  @IsOptional()
  @IsString()
  sortBy?: string;

  @ApiPropertyOptional({ description: 'Sort order', enum: ['ASC', 'DESC'] })
  @IsOptional()
  @IsEnum(['ASC', 'DESC'])
  sortOrder?: 'ASC' | 'DESC';
}

export class InvoiceResponseDto {
  @ApiProperty({ description: 'Invoice ID' })
  id: string;

  @ApiProperty({ description: 'Invoice number' })
  invoiceNumber: string;

  @ApiProperty({ description: 'Invoice type', enum: InvoiceType })
  type: InvoiceType;

  @ApiProperty({ description: 'Invoice status', enum: InvoiceStatus })
  status: InvoiceStatus;

  @ApiProperty({ description: 'Payment status', enum: PaymentStatus })
  paymentStatus: PaymentStatus;

  @ApiPropertyOptional({ description: 'Customer ID' })
  customerId?: string;

  @ApiPropertyOptional({ description: 'Partner ID' })
  partnerId?: string;

  @ApiPropertyOptional({ description: 'Booking ID' })
  bookingId?: string;

  @ApiProperty({ description: 'Bill to contact' })
  billTo: ContactDto;

  @ApiPropertyOptional({ description: 'Ship to contact' })
  shipTo?: ContactDto;

  @ApiProperty({ description: 'Invoice items' })
  items: InvoiceItemDto[];

  @ApiProperty({ description: 'Issue date' })
  issueDate: Date;

  @ApiProperty({ description: 'Due date' })
  dueDate: Date;

  @ApiProperty({ description: 'Currency', enum: Currency })
  currency: Currency;

  @ApiProperty({ description: 'Subtotal amount' })
  subtotal: number;

  @ApiProperty({ description: 'Discount amount' })
  discountAmount: number;

  @ApiProperty({ description: 'Tax amount' })
  taxAmount: number;

  @ApiProperty({ description: 'Shipping amount' })
  shippingAmount: number;

  @ApiProperty({ description: 'Total amount' })
  totalAmount: number;

  @ApiProperty({ description: 'Paid amount' })
  paidAmount: number;

  @ApiProperty({ description: 'Balance amount' })
  balanceAmount: number;

  @ApiPropertyOptional({ description: 'Notes' })
  notes?: string;

  @ApiPropertyOptional({ description: 'Terms and conditions' })
  terms?: string;

  @ApiPropertyOptional({ description: 'Custom fields' })
  customFields?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Additional taxes' })
  taxes?: TaxDto[];

  @ApiPropertyOptional({ description: 'Discount percentage' })
  discountPercentage?: number;

  @ApiProperty({ description: 'Created date' })
  createdAt: Date;

  @ApiProperty({ description: 'Updated date' })
  updatedAt: Date;

  @ApiPropertyOptional({ description: 'Sent date' })
  sentAt?: Date;

  @ApiPropertyOptional({ description: 'Viewed date' })
  viewedAt?: Date;

  @ApiPropertyOptional({ description: 'Paid date' })
  paidAt?: Date;

  @ApiPropertyOptional({ description: 'Approved date' })
  approvedAt?: Date;

  @ApiPropertyOptional({ description: 'Rejected date' })
  rejectedAt?: Date;

  @ApiPropertyOptional({ description: 'Cancelled date' })
  cancelledAt?: Date;

  @ApiPropertyOptional({ description: 'Voided date' })
  voidedAt?: Date;

  @ApiPropertyOptional({ description: 'Rejection reason' })
  rejectionReason?: string;

  @ApiPropertyOptional({ description: 'PDF URL' })
  pdfUrl?: string;
}

// Bulk Operations
export class BulkInvoiceOperationDto {
  @ApiProperty({ description: 'Invoice IDs' })
  @IsArray()
  @ArrayMinSize(1)
  @IsUUID(4, { each: true })
  invoiceIds: string[];

  @ApiProperty({ description: 'Operation type', enum: BulkOperationType })
  @IsEnum(BulkOperationType)
  operation: BulkOperationType;

  @ApiPropertyOptional({ description: 'Operation data' })
  @IsOptional()
  @IsObject()
  data?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Reason for operation' })
  @IsOptional()
  @IsString()
  @Length(0, 500)
  reason?: string;
}

export class BulkOperationResponseDto {
  @ApiProperty({ description: 'Total processed' })
  totalProcessed: number;

  @ApiProperty({ description: 'Successful operations' })
  successful: number;

  @ApiProperty({ description: 'Failed operations' })
  failed: number;

  @ApiProperty({ description: 'Operation details' })
  details: Array<{
    invoiceId: string;
    success: boolean;
    error?: string;
  }>;

  @ApiProperty({ description: 'Operation timestamp' })
  timestamp: Date;
}

// Invoice Generation
export class GenerateInvoiceDto {
  @ApiPropertyOptional({ description: 'Booking ID to generate invoice from' })
  @IsOptional()
  @IsUUID()
  bookingId?: string;

  @ApiPropertyOptional({ description: 'Template ID to use' })
  @IsOptional()
  @IsUUID()
  templateId?: string;

  @ApiProperty({ description: 'Invoice type', enum: InvoiceType })
  @IsEnum(InvoiceType)
  type: InvoiceType;

  @ApiPropertyOptional({ description: 'Custom data to override' })
  @IsOptional()
  @IsObject()
  customData?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Auto-send after generation' })
  @IsOptional()
  @IsBoolean()
  autoSend?: boolean;
}

export class SendInvoiceDto {
  @ApiPropertyOptional({ description: 'Email addresses to send to' })
  @IsOptional()
  @IsArray()
  @IsEmail({}, { each: true })
  emails?: string[];

  @ApiPropertyOptional({ description: 'Custom email subject' })
  @IsOptional()
  @IsString()
  @Length(1, 200)
  subject?: string;

  @ApiPropertyOptional({ description: 'Custom email message' })
  @IsOptional()
  @IsString()
  @Length(1, 1000)
  message?: string;

  @ApiPropertyOptional({ description: 'Send copy to sender' })
  @IsOptional()
  @IsBoolean()
  sendCopy?: boolean;
}

// Payment Management
export class PaymentRecordDto {
  @ApiProperty({ description: 'Payment amount' })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  amount: number;

  @ApiProperty({ description: 'Payment method', enum: PaymentMethod })
  @IsEnum(PaymentMethod)
  method: PaymentMethod;

  @ApiProperty({ description: 'Payment date' })
  @IsDateString()
  paymentDate: string;

  @ApiPropertyOptional({ description: 'Transaction reference' })
  @IsOptional()
  @IsString()
  @Length(1, 100)
  reference?: string;

  @ApiPropertyOptional({ description: 'Payment notes' })
  @IsOptional()
  @IsString()
  @Length(0, 500)
  notes?: string;

  @ApiPropertyOptional({ description: 'Bank details' })
  @IsOptional()
  @IsObject()
  bankDetails?: Record<string, any>;
}

export class PaymentResponseDto {
  @ApiProperty({ description: 'Payment ID' })
  id: string;

  @ApiProperty({ description: 'Invoice ID' })
  invoiceId: string;

  @ApiProperty({ description: 'Payment amount' })
  amount: number;

  @ApiProperty({ description: 'Payment method', enum: PaymentMethod })
  method: PaymentMethod;

  @ApiProperty({ description: 'Payment status', enum: PaymentStatus })
  status: PaymentStatus;

  @ApiProperty({ description: 'Payment date' })
  paymentDate: Date;

  @ApiPropertyOptional({ description: 'Transaction reference' })
  reference?: string;

  @ApiPropertyOptional({ description: 'Payment notes' })
  notes?: string;

  @ApiPropertyOptional({ description: 'Bank details' })
  bankDetails?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Recorded by user ID' })
  recordedBy?: string;

  @ApiProperty({ description: 'Created date' })
  createdAt: Date;

  @ApiProperty({ description: 'Updated date' })
  updatedAt: Date;
}

// Template Management
export class InvoiceTemplateDto {
  @ApiProperty({ description: 'Template name' })
  @IsString()
  @IsNotEmpty()
  @Length(1, 100)
  name: string;

  @ApiPropertyOptional({ description: 'Template description' })
  @IsOptional()
  @IsString()
  @Length(0, 500)
  description?: string;

  @ApiProperty({ description: 'Template type', enum: InvoiceType })
  @IsEnum(InvoiceType)
  type: InvoiceType;

  @ApiProperty({ description: 'Template data' })
  @IsObject()
  templateData: Record<string, any>;

  @ApiPropertyOptional({ description: 'Default terms' })
  @IsOptional()
  @IsString()
  @Length(0, 2000)
  defaultTerms?: string;

  @ApiPropertyOptional({ description: 'Default notes' })
  @IsOptional()
  @IsString()
  @Length(0, 1000)
  defaultNotes?: string;

  @ApiPropertyOptional({ description: 'Is active' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class InvoiceTemplateResponseDto {
  @ApiProperty({ description: 'Template ID' })
  id: string;

  @ApiProperty({ description: 'Template name' })
  name: string;

  @ApiPropertyOptional({ description: 'Template description' })
  description?: string;

  @ApiProperty({ description: 'Template type', enum: InvoiceType })
  type: InvoiceType;

  @ApiProperty({ description: 'Template data' })
  templateData: Record<string, any>;

  @ApiPropertyOptional({ description: 'Default terms' })
  defaultTerms?: string;

  @ApiPropertyOptional({ description: 'Default notes' })
  defaultNotes?: string;

  @ApiProperty({ description: 'Is active' })
  isActive: boolean;

  @ApiPropertyOptional({ description: 'Created by user ID' })
  createdBy?: string;

  @ApiPropertyOptional({ description: 'Updated by user ID' })
  updatedBy?: string;

  @ApiProperty({ description: 'Created date' })
  createdAt: Date;

  @ApiProperty({ description: 'Updated date' })
  updatedAt: Date;
}

// Recurring Invoice Management
export class RecurringInvoiceDto {
  @ApiProperty({ description: 'Template ID' })
  @IsUUID()
  templateId: string;

  @ApiProperty({ description: 'Customer ID' })
  @IsUUID()
  customerId: string;

  @ApiProperty({
    description: 'Recurrence frequency',
    enum: RecurrenceFrequency,
  })
  @IsEnum(RecurrenceFrequency)
  frequency: RecurrenceFrequency;

  @ApiProperty({ description: 'Start date' })
  @IsDateString()
  startDate: string;

  @ApiPropertyOptional({ description: 'End date' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ description: 'Maximum occurrences' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  maxOccurrences?: number;

  @ApiPropertyOptional({ description: 'Next generation date' })
  @IsOptional()
  @IsDateString()
  nextGenerationDate?: string;

  @ApiPropertyOptional({ description: 'Auto-send generated invoices' })
  @IsOptional()
  @IsBoolean()
  autoSend?: boolean;
}

export class RecurringInvoiceResponseDto {
  @ApiProperty({ description: 'Recurring invoice ID' })
  id: string;

  @ApiProperty({ description: 'Template ID' })
  templateId: string;

  @ApiProperty({ description: 'Customer ID' })
  customerId: string;

  @ApiProperty({
    description: 'Recurrence frequency',
    enum: RecurrenceFrequency,
  })
  frequency: RecurrenceFrequency;

  @ApiProperty({ description: 'Start date' })
  startDate: Date;

  @ApiPropertyOptional({ description: 'End date' })
  endDate?: Date;

  @ApiPropertyOptional({ description: 'Maximum occurrences' })
  maxOccurrences?: number;

  @ApiProperty({ description: 'Current occurrences' })
  currentOccurrences: number;

  @ApiProperty({ description: 'Next generation date' })
  nextGenerationDate: Date;

  @ApiProperty({ description: 'Is active' })
  isActive: boolean;

  @ApiProperty({ description: 'Auto-send generated invoices' })
  autoSend: boolean;

  @ApiPropertyOptional({ description: 'Updated by user ID' })
  updatedBy?: string;

  @ApiProperty({ description: 'Created date' })
  createdAt: Date;

  @ApiProperty({ description: 'Updated date' })
  updatedAt: Date;
}

// Reminder Management
export class InvoiceReminderDto {
  @ApiProperty({ description: 'Reminder type', enum: ReminderType })
  @IsEnum(ReminderType)
  type: ReminderType;

  @ApiPropertyOptional({ description: 'Custom message' })
  @IsOptional()
  @IsString()
  @Length(1, 1000)
  message?: string;

  @ApiPropertyOptional({ description: 'Send to additional emails' })
  @IsOptional()
  @IsArray()
  @IsEmail({}, { each: true })
  additionalEmails?: string[];

  @ApiPropertyOptional({ description: 'Schedule reminder for later' })
  @IsOptional()
  @IsDateString()
  scheduleFor?: string;
}

// Analytics and Reporting
export class InvoiceAnalyticsDto {
  @ApiPropertyOptional({ description: 'Start date' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'End date' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ description: 'Date from' })
  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @ApiPropertyOptional({ description: 'Date to' })
  @IsOptional()
  @IsDateString()
  dateTo?: string;

  @ApiPropertyOptional({ description: 'Group by period' })
  @IsOptional()
  @IsEnum(['day', 'week', 'month', 'quarter', 'year'])
  groupBy?: string;

  @ApiPropertyOptional({ description: 'Filter by customer ID' })
  @IsOptional()
  @IsUUID()
  customerId?: string;

  @ApiPropertyOptional({ description: 'Filter by partner ID' })
  @IsOptional()
  @IsUUID()
  partnerId?: string;

  @ApiPropertyOptional({ description: 'Filter by invoice type' })
  @IsOptional()
  @IsEnum(InvoiceType)
  type?: InvoiceType;

  @ApiPropertyOptional({ description: 'Filter by status' })
  @IsOptional()
  @IsEnum(InvoiceStatus)
  status?: InvoiceStatus;
}

export class InvoiceAnalyticsResponseDto {
  @ApiPropertyOptional({ description: 'Date from' })
  dateFrom?: string;

  @ApiPropertyOptional({ description: 'Date to' })
  dateTo?: string;

  @ApiProperty({ description: 'Total invoices' })
  totalInvoices: number;

  @ApiProperty({ description: 'Total amount' })
  totalAmount: number;

  @ApiProperty({ description: 'Paid amount' })
  paidAmount: number;

  @ApiProperty({ description: 'Outstanding amount' })
  outstandingAmount: number;

  @ApiProperty({ description: 'Overdue amount' })
  overdueAmount: number;

  @ApiProperty({ description: 'Average invoice value' })
  averageInvoiceValue: number;

  @ApiProperty({ description: 'Payment rate percentage' })
  paymentRate: number;

  @ApiProperty({ description: 'Status breakdown' })
  statusBreakdown: Record<string, number>;

  @ApiProperty({ description: 'Type breakdown' })
  typeBreakdown: Record<string, number>;

  @ApiProperty({ description: 'Monthly trends' })
  monthlyTrends: Array<{
    period: string;
    totalAmount: number;
    paidAmount: number;
    invoiceCount: number;
  }>;

  @ApiProperty({ description: 'Top customers' })
  topCustomers: Array<{
    customerId: string;
    customerName: string;
    totalAmount: number;
    invoiceCount: number;
  }>;
}

export class InvoiceSummaryResponseDto {
  @ApiProperty({ description: 'Total invoices' })
  totalInvoices: number;

  @ApiProperty({ description: 'Draft invoices' })
  draftInvoices: number;

  @ApiProperty({ description: 'Sent invoices' })
  sentInvoices: number;

  @ApiProperty({ description: 'Paid invoices' })
  paidInvoices: number;

  @ApiProperty({ description: 'Overdue invoices' })
  overdueInvoices: number;

  @ApiProperty({ description: 'Total amount' })
  totalAmount: number;

  @ApiProperty({ description: 'Paid amount' })
  paidAmount: number;

  @ApiProperty({ description: 'Outstanding amount' })
  outstandingAmount: number;

  @ApiProperty({ description: 'Overdue amount' })
  overdueAmount: number;

  @ApiProperty({ description: 'This month revenue' })
  thisMonthRevenue: number;

  @ApiProperty({ description: 'Last month revenue' })
  lastMonthRevenue: number;

  @ApiProperty({ description: 'Revenue growth percentage' })
  revenueGrowth: number;

  @ApiProperty({ description: 'Average invoice value' })
  averageInvoiceValue: number;
}

// Export and Download
export class ExportInvoiceDto {
  @ApiProperty({ description: 'Export format', enum: ExportFormat })
  @IsEnum(ExportFormat)
  format: ExportFormat;

  @ApiPropertyOptional({ description: 'Filter criteria' })
  @IsOptional()
  @ValidateNested()
  @Type(() => GetInvoicesDto)
  filters?: GetInvoicesDto;

  @ApiPropertyOptional({ description: 'Include payment details' })
  @IsOptional()
  @IsBoolean()
  includePayments?: boolean;

  @ApiPropertyOptional({ description: 'Include customer details' })
  @IsOptional()
  @IsBoolean()
  includeCustomerDetails?: boolean;

  @ApiPropertyOptional({ description: 'Custom fields to include' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  customFields?: string[];
}

export class ExportResponseDto {
  @ApiProperty({ description: 'Export ID' })
  id: string;

  @ApiProperty({ description: 'Export status', enum: ExportStatus })
  status: ExportStatus;

  @ApiProperty({ description: 'Export format', enum: ExportFormat })
  format: ExportFormat;

  @ApiProperty({ description: 'Total records' })
  totalRecords: number;

  @ApiProperty({ description: 'Processed records' })
  processedRecords: number;

  @ApiPropertyOptional({ description: 'Download URL' })
  downloadUrl?: string;

  @ApiPropertyOptional({ description: 'Error message' })
  errorMessage?: string;

  @ApiProperty({ description: 'Created date' })
  createdAt: Date;

  @ApiPropertyOptional({ description: 'Completed date' })
  completedAt?: Date;

  @ApiProperty({ description: 'Expires at' })
  expiresAt: Date;
}

// Settings Management
export class InvoiceSettingsDto {
  @ApiPropertyOptional({ description: 'Default currency', enum: Currency })
  @IsOptional()
  @IsEnum(Currency)
  defaultCurrency?: Currency;

  @ApiPropertyOptional({ description: 'Default payment terms (days)' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(365)
  defaultPaymentTerms?: number;

  @ApiPropertyOptional({ description: 'Auto-generate invoice numbers' })
  @IsOptional()
  @IsBoolean()
  autoGenerateNumbers?: boolean;

  @ApiPropertyOptional({ description: 'Invoice number prefix' })
  @IsOptional()
  @IsString()
  @Length(0, 10)
  numberPrefix?: string;

  @ApiPropertyOptional({ description: 'Next invoice number' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  nextNumber?: number;

  @ApiPropertyOptional({ description: 'Default terms and conditions' })
  @IsOptional()
  @IsString()
  @Length(0, 2000)
  defaultTerms?: string;

  @ApiPropertyOptional({ description: 'Default notes' })
  @IsOptional()
  @IsString()
  @Length(0, 1000)
  defaultNotes?: string;

  @ApiPropertyOptional({ description: 'Enable automatic reminders' })
  @IsOptional()
  @IsBoolean()
  enableReminders?: boolean;

  @ApiPropertyOptional({ description: 'Reminder schedule (days before due)' })
  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  reminderSchedule?: number[];

  @ApiPropertyOptional({ description: 'Late fee percentage' })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(100)
  lateFeePercentage?: number;

  @ApiPropertyOptional({ description: 'Enable late fees' })
  @IsOptional()
  @IsBoolean()
  enableLateFees?: boolean;

  @ApiPropertyOptional({ description: 'Company logo URL' })
  @IsOptional()
  @IsUrl()
  logoUrl?: string;

  @ApiPropertyOptional({ description: 'Company details' })
  @IsOptional()
  @ValidateNested()
  @Type(() => ContactDto)
  companyDetails?: ContactDto;
}

export class InvoiceSettingsResponseDto {
  @ApiProperty({ description: 'Settings ID' })
  id: string;

  @ApiProperty({ description: 'Default currency', enum: Currency })
  defaultCurrency: Currency;

  @ApiProperty({ description: 'Default payment terms (days)' })
  defaultPaymentTerms: number;

  @ApiProperty({ description: 'Auto-generate invoice numbers' })
  autoGenerateNumbers: boolean;

  @ApiProperty({ description: 'Invoice number prefix' })
  numberPrefix: string;

  @ApiProperty({ description: 'Next invoice number' })
  nextNumber: number;

  @ApiPropertyOptional({ description: 'Default terms and conditions' })
  defaultTerms?: string;

  @ApiPropertyOptional({ description: 'Default notes' })
  defaultNotes?: string;

  @ApiProperty({ description: 'Enable automatic reminders' })
  enableReminders: boolean;

  @ApiProperty({ description: 'Reminder schedule (days before due)' })
  reminderSchedule: number[];

  @ApiProperty({ description: 'Late fee percentage' })
  lateFeePercentage: number;

  @ApiProperty({ description: 'Enable late fees' })
  enableLateFees: boolean;

  @ApiPropertyOptional({ description: 'Company logo URL' })
  logoUrl?: string;

  @ApiPropertyOptional({ description: 'Company details' })
  companyDetails?: ContactDto;

  @ApiPropertyOptional({ description: 'Updated by user ID' })
  updatedBy?: string;

  @ApiProperty({ description: 'Created date' })
  createdAt: Date;

  @ApiProperty({ description: 'Updated date' })
  updatedAt: Date;
}
