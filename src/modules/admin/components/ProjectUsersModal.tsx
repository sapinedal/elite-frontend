import React, { useState, useEffect, useMemo } from 'react';
import { X, Users, Search, Loader2, CheckSquare, Square, Info } from 'lucide-react';
import { Portal } from '../../../components/ui/Portal';
import { projectService } from '../services/projectService';
import { userService } from '../../users/services/userService';
import type { Project } from '../types';
import type { User } from '../../users/types';
import { getErrorMessage } from '../../../lib/apiError';

interface ProjectUsersModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Se llama después de guardar, para refrescar el selector de proyectos del header */
  onSaved?: () => void | Promise<void>;
  project: Project | null;
}

/**
 * Asigna qué usuarios pueden ver la información de un proyecto (tareas, etc.).
 * Gerencia y administración (permiso proyectos.ver_todos) ven todos los proyectos sin asignación.
 */
export const ProjectUsersModal: React.FC<ProjectUsersModalProps> = ({
  isOpen,
  onClose,
  onSaved,
  project
}) => {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [initialIds, setInitialIds] = useState<Set<number>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [onlyAssigned, setOnlyAssigned] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !project) return;

    let cancelled = false;
    const load = async () => {
      setIsLoading(true);
      setErrorMessage(null);
      setSearchTerm('');
      setOnlyAssigned(false);
      try {
        const [allUsers, members] = await Promise.all([
          userService.getAllUsers(false),
          projectService.getProjectUsers(project.id)
        ]);
        if (cancelled) return;
        const memberIds = new Set(members.map(m => m.id));
        setUsers(
          allUsers
            .filter(u => u.is_active !== false && !u.deleted_at)
            .sort((a, b) => a.name.localeCompare(b.name, 'es'))
        );
        setSelectedIds(memberIds);
        setInitialIds(new Set(memberIds));
      } catch (err: any) {
        if (!cancelled) {
          setErrorMessage(getErrorMessage(err, 'Error al cargar los usuarios del proyecto'));
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    load();

    return () => {
      cancelled = true;
    };
  }, [isOpen, project]);

  const visibleUsers = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();
    return users.filter(u => {
      if (onlyAssigned && !selectedIds.has(u.id)) return false;
      if (!search) return true;
      return (
        u.name.toLowerCase().includes(search) ||
        (u.email || '').toLowerCase().includes(search) ||
        (u.area?.name || '').toLowerCase().includes(search) ||
        (u.position?.name || '').toLowerCase().includes(search)
      );
    });
  }, [users, searchTerm, onlyAssigned, selectedIds]);

  const allVisibleSelected = visibleUsers.length > 0 && visibleUsers.every(u => selectedIds.has(u.id));

  const hasChanges =
    selectedIds.size !== initialIds.size || [...selectedIds].some(id => !initialIds.has(id));

  const toggleUser = (id: number) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Marca o desmarca todos los usuarios que coinciden con la búsqueda actual
  const toggleAllVisible = () => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      visibleUsers.forEach(u => (allVisibleSelected ? next.delete(u.id) : next.add(u.id)));
      return next;
    });
  };

  const handleSave = async () => {
    if (!project) return;
    try {
      setIsSubmitting(true);
      setErrorMessage(null);
      await projectService.syncProjectUsers(project.id, [...selectedIds]);
      await onSaved?.();
      onClose();
    } catch (err: any) {
      setErrorMessage(getErrorMessage(err, 'Error al guardar los usuarios del proyecto'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Portal isOpen={isOpen} onClose={onClose}>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6 bg-slate-900/60 backdrop-blur-md animate-fade-in">
        <div
          className="bg-white rounded-[32px] w-full max-w-2xl max-h-[90vh] shadow-2xl overflow-hidden border border-slate-100 animate-scale-up flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-[#004C6C] p-6 md:p-8 text-white relative overflow-hidden flex-shrink-0">
            <div className="absolute -right-8 -bottom-8 w-36 h-36 bg-white/5 rounded-full blur-2xl" />
            <div className="flex items-center justify-between relative z-10">
              <div className="flex items-center gap-4 min-w-0">
                <div className="h-12 w-12 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-md border border-white/10 shrink-0">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-2xl font-black tracking-tight">Usuarios del Proyecto</h2>
                  <p className="text-xs font-bold text-white/60 uppercase tracking-widest mt-0.5 truncate">
                    {project?.name} — {selectedIds.size} asignado{selectedIds.size === 1 ? '' : 's'}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                aria-label="Cerrar"
                className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-xl transition-all"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-hidden flex flex-col p-6 md:p-8 gap-4">
            {errorMessage && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-red-600 text-xs font-bold animate-shake">
                {errorMessage}
              </div>
            )}

            <div className="flex items-start gap-3 p-4 bg-blue-50/60 border border-blue-100 rounded-2xl text-[11px] font-bold text-slate-500">
              <Info size={16} className="text-[#004C6C] shrink-0 mt-0.5" />
              <span>
                Solo los usuarios asignados ven la información de este proyecto. Gerencia y administración
                (permiso <span className="font-black text-[#004C6C]">proyectos.ver_todos</span>) ven todos los
                proyectos sin necesidad de asignarlos.
              </span>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar por nombre, correo, área o cargo..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-slate-50/70 border border-slate-200 rounded-2xl pl-11 pr-4 py-3 text-slate-800 font-bold focus:bg-white focus:border-[#004C6C] focus:ring-4 focus:ring-blue-900/5 transition-all outline-none text-sm placeholder:text-slate-300"
                />
              </div>
              <button
                type="button"
                onClick={() => setOnlyAssigned(v => !v)}
                className={`px-4 py-3 rounded-2xl text-xs font-black uppercase tracking-wider border transition-all ${
                  onlyAssigned
                    ? 'bg-[#004C6C] text-white border-[#004C6C]'
                    : 'bg-white text-slate-500 border-slate-200 hover:border-[#004C6C]/30'
                }`}
              >
                Solo asignados
              </button>
            </div>

            <div className="flex items-center justify-between px-1">
              <button
                type="button"
                onClick={toggleAllVisible}
                disabled={visibleUsers.length === 0}
                className="flex items-center gap-2 text-xs font-black text-[#004C6C] uppercase tracking-wider disabled:opacity-40"
              >
                {allVisibleSelected ? <CheckSquare size={16} /> : <Square size={16} />}
                {allVisibleSelected ? 'Quitar visibles' : 'Seleccionar visibles'}
              </button>
              <span className="text-[11px] font-bold text-slate-400">
                {visibleUsers.length} de {users.length} usuarios
              </span>
            </div>

            <div className="flex-1 overflow-y-auto border border-slate-100 rounded-2xl divide-y divide-slate-100 min-h-[200px]">
              {isLoading ? (
                <div className="flex items-center justify-center gap-2 py-16 text-slate-400 text-sm font-bold">
                  <Loader2 size={18} className="animate-spin" />
                  Cargando usuarios...
                </div>
              ) : visibleUsers.length === 0 ? (
                <div className="py-16 text-center text-slate-400 text-sm font-bold">
                  No se encontraron usuarios
                </div>
              ) : (
                visibleUsers.map(u => {
                  const checked = selectedIds.has(u.id);
                  return (
                    <label
                      key={u.id}
                      className={`flex items-center gap-4 px-4 py-3 cursor-pointer transition-colors ${
                        checked ? 'bg-blue-50/50' : 'hover:bg-slate-50'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleUser(u.id)}
                        className="h-4 w-4 accent-[#004C6C] shrink-0"
                      />
                      <div className="flex flex-col min-w-0">
                        <span className="text-sm font-black text-slate-700 truncate">{u.name}</span>
                        <span className="text-[11px] font-semibold text-slate-400 truncate">
                          {[u.area?.name, u.position?.name, u.email].filter(Boolean).join(' • ')}
                        </span>
                      </div>
                    </label>
                  );
                })
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-4 p-6 md:px-8 border-t border-slate-100 flex-shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3.5 text-slate-500 font-bold text-xs uppercase tracking-widest hover:bg-slate-100 rounded-2xl transition-all"
              disabled={isSubmitting}
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSubmitting || isLoading || !hasChanges}
              className="flex items-center gap-2 px-8 py-3.5 bg-[#004C6C] text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-[#003a53] shadow-lg shadow-blue-900/10 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:hover:scale-100"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Guardando...
                </>
              ) : (
                'Guardar Asignación'
              )}
            </button>
          </div>
        </div>
      </div>
    </Portal>
  );
};
