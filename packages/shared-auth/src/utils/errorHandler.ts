/**
 * Unified error handling utilities for Cowors applications
 */

export interface ErrorContext {
  userId?: string;
  sessionId?: string;
  userAgent?: string;
  url?: string;
  timestamp?: Date;
  additionalData?: Record<string, any>;
}

export interface ErrorReport {
  error: Error;
  context: ErrorContext;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: 'auth' | 'api' | 'ui' | 'network' | 'validation' | 'unknown';
}

/**
 * Categorizes errors based on their type and message
 */
export function categorizeError(error: Error): ErrorReport['category'] {
  const message = error.message.toLowerCase();
  const name = error.name.toLowerCase();

  // Authentication errors
  if (name.includes('auth') || message.includes('unauthorized') || 
      message.includes('forbidden') || message.includes('token')) {
    return 'auth';
  }

  // Network errors
  if (name.includes('network') || message.includes('fetch') || 
      message.includes('connection') || message.includes('timeout')) {
    return 'network';
  }

  // API errors
  if (message.includes('api') || message.includes('server') || 
      message.includes('response') || name.includes('http')) {
    return 'api';
  }

  // Validation errors
  if (name.includes('validation') || message.includes('invalid') || 
      message.includes('required') || message.includes('format')) {
    return 'validation';
  }

  // UI/React errors
  if (name.includes('react') || message.includes('component') || 
      message.includes('render') || message.includes('hook')) {
    return 'ui';
  }

  return 'unknown';
}

/**
 * Determines error severity based on category and error details
 */
export function getErrorSeverity(error: Error, category: ErrorReport['category']): ErrorReport['severity'] {
  const message = error.message.toLowerCase();

  // Critical errors that break core functionality
  if (category === 'auth' && (message.includes('session') || message.includes('token'))) {
    return 'critical';
  }

  if (category === 'api' && message.includes('500')) {
    return 'high';
  }

  if (category === 'network' && message.includes('timeout')) {
    return 'medium';
  }

  if (category === 'validation') {
    return 'low';
  }

  if (category === 'ui') {
    return 'medium';
  }

  return 'medium';
}

/**
 * Creates a standardized error report
 */
export function createErrorReport(error: Error, context: Partial<ErrorContext> = {}): ErrorReport {
  const category = categorizeError(error);
  const severity = getErrorSeverity(error, category);
  
  const fullContext: ErrorContext = {
    timestamp: new Date(),
    url: typeof window !== 'undefined' ? window.location.href : undefined,
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
    ...context
  };

  return {
    error,
    context: fullContext,
    severity,
    category
  };
}

/**
 * Logs error to console with structured format
 */
export function logError(errorReport: ErrorReport): void {
  const { error, context, severity, category } = errorReport;
  
  const logData = {
    message: error.message,
    name: error.name,
    stack: error.stack,
    category,
    severity,
    context,
    timestamp: context.timestamp?.toISOString()
  };

  switch (severity) {
    case 'critical':
    case 'high':
      console.error(`[${category.toUpperCase()}] ${severity.toUpperCase()}:`, logData);
      break;
    case 'medium':
      console.warn(`[${category.toUpperCase()}] ${severity.toUpperCase()}:`, logData);
      break;
    case 'low':
      console.info(`[${category.toUpperCase()}] ${severity.toUpperCase()}:`, logData);
      break;
  }
}

/**
 * Sends error report to external service (placeholder for future implementation)
 */
export async function reportError(errorReport: ErrorReport): Promise<void> {
  // In development, just log to console
  if (process.env.NODE_ENV === 'development') {
    logError(errorReport);
    return;
  }

  // TODO: Implement actual error reporting service integration
  // This could be Sentry, LogRocket, or custom error tracking service
  try {
    // Example implementation:
    // await fetch('/api/errors', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(errorReport)
    // });
    
    logError(errorReport);
  } catch (reportingError) {
    console.error('Failed to report error:', reportingError);
    logError(errorReport);
  }
}

/**
 * Main error handler function that processes and reports errors
 */
export async function handleError(error: Error, context: Partial<ErrorContext> = {}): Promise<void> {
  const errorReport = createErrorReport(error, context);
  await reportError(errorReport);
}

/**
 * React hook for error handling in functional components
 */
export function useErrorHandler() {
  const handleError = async (error: Error, additionalContext: Partial<ErrorContext> = {}) => {
    const context: Partial<ErrorContext> = {
      ...additionalContext,
      timestamp: new Date()
    };
    
    await handleError(error, context);
  };

  return { handleError };
}

/**
 * Higher-order function to wrap async functions with error handling
 */
export function withErrorHandling<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  context: Partial<ErrorContext> = {}
): T {
  return (async (...args: Parameters<T>) => {
    try {
      return await fn(...args);
    } catch (error) {
      await handleError(error as Error, context);
      throw error; // Re-throw to allow component-level handling
    }
  }) as T;
}

/**
 * Utility to create user-friendly error messages
 */
export function getUserFriendlyMessage(error: Error, category?: ErrorReport['category']): string {
  const errorCategory = category || categorizeError(error);
  
  switch (errorCategory) {
    case 'auth':
      return 'Authentication failed. Please sign in again.';
    case 'network':
      return 'Network connection issue. Please check your internet connection and try again.';
    case 'api':
      return 'Server error occurred. Please try again later.';
    case 'validation':
      return 'Please check your input and try again.';
    case 'ui':
      return 'Something went wrong. Please refresh the page.';
    default:
      return 'An unexpected error occurred. Please try again.';
  }
}