import React from 'react';
import { CustomSelect } from '../../../components/ui/CustomSelect';
import { formatMoneyInput } from '../../../utils/money';
import { affectsAnother, type FacturaDraft } from '../utils/draft';
import { inputClass, labelClass } from './ModalShell';
import type { FacturacionCatalogs, FacturaDocumentType } from '../types';

interface FacturaFieldsProps {
  draft: FacturaDraft;
  onChange: (patch: Partial<FacturaDraft>) => void;
  catalogs: FacturacionCatalogs;
  disabled?: boolean;
  compact?: boolean;
}

/**
 * Campos de la factura que diligencia Contabilidad: tipo, número, proveedor (del catálogo o como viene en el
 * archivo), valor y, en notas crédito y facturas de reemplazo, el documento que afectan.
 */
export const FacturaFields: React.FC<FacturaFieldsProps> = ({ draft, onChange, catalogs, disabled, compact }) => {
  const prefix = catalogs.document_types.find((t) => t.key === draft.documentType)?.prefix;

  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 ${compact ? 'lg:grid-cols-[150px_130px_minmax(0,1fr)_150px]' : ''} gap-3`}>
      <div className="space-y-1.5">
        <label className={labelClass}>Tipo *</label>
        <select disabled={disabled} className={inputClass} value={draft.documentType}
          onChange={(e) => onChange({ documentType: e.target.value as FacturaDocumentType })}>
          {catalogs.document_types.map((t) => <option key={t.key} value={t.key}>{t.label}</option>)}
        </select>
      </div>
      <div className="space-y-1.5">
        <label className={labelClass}>Número *</label>
        <div className="relative">
          {prefix && <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-black text-slate-400">{prefix}</span>}
          <input disabled={disabled} className={`${inputClass} ${prefix ? 'pl-12' : ''}`} placeholder="335"
            value={draft.invoiceNumber} onChange={(e) => onChange({ invoiceNumber: e.target.value })} />
        </div>
      </div>
      <div className="space-y-1.5 min-w-0">
        <label className={labelClass}>Proveedor *</label>
        <CustomSelect
          pyClass="py-3"
          placeholder={draft.supplierName ? `Sin coincidencia: ${draft.supplierName}` : 'Buscar proveedor'}
          disabled={disabled}
          clearable
          onClear={() => onChange({ contractorId: null })}
          options={catalogs.contractors.map((c) => ({ value: c.id, label: c.name, sublabel: c.nit ? `NIT ${c.nit}` : undefined }))}
          value={draft.contractorId}
          onChange={(v) => onChange({ contractorId: Number(v) })}
        />
      </div>
      <div className="space-y-1.5">
        <label className={labelClass}>Valor</label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">$</span>
          <input disabled={disabled} inputMode="numeric" className={`${inputClass} pl-8`} placeholder="Opcional"
            value={draft.amount} onChange={(e) => onChange({ amount: formatMoneyInput(e.target.value) })} />
        </div>
      </div>
      {affectsAnother(draft.documentType) && (
        <div className={`space-y-1.5 ${compact ? 'lg:col-span-2' : ''}`}>
          <label className={labelClass}>{draft.documentType === 'nota_credito' ? 'Factura que afecta *' : 'Factura que reemplaza *'}</label>
          <input disabled={disabled} className={inputClass} placeholder="Ej: FE 335"
            value={draft.relatedDocument} onChange={(e) => onChange({ relatedDocument: e.target.value })} />
        </div>
      )}
      {!compact && (
        <div className="space-y-1.5 sm:col-span-2">
          <label className={labelClass}>Observación</label>
          <textarea rows={2} disabled={disabled} className={`${inputClass} resize-none`} placeholder="Opcional"
            value={draft.observation} onChange={(e) => onChange({ observation: e.target.value })} />
        </div>
      )}
    </div>
  );
};
