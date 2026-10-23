import { useMemo, useState } from 'react';
import {
  FileSignature, Plus, Search, FolderOpen, Edit2, Trash2, AlertTriangle, ShieldAlert, Layers, X, Tag,
} from 'lucide-react';
import { DataTable } from '../../../components/ui/DataTable';
import { CustomSelect } from '../../../components/ui/CustomSelect';
import { Modal } from '../../../components/ui/Modal';
import { Pagination } from '../../../components/ui/Pagination';
import { useAuth } from '../../../context/AuthContext';
import { useNotification } from '../../../context/NotificationContext';
import { useContracts } from '../hooks/useContracts';
import { ContractFormModal } from '../components/ContractFormModal';
import { ContractDocumentsModal } from '../components/ContractDocumentsModal';
import { ContractAlertsPanel } from '../components/ContractAlertsPanel';
import { ContractTypesModal } from '../components/ContractTypesModal';
import type { Contract, ContractPayload } from '../types';

const STATUS_STYLES: Record<string, string> = {
  'Por iniciar': 'bg-slate-100 text-slate-600',
  'En ejecución': 'bg-blue-50 text-[#004C6C]',
  Suspendido: 'bg-orange-50 text-orange-600',
  Terminado: 'bg-green-50 text-green-600',
  Liquidado: 'bg-purple-50 text-purple-600',
};

const formatDate = (value: string | null) => {
  if (!value) return '—';
  const [y, m, d] = value.split('-');
  return `${d}/${m}/${y}`;
};

