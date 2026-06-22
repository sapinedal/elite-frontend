import { useState, useEffect, useCallback } from 'react';
import { taskService } from '../services/taskService';
import { userService } from '../../users/services/userService';
import { configuracionService } from '../../configuracion/services/configuracionService';
import type { Task, TaskPriority, TaskStatus, PaginatedTasksResponse } from '../types';
import type { User } from '../../users/types';
import type { Area } from '../../configuracion/services/configuracionService';

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Estados de Paginación y Estadísticas de Bitácora
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(15);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [stats, setStats] = useState({
    total: 0,
    todo: 0,
    in_progress: 0,
    completed: 0,
    waiting: 0,
    critical: 0,
  });

  // Filtros activos
  const [filters, setFilters] = useState({
    status: '' as TaskStatus | '',
    priority: '' as TaskPriority | '',
    area_id: '',
    responsible_id: '',
    search: '',
  });

  // Carga las tareas aplicando filtros y paginación
  const fetchTasks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Limpiamos los filtros vacíos para no enviarlos como params vacíos
      const activeFilters: Record<string, unknown> = {
        paginate: 'true',
        page: currentPage,
        per_page: perPage,
      };
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== '') {
          activeFilters[key] = value;
        }
      });

      const response: Task[] | PaginatedTasksResponse = await taskService.getTasks(activeFilters);
      
      if (response && 'pagination' in response) {
        setTasks(response.pagination.data);
        setTotalItems(response.pagination.total);
        setTotalPages(response.pagination.last_page);
        if (response.stats) {
          setStats(response.stats);
        }
      } else {
        // Fallback en caso de que devuelva el listado plano
        const tasksList = response as Task[];
        setTasks(Array.isArray(tasksList) ? tasksList : []);
        setTotalItems(Array.isArray(tasksList) ? tasksList.length : 0);
        setTotalPages(1);
      }
    } catch (err: unknown) {
      console.error(err);
      const errorMessage = err instanceof Error ? err.message : 'Error al cargar las tareas de la bitácora.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [filters, currentPage, perPage]);

  // Carga catálogos auxiliares (usuarios y áreas) para los filtros y asignaciones
  const fetchMetadata = useCallback(async () => {
    try {
      const [allUsers, allAreas] = await Promise.all([
        userService.getAllUsers(),
        configuracionService.getAreas()
      ]);
      setUsers(allUsers);
      setAreas(allAreas);
    } catch (err) {
      console.error('Error cargando catálogos de bitácora:', err);
    }
  }, []);

  // Recarga al cambiar filtros o paginación
  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // Carga inicial de metadatos
  useEffect(() => {
    fetchMetadata();
  }, [fetchMetadata]);

  // Reiniciar a la página 1 cuando cambien los filtros
  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

  // Modifica un filtro particular
  const setFilter = useCallback((key: keyof typeof filters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  // Modifica múltiples filtros simultáneamente
  const applyFilters = useCallback((newFilters: Partial<typeof filters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  // Limpia todos los filtros
  const clearFilters = useCallback(() => {
    setFilters({
      status: '',
      priority: '',
      area_id: '',
      responsible_id: '',
      search: '',
    });
  }, []);

  // Crear tarea
  const createTask = useCallback(async (taskData: Partial<Task>) => {
    setLoading(true);
    try {
      const newTask = await taskService.createTask(taskData);
      setTasks(prev => [newTask, ...prev]);
      return newTask;
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Error al registrar la tarea.';
      setError(msg);
      throw new Error(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  // Editar tarea (parcial o completa)
  const updateTask = useCallback(async (id: number, taskData: Partial<Task>) => {
    setLoading(true);
    try {
      const updatedTask = await taskService.updateTask(id, taskData);
      setTasks(prev => prev.map(t => t.id === id ? updatedTask : t));
      return updatedTask;
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Error al actualizar la tarea.';
      setError(msg);
      throw new Error(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  // Eliminar tarea
  const deleteTask = useCallback(async (id: number) => {
    setLoading(true);
    try {
      await taskService.deleteTask(id);
      setTasks(prev => prev.filter(t => t.id !== id));
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Error al eliminar la tarea.';
      setError(msg);
      throw new Error(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  // Agregar observación (Daily standup)
  const addObservation = useCallback(async (taskId: number, observationText: string) => {
    try {
      const newObs = await taskService.addObservation(taskId, observationText);
      // Actualizamos localmente el listado de tareas inyectando la nueva observación
      setTasks(prev => prev.map(t => {
        if (t.id === taskId) {
          const currentObs = t.observations || [];
          return {
            ...t,
            observations: [newObs, ...currentObs]
          };
        }
        return t;
      }));
      return newObs;
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Error al agregar la observación.';
      throw new Error(msg);
    }
  }, []);

  // Obtiene los detalles frescos de una sola tarea (útil para abrir modales informativos)
  const getTaskDetails = useCallback(async (id: number) => {
    try {
      return await taskService.getTaskById(id);
    } catch (err: any) {
      console.error(err);
      throw err;
    }
  }, []);

  return {
    tasks,
    users,
    areas,
    loading,
    error,
    filters,
    currentPage,
    perPage,
    totalItems,
    totalPages,
    stats,
    setCurrentPage,
    setPerPage,
    setFilter,
    applyFilters,
    clearFilters,
    fetchTasks,
    createTask,
    updateTask,
    deleteTask,
    addObservation,
    getTaskDetails
  };
}
