import React, { useState, useEffect } from 'react';
import { X, FileText, Building2, DollarSign, ShieldCheck, Link2, Briefcase, Hash, Calendar, Loader2, Plus } from 'lucide-react';
import { Portal } from '../../../components/ui/Portal';
import type { Contract, CreateContractDTO, Tower, ContractType } from '../types';

interface ProjectOption {
  id: number | string;
  name: string;
  code: string;
}

interface ContractModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: CreateContractDTO) => Promise<void>;
  contract: Contract | null;
  projects: ProjectOption[];
  towers: Tower[];
  contractTypes: ContractType[];
  selectedProjectId?: number | string;
  onOpenCreateTypeModal?: () => void;
}

export const ContractModal: React.FC<ContractModalProps> = ({
  isOpen,
  onClose,
  onSave,
  contract,
  projects,
  towers,
  contractTypes,
  selectedProjectId,
  onOpenCreateTypeModal
}) => {
  const [formData, setFormData] = useState<CreateContractDTO>({
    nro: '',
    project_id: selectedProjectId ? Number(selectedProjectId) : null,
    tower_id: null,
    contractor_name_raw: '',
    type: 'Mano de Obra',
    category: 'General',
    object: '',
    amount: 0,
    status: 'Vigente',
    drive_link: 'https://drive.google.com/drive/folders/1YIUcRPuGpLlfvX_XSymzjekEy4jAqlwD',
    policy: {
      policy_number: '',
      insurance_company: '',
      insured_value: 0,
      end_date: ''
    }
  });

  const [amountDisplay, setAmountDisplay] = useState<string>('');
  const [policyAmountDisplay, setPolicyAmountDisplay] = useState<string>('');

  const [hasPolicy, setHasPolicy] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const formatCOPNumber = (num: number): string => {
    if (!num || isNaN(num)) return '';
    return new Intl.NumberFormat('es-CO', { maximumFractionDigits: 0 }).format(num);
  };

  useEffect(() => {
    if (contract) {
      const pol = contract.policy || (contract.policies && contract.policies[0]);
      const initialAmount = contract.amount || 0;
      const initialInsured = pol ? (pol.insured_value || initialAmount) : 0;

      setFormData({
        nro: contract.nro || '',
        project_id: contract.project_id ? Number(contract.project_id) : (selectedProjectId ? Number(selectedProjectId) : null),
        tower_id: contract.tower_id ? Number(contract.tower_id) : null,
        contractor_name_raw: contract.contractor_name_raw || '',
        type: contract.type || (contractTypes[0] ? contractTypes[0].name : 'Mano de Obra'),
        category: contract.category || 'General',
        object: contract.object || '',
        amount: initialAmount,
        status: contract.status || 'Vigente',
        drive_link: contract.drive_link || 'https://drive.google.com/drive/folders/1YIUcRPuGpLlfvX_XSymzjekEy4jAqlwD',
        policy: pol ? {
          policy_number: pol.policy_number || '',
          insurance_company: pol.insurance_company || '',
          insured_value: initialInsured,
          end_date: pol.end_date || ''
        } : null
      });

      setAmountDisplay(initialAmount ? formatCOPNumber(initialAmount) : '');
      setPolicyAmountDisplay(initialInsured ? formatCOPNumber(initialInsured) : '');
      setHasPolicy(!!pol);
    } else {
      setFormData({
        nro: '',
        project_id: selectedProjectId ? Number(selectedProjectId) : (projects[0] ? Number(projects[0].id) : null),
        tower_id: towers[0] ? Number(towers[0].id) : null,
        contractor_name_raw: '',
        type: contractTypes[0] ? contractTypes[0].name : 'Mano de Obra',
        category: 'General',
        object: '',
        amount: 0,
        status: 'Vigente',
        drive_link: 'https://drive.google.com/drive/folders/1YIUcRPuGpLlfvX_XSymzjekEy4jAqlwD',
        policy: {
          policy_number: '',
          insurance_company: '',
          insured_value: 0,
          end_date: ''
        }
      });
      setAmountDisplay('');
      setPolicyAmountDisplay('');
      setHasPolicy(true);
    }
    setErrorMessage(null);
  }, [contract, isOpen, selectedProjectId, projects, towers, contractTypes]);

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawDigits = e.target.value.replace(/\D/g, '');
    const num = rawDigits ? parseInt(rawDigits, 10) : 0;
    setFormData((prev) => ({ ...prev, amount: num }));
    setAmountDisplay(rawDigits ? formatCOPNumber(num) : '');
  };

  const handlePolicyAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawDigits = e.target.value.replace(/\D/g, '');
    const num = rawDigits ? parseInt(rawDigits, 10) : 0;
    setFormData((prev) => ({
      ...prev,
      policy: {
        ...(prev.policy || { policy_number: '', insurance_company: '', end_date: '' }),
        insured_value: num
      }
    }));
    setPolicyAmountDisplay(rawDigits ? formatCOPNumber(num) : '');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nro.trim() || !formData.contractor_name_raw.trim() || !formData.type.trim()) {
      setErrorMessage('El número de contrato, contratista y tipo son obligatorios');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage(null);
      const payload: CreateContractDTO = {
        ...formData,
        amount: Number(formData.amount) || 0,
        policy: hasPolicy && formData.policy?.policy_number ? {
          ...formData.policy,
          insured_value: Number(formData.policy.insured_value) || Number(formData.amount) || 0
        } : null
      };

      await onSave(payload);
      onClose();
    } catch (err: any) {
      console.error('Error al guardar contrato:', err);
      setErrorMessage(
        err?.response?.data?.message || err?.message || 'Error al guardar el contrato'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Portal isOpen={isOpen}>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6 bg-slate-900/60 backdrop-blur-md animate-fade-in">
        <div 
          className="bg-white rounded-[32px] w-full max-w-3xl max-h-[90vh] shadow-2xl overflow-hidden border border-slate-100 animate-scale-up flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-[#004C6C] p-6 md:p-8 text-white relative overflow-hidden flex-shrink-0">
            <div className="absolute -right-8 -bottom-8 w-36 h-36 bg-white/5 rounded-full blur-2xl" />
            <div className="flex items-center justify-between relative z-10">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-md border border-white/10">
                  <FileText className="w-6 h-6 text-[#EE9D4C]" />
                </div>
                <div>
                  <h2 className="text-2xl font-black tracking-tight">
                    {contract ? 'Editar Contrato' : 'Nuevo Contrato'}
                  </h2>
                  <p className="text-xs font-bold text-white/60 uppercase tracking-widest mt-0.5">
                    {contract ? `ID: #${contract.id} — ${contract.nro}` : 'Ingresa los datos del contrato y póliza'}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-xl transition-all"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Form Body */}
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6">
            {errorMessage && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-red-600 text-xs font-bold animate-shake">
                {errorMessage}
              </div>
            )}

            {/* Fila 1: Proyecto y Torre */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-500 uppercase tracking-wider flex items-center gap-2">
                  <Building2 size={14} className="text-[#004C6C]" />
                  Proyecto *
                </label>
                <select
                  value={formData.project_id || ''}
                  onChange={(e) => setFormData({ ...formData, project_id: Number(e.target.value) || null })}
                  className="w-full bg-slate-50/70 border border-slate-200 rounded-2xl px-5 py-3.5 text-slate-800 font-bold focus:bg-white focus:border-[#004C6C] focus:ring-4 focus:ring-blue-900/5 transition-all outline-none text-sm cursor-pointer"
                >
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black text-slate-500 uppercase tracking-wider flex items-center gap-2">
                  <Building2 size={14} className="text-[#004C6C]" />
                  Torre / Etapa / Categoría
                </label>
                <select
                  value={formData.tower_id || ''}
                  onChange={(e) => {
                    const selectedTower = towers.find(t => t.id === Number(e.target.value));
                    setFormData({
                      ...formData,
                      tower_id: Number(e.target.value) || null,
                      category: selectedTower ? selectedTower.name : formData.category
                    });
                  }}
                  className="w-full bg-slate-50/70 border border-slate-200 rounded-2xl px-5 py-3.5 text-slate-800 font-bold focus:bg-white focus:border-[#004C6C] focus:ring-4 focus:ring-blue-900/5 transition-all outline-none text-sm cursor-pointer"
                >
                  <option value="">Seleccionar Torre o Etapa</option>
                  {towers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Fila 2: Número de Contrato y Contratista */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-500 uppercase tracking-wider flex items-center gap-2">
                  <Hash size={14} className="text-[#004C6C]" />
                  N° / Código del Contrato *
                </label>
                <input
                  type="text"
                  placeholder="Ej. 1 T2, MO-05, URB-02"
                  value={formData.nro}
                  onChange={(e) => setFormData({ ...formData, nro: e.target.value })}
                  className="w-full bg-slate-50/70 border border-slate-200 rounded-2xl px-5 py-3.5 text-slate-800 font-bold focus:bg-white focus:border-[#004C6C] focus:ring-4 focus:ring-blue-900/5 transition-all outline-none text-sm placeholder:text-slate-300"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black text-slate-500 uppercase tracking-wider flex items-center gap-2">
                  <Briefcase size={14} className="text-[#004C6C]" />
                  Nombre del Contratista *
                </label>
                <input
                  type="text"
                  placeholder="Ej. EMELECT GROUP S.A.S."
                  value={formData.contractor_name_raw}
                  onChange={(e) => setFormData({ ...formData, contractor_name_raw: e.target.value })}
                  className="w-full bg-slate-50/70 border border-slate-200 rounded-2xl px-5 py-3.5 text-slate-800 font-bold focus:bg-white focus:border-[#004C6C] focus:ring-4 focus:ring-blue-900/5 transition-all outline-none text-sm placeholder:text-slate-300"
                  required
                />
              </div>
            </div>

            {/* Fila 3: Tipo de Contrato y Estado */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-wider flex items-center gap-2">
                    <FileText size={14} className="text-[#004C6C]" />
                    Tipo de Contrato / Especialidad *
                  </label>
                  {onOpenCreateTypeModal && (
                    <button
                      type="button"
                      onClick={onOpenCreateTypeModal}
                      className="text-[10px] font-black text-[#004C6C] hover:text-[#EE9D4C] flex items-center gap-1 uppercase tracking-wider bg-blue-50 hover:bg-blue-100 px-2 py-0.5 rounded-lg border border-blue-100 transition-all cursor-pointer"
                      title="Gestionar o agregar tipos de contrato"
                    >
                      <Plus size={12} /> Nuevo Tipo
                    </button>
                  )}
                </div>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full bg-slate-50/70 border border-slate-200 rounded-2xl px-5 py-3.5 text-slate-800 font-bold focus:bg-white focus:border-[#004C6C] focus:ring-4 focus:ring-blue-900/5 transition-all outline-none text-sm cursor-pointer"
                  required
                >
                  <option value="">Seleccionar Tipo de Contrato</option>
                  {contractTypes.map((t) => (
                    <option key={t.id} value={t.name}>
                      {t.name}
                    </option>
                  ))}
                  {!contractTypes.some(t => t.name === formData.type) && formData.type && (
                    <option value={formData.type}>{formData.type}</option>
                  )}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black text-slate-500 uppercase tracking-wider flex items-center gap-2">
                  <ShieldCheck size={14} className="text-[#004C6C]" />
                  Estado del Contrato
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                  className="w-full bg-slate-50/70 border border-slate-200 rounded-2xl px-5 py-3.5 text-slate-800 font-bold focus:bg-white focus:border-[#004C6C] focus:ring-4 focus:ring-blue-900/5 transition-all outline-none text-sm cursor-pointer"
                >
                  <option value="Vigente">Vigente</option>
                  <option value="Por Vencer">Por Vencer (Alerta)</option>
                  <option value="En Trámite">En Trámite</option>
                </select>
              </div>
            </div>

            {/* Fila 4: Objeto del Contrato */}
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-500 uppercase tracking-wider flex items-center gap-2">
                <FileText size={14} className="text-[#004C6C]" />
                Objeto del Contrato
              </label>
              <textarea
                rows={2}
                placeholder="Descripción del alcance u objeto del contrato..."
                value={formData.object}
                onChange={(e) => setFormData({ ...formData, object: e.target.value })}
                className="w-full bg-slate-50/70 border border-slate-200 rounded-2xl p-4 text-slate-800 font-bold focus:bg-white focus:border-[#004C6C] focus:ring-4 focus:ring-blue-900/5 transition-all outline-none text-sm placeholder:text-slate-300 resize-none"
              />
            </div>

            {/* Fila 5: Valor del Contrato y Google Drive Link con Formateo Pesos Colombianos */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-500 uppercase tracking-wider flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <DollarSign size={14} className="text-[#004C6C]" />
                    Valor del Contrato (COP)
                  </span>
                  {(formData.amount ?? 0) > 0 && (
                    <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-100">
                      $ {amountDisplay} COP
                    </span>
                  )}
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-5 text-slate-400 font-black text-sm">$</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="0"
                    value={amountDisplay}
                    onChange={handleAmountChange}
                    className="w-full bg-slate-50/70 border border-slate-200 rounded-2xl pl-10 pr-5 py-3.5 text-slate-800 font-bold focus:bg-white focus:border-[#004C6C] focus:ring-4 focus:ring-blue-900/5 transition-all outline-none text-sm placeholder:text-slate-300"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black text-slate-500 uppercase tracking-wider flex items-center gap-2">
                  <Link2 size={14} className="text-[#004C6C]" />
                  Enlace Carpeta Google Drive
                </label>
                <input
                  type="url"
                  placeholder="https://drive.google.com/drive/folders/..."
                  value={formData.drive_link}
                  onChange={(e) => setFormData({ ...formData, drive_link: e.target.value })}
                  className="w-full bg-slate-50/70 border border-slate-200 rounded-2xl px-5 py-3.5 text-slate-800 font-bold focus:bg-white focus:border-[#004C6C] focus:ring-4 focus:ring-blue-900/5 transition-all outline-none text-sm placeholder:text-slate-300"
                />
              </div>
            </div>

            {/* Sección de Póliza de Garantía */}
            <div className="p-6 bg-blue-50/50 border border-blue-100 rounded-3xl space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-[#004C6C] text-white rounded-xl">
                    <ShieldCheck size={18} />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-[#004C6C]">Información de la Póliza</h4>
                    <p className="text-[11px] text-slate-400 font-bold">Pólizas de cumplimiento y garantías asociadas</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setHasPolicy(!hasPolicy)}
                  className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    hasPolicy ? 'bg-[#004C6C]' : 'bg-slate-300'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      hasPolicy ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {hasPolicy && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-blue-100">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-500 uppercase">N° de Póliza</label>
                    <input
                      type="text"
                      placeholder="Ej. Seguros del Estado 994821"
                      value={formData.policy?.policy_number || ''}
                      onChange={(e) => setFormData({
                        ...formData,
                        policy: { ...(formData.policy || { insurance_company: '', insured_value: 0, end_date: '' }), policy_number: e.target.value }
                      })}
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 font-bold focus:border-[#004C6C] outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-500 uppercase">Aseguradora</label>
                    <input
                      type="text"
                      placeholder="Ej. Suramericana, Seguros Mundial"
                      value={formData.policy?.insurance_company || ''}
                      onChange={(e) => setFormData({
                        ...formData,
                        policy: { ...(formData.policy || { policy_number: '', insured_value: 0, end_date: '' }), insurance_company: e.target.value }
                      })}
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 font-bold focus:border-[#004C6C] outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-500 uppercase flex items-center justify-between">
                      <span>Valor Asegurado (COP)</span>
                      {formData.policy?.insured_value ? (
                        <span className="text-[9px] font-black text-emerald-600">
                          $ {policyAmountDisplay} COP
                        </span>
                      ) : null}
                    </label>
                    <div className="relative flex items-center">
                      <span className="absolute left-3.5 text-slate-400 font-bold text-xs">$</span>
                      <input
                        type="text"
                        inputMode="numeric"
                        placeholder="0"
                        value={policyAmountDisplay}
                        onChange={handlePolicyAmountChange}
                        className="w-full bg-white border border-slate-200 rounded-xl pl-8 pr-4 py-2.5 text-xs text-slate-800 font-bold focus:border-[#004C6C] outline-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-500 uppercase flex items-center gap-1">
                      <Calendar size={12} /> Fecha de Vencimiento
                    </label>
                    <input
                      type="text"
                      placeholder="Ej. 30/Nov/2026 o 2026-11-30"
                      value={formData.policy?.end_date || ''}
                      onChange={(e) => setFormData({
                        ...formData,
                        policy: { ...(formData.policy || { policy_number: '', insurance_company: '', insured_value: 0 }), end_date: e.target.value }
                      })}
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 font-bold focus:border-[#004C6C] outline-none"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Footer Actions */}
            <div className="flex items-center justify-end gap-4 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-3.5 text-slate-500 font-bold text-xs uppercase tracking-widest hover:bg-slate-100 rounded-2xl transition-all"
                disabled={isSubmitting}
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center gap-2 px-8 py-3.5 bg-[#004C6C] text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-[#003a53] shadow-lg shadow-blue-900/10 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Guardando...
                  </>
                ) : (
                  'Guardar Contrato'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Portal>
  );
};
