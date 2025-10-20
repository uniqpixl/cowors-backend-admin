/**
 * Payment-related enums and types
 * Source of truth: backend-server/src/common/enums/payment.enum.ts & booking.enum.ts
 */

/**
 * Payment status enum
 * Uses lowercase to match backend implementation
 */
export enum PaymentStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded',
  PARTIALLY_REFUNDED = 'partially_refunded',
}

/**
 * Payment gateway enum
 */
export enum PaymentGateway {
  STRIPE = 'stripe',
  RAZORPAY = 'razorpay', 
  WALLET = 'wallet',
}

/**
 * Payment method enum
 */
export enum PaymentMethod {
  CREDIT_CARD = 'CREDIT_CARD',
  DEBIT_CARD = 'DEBIT_CARD',
  PAYPAL = 'PAYPAL',
  STRIPE = 'STRIPE',
  BANK_TRANSFER = 'BANK_TRANSFER',
  WALLET = 'WALLET',
  CASH = 'CASH',
}

/**
 * Payment type enum
 */
export enum PaymentType {
  BOOKING = 'BOOKING',
  REFUND = 'REFUND',
  COMMISSION = 'COMMISSION',
  WITHDRAWAL = 'WITHDRAWAL',
  DEPOSIT = 'DEPOSIT',
}

/**
 * Refund status enum
 */
export enum RefundStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

/**
 * Refund method enum
 */
export enum RefundMethod {
  ORIGINAL_PAYMENT = 'original_payment',
  WALLET = 'wallet',
  BANK_TRANSFER = 'bank_transfer',
  MANUAL = 'manual',
}

/**
 * Payout status enum
 */
export enum PayoutStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

/**
 * Payout method enum
 */
export enum PayoutMethod {
  BANK_TRANSFER = 'bank_transfer',
  PAYPAL = 'paypal',
  STRIPE = 'stripe',
  RAZORPAY = 'razorpay',
}

// Type guards
export const isValidPaymentStatus = (status: any): status is PaymentStatus => {
  return Object.values(PaymentStatus).includes(status);
};

export const isValidPaymentGateway = (gateway: any): gateway is PaymentGateway => {
  return Object.values(PaymentGateway).includes(gateway);
};

export const isValidRefundStatus = (status: any): status is RefundStatus => {
  return Object.values(RefundStatus).includes(status);
};

export const isValidPayoutStatus = (status: any): status is PayoutStatus => {
  return Object.values(PayoutStatus).includes(status);
};