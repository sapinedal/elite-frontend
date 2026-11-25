import { DeleteRecordButton } from '../../../components/ui/DeleteRecordButton';
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { isAxiosError } from 'axios';
import { Receipt, Download, Loader2, Send, AlertCircle, ArrowRight, Clock } from 'lucide-react';
import { FileDrop } from '../../../components/ui/FileDrop';
import { formatDateTime } from '../../../utils/dateUtils';
import { formatMoney } from '../../../utils/money';
import { inputClass, labelClass } from '../../../components/ui/ModalShell';
import { formatBytes, formatMaxSize } from '../../cortes/utils/format';
import { ordenService, getApiErrorMessage } from '../services/ordenService';
import { ViewPdfButton } from '../../../components/ui/ViewPdfButton';
import type { Orden, OrdenCatalogs, OrdenDocumentPayload, OrdenStepKey } from '../types';

interface OrdenDocumentsSectionProps {
  orden: Orden;
  steps: OrdenCatalogs['steps'];
  maxUploadMb: number;
  /** El residente responsable asocia la factura del proveedor desde Facturas del mes (igual que en cortes) */
  canAssociate: boolean;
  onUpload: (id: number, payload: OrdenDocumentPayload) => Promise<Orden>;
  onUploaded: (orden: Orden) => void;
}

const STEP_STYLES: Record<OrdenStepKey, string> = {
  orden_erp: 'bg-blue-50 text-[#004C6C]',
  factura: 'bg-blue-50 text-[#004C6C]',
  entrada: 'bg-blue-50 text-[#004C6C]',
};

// Indicaciones para quien carga cada documento de Almacén
const STEP_HINTS: Partial<Record<OrdenStepKey, string>> = {
  orden_erp: 'Crea la orden de compra en el ERP y adjunta el archivo que genera. Luego el residente asocia la factura del proveedor.',
  entrada: 'Registra la entrada de almacén y adjunta el soporte. Con esto la orden pasa a la aprobación de Contabilidad.',
};

/**
 * Documentos de la orden aprobada, con la misma presentación que la facturación del corte: listado con descarga y,
 * según el paso actual:
 *  - Factura del proveedor: no se carga aquí. Contabilidad la sube en Facturas del mes y el residente responsable
 *    la asocia a su orden (sin pedir proveedor, igual que en cortes).
 *  - Orden ERP y entrada de almacén: Almacén carga el número y el archivo (directo a S3).
 * Con la entrada, la orden pasa a la aprobación de Contabilidad y de ahí a cuentas por pagar.
 */
