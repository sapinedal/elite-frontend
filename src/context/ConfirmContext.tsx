import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, HelpCircle, Trash2, X } from 'lucide-react';
import { useEscapeToClose } from '../hooks/useEscapeToClose';

/**
 * Confirmaciones con el modal propio de la app, en lugar de window.confirm:
 *
 *   const confirm = useConfirm();
 *   if (!(await confirm({ title: 'Eliminar proyecto', message: '…', confirmText: 'Eliminar', tone: 'danger' }))) return;
 *
 * Con motivo obligatorio (eliminaciones de registros aprobados): devuelve el motivo o null si se cancela.
 *
 *   const confirmReason = useConfirmReason();
 *   const reason = await confirmReason({ title: 'Eliminar corte', message: '…', confirmText: 'Eliminar' });
 *   if (reason === null) return;
 */
export type ConfirmTone = 'danger' | 'warning' | 'info';

export interface ConfirmOptions {
  title: string;
  message?: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  tone?: ConfirmTone;
}

export interface ConfirmReasonOptions extends ConfirmOptions {
  reasonLabel?: string;
  reasonPlaceholder?: string;
  /** Mínimo de caracteres del motivo (por defecto 5, igual que el backend) */
  minLength?: number;
}

type ConfirmFn = (options: ConfirmOptions) => Promise<boolean>;
type ConfirmReasonFn = (options: ConfirmReasonOptions) => Promise<string | null>;

const ConfirmContext = createContext<{ confirm: ConfirmFn; confirmReason: ConfirmReasonFn } | undefined>(undefined);

const useConfirmContext = () => {
  const context = useContext(ConfirmContext);
  if (!context) {
    throw new Error('useConfirm must be used within a ConfirmProvider');
  }
  return context;
};

export const useConfirm = (): ConfirmFn => useConfirmContext().confirm;

export const useConfirmReason = (): ConfirmReasonFn => useConfirmContext().confirmReason;

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

interface PendingConfirm extends ConfirmReasonOptions {
  withReason: boolean;
  resolve: (value: boolean, reason?: string) => void;
}

const ConfirmDialog: React.FC<{ pending: PendingConfirm; onAnswer: (value: boolean, reason?: string) => void }> = ({ pending, onAnswer }) => {
  const confirmRef = useRef<HTMLButtonElement>(null);
  const reasonRef = useRef<HTMLTextAreaElement>(null);
  const [reason, setReason] = useState('');
  const tone = TONES[pending.tone ?? 'danger'];
  const minLength = pending.minLength ?? 5;
  const reasonOk = !pending.withReason || reason.trim().length >= minLength;

  // Escape cancela; al abrir, el foco queda en el motivo o en el botón de confirmar (Enter confirma)
  useEscapeToClose(true, () => onAnswer(false));
  useEffect(() => {
    (pending.withReason ? reasonRef.current : confirmRef.current)?.focus();
  }, [pending.withReason]);

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
          {pending.withReason && (
            <label className="block mt-4">
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-500">
                {pending.reasonLabel ?? 'Motivo de la eliminación'} *
              </span>
              <textarea
                ref={reasonRef}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
                maxLength={500}
                placeholder={pending.reasonPlaceholder ?? 'Ej. Se cargó por error / quedó duplicado'}
                className="mt-1.5 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 outline-none focus:border-rose-300 focus:ring-4 focus:ring-rose-50 resize-none"
              />
              <span className="text-[11px] text-slate-400">Queda en el historial del registro.</span>
            </label>
          )}
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
            onClick={() => onAnswer(true, reason.trim())}
            disabled={!reasonOk}
            className={`flex-1 px-5 py-3.5 rounded-2xl text-sm font-bold text-white shadow-lg transition-all outline-none focus-visible:ring-4 focus-visible:ring-slate-200 disabled:opacity-50 disabled:cursor-not-allowed ${tone.button}`}
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

  const open = useCallback((options: ConfirmReasonOptions, withReason: boolean, resolve: PendingConfirm['resolve']) => {
    setPending((current) => {
      // Si había otra confirmación abierta se toma como cancelada
      current?.resolve(false);
      return { ...options, withReason, resolve };
    });
  }, []);

  const confirm = useCallback<ConfirmFn>(
    (options) => new Promise<boolean>((resolve) => open(options, false, (value) => resolve(value))),
    [open]
  );

  const confirmReason = useCallback<ConfirmReasonFn>(
    (options) => new Promise<string | null>((resolve) => open(options, true, (value, reason) => resolve(value && reason ? reason : null))),
    [open]
  );

  const answer = useCallback((value: boolean, reason?: string) => {
    setPending((current) => {
      current?.resolve(value, reason);
      return null;
    });
  }, []);

  const value = React.useMemo(() => ({ confirm, confirmReason }), [confirm, confirmReason]);

  return (
    <ConfirmContext.Provider value={value}>
      {children}
      {pending && <ConfirmDialog pending={pending} onAnswer={answer} />}
    </ConfirmContext.Provider>
  );
};
