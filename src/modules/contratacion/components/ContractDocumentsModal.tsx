import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  X, FolderOpen, Upload, Download, Trash2, Loader2, AlertTriangle, CheckCircle2, FileText, Link2, Unlink, FolderSearch,
} from 'lucide-react';
import { Portal } from '../../../components/ui/Portal';
import { useNotification } from '../../../context/NotificationContext';
import { contratacionService, getApiErrorMessage } from '../services/contratacionService';
import type { Contract, ContractDocument, ContratacionCatalogs } from '../types';
import { S3FolderPickerModal } from './S3FolderPickerModal';

import { useConfirm } from '../../../context/ConfirmContext';
interface ContractDocumentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Se llama después de subir o eliminar para refrescar alertas del listado */
  onChanged: () => void;
  contractId: number | null;
  catalogs: ContratacionCatalogs | null;
  canUpload: boolean;
  canDelete: boolean;
  /** Elegir carpetas existentes del gestor documental (contratacion.editar) */
  canLinkFolders: boolean;
}

const formatBytes = (bytes: number) => {
  if (!bytes) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / Math.pow(1024, i)).toFixed(i ? 1 : 0)} ${units[i]}`;
};

export const ContractDocumentsModal: React.FC<ContractDocumentsModalProps> = ({
  isOpen,
  onClose,
  onChanged,
  contractId,
  catalogs,
  canUpload,
  canDelete,
  canLinkFolders,
}) => {
  const { showNotification } = useNotification();
  const confirm = useConfirm();
  const [contract, setContract] = useState<Contract | null>(null);
  const [loading, setLoading] = useState(false);
  // Clave de la carpeta (o "legal.<tipo>") que se está subiendo
  const [uploadingKey, setUploadingKey] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pendingTarget = useRef<{ folder: string; documentType?: string } | null>(null);
  // Qué se está asociando con el selector: la carpeta del contrato o la de un tipo de documento
  const [pickerTarget, setPickerTarget] = useState<{ kind: 'contract' } | { kind: 'folder'; key: string; name: string } | null>(null);
  const [unlinkingKey, setUnlinkingKey] = useState<string | null>(null);

  const loadContract = useCallback(async () => {
    if (!contractId) return;
    setLoading(true);
    try {
      setContract(await contratacionService.getContract(contractId));
    } catch (err) {
      showNotification(getApiErrorMessage(err, 'Error al cargar los adjuntos.'), 'error');
    } finally {
      setLoading(false);
    }
  }, [contractId, showNotification]);

  useEffect(() => {
    if (isOpen) {
      loadContract();
    } else {
      setContract(null);
    }
  }, [isOpen, loadContract]);

  const pickFiles = (folder: string, documentType?: string) => {
    pendingTarget.current = { folder, documentType };
    fileInputRef.current?.click();
  };

  const handleFilesSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    e.target.value = '';
    const target = pendingTarget.current;
    if (!contractId || !target || files.length === 0) return;

    // Se valida antes de enviar: si el envío supera el límite del servidor, PHP lo rechaza sin respuesta útil
    const maxMb = catalogs?.max_upload_mb;
    if (maxMb) {
      const maxBytes = maxMb * 1024 * 1024;
      const tooBig = files.find((file) => file.size > maxBytes);
      if (tooBig) {
        showNotification(`"${tooBig.name}" pesa ${formatBytes(tooBig.size)} y el máximo permitido es ${maxMb} MB.`, 'error');
        return;
      }
      const total = files.reduce((sum, file) => sum + file.size, 0);
      if (total > maxBytes) {
        showNotification(`Los archivos seleccionados suman ${formatBytes(total)} y el máximo por envío es ${maxMb} MB. Súbelos por partes.`, 'error');
        return;
      }
    }

    const key = target.documentType ? `legal.${target.documentType}` : target.folder;
    setUploadingKey(key);
    try {
      await contratacionService.uploadDocuments(contractId, target.folder, files, target.documentType);
      showNotification(`${files.length} archivo(s) subido(s) exitosamente.`, 'success');
      await loadContract();
      onChanged();
    } catch (err) {
      showNotification(getApiErrorMessage(err, 'Error al subir los archivos.'), 'error');
    } finally {
      setUploadingKey(null);
    }
  };

  const handleDownload = async (doc: ContractDocument) => {
    try {
      const url = await contratacionService.getDownloadUrl(doc.id);
      window.open(url, '_blank', 'noopener');
    } catch (err) {
      showNotification(getApiErrorMessage(err, 'Error al descargar el archivo.'), 'error');
    }
  };

  const handleDelete = async (doc: ContractDocument) => {
    if (!(await confirm({ title: 'Eliminar archivo', message: `¿Eliminar "${doc.name}" del repositorio documental?`, confirmText: 'Eliminar' }))) return;
    setDeletingId(doc.id);
    try {
      await contratacionService.deleteDocument(doc.id);
      showNotification('Archivo eliminado.', 'success');
      await loadContract();
      onChanged();
    } catch (err) {
      showNotification(getApiErrorMessage(err, 'Error al eliminar el archivo.'), 'error');
    } finally {
      setDeletingId(null);
    }
  };

  const handlePickFolder = async (path: string) => {
    if (!contractId || !pickerTarget) return;
    try {
      const result = pickerTarget.kind === 'contract'
        ? await contratacionService.setContractFolder(contractId, path)
        : await contratacionService.setFolderLink(contractId, pickerTarget.key, path);
      setContract(result.contract);
      setPickerTarget(null);
      showNotification(result.message, 'success');
      onChanged();
    } catch (err) {
      showNotification(getApiErrorMessage(err, 'Error al asociar la carpeta.'), 'error');
    }
  };

  const handleUnlink = async (key: string, name: string) => {
    if (!contractId) return;
    if (!(await confirm({
      title: 'Quitar carpeta vinculada',
      message: `${name} volverá a usar su subcarpeta dentro de la carpeta del contrato. No se borra ningún archivo.`,
      confirmText: 'Quitar vínculo',
    }))) return;
    setUnlinkingKey(key);
    try {
      const result = await contratacionService.setFolderLink(contractId, key, null);
      setContract(result.contract);
      showNotification(result.message, 'success');
      onChanged();
    } catch (err) {
      showNotification(getApiErrorMessage(err, 'Error al quitar el vínculo.'), 'error');
    } finally {
      setUnlinkingKey(null);
    }
  };

  const folderLinks = contract?.folder_links ?? {};

  // Vínculo de un tipo de documento a una carpeta existente: ruta vinculada + acciones
  const linkControls = (key: string, name: string) => {
    const linked = folderLinks[key];
    if (!linked && !canLinkFolders) return null;
    return (
      <div className="flex items-center gap-2 min-w-0">
        {linked ? (
          <>
            <Link2 size={12} className="text-[#004C6C] shrink-0" />
            <span className="text-[10px] font-bold text-slate-500 truncate flex-1" title={linked}>{linked}</span>
            {canLinkFolders && (
              <>
                <button onClick={() => setPickerTarget({ kind: 'folder', key, name })}
                  className="text-[10px] font-black text-[#004C6C] hover:underline shrink-0">Cambiar</button>
                <button onClick={() => handleUnlink(key, name)} disabled={unlinkingKey === key}
                  className="p-1 text-slate-400 hover:text-red-500 rounded-md shrink-0 disabled:opacity-50" title="Quitar vínculo" aria-label="Quitar vínculo">
                  {unlinkingKey === key ? <Loader2 size={12} className="animate-spin" /> : <Unlink size={12} />}
                </button>
              </>
            )}
          </>
        ) : (
          <button onClick={() => setPickerTarget({ kind: 'folder', key, name })}
            className="flex items-center gap-1 text-[10px] font-black text-slate-400 hover:text-[#004C6C]">
            <Link2 size={12} /> Vincular carpeta existente
          </button>
        )}
      </div>
    );
  };

  const documents = contract?.documents ?? [];
  const missingKeys = new Set((contract?.missing_documents ?? []).map((m) => m.key));

  const renderFile = (doc: ContractDocument) => (
    <li key={doc.id} className="flex items-center gap-3 bg-slate-50 rounded-xl px-3 py-2">
      <FileText size={16} className="text-slate-400 shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="text-xs font-bold text-slate-700 truncate" title={doc.name}>{doc.name}</p>
        <p className="text-[10px] font-bold text-slate-400">
          {formatBytes(doc.size)}{doc.uploaded_by ? ` · ${doc.uploaded_by}` : ''}
        </p>
      </div>
      <button onClick={() => handleDownload(doc)} className="p-2 text-[#004C6C] hover:bg-white rounded-lg" title="Descargar">
        <Download size={15} />
      </button>
      {canDelete && (
        <button onClick={() => handleDelete(doc)} disabled={deletingId === doc.id}
          className="p-2 text-red-400 hover:bg-white rounded-lg disabled:opacity-50" title="Eliminar">
          {deletingId === doc.id ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
        </button>
      )}
    </li>
  );

  const uploadButton = (key: string, folder: string, documentType?: string) =>
    canUpload && (
      <button
        onClick={() => pickFiles(folder, documentType)}
        disabled={uploadingKey !== null}
        className="flex items-center gap-1 text-[11px] font-bold text-white bg-[#EE9D4C] hover:bg-[#e08a35] px-3 py-1.5 rounded-lg transition-all disabled:opacity-50"
      >
        {uploadingKey === key ? <Loader2 size={12} className="animate-spin" /> : <Upload size={12} />}
        Subir
      </button>
    );

  const statusBadge = (missing: boolean, required: boolean) =>
    missing ? (
      <span className="flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-orange-600 bg-orange-50 px-2 py-1 rounded-lg">
        <AlertTriangle size={11} /> Falta
      </span>
    ) : required ? (
      <span className="flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-green-600 bg-green-50 px-2 py-1 rounded-lg">
        <CheckCircle2 size={11} /> Completo
      </span>
    ) : null;

  return (
    <Portal isOpen={isOpen} onClose={onClose}>
      <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
        <div className="bg-[#f8fafc] w-full max-w-5xl rounded-[40px] shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
          <div className="bg-white p-8 border-b border-slate-100 flex items-center justify-between gap-4">
            <div className="flex items-center gap-4 min-w-0">
              <div className="h-12 w-12 bg-blue-50 text-[#004C6C] rounded-2xl flex items-center justify-center shrink-0">
                <FolderOpen size={24} />
              </div>
              <div className="min-w-0">
                <h2 className="text-2xl font-black text-[#004C6C] tracking-tight truncate">
                  Adjuntos {contract ? `· ${contract.contract_code}` : ''}
                </h2>
                <div className="flex items-center gap-3 mt-0.5 min-w-0">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate" title={contract?.s3_path ?? ''}>
                    {contract ? (contract.s3_path ?? 'Sin carpeta: se crea al subir el primer archivo') : 'Cargando...'}
                  </p>
                  {contract && canLinkFolders && (
                    <button onClick={() => setPickerTarget({ kind: 'contract' })}
                      className="flex items-center gap-1 text-[10px] font-black text-[#004C6C] hover:underline shrink-0">
                      <FolderSearch size={12} /> {contract.s3_path ? 'Cambiar carpeta' : 'Asociar carpeta existente'}
                    </button>
                  )}
                </div>
              </div>
            </div>
            <button onClick={onClose} className="p-3 text-slate-300 hover:bg-slate-50 rounded-2xl transition-all cursor-pointer">
              <X size={24} />
            </button>
          </div>

          <input ref={fileInputRef} type="file" multiple className="hidden" onChange={handleFilesSelected} />

          <div className="p-8 overflow-y-auto flex-1">
            {loading && !contract ? (
              <div className="flex justify-center py-20 text-slate-400"><Loader2 className="animate-spin" /></div>
            ) : contract && catalogs ? (
              <>
                <p className="mb-4 text-[11px] font-bold text-slate-400">
                  Tamaño máximo por envío: {catalogs.max_upload_mb} MB.
                </p>

                {contract.missing_documents.length > 0 && (
                  <div className="mb-6 p-4 bg-orange-50 border border-orange-100 rounded-2xl text-xs font-bold text-orange-700 flex items-start gap-2">
                    <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                    <span>Faltan adjuntos: {contract.missing_documents.map((m) => m.label).join(', ')}.</span>
                  </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                  {catalogs.folders.map((folder) => {
                    const folderDocs = documents.filter((d) => d.folder === folder.key);

                    if (folder.key === 'legal') {
                      const hasMissing = catalogs.legal_documents.some((ld) => missingKeys.has(`legal.${ld.key}`));
                      return (
                        <div key={folder.key} className="bg-white rounded-3xl border border-slate-100 p-5 space-y-4 lg:col-span-2">
                          <div className="flex items-center justify-between">
                            <h3 className="font-black text-[#004C6C] text-sm tracking-tight">{folder.name}</h3>
                            {statusBadge(hasMissing, true)}
                          </div>
                          {linkControls(folder.key, folder.name)}
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {catalogs.legal_documents.map((ld) => {
                              const key = `legal.${ld.key}`;
                              const docs = folderDocs.filter((d) => d.document_type === ld.key);
                              return (
                                <div key={ld.key} className="border border-slate-100 rounded-2xl p-3 space-y-2">
                                  <div className="flex items-center justify-between gap-2">
                                    <span className="text-xs font-black text-slate-600">{ld.label}</span>
                                    <div className="flex items-center gap-2">
                                      {statusBadge(missingKeys.has(key), false)}
                                      {uploadButton(key, 'legal', ld.key)}
                                    </div>
                                  </div>
                                  <ul className="space-y-1.5">{docs.map(renderFile)}</ul>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    }

                    const required = catalogs.required_folders.includes(folder.key)
                      || contract.missing_documents.some((m) => m.key === folder.key);
                    return (
                      <div key={folder.key} className="bg-white rounded-3xl border border-slate-100 p-5 space-y-3">
                        <div className="flex items-center justify-between gap-2">
                          <h3 className="font-black text-[#004C6C] text-sm tracking-tight">{folder.name}</h3>
                          <div className="flex items-center gap-2">
                            {statusBadge(missingKeys.has(folder.key), required)}
                            {uploadButton(folder.key, folder.key)}
                          </div>
                        </div>
                        {linkControls(folder.key, folder.name)}
                        {folderDocs.length > 0 ? (
                          <ul className="space-y-1.5">{folderDocs.map(renderFile)}</ul>
                        ) : (
                          <p className="text-xs font-bold text-slate-300 italic">Sin archivos</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </>
            ) : null}
          </div>
        </div>
      </div>

      <S3FolderPickerModal
        isOpen={pickerTarget !== null}
        onClose={() => setPickerTarget(null)}
        onSelect={handlePickFolder}
        contractId={contractId}
        title={pickerTarget?.kind === 'folder' ? `Vincular ${pickerTarget.name}` : 'Carpeta del contrato'}
        description={pickerTarget?.kind === 'folder'
          ? 'Los archivos de esta carpeta (y sus subcarpetas) quedarán como adjuntos de este tipo, y lo que se suba aquí se guardará en ella.'
          : 'Los adjuntos se tomarán de esta carpeta y lo que se suba irá a sus subcarpetas. No se mueve ni se borra ningún archivo.'}
        initialPath={pickerTarget?.kind === 'folder'
          ? (folderLinks[pickerTarget.key] ?? contract?.s3_path)
          : (contract?.s3_path ? contract.s3_path.split('/').slice(0, -1).join('/') : null)}
      />
    </Portal>
  );
};
