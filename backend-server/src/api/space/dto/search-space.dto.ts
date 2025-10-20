import { BookingStatus } from '@/common/enums/booking.enum';
import {
  BookingModel,
  SpaceStatus,
  SpaceType,
} from '@/common/enums/space.enum';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class SearchSpaceDto {
  @ApiPropertyOptional({
    description: 'Search query for space name or description',
  })
  @IsOptional()
  @IsString()
  query?: string;

  @ApiPropertyOptional({ description: 'City for location-based search' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({
    description: 'Canonical cityId for location-based search',
  })
  @IsOptional()
  @IsString()
  cityId?: string;

  @ApiPropertyOptional({ description: 'State for location-based search' })
  @IsOptional()
  @IsString()
  state?: string;

  @ApiPropertyOptional({ description: 'Country for location-based search' })
  @IsOptional()
  @IsString()
  country?: string;

  @ApiPropertyOptional({ description: 'Latitude for proximity search' })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  latitude?: number;

  @ApiPropertyOptional({ description: 'Longitude for proximity search' })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  longitude?: number;

  @ApiPropertyOptional({
    description: 'Radius in kilometers for proximity search',
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  radius?: number = 10;

  @ApiPropertyOptional({
    enum: SpaceType,
    isArray: true,
    description: 'Filter by space types',
  })
  @IsOptional()
  @IsArray()
  @IsEnum(SpaceType, { each: true })
  @Transform(({ value }) => (Array.isArray(value) ? value : [value]))
  spaceTypes?: SpaceType[];

  @ApiPropertyOptional({
    enum: BookingStatus,
    isArray: true,
    description: 'Filter by booking status',
  })
  @IsOptional()
  @IsArray()
  @IsEnum(BookingStatus, { each: true })
  @Transform(({ value }) => (Array.isArray(value) ? value : [value]))
  bookingStatuses?: BookingStatus[];

  @ApiPropertyOptional({
    enum: BookingModel,
    isArray: true,
    description: 'Filter by booking models',
  })
  @IsOptional()
  @IsArray()
  @IsEnum(BookingModel, { each: true })
  @Transform(({ value }) => (Array.isArray(value) ? value : [value]))
  bookingModels?: BookingModel[];

  @ApiPropertyOptional({ description: 'Minimum capacity required' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  minCapacity?: number;

  @ApiPropertyOptional({ description: 'Maximum capacity required' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  maxCapacity?: number;

  @ApiPropertyOptional({ description: 'Minimum hourly price' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  minPrice?: number;

  @ApiPropertyOptional({ description: 'Maximum hourly price' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  maxPrice?: number;

  @ApiPropertyOptional({ description: 'Required amenities', isArray: true })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) => (Array.isArray(value) ? value : [value]))
  amenities?: string[];

  @ApiPropertyOptional({ description: 'Minimum rating (1-5)' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  @Type(() => Number)
  minRating?: number;

  @ApiPropertyOptional({ description: 'Check-in date for availability search' })
  @IsOptional()
  @IsDateString()
  checkInDate?: string;

  @ApiPropertyOptional({
    description: 'Check-out date for availability search',
  })
  @IsOptional()
  @IsDateString()
  checkOutDate?: string;

  @ApiPropertyOptional({
    description: 'Start time for hourly bookings (HH:mm format)',
  })
  @IsOptional()
  @IsString()
  startTime?: string;

  @ApiPropertyOptional({
    description: 'End time for hourly bookings (HH:mm format)',
  })
  @IsOptional()
  @IsString()
  endTime?: string;

  @ApiPropertyOptional({
    description: 'Filter by instant booking availability',
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  instantBooking?: boolean;

  @ApiPropertyOptional({
    enum: SpaceStatus,
    description: 'Filter by space status',
  })
  @IsOptional()
  @IsEnum(SpaceStatus)
  status?: SpaceStatus;

  @ApiPropertyOptional({
    description: 'Sort by field',
    enum: ['name', 'rating', 'price', 'distance', 'createdAt'],
  })
  @IsOptional()
  @IsString()
  sortBy?: 'name' | 'rating' | 'price' | 'distance' | 'createdAt' = 'createdAt';

  @ApiPropertyOptional({ description: 'Sort order', enum: ['ASC', 'DESC'] })
  @IsOptional()
  @IsString()
  sortOrder?: 'ASC' | 'DESC' = 'DESC';

  @ApiPropertyOptional({ description: 'Page number', minimum: 1 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Items per page',
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  limit?: number = 20;
}
