import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, HelpCircle, Trash2, X } from 'lucide-react';
import { useEscapeToClose } from '../hooks/useEscapeToClose';

/**
 * Confirmaciones con el modal propio de la app, en lugar de window.confirm:
 *
 *   const confirm = useConfirm();
 *   if (!(await confirm({ title: 'Eliminar proyecto', message: '…', confirmText: 'Eliminar', tone: 'danger' }))) return;
 */
export type ConfirmTone = 'danger' | 'warning' | 'info';

export interface ConfirmOptions {
  title: string;
  message?: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  tone?: ConfirmTone;
}

type ConfirmFn = (options: ConfirmOptions) => Promise<boolean>;

const ConfirmContext = createContext<ConfirmFn | undefined>(undefined);

export const useConfirm = (): ConfirmFn => {
  const context = useContext(ConfirmContext);
  if (!context) {
    throw new Error('useConfirm must be used within a ConfirmProvider');
  }
  return context;
};

const TONES: Record<ConfirmTone, { icon: React.ReactNode; iconBox: string; button: string }> = {
  danger: {
    icon: <Trash2 size={22} />,
    iconBox: 'bg-rose-50 text-rose-600 border-rose-100',
    button: 'bg-rose-600 hover:bg-rose-700 shadow-rose-900/20',
  },
  warning: {
    icon: <AlertTriangle size={22} />,
    iconBox: 'bg-orange-50 text-[#D97F2A] border-orange-100',
    button: 'bg-[#EE9D4C] hover:bg-[#e08a35] shadow-orange-900/20',
  },
  info: {
    icon: <HelpCircle size={22} />,
    iconBox: 'bg-sky-50 text-[#004C6C] border-sky-100',
    button: 'bg-[#004C6C] hover:bg-[#003952] shadow-sky-950/20',
  },
};

interface PendingConfirm extends ConfirmOptions {
  resolve: (value: boolean) => void;
}

const ConfirmDialog: React.FC<{ pending: PendingConfirm; onAnswer: (value: boolean) => void }> = ({ pending, onAnswer }) => {
  const confirmRef = useRef<HTMLButtonElement>(null);
  const tone = TONES[pending.tone ?? 'danger'];

  // Escape cancela; al abrir, el foco queda en el botón de confirmar (Enter confirma)
  useEscapeToClose(true, () => onAnswer(false));
  useEffect(() => {
    confirmRef.current?.focus();
  }, []);

  return createPortal(
    <div
      className="fixed inset-0 z-[10000] flex items-end sm:items-center justify-center sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150"
      onMouseDown={(e) => e.target === e.currentTarget && onAnswer(false)}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        className="bg-white w-full sm:max-w-md rounded-t-[32px] sm:rounded-[32px] shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-150"
      >
        <div className="p-6 sm:p-7">
          <div className="flex items-start justify-between gap-4 mb-5">
            <div className={`p-3 rounded-2xl border ${tone.iconBox}`}>{tone.icon}</div>
            <button
              type="button"
              onClick={() => onAnswer(false)}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-colors"
              title="Cerrar"
            >
              <X size={20} />
            </button>
          </div>
          <h3 id="confirm-dialog-title" className="text-lg font-black text-slate-800 tracking-tight">
            {pending.title}
          </h3>
          {pending.message && <div className="mt-2 text-sm font-medium text-slate-500 leading-relaxed">{pending.message}</div>}
        </div>
        <div className="flex flex-col-reverse sm:flex-row gap-3 px-6 pb-6 sm:px-7 sm:pb-7">
          <button
            type="button"
            onClick={() => onAnswer(false)}
            className="flex-1 px-5 py-3.5 rounded-2xl text-sm font-bold text-slate-600 bg-slate-50 hover:bg-slate-100 transition-colors"
          >
            {pending.cancelText ?? 'Cancelar'}
          </button>
          <button
            ref={confirmRef}
            type="button"
            onClick={() => onAnswer(true)}
            className={`flex-1 px-5 py-3.5 rounded-2xl text-sm font-bold text-white shadow-lg transition-all outline-none focus-visible:ring-4 focus-visible:ring-slate-200 ${tone.button}`}
          >
            {pending.confirmText ?? 'Confirmar'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export const ConfirmProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [pending, setPending] = useState<PendingConfirm | null>(null);

  const confirm = useCallback<ConfirmFn>(
    (options) =>
      new Promise<boolean>((resolve) => {
        setPending((current) => {
          // Si había otra confirmación abierta se toma como cancelada
          current?.resolve(false);
          return { ...options, resolve };
        });
      }),
    []
  );

  const answer = useCallback((value: boolean) => {
    setPending((current) => {
      current?.resolve(value);
      return null;
    });
  }, []);

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {pending && <ConfirmDialog pending={pending} onAnswer={answer} />}
    </ConfirmContext.Provider>
  );
};
