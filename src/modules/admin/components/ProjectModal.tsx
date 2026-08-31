import React, { useState, useEffect } from 'react';
import { X, Building2, FileText, DollarSign, Code2, Tag, Loader2 } from 'lucide-react';
import type { Project, CreateProjectDTO } from '../types';

interface ProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: CreateProjectDTO) => Promise<void>;
  project: Project | null;
}

export const ProjectModal: React.FC<ProjectModalProps> = ({
  isOpen,
  onClose,
  onSave,
  project
}) => {
  const [formData, setFormData] = useState<CreateProjectDTO>({
    code: '',
    name: '',
    subtitle: '',
    description: '',
    total_budget: 0,
    is_active: true
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (project) {
      setFormData({
        code: project.code || '',
        name: project.name || '',
        subtitle: project.subtitle || '',
        description: project.description || '',
        total_budget: project.total_budget || 0,
        is_active: project.is_active ?? true
      });
    } else {
      setFormData({
        code: '',
        name: '',
        subtitle: '',
        description: '',
        total_budget: 0,
        is_active: true
      });
    }
    setErrorMessage(null);
  }, [project, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.code.trim() || !formData.name.trim()) {
      setErrorMessage('El código y el nombre del proyecto son requeridos');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage(null);
      await onSave(formData);
      onClose();
    } catch (err: any) {
      console.error('Error saving project:', err);
      setErrorMessage(
        err?.response?.data?.message || err?.message || 'Error al guardar el proyecto'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-fade-in">
      <div 
        className="bg-white rounded-[32px] w-full max-w-2xl shadow-2xl overflow-hidden border border-slate-100 animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-[#004C6C] p-8 text-white relative overflow-hidden">
          <div className="absolute -right-8 -bottom-8 w-36 h-36 bg-white/5 rounded-full blur-2xl" />
          <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-md border border-white/10">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-black tracking-tight">
                  {project ? 'Editar Proyecto' : 'Nuevo Proyecto'}
                </h2>
                <p className="text-xs font-bold text-white/60 uppercase tracking-widest mt-0.5">
                  {project ? `ID: #${project.id} — ${project.code}` : 'Completa los datos del proyecto'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-xl transition-all"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          {errorMessage && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-red-600 text-xs font-bold animate-shake">
              {errorMessage}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Código */}
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-500 uppercase tracking-wider flex items-center gap-2">
                <Code2 size={14} className="text-[#004C6C]" />
                Código del Proyecto *
              </label>
              <input
                type="text"
                placeholder="Ej. VIS, SERENA, JERICO"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toLowerCase().trim() })}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 text-slate-800 font-bold focus:bg-white focus:border-[#004C6C] focus:ring-4 focus:ring-blue-900/5 transition-all outline-none text-sm placeholder:text-slate-300"
                required
              />
            </div>

            {/* Nombre */}
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-500 uppercase tracking-wider flex items-center gap-2">
                <Building2 size={14} className="text-[#004C6C]" />
                Nombre del Proyecto *
              </label>
              <input
                type="text"
                placeholder="Ej. Ciudadela San Miguel"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 text-slate-800 font-bold focus:bg-white focus:border-[#004C6C] focus:ring-4 focus:ring-blue-900/5 transition-all outline-none text-sm placeholder:text-slate-300"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Subtítulo */}
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-500 uppercase tracking-wider flex items-center gap-2">
                <Tag size={14} className="text-[#004C6C]" />
                Subtítulo / Tipo
              </label>
              <input
                type="text"
                placeholder="Ej. VIS - 2,200 aptos (Torre 2)"
                value={formData.subtitle}
                onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 text-slate-800 font-bold focus:bg-white focus:border-[#004C6C] focus:ring-4 focus:ring-blue-900/5 transition-all outline-none text-sm placeholder:text-slate-300"
              />
            </div>

            {/* Presupuesto Total */}
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-500 uppercase tracking-wider flex items-center gap-2">
                <DollarSign size={14} className="text-[#004C6C]" />
                Presupuesto Total (COP)
              </label>
              <input
                type="number"
                min="0"
                step="any"
                placeholder="0"
                value={formData.total_budget}
                onChange={(e) => setFormData({ ...formData, total_budget: parseFloat(e.target.value) || 0 })}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 text-slate-800 font-bold focus:bg-white focus:border-[#004C6C] focus:ring-4 focus:ring-blue-900/5 transition-all outline-none text-sm placeholder:text-slate-300"
              />
            </div>
          </div>

          {/* Descripción */}
          <div className="space-y-2">
            <label className="text-xs font-black text-slate-500 uppercase tracking-wider flex items-center gap-2">
              <FileText size={14} className="text-[#004C6C]" />
              Descripción
            </label>
            <textarea
              rows={3}
              placeholder="Detalles sobre el proyecto, alcance y características..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-5 text-slate-800 font-bold focus:bg-white focus:border-[#004C6C] focus:ring-4 focus:ring-blue-900/5 transition-all outline-none text-sm placeholder:text-slate-300 resize-none"
            />
          </div>

          {/* Estado Switch */}
          <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-2xl">
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${formData.is_active ? 'bg-emerald-500' : 'bg-slate-300'}`} />
              <div>
                <p className="text-xs font-black text-slate-700 uppercase tracking-wider">Estado del Proyecto</p>
                <p className="text-[11px] font-bold text-slate-400">
                  {formData.is_active ? 'El proyecto está activo en la plataforma' : 'El proyecto está inactivo'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setFormData({ ...formData, is_active: !formData.is_active })}
              className={`relative inline-flex h-7 w-12 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                formData.is_active ? 'bg-[#004C6C]' : 'bg-slate-300'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  formData.is_active ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-4 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3.5 text-slate-500 font-bold text-xs uppercase tracking-widest hover:bg-slate-100 rounded-2xl transition-all"
              disabled={isSubmitting}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-8 py-3.5 bg-[#004C6C] text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-[#003a53] shadow-lg shadow-blue-900/10 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Guardando...
                </>
              ) : (
                'Guardar Proyecto'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
