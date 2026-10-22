import React, { useEffect, useState } from 'react';
import { Settings, X, Check, Loader2, AlertTriangle, Ban, ShieldCheck } from 'lucide-react';
import type { DocumentalSettings, DocumentalSettingsInput, ExtensionMode } from '../types/documental.types';
import { getErrorMessage } from '../../../lib/apiError';

interface DocumentalSettingsModalProps {
  isOpen: boolean;
  settings: DocumentalSettings | null;
  onClose: () => void;
  onSave: (data: DocumentalSettingsInput) => Promise<void>;
}

/** Normaliza lo que escribe el usuario: "PDF, .docx xlsx" → ['pdf', 'docx', 'xlsx'] */
const parseExtensions = (text: string): string[] =>
  Array.from(
    new Set(
      text
        .split(/[\s,;]+/)
        .map((e) => e.trim().replace(/^\.+/, '').toLowerCase())
        .filter((e) => /^[a-z0-9]{1,15}$/.test(e))
    )
  );

interface ExtensionEditorProps {
  label: string;
  hint: string;
  extensions: string[];
  tone: 'rose' | 'emerald';
  onChange: (extensions: string[]) => void;
}

const ExtensionEditor: React.FC<ExtensionEditorProps> = ({ label, hint, extensions, tone, onChange }) => {
  const [input, setInput] = useState('');

  const add = () => {
    const parsed = parseExtensions(input);
    if (parsed.length === 0) return;
    onChange(Array.from(new Set([...extensions, ...parsed])).sort());
    setInput('');
  };

  const chip =
    tone === 'rose'
      ? 'bg-rose-50 text-rose-700 border-rose-100'
      : 'bg-emerald-50 text-emerald-700 border-emerald-100';

  return (
    <div className="space-y-2">
      <label className="block text-xs font-bold text-slate-600">{label}</label>
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ',') {
              e.preventDefault();
              add();
            }
          }}
          placeholder="ej: exe, bat, .zip"
          className="flex-1 px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#EE9D4C]"
        />
        <button
          type="button"
          onClick={add}
          className="px-4 py-2 text-xs font-bold text-[#004C6C] bg-white border border-slate-200 hover:bg-slate-100 rounded-xl transition-colors"
        >
          Agregar
        </button>
      </div>
      <p className="text-[11px] text-slate-400">{hint}</p>
      <div className="flex flex-wrap gap-1.5 min-h-[28px]">
        {extensions.length === 0 ? (
          <span className="text-[11px] text-slate-400 italic">Ninguna extensión configurada.</span>
        ) : (
          extensions.map((ext) => (
            <span
              key={ext}
              className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full border ${chip}`}
            >
              .{ext}
              <button
                type="button"
                onClick={() => onChange(extensions.filter((e) => e !== ext))}
                className="opacity-60 hover:opacity-100"
                aria-label={`Quitar .${ext}`}
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))
        )}
      </div>
    </div>
  );
};

export const DocumentalSettingsModal: React.FC<DocumentalSettingsModalProps> = ({
  isOpen,
  settings,
  onClose,
  onSave,
}) => {
  const [maxUploadMb, setMaxUploadMb] = useState<string>('100');
  const [mode, setMode] = useState<ExtensionMode>('blocklist');
  const [blocked, setBlocked] = useState<string[]>([]);
  const [allowed, setAllowed] = useState<string[]>([]);
  const [maxFolderFiles, setMaxFolderFiles] = useState<string>('1000');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !settings) return;
    setMaxUploadMb(String(settings.max_upload_mb));
    setMode(settings.extension_mode);
    setBlocked(settings.blocked_extensions);
    setAllowed(settings.allowed_extensions);
    setMaxFolderFiles(String(settings.max_folder_operation_files));
    setError(null);
  }, [isOpen, settings]);

  if (!isOpen) return null;

  const maxValue = Number(maxUploadMb);
  const serverMax = settings?.server_max_upload_mb ?? 0;
  const exceedsServer = serverMax > 0 && maxValue > serverMax;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!Number.isInteger(maxValue) || maxValue < 1) {
      setError('El tamaño máximo debe ser un número entero mayor a 0.');
      return;
    }
    const folderFilesValue = Number(maxFolderFiles);
    if (!Number.isInteger(folderFilesValue) || folderFilesValue < 1 || folderFilesValue > 20000) {
      setError('El límite de archivos por operación de carpeta debe estar entre 1 y 20000.');
      return;
    }
    if (mode === 'allowlist' && allowed.length === 0) {
      setError('En modo "solo permitidas" debes agregar al menos una extensión.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      await onSave({
        max_upload_mb: maxValue,
        extension_mode: mode,
        blocked_extensions: blocked,
        allowed_extensions: allowed,
        max_folder_operation_files: folderFilesValue,
      });
      onClose();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } }; message?: string };
      setError(getErrorMessage(e, 'Error al guardar la configuración'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const modeOption = (value: ExtensionMode, title: string, description: string, Icon: typeof Ban) => (
    <label
      className={`flex items-start gap-3 p-3.5 border rounded-2xl cursor-pointer transition-colors ${
        mode === value ? 'border-[#004C6C] bg-sky-50/50' : 'border-slate-200 hover:bg-slate-50'
      }`}
    >
      <input
        type="radio"
        name="extension_mode"
        checked={mode === value}
        onChange={() => setMode(value)}
        className="mt-0.5 text-[#004C6C] focus:ring-[#EE9D4C]"
      />
      <div>
        <span className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
          <Icon className="w-3.5 h-3.5" /> {title}
        </span>
        <span className="block text-[11px] text-slate-500 mt-0.5">{description}</span>
      </div>
    </label>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <form
        onSubmit={handleSubmit}
        className="bg-white w-full max-w-2xl max-h-[90vh] rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col animate-in zoom-in-95 duration-200"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100 shrink-0 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-slate-100 text-slate-700 border border-slate-200">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Configuración del Repositorio</h3>
              <p className="text-xs text-slate-400">Reglas que se aplican a todas las subidas de archivos</p>
            </div>
          </div>
          <button
            type="button"
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

          {!settings ? (
            <div className="flex items-center justify-center py-10 text-slate-400">
              <Loader2 className="w-6 h-6 animate-spin text-[#004C6C]" />
            </div>
          ) : (
            <>
              {/* Tamaño máximo */}
              <section className="space-y-2">
                <label htmlFor="max_upload_mb" className="block text-xs font-bold text-slate-600">
                  Tamaño máximo por archivo
                </label>
                <div className="flex items-center gap-2 max-w-xs">
                  <input
                    id="max_upload_mb"
                    type="number"
                    min={1}
                    max={5120}
                    step={1}
                    value={maxUploadMb}
                    onChange={(e) => setMaxUploadMb(e.target.value)}
                    className="w-32 px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#EE9D4C]"
                  />
                  <span className="text-xs font-bold text-slate-500">MB</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Límite actual del servidor: <strong>{serverMax} MB</strong>. Se aplica el menor de los dos.
                </p>
                {exceedsServer && (
                  <div className="flex items-start gap-2 p-3 text-[11px] font-semibold text-amber-800 bg-amber-50 border border-amber-100 rounded-xl">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>
                      El servidor solo acepta archivos de hasta {serverMax} MB, así que ese será el límite real. Para
                      permitir {maxValue} MB, un administrador del servidor debe aumentar{' '}
                      <code className="font-mono">upload_max_filesize</code> y{' '}
                      <code className="font-mono">post_max_size</code> en PHP.
                    </span>
                  </div>
                )}
              </section>

              {/* Operaciones sobre carpetas */}
              <section className="space-y-2">
                <label htmlFor="max_folder_files" className="block text-xs font-bold text-slate-600">
                  Máximo de archivos para renombrar o eliminar una carpeta
                </label>
                <div className="flex items-center gap-2 max-w-xs">
                  <input
                    id="max_folder_files"
                    type="number"
                    min={1}
                    max={20000}
                    step={1}
                    value={maxFolderFiles}
                    onChange={(e) => setMaxFolderFiles(e.target.value)}
                    className="w-32 px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#EE9D4C]"
                  />
                  <span className="text-xs font-bold text-slate-500">archivos</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  En S3 renombrar o eliminar una carpeta se hace archivo por archivo. Por encima de este límite la
                  operación se bloquea para que no quede a medias; las carpetas grandes se deben manejar por partes.
                </p>
              </section>

              {/* Extensiones */}
              <section className="space-y-3">
                <span className="block text-xs font-bold text-slate-600">Tipos de archivo</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {modeOption(
                    'blocklist',
                    'Bloquear extensiones',
                    'Se permite cualquier archivo excepto los de la lista.',
                    Ban
                  )}
                  {modeOption(
                    'allowlist',
                    'Solo permitidas',
                    'Únicamente se aceptan las extensiones de la lista.',
                    ShieldCheck
                  )}
                </div>

                {mode === 'blocklist' ? (
                  <ExtensionEditor
                    label="Extensiones bloqueadas"
                    hint="Escribe una o varias separadas por coma y presiona Enter. Recomendado: ejecutables y scripts."
                    extensions={blocked}
                    tone="rose"
                    onChange={setBlocked}
                  />
                ) : (
                  <ExtensionEditor
                    label="Extensiones permitidas"
                    hint="Escribe una o varias separadas por coma y presiona Enter. Ej: pdf, docx, xlsx, dwg, jpg."
                    extensions={allowed}
                    tone="emerald"
                    onChange={setAllowed}
                  />
                )}
                <p className="text-[11px] text-slate-400">
                  La regla también se aplica al renombrar archivos, para evitar cambiar la extensión a una no permitida.
                  Los archivos que ya existen en el repositorio no se modifican.
                </p>
              </section>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-2 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200/60 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isSubmitting || !settings}
            className="flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold text-white bg-[#004C6C] hover:bg-[#003952] disabled:opacity-50 transition-colors"
          >
            {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
            <span>{isSubmitting ? 'Guardando...' : 'Guardar configuración'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
