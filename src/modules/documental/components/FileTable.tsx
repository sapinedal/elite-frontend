import React from 'react';
import { Building2, Download, Edit2, Eye, Folder, Link as LinkIcon, Lock, PencilLine, Trash2 } from 'lucide-react';
import type { FolderItem, FileItem, EffectivePermissions } from '../types/documental.types';
import { useProject } from '../../../context/ProjectContext';
import { getFileIconConfig, isBrowserPreviewable } from '../utils/fileIcons';
import type { EditorCapability } from '../utils/editor';
import { ItemLocation } from './ItemLocation';
import { ActionMenu } from './ActionMenu';

interface FileTableProps {
  folders: FolderItem[];
  files: FileItem[];
  permissions: EffectivePermissions;
  editorModeFor: (file: FileItem) => EditorCapability;
  onOpenEditor: (file: FileItem) => void;
  onOpenFolder: (path: string) => void;
  onPreviewFile: (file: FileItem) => void;
  onDownloadFile: (file: FileItem) => void;
  onCopyLink: (file: FileItem) => void;
  onRenameFolder: (folder: FolderItem) => void;
  onRenameFile: (file: FileItem) => void;
  onDeleteFolder: (folder: FolderItem) => void;
  onDeleteFile: (file: FileItem) => void;
  onRestrictFolder: (folder: FolderItem) => void;
}

