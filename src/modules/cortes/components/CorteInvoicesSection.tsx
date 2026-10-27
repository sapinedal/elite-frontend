import React, { useRef, useState } from 'react';
import { isCancel } from 'axios';
import { Receipt, Download, Loader2, UploadCloud, FileText, Send, AlertCircle, Plus, X, CheckCircle2, Clock } from 'lucide-react';
import { formatDateTime } from '../../../utils/dateUtils';
import { formatMoney, formatMoneyInput, parseMoney } from '../../../utils/money';
import { corteService, getApiErrorMessage } from '../services/corteService';
import { formatBytes, formatMaxSize } from '../utils/format';
import type { Corte, CorteInvoicePayload, InvoiceDocumentType } from '../types';

interface CorteInvoicesSectionProps {
  corte: Corte;
  documentTypes: { key: InvoiceDocumentType; label: string }[];
  maxUploadMb: number;
  onCreate: (corteId: number, payload: CorteInvoicePayload) => Promise<Corte>;
  onCreated: (corte: Corte) => void;
  /** Paula confirma que la factura quedó cargada en Multifox (pasa a cuentas por pagar) */
  onConfirmMultifox: (invoiceId: number) => Promise<Corte>;
}

const inputClass =
  'w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 text-sm font-bold text-slate-700 outline-none transition-all placeholder:text-slate-400 hover:border-slate-300 focus:bg-white focus:border-[#004C6C] focus:ring-4 focus:ring-blue-50 disabled:bg-slate-100 disabled:border-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed';
const labelClass = 'text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1';

const TYPE_STYLES: Record<InvoiceDocumentType, string> = {
  factura_inicial: 'bg-blue-50 text-[#004C6C]',
  nota_credito: 'bg-orange-50 text-orange-700',
  factura_reemplazo: 'bg-purple-50 text-purple-700',
};

// Texto del campo "documento que reemplaza o afecta" según el tipo
const RELATED_LABELS: Record<InvoiceDocumentType, string> = {
  factura_inicial: 'Documento que reemplaza o afecta',
  nota_credito: 'Factura que afecta *',
  factura_reemplazo: 'Factura anterior que se reemplaza *',
};

/**
 * Facturas del corte aprobado: listado con descarga y, para quien tiene cortes.facturar, el cargue de una
 * factura inicial, nota crédito o factura de reemplazo. Al cargarla se notifica para su registro en Multifox;
 * cuando Paula confirma la carga en Multifox, la factura pasa a cuentas por pagar.
 */
