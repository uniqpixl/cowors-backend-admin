import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDate,
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
export enum TaxType {
  GST = 'gst',
  CGST = 'cgst',
  SGST = 'sgst',
  IGST = 'igst',
  UTGST = 'utgst',
  TCS = 'tcs',
  TDS = 'tds',
  CESS = 'cess',
}

export enum TaxStatus {
  PENDING = 'pending',
  CALCULATED = 'calculated',
  COLLECTED = 'collected',
  PAID = 'paid',
  REFUNDED = 'refunded',
  CANCELLED = 'cancelled',
}

export enum ComplianceStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  OVERDUE = 'overdue',
  FILED = 'filed',
  REJECTED = 'rejected',
}

export enum TaxPeriod {
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  YEARLY = 'yearly',
  HALF_YEARLY = 'half_yearly',
}

export enum GSTCategory {
  REGULAR = 'regular',
  COMPOSITION = 'composition',
  EXEMPT = 'exempt',
  NIL_RATED = 'nil_rated',
  ZERO_RATED = 'zero_rated',
}

export enum HSNCategory {
  GOODS = 'goods',
  SERVICES = 'services',
}

export enum BulkTaxOperationType {
  CALCULATE_TAX = 'calculate_tax',
  COLLECT_TAX = 'collect_tax',
  PAY_TAX = 'pay_tax',
  CANCEL_TAX = 'cancel_tax',
  UPDATE_STATUS = 'update_status',
  GENERATE_INVOICES = 'generate_invoices',
}

export enum ExportFormat {
  CSV = 'csv',
  EXCEL = 'excel',
  PDF = 'pdf',
  JSON = 'json',
}

export enum ReportType {
  GST_RETURN = 'gst_return',
  TCS_REPORT = 'tcs_report',
  TDS_REPORT = 'tds_report',
  TAX_SUMMARY = 'tax_summary',
  COMPLIANCE_REPORT = 'compliance_report',
  MONTHLY_RETURN = 'monthly_return',
  QUARTERLY_RETURN = 'quarterly_return',
  ANNUAL_RETURN = 'annual_return',
}

// Tax Configuration DTOs
export class CreateTaxConfigDto {
  @ApiProperty({ description: 'Tax type', enum: TaxType })
  @IsEnum(TaxType)
  @IsNotEmpty()
  taxType: TaxType;

  @ApiProperty({ description: 'Tax name' })
  @IsString()
  @IsNotEmpty()
  @Length(1, 100)
  name: string;

  @ApiProperty({ description: 'Tax description' })
  @IsString()
  @IsOptional()
  @Length(0, 500)
  description?: string;

