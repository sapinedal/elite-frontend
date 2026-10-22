import api from '../../../lib/axios';
import type {
  Contract,
  ContractDocument,
  ContractPayload,
  ContractTower,
  ContratacionAlerts,
  ContratacionCatalogs,
} from '../types';

const BASE = '/v1/contratacion';

export const contratacionService = {
  getCatalogs: async (): Promise<ContratacionCatalogs> => {
    const { data } = await api.get(`${BASE}/catalogs`);
    return data.data;
  },

  createTower: async (tower: { name: string; code?: string }): Promise<ContractTower> => {
    const { data } = await api.post(`${BASE}/towers`, tower);
    return data.data;
  },

  getAlerts: async (): Promise<ContratacionAlerts> => {
    const { data } = await api.get(`${BASE}/alerts`);
    return data.data;
  },

  getContracts: async (filters: Record<string, unknown> = {}): Promise<Contract[]> => {
    const { data } = await api.get(`${BASE}/contracts`, { params: filters });
    return data.data;
  },

  getContract: async (id: number): Promise<Contract> => {
    const { data } = await api.get(`${BASE}/contracts/${id}`);
    return data.data;
  },

  createContract: async (payload: ContractPayload): Promise<Contract> => {
    const { data } = await api.post(`${BASE}/contracts`, payload);
    return data.data;
  },

  updateContract: async (id: number, payload: ContractPayload): Promise<Contract> => {
    const { data } = await api.put(`${BASE}/contracts/${id}`, payload);
    return data.data;
  },

  deleteContract: async (id: number): Promise<void> => {
    await api.delete(`${BASE}/contracts/${id}`);
  },

  uploadDocuments: async (
    contractId: number,
    folder: string,
    files: File[],
    documentType?: string | null
  ): Promise<ContractDocument[]> => {
    const formData = new FormData();
    formData.append('folder', folder);
    if (documentType) formData.append('document_type', documentType);
    files.forEach((file) => formData.append('files[]', file));

    const { data } = await api.post(`${BASE}/contracts/${contractId}/documents`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data.data;
  },

  getDownloadUrl: async (documentId: number): Promise<string> => {
    const { data } = await api.get(`${BASE}/documents/${documentId}/download`);
    return data.data.download_url;
  },

  deleteDocument: async (documentId: number): Promise<void> => {
    await api.delete(`${BASE}/documents/${documentId}`);
  },
};

// Traductor central de errores (marca el error como manejado para no duplicar el toast global)
export { getErrorMessage as getApiErrorMessage } from '../../../lib/apiError';
