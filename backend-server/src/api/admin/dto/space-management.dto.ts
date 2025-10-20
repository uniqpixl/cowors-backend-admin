import { PageOptionsDto } from '@/common/dto/offset-pagination/page-options.dto';
import { SpaceSubtype } from '@/common/enums/partner.enum';
import {
  BookingModel,
  SpaceAmenity,
  SpaceStatus,
} from '@/common/enums/space.enum';
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
  IsUUID,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';

// Enhanced SpaceStatus enum for admin management
export enum AdminSpaceStatus {
  DRAFT = 'draft',
  PENDING = 'pending',
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  MAINTENANCE = 'maintenance',
  SUSPENDED = 'suspended',
  REJECTED = 'rejected',
}

// Space list item DTO
export class SpaceListItemDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty({ enum: SpaceSubtype })
  spaceType: SpaceSubtype;

  @ApiProperty({ enum: AdminSpaceStatus })
  status: AdminSpaceStatus;

  @ApiProperty()
  capacity: number;

  @ApiProperty()
  location: {
    floor?: string;
    room?: string;
    area?: string;
  };

  @ApiProperty()
  pricing: {
    basePrice: number;
    currency: string;
  };

  @ApiProperty()
  partner: {
    id: string;
    name: string;
  };

  @ApiProperty()
  rating: number;

  @ApiProperty()
  totalBookings: number;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

// Space list response DTO
export class SpaceListResponseDto {
  @ApiProperty({ type: [SpaceListItemDto] })
  data: SpaceListItemDto[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;

  @ApiProperty()
  totalPages: number;

  @ApiProperty({ description: 'Whether there is a next page' })
  hasNextPage: boolean;

  @ApiProperty({ description: 'Whether there is a previous page' })
  hasPreviousPage: boolean;
}

// Space details DTO
export class SpaceDetailsDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  description: string;

  @ApiProperty({ enum: SpaceSubtype })
  spaceType: SpaceSubtype;

  @ApiProperty({ enum: BookingModel })
  bookingModel: BookingModel;

  @ApiProperty({ enum: AdminSpaceStatus })
  status: AdminSpaceStatus;

  @ApiProperty()
  capacity: number;

  @ApiProperty({ type: [String] })
  amenities: string[];

  @ApiProperty()
  location: {
    floor?: string;
    room?: string;
    area?: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
  };

  @ApiProperty()
  pricing: {
    basePrice: number;
    currency: string;
    pricePerHour?: number;
    pricePerDay?: number;
    pricePerWeek?: number;
    pricePerMonth?: number;
    minimumBookingHours?: number;
    maximumBookingHours?: number;
    discounts?: any;
  };

  @ApiProperty()
  availabilityRules: {
    advanceBookingDays: number;
    cancellationPolicy: any;
    operatingHours: any;
    blackoutDates?: string[];
    minimumNoticeHours?: number;
  };

  @ApiProperty({ type: [Object] })
  images: {
    url: string;
    alt: string;
    isPrimary: boolean;
  }[];

  @ApiProperty()
  rating: number;

  @ApiProperty()
  reviewCount: number;

  @ApiProperty()
  totalBookings: number;

  @ApiProperty()
  metadata: {
    wifi?: boolean;
    parking?: boolean;
    accessibility?: boolean;
    petFriendly?: boolean;
    smokingAllowed?: boolean;
    alcoholAllowed?: boolean;
    cateringAvailable?: boolean;
    equipmentAvailable?: string[];
  };

  @ApiProperty()
  partner: {
    id: string;
    name: string;
    email: string;
    phone: string;
  };

  @ApiProperty()
  bookingStats: {
    totalBookings: number;
    completedBookings: number;
    cancelledBookings: number;
    revenue: number;
    utilizationRate: number;
  };

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

// Space statistics DTO
export class SpaceStatsDto {
  @ApiProperty()
  totalSpaces: number;

  @ApiProperty()
  activeSpaces: number;

  @ApiProperty()
  inactiveSpaces: number;

  @ApiProperty()
  pendingSpaces: number;

