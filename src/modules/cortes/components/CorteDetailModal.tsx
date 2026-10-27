import React, { useEffect, useState } from 'react';
import {
  X, Scissors, Download, Loader2, CheckCircle2, Undo2, Clock, Circle, RotateCcw, Send, AlertCircle, FileText,
} from 'lucide-react';
import { Portal } from '../../../components/ui/Portal';
import { HistoryButton, HistoryModal } from '../../../components/ui/HistoryModal';
import { formatDateTime } from '../../../utils/dateUtils';
import { corteService, getApiErrorMessage } from '../services/corteService';
import { CorteStatusBadge } from './CorteStatusBadge';
import { CorteInvoicesSection } from './CorteInvoicesSection';
import { formatBytes } from '../utils/format';
import type { Corte, CorteHistoryEntry, CorteInvoicePayload, CorteProgressStep, InvoiceDocumentType } from '../types';

interface CorteDetailModalProps {
  corteId: number | null;
  onClose: () => void;
  onReview: (id: number, decision: 'aprobar' | 'devolver', comment?: string) => Promise<Corte>;
  onResubmit: (corte: Corte) => void;
  onCreateInvoice: (corteId: number, payload: CorteInvoicePayload) => Promise<Corte>;
  onConfirmMultifox: (invoiceId: number) => Promise<Corte>;
  invoiceDocumentTypes: { key: InvoiceDocumentType; label: string }[];
  maxUploadMb: number;
}

const STEP_STYLES: Record<CorteProgressStep['state'], { icon: React.ReactNode; tone: string; text: string }> = {
  aprobado: { icon: <CheckCircle2 size={20} />, tone: 'bg-green-50 text-green-600 border-green-100', text: 'Aprobado' },
  devuelto: { icon: <Undo2 size={20} />, tone: 'bg-red-50 text-red-600 border-red-100', text: 'Devuelto' },
  actual: { icon: <Clock size={20} />, tone: 'bg-orange-50 text-[#EE9D4C] border-orange-100', text: 'En revisión' },
  pendiente: { icon: <Circle size={20} />, tone: 'bg-slate-50 text-slate-300 border-slate-100', text: 'Pendiente' },
};

const ACTION_LABELS: Record<CorteHistoryEntry['action'], { label: string; tone: string }> = {
  radicado: { label: 'Radicado', tone: 'text-[#004C6C]' },
  reenviado: { label: 'Reenviado', tone: 'text-[#004C6C]' },
  aprobado: { label: 'Aprobado', tone: 'text-green-600' },
  devuelto: { label: 'Devuelto', tone: 'text-red-600' },
  factura: { label: 'Documento de facturación cargado', tone: 'text-teal-700' },
  multifox: { label: 'Cargada en Multifox', tone: 'text-green-700' },
};

// El contenido se monta por cada corte abierto (`key`), así arranca sin datos del corte anterior
export const CorteDetailModal: React.FC<CorteDetailModalProps> = ({ corteId, ...props }) => (
  <Portal isOpen={corteId !== null} onClose={props.onClose}>
    {corteId !== null && <CorteDetailContent key={corteId} corteId={corteId} {...props} />}
  </Portal>
);

