import type { VehicleInfo } from './types';

/**
 * Maps Hebrew vehicle type codes to readable labels
 */
const vehicleTypeLabels: Record<string, string> = {
  P: 'Private',
  M: 'Commercial',
};

/**
 * Returns a display-friendly label for a field value.
 * Falls back to a dash for missing data.
 */
export function displayValue(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === '') return '—';
  return String(value);
}

/**
 * Returns the vehicle type label for a code
 */
export function getVehicleTypeLabel(code: string | null): string {
  if (!code) return '—';
  return vehicleTypeLabels[code] || code;
}

/**
 * Returns a one-line vehicle summary for history entries
 */
export function getVehicleSummary(info: VehicleInfo | null): string {
  if (!info) return 'No details available';

  const parts: string[] = [];

  if (info.commercialName) {
    parts.push(info.commercialName);
  } else {
    if (info.manufacturer) parts.push(info.manufacturer);
    if (info.model) parts.push(info.model);
  }

  if (info.year) parts.push(`(${info.year})`);
  if (info.color) parts.push(`• ${info.color}`);

  return parts.join(' ') || 'No details available';
}

/**
 * Formats a date string for display.
 * Input: ISO date string (e.g., "2024-10-07")
 * Output: Localized date string
 */
export function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—';
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    return date.toLocaleDateString('en-IL', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

/**
 * Formats a search timestamp for history display
 */
export function formatSearchTime(isoString: string): string {
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return isoString;
    return date.toLocaleString('en-IL', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return isoString;
  }
}
