import { ContentPageStatus } from '@/database/entities/content-page.entity';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsObject,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateContentPageDto {
  @ApiProperty({
    description: 'Page title',
    example: 'About Us',
    maxLength: 200,
  })
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title: string;

  @ApiProperty({
    description: 'URL slug for the page',
    example: 'about-us',
    maxLength: 200,
  })
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  slug: string;

  @ApiPropertyOptional({
    description: 'Page content in HTML or markdown',
    example: '<h1>Welcome to our platform</h1><p>This is our story...</p>',
  })
  @IsOptional()
  @IsString()
  content?: string;

  @ApiPropertyOptional({
    description: 'SEO meta title',
    example: 'About Us - CoWorks Platform',
    maxLength: 200,
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  metaTitle?: string;

  @ApiPropertyOptional({
    description: 'SEO meta description',
    example:
      'Learn about our mission to connect workspace seekers with providers.',
  })
  @IsOptional()
  @IsString()
  metaDescription?: string;

  @ApiPropertyOptional({
    description: 'SEO meta keywords',
    example: 'coworking, workspace, office rental, flexible workspace',
  })
  @IsOptional()
  @IsString()
  metaKeywords?: string;

  @ApiPropertyOptional({
    description: 'Page status',
    enum: ContentPageStatus,
    default: ContentPageStatus.DRAFT,
  })
  @IsOptional()
  @IsEnum(ContentPageStatus)
  status?: ContentPageStatus;

  @ApiPropertyOptional({
    description: 'Publication date',
    example: '2024-01-15T10:00:00Z',
  })
  @IsOptional()
  @IsDateString()
  publishedAt?: string;

  @ApiPropertyOptional({
    description: 'Featured image URL',
    example: 'https://example.com/images/about-hero.jpg',
  })
  @IsOptional()
  @IsString()
  featuredImage?: string;

  @ApiPropertyOptional({
    description: 'Page excerpt or summary',
    example: 'A brief overview of our company and mission.',
  })
  @IsOptional()
  @IsString()
  excerpt?: string;

  @ApiPropertyOptional({
    description: 'Custom fields for additional data',
    example: { author: 'John Doe', category: 'company' },
  })
  @IsOptional()
  @IsObject()
  customFields?: Record<string, any>;

  @ApiPropertyOptional({
    description: 'Allow comments on this page',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  allowComments?: boolean;

  @ApiPropertyOptional({
    description: 'Mark as featured page',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;

  @ApiPropertyOptional({
    description: 'Template to use for rendering',
    example: 'default',
  })
  @IsOptional()
  @IsString()
  template?: string;

  @ApiPropertyOptional({
    description: 'SEO settings',
    example: {
      canonicalUrl: 'https://example.com/about',
      noIndex: false,
      noFollow: false,
      ogTitle: 'About Us',
      ogDescription: 'Learn about our mission',
      ogImage: 'https://example.com/og-image.jpg',
    },
  })
  @IsOptional()
  @IsObject()
  seoSettings?: {
    canonicalUrl?: string;
    noIndex?: boolean;
    noFollow?: boolean;
    ogTitle?: string;
    ogDescription?: string;
    ogImage?: string;
    twitterTitle?: string;
    twitterDescription?: string;
    twitterImage?: string;
  };
}
