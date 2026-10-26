import React from 'react';
import type { CorteStatus } from '../types';

const STATUS_STYLES: Record<CorteStatus, string> = {
  pendiente_interventor: 'bg-blue-50 text-[#004C6C]',
  pendiente_director: 'bg-indigo-50 text-indigo-600',
  pendiente_gerencia: 'bg-purple-50 text-purple-600',
  devuelto: 'bg-red-50 text-red-600',
  aprobado: 'bg-green-50 text-green-600',
  facturado: 'bg-teal-50 text-teal-700',
};

export const CorteStatusBadge: React.FC<{ status: CorteStatus; label: string }> = ({ status, label }) => (
  <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg whitespace-nowrap ${STATUS_STYLES[status] ?? 'bg-slate-100 text-slate-600'}`}>
    {label}
  </span>
);

