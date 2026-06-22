import api from '../../../lib/axios';
import type { FtraFormat, PaginatedFormatsResponse } from '../types';

export const formatService = {
  getFormats: async (filters: Record<string, unknown> = {}): Promise<PaginatedFormatsResponse> => {
    const { data } = await api.get('/v1/ftra/formats', { params: filters });
    return data;
  },

  getFormatById: async (id: number): Promise<FtraFormat> => {
    const { data } = await api.get(`/v1/ftra/formats/${id}`);
    return data;
  },

  createFormat: async (formData: FormData): Promise<FtraFormat> => {
    const { data } = await api.post('/v1/ftra/formats', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return data.format;
  },

  updateFormat: async (id: number, formData: FormData): Promise<FtraFormat> => {
    // Usamos POST en lugar de PUT para enviar archivos con multipart/form-data en Laravel
    const { data } = await api.post(`/v1/ftra/formats/${id}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return data.format;
  },

  deleteFormat: async (id: number): Promise<void> => {
    await api.delete(`/v1/ftra/formats/${id}`);
  },
};
