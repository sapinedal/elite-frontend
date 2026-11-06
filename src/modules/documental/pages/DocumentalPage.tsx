import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  ChevronDown,
  FileSpreadsheet,
  FileText,
  FolderOpen,
  FolderPlus,
  History,
  Info,
  LayoutGrid,
  List,
  Loader2,
  Plus,
  Presentation,
  RefreshCw,
  Search,
  Settings,
  Shield,
  UploadCloud,
  X,
} from 'lucide-react';
import { useNotification } from '../../../context/NotificationContext';
import { useProject } from '../../../context/ProjectContext';
import { documentalService } from '../services/documentalService';
import type {
  BrowseData,
  FileItem,
  FolderItem,
  FolderRoleRule,
  RestrictedFolder,
  RoleOption,
  ProjectFolderTag,
  ProjectSummary,
  DocumentalSettings,
  DocumentalSettingsInput,
  EditorInfo,
  OfficeFileType,
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
import { FolderRestrictionsModal } from '../components/FolderRestrictionsModal';
import { DocumentLogsModal } from '../components/DocumentLogsModal';
import { DocumentalSettingsModal } from '../components/DocumentalSettingsModal';
import { NewOfficeFileModal } from '../components/NewOfficeFileModal';
import { editorCapability, editorUrl, openInEditor } from '../utils/editor';
import { getErrorMessage } from '../../../lib/apiError';

const NEW_OFFICE_OPTIONS: Array<{ type: OfficeFileType; label: string; icon: React.ReactNode }> = [
  { type: 'xlsx', label: 'Hoja de cálculo', icon: <FileSpreadsheet size={16} className="text-emerald-600" /> },
  { type: 'docx', label: 'Documento', icon: <FileText size={16} className="text-[#004C6C]" /> },
  { type: 'pptx', label: 'Presentación', icon: <Presentation size={16} className="text-[#D97F2A]" /> },
];

export default function DocumentalPage() {
  const { showNotification } = useNotification();
  const [searchParams, setSearchParams] = useSearchParams();

  // Navigation State
  const [currentPath, setCurrentPath] = useState<string>(() => searchParams.get('path') ?? '');
  const [browseData, setBrowseData] = useState<BrowseData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchInSubfolders, setSearchInSubfolders] = useState<boolean>(true);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>(() => {
    try {
      return localStorage.getItem('documental.viewMode') === 'table' ? 'table' : 'grid';
    } catch {
      return 'grid';
    }
  });

  // Modals State
  const [isCreateFolderOpen, setIsCreateFolderOpen] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isNewMenuOpen, setIsNewMenuOpen] = useState(false);
  const [isNewFileOpen, setIsNewFileOpen] = useState(false);
  const [newFileType, setNewFileType] = useState<OfficeFileType>('xlsx');
  const newMenuRef = useRef<HTMLDivElement>(null);
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
  const [restrictionTarget, setRestrictionTarget] = useState<string | null>(null);
  const [isLogsOpen, setIsLogsOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settings, setSettings] = useState<DocumentalSettings | null>(null);
  const [editorInfo, setEditorInfo] = useState<EditorInfo | null>(null);

  // Admin: restricciones de carpetas por rol
  const [restrictedFolders, setRestrictedFolders] = useState<RestrictedFolder[]>([]);
  const [rolesList, setRolesList] = useState<RoleOption[]>([]);
  // Admin: carpetas asignadas a proyectos
  const [projectFolders, setProjectFolders] = useState<ProjectFolderTag[]>([]);
  const [projectsList, setProjectsList] = useState<ProjectSummary[]>([]);

  // Las carpetas de otros proyectos se ocultan según el proyecto activo del header
  const { activeProject, isLoading: isLoadingProjects } = useProject();
  const activeProjectId = activeProject?.id ?? null;
  const previousProjectId = useRef<number | null | undefined>(undefined);

  // Disponibilidad del editor (si ONLYOFFICE no está configurado, los archivos solo se previsualizan o descargan)
  useEffect(() => {
    documentalService
      .getEditorInfo()
      .then(setEditorInfo)
      .catch((err) => console.error('Error al consultar el editor de documentos:', err));
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('documental.viewMode', viewMode);
    } catch {
      // sin almacenamiento local: la vista vuelve a cuadrícula al recargar
    }
  }, [viewMode]);

  useEffect(() => {
    if (!isNewMenuOpen) return;
    const close = (e: MouseEvent) => {
      if (newMenuRef.current && !newMenuRef.current.contains(e.target as Node)) setIsNewMenuOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [isNewMenuOpen]);

  const loadDirectory = useCallback(
    async (path = currentPath, search = searchQuery, refresh = false, recursive = searchInSubfolders) => {
      try {
        setLoading(true);
        const data = await documentalService.browse(path, search.trim(), refresh, recursive);
        setBrowseData(data);
        setCurrentPath(data.current_path);
      } catch (err: any) {
        showNotification(
          getErrorMessage(err, 'Error al cargar el repositorio'),
          'error'
        );
      } finally {
        setLoading(false);
      }
    },
    [currentPath, searchQuery, searchInSubfolders, showNotification]
  );

  const loadAdminRules = useCallback(async () => {
    try {
      const res = await documentalService.getPermissions(currentPath);
      setRestrictedFolders(res.restricted_folders || []);
      setRolesList(res.roles || []);
      setProjectFolders(res.project_folders || []);
      setProjectsList(res.projects || []);
    } catch (err) {
      console.error('Error al cargar restricciones de carpetas:', err);
    }
  }, [currentPath]);

  // Configuración de subidas (tamaño máximo y extensiones), usada por el formulario de subida
  useEffect(() => {
    documentalService
      .getSettings()
      .then(setSettings)
      .catch((err) => console.error('Error al cargar configuración documental:', err));
  }, []);

  const handleSaveSettings = async (data: DocumentalSettingsInput) => {
    const updated = await documentalService.updateSettings(data);
    setSettings(updated);
    showNotification('Configuración del repositorio actualizada.', 'success');
  };

  // Se espera al proyecto activo: el backend oculta las carpetas de otros proyectos según el header X-Project-Id
  useEffect(() => {
    if (isLoadingProjects) return;
    loadDirectory(currentPath, searchQuery);
    // La carpeta actual queda en la URL (?path=) para volver a ella desde el editor o compartir el enlace
    setSearchParams(currentPath ? { path: currentPath } : {}, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPath, isLoadingProjects]);

  // Al cambiar de proyecto se vuelve a la raíz: la carpeta actual puede pertenecer al proyecto anterior
  useEffect(() => {
    if (isLoadingProjects) return;
    if (previousProjectId.current === undefined) {
      previousProjectId.current = activeProjectId;
      return;
    }
    if (previousProjectId.current === activeProjectId) return;
    previousProjectId.current = activeProjectId;
    setSearchQuery('');
    if (currentPath === '') {
      loadDirectory('', '');
    } else {
      setCurrentPath('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeProjectId, isLoadingProjects]);

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

  // Download Actions: siempre se pide una URL de descarga al backend para forzar la descarga y registrarla en auditoría
  const handleDownload = async (file: FileItem) => {
    try {
      const res = await documentalService.getDownloadUrl(file.path);
      window.open(res.download_url, '_blank');
    } catch (err: any) {
      showNotification(getErrorMessage(err, 'Error al generar enlace de descarga'), 'error');
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
    } catch {
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

  // Restricciones de carpetas por rol
  const handleOpenRestrictions = (folderPath: string | null = null) => {
    loadAdminRules();
    setRestrictionTarget(folderPath);
    setIsPermissionsOpen(true);
  };

  const handleRestrictFolder = (folder: FolderItem) => handleOpenRestrictions(folder.path);

  const handleSaveRestriction = async (folderPath: string, rules: FolderRoleRule[]) => {
    const res = await documentalService.syncFolderRules(folderPath, rules);
    showNotification(res.message, 'success');
    await loadAdminRules();
    loadDirectory(currentPath);
  };

  const handleSaveFolderProject = async (folderPath: string, projectId: number | null) => {
    const res = await documentalService.setFolderProject(folderPath, projectId);
    showNotification(res.message, 'success');
    await loadAdminRules();
    loadDirectory(currentPath);
  };

  // Editor en el navegador (ONLYOFFICE)
  const editorModeFor = (file: FileItem) => editorCapability(editorInfo, file.extension);

  const handleOpenEditor = (file: FileItem) => openInEditor(file.path);

  const openNewFile = (type: OfficeFileType) => {
    setNewFileType(type);
    setIsNewFileOpen(true);
  };

  const handleCreateOfficeFile = async (name: string, type: OfficeFileType) => {
    // La pestaña se abre antes de la petición para que el navegador no la bloquee como ventana emergente
    const tab = window.open('', '_blank');
    try {
      const created = await documentalService.createOfficeFile(currentPath, name, type);
      showNotification(`"${created.name}" creado. Se abrió en una pestaña nueva.`, 'success');
      if (tab) tab.location.href = editorUrl(created.path);
      loadDirectory(currentPath);
    } catch (err) {
      tab?.close();
      throw err;
    }
  };

  const permissions = browseData?.permissions || {
    can_read: true,
    can_upload: false,
    can_create_folder: false,
    can_rename: false,
    can_delete: false,
    is_admin: false,
    restricted: false,
  };

  const officeEnabled = !!editorInfo?.enabled && permissions.can_upload;
  const canCreateSomething = permissions.can_create_folder || officeEnabled;
  const isReadOnly = !permissions.can_upload && !permissions.can_create_folder;

  const openRename = (item: { name: string; path: string }, type: 'file' | 'folder') => {
    setItemToRename({ name: item.name, path: item.path, type });
    setIsRenameOpen(true);
  };
  const openDelete = (item: { name: string; path: string }, type: 'file' | 'folder') => {
    setItemToDelete({ name: item.name, path: item.path, type });
    setIsDeleteOpen(true);
  };
  const openPreview = (file: FileItem) => {
    setSelectedFileForPreview(file);
    setIsPreviewOpen(true);
  };

  const toolButton = 'h-11 px-3.5 flex items-center gap-2 rounded-2xl text-xs font-bold transition-colors';

  return (
    <div className="max-w-[1600px] mx-auto flex flex-col gap-6 md:gap-8 pb-12 animate-fade-in">
      {/* Encabezado */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-gradient-to-r from-[#004C6C] via-[#005981] to-[#003850] p-6 md:p-8 rounded-[32px] text-white shadow-xl relative">
        <div className="absolute inset-0 rounded-[32px] overflow-hidden pointer-events-none">
          <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-white/5 rounded-full blur-3xl" />
          <div className="absolute right-40 -top-16 w-40 h-40 bg-[#EE9D4C]/10 rounded-full blur-3xl" />
        </div>
        <div className="flex items-center gap-4 relative z-10 min-w-0">
          <div className="h-14 w-14 bg-white/10 rounded-2xl flex items-center justify-center border border-white/10 shrink-0">
            <FolderOpen size={28} />
          </div>
          <div className="min-w-0">
            <h1 className="text-2xl md:text-3xl font-black tracking-tight">Gestión Documental</h1>
            <p className="text-xs font-bold text-white/60 uppercase tracking-widest mt-1 truncate">
              {activeProject ? activeProject.name : 'Repositorio en la nube'}
            </p>
          </div>
        </div>

        <div className="relative z-10 flex flex-col sm:flex-row gap-3">
          {permissions.can_upload && (
            <button
              type="button"
              onClick={() => setIsUploadOpen(true)}
              className="flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 border border-white/15 text-white px-5 py-3.5 rounded-2xl font-bold transition-all"
            >
              <UploadCloud size={18} /> Subir archivos
            </button>
          )}
          {canCreateSomething && (
            <div className="relative" ref={newMenuRef}>
              <button
                type="button"
                onClick={() => setIsNewMenuOpen((o) => !o)}
                className="w-full flex items-center justify-center gap-2 bg-[#EE9D4C] hover:bg-[#e08a35] text-white px-6 py-3.5 rounded-2xl font-bold shadow-lg transition-all hover:scale-[1.02]"
              >
                <Plus size={18} /> Nuevo <ChevronDown size={16} className={`transition-transform ${isNewMenuOpen ? 'rotate-180' : ''}`} />
              </button>
              {isNewMenuOpen && (
                <div className="absolute right-0 top-[calc(100%+8px)] w-64 bg-white text-slate-700 rounded-2xl shadow-2xl border border-slate-100 p-2 z-40 animate-in fade-in zoom-in-95 duration-150">
                  {permissions.can_create_folder && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsNewMenuOpen(false);
                        setIsCreateFolderOpen(true);
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold hover:bg-slate-50 transition-colors"
                    >
                      <FolderPlus size={16} className="text-[#EE9D4C]" /> Carpeta
                    </button>
                  )}
                  {officeEnabled && (
                    <>
                      {permissions.can_create_folder && <div className="my-1.5 border-t border-slate-100" />}
                      <p className="px-3 pt-1 pb-1.5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Crear y editar en línea</p>
                      {NEW_OFFICE_OPTIONS.map((option) => (
                        <button
                          key={option.type}
                          type="button"
                          onClick={() => {
                            setIsNewMenuOpen(false);
                            openNewFile(option.type);
                          }}
                          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold hover:bg-slate-50 transition-colors"
                        >
                          {option.icon} {option.label}
                        </button>
                      ))}
                    </>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Explorador */}
      <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm">
        {/* Barra de herramientas */}
        <div className="p-5 border-b border-slate-100 flex flex-col xl:flex-row xl:items-center gap-4">
          <div className="flex-1 min-w-0">
            {browseData ? (
              <BreadcrumbNav breadcrumbs={browseData.breadcrumbs} parentPath={browseData.parent_path} onNavigate={handleNavigate} />
            ) : (
              <div className="h-9 w-48 rounded-xl bg-slate-50 animate-pulse" />
            )}
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <form onSubmit={handleSearchSubmit} className="relative sm:w-80">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={searchInSubfolders ? 'Buscar aquí y en subcarpetas' : 'Buscar en esta carpeta'}
                className="w-full h-11 bg-slate-50 border border-slate-100 rounded-2xl pl-12 pr-10 text-sm font-bold text-slate-700 placeholder:text-slate-300 placeholder:font-semibold outline-none focus:border-[#004C6C] focus:bg-white transition-colors"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    loadDirectory(currentPath, '');
                  }}
                  title="Limpiar búsqueda"
                  className="absolute right-3 top-1/2 -translate-y-1/2 h-6 w-6 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                >
                  <X size={14} />
                </button>
              )}
            </form>

            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center bg-slate-50 p-1 rounded-2xl border border-slate-100">
                {([
                  { mode: 'grid', icon: <LayoutGrid size={16} />, title: 'Vista en cuadrícula' },
                  { mode: 'table', icon: <List size={16} />, title: 'Vista en lista' },
                ] as const).map((v) => (
                  <button
                    key={v.mode}
                    type="button"
                    onClick={() => setViewMode(v.mode)}
                    title={v.title}
                    className={`h-9 w-9 rounded-xl flex items-center justify-center transition-colors ${
                      viewMode === v.mode ? 'bg-[#004C6C] text-white shadow-sm' : 'text-slate-400 hover:text-slate-700'
                    }`}
                  >
                    {v.icon}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() => loadDirectory(currentPath, searchQuery, true)}
                disabled={loading}
                title="Actualizar desde el almacenamiento"
                className={`${toolButton} bg-slate-50 hover:bg-slate-100 text-slate-500 w-11 justify-center px-0`}
              >
                <RefreshCw size={16} className={loading ? 'animate-spin text-[#EE9D4C]' : ''} />
              </button>

              {permissions.is_admin && (
                <>
                  <button type="button" onClick={() => handleOpenRestrictions()} title="Restricciones por carpeta" className={`${toolButton} bg-slate-50 hover:bg-slate-100 text-slate-600`}>
                    <Shield size={16} className="text-[#004C6C]" /> <span className="hidden 2xl:inline">Restricciones</span>
                  </button>
                  <button type="button" onClick={() => setIsLogsOpen(true)} title="Auditoría" className={`${toolButton} bg-slate-50 hover:bg-slate-100 text-slate-600`}>
                    <History size={16} className="text-[#EE9D4C]" /> <span className="hidden 2xl:inline">Auditoría</span>
                  </button>
                  <button type="button" onClick={() => setIsSettingsOpen(true)} title="Configuración" className={`${toolButton} bg-slate-50 hover:bg-slate-100 text-slate-600`}>
                    <Settings size={16} className="text-slate-500" /> <span className="hidden 2xl:inline">Configuración</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Avisos */}
        <div className="px-5 pt-4 flex flex-col gap-3">
          <label className="flex items-center gap-2 text-[11px] font-bold text-slate-500 cursor-pointer select-none w-fit">
            <input
              type="checkbox"
              checked={searchInSubfolders}
              onChange={(e) => {
                setSearchInSubfolders(e.target.checked);
                if (searchQuery.trim()) loadDirectory(currentPath, searchQuery, false, e.target.checked);
              }}
              className="rounded text-[#004C6C] focus:ring-[#EE9D4C]"
            />
            Buscar también en subcarpetas
          </label>

          {browseData?.search && !loading && (
            <div className="p-3 px-4 bg-[#EE9D4C]/10 border border-[#EE9D4C]/20 rounded-2xl flex flex-col sm:flex-row sm:items-center gap-2 text-xs text-[#8a4f12] font-semibold">
              <Search className="w-4 h-4 shrink-0 hidden sm:block" />
              <span className="flex-1">
                <strong>{browseData.search.total_matches}</strong> resultado(s) para "<strong>{browseData.search.query}</strong>"{' '}
                {browseData.search.recursive ? 'en esta carpeta y sus subcarpetas' : 'en esta carpeta'}.
                {browseData.search.truncated &&
                  ` Se muestran los primeros ${browseData.total_folders + browseData.total_files}; agrega más palabras para afinar.`}
              </span>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  loadDirectory(currentPath, '');
                }}
                className="text-[11px] font-black uppercase tracking-widest hover:underline self-start sm:self-auto"
              >
                Ver toda la carpeta
              </button>
            </div>
          )}

          {isReadOnly && !loading && browseData && (
            <div className="p-3 px-4 bg-slate-50 border border-slate-100 rounded-2xl flex items-center gap-3 text-xs text-slate-600 font-semibold">
              <Info className="w-4 h-4 text-[#004C6C] shrink-0" />
              <span>
                Tienes acceso de <strong>solo lectura</strong> en esta carpeta: puedes abrir y descargar archivos, pero no modificarlos.
              </span>
            </div>
          )}
        </div>

        {/* Contenido */}
        <div className="p-5">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin text-[#004C6C]" />
              <p className="text-[10px] font-black uppercase tracking-widest">Cargando carpeta…</p>
            </div>
          ) : !browseData || (browseData.folders.length === 0 && browseData.files.length === 0) ? (
            <div className="py-16 text-center max-w-md mx-auto">
              <div className="h-20 w-20 rounded-[28px] bg-[#EE9D4C]/10 flex items-center justify-center mx-auto mb-5 text-[#EE9D4C]">
                <FolderOpen className="w-10 h-10" />
              </div>
              <h3 className="text-lg font-black text-[#004C6C] tracking-tight">
                {searchQuery ? 'Sin resultados' : 'Esta carpeta está vacía'}
              </h3>
              <p className="text-sm text-slate-400 mt-1 mb-6">
                {searchQuery
                  ? `No encontramos nada para "${searchQuery}".`
                  : permissions.can_upload
                    ? 'Sube archivos o crea una hoja de cálculo para empezar.'
                    : 'Aún no hay archivos ni subcarpetas aquí.'}
              </p>
              {!searchQuery && (
                <div className="flex flex-col sm:flex-row gap-2 justify-center">
                  {permissions.can_upload && (
                    <button
                      type="button"
                      onClick={() => setIsUploadOpen(true)}
                      className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl text-xs font-bold text-white bg-[#004C6C] hover:bg-[#003952] transition-colors shadow-sm"
                    >
                      <UploadCloud size={16} /> Subir archivos
                    </button>
                  )}
                  {officeEnabled && (
                    <button
                      type="button"
                      onClick={() => openNewFile('xlsx')}
                      className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl text-xs font-bold text-white bg-[#EE9D4C] hover:bg-[#e08a35] transition-colors shadow-sm"
                    >
                      <FileSpreadsheet size={16} /> Nueva hoja de cálculo
                    </button>
                  )}
                </div>
              )}
            </div>
          ) : viewMode === 'grid' ? (
            <div className="space-y-8">
              {browseData.folders.length > 0 && (
                <section className="space-y-3">
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Carpetas · {browseData.folders.length}
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-3">
                    {browseData.folders.map((folder) => (
                      <FolderCard
                        key={folder.path}
                        folder={folder}
                        permissions={permissions}
                        onOpen={handleNavigate}
                        onRename={(f) => openRename(f, 'folder')}
                        onDelete={(f) => openDelete(f, 'folder')}
                        onRestrict={handleRestrictFolder}
                      />
                    ))}
                  </div>
                </section>
              )}

              {browseData.files.length > 0 && (
                <section className="space-y-3">
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Archivos · {browseData.files.length}
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4">
                    {browseData.files.map((file) => (
                      <FileCard
                        key={file.path}
                        file={file}
                        permissions={permissions}
                        editorMode={editorModeFor(file)}
                        onOpenEditor={handleOpenEditor}
                        onPreview={openPreview}
                        onDownload={handleDownload}
                        onCopyLink={handleCopyLink}
                        onOpenLocation={handleNavigate}
                        onRename={(f) => openRename(f, 'file')}
                        onDelete={(f) => openDelete(f, 'file')}
                      />
                    ))}
                  </div>
                </section>
              )}
            </div>
          ) : (
            <FileTable
              folders={browseData.folders}
              files={browseData.files}
              permissions={permissions}
              editorModeFor={editorModeFor}
              onOpenEditor={handleOpenEditor}
              onOpenFolder={handleNavigate}
              onPreviewFile={openPreview}
              onDownloadFile={handleDownload}
              onCopyLink={handleCopyLink}
              onRenameFolder={(f) => openRename(f, 'folder')}
              onRenameFile={(f) => openRename(f, 'file')}
              onDeleteFolder={(f) => openDelete(f, 'folder')}
              onDeleteFile={(f) => openDelete(f, 'file')}
              onRestrictFolder={handleRestrictFolder}
            />
          )}
        </div>
      </div>

      {/* Modals */}
      <CreateFolderModal
        isOpen={isCreateFolderOpen}
        parentPath={currentPath}
        onClose={() => setIsCreateFolderOpen(false)}
        onSubmit={handleCreateFolder}
      />

      <NewOfficeFileModal
        isOpen={isNewFileOpen}
        initialType={newFileType}
        parentPath={currentPath}
        onClose={() => setIsNewFileOpen(false)}
        onSubmit={handleCreateOfficeFile}
      />

      <UploadModal
        isOpen={isUploadOpen}
        targetPath={currentPath}
        onClose={() => setIsUploadOpen(false)}
        onSubmit={handleUploadFiles}
        settings={settings}
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

      <FolderRestrictionsModal
        isOpen={isPermissionsOpen}
        initialFolderPath={restrictionTarget}
        currentPath={currentPath}
        restrictedFolders={restrictedFolders}
        roles={rolesList}
        projectFolders={projectFolders}
        projects={projectsList}
        onSaveProject={handleSaveFolderProject}
        onClose={() => setIsPermissionsOpen(false)}
        onSave={handleSaveRestriction}
        onNavigate={handleNavigate}
      />

      <DocumentalSettingsModal
        isOpen={isSettingsOpen}
        settings={settings}
        onClose={() => setIsSettingsOpen(false)}
        onSave={handleSaveSettings}
      />

      <DocumentLogsModal isOpen={isLogsOpen} onClose={() => setIsLogsOpen(false)} />
    </div>
  );
}
