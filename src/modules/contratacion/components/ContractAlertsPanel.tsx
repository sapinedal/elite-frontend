import React from 'react';
import { AlertTriangle, ShieldAlert, FolderOpen } from 'lucide-react';
import type { ContratacionAlerts } from '../types';

interface ContractAlertsPanelProps {
  alerts: ContratacionAlerts;
  onOpenContract: (contractId: number) => void;
}

const formatDate = (value: string) => {
  const [y, m, d] = value.split('-');
  return `${d}/${m}/${y}`;
};

/**
 * Alertas del proyecto: pólizas próximas a vencer y contratos con adjuntos faltantes.
 */
export const ContractAlertsPanel: React.FC<ContractAlertsPanelProps> = ({ alerts, onOpenContract }) => {
  const { expiring_policies: policies, missing_documents: missing } = alerts;
  if (policies.length === 0 && missing.length === 0) return null;

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
      {policies.length > 0 && (
        <div className="bg-white rounded-[32px] border border-red-100 shadow-sm p-6 space-y-4">
          <div className="flex items-center gap-2 text-red-600">
            <ShieldAlert size={20} />
            <h3 className="font-black tracking-tight">Pólizas por vencer ({policies.length})</h3>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Próximos {alerts.policy_alert_days} días
            </span>
          </div>
          <ul className="space-y-2 max-h-64 overflow-y-auto pr-1">
            {policies.map((p) => {
              const expired = (p.days_to_expire ?? 0) < 0;
              return (
                <li key={`${p.contract_id}-${p.id}`}>
                  <button
                    onClick={() => onOpenContract(p.contract_id)}
                    className="w-full flex items-center justify-between gap-3 text-left bg-slate-50 hover:bg-red-50 rounded-2xl px-4 py-3 transition-all"
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-black text-slate-700 truncate">{p.contract_code} · {p.contractor_name}</p>
                      <p className="text-[11px] font-bold text-slate-400 truncate">
                        {p.policy_type}{p.policy_number ? ` · N° ${p.policy_number}` : ''} · vence {formatDate(p.expires_at)}
                      </p>
                    </div>
                    <span className={`shrink-0 text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-lg ${expired ? 'bg-red-600 text-white' : 'bg-red-50 text-red-600'}`}>
                      {expired ? 'Vencida' : `${p.days_to_expire} días`}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {missing.length > 0 && (
        <div className="bg-white rounded-[32px] border border-orange-100 shadow-sm p-6 space-y-4">
          <div className="flex items-center gap-2 text-orange-600">
            <AlertTriangle size={20} />
            <h3 className="font-black tracking-tight">Adjuntos faltantes ({missing.length} contratos)</h3>
          </div>
          <ul className="space-y-2 max-h-64 overflow-y-auto pr-1">
            {missing.map((m) => (
              <li key={m.contract_id}>
                <button
                  onClick={() => onOpenContract(m.contract_id)}
                  className="w-full flex items-center justify-between gap-3 text-left bg-slate-50 hover:bg-orange-50 rounded-2xl px-4 py-3 transition-all"
                >
                  <div className="min-w-0">
                    <p className="text-xs font-black text-slate-700 truncate">{m.contract_code} · {m.contractor_name}</p>
                    <p className="text-[11px] font-bold text-slate-400 truncate" title={m.missing.join(', ')}>
                      {m.missing.join(', ')}
                    </p>
                  </div>
                  <FolderOpen size={16} className="shrink-0 text-orange-500" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
