import React, { useState, useEffect, useCallback } from 'react';
import {
  History,
  X,
  Loader2,
  ArrowUpRight,
  ArrowDownLeft,
  Trash2,
  FolderPlus,
  Edit2,
  ShieldAlert,
  Lock,
  Filter,
  ChevronLeft,
  ChevronRight,
  Settings,
} from 'lucide-react';
import { documentalService } from '../services/documentalService';
import type { DocumentActivityLog, DocumentLogFilters } from '../types/documental.types';

interface DocumentLogsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PER_PAGE = 20;

const ACTION_OPTIONS = [
  { value: '', label: 'Todas las acciones' },
  { value: 'denied', label: 'Intentos negados' },
  { value: 'upload', label: 'Subidas' },
  { value: 'download', label: 'Descargas' },
  { value: 'create_folder', label: 'Carpetas creadas' },
  { value: 'rename', label: 'Renombrados' },
  { value: 'delete', label: 'Eliminaciones' },
  { value: 'restrictions', label: 'Cambios de restricciones' },
  { value: 'settings', label: 'Cambios de configuración' },
];

const ATTEMPTED_LABELS: Record<string, string> = {
  browse: 'abrir carpeta',
  upload: 'subir archivos',
  download: 'descargar',
  create_folder: 'crear carpeta',
  rename: 'renombrar',
  delete: 'eliminar',
};

const badgeBase = 'inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border whitespace-nowrap';

const getActionBadge = (action: string) => {
  switch (action) {
    case 'upload':
      return <span className={`${badgeBase} bg-emerald-50 text-emerald-700 border-emerald-100`}><ArrowUpRight className="w-3 h-3" /> Subida</span>;
    case 'download':
      return <span className={`${badgeBase} bg-blue-50 text-blue-700 border-blue-100`}><ArrowDownLeft className="w-3 h-3" /> Descarga</span>;
    case 'create_folder':
      return <span className={`${badgeBase} bg-amber-50 text-amber-700 border-amber-100`}><FolderPlus className="w-3 h-3" /> Carpeta</span>;
    case 'rename':
      return <span className={`${badgeBase} bg-indigo-50 text-indigo-700 border-indigo-100`}><Edit2 className="w-3 h-3" /> Renombrado</span>;
    case 'delete':
      return <span className={`${badgeBase} bg-rose-50 text-rose-700 border-rose-100`}><Trash2 className="w-3 h-3" /> Eliminado</span>;
    case 'denied':
      return <span className={`${badgeBase} bg-red-600 text-white border-red-600`}><ShieldAlert className="w-3 h-3" /> Negado</span>;
    case 'restrictions':
      return <span className={`${badgeBase} bg-violet-50 text-violet-700 border-violet-100`}><Lock className="w-3 h-3" /> Restricción</span>;
    case 'settings':
      return <span className={`${badgeBase} bg-slate-100 text-slate-700 border-slate-200`}><Settings className="w-3 h-3" /> Configuración</span>;
    default:
      return <span className={`${badgeBase} bg-slate-50 text-slate-700 border-slate-200`}>{action}</span>;
  }
};

/** Texto complementario según el tipo de evento */
const getDetail = (log: DocumentActivityLog): string | null => {
  const d = log.details ?? {};
  if (log.action === 'denied') {
    const attempted = String(d.attempted_action ?? '');
    return `Intentó ${ATTEMPTED_LABELS[attempted] ?? attempted}: ${String(d.reason ?? '')}`;
  }
  if (log.action === 'rename' && d.from) {
    return `Antes: ${String(d.from)}`;
  }
  if (log.action === 'restrictions') {
    const rules = Array.isArray(d.rules) ? (d.rules as Array<{ role_name?: string }>) : [];
    return rules.length === 0
      ? 'Se quitó la restricción'
      : `Roles con acceso: ${rules.map((r) => r.role_name).filter(Boolean).join(', ')}`;
  }
  if (log.action === 'settings') {
    const changes = (d.changes ?? {}) as Record<string, { from: unknown; to: unknown }>;
    const labels: Record<string, string> = {
      max_upload_mb: 'Tamaño máximo (MB)',
      extension_mode: 'Modo de extensiones',
      blocked_extensions: 'Bloqueadas',
      allowed_extensions: 'Permitidas',
      max_folder_operation_files: 'Máx. archivos por operación de carpeta',
    };
    const fmt = (v: unknown) => (Array.isArray(v) ? v.join(', ') || '—' : String(v));
    const parts = Object.entries(changes).map(([k, c]) => `${labels[k] ?? k}: ${fmt(c.from)} → ${fmt(c.to)}`);
    return parts.length ? parts.join(' · ') : 'Sin cambios';
  }
  return null;
};

