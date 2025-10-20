import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';

// Enums
export enum CommissionRuleType {
  PERCENTAGE = 'percentage',
  FIXED_AMOUNT = 'fixed_amount',
  TIERED = 'tiered',
  PERFORMANCE_BASED = 'performance_based',
}

export enum CommissionStatus {
  PENDING = 'pending',
  CALCULATED = 'calculated',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  PAID = 'paid',
}

export enum PaymentStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

export enum BulkCommissionOperationType {
  APPROVE_CALCULATIONS = 'approve_calculations',
  REJECT_CALCULATIONS = 'reject_calculations',
  PROCESS_PAYMENTS = 'process_payments',
  RECALCULATE = 'recalculate',
  UPDATE_STATUS = 'update_status',
}

export enum ExportFormat {
  CSV = 'CSV',
  EXCEL = 'EXCEL',
  PDF = 'PDF',
}

export enum ReportType {
  COMMISSION_SUMMARY = 'commission_summary',
  PARTNER_PERFORMANCE = 'partner_performance',
  PAYMENT_HISTORY = 'payment_history',
  RULE_ANALYSIS = 'rule_analysis',
  MONTHLY_REPORT = 'monthly_report',
  QUARTERLY_REPORT = 'quarterly_report',
  ANNUAL_REPORT = 'annual_report',
}

// Commission Rule DTOs
export class CreateCommissionRuleDto {
  @ApiProperty({ description: 'Rule name' })
  @IsString()
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

  @ApiPropertyOptional({
    description: 'Partner ID (if rule is partner-specific)',
  })
  @IsOptional()
  @IsUUID()
  partnerId?: string;

  @ApiPropertyOptional({ description: 'Space ID (if rule is space-specific)' })
  @IsOptional()
  @IsUUID()
  spaceId?: string;

