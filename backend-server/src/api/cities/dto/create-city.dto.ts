import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, Max, Min } from 'class-validator';
import { LaunchStatus, TierClassification } from '@/database/entities/city.entity';

export class CreateCityDto {
  @ApiProperty({ description: 'City name', example: 'Bangalore' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'State name', example: 'Karnataka' })
  @IsString()
  @IsNotEmpty()
  state: string;

  @ApiProperty({ description: 'GST state code (2 digits)', example: '29' })
  @IsString()
  @IsNotEmpty()
  gst_state_code: string;

  @ApiPropertyOptional({ description: 'Launch status', enum: LaunchStatus, default: LaunchStatus.PLANNING })
  @IsOptional()
  @IsEnum(LaunchStatus)
  launch_status?: LaunchStatus;

  @ApiPropertyOptional({ description: 'Tier classification', enum: TierClassification, default: TierClassification.TIER_3 })
  @IsOptional()
  @IsEnum(TierClassification)
  tier_classification?: TierClassification;

  @ApiPropertyOptional({ description: 'Expansion priority (higher shows first)', example: 10 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  expansion_priority?: number;
}