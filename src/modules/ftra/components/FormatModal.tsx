import React, { useState, useEffect, useRef } from 'react';
import { X, Save, FileText, Type, Upload, AlertCircle } from 'lucide-react';
import type { FtraFormat } from '../types';
import { Portal } from '../../../components/ui/Portal';
import { CustomSelect } from '../../../components/ui/CustomSelect';

interface FormatModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (formData: FormData) => Promise<any>;
  format: FtraFormat | null;
}

export const FormatModal: React.FC<FormatModalProps> = ({
  isOpen,
  onClose,
  onSave,
  format,
}) => {
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    version: '1.0',
    description: '',
    is_active: 'true',
  });

  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (format) {
      setFormData({
        name: format.name,
        code: format.code,
        version: format.version,
        description: format.description || '',
        is_active: format.is_active ? 'true' : 'false',
      });
      setPdfFile(null);
    } else {
      setFormData({
        name: '',
        code: '',
        version: '1.0',
        description: '',
        is_active: 'true',
      });
      setPdfFile(null);
    }
    setLocalError(null);
  }, [format, isOpen]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (file.type !== 'application/pdf') {
        setLocalError('El archivo debe ser un PDF válido.');
        setPdfFile(null);
        return;
      }
      if (file.size > 10240 * 1024) {
        setLocalError('El archivo PDF no debe superar los 10MB.');
        setPdfFile(null);
        return;
      }
      setPdfFile(file);
      setLocalError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.code.trim() || !formData.version.trim()) {
      setLocalError('Por favor completa todos los campos obligatorios.');
      return;
    }
    if (!format && !pdfFile) {
      setLocalError('Por favor selecciona un archivo PDF para el nuevo formato.');
      return;
    }

    setSubmitting(true);
    setLocalError(null);

    try {
      const fd = new FormData();
      fd.append('name', formData.name.trim());
      fd.append('code', formData.code.trim().toUpperCase());
      fd.append('version', formData.version.trim());
      fd.append('description', formData.description.trim());
      fd.append('is_active', formData.is_active);
      
      if (pdfFile) {
        fd.append('pdf_file', pdfFile);
      }

      await onSave(fd);
      onClose();
    } catch (err: any) {
      setLocalError(err.message || 'Error al guardar el formato.');
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
                <FileText size={24} />
              </div>
              <div>
                <h2 className="text-2xl font-black text-[#004C6C] tracking-tight">
                  {format ? 'Editar Formato PDF' : 'Nuevo Formato PDF'}
                </h2>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                  Parámetros del documento en la aplicación
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Código */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                    Código del Formato *
                  </label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300"><Type size={18} /></div>
                    <input
                      type="text"
                      required
                      placeholder="Ej: FTRA-01"
                      disabled={submitting}
                      value={formData.code}
                      onChange={e => setFormData({ ...formData, code: e.target.value })}
                      className="w-full bg-white border border-slate-100 rounded-2xl pl-12 pr-6 py-4 text-sm font-bold text-slate-700 focus:border-[#004C6C] outline-none transition-all shadow-sm placeholder:text-slate-300"
                    />
                  </div>
                </div>

                {/* Versión */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                    Versión *
                  </label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300"><Type size={18} /></div>
                    <input
                      type="text"
                      required
                      placeholder="Ej: 1.0 o v2"
                      disabled={submitting}
                      value={formData.version}
                      onChange={e => setFormData({ ...formData, version: e.target.value })}
                      className="w-full bg-white border border-slate-100 rounded-2xl pl-12 pr-6 py-4 text-sm font-bold text-slate-700 focus:border-[#004C6C] outline-none transition-all shadow-sm placeholder:text-slate-300"
                    />
                  </div>
                </div>
              </div>

              {/* Nombre */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                  Nombre del Formato *
                </label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300"><Type size={18} /></div>
                  <input
                    type="text"
                    required
                    placeholder="Ej: Inducción de Seguridad y Salud"
                    disabled={submitting}
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-white border border-slate-100 rounded-2xl pl-12 pr-6 py-4 text-sm font-bold text-slate-700 focus:border-[#004C6C] outline-none transition-all shadow-sm placeholder:text-slate-300"
                  />
                </div>
              </div>

              {/* Descripción */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                  Descripción / Finalidad del Formato
                </label>
                <textarea
                  rows={3}
                  disabled={submitting}
                  placeholder="Describe brevemente el propósito de este formato en la aplicación..."
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-white border border-slate-100 rounded-2xl px-6 py-3.5 text-sm font-bold text-slate-700 focus:border-[#004C6C] outline-none transition-all shadow-sm placeholder:text-slate-300"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Archivo PDF */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                    Archivo PDF {format ? '(Opcional para reemplazar)' : '*'}
                  </label>
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full bg-white border border-dashed border-slate-200 rounded-2xl p-4 flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-slate-50 transition-all text-slate-500 min-h-[90px]"
                  >
                    <Upload size={20} className="text-slate-400 animate-pulse" />
                    <span className="text-xs font-bold">
                      {pdfFile ? pdfFile.name : (format && format.pdf_path ? 'PDF actual guardado' : 'Seleccionar o arrastrar PDF')}
                    </span>
                    <span className="text-[9px] text-slate-400">PDF, Máx 10MB</span>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="application/pdf"
                      onChange={handleFileChange}
                      className="hidden"
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
              disabled={submitting || !formData.name.trim() || !formData.code.trim() || (!format && !pdfFile)}
              className="flex items-center gap-3 px-10 py-4 bg-[#004C6C] text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-[#003a53] shadow-lg shadow-blue-900/10 transition-all disabled:opacity-50 cursor-pointer"
            >
              <Save size={18} />
              {submitting ? 'Guardando...' : (format ? 'Actualizar Formato' : 'Agregar Formato')}
            </button>
          </div>

        </div>
      </div>
    </Portal>
  );
};
