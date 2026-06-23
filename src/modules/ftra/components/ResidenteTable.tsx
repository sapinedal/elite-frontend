import React from 'react';
import { Trash2, Edit } from 'lucide-react';
import type { Residente } from '../types';
import { DataTable } from '../../../components/ui/DataTable';

interface ResidenteTableProps {
  residentes: Residente[];
  isLoading: boolean;
  isEditor: boolean;
  onEditResidente: (residente: Residente) => void;
  onDeleteResidente: (id: number) => void;
}

export const ResidenteTable: React.FC<ResidenteTableProps> = ({
  residentes,
  isLoading,
  isEditor,
  onEditResidente,
  onDeleteResidente,
}) => {
  const columns = [
    {
      header: 'Nombre Completo',
      accessor: (residente: Residente) => (
        <span className="text-slate-800 font-black tracking-tight leading-relaxed">
          {residente.name}
        </span>
      ),
    },
    {
      header: 'Correo Electrónico',
      accessor: (residente: Residente) => (
        <span className="text-slate-500 font-bold lowercase">
          {residente.email}
        </span>
      ),
    },
    {
      header: 'Rol / Cargo',
      accessor: (residente: Residente) => (
        <span className="text-[#004C6C] font-black uppercase tracking-wider text-[10px]">
          {residente.role}
        </span>
      ),
    },
    {
      header: 'Estado',
      accessor: (residente: Residente) => (
        <span
          className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest leading-none ${
            residente.is_active
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
              : 'bg-slate-100 text-slate-600 border border-slate-200'
          }`}
        >
          {residente.is_active ? 'Activo' : 'Inactivo'}
        </span>
      ),
    },
    {
      header: 'Acciones',
      accessor: (residente: Residente) => (
        <div className="flex items-center gap-1.5 justify-end" onClick={(e) => e.stopPropagation()}>
          {/* Editar Residente */}
          {isEditor && (
            <button
              onClick={() => onEditResidente(residente)}
              title="Editar Residente"
              className="p-3 text-slate-400 hover:text-[#004C6C] hover:bg-blue-50 rounded-2xl transition-all cursor-pointer"
            >
              <Edit size={16} />
            </button>
          )}

          {/* Eliminar Residente */}
          {isEditor && (
            <button
              onClick={() => onDeleteResidente(residente.id)}
              title="Eliminar Residente"
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
      data={residentes}
      isLoading={isLoading}
      onRowClick={isEditor ? onEditResidente : undefined}
      emptyMessage="No hay residentes registrados para los filtros seleccionados."
    />
  );
};
