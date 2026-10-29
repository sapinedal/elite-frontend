import axios from 'axios';
import api from '../../../lib/axios';
import type {
  CuentaCobro, CuentaCobroCatalogs, CuentaCobroCounts, CuentaCobroMultifoxPayload, CuentaCobroPage, CuentaCobroPayload,
  CuentaCobroScope, CuentaCobroTipo, CuentaCobroTipoPayload,
} from '../types';

const BASE = '/v1/cuentas-cobro';

export const cuentaCobroService = {
  getCatalogs: async (): Promise<CuentaCobroCatalogs> => {
    const { data } = await api.get(`${BASE}/catalogs`);
    return data.data;
  },

  getCuentas: async (scope: CuentaCobroScope, params: Record<string, unknown> = {}): Promise<{ page: CuentaCobroPage; counts: CuentaCobroCounts }> => {
    const { data } = await api.get(BASE, { params: { scope, ...params } });
    return { page: data.data, counts: data.counts };
  },

  getCuenta: async (id: number): Promise<CuentaCobro> => {
    const { data } = await api.get(`${BASE}/${id}`);
    return data.data;
  },

  /**
   * Sube un archivo directo a S3 y devuelve el token para guardarlo.
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

  createCuenta: async (payload: CuentaCobroPayload): Promise<CuentaCobro> => {
    const { data } = await api.post(BASE, payload);
    return data.data;
  },

  reviewCuenta: async (id: number, decision: 'aprobar' | 'devolver', comment?: string): Promise<CuentaCobro> => {
    const { data } = await api.post(`${BASE}/${id}/review`, { decision, comment: comment || null });
    return data.data;
  },

  resubmitCuenta: async (id: number, payload: CuentaCobroPayload): Promise<CuentaCobro> => {
    const { data } = await api.post(`${BASE}/${id}/resubmit`, payload);
    return data.data;
  },

  /** Paula indica si requiere Multifox; si no, pasa al cuadro de pagos */
  decideMultifox: async (id: number, requiresMultifox: boolean, comment?: string): Promise<CuentaCobro> => {
    const { data } = await api.post(`${BASE}/${id}/multifox-decision`, { requires_multifox: requiresMultifox, comment: comment || null });
    return data.data;
  },

  /** Paula la carga en Multifox: pasa al cuadro de pagos */
  registerMultifox: async (id: number, payload: CuentaCobroMultifoxPayload): Promise<CuentaCobro> => {
    const { data } = await api.post(`${BASE}/${id}/multifox`, payload);
    return data.data;
  },

  getDownloadUrl: async (id: number, file: 'cuenta' | 'multifox' | 'adjunto' = 'cuenta', adjuntoId?: number): Promise<string> => {
    const { data } = await api.get(`${BASE}/${id}/download`, { params: { file, adjunto: adjuntoId } });
    return data.data.download_url;
  },

  getTipos: async (): Promise<CuentaCobroTipo[]> => {
    const { data } = await api.get(`${BASE}/tipos`);
    return data.data;
  },

  saveTipo: async (payload: CuentaCobroTipoPayload, id?: number): Promise<CuentaCobroTipo> => {
    const { data } = id ? await api.put(`${BASE}/tipos/${id}`, payload) : await api.post(`${BASE}/tipos`, payload);
    return data.data;
  },

  /** Devuelve el mensaje: se elimina, o se desactiva si tiene cuentas registradas */
  deleteTipo: async (id: number): Promise<string> => {
    const { data } = await api.delete(`${BASE}/tipos/${id}`);
    return data.message;
  },
};

export { getErrorMessage as getApiErrorMessage } from '../../../lib/apiError';