  @ApiPropertyOptional({
    description: 'Commission percentage (0-100)',
    minimum: 0,
    maximum: 100,
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(100)
  percentage?: number;

  @ApiPropertyOptional({ description: 'Fixed commission amount', minimum: 0 })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  fixedAmount?: number;

  @ApiPropertyOptional({
    description: 'Minimum booking amount for rule to apply',
    minimum: 0,
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  minBookingAmount?: number;

  @ApiPropertyOptional({
    description: 'Maximum booking amount for rule to apply',
    minimum: 0,
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  maxBookingAmount?: number;

  @ApiPropertyOptional({ description: 'Tiered commission structure' })
  @IsOptional()
  tieredRates?: {
    minAmount: number;
    maxAmount?: number;
    rate: number;
  }[];

  @ApiPropertyOptional({ description: 'Performance thresholds and bonuses' })
  @IsOptional()
  performanceRules?: {
    metric: string;
    threshold: number;
    bonusPercentage: number;
  }[];

  @ApiPropertyOptional({ description: 'Rule valid from date' })
  @IsOptional()
  @IsDateString()
  validFrom?: Date;

  @ApiPropertyOptional({ description: 'Rule valid until date' })
  @IsOptional()
  @IsDateString()
  validUntil?: Date;

  @ApiPropertyOptional({
    description: 'Rule priority (higher number = higher priority)',
    minimum: 1,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  priority?: number;

  @ApiPropertyOptional({ description: 'Whether rule is active', default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Additional metadata' })
  @IsOptional()
  metadata?: Record<string, any>;
}

// Additional missing DTOs and enums
export enum CommissionType {
  BOOKING = 'booking',
  REFERRAL = 'referral',
  SUBSCRIPTION = 'subscription',
  TRANSACTION = 'transaction',
}

export enum CalculationMethod {
  PERCENTAGE = 'percentage',
  FIXED_AMOUNT = 'fixed_amount',
  TIERED = 'tiered',
  PERFORMANCE_BASED = 'performance_based',
}

export class CalculateCommissionDto {
  @ApiProperty({ description: 'Partner ID' })
  @IsUUID()
  partnerId: string;

  @ApiProperty({ description: 'Transaction amount' })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  transactionAmount: number;

  @ApiPropertyOptional({ description: 'Transaction type' })
  @IsOptional()
  @IsString()
  transactionType?: string;

  @ApiPropertyOptional({ description: 'Space ID' })
  @IsOptional()
  @IsUUID()
  spaceId?: string;

  @ApiPropertyOptional({ description: 'Booking date' })
  @IsOptional()
  @IsDateString()
  bookingDate?: string;
}

export class CommissionReportResponseDto {
  @ApiProperty({ description: 'Report ID' })
  id: string;

  @ApiProperty({ description: 'Report name' })
  reportName: string;

  @ApiProperty({ description: 'Report type' })
  reportType: string;

  @ApiProperty({ description: 'Report format' })
  format: string;

  @ApiProperty({ description: 'Report data' })
  data: any;

  @ApiProperty({ description: 'Generated at' })
  generatedAt: Date;

  @ApiProperty({ description: 'Generated by user ID' })
  generatedBy: string;

  @ApiProperty({ description: 'Report parameters' })
  parameters: any;

  @ApiProperty({ description: 'File URL if exported' })
  fileUrl?: string;
}

export class UpdateCommissionRuleDto {
  @ApiPropertyOptional({ description: 'Rule name' })
  @IsOptional()
  @IsString()
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
    description: 'Commission percentage (0-100)',
    minimum: 0,
    maximum: 100,
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(100)
  percentage?: number;

  @ApiPropertyOptional({ description: 'Fixed commission amount', minimum: 0 })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  fixedAmount?: number;

  @ApiPropertyOptional({
    description: 'Minimum booking amount for rule to apply',
    minimum: 0,
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  minBookingAmount?: number;

  @ApiPropertyOptional({
    description: 'Maximum booking amount for rule to apply',
    minimum: 0,
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  maxBookingAmount?: number;

  @ApiPropertyOptional({ description: 'Tiered commission structure' })
  @IsOptional()
  tieredRates?: {
    minAmount: number;
    maxAmount?: number;
    rate: number;
  }[];

  @ApiPropertyOptional({ description: 'Performance thresholds and bonuses' })
  @IsOptional()
  performanceRules?: {
    metric: string;
    threshold: number;
    bonusPercentage: number;
  }[];

  @ApiPropertyOptional({ description: 'Rule valid from date' })
  @IsOptional()
  @IsDateString()
  validFrom?: Date;

  @ApiPropertyOptional({ description: 'Rule valid until date' })
  @IsOptional()
  @IsDateString()
  validUntil?: Date;

  @ApiPropertyOptional({
    description: 'Rule priority (higher number = higher priority)',
    minimum: 1,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  priority?: number;

  @ApiPropertyOptional({ description: 'Whether rule is active' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Additional metadata' })
  @IsOptional()
  metadata?: Record<string, any>;
}

export class CommissionRuleResponseDto {
  @ApiProperty({ description: 'Rule ID' })
  id: string;

  @ApiProperty({ description: 'Rule name' })
  name: string;

  @ApiPropertyOptional({ description: 'Rule description' })
  description?: string;

  @ApiProperty({
    enum: CommissionRuleType,
    description: 'Commission rule type',
  })
  type: CommissionRuleType;

  @ApiPropertyOptional({ description: 'Partner ID' })
  partnerId?: string;

  @ApiPropertyOptional({ description: 'Space ID' })
  spaceId?: string;

  @ApiPropertyOptional({ description: 'Commission percentage' })
  percentage?: number;

  @ApiPropertyOptional({ description: 'Fixed commission amount' })
  fixedAmount?: number;

  @ApiPropertyOptional({ description: 'Minimum booking amount' })
  minBookingAmount?: number;

  @ApiPropertyOptional({ description: 'Maximum booking amount' })
  maxBookingAmount?: number;

  @ApiPropertyOptional({ description: 'Tiered commission structure' })
  tieredRates?: any[];

  @ApiPropertyOptional({ description: 'Performance rules' })
  performanceRules?: any[];

  @ApiPropertyOptional({ description: 'Rule valid from date' })
  validFrom?: Date;

  @ApiPropertyOptional({ description: 'Rule valid until date' })
  validUntil?: Date;

  @ApiProperty({ description: 'Rule priority' })
  priority: number;

  @ApiProperty({ description: 'Whether rule is active' })
  isActive: boolean;

  @ApiPropertyOptional({ description: 'Additional metadata' })
  metadata?: Record<string, any>;

  @ApiProperty({ description: 'Creation timestamp' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  updatedAt: Date;

  @ApiProperty({ description: 'Created by user ID' })
  createdBy: string;

  @ApiPropertyOptional({ description: 'Updated by user ID' })
  updatedBy?: string;

  @ApiPropertyOptional({ description: 'Partner information' })
  partner?: {
    id: string;
    name: string;
    email: string;
  };

  @ApiPropertyOptional({ description: 'Space information' })
  space?: {
    id: string;
    name: string;
    location: string;
  };
}

// Commission Calculation DTOs
export class CommissionCalculationResponseDto {
  @ApiProperty({ description: 'Calculation ID' })
  id: string;

  @ApiProperty({ description: 'Booking ID' })
  bookingId: string;

  @ApiProperty({ description: 'Partner ID' })
  partnerId: string;

  @ApiProperty({ description: 'Commission rule ID' })
  ruleId: string;

  @ApiProperty({ description: 'Booking amount' })
  bookingAmount: number;

  @ApiProperty({ description: 'Commission rate applied' })
  commissionRate: number;

  @ApiProperty({ description: 'Commission amount' })
  commissionAmount: number;

  @ApiPropertyOptional({ description: 'Performance bonus amount' })
  bonusAmount?: number;

  @ApiProperty({ description: 'Total commission (including bonus)' })
  totalCommission: number;

  @ApiProperty({ enum: CommissionStatus, description: 'Calculation status' })
  status: CommissionStatus;

  @ApiPropertyOptional({ description: 'Calculation notes' })
  notes?: string;

  @ApiPropertyOptional({ description: 'Approval/rejection reason' })
  statusReason?: string;

  @ApiProperty({ description: 'Calculation breakdown' })
  calculationBreakdown: {
    baseCommission: number;
    performanceBonus?: number;
    adjustments?: {
      type: string;
      amount: number;
      reason: string;
    }[];
  };

  @ApiProperty({ description: 'Calculation timestamp' })
  calculatedAt: Date;

  @ApiPropertyOptional({ description: 'Approval timestamp' })
  approvedAt?: Date;

  @ApiProperty({ description: 'Created by user ID' })
  createdBy: string;

  @ApiPropertyOptional({ description: 'Approved by user ID' })
  approvedBy?: string;

  @ApiPropertyOptional({ description: 'Booking information' })
  booking?: {
    id: string;
    spaceId: string;
    spaceName: string;
    startDate: Date;
    endDate: Date;
    totalAmount: number;
  };

  @ApiPropertyOptional({ description: 'Partner information' })
  partner?: {
    id: string;
    name: string;
    email: string;
  };

  @ApiPropertyOptional({ description: 'Commission rule information' })
  rule?: {
    id: string;
    name: string;
    type: CommissionRuleType;
  };
}

// Commission Payment DTOs
export class ProcessCommissionPaymentDto {
  @ApiProperty({
    description: 'Commission calculation IDs to pay',
    type: [String],
  })
  @IsArray()
  @IsUUID(4, { each: true })
  calculationIds: string[];

  @ApiPropertyOptional({ description: 'Payment method' })
  @IsOptional()
  @IsString()
  paymentMethod?: string;

  @ApiPropertyOptional({ description: 'Payment reference' })
  @IsOptional()
  @IsString()
  paymentReference?: string;

  @ApiPropertyOptional({ description: 'Payment notes' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ description: 'Scheduled payment date' })
  @IsOptional()
  @IsDateString()
  scheduledDate?: Date;
}

export class CommissionPaymentResponseDto {
  @ApiProperty({ description: 'Payment ID' })
  id: string;

  @ApiProperty({ description: 'Partner ID' })
  partnerId: string;

  @ApiProperty({ description: 'Commission calculation IDs', type: [String] })
  calculationIds: string[];

  @ApiProperty({ description: 'Total payment amount' })
  totalAmount: number;

  @ApiProperty({ enum: PaymentStatus, description: 'Payment status' })
  status: PaymentStatus;

  @ApiPropertyOptional({ description: 'Payment method' })
  paymentMethod?: string;

  @ApiPropertyOptional({ description: 'Payment reference' })
  paymentReference?: string;

  @ApiPropertyOptional({ description: 'Transaction reference' })
  transactionReference?: string;

  @ApiPropertyOptional({ description: 'Payment notes' })
  notes?: string;

  @ApiPropertyOptional({ description: 'Failure reason' })
  failureReason?: string;

  @ApiPropertyOptional({ description: 'Scheduled payment date' })
  scheduledDate?: Date;

  @ApiPropertyOptional({ description: 'Processed date' })
  processedDate?: Date;

  @ApiProperty({ description: 'Creation timestamp' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  updatedAt: Date;

  @ApiProperty({ description: 'Created by user ID' })
  createdBy: string;

  @ApiPropertyOptional({ description: 'Updated by user ID' })
  updatedBy?: string;

  @ApiPropertyOptional({ description: 'Partner information' })
  partner?: {
    id: string;
    name: string;
    email: string;
    bankDetails?: {
      accountNumber: string;
      routingNumber: string;
      bankName: string;
    };
  };

  @ApiPropertyOptional({ description: 'Commission calculations' })
  calculations?: CommissionCalculationResponseDto[];
}

// Bulk Operations DTO
export class BulkCommissionOperationDto {
  @ApiProperty({
    enum: BulkCommissionOperationType,
    description: 'Type of bulk operation',
  })
  @IsEnum(BulkCommissionOperationType)
  operation: BulkCommissionOperationType;

  @ApiProperty({ description: 'Item IDs to operate on', type: [String] })
  @IsArray()
  @IsUUID(4, { each: true })
  itemIds: string[];

  @ApiPropertyOptional({ description: 'Operation-specific data' })
  @IsOptional()
  data?: {
    status?: CommissionStatus | PaymentStatus;
    reason?: string;
    paymentMethod?: string;
    scheduledDate?: Date;
    [key: string]: any;
  };
}

// Analytics DTO
export class CommissionAnalyticsDto {
  @ApiProperty({ description: 'Total commission amount' })
  totalCommissionAmount: number;

  @ApiProperty({ description: 'Total paid amount' })
  totalPaidAmount: number;

  @ApiProperty({ description: 'Total pending amount' })
  totalPendingAmount: number;

  @ApiProperty({ description: 'Number of active partners' })
  activePartners: number;

  @ApiProperty({ description: 'Number of commission calculations' })
  totalCalculations: number;

  @ApiProperty({ description: 'Number of payments processed' })
  totalPayments: number;

  @ApiProperty({ description: 'Average commission rate' })
  averageCommissionRate: number;

  @ApiProperty({ description: 'Top performing partners' })
  topPartners: {
    partnerId: string;
    partnerName: string;
    totalCommission: number;
    totalBookings: number;
  }[];

  @ApiProperty({ description: 'Commission by rule type' })
  commissionByRuleType: {
    ruleType: CommissionRuleType;
    totalAmount: number;
    count: number;
  }[];

  @ApiProperty({ description: 'Monthly commission trends' })
  monthlyTrends: {
    month: string;
    totalCommission: number;
    totalPayments: number;
    partnerCount: number;
  }[];

  @ApiProperty({ description: 'Payment status distribution' })
  paymentStatusDistribution: {
    status: PaymentStatus;
    count: number;
    totalAmount: number;
  }[];
}

// Export DTO
export class CommissionExportDto {
  @ApiProperty({ enum: ExportFormat, description: 'Export format' })
  @IsEnum(ExportFormat)
  format: ExportFormat;

  @ApiProperty({ description: 'Export type (calculations, payments, rules)' })
  @IsString()
  exportType: string;

  @ApiPropertyOptional({
    description: 'Partner IDs to include',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsUUID(4, { each: true })
  partnerIds?: string[];

  @ApiPropertyOptional({ description: 'Date range start' })
  @IsOptional()
  @IsDateString()
  dateFrom?: Date;

  @ApiPropertyOptional({ description: 'Date range end' })
  @IsOptional()
  @IsDateString()
  dateTo?: Date;

  @ApiPropertyOptional({ description: 'Additional filters' })
  @IsOptional()
  filters?: {
    status?: CommissionStatus | PaymentStatus;
    ruleType?: CommissionRuleType;
    minAmount?: number;
    maxAmount?: number;
  };
}

// Report DTO
export class CommissionReportDto {
  @ApiProperty({ enum: ReportType, description: 'Report type' })
  @IsEnum(ReportType)
  reportType: ReportType;

  @ApiProperty({ enum: ExportFormat, description: 'Report format' })
  @IsEnum(ExportFormat)
  format: ExportFormat;

  @ApiPropertyOptional({
    description: 'Partner IDs to include',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsUUID(4, { each: true })
  partnerIds?: string[];

  @ApiPropertyOptional({ description: 'Space IDs to include', type: [String] })
  @IsOptional()
  @IsArray()
  @IsUUID(4, { each: true })
  spaceIds?: string[];

  @ApiPropertyOptional({ description: 'Date range start' })
  @IsOptional()
  @IsDateString()
  dateFrom?: Date;

  @ApiPropertyOptional({ description: 'Date range end' })
  @IsOptional()
  @IsDateString()
  dateTo?: Date;

  @ApiPropertyOptional({ description: 'Report parameters' })
  @IsOptional()
  parameters?: {
    includeCharts?: boolean;
    includeDetails?: boolean;
    groupBy?: string;
    sortBy?: string;
    [key: string]: any;
  };
}

// Settings DTO
export class CommissionSettingsDto {
  @ApiProperty({ description: 'Settings ID' })
  id: string;

  @ApiPropertyOptional({
    description: 'Default commission percentage',
    minimum: 0,
    maximum: 100,
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(100)
  defaultCommissionPercentage?: number;

  @ApiPropertyOptional({ description: 'Minimum payout amount', minimum: 0 })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  minimumPayoutAmount?: number;

  @ApiPropertyOptional({ description: 'Payment processing days', minimum: 1 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  paymentProcessingDays?: number;

  @ApiPropertyOptional({
    description: 'Auto-approve calculations below threshold',
    minimum: 0,
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  autoApprovalThreshold?: number;

  @ApiPropertyOptional({
    description: 'Require manual approval for high-value commissions',
  })
  @IsOptional()
  @IsBoolean()
  requireManualApproval?: boolean;

  @ApiPropertyOptional({ description: 'Enable performance bonuses' })
  @IsOptional()
  @IsBoolean()
  enablePerformanceBonuses?: boolean;

  @ApiPropertyOptional({
    description: 'Commission calculation notifications enabled',
  })
  @IsOptional()
  @IsBoolean()
  calculationNotificationsEnabled?: boolean;

  @ApiPropertyOptional({ description: 'Payment notifications enabled' })
  @IsOptional()
  @IsBoolean()
  paymentNotificationsEnabled?: boolean;

  @ApiPropertyOptional({
    description: 'Late payment reminder days',
    minimum: 1,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  latePaymentReminderDays?: number;

  @ApiPropertyOptional({ description: 'Additional metadata' })
  @IsOptional()
  metadata?: Record<string, any>;
}
