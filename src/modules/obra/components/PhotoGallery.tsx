import React, { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Camera, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useEscapeToClose } from '../../../hooks/useEscapeToClose';
import type { InterventoriaFoto } from '../types';

/**
 * Registro fotográfico del informe: cuadrícula de miniaturas y visor a pantalla completa
 * (flechas del teclado para navegar, Escape para cerrar).
 */
export const PhotoGallery: React.FC<{ photos: InterventoriaFoto[]; numero: number }> = ({ photos, numero }) => {
  const [open, setOpen] = useState<number | null>(null);
  const close = useCallback(() => setOpen(null), []);
  useEscapeToClose(open !== null, close);

  const move = useCallback(
    (delta: number) => setOpen((current) => (current === null ? null : (current + delta + photos.length) % photos.length)),
    [photos.length]
  );

  useEffect(() => {
    if (open === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') move(1);
      if (e.key === 'ArrowLeft') move(-1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, move]);

  return (
    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-5 md:p-6 space-y-4">
      <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <h3 className="text-lg font-black text-[#004C6C] flex items-center gap-2">
          <Camera size={18} /> Registro fotográfico
        </h3>
        <span className="text-[11px] font-bold text-slate-400">{photos.length} foto{photos.length === 1 ? '' : 's'}</span>
      </div>

      {photos.length === 0 ? (
        <p className="text-xs font-bold text-slate-400 text-center py-6">Este informe no trae registro fotográfico.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
          {photos.map((photo, i) => (
            <button
              key={photo.archivo}
              type="button"
              onClick={() => setOpen(i)}
              className="group relative aspect-[4/3] rounded-2xl overflow-hidden bg-slate-100 border border-slate-100 focus:outline-none focus-visible:ring-4 focus-visible:ring-sky-100"
              title={`Ver foto ${i + 1}`}
            >
              <img
                src={photo.url}
                alt={`Registro fotográfico del informe ${numero}, foto ${i + 1}`}
                loading="lazy"
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            </button>
          ))}
        </div>
      )}

      {open !== null &&
        createPortal(
          <div
            className="fixed inset-0 z-[10000] bg-slate-950/90 flex items-center justify-center p-4 animate-in fade-in duration-150"
            onMouseDown={(e) => e.target === e.currentTarget && close()}
            role="dialog"
            aria-modal="true"
            aria-label="Registro fotográfico"
          >
            <button type="button" onClick={close} className="absolute top-4 right-4 p-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white" title="Cerrar">
              <X size={22} />
            </button>
            {photos.length > 1 && (
              <>
                <button type="button" onClick={() => move(-1)} className="absolute left-3 md:left-6 p-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white" title="Anterior">
                  <ChevronLeft size={24} />
                </button>
                <button type="button" onClick={() => move(1)} className="absolute right-3 md:right-6 p-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white" title="Siguiente">
                  <ChevronRight size={24} />
                </button>
              </>
            )}
            <figure className="max-w-5xl w-full flex flex-col items-center gap-3">
              <img
                src={photos[open].url}
                alt={`Registro fotográfico del informe ${numero}, foto ${open + 1}`}
                className="max-h-[80vh] w-auto max-w-full rounded-2xl shadow-2xl object-contain bg-black"
              />
              <figcaption className="text-xs font-bold text-white/70">
                Foto {open + 1} de {photos.length} · Informe N° {numero}
              </figcaption>
            </figure>
          </div>,
          document.body
        )}
    </div>
  );
};
