/**
 * Booking-related enums and types
 * Source of truth: backend-server/src/common/enums/booking.enum.ts
 */

/**
 * Booking status enum
 * Uses lowercase to match backend implementation
 */
export enum BookingStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  CANCELLED = 'cancelled',
  COMPLETED = 'completed',
  NO_SHOW = 'no_show',
  REFUNDED = 'refunded',
}

/**
 * Booking KYC status specific to bookings
 */
export enum BookingKycStatus {
  NOT_REQUIRED = 'not_required',
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

/**
 * Addon categories for bookings
 */
export enum ExtrasCategory {
  FOOD_BEVERAGES = 'food_beverages',
  EQUIPMENT = 'equipment',
  SERVICES = 'services',
  AMENITIES = 'amenities',
}

/**
 * Booking cancellation reasons
 */
export enum CancellationReason {
  USER_REQUESTED = 'user_requested',
  PARTNER_UNAVAILABLE = 'partner_unavailable',
  SPACE_MAINTENANCE = 'space_maintenance',
  PAYMENT_FAILED = 'payment_failed',
  SYSTEM_ERROR = 'system_error',
  NO_SHOW = 'no_show',
  OTHER = 'other',
}

// Type guards
export const isValidBookingStatus = (status: any): status is BookingStatus => {
  return Object.values(BookingStatus).includes(status);
};

export const isValidAddonCategory = (category: any): category is AddonCategory => {
  return Object.values(AddonCategory).includes(category);
};