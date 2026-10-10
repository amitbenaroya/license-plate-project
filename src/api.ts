import type { VehicleRawRecord, VehicleInfo, CKANResponse, AppError } from './types';

const API_BASE = 'https://data.gov.il/api/3/action/datastore_search';
const RESOURCE_ID = '053cea08-09bc-40ec-8f7a-156f0677aff3';

/**
 * Transforms a raw API record into a clean VehicleInfo object.
 * Handles null, empty, and missing fields gracefully.
 */
function transformRecord(raw: VehicleRawRecord, plateQuery: string): VehicleInfo {
  const str = (val: unknown): string | null => {
    if (val === null || val === undefined || val === '') return null;
    const s = String(val).trim();
    return s || null;
  };

  const num = (val: unknown): number | null => {
    if (val === null || val === undefined) return null;
    const n = Number(val);
    return Number.isFinite(n) ? n : null;
  };

  return {
    licensePlate: plateQuery,
    manufacturer: str(raw.tozeret_nm),
    model: str(raw.degem_nm),
    commercialName: str(raw.kinuy_mishari),
    year: num(raw.shnat_yitzur),
    color: str(raw.tzeva_rechev),
    fuelType: str(raw.sug_delek_nm),
    ownership: str(raw.baalut),
    engineModel: str(raw.degem_manoa),
    trimLevel: str(raw.ramat_gimur),
    safetyLevel: num(raw.ramat_eivzur_betihuty),
    pollutionGroup: num(raw.kvutzat_zihum),
    frontTires: str(raw.zmig_kidmi),
    rearTires: str(raw.zmig_ahori),
    lastTestDate: str(raw.mivchan_acharon_dt),
    licenseValidUntil: str(raw.tokef_dt),
    chassisNumber: str(raw.misgeret),
    vehicleType: str(raw.sug_degem),
    onRoadSince: str(raw.moed_aliya_lakvish),
  };
}

/**
 * Classifies an error into a typed AppError with a user-friendly message.
 */
function classifyError(error: unknown): AppError {
  if (error instanceof TypeError && 'message' in error) {
    const msg = error.message.toLowerCase();
    if (msg.includes('failed to fetch') || msg.includes('networkerror')) {
      return {
        type: 'NETWORK_ERROR',
        message: 'Unable to connect to the server. Please check your internet connection and try again.',
        retryable: true,
      };
    }
    if (msg.includes('cors') || msg.includes('access-control')) {
      return {
        type: 'CORS_ERROR',
        message: 'The request was blocked by the browser. This may be a temporary server issue — please try again.',
        retryable: true,
      };
    }
  }

  return {
    type: 'UNKNOWN',
    message: 'An unexpected error occurred. Please try again.',
    retryable: true,
  };
}

/**
 * Searches for a vehicle by license plate number using the official
 * data.gov.il CKAN API (Ministry of Transport dataset).
 *
 * Uses the `filters` parameter for exact match on `mispar_rechev`.
 */
export async function lookupVehicle(
  plateNumber: string,
  signal?: AbortSignal
): Promise<VehicleInfo> {
  const params = new URLSearchParams({
    resource_id: RESOURCE_ID,
    filters: JSON.stringify({ mispar_rechev: plateNumber }),
    limit: '1',
  });

  let response: Response;
  try {
    response = await fetch(`${API_BASE}?${params}`, { signal });
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw { type: 'UNKNOWN', message: 'Request was cancelled.', retryable: false } as AppError;
    }
    throw classifyError(err);
  }

  if (response.status === 429) {
    throw {
      type: 'RATE_LIMITED',
      message: 'Too many requests. Please wait a moment and try again.',
      retryable: true,
    } as AppError;
  }

  if (!response.ok) {
    throw {
      type: 'API_ERROR',
      message: `The server returned an error (${response.status}). Please try again later.`,
      retryable: true,
    } as AppError;
  }

  let data: CKANResponse;
  try {
    data = await response.json();
  } catch {
    throw {
      type: 'API_ERROR',
      message: 'Received an invalid response from the server. Please try again.',
      retryable: true,
    } as AppError;
  }

  if (!data.success || !data.result?.records?.length) {
    throw {
      type: 'NOT_FOUND',
      message: 'No vehicle found with this license plate number. The vehicle may not be in the active registry.',
      retryable: false,
    } as AppError;
  }

  return transformRecord(data.result.records[0], plateNumber);
}
