export interface BreadcrumbItem {
  name: string;
  path: string;
}

export interface FolderItem {
  name: string;
  path: string;
  type: 'folder';
  /** La carpeta tiene restricciones por rol */
  restricted?: boolean;
  /** Carpeta contenedora; solo en resultados de búsqueda en subcarpetas */
  location?: string;
}

export interface FileItem {
  name: string;
  path: string;
  type: 'file';
  size: number;
  size_formatted: string;
  mime_type: string;
  extension: string;
  last_modified: string | null;
  preview_url: string | null;
  /** Carpeta contenedora; solo en resultados de búsqueda en subcarpetas */
  location?: string;
}

export interface SearchMeta {
  query: string;
  recursive: boolean;
  /** Coincidencias totales visibles para el usuario (puede superar las devueltas) */
  total_matches: number;
  truncated: boolean;
  index_built_at: string | null;
}

export interface EffectivePermissions {
  can_read: boolean;
  can_upload: boolean;
  can_create_folder: boolean;
  can_rename: boolean;
  can_delete: boolean;
  is_admin: boolean;
  /** La carpeta (o un ancestro) tiene restricciones por rol */
  restricted: boolean;
}

export interface BrowseData {
  current_path: string;
  parent_path: string | null;
  breadcrumbs: BreadcrumbItem[];
  folders: FolderItem[];
  files: FileItem[];
  total_folders: number;
  total_files: number;
  total_size: number;
  total_size_formatted: string;
  permissions: EffectivePermissions;
  search?: SearchMeta;
}

export interface FolderRoleRule {
  role_id: number;
  role_name?: string | null;
  can_read: boolean;
  can_upload: boolean;
  can_create_folder: boolean;
  can_delete: boolean;
}

export interface RestrictedFolder {
  folder_path: string;
  rules: FolderRoleRule[];
}

export interface RoleOption {
  id: number;
  name: string;
}

export interface DocumentActivityLog {
  id: number;
  user_id: number | null;
  action: string;
  path: string;
  details: Record<string, unknown> | null;
  ip_address: string | null;
  created_at: string;
  user?: {
    id: number;
    name: string;
    email: string;
  };
}

export interface PermissionsResponse {
  success: boolean;
  effective_permissions: EffectivePermissions;
  user: {
    id?: number;
    name?: string;
    roles?: string[];
  };
  restricted_folders: RestrictedFolder[];
  roles: RoleOption[];
}

export interface DocumentLogFilters {
  action?: string;
  user?: string;
  path?: string;
  date_from?: string;
  date_to?: string;
}

export interface DocumentLogsResponse {
  data: DocumentActivityLog[];
  total: number;
  current_page: number;
  last_page: number;
  denied_last_7_days: number;
}

export type ExtensionMode = 'blocklist' | 'allowlist';

export interface DocumentalSettings {
  max_upload_mb: number;
  extension_mode: ExtensionMode;
  blocked_extensions: string[];
  allowed_extensions: string[];
  /** Máximo de archivos para renombrar o eliminar una carpeta desde la app */
  max_folder_operation_files: number;
  /** Límite real de PHP en el servidor (upload_max_filesize / post_max_size) */
  server_max_upload_mb: number;
  /** El menor entre el configurado y el del servidor */
  effective_max_upload_mb: number;
}

export type DocumentalSettingsInput = Pick<
  DocumentalSettings,
  'max_upload_mb' | 'extension_mode' | 'blocked_extensions' | 'allowed_extensions' | 'max_folder_operation_files'
>;
