/**
 * Phone number normalization and validation utilities
 * Ensures consistent phone number format to prevent duplicates
 */

/**
 * Normalizes a phone number by removing common formatting characters
 * - Removes spaces, dashes, dots, parentheses
 * - Removes Italian country code (+39, 0039)
 * - Returns lowercase trimmed result
 */
export function normalizePhone(phone: string): string {
  if (!phone) return '';
  
  let normalized = phone
    .trim()
    // Remove all spaces, dashes, dots, parentheses
    .replace(/[\s\-\.\(\)]/g, '')
    // Remove Italian country code variations
    .replace(/^(\+39|0039|39)/, '')
    // Remove any remaining non-digit characters except + at start
    .replace(/[^\d]/g, '');
  
  console.log('[phone-utils] normalizePhone:', { original: phone, normalized });
  return normalized;
}

/**
 * Formats a phone number for display
 * Groups digits for readability: 333 1234567
 */
export function formatPhoneDisplay(phone: string): string {
  const normalized = normalizePhone(phone);
  if (normalized.length <= 3) return normalized;
  if (normalized.length <= 6) return `${normalized.slice(0, 3)} ${normalized.slice(3)}`;
  return `${normalized.slice(0, 3)} ${normalized.slice(3)}`;
}

/**
 * Checks if two phone numbers are the same after normalization
 */
export function phonesMatch(phone1: string, phone2: string): boolean {
  return normalizePhone(phone1) === normalizePhone(phone2);
}

/**
 * Validates phone number format (Italian mobile/landline)
 * Returns true if phone appears valid
 */
export function isValidPhone(phone: string): boolean {
  const normalized = normalizePhone(phone);
  // Italian phone numbers are typically 9-10 digits
  return normalized.length >= 9 && normalized.length <= 12;
}
