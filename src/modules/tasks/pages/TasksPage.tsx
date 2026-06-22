import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  PlusCircle,
  RotateCcw,
  BarChart3,
  CheckCircle2,
  AlertTriangle,
  PlayCircle,
  Clock,
  Search,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useTasks } from '../hooks/useTasks';
import { TaskTable } from '../components/TaskTable';
import { TaskModal } from '../components/TaskModal';
import { DailyObservationsModal } from '../components/DailyObservationsModal';
import { AuditLogModal } from '../components/AuditLogModal';
import { useAuth } from '../../../context/AuthContext';
import type { Task, TaskStatus } from '../types';
import { CustomSelect } from '../../../components/ui/CustomSelect';
import { Pagination } from '../../../components/ui/Pagination';

export default function TasksPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Verificamos el permiso de edición. Si el backend simula el permiso basado en cargo/email,
  // el objeto user del token ya contendrá 'bitacora.editar' de forma limpia y transparente.
  const isEditor = user?.permissions?.includes('bitacora.editar') || false;

  const {
    tasks,
    users,
    areas,
    loading,
    error,
    filters,
    currentPage,
    perPage,
    totalItems,
    totalPages,
    stats,
    setCurrentPage,
    setPerPage,
    setFilter,
    applyFilters,
    clearFilters,
    createTask,
    updateTask,
    deleteTask,
    addObservation,
    getTaskDetails
  } = useTasks();

  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isObsModalOpen, setIsObsModalOpen] = useState(false);
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);

  // Control colapsable del Panel Izquierdo (Sidebar de Filtros)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Determinamos el filtro de tarjeta activo basándonos en los filtros reales del hook
  const activeCardFilter = 
    filters.priority === 'P0' ? 'critical' :
    filters.status === 'Por hacer' ? 'todo' :
    filters.status === 'En progreso' ? 'in_progress' :
    filters.status === 'Completada' ? 'completed' : 'all';

  const handleCardClick = (card: 'all' | 'todo' | 'in_progress' | 'completed' | 'critical') => {
    if (card === 'all') {
      applyFilters({ status: '', priority: '' });
    } else if (card === 'todo') {
      applyFilters({ status: 'Por hacer', priority: '' });
    } else if (card === 'in_progress') {
      applyFilters({ status: 'En progreso', priority: '' });
    } else if (card === 'completed') {
      applyFilters({ status: 'Completada', priority: '' });
    } else if (card === 'critical') {
      applyFilters({ status: '', priority: 'P0' });
    }
  };

  const handleOpenObservations = async (task: Task) => {
    setSelectedTask(task);
    setIsObsModalOpen(true);
    setIsLoadingDetails(true);
    try {
      const freshTask = await getTaskDetails(task.id);
      setSelectedTask(freshTask);
    } catch {
      alert('Error al cargar comentarios recientes de la tarea.');
    } finally {
      setIsLoadingDetails(false);
    }
  };

  const handleOpenAuditLogs = async (task: Task) => {
    setSelectedTask(task);
    setIsAuditModalOpen(true);
    setIsLoadingDetails(true);
    try {
      const freshTask = await getTaskDetails(task.id);
      setSelectedTask(freshTask);
    } catch {
      alert('Error al cargar el historial de auditoría.');
    } finally {
      setIsLoadingDetails(false);
    }
  };

  const handleEditTask = async (task: Task) => {
    setSelectedTask(task);
    setIsTaskModalOpen(true);
    setIsLoadingDetails(true);
    try {
      const freshTask = await getTaskDetails(task.id);
      setSelectedTask(freshTask);
    } catch {
      alert('Error al cargar la tarea para edición.');
    } finally {
      setIsLoadingDetails(false);
    }
  };

  const handleAddNewTaskClick = () => {
    setSelectedTask(null);
    setIsTaskModalOpen(true);
  };

  const handleSaveTask = async (data: Partial<Task>) => {
    if (selectedTask) {
      await updateTask(selectedTask.id, data);
    } else {
      await createTask(data);
    }
  };

  const handleDeleteTask = async (id: number) => {
    if (window.confirm('¿Estás 100% seguro de que deseas eliminar este compromiso de la bitácora? Esta acción se registrará y borrará de forma física todos los logs históricos.')) {
      try {
        await deleteTask(id);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Error al eliminar la tarea.';
        alert(msg);
      }
    }
  };

  // Callback para cambiar el estado de manera rápida y directa en la tabla
  const handleUpdateTaskStatus = async (taskId: number, newStatus: TaskStatus) => {
    try {
      await updateTask(taskId, { status: newStatus });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al actualizar el estado de la tarea.';
      alert(msg);
    }
  };

  // Usamos las estadísticas reales calculadas en el backend
  const totalTasks = stats.total;
  const todoTasks = stats.todo;
  const inProgressTasks = stats.in_progress;
  const completedTasks = stats.completed;
  const criticalTasks = stats.critical;

  const filteredTasks = tasks;

  return (
    <div className="max-w-[1600px] mx-auto flex flex-col lg:flex-row min-h-[calc(100vh-140px)] gap-6 md:gap-8 py-4 md:py-8 px-4 relative">

      {/* Botón para abrir filtros colapsados - Flota globalmente sobre la barra ELITE */}
      {isSidebarCollapsed && (
        <button
          onClick={() => setIsSidebarCollapsed(false)}
          className="fixed left-0 top-1/2 -translate-y-1/2 z-50 h-32 w-10 bg-[#004C6C] text-white rounded-r-3xl flex items-center justify-center shadow-[4px_0_24px_rgba(0,76,108,0.3)] hover:w-12 transition-all group overflow-hidden border-y border-r border-blue-400/20 cursor-pointer"
          title="Mostrar Filtros de Bitácora"
        >
          <div className="rotate-180 [writing-mode:vertical-lr] flex items-center justify-center gap-3 whitespace-nowrap">
            <span className="text-[11px] font-black uppercase tracking-[0.2em] leading-none">Filtros</span>
            <ChevronRight size={16} className="-rotate-90 text-blue-200 group-hover:text-white transition-colors" />
          </div>
        </button>
      )}

      {/* Columna Izquierda: Directorio de Filtros y Resumen Dinámico */}
      <div className={`transition-all duration-500 ease-in-out flex flex-col bg-white rounded-[40px] shadow-[0_8px_40px_rgb(0,0,0,0.03)] border border-slate-100 overflow-hidden shrink-0 relative animate-fade-in ${isSidebarCollapsed ? 'w-0 lg:w-0 opacity-0 -ml-8 overflow-hidden' : 'w-full lg:w-80'
        }`}>

        {/* Cabecera Sidebar */}
        <div className="p-6 border-b border-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-slate-50 rounded-xl text-[#004C6C]">
              <SlidersHorizontal size={20} />
            </div>
            <div>
              <h2 className="text-md font-black text-[#004C6C] tracking-tight">Filtros de Bitácora</h2>
              <p className="text-[9px] uppercase font-black text-slate-300 tracking-[0.15em]">Control y Búsqueda</p>
            </div>
          </div>

          <button
            onClick={() => setIsSidebarCollapsed(true)}
            className="p-2 hover:bg-slate-50 rounded-xl text-slate-300 hover:text-slate-500 transition-colors cursor-pointer"
          >
            <ChevronLeft size={20} />
          </button>
        </div>

        {/* Cuerpo Sidebar (Selectores e Inputs) */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">

          {/* Búsqueda por Texto */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Buscar Compromiso</label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300">
                <Search size={16} />
              </div>
              <input
                type="text"
                placeholder="Escribe palabra clave..."
                value={filters.search}
                onChange={e => setFilter('search', e.target.value)}
                className="w-full bg-slate-50/50 border border-slate-100 rounded-2xl pl-11 pr-4 py-3.5 text-xs font-bold text-slate-700 focus:bg-white focus:border-[#004C6C] outline-none transition-all"
              />
            </div>
          </div>

          {/* Área */}
          <div>
            <CustomSelect
              label="Área Responsable"
              placeholder="Todas las áreas"
              options={areas.map(a => ({ value: a.id.toString(), label: a.name }))}
              value={filters.area_id}
              onChange={val => setFilter('area_id', val)}
            />
          </div>

          {/* Responsable */}
          <div>
            <CustomSelect
              label="Responsable Asignado"
              placeholder="Todos los responsables"
              options={users.map(u => ({ value: u.id.toString(), label: u.name }))}
              value={filters.responsible_id}
              onChange={val => setFilter('responsible_id', val)}
            />
          </div>

          <div className="pt-2">
            <button
              onClick={() => {
                clearFilters();
              }}
              className="w-full flex items-center justify-center gap-2 px-5 py-3.5 bg-slate-50 text-slate-500 rounded-xl font-bold text-xs hover:bg-slate-100 hover:text-slate-700 transition-all border border-slate-100 shadow-xs cursor-pointer"
            >
              <RotateCcw size={14} />
              Limpiar Filtros
            </button>
          </div>


        </div>

      </div>

      {/* Columna Derecha: Contenido Principal de Bitácora */}
      <div className="flex-1 min-w-0 bg-white rounded-[40px] shadow-[0_8px_40px_rgb(0,0,0,0.03)] border border-slate-100 p-8 space-y-8 flex flex-col relative z-10 animate-fade-in">

        {/* HEADER PRINCIPAL */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-3xl font-black text-[#004C6C] tracking-tight">Bitácora de Tareas</h1>
            <p className="text-slate-400 font-bold uppercase tracking-[0.2em] text-[10px]">
              Planificación y compromisos operativos en tiempo real
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              onClick={() => navigate('/app/task/dashboard')}
              className="flex items-center justify-center gap-2 px-5 py-3.5 bg-slate-50 border border-slate-200 text-slate-600 hover:text-[#004C6C] hover:border-[#004C6C]/30 rounded-[20px] font-black text-xs uppercase tracking-widest transition-all hover:scale-[1.02] active:scale-95 cursor-pointer"
            >
              <BarChart3 size={16} className="text-[#004C6C]" />
              Ver Dashboard
            </button>
            <button
              onClick={handleAddNewTaskClick}
              className="flex items-center justify-center gap-3 px-6 py-3.5 bg-[#004C6C] text-white rounded-[20px] font-black text-xs uppercase tracking-widest hover:bg-[#003a53] shadow-lg shadow-blue-900/10 transition-all hover:scale-[1.02] active:scale-95 group shrink-0 cursor-pointer"
            >
              <PlusCircle size={18} className="transition-transform group-hover:rotate-90 duration-300" />
              Nueva Tarea
            </button>
          </div>
        </div>

        {/* METRICAS DE BITÁCORA - 5 clickable cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">

          {/* 1. Tareas Totales */}
          <div
            onClick={() => handleCardClick('all')}
            className={`bg-white rounded-[24px] p-5 flex items-center justify-between border shadow-xs relative overflow-hidden group hover:scale-[1.02] transition-all cursor-pointer ${activeCardFilter === 'all'
              ? 'border-[#004C6C] ring-2 ring-[#004C6C]/10 bg-blue-50/5'
              : 'border-slate-100 hover:border-[#004C6C]/30'
              }`}
          >
            <div className="absolute -right-6 -bottom-6 w-20 h-20 bg-blue-50 rounded-full blur-2xl group-hover:bg-blue-100/50 transition-all" />
            <div className="relative z-10">
              <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.15em] mb-1">Totales</p>
              {loading ? (
                <div className="h-8 w-12 bg-slate-100 rounded-lg animate-pulse my-0.5" />
              ) : (
                <p className="text-2xl font-black text-[#004C6C] tracking-tight">{totalTasks}</p>
              )}
            </div>
            <div className={`h-10 w-10 rounded-[12px] flex items-center justify-center transition-all ${activeCardFilter === 'all' ? 'bg-[#004C6C] text-white' : 'bg-blue-50 text-[#004C6C] group-hover:rotate-6'
              }`}>
              <BarChart3 size={18} />
            </div>
          </div>

          {/* 2. Por Hacer */}
          <div
            onClick={() => handleCardClick('todo')}
            className={`bg-white rounded-[24px] p-5 flex items-center justify-between border shadow-xs relative overflow-hidden group hover:scale-[1.02] transition-all cursor-pointer ${activeCardFilter === 'todo'
              ? 'border-[#EE9D4C] ring-2 ring-[#EE9D4C]/10 bg-orange-50/5'
              : 'border-slate-100 hover:border-[#EE9D4C]/30'
              }`}
          >
            <div className="absolute -right-6 -bottom-6 w-20 h-20 bg-orange-50 rounded-full blur-2xl group-hover:bg-orange-100/50 transition-all" />
            <div className="relative z-10">
              <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.15em] mb-1">Por Hacer</p>
              {loading ? (
                <div className="h-8 w-12 bg-slate-100 rounded-lg animate-pulse my-0.5" />
              ) : (
                <p className="text-2xl font-black text-[#EE9D4C] tracking-tight">{todoTasks}</p>
              )}
            </div>
            <div className={`h-10 w-10 rounded-[12px] flex items-center justify-center transition-all ${activeCardFilter === 'todo' ? 'bg-[#EE9D4C] text-white' : 'bg-orange-50 text-[#EE9D4C] group-hover:rotate-6'
              }`}>
              <Clock size={18} />
            </div>
          </div>

          {/* 3. En Progreso */}
          <div
            onClick={() => handleCardClick('in_progress')}
            className={`bg-white rounded-[24px] p-5 flex items-center justify-between border shadow-xs relative overflow-hidden group hover:scale-[1.02] transition-all cursor-pointer ${activeCardFilter === 'in_progress'
              ? 'border-sky-500 ring-2 ring-sky-500/10 bg-sky-50/5'
              : 'border-slate-100 hover:border-sky-500/30'
              }`}
          >
            <div className="absolute -right-6 -bottom-6 w-20 h-20 bg-sky-50 rounded-full blur-2xl group-hover:bg-sky-100/50 transition-all" />
            <div className="relative z-10">
              <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.15em] mb-1">En Progreso</p>
              {loading ? (
                <div className="h-8 w-12 bg-slate-100 rounded-lg animate-pulse my-0.5" />
              ) : (
                <p className="text-2xl font-black text-sky-500 tracking-tight">{inProgressTasks}</p>
              )}
            </div>
            <div className={`h-10 w-10 rounded-[12px] flex items-center justify-center transition-all ${activeCardFilter === 'in_progress' ? 'bg-sky-500 text-white' : 'bg-sky-50 text-sky-500 group-hover:rotate-6'
              }`}>
              <PlayCircle size={18} />
            </div>
          </div>

          {/* 4. Completas */}
          <div
            onClick={() => handleCardClick('completed')}
            className={`bg-white rounded-[24px] p-5 flex items-center justify-between border shadow-xs relative overflow-hidden group hover:scale-[1.02] transition-all cursor-pointer ${activeCardFilter === 'completed'
              ? 'border-emerald-500 ring-2 ring-emerald-500/10 bg-emerald-50/5'
              : 'border-slate-100 hover:border-emerald-500/30'
              }`}
          >
            <div className="absolute -right-6 -bottom-6 w-20 h-20 bg-emerald-50 rounded-full blur-2xl group-hover:bg-emerald-100/50 transition-all" />
            <div className="relative z-10">
              <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.15em] mb-1">Completas</p>
              {loading ? (
                <div className="h-8 w-12 bg-slate-100 rounded-lg animate-pulse my-0.5" />
              ) : (
                <p className="text-2xl font-black text-emerald-600 tracking-tight">{completedTasks}</p>
              )}
            </div>
            <div className={`h-10 w-10 rounded-[12px] flex items-center justify-center transition-all ${activeCardFilter === 'completed' ? 'bg-emerald-500 text-white' : 'bg-emerald-50 text-emerald-600 group-hover:rotate-6'
              }`}>
              <CheckCircle2 size={18} />
            </div>
          </div>

          {/* 5. Críticas */}
          <div
            onClick={() => handleCardClick('critical')}
            className={`bg-white rounded-[24px] p-5 flex items-center justify-between border shadow-xs relative overflow-hidden group hover:scale-[1.02] transition-all cursor-pointer ${activeCardFilter === 'critical'
              ? 'border-rose-500 ring-2 ring-rose-500/10 bg-rose-50/5'
              : 'border-slate-100 hover:border-rose-500/30'
              }`}
          >
            <div className="absolute -right-6 -bottom-6 w-20 h-20 bg-rose-50 rounded-full blur-2xl group-hover:bg-rose-100/50 transition-all" />
            <div className="relative z-10">
              <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.15em] mb-1">Críticas</p>
              {loading ? (
                <div className="h-8 w-12 bg-slate-100 rounded-lg animate-pulse my-0.5" />
              ) : (
                <p className="text-2xl font-black text-rose-600 tracking-tight">{criticalTasks}</p>
              )}
            </div>
            <div className={`h-10 w-10 rounded-[12px] flex items-center justify-center transition-all ${activeCardFilter === 'critical' ? 'bg-rose-500 text-white' : 'bg-rose-50 text-rose-600 group-hover:rotate-6'
              }`}>
              <AlertTriangle size={18} />
            </div>
          </div>

        </div>



        {/* ERROR FEEDBACK */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-100 rounded-2xl text-xs font-bold text-red-600 text-center">
            {error}
          </div>
        )}

        {/* TABLA PRINCIPAL DE BITÁCORA */}
        <div className="flex-1 overflow-x-auto">
          <TaskTable
            tasks={filteredTasks}
            isLoading={loading}
            isEditor={isEditor}
            onEditTask={handleEditTask}
            onOpenObservations={handleOpenObservations}
            onOpenAuditLogs={handleOpenAuditLogs}
            onDeleteTask={handleDeleteTask}
            onUpdateTaskStatus={handleUpdateTaskStatus}
          />
        </div>

        {/* PAGINACIÓN */}
        {totalItems > 0 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            totalItems={totalItems}
            perPage={perPage}
            onPerPageChange={setPerPage}
          />
        )}

        {/* FEEDBACK DEL FILTRO ACTIVO - Ubicado elegantemente al final de la grilla */}
        <div className="flex justify-between items-center px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl animate-fade-in">
          <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">
            Visualizando <strong className="text-[#004C6C] font-black">{filteredTasks.length}</strong> de <strong className="text-slate-700 font-black">{totalTasks}</strong> compromisos en bitácora
            {activeCardFilter !== 'all' && (
              <span> (Segmentado por: <strong className="text-[#004C6C] font-black">{
                activeCardFilter === 'todo' ? 'Por Hacer' :
                  activeCardFilter === 'in_progress' ? 'En Progreso' :
                    activeCardFilter === 'completed' ? 'Completadas' :
                      'Críticas P0'
              }</strong>)</span>
            )}
          </span>

          {activeCardFilter !== 'all' && (
            <button
              onClick={() => handleCardClick('all')}
              className="flex items-center gap-1.5 text-[9px] font-black text-[#004C6C] uppercase tracking-widest hover:underline cursor-pointer transition-all animate-fade-in"
            >
              <RotateCcw size={10} />
              Quitar Segmentación
            </button>
          )}
        </div>

      </div>

      {/* MODALES DE SOPORTE */}
 
      {/* 1. Modal Creación / Edición */}
      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        onSave={handleSaveTask}
        task={selectedTask}
        users={users}
        areas={areas}
        isEditor={isEditor}
        isLoading={isLoadingDetails}
      />
 
      {/* 2. Modal Notas Daily Standup */}
      <DailyObservationsModal
        isOpen={isObsModalOpen}
        onClose={() => setIsObsModalOpen(false)}
        task={selectedTask}
        onAddObservation={addObservation}
        isLoading={isLoadingDetails}
      />
 
      {/* 3. Modal Historial Auditoría */}
      <AuditLogModal
        isOpen={isAuditModalOpen}
        onClose={() => setIsAuditModalOpen(false)}
        task={selectedTask}
        isLoading={isLoadingDetails}
      />

    </div>
  );
}
