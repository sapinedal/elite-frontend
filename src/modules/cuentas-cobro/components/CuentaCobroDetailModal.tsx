import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Receipt, Loader2, CheckCircle2, Undo2, Clock, Circle, RotateCcw, Send, AlertCircle, Download, Database, FileText, Paperclip, Wallet, ArrowRight,
} from 'lucide-react';
import { HistoryButton, HistoryModal } from '../../../components/ui/HistoryModal';
import { FileDrop } from '../../../components/ui/FileDrop';
import { ModalShell, inputClass, labelClass } from '../../../components/ui/ModalShell';
import { formatDateTime } from '../../../utils/dateUtils';
import { formatMoney } from '../../../utils/money';
import { formatBytes, formatMaxSize } from '../../cortes/utils/format';
import { cuentaCobroService, getApiErrorMessage } from '../services/cuentaCobroService';
import { CuentaCobroStatusBadge } from './CuentaCobroStatusBadge';
import type { CuentaCobro, CuentaCobroHistoryEntry, CuentaCobroMultifoxPayload, CuentaCobroProgressStep } from '../types';

interface CuentaCobroDetailModalProps {
  cuentaId: number | null;
  maxUploadMb: number;
  onClose: () => void;
  onReview: (id: number, decision: 'aprobar' | 'devolver', comment?: string) => Promise<CuentaCobro>;
  onResubmit: (cuenta: CuentaCobro) => void;
  onDecideMultifox: (id: number, requiresMultifox: boolean, comment?: string) => Promise<CuentaCobro>;
  onRegisterMultifox: (id: number, payload: CuentaCobroMultifoxPayload) => Promise<CuentaCobro>;
}

const STEP_STYLES: Record<CuentaCobroProgressStep['state'], { icon: React.ReactNode; tone: string }> = {
  aprobado: { icon: <CheckCircle2 size={18} />, tone: 'bg-green-50 text-green-600 border-green-100' },
  devuelto: { icon: <Undo2 size={18} />, tone: 'bg-red-50 text-red-600 border-red-100' },
  actual: { icon: <Clock size={18} />, tone: 'bg-orange-50 text-[#EE9D4C] border-orange-100' },
  pendiente: { icon: <Circle size={18} />, tone: 'bg-slate-50 text-slate-300 border-slate-100' },
};

const STATE_TEXT: Record<CuentaCobroProgressStep['kind'], Record<CuentaCobroProgressStep['state'], string>> = {
  approval: { aprobado: 'Aprobado', devuelto: 'Devuelto', actual: 'Por aprobar', pendiente: 'Pendiente' },
  document: { aprobado: 'Hecho', devuelto: 'Devuelto', actual: 'Por revisar', pendiente: 'Pendiente' },
};

const ACTION_LABELS: Record<CuentaCobroHistoryEntry['action'], { label: string; tone: string }> = {
  radicada: { label: 'Radicada', tone: 'text-[#004C6C]' },
  reenviada: { label: 'Reenviada', tone: 'text-[#004C6C]' },
  aprobado: { label: 'Aprobada', tone: 'text-green-600' },
  devuelto: { label: 'Devuelta', tone: 'text-red-600' },
  sin_multifox: { label: 'No requiere Multifox', tone: 'text-teal-700' },
  requiere_multifox: { label: 'Requiere Multifox', tone: 'text-purple-700' },
  multifox: { label: 'Cargada en Multifox', tone: 'text-teal-700' },
};

/**
 * Detalle de la cuenta de cobro: fases, datos, archivos (cuenta, adjuntos, soporte Multifox), aprobación,
 * reenvío y el panel de Paula (¿requiere Multifox? / cargar en Multifox).
 */
export const CuentaCobroDetailModal: React.FC<CuentaCobroDetailModalProps> = ({ cuentaId, ...props }) => (
  // Se monta por cada cuenta abierta (`key`), así arranca sin los datos de la anterior
  cuentaId !== null ? <DetailContent key={cuentaId} cuentaId={cuentaId} {...props} /> : null
);

