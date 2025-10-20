import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNumber,
  IsObject,
  IsOptional,
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
  REVERSED = 'reversed',
  RECONCILED = 'reconciled',
}

export enum TransactionType {
  CREDIT = 'credit',
  DEBIT = 'debit',
}

export enum TransactionCategory {
  BOOKING_PAYMENT = 'booking_payment',
  BOOKING_REFUND = 'booking_refund',
  PARTNER_PAYOUT = 'partner_payout',
  COMMISSION_PAYMENT = 'commission_payment',
  REWARD_CREDIT = 'reward_credit',
  WALLET_TOPUP = 'wallet_topup',
  WALLET_WITHDRAWAL = 'wallet_withdrawal',
  PLATFORM_FEE = 'platform_fee',
  TAX_PAYMENT = 'tax_payment',
  PENALTY = 'penalty',
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
  OTHER = 'other',
}

export enum BulkTransactionOperationType {
  UPDATE_STATUS = 'update_status',
  APPROVE_TRANSACTIONS = 'approve_transactions',
  REJECT_TRANSACTIONS = 'reject_transactions',
  REVERSE_TRANSACTIONS = 'reverse_transactions',
  RECONCILE_TRANSACTIONS = 'reconcile_transactions',
  DELETE_TRANSACTIONS = 'delete_transactions',
  EXPORT_TRANSACTIONS = 'export_transactions',
}

export enum ExportFormat {
  CSV = 'csv',
  EXCEL = 'excel',
  PDF = 'pdf',
  JSON = 'json',
}

export enum ReportType {
  TRANSACTION_SUMMARY = 'transaction_summary',
  CASH_FLOW = 'cash_flow',
  RECONCILIATION = 'reconciliation',
  TAX_REPORT = 'tax_report',
  PARTNER_STATEMENT = 'partner_statement',
  CUSTOMER_STATEMENT = 'customer_statement',
  AUDIT_TRAIL = 'audit_trail',
}

// DTOs
export class CreateTransactionDto {
  @ApiProperty({ description: 'Transaction type', enum: TransactionType })
  @IsEnum(TransactionType)
  type: TransactionType;

  @ApiProperty({
    description: 'Transaction category',
    enum: TransactionCategory,
  })
  @IsEnum(TransactionCategory)
  category: TransactionCategory;

