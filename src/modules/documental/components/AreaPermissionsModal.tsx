import React, { useState } from 'react';
import { Shield, X, Plus, Trash2, Check, Loader2 } from 'lucide-react';
import type { DocumentAreaPermission } from '../types/documental.types';

interface AreaPermissionsModalProps {
  isOpen: boolean;
  rules: DocumentAreaPermission[];
  areas: Array<{ id: number; name: string }>;
  currentPath: string;
  onClose: () => void;
  onSaveRule: (data: {
    area_id: number;
    folder_path: string;
    can_read: boolean;
    can_upload: boolean;
    can_create_folder: boolean;
    can_delete: boolean;
  }) => Promise<void>;
  onDeleteRule: (id: number) => Promise<void>;
}

export const AreaPermissionsModal: React.FC<AreaPermissionsModalProps> = ({
  isOpen,
  rules,
  areas,
  currentPath,
  onClose,
  onSaveRule,
  onDeleteRule,
}) => {
  const [selectedAreaId, setSelectedAreaId] = useState<number>(areas[0]?.id || 1);
  const [folderPath, setFolderPath] = useState<string>(currentPath || '*');
  const [canRead, setCanRead] = useState<boolean>(true);
  const [canUpload, setCanUpload] = useState<boolean>(false);
  const [canCreateFolder, setCanCreateFolder] = useState<boolean>(false);
  const [canDelete, setCanDelete] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAreaId) {
      setError('Debes seleccionar un área.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      await onSaveRule({
        area_id: Number(selectedAreaId),
        folder_path: folderPath.trim() || '*',
        can_read: canRead,
        can_upload: canUpload,
        can_create_folder: canCreateFolder,
        can_delete: canDelete,
      });
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Error al guardar la regla');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100 shrink-0 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-100">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Control de Permisos por Área</h3>
              <p className="text-xs text-slate-400">
                Configura los accesos y privilegios de cada área sobre las carpetas del repositorio
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
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {error && (
            <div className="p-3 text-xs font-semibold text-rose-600 bg-rose-50 border border-rose-100 rounded-xl">
              {error}
            </div>
          )}

          {/* New Rule Form */}
          <form
            onSubmit={handleSubmit}
            className="bg-slate-50/80 border border-slate-200/80 rounded-2xl p-5 space-y-4"
          >
            <div className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wider">
              <Plus className="w-4 h-4 text-[#EE9D4C]" />
              <span>Añadir o Actualizar Regla de Acceso</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">Área</label>
                <select
                  value={selectedAreaId}
                  onChange={(e) => setSelectedAreaId(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#EE9D4C]"
                >
                  {areas.map((area) => (
                    <option key={area.id} value={area.id}>
                      {area.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">
                  Ruta en Space (* para todo el repositorio)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={folderPath}
                    onChange={(e) => setFolderPath(e.target.value)}
                    placeholder="* o ej: migracion-google-drive/Comercial"
                    className="flex-1 px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#EE9D4C]"
                  />
                  {currentPath && (
                    <button
                      type="button"
                      onClick={() => setFolderPath(currentPath)}
                      className="px-3 py-2 text-[11px] font-bold text-[#004C6C] bg-white border border-slate-200 hover:bg-slate-100 rounded-xl whitespace-nowrap transition-colors"
                    >
                      Ruta Actual
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Privileges Switches */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              <label className="flex items-center gap-2 p-2.5 bg-white border border-slate-200/80 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors">
                <input
                  type="checkbox"
                  checked={canRead}
                  onChange={(e) => setCanRead(e.target.checked)}
                  className="rounded text-[#004C6C] focus:ring-[#EE9D4C]"
                />
                <span className="text-xs font-bold text-slate-700">Ver / Navegar</span>
              </label>

              <label className="flex items-center gap-2 p-2.5 bg-white border border-slate-200/80 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors">
                <input
                  type="checkbox"
                  checked={canUpload}
                  onChange={(e) => setCanUpload(e.target.checked)}
                  className="rounded text-[#004C6C] focus:ring-[#EE9D4C]"
                />
                <span className="text-xs font-bold text-slate-700">Subir Archivos</span>
              </label>

              <label className="flex items-center gap-2 p-2.5 bg-white border border-slate-200/80 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors">
                <input
                  type="checkbox"
                  checked={canCreateFolder}
                  onChange={(e) => setCanCreateFolder(e.target.checked)}
                  className="rounded text-[#004C6C] focus:ring-[#EE9D4C]"
                />
                <span className="text-xs font-bold text-slate-700">Crear Carpetas</span>
              </label>

              <label className="flex items-center gap-2 p-2.5 bg-white border border-slate-200/80 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors">
                <input
                  type="checkbox"
                  checked={canDelete}
                  onChange={(e) => setCanDelete(e.target.checked)}
                  className="rounded text-[#004C6C] focus:ring-[#EE9D4C]"
                />
                <span className="text-xs font-bold text-slate-700">Eliminar</span>
              </label>
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold text-white bg-[#004C6C] hover:bg-[#003952] disabled:opacity-50 transition-colors"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Guardando...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Guardar Regla</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Rules Table */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wider">
              Reglas Activas por Área ({rules.length})
            </h4>

            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-400 font-bold uppercase text-[10px]">
                    <th className="p-3">Área</th>
                    <th className="p-3">Ruta</th>
                    <th className="p-3 text-center">Ver</th>
                    <th className="p-3 text-center">Subir</th>
                    <th className="p-3 text-center">Carpetas</th>
                    <th className="p-3 text-center">Eliminar</th>
                    <th className="p-3 text-right">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {rules.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-4 text-center text-slate-400">
                        No hay reglas específicas configuradas. Aplican políticas por defecto del área.
                      </td>
                    </tr>
                  ) : (
                    rules.map((rule) => (
                      <tr key={rule.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="p-3 font-bold text-slate-800">
                          {rule.area?.name || `Área #${rule.area_id}`}
                        </td>
                        <td className="p-3 font-mono text-[11px] text-slate-600 max-w-[200px] truncate">
                          {rule.folder_path === '*' ? (
                            <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-bold">
                              * (Global)
                            </span>
                          ) : (
                            rule.folder_path
                          )}
                        </td>
                        <td className="p-3 text-center">
                          {rule.can_read ? (
                            <span className="text-emerald-600 font-bold">✓</span>
                          ) : (
                            <span className="text-slate-300">✕</span>
                          )}
                        </td>
                        <td className="p-3 text-center">
                          {rule.can_upload ? (
                            <span className="text-emerald-600 font-bold">✓</span>
                          ) : (
                            <span className="text-slate-300">✕</span>
                          )}
                        </td>
                        <td className="p-3 text-center">
                          {rule.can_create_folder ? (
                            <span className="text-emerald-600 font-bold">✓</span>
                          ) : (
                            <span className="text-slate-300">✕</span>
                          )}
                        </td>
                        <td className="p-3 text-center">
                          {rule.can_delete ? (
                            <span className="text-rose-600 font-bold">✓</span>
                          ) : (
                            <span className="text-slate-300">✕</span>
                          )}
                        </td>
                        <td className="p-3 text-right">
                          <button
                            onClick={() => onDeleteRule(rule.id)}
                            title="Eliminar regla"
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex justify-end shrink-0">
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
