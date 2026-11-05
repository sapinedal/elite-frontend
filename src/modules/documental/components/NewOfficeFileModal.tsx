import React, { useEffect, useState } from 'react';
import { FileSpreadsheet, FileText, Loader2, Presentation, Sparkles, X } from 'lucide-react';
import type { OfficeFileType } from '../types/documental.types';
import { getErrorMessage } from '../../../lib/apiError';
import { useEscapeToClose } from '../../../hooks/useEscapeToClose';

interface NewOfficeFileModalProps {
  isOpen: boolean;
  initialType: OfficeFileType;
  parentPath: string;
  onClose: () => void;
  /** Crea el archivo; el padre lo abre en el editor */
  onSubmit: (name: string, type: OfficeFileType) => Promise<void>;
}

const TYPES: Array<{ type: OfficeFileType; label: string; hint: string; icon: React.ElementType; tone: string; ring: string }> = [
  { type: 'xlsx', label: 'Hoja de cálculo', hint: 'Excel (.xlsx)', icon: FileSpreadsheet, tone: 'text-emerald-600 bg-emerald-50 border-emerald-100', ring: 'ring-emerald-500 border-emerald-300' },
  { type: 'docx', label: 'Documento', hint: 'Word (.docx)', icon: FileText, tone: 'text-[#004C6C] bg-sky-50 border-sky-100', ring: 'ring-[#004C6C] border-sky-300' },
  { type: 'pptx', label: 'Presentación', hint: 'PowerPoint (.pptx)', icon: Presentation, tone: 'text-[#D97F2A] bg-orange-50 border-orange-100', ring: 'ring-[#EE9D4C] border-orange-300' },
];

export const NewOfficeFileModal: React.FC<NewOfficeFileModalProps> = ({ isOpen, initialType, parentPath, onClose, onSubmit }) => {
  useEscapeToClose(isOpen, onClose);

  const [type, setType] = useState<OfficeFileType>(initialType);
  const [name, setName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setType(initialType);
    setName('');
    setError(null);
  }, [isOpen, initialType]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError('Escribe un nombre para el archivo.');
      return;
    }
    if (/[/\\:*?"<>|]/.test(trimmed) || trimmed.startsWith('.')) {
      setError('El nombre no puede empezar con punto ni contener / \\ : * ? " < > |');
      return;
    }
    try {
      setIsSubmitting(true);
      setError(null);
      await onSubmit(trimmed, type);
      onClose();
    } catch (err) {
      setError(getErrorMessage(err, 'No fue posible crear el archivo.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-lg rounded-[32px] shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-6 bg-gradient-to-r from-[#004C6C] via-[#005981] to-[#003850] text-white">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-11 w-11 rounded-2xl bg-white/10 border border-white/10 flex items-center justify-center shrink-0">
              <Sparkles size={20} className="text-[#EE9D4C]" />
            </div>
            <div className="min-w-0">
              <h3 className="text-base font-black tracking-tight">Nuevo archivo</h3>
              <p className="text-[10px] font-bold text-white/60 uppercase tracking-widest truncate">
                En: {parentPath || 'Raíz del repositorio'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="p-3 text-xs font-semibold text-rose-600 bg-rose-50 border border-rose-100 rounded-2xl">{error}</div>
          )}

          <div className="grid grid-cols-3 gap-3">
            {TYPES.map((t) => {
              const Icon = t.icon;
              const selected = t.type === type;
              return (
                <button
                  key={t.type}
                  type="button"
                  onClick={() => setType(t.type)}
                  className={`p-4 rounded-2xl border text-center transition-all ${
                    selected ? `ring-2 ${t.ring} bg-white shadow-md` : 'border-slate-100 bg-slate-50 hover:bg-white hover:border-slate-200'
                  }`}
                >
                  <div className={`h-12 w-12 mx-auto rounded-2xl border flex items-center justify-center ${t.tone}`}>
                    <Icon size={24} />
                  </div>
                  <p className="mt-2 text-xs font-black text-slate-800 leading-tight">{t.label}</p>
                  <p className="text-[10px] font-semibold text-slate-400">{t.hint}</p>
                </button>
              );
            })}
          </div>

          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Nombre</label>
            <div className="flex items-center bg-slate-50 border border-slate-100 rounded-2xl focus-within:border-[#004C6C] focus-within:bg-white transition-colors">
              <input
                type="text"
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej: Seguimiento de obra Torre 2"
                className="flex-1 min-w-0 bg-transparent px-4 py-3.5 text-sm font-bold text-slate-700 placeholder:text-slate-300 outline-none"
              />
              <span className="pr-4 text-xs font-black text-slate-400">.{type}</span>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-5 py-3 rounded-2xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !name.trim()}
              className="flex items-center gap-2 px-6 py-3 rounded-2xl text-xs font-bold text-white bg-[#EE9D4C] hover:bg-[#e08a35] disabled:opacity-50 shadow-lg transition-all"
            >
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>{isSubmitting ? 'Creando…' : 'Crear y abrir'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
