import { useState, useEffect, useCallback } from 'react';
import { contractorService } from '../services/contractorService';
import type { FtraContractor } from '../types';

export function useContractors() {
  const [contractors, setContractors] = useState<FtraContractor[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Filtros
  const [filters, setFilters] = useState({
    search: '',
    is_active: '' as 'true' | 'false' | '',
  });

  const fetchContractors = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const activeFilters: Record<string, unknown> = {
        page: currentPage,
        per_page: perPage,
      };

      if (filters.search) activeFilters.search = filters.search;
      if (filters.is_active !== '') activeFilters.is_active = filters.is_active;

      const response = await contractorService.getContractors(activeFilters);
      setContractors(response.data);
      setTotalItems(response.total);
      setTotalPages(response.last_page);
    } catch (err: unknown) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Error al cargar los contratistas.');
    } finally {
      setLoading(false);
    }
  }, [filters, currentPage, perPage]);

  useEffect(() => {
    fetchContractors();
  }, [fetchContractors]);

  // Reiniciar paginación al cambiar filtros
  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

  const setFilter = useCallback((key: keyof typeof filters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({
      search: '',
      is_active: '',
    });
  }, []);

  const createContractor = useCallback(async (contractorData: Partial<FtraContractor>) => {
    setLoading(true);
    setError(null);
    try {
      const newContractor = await contractorService.createContractor(contractorData);
      await fetchContractors();
      return newContractor;
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Error al guardar el contratista.';
      setError(msg);
      throw new Error(msg);
    } finally {
      setLoading(false);
    }
  }, [fetchContractors]);

  const updateContractor = useCallback(async (id: number, contractorData: Partial<FtraContractor>) => {
    setLoading(true);
    setError(null);
    try {
      const updated = await contractorService.updateContractor(id, contractorData);
      await fetchContractors();
      return updated;
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Error al actualizar el contratista.';
      setError(msg);
      throw new Error(msg);
    } finally {
      setLoading(false);
    }
  }, [fetchContractors]);

  const deleteContractor = useCallback(async (id: number) => {
    setLoading(true);
    setError(null);
    try {
      await contractorService.deleteContractor(id);
      await fetchContractors();
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Error al eliminar el contratista.';
      setError(msg);
      throw new Error(msg);
    } finally {
      setLoading(false);
    }
  }, [fetchContractors]);

  return {
    contractors,
    loading,
    error,
    filters,
    currentPage,
    perPage,
    totalItems,
    totalPages,
    setCurrentPage,
    setPerPage,
    setFilter,
    clearFilters,
    fetchContractors,
    createContractor,
    updateContractor,
    deleteContractor,
  };
}
