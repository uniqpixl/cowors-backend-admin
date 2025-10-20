import { GlobalConfig } from '@/config/config.type';
import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ValidationError } from 'class-validator';
import { FastifyReply, FastifyRequest } from 'fastify';
import { ErrorDetailDto } from '../dto/error-detail.dto';
import { ErrorDto } from '../dto/error.dto';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  constructor(private readonly configService: ConfigService<GlobalConfig>) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<FastifyReply>();
    const request = ctx.getRequest<FastifyRequest>();

    const errorResponse = this.buildErrorResponse(exception, request);

    // Log the error
    this.logError(exception, request, errorResponse);

    response.status(errorResponse.statusCode).send(errorResponse);
  }

  private buildErrorResponse(
    exception: unknown,
    request: FastifyRequest,
  ): ErrorDto {
    const timestamp = new Date().toISOString();
    const path = request.url;
    const isDevelopment =
      this.configService.get('app.nodeEnv', { infer: true }) === 'development';

    // Handle HttpException (NestJS exceptions)
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      let message: string;
      let details: ErrorDetailDto[] | undefined;
      let errorCode: string | undefined;

      if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        const responseObj = exceptionResponse as any;

        // Handle validation errors (UnprocessableEntityException)
        if (
          Array.isArray(responseObj.message) &&
          responseObj.message[0] instanceof ValidationError
        ) {
          message = 'Validation failed';
          details = this.extractValidationErrors(responseObj.message);
          errorCode = 'VALIDATION_FAILED';
        } else if (Array.isArray(responseObj.message)) {
          message = responseObj.message.join(', ');
        } else {
          message = responseObj.message || exception.message;
        }

        errorCode = errorCode || responseObj.errorCode;
      } else {
        message = (exceptionResponse as string) || exception.message;
      }

      return {
        statusCode: status,
        error: this.getHttpStatusText(status),
        message,
        errorCode,
        details,
        timestamp,
        path,
        ...(isDevelopment && { stack: exception.stack }),
      };
    }

    // Handle other errors (unexpected errors)
    const status = HttpStatus.INTERNAL_SERVER_ERROR;
    const message = isDevelopment
      ? (exception as Error)?.message || 'An unexpected error occurred'
      : 'Internal server error';

    return {
      statusCode: status,
      error: this.getHttpStatusText(status),
      message,
      errorCode: 'INTERNAL_SERVER_ERROR',
      timestamp,
      path,
      ...(isDevelopment && {
        stack: (exception as Error)?.stack,
        trace: exception as Record<string, unknown>,
      }),
    };
  }

  private extractValidationErrors(
    validationErrors: ValidationError[],
  ): ErrorDetailDto[] {
    const details: ErrorDetailDto[] = [];

    const processError = (error: ValidationError, parentProperty = '') => {
      const property = parentProperty
        ? `${parentProperty}.${error.property}`
        : error.property;

      if (error.constraints) {
        Object.entries(error.constraints).forEach(([code, message]) => {
          details.push({
            property,
            code,
            message,
            value: error.value,
            constraints: error.constraints,
          });
        });
      }

      if (error.children && error.children.length > 0) {
        error.children.forEach((child) => processError(child, property));
      }
    };

    validationErrors.forEach((error) => processError(error));
    return details;
  }

  private getHttpStatusText(status: number): string {
    const statusTexts: Record<number, string> = {
      400: 'Bad Request',
      401: 'Unauthorized',
      403: 'Forbidden',
      404: 'Not Found',
      409: 'Conflict',
      422: 'Unprocessable Entity',
      429: 'Too Many Requests',
      500: 'Internal Server Error',
      502: 'Bad Gateway',
      503: 'Service Unavailable',
      504: 'Gateway Timeout',
    };

    return statusTexts[status] || 'Unknown Error';
  }

  private logError(
    exception: unknown,
    request: FastifyRequest,
    errorResponse: ErrorDto,
  ): void {
    const { method, url } = request;
    const { statusCode, message, errorCode } = errorResponse;

    const logMessage = `${method} ${url} - ${statusCode} ${message}`;
    const logContext = {
      statusCode,
      errorCode,
      method,
      url,
      userAgent: request.headers['user-agent'],
      ip: request.ip,
    };

    if (statusCode >= 500) {
      this.logger.error(logMessage, (exception as Error)?.stack, logContext);
    } else if (statusCode >= 400) {
      this.logger.warn(logMessage, logContext);
    }
  }
}
