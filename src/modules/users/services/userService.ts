import api from '../../../lib/axios';
import type { User, KPI } from '../types';

export const userService = {
  getAllUsers: async (includeInactive: boolean = true): Promise<User[]> => {
    const { data } = await api.get('/v1/users', {
      params: { include_inactive: includeInactive }
    });
    return data;
  },

  getUserById: async (id: number): Promise<User> => {
    const { data } = await api.get(`/v1/users/${id}`);
    return data;
  },

  createUser: async (userData: Partial<User>): Promise<User> => {
    const { data } = await api.post('/v1/users', userData);
    return data;
  },

  updateUser: async (id: number, userData: Partial<User>): Promise<User> => {
    const { data } = await api.put(`/v1/users/${id}`, userData);
    return data;
  },

  deleteUser: async (id: number): Promise<void> => {
    await api.delete(`/v1/users/${id}`);
  },

  restoreUser: async (id: number): Promise<{ message: string; user: User }> => {
    const { data } = await api.post(`/v1/users/${id}/restore`);
    return data;
  },

  toggleStatus: async (id: number): Promise<{ message: string; user: User }> => {
    const { data } = await api.patch(`/v1/users/${id}/toggle-status`);
    return data;
  },

  changePassword: async (id: number, passwordData: any): Promise<void> => {
    await api.post(`/v1/users/${id}/change-password`, passwordData);
  },

  getUserKPIs: async (userId: number): Promise<KPI[]> => {
    const { data } = await api.get(`/v1/users/${userId}/kpis`);
    return data;
  },

  syncUserKPIs: async (userId: number, kpis: Partial<KPI>[]): Promise<User> => {
    const { data } = await api.post(`/v1/users/${userId}/kpis/sync`, { kpis });
    return data;
  },
  
  deleteKPI: async (kpiId: number): Promise<void> => {
    await api.delete(`/v1/kpis/${kpiId}`);
  }
};

