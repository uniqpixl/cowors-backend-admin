import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  forwardRef,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { createHash } from 'crypto';
import { Between, FindManyOptions, In, Repository } from 'typeorm';

import {
  EventStatus,
  EventStoreEntity,
} from '../../../database/entities/event-store.entity';
import { DomainEvent } from '../domain-event.interface';

export interface EventStoreOptions {
  correlationId?: string;
  causationId?: string;
  userId?: string;
  sessionId?: string;
  metadata?: Record<string, any>;
}

export interface EventReplayOptions {
  fromDate?: Date;
  toDate?: Date;
  eventTypes?: string[];
  aggregateIds?: string[];
  aggregateTypes?: string[];
  status?: EventStatus[];
  limit?: number;
  offset?: number;
}

export interface EventStreamOptions {
  aggregateId?: string;
  aggregateType?: string;
  fromVersion?: number;
  toVersion?: number;
}

@Injectable()
export class EventStoreService {
  private readonly logger = new Logger(EventStoreService.name);

  constructor(
    @InjectRepository(EventStoreEntity)
    private readonly eventStoreRepository: Repository<EventStoreEntity>,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  /**
   * Store a domain event in the event store
   */
  async storeEvent(
    event: DomainEvent,
    eventType: string,
    options: EventStoreOptions = {},
  ): Promise<EventStoreEntity> {
    try {
      // Generate content hash for integrity
      const contentHash = this.generateContentHash(event, eventType);

      // Get the last event for sequence numbering
      const lastEvent = await this.eventStoreRepository.findOne({
        order: { sequenceNumber: 'DESC' },
        select: ['id', 'sequenceNumber'],
      });

      const sequenceNumber = lastEvent
        ? (lastEvent.sequenceNumber || 0) + 1
        : 1;

      const eventStoreEntity = this.eventStoreRepository.create({
        eventId: event.eventId,
        eventType,
        aggregateId: event.aggregateId,
        aggregateType: event.aggregateType,
        aggregateVersion: event.aggregateVersion || 1,
        eventData: this.sanitizeEventData(event),
        metadata: options.metadata,
        correlationId: options.correlationId,
        causationId: options.causationId,
        userId: options.userId,
        sessionId: options.sessionId,
        occurredAt: event.occurredAt,
        contentHash,
        previousEventId: lastEvent?.id,
        sequenceNumber,
        status: EventStatus.PENDING,
      });

      const savedEvent = await this.eventStoreRepository.save(eventStoreEntity);

      this.logger.debug(
        `Event stored: ${eventType} (${event.eventId}) - Sequence: ${sequenceNumber}`,
      );

      return savedEvent;
    } catch (error) {
      this.logger.error(
        `Failed to store event ${event.eventId}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Mark an event as processed
   */
  async markEventAsProcessed(eventId: string): Promise<void> {
    try {
      await this.eventStoreRepository.update(
        { eventId },
        {
          status: EventStatus.PROCESSED,
          processedAt: new Date(),
        },
      );

      this.logger.debug(`Event marked as processed: ${eventId}`);
    } catch (error) {
      this.logger.error(
        `Failed to mark event as processed ${eventId}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Mark an event as failed
   */
  async markEventAsFailed(
    eventId: string,
    errorMessage: string,
    retryCount: number = 0,
    nextRetryAt?: Date,
  ): Promise<void> {
    try {
      await this.eventStoreRepository.update(
        { eventId },
        {
          status: EventStatus.FAILED,
          failedAt: new Date(),
          errorMessage,
          retryCount,
          nextRetryAt,
        },
      );

      this.logger.warn(
        `Event marked as failed: ${eventId} - ${errorMessage} (Retry count: ${retryCount})`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to mark event as failed ${eventId}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Get events for replay based on criteria
   */
  async getEventsForReplay(
    options: EventReplayOptions = {},
  ): Promise<EventStoreEntity[]> {
    try {
      const queryOptions: FindManyOptions<EventStoreEntity> = {
        order: { sequenceNumber: 'ASC' },
        take: options.limit || 1000,
        skip: options.offset || 0,
      };

      const whereConditions: any = {};

      if (options.fromDate || options.toDate) {
        whereConditions.occurredAt = Between(
          options.fromDate || new Date('1970-01-01'),
          options.toDate || new Date(),
        );
      }

      if (options.eventTypes && options.eventTypes.length > 0) {
        whereConditions.eventType =
          options.eventTypes.length === 1
            ? options.eventTypes[0]
            : In(options.eventTypes);
      }

      if (options.aggregateIds && options.aggregateIds.length > 0) {
        whereConditions.aggregateId =
          options.aggregateIds.length === 1
            ? options.aggregateIds[0]
            : In(options.aggregateIds);
      }

      if (options.aggregateTypes && options.aggregateTypes.length > 0) {
        whereConditions.aggregateType =
          options.aggregateTypes.length === 1
            ? options.aggregateTypes[0]
            : In(options.aggregateTypes);
      }

      if (options.status && options.status.length > 0) {
        whereConditions.status =
          options.status.length === 1 ? options.status[0] : In(options.status);
      }

      queryOptions.where = whereConditions;

      const events = await this.eventStoreRepository.find(queryOptions);

      this.logger.debug(
        `Retrieved ${events.length} events for replay with criteria: ${JSON.stringify(options)}`,
      );

      return events;
    } catch (error) {
      this.logger.error(
        `Failed to get events for replay: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Get event stream for a specific aggregate
   */
  async getEventStream(
    options: EventStreamOptions,
  ): Promise<EventStoreEntity[]> {
    try {
      const queryOptions: FindManyOptions<EventStoreEntity> = {
        order: { aggregateVersion: 'ASC' },
      };

      const whereConditions: any = {};

      if (options.aggregateId) {
        whereConditions.aggregateId = options.aggregateId;
      }

      if (options.aggregateType) {
        whereConditions.aggregateType = options.aggregateType;
      }

      if (options.fromVersion || options.toVersion) {
        whereConditions.aggregateVersion = Between(
          options.fromVersion || 1,
          options.toVersion || Number.MAX_SAFE_INTEGER,
        );
      }

      queryOptions.where = whereConditions;

      const events = await this.eventStoreRepository.find(queryOptions);

      this.logger.debug(
        `Retrieved ${events.length} events for stream: ${JSON.stringify(options)}`,
      );

      return events;
    } catch (error) {
      this.logger.error(
        `Failed to get event stream: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Replay events by re-emitting them
   */
  async replayEvents(criteria: {
    eventTypes?: string[];
    aggregateIds?: string[];
    aggregateTypes?: string[];
    fromDate?: Date;
    toDate?: Date;
    status?: EventStatus[];
  }): Promise<{ replayed: number; failed: number }> {
    const query = this.eventStoreRepository.createQueryBuilder('event');

    if (criteria.eventTypes?.length) {
      query.andWhere('event.eventType IN (:...eventTypes)', {
        eventTypes: criteria.eventTypes,
      });
    }

    if (criteria.aggregateIds?.length) {
      query.andWhere('event.aggregateId IN (:...aggregateIds)', {
        aggregateIds: criteria.aggregateIds,
      });
    }

    if (criteria.aggregateTypes?.length) {
      query.andWhere('event.aggregateType IN (:...aggregateTypes)', {
        aggregateTypes: criteria.aggregateTypes,
      });
    }

    if (criteria.fromDate) {
      query.andWhere('event.occurredAt >= :fromDate', {
        fromDate: criteria.fromDate,
      });
    }

    if (criteria.toDate) {
      query.andWhere('event.occurredAt <= :toDate', {
        toDate: criteria.toDate,
      });
    }

    if (criteria.status?.length) {
      query.andWhere('event.status IN (:...status)', {
        status: criteria.status,
      });
    }

    query.orderBy('event.occurredAt', 'ASC');

    const events = await query.getMany();
    let replayed = 0;
    let failed = 0;

    for (const event of events) {
      try {
        const domainEvent = this.reconstructDomainEvent(event);

        // Emit the event directly without storing it again
        this.eventEmitter.emit(domainEvent.eventType, domainEvent);

        await this.markEventAsReplayed(event.id);
        replayed++;
      } catch (error) {
        this.logger.error(
          `Failed to replay event ${event.eventId}`,
          error.stack,
        );
        failed++;
      }
    }

    this.logger.log(
      `Event replay completed: ${replayed} replayed, ${failed} failed`,
    );
    return { replayed, failed };
  }

  /**
   * Mark an event as replayed
   */
  private async markEventAsReplayed(eventId: string): Promise<void> {
    await this.eventStoreRepository.update(
      { id: eventId },
      { status: EventStatus.REPLAYED },
    );
  }

  /**
   * Get event store statistics
   */
  async getStatistics(): Promise<{
    totalEvents: number;
    eventsByStatus: Record<EventStatus, number>;
    eventsByType: Record<string, number>;
    oldestEvent?: Date;
    newestEvent?: Date;
  }> {
    try {
      const totalEvents = await this.eventStoreRepository.count();

      const statusCounts = await this.eventStoreRepository
        .createQueryBuilder('event')
        .select('event.status', 'status')
        .addSelect('COUNT(*)', 'count')
        .groupBy('event.status')
        .getRawMany();

      const typeCounts = await this.eventStoreRepository
        .createQueryBuilder('event')
        .select('event.eventType', 'eventType')
        .addSelect('COUNT(*)', 'count')
        .groupBy('event.eventType')
        .getRawMany();

      const dateRange = await this.eventStoreRepository
        .createQueryBuilder('event')
        .select('MIN(event.occurredAt)', 'oldest')
        .addSelect('MAX(event.occurredAt)', 'newest')
        .getRawOne();

      const eventsByStatus = statusCounts.reduce(
        (acc, item) => {
          acc[item.status] = parseInt(item.count);
          return acc;
        },
        {} as Record<EventStatus, number>,
      );

      const eventsByType = typeCounts.reduce(
        (acc, item) => {
          acc[item.eventType] = parseInt(item.count);
          return acc;
        },
        {} as Record<string, number>,
      );

      return {
        totalEvents,
        eventsByStatus,
        eventsByType,
        oldestEvent: dateRange?.oldest,
        newestEvent: dateRange?.newest,
      };
    } catch (error) {
      this.logger.error(
        `Failed to get event store statistics: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Clean up old events based on retention policy
   */
  async cleanupOldEvents(retentionDays: number = 90): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

      const result = await this.eventStoreRepository
        .createQueryBuilder()
        .delete()
        .where('occurredAt < :cutoffDate', { cutoffDate })
        .andWhere('status = :status', { status: EventStatus.PROCESSED })
        .execute();

      const deletedCount = result.affected || 0;

      this.logger.log(
        `Cleaned up ${deletedCount} events older than ${retentionDays} days`,
      );

      return deletedCount;
    } catch (error) {
      this.logger.error(
        `Failed to cleanup old events: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Generate content hash for event integrity
   */
  private generateContentHash(event: DomainEvent, eventType: string): string {
    const content = {
      eventId: event.eventId,
      eventType,
      aggregateId: event.aggregateId,
      aggregateType: event.aggregateType,
      eventData: this.sanitizeEventData(event),
      occurredAt: event.occurredAt,
    };

    return createHash('sha256').update(JSON.stringify(content)).digest('hex');
  }

  /**
   * Sanitize event data for storage
   */
  private sanitizeEventData(event: DomainEvent): Record<string, any> {
    const {
      eventId,
      aggregateId,
      aggregateType,
      aggregateVersion,
      occurredAt,
      ...eventData
    } = event;
    return eventData;
  }

  /**
   * Reconstruct domain event from stored entity
   */
  private reconstructDomainEvent(eventEntity: EventStoreEntity): DomainEvent {
    return {
      eventId: eventEntity.eventId,
      eventType: eventEntity.eventType,
      aggregateId: eventEntity.aggregateId,
      aggregateType: eventEntity.aggregateType,
      aggregateVersion: eventEntity.aggregateVersion,
      occurredAt: eventEntity.occurredAt,
      ...eventEntity.eventData,
    };
  }
}
