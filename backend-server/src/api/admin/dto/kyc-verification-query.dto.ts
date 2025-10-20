import {
  KycProvider,
  KycStatus,
  KycVerificationType,
} from '@/database/entities/kyc-verification.entity';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class KycVerificationQueryDto {
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

  @ApiPropertyOptional({
    description: 'Filter by verification status',
    enum: KycStatus,
  })
  @IsOptional()
  @IsEnum(KycStatus)
  status?: KycStatus;

  @ApiPropertyOptional({
    description: 'Filter by KYC provider',
    enum: KycProvider,
  })
  @IsOptional()
  @IsEnum(KycProvider)
  provider?: KycProvider;

  @ApiPropertyOptional({
    description: 'Filter by verification type',
    enum: KycVerificationType,
  })
  @IsOptional()
  @IsEnum(KycVerificationType)
  verificationType?: KycVerificationType;

  @ApiPropertyOptional({
    description: 'Filter by risk level',
    enum: ['low', 'medium', 'high', 'critical'],
  })
  @IsOptional()
  @IsString()
  riskLevel?: 'low' | 'medium' | 'high' | 'critical';

  @ApiPropertyOptional({ description: 'Search by user name or email' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Filter by creation date from (ISO string)',
  })
  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @ApiPropertyOptional({
    description: 'Filter by creation date to (ISO string)',
  })
  @IsOptional()
  @IsDateString()
  dateTo?: string;

  @ApiPropertyOptional({ description: 'Filter by minimum cost' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minCost?: number;

  @ApiPropertyOptional({ description: 'Filter by maximum cost' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  maxCost?: number;

  @ApiPropertyOptional({
    description: 'Filter verifications with fraud alerts only',
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  fraudAlertsOnly?: boolean;

  @ApiPropertyOptional({ description: 'Filter by booking ID' })
  @IsOptional()
  @IsString()
  bookingId?: string;

  @ApiPropertyOptional({
    description: 'Sort field',
    enum: ['createdAt', 'completedAt', 'cost', 'status'],
  })
  @IsOptional()
  @IsString()
  sortBy?: 'createdAt' | 'completedAt' | 'cost' | 'status' = 'createdAt';

  @ApiPropertyOptional({
    description: 'Sort order',
    enum: ['ASC', 'DESC'],
  })
  @IsOptional()
  @IsString()
  sortOrder?: 'ASC' | 'DESC' = 'DESC';
}

export class KycProviderStatsDto {
  @ApiPropertyOptional({ description: 'Filter stats by provider' })
  @IsOptional()
  @IsEnum(KycProvider)
  provider?: KycProvider;

  @ApiPropertyOptional({ description: 'Filter stats from date (ISO string)' })
  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @ApiPropertyOptional({ description: 'Filter stats to date (ISO string)' })
  @IsOptional()
  @IsDateString()
  dateTo?: string;
}
