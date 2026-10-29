import React, { useMemo, useState } from 'react';
import { HandCoins, RotateCcw, Send, Loader2, AlertCircle } from 'lucide-react';
import { CustomSelect } from '../../../components/ui/CustomSelect';
import { ModalShell, inputClass, labelClass } from '../../../components/ui/ModalShell';
import { formatMoneyInput, parseMoney } from '../../../utils/money';
import { formatBytes, formatMaxSize } from '../../cortes/utils/format';
import { anticipoService, getApiErrorMessage } from '../services/anticipoService';
import { FileDrop } from '../../../components/ui/FileDrop';
import type { Anticipo, AnticipoCatalogs, AnticipoPayload } from '../types';

interface AnticipoFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (payload: AnticipoPayload, id?: number) => Promise<Anticipo>;
  catalogs: AnticipoCatalogs | null;
  /** Anticipo devuelto que se corrige y reenvía; null para radicar uno nuevo */
  anticipo: Anticipo | null;
}

const normalize = (text: string) => text.normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase();

/**
 * El residente radica la cuenta de cobro del anticipo y elige el contrato al que se aplica.
 * El proyecto y el frente salen del contrato; la cuenta de cobro queda en la carpeta 08 ANTICIPOS del contrato.
 */
export const AnticipoFormModal: React.FC<AnticipoFormModalProps> = ({ isOpen, ...props }) => (
  // Se monta en cada apertura (`key`), así el formulario arranca limpio
  isOpen ? <FormContent key={props.anticipo?.id ?? 'new'} {...props} /> : null
);

