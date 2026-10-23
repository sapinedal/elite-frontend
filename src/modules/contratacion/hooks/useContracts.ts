import { useState, useEffect, useCallback } from 'react';
import { contratacionService, getApiErrorMessage } from '../services/contratacionService';
import { useProject } from '../../../context/ProjectContext';
import type {
  Contract,
  ContractFilters,
  ContractPayload,
  ContratacionAlerts,
  ContratacionCatalogs,
} from '../types';

const EMPTY_FILTERS: ContractFilters = {
  search: '',
  tower_id: '',
  contract_type_id: '',
  status: '',
  alerts_only: false,
};

/**
 * Estado del módulo Contratación para el proyecto activo: catálogos, contratos, filtros y alertas.
 * Recarga todo al cambiar de proyecto (el header X-Project-Id lo agrega el interceptor de Axios).
 */
export function useContracts() {
  const { activeProject } = useProject();
  const projectId = activeProject?.id ?? null;

  const [catalogs, setCatalogs] = useState<ContratacionCatalogs | null>(null);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [alerts, setAlerts] = useState<ContratacionAlerts | null>(null);
  const [filters, setFilters] = useState<ContractFilters>(EMPTY_FILTERS);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(15);
  const [pagination, setPagination] = useState({ total: 0, lastPage: 1 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCatalogs = useCallback(async () => {
    try {
      setCatalogs(await contratacionService.getCatalogs());
    } catch (err) {
      setError(getApiErrorMessage(err, 'Error al cargar los catálogos.'));
    }
  }, []);

  const fetchAlerts = useCallback(async () => {
    try {
      setAlerts(await contratacionService.getAlerts());
    } catch (err) {
      console.error('Error al cargar alertas de contratación', err);
    }
  }, []);

  const fetchContracts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, unknown> = { page, per_page: perPage };
      if (filters.search) params.search = filters.search;
      if (filters.tower_id) params.tower_id = filters.tower_id;
      if (filters.contract_type_id) params.contract_type_id = filters.contract_type_id;
      if (filters.status) params.status = filters.status;
      if (filters.alerts_only) params.alerts_only = 'true';

      const result = await contratacionService.getContracts(params);
      // Si un cambio dejó la página actual vacía (ej. al eliminar el último de la página), se vuelve a la última
      if (result.data.length === 0 && result.current_page > 1) {
        setPage(result.last_page);
        return;
      }
      setContracts(result.data);
      setPagination({ total: result.total, lastPage: result.last_page });
    } catch (err) {
      setError(getApiErrorMessage(err, 'Error al cargar los contratos.'));
    } finally {
      setLoading(false);
    }
  }, [filters, page, perPage]);

  // Catálogos (frentes del proyecto) y alertas dependen del proyecto activo
  useEffect(() => {
    if (!projectId) return;
    setFilters(EMPTY_FILTERS);
    setPage(1);
    fetchCatalogs();
    fetchAlerts();
  }, [projectId, fetchCatalogs, fetchAlerts]);

  useEffect(() => {
    if (!projectId) return;
    fetchContracts();
  }, [projectId, fetchContracts]);

  // Cambiar un filtro vuelve a la primera página
  const setFilter = useCallback(<K extends keyof ContractFilters>(key: K, value: ContractFilters[K]) => {
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

  // Tras cualquier cambio se refrescan contratos y alertas (faltantes y pólizas)
  const refresh = useCallback(async () => {
    await Promise.all([fetchContracts(), fetchAlerts()]);
  }, [fetchContracts, fetchAlerts]);

  const saveContract = useCallback(async (payload: ContractPayload, id?: number) => {
    try {
      const saved = id
        ? await contratacionService.updateContract(id, payload)
        : await contratacionService.createContract(payload);
      await refresh();
      return saved;
    } catch (err) {
      throw new Error(getApiErrorMessage(err, 'Error al guardar el contrato.'));
    }
  }, [refresh]);

  const deleteContract = useCallback(async (id: number) => {
    try {
      await contratacionService.deleteContract(id);
      await refresh();
    } catch (err) {
      throw new Error(getApiErrorMessage(err, 'Error al eliminar el contrato.'));
    }
  }, [refresh]);

  const createTower = useCallback(async (name: string, code?: string) => {
    try {
      const tower = await contratacionService.createTower({ name, code });
      await fetchCatalogs();
      return tower;
    } catch (err) {
      throw new Error(getApiErrorMessage(err, 'Error al crear el frente de obra.'));
    }
  }, [fetchCatalogs]);

  return {
    activeProject,
    catalogs,
    contracts,
    alerts,
    filters,
    page,
    perPage,
    pagination,
    setPage,
    changePerPage,
    loading,
    error,
    setFilter,
    clearFilters,
    refresh,
    refreshCatalogs: fetchCatalogs,
    saveContract,
    deleteContract,
    createTower,
  };
}
