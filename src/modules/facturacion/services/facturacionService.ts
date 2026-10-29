import axios from 'axios';
import api from '../../../lib/axios';
import type {
  AssociatePayload, Factura, FacturacionCatalogs, FacturacionPanelData, FacturaCounts, FacturaPage, FacturaPayload, FacturaScope, FacturaTargets,
} from '../types';

const BASE = '/v1/facturacion';

export const facturacionService = {
  getCatalogs: async (): Promise<FacturacionCatalogs> => {
    const { data } = await api.get(`${BASE}/catalogs`);
    return data.data;
  },

  getFacturas: async (scope: FacturaScope, params: Record<string, unknown> = {}): Promise<{ page: FacturaPage; counts: FacturaCounts }> => {
    const { data } = await api.get(BASE, { params: { scope, ...params } });
    return { page: data.data, counts: data.counts };
  },

  getFactura: async (id: number): Promise<Factura> => {
    const { data } = await api.get(`${BASE}/${id}`);
    return data.data;
  },

  /**
   * Sube el archivo (factura o soporte) directo a S3 y devuelve el token para guardarlo.
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

  createFactura: async (payload: FacturaPayload): Promise<Factura> => {
    const { data } = await api.post(BASE, payload);
    return data.data;
  },

  updateFactura: async (id: number, payload: FacturaPayload): Promise<Factura> => {
    const { data } = await api.put(`${BASE}/${id}`, payload);
    return data.data;
  },

  deleteFactura: async (id: number): Promise<void> => {
    await api.delete(`${BASE}/${id}`);
  },

  getTargets: async (): Promise<FacturaTargets> => {
    const { data } = await api.get(`${BASE}/targets`);
    return data.data;
  },

  associate: async (id: number, payload: AssociatePayload): Promise<Factura> => {
    const { data } = await api.post(`${BASE}/${id}/associate`, payload);
    return data.data;
  },

  getPanel: async (period: string): Promise<FacturacionPanelData> => {
    const { data } = await api.get(`${BASE}/panel`, { params: { period } });
    return data.data;
  },

  getDownloadUrl: async (id: number): Promise<string> => {
    const { data } = await api.get(`${BASE}/${id}/download`);
    return data.data.download_url;
  },

  getSupportDownloadUrl: async (supportId: number): Promise<string> => {
    const { data } = await api.get(`${BASE}/supports/${supportId}/download`);
    return data.data.download_url;
  },
};

export { getErrorMessage as getApiErrorMessage } from '../../../lib/apiError';
