import { ApiProperty } from '@nestjs/swagger';
import {
  IsDecimal,
  IsEnum,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsUUID,
  Max,
  Min,
} from 'class-validator';

import { PayoutSchedule } from '../database/entities/partner-commission-settings.entity';

export class CreatePartnerCommissionSettingsDto {
  @ApiProperty({
    description: 'Partner ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsNotEmpty()
  @IsUUID()
  partnerId: string;

  @ApiProperty({
    description: 'Commission rate percentage',
    example: 15.5,
    minimum: 0,
    maximum: 100,
  })
  @IsOptional()
  @IsDecimal({ decimal_digits: '0,2' })
  @Min(0)
  @Max(100)
  commissionRate?: number;

  @ApiProperty({
    description: 'Custom rates for different space types or categories',
    example: { meeting_room: 12.5, desk: 10.0 },
    required: false,
  })
  @IsOptional()
  @IsObject()
  customRates?: Record<string, any>;

  @ApiProperty({
    description: 'Payout schedule',
    enum: PayoutSchedule,
    example: PayoutSchedule.MONTHLY,
  })
  @IsOptional()
  @IsEnum(PayoutSchedule)
  payoutSchedule?: PayoutSchedule;

  @ApiProperty({
    description: 'Minimum payout amount',
    example: 100.0,
    minimum: 0,
  })
  @IsOptional()
  @IsDecimal({ decimal_digits: '0,2' })
  @Min(0)
  minimumPayout?: number;
}
