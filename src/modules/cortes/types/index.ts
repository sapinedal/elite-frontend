export type CorteStatus =
  | 'pendiente_interventor'
  | 'pendiente_director'
  | 'pendiente_gerencia'
  | 'devuelto'
  | 'aprobado';

export type CorteStageKey = 'interventor' | 'director_obra' | 'gerencia';

export type CorteScope = 'mine' | 'pending' | 'all';

export interface CorteProjectOption {
  id: number;
  name: string;
  towers: { id: number; name: string }[];
}

export interface CorteContractOption {
  id: number;
  project_id: number;
  tower_id: number | null;
  contract_code: string;
  contractor_name: string;
}

export interface CorteCatalogs {
  projects: CorteProjectOption[];
  contractors: { id: number; name: string; nit: string | null }[];
  contracts: CorteContractOption[];
  max_upload_mb: number;
  /** Etapas que el usuario puede revisar */
  review_stages: CorteStageKey[];
  can_view_all: boolean;
  stages: { key: CorteStageKey; label: string; status: CorteStatus }[];
  statuses: { key: CorteStatus; label: string }[];
}

export interface CorteProgressStep {
  key: CorteStageKey;
  label: string;
  state: 'aprobado' | 'devuelto' | 'actual' | 'pendiente';
  user: string | null;
  at: string | null;
}

export interface CorteHistoryEntry {
  id: number;
  action: 'radicado' | 'aprobado' | 'devuelto' | 'reenviado';
  stage: CorteStageKey | null;
  stage_label: string | null;
  comment: string | null;
  file_name: string | null;
  user: string | null;
  created_at: string;
}

export interface Corte {
  id: number;
  code: string;
  project_id: number;
  project: { id: number; name: string } | null;
  tower_id: number | null;
  tower: { id: number; name: string } | null;
  contractor_id: number | null;
  contractor: { id: number; name: string; nit: string | null } | null;
  contract_id: number | null;
  contract: { id: number; contract_code: string } | null;
  status: CorteStatus;
  status_label: string;
  current_stage: CorteStageKey | null;
  current_stage_label: string | null;
  returned_stage_label: string | null;
  file_name: string;
  file_size: number;
  created_by: { id: number; name: string } | null;
  created_at: string;
  updated_at: string;
  approved_at: string | null;
  can_review: boolean;
  can_resubmit: boolean;
  // Solo en el detalle
  progress?: CorteProgressStep[];
  history?: CorteHistoryEntry[];
}

export interface CortePayload {
  code: string;
  project_id: number;
  tower_id: number | null;
  contractor_id: number;
  contract_id: number;
  /** Token devuelto al subir el archivo a S3 (opcional al reenviar si se conserva el archivo) */
  upload_token?: string | null;
  comment?: string | null;
}

export interface CorteFilters {
  search: string;
  status: string;
  project_id: string;
}

export interface CortePage {
  data: Corte[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export interface CorteCounts {
  mine: number;
  pending: number;
}
