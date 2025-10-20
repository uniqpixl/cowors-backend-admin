import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';
import {
  FraudAlertSeverity,
  FraudAlertStatus,
  FraudAlertType,
} from '../entities/fraud-alert.entity';

export class CreateFraudAlertDto {
  // @ApiPropertyOptional({
  //   description: 'User ID associated with the fraud alert',
  // })
  @IsOptional()
  @IsUUID()
  userId?: string;

  // @ApiPropertyOptional({
  //   description: 'Booking ID associated with the fraud alert',
  // })
  @IsOptional()
  @IsUUID()
  bookingId?: string;

  // @ApiPropertyOptional({
  //   description: 'Payment ID associated with the fraud alert',
  // })
  @IsOptional()
  @IsUUID()
  paymentId?: string;

  // @ApiProperty({ enum: FraudAlertType, description: 'Type of fraud alert' })
  @IsEnum(FraudAlertType)
  type: FraudAlertType;

  // @ApiProperty({
  //   enum: FraudAlertSeverity,
  //   description: 'Severity level of the fraud alert',
  // })
  @IsEnum(FraudAlertSeverity)
  severity: FraudAlertSeverity;

  // @ApiProperty({ description: 'Title of the fraud alert' })
  @IsString()
  title: string;

  // @ApiProperty({ description: 'Detailed description of the fraud alert' })
  @IsString()
  description: string;

  // @ApiProperty({ description: 'Additional metadata for the fraud alert' })
  @IsObject()
  metadata: Record<string, any>;

  // @ApiProperty({ description: 'Risk score (0-100)', minimum: 0, maximum: 100 })
  @IsNumber()
  @Min(0)
  @Max(100)
  riskScore: number;

  // @ApiPropertyOptional({ description: 'Array of fraud flags', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  flags?: string[];

  // @ApiPropertyOptional({
  //   description: 'IP address where the fraud was detected',
  // })
  @IsOptional()
  @IsString()
  ipAddress?: string;

  // @ApiPropertyOptional({ description: 'User agent string' })
  @IsOptional()
  @IsString()
  userAgent?: string;

  // @ApiPropertyOptional({ description: 'Location information' })
  @IsOptional()
  @IsObject()
  location?: Record<string, any>;

  // @ApiPropertyOptional({ description: 'External reference ID' })
  @IsOptional()
  @IsString()
  externalReferenceId?: string;
}

export class UpdateFraudAlertDto {
  // @ApiPropertyOptional({
  //   enum: FraudAlertStatus,
  //   description: 'Status of the fraud alert',
  // })
  @IsOptional()
  @IsEnum(FraudAlertStatus)
  status?: FraudAlertStatus;

  // @ApiPropertyOptional({ description: 'User ID to assign the alert to' })
  @IsOptional()
  @IsUUID()
  assignedTo?: string;

  // @ApiPropertyOptional({ description: 'Resolution notes' })
  @IsOptional()
  @IsString()
  resolution?: string;

  // @ApiPropertyOptional({ description: 'Archive the alert' })
  @IsOptional()
  @IsBoolean()
  isArchived?: boolean;
}

export class FraudAlertQueryDto {
  // @ApiPropertyOptional({ description: 'Filter by user ID' })
  @IsOptional()
  @IsUUID()
  userId?: string;

  // @ApiPropertyOptional({
  //   enum: FraudAlertType,
  //   description: 'Filter by alert type',
  // })
  @IsOptional()
  @IsEnum(FraudAlertType)
  type?: FraudAlertType;

  // @ApiPropertyOptional({
  //   enum: FraudAlertSeverity,
  //   description: 'Filter by severity',
  // })
  @IsOptional()
  @IsEnum(FraudAlertSeverity)
  severity?: FraudAlertSeverity;

  // @ApiPropertyOptional({
  //   enum: FraudAlertStatus,
  //   description: 'Filter by status',
  // })
  @IsOptional()
  @IsEnum(FraudAlertStatus)
  status?: FraudAlertStatus;

  // @ApiPropertyOptional({ description: 'Filter by assigned user ID' })
  @IsOptional()
  @IsUUID()
  assignedTo?: string;

  // @ApiPropertyOptional({ description: 'Minimum risk score' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  minRiskScore?: number;

  // @ApiPropertyOptional({ description: 'Maximum risk score' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  maxRiskScore?: number;

  // @ApiPropertyOptional({ description: 'Include archived alerts' })
  @IsOptional()
  @IsBoolean()
  includeArchived?: boolean;

  // @ApiPropertyOptional({
  //   description: 'Page number for pagination',
  //   default: 1,
  // })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  page?: number = 1;

  // @ApiPropertyOptional({ description: 'Number of items per page', default: 20 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  limit?: number = 20;

  // @ApiPropertyOptional({ description: 'Sort field', default: 'createdAt' })
  @IsOptional()
  @IsString()
  sortBy?: string = 'createdAt';

  // @ApiPropertyOptional({
  //   description: 'Sort order',
  //   enum: ['asc', 'desc'],
  //   default: 'desc',
  // })
  @IsOptional()
  @IsEnum(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc' = 'desc';

  // @ApiPropertyOptional({ description: 'Start date for filtering' })
  @IsOptional()
  startDate?: Date;

  // @ApiPropertyOptional({ description: 'End date for filtering' })
  @IsOptional()
  endDate?: Date;
}

export class AddActionDto {
  // @ApiProperty({ description: 'Action taken' })
  @IsString()
  action: string;

  // @ApiPropertyOptional({ description: 'Additional notes' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class FraudAlertStatsDto {
  // @ApiPropertyOptional({ description: 'Start date for stats' })
  @IsOptional()
  startDate?: Date;

  // @ApiPropertyOptional({ description: 'End date for stats' })
  @IsOptional()
  endDate?: Date;

  // @ApiPropertyOptional({
  //   enum: FraudAlertType,
  //   description: 'Filter by alert type',
  // })
  @IsOptional()
  @IsEnum(FraudAlertType)
  type?: FraudAlertType;
}
