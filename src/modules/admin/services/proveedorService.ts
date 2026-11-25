import api from '../../../lib/axios';

export interface Proveedor {
  id: number;
  name: string;
  nit: string | null;
  email: string | null;
  phone: string | null;
  is_active: boolean;
  created_at: string | null;
  /** Registros de otros módulos (contratos, cortes, pagos...) que referencian al proveedor */
  usage_count: number;
}

export interface ProveedoresPage {
  data: Proveedor[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  /** Activos dentro de la búsqueda (no solo de la página) */
  active_count: number;
}

export interface ProveedoresParams {
  page?: number;
  per_page?: number;
  search?: string;
}

export type UpdateProveedorDTO = Partial<Pick<Proveedor, 'name' | 'nit' | 'email' | 'phone' | 'is_active'>>;

export const proveedorService = {
  getPage: async (params: ProveedoresParams = {}): Promise<ProveedoresPage> => {
    const { data } = await api.get('/v1/configuracion/proveedores', { params });
    return data;
  },

  update: async (id: number, proveedor: UpdateProveedorDTO): Promise<Proveedor> => {
    const { data } = await api.put(`/v1/configuracion/proveedores/${id}`, proveedor);
    return data.data;
  },

  remove: async (id: number): Promise<void> => {
    await api.delete(`/v1/configuracion/proveedores/${id}`);
  },
};
