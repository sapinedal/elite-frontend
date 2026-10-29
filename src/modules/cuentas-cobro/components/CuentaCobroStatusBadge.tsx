import React from 'react';
import type { CuentaCobroStatus } from '../types';

const STYLES: Record<CuentaCobroStatus, string> = {
  pendiente_director: 'bg-orange-50 text-orange-700 border-orange-100',
  pendiente_gerencia: 'bg-orange-50 text-orange-700 border-orange-100',
  devuelta: 'bg-red-50 text-red-600 border-red-100',
  pendiente_revision: 'bg-blue-50 text-[#004C6C] border-blue-100',
  pendiente_multifox: 'bg-purple-50 text-purple-700 border-purple-100',
  en_pagos: 'bg-green-50 text-green-700 border-green-100',
};

export const CuentaCobroStatusBadge: React.FC<{ status: CuentaCobroStatus; label: string }> = ({ status, label }) => (
  <span className={`inline-flex items-center px-2.5 py-1 rounded-lg border text-[11px] font-black whitespace-nowrap ${STYLES[status]}`}>{label}</span>
);
