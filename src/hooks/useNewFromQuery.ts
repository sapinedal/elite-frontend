import { useCallback } from 'react';
import { useLocation, useResolvedPath, useSearchParams } from 'react-router-dom';

export const NEW_QUERY_PARAM = 'nuevo';

/**
 * "?nuevo=1" en la URL pide abrir el formulario de registro del módulo (lo usa el menú Registro del Sidebar).
 * Devuelve si se pidió y una función para quitarlo de la URL al cerrar el formulario. Se deriva de la URL
 * (no se copia a un estado), así funciona aunque el usuario ya esté en la página.
 *
 * Solo responde si la URL es la de la propia página: durante la transición la página anterior sigue montada un
 * instante y, sin esta comprobación, abriría su formulario al ver ?nuevo=1 de la página de destino.
 */
export function useNewFromQuery(): [boolean, () => void] {
  const [searchParams, setSearchParams] = useSearchParams();
  const { pathname } = useLocation();
  const ownPath = useResolvedPath('.').pathname;
  const wantsNew = searchParams.get(NEW_QUERY_PARAM) === '1' && pathname.replace(/\/$/, '') === ownPath.replace(/\/$/, '');

  const clear = useCallback(() => {
    setSearchParams((prev) => {
      if (!prev.has(NEW_QUERY_PARAM)) return prev;
      const next = new URLSearchParams(prev);
      next.delete(NEW_QUERY_PARAM);
      return next;
    }, { replace: true });
  }, [setSearchParams]);

  return [wantsNew, clear];
}
