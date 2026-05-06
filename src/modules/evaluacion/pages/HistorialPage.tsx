import { useState, useEffect } from 'react';
import { evaluationService } from '../services/evaluationService';
import { useUsers } from '../../users/hooks/useUsers';
import { meses } from '../types';
import type { Evaluation } from '../types';
import { Search, History, Calendar, Layout, ArrowUpRight, CheckCircle2, Clock, TrendingUp, FileText, Loader2 } from 'lucide-react';
import { CustomSelect } from '../../../components/ui/CustomSelect';
import { Autocomplete } from '../../../components/ui/Autocomplete';
import { Skeleton } from '../../../components/ui/Skeleton';
import { EvaluationViewModal } from '../../../components/ui/EvaluationViewModal';
import { Modal } from '../../../components/ui/Modal';


export default function HistorialPage() {
  const { users } = useUsers();
  const [history, setHistory] = useState<Evaluation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedEval, setSelectedEval] = useState<Evaluation | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [selectedEvalForHistory, setSelectedEvalForHistory] = useState<Evaluation | null>(null);
  const [isExportingId, setIsExportingId] = useState<number | null>(null);


  // Filters
  const [selectedUser, setSelectedUser] = useState<number | null>(null);
  const [selectedArea, setSelectedArea] = useState<string>('');
  const [selectedMonth, setSelectedMonth] = useState<number | ''>('');
  const [selectedYear, setSelectedYear] = useState<number | ''>('');

  const areas = Array.from(new Set(users.map(u => typeof u.area === 'object' ? u.area?.name : u.area))).filter((a): a is string => !!a);

  useEffect(() => {
    loadHistory();
  }, [selectedUser, selectedArea, selectedMonth, selectedYear]);

  const loadHistory = async () => {
    setIsLoading(true);
    try {
      const data = await evaluationService.getAllHistory({
        user_id: selectedUser,
        area: selectedArea,
        month: selectedMonth,
        year: selectedYear
      });
      setHistory(data);
    } catch (error) {
      console.error('Error loading history:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600 bg-green-50 border-green-100';
    if (score >= 70) return 'text-yellow-600 bg-yellow-50 border-yellow-100';
    return 'text-red-600 bg-red-50 border-red-100';
  };

  const getStatusBadge = (status: string) => {
    if (status === 'finalizada') {
      return (
        <span className="flex items-center gap-1.5 px-3 py-1 bg-green-50 text-green-600 text-[10px] font-black uppercase tracking-wider rounded-lg border border-green-100">
          <CheckCircle2 size={12} /> Finalizada
        </span>
      );
    }
    return (
      <span className="flex items-center gap-1.5 px-3 py-1 bg-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-wider rounded-lg border border-slate-200">
        <Clock size={12} /> Borrador
      </span>
    );
  };

  const handleExport = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    setIsExportingId(id);
    try {
      await evaluationService.exportPdf(id);
    } catch (error) {
      console.error('Error exporting PDF:', error);
    } finally {
      setIsExportingId(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-32 pt-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 bg-[#EE9D4C] rounded-[20px] flex items-center justify-center text-white shadow-lg shadow-orange-900/5">
            <History size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-[#004C6C] tracking-tight">Historial de Evaluaciones</h1>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Análisis de resultados históricos</p>
          </div>
        </div>
      </div>

      {/* Advanced Filters */}
      <div className="bg-white p-8 rounded-[32px] shadow-[0_8px_30px_rgb(0,0,0,0.03)] border border-slate-100">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Autocomplete
            label="Colaborador"
            options={users.map(u => ({ value: u.id, label: u.name, sublabel: typeof u.area === 'object' ? u.area?.name : u.area }))}
            value={selectedUser}
            onChange={setSelectedUser}
            placeholder="Buscar persona..."
          />
          <CustomSelect
            label="Área / Departamento"
            options={areas.map(a => ({ value: a, label: a }))}
            value={selectedArea}
            onChange={setSelectedArea}
            placeholder="Todas las áreas"
          />
          <CustomSelect
            label="Mes"
            options={meses}
            value={selectedMonth}
            onChange={setSelectedMonth}
            placeholder="Todos los meses"
          />
          <CustomSelect
            label="Año"
            options={[2024, 2025, 2026].map(y => ({ value: y, label: y.toString() }))}
            value={selectedYear}
            onChange={setSelectedYear}
            placeholder="Todos los años"
          />
        </div>
      </div>

      {/* Summary Cards (Quick Stats) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-[#004C6C] p-6 rounded-[28px] text-white shadow-lg shadow-blue-900/10 relative overflow-hidden group">
          <Layout className="absolute -right-4 -bottom-4 text-white/5 w-24 h-24 rotate-12 transition-transform group-hover:scale-110" />
          <p className="text-blue-200 text-[10px] font-black uppercase tracking-widest mb-3">Total Evaluaciones</p>
          <h2 className="text-4xl font-black tracking-tight">{history.length}</h2>
          <p className="mt-2 text-white/40 text-[10px] font-bold uppercase">Registros en el periodo</p>
        </div>

        <div className="bg-white p-6 rounded-[28px] border border-slate-200/60 shadow-sm relative overflow-hidden group">
          <ArrowUpRight className="absolute -right-4 -bottom-4 text-slate-50 w-24 h-24 rotate-12 transition-transform group-hover:scale-110" />
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-3">Promedio Global</p>
          <h2 className="text-4xl font-black text-[#004C6C] tracking-tight">
            {history.length > 0 ? (history.reduce((acc, curr) => acc + Number(curr.total_score || 0), 0) / history.length).toFixed(1) : '0.0'}%
          </h2>
          <p className="mt-2 text-slate-400 text-[10px] font-bold uppercase tracking-wide">Nivel de desempeño</p>
        </div>

        <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm flex flex-col justify-between group">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Tendencia por área</span>
              <TrendingUp size={14} className="text-green-500" />
            </div>
            <div className="flex items-end gap-1.5 h-12">
              {[40, 60, 45, 80, 55, 90, 75].map((h, i) => (
                <div
                  key={i}
                  className="flex-1 bg-slate-100 rounded-t-md transition-all duration-500 group-hover:bg-[#004C6C]/10"
                  style={{ height: `${h}%` }}
                ></div>
              ))}
            </div>
            <div className="flex items-center justify-between text-[10px] font-extrabold text-slate-300 uppercase tracking-tighter">
              <span>Ene</span>
              <span>Jul</span>
            </div>
          </div>
        </div>
      </div>

      {/* History List */}
      <div className="bg-white rounded-[40px] shadow-[0_20px_50px_rgba(0,44,80,0.02)] border border-slate-100 overflow-hidden">
        <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/30">
          <h3 className="font-black text-slate-800 tracking-tight flex items-center gap-2">
            <Layout size={20} className="text-[#004C6C]" />
            Listado Detallado
          </h3>
          <span className="text-xs font-medium text-slate-400 italic">Haz clic en una evaluación para verificar los detalles</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-50 uppercase text-[10px] font-black text-slate-400 tracking-[0.2em]">
                <th className="px-8 py-5">Colaborador</th>
                <th className="px-8 py-5">Área</th>
                <th className="px-8 py-5">Periodo</th>
                <th className="px-8 py-5">Calificación</th>
                <th className="px-8 py-5">Estado</th>
                <th className="px-8 py-5 text-right w-20">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {isLoading ? (
                [1, 2, 3, 4, 5].map(i => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-8 py-6"><Skeleton className="h-10 w-48 rounded-xl" /></td>
                    <td className="px-8 py-6"><Skeleton className="h-6 w-32 rounded-lg" /></td>
                    <td className="px-8 py-6"><Skeleton className="h-6 w-24 rounded-lg" /></td>
                    <td className="px-8 py-6"><Skeleton className="h-8 w-16 rounded-lg" /></td>
                    <td className="px-8 py-6"><Skeleton className="h-6 w-24 rounded-lg" /></td>
                    <td className="px-8 py-6 text-right"><Skeleton className="h-10 w-10 rounded-xl" /></td>
                  </tr>
                ))
              ) : history.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-8 py-20 text-center space-y-4">
                    <div className="p-6 bg-slate-50 rounded-[40px] inline-block mb-4">
                      <Search size={40} className="text-slate-200" />
                    </div>
                    <p className="text-xl font-bold text-slate-500">No se encontraron registros</p>
                    <p className="text-sm text-slate-400 max-w-xs mx-auto">Ajusta los filtros para encontrar las evaluaciones que buscas.</p>
                  </td>
                </tr>
              ) : (
                history.map((evalu) => (
                  <tr
                    key={evalu.id}
                    onClick={() => {
                      setSelectedEval(evalu);
                      setIsModalOpen(true);
                    }}
                    className="hover:bg-slate-50/50 group transition-all cursor-pointer"
                  >
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-2xl bg-linear-to-br from-slate-100 to-white border border-slate-100 flex items-center justify-center text-[#004C6C] font-black text-sm uppercase">
                          {evalu.results?.[0]?.kpi_name?.charAt(0) || 'E'}
                        </div>
                        <div>
                          <p className="font-extrabold text-slate-800 tracking-tight leading-none mb-1">{users.find(u => u.id === evalu.user_id)?.name || 'Desconocido'}</p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic opacity-0 group-hover:opacity-100 transition-opacity">Ver perfil de persona</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-sm font-semibold text-slate-500 italic">
                      {(() => {
                        const user = users.find(u => u.id === evalu.user_id);
                        return typeof user?.area === 'object' ? user?.area?.name : (user?.area || '---');
                      })()}
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-2 text-sm font-bold text-slate-700">
                        <Calendar size={14} className="text-slate-300" />
                        {meses.find(m => m.value === evalu.month)?.label} {evalu.year}
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className={`inline-flex items-center justify-center px-4 py-1.5 rounded-2xl border font-black text-sm ${getScoreColor(Number(evalu.total_score || 0))}`}>
                        {Number(evalu.total_score || 0).toFixed(1)}%
                      </div>
                    </td>
                    <td className="px-8 py-6 whitespace-nowrap">
                      {getStatusBadge(evalu.status)}
                    </td>
                    <td className="px-8 py-6 text-right">
                      <div className="flex justify-end gap-2">
                        {(evalu.history?.length || 0) > 0 && (
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedEvalForHistory(evalu);
                              setIsHistoryModalOpen(true);
                            }}
                            className="h-10 w-10 flex items-center justify-center bg-orange-50 border border-orange-100 rounded-xl text-[#EE9D4C] hover:bg-[#EE9D4C] hover:text-white transition-all transform hover:scale-105 active:scale-95 shadow-sm"
                            title="Ver historial de cambios"
                          >
                            <History size={16} />
                          </button>
                        )}
                        {evalu.status === 'finalizada' && (
                          <button 
                            onClick={(e) => evalu.id && handleExport(e, evalu.id)}
                            disabled={isExportingId === evalu.id}
                            className="h-10 w-10 flex items-center justify-center bg-green-50 border border-green-100 rounded-xl text-green-600 hover:bg-green-500 hover:text-white transition-all transform hover:scale-105 active:scale-95 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Generar Reporte PDF"
                          >
                            {isExportingId === evalu.id ? (
                              <Loader2 size={18} className="animate-spin" />
                            ) : (
                              <FileText size={18} />
                            )}
                          </button>
                        )}
                        <button className="h-10 w-10 flex items-center justify-center bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-[#EE9D4C] hover:border-[#EE9D4C] hover:bg-orange-50 group-hover:shadow-lg transition-all transform group-hover:scale-105 active:scale-95">
                          <ArrowUpRight size={18} />
                        </button>
                      </div>
                    </td>

                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <EvaluationViewModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        evaluation={selectedEval}
      />

      <Modal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        title="Historial de Auditoría"
      >
        <div className="p-8 space-y-8">
          <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
            <div className="h-12 w-12 bg-[#004C6C] rounded-xl flex items-center justify-center text-white">
              <History size={24} />
            </div>
            <div>
              <h4 className="text-sm font-black text-[#004C6C] uppercase tracking-tight">Registro de Revisiones</h4>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Se muestran los estados anteriores de esta evaluación</p>
            </div>
          </div>

          <div className="space-y-6 relative before:absolute before:left-[17px] before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100">
            {[...(selectedEvalForHistory?.history || [])].reverse().map((rev, idx) => (
              <div key={idx} className="relative pl-12 group">
                <div className="absolute left-0 top-1.5 h-9 w-9 rounded-full bg-white border-4 border-slate-50 shadow-sm flex items-center justify-center z-10 group-hover:border-[#EE9D4C] transition-colors">
                  <div className="h-2 w-2 rounded-full bg-slate-300 group-hover:bg-[#EE9D4C]" />
                </div>
                
                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm group-hover:border-[#004C6C]/10 group-hover:shadow-md transition-all">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">
                      {new Date(rev.updated_at).toLocaleString('es-ES', { 
                        day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' 
                      })}
                    </span>
                    <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${getScoreColor(rev.total_score)}`}>
                      {Number(rev.total_score).toFixed(1)}%
                    </span>
                  </div>
                  
                  <div className="space-y-2">
                    <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Análisis en esta versión:</p>
                    <p className="text-xs text-slate-600 italic leading-relaxed bg-slate-50/50 p-3 rounded-xl border border-slate-50">
                      "{rev.general_analysis || 'Sin análisis cualitativo registrado.'}"
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-6 border-t border-slate-100 flex justify-center">
            <button
              onClick={() => setIsHistoryModalOpen(false)}
              className="px-8 py-3 bg-slate-100 text-slate-500 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition-all"
            >
              Cerrar Historial
            </button>
          </div>
        </div>
      </Modal>
    </div>

  );
}
