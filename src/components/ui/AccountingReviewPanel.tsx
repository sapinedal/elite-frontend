import React, { useState } from 'react';
import { Calculator, CheckCircle2, Undo2, Loader2, Send, AlertCircle } from 'lucide-react';

export type AccountingDecision = 'aprobar' | 'devolver';

interface AccountingReviewPanelProps {
  /** Qué se aprueba (ej. "Factura inicial N.º FE 335") */
  subject?: string;
  /** A quién vuelve si se devuelve (Multifox, Almacén) */
  returnsTo: string;
  /** Destino al aprobar (cuentas por pagar / cuadro de pagos) */
  approvesTo?: string;
  onSubmit: (decision: AccountingDecision, comment?: string) => Promise<unknown>;
  compact?: boolean;
}

/**
 * Aprobación de Contabilidad antes de cuentas por pagar, igual en todos los módulos de registro (cortes, órdenes,
 * anticipos y cuentas de cobro): aprobar pasa el registro a cuentas por pagar; devolver exige el motivo y lo
 * regresa a quien lo carga en Multifox (o a Almacén en órdenes), que recibe el aviso.
 */
export const AccountingReviewPanel: React.FC<AccountingReviewPanelProps> = ({
  subject, returnsTo, approvesTo = 'cuentas por pagar', onSubmit, compact = false,
}) => {
  const [decision, setDecision] = useState<AccountingDecision | null>(null);
  const [comment, setComment] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (!decision) return;
    if (decision === 'devolver' && !comment.trim()) {
      setError(`Indica el motivo de la devolución para que ${returnsTo} sepa qué corregir.`);
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onSubmit(decision, comment.trim() || undefined);
      setDecision(null);
      setComment('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al registrar la aprobación de Contabilidad.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={`bg-white rounded-3xl border border-orange-100 space-y-4 ${compact ? 'p-4' : 'p-6'}`}>
      <div className="flex items-start gap-3">
        <span className="h-9 w-9 shrink-0 rounded-xl bg-orange-50 text-[#EE9D4C] flex items-center justify-center">
          <Calculator size={18} />
        </span>
        <div className="min-w-0">
          <h3 className="font-black text-[#004C6C] tracking-tight">Tu aprobación como Contabilidad</h3>
          <p className="text-xs font-bold text-slate-400 mt-0.5">
            {subject ? `${subject}: ` : ''}apruébalo para que pase a {approvesTo}, o devuélvelo a {returnsTo} con el motivo.
          </p>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-100 rounded-2xl text-xs font-bold text-red-600 flex items-center gap-2">
          <AlertCircle size={16} className="shrink-0" /> <span className="whitespace-pre-line">{error}</span>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <button type="button" onClick={() => setDecision('aprobar')} disabled={saving}
          className={`px-4 py-3.5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${decision === 'aprobar' ? 'bg-green-600 text-white shadow-lg' : 'bg-green-50 text-green-700 hover:bg-green-100'}`}>
          <CheckCircle2 size={18} /> Aprobar
        </button>
        <button type="button" onClick={() => setDecision('devolver')} disabled={saving}
          className={`px-4 py-3.5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${decision === 'devolver' ? 'bg-red-600 text-white shadow-lg' : 'bg-red-50 text-red-700 hover:bg-red-100'}`}>
          <Undo2 size={18} /> Devolver
        </button>
      </div>

      {decision && (
        <>
          <textarea rows={3} disabled={saving} value={comment} onChange={(e) => setComment(e.target.value)}
            className="w-full bg-white border border-slate-100 rounded-2xl px-5 py-3.5 text-sm font-bold text-slate-700 focus:border-[#004C6C] outline-none shadow-sm resize-none placeholder:text-slate-300"
            placeholder={decision === 'devolver' ? 'Motivo de la devolución (obligatorio)' : 'Comentario (opcional)'} />
          <button type="button" onClick={submit} disabled={saving}
            className="w-full px-6 py-4 bg-[#004C6C] hover:bg-[#003a53] text-white rounded-2xl font-bold shadow-xl flex items-center justify-center gap-2 disabled:opacity-60">
            {saving ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
            {decision === 'aprobar' ? `Aprobar y pasar a ${approvesTo}` : `Devolver a ${returnsTo}`}
          </button>
        </>
      )}
    </div>
  );
};
