import { useAuth } from '../context/AuthContext';
import { useProject } from '../context/ProjectContext';
import { Menu, LogOut, Building2 } from 'lucide-react';

interface HeaderProps {
  onMenuClick: () => void;
}

export default function Header({ onMenuClick }: HeaderProps) {
  const { user, logout } = useAuth();
  const { activeProject, setProjectById, projects, isLoading: isLoadingProjects } = useProject();
  const initials = (user?.nombre || 'U')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join('');

  return (
    <header className="h-[64px] bg-white border-b border-slate-100 sticky top-0 z-20 flex items-center justify-between gap-3 px-3 sm:px-4 md:px-8 shadow-sm">
      {/* Lado Izquierdo: Botón Menú y Selector de Proyecto */}
      <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
        <button
          onClick={onMenuClick}
          aria-label="Abrir menú"
          className="p-2 -ml-1 text-slate-500 hover:bg-slate-50 rounded-xl lg:hidden transition-all shrink-0"
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
              className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-2 rounded-2xl min-w-0 max-w-full"
              title="Proyecto activo"
            >
              <Building2 size={15} className="text-[#004C6C] shrink-0" />
              <select
                value={activeProject.id}
                onChange={(e) => setProjectById(e.target.value)}
                disabled={projects.length < 2}
                aria-label="Proyecto activo"
                className="bg-transparent text-xs font-bold text-[#004C6C] outline-none cursor-pointer disabled:cursor-default min-w-0 w-full sm:w-auto max-w-[220px] md:max-w-none truncate"
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

      {/* Lado Derecho: Perfil y Logout. En mobile solo las iniciales para no apretar el selector de proyecto */}
      <div className="flex items-center gap-2 sm:gap-4 md:gap-6 shrink-0">
        <div className="flex items-center gap-3" title={user?.nombre}>
          <div className="hidden sm:flex flex-col items-end min-w-0">
            <span className="text-sm font-black text-[#004C6C] tracking-tight leading-none mb-1 truncate max-w-[220px]">
              {user?.nombre || 'Usuario'}
            </span>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic leading-none">
              {user?.roles?.[0] || 'Administrador'}
            </span>
          </div>
          <div className="sm:hidden h-9 w-9 rounded-xl bg-blue-50 border border-blue-100 text-[#004C6C] flex items-center justify-center text-xs font-black">
            {initials}
          </div>
        </div>

        <div className="w-px h-6 bg-slate-100 hidden sm:block"></div>

        <button
          onClick={logout}
          className="h-9 w-9 md:h-auto md:w-auto md:px-4 md:py-2 bg-[#EE9D4C] text-white rounded-xl transition-all flex items-center justify-center gap-2 group"
          title="Cerrar sesión"
          aria-label="Cerrar sesión"
        >
          <LogOut size={18} className="group-hover:scale-110 transition-transform" />
          <span className="hidden md:block text-xs uppercase tracking-wider">Salir</span>
        </button>
      </div>
    </header>
  );
}
