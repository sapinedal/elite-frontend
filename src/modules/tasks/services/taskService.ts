import api from '../../../lib/axios';
import type { Task, TaskObservation, PaginatedTasksResponse } from '../types';

export const taskService = {
  /**
   * Obtiene la lista de tareas con filtros opcionales de estado, prioridad, área, responsable o búsqueda.
   */
  getTasks: async (filters: Record<string, unknown> = {}): Promise<Task[] | PaginatedTasksResponse> => {
    const { data } = await api.get('/v1/tasks', { params: filters });
    return data;
  },

  /**
   * Obtiene el detalle completo de una tarea incluyendo su historial de observaciones y auditorías.
   */
  getTaskById: async (id: number): Promise<Task> => {
    const { data } = await api.get(`/v1/tasks/${id}`);
    return data;
  },

  /**
   * Registra una nueva tarea. Cualquier colaborador puede hacerlo.
   */
  createTask: async (taskData: Partial<Task>): Promise<Task> => {
    const { data } = await api.post('/v1/tasks', taskData);
    return data.task;
  },

  /**
   * Actualiza una tarea. Si es colaborador común, el backend restringirá los cambios
   * únicamente al campo 'status'. Si es editor, puede modificar cualquier campo.
   */
  updateTask: async (id: number, taskData: Partial<Task>): Promise<Task> => {
    const { data } = await api.put(`/v1/tasks/${id}`, taskData);
    return data.task;
  },

  /**
   * Elimina permanentemente una tarea. Requiere privilegios de edición.
   */
  deleteTask: async (id: number): Promise<void> => {
    await api.delete(`/v1/tasks/${id}`);
  },

  /**
   * Añade un comentario de seguimiento de daily a la tarea.
   */
  addObservation: async (taskId: number, observation: string): Promise<TaskObservation> => {
    const { data } = await api.post(`/v1/tasks/${taskId}/observations`, { observation });
    return data.observation;
  }
};
