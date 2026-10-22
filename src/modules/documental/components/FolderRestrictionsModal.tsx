import React, { useEffect, useState } from 'react';
import {
  Shield,
  X,
  Lock,
  Unlock,
  Edit2,
  ArrowRight,
  ArrowLeft,
  Check,
  Loader2,
  FolderLock,
  Info,
} from 'lucide-react';
import type { FolderRoleRule, RestrictedFolder, RoleOption } from '../types/documental.types';
import { getErrorMessage } from '../../../lib/apiError';

interface FolderRestrictionsModalProps {
  isOpen: boolean;
  /** Si se indica, el modal abre directamente el editor de esa carpeta */
  initialFolderPath: string | null;
  currentPath: string;
  restrictedFolders: RestrictedFolder[];
  roles: RoleOption[];
  onClose: () => void;
  onSave: (folderPath: string, rules: FolderRoleRule[]) => Promise<void>;
  onNavigate: (path: string) => void;
}

type Flag = 'can_read' | 'can_upload' | 'can_create_folder' | 'can_delete';

const FLAGS: Array<{ key: Flag; label: string; hint: string }> = [
  { key: 'can_read', label: 'Acceso', hint: 'Ver la carpeta, navegarla y descargar' },
  { key: 'can_upload', label: 'Subir / Renombrar', hint: 'Subir archivos y renombrar elementos' },
  { key: 'can_create_folder', label: 'Crear carpetas', hint: 'Crear subcarpetas' },
  { key: 'can_delete', label: 'Eliminar', hint: 'Eliminar archivos y subcarpetas' },
];

const emptyRule = (roleId: number): FolderRoleRule => ({
  role_id: roleId,
  can_read: false,
  can_upload: false,
  can_create_folder: false,
  can_delete: false,
});

