import React, { useEffect, useMemo, useState } from 'react';
import { Link2, Loader2, AlertCircle, Scissors, ShoppingCart, CheckCircle2, HandCoins, Receipt } from 'lucide-react';
import { formatMoney, formatMoneyInput, parseMoney } from '../../../utils/money';
import { CustomSelect } from '../../../components/ui/CustomSelect';
import { isAnticipo } from '../utils/draft';
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
 * Cualquier documento (factura, cuenta de cobro, reembolso, cotización, nota crédito, reemplazo) se asocia a un corte,
 * una orden (entrada), una cuenta de cobro o un anticipo: a un anticipo ya radicado lo legaliza (no crea otra cuenta
 * por pagar) y con un contrato se radica como anticipo nuevo (pide el valor y el proveedor si Contabilidad no los
 * registró, porque el anticipo los necesita para su aprobación).
 */
export const AssociateModal: React.FC<AssociateModalProps> = ({ factura, ...props }) => (
  // Se monta por cada factura (`key`) para arrancar sin la selección anterior
  factura ? <AssociateContent key={factura.id} factura={factura} {...props} /> : null
);

const AssociateContent: React.FC<AssociateModalProps & { factura: Factura }> = ({ factura, catalogs, onClose, onAssociated }) => {
  const isCotizacion = isAnticipo(factura.document_type);
  const [targets, setTargets] = useState<FacturaTargets | null>(null);
  const [targetType, setTargetType] = useState<TargetType>(isCotizacion ? 'anticipo' : 'corte');
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
        // La cotización arranca en anticipo nuevo; lo demás, en el primer tipo que tenga registros
        if (isCotizacion && data.contratos.length) return;
        const first = ([
          ['corte', data.cortes.length], ['orden', data.ordenes.length], ['cuenta_cobro', data.cuentas_cobro?.length ?? 0],
          ['legalizacion_anticipo', data.anticipos?.length ?? 0], ['anticipo', data.contratos.length],
        ] as [TargetType, number][]).find(([, count]) => count > 0);
        if (first) setTargetType(first[0]);
      })
      .catch((err) => setError(getApiErrorMessage(err, 'Error al cargar tus cortes, órdenes, cuentas de cobro y anticipos.')));
  }, [factura.id, isCotizacion]);

  // Primero los cortes del mismo proveedor de la factura
  const cortes = useMemo(() => {
    const list = targets?.cortes ?? [];
    const contractor = factura.contractor?.id;
    return [...list].sort((a, b) => Number(b.contractor_id === contractor) - Number(a.contractor_id === contractor));
  }, [targets, factura.contractor]);
  const ordenes = targets?.ordenes ?? [];
  const contratos = targets?.contratos ?? [];
  const cuentasCobro = targets?.cuentas_cobro ?? [];
  // Primero los anticipos del mismo proveedor (el backend ya los ordena así)
  const anticipos = targets?.anticipos ?? [];
  const asAnticipo = targetType === 'anticipo';
  const asLegalizacion = targetType === 'legalizacion_anticipo';
  // El anticipo nuevo necesita valor y proveedor, y la legalización el valor de la factura: se piden solo si
  // Contabilidad no los registró
  const needsAmount = (asAnticipo || asLegalizacion) && factura.amount === null;
  const amountLabel = asLegalizacion ? 'Valor de la factura' : 'Valor del anticipo';
  const needsContractor = asAnticipo && !factura.contractor;

  const handleSubmit = async () => {
    if (!targetId) {
      return setError({
        corte: 'Elige el corte de la factura.', orden: 'Elige la orden de la factura.', anticipo: 'Elige el contrato del anticipo.',
        cuenta_cobro: 'Elige la cuenta de cobro de la factura.', legalizacion_anticipo: 'Elige el anticipo que legaliza la factura.',
      }[targetType]);
    }
    if (needsContractor && !contractorId) return setError('Indica el proveedor del documento.');
    if (needsAmount && !parseMoney(amount)) return setError(`Indica el ${amountLabel.toLowerCase()}.`);

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
          {submitting ? (asAnticipo ? 'Radicando...' : 'Asociando...') : (asAnticipo ? 'Radicar anticipo' : targetType === 'legalizacion_anticipo' ? 'Legalizar anticipo' : 'Asociar y Marcar')}
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {typeButton('corte', 'Mis cortes', <Scissors size={16} />, cortes.length)}
            {typeButton('orden', 'Mis órdenes / entradas', <ShoppingCart size={16} />, ordenes.length)}
            {typeButton('cuenta_cobro', 'Mis cuentas de cobro', <Receipt size={16} />, cuentasCobro.length)}
            {typeButton('legalizacion_anticipo', 'Mis anticipos', <HandCoins size={16} />, anticipos.length)}
          </div>
          {contratos.length > 0 && (
            <button type="button" disabled={submitting} onClick={() => { setTargetType('anticipo'); setTargetId(null); }}
              className={`w-full text-xs font-black px-4 py-2 rounded-xl transition-all ${asAnticipo ? 'bg-blue-50 text-[#004C6C] ring-2 ring-blue-100' : 'text-[#004C6C] hover:bg-blue-50'}`}>
              {asAnticipo ? 'Radicando como anticipo nuevo de un contrato' : '¿Es un anticipo nuevo? Radícalo con un contrato →'}
            </button>
          )}
        </div>

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
        ) : targetType === 'legalizacion_anticipo' ? (
          anticipos.length ? (
            <ul className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {anticipos.map((a) => option(
                a.id,
                targetId === a.id,
                <><span className="font-black text-[#004C6C]">{a.label}</span><span className="text-xs font-bold text-slate-500 truncate">{a.contractor ?? 'Sin proveedor'}</span></>,
                [a.project, a.tower, a.document_number && `N.º ${a.document_number}`, formatMoney(a.amount), a.status_label].filter(Boolean).join(' · '),
                factura.contractor && a.contractor_id === factura.contractor.id
                  ? <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-green-50 text-green-700">Mismo proveedor</span>
                  : undefined,
              ))}
            </ul>
          ) : (
            <p className="text-sm font-bold text-slate-400 bg-white rounded-2xl p-4 border border-slate-100">
              No tienes anticipos radicados para legalizar.
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
        ) : targetType === 'cuenta_cobro' ? (
          cuentasCobro.length ? (
            <ul className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {cuentasCobro.map((c) => option(
                c.id,
                targetId === c.id,
                <><span className="font-black text-[#004C6C]">{c.label}</span><span className="text-xs font-bold text-slate-500 truncate">{c.contractor ?? 'Sin proveedor'}</span></>,
                [c.project, c.tower, `N.º ${c.document_number}`, formatMoney(c.amount)].filter(Boolean).join(' · '),
                factura.contractor && c.contractor_id === factura.contractor.id
                  ? <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-green-50 text-green-700">Mismo proveedor</span>
                  : undefined,
              ))}
            </ul>
          ) : (
            <p className="text-sm font-bold text-slate-400 bg-white rounded-2xl p-4 border border-slate-100">
              No tienes cuentas de cobro directas esperando la factura (después del cargue ERP).
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
                <label className={labelClass}>{amountLabel} *</label>
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
            placeholder={asAnticipo ? 'Ej: anticipo 30% del contrato...' : targetType === 'legalizacion_anticipo' ? 'Ej: factura que legaliza el anticipo del 30%...' : 'Ej: corte 6634 de Multifox, liquidación parcial...'}
            value={comment} onChange={(e) => setComment(e.target.value)} />
        </div>

        {targetType === 'corte' && (
          <p className="text-[11px] font-bold text-slate-400">
            {factura.document_type === 'nota_credito'
              ? 'La nota crédito se aplica de una vez, sin Multifox ni aprobación: descuenta de la cuenta por pagar de la factura que afecta (sin valor, la anula completa). Si esa factura aún no estaba en cuentas por pagar, queda anulada y ya no se carga en Multifox.'
              : 'Al asociarla, la factura se copia a la carpeta del corte (05 CORTES), el corte pasa a Facturado y se avisa para el registro en Multifox. Con la aprobación de Contabilidad pasa a cuentas por pagar.'}
          </p>
        )}
        {targetType === 'anticipo' && (
          <p className="text-[11px] font-bold text-slate-400">Al radicarlo, el documento se copia a la carpeta del anticipo (08 ANTICIPOS) del contrato y queda pendiente del Director de Obra, luego Gerencia y Contabilidad.</p>
        )}
        {targetType === 'legalizacion_anticipo' && (
          <p className="text-[11px] font-bold text-slate-400">La factura legaliza el anticipo: se copia a su carpeta (Legalizacion) y queda en su historial. No crea otra cuenta por pagar ni cambia el estado del anticipo.</p>
        )}
        {targetType === 'cuenta_cobro' && (
          <p className="text-[11px] font-bold text-slate-400">Al asociarla, la factura se copia a la carpeta de la cuenta de cobro y pasa a la liquidación ERP. Con la aprobación de Contabilidad pasa al cuadro de pagos.</p>
        )}
        {targetType === 'orden' && (
          <p className="text-[11px] font-bold text-slate-400">Al asociarla, la factura se copia a la carpeta de la orden y la orden pasa a la entrada de almacén. Con la aprobación de Contabilidad pasa a cuentas por pagar.</p>
        )}
      </div>
    </ModalShell>
  );
};
