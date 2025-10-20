import { ApiProperty, PartialType } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { CreateReviewDto } from './create-review.dto';

export class UpdateReviewDto extends PartialType(CreateReviewDto) {
  @ApiProperty({
    description: 'Response from the partner/space owner',
    example: 'Thank you for your feedback! We appreciate your review.',
    required: false,
  })
  @IsOptional()
  @IsString()
  response?: string;
}
