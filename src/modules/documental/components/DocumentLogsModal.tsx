import React, { useState, useEffect } from 'react';
import { History, X, Loader2, ArrowUpRight, ArrowDownLeft, Trash2, FolderPlus, Edit2 } from 'lucide-react';
import { documentalService } from '../services/documentalService';
import type { DocumentActivityLog } from '../types/documental.types';

interface DocumentLogsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DocumentLogsModal: React.FC<DocumentLogsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [logs, setLogs] = useState<DocumentActivityLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    if (isOpen) {
      loadLogs(1);
    }
  }, [isOpen]);

  const loadLogs = async (p = 1) => {
    try {
      setLoading(true);
      const res = await documentalService.getLogs(p, 20);
      setLogs(res.data);
      setTotal(res.total);
      setPage(res.current_page);
    } catch (err) {
      console.error('Error al cargar logs:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'upload':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">
            <ArrowUpRight className="w-3 h-3" /> Subida
          </span>
        );
      case 'download':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100">
            <ArrowDownLeft className="w-3 h-3" /> Descarga
          </span>
        );
      case 'create_folder':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-100">
            <FolderPlus className="w-3 h-3" /> Carpeta
          </span>
        );
      case 'rename':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
            <Edit2 className="w-3 h-3" /> Renombrado
          </span>
        );
      case 'delete':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-100">
            <Trash2 className="w-3 h-3" /> Eliminado
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-50 text-slate-700 border border-slate-200">
            {action}
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-4xl max-h-[85vh] rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100 shrink-0 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-50 text-amber-600 border border-amber-100">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Auditoría de Actividad</h3>
              <p className="text-xs text-slate-400">
                Historial de operaciones de subida, creación y eliminación en el repositorio
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Table */}
        <div className="p-6 overflow-y-auto flex-1">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3 text-slate-400">
              <Loader2 className="w-6 h-6 animate-spin text-[#004C6C]" />
              <p className="text-xs font-semibold">Cargando registros de auditoría...</p>
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs">
              No se han registrado operaciones aún.
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-400 font-bold uppercase text-[10px]">
                    <th className="p-3">Acción</th>
                    <th className="p-3">Usuario</th>
                    <th className="p-3">Ruta</th>
                    <th className="p-3">Fecha y Hora</th>
                    <th className="p-3 text-right">IP</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="p-3">{getActionBadge(log.action)}</td>
                      <td className="p-3">
                        <span className="font-bold text-slate-800">
                          {log.user?.name || `Usuario #${log.user_id || 'Sistema'}`}
                        </span>
                      </td>
                      <td className="p-3 font-mono text-[11px] text-slate-600 max-w-xs truncate" title={log.path}>
                        {log.path}
                      </td>
                      <td className="p-3 text-slate-500 text-[11px]">
                        {new Date(log.created_at).toLocaleString()}
                      </td>
                      <td className="p-3 text-right text-slate-400 text-[11px] font-mono">
                        {log.ip_address || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between shrink-0">
          <span className="text-xs font-semibold text-slate-500">
            Página {page} • Total de eventos: {total}
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200/60 transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
