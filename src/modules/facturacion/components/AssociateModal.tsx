import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link2, Loader2, UploadCloud, FileText, Trash2, AlertCircle, Scissors, ShoppingCart, CheckCircle2, Paperclip } from 'lucide-react';
import { CustomSelect } from '../../../components/ui/CustomSelect';
import { formatMoney, formatMoneyInput, parseMoney } from '../../../utils/money';
import { formatDate } from '../../../utils/dateUtils';
import { formatBytes, formatMaxSize } from '../../cortes/utils/format';
import { facturacionService, getApiErrorMessage } from '../services/facturacionService';
import { ModalShell, inputClass, labelClass } from './ModalShell';
import type { Factura, FacturacionCatalogs, FacturaTargets } from '../types';

interface AssociateModalProps {
  factura: Factura | null;
  catalogs: FacturacionCatalogs;
  onClose: () => void;
  onAssociated: (factura: Factura) => void;
}

type TargetType = 'corte' | 'orden';

/**
 * El residente asocia la factura a su corte (con las tres aprobaciones) o a su orden pendiente de factura,
 * y adjunta los soportes: capturas de las aprobaciones y el corte o entrada generado en Multifox.
 * Reemplaza el cambio de nombre que hacían en Drive para indicar que la factura quedó procesada por obra.
 */
export const AssociateModal: React.FC<AssociateModalProps> = ({ factura, ...props }) => (
  // Se monta por cada factura (`key`) para arrancar sin la selección anterior
  factura ? <AssociateContent key={factura.id} factura={factura} {...props} /> : null
);