export const DocumentLogsModal: React.FC<DocumentLogsModalProps> = ({ isOpen, onClose }) => {
  const [logs, setLogs] = useState<DocumentActivityLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [deniedCount, setDeniedCount] = useState(0);
  const [filters, setFilters] = useState<DocumentLogFilters>({});
  const [draft, setDraft] = useState<DocumentLogFilters>({});

  const loadLogs = useCallback(async (p: number, f: DocumentLogFilters) => {
    try {
      setLoading(true);
      const res = await documentalService.getLogs(p, PER_PAGE, f);
      setLogs(res.data);
      setTotal(res.total);
      setPage(res.current_page);
      setLastPage(res.last_page);
      setDeniedCount(res.denied_last_7_days);
    } catch (err) {
      console.error('Error al cargar logs:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) loadLogs(1, filters);
  }, [isOpen, filters, loadLogs]);

  if (!isOpen) return null;

  const applyFilters = (e: React.FormEvent) => {
    e.preventDefault();
    setFilters({ ...draft });
  };

  const clearFilters = () => {
    setDraft({});
    setFilters({});
  };

  const showDenied = () => {
    const next = { ...draft, action: 'denied' };
    setDraft(next);
    setFilters(next);
  };

  const inputClass =
    'w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#EE9D4C]';
  const hasFilters = Object.values(filters).some(Boolean);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-5xl max-h-[90vh] rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100 shrink-0 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-50 text-amber-600 border border-amber-100">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Auditoría de Actividad</h3>
              <p className="text-xs text-slate-400">
                Operaciones, cambios de restricciones e intentos negados en el repositorio
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

        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {/* Alerta de intentos negados */}
          {deniedCount > 0 && filters.action !== 'denied' && (
            <button
              type="button"
              onClick={showDenied}
              className="w-full p-3 px-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-xs text-red-800 font-medium text-left hover:bg-red-100/60 transition-colors"
            >
              <ShieldAlert className="w-4 h-4 text-red-600 shrink-0" />
              <span className="flex-1">
                <strong>{deniedCount}</strong> intento(s) negado(s) en los últimos 7 días.
              </span>
              <span className="text-[11px] font-bold underline">Ver</span>
            </button>
          )}

          {/* Filtros */}
          <form onSubmit={applyFilters} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-2.5 items-end">
            <div className="lg:col-span-1">
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Acción</label>
              <select
                value={draft.action ?? ''}
                onChange={(e) => setDraft({ ...draft, action: e.target.value })}
                className={inputClass}
              >
                {ACTION_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <div className="lg:col-span-1">
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Usuario</label>
              <input
                type="text"
                value={draft.user ?? ''}
                onChange={(e) => setDraft({ ...draft, user: e.target.value })}
                placeholder="Nombre o correo"
                className={inputClass}
              />
            </div>
            <div className="lg:col-span-1">
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Ruta</label>
              <input
                type="text"
                value={draft.path ?? ''}
                onChange={(e) => setDraft({ ...draft, path: e.target.value })}
                placeholder="Contiene..."
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Desde</label>
              <input
                type="date"
                value={draft.date_from ?? ''}
                onChange={(e) => setDraft({ ...draft, date_from: e.target.value })}
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Hasta</label>
              <input
                type="date"
                value={draft.date_to ?? ''}
                onChange={(e) => setDraft({ ...draft, date_to: e.target.value })}
                className={inputClass}
              />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-white bg-[#004C6C] hover:bg-[#003952] transition-colors"
              >
                <Filter className="w-3.5 h-3.5" />
                <span>Filtrar</span>
              </button>
              {hasFilters && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="px-3 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Limpiar
                </button>
              )}
            </div>
          </form>

          {/* Tabla */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3 text-slate-400">
              <Loader2 className="w-6 h-6 animate-spin text-[#004C6C]" />
              <p className="text-xs font-semibold">Cargando registros de auditoría...</p>
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs">
              {hasFilters ? 'No hay registros que coincidan con los filtros.' : 'No se han registrado operaciones aún.'}
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-2xl overflow-x-auto shadow-sm">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-400 font-bold uppercase text-[10px]">
                    <th className="p-3">Acción</th>
                    <th className="p-3">Usuario</th>
                    <th className="p-3">Ruta / Detalle</th>
                    <th className="p-3">Fecha y Hora</th>
                    <th className="p-3 text-right">IP</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {logs.map((log) => {
                    const detail = getDetail(log);
                    return (
                      <tr
                        key={log.id}
                        className={`transition-colors ${log.action === 'denied' ? 'bg-red-50/40 hover:bg-red-50/70' : 'hover:bg-slate-50/70'}`}
                      >
                        <td className="p-3 align-top">{getActionBadge(log.action)}</td>
                        <td className="p-3 align-top">
                          <span className="font-bold text-slate-800 block">
                            {log.user?.name || `Usuario #${log.user_id || 'Sistema'}`}
                          </span>
                          {log.user?.email && <span className="text-[10px] text-slate-400">{log.user.email}</span>}
                        </td>
                        <td className="p-3 align-top max-w-sm">
                          <span className="font-mono text-[11px] text-slate-600 block truncate" title={log.path}>
                            {log.path || '/'}
                          </span>
                          {detail && (
                            <span
                              className={`text-[11px] block mt-0.5 ${log.action === 'denied' ? 'text-red-700' : 'text-slate-400'}`}
                            >
                              {detail}
                            </span>
                          )}
                        </td>
                        <td className="p-3 align-top text-slate-500 text-[11px] whitespace-nowrap">
                          {new Date(log.created_at).toLocaleString()}
                        </td>
                        <td className="p-3 align-top text-right text-slate-400 text-[11px] font-mono">
                          {log.ip_address || '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer con paginación */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between gap-3 shrink-0">
          <span className="text-xs font-semibold text-slate-500">
            {total} evento(s) • Página {page} de {lastPage}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={page <= 1 || loading}
              onClick={() => loadLogs(page - 1, filters)}
              className="p-2 rounded-xl text-slate-600 hover:bg-slate-200/60 disabled:opacity-40 transition-colors"
              aria-label="Página anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              disabled={page >= lastPage || loading}
              onClick={() => loadLogs(page + 1, filters)}
              className="p-2 rounded-xl text-slate-600 hover:bg-slate-200/60 disabled:opacity-40 transition-colors"
              aria-label="Página siguiente"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="px-5 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200/60 transition-colors"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
