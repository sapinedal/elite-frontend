import React, { useState } from 'react';
import { FilePlus2, Loader2, Send } from 'lucide-react';
import { CustomSelect } from '../../../components/ui/CustomSelect';
import { formatMoneyInput, parseMoney } from '../../../utils/money';
import { PagoModalShell, inputClass, labelClass } from './PagoModalShell';
import type { PagoCatalogs, PagoCuenta, PagoCuentaPayload } from '../types';

interface PagoFormModalProps {
  isOpen: boolean;
  catalogs: PagoCatalogs | null;
  onClose: () => void;
  onSave: (payload: PagoCuentaPayload) => Promise<PagoCuenta>;
}

/**
 * Cargue manual de Contabilidad para lo que no viene de cortes ni órdenes (nómina, aportes, fiduciaria,
 * cuentas de cobro, legalizaciones...). El proveedor se elige de la lista o se escribe.
 */
export const PagoFormModal: React.FC<PagoFormModalProps> = ({ isOpen, ...props }) => (
  isOpen ? <PagoFormContent {...props} /> : null
);

const PagoFormContent: React.FC<Omit<PagoFormModalProps, 'isOpen'>> = ({ catalogs, onClose, onSave }) => {
  const [projectId, setProjectId] = useState<number | null>(catalogs?.projects.length === 1 ? catalogs.projects[0].id : null);
  const [frente, setFrente] = useState('');
  const [contractorId, setContractorId] = useState<number | null>(null);
  const [supplierName, setSupplierName] = useState('');
  const [supplierNit, setSupplierNit] = useState('');
  const [documentNumber, setDocumentNumber] = useState('');
  const [concept, setConcept] = useState('');
  const [amount, setAmount] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const value = parseMoney(amount);
    if (!frente || !documentNumber.trim() || !value || (!contractorId && !supplierName.trim())) {
      return setError('Completa el frente, el proveedor, el número del documento y el valor.');
    }
    setSaving(true);
    setError(null);
    try {
      await onSave({
        project_id: projectId,
        frente,
        contractor_id: contractorId,
        supplier_nit: contractorId ? null : supplierNit.trim() || null,
        supplier_name: contractorId ? null : supplierName.trim(),
        document_number: documentNumber.trim(),
        concept: concept.trim() || null,
        amount: value,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al registrar la cuenta.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <PagoModalShell isOpen onClose={onClose} icon={<FilePlus2 size={24} />} title="Registrar cuenta por pagar"
      subtitle="Nómina, aportes, fiduciaria, cuentas de cobro..." error={error}>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <CustomSelect pyClass="py-3.5" label="Proyecto" placeholder="Sin proyecto" clearable onClear={() => setProjectId(null)}
            searchable={false} disabled={saving}
            options={(catalogs?.projects ?? []).map((p) => ({ value: p.id, label: p.name }))}
            value={projectId} onChange={(v) => setProjectId(Number(v))} />
          <CustomSelect pyClass="py-3.5" label="Frente *" placeholder="Sección del cuadro" disabled={saving}
            options={(catalogs?.frentes ?? []).map((f) => ({ value: f, label: f }))}
            value={frente} onChange={(v) => setFrente(String(v))} />
        </div>

        <CustomSelect pyClass="py-3.5" label="Proveedor" placeholder="Selecciona de la lista o escríbelo abajo" clearable
          onClear={() => setContractorId(null)} disabled={saving}
          options={(catalogs?.contractors ?? []).map((c) => ({ value: c.id, label: c.name, sublabel: c.nit ? `NIT ${c.nit}` : undefined }))}
          value={contractorId} onChange={(v) => setContractorId(Number(v))} />

        {!contractorId && (
          <div className="grid grid-cols-1 md:grid-cols-[1fr_2fr] gap-4">
            <div className="space-y-2">
              <label className={labelClass}>NIT / ID</label>
              <input disabled={saving} className={inputClass} placeholder="900147238" value={supplierNit} onChange={(e) => setSupplierNit(e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className={labelClass}>Nombre *</label>
              <input disabled={saving} className={inputClass} placeholder="Ej: APORTES EN LINEA SA" value={supplierName} onChange={(e) => setSupplierName(e.target.value)} />
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className={labelClass}>N.º de documento *</label>
            <input disabled={saving} className={inputClass} placeholder="Ej: FE 1602, C-C 49, Nóm#111" value={documentNumber} onChange={(e) => setDocumentNumber(e.target.value)} />
          </div>
          <div className="space-y-2">
            <label className={labelClass}>Valor *</label>
            <div className="relative">
              <span className="absolute left-5 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">$</span>
              <input disabled={saving} inputMode="numeric" className={`${inputClass} pl-9`} placeholder="0" value={amount} onChange={(e) => setAmount(formatMoneyInput(e.target.value))} />
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <label className={labelClass}>Concepto / notas</label>
          <textarea rows={2} disabled={saving} className={`${inputClass} resize-none`} placeholder="Opcional" value={concept} onChange={(e) => setConcept(e.target.value)} />
        </div>

        <button type="submit" disabled={saving}
          className="w-full px-6 py-4 bg-[#004C6C] hover:bg-[#003a53] text-white rounded-2xl font-bold shadow-xl flex items-center justify-center gap-2 disabled:opacity-60">
          {saving ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />} Registrar cuenta
        </button>
      </form>
    </PagoModalShell>
  );
};
