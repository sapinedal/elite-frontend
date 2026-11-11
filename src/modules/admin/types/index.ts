export interface Project {
  id: number;
  code: string;
  name: string;
  subtitle?: string;
  description?: string;
  total_budget: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface CreateProjectDTO {
  code: string;
  name: string;
  subtitle?: string;
  description?: string;
  total_budget?: number;
  is_active?: boolean;
}

export interface UpdateProjectDTO extends Partial<CreateProjectDTO> {}

/** Usuario asignado a un proyecto (tabla project_user) */
export interface ProjectMember {
  id: number;
  name: string;
  email: string;
  area_id: number | null;
}

/** Torre o etapa del proyecto. floors × apartments_per_floor define los apartamentos (piso × 100 + consecutivo). */
export interface ProjectTower {
  id: number;
  project_id: number;
  name: string;
  code?: string | null;
  description?: string | null;
  floors: number | null;
  apartments_per_floor: number | null;
}

export interface SaveTowerDTO {
  name: string;
  code?: string | null;
  floors: number | null;
  apartments_per_floor: number | null;
}