export const CorteInvoicesSection: React.FC<CorteInvoicesSectionProps> = ({
  corte, documentTypes, maxUploadMb, onCreate, onCreated, onConfirmMultifox,
}) => {
  const invoices = corte.invoices ?? [];
  const [formOpen, setFormOpen] = useState(invoices.length === 0);
  const [documentType, setDocumentType] = useState<InvoiceDocumentType>(invoices.length ? 'nota_credito' : 'factura_inicial');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [relatedDocument, setRelatedDocument] = useState('');
  const [observation, setObservation] = useState('');
  const [amount, setAmount] = useState('');
  const [confirmingId, setConfirmingId] = useState<number | null>(null);
  const [file, setFile] = useState<File | null>(null);
  // Si el registro falla por validación no hay que volver a subir el archivo
  const [uploadedToken, setUploadedToken] = useState<string | null>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const affectsAnother = documentType !== 'factura_inicial';

  const resetForm = () => {
    setInvoiceNumber('');
    setRelatedDocument('');
    setObservation('');
    setAmount('');
    setFile(null);
    setUploadedToken(null);
    setProgress(null);
    setError(null);
  };

  const selectFile = (selected: File | undefined) => {
    if (!selected) return;
    if (selected.size > maxUploadMb * 1024 * 1024) {
      setError(`El archivo pesa ${formatBytes(selected.size)} y supera el máximo de ${formatMaxSize(maxUploadMb)}.`);
      return;
    }
    setError(null);
    setFile(selected);
    setUploadedToken(null);
    setProgress(null);
  };

  const handleDownload = async (invoiceId: number) => {
    setDownloadingId(invoiceId);
    try {
      window.open(await corteService.getInvoiceDownloadUrl(invoiceId), '_blank', 'noopener');
    } catch (err) {
      setError(getApiErrorMessage(err, 'Error al descargar la factura.'));
    } finally {
      setDownloadingId(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invoiceNumber.trim()) return setError('Indica el número del documento.');
    if (affectsAnother && !relatedDocument.trim()) return setError('Indica el número de la factura que se afecta o reemplaza.');
    if (!parseMoney(amount)) return setError('Indica el valor del documento.');
    if (affectsAnother && !observation.trim()) return setError('Indica el motivo del cambio.');
    if (!file) return setError('Adjunta el archivo de la factura.');

    setSubmitting(true);
    setError(null);
    try {
      let token = uploadedToken;
      if (!token) {
        setProgress(0);
        token = await corteService.uploadFile(file, setProgress);
        setUploadedToken(token);
      }
      const updated = await onCreate(corte.id, {
        invoice_number: invoiceNumber.trim(),
        document_type: documentType,
        related_document: affectsAnother ? relatedDocument.trim() : null,
        observation: observation.trim() || null,
        amount: parseMoney(amount) ?? 0,
        upload_token: token,
      });
      resetForm();
      setFormOpen(false);
      setDocumentType('nota_credito');
      onCreated(updated);
    } catch (err) {
      if (isCancel(err)) return;
      setProgress(null);
      setError(err instanceof Error ? err.message : 'Error al cargar la factura.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmMultifox = async (invoiceId: number) => {
    setConfirmingId(invoiceId);
    setError(null);
    try {
      onCreated(await onConfirmMultifox(invoiceId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al confirmar la carga en Multifox.');
    } finally {
      setConfirmingId(null);
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-teal-100 p-6 space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Receipt size={18} className="text-teal-600" />
          <h3 className="font-black text-[#004C6C] tracking-tight">Facturación</h3>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            {invoices.length ? `${invoices.length} documento(s)` : 'Sin facturas'}
          </span>
        </div>
        {corte.can_invoice && !formOpen && (
          <button type="button" onClick={() => { resetForm(); setFormOpen(true); }}
            className="flex items-center gap-1 text-xs font-bold text-white bg-[#EE9D4C] hover:bg-[#e08a35] px-3 py-2 rounded-xl transition-all">
            <Plus size={14} /> Cargar documento
          </button>
        )}
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-100 rounded-2xl text-xs font-bold text-red-600 flex items-center gap-2">
          <AlertCircle size={16} className="shrink-0" />
          <span className="whitespace-pre-line">{error}</span>
        </div>
      )}

      {/* Facturas cargadas */}
      {invoices.length > 0 && (
        <ul className="space-y-2">
          {invoices.map((invoice) => (
            <li key={invoice.id} className="flex items-start justify-between gap-3 bg-slate-50 rounded-2xl p-4">
              <div className="min-w-0 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md ${TYPE_STYLES[invoice.document_type]}`}>
                    {invoice.document_type_label}
                  </span>
                  <span className="font-black text-slate-700">N.º {invoice.invoice_number}</span>
                  {invoice.amount !== null && <span className="font-black text-teal-700">{formatMoney(invoice.amount)}</span>}
                  {invoice.related_document && (
                    <span className="text-xs font-bold text-slate-500">→ afecta a {invoice.related_document}</span>
                  )}
                </div>
                {invoice.multifox_confirmed_at ? (
                  <p className="flex items-center gap-1 text-[11px] font-bold text-green-600">
                    <CheckCircle2 size={13} /> En Multifox y cuentas por pagar · {invoice.multifox_confirmed_by} · {formatDateTime(invoice.multifox_confirmed_at)}
                  </p>
                ) : (
                  <p className="flex items-center gap-1 text-[11px] font-bold text-orange-600">
                    <Clock size={13} /> Pendiente de cargar en Multifox
                  </p>
                )}
                {invoice.observation && <p className="text-xs font-medium text-slate-600 whitespace-pre-line">{invoice.observation}</p>}
                <p className="text-[11px] font-bold text-slate-400 truncate">
                  {invoice.file_name} · {formatBytes(invoice.file_size)} · {invoice.uploaded_by ?? '—'} · {formatDateTime(invoice.created_at)}
                </p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {invoice.can_confirm_multifox && (
                  <button type="button" onClick={() => handleConfirmMultifox(invoice.id)} disabled={confirmingId !== null}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#EE9D4C] hover:bg-[#e08a35] text-white text-xs font-bold whitespace-nowrap disabled:opacity-60"
                    title="Confirma que ya registraste el documento en Multifox">
                    {confirmingId === invoice.id ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />} Cargada en Multifox
                  </button>
                )}
                <button type="button" onClick={() => handleDownload(invoice.id)} disabled={downloadingId === invoice.id}
                  className="p-2.5 rounded-xl text-[#004C6C] hover:bg-blue-50" title="Descargar">
                  {downloadingId === invoice.id ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Cargue */}
      {corte.can_invoice && formOpen && (
        <form onSubmit={handleSubmit} className="space-y-4 border-t border-slate-100 pt-5">
          <div className="space-y-2">
            <label className={labelClass}>Tipo de documento *</label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {documentTypes.map((type) => (
                <button key={type.key} type="button" disabled={submitting}
                  onClick={() => { setDocumentType(type.key); if (type.key === 'factura_inicial') setRelatedDocument(''); }}
                  className={`px-4 py-3 rounded-2xl border text-sm font-bold transition-all ${documentType === type.key ? 'bg-[#004C6C] border-[#004C6C] text-white shadow-md' : 'bg-white border-slate-200 text-slate-600 hover:border-[#004C6C]/40 hover:bg-slate-50'}`}>
                  {type.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className={labelClass}>Número de factura *</label>
              <input disabled={submitting} className={inputClass} placeholder="Ej: FE-1045"
                value={invoiceNumber} onChange={(e) => setInvoiceNumber(e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className={labelClass}>{RELATED_LABELS[documentType]}</label>
              <input disabled={submitting || !affectsAnother} className={inputClass} list={`invoices-${corte.id}`}
                placeholder={affectsAnother ? 'Número de la factura anterior' : 'No aplica para factura inicial'}
                value={relatedDocument} onChange={(e) => setRelatedDocument(e.target.value)} />
              {/* Sugiere las facturas ya cargadas al corte */}
              <datalist id={`invoices-${corte.id}`}>
                {invoices.map((inv) => <option key={inv.id} value={inv.invoice_number}>{inv.document_type_label}</option>)}
              </datalist>
            </div>
            <div className="space-y-2">
              <label className={labelClass}>{documentType === 'nota_credito' ? 'Valor que descuenta *' : 'Valor *'}</label>
              <div className="relative">
                <span className="absolute left-5 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">$</span>
                <input disabled={submitting} inputMode="numeric" className={`${inputClass} pl-9`} placeholder="0"
                  value={amount} onChange={(e) => setAmount(formatMoneyInput(e.target.value))} />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className={labelClass}>Motivo / observación del cambio {affectsAnother ? '*' : ''}</label>
            <textarea rows={2} disabled={submitting} className={`${inputClass} resize-none`}
              placeholder={affectsAnother ? 'Explica por qué se emite este documento' : 'Opcional'}
              value={observation} onChange={(e) => setObservation(e.target.value)} />
          </div>

          <div className="space-y-2">
            <label className={labelClass}>Archivo de la factura *</label>
            <div onClick={() => !submitting && fileInputRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => { e.preventDefault(); if (!submitting) selectFile(e.dataTransfer.files[0]); }}
              className="border-2 border-dashed border-slate-300 hover:border-[#004C6C]/60 hover:bg-blue-50/30 rounded-3xl p-5 flex flex-col items-center justify-center gap-1.5 text-center cursor-pointer bg-slate-50 transition-all">
              <input ref={fileInputRef} type="file" className="hidden" accept=".pdf,.xml,.zip,.png,.jpg,.jpeg"
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
                  <p className="text-sm font-bold text-slate-500">Arrastra la factura o haz clic (PDF, XML o ZIP)</p>
                </>
              )}
            </div>
            {progress !== null && (
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-[#004C6C] transition-all" style={{ width: `${progress}%` }} />
              </div>
            )}
          </div>

          <div className="flex gap-3">
            {invoices.length > 0 && (
              <button type="button" onClick={() => { resetForm(); setFormOpen(false); }} disabled={submitting}
                className="px-5 py-3.5 bg-slate-50 text-slate-500 rounded-2xl font-bold hover:bg-slate-100 flex items-center gap-2">
                <X size={16} /> Cancelar
              </button>
            )}
            <button type="submit" disabled={submitting}
              className="flex-1 px-6 py-3.5 bg-[#004C6C] hover:bg-[#003a53] text-white rounded-2xl font-bold shadow-lg flex items-center justify-center gap-2 disabled:opacity-60">
              {submitting ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
              {submitting && progress !== null && progress < 100 ? `Subiendo archivo... ${progress}%` : 'Cargar y notificar para Multifox'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
