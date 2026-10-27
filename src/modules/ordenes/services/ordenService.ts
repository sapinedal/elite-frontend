import axios from 'axios';
import api from '../../../lib/axios';
import type { Orden, OrdenCatalogs, OrdenCounts, OrdenDocumentPayload, OrdenPage, OrdenPayload, OrdenScope } from '../types';

const BASE = '/v1/ordenes';

export const ordenService = {
  getCatalogs: async (): Promise<OrdenCatalogs> => {
    const { data } = await api.get(`${BASE}/catalogs`);
    return data.data;
  },

  getOrdenes: async (
    scope: OrdenScope,
    params: Record<string, unknown> = {}
  ): Promise<{ page: OrdenPage; counts: OrdenCounts }> => {
    const { data } = await api.get(BASE, { params: { scope, ...params } });
    return { page: data.data, counts: data.counts };
  },

  getOrden: async (id: number): Promise<Orden> => {
    const { data } = await api.get(`${BASE}/${id}`);
    return data.data;
  },

  /**
   * Sube el archivo directo a S3 con URL firmada y devuelve el token para cargar el documento.
   * El PUT usa axios "puro": los headers de `api` romperían la firma de S3 y el CORS del bucket.
   */
  uploadFile: async (file: File, onProgress?: (percent: number) => void): Promise<string> => {
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
      timeout: 0,
      onUploadProgress: (e) => {
        if (onProgress && e.total) onProgress(Math.round((e.loaded / e.total) * 100));
      },
    });

    return upload_token;
  },

  createOrden: async (payload: OrdenPayload): Promise<Orden> => {
    const { data } = await api.post(BASE, payload);
    return data.data;
  },

  reviewOrden: async (id: number, decision: 'aprobar' | 'devolver', comment?: string): Promise<Orden> => {
    const { data } = await api.post(`${BASE}/${id}/review`, { decision, comment: comment || null });
    return data.data;
  },

  resubmitOrden: async (id: number, payload: OrdenPayload): Promise<Orden> => {
    const { data } = await api.post(`${BASE}/${id}/resubmit`, payload);
    return data.data;
  },

  /** Carga el documento pendiente (el archivo ya se subió con uploadFile) y devuelve la orden actualizada */
  uploadDocument: async (id: number, payload: OrdenDocumentPayload): Promise<Orden> => {
    const { data } = await api.post(`${BASE}/${id}/documents`, payload);
    return data.data;
  },

  getDocumentDownloadUrl: async (documentId: number): Promise<string> => {
    const { data } = await api.get(`${BASE}/documents/${documentId}/download`);
    return data.data.download_url;
  },
};

export { getErrorMessage as getApiErrorMessage } from '../../../lib/apiError';
