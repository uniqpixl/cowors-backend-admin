import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsDecimal,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsPositive,
  IsString,
  Max,
  Min,
  ValidateIf,
  ValidateNested,
} from 'class-validator';

// Base pricing enums
export enum PricingType {
  FLAT = 'flat',
  RECURRING = 'recurring',
  USAGE_BASED = 'usage_based',
}

export enum RecurringInterval {
  HOURLY = 'hourly',
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  ANNUAL = 'annual',
}

export enum UsageUnit {
  PER_PERSON = 'per_person',
  PER_HOUR = 'per_hour',
  PER_DAY = 'per_day',
  PER_ITEM = 'per_item',
  PER_SESSION = 'per_session',
  PER_BOOKING = 'per_booking',
}

// Pricing tier DTO
export class PricingTierDto {
  @ApiProperty({ description: 'Minimum quantity for this tier' })
  @IsNumber()
  @Min(0)
  minQuantity: number;

  @ApiProperty({
    description: 'Maximum quantity for this tier (null for unlimited)',
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  maxQuantity?: number;

  @ApiProperty({ description: 'Price per unit for this tier' })
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  pricePerUnit: number;
}

// Base pricing schema interface
export interface BasePricingSchema {
  basePrice: number;
  pricingType: PricingType;
  currency?: string;
  recurringInterval?: RecurringInterval;
  recurringCount?: number;
  usageUnit?: UsageUnit;
  minUsage?: number;
  maxUsage?: number;
  usageIncrement?: number;
  pricingTiers?: PricingTierDto[];
}

// Base pricing DTO with validation
export class BasePricingDto implements BasePricingSchema {
  @ApiProperty({ description: 'Base price' })
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  basePrice: number;

  @ApiProperty({ enum: PricingType, description: 'Pricing type' })
  @IsEnum(PricingType)
  pricingType: PricingType;

  @ApiPropertyOptional({ description: 'Currency code', default: 'INR' })
  @IsOptional()
  @IsString()
  currency?: string = 'INR';

  // Recurring pricing fields
  @ApiPropertyOptional({
    enum: RecurringInterval,
    description: 'Recurring interval',
  })
  @ValidateIf((o) => o.pricingType === PricingType.RECURRING)
  @IsEnum(RecurringInterval)
  recurringInterval?: RecurringInterval;

  @ApiPropertyOptional({ description: 'Number of recurring intervals' })
  @ValidateIf((o) => o.pricingType === PricingType.RECURRING)
  @IsOptional()
  @IsNumber()
  @Min(1)
  recurringCount?: number;

  // Usage-based pricing fields
  @ApiPropertyOptional({ enum: UsageUnit, description: 'Usage unit' })
  @ValidateIf((o) => o.pricingType === PricingType.USAGE_BASED)
  @IsEnum(UsageUnit)
  usageUnit?: UsageUnit;

  @ApiPropertyOptional({ description: 'Minimum usage quantity' })
  @ValidateIf((o) => o.pricingType === PricingType.USAGE_BASED)
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  minUsage?: number;

  @ApiPropertyOptional({ description: 'Maximum usage quantity' })
  @ValidateIf((o) => o.pricingType === PricingType.USAGE_BASED)
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  maxUsage?: number;

  @ApiPropertyOptional({ description: 'Usage increment step' })
  @ValidateIf((o) => o.pricingType === PricingType.USAGE_BASED)
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  usageIncrement?: number;

  @ApiPropertyOptional({
    description: 'Tiered pricing structure',
    type: [PricingTierDto],
  })
  @ValidateIf((o) => o.pricingType === PricingType.USAGE_BASED)
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PricingTierDto)
  pricingTiers?: PricingTierDto[];
}

// Enhanced Space Package DTO
export class CreateEnhancedSpacePackageDto extends BasePricingDto {
  @ApiProperty({ description: 'Space option ID' })
  @IsString()
  @IsNotEmpty()
  spaceOptionId: string;

