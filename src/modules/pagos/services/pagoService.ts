import axios from 'axios';
import api from '../../../lib/axios';
import type { PagoCatalogs, PagoCounts, PagoCuenta, PagoCuentaPayload, PagoPage, PagoPayPayload, PagoPriority, PagoScope } from '../types';

const BASE = '/v1/pagos';

export const pagoService = {
  getCatalogs: async (): Promise<PagoCatalogs> => {
    const { data } = await api.get(`${BASE}/catalogs`);
    return data.data;
  },

  getCuentas: async (
    scope: PagoScope,
    params: Record<string, unknown> = {}
  ): Promise<{ page: PagoPage; counts: PagoCounts; totalBalance: number }> => {
    const { data } = await api.get(BASE, { params: { scope, ...params } });
    return { page: data.data, counts: data.counts, totalBalance: data.total_balance };
  },

  getCuenta: async (id: number): Promise<PagoCuenta> => {
    const { data } = await api.get(`${BASE}/${id}`);
    return data.data;
  },

  createCuenta: async (payload: PagoCuentaPayload): Promise<PagoCuenta> => {
    const { data } = await api.post(BASE, payload);
    return data.data;
  },

  prioritize: async (ids: number[], priority: PagoPriority, scheduledFor: string, comment: string | null): Promise<number> => {
    const { data } = await api.post(`${BASE}/prioritize`, { ids, priority, scheduled_for: scheduledFor, comment });
    return data.data.count;
  },

  unschedule: async (id: number, comment?: string): Promise<PagoCuenta> => {
    const { data } = await api.post(`${BASE}/${id}/unschedule`, { comment: comment || null });
    return data.data;
  },

  pay: async (id: number, payload: PagoPayPayload): Promise<PagoCuenta> => {
    const { data } = await api.post(`${BASE}/${id}/pay`, payload);
    return data.data;
  },

  annul: async (id: number, comment: string): Promise<PagoCuenta> => {
    const { data } = await api.post(`${BASE}/${id}/annul`, { comment });
    return data.data;
  },

  /**
   * Sube el soporte de pago directo a S3 con URL firmada y devuelve el token.
   * El PUT usa axios "puro": los headers de `api` romperían la firma de S3 y el CORS del bucket.
   */
  uploadFile: async (file: File, onProgress?: (percent: number) => void): Promise<string> => {
    const { data } = await api.post(`${BASE}/upload-url`, { file_name: file.name, file_size: file.size, mime_type: file.type || null });
    const { upload_url, upload_token, headers } = data.data as { upload_url: string; upload_token: string; headers: Record<string, string> };

    await axios.put(upload_url, file, {
      headers,
      timeout: 0,
      onUploadProgress: (e) => {
        if (onProgress && e.total) onProgress(Math.round((e.loaded / e.total) * 100));
      },
    });

    return upload_token;
  },

  /** Descarga el cuadro de pagos en Excel (formato semanal por frentes) con la pestaña y filtros actuales */
  exportExcel: async (scope: PagoScope, params: Record<string, unknown> = {}): Promise<void> => {
    const response = await api.get(`${BASE}/export`, { params: { scope, ...params }, responseType: 'blob' });
    // Content-Disposition no siempre es legible entre dominios (CORS): si falta, el nombre se arma con la fecha
    const date = String(params.scheduled_for ?? new Date().toLocaleDateString('en-CA'));
    const name = /filename="?([^";]+)"?/.exec(response.headers['content-disposition'] ?? '')?.[1] ?? `Cuentas por pagar ${date}.xlsx`;
    const url = URL.createObjectURL(response.data);
    const link = document.createElement('a');
    link.href = url;
    link.download = decodeURIComponent(name);
    link.click();
    URL.revokeObjectURL(url);
  },

  getSupportDownloadUrl: async (movimientoId: number): Promise<string> => {
    const { data } = await api.get(`${BASE}/movimientos/${movimientoId}/download`);
    return data.data.download_url;
  },
};

export { getErrorMessage as getApiErrorMessage } from '../../../lib/apiError';
