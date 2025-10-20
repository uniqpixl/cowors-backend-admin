import { PartnerStatus, VerificationStatus } from '@/common/enums/partner.enum';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
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
export class AdminPartnerQueryDto {
  @ApiPropertyOptional({ description: 'Search by name, email, or company' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    enum: PartnerStatus,
    description: 'Filter by partner status',
  })
  @IsOptional()
  @IsEnum(PartnerStatus)
  status?: PartnerStatus;

  @ApiPropertyOptional({
    enum: VerificationStatus,
    description: 'Filter by verification status',
  })
  @IsOptional()
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
