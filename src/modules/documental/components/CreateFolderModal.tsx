import React, { useState } from 'react';
import { FolderPlus, X, Loader2 } from 'lucide-react';

interface CreateFolderModalProps {
  isOpen: boolean;
  parentPath: string;
  onClose: () => void;
  onSubmit: (folderName: string) => Promise<void>;
}

export const CreateFolderModal: React.FC<CreateFolderModalProps> = ({
  isOpen,
  parentPath,
  onClose,
  onSubmit,
}) => {
  const [folderName, setFolderName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = folderName.trim();
    if (!trimmed) {
      setError('El nombre de la carpeta no puede estar vacío.');
      return;
    }
    if (/[/\\:*?"<>|]/.test(trimmed)) {
      setError('El nombre no puede contener caracteres como / \\ : * ? " < > |');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      await onSubmit(trimmed);
      setFolderName('');
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Error al crear la carpeta');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-50 text-amber-600 border border-amber-100">
              <FolderPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Nueva Carpeta</h3>
              <p className="text-xs text-slate-400 truncate max-w-[240px]">
                En: {parentPath || 'Raíz del Space'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 text-xs font-semibold text-rose-600 bg-rose-50 border border-rose-100 rounded-xl">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Nombre de la Carpeta
            </label>
            <input
              type="text"
              autoFocus
              value={folderName}
              onChange={(e) => setFolderName(e.target.value)}
              placeholder="Ej: Contratos 2026, Facturas..."
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#EE9D4C] focus:bg-white transition-all"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !folderName.trim()}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-[#004C6C] hover:bg-[#003952] disabled:opacity-50 transition-all shadow-md shadow-sky-950/20"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Creando...</span>
                </>
              ) : (
                <span>Crear Carpeta</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
