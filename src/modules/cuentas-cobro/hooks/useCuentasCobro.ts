import { useState, useEffect, useCallback } from 'react';
import { cuentaCobroService, getApiErrorMessage } from '../services/cuentaCobroService';
import type {
  CuentaCobro, CuentaCobroCatalogs, CuentaCobroCounts, CuentaCobroFilters, CuentaCobroMultifoxPayload, CuentaCobroPayload, CuentaCobroScope,
} from '../types';

const EMPTY_FILTERS: CuentaCobroFilters = { search: '', status: '', project_id: '', tipo_id: '' };

/**
 * Estado del módulo Cuentas de cobro: catálogos, pestaña activa (mis cuentas / por aprobar / Multifox / todas),
 * filtros, paginación y las acciones del flujo (radicar, aprobar, reenviar, decisión y cargue de Multifox).
 */
export function useCuentasCobro() {
  const [catalogs, setCatalogs] = useState<CuentaCobroCatalogs | null>(null);
  const [cuentas, setCuentas] = useState<CuentaCobro[]>([]);
  const [counts, setCounts] = useState<CuentaCobroCounts>({ mine: 0, pending: 0, multifox: 0 });
  const [scope, setScopeState] = useState<CuentaCobroScope>('mine');
  const [filters, setFilters] = useState<CuentaCobroFilters>(EMPTY_FILTERS);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(15);
  const [pagination, setPagination] = useState({ total: 0, lastPage: 1 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadCatalogs = useCallback(() => cuentaCobroService.getCatalogs()
    .then((data) => {
      setCatalogs(data);
      return data;
    })
    .catch((err) => {
      setError(getApiErrorMessage(err, 'Error al cargar los catálogos.'));
      return null;
    }), []);

  useEffect(() => {
    loadCatalogs().then((data) => {
      // Quien no radica arranca en su bandeja de trabajo
      if (data && !data.can_create) setScopeState(data.review_stages.length ? 'pending' : data.can_handle_multifox ? 'multifox' : 'mine');
    });
  }, [loadCatalogs]);

  const fetchCuentas = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, unknown> = { page, per_page: perPage };
      (Object.keys(filters) as (keyof CuentaCobroFilters)[]).forEach((key) => {
        if (filters[key]) params[key] = filters[key];
      });

      const result = await cuentaCobroService.getCuentas(scope, params);
      setCuentas(result.page.data);
      setPagination({ total: result.page.total, lastPage: result.page.last_page });
      setCounts(result.counts);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Error al cargar las cuentas de cobro.'));
    } finally {
      setLoading(false);
    }
  }, [scope, filters, page, perPage]);

  useEffect(() => {
    // Búsqueda con pequeña espera para no consultar en cada tecla
    const timeout = setTimeout(fetchCuentas, filters.search ? 350 : 0);
    return () => clearTimeout(timeout);
  }, [fetchCuentas, filters.search]);

  const setScope = useCallback((value: CuentaCobroScope) => {
    setScopeState(value);
    setPage(1);
  }, []);

  const setFilter = useCallback(<K extends keyof CuentaCobroFilters>(key: K, value: CuentaCobroFilters[K]) => {
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
      await fetchCuentas();
      return result;
    } catch (err) {
      throw new Error(getApiErrorMessage(err, fallback));
    }
  }, [fetchCuentas]);

  const createCuenta = useCallback((payload: CuentaCobroPayload) =>
    run(() => cuentaCobroService.createCuenta(payload), 'Error al radicar la cuenta de cobro.'), [run]);

  const resubmitCuenta = useCallback((id: number, payload: CuentaCobroPayload) =>
    run(() => cuentaCobroService.resubmitCuenta(id, payload), 'Error al reenviar la cuenta de cobro.'), [run]);

  const reviewCuenta = useCallback((id: number, decision: 'aprobar' | 'devolver', comment?: string) =>
    run(() => cuentaCobroService.reviewCuenta(id, decision, comment), 'Error al registrar la aprobación.'), [run]);

  const decideMultifox = useCallback((id: number, requiresMultifox: boolean, comment?: string) =>
    run(() => cuentaCobroService.decideMultifox(id, requiresMultifox, comment), 'Error al registrar la decisión.'), [run]);

  const registerMultifox = useCallback((id: number, payload: CuentaCobroMultifoxPayload) =>
    run(() => cuentaCobroService.registerMultifox(id, payload), 'Error al cargar en Multifox.'), [run]);

  return {
    catalogs,
    cuentas,
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
    refresh: fetchCuentas,
    reloadCatalogs: loadCatalogs,
    createCuenta,
    resubmitCuenta,
    reviewCuenta,
    decideMultifox,
    registerMultifox,
  };
}
