import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  ClipboardCheck,
  TrendingUp,
  ChevronRight,
  ArrowLeft,
  Building2,
  Trophy,
  FileText,
  Loader2
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

import { useUsers } from '../../users/hooks/useUsers';
import { evaluationService } from '../../evaluacion/services/evaluationService';
import type { User } from '../../users/types';
import type { AreaDashboardReport, Evaluation } from '../../evaluacion/types';
import { Skeleton } from '../../../components/ui/Skeleton';
import { CustomSelect } from '../../../components/ui/CustomSelect';

// --- Sub-components for specialized visualization ---

const CircularProgress = ({ value, label, color, size = 60 }: { value: number, label: string, color: string, size?: number }) => {
  const radius = (size / 2) - 5;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative" style={{ width: size, height: size }}>
        <svg className="w-full h-full transform -rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth="4"
            fill="transparent"
            className="text-slate-100"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={color}
            strokeWidth="4"
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-[10px] font-black" style={{ color }}>{value.toFixed(0)}%</span>
        </div>
      </div>
      <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">{label}</span>
    </div>
  );
};

const GaugeChart = ({ value, label }: { value: number, label: string }) => {
  const rotation = (value / 100) * 180 - 90;
  const color = value >= 90 ? '#10B981' : value >= 70 ? '#F59E0B' : '#EF4444';

  return (
    <div className="flex flex-col items-center mt-4">
      <div className="relative w-32 h-16 overflow-hidden">
        <div className="absolute top-0 left-0 w-32 h-32 border-12 border-slate-100 rounded-full"></div>
        <div
          className="absolute top-0 left-0 w-32 h-32 border-12 rounded-full transition-all duration-1000"
          style={{
            borderColor: color,
            clipPath: `inset(0 0 50% 0)`,
            transform: `rotate(${(value / 100) * 180 - 180}deg)`
          }}
        ></div>
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-12 bg-slate-800 rounded-full origin-bottom transition-transform duration-1000"
          style={{ transform: `translateX(-50%) rotate(${rotation}deg)` }}>
        </div>
      </div>
      <div className="text-xl font-black mt-1" style={{ color }}>{value.toFixed(0)}</div>
      <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{label}</div>
    </div>
  );
};

const CustomKPITooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xl space-y-1 z-50">
        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{data.collaborator}</p>
        <p className="text-xs font-black text-[#004C6C]">{data.category}</p>
        <div className="flex gap-4 pt-2 text-xs font-bold">
          <span className="text-[#004C6C]">Incidencia: {payload[0].value}%</span>
          <span className="text-[#e65f2b]">Calificación: {payload[1].value}%</span>
        </div>
      </div>
    );
  }
  return null;
};