  @ApiProperty({ description: 'Tax rate percentage', minimum: 0, maximum: 100 })
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0)
  @Max(100)
  rate: number;

  @ApiPropertyOptional({ description: 'HSN/SAC code' })
  @IsString()
  @IsOptional()
  @Length(4, 10)
  hsnCode?: string;

  @ApiPropertyOptional({ description: 'HSN category', enum: HSNCategory })
  @IsEnum(HSNCategory)
  @IsOptional()
  hsnCategory?: HSNCategory;

  @ApiPropertyOptional({ description: 'State code for state-specific taxes' })
  @IsString()
  @IsOptional()
  @Length(2, 3)
  stateCode?: string;

  @ApiPropertyOptional({ description: 'Minimum threshold amount' })
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsOptional()
  @Min(0)
  thresholdAmount?: number;

  @ApiPropertyOptional({ description: 'Maximum threshold amount' })
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsOptional()
  @Min(0)
  maxThresholdAmount?: number;

  @ApiPropertyOptional({ description: 'Effective from date' })
  @IsDate()
  @IsOptional()
  @Type(() => Date)
  effectiveFrom?: Date;

  @ApiPropertyOptional({ description: 'Effective to date' })
  @IsDate()
  @IsOptional()
  @Type(() => Date)
  effectiveTo?: Date;

  @ApiPropertyOptional({
    description: 'Whether this configuration is active',
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean = true;

  @ApiPropertyOptional({ description: 'Additional metadata' })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}

export class UpdateTaxConfigDto {
  @ApiPropertyOptional({ description: 'Tax name' })
  @IsString()
  @IsOptional()
  @Length(1, 100)
  name?: string;

  @ApiPropertyOptional({ description: 'Tax description' })
  @IsString()
  @IsOptional()
  @Length(0, 500)
  description?: string;

  @ApiPropertyOptional({
    description: 'Tax rate percentage',
    minimum: 0,
    maximum: 100,
  })
  @IsNumber({ maxDecimalPlaces: 4 })
  @IsOptional()
  @Min(0)
  @Max(100)
  rate?: number;

  @ApiPropertyOptional({ description: 'HSN/SAC code' })
  @IsString()
  @IsOptional()
  @Length(4, 10)
  hsnCode?: string;

  @ApiPropertyOptional({ description: 'HSN category', enum: HSNCategory })
  @IsEnum(HSNCategory)
  @IsOptional()
  hsnCategory?: HSNCategory;

  @ApiPropertyOptional({ description: 'State code for state-specific taxes' })
  @IsString()
  @IsOptional()
  @Length(2, 3)
  stateCode?: string;

  @ApiPropertyOptional({ description: 'Minimum threshold amount' })
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsOptional()
  @Min(0)
  thresholdAmount?: number;

  @ApiPropertyOptional({ description: 'Maximum threshold amount' })
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsOptional()
  @Min(0)
  maxThresholdAmount?: number;

  @ApiPropertyOptional({ description: 'Effective from date' })
  @IsDate()
  @IsOptional()
  @Type(() => Date)
  effectiveFrom?: Date;

  @ApiPropertyOptional({ description: 'Effective to date' })
  @IsDate()
  @IsOptional()
  @Type(() => Date)
  effectiveTo?: Date;

  @ApiPropertyOptional({ description: 'Whether this configuration is active' })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Additional metadata' })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}

export class TaxConfigResponseDto {
  @ApiProperty({ description: 'Tax configuration ID' })
  id: string;

  @ApiProperty({ description: 'Tax type', enum: TaxType })
  taxType: TaxType;

  @ApiProperty({ description: 'Tax name' })
  name: string;

  @ApiPropertyOptional({ description: 'Tax description' })
  description?: string;

  @ApiProperty({ description: 'Tax rate percentage' })
  rate: number;

  @ApiPropertyOptional({ description: 'HSN/SAC code' })
  hsnCode?: string;

  @ApiPropertyOptional({ description: 'HSN category' })
  hsnCategory?: HSNCategory;

  @ApiPropertyOptional({ description: 'State code' })
  stateCode?: string;

  @ApiPropertyOptional({ description: 'Minimum threshold amount' })
  thresholdAmount?: number;

  @ApiPropertyOptional({ description: 'Maximum threshold amount' })
  maxThresholdAmount?: number;

  @ApiPropertyOptional({ description: 'Effective from date' })
  effectiveFrom?: Date;

  @ApiPropertyOptional({ description: 'Effective to date' })
  effectiveTo?: Date;

  @ApiProperty({ description: 'Whether this configuration is active' })
  isActive: boolean;

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

// GST Calculation DTOs
export class CalculateGSTDto {
  @ApiProperty({ description: 'Base amount for tax calculation' })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  baseAmount: number;

  @ApiPropertyOptional({ description: 'Currency code', default: 'INR' })
  @IsString()
  @IsOptional()
  @Length(3, 3)
  currency?: string = 'INR';

  @ApiPropertyOptional({ description: 'HSN/SAC code' })
  @IsString()
  @IsOptional()
  @Length(4, 10)
  hsnCode?: string;

  @ApiPropertyOptional({
    description: 'State code for inter/intra-state determination',
  })
  @IsString()
  @IsOptional()
  @Length(2, 3)
  stateCode?: string;

  @ApiPropertyOptional({ description: 'Customer state code' })
  @IsString()
  @IsOptional()
  @Length(2, 3)
  customerStateCode?: string;

  @ApiPropertyOptional({ description: 'GST category', enum: GSTCategory })
  @IsEnum(GSTCategory)
  @IsOptional()
  gstCategory?: GSTCategory;

  @ApiPropertyOptional({
    description: 'Partner ID for partner-specific calculations',
  })
  @IsUUID()
  @IsOptional()
  partnerId?: string;

  @ApiPropertyOptional({ description: 'Booking ID for transaction reference' })
  @IsUUID()
  @IsOptional()
  bookingId?: string;

  @ApiPropertyOptional({ description: 'Additional calculation parameters' })
  @IsObject()
  @IsOptional()
  parameters?: Record<string, any>;
}

export class GSTCalculationResponseDto {
  @ApiProperty({ description: 'Base amount' })
  baseAmount: number;

  @ApiProperty({ description: 'CGST amount' })
  cgstAmount: number;

  @ApiProperty({ description: 'SGST amount' })
  sgstAmount: number;

  @ApiProperty({ description: 'IGST amount' })
  igstAmount: number;

  @ApiPropertyOptional({ description: 'UTGST amount' })
  utgstAmount?: number;

  @ApiPropertyOptional({ description: 'CESS amount' })
  cessAmount?: number;

  @ApiProperty({ description: 'Total tax amount' })
  totalTaxAmount: number;

  @ApiProperty({ description: 'Total amount including tax' })
  totalAmount: number;

  @ApiProperty({ description: 'CGST rate applied' })
  cgstRate: number;

  @ApiProperty({ description: 'SGST rate applied' })
  sgstRate: number;

  @ApiProperty({ description: 'IGST rate applied' })
  igstRate: number;

  @ApiPropertyOptional({ description: 'UTGST rate applied' })
  utgstRate?: number;

  @ApiPropertyOptional({ description: 'CESS rate applied' })
  cessRate?: number;

  @ApiProperty({ description: 'Whether transaction is inter-state' })
  isInterState: boolean;

  @ApiPropertyOptional({ description: 'HSN/SAC code used' })
  hsnCode?: string;

  @ApiProperty({ description: 'Currency code' })
  currency: string;

  @ApiPropertyOptional({ description: 'Calculation breakdown' })
  breakdown?: Record<string, any>;
}

// Tax Transaction DTOs
export class CreateTaxTransactionDto {
  @ApiProperty({ description: 'Partner ID' })
  @IsUUID()
  @IsNotEmpty()
  partnerId: string;

  @ApiPropertyOptional({ description: 'Booking ID' })
  @IsUUID()
  @IsOptional()
  bookingId?: string;

  @ApiProperty({ description: 'Tax type', enum: TaxType })
  @IsEnum(TaxType)
  @IsNotEmpty()
  taxType: TaxType;

  @ApiProperty({ description: 'Base amount' })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  baseAmount: number;

  @ApiProperty({ description: 'Tax amount' })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  taxAmount: number;

  @ApiProperty({ description: 'Tax rate applied' })
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0)
  @Max(100)
  taxRate: number;

  @ApiPropertyOptional({ description: 'Currency code', default: 'INR' })
  @IsString()
  @IsOptional()
  @Length(3, 3)
  currency?: string = 'INR';

  @ApiPropertyOptional({ description: 'HSN/SAC code' })
  @IsString()
  @IsOptional()
  @Length(4, 10)
  hsnCode?: string;

  @ApiPropertyOptional({ description: 'Transaction description' })
  @IsString()
  @IsOptional()
  @Length(0, 500)
  description?: string;

  @ApiPropertyOptional({ description: 'Due date for tax payment' })
  @IsDate()
  @IsOptional()
  @Type(() => Date)
  dueDate?: Date;

  @ApiPropertyOptional({ description: 'Additional metadata' })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}

export class UpdateTaxTransactionDto {
  @ApiPropertyOptional({ description: 'Tax status', enum: TaxStatus })
  @IsEnum(TaxStatus)
  @IsOptional()
  status?: TaxStatus;

  @ApiPropertyOptional({ description: 'Payment reference' })
  @IsString()
  @IsOptional()
  @Length(0, 100)
  paymentReference?: string;

  @ApiPropertyOptional({ description: 'Payment date' })
  @IsDate()
  @IsOptional()
  @Type(() => Date)
  paymentDate?: Date;

  @ApiPropertyOptional({ description: 'Due date for tax payment' })
  @IsDate()
  @IsOptional()
  @Type(() => Date)
  dueDate?: Date;

  @ApiPropertyOptional({ description: 'Transaction description' })
  @IsString()
  @IsOptional()
  @Length(0, 500)
  description?: string;

  @ApiPropertyOptional({ description: 'Notes' })
  @IsString()
  @IsOptional()
  @Length(0, 1000)
  notes?: string;

  @ApiPropertyOptional({ description: 'Additional metadata' })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}

export class TaxTransactionResponseDto {
  @ApiProperty({ description: 'Tax transaction ID' })
  id: string;

  @ApiProperty({ description: 'Transaction reference' })
  transactionReference: string;

  @ApiProperty({ description: 'Partner information' })
  partner: {
    id: string;
    name: string;
    email: string;
    gstin?: string;
  };

  @ApiPropertyOptional({ description: 'Booking information' })
  booking?: {
    id: string;
    bookingReference: string;
  };

  @ApiProperty({ description: 'Tax type' })
  taxType: TaxType;

  @ApiProperty({ description: 'Tax status' })
  status: TaxStatus;

  @ApiProperty({ description: 'Base amount' })
  baseAmount: number;

  @ApiProperty({ description: 'Tax amount' })
  taxAmount: number;

  @ApiProperty({ description: 'Tax rate applied' })
  taxRate: number;

  @ApiProperty({ description: 'Currency code' })
  currency: string;

  @ApiPropertyOptional({ description: 'HSN/SAC code' })
  hsnCode?: string;

  @ApiPropertyOptional({ description: 'Transaction description' })
  description?: string;

  @ApiPropertyOptional({ description: 'Payment reference' })
  paymentReference?: string;

  @ApiPropertyOptional({ description: 'Payment date' })
  paymentDate?: Date;

  @ApiPropertyOptional({ description: 'Due date' })
  dueDate?: Date;

  @ApiPropertyOptional({ description: 'Notes' })
  notes?: string;

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

// Tax Compliance DTOs
export class TaxComplianceDto {
  @ApiProperty({ description: 'Tax type', enum: TaxType })
  @IsEnum(TaxType)
  @IsNotEmpty()
  taxType: TaxType;

  @ApiProperty({ description: 'Compliance period', enum: TaxPeriod })
  @IsEnum(TaxPeriod)
  @IsNotEmpty()
  period: TaxPeriod;

  @ApiProperty({ description: 'Period start date' })
  @IsDate()
  @IsNotEmpty()
  @Type(() => Date)
  periodStart: Date;

  @ApiProperty({ description: 'Period end date' })
  @IsDate()
  @IsNotEmpty()
  @Type(() => Date)
  periodEnd: Date;

  @ApiProperty({ description: 'Due date for compliance' })
  @IsDate()
  @IsNotEmpty()
  @Type(() => Date)
  dueDate: Date;

  @ApiPropertyOptional({ description: 'Compliance description' })
  @IsString()
  @IsOptional()
  @Length(0, 500)
  description?: string;

  @ApiPropertyOptional({ description: 'Required documents' })
  @IsArray()
  @IsOptional()
  @IsString({ each: true })
  requiredDocuments?: string[];

  @ApiPropertyOptional({ description: 'Additional metadata' })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}

export class TaxComplianceResponseDto {
  @ApiProperty({ description: 'Compliance ID' })
  id: string;

  @ApiProperty({ description: 'Compliance reference' })
  complianceReference: string;

  @ApiProperty({ description: 'Tax type' })
  taxType: TaxType;

  @ApiProperty({ description: 'Compliance status' })
  status: ComplianceStatus;

  @ApiProperty({ description: 'Compliance period' })
  period: TaxPeriod;

  @ApiProperty({ description: 'Period start date' })
  periodStart: Date;

  @ApiProperty({ description: 'Period end date' })
  periodEnd: Date;

  @ApiProperty({ description: 'Due date' })
  dueDate: Date;

  @ApiPropertyOptional({ description: 'Completion date' })
  completedDate?: Date;

  @ApiPropertyOptional({ description: 'Filing reference' })
  filingReference?: string;

  @ApiPropertyOptional({ description: 'Description' })
  description?: string;

  @ApiPropertyOptional({ description: 'Required documents' })
  requiredDocuments?: string[];

  @ApiPropertyOptional({ description: 'Notes' })
  notes?: string;

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

// Bulk Operations DTO
export class BulkTaxOperationDto {
  @ApiProperty({ description: 'Operation type', enum: BulkTaxOperationType })
  @IsEnum(BulkTaxOperationType)
  @IsNotEmpty()
  operation: BulkTaxOperationType;

  @ApiProperty({ description: 'Tax transaction IDs', type: [String] })
  @IsArray()
  @IsUUID(4, { each: true })
  @IsNotEmpty()
  transactionIds: string[];

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

// Analytics DTO
export class TaxAnalyticsDto {
  @ApiProperty({ description: 'Total tax collected' })
  totalTaxCollected: number;

  @ApiProperty({ description: 'Total tax paid' })
  totalTaxPaid: number;

  @ApiProperty({ description: 'Total tax pending' })
  totalTaxPending: number;

  @ApiProperty({ description: 'Total transactions' })
  totalTransactions: number;

  @ApiProperty({ description: 'GST collected' })
  gstCollected: number;

  @ApiProperty({ description: 'TCS collected' })
  tcsCollected: number;

  @ApiProperty({ description: 'TDS deducted' })
  tdsDeducted: number;

  @ApiProperty({ description: 'Tax collection by type' })
  collectionByType: Array<{
    taxType: TaxType;
    amount: number;
    count: number;
  }>;

  @ApiProperty({ description: 'Monthly trends' })
  monthlyTrends: Array<{
    month: string;
    collected: number;
    paid: number;
    pending: number;
  }>;

  @ApiProperty({ description: 'Compliance status distribution' })
  complianceDistribution: Array<{
    status: ComplianceStatus;
    count: number;
    percentage: number;
  }>;

  @ApiProperty({ description: 'Top tax-paying partners' })
  topPartners: Array<{
    partnerId: string;
    partnerName: string;
    totalTax: number;
    transactionCount: number;
  }>;
}

// Export DTO
export class TaxExportDto {
  @ApiProperty({ description: 'Export type' })
  @IsString()
  @IsNotEmpty()
  exportType: string;

  @ApiProperty({ description: 'Export format', enum: ExportFormat })
  @IsEnum(ExportFormat)
  @IsNotEmpty()
  format: ExportFormat;

  @ApiPropertyOptional({ description: 'Date range start' })
  @IsDate()
  @IsOptional()
  @Type(() => Date)
  dateFrom?: Date;

  @ApiPropertyOptional({ description: 'Date range end' })
  @IsDate()
  @IsOptional()
  @Type(() => Date)
  dateTo?: Date;

  @ApiPropertyOptional({ description: 'Export filters' })
  @IsObject()
  @IsOptional()
  filters?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Include archived records' })
  @IsBoolean()
  @IsOptional()
  includeArchived?: boolean;
}

// Report DTOs
export class TaxReportDto {
  @ApiProperty({ description: 'Report type', enum: ReportType })
  @IsEnum(ReportType)
  @IsNotEmpty()
  reportType: ReportType;

  @ApiProperty({ description: 'Report name' })
  @IsString()
  @IsNotEmpty()
  @Length(1, 100)
  reportName: string;

  @ApiProperty({ description: 'Report format', enum: ExportFormat })
  @IsEnum(ExportFormat)
  @IsNotEmpty()
  format: ExportFormat;

  @ApiPropertyOptional({ description: 'Date range start' })
  @IsDate()
  @IsOptional()
  @Type(() => Date)
  dateFrom?: Date;

  @ApiPropertyOptional({ description: 'Date range end' })
  @IsDate()
  @IsOptional()
  @Type(() => Date)
  dateTo?: Date;

  @ApiPropertyOptional({ description: 'Report parameters' })
  @IsObject()
  @IsOptional()
  parameters?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Include summary' })
  @IsBoolean()
  @IsOptional()
  includeSummary?: boolean;

  @ApiPropertyOptional({ description: 'Include charts' })
  @IsBoolean()
  @IsOptional()
  includeCharts?: boolean;
}

export class TaxReportResponseDto {
  @ApiProperty({ description: 'Report ID' })
  id: string;

  @ApiProperty({ description: 'Report name' })
  reportName: string;

  @ApiProperty({ description: 'Report type' })
  reportType: ReportType;

  @ApiProperty({ description: 'Report status' })
  status: string;

  @ApiProperty({ description: 'Report format' })
  format: ExportFormat;

  @ApiPropertyOptional({ description: 'Date range start' })
  dateFrom?: Date;

  @ApiPropertyOptional({ description: 'Date range end' })
  dateTo?: Date;

  @ApiPropertyOptional({ description: 'Report parameters' })
  parameters?: Record<string, any>;

  @ApiPropertyOptional({ description: 'File path' })
  filePath?: string;

  @ApiPropertyOptional({ description: 'Download URL' })
  downloadUrl?: string;

  @ApiProperty({ description: 'Creation timestamp' })
  createdAt: Date;

  @ApiProperty({ description: 'Completion timestamp' })
  completedAt?: Date;

  @ApiPropertyOptional({ description: 'Created by user ID' })
  createdBy?: string;
}

// Settings DTO
export class TaxSettingsDto {
  @ApiPropertyOptional({ description: 'Default GST rate' })
  @IsNumber({ maxDecimalPlaces: 4 })
  @IsOptional()
  @Min(0)
  @Max(100)
  defaultGSTRate?: number;

  @ApiPropertyOptional({ description: 'Default TCS rate' })
  @IsNumber({ maxDecimalPlaces: 4 })
  @IsOptional()
  @Min(0)
  @Max(100)
  defaultTCSRate?: number;

  @ApiPropertyOptional({ description: 'Default TDS rate' })
  @IsNumber({ maxDecimalPlaces: 4 })
  @IsOptional()
  @Min(0)
  @Max(100)
  defaultTDSRate?: number;

  @ApiPropertyOptional({ description: 'Auto-calculate taxes' })
  @IsBoolean()
  @IsOptional()
  autoCalculateTax?: boolean;

  @ApiPropertyOptional({ description: 'Auto-collect taxes' })
  @IsBoolean()
  @IsOptional()
  autoCollectTax?: boolean;

  @ApiPropertyOptional({ description: 'Tax payment reminder days' })
  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(365)
  paymentReminderDays?: number;

  @ApiPropertyOptional({ description: 'Compliance reminder days' })
  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(365)
  complianceReminderDays?: number;

  @ApiPropertyOptional({ description: 'Enable tax notifications' })
  @IsBoolean()
  @IsOptional()
  enableNotifications?: boolean;

  @ApiPropertyOptional({ description: 'Tax calculation precision' })
  @IsNumber()
  @IsOptional()
  @Min(2)
  @Max(6)
  calculationPrecision?: number;

  @ApiPropertyOptional({ description: 'Additional settings' })
  @IsObject()
  @IsOptional()
  additionalSettings?: Record<string, any>;
}
