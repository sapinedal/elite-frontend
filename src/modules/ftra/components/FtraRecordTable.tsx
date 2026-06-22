import React from 'react';
import { Eye, CheckCircle2, AlertTriangle, Calendar } from 'lucide-react';
import type { FtraRecord, FtraRecordStatus } from '../types';
import { DataTable } from '../../../components/ui/DataTable';

interface FtraRecordTableProps {
  records: FtraRecord[];
  isLoading: boolean;
  onOpenDetails: (record: FtraRecord) => void;
}

const statusStyles: Record<FtraRecordStatus, string> = {
  Registrada: 'bg-slate-100 text-slate-600 border border-slate-200',
  Seguimiento: 'bg-blue-50 text-blue-700 border border-blue-100',
  Aprobada: 'bg-emerald-50 text-emerald-700 border border-emerald-100',
  Rechazada: 'bg-rose-50 text-rose-700 border border-rose-100',
};

export const FtraRecordTable: React.FC<FtraRecordTableProps> = ({
  records,
  isLoading,
  onOpenDetails,
}) => {
  const formatDate = (dateStr: string) => {
    if (!dateStr) return '--/--/----';
    const baseDate = dateStr.split('T')[0];
    const [year, month, day] = baseDate.split('-');
    return `${day}/${month}/${year}`;
  };

  const columns = [
    {
      header: 'Proveedor / Contratista',
      accessor: (record: FtraRecord) => (
        <span className="text-slate-800 font-black tracking-tight leading-relaxed line-clamp-1">
          {record.contractor?.name || 'Tercero Desconocido'}
        </span>
      ),
    },
    {
      header: 'Formato Evaluado',
      accessor: (record: FtraRecord) => (
        <div className="flex flex-col gap-1 max-w-[240px]">
          <span className="text-slate-800 font-black tracking-tight line-clamp-1">
            {record.format?.name || 'Formato Desconocido'}
          </span>
          <span className="text-[9px] text-[#004C6C] font-black uppercase tracking-wider">
            Código: {record.format?.code || '--'}
          </span>
        </div>
      ),
    },
    {
      header: 'Fecha Registro',
      accessor: (record: FtraRecord) => (
        <span className="flex items-center gap-1.5 text-xs text-slate-500 font-bold">
          <Calendar size={13} className="opacity-40" />
          {formatDate(record.created_at)}
        </span>
      ),
    },
    {
      header: 'Evaluación / Cumplimiento',
      accessor: (record: FtraRecord) => (
        <span
          className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest leading-none flex items-center gap-1.5 w-fit ${
            record.is_completed
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
              : 'bg-rose-50 text-rose-700 border border-rose-100'
          }`}
        >
          {record.is_completed ? (
            <>
              <CheckCircle2 size={12} />
              Cumple
            </>
          ) : (
            <>
              <AlertTriangle size={12} />
              No Cumple
            </>
          )}
        </span>
      ),
    },
    {
      header: 'Estado',
      accessor: (record: FtraRecord) => (
        <span
          className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest leading-none ${
            statusStyles[record.status]
          }`}
        >
          {record.status}
        </span>
      ),
    },
    {
      header: 'Acciones',
      accessor: (record: FtraRecord) => (
        <div className="flex items-center gap-1.5 justify-end" onClick={(e) => e.stopPropagation()}>
          {/* Ver Detalle Completo */}
          <button
            onClick={() => onOpenDetails(record)}
            title="Ver Detalle y Fotos"
            className="p-3 text-slate-400 hover:text-[#004C6C] hover:bg-blue-50 rounded-2xl transition-all cursor-pointer"
          >
            <Eye size={16} />
          </button>
        </div>
      ),
      className: 'text-right',
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={records}
      isLoading={isLoading}
      onRowClick={onOpenDetails}
      emptyMessage="No hay registros de auditorías FTRA guardados para los filtros seleccionados."
    />
  );
};
