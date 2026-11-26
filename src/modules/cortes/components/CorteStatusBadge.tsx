import React from 'react';
import type { CorteStatus } from '../types';

const STATUS_STYLES: Record<CorteStatus, string> = {
  pendiente_interventor: 'bg-blue-50 text-[#004C6C]',
  pendiente_director: 'bg-[#004C6C]/15 text-[#004C6C]',
  pendiente_gerencia: 'bg-[#004C6C] text-white',
  devuelto: 'bg-red-50 text-red-600',
  aprobado: 'bg-green-50 text-green-600',
  facturado: 'bg-[#EE9D4C] text-white',
};

export const CorteStatusBadge: React.FC<{ status: CorteStatus; label: string }> = ({ status, label }) => (
  <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg whitespace-nowrap ${STATUS_STYLES[status] ?? 'bg-slate-100 text-slate-600'}`}>
    {label}
  </span>
);

/** El Interventor rechazó el corte pero dejó que continuara el flujo */
export const InterventorRejectedBadge: React.FC = () => (
  <span title="El Interventor rechazó el corte pero continuó el flujo sin su aprobación"
    className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg whitespace-nowrap bg-amber-50 text-amber-700">
    Rechazado pero aprobado
  </span>
);

