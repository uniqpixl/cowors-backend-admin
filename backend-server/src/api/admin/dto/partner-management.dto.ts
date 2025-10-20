import { PartnerStatus, VerificationStatus } from '@/common/enums/partner.enum';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEmail,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';

// Enums for partner management
export enum PartnerSortBy {
  NAME = 'name',
  CREATED_AT = 'createdAt',
  REVENUE = 'revenue',
  SPACES_COUNT = 'spacesCount',
  LAST_ACTIVE = 'lastActive',
}

export enum SortOrder {
  ASC = 'asc',
  DESC = 'desc',
}

// Query parameters for partner listing
export class PartnerQueryDto {
  @ApiPropertyOptional({ description: 'Search by name, email, or company' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    enum: PartnerStatus,
    description: 'Filter by partner status',
  })
  @IsOptional()
  @Transform(({ value }) => (value === '' ? undefined : value))
  @IsEnum(PartnerStatus)
  status?: PartnerStatus;

  @ApiPropertyOptional({
    enum: VerificationStatus,
    description: 'Filter by verification status',
  })
  @IsOptional()
  @Transform(({ value }) => (value === '' ? undefined : value))
  @IsEnum(VerificationStatus)
  verificationStatus?: VerificationStatus;

  @ApiPropertyOptional({ description: 'Filter by city' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ description: 'Filter by area' })
  @IsOptional()
  @IsString()
  area?: string;

  @ApiPropertyOptional({ description: 'Registration date from (ISO string)' })
  @IsOptional()
  @IsDateString()
  registrationDateFrom?: string;

  @ApiPropertyOptional({ description: 'Registration date to (ISO string)' })
  @IsOptional()
  @IsDateString()
  registrationDateTo?: string;

