import React, { useState, useEffect } from 'react';
import { X, Save, User, AlertCircle, Mail } from 'lucide-react';
import type { Residente } from '../types';
import { Portal } from '../../../components/ui/Portal';
import { CustomSelect } from '../../../components/ui/CustomSelect';

interface ResidenteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Partial<Residente>) => Promise<any>;
  residente: Residente | null;
}

export const ResidenteModal: React.FC<ResidenteModalProps> = ({
  isOpen,
  onClose,
  onSave,
  residente,
}) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'Residente estructura',
    is_active: 'true',
  });

  const [submitting, setSubmitting] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const roleOptions = [
    { value: 'Residente estructura', label: 'Residente Estructura' },
    { value: 'Residente acabados', label: 'Residente Acabados' },
    { value: 'Director Obra', label: 'Director Obra' },
    { value: 'Residente admin', label: 'Residente Admin / Administrativo' },
    { value: 'Supervisores obra', label: 'Supervisores Obra' },
    { value: 'Gerente de proyectos', label: 'Gerente de Proyectos' },
  ];

  useEffect(() => {
    if (residente) {
      setFormData({
        name: residente.name,
        email: residente.email,
        role: residente.role,
        is_active: residente.is_active ? 'true' : 'false',
      });
    } else {
      setFormData({
        name: '',
        email: '',
        role: 'Residente estructura',
        is_active: 'true',
      });
    }
    setLocalError(null);
  }, [residente, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setLocalError('El nombre del residente/responsable es obligatorio.');
      return;
    }
    if (!formData.email.trim()) {
      setLocalError('El correo electrónico es obligatorio.');
      return;
    }
    if (!formData.role) {
      setLocalError('El rol o cargo es obligatorio.');
      return;
    }

    setSubmitting(true);
    setLocalError(null);

    try {
      const payload: Partial<Residente> = {
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        role: formData.role,
        is_active: formData.is_active === 'true',
      };

      await onSave(payload);
      onClose();
    } catch (err: any) {
      setLocalError(err.message || 'Error al guardar el residente.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Portal isOpen={isOpen}>
      <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
        <div className="bg-[#f8fafc] w-full max-w-2xl rounded-[40px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-scale-in">
          
          {/* Header */}
          <div className="bg-white p-8 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 bg-blue-50 text-[#004C6C] rounded-2xl flex items-center justify-center">
                <User size={24} />
              </div>
              <div>
                <h2 className="text-2xl font-black text-[#004C6C] tracking-tight">
                  {residente ? 'Editar Residente / Responsable' : 'Nuevo Residente / Responsable'}
                </h2>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                  Administración de ingenieros residentes, directores y supervisores
                </p>
              </div>
            </div>
            <button onClick={onClose} className="p-3 text-slate-300 hover:bg-slate-50 rounded-2xl transition-all cursor-pointer">
              <X size={24} />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-10 space-y-8 overflow-y-auto flex-1 relative">
            {localError && (
              <div className="p-4 bg-red-50 border border-red-100 rounded-2xl text-xs font-bold text-red-600 text-center flex items-center gap-2 justify-center">
                <AlertCircle size={16} />
                <span>{localError}</span>
              </div>
            )}

            <div className="space-y-6">
              {/* Nombre Completo */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                  Nombre Completo *
                </label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300"><User size={18} /></div>
                  <input
                    type="text"
                    required
                    placeholder="Ej: Ing. Diego Ruiz"
                    disabled={submitting}
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-white border border-slate-100 rounded-2xl pl-12 pr-6 py-4 text-sm font-bold text-slate-700 focus:border-[#004C6C] outline-none transition-all shadow-sm placeholder:text-slate-300"
                  />
                </div>
              </div>

              {/* Correo Electrónico */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                  Correo Electrónico *
                </label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300"><Mail size={18} /></div>
                  <input
                    type="email"
                    required
                    placeholder="Ej: residenteacabados@inverconstruccion.com"
                    disabled={submitting}
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    className="w-full bg-white border border-slate-100 rounded-2xl pl-12 pr-6 py-4 text-sm font-bold text-slate-700 focus:border-[#004C6C] outline-none transition-all shadow-sm placeholder:text-slate-300"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Rol / Cargo */}
                <div>
                  <CustomSelect
                    label="Rol / Cargo de Obra *"
                    placeholder="Selecciona el rol"
                    disabled={submitting}
                    options={roleOptions}
                    value={formData.role}
                    onChange={val => setFormData({ ...formData, role: val })}
                  />
                </div>

                {/* Estado */}
                <div>
                  <CustomSelect
                    label="Estado *"
                    placeholder="Selecciona el estado"
                    disabled={submitting}
                    options={[
                      { value: 'true', label: 'Activo' },
                      { value: 'false', label: 'Inactivo' }
                    ]}
                    value={formData.is_active}
                    onChange={val => setFormData({ ...formData, is_active: val })}
                  />
                </div>
              </div>
            </div>
          </form>

          {/* Footer */}
          <div className="p-8 bg-white border-t border-slate-100 flex justify-end gap-4">
            <button
              type="button"
              onClick={onClose}
              className="px-8 py-4 bg-slate-100 text-slate-500 rounded-2xl font-bold hover:bg-slate-200 transition-all text-xs uppercase tracking-widest cursor-pointer"
            >
              Cancelar
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting || !formData.name.trim() || !formData.email.trim()}
              className="flex items-center gap-3 px-10 py-4 bg-[#004C6C] text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-[#003a53] shadow-lg shadow-blue-900/10 transition-all disabled:opacity-50 cursor-pointer"
            >
              <Save size={18} />
              {submitting ? 'Guardando...' : (residente ? 'Actualizar Residente' : 'Agregar Residente')}
            </button>
          </div>

        </div>
      </div>
    </Portal>
  );
};
