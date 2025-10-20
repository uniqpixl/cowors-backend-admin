import {
  PaymentMethod,
  TransactionCategory,
  TransactionStatus,
  TransactionType,
} from '@/api/transaction/dto/financial-transaction.dto';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';

export class AdminTransactionQueryDto {
  @ApiPropertyOptional({ description: 'Page number', default: 1 })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @IsOptional()
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Items per page', default: 20 })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  @IsOptional()
  limit?: number = 20;

  @ApiPropertyOptional({
    description: 'Search term for description, user email, or partner name',
  })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({
    description: 'Filter by transaction status',
    enum: TransactionStatus,
  })
  @IsEnum(TransactionStatus)
  @IsOptional()
  status?: TransactionStatus;

  @ApiPropertyOptional({
    description: 'Filter by transaction type',
    enum: TransactionType,
  })
  @IsEnum(TransactionType)
  @IsOptional()
  type?: TransactionType;

  @ApiPropertyOptional({
    description: 'Filter by transaction category',
    enum: TransactionCategory,
  })
  @IsEnum(TransactionCategory)
  @IsOptional()
  category?: TransactionCategory;

  @ApiPropertyOptional({
    description: 'Filter by payment method',
    enum: PaymentMethod,
  })
  @IsEnum(PaymentMethod)
  @IsOptional()
  paymentMethod?: PaymentMethod;

  @ApiPropertyOptional({ description: 'Filter by user ID' })
  @IsUUID()
  @IsOptional()
  userId?: string;

  @ApiPropertyOptional({ description: 'Filter by partner ID' })
  @IsUUID()
  @IsOptional()
  partnerId?: string;

  @ApiPropertyOptional({ description: 'Filter by booking ID' })
  @IsUUID()
  @IsOptional()
  bookingId?: string;

  @ApiPropertyOptional({ description: 'Start date for filtering (YYYY-MM-DD)' })
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @ApiPropertyOptional({ description: 'End date for filtering (YYYY-MM-DD)' })
  @IsDateString()
  @IsOptional()
  endDate?: string;

  @ApiPropertyOptional({ description: 'Minimum amount filter' })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  minAmount?: number;

  @ApiPropertyOptional({ description: 'Maximum amount filter' })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  maxAmount?: number;

  @ApiPropertyOptional({
    description: 'Sort by field',
    enum: ['createdAt', 'amount', 'status', 'type'],
    default: 'createdAt',
  })
  @IsString()
  @IsOptional()
  sortBy?: string = 'createdAt';

  @ApiPropertyOptional({
    description: 'Sort order',
    enum: ['ASC', 'DESC'],
    default: 'DESC',
  })
  @IsEnum(['ASC', 'DESC'])
  @IsOptional()
  sortOrder?: 'ASC' | 'DESC' = 'DESC';
}

export class AdminTransactionResponseDto {
  @ApiProperty({ description: 'Transaction ID' })
  id: string;

  @ApiProperty({ description: 'User ID' })
  userId: string;

  @ApiProperty({ description: 'Transaction type', enum: TransactionType })
  type: TransactionType;

  @ApiProperty({ description: 'Transaction amount' })
  amount: number;

  @ApiProperty({ description: 'Currency code' })
  currency: string;

  @ApiProperty({ description: 'Transaction status', enum: TransactionStatus })
  status: TransactionStatus;

  @ApiProperty({ description: 'Transaction description' })
  description: string;

  @ApiPropertyOptional({ description: 'Reference ID' })
  reference?: string;

  @ApiPropertyOptional({ description: 'Booking ID' })
  bookingId?: string;

  @ApiProperty({ description: 'Creation date' })
  createdAt: string;

  @ApiProperty({ description: 'Last update date' })
  updatedAt: string;

  @ApiPropertyOptional({ description: 'Processing date' })
  processedAt?: string;
}

export class AdminTransactionListResponseDto {
  @ApiProperty({ type: [AdminTransactionResponseDto] })
  data: AdminTransactionResponseDto[];

