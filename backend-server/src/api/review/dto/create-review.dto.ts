import { ReviewType } from '@/common/enums/review.enum';
import { ApiProperty } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';

export class CreateReviewDto {
  @ApiProperty({
    description: 'Type of review (space or partner)',
    enum: ReviewType,
    example: ReviewType.SPACE,
  })
  @IsEnum(ReviewType)
  @IsNotEmpty()
  type: ReviewType;

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
    description: 'Rating from 1 to 5',
    minimum: 1,
    maximum: 5,
    example: 4.5,
  })
  @IsNumber({ maxDecimalPlaces: 1 })
  @Min(1)
  @Max(5)
  rating: number;

  @ApiProperty({
    description: 'Review comment',
    example: 'Great space with excellent amenities!',
    required: false,
  })
  @IsOptional()
  @IsString()
  comment?: string;

  @ApiProperty({
    description: 'Array of image URLs',
    type: [String],
    required: false,
    maxItems: 5,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(5)
  images?: string[];

  @ApiProperty({
    description: 'Space ID (required for space reviews)',
    example: '123e4567-e89b-12d3-a456-426614174000',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  spaceId?: string;

  @ApiProperty({
    description: 'Partner ID (required for partner reviews)',
    example: '123e4567-e89b-12d3-a456-426614174000',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  partnerId?: string;

  @ApiProperty({
    description: 'Booking ID (optional, links review to specific booking)',
    example: '123e4567-e89b-12d3-a456-426614174000',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  bookingId?: string;
}
