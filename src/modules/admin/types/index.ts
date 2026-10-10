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
