import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  IsUrl,
  IsUUID,
  Length,
  Matches,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { PartnerExtrasPricingDto } from './pricing.dto';
import { ImageCategory } from './space-option.dto';

// Partner Extras Enums
export enum PartnerExtrasCategory {
  CATERING = 'catering',
  EQUIPMENT = 'equipment',
  SERVICES = 'services',
  FURNITURE = 'furniture',
  TECHNOLOGY = 'technology',
  ENTERTAINMENT = 'entertainment',
  TRANSPORTATION = 'transportation',
  ACCOMMODATION = 'accommodation',
  WELLNESS = 'wellness',
  SECURITY = 'security',
  CLEANING = 'cleaning',
  DECORATION = 'decoration',
  PHOTOGRAPHY = 'photography',
  STATIONERY = 'stationery',
  OTHER = 'other',
}

export enum PartnerExtrasStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  OUT_OF_STOCK = 'out_of_stock',
  DISCONTINUED = 'discontinued',
  COMING_SOON = 'coming_soon',
}

// Partner Extras Image DTO
export class PartnerExtrasImageDto {
  @ApiProperty({
    description: 'Image URL',
    example: 'https://example.com/projector.jpg',
  })
  @IsUrl()
  @IsNotEmpty()
  url: string;

  @ApiPropertyOptional({
    description: 'Image alt text',
    example: 'High-definition projector',
  })
  @IsOptional()
  @IsString()
  altText?: string;

  @ApiProperty({
    enum: ImageCategory,
    description: 'Image category',
    example: ImageCategory.MAIN,
  })
  @IsEnum(ImageCategory)
  @IsNotEmpty()
  category: ImageCategory;

