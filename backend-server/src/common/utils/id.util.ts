import { randomBytes } from 'crypto';

/**
 * Generate a unique ID using crypto.randomBytes
 * @param length - Length of the ID (default: 16)
 * @returns A unique string ID
 */
export function generateId(length: number = 16): string {
  return randomBytes(length).toString('hex');
}

/**
 * Generate a UUID v4 compatible string
 * @returns A UUID v4 string
 */
export function generateUuid(): string {
  const bytes = randomBytes(16);

  // Set version (4) and variant bits
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;

  const hex = bytes.toString('hex');
  return [
    hex.substring(0, 8),
    hex.substring(8, 12),
    hex.substring(12, 16),
    hex.substring(16, 20),
    hex.substring(20, 32),
  ].join('-');
}

/**
 * Generate a short ID for notifications
 * @returns A short unique ID
 */
export function generateNotificationId(): string {
  return generateId(8);
}
