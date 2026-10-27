import React, { useRef, useState } from 'react';
import { isAxiosError } from 'axios';
import { Package, Download, Loader2, UploadCloud, FileText, Send, AlertCircle } from 'lucide-react';
import { formatDateTime } from '../../../utils/dateUtils';
import { formatMoney, formatMoneyInput, parseMoney } from '../../../utils/money';
import { CustomSelect } from '../../../components/ui/CustomSelect';
import { formatBytes, formatMaxSize } from '../../cortes/utils/format';
import { ordenService, getApiErrorMessage } from '../services/ordenService';
import type { Orden, OrdenCatalogs, OrdenDocumentPayload, OrdenStepKey } from '../types';

interface OrdenDocumentsSectionProps {
  orden: Orden;
  steps: OrdenCatalogs['steps'];
  contractors: OrdenCatalogs['contractors'];
  maxUploadMb: number;
  onUpload: (id: number, payload: OrdenDocumentPayload) => Promise<Orden>;
  onUploaded: (orden: Orden) => void;
}

const inputClass =
  'w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 text-sm font-bold text-slate-700 outline-none transition-all placeholder:text-slate-400 hover:border-slate-300 focus:bg-white focus:border-[#004C6C] focus:ring-4 focus:ring-blue-50 disabled:bg-slate-100 disabled:border-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed';
const labelClass = 'text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1';

// Indicaciones para quien carga cada documento
const STEP_HINTS: Record<OrdenStepKey, string> = {
  orden_erp: 'Crea la orden de compra en el ERP y adjunta el archivo que genera. Se notificará a Facturación.',
  factura: 'Adjunta la factura con su proveedor y valor. Se notificará a Almacén para registrar la entrada; al completarse, pasa a cuentas por pagar.',
  entrada: 'Registra la entrada de almacén y adjunta el soporte. Con esto la orden queda completada.',
};

/**
 * Documentos posteriores a la aprobación: los ya cargados (con descarga) y, para el responsable del paso actual,
 * el formulario de cargue con número, observación y archivo (directo a S3).
 */
