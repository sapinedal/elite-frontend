import { useState, useEffect, useCallback } from 'react';
import { anticipoService, getApiErrorMessage } from '../services/anticipoService';
import type { Anticipo, AnticipoCatalogs, AnticipoCounts, AnticipoFilters, AnticipoPayload, AnticipoScope, MultifoxPayload } from '../types';

const EMPTY_FILTERS: AnticipoFilters = { search: '', status: '', project_id: '' };

/**
 * Estado del módulo Anticipos: catálogos, pestaña activa (mis anticipos / por aprobar / contabilidad / todos),
 * filtros, paginación y las acciones del flujo (radicar, aprobar, reenviar, cargar Multifox).
 */
export function useAnticipos() {
  const [catalogs, setCatalogs] = useState<AnticipoCatalogs | null>(null);
  const [anticipos, setAnticipos] = useState<Anticipo[]>([]);
  const [counts, setCounts] = useState<AnticipoCounts>({ mine: 0, pending: 0, accounting: 0 });
  const [scope, setScopeState] = useState<AnticipoScope>('mine');
  const [filters, setFilters] = useState<AnticipoFilters>(EMPTY_FILTERS);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(15);
  const [pagination, setPagination] = useState({ total: 0, lastPage: 1 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    anticipoService.getCatalogs()
      .then((data) => {
        setCatalogs(data);
        // Quien no radica arranca en su bandeja de trabajo
        if (!data.can_create) setScopeState(data.review_stages.length ? 'pending' : data.can_contabilizar ? 'accounting' : 'mine');
      })
      .catch((err) => setError(getApiErrorMessage(err, 'Error al cargar los catálogos.')));
  }, []);

  const fetchAnticipos = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, unknown> = { page, per_page: perPage };
      if (filters.search) params.search = filters.search;
      if (filters.status) params.status = filters.status;
      if (filters.project_id) params.project_id = filters.project_id;

      const result = await anticipoService.getAnticipos(scope, params);
      setAnticipos(result.page.data);
      setPagination({ total: result.page.total, lastPage: result.page.last_page });
      setCounts(result.counts);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Error al cargar los anticipos.'));
    } finally {
      setLoading(false);
    }
  }, [scope, filters, page, perPage]);

  useEffect(() => {
    // Búsqueda con pequeña espera para no consultar en cada tecla
    const timeout = setTimeout(fetchAnticipos, filters.search ? 350 : 0);
    return () => clearTimeout(timeout);
  }, [fetchAnticipos, filters.search]);

  const setScope = useCallback((value: AnticipoScope) => {
    setScopeState(value);
    setPage(1);
  }, []);

  const setFilter = useCallback(<K extends keyof AnticipoFilters>(key: K, value: AnticipoFilters[K]) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPage(1);
  }, []);

  const clearFilters = useCallback(() => {
    setFilters(EMPTY_FILTERS);
    setPage(1);
  }, []);

  const changePerPage = useCallback((value: number) => {
    setPerPage(value);
    setPage(1);
  }, []);

  // Cada acción recarga el listado y traduce el error de la API a un mensaje
  const run = useCallback(async <T,>(action: () => Promise<T>, fallback: string): Promise<T> => {
    try {
      const result = await action();
      await fetchAnticipos();
      return result;
    } catch (err) {
      throw new Error(getApiErrorMessage(err, fallback));
    }
  }, [fetchAnticipos]);

  const createAnticipo = useCallback((payload: AnticipoPayload) =>
    run(() => anticipoService.createAnticipo(payload), 'Error al radicar el anticipo.'), [run]);

  const resubmitAnticipo = useCallback((id: number, payload: AnticipoPayload) =>
    run(() => anticipoService.resubmitAnticipo(id, payload), 'Error al reenviar el anticipo.'), [run]);

  const reviewAnticipo = useCallback((id: number, decision: 'aprobar' | 'devolver', comment?: string) =>
    run(() => anticipoService.reviewAnticipo(id, decision, comment), 'Error al registrar la aprobación.'), [run]);

  const registerMultifox = useCallback((id: number, payload: MultifoxPayload) =>
    run(() => anticipoService.registerMultifox(id, payload), 'Error al cargar el anticipo de Multifox.'), [run]);

  return {
    catalogs,
    anticipos,
    counts,
    scope,
    filters,
    page,
    perPage,
    pagination,
    loading,
    error,
    setScope,
    setFilter,
    clearFilters,
    setPage,
    changePerPage,
    refresh: fetchAnticipos,
    createAnticipo,
    resubmitAnticipo,
    reviewAnticipo,
    registerMultifox,
  };
}
