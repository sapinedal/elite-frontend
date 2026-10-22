import React, { useEffect, useState } from 'react';
import { X, Save, FileSignature, AlertCircle, Plus, Trash2, ShieldCheck, Loader2, Check } from 'lucide-react';
import { Portal } from '../../../components/ui/Portal';
import { CustomSelect } from '../../../components/ui/CustomSelect';
import type { Contract, ContractPayload, ContractPolicy, ContratacionCatalogs } from '../types';

interface ContractFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (payload: ContractPayload, id?: number) => Promise<Contract>;
  onCreateTower: (name: string) => Promise<{ id: number }>;
  contract: Contract | null;
  catalogs: ContratacionCatalogs | null;
  projectName?: string;
}

const emptyForm = (status = ''): ContractPayload => ({
  tower_id: null,
  contract_type_id: null,
  contract_code: '',
  consecutive: '',
  contractor_name: '',
  object: '',
  signed_at: null,
  start_act_date: null,
  estimated_end_date: null,
  status,
  policies: [],
});

const inputClass =
  'w-full bg-white border border-slate-100 rounded-2xl px-5 py-3.5 text-sm font-bold text-slate-700 focus:border-[#004C6C] outline-none transition-all shadow-sm placeholder:text-slate-300 disabled:opacity-60';
const labelClass = 'text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1';

