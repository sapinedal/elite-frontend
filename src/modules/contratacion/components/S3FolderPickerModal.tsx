import React, { useCallback, useEffect, useState } from 'react';
import { X, Folder, FolderOpen, ChevronRight, ChevronLeft, Loader2, Check } from 'lucide-react';
import { Portal } from '../../../components/ui/Portal';
import { useNotification } from '../../../context/NotificationContext';
import { contratacionService, getApiErrorMessage } from '../services/contratacionService';
import type { S3FolderListing } from '../types';

interface S3FolderPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Recibe la ruta elegida; el modal muestra el estado de guardado mientras la promesa no termina */
  onSelect: (path: string) => Promise<void>;
  title: string;
  description?: string;
  /** Contrato del que se toma el proyecto (carpetas visibles y carpeta inicial) */
  contractId: number | null;
  /** Carpeta en la que se abre; sin ella, la carpeta de contratos del proyecto */
  initialPath?: string | null;
}

/**
 * Explorador de carpetas del gestor documental (S3) para elegir una carpeta existente.
 * Solo navega dentro de la carpeta técnica y oculta las carpetas asignadas a otro proyecto.
 */
export const S3FolderPickerModal: React.FC<S3FolderPickerModalProps> = ({
  isOpen,
  onClose,
  onSelect,
  title,
  description,
  contractId,
  initialPath,
}) => {
  const { showNotification } = useNotification();
  const [listing, setListing] = useState<S3FolderListing | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async (path?: string | null) => {
    setLoading(true);
    try {
      setListing(await contratacionService.browseFolders(path, contractId));
    } catch (err) {
      // Si la carpeta inicial ya no existe o no es válida, se vuelve a la carpeta del proyecto
      if (path) {
        try {
          setListing(await contratacionService.browseFolders(null, contractId));
          return;
        } catch {
          // se informa el error original
        }
      }
      showNotification(getApiErrorMessage(err, 'Error al cargar las carpetas.'), 'error');
    } finally {
      setLoading(false);
    }
  }, [contractId, showNotification]);

  useEffect(() => {
    if (isOpen) {
      load(initialPath);
    } else {
      setListing(null);
    }
  }, [isOpen, initialPath, load]);

  const handleSelect = async () => {
    if (!listing) return;
    setSaving(true);
    try {
      await onSelect(listing.path);
    } finally {
      setSaving(false);
    }
  };

  // Migas de pan desde la raíz técnica: "tecnica / Contratos San Miguel / TORRE 2"
  const crumbs = (() => {
    if (!listing) return [];
    const relative = listing.path === listing.root ? '' : listing.path.slice(listing.root.length + 1);
    const parts = relative ? relative.split('/') : [];
    return [
      { name: listing.root, path: listing.root },
      ...parts.map((name, i) => ({ name, path: [listing.root, ...parts.slice(0, i + 1)].join('/') })),
    ];
  })();

  return (
    <Portal isOpen={isOpen} onClose={saving ? undefined : onClose}>
      <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
        <div className="bg-white w-full max-w-2xl rounded-[32px] shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
          <div className="p-6 border-b border-slate-100 flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h2 className="text-xl font-black text-[#004C6C] tracking-tight">{title}</h2>
              {description && <p className="text-xs font-bold text-slate-400 mt-1">{description}</p>}
            </div>
            <button onClick={onClose} disabled={saving} className="p-2 text-slate-300 hover:bg-slate-50 rounded-xl transition-all disabled:opacity-50" aria-label="Cerrar">
              <X size={22} />
            </button>
          </div>

          <div className="px-6 py-3 border-b border-slate-100 flex items-center gap-2 min-w-0">
            <button
              onClick={() => listing?.parent && load(listing.parent)}
              disabled={!listing?.parent || loading}
              className="p-1.5 text-[#004C6C] hover:bg-slate-50 rounded-lg disabled:opacity-30 shrink-0"
              aria-label="Subir un nivel"
              title="Subir un nivel"
            >
              <ChevronLeft size={16} />
            </button>
            <nav className="flex items-center gap-1 text-[11px] font-bold text-slate-500 overflow-x-auto whitespace-nowrap min-w-0">
              {crumbs.map((crumb, i) => (
                <React.Fragment key={crumb.path}>
                  {i > 0 && <ChevronRight size={12} className="text-slate-300 shrink-0" />}
                  <button
                    onClick={() => load(crumb.path)}
                    disabled={loading || i === crumbs.length - 1}
                    className={i === crumbs.length - 1 ? 'text-[#004C6C]' : 'hover:text-[#004C6C] hover:underline'}
                  >
                    {crumb.name}
                  </button>
                </React.Fragment>
              ))}
            </nav>
          </div>

          <div className="flex-1 overflow-y-auto p-4 min-h-[240px]">
            {loading ? (
              <div className="flex justify-center py-16 text-slate-400"><Loader2 className="animate-spin" /></div>
            ) : listing && listing.folders.length > 0 ? (
              <ul className="space-y-1">
                {listing.folders.map((folder) => (
                  <li key={folder.path}>
                    <button
                      onClick={() => load(folder.path)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-50 text-left group"
                    >
                      <Folder size={18} className="text-[#EE9D4C] shrink-0" />
                      <span className="text-sm font-bold text-slate-700 truncate flex-1" title={folder.name}>{folder.name}</span>
                      <ChevronRight size={14} className="text-slate-300 group-hover:text-slate-500 shrink-0" />
                    </button>
                  </li>
                ))}
              </ul>
            ) : listing ? (
              <p className="text-center text-xs font-bold text-slate-300 italic py-16">Esta carpeta no tiene subcarpetas.</p>
            ) : null}
          </div>

          <div className="p-5 border-t border-slate-100 flex items-center justify-between gap-3 bg-slate-50/60">
            <div className="flex items-center gap-2 min-w-0 text-[11px] font-bold text-slate-500">
              <FolderOpen size={14} className="text-[#004C6C] shrink-0" />
              <span className="truncate" title={listing?.path}>{listing?.path ?? ''}</span>
              {listing && <span className="shrink-0 text-slate-400">· {listing.files_count} archivo(s) en esta carpeta</span>}
            </div>
            <button
              onClick={handleSelect}
              disabled={!listing || loading || saving || listing.path === listing.root}
              className="flex items-center gap-2 text-xs font-black text-white bg-[#004C6C] hover:bg-[#003a52] px-4 py-2.5 rounded-xl transition-all disabled:opacity-50 shrink-0"
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
              Usar esta carpeta
            </button>
          </div>
        </div>
      </div>
    </Portal>
  );
};
