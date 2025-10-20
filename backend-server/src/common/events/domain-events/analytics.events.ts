import { BaseDomainEvent } from '../domain-event.interface';

export class BookingAnalyticsEvent extends BaseDomainEvent {
  constructor(
    public readonly bookingId: string,
    public readonly userId: string,
    public readonly partnerId: string,
    public readonly spaceId: string,
    public readonly amount: number,
    public readonly duration: number, // in minutes
    public readonly bookingType: string,
    public readonly status: string,
    public readonly eventAction:
      | 'CREATED'
      | 'CONFIRMED'
      | 'COMPLETED'
      | 'CANCELLED',
    metadata?: Record<string, any>,
  ) {
    super(bookingId, 'Analytics', userId, {
      partnerId,
      spaceId,
      amount,
      duration,
      bookingType,
      status,
      eventAction,
      ...metadata,
    });
  }
}

export class PaymentAnalyticsEvent extends BaseDomainEvent {
  constructor(
    public readonly paymentId: string,
    public readonly userId: string,
    public readonly bookingId: string,
    public readonly amount: number,
    public readonly currency: string,
    public readonly gateway: string,
    public readonly status: string,
    public readonly eventAction:
      | 'INITIATED'
      | 'COMPLETED'
      | 'FAILED'
      | 'REFUNDED',
    public readonly processingTime?: number, // in milliseconds
    metadata?: Record<string, any>,
  ) {
    super(paymentId, 'Analytics', userId, {
      bookingId,
      amount,
      currency,
      gateway,
      status,
      eventAction,
      processingTime,
      ...metadata,
    });
  }
}

export class UserActivityAnalyticsEvent extends BaseDomainEvent {
  constructor(
    public readonly userId: string,
    public readonly activityType: string,
    public readonly entityType: string,
    public readonly entityId: string,
    public readonly sessionId?: string,
    public readonly userAgent?: string,
    public readonly ipAddress?: string,
    metadata?: Record<string, any>,
  ) {
    super(entityId, 'Analytics', userId, {
      activityType,
      entityType,
      sessionId,
      userAgent,
      ipAddress,
      ...metadata,
    });
  }
}

export class PartnerAnalyticsEvent extends BaseDomainEvent {
  constructor(
    public readonly partnerId: string,
    public readonly metricType: string,
    public readonly metricValue: number,
    public readonly period: string, // 'daily', 'weekly', 'monthly'
    public readonly date: Date,
    public readonly additionalData?: Record<string, any>,
    metadata?: Record<string, any>,
  ) {
    super(partnerId, 'Analytics', partnerId, {
      metricType,
      metricValue,
      period,
      date,
      additionalData,
      ...metadata,
    });
  }
}

export class RevenueAnalyticsEvent extends BaseDomainEvent {
  constructor(
    public readonly transactionId: string,
    public readonly partnerId: string,
    public readonly amount: number,
    public readonly commissionAmount: number,
    public readonly netAmount: number,
    public readonly transactionType: string,
    public readonly date: Date,
    metadata?: Record<string, any>,
  ) {
    super(transactionId, 'Analytics', partnerId, {
      amount,
      commissionAmount,
      netAmount,
      transactionType,
      date,
      ...metadata,
    });
  }
}

export class SpaceUtilizationAnalyticsEvent extends BaseDomainEvent {
  constructor(
    public readonly spaceId: string,
    public readonly partnerId: string,
    public readonly utilizationRate: number, // percentage
    public readonly totalBookings: number,
    public readonly totalRevenue: number,
    public readonly period: string,
    public readonly date: Date,
    metadata?: Record<string, any>,
  ) {
    super(spaceId, 'Analytics', partnerId, {
      utilizationRate,
      totalBookings,
      totalRevenue,
      period,
      date,
      ...metadata,
    });
  }
}

export class KYCAnalyticsEvent extends BaseDomainEvent {
  constructor(
    public readonly kycId: string,
    public readonly userId: string,
    public readonly status: string,
    public readonly provider: string,
    public readonly processingTime: number, // in milliseconds
    public readonly eventAction:
      | 'INITIATED'
      | 'COMPLETED'
      | 'FAILED'
      | 'REJECTED',
    metadata?: Record<string, any>,
  ) {
    super(kycId, 'Analytics', userId, {
      status,
      provider,
      processingTime,
      eventAction,
      ...metadata,
    });
  }
}
