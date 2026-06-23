export interface FtraFormat {
  id: number;
  name: string;
  code: string;
  version: string;
  description?: string;
  pdf_path?: string;
  pdf_url?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface FtraContractor {
  id: number;
  name: string;
  nit?: string;
  email?: string;
  phone?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Residente {
  id: number;
  name: string;
  email: string;
  role: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface FtraRecordPhoto {
  id: number;
  ftra_record_id: number;
  photo_path: string;
  photo_url: string;
}

export type FtraRecordStatus = 'Registrada' | 'Seguimiento' | 'Aprobada' | 'Rechazada';

export interface FtraRecord {
  id: number;
  contractor_id: number;
  contractor?: FtraContractor;
  format_id: number;
  format?: FtraFormat;
  responsable_id?: number;
  responsable?: Residente;
  resultado_inspeccion: 'Rechazado' | 'Recibido con observación' | 'Recibido a satisfacción';
  orden_aseo: 'Aprobado' | 'Rechazado';
  piso?: string;
  apartamento?: string;
  observations?: string;
  director_signature?: string;
  supervisor_signature?: string;
  is_completed: boolean;
  status: FtraRecordStatus;
  registered_by_id: number;
  registered_by?: { id: number; name: string };
  photos?: FtraRecordPhoto[];
  contractor_signature?: string;
  resident_signature?: string;
  created_at: string;
  updated_at: string;
}

export interface PaginatedFormatsResponse {
  data: FtraFormat[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export interface PaginatedContractorsResponse {
  data: FtraContractor[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export interface PaginatedResidentesResponse {
  data: Residente[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export interface PaginatedFtraRecordsResponse {
  data: FtraRecord[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}
