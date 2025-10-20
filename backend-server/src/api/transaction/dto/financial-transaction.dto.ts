import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsDateString,
  IsDecimal,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsPhoneNumber,
  IsPositive,
  IsString,
  IsUUID,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';

// Enums
export enum TransactionStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded',
  DISPUTED = 'disputed',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

export enum TransactionType {
  PAYMENT = 'payment',
  REFUND = 'refund',
  PAYOUT = 'payout',
  COMMISSION = 'commission',
  REWARD = 'reward',
  CREDIT = 'credit',
  DEBIT = 'debit',
  TRANSFER = 'transfer',
  FEE = 'fee',
  TAX = 'tax',
  ADJUSTMENT = 'adjustment',
}

export enum TransactionCategory {
  BOOKING = 'booking',
  REFUND = 'refund',
  PAYOUT = 'payout',
  REWARD = 'reward',
  CREDIT = 'credit',
  COMMISSION = 'commission',
  FEE = 'fee',
  TAX = 'tax',
  PENALTY = 'penalty',
  BONUS = 'bonus',
  ADJUSTMENT = 'adjustment',
  OTHER = 'other',
}

export enum PaymentMethod {
  CREDIT_CARD = 'credit_card',
  DEBIT_CARD = 'debit_card',
  NET_BANKING = 'net_banking',
  UPI = 'upi',
  WALLET = 'wallet',
  BANK_TRANSFER = 'bank_transfer',
  CASH = 'cash',
  CHEQUE = 'cheque',
  RAZORPAY = 'razorpay',
  STRIPE = 'stripe',
  PAYTM = 'paytm',
  PHONEPE = 'phonepe',
  GPAY = 'gpay',
  OTHER = 'other',
}

export enum ExportFormat {
  CSV = 'csv',
  EXCEL = 'excel',
  PDF = 'pdf',
  JSON = 'json',
}

export enum ExportStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

export enum BulkOperationType {
  APPROVE = 'approve',
  REJECT = 'reject',
  COMPLETE = 'complete',
  CANCEL = 'cancel',
  DELETE = 'delete',
  UPDATE_STATUS = 'update_status',
  EXPORT = 'export',
}

// DTOs
export class CreateTransactionDto {
  @ApiProperty({ description: 'Transaction type', enum: TransactionType })
  @IsEnum(TransactionType)
  @IsNotEmpty()
  type: TransactionType;

  @ApiProperty({
    description: 'Transaction category',
    enum: TransactionCategory,
  })
  @IsEnum(TransactionCategory)
  @IsNotEmpty()
  category: TransactionCategory;

  @ApiProperty({ description: 'Transaction amount' })
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  @IsNotEmpty()
  amount: number;

  @ApiProperty({ description: 'Currency code', default: 'INR' })
  @IsString()
  @IsNotEmpty()
  currency: string;

