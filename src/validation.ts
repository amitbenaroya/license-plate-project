/**
 * Israeli license plate validation utilities.
 *
 * Valid Israeli plate formats (digits only):
 * - 5 digits: older plates (motorcycles, some old vehicles)
 * - 6 digits: older plates (pre-2019)
 * - 7 digits: standard plates (used since ~2000)
 * - 8 digits: newer plates (introduced ~2019)
 */

const VALID_LENGTHS = [5, 6, 7, 8];

/** Strips all non-digit characters from input */
export function sanitizePlateInput(input: string): string {
  return input.replace(/\D/g, '');
}

/** Checks if a plate number has a valid Israeli format */
export function isValidPlate(plate: string): boolean {
  if (!plate) return false;
  if (!/^\d+$/.test(plate)) return false;
  return VALID_LENGTHS.includes(plate.length);
}

/** Returns a human-readable validation error, or null if valid */
export function getValidationError(plate: string): string | null {
  if (!plate) return 'Please enter a license plate number.';
  if (!/^\d+$/.test(plate)) return 'License plate must contain only digits.';
  if (!VALID_LENGTHS.includes(plate.length)) {
    return `License plate must be 5–8 digits. You entered ${plate.length}.`;
  }
  return null;
}

/** Formats a plate number for display (e.g., 1234567 → 12-345-67) */
export function formatPlateDisplay(plate: string): string {
  const digits = sanitizePlateInput(plate);
  if (digits.length === 8) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 5)}-${digits.slice(5)}`;
  }
  if (digits.length === 7) {
    return `${digits.slice(0, 2)}-${digits.slice(2, 5)}-${digits.slice(5)}`;
  }
  if (digits.length === 6) {
    return `${digits.slice(0, 2)}-${digits.slice(2, 5)}-${digits.slice(5)}`;
  }
  return digits;
}
