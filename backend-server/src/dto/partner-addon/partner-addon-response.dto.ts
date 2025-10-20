import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class PartnerAddonResponseDto {
  @ApiProperty({
    description: 'Unique identifier for the addon',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @Expose()
  id: string;

  @ApiProperty({
    description: 'Name of the addon',
    example: 'Express Delivery',
  })
  @Expose()
  name: string;

  @ApiProperty({
    description: 'URL-friendly slug',
    example: 'express-delivery',
  })
  @Expose()
  slug: string;

  @ApiPropertyOptional({
    description: 'Description of the addon',
    example: 'Get your order delivered within 2 hours',
  })
  @Expose()
  description?: string;

  @ApiProperty({
    description: 'Price of the addon',
    example: 15.99,
  })
  @Expose()
  price: number;

  @ApiProperty({
    description: 'Currency code',
    example: 'USD',
  })
  @Expose()
  currency: string;

  @ApiProperty({
    description: 'Whether the addon is currently active',
    example: true,
  })
  @Expose()
  isActive: boolean;

  @ApiProperty({
    description: 'Whether the addon is required for the offering',
    example: false,
  })
  @Expose()
  isRequired: boolean;

  @ApiProperty({
    description: 'Sort order for display',
    example: 1,
  })
  @Expose()
  sortOrder: number;

  @ApiProperty({
    description: 'ID of the partner offering this addon belongs to',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @Expose()
  offeringId: string;

  @ApiPropertyOptional({
    description: 'Additional metadata as JSON object',
    example: {
      deliveryTime: '2 hours',
      availability: 'weekdays only',
      restrictions: ['urban areas only'],
    },
  })
  @Expose()
  metadata?: Record<string, any>;

  @ApiProperty({ description: 'Creation timestamp' })
  @Expose()
  createdAt: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  @Expose()
  updatedAt: Date;
}
