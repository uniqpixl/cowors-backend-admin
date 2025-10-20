import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsDate,
  IsDateString,
  IsDecimal,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  Length,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';

// Enums
export enum TaxStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  PENDING = 'pending',
  SUSPENDED = 'suspended',
  DELETED = 'deleted',
}

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
}

export enum ComplianceStatus {
  COMPLIANT = 'compliant',
  NON_COMPLIANT = 'non_compliant',
  PENDING_REVIEW = 'pending_review',
  OVERDUE = 'overdue',
  EXEMPTED = 'exempted',
}

export enum ReturnStatus {
  DRAFT = 'draft',
  SUBMITTED = 'submitted',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  FILED = 'filed',
  AMENDED = 'amended',
}

export enum CalculationStatus {
  PENDING = 'pending',
  CALCULATED = 'calculated',
  VERIFIED = 'verified',
  APPLIED = 'applied',
  CANCELLED = 'cancelled',
}

export enum ExportStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

export enum ExportFormat {
  CSV = 'csv',
  EXCEL = 'excel',
  PDF = 'pdf',
  JSON = 'json',
}

export enum BulkOperationType {
  ACTIVATE = 'activate',
  DEACTIVATE = 'deactivate',
  DELETE = 'delete',
  UPDATE = 'update',
  UPDATE_STATUS = 'update_status',
  RECALCULATE = 'recalculate',
  EXPORT = 'export',
}

export enum TaxCategory {
  GOODS = 'goods',
  SERVICES = 'services',
  MIXED = 'mixed',
  EXEMPT = 'exempt',
  ZERO_RATED = 'zero_rated',
}

export enum ComplianceType {
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  ANNUAL = 'annual',
  SPECIAL = 'special',
}

