import { useState, useEffect, useCallback } from 'react';
import { facturacionService, getApiErrorMessage } from '../services/facturacionService';
import type { Factura, FacturacionCatalogs, FacturaCounts, FacturaScope } from '../types';

/**
 * Estado de Facturas del mes: catálogos, pestaña (pendientes / procesadas / todas), mes, búsqueda y paginación.
 */
export function useFacturas() {
  const [catalogs, setCatalogs] = useState<FacturacionCatalogs | null>(null);
  const [facturas, setFacturas] = useState<Factura[]>([]);
  const [counts, setCounts] = useState<FacturaCounts>({ pending: 0, suggested: 0 });
  const [scope, setScopeState] = useState<FacturaScope>('pending');
  // '' = todos los meses (las pendientes de meses anteriores también deben verse)
  const [period, setPeriodState] = useState('');
  const [search, setSearchState] = useState('');
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(20);
  const [pagination, setPagination] = useState({ total: 0, lastPage: 1 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    facturacionService.getCatalogs()
      .then(setCatalogs)
      .catch((err) => setError(getApiErrorMessage(err, 'Error al cargar los catálogos.')));
  }, []);

  const fetchFacturas = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, unknown> = { page, per_page: perPage };
      if (period) params.period = period;
      if (search) params.search = search;

      const result = await facturacionService.getFacturas(scope, params);
      setFacturas(result.page.data);
      setPagination({ total: result.page.total, lastPage: result.page.last_page });
      setCounts(result.counts);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Error al cargar las facturas.'));
    } finally {
      setLoading(false);
    }
  }, [scope, period, search, page, perPage]);

  useEffect(() => {
    // Búsqueda con pequeña espera para no consultar en cada tecla
    const timeout = setTimeout(fetchFacturas, search ? 350 : 0);
    return () => clearTimeout(timeout);
  }, [fetchFacturas, search]);

  // Cambiar pestaña, mes, búsqueda o tamaño de página vuelve a la primera página
  const setScope = useCallback((value: FacturaScope) => {
    setScopeState(value);
    setPage(1);
  }, []);

  const setPeriod = useCallback((value: string) => {
    setPeriodState(value);
    setPage(1);
  }, []);

  const setSearch = useCallback((value: string) => {
    setSearchState(value);
    setPage(1);
  }, []);

  const changePerPage = useCallback((value: number) => {
    setPerPage(value);
    setPage(1);
  }, []);

  return {
    catalogs,
    facturas,
    counts,
    scope,
    period,
    search,
    page,
    perPage,
    pagination,
    loading,
    error,
    setScope,
    setPeriod,
    setSearch,
    setPage,
    changePerPage,
    refresh: fetchFacturas,
  };
}
