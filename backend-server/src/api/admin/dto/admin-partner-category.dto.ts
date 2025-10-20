import { PartnerCategoryResponseDto } from '@/dto/partner-category/partner-category-response.dto';
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

// Admin query DTO for partner categories
export class AdminPartnerCategoryQueryDto {
  @ApiPropertyOptional({ description: 'Search by name or description' })
  @IsOptional()
  @IsString()
  search?: string;

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
export class AdminBulkPartnerCategoryActionDto {
  @ApiProperty({ description: 'Array of partner category IDs' })
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
export class AdminReorderPartnerCategoriesDto {
  @ApiProperty({ description: 'Array of partner category IDs in new order' })
  @IsArray()
  @IsUUID(4, { each: true })
  orderedIds: string[];

  @ApiPropertyOptional({ description: 'Partner type ID for scoped reordering' })
  @IsOptional()
  @IsUUID(4)
  partnerTypeId?: string;
}

// Admin rule template update DTO
export class AdminUpdateRuleTemplatesDto {
  @ApiPropertyOptional({ description: 'Pricing rule templates' })
  @IsOptional()
  @IsObject()
  pricingRules?: any;

  @ApiPropertyOptional({ description: 'Availability rule templates' })
  @IsOptional()
  @IsObject()
  availabilityRules?: any;

  @ApiPropertyOptional({ description: 'Requirements rule templates' })
  @IsOptional()
  @IsObject()
  requirementRules?: any;

  @ApiPropertyOptional({ description: 'Feature rule templates' })
  @IsOptional()
  @IsObject()
  featureRules?: any;
}

// Admin partner category statistics DTO
export class AdminPartnerCategoryStatsDto {
  @ApiProperty({ description: 'Partner category ID' })
  id: string;

  @ApiProperty({ description: 'Partner category name' })
  name: string;

  @ApiProperty({ description: 'Partner type name' })
  partnerTypeName: string;

  @ApiProperty({ description: 'Number of subcategories' })
  subcategoriesCount: number;

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

  @ApiProperty({ description: 'Is active status' })
  isActive: boolean;

  @ApiProperty({ description: 'Creation date' })
  createdAt: Date;
}

// Admin partner category list response DTO
export class AdminPartnerCategoryListResponseDto {
  @ApiProperty({
    description: 'List of partner categories',
    type: [PartnerCategoryResponseDto],
  })
  data: PartnerCategoryResponseDto[];

  @ApiProperty({ description: 'Total count' })
  total: number;

  @ApiProperty({ description: 'Current page' })
  page: number;

  @ApiProperty({ description: 'Items per page' })
  limit: number;

  @ApiProperty({ description: 'Total pages' })
  totalPages: number;
}

// Admin partner category analytics DTO
export class AdminPartnerCategoryAnalyticsDto {
  @ApiProperty({
    description: 'Partner category statistics',
    type: [AdminPartnerCategoryStatsDto],
  })
  stats: AdminPartnerCategoryStatsDto[];

  @ApiProperty({ description: 'Total categories' })
  totalCategories: number;

  @ApiProperty({ description: 'Active categories' })
  activeCategories: number;

  @ApiProperty({ description: 'Categories by partner type' })
  categoriesByType: Record<string, number>;

  @ApiProperty({ description: 'Total partners across all categories' })
  totalPartners: number;

  @ApiProperty({ description: 'Total revenue across all categories' })
  totalRevenue: number;
}

// Admin category usage analytics DTO
export class AdminCategoryUsageAnalyticsDto {
  @ApiProperty({ description: 'Category ID' })
  categoryId: string;

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

  @ApiProperty({ description: 'Growth rate (percentage)' })
  growthRate: number;

  @ApiProperty({ description: 'Last 30 days bookings' })
  last30DaysBookings: number;

  @ApiProperty({ description: 'Last 30 days revenue' })
  last30DaysRevenue: number;
}
