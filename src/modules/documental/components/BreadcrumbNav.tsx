import React from 'react';
import { ChevronRight, Home, ArrowLeft, Folder, HardDrive } from 'lucide-react';
import type { BreadcrumbItem } from '../types/documental.types';

interface BreadcrumbNavProps {
  breadcrumbs: BreadcrumbItem[];
  parentPath: string | null;
  onNavigate: (path: string) => void;
  totalFolders: number;
  totalFiles: number;
  totalSizeFormatted: string;
}

export const BreadcrumbNav: React.FC<BreadcrumbNavProps> = ({
  breadcrumbs,
  parentPath,
  onNavigate,
  totalFolders,
  totalFiles,
  totalSizeFormatted,
}) => {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
      {/* Path list */}
      <div className="flex items-center flex-wrap gap-1.5 min-w-0">
        {parentPath !== null && (
          <button
            onClick={() => onNavigate(parentPath)}
            title="Subir un nivel"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-[#004C6C] bg-sky-50 hover:bg-sky-100 rounded-xl transition-all mr-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Atrás</span>
          </button>
        )}

        {breadcrumbs.map((crumb, idx) => {
          const isLast = idx === breadcrumbs.length - 1;
          const isRoot = idx === 0;

          return (
            <React.Fragment key={crumb.path || 'root'}>
              {idx > 0 && <ChevronRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />}

              <button
                onClick={() => !isLast && onNavigate(crumb.path)}
                disabled={isLast}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold transition-all max-w-[200px] truncate ${
                  isLast
                    ? 'bg-slate-100 text-slate-800 cursor-default'
                    : 'text-slate-500 hover:text-[#004C6C] hover:bg-slate-50 cursor-pointer'
                }`}
              >
                {isRoot ? (
                  <Home className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                ) : (
                  <Folder className="w-3.5 h-3.5 shrink-0 text-amber-500" />
                )}
                <span className="truncate">{crumb.name}</span>
              </button>
            </React.Fragment>
          );
        })}
      </div>

      {/* Directory Counters */}
      <div className="flex items-center gap-3 text-xs font-semibold text-slate-500 shrink-0">
        <span className="flex items-center gap-1 bg-amber-50 text-amber-700 px-2.5 py-1 rounded-xl border border-amber-100">
          <Folder className="w-3.5 h-3.5" />
          {totalFolders} {totalFolders === 1 ? 'carpeta' : 'carpetas'}
        </span>
        <span className="flex items-center gap-1 bg-blue-50 text-blue-700 px-2.5 py-1 rounded-xl border border-blue-100">
          <HardDrive className="w-3.5 h-3.5" />
          {totalFiles} {totalFiles === 1 ? 'archivo' : 'archivos'}
        </span>
        {totalFiles > 0 && (
          <span className="bg-slate-100 text-slate-600 px-2.5 py-1 rounded-xl font-mono">
            {totalSizeFormatted}
          </span>
        )}
      </div>
    </div>
  );
};
