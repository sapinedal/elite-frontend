import React from 'react';
import { MoreVertical } from 'lucide-react';

export interface ActionMenuItem {
  key: string;
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  danger?: boolean;
  hidden?: boolean;
}

/** Menú "⋮" de las tarjetas y filas del repositorio documental */
export const ActionMenu: React.FC<{ items: ActionMenuItem[]; className?: string }> = ({ items, className = '' }) => {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);
  const visible = items.filter((i) => !i.hidden);

  React.useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);

  if (visible.length === 0) return null;

  return (
    <div className={`relative ${className}`} ref={ref} onClick={(e) => e.stopPropagation()} onDoubleClick={(e) => e.stopPropagation()}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label="Más acciones"
        className={`h-8 w-8 rounded-xl flex items-center justify-center transition-colors ${
          open ? 'bg-slate-100 text-slate-700' : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
        }`}
      >
        <MoreVertical className="w-4 h-4" />
      </button>

      {open && (
        <div className="absolute right-0 top-9 w-52 bg-white border border-slate-100 rounded-2xl shadow-xl p-1.5 z-30 animate-in fade-in zoom-in-95 duration-150">
          {visible.map((item, idx) => {
            const separate = item.danger && idx > 0 && !visible[idx - 1].danger;
            return (
              <React.Fragment key={item.key}>
                {separate && <div className="my-1 border-t border-slate-100" />}
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    item.onClick();
                  }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold transition-colors ${
                    item.danger ? 'text-rose-600 hover:bg-rose-50' : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span className="w-4 h-4 flex items-center justify-center shrink-0">{item.icon}</span>
                  <span className="truncate">{item.label}</span>
                </button>
              </React.Fragment>
            );
          })}
        </div>
      )}
    </div>
  );
};
