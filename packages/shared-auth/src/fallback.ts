import { NextAuthOptions, Session, JWT } from 'next-auth';
import { User } from '@cowors/shared-types';

// Fallback strategy types
export type FallbackStrategy = 'allow' | 'deny' | 'redirect' | 'retry';

// Error types for auth failures
export enum AuthErrorType {
  NETWORK_ERROR = 'NETWORK_ERROR',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  SERVER_ERROR = 'SERVER_ERROR',
  VALIDATION_FAILED = 'VALIDATION_FAILED',
  RATE_LIMITED = 'RATE_LIMITED',
}

// Fallback configuration
export interface FallbackConfig {
  strategy: FallbackStrategy;
  maxRetries?: number;
  retryDelay?: number;
  redirectUrl?: string;
  enableLogging?: boolean;
  gracePeriod?: number; // Grace period in ms for expired tokens
}

// Error context for fallback decisions
export interface ErrorContext {
  error: AuthErrorType;
  originalError?: Error;
  attempt: number;
  timestamp: Date;
  userId?: string;
  sessionId?: string;
}

// Fallback result
export interface FallbackResult {
  action: 'allow' | 'deny' | 'redirect' | 'retry';
  session?: Session | null;
  redirectUrl?: string;
  retryAfter?: number;
  message?: string;
}

// Fallback handler class
export class AuthFallbackHandler {
  private config: FallbackConfig;
  private retryAttempts: Map<string, number> = new Map();
  private lastErrors: Map<string, Date> = new Map();

  constructor(config: FallbackConfig) {
    this.config = {
      maxRetries: 3,
      retryDelay: 1000,
      enableLogging: true,
      gracePeriod: 5 * 60 * 1000, // 5 minutes
      ...config,
    };
  }

  // Handle authentication errors with fallback strategies
  async handleError(
    context: ErrorContext,
    session?: Session | null,
    token?: JWT | null
  ): Promise<FallbackResult> {
    const key = this.getErrorKey(context);
    
    if (this.config.enableLogging) {
      console.warn('Auth fallback triggered:', {
        error: context.error,
        attempt: context.attempt,
        userId: context.userId,
        strategy: this.config.strategy,
      });
    }

    // Check if we're in grace period for expired tokens
    if (context.error === AuthErrorType.TOKEN_EXPIRED && this.isInGracePeriod(context)) {
      return {
        action: 'allow',
        session,
        message: 'Token expired but within grace period',
      };
    }

    // Apply fallback strategy
    switch (this.config.strategy) {
      case 'allow':
        return this.handleAllowStrategy(context, session);
      
      case 'deny':
        return this.handleDenyStrategy(context);
      
      case 'redirect':
        return this.handleRedirectStrategy(context);
      
      case 'retry':
        return this.handleRetryStrategy(context, key);
      
      default:
        return this.handleDenyStrategy(context);
    }
  }

  // Allow strategy - permit access with degraded session
  private handleAllowStrategy(
    context: ErrorContext,
    session?: Session | null
  ): FallbackResult {
    // Create a degraded session for certain error types
    if (context.error === AuthErrorType.NETWORK_ERROR || 
        context.error === AuthErrorType.VALIDATION_FAILED) {
      return {
        action: 'allow',
        session: session || this.createDegradedSession(context),
        message: 'Access granted with fallback session',
      };
    }

    return {
      action: 'allow',
      session,
      message: 'Access granted despite error',
    };
  }

  // Deny strategy - block access
  private handleDenyStrategy(context: ErrorContext): FallbackResult {
    return {
      action: 'deny',
      session: null,
      message: `Access denied: ${context.error}`,
    };
  }

  // Redirect strategy - redirect to appropriate page
  private handleRedirectStrategy(context: ErrorContext): FallbackResult {
    let redirectUrl = this.config.redirectUrl || '/auth/login';

    // Customize redirect based on error type
    switch (context.error) {
      case AuthErrorType.TOKEN_EXPIRED:
        redirectUrl = '/auth/login?reason=expired';
        break;
      case AuthErrorType.INVALID_CREDENTIALS:
        redirectUrl = '/auth/login?reason=invalid';
        break;
      case AuthErrorType.RATE_LIMITED:
        redirectUrl = '/auth/error?reason=rate-limited';
        break;
      case AuthErrorType.SERVER_ERROR:
        redirectUrl = '/auth/error?reason=server-error';
        break;
    }

    return {
      action: 'redirect',
      redirectUrl,
      message: `Redirecting due to ${context.error}`,
    };
  }

