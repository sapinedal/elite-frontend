import React, { useCallback, useEffect, useState } from 'react';
import { Search, Edit2, Trash2, Truck, CheckCircle2, XCircle, X, Loader2, Power } from 'lucide-react';
import { DataTable } from '../../../components/ui/DataTable';
import { Portal } from '../../../components/ui/Portal';
import { useAuth } from '../../../context/AuthContext';
import { useConfirm } from '../../../context/ConfirmContext';
import { useNotification } from '../../../context/NotificationContext';
import { getErrorMessage } from '../../../lib/apiError';
import { proveedorService, type Proveedor, type UpdateProveedorDTO } from '../services/proveedorService';

const inputClass =
  'w-full bg-slate-50/70 border border-slate-200 rounded-2xl px-5 py-3.5 text-slate-800 font-bold focus:bg-white focus:border-[#004C6C] focus:ring-4 focus:ring-blue-900/5 transition-all outline-none text-sm placeholder:text-slate-300';

export default function ProveedoresPage() {
  const confirm = useConfirm();
  const { showNotification } = useNotification();
  const { user } = useAuth();
  const canEdit = user?.permissions?.includes('configuracion.editar') ?? false;

  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [editing, setEditing] = useState<Proveedor | null>(null);

  const fetchProveedores = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      setProveedores(await proveedorService.getAll());
    } catch (err) {
      setError(getErrorMessage(err, 'Error al cargar los proveedores'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProveedores();
  }, [fetchProveedores]);

  const search = searchTerm.toLowerCase();
  const filtered = proveedores.filter(
    (p) => p.name.toLowerCase().includes(search) || (p.nit || '').toLowerCase().includes(search),
  );

  const handleToggleActive = async (proveedor: Proveedor) => {
    try {
      await proveedorService.update(proveedor.id, { is_active: !proveedor.is_active });
      showNotification(proveedor.is_active ? 'Proveedor desactivado' : 'Proveedor activado', 'success');
      fetchProveedores();
    } catch (err) {
      showNotification(getErrorMessage(err, 'No se pudo cambiar el estado del proveedor.'), 'error');
    }
  };

  const handleDelete = async (proveedor: Proveedor) => {
    if (proveedor.usage_count > 0) {
      const deactivate = await confirm({
        title: 'Proveedor en uso',
        message: `${proveedor.name} tiene ${proveedor.usage_count} registro(s) asociados (contratos, cortes, pagos, etc.) y no se puede eliminar. ${
          proveedor.is_active ? '¿Deseas desactivarlo para que no aparezca en los formularios?' : 'Ya está desactivado.'
        }`,
        confirmText: proveedor.is_active ? 'Desactivar' : 'Entendido',
      });
      if (deactivate && proveedor.is_active) await handleToggleActive(proveedor);
      return;
    }

    if (!(await confirm({
      title: 'Eliminar proveedor',
      message: `¿Seguro que deseas eliminar a ${proveedor.name}? Esta acción no se puede deshacer.`,
      confirmText: 'Eliminar',
      tone: 'danger',
    }))) return;

    try {
      await proveedorService.remove(proveedor.id);
      showNotification('Proveedor eliminado exitosamente', 'success');
      fetchProveedores();
    } catch (err) {
      showNotification(getErrorMessage(err, 'Ocurrió un error al eliminar el proveedor.'), 'error');
      fetchProveedores();
    }
  };

  const columns = [
    {
      header: 'Proveedor',
      accessor: (p: Proveedor) => (
        <div className="flex items-center gap-4">
          <div className="h-11 w-11 rounded-2xl bg-blue-50/80 border border-blue-100 flex items-center justify-center text-[#004C6C] font-black">
            {p.name.charAt(0).toUpperCase()}
          </div>
          <div className="flex flex-col">
            <span className="text-slate-800 font-black text-base">{p.name}</span>
            <span className="text-xs text-slate-400 font-semibold">{p.nit ? `NIT ${p.nit}` : 'Sin NIT'}</span>
          </div>
        </div>
      ),
    },
    {
      header: 'Contacto',
      accessor: (p: Proveedor) => (
        <div className="flex flex-col text-xs text-slate-500 font-medium">
          <span>{p.email || <span className="text-slate-300 italic">Sin correo</span>}</span>
          <span>{p.phone || <span className="text-slate-300 italic">Sin teléfono</span>}</span>
        </div>
      ),
    },
    {
      header: 'Registros',
      accessor: (p: Proveedor) => (
        <span className="text-sm font-black text-slate-700">{p.usage_count}</span>
      ),
    },
    {
      header: 'Estado',
      accessor: (p: Proveedor) => (
        <span
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${
            p.is_active ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-500 border-slate-200'
          }`}
        >
          {p.is_active ? <CheckCircle2 size={12} className="text-emerald-500" /> : <XCircle size={12} className="text-slate-400" />}
          {p.is_active ? 'Activo' : 'Inactivo'}
        </span>
      ),
    },
    ...(canEdit
      ? [
          {
            header: 'Acciones',
            className: 'text-right',
            accessor: (p: Proveedor) => (
              <div className="flex items-center gap-2 justify-end" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={() => handleToggleActive(p)}
                  title={p.is_active ? 'Desactivar' : 'Activar'}
                  className="p-3 text-slate-400 hover:text-[#004C6C] hover:bg-blue-50 rounded-2xl transition-all"
                >
                  <Power size={18} />
                </button>
                <button
                  onClick={() => setEditing(p)}
                  title="Editar proveedor"
                  className="p-3 text-slate-400 hover:text-[#EE9D4C] hover:bg-orange-50 rounded-2xl transition-all"
                >
                  <Edit2 size={18} />
                </button>
                <button
                  onClick={() => handleDelete(p)}
                  title="Eliminar proveedor"
                  className="p-3 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ),
          },
        ]
      : []),
  ];

  return (
    <div className="max-w-7xl mx-auto p-8 space-y-10 animate-fade-in">
      <div className="space-y-1">
        <h1 className="text-4xl font-black text-[#004C6C] tracking-tight">Proveedores</h1>
        <p className="text-slate-400 font-bold uppercase tracking-[0.2em]">
          Edita, desactiva o elimina proveedores. Se crean desde Contratación
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-[32px] p-6 border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Total Proveedores</p>
            <p className="text-4xl font-black text-[#004C6C] tracking-tighter">{proveedores.length}</p>
          </div>
          <div className="h-14 w-14 bg-blue-50 rounded-[20px] flex items-center justify-center text-[#004C6C] border border-blue-100">
            <Truck size={26} />
          </div>
        </div>
        <div className="bg-white rounded-[32px] p-6 border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Activos</p>
            <p className="text-4xl font-black text-emerald-600 tracking-tighter">
              {proveedores.filter((p) => p.is_active).length}
            </p>
          </div>
          <div className="h-14 w-14 bg-emerald-50 rounded-[20px] flex items-center justify-center text-emerald-600 border border-emerald-100">
            <CheckCircle2 size={26} />
          </div>
        </div>
      </div>

      <div className="group relative">
        <div className="absolute left-7 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#004C6C] transition-colors z-10">
          <Search size={22} />
        </div>
        <input
          type="text"
          placeholder="Buscar por nombre o NIT..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-white border border-slate-200 rounded-[32px] pl-16 pr-8 py-5 text-slate-700 font-bold shadow-sm focus:border-[#004C6C] transition-all outline-none text-base placeholder:text-slate-300"
        />
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-red-600 text-sm font-bold">{error}</div>
      )}

      <DataTable
        columns={columns}
        data={filtered}
        isLoading={isLoading}
        emptyMessage="No se encontraron proveedores"
        onRowClick={canEdit ? (p) => setEditing(p) : undefined}
      />

      <ProveedorModal
        proveedor={editing}
        onClose={() => setEditing(null)}
        onSaved={() => {
          setEditing(null);
          showNotification('Proveedor actualizado exitosamente', 'success');
          fetchProveedores();
        }}
      />
    </div>
  );
}

const ProveedorModal: React.FC<{
  proveedor: Proveedor | null;
  onClose: () => void;
  onSaved: () => void;
}> = ({ proveedor, onClose, onSaved }) => {
  const [form, setForm] = useState<UpdateProveedorDTO>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (proveedor) {
      setForm({ name: proveedor.name, nit: proveedor.nit ?? '', email: proveedor.email ?? '', phone: proveedor.phone ?? '' });
    }
    setErrorMessage(null);
  }, [proveedor]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!proveedor) return;
    if (!form.name?.trim()) {
      setErrorMessage('El nombre del proveedor es requerido');
      return;
    }
    try {
      setIsSubmitting(true);
      setErrorMessage(null);
      await proveedorService.update(proveedor.id, {
        name: form.name.trim(),
        nit: form.nit?.trim() || null,
        email: form.email?.trim() || null,
        phone: form.phone?.trim() || null,
      });
      onSaved();
    } catch (err) {
      setErrorMessage(getErrorMessage(err, 'Error al guardar el proveedor'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const field = (key: 'name' | 'nit' | 'email' | 'phone', label: string, type = 'text') => (
    <div className="space-y-2">
      <label className="text-xs font-black text-slate-500 uppercase tracking-wider">{label}</label>
      <input
        type={type}
        value={(form[key] as string) ?? ''}
        onChange={(e) => setForm({ ...form, [key]: e.target.value })}
        className={inputClass}
      />
    </div>
  );

  return (
    <Portal isOpen={proveedor !== null} onClose={onClose}>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6 bg-slate-900/60 backdrop-blur-md animate-fade-in">
        <div
          className="bg-white rounded-[32px] w-full max-w-xl max-h-[90vh] shadow-2xl overflow-hidden border border-slate-100 animate-scale-up flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="bg-[#004C6C] p-6 md:p-8 text-white flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 bg-white/10 rounded-2xl flex items-center justify-center border border-white/10">
                <Truck className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-2xl font-black tracking-tight">Editar Proveedor</h2>
            </div>
            <button onClick={onClose} className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-xl transition-all">
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6">
            {errorMessage && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-red-600 text-xs font-bold whitespace-pre-line">
                {errorMessage}
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {field('name', 'Nombre *')}
              {field('nit', 'NIT')}
              {field('email', 'Correo', 'email')}
              {field('phone', 'Teléfono')}
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-3 rounded-2xl font-black text-sm text-slate-500 hover:bg-slate-100 transition-all"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center gap-2 px-6 py-3 bg-[#004C6C] text-white rounded-2xl font-black text-sm hover:bg-[#003a53] transition-all disabled:opacity-60"
              >
                {isSubmitting && <Loader2 size={16} className="animate-spin" />}
                Guardar
              </button>
            </div>
          </form>
        </div>
      </div>
    </Portal>
  );
};
