import api from '../../../lib/axios';
import type { FtraRecord, PaginatedFtraRecordsResponse } from '../types';

export const ftraRecordService = {
  getRecords: async (filters: Record<string, unknown> = {}): Promise<PaginatedFtraRecordsResponse> => {
    const { data } = await api.get('/v1/ftra/records', { params: filters });
    return data;
  },

  getRecordById: async (id: number): Promise<FtraRecord> => {
    const { data } = await api.get(`/v1/ftra/records/${id}`);
    return data;
  },

  createRecord: async (formData: FormData): Promise<FtraRecord> => {
    const { data } = await api.post('/v1/ftra/records', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return data.record;
  },

  updateRecord: async (id: number, formData: FormData): Promise<FtraRecord> => {
    const { data } = await api.post(`/v1/ftra/records/${id}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return data.record;
  },

  updateStatus: async (id: number, status: string): Promise<FtraRecord> => {
    const { data } = await api.put(`/v1/ftra/records/${id}/status`, { status });
    return data.record;
  },

  deleteRecord: async (id: number): Promise<void> => {
    await api.delete(`/v1/ftra/records/${id}`);
  },
};
