import { parseMoney } from '../../../utils/money';
import type { FacturaDocumentType, FacturaPayload } from '../types';

/** Datos de una factura mientras Contabilidad la diligencia (valor como texto con separador de miles) */
export interface FacturaDraft {
  documentType: FacturaDocumentType;
  invoiceNumber: string;
  contractorId: number | null;
  supplierName: string;
  relatedDocument: string;
  amount: string;
  observation: string;
}

export const affectsAnother = (type: FacturaDocumentType) => type === 'nota_credito' || type === 'factura_reemplazo';

/** La cotización no va a cortes ni órdenes: el residente la radica como anticipo de un contrato */
export const isAnticipo = (type: FacturaDocumentType) => type === 'cotizacion';

/** El indirecto no se asocia a obra: al cargarlo pasa directo a cuentas por pagar (por eso exige el valor) */
export const isIndirecto = (type: FacturaDocumentType) => type === 'indirecto';

/** Documentos del proveedor que se asocian a una orden de compra */
export const fitsOrden = (type: FacturaDocumentType) => type === 'factura' || type === 'cuenta_cobro' || type === 'reembolso';

/** Valida el borrador; devuelve el mensaje de error o null */
export const draftError = (draft: FacturaDraft): string | null => {
  if (!draft.invoiceNumber.trim()) return 'Indica el número del documento.';
  if (!draft.contractorId && !draft.supplierName.trim()) return 'Indica el proveedor.';
  if (affectsAnother(draft.documentType) && !draft.relatedDocument.trim()) return 'Indica la factura que se afecta o reemplaza.';
  if (isIndirecto(draft.documentType) && !parseMoney(draft.amount)) return 'Indica el valor: el indirecto pasa directo a cuentas por pagar.';
  return null;
};

export const draftToPayload = (draft: FacturaDraft, period: string): FacturaPayload => ({
  period,
  document_type: draft.documentType,
  invoice_number: draft.invoiceNumber.trim(),
  contractor_id: draft.contractorId,
  supplier_name: draft.supplierName.trim() || null,
  related_document: affectsAnother(draft.documentType) ? draft.relatedDocument.trim() : null,
  amount: parseMoney(draft.amount),
  observation: draft.observation.trim() || null,
});
