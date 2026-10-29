import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Receipt, Download, Loader2, AlertCircle, Paperclip, ArrowRight } from 'lucide-react';
import { formatDateTime } from '../../../utils/dateUtils';
import { formatMoney } from '../../../utils/money';
import { formatBytes } from '../../cortes/utils/format';
import { facturacionService, getApiErrorMessage } from '../services/facturacionService';
import { FacturaStatusBadge } from './FacturaStatusBadge';
import { ModalShell } from '../../../components/ui/ModalShell';
import type { Factura } from '../types';

interface FacturaDetailModalProps {
  facturaId: number | null;
  onClose: () => void;
}

const Field: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div className="min-w-0">
    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
    <div className="text-sm font-bold text-slate-700 break-words">{children}</div>
  </div>
);

/**
 * Detalle de una factura del mes: datos de Contabilidad, a qué corte u orden la asoció obra y sus soportes.
 */
export const FacturaDetailModal: React.FC<FacturaDetailModalProps> = ({ facturaId, onClose }) => (
  // Se monta por cada factura abierta (`key`), así arranca sin los datos de la anterior
  facturaId !== null ? <DetailContent key={facturaId} facturaId={facturaId} onClose={onClose} /> : null
);

const DetailContent: React.FC<{ facturaId: number; onClose: () => void }> = ({ facturaId, onClose }) => {
  const [factura, setFactura] = useState<Factura | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState<string | null>(null);

  useEffect(() => {
    facturacionService.getFactura(facturaId)
      .then(setFactura)
      .catch((err) => setError(getApiErrorMessage(err, 'Error al cargar la factura.')));
  }, [facturaId]);

  const download = async (key: string, getUrl: () => Promise<string>) => {
    setDownloading(key);
    try {
      window.open(await getUrl(), '_blank', 'noopener');
    } catch (err) {
      setError(getApiErrorMessage(err, 'Error al descargar el archivo.'));
    } finally {
      setDownloading(null);
    }
  };

  const targetHref = factura?.target
    ? factura.target.type === 'corte' ? `/app/contratacion/cortes?corte=${factura.target.id}` : '/app/contratacion/ordenes'
    : null;

  return (
    <ModalShell
      isOpen
      onClose={onClose}
      icon={<Receipt size={24} />}
      title={factura ? factura.document_number : 'Factura'}
      subtitle={factura ? `${factura.supplier_name} · ${factura.period_label}` : undefined}
    >
      {error && (
        <div className="p-3 bg-red-50 border border-red-100 rounded-2xl text-xs font-bold text-red-600 flex items-center gap-2">
          <AlertCircle size={16} className="shrink-0" /> {error}
        </div>
      )}
      {!factura ? (
        !error && <div className="flex justify-center py-10"><Loader2 className="animate-spin text-slate-300" /></div>
      ) : (
        <>
          <div className="bg-white rounded-3xl border border-slate-100 p-5 grid grid-cols-2 md:grid-cols-3 gap-4">
            <Field label="Estado"><FacturaStatusBadge status={factura.status} label={factura.status_label} /></Field>
            <Field label="Tipo">{factura.document_type_label}</Field>
            <Field label="Valor">{formatMoney(factura.amount)}</Field>
            <Field label="Proveedor">{factura.contractor?.name ?? factura.supplier_name}{factura.contractor?.nit && <span className="block text-[11px] text-slate-400">NIT {factura.contractor.nit}</span>}</Field>
            {factura.related_document && <Field label="Afecta a">{factura.related_document}</Field>}
            <Field label="Cargada por">{factura.uploaded_by ?? '—'}<span className="block text-[11px] text-slate-400">{formatDateTime(factura.created_at)}</span></Field>
            {factura.observation && <div className="col-span-2 md:col-span-3"><Field label="Observación de Contabilidad"><span className="whitespace-pre-line">{factura.observation}</span></Field></div>}
            <div className="col-span-2 md:col-span-3 flex items-center justify-between gap-3 bg-slate-50 rounded-2xl p-3">
              <span className="text-xs font-bold text-slate-500 truncate">{factura.file_name} · {formatBytes(factura.file_size)}</span>
              <button type="button" onClick={() => download('file', () => facturacionService.getDownloadUrl(factura.id))}
                className="p-2 rounded-xl text-[#004C6C] hover:bg-blue-50 shrink-0" title="Descargar factura">
                {downloading === 'file' ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
              </button>
            </div>
          </div>

          {factura.target && (
            <div className="bg-white rounded-3xl border border-green-100 p-5 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Procesada por obra</p>
                  <p className="font-black text-[#004C6C]">{factura.target.label}</p>
                  <p className="text-[11px] font-bold text-slate-400">{factura.processed_by} · {factura.processed_at && formatDateTime(factura.processed_at)}</p>
                </div>
                {targetHref && (
                  <Link to={targetHref} className="flex items-center gap-1 text-xs font-bold text-[#004C6C] hover:bg-blue-50 px-3 py-2 rounded-xl">
                    Ver {factura.target.type === 'corte' ? 'corte' : 'orden'} <ArrowRight size={14} />
                  </Link>
                )}
              </div>
              {factura.processed_comment && <p className="text-sm font-medium text-slate-600 whitespace-pre-line">{factura.processed_comment}</p>}
              <ul className="space-y-1.5">
                {factura.supports.map((s) => (
                  <li key={s.id} className="flex items-center justify-between gap-2 bg-slate-50 rounded-xl px-3 py-2">
                    <span className="flex items-center gap-2 min-w-0">
                      <Paperclip size={14} className="text-slate-400 shrink-0" />
                      <span className="text-xs font-bold text-slate-700 truncate">{s.file_name}</span>
                      <span className="text-[11px] font-bold text-slate-400 shrink-0">{formatBytes(s.file_size)}</span>
                    </span>
                    <button type="button" onClick={() => download(`s${s.id}`, () => facturacionService.getSupportDownloadUrl(s.id))}
                      className="p-1.5 rounded-lg text-[#004C6C] hover:bg-blue-50" title="Descargar soporte">
                      {downloading === `s${s.id}` ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </ModalShell>
  );
};
