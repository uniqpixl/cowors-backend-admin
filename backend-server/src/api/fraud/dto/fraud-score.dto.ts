// import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';
import { RiskLevel } from '../entities/fraud-score.entity';

export class UpdateFraudScoreDto {
  // // @ApiPropertyOptional({
  //   description: 'Overall fraud score (0-100)',
  //   minimum: 0,
  //   maximum: 100,
  // })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  overallScore?: number;

  // // @ApiPropertyOptional({ enum: RiskLevel, description: 'Risk level' })
  @IsOptional()
  @IsEnum(RiskLevel)
  riskLevel?: RiskLevel;

  // // @ApiPropertyOptional({ description: 'Detailed score factors breakdown' })
  @IsOptional()
  @IsObject()
  scoreFactors?: Record<string, any>;

  // // @ApiPropertyOptional({ description: 'User behavior metrics' })
  @IsOptional()
  @IsObject()
  behaviorMetrics?: Record<string, any>;

  // // @ApiPropertyOptional({ description: 'Active fraud flags', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  activeFlags?: string[];

  // // @ApiPropertyOptional({ description: 'Blacklist the user' })
  @IsOptional()
  @IsBoolean()
  isBlacklisted?: boolean;

  // // @ApiPropertyOptional({ description: 'Whitelist the user' })
  @IsOptional()
  @IsBoolean()
  isWhitelisted?: boolean;

  // // @ApiPropertyOptional({ description: 'Reason for blacklisting' })
  @IsOptional()
  @IsString()
  blacklistReason?: string;

  // // @ApiPropertyOptional({ description: 'Reason for whitelisting' })
  @IsOptional()
  @IsString()
  whitelistReason?: string;
}

export class FraudScoreQueryDto {
  // // @ApiPropertyOptional({ description: 'Filter by user ID' })
  @IsOptional()
  @IsUUID()
  userId?: string;

  // // @ApiPropertyOptional({ enum: RiskLevel, description: 'Filter by risk level' })
  @IsOptional()
  @IsEnum(RiskLevel)
  riskLevel?: RiskLevel;

  // // @ApiPropertyOptional({ description: 'Minimum fraud score' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  minScore?: number;

  // // @ApiPropertyOptional({ description: 'Maximum fraud score' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  maxScore?: number;

  // // @ApiPropertyOptional({ description: 'Include blacklisted users' })
  @IsOptional()
  @IsBoolean()
  includeBlacklisted?: boolean;

  // // @ApiPropertyOptional({ description: 'Include whitelisted users' })
  @IsOptional()
  @IsBoolean()
  includeWhitelisted?: boolean;

  // // @ApiPropertyOptional({ description: 'Only blacklisted users' })
  @IsOptional()
  @IsBoolean()
  onlyBlacklisted?: boolean;

  // // @ApiPropertyOptional({ description: 'Only whitelisted users' })
  @IsOptional()
  @IsBoolean()
  onlyWhitelisted?: boolean;

  // @ApiPropertyOptional({
  //   description: 'Page number for pagination',
  //   default: 1,
  // })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  page?: number = 1;

  // @ApiPropertyOptional({
  //   description: 'Number of items per page',
  //   default: 20,
  //   minimum: 1,
  //   maximum: 100,
  // })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  limit?: number = 20;

  // @ApiPropertyOptional({ description: 'Sort field', default: 'overallScore' })
  @IsOptional()
  @IsString()
  sortBy?: string = 'overallScore';

  // @ApiPropertyOptional({
  //   description: 'Sort order',
  //   enum: ['asc', 'desc'],
  //   default: 'desc',
  // })
  @IsOptional()
  @IsEnum(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc' = 'desc';

  // @ApiPropertyOptional({ description: 'Filter by blacklisted status' })
  @IsOptional()
  @IsBoolean()
  isBlacklisted?: boolean;

  // @ApiPropertyOptional({ description: 'Filter by whitelisted status' })
  @IsOptional()
  @IsBoolean()
  isWhitelisted?: boolean;
}

export class RecalculateScoreDto {
  // @ApiProperty({ description: 'User ID to recalculate score for' })
  @IsUUID()
  userId: string;

  // @ApiPropertyOptional({ description: 'Reason for recalculation' })
  @IsOptional()
  @IsString()
  reason?: string;

  // @ApiPropertyOptional({
  //   description: 'Force recalculation even if recently calculated',
  // })
  @IsOptional()
  @IsBoolean()
  force?: boolean;
}

export class BulkRecalculateDto {
  // @ApiPropertyOptional({
  //   description:
  //     'User IDs to recalculate (if not provided, all users will be processed)',
  // })
  @IsOptional()
  @IsArray()
  @IsUUID(4, { each: true })
  userIds?: string[];

  // @ApiPropertyOptional({
  //   description: 'Only recalculate users with risk level',
  // })
  @IsOptional()
  @IsEnum(RiskLevel)
  riskLevel?: RiskLevel;

  // @ApiPropertyOptional({
  //   description: 'Only recalculate scores older than X days',
  // })
  @IsOptional()
  @IsNumber()
  @Min(1)
  olderThanDays?: number;

  // @ApiPropertyOptional({ description: 'Batch size for processing' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(1000)
  batchSize?: number = 100;

  // @ApiPropertyOptional({ description: 'Reason for bulk recalculation' })
  @IsOptional()
  @IsString()
  reason?: string;
}

export class FraudScoreStatsDto {
  // @ApiPropertyOptional({ description: 'Start date for stats' })
  @IsOptional()
  startDate?: Date;

  // @ApiPropertyOptional({ description: 'End date for stats' })
  @IsOptional()
  endDate?: Date;

  // @ApiPropertyOptional({ enum: RiskLevel, description: 'Filter by risk level' })
  @IsOptional()
  @IsEnum(RiskLevel)
  riskLevel?: RiskLevel;
}

export class DeviceFingerprintDto {
  // @ApiProperty({ description: 'Device ID' })
  @IsString()
  deviceId: string;

  // @ApiProperty({ description: 'Device characteristics' })
  @IsObject()
  @Type(() => Object)
  characteristics: Record<string, any>;

  // @ApiPropertyOptional({ description: 'Trust score for the device' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  trustScore?: number;
}

export class LocationDataDto {
  // @ApiProperty({ description: 'Location identifier' })
  @IsString()
  location: string;

  // @ApiPropertyOptional({ description: 'Mark location as suspicious' })
  @IsOptional()
  @IsBoolean()
  suspicious?: boolean;
}
