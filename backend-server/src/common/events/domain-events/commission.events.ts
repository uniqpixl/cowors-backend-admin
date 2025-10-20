import { BaseDomainEvent } from '../domain-event.interface';

export class CommissionCalculationRequestedEvent extends BaseDomainEvent {
  constructor(
    public readonly bookingId: string,
    public readonly userId: string,
    public readonly partnerId: string,
    public readonly totalAmount: number,
    public readonly transactionType: string,
    public readonly spaceId?: string,
    metadata?: Record<string, any>,
  ) {
    super(bookingId, 'Commission', userId, {
      partnerId,
      totalAmount,
      transactionType,
      spaceId,
      ...metadata,
    });
  }
}

export class CommissionCalculatedEvent extends BaseDomainEvent {
  constructor(
    public readonly calculationId: string,
    public readonly bookingId: string,
    public readonly partnerId: string,
    public readonly transactionAmount: number,
    public readonly commissionAmount: number,
    public readonly commissionRate: number,
    public readonly ruleId?: string,
    metadata?: Record<string, any>,
  ) {
    super(calculationId, 'Commission', partnerId, {
      bookingId,
      transactionAmount,
      commissionAmount,
      commissionRate,
      ruleId,
      ...metadata,
    });
  }
}

export class CommissionApprovedEvent extends BaseDomainEvent {
  constructor(
    public readonly calculationId: string,
    public readonly partnerId: string,
    public readonly commissionAmount: number,
    public readonly approvedBy: string,
    public readonly approvedAt: Date,
    metadata?: Record<string, any>,
  ) {
    super(calculationId, 'Commission', partnerId, {
      commissionAmount,
      approvedBy,
      approvedAt,
      ...metadata,
    });
  }
}

export class CommissionPayoutInitiatedEvent extends BaseDomainEvent {
  constructor(
    public readonly payoutId: string,
    public readonly partnerId: string,
    public readonly totalAmount: number,
    public readonly calculationIds: string[],
    public readonly paymentMethod: string,
    public readonly scheduledDate?: Date,
    metadata?: Record<string, any>,
  ) {
    super(payoutId, 'Commission', partnerId, {
      totalAmount,
      calculationIds,
      paymentMethod,
      scheduledDate,
      ...metadata,
    });
  }
}

export class CommissionPayoutCompletedEvent extends BaseDomainEvent {
  constructor(
    public readonly payoutId: string,
    public readonly partnerId: string,
    public readonly totalAmount: number,
    public readonly paymentReference: string,
    public readonly completedAt: Date,
    public readonly processedBy: string,
    metadata?: Record<string, any>,
  ) {
    super(payoutId, 'Commission', partnerId, {
      totalAmount,
      paymentReference,
      completedAt,
      processedBy,
      ...metadata,
    });
  }
}

export class CommissionPayoutFailedEvent extends BaseDomainEvent {
  constructor(
    public readonly payoutId: string,
    public readonly partnerId: string,
    public readonly totalAmount: number,
    public readonly failureReason: string,
    public readonly errorCode?: string,
    metadata?: Record<string, any>,
  ) {
    super(payoutId, 'Commission', partnerId, {
      totalAmount,
      failureReason,
      errorCode,
      ...metadata,
    });
  }
}
