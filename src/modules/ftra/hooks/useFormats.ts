import { useState, useEffect, useCallback } from 'react';
import { formatService } from '../services/formatService';
import type { FtraFormat } from '../types';

export function useFormats() {
  const [formats, setFormats] = useState<FtraFormat[]>([]);
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

  const fetchFormats = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const activeFilters: Record<string, unknown> = {
        page: currentPage,
        per_page: perPage,
      };

      if (filters.search) activeFilters.search = filters.search;
      if (filters.is_active !== '') activeFilters.is_active = filters.is_active;

      const response = await formatService.getFormats(activeFilters);
      setFormats(response.data);
      setTotalItems(response.total);
      setTotalPages(response.last_page);
    } catch (err: unknown) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Error al cargar los formatos.');
    } finally {
      setLoading(false);
    }
  }, [filters, currentPage, perPage]);

  useEffect(() => {
    fetchFormats();
  }, [fetchFormats]);

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

  const createFormat = useCallback(async (formData: FormData) => {
    setLoading(true);
    setError(null);
    try {
      const newFormat = await formatService.createFormat(formData);
      await fetchFormats(); // Recargar para mantener orden y paginación consistentes
      return newFormat;
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Error al guardar el formato.';
      setError(msg);
      throw new Error(msg);
    } finally {
      setLoading(false);
    }
  }, [fetchFormats]);

  const updateFormat = useCallback(async (id: number, formData: FormData) => {
    setLoading(true);
    setError(null);
    try {
      const updated = await formatService.updateFormat(id, formData);
      await fetchFormats();
      return updated;
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Error al actualizar el formato.';
      setError(msg);
      throw new Error(msg);
    } finally {
      setLoading(false);
    }
  }, [fetchFormats]);

  const deleteFormat = useCallback(async (id: number) => {
    setLoading(true);
    setError(null);
    try {
      await formatService.deleteFormat(id);
      await fetchFormats();
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Error al eliminar el formato.';
      setError(msg);
      throw new Error(msg);
    } finally {
      setLoading(false);
    }
  }, [fetchFormats]);

  return {
    formats,
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
    fetchFormats,
    createFormat,
    updateFormat,
    deleteFormat,
  };
}
