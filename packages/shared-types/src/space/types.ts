import { 
  SpaceType, 
  SpaceStatus, 
  AvailabilityStatus, 
  SpaceAmenity, 
  PricingType 
} from './enums';

/**
 * Base space interface
 */
export interface BaseSpace {
  id: string;
  partnerId: string;
  name: string;
  spaceType: SpaceType;
  status: SpaceStatus;
  capacity: number;
  pricePerHour: number;
  currency: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Detailed space interface
 */
export interface Space extends BaseSpace {
  description?: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  latitude?: number;
  longitude?: number;
  images: string[];
  amenities: SpaceAmenity[];
  rules?: string[];
  pricingType: PricingType;
  minBookingDuration: number; // in minutes
  maxBookingDuration: number; // in minutes
  advanceBookingDays: number;
  cancellationPolicy?: string;
  isInstantBooking: boolean;
  requiresApproval: boolean;
  operatingHours: OperatingHours;
  availabilityCalendar?: AvailabilitySlot[];
  // Related entities
  partner?: any; // Will be typed when partner types are defined
  bookings?: any[]; // Will be typed when booking types are defined
  reviews?: SpaceReview[];
  averageRating?: number;
  totalReviews?: number;
}

/**
 * Operating hours interface
 */
export interface OperatingHours {
  monday: DaySchedule;
  tuesday: DaySchedule;
  wednesday: DaySchedule;
  thursday: DaySchedule;
  friday: DaySchedule;
  saturday: DaySchedule;
  sunday: DaySchedule;
}

/**
 * Day schedule interface
 */
export interface DaySchedule {
  isOpen: boolean;
  openTime?: string; // HH:mm format
  closeTime?: string; // HH:mm format
  breaks?: TimeSlot[];
}

/**
 * Time slot interface
 */
export interface TimeSlot {
  startTime: string; // HH:mm format
  endTime: string; // HH:mm format
}

/**
 * Availability slot interface
 */
export interface AvailabilitySlot {
  id: string;
  spaceId: string;
  date: string; // YYYY-MM-DD format
  startTime: string; // HH:mm format
  endTime: string; // HH:mm format
  status: AvailabilityStatus;
  isRecurring: boolean;
  recurringPattern?: RecurringPattern;
  reason?: string; // for blocked/maintenance slots
}

/**
 * Recurring pattern interface
 */
export interface RecurringPattern {
  type: 'daily' | 'weekly' | 'monthly';
  interval: number; // every N days/weeks/months
  daysOfWeek?: number[]; // 0-6, Sunday-Saturday
  endDate?: string; // YYYY-MM-DD format
  exceptions?: string[]; // dates to exclude
}

/**
 * Space review interface
 */
export interface SpaceReview {
  id: string;
  spaceId: string;
  userId: string;
  bookingId: string;
  rating: number; // 1-5
  comment?: string;
  images?: string[];
  helpful: number;
  notHelpful: number;
  createdAt: Date;
  updatedAt: Date;
  // Related entities
  user?: any; // Will be typed when user types are defined
}

/**
 * Space creation DTO
 */
export interface CreateSpaceDto {
  name: string;
  spaceType: SpaceType;
  description?: string;
  capacity: number;
  pricePerHour: number;
  currency?: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  latitude?: number;
  longitude?: number;
  amenities: SpaceAmenity[];
  rules?: string[];
  pricingType?: PricingType;
  minBookingDuration?: number;
  maxBookingDuration?: number;
  advanceBookingDays?: number;
  cancellationPolicy?: string;
  isInstantBooking?: boolean;
  operatingHours: OperatingHours;
}

/**
 * Space update DTO
 */
export interface UpdateSpaceDto {
  name?: string;
  description?: string;
  capacity?: number;
  pricePerHour?: number;
  amenities?: SpaceAmenity[];
  rules?: string[];
  cancellationPolicy?: string;
  isInstantBooking?: boolean;
  requiresApproval?: boolean;
  operatingHours?: OperatingHours;
  status?: SpaceStatus;
}

/**
 * Space query parameters
 */
export interface SpaceQueryDto {
  partnerId?: string;
  spaceType?: SpaceType;
  status?: SpaceStatus;
  city?: string;
  state?: string;
  country?: string;
  minPrice?: number;
  maxPrice?: number;
  minCapacity?: number;
  maxCapacity?: number;
  amenities?: SpaceAmenity[];
  isInstantBooking?: boolean;
  availableFrom?: string;
  availableTo?: string;
  sortBy?: 'price' | 'capacity' | 'rating' | 'createdAt';
  sortOrder?: 'ASC' | 'DESC';
  page?: number;
  limit?: number;
}

/**
 * Space search filters
 */
export interface SpaceSearchFilters extends SpaceQueryDto {
  latitude?: number;
  longitude?: number;
  radius?: number; // in kilometers
  checkIn?: string; // YYYY-MM-DD HH:mm format
  checkOut?: string; // YYYY-MM-DD HH:mm format
  guests?: number;
}

/**
 * Space analytics interface
 */
export interface SpaceAnalytics {
  totalSpaces: number;
  activeSpaces: number;
  averageOccupancyRate: number;
  averageRating: number;
  totalBookings: number;
  totalRevenue: number;
  topPerformingSpaces: Array<{
    spaceId: string;
    spaceName: string;
    bookingCount: number;
    revenue: number;
    occupancyRate: number;
    averageRating: number;
  }>;
  occupancyByTimeRange: Array<{
    date: string;
    occupancyRate: number;
    bookingCount: number;
  }>;
}