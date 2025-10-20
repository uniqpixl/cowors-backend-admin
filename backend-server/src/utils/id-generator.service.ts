import { Injectable } from '@nestjs/common';
import { randomBytes } from 'crypto';

export enum EntityType {
  USER = 'CUS',
  PARTNER = 'CPT',
  SPACE = 'CSP',
  BOOKING = 'BK',
  CITY = 'CTY',
  NEIGHBORHOOD = 'NBH',
  ADMIN = 'CAD',
  CATEGORY = 'CCT',
  SUBCATEGORY = 'CSC',
  NOTIFICATION = 'CNT',
  PAYMENT = 'CPY',
  REFUND = 'CRF',
  ORDER = 'COR',
  PAYMENT_INTENT = 'CPI',
  TRANSACTION = 'CTX',
  PAYOUT_TRANSACTION = 'CXT',
  PAYOUT_OPERATION = 'CPO',
  AUDIT = 'CAU',
  MESSAGE = 'CMG',
  RULE_VERSION = 'CRV',
  REQUEST = 'CRQ',
  INVOICE = 'CIN',
  TAX_TRANSACTION = 'CTT',
  TAX_COMPLIANCE = 'CTC',
  PAYOUT_REQUEST = 'CPR',
  PAYOUT = 'CPA',
  WALLET_TRANSACTION = 'CWT',
  WALLET = 'CWL',
}

@Injectable()
export class IdGeneratorService {
  private readonly ALPHANUMERIC_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  private readonly SUFFIX_LENGTH = 6;

  /**
   * Generates a unique ID with Cowors format: C + 2-letter suffix + hyphen + 6 alphanumeric characters
   * Example: CUS-128GG69, CPT-745R8P0
   */
  generateId(entityType: EntityType): string {
    const suffix = this.generateAlphanumericSuffix();
    return `${entityType}-${suffix}`;
  }

  /**
   * Static method for generating IDs in entities
   */
  static generateId(entityType: EntityType): string {
    const instance = new IdGeneratorService();
    return instance.generateId(entityType);
  }

  /**
   * Generates a 6-character alphanumeric suffix with guaranteed mix of letters and numbers
   */
  private generateAlphanumericSuffix(): string {
    // Ensure at least one letter and one number for better distribution
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numbers = '0123456789';

    let result = '';

    // Use crypto.randomBytes for better randomness
    const randomBuffer = randomBytes(this.SUFFIX_LENGTH);

    // Ensure at least one letter and one number
    const positions = this.shuffleArray([0, 1, 2, 3, 4, 5]);
    const letterPosition = positions[0];
    const numberPosition = positions[1];

    for (let i = 0; i < this.SUFFIX_LENGTH; i++) {
      let char: string;

      if (i === letterPosition) {
        // Force a letter at this position
        const letterIndex = randomBuffer[i] % letters.length;
        char = letters[letterIndex];
      } else if (i === numberPosition) {
        // Force a number at this position
        const numberIndex = randomBuffer[i] % numbers.length;
        char = numbers[numberIndex];
      } else {
        // Random alphanumeric character
        const charIndex = randomBuffer[i] % this.ALPHANUMERIC_CHARS.length;
        char = this.ALPHANUMERIC_CHARS[charIndex];
      }

      result += char;
    }

    return result;
  }

  /**
   * Fisher-Yates shuffle algorithm for array randomization
   */
  private shuffleArray(array: number[]): number[] {
    const shuffled = [...array];
    const randomBuffer = randomBytes(array.length);

    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = randomBuffer[i] % (i + 1);
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    return shuffled;
  }

  /**
   * Validates if an ID follows the Cowors format
   */
  isValidCoworsId(id: string): boolean {
    // Support all Cowors entity types
    const pattern =
      /^(CUS|CPT|CSP|BK|CTY|NBH|CAD|CCT|CSC|CNT|CPY|CRF|COR|CPI|CTX|CXT|CPO|CAU|CMG|CRV|CRQ|CIN|CTT|CTC|CPR|CPA|CWT)-[A-Z0-9]{6}$/;
    return pattern.test(id);
  }

  /**
   * Extracts entity type from a Cowors ID
   */
  getEntityTypeFromId(id: string): EntityType | null {
    if (!this.isValidCoworsId(id)) {
      return null;
    }

    const prefix = id.substring(0, 3);
    return Object.values(EntityType).find((type) => type === prefix) || null;
  }

  /**
   * Generates multiple unique IDs for bulk operations
   */
  generateBulkIds(entityType: EntityType, count: number): string[] {
    const ids = new Set<string>();

    while (ids.size < count) {
      ids.add(this.generateId(entityType));
    }

    return Array.from(ids);
  }
}
