import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { PartnerTypeResponseDto } from '../partner-type/partner-type-response.dto';

export class PartnerCategoryResponseDto {
  @ApiProperty({
    description: 'Unique identifier for the partner category',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @Expose()
  id: string;

  @ApiProperty({
    description: 'Name of the partner category',
    example: 'Freelancers',
  })
  @Expose()
  name: string;

  @ApiProperty({
    description: 'URL-friendly slug for the partner category',
    example: 'freelancers',
  })
  @Expose()
  slug: string;

  @ApiPropertyOptional({
    description: 'Description of the partner category',
    example: 'Independent contractors and freelance professionals',
  })
  @Expose()
  description?: string;

  @ApiPropertyOptional({
    description: 'Icon identifier for the partner category',
    example: 'user',
  })
  @Expose()
  icon?: string;

  @ApiPropertyOptional({
    description: 'Hex color code for the partner category',
    example: '#3B82F6',
  })
  @Expose()
  color?: string;

  @ApiProperty({
    description: 'Whether the partner category is active',
    example: true,
  })
  @Expose()
  isActive: boolean;

  @ApiProperty({
    description: 'Sort order for display purposes',
    example: 1,
  })
  @Expose()
  sortOrder: number;

  @ApiProperty({
    description: 'Whether this category requires a subcategory',
    example: false,
  })
  @Expose()
  requiresSubcategory: boolean;

  @ApiProperty({
    description: 'ID of the parent partner type',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @Expose()
  partnerTypeId: string;

  @ApiPropertyOptional({
    description: 'Rule templates for this category',
    example: {
      pricing: {
        pricingModel: 'hourly',
        currency: 'USD',
      },
      availability: {
        advanceBooking: 1,
        maxBookingDuration: 8,
      },
    },
  })
  @Expose()
  ruleTemplates?: any;

  @ApiPropertyOptional({
    description: 'Additional metadata for the category',
    example: {
      tags: ['remote', 'flexible'],
      popularityScore: 85,
    },
  })
  @Expose()
  metadata?: any;

  @ApiProperty({
    description: 'Creation timestamp',
    example: '2024-01-15T10:30:00Z',
  })
  @Expose()
  createdAt: Date;

  @ApiProperty({
    description: 'Last update timestamp',
    example: '2024-01-15T10:30:00Z',
  })
  @Expose()
  updatedAt: Date;

  @ApiPropertyOptional({
    description: 'Parent partner type information',
    type: PartnerTypeResponseDto,
  })
  @Expose()
  @Type(() => PartnerTypeResponseDto)
  partnerType?: PartnerTypeResponseDto;

  @ApiPropertyOptional({
    description: 'Number of subcategories in this category',
    example: 3,
  })
  @Expose()
  subcategoryCount?: number;

  @ApiPropertyOptional({
    description: 'Number of active offerings in this category',
    example: 15,
  })
  @Expose()
  offeringCount?: number;

  @ApiPropertyOptional({
    description: 'Pricing rules configuration for this partner category',
    example: {
      baseCommissionRate: 0.12,
      minimumBookingValue: 30,
      cancellationPolicy: 'moderate',
    },
  })
  @Expose()
  pricingRules?: Record<string, any>;

  @ApiPropertyOptional({
    description: 'Feature rules configuration for this partner category',
    example: {
      allowInstantBooking: false,
      requireApproval: true,
      maxAdvanceBookingDays: 60,
    },
  })
  @Expose()
  featureRules?: Record<string, any>;

  @ApiPropertyOptional({
    description: 'Validation rules configuration for this partner category',
    example: {
      requiredDocuments: ['portfolio', 'references'],
      minimumRating: 3.5,
      verificationRequired: false,
    },
  })
  @Expose()
  validationRules?: Record<string, any>;
}
