import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';
import {
  ContentType,
  ModerationAction,
} from '../entities/content-moderation.entity';

export class CreateModerationDto {
  @ApiProperty({
    enum: ContentType,
    description: 'Type of content being moderated',
  })
  @IsEnum(ContentType)
  contentType: ContentType;

  @ApiProperty({ description: 'ID of the content being moderated' })
  @IsUUID()
  contentId: string;

  @ApiProperty({ description: 'The actual content text' })
  @IsString()
  content: string;

  @ApiProperty({ description: 'ID of the content author' })
  @IsUUID()
  authorId: string;

  @ApiProperty({
    enum: ModerationAction,
    description: 'Action taken during moderation',
  })
  @IsEnum(ModerationAction)
  action: ModerationAction;

  @ApiProperty({ description: 'Reason for moderation', required: false })
  @IsOptional()
  @IsString()
  moderationReason?: string;

  @ApiProperty({
    description: 'Keywords that triggered moderation',
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  flaggedKeywords?: string[];

  @ApiProperty({ description: 'AI toxicity score (0-1)', required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  toxicityScore?: number;

  @ApiProperty({ description: 'Additional metadata', required: false })
  @IsOptional()
  metadata?: Record<string, any>;
}
