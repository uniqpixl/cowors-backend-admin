import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { FinancialEventSourcingService } from './financial-event-sourcing.service';
import {
  FinancialEventEntity,
  FinancialEventStatus,
  FinancialEventType,
} from './financial-event.entity';

export interface EventProcessingResult {
  success: boolean;
  error?: string;
  retryable?: boolean;
  nextRetryAt?: Date;
  metadata?: Record<string, any>;
  processingTime?: number;
  warnings?: string[];
}

export interface EventProcessingContext {
  event: FinancialEventEntity;
  attempt: number;
  maxRetries: number;
  retryDelay: number;
  startTime: number;
  correlationId: string;
}

export interface DeadLetterQueueEntry {
  eventId: string;
  eventType: string;
  aggregateId: string;
  originalEvent: FinancialEventEntity;
  failureReason: string;
  attempts: number;
  firstFailedAt: Date;
  lastFailedAt: Date;
  metadata: Record<string, any>;
  priority: 'low' | 'medium' | 'high' | 'critical';
}

export interface EventProcessingMetrics {
  totalProcessed: number;
  totalFailed: number;
  averageProcessingTime: number;
  retryRate: number;
  deadLetterQueueSize: number;
  processingRatePerSecond: number;
  errorsByType: Record<string, number>;
  eventTypeMetrics: Record<
    string,
    {
      processed: number;
      failed: number;
      averageTime: number;
    }
  >;
}

export interface CircuitBreakerState {
  isOpen: boolean;
  failureCount: number;
  lastFailureTime?: Date;
  nextRetryTime?: Date;
  threshold: number;
  timeout: number;
}

@Injectable()
export class FinancialEventHandler {
  private readonly logger = new Logger(FinancialEventHandler.name);
  private readonly maxRetries = 3;
  private readonly baseRetryDelay = 1000; // 1 second
  private readonly maxRetryDelay = 30000; // 30 seconds

  // Enhanced monitoring and circuit breaker
  private readonly deadLetterQueue: Map<string, DeadLetterQueueEntry> =
    new Map();
  private readonly processingMetrics: EventProcessingMetrics = {
    totalProcessed: 0,
    totalFailed: 0,
    averageProcessingTime: 0,
    retryRate: 0,
    deadLetterQueueSize: 0,
    processingRatePerSecond: 0,
    errorsByType: {},
    eventTypeMetrics: {},
  };
  private readonly circuitBreakers: Map<string, CircuitBreakerState> =
    new Map();
  private readonly processingTimes: number[] = [];
  private readonly maxProcessingTimesHistory = 1000;

  constructor(
    @InjectRepository(FinancialEventEntity)
    private readonly eventRepository: Repository<FinancialEventEntity>,
    private readonly eventSourcingService: FinancialEventSourcingService,
    private readonly eventEmitter: EventEmitter2,
  ) {
    // Initialize metrics collection
    this.initializeMetricsCollection();
  }

  @OnEvent('financial.event.stored')
  async handleFinancialEventStored(event: FinancialEventEntity): Promise<void> {
    const context: EventProcessingContext = {
      event,
      attempt: 1,
      maxRetries: this.maxRetries,
      retryDelay: this.baseRetryDelay,
      startTime: Date.now(),
      correlationId: this.generateCorrelationId(),
    };

    await this.processEventWithRetry(context);
  }

