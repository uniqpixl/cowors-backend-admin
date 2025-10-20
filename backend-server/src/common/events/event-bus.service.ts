import { Inject, Injectable, Logger, forwardRef } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

import { DomainEvent } from './domain-event.interface';
import {
  EventStoreOptions,
  EventStoreService,
} from './event-store/event-store.service';

@Injectable()
export class EventBusService {
  private readonly logger = new Logger(EventBusService.name);

  constructor(
    private readonly eventEmitter: EventEmitter2,
    @Inject(forwardRef(() => EventStoreService))
    private readonly eventStoreService: EventStoreService,
  ) {}

  /**
   * Publish a single domain event
   */
  async publish(
    event: DomainEvent,
    options: EventStoreOptions = {},
  ): Promise<void> {
    try {
      this.logger.debug(`Publishing event: ${event.eventType}`, {
        eventId: event.eventId,
        aggregateId: event.aggregateId,
        aggregateType: event.aggregateType,
      });

      // Store the event in the event store first
      await this.eventStoreService.storeEvent(event, event.eventType, options);

      // Emit the specific event type
      this.eventEmitter.emit(event.eventType, event);

      // Emit a generic domain event for global listeners
      this.eventEmitter.emit('domain.event', event);

      // Mark event as processed after successful emission
      await this.eventStoreService.markEventAsProcessed(event.eventId);

      this.logger.debug(`Event published successfully: ${event.eventType}`);
    } catch (error) {
      this.logger.error(`Failed to publish event: ${event.eventType}`, error);

      // Mark event as failed in the event store
      try {
        await this.eventStoreService.markEventAsFailed(
          event.eventId,
          error.message,
        );
      } catch (storeError) {
        this.logger.error(
          `Failed to mark event as failed in store: ${storeError.message}`,
        );
      }

      throw error;
    }
  }

  /**
   * Publish multiple domain events
   */
  async publishAll(
    events: DomainEvent[],
    options: EventStoreOptions = {},
  ): Promise<void> {
    try {
      this.logger.debug(`Publishing ${events.length} events`);

      for (const event of events) {
        await this.publish(event, options);
      }

      this.logger.debug(`All ${events.length} events published successfully`);
    } catch (error) {
      this.logger.error('Failed to publish events', error);
      throw error;
    }
  }

  /**
   * Publish event without storing (for replayed events)
   */
  async publishWithoutStore(event: DomainEvent): Promise<void> {
    try {
      this.logger.debug(`Publishing event without store: ${event.eventType}`, {
        eventId: event.eventId,
        aggregateId: event.aggregateId,
        aggregateType: event.aggregateType,
      });

      // Emit the specific event type
      this.eventEmitter.emit(event.eventType, event);

      // Emit a generic domain event for global listeners
      this.eventEmitter.emit('domain.event', event);

      this.logger.debug(
        `Event published successfully without store: ${event.eventType}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to publish event without store: ${event.eventType}`,
        error,
      );
      throw error;
    }
  }

  /**
   * Subscribe to a specific event type
   */
  subscribe(
    eventType: string,
    handler: (event: DomainEvent) => Promise<void> | void,
  ): void {
    this.eventEmitter.on(eventType, handler);
    this.logger.debug(`Subscribed to event: ${eventType}`);
  }

  /**
   * Subscribe to all domain events
   */
  subscribeToAll(handler: (event: DomainEvent) => Promise<void> | void): void {
    this.eventEmitter.on('domain.event', handler);
    this.logger.debug('Subscribed to all domain events');
  }
}
