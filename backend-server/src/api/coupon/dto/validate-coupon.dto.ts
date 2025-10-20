import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString } from 'class-validator';

export class ValidateCouponDto {
  @ApiProperty({
    description: 'Coupon code to validate',
    example: 'SAVE20',
  })
  @IsString()
  code: string;

  @ApiProperty({
    description: 'Order amount to apply coupon to',
    example: 100,
  })
  @IsNumber()
  orderAmount: number;

  @ApiProperty({
    description: 'User ID applying the coupon',
    example: 'user-123',
  })
  @IsString()
  userId: string;
}
