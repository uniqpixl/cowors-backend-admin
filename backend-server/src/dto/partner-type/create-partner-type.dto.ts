import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsHexColor,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  Length,
  Min,
} from 'class-validator';

export class CreatePartnerTypeDto {
  @ApiProperty({
    description: 'Name of the partner type',
    example: 'Professional Services',
    maxLength: 100,
  })
  @IsString()
  @Length(1, 100)
  name: string;

  @ApiProperty({
    description: 'URL-friendly slug for the partner type',
    example: 'professional-services',
    maxLength: 100,
  })
  @IsString()
  @Length(1, 100)
  slug: string;

  @ApiPropertyOptional({
    description: 'Description of the partner type',
    example: 'Freelancers, consultants, and professional service providers',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'Icon identifier for the partner type',
    example: 'briefcase',
    maxLength: 50,
  })
  @IsOptional()
  @IsString()
  @Length(1, 50)
  icon?: string;

  @ApiPropertyOptional({
    description: 'Hex color code for the partner type',
    example: '#3B82F6',
  })
  @IsOptional()
  @IsHexColor()
  color?: string;

  @ApiPropertyOptional({
    description: 'Whether the partner type is active',
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
    description: 'Pricing rules configuration for this partner type',
    example: {
      baseCommissionRate: 0.15,
      minimumBookingValue: 50,
      cancellationPolicy: 'flexible',
    },
  })
  @IsOptional()
  @IsObject()
  pricingRules?: Record<string, any>;

  @ApiPropertyOptional({
    description: 'Feature rules configuration for this partner type',
    example: {
      allowInstantBooking: true,
      requireApproval: false,
      maxAdvanceBookingDays: 90,
    },
  })
  @IsOptional()
  @IsObject()
  featureRules?: Record<string, any>;

  @ApiPropertyOptional({
    description: 'Validation rules configuration for this partner type',
    example: {
      requiredDocuments: ['business_license'],
      minimumRating: 4.0,
      verificationRequired: true,
    },
  })
  @IsOptional()
  @IsObject()
  validationRules?: Record<string, any>;
}
