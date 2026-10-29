import React from 'react';
import type { AnticipoStatus } from '../types';

const STYLES: Record<AnticipoStatus, string> = {
  pendiente_director: 'bg-orange-50 text-orange-700 border-orange-100',
  pendiente_gerencia: 'bg-orange-50 text-orange-700 border-orange-100',
  devuelto: 'bg-red-50 text-red-600 border-red-100',
  pendiente_contabilidad: 'bg-blue-50 text-[#004C6C] border-blue-100',
  completado: 'bg-green-50 text-green-700 border-green-100',
};

export const AnticipoStatusBadge: React.FC<{ status: AnticipoStatus; label: string }> = ({ status, label }) => (
  <span className={`inline-flex items-center px-2.5 py-1 rounded-lg border text-[11px] font-black whitespace-nowrap ${STYLES[status]}`}>{label}</span>
);
