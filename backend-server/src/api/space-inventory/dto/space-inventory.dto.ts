import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsDateString,
  IsDecimal,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  Length,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';

// Enums
export enum PackageType {
  HOT_DESK = 'hot_desk',
  DEDICATED_DESK = 'dedicated_desk',
  PRIVATE_OFFICE = 'private_office',
  MEETING_ROOM = 'meeting_room',
  CONFERENCE_ROOM = 'conference_room',
  EVENT_SPACE = 'event_space',
  VIRTUAL_OFFICE = 'virtual_office',
  STORAGE_UNIT = 'storage_unit',
}

export enum ExtrasType {
  PARKING = 'parking',
  LOCKER = 'locker',
  PRINTING = 'printing',
  PHONE_BOOTH = 'phone_booth',
  WHITEBOARD = 'whiteboard',
  PROJECTOR = 'projector',
  CATERING = 'catering',
  CLEANING = 'cleaning',
  SECURITY = 'security',
  WIFI_UPGRADE = 'wifi_upgrade',
  STORAGE = 'storage',
  MAIL_HANDLING = 'mail_handling',
}

export enum InventoryStatus {
  AVAILABLE = 'available',
  OCCUPIED = 'occupied',
  RESERVED = 'reserved',
  MAINTENANCE = 'maintenance',
  OUT_OF_ORDER = 'out_of_order',
  CLEANING = 'cleaning',
  SETUP = 'setup',
  BLOCKED = 'blocked',
}

export enum PricingType {
  FIXED = 'fixed',
  HOURLY = 'hourly',
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  YEARLY = 'yearly',
  USAGE_BASED = 'usage_based',
}

export enum DiscountType {
  PERCENTAGE = 'percentage',
  FIXED_AMOUNT = 'fixed_amount',
  BUY_X_GET_Y = 'buy_x_get_y',
}

export enum ExportFormat {
  CSV = 'csv',
  EXCEL = 'excel',
  PDF = 'pdf',
  JSON = 'json',
}

export enum ExportStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  EXPIRED = 'expired',
}

export enum BulkOperationType {
  UPDATE_STATUS = 'update_status',
  ADJUST_STOCK = 'adjust_stock',
  UPDATE_PRICING = 'update_pricing',
  DELETE = 'delete',
  RESERVE = 'reserve',
  RELEASE = 'release',
}

export enum ReportType {
  INVENTORY = 'inventory',
  BOOKINGS = 'bookings',
  REVENUE = 'revenue',
  UTILIZATION = 'utilization',
  MAINTENANCE = 'maintenance',
}

// Space Package DTOs
export class CreateSpacePackageDto {
  @ApiProperty({ description: 'Package name' })
  @IsString()
  @IsNotEmpty()
  @Length(1, 100)
  name: string;

  @ApiProperty({ description: 'Package description' })
  @IsString()
  @IsNotEmpty()
  @Length(1, 500)
  description: string;

  @ApiProperty({ enum: PackageType, description: 'Package type' })
  @IsEnum(PackageType)
  type: PackageType;

  @ApiProperty({ description: 'Base price' })
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  basePrice: number;

  @ApiProperty({ enum: PricingType, description: 'Pricing type' })
  @IsEnum(PricingType)
  pricingType: PricingType;

  @ApiProperty({ description: 'Maximum capacity' })
  @IsNumber()
  @IsPositive()
  @Max(1000)
  capacity: number;

  @ApiProperty({ description: 'Floor area in square feet' })
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  area: number;

  @ApiProperty({ description: 'Location/building' })
  @IsString()
  @IsNotEmpty()
  @Length(1, 100)
  location: string;

  @ApiProperty({ description: 'Floor number' })
  @IsString()
  @IsNotEmpty()
  floor: string;

  @ApiPropertyOptional({ description: 'Room/space number' })
  @IsOptional()
  @IsString()
  roomNumber?: string;

