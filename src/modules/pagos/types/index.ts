export type PagoStatus = 'pendiente' | 'priorizada' | 'parcial' | 'pagada' | 'anulada';

export type PagoPriority = 'alta' | 'media' | 'baja';

export type PagoScope = 'por_priorizar' | 'programadas' | 'pagadas' | 'todas';

export type PagoSource = 'corte' | 'orden' | 'manual';

export interface PagoCatalogs {
  projects: { id: number; name: string }[];
  /** Secciones del cuadro: INDIRECTOS, TORRE 1, TORRE 2, URBANISMO... */
  frentes: string[];
  contractors: { id: number; name: string; nit: string | null }[];
  statuses: { key: PagoStatus; label: string }[];
  priorities: { key: PagoPriority; label: string }[];
  /** Próximo viernes: fecha sugerida de pago */
  next_payment_date: string;
  max_upload_mb: number;
  can_prioritize: boolean;
  can_pay: boolean;
  can_register: boolean;
}

export interface PagoMovimiento {
  id: number;
  action: 'creada' | 'priorizada' | 'desprogramada' | 'pago' | 'nota_credito' | 'reemplazo' | 'anulada';
  amount: number | null;
  payment_date: string | null;
  reference: string | null;
  comment: string | null;
  file_name: string | null;
  user: string | null;
  created_at: string;
}

export interface PagoCuenta {
  id: number;
  source_type: PagoSource;
  source_label: string;
  /** Código del corte u orden de origen */
  source_code: string | null;
  corte_id: number | null;
  orden_id: number | null;
  project: { id: number; name: string } | null;
  frente: string;
  supplier_nit: string | null;
  supplier_name: string;
  document_number: string;
  concept: string | null;
  amount: number;
  adjustments: number;
  paid_amount: number;
  balance: number;
  status: PagoStatus;
  status_label: string;
  priority: PagoPriority | null;
  priority_label: string | null;
  scheduled_for: string | null;
  prioritized_by: string | null;
  prioritized_at: string | null;
  paid_at: string | null;
  created_at: string;
  can_prioritize: boolean;
  can_pay: boolean;
  can_annul: boolean;
  // Solo en el detalle
  created_by?: string | null;
  movimientos?: PagoMovimiento[];
}

export interface PagoCuentaPayload {
  project_id: number | null;
  frente: string;
  contractor_id: number | null;
  supplier_nit: string | null;
  supplier_name: string | null;
  document_number: string;
  concept: string | null;
  amount: number;
}

export interface PagoPayPayload {
  amount: number;
  payment_date: string;
  reference: string | null;
  comment: string | null;
  upload_token: string | null;
}

export interface PagoFilters {
  search: string;
  project_id: string;
  frente: string;
  scheduled_for: string;
}

export interface PagoCounts {
  por_priorizar: number;
  programadas: number;
  pagadas: number;
}

export interface PagoPage {
  data: PagoCuenta[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}
