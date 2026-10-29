import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Wallet, Loader2, Download, Banknote, CalendarX2, Ban, CalendarClock } from 'lucide-react';
import { formatDateTime } from '../../../utils/dateUtils';
import { HistoryButton, HistoryModal } from '../../../components/ui/HistoryModal';
import { formatMoney } from '../../../utils/money';
import { pagoService, getApiErrorMessage } from '../services/pagoService';
import { PagoModalShell, inputClass } from './PagoModalShell';
import { PagoPriorityBadge, PagoStatusBadge } from './PagoStatusBadge';
import type { PagoCuenta, PagoMovimiento } from '../types';

interface PagoDetailModalProps {
  cuentaId: number | null;
  /** Cambia cada vez que la cuenta se actualiza afuera (pago, priorización), para recargar el detalle */
  version: number;
  onClose: () => void;
  onPay: (cuenta: PagoCuenta) => void;
  onPrioritize: (cuenta: PagoCuenta) => void;
  onChanged: () => void;
}

const ACTION_LABELS: Record<PagoMovimiento['action'], { label: string; tone: string }> = {
  creada: { label: 'Ingresó al cuadro', tone: 'text-[#004C6C]' },
  priorizada: { label: 'Priorizada', tone: 'text-[#004C6C]' },
  desprogramada: { label: 'Desprogramada', tone: 'text-orange-600' },
  pago: { label: 'Pago registrado', tone: 'text-green-600' },
  nota_credito: { label: 'Nota crédito', tone: 'text-purple-600' },
  reemplazo: { label: 'Factura reemplazada', tone: 'text-purple-600' },
  anulada: { label: 'Anulada', tone: 'text-red-600' },
};

/**
 * Detalle de la cuenta: valores, origen (corte / orden) y acciones. La trazabilidad (quién hizo qué y cuándo)
 * se abre aparte con el botón Historial.
 */
export const PagoDetailModal: React.FC<PagoDetailModalProps> = ({ cuentaId, version, ...props }) => (
  cuentaId !== null ? <PagoDetailContent key={`${cuentaId}-${version}`} cuentaId={cuentaId} {...props} /> : null
);

