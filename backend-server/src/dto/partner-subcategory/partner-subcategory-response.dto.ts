import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { PartnerCategoryResponseDto } from '../partner-category/partner-category-response.dto';

class PricingRuleOverrideResponseDto {
  @ApiPropertyOptional({ description: 'Base price override' })
  @Expose()
  basePrice?: number;

  @ApiPropertyOptional({ description: 'Currency code override' })
  @Expose()
  currency?: string;

  @ApiPropertyOptional({ description: 'Pricing model override' })
  @Expose()
  pricingModel?: 'hourly' | 'daily' | 'monthly' | 'fixed' | 'custom';

  @ApiPropertyOptional({ description: 'Markup percentage override' })
  @Expose()
  markup?: number;
}

class AvailabilityRuleOverrideResponseDto {
  @ApiPropertyOptional({ description: 'Advance booking time in days override' })
  @Expose()
  advanceBooking?: number;

  @ApiPropertyOptional({
    description: 'Maximum booking duration in hours override',
  })
  @Expose()
  maxBookingDuration?: number;

  @ApiPropertyOptional({
    description: 'Buffer time between bookings in minutes override',
  })
  @Expose()
  bufferTime?: number;
}

class RequirementsRuleOverrideResponseDto {
  @ApiPropertyOptional({
    description: 'Verification requirements override',
    type: [String],
  })
  @Expose()
  verification?: string[];

  @ApiPropertyOptional({
    description: 'Required documents override',
    type: [String],
  })
  @Expose()
  documents?: string[];

  @ApiPropertyOptional({ description: 'Minimum rating required override' })
  @Expose()
  minimumRating?: number;

  @ApiPropertyOptional({
    description: 'Additional requirements override',
    type: [String],
  })
  @Expose()
  additionalRequirements?: string[];
}

class FeaturesRuleOverrideResponseDto {
  @ApiPropertyOptional({ description: 'Allow instant booking override' })
  @Expose()
  allowInstantBooking?: boolean;

  @ApiPropertyOptional({ description: 'Allow cancellation override' })
  @Expose()
  allowCancellation?: boolean;

  @ApiPropertyOptional({ description: 'Cancellation policy override' })
  @Expose()
  cancellationPolicy?: string;

  @ApiPropertyOptional({
    description: 'Special features override',
    type: [String],
  })
  @Expose()
  specialFeatures?: string[];
}

class RuleOverridesResponseDto {
  @ApiPropertyOptional({
    description: 'Pricing rule overrides',
    type: PricingRuleOverrideResponseDto,
  })
  @Expose()
  @Type(() => PricingRuleOverrideResponseDto)
  pricing?: PricingRuleOverrideResponseDto;

  @ApiPropertyOptional({
    description: 'Availability rule overrides',
    type: AvailabilityRuleOverrideResponseDto,
  })
  @Expose()
  @Type(() => AvailabilityRuleOverrideResponseDto)
  availability?: AvailabilityRuleOverrideResponseDto;

  @ApiPropertyOptional({
    description: 'Requirements rule overrides',
    type: RequirementsRuleOverrideResponseDto,
  })
  @Expose()
  @Type(() => RequirementsRuleOverrideResponseDto)
  requirements?: RequirementsRuleOverrideResponseDto;

  @ApiPropertyOptional({
    description: 'Features rule overrides',
    type: FeaturesRuleOverrideResponseDto,
  })
  @Expose()
  @Type(() => FeaturesRuleOverrideResponseDto)
  features?: FeaturesRuleOverrideResponseDto;
}

export class PartnerSubcategoryResponseDto {
  @ApiProperty({ description: 'Subcategory ID' })
  @Expose()
  id: string;

  @ApiProperty({ description: 'Subcategory name' })
  @Expose()
  name: string;

  @ApiProperty({ description: 'URL-friendly slug' })
  @Expose()
  slug: string;

  @ApiPropertyOptional({ description: 'Subcategory description' })
  @Expose()
  description?: string;

  @ApiPropertyOptional({ description: 'Icon name or URL' })
  @Expose()
  icon?: string;

  @ApiPropertyOptional({ description: 'Color code for UI theming' })
  @Expose()
  color?: string;

  @ApiProperty({ description: 'Whether the subcategory is active' })
  @Expose()
  isActive: boolean;

  @ApiProperty({ description: 'Sort order for display' })
  @Expose()
  sortOrder: number;

  @ApiProperty({ description: 'Parent category ID' })
  @Expose()
  categoryId: string;

  @ApiPropertyOptional({
    description: 'Rule overrides for this subcategory',
    type: RuleOverridesResponseDto,
  })
  @Expose()
  @Type(() => RuleOverridesResponseDto)
  ruleOverrides?: RuleOverridesResponseDto;

  @ApiPropertyOptional({ description: 'Additional metadata' })
  @Expose()
  metadata?: Record<string, any>;

  @ApiProperty({ description: 'Creation timestamp' })
  @Expose()
  createdAt: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  @Expose()
  updatedAt: Date;

  // Optional relationship data
  @ApiPropertyOptional({
    description: 'Parent category details',
    type: PartnerCategoryResponseDto,
  })
  @Expose()
  @Type(() => PartnerCategoryResponseDto)
  category?: PartnerCategoryResponseDto;

  // Computed fields
  @ApiPropertyOptional({
    description: 'Number of offerings in this subcategory',
  })
  @Expose()
  offeringCount?: number;

  @ApiPropertyOptional({
    description: 'Pricing rules configuration for this partner subcategory',
    example: {
      baseCommissionRate: 0.1,
      minimumBookingValue: 25,
      cancellationPolicy: 'strict',
    },
  })
  @Expose()
  pricingRules?: Record<string, any>;

  @ApiPropertyOptional({
    description: 'Feature rules configuration for this partner subcategory',
    example: {
      allowInstantBooking: true,
      requireApproval: false,
      maxAdvanceBookingDays: 30,
    },
  })
  @Expose()
  featureRules?: Record<string, any>;

  @ApiPropertyOptional({
    description: 'Validation rules configuration for this partner subcategory',
    example: {
      requiredDocuments: ['certification'],
      minimumRating: 4.5,
      verificationRequired: true,
    },
  })
  @Expose()
  validationRules?: Record<string, any>;
}
