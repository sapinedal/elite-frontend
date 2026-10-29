import { useMemo, useState } from 'react';
import { Wallet, Plus, Search, X, ListTodo, CalendarClock, CheckCircle2, Layers, Eye, Banknote, CheckSquare, Square, FileSpreadsheet, Loader2 } from 'lucide-react';
import { DataTable } from '../../../components/ui/DataTable';
import { CustomSelect } from '../../../components/ui/CustomSelect';
import { Pagination } from '../../../components/ui/Pagination';
import { Tabs } from '../../../components/ui/Tabs';
import { useNotification } from '../../../context/NotificationContext';
import { useNewFromQuery } from '../../../hooks/useNewFromQuery';
import { formatMoney } from '../../../utils/money';
import { usePagos } from '../hooks/usePagos';
import { pagoService, getApiErrorMessage } from '../services/pagoService';
import { PagoPriorityBadge, PagoStatusBadge } from '../components/PagoStatusBadge';
import { PrioritizeModal } from '../components/PrioritizeModal';
import { PayModal } from '../components/PayModal';
import { PagoFormModal } from '../components/PagoFormModal';
import { PagoDetailModal } from '../components/PagoDetailModal';
import type { PagoCuenta, PagoCuentaPayload, PagoPayPayload, PagoPriority, PagoScope } from '../types';

const formatDate = (date: string) => new Date(`${date}T00:00:00`).toLocaleDateString('es-CO', { weekday: 'short', day: '2-digit', month: 'short' });

