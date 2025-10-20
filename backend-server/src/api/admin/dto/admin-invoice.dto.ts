import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

// Enums for admin invoice management
export enum AdminInvoiceStatus {
  DRAFT = 'draft',
  SENT = 'sent',
  PAID = 'paid',
  OVERDUE = 'overdue',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded',
}

export enum AdminInvoiceType {
  BOOKING = 'booking',
  COMMISSION = 'commission',
  SUBSCRIPTION = 'subscription',
  OTHER = 'other',
}

export enum AdminInvoiceSortBy {
  CREATED_AT = 'createdAt',
  INVOICE_DATE = 'invoiceDate',
  DUE_DATE = 'dueDate',
  TOTAL_AMOUNT = 'totalAmount',
  INVOICE_NUMBER = 'invoiceNumber',
  STATUS = 'status',
}

export enum AdminInvoiceSortOrder {
  ASC = 'ASC',
  DESC = 'DESC',
}

// Query DTO for admin invoice listing
export class AdminInvoiceQueryDto {
  @ApiPropertyOptional({ description: 'Page number', default: 1, minimum: 1 })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @IsOptional()
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Items per page',
    default: 10,
    minimum: 1,
    maximum: 100,
  })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  @IsOptional()
  limit?: number = 10;

  @ApiPropertyOptional({
    description: 'Search by invoice number, customer name, or email',
  })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({
    description: 'Filter by invoice status',
    enum: AdminInvoiceStatus,
  })
  @IsEnum(AdminInvoiceStatus)
  @IsOptional()
  @Transform(({ value }) => (value === '' ? undefined : value))
  status?: AdminInvoiceStatus;

  @ApiPropertyOptional({
    description: 'Filter by invoice type',
    enum: AdminInvoiceType,
  })
  @IsEnum(AdminInvoiceType)
  @IsOptional()
  @Transform(({ value }) => (value === '' ? undefined : value))
  type?: AdminInvoiceType;

  @ApiPropertyOptional({
    description: 'Sort by field',
    enum: AdminInvoiceSortBy,
    default: AdminInvoiceSortBy.CREATED_AT,
  })
  @IsEnum(AdminInvoiceSortBy)
  @IsOptional()
  sortBy?: AdminInvoiceSortBy = AdminInvoiceSortBy.CREATED_AT;

  @ApiPropertyOptional({
    description: 'Sort order',
    enum: AdminInvoiceSortOrder,
    default: AdminInvoiceSortOrder.DESC,
  })
  @IsEnum(AdminInvoiceSortOrder)
  @IsOptional()
  @Transform(({ value }) =>
    value ? value.toUpperCase() : AdminInvoiceSortOrder.DESC,
  )
  sortOrder?: AdminInvoiceSortOrder = AdminInvoiceSortOrder.DESC;

  @ApiPropertyOptional({ description: 'Filter by partner ID' })
  @IsString()
  @IsOptional()
  partnerId?: string;

  @ApiPropertyOptional({ description: 'Filter by user ID' })
  @IsString()
  @IsOptional()
  userId?: string;

  @ApiPropertyOptional({ description: 'Filter by booking ID' })
  @IsString()
  @IsOptional()
  bookingId?: string;

  @ApiPropertyOptional({ description: 'Filter by date from (YYYY-MM-DD)' })
  @IsString()
  @IsOptional()
  dateFrom?: string;

  @ApiPropertyOptional({ description: 'Filter by date to (YYYY-MM-DD)' })
  @IsString()
  @IsOptional()
  dateTo?: string;

  @ApiPropertyOptional({ description: 'Filter by minimum amount' })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  minAmount?: number;

  @ApiPropertyOptional({ description: 'Filter by maximum amount' })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  maxAmount?: number;
}

// Response DTO for individual admin invoice
export class AdminInvoiceResponseDto {
  @ApiProperty({ description: 'Invoice ID' })
  id: string;

  @ApiProperty({ description: 'Invoice number' })
  invoiceNumber: string;

  @ApiProperty({ description: 'Invoice type', enum: AdminInvoiceType })
  type: AdminInvoiceType;

