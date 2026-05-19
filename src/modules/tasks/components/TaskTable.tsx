import React from 'react';
import { MessageSquare, History, Trash2, Calendar } from 'lucide-react';
import type { Task, TaskPriority, TaskStatus } from '../types';
import { DataTable } from '../../../components/ui/DataTable';
import { CustomSelect } from '../../../components/ui/CustomSelect';

interface TaskTableProps {
  tasks: Task[];
  isLoading: boolean;
  isEditor: boolean;
  onEditTask: (task: Task) => void;
  onOpenObservations: (task: Task) => void;
  onOpenAuditLogs: (task: Task) => void;
  onDeleteTask: (id: number) => void;
  onUpdateTaskStatus: (id: number, status: TaskStatus) => void;
}

// Estilos premium de insignias HSL para Prioridad
const priorityStyles: Record<TaskPriority, string> = {
  P0: 'bg-rose-50 text-rose-600 border border-rose-100', // Crítica
  P1: 'bg-orange-50 text-orange-600 border border-orange-100', // Alta
  P2: 'bg-amber-50 text-amber-600 border border-amber-100', // Media
  P3: 'bg-slate-50 text-slate-500 border border-slate-100' // Baja
};

// Nombres descriptivos para la Prioridad
const priorityNames: Record<TaskPriority, string> = {
  P0: 'P0 - Crítica',
  P1: 'P1 - Alta',
  P2: 'P2 - Media',
  P3: 'P3 - Baja'
};

// Estilos premium de insignias HSL para Estado
const statusStyles: Record<TaskStatus, string> = {
  'Por hacer': 'bg-slate-100 text-slate-600 border border-slate-200',
  'En espera': 'bg-yellow-50 text-yellow-700 border border-yellow-100',
  'En progreso': 'bg-blue-50 text-blue-700 border border-blue-100',
  'Completada': 'bg-emerald-50 text-emerald-700 border border-emerald-100'
};

export const TaskTable: React.FC<TaskTableProps> = ({
  tasks,
  isLoading,
  isEditor,
  onEditTask,
  onOpenObservations,
  onOpenAuditLogs,
  onDeleteTask,
  onUpdateTaskStatus
}) => {

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return <span className="text-slate-300 font-normal">--/--/----</span>;
    // Remueve posible parte horaria para formatear solo fecha
    const baseDate = dateStr.split('T')[0];
    const [year, month, day] = baseDate.split('-');
    return `${day}/${month}/${year}`;
  };

  const columns = [
    {
      header: 'Tarea / Compromiso',
      accessor: (task: Task) => (
        <div className="flex flex-col gap-1 max-w-[280px]">
          <span className="text-slate-800 font-black tracking-tight line-clamp-2 leading-relaxed">
            {task.title}
          </span>
          <span className="text-[9px] text-[#004C6C] font-black uppercase tracking-wider">
            Área: {task.area?.name || 'Global'}
          </span>
        </div>
      )
    },
    {
      header: 'Prioridad',
      accessor: (task: Task) => (
        <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest leading-none ${priorityStyles[task.priority]}`}>
          {priorityNames[task.priority]}
        </span>
      )
    },
    {
      header: 'Estado',
      accessor: (task: Task) => {
        const handleStatusChange = (val: TaskStatus) => {
          onUpdateTaskStatus(task.id, val);
        };

        return (
          <div onClick={(e) => e.stopPropagation()} className="w-[145px]">
            <CustomSelect
              value={task.status}
              onChange={handleStatusChange}
              options={[
                { value: 'Por hacer', label: 'Por hacer' },
                { value: 'En espera', label: 'En espera' },
                { value: 'En progreso', label: 'En progreso' },
                { value: 'Completada', label: 'Completada' }
              ]}
              className={`w-full pl-3.5 pr-8 py-2 rounded-full text-[10px] font-black uppercase tracking-widest text-left flex items-center justify-between border transition-all cursor-pointer outline-none focus:ring-4 focus:ring-blue-500/10 ${statusStyles[task.status]}`}
            />
          </div>
        );
      }
    },
    {
      header: 'Asignación',
      accessor: (task: Task) => (
        <div className="flex flex-col gap-1">
          <span className="text-xs text-slate-600 font-bold flex items-center gap-1.5">
            <span className="h-5 w-5 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center text-[9px] font-black text-slate-400">
              R
            </span>
            {task.responsible?.name || <span className="text-slate-300 font-normal">Sin asignar</span>}
          </span>
          <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest flex items-center gap-1.5 pl-6">
            Por: {task.requested_by?.name || 'Sistema'}
          </span>
        </div>
      )
    },
    {
      header: 'Cronograma',
      accessor: (task: Task) => (
        <div className="flex flex-col gap-1 text-[11px] text-slate-500 font-bold">
          <span className="flex items-center gap-1">
            <Calendar size={12} className="opacity-40" />
            Ini: {formatDate(task.start_date)}
          </span>
          <span className="flex items-center gap-1">
            <Calendar size={12} className="opacity-40" />
            Prog: {formatDate(task.scheduled_end_date)}
          </span>
          {task.status === 'Completada' && (
            <span className="flex items-center gap-1 text-emerald-600">
              <Calendar size={12} className="opacity-50" />
              Real: {formatDate(task.actual_end_date)}
            </span>
          )}
        </div>
      )
    },
    {
      header: 'Seguimiento',
      accessor: (task: Task) => {
        const obsCount = task.observations?.length || 0;
        return (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onOpenObservations(task);
            }}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-100 text-xs font-bold transition-all shadow-sm ${
              obsCount > 0 
                ? 'bg-orange-50 text-[#EE9D4C] border-orange-100 font-black' 
                : 'bg-white text-slate-400 hover:text-[#EE9D4C] hover:bg-orange-50/50'
            }`}
          >
            <MessageSquare size={14} />
            <span>{obsCount} {obsCount === 1 ? 'nota' : 'notas'}</span>
          </button>
        );
      }
    },
    {
      header: 'Acciones',
      accessor: (task: Task) => (
        <div className="flex items-center gap-1.5 justify-end" onClick={(e) => e.stopPropagation()}>
          {/* Historial de Auditorías */}
          <button
            onClick={() => onOpenAuditLogs(task)}
            title="Ver Historial de Auditoría"
            className="p-3 text-slate-300 hover:text-[#004C6C] hover:bg-blue-50 rounded-2xl transition-all"
          >
            <History size={16} />
          </button>

          {/* Eliminar tarea (solo visible para editores) */}
          {isEditor && (
            <button
              onClick={() => onDeleteTask(task.id)}
              title="Eliminar Tarea"
              className="p-3 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all"
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>
      ),
      className: 'text-right'
    }
  ];

  return (
    <DataTable
      columns={columns}
      data={tasks}
      isLoading={isLoading}
      onRowClick={onEditTask}
      emptyMessage="No hay tareas registradas en la bitácora para los filtros seleccionados."
    />
  );
};