const formatDateTime = (iso: string | null) =>
  iso
    ? new Date(iso).toLocaleString('es-CO', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    : '—';

export const FileTable: React.FC<FileTableProps> = ({
  folders,
  files,
  permissions,
  editorModeFor,
  onOpenEditor,
  onOpenFolder,
  onPreviewFile,
  onDownloadFile,
  onCopyLink,
  onRenameFolder,
  onRenameFile,
  onDeleteFolder,
  onDeleteFile,
  onRestrictFolder,
}) => {
  const { projects } = useProject();
  const projectName = (id?: number | null) => (id ? projects.find((p) => p.id === id)?.name : null);

  return (
    <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-widest">
              <th className="py-4 px-5">Nombre</th>
              <th className="py-4 px-5 hidden md:table-cell">Tipo</th>
              <th className="py-4 px-5 hidden sm:table-cell">Tamaño</th>
              <th className="py-4 px-5 hidden lg:table-cell">Modificado</th>
              <th className="py-4 px-5 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {folders.map((folder) => (
              <tr
                key={folder.path}
                onClick={() => onOpenFolder(folder.path)}
                className="hover:bg-[#EE9D4C]/5 transition-colors group cursor-pointer"
              >
                <td className="py-3 px-5">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="relative h-9 w-9 rounded-xl bg-[#EE9D4C]/10 flex items-center justify-center shrink-0">
                      <Folder className="w-4 h-4 text-[#EE9D4C] fill-[#EE9D4C]/25" />
                      {folder.restricted && (
                        <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-[#004C6C] border-2 border-white flex items-center justify-center">
                          <Lock className="w-2 h-2 text-white" />
                        </span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <span className="block font-bold text-slate-800 group-hover:text-[#004C6C] truncate max-w-md">{folder.name}</span>
                      <ItemLocation location={folder.location} onOpen={onOpenFolder} />
                    </div>
                  </div>
                </td>
                <td className="py-3 px-5 hidden md:table-cell">
                  {projectName(folder.project_id) ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-[#004C6C]">
                      <Building2 size={11} /> {projectName(folder.project_id)}
                    </span>
                  ) : (
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Carpeta</span>
                  )}
                </td>
                <td className="py-3 px-5 text-xs text-slate-300 hidden sm:table-cell">—</td>
                <td className="py-3 px-5 text-xs text-slate-300 hidden lg:table-cell">—</td>
                <td className="py-3 px-5">
                  <div className="flex justify-end">
                    <ActionMenu
                      items={[
                        { key: 'rename', label: 'Renombrar', icon: <Edit2 size={14} className="text-slate-400" />, onClick: () => onRenameFolder(folder), hidden: !permissions.can_rename },
                        { key: 'restrict', label: 'Acceso y proyecto', icon: <Lock size={14} className="text-[#004C6C]" />, onClick: () => onRestrictFolder(folder), hidden: !permissions.is_admin },
                        { key: 'delete', label: 'Eliminar', icon: <Trash2 size={14} />, onClick: () => onDeleteFolder(folder), danger: true, hidden: !permissions.can_delete },
                      ]}
                    />
                  </div>
                </td>
              </tr>
            ))}

            {files.map((file) => {
              const iconConfig = getFileIconConfig(file.extension, 'w-4 h-4');
              const editorMode = editorModeFor(file);
              const canEdit = editorMode === 'edit' && permissions.can_upload;
              const canPreview = isBrowserPreviewable(file.extension);
              const open = () => (editorMode ? onOpenEditor(file) : canPreview ? onPreviewFile(file) : onDownloadFile(file));

              return (
                <tr key={file.path} onDoubleClick={open} className="hover:bg-slate-50/80 transition-colors group">
                  <td className="py-3 px-5">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`h-9 w-9 rounded-xl border flex items-center justify-center shrink-0 ${iconConfig.colorClass}`}>
                        {iconConfig.icon}
                      </div>
                      <div className="min-w-0">
                        <button
                          type="button"
                          onClick={open}
                          className="block text-left font-bold text-slate-800 hover:text-[#004C6C] truncate max-w-md"
                          title={file.name}
                        >
                          {file.name}
                        </button>
                        <ItemLocation location={file.location} onOpen={onOpenFolder} />
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-5 hidden md:table-cell">
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-lg uppercase tracking-widest ${iconConfig.badgeBg} ${iconConfig.badgeText}`}>
                      {file.extension || 'archivo'}
                    </span>
                  </td>
                  <td className="py-3 px-5 text-xs font-bold text-slate-500 hidden sm:table-cell">{file.size_formatted}</td>
                  <td className="py-3 px-5 text-xs font-semibold text-slate-400 hidden lg:table-cell">{formatDateTime(file.last_modified)}</td>
                  <td className="py-3 px-5">
                    <div className="flex items-center justify-end gap-1">
                      {editorMode && (
                        <button
                          type="button"
                          onClick={() => onOpenEditor(file)}
                          className={`hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl text-[11px] font-bold transition-colors ${
                            canEdit ? 'bg-[#004C6C] hover:bg-[#003952] text-white' : 'bg-slate-50 hover:bg-slate-100 text-[#004C6C]'
                          }`}
                        >
                          {canEdit ? <PencilLine size={13} /> : <Eye size={13} />}
                          {canEdit ? 'Editar' : 'Abrir'}
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => onDownloadFile(file)}
                        title="Descargar"
                        className="h-8 w-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
                      >
                        <Download size={15} />
                      </button>
                      <ActionMenu
                        items={[
                          { key: 'editor', label: canEdit ? 'Abrir y editar' : 'Abrir en el visor', icon: canEdit ? <PencilLine size={14} className="text-[#EE9D4C]" /> : <Eye size={14} className="text-[#004C6C]" />, onClick: () => onOpenEditor(file), hidden: !editorMode },
                          { key: 'preview', label: 'Vista previa', icon: <Eye size={14} className="text-[#004C6C]" />, onClick: () => onPreviewFile(file), hidden: !canPreview || !!editorMode },
                          { key: 'link', label: 'Copiar enlace', icon: <LinkIcon size={14} className="text-slate-400" />, onClick: () => onCopyLink(file) },
                          { key: 'rename', label: 'Renombrar', icon: <Edit2 size={14} className="text-slate-400" />, onClick: () => onRenameFile(file), hidden: !permissions.can_rename },
                          { key: 'delete', label: 'Eliminar', icon: <Trash2 size={14} />, onClick: () => onDeleteFile(file), danger: true, hidden: !permissions.can_delete },
                        ]}
                      />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
