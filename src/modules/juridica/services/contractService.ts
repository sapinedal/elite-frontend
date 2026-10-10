import api from '../../../lib/axios';
import type { Contract, Tower, ContractType, CreateContractDTO, UpdateContractDTO, CreateTowerDTO, CreateContractTypeDTO } from '../types';

export const contractService = {
  getContracts: async (params?: { project_id?: number | string; tower_id?: number | string; category?: string; search?: string }): Promise<Contract[]> => {
    const response = await api.get('/v1/juridica/contracts', { params });
    return response.data.data || [];
  },

  createContract: async (contractData: CreateContractDTO): Promise<Contract> => {
    const response = await api.post('/v1/juridica/contracts', contractData);
    return response.data.data;
  },

  updateContract: async (id: number | string, contractData: UpdateContractDTO): Promise<Contract> => {
    const response = await api.put(`/v1/juridica/contracts/${id}`, contractData);
    return response.data.data;
  },

  deleteContract: async (id: number | string): Promise<void> => {
    await api.delete(`/v1/juridica/contracts/${id}`);
  },

  getTowers: async (projectId: number | string): Promise<Tower[]> => {
    const response = await api.get(`/v1/configuracion/projects/${projectId}/towers`);
    return response.data.data || [];
  },

  createTower: async (projectId: number | string, towerData: CreateTowerDTO): Promise<Tower> => {
    const response = await api.post(`/v1/configuracion/projects/${projectId}/towers`, towerData);
    return response.data.data;
  },

  deleteTower: async (towerId: number | string): Promise<void> => {
    await api.delete(`/v1/configuracion/towers/${towerId}`);
  },

  getContractTypes: async (): Promise<ContractType[]> => {
    const response = await api.get('/v1/juridica/contract-types');
    return response.data.data || [];
  },

  createContractType: async (typeData: CreateContractTypeDTO): Promise<ContractType> => {
    const response = await api.post('/v1/juridica/contract-types', typeData);
    return response.data.data;
  },

  updateContractType: async (id: number | string, typeData: Partial<CreateContractTypeDTO>): Promise<ContractType> => {
    const response = await api.put(`/v1/juridica/contract-types/${id}`, typeData);
    return response.data.data;
  },

  deleteContractType: async (id: number | string): Promise<void> => {
    await api.delete(`/v1/juridica/contract-types/${id}`);
  },

  getFolderFiles: async (folderId: string) => {
    const response = await api.get(`/v1/juridica/drive/folders/${folderId}`);
    return response.data;
  }
};
