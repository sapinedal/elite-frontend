export type FacturaDocumentType = 'factura' | 'cuenta_cobro' | 'nota_credito' | 'factura_reemplazo';

export type FacturaStatus = 'pendiente' | 'procesada';

export type FacturaScope = 'pending' | 'processed' | 'all';

export interface ContractorOption {
  id: number;
  name: string;
  nit: string | null;
}

export interface FacturacionCatalogs {
  periods: { value: string; label: string }[];
  current_period: string;
  contractors: ContractorOption[];
  document_types: { key: FacturaDocumentType; label: string; prefix: string }[];
  statuses: { key: FacturaStatus; label: string }[];
  max_upload_mb: number;
  s3_root: string;
  /** Contabilidad (cortes.facturar): carga facturas y ve el panel */
  can_manage: boolean;
  /** Residente (cortes.crear / ordenes.crear): asocia facturas a sus cortes y órdenes */
  can_associate: boolean;
}

export interface Factura {
  id: number;
  period: string;
  period_label: string;
  document_type: FacturaDocumentType;
  document_type_label: string;
  /** "FE 335", "C-C 15102026" */
  document_number: string;
  invoice_number: string;
  related_document: string | null;
  supplier_name: string;
  contractor: ContractorOption | null;
  amount: number | null;
  observation: string | null;
  file_name: string;
  file_size: number;
  uploaded_by: string | null;
  created_at: string;
  days_pending: number | null;
  status: FacturaStatus;
  status_label: string;
  target: { type: 'corte' | 'orden'; id: number; code: string | null; label: string } | null;
  processed_by: string | null;
  processed_at: string | null;
  processed_comment: string | null;
  supports: { id: number; file_name: string; file_size: number }[];
  /** Pendiente de un proveedor con cortes del residente esperando factura */
  suggested: boolean;
  can_edit: boolean;
  can_associate: boolean;
}

export interface FacturaPayload {
  period: string;
  document_type: FacturaDocumentType;
  invoice_number: string;
  contractor_id: number | null;
  supplier_name: string | null;
  related_document: string | null;
  amount: number | null;
  observation: string | null;
  /** Solo al cargar */
  upload_token?: string;
}

export interface CorteTarget {
  id: number;
  code: string;
  /** "CORTE 3" o "Corte 6634" */
  label: string;
  status: string;
  status_label: string;
  project: string | null;
  tower: string | null;
  contractor_id: number | null;
  contractor: string | null;
  contract_code: string | null;
  invoices_count: number;
  approved_at: string | null;
}

export interface OrdenTarget {
  id: number;
  code: string;
  description: string;
  project: string | null;
  tower: string | null;
  approved_at: string | null;
}

export interface FacturaTargets {
  cortes: CorteTarget[];
  ordenes: OrdenTarget[];
}

export interface AssociatePayload {
  target_type: 'corte' | 'orden';
  target_id: number;
  amount: number | null;
  contractor_id: number | null;
  comment: string | null;
  support_tokens: string[];
}

export interface FacturaPage {
  data: Factura[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export interface FacturaCounts {
  pending: number;
  /** Pendientes de proveedores con cortes del usuario esperando factura */
  suggested: number;
}

export interface PanelWaitingItem {
  id: number;
  code: string;
  project: string | null;
  approved_at: string | null;
  days_waiting: number | null;
}

export interface FacturacionPanelData {
  period: string;
  period_label: string;
  folder: string;
  summary: {
    total: number;
    processed: number;
    pending: number;
    total_amount: number;
    pending_amount: number;
    pending_previous: number;
    cortes_waiting: number;
    ordenes_waiting: number;
  };
  pending_by_supplier: { supplier: string; count: number; amount: number; oldest_days: number | null; documents: string[] }[];
  residentes: {
    id: number;
    name: string;
    email: string;
    processed_in_period: number;
    cortes: (PanelWaitingItem & { label: string; contractor: string | null; contract_code: string | null })[];
    ordenes: (PanelWaitingItem & { description: string })[];
  }[];
}
