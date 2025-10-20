/**
 * Space-related enums and types
 */

/**
 * Space types available in the system
 */
export enum SpaceType {
  MEETING_ROOM = 'meeting_room',
  CONFERENCE_ROOM = 'conference_room',
  PRIVATE_OFFICE = 'private_office',
  DESK = 'desk',
  HOT_DESK = 'hot_desk',
  PHONE_BOOTH = 'phone_booth',
  EVENT_SPACE = 'event_space',
  COWORKING_SPACE = 'coworking_space',
  WORKSHOP = 'workshop',
  STUDIO = 'studio',
}

/**
 * Space status
 */
export enum SpaceStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  MAINTENANCE = 'maintenance',
  PENDING_APPROVAL = 'pending_approval',
  REJECTED = 'rejected',
}

/**
 * Space availability status
 */
export enum AvailabilityStatus {
  AVAILABLE = 'available',
  BOOKED = 'booked',
  BLOCKED = 'blocked',
  MAINTENANCE = 'maintenance',
}

/**
 * Space amenities
 */
export enum SpaceAmenity {
  WIFI = 'wifi',
  PROJECTOR = 'projector',
  WHITEBOARD = 'whiteboard',
  TV_SCREEN = 'tv_screen',
  COFFEE = 'coffee',
  WATER = 'water',
  AIR_CONDITIONING = 'air_conditioning',
  NATURAL_LIGHT = 'natural_light',
  PARKING = 'parking',
  KITCHEN_ACCESS = 'kitchen_access',
  PHONE_BOOTH = 'phone_booth',
  PRINTING = 'printing',
  SCANNER = 'scanner',
  RECEPTION = 'reception',
  SECURITY = 'security',
  ACCESSIBLE = 'accessible',
}

/**
 * Space pricing types
 */
export enum PricingType {
  HOURLY = 'hourly',
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  CUSTOM = 'custom',
}

// Type guards
export const isValidSpaceType = (type: any): type is SpaceType => {
  return Object.values(SpaceType).includes(type);
};

export const isValidSpaceStatus = (status: any): status is SpaceStatus => {
  return Object.values(SpaceStatus).includes(status);
};

export const isValidSpaceAmenity = (amenity: any): amenity is SpaceAmenity => {
  return Object.values(SpaceAmenity).includes(amenity);
};