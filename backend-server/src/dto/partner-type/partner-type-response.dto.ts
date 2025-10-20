import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class PartnerTypeResponseDto {
  @ApiProperty({
    description: 'Unique identifier for the partner type',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @Expose()
  id: string;

  @ApiProperty({
    description: 'Name of the partner type',
    example: 'Professional Services',
  })
  @Expose()
  name: string;

  @ApiProperty({
    description: 'URL-friendly slug for the partner type',
    example: 'professional-services',
  })
  @Expose()
  slug: string;

  @ApiPropertyOptional({
    description: 'Description of the partner type',
    example: 'Freelancers, consultants, and professional service providers',
  })
  @Expose()
  description?: string;

  @ApiPropertyOptional({
    description: 'Icon identifier for the partner type',
    example: 'briefcase',
  })
  @Expose()
  icon?: string;

  @ApiPropertyOptional({
    description: 'Hex color code for the partner type',
    example: '#3B82F6',
  })
  @Expose()
  color?: string;

  @ApiProperty({
    description: 'Whether the partner type is active',
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
    description: 'Number of categories in this partner type',
    example: 5,
  })
  @Expose()
  categoryCount?: number;

  @ApiPropertyOptional({
    description: 'Number of active partners of this type',
    example: 25,
  })
  @Expose()
  partnerCount?: number;

  @ApiPropertyOptional({
    description: 'Pricing rules configuration for this partner type',
    example: {
      baseCommissionRate: 0.15,
      minimumBookingValue: 50,
      cancellationPolicy: 'flexible',
    },
  })
  @Expose()
  pricingRules?: Record<string, any>;

  @ApiPropertyOptional({
    description: 'Feature rules configuration for this partner type',
    example: {
      allowInstantBooking: true,
      requireApproval: false,
      maxAdvanceBookingDays: 90,
    },
  })
  @Expose()
  featureRules?: Record<string, any>;

  @ApiPropertyOptional({
    description: 'Validation rules configuration for this partner type',
    example: {
      requiredDocuments: ['business_license'],
      minimumRating: 4.0,
      verificationRequired: true,
    },
  })
  @Expose()
  validationRules?: Record<string, any>;
}
