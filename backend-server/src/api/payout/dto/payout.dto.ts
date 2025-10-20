import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
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
  IsString,
  IsUUID,
  Length,
  Matches,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';

// Enums
export enum PayoutStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  REVERSED = 'reversed',
}

export enum PayoutType {
  COMMISSION = 'commission',
  REFUND = 'refund',
  BONUS = 'bonus',
  ADJUSTMENT = 'adjustment',
  WITHDRAWAL = 'withdrawal',
  SETTLEMENT = 'settlement',
}

export enum PayoutMethod {
  BANK_TRANSFER = 'bank_transfer',
  UPI = 'upi',
  WALLET = 'wallet',
  CHEQUE = 'cheque',
  CASH = 'cash',
}

export enum WalletTransactionType {
  CREDIT = 'credit',
  DEBIT = 'debit',
  COMMISSION_EARNED = 'commission_earned',
  PAYOUT_DEDUCTED = 'payout_deducted',
  REFUND_RECEIVED = 'refund_received',
  BONUS_ADDED = 'bonus_added',
  ADJUSTMENT = 'adjustment',
  FEE_DEDUCTED = 'fee_deducted',
}

export enum BankAccountType {
  SAVINGS = 'savings',
  CURRENT = 'current',
  SALARY = 'salary',
  NRE = 'nre',
  NRO = 'nro',
}

export enum BankAccountStatus {
  PENDING = 'pending',
  VERIFIED = 'verified',
  REJECTED = 'rejected',
  SUSPENDED = 'suspended',
}

export enum BulkPayoutOperationType {
  APPROVE_REQUESTS = 'approve_requests',
  REJECT_REQUESTS = 'reject_requests',
  PROCESS_PAYOUTS = 'process_payouts',
  CANCEL_REQUESTS = 'cancel_requests',
  UPDATE_STATUS = 'update_status',
  RECONCILE_PAYOUTS = 'reconcile_payouts',
}

export enum ExportFormat {
  CSV = 'csv',
  EXCEL = 'excel',
  PDF = 'pdf',
  JSON = 'json',
}

export enum ReportType {
  PAYOUT_SUMMARY = 'payout_summary',
  PARTNER_STATEMENT = 'partner_statement',
  COMMISSION_REPORT = 'commission_report',
  RECONCILIATION_REPORT = 'reconciliation_report',
  TAX_REPORT = 'tax_report',
  AUDIT_TRAIL = 'audit_trail',
}

export enum ProcessingFeeType {
  FIXED = 'fixed',
  PERCENTAGE = 'percentage',
}

export enum PayoutSchedule {
  IMMEDIATE = 'immediate',
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  ON_DEMAND = 'on_demand',
}

// DTOs for Payout Request Management
export class CreatePayoutRequestDto {
  @ApiProperty({ description: 'Payout type', enum: PayoutType })
  @IsEnum(PayoutType)
  @IsNotEmpty()
  type: PayoutType;

