import { ApiProperty } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';

import { PayoutMethod } from '../api/payout/dto/payout.dto';

export class CreatePayoutDto {
  @ApiProperty({
    description: 'Partner ID for the payout',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  @IsNotEmpty()
  partnerId: string;

  @ApiProperty({
    description: 'Total payout amount',
    example: 1500.0,
    minimum: 0.01,
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  amount: number;

  @ApiProperty({
    description: 'Commission amount included in payout',
    example: 1400.0,
    minimum: 0,
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  commissionAmount: number;

  @ApiProperty({
    description: 'Processing fee amount',
    example: 15.0,
    minimum: 0,
    required: false,
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  feeAmount?: number;

  @ApiProperty({
    description: 'Net amount after fees',
    example: 1485.0,
    minimum: 0.01,
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  netAmount: number;

  @ApiProperty({
    description: 'Payout method',
    enum: PayoutMethod,
    example: PayoutMethod.BANK_TRANSFER,
  })
  @IsEnum(PayoutMethod)
  payoutMethod: PayoutMethod;

  @ApiProperty({
    description: 'Payout details based on method',
    example: {
      accountNumber: '1234567890',
      routingNumber: '021000021',
      bankName: 'Chase Bank',
      accountHolderName: 'John Doe',
    },
    required: false,
  })
  @IsOptional()
  @IsObject()
  payoutDetails?: {
    accountNumber?: string;
    routingNumber?: string;
    bankName?: string;
    accountHolderName?: string;
    paypalEmail?: string;
    stripeAccountId?: string;
    razorpayAccountId?: string;
  };

  @ApiProperty({
    description: 'Start date of the payout period',
    example: '2024-01-01',
  })
  @IsDateString()
  periodStart: string;

  @ApiProperty({
    description: 'End date of the payout period',
    example: '2024-01-31',
  })
  @IsDateString()
  periodEnd: string;

  @ApiProperty({
    description: 'Additional notes for the payout',
    example: 'Monthly commission payout for January 2024',
    required: false,
  })
  @IsOptional()
  @IsString()
  notes?: string;
}
