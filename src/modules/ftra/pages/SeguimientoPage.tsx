import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ClipboardCheck, Search, X, LayoutGrid, List, FileSpreadsheet, Loader2 } from 'lucide-react';
import { useFtraRecords } from '../hooks/useFtraRecords';
import { FtraRecordTable } from '../components/FtraRecordTable';
import { FtraRecordDetailModal } from '../components/FtraRecordDetailModal';
import { AptoSemaphorizationGrid } from '../components/AptoSemaphorizationGrid';
import { CustomSelect } from '../../../components/ui/CustomSelect';
import { Pagination } from '../../../components/ui/Pagination';
import { Tabs } from '../../../components/ui/Tabs';
import { useProject } from '../../../context/ProjectContext';
import { ftraRecordService } from '../services/ftraRecordService';
import { useNotification } from '../../../context/NotificationContext';
import { getErrorMessage } from '../../../lib/apiError';
import { FTRA_STATUS_LABELS, type FtraRecord, type FtraRecordStatus } from '../types';

type TabId = 'registros' | 'matriz';

const STATUS_OPTIONS: FtraRecordStatus[] = ['Registrada', 'Seguimiento', 'Devuelta', 'Aprobada'];

/**
 * Seguimiento de FTRA con la misma línea de Contratación y Cortes:
 * encabezado, pestañas (Registros / Matriz de apartamentos), filtros y tabla.
 */
