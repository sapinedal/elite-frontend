import api from '../../../lib/axios';
import type { FtraContractor, PaginatedContractorsResponse } from '../types';

/** Solo consulta: los proveedores se crean en Contratación. */
export const contractorService = {
  getContractors: async (filters: Record<string, unknown> = {}): Promise<PaginatedContractorsResponse> => {
    const { data } = await api.get('/v1/ftra/contractors', { params: filters });
    return data;
  },

  getContractorById: async (id: number): Promise<FtraContractor> => {
    const { data } = await api.get(`/v1/ftra/contractors/${id}`);
    return data;
  },
};
