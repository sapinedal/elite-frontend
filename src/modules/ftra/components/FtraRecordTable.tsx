import React from 'react';
import { Eye, PenLine, ClipboardCheck } from 'lucide-react';
import type { FtraRecord } from '../types';
import { DataTable } from '../../../components/ui/DataTable';
import { FtraStatusBadge } from './FtraStatusBadge';

interface FtraRecordTableProps {
  records: FtraRecord[];
  isLoading: boolean;
  onOpenDetails: (record: FtraRecord) => void;
  emptyMessage?: string;
}

const formatDateTime = (value: string) =>
  value ? new Date(value).toLocaleString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

/** Acción principal según lo que el usuario puede hacer con el FTRA (como en Cortes). */
const actionFor = (record: FtraRecord) =>
  record.can?.review
    ? { label: 'Revisar', icon: <ClipboardCheck size={15} />, highlighted: true }
    : record.can?.resubmit
      ? { label: 'Corregir', icon: <PenLine size={15} />, highlighted: true }
      : { label: 'Ver', icon: <Eye size={15} />, highlighted: false };

const location = (r: FtraRecord) => [r.tower?.name, r.piso && `Piso ${r.piso}`].filter(Boolean).join(' · ') || '—';

export const FtraRecordTable: React.FC<FtraRecordTableProps> = ({
  records,
  isLoading,
  onOpenDetails,
  emptyMessage = 'No hay registros FTRA para los filtros seleccionados.',
}) => {
  const columns = [
    {
      header: 'FTRA',
      accessor: (r: FtraRecord) => (
        <div className="min-w-[160px] max-w-[260px]">
          <p className="font-black text-[#004C6C] whitespace-nowrap">Apto {r.apartamento || '—'}</p>
          <p className="text-[11px] text-slate-400 truncate" title={r.format?.name}>
            {r.format?.code ? `[${r.format.code}] ` : ''}{r.format?.name ?? '—'}
          </p>
        </div>
      ),
    },
    {
      header: 'Torre / Piso',
      accessor: (r: FtraRecord) => <p className="whitespace-nowrap">{location(r)}</p>,
    },
    {
      header: 'Proveedor',
      accessor: (r: FtraRecord) => (
        <p className="truncate max-w-[240px]" title={r.contractor?.name}>{r.contractor?.name ?? '—'}</p>
      ),
    },
    {
      header: 'Registrado por',
      accessor: (r: FtraRecord) => (
        <div className="text-[11px] leading-5 whitespace-nowrap">
          <p className="text-sm">{r.registered_by?.name ?? '—'}</p>
          <p className="text-slate-400">{formatDateTime(r.created_at)}</p>
        </div>
      ),
    },
    {
      header: 'Estado',
      accessor: (r: FtraRecord) => <FtraStatusBadge status={r.status} />,
    },
    {
      header: 'Acciones',
      className: 'text-right',
      accessor: (r: FtraRecord) => {
        const action = actionFor(r);
        return (
          <div className="flex justify-end" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => onOpenDetails(r)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap ${action.highlighted ? 'bg-[#EE9D4C] text-white hover:bg-[#e08a35]' : 'text-[#004C6C] hover:bg-blue-50'}`}
            >
              {action.icon} {action.label}
            </button>
          </div>
        );
      },
    },
  ];

  return (
    <>
      {/* Mobile: tarjetas */}
      <div className="md:hidden space-y-3">
        {isLoading && records.length === 0 && (
          <div className="bg-white rounded-[28px] border border-slate-100 shadow-sm p-8 text-center text-xs font-bold text-slate-400">Cargando registros...</div>
        )}
        {!isLoading && records.length === 0 && (
          <div className="bg-white rounded-[28px] border border-slate-100 shadow-sm p-8 text-center text-xs font-bold text-slate-400">{emptyMessage}</div>
        )}
        {records.map(r => {
          const action = actionFor(r);
          return (
            <div key={r.id} onClick={() => onOpenDetails(r)} className="bg-white rounded-[28px] border border-slate-100 shadow-sm p-5 space-y-3 active:bg-slate-50 cursor-pointer">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-black text-[#004C6C]">Apto {r.apartamento || '—'}</p>
                  <p className="text-[11px] text-slate-400 truncate">{r.format?.code ? `[${r.format.code}] ` : ''}{r.format?.name}</p>
                </div>
                <FtraStatusBadge status={r.status} />
              </div>
              <div className="text-xs font-bold text-slate-600 space-y-0.5">
                <p>{location(r)}</p>
                <p className="truncate">{r.contractor?.name ?? '—'}</p>
                <p className="text-[11px] text-slate-400 font-semibold">{r.registered_by?.name} · {formatDateTime(r.created_at)}</p>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); onOpenDetails(r); }}
                className={`w-full flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-bold ${action.highlighted ? 'bg-[#EE9D4C] text-white' : 'bg-blue-50 text-[#004C6C]'}`}
              >
                {action.icon} {action.label}
              </button>
            </div>
          );
        })}
      </div>

      {/* Escritorio: tabla */}
      <div className="hidden md:block">
        <DataTable columns={columns} data={records} isLoading={isLoading} onRowClick={onOpenDetails} emptyMessage={emptyMessage} />
      </div>
    </>
  );
};
