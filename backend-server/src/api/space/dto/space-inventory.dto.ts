import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
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
  Max,
  Min,
  ValidateNested,
} from 'class-validator';

// Enums
export enum PackageType {
  HOURLY = 'hourly',
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  CUSTOM = 'custom',
  MEETING_ROOM = 'meeting_room',
  HOT_DESK = 'hot_desk',
  DEDICATED_DESK = 'dedicated_desk',
  PRIVATE_OFFICE = 'private_office',
  EVENT_SPACE = 'event_space',
}

export enum ExtrasType {
  EQUIPMENT = 'equipment',
  SERVICE = 'service',
  AMENITY = 'amenity',
  CATERING = 'catering',
  TECHNOLOGY = 'technology',
  FURNITURE = 'furniture',
  PARKING = 'parking',
  STORAGE = 'storage',
  CLEANING = 'cleaning',
  SECURITY = 'security',
}

export enum InventoryStatus {
  AVAILABLE = 'available',
  OCCUPIED = 'occupied',
  MAINTENANCE = 'maintenance',
  RESERVED = 'reserved',
  OUT_OF_ORDER = 'out_of_order',
  CLEANING = 'cleaning',
  SETUP = 'setup',
  BLOCKED = 'blocked',
}

export enum PricingType {
  FIXED = 'fixed',
  DYNAMIC = 'dynamic',
  TIERED = 'tiered',
  SEASONAL = 'seasonal',
  DEMAND_BASED = 'demand_based',
  PROMOTIONAL = 'promotional',
  BULK_DISCOUNT = 'bulk_discount',
  MEMBERSHIP = 'membership',
}

export enum BulkInventoryOperationType {
  UPDATE_PRICING = 'update_pricing',
  UPDATE_AVAILABILITY = 'update_availability',
  UPDATE_STATUS = 'update_status',
  APPLY_DISCOUNT = 'apply_discount',
  BULK_ACTIVATE = 'bulk_activate',
  BULK_DEACTIVATE = 'bulk_deactivate',
  UPDATE_CAPACITY = 'update_capacity',
  SYNC_INVENTORY = 'sync_inventory',
}

export enum ExportFormat {
  CSV = 'csv',
  EXCEL = 'excel',
  PDF = 'pdf',
  JSON = 'json',
}

export enum ReportType {
  INVENTORY_SUMMARY = 'inventory_summary',
  UTILIZATION_REPORT = 'utilization_report',
  REVENUE_ANALYSIS = 'revenue_analysis',
  PACKAGE_PERFORMANCE = 'package_performance',
  ADD_ON_ANALYSIS = 'add_on_analysis',
  PRICING_OPTIMIZATION = 'pricing_optimization',
  DEMAND_FORECAST = 'demand_forecast',
  OCCUPANCY_TRENDS = 'occupancy_trends',
}

// Space Package DTOs
export class CreateSpacePackageDto {
  @ApiProperty({ description: 'Space ID' })
  @IsUUID()
  @IsNotEmpty()
  spaceId: string;

  @ApiProperty({ description: 'Package name' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ description: 'Package description' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ enum: PackageType, description: 'Package type' })
  @IsEnum(PackageType)
  packageType: PackageType;

  @ApiProperty({ description: 'Base price', type: Number })
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  basePrice: number;

  @ApiPropertyOptional({ description: 'Currency code', default: 'INR' })
  @IsString()
  @IsOptional()
  currency?: string;

  @ApiPropertyOptional({ description: 'Duration in hours' })
  @IsNumber()
  @IsOptional()
  @Min(1)
  durationHours?: number;

  @ApiPropertyOptional({ description: 'Maximum capacity' })
  @IsNumber()
  @IsOptional()
  @Min(1)
  maxCapacity?: number;

  @ApiPropertyOptional({ description: 'Minimum capacity' })
  @IsNumber()
  @IsOptional()
  @Min(1)
  minCapacity?: number;

