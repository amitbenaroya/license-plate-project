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
 * Returns the ID of the newly created entry.
 */
export function addToHistory(
  licensePlate: string,
  vehicleInfo: VehicleInfo | null,
  found: boolean
): string | null {
  // Only store entries for found vehicles
  if (!found) return null;

  const history = getHistory();
  // Remove existing entry for the same plate
  const filtered = history.filter(
    (entry) => entry.licensePlate !== licensePlate
  );

  const newId = `${licensePlate}-${Date.now()}`;
  const newEntry: SearchHistoryEntry = {
    id: newId,
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
    return newId;
  } catch {
    // localStorage might be full; silently fail
    return null;
  }
}

/**
 * Updates an existing history entry with location data.
 */
export function updateHistoryLocation(
  id: string,
  location: { lat: number; lng: number; accuracy: number }
): void {
  const history = getHistory();
  const index = history.findIndex((entry) => entry.id === id);
  if (index === -1) return;

  history[index].location = location;

  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  } catch {
    // silently fail
  }
}

/**
 * Deletes a single history record.
 */
export function deleteHistoryRecord(id: string): void {
  const history = getHistory();
  const filtered = history.filter((entry) => entry.id !== id);
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(filtered));
  } catch {
    // silently fail
  }
}

/**
 * Clears all search history.
 */
export function clearHistory(): void {
  localStorage.removeItem(HISTORY_KEY);
}