const AssociateContent: React.FC<AssociateModalProps & { factura: Factura }> = ({ factura, catalogs, onClose, onAssociated }) => {
  const [targets, setTargets] = useState<FacturaTargets | null>(null);
  const [targetType, setTargetType] = useState<TargetType>('corte');
  const [targetId, setTargetId] = useState<number | null>(null);
  const [amount, setAmount] = useState('');
  const [contractorId, setContractorId] = useState<number | null>(null);
  const [comment, setComment] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [progress, setProgress] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    facturacionService.getTargets()
      .then((data) => {
        setTargets(data);
        // Sin cortes pero con órdenes, arranca en órdenes
        if (!data.cortes.length && data.ordenes.length) setTargetType('orden');
      })
      .catch((err) => setError(getApiErrorMessage(err, 'Error al cargar tus cortes y órdenes.')));
  }, []);

  // Primero los cortes del mismo proveedor de la factura
  const cortes = useMemo(() => {
    const list = targets?.cortes ?? [];
    const contractor = factura.contractor?.id;
    return [...list].sort((a, b) => Number(b.contractor_id === contractor) - Number(a.contractor_id === contractor));
  }, [targets, factura.contractor]);
  const ordenes = targets?.ordenes ?? [];
  const isOrdenCompatible = factura.document_type === 'factura' || factura.document_type === 'cuenta_cobro';

  const addFiles = (list: FileList | null) => {
    if (!list?.length) return;
    const valid = Array.from(list).filter((f) => f.size <= catalogs.max_upload_mb * 1024 * 1024);
    setError(valid.length < list.length ? `Se omitieron archivos que superan ${formatMaxSize(catalogs.max_upload_mb)}.` : null);
    setFiles((prev) => [...prev, ...valid.filter((f) => !prev.some((p) => p.name === f.name && p.size === f.size))]);
  };

  // Pegar capturas con Ctrl+V
  const handlePaste = (e: React.ClipboardEvent) => {
    const images = Array.from(e.clipboardData.files);
    if (!images.length) return;
    const dt = new DataTransfer();
    images.forEach((img, i) => dt.items.add(new File([img], img.name === 'image.png' ? `captura-${Date.now()}-${i + 1}.png` : img.name, { type: img.type })));
    addFiles(dt.files);
  };

  const handleSubmit = async () => {
    if (!targetId) return setError(targetType === 'corte' ? 'Elige el corte de la factura.' : 'Elige la orden de la factura.');
    if (factura.amount === null && !parseMoney(amount)) return setError('Indica el valor de la factura.');
    if (targetType === 'orden' && !factura.contractor && !contractorId) return setError('Indica el proveedor de la factura.');
    if (!files.length) return setError('Adjunta los soportes: capturas de las aprobaciones y el corte o entrada de Multifox.');

    setSubmitting(true);
    setError(null);
    try {
      const tokens: string[] = [];
      for (const [i, file] of files.entries()) {
        setProgress(`Subiendo soporte ${i + 1} de ${files.length}...`);
        tokens.push(await facturacionService.uploadFile(file));
      }
      setProgress('Asociando...');
      const updated = await facturacionService.associate(factura.id, {
        target_type: targetType,
        target_id: targetId,
        amount: factura.amount === null ? parseMoney(amount) : null,
        contractor_id: factura.contractor ? null : contractorId,
        comment: comment.trim() || null,
        support_tokens: tokens,
      });
      onAssociated(updated);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Error al asociar la factura.'));
    } finally {
      setSubmitting(false);
      setProgress(null);
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
      subtitle={`${factura.supplier_name} · ${formatMoney(factura.amount)} · ${factura.period_label}`}
      footer={
        <button type="button" onClick={handleSubmit} disabled={submitting || !targets}
          className="w-full px-6 py-3.5 bg-[#004C6C] hover:bg-[#003a53] text-white rounded-2xl font-bold flex items-center justify-center gap-2 disabled:opacity-60">
          {submitting ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle2 size={18} />}
          {progress ?? 'Asociar y marcar como procesada por obra'}
        </button>
      }
    >
      <div onPaste={handlePaste} className="space-y-5">
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
                <><span className="font-black text-[#004C6C]">Corte {c.code}</span><span className="text-xs font-bold text-slate-500">{c.contractor ?? 'Sin proveedor'}</span></>,
                [c.project, c.tower, c.contract_code && `Contrato ${c.contract_code}`, c.approved_at && `Aprobado ${formatDate(c.approved_at)}`,
                  c.invoices_count ? `${c.invoices_count} factura(s) ya asociada(s)` : 'Sin factura'].filter(Boolean).join(' · '),
                factura.contractor && c.contractor_id === factura.contractor.id
                  ? <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-green-50 text-green-700">Mismo proveedor</span>
                  : undefined,
              ))}
            </ul>
          ) : (
            <p className="text-sm font-bold text-slate-400 bg-white rounded-2xl p-4 border border-slate-100">
              No tienes cortes con las tres aprobaciones. La factura se asocia cuando el corte quede aprobado.
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

        {(factura.amount === null || (targetType === 'orden' && !factura.contractor)) && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {factura.amount === null && (
              <div className="space-y-1.5">
                <label className={labelClass}>Valor de la factura *</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">$</span>
                  <input disabled={submitting} inputMode="numeric" className={`${inputClass} pl-8`} placeholder="Contabilidad no lo registró"
                    value={amount} onChange={(e) => setAmount(formatMoneyInput(e.target.value))} />
                </div>
              </div>
            )}
            {targetType === 'orden' && !factura.contractor && (
              <div className="space-y-1.5">
                <label className={labelClass}>Proveedor *</label>
                <CustomSelect pyClass="py-3" placeholder="Buscar proveedor" disabled={submitting}
                  options={catalogs.contractors.map((c) => ({ value: c.id, label: c.name, sublabel: c.nit ? `NIT ${c.nit}` : undefined }))}
                  value={contractorId} onChange={(v) => setContractorId(Number(v))} />
              </div>
            )}
          </div>
        )}

        <div className="space-y-2">
          <label className={labelClass}>Soportes * (aprobaciones y corte o entrada de Multifox)</label>
          <div onClick={() => !submitting && fileInputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); if (!submitting) addFiles(e.dataTransfer.files); }}
            className="border-2 border-dashed border-slate-300 hover:border-[#004C6C]/60 hover:bg-blue-50/30 rounded-3xl p-4 flex flex-col items-center justify-center gap-1 text-center cursor-pointer bg-white transition-all">
            <input ref={fileInputRef} type="file" multiple className="hidden" accept=".pdf,.png,.jpg,.jpeg,.webp"
              onChange={(e) => { addFiles(e.target.files); e.target.value = ''; }} />
            <UploadCloud size={22} className="text-slate-400" />
            <p className="text-sm font-bold text-slate-500">Arrastra los archivos, haz clic o pega las capturas (Ctrl+V)</p>
          </div>
          {files.length > 0 && (
            <ul className="space-y-1.5">
              {files.map((file, i) => (
                <li key={`${file.name}-${i}`} className="flex items-center justify-between gap-2 bg-white rounded-xl border border-slate-100 px-3 py-2">
                  <span className="flex items-center gap-2 min-w-0">
                    {file.type.startsWith('image/') ? <Paperclip size={14} className="text-slate-400 shrink-0" /> : <FileText size={14} className="text-slate-400 shrink-0" />}
                    <span className="text-xs font-bold text-slate-700 truncate">{file.name}</span>
                    <span className="text-[11px] font-bold text-slate-400 shrink-0">{formatBytes(file.size)}</span>
                  </span>
                  <button type="button" disabled={submitting} onClick={() => setFiles((prev) => prev.filter((_, j) => j !== i))}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50" title="Quitar">
                    <Trash2 size={14} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="space-y-1.5">
          <label className={labelClass}>Observación</label>
          <textarea rows={2} disabled={submitting} className={`${inputClass} resize-none`}
            placeholder="Ej: corte 6634 de Multifox, liquidación parcial..."
            value={comment} onChange={(e) => setComment(e.target.value)} />
        </div>

        {targetType === 'corte' && (
          <p className="text-[11px] font-bold text-slate-400">
            Al asociarla, el corte pasa a Facturado y se avisa para el registro en Multifox y cuentas por pagar.
          </p>
        )}
        {targetType === 'orden' && (
          <p className="text-[11px] font-bold text-slate-400">Al asociarla, la orden pasa a la entrada de almacén.</p>
        )}
      </div>
    </ModalShell>
  );
};
