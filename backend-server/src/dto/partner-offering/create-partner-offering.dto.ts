import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  IsUrl,
  IsUUID,
  Length,
  Matches,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';

enum PricingType {
  FIXED = 'fixed',
  HOURLY = 'hourly',
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  CUSTOM = 'custom',
}

enum BookingType {
  INSTANT = 'instant',
  REQUEST = 'request',
  QUOTE = 'quote',
}

class PricingDto {
  @ApiProperty({ description: 'Pricing type', enum: PricingType })
  @IsEnum(PricingType)
  type: PricingType;

  @ApiPropertyOptional({ description: 'Base price' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  basePrice?: number;

  @ApiPropertyOptional({ description: 'Hourly rate' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  hourlyRate?: number;

  @ApiPropertyOptional({ description: 'Daily rate' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  dailyRate?: number;

  @ApiPropertyOptional({ description: 'Weekly rate' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  weeklyRate?: number;

  @ApiPropertyOptional({ description: 'Monthly rate' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  monthlyRate?: number;

  @ApiPropertyOptional({ description: 'Minimum booking duration in hours' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  minDuration?: number;

  @ApiPropertyOptional({ description: 'Maximum booking duration in hours' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  maxDuration?: number;

  @ApiPropertyOptional({ description: 'Cancellation fee percentage' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  cancellationFee?: number;

  @ApiPropertyOptional({ description: 'Security deposit amount' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  securityDeposit?: number;

  @ApiPropertyOptional({ description: 'Currency code', example: 'USD' })
  @IsOptional()
  @IsString()
  @Length(3, 3)
  currency?: string;

  @ApiPropertyOptional({ description: 'Additional pricing notes' })
  @IsOptional()
  @IsString()
  @Length(0, 500)
  notes?: string;
}

class TimeSlotDto {
  @ApiProperty({ description: 'Day of week (0-6, Sunday=0)' })
  @IsNumber()
  @Min(0)
  @Max(6)
  dayOfWeek: number;

  @ApiProperty({ description: 'Start time (HH:MM format)', example: '09:00' })
  @IsString()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'Start time must be in HH:MM format',
  })
  startTime: string;

  @ApiProperty({ description: 'End time (HH:MM format)', example: '17:00' })
  @IsString()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'End time must be in HH:MM format',
  })
  endTime: string;
}

class AvailabilityDto {
  @ApiProperty({ description: 'Booking type', enum: BookingType })
  @IsEnum(BookingType)
  bookingType: BookingType;

  @ApiPropertyOptional({ description: 'Advance booking time in hours' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  advanceBookingTime?: number;

  @ApiPropertyOptional({ description: 'Maximum advance booking time in days' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  maxAdvanceBooking?: number;

  @ApiPropertyOptional({
    description: 'Buffer time between bookings in minutes',
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  bufferTime?: number;

  @ApiPropertyOptional({
    description: 'Weekly time slots',
    type: [TimeSlotDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TimeSlotDto)
  timeSlots?: TimeSlotDto[];

  @ApiPropertyOptional({
    description: 'Blackout dates (ISO date strings)',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsDateString({}, { each: true })
  blackoutDates?: string[];

  @ApiPropertyOptional({ description: 'Special availability notes' })
  @IsOptional()
  @IsString()
  @Length(0, 500)
  notes?: string;
}

class FeatureDto {
  @ApiProperty({ description: 'Feature name' })
  @IsString()
  @Length(1, 100)
  name: string;

  @ApiPropertyOptional({ description: 'Feature description' })
  @IsOptional()
  @IsString()
  @Length(0, 500)
  description?: string;

  @ApiPropertyOptional({
    description: 'Whether feature is included by default',
  })
  @IsOptional()
  @IsBoolean()
  included?: boolean;

  @ApiPropertyOptional({ description: 'Additional cost for this feature' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  additionalCost?: number;
}

class RequirementDto {
  @ApiProperty({ description: 'Requirement type', example: 'certification' })
  @IsString()
  @Length(1, 50)
  type: string;

  @ApiProperty({ description: 'Requirement description' })
  @IsString()
  @Length(1, 200)
  description: string;

  @ApiPropertyOptional({ description: 'Whether requirement is mandatory' })
  @IsOptional()
  @IsBoolean()
  mandatory?: boolean;
}

class MediaItemDto {
  @ApiProperty({ description: 'Media type', example: 'image' })
  @IsString()
  @IsEnum(['image', 'video', 'document'])
  type: string;

  @ApiProperty({ description: 'Media URL' })
  @IsUrl()
  url: string;

  @ApiPropertyOptional({ description: 'Media title' })
  @IsOptional()
  @IsString()
  @Length(0, 100)
  title?: string;

  @ApiPropertyOptional({ description: 'Media description' })
  @IsOptional()
  @IsString()
  @Length(0, 500)
  description?: string;

  @ApiPropertyOptional({ description: 'Sort order for display' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  sortOrder?: number;

  @ApiPropertyOptional({ description: 'Whether this is the primary media' })
  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;
}

class LocationDto {
  @ApiPropertyOptional({ description: 'Street address' })
  @IsOptional()
  @IsString()
  @Length(0, 200)
  address?: string;

  @ApiPropertyOptional({ description: 'City' })
  @IsOptional()
  @IsString()
  @Length(0, 100)
  city?: string;

  @ApiPropertyOptional({ description: 'State or province' })
  @IsOptional()
  @IsString()
  @Length(0, 100)
  state?: string;

  @ApiPropertyOptional({ description: 'Postal code' })
  @IsOptional()
  @IsString()
  @Length(0, 20)
  postalCode?: string;

  @ApiPropertyOptional({ description: 'Country' })
  @IsOptional()
  @IsString()
  @Length(0, 100)
  country?: string;

  @ApiPropertyOptional({ description: 'Latitude coordinate' })
  @IsOptional()
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude?: number;

  @ApiPropertyOptional({ description: 'Longitude coordinate' })
  @IsOptional()
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude?: number;

  @ApiPropertyOptional({ description: 'Service radius in kilometers' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  serviceRadius?: number;

  @ApiPropertyOptional({ description: 'Whether service is provided remotely' })
  @IsOptional()
  @IsBoolean()
  isRemote?: boolean;

  @ApiPropertyOptional({ description: 'Location-specific notes' })
  @IsOptional()
  @IsString()
  @Length(0, 500)
  notes?: string;
}

export class CreatePartnerOfferingDto {
  @ApiProperty({
    description: 'Offering title',
    example: 'Professional House Cleaning',
  })
  @IsString()
  @Length(1, 200)
  title: string;

  @ApiProperty({
    description: 'URL-friendly slug (auto-generated if not provided)',
    example: 'professional-house-cleaning',
  })
  @IsOptional()
  @IsString()
  @Length(1, 200)
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'Slug must be lowercase alphanumeric with hyphens only',
  })
  slug?: string;

  @ApiPropertyOptional({ description: 'Detailed offering description' })
  @IsOptional()
  @IsString()
  @Length(0, 2000)
  description?: string;

  @ApiPropertyOptional({
    description: 'Whether the offering is active',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean = true;

  @ApiPropertyOptional({
    description: 'Whether the offering is featured',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean = false;

  @ApiPropertyOptional({ description: 'Sort order for display', default: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  sortOrder?: number = 0;

  @ApiProperty({ description: 'Partner ID who owns this offering' })
  @IsUUID()
  partnerId: string;

  @ApiProperty({ description: 'Primary category ID' })
  @IsUUID()
  categoryId: string;

  @ApiPropertyOptional({ description: 'Subcategory ID (if applicable)' })
  @IsOptional()
  @IsUUID()
  subcategoryId?: string;

  @ApiProperty({ description: 'Pricing information', type: PricingDto })
  @ValidateNested()
  @Type(() => PricingDto)
  pricing: PricingDto;

  @ApiProperty({
    description: 'Availability information',
    type: AvailabilityDto,
  })
  @ValidateNested()
  @Type(() => AvailabilityDto)
  availability: AvailabilityDto;

  @ApiPropertyOptional({
    description: 'Features and services included',
    type: [FeatureDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FeatureDto)
  features?: FeatureDto[];

  @ApiPropertyOptional({
    description: 'Requirements and qualifications',
    type: [RequirementDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RequirementDto)
  requirements?: RequirementDto[];

  @ApiPropertyOptional({
    description: 'Media files (images, videos, documents)',
    type: [MediaItemDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MediaItemDto)
  media?: MediaItemDto[];

  @ApiPropertyOptional({
    description: 'Location and service area information',
    type: LocationDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => LocationDto)
  location?: LocationDto;

  @ApiPropertyOptional({ description: 'Additional metadata as JSON object' })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}
