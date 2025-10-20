import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
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
  IsPositive,
  IsString,
  IsUUID,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';

// Enums
export enum CommissionRuleType {
  PERCENTAGE = 'percentage',
  FIXED = 'fixed',
  TIERED = 'tiered',
  HYBRID = 'hybrid',
}

export enum CommissionCalculationStatus {
  PENDING = 'pending',
  CALCULATED = 'calculated',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  PAID = 'paid',
  CANCELLED = 'cancelled',
}

export enum CommissionPayoutStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

export enum CommissionFrequency {
  IMMEDIATE = 'immediate',
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
}

export enum PartnerTier {
  BRONZE = 'bronze',
  SILVER = 'silver',
  GOLD = 'gold',
  PLATINUM = 'platinum',
  DIAMOND = 'diamond',
}

export enum TransactionType {
  BOOKING = 'booking',
  RENEWAL = 'renewal',
  UPGRADE = 'upgrade',
  EXTRAS = 'extras',
  REFERRAL = 'referral',
}

export enum ReportFormat {
  PDF = 'pdf',
  EXCEL = 'excel',
  CSV = 'csv',
}

export enum ExportType {
  COMMISSION_RULES = 'commission_rules',
  COMMISSION_CALCULATIONS = 'commission_calculations',
  PARTNER_COMMISSIONS = 'partner_commissions',
  COMMISSION_PAYOUTS = 'commission_payouts',
  PARTNER_PERFORMANCE = 'partner_performance',
}

// Commission Rule DTOs
export class CreateCommissionRuleDto {
  @ApiProperty({ description: 'Rule name' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ description: 'Rule description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    enum: CommissionRuleType,
    description: 'Commission rule type',
  })
  @IsEnum(CommissionRuleType)
  type: CommissionRuleType;

  @ApiProperty({ description: 'Commission rate (percentage or fixed amount)' })
  @IsNumber({ maxDecimalPlaces: 4 })
  @IsPositive()
  rate: number;

  @ApiPropertyOptional({ description: 'Minimum transaction amount' })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  minAmount?: number;

  @ApiPropertyOptional({ description: 'Maximum transaction amount' })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  maxAmount?: number;

  @ApiPropertyOptional({ enum: PartnerTier, description: 'Partner tier' })
  @IsOptional()
  @IsEnum(PartnerTier)
  partnerTier?: PartnerTier;

  @ApiPropertyOptional({
    enum: TransactionType,
    isArray: true,
    description: 'Applicable transaction types',
  })
  @IsOptional()
  @IsArray()
  @IsEnum(TransactionType, { each: true })
  transactionTypes?: TransactionType[];

  @ApiPropertyOptional({ description: 'Rule conditions (JSON)' })
  @IsOptional()
  @IsObject()
  conditions?: any;

