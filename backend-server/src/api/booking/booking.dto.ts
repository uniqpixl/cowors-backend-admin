import { PageOptionsDto as CursorPageOptions } from '@/common/dto/cursor-pagination/page-options.dto';
import { CursorPaginatedDto } from '@/common/dto/cursor-pagination/paginated.dto';
import { PageOptionsDto as OffsetPageOptions } from '@/common/dto/offset-pagination/page-options.dto';
import { OffsetPaginatedDto } from '@/common/dto/offset-pagination/paginated.dto';
import { BookingStatus } from '@/common/enums/booking.enum';
import { Uuid } from '@/common/types/common.type';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Min,
  ValidateNested,
} from 'class-validator';

// Booking-specific KYC status enum
export enum BookingKycStatus {
  NOT_REQUIRED = 'not_required',
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

export class CreateBookingDto {
  @ApiProperty({ description: 'Space ID to book' })
  @IsUUID()
  @IsNotEmpty()
  spaceId: Uuid;

  @ApiProperty({ description: 'Booking start date and time' })
  @IsDateString()
  @IsNotEmpty()
  startDateTime: string;

  @ApiProperty({ description: 'Booking end date and time' })
  @IsDateString()
  @IsNotEmpty()
  endDateTime: string;

  @ApiProperty({ description: 'Number of guests', minimum: 1 })
  @IsNumber()
  @Min(1)
  guests: number;

  @ApiPropertyOptional({ description: 'Special requests or notes' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ description: 'Coupon code to apply for discount' })
  @IsOptional()
  @IsString()
  @Length(3, 50)
  couponCode?: string;
}

export class UpdateBookingDto extends PartialType(CreateBookingDto) {
  @ApiPropertyOptional({
    description: 'Status of the booking',
    enum: BookingStatus,
    enumName: 'BookingStatus',
  })
  @IsOptional()
  @IsEnum(BookingStatus)
  status?: BookingStatus;

  @ApiPropertyOptional({ description: 'Total amount' })
  @IsOptional()
  @IsNumber()
  totalAmount?: number;
}

export class BookingDto {
  @ApiProperty({ description: 'Booking ID' })
  id: Uuid;

  @ApiProperty({ description: 'Space ID' })
  spaceId: Uuid;

  @ApiProperty({ description: 'User ID' })
  userId: Uuid;

  @ApiProperty({ description: 'Partner ID' })
  partnerId: Uuid;

  @ApiProperty({ description: 'Booking start time' })
  startDateTime: Date;

  @ApiProperty({ description: 'Booking end time' })
  endDateTime: Date;

  @ApiProperty({ description: 'Number of guests' })
  guests: number;

  @ApiProperty({
    description: 'Status of the booking',
    enum: BookingStatus,
    enumName: 'BookingStatus',
  })
  @IsEnum(BookingStatus)
  status: BookingStatus;

  @ApiProperty({ description: 'Total amount' })
  totalAmount: number;

  @ApiPropertyOptional({ description: 'Special notes' })
  notes?: string;

  @ApiProperty({ description: 'Created at' })
  createdAt: Date;

  @ApiProperty({ description: 'Updated at' })
  updatedAt: Date;
}

export class QueryBookingsOffsetDto extends OffsetPageOptions {
  @ApiPropertyOptional({ description: 'Search query' })
  @IsOptional()
  @IsString()
  declare q?: string;

  @ApiPropertyOptional({
    description: 'Filter by booking status',
    enum: BookingStatus,
    enumName: 'BookingStatus',
  })
  @IsOptional()
  @IsEnum(BookingStatus)
  status?: BookingStatus;

  @ApiPropertyOptional({ description: 'Filter by space ID' })
  @IsOptional()
  @IsUUID()
  spaceId?: Uuid;

  @ApiPropertyOptional({ description: 'Filter by partner ID' })
  @IsOptional()
  @IsUUID()
  partnerId?: Uuid;
}

export class QueryBookingsCursorDto extends CursorPageOptions {
  @ApiPropertyOptional({ description: 'Search query' })
  @IsOptional()
  @IsString()
  declare q?: string;

  @ApiPropertyOptional({ enum: BookingStatus, description: 'Filter by status' })
  @IsOptional()
  @IsEnum(BookingStatus)
  status?: BookingStatus;

  @ApiPropertyOptional({ description: 'Filter by space ID' })
  @IsOptional()
  @IsUUID()
  spaceId?: Uuid;

  @ApiPropertyOptional({ description: 'Filter by partner ID' })
  @IsOptional()
  @IsUUID()
  partnerId?: Uuid;
}

export class OffsetPaginatedBookingDto extends OffsetPaginatedDto<BookingDto> {
  declare data: BookingDto[];
}

export class CursorPaginatedBookingDto extends CursorPaginatedDto<BookingDto> {
  declare data: BookingDto[];
}

export class CheckAvailabilityDto {
  @ApiProperty({ description: 'Space ID to check availability' })
  @IsUUID()
  @IsNotEmpty()
  spaceId: Uuid;

  @ApiProperty({ description: 'Start date and time' })
  @IsDateString()
  @IsNotEmpty()
  startDateTime: string;

  @ApiProperty({ description: 'End date and time' })
  @IsDateString()
  @IsNotEmpty()
  endDateTime: string;
}

export class AvailabilityResponseDto {
  @ApiProperty({ description: 'Whether the space is available' })
  available: boolean;

  @ApiPropertyOptional({ description: 'Conflicting bookings if not available' })
  conflicts?: BookingDto[];
}

export class BookingKycStatusDto {
  @ApiProperty({ description: 'Booking ID' })
  bookingId: string;

  @ApiProperty({
    description: 'Current KYC status for the booking',
    enum: BookingKycStatus,
  })
  kycStatus: BookingKycStatus;

  @ApiPropertyOptional({ description: 'KYC verification ID if exists' })
  kycVerificationId?: string;

  @ApiPropertyOptional({ description: 'Date when KYC was required' })
  kycRequiredAt?: Date;

  @ApiPropertyOptional({ description: 'Date when KYC was completed' })
  kycCompletedAt?: Date;

  @ApiProperty({ description: 'Whether KYC is required for this booking' })
  kycRequired: boolean;
}
