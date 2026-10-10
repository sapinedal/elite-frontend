import React, { useState, useEffect, useCallback } from 'react';
import {
  FolderPlus,
  UploadCloud,
  RefreshCw,
  Search,
  LayoutGrid,
  List,
  Shield,
  History,
  FolderOpen,
  Loader2,
  Info,
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { useNotification } from '../../../context/NotificationContext';
import { documentalService } from '../services/documentalService';
import type {
  BrowseData,
  FileItem,
  DocumentAreaPermission,
} from '../types/documental.types';

// Components
import { BreadcrumbNav } from '../components/BreadcrumbNav';
import { FolderCard } from '../components/FolderCard';
import { FileCard } from '../components/FileCard';
import { FileTable } from '../components/FileTable';
import { CreateFolderModal } from '../components/CreateFolderModal';
import { UploadModal } from '../components/UploadModal';
import { FilePreviewModal } from '../components/FilePreviewModal';
import { DeleteConfirmModal } from '../components/DeleteConfirmModal';
import { RenameModal } from '../components/RenameModal';
import { AreaPermissionsModal } from '../components/AreaPermissionsModal';
import { DocumentLogsModal } from '../components/DocumentLogsModal';

export default function DocumentalPage() {
  const { user } = useAuth();
  const { showNotification } = useNotification();

  // Navigation State
  const [currentPath, setCurrentPath] = useState<string>('');
  const [browseData, setBrowseData] = useState<BrowseData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Modals State
  const [isCreateFolderOpen, setIsCreateFolderOpen] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [selectedFileForPreview, setSelectedFileForPreview] = useState<FileItem | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{
    name: string;
    path: string;
    type: 'file' | 'folder';
  } | null>(null);
  const [isRenameOpen, setIsRenameOpen] = useState(false);
  const [itemToRename, setItemToRename] = useState<{
    name: string;
    path: string;
    type: 'file' | 'folder';
  } | null>(null);
  const [isPermissionsOpen, setIsPermissionsOpen] = useState(false);
  const [isLogsOpen, setIsLogsOpen] = useState(false);

  // Admin Permissions & Rules State
  const [areaRules, setAreaRules] = useState<DocumentAreaPermission[]>([]);
  const [areasList, setAreasList] = useState<Array<{ id: number; name: string }>>([]);

  const loadDirectory = useCallback(
    async (path = currentPath, search = searchQuery, refresh = false) => {
      try {
        setLoading(true);
        const data = await documentalService.browse(path, search, refresh);
        setBrowseData(data);
        setCurrentPath(data.current_path);
      } catch (err: any) {
        showNotification(
          err.response?.data?.message || err.message || 'Error al cargar el repositorio',
          'error'
        );
      } finally {
        setLoading(false);
      }
    },
    [currentPath, searchQuery, showNotification]
  );

  const loadAdminRules = useCallback(async () => {
    try {
      const res = await documentalService.getPermissions(currentPath);
      setAreaRules(res.rules || []);
      setAreasList(res.areas || []);
    } catch (err) {
      console.error('Error al cargar reglas de área:', err);
    }
  }, [currentPath]);

  useEffect(() => {
    loadDirectory(currentPath, searchQuery);
  }, [currentPath]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadDirectory(currentPath, searchQuery);
  };

  const handleNavigate = (path: string) => {
    setSearchQuery('');
    setCurrentPath(path);
  };

  // Folder Actions
  const handleCreateFolder = async (folderName: string) => {
    await documentalService.createFolder(currentPath, folderName);
    showNotification(`Carpeta "${folderName}" creada exitosamente.`, 'success');
    loadDirectory(currentPath);
  };

  // Upload Actions
  const handleUploadFiles = async (files: File[]) => {
    await documentalService.uploadFiles(currentPath, files);
    showNotification(`${files.length} archivo(s) subido(s) correctamente al repositorio.`, 'success');
    loadDirectory(currentPath);
  };

  // Download Actions
  const handleDownload = async (file: FileItem) => {
    if (file.preview_url) {
      window.open(file.preview_url, '_blank');
      return;
    }
    try {
      const res = await documentalService.getDownloadUrl(file.path);
      window.open(res.download_url, '_blank');
    } catch (err: any) {
      showNotification('Error al generar enlace de descarga', 'error');
    }
  };

  // Copy Link Action
  const handleCopyLink = async (file: FileItem) => {
    try {
      let url = file.preview_url;
      if (!url) {
        const res = await documentalService.getDownloadUrl(file.path);
        url = res.download_url;
      }
      await navigator.clipboard.writeText(url);
      showNotification('Enlace temporal copiado al portapapeles (válido por 2h).', 'info');
    } catch (err) {
      showNotification('No se pudo copiar el enlace', 'error');
    }
  };

  // Delete Action
  const handleDeleteConfirm = async () => {
    if (!itemToDelete) return;
    await documentalService.deleteItem(itemToDelete.path, itemToDelete.type);
    showNotification(
      `${itemToDelete.type === 'folder' ? 'Carpeta' : 'Archivo'} eliminado correctamente.`,
      'success'
    );
    loadDirectory(currentPath);
  };

  // Rename Action
  const handleRenameSubmit = async (newName: string) => {
    if (!itemToRename) return;
    await documentalService.renameItem(itemToRename.path, newName, itemToRename.type);
    showNotification('Elemento renombrado exitosamente.', 'success');
    loadDirectory(currentPath);
  };

  // Area Permissions Actions
  const handleOpenPermissions = () => {
    loadAdminRules();
    setIsPermissionsOpen(true);
  };

  const handleSaveRule = async (data: any) => {
    await documentalService.saveAreaPermission(data);
    showNotification('Regla de permisos actualizada exitosamente.', 'success');
    loadAdminRules();
    loadDirectory(currentPath);
  };

  const handleDeleteRule = async (id: number) => {
    await documentalService.deleteAreaPermission(id);
    showNotification('Regla de permisos eliminada.', 'info');
    loadAdminRules();
    loadDirectory(currentPath);
  };

  const permissions = browseData?.permissions || {
    can_read: true,
    can_upload: false,
    can_create_folder: false,
    can_delete: false,
    is_admin: false,
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Toolbar */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar carpetas o archivos en este nivel..."
            className="w-full pl-10 pr-24 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#EE9D4C] shadow-sm transition-all"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                loadDirectory(currentPath, '');
              }}
              className="absolute right-14 top-1/2 -translate-y-1/2 text-[11px] font-bold text-slate-400 hover:text-slate-600"
            >
              Limpiar
            </button>
          )}
          <button
            type="submit"
            className="absolute right-2 top-1/2 -translate-y-1/2 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 rounded-xl text-[11px] font-bold text-slate-700 transition-colors"
          >
            Buscar
          </button>
        </form>

        {/* Action Buttons */}
        <div className="flex items-center flex-wrap gap-2.5">
          {/* Toggle View Mode */}
          <div className="flex items-center bg-white p-1 rounded-2xl border border-slate-200 shadow-sm">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-xl transition-colors ${
                viewMode === 'grid'
                  ? 'bg-[#004C6C] text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
              title="Vista en Cuadrícula"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-xl transition-colors ${
                viewMode === 'table'
                  ? 'bg-[#004C6C] text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
              title="Vista en Lista"
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          {/* Refresh */}
          <button
            type="button"
            onClick={() => loadDirectory(currentPath, searchQuery, true)}
            disabled={loading}
            className="p-2.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 rounded-2xl shadow-sm transition-colors"
            title="Forzar actualización desde S3"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-[#EE9D4C]' : ''}`} />
          </button>

          {/* Admin: Permissions by Area */}
          {permissions.is_admin && (
            <button
              type="button"
              onClick={handleOpenPermissions}
              className="flex items-center gap-1.5 px-3.5 py-2.5 bg-white hover:bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 rounded-2xl shadow-sm transition-colors"
            >
              <Shield className="w-4 h-4 text-indigo-500" />
              <span>Permisos Área</span>
            </button>
          )}

          {/* Admin: Logs */}
          {permissions.is_admin && (
            <button
              type="button"
              onClick={() => setIsLogsOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2.5 bg-white hover:bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 rounded-2xl shadow-sm transition-colors"
            >
              <History className="w-4 h-4 text-amber-500" />
              <span>Auditoría</span>
            </button>
          )}

          {/* Create Folder */}
          {permissions.can_create_folder && (
            <button
              type="button"
              onClick={() => setIsCreateFolderOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-2xl text-xs font-bold shadow-md shadow-amber-950/10 transition-all"
            >
              <FolderPlus className="w-4 h-4" />
              <span>Nueva Carpeta</span>
            </button>
          )}

          {/* Upload Files */}
          {permissions.can_upload && (
            <button
              type="button"
              onClick={() => setIsUploadOpen(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-[#004C6C] hover:bg-[#003952] text-white rounded-2xl text-xs font-bold shadow-md shadow-sky-950/20 transition-all"
            >
              <UploadCloud className="w-4 h-4" />
              <span>Subir Archivos</span>
            </button>
          )}
        </div>
      </div>

      {/* Breadcrumbs Navigation */}
      {browseData && (
        <BreadcrumbNav
          breadcrumbs={browseData.breadcrumbs}
          parentPath={browseData.parent_path}
          onNavigate={handleNavigate}
          totalFolders={browseData.total_folders}
          totalFiles={browseData.total_files}
          totalSizeFormatted={browseData.total_size_formatted}
        />
      )}

      {/* Permission Notice if write restricted */}
      {!permissions.can_upload && !permissions.can_create_folder && !loading && (
        <div className="p-3 px-4 bg-sky-50 border border-sky-100 rounded-2xl flex items-center gap-3 text-xs text-sky-800 font-medium">
          <Info className="w-4 h-4 text-sky-600 shrink-0" />
          <span>
            Tienes permisos de <strong>solo lectura</strong> en esta carpeta de acuerdo a las políticas de tu área ({user?.area || 'General'}).
          </span>
        </div>
      )}

      {/* Main Content Area */}
      {loading ? (
        <div className="bg-white rounded-3xl p-16 border border-slate-100 shadow-sm flex flex-col items-center justify-center gap-3 text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin text-[#004C6C]" />
          <p className="text-sm font-semibold">Cargando contenidos del Space...</p>
        </div>
      ) : !browseData || (browseData.folders.length === 0 && browseData.files.length === 0) ? (
        <div className="bg-white rounded-3xl p-16 border border-slate-100 shadow-sm text-center max-w-md mx-auto">
          <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center mx-auto mb-4 text-slate-400">
            <FolderOpen className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-slate-800 mb-1">Carpeta Vacía</h3>
          <p className="text-xs text-slate-400 mb-6">
            {searchQuery
              ? `No se encontraron resultados para "${searchQuery}".`
              : 'Esta carpeta aún no contiene archivos ni subdirectorios.'}
          </p>
          {permissions.can_upload && (
            <button
              onClick={() => setIsUploadOpen(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-bold text-white bg-[#004C6C] hover:bg-[#003952] transition-colors shadow-sm"
            >
              <UploadCloud className="w-4 h-4" />
              <span>Subir el primer archivo</span>
            </button>
          )}
        </div>
      ) : viewMode === 'grid' ? (
        <div className="space-y-8">
          {/* Carpetas Grid */}
          {browseData.folders.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">
                Carpetas ({browseData.folders.length})
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {browseData.folders.map((folder) => (
                  <FolderCard
                    key={folder.path}
                    folder={folder}
                    permissions={permissions}
                    onOpen={handleNavigate}
                    onRename={(f) => {
                      setItemToRename({ name: f.name, path: f.path, type: 'folder' });
                      setIsRenameOpen(true);
                    }}
                    onDelete={(f) => {
                      setItemToDelete({ name: f.name, path: f.path, type: 'folder' });
                      setIsDeleteOpen(true);
                    }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Archivos Grid */}
          {browseData.files.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">
                Archivos ({browseData.files.length})
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {browseData.files.map((file) => (
                  <FileCard
                    key={file.path}
                    file={file}
                    permissions={permissions}
                    onPreview={(f) => {
                      setSelectedFileForPreview(f);
                      setIsPreviewOpen(true);
                    }}
                    onDownload={handleDownload}
                    onCopyLink={handleCopyLink}
                    onRename={(f) => {
                      setItemToRename({ name: f.name, path: f.path, type: 'file' });
                      setIsRenameOpen(true);
                    }}
                    onDelete={(f) => {
                      setItemToDelete({ name: f.name, path: f.path, type: 'file' });
                      setIsDeleteOpen(true);
                    }}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Vista en Tabla */
        <FileTable
          folders={browseData.folders}
          files={browseData.files}
          permissions={permissions}
          onOpenFolder={handleNavigate}
          onPreviewFile={(f) => {
            setSelectedFileForPreview(f);
            setIsPreviewOpen(true);
          }}
          onDownloadFile={handleDownload}
          onCopyLink={handleCopyLink}
          onRenameFolder={(f) => {
            setItemToRename({ name: f.name, path: f.path, type: 'folder' });
            setIsRenameOpen(true);
          }}
          onRenameFile={(f) => {
            setItemToRename({ name: f.name, path: f.path, type: 'file' });
            setIsRenameOpen(true);
          }}
          onDeleteFolder={(f) => {
            setItemToDelete({ name: f.name, path: f.path, type: 'folder' });
            setIsDeleteOpen(true);
          }}
          onDeleteFile={(f) => {
            setItemToDelete({ name: f.name, path: f.path, type: 'file' });
            setIsDeleteOpen(true);
          }}
        />
      )}

      {/* Modals */}
      <CreateFolderModal
        isOpen={isCreateFolderOpen}
        parentPath={currentPath}
        onClose={() => setIsCreateFolderOpen(false)}
        onSubmit={handleCreateFolder}
      />

      <UploadModal
        isOpen={isUploadOpen}
        targetPath={currentPath}
        onClose={() => setIsUploadOpen(false)}
        onSubmit={handleUploadFiles}
      />

      <FilePreviewModal
        isOpen={isPreviewOpen}
        file={selectedFileForPreview}
        onClose={() => {
          setIsPreviewOpen(false);
          setSelectedFileForPreview(null);
        }}
        onDownload={handleDownload}
      />

      <DeleteConfirmModal
        isOpen={isDeleteOpen}
        item={itemToDelete}
        onClose={() => {
          setIsDeleteOpen(false);
          setItemToDelete(null);
        }}
        onConfirm={handleDeleteConfirm}
      />

      <RenameModal
        isOpen={isRenameOpen}
        item={itemToRename}
        onClose={() => {
          setIsRenameOpen(false);
          setItemToRename(null);
        }}
        onSubmit={handleRenameSubmit}
      />

      <AreaPermissionsModal
        isOpen={isPermissionsOpen}
        rules={areaRules}
        areas={areasList}
        currentPath={currentPath}
        onClose={() => setIsPermissionsOpen(false)}
        onSaveRule={handleSaveRule}
        onDeleteRule={handleDeleteRule}
      />

      <DocumentLogsModal
        isOpen={isLogsOpen}
        onClose={() => setIsLogsOpen(false)}
      />
    </div>
  );
}
