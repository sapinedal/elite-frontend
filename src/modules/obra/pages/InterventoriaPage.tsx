import { useCallback, useEffect, useState } from 'react';
import {
  AlertTriangle,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  DollarSign,
  FileText,
  HardHat,
  Loader2,
  MapPin,
  RefreshCw,
  ShieldAlert,
} from 'lucide-react';
import aerialPhoto from '../../../assets/san_miguel_aerial_real.jpg';
import { CustomSelect } from '../../../components/ui/CustomSelect';
import { useNotification } from '../../../context/NotificationContext';
import { getErrorMessage } from '../../../lib/apiError';
import { interventoriaService } from '../services/interventoriaService';
import { AvanceHistoryChart } from '../components/AvanceHistoryChart';
import { InformeSemanalPanel, ControlBadge } from '../components/InformeSemanalPanel';
import { formatDate, formatMoney, formatPct } from '../format';
import type { InterventoriaDashboard } from '../types';

const headerButton =
  'flex items-center justify-center gap-2 whitespace-nowrap bg-white/10 hover:bg-white/20 border border-white/15 text-white px-4 py-3 rounded-2xl text-sm font-bold transition-all disabled:opacity-60';

const formatDateTime = (value: string | null | undefined) =>
  value ? new Date(value).toLocaleString('es-CO', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'nunca';

/**
 * Módulo Técnico › Interventoría: todo lo del último informe semanal de interventoría (o de uno anterior),
 * leído automáticamente desde los PDF que llegan a Gestión Documental.
 */
export default function InterventoriaPage() {
  const { showNotification } = useNotification();
  const [dashboard, setDashboard] = useState<InterventoriaDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [numero, setNumero] = useState<number | undefined>(undefined);

  const load = useCallback(async (selected?: number) => {
    setLoading(true);
    setError(null);
    try {
      setDashboard(await interventoriaService.getDashboard(selected));
    } catch (err) {
      setError(getErrorMessage(err, 'No se pudo cargar el informe de interventoría.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(numero);
  }, [load, numero]);

  const handleSync = async () => {
    setSyncing(true);
    try {
      const result = await interventoriaService.sync();
      setNumero(undefined);
      setDashboard(result.data);
      showNotification(result.message, result.success ? 'success' : 'warning');
    } catch (err) {
      showNotification(getErrorMessage(err, 'No se pudo sincronizar el informe.'), 'error');
    } finally {
      setSyncing(false);
    }
  };

  const latestNumero = dashboard?.history.at(-1)?.numero;
  const selectWeek = (value: number) => setNumero(value === latestNumero ? undefined : value);

  const report = dashboard?.report ?? null;
  const budget = report?.presupuesto;
  const avance = budget?.avance_inversion ?? null;
  const saldo = budget?.presupuesto_aprobado != null && budget?.inversion_ejecutada != null ? budget.presupuesto_aprobado - budget.inversion_ejecutada : null;
  const saldoPct = avance != null ? 100 - avance : null;
  const expiredPolicies = report?.polizas.filter((p) => p.estado === 'VENCIDA') ?? [];
  // Capítulos en ejecución, primero los de más atraso
  const inProgress = (report?.capitulos ?? [])
    .filter((c) => (c.avance_actual ?? 0) < 100 && c.control.estado)
    .sort((a, b) => (b.control.estado === 'atraso' ? b.control.dias ?? 0 : -1) - (a.control.estado === 'atraso' ? a.control.dias ?? 0 : -1))
    .slice(0, 6);
  const weekOptions = [...(dashboard?.history ?? [])].reverse().map((h) => ({
    value: String(h.numero),
    label: `Informe N° ${h.numero}`,
    sublabel: formatDate(h.fecha),
  }));

  const ficha = report
    ? [
        { label: 'Proyecto', value: report.proyecto },
        { label: 'Constructor', value: report.constructor, sub: report.constructor_nit && `NIT ${report.constructor_nit}` },
        { label: 'Interventoría', value: report.interventoria, sub: report.interventoria_nit && `NIT ${report.interventoria_nit}` },
        { label: 'Ubicación', value: report.ubicacion },
        { label: 'Inicio de obra', value: formatDate(report.fecha_inicio_obra) },
        { label: 'Fecha del informe', value: report.fecha_texto ?? formatDate(report.fecha) },
      ]
    : [];

  return (
    <div className="max-w-[1600px] mx-auto flex flex-col gap-6 md:gap-8 py-4 md:py-6 px-4">
      {/* Encabezado */}
      <div className="bg-gradient-to-r from-[#004C6C] via-[#005981] to-[#003850] p-6 md:p-8 rounded-[32px] text-white shadow-xl flex flex-col xl:flex-row xl:items-center justify-between gap-6">
        <div className="flex items-center gap-4 min-w-0">
          <div className="h-14 w-14 shrink-0 bg-white/10 rounded-2xl flex items-center justify-center border border-white/10">
            <Building2 className="w-7 h-7 text-[#EE9D4C]" />
          </div>
          <div className="min-w-0">
            <h1 className="text-2xl md:text-3xl font-black tracking-tight">Control de Obra & Interventoría</h1>
            <p className="text-xs font-bold text-white/60 uppercase tracking-widest mt-1">
              {report ? `Informe N° ${report.numero} · ${formatDate(report.fecha)}` : 'Ciudadela San Miguel'}
            </p>
            {dashboard && (
              <p className="text-[11px] font-semibold text-white/50 mt-1">
                Última sincronización: {formatDateTime(dashboard.sync.ultima)} · se actualiza sola cada hora
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 sm:flex sm:flex-wrap sm:items-center gap-3 xl:shrink-0">
          {weekOptions.length > 0 && (
            <div className="col-span-2 sm:w-56">
              <CustomSelect
                searchable={false}
                options={weekOptions}
                value={String(report?.numero ?? '')}
                onChange={(v) => selectWeek(Number(v))}
                className="w-full flex items-center justify-between gap-2 bg-white text-[#004C6C] border border-white rounded-2xl px-4 py-3 text-sm font-bold shadow-sm"
              />
            </div>
          )}
          <button type="button" onClick={handleSync} disabled={syncing} className={headerButton} title="Busca el informe más reciente y lo carga">
            <RefreshCw size={16} className={syncing ? 'animate-spin' : ''} /> {syncing ? 'Sincronizando…' : 'Sincronizar'}
          </button>
          {report?.pdf_url && (
            <a href={report.pdf_url} target="_blank" rel="noreferrer" className={headerButton}>
              <FileText size={16} /> Ver PDF
            </a>
          )}
          <div className="col-span-2 sm:col-span-1 flex items-center gap-3 bg-white/10 px-4 py-2.5 rounded-2xl border border-white/10 whitespace-nowrap">
            <Calendar className="w-5 h-5 text-[#EE9D4C] shrink-0" />
            <div>
              <p className="text-[10px] uppercase font-bold text-white/60">Entrega pactada</p>
              <p className="text-sm font-black text-white">{report ? formatDate(report.fecha_fin_obra) : '—'}</p>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-100 rounded-2xl text-xs font-bold text-red-600 flex items-center justify-between gap-3">
          <span>{error}</span>
          <button type="button" onClick={() => load(numero)} className="px-3 py-1.5 rounded-xl bg-white border border-red-100 hover:bg-red-50">Reintentar</button>
        </div>
      )}

      {loading && !dashboard && (
        <div className="flex items-center justify-center gap-2 py-24 text-sm font-bold text-slate-400">
          <Loader2 className="w-5 h-5 animate-spin text-[#EE9D4C]" /> Cargando el informe de interventoría…
        </div>
      )}

      {!loading && !error && dashboard && !report && (
        <div className="p-5 bg-amber-50 border border-amber-100 rounded-3xl text-sm font-bold text-amber-800">
          Aún no hay informes de interventoría cargados. Llegan a Gestión Documental → tecnica → INFORMES SEMANALES INTERVENTORÍA;
          pulsa <strong>Sincronizar</strong> para cargarlos ahora.
        </div>
      )}

      {report && (
        <div className={`flex flex-col gap-6 md:gap-8 transition-opacity ${loading ? 'opacity-60' : ''}`}>
          {!report.es_ultimo && (
            <div className="p-4 bg-sky-50 border border-sky-100 rounded-2xl text-xs font-bold text-[#004C6C] flex items-center justify-between gap-3">
              <span>Estás viendo el informe N° {report.numero}, que no es el más reciente.</span>
              <button type="button" onClick={() => setNumero(undefined)} className="px-3 py-1.5 rounded-xl bg-white border border-sky-100 hover:bg-sky-100 whitespace-nowrap">Ver el último</button>
            </div>
          )}

          {/* Ficha del proyecto */}
          <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm p-5 md:p-6 grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
            {ficha.map((item) => (
              <div key={item.label} className="min-w-0">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{item.label}</p>
                <p className="text-sm font-bold text-slate-800 mt-1 break-words">{item.value || '—'}</p>
                {item.sub && <p className="text-[11px] font-semibold text-slate-400">{item.sub}</p>}
              </div>
            ))}
          </div>

          {/* Mapa + resumen */}
          <div className="bg-white p-5 md:p-8 rounded-[32px] border border-slate-100 shadow-xl">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
              <div className="lg:col-span-8 relative rounded-3xl overflow-hidden border border-slate-200 min-h-[360px] md:min-h-[520px] flex flex-col justify-between group shadow-inner">
                <img src={aerialPhoto} alt="Vista aérea de Ciudadela San Miguel" className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-slate-900/20" />
                <div className="relative z-10 p-4">
                  <span className="inline-flex items-center gap-1.5 bg-white/95 text-slate-700 text-[11px] font-bold px-3 py-1.5 rounded-full shadow">
                    <MapPin size={12} className="text-[#004C6C]" /> {report.ubicacion ?? 'Caldas, Antioquia'}
                  </span>
                </div>
                <div className="absolute inset-0 pointer-events-none z-10">
                  <div className="absolute top-[54%] left-[42%] pointer-events-auto bg-[#EE9D4C] text-white px-4 py-2 rounded-full text-xs font-black border-2 border-white shadow-2xl flex items-center gap-1.5" title="Avance según inversión del informe de interventoría">
                    <HardHat size={14} /> Torre 2 | {formatPct(avance)}
                  </div>
                </div>
                <div className="relative z-10 p-4 flex justify-center">
                  <span className="bg-white/95 border border-slate-200 px-4 py-1.5 rounded-full text-[11px] font-bold text-slate-600 shadow">
                    El informe de interventoría reporta el avance de la Torre 2
                  </span>
                </div>
              </div>

              <div className="lg:col-span-4 flex flex-col gap-4">
                <div className="bg-slate-50 border border-slate-200 p-5 rounded-3xl space-y-3">
                  <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider block">Avance según inversión · Torre 2</span>
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full flex items-center justify-center shrink-0" style={{ background: `conic-gradient(#004C6C 0% ${avance ?? 0}%, #e2e8f0 ${avance ?? 0}% 100%)` }}>
                      <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center text-[11px] font-black text-[#004C6C]">
                        {avance != null ? `${avance.toFixed(1)}%` : '—'}
                      </div>
                    </div>
                    <div className="text-xs space-y-0.5 text-slate-600">
                      <p>Ejecutado: <strong className="text-slate-900">{formatPct(avance)}</strong></p>
                      <p>Por ejecutar: <strong className="text-slate-900">{formatPct(saldoPct)}</strong></p>
                      <p className="text-[11px] text-[#004C6C] font-black">Entrega: {formatDate(report.fecha_fin_obra)}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-200 p-5 rounded-3xl space-y-2 text-xs">
                  <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider block mb-1">Capítulos en ejecución</span>
                  {inProgress.length === 0 ? (
                    <p className="text-slate-400 font-bold">Sin capítulos en ejecución en este informe.</p>
                  ) : (
                    <div className="space-y-1.5 text-slate-700 font-semibold">
                      {inProgress.map((c) => (
                        <div key={`${c.numero}-${c.nombre}`} className="flex items-center justify-between gap-2 border-b border-slate-200/60 pb-1.5 last:border-0">
                          <span className="min-w-0 truncate" title={c.nombre}>
                            {c.nombre.replace(/^\d+(\.\d+)?\.\s*/, '')}: <strong className="text-slate-900">{formatPct(c.avance_actual)}</strong>
                          </span>
                          <ControlBadge control={c.control} compact />
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {(report.observaciones.length > 0 || expiredPolicies.length > 0) && (
                  <div className="bg-rose-50 border border-rose-200 p-4 rounded-3xl border-l-4 border-l-rose-500 space-y-2">
                    <div className="flex items-center justify-between gap-2 text-xs font-black text-rose-800">
                      <span className="flex items-center gap-1.5"><AlertTriangle size={14} className="text-rose-600" /> Alertas de la interventoría</span>
                      <span className="bg-white border border-rose-200 px-2 py-0.5 rounded-full text-[10px] text-rose-700 font-bold whitespace-nowrap">{formatDate(report.fecha)}</span>
                    </div>
                    {expiredPolicies.length > 0 && (
                      <p className="text-xs text-rose-900 font-bold flex gap-1.5">
                        <ShieldAlert size={14} className="shrink-0 mt-0.5" />
                        <span>
                          {expiredPolicies.length} póliza{expiredPolicies.length === 1 ? '' : 's'} vencida{expiredPolicies.length === 1 ? '' : 's'}:{' '}
                          {[...new Set(expiredPolicies.map((p) => p.contratista ?? 'contratista sin nombre legible'))].join(', ')}.
                        </span>
                      </p>
                    )}
                    {report.observaciones.slice(0, 3).map((o, i) => (
                      <p key={i} className="text-xs text-rose-900 leading-snug font-medium">• {o}</p>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-6 rounded-3xl border-l-4 border-l-[#004C6C] border border-slate-100 shadow-sm space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">Presupuesto Torre 2</span>
                <DollarSign className="w-5 h-5 text-[#004C6C]" />
              </div>
              <p className="text-xl md:text-2xl font-black text-[#004C6C]">{formatMoney(budget?.presupuesto_aprobado)}</p>
              <p className="text-[11px] font-bold text-slate-400">Presupuesto aprobado</p>
            </div>
            <div className="bg-white p-6 rounded-3xl border-l-4 border-l-emerald-600 border border-slate-100 shadow-sm space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-extrabold text-emerald-600 uppercase tracking-wider">Ejecutado ({formatPct(avance)})</span>
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              </div>
              <p className="text-xl md:text-2xl font-black text-emerald-700">{formatMoney(budget?.inversion_ejecutada)}</p>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div className="bg-emerald-500 h-full" style={{ width: `${avance ?? 0}%` }} />
              </div>
            </div>
            <div className="bg-white p-6 rounded-3xl border-l-4 border-l-amber-500 border border-slate-100 shadow-sm space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-extrabold text-amber-600 uppercase tracking-wider">Por ejecutar ({formatPct(saldoPct)})</span>
                <Clock className="w-5 h-5 text-amber-500" />
              </div>
              <p className="text-xl md:text-2xl font-black text-amber-700">{formatMoney(saldo)}</p>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div className="bg-amber-500 h-full" style={{ width: `${saldoPct ?? 0}%` }} />
              </div>
            </div>
            <div className={`bg-white p-6 rounded-3xl border-l-4 ${expiredPolicies.length ? 'border-l-rose-600' : 'border-l-indigo-600'} border border-slate-100 shadow-sm space-y-2`}>
              <div className="flex items-center justify-between">
                <span className={`text-[11px] font-extrabold uppercase tracking-wider ${expiredPolicies.length ? 'text-rose-600' : 'text-indigo-600'}`}>Pólizas vencidas</span>
                <ShieldAlert className={`w-5 h-5 ${expiredPolicies.length ? 'text-rose-600' : 'text-indigo-600'}`} />
              </div>
              <p className={`text-xl md:text-2xl font-black ${expiredPolicies.length ? 'text-rose-700' : 'text-indigo-900'}`}>
                {report.polizas.length ? `${expiredPolicies.length} de ${report.polizas.length}` : '—'}
              </p>
              <p className="text-[11px] font-bold text-slate-500">{report.polizas.length ? 'Según el informe de interventoría' : 'El informe no reporta pólizas'}</p>
            </div>
          </div>

          {/* Evolución */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-5 md:p-6 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
              <h3 className="text-lg font-black text-[#004C6C]">Avance según inversión, semana a semana</h3>
              <span className="text-[11px] font-bold text-slate-400">Torre 2 · {dashboard?.history.length ?? 0} informes</span>
            </div>
            <AvanceHistoryChart history={dashboard?.history ?? []} selected={report.numero} onSelect={selectWeek} />
          </div>

          {/* Todo el detalle del informe */}
          <InformeSemanalPanel report={report} />
        </div>
      )}
    </div>
  );
}
