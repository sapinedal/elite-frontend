import { useState } from 'react';
import { Search, SlidersHorizontal, RotateCcw, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { useFtraRecords } from '../hooks/useFtraRecords';
import { FtraRecordTable } from '../components/FtraRecordTable';
import { FtraRecordDetailModal } from '../components/FtraRecordDetailModal';
import { AptoSemaphorizationGrid } from '../components/AptoSemaphorizationGrid';
import { CustomSelect } from '../../../components/ui/CustomSelect';
import { Pagination } from '../../../components/ui/Pagination';
import type { FtraRecord } from '../types';

export default function SeguimientoPage() {
  const {
    records,
    formats,
    contractors,
    loading,
    error,
    filters,
    currentPage,
    perPage,
    totalItems,
    totalPages,
    setCurrentPage,
    setPerPage,
    setFilter,
    clearFilters,
    updateRecordStatus,
  } = useFtraRecords();

  const [selectedRecord, setSelectedRecord] = useState<FtraRecord | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const handleOpenDetails = (record: FtraRecord) => {
    setSelectedRecord(record);
    setIsDetailModalOpen(true);
  };

  const handleUpdateStatus = async (id: number, status: any) => {
    const updated = await updateRecordStatus(id, status);
    // Actualizar el registro seleccionado localmente si está abierto
    if (selectedRecord && selectedRecord.id === id) {
      setSelectedRecord(updated);
    }
  };

  return (
    <div className="max-w-[1600px] mx-auto flex flex-col min-h-[calc(100vh-140px)] gap-6 md:gap-8 py-4 md:py-8 px-4 relative">
      
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
                <p className="text-[9px] uppercase font-black text-slate-300 tracking-[0.15em]">Seguimiento FTRA</p>
              </div>
            </div>
            <button
              onClick={() => setIsSidebarCollapsed(true)}
              className="p-2 hover:bg-slate-50 rounded-xl text-slate-300 hover:text-slate-500 transition-colors cursor-pointer"
            >
              <ChevronLeft size={20} />
            </button>
          </div>

          <div className="p-6 space-y-6 overflow-y-auto max-h-[70vh]">
            {/* Búsqueda por Texto */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Buscar</label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300">
                  <Search size={16} />
                </div>
                <input
                  type="text"
                  placeholder="Proveedor o Formato..."
                  value={filters.search}
                  onChange={e => setFilter('search', e.target.value)}
                  className="w-full bg-slate-50/50 border border-slate-100 rounded-2xl pl-11 pr-4 py-3.5 text-xs font-bold text-slate-700 focus:bg-white focus:border-[#004C6C] outline-none transition-all"
                />
              </div>
            </div>

            {/* Filtrar por Contratista */}
            <div>
              <CustomSelect
                label="Filtrar por Proveedor"
                placeholder="Todos los proveedores"
                options={contractors.map(c => ({ value: c.id.toString(), label: c.name }))}
                value={filters.contractor_id}
                onChange={val => setFilter('contractor_id', val)}
              />
            </div>

            {/* Filtrar por Formato */}
            <div>
              <CustomSelect
                label="Filtrar por Formato"
                placeholder="Todos los formatos"
                options={formats.map(f => ({ value: f.id.toString(), label: `[${f.code}] ${f.name}` }))}
                value={filters.format_id}
                onChange={val => setFilter('format_id', val)}
              />
            </div>

            {/* Filtrar por Estado */}
            <div>
              <CustomSelect
                label="Filtrar por Estado"
                placeholder="Todos los estados"
                options={[
                  { value: 'Registrada', label: 'Registrada' },
                  { value: 'Seguimiento', label: 'Seguimiento' },
                  { value: 'Aprobada', label: 'Aprobada' },
                  { value: 'Rechazada', label: 'Rechazada' }
                ]}
                value={filters.status}
                onChange={val => setFilter('status', val)}
              />
            </div>

            {/* Limpiar Filtros */}
            <div className="pt-2">
              <button
                onClick={clearFilters}
                className="w-full flex items-center justify-center gap-2 px-5 py-3.5 bg-slate-50 text-slate-500 rounded-xl font-bold text-xs hover:bg-slate-100 hover:text-slate-700 transition-all border border-slate-100 shadow-xs cursor-pointer"
              >
                <RotateCcw size={14} />
                Limpiar Filtros
              </button>
            </div>
          </div>
        </div>

        {/* Panel Derecho: Tabla de Seguimiento */}
        <div className="flex-1 min-w-0 bg-white rounded-[40px] shadow-[0_8px_40px_rgb(0,0,0,0.03)] border border-slate-100 p-8 space-y-8 flex flex-col relative z-10 animate-fade-in">
          
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <h1 className="text-3xl font-black text-[#004C6C] tracking-tight">Seguimiento de FTRA</h1>
              <p className="text-slate-400 font-bold uppercase tracking-[0.2em] text-[10px]">
                Monitoreo de inspecciones, estados de aprobación y evidencias fotográficas
              </p>
            </div>
          </div>

          {/* Mensajes de Error */}
          {error && (
            <div className="p-4 bg-red-50 border border-red-100 rounded-2xl text-xs font-bold text-red-600 text-center flex items-center gap-2 justify-center">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {/* Semaforización de 200 Apartamentos Torre 2 */}
          <AptoSemaphorizationGrid />

          {/* Tabla */}
          <div className="flex-1 overflow-x-auto">
            <FtraRecordTable
              records={records}
              isLoading={loading}
              onOpenDetails={handleOpenDetails}
              onUpdateStatus={handleUpdateStatus}
            />
          </div>

          {/* Paginación */}
          {totalItems > 0 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              totalItems={totalItems}
              perPage={perPage}
              onPerPageChange={setPerPage}
            />
          )}

          {/* Feedback del registro */}
          <div className="flex justify-between items-center px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl">
            <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">
              Visualizando <strong className="text-[#004C6C] font-black">{records.length}</strong> de <strong className="text-slate-700 font-black">{totalItems}</strong> registros de auditorías FTRA
            </span>
          </div>

        </div>

      </div>

      {/* Modal de detalles */}
      <FtraRecordDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        record={selectedRecord}
        onUpdateStatus={handleUpdateStatus}
      />

    </div>
  );
}
