import React, { useEffect, useMemo, useState } from 'react';
import { Link2, Loader2, AlertCircle, Scissors, ShoppingCart, CheckCircle2, HandCoins } from 'lucide-react';
import { formatMoney, formatMoneyInput, parseMoney } from '../../../utils/money';
import { CustomSelect } from '../../../components/ui/CustomSelect';
import { fitsOrden, isAnticipo } from '../utils/draft';
import { formatDate } from '../../../utils/dateUtils';
import { facturacionService, getApiErrorMessage } from '../services/facturacionService';
import { ModalShell, inputClass, labelClass } from '../../../components/ui/ModalShell';
import type { Factura, FacturacionCatalogs, FacturaTargets, FacturaTargetType } from '../types';

interface AssociateModalProps {
  factura: Factura | null;
  catalogs: FacturacionCatalogs;
  onClose: () => void;
  onAssociated: (factura: Factura) => void;
}

// El indirecto no se asocia: pasa directo a cuentas por pagar al cargarlo
type TargetType = Exclude<FacturaTargetType, 'pagos'>;

/**
 * El residente asocia la factura a su corte (con las tres aprobaciones) o a su orden pendiente de factura, con los
 * mismos datos en ambos casos: solo una observación opcional (el valor lo indica Contabilidad al aprobar). El proveedor
 * sale de la factura del mes (no se pide) y los soportes los carga después quien sigue en el flujo.
 * Reemplaza el cambio de nombre que hacían en Drive para indicar que la factura quedó procesada por obra.
 *
 * La cotización no va a cortes ni órdenes: se radica como anticipo de un contrato (pide el valor y el proveedor si
 * Contabilidad no los registró, porque el anticipo los necesita para su aprobación).
 */
export const AssociateModal: React.FC<AssociateModalProps> = ({ factura, ...props }) => (
  // Se monta por cada factura (`key`) para arrancar sin la selección anterior
  factura ? <AssociateContent key={factura.id} factura={factura} {...props} /> : null
);

