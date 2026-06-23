import { useState, useEffect, useCallback } from 'react';
import { residenteService } from '../services/residenteService';
import type { Residente } from '../types';

export function useResidentes() {
  const [residentes, setResidentes] = useState<Residente[]>([]);
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

  const fetchResidentes = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const activeFilters: Record<string, unknown> = {
        page: currentPage,
        per_page: perPage,
      };

      if (filters.search) activeFilters.search = filters.search;
      if (filters.is_active !== '') activeFilters.is_active = filters.is_active;

      const response = await residenteService.getResidentes(activeFilters);
      setResidentes(response.data);
      setTotalItems(response.total);
      setTotalPages(response.last_page);
    } catch (err: unknown) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Error al cargar los residentes.');
    } finally {
      setLoading(false);
    }
  }, [filters, currentPage, perPage]);

  useEffect(() => {
    fetchResidentes();
  }, [fetchResidentes]);

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

  const createResidente = useCallback(async (residenteData: Partial<Residente>) => {
    setLoading(true);
    setError(null);
    try {
      const newResidente = await residenteService.createResidente(residenteData);
      await fetchResidentes();
      return newResidente;
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Error al guardar el residente.';
      setError(msg);
      throw new Error(msg);
    } finally {
      setLoading(false);
    }
  }, [fetchResidentes]);

  const updateResidente = useCallback(async (id: number, residenteData: Partial<Residente>) => {
    setLoading(true);
    setError(null);
    try {
      const updated = await residenteService.updateResidente(id, residenteData);
      await fetchResidentes();
      return updated;
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Error al actualizar el residente.';
      setError(msg);
      throw new Error(msg);
    } finally {
      setLoading(false);
    }
  }, [fetchResidentes]);

  const deleteResidente = useCallback(async (id: number) => {
    setLoading(true);
    setError(null);
    try {
      await residenteService.deleteResidente(id);
      await fetchResidentes();
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Error al eliminar el residente.';
      setError(msg);
      throw new Error(msg);
    } finally {
      setLoading(false);
    }
  }, [fetchResidentes]);

  return {
    residentes,
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
    fetchResidentes,
    createResidente,
    updateResidente,
    deleteResidente,
  };
}