const PagoDetailContent: React.FC<Omit<PagoDetailModalProps, 'cuentaId' | 'version'> & { cuentaId: number }> = ({
  cuentaId, onClose, onPay, onPrioritize, onChanged,
}) => {
  const [cuenta, setCuenta] = useState<PagoCuenta | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [annulling, setAnnulling] = useState(false);
  const [annulReason, setAnnulReason] = useState('');
  const [downloadingId, setDownloadingId] = useState<number | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);

  useEffect(() => {
    pagoService.getCuenta(cuentaId)
      .then(setCuenta)
      .catch((err) => setError(getApiErrorMessage(err, 'Error al cargar la cuenta.')));
  }, [cuentaId]);

  const run = async (action: () => Promise<PagoCuenta>) => {
    setBusy(true);
    setError(null);
    try {
      setCuenta(await action());
      onChanged();
    } catch (err) {
      setError(getApiErrorMessage(err, 'No se pudo completar la acción.'));
    } finally {
      setBusy(false);
    }
  };

  const handleDownload = async (movimientoId: number) => {
    setDownloadingId(movimientoId);
    try {
      window.open(await pagoService.getSupportDownloadUrl(movimientoId), '_blank', 'noopener');
    } catch (err) {
      setError(getApiErrorMessage(err, 'Error al descargar el soporte.'));
    } finally {
      setDownloadingId(null);
    }
  };

  const sourceLink = cuenta?.corte_id ? `/app/contratacion/cortes?corte=${cuenta.corte_id}`
    : cuenta?.orden_id ? `/app/contratacion/ordenes?orden=${cuenta.orden_id}`
    : cuenta?.anticipo_id ? `/app/contratacion/anticipos?anticipo=${cuenta.anticipo_id}`
    : cuenta?.cuenta_cobro_id ? `/app/contratacion/cuentas-cobro?cuenta=${cuenta.cuenta_cobro_id}` : null;

  return (
    <PagoModalShell isOpen onClose={onClose} size="lg" icon={<Wallet size={24} />}
      title={cuenta ? `${cuenta.document_number}` : 'Cuenta por pagar'}
      subtitle={cuenta ? `${cuenta.supplier_name}${cuenta.supplier_nit ? ` · NIT ${cuenta.supplier_nit}` : ''}` : undefined}
      error={error}
      headerAction={cuenta && <HistoryButton count={cuenta.movimientos?.length} onClick={() => setHistoryOpen(true)} />}>
      {!cuenta && !error && <div className="flex justify-center py-16"><Loader2 size={28} className="animate-spin text-[#004C6C]" /></div>}

      {cuenta && (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <PagoStatusBadge status={cuenta.status} label={cuenta.status_label} />
            {cuenta.priority && <PagoPriorityBadge priority={cuenta.priority} label={`Prioridad ${cuenta.priority_label}`} />}
            {cuenta.scheduled_for && (
              <span className="text-xs font-bold text-slate-500">Pago programado: {new Date(`${cuenta.scheduled_for}T00:00:00`).toLocaleDateString('es-CO')}</span>
            )}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[['Valor', cuenta.amount], ['Notas crédito', -cuenta.adjustments], ['Pagado', cuenta.paid_amount], ['Saldo', cuenta.balance]].map(([label, v]) => (
              <div key={label} className={`rounded-3xl border p-4 ${label === 'Saldo' ? 'bg-[#004C6C] border-[#004C6C] text-white' : 'bg-white border-slate-100'}`}>
                <p className={`text-[10px] font-black uppercase tracking-widest ${label === 'Saldo' ? 'text-white/70' : 'text-slate-400'}`}>{label}</p>
                <p className="text-lg font-black">{formatMoney(v as number)}</p>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-3xl border border-slate-100 p-6 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 text-sm">
            {[
              ['Origen', `${cuenta.source_label}${cuenta.source_code ? ` ${cuenta.source_code}` : ''}`],
              ['Proyecto / Frente', `${cuenta.project?.name ?? 'Sin proyecto'} · ${cuenta.frente}`],
              ['Ingresó al cuadro', formatDateTime(cuenta.created_at)],
              ['Priorizada por', cuenta.prioritized_by ? `${cuenta.prioritized_by} · ${formatDateTime(cuenta.prioritized_at ?? '')}` : '—'],
            ].map(([label, value]) => (
              <div key={label}>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
                <p className="font-bold text-slate-700">{value}</p>
              </div>
            ))}
            {cuenta.concept && (
              <div className="md:col-span-2">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Concepto</p>
                <p className="font-bold text-slate-700 whitespace-pre-line">{cuenta.concept}</p>
              </div>
            )}
            {sourceLink && (
              <Link to={sourceLink} className="md:col-span-2 text-xs font-black text-[#004C6C] hover:underline">
                Ver {cuenta.source_label.toLowerCase()} {cuenta.source_code} →
              </Link>
            )}
          </div>

          {/* Acciones */}
          {(cuenta.can_pay || cuenta.can_prioritize || cuenta.can_annul) && (
            <div className="flex flex-wrap gap-3">
              {cuenta.can_pay && (
                <button onClick={() => onPay(cuenta)} disabled={busy}
                  className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-green-600 hover:bg-green-700 text-white font-bold text-sm">
                  <Banknote size={16} /> Registrar pago
                </button>
              )}
              {cuenta.can_prioritize && (
                <button onClick={() => onPrioritize(cuenta)} disabled={busy}
                  className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-[#EE9D4C] hover:bg-[#e08a35] text-white font-bold text-sm">
                  <CalendarClock size={16} /> {cuenta.status === 'priorizada' ? 'Reprogramar' : 'Priorizar'}
                </button>
              )}
              {cuenta.can_prioritize && cuenta.status === 'priorizada' && (
                <button onClick={() => run(() => pagoService.unschedule(cuenta.id))} disabled={busy}
                  className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold text-sm">
                  <CalendarX2 size={16} /> Desprogramar
                </button>
              )}
              {cuenta.can_annul && !annulling && (
                <button onClick={() => setAnnulling(true)} disabled={busy}
                  className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-red-50 text-red-600 hover:bg-red-100 font-bold text-sm">
                  <Ban size={16} /> Anular
                </button>
              )}
            </div>
          )}

          {annulling && (
            <div className="bg-red-50 border border-red-100 rounded-3xl p-5 space-y-3">
              <textarea rows={2} className={`${inputClass} resize-none`} placeholder="Motivo de la anulación (obligatorio)"
                value={annulReason} onChange={(e) => setAnnulReason(e.target.value)} />
              <div className="flex gap-2">
                <button onClick={() => setAnnulling(false)} className="px-4 py-2.5 rounded-xl bg-white text-slate-500 font-bold text-sm">Cancelar</button>
                <button disabled={busy || !annulReason.trim()}
                  onClick={() => run(() => pagoService.annul(cuenta.id, annulReason.trim())).then(() => setAnnulling(false))}
                  className="px-4 py-2.5 rounded-xl bg-red-600 text-white font-bold text-sm disabled:opacity-50">Confirmar anulación</button>
              </div>
            </div>
          )}

          <HistoryModal isOpen={historyOpen} onClose={() => setHistoryOpen(false)}
            subtitle={`${cuenta.document_number} · ${cuenta.supplier_name}`}>
          <ol className="relative border-l-2 border-slate-100 ml-2 space-y-5">
            {(cuenta.movimientos ?? []).map((m) => {
              const action = ACTION_LABELS[m.action];
              return (
                <li key={m.id} className="ml-5">
                  <span className="absolute -left-[7px] mt-1.5 h-3 w-3 rounded-full bg-white border-2 border-slate-300" />
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-700">
                        <span className={`font-black ${action.tone}`}>{action.label}</span>
                        {m.amount !== null && m.action !== 'priorizada' && <span className="text-slate-700"> · {formatMoney(m.amount)}</span>}
                        <span className="text-slate-400 font-bold"> · {m.user ?? '—'}</span>
                      </p>
                      <p className="text-[11px] font-bold text-slate-400">
                        {formatDateTime(m.created_at)}
                        {m.payment_date ? ` · Pagado el ${new Date(`${m.payment_date}T00:00:00`).toLocaleDateString('es-CO')}` : ''}
                        {m.reference ? ` · Ref. ${m.reference}` : ''}
                      </p>
                      {m.comment && <p className="mt-1 text-xs font-medium text-slate-600 bg-slate-50 rounded-xl px-3 py-2 whitespace-pre-line">{m.comment}</p>}
                    </div>
                    {m.file_name && (
                      <button onClick={() => handleDownload(m.id)} disabled={downloadingId === m.id} title={`Descargar ${m.file_name}`}
                        className="p-2 rounded-xl text-[#004C6C] hover:bg-blue-50 shrink-0">
                        {downloadingId === m.id ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                      </button>
                    )}
                  </div>
                </li>
              );
            })}
          </ol>
          </HistoryModal>
        </>
      )}
    </PagoModalShell>
  );
};
