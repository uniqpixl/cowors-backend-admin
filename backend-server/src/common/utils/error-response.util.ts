import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  HttpException,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { ErrorDetailDto } from '../dto/error-detail.dto';

/**
 * Utility class for creating standardized error responses
 */
export class ErrorResponseUtil {
  /**
   * Create a Bad Request (400) error
   */
  static badRequest(
    message: string,
    errorCode?: string,
    details?: ErrorDetailDto[],
  ): never {
    throw new BadRequestException({
      message,
      errorCode,
      details,
    });
  }

  /**
   * Create an Unauthorized (401) error
   */
  static unauthorized(
    message = 'Authentication required',
    errorCode = 'UNAUTHORIZED',
  ): never {
    throw new UnauthorizedException({
      message,
      errorCode,
    });
  }

  /**
   * Create a Forbidden (403) error
   */
  static forbidden(
    message = 'Insufficient permissions',
    errorCode = 'FORBIDDEN',
  ): never {
    throw new ForbiddenException({
      message,
      errorCode,
    });
  }

  /**
   * Create a Not Found (404) error
   */
  static notFound(resource: string, identifier?: string | number): never {
    const message = identifier
      ? `${resource} with identifier '${identifier}' not found`
      : `${resource} not found`;

    throw new NotFoundException({
      message,
      errorCode: 'RESOURCE_NOT_FOUND',
    });
  }

  /**
   * Create a Conflict (409) error
   */
  static conflict(message: string, errorCode = 'RESOURCE_CONFLICT'): never {
    throw new ConflictException({
      message,
      errorCode,
    });
  }

  /**
   * Create an Unprocessable Entity (422) error
   */
  static validationFailed(
    message = 'Validation failed',
    details?: ErrorDetailDto[],
  ): never {
    throw new UnprocessableEntityException({
      message,
      errorCode: 'VALIDATION_FAILED',
      details,
    });
  }

  /**
   * Create an Internal Server Error (500)
   */
  static internalServerError(
    message = 'An unexpected error occurred',
    errorCode = 'INTERNAL_SERVER_ERROR',
  ): never {
    throw new InternalServerErrorException({
      message,
      errorCode,
    });
  }

  /**
   * Create a custom HTTP error
   */
  static custom(
    statusCode: number,
    message: string,
    errorCode?: string,
    details?: ErrorDetailDto[],
  ): never {
    throw new HttpException(
      {
        message,
        errorCode,
        details,
      },
      statusCode,
    );
  }

  /**
   * Create validation error details from field-specific errors
   */
  static createValidationDetails(
    fieldErrors: Record<string, string[]>,
  ): ErrorDetailDto[] {
    const details: ErrorDetailDto[] = [];

    Object.entries(fieldErrors).forEach(([field, errors]) => {
      errors.forEach((error) => {
        details.push({
          property: field,
          code: 'validation_error',
          message: error,
        });
      });
    });

    return details;
  }

  /**
   * Create a single validation error detail
   */
  static createValidationDetail(
    property: string,
    code: string,
    message: string,
    value?: any,
    constraints?: Record<string, any>,
  ): ErrorDetailDto {
    return {
      property,
      code,
      message,
      value,
      constraints,
    };
  }
}

/**
 * Common error codes used throughout the application
 */
export const ErrorCodes = {
  // Authentication & Authorization
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',

  // Validation
  VALIDATION_FAILED: 'VALIDATION_FAILED',
  INVALID_INPUT: 'INVALID_INPUT',
  INVALID_STATUS: 'INVALID_STATUS',
  MISSING_REQUIRED_FIELD: 'MISSING_REQUIRED_FIELD',

  // Resources
  RESOURCE_NOT_FOUND: 'RESOURCE_NOT_FOUND',
  RESOURCE_CONFLICT: 'RESOURCE_CONFLICT',
  RESOURCE_ALREADY_EXISTS: 'RESOURCE_ALREADY_EXISTS',

  // Business Logic
  INSUFFICIENT_BALANCE: 'INSUFFICIENT_BALANCE',
  BOOKING_CONFLICT: 'BOOKING_CONFLICT',
  PAYMENT_FAILED: 'PAYMENT_FAILED',
  REFUND_NOT_ALLOWED: 'REFUND_NOT_ALLOWED',
  KYC_VERIFICATION_REQUIRED: 'KYC_VERIFICATION_REQUIRED',

  // System
  INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  CONFIGURATION_ERROR: 'CONFIGURATION_ERROR',
  PAYMENT_GATEWAY_ERROR: 'PAYMENT_GATEWAY_ERROR',

  // File Operations
  FILE_TOO_LARGE: 'FILE_TOO_LARGE',
  INVALID_FILE_TYPE: 'INVALID_FILE_TYPE',
  FILE_UPLOAD_FAILED: 'FILE_UPLOAD_FAILED',
} as const;

export type ErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes];
