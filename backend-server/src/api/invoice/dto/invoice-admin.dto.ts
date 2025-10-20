import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsDate,
  IsDateString,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
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
  PAID = 'paid',
  PARTIALLY_PAID = 'partially_paid',
  OVERDUE = 'overdue',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded',
  DISPUTED = 'disputed',
}

export enum InvoiceType {
  BOOKING = 'booking',
  SUBSCRIPTION = 'subscription',
  SERVICE = 'service',
  PRODUCT = 'product',
  COMMISSION = 'commission',
  REFUND = 'refund',
  CREDIT_NOTE = 'credit_note',
  DEBIT_NOTE = 'debit_note',
}

export enum PaymentStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  REFUNDED = 'refunded',
  PARTIALLY_REFUNDED = 'partially_refunded',
}

export enum BulkInvoiceOperationType {
  UPDATE_STATUS = 'update_status',
  SEND_INVOICES = 'send_invoices',
  RECORD_PAYMENTS = 'record_payments',
  PROCESS_REFUNDS = 'process_refunds',
  DELETE_INVOICES = 'delete_invoices',
  APPLY_DISCOUNT = 'apply_discount',
  UPDATE_DUE_DATE = 'update_due_date',
}

export enum ExportFormat {
  CSV = 'CSV',
  EXCEL = 'EXCEL',
  PDF = 'PDF',
  JSON = 'JSON',
}

export enum ReportType {
  REVENUE_SUMMARY = 'revenue_summary',
  AGING_REPORT = 'aging_report',
  CUSTOMER_STATEMENT = 'customer_statement',
  TAX_REPORT = 'tax_report',
  PAYMENT_SUMMARY = 'payment_summary',
  OUTSTANDING_INVOICES = 'outstanding_invoices',
  COMMISSION_REPORT = 'commission_report',
}

// Base DTOs
export class InvoiceLineItemDto {
  @ApiProperty({ description: 'Line item description' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ description: 'Quantity' })
  @IsNumber()
  @Min(0)
  quantity: number;

  @ApiProperty({ description: 'Unit price' })
  @IsNumber()
  @Min(0)
  unitPrice: number;

