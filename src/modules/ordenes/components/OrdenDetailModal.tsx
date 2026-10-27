import React, { useEffect, useState } from 'react';
import { X, ShoppingCart, Loader2, CheckCircle2, Undo2, Clock, Circle, RotateCcw, Send, AlertCircle } from 'lucide-react';
import { Portal } from '../../../components/ui/Portal';
import { HistoryButton, HistoryModal } from '../../../components/ui/HistoryModal';
import { formatDateTime } from '../../../utils/dateUtils';
import { ordenService, getApiErrorMessage } from '../services/ordenService';
import { OrdenStatusBadge } from './OrdenStatusBadge';
import { OrdenDocumentsSection } from './OrdenDocumentsSection';
import type { Orden, OrdenCatalogs, OrdenDocumentPayload, OrdenHistoryEntry, OrdenProgressStep } from '../types';

interface OrdenDetailModalProps {
  ordenId: number | null;
  onClose: () => void;
  onReview: (id: number, decision: 'aprobar' | 'devolver', comment?: string) => Promise<Orden>;
  onResubmit: (orden: Orden) => void;
  onUploadDocument: (id: number, payload: OrdenDocumentPayload) => Promise<Orden>;
  steps: OrdenCatalogs['steps'];
  contractors: OrdenCatalogs['contractors'];
  maxUploadMb: number;
}

const STEP_STYLES: Record<OrdenProgressStep['state'], { icon: React.ReactNode; tone: string }> = {
  aprobado: { icon: <CheckCircle2 size={18} />, tone: 'bg-green-50 text-green-600 border-green-100' },
  devuelto: { icon: <Undo2 size={18} />, tone: 'bg-red-50 text-red-600 border-red-100' },
  actual: { icon: <Clock size={18} />, tone: 'bg-orange-50 text-[#EE9D4C] border-orange-100' },
  pendiente: { icon: <Circle size={18} />, tone: 'bg-slate-50 text-slate-300 border-slate-100' },
};

const STATE_TEXT: Record<OrdenProgressStep['kind'], Record<OrdenProgressStep['state'], string>> = {
  approval: { aprobado: 'Aprobado', devuelto: 'Devuelto', actual: 'Por aprobar', pendiente: 'Pendiente' },
  document: { aprobado: 'Cargado', devuelto: 'Devuelto', actual: 'Por cargar', pendiente: 'Pendiente' },
};

const ACTION_LABELS: Record<OrdenHistoryEntry['action'], { label: string; tone: string }> = {
  registrada: { label: 'Registrada', tone: 'text-[#004C6C]' },
  reenviada: { label: 'Reenviada', tone: 'text-[#004C6C]' },
  aprobado: { label: 'Aprobada', tone: 'text-green-600' },
  devuelto: { label: 'Devuelta', tone: 'text-red-600' },
  documento: { label: 'Documento cargado', tone: 'text-teal-700' },
};

// El contenido se monta por cada orden abierta (`key`), así arranca sin datos de la orden anterior
export const OrdenDetailModal: React.FC<OrdenDetailModalProps> = ({ ordenId, ...props }) => (
  <Portal isOpen={ordenId !== null} onClose={props.onClose}>
    {ordenId !== null && <OrdenDetailContent key={ordenId} ordenId={ordenId} {...props} />}
  </Portal>
);

