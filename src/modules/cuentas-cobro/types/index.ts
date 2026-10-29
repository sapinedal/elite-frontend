export type CuentaCobroStatus =
  | 'pendiente_director'
  | 'pendiente_gerencia'
  | 'devuelta'
  | 'pendiente_revision'
  | 'pendiente_multifox'
  | 'en_pagos';

export type CuentaCobroStageKey = 'director_obra' | 'gerencia';

export type CuentaCobroScope = 'mine' | 'pending' | 'multifox' | 'all';

export interface CuentaCobroTipo {
  id: number;
  name: string;
  description: string | null;
  /** Exige adjuntos además de la cuenta de cobro (ej. SST, Gestión ambiental) */
  requires_attachment: boolean;
  attachment_hint: string | null;
  is_active?: boolean;
  cuentas_count?: number | null;
}

export interface CuentaCobroCatalogs {
  tipos: CuentaCobroTipo[];
  projects: { id: number; name: string; towers: { id: number; name: string }[] }[];
  contracts: { id: number; project_id: number; contract_code: string; contractor_name: string }[];
  contractors: { id: number; name: string; nit: string | null }[];
  max_upload_mb: number;
  review_stages: CuentaCobroStageKey[];
  can_view_all: boolean;
  can_create: boolean;
  /** Paula: decide si requiere Multifox y la carga */
  can_handle_multifox: boolean;
  /** CRUD de tipos */
  can_parametrize: boolean;
  stages: { key: CuentaCobroStageKey; label: string; status: CuentaCobroStatus }[];
  statuses: { key: CuentaCobroStatus; label: string }[];
}

export interface CuentaCobroProgressStep {
  key: string;
  label: string;
  kind: 'approval' | 'document';
  state: 'aprobado' | 'devuelto' | 'actual' | 'pendiente';
  user: string | null;
  at: string | null;
}

export interface CuentaCobroHistoryEntry {
  id: number;
  action: 'radicada' | 'aprobado' | 'devuelto' | 'reenviada' | 'sin_multifox' | 'requiere_multifox' | 'multifox';
  stage: string | null;
  stage_label: string | null;
  comment: string | null;
  file_name: string | null;
  user: string | null;
  created_at: string;
}

export interface CuentaCobro {
  id: number;
  /** CC-0001 */
  code: string;
  tipo_id: number;
  tipo: (Pick<CuentaCobroTipo, 'id' | 'name' | 'requires_attachment'> & { attachment_hint?: string | null }) | null;
  project_id: number;
  project: { id: number; name: string } | null;
  tower_id: number | null;
  tower: { id: number; name: string } | null;
  contract_id: number | null;
  contract: { id: number; contract_code: string } | null;
  contractor_id: number | null;
  contractor: { id: number; name: string; nit: string | null } | null;
  document_number: string;
  amount: number;
  description: string | null;
  status: CuentaCobroStatus;
  status_label: string;
  current_stage: CuentaCobroStageKey | null;
  current_stage_label: string | null;
  returned_stage_label: string | null;
  /** null mientras Paula no decide */
  requires_multifox: boolean | null;
  multifox_number: string | null;
  file_name: string;
  file_size: number;
  adjuntos_count: number | null;
  created_by: { id: number; name: string } | null;
  created_at: string;
  approved_at: string | null;
  completed_at: string | null;
  can_review: boolean;
  can_resubmit: boolean;
  can_handle_multifox: boolean;
  // Solo en el detalle
  adjuntos?: { id: number; file_name: string; file_size: number; uploaded_by: string | null; created_at: string }[];
  multifox_file_name?: string | null;
  multifox_file_size?: number | null;
  multifox_by?: string | null;
  multifox_decided_by?: string | null;
  progress?: CuentaCobroProgressStep[];
  history?: CuentaCobroHistoryEntry[];
}

export interface CuentaCobroPayload {
  tipo_id: number;
  project_id: number;
  tower_id: number | null;
  contract_id: number | null;
  contractor_id: number;
  document_number: string;
  amount: number;
  description: string | null;
  upload_token?: string | null;
  attachment_tokens: string[];
  comment?: string | null;
}

export interface CuentaCobroMultifoxPayload {
  multifox_number: string;
  upload_token: string | null;
  comment: string | null;
}

export interface CuentaCobroTipoPayload {
  name: string;
  description: string | null;
  requires_attachment: boolean;
  attachment_hint: string | null;
  is_active: boolean;
}

export interface CuentaCobroFilters {
  search: string;
  status: string;
  project_id: string;
  tipo_id: string;
}

export interface CuentaCobroPage {
  data: CuentaCobro[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export interface CuentaCobroCounts {
  mine: number;
  pending: number;
  multifox: number;
}
