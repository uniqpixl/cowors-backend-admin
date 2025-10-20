import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsOptional,
  IsString,
} from 'class-validator';

export class BulkKycReviewDto {
  @ApiProperty({
    description: 'Array of verification IDs to review',
    type: [String],
    example: ['kyc_123', 'kyc_456', 'kyc_789'],
  })
  @IsArray()
  @ArrayMinSize(1, { message: 'At least one verification ID is required' })
  @ArrayMaxSize(50, {
    message: 'Maximum 50 verifications can be reviewed at once',
  })
  @IsString({ each: true })
  verificationIds: string[];

  @ApiProperty({
    description: 'Action to perform on all verifications',
    enum: ['approve', 'reject'],
    example: 'approve',
  })
  @IsEnum(['approve', 'reject'])
  action: 'approve' | 'reject';

  @ApiPropertyOptional({
    description: 'Optional notes for the bulk review',
    example: 'Bulk approval after manual verification',
  })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class BulkKycReviewResultDto {
  @ApiProperty({ description: 'Whether the bulk operation was successful' })
  success: boolean;

  @ApiProperty({ description: 'Summary message of the operation' })
  message: string;

  @ApiProperty({
    description: 'Summary statistics of the bulk operation',
    example: {
      total: 10,
      successful: 8,
      failed: 2,
      action: 'approve',
    },
  })
  summary: {
    total: number;
    successful: number;
    failed: number;
    action: string;
  };

  @ApiProperty({
    description: 'Array of successful results',
    type: 'array',
    items: {
      type: 'object',
      properties: {
        verificationId: { type: 'string' },
        status: { type: 'string', enum: ['success'] },
        result: { type: 'object' },
      },
    },
  })
  results: Array<{
    verificationId: string;
    status: 'success';
    result: any;
  }>;

  @ApiProperty({
    description: 'Array of failed operations',
    type: 'array',
    items: {
      type: 'object',
      properties: {
        verificationId: { type: 'string' },
        status: { type: 'string', enum: ['error'] },
        error: { type: 'string' },
      },
    },
  })
  errors: Array<{
    verificationId: string;
    status: 'error';
    error: string;
  }>;

  @ApiProperty({ description: 'Timestamp when the operation was processed' })
  processedAt: Date;

  @ApiPropertyOptional({
    description: 'ID of the admin who processed the bulk operation',
  })
  processedBy?: string;
}
