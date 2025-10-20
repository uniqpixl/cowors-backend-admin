import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { DomainEvent } from '../domain-event.interface';

export interface RetryConfig {
  maxRetries: number;
  baseDelay: number; // in milliseconds
  maxDelay: number; // in milliseconds
  backoffMultiplier: number;
  retryableErrors?: string[]; // Error types that should trigger retry
}

export interface FailedEvent {
  id: string;
  event: DomainEvent;
  eventType: string;
  handler: string;
  error: Error;
  retryCount: number;
  lastAttempt: Date;
  nextRetry?: Date;
  config: RetryConfig;
}

@Injectable()
export class EventRetryService {
  private readonly logger = new Logger(EventRetryService.name);
  private readonly failedEvents = new Map<string, FailedEvent>();
  private readonly defaultConfig: RetryConfig = {
    maxRetries: 3,
    baseDelay: 1000, // 1 second
    maxDelay: 30000, // 30 seconds
    backoffMultiplier: 2,
    retryableErrors: [
      'TimeoutError',
      'ConnectionError',
      'ServiceUnavailableError',
      'TemporaryError',
    ],
  };

  constructor(private readonly eventEmitter: EventEmitter2) {
    // Start retry processor
    this.startRetryProcessor();
  }

  /**
   * Handle a failed event and schedule retry if applicable
   */
  async handleFailedEvent(
    event: DomainEvent,
    eventType: string,
    handler: string,
    error: Error,
    config?: Partial<RetryConfig>,
  ): Promise<void> {
    const retryConfig = { ...this.defaultConfig, ...config };
    const eventId = `${event.eventId}-${handler}`;

    // Check if error is retryable
    if (!this.isRetryableError(error, retryConfig)) {
      this.logger.error(
        `Non-retryable error for event ${eventId}: ${error.message}`,
        error.stack,
      );
      await this.handleDeadLetter(event, eventType, handler, error);
      return;
    }

    const existingFailure = this.failedEvents.get(eventId);
    const retryCount = existingFailure ? existingFailure.retryCount + 1 : 1;

    // Check if max retries exceeded
    if (retryCount > retryConfig.maxRetries) {
      this.logger.error(
        `Max retries exceeded for event ${eventId}. Moving to dead letter queue.`,
      );
      await this.handleDeadLetter(event, eventType, handler, error);
      this.failedEvents.delete(eventId);
      return;
    }

    // Calculate next retry delay
    const delay = this.calculateDelay(retryCount, retryConfig);
    const nextRetry = new Date(Date.now() + delay);

    const failedEvent: FailedEvent = {
      id: eventId,
      event,
      eventType,
      handler,
      error,
      retryCount,
      lastAttempt: new Date(),
      nextRetry,
      config: retryConfig,
    };

    this.failedEvents.set(eventId, failedEvent);

    this.logger.warn(
      `Event ${eventId} failed (attempt ${retryCount}/${retryConfig.maxRetries}). ` +
        `Next retry scheduled for ${nextRetry.toISOString()}. Error: ${error.message}`,
    );
  }

  /**
   * Check if an error is retryable based on configuration
   */
  private isRetryableError(error: Error, config: RetryConfig): boolean {
    if (!config.retryableErrors || config.retryableErrors.length === 0) {
      return true; // Retry all errors if no specific errors configured
    }

    return config.retryableErrors.some(
      (retryableError) =>
        error.constructor.name === retryableError ||
        error.message.includes(retryableError),
    );
  }

  /**
   * Calculate retry delay using exponential backoff
   */
  private calculateDelay(retryCount: number, config: RetryConfig): number {
    const delay = Math.min(
      config.baseDelay * Math.pow(config.backoffMultiplier, retryCount - 1),
      config.maxDelay,
    );

    // Add jitter to prevent thundering herd
    const jitter = Math.random() * 0.1 * delay;
    return Math.floor(delay + jitter);
  }

  /**
   * Start the retry processor that checks for events ready to retry
   */
  private startRetryProcessor(): void {
    setInterval(() => {
      this.processRetries();
    }, 5000); // Check every 5 seconds
  }