  @ApiPropertyOptional({ description: 'Discount percentage' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  discountPercentage?: number;

  @ApiPropertyOptional({ description: 'Tax percentage' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  taxPercentage?: number;

  @ApiPropertyOptional({ description: 'Line item metadata' })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

export class InvoiceAddressDto {
  @ApiProperty({ description: 'Street address' })
  @IsString()
  @IsNotEmpty()
  street: string;

  @ApiProperty({ description: 'City' })
  @IsString()
  @IsNotEmpty()
  city: string;

  @ApiProperty({ description: 'State/Province' })
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

export class InvoiceCustomerDto {
  @ApiProperty({ description: 'Customer ID' })
  @IsUUID()
  id: string;

  @ApiProperty({ description: 'Customer name' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'Customer email' })
  @IsEmail()
  email: string;

  @ApiPropertyOptional({ description: 'Customer phone' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ description: 'Customer address' })
  @IsOptional()
  @ValidateNested()
  @Type(() => InvoiceAddressDto)
  address?: InvoiceAddressDto;

  @ApiPropertyOptional({ description: 'Tax ID/GST number' })
  @IsOptional()
  @IsString()
  taxId?: string;
}

// Main DTOs
export class CreateInvoiceDto {
  @ApiProperty({ description: 'Invoice type', enum: InvoiceType })
  @IsEnum(InvoiceType)
  type: InvoiceType;

  @ApiProperty({ description: 'Customer information' })
  @ValidateNested()
  @Type(() => InvoiceCustomerDto)
  customer: InvoiceCustomerDto;

  @ApiPropertyOptional({ description: 'Partner ID (for commission invoices)' })
  @IsOptional()
  @IsUUID()
  partnerId?: string;

  @ApiPropertyOptional({ description: 'Booking ID (for booking invoices)' })
  @IsOptional()
  @IsUUID()
  bookingId?: string;

  @ApiProperty({ description: 'Invoice line items' })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => InvoiceLineItemDto)
  lineItems: InvoiceLineItemDto[];

  @ApiPropertyOptional({ description: 'Invoice due date' })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  dueDate?: Date;

  @ApiPropertyOptional({ description: 'Invoice notes' })
  @IsOptional()
  @IsString()
  @Length(0, 1000)
  notes?: string;

  @ApiPropertyOptional({ description: 'Terms and conditions' })
  @IsOptional()
  @IsString()
  @Length(0, 2000)
  terms?: string;

  @ApiPropertyOptional({ description: 'Currency code' })
  @IsOptional()
  @IsString()
  @Length(3, 3)
  currency?: string;

  @ApiPropertyOptional({ description: 'Tax rate percentage' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  taxRate?: number;

  @ApiPropertyOptional({ description: 'Discount percentage' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  discountPercentage?: number;

  @ApiPropertyOptional({ description: 'Invoice template ID' })
  @IsOptional()
  @IsString()
  templateId?: string;

  @ApiPropertyOptional({ description: 'Auto-send invoice' })
  @IsOptional()
  @IsBoolean()
  autoSend?: boolean;

  @ApiPropertyOptional({ description: 'Invoice metadata' })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

export class UpdateInvoiceDto {
  @ApiPropertyOptional({ description: 'Invoice type', enum: InvoiceType })
  @IsOptional()
  @IsEnum(InvoiceType)
  type?: InvoiceType;

  @ApiPropertyOptional({ description: 'Customer information' })
  @IsOptional()
  @ValidateNested()
  @Type(() => InvoiceCustomerDto)
  customer?: InvoiceCustomerDto;

  @ApiPropertyOptional({ description: 'Invoice line items' })
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => InvoiceLineItemDto)
  lineItems?: InvoiceLineItemDto[];

  @ApiPropertyOptional({ description: 'Invoice due date' })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  dueDate?: Date;

  @ApiPropertyOptional({ description: 'Invoice notes' })
  @IsOptional()
  @IsString()
  @Length(0, 1000)
  notes?: string;

  @ApiPropertyOptional({ description: 'Terms and conditions' })
  @IsOptional()
  @IsString()
  @Length(0, 2000)
  terms?: string;

  @ApiPropertyOptional({ description: 'Currency code' })
  @IsOptional()
  @IsString()
  @Length(3, 3)
  currency?: string;

  @ApiPropertyOptional({ description: 'Tax rate percentage' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  taxRate?: number;

  @ApiPropertyOptional({ description: 'Discount percentage' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  discountPercentage?: number;

  @ApiPropertyOptional({ description: 'Invoice template ID' })
  @IsOptional()
  @IsString()
  templateId?: string;

  @ApiPropertyOptional({ description: 'Invoice metadata' })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
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

  @ApiProperty({ description: 'Customer information' })
  customer: InvoiceCustomerDto;

  @ApiPropertyOptional({ description: 'Partner information' })
  partner?: {
    id: string;
    name: string;
    email: string;
  };

  @ApiPropertyOptional({ description: 'Booking information' })
  booking?: {
    id: string;
    spaceId: string;
    spaceName: string;
    startDate: Date;
    endDate: Date;
  };

  @ApiProperty({ description: 'Invoice line items' })
  lineItems: InvoiceLineItemDto[];

  @ApiProperty({ description: 'Subtotal amount' })
  subtotal: number;

  @ApiProperty({ description: 'Tax amount' })
  taxAmount: number;

  @ApiProperty({ description: 'Discount amount' })
  discountAmount: number;

  @ApiProperty({ description: 'Total amount' })
  totalAmount: number;

  @ApiProperty({ description: 'Paid amount' })
  paidAmount: number;

  @ApiProperty({ description: 'Outstanding amount' })
  outstandingAmount: number;

  @ApiProperty({ description: 'Currency code' })
  currency: string;

  @ApiProperty({ description: 'Invoice date' })
  invoiceDate: Date;

  @ApiPropertyOptional({ description: 'Due date' })
  dueDate?: Date;

  @ApiPropertyOptional({ description: 'Sent date' })
  sentDate?: Date;

  @ApiPropertyOptional({ description: 'Paid date' })
  paidDate?: Date;

  @ApiPropertyOptional({ description: 'Invoice notes' })
  notes?: string;

  @ApiPropertyOptional({ description: 'Terms and conditions' })
  terms?: string;

  @ApiPropertyOptional({ description: 'Invoice PDF URL' })
  pdfUrl?: string;

  @ApiProperty({ description: 'Payment history' })
  payments: Array<{
    id: string;
    amount: number;
    paymentMethod: string;
    paymentReference?: string;
    status: PaymentStatus;
    processedDate: Date;
    notes?: string;
  }>;

  @ApiProperty({ description: 'Refund history' })
  refunds: Array<{
    id: string;
    amount: number;
    reason: string;
    refundMethod?: string;
    processedDate: Date;
    status: string;
  }>;

  @ApiPropertyOptional({ description: 'Invoice metadata' })
  metadata?: Record<string, any>;

  @ApiProperty({ description: 'Creation timestamp' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  updatedAt: Date;

  @ApiProperty({ description: 'Created by user ID' })
  createdBy: string;

  @ApiPropertyOptional({ description: 'Updated by user ID' })
  updatedBy?: string;
}

export class BulkInvoiceOperationDto {
  @ApiProperty({
    description: 'Operation type',
    enum: BulkInvoiceOperationType,
  })
  @IsEnum(BulkInvoiceOperationType)
  operation: BulkInvoiceOperationType;

  @ApiProperty({ description: 'Invoice IDs to operate on' })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(100)
  @IsUUID(4, { each: true })
  invoiceIds: string[];

  @ApiPropertyOptional({ description: 'Operation-specific data' })
  @IsOptional()
  @IsObject()
  data?: {
    status?: InvoiceStatus;
    dueDate?: Date;
    discountPercentage?: number;
    message?: string;
    reason?: string;
    paymentMethod?: string;
    [key: string]: any;
  };

  @ApiPropertyOptional({ description: 'Operation reason/notes' })
  @IsOptional()
  @IsString()
  @Length(0, 500)
  reason?: string;
}

export class InvoiceAnalyticsDto {
  @ApiPropertyOptional({ description: 'Date from' })
  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @ApiPropertyOptional({ description: 'Date to' })
  @IsOptional()
  @IsDateString()
  dateTo?: string;

  @ApiProperty({ description: 'Total revenue' })
  totalRevenue: number;

  @ApiProperty({ description: 'Total outstanding amount' })
  totalOutstanding: number;

  @ApiProperty({ description: 'Total overdue amount' })
  totalOverdue: number;

  @ApiProperty({ description: 'Total invoices count' })
  totalInvoices: number;

  @ApiProperty({ description: 'Paid invoices count' })
  paidInvoices: number;

  @ApiProperty({ description: 'Overdue invoices count' })
  overdueInvoices: number;

  @ApiProperty({ description: 'Average invoice amount' })
  averageInvoiceAmount: number;

  @ApiProperty({ description: 'Average payment time (days)' })
  averagePaymentTime: number;

  @ApiProperty({ description: 'Revenue by month' })
  revenueByMonth: Array<{
    month: string;
    revenue: number;
    invoiceCount: number;
  }>;

  @ApiProperty({ description: 'Top customers by revenue' })
  topCustomers: Array<{
    customerId: string;
    customerName: string;
    totalRevenue: number;
    invoiceCount: number;
  }>;

  @ApiProperty({ description: 'Invoice status distribution' })
  statusDistribution: Array<{
    status: InvoiceStatus;
    count: number;
    totalAmount: number;
  }>;

  @ApiProperty({ description: 'Revenue by invoice type' })
  revenueByType: Array<{
    type: InvoiceType;
    revenue: number;
    count: number;
  }>;

  @ApiProperty({ description: 'Payment method distribution' })
  paymentMethodDistribution: Array<{
    method: string;
    count: number;
    totalAmount: number;
  }>;
}

export class InvoiceExportDto {
  @ApiProperty({ description: 'Export type' })
  @IsString()
  @IsNotEmpty()
  exportType: string;

  @ApiProperty({ description: 'Export format', enum: ExportFormat })
  @IsEnum(ExportFormat)
  format: ExportFormat;

  @ApiPropertyOptional({ description: 'Export filters' })
  @IsOptional()
  @IsObject()
  filters?: {
    status?: InvoiceStatus[];
    type?: InvoiceType[];
    dateFrom?: Date;
    dateTo?: Date;
    customerIds?: string[];
    partnerIds?: string[];
    minAmount?: number;
    maxAmount?: number;
  };

  @ApiPropertyOptional({ description: 'Fields to include in export' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  fields?: string[];

  @ApiPropertyOptional({ description: 'Include line items detail' })
  @IsOptional()
  @IsBoolean()
  includeLineItems?: boolean;

  @ApiPropertyOptional({ description: 'Include payment history' })
  @IsOptional()
  @IsBoolean()
  includePayments?: boolean;
}

export class InvoiceReportDto {
  @ApiProperty({ description: 'Report type', enum: ReportType })
  @IsEnum(ReportType)
  reportType: ReportType;

  @ApiProperty({ description: 'Report format', enum: ExportFormat })
  @IsEnum(ExportFormat)
  format: ExportFormat;

  @ApiPropertyOptional({ description: 'Date range from' })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  dateFrom?: Date;

  @ApiPropertyOptional({ description: 'Date range to' })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  dateTo?: Date;

  @ApiPropertyOptional({ description: 'Customer IDs to include' })
  @IsOptional()
  @IsArray()
  @IsUUID(4, { each: true })
  customerIds?: string[];

  @ApiPropertyOptional({ description: 'Partner IDs to include' })
  @IsOptional()
  @IsArray()
  @IsUUID(4, { each: true })
  partnerIds?: string[];

  @ApiPropertyOptional({ description: 'Report parameters' })
  @IsOptional()
  @IsObject()
  parameters?: {
    groupBy?: string;
    includeDetails?: boolean;
    currency?: string;
    [key: string]: any;
  };
}

export class InvoiceSettingsDto {
  @ApiPropertyOptional({ description: 'Default invoice template' })
  @IsOptional()
  @IsString()
  defaultTemplate?: string;

  @ApiPropertyOptional({ description: 'Default payment terms (days)' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(365)
  defaultPaymentTerms?: number;

  @ApiPropertyOptional({ description: 'Default currency' })
  @IsOptional()
  @IsString()
  @Length(3, 3)
  defaultCurrency?: string;

  @ApiPropertyOptional({ description: 'Default tax rate' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  defaultTaxRate?: number;

  @ApiPropertyOptional({ description: 'Auto-send invoices' })
  @IsOptional()
  @IsBoolean()
  autoSendInvoices?: boolean;

  @ApiPropertyOptional({ description: 'Send payment reminders' })
  @IsOptional()
  @IsBoolean()
  sendPaymentReminders?: boolean;

  @ApiPropertyOptional({ description: 'Payment reminder days' })
  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  paymentReminderDays?: number[];

  @ApiPropertyOptional({ description: 'Late payment fee percentage' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  latePaymentFeePercentage?: number;

  @ApiPropertyOptional({ description: 'Invoice number prefix' })
  @IsOptional()
  @IsString()
  @Length(0, 10)
  invoiceNumberPrefix?: string;

  @ApiPropertyOptional({ description: 'Invoice number format' })
  @IsOptional()
  @IsString()
  invoiceNumberFormat?: string;

  @ApiPropertyOptional({ description: 'Company information' })
  @IsOptional()
  @IsObject()
  companyInfo?: {
    name: string;
    address: InvoiceAddressDto;
    phone?: string;
    email?: string;
    website?: string;
    taxId?: string;
    logo?: string;
  };

  @ApiPropertyOptional({ description: 'Email templates' })
  @IsOptional()
  @IsObject()
  emailTemplates?: {
    invoiceSent?: string;
    paymentReminder?: string;
    paymentReceived?: string;
    overdue?: string;
  };

  @ApiPropertyOptional({ description: 'Integration settings' })
  @IsOptional()
  @IsObject()
  integrations?: {
    paymentGateways?: string[];
    accountingSoftware?: string;
    emailProvider?: string;
  };

  @ApiPropertyOptional({ description: 'Notification settings' })
  @IsOptional()
  @IsObject()
  notifications?: {
    emailNotifications?: boolean;
    smsNotifications?: boolean;
    webhookUrl?: string;
  };
}
