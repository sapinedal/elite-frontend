import React, { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Loader2, AlertCircle, Paperclip, Save, Tags } from 'lucide-react';
import { Modal } from '../../../components/ui/Modal';
import { ModalShell, inputClass, labelClass } from '../../../components/ui/ModalShell';
import { useNotification } from '../../../context/NotificationContext';
import { cuentaCobroService, getApiErrorMessage } from '../services/cuentaCobroService';
import type { CuentaCobroTipo } from '../types';

interface TiposPanelProps {
  /** Los tipos cambiaron: recargar los catálogos del formulario */
  onChanged: () => void;
}

type Draft = { name: string; description: string; requires_attachment: boolean; attachment_hint: string; is_active: boolean };

const emptyDraft: Draft = { name: '', description: '', requires_attachment: false, attachment_hint: '', is_active: true };

/**
 * CRUD de tipos de cuenta de cobro: nombre, si exige adjunto (y qué adjuntar) y si está activo.
 * Un tipo con cuentas registradas no se elimina: se desactiva.
 */
export const TiposPanel: React.FC<TiposPanelProps> = ({ onChanged }) => {
  const { showNotification } = useNotification();
  const [tipos, setTipos] = useState<CuentaCobroTipo[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<CuentaCobroTipo | 'new' | null>(null);
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<CuentaCobroTipo | null>(null);

  const load = () => cuentaCobroService.getTipos()
    .then(setTipos)
    .catch((err) => setError(getApiErrorMessage(err, 'Error al cargar los tipos.')));

  useEffect(() => {
    load();
  }, []);

  const open = (tipo: CuentaCobroTipo | 'new') => {
    setEditing(tipo);
    setError(null);
    setDraft(tipo === 'new' ? emptyDraft : {
      name: tipo.name,
      description: tipo.description ?? '',
      requires_attachment: tipo.requires_attachment,
      attachment_hint: tipo.attachment_hint ?? '',
      is_active: tipo.is_active ?? true,
    });
  };

  const save = async () => {
    if (!draft.name.trim()) return setError('Indica el nombre del tipo.');
    setSaving(true);
    setError(null);
    try {
      await cuentaCobroService.saveTipo({
        name: draft.name.trim(),
        description: draft.description.trim() || null,
        requires_attachment: draft.requires_attachment,
        attachment_hint: draft.requires_attachment ? draft.attachment_hint.trim() || null : null,
        is_active: draft.is_active,
      }, editing !== 'new' && editing ? editing.id : undefined);
      showNotification(editing === 'new' ? 'Tipo creado.' : 'Tipo actualizado.', 'success');
      setEditing(null);
      await load();
      onChanged();
    } catch (err) {
      setError(getApiErrorMessage(err, 'Error al guardar el tipo.'));
    } finally {
      setSaving(false);
    }
  };

  const remove = async (tipo: CuentaCobroTipo) => {
    try {
      showNotification(await cuentaCobroService.deleteTipo(tipo.id), 'success');
      await load();
      onChanged();
    } catch (err) {
      showNotification(getApiErrorMessage(err, 'Error al eliminar el tipo.'), 'error');
    }
  };

  return (
    <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm p-5 md:p-6 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-black text-[#004C6C] tracking-tight">Tipos de cuenta de cobro</h3>
          <p className="text-xs font-bold text-slate-400">Define cuáles exigen adjunto al radicar (ej. SST, Gestión ambiental).</p>
        </div>
        <button onClick={() => open('new')} className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-[#EE9D4C] hover:bg-[#e08a35] text-white text-sm font-bold">
          <Plus size={16} /> Nuevo tipo
        </button>
      </div>

      {error && !editing && (
        <div className="p-3 bg-red-50 border border-red-100 rounded-2xl text-xs font-bold text-red-600 flex items-center gap-2"><AlertCircle size={16} /> {error}</div>
      )}

      {!tipos ? (
        <div className="flex justify-center py-10"><Loader2 className="animate-spin text-slate-300" /></div>
      ) : (
        <ul className="divide-y divide-slate-50">
          {tipos.map((tipo) => (
            <li key={tipo.id} className="py-3 flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="flex flex-wrap items-center gap-2 font-black text-slate-700">
                  {tipo.name}
                  {tipo.requires_attachment && (
                    <span className="flex items-center gap-1 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-blue-50 text-[#004C6C]">
                      <Paperclip size={11} /> Requiere adjunto
                    </span>
                  )}
                  {!tipo.is_active && <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-100 text-slate-500">Inactivo</span>}
                </p>
                <p className="text-[11px] font-bold text-slate-400">
                  {[tipo.attachment_hint, tipo.description, `${tipo.cuentas_count ?? 0} cuenta(s)`].filter(Boolean).join(' · ')}
                </p>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => open(tipo)} className="p-2 rounded-xl text-slate-500 hover:bg-slate-100" title="Editar"><Pencil size={15} /></button>
                <button onClick={() => setDeleting(tipo)} className="p-2 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50" title="Eliminar"><Trash2 size={15} /></button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <ModalShell
        isOpen={editing !== null}
        onClose={() => !saving && setEditing(null)}
        icon={<Tags size={22} />}
        title={editing === 'new' ? 'Nuevo tipo de cuenta de cobro' : 'Editar tipo'}
        maxWidth="max-w-xl"
        footer={
          <button type="button" onClick={save} disabled={saving}
            className="w-full px-6 py-3.5 bg-[#004C6C] hover:bg-[#003a53] text-white rounded-2xl font-bold flex items-center justify-center gap-2 disabled:opacity-60">
            {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />} Guardar
          </button>
        }
      >
        {error && (
          <div className="p-3 bg-red-50 border border-red-100 rounded-2xl text-xs font-bold text-red-600 flex items-center gap-2"><AlertCircle size={16} /> {error}</div>
        )}
        <div className="space-y-2">
          <label className={labelClass}>Nombre *</label>
          <input disabled={saving} className={inputClass} placeholder="Ej: SST" value={draft.name}
            onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))} />
        </div>
        <div className="space-y-2">
          <label className={labelClass}>Descripción</label>
          <input disabled={saving} className={inputClass} placeholder="Opcional" value={draft.description}
            onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))} />
        </div>
        <label className="flex items-center gap-3 bg-white rounded-2xl border border-slate-100 p-4 cursor-pointer">
          <input type="checkbox" className="h-4 w-4 accent-[#004C6C]" disabled={saving} checked={draft.requires_attachment}
            onChange={(e) => setDraft((d) => ({ ...d, requires_attachment: e.target.checked }))} />
          <span className="text-sm font-bold text-slate-700">Requiere adjunto al radicar</span>
        </label>
        {draft.requires_attachment && (
          <div className="space-y-2">
            <label className={labelClass}>¿Qué se debe adjuntar?</label>
            <input disabled={saving} className={inputClass} placeholder="Ej: Informe SST y planilla de seguridad social" value={draft.attachment_hint}
              onChange={(e) => setDraft((d) => ({ ...d, attachment_hint: e.target.value }))} />
          </div>
        )}
        {editing !== 'new' && (
          <label className="flex items-center gap-3 bg-white rounded-2xl border border-slate-100 p-4 cursor-pointer">
            <input type="checkbox" className="h-4 w-4 accent-[#004C6C]" disabled={saving} checked={draft.is_active}
              onChange={(e) => setDraft((d) => ({ ...d, is_active: e.target.checked }))} />
            <span className="text-sm font-bold text-slate-700">Activo (disponible al radicar)</span>
          </label>
        )}
      </ModalShell>

      <Modal
        isOpen={deleting !== null}
        onClose={() => setDeleting(null)}
        onConfirm={() => deleting && remove(deleting)}
        type="danger"
        title={`Eliminar ${deleting?.name ?? ''}`}
        message={(deleting?.cuentas_count ?? 0) > 0
          ? 'Este tipo tiene cuentas de cobro registradas: se desactivará para que no se use en nuevas cuentas.'
          : 'Se eliminará el tipo de cuenta de cobro.'}
        confirmText={(deleting?.cuentas_count ?? 0) > 0 ? 'Desactivar' : 'Eliminar'}
      />
    </div>
  );
};