  // Retry strategy - attempt retry with backoff
  private handleRetryStrategy(
    context: ErrorContext,
    key: string
  ): FallbackResult {
    const currentAttempts = this.retryAttempts.get(key) || 0;
    
    if (currentAttempts >= (this.config.maxRetries || 3)) {
      // Max retries reached, fall back to deny
      this.retryAttempts.delete(key);
      return this.handleDenyStrategy(context);
    }

    // Increment retry count
    this.retryAttempts.set(key, currentAttempts + 1);
    
    // Calculate retry delay with exponential backoff
    const delay = (this.config.retryDelay || 1000) * Math.pow(2, currentAttempts);

    return {
      action: 'retry',
      retryAfter: delay,
      message: `Retry attempt ${currentAttempts + 1}/${this.config.maxRetries}`,
    };
  }

  // Check if token expiration is within grace period
  private isInGracePeriod(context: ErrorContext): boolean {
    if (!this.config.gracePeriod) return false;
    
    const errorAge = Date.now() - context.timestamp.getTime();
    return errorAge <= this.config.gracePeriod;
  }

  // Create a degraded session for fallback access
  private createDegradedSession(context: ErrorContext): Session {
    return {
      user: {
        id: context.userId || 'fallback-user',
        email: 'fallback@example.com',
        name: 'Fallback User',
        role: 'USER' as any,
      },
      expires: new Date(Date.now() + 60 * 60 * 1000).toISOString(), // 1 hour
    };
  }

  // Generate unique key for error tracking
  private getErrorKey(context: ErrorContext): string {
    return `${context.error}-${context.userId || 'anonymous'}-${context.sessionId || 'no-session'}`;
  }

  // Reset retry attempts for a specific key
  resetRetries(userId?: string, sessionId?: string): void {
    if (userId || sessionId) {
      const pattern = `${userId || 'anonymous'}-${sessionId || 'no-session'}`;
      for (const [key] of this.retryAttempts) {
        if (key.includes(pattern)) {
          this.retryAttempts.delete(key);
        }
      }
    } else {
      this.retryAttempts.clear();
    }
  }

  // Get current retry statistics
  getRetryStats(): { key: string; attempts: number }[] {
    return Array.from(this.retryAttempts.entries()).map(([key, attempts]) => ({
      key,
      attempts,
    }));
  }
}

// Utility function to create error context
export function createErrorContext(
  error: AuthErrorType,
  originalError?: Error,
  userId?: string,
  sessionId?: string
): ErrorContext {
  return {
    error,
    originalError,
    attempt: 1,
    timestamp: new Date(),
    userId,
    sessionId,
  };
}

// Utility function to determine error type from error object
export function classifyError(error: Error): AuthErrorType {
  const message = error.message.toLowerCase();
  
  if (message.includes('network') || message.includes('fetch')) {
    return AuthErrorType.NETWORK_ERROR;
  }
  
  if (message.includes('expired') || message.includes('token')) {
    return AuthErrorType.TOKEN_EXPIRED;
  }
  
  if (message.includes('credentials') || message.includes('unauthorized')) {
    return AuthErrorType.INVALID_CREDENTIALS;
  }
  
  if (message.includes('rate') || message.includes('limit')) {
    return AuthErrorType.RATE_LIMITED;
  }
  
  if (message.includes('server') || message.includes('500')) {
    return AuthErrorType.SERVER_ERROR;
  }
  
  return AuthErrorType.VALIDATION_FAILED;
}

// Create fallback handler instance
export function createFallbackHandler(config: FallbackConfig): AuthFallbackHandler {
  return new AuthFallbackHandler(config);
}

// Default fallback configurations for different environments
export const developmentFallback: FallbackConfig = {
  strategy: 'allow',
  maxRetries: 5,
  retryDelay: 500,
  enableLogging: true,
  gracePeriod: 10 * 60 * 1000, // 10 minutes
};

export const productionFallback: FallbackConfig = {
  strategy: 'redirect',
  maxRetries: 3,
  retryDelay: 1000,
  redirectUrl: '/auth/login',
  enableLogging: false,
  gracePeriod: 2 * 60 * 1000, // 2 minutes
};

export const strictFallback: FallbackConfig = {
  strategy: 'deny',
  maxRetries: 1,
  retryDelay: 2000,
  enableLogging: true,
  gracePeriod: 0,
};