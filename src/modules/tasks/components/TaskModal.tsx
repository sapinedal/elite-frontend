import React, { useState, useEffect } from 'react';
import { X, Save, ClipboardList, Type, Calendar, ShieldAlert } from 'lucide-react';
import type { Task, TaskPriority, TaskStatus } from '../types';
import type { User } from '../../users/types';
import type { Area } from '../../configuracion/services/configuracionService';
import { Portal } from '../../../components/ui/Portal';
import { CustomSelect } from '../../../components/ui/CustomSelect';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Partial<Task>) => Promise<any>;
  task: Task | null;
  users: User[];
  areas: Area[];
  isEditor: boolean; // Controla si tiene permiso 'bitacora.editar'
  isLoading?: boolean;
}

export const TaskModal: React.FC<TaskModalProps> = ({
  isOpen,
  onClose,
  onSave,
  task,
  users,
  areas,
  isEditor,
  isLoading
}) => {
  const [formData, setFormData] = useState({
    title: '',
    priority: 'P2' as TaskPriority,
    status: 'Por hacer' as TaskStatus,
    responsible_id: '',
    area_id: '',
    start_date: '',
    scheduled_end_date: '',
  });

  const [submitting, setSubmitting] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  // Cargamos los datos de la tarea al abrir el modal en modo edición
  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title,
        priority: task.priority,
        status: task.status,
        responsible_id: task.responsible_id?.toString() || '',
        area_id: task.area_id?.toString() || '',
        start_date: task.start_date ? String(task.start_date).split('T')[0] : '',
        scheduled_end_date: task.scheduled_end_date ? String(task.scheduled_end_date).split('T')[0] : '',
      });
    } else {
      // Estado inicial por defecto para creación
      setFormData({
        title: '',
        priority: 'P2',
        status: 'Por hacer',
        responsible_id: '',
        area_id: '',
        start_date: new Date().toISOString().split('T')[0], // hoy por defecto
        scheduled_end_date: '',
      });
    }
    setLocalError(null);
  }, [task, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    setSubmitting(true);
    setLocalError(null);
    try {
      // Estructuramos los datos
      const payload: Partial<Task> = {
        title: formData.title.trim(),
        priority: formData.priority,
        status: formData.status,
        responsible_id: formData.responsible_id ? Number(formData.responsible_id) : null,
        area_id: formData.area_id ? Number(formData.area_id) : null,
        start_date: formData.start_date || null,
        scheduled_end_date: formData.scheduled_end_date || null,
      };

      await onSave(payload);
      onClose();
    } catch (err: any) {
      setLocalError(err.message || 'Error al guardar la tarea en la bitácora.');
    } finally {
      setSubmitting(false);
    }
  };

  // Determinar si los campos de planificación estratégica deben bloquearse.
  // 1. Si es una tarea nueva -> Todo el personal puede crearla (no se bloquea).
  // 2. Si es edición -> Se bloquean los campos estratégicos si el usuario NO es un editor.
  const isPlanningFieldsDisabled = task !== null && !isEditor;

  return (
    <Portal isOpen={isOpen}>
      <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
        <div className="bg-[#f8fafc] w-full max-w-2xl rounded-[40px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-scale-in">

          {/* Header */}
          <div className="bg-white p-8 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 bg-blue-50 text-[#004C6C] rounded-2xl flex items-center justify-center">
                <ClipboardList size={24} />
              </div>
              <div>
                <h2 className="text-2xl font-black text-[#004C6C] tracking-tight">
                  {task ? 'Editar Tarea' : 'Nueva Tarea'}
                </h2>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                  Bitácora de seguimiento por área
                </p>
              </div>
            </div>
            <button onClick={onClose} className="p-3 text-slate-300 hover:bg-slate-50 rounded-2xl transition-all">
              <X size={24} />
            </button>
          </div>

          {/* Advertencia de Permiso Limitado */}
          {isPlanningFieldsDisabled && (
            <div className="bg-amber-50 border-b border-amber-100 px-8 py-3 flex items-center gap-3 text-amber-800 text-[11px] font-bold">
              <ShieldAlert size={16} className="text-amber-500 shrink-0" />
              <span>
                Únicamente estás autorizado para actualizar el **Estado** de avance. Los campos de planificación estratégica están bloqueados.
              </span>
            </div>
          )}

          {/* Formulario */}
          <form onSubmit={handleSubmit} className="p-10 space-y-8 overflow-y-auto flex-1 relative">

            {isLoading && (
              <div className="absolute inset-0 z-50 bg-white/70 backdrop-blur-xs flex items-center justify-center animate-fade-in rounded-[40px]">
                <div className="flex flex-col items-center gap-3">
                  <div className="h-10 w-10 border-4 border-slate-200 border-t-[#004C6C] rounded-full animate-spin"></div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Cargando detalles recientes...</p>
                </div>
              </div>
            )}

            {localError && (
              <div className="p-4 bg-red-50 border border-red-100 rounded-2xl text-xs font-bold text-red-600 text-center">
                {localError}
              </div>
            )}

            <div className="space-y-6">
              {/* Título o Descripción de la Tarea */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                  Descripción de la Tarea / Compromiso
                </label>
                <div className="relative">
                  <div className="absolute left-4 top-4 text-slate-300"><Type size={18} /></div>
                  <textarea
                    required
                    rows={3}
                    disabled={isPlanningFieldsDisabled || submitting}
                    value={formData.title}
                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                    className="w-full bg-white border border-slate-100 rounded-2xl pl-12 pr-6 py-3.5 text-sm font-bold text-slate-700 focus:border-[#004C6C] outline-none transition-all shadow-sm placeholder:text-slate-300 disabled:bg-slate-100/50 disabled:text-slate-400"
                    placeholder="Ej: Generar documento de inducción para todos los trabajadores, validar que debe contener el documento..."
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Prioridad */}
                <div>
                  <CustomSelect
                    label="Prioridad"
                    placeholder="Selecciona la prioridad"
                    disabled={isPlanningFieldsDisabled || submitting}
                    options={[
                      { value: 'P0', label: 'P0 - Crítica' },
                      { value: 'P1', label: 'P1 - Alta' },
                      { value: 'P2', label: 'P2 - Media' },
                      { value: 'P3', label: 'P3 - Baja' }
                    ]}
                    value={formData.priority}
                    onChange={val => setFormData({ ...formData, priority: val as TaskPriority })}
                  />
                </div>

                {/* Estado */}
                <div>
                  <CustomSelect
                    label="Estado"
                    placeholder="Selecciona el estado"
                    disabled={submitting} // El estado SIEMPRE lo pueden modificar todos
                    options={[
                      { value: 'Por hacer', label: 'Por hacer' },
                      { value: 'En espera', label: 'En espera' },
                      { value: 'En progreso', label: 'En progreso' },
                      { value: 'Completada', label: 'Completada' }
                    ]}
                    value={formData.status}
                    onChange={val => setFormData({ ...formData, status: val as TaskStatus })}
                  />
                </div>

                {/* Área */}
                <div>
                  <CustomSelect
                    label="Área Asignada"
                    placeholder="Selecciona el área"
                    disabled={isPlanningFieldsDisabled || submitting}
                    options={areas.map(a => ({ value: a.id.toString(), label: a.name }))}
                    value={formData.area_id}
                    onChange={val => setFormData({ ...formData, area_id: val })}
                  />
                </div>

                {/* Responsable */}
                <div>
                  <CustomSelect
                    label="Responsable"
                    placeholder="Selecciona el responsable"
                    disabled={isPlanningFieldsDisabled || submitting}
                    options={users.map(u => ({ value: u.id.toString(), label: u.name }))}
                    value={formData.responsible_id}
                    onChange={val => setFormData({ ...formData, responsible_id: val })}
                  />
                </div>

                {/* Fecha de Inicio */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                    Fecha de Inicio
                  </label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 z-10"><Calendar size={18} /></div>
                    <input
                      type="date"
                      disabled={isPlanningFieldsDisabled || submitting}
                      value={formData.start_date}
                      onChange={e => setFormData({ ...formData, start_date: e.target.value })}
                      className="w-full bg-white border border-slate-100 rounded-2xl pl-12 pr-6 py-4 text-sm font-bold text-slate-700 focus:border-[#004C6C] outline-none transition-all shadow-sm disabled:bg-slate-100/50 disabled:text-slate-400"
                    />
                  </div>
                </div>

                {/* Fecha de Finalización Programada */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                    Fecha Final Programada
                  </label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 z-10"><Calendar size={18} /></div>
                    <input
                      type="date"
                      disabled={isPlanningFieldsDisabled || submitting}
                      value={formData.scheduled_end_date}
                      onChange={e => setFormData({ ...formData, scheduled_end_date: e.target.value })}
                      className="w-full bg-white border border-slate-100 rounded-2xl pl-12 pr-6 py-4 text-sm font-bold text-slate-700 focus:border-[#004C6C] outline-none transition-all shadow-sm disabled:bg-slate-100/50 disabled:text-slate-400"
                    />
                  </div>
                </div>

              </div>
            </div>
          </form>

          {/* Footer */}
          <div className="p-8 bg-white border-t border-slate-100 flex justify-end gap-4">
            <button
              type="button"
              onClick={onClose}
              className="px-8 py-4 bg-slate-100 text-slate-500 rounded-2xl font-bold hover:bg-slate-200 transition-all text-xs uppercase tracking-widest"
            >
              Cancelar
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting || !formData.title.trim()}
              className="flex items-center gap-3 px-10 py-4 bg-[#004C6C] text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-[#003a53] shadow-lg shadow-blue-900/10 transition-all disabled:opacity-50"
            >
              <Save size={18} />
              {submitting ? 'Guardando...' : (task ? 'Actualizar Tarea' : 'Agregar Tarea')}
            </button>
          </div>

        </div>
      </div>
    </Portal>
  );
};
