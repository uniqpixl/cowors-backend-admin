import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  Length,
  Max,
  Min,
} from 'class-validator';

export class CreatePartnerAddonDto {
  @ApiProperty({
    description: 'Name of the addon',
    example: 'Express Delivery',
    maxLength: 100,
  })
  @IsString()
  @Length(1, 100)
  name: string;

  @ApiPropertyOptional({
    description: 'URL-friendly slug (auto-generated if not provided)',
    example: 'express-delivery',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @Length(1, 100)
  slug?: string;

  @ApiPropertyOptional({
    description: 'Description of the addon',
    example: 'Get your order delivered within 2 hours',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @Length(0, 500)
  description?: string;

  @ApiProperty({
    description: 'Price of the addon',
    example: 15.99,
    minimum: 0,
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  price: number;

  @ApiPropertyOptional({
    description: 'Currency code',
    example: 'USD',
    maxLength: 3,
  })
  @IsOptional()
  @IsString()
  @Length(3, 3)
  currency?: string;

  @ApiPropertyOptional({
    description: 'Whether the addon is currently active',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({
    description: 'Whether the addon is required for the offering',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  isRequired?: boolean;

  @ApiPropertyOptional({
    description: 'Sort order for display',
    example: 1,
    minimum: 0,
    maximum: 9999,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(9999)
  sortOrder?: number;

  @ApiProperty({
    description: 'ID of the partner offering this addon belongs to',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsString()
  offeringId: string;

  @ApiPropertyOptional({
    description: 'ID of the category this addon belongs to',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsString()
  categoryId?: string;

  @ApiPropertyOptional({
    description: 'Type of addon',
    example: 'equipment',
    maxLength: 50,
  })
  @IsOptional()
  @IsString()
  @Length(1, 50)
  addonType?: string;

  @ApiPropertyOptional({
    description: 'Pricing model for the addon',
    example: 'fixed',
    maxLength: 50,
  })
  @IsOptional()
  @IsString()
  @Length(1, 50)
  pricingModel?: string;

  @ApiPropertyOptional({
    description: 'Availability rules for the addon',
    example: {
      timeSlots: [
        {
          start: '09:00',
          end: '17:00',
          daysOfWeek: [1, 2, 3, 4, 5],
        },
      ],
      blackoutDates: ['2024-12-25'],
      advanceBookingDays: 7,
    },
  })
  @IsOptional()
  @IsObject()
  availabilityRules?: {
    timeSlots?: {
      start: string;
      end: string;
      daysOfWeek: number[];
    }[];
    blackoutDates?: string[];
    advanceBookingDays?: number;
    maxBookingDuration?: number;
    seasonalAvailability?: {
      startDate: string;
      endDate: string;
      isAvailable: boolean;
    }[];
  };

  @ApiPropertyOptional({
    description: 'Additional metadata as JSON object',
    example: {
      deliveryTime: '2 hours',
      availability: 'weekdays only',
      restrictions: ['urban areas only'],
    },
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}
