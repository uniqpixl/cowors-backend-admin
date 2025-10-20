import { BaseDomainEvent } from '../domain-event.interface';

export class BookingCreatedEvent extends BaseDomainEvent {
  constructor(
    public readonly bookingId: string,
    public readonly userId: string,
    public readonly spaceId: string,
    public readonly partnerId: string,
    public readonly totalAmount: number,
    public readonly startDate: Date,
    public readonly endDate: Date,
    public readonly status: string,
    metadata?: Record<string, any>,
  ) {
    super(bookingId, 'Booking', userId, {
      spaceId,
      partnerId,
      totalAmount,
      startDate,
      endDate,
      status,
      ...metadata,
    });
  }
}

export class BookingConfirmedEvent extends BaseDomainEvent {
  constructor(
    public readonly bookingId: string,
    public readonly userId: string,
    public readonly partnerId: string,
    public readonly totalAmount: number,
    public readonly confirmedAt: Date,
    metadata?: Record<string, any>,
  ) {
    super(bookingId, 'Booking', userId, {
      partnerId,
      totalAmount,
      confirmedAt,
      ...metadata,
    });
  }
}

export class BookingCompletedEvent extends BaseDomainEvent {
  constructor(
    public readonly bookingId: string,
    public readonly userId: string,
    public readonly partnerId: string,
    public readonly spaceId: string,
    public readonly totalAmount: number,
    public readonly completedAt: Date,
    public readonly duration: number, // in minutes
    metadata?: Record<string, any>,
  ) {
    super(bookingId, 'Booking', userId, {
      partnerId,
      spaceId,
      totalAmount,
      completedAt,
      duration,
      ...metadata,
    });
  }
}

export class BookingCancelledEvent extends BaseDomainEvent {
  constructor(
    public readonly bookingId: string,
    public readonly userId: string,
    public readonly partnerId: string,
    public readonly cancelledBy: string,
    public readonly cancellationReason: string,
    public readonly refundAmount?: number,
    public readonly cancellationFee?: number,
    metadata?: Record<string, any>,
  ) {
    super(bookingId, 'Booking', userId, {
      partnerId,
      cancelledBy,
      cancellationReason,
      refundAmount,
      cancellationFee,
      ...metadata,
    });
  }
}

export class BookingModifiedEvent extends BaseDomainEvent {
  constructor(
    public readonly bookingId: string,
    public readonly userId: string,
    public readonly partnerId: string,
    public readonly changes: Record<string, { from: any; to: any }>,
    public readonly modifiedBy: string,
    metadata?: Record<string, any>,
  ) {
    super(bookingId, 'Booking', userId, {
      partnerId,
      changes,
      modifiedBy,
      ...metadata,
    });
  }
}
