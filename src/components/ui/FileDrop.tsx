import React, { useRef } from 'react';
import { UploadCloud, FileText } from 'lucide-react';
import { formatBytes } from '../../modules/cortes/utils/format';

interface FileDropProps {
  file: File | null;
  onSelect: (file: File) => void;
  disabled?: boolean;
  hint: string;
  progress?: number | null;
}

/**
 * Zona para arrastrar o elegir un archivo, con barra de progreso de la subida.
 */
export const FileDrop: React.FC<FileDropProps> = ({ file, onSelect, disabled, hint, progress }) => {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="space-y-2">
      <div onClick={() => !disabled && inputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => { e.preventDefault(); if (!disabled && e.dataTransfer.files[0]) onSelect(e.dataTransfer.files[0]); }}
        className="border-2 border-dashed border-slate-300 hover:border-[#004C6C]/60 hover:bg-blue-50/30 rounded-3xl p-5 flex flex-col items-center justify-center gap-1.5 text-center cursor-pointer bg-slate-50 transition-all">
        <input ref={inputRef} type="file" className="hidden" accept=".pdf,.png,.jpg,.jpeg,.xml,.zip"
          onChange={(e) => { if (e.target.files?.[0]) onSelect(e.target.files[0]); e.target.value = ''; }} />
        {file ? (
          <>
            <FileText size={24} className="text-[#004C6C]" />
            <p className="text-sm font-black text-slate-700 break-all">{file.name}</p>
            <p className="text-[11px] font-bold text-slate-400">{formatBytes(file.size)} · clic para cambiar</p>
          </>
        ) : (
          <>
            <UploadCloud size={24} className="text-slate-400" />
            <p className="text-sm font-bold text-slate-500">{hint}</p>
          </>
        )}
      </div>
      {progress !== null && progress !== undefined && (
        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
          <div className="h-full bg-[#004C6C] transition-all" style={{ width: `${progress}%` }} />
        </div>
      )}
    </div>
  );
};