  @ApiPropertyOptional({
    description: 'Display order',
    minimum: 0,
    default: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Transform(({ value }) => (value ? parseInt(value) : 0))
  order?: number;

  @ApiPropertyOptional({
    description: 'Is primary image for category',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  isPrimary?: boolean;
}

// Specifications DTO
export class SpecificationDto {
  @ApiProperty({
    description: 'Specification name',
    example: 'Resolution',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'Specification value',
    example: '1920x1080',
  })
  @IsString()
  @IsNotEmpty()
  value: string;

  @ApiPropertyOptional({
    description: 'Specification unit',
    example: 'pixels',
  })
  @IsOptional()
  @IsString()
  unit?: string;

  @ApiPropertyOptional({
    description: 'Specification category',
    example: 'Display',
  })
  @IsOptional()
  @IsString()
  category?: string;
}

// Create Partner Extras DTO
export class CreatePartnerExtrasDto {
  @ApiProperty({
    description: 'Partner ID',
    example: 'uuid-string',
  })
  @IsUUID()
  @IsNotEmpty()
  partnerId: string;

  @ApiProperty({
    description: 'Extra item name',
    example: 'HD Projector with Screen',
    minLength: 1,
    maxLength: 255,
  })
  @IsString()
  @IsNotEmpty()
  @Length(1, 255)
  name: string;

  @ApiPropertyOptional({
    description: 'Extra item description',
    example: 'High-definition projector with 100-inch screen for presentations',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    enum: PartnerExtrasCategory,
    description: 'Category of the extra item',
    example: PartnerExtrasCategory.EQUIPMENT,
  })
  @IsEnum(PartnerExtrasCategory)
  @IsNotEmpty()
  category: PartnerExtrasCategory;

  @ApiPropertyOptional({
    enum: PartnerExtrasStatus,
    description: 'Status of the extra item',
    example: PartnerExtrasStatus.ACTIVE,
    default: PartnerExtrasStatus.ACTIVE,
  })
  @IsOptional()
  @IsEnum(PartnerExtrasStatus)
  status?: PartnerExtrasStatus;

  @ApiProperty({
    description: 'Pricing configuration',
    type: PartnerExtrasPricingDto,
  })
  @ValidateNested()
  @Type(() => PartnerExtrasPricingDto)
  pricing: PartnerExtrasPricingDto;

  @ApiPropertyOptional({
    description: 'Stock quantity available',
    minimum: 0,
    example: 5,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Transform(({ value }) => (value ? parseInt(value) : null))
  stockQuantity?: number;

  @ApiPropertyOptional({
    description: 'Minimum order quantity',
    minimum: 1,
    example: 1,
    default: 1,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Transform(({ value }) => (value ? parseInt(value) : 1))
  minOrderQuantity?: number;

  @ApiPropertyOptional({
    description: 'Maximum order quantity',
    minimum: 1,
    example: 10,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Transform(({ value }) => (value ? parseInt(value) : null))
  maxOrderQuantity?: number;

  @ApiPropertyOptional({
    description: 'Requires approval before booking',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  requiresApproval?: boolean;

  @ApiPropertyOptional({
    description: 'Lead time required in hours',
    minimum: 0,
    example: 24,
    default: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Transform(({ value }) => (value ? parseInt(value) : 0))
  leadTimeHours?: number;

  @ApiPropertyOptional({
    description: 'Item images',
    type: [PartnerExtrasImageDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PartnerExtrasImageDto)
  images?: PartnerExtrasImageDto[];

  @ApiPropertyOptional({
    description: 'Technical specifications',
    type: [SpecificationDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SpecificationDto)
  specifications?: SpecificationDto[];

  @ApiPropertyOptional({
    description: 'Terms and conditions',
  })
  @IsOptional()
  @IsString()
  termsAndConditions?: string;

  @ApiPropertyOptional({
    description: 'Priority for display ordering',
    minimum: 0,
    maximum: 100,
    default: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  @Transform(({ value }) => (value ? parseInt(value) : 0))
  priority?: number;

  @ApiPropertyOptional({
    description: 'Additional metadata',
    type: 'object',
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

// Update Partner Extras DTO
export class UpdatePartnerExtrasDto {
  @ApiPropertyOptional({
    description: 'Extra item name',
    minLength: 1,
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @Length(1, 255)
  name?: string;

  @ApiPropertyOptional({
    description: 'Extra item description',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    enum: PartnerExtrasCategory,
    description: 'Category of the extra item',
  })
  @IsOptional()
  @IsEnum(PartnerExtrasCategory)
  category?: PartnerExtrasCategory;

  @ApiPropertyOptional({
    enum: PartnerExtrasStatus,
    description: 'Status of the extra item',
  })
  @IsOptional()
  @IsEnum(PartnerExtrasStatus)
  status?: PartnerExtrasStatus;

  @ApiPropertyOptional({
    description: 'Pricing configuration',
    type: PartnerExtrasPricingDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => PartnerExtrasPricingDto)
  pricing?: PartnerExtrasPricingDto;

  @ApiPropertyOptional({
    description: 'Stock quantity available',
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Transform(({ value }) => (value ? parseInt(value) : null))
  stockQuantity?: number;

  @ApiPropertyOptional({
    description: 'Minimum order quantity',
    minimum: 1,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Transform(({ value }) => (value ? parseInt(value) : null))
  minOrderQuantity?: number;

  @ApiPropertyOptional({
    description: 'Maximum order quantity',
    minimum: 1,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Transform(({ value }) => (value ? parseInt(value) : null))
  maxOrderQuantity?: number;

  @ApiPropertyOptional({
    description: 'Requires approval before booking',
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  requiresApproval?: boolean;

  @ApiPropertyOptional({
    description: 'Lead time required in hours',
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Transform(({ value }) => (value ? parseInt(value) : null))
  leadTimeHours?: number;

  @ApiPropertyOptional({
    description: 'Item images',
    type: [PartnerExtrasImageDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PartnerExtrasImageDto)
  images?: PartnerExtrasImageDto[];

  @ApiPropertyOptional({
    description: 'Technical specifications',
    type: [SpecificationDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SpecificationDto)
  specifications?: SpecificationDto[];

  @ApiPropertyOptional({
    description: 'Terms and conditions',
  })
  @IsOptional()
  @IsString()
  termsAndConditions?: string;

  @ApiPropertyOptional({
    description: 'Is item active',
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  isActive?: boolean;

  @ApiPropertyOptional({
    description: 'Priority for display ordering',
    minimum: 0,
    maximum: 100,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  @Transform(({ value }) => (value ? parseInt(value) : null))
  priority?: number;

  @ApiPropertyOptional({
    description: 'Additional metadata',
    type: 'object',
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

// Partner Extras Response DTO
export class PartnerExtrasDto {
  @ApiProperty({
    description: 'Extra item ID',
    example: 'uuid-string',
  })
  id: string;

  @ApiProperty({
    description: 'Partner ID',
    example: 'uuid-string',
  })
  partnerId: string;

  @ApiProperty({
    description: 'Extra item name',
    example: 'HD Projector with Screen',
  })
  name: string;

  @ApiPropertyOptional({
    description: 'Extra item description',
  })
  description?: string;

  @ApiProperty({
    enum: PartnerExtrasCategory,
    description: 'Category of the extra item',
  })
  category: PartnerExtrasCategory;

  @ApiProperty({
    enum: PartnerExtrasStatus,
    description: 'Status of the extra item',
  })
  status: PartnerExtrasStatus;

  @ApiProperty({
    description: 'Pricing configuration',
    type: PartnerExtrasPricingDto,
  })
  pricing: PartnerExtrasPricingDto;

  @ApiPropertyOptional({
    description: 'Stock quantity available',
  })
  stockQuantity?: number;

  @ApiProperty({
    description: 'Minimum order quantity',
  })
  minOrderQuantity: number;

  @ApiPropertyOptional({
    description: 'Maximum order quantity',
  })
  maxOrderQuantity?: number;

  @ApiProperty({
    description: 'Requires approval before booking',
  })
  requiresApproval: boolean;

  @ApiProperty({
    description: 'Lead time required in hours',
  })
  leadTimeHours: number;

  @ApiPropertyOptional({
    description: 'Item images',
    type: [PartnerExtrasImageDto],
  })
  images?: PartnerExtrasImageDto[];

  @ApiPropertyOptional({
    description: 'Technical specifications',
    type: [SpecificationDto],
  })
  specifications?: SpecificationDto[];

  @ApiPropertyOptional({
    description: 'Terms and conditions',
  })
  termsAndConditions?: string;

  @ApiProperty({
    description: 'Is item active',
  })
  isActive: boolean;

  @ApiProperty({
    description: 'Priority for display ordering',
  })
  priority: number;

  @ApiPropertyOptional({
    description: 'Average rating',
  })
  rating?: number;

  @ApiPropertyOptional({
    description: 'Number of reviews',
  })
  reviewCount?: number;

  @ApiPropertyOptional({
    description: 'Total orders',
  })
  totalOrders?: number;

  @ApiPropertyOptional({
    description: 'Additional metadata',
    type: 'object',
  })
  metadata?: Record<string, any>;

  @ApiProperty({
    description: 'Creation timestamp',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Last update timestamp',
  })
  updatedAt: Date;
}

// Partner Extras Query DTO
export class PartnerExtrasQueryDto {
  @ApiPropertyOptional({
    description: 'Partner ID to filter by',
  })
  @IsOptional()
  @IsUUID()
  partnerId?: string;

  @ApiPropertyOptional({
    enum: PartnerExtrasCategory,
    description: 'Filter by category',
  })
  @IsOptional()
  @IsEnum(PartnerExtrasCategory)
  category?: PartnerExtrasCategory;

  @ApiPropertyOptional({
    enum: PartnerExtrasStatus,
    description: 'Filter by status',
  })
  @IsOptional()
  @IsEnum(PartnerExtrasStatus)
  status?: PartnerExtrasStatus;

  @ApiPropertyOptional({
    description: 'Minimum price filter',
    minimum: 0,
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Transform(({ value }) => (value ? parseFloat(value) : null))
  minPrice?: number;

  @ApiPropertyOptional({
    description: 'Maximum price filter',
    minimum: 0,
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Transform(({ value }) => (value ? parseFloat(value) : null))
  maxPrice?: number;

  @ApiPropertyOptional({
    description: 'Filter by availability (has stock)',
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  inStock?: boolean;

  @ApiPropertyOptional({
    description: 'Filter by approval requirement',
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  requiresApproval?: boolean;

  @ApiPropertyOptional({
    description: 'Maximum lead time in hours',
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Transform(({ value }) => (value ? parseInt(value) : null))
  maxLeadTime?: number;

  @ApiPropertyOptional({
    description: 'Search query for name/description',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Sort by field',
    enum: ['name', 'category', 'price', 'rating', 'priority', 'createdAt'],
    default: 'priority',
  })
  @IsOptional()
  @IsString()
  sortBy?: string;

  @ApiPropertyOptional({
    description: 'Sort order',
    enum: ['ASC', 'DESC'],
    default: 'DESC',
  })
  @IsOptional()
  @IsString()
  sortOrder?: 'ASC' | 'DESC';

  @ApiPropertyOptional({
    description: 'Page number',
    minimum: 1,
    default: 1,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Transform(({ value }) => (value ? parseInt(value) : 1))
  page?: number;

  @ApiPropertyOptional({
    description: 'Items per page',
    minimum: 1,
    maximum: 100,
    default: 20,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  @Transform(({ value }) => (value ? parseInt(value) : 20))
  limit?: number;
}

// Stock Update DTO
export class UpdateStockDto {
  @ApiProperty({
    description: 'New stock quantity',
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  @Transform(({ value }) => parseInt(value))
  stockQuantity: number;

  @ApiPropertyOptional({
    description: 'Reason for stock update',
    example: 'Restocked inventory',
  })
  @IsOptional()
  @IsString()
  reason?: string;
}

// Bulk Update DTO
export class BulkUpdatePartnerExtrasDto {
  @ApiProperty({
    description: 'Array of extra item IDs to update',
    type: [String],
  })
  @IsArray()
  @ArrayMinSize(1)
  @IsUUID(undefined, { each: true })
  ids: string[];

  @ApiPropertyOptional({
    enum: PartnerExtrasStatus,
    description: 'New status for all items',
  })
  @IsOptional()
  @IsEnum(PartnerExtrasStatus)
  status?: PartnerExtrasStatus;

  @ApiPropertyOptional({
    description: 'New active state for all items',
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  isActive?: boolean;

  @ApiPropertyOptional({
    description: 'New priority for all items',
    minimum: 0,
    maximum: 100,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  @Transform(({ value }) => (value ? parseInt(value) : null))
  priority?: number;
}
