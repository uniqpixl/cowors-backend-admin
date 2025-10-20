import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

// Enums for admin payout management
export enum AdminPayoutStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  PROCESSED = 'processed',
}

export enum AdminPayoutSortBy {
  CREATED_AT = 'createdAt',
  UPDATED_AT = 'updatedAt',
  AMOUNT = 'amount',
  PARTNER_NAME = 'partnerName',
  STATUS = 'status',
}

export enum AdminPayoutSortOrder {
  ASC = 'ASC',
  DESC = 'DESC',
}

// Query DTO for admin payout listing
export class AdminPayoutQueryDto {
  @ApiPropertyOptional({ description: 'Page number', default: 1, minimum: 1 })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @IsOptional()
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Items per page',
    default: 10,
    minimum: 1,
    maximum: 100,
  })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  @IsOptional()
  limit?: number = 10;

  @ApiPropertyOptional({ description: 'Search by partner name or email' })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({
    description: 'Filter by payout status',
    enum: AdminPayoutStatus,
  })
  @IsEnum(AdminPayoutStatus)
  @IsOptional()
  @Transform(({ value }) => (value === '' ? undefined : value))
  status?: AdminPayoutStatus;

  @ApiPropertyOptional({
    description: 'Sort by field',
    enum: AdminPayoutSortBy,
    default: AdminPayoutSortBy.CREATED_AT,
  })
  @IsEnum(AdminPayoutSortBy)
  @IsOptional()
  sortBy?: AdminPayoutSortBy = AdminPayoutSortBy.CREATED_AT;

  @ApiPropertyOptional({
    description: 'Sort order',
    enum: AdminPayoutSortOrder,
    default: AdminPayoutSortOrder.DESC,
  })
  @IsEnum(AdminPayoutSortOrder)
  @IsOptional()
  @Transform(({ value }) =>
    value ? value.toUpperCase() : AdminPayoutSortOrder.DESC,
  )
  sortOrder?: AdminPayoutSortOrder = AdminPayoutSortOrder.DESC;

  @ApiPropertyOptional({ description: 'Filter by partner ID' })
  @IsString()
  @IsOptional()
  partnerId?: string;

  @ApiPropertyOptional({ description: 'Filter by minimum amount' })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  minAmount?: number;

  @ApiPropertyOptional({ description: 'Filter by maximum amount' })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  maxAmount?: number;

  @ApiPropertyOptional({ description: 'Filter by start date (ISO string)' })
  @IsString()
  @IsOptional()
  startDate?: string;

  @ApiPropertyOptional({ description: 'Filter by end date (ISO string)' })
  @IsString()
  @IsOptional()
  endDate?: string;
}

// Response DTO for individual admin payout
export class AdminPayoutResponseDto {
  @ApiProperty({ description: 'Payout ID' })
  id: string;

  @ApiProperty({ description: 'Partner ID' })
  partnerId: string;

  @ApiProperty({ description: 'Partner name' })
  partnerName: string;

  @ApiProperty({ description: 'Partner email' })
  partnerEmail: string;

  @ApiProperty({ description: 'Requested payout amount' })
  requestedAmount: number;

  @ApiProperty({ description: 'Partner wallet balance at time of request' })
  walletBalance: number;

  @ApiProperty({ description: 'Payout request date and time' })
  dateTime: string;

  @ApiProperty({ description: 'Payout status', enum: AdminPayoutStatus })
  status: AdminPayoutStatus;

  @ApiProperty({ description: 'Payout gateway/method' })
  payoutGateway: string;

  @ApiProperty({ description: 'Payout account details' })
  account: string;

  @ApiProperty({ description: 'Whether payout was automated' })
  isAutomated: boolean;

  @ApiProperty({ description: 'Creation timestamp' })
  createdAt: string;

  @ApiProperty({ description: 'Last update timestamp' })
  updatedAt: string;

  @ApiPropertyOptional({ description: 'Processing notes' })
  notes?: string;

  @ApiPropertyOptional({ description: 'Processed date' })
  processedAt?: string;

  @ApiPropertyOptional({ description: 'Rejection reason' })
  rejectionReason?: string;
}

// Paginated response DTO for admin payouts
export class AdminPayoutListResponseDto {
  @ApiProperty({
    description: 'List of payouts',
    type: [AdminPayoutResponseDto],
  })
  payouts: AdminPayoutResponseDto[];

  @ApiProperty({ description: 'Pagination information' })
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// DTO for updating payout status
export class AdminUpdatePayoutStatusDto {
  @ApiProperty({ description: 'New payout status', enum: AdminPayoutStatus })
  @IsEnum(AdminPayoutStatus)
  status: AdminPayoutStatus;

  @ApiPropertyOptional({ description: 'Processing notes' })
  @IsString()
  @IsOptional()
  notes?: string;
}

// DTO for batch payout processing
export class AdminBatchPayoutProcessDto {
  @ApiProperty({ description: 'Array of payout IDs to process' })
  @IsString({ each: true })
  payoutIds: string[];

  @ApiPropertyOptional({ description: 'Processing notes' })
  @IsString()
  @IsOptional()
  notes?: string;
}

// DTO for payout analytics
export class AdminPayoutAnalyticsDto {
  @ApiProperty({ description: 'Total number of payout requests' })
  totalRequests: number;

  @ApiProperty({ description: 'Total pending payouts' })
  totalPending: number;

  @ApiProperty({ description: 'Total processed payouts' })
  totalProcessed: number;

  @ApiProperty({ description: 'Total payout amount' })
  totalAmount: number;

  @ApiProperty({ description: 'Average payout amount' })
  averageAmount: number;

  @ApiProperty({ description: 'Payouts by status breakdown' })
  payoutsByStatus: {
    pending: number;
    approved: number;
    rejected: number;
    processed: number;
  };

  @ApiProperty({ description: 'Payouts by time range' })
  payoutsByTimeRange: Array<{
    date: string;
    count: number;
    amount: number;
  }>;
}
