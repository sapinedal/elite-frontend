import React, { useState } from 'react';
import { CalendarClock, Loader2, Send } from 'lucide-react';
import { formatMoney } from '../../../utils/money';
import { PagoModalShell, inputClass, labelClass } from './PagoModalShell';
import type { PagoCatalogs, PagoCuenta, PagoPriority } from '../types';

interface PrioritizeModalProps {
  cuentas: PagoCuenta[] | null;
  catalogs: PagoCatalogs | null;
  onClose: () => void;
  onConfirm: (ids: number[], priority: PagoPriority, scheduledFor: string, comment: string | null) => Promise<void>;
}

/**
 * Paula prioriza y programa la fecha de pago de las cuentas seleccionadas (por defecto el próximo viernes).
 */
export const PrioritizeModal: React.FC<PrioritizeModalProps> = ({ cuentas, ...props }) => (
  // Se monta en cada apertura para arrancar con los valores por defecto
  cuentas ? <PrioritizeContent key={cuentas.map((c) => c.id).join('-')} cuentas={cuentas} {...props} /> : null
);

const PrioritizeContent: React.FC<Omit<PrioritizeModalProps, 'cuentas'> & { cuentas: PagoCuenta[] }> = ({ cuentas, catalogs, onClose, onConfirm }) => {
  const [priority, setPriority] = useState<PagoPriority>('media');
  const [scheduledFor, setScheduledFor] = useState(catalogs?.next_payment_date ?? '');
  const [comment, setComment] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const total = cuentas.reduce((sum, c) => sum + c.balance, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scheduledFor) return setError('Indica la fecha de pago.');
    setSaving(true);
    setError(null);
    try {
      await onConfirm(cuentas.map((c) => c.id), priority, scheduledFor, comment.trim() || null);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al priorizar.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <PagoModalShell isOpen onClose={onClose} icon={<CalendarClock size={24} />} title="Priorizar y programar pago"
      subtitle={`${cuentas.length} cuenta(s) · ${formatMoney(total)}`} error={error}>
      <form onSubmit={handleSubmit} className="space-y-6">
        <ul className="max-h-48 overflow-y-auto space-y-1.5 bg-white rounded-3xl border border-slate-100 p-4">
          {cuentas.map((c) => (
            <li key={c.id} className="flex justify-between gap-3 text-sm">
              <span className="font-bold text-slate-600 truncate">{c.supplier_name} · {c.document_number}</span>
              <span className="font-black text-slate-700 whitespace-nowrap">{formatMoney(c.balance)}</span>
            </li>
          ))}
        </ul>

        <div className="space-y-2">
          <label className={labelClass}>Prioridad *</label>
          <div className="grid grid-cols-3 gap-2">
            {(catalogs?.priorities ?? []).map((p) => (
              <button key={p.key} type="button" disabled={saving} onClick={() => setPriority(p.key)}
                className={`px-4 py-3 rounded-2xl border text-sm font-bold transition-all ${priority === p.key ? 'bg-[#004C6C] border-[#004C6C] text-white shadow-md' : 'bg-white border-slate-200 text-slate-600 hover:border-[#004C6C]/40 hover:bg-slate-50'}`}>
                {p.label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <label className={labelClass}>Fecha de pago *</label>
          <input type="date" disabled={saving} className={inputClass} value={scheduledFor} onChange={(e) => setScheduledFor(e.target.value)} />
        </div>

        <div className="space-y-2">
          <label className={labelClass}>Comentario</label>
          <textarea rows={2} disabled={saving} className={`${inputClass} resize-none`} placeholder="Opcional"
            value={comment} onChange={(e) => setComment(e.target.value)} />
        </div>

        <button type="submit" disabled={saving}
          className="w-full px-6 py-4 bg-[#004C6C] hover:bg-[#003a53] text-white rounded-2xl font-bold shadow-xl flex items-center justify-center gap-2 disabled:opacity-60">
          {saving ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />} Programar pago
        </button>
      </form>
    </PagoModalShell>
  );
};
