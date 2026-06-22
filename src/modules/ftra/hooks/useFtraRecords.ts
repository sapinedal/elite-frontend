import { useState, useEffect, useCallback } from 'react';
import { ftraRecordService } from '../services/ftraRecordService';
import { formatService } from '../services/formatService';
import { contractorService } from '../services/contractorService';
import type { FtraRecord, FtraFormat, FtraContractor, FtraRecordStatus } from '../types';

export function useFtraRecords() {
  const [records, setRecords] = useState<FtraRecord[]>([]);
  const [formats, setFormats] = useState<FtraFormat[]>([]);
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
    contractor_id: '',
    format_id: '',
    status: '' as FtraRecordStatus | '',
    search: '',
  });

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const activeFilters: Record<string, unknown> = {
        page: currentPage,
        per_page: perPage,
      };

      if (filters.contractor_id) activeFilters.contractor_id = filters.contractor_id;
      if (filters.format_id) activeFilters.format_id = filters.format_id;
      if (filters.status) activeFilters.status = filters.status;
      if (filters.search) activeFilters.search = filters.search;

      const response = await ftraRecordService.getRecords(activeFilters);
      setRecords(response.data);
      setTotalItems(response.total);
      setTotalPages(response.last_page);
    } catch (err: unknown) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Error al cargar los registros FTRA.');
    } finally {
      setLoading(false);
    }
  }, [filters, currentPage, perPage]);

  // Carga catálogos de formatos y contratistas activos para formularios
  const fetchCatalogs = useCallback(async () => {
    try {
      const [formatsResponse, contractorsResponse] = await Promise.all([
        formatService.getFormats({ per_page: 100, is_active: 'true' }),
        contractorService.getContractors({ per_page: 100, is_active: 'true' }),
      ]);
      setFormats(formatsResponse.data);
      setContractors(contractorsResponse.data);
    } catch (err) {
      console.error('Error al cargar catálogos de formatos/contratistas:', err);
    }
  }, []);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  useEffect(() => {
    fetchCatalogs();
  }, [fetchCatalogs]);

  // Reiniciar paginación al cambiar filtros
  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

  const setFilter = useCallback((key: keyof typeof filters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({
      contractor_id: '',
      format_id: '',
      status: '',
      search: '',
    });
  }, []);

  const createRecord = useCallback(async (formData: FormData) => {
    setLoading(true);
    setError(null);
    try {
      const newRecord = await ftraRecordService.createRecord(formData);
      await fetchRecords();
      return newRecord;
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Error al guardar el registro FTRA.';
      setError(msg);
      throw new Error(msg);
    } finally {
      setLoading(false);
    }
  }, [fetchRecords]);

  const updateRecord = useCallback(async (id: number, formData: FormData) => {
    setLoading(true);
    setError(null);
    try {
      const updated = await ftraRecordService.updateRecord(id, formData);
      await fetchRecords();
      return updated;
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Error al actualizar el registro FTRA.';
      setError(msg);
      throw new Error(msg);
    } finally {
      setLoading(false);
    }
  }, [fetchRecords]);

  const updateRecordStatus = useCallback(async (id: number, status: string) => {
    setLoading(true);
    setError(null);
    try {
      const updated = await ftraRecordService.updateStatus(id, status);
      setRecords(prev => prev.map(r => r.id === id ? updated : r));
      return updated;
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Error al actualizar el estado.';
      setError(msg);
      throw new Error(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteRecord = useCallback(async (id: number) => {
    setLoading(true);
    setError(null);
    try {
      await ftraRecordService.deleteRecord(id);
      await fetchRecords();
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Error al eliminar el registro FTRA.';
      setError(msg);
      throw new Error(msg);
    } finally {
      setLoading(false);
    }
  }, [fetchRecords]);

  return {
    records,
    formats,
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
    fetchRecords,
    createRecord,
    updateRecord,
    updateRecordStatus,
    deleteRecord,
  };
}
