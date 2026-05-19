import React, { useState } from 'react';
import { X, Send, MessageSquare, Calendar } from 'lucide-react';
import type { Task } from '../types';
import { Portal } from '../../../components/ui/Portal';

interface DailyObservationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: Task | null;
  onAddObservation: (taskId: number, text: string) => Promise<any>;
}

export const DailyObservationsModal: React.FC<DailyObservationsModalProps> = ({
  isOpen,
  onClose,
  task,
  onAddObservation
}) => {
  const [newObs, setNewObs] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  if (!task) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newObs.trim()) return;

    setSubmitting(true);
    setLocalError(null);
    try {
      await onAddObservation(task.id, newObs.trim());
      setNewObs('');
    } catch (err: any) {
      setLocalError(err.message || 'Error al agregar la nota.');
    } finally {
      setSubmitting(false);
    }
  };

  const observations = task.observations || [];

  return (
    <Portal isOpen={isOpen}>
      <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
        <div className="bg-[#f8fafc] w-full max-w-lg rounded-[40px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-scale-in">

          {/* Header */}
          <div className="bg-white p-8 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 bg-orange-50 text-[#EE9D4C] rounded-2xl flex items-center justify-center">
                <MessageSquare size={24} />
              </div>
              <div>
                <h2 className="text-xl font-black text-[#004C6C] tracking-tight truncate max-w-[280px]">
                  Daily Standup Notes
                </h2>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                  Seguimiento de bitácora
                </p>
              </div>
            </div>
            <button onClick={onClose} className="p-3 text-slate-300 hover:bg-slate-50 rounded-2xl transition-all">
              <X size={24} />
            </button>
          </div>

          {/* Task Summary Banner */}
          <div className="bg-blue-50/50 px-8 py-4 border-b border-slate-100">
            <span className="text-[9px] font-black text-[#004C6C] uppercase tracking-widest block mb-1">
              Tarea Seleccionada
            </span>
            <p className="text-sm font-bold text-slate-800 line-clamp-2">{task.title}</p>
          </div>

          {/* Observations Timeline */}
          <div className="flex-1 p-8 space-y-6 overflow-y-auto min-h-[250px]">
            {observations.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full py-10 text-center space-y-3">
                <div className="h-16 w-16 rounded-full bg-slate-100 flex items-center justify-center text-slate-300">
                  <MessageSquare size={28} />
                </div>
                <p className="text-xs text-slate-400 font-bold max-w-[220px]">
                  No hay anotaciones aún. Registra la primera del daily standup abajo.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {observations.map((obs) => {
                  const authorName = obs.user?.name || 'Colaborador';
                  const dateStr = new Date(obs.created_at).toLocaleString('es-ES', {
                    day: '2-digit',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit'
                  });

                  return (
                    <div
                      key={obs.id}
                      className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm space-y-2 hover:border-slate-200 transition-all group"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="h-6 w-6 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 text-[10px] font-bold border border-slate-100">
                            {authorName.charAt(0)}
                          </div>
                          <span className="text-xs font-black text-slate-700 group-hover:text-[#004C6C] transition-colors">
                            {authorName}
                          </span>
                        </div>
                        <span className="text-[9px] font-bold text-slate-400 flex items-center gap-1">
                          <Calendar size={10} />
                          {dateStr}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed font-bold pl-8">
                        {obs.observation}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Form Input */}
          <form onSubmit={handleSubmit} className="p-8 bg-white border-t border-slate-100 space-y-3">
            {localError && (
              <p className="text-[11px] text-red-500 font-bold text-center">{localError}</p>
            )}
            <div className="flex items-center gap-3">
              <input
                required
                type="text"
                value={newObs}
                onChange={(e) => setNewObs(e.target.value)}
                disabled={submitting}
                placeholder="Escribe la observación del daily..."
                className="flex-1 bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-xs font-bold text-slate-700 focus:bg-white focus:border-[#004C6C] outline-none transition-all placeholder:text-slate-400"
              />
              <button
                type="submit"
                disabled={submitting || !newObs.trim()}
                className="h-12 w-12 bg-[#004C6C] text-white rounded-2xl flex items-center justify-center shadow-lg shadow-blue-900/10 hover:bg-[#003a53] transition-all disabled:opacity-30 group"
              >
                <Send size={18} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </button>
            </div>
          </form>

        </div>
      </div>
    </Portal>
  );
};
