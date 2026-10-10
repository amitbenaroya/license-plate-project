// Types matching the official data.gov.il CKAN dataset:
// Resource: 053cea08-09bc-40ec-8f7a-156f0677aff3
// "Private and Commercial Vehicles" (כלי רכב פרטיים ומסחריים)

/** Raw vehicle record from the data.gov.il API */
export interface VehicleRawRecord {
  _id: number;
  mispar_rechev: number;
  tozeret_cd: number;
  sug_degem: string;
  tozeret_nm: string;
  degem_cd: number;
  degem_nm: string;
  ramat_gimur: string;
  ramat_eivzur_betihuty: number;
  kvutzat_zihum: number;
  shnat_yitzur: number;
  degem_manoa: string;
  mivchan_acharon_dt: string;
  tokef_dt: string;
  baalut: string;
  misgeret: string;
  tzeva_cd: number;
  tzeva_rechev: string;
  zmig_kidmi: string;
  zmig_ahori: string;
  sug_delek_nm: string;
  horaat_rishum: number;
  moed_aliya_lakvish: string;
  kinuy_mishari: string;
}

/** Processed vehicle info for display */
export interface VehicleInfo {
  licensePlate: string;
  manufacturer: string | null;
  model: string | null;
  commercialName: string | null;
  year: number | null;
  color: string | null;
  fuelType: string | null;
  ownership: string | null;
  engineModel: string | null;
  trimLevel: string | null;
  safetyLevel: number | null;
  pollutionGroup: number | null;
  frontTires: string | null;
  rearTires: string | null;
  lastTestDate: string | null;
  licenseValidUntil: string | null;
  chassisNumber: string | null;
  vehicleType: string | null;
  onRoadSince: string | null;
}

/** Search history entry stored in localStorage */
export interface SearchHistoryEntry {
  id: string;
  licensePlate: string;
  searchedAt: string; // ISO date string
  vehicleInfo: VehicleInfo | null;
  found: boolean;
}

/** API response wrapper from CKAN datastore_search */
export interface CKANResponse {
  success: boolean;
  result: {
    records: VehicleRawRecord[];
    total: number;
    fields: Array<{ id: string; type: string }>;
  };
}

/** Application error types */
export type AppErrorType =
  | 'NETWORK_ERROR'
  | 'API_ERROR'
  | 'NOT_FOUND'
  | 'RATE_LIMITED'
  | 'CORS_ERROR'
  | 'UNKNOWN';

export interface AppError {
  type: AppErrorType;
  message: string;
  retryable: boolean;
}