const OrdenDetailContent: React.FC<Omit<OrdenDetailModalProps, 'ordenId'> & { ordenId: number }> = ({
  ordenId, onClose, onReview, onResubmit, onUploadDocument, steps, contractors, maxUploadMb,
}) => {
  const [orden, setOrden] = useState<Orden | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [decision, setDecision] = useState<'aprobar' | 'devolver' | null>(null);
  const [comment, setComment] = useState('');
  const [saving, setSaving] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);

  useEffect(() => {
    ordenService.getOrden(ordenId)
      .then(setOrden)
      .catch((err) => setError(getApiErrorMessage(err, 'Error al cargar la orden.')));
  }, [ordenId]);

  const handleReview = async () => {
    if (!orden || !decision) return;
    if (decision === 'devolver' && !comment.trim()) {
      setError('Indica el motivo de la devolución para que el residente sepa qué corregir.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      setOrden(await onReview(orden.id, decision, comment.trim() || undefined));
      setDecision(null);
      setComment('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al registrar la aprobación.');
    } finally {
      setSaving(false);
    }
  };

  const showDocuments = orden && (orden.current_step !== null || (orden.documents?.length ?? 0) > 0);

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-[#f8fafc] w-full max-w-4xl rounded-[40px] shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-white p-8 border-b border-slate-100 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <div className="h-12 w-12 shrink-0 bg-blue-50 text-[#004C6C] rounded-2xl flex items-center justify-center">
              <ShoppingCart size={24} />
            </div>
            <div className="min-w-0">
              <h2 className="text-2xl font-black text-[#004C6C] tracking-tight truncate">{orden ? `Orden ${orden.code}` : 'Orden'}</h2>
              {orden && <div className="mt-1"><OrdenStatusBadge status={orden.status} label={orden.status_label} /></div>}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {orden && <HistoryButton count={orden.history?.length} onClick={() => setHistoryOpen(true)} />}
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

          {!orden && !error && (
            <div className="flex justify-center py-16"><Loader2 size={28} className="animate-spin text-[#004C6C]" /></div>
          )}

          {orden && (
            <>
              {/* Fases: 2 aprobaciones + 3 documentos */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                {(orden.progress ?? []).map((step, index) => {
                  const style = STEP_STYLES[step.state];
                  return (
                    <div key={step.key} className={`rounded-3xl border p-4 flex flex-col gap-2 ${style.tone}`}>
                      <div className="flex items-center justify-between">
                        <p className="text-[10px] font-black uppercase tracking-widest opacity-70">Fase {index + 1}</p>
                        {style.icon}
                      </div>
                      <p className="font-black text-slate-700 text-sm leading-tight">{step.label}</p>
                      <p className="text-[11px] font-bold truncate" title={step.user ?? undefined}>
                        {STATE_TEXT[step.kind][step.state]}{step.user ? ` · ${step.user}` : ''}
                      </p>
                    </div>
                  );
                })}
              </div>

              {/* Datos */}
              <div className="bg-white rounded-3xl border border-slate-100 p-6 space-y-4 text-sm">
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Descripción</p>
                  <p className="font-bold text-slate-700 whitespace-pre-line">{orden.description}</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                  {[
                    ['Presupuesto', `${orden.project?.name ?? '—'}${orden.tower ? ` · ${orden.tower.name}` : ''}`],
                    ['Capítulo', orden.chapter],
                    ['Actividad', orden.activity],
                    ['Registrada por', orden.created_by?.name ?? '—'],
                    ['Fecha de registro', formatDateTime(orden.created_at)],
                    ['Aprobada', orden.approved_at ? formatDateTime(orden.approved_at) : '—'],
                  ].map(([label, value]) => (
                    <div key={label}>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
                      <p className="font-bold text-slate-700">{value}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Aprobación de la etapa actual */}
              {orden.can_review && (
                <div className="bg-white rounded-3xl border border-orange-100 p-6 space-y-4">
                  <h3 className="font-black text-[#004C6C] tracking-tight">Tu aprobación como {orden.current_stage_label}</h3>
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
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 text-sm font-bold text-slate-700 outline-none transition-all resize-none placeholder:text-slate-400 hover:border-slate-300 focus:bg-white focus:border-[#004C6C] focus:ring-4 focus:ring-blue-50"
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

              {orden.can_resubmit && (
                <div className="bg-orange-50 border border-orange-100 rounded-3xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <p className="text-sm font-bold text-orange-700">
                    Esta orden fue devuelta por {orden.returned_stage_label}. Corrígela y reenvíala para reiniciar la aprobación.
                  </p>
                  <button onClick={() => onResubmit(orden)}
                    className="flex items-center justify-center gap-2 bg-[#EE9D4C] hover:bg-[#e08a35] text-white px-5 py-3 rounded-2xl font-bold shrink-0">
                    <RotateCcw size={16} /> Corregir y reenviar
                  </button>
                </div>
              )}

              {showDocuments && (
                <OrdenDocumentsSection
                  orden={orden}
                  steps={steps}
                  contractors={contractors}
                  maxUploadMb={maxUploadMb}
                  onUpload={onUploadDocument}
                  onUploaded={setOrden}
                />
              )}
            </>
          )}
        </div>
      </div>

      {orden && (
        <HistoryModal isOpen={historyOpen} onClose={() => setHistoryOpen(false)} subtitle={`Orden ${orden.code}`}>
          <ol className="relative border-l-2 border-slate-100 ml-2 space-y-5">
            {(orden.history ?? []).map((entry) => {
              const action = ACTION_LABELS[entry.action];
              return (
                <li key={entry.id} className="ml-5">
                  <span className="absolute -left-[7px] mt-1.5 h-3 w-3 rounded-full bg-white border-2 border-slate-300" />
                  <p className="text-sm font-bold text-slate-700">
                    <span className={`font-black ${action.tone}`}>{action.label}</span>
                    {entry.stage_label ? (entry.action === 'documento' ? ` · ${entry.stage_label}` : ` por ${entry.stage_label}`) : ''}
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
