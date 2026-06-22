import React, { useState, useRef } from 'react';
import { ClipboardCheck, FileText, X, Upload, Save, Eye, AlertCircle } from 'lucide-react';
import type { FtraFormat, FtraContractor } from '../types';
import { CustomSelect } from '../../../components/ui/CustomSelect';
import { Autocomplete } from '../../../components/ui/Autocomplete';
import { SignaturePad } from '../../../components/ui/SignaturePad';

interface FtraRecordFormProps {
  formats: FtraFormat[];
  contractors: FtraContractor[];
  onSubmit: (formData: FormData) => Promise<any>;
  isLoading: boolean;
}

export const FtraRecordForm: React.FC<FtraRecordFormProps> = ({
  formats,
  contractors,
  onSubmit,
  isLoading,
}) => {
  const [contractorId, setContractorId] = useState('');
  const [formatId, setFormatId] = useState('');
  const [observations, setObservations] = useState('');
  const [isCompleted, setIsCompleted] = useState('false');
  
  // Firmas digitales
  const [contractorSignature, setContractorSignature] = useState<string | null>(null);
  const [residentSignature, setResidentSignature] = useState<string | null>(null);
  const [signatureKey, setSignatureKey] = useState(0);
  
  // Lista de archivos seleccionados localmente para cargar
  const [selectedPhotos, setSelectedPhotos] = useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  const [localError, setLocalError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Obtiene los datos del formato seleccionado para mostrar su preview
  const selectedFormat = formats.find(f => f.id.toString() === formatId);

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      const validFiles: File[] = [];
      const newPreviews: string[] = [];

      files.forEach(file => {
        if (!file.type.startsWith('image/')) {
          setLocalError('Todos los archivos adjuntos deben ser imágenes válidas.');
          return;
        }
        if (file.size > 5 * 1024 * 1024) {
          setLocalError('El tamaño máximo por imagen es de 5MB.');
          return;
        }
        validFiles.push(file);
        newPreviews.push(URL.createObjectURL(file));
      });

      setSelectedPhotos(prev => [...prev, ...validFiles]);
      setPhotoPreviews(prev => [...prev, ...newPreviews]);
      setLocalError(null);
    }
  };

  const removePhoto = (index: number) => {
    // Liberar memoria del objectURL
    URL.revokeObjectURL(photoPreviews[index]);
    setSelectedPhotos(prev => prev.filter((_, i) => i !== index));
    setPhotoPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleClear = () => {
    setContractorId('');
    setFormatId('');
    setObservations('');
    setIsCompleted('false');
    setContractorSignature(null);
    setResidentSignature(null);
    setSignatureKey(prev => prev + 1);
    photoPreviews.forEach(url => URL.revokeObjectURL(url));
    setSelectedPhotos([]);
    setPhotoPreviews([]);
    setLocalError(null);
    setSuccessMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    setSuccessMessage(null);

    if (!contractorId) {
      setLocalError('Por favor selecciona un proveedor o contratista.');
      return;
    }
    if (!formatId) {
      setLocalError('Por favor selecciona un formato de seguimiento.');
      return;
    }
    if (!contractorSignature) {
      setLocalError('Por favor firme como Contratista.');
      return;
    }
    if (!residentSignature) {
      setLocalError('Por favor firme como Residente.');
      return;
    }

    try {
      const fd = new FormData();
      fd.append('contractor_id', contractorId);
      fd.append('format_id', formatId);
      fd.append('observations', observations.trim());
      fd.append('is_completed', isCompleted === 'true' ? '1' : '0');
      fd.append('contractor_signature', contractorSignature);
      fd.append('resident_signature', residentSignature);
      
      // Agregar múltiples fotos
      selectedPhotos.forEach((file) => {
        fd.append('photos[]', file);
      });

      await onSubmit(fd);
      setSuccessMessage('Registro de FTRA creado exitosamente.');
      // Limpiamos el formulario tras guardar correctamente
      setTimeout(() => {
        handleClear();
      }, 1500);
    } catch (err: any) {
      setLocalError(err.message || 'Error al guardar el registro de FTRA.');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {localError && (
        <div className="p-4 bg-red-50 border border-red-100 rounded-2xl text-xs font-bold text-red-600 text-center flex items-center gap-2 justify-center animate-fade-in">
          <AlertCircle size={16} />
          <span>{localError}</span>
        </div>
      )}

      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl text-xs font-black text-emerald-700 text-center flex items-center gap-2 justify-center animate-fade-in">
          <ClipboardCheck size={18} />
          <span>{successMessage}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Selector de Contratista */}
        <div>
          <Autocomplete
            label="Proveedor / Contratista *"
            placeholder="Buscar o seleccionar proveedor..."
            options={contractors.map(c => ({ value: c.id.toString(), label: c.name, sublabel: c.nit }))}
            value={contractorId || null}
            onChange={val => setContractorId(val || '')}
          />
        </div>

        {/* Selector de Formato */}
        <div>
          <CustomSelect
            label="Formato de Seguimiento *"
            placeholder="Selecciona el formato"
            disabled={isLoading}
            pyClass="py-4"
            options={formats.map(f => ({ value: f.id.toString(), label: `[${f.code}] ${f.name}` }))}
            value={formatId}
            onChange={val => setFormatId(val)}
          />
        </div>

      </div>

      {/* Información del Formato Seleccionado */}
      {selectedFormat && (
        <div className="bg-slate-50/50 border border-slate-100 p-6 rounded-[24px] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-scale-in">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-white border border-slate-100 rounded-xl text-[#004C6C] shrink-0">
              <FileText size={20} />
            </div>
            <div>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Formato Seleccionado</p>
              <h4 className="text-sm font-black text-slate-800 mt-1 leading-tight">{selectedFormat.name}</h4>
              <div className="flex items-center gap-4 mt-1.5 text-[10px] font-bold text-slate-500">
                <span>Código: <strong className="text-slate-700 uppercase">{selectedFormat.code}</strong></span>
                <span>Versión: <strong className="text-slate-700">{selectedFormat.version}</strong></span>
              </div>
            </div>
          </div>
          {selectedFormat.pdf_url && (
            <a
              href={selectedFormat.pdf_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-[#004C6C] hover:border-[#004C6C]/30 rounded-xl font-bold text-xs uppercase tracking-wider transition-all hover:scale-[1.02] cursor-pointer shrink-0"
            >
              <Eye size={14} />
              Visualizar PDF
            </a>
          )}
        </div>
      )}

      {/* Observaciones */}
      <div className="space-y-2">
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
          Observaciones y Comentarios del Registro
        </label>
        <textarea
          rows={4}
          disabled={isLoading}
          placeholder="Escribe aquí los hallazgos, observaciones detalladas o notas operativas encontradas en la revisión de la FTRA..."
          value={observations}
          onChange={e => setObservations(e.target.value)}
          className="w-full bg-white border border-slate-100 rounded-2xl px-6 py-4 text-sm font-bold text-slate-700 focus:border-[#004C6C] outline-none transition-all shadow-sm placeholder:text-slate-300"
        />
      </div>

      {/* Toggle de Completado y Carga de Fotos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Toggle de completado */}
        <div>
          <CustomSelect
            label="¿Evaluación Completa / Cumple? *"
            placeholder="Selecciona una opción"
            disabled={isLoading}
            pyClass="py-4"
            options={[
              { value: 'true', label: 'Sí - Cumple / Completa' },
              { value: 'false', label: 'No - No Cumple / Incompleta' }
            ]}
            value={isCompleted}
            onChange={val => setIsCompleted(val)}
          />
          <p className="text-[9px] text-slate-400 font-bold tracking-normal mt-2 ml-1 leading-relaxed">
            Marca **Sí** si el contratista cumple a cabalidad con los parámetros definidos en el formato PDF de la FTRA.
          </p>
        </div>

        {/* Carga de Fotografías */}
        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
            Evidencia Fotográfica (Adjuntar una o varias imágenes)
          </label>
          
          <div className="flex flex-wrap gap-3 items-center">
            {/* Botón de carga */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="h-20 w-20 bg-white border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:bg-slate-50 hover:border-[#004C6C]/50 transition-all text-slate-400 gap-1 shrink-0"
              title="Adjuntar Foto"
            >
              <Upload size={18} />
              <span className="text-[9px] font-black uppercase tracking-wider">Subir</span>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                onChange={handlePhotoSelect}
                className="hidden"
              />
            </div>

            {/* Miniaturas de Previsualización */}
            {photoPreviews.map((previewUrl, index) => (
              <div key={index} className="relative h-20 w-20 rounded-2xl overflow-hidden border border-slate-100 group shrink-0 animate-scale-in">
                <img src={previewUrl} alt={`preview-${index}`} className="h-full w-full object-cover" />
                <button
                  type="button"
                  onClick={() => removePhoto(index)}
                  className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-all duration-200 cursor-pointer"
                  title="Remover Foto"
                >
                  <X size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Firmas Digitales */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 border-t border-slate-100 pt-6">
        <div>
          <SignaturePad
            key={`${signatureKey}-contractor`}
            label="Firma del Contratista / Proveedor *"
            placeholder="Haga clic aquí para firmar"
            value={contractorSignature}
            onChange={val => setContractorSignature(val)}
            height={150}
          />
        </div>
        <div>
          <SignaturePad
            key={`${signatureKey}-resident`}
            label="Firma del Residente / Supervisor *"
            placeholder="Haga clic aquí para firmar"
            value={residentSignature}
            onChange={val => setResidentSignature(val)}
            height={150}
          />
        </div>
      </div>

      {/* Botones de acción en el pie del formulario */}
      <div className="flex justify-end gap-4 pt-4 border-t border-slate-100">
        <button
          type="button"
          onClick={handleClear}
          disabled={isLoading}
          className="px-8 py-4 bg-slate-100 text-slate-500 rounded-2xl font-bold hover:bg-slate-200 transition-all text-xs uppercase tracking-widest cursor-pointer"
        >
          Limpiar Campos
        </button>
        <button
          type="submit"
          disabled={isLoading || !contractorId || !formatId}
          className="flex items-center gap-3 px-10 py-4 bg-[#004C6C] text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-[#003a53] shadow-lg shadow-blue-900/10 transition-all disabled:opacity-50 cursor-pointer"
        >
          <Save size={18} />
          {isLoading ? 'Registrando...' : 'Registrar FTRA'}
        </button>
      </div>

    </form>
  );
};
