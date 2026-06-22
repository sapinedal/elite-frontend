import React, { useRef, useState, useEffect } from 'react';
import { Trash2, PenTool, X, Check } from 'lucide-react';
import { Portal } from './Portal';

interface SignaturePadProps {
  label: string;
  placeholder?: string;
  value: string | null;
  onChange: (signature: string | null) => void;
  height?: number;
}

export const SignaturePad: React.FC<SignaturePadProps> = ({
  label,
  placeholder = 'Haga clic aquí para firmar',
  value,
  onChange,
  height = 150,
}) => {
  const [isModalOpen, setIsOpen] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDrawingRef = useRef(false);
  const [isEmpty, setIsEmpty] = useState(!value);

  // Set canvas resolution to match its visible size inside the modal
  const resizeCanvas = () => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const rect = container.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;

    // Set styling for signature strokes
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.strokeStyle = '#004C6C'; // Matching brand color
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
    }
  };

  // Resize canvas when modal opens
  useEffect(() => {
    if (!isModalOpen) return;

    const timer = setTimeout(() => {
      resizeCanvas();
    }, 50);

    window.addEventListener('resize', resizeCanvas);
    return () => {
      window.removeEventListener('resize', resizeCanvas);
      clearTimeout(timer);
    };
  }, [isModalOpen]);

  const getCoordinates = (e: MouseEvent | TouchEvent | React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();

    let clientX, clientY;
    if ('touches' in e) {
      if (e.touches.length === 0) return null;
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
  };

  const startDrawing = (coords: { x: number; y: number }) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.beginPath();
    ctx.moveTo(coords.x, coords.y);

    isDrawingRef.current = true;
    setIsEmpty(false);
  };

  const draw = (coords: { x: number; y: number }) => {
    if (!isDrawingRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.lineTo(coords.x, coords.y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    isDrawingRef.current = false;
  };

  // Bind native touch events inside the modal to support { passive: false } and prevent scroll issues
  useEffect(() => {
    if (!isModalOpen) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleTouchStart = (e: TouchEvent) => {
      e.preventDefault();
      const coords = getCoordinates(e);
      if (coords) startDrawing(coords);
    };

    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      const coords = getCoordinates(e);
      if (coords) draw(coords);
    };

    const handleTouchEnd = (e: TouchEvent) => {
      e.preventDefault();
      stopDrawing();
    };

    canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
    canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
    canvas.addEventListener('touchend', handleTouchEnd, { passive: false });

    return () => {
      canvas.removeEventListener('touchstart', handleTouchStart);
      canvas.removeEventListener('touchmove', handleTouchMove);
      canvas.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isModalOpen]);

  // Mouse handlers
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const coords = getCoordinates(e.nativeEvent);
    if (coords) startDrawing(coords);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const coords = getCoordinates(e.nativeEvent);
    if (coords) draw(coords);
  };

  const handleMouseUp = () => {
    stopDrawing();
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setIsEmpty(true);
  };

  const handleSave = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (isEmpty) {
      onChange(null);
    } else {
      onChange(canvas.toDataURL('image/png'));
    }
    setIsOpen(false);
  };

  const handleCancel = () => {
    setIsOpen(false);
  };

  return (
    <div className="space-y-2">
      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
        {label}
      </label>

      {value ? (
        <div className="relative border border-slate-200 rounded-2xl bg-white p-4 flex items-center justify-center group shadow-xs animate-scale-in" style={{ height: `${height}px` }}>
          <img src={value} alt="Firma" className="max-h-full max-w-full object-contain" />
          <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 rounded-2xl flex items-center justify-center gap-3 transition-opacity">
            <button
              type="button"
              onClick={() => setIsOpen(true)}
              className="px-4 py-2 bg-white text-slate-700 rounded-xl font-bold text-xs uppercase hover:bg-slate-50 transition-all hover:scale-105 cursor-pointer"
            >
              Volver a Firmar
            </button>
            <button
              type="button"
              onClick={() => onChange(null)}
              className="px-4 py-2 bg-rose-500 text-white rounded-xl font-bold text-xs uppercase hover:bg-rose-600 transition-all hover:scale-105 cursor-pointer"
            >
              Borrar
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="w-full border-2 border-dashed border-slate-200 rounded-2xl bg-white p-6 flex flex-col items-center justify-center hover:bg-slate-50 hover:border-[#004C6C]/50 transition-all text-slate-400 gap-1.5 cursor-pointer"
          style={{ height: `${height}px` }}
        >
          <div className="p-3 bg-slate-50 rounded-full text-slate-400">
            <PenTool size={20} />
          </div>
          <span className="text-[9px] font-black uppercase tracking-wider">{placeholder}</span>
        </button>
      )}

      {/* Modal de Firma en Portal */}
      <Portal isOpen={isModalOpen}>
        <div className="fixed inset-0 z-99999 flex items-center justify-center sm:p-4 bg-slate-950/60 sm:backdrop-blur-xs animate-fade-in">
          <div className="bg-[#f8fafc] w-full h-full sm:h-auto sm:max-h-[90vh] sm:max-w-lg rounded-none sm:rounded-[32px] shadow-2xl overflow-hidden flex flex-col p-6 space-y-4 animate-scale-in">
            
            {/* Header del Modal */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-black text-[#004C6C] tracking-wide uppercase">{label}</h3>
                <p className="text-[9px] text-slate-400 font-bold mt-0.5">Captura de firma digital segura</p>
              </div>
              <button 
                onClick={handleCancel}
                className="p-2 text-slate-300 hover:text-slate-500 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Area de Lienzo (Canvas) */}
            <div className="flex flex-col flex-1 sm:flex-initial space-y-1">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Área de Trazado</span>
              <div 
                ref={containerRef}
                className="relative bg-white border border-slate-200 rounded-2xl overflow-hidden cursor-crosshair shadow-sm select-none flex-1 sm:flex-initial sm:h-[240px]"
              >
                <canvas
                  ref={canvasRef}
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                  className="absolute inset-0 w-full h-full block touch-none"
                />

                {isEmpty && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-slate-300 select-none gap-2">
                    <PenTool size={24} className="opacity-40" />
                    <span className="font-bold text-xs">Firme aquí (Mouse o Táctil)</span>
                  </div>
                )}

                {/* Línea guía simulada */}
                <div className="absolute left-6 right-6 bottom-10 border-b border-dashed border-slate-200 pointer-events-none" />
              </div>
            </div>

            {/* Footer de Acciones del Modal */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-100 gap-3">
              <button
                type="button"
                onClick={clearCanvas}
                disabled={isEmpty}
                className="flex items-center gap-1.5 px-4 py-3 bg-white text-rose-500 hover:bg-rose-50 border border-slate-200 disabled:opacity-40 disabled:hover:bg-white rounded-xl font-bold text-xs uppercase tracking-wider transition-all cursor-pointer"
              >
                <Trash2 size={14} />
                Limpiar
              </button>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-5 py-3 bg-slate-100 text-slate-500 hover:bg-slate-200 rounded-xl font-bold text-xs uppercase tracking-wider transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  className="flex items-center gap-1.5 px-6 py-3 bg-[#004C6C] hover:bg-[#003a53] text-white rounded-xl font-black text-xs uppercase tracking-wider transition-all shadow-md cursor-pointer"
                >
                  <Check size={14} />
                  Guardar Firma
                </button>
              </div>
            </div>

          </div>
        </div>
      </Portal>
    </div>
  );
};
