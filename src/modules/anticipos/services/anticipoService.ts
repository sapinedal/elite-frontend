import axios from 'axios';
import api from '../../../lib/axios';
import type { Anticipo, AnticipoCatalogs, AnticipoCounts, AnticipoPage, AnticipoPayload, AnticipoScope, MultifoxPayload } from '../types';

const BASE = '/v1/anticipos';

export const anticipoService = {
  getCatalogs: async (): Promise<AnticipoCatalogs> => {
    const { data } = await api.get(`${BASE}/catalogs`);
    return data.data;
  },

  getAnticipos: async (scope: AnticipoScope, params: Record<string, unknown> = {}): Promise<{ page: AnticipoPage; counts: AnticipoCounts }> => {
    const { data } = await api.get(BASE, { params: { scope, ...params } });
    return { page: data.data, counts: data.counts };
  },

  getAnticipo: async (id: number): Promise<Anticipo> => {
    const { data } = await api.get(`${BASE}/${id}`);
    return data.data;
  },

  /**
   * Sube el archivo (cuenta de cobro o soporte de Multifox) directo a S3 y devuelve el token para guardarlo.
   * El PUT usa axios "puro" y no la instancia `api`: los headers Authorization y X-Project-Id
   * romperían la firma de S3 y la validación CORS del bucket.
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

  createAnticipo: async (payload: AnticipoPayload): Promise<Anticipo> => {
    const { data } = await api.post(BASE, payload);
    return data.data;
  },

  reviewAnticipo: async (id: number, decision: 'aprobar' | 'devolver', comment?: string): Promise<Anticipo> => {
    const { data } = await api.post(`${BASE}/${id}/review`, { decision, comment: comment || null });
    return data.data;
  },

  resubmitAnticipo: async (id: number, payload: AnticipoPayload): Promise<Anticipo> => {
    const { data } = await api.post(`${BASE}/${id}/resubmit`, payload);
    return data.data;
  },

  /** Contabilidad carga el anticipo generado en Multifox: pasa al cuadro de pagos */
  registerMultifox: async (id: number, payload: MultifoxPayload): Promise<Anticipo> => {
    const { data } = await api.post(`${BASE}/${id}/multifox`, payload);
    return data.data;
  },

  getDownloadUrl: async (id: number, file: 'cuenta' | 'multifox' = 'cuenta'): Promise<string> => {
    const { data } = await api.get(`${BASE}/${id}/download`, { params: { file } });
    return data.data.download_url;
  },
};

export { getErrorMessage as getApiErrorMessage } from '../../../lib/apiError';
