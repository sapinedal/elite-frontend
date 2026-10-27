import { useState, useEffect, useCallback } from 'react';
import { ordenService, getApiErrorMessage } from '../services/ordenService';
import type { Orden, OrdenCatalogs, OrdenCounts, OrdenDocumentPayload, OrdenFilters, OrdenPayload, OrdenScope } from '../types';

const EMPTY_FILTERS: OrdenFilters = { search: '', status: '', project_id: '' };

/**
 * Estado del módulo Registro de Orden: catálogos, pestaña activa (mis órdenes / por aprobar / por gestionar / todas),
 * filtros, paginación y las acciones del flujo (registrar, aprobar, reenviar, cargar documentos).
 */
export function useOrdenes() {
  const [catalogs, setCatalogs] = useState<OrdenCatalogs | null>(null);
  const [ordenes, setOrdenes] = useState<Orden[]>([]);
  const [counts, setCounts] = useState<OrdenCounts>({ mine: 0, pending: 0, tasks: 0 });
  const [scope, setScopeState] = useState<OrdenScope>('mine');
  const [filters, setFilters] = useState<OrdenFilters>(EMPTY_FILTERS);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(15);
  const [pagination, setPagination] = useState({ total: 0, lastPage: 1 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    ordenService.getCatalogs()
      .then(setCatalogs)
      .catch((err) => setError(getApiErrorMessage(err, 'Error al cargar los catálogos.')));
  }, []);

  const fetchOrdenes = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, unknown> = { page, per_page: perPage };
      if (filters.search) params.search = filters.search;
      if (filters.status) params.status = filters.status;
      if (filters.project_id) params.project_id = filters.project_id;

      const result = await ordenService.getOrdenes(scope, params);
      setOrdenes(result.page.data);
      setPagination({ total: result.page.total, lastPage: result.page.last_page });
      setCounts(result.counts);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Error al cargar las órdenes.'));
    } finally {
      setLoading(false);
    }
  }, [scope, filters, page, perPage]);

  useEffect(() => {
    // Búsqueda con pequeña espera para no consultar en cada tecla
    const timeout = setTimeout(fetchOrdenes, filters.search ? 350 : 0);
    return () => clearTimeout(timeout);
  }, [fetchOrdenes, filters.search]);

  const setScope = useCallback((value: OrdenScope) => {
    setScopeState(value);
    setPage(1);
  }, []);

  const setFilter = useCallback(<K extends keyof OrdenFilters>(key: K, value: OrdenFilters[K]) => {
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

  // Ejecuta una acción del flujo y refresca el listado; los errores llegan como Error con el mensaje del backend
  const run = useCallback(async <T,>(action: () => Promise<T>, fallback: string): Promise<T> => {
    try {
      const result = await action();
      await fetchOrdenes();
      return result;
    } catch (err) {
      throw new Error(getApiErrorMessage(err, fallback));
    }
  }, [fetchOrdenes]);

  const createOrden = useCallback((payload: OrdenPayload) =>
    run(() => ordenService.createOrden(payload), 'Error al registrar la orden.'), [run]);

  const resubmitOrden = useCallback((id: number, payload: OrdenPayload) =>
    run(() => ordenService.resubmitOrden(id, payload), 'Error al reenviar la orden.'), [run]);

  const reviewOrden = useCallback((id: number, decision: 'aprobar' | 'devolver', comment?: string) =>
    run(() => ordenService.reviewOrden(id, decision, comment), 'Error al registrar la aprobación.'), [run]);

  const uploadDocument = useCallback((id: number, payload: OrdenDocumentPayload) =>
    run(() => ordenService.uploadDocument(id, payload), 'Error al cargar el documento.'), [run]);

  return {
    catalogs,
    ordenes,
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
    refresh: fetchOrdenes,
    createOrden,
    resubmitOrden,
    reviewOrden,
    uploadDocument,
  };
}
