import React, { useMemo, useState } from 'react';
import { X, Send, ShoppingCart, AlertCircle, Loader2, RotateCcw } from 'lucide-react';
import { Portal } from '../../../components/ui/Portal';
import { CustomSelect } from '../../../components/ui/CustomSelect';
import type { Orden, OrdenCatalogs, OrdenPayload } from '../types';

interface OrdenFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (payload: OrdenPayload, id?: number) => Promise<Orden>;
  catalogs: OrdenCatalogs | null;
  /** Orden devuelta que se va a corregir y reenviar; null para registrar una nueva */
  orden: Orden | null;
}

interface FormState {
  description: string;
  location: string; // "<project_id>:<tower_id>" ("<project_id>:" si el proyecto no tiene torres)
  chapter: string;
  activity: string;
  comment: string;
}

const inputClass =
  'w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 text-sm font-bold text-slate-700 outline-none transition-all placeholder:text-slate-400 hover:border-slate-300 focus:bg-white focus:border-[#004C6C] focus:ring-4 focus:ring-blue-50 disabled:bg-slate-100 disabled:border-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed';
const labelClass = 'text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1';

const initialForm = (orden: Orden | null): FormState => ({
  description: orden?.description ?? '',
  location: orden ? `${orden.project_id}:${orden.tower_id ?? ''}` : '',
  chapter: orden?.chapter ?? '',
  activity: orden?.activity ?? '',
  comment: '',
});

const parseLocation = (location: string) => {
  const [projectId, towerId] = location.split(':');
  return { projectId: projectId ? Number(projectId) : null, towerId: towerId ? Number(towerId) : null };
};

// El contenido se monta en cada apertura (Portal lo desmonta al cerrar) y `key` lo reinicia si cambia la orden
export const OrdenFormModal: React.FC<OrdenFormModalProps> = ({ isOpen, ...props }) => (
  <Portal isOpen={isOpen} onClose={props.onClose}>
    <OrdenFormContent key={props.orden?.id ?? 'new'} {...props} />
  </Portal>
);

