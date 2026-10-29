import React, { useState } from 'react';
import { Pencil, Loader2, AlertCircle, Save } from 'lucide-react';
import { formatMoneyInput } from '../../../utils/money';
import { facturacionService, getApiErrorMessage } from '../services/facturacionService';
import { FacturaFields } from './FacturaFields';
import { draftError, draftToPayload, type FacturaDraft } from '../utils/draft';
import { ModalShell } from '../../../components/ui/ModalShell';
import type { Factura, FacturacionCatalogs } from '../types';

interface FacturaEditModalProps {
  factura: Factura | null;
  catalogs: FacturacionCatalogs;
  onClose: () => void;
  onSaved: (factura: Factura) => void;
}

const toDraft = (f: Factura): FacturaDraft => ({
  documentType: f.document_type,
  invoiceNumber: f.invoice_number,
  contractorId: f.contractor?.id ?? null,
  supplierName: f.supplier_name,
  relatedDocument: f.related_document ?? '',
  amount: f.amount ? formatMoneyInput(String(f.amount)) : '',
  observation: f.observation ?? '',
});

/**
 * Contabilidad corrige los datos de una factura mientras obra no la ha procesado (el archivo no cambia).
 */
export const FacturaEditModal: React.FC<FacturaEditModalProps> = ({ factura, ...props }) => (
  factura ? <EditContent key={factura.id} factura={factura} {...props} /> : null
);

const EditContent: React.FC<FacturaEditModalProps & { factura: Factura }> = ({ factura, catalogs, onClose, onSaved }) => {
  const [draft, setDraft] = useState<FacturaDraft>(() => toDraft(factura));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    const invalid = draftError(draft);
    if (invalid) return setError(invalid);
    setSaving(true);
    setError(null);
    try {
      onSaved(await facturacionService.updateFactura(factura.id, draftToPayload(draft, factura.period)));
    } catch (err) {
      setError(getApiErrorMessage(err, 'Error al guardar la factura.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalShell
      isOpen
      onClose={() => !saving && onClose()}
      icon={<Pencil size={22} />}
      title={`Editar ${factura.document_number}`}
      subtitle={factura.file_name}
      footer={
        <button type="button" onClick={handleSave} disabled={saving}
          className="w-full px-6 py-3.5 bg-[#004C6C] hover:bg-[#003a53] text-white rounded-2xl font-bold flex items-center justify-center gap-2 disabled:opacity-60">
          {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />} Guardar cambios
        </button>
      }
    >
      {error && (
        <div className="p-3 bg-red-50 border border-red-100 rounded-2xl text-xs font-bold text-red-600 flex items-center gap-2">
          <AlertCircle size={16} className="shrink-0" /> {error}
        </div>
      )}
      <p className="text-xs font-bold text-slate-400">
        Mes: {factura.period_label}. Si la factura quedó en un mes equivocado, elimínala y vuelve a cargarla en el correcto.
      </p>
      <FacturaFields catalogs={catalogs} draft={draft} disabled={saving} onChange={(patch) => setDraft((d) => ({ ...d, ...patch }))} />
    </ModalShell>
  );
};