  @ApiProperty({ description: 'Invoice status', enum: AdminInvoiceStatus })
  status: AdminInvoiceStatus;

  @ApiProperty({ description: 'Customer information' })
  customer: {
    id: string;
    name: string;
    email: string;
    phone?: string;
    address?: any;
    taxId?: string;
  };

  @ApiPropertyOptional({ description: 'Partner information' })
  partner?: {
    id: string;
    name: string;
    email: string;
  };

  @ApiPropertyOptional({ description: 'Booking information' })
  booking?: {
    id: string;
    spaceId?: string;
    spaceName?: string;
    startDate: Date;
    endDate: Date;
  };

  @ApiProperty({ description: 'Invoice line items' })
  lineItems: any[];

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

  @ApiProperty({ description: 'Due date' })
  dueDate: Date;

  @ApiPropertyOptional({ description: 'Sent date' })
  sentDate?: Date;

  @ApiPropertyOptional({ description: 'Paid date' })
  paidDate?: Date;

  @ApiPropertyOptional({ description: 'Notes' })
  notes?: string;

  @ApiPropertyOptional({ description: 'Terms and conditions' })
  terms?: string;

  @ApiPropertyOptional({ description: 'PDF URL' })
  pdfUrl?: string;

  @ApiPropertyOptional({ description: 'Additional metadata' })
  metadata?: Record<string, any>;

  @ApiProperty({ description: 'Created at' })
  createdAt: Date;

  @ApiProperty({ description: 'Updated at' })
  updatedAt: Date;
}

// Response DTO for admin invoice list
export class AdminInvoiceListResponseDto {
  @ApiProperty({
    description: 'List of invoices',
    type: [AdminInvoiceResponseDto],
  })
  invoices: AdminInvoiceResponseDto[];

  @ApiProperty({ description: 'Pagination information' })
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  };

  @ApiProperty({ description: 'Summary statistics' })
  summary: {
    totalAmount: number;
    totalPaid: number;
    totalOutstanding: number;
    invoicesByStatus: {
      [key in AdminInvoiceStatus]: number;
    };
  };
}

// DTO for updating invoice status
export class AdminUpdateInvoiceStatusDto {
  @ApiProperty({ description: 'New invoice status', enum: AdminInvoiceStatus })
  @IsEnum(AdminInvoiceStatus)
  status: AdminInvoiceStatus;

  @ApiPropertyOptional({ description: 'Processing notes' })
  @IsString()
  @IsOptional()
  notes?: string;
}

// DTO for batch invoice processing
export class AdminBatchInvoiceProcessDto {
  @ApiProperty({ description: 'Array of invoice IDs to process' })
  @IsString({ each: true })
  invoiceIds: string[];

  @ApiProperty({
    description: 'Action to perform',
    enum: ['send', 'cancel', 'mark_paid'],
  })
  @IsEnum(['send', 'cancel', 'mark_paid'])
  action: 'send' | 'cancel' | 'mark_paid';

  @ApiPropertyOptional({ description: 'Processing notes' })
  @IsString()
  @IsOptional()
  notes?: string;
}

// DTO for invoice analytics
export class AdminInvoiceAnalyticsDto {
  @ApiProperty({ description: 'Total number of invoices' })
  totalInvoices: number;

  @ApiProperty({ description: 'Total invoice amount' })
  totalAmount: number;

  @ApiProperty({ description: 'Total paid amount' })
  totalPaid: number;

  @ApiProperty({ description: 'Total outstanding amount' })
  totalOutstanding: number;

  @ApiProperty({ description: 'Average invoice amount' })
  averageAmount: number;

  @ApiProperty({ description: 'Invoices by status breakdown' })
  invoicesByStatus: {
    draft: number;
    sent: number;
    paid: number;
    overdue: number;
    cancelled: number;
    refunded: number;
  };

  @ApiProperty({ description: 'Invoices by type breakdown' })
  invoicesByType: {
    booking: number;
    commission: number;
    subscription: number;
    other: number;
  };

  @ApiProperty({ description: 'Invoices by time range' })
  invoicesByTimeRange: Array<{
    date: string;
    count: number;
    amount: number;
  }>;
}