  @ApiPropertyOptional({ description: 'Package features', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  features?: string[];

  @ApiPropertyOptional({ description: 'Package amenities', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  amenities?: string[];

  @ApiPropertyOptional({ description: 'Package images', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];

  @ApiPropertyOptional({ description: 'Minimum booking duration in hours' })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  minBookingDuration?: number;

  @ApiPropertyOptional({ description: 'Maximum booking duration in hours' })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  maxBookingDuration?: number;

  @ApiPropertyOptional({ description: 'Advance booking required in hours' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  advanceBookingRequired?: number;

  @ApiPropertyOptional({ description: 'Cancellation policy' })
  @IsOptional()
  @IsString()
  cancellationPolicy?: string;

  @ApiPropertyOptional({ description: 'Terms and conditions' })
  @IsOptional()
  @IsString()
  termsAndConditions?: string;

  @ApiPropertyOptional({ description: 'Package metadata' })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Is package active', default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Initial inventory quantity' })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  initialQuantity?: number;

  @ApiPropertyOptional({ description: 'Low stock threshold' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  lowStockThreshold?: number;
}

export class UpdateSpacePackageDto {
  @ApiPropertyOptional({ description: 'Package name' })
  @IsOptional()
  @IsString()
  @Length(1, 100)
  name?: string;

  @ApiPropertyOptional({ description: 'Package description' })
  @IsOptional()
  @IsString()
  @Length(1, 500)
  description?: string;

  @ApiPropertyOptional({ description: 'Base price' })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  basePrice?: number;

  @ApiPropertyOptional({ enum: PricingType, description: 'Pricing type' })
  @IsOptional()
  @IsEnum(PricingType)
  pricingType?: PricingType;

  @ApiPropertyOptional({ description: 'Maximum capacity' })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  @Max(1000)
  capacity?: number;

  @ApiPropertyOptional({ description: 'Floor area in square feet' })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  area?: number;

  @ApiPropertyOptional({ description: 'Location/building' })
  @IsOptional()
  @IsString()
  @Length(1, 100)
  location?: string;

  @ApiPropertyOptional({ description: 'Floor number' })
  @IsOptional()
  @IsString()
  floor?: string;

  @ApiPropertyOptional({ description: 'Room/space number' })
  @IsOptional()
  @IsString()
  roomNumber?: string;

  @ApiPropertyOptional({ description: 'Package features', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  features?: string[];

  @ApiPropertyOptional({ description: 'Package amenities', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  amenities?: string[];

  @ApiPropertyOptional({ description: 'Package images', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];

  @ApiPropertyOptional({ description: 'Minimum booking duration in hours' })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  minBookingDuration?: number;

  @ApiPropertyOptional({ description: 'Maximum booking duration in hours' })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  maxBookingDuration?: number;

  @ApiPropertyOptional({ description: 'Advance booking required in hours' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  advanceBookingRequired?: number;

  @ApiPropertyOptional({ description: 'Cancellation policy' })
  @IsOptional()
  @IsString()
  cancellationPolicy?: string;

  @ApiPropertyOptional({ description: 'Terms and conditions' })
  @IsOptional()
  @IsString()
  termsAndConditions?: string;

  @ApiPropertyOptional({ description: 'Package metadata' })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Is package active' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class GetSpacePackagesDto {
  @ApiPropertyOptional({ description: 'Page number', default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Items per page', default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @ApiPropertyOptional({ description: 'Search term' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    enum: PackageType,
    description: 'Package type filter',
  })
  @IsOptional()
  @IsEnum(PackageType)
  type?: PackageType;

  @ApiPropertyOptional({ description: 'Status filter' })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ description: 'Location filter' })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional({ description: 'Minimum price filter' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minPrice?: number;

  @ApiPropertyOptional({ description: 'Maximum price filter' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  maxPrice?: number;

  @ApiPropertyOptional({ description: 'Minimum capacity filter' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  minCapacity?: number;

  @ApiPropertyOptional({ description: 'Maximum capacity filter' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  maxCapacity?: number;

  @ApiPropertyOptional({ description: 'Sort by field' })
  @IsOptional()
  @IsString()
  sortBy?: string;

  @ApiPropertyOptional({ description: 'Sort order', enum: ['ASC', 'DESC'] })
  @IsOptional()
  @IsEnum(['ASC', 'DESC'])
  sortOrder?: 'ASC' | 'DESC';
}

export class SpacePackageResponseDto {
  @ApiProperty({ description: 'Package ID' })
  id: string;

  @ApiProperty({ description: 'Package name' })
  name: string;

  @ApiProperty({ description: 'Package description' })
  description: string;

  @ApiProperty({ enum: PackageType, description: 'Package type' })
  type: PackageType;

  @ApiProperty({ description: 'Base price' })
  basePrice: number;

  @ApiProperty({ enum: PricingType, description: 'Pricing type' })
  pricingType: PricingType;

  @ApiProperty({ description: 'Maximum capacity' })
  capacity: number;

  @ApiProperty({ description: 'Floor area in square feet' })
  area: number;

  @ApiProperty({ description: 'Location/building' })
  location: string;

  @ApiProperty({ description: 'Floor number' })
  floor: string;

  @ApiPropertyOptional({ description: 'Room/space number' })
  roomNumber?: string;

  @ApiPropertyOptional({ description: 'Package features', type: [String] })
  features?: string[];

  @ApiPropertyOptional({ description: 'Package amenities', type: [String] })
  amenities?: string[];

  @ApiPropertyOptional({ description: 'Package images', type: [String] })
  images?: string[];

  @ApiPropertyOptional({ description: 'Minimum booking duration in hours' })
  minBookingDuration?: number;

  @ApiPropertyOptional({ description: 'Maximum booking duration in hours' })
  maxBookingDuration?: number;

  @ApiPropertyOptional({ description: 'Advance booking required in hours' })
  advanceBookingRequired?: number;

  @ApiPropertyOptional({ description: 'Cancellation policy' })
  cancellationPolicy?: string;

  @ApiPropertyOptional({ description: 'Terms and conditions' })
  termsAndConditions?: string;

  @ApiPropertyOptional({ description: 'Package metadata' })
  metadata?: Record<string, any>;

  @ApiProperty({ description: 'Is package active' })
  isActive: boolean;

  @ApiProperty({ description: 'Creation date' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update date' })
  updatedAt: Date;

  @ApiPropertyOptional({ description: 'Created by user ID' })
  createdBy?: string;

  @ApiPropertyOptional({ description: 'Updated by user ID' })
  updatedBy?: string;
}

// Extras DTOs
export class CreateExtrasDto {
  @ApiProperty({ description: 'Extras name' })
  @IsString()
  @IsNotEmpty()
  @Length(1, 100)
  name: string;

  @ApiProperty({ description: 'Extras description' })
  @IsString()
  @IsNotEmpty()
  @Length(1, 500)
  description: string;

  @ApiProperty({ enum: ExtrasType, description: 'Extras type' })
  @IsEnum(ExtrasType)
  type: ExtrasType;

  @ApiProperty({ description: 'Extras price' })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  price: number;

  @ApiProperty({ enum: PricingType, description: 'Pricing type' })
  @IsEnum(PricingType)
  pricingType: PricingType;

  @ApiPropertyOptional({ description: 'Available quantity' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  quantity?: number;

  @ApiPropertyOptional({ description: 'Extras category' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ description: 'Extras tags', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({ description: 'Extras images', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];

  @ApiPropertyOptional({ description: 'Extras metadata' })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Is extras active', default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateExtrasDto {
  @ApiPropertyOptional({ description: 'Extras name' })
  @IsOptional()
  @IsString()
  @Length(1, 100)
  name?: string;

  @ApiPropertyOptional({ description: 'Extras description' })
  @IsOptional()
  @IsString()
  @Length(1, 500)
  description?: string;

  @ApiPropertyOptional({ description: 'Extras price' })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  price?: number;

  @ApiPropertyOptional({ enum: PricingType, description: 'Pricing type' })
  @IsOptional()
  @IsEnum(PricingType)
  pricingType?: PricingType;

  @ApiPropertyOptional({ description: 'Available quantity' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  quantity?: number;

  @ApiPropertyOptional({ description: 'Extras category' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ description: 'Extras tags', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({ description: 'Extras images', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];

  @ApiPropertyOptional({ description: 'Extras metadata' })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Is extras active' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class GetExtrasDto {
  @ApiPropertyOptional({ description: 'Page number', default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Items per page', default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @ApiPropertyOptional({ description: 'Search term' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: ExtrasType, description: 'Extras type filter' })
  @IsOptional()
  @IsEnum(ExtrasType)
  type?: ExtrasType;

  @ApiPropertyOptional({ description: 'Status filter' })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ description: 'Category filter' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ description: 'Sort by field' })
  @IsOptional()
  @IsString()
  sortBy?: string;

  @ApiPropertyOptional({ description: 'Sort order', enum: ['ASC', 'DESC'] })
  @IsOptional()
  @IsEnum(['ASC', 'DESC'])
  sortOrder?: 'ASC' | 'DESC';
}

export class ExtrasResponseDto {
  @ApiProperty({ description: 'Extras ID' })
  id: string;

  @ApiProperty({ description: 'Extras name' })
  name: string;

  @ApiProperty({ description: 'Extras description' })
  description: string;

  @ApiProperty({ enum: ExtrasType, description: 'Extras type' })
  type: ExtrasType;

  @ApiProperty({ description: 'Extras price' })
  price: number;

  @ApiProperty({ enum: PricingType, description: 'Pricing type' })
  pricingType: PricingType;

  @ApiPropertyOptional({ description: 'Available quantity' })
  quantity?: number;

  @ApiPropertyOptional({ description: 'Extras category' })
  category?: string;

  @ApiPropertyOptional({ description: 'Extras tags', type: [String] })
  tags?: string[];

  @ApiPropertyOptional({ description: 'Extras images', type: [String] })
  images?: string[];

  @ApiPropertyOptional({ description: 'Extras metadata' })
  metadata?: Record<string, any>;

  @ApiProperty({ description: 'Is extras active' })
  isActive: boolean;

  @ApiProperty({ description: 'Creation date' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update date' })
  updatedAt: Date;

  @ApiPropertyOptional({ description: 'Created by user ID' })
  createdBy?: string;

  @ApiPropertyOptional({ description: 'Updated by user ID' })
  updatedBy?: string;
}

// Inventory DTOs
export class CreateInventoryDto {
  @ApiProperty({ description: 'Space package ID' })
  @IsUUID()
  spacePackageId: string;

  @ApiProperty({ description: 'Total quantity available' })
  @IsNumber()
  @IsPositive()
  totalQuantity: number;

  @ApiProperty({ description: 'Currently available quantity' })
  @IsNumber()
  @Min(0)
  availableQuantity: number;

  @ApiProperty({ description: 'Reserved quantity' })
  @IsNumber()
  @Min(0)
  reservedQuantity: number;

  @ApiProperty({ enum: InventoryStatus, description: 'Inventory status' })
  @IsEnum(InventoryStatus)
  status: InventoryStatus;

  @ApiPropertyOptional({ description: 'Low stock threshold' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  lowStockThreshold?: number;

  @ApiPropertyOptional({ description: 'Reorder point' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  reorderPoint?: number;

  @ApiPropertyOptional({ description: 'Maximum stock level' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  maxStockLevel?: number;

  @ApiPropertyOptional({ description: 'Location details' })
  @IsOptional()
  @IsString()
  locationDetails?: string;

  @ApiPropertyOptional({ description: 'Notes' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ description: 'Inventory metadata' })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

export class UpdateInventoryDto {
  @ApiPropertyOptional({ description: 'Total quantity available' })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  totalQuantity?: number;

  @ApiPropertyOptional({ description: 'Currently available quantity' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  availableQuantity?: number;

  @ApiPropertyOptional({ description: 'Reserved quantity' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  reservedQuantity?: number;

  @ApiPropertyOptional({
    enum: InventoryStatus,
    description: 'Inventory status',
  })
  @IsOptional()
  @IsEnum(InventoryStatus)
  status?: InventoryStatus;

  @ApiPropertyOptional({ description: 'Low stock threshold' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  lowStockThreshold?: number;

  @ApiPropertyOptional({ description: 'Reorder point' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  reorderPoint?: number;

  @ApiPropertyOptional({ description: 'Maximum stock level' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  maxStockLevel?: number;

  @ApiPropertyOptional({ description: 'Location details' })
  @IsOptional()
  @IsString()
  locationDetails?: string;

  @ApiPropertyOptional({ description: 'Notes' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ description: 'Inventory metadata' })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

export class GetInventoryDto {
  @ApiPropertyOptional({ description: 'Page number', default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Items per page', default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @ApiPropertyOptional({ description: 'Search term' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: InventoryStatus, description: 'Status filter' })
  @IsOptional()
  @IsEnum(InventoryStatus)
  status?: InventoryStatus;

  @ApiPropertyOptional({ description: 'Location filter' })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional({ description: 'Low stock filter' })
  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  lowStock?: boolean;

  @ApiPropertyOptional({ description: 'Space package ID filter' })
  @IsOptional()
  @IsUUID()
  spacePackageId?: string;

  @ApiPropertyOptional({ description: 'Sort by field' })
  @IsOptional()
  @IsString()
  sortBy?: string;

  @ApiPropertyOptional({ description: 'Sort order', enum: ['ASC', 'DESC'] })
  @IsOptional()
  @IsEnum(['ASC', 'DESC'])
  sortOrder?: 'ASC' | 'DESC';
}

export class InventoryResponseDto {
  @ApiProperty({ description: 'Inventory ID' })
  id: string;

  @ApiProperty({ description: 'Space package ID' })
  spacePackageId: string;

  @ApiProperty({ description: 'Space package details' })
  spacePackage: SpacePackageResponseDto;

  @ApiProperty({ description: 'Total quantity available' })
  totalQuantity: number;

  @ApiProperty({ description: 'Currently available quantity' })
  availableQuantity: number;

  @ApiProperty({ description: 'Reserved quantity' })
  reservedQuantity: number;

  @ApiProperty({ enum: InventoryStatus, description: 'Inventory status' })
  status: InventoryStatus;

  @ApiPropertyOptional({ description: 'Low stock threshold' })
  lowStockThreshold?: number;

  @ApiPropertyOptional({ description: 'Reorder point' })
  reorderPoint?: number;

  @ApiPropertyOptional({ description: 'Maximum stock level' })
  maxStockLevel?: number;

  @ApiPropertyOptional({ description: 'Location details' })
  locationDetails?: string;

  @ApiPropertyOptional({ description: 'Notes' })
  notes?: string;

  @ApiPropertyOptional({ description: 'Inventory metadata' })
  metadata?: Record<string, any>;

  @ApiProperty({ description: 'Creation date' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update date' })
  updatedAt: Date;

  @ApiPropertyOptional({ description: 'Created by user ID' })
  createdBy?: string;

  @ApiPropertyOptional({ description: 'Updated by user ID' })
  updatedBy?: string;
}

// Bulk Operations DTOs
export class BulkInventoryOperationDto {
  @ApiProperty({ description: 'Inventory IDs', type: [String] })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(100)
  @IsUUID(4, { each: true })
  inventoryIds: string[];

  @ApiProperty({ enum: BulkOperationType, description: 'Operation type' })
  @IsEnum(BulkOperationType)
  operation: BulkOperationType;

  @ApiPropertyOptional({ description: 'Operation data' })
  @IsOptional()
  @IsObject()
  data?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Operation reason' })
  @IsOptional()
  @IsString()
  reason?: string;
}

export class BulkOperationResponseDto {
  @ApiProperty({ description: 'Total items processed' })
  totalProcessed: number;

  @ApiProperty({ description: 'Successfully processed items' })
  successCount: number;

  @ApiProperty({ description: 'Failed items' })
  failureCount: number;

  @ApiProperty({ description: 'Processing errors', type: [String] })
  errors: string[];

  @ApiProperty({ description: 'Operation details' })
  details: Record<string, any>;
}

// Pricing DTOs
export class CreatePricingRuleDto {
  @ApiProperty({ description: 'Rule name' })
  @IsString()
  @IsNotEmpty()
  @Length(1, 100)
  name: string;

  @ApiProperty({ description: 'Rule description' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiPropertyOptional({ description: 'Space package ID' })
  @IsOptional()
  @IsUUID()
  spacePackageId?: string;

  @ApiPropertyOptional({ description: 'Extras ID' })
  @IsOptional()
  @IsUUID()
  extrasId?: string;

  @ApiProperty({ enum: DiscountType, description: 'Discount type' })
  @IsEnum(DiscountType)
  discountType: DiscountType;

  @ApiProperty({ description: 'Discount value' })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  discountValue: number;

  @ApiPropertyOptional({ description: 'Minimum quantity for discount' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  minQuantity?: number;

  @ApiPropertyOptional({ description: 'Maximum quantity for discount' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  maxQuantity?: number;

  @ApiPropertyOptional({ description: 'Minimum duration for discount (hours)' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  minDuration?: number;

  @ApiPropertyOptional({ description: 'Valid from date' })
  @IsOptional()
  @IsDateString()
  validFrom?: string;

  @ApiPropertyOptional({ description: 'Valid until date' })
  @IsOptional()
  @IsDateString()
  validUntil?: string;

  @ApiPropertyOptional({ description: 'Rule conditions' })
  @IsOptional()
  @IsObject()
  conditions?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Is rule active', default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdatePricingRuleDto {
  @ApiPropertyOptional({ description: 'Rule name' })
  @IsOptional()
  @IsString()
  @Length(1, 100)
  name?: string;

  @ApiPropertyOptional({ description: 'Rule description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ enum: DiscountType, description: 'Discount type' })
  @IsOptional()
  @IsEnum(DiscountType)
  discountType?: DiscountType;

  @ApiPropertyOptional({ description: 'Discount value' })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  discountValue?: number;

  @ApiPropertyOptional({ description: 'Minimum quantity for discount' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  minQuantity?: number;

  @ApiPropertyOptional({ description: 'Maximum quantity for discount' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  maxQuantity?: number;

  @ApiPropertyOptional({ description: 'Minimum duration for discount (hours)' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  minDuration?: number;

  @ApiPropertyOptional({ description: 'Valid from date' })
  @IsOptional()
  @IsDateString()
  validFrom?: string;

  @ApiPropertyOptional({ description: 'Valid until date' })
  @IsOptional()
  @IsDateString()
  validUntil?: string;

  @ApiPropertyOptional({ description: 'Rule conditions' })
  @IsOptional()
  @IsObject()
  conditions?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Is rule active' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class PricingRuleResponseDto {
  @ApiProperty({ description: 'Rule ID' })
  id: string;

  @ApiProperty({ description: 'Rule name' })
  name: string;

  @ApiProperty({ description: 'Rule description' })
  description: string;

  @ApiPropertyOptional({ description: 'Space package ID' })
  spacePackageId?: string;

  @ApiPropertyOptional({ description: 'Extras ID' })
  extrasId?: string;

  @ApiProperty({ enum: DiscountType, description: 'Discount type' })
  discountType: DiscountType;

  @ApiProperty({ description: 'Discount value' })
  discountValue: number;

  @ApiPropertyOptional({ description: 'Minimum quantity for discount' })
  minQuantity?: number;

  @ApiPropertyOptional({ description: 'Maximum quantity for discount' })
  maxQuantity?: number;

  @ApiPropertyOptional({ description: 'Minimum duration for discount (hours)' })
  minDuration?: number;

  @ApiPropertyOptional({ description: 'Valid from date' })
  validFrom?: Date;

  @ApiPropertyOptional({ description: 'Valid until date' })
  validUntil?: Date;

  @ApiPropertyOptional({ description: 'Rule conditions' })
  conditions?: Record<string, any>;

  @ApiProperty({ description: 'Is rule active' })
  isActive: boolean;

  @ApiProperty({ description: 'Creation date' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update date' })
  updatedAt: Date;

  @ApiPropertyOptional({ description: 'Created by user ID' })
  createdBy?: string;

  @ApiPropertyOptional({ description: 'Updated by user ID' })
  updatedBy?: string;
}

export class CalculatePricingDto {
  @ApiProperty({ description: 'Space package ID' })
  @IsUUID()
  spacePackageId: string;

  @ApiProperty({ description: 'Booking duration in hours' })
  @IsNumber()
  @IsPositive()
  duration: number;

  @ApiProperty({ description: 'Quantity' })
  @IsNumber()
  @IsPositive()
  quantity: number;

  @ApiPropertyOptional({ description: 'Extras IDs', type: [String] })
  @IsOptional()
  @IsArray()
  @IsUUID(4, { each: true })
  extrasIds?: string[];

  @ApiPropertyOptional({ description: 'Booking start date' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'Customer type' })
  @IsOptional()
  @IsString()
  customerType?: string;

  @ApiPropertyOptional({ description: 'Promo code' })
  @IsOptional()
  @IsString()
  promoCode?: string;
}

export class PricingCalculationResponseDto {
  @ApiProperty({ description: 'Base price' })
  basePrice: number;

  @ApiProperty({ description: 'Extras total price' })
  extrasPrice: number;

  @ApiProperty({ description: 'Subtotal before discounts' })
  subtotal: number;

  @ApiProperty({ description: 'Total discount amount' })
  discountAmount: number;

  @ApiProperty({ description: 'Tax amount' })
  taxAmount: number;

  @ApiProperty({ description: 'Final total price' })
  totalPrice: number;

  @ApiProperty({ description: 'Applied pricing rules' })
  appliedRules: PricingRuleResponseDto[];

  @ApiProperty({ description: 'Pricing breakdown' })
  breakdown: Record<string, any>;
}

// Analytics DTOs
export class InventoryAnalyticsDto {
  @ApiPropertyOptional({ description: 'Start date for analytics' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'End date for analytics' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ description: 'Location filter' })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional({ description: 'Group by field' })
  @IsOptional()
  @IsString()
  groupBy?: string;

  @ApiPropertyOptional({ description: 'Metrics to include', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  metrics?: string[];
}

export class InventoryAnalyticsResponseDto {
  @ApiProperty({ description: 'Total spaces' })
  totalSpaces: number;

  @ApiProperty({ description: 'Available spaces' })
  availableSpaces: number;

  @ApiProperty({ description: 'Occupied spaces' })
  occupiedSpaces: number;

  @ApiProperty({ description: 'Reserved spaces' })
  reservedSpaces: number;

  @ApiProperty({ description: 'Utilization rate' })
  utilizationRate: number;

  @ApiProperty({ description: 'Revenue per space' })
  revenuePerSpace: number;

  @ApiProperty({ description: 'Popular space types' })
  popularSpaceTypes: Record<string, number>;

  @ApiProperty({ description: 'Low stock alerts' })
  lowStockAlerts: number;

  @ApiProperty({ description: 'Inventory trends' })
  trends: Record<string, any>;

  @ApiProperty({ description: 'Analytics period' })
  period: { startDate: Date; endDate: Date };
}

export class InventorySummaryResponseDto {
  @ApiProperty({ description: 'Total inventory items' })
  totalItems: number;

  @ApiProperty({ description: 'Active items' })
  activeItems: number;

  @ApiProperty({ description: 'Inactive items' })
  inactiveItems: number;

  @ApiProperty({ description: 'Low stock items' })
  lowStockItems: number;

  @ApiProperty({ description: 'Out of stock items' })
  outOfStockItems: number;

  @ApiProperty({ description: 'Total value' })
  totalValue: number;

  @ApiProperty({ description: 'Status breakdown' })
  statusBreakdown: Record<string, number>;

  @ApiProperty({ description: 'Location breakdown' })
  locationBreakdown: Record<string, number>;

  @ApiProperty({ description: 'Type breakdown' })
  typeBreakdown: Record<string, number>;
}

// Export DTOs
export class ExportInventoryDto {
  @ApiProperty({ enum: ExportFormat, description: 'Export format' })
  @IsEnum(ExportFormat)
  format: ExportFormat;

  @ApiPropertyOptional({ description: 'Export filters' })
  @IsOptional()
  @IsObject()
  filters?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Fields to include', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  fields?: string[];

  @ApiPropertyOptional({ description: 'Include related data' })
  @IsOptional()
  @IsBoolean()
  includeRelated?: boolean;
}

export class ExportResponseDto {
  @ApiProperty({ description: 'Export ID' })
  exportId: string;

  @ApiProperty({ enum: ExportStatus, description: 'Export status' })
  status: ExportStatus;

  @ApiProperty({ description: 'Export format' })
  format: ExportFormat;

  @ApiPropertyOptional({ description: 'Download URL' })
  downloadUrl?: string;

  @ApiPropertyOptional({ description: 'File size in bytes' })
  fileSize?: number;

  @ApiPropertyOptional({ description: 'Record count' })
  recordCount?: number;

  @ApiProperty({ description: 'Creation date' })
  createdAt: Date;

  @ApiPropertyOptional({ description: 'Completion date' })
  completedAt?: Date;

  @ApiPropertyOptional({ description: 'Expiry date' })
  expiresAt?: Date;

  @ApiPropertyOptional({ description: 'Error message' })
  errorMessage?: string;
}

// Settings DTOs
export class InventorySettingsDto {
  @ApiPropertyOptional({ description: 'Default low stock threshold' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  defaultLowStockThreshold?: number;

  @ApiPropertyOptional({ description: 'Auto-reorder enabled' })
  @IsOptional()
  @IsBoolean()
  autoReorderEnabled?: boolean;

  @ApiPropertyOptional({ description: 'Default reorder quantity' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  defaultReorderQuantity?: number;

  @ApiPropertyOptional({ description: 'Notification settings' })
  @IsOptional()
  @IsObject()
  notificationSettings?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Pricing settings' })
  @IsOptional()
  @IsObject()
  pricingSettings?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Booking settings' })
  @IsOptional()
  @IsObject()
  bookingSettings?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Integration settings' })
  @IsOptional()
  @IsObject()
  integrationSettings?: Record<string, any>;
}

export class InventorySettingsResponseDto {
  @ApiProperty({ description: 'Settings ID' })
  id: string;

  @ApiPropertyOptional({ description: 'Default low stock threshold' })
  defaultLowStockThreshold?: number;

  @ApiPropertyOptional({ description: 'Auto-reorder enabled' })
  autoReorderEnabled?: boolean;

  @ApiPropertyOptional({ description: 'Default reorder quantity' })
  defaultReorderQuantity?: number;

  @ApiPropertyOptional({ description: 'Notification settings' })
  notificationSettings?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Pricing settings' })
  pricingSettings?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Booking settings' })
  bookingSettings?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Integration settings' })
  integrationSettings?: Record<string, any>;

  @ApiProperty({ description: 'Last update date' })
  updatedAt: Date;

  @ApiPropertyOptional({ description: 'Updated by user ID' })
  updatedBy?: string;
}
