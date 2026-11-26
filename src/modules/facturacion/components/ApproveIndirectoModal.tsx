import React, { useState } from 'react';
import { BadgeDollarSign, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { formatMoneyInput, parseMoney } from '../../../utils/money';
import { facturacionService, getApiErrorMessage } from '../services/facturacionService';
import { ModalShell, inputClass, labelClass } from '../../../components/ui/ModalShell';
import type { Factura } from '../types';

interface ApproveIndirectoModalProps {
  factura: Factura | null;
  onClose: () => void;
  onApproved: (factura: Factura) => void;
}

/**
 * El analista contable aprueba el indirecto (cargado sin valor por Contabilidad) registrando su valor:
 * queda procesado y pasa a cuentas por pagar en el frente de indirectos.
 */
export const ApproveIndirectoModal: React.FC<ApproveIndirectoModalProps> = ({ factura, ...props }) => (
  // Se monta por cada factura (`key`) para arrancar sin el valor anterior
  factura ? <ApproveContent key={factura.id} factura={factura} {...props} /> : null
);

const ApproveContent: React.FC<ApproveIndirectoModalProps & { factura: Factura }> = ({ factura, onClose, onApproved }) => {
  const [amount, setAmount] = useState('');
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    const value = parseMoney(amount);
    if (!value) return setError('Indica el valor del indirecto: con él pasa a cuentas por pagar.');

    setSubmitting(true);
    setError(null);
    try {
      onApproved(await facturacionService.approveIndirecto(factura.id, value, comment.trim() || null));
    } catch (err) {
      setError(getApiErrorMessage(err, 'Error al aprobar el indirecto.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ModalShell
      isOpen
      onClose={() => !submitting && onClose()}
      icon={<BadgeDollarSign size={24} />}
      title={`Aprobar indirecto ${factura.document_number}`}
      subtitle={`${factura.supplier_name} · ${factura.period_label}`}
      footer={
        <button type="button" onClick={handleSubmit} disabled={submitting}
          className="w-full px-6 py-3.5 bg-[#004C6C] hover:bg-[#003a53] text-white rounded-2xl font-bold flex items-center justify-center gap-2 disabled:opacity-60">
          {submitting ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle2 size={18} />}
          {submitting ? 'Aprobando...' : 'Aprobar y enviar a cuentas por pagar'}
        </button>
      }
    >
      <div className="space-y-5">
        {error && (
          <div className="p-3 bg-red-50 border border-red-100 rounded-2xl text-xs font-bold text-red-600 flex items-center gap-2">
            <AlertCircle size={16} className="shrink-0" /> <span className="whitespace-pre-line">{error}</span>
          </div>
        )}
        {factura.observation && (
          <p className="text-sm font-bold text-slate-600 bg-slate-50 rounded-2xl p-3 whitespace-pre-line">{factura.observation}</p>
        )}
        <div className="space-y-1.5">
          <label className={labelClass}>Valor *</label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">$</span>
            <input autoFocus disabled={submitting} inputMode="numeric" className={`${inputClass} pl-8`} placeholder="0"
              value={amount} onChange={(e) => setAmount(formatMoneyInput(e.target.value))} />
          </div>
        </div>
        <div className="space-y-1.5">
          <label className={labelClass}>Comentario</label>
          <textarea rows={2} disabled={submitting} className={`${inputClass} resize-none`} placeholder="Opcional"
            value={comment} onChange={(e) => setComment(e.target.value)} />
        </div>
        <p className="text-[11px] font-bold text-slate-400">Al aprobarlo queda procesado y pasa a cuentas por pagar en el frente de Indirectos.</p>
      </div>
    </ModalShell>
  );
};