  @ApiProperty({ description: 'Total number of records' })
  totalRecords: number;

  @ApiProperty({ description: 'Current page number' })
  currentPage: number;

  @ApiProperty({ description: 'Total number of pages' })
  totalPages: number;

  @ApiProperty({ description: 'Items per page' })
  limit: number;

  @ApiProperty({ description: 'Whether there is a next page' })
  hasNextPage: boolean;

  @ApiProperty({ description: 'Whether there is a previous page' })
  hasPreviousPage: boolean;
}

// Transaction Search DTO
export class TransactionSearchDto {
  @ApiProperty({ description: 'Search query for transaction details' })
  @IsString()
  query: string;

  @ApiPropertyOptional({ description: 'Page number', default: 1 })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @IsOptional()
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Items per page', default: 20 })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  @IsOptional()
  limit?: number = 20;

  @ApiPropertyOptional({ description: 'Search in specific fields' })
  @IsString({ each: true })
  @IsOptional()
  fields?: string[];
}

// Transaction Stats DTO
export class TransactionStatsDto {
  @ApiProperty({ description: 'Total transaction count' })
  totalTransactions: number;

  @ApiProperty({ description: 'Total transaction volume' })
  totalVolume: number;

  @ApiProperty({ description: 'Average transaction amount' })
  averageAmount: number;

  @ApiProperty({ description: 'Successful transactions count' })
  successfulTransactions: number;

  @ApiProperty({ description: 'Failed transactions count' })
  failedTransactions: number;

  @ApiProperty({ description: 'Pending transactions count' })
  pendingTransactions: number;

  @ApiProperty({ description: 'Success rate percentage' })
  successRate: number;

  @ApiProperty({ description: 'Transaction volume by payment method' })
  volumeByPaymentMethod: Record<string, number>;

  @ApiProperty({ description: 'Transaction count by status' })
  countByStatus: Record<string, number>;

  @ApiProperty({ description: 'Daily transaction trends' })
  dailyTrends: Array<{
    date: string;
    count: number;
    volume: number;
  }>;
}

// Pending Transactions Query DTO
export class PendingTransactionsQueryDto {
  @ApiPropertyOptional({ description: 'Page number', default: 1 })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @IsOptional()
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Items per page', default: 20 })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  @IsOptional()
  limit?: number = 20;

  @ApiPropertyOptional({ description: 'Filter by priority level' })
  @IsEnum(['high', 'medium', 'low'])
  @IsOptional()
  priority?: 'high' | 'medium' | 'low';

  @ApiPropertyOptional({ description: 'Filter by pending duration in hours' })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  pendingDurationHours?: number;
}

// Transaction Analytics DTO
export class TransactionAnalyticsDto {
  @ApiProperty({ description: 'Revenue analytics' })
  revenue: {
    total: number;
    growth: number;
    monthlyTrend: Array<{
      month: string;
      revenue: number;
    }>;
  };

  @ApiProperty({ description: 'Transaction volume analytics' })
  volume: {
    total: number;
    growth: number;
    monthlyTrend: Array<{
      month: string;
      count: number;
    }>;
  };

  @ApiProperty({ description: 'Payment method distribution' })
  paymentMethods: Array<{
    method: string;
    count: number;
    percentage: number;
    revenue: number;
  }>;

  @ApiProperty({ description: 'Geographic distribution' })
  geographic: Array<{
    country: string;
    count: number;
    revenue: number;
  }>;

  @ApiProperty({ description: 'Customer segments' })
  customerSegments: Array<{
    segment: string;
    count: number;
    averageValue: number;
    totalRevenue: number;
  }>;
}

// Refund Request DTO
export class RefundTransactionDto {
  @ApiProperty({ description: 'Transaction ID to refund' })
  @IsUUID()
  transactionId: string;

  @ApiProperty({ description: 'Refund amount' })
  @Type(() => Number)
  @IsNumber()
  @Min(0.01)
  amount: number;

