import React from 'react';
import type { CuentaCobroStatus } from '../types';

const STYLES: Record<CuentaCobroStatus, string> = {
  pendiente_director: 'bg-orange-50 text-orange-700 border-orange-100',
  pendiente_gerencia: 'bg-orange-50 text-orange-700 border-orange-100',
  devuelta: 'bg-red-50 text-red-600 border-red-100',
  pendiente_revision: 'bg-blue-50 text-[#004C6C] border-blue-100',
  pendiente_multifox: 'bg-[#004C6C] text-white border-[#004C6C]',
  pendiente_aprobacion_contable: 'bg-[#004C6C]/15 text-[#004C6C] border-[#004C6C]/20',
  pendiente_erp: 'bg-blue-50 text-[#004C6C] border-blue-100',
  pendiente_factura: 'bg-amber-50 text-amber-700 border-amber-100',
  pendiente_liquidacion: 'bg-[#004C6C] text-white border-[#004C6C]',
  en_pagos: 'bg-green-50 text-green-700 border-green-100',
};

export const CuentaCobroStatusBadge: React.FC<{ status: CuentaCobroStatus; label: string }> = ({ status, label }) => (
  <span className={`inline-flex items-center px-2.5 py-1 rounded-lg border text-[11px] font-black whitespace-nowrap ${STYLES[status]}`}>{label}</span>
);
