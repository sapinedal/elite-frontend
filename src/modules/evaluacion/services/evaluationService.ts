import api from '../../../lib/axios';
import type { Evaluation } from '../types';

export const evaluationService = {
  getEvaluation: async (userId: number, month: number, year: number): Promise<Evaluation | null> => {
    const { data } = await api.get(`/v1/users/${userId}/evaluations`, {
      params: { month, year }
    });
    return data;
  },

  saveEvaluation: async (userId: number, evaluation: Partial<Evaluation>): Promise<Evaluation> => {
    const { data } = await api.post(`/v1/users/${userId}/evaluations`, evaluation);
    return data;
  },

  getHistory: async (userId: number): Promise<Evaluation[]> => {
    const { data } = await api.get(`/v1/users/${userId}/history`);
    return data;
  },

  getAllHistory: async (params?: any): Promise<Evaluation[]> => {
    const { data } = await api.get('/v1/evaluations/history', { params });
    return data;
  },

  exportPdf: async (evaluationId: number): Promise<void> => {
    const token = localStorage.getItem('token');
    const response = await fetch(`${import.meta.env.VITE_API_URL}/v1/evaluations/${evaluationId}/export`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) throw new Error('Error al generar el PDF');

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    window.open(url, '_blank');
  },

  exportDashboardPdf: async (month: number, year: number, area: string): Promise<void> => {
    const token = localStorage.getItem('token');
    const params = new URLSearchParams({ month: month.toString(), year: year.toString(), area });
    const response = await fetch(`${import.meta.env.VITE_API_URL}/v1/dashboard/export?${params}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) throw new Error('Error al generar el PDF del dashboard');

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    window.open(url, '_blank');
  }
};

