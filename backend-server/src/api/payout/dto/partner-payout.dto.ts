import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEmail,
  IsEnum,
  IsIn,
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
export enum PayoutStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

export enum PayoutType {
  COMMISSION = 'commission',
  REFUND = 'refund',
  BONUS = 'bonus',
  ADJUSTMENT = 'adjustment',
  WITHDRAWAL = 'withdrawal',
}

export enum BankAccountStatus {
  PENDING = 'pending',
  VERIFIED = 'verified',
  REJECTED = 'rejected',
  SUSPENDED = 'suspended',
}

export enum WalletTransactionType {
  CREDIT = 'credit',
  DEBIT = 'debit',
  HOLD = 'hold',
  RELEASE = 'release',
  TRANSFER = 'transfer',
  WITHDRAWAL = 'withdrawal',
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
  PROCESS = 'process',
  CANCEL = 'cancel',
  DELETE = 'delete',
}

// Payout Request DTOs
export class CreatePayoutRequestDto {
  @ApiProperty({ description: 'Partner ID' })
  @IsUUID()
  @IsNotEmpty()
  partnerId: string;

  @ApiProperty({ description: 'Payout amount', minimum: 0.01 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  amount: number;

  @ApiProperty({ description: 'Currency code', default: 'INR' })
  @IsString()
  @Length(3, 3)
  currency: string = 'INR';

  @ApiProperty({ enum: PayoutType, description: 'Payout type' })
  @IsEnum(PayoutType)
  type: PayoutType;

  @ApiPropertyOptional({ description: 'Description or notes' })
  @IsOptional()
  @IsString()
  @Length(1, 500)
  description?: string;

  @ApiPropertyOptional({ description: 'Bank account ID for payout' })
  @IsOptional()
  @IsUUID()
  bankAccountId?: string;

  @ApiPropertyOptional({
    description: 'Reference ID (booking, commission, etc.)',
  })
  @IsOptional()
  @IsString()
  referenceId?: string;

  @ApiPropertyOptional({ description: 'Reference type' })
  @IsOptional()
  @IsString()
  referenceType?: string;

  @ApiPropertyOptional({ description: 'Additional metadata' })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Scheduled payout date' })
  @IsOptional()
  @IsDateString()
  scheduledDate?: string;

  @ApiPropertyOptional({
    description: 'Priority level',
    minimum: 1,
    maximum: 5,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  priority?: number = 3;
}

export class UpdatePayoutRequestDto {
  @ApiPropertyOptional({ description: 'Payout amount', minimum: 0.01 })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  amount?: number;

  @ApiPropertyOptional({ enum: PayoutType, description: 'Payout type' })
  @IsOptional()
  @IsEnum(PayoutType)
  type?: PayoutType;

  @ApiPropertyOptional({ description: 'Description or notes' })
  @IsOptional()
  @IsString()
  @Length(1, 500)
  description?: string;

  @ApiPropertyOptional({ description: 'Bank account ID for payout' })
  @IsOptional()
  @IsUUID()
  bankAccountId?: string;

  @ApiPropertyOptional({ description: 'Additional metadata' })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Scheduled payout date' })
  @IsOptional()
  @IsDateString()
  scheduledDate?: string;

  @ApiPropertyOptional({
    description: 'Priority level',
    minimum: 1,
    maximum: 5,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  priority?: number;
}

export class GetPayoutRequestsDto {
  @ApiPropertyOptional({ description: 'Page number', minimum: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Items per page',
    minimum: 1,
    maximum: 100,
    default: 10,
  })
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

  @ApiPropertyOptional({ enum: PayoutStatus, description: 'Filter by status' })
  @IsOptional()
  @IsEnum(PayoutStatus)
  status?: PayoutStatus;

  @ApiPropertyOptional({ enum: PayoutType, description: 'Filter by type' })
  @IsOptional()
  @IsEnum(PayoutType)
  type?: PayoutType;

  @ApiPropertyOptional({ description: 'Filter by partner ID' })
  @IsOptional()
  @IsUUID()
  partnerId?: string;

  @ApiPropertyOptional({ description: 'Start date (ISO string)' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'End date (ISO string)' })
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

  @ApiPropertyOptional({ description: 'Sort field', default: 'createdAt' })
  @IsOptional()
  @IsString()
  @IsIn(['createdAt', 'updatedAt', 'amount', 'scheduledDate', 'priority'])
  sortBy?: string = 'createdAt';

  @ApiPropertyOptional({
    description: 'Sort order',
    enum: ['ASC', 'DESC'],
    default: 'DESC',
  })
  @IsOptional()
  @IsIn(['ASC', 'DESC'])
  sortOrder?: 'ASC' | 'DESC' = 'DESC';
}

// Bank Account DTOs
export class CreateBankAccountDto {
  @ApiProperty({ description: 'Partner ID' })
  @IsUUID()
  @IsNotEmpty()
  partnerId: string;

  @ApiProperty({ description: 'Account holder name' })
  @IsString()
  @IsNotEmpty()
  @Length(2, 100)
  accountHolderName: string;

  @ApiProperty({ description: 'Bank account number' })
  @IsString()
  @IsNotEmpty()
  @Length(8, 20)
  accountNumber: string;

  @ApiProperty({ description: 'IFSC code' })
  @IsString()
  @IsNotEmpty()
  @Length(11, 11)
  ifscCode: string;

  @ApiProperty({ description: 'Bank name' })
  @IsString()
  @IsNotEmpty()
  @Length(2, 100)
  bankName: string;

  @ApiProperty({ description: 'Branch name' })
  @IsString()
  @IsNotEmpty()
  @Length(2, 100)
  branchName: string;

  @ApiPropertyOptional({ description: 'Account type' })
  @IsOptional()
  @IsString()
  @IsIn(['savings', 'current', 'salary'])
  accountType?: string = 'savings';

  @ApiPropertyOptional({ description: 'Is primary account' })
  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean = false;
}

export class UpdateBankAccountDto {
  @ApiPropertyOptional({ description: 'Account holder name' })
  @IsOptional()
  @IsString()
  @Length(2, 100)
  accountHolderName?: string;

  @ApiPropertyOptional({ description: 'Bank account number' })
  @IsOptional()
  @IsString()
  @Length(8, 20)
  accountNumber?: string;

  @ApiPropertyOptional({ description: 'IFSC code' })
  @IsOptional()
  @IsString()
  @Length(11, 11)
  ifscCode?: string;

  @ApiPropertyOptional({ description: 'Bank name' })
  @IsOptional()
  @IsString()
  @Length(2, 100)
  bankName?: string;

  @ApiPropertyOptional({ description: 'Branch name' })
  @IsOptional()
  @IsString()
  @Length(2, 100)
  branchName?: string;

  @ApiPropertyOptional({ description: 'Account type' })
  @IsOptional()
  @IsString()
  @IsIn(['savings', 'current', 'salary'])
  accountType?: string;

  @ApiPropertyOptional({ description: 'Is primary account' })
  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;
}

// Wallet DTOs
export class CreateWalletTransactionDto {
  @ApiProperty({ enum: WalletTransactionType, description: 'Transaction type' })
  @IsEnum(WalletTransactionType)
  type: WalletTransactionType;

  @ApiProperty({ description: 'Transaction amount', minimum: 0.01 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  amount: number;

  @ApiProperty({ description: 'Currency code', default: 'INR' })
  @IsString()
  @Length(3, 3)
  currency: string = 'INR';

  @ApiProperty({ description: 'Transaction description' })
  @IsString()
  @IsNotEmpty()
  @Length(1, 500)
  description: string;

  @ApiPropertyOptional({ description: 'Reference ID' })
  @IsOptional()
  @IsString()
  referenceId?: string;

  @ApiPropertyOptional({ description: 'Reference type' })
  @IsOptional()
  @IsString()
  referenceType?: string;

  @ApiPropertyOptional({ description: 'Additional metadata' })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

// Bulk Operations DTOs
export class BulkPayoutOperationDto {
  @ApiProperty({ description: 'Array of payout request IDs' })
  @IsArray()
  @IsUUID(4, { each: true })
  @IsNotEmpty()
  payoutIds: string[];

  @ApiProperty({ enum: BulkOperationType, description: 'Operation to perform' })
  @IsEnum(BulkOperationType)
  operation: BulkOperationType;

  @ApiPropertyOptional({
    description: 'Reason for operation (required for reject/cancel)',
  })
  @IsOptional()
  @IsString()
  @Length(1, 500)
  reason?: string;
}

// Analytics DTOs
export class PayoutAnalyticsDto {
  @ApiPropertyOptional({ description: 'Start date (ISO string)' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'End date (ISO string)' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({
    description: 'Group by period',
    enum: ['day', 'week', 'month', 'year'],
  })
  @IsOptional()
  @IsIn(['day', 'week', 'month', 'year'])
  groupBy?: string = 'day';

  @ApiPropertyOptional({ description: 'Filter by partner ID' })
  @IsOptional()
  @IsUUID()
  partnerId?: string;

  @ApiPropertyOptional({ enum: PayoutType, description: 'Filter by type' })
  @IsOptional()
  @IsEnum(PayoutType)
  type?: PayoutType;
}

// Export DTOs
export class ExportPayoutsDto {
  @ApiPropertyOptional({ description: 'Export name' })
  @IsOptional()
  @IsString()
  @Length(1, 100)
  name?: string;

  @ApiProperty({ description: 'Export format', enum: ['csv', 'excel', 'pdf'] })
  @IsIn(['csv', 'excel', 'pdf'])
  format: string;

  @ApiPropertyOptional({
    description: 'Filters to apply',
    type: GetPayoutRequestsDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => GetPayoutRequestsDto)
  filters?: GetPayoutRequestsDto;

  @ApiPropertyOptional({ description: 'Fields to include in export' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  includeFields?: string[];
}

// Settings DTOs
export class PayoutSettingsDto {
  @ApiPropertyOptional({ description: 'Minimum payout amount', minimum: 0.01 })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  minPayoutAmount?: number;

  @ApiPropertyOptional({ description: 'Maximum payout amount', minimum: 0.01 })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  maxPayoutAmount?: number;

  @ApiPropertyOptional({ description: 'Auto-approve threshold', minimum: 0 })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  autoApproveThreshold?: number;

  @ApiPropertyOptional({ description: 'Default currency', default: 'INR' })
  @IsOptional()
  @IsString()
  @Length(3, 3)
  defaultCurrency?: string;

  @ApiPropertyOptional({ description: 'Enable notifications' })
  @IsOptional()
  @IsBoolean()
  enableNotifications?: boolean;

  @ApiPropertyOptional({ description: 'Notification email' })
  @IsOptional()
  @IsEmail()
  notificationEmail?: string;

  @ApiPropertyOptional({ description: 'Processing timeout in minutes' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(1440)
  processingTimeout?: number;

  @ApiPropertyOptional({ description: 'Maximum retry attempts' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(10)
  maxRetryAttempts?: number;

  @ApiPropertyOptional({ description: 'Enable audit trail' })
  @IsOptional()
  @IsBoolean()
  enableAuditTrail?: boolean;

  @ApiPropertyOptional({ description: 'Data retention period in days' })
  @IsOptional()
  @IsNumber()
  @Min(30)
  @Max(2555)
  dataRetentionDays?: number;

  @ApiPropertyOptional({ description: 'Business days for processing' })
  @IsOptional()
  @IsArray()
  @IsIn(
    [
      'monday',
      'tuesday',
      'wednesday',
      'thursday',
      'friday',
      'saturday',
      'sunday',
    ],
    { each: true },
  )
  businessDays?: string[];

  @ApiPropertyOptional({ description: 'Processing start time (HH:mm)' })
  @IsOptional()
  @IsString()
  processingStartTime?: string;

  @ApiPropertyOptional({ description: 'Processing end time (HH:mm)' })
  @IsOptional()
  @IsString()
  processingEndTime?: string;
}

// Response DTOs
export class PayoutRequestResponseDto {
  @ApiProperty({ description: 'Payout request ID' })
  id: string;

  @ApiProperty({ enum: PayoutStatus, description: 'Payout status' })
  status: PayoutStatus;

  @ApiProperty({ enum: PayoutType, description: 'Payout type' })
  type: PayoutType;

  @ApiProperty({ description: 'Payout amount' })
  amount: number;

  @ApiProperty({ description: 'Currency code' })
  currency: string;

  @ApiProperty({ description: 'Description or notes' })
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

  @ApiPropertyOptional({ description: 'Reference ID' })
  referenceId?: string;

  @ApiPropertyOptional({ description: 'Reference type' })
  referenceType?: string;

  @ApiPropertyOptional({ description: 'Transaction ID' })
  transactionId?: string;

  @ApiPropertyOptional({ description: 'Processing fee' })
  processingFee?: number;

  @ApiPropertyOptional({ description: 'Net amount' })
  netAmount?: number;

  @ApiPropertyOptional({ description: 'Additional metadata' })
  metadata?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Scheduled payout date' })
  scheduledDate?: Date;

  @ApiPropertyOptional({ description: 'Processed date' })
  processedDate?: Date;

  @ApiProperty({ description: 'Priority level' })
  priority: number;

  @ApiPropertyOptional({ description: 'Rejection reason' })
  rejectionReason?: string;

  @ApiPropertyOptional({ description: 'Failure reason' })
  failureReason?: string;

  @ApiProperty({ description: 'Creation date' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update date' })
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

export class BankAccountResponseDto {
  @ApiProperty({ description: 'Bank account ID' })
  id: string;

  @ApiProperty({ description: 'Partner ID' })
  partnerId: string;

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

  @ApiProperty({ description: 'Account type' })
  accountType: string;

  @ApiProperty({ enum: BankAccountStatus, description: 'Account status' })
  status: BankAccountStatus;

  @ApiProperty({ description: 'Is primary account' })
  isPrimary: boolean;

  @ApiPropertyOptional({ description: 'Verification date' })
  verifiedAt?: Date;

  @ApiPropertyOptional({ description: 'Rejection reason' })
  rejectionReason?: string;

  @ApiProperty({ description: 'Creation date' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update date' })
  updatedAt: Date;
}

export class WalletResponseDto {
  @ApiProperty({ description: 'Wallet ID' })
  id: string;

  @ApiProperty({ description: 'Partner ID' })
  partnerId: string;

  @ApiProperty({ description: 'Available balance' })
  balance: number;

  @ApiProperty({ description: 'Pending balance' })
  pendingBalance: number;

  @ApiProperty({ description: 'Total earnings' })
  totalEarnings: number;

  @ApiProperty({ description: 'Total withdrawals' })
  totalWithdrawals: number;

  @ApiProperty({ description: 'Currency code' })
  currency: string;

  @ApiProperty({ description: 'Last transaction date' })
  lastTransactionAt: Date;

  @ApiProperty({ description: 'Creation date' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update date' })
  updatedAt: Date;
}

export class WalletTransactionResponseDto {
  @ApiProperty({ description: 'Transaction ID' })
  id: string;

  @ApiProperty({ description: 'Wallet ID' })
  walletId: string;

  @ApiProperty({ enum: WalletTransactionType, description: 'Transaction type' })
  type: WalletTransactionType;

  @ApiProperty({ description: 'Transaction amount' })
  amount: number;

  @ApiProperty({ description: 'Currency code' })
  currency: string;

  @ApiProperty({ description: 'Balance after transaction' })
  balanceAfter: number;

  @ApiProperty({ description: 'Transaction description' })
  description: string;

  @ApiPropertyOptional({ description: 'Reference ID' })
  referenceId?: string;

  @ApiPropertyOptional({ description: 'Reference type' })
  referenceType?: string;

  @ApiPropertyOptional({ description: 'Additional metadata' })
  metadata?: Record<string, any>;

  @ApiProperty({ description: 'Transaction date' })
  transactionDate: Date;

  @ApiProperty({ description: 'Creation date' })
  createdAt: Date;

  @ApiPropertyOptional({ description: 'Created by user' })
  createdBy?: {
    id: string;
    name: string;
  };
}

export class BulkOperationResponseDto {
  @ApiProperty({ description: 'Operation ID' })
  operationId: string;

  @ApiProperty({ enum: BulkOperationType, description: 'Operation type' })
  operation: BulkOperationType;

  @ApiProperty({ description: 'Total items processed' })
  totalItems: number;

  @ApiProperty({ description: 'Successful items' })
  successfulItems: number;

  @ApiProperty({ description: 'Failed items' })
  failedItems: number;

  @ApiProperty({ description: 'Operation status' })
  status: string;

  @ApiPropertyOptional({ description: 'Error details for failed items' })
  errors?: Array<{ payoutId: string; error: string }>;

  @ApiProperty({ description: 'Operation start time' })
  startedAt: Date;

  @ApiProperty({ description: 'Operation completion time' })
  completedAt: Date;
}

export class PayoutAnalyticsResponseDto {
  @ApiProperty({ description: 'Total payout requests' })
  totalRequests: number;

  @ApiProperty({ description: 'Total payout amount' })
  totalAmount: number;

  @ApiProperty({ description: 'Average payout amount' })
  averageAmount: number;

  @ApiProperty({ description: 'Payouts by status' })
  payoutsByStatus: Array<{ status: string; count: number; amount: number }>;

  @ApiProperty({ description: 'Payouts by type' })
  payoutsByType: Array<{ type: string; count: number; amount: number }>;

  @ApiProperty({ description: 'Payouts over time' })
  payoutsOverTime: Array<{ period: string; count: number; amount: number }>;

  @ApiProperty({ description: 'Top partners by payout amount' })
  topPartners: Array<{
    partnerId: string;
    partnerName: string;
    amount: number;
    count: number;
  }>;

  @ApiProperty({ description: 'Analysis period' })
  analysisPeriod: {
    startDate: Date;
    endDate: Date;
  };
}

export class PayoutSummaryResponseDto {
  @ApiProperty({ description: 'Total pending amount' })
  totalPending: number;

  @ApiProperty({ description: 'Total approved amount' })
  totalApproved: number;

  @ApiProperty({ description: 'Total processed amount' })
  totalProcessed: number;

  @ApiProperty({ description: 'Total completed amount' })
  totalCompleted: number;

  @ApiProperty({ description: 'Total failed amount' })
  totalFailed: number;

  @ApiProperty({ description: 'Processing fees' })
  totalFees: number;

  @ApiProperty({ description: 'Net payout amount' })
  netAmount: number;

  @ApiProperty({ description: 'Growth rate percentage' })
  growthRate: number;

  @ApiProperty({ description: 'Currency code' })
  currency: string;

  @ApiProperty({ description: 'Summary period' })
  period: {
    startDate: Date;
    endDate: Date;
  };
}

export class ExportResponseDto {
  @ApiProperty({ description: 'Export ID' })
  exportId: string;

  @ApiProperty({ enum: ExportStatus, description: 'Export status' })
  status: ExportStatus;

  @ApiProperty({ description: 'Export format' })
  format: string;

  @ApiPropertyOptional({ description: 'Total records to export' })
  totalRecords?: number;

  @ApiProperty({ description: 'Export creation date' })
  createdAt: Date;

  @ApiPropertyOptional({ description: 'Export completion date' })
  completedAt?: Date;

  @ApiPropertyOptional({ description: 'Download URL' })
  downloadUrl?: string;
}

export class PayoutSettingsResponseDto {
  @ApiProperty({ description: 'Settings ID' })
  id: string;

  @ApiProperty({ description: 'Minimum payout amount' })
  minPayoutAmount: number;

  @ApiProperty({ description: 'Maximum payout amount' })
  maxPayoutAmount: number;

  @ApiProperty({ description: 'Auto-approve threshold' })
  autoApproveThreshold: number;

  @ApiProperty({ description: 'Default currency' })
  defaultCurrency: string;

  @ApiProperty({ description: 'Enable notifications' })
  enableNotifications: boolean;

  @ApiPropertyOptional({ description: 'Notification email' })
  notificationEmail?: string;

  @ApiProperty({ description: 'Processing timeout in minutes' })
  processingTimeout: number;

  @ApiProperty({ description: 'Maximum retry attempts' })
  maxRetryAttempts: number;

  @ApiProperty({ description: 'Enable audit trail' })
  enableAuditTrail: boolean;

  @ApiProperty({ description: 'Data retention period in days' })
  dataRetentionDays: number;

  @ApiProperty({ description: 'Business days for processing' })
  businessDays: string[];

  @ApiPropertyOptional({ description: 'Processing start time' })
  processingStartTime?: string;

  @ApiPropertyOptional({ description: 'Processing end time' })
  processingEndTime?: string;

  @ApiProperty({ description: 'Creation date' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update date' })
  updatedAt: Date;

  @ApiPropertyOptional({ description: 'Updated by user' })
  updatedBy?: {
    id: string;
    name: string;
  };
}