  private async processEventWithRetry(
    context: EventProcessingContext,
  ): Promise<void> {
    try {
      this.logger.log(
        `Processing financial event: ${context.event.eventType} for aggregate ${context.event.aggregateId} (attempt ${context.attempt}/${context.maxRetries})`,
      );

      // Validate event before processing
      const validationResult = await this.validateEvent(context.event);
      if (!validationResult.isValid) {
        throw new Error(
          `Event validation failed: ${validationResult.errors.join(', ')}`,
        );
      }

      // Process the event based on its type
      const result = await this.processFinancialEvent(context);

      if (result.success) {
        // Mark event as processed
        await this.eventSourcingService.markEventProcessed(context.event.id);

        // Emit success event for monitoring
        this.eventEmitter.emit('financial.event.processed', {
          eventId: context.event.id,
          eventType: context.event.eventType,
          aggregateId: context.event.aggregateId,
          processingTime: Date.now() - context.event.createdAt.getTime(),
          attempt: context.attempt,
        });

        this.logger.log(
          `Successfully processed financial event: ${context.event.id}`,
        );
      } else {
        await this.handleProcessingFailure(context, result);
      }
    } catch (error) {
      this.logger.error(
        `Failed to process financial event: ${context.event.id} (attempt ${context.attempt})`,
        error,
      );

      const result: EventProcessingResult = {
        success: false,
        error: error.message || 'Unknown error',
        retryable: this.isRetryableError(error),
      };

      await this.handleProcessingFailure(context, result);
    }
  }

  private async handleProcessingFailure(
    context: EventProcessingContext,
    result: EventProcessingResult,
  ): Promise<void> {
    if (result.retryable && context.attempt < context.maxRetries) {
      // Schedule retry
      const nextAttempt = context.attempt + 1;
      const retryDelay = Math.min(
        context.retryDelay * Math.pow(2, context.attempt - 1),
        this.maxRetryDelay,
      );

      this.logger.warn(
        `Scheduling retry for event ${context.event.id} in ${retryDelay}ms (attempt ${nextAttempt}/${context.maxRetries})`,
      );

      setTimeout(async () => {
        const retryContext: EventProcessingContext = {
          ...context,
          attempt: nextAttempt,
        };
        await this.processEventWithRetry(retryContext);
      }, retryDelay);
    } else {
      // Mark event as failed
      await this.eventSourcingService.markEventFailed(
        context.event.id,
        result.error || 'Processing failed after maximum retries',
      );

      // Emit failure event for monitoring
      this.eventEmitter.emit('financial.event.failed', {
        eventId: context.event.id,
        eventType: context.event.eventType,
        aggregateId: context.event.aggregateId,
        error: result.error,
        attempts: context.attempt,
        finalFailure: true,
      });

      // Send to dead letter queue for manual investigation
      await this.sendToDeadLetterQueue(context.event, result.error);
    }
  }

