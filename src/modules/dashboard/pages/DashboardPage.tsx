import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  ClipboardCheck,
  TrendingUp,
  ChevronRight,
  ArrowLeft,
  BarChart3,
  Building2,
  Trophy,
  Target,
  FileText,
  Loader2
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';

import { useUsers } from '../../users/hooks/useUsers';
import { evaluationService } from '../../evaluacion/services/evaluationService';
import type { User } from '../../users/types';
import type { Evaluation } from '../../evaluacion/types';
import { Skeleton } from '../../../components/ui/Skeleton';

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

export default function DashboardPage() {
  const { users, isLoading: usersLoading } = useUsers();
  const [monthEvaluations, setMonthEvaluations] = useState<Evaluation[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [view, setView] = useState<'areas' | 'detail'>('areas');
  const [selectedArea, setSelectedArea] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  const meses = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  useEffect(() => {
    const fetchHistory = async () => {
      setIsLoadingHistory(true);
      try {
        const data = await evaluationService.getAllHistory({
          month: currentMonth,
          year: currentYear
        });
        setMonthEvaluations(data);
      } catch (error) {
        console.error("Error fetching dashboard history:", error);
      } finally {
        setIsLoadingHistory(false);
      }
    };

    fetchHistory();
  }, [currentMonth, currentYear]);

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
            {selectedArea === 'Comercial' ? (
              <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">

                {/* Visual Employee Columns (The Excel Core) */}
                <div className="xl:col-span-3 overflow-x-auto pb-4">
                  <div className="flex gap-6 min-w-max">
                    {groupedData[selectedArea]?.map(({ user, evaluation }, idx) => {
                      // Mock breakdown for visualization (in real app, would come from evaluation indicators)
                      const stages = [
                        { id: 'A', name: 'Estrategia y Planificación', incid: 30, calif: evaluation ? Number(evaluation.total_score) * 0.8 : 0 },
                        { id: 'B', name: 'Liderazgo y Gestión', incid: 30, calif: evaluation ? Number(evaluation.total_score) * 0.9 : 0 },
                        { id: 'C', name: 'Gestión Operativa', incid: 30, calif: evaluation ? Number(evaluation.total_score) * 0.95 : 0 },
                        { id: 'D', name: 'Gestión Documental', incid: 10, calif: evaluation ? Number(evaluation.total_score) * 1 : 0 },
                      ];

                      return (
                        <motion.div
                          key={user.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.1 }}
                          className="w-72 bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden"
                        >
                          <div className="p-6 bg-slate-50 border-b border-slate-100">
                            <h4 className="font-black text-[#004C6C] truncate">{user.name}</h4>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate">
                              {typeof user.position === 'object' ? user.position?.name : user.position}
                            </p>
                          </div>

                          <div className="p-6 space-y-6">
                            {stages.map(stage => (
                              <div key={stage.id} className="space-y-3">
                                <h5 className="text-[9px] font-black text-slate-500 uppercase tracking-tight leading-tight">
                                  {stage.id}. {stage.name}
                                </h5>
                                <div className="flex justify-around items-center bg-slate-50/50 p-2 rounded-2xl">
                                  <CircularProgress value={stage.incid} label="Incidencia" color="#3B82F6" />
                                  <CircularProgress value={stage.calif} label="Calificación" color="#F97316" />
                                </div>
                              </div>
                            ))}

                            <div className="pt-4 border-t border-slate-100 flex flex-col items-center">
                              <GaugeChart
                                value={evaluation ? Number(evaluation.total_score) : 0}
                                label="Calificación Final"
                              />
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>

                {/* Performance Analytics Sidebar */}
                <div className="space-y-8">
                  {/* Historical Line Chart */}
                  <div className="bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm">
                    <h4 className="text-xs font-black text-[#004C6C] uppercase tracking-widest mb-6 flex items-center gap-2">
                      <BarChart3 size={14} /> Evolución Mensual
                    </h4>
                    <div className="h-48 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={[
                          { name: 'Ene', score: 82 },
                          { name: 'Feb', score: 85 },
                          { name: 'Mar', score: averageScore || 88 },
                        ]}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 'bold', fill: '#94a3b8' }} />
                          <YAxis hide domain={[0, 100]} />
                          <Tooltip
                            contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                            labelStyle={{ fontWeight: 'black', color: '#004C6C' }}
                          />
                          <Line
                            type="monotone"
                            dataKey="score"
                            stroke="#004C6C"
                            strokeWidth={4}
                            dot={{ r: 6, fill: '#004C6C', strokeWidth: 2, stroke: '#fff' }}
                            activeDot={{ r: 8 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Team Comparison Bar Chart */}
                  <div className="bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm">
                    <h4 className="text-xs font-black text-[#004C6C] uppercase tracking-widest mb-6 flex items-center gap-2">
                      <Target size={14} /> Comparativa Equipo
                    </h4>
                    <div className="h-64 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart layout="vertical" data={groupedData[selectedArea]?.map(m => ({
                          name: m.user.name.split(' ')[0],
                          score: m.evaluation ? Number(m.evaluation.total_score) : 0
                        })).sort((a, b) => b.score - a.score)}>
                          <XAxis type="number" hide domain={[0, 100]} />
                          <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 'bold', fill: '#64748b' }} width={60} />
                          <Tooltip cursor={{ fill: '#f8fafc' }} />
                          <Bar dataKey="score" radius={[0, 10, 10, 0]} barSize={20}>
                            {groupedData[selectedArea]?.map((_, index) => (
                              <Cell key={`cell-${index}`} fill={index === 0 ? '#004C6C' : '#94a3b8'} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white p-12 rounded-[32px] border border-dashed border-slate-300 text-center">
                <BarChart3 className="mx-auto text-slate-200 mb-4" size={48} />
                <h3 className="text-xl font-black text-slate-400">Detalle en desarrollo</h3>
                <p className="text-slate-400 text-sm mt-2">La vista especializada para esta área estará disponible pronto.</p>
                <button
                  onClick={handleBack}
                  className="mt-6 px-6 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-black text-xs uppercase tracking-widest transition-colors"
                >
                  Regresar
                </button>
              </div>
            )}
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

