import React from 'react';
import { X, Download, ExternalLink, FileText, AlertCircle } from 'lucide-react';
import type { FileItem } from '../types/documental.types';

interface FilePreviewModalProps {
  isOpen: boolean;
  file: FileItem | null;
  onClose: () => void;
  onDownload: (file: FileItem) => void;
}

export const FilePreviewModal: React.FC<FilePreviewModalProps> = ({
  isOpen,
  file,
  onClose,
  onDownload,
}) => {
  if (!isOpen || !file) return null;

  const ext = file.extension.toLowerCase();
  const isPdf = ext === 'pdf';
  const isImage = ['png', 'jpg', 'jpeg', 'webp', 'gif', 'svg'].includes(ext);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-5xl h-[88vh] rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-4 px-6 border-b border-slate-100 shrink-0 bg-slate-50/50">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
              <FileText className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-slate-900 truncate max-w-lg" title={file.name}>
                {file.name}
              </h3>
              <p className="text-xs text-slate-400">
                {file.size_formatted} • {file.mime_type}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {file.preview_url && (
              <a
                href={file.preview_url}
                target="_blank"
                rel="noopener noreferrer"
                title="Abrir en pestaña nueva"
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-sm"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Nueva pestaña</span>
              </a>
            )}

            <button
              onClick={() => onDownload(file)}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-[#004C6C] hover:bg-[#003952] rounded-xl transition-all shadow-sm"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Descargar</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors ml-2"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Viewer Body */}
        <div className="flex-1 bg-slate-100 overflow-hidden relative flex items-center justify-center p-2">
          {file.preview_url ? (
            isPdf ? (
              <iframe
                src={`${file.preview_url}#toolbar=1`}
                title={file.name}
                className="w-full h-full rounded-2xl border border-slate-200/80 bg-white shadow-inner"
              />
            ) : isImage ? (
              <div className="w-full h-full flex items-center justify-center p-4 overflow-auto">
                <img
                  src={file.preview_url}
                  alt={file.name}
                  className="max-w-full max-h-full object-contain rounded-xl shadow-lg border border-slate-200"
                />
              </div>
            ) : (
              <div className="text-center p-8 bg-white rounded-3xl border border-slate-200 shadow-md max-w-md">
                <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-3" />
                <h4 className="text-base font-bold text-slate-800 mb-1">Previsualización no disponible</h4>
                <p className="text-xs text-slate-500 mb-4">
                  El formato .{file.extension} no soporta vista previa directa en el navegador. Puedes descargarlo directamente en tu equipo.
                </p>
                <button
                  onClick={() => onDownload(file)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-[#004C6C] hover:bg-[#003952] transition-colors"
                >
                  <Download className="w-4 h-4" />
                  <span>Descargar Archivo</span>
                </button>
              </div>
            )
          ) : (
            <div className="text-center p-8">
              <p className="text-sm font-semibold text-slate-400">Generando enlace de visualización...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
