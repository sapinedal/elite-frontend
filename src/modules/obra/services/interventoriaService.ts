import api from '../../../lib/axios';
import type { InterventoriaDashboard } from '../types';

export const interventoriaService = {
  /** Último informe semanal de interventoría (o uno puntual) con la serie histórica de avance */
  async getDashboard(numero?: number): Promise<InterventoriaDashboard> {
    const { data } = await api.get('/v1/obra/interventoria', { params: numero ? { numero } : {} });
    return data.data;
  },

  /** Botón "Sincronizar": trae lo nuevo (desde Drive si está configurado) y carga el último informe */
  async sync(): Promise<{ success: boolean; message: string; data: InterventoriaDashboard }> {
    const { data } = await api.post('/v1/obra/interventoria/sincronizar');
    return data;
  },
};
