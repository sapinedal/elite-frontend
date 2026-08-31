import api from '../../../lib/axios';
import type { Project, CreateProjectDTO, UpdateProjectDTO } from '../types';

export const projectService = {
  getAllProjects: async (): Promise<Project[]> => {
    const { data } = await api.get('/v1/configuracion/projects');
    return data.data || [];
  },

  getProjectById: async (id: number): Promise<Project> => {
    const { data } = await api.get(`/v1/configuracion/projects/${id}`);
    return data.data;
  },

  createProject: async (projectData: CreateProjectDTO): Promise<Project> => {
    const { data } = await api.post('/v1/configuracion/projects', projectData);
    return data.data;
  },

  updateProject: async (id: number, projectData: UpdateProjectDTO): Promise<Project> => {
    const { data } = await api.put(`/v1/configuracion/projects/${id}`, projectData);
    return data.data;
  },

  deleteProject: async (id: number): Promise<void> => {
    await api.delete(`/v1/configuracion/projects/${id}`);
  }
};
