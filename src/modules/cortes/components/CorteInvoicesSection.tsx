import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Receipt, Download, Loader2, AlertCircle, CheckCircle2, Clock, ArrowRight, Paperclip } from 'lucide-react';
import { FileDrop } from '../../../components/ui/FileDrop';
import { formatDateTime } from '../../../utils/dateUtils';
import { formatMoney } from '../../../utils/money';
import { corteService, getApiErrorMessage } from '../services/corteService';
import { formatBytes } from '../utils/format';
import type { Corte, InvoiceDocumentType } from '../types';

interface CorteInvoicesSectionProps {
  corte: Corte;
  /** El residente responsable puede asociarle facturas desde Facturas del mes */
  canAssociate: boolean;
  onCreated: (corte: Corte) => void;
  /** Paula confirma que la factura quedó cargada en Multifox con su soporte (pasa a cuentas por pagar) */
  onConfirmMultifox: (invoiceId: number, file: File, onProgress?: (percent: number) => void) => Promise<Corte>;
}

const TYPE_STYLES: Record<InvoiceDocumentType, string> = {
  factura_inicial: 'bg-blue-50 text-[#004C6C]',
  nota_credito: 'bg-orange-50 text-orange-700',
  factura_reemplazo: 'bg-purple-50 text-purple-700',
};

/**
 * Facturas del corte aprobado: listado con descarga y confirmación de Multifox. Las facturas no se cargan aquí:
 * Contabilidad las sube en Facturas del mes y el residente responsable solo las asocia a su corte.
 * Paula confirma la carga en Multifox adjuntando el soporte, que queda en la carpeta del corte
 * (05 CORTES/CORTE N), y la factura pasa a cuentas por pagar.
 */
export const CorteInvoicesSection: React.FC<CorteInvoicesSectionProps> = ({ corte, canAssociate, onCreated, onConfirmMultifox }) => {
  const invoices = corte.invoices ?? [];
  // Factura cuyo soporte de Multifox se está adjuntando
  const [multifoxId, setMultifoxId] = useState<number | null>(null);
  const [multifoxFile, setMultifoxFile] = useState<File | null>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const handleDownload = async (invoiceId: number, multifox = false) => {
    const key = `${invoiceId}:${multifox}`;
    setDownloadingId(key);
    try {
      window.open(await corteService.getInvoiceDownloadUrl(invoiceId, multifox), '_blank', 'noopener');
    } catch (err) {
      setError(getApiErrorMessage(err, multifox ? 'Error al descargar el soporte de Multifox.' : 'Error al descargar la factura.'));
    } finally {
      setDownloadingId(null);
    }
  };

  const openMultifox = (invoiceId: number) => {
    setMultifoxId((current) => (current === invoiceId ? null : invoiceId));
    setMultifoxFile(null);
    setProgress(null);
    setError(null);
  };

  const handleConfirmMultifox = async (invoiceId: number) => {
    if (!multifoxFile) return setError('Adjunta el soporte de Multifox para confirmar la carga.');
    setConfirming(true);
    setError(null);
    try {
      onCreated(await onConfirmMultifox(invoiceId, multifoxFile, setProgress));
      setMultifoxId(null);
      setMultifoxFile(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al confirmar la carga en Multifox.');
    } finally {
      setConfirming(false);
      setProgress(null);
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
        {canAssociate && (
          <Link to="/app/contratacion/facturas"
            className="flex items-center gap-1 text-xs font-bold text-white bg-[#EE9D4C] hover:bg-[#e08a35] px-3 py-2 rounded-xl transition-all">
            Asociar factura <ArrowRight size={14} />
          </Link>
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
            <li key={invoice.id} className="bg-slate-50 rounded-2xl p-4 space-y-3">
            <div className="flex items-start justify-between gap-3">
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
                {invoice.multifox_file_name && (
                  <button type="button" onClick={() => handleDownload(invoice.id, true)} disabled={downloadingId === `${invoice.id}:true`}
                    className="flex items-center gap-1 text-[11px] font-bold text-[#004C6C] hover:underline max-w-full" title="Descargar el soporte de Multifox">
                    {downloadingId === `${invoice.id}:true` ? <Loader2 size={12} className="animate-spin shrink-0" /> : <Paperclip size={12} className="shrink-0" />}
                    <span className="truncate">Soporte Multifox: {invoice.multifox_file_name}</span>
                    {invoice.multifox_file_size !== null && <span className="text-slate-400 shrink-0">· {formatBytes(invoice.multifox_file_size)}</span>}
                  </button>
                )}
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {invoice.can_confirm_multifox && (
                  <button type="button" onClick={() => openMultifox(invoice.id)} disabled={confirming}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#EE9D4C] hover:bg-[#e08a35] text-white text-xs font-bold whitespace-nowrap disabled:opacity-60"
                    title="Adjunta el soporte y confirma que ya registraste el documento en Multifox">
                    <CheckCircle2 size={14} /> Cargada en Multifox
                  </button>
                )}
                <button type="button" onClick={() => handleDownload(invoice.id)} disabled={downloadingId === `${invoice.id}:false`}
                  className="p-2.5 rounded-xl text-[#004C6C] hover:bg-blue-50" title="Descargar factura">
                  {downloadingId === `${invoice.id}:false` ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                </button>
              </div>
            </div>

            {multifoxId === invoice.id && invoice.can_confirm_multifox && (
              <div className="border-t border-slate-200 pt-3 space-y-3">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">
                  Soporte de Multifox * (corte generado en Multifox y capturas de aprobaciones)
                </p>
                <FileDrop file={multifoxFile} onSelect={(f) => { setMultifoxFile(f); setError(null); }} disabled={confirming} progress={progress}
                  hint="Arrastra el soporte o haz clic. Queda en la carpeta 05 CORTES del corte" />
                <div className="flex items-center justify-end gap-2">
                  <button type="button" onClick={() => openMultifox(invoice.id)} disabled={confirming}
                    className="px-3 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 disabled:opacity-60">
                    Cancelar
                  </button>
                  <button type="button" onClick={() => handleConfirmMultifox(invoice.id)} disabled={confirming || !multifoxFile}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#004C6C] hover:bg-[#003a53] text-white text-xs font-bold disabled:opacity-60">
                    {confirming ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                    {confirming && progress !== null && progress < 100 ? `Subiendo... ${progress}%` : 'Confirmar y pasar a cuentas por pagar'}
                  </button>
                </div>
              </div>
            )}
            </li>
          ))}
        </ul>
      )}

      {invoices.length === 0 && (
        <p className="text-xs font-bold text-slate-400">
          Contabilidad carga las facturas en Facturas del mes y el residente responsable las asocia a este corte.
        </p>
      )}
    </div>
  );
};
