import React from 'react';
import type { FacturaStatus } from '../types';

const STYLES: Record<FacturaStatus, string> = {
  pendiente: 'bg-orange-50 text-orange-700 border-orange-100',
  procesada: 'bg-green-50 text-green-700 border-green-100',
  pendiente_contable: 'bg-blue-50 text-[#004C6C] border-blue-100',
};

export const FacturaStatusBadge: React.FC<{ status: FacturaStatus; label: string }> = ({ status, label }) => (
  <span className={`inline-flex items-center px-2.5 py-1 rounded-lg border text-[11px] font-black whitespace-nowrap ${STYLES[status]}`}>{label}</span>
);
