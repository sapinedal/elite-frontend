import React from 'react';
import { Download, Edit2, Eye, Link as LinkIcon, PencilLine, Trash2 } from 'lucide-react';
import type { FileItem, EffectivePermissions } from '../types/documental.types';
import { getFileIconConfig, isBrowserPreviewable } from '../utils/fileIcons';
import type { EditorCapability } from '../utils/editor';
import { ItemLocation } from './ItemLocation';
import { ActionMenu } from './ActionMenu';

interface FileCardProps {
  file: FileItem;
  permissions: EffectivePermissions;
  /** 'edit' / 'view' si el archivo se abre en el editor del navegador */
  editorMode: EditorCapability;
  onOpenEditor: (file: FileItem) => void;
  onPreview: (file: FileItem) => void;
  onDownload: (file: FileItem) => void;
  onCopyLink: (file: FileItem) => void;
  onRename: (file: FileItem) => void;
  onDelete: (file: FileItem) => void;
  onOpenLocation?: (path: string) => void;
}

export const formatFileDate = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' }) : '';

export const FileCard: React.FC<FileCardProps> = ({
  file,
  permissions,
  editorMode,
  onOpenEditor,
  onPreview,
  onDownload,
  onCopyLink,
  onRename,
  onDelete,
  onOpenLocation,
}) => {
  const iconConfig = getFileIconConfig(file.extension, 'w-7 h-7');
  const canPreview = isBrowserPreviewable(file.extension);
  const canEdit = editorMode === 'edit' && permissions.can_upload;

  // Acción principal: editor (como Google Drive) > vista previa > descarga
  const primary = editorMode
    ? { label: canEdit ? 'Abrir y editar' : 'Abrir', icon: canEdit ? <PencilLine size={14} /> : <Eye size={14} />, run: () => onOpenEditor(file) }
    : canPreview
      ? { label: 'Vista previa', icon: <Eye size={14} />, run: () => onPreview(file) }
      : { label: 'Descargar', icon: <Download size={14} />, run: () => onDownload(file) };

  return (
    <div
      onDoubleClick={primary.run}
      className="group relative bg-white rounded-[28px] border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 overflow-hidden flex flex-col"
    >
      <div className="h-1.5 w-full" style={{ backgroundColor: iconConfig.accent }} />

      <div className="p-5 flex-1 flex flex-col">
        <div className="flex items-start justify-between gap-2">
          <div className={`h-14 w-14 rounded-2xl border flex items-center justify-center shrink-0 ${iconConfig.colorClass}`}>
            {iconConfig.icon}
          </div>
          <ActionMenu
            items={[
              { key: 'editor', label: canEdit ? 'Abrir y editar' : 'Abrir en el visor', icon: canEdit ? <PencilLine size={14} className="text-[#EE9D4C]" /> : <Eye size={14} className="text-[#004C6C]" />, onClick: () => onOpenEditor(file), hidden: !editorMode },
              { key: 'preview', label: 'Vista previa', icon: <Eye size={14} className="text-[#004C6C]" />, onClick: () => onPreview(file), hidden: !canPreview || !!editorMode },
              { key: 'download', label: 'Descargar', icon: <Download size={14} className="text-emerald-600" />, onClick: () => onDownload(file) },
              { key: 'link', label: 'Copiar enlace', icon: <LinkIcon size={14} className="text-slate-400" />, onClick: () => onCopyLink(file) },
              { key: 'rename', label: 'Renombrar', icon: <Edit2 size={14} className="text-slate-400" />, onClick: () => onRename(file), hidden: !permissions.can_rename },
              { key: 'delete', label: 'Eliminar', icon: <Trash2 size={14} />, onClick: () => onDelete(file), danger: true, hidden: !permissions.can_delete },
            ]}
          />
        </div>

        <h4
          title={file.name}
          onClick={primary.run}
          className="mt-4 text-sm font-black text-slate-800 leading-snug line-clamp-2 break-words cursor-pointer hover:text-[#004C6C] transition-colors"
        >
          {file.name}
        </h4>
        <ItemLocation location={file.location} onOpen={onOpenLocation} />

        <div className="mt-auto pt-3 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
          <span className={`px-2 py-0.5 rounded-lg ${iconConfig.badgeBg} ${iconConfig.badgeText}`}>{file.extension || 'archivo'}</span>
          <span>{file.size_formatted}</span>
          {file.last_modified && <span className="truncate normal-case tracking-normal font-bold">· {formatFileDate(file.last_modified)}</span>}
        </div>
      </div>

      <div className="px-5 pb-5 flex items-center gap-2">
        <button
          type="button"
          onClick={primary.run}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-2xl text-xs font-bold transition-all ${
            canEdit
              ? 'bg-[#004C6C] hover:bg-[#003952] text-white shadow-md shadow-sky-950/10'
              : 'bg-slate-50 hover:bg-slate-100 text-[#004C6C]'
          }`}
        >
          {primary.icon}
          {primary.label}
        </button>
        {primary.label !== 'Descargar' && (
          <button
            type="button"
            onClick={() => onDownload(file)}
            title="Descargar"
            className="h-10 w-10 shrink-0 rounded-2xl bg-slate-50 hover:bg-emerald-50 text-slate-400 hover:text-emerald-600 flex items-center justify-center transition-colors"
          >
            <Download size={16} />
          </button>
        )}
      </div>
    </div>
  );
};
