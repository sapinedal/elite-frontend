import api from '../../../lib/axios';
import type { FtraRecord, FtraTower, FtraUnitStatus, PaginatedFtraRecordsResponse } from '../types';

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

  /** Supervisor / Director: recibe a satisfacción con su firma */
  approve: async (id: number, signature: string, comment: string | null): Promise<{ record: FtraRecord; message: string }> => {
    const { data } = await api.post(`/v1/ftra/records/${id}/approve`, { signature, comment });
    return data;
  },

  /** Supervisor / Director: devuelve al residente con el motivo */
  returnRecord: async (id: number, comment: string): Promise<{ record: FtraRecord; message: string }> => {
    const { data } = await api.post(`/v1/ftra/records/${id}/return`, { comment });
    return data;
  },

  /** Residente: corrige y reenvía un FTRA devuelto (FormData: comment, observations, resultado_inspeccion, photos[]) */
  resubmit: async (id: number, formData: FormData): Promise<{ record: FtraRecord; message: string }> => {
    const { data } = await api.post(`/v1/ftra/records/${id}/resubmit`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },

  /** Torres del proyecto activo con su distribución de pisos y apartamentos */
  getTowers: async (): Promise<FtraTower[]> => {
    const { data } = await api.get('/v1/ftra/towers');
    return data.data ?? [];
  },

  /** Último FTRA de cada apartamento de la torre */
  getUnitsStatus: async (towerId: number): Promise<FtraUnitStatus[]> => {
    const { data } = await api.get(`/v1/ftra/towers/${towerId}/units`);
    return data.data ?? [];
  },

  /** Informe en Excel (registros con los filtros actuales + matriz por apartamento y formato) */
  exportExcel: async (filters: Record<string, unknown> = {}): Promise<void> => {
    const response = await api.get('/v1/ftra/records/export', { params: filters, responseType: 'blob' });
    // Content-Disposition no siempre es legible entre dominios (CORS): si falta, el nombre se arma con la fecha
    const fallback = `Seguimiento FTRA ${new Date().toLocaleDateString('en-CA')}.xlsx`;
    const name = /filename="?([^";]+)"?/.exec(response.headers['content-disposition'] ?? '')?.[1] ?? fallback;
    const url = URL.createObjectURL(response.data);
    const link = document.createElement('a');
    link.href = url;
    link.download = decodeURIComponent(name);
    link.click();
    URL.revokeObjectURL(url);
  },

  deleteRecord: async (id: number): Promise<void> => {
    await api.delete(`/v1/ftra/records/${id}`);
  },
};