export const FolderRestrictionsModal: React.FC<FolderRestrictionsModalProps> = ({
  isOpen,
  initialFolderPath,
  currentPath,
  restrictedFolders,
  roles,
  onClose,
  onSave,
  onNavigate,
}) => {
  const [editingPath, setEditingPath] = useState<string | null>(null);
  const [matrix, setMatrix] = useState<Record<number, FolderRoleRule>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmRemovePath, setConfirmRemovePath] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const openEditor = (path: string) => {
    const existing = restrictedFolders.find((f) => f.folder_path === path);
    const next: Record<number, FolderRoleRule> = {};
    roles.forEach((role) => {
      const rule = existing?.rules.find((r) => r.role_id === role.id);
      next[role.id] = rule ? { ...rule } : emptyRule(role.id);
    });
    setMatrix(next);
    setEditingPath(path);
    setError(null);
  };

  useEffect(() => {
    if (!isOpen) return;
    setConfirmRemovePath(null);
    setError(null);
    if (initialFolderPath) {
      openEditor(initialFolderPath);
    } else {
      setEditingPath(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, initialFolderPath, roles.length]);

  if (!isOpen) return null;

  const toggle = (roleId: number, flag: Flag) => {
    setMatrix((prev) => {
      const rule = { ...prev[roleId], [flag]: !prev[roleId][flag] };
      // Sin acceso no tiene sentido ningún otro permiso; con cualquier permiso se requiere acceso
      if (flag === 'can_read' && !rule.can_read) {
        rule.can_upload = false;
        rule.can_create_folder = false;
        rule.can_delete = false;
      }
      if (flag !== 'can_read' && rule[flag]) {
        rule.can_read = true;
      }
      return { ...prev, [roleId]: rule };
    });
  };

  const save = async (path: string, rules: FolderRoleRule[]) => {
    try {
      setIsSubmitting(true);
      setError(null);
      await onSave(path, rules);
      setEditingPath(null);
      setConfirmRemovePath(null);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } }; message?: string };
      setError(getErrorMessage(e, 'Error al guardar la restricción'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedRules = Object.values(matrix).filter((r) => r.can_read);
  const isAlreadyRestricted = (path: string) => restrictedFolders.some((f) => f.folder_path === path);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100 shrink-0 bg-slate-50/50">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2.5 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-100 shrink-0">
              <Shield className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-base font-bold text-slate-900">
                {editingPath ? 'Restringir acceso a carpeta' : 'Carpetas Restringidas'}
              </h3>
              <p className="text-xs text-slate-400 truncate" title={editingPath ?? undefined}>
                {editingPath
                  ? editingPath
                  : 'Una carpeta restringida solo es visible para los roles con acceso, incluidas sus subcarpetas.'}
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

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {error && (
            <div className="p-3 text-xs font-semibold text-rose-600 bg-rose-50 border border-rose-100 rounded-xl">
              {error}
            </div>
          )}

          {editingPath ? (
            /* Editor de una carpeta */
            <>
              <div className="p-3 px-4 bg-sky-50 border border-sky-100 rounded-2xl flex items-start gap-3 text-xs text-sky-800 font-medium">
                <Info className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
                <span>
                  Marca los roles que pueden entrar a esta carpeta. Los demás roles no la verán. Cada acción
                  además requiere que el rol tenga el permiso correspondiente en <strong>Roles</strong>. Quienes
                  tienen <strong>documental.administrar</strong> siempre tienen acceso.
                </span>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl overflow-x-auto shadow-sm">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-400 font-bold uppercase text-[10px]">
                      <th className="p-3">Rol</th>
                      {FLAGS.map((f) => (
                        <th key={f.key} className="p-3 text-center" title={f.hint}>
                          {f.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {roles.map((role) => {
                      const rule = matrix[role.id] ?? emptyRule(role.id);
                      return (
                        <tr
                          key={role.id}
                          className={`transition-colors ${rule.can_read ? 'bg-emerald-50/40' : 'hover:bg-slate-50/70'}`}
                        >
                          <td className="p-3 font-bold text-slate-800 capitalize">{role.name.replace(/_/g, ' ')}</td>
                          {FLAGS.map((f) => (
                            <td key={f.key} className="p-3 text-center">
                              <input
                                type="checkbox"
                                checked={rule[f.key]}
                                onChange={() => toggle(role.id, f.key)}
                                className="w-4 h-4 rounded text-[#004C6C] focus:ring-[#EE9D4C] cursor-pointer"
                                aria-label={`${f.label} para ${role.name}`}
                              />
                            </td>
                          ))}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {selectedRules.length === 0 && (
                <p className="text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-100 rounded-xl p-3">
                  {isAlreadyRestricted(editingPath)
                    ? 'Sin roles seleccionados, al guardar se quitará la restricción y la carpeta será visible para todos.'
                    : 'Selecciona al menos un rol con acceso para restringir la carpeta.'}
                </p>
              )}
            </>
          ) : (
            /* Vista general */
            <>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                  {restrictedFolders.length} carpeta(s) restringida(s)
                </h4>
                {currentPath && (
                  <button
                    type="button"
                    onClick={() => openEditor(currentPath)}
                    className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#004C6C] hover:bg-[#003952] transition-colors"
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span>{isAlreadyRestricted(currentPath) ? 'Editar carpeta actual' : 'Restringir carpeta actual'}</span>
                  </button>
                )}
              </div>

              {restrictedFolders.length === 0 ? (
                <div className="text-center py-10 border border-dashed border-slate-200 rounded-2xl">
                  <FolderLock className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs text-slate-500 font-semibold">No hay carpetas restringidas.</p>
                  <p className="text-[11px] text-slate-400 mt-1 max-w-sm mx-auto">
                    Cada rol accede a todo el repositorio según sus permisos. Para restringir una carpeta usa la
                    opción "Restringir acceso" en su menú.
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {restrictedFolders.map((folder) => (
                    <div
                      key={folder.folder_path}
                      className="border border-slate-200 rounded-2xl p-4 flex flex-col md:flex-row md:items-center gap-3"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 min-w-0">
                          <Lock className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                          <span className="font-mono text-[11px] font-semibold text-slate-700 truncate" title={folder.folder_path}>
                            {folder.folder_path}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {folder.rules.map((rule) => (
                            <span
                              key={rule.role_id}
                              className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100 capitalize"
                              title={[
                                'Acceso',
                                rule.can_upload && 'Subir',
                                rule.can_create_folder && 'Crear carpetas',
                                rule.can_delete && 'Eliminar',
                              ].filter(Boolean).join(' · ')}
                            >
                              {(rule.role_name ?? `Rol #${rule.role_id}`).replace(/_/g, ' ')}
                            </span>
                          ))}
                        </div>
                      </div>

                      {confirmRemovePath === folder.folder_path ? (
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-[11px] font-semibold text-slate-500">¿Quitar restricción?</span>
                          <button
                            type="button"
                            disabled={isSubmitting}
                            onClick={() => save(folder.folder_path, [])}
                            className="px-3 py-1.5 rounded-lg text-[11px] font-bold text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-50"
                          >
                            Sí, quitar
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmRemovePath(null)}
                            className="px-3 py-1.5 rounded-lg text-[11px] font-bold text-slate-600 hover:bg-slate-100"
                          >
                            No
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => openEditor(folder.folder_path)}
                            title="Editar roles con acceso"
                            className="p-2 text-slate-400 hover:text-[#004C6C] hover:bg-slate-100 rounded-lg transition-colors"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              onNavigate(folder.folder_path);
                              onClose();
                            }}
                            title="Ir a la carpeta"
                            className="p-2 text-slate-400 hover:text-[#004C6C] hover:bg-slate-100 rounded-lg transition-colors"
                          >
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmRemovePath(folder.folder_path)}
                            title="Quitar restricción"
                            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          >
                            <Unlock className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between gap-2 shrink-0">
          {editingPath ? (
            <>
              <button
                type="button"
                onClick={() => (initialFolderPath ? onClose() : setEditingPath(null))}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200/60 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>{initialFolderPath ? 'Cancelar' : 'Volver'}</span>
              </button>
              <button
                type="button"
                disabled={isSubmitting || (selectedRules.length === 0 && !isAlreadyRestricted(editingPath))}
                onClick={() => save(editingPath, selectedRules)}
                className="flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold text-white bg-[#004C6C] hover:bg-[#003952] disabled:opacity-50 transition-colors"
              >
                {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                <span>{isSubmitting ? 'Guardando...' : 'Guardar restricción'}</span>
              </button>
            </>
          ) : (
            <button
              onClick={onClose}
              className="ml-auto px-5 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200/60 transition-colors"
            >
              Cerrar
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
