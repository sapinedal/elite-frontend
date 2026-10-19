import React from 'react';
import { FolderOpen } from 'lucide-react';

interface ItemLocationProps {
  /** Carpeta que contiene el elemento ('' = raíz). Solo llega en resultados de búsqueda en subcarpetas. */
  location?: string;
  onOpen?: (path: string) => void;
}

/** Muestra dónde está un resultado de búsqueda y permite ir a esa carpeta. */
export const ItemLocation: React.FC<ItemLocationProps> = ({ location, onOpen }) => {
  if (location === undefined) return null;

  const label = location === '' ? 'Raíz' : location.replace(/^migracion-google-drive\/?/, '') || 'migracion-google-drive';

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onOpen?.(location);
      }}
      title={`Ir a ${location || 'Raíz'}`}
      className="flex items-center gap-1 max-w-full text-[10px] font-semibold text-slate-400 hover:text-[#004C6C] hover:underline text-left"
    >
      <FolderOpen className="w-3 h-3 shrink-0" />
      <span className="truncate">{label}</span>
    </button>
  );
};
