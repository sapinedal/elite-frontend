import React, { useState } from 'react';
import { CheckCircle2, CornerUpLeft, Loader2, Lock } from 'lucide-react';
import { SignaturePad } from '../../../components/ui/SignaturePad';
import { ftraRecordService } from '../services/ftraRecordService';
import { getErrorMessage } from '../../../lib/apiError';
import type { FtraRecord, FtraStage } from '../types';
import { FtraProgress } from './FtraProgress';

interface FtraReviewPanelProps {
  record: FtraRecord;
  /** Etapa que atiende esta pantalla */
  stage: FtraStage;
  onDone: (record: FtraRecord, message: string) => void;
}

const STAGE_TEXT: Record<FtraStage, { title: string; who: string; next: string }> = {
  supervisor: {
    title: 'Revisión del Supervisor',
    who: 'Supervisor',
    next: 'Al recibirlo a satisfacción pasa al Director de Obra y se le notifica.',
  },
  director_obra: {
    title: 'Revisión del Director de Obra',
    who: 'Director de Obra',
    next: 'Al recibirlo a satisfacción el FTRA queda aprobado y termina el flujo.',
  },
};

/**
 * Panel de revisión: recibir a satisfacción (con firma) o devolver al residente (con motivo).
 * Solo se habilita si el FTRA está en la etapa de esta pantalla y el usuario puede revisarla.
 */
export const FtraReviewPanel: React.FC<FtraReviewPanelProps> = ({ record, stage, onDone }) => {
  const [mode, setMode] = useState<'approve' | 'return'>('approve');
  const [signature, setSignature] = useState<string | null>(null);
  const [comment, setComment] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const text = STAGE_TEXT[stage];
  const isMyStage = record.current_stage === stage;
  const canAct = isMyStage && record.can?.review !== false;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (mode === 'approve' && !signature) {
      setError('Firma para recibir a satisfacción.');
      return;
    }
    if (mode === 'return' && comment.trim().length < 5) {
      setError('Escribe el motivo de la devolución (mínimo 5 caracteres).');
      return;
    }
    setSaving(true);
    try {
      const result = mode === 'approve'
        ? await ftraRecordService.approve(record.id, signature as string, comment.trim() || null)
        : await ftraRecordService.returnRecord(record.id, comment.trim());
      onDone(result.record, result.message);
    } catch (err) {
      setError(getErrorMessage(err, 'No se pudo guardar la revisión.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="lg:col-span-4 bg-white rounded-3xl md:rounded-[40px] shadow-[0_8px_40px_rgb(0,0,0,0.03)] border border-slate-100 p-4 sm:p-8 space-y-5 lg:sticky lg:top-4">
      <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
        <div className="h-10 w-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center shrink-0">
          <CheckCircle2 size={20} />
        </div>
        <div className="min-w-0">
          <h3 className="text-base font-black text-[#004C6C] tracking-tight">{text.title}</h3>
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{text.next}</p>
        </div>
      </div>

      <FtraProgress record={record} compact />

      {!canAct ? (
        <div className="flex items-start gap-3 p-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold text-slate-500">
          <Lock size={16} className="shrink-0 mt-0.5 text-slate-400" />
          <span>
            {isMyStage
              ? `No tienes permiso para revisar como ${text.who}.`
              : `Este FTRA no está pendiente del ${text.who}.`}
          </span>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-5">
          <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-2xl">
            <button
              type="button"
              onClick={() => setMode('approve')}
              className={`py-2.5 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all cursor-pointer ${mode === 'approve' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-500'}`}
            >
              Recibir a satisfacción
            </button>
            <button
              type="button"
              onClick={() => setMode('return')}
              className={`py-2.5 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all cursor-pointer ${mode === 'return' ? 'bg-rose-600 text-white shadow-sm' : 'text-slate-500'}`}
            >
              Devolver
            </button>
          </div>

          {mode === 'approve' ? (
            <SignaturePad
              label={`Firma del ${text.who} *`}
              placeholder="Toque aquí para firmar"
              value={signature}
              onChange={setSignature}
              height={170}
            />
          ) : (
            <p className="text-[11px] font-bold text-rose-700 bg-rose-50 border border-rose-100 p-3 rounded-2xl">
              Se devuelve al residente para que lo corrija y lo reenvíe. La revisión comenzará de nuevo con el Supervisor.
            </p>
          )}

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
              {mode === 'return' ? 'Motivo de la devolución *' : 'Comentario (opcional)'}
            </label>
            <textarea
              rows={3}
              value={comment}
              onChange={e => setComment(e.target.value)}
              placeholder={mode === 'return' ? 'Qué debe corregir el residente...' : 'Observaciones de la revisión...'}
              className="w-full bg-white border border-slate-100 rounded-2xl px-4 py-3 text-sm font-bold text-slate-700 focus:border-[#004C6C] outline-none transition-all shadow-sm placeholder:text-slate-300"
            />
          </div>

          {error && <p className="text-xs font-bold text-red-600 bg-red-50 border border-red-100 rounded-2xl p-3">{error}</p>}

          <button
            type="submit"
            disabled={saving}
            className={`w-full flex items-center justify-center gap-2 px-6 py-4 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg transition-all disabled:opacity-50 cursor-pointer ${mode === 'approve' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'}`}
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : mode === 'approve' ? <CheckCircle2 size={16} /> : <CornerUpLeft size={16} />}
            {saving ? 'Guardando...' : mode === 'approve' ? 'Recibir a satisfacción' : 'Devolver al residente'}
          </button>
        </form>
      )}
    </div>
  );
};
