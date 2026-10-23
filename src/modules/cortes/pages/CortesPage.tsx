import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Scissors, Plus, Search, X, FileText, ClipboardCheck, Layers, Eye } from 'lucide-react';
import { DataTable } from '../../../components/ui/DataTable';
import { CustomSelect } from '../../../components/ui/CustomSelect';
import { Pagination } from '../../../components/ui/Pagination';
import { Tabs } from '../../../components/ui/Tabs';
import { useAuth } from '../../../context/AuthContext';
import { useNotification } from '../../../context/NotificationContext';
import { formatDateTime } from '../../../utils/dateUtils';
import { useCortes } from '../hooks/useCortes';
import { CorteFormModal } from '../components/CorteFormModal';
import { CorteDetailModal } from '../components/CorteDetailModal';
import { CorteStatusBadge } from '../components/CorteStatusBadge';
import type { Corte, CortePayload, CorteScope } from '../types';

export default function CortesPage() {
  const { useCan } = useAuth();
  const { showNotification } = useNotification();
  const [searchParams, setSearchParams] = useSearchParams();
  const {
    catalogs, cortes, counts, scope, filters, page, perPage, pagination, loading, error,
    setScope, setFilter, clearFilters, setPage, changePerPage, createCorte, resubmitCorte, reviewCorte,
  } = useCortes();

  const canCreate = useCan('cortes.crear');
  const isReviewer = (catalogs?.review_stages.length ?? 0) > 0;

  const [formOpen, setFormOpen] = useState(false);
  const [resubmitting, setResubmitting] = useState<Corte | null>(null);
  const [selectedId, setDetailId] = useState<number | null>(null);

  // El enlace "Ver corte" de los correos abre el detalle: /app/cortes?corte=<id>
  const detailId = selectedId ?? (Number(searchParams.get('corte')) || null);

  const closeDetail = () => {
    setDetailId(null);
    if (searchParams.has('corte')) {
      const next = new URLSearchParams(searchParams);
      next.delete('corte');
      setSearchParams(next, { replace: true });
    }
  };

  const tabs = useMemo(() => [
    { id: 'mine', label: 'Mis registros', icon: <FileText size={14} />, count: counts.mine },
    ...(isReviewer ? [{ id: 'pending', label: 'Por revisar', icon: <ClipboardCheck size={14} />, count: counts.pending }] : []),
    ...(catalogs?.can_view_all ? [{ id: 'all', label: 'Todos', icon: <Layers size={14} /> }] : []),
  ], [counts, isReviewer, catalogs]);

  const hasFilters = Boolean(filters.search || filters.status || filters.project_id);

  const handleSave = async (payload: CortePayload, id?: number) => {
    const saved = id ? await resubmitCorte(id, payload) : await createCorte(payload);
    showNotification(id ? 'Corte reenviado al Interventor.' : 'Corte registrado. Se notificó al Interventor.', 'success');
    return saved;
  };

  const handleReview = async (id: number, decision: 'aprobar' | 'devolver', comment?: string) => {
    const corte = await reviewCorte(id, decision, comment);
    showNotification(decision === 'aprobar' ? 'Corte aprobado.' : 'Corte devuelto al residente.', 'success');
    return corte;
  };

  const openResubmit = (corte: Corte) => {
    closeDetail();
    setResubmitting(corte);
    setFormOpen(true);
  };

  const columns = [
    {
      header: 'Corte',
      accessor: (c: Corte) => (
        <div className="min-w-[140px]">
          <p className="font-black text-[#004C6C]">{c.code}</p>
          <p className="text-[11px] text-slate-400 truncate max-w-[220px]" title={c.file_name}>{c.file_name}</p>
        </div>
      ),
    },
    {
      header: 'Proyecto / Torre',
      accessor: (c: Corte) => (
        <div className="min-w-[140px]">
          <p>{c.project?.name ?? '—'}</p>
          <p className="text-[11px] text-slate-400">{c.tower?.name ?? 'Sin torre'}</p>
        </div>
      ),
    },
    {
      header: 'Proveedor / Contrato',
      accessor: (c: Corte) => (
        <div className="max-w-[260px]">
          <p className="truncate" title={c.contractor?.name}>{c.contractor?.name ?? '—'}</p>
          <p className="text-[11px] text-slate-400">{c.contract?.contract_code ?? '—'}</p>
        </div>
      ),
    },
    {
      header: scope === 'mine' ? 'Radicado' : 'Radicado por',
      accessor: (c: Corte) => (
        <div className="text-[11px] leading-5 whitespace-nowrap">
          {scope !== 'mine' && <p className="text-sm">{c.created_by?.name ?? '—'}</p>}
          <p className="text-slate-400">{formatDateTime(c.created_at)}</p>
        </div>
      ),
    },
    {
      header: 'Estado',
      accessor: (c: Corte) => <CorteStatusBadge status={c.status} label={c.status_label} />,
    },
    {
      header: 'Acciones',
      className: 'text-right',
      accessor: (c: Corte) => (
        <div className="flex justify-end" onClick={(e) => e.stopPropagation()}>
          <button onClick={() => setDetailId(c.id)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap ${c.can_review || c.can_resubmit ? 'bg-[#EE9D4C] text-white hover:bg-[#e08a35]' : 'text-[#004C6C] hover:bg-blue-50'}`}>
            <Eye size={15} /> {c.can_review ? 'Revisar' : c.can_resubmit ? 'Corregir' : 'Ver'}
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="max-w-[1600px] mx-auto flex flex-col gap-6 md:gap-8 py-4 md:py-6 px-4 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-gradient-to-r from-[#004C6C] via-[#005981] to-[#003850] p-6 md:p-8 rounded-[32px] text-white shadow-xl relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-white/5 rounded-full blur-3xl" />
        <div className="flex items-center gap-4 relative z-10">
          <div className="h-14 w-14 bg-white/10 rounded-2xl flex items-center justify-center border border-white/10">
            <Scissors size={28} />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight">Registro de Corte</h1>
            <p className="text-xs font-bold text-white/60 uppercase tracking-widest mt-1">
              Interventor · Director de Obra · Gerencia
            </p>
          </div>
        </div>
        {canCreate && (
          <button onClick={() => { setResubmitting(null); setFormOpen(true); }}
            className="relative z-10 flex items-center justify-center gap-2 bg-[#EE9D4C] hover:bg-[#e08a35] text-white px-6 py-3.5 rounded-2xl font-bold shadow-lg transition-all hover:scale-[1.02]">
            <Plus size={18} /> Registrar corte
          </button>
        )}
      </div>

      {tabs.length > 1 && (
        <Tabs items={tabs} activeTab={scope} onChange={(id) => setScope(id as CorteScope)} centered={false} />
      )}

      {/* Filtros */}
      <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm p-5 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-[2fr_1fr_1fr_auto] gap-4 items-end">
        <div className="relative">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
          <input
            className="w-full bg-slate-50 border border-slate-100 rounded-2xl pl-12 pr-4 py-3.5 text-sm font-bold text-slate-700 outline-none focus:border-[#004C6C]"
            placeholder="Buscar por código, proveedor, contrato o archivo"
            value={filters.search}
            onChange={(e) => setFilter('search', e.target.value)}
          />
        </div>
        <CustomSelect
          placeholder="Proyecto"
          clearable
          onClear={() => setFilter('project_id', '')}
          options={(catalogs?.projects ?? []).map((p) => ({ value: String(p.id), label: p.name }))}
          value={filters.project_id}
          onChange={(v) => setFilter('project_id', String(v))}
        />
        <CustomSelect
          placeholder="Estado"
          searchable={false}
          clearable
          onClear={() => setFilter('status', '')}
          options={(catalogs?.statuses ?? []).map((s) => ({ value: s.key, label: s.label }))}
          value={filters.status}
          onChange={(v) => setFilter('status', String(v))}
        />
        {hasFilters ? (
          <button onClick={clearFilters} className="p-3.5 rounded-2xl bg-slate-50 text-slate-400 hover:bg-slate-100" title="Limpiar filtros">
            <X size={16} />
          </button>
        ) : <span />}
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-100 rounded-2xl text-xs font-bold text-red-600 text-center">{error}</div>
      )}

      <DataTable
        columns={columns}
        data={cortes}
        isLoading={loading}
        onRowClick={(c) => setDetailId(c.id)}
        emptyMessage={scope === 'pending' ? 'No tienes cortes pendientes de revisión.' : 'Aún no hay cortes registrados.'}
      />

      {pagination.total > 0 && (
        <Pagination
          currentPage={page}
          totalPages={pagination.lastPage}
          onPageChange={setPage}
          totalItems={pagination.total}
          perPage={perPage}
          onPerPageChange={changePerPage}
        />
      )}

      <CorteFormModal
        isOpen={formOpen}
        onClose={() => setFormOpen(false)}
        onSave={handleSave}
        catalogs={catalogs}
        corte={resubmitting}
      />

      <CorteDetailModal
        corteId={detailId}
        onClose={closeDetail}
        onReview={handleReview}
        onResubmit={openResubmit}
      />
    </div>
  );
}
