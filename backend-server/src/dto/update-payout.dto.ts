import { PartialType } from '@nestjs/mapped-types';
import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsObject, IsOptional, IsString } from 'class-validator';

import { PayoutStatus } from '../api/payout/dto/payout.dto';
import { CreatePayoutDto } from './create-payout.dto';

export class UpdatePayoutDto extends PartialType(CreatePayoutDto) {
  @ApiProperty({
    description: 'Payout status',
    enum: PayoutStatus,
    example: PayoutStatus.PROCESSING,
    required: false,
  })
  @IsOptional()
  @IsEnum(PayoutStatus)
  status?: PayoutStatus;

  @ApiProperty({
    description: 'Transaction details from payment provider',
    example: {
      transactionId: 'txn_1234567890',
      providerTransactionId: 'stripe_pi_1234567890',
      providerResponse: { status: 'succeeded' },
    },
    required: false,
  })
  @IsOptional()
  @IsObject()
  transactionDetails?: {
    transactionId?: string;
    providerTransactionId?: string;
    providerResponse?: any;
    failureReason?: string;
  };

  @ApiProperty({
    description: 'Additional notes for the payout update',
    example: 'Payout processed successfully via Stripe',
    required: false,
  })
  @IsOptional()
  @IsString()
  notes?: string;
}
