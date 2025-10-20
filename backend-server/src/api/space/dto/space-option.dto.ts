import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsNotEmpty,
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

// Space Option Enums
export enum SpaceOptionType {
  MEETING_ROOM = 'meeting_room',
  CONFERENCE_ROOM = 'conference_room',
  PRIVATE_OFFICE = 'private_office',
  HOT_DESK = 'hot_desk',
  DEDICATED_DESK = 'dedicated_desk',
  EVENT_SPACE = 'event_space',
  WORKSHOP_SPACE = 'workshop_space',
  PHONE_BOOTH = 'phone_booth',
  LOUNGE_AREA = 'lounge_area',
  STUDIO = 'studio',
  VIRTUAL_OFFICE = 'virtual_office',
}

export enum SpaceOptionStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  MAINTENANCE = 'maintenance',
  COMING_SOON = 'coming_soon',
  FULLY_BOOKED = 'fully_booked',
}

export enum ImageCategory {
  MAIN = 'main',
  INTERIOR = 'interior',
  AMENITIES = 'amenities',
  EXTERIOR = 'exterior',
  EQUIPMENT = 'equipment',
  LAYOUT = 'layout',
}

// Location DTO
export class SpaceOptionLocationDto {
  @ApiPropertyOptional({
    description: 'Floor number',
    example: 2,
  })
  @IsOptional()
  @IsString()
  floor?: string;

  @ApiPropertyOptional({
    description: 'Wing or section',
    example: 'East Wing',
  })
  @IsOptional()
  @IsString()
  wing?: string;

  @ApiPropertyOptional({
    description: 'Room number',
    example: 'R-201',
  })
  @IsOptional()
  @IsString()
  roomNumber?: string;

  @ApiPropertyOptional({
    description: 'Building name',
    example: 'Tower A',
  })
  @IsOptional()
  @IsString()
  building?: string;

  @ApiPropertyOptional({
    description: 'Special location notes',
    example: 'Near the main elevator',
  })
  @IsOptional()
  @IsString()
  notes?: string;
}

// Image DTO
export class SpaceOptionImageDto {
  @ApiProperty({
    description: 'Image URL',
    example: 'https://example.com/image.jpg',
  })
  @IsUrl()
  @IsNotEmpty()
  url: string;

  @ApiPropertyOptional({
    description: 'Image alt text',
    example: 'Modern meeting room with projector',
  })
  @IsOptional()
  @IsString()
  altText?: string;

  @ApiProperty({
    enum: ImageCategory,
    description: 'Image category',
    example: ImageCategory.MAIN,
  })
  @IsEnum(ImageCategory)
  @IsNotEmpty()
  category: ImageCategory;

  @ApiPropertyOptional({
    description: 'Display order',
    minimum: 0,
    default: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Transform(({ value }) => (value ? parseInt(value) : 0))
  order?: number;

  @ApiPropertyOptional({
    description: 'Is primary image for category',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  isPrimary?: boolean;
}

// Availability Rules DTO
export class AvailabilityRuleDto {
  @ApiProperty({
    description: 'Day of week (0=Sunday, 6=Saturday)',
    minimum: 0,
    maximum: 6,
  })
  @IsNumber()
  @Min(0)
  @Max(6)
  @Transform(({ value }) => parseInt(value))
  dayOfWeek: number;

  @ApiProperty({
    description: 'Start time (HH:MM format)',
    example: '09:00',
  })
  @IsString()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'Start time must be in HH:MM format',
  })
  startTime: string;

  @ApiProperty({
    description: 'End time (HH:MM format)',
    example: '18:00',
  })
  @IsString()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'End time must be in HH:MM format',
  })
  endTime: string;