const CorteDetailContent: React.FC<Omit<CorteDetailModalProps, 'corteId'> & { corteId: number }> = ({
  corteId, onClose, onReview, onResubmit, onCreateInvoice, onConfirmMultifox, invoiceDocumentTypes, maxUploadMb,
}) => {
  const [corte, setCorte] = useState<Corte | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [decision, setDecision] = useState<'aprobar' | 'devolver' | null>(null);
  const [comment, setComment] = useState('');
  const [saving, setSaving] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);

  useEffect(() => {
    corteService.getCorte(corteId)
      .then(setCorte)
      .catch((err) => setError(getApiErrorMessage(err, 'Error al cargar el corte.')));
  }, [corteId]);

  const loading = !corte && !error;

  const handleDownload = async () => {
    if (!corte) return;
    setDownloading(true);
    try {
      window.open(await corteService.getDownloadUrl(corte.id), '_blank', 'noopener');
    } catch (err) {
      setError(getApiErrorMessage(err, 'Error al descargar el archivo.'));
    } finally {
      setDownloading(false);
    }
  };

  const handleReview = async () => {
    if (!corte || !decision) return;
    if (decision === 'devolver' && !comment.trim()) {
      setError('Indica el motivo de la devolución para que el residente sepa qué corregir.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      setCorte(await onReview(corte.id, decision, comment.trim() || undefined));
      setDecision(null);
      setComment('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al registrar la revisión.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-[#f8fafc] w-full max-w-4xl rounded-[40px] shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-white p-8 border-b border-slate-100 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <div className="h-12 w-12 shrink-0 bg-blue-50 text-[#004C6C] rounded-2xl flex items-center justify-center">
              <Scissors size={24} />
            </div>
            <div className="min-w-0">
              <h2 className="text-2xl font-black text-[#004C6C] tracking-tight truncate">{corte ? `Corte ${corte.code}` : 'Corte'}</h2>
              {corte && (
                <div className="mt-1"><CorteStatusBadge status={corte.status} label={corte.status_label} /></div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {corte && <HistoryButton count={corte.history?.length} onClick={() => setHistoryOpen(true)} />}
            <button onClick={onClose} className="p-3 text-slate-300 hover:bg-slate-50 rounded-2xl transition-all cursor-pointer">
              <X size={24} />
            </button>
          </div>
        </div>

        <div className="p-8 space-y-6 overflow-y-auto flex-1">
          {error && (
            <div className="p-4 bg-red-50 border border-red-100 rounded-2xl text-xs font-bold text-red-600 flex items-center gap-2 justify-center">
              <AlertCircle size={16} className="shrink-0" />
              <span className="whitespace-pre-line">{error}</span>
            </div>
          )}

          {loading && !corte && (
            <div className="flex justify-center py-16"><Loader2 size={28} className="animate-spin text-[#004C6C]" /></div>
          )}

          {corte && (
            <>
              {/* Fases del flujo */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {(corte.progress ?? []).map((step, index) => {
                  const style = STEP_STYLES[step.state];
                  return (
                    <div key={step.key} className={`rounded-3xl border p-4 flex items-center gap-3 ${style.tone}`}>
                      <div className="shrink-0">{style.icon}</div>
                      <div className="min-w-0">
                        <p className="text-[10px] font-black uppercase tracking-widest opacity-70">Fase {index + 1}</p>
                        <p className="font-black text-slate-700">{step.label}</p>
                        <p className="text-[11px] font-bold truncate">
                          {style.text}{step.user ? ` · ${step.user}` : ''}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Datos */}
              <div className="bg-white rounded-3xl border border-slate-100 p-6 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 text-sm">
                {[
                  ['Proyecto / Torre', `${corte.project?.name ?? '—'}${corte.tower ? ` · ${corte.tower.name}` : ''}`],
                  ['Proveedor', corte.contractor?.name ?? '—'],
                  ['Contrato relacionado', corte.contract?.contract_code ?? '—'],
                  ['Radicado por', corte.created_by?.name ?? '—'],
                  ['Fecha de radicación', formatDateTime(corte.created_at)],
                  ['Aprobado', corte.approved_at ? formatDateTime(corte.approved_at) : '—'],
                ].map(([label, value]) => (
                  <div key={label}>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
                    <p className="font-bold text-slate-700">{value}</p>
                  </div>
                ))}
                <div className="md:col-span-2 flex items-center justify-between gap-4 bg-slate-50 rounded-2xl p-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <FileText size={20} className="text-[#004C6C] shrink-0" />
                    <div className="min-w-0">
                      <p className="font-black text-slate-700 truncate" title={corte.file_name}>{corte.file_name}</p>
                      <p className="text-[11px] font-bold text-slate-400">{formatBytes(corte.file_size)}</p>
                    </div>
                  </div>
                  <button onClick={handleDownload} disabled={downloading}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#004C6C] text-white text-xs font-bold hover:bg-[#003a53] disabled:opacity-60 shrink-0">
                    {downloading ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />} Descargar
                  </button>
                </div>
              </div>

              {/* Revisión de la etapa actual */}
              {corte.can_review && (
                <div className="bg-white rounded-3xl border border-orange-100 p-6 space-y-4">
                  <h3 className="font-black text-[#004C6C] tracking-tight">Tu revisión como {corte.current_stage_label}</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <button type="button" onClick={() => setDecision('aprobar')} disabled={saving}
                      className={`px-4 py-3.5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${decision === 'aprobar' ? 'bg-green-600 text-white shadow-lg' : 'bg-green-50 text-green-700 hover:bg-green-100'}`}>
                      <CheckCircle2 size={18} /> Aprobar (OK)
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
                      <button type="button" onClick={handleReview} disabled={saving}
                        className="w-full px-6 py-4 bg-[#004C6C] hover:bg-[#003a53] text-white rounded-2xl font-bold shadow-xl flex items-center justify-center gap-2 disabled:opacity-60">
                        {saving ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                        {decision === 'aprobar' ? 'Confirmar aprobación' : 'Confirmar devolución'}
                      </button>
                    </>
                  )}
                </div>
              )}

              {corte.can_resubmit && (
                <div className="bg-orange-50 border border-orange-100 rounded-3xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <p className="text-sm font-bold text-orange-700">
                    Este corte fue devuelto por {corte.returned_stage_label}. Corrígelo y reenvíalo para reiniciar la revisión.
                  </p>
                  <button onClick={() => onResubmit(corte)}
                    className="flex items-center justify-center gap-2 bg-[#EE9D4C] hover:bg-[#e08a35] text-white px-5 py-3 rounded-2xl font-bold shrink-0">
                    <RotateCcw size={16} /> Corregir y reenviar
                  </button>
                </div>
              )}

              {/* Facturación: con las tres aprobaciones */}
              {(corte.can_invoice || (corte.invoices?.length ?? 0) > 0) && (
                <CorteInvoicesSection
                  corte={corte}
                  documentTypes={invoiceDocumentTypes}
                  maxUploadMb={maxUploadMb}
                  onCreate={onCreateInvoice}
                  onCreated={setCorte}
                  onConfirmMultifox={onConfirmMultifox}
                />
              )}
            </>
          )}
        </div>
      </div>

      {corte && (
        <HistoryModal isOpen={historyOpen} onClose={() => setHistoryOpen(false)} subtitle={`Corte ${corte.code}`}>
          <ol className="relative border-l-2 border-slate-100 ml-2 space-y-5">
            {(corte.history ?? []).map((entry) => {
              const action = ACTION_LABELS[entry.action];
              return (
                <li key={entry.id} className="ml-5">
                  <span className="absolute -left-[7px] mt-1.5 h-3 w-3 rounded-full bg-white border-2 border-slate-300" />
                  <p className="text-sm font-bold text-slate-700">
                    <span className={`font-black ${action.tone}`}>{action.label}</span>
                    {entry.stage_label ? ` por ${entry.stage_label}` : ''}
                    <span className="text-slate-400 font-bold"> · {entry.user ?? '—'}</span>
                  </p>
                  <p className="text-[11px] font-bold text-slate-400">
                    {formatDateTime(entry.created_at)}{entry.file_name ? ` · ${entry.file_name}` : ''}
                  </p>
                  {entry.comment && (
                    <p className="mt-1 text-xs font-medium text-slate-600 bg-slate-50 rounded-xl px-3 py-2 whitespace-pre-line">{entry.comment}</p>
                  )}
                </li>
              );
            })}
          </ol>
        </HistoryModal>
      )}
    </div>
  );
};
