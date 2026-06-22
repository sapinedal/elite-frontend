import api from '../../../lib/axios';
import type { FtraContractor, PaginatedContractorsResponse } from '../types';

export const contractorService = {
  getContractors: async (filters: Record<string, unknown> = {}): Promise<PaginatedContractorsResponse> => {
    const { data } = await api.get('/v1/ftra/contractors', { params: filters });
    return data;
  },

  getContractorById: async (id: number): Promise<FtraContractor> => {
    const { data } = await api.get(`/v1/ftra/contractors/${id}`);
    return data;
  },

  createContractor: async (contractorData: Partial<FtraContractor>): Promise<FtraContractor> => {
    const { data } = await api.post('/v1/ftra/contractors', contractorData);
    return data.contractor;
  },

  updateContractor: async (id: number, contractorData: Partial<FtraContractor>): Promise<FtraContractor> => {
    const { data } = await api.put(`/v1/ftra/contractors/${id}`, contractorData);
    return data.contractor;
  },

  deleteContractor: async (id: number): Promise<void> => {
    await api.delete(`/v1/ftra/contractors/${id}`);
  },
};
