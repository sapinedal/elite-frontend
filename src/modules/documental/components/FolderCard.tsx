import React from 'react';
import { Folder, MoreVertical, Edit2, Trash2, Lock } from 'lucide-react';
import type { FolderItem, EffectivePermissions } from '../types/documental.types';
import { ItemLocation } from './ItemLocation';

interface FolderCardProps {
  folder: FolderItem;
  permissions: EffectivePermissions;
  onOpen: (path: string) => void;
  onRename: (folder: FolderItem) => void;
  onDelete: (folder: FolderItem) => void;
  onRestrict: (folder: FolderItem) => void;
}

export const FolderCard: React.FC<FolderCardProps> = ({
  folder,
  permissions,
  onOpen,
  onRename,
  onDelete,
  onRestrict,
}) => {
  const [menuOpen, setMenuOpen] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div
      onDoubleClick={() => onOpen(folder.path)}
      className="group relative bg-white border border-slate-200/80 hover:border-amber-400/80 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between cursor-pointer select-none"
    >
      <div className="flex items-start justify-between gap-2">
        <div
          onClick={() => onOpen(folder.path)}
          className="flex items-center gap-3 min-w-0 flex-1"
        >
          <div className="relative w-12 h-12 rounded-xl bg-amber-50 group-hover:bg-amber-100/80 border border-amber-100 flex items-center justify-center shrink-0 transition-colors">
            <Folder className="w-6 h-6 text-amber-500 fill-amber-500/20" />
            {folder.restricted && (
              <span
                title="Carpeta restringida a ciertos roles"
                className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-indigo-600 border-2 border-white flex items-center justify-center"
              >
                <Lock className="w-2.5 h-2.5 text-white" />
              </span>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h4
              title={folder.name}
              className="text-sm font-bold text-slate-800 group-hover:text-[#004C6C] truncate transition-colors"
            >
              {folder.name}
            </h4>
            <ItemLocation location={folder.location} onOpen={onOpen} />
            <span className="text-[11px] font-medium text-slate-400">
              {folder.restricted ? 'Carpeta restringida' : 'Carpeta'}
            </span>
          </div>
        </div>

        {/* Action Menu */}
        {(permissions.can_rename || permissions.can_delete || permissions.is_admin) && (
          <div className="relative" ref={menuRef}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setMenuOpen(!menuOpen);
              }}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {menuOpen && (
              <div className="absolute right-0 top-7 w-44 bg-white border border-slate-100 rounded-xl shadow-xl py-1 z-20 animate-in fade-in zoom-in-95 duration-150">
                {permissions.can_rename && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setMenuOpen(false);
                      onRename(folder);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    <Edit2 className="w-3.5 h-3.5 text-slate-400" />
                    <span>Renombrar</span>
                  </button>
                )}

                {permissions.is_admin && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setMenuOpen(false);
                      onRestrict(folder);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    <Lock className="w-3.5 h-3.5 text-indigo-500" />
                    <span>{folder.restricted ? 'Editar restricción' : 'Restringir acceso'}</span>
                  </button>
                )}

                {permissions.can_delete && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setMenuOpen(false);
                      onDelete(folder);
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
        )}
      </div>

      <div
        onClick={() => onOpen(folder.path)}
        className="mt-3 pt-2.5 border-t border-slate-50 flex items-center justify-between text-[11px] font-semibold text-slate-400 group-hover:text-amber-600 transition-colors"
      >
        <span>Abrir carpeta</span>
        <span className="text-amber-500">→</span>
      </div>
    </div>
  );
};
