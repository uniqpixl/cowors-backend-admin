import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ErrorDetailDto } from './error-detail.dto';

export class ErrorDto {
  @ApiProperty({
    description: 'HTTP status code',
    example: 400,
  })
  statusCode: number;

  @ApiProperty({
    description: 'Error type/name',
    example: 'Bad Request',
  })
  error: string;

  @ApiProperty({
    description: 'Human-readable error message',
    example: 'The request could not be processed due to invalid input',
  })
  message: string;

  @ApiPropertyOptional({
    description: 'Application-specific error code for client handling',
    example: 'VALIDATION_FAILED',
  })
  errorCode?: string;

  @ApiPropertyOptional({
    description: 'Detailed validation errors',
    type: [ErrorDetailDto],
  })
  details?: ErrorDetailDto[];

  @ApiPropertyOptional({
    description: 'Request timestamp',
    example: '2024-01-15T10:30:00.000Z',
  })
  timestamp?: string;

  @ApiPropertyOptional({
    description: 'Request path that caused the error',
    example: '/api/users/123',
  })
  path?: string;

  @ApiPropertyOptional({
    description: 'Stack trace (only in development)',
  })
  stack?: string;

  @ApiPropertyOptional({
    description: 'Additional error context',
    type: 'object',
    additionalProperties: true,
  })
  trace?: Record<string, unknown>;
}
