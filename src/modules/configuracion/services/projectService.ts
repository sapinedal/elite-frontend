import api from '../../../lib/axios';

export interface ProjectData {
  id?: number | string;
  code: string;
  name: string;
  subtitle?: string;
  description?: string;
  total_budget?: number;
  is_active?: boolean;
}

export const projectService = {
  getProjects: async (): Promise<ProjectData[]> => {
    const response = await api.get('/v1/configuracion/projects');
    return response.data.data;
  },

  createProject: async (data: ProjectData): Promise<ProjectData> => {
    const response = await api.post('/v1/configuracion/projects', data);
    return response.data.data;
  },

  updateProject: async (id: number | string, data: Partial<ProjectData>): Promise<ProjectData> => {
    const response = await api.put(`/v1/configuracion/projects/${id}`, data);
    return response.data.data;
  },

  deleteProject: async (id: number | string): Promise<void> => {
    await api.delete(`/v1/configuracion/projects/${id}`);
  }
};