  @ApiProperty({ description: 'Payout amount', example: 5000.0 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  amount: number;

  @ApiProperty({ description: 'Currency code', example: 'INR', default: 'INR' })
  @IsString()
  @Length(3, 3)
  @IsOptional()
  currency?: string = 'INR';

  @ApiProperty({ description: 'Payout description' })
  @IsString()
  @IsNotEmpty()
  @Length(1, 500)
  description: string;

  @ApiPropertyOptional({ description: 'Partner ID (admin only)' })
  @IsUUID()
  @IsOptional()
  partnerId?: string;

  @ApiPropertyOptional({ description: 'Bank account ID for payout' })
  @IsUUID()
  @IsOptional()
  bankAccountId?: string;

  @ApiProperty({ description: 'Preferred payout method', enum: PayoutMethod })
  @IsEnum(PayoutMethod)
  payoutMethod: PayoutMethod;

  @ApiPropertyOptional({ description: 'Requested payout date' })
  @IsDateString()
  @IsOptional()
  requestedDate?: Date;

  @ApiPropertyOptional({ description: 'Additional notes' })
  @IsString()
  @IsOptional()
  @Length(0, 1000)
  notes?: string;

  @ApiPropertyOptional({ description: 'Additional metadata' })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;

  @ApiPropertyOptional({
    description: 'Auto-approve if eligible',
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  autoApprove?: boolean = false;
}

export class UpdatePayoutRequestDto {
  @ApiPropertyOptional({ description: 'Payout amount', example: 5000.0 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  @IsOptional()
  amount?: number;

  @ApiPropertyOptional({ description: 'Payout description' })
  @IsString()
  @Length(1, 500)
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: 'Bank account ID for payout' })
  @IsUUID()
  @IsOptional()
  bankAccountId?: string;

  @ApiPropertyOptional({
    description: 'Preferred payout method',
    enum: PayoutMethod,
  })
  @IsEnum(PayoutMethod)
  @IsOptional()
  payoutMethod?: PayoutMethod;

  @ApiPropertyOptional({ description: 'Requested payout date' })
  @IsDateString()
  @IsOptional()
  requestedDate?: Date;

  @ApiPropertyOptional({ description: 'Additional notes' })
  @IsString()
  @Length(0, 1000)
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional({ description: 'Additional metadata' })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}

export class ProcessPayoutDto {
  @ApiPropertyOptional({ description: 'Processing notes' })
  @IsString()
  @IsOptional()
  @Length(0, 1000)
  notes?: string;

  @ApiPropertyOptional({ description: 'Processing fee amount' })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @IsOptional()
  processingFee?: number;

  @ApiPropertyOptional({ description: 'Bank reference number' })
  @IsString()
  @IsOptional()
  bankReference?: string;

  @ApiPropertyOptional({ description: 'External transaction ID' })
  @IsString()
  @IsOptional()
  externalTransactionId?: string;

  @ApiPropertyOptional({ description: 'Scheduled processing date' })
  @IsDateString()
  @IsOptional()
  scheduledDate?: Date;

  @ApiPropertyOptional({ description: 'Additional processing metadata' })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}

// Response DTOs
export class PayoutRequestResponseDto {
  @ApiProperty({ description: 'Payout request ID' })
  id: string;

  @ApiProperty({ description: 'Payout request reference' })
  requestReference: string;

  @ApiProperty({ description: 'Payout type', enum: PayoutType })
  type: PayoutType;

  @ApiProperty({ description: 'Payout status', enum: PayoutStatus })
  status: PayoutStatus;

  @ApiProperty({ description: 'Payout amount' })
  amount: number;

  @ApiProperty({ description: 'Currency code' })
  currency: string;

  @ApiProperty({ description: 'Payout description' })
  description: string;

  @ApiPropertyOptional({ description: 'Partner information' })
  partner?: {
    id: string;
    name: string;
    email: string;
  };

  @ApiPropertyOptional({ description: 'Bank account information' })
  bankAccount?: {
    id: string;
    accountNumber: string;
    bankName: string;
    accountHolderName: string;
  };

  @ApiProperty({ description: 'Payout method', enum: PayoutMethod })
  payoutMethod: PayoutMethod;

  @ApiPropertyOptional({ description: 'Requested payout date' })
  requestedDate?: Date;

  @ApiPropertyOptional({ description: 'Approved date' })
  approvedDate?: Date;

  @ApiPropertyOptional({ description: 'Processed date' })
  processedDate?: Date;

  @ApiPropertyOptional({ description: 'Completed date' })
  completedDate?: Date;

  @ApiPropertyOptional({ description: 'Processing fee' })
  processingFee?: number;

  @ApiPropertyOptional({ description: 'Net amount after fees' })
  netAmount?: number;

  @ApiPropertyOptional({ description: 'Additional notes' })
  notes?: string;

  @ApiPropertyOptional({ description: 'Additional metadata' })
  metadata?: Record<string, any>;

  @ApiProperty({ description: 'Creation timestamp' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  updatedAt: Date;

  @ApiPropertyOptional({ description: 'Created by user ID' })
  createdBy?: string;

  @ApiPropertyOptional({ description: 'Last updated by user ID' })
  updatedBy?: string;
}

export class PayoutResponseDto {
  @ApiProperty({ description: 'Payout ID' })
  id: string;

  @ApiProperty({ description: 'Payout reference' })
  payoutReference: string;

  @ApiProperty({ description: 'Payout request ID' })
  requestId: string;

  @ApiProperty({ description: 'Payout status', enum: PayoutStatus })
  status: PayoutStatus;

  @ApiProperty({ description: 'Payout amount' })
  amount: number;

  @ApiProperty({ description: 'Processing fee' })
  processingFee: number;

  @ApiProperty({ description: 'Net amount' })
  netAmount: number;

  @ApiProperty({ description: 'Currency code' })
  currency: string;

  @ApiPropertyOptional({ description: 'Partner information' })
  partner?: {
    id: string;
    name: string;
    email: string;
  };

  @ApiPropertyOptional({ description: 'Bank account information' })
  bankAccount?: {
    id: string;
    accountNumber: string;
    bankName: string;
    accountHolderName: string;
  };

  @ApiProperty({ description: 'Payout method', enum: PayoutMethod })
  payoutMethod: PayoutMethod;

  @ApiPropertyOptional({ description: 'Bank reference number' })
  bankReference?: string;

  @ApiPropertyOptional({ description: 'External transaction ID' })
  externalTransactionId?: string;

  @ApiPropertyOptional({ description: 'Processing date' })
  processedDate?: Date;

  @ApiPropertyOptional({ description: 'Completion date' })
  completedDate?: Date;

  @ApiPropertyOptional({ description: 'Processing notes' })
  notes?: string;

  @ApiPropertyOptional({ description: 'Additional metadata' })
  metadata?: Record<string, any>;

  @ApiProperty({ description: 'Creation timestamp' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  updatedAt: Date;
}

// Wallet Management DTOs
export class WalletBalanceResponseDto {
  @ApiProperty({ description: 'Partner ID' })
  partnerId: string;

  @ApiProperty({ description: 'Available balance' })
  availableBalance: number;

  @ApiProperty({ description: 'Pending balance' })
  pendingBalance: number;

  @ApiProperty({ description: 'Total balance' })
  totalBalance: number;

  @ApiProperty({ description: 'Currency code' })
  currency: string;

  @ApiProperty({ description: 'Last transaction date' })
  lastTransactionDate?: Date;

  @ApiProperty({ description: 'Wallet status' })
  status: string;

  @ApiProperty({ description: 'Last update timestamp' })
  updatedAt: Date;
}

export class UpdateWalletDto {
  @ApiProperty({ description: 'Transaction type', enum: WalletTransactionType })
  @IsEnum(WalletTransactionType)
  transactionType: WalletTransactionType;

  @ApiProperty({ description: 'Transaction amount' })
  @IsNumber({ maxDecimalPlaces: 2 })
  amount: number;

  @ApiProperty({ description: 'Transaction description' })
  @IsString()
  @IsNotEmpty()
  @Length(1, 500)
  description: string;

  @ApiPropertyOptional({ description: 'Reference ID' })
  @IsString()
  @IsOptional()
  referenceId?: string;

  @ApiPropertyOptional({ description: 'Additional notes' })
  @IsString()
  @IsOptional()
  @Length(0, 1000)
  notes?: string;

  @ApiPropertyOptional({ description: 'Additional metadata' })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}

export class WalletTransactionResponseDto {
  @ApiProperty({ description: 'Transaction ID' })
  id: string;

  @ApiProperty({ description: 'Transaction reference' })
  transactionReference: string;

  @ApiProperty({ description: 'Transaction type', enum: WalletTransactionType })
  type: WalletTransactionType;

  @ApiProperty({ description: 'Transaction amount' })
  amount: number;

  @ApiProperty({ description: 'Balance after transaction' })
  balanceAfter: number;

  @ApiProperty({ description: 'Currency code' })
  currency: string;

  @ApiProperty({ description: 'Transaction description' })
  description: string;

  @ApiPropertyOptional({ description: 'Reference ID' })
  referenceId?: string;

  @ApiPropertyOptional({ description: 'Additional notes' })
  notes?: string;

  @ApiPropertyOptional({ description: 'Additional metadata' })
  metadata?: Record<string, any>;

  @ApiProperty({ description: 'Transaction timestamp' })
  createdAt: Date;

  @ApiPropertyOptional({ description: 'Created by user ID' })
  createdBy?: string;
}

// Bank Account Management DTOs
export class BankAccountDto {
  @ApiProperty({ description: 'Account holder name' })
  @IsString()
  @IsNotEmpty()
  @Length(1, 100)
  accountHolderName: string;

  @ApiProperty({ description: 'Bank account number' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^[0-9]{9,18}$/, { message: 'Invalid account number format' })
  accountNumber: string;

  @ApiProperty({ description: 'IFSC code' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^[A-Z]{4}0[A-Z0-9]{6}$/, { message: 'Invalid IFSC code format' })
  ifscCode: string;

  @ApiProperty({ description: 'Bank name' })
  @IsString()
  @IsNotEmpty()
  @Length(1, 100)
  bankName: string;

  @ApiProperty({ description: 'Branch name' })
  @IsString()
  @IsNotEmpty()
  @Length(1, 100)
  branchName: string;

  @ApiProperty({ description: 'Account type', enum: BankAccountType })
  @IsEnum(BankAccountType)
  accountType: BankAccountType;

  @ApiPropertyOptional({ description: 'Partner ID (admin only)' })
  @IsUUID()
  @IsOptional()
  partnerId?: string;

  @ApiPropertyOptional({
    description: 'Set as primary account',
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  isPrimary?: boolean = false;

  @ApiPropertyOptional({ description: 'Additional notes' })
  @IsString()
  @IsOptional()
  @Length(0, 500)
  notes?: string;
}

export class BankAccountResponseDto {
  @ApiProperty({ description: 'Bank account ID' })
  id: string;

  @ApiProperty({ description: 'Account holder name' })
  accountHolderName: string;

  @ApiProperty({ description: 'Masked account number' })
  accountNumber: string;

  @ApiProperty({ description: 'IFSC code' })
  ifscCode: string;

  @ApiProperty({ description: 'Bank name' })
  bankName: string;

  @ApiProperty({ description: 'Branch name' })
  branchName: string;

  @ApiProperty({ description: 'Account type', enum: BankAccountType })
  accountType: BankAccountType;

  @ApiProperty({ description: 'Account status', enum: BankAccountStatus })
  status: BankAccountStatus;

  @ApiProperty({ description: 'Is primary account' })
  isPrimary: boolean;

  @ApiPropertyOptional({ description: 'Partner information' })
  partner?: {
    id: string;
    name: string;
    email: string;
  };

  @ApiPropertyOptional({ description: 'Verification date' })
  verifiedDate?: Date;

  @ApiPropertyOptional({ description: 'Additional notes' })
  notes?: string;

  @ApiProperty({ description: 'Creation timestamp' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  updatedAt: Date;
}

export class VerifyBankAccountDto {
  @ApiProperty({ description: 'Verification method' })
  @IsString()
  @IsNotEmpty()
  verificationMethod: string;

  @ApiPropertyOptional({ description: 'Verification reference' })
  @IsString()
  @IsOptional()
  verificationReference?: string;

  @ApiPropertyOptional({ description: 'Verification notes' })
  @IsString()
  @IsOptional()
  @Length(0, 500)
  notes?: string;

  @ApiPropertyOptional({ description: 'Verification metadata' })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}

// Bulk Operations DTOs
export class BulkPayoutOperationDto {
  @ApiProperty({
    description: 'Bulk operation type',
    enum: BulkPayoutOperationType,
  })
  @IsEnum(BulkPayoutOperationType)
  operation: BulkPayoutOperationType;

  @ApiProperty({ description: 'Array of payout request IDs or payout IDs' })
  @IsArray()
  @IsUUID(4, { each: true })
  payoutIds: string[];

  @ApiPropertyOptional({ description: 'Operation reason' })
  @IsString()
  @IsOptional()
  @Length(0, 500)
  reason?: string;

  @ApiPropertyOptional({ description: 'Additional operation data' })
  @IsObject()
  @IsOptional()
  data?: Record<string, any>;
}

// Analytics and Reporting DTOs
export class PayoutAnalyticsDto {
  @ApiProperty({ description: 'Total payout volume' })
  totalVolume: number;

  @ApiProperty({ description: 'Total number of payouts' })
  totalPayouts: number;

  @ApiProperty({ description: 'Completed payouts count' })
  completedPayouts: number;

  @ApiProperty({ description: 'Pending payouts count' })
  pendingPayouts: number;

  @ApiProperty({ description: 'Failed payouts count' })
  failedPayouts: number;

  @ApiProperty({ description: 'Average payout amount' })
  averagePayoutAmount: number;

  @ApiProperty({ description: 'Success rate percentage' })
  successRate: number;

  @ApiProperty({ description: 'Total processing fees' })
  totalProcessingFees: number;

  @ApiProperty({ description: 'Volume by payout type' })
  volumeByType: Array<{
    type: PayoutType;
    volume: number;
    count: number;
  }>;

  @ApiProperty({ description: 'Volume by payout method' })
  volumeByMethod: Array<{
    method: PayoutMethod;
    volume: number;
    count: number;
  }>;

  @ApiProperty({ description: 'Daily trends' })
  dailyTrends: Array<{
    date: string;
    volume: number;
    count: number;
    fees: number;
  }>;

  @ApiProperty({ description: 'Top partners by payout volume' })
  topPartners: Array<{
    partnerId: string;
    partnerName: string;
    volume: number;
    payoutCount: number;
  }>;

  @ApiProperty({ description: 'Status distribution' })
  statusDistribution: Array<{
    status: PayoutStatus;
    count: number;
    percentage: number;
  }>;
}

export class PayoutExportDto {
  @ApiProperty({ description: 'Export type' })
  @IsString()
  @IsNotEmpty()
  exportType: string;

  @ApiProperty({ description: 'Export format', enum: ExportFormat })
  @IsEnum(ExportFormat)
  format: ExportFormat;

  @ApiPropertyOptional({ description: 'Export filters' })
  @IsObject()
  @IsOptional()
  filters?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Fields to include in export' })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  fields?: string[];

  @ApiPropertyOptional({ description: 'Include audit trail', default: false })
  @IsBoolean()
  @IsOptional()
  includeAuditTrail?: boolean = false;

  @ApiPropertyOptional({ description: 'Include metadata', default: false })
  @IsBoolean()
  @IsOptional()
  includeMetadata?: boolean = false;
}

export class PayoutReportDto {
  @ApiProperty({ description: 'Report type', enum: ReportType })
  @IsEnum(ReportType)
  reportType: ReportType;

  @ApiProperty({ description: 'Report format', enum: ExportFormat })
  @IsEnum(ExportFormat)
  format: ExportFormat;

  @ApiPropertyOptional({ description: 'Report date from' })
  @IsDateString()
  @IsOptional()
  dateFrom?: Date;

  @ApiPropertyOptional({ description: 'Report date to' })
  @IsDateString()
  @IsOptional()
  dateTo?: Date;

  @ApiPropertyOptional({ description: 'Partner IDs to include' })
  @IsArray()
  @IsUUID(4, { each: true })
  @IsOptional()
  partnerIds?: string[];

  @ApiPropertyOptional({ description: 'Additional report parameters' })
  @IsObject()
  @IsOptional()
  parameters?: Record<string, any>;
}

// Settings DTOs
export class PayoutSettingsDto {
  @ApiPropertyOptional({ description: 'Minimum payout amount' })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @IsOptional()
  minimumPayoutAmount?: number;

  @ApiPropertyOptional({ description: 'Maximum payout amount' })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @IsOptional()
  maximumPayoutAmount?: number;

  @ApiPropertyOptional({ description: 'Auto approval threshold' })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @IsOptional()
  autoApprovalThreshold?: number;

  @ApiPropertyOptional({ description: 'Processing fee amount' })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @IsOptional()
  processingFee?: number;

  @ApiPropertyOptional({
    description: 'Processing fee type',
    enum: ProcessingFeeType,
  })
  @IsEnum(ProcessingFeeType)
  @IsOptional()
  processingFeeType?: ProcessingFeeType;

  @ApiPropertyOptional({ description: 'Payout schedule', enum: PayoutSchedule })
  @IsEnum(PayoutSchedule)
  @IsOptional()
  payoutSchedule?: PayoutSchedule;

  @ApiPropertyOptional({ description: 'Allowed payout methods' })
  @IsArray()
  @IsEnum(PayoutMethod, { each: true })
  @IsOptional()
  allowedPayoutMethods?: PayoutMethod[];

  @ApiPropertyOptional({
    description: 'Require bank verification',
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  requireBankVerification?: boolean = true;

  @ApiPropertyOptional({
    description: 'Auto process approved payouts',
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  autoProcessApprovedPayouts?: boolean = false;

  @ApiPropertyOptional({ description: 'Notification settings' })
  @IsObject()
  @IsOptional()
  notificationSettings?: Record<string, any>;
}
