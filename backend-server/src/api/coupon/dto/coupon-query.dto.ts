import { PageOptionsDto } from '@/common/dto/offset-pagination/page-options.dto';
import {
  CouponScope,
  CouponStatus,
  CouponType,
} from '@/database/entities/coupon.entity';
import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

export class CouponQueryDto extends PageOptionsDto {
  @ApiPropertyOptional({ description: 'Filter by coupon status' })
  @IsOptional()
  @IsEnum(CouponStatus)
  status?: CouponStatus;

  @ApiPropertyOptional({ description: 'Filter by coupon scope' })
  @IsOptional()
  @IsEnum(CouponScope)
  scope?: CouponScope;

  @ApiPropertyOptional({ description: 'Filter by coupon type' })
  @IsOptional()
  @IsEnum(CouponType)
  type?: CouponType;

  @ApiPropertyOptional({ description: 'Filter by partner ID' })
  @IsOptional()
  @IsUUID()
  partnerId?: string;

  @ApiPropertyOptional({ description: 'Search by coupon code or name' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Filter by valid from date' })
  @IsOptional()
  @IsDateString()
  validFrom?: string;

  @ApiPropertyOptional({ description: 'Filter by valid to date' })
  @IsOptional()
  @IsDateString()
  validTo?: string;

  @ApiPropertyOptional({
    description: 'Show only active coupons',
    default: false,
  })
  @IsOptional()
  activeOnly?: boolean;
}

export class ValidateCouponDto {
  @ApiPropertyOptional({ description: 'Coupon code to validate' })
  @IsString()
  code: string;

  @ApiPropertyOptional({ description: 'Order amount for validation' })
  @IsOptional()
  orderAmount?: number;

  @ApiPropertyOptional({ description: 'User ID for usage validation' })
  @IsOptional()
  @IsUUID()
  userId?: string;

  @ApiPropertyOptional({
    description: 'Partner ID for partner-specific coupons',
  })
  @IsOptional()
  @IsUUID()
  partnerId?: string;
}

export class CouponUsageDto {
  @ApiPropertyOptional({ description: 'Coupon code' })
  @IsString()
  code: string;

  @ApiPropertyOptional({ description: 'User ID' })
  @IsUUID()
  userId: string;

  @ApiPropertyOptional({ description: 'Order amount' })
  orderAmount: number;

  @ApiPropertyOptional({ description: 'Booking ID' })
  @IsUUID()
  bookingId: string;
}
