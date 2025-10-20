import { PageOptionsDto as CursorPageOptions } from '@/common/dto/cursor-pagination/page-options.dto';
import { CursorPaginatedDto } from '@/common/dto/cursor-pagination/paginated.dto';
import { PageOptionsDto as OffsetPageOptions } from '@/common/dto/offset-pagination/page-options.dto';
import { OffsetPaginatedDto } from '@/common/dto/offset-pagination/paginated.dto';
import { SpaceSubtype } from '@/common/enums/partner.enum';
import { BookingModel, SpaceStatus } from '@/common/enums/space.enum';
import { Uuid } from '@/common/types/common.type';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';

export class SpaceLocationDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  floor?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  room?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  area?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  coordinates?: {
    latitude: number;
    longitude: number;
  };
}

export class SpacePricingDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  basePrice: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  currency: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  pricePerHour?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  pricePerDay?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  pricePerWeek?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  pricePerMonth?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(1)
  minimumBookingHours?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(1)
  maximumBookingHours?: number;
}

export class SpaceImageDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  url: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  alt?: string;

  @ApiPropertyOptional()
  @IsOptional()
  isPrimary?: boolean;
}

export class CreateSpaceDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  description: string;

  @ApiProperty({ enum: SpaceSubtype })
  spaceType: SpaceSubtype;

  @ApiPropertyOptional({ enum: BookingModel })
  @IsOptional()
  @IsEnum(BookingModel)
  bookingModel?: BookingModel;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  capacity: number;

  @ApiProperty()
  @IsArray()
  @IsString({ each: true })
  amenities: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @ValidateNested()
  @Type(() => SpaceLocationDto)
  location?: SpaceLocationDto;

  @ApiProperty()
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => SpacePricingDto)
  pricing: SpacePricingDto;

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SpaceImageDto)
  images?: SpaceImageDto[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  availabilityRules?: any;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  metadata?: any;
}

export class UpdateSpaceDto extends PartialType(CreateSpaceDto) {
  @ApiPropertyOptional({ enum: SpaceStatus })
  @IsOptional()
  @IsEnum(SpaceStatus)
  status?: SpaceStatus;
}

export class SpaceDto {
  @ApiProperty()
  id: Uuid;

  @ApiProperty()
  partnerId: Uuid;

  @ApiProperty()
  name: string;

  @ApiProperty()
  description: string;

  @ApiProperty({ enum: SpaceSubtype })
  spaceType: SpaceSubtype;

  @ApiProperty({ enum: BookingModel })
  bookingModel: BookingModel;

  @ApiProperty()
  capacity: number;

  @ApiProperty()
  amenities: string[];

  @ApiPropertyOptional()
  location?: SpaceLocationDto;

  @ApiProperty()
  pricing: SpacePricingDto;

  @ApiPropertyOptional()
  images?: SpaceImageDto[];

  @ApiProperty({ enum: SpaceStatus })
  status: SpaceStatus;

  @ApiProperty()
  rating: number;

  @ApiProperty()
  reviewCount: number;

  @ApiProperty()
  totalBookings: number;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class QuerySpacesOffsetDto extends OffsetPageOptions {
  @ApiPropertyOptional({ enum: SpaceSubtype })
  @IsOptional()
  @IsEnum(SpaceSubtype)
  spaceType?: SpaceSubtype;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  minPrice?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  maxPrice?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  amenities?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  declare q?: string;
}

export class QuerySpacesCursorDto extends CursorPageOptions {
  @ApiPropertyOptional({ enum: SpaceSubtype })
  @IsOptional()
  @IsEnum(SpaceSubtype)
  spaceType?: SpaceSubtype;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  declare q?: string;
}

export class OffsetPaginatedSpaceDto extends OffsetPaginatedDto<SpaceDto> {
  declare data: SpaceDto[];
}

export class CursorPaginatedSpaceDto extends CursorPaginatedDto<SpaceDto> {
  declare data: SpaceDto[];
}

export class SpaceAvailabilityDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  spaceId: Uuid;

  @ApiProperty()
  @IsNotEmpty()
  startDateTime: Date;

  @ApiProperty()
  @IsNotEmpty()
  endDateTime: Date;
}
