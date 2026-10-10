import api from '../../../lib/axios';
import type {
  BrowseData,
  PermissionsResponse,
  DocumentAreaPermission,
  DocumentActivityLog
} from '../types/documental.types';

export const documentalService = {
  /**
   * Navega y lista carpetas y archivos en la ruta del S3.
   */
  async browse(path = '', search = '', refresh = false): Promise<BrowseData> {
    const params: Record<string, string | boolean> = {};
    if (path) params.path = path;
    if (search) params.search = search;
    if (refresh) params.refresh = true;

    const response = await api.get('/v1/documental', { params });
    return response.data.data;
  },

  /**
   * Crea una carpeta en la ruta indicada.
   */
  async createFolder(parentPath: string, folderName: string): Promise<{ name: string; path: string }> {
    const response = await api.post('/v1/documental/folders', {
      parent_path: parentPath,
      folder_name: folderName,
    });
    return response.data.data;
  },

  /**
   * Sube uno o varios archivos a la ruta indicada en el bucket S3.
   */
  async uploadFiles(targetPath: string, files: File[]): Promise<any> {
    const formData = new FormData();
    formData.append('path', targetPath);
    files.forEach((file) => {
      formData.append('files[]', file);
    });

    const response = await api.post('/v1/documental/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.data;
  },

  /**
   * Elimina un archivo o una carpeta del bucket.
   */
  async deleteItem(path: string, type: 'file' | 'folder'): Promise<any> {
    const response = await api.delete('/v1/documental/item', {
      data: { path, type },
    });
    return response.data.data;
  },

  /**
   * Renombra un archivo o carpeta en el bucket.
   */
  async renameItem(oldPath: string, newName: string, type: 'file' | 'folder'): Promise<any> {
    const response = await api.post('/v1/documental/rename', {
      old_path: oldPath,
      new_name: newName,
      type,
    });
    return response.data.data;
  },

  /**
   * Obtiene la URL firmada de descarga para un archivo.
   */
  async getDownloadUrl(path: string): Promise<{ download_url: string; name: string }> {
    const response = await api.get('/v1/documental/download', {
      params: { path },
    });
    return response.data.data;
  },

  /**
   * Consulta los permisos del usuario actual y las reglas por área.
   */
  async getPermissions(path = ''): Promise<PermissionsResponse> {
    const response = await api.get('/v1/documental/permissions', {
      params: { path },
    });
    return response.data;
  },

  /**
   * Guarda o actualiza una regla de permisos para un área específica.
   */
  async saveAreaPermission(data: {
    area_id: number;
    folder_path: string;
    can_read: boolean;
    can_upload: boolean;
    can_create_folder: boolean;
    can_delete: boolean;
  }): Promise<DocumentAreaPermission> {
    const response = await api.post('/v1/documental/permissions', data);
    return response.data.permission;
  },

  /**
   * Elimina una regla de permisos de área.
   */
  async deleteAreaPermission(id: number): Promise<void> {
    await api.delete(`/v1/documental/permissions/${id}`);
  },

  /**
   * Obtiene los logs de actividad sobre documentos.
   */
  async getLogs(page = 1, perPage = 25): Promise<{ data: DocumentActivityLog[]; total: number; current_page: number }> {
    const response = await api.get('/v1/documental/logs', {
      params: { page, per_page: perPage },
    });
    return response.data.logs;
  },
};