  @ApiProperty()
  maintenanceSpaces: number;

  @ApiProperty()
  suspendedSpaces: number;

  @ApiProperty()
  rejectedSpaces: number;

  @ApiProperty()
  draftSpaces: number;

  @ApiProperty()
  totalRevenue: number;

  @ApiProperty()
  averageRating: number;

  @ApiProperty()
  totalBookings: number;

  @ApiProperty()
  averageUtilization: number;

  @ApiProperty({ type: [Object] })
  topSpaces: {
    id: string;
    name: string;
    revenue: number;
    bookings: number;
    rating: number;
  }[];

  @ApiProperty({ type: [Object] })
  spacesByType: {
    type: string;
    count: number;
    percentage: number;
  }[];

  @ApiProperty({ type: [Object] })
  revenueByMonth: {
    month: string;
    revenue: number;
    bookings: number;
  }[];
}

// Update space DTO
export class UpdateSpaceDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ enum: SpaceSubtype })
  @IsOptional()
  @IsEnum(SpaceSubtype)
  spaceType?: SpaceSubtype;

  @ApiPropertyOptional({ enum: BookingModel })
  @IsOptional()
  @IsEnum(BookingModel)
  bookingModel?: BookingModel;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(1)
  capacity?: number;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  amenities?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  location?: {
    floor?: string;
    room?: string;
    area?: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
  };

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  pricing?: {
    basePrice: number;
    currency: string;
    pricePerHour?: number;
    pricePerDay?: number;
    pricePerWeek?: number;
    pricePerMonth?: number;
    minimumBookingHours?: number;
    maximumBookingHours?: number;
    discounts?: any;
  };

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  availabilityRules?: {
    advanceBookingDays: number;
    cancellationPolicy: any;
    operatingHours: any;
    blackoutDates?: string[];
    minimumNoticeHours?: number;
  };

  @ApiPropertyOptional({ type: [Object] })
  @IsOptional()
  @IsArray()
  images?: {
    url: string;
    alt: string;
    isPrimary: boolean;
  }[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  metadata?: {
    wifi?: boolean;
    parking?: boolean;
    accessibility?: boolean;
    petFriendly?: boolean;
    smokingAllowed?: boolean;
    alcoholAllowed?: boolean;
    cateringAvailable?: boolean;
    equipmentAvailable?: string[];
  };
}

// Space status update DTO
export class SpaceStatusUpdateDto {
  @ApiProperty({ enum: AdminSpaceStatus })
  @IsEnum(AdminSpaceStatus)
  status: AdminSpaceStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  reason?: string;
}

// Bulk space status update DTO
export class BulkSpaceStatusUpdateDto {
  @ApiProperty({ type: [String], description: 'Array of space IDs to update' })
  @IsArray()
  @IsString({ each: true })
  spaceIds: string[];

  @ApiProperty({ enum: AdminSpaceStatus })
  @IsEnum(AdminSpaceStatus)
  status: AdminSpaceStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  reason?: string;
}

// Space approval DTO
export class SpaceApprovalDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  reason?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

// Space query parameters DTO
export class SpaceQueryDto extends PageOptionsDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: AdminSpaceStatus })
  @IsOptional()
  @IsEnum(AdminSpaceStatus)
  status?: AdminSpaceStatus;

  @ApiPropertyOptional({ enum: SpaceSubtype })
  @IsOptional()
  @IsEnum(SpaceSubtype)
  type?: SpaceSubtype;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  partnerId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  minPrice?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  maxPrice?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  minCapacity?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  maxCapacity?: number;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  amenities?: string[];

  @ApiPropertyOptional({
    enum: ['name', 'price', 'capacity', 'createdAt', 'rating', 'totalBookings'],
  })
  @IsOptional()
  @IsString()
  sortBy?:
    | 'name'
    | 'price'
    | 'capacity'
    | 'createdAt'
    | 'rating'
    | 'totalBookings';

  @ApiPropertyOptional({ enum: ['asc', 'desc'] })
  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc';

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  createdAfter?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  createdBefore?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  @Max(5)
  minRating?: number;
}
