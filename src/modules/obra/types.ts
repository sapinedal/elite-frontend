/** Datos de un informe semanal de interventoría (leído desde el PDF por el backend) */
export type ControlEstado = 'atraso' | 'adelanto' | 'al_dia' | null;

export interface InterventoriaCapitulo {
  numero: number;
  nombre: string;
  inicio: string | null;
  fin: string | null;
  avance_anterior: number | null;
  avance_actual: number | null;
  control: { estado: ControlEstado; dias: number | null; texto: string | null };
}

export interface InterventoriaPoliza {
  contratista: string | null;
  contratista_original: string;
  amparo: string | null;
  numero: string;
  valor_asegurado: number | null;
  inicio: string | null;
  fin: string | null;
  estado: 'VIGENTE' | 'VENCIDA' | 'POR VENCER';
}

export interface InterventoriaReport {
  numero: number;
  fecha: string | null;
  fecha_texto: string | null;
  archivo: string;
  ruta: string;
  pdf_url: string | null;
  importado: string | null;
  es_ultimo: boolean;
  proyecto: string | null;
  interventoria: string | null;
  fecha_inicio_obra: string | null;
  fecha_fin_obra: string | null;
  presupuesto: {
    presupuesto_aprobado: number | null;
    inversion_ejecutada: number | null;
    avance_inversion: number | null;
  };
  capitulos: InterventoriaCapitulo[];
  comite: string[];
  actividades: string[];
  observaciones: string[];
  polizas: InterventoriaPoliza[];
  fotos: number;
}

export interface InterventoriaHistoryPoint {
  numero: number;
  fecha: string | null;
  avance_inversion: number | null;
  inversion_ejecutada: number | null;
}

export interface InterventoriaDashboard {
  report: InterventoriaReport | null;
  history: InterventoriaHistoryPoint[];
}
