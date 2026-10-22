import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../lib/axios';
import { useAuth } from './AuthContext';
import { ACTIVE_PROJECT_STORAGE_KEY, setActiveProjectId } from '../lib/activeProject';

export interface ProjectOption {
  id: number;
  code: string;
  name: string;
  subtitle: string;
}

interface ProjectContextType {
  /** Proyecto seleccionado en el header; null si el usuario no tiene proyectos asignados */
  activeProject: ProjectOption | null;
  setProjectById: (id: string | number) => void;
  /** Proyectos a los que el usuario tiene acceso */
  projects: ProjectOption[];
  /** true para gerencia / admin (permiso proyectos.ver_todos) */
  canSeeAllProjects: boolean;
  isLoading: boolean;
  refreshProjects: () => Promise<void>;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export const ProjectProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [activeProject, setActiveProject] = useState<ProjectOption | null>(null);
  const [canSeeAllProjects, setCanSeeAllProjects] = useState(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // El interceptor de Axios se actualiza antes que el estado, para que las páginas que
  // recargan al cambiar de proyecto ya envíen el header X-Project-Id correcto
  const selectProject = useCallback((project: ProjectOption | null) => {
    setActiveProjectId(project?.id ?? null);
    setActiveProject(project);
    try {
      if (project) {
        localStorage.setItem(ACTIVE_PROJECT_STORAGE_KEY, project.code);
      }
    } catch {
      // localStorage no disponible: la selección solo dura la sesión
    }
  }, []);

  // Solo se cargan los proyectos a los que el usuario tiene acceso
  const fetchProjects = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data } = await api.get('/v1/configuracion/my-projects');
      const loadedProjects: ProjectOption[] = (data?.data ?? []).map((p: any) => ({
        id: Number(p.id),
        code: p.code,
        name: p.name,
        subtitle: p.subtitle || '',
      }));
      setProjects(loadedProjects);
      setCanSeeAllProjects(Boolean(data?.can_see_all));

      // Restaurar la preferencia guardada solo si el usuario sigue teniendo acceso a ese proyecto
      let savedCode: string | null = null;
      try {
        savedCode = localStorage.getItem(ACTIVE_PROJECT_STORAGE_KEY);
      } catch {
        savedCode = null;
      }
      const matched = loadedProjects.find(p => p.code === savedCode);
      selectProject(matched ?? loadedProjects[0] ?? null);
    } catch (err) {
      console.error('Error al cargar los proyectos del usuario', err);
      setProjects([]);
      selectProject(null);
    } finally {
      setIsLoading(false);
    }
  }, [selectProject]);

  // Recargar al iniciar sesión o cambiar de usuario (cada usuario tiene sus propios proyectos)
  useEffect(() => {
    if (user?.id) {
      fetchProjects();
    } else {
      setActiveProjectId(null);
    }
  }, [user?.id, fetchProjects]);

  // Sin sesión no se expone nada de la sesión anterior
  const hasUser = Boolean(user?.id);

  const setProjectById = (idOrCode: string | number) => {
    const found = projects.find(p => p.code === idOrCode || String(p.id) === String(idOrCode));
    if (found) {
      selectProject(found);
    }
  };

  return (
    <ProjectContext.Provider
      value={{
        activeProject: hasUser ? activeProject : null,
        setProjectById,
        projects: hasUser ? projects : [],
        canSeeAllProjects: hasUser && canSeeAllProjects,
        isLoading: hasUser && isLoading,
        refreshProjects: fetchProjects,
      }}
    >
      {children}
    </ProjectContext.Provider>
  );
};

export const useProject = () => {
  const context = useContext(ProjectContext);
  if (!context) {
    throw new Error('useProject debe ser utilizado dentro de un ProjectProvider');
  }
  return context;
};
