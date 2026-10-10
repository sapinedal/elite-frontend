import { useState, useEffect } from 'react';
import { X, FileText, ExternalLink, RefreshCw, Folder, CloudCheck, ShieldAlert } from 'lucide-react';
import api from '../../../lib/axios';

interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  webViewLink: string;
  thumbnailLink?: string | null;
}

interface DriveExplorerModalProps {
  isOpen: boolean;
  onClose: () => void;
  folderId?: string;
  contractName?: string;
}

export function DriveExplorerModal({ isOpen, onClose, folderId = '1YIUcRPuGpLlfvX_XSymzjekEy4jAqlwD', contractName }: DriveExplorerModalProps) {
  const [files, setFiles] = useState<DriveFile[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [isConfigured, setIsConfigured] = useState<boolean>(true);

  useEffect(() => {
    if (isOpen && folderId) {
      fetchFolderFiles();
    }
  }, [isOpen, folderId]);

  const fetchFolderFiles = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/v1/juridica/drive/folders/${folderId}`);

      if (response.data && response.data.data) {
        setFiles(response.data.data);
        setIsConfigured(response.data.is_configured ?? true);
      }
    } catch (error) {
      console.warn('Error fetching Drive files, fallback simulation active:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden border border-slate-100 flex flex-col max-h-[85vh] animate-fade-in">
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-[#004C6C] to-[#005981] text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/10 rounded-2xl">
              <Folder className="w-6 h-6 text-[#EE9D4C]" />
            </div>
            <div>
              <h3 className="text-lg font-black tracking-tight">Explorador de Documentos Google Drive API</h3>
              <p className="text-xs text-blue-200 font-bold">{contractName || 'Carpeta de Expediente Digital'}</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-xl text-white/60 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Status Bar */}
        <div className="px-6 py-3 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            {isConfigured ? (
              <span className="flex items-center gap-1.5 font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                <CloudCheck size={14} className="text-emerald-600" />
                API Oficial Google Drive Conectada
              </span>
            ) : (
              <span className="flex items-center gap-1.5 font-bold text-amber-700 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
                <ShieldAlert size={14} className="text-amber-600" />
                Modo Simulación (Agregue google-drive-key.json)
              </span>
            )}
          </div>

          <button
            onClick={fetchFolderFiles}
            disabled={loading}
            className="flex items-center gap-1.5 text-slate-500 hover:text-[#004C6C] font-bold transition-colors"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Actualizar
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-3 flex-1">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center space-y-3 text-slate-400">
              <RefreshCw size={32} className="animate-spin text-[#004C6C]" />
              <p className="text-xs font-bold uppercase tracking-wider">Sincronizando con Google Drive...</p>
            </div>
          ) : files.length === 0 ? (
            <div className="py-12 text-center text-slate-400 space-y-2">
              <Folder size={40} className="mx-auto text-slate-300" />
              <p className="text-sm font-bold">No se encontraron archivos en esta carpeta.</p>
            </div>
          ) : (
            files.map((file) => (
              <div
                key={file.id}
                className="p-4 bg-slate-50 hover:bg-slate-100/80 rounded-2xl border border-slate-200 transition-colors flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="p-2.5 bg-blue-100 text-[#004C6C] rounded-xl shrink-0">
                    <FileText size={20} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-black text-slate-900 truncate">{file.name}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{file.mimeType}</p>
                  </div>
                </div>

                <a
                  href={file.webViewLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-2 bg-[#004C6C] hover:bg-[#EE9D4C] text-white font-bold text-xs rounded-xl transition-colors flex items-center gap-1.5 shrink-0 shadow-xs"
                >
                  Ver PDF
                  <ExternalLink size={14} />
                </a>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-white border border-slate-200 text-slate-600 font-bold rounded-xl text-xs hover:bg-slate-100 transition-colors"
          >
            Cerrar Explorador
          </button>
        </div>
      </div>
    </div>
  );
}
