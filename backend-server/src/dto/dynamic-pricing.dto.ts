import {
  DayOfWeek,
  PricingRuleType,
} from '@/database/entities/dynamic-pricing.entity';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';

export class PeakHoursDto {
  @ApiProperty({ example: '09:00' })
  @IsString()
  startTime: string;

  @ApiProperty({ example: '17:00' })
  @IsString()
  endTime: string;

  @ApiProperty({ enum: DayOfWeek, isArray: true })
  @IsArray()
  @IsEnum(DayOfWeek, { each: true })
  daysOfWeek: DayOfWeek[];
}

export class DateRangeDto {
  @ApiProperty({ example: '2024-12-01' })
  @IsDateString()
  startDate: string;

  @ApiProperty({ example: '2024-12-31' })
  @IsDateString()
  endDate: string;

  @ApiPropertyOptional({ example: 'Holiday season' })
  @IsOptional()
  @IsString()
  description?: string;
}

export class DemandThresholdDto {
  @ApiProperty({ example: 80, minimum: 0, maximum: 100 })
  @IsNumber()
  @Min(0)
  @Max(100)
  occupancyPercentage: number;

  @ApiProperty({ example: 1.2 })
  @IsNumber()
  @Min(0.1)
  @Max(10)
  multiplier: number;
}

export class DurationThresholdDto {
  @ApiProperty({ example: 4 })
  @IsNumber()
  @Min(1)
  minHours: number;

  @ApiPropertyOptional({ example: 24 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  maxHours?: number;

  @ApiProperty({ example: 0.9 })
  @IsNumber()
  @Min(0.1)
  @Max(10)
  multiplier: number;
}

export class SpecialConditionDto {
  @ApiProperty({ example: 'booking_count' })
  @IsString()
  condition: string;

  @ApiProperty({ example: 5 })
  value: any;
}

export class PricingConditionsDto {
  @ApiPropertyOptional({ type: [PeakHoursDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PeakHoursDto)
  peakHours?: PeakHoursDto[];

  @ApiPropertyOptional({ type: [DateRangeDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DateRangeDto)
  dateRanges?: DateRangeDto[];

  @ApiPropertyOptional({ type: [DemandThresholdDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DemandThresholdDto)
  demandThresholds?: DemandThresholdDto[];

  @ApiPropertyOptional({ example: 2 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  minAdvanceHours?: number;

  @ApiPropertyOptional({ example: 30 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  maxAdvanceDays?: number;

  @ApiPropertyOptional({ type: [DurationThresholdDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DurationThresholdDto)
  durationThresholds?: DurationThresholdDto[];

  @ApiPropertyOptional({ type: [SpecialConditionDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SpecialConditionDto)
  specialConditions?: SpecialConditionDto[];
}

export class CreatePricingRuleDto {
  @ApiProperty({ example: 'Peak Hours Pricing' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: 'Higher pricing during peak business hours' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ enum: PricingRuleType })
  @IsEnum(PricingRuleType)
  ruleType: PricingRuleType;

  @ApiProperty({ example: 1.5, minimum: 0.1, maximum: 10 })
  @IsNumber()
  @Min(0.1)
  @Max(10)
  multiplier: number;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ example: 1, minimum: 0, maximum: 100 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  priority?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  validFrom?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  validUntil?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  spaceId?: string;

  @ApiProperty({ type: PricingConditionsDto })
  @ValidateNested()
  @Type(() => PricingConditionsDto)
  conditions: PricingConditionsDto;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  metadata?: {
    notes?: string;
    tags?: string[];
    approvalRequired?: boolean;
  };
}

export class UpdatePricingRuleDto {
  @ApiPropertyOptional({ example: 'Updated Peak Hours Pricing' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: 'Updated description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 1.3, minimum: 0.1, maximum: 10 })
  @IsOptional()
  @IsNumber()
  @Min(0.1)
  @Max(10)
  multiplier?: number;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ example: 2, minimum: 0, maximum: 100 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  priority?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  validFrom?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  validUntil?: string;

  @ApiPropertyOptional({ type: PricingConditionsDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => PricingConditionsDto)
  conditions?: PricingConditionsDto;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  metadata?: {
    notes?: string;
    tags?: string[];
    lastModifiedBy?: string;
  };
}

export class PricingCalculationRequestDto {
  @ApiProperty({ example: 'space-uuid' })
  @IsString()
  spaceId: string;

  @ApiProperty({ example: '2024-01-15T09:00:00Z' })
  @IsDateString()
  startDateTime: string;

  @ApiProperty({ example: '2024-01-15T17:00:00Z' })
  @IsDateString()
  endDateTime: string;

  @ApiPropertyOptional({ example: 100 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  basePrice?: number;

  @ApiProperty({ example: 8, description: 'Booking duration in hours' })
  @IsNumber()
  @Min(0.5)
  bookingDuration: number;
}

export class AppliedRuleDto {
  @ApiProperty()
  ruleId: string;

  @ApiProperty()
  ruleName: string;

  @ApiProperty({ enum: PricingRuleType })
  ruleType: PricingRuleType;

  @ApiProperty()
  multiplier: number;

  @ApiProperty()
  priceImpact: number;

  @ApiPropertyOptional()
  description?: string;
}

export class PricingBreakdownDto {
  @ApiProperty()
  basePrice: number;

  @ApiPropertyOptional()
  peakHoursSurcharge?: number;

  @ApiPropertyOptional()
  seasonalAdjustment?: number;

  @ApiPropertyOptional()
  demandSurcharge?: number;

  @ApiPropertyOptional()
  bulkDiscount?: number;

  @ApiPropertyOptional()
  specialEventSurcharge?: number;
}

export class PricingCalculationResponseDto {
  @ApiProperty()
  originalPrice: number;

  @ApiProperty()
  finalPrice: number;

  @ApiProperty()
  totalDiscount: number;

  @ApiProperty()
  totalSurcharge: number;

  @ApiProperty({ type: [AppliedRuleDto] })
  appliedRules: AppliedRuleDto[];

  @ApiProperty({ type: PricingBreakdownDto })
  breakdown: PricingBreakdownDto;
}

export class PricingRuleResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  partnerId: string;

  @ApiPropertyOptional()
  spaceId?: string;

  @ApiProperty()
  name: string;

  @ApiPropertyOptional()
  description?: string;

  @ApiProperty({ enum: PricingRuleType })
  ruleType: PricingRuleType;

  @ApiProperty()
  multiplier: number;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty()
  priority: number;

  @ApiPropertyOptional()
  validFrom?: Date;

  @ApiPropertyOptional()
  validUntil?: Date;

  @ApiProperty()
  conditions: PricingConditionsDto;

  @ApiPropertyOptional()
  metadata?: any;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
