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
  IsUUID,
  Length,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import {
  OverrideType,
  PricingTierDto,
  SpaceOptionExtrasOverrideDto,
} from './pricing.dto';

// Create Space Option Extras DTO
export class CreateSpaceOptionExtrasDto {
  @ApiProperty({
    description: 'Space option ID',
    example: 'uuid-string',
  })
  @IsUUID()
  @IsNotEmpty()
  spaceOptionId: string;

  @ApiProperty({
    description: 'Partner extras ID',
    example: 'uuid-string',
  })
  @IsUUID()
  @IsNotEmpty()
  partnerExtrasId: string;

  @ApiProperty({
    description: 'Pricing override configuration',
    type: SpaceOptionExtrasOverrideDto,
  })
  @ValidateNested()
  @Type(() => SpaceOptionExtrasOverrideDto)
  override: SpaceOptionExtrasOverrideDto;

  @ApiPropertyOptional({
    description: 'Override stock quantity for this space option',
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Transform(({ value }) => (value ? parseInt(value) : null))
  overrideStockQuantity?: number;

  @ApiPropertyOptional({
    description: 'Override minimum order quantity',
    minimum: 1,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Transform(({ value }) => (value ? parseInt(value) : null))
  overrideMinOrderQuantity?: number;

  @ApiPropertyOptional({
    description: 'Override maximum order quantity',
    minimum: 1,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Transform(({ value }) => (value ? parseInt(value) : null))
  overrideMaxOrderQuantity?: number;

  @ApiPropertyOptional({
    description: 'Is this extra active for this space option',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  isActive?: boolean;

  @ApiPropertyOptional({
    description: 'Is this extra included by default',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  isIncluded?: boolean;

  @ApiPropertyOptional({
    description: 'Is this extra mandatory for bookings',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  isMandatory?: boolean;

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
    description: 'Space-specific description override',
  })
  @IsOptional()
  @IsString()
  spaceSpecificDescription?: string;

  @ApiPropertyOptional({
    description: 'Space-specific terms and conditions',
  })
  @IsOptional()
  @IsString()
  spaceSpecificTerms?: string;

  @ApiPropertyOptional({
    description: 'Additional metadata',
    type: 'object',
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

// Update Space Option Extras DTO
export class UpdateSpaceOptionExtrasDto {
  @ApiPropertyOptional({
    description: 'Pricing override configuration',
    type: SpaceOptionExtrasOverrideDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => SpaceOptionExtrasOverrideDto)
  override?: SpaceOptionExtrasOverrideDto;

  @ApiPropertyOptional({
    description: 'Override stock quantity for this space option',
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Transform(({ value }) => (value ? parseInt(value) : null))
  overrideStockQuantity?: number;

  @ApiPropertyOptional({
    description: 'Override minimum order quantity',
    minimum: 1,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Transform(({ value }) => (value ? parseInt(value) : null))
  overrideMinOrderQuantity?: number;

  @ApiPropertyOptional({
    description: 'Override maximum order quantity',
    minimum: 1,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Transform(({ value }) => (value ? parseInt(value) : null))
  overrideMaxOrderQuantity?: number;

  @ApiPropertyOptional({
    description: 'Is this extra active for this space option',
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  isActive?: boolean;

  @ApiPropertyOptional({
    description: 'Is this extra included by default',
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  isIncluded?: boolean;

  @ApiPropertyOptional({
    description: 'Is this extra mandatory for bookings',
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  isMandatory?: boolean;

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
    description: 'Space-specific description override',
  })
  @IsOptional()
  @IsString()
  spaceSpecificDescription?: string;

  @ApiPropertyOptional({
    description: 'Space-specific terms and conditions',
  })
  @IsOptional()
  @IsString()
  spaceSpecificTerms?: string;

  @ApiPropertyOptional({
    description: 'Additional metadata',
    type: 'object',
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

// Space Option Extras Response DTO
export class SpaceOptionExtrasDto {
  @ApiProperty({
    description: 'Space option extras ID',
    example: 'uuid-string',
  })
  id: string;

  @ApiProperty({
    description: 'Space option ID',
    example: 'uuid-string',
  })
  spaceOptionId: string;

  @ApiProperty({
    description: 'Partner extras ID',
    example: 'uuid-string',
  })
  partnerExtrasId: string;

  @ApiProperty({
    description: 'Pricing override configuration',
    type: SpaceOptionExtrasOverrideDto,
  })
  override: SpaceOptionExtrasOverrideDto;

  @ApiPropertyOptional({
    description: 'Override stock quantity for this space option',
  })
  overrideStockQuantity?: number;

  @ApiPropertyOptional({
    description: 'Override minimum order quantity',
  })
  overrideMinOrderQuantity?: number;

  @ApiPropertyOptional({
    description: 'Override maximum order quantity',
  })
  overrideMaxOrderQuantity?: number;

  @ApiProperty({
    description: 'Is this extra active for this space option',
  })
  isActive: boolean;

  @ApiProperty({
    description: 'Is this extra included by default',
  })
  isIncluded: boolean;

  @ApiProperty({
    description: 'Is this extra mandatory for bookings',
  })
  isMandatory: boolean;

  @ApiProperty({
    description: 'Priority for display ordering',
  })
  priority: number;

  @ApiPropertyOptional({
    description: 'Space-specific description override',
  })
  spaceSpecificDescription?: string;

  @ApiPropertyOptional({
    description: 'Space-specific terms and conditions',
  })
  spaceSpecificTerms?: string;

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

  // Related data (populated when requested)
  @ApiPropertyOptional({
    description: 'Partner extras details (populated)',
    type: 'object',
  })
  partnerExtras?: any;

  @ApiPropertyOptional({
    description: 'Space option details (populated)',
    type: 'object',
  })
  spaceOption?: any;
}

// Space Option Extras Query DTO
export class SpaceOptionExtrasQueryDto {
  @ApiPropertyOptional({
    description: 'Space option ID to filter by',
  })
  @IsOptional()
  @IsUUID()
  spaceOptionId?: string;

  @ApiPropertyOptional({
    description: 'Partner extras ID to filter by',
  })
  @IsOptional()
  @IsUUID()
  partnerExtrasId?: string;

  @ApiPropertyOptional({
    description: 'Partner ID to filter by',
  })
  @IsOptional()
  @IsUUID()
  partnerId?: string;

  @ApiPropertyOptional({
    enum: OverrideType,
    description: 'Filter by override type',
  })
  @IsOptional()
  @IsEnum(OverrideType)
  overrideType?: OverrideType;

  @ApiPropertyOptional({
    description: 'Filter by active status',
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  isActive?: boolean;

  @ApiPropertyOptional({
    description: 'Filter by included status',
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  isIncluded?: boolean;

  @ApiPropertyOptional({
    description: 'Filter by mandatory status',
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  isMandatory?: boolean;

  @ApiPropertyOptional({
    description: 'Include partner extras details',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  includePartnerExtras?: boolean;

  @ApiPropertyOptional({
    description: 'Include space option details',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  includeSpaceOption?: boolean;

  @ApiPropertyOptional({
    description: 'Sort by field',
    enum: ['priority', 'createdAt', 'name'],
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

// Bulk Create Space Option Extras DTO
export class BulkCreateSpaceOptionExtrasDto {
  @ApiProperty({
    description: 'Space option ID',
    example: 'uuid-string',
  })
  @IsUUID()
  @IsNotEmpty()
  spaceOptionId: string;

  @ApiProperty({
    description: 'Array of partner extras configurations',
    type: [Object],
  })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => Object)
  extras: {
    partnerExtrasId: string;
    override: SpaceOptionExtrasOverrideDto;
    overrideStockQuantity?: number;
    overrideMinOrderQuantity?: number;
    overrideMaxOrderQuantity?: number;
    isActive?: boolean;
    isIncluded?: boolean;
    isMandatory?: boolean;
    priority?: number;
    spaceSpecificDescription?: string;
    spaceSpecificTerms?: string;
    metadata?: Record<string, any>;
  }[];
}

// Bulk Update Space Option Extras DTO
export class BulkUpdateSpaceOptionExtrasDto {
  @ApiProperty({
    description: 'Array of space option extras IDs to update',
    type: [String],
  })
  @IsArray()
  @ArrayMinSize(1)
  @IsUUID(undefined, { each: true })
  ids: string[];

  @ApiPropertyOptional({
    description: 'New active state for all items',
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  isActive?: boolean;

  @ApiPropertyOptional({
    description: 'New included state for all items',
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  isIncluded?: boolean;

  @ApiPropertyOptional({
    description: 'New mandatory state for all items',
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  isMandatory?: boolean;

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

// Effective Pricing Response DTO
export class EffectivePricingDto {
  @ApiProperty({
    description: 'Effective pricing type',
    example: 'usage_based',
  })
  pricingType: string;

  @ApiProperty({
    description: 'Effective base price',
    example: 75.0,
  })
  basePrice: number;

  @ApiProperty({
    description: 'Currency code',
    example: 'INR',
  })
  currency: string;

  @ApiPropertyOptional({
    description: 'Effective recurring interval',
  })
  recurringInterval?: string;

  @ApiPropertyOptional({
    description: 'Effective recurring count',
  })
  recurringCount?: number;

  @ApiPropertyOptional({
    description: 'Effective usage unit',
  })
  usageUnit?: string;

  @ApiPropertyOptional({
    description: 'Effective minimum usage',
  })
  minUsage?: number;

  @ApiPropertyOptional({
    description: 'Effective maximum usage',
  })
  maxUsage?: number;

  @ApiPropertyOptional({
    description: 'Effective pricing tiers',
    type: [PricingTierDto],
  })
  pricingTiers?: PricingTierDto[];

  @ApiProperty({
    description: 'Source of pricing (original or override)',
    enum: ['original', 'override'],
  })
  source: 'original' | 'override';

  @ApiPropertyOptional({
    description: 'Override details if applicable',
    type: 'object',
  })
  overrideDetails?: {
    overrideType: OverrideType;
    appliedFields: string[];
  };
}

// Effective Stock Response DTO
export class EffectiveStockDto {
  @ApiPropertyOptional({
    description: 'Effective stock quantity',
  })
  stockQuantity?: number;

  @ApiProperty({
    description: 'Effective minimum order quantity',
  })
  minOrderQuantity: number;

  @ApiPropertyOptional({
    description: 'Effective maximum order quantity',
  })
  maxOrderQuantity?: number;

  @ApiProperty({
    description: 'Is stock available',
  })
  isAvailable: boolean;

  @ApiProperty({
    description: 'Source of stock info (original or override)',
    enum: ['original', 'override'],
  })
  source: 'original' | 'override';

  @ApiPropertyOptional({
    description: 'Override details if applicable',
    type: 'object',
  })
  overrideDetails?: {
    appliedFields: string[];
  };
}
