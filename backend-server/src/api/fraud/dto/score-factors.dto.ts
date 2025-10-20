import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, Max, Min } from 'class-validator';

export class ScoreFactorsDto {
  @ApiProperty({
    description: 'Payment history score factor',
    example: 0.85,
    minimum: 0,
    maximum: 1,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  paymentHistory?: number;

  @ApiProperty({
    description: 'Booking behavior score factor',
    example: 0.92,
    minimum: 0,
    maximum: 1,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  bookingBehavior?: number;

  @ApiProperty({
    description: 'Identity verification score factor',
    example: 0.78,
    minimum: 0,
    maximum: 1,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  identityVerification?: number;

  @ApiProperty({
    description: 'Device trust score factor',
    example: 0.95,
    minimum: 0,
    maximum: 1,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  deviceTrust?: number;

  @ApiProperty({
    description: 'Location consistency score factor',
    example: 0.88,
    minimum: 0,
    maximum: 1,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  locationConsistency?: number;

  @ApiProperty({
    description: 'Social signals score factor',
    example: 0.73,
    minimum: 0,
    maximum: 1,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  socialSignals?: number;
}
