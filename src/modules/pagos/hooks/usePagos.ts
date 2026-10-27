import { useState, useEffect, useCallback } from 'react';
import { pagoService, getApiErrorMessage } from '../services/pagoService';
import type { PagoCatalogs, PagoCounts, PagoCuenta, PagoFilters, PagoScope } from '../types';

const EMPTY_FILTERS: PagoFilters = { search: '', project_id: '', frente: '', scheduled_for: '' };

/**
 * Estado del cuadro de pagos: catálogos, pestaña (por priorizar / programadas / pagadas / todas), filtros,
 * paginación, saldo total de lo filtrado y la selección para priorizar varias cuentas a la vez.
 */
export function usePagos() {
  const [catalogs, setCatalogs] = useState<PagoCatalogs | null>(null);
  const [cuentas, setCuentas] = useState<PagoCuenta[]>([]);
  const [counts, setCounts] = useState<PagoCounts>({ por_priorizar: 0, programadas: 0, pagadas: 0 });
  const [totalBalance, setTotalBalance] = useState(0);
  const [scope, setScopeState] = useState<PagoScope>('por_priorizar');
  const [filters, setFilters] = useState<PagoFilters>(EMPTY_FILTERS);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(50);
  const [pagination, setPagination] = useState({ total: 0, lastPage: 1 });
  const [selected, setSelected] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    pagoService.getCatalogs()
      .then((data) => {
        setCatalogs(data);
        // Quien paga entra directo a lo programado; quien prioriza, a lo pendiente
        if (data.can_pay && !data.can_prioritize) setScopeState('programadas');
      })
      .catch((err) => setError(getApiErrorMessage(err, 'Error al cargar los catálogos.')));
  }, []);

  const fetchCuentas = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, unknown> = { page, per_page: perPage };
      (Object.keys(filters) as (keyof PagoFilters)[]).forEach((key) => {
        if (filters[key]) params[key] = filters[key];
      });

      const result = await pagoService.getCuentas(scope, params);
      setCuentas(result.page.data);
      setPagination({ total: result.page.total, lastPage: result.page.last_page });
      setCounts(result.counts);
      setTotalBalance(result.totalBalance);
      setSelected((prev) => prev.filter((id) => result.page.data.some((c) => c.id === id)));
    } catch (err) {
      setError(getApiErrorMessage(err, 'Error al cargar las cuentas por pagar.'));
    } finally {
      setLoading(false);
    }
  }, [scope, filters, page, perPage]);

  useEffect(() => {
    const timeout = setTimeout(fetchCuentas, filters.search ? 350 : 0);
    return () => clearTimeout(timeout);
  }, [fetchCuentas, filters.search]);

  const setScope = useCallback((value: PagoScope) => {
    setScopeState(value);
    setPage(1);
    setSelected([]);
  }, []);

  const setFilter = useCallback(<K extends keyof PagoFilters>(key: K, value: PagoFilters[K]) => {
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

  const toggleSelected = useCallback((id: number) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }, []);

  return {
    catalogs,
    cuentas,
    counts,
    totalBalance,
    scope,
    filters,
    page,
    perPage,
    pagination,
    selected,
    loading,
    error,
    setScope,
    setFilter,
    clearFilters,
    setPage,
    changePerPage,
    setSelected,
    toggleSelected,
    refresh: fetchCuentas,
  };
}