const AssociateContent: React.FC<AssociateModalProps & { factura: Factura }> = ({ factura, catalogs, onClose, onAssociated }) => {
  const asAnticipo = isAnticipo(factura.document_type);
  const [targets, setTargets] = useState<FacturaTargets | null>(null);
  const [targetType, setTargetType] = useState<TargetType>(asAnticipo ? 'anticipo' : 'corte');
  const [amount, setAmount] = useState('');
  const [contractorId, setContractorId] = useState<number | null>(null);
  const [targetId, setTargetId] = useState<number | null>(null);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    facturacionService.getTargets(factura.id)
      .then((data) => {
        setTargets(data);
        // Sin cortes pero con órdenes, arranca en órdenes
        if (!asAnticipo && !data.cortes.length && data.ordenes.length) setTargetType('orden');
      })
      .catch((err) => setError(getApiErrorMessage(err, asAnticipo ? 'Error al cargar los contratos.' : 'Error al cargar tus cortes y órdenes.')));
  }, [factura.id, asAnticipo]);

  // Primero los cortes del mismo proveedor de la factura
  const cortes = useMemo(() => {
    const list = targets?.cortes ?? [];
    const contractor = factura.contractor?.id;
    return [...list].sort((a, b) => Number(b.contractor_id === contractor) - Number(a.contractor_id === contractor));
  }, [targets, factura.contractor]);
  const ordenes = targets?.ordenes ?? [];
  const contratos = targets?.contratos ?? [];
  const isOrdenCompatible = fitsOrden(factura.document_type);
  // El anticipo necesita valor y proveedor: se piden solo si Contabilidad no los registró
  const needsAmount = asAnticipo && factura.amount === null;
  const needsContractor = asAnticipo && !factura.contractor;

  const handleSubmit = async () => {
    if (!targetId) {
      return setError({ corte: 'Elige el corte de la factura.', orden: 'Elige la orden de la factura.', anticipo: 'Elige el contrato del anticipo.' }[targetType]);
    }
    if (needsContractor && !contractorId) return setError('Indica el proveedor de la cotización.');
    if (needsAmount && !parseMoney(amount)) return setError('Indica el valor del anticipo.');

    setSubmitting(true);
    setError(null);
    try {
      const updated = await facturacionService.associate(factura.id, {
        target_type: targetType,
        target_id: targetId,
        // En cortes y órdenes el valor lo indica Contabilidad al aprobar, después de Multifox
        amount: needsAmount ? parseMoney(amount) : null,
        contractor_id: needsContractor ? contractorId : null,
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
      title={asAnticipo ? `Radicar ${factura.document_number} como anticipo` : `Asociar ${factura.document_number}`}
      subtitle={`${factura.supplier_name}${factura.amount !== null ? ` · ${formatMoney(factura.amount)}` : ''} · ${factura.period_label}`}
      footer={
        <button type="button" onClick={handleSubmit} disabled={submitting || !targets}
          className="w-full px-6 py-3.5 bg-[#004C6C] hover:bg-[#003a53] text-white rounded-2xl font-bold flex items-center justify-center gap-2 disabled:opacity-60">
          {submitting ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle2 size={18} />}
          {submitting ? (asAnticipo ? 'Radicando...' : 'Asociando...') : (asAnticipo ? 'Radicar anticipo' : 'Asociar y Marcar')}
        </button>
      }
    >
      <div className="space-y-5">
        {error && (
          <div className="p-3 bg-red-50 border border-red-100 rounded-2xl text-xs font-bold text-red-600 flex items-center gap-2">
            <AlertCircle size={16} className="shrink-0" /> <span className="whitespace-pre-line">{error}</span>
          </div>
        )}

        {asAnticipo ? (
          <div className="flex items-center gap-2 text-sm font-bold text-[#004C6C] bg-blue-50/60 border border-blue-100 rounded-2xl p-3">
            <HandCoins size={18} className="shrink-0" /> La cotización entra como anticipo: elige el contrato al que corresponde.
          </div>
        ) : (
          <div className="space-y-2">
            <label className={labelClass}>¿A qué corresponde? *</label>
            <div className="flex flex-col sm:flex-row gap-2">
              {typeButton('corte', 'Mis cortes aprobados', <Scissors size={16} />, cortes.length)}
              {typeButton('orden', 'Mis órdenes de compra', <ShoppingCart size={16} />, ordenes.length, !isOrdenCompatible)}
            </div>
          </div>
        )}

        {!targets ? (
          <div className="flex justify-center py-6"><Loader2 className="animate-spin text-slate-300" /></div>
        ) : targetType === 'anticipo' ? (
          contratos.length ? (
            <ul className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {contratos.map((c) => option(
                c.id,
                targetId === c.id,
                <><span className="font-black text-[#004C6C]">Contrato {c.contract_code}</span><span className="text-xs font-bold text-slate-500 truncate">{c.contractor_name ?? c.object}</span></>,
                [c.project, c.tower, c.object].filter(Boolean).join(' · '),
                factura.contractor && c.contractor_id === factura.contractor.id
                  ? <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-green-50 text-green-700">Mismo proveedor</span>
                  : undefined,
              ))}
            </ul>
          ) : (
            <p className="text-sm font-bold text-slate-400 bg-white rounded-2xl p-4 border border-slate-100">
              No hay contratos de tus proyectos para este proveedor, o no tienes permiso para radicar anticipos.
            </p>
          )
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

        {(needsContractor || needsAmount) && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {needsContractor && (
              <div className="space-y-1.5 min-w-0">
                <label className={labelClass}>Proveedor *</label>
                <CustomSelect
                  pyClass="py-3"
                  placeholder={`Sin coincidencia: ${factura.supplier_name}`}
                  disabled={submitting}
                  options={catalogs.contractors.map((c) => ({ value: c.id, label: c.name, sublabel: c.nit ? `NIT ${c.nit}` : undefined }))}
                  value={contractorId}
                  onChange={(v) => setContractorId(Number(v))}
                />
              </div>
            )}
            {needsAmount && (
              <div className="space-y-1.5">
                <label className={labelClass}>Valor del anticipo *</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">$</span>
                  <input disabled={submitting} inputMode="numeric" className={`${inputClass} pl-8`} placeholder="0"
                    value={amount} onChange={(e) => setAmount(formatMoneyInput(e.target.value))} />
                </div>
              </div>
            )}
          </div>
        )}

        <div className="space-y-1.5">
          <label className={labelClass}>Observación</label>
          <textarea rows={2} disabled={submitting} className={`${inputClass} resize-none`}
            placeholder={asAnticipo ? 'Ej: anticipo 30% del contrato...' : 'Ej: corte 6634 de Multifox, liquidación parcial...'}
            value={comment} onChange={(e) => setComment(e.target.value)} />
        </div>

        {targetType === 'corte' && (
          <p className="text-[11px] font-bold text-slate-400">
            Al asociarla, la factura se copia a la carpeta del corte (05 CORTES), el corte pasa a Facturado y se avisa para el registro en Multifox. Con la aprobación de Contabilidad pasa a cuentas por pagar.
          </p>
        )}
        {targetType === 'anticipo' && (
          <p className="text-[11px] font-bold text-slate-400">Al radicarla, la cotización se copia a la carpeta del anticipo (08 ANTICIPOS) del contrato y queda pendiente del Director de Obra, luego Gerencia y Contabilidad.</p>
        )}
        {targetType === 'orden' && (
          <p className="text-[11px] font-bold text-slate-400">Al asociarla, la factura se copia a la carpeta de la orden y la orden pasa a la entrada de almacén. Con la aprobación de Contabilidad pasa a cuentas por pagar.</p>
        )}
      </div>
    </ModalShell>
  );
};
