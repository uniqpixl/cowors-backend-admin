import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import {
  EntityType,
  IdGeneratorService,
} from '../../../utils/id-generator.service';
import { AuditService } from '../audit.service';
import { AuditAction, AuditSeverity } from '../entities/audit-log.entity';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuditInterceptor.name);

  constructor(
    private readonly auditService: AuditService,
    private readonly idGeneratorService: IdGeneratorService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    const startTime = Date.now();

    // Extract request information
    const { method, url, ip, headers, body, params, query } = request;
    const user = (request as any).user;

    const userAgent = headers['user-agent'] || '';
    const userId = user?.['id'] || null;
    const sessionId = headers['x-session-id'] || null;
    const requestId =
      headers['x-request-id'] ||
      this.idGeneratorService.generateId(EntityType.REQUEST);

    // Skip logging for certain endpoints to avoid noise
    const skipLogging = this.shouldSkipLogging(url, method);

    return next.handle().pipe(
      tap((data) => {
        if (!skipLogging) {
          const executionTime = Date.now() - startTime;
          const statusCode = response.statusCode;

          // Log successful requests
          this.logRequest({
            userId,
            method,
            url,
            ip,
            userAgent,
            sessionId,
            requestId,
            statusCode,
            executionTime,
            isSuccessful: true,
            body: this.sanitizeBody(body),
            params,
            query,
          });
        }
      }),
      catchError((error) => {
        if (!skipLogging) {
          const executionTime = Date.now() - startTime;
          const statusCode = error.status || 500;

          // Log failed requests
          this.logRequest({
            userId,
            method,
            url,
            ip,
            userAgent,
            sessionId,
            requestId,
            statusCode,
            executionTime,
            isSuccessful: false,
            errorMessage: error.message,
            body: this.sanitizeBody(body),
            params,
            query,
          });
        }

        return throwError(() => error);
      }),
    );
  }

  private async logRequest(requestData: any): Promise<void> {
    try {
      const {
        userId,
        method,
        url,
        ip,
        userAgent,
        sessionId,
        requestId,
        statusCode,
        executionTime,
        isSuccessful,
        errorMessage,
        body,
        params,
        query,
      } = requestData;

      // Determine action based on HTTP method and URL
      const action = this.determineAction(method, url);
      const severity = this.determineSeverity(statusCode, isSuccessful);
      const resourceType = this.extractResourceType(url);
      const resourceId = this.extractResourceId(params);

      await this.auditService.createAuditLog({
        userId,
        action,
        resourceType,
        resourceId,
        description: `${method} ${url}`,
        ipAddress: ip,
        userAgent,
        sessionId,
        requestId,
        endpoint: url,
        httpMethod: method,
        responseStatus: statusCode,
        executionTime,
        isSuccessful,
        errorMessage,
        severity,
        metadata: {
          body,
          params,
          query,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      this.logger.error('Failed to log request audit', error.stack);
    }
  }

  private shouldSkipLogging(url: string, method: string): boolean {
    // Skip logging for health checks, metrics, and other noise
    const skipPatterns = [
      '/health',
      '/metrics',
      '/favicon.ico',
      '/audit/health',
      '/audit/logs',
    ];

    // Skip GET requests to audit endpoints to avoid recursive logging
    if (method === 'GET' && url.includes('/audit/')) {
      return true;
    }

    return skipPatterns.some((pattern) => url.includes(pattern));
  }

  private determineAction(method: string, url: string): AuditAction {
    // Map HTTP methods and URLs to audit actions
    if (url.includes('/auth/login')) {
      return AuditAction.LOGIN;
    }
    if (url.includes('/auth/logout')) {
      return AuditAction.LOGOUT;
    }
    if (url.includes('/auth/') && method === 'POST') {
      return AuditAction.LOGIN;
    }
    if (url.includes('/users/') && url.includes('/password')) {
      return AuditAction.PASSWORD_CHANGE;
    }
    if (url.includes('/users/') && url.includes('/role')) {
      return AuditAction.ROLE_CHANGE;
    }
    if (url.includes('/finance/payouts') && method === 'POST') {
      return AuditAction.PAYOUT_PROCESS;
    }
    if (url.includes('/finance/') && method === 'POST') {
      return AuditAction.PAYMENT_PROCESS;
    }
    if (url.includes('/content/') && url.includes('/publish')) {
      return AuditAction.CONTENT_PUBLISH;
    }
    if (url.includes('/media') && method === 'POST') {
      return AuditAction.FILE_UPLOAD;
    }
    if (url.includes('/media') && method === 'DELETE') {
      return AuditAction.FILE_DELETE;
    }
    if (url.includes('/config')) {
      return AuditAction.CONFIGURATION_CHANGE;
    }

    // Default actions based on HTTP method
    switch (method) {
      case 'POST':
        return AuditAction.CREATE;
      case 'PUT':
      case 'PATCH':
        return AuditAction.UPDATE;
      case 'DELETE':
        return AuditAction.DELETE;
      default:
        return AuditAction.CREATE; // Default fallback
    }
  }

  private determineSeverity(
    statusCode: number,
    isSuccessful: boolean,
  ): AuditSeverity {
    if (!isSuccessful) {
      if (statusCode >= 500) {
        return AuditSeverity.CRITICAL;
      }
      if (statusCode >= 400) {
        return AuditSeverity.HIGH;
      }
    }

    // Successful requests
    if (statusCode >= 200 && statusCode < 300) {
      return AuditSeverity.LOW;
    }

    return AuditSeverity.MEDIUM;
  }

  private extractResourceType(url: string): string {
    // Extract resource type from URL
    const segments = url.split('/').filter((segment) => segment.length > 0);

    if (segments.length >= 2) {
      // Skip 'api' and version segments
      const resourceSegment = segments.find(
        (segment) => !['api', 'v1', 'v2'].includes(segment),
      );
      return resourceSegment?.toUpperCase() || 'UNKNOWN';
    }

    return 'UNKNOWN';
  }

  private extractResourceId(params: any): string | null {
    // Extract resource ID from route parameters
    if (params && typeof params === 'object') {
      return (
        params.id || params.userId || params.spaceId || params.bookingId || null
      );
    }
    return null;
  }

  private sanitizeBody(body: any): any {
    if (!body || typeof body !== 'object') {
      return body;
    }

    // Remove sensitive fields from body
    const sensitiveFields = [
      'password',
      'confirmPassword',
      'currentPassword',
      'newPassword',
      'token',
      'refreshToken',
      'accessToken',
      'apiKey',
      'secret',
      'privateKey',
      'creditCard',
      'cardNumber',
      'cvv',
      'ssn',
      'socialSecurityNumber',
    ];

    const sanitized = { ...body };

    sensitiveFields.forEach((field) => {
      if (sanitized[field]) {
        sanitized[field] = '[REDACTED]';
      }
    });

    return sanitized;
  }
}
