import React from 'react';
import { ExternalLink, Trash2, Edit, FileText } from 'lucide-react';
import type { FtraFormat } from '../types';
import { DataTable } from '../../../components/ui/DataTable';

interface FormatTableProps {
  formats: FtraFormat[];
  isLoading: boolean;
  isEditor: boolean;
  onEditFormat: (format: FtraFormat) => void;
  onDeleteFormat: (id: number) => void;
}

export const FormatTable: React.FC<FormatTableProps> = ({
  formats,
  isLoading,
  isEditor,
  onEditFormat,
  onDeleteFormat,
}) => {
  const columns = [
    {
      header: 'Código',
      accessor: (format: FtraFormat) => (
        <span className="text-slate-800 font-black uppercase tracking-wider">
          {format.code}
        </span>
      ),
    },
    {
      header: 'Nombre del Formato',
      accessor: (format: FtraFormat) => (
        <div className="flex flex-col gap-1 max-w-[280px]">
          <span className="text-slate-800 font-black tracking-tight leading-relaxed">
            {format.name}
          </span>
          {format.description && (
            <span className="text-[11px] text-slate-400 font-bold line-clamp-1">
              {format.description}
            </span>
          )}
        </div>
      ),
    },
    {
      header: 'Versión',
      accessor: (format: FtraFormat) => (
        <span className="px-2.5 py-1 rounded-lg bg-slate-50 text-slate-500 border border-slate-100 text-xs font-bold">
          {format.version}
        </span>
      ),
    },
    {
      header: 'Estado',
      accessor: (format: FtraFormat) => (
        <span
          className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest leading-none ${
            format.is_active
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
              : 'bg-slate-100 text-slate-600 border border-slate-200'
          }`}
        >
          {format.is_active ? 'Activo' : 'Inactivo'}
        </span>
      ),
    },
    {
      header: 'Acciones',
      accessor: (format: FtraFormat) => (
        <div className="flex items-center gap-1.5 justify-end" onClick={(e) => e.stopPropagation()}>
          {/* Ver / Abrir PDF */}
          {format.pdf_url ? (
            <a
              href={format.pdf_url}
              target="_blank"
              rel="noopener noreferrer"
              title="Ver PDF"
              className="p-3 text-slate-400 hover:text-[#004C6C] hover:bg-blue-50 rounded-2xl transition-all"
            >
              <ExternalLink size={16} />
            </a>
          ) : (
            <span className="p-3 text-slate-200 cursor-not-allowed" title="Sin archivo PDF">
              <FileText size={16} />
            </span>
          )}

          {/* Editar formato (solo visible para editores) */}
          {isEditor && (
            <button
              onClick={() => onEditFormat(format)}
              title="Editar Formato"
              className="p-3 text-slate-400 hover:text-[#004C6C] hover:bg-blue-50 rounded-2xl transition-all cursor-pointer"
            >
              <Edit size={16} />
            </button>
          )}

          {/* Eliminar formato (solo visible para editores) */}
          {isEditor && (
            <button
              onClick={() => onDeleteFormat(format.id)}
              title="Eliminar Formato"
              className="p-3 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all cursor-pointer"
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>
      ),
      className: 'text-right',
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={formats}
      isLoading={isLoading}
      onRowClick={isEditor ? onEditFormat : undefined}
      emptyMessage="No hay formatos registrados para los filtros seleccionados."
    />
  );
};
