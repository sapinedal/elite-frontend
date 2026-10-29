import axios from 'axios';
import api from '../../../lib/axios';
import type { Corte, CorteCatalogs, CorteCounts, CortePage, CortePayload, CorteScope } from '../types';

const BASE = '/v1/cortes';

export const corteService = {
  getCatalogs: async (): Promise<CorteCatalogs> => {
    const { data } = await api.get(`${BASE}/catalogs`);
    return data.data;
  },

  getCortes: async (
    scope: CorteScope,
    params: Record<string, unknown> = {}
  ): Promise<{ page: CortePage; counts: CorteCounts }> => {
    const { data } = await api.get(BASE, { params: { scope, ...params } });
    return { page: data.data, counts: data.counts };
  },

  getCorte: async (id: number): Promise<Corte> => {
    const { data } = await api.get(`${BASE}/${id}`);
    return data.data;
  },

  /**
   * Sube el archivo directo a S3 (Spaces) y devuelve el token para radicar.
   * 1) El backend valida nombre/tamaño y entrega una URL firmada.
   * 2) El navegador hace PUT del archivo a esa URL, sin pasar por el servidor de la app.
   *
   * El PUT usa axios "puro" y no la instancia `api`: los headers Authorization y X-Project-Id
   * romperían la firma de S3 y la validación CORS del bucket.
   */
  uploadFile: async (
    file: File,
    onProgress?: (percent: number) => void,
    signal?: AbortSignal
  ): Promise<string> => {
    const { data } = await api.post(`${BASE}/upload-url`, {
      file_name: file.name,
      file_size: file.size,
      mime_type: file.type || null,
    });
    const { upload_url, upload_token, headers } = data.data as {
      upload_url: string;
      upload_token: string;
      headers: Record<string, string>;
    };

    await axios.put(upload_url, file, {
      headers,
      timeout: 0, // Un archivo de 1 GB puede tardar varios minutos
      signal,
      onUploadProgress: (e) => {
        if (onProgress && e.total) onProgress(Math.round((e.loaded / e.total) * 100));
      },
    });

    return upload_token;
  },

  createCorte: async (payload: CortePayload): Promise<Corte> => {
    const { data } = await api.post(BASE, payload);
    return data.data;
  },

  reviewCorte: async (id: number, decision: 'aprobar' | 'devolver', comment?: string): Promise<Corte> => {
    const { data } = await api.post(`${BASE}/${id}/review`, { decision, comment: comment || null });
    return data.data;
  },

  resubmitCorte: async (id: number, payload: CortePayload): Promise<Corte> => {
    const { data } = await api.post(`${BASE}/${id}/resubmit`, payload);
    return data.data;
  },

  /** Confirma que la factura quedó cargada en Multifox: pasa a cuentas por pagar */
  confirmMultifox: async (invoiceId: number): Promise<Corte> => {
    const { data } = await api.post(`${BASE}/invoices/${invoiceId}/multifox`);
    return data.data;
  },

  getInvoiceDownloadUrl: async (invoiceId: number): Promise<string> => {
    const { data } = await api.get(`${BASE}/invoices/${invoiceId}/download`);
    return data.data.download_url;
  },

  getDownloadUrl: async (id: number): Promise<string> => {
    const { data } = await api.get(`${BASE}/${id}/download`);
    return data.data.download_url;
  },
};

export { getErrorMessage as getApiErrorMessage } from '../../../lib/apiError';
