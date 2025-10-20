import { EventEmitterModule } from '@nestjs/event-emitter';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken, TypeOrmModule } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import {
  EventStatus,
  EventStoreEntity,
} from '../../../database/entities/event-store.entity';
import { BaseDomainEvent, DomainEvent } from '../domain-event.interface';
import { EventBusService } from '../event-bus.service';
import { EventStoreService } from './event-store.service';

// Test event classes
class TestBookingCreatedEvent extends BaseDomainEvent {
  constructor(
    public readonly bookingId: string,
    public readonly spaceId: string,
    public readonly userId: string,
    public readonly amount: number,
  ) {
    super(bookingId, 'Booking', userId, {
      spaceId,
      amount,
    });
  }
}

class TestPaymentCompletedEvent extends BaseDomainEvent {
  constructor(
    public readonly paymentId: string,
    public readonly bookingId: string,
    public readonly amount: number,
    public readonly userId: string,
  ) {
    super(paymentId, 'Payment', userId, {
      bookingId,
      amount,
    });
  }
}

describe('EventStore Integration', () => {
  let module: TestingModule;
  let eventStoreService: EventStoreService;
  let eventBusService: EventBusService;
  let eventStoreRepository: Repository<EventStoreEntity>;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'sqlite',
          database: ':memory:',
          entities: [EventStoreEntity],
          synchronize: true,
        }),
        TypeOrmModule.forFeature([EventStoreEntity]),
        EventEmitterModule.forRoot(),
      ],
      providers: [EventStoreService, EventBusService],
    }).compile();

    eventStoreService = module.get<EventStoreService>(EventStoreService);
    eventBusService = module.get<EventBusService>(EventBusService);
    eventStoreRepository = module.get<Repository<EventStoreEntity>>(
      getRepositoryToken(EventStoreEntity),
    );
  });

  afterAll(async () => {
    await module.close();
  });

  beforeEach(async () => {
    await eventStoreRepository.clear();
  });

  describe('Event Storage', () => {
    it('should store a domain event', async () => {
      const event = new TestBookingCreatedEvent(
        'booking-123',
        'space-456',
        'user-789',
        100,
      );

      await eventStoreService.storeEvent(event, 'booking.created', {
        userId: event.userId,
        metadata: { source: 'test' },
      });

      const storedEvents = await eventStoreRepository.find();
      expect(storedEvents).toHaveLength(1);

      const storedEvent = storedEvents[0];
      expect(storedEvent.eventType).toBe('TestBookingCreatedEvent');
      expect(storedEvent.aggregateId).toBe('booking-123');
      expect(storedEvent.aggregateType).toBe('Booking');
      expect(storedEvent.status).toBe(EventStatus.PENDING);
      expect(storedEvent.userId).toBe('user-789');
    });

    it('should mark event as processed', async () => {
      const event = new TestBookingCreatedEvent(
        'booking-123',
        'space-456',
        'user-789',
        100,
      );

      const storedEvent = await eventStoreService.storeEvent(
        event,
        'booking.created',
      );
      await eventStoreService.markEventAsProcessed(storedEvent.id);

      const updatedEvent = await eventStoreRepository.findOne({
        where: { id: storedEvent.id },
      });

      expect(updatedEvent.status).toBe(EventStatus.PROCESSED);
      expect(updatedEvent.processedAt).toBeDefined();
    });

    it('should mark event as failed', async () => {
      const event = new TestBookingCreatedEvent(
        'booking-123',
        'space-456',
        'user-789',
        100,
      );

      const storedEvent = await eventStoreService.storeEvent(
        event,
        'booking.created',
      );
      const error = new Error('Processing failed');

      await eventStoreService.markEventAsFailed(storedEvent.id, error);

      const updatedEvent = await eventStoreRepository.findOne({
        where: { id: storedEvent.id },
      });

      expect(updatedEvent.status).toBe(EventStatus.FAILED);
      expect(updatedEvent.failedAt).toBeDefined();
      expect(updatedEvent.errorMessage).toBe('Processing failed');
    });
  });

  describe('Event Retrieval', () => {
    beforeEach(async () => {
      // Create test events
      const events = [
        new TestBookingCreatedEvent('booking-1', 'space-1', 'user-1', 100),
        new TestBookingCreatedEvent('booking-2', 'space-2', 'user-2', 200),
        new TestPaymentCompletedEvent('payment-1', 'booking-1', 100, 'user-1'),
      ];

      for (const event of events) {
        await eventStoreService.storeEvent(
          event,
          event.eventType.toLowerCase(),
        );
      }
    });

    it('should get events for replay', async () => {
      const events = await eventStoreService.getEventsForReplay({
        eventTypes: ['TestBookingCreatedEvent'],
        limit: 10,
      });

      expect(events).toHaveLength(2);
      expect(events[0].eventType).toBe('TestBookingCreatedEvent');
      expect(events[1].eventType).toBe('TestBookingCreatedEvent');
    });

    it('should get event stream for aggregate', async () => {
      const stream = await eventStoreService.getEventStream(
        'booking-1',
        'Booking',
      );

      expect(stream).toHaveLength(1);
      expect(stream[0].aggregateId).toBe('booking-1');
      expect(stream[0].aggregateType).toBe('Booking');
    });

    it('should get statistics', async () => {
      const stats = await eventStoreService.getStatistics();

      expect(stats.totalEvents).toBe(3);
      expect(stats.pendingEvents).toBe(3);
      expect(stats.processedEvents).toBe(0);
      expect(stats.failedEvents).toBe(0);
    });
  });

  describe('Event Replay', () => {
    it('should replay events and mark them as replayed', async () => {
      const event = new TestBookingCreatedEvent(
        'booking-123',
        'space-456',
        'user-789',
        100,
      );

      await eventStoreService.storeEvent(event, 'booking.created');

      const replayResult = await eventStoreService.replayEvents({
        eventTypes: ['TestBookingCreatedEvent'],
      });

      expect(replayResult.replayed).toBe(1);
      expect(replayResult.failed).toBe(0);

      const replayedEvents = await eventStoreRepository.find({
        where: { status: EventStatus.REPLAYED },
      });

      expect(replayedEvents).toHaveLength(1);
    });
  });

  describe('Event Bus Integration', () => {
    it('should publish event through event bus and store it', async () => {
      const event = new TestBookingCreatedEvent(
        'booking-123',
        'space-456',
        'user-789',
        100,
      );

      await eventBusService.publish(event, {
        userId: event.userId,
        metadata: { source: 'integration-test' },
      });

      // Wait a bit for async processing
      await new Promise((resolve) => setTimeout(resolve, 100));

      const storedEvents = await eventStoreRepository.find();
      expect(storedEvents).toHaveLength(1);

      const storedEvent = storedEvents[0];
      expect(storedEvent.eventType).toBe('TestBookingCreatedEvent');
      expect(storedEvent.status).toBe(EventStatus.PROCESSED);
    });

    it('should publish multiple events', async () => {
      const events = [
        new TestBookingCreatedEvent('booking-1', 'space-1', 'user-1', 100),
        new TestPaymentCompletedEvent('payment-1', 'booking-1', 100, 'user-1'),
      ];

      await eventBusService.publishAll(events, {
        userId: 'user-1',
        metadata: { batch: true },
      });

      // Wait a bit for async processing
      await new Promise((resolve) => setTimeout(resolve, 100));

      const storedEvents = await eventStoreRepository.find();
      expect(storedEvents).toHaveLength(2);
    });
  });

  describe('Event Cleanup', () => {
    it('should cleanup old processed events', async () => {
      const event = new TestBookingCreatedEvent(
        'booking-123',
        'space-456',
        'user-789',
        100,
      );

      const storedEvent = await eventStoreService.storeEvent(
        event,
        'booking.created',
      );
      await eventStoreService.markEventAsProcessed(storedEvent.id);

      // Manually set the occurred_at to an old date
      await eventStoreRepository.update(
        { id: storedEvent.id },
        { occurredAt: new Date(Date.now() - 100 * 24 * 60 * 60 * 1000) }, // 100 days ago
      );

      const deletedCount = await eventStoreService.cleanupOldEvents(90);
      expect(deletedCount).toBe(1);

      const remainingEvents = await eventStoreRepository.find();
      expect(remainingEvents).toHaveLength(0);
    });
  });
});
