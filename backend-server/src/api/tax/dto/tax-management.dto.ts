import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsDateString,
  IsDecimal,
  IsEnum,
  IsNotEmpty,
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
export enum TaxType {
  GST = 'gst',
  CGST = 'cgst',
  SGST = 'sgst',
  IGST = 'igst',
  CESS = 'cess',
  TCS = 'tcs',
  TDS = 'tds',
  VAT = 'vat',
  SERVICE_TAX = 'service_tax',
  CUSTOM_DUTY = 'custom_duty',
}

export enum TaxCategory {
  BOOKING = 'booking',
  REFUND = 'refund',
  COMMISSION = 'commission',
  PAYOUT = 'payout',
  PENALTY = 'penalty',
  REWARD = 'reward',
  CREDIT = 'credit',
  DEBIT = 'debit',
  ADJUSTMENT = 'adjustment',
}

export enum TaxRuleStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  DRAFT = 'draft',
  EXPIRED = 'expired',
}

export enum TaxCollectionStatus {
  PENDING = 'pending',
  CALCULATED = 'calculated',
  COLLECTED = 'collected',
  SUBMITTED = 'submitted',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  PAID = 'paid',
  OVERDUE = 'overdue',
  CANCELLED = 'cancelled',
}

export enum TaxPeriod {
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  YEARLY = 'yearly',
  CUSTOM = 'custom',
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

export enum ComplianceStatus {
  COMPLIANT = 'compliant',
  NON_COMPLIANT = 'non_compliant',
  PENDING_REVIEW = 'pending_review',
  REQUIRES_ACTION = 'requires_action',
}

export enum DeadlineType {
  FILING = 'filing',
  PAYMENT = 'payment',
  RETURN = 'return',
  AUDIT = 'audit',
  COMPLIANCE = 'compliance',
}

export enum DeadlineStatus {
  UPCOMING = 'upcoming',
  DUE_TODAY = 'due_today',
  OVERDUE = 'overdue',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

// Tax Rule DTOs
export class CreateTaxRuleDto {
  @ApiProperty({ description: 'Tax rule name' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ description: 'Tax rule description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ enum: TaxType, description: 'Type of tax' })
  @IsEnum(TaxType)
  taxType: TaxType;

  @ApiProperty({ enum: TaxCategory, description: 'Tax category' })
  @IsEnum(TaxCategory)
  category: TaxCategory;

  @ApiProperty({ description: 'Tax rate percentage', minimum: 0, maximum: 100 })
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0)
  @Max(100)
  rate: number;

  @ApiPropertyOptional({ description: 'Minimum amount for tax application' })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  minAmount?: number;

  @ApiPropertyOptional({ description: 'Maximum amount for tax application' })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  maxAmount?: number;

  @ApiPropertyOptional({ description: 'Applicable states/regions' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  applicableRegions?: string[];

  @ApiPropertyOptional({ description: 'Effective from date' })
  @IsOptional()
  @IsDateString()
  effectiveFrom?: string;

  @ApiPropertyOptional({ description: 'Effective until date' })
  @IsOptional()
  @IsDateString()
  effectiveUntil?: string;

  @ApiPropertyOptional({ description: 'Additional tax rule conditions' })
  @IsOptional()
  @IsObject()
  conditions?: Record<string, any>;

  @ApiProperty({
    enum: TaxRuleStatus,
    description: 'Tax rule status',
    default: TaxRuleStatus.DRAFT,
  })
  @IsEnum(TaxRuleStatus)
  status: TaxRuleStatus;
}

export class UpdateTaxRuleDto {
  @ApiPropertyOptional({ description: 'Tax rule name' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;

  @ApiPropertyOptional({ description: 'Tax rule description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'Tax rate percentage',
    minimum: 0,
    maximum: 100,
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0)
  @Max(100)
  rate?: number;

  @ApiPropertyOptional({ description: 'Minimum amount for tax application' })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  minAmount?: number;

  @ApiPropertyOptional({ description: 'Maximum amount for tax application' })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  maxAmount?: number;

  @ApiPropertyOptional({ description: 'Applicable states/regions' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  applicableRegions?: string[];

  @ApiPropertyOptional({ description: 'Effective from date' })
  @IsOptional()
  @IsDateString()
  effectiveFrom?: string;

  @ApiPropertyOptional({ description: 'Effective until date' })
  @IsOptional()
  @IsDateString()
  effectiveUntil?: string;

  @ApiPropertyOptional({ description: 'Additional tax rule conditions' })
  @IsOptional()
  @IsObject()
  conditions?: Record<string, any>;

  @ApiPropertyOptional({ enum: TaxRuleStatus, description: 'Tax rule status' })
  @IsOptional()
  @IsEnum(TaxRuleStatus)
  status?: TaxRuleStatus;
}

export class GetTaxRulesDto {
  @ApiPropertyOptional({ description: 'Page number', default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Items per page', default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @ApiPropertyOptional({ enum: TaxType, description: 'Filter by tax type' })
  @IsOptional()
  @IsEnum(TaxType)
  taxType?: TaxType;

  @ApiPropertyOptional({ enum: TaxCategory, description: 'Filter by category' })
  @IsOptional()
  @IsEnum(TaxCategory)
  category?: TaxCategory;

  @ApiPropertyOptional({ enum: TaxRuleStatus, description: 'Filter by status' })
  @IsOptional()
  @IsEnum(TaxRuleStatus)
  status?: TaxRuleStatus;

  @ApiPropertyOptional({ description: 'Search by name or description' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Filter by region' })
  @IsOptional()
  @IsString()
  region?: string;
}

export class TaxRuleResponseDto {
  @ApiProperty({ description: 'Tax rule ID' })
  id: string;

  @ApiProperty({ description: 'Tax rule name' })
  name: string;

  @ApiProperty({ description: 'Tax rule description' })
  description: string;

  @ApiProperty({ enum: TaxType, description: 'Type of tax' })
  taxType: TaxType;

  @ApiProperty({ enum: TaxCategory, description: 'Tax category' })
  category: TaxCategory;

  @ApiProperty({ description: 'Tax rate percentage' })
  rate: number;

  @ApiProperty({ description: 'Minimum amount for tax application' })
  minAmount: number;

  @ApiProperty({ description: 'Maximum amount for tax application' })
  maxAmount: number;

  @ApiProperty({ description: 'Applicable states/regions' })
  applicableRegions: string[];

  @ApiProperty({ description: 'Effective from date' })
  effectiveFrom: string;

  @ApiProperty({ description: 'Effective until date' })
  effectiveUntil: string;

  @ApiProperty({ description: 'Additional tax rule conditions' })
  conditions: Record<string, any>;

  @ApiProperty({ enum: TaxRuleStatus, description: 'Tax rule status' })
  status: TaxRuleStatus;

  @ApiProperty({ description: 'Created by user ID' })
  createdBy: string;

  @ApiProperty({ description: 'Updated by user ID' })
  updatedBy: string;

  @ApiProperty({ description: 'Creation timestamp' })
  createdAt: string;

  @ApiProperty({ description: 'Last update timestamp' })
  updatedAt: string;
}

// Tax Calculation DTOs
export class CalculateTaxDto {
  @ApiProperty({ description: 'Base amount for tax calculation' })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  amount: number;

  @ApiProperty({ enum: TaxCategory, description: 'Tax category' })
  @IsEnum(TaxCategory)
  category: TaxCategory;

  @ApiPropertyOptional({ description: 'Region/state for tax calculation' })
  @IsOptional()
  @IsString()
  region?: string;

  @ApiPropertyOptional({ description: 'Customer type (individual/business)' })
  @IsOptional()
  @IsString()
  customerType?: string;

  @ApiPropertyOptional({ description: 'Transaction date' })
  @IsOptional()
  @IsDateString()
  transactionDate?: string;

  @ApiPropertyOptional({ description: 'Additional calculation parameters' })
  @IsOptional()
  @IsObject()
  additionalParams?: Record<string, any>;
}

export class TaxCalculationResponseDto {
  @ApiProperty({ description: 'Base amount' })
  baseAmount: number;

  @ApiProperty({ description: 'Total tax amount' })
  totalTaxAmount: number;

  @ApiProperty({ description: 'Final amount including tax' })
  finalAmount: number;

  @ApiProperty({ description: 'Tax breakdown by type' })
  taxBreakdown: {
    taxType: TaxType;
    rate: number;
    amount: number;
    ruleId: string;
  }[];

  @ApiProperty({ description: 'Applied tax rules' })
  appliedRules: string[];

  @ApiProperty({ description: 'Calculation timestamp' })
  calculatedAt: string;
}

// Tax Collection DTOs
export class CreateTaxCollectionDto {
  @ApiProperty({ description: 'Reference transaction ID' })
  @IsString()
  @IsNotEmpty()
  transactionId: string;

  @ApiProperty({ description: 'Base amount' })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  baseAmount: number;

  @ApiProperty({ description: 'Total tax amount' })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  taxAmount: number;

  @ApiProperty({ enum: TaxPeriod, description: 'Tax period' })
  @IsEnum(TaxPeriod)
  taxPeriod: TaxPeriod;

  @ApiProperty({ description: 'Period start date' })
  @IsDateString()
  periodStart: string;

  @ApiProperty({ description: 'Period end date' })
  @IsDateString()
  periodEnd: string;

  @ApiProperty({ description: 'Applied tax rules' })
  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1)
  appliedRules: string[];

  @ApiPropertyOptional({ description: 'Additional notes' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ description: 'Collection metadata' })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

export class UpdateTaxCollectionDto {
  @ApiPropertyOptional({ description: 'Total tax amount' })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  taxAmount?: number;

  @ApiPropertyOptional({
    enum: TaxCollectionStatus,
    description: 'Collection status',
  })
  @IsOptional()
  @IsEnum(TaxCollectionStatus)
  status?: TaxCollectionStatus;

  @ApiPropertyOptional({ description: 'Additional notes' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ description: 'Collection metadata' })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

export class GetTaxCollectionsDto {
  @ApiPropertyOptional({ description: 'Page number', default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Items per page', default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @ApiPropertyOptional({
    enum: TaxCollectionStatus,
    description: 'Filter by status',
  })
  @IsOptional()
  @IsEnum(TaxCollectionStatus)
  status?: TaxCollectionStatus;

  @ApiPropertyOptional({ enum: TaxPeriod, description: 'Filter by tax period' })
  @IsOptional()
  @IsEnum(TaxPeriod)
  taxPeriod?: TaxPeriod;

  @ApiPropertyOptional({ description: 'Filter by period start date' })
  @IsOptional()
  @IsDateString()
  periodStart?: string;

  @ApiPropertyOptional({ description: 'Filter by period end date' })
  @IsOptional()
  @IsDateString()
  periodEnd?: string;

  @ApiPropertyOptional({ description: 'Search by transaction ID' })
  @IsOptional()
  @IsString()
  transactionId?: string;
}

export class TaxCollectionResponseDto {
  @ApiProperty({ description: 'Tax collection ID' })
  id: string;

  @ApiProperty({ description: 'Reference transaction ID' })
  transactionId: string;

  @ApiProperty({ description: 'Base amount' })
  baseAmount: number;

  @ApiProperty({ description: 'Total tax amount' })
  taxAmount: number;

  @ApiProperty({ enum: TaxPeriod, description: 'Tax period' })
  taxPeriod: TaxPeriod;

  @ApiProperty({ description: 'Period start date' })
  periodStart: string;

  @ApiProperty({ description: 'Period end date' })
  periodEnd: string;

  @ApiProperty({ description: 'Applied tax rules' })
  appliedRules: string[];

  @ApiProperty({ enum: TaxCollectionStatus, description: 'Collection status' })
  status: TaxCollectionStatus;

  @ApiProperty({ description: 'Additional notes' })
  notes: string;

  @ApiProperty({ description: 'Collection metadata' })
  metadata: Record<string, any>;

  @ApiProperty({ description: 'Created by user ID' })
  createdBy: string;

  @ApiProperty({ description: 'Updated by user ID' })
  updatedBy: string;

  @ApiProperty({ description: 'Creation timestamp' })
  createdAt: string;

  @ApiProperty({ description: 'Last update timestamp' })
  updatedAt: string;

  @ApiProperty({ description: 'Submitted timestamp' })
  submittedAt: string;

  @ApiProperty({ description: 'Approved timestamp' })
  approvedAt: string;
}

// Bulk Operations DTOs
export class BulkTaxOperationDto {
  @ApiProperty({ description: 'Array of tax collection IDs' })
  @IsArray()
  @IsUUID(4, { each: true })
  @ArrayMinSize(1)
  ids: string[];

  @ApiPropertyOptional({ description: 'Operation notes' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ description: 'Operation reason' })
  @IsOptional()
  @IsString()
  reason?: string;
}

export class BulkOperationResponseDto {
  @ApiProperty({ description: 'Type of operation performed' })
  operation: string;

  @ApiProperty({ description: 'Total number of items processed' })
  totalProcessed: number;

  @ApiProperty({ description: 'Number of successful operations' })
  successful: number;

  @ApiProperty({ description: 'Number of failed operations' })
  failed: number;

  @ApiProperty({ description: 'Array of successful item IDs' })
  successfulIds: string[];

  @ApiProperty({ description: 'Array of failed items with errors' })
  failedItems: {
    id: string;
    error: string;
  }[];

  @ApiProperty({ description: 'Operation timestamp' })
  processedAt: string;
}

// Analytics DTOs
export class TaxAnalyticsDto {
  @ApiPropertyOptional({ description: 'Start date for analytics' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'End date for analytics' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ enum: TaxType, description: 'Filter by tax type' })
  @IsOptional()
  @IsEnum(TaxType)
  taxType?: TaxType;

  @ApiPropertyOptional({ enum: TaxCategory, description: 'Filter by category' })
  @IsOptional()
  @IsEnum(TaxCategory)
  category?: TaxCategory;

  @ApiPropertyOptional({
    description: 'Group by period (day/week/month/quarter/year)',
  })
  @IsOptional()
  @IsString()
  groupBy?: string;
}

export class TaxAnalyticsResponseDto {
  @ApiProperty({ description: 'Total tax collected' })
  totalTaxCollected: number;

  @ApiProperty({ description: 'Total base amount' })
  totalBaseAmount: number;

  @ApiProperty({ description: 'Average tax rate' })
  averageTaxRate: number;

  @ApiProperty({ description: 'Tax collection by type' })
  taxByType: {
    taxType: TaxType;
    amount: number;
    percentage: number;
  }[];

  @ApiProperty({ description: 'Tax collection by category' })
  taxByCategory: {
    category: TaxCategory;
    amount: number;
    percentage: number;
  }[];

  @ApiProperty({ description: 'Tax collection by period' })
  taxByPeriod: {
    period: string;
    amount: number;
    count: number;
  }[];

  @ApiProperty({ description: 'Tax collection trends' })
  trends: {
    period: string;
    growth: number;
    amount: number;
  }[];

  @ApiProperty({ description: 'Analytics generation timestamp' })
  generatedAt: string;
}

export class TaxSummaryResponseDto {
  @ApiProperty({ description: 'Total tax collected this month' })
  monthlyTaxCollected: number;

  @ApiProperty({ description: 'Total tax collected this quarter' })
  quarterlyTaxCollected: number;

  @ApiProperty({ description: 'Total tax collected this year' })
  yearlyTaxCollected: number;

  @ApiProperty({ description: 'Pending tax collections count' })
  pendingCollections: number;

  @ApiProperty({ description: 'Overdue tax collections count' })
  overdueCollections: number;

  @ApiProperty({ description: 'Upcoming deadlines count' })
  upcomingDeadlines: number;

  @ApiProperty({ description: 'Compliance status' })
  complianceStatus: ComplianceStatus;

  @ApiProperty({ description: 'Recent tax activities' })
  recentActivities: {
    id: string;
    type: string;
    description: string;
    amount: number;
    timestamp: string;
  }[];
}

// Export DTOs
export class ExportTaxDataDto {
  @ApiProperty({ enum: ExportFormat, description: 'Export format' })
  @IsEnum(ExportFormat)
  format: ExportFormat;

  @ApiPropertyOptional({ description: 'Start date for export' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'End date for export' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ enum: TaxType, description: 'Filter by tax type' })
  @IsOptional()
  @IsEnum(TaxType)
  taxType?: TaxType;

  @ApiPropertyOptional({ enum: TaxCategory, description: 'Filter by category' })
  @IsOptional()
  @IsEnum(TaxCategory)
  category?: TaxCategory;

  @ApiPropertyOptional({
    enum: TaxCollectionStatus,
    description: 'Filter by status',
  })
  @IsOptional()
  @IsEnum(TaxCollectionStatus)
  status?: TaxCollectionStatus;

  @ApiPropertyOptional({ description: 'Include detailed breakdown' })
  @IsOptional()
  @IsBoolean()
  includeBreakdown?: boolean;
}

export class ExportResponseDto {
  @ApiProperty({ description: 'Export ID' })
  exportId: string;

  @ApiProperty({ enum: ExportStatus, description: 'Export status' })
  status: ExportStatus;

  @ApiProperty({ description: 'Export format' })
  format: ExportFormat;

  @ApiProperty({ description: 'Download URL (when completed)' })
  downloadUrl: string;

  @ApiProperty({ description: 'Export progress percentage' })
  progress: number;

  @ApiProperty({ description: 'Estimated completion time' })
  estimatedCompletion: string;

  @ApiProperty({ description: 'Export creation timestamp' })
  createdAt: string;

  @ApiProperty({ description: 'Export completion timestamp' })
  completedAt: string;
}

// Compliance DTOs
export class TaxComplianceDto {
  @ApiPropertyOptional({ description: 'Compliance check date' })
  @IsOptional()
  @IsDateString()
  checkDate?: string;

  @ApiPropertyOptional({
    enum: TaxPeriod,
    description: 'Period for compliance check',
  })
  @IsOptional()
  @IsEnum(TaxPeriod)
  period?: TaxPeriod;

  @ApiPropertyOptional({ description: 'Include detailed report' })
  @IsOptional()
  @IsBoolean()
  includeDetails?: boolean;
}

export class TaxComplianceResponseDto {
  @ApiProperty({
    enum: ComplianceStatus,
    description: 'Overall compliance status',
  })
  overallStatus: ComplianceStatus;

  @ApiProperty({ description: 'Compliance score (0-100)' })
  complianceScore: number;

  @ApiProperty({ description: 'Compliance issues' })
  issues: {
    type: string;
    severity: string;
    description: string;
    recommendation: string;
  }[];

  @ApiProperty({ description: 'Filing status by period' })
  filingStatus: {
    period: string;
    status: string;
    dueDate: string;
    filedDate: string;
  }[];

  @ApiProperty({ description: 'Payment status by period' })
  paymentStatus: {
    period: string;
    status: string;
    amount: number;
    dueDate: string;
    paidDate: string;
  }[];

  @ApiProperty({ description: 'Compliance check timestamp' })
  checkedAt: string;
}

// Deadline DTOs
export class TaxDeadlineDto {
  @ApiPropertyOptional({ description: 'Deadline title' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  title?: string;

  @ApiPropertyOptional({ description: 'Deadline description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ enum: DeadlineType, description: 'Type of deadline' })
  @IsOptional()
  @IsEnum(DeadlineType)
  type?: DeadlineType;

  @ApiPropertyOptional({ description: 'Deadline date' })
  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @ApiPropertyOptional({ description: 'Reminder days before deadline' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  reminderDays?: number;

  @ApiPropertyOptional({ description: 'Filter by upcoming days' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  upcomingDays?: number;

  @ApiPropertyOptional({
    enum: DeadlineStatus,
    description: 'Filter by status',
  })
  @IsOptional()
  @IsEnum(DeadlineStatus)
  status?: DeadlineStatus;
}

export class TaxDeadlineResponseDto {
  @ApiProperty({ description: 'Deadline ID' })
  id: string;

  @ApiProperty({ description: 'Deadline title' })
  title: string;

  @ApiProperty({ description: 'Deadline description' })
  description: string;

  @ApiProperty({ enum: DeadlineType, description: 'Type of deadline' })
  type: DeadlineType;

  @ApiProperty({ description: 'Deadline date' })
  dueDate: string;

  @ApiProperty({ description: 'Days remaining until deadline' })
  daysRemaining: number;

  @ApiProperty({ enum: DeadlineStatus, description: 'Deadline status' })
  status: DeadlineStatus;

  @ApiProperty({ description: 'Reminder days before deadline' })
  reminderDays: number;

  @ApiProperty({ description: 'Creation timestamp' })
  createdAt: string;

  @ApiProperty({ description: 'Last update timestamp' })
  updatedAt: string;
}

// Report DTOs
export class TaxReportDto {
  @ApiProperty({ description: 'Report name' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'Report type' })
  @IsString()
  @IsNotEmpty()
  type: string;

  @ApiProperty({ description: 'Report start date' })
  @IsDateString()
  startDate: string;

  @ApiProperty({ description: 'Report end date' })
  @IsDateString()
  endDate: string;

  @ApiPropertyOptional({ description: 'Report filters' })
  @IsOptional()
  @IsObject()
  filters?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Report format' })
  @IsOptional()
  @IsEnum(ExportFormat)
  format?: ExportFormat;
}

export class TaxReportResponseDto {
  @ApiProperty({ description: 'Report ID' })
  id: string;

  @ApiProperty({ description: 'Report name' })
  name: string;

  @ApiProperty({ description: 'Report type' })
  type: string;

  @ApiProperty({ description: 'Report start date' })
  startDate: string;

  @ApiProperty({ description: 'Report end date' })
  endDate: string;

  @ApiProperty({ description: 'Report status' })
  status: string;

  @ApiProperty({ description: 'Report file URL' })
  fileUrl: string;

  @ApiProperty({ description: 'Report format' })
  format: ExportFormat;

  @ApiProperty({ description: 'Generated by user ID' })
  generatedBy: string;

  @ApiProperty({ description: 'Generation timestamp' })
  generatedAt: string;
}

// Settings DTOs
export class TaxSettingsDto {
  @ApiPropertyOptional({ description: 'Default tax calculation method' })
  @IsOptional()
  @IsString()
  defaultCalculationMethod?: string;

  @ApiPropertyOptional({ description: 'Auto-calculate tax on transactions' })
  @IsOptional()
  @IsBoolean()
  autoCalculate?: boolean;

  @ApiPropertyOptional({ description: 'Auto-submit tax collections' })
  @IsOptional()
  @IsBoolean()
  autoSubmit?: boolean;

  @ApiPropertyOptional({ description: 'Default tax period' })
  @IsOptional()
  @IsEnum(TaxPeriod)
  defaultPeriod?: TaxPeriod;

  @ApiPropertyOptional({ description: 'Notification settings' })
  @IsOptional()
  @IsObject()
  notifications?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Compliance settings' })
  @IsOptional()
  @IsObject()
  compliance?: Record<string, any>;
}

export class TaxSettingsResponseDto {
  @ApiProperty({ description: 'Settings ID' })
  id: string;

  @ApiProperty({ description: 'Default tax calculation method' })
  defaultCalculationMethod: string;

  @ApiProperty({ description: 'Auto-calculate tax on transactions' })
  autoCalculate: boolean;

  @ApiProperty({ description: 'Auto-submit tax collections' })
  autoSubmit: boolean;

  @ApiProperty({ description: 'Default tax period' })
  defaultPeriod: TaxPeriod;

  @ApiProperty({ description: 'Notification settings' })
  notifications: Record<string, any>;

  @ApiProperty({ description: 'Compliance settings' })
  compliance: Record<string, any>;

  @ApiProperty({ description: 'Last update timestamp' })
  updatedAt: string;
}

// Audit Trail DTO
export class TaxAuditTrailResponseDto {
  @ApiProperty({ description: 'Audit trail ID' })
  id: string;

  @ApiProperty({ description: 'Entity ID that was modified' })
  entityId: string;

  @ApiProperty({ description: 'Entity type' })
  entityType: string;

  @ApiProperty({ description: 'Action performed' })
  action: string;

  @ApiProperty({ description: 'Changes made' })
  changes: Record<string, any>;

  @ApiProperty({ description: 'User who performed the action' })
  performedBy: string;

  @ApiProperty({ description: 'Action timestamp' })
  performedAt: string;

  @ApiProperty({ description: 'Additional metadata' })
  metadata: Record<string, any>;
}
