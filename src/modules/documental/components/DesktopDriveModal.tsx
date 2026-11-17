import React, { useCallback, useEffect, useState } from 'react';
import { AlertTriangle, Check, Copy, HardDrive, KeyRound, Laptop, Loader2, Trash2, X } from 'lucide-react';
import { Portal } from '../../../components/ui/Portal';
import { useEscapeToClose } from '../../../hooks/useEscapeToClose';
import { getErrorMessage } from '../../../lib/apiError';
import { documentalService } from '../services/documentalService';
import type { DesktopKey, DesktopKeysResponse } from '../types/documental.types';

interface DesktopDriveModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type Platform = 'windows' | 'mac' | 'raidrive';

const PLATFORMS: { id: Platform; label: string }[] = [
  { id: 'windows', label: 'Windows' },
  { id: 'mac', label: 'Mac' },
  { id: 'raidrive', label: 'Como disco (RaiDrive)' },
];

const formatDate = (value: string | null) =>
  value ? new Date(value).toLocaleString('es-CO', { dateStyle: 'medium', timeStyle: 'short' }) : 'Nunca';

/** Botón que copia un texto y confirma con un check */
const CopyButton: React.FC<{ value: string; label: string }> = ({ value, label }) => {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Sin permiso de portapapeles: el usuario puede seleccionar el texto a mano
    }
  };

  return (
    <button
      type="button"
      onClick={copy}
      title={`Copiar ${label}`}
      className={`shrink-0 h-9 w-9 rounded-xl flex items-center justify-center transition-colors ${copied ? 'bg-emerald-50 text-emerald-600' : 'bg-white text-slate-400 hover:text-[#004C6C] border border-slate-200'}`}
    >
      {copied ? <Check size={16} /> : <Copy size={16} />}
    </button>
  );
};

const Field: React.FC<{ label: string; value: string; mono?: boolean; highlight?: boolean }> = ({ label, value, mono, highlight }) => (
  <div>
    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">{label}</p>
    <div className={`flex items-center gap-2 rounded-2xl border p-1.5 pl-4 ${highlight ? 'bg-orange-50 border-orange-200' : 'bg-slate-50 border-slate-100'}`}>
      <span className={`flex-1 min-w-0 break-all text-sm font-bold text-slate-700 select-all ${mono ? 'font-mono tracking-wider' : ''}`}>{value}</span>
      <CopyButton value={value} label={label.toLowerCase()} />
    </div>
  </div>
);

const Step: React.FC<{ n: number; children: React.ReactNode }> = ({ n, children }) => (
  <li className="flex gap-3">
    <span className="shrink-0 h-6 w-6 rounded-full bg-[#004C6C] text-white text-[11px] font-black flex items-center justify-center">{n}</span>
    <span className="text-sm text-slate-600 leading-6">{children}</span>
  </li>
);

/**
 * Conectar Gestión Documental como unidad de red (WebDAV) en el Explorador de Windows o el Finder de macOS.
 * Cada usuario crea sus propias claves de escritorio (una por equipo) y las puede revocar.
 */
