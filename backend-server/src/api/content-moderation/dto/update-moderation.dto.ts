import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { ModerationStatus } from '../entities/content-moderation.entity';

export class UpdateModerationDto {
  @ApiProperty({ enum: ModerationStatus, description: 'New moderation status' })
  @IsEnum(ModerationStatus)
  status: ModerationStatus;

  @ApiProperty({ description: 'ID of the moderator', required: false })
  @IsOptional()
  @IsUUID()
  moderatorId?: string;

  @ApiProperty({
    description: 'Reason for the moderation decision',
    required: false,
  })
  @IsOptional()
  @IsString()
  moderationReason?: string;
}

export class ModerationQueryDto {
  @ApiProperty({ description: 'Page number', required: false, default: 1 })
  @IsOptional()
  page?: number = 1;

  @ApiProperty({ description: 'Items per page', required: false, default: 10 })
  @IsOptional()
  limit?: number = 10;

  @ApiProperty({
    enum: ModerationStatus,
    description: 'Filter by status',
    required: false,
  })
  @IsOptional()
  @IsEnum(ModerationStatus)
  status?: ModerationStatus;

  @ApiProperty({ description: 'Filter by content type', required: false })
  @IsOptional()
  contentType?: string;

  @ApiProperty({ description: 'Filter by author ID', required: false })
  @IsOptional()
  @IsUUID()
  authorId?: string;

  @ApiProperty({ description: 'Filter by moderator ID', required: false })
  @IsOptional()
  @IsUUID()
  moderatorId?: string;

  @ApiProperty({ description: 'Search in content', required: false })
  @IsOptional()
  @IsString()
  search?: string;
}
