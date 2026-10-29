import React, { useMemo, useState } from 'react';
import { Receipt, RotateCcw, Send, Loader2, AlertCircle, Info } from 'lucide-react';
import { CustomSelect } from '../../../components/ui/CustomSelect';
import { FileDrop } from '../../../components/ui/FileDrop';
import { ModalShell, inputClass, labelClass } from '../../../components/ui/ModalShell';
import { formatMoneyInput, parseMoney } from '../../../utils/money';
import { formatBytes, formatMaxSize } from '../../cortes/utils/format';
import { cuentaCobroService, getApiErrorMessage } from '../services/cuentaCobroService';
import { AttachmentsInput } from './AttachmentsInput';
import type { CuentaCobro, CuentaCobroCatalogs, CuentaCobroPayload } from '../types';

interface CuentaCobroFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (payload: CuentaCobroPayload, id?: number) => Promise<CuentaCobro>;
  catalogs: CuentaCobroCatalogs | null;
  /** Cuenta devuelta que se corrige y reenvía; null para radicar una nueva */
  cuenta: CuentaCobro | null;
}

/**
 * Radicación de la cuenta de cobro: tipo (define si exige adjuntos, ej. SST o Gestión ambiental), proyecto y
 * frente, proveedor, contrato opcional, valor, la cuenta de cobro y sus adjuntos.
 */
export const CuentaCobroFormModal: React.FC<CuentaCobroFormModalProps> = ({ isOpen, ...props }) => (
  // Se monta en cada apertura (`key`), así el formulario arranca limpio
  isOpen ? <FormContent key={props.cuenta?.id ?? 'new'} {...props} /> : null
);

