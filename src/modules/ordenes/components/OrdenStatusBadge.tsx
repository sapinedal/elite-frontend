import React from 'react';
import type { OrdenStatus } from '../types';

const STATUS_STYLES: Record<OrdenStatus, string> = {
  pendiente_director: 'bg-[#004C6C]/15 text-[#004C6C]',
  pendiente_gerencia: 'bg-[#004C6C] text-white',
  devuelto: 'bg-red-50 text-red-600',
  pendiente_erp: 'bg-orange-50 text-orange-700',
  pendiente_factura: 'bg-[#EE9D4C] text-white',
  pendiente_entrada: 'bg-blue-50 text-[#004C6C]',
  pendiente_aprobacion_contable: 'bg-amber-50 text-amber-700',
  completada: 'bg-green-50 text-green-600',
};

export const OrdenStatusBadge: React.FC<{ status: OrdenStatus; label: string }> = ({ status, label }) => (
  <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg whitespace-nowrap ${STATUS_STYLES[status] ?? 'bg-slate-100 text-slate-600'}`}>
    {label}
  </span>
);