// Base DTOs
export class PaginationDto {
  @ApiPropertyOptional({ description: 'Page number', default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Items per page',
    default: 10,
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  @Type(() => Number)
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @ApiPropertyOptional({ description: 'Sort field', default: 'createdAt' })
  @IsOptional()
  @IsString()
  sortBy?: string = 'createdAt';

  @ApiPropertyOptional({
    description: 'Sort order',
    enum: ['ASC', 'DESC'],
    default: 'DESC',
  })
  @IsOptional()
  @IsEnum(['ASC', 'DESC'])
  sortOrder?: 'ASC' | 'DESC' = 'DESC';
}

// Tax Rule DTOs
export class CreateTaxRuleDto {
  @ApiProperty({ description: 'Tax rule name' })
  @IsNotEmpty()
  @IsString()
  @Length(1, 255)
  name: string;

  @ApiPropertyOptional({ description: 'Tax rule description' })
  @IsOptional()
  @IsString()
  @Length(0, 1000)
  description?: string;

  @ApiProperty({ description: 'Tax type', enum: TaxType })
  @IsEnum(TaxType)
  type: TaxType;

  @ApiProperty({ description: 'Tax rate percentage', minimum: 0, maximum: 100 })
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0)
  @Max(100)
  rate: number;

  @ApiPropertyOptional({ description: 'Tax category', enum: TaxCategory })
  @IsOptional()
  @IsEnum(TaxCategory)
  category?: TaxCategory;

  @ApiPropertyOptional({ description: 'Minimum taxable amount' })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  minAmount?: number;

  @ApiPropertyOptional({ description: 'Maximum taxable amount' })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  maxAmount?: number;

  @ApiPropertyOptional({ description: 'Effective from date' })
  @IsOptional()
  @IsDateString()
  effectiveFrom?: string;

  @ApiPropertyOptional({ description: 'Effective to date' })
  @IsOptional()
  @IsDateString()
  effectiveTo?: string;

  @ApiPropertyOptional({
    description: 'HSN/SAC codes applicable',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  hsnSacCodes?: string[];

  @ApiPropertyOptional({ description: 'States applicable', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  applicableStates?: string[];

  @ApiPropertyOptional({ description: 'Additional metadata', type: 'object' })
  @IsOptional()
  metadata?: Record<string, any>;
}

export class UpdateTaxRuleDto {
  @ApiPropertyOptional({ description: 'Tax rule name' })
  @IsOptional()
  @IsString()
  @Length(1, 255)
  name?: string;

  @ApiPropertyOptional({ description: 'Tax rule description' })
  @IsOptional()
  @IsString()
  @Length(0, 1000)
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

  @ApiPropertyOptional({ description: 'Tax category', enum: TaxCategory })
  @IsOptional()
  @IsEnum(TaxCategory)
  category?: TaxCategory;

  @ApiPropertyOptional({ description: 'Minimum taxable amount' })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  minAmount?: number;

  @ApiPropertyOptional({ description: 'Maximum taxable amount' })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  maxAmount?: number;

  @ApiPropertyOptional({ description: 'Effective from date' })
  @IsOptional()
  @IsDateString()
  effectiveFrom?: string;

  @ApiPropertyOptional({ description: 'Effective to date' })
  @IsOptional()
  @IsDateString()
  effectiveTo?: string;

  @ApiPropertyOptional({
    description: 'HSN/SAC codes applicable',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  hsnSacCodes?: string[];

  @ApiPropertyOptional({ description: 'States applicable', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  applicableStates?: string[];

  @ApiPropertyOptional({ description: 'Tax status', enum: TaxStatus })
  @IsOptional()
  @IsEnum(TaxStatus)
  status?: TaxStatus;

  @ApiPropertyOptional({ description: 'Additional metadata', type: 'object' })
  @IsOptional()
  metadata?: Record<string, any>;
}

export class GetTaxRulesDto extends PaginationDto {
  @ApiPropertyOptional({
    description: 'Search term for rule name or description',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Filter by tax type', enum: TaxType })
  @IsOptional()
  @IsEnum(TaxType)
  type?: TaxType;

  @ApiPropertyOptional({ description: 'Filter by status', enum: TaxStatus })
  @IsOptional()
  @IsEnum(TaxStatus)
  status?: TaxStatus;

  @ApiPropertyOptional({ description: 'Filter by category', enum: TaxCategory })
  @IsOptional()
  @IsEnum(TaxCategory)
  category?: TaxCategory;

  @ApiPropertyOptional({ description: 'Filter by effective date' })
  @IsOptional()
  @IsDateString()
  effectiveDate?: string;

  @ApiPropertyOptional({ description: 'Filter by HSN/SAC code' })
  @IsOptional()
  @IsString()
  hsnSacCode?: string;

  @ApiPropertyOptional({ description: 'Filter by state' })
  @IsOptional()
  @IsString()
  state?: string;
}

// Tax Calculation DTOs
export class CreateTaxCalculationDto {
  @ApiProperty({ description: 'Reference ID (booking, invoice, etc.)' })
  @IsNotEmpty()
  @IsString()
  referenceId: string;

  @ApiProperty({ description: 'Reference type' })
  @IsNotEmpty()
  @IsString()
  referenceType: string;

  @ApiProperty({ description: 'Base amount for tax calculation' })
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  baseAmount: number;

  @ApiPropertyOptional({ description: 'Tax type', enum: TaxType })
  @IsOptional()
  @IsEnum(TaxType)
  taxType?: TaxType;

  @ApiPropertyOptional({ description: 'HSN/SAC code' })
  @IsOptional()
  @IsString()
  hsnSacCode?: string;

  @ApiPropertyOptional({ description: 'State code for tax calculation' })
  @IsOptional()
  @IsString()
  stateCode?: string;

  @ApiPropertyOptional({ description: 'Customer GST number' })
  @IsOptional()
  @IsString()
  customerGstNumber?: string;

  @ApiPropertyOptional({ description: 'Supplier GST number' })
  @IsOptional()
  @IsString()
  supplierGstNumber?: string;

  @ApiPropertyOptional({ description: 'Place of supply' })
  @IsOptional()
  @IsString()
  placeOfSupply?: string;

  @ApiPropertyOptional({ description: 'Transaction date' })
  @IsOptional()
  @IsDateString()
  transactionDate?: string;

  @ApiPropertyOptional({
    description: 'Additional calculation parameters',
    type: 'object',
  })
  @IsOptional()
  calculationParams?: Record<string, any>;
}

export class UpdateTaxCalculationDto {
  @ApiPropertyOptional({ description: 'Base amount for tax calculation' })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  baseAmount?: number;

  @ApiPropertyOptional({ description: 'Tax type', enum: TaxType })
  @IsOptional()
  @IsEnum(TaxType)
  taxType?: TaxType;

  @ApiPropertyOptional({ description: 'HSN/SAC code' })
  @IsOptional()
  @IsString()
  hsnSacCode?: string;

  @ApiPropertyOptional({ description: 'State code for tax calculation' })
  @IsOptional()
  @IsString()
  stateCode?: string;

  @ApiPropertyOptional({ description: 'Customer GST number' })
  @IsOptional()
  @IsString()
  customerGstNumber?: string;

  @ApiPropertyOptional({ description: 'Supplier GST number' })
  @IsOptional()
  @IsString()
  supplierGstNumber?: string;

  @ApiPropertyOptional({ description: 'Place of supply' })
  @IsOptional()
  @IsString()
  placeOfSupply?: string;

  @ApiPropertyOptional({ description: 'Transaction date' })
  @IsOptional()
  @IsDateString()
  transactionDate?: string;

  @ApiPropertyOptional({
    description: 'Calculation status',
    enum: CalculationStatus,
  })
  @IsOptional()
  @IsEnum(CalculationStatus)
  status?: CalculationStatus;

  @ApiPropertyOptional({
    description: 'Additional calculation parameters',
    type: 'object',
  })
  @IsOptional()
  calculationParams?: Record<string, any>;
}

export class GetTaxCalculationsDto extends PaginationDto {
  @ApiPropertyOptional({ description: 'Search term' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Start date for filtering' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'End date for filtering' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ description: 'Filter by reference ID' })
  @IsOptional()
  @IsString()
  referenceId?: string;

  @ApiPropertyOptional({ description: 'Filter by reference type' })
  @IsOptional()
  @IsString()
  referenceType?: string;

  @ApiPropertyOptional({ description: 'Filter by tax type', enum: TaxType })
  @IsOptional()
  @IsEnum(TaxType)
  taxType?: TaxType;

  @ApiPropertyOptional({
    description: 'Filter by status',
    enum: CalculationStatus,
  })
  @IsOptional()
  @IsEnum(CalculationStatus)
  status?: CalculationStatus;

  @ApiPropertyOptional({ description: 'Filter by date from' })
  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @ApiPropertyOptional({ description: 'Filter by date to' })
  @IsOptional()
  @IsDateString()
  dateTo?: string;

  @ApiPropertyOptional({ description: 'Filter by HSN/SAC code' })
  @IsOptional()
  @IsString()
  hsnSacCode?: string;

  @ApiPropertyOptional({ description: 'Filter by state code' })
  @IsOptional()
  @IsString()
  stateCode?: string;
}

// Tax Return DTOs
export class CreateTaxReturnDto {
  @ApiProperty({ description: 'Return period (e.g., 2024-01)' })
  @IsNotEmpty()
  @IsString()
  returnPeriod: string;

  @ApiProperty({ description: 'Return type', enum: ComplianceType })
  @IsEnum(ComplianceType)
  returnType: ComplianceType;

  @ApiProperty({ description: 'Tax type', enum: TaxType })
  @IsEnum(TaxType)
  taxType: TaxType;

  @ApiProperty({ description: 'Due date for filing' })
  @IsDateString()
  dueDate: string;

  @ApiPropertyOptional({ description: 'Total tax liability' })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  totalTaxLiability?: number;

  @ApiPropertyOptional({ description: 'Total tax paid' })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  totalTaxPaid?: number;

  @ApiPropertyOptional({ description: 'Return data', type: 'object' })
  @IsOptional()
  returnData?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Supporting documents', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  supportingDocuments?: string[];

  @ApiPropertyOptional({ description: 'Additional notes' })
  @IsOptional()
  @IsString()
  @Length(0, 1000)
  notes?: string;
}

export class UpdateTaxReturnDto {
  @ApiPropertyOptional({ description: 'Total tax liability' })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  totalTaxLiability?: number;

  @ApiPropertyOptional({ description: 'Total tax paid' })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  totalTaxPaid?: number;

  @ApiPropertyOptional({ description: 'Return status', enum: ReturnStatus })
  @IsOptional()
  @IsEnum(ReturnStatus)
  status?: ReturnStatus;

  @ApiPropertyOptional({ description: 'Return data', type: 'object' })
  @IsOptional()
  returnData?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Supporting documents', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  supportingDocuments?: string[];

  @ApiPropertyOptional({ description: 'Additional notes' })
  @IsOptional()
  @IsString()
  @Length(0, 1000)
  notes?: string;

  @ApiPropertyOptional({ description: 'Filed date' })
  @IsOptional()
  @IsDateString()
  filedDate?: string;

  @ApiPropertyOptional({ description: 'Acknowledgment number' })
  @IsOptional()
  @IsString()
  acknowledgmentNumber?: string;
}

export class GetTaxReturnsDto extends PaginationDto {
  @ApiPropertyOptional({ description: 'Search term' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Start date for filtering' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'End date for filtering' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ description: 'Filter by return period' })
  @IsOptional()
  @IsString()
  returnPeriod?: string;

  @ApiPropertyOptional({
    description: 'Filter by return type',
    enum: ComplianceType,
  })
  @IsOptional()
  @IsEnum(ComplianceType)
  returnType?: ComplianceType;

  @ApiPropertyOptional({ description: 'Filter by tax type', enum: TaxType })
  @IsOptional()
  @IsEnum(TaxType)
  taxType?: TaxType;

  @ApiPropertyOptional({ description: 'Filter by status', enum: ReturnStatus })
  @IsOptional()
  @IsEnum(ReturnStatus)
  status?: ReturnStatus;

  @ApiPropertyOptional({ description: 'Filter by due date from' })
  @IsOptional()
  @IsDateString()
  dueDateFrom?: string;

  @ApiPropertyOptional({ description: 'Filter by due date to' })
  @IsOptional()
  @IsDateString()
  dueDateTo?: string;

  @ApiPropertyOptional({ description: 'Filter overdue returns only' })
  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  overdueOnly?: boolean;
}

// Tax Compliance DTOs
export class CreateTaxComplianceDto {
  @ApiProperty({ description: 'Compliance type', enum: ComplianceType })
  @IsEnum(ComplianceType)
  complianceType: ComplianceType;

  @ApiProperty({ description: 'Tax type', enum: TaxType })
  @IsEnum(TaxType)
  taxType: TaxType;

  @ApiProperty({ description: 'Compliance period' })
  @IsNotEmpty()
  @IsString()
  compliancePeriod: string;

  @ApiProperty({ description: 'Due date' })
  @IsDateString()
  dueDate: string;

  @ApiPropertyOptional({ description: 'Description' })
  @IsOptional()
  @IsString()
  @Length(0, 1000)
  description?: string;

  @ApiPropertyOptional({ description: 'Required documents', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  requiredDocuments?: string[];

  @ApiPropertyOptional({ description: 'Penalty amount if non-compliant' })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  penaltyAmount?: number;

  @ApiPropertyOptional({ description: 'Additional metadata', type: 'object' })
  @IsOptional()
  metadata?: Record<string, any>;
}

export class UpdateTaxComplianceDto {
  @ApiPropertyOptional({
    description: 'Compliance status',
    enum: ComplianceStatus,
  })
  @IsOptional()
  @IsEnum(ComplianceStatus)
  status?: ComplianceStatus;

  @ApiPropertyOptional({ description: 'Description' })
  @IsOptional()
  @IsString()
  @Length(0, 1000)
  description?: string;

  @ApiPropertyOptional({ description: 'Required documents', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  requiredDocuments?: string[];

  @ApiPropertyOptional({ description: 'Submitted documents', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  submittedDocuments?: string[];

  @ApiPropertyOptional({ description: 'Penalty amount if non-compliant' })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  penaltyAmount?: number;

  @ApiPropertyOptional({ description: 'Completion date' })
  @IsOptional()
  @IsDateString()
  completionDate?: string;

  @ApiPropertyOptional({ description: 'Additional notes' })
  @IsOptional()
  @IsString()
  @Length(0, 1000)
  notes?: string;

  @ApiPropertyOptional({ description: 'Additional metadata', type: 'object' })
  @IsOptional()
  metadata?: Record<string, any>;
}

export class GetTaxComplianceDto extends PaginationDto {
  @ApiPropertyOptional({ description: 'Search term' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Start date for filtering' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'End date for filtering' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({
    description: 'Filter by compliance type',
    enum: ComplianceType,
  })
  @IsOptional()
  @IsEnum(ComplianceType)
  complianceType?: ComplianceType;

  @ApiPropertyOptional({ description: 'Filter by tax type', enum: TaxType })
  @IsOptional()
  @IsEnum(TaxType)
  taxType?: TaxType;

  @ApiPropertyOptional({
    description: 'Filter by status',
    enum: ComplianceStatus,
  })
  @IsOptional()
  @IsEnum(ComplianceStatus)
  status?: ComplianceStatus;

  @ApiPropertyOptional({ description: 'Filter by compliance period' })
  @IsOptional()
  @IsString()
  compliancePeriod?: string;

  @ApiPropertyOptional({ description: 'Filter by due date from' })
  @IsOptional()
  @IsDateString()
  dueDateFrom?: string;

  @ApiPropertyOptional({ description: 'Filter by due date to' })
  @IsOptional()
  @IsDateString()
  dueDateTo?: string;

  @ApiPropertyOptional({ description: 'Filter overdue items only' })
  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  overdueOnly?: boolean;
}

// Bulk Operations DTO
export class BulkTaxOperationDto {
  @ApiProperty({ description: 'Operation type', enum: BulkOperationType })
  @IsEnum(BulkOperationType)
  operation: BulkOperationType;

  @ApiProperty({
    description:
      'Target entity type (rules, calculations, returns, compliance)',
  })
  @IsNotEmpty()
  @IsString()
  entityType: string;

  @ApiProperty({ description: 'Entity IDs to operate on', type: [String] })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(100)
  @IsUUID(4, { each: true })
  entityIds: string[];

  @ApiPropertyOptional({ description: 'Operation data', type: 'object' })
  @IsOptional()
  data?: Record<string, any>;

  @ApiPropertyOptional({
    description: 'Additional operation parameters',
    type: 'object',
  })
  @IsOptional()
  operationParams?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Reason for bulk operation' })
  @IsOptional()
  @IsString()
  @Length(0, 500)
  reason?: string;
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

  @ApiPropertyOptional({
    description: 'Group by period (day, week, month, quarter, year)',
  })
  @IsOptional()
  @IsEnum(['day', 'week', 'month', 'quarter', 'year'])
  groupBy?: string;

  @ApiPropertyOptional({ description: 'Filter by tax type', enum: TaxType })
  @IsOptional()
  @IsEnum(TaxType)
  taxType?: TaxType;

  @ApiPropertyOptional({ description: 'Filter by state codes', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  stateCodes?: string[];

  @ApiPropertyOptional({
    description: 'Include comparison with previous period',
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  includeComparison?: boolean;
}

// Export DTO
export class ExportTaxDataDto {
  @ApiProperty({ description: 'Export format', enum: ExportFormat })
  @IsEnum(ExportFormat)
  format: ExportFormat;

  @ApiProperty({
    description:
      'Data type to export (rules, calculations, returns, compliance)',
  })
  @IsNotEmpty()
  @IsString()
  dataType: string;

  @ApiPropertyOptional({ description: 'Start date for export' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'End date for export' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ description: 'Additional filters', type: 'object' })
  @IsOptional()
  filters?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Include related data' })
  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  includeRelatedData?: boolean;
}

// Settings DTO
export class TaxSettingsDto {
  @ApiPropertyOptional({ description: 'Default tax type', enum: TaxType })
  @IsOptional()
  @IsEnum(TaxType)
  defaultTaxType?: TaxType;

  @ApiPropertyOptional({ description: 'Company GST number' })
  @IsOptional()
  @IsString()
  companyGstNumber?: string;

  @ApiPropertyOptional({ description: 'Company PAN number' })
  @IsOptional()
  @IsString()
  companyPanNumber?: string;

  @ApiPropertyOptional({ description: 'Default place of supply' })
  @IsOptional()
  @IsString()
  defaultPlaceOfSupply?: string;

  @ApiPropertyOptional({ description: 'Auto-calculate taxes' })
  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  autoCalculateTaxes?: boolean;

  @ApiPropertyOptional({ description: 'Send compliance reminders' })
  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  sendComplianceReminders?: boolean;

  @ApiPropertyOptional({ description: 'Reminder days before due date' })
  @IsOptional()
  @Type(() => Number)
  @Min(1)
  @Max(90)
  reminderDays?: number;

  @ApiPropertyOptional({ description: 'Additional settings', type: 'object' })
  @IsOptional()
  additionalSettings?: Record<string, any>;
}

// Response DTOs
export class TaxRuleResponseDto {
  @ApiProperty({ description: 'Tax rule ID' })
  id: string;

  @ApiProperty({ description: 'Tax rule name' })
  name: string;

  @ApiProperty({ description: 'Tax rule description' })
  description: string;

  @ApiProperty({ description: 'Tax type', enum: TaxType })
  type: TaxType;

  @ApiProperty({ description: 'Tax rate percentage' })
  rate: number;

  @ApiProperty({ description: 'Tax category', enum: TaxCategory })
  category: TaxCategory;

  @ApiProperty({ description: 'Tax status', enum: TaxStatus })
  status: TaxStatus;

  @ApiProperty({ description: 'Minimum taxable amount' })
  minAmount: number;

  @ApiProperty({ description: 'Maximum taxable amount' })
  maxAmount: number;

  @ApiProperty({ description: 'Effective from date' })
  effectiveFrom: Date;

  @ApiProperty({ description: 'Effective to date' })
  effectiveTo: Date;

  @ApiProperty({ description: 'HSN/SAC codes applicable', type: [String] })
  hsnSacCodes: string[];

  @ApiProperty({ description: 'States applicable', type: [String] })
  applicableStates: string[];

  @ApiProperty({ description: 'Additional metadata' })
  metadata: Record<string, any>;

  @ApiProperty({ description: 'Created at' })
  createdAt: Date;

  @ApiProperty({ description: 'Updated at' })
  updatedAt: Date;

  @ApiProperty({ description: 'Created by user ID' })
  createdBy: string;

  @ApiProperty({ description: 'Updated by user ID' })
  updatedBy: string;
}

export class TaxCalculationResponseDto {
  @ApiProperty({ description: 'Tax calculation ID' })
  id: string;

  @ApiProperty({ description: 'Reference ID' })
  referenceId: string;

  @ApiProperty({ description: 'Reference type' })
  referenceType: string;

  @ApiProperty({ description: 'Base amount' })
  baseAmount: number;

  @ApiProperty({ description: 'Tax type', enum: TaxType })
  taxType: TaxType;

  @ApiProperty({ description: 'Tax rate applied' })
  taxRate: number;

  @ApiProperty({ description: 'Tax amount calculated' })
  taxAmount: number;

  @ApiProperty({ description: 'Total amount including tax' })
  totalAmount: number;

  @ApiProperty({ description: 'Calculation status', enum: CalculationStatus })
  status: CalculationStatus;

  @ApiProperty({ description: 'HSN/SAC code' })
  hsnSacCode: string;

  @ApiProperty({ description: 'State code' })
  stateCode: string;

  @ApiProperty({ description: 'Customer GST number' })
  customerGstNumber: string;

  @ApiProperty({ description: 'Supplier GST number' })
  supplierGstNumber: string;

  @ApiProperty({ description: 'Place of supply' })
  placeOfSupply: string;

  @ApiProperty({ description: 'Transaction date' })
  transactionDate: Date;

  @ApiProperty({ description: 'Calculation breakdown' })
  calculationBreakdown: Record<string, any>;

  @ApiProperty({ description: 'Created at' })
  createdAt: Date;

  @ApiProperty({ description: 'Updated at' })
  updatedAt: Date;

  @ApiProperty({ description: 'Created by user ID' })
  createdBy: string;
}

export class TaxReturnResponseDto {
  @ApiProperty({ description: 'Tax return ID' })
  id: string;

  @ApiProperty({ description: 'Return period' })
  returnPeriod: string;

  @ApiProperty({ description: 'Return type', enum: ComplianceType })
  returnType: ComplianceType;

  @ApiProperty({ description: 'Tax type', enum: TaxType })
  taxType: TaxType;

  @ApiProperty({ description: 'Return status', enum: ReturnStatus })
  status: ReturnStatus;

  @ApiProperty({ description: 'Due date' })
  dueDate: Date;

  @ApiProperty({ description: 'Filed date' })
  filedDate: Date;

  @ApiProperty({ description: 'Total tax liability' })
  totalTaxLiability: number;

  @ApiProperty({ description: 'Total tax paid' })
  totalTaxPaid: number;

  @ApiProperty({ description: 'Balance amount' })
  balanceAmount: number;

  @ApiProperty({ description: 'Acknowledgment number' })
  acknowledgmentNumber: string;

  @ApiProperty({ description: 'Return data' })
  returnData: Record<string, any>;

  @ApiProperty({ description: 'Supporting documents', type: [String] })
  supportingDocuments: string[];

  @ApiProperty({ description: 'Notes' })
  notes: string;

  @ApiProperty({ description: 'Created at' })
  createdAt: Date;

  @ApiProperty({ description: 'Updated at' })
  updatedAt: Date;

  @ApiProperty({ description: 'Created by user ID' })
  createdBy: string;
}

export class TaxComplianceResponseDto {
  @ApiProperty({ description: 'Tax compliance ID' })
  id: string;

  @ApiProperty({ description: 'Compliance type', enum: ComplianceType })
  complianceType: ComplianceType;

  @ApiProperty({ description: 'Tax type', enum: TaxType })
  taxType: TaxType;

  @ApiProperty({ description: 'Compliance period' })
  compliancePeriod: string;

  @ApiProperty({ description: 'Compliance status', enum: ComplianceStatus })
  status: ComplianceStatus;

  @ApiProperty({ description: 'Due date' })
  dueDate: Date;

  @ApiProperty({ description: 'Completion date' })
  completionDate: Date;

  @ApiProperty({ description: 'Description' })
  description: string;

  @ApiProperty({ description: 'Required documents', type: [String] })
  requiredDocuments: string[];

  @ApiProperty({ description: 'Submitted documents', type: [String] })
  submittedDocuments: string[];

  @ApiProperty({ description: 'Penalty amount' })
  penaltyAmount: number;

  @ApiProperty({ description: 'Notes' })
  notes: string;

  @ApiProperty({ description: 'Additional metadata' })
  metadata: Record<string, any>;

  @ApiProperty({ description: 'Created at' })
  createdAt: Date;

  @ApiProperty({ description: 'Updated at' })
  updatedAt: Date;

  @ApiProperty({ description: 'Created by user ID' })
  createdBy: string;
}

export class BulkOperationResponseDto {
  @ApiProperty({ description: 'Operation ID' })
  operationId: string;

  @ApiProperty({ description: 'Operation type', enum: BulkOperationType })
  operation: BulkOperationType;

  @ApiProperty({ description: 'Total items processed' })
  totalItems: number;

  @ApiProperty({ description: 'Successful operations' })
  successCount: number;

  @ApiProperty({ description: 'Failed operations' })
  failureCount: number;

  @ApiProperty({ description: 'Operation results' })
  results: Array<{
    id: string;
    success: boolean;
    error?: string;
  }>;

  @ApiProperty({ description: 'Operation status' })
  status: string;

  @ApiProperty({ description: 'Started at' })
  startedAt: Date;

  @ApiProperty({ description: 'Completed at' })
  completedAt: Date;
}

export class TaxAnalyticsResponseDto {
  @ApiProperty({ description: 'Analysis period' })
  period: { startDate: string; endDate: string };

  @ApiProperty({ description: 'Total tax collected' })
  totalTaxCollected: number;

  @ApiProperty({ description: 'Total tax liability' })
  totalTaxLiability: number;

  @ApiProperty({ description: 'Tax by type breakdown' })
  taxByType: Record<string, number>;

  @ApiProperty({ description: 'Tax by state breakdown' })
  taxByState: Record<string, number>;

  @ApiProperty({ description: 'Monthly tax trends' })
  monthlyTrends: Array<{
    period: string;
    amount: number;
    type: string;
  }>;

  @ApiProperty({ description: 'Compliance rate percentage' })
  complianceRate: number;

  @ApiProperty({ description: 'Overdue returns count' })
  overdueReturns: number;

  @ApiProperty({ description: 'Pending calculations count' })
  pendingCalculations: number;

  @ApiProperty({ description: 'Period comparison data' })
  periodComparison?: {
    currentPeriod: number;
    previousPeriod: number;
    changePercentage: number;
  };
}

export class TaxSummaryResponseDto {
  @ApiProperty({ description: 'Current month tax liability' })
  currentMonthLiability: number;

  @ApiProperty({ description: 'Current month tax collected' })
  currentMonthCollected: number;

  @ApiProperty({ description: 'Pending returns count' })
  pendingReturns: number;

  @ApiProperty({ description: 'Overdue compliance items' })
  overdueCompliance: number;

  @ApiProperty({ description: 'Active tax rules count' })
  activeTaxRules: number;

  @ApiProperty({ description: 'Total tax rules count' })
  totalRules: number;

  @ApiProperty({ description: 'Recent calculations count' })
  recentCalculations: number;

  @ApiProperty({ description: 'Upcoming deadlines' })
  upcomingDeadlines: Array<{
    id: string;
    type: string;
    description: string;
    dueDate: Date;
    daysRemaining: number;
  }>;

  @ApiProperty({ description: 'Tax rate summary' })
  taxRateSummary: Array<{
    type: TaxType;
    averageRate: number;
    applicableRules: number;
  }>;
}

export class ExportResponseDto {
  @ApiProperty({ description: 'Export ID' })
  exportId: string;

  @ApiProperty({ description: 'Export status', enum: ExportStatus })
  status: ExportStatus;

  @ApiProperty({ description: 'Export format', enum: ExportFormat })
  format: ExportFormat;

  @ApiProperty({ description: 'Data type exported' })
  dataType: string;

  @ApiProperty({ description: 'Total records exported' })
  totalRecords: number;

  @ApiProperty({ description: 'File size in bytes' })
  fileSize: number;

  @ApiProperty({ description: 'Download URL' })
  downloadUrl: string;

  @ApiProperty({ description: 'Export started at' })
  startedAt: Date;

  @ApiProperty({ description: 'Export completed at' })
  completedAt: Date;

  @ApiProperty({ description: 'Export expires at' })
  expiresAt: Date;

  @ApiProperty({ description: 'Error message if failed' })
  errorMessage?: string;
}

export class TaxSettingsResponseDto {
  @ApiProperty({ description: 'Settings ID' })
  id: string;

  @ApiProperty({ description: 'Default tax type', enum: TaxType })
  defaultTaxType: TaxType;

  @ApiProperty({ description: 'Company GST number' })
  companyGstNumber: string;

  @ApiProperty({ description: 'Company PAN number' })
  companyPanNumber: string;

  @ApiProperty({ description: 'Default place of supply' })
  defaultPlaceOfSupply: string;

  @ApiProperty({ description: 'Auto-calculate taxes' })
  autoCalculateTaxes: boolean;

  @ApiProperty({ description: 'Send compliance reminders' })
  sendComplianceReminders: boolean;

  @ApiProperty({ description: 'Reminder days before due date' })
  reminderDays: number;

  @ApiProperty({ description: 'Additional settings' })
  additionalSettings: Record<string, any>;

  @ApiProperty({ description: 'Updated at' })
  updatedAt: Date;

  @ApiProperty({ description: 'Updated by user ID' })
  updatedBy: string;
}

// Aliases for backward compatibility
export {
  ExportResponseDto as TaxExportResponseDto,
  TaxComplianceResponseDto as UpcomingComplianceResponseDto,
};
