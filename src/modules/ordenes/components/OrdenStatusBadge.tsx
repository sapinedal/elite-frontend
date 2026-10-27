import React from 'react';
import type { OrdenStatus } from '../types';

const STATUS_STYLES: Record<OrdenStatus, string> = {
  pendiente_director: 'bg-indigo-50 text-indigo-600',
  pendiente_gerencia: 'bg-purple-50 text-purple-600',
  devuelto: 'bg-red-50 text-red-600',
  pendiente_erp: 'bg-orange-50 text-orange-700',
  pendiente_factura: 'bg-teal-50 text-teal-700',
  pendiente_entrada: 'bg-blue-50 text-[#004C6C]',
  completada: 'bg-green-50 text-green-600',
};

export const OrdenStatusBadge: React.FC<{ status: OrdenStatus; label: string }> = ({ status, label }) => (
  <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg whitespace-nowrap ${STATUS_STYLES[status] ?? 'bg-slate-100 text-slate-600'}`}>
    {label}
  </span>
);
