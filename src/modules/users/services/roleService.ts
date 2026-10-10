import api from '../../../lib/axios';
import type { Role, PermissionCatalogResponse } from '../types';

export const roleService = {
  getRoles: async (): Promise<Role[]> => {
    const { data } = await api.get('/v1/roles');
    return data;
  },

  getRoleById: async (id: number): Promise<Role> => {
    const { data } = await api.get(`/v1/roles/${id}`);
    return data;
  },

  createRole: async (roleData: { name: string; permissions: string[] }): Promise<Role> => {
    const { data } = await api.post('/v1/roles', roleData);
    return data;
  },

  updateRole: async (id: number, roleData: { name?: string; permissions: string[] }): Promise<Role> => {
    const { data } = await api.put(`/v1/roles/${id}`, roleData);
    return data;
  },

  deleteRole: async (id: number): Promise<void> => {
    await api.delete(`/v1/roles/${id}`);
  },

  getPermissionsCatalog: async (): Promise<PermissionCatalogResponse> => {
    const { data } = await api.get('/v1/permissions');
    return data;
  }
};
