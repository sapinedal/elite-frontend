import api from '../../../lib/axios';
import type { Project, CreateProjectDTO, UpdateProjectDTO, ProjectMember, ProjectTower, SaveTowerDTO } from '../types';

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
  },

  getProjectUsers: async (id: number): Promise<ProjectMember[]> => {
    const { data } = await api.get(`/v1/configuracion/projects/${id}/users`);
    return data.data || [];
  },

  /** Reemplaza la lista completa de usuarios asignados al proyecto */
  syncProjectUsers: async (id: number, userIds: number[]): Promise<ProjectMember[]> => {
    const { data } = await api.put(`/v1/configuracion/projects/${id}/users`, { user_ids: userIds });
    return data.data || [];
  },

  getTowers: async (projectId: number): Promise<ProjectTower[]> => {
    const { data } = await api.get(`/v1/configuracion/projects/${projectId}/towers`);
    return data.data || [];
  },

  createTower: async (projectId: number, tower: SaveTowerDTO): Promise<ProjectTower> => {
    const { data } = await api.post(`/v1/configuracion/projects/${projectId}/towers`, tower);
    return data.data;
  },

  updateTower: async (towerId: number, tower: Partial<SaveTowerDTO>): Promise<ProjectTower> => {
    const { data } = await api.put(`/v1/configuracion/towers/${towerId}`, tower);
    return data.data;
  },

  deleteTower: async (towerId: number): Promise<void> => {
    await api.delete(`/v1/configuracion/towers/${towerId}`);
  }
};
