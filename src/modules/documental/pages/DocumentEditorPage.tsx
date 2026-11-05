import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  CheckCircle2,
  ChevronRight,
  CloudUpload,
  Download,
  Eye,
  FileWarning,
  Loader2,
  PencilLine,
  RefreshCw,
  Users,
} from 'lucide-react';
import { documentalService } from '../services/documentalService';
import type { EditorSession } from '../types/documental.types';
import { getFileIconConfig } from '../utils/fileIcons';
import { getErrorMessage } from '../../../lib/apiError';
import { useProject } from '../../../context/ProjectContext';

declare global {
  interface Window {
    DocsAPI?: {
      DocEditor: new (elementId: string, config: Record<string, unknown>) => { destroyEditor: () => void };
    };
  }
}

const EDITOR_ELEMENT_ID = 'documental-office-editor';

/** Carga una sola vez el script del servidor de documentos */
const loadDocsApi = (serverUrl: string): Promise<void> => {
  if (window.DocsAPI) return Promise.resolve();
  const src = `${serverUrl}/web-apps/apps/api/documents/api.js`;

  return new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${src}"]`);
    const script = existing ?? document.createElement('script');
    script.addEventListener('load', () => resolve(), { once: true });
    script.addEventListener('error', () => reject(new Error('No fue posible conectar con el servidor de documentos.')), { once: true });
    if (!existing) {
      script.src = src;
      script.async = true;
      document.body.appendChild(script);
    }
  });
};

type SaveState = 'saved' | 'pending';

