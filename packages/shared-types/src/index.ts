/**
 * @cowors/shared-types
 * Shared TypeScript types and enums for Cowors applications
 * 
 * This package provides a single source of truth for all types, interfaces,
 * and enums used across the Cowors ecosystem (backend, admin, partner, user apps).
 */

// Re-export all modules
export * from './user';
export * from './booking';
export * from './payment';
export * from './space';
export * from './notification';
export * from './api';
export * from './enums';
export * from './utils/cowors-id';

// Version information
export const SHARED_TYPES_VERSION = '1.0.0';

// Convenience type exports for common patterns
export type {
  // Common API patterns
  ApiResponse,
  ApiError,
  PaginatedResponse,
  PaginationMeta,
  BaseQueryDto,
  DashboardKPIs,
  PlatformStats,
  AnalyticsQueryDto,
} from './api';

export type {
  // User-related
  User,
  AdminUser,
  PartnerUser,
  CreateUserDto,
  UpdateUserDto,
  UserQueryDto,
} from './user';

export type {
  // Booking-related
  Booking,
  CreateBookingDto,
  UpdateBookingDto,
  BookingQueryDto,
  BookingAnalytics,
} from './booking';

export type {
  // Payment-related
  Payment,
  CreatePaymentDto,
  ProcessPaymentDto,
  Refund,
  CreateRefundDto,
  Payout,
  PaymentAnalytics,
} from './payment';

export type {
  // Space-related
  Space,
  CreateSpaceDto,
  UpdateSpaceDto,
  SpaceQueryDto,
  SpaceSearchFilters,
  SpaceAnalytics,
} from './space';

export {
  // User enums
  UserRole,
  UserStatus,
  KycStatus,
  UserActivityStatus,
} from './user';

export {
  // Booking enums
  BookingStatus,
  BookingKycStatus,
  AddonCategory,
  CancellationReason,
} from './booking';

export {
  // Payment enums
  PaymentStatus,
  PaymentGateway,
  PaymentMethod,
  PaymentType,
  RefundStatus,
  RefundMethod,
  PayoutStatus,
  PayoutMethod,
} from './payment';

export {
  // Space enums
  SpaceType,
  SpaceStatus,
  AvailabilityStatus,
  SpaceAmenity,
  PricingType,
} from './space';

export {
  // Notification enums
  NotificationType,
  NotificationStatus,
  NotificationChannel,
  NotificationPriority,
} from './notification';

export {
  // API enums
  AnalyticsTimeRange,
  ApiErrorCode,
} from './api';

export {
  // Risk and fraud detection
  RiskLevel,
} from './enums';