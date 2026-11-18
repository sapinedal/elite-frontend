import { useCallback, useEffect, useState } from 'react';
import {
  Building2,
  ExternalLink,
  TreePine,
  Calendar,
  Layers,
  MapPin,
  AlertTriangle,
  HardHat,
  CheckCircle2,
  Clock,
  DollarSign,
  FileText,
  Loader2
} from 'lucide-react';
import { AptoSemaphorizationGrid } from '../../ftra/components/AptoSemaphorizationGrid';
import { Tabs } from '../../../components/ui/Tabs';
import aerialPhoto from '../../../assets/san_miguel_aerial_real.jpg';
import { CustomSelect } from '../../../components/ui/CustomSelect';
import { getErrorMessage } from '../../../lib/apiError';
import { interventoriaService } from '../services/interventoriaService';
import { AvanceHistoryChart } from '../components/AvanceHistoryChart';
import { InformeSemanalPanel, ControlBadge } from '../components/InformeSemanalPanel';
import { formatDate, formatMoney, formatPct } from '../format';
import type { InterventoriaDashboard } from '../types';

interface ContractItem {
  id: string;
  nro: string;
  contractor: string;
  object: string;
  amount: string;
  policy: string;
  validity: string;
  status: 'vigente' | 'alerta' | 'tramite';
  drive_url: string;
}

const torre2Contracts: ContractItem[] = [
  {
    id: 't2-1',
    nro: '1 T2 (mo_1_t2)',
    contractor: 'EMELECT GROUP S.A.S.',
    object: 'Redes Eléctricas e Iluminación Torre 2',
    amount: '$320.000.000 COP',
    policy: 'Seguros del Estado 994821',
    validity: 'Vigente (30/Nov/2026)',
    status: 'vigente',
    drive_url: 'https://drive.google.com/drive/folders/1YIUcRPuGpLlfvX_XSymzjekEy4jAqlwD'
  },
  {
    id: 't2-2',
    nro: '2 T2 (mo_2_t2)',
    contractor: 'YANCELLY ASTRID MONSALVE YEPES',
    object: 'Mampostería, Estructura y Acabados Torre 2',
    amount: '$485.500.000 COP',
    policy: 'Suramericana 4182910',
    validity: 'Vigente (15/Ene/2027)',
    status: 'vigente',
    drive_url: 'https://drive.google.com/drive/folders/1YIUcRPuGpLlfvX_XSymzjekEy4jAqlwD'
  },
  {
    id: 't2-3',
    nro: '3 T2 (suminst_3_t2)',
    contractor: 'IHC S.A.S',
    object: 'Redes Hidrosanitarias y Gas Torre 2',
    amount: '$245.000.000 COP',
    policy: 'Seguros Mundial M-98214',
    validity: 'Vigente (28/Feb/2027)',
    status: 'vigente',
    drive_url: 'https://drive.google.com/drive/folders/1YIUcRPuGpLlfvX_XSymzjekEy4jAqlwD'
  },
  {
    id: 't2-4',
    nro: '4 T2 (suminst_4_t2)',
    contractor: 'IASS S.A.S',
    object: 'Suministro e Instalación Subestación Eléctrica',
    amount: '$189.000.000 COP',
    policy: 'Suramericana 439182',
    validity: 'Vigente (10/Dic/2026)',
    status: 'vigente',
    drive_url: 'https://drive.google.com/drive/folders/1YIUcRPuGpLlfvX_XSymzjekEy4jAqlwD'
  },
  {
    id: 't2-5',
    nro: '5 T2 (suminst_5_t2)',
    contractor: 'VENTANERÍA Y ALUMINIOS SAN MIGUEL',
    object: 'Suministro e Instalación Ventanería Torre 2',
    amount: '$168.000.000 COP',
    policy: 'Seguros del Estado 881923',
    validity: 'Alerta (Vence en 11 días)',
    status: 'alerta',
    drive_url: 'https://drive.google.com/drive/folders/1YIUcRPuGpLlfvX_XSymzjekEy4jAqlwD'
  },
  {
    id: 't2-6',
    nro: '6 a 16 T2',
    contractor: 'Carpintería, Ascensores, Impermeabilización...',
    object: 'Acabados, Pintura, Puertas y Aparatos Sanitarios',
    amount: '$890.000.000 COP Total',
    policy: 'Aseguradoras Varios',
    validity: 'Vigentes',
    status: 'vigente',
    drive_url: 'https://drive.google.com/drive/folders/1YIUcRPuGpLlfvX_XSymzjekEy4jAqlwD'
  }
];

