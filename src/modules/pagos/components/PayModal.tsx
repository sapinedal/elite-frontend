import React, { useRef, useState } from 'react';
import { isAxiosError } from 'axios';
import { Banknote, Loader2, Send, UploadCloud, FileText } from 'lucide-react';
import { formatMoney, formatMoneyInput, parseMoney } from '../../../utils/money';
import { formatBytes, formatMaxSize } from '../../cortes/utils/format';
import { pagoService, getApiErrorMessage } from '../services/pagoService';
import { PagoModalShell, inputClass, labelClass } from './PagoModalShell';
import type { PagoCuenta, PagoPayPayload } from '../types';

interface PayModalProps {
  cuenta: PagoCuenta | null;
  maxUploadMb: number;
  onClose: () => void;
  onConfirm: (id: number, payload: PagoPayPayload) => Promise<PagoCuenta>;
}

const today = () => new Date().toLocaleDateString('en-CA'); // AAAA-MM-DD en hora local

/**
 * Contabilidad registra el pago de una cuenta programada: total o abono, con referencia y soporte opcional.
 */
export const PayModal: React.FC<PayModalProps> = ({ cuenta, ...props }) => (
  cuenta ? <PayContent key={cuenta.id} cuenta={cuenta} {...props} /> : null
);

const PayContent: React.FC<Omit<PayModalProps, 'cuenta'> & { cuenta: PagoCuenta }> = ({ cuenta, maxUploadMb, onClose, onConfirm }) => {
  const [amount, setAmount] = useState(formatMoneyInput(String(Math.round(cuenta.balance))));
  const [paymentDate, setPaymentDate] = useState(today());
  const [reference, setReference] = useState('');
  const [comment, setComment] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const value = parseMoney(amount) ?? 0;
  const isPartial = value > 0 && value < cuenta.balance;

  const selectFile = (selected: File | undefined) => {
    if (!selected) return;
    if (selected.size > maxUploadMb * 1024 * 1024) {
      setError(`El soporte pesa ${formatBytes(selected.size)} y supera el máximo de ${formatMaxSize(maxUploadMb)}.`);
      return;
    }
    setError(null);
    setFile(selected);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (value <= 0 || value > cuenta.balance) return setError(`El valor debe ser mayor a cero y no superar el saldo de ${formatMoney(cuenta.balance)}.`);

    setSaving(true);
    setError(null);
    try {
      let token: string | null = null;
      if (file) {
        setProgress(0);
        try {
          token = await pagoService.uploadFile(file, setProgress);
        } catch (err) {
          if (isAxiosError(err) && !err.response && !err.config?.url?.includes('/v1/')) {
            throw new Error('No se pudo subir el soporte al repositorio. Revisa tu conexión e intenta de nuevo.');
          }
          throw new Error(getApiErrorMessage(err, 'Error al subir el soporte.'));
        }
      }
      await onConfirm(cuenta.id, { amount: value, payment_date: paymentDate, reference: reference.trim() || null, comment: comment.trim() || null, upload_token: token });
      onClose();
    } catch (err) {
      setProgress(null);
      setError(err instanceof Error ? err.message : 'Error al registrar el pago.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <PagoModalShell isOpen onClose={onClose} icon={<Banknote size={24} />} title="Registrar pago"
      subtitle={`${cuenta.supplier_name} · ${cuenta.document_number}`} error={error}>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-3 gap-3 text-center">
          {[['Valor', cuenta.amount - cuenta.adjustments], ['Pagado', cuenta.paid_amount], ['Saldo', cuenta.balance]].map(([label, v]) => (
            <div key={label} className="bg-white rounded-2xl border border-slate-100 p-3">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
              <p className="font-black text-slate-700">{formatMoney(v as number)}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className={labelClass}>Valor pagado *</label>
            <div className="relative">
              <span className="absolute left-5 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">$</span>
              <input disabled={saving} inputMode="numeric" className={`${inputClass} pl-9`}
                value={amount} onChange={(e) => setAmount(formatMoneyInput(e.target.value))} />
            </div>
            {isPartial && <p className="text-[11px] font-bold text-purple-600 ml-1">Abono: quedará un saldo de {formatMoney(cuenta.balance - value)} por priorizar.</p>}
          </div>
          <div className="space-y-2">
            <label className={labelClass}>Fecha de pago *</label>
            <input type="date" max={today()} disabled={saving} className={inputClass} value={paymentDate} onChange={(e) => setPaymentDate(e.target.value)} />
          </div>
        </div>

        <div className="space-y-2">
          <label className={labelClass}>Referencia / comprobante</label>
          <input disabled={saving} className={inputClass} placeholder="Ej: transferencia 123456" value={reference} onChange={(e) => setReference(e.target.value)} />
        </div>

        <div className="space-y-2">
          <label className={labelClass}>Comentario</label>
          <textarea rows={2} disabled={saving} className={`${inputClass} resize-none`} placeholder="Opcional" value={comment} onChange={(e) => setComment(e.target.value)} />
        </div>

        <div className="space-y-2">
          <label className={labelClass}>Soporte de pago</label>
          <div onClick={() => !saving && fileInputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); if (!saving) selectFile(e.dataTransfer.files[0]); }}
            className="border-2 border-dashed border-slate-300 hover:border-[#004C6C]/60 hover:bg-blue-50/30 rounded-3xl p-5 flex flex-col items-center justify-center gap-1.5 text-center cursor-pointer bg-slate-50 transition-all">
            <input ref={fileInputRef} type="file" className="hidden" accept=".pdf,.png,.jpg,.jpeg"
              onChange={(e) => { selectFile(e.target.files?.[0]); e.target.value = ''; }} />
            {file ? (
              <>
                <FileText size={24} className="text-[#004C6C]" />
                <p className="text-sm font-black text-slate-700 break-all">{file.name}</p>
                <p className="text-[11px] font-bold text-slate-400">{formatBytes(file.size)} · clic para cambiar</p>
              </>
            ) : (
              <>
                <UploadCloud size={24} className="text-slate-400" />
                <p className="text-sm font-bold text-slate-500">Comprobante de la transferencia (opcional)</p>
              </>
            )}
          </div>
          {progress !== null && (
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-[#004C6C] transition-all" style={{ width: `${progress}%` }} />
            </div>
          )}
        </div>

        <button type="submit" disabled={saving}
          className="w-full px-6 py-4 bg-green-600 hover:bg-green-700 text-white rounded-2xl font-bold shadow-xl flex items-center justify-center gap-2 disabled:opacity-60">
          {saving ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
          {isPartial ? 'Registrar abono' : 'Marcar como pagada'}
        </button>
      </form>
    </PagoModalShell>
  );
};
