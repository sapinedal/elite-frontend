import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useLocation, useNavigate } from 'react-router-dom';
import { PlusCircle, ChevronRight, Plus } from 'lucide-react';
import { REGISTRO_ACTIONS, type RegistroAction } from '../config/registroActions';
import { NEW_QUERY_PARAM } from '../hooks/useNewFromQuery';

interface RegistroMenuProps {
  userPermissions: string[];
  /** Al elegir un registro (cierra el menú móvil) */
  onNavigate: () => void;
}

const CLOSE_DELAY_MS = 180;
const MENU_WIDTH = 256; // w-64
const SCREEN_MARGIN = 12;

/**
 * Submódulo "Registro" del Sidebar: al pasar el mouse (o al tocarlo) abre una ventana emergente pequeña con los
 * módulos de registro (Corte, Entrada, Anticipo, Cuenta de cobro). Cada uno se muestra a quien puede verlo y lleva a
 * su página; el botón + abre directamente el formulario a quien puede registrar.
 * Se dibuja en un portal para no quedar recortada por el Sidebar.
 */
export const RegistroMenu: React.FC<RegistroMenuProps> = ({ userPermissions, onNavigate }) => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const triggerRef = useRef<HTMLDivElement>(null);
  const closeTimer = useRef<number | null>(null);
  const [position, setPosition] = useState<{ top: number; left: number; width: number } | null>(null);

  const actions = REGISTRO_ACTIONS.filter((a) => userPermissions.includes(a.viewPermission));
  const activeAction = actions.find((a) => pathname === a.href);

  const cancelClose = () => {
    if (closeTimer.current) window.clearTimeout(closeTimer.current);
    closeTimer.current = null;
  };

  const open = () => {
    cancelClose();
    const rect = triggerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const estimatedHeight = 48 + actions.length * 52;
    const fitsRight = rect.right + 10 + MENU_WIDTH + SCREEN_MARGIN <= window.innerWidth;

    setPosition(fitsRight
      // Escritorio: a la derecha del Sidebar, sin salirse de la pantalla por abajo
      ? {
          left: rect.right + 10,
          top: Math.max(SCREEN_MARGIN, Math.min(rect.top - 8, window.innerHeight - estimatedHeight - SCREEN_MARGIN)),
          width: MENU_WIDTH,
        }
      // Celular (Sidebar a pantalla completa): debajo de Registro y del mismo ancho, dentro de la pantalla
      : {
          left: Math.max(SCREEN_MARGIN, rect.left),
          top: Math.min(rect.bottom + 6, window.innerHeight - estimatedHeight - SCREEN_MARGIN),
          width: Math.min(rect.width, window.innerWidth - 2 * SCREEN_MARGIN),
        });
  };

  const scheduleClose = () => {
    cancelClose();
    closeTimer.current = window.setTimeout(() => setPosition(null), CLOSE_DELAY_MS);
  };

  // Escape o clic fuera cierran la ventana
  useEffect(() => {
    if (!position) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setPosition(null);
    const onClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (!triggerRef.current?.contains(target) && !document.getElementById('registro-menu')?.contains(target)) setPosition(null);
    };
    window.addEventListener('keydown', onKey);
    window.addEventListener('mousedown', onClick);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('mousedown', onClick);
    };
  }, [position]);

  useEffect(() => cancelClose, []);

  if (actions.length === 0) return null;

  const choose = (action: RegistroAction, create = false) => {
    setPosition(null);
    navigate(create ? `${action.href}?${NEW_QUERY_PARAM}=1` : action.href);
    onNavigate();
  };

  return (
    <>
      <div
        ref={triggerRef}
        // Pasar el mouse abre la ventana; en pantallas táctiles se abre y cierra tocando (sin esto, el toque
        // dispara a la vez la entrada del puntero y el clic, y la ventana se abre y se cierra sola)
        onPointerEnter={(e) => e.pointerType === 'mouse' && open()}
        onPointerLeave={(e) => e.pointerType === 'mouse' && scheduleClose()}
        onClick={() => (position ? setPosition(null) : open())}
        role="button"
        aria-haspopup="menu"
        aria-expanded={position !== null}
        className={`flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-200
          ${activeAction ? 'bg-white/10 text-white font-black' : position ? 'bg-[#005981]/50 text-white font-bold' : 'text-slate-400 hover:bg-[#005981]/50 hover:text-white font-bold'}`}
      >
        <div className="flex items-center min-w-0">
          <span className="text-[#EE9D4C] mr-3 ml-2"><PlusCircle className="w-4 h-4" /></span>
          <span className="text-sm truncate tracking-tight">Registro{activeAction ? ` · ${activeAction.label}` : ''}</span>
        </div>
        <ChevronRight className="w-4 h-4 opacity-40" />
      </div>

      {position && createPortal(
        <div
          id="registro-menu"
          role="menu"
          onPointerEnter={(e) => e.pointerType === 'mouse' && cancelClose()}
          onPointerLeave={(e) => e.pointerType === 'mouse' && scheduleClose()}
          style={{ top: position.top, left: position.left, width: position.width }}
          className="fixed z-[9999] max-w-[calc(100vw-24px)] bg-gradient-to-br from-[#F4B467] via-[#EE9D4C] to-[#D9832F] rounded-3xl shadow-2xl shadow-orange-950/30 border border-white/20 p-2 animate-in fade-in zoom-in-95 duration-150"
        >
          <p className="px-3 pt-2 pb-1.5 text-[10px] font-black text-white/70 uppercase tracking-widest">Registro</p>
          {actions.map((action) => {
            const isActive = activeAction?.id === action.id;
            const canCreate = userPermissions.includes(action.createPermission);
            return (
              <div key={action.id} className={`flex items-center gap-1 rounded-2xl transition-colors group ${isActive ? 'bg-white/25' : 'hover:bg-white/15'}`}>
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => choose(action)}
                  className="flex-1 min-w-0 flex items-center gap-3 px-3 py-2.5 text-left outline-none rounded-2xl focus-visible:bg-white/15"
                >
                  <span className={`h-9 w-9 shrink-0 rounded-xl flex items-center justify-center transition-colors ${isActive ? 'bg-[#004C6C] text-white' : 'bg-white/90 text-[#004C6C] group-hover:bg-[#004C6C] group-hover:text-white'}`}>
                    {action.icon}
                  </span>
                  <span className="text-sm font-black text-white truncate">{action.label}</span>
                </button>
                {canCreate && (
                  <button
                    type="button"
                    onClick={() => choose(action, true)}
                    title={`Nuevo: ${action.label.toLowerCase()}`}
                    aria-label={`Registrar ${action.label.toLowerCase()}`}
                    className="mr-2 h-8 w-8 shrink-0 rounded-xl flex items-center justify-center bg-white/20 text-white hover:bg-white hover:text-[#D9832F] transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                )}
              </div>
            );
          })}
        </div>,
        document.body
      )}
    </>
  );
};
