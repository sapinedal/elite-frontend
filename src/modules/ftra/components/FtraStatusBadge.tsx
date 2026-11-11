import React from 'react';
import { FTRA_STATUS_LABELS, type FtraRecordStatus } from '../types';

// Mismos tonos que los estados de Cortes
const STATUS_STYLES: Record<FtraRecordStatus, string> = {
  Registrada: 'bg-blue-50 text-[#004C6C]',
  Seguimiento: 'bg-indigo-50 text-indigo-600',
  Devuelta: 'bg-red-50 text-red-600',
  Aprobada: 'bg-green-50 text-green-600',
  Rechazada: 'bg-red-50 text-red-600',
};

export const FtraStatusBadge: React.FC<{ status: FtraRecordStatus }> = ({ status }) => (
  <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg whitespace-nowrap ${STATUS_STYLES[status] ?? 'bg-slate-100 text-slate-600'}`}>
    {FTRA_STATUS_LABELS[status] ?? status}
  </span>
);