export const OrdenDocumentsSection: React.FC<OrdenDocumentsSectionProps> = ({ orden, steps, contractors, maxUploadMb, onUpload, onUploaded }) => {
  const documents = orden.documents ?? [];
  const [number, setNumber] = useState('');
  const [observation, setObservation] = useState('');
  const [amount, setAmount] = useState('');
  const [contractorId, setContractorId] = useState<number | null>(null);
  const [file, setFile] = useState<File | null>(null);
  // Si el registro falla por validación no hay que volver a subir el archivo
  const [uploadedToken, setUploadedToken] = useState<string | null>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const step = orden.can_upload_step ? orden.current_step : null;
  const isInvoice = step === 'factura';

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
    if (isInvoice && (!contractorId || !parseMoney(amount))) return setError('Selecciona el proveedor e indica el valor de la factura.');
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
      const updated = await onUpload(orden.id, {
        number: number.trim(),
        observation: observation.trim() || null,
        amount: isInvoice ? parseMoney(amount) : null,
        contractor_id: isInvoice ? contractorId : null,
        upload_token: token,
      });
      setNumber('');
      setObservation('');
      setAmount('');
      setContractorId(null);
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
    <div className="bg-white rounded-3xl border border-teal-100 p-6 space-y-5">
      <div className="flex items-center gap-2">
        <Package size={18} className="text-teal-600" />
        <h3 className="font-black text-[#004C6C] tracking-tight">Compra y recepción</h3>
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
          {documents.length} de {steps.length} documentos
        </span>
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
            <li key={doc.id} className="flex items-start justify-between gap-3 bg-slate-50 rounded-2xl p-4">
              <div className="min-w-0 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-teal-50 text-teal-700">
                    {doc.step_label}
                  </span>
                  <span className="font-black text-slate-700">N.º {doc.number}</span>
                  {doc.amount !== null && <span className="font-black text-teal-700">{formatMoney(doc.amount)}</span>}
                </div>
                {doc.contractor && <p className="text-xs font-bold text-slate-600">{doc.contractor.name}{doc.contractor.nit ? ` · NIT ${doc.contractor.nit}` : ''}</p>}
                {doc.observation && <p className="text-xs font-medium text-slate-600 whitespace-pre-line">{doc.observation}</p>}
                <p className="text-[11px] font-bold text-slate-400 truncate">
                  {doc.file_name} · {formatBytes(doc.file_size)} · {doc.uploaded_by ?? '—'} · {formatDateTime(doc.created_at)}
                </p>
              </div>
              <button type="button" onClick={() => handleDownload(doc.id)} disabled={downloadingId === doc.id}
                className="p-2.5 rounded-xl text-[#004C6C] hover:bg-blue-50 shrink-0" title="Descargar">
                {downloadingId === doc.id ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* Paso pendiente que no le corresponde al usuario */}
      {!step && orden.current_step && (
        <p className="text-xs font-bold text-slate-500 bg-slate-50 rounded-2xl px-4 py-3">
          Pendiente: {orden.current_step_label} ({steps.find((s) => s.key === orden.current_step)?.responsible}).
        </p>
      )}

      {step && (
        <form onSubmit={handleSubmit} className="space-y-4 border-t border-slate-100 pt-5">
          <div>
            <p className="font-black text-slate-700">Cargar {orden.current_step_label?.toLowerCase()}</p>
            <p className="text-xs font-bold text-slate-400 mt-0.5">{STEP_HINTS[step]}</p>
          </div>

          {isInvoice && (
            <CustomSelect
              pyClass="py-3.5"
              label="Proveedor *"
              placeholder="Selecciona el proveedor"
              disabled={submitting}
              options={contractors.map((c) => ({ value: c.id, label: c.name, sublabel: c.nit ? `NIT ${c.nit}` : undefined }))}
              value={contractorId}
              onChange={(v) => setContractorId(Number(v))}
            />
          )}

          <div className={`grid grid-cols-1 gap-4 ${isInvoice ? 'md:grid-cols-2' : ''}`}>
            <div className="space-y-2">
              <label className={labelClass}>{orden.current_step_number_label} *</label>
              <input disabled={submitting} className={inputClass} placeholder="Número del documento"
                value={number} onChange={(e) => setNumber(e.target.value)} />
            </div>
            {isInvoice && (
              <div className="space-y-2">
                <label className={labelClass}>Valor de la factura *</label>
                <div className="relative">
                  <span className="absolute left-5 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">$</span>
                  <input disabled={submitting} inputMode="numeric" className={`${inputClass} pl-9`} placeholder="0"
                    value={amount} onChange={(e) => setAmount(formatMoneyInput(e.target.value))} />
                </div>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <label className={labelClass}>Observación</label>
            <textarea rows={2} disabled={submitting} className={`${inputClass} resize-none`} placeholder="Opcional"
              value={observation} onChange={(e) => setObservation(e.target.value)} />
          </div>

          <div className="space-y-2">
            <label className={labelClass}>Archivo *</label>
            <div onClick={() => !submitting && fileInputRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => { e.preventDefault(); if (!submitting) selectFile(e.dataTransfer.files[0]); }}
              className="border-2 border-dashed border-slate-300 hover:border-[#004C6C]/60 hover:bg-blue-50/30 rounded-3xl p-5 flex flex-col items-center justify-center gap-1.5 text-center cursor-pointer bg-slate-50 transition-all">
              <input ref={fileInputRef} type="file" className="hidden"
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
                  <p className="text-sm font-bold text-slate-500">Arrastra el archivo o haz clic para seleccionarlo</p>
                </>
              )}
            </div>
            {progress !== null && (
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-[#004C6C] transition-all" style={{ width: `${progress}%` }} />
              </div>
            )}
          </div>

          <button type="submit" disabled={submitting}
            className="w-full px-6 py-3.5 bg-[#004C6C] hover:bg-[#003a53] text-white rounded-2xl font-bold shadow-lg flex items-center justify-center gap-2 disabled:opacity-60">
            {submitting ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
            {submitting && progress !== null && progress < 100 ? `Subiendo archivo... ${progress}%` : 'Cargar y notificar'}
          </button>
        </form>
      )}
    </div>
  );
};
