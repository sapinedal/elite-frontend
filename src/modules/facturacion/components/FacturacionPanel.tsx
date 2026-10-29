import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Loader2, AlertCircle, FolderOpen, Scissors, ShoppingCart, Building2, CheckCircle2, Clock, Mail } from 'lucide-react';
import { formatMoney } from '../../../utils/money';
import { facturacionService, getApiErrorMessage } from '../services/facturacionService';
import type { FacturacionPanelData } from '../types';

interface FacturacionPanelProps {
  period: string;
}

// Días de espera: verde hasta 5, naranja hasta 15, rojo después
const daysTone = (days: number | null) =>
  days === null ? 'bg-slate-100 text-slate-500' : days > 15 ? 'bg-red-50 text-red-600' : days > 5 ? 'bg-orange-50 text-orange-700' : 'bg-green-50 text-green-700';

const Days: React.FC<{ days: number | null }> = ({ days }) => (
  <span className={`text-[10px] font-black px-2 py-0.5 rounded-md whitespace-nowrap ${daysTone(days)}`}>
    {days === null ? '—' : days === 0 ? 'Hoy' : `${days} día${days === 1 ? '' : 's'}`}
  </span>
);

const Stat: React.FC<{ label: string; value: React.ReactNode; hint?: React.ReactNode; tone?: string }> = ({ label, value, hint, tone = 'text-[#004C6C]' }) => (
  <div className="bg-white rounded-3xl border border-slate-100 p-5">
    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
    <p className={`text-2xl md:text-3xl font-black tracking-tight mt-1 ${tone}`}>{value}</p>
    {hint && <p className="text-[11px] font-bold text-slate-400 mt-1">{hint}</p>}
  </div>
);

/**
 * Panel de Contabilidad: avance del mes (cargadas / procesadas por obra), a quién le falta factura
 * (cortes aprobados y órdenes sin factura por residente) y las facturas pendientes por proveedor.
 */
