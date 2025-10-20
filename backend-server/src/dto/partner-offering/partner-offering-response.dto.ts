import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PartnerCategoryResponseDto } from '../partner-category/partner-category-response.dto';
import { PartnerSubcategoryResponseDto } from '../partner-subcategory/partner-subcategory-response.dto';

export class PartnerOfferingResponseDto {
  @ApiProperty({ description: 'Unique identifier' })
  id: string;

  @ApiProperty({ description: 'Offering title' })
  title: string;

  @ApiProperty({ description: 'URL-friendly slug' })
  slug: string;

  @ApiPropertyOptional({ description: 'Detailed offering description' })
  description?: string;

  @ApiProperty({ description: 'Whether the offering is active' })
  isActive: boolean;

  @ApiProperty({ description: 'Whether the offering is featured' })
  isFeatured: boolean;

  @ApiProperty({ description: 'Sort order for display' })
  sortOrder: number;

  @ApiProperty({ description: 'Partner ID who owns this offering' })
  partnerId: string;

  @ApiProperty({ description: 'Primary category ID' })
  categoryId: string;

  @ApiPropertyOptional({ description: 'Subcategory ID (if applicable)' })
  subcategoryId?: string;

  @ApiProperty({ description: 'Pricing information as JSON object' })
  pricing?: {
    basePrice: number;
    currency: string;
    pricingModel: 'hourly' | 'daily' | 'monthly' | 'fixed' | 'custom';
    discounts?: {
      type: 'percentage' | 'fixed';
      value: number;
      validFrom?: Date;
      validTo?: Date;
      conditions?: string;
    }[];
    additionalCharges?: {
      name: string;
      amount: number;
      type: 'fixed' | 'percentage';
      optional: boolean;
    }[];
  };

  @ApiProperty({ description: 'Availability information as JSON object' })
  availability?: {
    schedule?: {
      [key: string]: {
        open: string;
        close: string;
        isAvailable: boolean;
      };
    };
    advanceBooking: number; // days
    maxBookingDuration: number; // hours
    bufferTime: number; // minutes
    blackoutDates?: Date[];
    specialAvailability?: {
      date: Date;
      slots: {
        start: string;
        end: string;
        available: boolean;
      }[];
    }[];
  };

  @ApiPropertyOptional({
    description: 'Features and services included as JSON object',
  })
  features?: {
    allowInstantBooking: boolean;
    allowCancellation: boolean;
    cancellationPolicy: string;
    refundPolicy?: string;
    amenities?: string[];
    capacity?: {
      min: number;
      max: number;
      optimal?: number;
    };
    equipment?: string[];
    specialFeatures?: string[];
  };

  @ApiPropertyOptional({
    description: 'Requirements and qualifications as JSON object',
  })
  requirements?: {
    verification: string[];
    documents: string[];
    minimumRating?: number;
    ageRestriction?: {
      min?: number;
      max?: number;
    };
    specialRequirements?: string[];
  };

  @ApiPropertyOptional({ description: 'Media files as JSON object' })
  media?: {
    images?: Array<{
      url: string;
      alt: string;
      isPrimary: boolean;
      order: number;
    }>;
    videos?: Array<{
      url: string;
      title: string;
      thumbnail?: string;
    }>;
    documents?: Array<{
      url: string;
      name: string;
      type: string;
    }>;
  };

  @ApiPropertyOptional({
    description: 'Location and service area information as JSON object',
  })
  location?: {
    address?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
    latitude?: number;
    longitude?: number;
    serviceRadius?: number;
    isRemote?: boolean;
    notes?: string;
  };

  @ApiPropertyOptional({ description: 'Additional metadata as JSON object' })
  metadata?: Record<string, any>;

  @ApiProperty({ description: 'Creation timestamp' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  updatedAt: Date;

  // Optional related entities
  @ApiPropertyOptional({
    description: 'Category information',
    type: PartnerCategoryResponseDto,
  })
  category?: PartnerCategoryResponseDto;

  @ApiPropertyOptional({
    description: 'Subcategory information',
    type: PartnerSubcategoryResponseDto,
  })
  subcategory?: PartnerSubcategoryResponseDto;

  @ApiPropertyOptional({ description: 'Partner name for display' })
  partnerName?: string;

  @ApiPropertyOptional({ description: 'Number of bookings for this offering' })
  bookingCount?: number;

  @ApiPropertyOptional({ description: 'Average rating for this offering' })
  averageRating?: number;

  @ApiPropertyOptional({ description: 'Number of reviews for this offering' })
  reviewCount?: number;
}
