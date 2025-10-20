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
  Length,
  Matches,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';

class PricingRuleOverrideDto {
  @ApiPropertyOptional({ description: 'Base price override' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  basePrice?: number;

  @ApiPropertyOptional({ description: 'Currency override', example: 'USD' })
  @IsOptional()
  @IsString()
  @Length(3, 3)
  currency?: string;

  @ApiPropertyOptional({
    description: 'Pricing model override',
    enum: ['hourly', 'daily', 'monthly', 'fixed', 'custom'],
  })
  @IsOptional()
  @IsEnum(['hourly', 'daily', 'monthly', 'fixed', 'custom'])
  pricingModel?: 'hourly' | 'daily' | 'monthly' | 'fixed' | 'custom';

  @ApiPropertyOptional({ description: 'Markup percentage override' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1000)
  markup?: number;
}

class AvailabilityRuleOverrideDto {
  @ApiPropertyOptional({ description: 'Advance booking time in days override' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  advanceBooking?: number;

  @ApiPropertyOptional({
    description: 'Maximum booking duration in hours override',
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  maxBookingDuration?: number;

  @ApiPropertyOptional({
    description: 'Buffer time between bookings in minutes override',
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  bufferTime?: number;
}

class RequirementsRuleOverrideDto {
  @ApiPropertyOptional({
    description: 'Required verification types override',
    type: [String],
  })
  @IsOptional()
  @IsString({ each: true })
  verification?: string[];

  @ApiPropertyOptional({
    description: 'Required documents override',
    type: [String],
  })
  @IsOptional()
  @IsString({ each: true })
  documents?: string[];

  @ApiPropertyOptional({ description: 'Minimum rating required override' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(5)
  minimumRating?: number;

  @ApiPropertyOptional({
    description: 'Additional requirements override',
    type: [String],
  })
  @IsOptional()
  @IsString({ each: true })
  additionalRequirements?: string[];
}

class FeaturesRuleOverrideDto {
  @ApiPropertyOptional({ description: 'Allow instant booking override' })
  @IsOptional()
  @IsBoolean()
  allowInstantBooking?: boolean;

  @ApiPropertyOptional({ description: 'Allow cancellation override' })
  @IsOptional()
  @IsBoolean()
  allowCancellation?: boolean;

  @ApiPropertyOptional({ description: 'Cancellation policy override' })
  @IsOptional()
  @IsString()
  cancellationPolicy?: string;

  @ApiPropertyOptional({
    description: 'Special features override',
    type: [String],
  })
  @IsOptional()
  @IsString({ each: true })
  specialFeatures?: string[];
}

class RuleOverridesDto {
  @ApiPropertyOptional({
    description: 'Pricing rule overrides',
    type: PricingRuleOverrideDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => PricingRuleOverrideDto)
  pricing?: PricingRuleOverrideDto;

  @ApiPropertyOptional({
    description: 'Availability rule overrides',
    type: AvailabilityRuleOverrideDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => AvailabilityRuleOverrideDto)
  availability?: AvailabilityRuleOverrideDto;

  @ApiPropertyOptional({
    description: 'Requirements rule overrides',
    type: RequirementsRuleOverrideDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => RequirementsRuleOverrideDto)
  requirements?: RequirementsRuleOverrideDto;

  @ApiPropertyOptional({
    description: 'Features rule overrides',
    type: FeaturesRuleOverrideDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => FeaturesRuleOverrideDto)
  features?: FeaturesRuleOverrideDto;
}

export class CreatePartnerSubcategoryDto {
  @ApiProperty({
    description: 'Subcategory name',
    example: 'Residential Cleaning',
  })
  @IsString()
  @Length(1, 100)
  name: string;

  @ApiProperty({
    description: 'URL-friendly slug (auto-generated if not provided)',
    example: 'residential-cleaning',
  })
  @IsOptional()
  @IsString()
  @Length(1, 100)
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'Slug must be lowercase alphanumeric with hyphens only',
  })
  slug?: string;

  @ApiPropertyOptional({ description: 'Subcategory description' })
  @IsOptional()
  @IsString()
  @Length(0, 500)
  description?: string;

  @ApiPropertyOptional({ description: 'Icon name or URL' })
  @IsOptional()
  @IsString()
  @Length(0, 255)
  icon?: string;

  @ApiPropertyOptional({
    description: 'Color code for UI theming',
    example: '#3B82F6',
  })
  @IsOptional()
  @IsString()
  @Matches(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, {
    message: 'Color must be a valid hex color code',
  })
  color?: string;

  @ApiPropertyOptional({
    description: 'Whether the subcategory is active',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean = true;

  @ApiPropertyOptional({ description: 'Sort order for display', default: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  sortOrder?: number = 0;

  @ApiProperty({ description: 'Parent category ID' })
  @IsUUID()
  partnerCategoryId: string;

  @ApiPropertyOptional({
    description: 'Rule overrides for this subcategory',
    type: RuleOverridesDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => RuleOverridesDto)
  ruleOverrides?: RuleOverridesDto;

  @ApiPropertyOptional({ description: 'Additional metadata as JSON object' })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;

  @ApiPropertyOptional({
    description: 'Pricing rules configuration for this partner subcategory',
    example: {
      baseCommissionRate: 0.1,
      minimumBookingValue: 25,
      cancellationPolicy: 'strict',
    },
  })
  @IsOptional()
  @IsObject()
  pricingRules?: Record<string, any>;

  @ApiPropertyOptional({
    description: 'Feature rules configuration for this partner subcategory',
    example: {
      allowInstantBooking: true,
      requireApproval: false,
      maxAdvanceBookingDays: 30,
    },
  })
  @IsOptional()
  @IsObject()
  featureRules?: Record<string, any>;

  @ApiPropertyOptional({
    description: 'Validation rules configuration for this partner subcategory',
    example: {
      requiredDocuments: ['certification'],
      minimumRating: 4.5,
      verificationRequired: true,
    },
  })
  @IsOptional()
  @IsObject()
  validationRules?: Record<string, any>;
}