const urbanismoContracts: ContractItem[] = [
  {
    id: 'urb-1',
    nro: '1 URB',
    contractor: 'INNOVAGAS S.A.S',
    object: 'Redes de Gas Urbanismo y Exteriores',
    amount: 'En Ejecución',
    policy: 'En trámite de firma',
    validity: 'En trámite de firma',
    status: 'tramite',
    drive_url: 'https://drive.google.com/drive/folders/1YIUcRPuGpLlfvX_XSymzjekEy4jAqlwD'
  },
  {
    id: 'urb-2',
    nro: '2 URB',
    contractor: 'EQUIPOS Y VIAS',
    object: 'Construcción de Vías y Andenes Urbanismo',
    amount: '$448.657.205 COP',
    policy: 'Suramericana 4282970',
    validity: 'Vigente (30/Abr/2027)',
    status: 'vigente',
    drive_url: 'https://drive.google.com/drive/folders/1YIUcRPuGpLlfvX_XSymzjekEy4jAqlwD'
  },
  {
    id: 'urb-3',
    nro: '3 URB',
    contractor: 'HIDRODINAMICA Y ESTRUCTURAS S.A.S',
    object: 'Redes de Acueducto y Alcantarillado',
    amount: '$384.000.000 COP',
    policy: 'Seguros Mundial M-100266629',
    validity: 'Vigente (15/May/2027)',
    status: 'vigente',
    drive_url: 'https://drive.google.com/drive/folders/1YIUcRPuGpLlfvX_XSymzjekEy4jAqlwD'
  },
  {
    id: 'urb-4',
    nro: '4 URB',
    contractor: 'AS INGENIERIA S.A.S',
    object: 'Construcción Portería Principal',
    amount: '$169.243.775 COP',
    policy: 'Suramericana 4363231',
    validity: 'Vigente (20/Nov/2026)',
    status: 'vigente',
    drive_url: 'https://drive.google.com/drive/folders/1YIUcRPuGpLlfvX_XSymzjekEy4jAqlwD'
  },
  {
    id: 'urb-5',
    nro: '5 URB',
    contractor: 'IASS S.A.S',
    object: 'Redes Eléctricas Exteriores Urbanismo',
    amount: '$116.194.864 COP',
    policy: 'Seguros Mundial M-100249799',
    validity: 'Vigente (31/Dic/2026)',
    status: 'vigente',
    drive_url: 'https://drive.google.com/drive/folders/1YIUcRPuGpLlfvX_XSymzjekEy4jAqlwD'
  }
];

type TabId = 'informe' | 'semáforo' | 'torre2' | 'urbanismo';

