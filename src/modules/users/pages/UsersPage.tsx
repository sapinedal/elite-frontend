import { useState } from 'react';
import { 
  Search, 
  UserPlus, 
  Mail, 
  Building2, 
  Briefcase, 
  Edit2, 
  Key, 
  Shield,
  UserCheck,
  UserX,
  CheckCircle2,
  XCircle,
  Users as UsersIcon
} from 'lucide-react';
import { useUsers } from '../hooks/useUsers';
import { userService } from '../services/userService';
import { DataTable } from '../../../components/ui/DataTable';
import { UserModal } from '../components/UserModal';
import { PasswordChangeModal } from '../components/PasswordChangeModal';
import type { User } from '../types';

export default function UsersPage() {
  const { users, isLoading, refetch } = useUsers(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const activeUsersCount = users.filter(u => u.is_active !== false && !u.deleted_at).length;
  const inactiveUsersCount = users.filter(u => u.is_active === false || !!u.deleted_at).length;

  const filteredUsers = users.filter(user => {
    const isActive = user.is_active !== false && !user.deleted_at;
    
    // Status filter
    if (statusFilter === 'active' && !isActive) return false;
    if (statusFilter === 'inactive' && isActive) return false;

    // Search filter
    const areaName = typeof user.area === 'object' ? user.area?.name : user.area;
    const positionName = typeof user.position === 'object' ? user.position?.name : user.position;
    
    return (
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (areaName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (positionName?.toLowerCase() || '').includes(searchTerm.toLowerCase())
    );
  });

  const handleSaveUser = async (data: any) => {
    try {
      if (selectedUser) {
        await userService.updateUser(selectedUser.id, data);
      } else {
        await userService.createUser(data);
      }
      refetch();
    } catch (error) {
      console.error(error);
      throw error;
    }
  };

  const handlePasswordChange = async (password: string) => {
    if (!selectedUser) return;
    try {
      await userService.changePassword(selectedUser.id, { 
        password, 
        password_confirmation: password 
      });
    } catch (error) {
      console.error(error);
      throw error;
    }
  };

  const handleToggleStatus = async (user: User) => {
    const isActive = user.is_active !== false && !user.deleted_at;
    const actionText = isActive ? 'inactivar' : 'activar';
    if (!window.confirm(`¿Estás seguro de que deseas ${actionText} al usuario "${user.name}"?`)) return;
    try {
      await userService.toggleStatus(user.id);
      refetch();
    } catch (error) {
      console.error(error);
      alert('Error al cambiar el estado del usuario');
    }
  };

  const columns = [
    {
      header: 'Colaborador',
      accessor: (user: User) => {
        const isActive = user.is_active !== false && !user.deleted_at;
        return (
          <div className="flex items-center gap-4">
            <div className={`h-10 w-10 rounded-xl flex items-center justify-center font-black transition-all duration-300 ${
              isActive 
                ? 'bg-slate-50 text-[#004C6C] group-hover:bg-[#004C6C] group-hover:text-white' 
                : 'bg-slate-100 text-slate-400'
            }`}>
              {user.name.charAt(0)}
            </div>
            <div className="flex flex-col">
              <span className={`font-black transition-colors ${
                isActive ? 'text-slate-800 group-hover:text-[#004C6C]' : 'text-slate-500 line-through opacity-75'
              }`}>
                {user.name}
              </span>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest flex items-center gap-1">
                <Mail size={10} /> {user.email}
              </span>
            </div>
          </div>
        );
      }
    },
    {
      header: 'Área / Cargo',
      accessor: (user: User) => (
        <div className="flex flex-col gap-1">
          <span className="flex items-center gap-2 text-slate-600">
             <Building2 size={12} className="opacity-40" /> {user.area?.name || 'N/A'}
          </span>
          <span className="flex items-center gap-2 text-[11px] text-slate-400 font-bold uppercase tracking-wider">
             <Briefcase size={12} className="opacity-40" /> {user.position?.name || 'N/A'}
          </span>
        </div>
      )
    },
    {
      header: 'Estado',
      accessor: (user: User) => {
        const isActive = user.is_active !== false && !user.deleted_at;
        return (
          <div>
            {isActive ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-200 text-[10px] font-black uppercase tracking-wider">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Activo
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-50 text-rose-600 rounded-full border border-rose-200 text-[10px] font-black uppercase tracking-wider">
                <span className="w-2 h-2 rounded-full bg-rose-400" />
                Inactivo
              </span>
            )}
          </div>
        );
      }
    },
    {
      header: 'Roles & Permisos',
      accessor: (user: User) => {
        const rolesList = user.roles_list || 
          (Array.isArray(user.roles) 
            ? user.roles.map((r: any) => typeof r === 'string' ? r : r.name) 
            : ['empleado']);
        const directPermsCount = user.direct_permissions_list?.length || 0;

        return (
          <div className="flex flex-col gap-1.5">
            <div className="flex flex-wrap gap-1.5">
              {rolesList.map((role, idx) => (
                <span key={idx} className="px-2.5 py-0.5 bg-blue-50 text-[#004C6C] rounded-full border border-blue-100 text-[9px] font-black uppercase tracking-wider flex items-center gap-1">
                  <Shield size={10} /> {role}
                </span>
              ))}
            </div>
            {directPermsCount > 0 && (
              <span className="text-[9px] font-black text-[#EE9D4C] flex items-center gap-1 tracking-wider uppercase">
                <Key size={10} /> +{directPermsCount} {directPermsCount === 1 ? 'permiso directo' : 'permisos directos'}
              </span>
            )}
          </div>
        );
      }
    },
    {
      header: 'Acciones',
      accessor: (user: User) => {
        const isActive = user.is_active !== false && !user.deleted_at;
        return (
          <div className="flex items-center gap-1.5 justify-end" onClick={e => e.stopPropagation()}>
            <button 
              onClick={() => handleToggleStatus(user)}
              title={isActive ? "Inactivar Usuario" : "Activar Usuario"}
              className={`p-2.5 rounded-2xl transition-all flex items-center gap-1 ${
                isActive 
                  ? 'text-slate-400 hover:text-amber-600 hover:bg-amber-50' 
                  : 'text-emerald-600 bg-emerald-50/80 hover:bg-emerald-100'
              }`}
            >
              {isActive ? <UserX size={18} /> : <UserCheck size={18} />}
            </button>
            <button 
              onClick={() => { setSelectedUser(user); setIsPasswordModalOpen(true); }}
              title="Cambiar Contraseña"
              className="p-2.5 text-slate-400 hover:text-[#004C6C] hover:bg-blue-50 rounded-2xl transition-all"
            >
              <Key size={18} />
            </button>
            <button 
              onClick={() => { setSelectedUser(user); setIsModalOpen(true); }}
              title="Editar Usuario"
              className="p-2.5 text-slate-400 hover:text-[#EE9D4C] hover:bg-orange-50 rounded-2xl transition-all"
            >
              <Edit2 size={18} />
            </button>
          </div>
        );
      },
      className: "text-right"
    }
  ];

  return (
    <div className="max-w-7xl mx-auto p-8 space-y-10 animate-fade-in">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-4xl font-black text-[#004C6C] tracking-tight">Gestión de Usuarios</h1>
          <p className="text-slate-400 font-bold uppercase tracking-[0.2em]">
            Administra colaboradores, estados, roles y accesos
          </p>
        </div>
        
        <button 
          onClick={() => { setSelectedUser(null); setIsModalOpen(true); }}
          className="flex items-center gap-3 px-8 py-4 bg-[#004C6C] text-white rounded-[24px] font-black text-sm uppercase tracking-widest hover:bg-[#003a53] shadow-xl shadow-blue-900/10 transition-all hover:scale-[1.02] active:scale-95 group"
        >
          <UserPlus size={20} className="transition-transform group-hover:rotate-12" />
          Nuevo Usuario
        </button>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Total card */}
        <div 
          onClick={() => setStatusFilter('all')}
          className={`p-6 rounded-[28px] border transition-all cursor-pointer flex items-center justify-between ${
            statusFilter === 'all' 
              ? 'bg-[#004C6C] text-white border-[#004C6C] shadow-xl shadow-blue-900/10 scale-[1.02]' 
              : 'bg-white text-slate-800 border-slate-200 hover:border-[#004C6C]/40 hover:shadow-md'
          }`}
        >
          <div>
            <p className={`text-[10px] font-black uppercase tracking-[0.2em] mb-1 ${
              statusFilter === 'all' ? 'text-white/60' : 'text-slate-400'
            }`}>
              Total Usuarios
            </p>
            <p className="text-3xl font-black tracking-tight">{users.length}</p>
          </div>
          <div className={`h-12 w-12 rounded-2xl flex items-center justify-center ${
            statusFilter === 'all' ? 'bg-white/10 text-white' : 'bg-slate-100 text-[#004C6C]'
          }`}>
            <UsersIcon size={24} />
          </div>
        </div>

        {/* Active card */}
        <div 
          onClick={() => setStatusFilter('active')}
          className={`p-6 rounded-[28px] border transition-all cursor-pointer flex items-center justify-between ${
            statusFilter === 'active' 
              ? 'bg-emerald-600 text-white border-emerald-600 shadow-xl shadow-emerald-900/10 scale-[1.02]' 
              : 'bg-white text-slate-800 border-slate-200 hover:border-emerald-500/40 hover:shadow-md'
          }`}
        >
          <div>
            <p className={`text-[10px] font-black uppercase tracking-[0.2em] mb-1 ${
              statusFilter === 'active' ? 'text-white/70' : 'text-slate-400'
            }`}>
              Usuarios Activos
            </p>
            <p className="text-3xl font-black tracking-tight">{activeUsersCount}</p>
          </div>
          <div className={`h-12 w-12 rounded-2xl flex items-center justify-center ${
            statusFilter === 'active' ? 'bg-white/10 text-white' : 'bg-emerald-50 text-emerald-600'
          }`}>
            <CheckCircle2 size={24} />
          </div>
        </div>

        {/* Inactive card */}
        <div 
          onClick={() => setStatusFilter('inactive')}
          className={`p-6 rounded-[28px] border transition-all cursor-pointer flex items-center justify-between ${
            statusFilter === 'inactive' 
              ? 'bg-rose-600 text-white border-rose-600 shadow-xl shadow-rose-900/10 scale-[1.02]' 
              : 'bg-white text-slate-800 border-slate-200 hover:border-rose-500/40 hover:shadow-md'
          }`}
        >
          <div>
            <p className={`text-[10px] font-black uppercase tracking-[0.2em] mb-1 ${
              statusFilter === 'inactive' ? 'text-white/70' : 'text-slate-400'
            }`}>
              Usuarios Inactivos
            </p>
            <p className="text-3xl font-black tracking-tight">{inactiveUsersCount}</p>
          </div>
          <div className={`h-12 w-12 rounded-2xl flex items-center justify-center ${
            statusFilter === 'inactive' ? 'bg-white/10 text-white' : 'bg-rose-50 text-rose-600'
          }`}>
            <XCircle size={24} />
          </div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row gap-4 items-stretch justify-between">
        <div className="flex-1 relative group">
          <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#004C6C] transition-colors z-10">
            <Search size={20} />
          </div>
          <input 
            type="text"
            placeholder="Buscar por nombre, correo o área..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-[24px] pl-14 pr-6 py-4 text-slate-700 font-bold shadow-sm group-hover:shadow-md focus:shadow-xl focus:shadow-blue-900/5 focus:border-[#004C6C] transition-all outline-none text-sm placeholder:text-slate-300"
          />
        </div>

        {/* Segmented status filter */}
        <div className="flex items-center bg-slate-100 p-1.5 rounded-[24px] gap-1 self-start md:self-auto">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-5 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all ${
              statusFilter === 'all'
                ? 'bg-white text-[#004C6C] shadow-md shadow-slate-200'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Todos ({users.length})
          </button>
          <button
            onClick={() => setStatusFilter('active')}
            className={`px-5 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all ${
              statusFilter === 'active'
                ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Activos ({activeUsersCount})
          </button>
          <button
            onClick={() => setStatusFilter('inactive')}
            className={`px-5 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all ${
              statusFilter === 'inactive'
                ? 'bg-rose-500 text-white shadow-md shadow-rose-500/20'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Inactivos ({inactiveUsersCount})
          </button>
        </div>
      </div>

      {/* Users Table */}
      <DataTable 
        columns={columns}
        data={filteredUsers}
        isLoading={isLoading}
        onRowClick={(user) => { setSelectedUser(user); setIsModalOpen(true); }}
      />

      {/* Modals */}
      <UserModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveUser}
        user={selectedUser}
      />

      <PasswordChangeModal 
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
        onConfirm={handlePasswordChange}
        user={selectedUser}
      />

    </div>
  );
}