  @ApiProperty({ description: 'Transaction amount', minimum: 0 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  amount: number;

  @ApiProperty({ description: 'Currency code', default: 'INR' })
  @IsString()
  currency: string = 'INR';

  @ApiProperty({ description: 'Transaction description' })
  @IsString()
  description: string;

  @ApiPropertyOptional({ description: 'User ID associated with transaction' })
  @IsOptional()
  @IsUUID()
  userId?: string;

  @ApiPropertyOptional({
    description: 'Partner ID associated with transaction',
  })
  @IsOptional()
  @IsUUID()
  partnerId?: string;

  @ApiPropertyOptional({
    description: 'Booking ID associated with transaction',
  })
  @IsOptional()
  @IsUUID()
  bookingId?: string;

  @ApiPropertyOptional({
    description: 'Invoice ID associated with transaction',
  })
  @IsOptional()
  @IsUUID()
  invoiceId?: string;

  @ApiPropertyOptional({
    description: 'Payment method used',
    enum: PaymentMethod,
  })
  @IsOptional()
  @IsEnum(PaymentMethod)
  paymentMethod?: PaymentMethod;

  @ApiPropertyOptional({ description: 'Payment gateway reference' })
  @IsOptional()
  @IsString()
  paymentGatewayReference?: string;

  @ApiPropertyOptional({ description: 'Bank reference number' })
  @IsOptional()
  @IsString()
  bankReference?: string;

  @ApiPropertyOptional({ description: 'External transaction ID' })
  @IsOptional()
  @IsString()
  externalTransactionId?: string;

  @ApiPropertyOptional({ description: 'Transaction notes' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ description: 'Additional metadata' })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Transaction date', type: Date })
  @IsOptional()
  @IsDateString()
  transactionDate?: Date;

  @ApiPropertyOptional({
    description: 'Auto-approve transaction',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  autoApprove?: boolean = false;
}

export class UpdateTransactionDto {
  @ApiPropertyOptional({
    description: 'Transaction status',
    enum: TransactionStatus,
  })
  @IsOptional()
  @IsEnum(TransactionStatus)
  status?: TransactionStatus;

  @ApiPropertyOptional({ description: 'Transaction description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'Payment method used',
    enum: PaymentMethod,
  })
  @IsOptional()
  @IsEnum(PaymentMethod)
  paymentMethod?: PaymentMethod;

  @ApiPropertyOptional({ description: 'Payment gateway reference' })
  @IsOptional()
  @IsString()
  paymentGatewayReference?: string;

  @ApiPropertyOptional({ description: 'Bank reference number' })
  @IsOptional()
  @IsString()
  bankReference?: string;

  @ApiPropertyOptional({ description: 'External transaction ID' })
  @IsOptional()
  @IsString()
  externalTransactionId?: string;

  @ApiPropertyOptional({ description: 'Transaction notes' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ description: 'Additional metadata' })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Reconciliation date', type: Date })
  @IsOptional()
  @IsDateString()
  reconciliationDate?: Date;

  @ApiPropertyOptional({ description: 'Reconciliation notes' })
  @IsOptional()
  @IsString()
  reconciliationNotes?: string;
}

export class TransactionResponseDto {
  @ApiProperty({ description: 'Transaction ID' })
  id: string;

  @ApiProperty({ description: 'Transaction reference number' })
  transactionReference: string;

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
    spaceId: string;
    spaceName: string;
    startDate: Date;
    endDate: Date;
  };

  @ApiPropertyOptional({ description: 'Invoice information' })
  invoice?: {
    id: string;
    invoiceNumber: string;
    totalAmount: number;
  };

  @ApiPropertyOptional({
    description: 'Payment method used',
    enum: PaymentMethod,
  })
  paymentMethod?: PaymentMethod;

  @ApiPropertyOptional({ description: 'Payment gateway reference' })
  paymentGatewayReference?: string;

  @ApiPropertyOptional({ description: 'Bank reference number' })
  bankReference?: string;

  @ApiPropertyOptional({ description: 'External transaction ID' })
  externalTransactionId?: string;

  @ApiProperty({ description: 'Transaction date' })
  transactionDate: Date;

  @ApiPropertyOptional({ description: 'Processing date' })
  processingDate?: Date;

  @ApiPropertyOptional({ description: 'Completion date' })
  completionDate?: Date;

  @ApiPropertyOptional({ description: 'Reconciliation date' })
  reconciliationDate?: Date;

  @ApiPropertyOptional({ description: 'Transaction notes' })
  notes?: string;

  @ApiPropertyOptional({ description: 'Reconciliation notes' })
  reconciliationNotes?: string;

  @ApiPropertyOptional({ description: 'Additional metadata' })
  metadata?: Record<string, any>;

  @ApiProperty({ description: 'Creation timestamp' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  updatedAt: Date;

  @ApiPropertyOptional({ description: 'Created by user ID' })
  createdBy?: string;

  @ApiPropertyOptional({ description: 'Updated by user ID' })
  updatedBy?: string;
}

export class BulkTransactionOperationDto {
  @ApiProperty({
    description: 'Bulk operation type',
    enum: BulkTransactionOperationType,
  })
  @IsEnum(BulkTransactionOperationType)
  operation: BulkTransactionOperationType;

  @ApiProperty({ description: 'Transaction IDs to operate on', type: [String] })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(100)
  @IsUUID(4, { each: true })
  transactionIds: string[];

  @ApiPropertyOptional({ description: 'Operation data' })
  @IsOptional()
  @IsObject()
  data?: {
    status?: TransactionStatus;
    bankReference?: string;
    reconciliationDate?: Date;
    notes?: string;
    reason?: string;
  };

  @ApiPropertyOptional({ description: 'Reason for bulk operation' })
  @IsOptional()
  @IsString()
  reason?: string;
}

export class TransactionAnalyticsDto {
  @ApiProperty({ description: 'Total transaction volume' })
  totalVolume: number;

  @ApiProperty({ description: 'Total credit amount' })
  totalCredits: number;

  @ApiProperty({ description: 'Total debit amount' })
  totalDebits: number;

  @ApiProperty({ description: 'Net amount (credits - debits)' })
  netAmount: number;

  @ApiProperty({ description: 'Total number of transactions' })
  totalTransactions: number;

  @ApiProperty({ description: 'Number of completed transactions' })
  completedTransactions: number;

  @ApiProperty({ description: 'Number of pending transactions' })
  pendingTransactions: number;

  @ApiProperty({ description: 'Number of failed transactions' })
  failedTransactions: number;

  @ApiProperty({ description: 'Average transaction amount' })
  averageTransactionAmount: number;

  @ApiProperty({ description: 'Success rate percentage' })
  successRate: number;

  @ApiProperty({ description: 'Volume by category' })
  volumeByCategory: Array<{
    category: TransactionCategory;
    volume: number;
    count: number;
  }>;

  @ApiProperty({ description: 'Volume by payment method' })
  volumeByPaymentMethod: Array<{
    method: PaymentMethod;
    volume: number;
    count: number;
  }>;

  @ApiProperty({ description: 'Daily transaction trends' })
  dailyTrends: Array<{
    date: string;
    volume: number;
    count: number;
    credits: number;
    debits: number;
  }>;

  @ApiProperty({ description: 'Top partners by transaction volume' })
  topPartners: Array<{
    partnerId: string;
    partnerName: string;
    volume: number;
    transactionCount: number;
  }>;

  @ApiProperty({ description: 'Status distribution' })
  statusDistribution: Array<{
    status: TransactionStatus;
    count: number;
    percentage: number;
  }>;
}

export class TransactionExportDto {
  @ApiProperty({ description: 'Export type', default: 'transactions' })
  @IsString()
  exportType: string = 'transactions';

  @ApiProperty({ description: 'Export format', enum: ExportFormat })
  @IsEnum(ExportFormat)
  format: ExportFormat;

  @ApiPropertyOptional({ description: 'Export filters' })
  @IsOptional()
  @IsObject()
  filters?: {
    status?: TransactionStatus[];
    type?: TransactionType[];
    category?: TransactionCategory[];
    dateFrom?: Date;
    dateTo?: Date;
    userId?: string;
    partnerId?: string;
    minAmount?: number;
    maxAmount?: number;
  };

  @ApiPropertyOptional({
    description: 'Fields to include in export',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  fields?: string[];

  @ApiPropertyOptional({ description: 'Include audit trail', default: false })
  @IsOptional()
  @IsBoolean()
  includeAuditTrail?: boolean = false;

  @ApiPropertyOptional({ description: 'Include metadata', default: false })
  @IsOptional()
  @IsBoolean()
  includeMetadata?: boolean = false;
}

export class TransactionReportDto {
  @ApiProperty({ description: 'Report type', enum: ReportType })
  @IsEnum(ReportType)
  reportType: ReportType;

  @ApiProperty({ description: 'Report format', enum: ExportFormat })
  @IsEnum(ExportFormat)
  format: ExportFormat;

  @ApiPropertyOptional({ description: 'Report date range start', type: Date })
  @IsOptional()
  @IsDateString()
  dateFrom?: Date;

  @ApiPropertyOptional({ description: 'Report date range end', type: Date })
  @IsOptional()
  @IsDateString()
  dateTo?: Date;

  @ApiPropertyOptional({ description: 'User IDs to include', type: [String] })
  @IsOptional()
  @IsArray()
  @IsUUID(4, { each: true })
  userIds?: string[];

  @ApiPropertyOptional({
    description: 'Partner IDs to include',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsUUID(4, { each: true })
  partnerIds?: string[];

  @ApiPropertyOptional({ description: 'Report parameters' })
  @IsOptional()
  @IsObject()
  parameters?: {
    groupBy?: string;
    includeCharts?: boolean;
    includeSummary?: boolean;
    detailLevel?: 'summary' | 'detailed';
  };
}

export class TransactionSettingsDto {
  @ApiPropertyOptional({ description: 'Auto-approval threshold amount' })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  autoApprovalThreshold?: number;

  @ApiPropertyOptional({
    description: 'Require approval for large transactions',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  requireApprovalForLargeTransactions?: boolean = true;

  @ApiPropertyOptional({ description: 'Large transaction threshold' })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  largeTransactionThreshold?: number;

  @ApiPropertyOptional({
    description: 'Enable automatic reconciliation',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  enableAutoReconciliation?: boolean = false;

  @ApiPropertyOptional({
    description: 'Transaction retention period in days',
    default: 2555,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(3650)
  retentionPeriodDays?: number = 2555; // 7 years

  @ApiPropertyOptional({ description: 'Default currency', default: 'INR' })
  @IsOptional()
  @IsString()
  defaultCurrency?: string = 'INR';

  @ApiPropertyOptional({ description: 'Supported currencies', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  supportedCurrencies?: string[];

  @ApiPropertyOptional({
    description: 'Enable transaction notifications',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  enableNotifications?: boolean = true;

  @ApiPropertyOptional({ description: 'Notification settings' })
  @IsOptional()
  @IsObject()
  notificationSettings?: {
    emailNotifications?: boolean;
    smsNotifications?: boolean;
    webhookNotifications?: boolean;
    notifyOnStatus?: TransactionStatus[];
    notifyOnAmount?: number;
  };

  @ApiPropertyOptional({ description: 'Fraud detection settings' })
  @IsOptional()
  @IsObject()
  fraudDetectionSettings?: {
    enableFraudDetection?: boolean;
    maxDailyTransactionAmount?: number;
    maxTransactionCount?: number;
    suspiciousPatternDetection?: boolean;
  };

  @ApiPropertyOptional({ description: 'Additional settings' })
  @IsOptional()
  @IsObject()
  additionalSettings?: Record<string, any>;
}
