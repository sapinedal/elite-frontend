import React from 'react';
import { CheckCircle2, Undo2, Clock, Circle } from 'lucide-react';
import type { FtraRecord } from '../types';

// Mismas fases que el detalle de Cortes
const STEP_STYLES = {
  aprobado: { icon: <CheckCircle2 size={20} />, tone: 'bg-green-50 text-green-600 border-green-100', text: 'Recibido' },
  devuelto: { icon: <Undo2 size={20} />, tone: 'bg-red-50 text-red-600 border-red-100', text: 'Devuelto' },
  actual: { icon: <Clock size={20} />, tone: 'bg-orange-50 text-[#EE9D4C] border-orange-100', text: 'En revisión' },
  pendiente: { icon: <Circle size={20} />, tone: 'bg-slate-50 text-slate-300 border-slate-100', text: 'Pendiente' },
} as const;

const ACTION_LABELS: Record<string, { label: string; tone: string }> = {
  registrado: { label: 'Registrado', tone: 'text-[#004C6C]' },
  reenviado: { label: 'Corregido y reenviado', tone: 'text-[#004C6C]' },
  aprobado: { label: 'Recibido a satisfacción', tone: 'text-green-600' },
  devuelto: { label: 'Devuelto', tone: 'text-red-600' },
};

const STAGE_LABEL: Record<string, string> = { supervisor: 'Supervisor', director_obra: 'Director de Obra' };

/** Fases del flujo (Registrado → Supervisor → Director de Obra) y, opcionalmente, el historial. */
export const FtraProgress: React.FC<{ record: FtraRecord; showHistory?: boolean; compact?: boolean }> = ({ record, showHistory = true, compact = false }) => {
  const steps = [
    { key: 'registro', label: 'Registro', state: 'aprobado' as const, user: record.registered_by?.name ?? null },
    ...(record.progress ?? []),
  ];

  return (
    <div className="space-y-4">
      <div className={`grid gap-3 ${compact ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-3'}`}>
        {steps.map((step, index) => {
          const style = STEP_STYLES[step.state];
          return (
            <div key={step.key} className={`rounded-3xl border p-4 flex items-center gap-3 ${style.tone}`}>
              <div className="shrink-0">{style.icon}</div>
              <div className="min-w-0">
                <p className="text-[10px] font-black uppercase tracking-widest opacity-70">Fase {index + 1}</p>
                <p className="font-black text-slate-700">{step.label}</p>
                <p className="text-[11px] font-bold truncate">
                  {index === 0 ? 'Registrado' : style.text}{step.user ? ` · ${step.user}` : ''}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {showHistory && (record.history?.length ?? 0) > 0 && (
        <div className="bg-white rounded-3xl border border-slate-100 p-5 space-y-3">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Historial</p>
          <ol className="space-y-3">
            {record.history!.slice().reverse().map(h => {
              const action = ACTION_LABELS[h.action] ?? { label: h.action, tone: 'text-slate-600' };
              return (
                <li key={h.id} className="text-sm border-l-2 border-slate-100 pl-3">
                  <p className="font-bold text-slate-700">
                    <span className={action.tone}>{action.label}</span>
                    {h.stage && <span className="text-slate-400"> · {STAGE_LABEL[h.stage] ?? h.stage}</span>}
                  </p>
                  <p className="text-[11px] text-slate-400 font-semibold">
                    {h.user?.name ?? 'Sistema'} · {new Date(h.created_at).toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' })}
                  </p>
                  {h.comment && <p className="text-xs text-slate-600 mt-1 whitespace-pre-line break-words">{h.comment}</p>}
                </li>
              );
            })}
          </ol>
        </div>
      )}
    </div>
  );
};