export const OrdenDocumentsSection: React.FC<OrdenDocumentsSectionProps> = ({ orden, steps, maxUploadMb, canAssociate, onUpload, onUploaded }) => {
  const documents = orden.documents ?? [];
  const [number, setNumber] = useState('');
  const [observation, setObservation] = useState('');
  const [file, setFile] = useState<File | null>(null);
  // Si el registro falla por validación no hay que volver a subir el archivo
  const [uploadedToken, setUploadedToken] = useState<string | null>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);

  const currentStep = orden.current_step;
  // La factura se asocia desde Facturas del mes; aquí solo se cargan los documentos de Almacén
  const uploadStep = orden.can_upload_step && currentStep !== 'factura' ? currentStep : null;
  const waitingInvoice = currentStep === 'factura';

  const selectFile = (selected: File) => {
    if (selected.size > maxUploadMb * 1024 * 1024) {
      setError(`El archivo pesa ${formatBytes(selected.size)} y supera el máximo de ${formatMaxSize(maxUploadMb)}.`);
      return;
    }
    setError(null);
    setFile(selected);
    setUploadedToken(null);
    setProgress(null);
  };

  const handleDownload = async (documentId: number) => {
    setDownloadingId(documentId);
    try {
      window.open(await ordenService.getDocumentDownloadUrl(documentId), '_blank', 'noopener');
    } catch (err) {
      setError(getApiErrorMessage(err, 'Error al descargar el documento.'));
    } finally {
      setDownloadingId(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!number.trim()) return setError(`Indica el ${orden.current_step_number_label ?? 'número del documento'}.`);
    if (!file) return setError('Adjunta el archivo del documento.');

    setSubmitting(true);
    setError(null);
    try {
      let token = uploadedToken;
      if (!token) {
        setProgress(0);
        try {
          token = await ordenService.uploadFile(file, setProgress);
        } catch (err) {
          // El PUT va directo al bucket: sin respuesta suele ser CORS o red
          if (isAxiosError(err) && !err.response && !err.config?.url?.includes('/v1/')) {
            throw new Error('No se pudo subir el archivo al repositorio. Revisa tu conexión e intenta de nuevo.');
          }
          throw new Error(getApiErrorMessage(err, 'Error al subir el archivo.'));
        }
        setUploadedToken(token);
      }
      const updated = await onUpload(orden.id, { number: number.trim(), observation: observation.trim() || null, upload_token: token });
      setNumber('');
      setObservation('');
      setFile(null);
      setUploadedToken(null);
      setProgress(null);
      onUploaded(updated);
    } catch (err) {
      setProgress(null);
      setError(err instanceof Error ? err.message : 'Error al cargar el documento.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-blue-100 p-6 space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Receipt size={18} className="text-[#004C6C]" />
          <h3 className="font-black text-[#004C6C] tracking-tight">Facturación y recepción</h3>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            {documents.length} de {steps.length} documentos
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

      {documents.length > 0 && (
        <ul className="space-y-2">
          {documents.map((doc) => (
            <li key={doc.id} className="bg-slate-50 rounded-2xl p-4 flex items-start justify-between gap-3">
              <div className="min-w-0 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md ${STEP_STYLES[doc.step]}`}>
                    {doc.step_label}
                  </span>
                  <span className="font-black text-slate-700">N.º {doc.number}</span>
                  {doc.amount !== null && <span className="font-black text-[#004C6C]">{formatMoney(doc.amount)}</span>}
                </div>
                {doc.contractor && <p className="text-xs font-bold text-slate-600">{doc.contractor.name}{doc.contractor.nit ? ` · NIT ${doc.contractor.nit}` : ''}</p>}
                {doc.observation && <p className="text-xs font-medium text-slate-600 whitespace-pre-line">{doc.observation}</p>}
                <p className="text-[11px] font-bold text-slate-400 truncate">
                  {doc.file_name} · {formatBytes(doc.file_size)} · {doc.uploaded_by ?? '—'} · {formatDateTime(doc.created_at)}
                </p>
              </div>
              <ViewPdfButton fileName={doc.file_name} getUrl={() => ordenService.getDocumentDownloadUrl(doc.id, true)} size={16} className="p-2.5 rounded-xl text-[#004C6C] hover:bg-blue-50 shrink-0" />
              <button type="button" onClick={() => handleDownload(doc.id)} disabled={downloadingId === doc.id}
                className="p-2.5 rounded-xl text-[#004C6C] hover:bg-blue-50 shrink-0" title="Descargar">
                {downloadingId === doc.id ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
              </button>
              {doc.can_delete && (
                <DeleteRecordButton compact
                  title={`Eliminar ${doc.step_label} N.º ${doc.number}`}
                  message="La orden vuelve a este paso para cargar el documento de nuevo. Si ya estaba completada, su cuenta por pagar se anula (no se puede si ya tiene pagos); si es la factura, la factura del mes vuelve a quedar pendiente."
                  successMessage={`${doc.step_label} eliminada.`}
                  onDelete={async (reason) => onUploaded(await ordenService.deleteDocument(doc.id, reason))}
                  className="p-2.5 rounded-xl text-rose-500 hover:bg-rose-50 disabled:opacity-60 shrink-0"
                />
              )}
            </li>
          ))}
        </ul>
      )}

      {/* Paso pendiente que no le corresponde al usuario */}
      {waitingInvoice ? (
        <p className="flex items-center gap-1 text-[11px] font-bold text-orange-600">
          <Clock size={13} /> Pendiente de la factura del proveedor: Contabilidad la carga en Facturas del mes y el residente responsable la asocia a esta orden.
        </p>
      ) : !uploadStep && currentStep && (
        <p className="flex items-center gap-1 text-[11px] font-bold text-orange-600">
          <Clock size={13} /> Pendiente: {orden.current_step_label} ({steps.find((s) => s.key === currentStep)?.responsible}).
        </p>
      )}
      {orden.status === 'pendiente_aprobacion_contable' && (
        <p className="flex items-center gap-1 text-[11px] font-bold text-orange-600">
          <Clock size={13} /> Pendiente de aprobación de Contabilidad para pasar a cuentas por pagar.
        </p>
      )}

      {uploadStep && (
        <form onSubmit={handleSubmit} className="space-y-4 border-t border-slate-100 pt-5">
          <div>
            <p className="font-black text-slate-700">Cargar {orden.current_step_label?.toLowerCase()}</p>
            <p className="text-xs font-bold text-slate-400 mt-0.5">{STEP_HINTS[uploadStep]}</p>
          </div>

          <div className="space-y-2">
            <label className={labelClass}>{orden.current_step_number_label} *</label>
            <input disabled={submitting} className={inputClass} placeholder="Número del documento"
              value={number} onChange={(e) => setNumber(e.target.value)} />
          </div>

          <div className="space-y-2">
            <label className={labelClass}>Observación</label>
            <textarea rows={2} disabled={submitting} className={`${inputClass} resize-none`} placeholder="Opcional"
              value={observation} onChange={(e) => setObservation(e.target.value)} />
          </div>

          <div className="space-y-2">
            <label className={labelClass}>Archivo *</label>
            <FileDrop file={file} onSelect={selectFile} disabled={submitting} progress={progress}
              hint="Arrastra el archivo o haz clic para seleccionarlo" />
          </div>

          <button type="submit" disabled={submitting}
            className="w-full px-6 py-3.5 bg-[#004C6C] hover:bg-[#003a53] text-white rounded-2xl font-bold shadow-lg flex items-center justify-center gap-2 disabled:opacity-60">
            {submitting ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
            {submitting && progress !== null && progress < 100 ? `Subiendo archivo... ${progress}%` : 'Cargar y notificar'}
          </button>
        </form>
      )}

      {documents.length === 0 && !uploadStep && !waitingInvoice && (
        <p className="text-xs font-bold text-slate-400">Almacén carga la orden de compra del ERP y el residente asocia la factura desde Facturas del mes.</p>
      )}
    </div>
  );
};