export default function SeguimientoPage() {
  const { activeProject } = useProject();
  const { showNotification } = useNotification();
  const {
    records, formats, contractors, towers, loading, error, filters,
    currentPage, perPage, totalItems, totalPages, setCurrentPage, setPerPage, setFilter, clearFilters, fetchRecords,
  } = useFtraRecords();

  const [searchParams, setSearchParams] = useSearchParams();
  const [tab, setTab] = useState<TabId>('registros');
  const [selectedRecord, setSelectedRecord] = useState<FtraRecord | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [exporting, setExporting] = useState(false);

  // El detalle siempre se pide al backend: trae el historial y las acciones permitidas
  const openRecord = useCallback(async (id: number) => {
    try {
      setSelectedRecord(await ftraRecordService.getRecordById(id));
    } catch (err) {
      showNotification(getErrorMessage(err, 'No se pudo abrir el FTRA.'), 'error');
    }
  }, [showNotification]);

  // Enlace de los correos: /app/ftra/seguimiento?registro=ID
  useEffect(() => {
    const id = Number(searchParams.get('registro'));
    if (!id) return;
    openRecord(id);
    searchParams.delete('registro');
    setSearchParams(searchParams, { replace: true });
  }, [searchParams, setSearchParams, openRecord]);

  const handleChanged = (updated: FtraRecord) => {
    setSelectedRecord(updated);
    setRefreshKey(k => k + 1);
    fetchRecords();
  };

  const hasFilters = Boolean(filters.search || filters.contractor_id || filters.format_id || filters.tower_id || filters.status);

  const handleExport = async () => {
    setExporting(true);
    try {
      const params = Object.fromEntries(Object.entries(filters).filter(([, v]) => v !== '' && v != null));
      await ftraRecordService.exportExcel(params);
    } catch (err) {
      showNotification(getErrorMessage(err, 'No se pudo generar el informe.'), 'error');
    } finally {
      setExporting(false);
    }
  };

  if (!activeProject) {
    return (
      <div className="flex h-[60vh] items-center justify-center font-bold text-slate-400">
        Selecciona un proyecto para ver el seguimiento de FTRA.
      </div>
    );
  }

  return (
    <div className="max-w-[1600px] mx-auto flex flex-col gap-6 md:gap-8 py-4 md:py-6 px-4 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-gradient-to-r from-[#004C6C] via-[#005981] to-[#003850] p-6 md:p-8 rounded-[32px] text-white shadow-xl relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-white/5 rounded-full blur-3xl" />
        <div className="flex items-center gap-4 relative z-10">
          <div className="h-14 w-14 shrink-0 bg-white/10 rounded-2xl flex items-center justify-center border border-white/10">
            <ClipboardCheck size={28} />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight">Seguimiento de FTRA</h1>
            <p className="text-xs font-bold text-white/60 uppercase tracking-widest mt-1">
              {activeProject.name} · Supervisor · Director de Obra
            </p>
          </div>
        </div>
        <button
          onClick={handleExport}
          disabled={exporting}
          title="Descarga los registros con los filtros actuales y la matriz por apartamento y formato"
          className="relative z-10 flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white px-5 py-3.5 rounded-2xl font-bold transition-all disabled:opacity-60"
        >
          {exporting ? <Loader2 size={18} className="animate-spin" /> : <FileSpreadsheet size={18} />} Exportar Excel
        </button>
      </div>

      <Tabs
        activeTab={tab}
        onChange={id => setTab(id as TabId)}
        items={[
          { id: 'registros', label: 'Registros', icon: <List size={14} />, count: totalItems },
          { id: 'matriz', label: 'Matriz', icon: <LayoutGrid size={14} /> },
        ]}
      />

      {error && (
        <div className="p-4 bg-red-50 border border-red-100 rounded-2xl text-xs font-bold text-red-600 text-center">{error}</div>
      )}

      {tab === 'matriz' ? (
        <AptoSemaphorizationGrid formats={formats} refreshKey={refreshKey} onOpenRecord={openRecord} />
      ) : (
        <>
          {/* Filtros */}
          <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm p-4 md:p-5 grid grid-cols-2 xl:grid-cols-[2fr_1fr_1fr_1fr_1fr_auto] gap-3 md:gap-4 items-center">
            <div className="relative col-span-2 xl:col-span-1">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
              <input
                className="w-full bg-slate-50 border border-slate-100 rounded-2xl pl-12 pr-4 py-3.5 text-sm font-bold text-slate-700 outline-none focus:border-[#004C6C]"
                placeholder="Buscar por proveedor o formato"
                value={filters.search}
                onChange={e => setFilter('search', e.target.value)}
              />
            </div>
            <CustomSelect
              pyClass="py-3.5"
              placeholder="Estado"
              searchable={false}
              clearable
              onClear={() => setFilter('status', '')}
              options={STATUS_OPTIONS.map(s => ({ value: s, label: FTRA_STATUS_LABELS[s] }))}
              value={filters.status}
              onChange={v => setFilter('status', String(v))}
            />
            <CustomSelect
              pyClass="py-3.5"
              placeholder="Formato"
              clearable
              onClear={() => setFilter('format_id', '')}
              options={formats.map(f => ({ value: String(f.id), label: `[${f.code}] ${f.name}` }))}
              value={filters.format_id}
              onChange={v => setFilter('format_id', String(v))}
            />
            <CustomSelect
              pyClass="py-3.5"
              placeholder="Proveedor"
              clearable
              onClear={() => setFilter('contractor_id', '')}
              options={contractors.map(c => ({ value: String(c.id), label: c.name }))}
              value={filters.contractor_id}
              onChange={v => setFilter('contractor_id', String(v))}
            />
            <CustomSelect
              pyClass="py-3.5"
              placeholder="Torre"
              searchable={false}
              clearable
              onClear={() => setFilter('tower_id', '')}
              options={towers.map(t => ({ value: String(t.id), label: t.name }))}
              value={filters.tower_id}
              onChange={v => setFilter('tower_id', String(v))}
            />
            {hasFilters ? (
              <button onClick={clearFilters} className="col-span-2 xl:col-span-1 flex items-center justify-center gap-2 p-3.5 rounded-2xl bg-slate-50 text-slate-400 hover:bg-slate-100 text-xs font-bold" title="Limpiar filtros">
                <X size={16} /> <span className="xl:hidden">Limpiar filtros</span>
              </button>
            ) : <span className="hidden xl:block" />}
          </div>

          <FtraRecordTable
            records={records}
            isLoading={loading}
            onOpenDetails={record => openRecord(record.id)}
            emptyMessage={hasFilters ? 'No hay FTRA para los filtros seleccionados.' : 'Aún no hay FTRA registrados en este proyecto.'}
          />

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
        </>
      )}

      <FtraRecordDetailModal
        isOpen={selectedRecord !== null}
        onClose={() => setSelectedRecord(null)}
        record={selectedRecord}
        onChanged={handleChanged}
      />
    </div>
  );
}
