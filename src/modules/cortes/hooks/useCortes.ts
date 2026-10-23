import { useState, useEffect, useCallback } from 'react';
import { corteService, getApiErrorMessage } from '../services/corteService';
import type { Corte, CorteCatalogs, CorteCounts, CorteFilters, CortePayload, CorteScope } from '../types';

const EMPTY_FILTERS: CorteFilters = { search: '', status: '', project_id: '' };

/**
 * Estado del módulo Registro de Corte: catálogos, pestaña activa (mis cortes / por revisar / todos),
 * filtros, paginación y las acciones del flujo (radicar, revisar, reenviar).
 */
export function useCortes() {
  const [catalogs, setCatalogs] = useState<CorteCatalogs | null>(null);
  const [cortes, setCortes] = useState<Corte[]>([]);
  const [counts, setCounts] = useState<CorteCounts>({ mine: 0, pending: 0 });
  const [scope, setScopeState] = useState<CorteScope>('mine');
  const [filters, setFilters] = useState<CorteFilters>(EMPTY_FILTERS);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(15);
  const [pagination, setPagination] = useState({ total: 0, lastPage: 1 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    corteService.getCatalogs()
      .then(setCatalogs)
      .catch((err) => setError(getApiErrorMessage(err, 'Error al cargar los catálogos.')));
  }, []);

  const fetchCortes = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, unknown> = { page, per_page: perPage };
      if (filters.search) params.search = filters.search;
      if (filters.status) params.status = filters.status;
      if (filters.project_id) params.project_id = filters.project_id;

      const result = await corteService.getCortes(scope, params);
      setCortes(result.page.data);
      setPagination({ total: result.page.total, lastPage: result.page.last_page });
      setCounts(result.counts);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Error al cargar los cortes.'));
    } finally {
      setLoading(false);
    }
  }, [scope, filters, page, perPage]);

  useEffect(() => {
    // Búsqueda con pequeña espera para no consultar en cada tecla
    const timeout = setTimeout(fetchCortes, filters.search ? 350 : 0);
    return () => clearTimeout(timeout);
  }, [fetchCortes, filters.search]);

  const setScope = useCallback((value: CorteScope) => {
    setScopeState(value);
    setPage(1);
  }, []);

  const setFilter = useCallback(<K extends keyof CorteFilters>(key: K, value: CorteFilters[K]) => {
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

  const createCorte = useCallback(async (payload: CortePayload) => {
    try {
      const corte = await corteService.createCorte(payload);
      await fetchCortes();
      return corte;
    } catch (err) {
      throw new Error(getApiErrorMessage(err, 'Error al radicar el corte.'));
    }
  }, [fetchCortes]);

  const resubmitCorte = useCallback(async (id: number, payload: CortePayload) => {
    try {
      const corte = await corteService.resubmitCorte(id, payload);
      await fetchCortes();
      return corte;
    } catch (err) {
      throw new Error(getApiErrorMessage(err, 'Error al reenviar el corte.'));
    }
  }, [fetchCortes]);

  const reviewCorte = useCallback(async (id: number, decision: 'aprobar' | 'devolver', comment?: string) => {
    try {
      const corte = await corteService.reviewCorte(id, decision, comment);
      await fetchCortes();
      return corte;
    } catch (err) {
      throw new Error(getApiErrorMessage(err, 'Error al registrar la revisión.'));
    }
  }, [fetchCortes]);

  return {
    catalogs,
    cortes,
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
    refresh: fetchCortes,
    createCorte,
    resubmitCorte,
    reviewCorte,
  };
}
