import React, { useMemo, useRef, useState } from 'react';
import { isAxiosError, isCancel } from 'axios';
import { X, Send, Scissors, AlertCircle, Loader2, UploadCloud, FileText, RotateCcw } from 'lucide-react';
import { Portal } from '../../../components/ui/Portal';
import { useEscapeToClose } from '../../../hooks/useEscapeToClose';
import { CustomSelect } from '../../../components/ui/CustomSelect';
import { corteService, getApiErrorMessage } from '../services/corteService';
import { useContractorContracts } from '../../contratacion/hooks/useContractorContracts';
import { formatBytes, formatMaxSize } from '../utils/format';
import type { Corte, CorteCatalogs, CortePayload } from '../types';

interface CorteFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (payload: CortePayload, id?: number) => Promise<Corte>;
  catalogs: CorteCatalogs | null;
  /** Corte devuelto que se va a corregir y reenviar; null para radicar uno nuevo */
  corte: Corte | null;
}

interface FormState {
  code: string;
  location: string; // "<project_id>:<tower_id>" ("<project_id>:" si el proyecto no tiene torres)
  contractor_id: number | null;
  contract_id: number | null;
  comment: string;
}

const emptyForm: FormState = { code: '', location: '', contractor_id: null, contract_id: null, comment: '' };

const inputClass =
  'w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 text-sm font-bold text-slate-700 outline-none transition-all placeholder:text-slate-400 hover:border-slate-300 focus:bg-white focus:border-[#004C6C] focus:ring-4 focus:ring-blue-50 disabled:bg-slate-100 disabled:border-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed';
const labelClass = 'text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1';

const initialForm = (corte: Corte | null): FormState => (corte
  ? {
      code: corte.code,
      location: `${corte.project_id}:${corte.tower_id ?? ''}`,
      contractor_id: corte.contractor_id,
      contract_id: corte.contract_id,
      comment: '',
    }
  : emptyForm);

// Números del corte: se ofrecen los libres hasta varios después del último radicado (la lista nunca se acaba)
const CODE_PREFIX = 'CORTE';
const codeFor = (n: number) => `${CODE_PREFIX} ${n}`;
const numberOf = (code: string) => {
  const match = code.trim().match(/^(?:corte\s*)?(\d+)$/i);
  return match ? Number(match[1]) : null;
};

const parseLocation = (location: string) => {
  const [projectId, towerId] = location.split(':');
  return { projectId: projectId ? Number(projectId) : null, towerId: towerId ? Number(towerId) : null };
};

// El contenido se monta en cada apertura (Portal lo desmonta al cerrar) y `key` lo reinicia si cambia
// el corte: así el formulario arranca limpio sin resetear el estado a mano en un efecto
export const CorteFormModal: React.FC<CorteFormModalProps> = ({ isOpen, ...props }) => (
  <Portal isOpen={isOpen}>
    <CorteFormContent key={props.corte?.id ?? 'new'} {...props} />
  </Portal>
);

