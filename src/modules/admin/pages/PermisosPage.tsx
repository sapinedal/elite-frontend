import React, { useState, useEffect } from 'react';
import { 
  Key, 
  Search, 
  Shield, 
  Layers, 
  Info,
  Building2,
  ClipboardList,
  BarChart3,
  Construction,
  Scale,
  Users,
  FolderLock,
  FileText,
  Settings
} from 'lucide-react';
import { roleService } from '../../users/services/roleService';
import type { Role, PermissionCatalogResponse } from '../../users/types';

// Icon mapping per module
const moduleIcons: Record<string, React.ReactNode> = {
  obra: <Building2 className="w-5 h-5 text-blue-600" />,
  bitacora: <ClipboardList className="w-5 h-5 text-[#004C6C]" />,
  kpi: <BarChart3 className="w-5 h-5 text-[#EE9D4C]" />,
  ftra: <Construction className="w-5 h-5 text-amber-600" />,
  juridica: <Scale className="w-5 h-5 text-purple-600" />,
  usuarios: <Users className="w-5 h-5 text-emerald-600" />,
  proyectos: <FolderLock className="w-5 h-5 text-sky-600" />,
  contratos: <FileText className="w-5 h-5 text-indigo-600" />,
  configuracion: <Settings className="w-5 h-5 text-slate-600" />,
  roles: <Shield className="w-5 h-5 text-rose-600" />,
  permisos: <Key className="w-5 h-5 text-teal-600" />
};

export default function PermisosPage() {
  const [catalog, setCatalog] = useState<PermissionCatalogResponse | null>(null);
  const [roles, setRoles] = useState<Role[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedModule, setSelectedModule] = useState<string>('all');

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [rolesData, catalogData] = await Promise.all([
          roleService.getRoles(),
          roleService.getPermissionsCatalog()
        ]);
        setRoles(rolesData);
        setCatalog(catalogData);
      } catch (err: any) {
        console.error('Error al cargar permisos:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  // Helper para saber qué roles tienen un permiso dado
  const getRolesWithPermission = (permName: string): string[] => {
    return roles
      .filter(r => r.permissions?.some(p => p.name === permName))
      .map(r => r.name);
  };

  const totalPermissions = catalog?.all.length || 0;

  return (
    <div className="max-w-7xl mx-auto p-6 md:p-8 space-y-8 animate-fade-in">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-3xl md:text-4xl font-black text-[#004C6C] tracking-tight">
            Catálogo de Permisos
          </h1>
          <p className="text-slate-400 font-bold uppercase tracking-[0.2em] text-xs">
            Directorio y alcance de privilegios del sistema
          </p>
        </div>

        <div className="flex items-center gap-3 bg-blue-50/70 border border-blue-100 px-5 py-3 rounded-2xl">
          <Key size={18} className="text-[#004C6C]" />
          <span className="text-xs font-black text-[#004C6C] uppercase tracking-wider">
            {totalPermissions} Permisos Registrados
          </span>
        </div>
      </div>

      {/* Info Banner */}
      <div className="bg-white rounded-[28px] p-6 border border-slate-100 shadow-xs flex items-start gap-4">
        <div className="h-10 w-10 rounded-xl bg-orange-50 text-[#EE9D4C] flex items-center justify-center shrink-0 mt-0.5">
          <Info size={20} />
        </div>
        <div className="space-y-1">
          <h4 className="text-sm font-black text-slate-800">¿Cómo funcionan los permisos en ELITE?</h4>
          <p className="text-xs text-slate-500 font-medium leading-relaxed">
            Los permisos son atómicos e independientes. Puedes asociar un conjunto de permisos a un <strong>Rol</strong> (para asignación masiva), o bien conceder permisos específicos directamente a un <strong>Colaborador</strong> desde la gestión de usuarios para otorgarle accesos excepcionales.
          </p>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-[24px] border border-slate-100 shadow-xs">
        {/* Search */}
        <div className="relative flex-1 w-full">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
          <input
            type="text"
            placeholder="Buscar permiso (ej: bitacora.editar, ftra.crear)..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-slate-50 border border-slate-100 rounded-xl pl-11 pr-4 py-3 text-xs font-bold text-slate-700 outline-none focus:bg-white focus:border-[#004C6C] transition-all"
          />
        </div>

        {/* Module Filter Pills */}
        {catalog && (
          <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 custom-scrollbar">
            <button
              onClick={() => setSelectedModule('all')}
              className={`px-3 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer ${
                selectedModule === 'all'
                  ? 'bg-[#004C6C] text-white'
                  : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
              }`}
            >
              Todos
            </button>
            {Object.keys(catalog.modules).map(modKey => (
              <button
                key={modKey}
                onClick={() => setSelectedModule(modKey)}
                className={`px-3 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer ${
                  selectedModule === modKey
                    ? 'bg-[#004C6C] text-white'
                    : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
                }`}
              >
                {modKey}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Modules List */}
      {isLoading ? (
        <div className="space-y-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-44 bg-slate-100 rounded-[28px] animate-pulse" />
          ))}
        </div>
      ) : catalog && (
        <div className="space-y-6">
          {Object.entries(catalog.modules)
            .filter(([modKey]) => selectedModule === 'all' || selectedModule === modKey)
            .map(([modKey, mod]) => {
              const visiblePermissions = mod.permissions.filter(p =>
                p.toLowerCase().includes(searchTerm.toLowerCase())
              );

              if (visiblePermissions.length === 0 && searchTerm) return null;

              return (
                <div
                  key={modKey}
                  className="bg-white rounded-[32px] border border-slate-100 p-6 md:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.02)] space-y-6 animate-fade-in"
                >
                  {/* Module Header */}
                  <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                    <div className="flex items-center gap-3.5">
                      <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                        {moduleIcons[modKey] || <Layers className="w-5 h-5 text-[#004C6C]" />}
                      </div>
                      <div>
                        <h3 className="text-base font-black text-[#004C6C] uppercase tracking-wide">
                          {mod.title}
                        </h3>
                        <p className="text-xs text-slate-400 font-medium">{mod.description}</p>
                      </div>
                    </div>

                    <span className="text-xs font-black text-slate-500 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
                      {visiblePermissions.length} permisos
                    </span>
                  </div>

                  {/* Permissions Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {visiblePermissions.map(permName => {
                      const rolesWithPerm = getRolesWithPermission(permName);

                      return (
                        <div
                          key={permName}
                          className="bg-slate-50/70 rounded-2xl border border-slate-100 p-4 space-y-3 hover:bg-white hover:shadow-md hover:border-slate-200 transition-all group"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-mono text-xs font-black text-slate-800 group-hover:text-[#004C6C] transition-colors">
                              {permName}
                            </span>
                            <Key size={14} className="text-slate-300 group-hover:text-[#EE9D4C] transition-colors" />
                          </div>

                          {/* Roles having this permission */}
                          <div className="space-y-1 pt-1">
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">
                              Roles Habilitados:
                            </span>
                            <div className="flex flex-wrap gap-1">
                              {rolesWithPerm.length > 0 ? (
                                rolesWithPerm.map(rName => (
                                  <span
                                    key={rName}
                                    className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-700 text-[9px] font-black uppercase tracking-wider"
                                  >
                                    {rName}
                                  </span>
                                ))
                              ) : (
                                <span className="text-[10px] text-slate-400 font-bold italic">
                                  Sin roles asignados
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
        </div>
      )}

    </div>
  );
}
