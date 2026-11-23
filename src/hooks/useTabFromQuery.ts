import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

export const TAB_QUERY_PARAM = 'tab';

/**
 * "?tab=<pestaña>" en la URL abre esa pestaña del módulo (lo usan los correos, ej. la aprobación de Contabilidad:
 * /app/contratacion/cortes?corte=12&tab=accounting abre el corte sobre la lista de pendientes por aprobar).
 * Se aplica cuando la pestaña existe para el usuario (las pestañas dependen de los catálogos) y luego se quita de
 * la URL, para que el usuario pueda cambiar de pestaña libremente.
 */
export function useTabFromQuery(tabIds: string[], setScope: (id: string) => void): void {
  const [searchParams, setSearchParams] = useSearchParams();
  const requested = searchParams.get(TAB_QUERY_PARAM);
  const available = requested !== null && tabIds.includes(requested);

  useEffect(() => {
    if (!requested || !available) return;
    setScope(requested);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.delete(TAB_QUERY_PARAM);
      return next;
    }, { replace: true });
  }, [requested, available, setScope, setSearchParams]);
}