const FormContent: React.FC<Omit<CuentaCobroFormModalProps, 'isOpen'>> = ({ onClose, onSave, catalogs, cuenta }) => {
  const [tipoId, setTipoId] = useState<number | null>(cuenta?.tipo_id ?? null);
  const [location, setLocation] = useState(cuenta ? `${cuenta.project_id}:${cuenta.tower_id ?? ''}` : '');
  const [contractId, setContractId] = useState<number | null>(cuenta?.contract_id ?? null);
  const [contractorId, setContractorId] = useState<number | null>(cuenta?.contractor_id ?? null);
  const [documentNumber, setDocumentNumber] = useState(cuenta?.document_number ?? '');
  const [amount, setAmount] = useState(cuenta ? formatMoneyInput(String(cuenta.amount)) : '');
  const [description, setDescription] = useState(cuenta?.description ?? '');
  const [comment, setComment] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [progress, setProgress] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isResubmit = cuenta !== null;
  const maxMb = catalogs?.max_upload_mb ?? 100;
  const tipo = catalogs?.tipos.find((t) => t.id === tipoId) ?? null;
  const existingAttachments = cuenta?.adjuntos?.length ?? 0;
  const [projectId, towerId] = location.split(':').map((v) => (v ? Number(v) : null));

  // Una opción por cada frente (torre) de cada proyecto
  const locationOptions = useMemo(() => (catalogs?.projects ?? []).flatMap((p) => p.towers.length
    ? [{ value: `${p.id}:`, label: 'General / Indirectos', sublabel: p.name }, ...p.towers.map((t) => ({ value: `${p.id}:${t.id}`, label: t.name, sublabel: p.name }))]
    : [{ value: `${p.id}:`, label: 'General / Indirectos', sublabel: p.name }]), [catalogs]);

  const contractOptions = useMemo(() => (catalogs?.contracts ?? [])
    .filter((c) => c.project_id === projectId)
    .map((c) => ({ value: c.id, label: c.contract_code, sublabel: c.contractor_name })), [catalogs, projectId]);

  const selectFile = (selected: File) => {
    if (selected.size > maxMb * 1024 * 1024) {
      setError(`El archivo pesa ${formatBytes(selected.size)} y supera el máximo de ${formatMaxSize(maxMb)}.`);
      return;
    }
    setError(null);
    setFile(selected);
  };

  const handleSubmit = async () => {
    if (!tipoId) return setError('Elige el tipo de cuenta de cobro.');
    if (!projectId) return setError('Elige el proyecto y el frente.');
    if (!contractorId) return setError('Elige el proveedor.');
    if (!documentNumber.trim()) return setError('Indica el número de la cuenta de cobro.');
    if (!parseMoney(amount)) return setError('Indica el valor.');
    if (!isResubmit && !file) return setError('Adjunta la cuenta de cobro.');
    if (tipo?.requires_attachment && existingAttachments + attachments.length === 0) {
      return setError(`Las cuentas de cobro de ${tipo.name} requieren adjunto${tipo.attachment_hint ? `: ${tipo.attachment_hint}` : ''}.`);
    }

    setSubmitting(true);
    setError(null);
    try {
      let token: string | null = null;
      if (file) {
        setProgress('Subiendo la cuenta de cobro...');
        token = await cuentaCobroService.uploadFile(file);
      }
      const attachmentTokens: string[] = [];
      for (const [i, attachment] of attachments.entries()) {
        setProgress(`Subiendo adjunto ${i + 1} de ${attachments.length}...`);
        attachmentTokens.push(await cuentaCobroService.uploadFile(attachment));
      }
      setProgress('Guardando...');
      await onSave({
        tipo_id: tipoId,
        project_id: projectId,
        tower_id: towerId,
        contract_id: contractId,
        contractor_id: contractorId,
        document_number: documentNumber.trim(),
        amount: parseMoney(amount) ?? 0,
        description: description.trim() || null,
        upload_token: token,
        attachment_tokens: attachmentTokens,
        comment: comment.trim() || null,
      }, cuenta?.id);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : getApiErrorMessage(err, 'Error al radicar la cuenta de cobro.'));
    } finally {
      setSubmitting(false);
      setProgress(null);
    }
  };

  const lastReturn = cuenta?.history?.find((h) => h.action === 'devuelto');

  return (
    <ModalShell
      isOpen
      onClose={() => !submitting && onClose()}
      icon={isResubmit ? <RotateCcw size={24} /> : <Receipt size={24} />}
      title={isResubmit ? 'Corregir y reenviar cuenta de cobro' : 'Radicar cuenta de cobro'}
      subtitle={isResubmit ? cuenta.code : 'Director de Obra · Gerencia · Multifox'}
      footer={
        <button type="button" onClick={handleSubmit} disabled={submitting}
          className="w-full px-6 py-3.5 bg-[#004C6C] hover:bg-[#003a53] text-white rounded-2xl font-bold flex items-center justify-center gap-2 disabled:opacity-60">
          {submitting ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
          {progress ?? (isResubmit ? 'Reenviar al Director de Obra' : 'Radicar y notificar al Director de Obra')}
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
          <p className="font-black uppercase tracking-widest text-[10px] mb-1">Devuelta por {lastReturn.stage_label} · {lastReturn.user}</p>
          <p className="font-bold whitespace-pre-line">{lastReturn.comment}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <CustomSelect
          pyClass="py-3.5"
          label="Tipo de cuenta de cobro *"
          placeholder="Selecciona el tipo"
          disabled={submitting}
          options={(catalogs?.tipos ?? []).map((t) => ({ value: t.id, label: t.name, sublabel: t.requires_attachment ? 'Requiere adjunto' : undefined }))}
          value={tipoId}
          onChange={(v) => setTipoId(Number(v))}
        />
        <CustomSelect
          pyClass="py-3.5"
          label="Proyecto / Frente *"
          placeholder="Selecciona el proyecto y el frente"
          disabled={submitting}
          options={locationOptions}
          value={location}
          onChange={(v) => { setLocation(String(v)); setContractId(null); }}
        />
      </div>

      {tipo?.requires_attachment && (
        <p className="flex items-start gap-2 text-xs font-bold text-[#004C6C] bg-blue-50 rounded-2xl p-3">
          <Info size={15} className="shrink-0 mt-0.5" />
          {tipo.name} requiere adjunto{tipo.attachment_hint ? `: ${tipo.attachment_hint}` : ''}.
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
        <CustomSelect
          pyClass="py-3.5"
          label="Contrato (opcional)"
          placeholder={projectId ? (contractOptions.length ? 'Sin contrato' : 'El proyecto no tiene contratos') : 'Primero elige el proyecto'}
          disabled={submitting || !projectId || contractOptions.length === 0}
          clearable
          onClear={() => setContractId(null)}
          options={contractOptions}
          value={contractId}
          onChange={(v) => setContractId(Number(v))}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className={labelClass}>N.º cuenta de cobro *</label>
          <input disabled={submitting} className={inputClass} placeholder="Ej: C-C 12"
            value={documentNumber} onChange={(e) => setDocumentNumber(e.target.value)} />
        </div>
        <div className="space-y-2">
          <label className={labelClass}>Valor *</label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">$</span>
            <input disabled={submitting} inputMode="numeric" className={`${inputClass} pl-8`} placeholder="0"
              value={amount} onChange={(e) => setAmount(formatMoneyInput(e.target.value))} />
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <label className={labelClass}>Concepto</label>
        <textarea rows={2} disabled={submitting} className={`${inputClass} resize-none`} placeholder="Ej: servicio SST de octubre"
          value={description} onChange={(e) => setDescription(e.target.value)} />
      </div>

      <div className="space-y-2">
        <label className={labelClass}>Cuenta de cobro {isResubmit ? '(opcional: deja vacío para conservar la actual)' : '*'}</label>
        <FileDrop file={file} onSelect={selectFile} disabled={submitting}
          hint={isResubmit ? `Actual: ${cuenta.file_name}. Arrastra otra para reemplazarla` : 'Arrastra la cuenta de cobro o haz clic'} />
      </div>

      <div className="space-y-2">
        <label className={labelClass}>
          Adjuntos {tipo?.requires_attachment ? '*' : '(opcional)'}
          {existingAttachments > 0 && ` · ya tiene ${existingAttachments}`}
        </label>
        <AttachmentsInput files={attachments} onChange={setAttachments} maxMb={maxMb} onError={setError} disabled={submitting}
          hint={tipo?.attachment_hint ? `${tipo.attachment_hint} (arrastra, haz clic o pega)` : 'Arrastra los soportes, haz clic o pega capturas'} />
      </div>

      <div className="space-y-2">
        <label className={labelClass}>{isResubmit ? 'Ajustes realizados' : 'Comentario para los aprobadores'}</label>
        <textarea rows={2} disabled={submitting} className={`${inputClass} resize-none`} placeholder="Opcional"
          value={comment} onChange={(e) => setComment(e.target.value)} />
      </div>
    </ModalShell>
  );
};
