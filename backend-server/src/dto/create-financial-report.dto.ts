import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

import {
  ReportFormat,
  ReportType,
} from '../database/entities/financial-report.entity';

export class CreateFinancialReportDto {
  @ApiProperty({
    description: 'Report title',
    example: 'Monthly Revenue Report - January 2024',
  })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({
    description: 'Type of financial report',
    enum: ReportType,
    example: ReportType.REVENUE,
  })
  @IsEnum(ReportType)
  reportType: ReportType;

  @ApiProperty({
    description: 'Report output format',
    enum: ReportFormat,
    example: ReportFormat.PDF,
  })
  @IsEnum(ReportFormat)
  reportFormat: ReportFormat;

  @ApiProperty({
    description: 'Start date of the report period',
    example: '2024-01-01',
  })
  @IsDateString()
  periodStart: string;

  @ApiProperty({
    description: 'End date of the report period',
    example: '2024-01-31',
  })
  @IsDateString()
  periodEnd: string;

  @ApiProperty({
    description: 'Report filters and parameters',
    example: {
      partnerIds: ['123e4567-e89b-12d3-a456-426614174000'],
      spaceTypes: [
        'cafe',
        'restobar',
        'coworking_space',
        'office_space',
        'event_space',
      ],
      minAmount: 100,
      maxAmount: 5000,
    },
    required: false,
  })
  @IsOptional()
  @IsObject()
  filters?: {
    partnerIds?: string[];
    spaceTypes?: string[];
    bookingStatuses?: string[];
    paymentMethods?: string[];
    minAmount?: number;
    maxAmount?: number;
    [key: string]: any;
  };
}

export class ReportFiltersDto {
  @ApiProperty({
    description: 'Filter by specific partner IDs',
    example: ['123e4567-e89b-12d3-a456-426614174000'],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  partnerIds?: string[];

  @ApiProperty({
    description: 'Filter by space types',
    example: [
      'cafe',
      'restobar',
      'coworking_space',
      'office_space',
      'event_space',
    ],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  spaceTypes?: string[];

  @ApiProperty({
    description: 'Filter by booking statuses',
    example: ['confirmed', 'completed'],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  bookingStatuses?: string[];

  @ApiProperty({
    description: 'Filter by payment methods',
    example: ['stripe', 'razorpay'],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  paymentMethods?: string[];

  @ApiProperty({
    description: 'Minimum amount filter',
    example: 100,
    minimum: 0,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  minAmount?: number;

  @ApiProperty({
    description: 'Maximum amount filter',
    example: 5000,
    minimum: 0,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  maxAmount?: number;
}
