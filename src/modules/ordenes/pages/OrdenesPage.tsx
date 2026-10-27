import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ShoppingCart, Plus, Search, X, FileText, ClipboardCheck, Layers, Eye, Package, Upload } from 'lucide-react';
import { DataTable } from '../../../components/ui/DataTable';
import { CustomSelect } from '../../../components/ui/CustomSelect';
import { Pagination } from '../../../components/ui/Pagination';
import { Tabs } from '../../../components/ui/Tabs';
import { useNotification } from '../../../context/NotificationContext';
import { formatDateTime } from '../../../utils/dateUtils';
import { useOrdenes } from '../hooks/useOrdenes';
import { OrdenFormModal } from '../components/OrdenFormModal';
import { OrdenDetailModal } from '../components/OrdenDetailModal';
import { OrdenStatusBadge } from '../components/OrdenStatusBadge';
import type { Orden, OrdenDocumentPayload, OrdenPayload, OrdenScope } from '../types';

export default function OrdenesPage() {
  const { showNotification } = useNotification();
  const [searchParams, setSearchParams] = useSearchParams();
  const {
    catalogs, ordenes, counts, scope, filters, page, perPage, pagination, loading, error,
    setScope, setFilter, clearFilters, setPage, changePerPage, createOrden, resubmitOrden, reviewOrden, uploadDocument,
  } = useOrdenes();

  const isReviewer = (catalogs?.review_stages.length ?? 0) > 0;
  const hasTasks = (catalogs?.task_steps.length ?? 0) > 0;

  const [formOpen, setFormOpen] = useState(false);
  const [resubmitting, setResubmitting] = useState<Orden | null>(null);
  const [selectedId, setDetailId] = useState<number | null>(null);

  // El enlace "Ver orden" de los correos abre el detalle: /app/contratacion/ordenes?orden=<id>
  const detailId = selectedId ?? (Number(searchParams.get('orden')) || null);

  const closeDetail = () => {
    setDetailId(null);
    if (searchParams.has('orden')) {
      const next = new URLSearchParams(searchParams);
      next.delete('orden');
      setSearchParams(next, { replace: true });
    }
  };

  const tabs = useMemo(() => [
    { id: 'mine', label: 'Mis registros', icon: <FileText size={14} />, count: counts.mine },
    ...(isReviewer ? [{ id: 'pending', label: 'Por aprobar', icon: <ClipboardCheck size={14} />, count: counts.pending }] : []),
    ...(hasTasks ? [{ id: 'tasks', label: 'Por gestionar', icon: <Package size={14} />, count: counts.tasks }] : []),
    ...(catalogs?.can_view_all ? [{ id: 'all', label: 'Todas', icon: <Layers size={14} /> }] : []),
  ], [counts, isReviewer, hasTasks, catalogs]);

  const hasFilters = Boolean(filters.search || filters.status || filters.project_id);

  const handleSave = async (payload: OrdenPayload, id?: number) => {
    const saved = id ? await resubmitOrden(id, payload) : await createOrden(payload);
    showNotification(id ? 'Orden reenviada al Director de Obra.' : `Orden ${saved.code} registrada. Se notificó al Director de Obra.`, 'success');
    return saved;
  };

  const handleReview = async (id: number, decision: 'aprobar' | 'devolver', comment?: string) => {
    const orden = await reviewOrden(id, decision, comment);
    showNotification(decision === 'aprobar' ? 'Orden aprobada.' : 'Orden devuelta al residente.', 'success');
    return orden;
  };

  const handleUploadDocument = async (id: number, payload: OrdenDocumentPayload) => {
    const orden = await uploadDocument(id, payload);
    showNotification(orden.status === 'completada' ? 'Entrada cargada. La orden quedó completada.' : 'Documento cargado y notificado.', 'success');
    return orden;
  };

  const openResubmit = (orden: Orden) => {
    closeDetail();
    setResubmitting(orden);
    setFormOpen(true);
  };

  const columns = [
    {
      header: 'Orden',
      accessor: (o: Orden) => (
        <div className="min-w-[180px] max-w-[320px]">
          <p className="font-black text-[#004C6C]">{o.code}</p>
          <p className="text-[11px] text-slate-500 line-clamp-2" title={o.description}>{o.description}</p>
        </div>
      ),
    },
    {
      header: 'Presupuesto',
      accessor: (o: Orden) => (
        <div className="min-w-[140px]">
          <p>{o.project?.name ?? '—'}</p>
          <p className="text-[11px] text-slate-400">{o.tower?.name ?? 'Sin torre'}</p>
        </div>
      ),
    },
    {
      header: 'Capítulo / Actividad',
      accessor: (o: Orden) => (
        <div className="max-w-[240px]">
          <p className="truncate" title={o.chapter}>{o.chapter}</p>
          <p className="text-[11px] text-slate-400 truncate" title={o.activity}>{o.activity}</p>
        </div>
      ),
    },
    {
      header: scope === 'mine' ? 'Registrada' : 'Registrada por',
      accessor: (o: Orden) => (
        <div className="text-[11px] leading-5 whitespace-nowrap">
          {scope !== 'mine' && <p className="text-sm">{o.created_by?.name ?? '—'}</p>}
          <p className="text-slate-400">{formatDateTime(o.created_at)}</p>
        </div>
      ),
    },
    {
      header: 'Estado',
      accessor: (o: Orden) => <OrdenStatusBadge status={o.status} label={o.status_label} />,
    },
    {
      header: 'Acciones',
      className: 'text-right',
      accessor: (o: Orden) => {
        // Acción principal según lo que el usuario puede hacer con la orden
        const highlighted = o.can_review || o.can_resubmit || o.can_upload_step;
        const label = o.can_review ? 'Aprobar' : o.can_resubmit ? 'Corregir' : o.can_upload_step ? 'Cargar' : 'Ver';
        return (
          <div className="flex justify-end" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setDetailId(o.id)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap ${highlighted ? 'bg-[#EE9D4C] text-white hover:bg-[#e08a35]' : 'text-[#004C6C] hover:bg-blue-50'}`}>
              {o.can_upload_step ? <Upload size={15} /> : <Eye size={15} />} {label}
            </button>
          </div>
        );
      },
    },
  ];

  return (
    <div className="max-w-[1600px] mx-auto flex flex-col gap-6 md:gap-8 py-4 md:py-6 px-4 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-gradient-to-r from-[#004C6C] via-[#005981] to-[#003850] p-6 md:p-8 rounded-[32px] text-white shadow-xl relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-white/5 rounded-full blur-3xl" />
        <div className="flex items-center gap-4 relative z-10">
          <div className="h-14 w-14 bg-white/10 rounded-2xl flex items-center justify-center border border-white/10">
            <ShoppingCart size={28} />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight">Registro de Orden</h1>
            <p className="text-xs font-bold text-white/60 uppercase tracking-widest mt-1">
              Director de Obra · Gerencia · Orden ERP · Factura · Entrada
            </p>
          </div>
        </div>
        {catalogs?.can_create && (
          <button onClick={() => { setResubmitting(null); setFormOpen(true); }}
            className="relative z-10 flex items-center justify-center gap-2 bg-[#EE9D4C] hover:bg-[#e08a35] text-white px-6 py-3.5 rounded-2xl font-bold shadow-lg transition-all hover:scale-[1.02]">
            <Plus size={18} /> Registrar orden
          </button>
        )}
      </div>

      {tabs.length > 1 && (
        <Tabs items={tabs} activeTab={scope} onChange={(id) => setScope(id as OrdenScope)} />
      )}

      {/* Filtros */}
      <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm p-5 grid grid-cols-1 md:grid-cols-[1fr_1fr_1fr_auto] gap-4 items-center">
        <div className="relative">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
          <input
            className="w-full bg-slate-50 border border-slate-100 rounded-2xl pl-12 pr-4 py-3.5 text-sm font-bold text-slate-700 outline-none focus:border-[#004C6C]"
            placeholder="Buscar por orden, descripción, capítulo o N.º de documento"
            value={filters.search}
            onChange={(e) => setFilter('search', e.target.value)}
          />
        </div>
        <CustomSelect
          pyClass="py-3.5"
          placeholder="Proyecto"
          clearable
          onClear={() => setFilter('project_id', '')}
          options={(catalogs?.projects ?? []).map((p) => ({ value: String(p.id), label: p.name }))}
          value={filters.project_id}
          onChange={(v) => setFilter('project_id', String(v))}
        />
        <CustomSelect
          pyClass="py-3.5"
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
        data={ordenes}
        isLoading={loading}
        onRowClick={(o) => setDetailId(o.id)}
        emptyMessage={
          scope === 'pending' ? 'No tienes órdenes pendientes de aprobación.'
            : scope === 'tasks' ? 'No tienes documentos de órdenes por cargar.'
            : 'Aún no hay órdenes registradas.'
        }
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

      <OrdenFormModal
        isOpen={formOpen}
        onClose={() => setFormOpen(false)}
        onSave={handleSave}
        catalogs={catalogs}
        orden={resubmitting}
      />

      <OrdenDetailModal
        ordenId={detailId}
        onClose={closeDetail}
        onReview={handleReview}
        onResubmit={openResubmit}
        onUploadDocument={handleUploadDocument}
        steps={catalogs?.steps ?? []}
        contractors={catalogs?.contractors ?? []}
        maxUploadMb={catalogs?.max_upload_mb ?? 1024}
      />
    </div>
  );
}
