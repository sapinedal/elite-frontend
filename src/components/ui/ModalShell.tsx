import React from 'react';
import { X } from 'lucide-react';
import { Portal } from './Portal';

export const inputClass =
  'w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm font-bold text-slate-700 outline-none transition-all placeholder:text-slate-400 hover:border-slate-300 focus:bg-white focus:border-[#004C6C] focus:ring-4 focus:ring-blue-50 disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed';
export const labelClass = 'text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1';

interface ModalShellProps {
  isOpen: boolean;
  onClose: () => void;
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  maxWidth?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

/**
 * Marco de modal con el estilo de los módulos de Contratación (detalle de cortes): encabezado, cuerpo con scroll y pie fijo.
 */
export const ModalShell: React.FC<ModalShellProps> = ({ isOpen, onClose, icon, title, subtitle, maxWidth = 'max-w-3xl', children, footer }) => (
  <Portal isOpen={isOpen} onClose={onClose}>
    {isOpen && (
      <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
        <div className={`bg-[#f8fafc] w-full ${maxWidth} rounded-[40px] shadow-2xl overflow-hidden flex flex-col max-h-[92vh]`}>
          <div className="bg-white px-6 py-5 md:px-8 md:py-6 border-b border-slate-100 flex items-center justify-between gap-4">
            <div className="flex items-center gap-4 min-w-0">
              <div className="h-12 w-12 shrink-0 bg-blue-50 text-[#004C6C] rounded-2xl flex items-center justify-center">{icon}</div>
              <div className="min-w-0">
                <h2 className="text-xl md:text-2xl font-black text-[#004C6C] tracking-tight truncate">{title}</h2>
                {subtitle && <p className="text-xs font-bold text-slate-400 truncate">{subtitle}</p>}
              </div>
            </div>
            <button type="button" onClick={onClose} className="p-2.5 text-slate-400 hover:bg-slate-50 rounded-2xl shrink-0" title="Cerrar">
              <X size={22} />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-5 md:p-8 space-y-5">{children}</div>
          {footer && <div className="bg-white px-5 py-4 md:px-8 border-t border-slate-100">{footer}</div>}
        </div>
      </div>
    )}
  </Portal>
);