export default function InterventoriaPage() {
  const [activeTab, setActiveTab] = useState<TabId>('informe');
  const [dashboard, setDashboard] = useState<InterventoriaDashboard | null>(null);
  const [loading, setLoading] = useState(true);
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

  return (
    <div className="max-w-[1600px] mx-auto flex flex-col gap-6 md:gap-8 py-4 md:py-6 px-4">
      {/* Header Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-gradient-to-r from-[#004C6C] via-[#005981] to-[#003850] p-6 md:p-8 rounded-[32px] text-white shadow-xl">
        <div className="flex items-center gap-3 min-w-0">
          <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-md shrink-0">
            <Building2 className="w-8 h-8 text-[#EE9D4C]" />
          </div>
          <div className="min-w-0">
            <h1 className="text-2xl md:text-3xl font-black tracking-tight">Módulo de Control de Obra & Interventoría</h1>
            <p className="text-xs font-bold text-blue-200 uppercase tracking-widest">
              Inverconstrucción S.A.S. | Ciudadela San Miguel
              {report && ` — Informe N° ${report.numero} · ${formatDate(report.fecha)}${report.interventoria ? ` (${report.interventoria})` : ''}`}
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          {weekOptions.length > 0 && (
            <div className="sm:w-56 text-slate-700">
              <CustomSelect
                pyClass="py-3"
                searchable={false}
                options={weekOptions}
                value={String(report?.numero ?? '')}
                onChange={(v) => setNumero(Number(v) === dashboard?.history.at(-1)?.numero ? undefined : Number(v))}
              />
            </div>
          )}
          {report?.pdf_url && (
            <a
              href={report.pdf_url}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 border border-white/15 text-white px-5 py-3 rounded-2xl font-bold transition-all"
            >
              <FileText size={18} /> Ver PDF
            </a>
          )}
          <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md px-5 py-3 rounded-2xl border border-white/10">
            <Calendar className="w-5 h-5 text-[#EE9D4C]" />
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-300">Entrega pactada</p>
              <p className="text-sm font-black text-white uppercase">{report ? formatDate(report.fecha_fin_obra) : '—'}</p>
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

      {!loading && !error && !report && (
        <div className="p-5 bg-amber-50 border border-amber-100 rounded-3xl text-sm font-bold text-amber-800">
          Aún no se ha importado ningún informe de interventoría. Llegan a Gestión Documental → tecnica → INFORMES SEMANALES INTERVENTORÍA y se leen automáticamente cada hora.
        </div>
      )}

      {report && !report.es_ultimo && (
        <div className="p-4 bg-sky-50 border border-sky-100 rounded-2xl text-xs font-bold text-[#004C6C] flex items-center justify-between gap-3">
          <span>Estás viendo el informe N° {report.numero}, que no es el más reciente.</span>
          <button type="button" onClick={() => setNumero(undefined)} className="px-3 py-1.5 rounded-xl bg-white border border-sky-100 hover:bg-sky-100">Ver el último</button>
        </div>
      )}

      {/* DASHBOARD EJECUTIVO */}
      <div className={`bg-white p-6 md:p-8 rounded-[32px] border border-slate-100 shadow-xl space-y-6 transition-opacity ${loading ? 'opacity-60' : ''}`}>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-xl md:text-2xl font-black text-[#004C6C] flex items-center gap-2 tracking-tight">
              <Building2 className="w-6 h-6 text-[#EE9D4C]" />
              Ciudadela San Miguel - Club Residencial
            </h2>
            <p className="text-xs font-bold text-slate-500 flex items-center gap-1.5 mt-1">
              <MapPin size={14} className="text-[#004C6C]" />
              Caldas, Antioquia (VIS - 2,200 Aptos)
            </p>
          </div>
          {loading && <Loader2 className="w-5 h-5 text-[#EE9D4C] animate-spin" />}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Mapa aéreo con el avance por torre */}
          <div className="lg:col-span-8 relative rounded-3xl overflow-hidden border border-slate-200 min-h-[480px] md:min-h-[540px] flex flex-col justify-between group shadow-inner">
            <img
              src={aerialPhoto}
              alt="Mapa Aéreo San Miguel"
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-slate-900/20" />

            <div className="absolute inset-0 pointer-events-none z-10">
              <div className="absolute top-[55%] left-[74%] pointer-events-auto bg-emerald-600/95 backdrop-blur-md text-white px-3.5 py-1.5 rounded-full text-xs font-black border-2 border-emerald-300 shadow-xl flex items-center gap-1.5 transform -translate-x-1/2 -translate-y-1/2">
                <Building2 size={13} />
                Torre 1 | 99.9%
              </div>
              <div className="absolute top-[54%] left-[42%] pointer-events-auto bg-[#EE9D4C] backdrop-blur-md text-white px-4 py-2 rounded-full text-xs font-black border-2 border-white shadow-2xl flex items-center gap-1.5" title="Avance según inversión del último informe de interventoría">
                <HardHat size={14} />
                Torre 2 | {formatPct(avance)} (En Obra)
              </div>
              <div className="absolute top-[24%] left-[75%] pointer-events-auto bg-slate-900/85 backdrop-blur-md text-white px-3 py-1 rounded-full text-[11px] font-bold border border-slate-600 shadow-md transform -translate-x-1/2">
                Torre 3 | 0%
              </div>
              <div className="absolute top-[28%] left-[60%] pointer-events-auto bg-slate-900/85 backdrop-blur-md text-white px-3 py-1 rounded-full text-[11px] font-bold border border-slate-600 shadow-md transform -translate-x-1/2">
                Torre 4 | 0%
              </div>
              <div className="absolute top-[34%] left-[38%] pointer-events-auto bg-slate-900/85 backdrop-blur-md text-white px-3 py-1 rounded-full text-[11px] font-bold border border-slate-600 shadow-md transform -translate-x-1/2">
                Torre 5 | 0%
              </div>
              <div className="absolute top-[48%] left-[20%] pointer-events-auto bg-slate-900/85 backdrop-blur-md text-white px-3 py-1 rounded-full text-[11px] font-bold border border-slate-600 shadow-md transform -translate-x-1/2">
                Zonas Comunes | 0%
              </div>
            </div>

            <div className="relative z-10 p-4 flex justify-center">
              <div className="bg-white/95 backdrop-blur-md border border-slate-200 px-5 py-2 rounded-full flex items-center gap-4 text-xs font-bold text-slate-700 shadow-lg">
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Finalizada</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#EE9D4C] animate-pulse"></span> En Obra</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-slate-600"></span> No Iniciada</span>
              </div>
            </div>
          </div>

          {/* Panel lateral con el último informe */}
          <div className="lg:col-span-4 flex flex-col gap-4">
            <div className="bg-slate-50 border border-slate-200 p-5 rounded-3xl space-y-3">
              <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider block">
                Avance inversión Torre 2 {report && `(informe ${report.numero})`}
              </span>
              <div className="flex items-center gap-4">
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center shrink-0 shadow-sm"
                  style={{ background: `conic-gradient(#004C6C 0% ${avance ?? 0}%, #e2e8f0 ${avance ?? 0}% 100%)` }}
                >
                  <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center text-[11px] font-black text-[#004C6C]">
                    {avance != null ? `${avance.toFixed(1)}%` : '—'}
                  </div>
                </div>
                <div className="text-xs space-y-0.5 text-slate-700">
                  <p>Inversión ejecutada: <strong className="text-slate-900 font-black">{formatPct(avance)}</strong></p>
                  <p>Saldo por ejecutar: <strong className="text-slate-900 font-bold">{formatPct(saldoPct)}</strong></p>
                  <p className="text-[11px] text-slate-400 font-semibold">Interventoría: {report?.interventoria ?? '—'}</p>
                  <p className="text-[11px] text-[#004C6C] font-black">Finalización: {formatDate(report?.fecha_fin_obra)}</p>
                </div>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 p-5 rounded-3xl space-y-2">
              <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider block">Seguimiento presupuestal Torre 2</span>
              <p className="text-xl font-black text-[#004C6C]">{formatMoney(budget?.presupuesto_aprobado)}</p>
              <div className="text-xs space-y-1.5 text-slate-600 font-medium">
                <p className="flex justify-between gap-2 border-b border-slate-200/60 pb-1">
                  <span>• Inversión ejecutada:</span>
                  <strong className="text-slate-900 font-bold text-right">{formatMoney(budget?.inversion_ejecutada)} ({formatPct(avance)})</strong>
                </p>
                <p className="flex justify-between gap-2">
                  <span>• Saldo por ejecutar:</span>
                  <strong className="text-slate-900 font-bold text-right">{formatMoney(saldo)} ({formatPct(saldoPct)})</strong>
                </p>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 p-5 rounded-3xl space-y-2 text-xs">
              <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider block mb-1">Capítulos en ejecución (Torre 2)</span>
              {inProgress.length === 0 ? (
                <p className="text-slate-400 font-bold">{report ? 'Sin capítulos en ejecución en este informe.' : '—'}</p>
              ) : (
                <div className="space-y-1.5 text-slate-700 font-semibold">
                  {inProgress.map((c) => (
                    <div key={`${c.numero}-${c.nombre}`} className="flex items-center justify-between gap-2 border-b border-slate-200/60 pb-1.5 last:border-0">
                      <span className="min-w-0 truncate" title={c.nombre}>{c.nombre.replace(/^\d+(\.\d+)?\.\s*/, '')}: <strong className="text-slate-900">{formatPct(c.avance_actual)}</strong></span>
                      <ControlBadge control={c.control} compact />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {report && (report.observaciones.length > 0 || expiredPolicies.length > 0) && (
              <div className="bg-rose-50 border border-rose-200 p-4 rounded-3xl border-l-4 border-l-rose-500 space-y-2">
                <div className="flex items-center justify-between gap-2 text-xs font-black text-rose-800">
                  <span className="flex items-center gap-1.5"><AlertTriangle size={14} className="text-rose-600" /> ALERTAS INTERVENTORÍA N° {report.numero}</span>
                  <span className="bg-white border border-rose-200 px-2 py-0.5 rounded-full text-[10px] text-rose-700 font-bold">{formatDate(report.fecha)}</span>
                </div>
                {expiredPolicies.length > 0 && (
                  <p className="text-xs text-rose-900 font-bold">
                    {expiredPolicies.length} póliza{expiredPolicies.length === 1 ? '' : 's'} vencida{expiredPolicies.length === 1 ? '' : 's'}: {[...new Set(expiredPolicies.map((p) => p.contratista ?? 'contratista sin nombre legible'))].join(', ')}.
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

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-3xl border-l-4 border-l-[#004C6C] border border-slate-100 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">Presupuesto Total Torre 2</span>
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
            <div className="bg-emerald-500 h-full" style={{ width: `${avance ?? 0}%` }}></div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border-l-4 border-l-amber-500 border border-slate-100 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold text-amber-600 uppercase tracking-wider">Saldo por Ejecutar ({formatPct(saldoPct)})</span>
            <Clock className="w-5 h-5 text-amber-500" />
          </div>
          <p className="text-xl md:text-2xl font-black text-amber-700">{formatMoney(saldo)}</p>
          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
            <div className="bg-amber-500 h-full" style={{ width: `${saldoPct ?? 0}%` }}></div>
          </div>
        </div>

        <div className={`bg-white p-6 rounded-3xl border-l-4 ${expiredPolicies.length ? 'border-l-rose-600' : 'border-l-indigo-600'} border border-slate-100 shadow-sm space-y-2`}>
          <div className="flex items-center justify-between">
            <span className={`text-[11px] font-extrabold uppercase tracking-wider ${expiredPolicies.length ? 'text-rose-600' : 'text-indigo-600'}`}>Pólizas vencidas</span>
            <Layers className={`w-5 h-5 ${expiredPolicies.length ? 'text-rose-600' : 'text-indigo-600'}`} />
          </div>
          <p className={`text-xl md:text-2xl font-black ${expiredPolicies.length ? 'text-rose-700' : 'text-indigo-900'}`}>
            {report?.polizas.length ? `${expiredPolicies.length} de ${report.polizas.length}` : '—'}
          </p>
          <p className="text-[11px] font-bold text-slate-500">{report?.polizas.length ? 'Según el informe de interventoría' : 'El informe no reporta pólizas'}</p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <Tabs
        activeTab={activeTab}
        onChange={(id) => setActiveTab(id as TabId)}
        centered={true}
        items={[
          { id: 'informe', label: 'Informe semanal', icon: <FileText className="w-4 h-4" /> },
          { id: 'semáforo', label: 'Semaforización (200 Aptos)', icon: <Building2 className="w-4 h-4" /> },
          { id: 'torre2', label: 'Contratos Torre 2', icon: <Layers className="w-4 h-4" />, count: 16 },
          { id: 'urbanismo', label: 'Urbanismo & Zonas Comunes', icon: <TreePine className="w-4 h-4" />, count: 15 },
        ]}
      />

      {/* Tab: Informe semanal */}
      {activeTab === 'informe' && report && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-5 md:p-6 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
              <h3 className="text-lg font-black text-[#004C6C]">Avance según inversión, semana a semana</h3>
              <span className="text-[11px] font-bold text-slate-400">Torre 2 · {dashboard?.history.length ?? 0} informes</span>
            </div>
            <AvanceHistoryChart history={dashboard?.history ?? []} selected={report.numero} onSelect={(n) => setNumero(n === dashboard?.history.at(-1)?.numero ? undefined : n)} />
          </div>
          <InformeSemanalPanel report={report} />
        </div>
      )}

      {/* Tab Content 1: Semaforización 200 Aptos */}
      {activeTab === 'semáforo' && (
        <div className="animate-fade-in">
          <AptoSemaphorizationGrid />
        </div>
      )}

      {/* Tab Content 2: Contratos Torre 2 */}
      {activeTab === 'torre2' && (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 space-y-4 animate-fade-in">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <h3 className="text-lg font-black text-[#004C6C]">🏢 Módulo 1: Control Maestro de Contratos Torre 2</h3>
            <span className="px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-full border border-emerald-200">
              16 Contratos Registrados
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 font-extrabold uppercase tracking-wider">
                  <th className="py-3.5 px-4">N° / ID</th>
                  <th className="py-3.5 px-4">Contratista</th>
                  <th className="py-3.5 px-4">Objeto / Especialidad</th>
                  <th className="py-3.5 px-4">Valor Contrato</th>
                  <th className="py-3.5 px-4">Póliza & Aseguradora</th>
                  <th className="py-3.5 px-4">Vigencia Póliza</th>
                  <th className="py-3.5 px-4 text-center">Acción Drive</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {torre2Contracts.map(c => (
                  <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3.5 px-4 font-black text-[#004C6C]">{c.nro}</td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">{c.contractor}</td>
                    <td className="py-3.5 px-4 text-slate-600 max-w-xs">{c.object}</td>
                    <td className="py-3.5 px-4 font-black text-slate-900">{c.amount}</td>
                    <td className="py-3.5 px-4 text-slate-700">{c.policy}</td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${c.status === 'alerta'
                        ? 'bg-amber-50 text-amber-700 border border-amber-200'
                        : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        }`}>
                        {c.validity}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <a
                        href={c.drive_url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#004C6C] text-white font-bold rounded-xl text-[11px] hover:bg-[#EE9D4C] transition-colors"
                      >
                        Abrir Drive
                        <ExternalLink size={12} />
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab Content 3: Contratos Urbanismo */}
      {activeTab === 'urbanismo' && (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 space-y-4 animate-fade-in">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <h3 className="text-lg font-black text-[#004C6C]">🌳 Módulo 2: Contratos Urbanismo y Zonas Comunes</h3>
            <span className="px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-full border border-emerald-200">
              15 Contratos Registrados
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 font-extrabold uppercase tracking-wider">
                  <th className="py-3.5 px-4">N° Contrato</th>
                  <th className="py-3.5 px-4">Contratista</th>
                  <th className="py-3.5 px-4">Especialidad / Objeto</th>
                  <th className="py-3.5 px-4">Valor Presupuestado</th>
                  <th className="py-3.5 px-4">Póliza & Aseguradora</th>
                  <th className="py-3.5 px-4 text-center">Acción Drive</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {urbanismoContracts.map(c => (
                  <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3.5 px-4 font-black text-[#004C6C]">{c.nro}</td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">{c.contractor}</td>
                    <td className="py-3.5 px-4 text-slate-600 max-w-xs">{c.object}</td>
                    <td className="py-3.5 px-4 font-black text-slate-900">{c.amount}</td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${c.status === 'tramite'
                        ? 'bg-amber-50 text-amber-700 border border-amber-200'
                        : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        }`}>
                        {c.validity}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <a
                        href={c.drive_url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#004C6C] text-white font-bold rounded-xl text-[11px] hover:bg-[#EE9D4C] transition-colors"
                      >
                        Abrir Drive
                        <ExternalLink size={12} />
                      </a>
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
}