  @ApiPropertyOptional({ description: 'Included amenities', type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  includedAmenities?: string[];

  @ApiPropertyOptional({ description: 'Package features', type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  features?: string[];

  @ApiPropertyOptional({ description: 'Terms and conditions' })
  @IsString()
  @IsOptional()
  termsAndConditions?: string;

  @ApiPropertyOptional({ description: 'Cancellation policy' })
  @IsString()
  @IsOptional()
  cancellationPolicy?: string;

  @ApiPropertyOptional({ description: 'Advance booking required in hours' })
  @IsNumber()
  @IsOptional()
  @Min(0)
  advanceBookingHours?: number;

  @ApiPropertyOptional({ description: 'Maximum booking duration in hours' })
  @IsNumber()
  @IsOptional()
  @Min(1)
  maxBookingHours?: number;

  @ApiPropertyOptional({ description: 'Is package active', default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Package priority for display' })
  @IsNumber()
  @IsOptional()
  @Min(0)
  priority?: number;

  @ApiPropertyOptional({ description: 'Additional metadata', type: Object })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}

export class UpdateSpacePackageDto {
  @ApiPropertyOptional({ description: 'Package name' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ description: 'Package description' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ enum: PackageType, description: 'Package type' })
  @IsEnum(PackageType)
  @IsOptional()
  packageType?: PackageType;

  @ApiPropertyOptional({ description: 'Base price', type: Number })
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  @IsOptional()
  basePrice?: number;

  @ApiPropertyOptional({ description: 'Currency code' })
  @IsString()
  @IsOptional()
  currency?: string;

  @ApiPropertyOptional({ description: 'Duration in hours' })
  @IsNumber()
  @IsOptional()
  @Min(1)
  durationHours?: number;

  @ApiPropertyOptional({ description: 'Maximum capacity' })
  @IsNumber()
  @IsOptional()
  @Min(1)
  maxCapacity?: number;

  @ApiPropertyOptional({ description: 'Minimum capacity' })
  @IsNumber()
  @IsOptional()
  @Min(1)
  minCapacity?: number;

  @ApiPropertyOptional({ description: 'Included amenities', type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  includedAmenities?: string[];

  @ApiPropertyOptional({ description: 'Package features', type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  features?: string[];

  @ApiPropertyOptional({ description: 'Terms and conditions' })
  @IsString()
  @IsOptional()
  termsAndConditions?: string;

  @ApiPropertyOptional({ description: 'Cancellation policy' })
  @IsString()
  @IsOptional()
  cancellationPolicy?: string;

  @ApiPropertyOptional({ description: 'Advance booking required in hours' })
  @IsNumber()
  @IsOptional()
  @Min(0)
  advanceBookingHours?: number;

  @ApiPropertyOptional({ description: 'Maximum booking duration in hours' })
  @IsNumber()
  @IsOptional()
  @Min(1)
  maxBookingHours?: number;

  @ApiPropertyOptional({ description: 'Is package active' })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Package priority for display' })
  @IsNumber()
  @IsOptional()
  @Min(0)
  priority?: number;

  @ApiPropertyOptional({ description: 'Additional metadata', type: Object })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}

export class SpacePackageResponseDto {
  @ApiProperty({ description: 'Package ID' })
  id: string;

  @ApiProperty({ description: 'Space information' })
  space: {
    id: string;
    name: string;
    location: string;
  };

  @ApiProperty({ description: 'Package name' })
  name: string;

  @ApiProperty({ description: 'Package description' })
  description?: string;

  @ApiProperty({ enum: PackageType, description: 'Package type' })
  packageType: PackageType;

  @ApiProperty({ description: 'Base price', type: Number })
  basePrice: number;

  @ApiProperty({ description: 'Currency code' })
  currency: string;

  @ApiProperty({ description: 'Duration in hours' })
  durationHours?: number;

  @ApiProperty({ description: 'Maximum capacity' })
  maxCapacity?: number;

  @ApiProperty({ description: 'Minimum capacity' })
  minCapacity?: number;

  @ApiProperty({ description: 'Included amenities', type: [String] })
  includedAmenities?: string[];

  @ApiProperty({ description: 'Package features', type: [String] })
  features?: string[];

  @ApiProperty({ description: 'Terms and conditions' })
  termsAndConditions?: string;

  @ApiProperty({ description: 'Cancellation policy' })
  cancellationPolicy?: string;

  @ApiProperty({ description: 'Advance booking required in hours' })
  advanceBookingHours?: number;

  @ApiProperty({ description: 'Maximum booking duration in hours' })
  maxBookingHours?: number;

  @ApiProperty({ description: 'Is package active' })
  isActive: boolean;

  @ApiProperty({ description: 'Package priority for display' })
  priority?: number;

  @ApiProperty({ description: 'Additional metadata', type: Object })
  metadata?: Record<string, any>;

  @ApiProperty({ description: 'Creation timestamp' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  updatedAt: Date;

  @ApiProperty({ description: 'Created by user ID' })
  createdBy?: string;

  @ApiProperty({ description: 'Updated by user ID' })
  updatedBy?: string;
}

// Space Extras DTOs
export class CreateSpaceExtrasDto {
  @ApiProperty({ description: 'Space ID' })
  @IsUUID()
  @IsNotEmpty()
  spaceId: string;

  @ApiProperty({ description: 'Extras name' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ description: 'Extras description' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ enum: ExtrasType, description: 'Extras type' })
  @IsEnum(ExtrasType)
  extrasType: ExtrasType;

  @ApiPropertyOptional({ description: 'Extras category' })
  @IsString()
  @IsOptional()
  category?: string;

  @ApiProperty({ description: 'Price per unit', type: Number })
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  pricePerUnit: number;

  @ApiPropertyOptional({ description: 'Currency code', default: 'INR' })
  @IsString()
  @IsOptional()
  currency?: string;

  @ApiPropertyOptional({
    description: 'Unit of measurement (e.g., hour, day, piece)',
  })
  @IsString()
  @IsOptional()
  unit?: string;

  @ApiPropertyOptional({ description: 'Minimum quantity' })
  @IsNumber()
  @IsOptional()
  @Min(1)
  minQuantity?: number;

  @ApiPropertyOptional({ description: 'Maximum quantity' })
  @IsNumber()
  @IsOptional()
  @Min(1)
  maxQuantity?: number;

  @ApiPropertyOptional({ description: 'Available quantity' })
  @IsNumber()
  @IsOptional()
  @Min(0)
  availableQuantity?: number;

  @ApiPropertyOptional({ description: 'Setup time required in minutes' })
  @IsNumber()
  @IsOptional()
  @Min(0)
  setupTimeMinutes?: number;

  @ApiPropertyOptional({ description: 'Advance booking required in hours' })
  @IsNumber()
  @IsOptional()
  @Min(0)
  advanceBookingHours?: number;

  @ApiPropertyOptional({ description: 'Is extras active', default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Extras priority for display' })
  @IsNumber()
  @IsOptional()
  @Min(0)
  priority?: number;

  @ApiPropertyOptional({ description: 'Additional metadata', type: Object })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}

export class UpdateSpaceExtrasDto {
  @ApiPropertyOptional({ description: 'Extras name' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ description: 'Extras description' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ enum: ExtrasType, description: 'Extras type' })
  @IsEnum(ExtrasType)
  @IsOptional()
  extrasType?: ExtrasType;

  @ApiPropertyOptional({ description: 'Extras category' })
  @IsString()
  @IsOptional()
  category?: string;

  @ApiPropertyOptional({ description: 'Price per unit', type: Number })
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  @IsOptional()
  pricePerUnit?: number;

  @ApiPropertyOptional({ description: 'Currency code' })
  @IsString()
  @IsOptional()
  currency?: string;

  @ApiPropertyOptional({ description: 'Unit of measurement' })
  @IsString()
  @IsOptional()
  unit?: string;

  @ApiPropertyOptional({ description: 'Minimum quantity' })
  @IsNumber()
  @IsOptional()
  @Min(1)
  minQuantity?: number;

  @ApiPropertyOptional({ description: 'Maximum quantity' })
  @IsNumber()
  @IsOptional()
  @Min(1)
  maxQuantity?: number;

  @ApiPropertyOptional({ description: 'Available quantity' })
  @IsNumber()
  @IsOptional()
  @Min(0)
  availableQuantity?: number;

  @ApiPropertyOptional({ description: 'Setup time required in minutes' })
  @IsNumber()
  @IsOptional()
  @Min(0)
  setupTimeMinutes?: number;

  @ApiPropertyOptional({ description: 'Advance booking required in hours' })
  @IsNumber()
  @IsOptional()
  @Min(0)
  advanceBookingHours?: number;

  @ApiPropertyOptional({ description: 'Is extras active' })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Extras priority for display' })
  @IsNumber()
  @IsOptional()
  @Min(0)
  priority?: number;

  @ApiPropertyOptional({ description: 'Additional metadata', type: Object })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}

export class SpaceExtrasResponseDto {
  @ApiProperty({ description: 'Extras ID' })
  id: string;

  @ApiProperty({ description: 'Space information' })
  space: {
    id: string;
    name: string;
    location: string;
  };

  @ApiProperty({ description: 'Extras name' })
  name: string;

  @ApiProperty({ description: 'Extras description' })
  description?: string;

  @ApiProperty({ enum: ExtrasType, description: 'Extras type' })
  extrasType: ExtrasType;

  @ApiProperty({ description: 'Extras category' })
  category?: string;

  @ApiProperty({ description: 'Price per unit', type: Number })
  pricePerUnit: number;

  @ApiProperty({ description: 'Currency code' })
  currency: string;

  @ApiProperty({ description: 'Unit of measurement' })
  unit?: string;

  @ApiProperty({ description: 'Minimum quantity' })
  minQuantity?: number;

  @ApiProperty({ description: 'Maximum quantity' })
  maxQuantity?: number;

  @ApiProperty({ description: 'Available quantity' })
  availableQuantity?: number;

  @ApiProperty({ description: 'Setup time required in minutes' })
  setupTimeMinutes?: number;

  @ApiProperty({ description: 'Advance booking required in hours' })
  advanceBookingHours?: number;

  @ApiProperty({ description: 'Is extras active' })
  isActive: boolean;

  @ApiProperty({ description: 'Extras priority for display' })
  priority?: number;

  @ApiProperty({ description: 'Additional metadata', type: Object })
  metadata?: Record<string, any>;

  @ApiProperty({ description: 'Creation timestamp' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  updatedAt: Date;

  @ApiProperty({ description: 'Created by user ID' })
  createdBy?: string;

  @ApiProperty({ description: 'Updated by user ID' })
  updatedBy?: string;
}

// Inventory DTOs
export class UpdateInventoryDto {
  @ApiPropertyOptional({
    enum: InventoryStatus,
    description: 'Inventory status',
  })
  @IsEnum(InventoryStatus)
  @IsOptional()
  status?: InventoryStatus;

  @ApiPropertyOptional({ description: 'Total capacity' })
  @IsNumber()
  @IsOptional()
  @Min(0)
  totalCapacity?: number;

  @ApiPropertyOptional({ description: 'Available capacity' })
  @IsNumber()
  @IsOptional()
  @Min(0)
  availableCapacity?: number;

  @ApiPropertyOptional({ description: 'Reserved capacity' })
  @IsNumber()
  @IsOptional()
  @Min(0)
  reservedCapacity?: number;

  @ApiPropertyOptional({ description: 'Maintenance notes' })
  @IsString()
  @IsOptional()
  maintenanceNotes?: string;

  @ApiPropertyOptional({ description: 'Last maintenance date' })
  @IsDateString()
  @IsOptional()
  lastMaintenanceDate?: string;

  @ApiPropertyOptional({ description: 'Next maintenance date' })
  @IsDateString()
  @IsOptional()
  nextMaintenanceDate?: string;

  @ApiPropertyOptional({ description: 'Low stock threshold' })
  @IsNumber()
  @IsOptional()
  @Min(0)
  lowStockThreshold?: number;

  @ApiPropertyOptional({ description: 'Additional metadata', type: Object })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}

export class SpaceInventoryResponseDto {
  @ApiProperty({ description: 'Inventory ID' })
  id: string;

  @ApiProperty({ description: 'Space information' })
  space: {
    id: string;
    name: string;
    location: string;
    partner: {
      id: string;
      name: string;
    };
  };

  @ApiProperty({ enum: InventoryStatus, description: 'Inventory status' })
  status: InventoryStatus;

  @ApiProperty({ description: 'Total capacity' })
  totalCapacity: number;

  @ApiProperty({ description: 'Available capacity' })
  availableCapacity: number;

  @ApiProperty({ description: 'Reserved capacity' })
  reservedCapacity: number;

  @ApiProperty({ description: 'Occupied capacity' })
  occupiedCapacity: number;

  @ApiProperty({ description: 'Utilization rate percentage' })
  utilizationRate: number;

  @ApiProperty({ description: 'Is low stock' })
  isLowStock: boolean;

  @ApiProperty({ description: 'Low stock threshold' })
  lowStockThreshold?: number;

  @ApiProperty({ description: 'Maintenance notes' })
  maintenanceNotes?: string;

  @ApiProperty({ description: 'Last maintenance date' })
  lastMaintenanceDate?: Date;

  @ApiProperty({ description: 'Next maintenance date' })
  nextMaintenanceDate?: Date;

  @ApiProperty({ description: 'Additional metadata', type: Object })
  metadata?: Record<string, any>;

  @ApiProperty({ description: 'Last update timestamp' })
  updatedAt: Date;

  @ApiProperty({ description: 'Updated by user ID' })
  updatedBy?: string;
}

// Pricing Configuration DTOs
export class CreatePricingConfigDto {
  @ApiProperty({ description: 'Space ID' })
  @IsUUID()
  @IsNotEmpty()
  spaceId: string;

  @ApiProperty({ description: 'Configuration name' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ description: 'Configuration description' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ enum: PricingType, description: 'Pricing type' })
  @IsEnum(PricingType)
  pricingType: PricingType;

  @ApiProperty({ description: 'Base price', type: Number })
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  basePrice: number;

  @ApiPropertyOptional({ description: 'Currency code', default: 'INR' })
  @IsString()
  @IsOptional()
  currency?: string;

  @ApiPropertyOptional({ description: 'Pricing rules', type: Object })
  @IsObject()
  @IsOptional()
  pricingRules?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Discount rules', type: Object })
  @IsObject()
  @IsOptional()
  discountRules?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Effective from date' })
  @IsDateString()
  @IsOptional()
  effectiveFrom?: string;

  @ApiPropertyOptional({ description: 'Effective to date' })
  @IsDateString()
  @IsOptional()
  effectiveTo?: string;

  @ApiPropertyOptional({
    description: 'Is configuration active',
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Configuration priority' })
  @IsNumber()
  @IsOptional()
  @Min(0)
  priority?: number;

  @ApiPropertyOptional({ description: 'Additional metadata', type: Object })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}

export class UpdatePricingConfigDto {
  @ApiPropertyOptional({ description: 'Configuration name' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ description: 'Configuration description' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ enum: PricingType, description: 'Pricing type' })
  @IsEnum(PricingType)
  @IsOptional()
  pricingType?: PricingType;

  @ApiPropertyOptional({ description: 'Base price', type: Number })
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  @IsOptional()
  basePrice?: number;

  @ApiPropertyOptional({ description: 'Currency code' })
  @IsString()
  @IsOptional()
  currency?: string;

  @ApiPropertyOptional({ description: 'Pricing rules', type: Object })
  @IsObject()
  @IsOptional()
  pricingRules?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Discount rules', type: Object })
  @IsObject()
  @IsOptional()
  discountRules?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Effective from date' })
  @IsDateString()
  @IsOptional()
  effectiveFrom?: string;

  @ApiPropertyOptional({ description: 'Effective to date' })
  @IsDateString()
  @IsOptional()
  effectiveTo?: string;

  @ApiPropertyOptional({ description: 'Is configuration active' })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Configuration priority' })
  @IsNumber()
  @IsOptional()
  @Min(0)
  priority?: number;

  @ApiPropertyOptional({ description: 'Additional metadata', type: Object })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}

export class PricingConfigResponseDto {
  @ApiProperty({ description: 'Configuration ID' })
  id: string;

  @ApiProperty({ description: 'Space information' })
  space: {
    id: string;
    name: string;
    location: string;
  };

  @ApiProperty({ description: 'Configuration name' })
  name: string;

  @ApiProperty({ description: 'Configuration description' })
  description?: string;

  @ApiProperty({ enum: PricingType, description: 'Pricing type' })
  pricingType: PricingType;

  @ApiProperty({ description: 'Base price', type: Number })
  basePrice: number;

  @ApiProperty({ description: 'Currency code' })
  currency: string;

  @ApiProperty({ description: 'Pricing rules', type: Object })
  pricingRules?: Record<string, any>;

  @ApiProperty({ description: 'Discount rules', type: Object })
  discountRules?: Record<string, any>;

  @ApiProperty({ description: 'Effective from date' })
  effectiveFrom?: Date;

  @ApiProperty({ description: 'Effective to date' })
  effectiveTo?: Date;

  @ApiProperty({ description: 'Is configuration active' })
  isActive: boolean;

  @ApiProperty({ description: 'Configuration priority' })
  priority?: number;

  @ApiProperty({ description: 'Additional metadata', type: Object })
  metadata?: Record<string, any>;

  @ApiProperty({ description: 'Creation timestamp' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  updatedAt: Date;

  @ApiProperty({ description: 'Created by user ID' })
  createdBy?: string;

  @ApiProperty({ description: 'Updated by user ID' })
  updatedBy?: string;
}

// Bulk Operations DTOs
export class BulkInventoryOperationDto {
  @ApiProperty({
    enum: BulkInventoryOperationType,
    description: 'Operation type',
  })
  @IsEnum(BulkInventoryOperationType)
  operation: BulkInventoryOperationType;

  @ApiProperty({ description: 'Space IDs to operate on', type: [String] })
  @IsArray()
  @IsUUID(4, { each: true })
  @ArrayMinSize(1)
  spaceIds: string[];

  @ApiPropertyOptional({ description: 'Operation reason' })
  @IsString()
  @IsOptional()
  reason?: string;

  @ApiPropertyOptional({ description: 'Operation data', type: Object })
  @IsObject()
  @IsOptional()
  data?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Schedule operation for later' })
  @IsDateString()
  @IsOptional()
  scheduledFor?: string;
}

// Analytics DTOs
export class SpaceInventoryAnalyticsDto {
  @ApiProperty({ description: 'Total spaces' })
  totalSpaces: number;

  @ApiProperty({ description: 'Available spaces' })
  availableSpaces: number;

  @ApiProperty({ description: 'Occupied spaces' })
  occupiedSpaces: number;

  @ApiProperty({ description: 'Maintenance spaces' })
  maintenanceSpaces: number;

  @ApiProperty({ description: 'Overall utilization rate' })
  utilizationRate: number;

  @ApiProperty({ description: 'Total revenue', type: Number })
  totalRevenue: number;

  @ApiProperty({ description: 'Average booking duration in hours' })
  averageBookingDuration: number;

  @ApiProperty({ description: 'Total packages' })
  totalPackages: number;

  @ApiProperty({ description: 'Active packages' })
  activePackages: number;

  @ApiProperty({ description: 'Total extras' })
  totalExtras: number;

  @ApiProperty({ description: 'Popular packages', type: Array })
  popularPackages: Array<{
    packageId: string;
    packageName: string;
    bookingCount: number;
    revenue: number;
  }>;

  @ApiProperty({ description: 'Popular extras', type: Array })
  popularExtras: Array<{
    extrasId: string;
    extrasName: string;
    usageCount: number;
    revenue: number;
  }>;

  @ApiProperty({ description: 'Utilization by space type', type: Array })
  utilizationByType: Array<{
    spaceType: string;
    totalSpaces: number;
    utilizationRate: number;
    revenue: number;
  }>;

  @ApiProperty({ description: 'Monthly trends', type: Array })
  monthlyTrends: Array<{
    month: string;
    bookings: number;
    revenue: number;
    utilizationRate: number;
  }>;

  @ApiProperty({ description: 'Peak hours', type: Array })
  peakHours: Array<{
    hour: number;
    bookingCount: number;
    utilizationRate: number;
  }>;

  @ApiProperty({ description: 'Low stock items', type: Array })
  lowStockItems: Array<{
    spaceId: string;
    spaceName: string;
    currentStock: number;
    threshold: number;
  }>;
}

// Export DTOs
export class SpaceInventoryExportDto {
  @ApiProperty({ description: 'Export type' })
  @IsString()
  @IsNotEmpty()
  exportType: string;

  @ApiProperty({ enum: ExportFormat, description: 'Export format' })
  @IsEnum(ExportFormat)
  format: ExportFormat;

  @ApiPropertyOptional({ description: 'Date from (YYYY-MM-DD)' })
  @IsDateString()
  @IsOptional()
  dateFrom?: string;

  @ApiPropertyOptional({ description: 'Date to (YYYY-MM-DD)' })
  @IsDateString()
  @IsOptional()
  dateTo?: string;

  @ApiPropertyOptional({ description: 'Additional filters', type: Object })
  @IsObject()
  @IsOptional()
  filters?: Record<string, any>;

  @ApiPropertyOptional({
    description: 'Include archived records',
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  includeArchived?: boolean;
}

// Report DTOs
export class SpaceInventoryReportDto {
  @ApiProperty({ description: 'Report name' })
  @IsString()
  @IsNotEmpty()
  reportName: string;

  @ApiProperty({ enum: ReportType, description: 'Report type' })
  @IsEnum(ReportType)
  reportType: ReportType;

  @ApiPropertyOptional({
    enum: ExportFormat,
    description: 'Report format',
    default: ExportFormat.PDF,
  })
  @IsEnum(ExportFormat)
  @IsOptional()
  format?: ExportFormat;

  @ApiPropertyOptional({ description: 'Date from (YYYY-MM-DD)' })
  @IsDateString()
  @IsOptional()
  dateFrom?: string;

  @ApiPropertyOptional({ description: 'Date to (YYYY-MM-DD)' })
  @IsDateString()
  @IsOptional()
  dateTo?: string;

  @ApiPropertyOptional({ description: 'Report parameters', type: Object })
  @IsObject()
  @IsOptional()
  parameters?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Schedule report generation' })
  @IsDateString()
  @IsOptional()
  scheduledFor?: string;
}

export class SpaceInventoryReportResponseDto {
  @ApiProperty({ description: 'Report ID' })
  id: string;

  @ApiProperty({ description: 'Report name' })
  reportName: string;

  @ApiProperty({ enum: ReportType, description: 'Report type' })
  reportType: ReportType;

  @ApiProperty({ description: 'Report status' })
  status: string;

  @ApiProperty({ enum: ExportFormat, description: 'Report format' })
  format: ExportFormat;

  @ApiProperty({ description: 'Date from' })
  dateFrom?: Date;

  @ApiProperty({ description: 'Date to' })
  dateTo?: Date;

  @ApiProperty({ description: 'Report parameters', type: Object })
  parameters?: Record<string, any>;

  @ApiProperty({ description: 'File path' })
  filePath?: string;

  @ApiProperty({ description: 'Download URL' })
  downloadUrl?: string;

  @ApiProperty({ description: 'Creation timestamp' })
  createdAt: Date;

  @ApiProperty({ description: 'Completion timestamp' })
  completedAt?: Date;

  @ApiProperty({ description: 'Expiration timestamp' })
  expiresAt?: Date;

  @ApiProperty({ description: 'Error message if failed' })
  errorMessage?: string;

  @ApiProperty({ description: 'Created by user ID' })
  createdBy?: string;
}

// Settings DTOs
export class SpaceInventorySettingsDto {
  @ApiPropertyOptional({ description: 'Default low stock threshold' })
  @IsNumber()
  @IsOptional()
  @Min(0)
  defaultLowStockThreshold?: number;

  @ApiPropertyOptional({ description: 'Auto-update inventory', default: true })
  @IsBoolean()
  @IsOptional()
  autoUpdateInventory?: boolean;

  @ApiPropertyOptional({ description: 'Send low stock alerts', default: true })
  @IsBoolean()
  @IsOptional()
  sendLowStockAlerts?: boolean;

  @ApiPropertyOptional({ description: 'Alert threshold days' })
  @IsNumber()
  @IsOptional()
  @Min(1)
  alertThresholdDays?: number;

  @ApiPropertyOptional({
    description: 'Enable dynamic pricing',
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  enableDynamicPricing?: boolean;

  @ApiPropertyOptional({ description: 'Price adjustment factor' })
  @IsNumber()
  @IsOptional()
  @Min(0.1)
  @Max(5.0)
  priceAdjustmentFactor?: number;

  @ApiPropertyOptional({ description: 'Enable overbooking', default: false })
  @IsBoolean()
  @IsOptional()
  enableOverbooking?: boolean;

  @ApiPropertyOptional({ description: 'Overbooking percentage' })
  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(50)
  overbookingPercentage?: number;

  @ApiPropertyOptional({ description: 'Maintenance reminder days' })
  @IsNumber()
  @IsOptional()
  @Min(1)
  maintenanceReminderDays?: number;

  @ApiPropertyOptional({ description: 'Enable notifications', default: true })
  @IsBoolean()
  @IsOptional()
  enableNotifications?: boolean;

  @ApiPropertyOptional({ description: 'Additional settings', type: Object })
  @IsObject()
  @IsOptional()
  additionalSettings?: Record<string, any>;
}