export default function DashboardPage() {
  const { users: rawUsers, isLoading: usersLoading } = useUsers();
  const users = useMemo(() => rawUsers.filter(u => u.is_active !== false && !u.deleted_at), [rawUsers]);
  const [allEvaluations, setAllEvaluations] = useState<Evaluation[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [view, setView] = useState<'areas' | 'detail'>('areas');
  const [selectedArea, setSelectedArea] = useState<string | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const [isExporting, setIsExporting] = useState(false);

  const currentMonth = Number(searchParams.get('month')) || new Date().getMonth() + 1;
  const currentYear = Number(searchParams.get('year')) || new Date().getFullYear();

  const meses = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  const years = Array.from({ length: 5 }, (_, i) => 2024 + i);

  const handleMonthChange = (month: number) => {
    setSearchParams(prev => {
      prev.set('month', month.toString());
      return prev;
    });
  };

  const handleYearChange = (year: number) => {
    setSearchParams(prev => {
      prev.set('year', year.toString());
      return prev;
    });
  };

  useEffect(() => {
    const fetchHistory = async () => {
      setIsLoadingHistory(true);
      try {
        const data = await evaluationService.getAllHistory();
        setAllEvaluations(data);
      } catch (error) {
        console.error("Error fetching dashboard history:", error);
      } finally {
        setIsLoadingHistory(false);
      }
    };

    fetchHistory();
  }, []);

  const monthEvaluations = allEvaluations.filter(
    e => Number(e.month) === currentMonth && Number(e.year) === currentYear
  );

  // Global calculations
  const totalUsers = users.length;
  const evaluatedCount = monthEvaluations.length;
  const progressPercent = totalUsers > 0 ? (evaluatedCount / totalUsers) * 100 : 0;
  const averageScore = evaluatedCount > 0
    ? monthEvaluations.reduce((acc, curr) => acc + Number(curr.total_score || 0), 0) / evaluatedCount
    : 0;

  // Group users by area
  const groupedData = users.reduce((acc, user) => {
    const areaName = typeof user.area === 'object' ? user.area?.name : user.area;
    const key = areaName || 'Sin Área';
    if (!acc[key]) acc[key] = [];
    const evaluation = monthEvaluations.find(e => e.user_id === user.id);
    acc[key].push({ user, evaluation });
    return acc;
  }, {} as Record<string, { user: User, evaluation?: Evaluation }[]>);

  // Detalle del área: todo se calcula en el backend (KpiDashboardService), igual que el PDF
  const [areaReport, setAreaReport] = useState<AreaDashboardReport | null>(null);
  const [isLoadingReport, setIsLoadingReport] = useState(false);

  useEffect(() => {
    if (!selectedArea) {
      setAreaReport(null);
      return;
    }
    let cancelled = false;
    setIsLoadingReport(true);
    evaluationService
      .getAreaDashboard(selectedArea, currentMonth, currentYear)
      .then((report) => { if (!cancelled) setAreaReport(report); })
      .catch((error) => {
        console.error('Error fetching area dashboard:', error);
        if (!cancelled) setAreaReport(null);
      })
      .finally(() => { if (!cancelled) setIsLoadingReport(false); });
    return () => { cancelled = true; };
  }, [selectedArea, currentMonth, currentYear]);

  const monthPalette = ['#1a5b78', '#e65f2b', '#1b5e20', '#0288d1', '#9c27b0', '#55a630', '#0b2c3d', '#7209b7', '#f72585'];
  const monthsConfig = (areaReport?.months ?? []).map((m, i) => ({
    key: m.key,
    label: m.label,
    color: monthPalette[i % monthPalette.length],
  }));

  const comparisonData = areaReport?.comparison ?? [];

  const evolutionData = (areaReport?.evolution ?? []).map((m) => ({ name: m.label, score: m.average }));

  // Incidencia (peso) vs calificación (aporte a la nota final) por colaborador y categoría
  const activeKpiBreakdownData = (areaReport?.breakdown ?? []).map((r) => {
    const firstName = r.short_name.split(' ')[0];
    return {
      displayLabel: `${firstName} - ${r.category.substring(0, 16)}`,
      collaborator: `${r.short_name}${r.position ? ` · ${r.position}` : ''}`,
      category: r.category,
      "Suma de INCIDENCIA": r.incidence,
      "Suma de CALIFICACIÓN": r.contribution,
    };
  });


  const handleAreaClick = (areaName: string) => {
    setSelectedArea(areaName);
    setView('detail');
  };

  const handleBack = () => {
    setView('areas');
    setSelectedArea(null);
  };

  const handleExportAreaPDF = async () => {
    if (!selectedArea) return;
    setIsExporting(true);
    try {
      await evaluationService.exportDashboardPdf(currentMonth, currentYear, selectedArea);
    } catch (error) {
      console.error("Error exporting dashboard PDF:", error);
    } finally {
      setIsExporting(false);
    }
  };

  if (usersLoading || isLoadingHistory) {
    return (
      <div className="p-8 space-y-8">
        <Skeleton className="h-12 w-64 rounded-xl" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32 rounded-[28px]" />)}
        </div>
        <Skeleton className="h-96 rounded-[28px]" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-8 pb-20">

      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <AnimatePresence mode="wait">
            <motion.div
              key={view}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <div className="flex items-center gap-3 mb-2">
                {view === 'detail' && (
                  <button
                    onClick={handleBack}
                    className="p-2 hover:bg-slate-100 rounded-xl text-[#004C6C] transition-colors"
                  >
                    <ArrowLeft size={20} />
                  </button>
                )}
                <h1 className="text-3xl md:text-4xl font-black text-[#004C6C] tracking-tight">
                  {view === 'areas' ? 'Dashboard KPIs' : selectedArea}
                </h1>
              </div>
              <p className="text-slate-400 font-bold uppercase tracking-[0.2em] text-xs">
                {meses[currentMonth - 1]} {currentYear} — {view === 'areas' ? 'Visión General' : 'Indicadores de Desempeño'}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Month/Year Selector */}
        <div className="flex items-center gap-4 bg-white p-1.5 rounded-3xl border border-slate-200 shadow-lg relative z-50">
          <div className="w-40">
            <CustomSelect
              options={meses.map((m, i) => ({ value: i + 1, label: m }))}
              value={currentMonth}
              onChange={handleMonthChange}
            />
          </div>
          <div className="w-28">
            <CustomSelect
              options={years.map(y => ({ value: y, label: y.toString() }))}
              value={currentYear}
              onChange={handleYearChange}
            />
          </div>
        </div>

        {/* Mini Stats (Compact version of the old cards) */}
        <div className="flex flex-wrap gap-4">
          <div className="bg-white px-4 py-2 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3">
            <Users className="text-[#004C6C]" size={16} />
            <span className="text-sm font-black text-[#004C6C]">{totalUsers}</span>
          </div>
          <div className="bg-white px-4 py-2 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3">
            <ClipboardCheck className="text-green-600" size={16} />
            <span className="text-sm font-black text-green-600">{evaluatedCount} ({progressPercent.toFixed(0)}%)</span>
          </div>
          <div className="bg-white px-4 py-2 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3">
            <TrendingUp className="text-[#004C6C]" size={16} />
            <span className="text-sm font-black text-[#004C6C]">{averageScore.toFixed(1)}%</span>
          </div>

          {view === 'detail' && selectedArea && (
            <button
              onClick={handleExportAreaPDF}
              disabled={isExporting}
              className="bg-green-50 text-green-600 px-6 py-2 rounded-2xl border border-green-100 shadow-sm flex items-center gap-3 font-black text-xs uppercase tracking-widest hover:bg-green-500 hover:text-white hover:border-green-500 transition-all transform hover:scale-105 active:scale-95 disabled:opacity-50"
            >
              {isExporting ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <FileText size={16} />
              )}
              {isExporting ? 'Exportando...' : 'Exportar PDF'}
            </button>
          )}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {view === 'areas' ? (
          <motion.div
            key="areas-grid"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            {Object.entries(groupedData).map(([area, members]) => {
              const areaEvaluated = members.filter(m => m.evaluation).length;
              const areaAverage = areaEvaluated > 0
                ? members.reduce((acc, m) => acc + Number(m.evaluation?.total_score || 0), 0) / areaEvaluated
                : 0;

              return (
                <motion.div
                  key={area}
                  whileHover={{ y: -5 }}
                  onClick={() => handleAreaClick(area)}
                  className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm hover:shadow-xl hover:border-[#004C6C]/20 transition-all cursor-pointer group relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 p-8 opacity-5 transition-transform group-hover:scale-110">
                    <Building2 size={80} />
                  </div>

                  <div className="h-12 w-12 bg-slate-50 rounded-2xl flex items-center justify-center text-[#004C6C] mb-6 group-hover:bg-[#004C6C] group-hover:text-white transition-colors">
                    {area === 'Comercial' ? <Trophy size={24} /> : <Building2 size={24} />}
                  </div>

                  <h3 className="text-xl font-black text-[#004C6C] mb-2">{area}</h3>
                  <div className="flex items-center gap-4 text-slate-400 mb-6">
                    <div className="flex items-center gap-1.5">
                      <Users size={14} />
                      <span className="text-xs font-bold">{members.length}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <ClipboardCheck size={14} />
                      <span className="text-xs font-bold">{areaEvaluated} evaluadas</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-end">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Puntaje Promedio</span>
                      <span className={`text-lg font-black ${areaAverage >= 90 ? 'text-green-600' : areaAverage >= 70 ? 'text-orange-500' : 'text-red-500'
                        }`}>
                        {areaAverage.toFixed(1)}%
                      </span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${areaAverage}%` }}
                        className={`h-full rounded-full ${areaAverage >= 90 ? 'bg-green-500' : areaAverage >= 70 ? 'bg-orange-500' : 'bg-red-500'
                          }`}
                      />
                    </div>
                  </div>

                  <div className="mt-8 flex items-center text-[#004C6C] text-xs font-black uppercase tracking-widest group-hover:gap-2 transition-all">
                    Ver detalle <ChevronRight size={14} />
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        ) : (
          <motion.div
            key="area-detail"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-8"
          >
            {selectedArea ? (
              <div className="space-y-8">
                {/* Visual Employee Columns (The Excel Core) - Full Width */}
                <div className="overflow-x-auto pb-4 w-full">
                  <div className="flex gap-6 min-w-max">
                    {isLoadingReport && !areaReport && (
                      [1, 2, 3].map(i => <Skeleton key={i} className="w-72 h-[520px] rounded-[32px]" />)
                    )}
                    {areaReport?.collaborators.map((collab, idx) => {
                      const stages = collab.categories;
                      return (
                        <motion.div
                          key={collab.user_id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.1 }}
                          className="w-72 bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden"
                        >
                          <div className="p-6 bg-slate-50 border-b border-slate-100">
                            <h4 className="font-black text-[#004C6C] truncate">{collab.name}</h4>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate">
                              {collab.position}
                            </p>
                          </div>

                          <div className="p-6 space-y-6">
                            {stages.length === 0 && (
                              <p className="text-xs text-slate-400 font-semibold text-center">Sin KPIs configurados</p>
                            )}
                            {stages.map(stage => (
                              <div key={stage.name} className="space-y-3">
                                <h5 className="text-[9px] font-black text-slate-500 uppercase tracking-tight leading-tight">
                                  {stage.name}
                                </h5>
                                <div className="flex justify-around items-center bg-slate-50/50 p-2 rounded-2xl">
                                  <CircularProgress value={stage.incidence} label="Incidencia" color="#3B82F6" />
                                  <CircularProgress
                                    value={stage.score ?? 0}
                                    label={stage.score === null ? 'Sin evaluar' : 'Calificación'}
                                    color={stage.score === null ? '#CBD5E1' : '#F97316'}
                                  />
                                </div>
                              </div>
                            ))}

                            <div className="pt-4 border-t border-slate-100 flex flex-col items-center">
                              {collab.total_score === null ? (
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest py-6">
                                  Sin evaluación en el periodo
                                </p>
                              ) : (
                                <GaugeChart value={collab.total_score} label="Calificación Final" />
                              )}
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>

                {/* Evolución Mensual - Full Width */}
                <div className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm space-y-6">
                  <div>
                    <h4 className="text-lg font-black text-[#004C6C] tracking-tight">Evolución Mensual</h4>
                    <p className="text-slate-400 font-bold uppercase tracking-wider text-[10px] mt-1">Evolución del puntaje promedio del área en los últimos meses</p>
                  </div>
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={evolutionData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 'bold', fill: '#94a3b8' }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 'bold', fill: '#94a3b8' }} domain={[0, 100]} />
                        <Tooltip
                          contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                          labelStyle={{ fontWeight: 'black', color: '#004C6C' }}
                        />
                        <Line
                          type="monotone"
                          dataKey="score"
                          name="Promedio"
                          stroke="#004C6C"
                          strokeWidth={4}
                          dot={{ r: 6, fill: '#004C6C', strokeWidth: 2, stroke: '#fff' }}
                          activeDot={{ r: 8 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Comparativa Equipo - Full Width */}
                <div className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm space-y-6">
                  <div>
                    <h4 className="text-lg font-black text-[#004C6C] tracking-tight">Comparativa de Equipo</h4>
                    <p className="text-slate-400 font-bold uppercase tracking-wider text-[10px] mt-1">Historial de calificaciones de los colaboradores por mes</p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                    {comparisonData.map((collab) => {
                      const cargoName = collab.position || '';
                      const name = collab.short_name;

                      const collabData = monthsConfig
                        .map(m => ({
                          name: m.label,
                          score: collab.scores[m.key] ?? undefined,
                          color: m.color
                        }))
                        .filter(item => item.score !== undefined && item.score !== null);

                      if (collabData.length === 0) return null;

                      return (
                        <div key={collab.user_id} className="bg-slate-50/50 p-6 rounded-2xl border border-slate-100 flex flex-col justify-between">
                          <div className="mb-4">
                            <div className="text-sm font-black text-slate-800 tracking-tight leading-tight">{name}</div>
                            <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-1">{cargoName}</div>
                          </div>
                          <div className="w-full">
                            <ResponsiveContainer width="100%" height={collabData.length * 28 + 10}>
                              <BarChart
                                layout="vertical"
                                data={collabData}
                                margin={{ top: 5, right: 35, left: 0, bottom: 5 }}
                              >
                                <XAxis type="number" domain={[0, 100]} hide />
                                <YAxis
                                  dataKey="name"
                                  type="category"
                                  axisLine={false}
                                  tickLine={false}
                                  tick={{ fontSize: 9, fontWeight: 'bold', fill: '#64748b' }}
                                  width={40}
                                />
                                <Tooltip
                                  cursor={{ fill: '#f8fafc' }}
                                  formatter={(value: any) => [`${Number(value).toFixed(1)}%`, 'Puntaje']}
                                  contentStyle={{ borderRadius: '8px', fontSize: '10px' }}
                                />
                                <Bar
                                  dataKey="score"
                                  radius={[0, 4, 4, 0]}
                                  barSize={12}
                                  label={{
                                    position: 'right',
                                    fontSize: 9,
                                    fontWeight: 'bold',
                                    fill: '#475569',
                                    formatter: (v: any) => `${Number(v).toFixed(0)}%`
                                  }}
                                >
                                  {collabData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                  ))}
                                </Bar>
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Custom HTML Legend */}
                  <div className="mt-6 pt-6 border-t border-slate-100">
                    <div className="flex flex-wrap justify-center gap-x-4 gap-y-2">
                      {monthsConfig.map(m => (
                        <div key={m.key} className="flex items-center gap-1.5">
                          <span className="w-3 h-3 rounded-full" style={{ backgroundColor: m.color }} />
                          <span className="text-[9px] font-bold text-slate-500 uppercase tracking-tight">{m.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* KPI Breakdown Line Chart - Full Width */}
                {activeKpiBreakdownData && activeKpiBreakdownData.length > 0 && (
                  <div className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <h4 className="text-lg font-black text-[#004C6C] tracking-tight">Desglose de KPIs: Incidencia vs Calificación</h4>
                        <p className="text-slate-400 font-bold uppercase tracking-wider text-[10px] mt-1">Comparativa de peso estratégico vs calificación obtenida por el equipo de {selectedArea}</p>
                      </div>
                      {/* Legend badges */}
                      <div className="flex items-center gap-4 text-xs font-bold">
                        <div className="flex items-center gap-2">
                          <span className="w-3 h-3 rounded-md bg-[#004C6C]"></span>
                          <span className="text-slate-600">Suma de INCIDENCIA</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="w-3 h-3 rounded-md bg-[#e65f2b]"></span>
                          <span className="text-slate-600">Suma de CALIFICACIÓN</span>
                        </div>
                      </div>
                    </div>

                    <div className="h-[350px] w-full mt-4">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart 
                          data={activeKpiBreakdownData} 
                          margin={{ top: 10, right: 30, left: 0, bottom: 40 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis 
                            dataKey="displayLabel" 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{ fontSize: 8, fontWeight: 'bold', fill: '#64748b' }}
                            height={60}
                            interval={0}
                            angle={-25}
                            textAnchor="end"
                          />
                          <YAxis 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{ fontSize: 9, fontWeight: 'bold', fill: '#94a3b8' }}
                            domain={[0, 100]}
                          />
                          <Tooltip content={<CustomKPITooltip />} />
                          <Line 
                            type="monotone" 
                            dataKey="Suma de INCIDENCIA" 
                            stroke="#004C6C" 
                            strokeWidth={3}
                            dot={{ r: 5, fill: '#004C6C', strokeWidth: 2, stroke: '#fff' }}
                            activeDot={{ r: 7 }}
                          />
                          <Line 
                            type="monotone" 
                            dataKey="Suma de CALIFICACIÓN" 
                            stroke="#e65f2b" 
                            strokeWidth={3}
                            dot={{ r: 5, fill: '#e65f2b', strokeWidth: 2, stroke: '#fff' }}
                            activeDot={{ r: 7 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}
              </div>
            ) : null}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Global Progress Bar (Always visible at bottom or integrated) */}
      <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm space-y-4">
        <div className="flex justify-between items-end">
          <h3 className="text-sm font-black text-[#004C6C] uppercase tracking-widest">Progreso Global Evaluaciones</h3>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
            <span className="text-[#004C6C] text-sm font-black">{evaluatedCount}</span> / {totalUsers} evaluadas este mes
          </p>
        </div>
        <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            className="h-full bg-[#004C6C] rounded-full shadow-lg shadow-blue-900/20"
          />
        </div>
      </div>
    </div>
  );
}