  @ApiProperty({ description: 'Reason for refund' })
  @IsString()
  reason: string;

  @ApiPropertyOptional({ description: 'Admin notes' })
  @IsString()
  @IsOptional()
  adminNotes?: string;

  @ApiPropertyOptional({ description: 'Notify user via email' })
  @IsOptional()
  notifyUser?: boolean = true;
}

// Bulk Refund DTO
export class BulkRefundDto {
  @ApiProperty({ description: 'Array of transaction IDs to refund' })
  @IsArray()
  @IsUUID(4, { each: true })
  transactionIds: string[];

  @ApiProperty({ description: 'Refund reason' })
  @IsString()
  reason: string;

  @ApiPropertyOptional({ description: 'Admin notes' })
  @IsString()
  @IsOptional()
  adminNotes?: string;

  @ApiPropertyOptional({ description: 'Notify users via email' })
  @IsOptional()
  notifyUsers?: boolean = true;
}

// Transaction Disputes DTOs
export class TransactionDisputesQueryDto {
  @ApiPropertyOptional({ description: 'Page number', default: 1 })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @IsOptional()
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Items per page', default: 20 })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  @IsOptional()
  limit?: number = 20;

  @ApiPropertyOptional({ description: 'Filter by dispute status' })
  @IsEnum(['open', 'investigating', 'resolved', 'closed'])
  @IsOptional()
  disputeStatus?: 'open' | 'investigating' | 'resolved' | 'closed';

  @ApiPropertyOptional({ description: 'Filter by dispute type' })
  @IsEnum(['chargeback', 'refund_request', 'fraud', 'unauthorized', 'other'])
  @IsOptional()
  disputeType?:
    | 'chargeback'
    | 'refund_request'
    | 'fraud'
    | 'unauthorized'
    | 'other';

  @ApiPropertyOptional({ description: 'Filter by priority level' })
  @IsEnum(['low', 'medium', 'high', 'urgent'])
  @IsOptional()
  priority?: 'low' | 'medium' | 'high' | 'urgent';

  @ApiPropertyOptional({ description: 'Start date for filtering (YYYY-MM-DD)' })
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @ApiPropertyOptional({ description: 'End date for filtering (YYYY-MM-DD)' })
  @IsDateString()
  @IsOptional()
  endDate?: string;

  @ApiPropertyOptional({ description: 'Filter by user ID' })
  @IsUUID()
  @IsOptional()
  userId?: string;

  @ApiPropertyOptional({ description: 'Search term for dispute details' })
  @IsString()
  @IsOptional()
  search?: string;
}

export class TransactionDisputeDto {
  @ApiProperty({ description: 'Dispute ID' })
  id: string;

  @ApiProperty({ description: 'Transaction ID' })
  transactionId: string;

  @ApiProperty({ description: 'User ID' })
  userId: string;

  @ApiProperty({ description: 'Dispute type' })
  disputeType:
    | 'chargeback'
    | 'refund_request'
    | 'fraud'
    | 'unauthorized'
    | 'other';

  @ApiProperty({ description: 'Dispute status' })
  disputeStatus: 'open' | 'investigating' | 'resolved' | 'closed';

  @ApiProperty({ description: 'Priority level' })
  priority: 'low' | 'medium' | 'high' | 'urgent';

  @ApiProperty({ description: 'Dispute amount' })
  amount: number;

  @ApiProperty({ description: 'Currency code' })
  currency: string;

  @ApiProperty({ description: 'Dispute reason' })
  reason: string;

  @ApiProperty({ description: 'Dispute description' })
  description: string;

  @ApiPropertyOptional({ description: 'Evidence provided' })
  evidence?: string[];

  @ApiPropertyOptional({ description: 'Admin notes' })
  adminNotes?: string;

  @ApiPropertyOptional({ description: 'Resolution details' })
  resolution?: string;

  @ApiProperty({ description: 'Creation date' })
  createdAt: string;

