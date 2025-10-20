import { 
  PaymentStatus, 
  PaymentGateway, 
  PaymentMethod, 
  PaymentType,
  RefundStatus,
  RefundMethod,
  PayoutStatus,
  PayoutMethod
} from './enums';

/**
 * Base payment interface
 */
export interface BasePayment {
  id: string;
  userId: string;
  bookingId: string;
  paymentId: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Detailed payment interface
 */
export interface Payment extends BasePayment {
  gatewayPaymentId?: string;
  gatewayOrderId?: string;
  gateway: PaymentGateway;
  method: PaymentMethod;
  type: PaymentType;
  paidAt?: Date;
  completedAt?: Date;
  failedAt?: Date;
  cancelledAt?: Date;
  failureReason?: string;
  gatewayResponse?: Record<string, any>;
  metadata?: Record<string, any>;
  // Related entities
  user?: any; // Will be typed when user types are defined
  booking?: any; // Will be typed when booking types are defined
  refunds?: Refund[];
}

/**
 * Payment creation DTO
 */
export interface CreatePaymentDto {
  bookingId: string;
  amount: number;
  currency?: string;
  gateway: PaymentGateway;
  method: PaymentMethod;
  metadata?: Record<string, any>;
}

/**
 * Payment processing DTO
 */
export interface ProcessPaymentDto {
  paymentIntentId?: string;
  token?: string;
  cardDetails?: {
    number: string;
    expiryMonth: string;
    expiryYear: string;
    cvv: string;
    holderName: string;
  };
}

/**
 * Refund interface
 */
export interface Refund {
  id: string;
  paymentId: string;
  refundId: string;
  amount: number;
  currency: string;
  reason: string;
  status: RefundStatus;
  method: RefundMethod;
  processedAt?: Date;
  completedAt?: Date;
  failedAt?: Date;
  gatewayRefundId?: string;
  gatewayResponse?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Refund creation DTO
 */
export interface CreateRefundDto {
  paymentId: string;
  amount: number;
  reason: string;
  method?: RefundMethod;
}

/**
 * Payout interface
 */
export interface Payout {
  id: string;
  partnerId: string;
  amount: number;
  commissionAmount: number;
  feeAmount: number;
  netAmount: number;
  currency: string;
  status: PayoutStatus;
  method: PayoutMethod;
  accountDetails: PayoutAccountDetails;
  scheduledAt?: Date;
  processedAt?: Date;
  completedAt?: Date;
  failedAt?: Date;
  failureReason?: string;
  transactionId?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Payout account details
 */
export interface PayoutAccountDetails {
  accountNumber?: string;
  routingNumber?: string;
  bankName?: string;
  accountHolderName?: string;
  paypalEmail?: string;
  stripeAccountId?: string;
}

/**
 * Payout creation DTO
 */
export interface CreatePayoutDto {
  partnerId: string;
  amount: number;
  method: PayoutMethod;
  accountDetails: PayoutAccountDetails;
  scheduledAt?: Date;
}

/**
 * Wallet interface
 */
export interface Wallet {
  id: string;
  userId: string;
  balance: number;
  currency: string;
  status: 'active' | 'suspended' | 'closed';
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Wallet transaction interface
 */
export interface WalletTransaction {
  id: string;
  walletId: string;
  amount: number;
  type: 'credit' | 'debit';
  description: string;
  referenceId?: string;
  referenceType?: string;
  balanceAfter: number;
  createdAt: Date;
}

/**
 * Payment analytics interface
 */
export interface PaymentAnalytics {
  totalRevenue: number;
  totalTransactions: number;
  averageTransactionValue: number;
  successRate: number;
  refundRate: number;
  revenueByGateway: Record<PaymentGateway, number>;
  revenueByMethod: Record<PaymentMethod, number>;
  revenueByTimeRange: Array<{
    date: string;
    revenue: number;
    transactionCount: number;
  }>;
}