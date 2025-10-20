import { PartnerTypeResponseDto } from '@/dto/partner-type/partner-type-response.dto';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';

// Admin query DTO for partner types
export class AdminPartnerTypeQueryDto {
  @ApiPropertyOptional({ description: 'Search by name or description' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Filter by active status' })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Page number', minimum: 1, default: 1 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Items per page',
    minimum: 1,
    maximum: 100,
    default: 10,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  limit?: number = 10;

  @ApiPropertyOptional({
    description: 'Sort field',
    enum: ['name', 'createdAt', 'order'],
  })
  @IsOptional()
  @IsEnum(['name', 'createdAt', 'order'])
  sortBy?: 'name' | 'createdAt' | 'order' = 'order';

  @ApiPropertyOptional({ description: 'Sort direction', enum: ['ASC', 'DESC'] })
  @IsOptional()
  @IsEnum(['ASC', 'DESC'])
  sortOrder?: 'ASC' | 'DESC' = 'ASC';
}

// Admin bulk operations DTO
export class AdminBulkPartnerTypeActionDto {
  @ApiProperty({ description: 'Array of partner type IDs' })
  @IsArray()
  @IsUUID(4, { each: true })
  ids: string[];

  @ApiProperty({
    description: 'Action to perform',
    enum: ['activate', 'deactivate', 'delete'],
  })
  @IsEnum(['activate', 'deactivate', 'delete'])
  action: 'activate' | 'deactivate' | 'delete';
}

// Admin reorder DTO
export class AdminReorderPartnerTypesDto {
  @ApiProperty({ description: 'Array of partner type IDs in new order' })
  @IsArray()
  @IsUUID(4, { each: true })
  orderedIds: string[];
}

// Admin partner type statistics DTO
export class AdminPartnerTypeStatsDto {
  @ApiProperty({ description: 'Partner type ID' })
  id: string;

  @ApiProperty({ description: 'Partner type name' })
  name: string;

  @ApiProperty({ description: 'Number of categories' })
  categoriesCount: number;

  @ApiProperty({ description: 'Number of active partners' })
  activePartnersCount: number;

  @ApiProperty({ description: 'Number of total partners' })
  totalPartnersCount: number;

  @ApiProperty({ description: 'Number of offerings' })
  offeringsCount: number;

  @ApiProperty({ description: 'Total revenue generated' })
  totalRevenue: number;

  @ApiProperty({ description: 'Is active status' })
  isActive: boolean;

  @ApiProperty({ description: 'Creation date' })
  createdAt: Date;
}

// Admin partner type list response DTO
export class AdminPartnerTypeListResponseDto {
  @ApiProperty({
    description: 'List of partner types',
    type: [PartnerTypeResponseDto],
  })
  data: PartnerTypeResponseDto[];

  @ApiProperty({ description: 'Total count' })
  total: number;

  @ApiProperty({ description: 'Current page' })
  page: number;

  @ApiProperty({ description: 'Items per page' })
  limit: number;

  @ApiProperty({ description: 'Total pages' })
  totalPages: number;
}

// Admin partner type analytics DTO
export class AdminPartnerTypeAnalyticsDto {
  @ApiProperty({
    description: 'Partner type statistics',
    type: [AdminPartnerTypeStatsDto],
  })
  stats: AdminPartnerTypeStatsDto[];

  @ApiProperty({ description: 'Total partner types' })
  totalTypes: number;

  @ApiProperty({ description: 'Active partner types' })
  activeTypes: number;

  @ApiProperty({ description: 'Total partners across all types' })
  totalPartners: number;

  @ApiProperty({ description: 'Total revenue across all types' })
  totalRevenue: number;
}
