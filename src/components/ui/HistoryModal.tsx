import React from 'react';
import { createPortal } from 'react-dom';
import { History, X } from 'lucide-react';
import { useEscapeToClose } from '../../hooks/useEscapeToClose';

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Ej: "Corte CT-01" */
  subtitle?: string;
  title?: string;
  children: React.ReactNode;
}

/**
 * Historial / trazabilidad en un modal aparte, encima del detalle donde se hacen las acciones.
 * Usa createPortal directo (no Portal) para no quitar el desenfoque del detalle que sigue abierto al cerrarlo.
 */
export const HistoryModal: React.FC<HistoryModalProps> = ({ isOpen, onClose, subtitle, title = 'Historial', children }) => {
  useEscapeToClose(isOpen, onClose);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/40 animate-fade-in" onClick={onClose}>
      <div className="bg-[#f8fafc] w-full max-w-2xl rounded-[40px] shadow-2xl overflow-hidden flex flex-col max-h-[85vh]" onClick={(e) => e.stopPropagation()}>
        <div className="bg-white p-6 border-b border-slate-100 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <div className="h-11 w-11 shrink-0 bg-blue-50 text-[#004C6C] rounded-2xl flex items-center justify-center">
              <History size={22} />
            </div>
            <div className="min-w-0">
              <h2 className="text-xl font-black text-[#004C6C] tracking-tight">{title}</h2>
              {subtitle && <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5 truncate">{subtitle}</p>}
            </div>
          </div>
          <button onClick={onClose} className="p-3 text-slate-300 hover:bg-slate-50 rounded-2xl transition-all cursor-pointer">
            <X size={22} />
          </button>
        </div>
        <div className="p-6 overflow-y-auto flex-1">
          <div className="bg-white rounded-3xl border border-slate-100 p-6">{children}</div>
        </div>
      </div>
    </div>,
    document.body
  );
};

/**
 * Botón que abre el historial, para el encabezado de los detalles.
 */
export const HistoryButton: React.FC<{ count?: number; onClick: () => void }> = ({ count, onClick }) => (
  <button type="button" onClick={onClick}
    className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-[#004C6C] text-xs font-bold hover:bg-blue-50 hover:border-[#004C6C]/30 transition-all whitespace-nowrap">
    <History size={16} /> Historial{count ? ` (${count})` : ''}
  </button>
);
