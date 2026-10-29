import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { HandCoins, Loader2, CheckCircle2, Undo2, Clock, Circle, RotateCcw, Send, AlertCircle, Download, Database, FileText, Wallet } from 'lucide-react';
import { HistoryButton, HistoryModal } from '../../../components/ui/HistoryModal';
import { ModalShell, inputClass, labelClass } from '../../../components/ui/ModalShell';
import { formatDateTime } from '../../../utils/dateUtils';
import { formatMoney } from '../../../utils/money';
import { formatBytes, formatMaxSize } from '../../cortes/utils/format';
import { anticipoService, getApiErrorMessage } from '../services/anticipoService';
import { AnticipoStatusBadge } from './AnticipoStatusBadge';
import { FileDrop } from '../../../components/ui/FileDrop';
import type { Anticipo, AnticipoHistoryEntry, AnticipoProgressStep, MultifoxPayload } from '../types';

interface AnticipoDetailModalProps {
  anticipoId: number | null;
  maxUploadMb: number;
  onClose: () => void;
  onReview: (id: number, decision: 'aprobar' | 'devolver', comment?: string) => Promise<Anticipo>;
  onResubmit: (anticipo: Anticipo) => void;
  onRegisterMultifox: (id: number, payload: MultifoxPayload) => Promise<Anticipo>;
}

const STEP_STYLES: Record<AnticipoProgressStep['state'], { icon: React.ReactNode; tone: string }> = {
  aprobado: { icon: <CheckCircle2 size={18} />, tone: 'bg-green-50 text-green-600 border-green-100' },
  devuelto: { icon: <Undo2 size={18} />, tone: 'bg-red-50 text-red-600 border-red-100' },
  actual: { icon: <Clock size={18} />, tone: 'bg-orange-50 text-[#EE9D4C] border-orange-100' },
  pendiente: { icon: <Circle size={18} />, tone: 'bg-slate-50 text-slate-300 border-slate-100' },
};

const STATE_TEXT: Record<AnticipoProgressStep['kind'], Record<AnticipoProgressStep['state'], string>> = {
  approval: { aprobado: 'Aprobado', devuelto: 'Devuelto', actual: 'Por aprobar', pendiente: 'Pendiente' },
  document: { aprobado: 'Cargado', devuelto: 'Devuelto', actual: 'Por cargar', pendiente: 'Pendiente' },
};

const ACTION_LABELS: Record<AnticipoHistoryEntry['action'], { label: string; tone: string }> = {
  radicado: { label: 'Radicado', tone: 'text-[#004C6C]' },
  reenviado: { label: 'Reenviado', tone: 'text-[#004C6C]' },
  aprobado: { label: 'Aprobado', tone: 'text-green-600' },
  devuelto: { label: 'Devuelto', tone: 'text-red-600' },
  multifox: { label: 'Generado en Multifox', tone: 'text-teal-700' },
};

/**
 * Detalle del anticipo: fases (Director, Gerencia, Multifox), datos, archivos, la aprobación de la etapa actual,
 * el reenvío del residente y el cargue de Contabilidad del anticipo generado en Multifox.
 */
export const AnticipoDetailModal: React.FC<AnticipoDetailModalProps> = ({ anticipoId, ...props }) => (
  // Se monta por cada anticipo abierto (`key`), así arranca sin los datos del anterior
  anticipoId !== null ? <DetailContent key={anticipoId} anticipoId={anticipoId} {...props} /> : null
);

