import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, CheckCircle2, Calendar, Play } from 'lucide-react';
import type { FtraRecord, FtraRecordStatus } from '../types';
import { DataTable } from '../../../components/ui/DataTable';

interface FtraRecordTableProps {
  records: FtraRecord[];
  isLoading: boolean;
  onOpenDetails: (record: FtraRecord) => void;
  onUpdateStatus?: (id: number, status: FtraRecordStatus) => Promise<any>;
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
  onUpdateStatus,
}) => {
  const navigate = useNavigate();
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
      header: 'Ubicación',
      accessor: (record: FtraRecord) => (
        <div className="flex flex-col gap-0.5">
          <span className="text-slate-800 font-bold tracking-tight">
            Piso: {record.piso || '--'}
          </span>
          <span className="text-[9px] text-[#004C6C] font-black uppercase tracking-wider">
            Apto: {record.apartamento || '--'}
          </span>
        </div>
      ),
    },
    {
      header: 'Responsable',
      accessor: (record: FtraRecord) => (
        <div className="flex flex-col gap-0.5">
          <span className="text-slate-800 font-bold tracking-tight">
            {record.responsable?.name || <span className="text-slate-300 font-normal italic">No asignado</span>}
          </span>
          {record.responsable?.role && (
            <span className="text-[9px] text-[#004C6C] font-black uppercase tracking-wider">
              {record.responsable.role}
            </span>
          )}
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
      header: 'Resultado Inspección',
      accessor: (record: FtraRecord) => {
        let styles = 'bg-slate-100 text-slate-600 border border-slate-200';
        if (record.resultado_inspeccion === 'Recibido a satisfacción') {
          styles = 'bg-emerald-50 text-emerald-700 border border-emerald-100';
        } else if (record.resultado_inspeccion === 'Recibido con observación') {
          styles = 'bg-amber-50 text-amber-700 border border-amber-100';
        } else if (record.resultado_inspeccion === 'Rechazado') {
          styles = 'bg-rose-50 text-rose-700 border border-rose-100';
        }

        return (
          <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest leading-none w-fit block ${styles}`}>
            {record.resultado_inspeccion || 'Recibido a satisfacción'}
          </span>
        );
      },
    },
    {
      header: 'Orden y Aseo',
      accessor: (record: FtraRecord) => {
        const isApproved = record.orden_aseo === 'Aprobado';
        return (
          <span
            className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest leading-none flex items-center gap-1.5 w-fit ${isApproved
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                : 'bg-rose-50 text-rose-700 border border-rose-100'
              }`}
          >
            {isApproved ? 'Aprobado' : 'Rechazado'}
          </span>
        );
      },
    },
    {
      header: 'Estado',
      accessor: (record: FtraRecord) => (
        <span
          className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest leading-none ${statusStyles[record.status]
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
          {/* Botón de Continuidad / Siguiente Fase */}
          {onUpdateStatus && (record.status === 'Registrada' || record.status === 'Seguimiento') && (
            <button
              onClick={async () => {
                if (record.status === 'Registrada') {
                  navigate(`/app/ftra/revision/${record.id}`);
                } else {
                  const nextStatus = 'Aprobada';
                  if (window.confirm(`¿Está seguro de avanzar este registro a la fase de "${nextStatus}"?`)) {
                    try {
                      await onUpdateStatus(record.id, nextStatus);
                    } catch (err) {
                      // Manejo del error
                    }
                  }
                }
              }}
              title={record.status === 'Registrada' ? 'Avanzar a Seguimiento (Firma Director)' : 'Aprobar Registro'}
              className="p-3 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-2xl transition-all cursor-pointer"
            >
              {record.status === 'Registrada' ? <Play size={16} /> : <CheckCircle2 size={16} />}
            </button>
          )}

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
      className: 'sticky right-0 text-right bg-white group-hover:bg-slate-50 border-l border-slate-100 z-10 shadow-[-4px_0_8px_rgba(0,0,0,0.015)]',
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
