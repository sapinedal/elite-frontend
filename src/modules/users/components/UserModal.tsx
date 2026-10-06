import { useState, useEffect } from 'react';
import { X, Save, User as UserIcon, Mail, FileText, Lock, Shield, Key, ChevronDown, Check } from 'lucide-react';
import type { User, Role, PermissionCatalogResponse } from '../types';
import { Portal } from '../../../components/ui/Portal';
import { CustomSelect } from '../../../components/ui/CustomSelect';
import { configuracionService, type Area, type Position } from '../../configuracion/services/configuracionService';
import { roleService } from '../services/roleService';

interface UserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
  user: User | null;
}

export const UserModal: React.FC<UserModalProps> = ({ isOpen, onClose, onSave, user }) => {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    area_id: '',
    position_id: '',
    document: '',
    roles: ['empleado'],
    permissions: [] as string[]
  });
  
  const [areas, setAreas] = useState<Area[]>([]);
  const [availablePositions, setAvailablePositions] = useState<Position[]>([]);
  const [availableRoles, setAvailableRoles] = useState<Role[]>([]);
  const [permissionsCatalog, setPermissionsCatalog] = useState<PermissionCatalogResponse | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPermissionsSection, setShowPermissionsSection] = useState(false);
  const [activeTab, setActiveTab] = useState<'info' | 'security'>('info');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [areasData, rolesData, catalogData] = await Promise.all([
          configuracionService.getAreas(),
          roleService.getRoles(),
          roleService.getPermissionsCatalog()
        ]);
        setAreas(areasData);
        setAvailableRoles(rolesData);
        setPermissionsCatalog(catalogData);
      } catch (error) {
        console.error('Error al cargar datos del usuario:', error);
      }
    };
    if (isOpen) {
      fetchData();
    }
  }, [isOpen]);

  useEffect(() => {
    if (user) {
      const userRoles = user.roles_list || 
        (Array.isArray(user.roles) 
          ? user.roles.map((r: any) => typeof r === 'string' ? r : r.name) 
          : ['empleado']);

      const userPermissions = user.direct_permissions_list || 
        (Array.isArray(user.permissions) 
          ? user.permissions.map((p: any) => typeof p === 'string' ? p : p.name) 
          : []);

      setFormData({
        first_name: user.first_name || user.name.split(' ')[0] || '',
        last_name: user.last_name || user.name.split(' ').slice(1).join(' ') || '',
        email: user.email,
        password: '',
        area_id: user.area_id?.toString() || '',
        position_id: user.position_id?.toString() || '',
        document: user.document || '',
        roles: userRoles.length > 0 ? userRoles : ['empleado'],
        permissions: userPermissions
      });

      const selectedArea = areas.find(a => a.id === user.area_id);
      if (selectedArea) {
        setAvailablePositions(selectedArea.positions);
      }
    } else {
      setFormData({
        first_name: '',
        last_name: '',
        email: '',
        password: '',
        area_id: '',
        position_id: '',
        document: '',
        roles: ['empleado'],
        permissions: []
      });
      setAvailablePositions([]);
    }
  }, [user, isOpen, areas]);

  const handleAreaChange = (areaId: string) => {
    setFormData({ ...formData, area_id: areaId, position_id: '' });
    const selectedArea = areas.find(a => a.id.toString() === areaId);
    if (selectedArea) {
      setAvailablePositions(selectedArea.positions);
    } else {
      setAvailablePositions([]);
    }
  };

  const handleToggleRole = (roleName: string) => {
    setFormData(prev => {
      const current = prev.roles;
      if (current.includes(roleName)) {
        // Al menos debe quedar un rol
        if (current.length === 1) return prev;
        return { ...prev, roles: current.filter(r => r !== roleName) };
      } else {
        return { ...prev, roles: [...current, roleName] };
      }
    });
  };

  const handleTogglePermission = (permissionName: string) => {
    setFormData(prev => {
      const current = prev.permissions;
      if (current.includes(permissionName)) {
        return { ...prev, permissions: current.filter(p => p !== permissionName) };
      } else {
        return { ...prev, permissions: [...current, permissionName] };
      }
    });
  };

  const handleToggleModulePermissions = (modulePermissions: string[]) => {
    setFormData(prev => {
      const allSelected = modulePermissions.every(p => prev.permissions.includes(p));
      if (allSelected) {
        return {
          ...prev,
          permissions: prev.permissions.filter(p => !modulePermissions.includes(p))
        };
      } else {
        const toAdd = modulePermissions.filter(p => !prev.permissions.includes(p));
        return {
          ...prev,
          permissions: [...prev.permissions, ...toAdd]
        };
      }
    });
  };

  // Permisos que vienen incluidos automáticamente por los roles seleccionados
  const inheritedPermissions = new Set<string>();
  availableRoles
    .filter(r => formData.roles.includes(r.name))
    .forEach(r => {
      r.permissions?.forEach(p => inheritedPermissions.add(p.name));
    });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSave(formData);
      onClose();
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Portal isOpen={isOpen}>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
        <div className="bg-[#f8fafc] w-full max-w-3xl rounded-[40px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-scale-in">
          
          {/* Header */}
          <div className="bg-white p-6 md:p-8 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 bg-blue-50 text-[#004C6C] rounded-2xl flex items-center justify-center">
                <UserIcon size={24} />
              </div>
              <div>
                <h2 className="text-xl md:text-2xl font-black text-[#004C6C] tracking-tight">
                  {user ? 'Editar Usuario & Permisos' : 'Nuevo Usuario'}
                </h2>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                  Gestión de perfil, cargos y privilegios de acceso
                </p>
              </div>
            </div>
            <button onClick={onClose} className="p-3 text-slate-300 hover:bg-slate-50 rounded-2xl transition-all cursor-pointer">
              <X size={22} />
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="flex border-b border-slate-200 bg-slate-50 px-8">
            <button
              type="button"
              onClick={() => setActiveTab('info')}
              className={`py-4 px-5 text-xs font-black uppercase tracking-wider flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
                activeTab === 'info' 
                  ? 'border-[#004C6C] text-[#004C6C] bg-white rounded-t-2xl shadow-xs' 
                  : 'border-transparent text-slate-400 hover:text-slate-700'
              }`}
            >
              <UserIcon size={16} />
              Datos del Colaborador
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('security')}
              className={`py-4 px-5 text-xs font-black uppercase tracking-wider flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
                activeTab === 'security' 
                  ? 'border-[#004C6C] text-[#004C6C] bg-white rounded-t-2xl shadow-xs' 
                  : 'border-transparent text-slate-400 hover:text-slate-700'
              }`}
            >
              <Shield size={16} />
              Roles & Permisos Específicos
              {(formData.permissions.length > 0 || formData.roles.length > 0) && (
                <span className="h-5 px-2 bg-[#004C6C] text-white rounded-full text-[10px] flex items-center justify-center font-bold">
                  {formData.roles.length + formData.permissions.length}
                </span>
              )}
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-6 overflow-y-auto flex-1 custom-scrollbar">
            
            {activeTab === 'info' ? (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* First Name */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nombres</label>
                    <div className="relative">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 z-10"><UserIcon size={18} /></div>
                      <input 
                        required
                        type="text"
                        value={formData.first_name}
                        onChange={e => setFormData({...formData, first_name: e.target.value})}
                        className="w-full bg-white border border-slate-100 rounded-2xl pl-12 pr-6 py-3.5 text-sm font-bold text-slate-700 focus:border-[#004C6C] outline-none transition-all shadow-sm"
                        placeholder="Ej: Juan Camilo"
                      />
                    </div>
                  </div>

                  {/* Last Name */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Apellidos</label>
                    <div className="relative">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 z-10"><UserIcon size={18} /></div>
                      <input 
                        required
                        type="text"
                        value={formData.last_name}
                        onChange={e => setFormData({...formData, last_name: e.target.value})}
                        className="w-full bg-white border border-slate-100 rounded-2xl pl-12 pr-6 py-3.5 text-sm font-bold text-slate-700 focus:border-[#004C6C] outline-none transition-all shadow-sm"
                        placeholder="Ej: Pérez García"
                      />
                    </div>
                  </div>

                  {/* Email */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email</label>
                    <div className="relative">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 z-10"><Mail size={18} /></div>
                      <input 
                        required
                        type="email"
                        value={formData.email}
                        onChange={e => setFormData({...formData, email: e.target.value})}
                        className="w-full bg-white border border-slate-100 rounded-2xl pl-12 pr-6 py-3.5 text-sm font-bold text-slate-700 focus:border-[#004C6C] outline-none transition-all shadow-sm"
                        placeholder="juan.perez@empresa.com"
                      />
                    </div>
                  </div>

                  {/* Document */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Documento / ID</label>
                    <div className="relative">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 z-10"><FileText size={18} /></div>
                      <input 
                        required
                        type="text"
                        value={formData.document}
                        onChange={e => setFormData({...formData, document: e.target.value})}
                        className="w-full bg-white border border-slate-100 rounded-2xl pl-12 pr-6 py-3.5 text-sm font-bold text-slate-700 focus:border-[#004C6C] outline-none transition-all shadow-sm"
                        placeholder="CC 12345678"
                      />
                    </div>
                  </div>

                  {/* Area */}
                  <div className="space-y-2">
                    <CustomSelect 
                      label="Área"
                      placeholder="Selecciona el área"
                      options={areas.map(a => ({ value: a.id.toString(), label: a.name }))}
                      value={formData.area_id}
                      onChange={handleAreaChange}
                    />
                  </div>

                  {/* Position */}
                  <div className="space-y-2">
                    <CustomSelect 
                      label="Cargo"
                      placeholder={formData.area_id ? "Selecciona el cargo" : "Primero elige un área"}
                      options={availablePositions.map(p => ({ value: p.id.toString(), label: p.name }))}
                      value={formData.position_id}
                      onChange={posId => setFormData({ ...formData, position_id: posId })}
                    />
                  </div>

                  {/* Password (only for new users) */}
                  {!user && (
                    <div className="space-y-2 md:col-span-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Password Temporal</label>
                      <div className="relative">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 z-10"><Lock size={18} /></div>
                        <input 
                          required
                          type="password"
                          value={formData.password}
                          onChange={e => setFormData({...formData, password: e.target.value})}
                          className="w-full bg-white border border-slate-100 rounded-2xl pl-12 pr-6 py-3.5 text-sm font-bold text-slate-700 focus:border-[#004C6C] outline-none transition-all shadow-sm"
                          placeholder="********"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-8 animate-fade-in">
                
                {/* 1. Selección de Roles */}
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-black text-[#004C6C] uppercase tracking-wider block">
                      Roles Asignados al Usuario
                    </label>
                    <p className="text-[11px] text-slate-400 font-bold">
                      Los roles definen el conjunto base de permisos que hereda este usuario.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                    {availableRoles.map(role => {
                      const isSelected = formData.roles.includes(role.name);
                      return (
                        <div
                          key={role.id}
                          onClick={() => handleToggleRole(role.name)}
                          className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between group ${
                            isSelected 
                              ? 'bg-blue-50/70 border-[#004C6C] shadow-sm' 
                              : 'bg-white border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-black uppercase tracking-wider text-slate-800 group-hover:text-[#004C6C]">
                              {role.name}
                            </span>
                            <div className={`h-5 w-5 rounded-lg flex items-center justify-center transition-all ${
                              isSelected ? 'bg-[#004C6C] text-white' : 'border border-slate-300'
                            }`}>
                              {isSelected && <Check size={12} />}
                            </div>
                          </div>
                          <span className="text-[10px] text-slate-400 font-bold">
                            {role.permissions?.length || 0} permisos
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 2. Permisos Específicos Directos */}
                <div className="space-y-4 pt-4 border-t border-slate-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-xs font-black text-[#004C6C] uppercase tracking-wider flex items-center gap-2">
                        <Key size={14} className="text-[#EE9D4C]" />
                        Permisos Específicos Adicionales (Directos)
                      </label>
                      <p className="text-[11px] text-slate-400 font-bold">
                        Otorga privilegios puntuales a este colaborador por fuera de sus roles asignados.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setShowPermissionsSection(!showPermissionsSection)}
                      className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-200 transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <span>{showPermissionsSection ? 'Ocultar Matriz' : 'Desplegar Matriz'}</span>
                      <ChevronDown size={14} className={`transition-transform ${showPermissionsSection ? 'rotate-180' : ''}`} />
                    </button>
                  </div>

                  {showPermissionsSection && permissionsCatalog && (
                    <div className="space-y-4 max-h-96 overflow-y-auto pr-2 custom-scrollbar animate-fade-in">
                      {Object.entries(permissionsCatalog.modules).map(([moduleKey, mod]) => {
                        const moduleAllSelected = mod.permissions.every(p => formData.permissions.includes(p));

                        return (
                          <div key={moduleKey} className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3 shadow-xs">
                            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                              <div>
                                <h4 className="text-xs font-black text-[#004C6C] uppercase tracking-wider">
                                  {mod.title}
                                </h4>
                                <p className="text-[10px] text-slate-400 font-medium">{mod.description}</p>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleToggleModulePermissions(mod.permissions)}
                                className="text-[10px] font-black text-[#EE9D4C] hover:underline cursor-pointer"
                              >
                                {moduleAllSelected ? 'Desmarcar todos' : 'Marcar todos'}
                              </button>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {mod.permissions.map(permName => {
                                const isDirectlySelected = formData.permissions.includes(permName);
                                const isInherited = inheritedPermissions.has(permName);

                                return (
                                  <label
                                    key={permName}
                                    className={`flex items-center justify-between p-2.5 rounded-xl border text-xs font-bold cursor-pointer transition-all ${
                                      isDirectlySelected
                                        ? 'bg-orange-50/70 border-orange-200 text-[#004C6C]'
                                        : isInherited
                                        ? 'bg-slate-50 border-slate-200 text-slate-600 opacity-80'
                                        : 'bg-white border-slate-100 hover:border-slate-300 text-slate-700'
                                    }`}
                                  >
                                    <div className="flex items-center gap-2">
                                      <input
                                        type="checkbox"
                                        checked={isDirectlySelected}
                                        onChange={() => handleTogglePermission(permName)}
                                        className="rounded border-slate-300 text-[#004C6C] focus:ring-[#004C6C] h-4 w-4"
                                      />
                                      <span className="font-mono text-[11px]">{permName}</span>
                                    </div>
                                    {isInherited && (
                                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 font-bold uppercase">
                                        Por Rol
                                      </span>
                                    )}
                                  </label>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

              </div>
            )}
          </form>

          {/* Footer */}
          <div className="p-6 md:p-8 bg-white border-t border-slate-100 flex justify-between items-center">
            <div className="text-xs font-bold text-slate-400">
              {formData.roles.length} roles seleccionados • {formData.permissions.length} permisos directos
            </div>
            <div className="flex items-center gap-3">
              <button 
                type="button"
                onClick={onClose}
                className="px-6 py-3.5 bg-slate-100 text-slate-500 rounded-2xl font-bold hover:bg-slate-200 transition-all text-xs uppercase tracking-widest cursor-pointer"
              >
                Cancelar
              </button>
              <button 
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex items-center gap-2 px-8 py-3.5 bg-[#004C6C] text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-[#003a53] shadow-lg shadow-blue-900/10 transition-all disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? 'Guardando...' : (
                  <>
                    <Save size={16} />
                    {user ? 'Guardar Cambios' : 'Crear Usuario'}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Portal>
  );
};
