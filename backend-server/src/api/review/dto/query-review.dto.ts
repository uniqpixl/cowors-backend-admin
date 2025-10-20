import { ReviewType } from '@/common/enums/review.enum';
import { ApiProperty } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsUUID,
  Max,
  Min,
} from 'class-validator';
// Removed GraphQL schema import - using string literals instead

export class QueryReviewDto {
  @ApiProperty({
    description: 'Page number for pagination',
    example: 1,
    required: false,
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiProperty({
    description: 'Number of items per page',
    example: 10,
    required: false,
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @ApiProperty({
    description: 'Filter by review type',
    enum: ReviewType,
    required: false,
  })
  @IsOptional()
  @IsEnum(ReviewType)
  type?: ReviewType;

  @ApiProperty({
    description: 'Type of review (alias for type)',
    enum: ReviewType,
    example: ReviewType.SPACE,
    required: false,
  })
  @IsOptional()
  @IsEnum(ReviewType)
  reviewType?: ReviewType;

  @ApiProperty({
    description: 'Filter by verified reviews only',
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  verifiedOnly?: boolean;

  @ApiProperty({
    description: 'Filter by space ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  spaceId?: string;

  @ApiProperty({
    description: 'Filter by partner ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  partnerId?: string;

  @ApiProperty({
    description: 'Filter by user ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  userId?: string;

  @ApiProperty({
    description: 'Minimum rating filter',
    example: 3,
    required: false,
    minimum: 1,
    maximum: 5,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(5)
  minRating?: number;

  @ApiProperty({
    description: 'Maximum rating filter',
    example: 5,
    required: false,
    minimum: 1,
    maximum: 5,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(5)
  maxRating?: number;

  @ApiProperty({
    description: 'Show only verified reviews',
    example: true,
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true')
  isVerified?: boolean;

  @ApiProperty({
    description: 'Sort by field',
    enum: ['createdAt', 'rating', 'updatedAt'],
    default: 'createdAt',
    required: false,
  })
  @IsOptional()
  sortBy?: 'createdAt' | 'rating' | 'updatedAt' = 'createdAt';

  @ApiProperty({
    description: 'Sort order',
    enum: ['ASC', 'DESC'],
    default: 'DESC',
    required: false,
  })
  @IsOptional()
  sortOrder?: 'ASC' | 'DESC' = 'DESC';

  @ApiProperty({
    description: 'Filter by flagged reviews only',
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  isFlagged?: boolean;

  @ApiProperty({
    description: 'Start date for date range filtering',
    required: false,
  })
  @IsOptional()
  startDate?: string;

  @ApiProperty({
    description: 'End date for date range filtering',
    required: false,
  })
  @IsOptional()
  endDate?: string;
}
