import React from 'react';
import { ArrowLeft, ChevronRight, HardDrive } from 'lucide-react';
import type { BreadcrumbItem } from '../types/documental.types';

interface BreadcrumbNavProps {
  breadcrumbs: BreadcrumbItem[];
  parentPath: string | null;
  onNavigate: (path: string) => void;
}

/** Ruta de la carpeta actual (la raíz se muestra como "Repositorio") */
export const BreadcrumbNav: React.FC<BreadcrumbNavProps> = ({ breadcrumbs, parentPath, onNavigate }) => (
  <nav className="flex items-center gap-2 min-w-0" aria-label="Ruta de la carpeta">
    {parentPath !== null && (
      <button
        type="button"
        onClick={() => onNavigate(parentPath)}
        title="Subir un nivel"
        className="h-9 w-9 shrink-0 rounded-xl bg-slate-50 hover:bg-[#004C6C] text-[#004C6C] hover:text-white flex items-center justify-center transition-colors"
      >
        <ArrowLeft size={16} />
      </button>
    )}

    <ol className="flex items-center flex-wrap gap-1 min-w-0">
      {breadcrumbs.map((crumb, idx) => {
        const isLast = idx === breadcrumbs.length - 1;
        const isRoot = idx === 0;

        return (
          <React.Fragment key={crumb.path || 'root'}>
            {idx > 0 && <ChevronRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />}
            <li className="min-w-0">
              <button
                type="button"
                onClick={() => !isLast && onNavigate(crumb.path)}
                disabled={isLast}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold max-w-[220px] transition-colors ${
                  isLast ? 'text-[#004C6C] bg-[#004C6C]/5 cursor-default' : 'text-slate-500 hover:text-[#004C6C] hover:bg-slate-50'
                }`}
              >
                {isRoot && <HardDrive className="w-3.5 h-3.5 shrink-0" />}
                <span className="truncate">{isRoot ? 'Repositorio' : crumb.name}</span>
              </button>
            </li>
          </React.Fragment>
        );
      })}
    </ol>
  </nav>
);
