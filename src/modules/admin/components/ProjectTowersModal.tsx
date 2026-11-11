import React, { useEffect, useState } from 'react';
import { X, Building2, Plus, Edit2, Trash2, Loader2, Info, Save } from 'lucide-react';
import { Portal } from '../../../components/ui/Portal';
import { projectService } from '../services/projectService';
import type { Project, ProjectTower, SaveTowerDTO } from '../types';
import { getErrorMessage } from '../../../lib/apiError';

interface ProjectTowersModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project | null;
  canEdit: boolean;
}

interface TowerForm {
  name: string;
  code: string;
  floors: string;
  apartments_per_floor: string;
}

const EMPTY_FORM: TowerForm = { name: '', code: '', floors: '', apartments_per_floor: '' };

/** Número del apartamento: piso × 100 + consecutivo (piso 12 → 1201). */
const unitNumber = (floor: number, index: number) => floor * 100 + index;

/**
 * Torres y etapas del proyecto con su distribución de pisos y apartamentos.
 * FTRA usa esta distribución para las listas de piso y apartamento y para la semaforización.
 * Las etapas sin apartamentos (ej. Urbanismo) se dejan sin pisos.
 */
export const ProjectTowersModal: React.FC<ProjectTowersModalProps> = ({ isOpen, onClose, project, canEdit }) => {
  const [towers, setTowers] = useState<ProjectTower[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<number | 'new' | null>(null);
  const [form, setForm] = useState<TowerForm>(EMPTY_FORM);

  const load = async (projectId: number) => {
    setIsLoading(true);
    try {
      setTowers(await projectService.getTowers(projectId));
    } catch (err) {
      setError(getErrorMessage(err, 'Error al cargar las torres del proyecto'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!isOpen || !project) return;
    setError(null);
    setEditingId(null);
    setForm(EMPTY_FORM);
    load(project.id);
  }, [isOpen, project?.id]);

  const startNew = () => {
    setEditingId('new');
    setForm({ ...EMPTY_FORM });
    setError(null);
  };

  const startEdit = (tower: ProjectTower) => {
    setEditingId(tower.id);
    setForm({
      name: tower.name,
      code: tower.code ?? '',
      floors: tower.floors ? String(tower.floors) : '',
      apartments_per_floor: tower.apartments_per_floor ? String(tower.apartments_per_floor) : '',
    });
    setError(null);
  };

  const floors = Number(form.floors) || 0;
  const perFloor = Number(form.apartments_per_floor) || 0;
  const hasLayout = floors > 0 && perFloor > 0;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!project) return;
    if (!form.name.trim()) {
      setError('El nombre de la torre es obligatorio.');
      return;
    }
    if ((floors > 0) !== (perFloor > 0)) {
      setError('Indica los pisos y los apartamentos por piso, o deja ambos vacíos si la etapa no tiene apartamentos.');
      return;
    }
    if (perFloor > 99) {
      setError('Máximo 99 apartamentos por piso (la numeración es piso × 100 + consecutivo).');
      return;
    }

    const payload: SaveTowerDTO = {
      name: form.name.trim(),
      code: form.code.trim() || null,
      floors: hasLayout ? floors : null,
      apartments_per_floor: hasLayout ? perFloor : null,
    };

    try {
      setIsSaving(true);
      setError(null);
      if (editingId === 'new') {
        await projectService.createTower(project.id, payload);
      } else if (editingId) {
        await projectService.updateTower(editingId, payload);
      }
      setEditingId(null);
      await load(project.id);
    } catch (err) {
      setError(getErrorMessage(err, 'Error al guardar la torre'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (tower: ProjectTower) => {
    if (!project) return;
    if (!window.confirm(`¿Eliminar ${tower.name}? Los contratos y FTRA que la usan quedarán sin torre asignada.`)) return;
    try {
      await projectService.deleteTower(tower.id);
      await load(project.id);
    } catch (err) {
      setError(getErrorMessage(err, 'Error al eliminar la torre'));
    }
  };

  const inputClass = 'w-full bg-slate-50/70 border border-slate-200 rounded-2xl px-4 py-3 text-slate-800 font-bold focus:bg-white focus:border-[#004C6C] focus:ring-4 focus:ring-blue-900/5 transition-all outline-none text-sm placeholder:text-slate-300';
  const labelClass = 'text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1';

  return (
    <Portal isOpen={isOpen} onClose={onClose}>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-6 bg-slate-900/60 backdrop-blur-md animate-fade-in">
        <div
          className="bg-white rounded-t-[28px] sm:rounded-[32px] w-full max-w-2xl max-h-[92vh] shadow-2xl overflow-hidden border border-slate-100 animate-scale-up flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-[#004C6C] p-5 md:p-8 text-white relative overflow-hidden flex-shrink-0">
            <div className="absolute -right-8 -bottom-8 w-36 h-36 bg-white/5 rounded-full blur-2xl" />
            <div className="flex items-center justify-between relative z-10 gap-3">
              <div className="flex items-center gap-3 md:gap-4 min-w-0">
                <div className="h-11 w-11 md:h-12 md:w-12 bg-white/10 rounded-2xl flex items-center justify-center border border-white/10 shrink-0">
                  <Building2 className="w-6 h-6 text-white" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-xl md:text-2xl font-black tracking-tight">Torres y Apartamentos</h2>
                  <p className="text-[10px] md:text-xs font-bold text-white/60 uppercase tracking-widest mt-0.5 truncate">{project?.name}</p>
                </div>
              </div>
              <button onClick={onClose} aria-label="Cerrar" className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-xl transition-all shrink-0">
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 space-y-4">
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-red-600 text-xs font-bold">{error}</div>
            )}

            <div className="flex items-start gap-3 p-4 bg-blue-50/60 border border-blue-100 rounded-2xl text-[11px] font-bold text-slate-500">
              <Info size={16} className="text-[#004C6C] shrink-0 mt-0.5" />
              <span>
                FTRA usa esta distribución para listar pisos y apartamentos. Los apartamentos se numeran
                piso × 100 + consecutivo: con 20 pisos y 10 por piso quedan del 101 al 2010 (200 apartamentos).
                Las etapas sin apartamentos, como Urbanismo, se dejan sin pisos.
              </span>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center gap-2 py-10 text-xs font-bold text-slate-400">
                <Loader2 size={16} className="animate-spin" /> Cargando torres...
              </div>
            ) : (
              <div className="space-y-2">
                {towers.length === 0 && editingId !== 'new' && (
                  <p className="text-center text-xs font-bold text-slate-400 py-6">El proyecto no tiene torres registradas.</p>
                )}
                {towers.map(tower => (
                  editingId === tower.id ? null : (
                    <div key={tower.id} className="flex items-center justify-between gap-3 p-4 bg-white border border-slate-100 rounded-2xl">
                      <div className="min-w-0">
                        <p className="text-sm font-black text-slate-800 truncate">
                          {tower.name}
                          {tower.code && <span className="ml-2 px-2 py-0.5 bg-slate-100 text-slate-500 rounded-md text-[10px] font-black uppercase">{tower.code}</span>}
                        </p>
                        <p className="text-[11px] font-bold text-slate-400 mt-0.5">
                          {tower.floors && tower.apartments_per_floor
                            ? `${tower.floors} pisos × ${tower.apartments_per_floor} aptos = ${tower.floors * tower.apartments_per_floor} apartamentos`
                            : 'Sin apartamentos (no aparece en FTRA)'}
                        </p>
                      </div>
                      {canEdit && (
                        <div className="flex items-center gap-1 shrink-0">
                          <button onClick={() => startEdit(tower)} title="Editar" className="p-2.5 text-slate-400 hover:text-[#EE9D4C] hover:bg-orange-50 rounded-xl transition-all">
                            <Edit2 size={16} />
                          </button>
                          <button onClick={() => handleDelete(tower)} title="Eliminar" className="p-2.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      )}
                    </div>
                  )
                ))}
              </div>
            )}

            {canEdit && editingId !== null && (
              <form onSubmit={handleSave} className="p-4 sm:p-5 bg-slate-50 border border-slate-100 rounded-2xl space-y-4 animate-fade-in">
                <p className="text-xs font-black text-[#004C6C] uppercase tracking-widest">
                  {editingId === 'new' ? 'Nueva torre' : 'Editar torre'}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-[1fr_120px] gap-3">
                  <div className="space-y-1.5">
                    <label className={labelClass}>Nombre *</label>
                    <input className={inputClass} placeholder="Ej: TORRE 2" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                  </div>
                  <div className="space-y-1.5">
                    <label className={labelClass}>Código</label>
                    <input className={inputClass} placeholder="T2" value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value }))} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className={labelClass}>Pisos</label>
                    <input className={inputClass} type="number" inputMode="numeric" min={1} max={200} placeholder="20" value={form.floors} onChange={e => setForm(f => ({ ...f, floors: e.target.value }))} />
                  </div>
                  <div className="space-y-1.5">
                    <label className={labelClass}>Aptos por piso</label>
                    <input className={inputClass} type="number" inputMode="numeric" min={1} max={99} placeholder="10" value={form.apartments_per_floor} onChange={e => setForm(f => ({ ...f, apartments_per_floor: e.target.value }))} />
                  </div>
                </div>
                {hasLayout && perFloor <= 99 && (
                  <p className="text-[11px] font-bold text-slate-500">
                    {floors * perFloor} apartamentos: del {unitNumber(1, 1)} al {unitNumber(floors, perFloor)} (piso 1: {unitNumber(1, 1)}–{unitNumber(1, perFloor)}).
                  </p>
                )}
                <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
                  <button type="button" onClick={() => setEditingId(null)} className="w-full sm:w-auto px-5 py-3 bg-white border border-slate-200 text-slate-500 rounded-2xl font-bold text-xs uppercase tracking-wider">
                    Cancelar
                  </button>
                  <button type="submit" disabled={isSaving} className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-[#004C6C] text-white rounded-2xl font-black text-xs uppercase tracking-wider disabled:opacity-50">
                    {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                    Guardar
                  </button>
                </div>
              </form>
            )}
          </div>

          {canEdit && editingId === null && (
            <div className="p-4 sm:p-6 border-t border-slate-100 flex-shrink-0">
              <button onClick={startNew} className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-[#004C6C] text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-[#003a53] transition-all">
                <Plus size={16} />
                Nueva torre
              </button>
            </div>
          )}
        </div>
      </div>
    </Portal>
  );
};
