import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { HandCoins, Plus, Search, X, FileText, ClipboardCheck, Layers, Eye, Database } from 'lucide-react';
import { DataTable } from '../../../components/ui/DataTable';
import { CustomSelect } from '../../../components/ui/CustomSelect';
import { Pagination } from '../../../components/ui/Pagination';
import { Tabs } from '../../../components/ui/Tabs';
import { useNotification } from '../../../context/NotificationContext';
import { useNewFromQuery } from '../../../hooks/useNewFromQuery';
import { formatDateTime } from '../../../utils/dateUtils';
import { formatMoney } from '../../../utils/money';
import { useAnticipos } from '../hooks/useAnticipos';
import { AnticipoFormModal } from '../components/AnticipoFormModal';
import { AnticipoDetailModal } from '../components/AnticipoDetailModal';
import { AnticipoStatusBadge } from '../components/AnticipoStatusBadge';
import type { Anticipo, AnticipoPayload, AnticipoScope, MultifoxPayload } from '../types';

/**
 * Anticipos: el residente radica la cuenta de cobro del anticipo de un contrato, lo aprueban el Director de Obra
 * y Gerencia, Contabilidad lo genera en Multifox y pasa al cuadro de pagos.
 */
export default function AnticiposPage() {
  const { showNotification } = useNotification();
  const [searchParams, setSearchParams] = useSearchParams();
  const {
    catalogs, anticipos, counts, scope, filters, page, perPage, pagination, loading, error,
    setScope, setFilter, clearFilters, setPage, changePerPage, createAnticipo, resubmitAnticipo, reviewAnticipo, registerMultifox,
  } = useAnticipos();

  const [formOpen, setFormOpen] = useState(false);
  const [resubmitting, setResubmitting] = useState<Anticipo | null>(null);
  const [selectedId, setDetailId] = useState<number | null>(null);

  // El enlace "Ver anticipo" de los correos abre el detalle: /app/contratacion/anticipos?anticipo=<id>
  const detailId = selectedId ?? (Number(searchParams.get('anticipo')) || null);

  const closeDetail = () => {
    setDetailId(null);
    if (searchParams.has('anticipo')) {
      const next = new URLSearchParams(searchParams);
      next.delete('anticipo');
      setSearchParams(next, { replace: true });
    }
  };

  const isReviewer = (catalogs?.review_stages.length ?? 0) > 0;
  // Registro desde el Sidebar: ?nuevo=1 abre el formulario
  const [wantsNew, clearNew] = useNewFromQuery();
  const newRequested = wantsNew && Boolean(catalogs?.can_create);

  const tabs = useMemo(() => [
    ...(catalogs?.can_create ? [{ id: 'mine', label: 'Mis anticipos', icon: <FileText size={14} />, count: counts.mine }] : []),
    ...(isReviewer ? [{ id: 'pending', label: 'Por aprobar', icon: <ClipboardCheck size={14} />, count: counts.pending }] : []),
    ...(catalogs?.can_contabilizar ? [{ id: 'accounting', label: 'Por generar en Multifox', icon: <Database size={14} />, count: counts.accounting }] : []),
    ...(catalogs?.can_view_all || catalogs?.can_contabilizar ? [{ id: 'all', label: 'Todos', icon: <Layers size={14} /> }] : []),
  ], [counts, isReviewer, catalogs]);

  const hasFilters = Boolean(filters.search || filters.status || filters.project_id);

  const handleSave = async (payload: AnticipoPayload, id?: number) => {
    const saved = id ? await resubmitAnticipo(id, payload) : await createAnticipo(payload);
    showNotification(id ? 'Anticipo reenviado al Director de Obra.' : `Anticipo ${saved.code} radicado. Se notificó al Director de Obra.`, 'success');
    return saved;
  };

  const handleReview = async (id: number, decision: 'aprobar' | 'devolver', comment?: string) => {
    const anticipo = await reviewAnticipo(id, decision, comment);
    showNotification(decision === 'aprobar' ? 'Anticipo aprobado.' : 'Anticipo devuelto al residente.', 'success');
    return anticipo;
  };

  const handleMultifox = async (id: number, payload: MultifoxPayload) => {
    const anticipo = await registerMultifox(id, payload);
    showNotification(`Anticipo ${anticipo.code} cargado. Pasó al cuadro de pagos.`, 'success');
    return anticipo;
  };

  const openResubmit = (anticipo: Anticipo) => {
    closeDetail();
    setResubmitting(anticipo);
    setFormOpen(true);
  };

  const columns = [
    {
      header: 'Anticipo',
      accessor: (a: Anticipo) => (
        <div className="min-w-[120px]">
          <p className="font-black text-[#004C6C] whitespace-nowrap">{a.code}</p>
          <p className="text-[11px] text-slate-400 whitespace-nowrap">C. cobro {a.document_number}</p>
        </div>
      ),
    },
    {
      header: 'Contrato / Proveedor',
      accessor: (a: Anticipo) => (
        <div className="max-w-[280px]">
          <p className="truncate" title={a.contractor?.name}>{a.contractor?.name ?? a.contract?.contractor_name ?? '—'}</p>
          <p className="text-[11px] text-slate-400 truncate">Contrato {a.contract?.contract_code ?? '—'} · {a.project?.name ?? ''}{a.tower ? ` · ${a.tower.name}` : ''}</p>
        </div>
      ),
    },
    {
      header: 'Valor',
      className: 'text-right',
      accessor: (a: Anticipo) => <span className="font-black text-slate-700 whitespace-nowrap">{formatMoney(a.amount)}</span>,
    },
    {
      header: 'Radicado',
      accessor: (a: Anticipo) => (
        <div className="text-[11px] leading-5 whitespace-nowrap">
          <p className="text-sm">{a.created_by?.name ?? '—'}</p>
          <p className="text-slate-400">{formatDateTime(a.created_at)}</p>
        </div>
      ),
    },
    {
      header: 'Estado',
      accessor: (a: Anticipo) => (
        <div className="space-y-1">
          <AnticipoStatusBadge status={a.status} label={a.status_label} />
          {a.multifox_number && <p className="text-[11px] font-bold text-slate-500 whitespace-nowrap">Multifox N.º {a.multifox_number}</p>}
        </div>
      ),
    },
    {
      header: 'Acciones',
      className: 'text-right',
      accessor: (a: Anticipo) => {
        const label = a.can_review ? 'Aprobar' : a.can_resubmit ? 'Corregir' : a.can_register_multifox ? 'Cargar Multifox' : 'Ver';
        const highlighted = a.can_review || a.can_resubmit || a.can_register_multifox;
        return (
          <div className="flex justify-end" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setDetailId(a.id)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap ${highlighted ? 'bg-[#EE9D4C] text-white hover:bg-[#e08a35]' : 'text-[#004C6C] hover:bg-blue-50'}`}>
              {a.can_register_multifox ? <Database size={15} /> : <Eye size={15} />} {label}
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
            <HandCoins size={28} />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight">Anticipos</h1>
            <p className="text-xs font-bold text-white/60 uppercase tracking-widest mt-1">
              Director de Obra · Gerencia · Contabilidad · Cuadro de pagos
            </p>
          </div>
        </div>
        {catalogs?.can_create && (
          <button onClick={() => { setResubmitting(null); setFormOpen(true); }}
            className="relative z-10 flex items-center justify-center gap-2 bg-[#EE9D4C] hover:bg-[#e08a35] text-white px-6 py-3.5 rounded-2xl font-bold shadow-lg transition-all hover:scale-[1.02]">
            <Plus size={18} /> Radicar anticipo
          </button>
        )}
      </div>

      {tabs.length > 1 && <Tabs items={tabs} activeTab={scope} onChange={(id) => setScope(id as AnticipoScope)} />}

      {/* Filtros */}
      <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm p-5 grid grid-cols-1 md:grid-cols-[1fr_1fr_1fr_auto] gap-4 items-center">
        <div className="relative">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
          <input
            className="w-full bg-slate-50 border border-slate-100 rounded-2xl pl-12 pr-4 py-3.5 text-sm font-bold text-slate-700 outline-none focus:border-[#004C6C]"
            placeholder="Buscar por código, contrato, proveedor o N.º"
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
        data={anticipos}
        isLoading={loading}
        onRowClick={(a) => setDetailId(a.id)}
        emptyMessage={
          scope === 'pending' ? 'No tienes anticipos pendientes de aprobación.'
            : scope === 'accounting' ? 'No hay anticipos aprobados por generar en Multifox.'
            : 'Aún no hay anticipos radicados.'
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

      <AnticipoFormModal
        isOpen={formOpen || newRequested}
        onClose={() => { setFormOpen(false); clearNew(); }}
        onSave={handleSave}
        catalogs={catalogs}
        anticipo={newRequested ? null : resubmitting}
      />

      <AnticipoDetailModal
        anticipoId={detailId}
        maxUploadMb={catalogs?.max_upload_mb ?? 100}
        onClose={closeDetail}
        onReview={handleReview}
        onResubmit={openResubmit}
        onRegisterMultifox={handleMultifox}
      />
    </div>
  );
}
