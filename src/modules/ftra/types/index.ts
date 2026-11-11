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

/** Torre del proyecto con su distribución (Administración › Proyectos). Aptos = piso × 100 + consecutivo. */
export interface FtraTower {
  id: number;
  project_id: number;
  name: string;
  code?: string | null;
  floors: number | null;
  apartments_per_floor: number | null;
}

/** Residente responsable: el usuario de Elite que registró el FTRA. */
export interface FtraResponsable {
  id: number;
  name: string;
  email: string;
  position?: { id: number; name: string } | null;
}

/** Por apartamento, el último FTRA de cada formato, para la semaforización. */
export interface FtraUnitStatus {
  apartamento: string;
  piso: string;
  records_count: number;
  formats: {
    format_id: number;
    record_id: number;
    status: FtraRecordStatus;
    resultado_inspeccion: FtraRecord['resultado_inspeccion'] | null;
    contractor: string | null;
    created_at: string;
  }[];
}

export interface FtraRecordPhoto {
  id: number;
  ftra_record_id: number;
  photo_path: string;
  photo_url: string;
}

/** Registrada = pendiente del Supervisor · Seguimiento = pendiente del Director · Aprobada = fin · Devuelta = al residente */
export type FtraRecordStatus = 'Registrada' | 'Seguimiento' | 'Aprobada' | 'Devuelta' | 'Rechazada';

export type FtraStage = 'supervisor' | 'director_obra';

export const FTRA_STATUS_LABELS: Record<FtraRecordStatus, string> = {
  Registrada: 'Pendiente Supervisor',
  Seguimiento: 'Pendiente Director',
  Aprobada: 'Aprobado',
  Devuelta: 'Devuelto',
  Rechazada: 'Rechazado',
};

export interface FtraProgressStep {
  key: FtraStage;
  label: string;
  state: 'aprobado' | 'devuelto' | 'actual' | 'pendiente';
  user: string | null;
}

export interface FtraHistoryEntry {
  id: number;
  action: 'registrado' | 'reenviado' | 'aprobado' | 'devuelto';
  stage: FtraStage | null;
  comment: string | null;
  created_at: string;
  user?: { id: number; name: string } | null;
}

export interface FtraRecord {
  id: number;
  contractor_id: number;
  contractor?: FtraContractor;
  format_id: number;
  format?: FtraFormat;
  tower_id?: number | null;
  tower?: { id: number; name: string; code?: string | null } | null;
  responsable_user_id?: number | null;
  responsable?: FtraResponsable | null;
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
  supervisor_user?: { id: number; name: string } | null;
  supervisor_at?: string | null;
  director_user?: { id: number; name: string } | null;
  director_at?: string | null;
  history?: FtraHistoryEntry[];
  /** Solo en el detalle (GET /records/{id}) y en las respuestas de las acciones */
  current_stage?: FtraStage | null;
  progress?: FtraProgressStep[];
  can?: { review: boolean; resubmit: boolean; edit: boolean };
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

export interface PaginatedFtraRecordsResponse {
  data: FtraRecord[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}
