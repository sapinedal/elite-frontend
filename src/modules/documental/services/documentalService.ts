import api from '../../../lib/axios';
import type {
  BrowseData,
  PermissionsResponse,
  FolderRoleRule,
  DocumentLogFilters,
  DocumentLogsResponse,
  DocumentalSettings,
  DocumentalSettingsInput,
} from '../types/documental.types';

export const documentalService = {
  /**
   * Navega y lista carpetas y archivos en la ruta del S3.
   */
  async browse(path = '', search = '', refresh = false, recursive = false): Promise<BrowseData> {
    const params: Record<string, string | number> = {};
    if (path) params.path = path;
    if (search) params.search = search;
    if (search && recursive) params.recursive = 1;
    if (refresh) params.refresh = 1;

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
   * Consulta los permisos del usuario actual y, si administra el módulo, las restricciones por carpeta.
   */
  async getPermissions(path = ''): Promise<PermissionsResponse> {
    const response = await api.get('/v1/documental/permissions', {
      params: { path },
    });
    return response.data;
  },

  /**
   * Reemplaza los roles con acceso a una carpeta. Una lista vacía quita la restricción.
   */
  async syncFolderRules(folderPath: string, rules: FolderRoleRule[]): Promise<{ message: string; restricted: boolean }> {
    const response = await api.put('/v1/documental/permissions/folder', {
      folder_path: folderPath,
      rules,
    });
    return response.data.data;
  },

  /**
   * Obtiene los registros de auditoría con filtros opcionales.
   */
  async getLogs(page = 1, perPage = 25, filters: DocumentLogFilters = {}): Promise<DocumentLogsResponse> {
    const params: Record<string, string | number> = { page, per_page: perPage };
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params[key] = value;
    });

    const response = await api.get('/v1/documental/logs', { params });
    return { ...response.data.logs, denied_last_7_days: response.data.denied_last_7_days };
  },

  /**
   * Configuración del módulo: tamaño máximo de subida y extensiones permitidas o bloqueadas.
   */
  async getSettings(): Promise<DocumentalSettings> {
    const response = await api.get('/v1/documental/settings');
    return response.data.data;
  },

  async updateSettings(data: DocumentalSettingsInput): Promise<DocumentalSettings> {
    const response = await api.put('/v1/documental/settings', data);
    return response.data.data;
  },
};
