import { BookingStatus } from '@/common/enums/booking.enum';
import { Uuid } from '@/common/types/common.type';

export class BookingCreatedEvent {
  constructor(
    public readonly bookingId: Uuid,
    public readonly userId: Uuid,
    public readonly spaceId: Uuid,
    public readonly partnerId: Uuid,
    public readonly totalAmount: number,
    public readonly startDateTime: Date,
    public readonly endDateTime: Date,
    public readonly guestCount: number,
    public readonly kycRequired: boolean,
  ) {}
}

export class BookingConfirmedEvent {
  constructor(
    public readonly bookingId: Uuid,
    public readonly userId: Uuid,
    public readonly spaceId: Uuid,
    public readonly partnerId: Uuid,
    public readonly totalAmount: number,
    public readonly startDateTime: Date,
    public readonly endDateTime: Date,
  ) {}
}

export class BookingCompletedEvent {
  constructor(
    public readonly bookingId: Uuid,
    public readonly userId: Uuid,
    public readonly spaceId: Uuid,
    public readonly partnerId: Uuid,
    public readonly totalAmount: number,
    public readonly startDateTime: Date,
    public readonly endDateTime: Date,
    public readonly completedAt: Date,
  ) {}
}

export class BookingCancelledEvent {
  constructor(
    public readonly bookingId: Uuid,
    public readonly userId: Uuid,
    public readonly spaceId: Uuid,
    public readonly partnerId: Uuid,
    public readonly totalAmount: number,
    public readonly cancelledAt: Date,
    public readonly reason?: string,
  ) {}
}

export class BookingModifiedEvent {
  constructor(
    public readonly bookingId: Uuid,
    public readonly userId: Uuid,
    public readonly spaceId: Uuid,
    public readonly partnerId: Uuid,
    public readonly previousStatus: BookingStatus,
    public readonly newStatus: BookingStatus,
    public readonly modifiedAt: Date,
    public readonly changes: Record<string, any>,
  ) {}
}
