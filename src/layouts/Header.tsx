import { useAuth } from '../context/AuthContext';
import { useProject } from '../context/ProjectContext';
import { Menu, LogOut, Building2 } from 'lucide-react';

interface HeaderProps {
  onMenuClick: () => void;
}

export default function Header({ onMenuClick }: HeaderProps) {
  const { user, logout } = useAuth();
  const { activeProject, setProjectById, projects, isLoading: isLoadingProjects } = useProject();

  return (
    <header className="h-[64px] bg-white border-b border-slate-100 sticky top-0 z-20 flex items-center justify-between px-4 md:px-8 shadow-sm">
      {/* Lado Izquierdo: Botón Menú y Selector de Proyecto */}
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          className="p-2 text-slate-500 hover:bg-slate-50 rounded-xl lg:hidden transition-all"
        >
          <Menu size={24} />
        </button>
        <div className="flex items-center gap-3 min-w-0">
          <span className="hidden md:inline text-[10px] font-black text-slate-300 uppercase tracking-[0.3em]">
            ELITE
          </span>
          <div className="hidden md:block h-4 w-px bg-slate-200" />
          {/* Proyecto activo: define qué información ve el usuario (se envía como X-Project-Id) */}
          {isLoadingProjects ? (
            <div className="h-8 w-40 bg-slate-100 rounded-2xl animate-pulse" />
          ) : activeProject ? (
            <div
              className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-2xl min-w-0"
              title="Proyecto activo"
            >
              <Building2 size={15} className="text-[#004C6C] shrink-0" />
              <select
                value={activeProject.id}
                onChange={(e) => setProjectById(e.target.value)}
                disabled={projects.length < 2}
                aria-label="Proyecto activo"
                className="bg-transparent text-xs font-bold text-[#004C6C] outline-none cursor-pointer disabled:cursor-default min-w-0 max-w-[160px] md:max-w-none truncate"
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-2xl">
              <Building2 size={15} className="text-amber-600 shrink-0" />
              <span className="text-xs font-bold text-amber-700">Sin proyectos asignados</span>
            </div>
          )}
        </div>
      </div>

      {/* Lado Derecho: Perfil y Logout */}
      <div className="flex items-center gap-4 md:gap-6">
        <div className="flex items-center gap-3">
          <div className="flex flex-col items-end sm:flex">
            <span className="text-sm font-black text-[#004C6C] tracking-tight leading-none mb-1">
              {user?.nombre || 'Usuario'}
            </span>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic leading-none">
              {user?.roles?.[0] || 'Administrador'}
            </span>
          </div>
        </div>

        <div className="w-px h-6 bg-slate-100 mx-2 hidden sm:block"></div>

        <button
          onClick={logout}
          className="p-2 md:px-4 md:py-2 bg-[#EE9D4C] rounded-xl transition-all flex items-center gap-2 group"
          title="Cerrar sesión"
        >
          <LogOut size={20} className="group-hover:scale-110 transition-transform" />
          <span className="hidden md:block text-xs uppercase tracking-wider">Salir</span>
        </button>
      </div>
    </header>
  );
}
