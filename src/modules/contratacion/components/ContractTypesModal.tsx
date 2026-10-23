import React, { useEffect, useState } from 'react';
import { X, Tag, Plus, Edit2, Trash2, Loader2, Check, AlertCircle } from 'lucide-react';
import { Portal } from '../../../components/ui/Portal';
import { useNotification } from '../../../context/NotificationContext';
import { contratacionService, getApiErrorMessage } from '../services/contratacionService';
import type { ContractTypeOption, ContractTypePayload } from '../types';

interface ContractTypesModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Se llama tras crear, editar o eliminar para refrescar el catálogo del formulario de contratos */
  onChanged: () => void;
  canDelete: boolean;
}

const inputClass =
  'w-full bg-white border border-slate-100 rounded-2xl px-4 py-3 text-sm font-bold text-slate-700 focus:border-[#004C6C] outline-none transition-all shadow-sm placeholder:text-slate-300 disabled:opacity-60';

const emptyForm: ContractTypePayload = { name: '', description: '' };

// El contenido se monta en cada apertura (Portal lo desmonta al cerrar), así arranca con la lista fresca
export const ContractTypesModal: React.FC<ContractTypesModalProps> = ({ isOpen, ...props }) => (
  <Portal isOpen={isOpen}>
    <ContractTypesContent {...props} />
  </Portal>
);

