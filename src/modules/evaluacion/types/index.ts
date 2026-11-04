
export interface Evaluation {
  id?: number;
  user_id: number;
  month: number;
  year: number;
  status: 'borrador' | 'finalizada';
  total_score: number;
  general_analysis: string | null;
  history?: any[];
  results: EvaluationResult[];
}

export interface EvaluationResult {
  id?: number;
  evaluation_id?: number;
  kpi_id: number | null;
  kpi_name: string;
  kpi_weight: number;
  kpi_target: number;
  kpi_unit?: string;
  lower_is_better?: boolean;
  real_value: number | null;
  score: number;
  tablaDetalle?: any;
  indicator_results?: IndicatorResult[];
  ai_analysis?: string;
}

export interface IndicatorResult {
  indicator_name: string;
  definition?: string;
  formula: string;
  unit?: string;
  variables: Record<string, number | null>;
  calculated_value: number;
  level: string;
  color?: string;
  qualification: string;
  score: number;
  ai_analysis?: string;
  parameters?: any[];
  conditional_goals?: any[];
  fixed_goal?: number | null;
  tablaDetalle?: any;
  not_applicable?: boolean;
}

export type Mes = {
  value: number;
  label: string;
};

export const meses: Mes[] = [
  { value: 1, label: 'Enero' },
  { value: 2, label: 'Febrero' },
  { value: 3, label: 'Marzo' },
  { value: 4, label: 'Abril' },
  { value: 5, label: 'Mayo' },
  { value: 6, label: 'Junio' },
  { value: 7, label: 'Julio' },
  { value: 8, label: 'Agosto' },
  { value: 9, label: 'Septiembre' },
  { value: 10, label: 'Octubre' },
  { value: 11, label: 'Noviembre' },
  { value: 12, label: 'Diciembre' },
];

/** Dashboard de KPIs de un área (GET /v1/dashboard/area), calculado en el backend */
export interface AreaDashboardCategory {
  name: string;
  /** Peso del KPI (0-100) */
  incidence: number;
  /** Puntaje obtenido (0-100); null si el colaborador no tiene evaluación en el periodo */
  score: number | null;
}

export interface AreaDashboardCollaborator {
  user_id: number;
  name: string;
  short_name: string;
  position: string | null;
  evaluated: boolean;
  total_score: number | null;
  categories: AreaDashboardCategory[];
}

export interface AreaDashboardMonth {
  key: string;
  year: number;
  month: number;
  label: string;
}

export interface AreaDashboardReport {
  area: string;
  month: number;
  year: number;
  total_users: number;
  evaluated: number;
  average: number | null;
  collaborators: AreaDashboardCollaborator[];
  breakdown: Array<{
    user_id: number;
    short_name: string;
    position: string | null;
    category: string;
    incidence: number;
    /** Aporte a la nota final: peso × puntaje / 100 */
    contribution: number;
  }>;
  months: AreaDashboardMonth[];
  comparison: Array<{
    user_id: number;
    short_name: string;
    position: string | null;
    scores: Record<string, number | null>;
  }>;
  evolution: Array<AreaDashboardMonth & { average: number; evaluated: number }>;
}
