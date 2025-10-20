import { PartnerSubcategoryResponseDto } from '@/dto/partner-subcategory/partner-subcategory-response.dto';
import { UpdatePartnerSubcategoryDto } from '@/dto/partner-subcategory/update-partner-subcategory.dto';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';

// Admin update DTO for partner subcategories (includes categoryId)
export class AdminUpdatePartnerSubcategoryDto extends UpdatePartnerSubcategoryDto {
  @ApiPropertyOptional({ description: 'Partner category ID' })
  @IsOptional()
  @IsUUID(4)
  categoryId?: string;
}

// Admin query DTO for partner subcategories
export class AdminPartnerSubcategoryQueryDto {
  @ApiPropertyOptional({ description: 'Search by name or description' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Filter by partner category ID' })
  @IsOptional()
  @IsUUID(4)
  categoryId?: string;

  @ApiPropertyOptional({ description: 'Filter by partner type ID' })
  @IsOptional()
  @IsUUID(4)
  partnerTypeId?: string;

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
export class AdminBulkPartnerSubcategoryActionDto {
  @ApiProperty({ description: 'Array of partner subcategory IDs' })
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
export class AdminReorderPartnerSubcategoriesDto {
  @ApiProperty({ description: 'Array of partner subcategory IDs in new order' })
  @IsArray()
  @IsUUID(4, { each: true })
  orderedIds: string[];

  @ApiPropertyOptional({
    description: 'Partner category ID for scoped reordering',
  })
  @IsOptional()
  @IsUUID(4)
  categoryId?: string;
}

// Admin rule override update DTO
export class AdminUpdateRuleOverridesDto {
  @ApiPropertyOptional({ description: 'Pricing rule overrides' })
  @IsOptional()
  @IsObject()
  pricingRules?: any;

  @ApiPropertyOptional({ description: 'Availability rule overrides' })
  @IsOptional()
  @IsObject()
  availabilityRules?: any;

  @ApiPropertyOptional({ description: 'Requirements rule overrides' })
  @IsOptional()
  @IsObject()
  requirementRules?: any;

  @ApiPropertyOptional({ description: 'Feature rule overrides' })
  @IsOptional()
  @IsObject()
  featureRules?: any;
}

// Admin partner subcategory statistics DTO
export class AdminPartnerSubcategoryStatsDto {
  @ApiProperty({ description: 'Partner subcategory ID' })
  id: string;

  @ApiProperty({ description: 'Partner subcategory name' })
  name: string;

  @ApiProperty({ description: 'Partner category name' })
  categoryName: string;

  @ApiProperty({ description: 'Partner type name' })
  partnerTypeName: string;

  @ApiProperty({ description: 'Number of active partners' })
  activePartnersCount: number;

  @ApiProperty({ description: 'Number of total partners' })
  totalPartnersCount: number;

  @ApiProperty({ description: 'Number of offerings' })
  offeringsCount: number;

  @ApiProperty({ description: 'Total revenue generated' })
  totalRevenue: number;

  @ApiProperty({ description: 'Average rating' })
  averageRating: number;

  @ApiProperty({ description: 'Total bookings' })
  totalBookings: number;

  @ApiProperty({ description: 'Is active status' })
  isActive: boolean;

  @ApiProperty({ description: 'Creation date' })
  createdAt: Date;
}

// Admin partner subcategory list response DTO
export class AdminPartnerSubcategoryListResponseDto {
  @ApiProperty({
    description: 'List of partner subcategories',
    type: [PartnerSubcategoryResponseDto],
  })
  data: PartnerSubcategoryResponseDto[];

  @ApiProperty({ description: 'Total count' })
  total: number;

  @ApiProperty({ description: 'Current page' })
  page: number;

  @ApiProperty({ description: 'Items per page' })
  limit: number;

  @ApiProperty({ description: 'Total pages' })
  totalPages: number;
}

// Admin partner subcategory analytics DTO
export class AdminPartnerSubcategoryAnalyticsDto {
  @ApiProperty({
    description: 'Partner subcategory statistics',
    type: [AdminPartnerSubcategoryStatsDto],
  })
  stats: AdminPartnerSubcategoryStatsDto[];

  @ApiProperty({ description: 'Total subcategories' })
  totalSubcategories: number;

  @ApiProperty({ description: 'Active subcategories' })
  activeSubcategories: number;

  @ApiProperty({ description: 'Subcategories by category' })
  subcategoriesByCategory: Record<string, number>;

  @ApiProperty({ description: 'Total partners across all subcategories' })
  totalPartners: number;

  @ApiProperty({ description: 'Total revenue across all subcategories' })
  totalRevenue: number;
}

// Admin subcategory performance DTO
export class AdminSubcategoryPerformanceDto {
  @ApiProperty({ description: 'Subcategory ID' })
  subcategoryId: string;

  @ApiProperty({ description: 'Subcategory name' })
  subcategoryName: string;

  @ApiProperty({ description: 'Category name' })
  categoryName: string;

  @ApiProperty({ description: 'Total bookings' })
  totalBookings: number;

  @ApiProperty({ description: 'Total revenue' })
  totalRevenue: number;

  @ApiProperty({ description: 'Average booking value' })
  averageBookingValue: number;

  @ApiProperty({ description: 'Conversion rate' })
  conversionRate: number;

  @ApiProperty({ description: 'Customer satisfaction score' })
  satisfactionScore: number;

  @ApiProperty({ description: 'Growth rate (percentage)' })
  growthRate: number;

  @ApiProperty({ description: 'Market share within category' })
  marketShare: number;

  @ApiProperty({ description: 'Last 30 days performance' })
  last30Days: {
    bookings: number;
    revenue: number;
    newPartners: number;
  };
}
