import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Observable } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';

import { DomainEvent } from '../domain-event.interface';
import { EventStoreService } from './event-store.service';

@Injectable()
export class EventStoreInterceptor implements NestInterceptor {
  private readonly logger = new Logger(EventStoreInterceptor.name);

  constructor(
    private readonly eventStoreService: EventStoreService,
    private readonly eventEmitter: EventEmitter2,
  ) {
    // Listen to all domain events and store them
    this.eventEmitter.on('domain.event', this.handleDomainEvent.bind(this));
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      tap(() => {
        // This interceptor primarily works through event listeners
        // The actual interception logic is handled in the event listener
      }),
      catchError((error) => {
        this.logger.error('Error in EventStoreInterceptor', error);
        throw error;
      }),
    );
  }

  private async handleDomainEvent(event: DomainEvent): Promise<void> {
    try {
      // Check if this event is already stored (to avoid duplicate storage)
      const existingEvent = await this.eventStoreService[
        'eventStoreRepository'
      ].findOne({
        where: { eventId: event.eventId },
      });

      if (existingEvent) {
        this.logger.debug(`Event already stored: ${event.eventId}`);
        return;
      }

      // Store the event
      await this.eventStoreService.storeEvent(event, event.eventType, {
        userId: event.userId,
        metadata: event.metadata,
      });

      this.logger.debug(
        `Event stored via interceptor: ${event.eventType} (${event.eventId})`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to store event via interceptor: ${event.eventId}`,
        error.stack,
      );
    }
  }
}
