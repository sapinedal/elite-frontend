import React from 'react';
import { Download, Eye, Link as LinkIcon, MoreVertical, Edit2, Trash2 } from 'lucide-react';
import type { FileItem, EffectivePermissions } from '../types/documental.types';
import { getFileIconConfig } from '../utils/fileIcons';

interface FileCardProps {
  file: FileItem;
  permissions: EffectivePermissions;
  onPreview: (file: FileItem) => void;
  onDownload: (file: FileItem) => void;
  onCopyLink: (file: FileItem) => void;
  onRename: (file: FileItem) => void;
  onDelete: (file: FileItem) => void;
}

export const FileCard: React.FC<FileCardProps> = ({
  file,
  permissions,
  onPreview,
  onDownload,
  onCopyLink,
  onRename,
  onDelete,
}) => {
  const [menuOpen, setMenuOpen] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);
  const iconConfig = getFileIconConfig(file.extension);

  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isPreviewable = ['pdf', 'png', 'jpg', 'jpeg', 'webp', 'gif', 'svg', 'txt', 'csv'].includes(
    file.extension.toLowerCase()
  );

  return (
    <div className="group relative bg-white border border-slate-200/80 hover:border-blue-400/80 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between">
      <div>
        {/* Header with icon and menu */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border ${iconConfig.colorClass}`}
            >
              {iconConfig.icon}
            </div>

            <div className="min-w-0 flex-1">
              <h4
                title={file.name}
                onClick={() => isPreviewable ? onPreview(file) : onDownload(file)}
                className="text-sm font-bold text-slate-800 hover:text-[#004C6C] truncate cursor-pointer transition-colors"
              >
                {file.name}
              </h4>
              <div className="flex items-center gap-2 mt-0.5">
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ${iconConfig.badgeBg} ${iconConfig.badgeText}`}
                >
                  {file.extension || 'FILE'}
                </span>
                <span className="text-[11px] font-semibold text-slate-400">{file.size_formatted}</span>
              </div>
            </div>
          </div>

          {/* Menu */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {menuOpen && (
              <div className="absolute right-0 top-7 w-40 bg-white border border-slate-100 rounded-xl shadow-xl py-1 z-20 animate-in fade-in zoom-in-95 duration-150">
                {isPreviewable && (
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      onPreview(file);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5 text-blue-500" />
                    <span>Previsualizar</span>
                  </button>
                )}

                <button
                  onClick={() => {
                    setMenuOpen(false);
                    onDownload(file);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Descargar</span>
                </button>

                <button
                  onClick={() => {
                    setMenuOpen(false);
                    onCopyLink(file);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  <LinkIcon className="w-3.5 h-3.5 text-slate-400" />
                  <span>Copiar enlace</span>
                </button>

                {permissions.can_upload && (
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      onRename(file);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    <Edit2 className="w-3.5 h-3.5 text-slate-400" />
                    <span>Renombrar</span>
                  </button>
                )}

                {permissions.can_delete && (
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      onDelete(file);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Eliminar</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Action Footer */}
      <div className="mt-4 pt-3 border-t border-slate-50 flex items-center justify-between">
        <span className="text-[10px] text-slate-400 font-medium truncate max-w-[120px]">
          {file.last_modified ? new Date(file.last_modified).toLocaleDateString() : ''}
        </span>

        <div className="flex items-center gap-1">
          {isPreviewable && (
            <button
              onClick={() => onPreview(file)}
              title="Previsualizar"
              className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            >
              <Eye className="w-4 h-4" />
            </button>
          )}

          <button
            onClick={() => onDownload(file)}
            title="Descargar archivo"
            className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
