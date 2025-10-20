import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsHexColor,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Min,
} from 'class-validator';

export class RuleTemplatesDto {
  @ApiPropertyOptional({
    description: 'Pricing rule templates',
    example: {
      pricingModel: 'hourly',
      currency: 'USD',
      minimumRate: 25,
      maximumRate: 200,
    },
  })
  @IsOptional()
  @IsObject()
  pricing?: {
    pricingModel?: 'hourly' | 'daily' | 'monthly' | 'fixed' | 'custom';
    currency?: string;
    minimumRate?: number;
    maximumRate?: number;
    markup?: number;
  };

  @ApiPropertyOptional({
    description: 'Availability rule templates',
    example: {
      advanceBooking: 1,
      maxBookingDuration: 8,
      bufferTime: 30,
    },
  })
  @IsOptional()
  @IsObject()
  availability?: {
    advanceBooking?: number;
    maxBookingDuration?: number;
    bufferTime?: number;
  };

  @ApiPropertyOptional({
    description: 'Requirements rule templates',
    example: {
      verification: ['identity', 'skills'],
      minimumRating: 4.0,
    },
  })
  @IsOptional()
  @IsObject()
  requirements?: {
    verification?: string[];
    documents?: string[];
    minimumRating?: number;
    additionalRequirements?: string[];
  };

  @ApiPropertyOptional({
    description: 'Features rule templates',
    example: {
      allowInstantBooking: true,
      allowCancellation: true,
      cancellationPolicy: '24 hours notice required',
    },
  })
  @IsOptional()
  @IsObject()
  features?: {
    allowInstantBooking?: boolean;
    allowCancellation?: boolean;
    cancellationPolicy?: string;
    specialFeatures?: string[];
  };
}

export class CreatePartnerCategoryDto {
  @ApiProperty({
    description: 'Name of the partner category',
    example: 'Freelancers',
    maxLength: 100,
  })
  @IsString()
  @Length(1, 100)
  name: string;

  @ApiProperty({
    description: 'URL-friendly slug for the partner category',
    example: 'freelancers',
    maxLength: 100,
  })
  @IsString()
  @Length(1, 100)
  slug: string;

  @ApiPropertyOptional({
    description: 'Description of the partner category',
    example: 'Independent contractors and freelance professionals',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'Icon identifier for the partner category',
    example: 'user',
    maxLength: 50,
  })
  @IsOptional()
  @IsString()
  @Length(1, 50)
  icon?: string;

  @ApiPropertyOptional({
    description: 'Hex color code for the partner category',
    example: '#3B82F6',
  })
  @IsOptional()
  @IsHexColor()
  color?: string;

  @ApiPropertyOptional({
    description: 'Whether the partner category is active',
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean = true;

  @ApiPropertyOptional({
    description: 'Sort order for display purposes',
    example: 1,
    minimum: 0,
    default: 0,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number = 0;

  @ApiPropertyOptional({
    description: 'Whether this category requires a subcategory',
    example: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  requiresSubcategory?: boolean = false;

  @ApiProperty({
    description: 'ID of the parent partner type',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  partnerTypeId: string;

  @ApiPropertyOptional({
    description: 'Rule templates for this category',
    type: RuleTemplatesDto,
  })
  @IsOptional()
  @Type(() => RuleTemplatesDto)
  ruleTemplates?: RuleTemplatesDto;

  @ApiPropertyOptional({
    description: 'Additional metadata for the category',
    example: {
      tags: ['remote', 'flexible'],
      popularityScore: 85,
    },
  })
  @IsOptional()
  @IsObject()
  metadata?: any;

  @ApiPropertyOptional({
    description: 'Pricing rules configuration for this partner category',
    example: {
      baseCommissionRate: 0.12,
      minimumBookingValue: 30,
      cancellationPolicy: 'moderate',
    },
  })
  @IsOptional()
  @IsObject()
  pricingRules?: Record<string, any>;

  @ApiPropertyOptional({
    description: 'Feature rules configuration for this partner category',
    example: {
      allowInstantBooking: false,
      requireApproval: true,
      maxAdvanceBookingDays: 60,
    },
  })
  @IsOptional()
  @IsObject()
  featureRules?: Record<string, any>;

  @ApiPropertyOptional({
    description: 'Validation rules configuration for this partner category',
    example: {
      requiredDocuments: ['portfolio', 'references'],
      minimumRating: 3.5,
      verificationRequired: false,
    },
  })
  @IsOptional()
  @IsObject()
  validationRules?: Record<string, any>;
}
