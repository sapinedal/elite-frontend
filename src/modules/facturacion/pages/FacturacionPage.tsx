import { useMemo, useState } from 'react';
import { Receipt, Upload, Search, X, Clock, CheckCircle2, Layers, LayoutDashboard, Link2, Eye, Pencil, Trash2, Download, Loader2, Sparkles } from 'lucide-react';
import { DataTable } from '../../../components/ui/DataTable';
import { CustomSelect } from '../../../components/ui/CustomSelect';
import { Pagination } from '../../../components/ui/Pagination';
import { Tabs } from '../../../components/ui/Tabs';
import { Modal } from '../../../components/ui/Modal';
import { useNotification } from '../../../context/NotificationContext';
import { useNewFromQuery } from '../../../hooks/useNewFromQuery';
import { formatDateTime } from '../../../utils/dateUtils';
import { formatMoney } from '../../../utils/money';
import { useFacturas } from '../hooks/useFacturas';
import { facturacionService, getApiErrorMessage } from '../services/facturacionService';
import { BulkUploadModal } from '../components/BulkUploadModal';
import { AssociateModal } from '../components/AssociateModal';
import { FacturaDetailModal } from '../components/FacturaDetailModal';
import { FacturaEditModal } from '../components/FacturaEditModal';
import { FacturaStatusBadge } from '../components/FacturaStatusBadge';
import { FacturacionPanel } from '../components/FacturacionPanel';
import type { Factura, FacturaScope } from '../types';

type Tab = FacturaScope | 'panel';

/**
 * Facturas del mes. Contabilidad carga las facturas en la carpeta del mes y ve en el panel a quién le falta qué;
 * el residente asocia cada factura a su corte aprobado o a su orden de compra con los soportes.
 */
