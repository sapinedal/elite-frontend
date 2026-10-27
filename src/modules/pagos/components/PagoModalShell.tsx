import React from 'react';
import { X, AlertCircle } from 'lucide-react';
import { Portal } from '../../../components/ui/Portal';

export const inputClass =
  'w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 text-sm font-bold text-slate-700 outline-none transition-all placeholder:text-slate-400 hover:border-slate-300 focus:bg-white focus:border-[#004C6C] focus:ring-4 focus:ring-blue-50 disabled:bg-slate-100 disabled:border-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed';
export const labelClass = 'text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1';

interface PagoModalShellProps {
  isOpen: boolean;
  onClose: () => void;
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  error?: string | null;
  size?: 'md' | 'lg';
  /** Botones extra junto al cierre (ej. Historial) */
  headerAction?: React.ReactNode;
  children: React.ReactNode;
}

/**
 * Marco común de los modales del cuadro de pagos (mismo estilo que Registro de Corte / Orden).
 */
export const PagoModalShell: React.FC<PagoModalShellProps> = ({ isOpen, onClose, icon, title, subtitle, error, size = 'md', headerAction, children }) => (
  <Portal isOpen={isOpen} onClose={onClose}>
    <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
      <div className={`bg-[#f8fafc] w-full ${size === 'lg' ? 'max-w-4xl' : 'max-w-2xl'} rounded-[40px] shadow-2xl overflow-hidden flex flex-col max-h-[92vh]`}>
        <div className="bg-white p-8 border-b border-slate-100 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <div className="h-12 w-12 shrink-0 bg-blue-50 text-[#004C6C] rounded-2xl flex items-center justify-center">{icon}</div>
            <div className="min-w-0">
              <h2 className="text-2xl font-black text-[#004C6C] tracking-tight truncate">{title}</h2>
              {subtitle && <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5 truncate">{subtitle}</p>}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {headerAction}
            <button onClick={onClose} className="p-3 text-slate-300 hover:bg-slate-50 rounded-2xl transition-all cursor-pointer">
              <X size={24} />
            </button>
          </div>
        </div>
        <div className="p-8 space-y-6 overflow-y-auto flex-1">
          {error && (
            <div className="p-4 bg-red-50 border border-red-100 rounded-2xl text-xs font-bold text-red-600 flex items-center gap-2 justify-center">
              <AlertCircle size={16} className="shrink-0" />
              <span className="whitespace-pre-line">{error}</span>
            </div>
          )}
          {children}
        </div>
      </div>
    </div>
  </Portal>
);