export default function DocumentEditorPage() {
  const [searchParams] = useSearchParams();
  const path = searchParams.get('path') ?? '';
  const { activeProject, isLoading: isLoadingProjects } = useProject();

  const [session, setSession] = useState<EditorSession | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [saveState, setSaveState] = useState<SaveState>('saved');
  const [attempt, setAttempt] = useState(0);
  const editorRef = useRef<{ destroyEditor: () => void } | null>(null);
  // ONLYOFFICE reemplaza el nodo donde se monta por su iframe: ese nodo se crea fuera de React
  const containerRef = useRef<HTMLDivElement>(null);

  // Configuración firmada (espera al proyecto activo: el backend filtra carpetas por proyecto)
  useEffect(() => {
    if (isLoadingProjects) return;
    if (!path) {
      setError('No se indicó qué archivo abrir.');
      return;
    }
    let cancelled = false;
    setSession(null);
    setError(null);
    setIsReady(false);
    documentalService
      .getEditorSession(path)
      .then((data) => { if (!cancelled) setSession(data); })
      .catch((err) => { if (!cancelled) setError(getErrorMessage(err, 'No fue posible abrir el archivo.')); });
    return () => { cancelled = true; };
  }, [path, isLoadingProjects, attempt]);

  // Monta el editor de ONLYOFFICE cuando llega la configuración
  useEffect(() => {
    if (!session) return;
    let disposed = false;
    document.title = `${session.file.name} · Elite`;

    loadDocsApi(session.document_server_url)
      .then(() => {
        if (disposed || !window.DocsAPI || !containerRef.current) return;
        const placeholder = document.createElement('div');
        placeholder.id = EDITOR_ELEMENT_ID;
        containerRef.current.replaceChildren(placeholder);
        editorRef.current = new window.DocsAPI.DocEditor(EDITOR_ELEMENT_ID, {
          ...session.config,
          events: {
            onAppReady: () => setIsReady(true),
            onDocumentReady: () => setIsReady(true),
            // true = hay cambios que aún no llegan al servidor de documentos
            onDocumentStateChange: (event: { data: boolean }) => setSaveState(event.data ? 'pending' : 'saved'),
            onError: (event: { data?: { errorDescription?: string } }) =>
              setError(event.data?.errorDescription || 'El editor reportó un error al abrir el archivo.'),
          },
        });
      })
      .catch((err: Error) => { if (!disposed) setError(err.message); });

    return () => {
      disposed = true;
      editorRef.current?.destroyEditor();
      editorRef.current = null;
      containerRef.current?.replaceChildren();
    };
  }, [session]);

  useEffect(() => () => { document.title = 'Elite'; }, []);

  const handleDownload = useCallback(async () => {
    try {
      const res = await documentalService.getDownloadUrl(path);
      window.open(res.download_url, '_blank');
    } catch (err) {
      setError(getErrorMessage(err, 'No fue posible descargar el archivo.'));
    }
  }, [path]);

  const fileName = session?.file.name ?? path.split('/').pop() ?? '';
  const extension = session?.file.extension ?? fileName.split('.').pop() ?? '';
  const location = session?.file.location ?? path.split('/').slice(0, -1).join('/');
  const iconConfig = getFileIconConfig(extension);
  const backUrl = `/app/documental${location ? `?path=${encodeURIComponent(location)}` : ''}`;

  return (
    <div className="h-screen w-screen flex flex-col bg-slate-100 overflow-hidden">
      {/* Barra superior */}
      <header className="shrink-0 bg-gradient-to-r from-[#004C6C] via-[#005981] to-[#003850] text-white shadow-lg relative z-10">
        <div className="flex items-center gap-3 px-3 md:px-5 h-16">
          <Link
            to={backUrl}
            title="Volver a Gestión Documental"
            className="h-10 w-10 shrink-0 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/10 flex items-center justify-center transition-colors"
          >
            <ArrowLeft size={18} />
          </Link>

          <div className={`h-10 w-10 shrink-0 rounded-xl border flex items-center justify-center bg-white ${iconConfig.colorClass}`}>
            {iconConfig.icon}
          </div>

          <div className="min-w-0 flex-1">
            <h1 className="text-sm md:text-base font-black tracking-tight truncate" title={fileName}>
              {fileName || 'Documento'}
            </h1>
            <div className="flex items-center gap-1 text-[10px] font-bold text-white/60 uppercase tracking-widest min-w-0">
              {activeProject && <span className="shrink-0">{activeProject.name}</span>}
              {location && (
                <>
                  {activeProject && <ChevronRight size={12} className="shrink-0" />}
                  <span className="truncate normal-case tracking-normal font-semibold" title={location}>{location}</span>
                </>
              )}
            </div>
          </div>

          {session && (
            <div className="hidden md:flex items-center gap-2 shrink-0">
              {session.can_edit ? (
                <>
                  <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 border border-white/10 text-[11px] font-bold">
                    <Users size={14} className="text-[#EE9D4C]" /> Edición en equipo
                  </span>
                  <span
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold transition-colors ${
                      saveState === 'pending' ? 'bg-[#EE9D4C]/20 text-[#FFD3A5]' : 'bg-emerald-400/15 text-emerald-200'
                    }`}
                    title="Los cambios se guardan solos en el repositorio documental al cerrar el archivo"
                  >
                    {saveState === 'pending' ? <CloudUpload size={14} /> : <CheckCircle2 size={14} />}
                    {saveState === 'pending' ? 'Guardando cambios…' : 'Cambios guardados'}
                  </span>
                </>
              ) : (
                <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 border border-white/10 text-[11px] font-bold">
                  <Eye size={14} className="text-[#EE9D4C]" /> Solo lectura
                </span>
              )}
            </div>
          )}

          <button
            type="button"
            onClick={handleDownload}
            disabled={!path}
            className="shrink-0 flex items-center gap-2 bg-[#EE9D4C] hover:bg-[#e08a35] disabled:opacity-50 text-white px-3 md:px-4 py-2.5 rounded-2xl text-xs font-bold shadow-lg transition-all"
          >
            <Download size={16} />
            <span className="hidden sm:inline">Descargar</span>
          </button>
        </div>

        {session && !session.can_edit && session.read_only_reason && (
          <div className="flex items-center gap-2 px-5 py-2 bg-[#003850] border-t border-white/10 text-[11px] font-semibold text-white/80">
            <PencilLine size={14} className="text-[#EE9D4C] shrink-0" />
            <span className="truncate">{session.read_only_reason}</span>
          </div>
        )}
      </header>

      {/* Editor */}
      <main className="flex-1 relative min-h-0">
        {error ? (
          <div className="absolute inset-0 flex items-center justify-center p-6">
            <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm p-10 max-w-md text-center">
              <div className="h-16 w-16 mx-auto mb-4 rounded-3xl bg-rose-50 border border-rose-100 text-rose-500 flex items-center justify-center">
                <FileWarning size={30} />
              </div>
              <h2 className="text-lg font-black text-[#004C6C] tracking-tight">No se pudo abrir el archivo</h2>
              <p className="text-sm text-slate-500 mt-2">{error}</p>
              <div className="flex flex-col sm:flex-row gap-2 justify-center mt-6">
                <button
                  type="button"
                  onClick={() => setAttempt((n) => n + 1)}
                  className="flex items-center justify-center gap-2 px-5 py-3 rounded-2xl text-xs font-bold text-white bg-[#004C6C] hover:bg-[#003952] transition-colors"
                >
                  <RefreshCw size={15} /> Reintentar
                </button>
                <Link
                  to={backUrl}
                  className="flex items-center justify-center gap-2 px-5 py-3 rounded-2xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
                >
                  <ArrowLeft size={15} /> Volver a la carpeta
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <>
            {!isReady && (
              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-slate-50 text-slate-400">
                <Loader2 className="w-9 h-9 animate-spin text-[#004C6C]" />
                <p className="text-xs font-black uppercase tracking-widest">Abriendo {fileName}…</p>
              </div>
            )}
            <div ref={containerRef} className="absolute inset-0" />
          </>
        )}
      </main>
    </div>
  );
}
