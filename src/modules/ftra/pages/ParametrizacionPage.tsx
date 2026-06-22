import { useState } from 'react';
import { FileText, Type, Search, SlidersHorizontal, RotateCcw, PlusCircle, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { useFormats } from '../hooks/useFormats';
import { useContractors } from '../hooks/useContractors';
import { FormatTable } from '../components/FormatTable';
import { FormatModal } from '../components/FormatModal';
import { ContractorTable } from '../components/ContractorTable';
import { ContractorModal } from '../components/ContractorModal';
import { CustomSelect } from '../../../components/ui/CustomSelect';
import { Pagination } from '../../../components/ui/Pagination';
import type { FtraFormat, FtraContractor } from '../types';

type ActiveTab = 'formats' | 'contractors';

export default function ParametrizacionPage() {
  const { user } = useAuth();
  // Forzado a true temporalmente para permitir pruebas del CRUD sin Spatie
  const isEditor = true || !!user;

  const [activeTab, setActiveTab] = useState<ActiveTab>('formats');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Hooks de datos
  const formatsData = useFormats();
  const contractorsData = useContractors();

  // Modales
  const [selectedFormat, setSelectedFormat] = useState<FtraFormat | null>(null);
  const [isFormatModalOpen, setIsFormatModalOpen] = useState(false);

  const [selectedContractor, setSelectedContractor] = useState<FtraContractor | null>(null);
  const [isContractorModalOpen, setIsContractorModalOpen] = useState(false);

  // Handlers para Formatos
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
      } catch (err: any) {
        alert(err.message || 'Error al eliminar el formato.');
      }
    }
  };

  // Handlers para Contratistas
  const handleAddNewContractor = () => {
    setSelectedContractor(null);
    setIsContractorModalOpen(true);
  };

  const handleEditContractor = (contractor: FtraContractor) => {
    setSelectedContractor(contractor);
    setIsContractorModalOpen(true);
  };

  const handleSaveContractor = async (data: Partial<FtraContractor>) => {
    if (selectedContractor) {
      await contractorsData.updateContractor(selectedContractor.id, data);
    } else {
      await contractorsData.createContractor(data);
    }
  };

  const handleDeleteContractor = async (id: number) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este proveedor/contratista?')) {
      try {
        await contractorsData.deleteContractor(id);
      } catch (err: any) {
        alert(err.message || 'Error al eliminar el contratista.');
      }
    }
  };

  return (
    <div className="max-w-[1600px] mx-auto flex flex-col min-h-[calc(100vh-140px)] gap-6 md:gap-8 py-4 md:py-8 px-4 relative">
      
      {/* Pestañas Centradas en la parte superior */}
      <div className="flex justify-center w-full">
        <div className="bg-slate-100/80 backdrop-blur-xs p-1 rounded-full flex items-center shadow-xs border border-slate-200/50">
          <button
            onClick={() => setActiveTab('formats')}
            className={`px-8 py-3 rounded-full font-black text-xs uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'formats'
                ? 'bg-[#004C6C] text-white shadow-md'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <FileText size={14} />
            Formatos PDF
          </button>
          <button
            onClick={() => setActiveTab('contractors')}
            className={`px-8 py-3 rounded-full font-black text-xs uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'contractors'
                ? 'bg-[#004C6C] text-white shadow-md'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Type size={14} />
            Proveedores / Contratistas
          </button>
        </div>
      </div>

      {/* Botón para abrir filtros colapsados - Flota globalmente sobre la barra ELITE */}
      {isSidebarCollapsed && (
        <button
          onClick={() => setIsSidebarCollapsed(false)}
          className="fixed left-0 top-1/2 -translate-y-1/2 z-50 h-32 w-10 bg-[#004C6C] text-white rounded-r-3xl flex items-center justify-center shadow-[4px_0_24px_rgba(0,76,108,0.3)] hover:w-12 transition-all group overflow-hidden border-y border-r border-blue-400/20 cursor-pointer"
          title="Mostrar Filtros"
        >
          <div className="rotate-180 [writing-mode:vertical-lr] flex items-center justify-center gap-3 whitespace-nowrap">
            <span className="text-[11px] font-black uppercase tracking-[0.2em] leading-none">Filtros</span>
            <ChevronRight size={16} className="-rotate-90 text-blue-200 group-hover:text-white transition-colors" />
          </div>
        </button>
      )}

      <div className="flex flex-col lg:flex-row gap-6 md:gap-8">
        
        {/* Panel Lateral Izquierdo: Filtros */}
        <div className={`transition-all duration-500 ease-in-out flex flex-col bg-white rounded-[40px] shadow-[0_8px_40px_rgb(0,0,0,0.03)] border border-slate-100 overflow-hidden shrink-0 relative animate-fade-in ${
          isSidebarCollapsed ? 'w-0 lg:w-0 opacity-0 -ml-8 overflow-hidden' : 'w-full lg:w-80'
        }`}>
          
          <div className="p-6 border-b border-slate-50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-slate-50 rounded-xl text-[#004C6C]">
                <SlidersHorizontal size={20} />
              </div>
              <div>
                <h2 className="text-md font-black text-[#004C6C] tracking-tight">Filtros</h2>
                <p className="text-[9px] uppercase font-black text-slate-300 tracking-[0.15em]">Búsqueda Avanzada</p>
              </div>
            </div>

            <button
              onClick={() => setIsSidebarCollapsed(true)}
              className="p-2 hover:bg-slate-50 rounded-xl text-slate-300 hover:text-slate-500 transition-colors cursor-pointer"
            >
              <ChevronLeft size={20} />
            </button>
          </div>

          <div className="p-6 space-y-6">
            {/* Filtros comunes */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Buscar</label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300">
                  <Search size={16} />
                </div>
                <input
                  type="text"
                  placeholder="Escribe palabra clave..."
                  value={activeTab === 'formats' ? formatsData.filters.search : contractorsData.filters.search}
                  onChange={e => {
                    if (activeTab === 'formats') {
                      formatsData.setFilter('search', e.target.value);
                    } else {
                      contractorsData.setFilter('search', e.target.value);
                    }
                  }}
                  className="w-full bg-slate-50/50 border border-slate-100 rounded-2xl pl-11 pr-4 py-3.5 text-xs font-bold text-slate-700 focus:bg-white focus:border-[#004C6C] outline-none transition-all"
                />
              </div>
            </div>

            <div>
              <CustomSelect
                label="Estado"
                placeholder="Todos los estados"
                options={[
                  { value: 'true', label: 'Activo' },
                  { value: 'false', label: 'Inactivo' }
                ]}
                value={activeTab === 'formats' ? formatsData.filters.is_active : contractorsData.filters.is_active}
                onChange={val => {
                  if (activeTab === 'formats') {
                    formatsData.setFilter('is_active', val);
                  } else {
                    contractorsData.setFilter('is_active', val);
                  }
                }}
              />
            </div>

            <div className="pt-2">
              <button
                onClick={() => {
                  if (activeTab === 'formats') {
                    formatsData.clearFilters();
                  } else {
                    contractorsData.clearFilters();
                  }
                }}
                className="w-full flex items-center justify-center gap-2 px-5 py-3.5 bg-slate-50 text-slate-500 rounded-xl font-bold text-xs hover:bg-slate-100 hover:text-slate-700 transition-all border border-slate-100 shadow-xs cursor-pointer"
              >
                <RotateCcw size={14} />
                Limpiar Filtros
              </button>
            </div>
          </div>
        </div>

        {/* Panel Derecho: Contenido Principal de Parametrización */}
        <div className="flex-1 min-w-0 bg-white rounded-[40px] shadow-[0_8px_40px_rgb(0,0,0,0.03)] border border-slate-100 p-8 space-y-8 flex flex-col relative z-10 animate-fade-in">
          
          {/* HEADER PRINCIPAL */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <h1 className="text-3xl font-black text-[#004C6C] tracking-tight">
                {activeTab === 'formats' ? 'Formatos de Documento' : 'Proveedores y Contratistas'}
              </h1>
              <p className="text-slate-400 font-bold uppercase tracking-[0.2em] text-[10px]">
                {activeTab === 'formats' 
                  ? 'Administración y carga de formatos PDF oficiales de FTRA' 
                  : 'Parametrización de contratistas y proveedores autorizados'}
              </p>
            </div>
            {isEditor && (
              <div className="flex flex-wrap items-center gap-3 shrink-0">
                <button
                  onClick={activeTab === 'formats' ? handleAddNewFormat : handleAddNewContractor}
                  className="flex items-center justify-center gap-3 px-6 py-3.5 bg-[#004C6C] text-white rounded-[20px] font-black text-xs uppercase tracking-widest hover:bg-[#003a53] shadow-lg shadow-blue-900/10 transition-all hover:scale-[1.02] active:scale-95 group shrink-0 cursor-pointer"
                >
                  <PlusCircle size={18} className="transition-transform group-hover:rotate-90 duration-300" />
                  {activeTab === 'formats' ? 'Nuevo Formato' : 'Nuevo Contratista'}
                </button>
              </div>
            )}
          </div>

          {/* MENSAJES DE ERROR */}
          {activeTab === 'formats' && formatsData.error && (
            <div className="p-4 bg-red-50 border border-red-100 rounded-2xl text-xs font-bold text-red-600 text-center flex items-center gap-2 justify-center">
              <AlertCircle size={16} />
              <span>{formatsData.error}</span>
            </div>
          )}
          {activeTab === 'contractors' && contractorsData.error && (
            <div className="p-4 bg-red-50 border border-red-100 rounded-2xl text-xs font-bold text-red-600 text-center flex items-center gap-2 justify-center">
              <AlertCircle size={16} />
              <span>{contractorsData.error}</span>
            </div>
          )}

          {/* TABLA DE RESULTADOS */}
          <div className="flex-1 overflow-x-auto">
            {activeTab === 'formats' ? (
              <FormatTable
                formats={formatsData.formats}
                isLoading={formatsData.loading}
                isEditor={isEditor}
                onEditFormat={handleEditFormat}
                onDeleteFormat={handleDeleteFormat}
              />
            ) : (
              <ContractorTable
                contractors={contractorsData.contractors}
                isLoading={contractorsData.loading}
                isEditor={isEditor}
                onEditContractor={handleEditContractor}
                onDeleteContractor={handleDeleteContractor}
              />
            )}
          </div>

          {/* PAGINACIÓN */}
          {activeTab === 'formats' && formatsData.totalItems > 0 && (
            <Pagination
              currentPage={formatsData.currentPage}
              totalPages={formatsData.totalPages}
              onPageChange={formatsData.setCurrentPage}
              totalItems={formatsData.totalItems}
              perPage={formatsData.perPage}
              onPerPageChange={formatsData.setPerPage}
            />
          )}

          {activeTab === 'contractors' && contractorsData.totalItems > 0 && (
            <Pagination
              currentPage={contractorsData.currentPage}
              totalPages={contractorsData.totalPages}
              onPageChange={contractorsData.setCurrentPage}
              totalItems={contractorsData.totalItems}
              perPage={contractorsData.perPage}
              onPerPageChange={contractorsData.setPerPage}
            />
          )}

          {/* FEEDBACK DEL REGISTRO ACTIVO */}
          <div className="flex justify-between items-center px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl">
            <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">
              {activeTab === 'formats' ? (
                <>
                  Visualizando <strong className="text-[#004C6C] font-black">{formatsData.formats.length}</strong> de <strong className="text-slate-700 font-black">{formatsData.totalItems}</strong> formatos en total
                </>
              ) : (
                <>
                  Visualizando <strong className="text-[#004C6C] font-black">{contractorsData.contractors.length}</strong> de <strong className="text-slate-700 font-black">{contractorsData.totalItems}</strong> proveedores autorizados
                </>
              )}
            </span>
          </div>

        </div>

      </div>

      {/* MODALES DE GESTIÓN */}
      <FormatModal
        isOpen={isFormatModalOpen}
        onClose={() => setIsFormatModalOpen(false)}
        onSave={handleSaveFormat}
        format={selectedFormat}
      />

      <ContractorModal
        isOpen={isContractorModalOpen}
        onClose={() => setIsContractorModalOpen(false)}
        onSave={handleSaveContractor}
        contractor={selectedContractor}
      />

    </div>
  );
}
