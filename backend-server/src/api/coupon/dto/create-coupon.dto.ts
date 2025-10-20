import {
  CouponScope,
  CouponStatus,
  CouponType,
} from '@/database/entities/coupon.entity';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Max,
  Min,
} from 'class-validator';

export class CreateCouponDto {
  @ApiProperty({ description: 'Unique coupon code', example: 'WELCOME20' })
  @IsString()
  @Length(3, 50)
  code: string;

  @ApiProperty({ description: 'Coupon name', example: 'Welcome Discount' })
  @IsString()
  @Length(1, 255)
  name: string;

  @ApiPropertyOptional({ description: 'Coupon description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ enum: CouponType, description: 'Type of discount' })
  @IsEnum(CouponType)
  type: CouponType;

  @ApiProperty({
    description: 'Discount value (percentage or fixed amount)',
    example: 20,
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  value: number;

  @ApiPropertyOptional({
    description: 'Minimum order value required',
    example: 500,
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  minOrderValue?: number;

  @ApiPropertyOptional({
    description: 'Maximum discount amount for percentage coupons',
    example: 200,
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  maxDiscountAmount?: number;

  @ApiPropertyOptional({
    description: 'Total usage limit for the coupon',
    example: 100,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  usageLimit?: number;

  @ApiPropertyOptional({ description: 'Usage limit per user', example: 1 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  userUsageLimit?: number;

  @ApiProperty({ enum: CouponScope, description: 'Coupon scope' })
  @IsEnum(CouponScope)
  scope: CouponScope;

  @ApiPropertyOptional({
    description: 'Partner ID for partner-specific coupons',
  })
  @IsOptional()
  @IsUUID()
  partnerId?: string;

  @ApiProperty({ enum: CouponStatus, description: 'Coupon status' })
  @IsEnum(CouponStatus)
  status: CouponStatus;

  @ApiProperty({
    description: 'Valid from date',
    example: '2024-01-01T00:00:00Z',
  })
  @IsDateString()
  validFrom: string;

  @ApiProperty({
    description: 'Valid to date',
    example: '2024-12-31T23:59:59Z',
  })
  @IsDateString()
  validTo: string;

  @ApiPropertyOptional({ description: 'Additional metadata' })
  @IsOptional()
  metadata?: Record<string, any>;
}