export default function FacturacionPage() {
  const { showNotification } = useNotification();
  const {
    catalogs, facturas, counts, scope, period, search, page, perPage, pagination, loading, error,
    setScope, setPeriod, setSearch, setPage, changePerPage, refresh,
  } = useFacturas();

  const [tab, setTab] = useState<Tab>('pending');
  const [panelPeriod, setPanelPeriod] = useState<string | null>(null);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [associating, setAssociating] = useState<Factura | null>(null);
  const [editing, setEditing] = useState<Factura | null>(null);
  const [deleting, setDeleting] = useState<Factura | null>(null);
  const [detailId, setDetailId] = useState<number | null>(null);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);

  const canManage = catalogs?.can_manage ?? false;
  // Registro desde el Sidebar: ?nuevo=1 abre el cargue de facturas
  const [wantsNew, clearNew] = useNewFromQuery();
  const canAssociate = catalogs?.can_associate ?? false;
  const currentPeriod = catalogs?.current_period ?? '';

  const tabs = useMemo(() => [
    { id: 'pending', label: canManage ? 'Pendientes de obra' : 'Por asociar', icon: <Clock size={14} />, count: counts.pending },
    { id: 'processed', label: canManage ? 'Procesadas' : 'Asociadas por mí', icon: <CheckCircle2 size={14} /> },
    ...(canManage ? [
      { id: 'all', label: 'Todas', icon: <Layers size={14} /> },
      { id: 'panel', label: 'Panel', icon: <LayoutDashboard size={14} /> },
    ] : []),
  ], [counts, canManage]);

  const changeTab = (id: string) => {
    setTab(id as Tab);
    if (id !== 'panel') setScope(id as FacturaScope);
  };

  const handleDownload = async (f: Factura) => {
    setDownloadingId(f.id);
    try {
      window.open(await facturacionService.getDownloadUrl(f.id), '_blank', 'noopener');
    } catch (err) {
      showNotification(getApiErrorMessage(err, 'Error al descargar la factura.'), 'error');
    } finally {
      setDownloadingId(null);
    }
  };

  const handleDelete = async (f: Factura) => {
    try {
      await facturacionService.deleteFactura(f.id);
      showNotification(`${f.document_number} eliminada.`, 'success');
      refresh();
    } catch (err) {
      showNotification(getApiErrorMessage(err, 'Error al eliminar la factura.'), 'error');
    }
  };

  const columns = [
    {
      header: 'Documento',
      accessor: (f: Factura) => (
        <div className="min-w-[150px]">
          <p className="flex items-center gap-1.5 font-black text-[#004C6C] whitespace-nowrap">
            {f.document_number}
            {f.suggested && <span title="Proveedor de uno de tus cortes aprobados"><Sparkles size={13} className="text-[#EE9D4C]" /></span>}
          </p>
          <p className="text-[11px] text-slate-400 truncate max-w-[220px]" title={f.file_name}>{f.document_type_label} · {f.file_name}</p>
        </div>
      ),
    },
    {
      header: 'Proveedor',
      accessor: (f: Factura) => (
        <div className="max-w-[260px]">
          <p className="truncate" title={f.contractor?.name ?? f.supplier_name}>{f.contractor?.name ?? f.supplier_name}</p>
          <p className="text-[11px] text-slate-400">{f.contractor?.nit ? `NIT ${f.contractor.nit}` : f.contractor ? '' : 'No está en el catálogo'}</p>
        </div>
      ),
    },
    {
      header: 'Valor',
      className: 'text-right',
      accessor: (f: Factura) => <span className="font-black text-slate-700 whitespace-nowrap">{formatMoney(f.amount)}</span>,
    },
    {
      header: 'Mes / Cargada',
      accessor: (f: Factura) => (
        <div className="text-[11px] leading-5 whitespace-nowrap">
          <p className="text-sm">{f.period_label}</p>
          <p className="text-slate-400">{f.uploaded_by ?? '—'} · {formatDateTime(f.created_at)}</p>
        </div>
      ),
    },
    {
      header: 'Estado',
      accessor: (f: Factura) => (
        <div className="space-y-1">
          <FacturaStatusBadge status={f.status} label={f.status_label} />
          {f.target ? (
            <p className="text-[11px] font-bold text-slate-500 whitespace-nowrap">{f.target.label} · {f.processed_by}</p>
          ) : f.days_pending !== null && f.days_pending > 0 && (
            <p className={`text-[11px] font-bold whitespace-nowrap ${f.days_pending > 15 ? 'text-red-500' : 'text-slate-400'}`}>Hace {f.days_pending} día(s)</p>
          )}
        </div>
      ),
    },
    {
      header: 'Acciones',
      className: 'text-right',
      accessor: (f: Factura) => (
        <div className="flex justify-end items-center gap-1" onClick={(e) => e.stopPropagation()}>
          {f.can_associate && (
            <button onClick={() => setAssociating(f)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap bg-[#EE9D4C] text-white hover:bg-[#e08a35]">
              <Link2 size={15} /> Asociar
            </button>
          )}
          {!f.can_associate && (
            <button onClick={() => setDetailId(f.id)} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-[#004C6C] hover:bg-blue-50">
              <Eye size={15} /> Ver
            </button>
          )}
          <button onClick={() => handleDownload(f)} className="p-2 rounded-xl text-[#004C6C] hover:bg-blue-50" title="Descargar factura">
            {downloadingId === f.id ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />}
          </button>
          {f.can_edit && (
            <>
              <button onClick={() => setEditing(f)} className="p-2 rounded-xl text-slate-500 hover:bg-slate-100" title="Editar">
                <Pencil size={15} />
              </button>
              <button onClick={() => setDeleting(f)} className="p-2 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50" title="Eliminar">
                <Trash2 size={15} />
              </button>
            </>
          )}
        </div>
      ),
    },
  ];

  const periodOptions = (catalogs?.periods ?? []).map((p) => ({ value: p.value, label: p.label }));

  return (
    <div className="max-w-[1600px] mx-auto flex flex-col gap-6 md:gap-8 py-4 md:py-6 px-4 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-gradient-to-r from-[#004C6C] via-[#005981] to-[#003850] p-6 md:p-8 rounded-[32px] text-white shadow-xl relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-white/5 rounded-full blur-3xl" />
        <div className="flex items-center gap-4 relative z-10">
          <div className="h-14 w-14 bg-white/10 rounded-2xl flex items-center justify-center border border-white/10">
            <Receipt size={28} />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight">Facturas del mes</h1>
            <p className="text-xs font-bold text-white/60 uppercase tracking-widest mt-1">
              Contabilidad carga · Obra asocia al corte u orden
            </p>
          </div>
        </div>
        {canManage && (
          <button onClick={() => setUploadOpen(true)}
            className="relative z-10 flex items-center justify-center gap-2 bg-[#EE9D4C] hover:bg-[#e08a35] text-white px-6 py-3.5 rounded-2xl font-bold shadow-lg transition-all hover:scale-[1.02]">
            <Upload size={18} /> Cargar facturas
          </button>
        )}
      </div>

      <Tabs items={tabs} activeTab={tab} onChange={changeTab} />

      {canAssociate && !canManage && tab === 'pending' && counts.suggested > 0 && (
        <div className="flex items-center gap-2 p-4 bg-orange-50 border border-orange-100 rounded-2xl text-sm font-bold text-orange-800">
          <Sparkles size={16} className="shrink-0" />
          {counts.suggested} factura(s) pendiente(s) son de proveedores de tus cortes aprobados. Están marcadas con <Sparkles size={13} className="inline" />.
        </div>
      )}

      {tab === 'panel' ? (
        <>
          <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm p-5 max-w-sm">
            <CustomSelect pyClass="py-3.5" searchable={false} options={periodOptions}
              value={panelPeriod ?? currentPeriod} onChange={(v) => setPanelPeriod(String(v))} />
          </div>
          {currentPeriod && <FacturacionPanel key={panelPeriod ?? currentPeriod} period={panelPeriod ?? currentPeriod} />}
        </>
      ) : (
        <>
          {/* Filtros */}
          <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm p-5 grid grid-cols-1 md:grid-cols-[2fr_1fr_auto] gap-4 items-center">
            <div className="relative">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
              <input
                className="w-full bg-slate-50 border border-slate-100 rounded-2xl pl-12 pr-4 py-3.5 text-sm font-bold text-slate-700 outline-none focus:border-[#004C6C]"
                placeholder="Buscar por número, proveedor, NIT o archivo"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <CustomSelect
              pyClass="py-3.5"
              placeholder="Todos los meses"
              searchable={false}
              clearable
              onClear={() => setPeriod('')}
              options={periodOptions}
              value={period}
              onChange={(v) => setPeriod(String(v))}
            />
            {search || period ? (
              <button onClick={() => { setSearch(''); setPeriod(''); }} className="p-3.5 rounded-2xl bg-slate-50 text-slate-400 hover:bg-slate-100" title="Limpiar filtros">
                <X size={16} />
              </button>
            ) : <span />}
          </div>

          {error && (
            <div className="p-4 bg-red-50 border border-red-100 rounded-2xl text-xs font-bold text-red-600 text-center">{error}</div>
          )}

          <DataTable
            columns={columns}
            data={facturas}
            isLoading={loading}
            onRowClick={(f) => setDetailId(f.id)}
            emptyMessage={
              scope === 'pending' ? 'No hay facturas pendientes de asociar.'
                : scope === 'processed' ? 'Aún no hay facturas procesadas por obra.'
                : 'Aún no hay facturas cargadas.'
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
        </>
      )}

      {catalogs && (
        <>
          <BulkUploadModal
            isOpen={uploadOpen || (wantsNew && canManage)}
            onClose={() => { setUploadOpen(false); clearNew(); }}
            catalogs={catalogs}
            defaultPeriod={currentPeriod}
            onUploaded={(count) => { showNotification(`${count} factura(s) cargada(s). Quedan pendientes de obra.`, 'success'); refresh(); }}
          />
          <AssociateModal
            factura={associating}
            catalogs={catalogs}
            onClose={() => setAssociating(null)}
            onAssociated={(f) => {
              setAssociating(null);
              showNotification(
                f.target?.type === 'orden'
                  ? `${f.document_number} asociada a la ${f.target.label}. Pasa a la entrada de almacén.`
                  : `${f.document_number} asociada al ${f.target?.label}. Se notificó para Multifox.`,
                'success'
              );
              refresh();
            }}
          />
          <FacturaEditModal
            factura={editing}
            catalogs={catalogs}
            onClose={() => setEditing(null)}
            onSaved={() => { setEditing(null); showNotification('Factura actualizada.', 'success'); refresh(); }}
          />
        </>
      )}

      <FacturaDetailModal facturaId={detailId} onClose={() => setDetailId(null)} />

      <Modal
        isOpen={deleting !== null}
        onClose={() => setDeleting(null)}
        onConfirm={() => deleting && handleDelete(deleting)}
        type="danger"
        title={`Eliminar ${deleting?.document_number ?? ''}`}
        message="Se elimina el registro y el archivo de la carpeta del mes. Úsalo solo si la factura se cargó por error."
        confirmText="Eliminar"
      />
    </div>
  );
}
