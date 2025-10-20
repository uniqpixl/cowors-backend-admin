/**
 * Utility functions for handling Cowors ID format
 * Format: C + 2-letter suffix + hyphen + 6 alphanumeric characters
 * Examples: CUS-128GG69, CPT-745R8P0
 */

// Entity type mappings
export const ENTITY_PREFIXES = {
  USER: 'CUS',
  PARTNER: 'CPT', 
  SPACE: 'CSP',
  BOOKING: 'BK', // Updated to use BK- prefix for bookings
  ADMIN: 'CAD',
  CATEGORY: 'CCT',
  SUBCATEGORY: 'CSC'
} as const;

export type EntityType = keyof typeof ENTITY_PREFIXES;

/**
 * Validates if a string matches the Cowors ID format
 * @param id - The ID string to validate
 * @returns boolean indicating if the ID is valid
 */
export function isValidCoworsId(id: string): boolean {
  if (!id || typeof id !== 'string') {
    return false;
  }
  
  // Standard Cowors ID format: (CUS|CPT|CSP|CAD|CCT|CSC) + hyphen + 6 alphanumeric characters
  const coworsIdRegex = /^(CUS|CPT|CSP|CAD|CCT|CSC)-[A-Z0-9]{6}$/;
  // Special booking ID format: BK- + 6 alphanumeric characters
  const bookingIdRegex = /^BK-[A-Z0-9]{6}$/;
  
  return coworsIdRegex.test(id) || bookingIdRegex.test(id);
}

/**
 * Validates if a string matches the booking ID format (BK-HJK0001)
 * @param id - The ID string to validate
 * @returns boolean indicating if the ID is a valid booking ID
 */
export function isValidBookingId(id: string): boolean {
  if (!id || typeof id !== 'string') {
    return false;
  }
  
  // Booking ID format: BK- + 6 alphanumeric characters
  const bookingIdRegex = /^BK-[A-Z0-9]{6}$/;
  return bookingIdRegex.test(id);
}

/**
 * Extracts the entity type from a Cowors ID
 * @param id - The Cowors ID
 * @returns The entity type or null if invalid
 */
export function getEntityTypeFromId(id: string): EntityType | null {
  if (!isValidCoworsId(id)) {
    return null;
  }
  
  // Handle special booking ID format (BK-)
  if (id.startsWith('BK-')) {
    return 'BOOKING';
  }
  
  // Handle standard Cowors ID format - extract the prefix before the hyphen
  const prefix = id.split('-')[0];
  
  for (const [entityType, entityPrefix] of Object.entries(ENTITY_PREFIXES)) {
    if (entityPrefix === prefix) {
      return entityType as EntityType;
    }
  }
  
  return null;
}

/**
 * Formats a Cowors ID for display (adds spacing or styling if needed)
 * @param id - The Cowors ID
 * @returns Formatted ID string
 */
export function formatCoworsId(id: string): string {
  if (!isValidCoworsId(id)) {
    return id; // Return as-is if not a valid Cowors ID
  }
  
  // For now, just return the ID as-is
  // In the future, we could add styling or spacing
  return id;
}

/**
 * Checks if an ID is likely a legacy UUID format
 * @param id - The ID string to check
 * @returns boolean indicating if it's a UUID format
 */
export function isLegacyUuid(id: string): boolean {
  if (!id || typeof id !== 'string') {
    return false;
  }
  
  // UUID v4 format: 8-4-4-4-12 hexadecimal characters
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
}

/**
 * Determines the ID type (Cowors, booking, UUID, or unknown)
 * @param id - The ID string to analyze
 * @returns The ID type
 */
export function getIdType(id: string): 'cowors' | 'booking' | 'uuid' | 'unknown' {
  if (isValidBookingId(id)) {
    return 'booking';
  }
  
  if (isValidCoworsId(id)) {
    return 'cowors';
  }
  
  if (isLegacyUuid(id)) {
    return 'uuid';
  }
  
  return 'unknown';
}

/**
 * Validates an ID and provides detailed feedback
 * @param id - The ID to validate
 * @returns Validation result with details
 */
export function validateId(id: string): {
  isValid: boolean;
  type: 'cowors' | 'booking' | 'uuid' | 'unknown';
  entityType?: EntityType;
  message?: string;
} {
  const type = getIdType(id);
  
  if (type === 'booking') {
    return {
      isValid: true,
      type: 'booking',
      entityType: 'BOOKING',
      message: 'Valid Booking ID'
    };
  }
  
  if (type === 'cowors') {
    const entityType = getEntityTypeFromId(id);
    return {
      isValid: true,
      type: 'cowors',
      entityType: entityType || undefined,
      message: entityType ? `Valid Cowors ID for ${entityType}` : 'Valid Cowors ID'
    };
  }
  
  if (type === 'uuid') {
    return {
      isValid: true,
      type: 'uuid',
      message: 'Legacy UUID format (still supported)'
    };
  }
  
  return {
    isValid: false,
    type: 'unknown',
    message: 'Invalid ID format'
  };
}

/**
 * Formats a booking ID for display (BK-HJK0001 pattern)
 * @param id - The booking ID (can be UUID or already formatted)
 * @returns Formatted booking ID string
 */
export function formatBookingId(id: string): string {
  if (!id || typeof id !== 'string') {
    return id;
  }
  
  // If already a valid booking ID, return as-is
  if (isValidBookingId(id)) {
    return id;
  }
  
  // If it's a UUID, generate a formatted booking ID
  if (isLegacyUuid(id)) {
    // Generate a 6-character alphanumeric code from the UUID
    const hash = id.replace(/-/g, '').toUpperCase();
    const code = hash.substring(0, 6);
    return `BK-${code}`;
  }
  
  // For any other format, try to extract alphanumeric characters
  const alphanumeric = id.replace(/[^A-Z0-9]/gi, '').toUpperCase();
  if (alphanumeric.length >= 6) {
    return `BK-${alphanumeric.substring(0, 6)}`;
  }
  
  // Fallback: pad with zeros if needed
  const padded = alphanumeric.padEnd(6, '0');
  return `BK-${padded}`;
}