const FormContent: React.FC<Omit<AnticipoFormModalProps, 'isOpen'>> = ({ onClose, onSave, catalogs, anticipo }) => {
  const [contractId, setContractId] = useState<number | null>(anticipo?.contract_id ?? null);
  const [contractorId, setContractorId] = useState<number | null>(anticipo?.contractor_id ?? null);
  const [documentNumber, setDocumentNumber] = useState(anticipo?.document_number ?? '');
  const [amount, setAmount] = useState(anticipo ? formatMoneyInput(String(anticipo.amount)) : '');
  const [description, setDescription] = useState(anticipo?.description ?? '');
  const [comment, setComment] = useState('');
  const [file, setFile] = useState<File | null>(null);
  // Si el registro falla por validación no hay que volver a subir el archivo
  const [uploadedToken, setUploadedToken] = useState<string | null>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isResubmit = anticipo !== null;
  const maxMb = catalogs?.max_upload_mb ?? 100;
  const contract = catalogs?.contracts.find((c) => c.id === contractId) ?? null;

  const contractOptions = useMemo(() => (catalogs?.contracts ?? []).map((c) => ({
    value: c.id,
    label: `${c.contract_code} · ${c.contractor_name}`,
    sublabel: [c.project, c.tower].filter(Boolean).join(' · '),
  })), [catalogs]);

  // Al elegir el contrato se propone el proveedor cuyo nombre coincide con el contratista del contrato
  const handleContractChange = (id: number) => {
    setContractId(id);
    const selected = catalogs?.contracts.find((c) => c.id === id);
    if (!selected || contractorId) return;
    const name = normalize(selected.contractor_name.split(' - ')[0]).trim();
    const match = catalogs?.contractors.find((c) => normalize(c.name).startsWith(name) || name.startsWith(normalize(c.name)));
    if (match) setContractorId(match.id);
  };

  const selectFile = (selected: File) => {
    if (selected.size > maxMb * 1024 * 1024) {
      setError(`El archivo pesa ${formatBytes(selected.size)} y supera el máximo de ${formatMaxSize(maxMb)}.`);
      return;
    }
    setError(null);
    setFile(selected);
    setUploadedToken(null);
    setProgress(null);
  };

  const handleSubmit = async () => {
    if (!contractId || !contractorId) return setError('Elige el contrato y el proveedor.');
    if (!documentNumber.trim()) return setError('Indica el número de la cuenta de cobro.');
    if (!parseMoney(amount)) return setError('Indica el valor del anticipo.');
    if (!isResubmit && !file) return setError('Adjunta la cuenta de cobro.');

    setSubmitting(true);
    setError(null);
    try {
      let token = uploadedToken;
      if (file && !token) {
        setProgress(0);
        token = await anticipoService.uploadFile(file, setProgress);
        setUploadedToken(token);
      }
      await onSave({
        contract_id: contractId,
        contractor_id: contractorId,
        document_number: documentNumber.trim(),
        amount: parseMoney(amount) ?? 0,
        description: description.trim() || null,
        upload_token: token,
        comment: comment.trim() || null,
      }, anticipo?.id);
      onClose();
    } catch (err) {
      setProgress(null);
      setError(err instanceof Error ? err.message : getApiErrorMessage(err, 'Error al radicar el anticipo.'));
    } finally {
      setSubmitting(false);
    }
  };

  const lastReturn = anticipo?.history?.find((h) => h.action === 'devuelto');

  return (
    <ModalShell
      isOpen
      onClose={() => !submitting && onClose()}
      icon={isResubmit ? <RotateCcw size={24} /> : <HandCoins size={24} />}
      title={isResubmit ? 'Corregir y reenviar anticipo' : 'Radicar anticipo'}
      subtitle={isResubmit ? anticipo.code : 'Director de Obra · Gerencia · Contabilidad'}
      footer={
        <button type="button" onClick={handleSubmit} disabled={submitting}
          className="w-full px-6 py-3.5 bg-[#004C6C] hover:bg-[#003a53] text-white rounded-2xl font-bold flex items-center justify-center gap-2 disabled:opacity-60">
          {submitting ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
          {submitting && progress !== null && progress < 100 ? `Subiendo archivo... ${progress}%` : isResubmit ? 'Reenviar al Director de Obra' : 'Radicar y notificar al Director de Obra'}
        </button>
      }
    >
      {error && (
        <div className="p-3 bg-red-50 border border-red-100 rounded-2xl text-xs font-bold text-red-600 flex items-center gap-2">
          <AlertCircle size={16} className="shrink-0" /> <span className="whitespace-pre-line">{error}</span>
        </div>
      )}
      {lastReturn && (
        <div className="p-4 bg-orange-50 border border-orange-100 rounded-2xl text-xs text-orange-700">
          <p className="font-black uppercase tracking-widest text-[10px] mb-1">Devuelto por {lastReturn.stage_label} · {lastReturn.user}</p>
          <p className="font-bold whitespace-pre-line">{lastReturn.comment}</p>
        </div>
      )}

      <CustomSelect
        pyClass="py-3.5"
        label="Contrato al que se aplica el anticipo *"
        placeholder={contractOptions.length ? 'Selecciona el contrato' : 'No tienes contratos disponibles'}
        searchPlaceholder="Buscar por código o contratista..."
        disabled={submitting || contractOptions.length === 0}
        options={contractOptions}
        value={contractId}
        onChange={(v) => handleContractChange(Number(v))}
      />
      {contract && (
        <p className="text-[11px] font-bold text-slate-400 -mt-3 ml-1">
          {contract.project}{contract.tower ? ` · ${contract.tower}` : ''} · {contract.object}
        </p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <CustomSelect
          pyClass="py-3.5"
          label="Proveedor *"
          placeholder="Selecciona el proveedor"
          disabled={submitting}
          options={(catalogs?.contractors ?? []).map((c) => ({ value: c.id, label: c.name, sublabel: c.nit ? `NIT ${c.nit}` : undefined }))}
          value={contractorId}
          onChange={(v) => setContractorId(Number(v))}
        />
        <div className="space-y-2">
          <label className={labelClass}>N.º cuenta de cobro *</label>
          <input disabled={submitting} className={inputClass} placeholder="Ej: C-C 45"
            value={documentNumber} onChange={(e) => setDocumentNumber(e.target.value)} />
        </div>
      </div>

      <div className="space-y-2">
        <label className={labelClass}>Valor del anticipo *</label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">$</span>
          <input disabled={submitting} inputMode="numeric" className={`${inputClass} pl-8`} placeholder="0"
            value={amount} onChange={(e) => setAmount(formatMoneyInput(e.target.value))} />
        </div>
      </div>

      <div className="space-y-2">
        <label className={labelClass}>Descripción</label>
        <textarea rows={2} disabled={submitting} className={`${inputClass} resize-none`} placeholder="Ej: anticipo del 30% para inicio de obra"
          value={description} onChange={(e) => setDescription(e.target.value)} />
      </div>

      <div className="space-y-2">
        <label className={labelClass}>Cuenta de cobro {isResubmit ? '(opcional: deja vacío para conservar la actual)' : '*'}</label>
        <FileDrop file={file} onSelect={selectFile} disabled={submitting} progress={progress}
          hint={isResubmit ? `Actual: ${anticipo.file_name}. Arrastra otra para reemplazarla` : 'Arrastra la cuenta de cobro o haz clic'} />
      </div>

      <div className="space-y-2">
        <label className={labelClass}>{isResubmit ? 'Ajustes realizados' : 'Comentario para los aprobadores'}</label>
        <textarea rows={2} disabled={submitting} className={`${inputClass} resize-none`} placeholder="Opcional"
          value={comment} onChange={(e) => setComment(e.target.value)} />
      </div>
    </ModalShell>
  );
};
