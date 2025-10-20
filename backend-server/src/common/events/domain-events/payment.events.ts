import { BaseDomainEvent } from '../domain-event.interface';

export class PaymentInitiatedEvent extends BaseDomainEvent {
  constructor(
    public readonly paymentId: string,
    public readonly userId: string,
    public readonly bookingId: string,
    public readonly amount: number,
    public readonly currency: string,
    public readonly gateway: string,
    public readonly kycRequired?: boolean,
    metadata?: Record<string, any>,
  ) {
    super(paymentId, 'Payment', userId, {
      bookingId,
      amount,
      currency,
      gateway,
      kycRequired,
      ...metadata,
    });
  }
}

export class PaymentCompletedEvent extends BaseDomainEvent {
  constructor(
    public readonly paymentId: string,
    public readonly userId: string,
    public readonly bookingId: string,
    public readonly amount: number,
    public readonly currency: string,
    public readonly gateway: string,
    public readonly kycCompleted?: boolean,
    public readonly bookingStatus?: string,
    metadata?: Record<string, any>,
  ) {
    super(paymentId, 'Payment', userId, {
      bookingId,
      amount,
      currency,
      gateway,
      kycCompleted,
      bookingStatus,
      ...metadata,
    });
  }
}

export class PaymentFailedEvent extends BaseDomainEvent {
  constructor(
    public readonly paymentId: string,
    public readonly userId: string,
    public readonly bookingId: string,
    public readonly amount: number,
    public readonly currency: string,
    public readonly gateway: string,
    public readonly failureReason: string,
    public readonly errorCode?: string,
    metadata?: Record<string, any>,
  ) {
    super(paymentId, 'Payment', userId, {
      bookingId,
      amount,
      currency,
      gateway,
      failureReason,
      errorCode,
      ...metadata,
    });
  }
}

export class PaymentKycCompletedEvent extends BaseDomainEvent {
  constructor(
    public readonly paymentId: string,
    public readonly userId: string,
    public readonly bookingId: string,
    public readonly kycVerificationId: string,
    metadata?: Record<string, any>,
  ) {
    super(paymentId, 'Payment', userId, {
      bookingId,
      kycVerificationId,
      ...metadata,
    });
  }
}

export class PaymentRefundInitiatedEvent extends BaseDomainEvent {
  constructor(
    public readonly paymentId: string,
    public readonly refundId: string,
    public readonly userId: string,
    public readonly bookingId: string,
    public readonly refundAmount: number,
    public readonly refundReason: string,
    public readonly refundMethod: string,
    metadata?: Record<string, any>,
  ) {
    super(paymentId, 'Payment', userId, {
      refundId,
      bookingId,
      refundAmount,
      refundReason,
      refundMethod,
      ...metadata,
    });
  }
}
