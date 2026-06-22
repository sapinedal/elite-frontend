import React from 'react';
import { X, History, Calendar, ArrowRight, CornerDownRight } from 'lucide-react';
import type { Task } from '../types';
import { Portal } from '../../../components/ui/Portal';

interface AuditLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: Task | null;
  isLoading?: boolean;
}

// Mapa para traducir las claves internas a términos amigables en español
const fieldNameMap: Record<string, string> = {
  title: 'Descripción de la Tarea',
  priority: 'Prioridad',
  status: 'Estado',
  responsible_id: 'Responsable',
  area_id: 'Área Asignada',
  start_date: 'Fecha de Inicio',
  scheduled_end_date: 'Fecha de Finalización Programada',
  actual_end_date: 'Fecha de Finalización Real'
};

export const AuditLogModal: React.FC<AuditLogModalProps> = ({ isOpen, onClose, task, isLoading }) => {
  if (!task) return null;

  const logs = task.audit_logs || [];

  return (
    <Portal isOpen={isOpen}>
      <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
        <div className="bg-[#f8fafc] w-full max-w-xl rounded-[40px] shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-scale-in">

          {/* Header */}
          <div className="bg-white p-8 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 bg-blue-50 text-[#004C6C] rounded-2xl flex items-center justify-center">
                <History size={24} />
              </div>
              <div>
                <h2 className="text-xl font-black text-[#004C6C] tracking-tight">
                  Historial de Auditoría
                </h2>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                  Trazabilidad de cambios
                </p>
              </div>
            </div>
            <button onClick={onClose} className="p-3 text-slate-300 hover:bg-slate-50 rounded-2xl transition-all">
              <X size={24} />
            </button>
          </div>

          {/* Banner */}
          <div className="bg-blue-50/40 px-8 py-4 border-b border-slate-100">
            <span className="text-[9px] font-black text-[#004C6C] uppercase tracking-widest block mb-1">
              Registro Auditado
            </span>
            <p className="text-xs font-bold text-slate-600 truncate">{task.title}</p>
          </div>

          {/* Timeline de Auditorías */}
          <div className="flex-1 p-8 space-y-6 overflow-y-auto min-h-[300px]">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center h-full py-10 text-center space-y-4">
                <div className="h-10 w-10 border-4 border-slate-200 border-t-[#004C6C] rounded-full animate-spin"></div>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Cargando historial...</p>
              </div>
            ) : logs.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full py-10 text-center space-y-3">
                <div className="h-16 w-16 rounded-full bg-slate-100 flex items-center justify-center text-slate-300">
                  <History size={28} />
                </div>
                <p className="text-xs text-slate-400 font-bold max-w-[200px]">
                  No se registran auditorías para esta tarea.
                </p>
              </div>
            ) : (
              <div className="relative border-l border-slate-200 ml-4 pl-6 space-y-8">
                {logs.map((log) => {
                  const authorName = log.user?.name || 'Administrador';
                  const logDate = new Date(log.created_at).toLocaleString('es-ES', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  });

                  return (
                    <div key={log.id} className="relative group">

                      {/* Timeline point indicator */}
                      <span className="absolute -left-[31px] top-1 h-4.5 w-4.5 rounded-full border-4 border-[#f8fafc] bg-[#004C6C] group-hover:scale-125 transition-transform" />

                      <div className="space-y-3">
                        {/* Autor y fecha */}
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black text-slate-700">
                            {authorName}
                          </span>
                          <span className="text-[10px] text-slate-400 font-bold flex items-center gap-1">
                            <Calendar size={11} />
                            {logDate}
                          </span>
                        </div>

                        {/* Detalle de cambios */}
                        <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm space-y-2">
                          <p className="text-[10px] font-black uppercase tracking-wider text-[#004C6C]">
                            Acción: {log.action === 'created' ? 'Creación de Tarea' : 'Modificación de Tarea'}
                          </p>

                          {log.changes && Object.keys(log.changes).length > 0 && (
                            <div className="space-y-2 pt-2 border-t border-slate-50">
                              {Object.entries(log.changes).map(([field, delta]) => {
                                const friendlyName = fieldNameMap[field] || field;
                                const oldValue = delta.old === null || delta.old === '' ? 'Vacío' : String(delta.old);
                                const newValue = delta.new === null || delta.new === '' ? 'Vacío' : String(delta.new);

                                return (
                                  <div key={field} className="text-xs font-bold text-slate-500 space-y-1">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                                      <CornerDownRight size={10} className="text-[#004C6C]/40" />
                                      {friendlyName}
                                    </span>
                                    <div className="flex items-center gap-2 pl-4 flex-wrap">
                                      <span className="px-2 py-0.5 rounded bg-red-50 text-red-600 border border-red-100 text-[10px]">
                                        {oldValue}
                                      </span>
                                      <ArrowRight size={12} className="text-slate-300" />
                                      <span className="px-2 py-0.5 rounded bg-green-50 text-green-700 border border-green-100 text-[10px]">
                                        {newValue}
                                      </span>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-8 bg-white border-t border-slate-100 flex justify-end">
            <button
              onClick={onClose}
              className="px-8 py-4 bg-slate-100 text-slate-500 rounded-2xl font-bold hover:bg-slate-200 transition-all text-xs uppercase tracking-widest"
            >
              Cerrar Historial
            </button>
          </div>

        </div>
      </div>
    </Portal>
  );
};