export default function PagosPage() {
  const { showNotification } = useNotification();
  const {
    catalogs, cuentas, counts, totalBalance, scope, filters, page, perPage, pagination, selected, loading, error,
    setScope, setFilter, clearFilters, setPage, changePerPage, setSelected, toggleSelected, refresh,
  } = usePagos();

  const [detailId, setDetailId] = useState<number | null>(null);
  const [detailVersion, setDetailVersion] = useState(0);
  const [prioritizing, setPrioritizing] = useState<PagoCuenta[] | null>(null);
  const [paying, setPaying] = useState<PagoCuenta | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  // Registro desde el Sidebar: ?nuevo=1 abre el registro de una cuenta por pagar
  const [wantsNew, clearNew] = useNewFromQuery();
  const [exporting, setExporting] = useState(false);

  // Paula selecciona varias cuentas para programarlas juntas
  const canSelect = Boolean(catalogs?.can_prioritize) && (scope === 'por_priorizar' || scope === 'programadas');
  const selectedCuentas = cuentas.filter((c) => selected.includes(c.id));
  const selectedTotal = selectedCuentas.reduce((sum, c) => sum + c.balance, 0);
  const allSelected = cuentas.length > 0 && cuentas.every((c) => selected.includes(c.id));

  const tabs = useMemo(() => [
    { id: 'por_priorizar', label: 'Por priorizar', icon: <ListTodo size={14} />, count: counts.por_priorizar },
    { id: 'programadas', label: 'Programadas', icon: <CalendarClock size={14} />, count: counts.programadas },
    { id: 'pagadas', label: 'Pagadas', icon: <CheckCircle2 size={14} />, count: counts.pagadas },
    { id: 'todas', label: 'Todas', icon: <Layers size={14} /> },
  ], [counts]);

  const hasFilters = Object.values(filters).some(Boolean);

  // Tras una acción se refresca el listado y, si está abierto, el detalle
  const afterChange = async () => {
    await refresh();
    setDetailVersion((v) => v + 1);
  };

  const handlePrioritize = async (ids: number[], priority: PagoPriority, scheduledFor: string, comment: string | null) => {
    try {
      const count = await pagoService.prioritize(ids, priority, scheduledFor, comment);
      showNotification(`${count} cuenta(s) programada(s) para el ${formatDate(scheduledFor)}.`, 'success');
      setSelected([]);
      await afterChange();
    } catch (err) {
      throw new Error(getApiErrorMessage(err, 'Error al priorizar.'));
    }
  };

  const handlePay = async (id: number, payload: PagoPayPayload) => {
    try {
      const cuenta = await pagoService.pay(id, payload);
      showNotification(cuenta.status === 'pagada' ? 'Pago registrado. La cuenta quedó pagada.' : 'Abono registrado.', 'success');
      await afterChange();
      return cuenta;
    } catch (err) {
      throw new Error(getApiErrorMessage(err, 'Error al registrar el pago.'));
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const params = Object.fromEntries(Object.entries(filters).filter(([, value]) => value));
      await pagoService.exportExcel(scope, params);
    } catch (err) {
      showNotification(getApiErrorMessage(err, 'Error al exportar el cuadro de pagos.'), 'error');
    } finally {
      setExporting(false);
    }
  };

  const handleCreate = async (payload: PagoCuentaPayload) => {
    try {
      const cuenta = await pagoService.createCuenta(payload);
      showNotification('Cuenta registrada. Queda pendiente de priorizar.', 'success');
      await refresh();
      return cuenta;
    } catch (err) {
      throw new Error(getApiErrorMessage(err, 'Error al registrar la cuenta.'));
    }
  };

  const columns = [
    ...(canSelect ? [{
      header: '',
      className: 'w-10',
      accessor: (c: PagoCuenta) => (
        <div onClick={(e) => e.stopPropagation()}>
          <button onClick={() => toggleSelected(c.id)} className="text-[#004C6C]" title="Seleccionar">
            {selected.includes(c.id) ? <CheckSquare size={18} /> : <Square size={18} className="text-slate-300" />}
          </button>
        </div>
      ),
    }] : []),
    {
      header: 'Proveedor',
      accessor: (c: PagoCuenta) => (
        <div className="min-w-[180px] max-w-[280px]">
          <p className="font-black text-slate-700 truncate" title={c.supplier_name}>{c.supplier_name}</p>
          <p className="text-[11px] text-slate-400">{c.supplier_nit ? `NIT ${c.supplier_nit}` : 'Sin NIT'}</p>
        </div>
      ),
    },
    {
      header: 'Documento',
      accessor: (c: PagoCuenta) => (
        <div className="min-w-[120px] max-w-[240px]">
          <p className="font-black text-[#004C6C]">{c.document_number}</p>
          <p className="text-[11px] text-slate-400 truncate" title={c.concept ?? undefined}>
            {c.source_label}{c.source_code ? ` ${c.source_code}` : ''}
          </p>
        </div>
      ),
    },
    {
      header: 'Frente',
      accessor: (c: PagoCuenta) => (
        <div className="whitespace-nowrap">
          <p className="font-bold">{c.frente}</p>
          <p className="text-[11px] text-slate-400">{c.project?.name ?? 'Sin proyecto'}</p>
        </div>
      ),
    },
    {
      header: 'Saldo',
      className: 'text-right',
      accessor: (c: PagoCuenta) => (
        <div className="text-right whitespace-nowrap">
          <p className="font-black text-slate-700">{formatMoney(c.balance)}</p>
          {(c.paid_amount > 0 || c.adjustments > 0) && <p className="text-[11px] text-slate-400">de {formatMoney(c.amount - c.adjustments)}</p>}
        </div>
      ),
    },
    {
      header: scope === 'programadas' ? 'Programación' : 'Estado',
      accessor: (c: PagoCuenta) => (
        <div className="flex flex-col items-start gap-1">
          {c.status === 'priorizada' && c.priority ? (
            <>
              <PagoPriorityBadge priority={c.priority} label={c.priority_label ?? ''} />
              {c.scheduled_for && <span className="text-[11px] font-bold text-slate-500">{formatDate(c.scheduled_for)}</span>}
            </>
          ) : (
            <PagoStatusBadge status={c.status} label={c.status_label} />
          )}
        </div>
      ),
    },
    {
      header: 'Acciones',
      className: 'text-right',
      accessor: (c: PagoCuenta) => (
        <div className="flex justify-end" onClick={(e) => e.stopPropagation()}>
          {c.can_pay ? (
            <button onClick={() => setPaying(c)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap bg-green-600 text-white hover:bg-green-700">
              <Banknote size={15} /> Pagar
            </button>
          ) : c.can_prioritize && c.status !== 'priorizada' ? (
            <button onClick={() => setPrioritizing([c])}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap bg-[#EE9D4C] text-white hover:bg-[#e08a35]">
              <CalendarClock size={15} /> Priorizar
            </button>
          ) : (
            <button onClick={() => setDetailId(c.id)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap text-[#004C6C] hover:bg-blue-50">
              <Eye size={15} /> Ver
            </button>
          )}
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
            <Wallet size={28} />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight">Cuentas por pagar</h1>
            <p className="text-xs font-bold text-white/60 uppercase tracking-widest mt-1">
              Cortes · Órdenes · Cuentas manuales
            </p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 relative z-10">
          <div className="text-right">
            <p className="text-[10px] font-black text-white/60 uppercase tracking-widest">Saldo {tabs.find((t) => t.id === scope)?.label.toLowerCase()}</p>
            <p className="text-2xl font-black">{formatMoney(totalBalance)}</p>
          </div>
          <button onClick={handleExport} disabled={exporting}
            title="Descarga la pestaña actual con sus filtros, por frentes, en el formato del cuadro semanal"
            className="flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white px-5 py-3.5 rounded-2xl font-bold transition-all disabled:opacity-60">
            {exporting ? <Loader2 size={18} className="animate-spin" /> : <FileSpreadsheet size={18} />} Exportar Excel
          </button>
          {catalogs?.can_register && (
            <button onClick={() => setFormOpen(true)}
              className="flex items-center justify-center gap-2 bg-[#EE9D4C] hover:bg-[#e08a35] text-white px-6 py-3.5 rounded-2xl font-bold shadow-lg transition-all hover:scale-[1.02]">
              <Plus size={18} /> Registrar cuenta
            </button>
          )}
        </div>
      </div>

      <Tabs items={tabs} activeTab={scope} onChange={(id) => setScope(id as PagoScope)} />

      {/* Filtros */}
      <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm p-5 grid grid-cols-1 md:grid-cols-[1.4fr_1fr_1fr_1fr_auto] gap-4 items-center">
        <div className="relative">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
          <input
            className="w-full bg-slate-50 border border-slate-100 rounded-2xl pl-12 pr-4 py-3.5 text-sm font-bold text-slate-700 outline-none focus:border-[#004C6C]"
            placeholder="Buscar proveedor, NIT, documento o concepto"
            value={filters.search}
            onChange={(e) => setFilter('search', e.target.value)}
          />
        </div>
        <CustomSelect pyClass="py-3.5" placeholder="Proyecto" clearable searchable={false}
          onClear={() => setFilter('project_id', '')}
          options={(catalogs?.projects ?? []).map((p) => ({ value: String(p.id), label: p.name }))}
          value={filters.project_id} onChange={(v) => setFilter('project_id', String(v))} />
        <CustomSelect pyClass="py-3.5" placeholder="Frente" clearable searchable={false}
          onClear={() => setFilter('frente', '')}
          options={(catalogs?.frentes ?? []).map((f) => ({ value: f, label: f }))}
          value={filters.frente} onChange={(v) => setFilter('frente', String(v))} />
        <input type="date" title="Fecha programada de pago"
          className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3.5 text-sm font-bold text-slate-700 outline-none focus:border-[#004C6C]"
          value={filters.scheduled_for} onChange={(e) => setFilter('scheduled_for', e.target.value)} />
        {hasFilters ? (
          <button onClick={clearFilters} className="p-3.5 rounded-2xl bg-slate-50 text-slate-400 hover:bg-slate-100" title="Limpiar filtros">
            <X size={16} />
          </button>
        ) : <span />}
      </div>

      {/* Selección para priorizar en bloque */}
      {canSelect && cuentas.length > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white rounded-3xl border border-slate-100 px-5 py-3">
          <button onClick={() => setSelected(allSelected ? [] : cuentas.map((c) => c.id))}
            className="flex items-center gap-2 text-sm font-bold text-[#004C6C]">
            {allSelected ? <CheckSquare size={18} /> : <Square size={18} />} {allSelected ? 'Quitar selección' : 'Seleccionar las de esta página'}
          </button>
          {selected.length > 0 && (
            <div className="flex items-center gap-4">
              <span className="text-sm font-bold text-slate-600">{selected.length} seleccionada(s) · <span className="font-black text-slate-800">{formatMoney(selectedTotal)}</span></span>
              <button onClick={() => setPrioritizing(selectedCuentas)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-[#EE9D4C] hover:bg-[#e08a35] text-white text-sm font-bold">
                <CalendarClock size={16} /> {scope === 'programadas' ? 'Reprogramar' : 'Priorizar'} seleccionadas
              </button>
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 border border-red-100 rounded-2xl text-xs font-bold text-red-600 text-center">{error}</div>
      )}

      <DataTable
        columns={columns}
        data={cuentas}
        isLoading={loading}
        onRowClick={(c) => setDetailId(c.id)}
        emptyMessage={
          scope === 'por_priorizar' ? 'No hay cuentas pendientes de priorizar.'
            : scope === 'programadas' ? 'No hay pagos programados.'
            : scope === 'pagadas' ? 'Aún no hay cuentas pagadas.'
            : 'No hay cuentas por pagar.'
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

      <PagoDetailModal
        cuentaId={detailId}
        version={detailVersion}
        onClose={() => setDetailId(null)}
        onPay={setPaying}
        onPrioritize={(c) => setPrioritizing([c])}
        onChanged={refresh}
      />
      <PrioritizeModal cuentas={prioritizing} catalogs={catalogs} onClose={() => setPrioritizing(null)} onConfirm={handlePrioritize} />
      <PayModal cuenta={paying} maxUploadMb={catalogs?.max_upload_mb ?? 50} onClose={() => setPaying(null)} onConfirm={handlePay} />
      <PagoFormModal isOpen={formOpen || (wantsNew && Boolean(catalogs?.can_register))} catalogs={catalogs}
        onClose={() => { setFormOpen(false); clearNew(); }} onSave={handleCreate} />
    </div>
  );
}
