export interface BreadcrumbItem {
  name: string;
  path: string;
}

export interface FolderItem {
  name: string;
  path: string;
  type: 'folder';
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
}

export interface EffectivePermissions {
  can_read: boolean;
  can_upload: boolean;
  can_create_folder: boolean;
  can_delete: boolean;
  is_admin: boolean;
  role_type?: string;
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
}

export interface DocumentAreaPermission {
  id: number;
  area_id: number;
  folder_path: string;
  can_read: boolean;
  can_upload: boolean;
  can_create_folder: boolean;
  can_delete: boolean;
  area?: {
    id: number;
    name: string;
  };
  created_at?: string;
  updated_at?: string;
}

export interface DocumentActivityLog {
  id: number;
  user_id: number | null;
  action: string;
  path: string;
  details: Record<string, any> | null;
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
    area?: string;
    position?: string;
  };
  rules: DocumentAreaPermission[];
  areas: Array<{ id: number; name: string }>;
}