  @ApiPropertyOptional({ description: 'Rule start date' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'Rule end date' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({
    description: 'Rule priority (higher number = higher priority)',
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  priority?: number;

  @ApiPropertyOptional({ description: 'Is rule active' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateCommissionRuleDto {
  @ApiPropertyOptional({ description: 'Rule name' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;

  @ApiPropertyOptional({ description: 'Rule description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    enum: CommissionRuleType,
    description: 'Commission rule type',
  })
  @IsOptional()
  @IsEnum(CommissionRuleType)
  type?: CommissionRuleType;

  @ApiPropertyOptional({
    description: 'Commission rate (percentage or fixed amount)',
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 4 })
  @IsPositive()
  rate?: number;

  @ApiPropertyOptional({ description: 'Minimum transaction amount' })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  minAmount?: number;

  @ApiPropertyOptional({ description: 'Maximum transaction amount' })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  maxAmount?: number;

  @ApiPropertyOptional({ enum: PartnerTier, description: 'Partner tier' })
  @IsOptional()
  @IsEnum(PartnerTier)
  partnerTier?: PartnerTier;

  @ApiPropertyOptional({
    enum: TransactionType,
    isArray: true,
    description: 'Applicable transaction types',
  })
  @IsOptional()
  @IsArray()
  @IsEnum(TransactionType, { each: true })
  transactionTypes?: TransactionType[];

  @ApiPropertyOptional({ description: 'Rule conditions (JSON)' })
  @IsOptional()
  @IsObject()
  conditions?: any;

  @ApiPropertyOptional({ description: 'Rule start date' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'Rule end date' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({
    description: 'Rule priority (higher number = higher priority)',
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  priority?: number;

  @ApiPropertyOptional({ description: 'Is rule active' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class GetCommissionRulesDto {
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

  @ApiPropertyOptional({
    enum: CommissionRuleType,
    description: 'Filter by rule type',
  })
  @IsOptional()
  @IsEnum(CommissionRuleType)
  type?: CommissionRuleType;

  @ApiPropertyOptional({
    enum: PartnerTier,
    description: 'Filter by partner tier',
  })
  @IsOptional()
  @IsEnum(PartnerTier)
  partnerTier?: PartnerTier;

  @ApiPropertyOptional({ description: 'Filter by active status' })
  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Sort by field' })
  @IsOptional()
  @IsString()
  sortBy?: string;

  @ApiPropertyOptional({ description: 'Sort order' })
  @IsOptional()
  @IsString()
  sortOrder?: 'ASC' | 'DESC';

  @ApiPropertyOptional({ description: 'Filter by start date' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'Filter by end date' })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}

export class CommissionRuleResponseDto {
  @ApiProperty({ description: 'Rule ID' })
  id: string;

  @ApiProperty({ description: 'Rule name' })
  name: string;

  @ApiProperty({ description: 'Rule description' })
  description: string;

  @ApiProperty({
    enum: CommissionRuleType,
    description: 'Commission rule type',
  })
  type: CommissionRuleType;

  @ApiProperty({ description: 'Commission rate' })
  rate: number;

  @ApiProperty({ description: 'Minimum transaction amount' })
  minAmount: number;

  @ApiProperty({ description: 'Maximum transaction amount' })
  maxAmount: number;

  @ApiProperty({ enum: PartnerTier, description: 'Partner tier' })
  partnerTier: PartnerTier;

  @ApiProperty({
    enum: TransactionType,
    isArray: true,
    description: 'Applicable transaction types',
  })
  transactionTypes: TransactionType[];

  @ApiProperty({ description: 'Rule conditions' })
  conditions: any;

  @ApiProperty({ description: 'Rule start date' })
  startDate: Date;

  @ApiProperty({ description: 'Rule end date' })
  endDate: Date;

  @ApiProperty({ description: 'Rule priority' })
  priority: number;

  @ApiProperty({ description: 'Is rule active' })
  isActive: boolean;

  @ApiProperty({ description: 'Created at' })
  createdAt: Date;

  @ApiProperty({ description: 'Updated at' })
  updatedAt: Date;
}

// Commission Calculation DTOs
export class CreateCommissionCalculationDto {
  @ApiProperty({ description: 'Partner ID' })
  @IsUUID()
  partnerId: string;

  @ApiProperty({ description: 'Transaction ID' })
  @IsUUID()
  transactionId: string;

  @ApiProperty({ description: 'Transaction amount' })
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  transactionAmount: number;

  @ApiProperty({ enum: TransactionType, description: 'Transaction type' })
  @IsEnum(TransactionType)
  transactionType: TransactionType;

  @ApiPropertyOptional({ description: 'Commission rule ID' })
  @IsOptional()
  @IsUUID()
  ruleId?: string;

  @ApiPropertyOptional({ description: 'Commission amount' })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  commissionAmount?: number;

  @ApiPropertyOptional({ description: 'Commission rate applied' })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 4 })
  @IsPositive()
  rateApplied?: number;

  @ApiPropertyOptional({ description: 'Calculation details (JSON)' })
  @IsOptional()
  @IsObject()
  calculationDetails?: any;

  @ApiPropertyOptional({ description: 'Notes' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateCommissionCalculationDto {
  @ApiPropertyOptional({ description: 'Commission amount' })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  commissionAmount?: number;

  @ApiPropertyOptional({ description: 'Commission rate applied' })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 4 })
  @IsPositive()
  rateApplied?: number;

  @ApiPropertyOptional({
    enum: CommissionCalculationStatus,
    description: 'Calculation status',
  })
  @IsOptional()
  @IsEnum(CommissionCalculationStatus)
  status?: CommissionCalculationStatus;

  @ApiPropertyOptional({ description: 'Calculation details (JSON)' })
  @IsOptional()
  @IsObject()
  calculationDetails?: any;

  @ApiPropertyOptional({ description: 'Notes' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class GetCommissionCalculationsDto {
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

  @ApiPropertyOptional({ description: 'Partner ID' })
  @IsOptional()
  @IsUUID()
  partnerId?: string;

  @ApiPropertyOptional({ description: 'Transaction ID' })
  @IsOptional()
  @IsUUID()
  transactionId?: string;

  @ApiPropertyOptional({ description: 'Commission rule ID' })
  @IsOptional()
  @IsUUID()
  ruleId?: string;

  @ApiPropertyOptional({
    enum: CommissionCalculationStatus,
    description: 'Filter by status',
  })
  @IsOptional()
  @IsEnum(CommissionCalculationStatus)
  status?: CommissionCalculationStatus;

  @ApiPropertyOptional({ description: 'Start date for filtering' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'End date for filtering' })
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

  @ApiPropertyOptional({ description: 'Minimum amount for filtering' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  minAmount?: number;

  @ApiPropertyOptional({ description: 'Maximum amount for filtering' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  maxAmount?: number;

  @ApiPropertyOptional({ description: 'Sort by field' })
  @IsOptional()
  @IsString()
  sortBy?: string;

  @ApiPropertyOptional({ description: 'Sort order' })
  @IsOptional()
  @IsString()
  sortOrder?: 'ASC' | 'DESC';
}

export class CommissionCalculationResponseDto {
  @ApiProperty({ description: 'Calculation ID' })
  id: string;

  @ApiProperty({ description: 'Partner ID' })
  partnerId: string;

  @ApiProperty({ description: 'Transaction ID' })
  transactionId: string;

  @ApiProperty({ description: 'Commission rule ID' })
  ruleId: string;

  @ApiProperty({ description: 'Transaction amount' })
  transactionAmount: number;

  @ApiProperty({ description: 'Commission amount' })
  commissionAmount: number;

  @ApiProperty({ description: 'Commission rate applied' })
  rateApplied: number;

  @ApiProperty({
    enum: CommissionCalculationStatus,
    description: 'Calculation status',
  })
  status: CommissionCalculationStatus;

  @ApiProperty({ description: 'Calculation details' })
  calculationDetails: any;

  @ApiProperty({ description: 'Notes' })
  notes: string;

  @ApiProperty({ description: 'Created at' })
  createdAt: Date;

  @ApiProperty({ description: 'Updated at' })
  updatedAt: Date;
}

// Partner Commission DTOs
export class CreatePartnerCommissionDto {
  @ApiProperty({ description: 'Partner ID' })
  @IsUUID()
  partnerId: string;

  @ApiProperty({ description: 'Commission calculation ID' })
  @IsUUID()
  calculationId: string;

  @ApiProperty({ description: 'Commission amount' })
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  amount: number;

  @ApiPropertyOptional({ description: 'Commission description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Due date' })
  @IsOptional()
  @IsDateString()
  dueDate?: string;
}

export class UpdatePartnerCommissionDto {
  @ApiPropertyOptional({ description: 'Commission amount' })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  amount?: number;

  @ApiPropertyOptional({ description: 'Commission description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Due date' })
  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @ApiPropertyOptional({ description: 'Is paid' })
  @IsOptional()
  @IsBoolean()
  isPaid?: boolean;

  @ApiPropertyOptional({ description: 'Paid date' })
  @IsOptional()
  @IsDateString()
  paidDate?: string;
}

export class GetPartnerCommissionsDto {
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

  @ApiPropertyOptional({ description: 'Partner ID' })
  @IsOptional()
  @IsUUID()
  partnerId?: string;

  @ApiPropertyOptional({ description: 'Filter by paid status' })
  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  isPaid?: boolean;

  @ApiPropertyOptional({ description: 'Date from' })
  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @ApiPropertyOptional({ description: 'Date to' })
  @IsOptional()
  @IsDateString()
  dateTo?: string;

  @ApiPropertyOptional({ description: 'Start date for filtering' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'End date for filtering' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ description: 'Sort by field' })
  @IsOptional()
  @IsString()
  sortBy?: string;

  @ApiPropertyOptional({ description: 'Sort order' })
  @IsOptional()
  @IsString()
  sortOrder?: 'ASC' | 'DESC';

  @ApiPropertyOptional({ description: 'Minimum commission amount' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  minAmount?: number;

  @ApiPropertyOptional({ description: 'Maximum commission amount' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  maxAmount?: number;
}

export class PartnerCommissionResponseDto {
  @ApiProperty({ description: 'Commission ID' })
  id: string;

  @ApiProperty({ description: 'Partner ID' })
  partnerId: string;

  @ApiProperty({ description: 'Commission calculation ID' })
  calculationId: string;

  @ApiProperty({ description: 'Commission amount' })
  amount: number;

  @ApiProperty({ description: 'Commission description' })
  description: string;

  @ApiProperty({ description: 'Due date' })
  dueDate: Date;

  @ApiProperty({ description: 'Is paid' })
  isPaid: boolean;

  @ApiProperty({ description: 'Paid date' })
  paidDate: Date;

  @ApiProperty({ description: 'Created at' })
  createdAt: Date;

  @ApiProperty({ description: 'Updated at' })
  updatedAt: Date;
}

// Commission Payout DTOs
export class CreateCommissionPayoutDto {
  @ApiProperty({ description: 'Partner ID' })
  @IsUUID()
  partnerId: string;

  @ApiProperty({ description: 'Payout amount' })
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  amount: number;

  @ApiProperty({
    description: 'Commission IDs to include in payout',
    isArray: true,
  })
  @IsArray()
  @ArrayMinSize(1)
  @IsUUID(undefined, { each: true })
  commissionIds: string[];

  @ApiPropertyOptional({ description: 'Payout description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Scheduled payout date' })
  @IsOptional()
  @IsDateString()
  scheduledDate?: string;
}

export class UpdateCommissionPayoutDto {
  @ApiPropertyOptional({ description: 'Payout amount' })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  amount?: number;

  @ApiPropertyOptional({ description: 'Payout description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Scheduled payout date' })
  @IsOptional()
  @IsDateString()
  scheduledDate?: string;

  @ApiPropertyOptional({
    enum: CommissionPayoutStatus,
    description: 'Payout status',
  })
  @IsOptional()
  @IsEnum(CommissionPayoutStatus)
  status?: CommissionPayoutStatus;

  @ApiPropertyOptional({ description: 'Payment reference' })
  @IsOptional()
  @IsString()
  paymentReference?: string;
}

export class GetCommissionPayoutsDto {
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

  @ApiPropertyOptional({ description: 'Partner ID' })
  @IsOptional()
  @IsUUID()
  partnerId?: string;

  @ApiPropertyOptional({
    enum: CommissionPayoutStatus,
    description: 'Filter by status',
  })
  @IsOptional()
  @IsEnum(CommissionPayoutStatus)
  status?: CommissionPayoutStatus;

  @ApiPropertyOptional({ description: 'Date from' })
  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @ApiPropertyOptional({ description: 'Date to' })
  @IsOptional()
  @IsDateString()
  dateTo?: string;

  @ApiPropertyOptional({ description: 'Sort by field' })
  @IsOptional()
  @IsString()
  sortBy?: string;

  @ApiPropertyOptional({ description: 'Sort order' })
  @IsOptional()
  @IsString()
  sortOrder?: 'ASC' | 'DESC';

  @ApiPropertyOptional({ description: 'Start date for filtering' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'End date for filtering' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ description: 'Minimum payout amount' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  minAmount?: number;

  @ApiPropertyOptional({ description: 'Maximum payout amount' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  maxAmount?: number;
}

export class CommissionPayoutResponseDto {
  @ApiProperty({ description: 'Payout ID' })
  id: string;

  @ApiProperty({ description: 'Partner ID' })
  partnerId: string;

  @ApiProperty({ description: 'Payout amount' })
  amount: number;

  @ApiProperty({ description: 'Commission IDs' })
  commissionIds: string[];

  @ApiProperty({ description: 'Payout description' })
  description: string;

  @ApiProperty({ description: 'Scheduled payout date' })
  scheduledDate: Date;

  @ApiProperty({ enum: CommissionPayoutStatus, description: 'Payout status' })
  status: CommissionPayoutStatus;

  @ApiProperty({ description: 'Payment reference' })
  paymentReference: string;

  @ApiProperty({ description: 'Processed date' })
  processedDate: Date;

  @ApiProperty({ description: 'Created by user ID' })
  createdBy: string;

  @ApiProperty({ description: 'Updated by user ID' })
  updatedBy: string;

  @ApiProperty({ description: 'Processed by user ID' })
  processedBy: string;

  @ApiProperty({ description: 'Partner details' })
  partner: any;

  @ApiProperty({ description: 'Commission details' })
  commissions: any;

  @ApiProperty({ description: 'Creator user details' })
  creator: any;

  @ApiProperty({ description: 'Updater user details' })
  updater: any;

  @ApiProperty({ description: 'Processor user details' })
  processor: any;

  @ApiProperty({ description: 'Created at' })
  createdAt: Date;

  @ApiProperty({ description: 'Updated at' })
  updatedAt: Date;
}

// Bulk Operations DTOs
export class BulkCommissionCalculationDto {
  @ApiProperty({
    description: 'Commission calculations to create',
    isArray: true,
  })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateCommissionCalculationDto)
  calculations: CreateCommissionCalculationDto[];
}

export class BulkCommissionUpdateDto {
  @ApiProperty({ description: 'Commission IDs to update', isArray: true })
  @IsArray()
  @ArrayMinSize(1)
  @IsUUID(undefined, { each: true })
  commissionIds: string[];

  @ApiProperty({ description: 'Update data' })
  @ValidateNested()
  @Type(() => UpdatePartnerCommissionDto)
  updateData: UpdatePartnerCommissionDto;
}

// Analytics and Reporting DTOs
export class CommissionAnalyticsDto {
  @ApiProperty({ description: 'Total commission earned' })
  totalCommissionEarned: number;

  @ApiProperty({ description: 'Total commission paid' })
  totalCommissionPaid: number;

  @ApiProperty({ description: 'Pending commission amount' })
  pendingCommissionAmount: number;

  @ApiProperty({ description: 'Number of active partners' })
  activePartners: number;

  @ApiProperty({ description: 'Average commission per transaction' })
  averageCommissionPerTransaction: number;

  @ApiProperty({ description: 'Commission by month' })
  commissionByMonth: { month: string; amount: number }[];

  @ApiProperty({ description: 'Top performing partners' })
  topPerformingPartners: {
    partnerId: string;
    partnerName: string;
    totalCommission: number;
  }[];

  @ApiProperty({ description: 'Commission by transaction type' })
  commissionByTransactionType: {
    type: string;
    amount: number;
    count: number;
  }[];

  @ApiPropertyOptional({ description: 'Start date for analytics' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'End date for analytics' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ description: 'Partner ID for filtering' })
  @IsOptional()
  @IsUUID()
  partnerId?: string;
}

export class GetCommissionSummaryDto {
  @ApiPropertyOptional({ description: 'Start date for summary' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'End date for summary' })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}

export class CommissionSummaryDto {
  @ApiProperty({ description: 'Total commission rules' })
  totalRules: number;

  @ApiProperty({ description: 'Active commission rules' })
  activeRules: number;

  @ApiProperty({ description: 'Total calculations this month' })
  calculationsThisMonth: number;

  @ApiProperty({ description: 'Total payouts this month' })
  payoutsThisMonth: number;

  @ApiProperty({ description: 'Pending approval count' })
  pendingApprovalCount: number;

  @ApiProperty({ description: 'Total commission amount this month' })
  totalCommissionThisMonth: number;
}

export class CommissionStatsDto {
  @ApiProperty({ description: 'Commission conversion rate' })
  conversionRate: number;

  @ApiProperty({ description: 'Average processing time (hours)' })
  averageProcessingTime: number;

  @ApiProperty({ description: 'Partner satisfaction score' })
  partnerSatisfactionScore: number;

  @ApiProperty({ description: 'Commission accuracy rate' })
  accuracyRate: number;

  @ApiProperty({ description: 'Monthly growth rate' })
  monthlyGrowthRate: number;
}

export class PartnerPerformanceDto {
  @ApiProperty({ description: 'Partner ID' })
  partnerId: string;

  @ApiProperty({ description: 'Partner name' })
  partnerName: string;

  @ApiProperty({ description: 'Total transactions' })
  totalTransactions: number;

  @ApiProperty({ description: 'Total commission earned' })
  totalCommissionEarned: number;

  @ApiProperty({ description: 'Average commission per transaction' })
  averageCommissionPerTransaction: number;

  @ApiProperty({ description: 'Commission growth rate' })
  commissionGrowthRate: number;

  @ApiProperty({ description: 'Partner tier' })
  partnerTier: PartnerTier;

  @ApiProperty({ description: 'Performance score' })
  performanceScore: number;
}

export class CommissionForecastDto {
  @ApiProperty({ description: 'Forecasted commission amount' })
  forecastedAmount: number;

  @ApiProperty({ description: 'Confidence level' })
  confidenceLevel: number;

  @ApiProperty({ description: 'Monthly forecast breakdown' })
  monthlyForecast: { month: string; amount: number; confidence: number }[];

  @ApiProperty({ description: 'Forecast factors' })
  forecastFactors: { factor: string; impact: number; description: string }[];
}

// Export and Report DTOs
export class CommissionExportDto {
  @ApiProperty({ enum: ExportType, description: 'Export type' })
  @IsEnum(ExportType)
  exportType: ExportType;

  @ApiProperty({ enum: ReportFormat, description: 'Export format' })
  @IsEnum(ReportFormat)
  format: ReportFormat;

  @ApiPropertyOptional({ description: 'Date from' })
  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @ApiPropertyOptional({ description: 'Date to' })
  @IsOptional()
  @IsDateString()
  dateTo?: string;

  @ApiPropertyOptional({ description: 'Partner ID filter' })
  @IsOptional()
  @IsUUID()
  partnerId?: string;

  @ApiPropertyOptional({ description: 'Additional filters' })
  @IsOptional()
  @IsObject()
  filters?: any;
}

export class CommissionReportDto {
  @ApiProperty({ description: 'Report name' })
  @IsString()
  @IsNotEmpty()
  reportName: string;

  @ApiProperty({ description: 'Report type' })
  @IsString()
  @IsNotEmpty()
  reportType: string;

  @ApiProperty({ enum: ReportFormat, description: 'Report format' })
  @IsEnum(ReportFormat)
  format: ReportFormat;

  @ApiPropertyOptional({ description: 'Date from' })
  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @ApiPropertyOptional({ description: 'Date to' })
  @IsOptional()
  @IsDateString()
  dateTo?: string;

  @ApiPropertyOptional({ description: 'Report parameters' })
  @IsOptional()
  @IsObject()
  parameters?: any;
}

// Reconciliation and Audit DTOs
export class CommissionReconciliationDto {
  @ApiProperty({ description: 'Reconciliation period start' })
  @IsDateString()
  periodStart: string;

  @ApiProperty({ description: 'Reconciliation period end' })
  @IsDateString()
  periodEnd: string;

  @ApiPropertyOptional({ description: 'Partner ID filter' })
  @IsOptional()
  @IsUUID()
  partnerId?: string;

  @ApiPropertyOptional({ description: 'Include pending calculations' })
  @IsOptional()
  @IsBoolean()
  includePending?: boolean;
}

export class CommissionAuditDto {
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

  @ApiPropertyOptional({ description: 'Entity type' })
  @IsOptional()
  @IsString()
  entityType?: string;

  @ApiPropertyOptional({ description: 'Entity ID' })
  @IsOptional()
  @IsUUID()
  entityId?: string;

  @ApiPropertyOptional({ description: 'Action type' })
  @IsOptional()
  @IsString()
  action?: string;

  @ApiPropertyOptional({ description: 'User ID' })
  @IsOptional()
  @IsUUID()
  userId?: string;

  @ApiPropertyOptional({ description: 'Date from' })
  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @ApiPropertyOptional({ description: 'Date to' })
  @IsOptional()
  @IsDateString()
  dateTo?: string;
}

// Settings DTO
export class CommissionSettingsDto {
  @ApiProperty({ description: 'Settings ID' })
  id: string;

  @ApiPropertyOptional({ description: 'Default commission rate' })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0)
  @Max(100)
  defaultCommissionRate?: number;

  @ApiPropertyOptional({ description: 'Minimum payout amount' })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  minimumPayoutAmount?: number;

  @ApiPropertyOptional({
    enum: CommissionFrequency,
    description: 'Default payout frequency',
  })
  @IsOptional()
  @IsEnum(CommissionFrequency)
  defaultPayoutFrequency?: CommissionFrequency;

  @ApiPropertyOptional({
    description: 'Auto-approve calculations under amount',
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  autoApprovalThreshold?: number;

  @ApiPropertyOptional({ description: 'Commission calculation delay (hours)' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  calculationDelay?: number;

  @ApiPropertyOptional({ description: 'Enable email notifications' })
  @IsOptional()
  @IsBoolean()
  enableEmailNotifications?: boolean;

  @ApiPropertyOptional({ description: 'Enable SMS notifications' })
  @IsOptional()
  @IsBoolean()
  enableSmsNotifications?: boolean;

  @ApiPropertyOptional({ description: 'Tax rate for commissions' })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0)
  @Max(100)
  taxRate?: number;

  @ApiPropertyOptional({ description: 'Additional settings' })
  @IsOptional()
  @IsObject()
  additionalSettings?: any;

  @ApiPropertyOptional({ description: 'Updated by user ID' })
  @IsOptional()
  @IsUUID()
  updatedBy?: string;
}
