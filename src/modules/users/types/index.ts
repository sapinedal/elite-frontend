export interface User {
  id: number;
  first_name: string;
  last_name: string;
  name: string;
  document: string;
  area_id: number;
  position_id: number;
  area?: { id: number; name: string };
  position?: { id: number; name: string };
  email: string;
  roles?: Array<{ id: number; name: string }> | string[];
  roles_list?: string[];
  permissions?: Array<{ id: number; name: string }> | string[];
  direct_permissions_list?: string[];
  kpis?: KPI[];
  is_active?: boolean;
  deleted_at?: string | null;
}

export interface Role {
  id: number;
  name: string;
  guard_name: string;
  permissions?: Array<{ id: number; name: string }>;
  users_count?: number;
  created_at?: string;
  updated_at?: string;
}

export interface ModulePermissions {
  title: string;
  description: string;
  permissions: string[];
}

export interface PermissionCatalogResponse {
  all: string[];
  modules: Record<string, ModulePermissions>;
}

export interface KPI {
  id?: number;
  user_id: number;
  name: string;
  description: string | null;
  indicators: Indicator[] | null;
  formula: string | null;
  target: number;
  unit: string;
  stage: string | null;
  weight: number;
  incidence: number;
  lower_is_better: boolean;
}

export interface Indicator {
  name: string;
  definition: string;
  formula: string;
  unit?: string;
  fixed_goal?: number;
  conditional_goals: ConditionalGoal[];
  parameters: IndicatorParameter[];
  tablaDetalle?: {
    headers: string[];
    rows: string[][];
  } | null;
}

export interface ConditionalGoal {
  level: string;
  min_value: number;
  max_value: number;
  qualification: string;
  color: 'excellent' | 'acceptable' | 'at_risk' | 'deficient' | 'optimal' | 'inadequate';
  score?: number;
}

export interface IndicatorParameter {
  name: string;
  value: number;
}
