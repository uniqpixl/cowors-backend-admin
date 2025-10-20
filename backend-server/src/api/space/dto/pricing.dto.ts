import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Matches,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';

// Enhanced Pricing Enums
export enum EnhancedPricingType {
  FLAT = 'flat',
  RECURRING = 'recurring',
  USAGE_BASED = 'usage_based',
}

export enum RecurringInterval {
  HOURLY = 'hourly',
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
}

export enum UsageUnit {
  PER_PERSON = 'per_person',
  PER_HOUR = 'per_hour',
  PER_DAY = 'per_day',
  PER_ITEM = 'per_item',
  PER_SESSION = 'per_session',
}

export enum OverrideType {
  NONE = 'none',
  FLAT = 'flat',
  RECURRING = 'recurring',
  USAGE_BASED = 'usage_based',
  TIERED = 'tiered',
}

// Base Pricing DTO
export class BasePricingDto {
  @ApiProperty({
    enum: EnhancedPricingType,
    description: 'Type of pricing model',
    example: EnhancedPricingType.FLAT,
  })
  @IsEnum(EnhancedPricingType)
  @IsNotEmpty()
  pricingType: EnhancedPricingType;

  @ApiProperty({
    description: 'Base price amount',
    example: 1000.5,
    minimum: 0,
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Transform(({ value }) => parseFloat(value))
  basePrice: number;

  @ApiProperty({
    description: 'Currency code (ISO 4217)',
    example: 'INR',
    minLength: 3,
    maxLength: 3,
  })
  @IsString()
  @Length(3, 3)
  @Matches(/^[A-Z]{3}$/, {
    message: 'Currency must be a valid 3-letter ISO code',
  })
  currency: string;
}

// Recurring Pricing DTO
export class RecurringPricingDto extends BasePricingDto {
  @ApiProperty({
    enum: RecurringInterval,
    description: 'Interval for recurring charges',
    example: RecurringInterval.DAILY,
  })
  @IsEnum(RecurringInterval)
  @IsNotEmpty()
  recurringInterval: RecurringInterval;

  @ApiPropertyOptional({
    description: 'Number of intervals (null for unlimited)',
    example: 30,
    minimum: 1,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Transform(({ value }) => (value ? parseInt(value) : null))
  recurringCount?: number;
}

// Usage-Based Pricing DTO
export class UsageBasedPricingDto extends BasePricingDto {
  @ApiProperty({
    enum: UsageUnit,
    description: 'Unit of measurement for usage',
    example: UsageUnit.PER_PERSON,
  })
  @IsEnum(UsageUnit)
  @IsNotEmpty()
  usageUnit: UsageUnit;

  @ApiPropertyOptional({
    description: 'Minimum usage required',
    example: 1,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Transform(({ value }) => (value ? parseFloat(value) : null))
  minUsage?: number;

  @ApiPropertyOptional({
    description: 'Maximum usage allowed',
    example: 100,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Transform(({ value }) => (value ? parseFloat(value) : null))
  maxUsage?: number;

  @ApiPropertyOptional({
    description: 'Usage increment step',
    example: 0.5,
    minimum: 0.01,
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  @Transform(({ value }) => (value ? parseFloat(value) : null))
  usageIncrement?: number;
}

// Pricing Tier DTO
export class PricingTierDto {
  @ApiProperty({
    description: 'Minimum quantity for this tier',
    example: 1,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  @Transform(({ value }) => parseInt(value))
  minQuantity: number;

  @ApiProperty({
    description: 'Maximum quantity for this tier',
    example: 10,
    minimum: 1,
  })
  @IsNumber()
  @Min(1)
  @Transform(({ value }) => parseInt(value))
  maxQuantity: number;

  @ApiProperty({
    description: 'Price per unit in this tier',
    example: 50.0,
    minimum: 0,
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Transform(({ value }) => parseFloat(value))
  pricePerUnit: number;
}

// Tiered Pricing DTO
export class TieredPricingDto extends UsageBasedPricingDto {
  @ApiProperty({
    description: 'Pricing tiers for usage-based pricing',
    type: [PricingTierDto],
    example: [
      { minQuantity: 1, maxQuantity: 10, pricePerUnit: 100 },
      { minQuantity: 11, maxQuantity: 50, pricePerUnit: 90 },
    ],
  })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => PricingTierDto)
  pricingTiers: PricingTierDto[];
}

// Space Package Pricing DTO
export class SpacePackagePricingDto {
  @ApiProperty({
    enum: EnhancedPricingType,
    description: 'Type of pricing model',
    example: EnhancedPricingType.FLAT,
  })
  @IsEnum(EnhancedPricingType)
  @IsNotEmpty()
  pricingType: EnhancedPricingType;

  @ApiProperty({
    description: 'Base price amount',
    example: 1000.5,
    minimum: 0,
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Transform(({ value }) => parseFloat(value))
  basePrice: number;

  @ApiProperty({
    description: 'Currency code (ISO 4217)',
    example: 'INR',
    minLength: 3,
    maxLength: 3,
  })
  @IsString()
  @Length(3, 3)
  @Matches(/^[A-Z]{3}$/, {
    message: 'Currency must be a valid 3-letter ISO code',
  })
  currency: string;

  // Recurring pricing fields
  @ApiPropertyOptional({
    enum: RecurringInterval,
    description:
      'Interval for recurring charges (required for recurring pricing)',
  })
  @IsOptional()
  @IsEnum(RecurringInterval)
  recurringInterval?: RecurringInterval;

  @ApiPropertyOptional({
    description: 'Number of intervals (null for unlimited)',
    minimum: 1,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Transform(({ value }) => (value ? parseInt(value) : null))
  recurringCount?: number;

  // Usage-based pricing fields
  @ApiPropertyOptional({
    enum: UsageUnit,
    description:
      'Unit of measurement for usage (required for usage-based pricing)',
  })
  @IsOptional()
  @IsEnum(UsageUnit)
  usageUnit?: UsageUnit;

  @ApiPropertyOptional({
    description: 'Minimum usage required',
    minimum: 0,
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Transform(({ value }) => (value ? parseFloat(value) : null))
  minUsage?: number;

  @ApiPropertyOptional({
    description: 'Maximum usage allowed',
    minimum: 0,
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Transform(({ value }) => (value ? parseFloat(value) : null))
  maxUsage?: number;

  @ApiPropertyOptional({
    description: 'Usage increment step',
    minimum: 0.01,
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  @Transform(({ value }) => (value ? parseFloat(value) : null))
  usageIncrement?: number;

  @ApiPropertyOptional({
    description: 'Pricing tiers for usage-based pricing',
    type: [PricingTierDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PricingTierDto)
  pricingTiers?: PricingTierDto[];
}

// Partner Extras Pricing DTO
export class PartnerExtrasPricingDto {
  @ApiProperty({
    enum: EnhancedPricingType,
    description: 'Type of pricing model',
    example: EnhancedPricingType.USAGE_BASED,
  })
  @IsEnum(EnhancedPricingType)
  @IsNotEmpty()
  pricingType: EnhancedPricingType;

  @ApiProperty({
    description: 'Base price amount',
    example: 50.0,
    minimum: 0,
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Transform(({ value }) => parseFloat(value))
  basePrice: number;

  @ApiProperty({
    description: 'Currency code (ISO 4217)',
    example: 'INR',
    minLength: 3,
    maxLength: 3,
  })
  @IsString()
  @Length(3, 3)
  @Matches(/^[A-Z]{3}$/, {
    message: 'Currency must be a valid 3-letter ISO code',
  })
  currency: string;

  // Recurring pricing
  @ApiPropertyOptional({
    enum: RecurringInterval,
    description: 'Interval for recurring charges',
  })
  @IsOptional()
  @IsEnum(RecurringInterval)
  recurringInterval?: RecurringInterval;

  @ApiPropertyOptional({
    description: 'Number of intervals',
    minimum: 1,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Transform(({ value }) => (value ? parseInt(value) : null))
  recurringCount?: number;

  // Usage-based pricing
  @ApiPropertyOptional({
    enum: UsageUnit,
    description: 'Unit of measurement for usage',
  })
  @IsOptional()
  @IsEnum(UsageUnit)
  usageUnit?: UsageUnit;

  @ApiPropertyOptional({
    description: 'Minimum usage required',
    minimum: 0,
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Transform(({ value }) => (value ? parseFloat(value) : null))
  minUsage?: number;

  @ApiPropertyOptional({
    description: 'Maximum usage allowed',
    minimum: 0,
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Transform(({ value }) => (value ? parseFloat(value) : null))
  maxUsage?: number;

  @ApiPropertyOptional({
    description: 'Usage increment step',
    minimum: 0.01,
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  @Transform(({ value }) => (value ? parseFloat(value) : null))
  usageIncrement?: number;

  @ApiPropertyOptional({
    description: 'Pricing tiers for tiered pricing',
    type: [PricingTierDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PricingTierDto)
  pricingTiers?: PricingTierDto[];
}

// Space Option Extras Override DTO
export class SpaceOptionExtrasOverrideDto {
  @ApiProperty({
    enum: OverrideType,
    description: 'Type of pricing override',
    example: OverrideType.FLAT,
  })
  @IsEnum(OverrideType)
  @IsNotEmpty()
  overrideType: OverrideType;

  // Flat override
  @ApiPropertyOptional({
    description: 'Override flat price',
    minimum: 0,
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Transform(({ value }) => (value ? parseFloat(value) : null))
  overrideFlatPrice?: number;

  // Recurring override
  @ApiPropertyOptional({
    enum: RecurringInterval,
    description: 'Override recurring interval',
  })
  @IsOptional()
  @IsEnum(RecurringInterval)
  overrideRecurringInterval?: RecurringInterval;

  @ApiPropertyOptional({
    description: 'Override recurring price',
    minimum: 0,
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Transform(({ value }) => (value ? parseFloat(value) : null))
  overrideRecurringPrice?: number;

  @ApiPropertyOptional({
    description: 'Override recurring count',
    minimum: 1,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Transform(({ value }) => (value ? parseInt(value) : null))
  overrideRecurringCount?: number;

  // Usage-based override
  @ApiPropertyOptional({
    enum: UsageUnit,
    description: 'Override usage unit',
  })
  @IsOptional()
  @IsEnum(UsageUnit)
  overrideUsageUnit?: UsageUnit;

  @ApiPropertyOptional({
    description: 'Override usage price',
    minimum: 0,
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Transform(({ value }) => (value ? parseFloat(value) : null))
  overrideUsagePrice?: number;

  @ApiPropertyOptional({
    description: 'Override minimum usage',
    minimum: 0,
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Transform(({ value }) => (value ? parseFloat(value) : null))
  overrideMinUsage?: number;

  @ApiPropertyOptional({
    description: 'Override maximum usage',
    minimum: 0,
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Transform(({ value }) => (value ? parseFloat(value) : null))
  overrideMaxUsage?: number;

  // Tiered override
  @ApiPropertyOptional({
    description: 'Override pricing tiers',
    type: [PricingTierDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PricingTierDto)
  overridePricingTiers?: PricingTierDto[];
}

// Create Space Package DTO
export class CreateSpacePackageDto {
  @ApiProperty({
    description: 'Space option ID',
    example: 'uuid-string',
  })
  @IsUUID()
  @IsNotEmpty()
  spaceOptionId: string;

  @ApiProperty({
    description: 'Package name',
    example: 'Premium Meeting Room Package',
    minLength: 1,
    maxLength: 255,
  })
  @IsString()
  @IsNotEmpty()
  @Length(1, 255)
  name: string;

  @ApiPropertyOptional({
    description: 'Package description',
    example: 'Includes meeting room, projector, and refreshments',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: 'Package pricing configuration',
    type: SpacePackagePricingDto,
  })
  @ValidateNested()
  @Type(() => SpacePackagePricingDto)
  pricing: SpacePackagePricingDto;

  @ApiPropertyOptional({
    description: 'Duration in hours (for legacy compatibility)',
    minimum: 1,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Transform(({ value }) => (value ? parseInt(value) : null))
  durationHours?: number;

  @ApiPropertyOptional({
    description: 'Maximum capacity',
    minimum: 1,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Transform(({ value }) => (value ? parseInt(value) : null))
  maxCapacity?: number;

  @ApiPropertyOptional({
    description: 'Minimum capacity',
    minimum: 1,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Transform(({ value }) => (value ? parseInt(value) : null))
  minCapacity?: number;

  @ApiPropertyOptional({
    description: 'Included amenities',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  includedAmenities?: string[];

  @ApiPropertyOptional({
    description: 'Package features',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  features?: string[];

  @ApiPropertyOptional({
    description: 'Terms and conditions',
  })
  @IsOptional()
  @IsString()
  termsAndConditions?: string;

  @ApiPropertyOptional({
    description: 'Cancellation policy',
  })
  @IsOptional()
  @IsString()
  cancellationPolicy?: string;

  @ApiPropertyOptional({
    description: 'Advance booking hours required',
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Transform(({ value }) => (value ? parseInt(value) : null))
  advanceBookingHours?: number;

  @ApiPropertyOptional({
    description: 'Maximum booking hours allowed',
    minimum: 1,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Transform(({ value }) => (value ? parseInt(value) : null))
  maxBookingHours?: number;

  @ApiPropertyOptional({
    description: 'Package priority',
    minimum: 0,
    maximum: 100,
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

// Update Space Package DTO
export class UpdateSpacePackageDto {
  @ApiPropertyOptional({
    description: 'Package name',
    minLength: 1,
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @Length(1, 255)
  name?: string;

  @ApiPropertyOptional({
    description: 'Package description',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'Package pricing configuration',
    type: SpacePackagePricingDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => SpacePackagePricingDto)
  pricing?: SpacePackagePricingDto;

  @ApiPropertyOptional({
    description: 'Duration in hours',
    minimum: 1,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Transform(({ value }) => (value ? parseInt(value) : null))
  durationHours?: number;

  @ApiPropertyOptional({
    description: 'Maximum capacity',
    minimum: 1,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Transform(({ value }) => (value ? parseInt(value) : null))
  maxCapacity?: number;

  @ApiPropertyOptional({
    description: 'Minimum capacity',
    minimum: 1,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Transform(({ value }) => (value ? parseInt(value) : null))
  minCapacity?: number;

  @ApiPropertyOptional({
    description: 'Included amenities',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  includedAmenities?: string[];

  @ApiPropertyOptional({
    description: 'Package features',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  features?: string[];

  @ApiPropertyOptional({
    description: 'Terms and conditions',
  })
  @IsOptional()
  @IsString()
  termsAndConditions?: string;

  @ApiPropertyOptional({
    description: 'Cancellation policy',
  })
  @IsOptional()
  @IsString()
  cancellationPolicy?: string;

  @ApiPropertyOptional({
    description: 'Advance booking hours required',
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Transform(({ value }) => (value ? parseInt(value) : null))
  advanceBookingHours?: number;

  @ApiPropertyOptional({
    description: 'Maximum booking hours allowed',
    minimum: 1,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Transform(({ value }) => (value ? parseInt(value) : null))
  maxBookingHours?: number;

  @ApiPropertyOptional({
    description: 'Is package active',
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  isActive?: boolean;

  @ApiPropertyOptional({
    description: 'Package priority',
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

// Price Calculation Request DTO
export class PriceCalculationRequestDto {
  @ApiProperty({
    description: 'Pricing configuration',
    oneOf: [
      { $ref: '#/components/schemas/SpacePackagePricingDto' },
      { $ref: '#/components/schemas/PartnerExtrasPricingDto' },
    ],
  })
  @ValidateNested()
  @Type(() => Object)
  pricing: SpacePackagePricingDto | PartnerExtrasPricingDto;

  @ApiPropertyOptional({
    description: 'Quantity for usage-based pricing',
    minimum: 0,
    default: 1,
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Transform(({ value }) => (value ? parseFloat(value) : 1))
  quantity?: number;

  @ApiPropertyOptional({
    description: 'Duration for recurring pricing',
    minimum: 1,
    default: 1,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Transform(({ value }) => (value ? parseInt(value) : 1))
  duration?: number;

  @ApiPropertyOptional({
    description: 'Start date for pricing calculation',
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({
    description: 'End date for pricing calculation',
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}

// Price Calculation Response DTO
export class PriceCalculationResponseDto {
  @ApiProperty({
    description: 'Calculated total price',
    example: 1500.0,
  })
  totalPrice: number;

  @ApiProperty({
    description: 'Currency code',
    example: 'INR',
  })
  currency: string;

  @ApiProperty({
    description: 'Pricing breakdown',
    example: {
      basePrice: 1000,
      quantity: 1.5,
      duration: 1,
      subtotal: 1500,
      discounts: 0,
      taxes: 0,
    },
  })
  breakdown: {
    basePrice: number;
    quantity: number;
    duration: number;
    subtotal: number;
    discounts: number;
    taxes: number;
    [key: string]: any;
  };

  @ApiProperty({
    description: 'Applied pricing rules',
    type: [String],
  })
  appliedRules: string[];

  @ApiPropertyOptional({
    description: 'Validation warnings',
    type: [String],
  })
  warnings?: string[];
}
