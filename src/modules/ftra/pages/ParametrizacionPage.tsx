import { useState } from 'react';
import { FileText, Search, RotateCcw, PlusCircle, AlertCircle, Info } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { useFormats } from '../hooks/useFormats';
import { FormatTable } from '../components/FormatTable';
import { FormatModal } from '../components/FormatModal';
import { CustomSelect } from '../../../components/ui/CustomSelect';
import { Pagination } from '../../../components/ui/Pagination';
import type { FtraFormat } from '../types';
import { useNotification } from '../../../context/NotificationContext';
import { getErrorMessage } from '../../../lib/apiError';

/**
 * Parametrización de FTRA: solo los formatos PDF.
 * - Los proveedores se crean en Contratación, al registrar el contrato.
 * - Las torres, pisos y apartamentos se configuran en Administración › Proyectos.
 * - El residente responsable es el usuario que registra el FTRA.
 */
export default function ParametrizacionPage() {
  const { showNotification } = useNotification();
  const { user } = useAuth();
  const isEditor = !!user?.permissions?.includes('ftra.parametrizar');

  const formatsData = useFormats();
  const [selectedFormat, setSelectedFormat] = useState<FtraFormat | null>(null);
  const [isFormatModalOpen, setIsFormatModalOpen] = useState(false);

  const handleAddNewFormat = () => {
    setSelectedFormat(null);
    setIsFormatModalOpen(true);
  };

  const handleEditFormat = (format: FtraFormat) => {
    setSelectedFormat(format);
    setIsFormatModalOpen(true);
  };

  const handleSaveFormat = async (formData: FormData) => {
    if (selectedFormat) {
      await formatsData.updateFormat(selectedFormat.id, formData);
    } else {
      await formatsData.createFormat(formData);
    }
  };

  const handleDeleteFormat = async (id: number) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este formato? Esta acción no se puede deshacer y borrará físicamente el archivo PDF asociado.')) {
      try {
        await formatsData.deleteFormat(id);
      } catch (err: unknown) {
        showNotification(getErrorMessage(err, 'Error al eliminar el formato.'), 'error');
      }
    }
  };

  return (
    <div className="max-w-[1600px] mx-auto flex flex-col gap-4 md:gap-6 py-4 md:py-8 px-3 sm:px-4 animate-fade-in">
      <div className="bg-white rounded-3xl md:rounded-[40px] shadow-[0_8px_40px_rgb(0,0,0,0.03)] border border-slate-100 p-4 sm:p-6 md:p-8 space-y-6 flex flex-col min-w-0">

        {/* Encabezado */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3 md:gap-4 min-w-0">
            <div className="h-11 w-11 md:h-14 md:w-14 bg-blue-50 text-[#004C6C] rounded-2xl flex items-center justify-center shrink-0">
              <FileText size={24} />
            </div>
            <div className="min-w-0">
              <h1 className="text-xl md:text-3xl font-black text-[#004C6C] tracking-tight">Formatos de Documento</h1>
              <p className="text-slate-400 font-bold uppercase tracking-[0.15em] text-[9px] md:text-[10px]">
                Formatos PDF oficiales de FTRA
              </p>
            </div>
          </div>
          {isEditor && (
            <button
              onClick={handleAddNewFormat}
              className="w-full sm:w-auto flex items-center justify-center gap-3 px-6 py-3.5 bg-[#004C6C] text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-[#003a53] shadow-lg shadow-blue-900/10 transition-all active:scale-95 shrink-0 cursor-pointer"
            >
              <PlusCircle size={18} />
              Nuevo Formato
            </button>
          )}
        </div>

        {/* Dónde se administra lo demás */}
        <div className="flex items-start gap-3 p-4 bg-blue-50/60 border border-blue-100 rounded-2xl text-xs text-slate-600 font-semibold">
          <Info size={16} className="text-[#004C6C] shrink-0 mt-0.5" />
          <ul className="space-y-1">
            <li><strong className="text-[#004C6C]">Proveedores:</strong> se crean en Contratación, al registrar el contrato.</li>
            <li><strong className="text-[#004C6C]">Torres, pisos y apartamentos:</strong> se configuran en Administración › Proyectos.</li>
            <li><strong className="text-[#004C6C]">Residente responsable:</strong> es el usuario que registra el FTRA.</li>
          </ul>
        </div>

        {/* Filtros */}
        <div className="grid grid-cols-1 sm:grid-cols-[1fr_200px_auto] gap-3 sm:items-end">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Buscar</label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300">
                <Search size={16} />
              </div>
              <input
                type="text"
                placeholder="Nombre o código..."
                value={formatsData.filters.search}
                onChange={e => formatsData.setFilter('search', e.target.value)}
                className="w-full bg-slate-50/50 border border-slate-100 rounded-2xl pl-11 pr-4 py-3.5 text-xs font-bold text-slate-700 focus:bg-white focus:border-[#004C6C] outline-none transition-all"
              />
            </div>
          </div>
          <CustomSelect
            label="Estado"
            placeholder="Todos los estados"
            options={[
              { value: 'true', label: 'Activo' },
              { value: 'false', label: 'Inactivo' }
            ]}
            value={formatsData.filters.is_active}
            onChange={val => formatsData.setFilter('is_active', val)}
          />
          <button
            onClick={formatsData.clearFilters}
            className="flex items-center justify-center gap-2 px-5 py-3.5 bg-slate-50 text-slate-500 rounded-2xl font-bold text-xs hover:bg-slate-100 hover:text-slate-700 transition-all border border-slate-100 cursor-pointer"
          >
            <RotateCcw size={14} />
            Limpiar
          </button>
        </div>

        {formatsData.error && (
          <div className="p-4 bg-red-50 border border-red-100 rounded-2xl text-xs font-bold text-red-600 text-center flex items-center gap-2 justify-center">
            <AlertCircle size={16} />
            <span>{formatsData.error}</span>
          </div>
        )}

        <div className="flex-1 overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
          <FormatTable
            formats={formatsData.formats}
            isLoading={formatsData.loading}
            isEditor={isEditor}
            onEditFormat={handleEditFormat}
            onDeleteFormat={handleDeleteFormat}
          />
        </div>

        {formatsData.totalItems > 0 && (
          <Pagination
            currentPage={formatsData.currentPage}
            totalPages={formatsData.totalPages}
            onPageChange={formatsData.setCurrentPage}
            totalItems={formatsData.totalItems}
            perPage={formatsData.perPage}
            onPerPageChange={formatsData.setPerPage}
          />
        )}
      </div>

      <FormatModal
        isOpen={isFormatModalOpen}
        onClose={() => setIsFormatModalOpen(false)}
        onSave={handleSaveFormat}
        format={selectedFormat}
      />
    </div>
  );
}
