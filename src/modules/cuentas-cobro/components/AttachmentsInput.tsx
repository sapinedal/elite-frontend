import React, { useRef } from 'react';
import { Paperclip, Trash2, UploadCloud } from 'lucide-react';
import { formatBytes } from '../../cortes/utils/format';

interface AttachmentsInputProps {
  files: File[];
  onChange: (files: File[]) => void;
  maxMb: number;
  onError: (message: string | null) => void;
  disabled?: boolean;
  hint: string;
}

/**
 * Varios adjuntos: arrastrar, elegir o pegar capturas (Ctrl+V), con la lista para quitar los que sobren.
 */
export const AttachmentsInput: React.FC<AttachmentsInputProps> = ({ files, onChange, maxMb, onError, disabled, hint }) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const add = (list: FileList | File[] | null) => {
    if (!list || !list.length) return;
    const all = Array.from(list);
    const valid = all.filter((f) => f.size <= maxMb * 1024 * 1024);
    onError(valid.length < all.length ? `Se omitieron archivos que superan ${maxMb} MB.` : null);
    onChange([...files, ...valid.filter((f) => !files.some((p) => p.name === f.name && p.size === f.size))]);
  };

  return (
    <div className="space-y-2" onPaste={(e) => {
      const pasted = Array.from(e.clipboardData.files).map((f, i) =>
        f.name === 'image.png' ? new File([f], `captura-${Date.now()}-${i + 1}.png`, { type: f.type }) : f);
      if (pasted.length) add(pasted);
    }}>
      <div onClick={() => !disabled && inputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => { e.preventDefault(); if (!disabled) add(e.dataTransfer.files); }}
        tabIndex={0}
        className="border-2 border-dashed border-slate-300 hover:border-[#004C6C]/60 hover:bg-blue-50/30 rounded-3xl p-4 flex flex-col items-center justify-center gap-1 text-center cursor-pointer bg-slate-50 transition-all outline-none focus:border-[#004C6C]">
        <input ref={inputRef} type="file" multiple className="hidden" accept=".pdf,.png,.jpg,.jpeg,.webp,.xlsx,.xls,.zip"
          onChange={(e) => { add(e.target.files); e.target.value = ''; }} />
        <UploadCloud size={22} className="text-slate-400" />
        <p className="text-sm font-bold text-slate-500">{hint}</p>
      </div>
      {files.length > 0 && (
        <ul className="space-y-1.5">
          {files.map((file, i) => (
            <li key={`${file.name}-${i}`} className="flex items-center justify-between gap-2 bg-white rounded-xl border border-slate-100 px-3 py-2">
              <span className="flex items-center gap-2 min-w-0">
                <Paperclip size={14} className="text-slate-400 shrink-0" />
                <span className="text-xs font-bold text-slate-700 truncate">{file.name}</span>
                <span className="text-[11px] font-bold text-slate-400 shrink-0">{formatBytes(file.size)}</span>
              </span>
              <button type="button" disabled={disabled} onClick={() => onChange(files.filter((_, j) => j !== i))}
                className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50" title="Quitar">
                <Trash2 size={14} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
