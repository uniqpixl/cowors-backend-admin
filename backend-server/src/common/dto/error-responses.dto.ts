import { ApiProperty } from '@nestjs/swagger';
import { ErrorDto } from './error.dto';

/**
 * Standard 400 Bad Request Error Response
 */
export class BadRequestErrorDto extends ErrorDto {
  @ApiProperty({ example: 400 })
  declare statusCode: 400;

  @ApiProperty({ example: 'Bad Request' })
  declare error: 'Bad Request';
}

/**
 * Standard 401 Unauthorized Error Response
 */
export class UnauthorizedErrorDto extends ErrorDto {
  @ApiProperty({ example: 401 })
  declare statusCode: 401;

  @ApiProperty({ example: 'Unauthorized' })
  declare error: 'Unauthorized';

  @ApiProperty({ example: 'Authentication required' })
  declare message: string;
}

/**
 * Standard 403 Forbidden Error Response
 */
export class ForbiddenErrorDto extends ErrorDto {
  @ApiProperty({ example: 403 })
  declare statusCode: 403;

  @ApiProperty({ example: 'Forbidden' })
  declare error: 'Forbidden';

  @ApiProperty({ example: 'Insufficient permissions' })
  declare message: string;
}

/**
 * Standard 404 Not Found Error Response
 */
export class NotFoundErrorDto extends ErrorDto {
  @ApiProperty({ example: 404 })
  declare statusCode: 404;

  @ApiProperty({ example: 'Not Found' })
  declare error: 'Not Found';

  @ApiProperty({ example: 'Resource not found' })
  declare message: string;
}

/**
 * Standard 409 Conflict Error Response
 */
export class ConflictErrorDto extends ErrorDto {
  @ApiProperty({ example: 409 })
  declare statusCode: 409;

  @ApiProperty({ example: 'Conflict' })
  declare error: 'Conflict';

  @ApiProperty({ example: 'Resource already exists' })
  declare message: string;
}

/**
 * Standard 422 Unprocessable Entity Error Response
 */
export class UnprocessableEntityErrorDto extends ErrorDto {
  @ApiProperty({ example: 422 })
  declare statusCode: 422;

  @ApiProperty({ example: 'Unprocessable Entity' })
  declare error: 'Unprocessable Entity';

  @ApiProperty({ example: 'Validation failed' })
  declare message: string;
}

/**
 * Standard 429 Too Many Requests Error Response
 */
export class TooManyRequestsErrorDto extends ErrorDto {
  @ApiProperty({ example: 429 })
  declare statusCode: 429;

  @ApiProperty({ example: 'Too Many Requests' })
  declare error: 'Too Many Requests';

  @ApiProperty({ example: 'Rate limit exceeded' })
  declare message: string;
}

/**
 * Standard 500 Internal Server Error Response
 */
export class InternalServerErrorDto extends ErrorDto {
  @ApiProperty({ example: 500 })
  declare statusCode: 500;

  @ApiProperty({ example: 'Internal Server Error' })
  declare error: 'Internal Server Error';

  @ApiProperty({ example: 'An unexpected error occurred' })
  declare message: string;
}

/**
 * Standard 503 Service Unavailable Error Response
 */
export class ServiceUnavailableErrorDto extends ErrorDto {
  @ApiProperty({ example: 503 })
  declare statusCode: 503;

  @ApiProperty({ example: 'Service Unavailable' })
  declare error: 'Service Unavailable';

  @ApiProperty({ example: 'Service temporarily unavailable' })
  declare message: string;
}
