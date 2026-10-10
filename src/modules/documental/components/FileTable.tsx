import React from 'react';
import {
  Folder,
  Download,
  Eye,
  Link as LinkIcon,
  Edit2,
  Trash2,
  ArrowRight
} from 'lucide-react';
import type { FolderItem, FileItem, EffectivePermissions } from '../types/documental.types';
import { getFileIconConfig } from '../utils/fileIcons';

interface FileTableProps {
  folders: FolderItem[];
  files: FileItem[];
  permissions: EffectivePermissions;
  onOpenFolder: (path: string) => void;
  onPreviewFile: (file: FileItem) => void;
  onDownloadFile: (file: FileItem) => void;
  onCopyLink: (file: FileItem) => void;
  onRenameFolder: (folder: FolderItem) => void;
  onRenameFile: (file: FileItem) => void;
  onDeleteFolder: (folder: FolderItem) => void;
  onDeleteFile: (file: FileItem) => void;
}

export const FileTable: React.FC<FileTableProps> = ({
  folders,
  files,
  permissions,
  onOpenFolder,
  onPreviewFile,
  onDownloadFile,
  onCopyLink,
  onRenameFolder,
  onRenameFile,
  onDeleteFolder,
  onDeleteFile,
}) => {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="bg-slate-50/75 border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              <th className="py-3.5 px-4">Nombre</th>
              <th className="py-3.5 px-4">Tipo</th>
              <th className="py-3.5 px-4">Tamaño</th>
              <th className="py-3.5 px-4">Última Modificación</th>
              <th className="py-3.5 px-4 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium">
            {/* Carpetas */}
            {folders.map((folder) => (
              <tr
                key={folder.path}
                onDoubleClick={() => onOpenFolder(folder.path)}
                className="hover:bg-amber-50/40 transition-colors group cursor-pointer"
              >
                <td className="py-3 px-4">
                  <div
                    onClick={() => onOpenFolder(folder.path)}
                    className="flex items-center gap-3"
                  >
                    <div className="w-8 h-8 rounded-lg bg-amber-50 border border-amber-100 flex items-center justify-center shrink-0">
                      <Folder className="w-4 h-4 text-amber-500 fill-amber-500/20" />
                    </div>
                    <span className="font-bold text-slate-800 group-hover:text-[#004C6C] truncate max-w-md">
                      {folder.name}
                    </span>
                  </div>
                </td>
                <td className="py-3 px-4 text-xs text-slate-400">Carpeta</td>
                <td className="py-3 px-4 text-xs text-slate-400">—</td>
                <td className="py-3 px-4 text-xs text-slate-400">—</td>
                <td className="py-3 px-4 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => onOpenFolder(folder.path)}
                      title="Abrir carpeta"
                      className="p-1.5 text-slate-400 hover:text-[#004C6C] hover:bg-slate-100 rounded-lg transition-colors"
                    >
                      <ArrowRight className="w-4 h-4" />
                    </button>

                    {permissions.can_upload && (
                      <button
                        onClick={() => onRenameFolder(folder)}
                        title="Renombrar"
                        className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {permissions.can_delete && (
                      <button
                        onClick={() => onDeleteFolder(folder)}
                        title="Eliminar"
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}

            {/* Archivos */}
            {files.map((file) => {
              const iconConfig = getFileIconConfig(file.extension);
              const isPreviewable = ['pdf', 'png', 'jpg', 'jpeg', 'webp', 'gif', 'svg', 'txt', 'csv'].includes(
                file.extension.toLowerCase()
              );

              return (
                <tr
                  key={file.path}
                  className="hover:bg-slate-50 transition-colors group"
                >
                  <td className="py-3 px-4">
                    <div
                      onClick={() => isPreviewable ? onPreviewFile(file) : onDownloadFile(file)}
                      className="flex items-center gap-3 cursor-pointer"
                    >
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border ${iconConfig.colorClass}`}
                      >
                        {React.cloneElement(iconConfig.icon as React.ReactElement<any>, { className: 'w-4 h-4' })}
                      </div>
                      <span className="font-semibold text-slate-800 hover:text-[#004C6C] truncate max-w-md">
                        {file.name}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${iconConfig.badgeBg} ${iconConfig.badgeText}`}
                    >
                      {file.extension || 'FILE'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-xs font-mono text-slate-600">
                    {file.size_formatted}
                  </td>
                  <td className="py-3 px-4 text-xs text-slate-400">
                    {file.last_modified
                      ? new Date(file.last_modified).toLocaleDateString() +
                        ' ' +
                        new Date(file.last_modified).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                      : '—'}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      {isPreviewable && (
                        <button
                          onClick={() => onPreviewFile(file)}
                          title="Previsualizar"
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      )}

                      <button
                        onClick={() => onDownloadFile(file)}
                        title="Descargar"
                        className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                      >
                        <Download className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => onCopyLink(file)}
                        title="Copiar enlace"
                        className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                      >
                        <LinkIcon className="w-3.5 h-3.5" />
                      </button>

                      {permissions.can_upload && (
                        <button
                          onClick={() => onRenameFile(file)}
                          title="Renombrar"
                          className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {permissions.can_delete && (
                        <button
                          onClick={() => onDeleteFile(file)}
                          title="Eliminar"
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
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