  @ApiProperty({ description: 'Package name' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ description: 'Package description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Package type' })
  @IsOptional()
  @IsString()
  packageType?: string;

  @ApiPropertyOptional({ description: 'Duration in hours' })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  durationHours?: number;

  @ApiPropertyOptional({ description: 'Maximum capacity' })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  maxCapacity?: number;

  @ApiPropertyOptional({ description: 'Minimum capacity' })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  minCapacity?: number;

  @ApiPropertyOptional({ description: 'Included amenities', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  includedAmenities?: string[];

  @ApiPropertyOptional({ description: 'Package features', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  features?: string[];

  @ApiPropertyOptional({ description: 'Terms and conditions' })
  @IsOptional()
  @IsString()
  termsAndConditions?: string;

  @ApiPropertyOptional({ description: 'Cancellation policy' })
  @IsOptional()
  @IsString()
  cancellationPolicy?: string;

  @ApiPropertyOptional({ description: 'Advance booking hours required' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  advanceBookingHours?: number;

  @ApiPropertyOptional({ description: 'Maximum booking hours allowed' })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  maxBookingHours?: number;

  @ApiPropertyOptional({ description: 'Package metadata' })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

// Partner Extras DTO
export class CreatePartnerExtrasDto extends BasePricingDto {
  @ApiProperty({ description: 'Partner ID' })
  @IsString()
  @IsNotEmpty()
  partnerId: string;

  @ApiProperty({ description: 'Extra name' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ description: 'Extra description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Extra category' })
  @IsString()
  @IsNotEmpty()
  category: string;

  @ApiPropertyOptional({ description: 'Stock quantity' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  stockQuantity?: number;

  @ApiPropertyOptional({ description: 'Minimum order quantity' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  minOrderQuantity?: number;

  @ApiPropertyOptional({ description: 'Maximum order quantity' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  maxOrderQuantity?: number;

  @ApiPropertyOptional({ description: 'Requires approval' })
  @IsOptional()
  requiresApproval?: boolean;

  @ApiPropertyOptional({ description: 'Lead time in hours' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  leadTimeHours?: number;

  @ApiPropertyOptional({ description: 'Extra images' })
  @IsOptional()
  @IsArray()
  images?: Array<{
    url: string;
    alt?: string;
    isPrimary?: boolean;
  }>;

  @ApiPropertyOptional({ description: 'Extra specifications' })
  @IsOptional()
  @IsObject()
  specifications?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Terms and conditions' })
  @IsOptional()
  @IsObject()
  termsAndConditions?: {
    description: string;
    cancellationPolicy?: string;
    refundPolicy?: string;
    additionalNotes?: string;
  };
}

// Space Option Extras DTO
export class CreateSpaceOptionExtrasDto {
  @ApiProperty({ description: 'Space option ID' })
  @IsString()
  @IsNotEmpty()
  spaceOptionId: string;

  @ApiProperty({ description: 'Partner extra ID' })
  @IsString()
  @IsNotEmpty()
  partnerExtraId: string;

  @ApiPropertyOptional({ description: 'Override type' })
  @IsOptional()
  @IsString()
  overrideType?: string;

  // Override pricing fields (optional)
  @ApiPropertyOptional({ description: 'Override pricing schema' })
  @IsOptional()
  @ValidateNested()
  @Type(() => BasePricingDto)
  overridePricing?: BasePricingDto;

  @ApiPropertyOptional({ description: 'Override stock quantity' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  overrideStockQuantity?: number;

  @ApiPropertyOptional({ description: 'Override minimum order quantity' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  overrideMinOrderQuantity?: number;

  @ApiPropertyOptional({ description: 'Override maximum order quantity' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  overrideMaxOrderQuantity?: number;

  @ApiPropertyOptional({ description: 'Override requires approval' })
  @IsOptional()
  overrideRequiresApproval?: boolean;

  @ApiPropertyOptional({ description: 'Override lead time in hours' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  overrideLeadTimeHours?: number;

  @ApiPropertyOptional({ description: 'Is included in space option' })
  @IsOptional()
  isIncluded?: boolean;

  @ApiPropertyOptional({ description: 'Is mandatory for space option' })
  @IsOptional()
  isMandatory?: boolean;

  @ApiPropertyOptional({ description: 'Display priority' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  priority?: number;

  @ApiPropertyOptional({ description: 'Space-specific description' })
  @IsOptional()
  @IsString()
  spaceSpecificDescription?: string;

  @ApiPropertyOptional({ description: 'Space-specific terms' })
  @IsOptional()
  @IsObject()
  spaceSpecificTerms?: {
    description?: string;
    cancellationPolicy?: string;
    refundPolicy?: string;
    additionalNotes?: string;
  };
}

// Update DTOs
export class UpdateEnhancedSpacePackageDto {
  @ApiPropertyOptional({ description: 'Package name' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;

  @ApiPropertyOptional({ description: 'Package description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Enhanced pricing schema' })
  @IsOptional()
  @ValidateNested()
  @Type(() => BasePricingDto)
  pricing?: Partial<BasePricingDto>;

  @ApiPropertyOptional({ description: 'Package metadata' })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

export class UpdatePartnerExtrasDto {
  @ApiPropertyOptional({ description: 'Extra name' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;

  @ApiPropertyOptional({ description: 'Extra description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Enhanced pricing schema' })
  @IsOptional()
  @ValidateNested()
  @Type(() => BasePricingDto)
  pricing?: Partial<BasePricingDto>;

  @ApiPropertyOptional({ description: 'Stock quantity' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  stockQuantity?: number;
}

export class UpdateSpaceOptionExtrasDto {
  @ApiPropertyOptional({ description: 'Override type' })
  @IsOptional()
  @IsString()
  overrideType?: string;

  @ApiPropertyOptional({ description: 'Override pricing schema' })
  @IsOptional()
  @ValidateNested()
  @Type(() => BasePricingDto)
  overridePricing?: Partial<BasePricingDto>;

  @ApiPropertyOptional({ description: 'Is included in space option' })
  @IsOptional()
  isIncluded?: boolean;

  @ApiPropertyOptional({ description: 'Is mandatory for space option' })
  @IsOptional()
  isMandatory?: boolean;
}

// Pricing calculation DTOs
export class PricingCalculationRequestDto {
  @ApiProperty({ description: 'Entity type' })
  @IsEnum(['space_package', 'partner_extra', 'space_option_extra'])
  entityType: 'space_package' | 'partner_extra' | 'space_option_extra';

  @ApiProperty({ description: 'Entity ID' })
  @IsString()
  @IsNotEmpty()
  entityId: string;

  @ApiPropertyOptional({ description: 'Quantity' })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  quantity?: number = 1;

  @ApiPropertyOptional({ description: 'Duration (for recurring pricing)' })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  duration?: number = 1;

  @ApiPropertyOptional({
    description: 'Usage amount (for usage-based pricing)',
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  usageAmount?: number;

  @ApiPropertyOptional({ description: 'Additional context' })
  @IsOptional()
  @IsObject()
  context?: Record<string, any>;
}

export class PricingCalculationResponseDto {
  @ApiProperty({ description: 'Base price' })
  basePrice: number;

  @ApiProperty({ description: 'Calculated total price' })
  totalPrice: number;

  @ApiProperty({ description: 'Currency' })
  currency: string;

  @ApiProperty({ description: 'Pricing breakdown' })
  breakdown: {
    baseAmount: number;
    quantity: number;
    duration?: number;
    usageAmount?: number;
    tierApplied?: string;
    discounts?: number;
    taxes?: number;
  };

  @ApiProperty({ description: 'Pricing type used' })
  pricingType: PricingType;

  @ApiPropertyOptional({ description: 'Validation warnings' })
  warnings?: string[];
}