export const DesktopDriveModal: React.FC<DesktopDriveModalProps> = ({ isOpen, onClose }) => {
  useEscapeToClose(isOpen, onClose);

  const [data, setData] = useState<DesktopKeysResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deviceName, setDeviceName] = useState('');
  const [creating, setCreating] = useState(false);
  const [newKey, setNewKey] = useState<DesktopKey | null>(null);
  const [revokingId, setRevokingId] = useState<number | null>(null);
  const [platform, setPlatform] = useState<Platform>(() =>
    typeof navigator !== 'undefined' && /Mac/i.test(navigator.userAgent) ? 'mac' : 'windows'
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await documentalService.getDesktopKeys());
    } catch (err) {
      setError(getErrorMessage(err, 'No se pudo cargar la información de conexión.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      setNewKey(null);
      setDeviceName('');
      load();
    }
  }, [isOpen, load]);

  if (!isOpen) return null;

  const createKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deviceName.trim()) {
      setError('Escribe un nombre para reconocer este equipo, por ejemplo "Portátil oficina".');
      return;
    }
    setCreating(true);
    setError(null);
    try {
      const created = await documentalService.createDesktopKey(deviceName.trim());
      setNewKey(created);
      setDeviceName('');
      await load();
    } catch (err) {
      setError(getErrorMessage(err, 'No se pudo crear la clave.'));
    } finally {
      setCreating(false);
    }
  };

  const revoke = async (key: DesktopKey) => {
    if (!window.confirm(`¿Revocar la clave de "${key.name}"? Ese equipo dejará de tener acceso a la unidad de red.`)) return;
    setRevokingId(key.id);
    setError(null);
    try {
      await documentalService.revokeDesktopKey(key.id);
      if (newKey?.id === key.id) setNewKey(null);
      await load();
    } catch (err) {
      setError(getErrorMessage(err, 'No se pudo revocar la clave.'));
    } finally {
      setRevokingId(null);
    }
  };

  const url = data?.url ?? '';
  const username = data?.username ?? '';

  return (
    <Portal isOpen>
      <div className="fixed inset-0 z-100 flex items-end sm:items-center justify-center sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
        <div className="bg-white w-full sm:max-w-3xl max-h-[94vh] flex flex-col rounded-t-[32px] sm:rounded-[32px] shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-200">
          {/* Encabezado */}
          <div className="flex items-center justify-between gap-3 p-5 sm:p-6 border-b border-slate-100">
            <div className="flex items-center gap-3 min-w-0">
              <div className="p-2.5 rounded-2xl bg-sky-50 text-[#004C6C] border border-sky-100 shrink-0">
                <HardDrive className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h3 className="text-base font-bold text-slate-900">Conectar desde el escritorio</h3>
                <p className="text-xs text-slate-400">Abre Gestión Documental como una unidad de red, igual que una carpeta de tu equipo.</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-colors shrink-0">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="overflow-y-auto p-5 sm:p-6 space-y-6">
            {error && (
              <div className="p-3 text-xs font-semibold text-rose-600 bg-rose-50 border border-rose-100 rounded-xl">{error}</div>
            )}

            {/* Paso 1: clave */}
            <section className="space-y-3">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">1 · Crea una clave para este equipo</p>
              {newKey?.key ? (
                <div className="space-y-3 p-4 rounded-3xl border border-orange-200 bg-orange-50/50">
                  <div className="flex items-start gap-2 text-xs font-bold text-[#B9681F]">
                    <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                    <span>Copia la clave ahora: por seguridad no se vuelve a mostrar. Si la pierdes, revócala y crea otra.</span>
                  </div>
                  <Field label={`Clave de "${newKey.name}"`} value={newKey.key} mono highlight />
                </div>
              ) : (
                <form onSubmit={createKey} className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="text"
                    value={deviceName}
                    maxLength={80}
                    onChange={(e) => setDeviceName(e.target.value)}
                    placeholder='Nombre del equipo, ej. "Portátil oficina"'
                    className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#EE9D4C] focus:bg-white transition-all"
                  />
                  <button
                    type="submit"
                    disabled={creating}
                    className="flex items-center justify-center gap-2 px-6 py-3 rounded-2xl text-sm font-bold text-white bg-[#EE9D4C] hover:bg-[#e08a35] disabled:opacity-60 transition-all shadow-md"
                  >
                    {creating ? <Loader2 size={16} className="animate-spin" /> : <KeyRound size={16} />} Generar clave
                  </button>
                </form>
              )}
              <p className="text-[11px] text-slate-400 font-semibold">
                La clave reemplaza tu contraseña de Elite solo para la unidad de red. Verás las mismas carpetas y tendrás los mismos permisos que en la web, y todo queda en la auditoría.
              </p>
            </section>

            {/* Paso 2: datos de conexión */}
            <section className="space-y-3">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">2 · Datos de conexión</p>
              {loading && !data ? (
                <div className="h-24 rounded-2xl bg-slate-50 animate-pulse" />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="md:col-span-2"><Field label="Dirección (servidor)" value={url} /></div>
                  <Field label="Usuario" value={username} />
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Contraseña</p>
                    <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-500">La clave de escritorio del paso 1</div>
                  </div>
                </div>
              )}
            </section>

            {/* Paso 3: instrucciones */}
            <section className="space-y-4">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">3 · Conéctate</p>
              <div className="grid grid-cols-3 p-1 bg-slate-100 rounded-2xl">
                {PLATFORMS.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setPlatform(p.id)}
                    className={`py-2.5 px-1 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all ${platform === p.id ? 'bg-white text-[#004C6C] shadow-sm' : 'text-slate-500'}`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>

              {platform === 'windows' && (
                <ol className="space-y-3">
                  <Step n={1}>Abre el <b>Explorador de archivos</b>, haz clic derecho en <b>Este equipo</b> y elige <b>Conectar unidad de red</b>.</Step>
                  <Step n={2}>Escoge una letra (por ejemplo <b>E:</b>) y en <b>Carpeta</b> pega la dirección del paso 2.</Step>
                  <Step n={3}>Marca <b>Conectar de nuevo al iniciar sesión</b> y <b>Conectar con otras credenciales</b>, y pulsa <b>Finalizar</b>.</Step>
                  <Step n={4}>Escribe tu usuario (correo) y la clave de escritorio, y marca <b>Recordar mis credenciales</b>.</Step>
                  <Step n={5}>La primera vez que abras un Word o Excel, Office mostrará una ventana de <b>Elite</b>: entra con tu correo y tu contraseña de Elite. Office recordará la sesión por 30 días y la verás aquí abajo como <b>Office en Windows</b>.</Step>
                  <li className="text-[11px] text-slate-500 font-semibold bg-slate-50 border border-slate-100 rounded-2xl p-3">
                    Windows solo permite archivos de hasta 50 MB en unidades de red. Si trabajas con archivos más grandes (planos, videos), usa la opción <b>Como disco (RaiDrive)</b>.
                  </li>
                </ol>
              )}

              {platform === 'mac' && (
                <ol className="space-y-3">
                  <Step n={1}>En el <b>Finder</b>, abre el menú <b>Ir → Conectarse al servidor</b> (o pulsa <b>⌘ K</b>).</Step>
                  <Step n={2}>Pega la dirección del paso 2 y pulsa <b>Conectar</b>. Puedes añadirla a favoritos con el botón <b>+</b>.</Step>
                  <Step n={3}>Elige <b>Usuario registrado</b>, escribe tu correo y la clave de escritorio, y marca <b>Recordar esta contraseña en mi llavero</b>.</Step>
                  <Step n={4}>La unidad <b>Elite</b> aparece en la barra lateral del Finder, en <b>Ubicaciones</b>.</Step>
                </ol>
              )}

              {platform === 'raidrive' && (
                <ol className="space-y-3">
                  <Step n={1}>Instala <b>RaiDrive</b> (gratis, Windows) desde raidrive.com. En Mac puedes usar <b>Mountain Duck</b> (pago único).</Step>
                  <Step n={2}>Pulsa <b>Añadir</b>, elige <b>NAS → WebDAV</b> y marca <b>Dirección segura (HTTPS)</b>.</Step>
                  <Step n={3}>Pega la dirección del paso 2 (sin <b>https://</b> si te lo pide por separado), y escribe tu correo y la clave de escritorio.</Step>
                  <Step n={4}>Elige la letra de unidad y conecta. Así no tienes el límite de 50 MB de Windows y los archivos abren más rápido.</Step>
                </ol>
              )}
            </section>

            {/* Claves existentes */}
            <section className="space-y-3">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Equipos conectados</p>
              {data && data.keys.length === 0 ? (
                <p className="text-xs font-bold text-slate-400 bg-slate-50 rounded-2xl p-4 text-center">Aún no tienes claves de escritorio.</p>
              ) : (
                <ul className="divide-y divide-slate-100 border border-slate-100 rounded-2xl">
                  {data?.keys.map((key) => (
                    <li key={key.id} className="flex items-center gap-3 p-3 sm:p-4">
                      <div className="h-9 w-9 rounded-xl bg-slate-50 text-slate-400 flex items-center justify-center shrink-0">
                        <Laptop size={16} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-slate-700 truncate">
                          {key.name} <span className="font-mono text-[11px] text-slate-400">····{key.last_four}</span>
                        </p>
                        <p className="text-[11px] text-slate-400 font-semibold truncate">
                          Último uso: {formatDate(key.last_used_at)}{key.last_used_ip ? ` · ${key.last_used_ip}` : ''}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => revoke(key)}
                        disabled={revokingId === key.id}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 disabled:opacity-50 shrink-0"
                      >
                        {revokingId === key.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                        <span className="hidden sm:inline">Revocar</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        </div>
      </div>
    </Portal>
  );
};