const DetailContent: React.FC<Omit<AnticipoDetailModalProps, 'anticipoId'> & { anticipoId: number }> = ({
  anticipoId, maxUploadMb, onClose, onReview, onResubmit, onRegisterMultifox,
}) => {
  const [anticipo, setAnticipo] = useState<Anticipo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [decision, setDecision] = useState<'aprobar' | 'devolver' | null>(null);
  const [comment, setComment] = useState('');
  const [saving, setSaving] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [downloading, setDownloading] = useState<string | null>(null);
  // Cargue de Contabilidad
  const [multifoxNumber, setMultifoxNumber] = useState('');
  const [multifoxFile, setMultifoxFile] = useState<File | null>(null);
  const [multifoxComment, setMultifoxComment] = useState('');
  const [progress, setProgress] = useState<number | null>(null);

  useEffect(() => {
    anticipoService.getAnticipo(anticipoId)
      .then(setAnticipo)
      .catch((err) => setError(getApiErrorMessage(err, 'Error al cargar el anticipo.')));
  }, [anticipoId]);

  const download = async (file: 'cuenta' | 'multifox') => {
    if (!anticipo) return;
    setDownloading(file);
    try {
      window.open(await anticipoService.getDownloadUrl(anticipo.id, file), '_blank', 'noopener');
    } catch (err) {
      setError(getApiErrorMessage(err, 'Error al descargar el archivo.'));
    } finally {
      setDownloading(null);
    }
  };

  const handleReview = async () => {
    if (!anticipo || !decision) return;
    if (decision === 'devolver' && !comment.trim()) {
      setError('Indica el motivo de la devolución para que el residente sepa qué corregir.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      setAnticipo(await onReview(anticipo.id, decision, comment.trim() || undefined));
      setDecision(null);
      setComment('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al registrar la aprobación.');
    } finally {
      setSaving(false);
    }
  };

  const selectMultifoxFile = (file: File) => {
    if (file.size > maxUploadMb * 1024 * 1024) {
      setError(`El archivo pesa ${formatBytes(file.size)} y supera el máximo de ${formatMaxSize(maxUploadMb)}.`);
      return;
    }
    setError(null);
    setMultifoxFile(file);
  };

  const handleMultifox = async () => {
    if (!anticipo) return;
    if (!multifoxNumber.trim()) return setError('Indica el número del anticipo en Multifox.');
    if (!multifoxFile) return setError('Adjunta el soporte del anticipo generado en Multifox.');
    setSaving(true);
    setError(null);
    try {
      setProgress(0);
      const token = await anticipoService.uploadFile(multifoxFile, setProgress);
      setAnticipo(await onRegisterMultifox(anticipo.id, {
        multifox_number: multifoxNumber.trim(),
        upload_token: token,
        comment: multifoxComment.trim() || null,
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar el anticipo de Multifox.');
    } finally {
      setSaving(false);
      setProgress(null);
    }
  };

  const fileRow = (key: 'cuenta' | 'multifox', label: string, name: string, size: number | null | undefined, icon: React.ReactNode) => (
    <div className="flex items-center justify-between gap-3 bg-slate-50 rounded-2xl p-3">
      <span className="flex items-center gap-2 min-w-0">
        {icon}
        <span className="min-w-0">
          <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</span>
          <span className="block text-xs font-bold text-slate-700 truncate">{name}{size ? ` · ${formatBytes(size)}` : ''}</span>
        </span>
      </span>
      <button type="button" onClick={() => download(key)} className="p-2 rounded-xl text-[#004C6C] hover:bg-blue-50 shrink-0" title="Descargar">
        {downloading === key ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
      </button>
    </div>
  );

  return (
    <>
      <ModalShell
        isOpen
        onClose={onClose}
        icon={<HandCoins size={24} />}
        title={anticipo ? `Anticipo ${anticipo.code}` : 'Anticipo'}
        subtitle={anticipo?.contract ? `Contrato ${anticipo.contract.contract_code} · ${anticipo.contract.contractor_name}` : undefined}
        maxWidth="max-w-4xl"
      >
        {error && (
          <div className="p-3 bg-red-50 border border-red-100 rounded-2xl text-xs font-bold text-red-600 flex items-center gap-2">
            <AlertCircle size={16} className="shrink-0" /> <span className="whitespace-pre-line">{error}</span>
          </div>
        )}

        {!anticipo ? (
          !error && <div className="flex justify-center py-16"><Loader2 size={28} className="animate-spin text-[#004C6C]" /></div>
        ) : (
          <>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <AnticipoStatusBadge status={anticipo.status} label={anticipo.status_label} />
              <HistoryButton count={anticipo.history?.length} onClick={() => setHistoryOpen(true)} />
            </div>

            {/* Fases: Director, Gerencia y anticipo en Multifox */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {(anticipo.progress ?? []).map((step, index) => {
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                {[
                  ['Valor del anticipo', formatMoney(anticipo.amount)],
                  ['Cuenta de cobro', `N.º ${anticipo.document_number}`],
                  ['Proveedor', anticipo.contractor ? `${anticipo.contractor.name}${anticipo.contractor.nit ? ` · NIT ${anticipo.contractor.nit}` : ''}` : '—'],
                  ['Proyecto', `${anticipo.project?.name ?? '—'}${anticipo.tower ? ` · ${anticipo.tower.name}` : ''}`],
                  ['Radicado por', `${anticipo.created_by?.name ?? '—'} · ${formatDateTime(anticipo.created_at)}`],
                  ['Aprobado', anticipo.approved_at ? formatDateTime(anticipo.approved_at) : '—'],
                  ...(anticipo.multifox_number ? [['Anticipo Multifox', `N.º ${anticipo.multifox_number} · ${anticipo.multifox_by ?? ''}`]] : []),
                ].map(([label, value]) => (
                  <div key={label}>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
                    <p className="font-bold text-slate-700">{value}</p>
                  </div>
                ))}
              </div>
              {anticipo.description && (
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Descripción</p>
                  <p className="font-bold text-slate-700 whitespace-pre-line">{anticipo.description}</p>
                </div>
              )}
              <div className="space-y-2">
                {fileRow('cuenta', 'Cuenta de cobro', anticipo.file_name, anticipo.file_size, <FileText size={18} className="text-slate-400 shrink-0" />)}
                {anticipo.multifox_file_name && fileRow('multifox', 'Anticipo Multifox', anticipo.multifox_file_name, anticipo.multifox_file_size, <Database size={18} className="text-slate-400 shrink-0" />)}
              </div>
              {anticipo.status === 'completado' && (
                <Link to="/app/contratacion/cuentas-por-pagar" className="inline-flex items-center gap-1.5 text-xs font-black text-[#004C6C] hover:underline">
                  <Wallet size={14} /> Ver en el cuadro de pagos →
                </Link>
              )}
            </div>

            {/* Aprobación de la etapa actual */}
            {anticipo.can_review && (
              <div className="bg-white rounded-3xl border border-orange-100 p-6 space-y-4">
                <h3 className="font-black text-[#004C6C] tracking-tight">Tu aprobación como {anticipo.current_stage_label}</h3>
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

            {anticipo.can_resubmit && (
              <div className="bg-orange-50 border border-orange-100 rounded-3xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <p className="text-sm font-bold text-orange-700">
                  Este anticipo fue devuelto por {anticipo.returned_stage_label}. Corrígelo y reenvíalo para reiniciar la aprobación.
                </p>
                <button onClick={() => onResubmit(anticipo)}
                  className="flex items-center justify-center gap-2 bg-[#EE9D4C] hover:bg-[#e08a35] text-white px-5 py-3 rounded-2xl font-bold shrink-0">
                  <RotateCcw size={16} /> Corregir y reenviar
                </button>
              </div>
            )}

            {/* Contabilidad: anticipo generado en Multifox */}
            {anticipo.can_register_multifox && (
              <div className="bg-white rounded-3xl border border-teal-100 p-6 space-y-4">
                <div className="flex items-center gap-2">
                  <Database size={18} className="text-teal-600" />
                  <h3 className="font-black text-[#004C6C] tracking-tight">Cargar anticipo generado en Multifox</h3>
                </div>
                <p className="text-xs font-bold text-slate-500">Al cargarlo, el anticipo pasa al cuadro de pagos por {formatMoney(anticipo.amount)}.</p>
                <div className="space-y-2">
                  <label className={labelClass}>N.º del anticipo en Multifox *</label>
                  <input disabled={saving} className={inputClass} placeholder="Ej: AN-0123"
                    value={multifoxNumber} onChange={(e) => setMultifoxNumber(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <label className={labelClass}>Soporte de Multifox *</label>
                  <FileDrop file={multifoxFile} onSelect={selectMultifoxFile} disabled={saving} progress={progress}
                    hint="Arrastra el documento que genera Multifox o haz clic" />
                </div>
                <textarea rows={2} disabled={saving} value={multifoxComment} onChange={(e) => setMultifoxComment(e.target.value)}
                  className={`${inputClass} resize-none`} placeholder="Observación (opcional)" />
                <button type="button" onClick={handleMultifox} disabled={saving}
                  className="w-full px-6 py-4 bg-[#004C6C] hover:bg-[#003a53] text-white rounded-2xl font-bold shadow-xl flex items-center justify-center gap-2 disabled:opacity-60">
                  {saving ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle2 size={18} />}
                  {saving && progress !== null && progress < 100 ? `Subiendo soporte... ${progress}%` : 'Cargar y pasar al cuadro de pagos'}
                </button>
              </div>
            )}
          </>
        )}
      </ModalShell>

      {anticipo && (
        <HistoryModal isOpen={historyOpen} onClose={() => setHistoryOpen(false)} subtitle={`Anticipo ${anticipo.code}`}>
          <ol className="relative border-l-2 border-slate-100 ml-2 space-y-5">
            {(anticipo.history ?? []).map((entry) => {
              const action = ACTION_LABELS[entry.action];
              return (
                <li key={entry.id} className="ml-5">
                  <span className="absolute -left-[7px] mt-1.5 h-3 w-3 rounded-full bg-white border-2 border-slate-300" />
                  <p className="text-sm font-bold text-slate-700">
                    <span className={`font-black ${action.tone}`}>{action.label}</span>
                    {entry.stage_label && entry.action !== 'multifox' ? ` por ${entry.stage_label}` : ''}
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
