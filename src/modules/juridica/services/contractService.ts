import api from '../../../lib/axios';

export interface PolicyData {
  policy_number: string;
  insurance_company: string;
  insured_value: number;
  end_date: string;
}

export interface ContractData {
  id: number;
  nro: string;
  contractor_name_raw: string;
  type: string;
  category: 'torre2' | 'urbanismo';
  object: string;
  amount: number;
  status: 'Vigente' | 'Por Vencer' | 'En Trámite';
  drive_link: string;
  policies?: PolicyData[];
}

export interface ContractKpisData {
  total_contracts: number;
  total_amount: number;
  torre2_count: number;
  urbanismo_count: number;
  alerts_count: number;
  presupuesto_total: number;
  ejecutado_fisico: number;
  saldo_ejecutar: number;
  fecha_entrega: string;
}

export const contractService = {
  getContracts: async (category?: string, search?: string): Promise<ContractData[]> => {
    const response = await api.get('/v1/juridica/contracts', {
      params: { category, search }
    });
    return response.data.data;
  },

  getKpis: async (): Promise<ContractKpisData> => {
    const response = await api.get('/v1/juridica/contracts/kpis');
    return response.data.data;
  },

  getFolderFiles: async (folderId: string) => {
    const response = await api.get(`/v1/juridica/drive/folders/${folderId}`);
    return response.data;
  }
};
