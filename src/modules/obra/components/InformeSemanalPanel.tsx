import React, { useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, ClipboardList, FastForward, MessageSquare, ShieldAlert, ShieldCheck, Timer, Wrench } from 'lucide-react';
import type { ControlEstado, InterventoriaCapitulo, InterventoriaReport } from '../types';
import { formatDate, formatMoney, formatPct } from '../format';

/** Estado del control de programación: siempre con ícono y texto, nunca solo color */
export const ControlBadge: React.FC<{ control: InterventoriaCapitulo['control']; compact?: boolean }> = ({ control, compact }) => {
  const styles: Record<Exclude<ControlEstado, null>, { cls: string; icon: React.ReactNode; label: string }> = {
    atraso: { cls: 'bg-rose-50 text-rose-700 border-rose-200', icon: <Timer size={12} />, label: `${control.dias} día${control.dias === 1 ? '' : 's'} de atraso` },
    adelanto: { cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: <FastForward size={12} />, label: `${control.dias} día${control.dias === 1 ? '' : 's'} de adelanto` },
    al_dia: { cls: 'bg-sky-50 text-[#004C6C] border-sky-100', icon: <CheckCircle2 size={12} />, label: 'Al día' },
  };
  if (!control.estado) {
    return <span className="text-[11px] font-bold text-slate-400">{compact ? '—' : 'Sin iniciar'}</span>;
  }
  const s = styles[control.estado];

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[11px] font-bold whitespace-nowrap ${s.cls}`}>
      {s.icon} {s.label}
    </span>
  );
};

const Section: React.FC<{ icon: React.ReactNode; title: string; items: string[]; empty: string; tone?: string }> = ({ icon, title, items, empty, tone = 'text-[#004C6C]' }) => (
  <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-5 space-y-3">
    <h4 className={`flex items-center gap-2 text-sm font-black ${tone}`}>{icon} {title}</h4>
    {items.length === 0 ? (
      <p className="text-xs font-bold text-slate-400">{empty}</p>
    ) : (
      <ul className="space-y-2">
        {items.map((item, i) =>
          /^cap[ií]tulo\s+\d+/i.test(item) ? (
            <li key={i} className="pt-1 text-[11px] font-black text-slate-500 uppercase tracking-wider">{item}</li>
          ) : (
            <li key={i} className="flex gap-2 text-xs text-slate-600 leading-relaxed">
              <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-slate-300 shrink-0" />
              <span>{item}</span>
            </li>
          )
        )}
      </ul>
    )}
  </div>
);

/**
 * Detalle del informe semanal: avance por capítulo, comité, actividades de la semana, observaciones y pólizas.
 */
export const InformeSemanalPanel: React.FC<{ report: InterventoriaReport }> = ({ report }) => {
  const [policyFilter, setPolicyFilter] = useState<'todas' | 'vencidas'>('todas');
  const expired = report.polizas.filter((p) => p.estado === 'VENCIDA');
  const policies = useMemo(
    () => (policyFilter === 'vencidas' ? expired : report.polizas),
    [policyFilter, expired, report.polizas]
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Avance por capítulo */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-5 md:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
          <h3 className="text-lg font-black text-[#004C6C]">Avance por capítulo — Torre 2</h3>
          <span className="text-[11px] font-bold text-slate-400">Programa: {formatDate(report.fecha_inicio_obra)} → {formatDate(report.fecha_fin_obra)}</span>
        </div>

        {/* Móvil: tarjetas */}
        <div className="md:hidden space-y-3">
          {report.capitulos.map((c) => (
            <div key={`${c.numero}-${c.nombre}`} className="border border-slate-100 rounded-2xl p-4 space-y-2">
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm font-black text-slate-700">{c.nombre}</p>
                <span className="text-sm font-black text-[#004C6C]">{formatPct(c.avance_actual)}</span>
              </div>
              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                <div className="bg-[#004C6C] h-full rounded-full" style={{ width: `${Math.min(100, c.avance_actual ?? 0)}%` }} />
              </div>
              <div className="flex items-center justify-between gap-2 text-[11px] text-slate-400 font-semibold">
                <span>{formatDate(c.inicio)} → {formatDate(c.fin)}</span>
                <ControlBadge control={c.control} />
              </div>
            </div>
          ))}
        </div>

        {/* Escritorio: tabla */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-400 font-extrabold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">Capítulo</th>
                <th className="py-3 px-4">Inicio</th>
                <th className="py-3 px-4">Fin</th>
                <th className="py-3 px-4 text-right">Semana anterior</th>
                <th className="py-3 px-4 w-56">Avance actual</th>
                <th className="py-3 px-4">Control de programación</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {report.capitulos.map((c) => (
                <tr key={`${c.numero}-${c.nombre}`} className="hover:bg-slate-50/60">
                  <td className="py-3 px-4 font-bold text-slate-800">{c.nombre}</td>
                  <td className="py-3 px-4 text-slate-500 whitespace-nowrap">{formatDate(c.inicio)}</td>
                  <td className="py-3 px-4 text-slate-500 whitespace-nowrap">{formatDate(c.fin)}</td>
                  <td className="py-3 px-4 text-right text-slate-500">{formatPct(c.avance_anterior)}</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className="flex-1 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-[#004C6C] h-full rounded-full" style={{ width: `${Math.min(100, c.avance_actual ?? 0)}%` }} />
                      </div>
                      <span className="w-16 text-right font-black text-slate-700">{formatPct(c.avance_actual)}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4"><ControlBadge control={c.control} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {report.capitulos.length === 0 && <p className="text-xs font-bold text-slate-400 text-center py-6">Este informe no trae el detalle por capítulo.</p>}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Section icon={<AlertTriangle size={16} />} title="Observaciones y compromisos de la interventoría" items={report.observaciones} empty="Sin observaciones esta semana." tone="text-rose-700" />
        <Section icon={<MessageSquare size={16} />} title="Temas tratados en comité" items={report.comite} empty="Sin temas registrados." />
        <Section icon={<Wrench size={16} />} title="Actividades ejecutadas en la semana" items={report.actividades} empty="Sin actividades registradas." />
      </div>

      {/* Pólizas */}
      {report.polizas.length > 0 && (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-5 md:p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <h3 className="text-lg font-black text-[#004C6C] flex items-center gap-2">
              <ClipboardList size={18} /> Pólizas reportadas por la interventoría
            </h3>
            <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-2xl text-[11px] font-black uppercase tracking-wider">
              <button type="button" onClick={() => setPolicyFilter('todas')} className={`px-4 py-2 rounded-xl ${policyFilter === 'todas' ? 'bg-white text-[#004C6C] shadow-sm' : 'text-slate-500'}`}>
                Todas ({report.polizas.length})
              </button>
              <button type="button" onClick={() => setPolicyFilter('vencidas')} className={`px-4 py-2 rounded-xl ${policyFilter === 'vencidas' ? 'bg-white text-rose-700 shadow-sm' : 'text-slate-500'}`}>
                Vencidas ({expired.length})
              </button>
            </div>
          </div>
          <div className="overflow-x-auto max-h-[480px] overflow-y-auto">
            <table className="w-full text-left text-xs">
              <thead className="sticky top-0 bg-slate-50">
                <tr className="text-slate-400 font-extrabold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4">Contratista</th>
                  <th className="py-3 px-4">Amparo</th>
                  <th className="py-3 px-4">Póliza</th>
                  <th className="py-3 px-4 text-right">Valor asegurado</th>
                  <th className="py-3 px-4">Vigencia</th>
                  <th className="py-3 px-4">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {policies.map((p, i) => (
                  <tr key={`${p.numero}-${i}`} className="hover:bg-slate-50/60">
                    <td className="py-2.5 px-4 font-bold text-slate-800 max-w-[220px]" title={p.contratista_original}>{p.contratista ?? '—'}</td>
                    <td className="py-2.5 px-4 text-slate-600 max-w-[260px]">{p.amparo ?? <span className="text-slate-400 italic">Texto no legible en el PDF</span>}</td>
                    <td className="py-2.5 px-4 text-slate-500 whitespace-nowrap">{p.numero}</td>
                    <td className="py-2.5 px-4 text-right text-slate-700 whitespace-nowrap">{formatMoney(p.valor_asegurado)}</td>
                    <td className="py-2.5 px-4 text-slate-500 whitespace-nowrap">{formatDate(p.inicio)} → {formatDate(p.fin)}</td>
                    <td className="py-2.5 px-4">
                      {p.estado === 'VENCIDA' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[11px] font-bold bg-rose-50 text-rose-700 border-rose-200"><ShieldAlert size={12} /> Vencida</span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[11px] font-bold bg-emerald-50 text-emerald-700 border-emerald-200"><ShieldCheck size={12} /> {p.estado === 'POR VENCER' ? 'Por vencer' : 'Vigente'}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
