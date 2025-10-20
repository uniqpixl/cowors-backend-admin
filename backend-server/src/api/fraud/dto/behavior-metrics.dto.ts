import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, Min } from 'class-validator';

export class BehaviorMetricsDto {
  @ApiProperty({
    description: 'Average booking value in USD',
    example: 250.75,
    minimum: 0,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  averageBookingValue?: number;

  @ApiProperty({
    description: 'Booking frequency (bookings per month)',
    example: 3.5,
    minimum: 0,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  bookingFrequency?: number;

  @ApiProperty({
    description: 'Cancellation rate as a percentage',
    example: 0.15,
    minimum: 0,
    maximum: 1,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  cancellationRate?: number;

  @ApiProperty({
    description: 'Dispute rate as a percentage',
    example: 0.02,
    minimum: 0,
    maximum: 1,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  disputeRate?: number;

  @ApiProperty({
    description: 'Average response time in minutes',
    example: 45.2,
    minimum: 0,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  responseTime?: number;

  @ApiProperty({
    description: 'Profile completeness as a percentage',
    example: 0.85,
    minimum: 0,
    maximum: 1,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  profileCompleteness?: number;
}