  @ApiPropertyOptional({
    description: 'Is available during this time',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  isAvailable?: boolean;
}

// Cancellation Policy DTO
export class CancellationPolicyDto {
  @ApiProperty({
    description: 'Free cancellation hours before booking',
    minimum: 0,
    example: 24,
  })
  @IsNumber()
  @Min(0)
  @Transform(({ value }) => parseInt(value))
  freeCancellationHours: number;

  @ApiPropertyOptional({
    description: 'Cancellation fee percentage (0-100)',
    minimum: 0,
    maximum: 100,
    example: 25,
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(100)
  @Transform(({ value }) => (value ? parseFloat(value) : 0))
  cancellationFeePercentage?: number;

  @ApiPropertyOptional({
    description: 'Fixed cancellation fee',
    minimum: 0,
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Transform(({ value }) => (value ? parseFloat(value) : null))
  fixedCancellationFee?: number;

  @ApiPropertyOptional({
    description: 'No-show fee percentage (0-100)',
    minimum: 0,
    maximum: 100,
    example: 100,
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(100)
  @Transform(({ value }) => (value ? parseFloat(value) : 100))
  noShowFeePercentage?: number;

  @ApiPropertyOptional({
    description: 'Additional policy terms',
  })
  @IsOptional()
  @IsString()
  additionalTerms?: string;
}

// Create Space Option DTO
export class CreateSpaceOptionDto {
  @ApiProperty({
    description: 'Space ID',
    example: 'uuid-string',
  })
  @IsUUID()
  @IsNotEmpty()
  spaceId: string;

  @ApiProperty({
    description: 'Space option name',
    example: 'Executive Meeting Room',
    minLength: 1,
    maxLength: 255,
  })
  @IsString()
  @IsNotEmpty()
  @Length(1, 255)
  name: string;

  @ApiPropertyOptional({
    description: 'Space option description',
    example: 'Spacious meeting room with modern amenities and city view',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    enum: SpaceOptionType,
    description: 'Type of space option',
    example: SpaceOptionType.MEETING_ROOM,
  })
  @IsEnum(SpaceOptionType)
  @IsNotEmpty()
  optionType: SpaceOptionType;

  @ApiPropertyOptional({
    enum: SpaceOptionStatus,
    description: 'Status of space option',
    example: SpaceOptionStatus.ACTIVE,
    default: SpaceOptionStatus.ACTIVE,
  })
  @IsOptional()
  @IsEnum(SpaceOptionStatus)
  status?: SpaceOptionStatus;

  @ApiProperty({
    description: 'Maximum capacity',
    minimum: 1,
    example: 12,
  })
  @IsNumber()
  @Min(1)
  @Transform(({ value }) => parseInt(value))
  maxCapacity: number;

  @ApiPropertyOptional({
    description: 'Minimum capacity',
    minimum: 1,
    example: 2,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Transform(({ value }) => (value ? parseInt(value) : 1))
  minCapacity?: number;

  @ApiPropertyOptional({
    description: 'Area in square feet',
    minimum: 0,
    example: 250,
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Transform(({ value }) => (value ? parseFloat(value) : null))
  area?: number;

  @ApiPropertyOptional({
    description: 'Available amenities',
    type: [String],
    example: ['projector', 'whiteboard', 'wifi', 'air_conditioning'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  amenities?: string[];

  @ApiPropertyOptional({
    description: 'Special features',
    type: [String],
    example: ['city_view', 'natural_light', 'soundproof'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  features?: string[];

  @ApiPropertyOptional({
    description: 'Available equipment',
    type: [String],
    example: ['laptop', 'microphone', 'speakers'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  equipment?: string[];

  @ApiPropertyOptional({
    description: 'Location within the space',
    type: SpaceOptionLocationDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => SpaceOptionLocationDto)
  location?: SpaceOptionLocationDto;

  @ApiPropertyOptional({
    description: 'Space option images',
    type: [SpaceOptionImageDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SpaceOptionImageDto)
  images?: SpaceOptionImageDto[];

  @ApiPropertyOptional({
    description: 'Availability rules',
    type: [AvailabilityRuleDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AvailabilityRuleDto)
  availabilityRules?: AvailabilityRuleDto[];

  @ApiPropertyOptional({
    description: 'Cancellation policy',
    type: CancellationPolicyDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => CancellationPolicyDto)
  cancellationPolicy?: CancellationPolicyDto;

  @ApiPropertyOptional({
    description: 'Priority for display ordering',
    minimum: 0,
    maximum: 100,
    default: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  @Transform(({ value }) => (value ? parseInt(value) : 0))
  priority?: number;

  @ApiPropertyOptional({
    description: 'Additional metadata',
    type: 'object',
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

// Update Space Option DTO
export class UpdateSpaceOptionDto {
  @ApiPropertyOptional({
    description: 'Space option name',
    minLength: 1,
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @Length(1, 255)
  name?: string;

  @ApiPropertyOptional({
    description: 'Space option description',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    enum: SpaceOptionType,
    description: 'Type of space option',
  })
  @IsOptional()
  @IsEnum(SpaceOptionType)
  optionType?: SpaceOptionType;

  @ApiPropertyOptional({
    enum: SpaceOptionStatus,
    description: 'Status of space option',
  })
  @IsOptional()
  @IsEnum(SpaceOptionStatus)
  status?: SpaceOptionStatus;

  @ApiPropertyOptional({
    description: 'Maximum capacity',
    minimum: 1,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Transform(({ value }) => (value ? parseInt(value) : null))
  maxCapacity?: number;

  @ApiPropertyOptional({
    description: 'Minimum capacity',
    minimum: 1,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Transform(({ value }) => (value ? parseInt(value) : null))
  minCapacity?: number;

  @ApiPropertyOptional({
    description: 'Area in square feet',
    minimum: 0,
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Transform(({ value }) => (value ? parseFloat(value) : null))
  area?: number;

  @ApiPropertyOptional({
    description: 'Available amenities',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  amenities?: string[];

  @ApiPropertyOptional({
    description: 'Special features',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  features?: string[];

  @ApiPropertyOptional({
    description: 'Available equipment',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  equipment?: string[];

  @ApiPropertyOptional({
    description: 'Location within the space',
    type: SpaceOptionLocationDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => SpaceOptionLocationDto)
  location?: SpaceOptionLocationDto;

  @ApiPropertyOptional({
    description: 'Space option images',
    type: [SpaceOptionImageDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SpaceOptionImageDto)
  images?: SpaceOptionImageDto[];

  @ApiPropertyOptional({
    description: 'Availability rules',
    type: [AvailabilityRuleDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AvailabilityRuleDto)
  availabilityRules?: AvailabilityRuleDto[];

  @ApiPropertyOptional({
    description: 'Cancellation policy',
    type: CancellationPolicyDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => CancellationPolicyDto)
  cancellationPolicy?: CancellationPolicyDto;

  @ApiPropertyOptional({
    description: 'Is space option active',
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  isActive?: boolean;

  @ApiPropertyOptional({
    description: 'Priority for display ordering',
    minimum: 0,
    maximum: 100,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  @Transform(({ value }) => (value ? parseInt(value) : null))
  priority?: number;

  @ApiPropertyOptional({
    description: 'Additional metadata',
    type: 'object',
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

// Space Option Response DTO
export class SpaceOptionDto {
  @ApiProperty({
    description: 'Space option ID',
    example: 'uuid-string',
  })
  id: string;

  @ApiProperty({
    description: 'Space ID',
    example: 'uuid-string',
  })
  spaceId: string;

  @ApiProperty({
    description: 'Space option name',
    example: 'Executive Meeting Room',
  })
  name: string;

  @ApiPropertyOptional({
    description: 'Space option description',
  })
  description?: string;

  @ApiProperty({
    enum: SpaceOptionType,
    description: 'Type of space option',
  })
  optionType: SpaceOptionType;

  @ApiProperty({
    enum: SpaceOptionStatus,
    description: 'Status of space option',
  })
  status: SpaceOptionStatus;

  @ApiProperty({
    description: 'Maximum capacity',
  })
  maxCapacity: number;

  @ApiPropertyOptional({
    description: 'Minimum capacity',
  })
  minCapacity?: number;

  @ApiPropertyOptional({
    description: 'Area in square feet',
  })
  area?: number;

  @ApiPropertyOptional({
    description: 'Available amenities',
    type: [String],
  })
  amenities?: string[];

  @ApiPropertyOptional({
    description: 'Special features',
    type: [String],
  })
  features?: string[];

  @ApiPropertyOptional({
    description: 'Available equipment',
    type: [String],
  })
  equipment?: string[];

  @ApiPropertyOptional({
    description: 'Location within the space',
    type: SpaceOptionLocationDto,
  })
  location?: SpaceOptionLocationDto;

  @ApiPropertyOptional({
    description: 'Space option images',
    type: [SpaceOptionImageDto],
  })
  images?: SpaceOptionImageDto[];

  @ApiPropertyOptional({
    description: 'Availability rules',
    type: [AvailabilityRuleDto],
  })
  availabilityRules?: AvailabilityRuleDto[];

  @ApiPropertyOptional({
    description: 'Cancellation policy',
    type: CancellationPolicyDto,
  })
  cancellationPolicy?: CancellationPolicyDto;

  @ApiProperty({
    description: 'Is space option active',
  })
  isActive: boolean;

  @ApiProperty({
    description: 'Priority for display ordering',
  })
  priority: number;

  @ApiPropertyOptional({
    description: 'Average rating',
  })
  rating?: number;

  @ApiPropertyOptional({
    description: 'Number of reviews',
  })
  reviewCount?: number;

  @ApiPropertyOptional({
    description: 'Total bookings',
  })
  totalBookings?: number;

  @ApiPropertyOptional({
    description: 'Additional metadata',
    type: 'object',
  })
  metadata?: Record<string, any>;

  @ApiProperty({
    description: 'Creation timestamp',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Last update timestamp',
  })
  updatedAt: Date;
}

// Space Option Query DTO
export class SpaceOptionQueryDto {
  @ApiPropertyOptional({
    description: 'Space ID to filter by',
  })
  @IsOptional()
  @IsUUID()
  spaceId?: string;

  @ApiPropertyOptional({
    enum: SpaceOptionType,
    description: 'Filter by space option type',
  })
  @IsOptional()
  @IsEnum(SpaceOptionType)
  optionType?: SpaceOptionType;

  @ApiPropertyOptional({
    enum: SpaceOptionStatus,
    description: 'Filter by status',
  })
  @IsOptional()
  @IsEnum(SpaceOptionStatus)
  status?: SpaceOptionStatus;

  @ApiPropertyOptional({
    description: 'Minimum capacity required',
    minimum: 1,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Transform(({ value }) => (value ? parseInt(value) : null))
  minCapacity?: number;

  @ApiPropertyOptional({
    description: 'Maximum capacity required',
    minimum: 1,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Transform(({ value }) => (value ? parseInt(value) : null))
  maxCapacity?: number;

  @ApiPropertyOptional({
    description: 'Required amenities (comma-separated)',
    example: 'projector,wifi,whiteboard',
  })
  @IsOptional()
  @IsString()
  amenities?: string;

  @ApiPropertyOptional({
    description: 'Search query for name/description',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Sort by field',
    enum: ['name', 'capacity', 'rating', 'priority', 'createdAt'],
    default: 'priority',
  })
  @IsOptional()
  @IsString()
  sortBy?: string;

  @ApiPropertyOptional({
    description: 'Sort order',
    enum: ['ASC', 'DESC'],
    default: 'DESC',
  })
  @IsOptional()
  @IsString()
  sortOrder?: 'ASC' | 'DESC';

  @ApiPropertyOptional({
    description: 'Page number',
    minimum: 1,
    default: 1,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Transform(({ value }) => (value ? parseInt(value) : 1))
  page?: number;

  @ApiPropertyOptional({
    description: 'Items per page',
    minimum: 1,
    maximum: 100,
    default: 20,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  @Transform(({ value }) => (value ? parseInt(value) : 20))
  limit?: number;
}
