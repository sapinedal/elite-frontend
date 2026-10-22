/**
 * Proyecto activo compartido entre ProjectContext y el interceptor de Axios.
 *
 * Vive fuera del contexto para que axios.ts no importe ProjectContext (dependencia circular).
 * ProjectContext es el único que lo escribe, y solo con proyectos ya validados contra
 * /configuracion/my-projects, para no enviar al backend un proyecto sin acceso.
 */
let activeProjectId: number | null = null;

export const PROJECT_HEADER = 'X-Project-Id';
export const ACTIVE_PROJECT_STORAGE_KEY = 'activeProjectCode';

export const getActiveProjectId = (): number | null => activeProjectId;

export const setActiveProjectId = (id: number | null): void => {
  activeProjectId = id;
};
