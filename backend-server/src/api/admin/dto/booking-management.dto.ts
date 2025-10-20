import { BookingStatus, PaymentStatus } from '@/common/enums/booking.enum';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsDecimal,
  IsEnum,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  Length,
  Matches,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { PageOptionsDto } from '../../../common/dto/offset-pagination/page-options.dto';
import { OffsetPaginatedDto } from '../../../common/dto/offset-pagination/paginated.dto';
export { PaymentStatus };

export enum BookingSortBy {
  CREATED_AT = 'createdAt',
  BOOKING_DATE = 'bookingDate',
  AMOUNT = 'amount',
  STATUS = 'status',
}

export class BookingQueryDto extends PageOptionsDto {
  @ApiPropertyOptional({
    description: 'Search by booking reference, user name, or space name',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    enum: BookingStatus,
    description: 'Filter by booking status',
  })
  @IsOptional()
  @IsEnum(BookingStatus)
  status?: BookingStatus;

  @ApiPropertyOptional({
    description: 'Start date for booking date range filter',
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({
    description: 'End date for booking date range filter',
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ description: 'Filter by user ID' })
  @IsOptional()
  @IsUUID()
  userId?: string;

  @ApiPropertyOptional({ description: 'Filter by space ID' })
  @IsOptional()
  @IsUUID()
  spaceId?: string;

  @ApiPropertyOptional({ description: 'Filter by partner ID' })
  @IsOptional()
  @IsUUID()
  partnerId?: string;

  @ApiPropertyOptional({
    enum: PaymentStatus,
    description: 'Filter by payment status',
  })
  @IsOptional()
  @IsEnum(PaymentStatus)
  paymentStatus?: PaymentStatus;

  @ApiPropertyOptional({ description: 'Minimum amount filter' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minAmount?: number;

  @ApiPropertyOptional({ description: 'Maximum amount filter' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  maxAmount?: number;

  @ApiPropertyOptional({ enum: BookingSortBy, description: 'Sort by field' })
  @IsOptional()
  @IsEnum(BookingSortBy)
  sortBy?: BookingSortBy = BookingSortBy.CREATED_AT;

  @ApiPropertyOptional({ enum: ['asc', 'desc'], description: 'Sort order' })
  @IsOptional()
  @IsEnum(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc' = 'desc';
}

export class BookingListItemDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  bookingReference: string;

  @ApiProperty()
  bookingDate: Date;

  @ApiProperty()
  startTime: string;

  @ApiProperty()
  endTime: string;

  @ApiProperty({ enum: BookingStatus })
  status: BookingStatus;

  @ApiProperty()
  totalAmount: number;

  @ApiProperty({ enum: PaymentStatus })
  paymentStatus: PaymentStatus;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };

  @ApiProperty()
  space: {
    id: string;
    name: string;
    location: string;
    partner: {
      id: string;
      businessName: string;
    };
  };
}

export class BookingListResponseDto extends OffsetPaginatedDto<BookingListItemDto> {
  @ApiProperty({ type: [BookingListItemDto] })
  declare data: BookingListItemDto[];
}

export class BookingDetailsDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  bookingReference: string;

  @ApiProperty()
  bookingDate: Date;

  @ApiProperty()
  startTime: string;

  @ApiProperty()
  endTime: string;

  @ApiProperty({ enum: BookingStatus })
  status: BookingStatus;

  @ApiProperty()
  totalAmount: number;

  @ApiProperty()
  baseAmount: number;

  @ApiProperty()
  taxAmount: number;

  @ApiProperty()
  discountAmount: number;

  @ApiProperty({ enum: PaymentStatus })
  paymentStatus: PaymentStatus;

  @ApiProperty()
  paymentMethod: string;

  @ApiProperty()
  transactionId: string;

  @ApiProperty()
  specialRequests: string;

  @ApiProperty()
  numberOfGuests: number;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty()
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    profileImage: string;
  };

  @ApiProperty()
  space: {
    id: string;
    name: string;
    description: string;
    location: string;
    capacity: number;
    hourlyRate: number;
    images: string[];
    amenities: string[];
    partner: {
      id: string;
      businessName: string;
      email: string;
      phone: string;
    };
  };

  @ApiProperty()
  refunds: {
    id: string;
    amount: number;
    reason: string;
    processedAt: Date;
    refundReference: string;
  }[];
}

export class BookingUpdateDto {
  @ApiPropertyOptional({ description: 'Booking date in ISO format' })
  @IsOptional()
  @IsDateString({}, { message: 'Booking date must be a valid ISO date string' })
  bookingDate?: string;

  @ApiPropertyOptional({ description: 'Start time in HH:mm format' })
  @IsOptional()
  @IsString()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'Start time must be in HH:mm format',
  })
  startTime?: string;

  @ApiPropertyOptional({ description: 'End time in HH:mm format' })
  @IsOptional()
  @IsString()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'End time must be in HH:mm format',
  })
  endTime?: string;

  @ApiPropertyOptional({ description: 'Number of guests (1-50)' })
  @IsOptional()
  @IsNumber({}, { message: 'Number of guests must be a number' })
  @Min(1, { message: 'Number of guests must be at least 1' })
  @Max(50, { message: 'Number of guests cannot exceed 50' })
  numberOfGuests?: number;

  @ApiPropertyOptional({ description: 'Special requests (max 500 characters)' })
  @IsOptional()
  @IsString()
  @Length(0, 500, { message: 'Special requests cannot exceed 500 characters' })
  specialRequests?: string;
}

