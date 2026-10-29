import React, { useRef, useState } from 'react';
import { UploadCloud, FileText, Trash2, Loader2, CheckCircle2, AlertCircle, Receipt, FolderOpen } from 'lucide-react';
import { CustomSelect } from '../../../components/ui/CustomSelect';
import { facturacionService, getApiErrorMessage } from '../services/facturacionService';
import { matchContractor, parseInvoiceFileName } from '../utils/fileName';
import { formatBytes, formatMaxSize } from '../../cortes/utils/format';
import { FacturaFields } from './FacturaFields';
import { draftError, draftToPayload, type FacturaDraft } from '../utils/draft';
import { ModalShell, labelClass } from '../../../components/ui/ModalShell';
import type { FacturacionCatalogs } from '../types';

interface BulkUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  catalogs: FacturacionCatalogs;
  defaultPeriod: string;
  /** Se llama al terminar si se cargó al menos una factura */
  onUploaded: (count: number) => void;
}

interface Row extends FacturaDraft {
  key: string;
  file: File;
  state: 'listo' | 'subiendo' | 'cargada' | 'error';
  progress: number;
  error: string | null;
}

const newRow = (file: File, catalogs: FacturacionCatalogs): Row => {
  const parsed = parseInvoiceFileName(file.name);
  const contractor = matchContractor(parsed.supplierName, catalogs.contractors);

  return {
    key: `${file.name}-${file.size}-${file.lastModified}`,
    file,
    documentType: parsed.documentType,
    invoiceNumber: parsed.invoiceNumber,
    contractorId: contractor?.id ?? null,
    supplierName: parsed.supplierName,
    relatedDocument: '',
    amount: '',
    observation: '',
    state: 'listo',
    progress: 0,
    error: null,
  };
};

/**
 * Cargue masivo de Contabilidad: se eligen el mes y varios archivos, se precargan tipo, número y proveedor
 * desde el nombre del archivo ("FE 335 INVALGO SAS.pdf") y se suben uno a uno a la carpeta del mes.
 * Si alguna falla, las cargadas no se repiten al reintentar.
 */
