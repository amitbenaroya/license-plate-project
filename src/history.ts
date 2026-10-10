import type { SearchHistoryEntry, VehicleInfo } from './types';

const HISTORY_KEY = 'il-vehicle-search-history';
const MAX_HISTORY = 50;

/**
 * Retrieves the search history from localStorage.
 */
export function getHistory(): SearchHistoryEntry[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch {
    return [];
  }
}

/**
 * Adds a successful search result to history.
 * Prevents duplicates for the same plate by replacing the existing entry.
 */
export function addToHistory(
  licensePlate: string,
  vehicleInfo: VehicleInfo | null,
  found: boolean
): void {
  // Only store entries for found vehicles
  if (!found) return;

  const history = getHistory();
  // Remove existing entry for the same plate
  const filtered = history.filter(
    (entry) => entry.licensePlate !== licensePlate
  );

  const newEntry: SearchHistoryEntry = {
    id: `${licensePlate}-${Date.now()}`,
    licensePlate,
    searchedAt: new Date().toISOString(),
    vehicleInfo,
    found,
  };

  // Add new entry at the beginning
  filtered.unshift(newEntry);

  // Trim to max size
  const trimmed = filtered.slice(0, MAX_HISTORY);

  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(trimmed));
  } catch {
    // localStorage might be full; silently fail
  }
}

/**
 * Clears all search history.
 */
export function clearHistory(): void {
  localStorage.removeItem(HISTORY_KEY);
}
