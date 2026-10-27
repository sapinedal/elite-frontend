export type OrdenStatus =
  | 'pendiente_director'
  | 'pendiente_gerencia'
  | 'devuelto'
  | 'pendiente_erp'
  | 'pendiente_factura'
  | 'pendiente_entrada'
  | 'completada';

export type OrdenStageKey = 'director_obra' | 'gerencia';

/** Documentos que se cargan después de la aprobación, en orden */
export type OrdenStepKey = 'orden_erp' | 'factura' | 'entrada';

export type OrdenScope = 'mine' | 'pending' | 'tasks' | 'all';

export interface OrdenProjectOption {
  id: number;
  name: string;
  towers: { id: number; name: string }[];
}

export interface OrdenCatalogs {
  projects: OrdenProjectOption[];
  /** Capítulos y actividades ya usados, como sugerencias */
  chapters: string[];
  activities: string[];
  /** Proveedores, para la factura del proveedor */
  contractors: { id: number; name: string; nit: string | null }[];
  max_upload_mb: number;
  /** Aprobaciones que el usuario puede hacer */
  review_stages: OrdenStageKey[];
  /** Documentos que el usuario puede cargar (Almacén / Facturación) */
  task_steps: OrdenStepKey[];
  can_view_all: boolean;
  can_create: boolean;
  stages: { key: OrdenStageKey; label: string; status: OrdenStatus }[];
  steps: { key: OrdenStepKey; label: string; responsible: string; status: OrdenStatus; number_label: string }[];
  statuses: { key: OrdenStatus; label: string }[];
}

export interface OrdenProgressStep {
  key: OrdenStageKey | OrdenStepKey;
  label: string;
  kind: 'approval' | 'document';
  state: 'aprobado' | 'devuelto' | 'actual' | 'pendiente';
  user: string | null;
  at: string | null;
}

export interface OrdenHistoryEntry {
  id: number;
  action: 'registrada' | 'aprobado' | 'devuelto' | 'reenviada' | 'documento';
  stage: string | null;
  stage_label: string | null;
  comment: string | null;
  file_name: string | null;
  user: string | null;
  created_at: string;
}

export interface OrdenDocument {
  id: number;
  step: OrdenStepKey;
  step_label: string;
  number_label: string;
  number: string;
  amount: number | null;
  contractor: { id: number; name: string; nit: string | null } | null;
  observation: string | null;
  file_name: string;
  file_size: number;
  uploaded_by: string | null;
  created_at: string;
}

export interface Orden {
  id: number;
  code: string;
  description: string;
  project_id: number;
  project: { id: number; name: string } | null;
  tower_id: number | null;
  tower: { id: number; name: string } | null;
  chapter: string;
  activity: string;
  status: OrdenStatus;
  status_label: string;
  current_stage: OrdenStageKey | null;
  current_stage_label: string | null;
  current_step: OrdenStepKey | null;
  current_step_label: string | null;
  current_step_number_label: string | null;
  returned_stage_label: string | null;
  created_by: { id: number; name: string } | null;
  created_at: string;
  updated_at: string;
  approved_at: string | null;
  completed_at: string | null;
  can_review: boolean;
  can_resubmit: boolean;
  can_upload_step: boolean;
  // Solo en el detalle
  progress?: OrdenProgressStep[];
  history?: OrdenHistoryEntry[];
  documents?: OrdenDocument[];
}

export interface OrdenPayload {
  description: string;
  project_id: number;
  tower_id: number | null;
  chapter: string;
  activity: string;
  comment?: string | null;
}

export interface OrdenDocumentPayload {
  number: string;
  observation: string | null;
  /** Solo en la factura del proveedor: pasan a cuentas por pagar */
  amount?: number | null;
  contractor_id?: number | null;
  upload_token: string;
}

export interface OrdenFilters {
  search: string;
  status: string;
  project_id: string;
}

export interface OrdenPage {
  data: Orden[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export interface OrdenCounts {
  mine: number;
  pending: number;
  tasks: number;
}
