import { BookingStatus, BookingKycStatus, ExtrasCategory, CancellationReason } from './enums';
import { PaymentStatus } from '../payment/enums';

/**
 * Base booking interface
 */
export interface BaseBooking {
  id: string;
  userId: string;
  spaceId: string;
  partnerId: string;
  bookingNumber: string;
  startDateTime: Date;
  endDateTime: Date;
  duration: number; // in minutes
  guestCount: number;
  status: BookingStatus;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Detailed booking interface with all fields
 */
export interface Booking extends BaseBooking {
  baseAmount: number;
  addonAmount: number;
  discountAmount: number;
  couponCode?: string;
  couponId?: string;
  taxAmount: number;
  totalAmount: number;
  currency: string;
  specialRequests?: string;
  cancellationReason?: string;
  cancelledAt?: Date;
  confirmedAt?: Date;
  completedAt?: Date;
  kycStatus?: BookingKycStatus;
  paymentStatus?: PaymentStatus;
  // Related entities
  user?: any; // Will be typed when user types are defined
  space?: any; // Will be typed when space types are defined
  partner?: any; // Will be typed when partner types are defined
  payment?: any; // Will be typed when payment types are defined
  addons?: BookingAddon[];
}

/**
 * Booking addon interface
 */
export interface BookingAddon {
  id: string;
  bookingId: string;
  name: string;
  description?: string;
  category: AddonCategory;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  createdAt: Date;
}

/**
 * Booking creation DTO
 */
export interface CreateBookingDto {
  spaceId: string;
  startDateTime: string;
  endDateTime: string;
  guests: number;
  notes?: string;
  couponCode?: string;
  addons?: CreateBookingAddonDto[];
}

/**
 * Booking addon creation DTO
 */
export interface CreateBookingAddonDto {
  addonId: string;
  quantity: number;
}

/**
 * Booking update DTO
 */
export interface UpdateBookingDto {
  startDateTime?: string;
  endDateTime?: string;
  guests?: number;
  notes?: string;
  status?: BookingStatus;
  totalAmount?: number;
  cancellationReason?: CancellationReason;
}

/**
 * Booking query parameters
 */
export interface BookingQueryDto {
  userId?: string;
  spaceId?: string;
  partnerId?: string;
  status?: BookingStatus;
  startDate?: string;
  endDate?: string;
  minAmount?: number;
  maxAmount?: number;
  sortBy?: 'startDateTime' | 'createdAt' | 'totalAmount';
  sortOrder?: 'ASC' | 'DESC';
  page?: number;
  limit?: number;
}

/**
 * Space availability check DTO
 */
export interface CheckAvailabilityDto {
  spaceId: string;
  startDateTime: string;
  endDateTime: string;
  guests: number;
}

/**
 * Availability result interface
 */
export interface AvailabilityResult {
  available: boolean;
  conflictingBookings?: string[];
  suggestedTimes?: AvailableTimeSlot[];
}

/**
 * Available time slot interface
 */
export interface AvailableTimeSlot {
  startDateTime: Date;
  endDateTime: Date;
  maxGuests: number;
}

/**
 * Booking analytics interface
 */
export interface BookingAnalytics {
  totalBookings: number;
  completedBookings: number;
  cancelledBookings: number;
  averageBookingValue: number;
  bookingsByStatus: Record<BookingStatus, number>;
  bookingsByTimeRange: Array<{
    date: string;
    count: number;
    revenue: number;
  }>;
  topSpaces: Array<{
    spaceId: string;
    spaceName: string;
    bookingCount: number;
    revenue: number;
  }>;
}