  private async validateEvent(event: FinancialEventEntity): Promise<{
    isValid: boolean;
    errors: string[];
  }> {
    const errors: string[] = [];

    // Basic validation
    if (!event.aggregateId) {
      errors.push('Missing aggregateId');
    }

    if (!event.eventType) {
      errors.push('Missing eventType');
    }

    if (!event.eventData) {
      errors.push('Missing eventData');
    }

    // Event-specific validation
    switch (event.eventType) {
      case FinancialEventType.PAYMENT_INITIATED:
      case FinancialEventType.PAYMENT_COMPLETED:
        if (!event.amount || event.amount <= 0) {
          errors.push('Invalid payment amount');
        }
        if (!event.currency) {
          errors.push('Missing currency');
        }
        break;

      case FinancialEventType.WALLET_CREDITED:
      case FinancialEventType.WALLET_DEBITED:
        if (!event.amount || event.amount <= 0) {
          errors.push('Invalid wallet amount');
        }
        if (!event.userId) {
          errors.push('Missing userId for wallet operation');
        }
        break;

      case FinancialEventType.COMMISSION_CALCULATED:
        if (!event.amount || event.amount < 0) {
          errors.push('Invalid commission amount');
        }
        if (!event.partnerId) {
          errors.push('Missing partnerId for commission');
        }
        break;
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  private isRetryableError(error: any): boolean {
    // Define which errors are retryable
    const retryableErrorTypes = [
      'ECONNRESET',
      'ENOTFOUND',
      'ETIMEDOUT',
      'ECONNREFUSED',
      'NETWORK_ERROR',
      'TEMPORARY_FAILURE',
    ];

    const errorMessage = error.message?.toUpperCase() || '';
    const errorCode = error.code?.toUpperCase() || '';

    return (
      retryableErrorTypes.some(
        (type) => errorMessage.includes(type) || errorCode.includes(type),
      ) || error.status >= 500
    ); // HTTP 5xx errors are retryable
  }

  private async sendToDeadLetterQueue(
    event: FinancialEventEntity,
    error?: string,
  ): Promise<void> {
    try {
      // In a real implementation, this would send to a message queue
      // For now, we'll log and store in metadata
      this.logger.error(
        `Sending event ${event.id} to dead letter queue: ${error}`,
      );

      // Update event metadata to mark as dead letter
      const updatedMetadata = {
        ...event.metadata,
        deadLetter: true,
        deadLetterAt: new Date().toISOString(),
        deadLetterReason: error,
        requiresManualIntervention: true,
      };

      await this.eventRepository.update(event.id, {
        metadata: updatedMetadata as any,
      });

      // Emit dead letter event for alerting
      this.eventEmitter.emit('financial.event.dead_letter', {
        eventId: event.id,
        eventType: event.eventType,
        aggregateId: event.aggregateId,
        error,
        timestamp: new Date(),
      });
    } catch (dlqError) {
      this.logger.error(
        `Failed to send event ${event.id} to dead letter queue`,
        dlqError,
      );
    }
  }

  @OnEvent('payment.initiated')
  async handlePaymentInitiated(payload: {
    paymentId: string;
    bookingId: string;
    userId: string;
    partnerId: string;
    amount: number;
    currency: string;
    metadata?: Record<string, any>;
  }): Promise<void> {
    await this.eventSourcingService.storeEvent({
      aggregateId: payload.paymentId,
      aggregateType: 'payment' as any,
      eventType: FinancialEventType.PAYMENT_INITIATED,
      eventData: {
        bookingId: payload.bookingId,
        amount: payload.amount,
        currency: payload.currency,
        initiatedAt: new Date(),
      },
      metadata: {
        ...payload.metadata,
        source: 'payment_service',
        version: '1.0',
      },
      userId: payload.userId,
      partnerId: payload.partnerId,
      bookingId: payload.bookingId,
      amount: payload.amount,
      currency: payload.currency,
    });
  }

  @OnEvent('payment.completed')
  async handlePaymentCompleted(payload: {
    paymentId: string;
    transactionId: string;
    amount: number;
    currency: string;
    metadata?: Record<string, any>;
  }): Promise<void> {
    await this.eventSourcingService.storeEvent({
      aggregateId: payload.paymentId,
      aggregateType: 'payment' as any,
      eventType: FinancialEventType.PAYMENT_COMPLETED,
      eventData: {
        transactionId: payload.transactionId,
        completedAt: new Date(),
      },
      metadata: {
        ...payload.metadata,
        source: 'payment_service',
        version: '1.0',
      },
      transactionId: payload.transactionId,
      amount: payload.amount,
      currency: payload.currency,
    });
  }

  @OnEvent('payment.failed')
  async handlePaymentFailed(payload: {
    paymentId: string;
    reason: string;
    errorCode?: string;
    metadata?: Record<string, any>;
  }): Promise<void> {
    await this.eventSourcingService.storeEvent({
      aggregateId: payload.paymentId,
      aggregateType: 'payment' as any,
      eventType: FinancialEventType.PAYMENT_FAILED,
      eventData: {
        reason: payload.reason,
        errorCode: payload.errorCode,
        failedAt: new Date(),
      },
      metadata: {
        ...payload.metadata,
        source: 'payment_service',
        version: '1.0',
      },
    });
  }

  @OnEvent('wallet.credited')
  async handleWalletCredited(payload: {
    walletId: string;
    userId: string;
    partnerId?: string;
    amount: number;
    currency: string;
    transactionId: string;
    source: string;
    metadata?: Record<string, any>;
  }): Promise<void> {
    await this.eventSourcingService.storeEvent({
      aggregateId: payload.walletId,
      aggregateType: 'wallet' as any,
      eventType: FinancialEventType.WALLET_CREDITED,
      eventData: {
        source: payload.source,
        creditedAt: new Date(),
      },
      metadata: {
        ...payload.metadata,
        source: 'wallet_service',
        version: '1.0',
      },
      userId: payload.userId,
      partnerId: payload.partnerId,
      transactionId: payload.transactionId,
      amount: payload.amount,
      currency: payload.currency,
    });
  }

  @OnEvent('wallet.debited')
  async handleWalletDebited(payload: {
    walletId: string;
    userId: string;
    partnerId?: string;
    amount: number;
    currency: string;
    transactionId: string;
    purpose: string;
    metadata?: Record<string, any>;
  }): Promise<void> {
    await this.eventSourcingService.storeEvent({
      aggregateId: payload.walletId,
      aggregateType: 'wallet' as any,
      eventType: FinancialEventType.WALLET_DEBITED,
      eventData: {
        purpose: payload.purpose,
        debitedAt: new Date(),
      },
      metadata: {
        ...payload.metadata,
        source: 'wallet_service',
        version: '1.0',
      },
      userId: payload.userId,
      partnerId: payload.partnerId,
      transactionId: payload.transactionId,
      amount: payload.amount,
      currency: payload.currency,
    });
  }

  @OnEvent('commission.calculated')
  async handleCommissionCalculated(payload: {
    commissionId: string;
    bookingId: string;
    partnerId: string;
    amount: number;
    rate: number;
    currency: string;
    metadata?: Record<string, any>;
  }): Promise<void> {
    await this.eventSourcingService.storeEvent({
      aggregateId: payload.commissionId,
      aggregateType: 'commission' as any,
      eventType: FinancialEventType.COMMISSION_CALCULATED,
      eventData: {
        rate: payload.rate,
        calculatedAt: new Date(),
      },
      metadata: {
        ...payload.metadata,
        source: 'commission_service',
        version: '1.0',
      },
      partnerId: payload.partnerId,
      bookingId: payload.bookingId,
      amount: payload.amount,
      currency: payload.currency,
    });
  }

  @OnEvent('refund.initiated')
  async handleRefundInitiated(payload: {
    refundId: string;
    paymentId: string;
    bookingId: string;
    userId: string;
    partnerId: string;
    amount: number;
    currency: string;
    reason: string;
    metadata?: Record<string, any>;
  }): Promise<void> {
    await this.eventSourcingService.storeEvent({
      aggregateId: payload.refundId,
      aggregateType: 'refund' as any,
      eventType: FinancialEventType.REFUND_INITIATED,
      eventData: {
        paymentId: payload.paymentId,
        reason: payload.reason,
        initiatedAt: new Date(),
      },
      metadata: {
        ...payload.metadata,
        source: 'refund_service',
        version: '1.0',
      },
      userId: payload.userId,
      partnerId: payload.partnerId,
      bookingId: payload.bookingId,
      amount: payload.amount,
      currency: payload.currency,
    });
  }

  @OnEvent('refund.completed')
  async handleRefundCompleted(payload: {
    refundId: string;
    transactionId: string;
    amount: number;
    currency: string;
    metadata?: Record<string, any>;
  }): Promise<void> {
    await this.eventSourcingService.storeEvent({
      aggregateId: payload.refundId,
      aggregateType: 'refund' as any,
      eventType: FinancialEventType.REFUND_COMPLETED,
      eventData: {
        transactionId: payload.transactionId,
        completedAt: new Date(),
      },
      metadata: {
        ...payload.metadata,
        source: 'refund_service',
        version: '1.0',
      },
      transactionId: payload.transactionId,
      amount: payload.amount,
      currency: payload.currency,
    });
  }

  private async processFinancialEvent(
    context: EventProcessingContext,
  ): Promise<EventProcessingResult> {
    const { event } = context;

    try {
      switch (event.eventType) {
        case FinancialEventType.PAYMENT_COMPLETED:
          return await this.processPaymentCompleted(event);

        case FinancialEventType.WALLET_CREDITED:
          return await this.processWalletCredited(event);

        case FinancialEventType.WALLET_DEBITED:
          return await this.processWalletDebited(event);

        case FinancialEventType.COMMISSION_CALCULATED:
          return await this.processCommissionCalculated(event);

        case FinancialEventType.REFUND_COMPLETED:
          return await this.processRefundCompleted(event);

        case FinancialEventType.PAYMENT_FAILED:
          return await this.processPaymentFailed(event);

        default:
          this.logger.debug(
            `No specific processing required for event type: ${event.eventType}`,
          );
          return { success: true };
      }
    } catch (error) {
      return {
        success: false,
        error: error.message,
        retryable: this.isRetryableError(error),
      };
    }
  }

  private async processPaymentCompleted(
    event: FinancialEventEntity,
  ): Promise<EventProcessingResult> {
    try {
      // Trigger commission calculation
      if (event.partnerId && event.bookingId) {
        this.eventEmitter.emit('commission.calculate', {
          bookingId: event.bookingId,
          partnerId: event.partnerId,
          amount: event.amount,
          currency: event.currency,
          paymentId: event.aggregateId,
        });
      }

      // Update booking status
      if (event.bookingId) {
        this.eventEmitter.emit('booking.payment_completed', {
          bookingId: event.bookingId,
          paymentId: event.aggregateId,
          amount: event.amount,
        });
      }

      // Send payment confirmation notification
      if (event.userId) {
        this.eventEmitter.emit('notification.payment_completed', {
          userId: event.userId,
          paymentId: event.aggregateId,
          amount: event.amount,
          currency: event.currency,
        });
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        retryable: true,
      };
    }
  }

  private async processWalletCredited(
    event: FinancialEventEntity,
  ): Promise<EventProcessingResult> {
    try {
      // Update wallet balance cache
      this.eventEmitter.emit('wallet.balance_updated', {
        walletId: event.aggregateId,
        userId: event.userId,
        amount: event.amount,
        operation: 'credit',
      });

      // Send notification to user
      if (event.userId) {
        this.eventEmitter.emit('notification.wallet_credited', {
          userId: event.userId,
          amount: event.amount,
          currency: event.currency,
          source: event.eventData.source,
        });
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        retryable: true,
      };
    }
  }

  private async processWalletDebited(
    event: FinancialEventEntity,
  ): Promise<EventProcessingResult> {
    try {
      // Update wallet balance cache
      this.eventEmitter.emit('wallet.balance_updated', {
        walletId: event.aggregateId,
        userId: event.userId,
        amount: event.amount,
        operation: 'debit',
      });

      // Send notification to user if significant amount
      if (event.userId && event.amount > 1000) {
        this.eventEmitter.emit('notification.wallet_debited', {
          userId: event.userId,
          amount: event.amount,
          currency: event.currency,
          purpose: event.eventData.purpose,
        });
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        retryable: true,
      };
    }
  }

  private async processCommissionCalculated(
    event: FinancialEventEntity,
  ): Promise<EventProcessingResult> {
    try {
      // Update partner earnings
      this.eventEmitter.emit('partner.earnings_updated', {
        partnerId: event.partnerId,
        commissionId: event.aggregateId,
        amount: event.amount,
        currency: event.currency,
        bookingId: event.bookingId,
      });

      // Check if payout threshold is reached
      this.eventEmitter.emit('payout.check_threshold', {
        partnerId: event.partnerId,
        newCommissionAmount: event.amount,
      });

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        retryable: true,
      };
    }
  }

  private async processRefundCompleted(
    event: FinancialEventEntity,
  ): Promise<EventProcessingResult> {
    try {
      // Update booking status
      if (event.bookingId) {
        this.eventEmitter.emit('booking.refund_completed', {
          bookingId: event.bookingId,
          refundId: event.aggregateId,
          amount: event.amount,
        });
      }

      // Send refund confirmation
      if (event.userId) {
        this.eventEmitter.emit('notification.refund_completed', {
          userId: event.userId,
          refundId: event.aggregateId,
          amount: event.amount,
          currency: event.currency,
        });
      }

      // Reverse commission if applicable
      if (event.partnerId && event.bookingId) {
        this.eventEmitter.emit('commission.reverse', {
          bookingId: event.bookingId,
          partnerId: event.partnerId,
          refundAmount: event.amount,
        });
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        retryable: true,
      };
    }
  }

  private async processPaymentFailed(
    event: FinancialEventEntity,
  ): Promise<EventProcessingResult> {
    try {
      // Update booking status
      if (event.bookingId) {
        this.eventEmitter.emit('booking.payment_failed', {
          bookingId: event.bookingId,
          paymentId: event.aggregateId,
          reason: event.eventData.reason,
        });
      }

      // Send failure notification
      if (event.userId) {
        this.eventEmitter.emit('notification.payment_failed', {
          userId: event.userId,
          paymentId: event.aggregateId,
          reason: event.eventData.reason,
          errorCode: event.eventData.errorCode,
        });
      }

      return { success: true };
    } catch (error) {
      this.logger.error(
        `Failed to process payment failed event: ${event.id}`,
        error,
      );
      return {
        success: false,
        error: error.message || 'Failed to process payment failed event',
        retryable: this.isRetryableError(error),
      };
    }
  }

  /**
   * Initialize metrics collection and monitoring
   */
  private initializeMetricsCollection(): void {
    // Reset metrics every hour
    setInterval(
      () => {
        this.resetHourlyMetrics();
      },
      60 * 60 * 1000,
    );

    // Log metrics every 5 minutes
    setInterval(
      () => {
        this.logCurrentMetrics();
      },
      5 * 60 * 1000,
    );
  }

  /**
   * Generate correlation ID for event tracking
   */
  private generateCorrelationId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Update processing metrics
   */
  private updateProcessingMetrics(
    context: EventProcessingContext,
    result: EventProcessingResult,
  ): void {
    const processingTime = Date.now() - context.startTime;

    // Update processing times history
    this.processingTimes.push(processingTime);
    if (this.processingTimes.length > this.maxProcessingTimesHistory) {
      this.processingTimes.shift();
    }

    // Update overall metrics
    if (result.success) {
      this.processingMetrics.totalProcessed++;
    } else {
      this.processingMetrics.totalFailed++;

      // Track error types
      const errorType = this.categorizeError(result.error);
      this.processingMetrics.errorsByType[errorType] =
        (this.processingMetrics.errorsByType[errorType] || 0) + 1;
    }

    // Update event type specific metrics
    const eventType = context.event.eventType;
    if (!this.processingMetrics.eventTypeMetrics[eventType]) {
      this.processingMetrics.eventTypeMetrics[eventType] = {
        processed: 0,
        failed: 0,
        averageTime: 0,
      };
    }

    const eventMetrics = this.processingMetrics.eventTypeMetrics[eventType];
    if (result.success) {
      eventMetrics.processed++;
    } else {
      eventMetrics.failed++;
    }

    // Update average processing time
    const totalEvents = eventMetrics.processed + eventMetrics.failed;
    eventMetrics.averageTime =
      (eventMetrics.averageTime * (totalEvents - 1) + processingTime) /
      totalEvents;

    // Update overall average processing time
    this.processingMetrics.averageProcessingTime =
      this.processingTimes.reduce((sum, time) => sum + time, 0) /
      this.processingTimes.length;

    // Update retry rate
    const totalAttempts =
      this.processingMetrics.totalProcessed +
      this.processingMetrics.totalFailed;
    this.processingMetrics.retryRate =
      context.attempt > 1 ? (context.attempt - 1) / totalAttempts : 0;

    // Update dead letter queue size
    this.processingMetrics.deadLetterQueueSize = this.deadLetterQueue.size;
  }

  /**
   * Categorize error for metrics
   */
  private categorizeError(error?: string): string {
    if (!error) return 'unknown';

    const errorLower = error.toLowerCase();

    if (errorLower.includes('timeout')) return 'timeout';
    if (errorLower.includes('connection')) return 'connection';
    if (errorLower.includes('validation')) return 'validation';
    if (errorLower.includes('business rule')) return 'business_rule';
    if (errorLower.includes('insufficient')) return 'insufficient_funds';
    if (errorLower.includes('not found')) return 'not_found';

    return 'other';
  }

  /**
   * Check circuit breaker state
   */
  private checkCircuitBreaker(eventType: string): boolean {
    const circuitBreaker = this.circuitBreakers.get(eventType);

    if (!circuitBreaker) {
      // Initialize circuit breaker for this event type
      this.circuitBreakers.set(eventType, {
        isOpen: false,
        failureCount: 0,
        threshold: 5, // Open after 5 failures
        timeout: 60000, // 1 minute timeout
      });
      return false; // Circuit is closed (allow processing)
    }

    // Check if circuit should be closed after timeout
    if (
      circuitBreaker.isOpen &&
      circuitBreaker.nextRetryTime &&
      Date.now() >= circuitBreaker.nextRetryTime.getTime()
    ) {
      circuitBreaker.isOpen = false;
      circuitBreaker.failureCount = 0;
      this.logger.log(`Circuit breaker for ${eventType} is now closed`);
    }

    return circuitBreaker.isOpen;
  }

  /**
   * Update circuit breaker on failure
   */
  private updateCircuitBreakerOnFailure(eventType: string): void {
    const circuitBreaker = this.circuitBreakers.get(eventType);
    if (!circuitBreaker) return;

    circuitBreaker.failureCount++;
    circuitBreaker.lastFailureTime = new Date();

    if (circuitBreaker.failureCount >= circuitBreaker.threshold) {
      circuitBreaker.isOpen = true;
      circuitBreaker.nextRetryTime = new Date(
        Date.now() + circuitBreaker.timeout,
      );

      this.logger.warn(
        `Circuit breaker for ${eventType} is now OPEN after ${circuitBreaker.failureCount} failures`,
      );

      // Emit circuit breaker event
      this.eventEmitter.emit('financial.circuit_breaker.opened', {
        eventType,
        failureCount: circuitBreaker.failureCount,
        nextRetryTime: circuitBreaker.nextRetryTime,
      });
    }
  }

  /**
   * Update circuit breaker on success
   */
  private updateCircuitBreakerOnSuccess(eventType: string): void {
    const circuitBreaker = this.circuitBreakers.get(eventType);
    if (!circuitBreaker) return;

    if (circuitBreaker.failureCount > 0) {
      circuitBreaker.failureCount = Math.max(
        0,
        circuitBreaker.failureCount - 1,
      );
    }
  }

  /**
   * Enhanced dead letter queue with priority and metadata
   */
  private async sendToEnhancedDeadLetterQueue(
    event: FinancialEventEntity,
    error: string,
    attempts: number,
  ): Promise<void> {
    const priority = this.determinePriority(event, error);
    const existingEntry = this.deadLetterQueue.get(event.id);

    const deadLetterEntry: DeadLetterQueueEntry = {
      eventId: event.id,
      eventType: event.eventType,
      aggregateId: event.aggregateId,
      originalEvent: event,
      failureReason: error,
      attempts,
      firstFailedAt: existingEntry?.firstFailedAt || new Date(),
      lastFailedAt: new Date(),
      metadata: {
        correlationId: event.metadata?.correlationId,
        originalTimestamp: event.createdAt,
        errorCategory: this.categorizeError(error),
        retryHistory: existingEntry?.metadata?.retryHistory || [],
      },
      priority,
    };

    this.deadLetterQueue.set(event.id, deadLetterEntry);

    // Emit dead letter queue event for external monitoring
    this.eventEmitter.emit(
      'financial.dead_letter_queue.added',
      deadLetterEntry,
    );

    this.logger.error(
      `Event ${event.id} sent to dead letter queue with priority ${priority}`,
      { deadLetterEntry },
    );
  }

  /**
   * Determine priority for dead letter queue
   */
  private determinePriority(
    event: FinancialEventEntity,
    error: string,
  ): 'low' | 'medium' | 'high' | 'critical' {
    // Critical events that affect money flow
    if (
      [
        'payment_completed',
        'wallet_credited',
        'wallet_debited',
        'refund_completed',
      ].includes(event.eventType)
    ) {
      return 'critical';
    }

    // High priority for payment-related events
    if (
      event.eventType.includes('payment') ||
      event.eventType.includes('commission')
    ) {
      return 'high';
    }

    // Medium priority for validation errors
    if (
      error.toLowerCase().includes('validation') ||
      error.toLowerCase().includes('business rule')
    ) {
      return 'medium';
    }

    return 'low';
  }

  /**
   * Get current processing metrics
   */
  public getProcessingMetrics(): EventProcessingMetrics {
    return { ...this.processingMetrics };
  }

  /**
   * Get dead letter queue entries
   */
  public getDeadLetterQueueEntries(): DeadLetterQueueEntry[] {
    return Array.from(this.deadLetterQueue.values());
  }

  /**
   * Retry dead letter queue entry
   */
  public async retryDeadLetterQueueEntry(eventId: string): Promise<boolean> {
    const entry = this.deadLetterQueue.get(eventId);
    if (!entry) {
      this.logger.warn(`Dead letter queue entry not found: ${eventId}`);
      return false;
    }

    try {
      const context: EventProcessingContext = {
        event: entry.originalEvent,
        attempt: 1,
        maxRetries: this.maxRetries,
        retryDelay: this.baseRetryDelay,
        startTime: Date.now(),
        correlationId: this.generateCorrelationId(),
      };

      await this.processEventWithRetry(context);

      // Remove from dead letter queue on successful retry
      this.deadLetterQueue.delete(eventId);

      this.logger.log(
        `Successfully retried dead letter queue entry: ${eventId}`,
      );
      return true;
    } catch (error) {
      this.logger.error(
        `Failed to retry dead letter queue entry: ${eventId}`,
        error,
      );
      return false;
    }
  }

  /**
   * Reset hourly metrics
   */
  private resetHourlyMetrics(): void {
    this.processingMetrics.totalProcessed = 0;
    this.processingMetrics.totalFailed = 0;
    this.processingMetrics.errorsByType = {};

    // Reset event type metrics but keep structure
    for (const eventType in this.processingMetrics.eventTypeMetrics) {
      this.processingMetrics.eventTypeMetrics[eventType] = {
        processed: 0,
        failed: 0,
        averageTime: 0,
      };
    }

    this.logger.log('Hourly metrics reset completed');
  }

  /**
   * Log current metrics
   */
  private logCurrentMetrics(): void {
    this.logger.log('Current Processing Metrics', {
      metrics: this.processingMetrics,
      deadLetterQueueSize: this.deadLetterQueue.size,
      circuitBreakersOpen: Array.from(this.circuitBreakers.entries())
        .filter(([, state]) => state.isOpen)
        .map(([eventType]) => eventType),
    });
  }
}
