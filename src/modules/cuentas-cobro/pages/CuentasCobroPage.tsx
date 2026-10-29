import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Receipt, Plus, Search, X, FileText, ClipboardCheck, Layers, Eye, Database, Tags, Paperclip } from 'lucide-react';
import { DataTable } from '../../../components/ui/DataTable';
import { CustomSelect } from '../../../components/ui/CustomSelect';
import { Pagination } from '../../../components/ui/Pagination';
import { Tabs } from '../../../components/ui/Tabs';
import { useNotification } from '../../../context/NotificationContext';
import { useNewFromQuery } from '../../../hooks/useNewFromQuery';
import { formatDateTime } from '../../../utils/dateUtils';
import { formatMoney } from '../../../utils/money';
import { useCuentasCobro } from '../hooks/useCuentasCobro';
import { CuentaCobroFormModal } from '../components/CuentaCobroFormModal';
import { CuentaCobroDetailModal } from '../components/CuentaCobroDetailModal';
import { CuentaCobroStatusBadge } from '../components/CuentaCobroStatusBadge';
import { TiposPanel } from '../components/TiposPanel';
import type { CuentaCobro, CuentaCobroMultifoxPayload, CuentaCobroPayload, CuentaCobroScope } from '../types';

type Tab = CuentaCobroScope | 'tipos';

/**
 * Cuentas de cobro: se radican (con adjuntos si el tipo los exige), las aprueban el Director de Obra y Gerencia,
 * Paula decide si requieren Multifox y pasan al cuadro de pagos. Incluye el CRUD de tipos.
 */