const CorteFormContent: React.FC<Omit<CorteFormModalProps, 'isOpen'>> = ({ onClose, onSave, catalogs, corte }) => {
  const [form, setForm] = useState<FormState>(() => initialForm(corte));
  const [file, setFile] = useState<File | null>(null);
  // Token del archivo ya subido: si el registro falla por validación no hay que volver a subir 1 GB
  const [uploadedToken, setUploadedToken] = useState<string | null>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const isResubmit = corte !== null;
  const maxMb = catalogs?.max_upload_mb ?? 1024;

  // Proyectos separados por torre: una opción por cada torre de cada proyecto
  const locationOptions = useMemo(() => (catalogs?.projects ?? []).flatMap((project) =>
    project.towers.length > 0
      ? project.towers.map((tower) => ({ value: `${project.id}:${tower.id}`, label: tower.name, sublabel: project.name }))
      : [{ value: `${project.id}:`, label: 'Sin torre', sublabel: project.name }]
  ), [catalogs]);

  const { projectId, towerId } = parseLocation(form.location);

  // Contratos del proveedor elegido en el proyecto elegido (los filtra el backend); primero los de la misma torre
  const { contracts: contractorContracts, loading: loadingContracts, error: contractsError } =
    useContractorContracts(form.contractor_id, projectId);
  const contractOptions = useMemo(() => [...contractorContracts]
    .sort((a, b) => Number(b.tower_id === towerId) - Number(a.tower_id === towerId))
    .map((c) => ({ value: c.id, label: c.contract_code, sublabel: [c.tower, c.object].filter(Boolean).join(' · ') })),
  [contractorContracts, towerId]);

  const contractPlaceholder = !projectId
    ? 'Primero elige el proyecto'
    : !form.contractor_id
      ? 'Primero elige el proveedor'
      : loadingContracts
        ? 'Cargando contratos...'
        : contractOptions.length ? 'Selecciona el contrato' : 'El proveedor no tiene contratos en este proyecto';

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => setForm((prev) => ({ ...prev, [key]: value }));

  // Números ya radicados en un contrato, sin contar el corte que se está corrigiendo
  const usedNumbers = (contractId: number | null) => {
    const used = catalogs?.contracts.find((c) => c.id === contractId)?.corte_numbers ?? [];
    const own = corte && corte.contract_id === contractId ? numberOf(corte.code) : null;
    return used.filter((n) => n !== own);
  };

  const nextCode = (contractId: number | null) => codeFor(Math.max(0, ...usedNumbers(contractId)) + 1);

  // CORTE N sin tope: se propone el siguiente al último radicado y se avisa si el número ya está usado
  const contractUsedNumbers = form.contract_id ? [...usedNumbers(form.contract_id)].sort((a, b) => a - b) : [];
  const codeNumber = numberOf(form.code);
  const codeTaken = codeNumber !== null && contractUsedNumbers.includes(codeNumber);
  // Un corte anterior a la numeración conserva su código al reenviarse mientras no se escriba otro número
  const keepsLegacyCode = corte !== null && numberOf(corte.code) === null && form.code === corte.code;
  const nextNumber = Math.max(0, ...contractUsedNumbers) + 1;
  const usedLabel = contractUsedNumbers.length > 8
    ? `${contractUsedNumbers.slice(0, 3).join(', ')} … ${contractUsedNumbers.slice(-3).join(', ')}`
    : contractUsedNumbers.join(', ');

  // Al elegir el contrato se propone el siguiente número, salvo que el elegido siga libre en ese contrato
  const handleContractChange = (contractId: number) => {
    setForm((prev) => {
      const current = numberOf(prev.code);
      const keep = (current !== null && !usedNumbers(contractId).includes(current)) || (corte && prev.code === corte.code && corte.contract_id === contractId);
      return { ...prev, contract_id: contractId, code: keep ? prev.code : nextCode(contractId) };
    });
  };

  // Otro proveedor: el contrato elegido ya no aplica (y con él el número del corte)
  const handleContractorChange = (contractorId: number) => {
    setForm((prev) => (prev.contractor_id === contractorId
      ? prev
      : { ...prev, contractor_id: contractorId, contract_id: null, code: '' }));
  };

  const handleLocationChange = (value: string) => {
    const nextProject = parseLocation(value).projectId;
    setForm((prev) => {
      const contract = catalogs?.contracts.find((c) => c.id === prev.contract_id);
      // Si el contrato elegido es de otro proyecto se limpia (y con él el número del corte)
      return contract?.project_id === nextProject
        ? { ...prev, location: value }
        : { ...prev, location: value, contract_id: null, code: '' };
    });
  };

  const selectFile = (selected: File | undefined) => {
    if (!selected) return;
    if (selected.size > maxMb * 1024 * 1024) {
      setLocalError(`El archivo "${selected.name}" pesa ${formatBytes(selected.size)} y supera el máximo de ${formatMaxSize(maxMb)}.`);
      return;
    }
    setLocalError(null);
    setFile(selected);
    setUploadedToken(null);
    setProgress(null);
  };

  const handleClose = () => {
    abortRef.current?.abort();
    onClose();
  };
  // Escape cierra igual que la X: cancela la subida en curso
  useEscapeToClose(true, handleClose);

  const uploadSelectedFile = async (selected: File): Promise<string> => {
    abortRef.current = new AbortController();
    setProgress(0);
    try {
      const token = await corteService.uploadFile(selected, setProgress, abortRef.current.signal);
      setUploadedToken(token);
      return token;
    } catch (err) {
      setProgress(null);
      if (isCancel(err)) throw err;
      // El PUT va directo al bucket: sin respuesta suele ser CORS o red, no un error del servidor de la app
      if (isAxiosError(err) && !err.response && !err.config?.url?.includes('/v1/')) {
        throw new Error('No se pudo subir el archivo al repositorio. Revisa tu conexión e intenta de nuevo; si persiste, contacta a soporte (configuración CORS del bucket).');
      }
      throw new Error(getApiErrorMessage(err, 'Error al subir el archivo.'));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectId || !form.contractor_id || !form.contract_id) {
      setLocalError('Selecciona el proyecto / torre, el proveedor y el contrato relacionado.');
      return;
    }
    if (!form.code || (codeNumber === null && !keepsLegacyCode)) {
      setLocalError('Escribe el número del corte.');
      return;
    }
    if (codeTaken) {
      setLocalError(`El ${form.code} ya está radicado en este contrato. El siguiente libre es el ${codeFor(nextNumber)}.`);
      return;
    }
    if (!isResubmit && !file) {
      setLocalError('Adjunta el archivo del corte.');
      return;
    }

    setSubmitting(true);
    setLocalError(null);
    try {
      const token = file ? (uploadedToken ?? await uploadSelectedFile(file)) : null;
      await onSave(
        {
          code: form.code,
          project_id: projectId,
          tower_id: towerId,
          contractor_id: form.contractor_id,
          contract_id: form.contract_id,
          upload_token: token,
          comment: form.comment.trim() || null,
        },
        corte?.id
      );
      onClose();
    } catch (err) {
      if (isCancel(err)) return;
      setLocalError(err instanceof Error ? err.message : 'Error al registrar el corte.');
    } finally {
      setSubmitting(false);
    }
  };

  const lastReturn = corte?.history?.find((h) => h.action === 'devuelto');

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-[#f8fafc] w-full max-w-3xl rounded-[40px] shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-white p-8 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 bg-blue-50 text-[#004C6C] rounded-2xl flex items-center justify-center">
              {isResubmit ? <RotateCcw size={24} /> : <Scissors size={24} />}
            </div>
            <div>
              <h2 className="text-2xl font-black text-[#004C6C] tracking-tight">
                {isResubmit ? 'Corregir y reenviar corte' : 'Registrar corte'}
              </h2>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                {isResubmit ? corte.label : 'Registro de Corte'}
              </p>
            </div>
          </div>
          <button onClick={handleClose} className="p-3 text-slate-300 hover:bg-slate-50 rounded-2xl transition-all cursor-pointer">
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

          {lastReturn && (
            <div className="p-4 bg-orange-50 border border-orange-100 rounded-2xl text-xs text-orange-700">
              <p className="font-black uppercase tracking-widest text-[10px] mb-1">
                Devuelto por {lastReturn.stage_label} · {lastReturn.user}
              </p>
              <p className="font-bold whitespace-pre-line">{lastReturn.comment}</p>
            </div>
          )}

          <CustomSelect
            pyClass="py-3.5"
            label="Proyecto / Presupuesto *"
            placeholder="Selecciona el proyecto y la torre"
            searchPlaceholder="Buscar proyecto o torre..."
            disabled={submitting}
            options={locationOptions}
            value={form.location}
            onChange={(v) => handleLocationChange(String(v))}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <CustomSelect
              pyClass="py-3.5"
              label="Proveedor *"
              placeholder="Selecciona el proveedor"
              disabled={submitting}
              options={(catalogs?.contractors ?? []).map((c) => ({ value: c.id, label: c.name, sublabel: c.nit ? `NIT ${c.nit}` : undefined }))}
              value={form.contractor_id}
              onChange={(v) => handleContractorChange(Number(v))}
            />
            <CustomSelect
              pyClass="py-3.5"
              label="Contrato relacionado *"
              placeholder={contractPlaceholder}
              disabled={submitting || !projectId || !form.contractor_id || loadingContracts || contractOptions.length === 0}
              options={contractOptions}
              value={form.contract_id}
              onChange={(v) => handleContractChange(Number(v))}
            />
          </div>
          {contractsError && <p className="text-[11px] font-bold text-red-500 -mt-3 ml-1">{contractsError}</p>}

          <div className="space-y-2">
            <label className={labelClass} htmlFor="corte-number">Código del corte *</label>
            <div className="relative">
              <span className="absolute left-5 top-1/2 -translate-y-1/2 text-sm font-black text-slate-400 pointer-events-none">CORTE</span>
              <input
                id="corte-number"
                type="number"
                inputMode="numeric"
                min={1}
                max={999999}
                step={1}
                disabled={submitting || !form.contract_id}
                className={`${inputClass} pl-20 ${codeTaken ? 'border-red-300 focus:border-red-400 focus:ring-red-50' : ''}`}
                placeholder={!form.contract_id ? 'Primero elige el contrato' : keepsLegacyCode ? `Actual: ${corte?.code}` : String(nextNumber)}
                value={codeNumber ?? ''}
                onChange={(e) => {
                  const n = Number(e.target.value);
                  set('code', Number.isInteger(n) && n > 0 ? codeFor(Math.min(n, 999999)) : (corte && numberOf(corte.code) === null ? corte.code : ''));
                }}
              />
            </div>
            {codeTaken ? (
              <p className="text-[11px] font-bold text-red-500 ml-1">
                Ese número ya está radicado en el contrato. El siguiente libre es el {codeFor(nextNumber)}.
              </p>
            ) : (
              <p className="text-[11px] font-bold text-slate-400 ml-1">
                {form.contract_id && contractUsedNumbers.length > 0 && `Ya radicados: ${usedLabel}. `}
                La numeración es por contrato y no tiene tope. Se guarda en la carpeta 05 CORTES del contrato.
              </p>
            )}
          </div>

          {/* Archivo */}
          <div className="space-y-2">
            <label className={labelClass}>
              Archivo del corte {isResubmit ? '(opcional: deja vacío para conservar el actual)' : '*'}
            </label>
            <div
              onClick={() => !submitting && fileInputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragging(false);
                if (!submitting) selectFile(e.dataTransfer.files[0]);
              }}
              className={`border-2 border-dashed rounded-3xl p-6 flex flex-col items-center justify-center gap-2 text-center cursor-pointer transition-all ${dragging ? 'border-[#004C6C] bg-blue-50/50' : 'border-slate-300 bg-slate-50 hover:border-[#004C6C]/40 hover:bg-blue-50/30'}`}
            >
              <input ref={fileInputRef} type="file" className="hidden" onChange={(e) => { selectFile(e.target.files?.[0]); e.target.value = ''; }} />
              {file ? (
                <>
                  <FileText size={28} className="text-[#004C6C]" />
                  <p className="text-sm font-black text-slate-700 break-all">{file.name}</p>
                  <p className="text-[11px] font-bold text-slate-400">{formatBytes(file.size)} · clic para cambiar</p>
                </>
              ) : (
                <>
                  <UploadCloud size={28} className="text-slate-400" />
                  <p className="text-sm font-bold text-slate-500">Arrastra el archivo o haz clic para seleccionarlo</p>
                  <p className="text-[11px] font-bold text-slate-400">
                    Máximo {formatMaxSize(maxMb)}
                    {isResubmit && corte ? ` · Actual: ${corte.file_name}` : ''}
                  </p>
                </>
              )}
            </div>

            {progress !== null && (
              <div className="space-y-1">
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-[#004C6C] transition-all" style={{ width: `${progress}%` }} />
                </div>
                <p className="text-[11px] font-bold text-slate-400 text-right">
                  {progress < 100 ? `Subiendo archivo... ${progress}%` : 'Archivo cargado'}
                </p>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <label className={labelClass}>{isResubmit ? 'Qué se corrigió' : 'Observaciones'}</label>
            <textarea disabled={submitting} rows={2} className={`${inputClass} resize-none`}
              placeholder={isResubmit ? 'Describe los ajustes realizados' : 'Opcional'}
              value={form.comment} onChange={(e) => set('comment', e.target.value)} />
          </div>

          <p className="text-xs font-bold text-slate-400">
            Al {isResubmit ? 'reenviar' : 'registrar'} se notifica por correo al Interventor para iniciar la revisión
            (Interventor → Director de Obra → Gerencia).
          </p>

          <div className="flex gap-4 pt-2">
            <button type="button" onClick={handleClose}
              className="flex-1 px-6 py-4 bg-white text-slate-500 rounded-2xl font-bold hover:bg-slate-100 border border-slate-100 transition-all">
              Cancelar
            </button>
            <button type="submit" disabled={submitting}
              className="flex-1 px-6 py-4 bg-[#004C6C] hover:bg-[#003a53] text-white rounded-2xl font-bold shadow-xl transition-all flex items-center justify-center gap-2 disabled:opacity-60">
              {submitting ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
              {isResubmit ? 'Reenviar corte' : 'Registrar corte'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
