export interface Tower {
  id: number;
  project_id: number;
  name: string;
  code?: string;
  description?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ContractType {
  id: number;
  name: string;
  code?: string;
  description?: string;
  is_active?: boolean;
}

export interface CreateContractTypeDTO {
  name: string;
  code?: string;
  description?: string;
}

export interface Policy {
  id?: number;
  contract_id?: number;
  policy_number: string;
  insurance_company: string;
  insured_value: number;
  start_date?: string;
  end_date: string;
}

export interface Contract {
  id: number;
  nro: string;
  project_id?: number | null;
  tower_id?: number | null;
  contract_type_id?: number | null;
  contractor_id?: number | null;
  contractor_name_raw: string;
  type: string;
  category: string;
  object: string;
  amount: number;
  status: 'Vigente' | 'Por Vencer' | 'En Trámite';
  drive_link: string;
  policy?: Policy | null;
  policies?: Policy[];
  project?: { id: number; name: string; code: string };
  tower?: { id: number; name: string; code?: string };
  contract_type?: ContractType;
  created_at?: string;
  updated_at?: string;
}

export interface CreateContractDTO {
  nro: string;
  project_id?: number | null;
  tower_id?: number | null;
  contract_type_id?: number | null;
  contractor_id?: number | null;
  contractor_name_raw: string;
  type: string;
  category?: string;
  object?: string;
  amount?: number;
  status?: 'Vigente' | 'Por Vencer' | 'En Trámite';
  drive_link?: string;
  policy?: {
    policy_number: string;
    insurance_company: string;
    insured_value?: number;
    end_date?: string;
  } | null;
}

export interface UpdateContractDTO extends Partial<CreateContractDTO> {}

export interface CreateTowerDTO {
  name: string;
  code?: string;
  description?: string;
}