export const BulkUploadModal: React.FC<BulkUploadModalProps> = ({ isOpen, onClose, catalogs, defaultPeriod, onUploaded }) => {
  const [period, setPeriod] = useState(defaultPeriod);
  const [rows, setRows] = useState<Row[]>([]);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const periodLabel = catalogs.periods.find((p) => p.value === period)?.label ?? period;
  const pendingRows = rows.filter((r) => r.state !== 'cargada');

  const updateRow = (key: string, patch: Partial<Row>) =>
    setRows((prev) => prev.map((r) => (r.key === key ? { ...r, ...patch } : r)));

  const addFiles = (files: FileList | null) => {
    if (!files?.length) return;
    const tooBig = Array.from(files).filter((f) => f.size > catalogs.max_upload_mb * 1024 * 1024);
    setError(tooBig.length ? `Se omitieron ${tooBig.length} archivo(s) que superan ${formatMaxSize(catalogs.max_upload_mb)}.` : null);

    setRows((prev) => {
      const keys = new Set(prev.map((r) => r.key));
      const added = Array.from(files)
        .filter((f) => f.size <= catalogs.max_upload_mb * 1024 * 1024)
        .map((f) => newRow(f, catalogs))
        .filter((r) => !keys.has(r.key));
      return [...prev, ...added];
    });
  };

  const close = () => {
    if (running) return;
    const uploaded = rows.filter((r) => r.state === 'cargada').length;
    setRows([]);
    setError(null);
    onClose();
    if (uploaded) onUploaded(uploaded);
  };

  const handleUpload = async () => {
    const invalid = pendingRows.map((r) => ({ r, message: draftError(r) })).filter((x) => x.message);
    if (invalid.length) {
      invalid.forEach(({ r, message }) => updateRow(r.key, { state: 'error', error: message }));
      setError('Revisa los datos marcados antes de cargar.');
      return;
    }

    setRunning(true);
    setError(null);
    for (const row of pendingRows) {
      updateRow(row.key, { state: 'subiendo', progress: 0, error: null });
      try {
        const token = await facturacionService.uploadFile(row.file, (progress) => updateRow(row.key, { progress }));
        await facturacionService.createFactura({ ...draftToPayload(row, period), upload_token: token });
        updateRow(row.key, { state: 'cargada', progress: 100 });
      } catch (err) {
        updateRow(row.key, { state: 'error', error: getApiErrorMessage(err, 'No se pudo cargar.') });
      }
    }
    setRunning(false);
  };

  const done = rows.length > 0 && pendingRows.length === 0;

  return (
    <ModalShell
      isOpen={isOpen}
      onClose={close}
      icon={<Receipt size={24} />}
      title="Cargar facturas del mes"
      subtitle="Quedan pendientes hasta que el residente las asocie a su corte u orden"
      maxWidth="max-w-5xl"
      footer={
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
          <p className="flex items-center gap-2 text-xs font-bold text-slate-500 min-w-0">
            <FolderOpen size={15} className="shrink-0" />
            <span className="truncate">{catalogs.s3_root}/{periodLabel}</span>
          </p>
          {done ? (
            <button type="button" onClick={close} className="px-6 py-3 bg-[#004C6C] hover:bg-[#003a53] text-white rounded-2xl font-bold">
              Listo
            </button>
          ) : (
            <button type="button" onClick={handleUpload} disabled={running || pendingRows.length === 0}
              className="px-6 py-3 bg-[#004C6C] hover:bg-[#003a53] text-white rounded-2xl font-bold flex items-center justify-center gap-2 disabled:opacity-60">
              {running ? <Loader2 size={18} className="animate-spin" /> : <UploadCloud size={18} />}
              {running ? 'Cargando...' : `Cargar ${pendingRows.length || ''} factura(s)`}
            </button>
          )}
        </div>
      }
    >
      <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] gap-4 items-end">
        <div className="space-y-1.5">
          <label className={labelClass}>Mes *</label>
          <CustomSelect
            pyClass="py-3"
            searchable={false}
            disabled={running || rows.some((r) => r.state === 'cargada')}
            options={catalogs.periods.map((p) => ({ value: p.value, label: p.label }))}
            value={period}
            onChange={(v) => setPeriod(String(v))}
          />
        </div>
        <div onClick={() => !running && fileInputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => { e.preventDefault(); if (!running) addFiles(e.dataTransfer.files); }}
          className="border-2 border-dashed border-slate-300 hover:border-[#004C6C]/60 hover:bg-blue-50/30 rounded-3xl p-5 flex items-center justify-center gap-3 text-center cursor-pointer bg-white transition-all">
          <input ref={fileInputRef} type="file" multiple className="hidden" accept=".pdf,.xml,.zip,.png,.jpg,.jpeg"
            onChange={(e) => { addFiles(e.target.files); e.target.value = ''; }} />
          <UploadCloud size={24} className="text-slate-400 shrink-0" />
          <p className="text-sm font-bold text-slate-500">Arrastra las facturas o haz clic. Nómbralas como en Drive: <span className="text-slate-700">FE 335 INVALGO SAS.pdf</span></p>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-100 rounded-2xl text-xs font-bold text-red-600 flex items-center gap-2">
          <AlertCircle size={16} className="shrink-0" /> {error}
        </div>
      )}

      <ul className="space-y-3">
        {rows.map((row) => (
          <li key={row.key} className={`bg-white rounded-3xl border p-4 space-y-3 ${row.state === 'error' ? 'border-red-200' : row.state === 'cargada' ? 'border-green-200' : 'border-slate-100'}`}>
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 min-w-0">
                <FileText size={18} className="text-[#004C6C] shrink-0" />
                <p className="text-sm font-black text-slate-700 truncate" title={row.file.name}>{row.file.name}</p>
                <span className="text-[11px] font-bold text-slate-400 shrink-0">{formatBytes(row.file.size)}</span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {row.state === 'subiendo' && <span className="flex items-center gap-1 text-xs font-bold text-[#004C6C]"><Loader2 size={14} className="animate-spin" /> {row.progress}%</span>}
                {row.state === 'cargada' && <span className="flex items-center gap-1 text-xs font-bold text-green-600"><CheckCircle2 size={14} /> Cargada</span>}
                {row.state !== 'cargada' && row.state !== 'subiendo' && (
                  <button type="button" disabled={running} onClick={() => setRows((prev) => prev.filter((r) => r.key !== row.key))}
                    className="p-2 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50" title="Quitar">
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            </div>
            <FacturaFields compact catalogs={catalogs} draft={row} disabled={running || row.state === 'cargada'}
              onChange={(patch) => updateRow(row.key, { ...patch, ...(row.state === 'error' ? { state: 'listo', error: null } : {}) })} />
            {row.error && <p className="text-xs font-bold text-red-600">{row.error}</p>}
          </li>
        ))}
      </ul>
    </ModalShell>
  );
};
