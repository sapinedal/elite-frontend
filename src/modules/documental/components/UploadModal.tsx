import React, { useState, useRef } from 'react';
import { UploadCloud, X, File, Trash2, Loader2, CheckCircle2 } from 'lucide-react';

interface UploadModalProps {
  isOpen: boolean;
  targetPath: string;
  onClose: () => void;
  onSubmit: (files: File[]) => Promise<void>;
}

export const UploadModal: React.FC<UploadModalProps> = ({
  isOpen,
  targetPath,
  onClose,
  onSubmit,
}) => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFiles = (fileList: FileList | null) => {
    if (!fileList) return;
    const newFiles = Array.from(fileList);
    // Verificar límite de 100MB por archivo
    const oversized = newFiles.filter((f) => f.size > 100 * 1024 * 1024);
    if (oversized.length > 0) {
      setError(`El archivo "${oversized[0].name}" excede el límite máximo de 100MB.`);
      return;
    }
    setError(null);
    setSelectedFiles((prev) => [...prev, ...newFiles]);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const formatSize = (bytes: number) => {
    if (bytes <= 0) return '0 B';
    const units = ['B', 'KB', 'MB', 'GB'];
    const p = Math.floor(Math.log(bytes) / Math.log(1024));
    return (bytes / Math.pow(1024, p)).toFixed(1) + ' ' + units[p];
  };

  const handleSubmit = async () => {
    if (selectedFiles.length === 0) return;
    try {
      setIsSubmitting(true);
      setError(null);
      await onSubmit(selectedFiles);
      setSelectedFiles([]);
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Error al subir los archivos');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-blue-50 text-blue-600 border border-blue-100">
              <UploadCloud className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Subir Archivos al Space</h3>
              <p className="text-xs text-slate-400 truncate max-w-xs">
                Destino: {targetPath || 'Raíz del Space'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {error && (
            <div className="p-3 text-xs font-semibold text-rose-600 bg-rose-50 border border-rose-100 rounded-xl">
              {error}
            </div>
          )}

          {/* Dropzone */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-3xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
              isDragging
                ? 'border-[#EE9D4C] bg-orange-50/50 scale-[0.99]'
                : 'border-slate-200 hover:border-[#004C6C] bg-slate-50/50 hover:bg-slate-50'
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              multiple
              onChange={(e) => handleFiles(e.target.files)}
              className="hidden"
            />
            <div className="w-14 h-14 rounded-2xl bg-white shadow-sm border border-slate-100 flex items-center justify-center mb-3">
              <UploadCloud className="w-7 h-7 text-[#004C6C]" />
            </div>
            <p className="text-sm font-bold text-slate-800">
              Arrastra archivos aquí o <span className="text-[#EE9D4C]">explora tu equipo</span>
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Soporta documentos PDF, Word, Excel, planos, imágenes y archivos comprimidos (máx. 100MB cada uno).
            </p>
          </div>

          {/* Selected Files List */}
          {selectedFiles.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-600">
                <span>Archivos seleccionados ({selectedFiles.length})</span>
                <span>
                  Total: {formatSize(selectedFiles.reduce((acc, f) => acc + f.size, 0))}
                </span>
              </div>

              <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                {selectedFiles.map((file, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-200/60 rounded-xl text-xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <File className="w-4 h-4 text-blue-500 shrink-0" />
                      <span className="font-semibold text-slate-700 truncate">{file.name}</span>
                      <span className="text-[11px] text-slate-400 shrink-0">({formatSize(file.size)})</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFile(idx)}
                      className="p-1 text-slate-400 hover:text-rose-500 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-slate-100 bg-slate-50/50 shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting || selectedFiles.length === 0}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-[#004C6C] hover:bg-[#003952] disabled:opacity-50 transition-all shadow-md shadow-sky-950/20"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Subiendo {selectedFiles.length} archivo(s)...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Subir {selectedFiles.length > 0 ? `(${selectedFiles.length})` : ''}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
