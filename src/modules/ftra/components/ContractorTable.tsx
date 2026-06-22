import React from 'react';
import { Trash2, Edit } from 'lucide-react';
import type { FtraContractor } from '../types';
import { DataTable } from '../../../components/ui/DataTable';

interface ContractorTableProps {
  contractors: FtraContractor[];
  isLoading: boolean;
  isEditor: boolean;
  onEditContractor: (contractor: FtraContractor) => void;
  onDeleteContractor: (id: number) => void;
}

export const ContractorTable: React.FC<ContractorTableProps> = ({
  contractors,
  isLoading,
  isEditor,
  onEditContractor,
  onDeleteContractor,
}) => {
  const columns = [
    {
      header: 'Nombre / Razón Social',
      accessor: (contractor: FtraContractor) => (
        <span className="text-slate-800 font-black tracking-tight leading-relaxed">
          {contractor.name}
        </span>
      ),
    },
    {
      header: 'NIT / Identificación',
      accessor: (contractor: FtraContractor) => (
        <span className="text-slate-500 font-bold">
          {contractor.nit || <span className="text-slate-300 font-normal">No registrado</span>}
        </span>
      ),
    },
    {
      header: 'Teléfono',
      accessor: (contractor: FtraContractor) => (
        <span className="text-slate-500 font-medium">
          {contractor.phone || <span className="text-slate-300 font-normal">--</span>}
        </span>
      ),
    },
    {
      header: 'Correo Electrónico',
      accessor: (contractor: FtraContractor) => (
        <span className="text-slate-500 font-medium lowercase">
          {contractor.email || <span className="text-slate-300 font-normal">--</span>}
        </span>
      ),
    },
    {
      header: 'Estado',
      accessor: (contractor: FtraContractor) => (
        <span
          className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest leading-none ${
            contractor.is_active
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
              : 'bg-slate-100 text-slate-600 border border-slate-200'
          }`}
        >
          {contractor.is_active ? 'Activo' : 'Inactivo'}
        </span>
      ),
    },
    {
      header: 'Acciones',
      accessor: (contractor: FtraContractor) => (
        <div className="flex items-center gap-1.5 justify-end" onClick={(e) => e.stopPropagation()}>
          {/* Editar contratista (solo visible para editores) */}
          {isEditor && (
            <button
              onClick={() => onEditContractor(contractor)}
              title="Editar Contratista"
              className="p-3 text-slate-400 hover:text-[#004C6C] hover:bg-blue-50 rounded-2xl transition-all cursor-pointer"
            >
              <Edit size={16} />
            </button>
          )}

          {/* Eliminar contratista (solo visible para editores) */}
          {isEditor && (
            <button
              onClick={() => onDeleteContractor(contractor.id)}
              title="Eliminar Contratista"
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
      data={contractors}
      isLoading={isLoading}
      onRowClick={isEditor ? onEditContractor : undefined}
      emptyMessage="No hay proveedores/contratistas registrados para los filtros seleccionados."
    />
  );
};