const OrdenFormContent: React.FC<Omit<OrdenFormModalProps, 'isOpen'>> = ({ onClose, onSave, catalogs, orden }) => {
  const [form, setForm] = useState<FormState>(() => initialForm(orden));
  const [submitting, setSubmitting] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const isResubmit = orden !== null;

  // Presupuestos separados por torre: una opción por cada torre de cada proyecto
  const locationOptions = useMemo(() => (catalogs?.projects ?? []).flatMap((project) =>
    project.towers.length > 0
      ? project.towers.map((tower) => ({ value: `${project.id}:${tower.id}`, label: tower.name, sublabel: project.name }))
      : [{ value: `${project.id}:`, label: 'Sin torre', sublabel: project.name }]
  ), [catalogs]);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { projectId, towerId } = parseLocation(form.location);
    if (!form.description.trim() || !projectId || !form.chapter.trim() || !form.activity.trim()) {
      setLocalError('Completa la descripción, el presupuesto, el capítulo y la actividad.');
      return;
    }

    setSubmitting(true);
    setLocalError(null);
    try {
      await onSave(
        {
          description: form.description.trim(),
          project_id: projectId,
          tower_id: towerId,
          chapter: form.chapter.trim(),
          activity: form.activity.trim(),
          comment: form.comment.trim() || null,
        },
        orden?.id
      );
      onClose();
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'Error al registrar la orden.');
    } finally {
      setSubmitting(false);
    }
  };

  const lastReturn = orden?.history?.find((h) => h.action === 'devuelto');

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-[#f8fafc] w-full max-w-3xl rounded-[40px] shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-white p-8 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 bg-blue-50 text-[#004C6C] rounded-2xl flex items-center justify-center">
              {isResubmit ? <RotateCcw size={24} /> : <ShoppingCart size={24} />}
            </div>
            <div>
              <h2 className="text-2xl font-black text-[#004C6C] tracking-tight">
                {isResubmit ? `Corregir orden ${orden.code}` : 'Registrar orden'}
              </h2>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                Aprobación: Director de Obra · Gerencia
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-3 text-slate-300 hover:bg-slate-50 rounded-2xl transition-all cursor-pointer">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6 overflow-y-auto flex-1">
          {localError && (
            <div className="p-4 bg-red-50 border border-red-100 rounded-2xl text-xs font-bold text-red-600 flex items-center gap-2 justify-center">
              <AlertCircle size={16} className="shrink-0" />
              <span className="whitespace-pre-line">{localError}</span>
            </div>
          )}

          {lastReturn?.comment && (
            <div className="p-4 bg-orange-50 border border-orange-100 rounded-2xl text-xs text-orange-700">
              <p className="font-black uppercase tracking-widest text-[10px] mb-1">
                Devuelta por {lastReturn.stage_label} · {lastReturn.user}
              </p>
              <p className="font-bold whitespace-pre-line">{lastReturn.comment}</p>
            </div>
          )}

          <div className="space-y-2">
            <label className={labelClass}>Descripción *</label>
            <textarea required disabled={submitting} rows={3} className={`${inputClass} resize-none`}
              placeholder="Qué se necesita: material o servicio, cantidad y especificación"
              value={form.description} onChange={(e) => set('description', e.target.value)} />
          </div>

          <CustomSelect
            pyClass="py-3.5"
            label="Presupuesto *"
            placeholder="Selecciona el proyecto y la torre"
            searchPlaceholder="Buscar proyecto o torre..."
            disabled={submitting}
            options={locationOptions}
            value={form.location}
            onChange={(v) => set('location', String(v))}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className={labelClass}>Capítulo *</label>
              <input required disabled={submitting} className={inputClass} list="orden-chapters" placeholder="Ej: 03 Estructura"
                value={form.chapter} onChange={(e) => set('chapter', e.target.value)} />
              {/* Sugiere los capítulos ya usados para escribirlos igual */}
              <datalist id="orden-chapters">
                {(catalogs?.chapters ?? []).map((c) => <option key={c} value={c} />)}
              </datalist>
            </div>
            <div className="space-y-2">
              <label className={labelClass}>Actividad *</label>
              <input required disabled={submitting} className={inputClass} list="orden-activities" placeholder="Ej: Columnas piso 8"
                value={form.activity} onChange={(e) => set('activity', e.target.value)} />
              <datalist id="orden-activities">
                {(catalogs?.activities ?? []).map((a) => <option key={a} value={a} />)}
              </datalist>
            </div>
          </div>

          <div className="space-y-2">
            <label className={labelClass}>{isResubmit ? 'Qué se corrigió' : 'Observaciones'}</label>
            <textarea disabled={submitting} rows={2} className={`${inputClass} resize-none`}
              placeholder={isResubmit ? 'Describe los ajustes realizados' : 'Opcional'}
              value={form.comment} onChange={(e) => set('comment', e.target.value)} />
          </div>

          <p className="text-xs font-bold text-slate-400">
            Al {isResubmit ? 'reenviar' : 'registrar'} se notificará al Director de Obra. Con su aprobación y la de Gerencia,
            Almacén cargará la orden de compra del ERP.
          </p>

          <div className="flex gap-4 pt-2">
            <button type="button" onClick={onClose} disabled={submitting}
              className="flex-1 px-6 py-4 bg-white text-slate-500 rounded-2xl font-bold hover:bg-slate-100 border border-slate-100 transition-all">
              Cancelar
            </button>
            <button type="submit" disabled={submitting}
              className="flex-1 px-6 py-4 bg-[#004C6C] hover:bg-[#003a53] text-white rounded-2xl font-bold shadow-xl transition-all flex items-center justify-center gap-2 disabled:opacity-60">
              {submitting ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
              {isResubmit ? 'Reenviar orden' : 'Registrar orden'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