  @ApiPropertyOptional({ description: 'Minimum revenue' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minRevenue?: number;

  @ApiPropertyOptional({ description: 'Maximum revenue' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  maxRevenue?: number;

  @ApiPropertyOptional({ description: 'Minimum spaces count' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minSpacesCount?: number;

  @ApiPropertyOptional({ description: 'Maximum spaces count' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  maxSpacesCount?: number;

  @ApiPropertyOptional({ enum: PartnerSortBy, description: 'Sort by field' })
  @IsOptional()
  @IsEnum(PartnerSortBy)
  sortBy?: PartnerSortBy = PartnerSortBy.CREATED_AT;

  @ApiPropertyOptional({ enum: SortOrder, description: 'Sort order' })
  @IsOptional()
  @IsEnum(SortOrder)
  sortOrder?: SortOrder = SortOrder.DESC;

  @ApiPropertyOptional({ description: 'Page number', minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Items per page',
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 10;
}

// Partner list item DTO
export class PartnerListItemDto {
  @ApiProperty({ description: 'Partner ID' })
  id: string;

  @ApiProperty({ description: 'Partner name' })
  name: string;

  @ApiProperty({ description: 'Partner email' })
  email: string;

  @ApiProperty({ description: 'Company name' })
  companyName: string;

  @ApiProperty({ description: 'Phone number' })
  phone: string;

  @ApiProperty({ enum: PartnerStatus, description: 'Partner status' })
  status: PartnerStatus;

  @ApiProperty({ enum: VerificationStatus, description: 'Verification status' })
  verificationStatus: VerificationStatus;

  @ApiProperty({ description: 'City' })
  city: string;

  @ApiProperty({ description: 'Area' })
  area: string;

  @ApiProperty({ description: 'Number of spaces' })
  spacesCount: number;

  @ApiProperty({ description: 'Total revenue' })
  totalRevenue: number;

  @ApiProperty({ description: 'Registration date' })
  createdAt: Date;

  @ApiProperty({ description: 'Last active date' })
  lastActive: Date;
}

// Partner list response DTO
export class PartnerListResponseDto {
  @ApiProperty({ type: [PartnerListItemDto], description: 'List of partners' })
  data: PartnerListItemDto[];

  @ApiProperty({ description: 'Total number of partners' })
  total: number;

  @ApiProperty({ description: 'Current page' })
  page: number;

  @ApiProperty({ description: 'Items per page' })
  limit: number;

  @ApiProperty({ description: 'Total pages' })
  totalPages: number;

  @ApiProperty({ description: 'Whether there is a next page' })
  hasNextPage: boolean;

  @ApiProperty({ description: 'Whether there is a previous page' })
  hasPreviousPage: boolean;
}

// Partner details DTO
export class PartnerDetailsDto {
  @ApiProperty({ description: 'Partner ID' })
  id: string;

  @ApiProperty({ description: 'Partner name' })
  name: string;

  @ApiProperty({ description: 'Partner email' })
  email: string;

  @ApiProperty({ description: 'Company name' })
  companyName: string;

  @ApiProperty({ description: 'Phone number' })
  phone: string;

  @ApiProperty({ enum: PartnerStatus, description: 'Partner status' })
  status: PartnerStatus;

  @ApiProperty({ enum: VerificationStatus, description: 'Verification status' })
  verificationStatus: VerificationStatus;

  @ApiProperty({ description: 'Address' })
  address: string;

  @ApiProperty({ description: 'City' })
  city: string;

  @ApiProperty({ description: 'Area' })
  area: string;

  @ApiProperty({ description: 'Postal code' })
  postalCode: string;

  @ApiProperty({ description: 'Business license number' })
  businessLicense: string;

  @ApiProperty({ description: 'Tax ID' })
  taxId: string;

  @ApiProperty({ description: 'Business details' })
  businessDetails: any;

  @ApiProperty({ description: 'Bank account details' })
  bankDetails: any;

  @ApiProperty({ description: 'KYC documents' })
  kycDocuments: any[];

  @ApiProperty({ description: 'Number of spaces' })
  spacesCount: number;

  @ApiProperty({ description: 'Number of active spaces' })
  activeSpacesCount: number;

  @ApiProperty({ description: 'Total bookings' })
  totalBookings: number;

  @ApiProperty({ description: 'Total revenue' })
  totalRevenue: number;

  @ApiProperty({ description: 'Monthly revenue' })
  monthlyRevenue: number;

  @ApiProperty({ description: 'Average rating' })
  averageRating: number;

  @ApiProperty({ description: 'Registration date' })
  createdAt: Date;

  @ApiProperty({ description: 'Last updated date' })
  updatedAt: Date;

  @ApiProperty({ description: 'Last active date' })
  lastActive: Date;
}

// Update partner DTO
export class UpdatePartnerDto {
  @ApiPropertyOptional({ description: 'Business name' })
  @IsOptional()
  @IsString()
  businessName?: string;

  @ApiPropertyOptional({ description: 'Contact person name' })
  @IsOptional()
  @IsString()
  contactPerson?: string;

  @ApiPropertyOptional({ description: 'Phone number' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ description: 'Business details' })
  @IsOptional()
  businessDetails?: any;

  @ApiPropertyOptional({ description: 'Address details' })
  @IsOptional()
  address?: any;
}

// Update partner status DTO
export class UpdatePartnerStatusDto {
  @ApiProperty({ enum: PartnerStatus, description: 'New partner status' })
  @IsEnum(PartnerStatus)
  status: PartnerStatus;

  @ApiPropertyOptional({ description: 'Reason for status change' })
  @IsOptional()
  @IsString()
  reason?: string;
}

// Bulk update partner status DTO
export class BulkPartnerStatusUpdateDto {
  @ApiProperty({
    description: 'Array of partner IDs to update',
    type: [String],
    example: ['partner-id-1', 'partner-id-2'],
  })
  @IsArray()
  @IsUUID(4, { each: true })
  partnerIds: string[];

  @ApiProperty({ enum: PartnerStatus, description: 'New partner status' })
  @IsEnum(PartnerStatus)
  status: PartnerStatus;

  @ApiPropertyOptional({ description: 'Reason for status change' })
  @IsOptional()
  @IsString()
  reason?: string;
}

// Partner approval DTO
export class PartnerApprovalDto {
  @ApiPropertyOptional({ description: 'Approval/rejection reason' })
  @IsOptional()
  @IsString()
  reason?: string;

  @ApiPropertyOptional({ description: 'Additional notes' })
  @IsOptional()
  @IsString()
  notes?: string;
}

// Partner statistics DTO
export class PartnerStatsDto {
  @ApiProperty({ description: 'Total partners' })
  totalPartners: number;

  @ApiProperty({ description: 'Active partners' })
  activePartners: number;

  @ApiProperty({ description: 'Inactive partners' })
  inactivePartners: number;

  @ApiProperty({ description: 'Pending partners' })
  pendingPartners: number;

  @ApiProperty({ description: 'Suspended partners' })
  suspendedPartners: number;

  @ApiProperty({ description: 'Verified partners' })
  verifiedPartners: number;

  @ApiProperty({ description: 'Pending verification partners' })
  pendingVerificationPartners: number;

  @ApiProperty({ description: 'Rejected partners' })
  rejectedPartners: number;

  @ApiProperty({ description: 'New partners this month' })
  newPartnersThisMonth: number;

  @ApiProperty({ description: 'Partner growth rate (%)' })
  growthRate: number;

  @ApiProperty({ description: 'Average revenue per partner' })
  averageRevenuePerPartner: number;

  @ApiProperty({ description: 'Total partner revenue' })
  totalPartnerRevenue: number;

  @ApiProperty({ description: 'Top performing partners' })
  topPartners: PartnerListItemDto[];
}

// Partner revenue analytics DTO
export class PartnerRevenueDto {
  @ApiProperty({ description: 'Partner ID' })
  partnerId: string;

  @ApiProperty({ description: 'Partner name' })
  partnerName: string;

  @ApiProperty({ description: 'Total revenue' })
  totalRevenue: number;

  @ApiProperty({ description: 'Monthly revenue' })
  monthlyRevenue: number;

  @ApiProperty({ description: 'Revenue this year' })
  yearlyRevenue: number;

  @ApiProperty({ description: 'Revenue growth rate (%)' })
  revenueGrowthRate: number;

  @ApiProperty({ description: 'Average booking value' })
  averageBookingValue: number;

  @ApiProperty({ description: 'Total bookings' })
  totalBookings: number;

  @ApiProperty({ description: 'Monthly revenue breakdown' })
  monthlyBreakdown: {
    month: string;
    revenue: number;
    bookings: number;
  }[];

  @ApiProperty({ description: 'Top performing spaces' })
  topSpaces: {
    spaceId: string;
    spaceName: string;
    revenue: number;
    bookings: number;
  }[];
}

// Partner revenue analytics DTO for detailed analytics
export class PartnerRevenueAnalyticsDto {
  @ApiProperty({ description: 'Total revenue' })
  totalRevenue: number;

  @ApiProperty({ description: 'This month revenue' })
  thisMonthRevenue: number;

  @ApiProperty({ description: 'Last month revenue' })
  lastMonthRevenue: number;

  @ApiProperty({ description: 'This year revenue' })
  thisYearRevenue: number;

  @ApiProperty({ description: 'Monthly growth percentage' })
  monthlyGrowth: number;

  @ApiProperty({ description: 'Total bookings' })
  totalBookings: number;

  @ApiProperty({ description: 'This month bookings' })
  thisMonthBookings: number;

  @ApiProperty({ description: 'Average booking value' })
  averageBookingValue: number;

  @ApiProperty({ description: 'Monthly data for the last 12 months' })
  monthlyData: {
    month: string;
    revenue: number;
    bookings: number;
  }[];
}

// Partner space DTO
export class PartnerSpaceDto {
  @ApiProperty({ description: 'Space ID' })
  id: string;

  @ApiProperty({ description: 'Space name' })
  name: string;

  @ApiProperty({ description: 'Space type' })
  type: string;

  @ApiProperty({ description: 'Space status' })
  status: string;

  @ApiProperty({ description: 'Space capacity' })
  capacity: number;

  @ApiProperty({ description: 'Space price per hour' })
  pricePerHour: number;

  @ApiProperty({ description: 'Space location' })
  location: string;

  @ApiProperty({ description: 'Total bookings for this space' })
  totalBookings: number;

  @ApiProperty({ description: 'Total revenue from this space' })
  totalRevenue: number;

  @ApiProperty({ description: 'Average rating' })
  averageRating: number;

  @ApiProperty({ description: 'Space creation date' })
  createdAt: Date;

  @ApiProperty({ description: 'Last updated date' })
  updatedAt: Date;
}

// Partner booking DTO
export class PartnerBookingDto {
  @ApiProperty({ description: 'Booking ID' })
  id: string;

  @ApiProperty({ description: 'Space name' })
  spaceName: string;

  @ApiProperty({ description: 'Customer name' })
  customerName: string;

  @ApiProperty({ description: 'Customer email' })
  customerEmail: string;

  @ApiProperty({ description: 'Booking start date' })
  startDate: Date;

  @ApiProperty({ description: 'Booking end date' })
  endDate: Date;

  @ApiProperty({ description: 'Booking duration in hours' })
  duration: number;

  @ApiProperty({ description: 'Booking status' })
  status: string;

  @ApiProperty({ description: 'Total amount' })
  totalAmount: number;

  @ApiProperty({ description: 'Payment status' })
  paymentStatus: string;

  @ApiProperty({ description: 'Booking creation date' })
  createdAt: Date;

  @ApiProperty({ description: 'Last updated date' })
  updatedAt: Date;
}
