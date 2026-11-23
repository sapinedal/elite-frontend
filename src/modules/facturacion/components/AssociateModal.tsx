import React, { useEffect, useMemo, useState } from 'react';
import { Link2, Loader2, AlertCircle, Scissors, ShoppingCart, CheckCircle2 } from 'lucide-react';
import { formatMoney } from '../../../utils/money';
import { formatDate } from '../../../utils/dateUtils';
import { facturacionService, getApiErrorMessage } from '../services/facturacionService';
import { ModalShell, inputClass, labelClass } from '../../../components/ui/ModalShell';
import type { Factura, FacturacionCatalogs, FacturaTargets } from '../types';

interface AssociateModalProps {
  factura: Factura | null;
  catalogs: FacturacionCatalogs;
  onClose: () => void;
  onAssociated: (factura: Factura) => void;
}

type TargetType = 'corte' | 'orden';

/**
 * El residente asocia la factura a su corte (con las tres aprobaciones) o a su orden pendiente de factura, con los
 * mismos datos en ambos casos: solo una observación opcional (el valor lo indica Contabilidad al aprobar). El proveedor
 * sale de la factura del mes (no se pide) y los soportes los carga después quien sigue en el flujo.
 * Reemplaza el cambio de nombre que hacían en Drive para indicar que la factura quedó procesada por obra.
 */
export const AssociateModal: React.FC<AssociateModalProps> = ({ factura, ...props }) => (
  // Se monta por cada factura (`key`) para arrancar sin la selección anterior
  factura ? <AssociateContent key={factura.id} factura={factura} {...props} /> : null
);

