import api from '../../../lib/axios';
import type { Residente, PaginatedResidentesResponse } from '../types';

export const residenteService = {
  getResidentes: async (filters: Record<string, unknown> = {}): Promise<PaginatedResidentesResponse> => {
    const { data } = await api.get('/v1/ftra/residentes', { params: filters });
    return data;
  },

  getResidenteById: async (id: number): Promise<Residente> => {
    const { data } = await api.get(`/v1/ftra/residentes/${id}`);
    return data;
  },

  createResidente: async (residenteData: Partial<Residente>): Promise<Residente> => {
    const { data } = await api.post('/v1/ftra/residentes', residenteData);
    return data.residente;
  },

  updateResidente: async (id: number, residenteData: Partial<Residente>): Promise<Residente> => {
    const { data } = await api.put(`/v1/ftra/residentes/${id}`, residenteData);
    return data.residente;
  },

  deleteResidente: async (id: number): Promise<void> => {
    await api.delete(`/v1/ftra/residentes/${id}`);
  },
};
