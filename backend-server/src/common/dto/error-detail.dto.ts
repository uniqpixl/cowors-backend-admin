import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ErrorDetailDto {
  @ApiPropertyOptional({
    description: 'The property/field that caused the validation error',
    example: 'email',
  })
  property?: string;

  @ApiProperty({
    description: 'Validation error code',
    example: 'isEmail',
  })
  code: string;

  @ApiProperty({
    description: 'Human-readable validation error message',
    example: 'email must be a valid email address',
  })
  message: string;

  @ApiPropertyOptional({
    description: 'The invalid value that caused the error',
    example: 'invalid-email',
  })
  value?: any;

  @ApiPropertyOptional({
    description: 'Additional constraints or context',
    example: { min: 1, max: 100 },
  })
  constraints?: Record<string, any>;
}