export default function CuentasCobroPage() {
  const { showNotification } = useNotification();
  const [searchParams, setSearchParams] = useSearchParams();
  const {
    catalogs, cuentas, counts, scope, filters, page, perPage, pagination, loading, error,
    setScope, setFilter, clearFilters, setPage, changePerPage, reloadCatalogs,
    createCuenta, resubmitCuenta, reviewCuenta, decideMultifox, registerMultifox,
  } = useCuentasCobro();

  const [tiposOpen, setTiposOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [resubmitting, setResubmitting] = useState<CuentaCobro | null>(null);
  const [selectedId, setDetailId] = useState<number | null>(null);

  // El enlace "Ver cuenta de cobro" de los correos abre el detalle: /app/contratacion/cuentas-cobro?cuenta=<id>
  const detailId = selectedId ?? (Number(searchParams.get('cuenta')) || null);

  const closeDetail = () => {
    setDetailId(null);
    if (searchParams.has('cuenta')) {
      const next = new URLSearchParams(searchParams);
      next.delete('cuenta');
      setSearchParams(next, { replace: true });
    }
  };

  const isReviewer = (catalogs?.review_stages.length ?? 0) > 0;
  // Registro desde el Sidebar: ?nuevo=1 abre el formulario
  const [wantsNew, clearNew] = useNewFromQuery();
  const newRequested = wantsNew && Boolean(catalogs?.can_create);
  const activeTab: Tab = tiposOpen ? 'tipos' : scope;

  const tabs = useMemo(() => [
    ...(catalogs?.can_create ? [{ id: 'mine', label: 'Mis cuentas', icon: <FileText size={14} />, count: counts.mine }] : []),
    ...(isReviewer ? [{ id: 'pending', label: 'Por aprobar', icon: <ClipboardCheck size={14} />, count: counts.pending }] : []),
    ...(catalogs?.can_handle_multifox ? [{ id: 'multifox', label: 'Multifox', icon: <Database size={14} />, count: counts.multifox }] : []),
    ...(catalogs?.can_view_all || catalogs?.can_handle_multifox ? [{ id: 'all', label: 'Todas', icon: <Layers size={14} /> }] : []),
    ...(catalogs?.can_parametrize ? [{ id: 'tipos', label: 'Tipos', icon: <Tags size={14} /> }] : []),
  ], [counts, isReviewer, catalogs]);

  const changeTab = (id: string) => {
    setTiposOpen(id === 'tipos');
    if (id !== 'tipos') setScope(id as CuentaCobroScope);
  };

  const hasFilters = Boolean(filters.search || filters.status || filters.project_id || filters.tipo_id);

  const handleSave = async (payload: CuentaCobroPayload, id?: number) => {
    const saved = id ? await resubmitCuenta(id, payload) : await createCuenta(payload);
    showNotification(id ? 'Cuenta de cobro reenviada al Director de Obra.' : `Cuenta de cobro ${saved.code} radicada. Se notificó al Director de Obra.`, 'success');
    return saved;
  };

  const handleReview = async (id: number, decision: 'aprobar' | 'devolver', comment?: string) => {
    const cuenta = await reviewCuenta(id, decision, comment);
    showNotification(decision === 'aprobar' ? 'Cuenta de cobro aprobada.' : 'Cuenta de cobro devuelta.', 'success');
    return cuenta;
  };

  const handleDecide = async (id: number, requires: boolean, comment?: string) => {
    const cuenta = await decideMultifox(id, requires, comment);
    showNotification(requires ? 'Marcada como pendiente de cargue en Multifox.' : `${cuenta.code} pasó al cuadro de pagos.`, 'success');
    return cuenta;
  };

  const handleMultifox = async (id: number, payload: CuentaCobroMultifoxPayload) => {
    const cuenta = await registerMultifox(id, payload);
    showNotification(`${cuenta.code} cargada en Multifox: pasó al cuadro de pagos.`, 'success');
    return cuenta;
  };

  const openResubmit = (cuenta: CuentaCobro) => {
    closeDetail();
    setResubmitting(cuenta);
    setFormOpen(true);
  };

  const columns = [
    {
      header: 'Cuenta de cobro',
      accessor: (c: CuentaCobro) => (
        <div className="min-w-[130px]">
          <p className="font-black text-[#004C6C] whitespace-nowrap">{c.code}</p>
          <p className="flex items-center gap-1 text-[11px] text-slate-400 whitespace-nowrap">
            {c.tipo?.name} · N.º {c.document_number}
            {(c.adjuntos_count ?? 0) > 0 && <span className="flex items-center gap-0.5"><Paperclip size={11} />{c.adjuntos_count}</span>}
          </p>
        </div>
      ),
    },
    {
      header: 'Proveedor',
      accessor: (c: CuentaCobro) => (
        <div className="max-w-[260px]">
          <p className="truncate" title={c.contractor?.name}>{c.contractor?.name ?? '—'}</p>
          <p className="text-[11px] text-slate-400 truncate">{c.project?.name ?? ''} · {c.tower?.name ?? 'General'}{c.contract ? ` · Contrato ${c.contract.contract_code}` : ''}</p>
        </div>
      ),
    },
    {
      header: 'Valor',
      className: 'text-right',
      accessor: (c: CuentaCobro) => <span className="font-black text-slate-700 whitespace-nowrap">{formatMoney(c.amount)}</span>,
    },
    {
      header: 'Radicada',
      accessor: (c: CuentaCobro) => (
        <div className="text-[11px] leading-5 whitespace-nowrap">
          <p className="text-sm">{c.created_by?.name ?? '—'}</p>
          <p className="text-slate-400">{formatDateTime(c.created_at)}</p>
        </div>
      ),
    },
    {
      header: 'Estado',
      accessor: (c: CuentaCobro) => (
        <div className="space-y-1">
          <CuentaCobroStatusBadge status={c.status} label={c.status_label} />
          {c.status === 'en_pagos' && (
            <p className="text-[11px] font-bold text-slate-500 whitespace-nowrap">{c.multifox_number ? `Multifox N.º ${c.multifox_number}` : 'Sin Multifox'}</p>
          )}
        </div>
      ),
    },
    {
      header: 'Acciones',
      className: 'text-right',
      accessor: (c: CuentaCobro) => {
        const label = c.can_review ? 'Aprobar' : c.can_resubmit ? 'Corregir' : c.can_handle_multifox ? 'Multifox' : 'Ver';
        const highlighted = c.can_review || c.can_resubmit || c.can_handle_multifox;
        return (
          <div className="flex justify-end" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setDetailId(c.id)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap ${highlighted ? 'bg-[#EE9D4C] text-white hover:bg-[#e08a35]' : 'text-[#004C6C] hover:bg-blue-50'}`}>
              {c.can_handle_multifox ? <Database size={15} /> : <Eye size={15} />} {label}
            </button>
          </div>
        );
      },
    },
  ];

  return (
    <div className="max-w-[1600px] mx-auto flex flex-col gap-6 md:gap-8 py-4 md:py-6 px-4 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-gradient-to-r from-[#004C6C] via-[#005981] to-[#003850] p-6 md:p-8 rounded-[32px] text-white shadow-xl relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-white/5 rounded-full blur-3xl" />
        <div className="flex items-center gap-4 relative z-10">
          <div className="h-14 w-14 bg-white/10 rounded-2xl flex items-center justify-center border border-white/10">
            <Receipt size={28} />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight">Cuentas de cobro</h1>
            <p className="text-xs font-bold text-white/60 uppercase tracking-widest mt-1">
              Director de Obra · Gerencia · Multifox · Cuadro de pagos
            </p>
          </div>
        </div>
        {catalogs?.can_create && (
          <button onClick={() => { setResubmitting(null); setFormOpen(true); }}
            className="relative z-10 flex items-center justify-center gap-2 bg-[#EE9D4C] hover:bg-[#e08a35] text-white px-6 py-3.5 rounded-2xl font-bold shadow-lg transition-all hover:scale-[1.02]">
            <Plus size={18} /> Radicar cuenta de cobro
          </button>
        )}
      </div>

      {tabs.length > 1 && <Tabs items={tabs} activeTab={activeTab} onChange={changeTab} />}

      {tiposOpen ? (
        <TiposPanel onChanged={reloadCatalogs} />
      ) : (
        <>
          <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm p-5 grid grid-cols-1 md:grid-cols-[1.5fr_1fr_1fr_1fr_auto] gap-4 items-center">
            <div className="relative">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
              <input
                className="w-full bg-slate-50 border border-slate-100 rounded-2xl pl-12 pr-4 py-3.5 text-sm font-bold text-slate-700 outline-none focus:border-[#004C6C]"
                placeholder="Buscar por código, proveedor, NIT o N.º"
                value={filters.search}
                onChange={(e) => setFilter('search', e.target.value)}
              />
            </div>
            <CustomSelect pyClass="py-3.5" placeholder="Tipo" clearable onClear={() => setFilter('tipo_id', '')}
              options={(catalogs?.tipos ?? []).map((t) => ({ value: String(t.id), label: t.name }))}
              value={filters.tipo_id} onChange={(v) => setFilter('tipo_id', String(v))} />
            <CustomSelect pyClass="py-3.5" placeholder="Proyecto" clearable onClear={() => setFilter('project_id', '')}
              options={(catalogs?.projects ?? []).map((p) => ({ value: String(p.id), label: p.name }))}
              value={filters.project_id} onChange={(v) => setFilter('project_id', String(v))} />
            <CustomSelect pyClass="py-3.5" placeholder="Estado" searchable={false} clearable onClear={() => setFilter('status', '')}
              options={(catalogs?.statuses ?? []).map((s) => ({ value: s.key, label: s.label }))}
              value={filters.status} onChange={(v) => setFilter('status', String(v))} />
            {hasFilters ? (
              <button onClick={clearFilters} className="p-3.5 rounded-2xl bg-slate-50 text-slate-400 hover:bg-slate-100" title="Limpiar filtros">
                <X size={16} />
              </button>
            ) : <span />}
          </div>

          {error && <div className="p-4 bg-red-50 border border-red-100 rounded-2xl text-xs font-bold text-red-600 text-center">{error}</div>}

          <DataTable
            columns={columns}
            data={cuentas}
            isLoading={loading}
            onRowClick={(c) => setDetailId(c.id)}
            emptyMessage={
              scope === 'pending' ? 'No tienes cuentas de cobro pendientes de aprobación.'
                : scope === 'multifox' ? 'No hay cuentas de cobro aprobadas pendientes de Multifox.'
                : 'Aún no hay cuentas de cobro radicadas.'
            }
          />

          {pagination.total > 0 && (
            <Pagination currentPage={page} totalPages={pagination.lastPage} onPageChange={setPage}
              totalItems={pagination.total} perPage={perPage} onPerPageChange={changePerPage} />
          )}
        </>
      )}

      <CuentaCobroFormModal isOpen={formOpen || newRequested} onClose={() => { setFormOpen(false); clearNew(); }}
        onSave={handleSave} catalogs={catalogs} cuenta={newRequested ? null : resubmitting} />

      <CuentaCobroDetailModal
        cuentaId={detailId}
        maxUploadMb={catalogs?.max_upload_mb ?? 100}
        onClose={closeDetail}
        onReview={handleReview}
        onResubmit={openResubmit}
        onDecideMultifox={handleDecide}
        onRegisterMultifox={handleMultifox}
      />
    </div>
  );
}
