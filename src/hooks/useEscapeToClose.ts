import { useEffect, useRef } from 'react';

/**
 * Cierre de modales con la tecla Escape.
 *
 * Los modales abiertos forman una pila: Escape cierra solo el de arriba (ej. el historial abierto sobre el
 * detalle de un corte). Un componente interno que ya usó Escape (un desplegable abierto) llama a
 * e.preventDefault() y el modal no se cierra.
 */
type Entry = { close: () => void };

const stack: Entry[] = [];

const handleKeyDown = (e: KeyboardEvent) => {
  if (e.key !== 'Escape' || e.defaultPrevented || stack.length === 0) return;
  e.preventDefault();
  stack[stack.length - 1].close();
};

export function useEscapeToClose(isOpen: boolean, onClose?: () => void) {
  // La función más reciente, sin volver a registrar el modal en cada render
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  const enabled = isOpen && Boolean(onClose);

  useEffect(() => {
    if (!enabled) return;

    const entry: Entry = { close: () => onCloseRef.current?.() };
    stack.push(entry);
    if (stack.length === 1) window.addEventListener('keydown', handleKeyDown);

    return () => {
      const index = stack.indexOf(entry);
      if (index >= 0) stack.splice(index, 1);
      if (stack.length === 0) window.removeEventListener('keydown', handleKeyDown);
    };
  }, [enabled]);
}