  @ApiProperty({ description: 'Transaction description' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiPropertyOptional({ description: 'Payment method', enum: PaymentMethod })
  @IsEnum(PaymentMethod)
  @IsOptional()
  paymentMethod?: PaymentMethod;

  @ApiPropertyOptional({ description: 'User ID' })
  @IsUUID()
  @IsOptional()
  userId?: string;

  @ApiPropertyOptional({ description: 'Partner ID' })
  @IsUUID()
  @IsOptional()
  partnerId?: string;

  @ApiPropertyOptional({ description: 'Booking ID' })
  @IsUUID()
  @IsOptional()
  bookingId?: string;

  @ApiPropertyOptional({ description: 'Invoice ID' })
  @IsUUID()
  @IsOptional()
  invoiceId?: string;

  @ApiPropertyOptional({ description: 'External transaction ID' })
  @IsString()
  @IsOptional()
  externalTransactionId?: string;

  @ApiPropertyOptional({ description: 'Payment gateway' })
  @IsString()
  @IsOptional()
  paymentGateway?: string;

  @ApiPropertyOptional({ description: 'Gateway transaction ID' })
  @IsString()
  @IsOptional()
  gatewayTransactionId?: string;

  @ApiPropertyOptional({ description: 'Gateway response' })
  @IsObject()
  @IsOptional()
  gatewayResponse?: any;

  @ApiPropertyOptional({ description: 'Tax amount' })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @IsOptional()
  taxAmount?: number;

  @ApiPropertyOptional({ description: 'Fee amount' })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @IsOptional()
  feeAmount?: number;

  @ApiPropertyOptional({ description: 'Net amount' })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @IsOptional()
  netAmount?: number;

  @ApiPropertyOptional({ description: 'Transaction notes' })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional({ description: 'Additional metadata' })
  @IsObject()
  @IsOptional()
  metadata?: any;

  @ApiPropertyOptional({ description: 'Transaction date' })
  @IsDateString()
  @IsOptional()
  transactionDate?: string;

  @ApiPropertyOptional({ description: 'Due date' })
  @IsDateString()
  @IsOptional()
  dueDate?: string;
}

export class UpdateTransactionDto {
  @ApiPropertyOptional({
    description: 'Transaction status',
    enum: TransactionStatus,
  })
  @IsEnum(TransactionStatus)
  @IsOptional()
  status?: TransactionStatus;

  @ApiPropertyOptional({ description: 'Transaction description' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: 'Payment method', enum: PaymentMethod })
  @IsEnum(PaymentMethod)
  @IsOptional()
  paymentMethod?: PaymentMethod;

  @ApiPropertyOptional({ description: 'External transaction ID' })
  @IsString()
  @IsOptional()
  externalTransactionId?: string;

  @ApiPropertyOptional({ description: 'Gateway transaction ID' })
  @IsString()
  @IsOptional()
  gatewayTransactionId?: string;

  @ApiPropertyOptional({ description: 'Gateway response' })
  @IsObject()
  @IsOptional()
  gatewayResponse?: any;

  @ApiPropertyOptional({ description: 'Transaction notes' })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional({ description: 'Additional metadata' })
  @IsObject()
  @IsOptional()
  metadata?: any;

  @ApiPropertyOptional({ description: 'Transaction date' })
  @IsDateString()
  @IsOptional()
  transactionDate?: string;

  @ApiPropertyOptional({ description: 'Due date' })
  @IsDateString()
  @IsOptional()
  dueDate?: string;
}

export class GetTransactionsDto {
  @ApiPropertyOptional({ description: 'Page number', default: 1 })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @IsOptional()
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Items per page', default: 10 })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  @IsOptional()
  limit?: number = 10;

  @ApiPropertyOptional({ description: 'Search term' })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({
    description: 'Filter by status',
    enum: TransactionStatus,
  })
  @IsEnum(TransactionStatus)
  @IsOptional()
  status?: TransactionStatus;

  @ApiPropertyOptional({ description: 'Filter by type', enum: TransactionType })
  @IsEnum(TransactionType)
  @IsOptional()
  type?: TransactionType;

  @ApiPropertyOptional({
    description: 'Filter by category',
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

  @ApiPropertyOptional({ description: 'Minimum amount' })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  minAmount?: number;

  @ApiPropertyOptional({ description: 'Maximum amount' })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  maxAmount?: number;

  @ApiPropertyOptional({ description: 'Start date' })
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @ApiPropertyOptional({ description: 'End date' })
  @IsDateString()
  @IsOptional()
  endDate?: string;

  @ApiPropertyOptional({ description: 'Sort by field', default: 'createdAt' })
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

export class TransactionResponseDto {
  @ApiProperty({ description: 'Transaction ID' })
  id: string;

  @ApiProperty({ description: 'Transaction type', enum: TransactionType })
  type: TransactionType;

  @ApiProperty({
    description: 'Transaction category',
    enum: TransactionCategory,
  })
  category: TransactionCategory;

  @ApiProperty({ description: 'Transaction status', enum: TransactionStatus })
  status: TransactionStatus;

  @ApiProperty({ description: 'Transaction amount' })
  amount: number;

  @ApiProperty({ description: 'Currency code' })
  currency: string;

  @ApiProperty({ description: 'Transaction description' })
  description: string;

  @ApiPropertyOptional({ description: 'Payment method', enum: PaymentMethod })
  paymentMethod?: PaymentMethod;

  @ApiPropertyOptional({ description: 'User information' })
  user?: {
    id: string;
    name: string;
    email: string;
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
    bookingNumber: string;
  };

  @ApiPropertyOptional({ description: 'Invoice information' })
  invoice?: {
    id: string;
    invoiceNumber: string;
  };

  @ApiPropertyOptional({ description: 'External transaction ID' })
  externalTransactionId?: string;

  @ApiPropertyOptional({ description: 'Payment gateway' })
  paymentGateway?: string;

  @ApiPropertyOptional({ description: 'Gateway transaction ID' })
  gatewayTransactionId?: string;

  @ApiPropertyOptional({ description: 'Gateway response' })
  gatewayResponse?: any;

  @ApiPropertyOptional({ description: 'Tax amount' })
  taxAmount?: number;

  @ApiPropertyOptional({ description: 'Fee amount' })
  feeAmount?: number;

  @ApiPropertyOptional({ description: 'Net amount' })
  netAmount?: number;

  @ApiPropertyOptional({ description: 'Transaction notes' })
  notes?: string;

  @ApiPropertyOptional({ description: 'Additional metadata' })
  metadata?: any;

  @ApiProperty({ description: 'Transaction date' })
  transactionDate: Date;

  @ApiPropertyOptional({ description: 'Due date' })
  dueDate?: Date;

  @ApiProperty({ description: 'Created at' })
  createdAt: Date;

  @ApiProperty({ description: 'Updated at' })
  updatedAt: Date;

  @ApiPropertyOptional({ description: 'Created by user' })
  createdBy?: {
    id: string;
    name: string;
  };

  @ApiPropertyOptional({ description: 'Updated by user' })
  updatedBy?: {
    id: string;
    name: string;
  };
}

export class BulkTransactionOperationDto {
  @ApiProperty({ description: 'Operation type', enum: BulkOperationType })
  @IsEnum(BulkOperationType)
  @IsNotEmpty()
  operation: BulkOperationType;

  @ApiProperty({ description: 'Transaction IDs', type: [String] })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(100)
  @IsUUID(4, { each: true })
  transactionIds: string[];

  @ApiPropertyOptional({ description: 'Operation data' })
  @IsObject()
  @IsOptional()
  data?: any;

  @ApiPropertyOptional({ description: 'Operation reason' })
  @IsString()
  @IsOptional()
  reason?: string;
}

export class BulkOperationResponseDto {
  @ApiProperty({ description: 'Operation ID' })
  operationId: string;

  @ApiProperty({ description: 'Operation type', enum: BulkOperationType })
  operation: BulkOperationType;

  @ApiProperty({ description: 'Total items' })
  totalItems: number;

  @ApiProperty({ description: 'Successful items' })
  successfulItems: number;

  @ApiProperty({ description: 'Failed items' })
  failedItems: number;

  @ApiProperty({ description: 'Operation status' })
  status: string;

  @ApiPropertyOptional({ description: 'Error details' })
  errors?: Array<{
    transactionId: string;
    error: string;
  }>;

  @ApiProperty({ description: 'Started at' })
  startedAt: Date;

  @ApiPropertyOptional({ description: 'Completed at' })
  completedAt?: Date;
}

export class TransactionAnalyticsDto {
  @ApiPropertyOptional({ description: 'Start date' })
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @ApiPropertyOptional({ description: 'End date' })
  @IsDateString()
  @IsOptional()
  endDate?: string;

  @ApiPropertyOptional({
    description: 'Group by period',
    enum: ['day', 'week', 'month', 'year'],
  })
  @IsEnum(['day', 'week', 'month', 'year'])
  @IsOptional()
  groupBy?: 'day' | 'week' | 'month' | 'year';

  @ApiPropertyOptional({ description: 'Filter by type', enum: TransactionType })
  @IsEnum(TransactionType)
  @IsOptional()
  type?: TransactionType;

  @ApiPropertyOptional({
    description: 'Filter by category',
    enum: TransactionCategory,
  })
  @IsEnum(TransactionCategory)
  @IsOptional()
  category?: TransactionCategory;

  @ApiPropertyOptional({ description: 'Filter by partner ID' })
  @IsUUID()
  @IsOptional()
  partnerId?: string;
}

export class TransactionAnalyticsResponseDto {
  @ApiProperty({ description: 'Total transactions' })
  totalTransactions: number;

  @ApiProperty({ description: 'Total amount' })
  totalAmount: number;

  @ApiProperty({ description: 'Average transaction amount' })
  averageAmount: number;

  @ApiProperty({ description: 'Transactions by status' })
  transactionsByStatus: Array<{
    status: TransactionStatus;
    count: number;
    amount: number;
  }>;

  @ApiProperty({ description: 'Transactions by type' })
  transactionsByType: Array<{
    type: TransactionType;
    count: number;
    amount: number;
  }>;

  @ApiProperty({ description: 'Transactions by category' })
  transactionsByCategory: Array<{
    category: TransactionCategory;
    count: number;
    amount: number;
  }>;

  @ApiProperty({ description: 'Transactions over time' })
  transactionsOverTime: Array<{
    period: string;
    count: number;
    amount: number;
  }>;

  @ApiProperty({ description: 'Top payment methods' })
  topPaymentMethods: Array<{
    method: PaymentMethod;
    count: number;
    amount: number;
  }>;

  @ApiProperty({ description: 'Analysis period' })
  analysisPeriod: {
    startDate: Date;
    endDate: Date;
  };
}

export class TransactionSummaryResponseDto {
  @ApiProperty({ description: 'Total revenue' })
  totalRevenue: number;

  @ApiProperty({ description: 'Total payouts' })
  totalPayouts: number;

  @ApiProperty({ description: 'Total refunds' })
  totalRefunds: number;

  @ApiProperty({ description: 'Total fees' })
  totalFees: number;

  @ApiProperty({ description: 'Total taxes' })
  totalTaxes: number;

  @ApiProperty({ description: 'Net income' })
  netIncome: number;

  @ApiProperty({ description: 'Pending amount' })
  pendingAmount: number;

  @ApiProperty({ description: 'Failed amount' })
  failedAmount: number;

  @ApiProperty({ description: 'Growth rate' })
  growthRate: number;

  @ApiProperty({ description: 'Currency' })
  currency: string;

  @ApiProperty({ description: 'Period' })
  period: {
    startDate: Date;
    endDate: Date;
  };
}

export class CashFlowReportResponseDto {
  @ApiProperty({ description: 'Cash inflows' })
  cashInflows: Array<{
    category: string;
    amount: number;
    percentage: number;
  }>;

  @ApiProperty({ description: 'Cash outflows' })
  cashOutflows: Array<{
    category: string;
    amount: number;
    percentage: number;
  }>;

  @ApiProperty({ description: 'Net cash flow' })
  netCashFlow: number;

  @ApiProperty({ description: 'Opening balance' })
  openingBalance: number;

  @ApiProperty({ description: 'Closing balance' })
  closingBalance: number;

  @ApiProperty({ description: 'Cash flow by period' })
  cashFlowByPeriod: Array<{
    period: string;
    inflow: number;
    outflow: number;
    netFlow: number;
  }>;

  @ApiProperty({ description: 'Report period' })
  reportPeriod: {
    startDate: Date;
    endDate: Date;
  };
}

export class ExportTransactionsDto {
  @ApiProperty({ description: 'Export format', enum: ExportFormat })
  @IsEnum(ExportFormat)
  @IsNotEmpty()
  format: ExportFormat;

  @ApiPropertyOptional({ description: 'Filter criteria' })
  @ValidateNested()
  @Type(() => GetTransactionsDto)
  @IsOptional()
  filters?: GetTransactionsDto;

  @ApiPropertyOptional({ description: 'Include fields', type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  includeFields?: string[];

  @ApiPropertyOptional({ description: 'Export name' })
  @IsString()
  @IsOptional()
  name?: string;
}

export class ExportResponseDto {
  @ApiProperty({ description: 'Export ID' })
  exportId: string;

  @ApiProperty({ description: 'Export status', enum: ExportStatus })
  status: ExportStatus;

  @ApiProperty({ description: 'Export format', enum: ExportFormat })
  format: ExportFormat;

  @ApiProperty({ description: 'Total records' })
  totalRecords: number;

  @ApiPropertyOptional({ description: 'Download URL' })
  downloadUrl?: string;

  @ApiProperty({ description: 'Created at' })
  createdAt: Date;

  @ApiPropertyOptional({ description: 'Completed at' })
  completedAt?: Date;

  @ApiPropertyOptional({ description: 'Expires at' })
  expiresAt?: Date;
}

export class TransactionSettingsDto {
  @ApiPropertyOptional({ description: 'Auto-approve threshold' })
  @IsNumber()
  @Min(0)
  @IsOptional()
  autoApproveThreshold?: number;

  @ApiPropertyOptional({ description: 'Default currency' })
  @IsString()
  @IsOptional()
  defaultCurrency?: string;

  @ApiPropertyOptional({ description: 'Enable notifications' })
  @IsBoolean()
  @IsOptional()
  enableNotifications?: boolean;

  @ApiPropertyOptional({ description: 'Notification email' })
  @IsEmail()
  @IsOptional()
  notificationEmail?: string;

  @ApiPropertyOptional({ description: 'Transaction timeout (minutes)' })
  @IsNumber()
  @Min(1)
  @IsOptional()
  transactionTimeout?: number;

  @ApiPropertyOptional({ description: 'Max retry attempts' })
  @IsNumber()
  @Min(0)
  @Max(10)
  @IsOptional()
  maxRetryAttempts?: number;

  @ApiPropertyOptional({ description: 'Enable audit trail' })
  @IsBoolean()
  @IsOptional()
  enableAuditTrail?: boolean;

  @ApiPropertyOptional({ description: 'Data retention days' })
  @IsNumber()
  @Min(30)
  @IsOptional()
  dataRetentionDays?: number;
}

export class TransactionSettingsResponseDto {
  @ApiProperty({ description: 'Settings ID' })
  id: string;

  @ApiProperty({ description: 'Auto-approve threshold' })
  autoApproveThreshold: number;

  @ApiProperty({ description: 'Default currency' })
  defaultCurrency: string;

  @ApiProperty({ description: 'Enable notifications' })
  enableNotifications: boolean;

  @ApiPropertyOptional({ description: 'Notification email' })
  notificationEmail?: string;

  @ApiProperty({ description: 'Transaction timeout (minutes)' })
  transactionTimeout: number;

  @ApiProperty({ description: 'Max retry attempts' })
  maxRetryAttempts: number;

  @ApiProperty({ description: 'Enable audit trail' })
  enableAuditTrail: boolean;

  @ApiProperty({ description: 'Data retention days' })
  dataRetentionDays: number;

  @ApiProperty({ description: 'Created at' })
  createdAt: Date;

  @ApiProperty({ description: 'Updated at' })
  updatedAt: Date;

  @ApiPropertyOptional({ description: 'Updated by user' })
  updatedBy?: {
    id: string;
    name: string;
  };
}
