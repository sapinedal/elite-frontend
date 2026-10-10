import React, { useState } from 'react';
import { X, Building2, Loader2, Trash2, Plus, CheckCircle2 } from 'lucide-react';
import { Portal } from '../../../components/ui/Portal';
import type { Tower, CreateTowerDTO } from '../types';

interface TowerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: CreateTowerDTO) => Promise<void>;
  onDelete?: (towerId: number) => Promise<void>;
  towersList?: Tower[];
  projectName?: string;
}

export const TowerModal: React.FC<TowerModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onDelete,
  towersList = [],
  projectName
}) => {
  const [formData, setFormData] = useState<CreateTowerDTO>({
    name: '',
    code: '',
    description: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setErrorMessage('El nombre de la torre/etapa es requerido');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage(null);
      await onSave(formData);
      setFormData({ name: '', code: '', description: '' });
    } catch (err: any) {
      console.error('Error al guardar torre:', err);
      setErrorMessage(
        err?.response?.data?.message || err?.message || 'Error al guardar la torre'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Portal isOpen={isOpen}>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6 bg-slate-900/60 backdrop-blur-md animate-fade-in">
        <div
          className="bg-white rounded-[32px] w-full max-w-lg max-h-[90vh] shadow-2xl overflow-hidden border border-slate-100 animate-scale-up flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-[#004C6C] p-6 md:p-8 text-white relative overflow-hidden flex-shrink-0">
            <div className="absolute -right-8 -bottom-8 w-36 h-36 bg-white/5 rounded-full blur-2xl" />
            <div className="flex items-center justify-between relative z-10">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-md border border-white/10">
                  <Building2 className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-black tracking-tight">Gestión de Torres / Etapas</h2>
                  <p className="text-xs font-bold text-white/60 uppercase tracking-widest mt-0.5">
                    {projectName ? `Proyecto: ${projectName}` : 'Administra torres o sectores'}
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

          {/* Form & List Body */}
          <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6">
            {errorMessage && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-red-600 text-xs font-bold animate-shake">
                {errorMessage}
              </div>
            )}

            {/* Formulario para Crear */}
            <form onSubmit={handleSubmit} className="p-5 bg-slate-50 border border-slate-200 rounded-3xl space-y-4">
              <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-2">
                <Plus size={14} className="text-[#004C6C]" />
                Agregar Nueva Torre o Etapa
              </h4>

              {/* Nombre de la torre */}
              <div className="space-y-1">
                <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider">
                  Nombre de la Torre o Etapa *
                </label>
                <input
                  type="text"
                  placeholder="Ej. Torre 1, Torre 2, Urbanismo, Etapa 1"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-3 text-slate-800 font-bold focus:border-[#004C6C] outline-none text-sm placeholder:text-slate-300"
                  required
                />
              </div>

              {/* Descripción Opcional */}
              <div className="space-y-1">
                <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider">
                  Descripción (Opcional)
                </label>
                <input
                  type="text"
                  placeholder="Detalles adicionales..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-2.5 text-slate-800 font-bold focus:border-[#004C6C] outline-none text-xs placeholder:text-slate-300"
                />
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-2 px-6 py-3 bg-[#004C6C] text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-[#003a53] shadow-md shadow-blue-900/10 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    'Agregar Torre'
                  )}
                </button>
              </div>
            </form>

            {/* Lista de Torres Existentes para Eliminar/Gestionar */}
            {towersList.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">
                  Torres del Proyecto ({towersList.length})
                </h4>

                <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                  {towersList.map((tower) => (
                    <div
                      key={tower.id}
                      className="flex items-center justify-between p-4 bg-white border border-slate-100 hover:border-slate-200 rounded-2xl shadow-xs transition-all group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-50 text-[#004C6C] rounded-xl">
                          <CheckCircle2 size={16} />
                        </div>
                        <div>
                          <p className="text-sm font-black text-slate-800">{tower.name}</p>
                          {tower.description && (
                            <p className="text-[11px] font-semibold text-slate-400">{tower.description}</p>
                          )}
                        </div>
                      </div>

                      {onDelete && (
                        <button
                          type="button"
                          onClick={() => onDelete(tower.id)}
                          className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                          title="Eliminar Torre"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 bg-[#004C6C] text-white font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-[#003a53] transition-all"
            >
              Listo / Cerrar
            </button>
          </div>
        </div>
      </div>
    </Portal>
  );
};
