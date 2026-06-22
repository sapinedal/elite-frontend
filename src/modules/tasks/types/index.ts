import type { User } from '../../users/types';

/**
 * Prioridades estrictas definidas por el usuario.
 * P0 = Crítica
 * P1 = Alta
 * P2 = Media
 * P3 = Baja
 */
export type TaskPriority = 'P0' | 'P1' | 'P2' | 'P3';

/**
 * Estados secuenciales del flujo de trabajo de una tarea.
 */
export type TaskStatus = 'Por hacer' | 'En espera' | 'En progreso' | 'Completada';

/**
 * Representa una Tarea de la Bitácora.
 */
export interface Task {
  id: number;
  title: string;
  priority: TaskPriority;
  status: TaskStatus;
  requested_by_id: number;
  responsible_id: number | null;
  area_id: number | null;
  start_date: string | null;
  scheduled_end_date: string | null;
  actual_end_date: string | null;
  created_at: string;
  updated_at: string;
  
  // Relaciones cargadas por eager loading
  requested_by?: User;
  responsible?: User;
  area?: { id: number; name: string };
  observations?: TaskObservation[];
  audit_logs?: TaskAuditLog[];
  observations_count?: number;
}

/**
 * Observación de daily standup asociada a una tarea.
 */
export interface TaskObservation {
  id: number;
  task_id: number;
  user_id: number;
  observation: string;
  created_at: string;
  updated_at: string;
  
  // Relación con el usuario que comentó
  user?: User;
}

/**
 * Registro de auditoría de modificaciones de una tarea.
 */
export interface TaskAuditLog {
  id: number;
  task_id: number;
  user_id: number;
  action: 'created' | 'updated' | 'deleted';
  changes: Record<string, { old: any; new: any }> | null;
  created_at: string;
  updated_at: string;
  
  // Relación con el usuario autor del cambio
  user?: User;
}

export interface PaginatedResponse<T> {
  current_page: number;
  data: T[];
  first_page_url: string;
  from: number;
  last_page: number;
  last_page_url: string;
  links: Array<{ url: string | null; label: string; active: boolean }>;
  next_page_url: string | null;
  path: string;
  per_page: number;
  prev_page_url: string | null;
  to: number;
  total: number;
}

export interface TaskStats {
  total: number;
  todo: number;
  in_progress: number;
  completed: number;
  waiting: number;
  critical: number;
}

export interface PaginatedTasksResponse {
  pagination: PaginatedResponse<Task>;
  stats: TaskStats;
}