const AssociateContent: React.FC<AssociateModalProps & { factura: Factura }> = ({ factura, onClose, onAssociated }) => {
  const [targets, setTargets] = useState<FacturaTargets | null>(null);
  const [targetType, setTargetType] = useState<TargetType>('corte');
  const [targetId, setTargetId] = useState<number | null>(null);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    facturacionService.getTargets(factura.id)
      .then((data) => {
        setTargets(data);
        // Sin cortes pero con órdenes, arranca en órdenes
        if (!data.cortes.length && data.ordenes.length) setTargetType('orden');
      })
      .catch((err) => setError(getApiErrorMessage(err, 'Error al cargar tus cortes y órdenes.')));
  }, [factura.id]);

  // Primero los cortes del mismo proveedor de la factura
  const cortes = useMemo(() => {
    const list = targets?.cortes ?? [];
    const contractor = factura.contractor?.id;
    return [...list].sort((a, b) => Number(b.contractor_id === contractor) - Number(a.contractor_id === contractor));
  }, [targets, factura.contractor]);
  const ordenes = targets?.ordenes ?? [];
  const isOrdenCompatible = factura.document_type === 'factura' || factura.document_type === 'cuenta_cobro';

  const handleSubmit = async () => {
    if (!targetId) return setError(targetType === 'corte' ? 'Elige el corte de la factura.' : 'Elige la orden de la factura.');

    setSubmitting(true);
    setError(null);
    try {
      const updated = await facturacionService.associate(factura.id, {
        target_type: targetType,
        target_id: targetId,
        amount: null, // El valor lo indica Contabilidad al aprobar, después de Multifox
        contractor_id: null,
        comment: comment.trim() || null,
        support_tokens: [],
      });
      onAssociated(updated);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Error al asociar la factura.'));
    } finally {
      setSubmitting(false);
    }
  };

  const typeButton = (type: TargetType, label: string, icon: React.ReactNode, count: number, disabled = false) => (
    <button type="button" disabled={submitting || disabled} onClick={() => { setTargetType(type); setTargetId(null); }}
      className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-2xl border text-sm font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed ${targetType === type ? 'bg-[#004C6C] border-[#004C6C] text-white shadow-md' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
      {icon} {label} <span className={`text-[11px] px-1.5 rounded-md ${targetType === type ? 'bg-white/20' : 'bg-slate-100'}`}>{count}</span>
    </button>
  );

  const option = (id: number, selected: boolean, title: React.ReactNode, detail: React.ReactNode, badge?: React.ReactNode) => (
    <li key={id}>
      <button type="button" disabled={submitting} onClick={() => setTargetId(id)}
        className={`w-full text-left rounded-2xl border p-3.5 flex items-start gap-3 transition-all ${selected ? 'border-[#004C6C] bg-blue-50/50 ring-2 ring-blue-100' : 'border-slate-100 bg-white hover:border-slate-300'}`}>
        <span className={`mt-0.5 h-4 w-4 rounded-full border-2 shrink-0 ${selected ? 'border-[#004C6C] bg-[#004C6C] shadow-[inset_0_0_0_2px_white]' : 'border-slate-300'}`} />
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-2">{title}{badge}</span>
          <span className="block text-[11px] font-bold text-slate-400 mt-0.5">{detail}</span>
        </span>
      </button>
    </li>
  );

  return (
    <ModalShell
      isOpen
      onClose={() => !submitting && onClose()}
      icon={<Link2 size={24} />}
      title={`Asociar ${factura.document_number}`}
      subtitle={`${factura.supplier_name}${factura.amount !== null ? ` · ${formatMoney(factura.amount)}` : ''} · ${factura.period_label}`}
      footer={
        <button type="button" onClick={handleSubmit} disabled={submitting || !targets}
          className="w-full px-6 py-3.5 bg-[#004C6C] hover:bg-[#003a53] text-white rounded-2xl font-bold flex items-center justify-center gap-2 disabled:opacity-60">
          {submitting ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle2 size={18} />}
          {submitting ? 'Asociando...' : 'Asociar y Marcar'}
        </button>
      }
    >
      <div className="space-y-5">
        {error && (
          <div className="p-3 bg-red-50 border border-red-100 rounded-2xl text-xs font-bold text-red-600 flex items-center gap-2">
            <AlertCircle size={16} className="shrink-0" /> <span className="whitespace-pre-line">{error}</span>
          </div>
        )}

        <div className="space-y-2">
          <label className={labelClass}>¿A qué corresponde? *</label>
          <div className="flex flex-col sm:flex-row gap-2">
            {typeButton('corte', 'Mis cortes aprobados', <Scissors size={16} />, cortes.length)}
            {typeButton('orden', 'Mis órdenes de compra', <ShoppingCart size={16} />, ordenes.length, !isOrdenCompatible)}
          </div>
        </div>

        {!targets ? (
          <div className="flex justify-center py-6"><Loader2 className="animate-spin text-slate-300" /></div>
        ) : targetType === 'corte' ? (
          cortes.length ? (
            <ul className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {cortes.map((c) => option(
                c.id,
                targetId === c.id,
                <><span className="font-black text-[#004C6C]">{c.label}</span><span className="text-xs font-bold text-slate-500">{c.contractor ?? 'Sin proveedor'}</span></>,
                [c.project, c.tower, c.contract_code && `Contrato ${c.contract_code}`, c.approved_at && `Aprobado ${formatDate(c.approved_at)}`,
                  c.invoices_count ? `${c.invoices_count} factura(s) asociada(s)` : 'Pendiente de factura'].filter(Boolean).join(' · '),
                factura.contractor && c.contractor_id === factura.contractor.id
                  ? <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-green-50 text-green-700">Mismo proveedor</span>
                  : undefined,
              ))}
            </ul>
          ) : (
            <p className="text-sm font-bold text-slate-400 bg-white rounded-2xl p-4 border border-slate-100">
              {factura.document_type === 'nota_credito' || factura.document_type === 'factura_reemplazo'
                ? 'No tienes cortes con factura asociada que este documento pueda afectar.'
                : 'No tienes cortes con las tres aprobaciones pendientes de factura. La factura se asocia cuando el corte quede aprobado.'}
            </p>
          )
        ) : ordenes.length ? (
          <ul className="space-y-2 max-h-72 overflow-y-auto pr-1">
            {ordenes.map((o) => option(
              o.id,
              targetId === o.id,
              <><span className="font-black text-[#004C6C]">Orden {o.code}</span><span className="text-xs font-bold text-slate-500 truncate">{o.description}</span></>,
              [o.project, o.tower, o.approved_at && `Aprobada ${formatDate(o.approved_at)}`].filter(Boolean).join(' · '),
            ))}
          </ul>
        ) : (
          <p className="text-sm font-bold text-slate-400 bg-white rounded-2xl p-4 border border-slate-100">
            No tienes órdenes de compra esperando la factura del proveedor.
          </p>
        )}

        <div className="space-y-1.5">
          <label className={labelClass}>Observación</label>
          <textarea rows={2} disabled={submitting} className={`${inputClass} resize-none`}
            placeholder="Ej: corte 6634 de Multifox, liquidación parcial..."
            value={comment} onChange={(e) => setComment(e.target.value)} />
        </div>

        {targetType === 'corte' && (
          <p className="text-[11px] font-bold text-slate-400">
            Al asociarla, la factura se copia a la carpeta del corte (05 CORTES), el corte pasa a Facturado y se avisa para el registro en Multifox. Con la aprobación de Contabilidad pasa a cuentas por pagar.
          </p>
        )}
        {targetType === 'orden' && (
          <p className="text-[11px] font-bold text-slate-400">Al asociarla, la factura se copia a la carpeta de la orden y la orden pasa a la entrada de almacén. Con la aprobación de Contabilidad pasa a cuentas por pagar.</p>
        )}
      </div>
    </ModalShell>
  );
};
