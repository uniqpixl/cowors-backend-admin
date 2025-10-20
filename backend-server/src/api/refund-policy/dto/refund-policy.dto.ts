import {
  RefundCalculationType,
  RefundPolicyType,
  RefundTier,
} from '@/database/entities/refund-policy.entity';
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
  Max,
  Min,
  ValidateNested,
} from 'class-validator';

export class RefundTierDto implements RefundTier {
  @ApiProperty({ description: 'Hours before booking start time' })
  @IsNumber()
  @Min(0)
  hoursBeforeStart: number;

  @ApiProperty({ description: 'Refund percentage for this tier' })
  @IsNumber()
  @Min(0)
  @Max(100)
  refundPercentage: number;

  @ApiPropertyOptional({ description: 'Fixed fee for this tier' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  fixedFee?: number;

  @ApiPropertyOptional({ description: 'Description of this tier' })
  @IsOptional()
  @IsString()
  description?: string;
}

export class CreateRefundPolicyDto {
  @ApiProperty({ description: 'Name of the refund policy' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: 'Description of the refund policy' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Type of refund policy', enum: RefundPolicyType })
  @IsEnum(RefundPolicyType)
  type: RefundPolicyType;

  @ApiProperty({
    description: 'Calculation type for refunds',
    enum: RefundCalculationType,
  })
  @IsEnum(RefundCalculationType)
  calculationType: RefundCalculationType;

  @ApiPropertyOptional({ description: 'Whether this is the default policy' })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;

  @ApiProperty({ description: 'Minimum notice hours required for refund' })
  @IsNumber()
  @Min(0)
  minimumNoticeHours: number;

  @ApiProperty({
    description: 'Hours before booking when no refund is allowed',
  })
  @IsNumber()
  @Min(0)
  noRefundHours: number;

  @ApiProperty({ description: 'Default refund percentage' })
  @IsNumber()
  @Min(0)
  @Max(100)
  defaultRefundPercentage: number;

  @ApiPropertyOptional({ description: 'Fixed cancellation fee' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  fixedCancellationFee?: number;

  @ApiPropertyOptional({
    description: 'Refund tiers for tiered calculation',
    type: [RefundTierDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RefundTierDto)
  refundTiers?: RefundTierDto[];

  @ApiPropertyOptional({ description: 'Allow same day refunds' })
  @IsOptional()
  @IsBoolean()
  allowSameDayRefund?: boolean;

  @ApiPropertyOptional({ description: 'Allow partial refunds' })
  @IsOptional()
  @IsBoolean()
  allowPartialRefund?: boolean;

  @ApiPropertyOptional({ description: 'Require approval for refunds' })
  @IsOptional()
  @IsBoolean()
  requireApproval?: boolean;

  @ApiProperty({ description: 'Processing days for refund' })
  @IsNumber()
  @Min(1)
  processingDays: number;

  @ApiPropertyOptional({ description: 'Applicable space types' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  applicableSpaceTypes?: string[];

  @ApiPropertyOptional({ description: 'Excluded dates for policy' })
  @IsOptional()
  @IsArray()
  @IsDateString({}, { each: true })
  excludedDates?: string[];

  @ApiPropertyOptional({ description: 'Full refund for force majeure events' })
  @IsOptional()
  @IsBoolean()
  forceMajeureFullRefund?: boolean;

  @ApiPropertyOptional({ description: 'Terms and conditions' })
  @IsOptional()
  @IsString()
  terms?: string;

  @ApiPropertyOptional({ description: 'Additional metadata' })
  @IsOptional()
  metadata?: Record<string, any>;
}

export class UpdateRefundPolicyDto {
  @ApiPropertyOptional({ description: 'Name of the refund policy' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'Description of the refund policy' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'Type of refund policy',
    enum: RefundPolicyType,
  })
  @IsOptional()
  @IsEnum(RefundPolicyType)
  type?: RefundPolicyType;

  @ApiPropertyOptional({
    description: 'Calculation type for refunds',
    enum: RefundCalculationType,
  })
  @IsOptional()
  @IsEnum(RefundCalculationType)
  calculationType?: RefundCalculationType;

  @ApiPropertyOptional({ description: 'Whether this is the default policy' })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;

  @ApiPropertyOptional({ description: 'Whether the policy is active' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({
    description: 'Minimum notice hours required for refund',
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  minimumNoticeHours?: number;

  @ApiPropertyOptional({
    description: 'Hours before booking when no refund is allowed',
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  noRefundHours?: number;

  @ApiPropertyOptional({ description: 'Default refund percentage' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  defaultRefundPercentage?: number;

  @ApiPropertyOptional({ description: 'Fixed cancellation fee' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  fixedCancellationFee?: number;

  @ApiPropertyOptional({
    description: 'Refund tiers for tiered calculation',
    type: [RefundTierDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RefundTierDto)
  refundTiers?: RefundTierDto[];

  @ApiPropertyOptional({ description: 'Allow same day refunds' })
  @IsOptional()
  @IsBoolean()
  allowSameDayRefund?: boolean;

  @ApiPropertyOptional({ description: 'Allow partial refunds' })
  @IsOptional()
  @IsBoolean()
  allowPartialRefund?: boolean;

  @ApiPropertyOptional({ description: 'Require approval for refunds' })
  @IsOptional()
  @IsBoolean()
  requireApproval?: boolean;

  @ApiPropertyOptional({ description: 'Processing days for refund' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  processingDays?: number;

  @ApiPropertyOptional({ description: 'Applicable space types' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  applicableSpaceTypes?: string[];

  @ApiPropertyOptional({ description: 'Excluded dates for policy' })
  @IsOptional()
  @IsArray()
  @IsDateString({}, { each: true })
  excludedDates?: string[];

  @ApiPropertyOptional({ description: 'Full refund for force majeure events' })
  @IsOptional()
  @IsBoolean()
  forceMajeureFullRefund?: boolean;

  @ApiPropertyOptional({ description: 'Terms and conditions' })
  @IsOptional()
  @IsString()
  terms?: string;

  @ApiPropertyOptional({ description: 'Additional metadata' })
  @IsOptional()
  metadata?: Record<string, any>;
}

export class RefundCalculationDto {
  @ApiProperty({ description: 'Booking amount to calculate refund for' })
  @IsNumber()
  @Min(0)
  bookingAmount: number;

  @ApiProperty({ description: 'Booking start time' })
  @IsDateString()
  bookingStartTime: string;

  @ApiProperty({ description: 'Cancellation time' })
  @IsDateString()
  cancellationTime: string;

  @ApiProperty({ description: 'Partner ID' })
  @IsString()
  partnerId: string;

  @ApiPropertyOptional({ description: 'Space type' })
  @IsOptional()
  @IsString()
  spaceType?: string;

  @ApiPropertyOptional({ description: 'Is emergency cancellation' })
  @IsOptional()
  @IsBoolean()
  isEmergency?: boolean;
}