  @ApiProperty({ description: 'Last update date' })
  updatedAt: string;

  @ApiPropertyOptional({ description: 'Resolution date' })
  resolvedAt?: string;

  @ApiProperty({ description: 'Transaction details' })
  transaction: {
    id: string;
    amount: number;
    currency: string;
    status: TransactionStatus;
    type: TransactionType;
    description: string;
    createdAt: string;
  };

  @ApiProperty({ description: 'User details' })
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
}

export class TransactionDisputesListResponseDto {
  @ApiProperty({ type: [TransactionDisputeDto] })
  data: TransactionDisputeDto[];

  @ApiProperty({ description: 'Total number of records' })
  totalRecords: number;

  @ApiProperty({ description: 'Current page number' })
  currentPage: number;

  @ApiProperty({ description: 'Total number of pages' })
  totalPages: number;

  @ApiProperty({ description: 'Items per page' })
  limit: number;

  @ApiProperty({ description: 'Whether there is a next page' })
  hasNextPage: boolean;

  @ApiProperty({ description: 'Whether there is a previous page' })
  hasPreviousPage: boolean;
}

// Transaction Export DTOs
export class TransactionExportDto {
  @ApiPropertyOptional({
    description: 'Export format',
    enum: ['csv', 'excel'],
    default: 'csv',
  })
  @IsEnum(['csv', 'excel'])
  @IsOptional()
  format?: 'csv' | 'excel' = 'csv';

  @ApiPropertyOptional({ description: 'Start date for export (YYYY-MM-DD)' })
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @ApiPropertyOptional({ description: 'End date for export (YYYY-MM-DD)' })
  @IsDateString()
  @IsOptional()
  endDate?: string;

  @ApiPropertyOptional({
    description: 'Filter by transaction status',
    enum: TransactionStatus,
  })
  @IsEnum(TransactionStatus)
  @IsOptional()
  status?: TransactionStatus;

  @ApiPropertyOptional({
    description: 'Filter by transaction type',
    enum: TransactionType,
  })
  @IsEnum(TransactionType)
  @IsOptional()
  type?: TransactionType;

  @ApiPropertyOptional({
    description: 'Filter by payment method',
    enum: PaymentMethod,
  })
  @IsEnum(PaymentMethod)
  @IsOptional()
  paymentMethod?: PaymentMethod;

  @ApiPropertyOptional({ description: 'Filter by user ID' })
  @IsUUID()
  @IsOptional()
  userId?: string;

  @ApiPropertyOptional({ description: 'Filter by partner ID' })
  @IsUUID()
  @IsOptional()
  partnerId?: string;

  @ApiPropertyOptional({ description: 'Minimum amount filter' })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  minAmount?: number;

  @ApiPropertyOptional({ description: 'Maximum amount filter' })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  maxAmount?: number;

  @ApiPropertyOptional({ description: 'Include user details in export' })
  @IsOptional()
  includeUserDetails?: boolean = true;

  @ApiPropertyOptional({ description: 'Include partner details in export' })
  @IsOptional()
  includePartnerDetails?: boolean = true;

  @ApiPropertyOptional({ description: 'Include booking details in export' })
  @IsOptional()
  includeBookingDetails?: boolean = false;

  @ApiPropertyOptional({ description: 'Fields to include in export' })
  @IsString({ each: true })
  @IsOptional()
  fields?: string[];
}

export class TransactionExportResponseDto {
  @ApiProperty({ description: 'Export file URL' })
  fileUrl: string;

  @ApiProperty({ description: 'Export file name' })
  fileName: string;

  @ApiProperty({ description: 'Export format' })
  format: 'csv' | 'excel';

  @ApiProperty({ description: 'Number of records exported' })
  recordCount: number;

  @ApiProperty({ description: 'Export creation date' })
  createdAt: string;

  @ApiProperty({ description: 'File size in bytes' })
  fileSize: number;

  @ApiProperty({ description: 'Export expiry date' })
  expiresAt: string;
}