const ContractTypesContent: React.FC<Omit<ContractTypesModalProps, 'isOpen'>> = ({ onClose, onChanged, canDelete }) => {
  const { showNotification } = useNotification();
  const [types, setTypes] = useState<ContractTypeOption[] | null>(null);
  const [newType, setNewType] = useState<ContractTypePayload>(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<ContractTypePayload>(emptyForm);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadTypes = () =>
    contratacionService.getContractTypes()
      .then(setTypes)
      .catch((err) => setError(getApiErrorMessage(err, 'Error al cargar los tipos de contrato.')));

  useEffect(() => {
    loadTypes();
  }, []);

  // Ejecuta una acción, recarga la lista y avisa al formulario de contratos
  const run = async (action: () => Promise<unknown>, successMessage?: string) => {
    setBusy(true);
    setError(null);
    try {
      const result = await action();
      await loadTypes();
      onChanged();
      showNotification(typeof result === 'string' ? result : successMessage ?? 'Cambios guardados.', 'success');
      return true;
    } catch (err) {
      setError(getApiErrorMessage(err, 'Error al guardar el tipo de contrato.'));
      return false;
    } finally {
      setBusy(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newType.name.trim()) return;
    const ok = await run(
      () => contratacionService.createContractType({ name: newType.name.trim(), description: newType.description?.trim() || null }),
      'Tipo de contrato creado.'
    );
    if (ok) setNewType(emptyForm);
  };

  const startEdit = (type: ContractTypeOption) => {
    setEditingId(type.id);
    setEditForm({ name: type.name, description: type.description ?? '' });
    setDeletingId(null);
  };

  const handleUpdate = async (id: number) => {
    if (!editForm.name.trim()) return;
    const ok = await run(
      () => contratacionService.updateContractType(id, { name: editForm.name.trim(), description: editForm.description?.trim() || null }),
      'Tipo de contrato actualizado.'
    );
    if (ok) setEditingId(null);
  };

  const handleDelete = async (id: number) => {
    const ok = await run(() => contratacionService.deleteContractType(id));
    if (ok) setDeletingId(null);
  };

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-[#f8fafc] w-full max-w-2xl rounded-[40px] shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-white p-8 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 bg-blue-50 text-[#004C6C] rounded-2xl flex items-center justify-center">
              <Tag size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-black text-[#004C6C] tracking-tight">Tipos de contrato</h2>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                Catálogo usado al crear contratos de obra
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-3 text-slate-300 hover:bg-slate-50 rounded-2xl transition-all cursor-pointer">
            <X size={24} />
          </button>
        </div>

        <div className="p-8 space-y-6 overflow-y-auto flex-1">
          {error && (
            <div className="p-4 bg-red-50 border border-red-100 rounded-2xl text-xs font-bold text-red-600 flex items-center gap-2 justify-center">
              <AlertCircle size={16} className="shrink-0" />
              <span className="whitespace-pre-line">{error}</span>
            </div>
          )}

          {/* Nuevo tipo */}
          <form onSubmit={handleCreate} className="bg-white rounded-3xl border border-slate-100 p-5 grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-3 items-end">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nombre *</label>
              <input required disabled={busy} className={inputClass} placeholder="Ej: Carpintería metálica"
                value={newType.name} onChange={(e) => setNewType({ ...newType, name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Descripción</label>
              <input disabled={busy} className={inputClass} placeholder="Opcional"
                value={newType.description ?? ''} onChange={(e) => setNewType({ ...newType, description: e.target.value })} />
            </div>
            <button type="submit" disabled={busy || !newType.name.trim()}
              className="flex items-center justify-center gap-2 px-5 py-3 bg-[#EE9D4C] hover:bg-[#e08a35] text-white rounded-2xl font-bold text-sm disabled:opacity-50">
              {busy && editingId === null && deletingId === null ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />} Agregar
            </button>
          </form>

          {/* Lista */}
          <div className="bg-white rounded-3xl border border-slate-100 divide-y divide-slate-50">
            {types === null && !error && (
              <div className="flex justify-center py-10"><Loader2 size={24} className="animate-spin text-[#004C6C]" /></div>
            )}
            {types?.length === 0 && (
              <p className="p-6 text-center text-xs font-bold text-slate-400 italic">No hay tipos de contrato registrados.</p>
            )}
            {types?.map((type) => (
              <div key={type.id} className="p-4">
                {editingId === type.id ? (
                  <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-2 items-center">
                    <input autoFocus disabled={busy} className={inputClass} value={editForm.name}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      onKeyDown={(e) => e.key === 'Enter' && handleUpdate(type.id)} />
                    <input disabled={busy} className={inputClass} placeholder="Descripción" value={editForm.description ?? ''}
                      onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                      onKeyDown={(e) => e.key === 'Enter' && handleUpdate(type.id)} />
                    <div className="flex gap-1 justify-end">
                      <button onClick={() => handleUpdate(type.id)} disabled={busy || !editForm.name.trim()}
                        className="p-3 rounded-2xl bg-[#004C6C] text-white disabled:opacity-50" title="Guardar">
                        {busy ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                      </button>
                      <button onClick={() => setEditingId(null)} disabled={busy}
                        className="p-3 rounded-2xl bg-slate-100 text-slate-500" title="Cancelar">
                        <X size={16} />
                      </button>
                    </div>
                  </div>
                ) : deletingId === type.id ? (
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <p className="text-xs font-bold text-red-600">
                      ¿Eliminar "{type.name}"? Si tiene contratos asociados solo se desactivará.
                    </p>
                    <div className="flex gap-2 shrink-0">
                      <button onClick={() => setDeletingId(null)} disabled={busy}
                        className="px-4 py-2 rounded-xl bg-slate-100 text-slate-500 text-xs font-bold">Cancelar</button>
                      <button onClick={() => handleDelete(type.id)} disabled={busy}
                        className="px-4 py-2 rounded-xl bg-red-500 text-white text-xs font-bold flex items-center gap-1">
                        {busy && <Loader2 size={12} className="animate-spin" />} Eliminar
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-black text-slate-700 truncate">{type.name}</p>
                      {type.description && <p className="text-[11px] font-bold text-slate-400 truncate">{type.description}</p>}
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <button onClick={() => startEdit(type)} disabled={busy}
                        className="p-2 text-slate-500 hover:bg-slate-100 rounded-xl" title="Editar">
                        <Edit2 size={16} />
                      </button>
                      {canDelete && (
                        <button onClick={() => { setDeletingId(type.id); setEditingId(null); }} disabled={busy}
                          className="p-2 text-red-400 hover:bg-red-50 rounded-xl" title="Eliminar">
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          <p className="text-xs font-bold text-slate-400">
            Cambiar el nombre de un tipo no mueve las carpetas de los contratos ya creados en el repositorio documental.
          </p>
        </div>
      </div>
    </div>
  );
};
