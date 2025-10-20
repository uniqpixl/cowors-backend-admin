import { Logger } from '@nestjs/common';
import { DomainEvent } from '../domain-event.interface';
import { EventRetryService, RetryConfig } from '../retry/event-retry.service';

export interface EventErrorHandlerOptions {
  retryConfig?: Partial<RetryConfig>;
  logLevel?: 'error' | 'warn' | 'debug';
  suppressErrors?: boolean; // If true, errors won't be thrown after handling
  customErrorHandler?: (
    error: Error,
    event: DomainEvent,
    eventType: string,
  ) => Promise<void>;
}

/**
 * Decorator to add error handling and retry logic to event handlers
 */
export function EventErrorHandler(options: EventErrorHandlerOptions = {}) {
  return function (
    target: any,
    propertyName: string,
    descriptor: PropertyDescriptor,
  ) {
    const originalMethod = descriptor.value;
    const logger = new Logger(`${target.constructor.name}.${propertyName}`);

    descriptor.value = async function (...args: any[]) {
      const [event] = args; // First argument should be the event
      const eventType =
        this.getEventType?.(propertyName) ||
        propertyName.replace('handle', '').toLowerCase();

      try {
        return await originalMethod.apply(this, args);
      } catch (error) {
        const logLevel = options.logLevel || 'error';
        const errorMessage = `Event handler ${target.constructor.name}.${propertyName} failed: ${error.message}`;

        // Log the error
        switch (logLevel) {
          case 'error':
            logger.error(errorMessage, error.stack);
            break;
          case 'warn':
            logger.warn(errorMessage);
            break;
          case 'debug':
            logger.debug(errorMessage);
            break;
        }

        // Custom error handler
        if (options.customErrorHandler) {
          try {
            await options.customErrorHandler(error, event, eventType);
          } catch (customError) {
            logger.error(
              `Custom error handler failed: ${customError.message}`,
              customError.stack,
            );
          }
        }

        // Retry logic (if retry service is available)
        if (
          this.eventRetryService &&
          this.eventRetryService instanceof EventRetryService
        ) {
          await this.eventRetryService.handleFailedEvent(
            event,
            eventType,
            `${target.constructor.name}.${propertyName}`,
            error,
            options.retryConfig,
          );
        }

        // Emit error event for monitoring
        if (this.eventEmitter) {
          this.eventEmitter.emit('event.handler.error', {
            handler: `${target.constructor.name}.${propertyName}`,
            eventType,
            eventId: event?.eventId,
            error: error.message,
            stack: error.stack,
            timestamp: new Date(),
          });
        }

        // Re-throw error unless suppressed
        if (!options.suppressErrors) {
          throw error;
        }
      }
    };

    return descriptor;
  };
}

/**
 * Decorator for critical event handlers that should never fail silently
 */
export function CriticalEventHandler(retryConfig?: Partial<RetryConfig>) {
  return EventErrorHandler({
    retryConfig: {
      maxRetries: 5,
      baseDelay: 2000,
      maxDelay: 60000,
      backoffMultiplier: 2,
      ...retryConfig,
    },
    logLevel: 'error',
    suppressErrors: false,
  });
}

/**
 * Decorator for non-critical event handlers that can fail silently
 */
export function NonCriticalEventHandler(retryConfig?: Partial<RetryConfig>) {
  return EventErrorHandler({
    retryConfig: {
      maxRetries: 2,
      baseDelay: 1000,
      maxDelay: 10000,
      backoffMultiplier: 1.5,
      ...retryConfig,
    },
    logLevel: 'warn',
    suppressErrors: true,
  });
}

/**
 * Decorator for analytics event handlers that should not block main flow
 */
export function AnalyticsEventHandler(retryConfig?: Partial<RetryConfig>) {
  return EventErrorHandler({
    retryConfig: {
      maxRetries: 1,
      baseDelay: 5000,
      maxDelay: 30000,
      backoffMultiplier: 1,
      ...retryConfig,
    },
    logLevel: 'debug',
    suppressErrors: true,
  });
}