export class UpdateBookingStatusDto {
  @ApiProperty({ enum: BookingStatus, description: 'New booking status' })
  @IsEnum(BookingStatus, { message: 'Status must be a valid booking status' })
  status: BookingStatus;

  @ApiPropertyOptional({
    description: 'Reason for status change (max 200 characters)',
  })
  @IsOptional()
  @IsString()
  @Length(1, 200, { message: 'Reason must be between 1 and 200 characters' })
  reason?: string;

  @ApiPropertyOptional({ description: 'Whether to notify user via email' })
  @IsOptional()
  @IsBoolean()
  notifyUser?: boolean = true;
}

// Bulk update booking status DTO
export class BulkBookingStatusUpdateDto {
  @ApiProperty({
    description: 'Array of booking IDs to update',
    type: [String],
    example: ['booking-id-1', 'booking-id-2'],
  })
  @IsArray()
  @IsUUID(4, { each: true })
  bookingIds: string[];

  @ApiProperty({ enum: BookingStatus, description: 'New booking status' })
  @IsEnum(BookingStatus, { message: 'Status must be a valid booking status' })
  status: BookingStatus;

  @ApiPropertyOptional({
    description: 'Reason for status change (max 200 characters)',
  })
  @IsOptional()
  @IsString()
  @Length(1, 200, { message: 'Reason must be between 1 and 200 characters' })
  reason?: string;

  @ApiPropertyOptional({ description: 'Whether to notify users via email' })
  @IsOptional()
  @IsBoolean()
  notifyUser?: boolean = true;
}

export class RefundRequestDto {
  @ApiProperty({ description: 'Refund amount (minimum $0.01, maximum $10000)' })
  @IsNumber({}, { message: 'Amount must be a valid number' })
  @IsPositive({ message: 'Amount must be positive' })
  @Min(0.01, { message: 'Minimum refund amount is $0.01' })
  @Max(10000, { message: 'Maximum refund amount is $10,000' })
  amount: number;

  @ApiProperty({
    description: 'Reason for refund (required, max 300 characters)',
  })
  @IsString()
  @Length(5, 300, { message: 'Reason must be between 5 and 300 characters' })
  reason: string;

  @ApiPropertyOptional({ description: 'Whether to notify user via email' })
  @IsOptional()
  @IsBoolean()
  notifyUser?: boolean = true;
}

export class ExtendBookingDto {
  @ApiProperty({ description: 'New end time in HH:mm format' })
  @IsString()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'New end time must be in HH:mm format',
  })
  newEndTime: string;

  @ApiPropertyOptional({
    description: 'Reason for extension (max 200 characters)',
  })
  @IsOptional()
  @IsString()
  @Length(0, 200, { message: 'Reason cannot exceed 200 characters' })
  reason?: string;

  @ApiPropertyOptional({ description: 'Whether to notify user via email' })
  @IsOptional()
  @IsBoolean()
  notifyUser?: boolean = true;
}

export class BookingStatsDto {
  @ApiProperty()
  totalBookings: number;

  @ApiProperty()
  pendingBookings: number;

  @ApiProperty()
  confirmedBookings: number;

  @ApiProperty()
  cancelledBookings: number;

  @ApiProperty()
  completedBookings: number;

  @ApiProperty()
  refundedBookings: number;

  @ApiProperty()
  totalRevenue: number;

  @ApiProperty()
  monthlyRevenue: number;

  @ApiProperty()
  averageBookingValue: number;

  @ApiProperty()
  bookingGrowthRate: number;

  @ApiProperty()
  topSpaces: {
    spaceId: string;
    spaceName: string;
    bookingCount: number;
    revenue: number;
  }[];

  @ApiProperty()
  topUsers: {
    userId: string;
    userName: string;
    bookingCount: number;
    totalSpent: number;
  }[];

  @ApiProperty()
  revenueByMonth: {
    month: string;
    revenue: number;
    bookingCount: number;
  }[];

  @ApiProperty()
  bookingsByStatus: {
    status: BookingStatus;
    count: number;
    percentage: number;
  }[];
}
