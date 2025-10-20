import { BaseDomainEvent } from '../domain-event.interface';

export class WalletBalanceUpdatedEvent extends BaseDomainEvent {
  constructor(
    public readonly walletId: string,
    public readonly userId: string,
    public readonly previousBalance: number,
    public readonly newBalance: number,
    public readonly amount: number,
    public readonly transactionType: 'CREDIT' | 'DEBIT',
    public readonly transactionId: string,
    public readonly description: string,
    public readonly currency: string = 'USD',
    metadata?: Record<string, any>,
  ) {
    super(walletId, 'Wallet', userId, {
      previousBalance,
      newBalance,
      amount,
      transactionType,
      transactionId,
      description,
      currency,
      ...metadata,
    });
  }
}

export class WalletTransactionCreatedEvent extends BaseDomainEvent {
  constructor(
    public readonly transactionId: string,
    public readonly walletId: string,
    public readonly userId: string,
    public readonly amount: number,
    public readonly transactionType: 'CREDIT' | 'DEBIT',
    public readonly status: 'PENDING' | 'COMPLETED' | 'FAILED',
    public readonly description: string,
    public readonly referenceId?: string,
    public readonly referenceType?: string,
    metadata?: Record<string, any>,
  ) {
    super(transactionId, 'Wallet', userId, {
      walletId,
      amount,
      transactionType,
      status,
      description,
      referenceId,
      referenceType,
      ...metadata,
    });
  }
}

export class WalletTransactionCompletedEvent extends BaseDomainEvent {
  constructor(
    public readonly transactionId: string,
    public readonly walletId: string,
    public readonly userId: string,
    public readonly amount: number,
    public readonly transactionType: 'CREDIT' | 'DEBIT',
    public readonly finalBalance: number,
    public readonly completedAt: Date,
    metadata?: Record<string, any>,
  ) {
    super(transactionId, 'Wallet', userId, {
      walletId,
      amount,
      transactionType,
      finalBalance,
      completedAt,
      ...metadata,
    });
  }
}

export class WalletTransactionFailedEvent extends BaseDomainEvent {
  constructor(
    public readonly transactionId: string,
    public readonly walletId: string,
    public readonly userId: string,
    public readonly amount: number,
    public readonly transactionType: 'CREDIT' | 'DEBIT',
    public readonly failureReason: string,
    public readonly errorCode?: string,
    metadata?: Record<string, any>,
  ) {
    super(transactionId, 'Wallet', userId, {
      walletId,
      amount,
      transactionType,
      failureReason,
      errorCode,
      ...metadata,
    });
  }
}

export class WalletWithdrawalRequestedEvent extends BaseDomainEvent {
  constructor(
    public readonly withdrawalId: string,
    public readonly walletId: string,
    public readonly userId: string,
    public readonly amount: number,
    public readonly withdrawalMethod: string,
    public readonly bankDetails?: Record<string, any>,
    metadata?: Record<string, any>,
  ) {
    super(withdrawalId, 'Wallet', userId, {
      walletId,
      amount,
      withdrawalMethod,
      bankDetails,
      ...metadata,
    });
  }
}

export class WalletWithdrawalCompletedEvent extends BaseDomainEvent {
  constructor(
    public readonly withdrawalId: string,
    public readonly walletId: string,
    public readonly userId: string,
    public readonly amount: number,
    public readonly paymentReference: string,
    public readonly completedAt: Date,
    public readonly processedBy: string,
    metadata?: Record<string, any>,
  ) {
    super(withdrawalId, 'Wallet', userId, {
      walletId,
      amount,
      paymentReference,
      completedAt,
      processedBy,
      ...metadata,
    });
  }
}

export class WalletWithdrawalFailedEvent extends BaseDomainEvent {
  constructor(
    public readonly withdrawalId: string,
    public readonly walletId: string,
    public readonly userId: string,
    public readonly amount: number,
    public readonly failureReason: string,
    public readonly errorCode?: string,
    metadata?: Record<string, any>,
  ) {
    super(withdrawalId, 'Wallet', userId, {
      walletId,
      amount,
      failureReason,
      errorCode,
      ...metadata,
    });
  }
}

export class WalletLowBalanceAlertEvent extends BaseDomainEvent {
  constructor(
    public readonly walletId: string,
    public readonly userId: string,
    public readonly currentBalance: number,
    public readonly threshold: number,
    public readonly alertLevel: 'WARNING' | 'CRITICAL',
    metadata?: Record<string, any>,
  ) {
    super(walletId, 'Wallet', userId, {
      currentBalance,
      threshold,
      alertLevel,
      ...metadata,
    });
  }
}
