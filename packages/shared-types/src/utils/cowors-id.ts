/**
 * Cowors ID utilities
 * - Format: `{PREFIX}-{SUFFIX}` where PREFIX is 2-3 uppercase letters and SUFFIX is 6 alphanumeric characters
 * - Deterministic mapping helper to convert legacy identifiers (e.g., UUIDs) to Cowors IDs
 */

import { createHash } from 'crypto';

/**
 * Validates if a string matches Cowors ID format for supported prefixes
 */
export function isValidCoworsId(id: string): boolean {
  const pattern =
    /^(CUS|CPT|CSP|BK|CTY|NBH|CAD|CCT|CSC|CNT|CPY|CRF|COR|CPI|CTX|CXT|CPO|CAU|CMG|CRV|CRQ|CIN|CTT|CTC|CPR|CPA|CWT|CWL)-[A-Z0-9]{6}$/;
  return pattern.test(id);
}

/**
 * Deterministically maps a source identifier to a Cowors-style ID with given prefix.
 * Ensures stable mapping without exposing the raw source identifier.
 */
export function toCoworsId(prefix: string, sourceId: string): string {
  const hashHex = createHash('sha256').update(sourceId).digest('hex');
  const part1 = hashHex.slice(0, 16);
  const base36 = BigInt('0x' + part1)
    .toString(36)
    .toUpperCase();
  let suffix = base36.slice(0, 6);

  if (suffix.length < 6) {
    const part2 = hashHex.slice(16, 32);
    const base36b = BigInt('0x' + part2)
      .toString(36)
      .toUpperCase();
    suffix = (suffix + base36b).slice(0, 6);
  }

  return `${prefix}-${suffix}`;
}