import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  PlusCircle, 
  Users, 
  Key, 
  Edit2, 
  Trash2, 
  X, 
  Search, 
  Save, 
  Lock,
  Layers
} from 'lucide-react';
import { roleService } from '../../users/services/roleService';
import type { Role, PermissionCatalogResponse } from '../../users/types';
import { Portal } from '../../../components/ui/Portal';

export default function RolesPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [catalog, setCatalog] = useState<PermissionCatalogResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [roleName, setRoleName] = useState('');
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [permissionSearch, setPermissionSearch] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchRolesAndCatalog = async () => {
    setIsLoading(true);
    try {
      const [rolesData, catalogData] = await Promise.all([
        roleService.getRoles(),
        roleService.getPermissionsCatalog()
      ]);
      setRoles(rolesData);
      setCatalog(catalogData);
    } catch (err: any) {
      console.error('Error al cargar roles:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRolesAndCatalog();
  }, []);

  const handleOpenModal = (role?: Role) => {
    setErrorMsg(null);
    setPermissionSearch('');
    if (role) {
      setSelectedRole(role);
      setRoleName(role.name);
      setSelectedPermissions(role.permissions?.map(p => p.name) || []);
    } else {
      setSelectedRole(null);
      setRoleName('');
      setSelectedPermissions([]);
    }
    setIsModalOpen(true);
  };

  const handleTogglePermission = (permissionName: string) => {
    setSelectedPermissions(prev =>
      prev.includes(permissionName)
        ? prev.filter(p => p !== permissionName)
        : [...prev, permissionName]
    );
  };

  const handleToggleModule = (modulePermissions: string[]) => {
    const allSelected = modulePermissions.every(p => selectedPermissions.includes(p));
    if (allSelected) {
      setSelectedPermissions(prev => prev.filter(p => !modulePermissions.includes(p)));
    } else {
      const toAdd = modulePermissions.filter(p => !selectedPermissions.includes(p));
      setSelectedPermissions(prev => [...prev, ...toAdd]);
    }
  };

  const handleSelectAll = () => {
    if (!catalog) return;
    if (selectedPermissions.length === catalog.all.length) {
      setSelectedPermissions([]);
    } else {
      setSelectedPermissions([...catalog.all]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roleName.trim()) return;

    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      if (selectedRole) {
        await roleService.updateRole(selectedRole.id, {
          name: roleName.trim().toLowerCase(),
          permissions: selectedPermissions
        });
      } else {
        await roleService.createRole({
          name: roleName.trim().toLowerCase(),
          permissions: selectedPermissions
        });
      }
      await fetchRolesAndCatalog();
      setIsModalOpen(false);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Error al guardar el rol');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteRole = async (role: Role) => {
    if (role.name === 'admin') {
      alert('El rol Administrador es fundamental para el sistema y no puede eliminarse.');
      return;
    }
    if (window.confirm(`¿Estás seguro de que deseas eliminar el rol "${role.name}"?`)) {
      try {
        await roleService.deleteRole(role.id);
        await fetchRolesAndCatalog();
      } catch (err: any) {
        alert(err.response?.data?.message || 'Error al eliminar el rol');
      }
    }
  };

  const filteredRoles = roles.filter(r =>
    r.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalUsersAssigned = roles.reduce((acc, r) => acc + (r.users_count || 0), 0);
  const totalPermissionsCount = catalog?.all.length || 0;

  return (
    <div className="max-w-7xl mx-auto p-6 md:p-8 space-y-8 animate-fade-in">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-3xl md:text-4xl font-black text-[#004C6C] tracking-tight">
            Roles & Perfiles de Acceso
          </h1>
          <p className="text-slate-400 font-bold uppercase tracking-[0.2em] text-xs">
            Configuración y vinculación de permisos del sistema Spatie
          </p>
        </div>

        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-3 px-8 py-4 bg-[#004C6C] text-white rounded-[24px] font-black text-xs uppercase tracking-widest hover:bg-[#003a53] shadow-xl shadow-blue-900/10 transition-all hover:scale-[1.02] active:scale-95 cursor-pointer shrink-0"
        >
          <PlusCircle size={18} />
          Nuevo Rol
        </button>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white rounded-[28px] p-6 border border-slate-100 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Roles Totales</p>
            <p className="text-3xl font-black text-[#004C6C]">{roles.length}</p>
          </div>
          <div className="h-12 w-12 rounded-2xl bg-blue-50 text-[#004C6C] flex items-center justify-center">
            <Shield size={24} />
          </div>
        </div>

        <div className="bg-white rounded-[28px] p-6 border border-slate-100 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Permisos Atómicos</p>
            <p className="text-3xl font-black text-[#EE9D4C]">{totalPermissionsCount}</p>
          </div>
          <div className="h-12 w-12 rounded-2xl bg-orange-50 text-[#EE9D4C] flex items-center justify-center">
            <Key size={24} />
          </div>
        </div>

        <div className="bg-white rounded-[28px] p-6 border border-slate-100 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Usuarios Asignados</p>
            <p className="text-3xl font-black text-emerald-600">{totalUsersAssigned}</p>
          </div>
          <div className="h-12 w-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Users size={24} />
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="flex items-center gap-4 bg-white p-4 rounded-[24px] border border-slate-100 shadow-xs">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
          <input
            type="text"
            placeholder="Buscar roles por nombre..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-slate-50 border border-slate-100 rounded-xl pl-11 pr-4 py-3 text-xs font-bold text-slate-700 outline-none focus:bg-white focus:border-[#004C6C] transition-all"
          />
        </div>
      </div>

      {/* Roles Cards Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-64 bg-slate-100 rounded-[32px] animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRoles.map(role => {
            const permCount = role.permissions?.length || 0;
            const isAdmin = role.name === 'admin';

            return (
              <div
                key={role.id}
                className="bg-white rounded-[32px] border border-slate-100 p-7 shadow-[0_8px_30px_rgb(0,0,0,0.02)] flex flex-col justify-between hover:shadow-xl transition-all group relative overflow-hidden"
              >
                <div className="space-y-4">
                  {/* Top Bar */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`h-10 w-10 rounded-xl flex items-center justify-center font-black ${
                        isAdmin ? 'bg-orange-50 text-[#EE9D4C]' : 'bg-blue-50 text-[#004C6C]'
                      }`}>
                        <Shield size={20} />
                      </div>
                      <div>
                        <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight group-hover:text-[#004C6C] transition-colors">
                          {role.name}
                        </h3>
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                          Guard: {role.guard_name}
                        </span>
                      </div>
                    </div>

                    {isAdmin && (
                      <span className="px-2.5 py-1 rounded-full bg-amber-50 border border-amber-100 text-amber-700 text-[9px] font-black uppercase tracking-wider flex items-center gap-1">
                        <Lock size={10} /> Sistema
                      </span>
                    )}
                  </div>

                  {/* Permissions Pills Preview */}
                  <div className="space-y-2 pt-2 border-t border-slate-50">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-400">Permisos Habilitados</span>
                      <span className="font-black text-[#004C6C]">{permCount} de {totalPermissionsCount}</span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${isAdmin ? 'bg-[#EE9D4C]' : 'bg-[#004C6C]'}`}
                        style={{ width: `${totalPermissionsCount > 0 ? (permCount / totalPermissionsCount) * 100 : 0}%` }}
                      />
                    </div>

                    <div className="flex flex-wrap gap-1.5 pt-2 max-h-24 overflow-hidden">
                      {role.permissions?.slice(0, 6).map(p => (
                        <span key={p.id} className="text-[10px] font-mono px-2 py-0.5 bg-slate-50 border border-slate-100 rounded-md text-slate-600 font-bold">
                          {p.name}
                        </span>
                      ))}
                      {permCount > 6 && (
                        <span className="text-[10px] px-2 py-0.5 bg-blue-50 text-[#004C6C] font-bold rounded-md">
                          +{permCount - 6} más...
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Footer Bar */}
                <div className="pt-6 mt-4 border-t border-slate-50 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 flex items-center gap-1.5">
                    <Users size={14} className="opacity-40" />
                    <strong className="text-slate-800">{role.users_count || 0}</strong> usuarios
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleOpenModal(role)}
                      title="Editar Permisos del Rol"
                      className="p-2.5 text-slate-400 hover:text-[#004C6C] hover:bg-blue-50 rounded-xl transition-all cursor-pointer"
                    >
                      <Edit2 size={16} />
                    </button>
                    {!isAdmin && (
                      <button
                        onClick={() => handleDeleteRole(role)}
                        title="Eliminar Rol"
                        className="p-2.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all cursor-pointer"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL: Crear / Editar Rol & Matriz de Permisos */}
      <Portal isOpen={isModalOpen}>
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#f8fafc] w-full max-w-4xl rounded-[40px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-scale-in">
            
            {/* Header */}
            <div className="bg-white p-6 md:p-8 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 bg-blue-50 text-[#004C6C] rounded-2xl flex items-center justify-center">
                  <Shield size={24} />
                </div>
                <div>
                  <h2 className="text-xl md:text-2xl font-black text-[#004C6C] tracking-tight">
                    {selectedRole ? `Editar Rol: ${selectedRole.name}` : 'Crear Nuevo Rol'}
                  </h2>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                    Matriz de privilegios y asignación de permisos
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-3 text-slate-300 hover:bg-slate-50 rounded-2xl transition-all cursor-pointer"
              >
                <X size={22} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-6 overflow-y-auto flex-1 custom-scrollbar">
              
              {errorMsg && (
                <div className="p-4 bg-red-50 border border-red-100 rounded-2xl text-xs font-bold text-red-600 text-center">
                  {errorMsg}
                </div>
              )}

              {/* Role Name */}
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-700 uppercase tracking-wider ml-1">
                  Nombre Identificador del Rol
                </label>
                <input
                  required
                  type="text"
                  disabled={selectedRole?.name === 'admin'}
                  value={roleName}
                  onChange={e => setRoleName(e.target.value)}
                  placeholder="Ej: auditor, residente, analista_contable"
                  className="w-full bg-white border border-slate-200 rounded-2xl px-5 py-3.5 text-sm font-bold text-slate-800 focus:border-[#004C6C] outline-none transition-all shadow-xs disabled:bg-slate-100"
                />
              </div>

              {/* Matrix Control Bar */}
              <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-sm font-black text-[#004C6C] uppercase tracking-wider flex items-center gap-2">
                    <Layers size={16} /> Matriz de Permisos por Módulo
                  </h3>
                  <p className="text-xs font-bold text-slate-400">
                    {selectedPermissions.length} de {totalPermissionsCount} permisos marcados
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" />
                    <input
                      type="text"
                      placeholder="Filtrar permiso..."
                      value={permissionSearch}
                      onChange={e => setPermissionSearch(e.target.value)}
                      className="bg-white border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs font-bold text-slate-700 outline-none focus:border-[#004C6C]"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleSelectAll}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer"
                  >
                    {selectedPermissions.length === totalPermissionsCount ? 'Desmarcar Todos' : 'Marcar Todos'}
                  </button>
                </div>
              </div>

              {/* Modules Matrix */}
              {catalog && (
                <div className="space-y-4">
                  {Object.entries(catalog.modules).map(([modKey, mod]) => {
                    const visiblePermissions = mod.permissions.filter(p =>
                      p.toLowerCase().includes(permissionSearch.toLowerCase())
                    );

                    if (visiblePermissions.length === 0 && permissionSearch) return null;

                    const allModuleSelected = mod.permissions.every(p => selectedPermissions.includes(p));

                    return (
                      <div key={modKey} className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4 shadow-xs">
                        {/* Module Header */}
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                          <div>
                            <h4 className="text-xs font-black text-[#004C6C] uppercase tracking-wider">
                              {mod.title}
                            </h4>
                            <p className="text-[11px] text-slate-400 font-medium">{mod.description}</p>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleToggleModule(mod.permissions)}
                            className="text-xs font-black text-[#EE9D4C] hover:underline cursor-pointer"
                          >
                            {allModuleSelected ? 'Desmarcar módulo' : 'Marcar módulo'}
                          </button>
                        </div>

                        {/* Permissions Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                          {visiblePermissions.map(permName => {
                            const isChecked = selectedPermissions.includes(permName);
                            return (
                              <label
                                key={permName}
                                className={`flex items-center gap-2.5 p-3 rounded-xl border text-xs font-bold cursor-pointer transition-all ${
                                  isChecked
                                    ? 'bg-blue-50/70 border-[#004C6C] text-[#004C6C]'
                                    : 'bg-white border-slate-100 hover:border-slate-300 text-slate-600'
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => handleTogglePermission(permName)}
                                  className="rounded border-slate-300 text-[#004C6C] focus:ring-[#004C6C] h-4 w-4 cursor-pointer"
                                />
                                <span className="font-mono text-[11px] tracking-tight">{permName}</span>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </form>

            {/* Footer */}
            <div className="p-6 md:p-8 bg-white border-t border-slate-100 flex justify-between items-center">
              <div className="text-xs font-bold text-slate-400">
                {selectedPermissions.length} permisos seleccionados
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-6 py-3.5 bg-slate-100 text-slate-500 rounded-2xl font-bold hover:bg-slate-200 transition-all text-xs uppercase tracking-widest cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting || !roleName.trim()}
                  className="flex items-center gap-2 px-8 py-3.5 bg-[#004C6C] text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-[#003a53] shadow-lg shadow-blue-900/10 transition-all disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? 'Guardando...' : (
                    <>
                      <Save size={16} />
                      {selectedRole ? 'Actualizar Rol' : 'Crear Rol'}
                    </>
                  )}
                </button>
              </div>
            </div>

          </div>
        </div>
      </Portal>

    </div>
  );
}
