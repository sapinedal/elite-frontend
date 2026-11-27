export type AnticipoStatus =
  | 'pendiente_director'
  | 'pendiente_gerencia'
  | 'devuelto'
  | 'pendiente_soporte'
  | 'pendiente_contabilidad'
  | 'pendiente_aprobacion_contable'
  | 'completado';

export type AnticipoStageKey = 'director_obra' | 'gerencia';

export type AnticipoScope = 'mine' | 'pending' | 'accounting' | 'accounting_approval' | 'all';

export interface AnticipoContractOption {
  id: number;
  contract_code: string;
  contractor_name: string;
  object: string;
  project_id: number;
  project: string | null;
  tower: string | null;
}

export interface AnticipoCatalogs {
  contracts: AnticipoContractOption[];
  projects: { id: number; name: string }[];
  contractors: { id: number; name: string; nit: string | null }[];
  max_upload_mb: number;
  /** Aprobaciones que el usuario puede dar */
  review_stages: AnticipoStageKey[];
  can_view_all: boolean;
  can_create: boolean;
  /** Contabilidad: genera el anticipo en Multifox y lo carga */
  can_contabilizar: boolean;
  /** Aprueba en Contabilidad los anticipos cargados en Multifox (anticipos.aprobar_contabilidad) */
  can_approve_accounting: boolean;
  stages: { key: AnticipoStageKey; label: string; status: AnticipoStatus }[];
  statuses: { key: AnticipoStatus; label: string }[];
}

export interface AnticipoProgressStep {
  key: string;
  label: string;
  kind: 'approval' | 'document';
  state: 'aprobado' | 'devuelto' | 'actual' | 'pendiente';
  user: string | null;
  at: string | null;
}

export interface AnticipoHistoryEntry {
  id: number;
  action: 'radicado' | 'aprobado' | 'devuelto' | 'reenviado' | 'soporte' | 'multifox' | 'contabilidad_aprobada' | 'contabilidad_devuelta' | 'eliminado' | 'legalizado';
  stage: string | null;
  stage_label: string | null;
  comment: string | null;
  file_name: string | null;
  user: string | null;
  created_at: string;
}

export interface Anticipo {
  id: number;
  /** ANT-0001 */
  code: string;
  contract_id: number;
  contract: { id: number; contract_code: string; contractor_name: string } | null;
  project_id: number;
  project: { id: number; name: string } | null;
  tower: { id: number; name: string } | null;
  contractor_id: number | null;
  contractor: { id: number; name: string; nit: string | null } | null;
  /** N.º de la cuenta de cobro */
  document_number: string;
  amount: number;
  description: string | null;
  status: AnticipoStatus;
  status_label: string;
  current_stage: AnticipoStageKey | null;
  current_stage_label: string | null;
  returned_stage_label: string | null;
  file_name: string;
  file_size: number;
  multifox_number: string | null;
  created_by: { id: number; name: string } | null;
  created_at: string;
  approved_at: string | null;
  multifox_at: string | null;
  can_review: boolean;
  can_resubmit: boolean;
  /** anticipos.eliminar: eliminar el anticipo cargado por error */
  can_delete?: boolean;
  /** Después de Gerencia, quien lo radicó adjunta el contrato u orden de compra */
  can_upload_support?: boolean;
  can_register_multifox: boolean;
  can_review_accounting: boolean;
  // Solo en el detalle
  storage_path?: string | null;
  support_file_name?: string | null;
  support_file_size?: number | null;
  support_by?: string | null;
  support_at?: string | null;
  multifox_file_name?: string | null;
  multifox_file_size?: number | null;
  multifox_by?: string | null;
  progress?: AnticipoProgressStep[];
  history?: AnticipoHistoryEntry[];
  /** Facturas de Facturas del mes que legalizan el anticipo */
  legalizaciones?: AnticipoLegalizacion[];
}

export interface AnticipoLegalizacion {
  id: number;
  document_type_label: string;
  document_number: string;
  amount: number | null;
  file_name: string;
  file_size: number | null;
  processed_by: string | null;
  processed_at: string | null;
}

export interface AnticipoPayload {
  contract_id: number;
  contractor_id: number;
  document_number: string;
  amount: number;
  description: string | null;
  /** Opcional al reenviar si se conserva la cuenta de cobro */
  upload_token?: string | null;
  comment?: string | null;
}

export interface MultifoxPayload {
  multifox_number: string;
  upload_token: string;
  comment: string | null;
}

export interface AnticipoFilters {
  search: string;
  status: string;
  project_id: string;
}

export interface AnticipoPage {
  data: Anticipo[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export interface AnticipoCounts {
  mine: number;
  pending: number;
  accounting: number;
  accounting_approval: number;
}

/** Contrato u orden de compra que adjunta el residente después de Gerencia */
export interface SupportPayload {
  upload_token: string;
  comment: string | null;
}