export const ContractFormModal: React.FC<ContractFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onCreateTower,
  contract,
  catalogs,
  projectName,
}) => {
  const [form, setForm] = useState<ContractPayload>(emptyForm());
  const [submitting, setSubmitting] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [newTowerName, setNewTowerName] = useState<string | null>(null);
  const [creatingTower, setCreatingTower] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    if (contract) {
      setForm({
        tower_id: contract.tower_id,
        contract_type_id: contract.contract_type_id,
        contract_code: contract.contract_code,
        consecutive: contract.consecutive,
        contractor_name: contract.contractor_name,
        object: contract.object,
        signed_at: contract.signed_at,
        start_act_date: contract.start_act_date,
        estimated_end_date: contract.estimated_end_date,
        status: contract.status,
        policies: contract.policies.map(({ id, policy_type, policy_number, insurer, expires_at }) => ({
          id, policy_type, policy_number: policy_number ?? '', insurer: insurer ?? '', expires_at,
        })),
      });
    } else {
      setForm(emptyForm(catalogs?.statuses[0] ?? ''));
    }
    setLocalError(null);
    setNewTowerName(null);
  }, [contract, isOpen, catalogs]);

  const set = <K extends keyof ContractPayload>(key: K, value: ContractPayload[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const setPolicy = (index: number, key: keyof ContractPolicy, value: string) =>
    setForm((prev) => ({
      ...prev,
      policies: prev.policies.map((p, i) => (i === index ? { ...p, [key]: value } : p)),
    }));

  const addPolicy = () =>
    setForm((prev) => ({
      ...prev,
      policies: [...prev.policies, { policy_type: catalogs?.policy_types[0] ?? '', policy_number: '', insurer: '', expires_at: '' }],
    }));

  const removePolicy = (index: number) =>
    setForm((prev) => ({ ...prev, policies: prev.policies.filter((_, i) => i !== index) }));

  const handleCreateTower = async () => {
    if (!newTowerName?.trim()) return;
    setCreatingTower(true);
    setLocalError(null);
    try {
      const tower = await onCreateTower(newTowerName.trim());
      set('tower_id', tower.id);
      setNewTowerName(null);
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : String(err));
    } finally {
      setCreatingTower(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.tower_id || !form.contract_type_id) {
      setLocalError('Selecciona el frente de obra y el tipo de contrato.');
      return;
    }
    if (form.policies.some((p) => !p.expires_at)) {
      setLocalError('Todas las pólizas deben tener fecha de vigencia.');
      return;
    }

    setSubmitting(true);
    setLocalError(null);
    try {
      await onSave(
        {
          ...form,
          contract_code: form.contract_code.trim(),
          consecutive: form.consecutive.trim(),
          contractor_name: form.contractor_name.trim(),
          object: form.object.trim(),
          signed_at: form.signed_at || null,
          start_act_date: form.start_act_date || null,
          estimated_end_date: form.estimated_end_date || null,
        },
        contract?.id
      );
      onClose();
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'Error al guardar el contrato.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Portal isOpen={isOpen}>
      <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
        <div className="bg-[#f8fafc] w-full max-w-4xl rounded-[40px] shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
          {/* Header */}
          <div className="bg-white p-8 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 bg-blue-50 text-[#004C6C] rounded-2xl flex items-center justify-center">
                <FileSignature size={24} />
              </div>
              <div>
                <h2 className="text-2xl font-black text-[#004C6C] tracking-tight">
                  {contract ? 'Editar Contrato' : 'Nuevo Contrato'}
                </h2>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                  {projectName ? `Proyecto: ${projectName}` : 'Módulo Contratación'}
                </p>
              </div>
            </div>
            <button onClick={onClose} className="p-3 text-slate-300 hover:bg-slate-50 rounded-2xl transition-all cursor-pointer">
              <X size={24} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-8 space-y-8 overflow-y-auto flex-1">
            {localError && (
              <div className="p-4 bg-red-50 border border-red-100 rounded-2xl text-xs font-bold text-red-600 flex items-center gap-2 justify-center">
                <AlertCircle size={16} />
                <span className="whitespace-pre-line">{localError}</span>
              </div>
            )}

            {/* Ubicación */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                {newTowerName === null ? (
                  <>
                    <CustomSelect
                      label="Frente de obra *"
                      placeholder="Selecciona el frente"
                      disabled={submitting}
                      options={(catalogs?.towers ?? []).map((t) => ({ value: t.id, label: t.name }))}
                      value={form.tower_id}
                      onChange={(v) => set('tower_id', Number(v))}
                    />
                    <button
                      type="button"
                      onClick={() => setNewTowerName('')}
                      className="text-[11px] font-bold text-[#EE9D4C] hover:underline ml-1 flex items-center gap-1"
                    >
                      <Plus size={12} /> Crear frente de obra
                    </button>
                  </>
                ) : (
                  <>
                    <label className={labelClass}>Nuevo frente de obra</label>
                    <div className="flex gap-2">
                      <input
                        autoFocus
                        className={inputClass}
                        placeholder="Ej: TORRE 3"
                        value={newTowerName}
                        onChange={(e) => setNewTowerName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleCreateTower();
                          }
                        }}
                      />
                      <button
                        type="button"
                        disabled={creatingTower || !newTowerName.trim()}
                        onClick={handleCreateTower}
                        className="px-4 rounded-2xl bg-[#004C6C] text-white disabled:opacity-50"
                        title="Crear frente"
                      >
                        {creatingTower ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
                      </button>
                      <button
                        type="button"
                        onClick={() => setNewTowerName(null)}
                        className="px-4 rounded-2xl bg-slate-100 text-slate-500"
                        title="Cancelar"
                      >
                        <X size={18} />
                      </button>
                    </div>
                  </>
                )}
              </div>
              <CustomSelect
                label="Tipo de contrato *"
                placeholder="Selecciona el tipo"
                disabled={submitting}
                options={(catalogs?.contract_types ?? []).map((t) => ({ value: t.id, label: t.name }))}
                value={form.contract_type_id}
                onChange={(v) => set('contract_type_id', Number(v))}
              />
            </div>

            {/* Identificación */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className={labelClass}>ID del contrato *</label>
                <input required disabled={submitting} className={inputClass} placeholder="Ej: CSM-T1-MO-001"
                  value={form.contract_code} onChange={(e) => set('contract_code', e.target.value)} />
              </div>
              <div className="space-y-2">
                <label className={labelClass}>Consecutivo *</label>
                <input required disabled={submitting} className={inputClass} placeholder="Ej: 01"
                  value={form.consecutive} onChange={(e) => set('consecutive', e.target.value)} />
              </div>
              <CustomSelect
                label="Estado *"
                placeholder="Selecciona el estado"
                searchable={false}
                disabled={submitting}
                options={(catalogs?.statuses ?? []).map((s) => ({ value: s, label: s }))}
                value={form.status}
                onChange={(v) => set('status', String(v))}
              />
            </div>

            <div className="space-y-2">
              <label className={labelClass}>Nombre del contratista *</label>
              <input required disabled={submitting} className={inputClass} placeholder="Ej: Interlift S.A.S"
                value={form.contractor_name} onChange={(e) => set('contractor_name', e.target.value)} />
            </div>

            <div className="space-y-2">
              <label className={labelClass}>Objeto del contrato *</label>
              <textarea required disabled={submitting} rows={3} className={`${inputClass} resize-none`}
                placeholder="Describe el alcance del contrato"
                value={form.object} onChange={(e) => set('object', e.target.value)} />
            </div>

            {/* Fechas */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className={labelClass}>Fecha de firma</label>
                <input type="date" disabled={submitting} className={inputClass}
                  value={form.signed_at ?? ''} onChange={(e) => set('signed_at', e.target.value)} />
              </div>
              <div className="space-y-2">
                <label className={labelClass}>Fecha acta de inicio</label>
                <input type="date" disabled={submitting} className={inputClass}
                  value={form.start_act_date ?? ''} onChange={(e) => set('start_act_date', e.target.value)} />
              </div>
              <div className="space-y-2">
                <label className={labelClass}>Terminación estimada</label>
                <input type="date" disabled={submitting} className={inputClass}
                  value={form.estimated_end_date ?? ''} onChange={(e) => set('estimated_end_date', e.target.value)} />
              </div>
            </div>

            {/* Pólizas */}
            <div className="bg-white rounded-3xl border border-slate-100 p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck size={18} className="text-[#004C6C]" />
                  <h3 className="font-black text-[#004C6C] tracking-tight">Pólizas</h3>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    Alerta {catalogs?.policy_alert_days ?? 40} días antes del vencimiento
                  </span>
                </div>
                <button type="button" onClick={addPolicy} disabled={submitting}
                  className="flex items-center gap-1 text-xs font-bold text-white bg-[#EE9D4C] hover:bg-[#e08a35] px-3 py-2 rounded-xl transition-all">
                  <Plus size={14} /> Agregar póliza
                </button>
              </div>

              {form.policies.length === 0 && (
                <p className="text-xs font-bold text-slate-400 italic">Sin pólizas registradas.</p>
              )}

              {form.policies.map((policy, index) => (
                <div key={policy.id ?? `new-${index}`} className="grid grid-cols-1 md:grid-cols-[1.4fr_1fr_1fr_1fr_auto] gap-3 items-end">
                  <CustomSelect
                    label="Tipo de póliza"
                    searchable={false}
                    disabled={submitting}
                    options={(catalogs?.policy_types ?? []).map((t) => ({ value: t, label: t }))}
                    value={policy.policy_type}
                    onChange={(v) => setPolicy(index, 'policy_type', String(v))}
                  />
                  <div className="space-y-2">
                    <label className={labelClass}>N° póliza</label>
                    <input disabled={submitting} className={inputClass} value={policy.policy_number ?? ''}
                      onChange={(e) => setPolicy(index, 'policy_number', e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <label className={labelClass}>Aseguradora</label>
                    <input disabled={submitting} className={inputClass} value={policy.insurer ?? ''}
                      onChange={(e) => setPolicy(index, 'insurer', e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <label className={labelClass}>Vigencia hasta *</label>
                    <input type="date" required disabled={submitting} className={inputClass} value={policy.expires_at}
                      onChange={(e) => setPolicy(index, 'expires_at', e.target.value)} />
                  </div>
                  <button type="button" onClick={() => removePolicy(index)} disabled={submitting}
                    className="p-3.5 text-red-400 hover:bg-red-50 rounded-2xl transition-all" title="Quitar póliza">
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
            </div>

            {!contract && (
              <p className="text-xs font-bold text-slate-400">
                Al guardar se crea la carpeta del contrato en el repositorio documental y podrás cargar los adjuntos de inmediato o más adelante.
              </p>
            )}

            <div className="flex gap-4 pt-2">
              <button type="button" onClick={onClose} disabled={submitting}
                className="flex-1 px-6 py-4 bg-white text-slate-500 rounded-2xl font-bold hover:bg-slate-100 border border-slate-100 transition-all">
                Cancelar
              </button>
              <button type="submit" disabled={submitting}
                className="flex-1 px-6 py-4 bg-[#004C6C] hover:bg-[#003a53] text-white rounded-2xl font-bold shadow-xl transition-all flex items-center justify-center gap-2 disabled:opacity-60">
                {submitting ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                {contract ? 'Guardar cambios' : 'Crear contrato'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Portal>
  );
};
