import React, { useState } from 'react';
import { AlertTriangle, Trash2, X, Loader2 } from 'lucide-react';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  item: { name: string; path: string; type: 'file' | 'folder' } | null;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  isOpen,
  item,
  onClose,
  onConfirm,
}) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !item) return null;

  const isFolder = item.type === 'folder';

  const handleConfirm = async () => {
    try {
      setIsDeleting(true);
      setError(null);
      await onConfirm();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Error al eliminar el elemento');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-rose-50 text-rose-600 border border-rose-100">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Eliminar {isFolder ? 'Carpeta' : 'Archivo'}
              </h3>
              <p className="text-xs text-slate-400">Esta acción no se puede deshacer</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {error && (
            <div className="p-3 text-xs font-semibold text-rose-600 bg-rose-50 border border-rose-100 rounded-xl">
              {error}
            </div>
          )}

          <p className="text-sm text-slate-600">
            ¿Estás seguro de que deseas eliminar permanentemente{' '}
            {isFolder ? 'la carpeta' : 'el archivo'}{' '}
            <span className="font-bold text-slate-900 break-all">"{item.name}"</span>?
          </p>

          {isFolder && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-800 font-medium">
              ⚠️ Se eliminarán todos los archivos y subcarpetas contenidos en esta carpeta en el repositorio.
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isDeleting}
              className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={isDeleting}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-50 transition-all shadow-md shadow-rose-950/20"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Eliminando...</span>
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4" />
                  <span>Sí, Eliminar</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