const DetailContent: React.FC<Omit<CuentaCobroDetailModalProps, 'cuentaId'> & { cuentaId: number }> = ({
  cuentaId, maxUploadMb, onClose, onReview, onResubmit, onDecideMultifox, onRegisterMultifox,
}) => {
  const [cuenta, setCuenta] = useState<CuentaCobro | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [decision, setDecision] = useState<'aprobar' | 'devolver' | null>(null);
  const [comment, setComment] = useState('');
  const [saving, setSaving] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [downloading, setDownloading] = useState<string | null>(null);
  // Panel de Paula
  const [multifoxOpen, setMultifoxOpen] = useState(false);
  const [multifoxNumber, setMultifoxNumber] = useState('');
  const [multifoxFile, setMultifoxFile] = useState<File | null>(null);
  const [multifoxComment, setMultifoxComment] = useState('');

  useEffect(() => {
    cuentaCobroService.getCuenta(cuentaId)
      .then(setCuenta)
      .catch((err) => setError(getApiErrorMessage(err, 'Error al cargar la cuenta de cobro.')));
  }, [cuentaId]);

  const download = async (key: string, file: 'cuenta' | 'multifox' | 'adjunto', adjuntoId?: number) => {
    if (!cuenta) return;
    setDownloading(key);
    try {
      window.open(await cuentaCobroService.getDownloadUrl(cuenta.id, file, adjuntoId), '_blank', 'noopener');
    } catch (err) {
      setError(getApiErrorMessage(err, 'Error al descargar el archivo.'));
    } finally {
      setDownloading(null);
    }
  };

  // Ejecuta una acción del flujo y actualiza el detalle
  const act = async (action: () => Promise<CuentaCobro>, fallback: string) => {
    setSaving(true);
    setError(null);
    try {
      setCuenta(await action());
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : fallback);
      return false;
    } finally {
      setSaving(false);
    }
  };

  const handleReview = async () => {
    if (!cuenta || !decision) return;
    if (decision === 'devolver' && !comment.trim()) return setError('Indica el motivo de la devolución.');
    if (await act(() => onReview(cuenta.id, decision, comment.trim() || undefined), 'Error al registrar la aprobación.')) {
      setDecision(null);
      setComment('');
    }
  };

  const handleMultifox = async () => {
    if (!cuenta) return;
    if (!multifoxNumber.trim()) return setError('Indica el número en Multifox.');
    await act(async () => {
      const token = multifoxFile ? await cuentaCobroService.uploadFile(multifoxFile) : null;
      return onRegisterMultifox(cuenta.id, { multifox_number: multifoxNumber.trim(), upload_token: token, comment: multifoxComment.trim() || null });
    }, 'Error al cargar en Multifox.');
  };

  const fileRow = (key: string, label: string, name: string, size: number | null | undefined, icon: React.ReactNode, onDownload: () => void) => (
    <div key={key} className="flex items-center justify-between gap-3 bg-slate-50 rounded-2xl p-3">
      <span className="flex items-center gap-2 min-w-0">
        {icon}
        <span className="min-w-0">
          <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</span>
          <span className="block text-xs font-bold text-slate-700 truncate">{name}{size ? ` · ${formatBytes(size)}` : ''}</span>
        </span>
      </span>
      <button type="button" onClick={onDownload} className="p-2 rounded-xl text-[#004C6C] hover:bg-blue-50 shrink-0" title="Descargar">
        {downloading === key ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
      </button>
    </div>
  );

  return (
    <>
      <ModalShell
        isOpen
        onClose={onClose}
        icon={<Receipt size={24} />}
        title={cuenta ? `Cuenta de cobro ${cuenta.code}` : 'Cuenta de cobro'}
        subtitle={cuenta ? `${cuenta.tipo?.name ?? ''} · ${cuenta.contractor?.name ?? ''}` : undefined}
        maxWidth="max-w-4xl"
      >
        {error && (
          <div className="p-3 bg-red-50 border border-red-100 rounded-2xl text-xs font-bold text-red-600 flex items-center gap-2">
            <AlertCircle size={16} className="shrink-0" /> <span className="whitespace-pre-line">{error}</span>
          </div>
        )}

        {!cuenta ? (
          !error && <div className="flex justify-center py-16"><Loader2 size={28} className="animate-spin text-[#004C6C]" /></div>
        ) : (
          <>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <CuentaCobroStatusBadge status={cuenta.status} label={cuenta.status_label} />
              <HistoryButton count={cuenta.history?.length} onClick={() => setHistoryOpen(true)} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {(cuenta.progress ?? []).map((step, index) => {
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

            <div className="bg-white rounded-3xl border border-slate-100 p-6 space-y-4 text-sm">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                {[
                  ['Valor', formatMoney(cuenta.amount)],
                  ['N.º cuenta de cobro', cuenta.document_number],
                  ['Tipo', cuenta.tipo?.name ?? '—'],
                  ['Proveedor', cuenta.contractor ? `${cuenta.contractor.name}${cuenta.contractor.nit ? ` · NIT ${cuenta.contractor.nit}` : ''}` : '—'],
                  ['Proyecto / Frente', `${cuenta.project?.name ?? '—'} · ${cuenta.tower?.name ?? 'General / Indirectos'}`],
                  ['Contrato', cuenta.contract?.contract_code ?? '—'],
                  ['Radicada por', `${cuenta.created_by?.name ?? '—'} · ${formatDateTime(cuenta.created_at)}`],
                  ['Multifox', cuenta.requires_multifox === null ? 'Por decidir' : cuenta.requires_multifox
                    ? (cuenta.multifox_number ? `N.º ${cuenta.multifox_number}` : 'Requiere, pendiente de cargue') : 'No requiere'],
                ].map(([label, value]) => (
                  <div key={label}>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
                    <p className="font-bold text-slate-700">{value}</p>
                  </div>
                ))}
              </div>
              {cuenta.description && (
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Concepto</p>
                  <p className="font-bold text-slate-700 whitespace-pre-line">{cuenta.description}</p>
                </div>
              )}
              <div className="space-y-2">
                {fileRow('cuenta', 'Cuenta de cobro', cuenta.file_name, cuenta.file_size, <FileText size={18} className="text-slate-400 shrink-0" />, () => download('cuenta', 'cuenta'))}
                {(cuenta.adjuntos ?? []).map((a) => fileRow(`a${a.id}`, 'Adjunto', a.file_name, a.file_size,
                  <Paperclip size={18} className="text-slate-400 shrink-0" />, () => download(`a${a.id}`, 'adjunto', a.id)))}
                {cuenta.multifox_file_name && fileRow('multifox', 'Soporte Multifox', cuenta.multifox_file_name, cuenta.multifox_file_size,
                  <Database size={18} className="text-slate-400 shrink-0" />, () => download('multifox', 'multifox'))}
              </div>
              {cuenta.status === 'en_pagos' && (
                <Link to="/app/contratacion/cuentas-por-pagar" className="inline-flex items-center gap-1.5 text-xs font-black text-[#004C6C] hover:underline">
                  <Wallet size={14} /> Ver en el cuadro de pagos →
                </Link>
              )}
            </div>

            {cuenta.can_review && (
              <div className="bg-white rounded-3xl border border-orange-100 p-6 space-y-4">
                <h3 className="font-black text-[#004C6C] tracking-tight">Tu aprobación como {cuenta.current_stage_label}</h3>
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
                      className={`${inputClass} resize-none`}
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

            {cuenta.can_resubmit && (
              <div className="bg-orange-50 border border-orange-100 rounded-3xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <p className="text-sm font-bold text-orange-700">
                  Esta cuenta de cobro fue devuelta por {cuenta.returned_stage_label}. Corrígela y reenvíala para reiniciar la aprobación.
                </p>
                <button onClick={() => onResubmit(cuenta)}
                  className="flex items-center justify-center gap-2 bg-[#EE9D4C] hover:bg-[#e08a35] text-white px-5 py-3 rounded-2xl font-bold shrink-0">
                  <RotateCcw size={16} /> Corregir y reenviar
                </button>
              </div>
            )}

            {/* Paula: ¿requiere Multifox? */}
            {cuenta.can_handle_multifox && (
              <div className="bg-white rounded-3xl border border-teal-100 p-6 space-y-4">
                <div className="flex items-center gap-2">
                  <Database size={18} className="text-teal-600" />
                  <h3 className="font-black text-[#004C6C] tracking-tight">
                    {cuenta.status === 'pendiente_revision' ? '¿Requiere cargue en Multifox?' : 'Cargar en Multifox'}
                  </h3>
                </div>

                {cuenta.status === 'pendiente_revision' && !multifoxOpen && (
                  <>
                    <p className="text-xs font-bold text-slate-500">
                      Si no requiere Multifox pasa de una vez al cuadro de pagos. Si requiere, pasa cuando la cargues.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <button type="button" disabled={saving}
                        onClick={() => act(() => onDecideMultifox(cuenta.id, false), 'Error al registrar la decisión.')}
                        className="px-4 py-3.5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 bg-green-50 text-green-700 hover:bg-green-100 disabled:opacity-60">
                        <ArrowRight size={18} /> No requiere: al cuadro de pagos
                      </button>
                      <button type="button" disabled={saving} onClick={() => setMultifoxOpen(true)}
                        className="px-4 py-3.5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 bg-[#004C6C] text-white hover:bg-[#003a53] disabled:opacity-60">
                        <Database size={18} /> Cargar en Multifox ahora
                      </button>
                      <button type="button" disabled={saving}
                        onClick={() => act(() => onDecideMultifox(cuenta.id, true), 'Error al registrar la decisión.')}
                        className="px-4 py-3.5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 bg-purple-50 text-purple-700 hover:bg-purple-100 disabled:opacity-60">
                        <Clock size={18} /> Requiere: cargar después
                      </button>
                    </div>
                  </>
                )}

                {(cuenta.status === 'pendiente_multifox' || multifoxOpen) && (
                  <>
                    <div className="space-y-2">
                      <label className={labelClass}>N.º en Multifox *</label>
                      <input disabled={saving} className={inputClass} placeholder="Ej: MF-0123"
                        value={multifoxNumber} onChange={(e) => setMultifoxNumber(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <label className={labelClass}>Soporte de Multifox (opcional)</label>
                      <FileDrop file={multifoxFile} disabled={saving} hint="Arrastra el documento de Multifox o haz clic"
                        onSelect={(f) => {
                          if (f.size > maxUploadMb * 1024 * 1024) return setError(`El archivo supera el máximo de ${formatMaxSize(maxUploadMb)}.`);
                          setMultifoxFile(f);
                        }} />
                    </div>
                    <textarea rows={2} disabled={saving} value={multifoxComment} onChange={(e) => setMultifoxComment(e.target.value)}
                      className={`${inputClass} resize-none`} placeholder="Observación (opcional)" />
                    <button type="button" onClick={handleMultifox} disabled={saving}
                      className="w-full px-6 py-4 bg-[#004C6C] hover:bg-[#003a53] text-white rounded-2xl font-bold shadow-xl flex items-center justify-center gap-2 disabled:opacity-60">
                      {saving ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle2 size={18} />} Cargada en Multifox: pasar al cuadro de pagos
                    </button>
                  </>
                )}
              </div>
            )}
          </>
        )}
      </ModalShell>

      {cuenta && (
        <HistoryModal isOpen={historyOpen} onClose={() => setHistoryOpen(false)} subtitle={`Cuenta de cobro ${cuenta.code}`}>
          <ol className="relative border-l-2 border-slate-100 ml-2 space-y-5">
            {(cuenta.history ?? []).map((entry) => {
              const action = ACTION_LABELS[entry.action];
              return (
                <li key={entry.id} className="ml-5">
                  <span className="absolute -left-[7px] mt-1.5 h-3 w-3 rounded-full bg-white border-2 border-slate-300" />
                  <p className="text-sm font-bold text-slate-700">
                    <span className={`font-black ${action.tone}`}>{action.label}</span>
                    {entry.stage_label && (entry.action === 'aprobado' || entry.action === 'devuelto') ? ` por ${entry.stage_label}` : ''}
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
    </>
  );
};