  /**
   * Process events that are ready for retry
   */
  private async processRetries(): Promise<void> {
    const now = new Date();
    const eventsToRetry: FailedEvent[] = [];

    for (const [eventId, failedEvent] of this.failedEvents.entries()) {
      if (failedEvent.nextRetry && failedEvent.nextRetry <= now) {
        eventsToRetry.push(failedEvent);
      }
    }

    for (const failedEvent of eventsToRetry) {
      try {
        this.logger.log(
          `Retrying event ${failedEvent.id} (attempt ${failedEvent.retryCount + 1})`,
        );

        // Remove from failed events before retry to prevent duplicate processing
        this.failedEvents.delete(failedEvent.id);

        // Emit the event again
        this.eventEmitter.emit(failedEvent.eventType, failedEvent.event);
      } catch (error) {
        this.logger.error(
          `Failed to retry event ${failedEvent.id}: ${error.message}`,
          error.stack,
        );

        // Handle the retry failure
        await this.handleFailedEvent(
          failedEvent.event,
          failedEvent.eventType,
          failedEvent.handler,
          error as Error,
          failedEvent.config,
        );
      }
    }
  }

  /**
   * Handle events that have exhausted all retries
   */
  private async handleDeadLetter(
    event: DomainEvent,
    eventType: string,
    handler: string,
    error: Error,
  ): Promise<void> {
    this.logger.error(
      `Event moved to dead letter queue: ${event.eventId} (${eventType}) - Handler: ${handler}`,
      {
        eventId: event.eventId,
        eventType,
        handler,
        error: error.message,
        stack: error.stack,
        event: JSON.stringify(event),
      },
    );

    // Emit dead letter event for monitoring/alerting
    this.eventEmitter.emit('event.dead_letter', {
      eventId: event.eventId,
      eventType,
      handler,
      error: error.message,
      originalEvent: event,
      timestamp: new Date(),
    });

    // Here you could also:
    // 1. Store in a dead letter queue database table
    // 2. Send to external monitoring service
    // 3. Trigger alerts
  }

  /**
   * Get statistics about failed events
   */
  getRetryStatistics(): {
    totalFailedEvents: number;
    eventsByType: Record<string, number>;
    eventsByHandler: Record<string, number>;
    averageRetryCount: number;
  } {
    const stats = {
      totalFailedEvents: this.failedEvents.size,
      eventsByType: {} as Record<string, number>,
      eventsByHandler: {} as Record<string, number>,
      averageRetryCount: 0,
    };

    let totalRetries = 0;

    for (const failedEvent of this.failedEvents.values()) {
      // Count by event type
      stats.eventsByType[failedEvent.eventType] =
        (stats.eventsByType[failedEvent.eventType] || 0) + 1;

      // Count by handler
      stats.eventsByHandler[failedEvent.handler] =
        (stats.eventsByHandler[failedEvent.handler] || 0) + 1;

      totalRetries += failedEvent.retryCount;
    }

    stats.averageRetryCount =
      this.failedEvents.size > 0 ? totalRetries / this.failedEvents.size : 0;

    return stats;
  }

  /**
   * Get list of currently failed events
   */
  getFailedEvents(): FailedEvent[] {
    return Array.from(this.failedEvents.values());
  }

  /**
   * Manually retry a specific failed event
   */
  async manualRetry(eventId: string): Promise<boolean> {
    const failedEvent = this.failedEvents.get(eventId);
    if (!failedEvent) {
      return false;
    }

    try {
      this.failedEvents.delete(eventId);
      this.eventEmitter.emit(failedEvent.eventType, failedEvent.event);
      this.logger.log(`Manually retried event ${eventId}`);
      return true;
    } catch (error) {
      this.logger.error(
        `Manual retry failed for event ${eventId}: ${error.message}`,
      );
      await this.handleFailedEvent(
        failedEvent.event,
        failedEvent.eventType,
        failedEvent.handler,
        error as Error,
        failedEvent.config,
      );
      return false;
    }
  }

  /**
   * Clear all failed events (use with caution)
   */
  clearFailedEvents(): void {
    const count = this.failedEvents.size;
    this.failedEvents.clear();
    this.logger.warn(`Cleared ${count} failed events`);
  }
}
