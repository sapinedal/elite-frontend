import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../lib/axios';

export interface ProjectOption {
  id: number | string;
  code: string;
  name: string;
  subtitle: string;
}

export const defaultProjects: ProjectOption[] = [
  { id: 'vis', code: 'vis', name: 'Ciudadela San Miguel', subtitle: 'VIS - 2,200 aptos (Torre 2)' },
  { id: 'serena', code: 'serena', name: 'Serena del Mar', subtitle: 'Renta Corta & Mar' },
  { id: 'jerico', code: 'jerico', name: 'Jericó', subtitle: 'Parcelación & Naturaleza' },
  { id: 'comercial', code: 'comercial', name: 'Plaza Comercial', subtitle: 'Locales & Retail' },
];

interface ProjectContextType {
  activeProject: ProjectOption;
  setProjectById: (id: string | number) => void;
  projects: ProjectOption[];
  isLoading: boolean;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export const ProjectProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [projects, setProjects] = useState<ProjectOption[]>(defaultProjects);
  const [activeProject, setActiveProject] = useState<ProjectOption>(defaultProjects[0]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Cargar proyectos dinámicamente utilizando la instancia estandarizada de Axios
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await api.get('/v1/configuracion/projects');

        if (response.data && response.data.data && Array.isArray(response.data.data) && response.data.data.length > 0) {
          const loadedProjects: ProjectOption[] = response.data.data.map((p: any) => ({
            id: p.id,
            code: p.code,
            name: p.name,
            subtitle: p.subtitle || p.description || ''
          }));
          setProjects(loadedProjects);

          // Restaurar la preferencia del usuario desde localStorage si existe
          const savedCode = localStorage.getItem('activeProjectCode');
          const matched = loadedProjects.find(p => p.code === savedCode || String(p.id) === savedCode);
          if (matched) {
            setActiveProject(matched);
          } else {
            setActiveProject(loadedProjects[0]);
          }
        }
      } catch (err) {
        console.warn('Usando proyectos por defecto para ProjectContext (contingencia/offline)', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProjects();
  }, []);

  const setProjectById = (idOrCode: string | number) => {
    const found = projects.find(p => p.code === idOrCode || p.id === idOrCode || String(p.id) === String(idOrCode));
    if (found) {
      setActiveProject(found);
      localStorage.setItem('activeProjectCode', found.code);
    }
  };

  return (
    <ProjectContext.Provider value={{ activeProject, setProjectById, projects, isLoading }}>
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
