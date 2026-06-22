import React, { useState, useEffect } from 'react';
import { X, Save, Type, AlertCircle } from 'lucide-react';
import type { FtraContractor } from '../types';
import { Portal } from '../../../components/ui/Portal';
import { CustomSelect } from '../../../components/ui/CustomSelect';

interface ContractorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Partial<FtraContractor>) => Promise<any>;
  contractor: FtraContractor | null;
}

export const ContractorModal: React.FC<ContractorModalProps> = ({
  isOpen,
  onClose,
  onSave,
  contractor,
}) => {
  const [formData, setFormData] = useState({
    name: '',
    nit: '',
    email: '',
    phone: '',
    is_active: 'true',
  });

  const [submitting, setSubmitting] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    if (contractor) {
      setFormData({
        name: contractor.name,
        nit: contractor.nit || '',
        email: contractor.email || '',
        phone: contractor.phone || '',
        is_active: contractor.is_active ? 'true' : 'false',
      });
    } else {
      setFormData({
        name: '',
        nit: '',
        email: '',
        phone: '',
        is_active: 'true',
      });
    }
    setLocalError(null);
  }, [contractor, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setLocalError('El nombre del contratista es obligatorio.');
      return;
    }

    setSubmitting(true);
    setLocalError(null);

    try {
      const payload: Partial<FtraContractor> = {
        name: formData.name.trim(),
        nit: formData.nit.trim() || undefined,
        email: formData.email.trim() || undefined,
        phone: formData.phone.trim() || undefined,
        is_active: formData.is_active === 'true',
      };

      await onSave(payload);
      onClose();
    } catch (err: any) {
      setLocalError(err.message || 'Error al guardar el contratista.');
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
                <Type size={24} />
              </div>
              <div>
                <h2 className="text-2xl font-black text-[#004C6C] tracking-tight">
                  {contractor ? 'Editar Contratista' : 'Nuevo Contratista'}
                </h2>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                  Registro de proveedores y contratistas autorizados
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
              {/* Nombre / Razón Social */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                  Nombre o Razón Social *
                </label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300"><Type size={18} /></div>
                  <input
                    type="text"
                    required
                    placeholder="Ej: Emelect Group S.A.S."
                    disabled={submitting}
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-white border border-slate-100 rounded-2xl pl-12 pr-6 py-4 text-sm font-bold text-slate-700 focus:border-[#004C6C] outline-none transition-all shadow-sm placeholder:text-slate-300"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* NIT */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                    NIT / Identificación
                  </label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300"><Type size={18} /></div>
                    <input
                      type="text"
                      placeholder="Ej: 901234567-1"
                      disabled={submitting}
                      value={formData.nit}
                      onChange={e => setFormData({ ...formData, nit: e.target.value })}
                      className="w-full bg-white border border-slate-100 rounded-2xl pl-12 pr-6 py-4 text-sm font-bold text-slate-700 focus:border-[#004C6C] outline-none transition-all shadow-sm placeholder:text-slate-300"
                    />
                  </div>
                </div>

                {/* Teléfono */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                    Teléfono de Contacto
                  </label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300"><Type size={18} /></div>
                    <input
                      type="text"
                      placeholder="Ej: 3001234567"
                      disabled={submitting}
                      value={formData.phone}
                      onChange={e => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full bg-white border border-slate-100 rounded-2xl pl-12 pr-6 py-4 text-sm font-bold text-slate-700 focus:border-[#004C6C] outline-none transition-all shadow-sm placeholder:text-slate-300"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Correo */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                    Correo Electrónico
                  </label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300"><Type size={18} /></div>
                    <input
                      type="email"
                      placeholder="Ej: contacto@empresa.com"
                      disabled={submitting}
                      value={formData.email}
                      onChange={e => setFormData({ ...formData, email: e.target.value })}
                      className="w-full bg-white border border-slate-100 rounded-2xl pl-12 pr-6 py-4 text-sm font-bold text-slate-700 focus:border-[#004C6C] outline-none transition-all shadow-sm placeholder:text-slate-300"
                    />
                  </div>
                </div>

                {/* Estado */}
                <div>
                  <CustomSelect
                    label="Estado"
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
              disabled={submitting || !formData.name.trim()}
              className="flex items-center gap-3 px-10 py-4 bg-[#004C6C] text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-[#003a53] shadow-lg shadow-blue-900/10 transition-all disabled:opacity-50 cursor-pointer"
            >
              <Save size={18} />
              {submitting ? 'Guardando...' : (contractor ? 'Actualizar Contratista' : 'Agregar Contratista')}
            </button>
          </div>

        </div>
      </div>
    </Portal>
  );
};
