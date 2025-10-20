import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class UploadMediaDto {
  @ApiPropertyOptional({
    description: 'Alternative text for the media',
    example: 'Company logo',
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  alt?: string;

  @ApiPropertyOptional({
    description: 'Description of the media',
    example: 'High-resolution company logo for website header',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'Folder to organize the media',
    example: 'logos',
  })
  @IsOptional()
  @IsString()
  folder?: string;

  @ApiPropertyOptional({
    description: 'Whether the media is publicly accessible',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;

  @ApiPropertyOptional({
    description: 'Tags for organizing media',
    example: ['logo', 'branding', 'header'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({
    description: 'Additional metadata',
    example: { source: 'design-team', version: '2.1' },
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

export class UpdateMediaDto {
  @ApiPropertyOptional({
    description: 'Alternative text for the media',
    example: 'Updated company logo',
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  alt?: string;

  @ApiPropertyOptional({
    description: 'Description of the media',
    example: 'Updated high-resolution company logo',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'Folder to organize the media',
    example: 'logos/2024',
  })
  @IsOptional()
  @IsString()
  folder?: string;

  @ApiPropertyOptional({
    description: 'Whether the media is publicly accessible',
  })
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;

  @ApiPropertyOptional({
    description: 'Tags for organizing media',
    example: ['logo', 'branding', 'header', 'updated'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({
    description: 'Additional metadata',
    example: { source: 'design-team', version: '2.2', updatedBy: 'admin' },
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}
