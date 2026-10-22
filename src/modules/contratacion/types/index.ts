export interface ContractTower {
  id: number;
  name: string;
  code?: string | null;
}

export interface ContractTypeOption {
  id: number;
  name: string;
}

export interface ContractPolicy {
  id?: number;
  policy_type: string;
  policy_number?: string | null;
  insurer?: string | null;
  expires_at: string;
  days_to_expire?: number;
  alert_sent_at?: string | null;
}

export interface MissingDocument {
  key: string;
  folder: string;
  label: string;
}

export interface ContractDocument {
  id: number;
  folder: string;
  document_type: string | null;
  name: string;
  size: number;
  mime_type: string | null;
  uploaded_by: string | null;
  created_at: string;
}

export interface Contract {
  id: number;
  project_id: number;
  tower_id: number | null;
  tower: ContractTower | null;
  contract_type_id: number | null;
  contract_type: ContractTypeOption | null;
  contract_code: string;
  consecutive: string;
  contractor_name: string;
  object: string;
  signed_at: string | null;
  start_act_date: string | null;
  estimated_end_date: string | null;
  status: string;
  s3_path: string | null;
  policies: ContractPolicy[];
  missing_documents: MissingDocument[];
  expiring_policies: ContractPolicy[];
  documents_count: number;
  created_at: string;
  // Solo en el detalle
  documents?: ContractDocument[];
  created_by?: string | null;
}

export interface ContractPayload {
  tower_id: number | null;
  contract_type_id: number | null;
  contract_code: string;
  consecutive: string;
  contractor_name: string;
  object: string;
  signed_at: string | null;
  start_act_date: string | null;
  estimated_end_date: string | null;
  status: string;
  policies: ContractPolicy[];
}

export interface CatalogFolder {
  key: string;
  name: string;
}

export interface ContratacionCatalogs {
  towers: ContractTower[];
  contract_types: ContractTypeOption[];
  statuses: string[];
  policy_types: string[];
  policy_alert_days: number;
  /** Tamaño máximo por archivo y por envío (MB) */
  max_upload_mb: number;
  folders: CatalogFolder[];
  legal_documents: { key: string; label: string }[];
  required_folders: string[];
}

export interface ContratacionAlerts {
  missing_documents: {
    contract_id: number;
    contract_code: string;
    contractor_name: string;
    missing: string[];
  }[];
  expiring_policies: (ContractPolicy & {
    contract_id: number;
    contract_code: string;
    contractor_name: string;
  })[];
  policy_alert_days: number;
}

export interface ContractFilters {
  search: string;
  tower_id: string;
  contract_type_id: string;
  status: string;
  alerts_only: boolean;
}