export default function ContratacionPage() {
  const { useCan } = useAuth();
  const { showNotification } = useNotification();
  const {
    activeProject, catalogs, contracts, alerts, filters, page, perPage, pagination, loading, error,
    setFilter, clearFilters, setPage, changePerPage, refresh, refreshCatalogs, saveContract, deleteContract, createTower,
  } = useContracts();

  const canCreate = useCan('contratacion.crear');
  const canEdit = useCan('contratacion.editar');
  const canDelete = useCan('contratacion.eliminar');

  const [formOpen, setFormOpen] = useState(false);
  const [editingContract, setEditingContract] = useState<Contract | null>(null);
  const [documentsContractId, setDocumentsContractId] = useState<number | null>(null);
  const [contractToDelete, setContractToDelete] = useState<Contract | null>(null);
  const [typesOpen, setTypesOpen] = useState(false);

  const hasFilters = Boolean(filters.search || filters.tower_id || filters.contract_type_id || filters.status || filters.alerts_only);

  const stats = useMemo(() => ({
    // Total del proyecto con los filtros actuales (el listado viene paginado)
    total: pagination.total,
    missing: alerts?.missing_documents.length ?? 0,
    policies: alerts?.expiring_policies.length ?? 0,
  }), [pagination.total, alerts]);

  const openCreate = () => {
    setEditingContract(null);
    setFormOpen(true);
  };

  const openEdit = (contract: Contract) => {
    setEditingContract(contract);
    setFormOpen(true);
  };

  const handleSave = async (payload: ContractPayload, id?: number) => {
    const saved = await saveContract(payload, id);
    showNotification(id ? 'Contrato actualizado.' : 'Contrato creado. Ya puedes cargar sus adjuntos.', 'success');
    // Al crear se abren los adjuntos para cargarlos de una vez (también se pueden subir después)
    if (!id) setDocumentsContractId(saved.id);
    return saved;
  };

  const handleDelete = async () => {
    if (!contractToDelete) return;
    try {
      await deleteContract(contractToDelete.id);
      showNotification('Contrato eliminado. Sus archivos se conservan en el repositorio documental.', 'success');
    } catch (err) {
      showNotification(err instanceof Error ? err.message : 'Error al eliminar el contrato.', 'error');
    }
  };

  const columns = [
    {
      header: 'Contrato',
      accessor: (c: Contract) => (
        <div className="min-w-[140px]">
          <p className="font-black text-[#004C6C]">{c.contract_code}</p>
          <p className="text-[11px] text-slate-400">Consecutivo {c.consecutive}</p>
        </div>
      ),
    },
    {
      header: 'Frente / Tipo',
      accessor: (c: Contract) => (
        <div className="min-w-[140px]">
          <p>{c.tower?.name ?? '—'}</p>
          <p className="text-[11px] text-slate-400">{c.contract_type?.name ?? '—'}</p>
        </div>
      ),
    },
    {
      header: 'Contratista / Objeto',
      accessor: (c: Contract) => (
        <div className="max-w-[320px]">
          <p className="truncate" title={c.contractor_name}>{c.contractor_name}</p>
          <p className="text-[11px] text-slate-400 font-medium line-clamp-2" title={c.object}>{c.object}</p>
        </div>
      ),
    },
    {
      header: 'Fechas',
      accessor: (c: Contract) => (
        <div className="text-[11px] leading-5 whitespace-nowrap">
          <p><span className="text-slate-400">Firma:</span> {formatDate(c.signed_at)}</p>
          <p><span className="text-slate-400">Inicio:</span> {formatDate(c.start_act_date)}</p>
          <p><span className="text-slate-400">Fin est.:</span> {formatDate(c.estimated_end_date)}</p>
        </div>
      ),
    },
    {
      header: 'Estado',
      accessor: (c: Contract) => (
        <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg whitespace-nowrap ${STATUS_STYLES[c.status] ?? 'bg-slate-100 text-slate-600'}`}>
          {c.status}
        </span>
      ),
    },
    {
      header: 'Alertas',
      accessor: (c: Contract) => (
        <div className="flex flex-col gap-1">
          {c.expiring_policies.length > 0 && (
            <span className="flex items-center gap-1 text-[10px] font-black text-red-600 whitespace-nowrap">
              <ShieldAlert size={12} /> {c.expiring_policies.length} póliza(s) por vencer
            </span>
          )}
          {c.missing_documents.length > 0 && (
            <span className="flex items-center gap-1 text-[10px] font-black text-orange-600 whitespace-nowrap" title={c.missing_documents.map((m) => m.label).join(', ')}>
              <AlertTriangle size={12} /> {c.missing_documents.length} adjunto(s) faltante(s)
            </span>
          )}
          {c.expiring_policies.length === 0 && c.missing_documents.length === 0 && (
            <span className="text-[10px] font-black text-green-600">Al día</span>
          )}
        </div>
      ),
    },
    {
      header: 'Acciones',
      className: 'text-right',
      accessor: (c: Contract) => (
        <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
          <button onClick={() => setDocumentsContractId(c.id)} className="p-2 text-[#004C6C] hover:bg-blue-50 rounded-xl" title="Adjuntos">
            <FolderOpen size={17} />
          </button>
          {canEdit && (
            <button onClick={() => openEdit(c)} className="p-2 text-slate-500 hover:bg-slate-100 rounded-xl" title="Editar">
              <Edit2 size={17} />
            </button>
          )}
          {canDelete && (
            <button onClick={() => setContractToDelete(c)} className="p-2 text-red-400 hover:bg-red-50 rounded-xl" title="Eliminar">
              <Trash2 size={17} />
            </button>
          )}
        </div>
      ),
    },
  ];

  if (!activeProject) {
    return (
      <div className="flex h-[60vh] items-center justify-center font-bold text-slate-400">
        Selecciona un proyecto para gestionar sus contratos.
      </div>
    );
  }

  return (
    <div className="max-w-[1600px] mx-auto flex flex-col gap-6 md:gap-8 py-4 md:py-6 px-4 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-gradient-to-r from-[#004C6C] via-[#005981] to-[#003850] p-6 md:p-8 rounded-[32px] text-white shadow-xl relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-white/5 rounded-full blur-3xl" />
        <div className="flex items-center gap-4 relative z-10">
          <div className="h-14 w-14 bg-white/10 rounded-2xl flex items-center justify-center border border-white/10">
            <FileSignature size={28} />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight">Módulo Contratación</h1>
            <p className="text-xs font-bold text-white/60 uppercase tracking-widest mt-1">{activeProject.name}</p>
          </div>
        </div>
        <div className="relative z-10 flex flex-col sm:flex-row gap-3">
          {canEdit && (
            <button onClick={() => setTypesOpen(true)}
              className="flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 border border-white/15 text-white px-5 py-3.5 rounded-2xl font-bold transition-all">
              <Tag size={18} /> Tipos de contrato
            </button>
          )}
          {canCreate && (
            <button onClick={openCreate}
              className="flex items-center justify-center gap-2 bg-[#EE9D4C] hover:bg-[#e08a35] text-white px-6 py-3.5 rounded-2xl font-bold shadow-lg transition-all hover:scale-[1.02]">
              <Plus size={18} /> Nuevo contrato
            </button>
          )}
        </div>
      </div>

      {/* Indicadores */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Contratos', value: stats.total, icon: <Layers size={20} />, tone: 'text-[#004C6C] bg-blue-50' },
          { label: 'Con adjuntos faltantes', value: stats.missing, icon: <AlertTriangle size={20} />, tone: 'text-orange-600 bg-orange-50' },
          { label: 'Pólizas por vencer', value: stats.policies, icon: <ShieldAlert size={20} />, tone: 'text-red-600 bg-red-50' },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-[28px] border border-slate-100 shadow-sm p-5 flex items-center gap-4">
            <div className={`h-12 w-12 rounded-2xl flex items-center justify-center ${s.tone}`}>{s.icon}</div>
            <div>
              <p className="text-2xl font-black text-slate-800">{s.value}</p>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {alerts && <ContractAlertsPanel alerts={alerts} onOpenContract={setDocumentsContractId} />}

      {/* Filtros */}
      <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm p-5 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-[2fr_1fr_1fr_1fr_auto] gap-4 items-end">
        <div className="relative">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
          <input
            className="w-full bg-slate-50 border border-slate-100 rounded-2xl pl-12 pr-4 py-3.5 text-sm font-bold text-slate-700 outline-none focus:border-[#004C6C]"
            placeholder="Buscar por ID, consecutivo, contratista u objeto"
            value={filters.search}
            onChange={(e) => setFilter('search', e.target.value)}
          />
        </div>
        <CustomSelect
          placeholder="Frente de obra"
          clearable
          onClear={() => setFilter('tower_id', '')}
          options={(catalogs?.towers ?? []).map((t) => ({ value: String(t.id), label: t.name }))}
          value={filters.tower_id}
          onChange={(v) => setFilter('tower_id', String(v))}
        />
        <CustomSelect
          placeholder="Tipo de contrato"
          clearable
          onClear={() => setFilter('contract_type_id', '')}
          options={(catalogs?.contract_types ?? []).map((t) => ({ value: String(t.id), label: t.name }))}
          value={filters.contract_type_id}
          onChange={(v) => setFilter('contract_type_id', String(v))}
        />
        <CustomSelect
          placeholder="Estado"
          searchable={false}
          clearable
          onClear={() => setFilter('status', '')}
          options={(catalogs?.statuses ?? []).map((s) => ({ value: s, label: s }))}
          value={filters.status}
          onChange={(v) => setFilter('status', String(v))}
        />
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('alerts_only', !filters.alerts_only)}
            className={`px-4 py-3.5 rounded-2xl text-xs font-bold whitespace-nowrap transition-all ${filters.alerts_only ? 'bg-orange-500 text-white' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}
          >
            Solo con alertas
          </button>
          {hasFilters && (
            <button onClick={clearFilters} className="p-3.5 rounded-2xl bg-slate-50 text-slate-400 hover:bg-slate-100" title="Limpiar filtros">
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-100 rounded-2xl text-xs font-bold text-red-600 text-center">{error}</div>
      )}

      <DataTable
        columns={columns}
        data={contracts}
        isLoading={loading}
        onRowClick={(c) => setDocumentsContractId(c.id)}
        emptyMessage="No hay contratos registrados para este proyecto."
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

      <ContractFormModal
        isOpen={formOpen}
        onClose={() => setFormOpen(false)}
        onSave={handleSave}
        onCreateTower={(name) => createTower(name)}
        contract={editingContract}
        catalogs={catalogs}
        projectName={activeProject.name}
      />

      <ContractDocumentsModal
        isOpen={documentsContractId !== null}
        onClose={() => setDocumentsContractId(null)}
        onChanged={refresh}
        contractId={documentsContractId}
        catalogs={catalogs}
        canUpload={canCreate || canEdit}
        canDelete={canEdit}
      />

      <ContractTypesModal
        isOpen={typesOpen}
        onClose={() => setTypesOpen(false)}
        onChanged={refreshCatalogs}
        canDelete={canDelete}
      />

      <Modal
        isOpen={contractToDelete !== null}
        onClose={() => setContractToDelete(null)}
        onConfirm={handleDelete}
        type="danger"
        title="Eliminar contrato"
        message={`Se eliminará el contrato ${contractToDelete?.contract_code ?? ''} de la aplicación. Los archivos se conservan en el repositorio documental.`}
        confirmText="Eliminar"
      />
    </div>
  );
}
