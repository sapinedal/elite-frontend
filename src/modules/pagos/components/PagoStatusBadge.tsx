import React from 'react';
import type { PagoPriority, PagoStatus } from '../types';

const STATUS_STYLES: Record<PagoStatus, string> = {
  pendiente: 'bg-orange-50 text-orange-700',
  priorizada: 'bg-blue-50 text-[#004C6C]',
  parcial: 'bg-purple-50 text-purple-600',
  pagada: 'bg-green-50 text-green-600',
  anulada: 'bg-slate-100 text-slate-500',
};

const PRIORITY_STYLES: Record<PagoPriority, string> = {
  alta: 'bg-red-50 text-red-600',
  media: 'bg-amber-50 text-amber-700',
  baja: 'bg-slate-100 text-slate-600',
};

const badge = 'text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg whitespace-nowrap';

export const PagoStatusBadge: React.FC<{ status: PagoStatus; label: string }> = ({ status, label }) => (
  <span className={`${badge} ${STATUS_STYLES[status]}`}>{label}</span>
);

export const PagoPriorityBadge: React.FC<{ priority: PagoPriority; label: string }> = ({ priority, label }) => (
  <span className={`${badge} ${PRIORITY_STYLES[priority]}`}>{label}</span>
);
