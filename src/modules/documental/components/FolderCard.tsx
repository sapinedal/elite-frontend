import React from 'react';
import { Building2, ChevronRight, Edit2, Folder, Lock, Trash2 } from 'lucide-react';
import type { FolderItem, EffectivePermissions } from '../types/documental.types';
import { ItemLocation } from './ItemLocation';
import { ActionMenu } from './ActionMenu';
import { useProject } from '../../../context/ProjectContext';

interface FolderCardProps {
  folder: FolderItem;
  permissions: EffectivePermissions;
  onOpen: (path: string) => void;
  onRename: (folder: FolderItem) => void;
  onDelete: (folder: FolderItem) => void;
  onRestrict: (folder: FolderItem) => void;
}

export const FolderCard: React.FC<FolderCardProps> = ({ folder, permissions, onOpen, onRename, onDelete, onRestrict }) => {
  const { projects } = useProject();
  const projectName = folder.project_id ? projects.find((p) => p.id === folder.project_id)?.name : null;

  return (
    <div
      onClick={() => onOpen(folder.path)}
      className="group relative bg-white rounded-[24px] border border-slate-100 shadow-sm hover:shadow-lg hover:border-[#EE9D4C]/40 hover:-translate-y-0.5 transition-all duration-200 p-4 flex items-center gap-3 cursor-pointer select-none"
    >
      <div className="relative h-12 w-12 rounded-2xl bg-[#EE9D4C]/10 group-hover:bg-[#EE9D4C]/20 flex items-center justify-center shrink-0 transition-colors">
        <Folder className="w-6 h-6 text-[#EE9D4C] fill-[#EE9D4C]/25" />
        {folder.restricted && (
          <span
            title="Carpeta restringida a ciertos roles"
            className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-[#004C6C] border-2 border-white flex items-center justify-center"
          >
            <Lock className="w-2.5 h-2.5 text-white" />
          </span>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <h4 title={folder.name} className="text-sm font-black text-slate-800 group-hover:text-[#004C6C] truncate transition-colors">
          {folder.name}
        </h4>
        <ItemLocation location={folder.location} onOpen={onOpen} />
        <div className="flex items-center gap-1.5 mt-0.5 min-w-0">
          {projectName ? (
            <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-[#004C6C] truncate">
              <Building2 size={11} className="shrink-0" /> {projectName}
            </span>
          ) : (
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
              {folder.restricted ? 'Restringida' : 'Carpeta'}
            </span>
          )}
        </div>
      </div>

      <ActionMenu
        className="opacity-100 md:opacity-0 md:group-hover:opacity-100 focus-within:opacity-100 transition-opacity"
        items={[
          { key: 'rename', label: 'Renombrar', icon: <Edit2 size={14} className="text-slate-400" />, onClick: () => onRename(folder), hidden: !permissions.can_rename },
          { key: 'restrict', label: 'Acceso y proyecto', icon: <Lock size={14} className="text-[#004C6C]" />, onClick: () => onRestrict(folder), hidden: !permissions.is_admin },
          { key: 'delete', label: 'Eliminar', icon: <Trash2 size={14} />, onClick: () => onDelete(folder), danger: true, hidden: !permissions.can_delete },
        ]}
      />
      <ChevronRight size={16} className="text-slate-300 group-hover:text-[#EE9D4C] shrink-0 transition-colors" />
    </div>
  );
};