export const FacturacionPanel: React.FC<FacturacionPanelProps> = ({ period }) => {
  const [data, setData] = useState<FacturacionPanelData | null>(null);
  const [error, setError] = useState<string | null>(null);

  // La página monta un panel por mes (`key`), así arranca vacío al cambiar de mes
  useEffect(() => {
    facturacionService.getPanel(period)
      .then(setData)
      .catch((err) => setError(getApiErrorMessage(err, 'Error al cargar el panel.')));
  }, [period]);

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-100 rounded-2xl text-xs font-bold text-red-600 flex items-center justify-center gap-2">
        <AlertCircle size={16} /> {error}
      </div>
    );
  }
  if (!data) {
    return <div className="flex justify-center py-16"><Loader2 className="animate-spin text-slate-300" size={28} /></div>;
  }

  const { summary } = data;
  const percent = summary.total ? Math.round((summary.processed / summary.total) * 100) : 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat label={`Cargadas · ${data.period_label}`} value={summary.total} hint={formatMoney(summary.total_amount)} />
        <Stat label="Procesadas por obra" value={`${summary.processed}`} tone="text-green-600"
          hint={<span className="flex items-center gap-2"><span className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden"><span className="block h-full bg-green-500" style={{ width: `${percent}%` }} /></span>{percent}%</span>} />
        <Stat label="Pendientes de obra" value={summary.pending} tone="text-orange-600"
          hint={summary.pending_previous ? `+ ${summary.pending_previous} de meses anteriores` : formatMoney(summary.pending_amount)} />
        <Stat label="Esperando factura" value={summary.cortes_waiting + summary.ordenes_waiting}
          hint={`${summary.cortes_waiting} corte(s) · ${summary.ordenes_waiting} orden(es)`} />
      </div>

      <p className="flex items-center gap-2 text-xs font-bold text-slate-400">
        <FolderOpen size={14} /> Carpeta del mes: <span className="text-slate-600">{data.folder}</span>
      </p>

      <div className="grid grid-cols-1 xl:grid-cols-[3fr_2fr] gap-6 items-start">
        {/* A quién le falta qué */}
        <section className="bg-white rounded-[32px] border border-slate-100 p-5 md:p-6 space-y-4">
          <div>
            <h3 className="font-black text-[#004C6C] tracking-tight">¿A quién le falta factura?</h3>
            <p className="text-xs font-bold text-slate-400">Cortes con las tres aprobaciones y órdenes de compra que aún no tienen factura asociada.</p>
          </div>
          {data.residentes.length === 0 ? (
            <p className="flex items-center gap-2 text-sm font-bold text-green-600 bg-green-50 rounded-2xl p-4">
              <CheckCircle2 size={18} /> Ningún residente tiene cortes u órdenes esperando factura.
            </p>
          ) : (
            <ul className="space-y-3">
              {data.residentes.map((r) => (
                <li key={r.id} className="rounded-3xl border border-slate-100 p-4 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-black text-slate-700">{r.name}</p>
                      <a href={`mailto:${r.email}`} className="flex items-center gap-1 text-[11px] font-bold text-slate-400 hover:text-[#004C6C]">
                        <Mail size={12} /> {r.email}
                      </a>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] font-black">
                      <span className="px-2 py-1 rounded-lg bg-orange-50 text-orange-700">{r.cortes.length + r.ordenes.length} sin factura</span>
                      <span className="px-2 py-1 rounded-lg bg-green-50 text-green-700">{r.processed_in_period} procesada(s) en el mes</span>
                    </div>
                  </div>
                  <ul className="divide-y divide-slate-50">
                    {r.cortes.map((c) => (
                      <li key={`c${c.id}`} className="flex items-center justify-between gap-3 py-2">
                        <Link to={`/app/contratacion/cortes?corte=${c.id}`} className="flex items-center gap-2 min-w-0 group">
                          <Scissors size={14} className="text-slate-400 shrink-0" />
                          <span className="text-sm font-black text-[#004C6C] group-hover:underline shrink-0">{c.label}</span>
                          <span className="text-xs font-bold text-slate-500 truncate">{c.contractor ?? '—'}{c.contract_code ? ` · Contrato ${c.contract_code}` : ''}</span>
                        </Link>
                        <Days days={c.days_waiting} />
                      </li>
                    ))}
                    {r.ordenes.map((o) => (
                      <li key={`o${o.id}`} className="flex items-center justify-between gap-3 py-2">
                        <span className="flex items-center gap-2 min-w-0">
                          <ShoppingCart size={14} className="text-slate-400 shrink-0" />
                          <span className="text-sm font-black text-[#004C6C] shrink-0">Orden {o.code}</span>
                          <span className="text-xs font-bold text-slate-500 truncate">{o.description}</span>
                        </span>
                        <Days days={o.days_waiting} />
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Pendientes por proveedor */}
        <section className="bg-white rounded-[32px] border border-slate-100 p-5 md:p-6 space-y-4">
          <div>
            <h3 className="font-black text-[#004C6C] tracking-tight">Facturas pendientes de obra</h3>
            <p className="text-xs font-bold text-slate-400">Cargadas en {data.period_label} que ningún residente ha asociado.</p>
          </div>
          {data.pending_by_supplier.length === 0 ? (
            <p className="flex items-center gap-2 text-sm font-bold text-green-600 bg-green-50 rounded-2xl p-4">
              <CheckCircle2 size={18} /> Obra procesó todas las facturas del mes.
            </p>
          ) : (
            <ul className="divide-y divide-slate-50">
              {data.pending_by_supplier.map((s) => (
                <li key={s.supplier} className="py-3 space-y-1">
                  <div className="flex items-center justify-between gap-3">
                    <span className="flex items-center gap-2 min-w-0">
                      <Building2 size={14} className="text-slate-400 shrink-0" />
                      <span className="text-sm font-black text-slate-700 truncate">{s.supplier}</span>
                    </span>
                    <span className="flex items-center gap-1 shrink-0"><Clock size={12} className="text-slate-300" /><Days days={s.oldest_days} /></span>
                  </div>
                  <p className="text-[11px] font-bold text-slate-400 pl-6">
                    {s.documents.join(', ')} · {formatMoney(s.amount)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
};
