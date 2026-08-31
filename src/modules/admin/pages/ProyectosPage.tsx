import { useState } from 'react';
import { 
  Search, 
  Plus, 
  Building2, 
  Edit2, 
  Trash2, 
  DollarSign, 
  FolderKanban,
  CheckCircle2,
  XCircle,
  Code2
} from 'lucide-react';
import { useProjects } from '../hooks/useProjects';
import { projectService } from '../services/projectService';
import { useProject } from '../../../context/ProjectContext';
import { DataTable } from '../../../components/ui/DataTable';
import { ProjectModal } from '../components/ProjectModal';
import type { Project, CreateProjectDTO } from '../types';

export default function ProyectosPage() {
  const { projects, isLoading, error, refetch } = useProjects();
  const { refreshProjects } = useProject();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const filteredProjects = projects.filter((project) => {
    const search = searchTerm.toLowerCase();
    return (
      project.name.toLowerCase().includes(search) ||
      project.code.toLowerCase().includes(search) ||
      (project.subtitle || '').toLowerCase().includes(search) ||
      (project.description || '').toLowerCase().includes(search)
    );
  });

  const activeProjectsCount = projects.filter((p) => p.is_active).length;
  const totalBudget = projects.reduce((acc, p) => acc + (Number(p.total_budget) || 0), 0);

  const handleSaveProject = async (data: CreateProjectDTO) => {
    try {
      if (selectedProject) {
        await projectService.updateProject(selectedProject.id, data);
      } else {
        await projectService.createProject(data);
      }
      refetch();
      await refreshProjects();
    } catch (err) {
      console.error('Error al guardar proyecto:', err);
      throw err;
    }
  };

  const handleDeleteProject = async (id: number) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar este proyecto? Esta acción no se puede deshacer.')) return;
    try {
      await projectService.deleteProject(id);
      refetch();
      await refreshProjects();
    } catch (err) {
      console.error('Error al eliminar proyecto:', err);
      alert('Ocurrió un error al intentar eliminar el proyecto.');
    }
  };

  const columns = [
    {
      header: 'Proyecto',
      accessor: (project: Project) => (
        <div className="flex items-center gap-4">
          <div className="h-11 w-11 rounded-2xl bg-blue-50/80 border border-blue-100 flex items-center justify-center text-[#004C6C] font-black group-hover:bg-[#004C6C] group-hover:text-white transition-all duration-300 shadow-sm">
            {project.name.charAt(0).toUpperCase()}
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="text-slate-800 font-black text-base group-hover:text-[#004C6C] transition-colors">
                {project.name}
              </span>
              <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md text-[10px] font-black uppercase tracking-wider flex items-center gap-1 border border-slate-200">
                <Code2 size={10} /> {project.code}
              </span>
            </div>
            {project.subtitle && (
              <span className="text-xs text-slate-400 font-semibold mt-0.5">
                {project.subtitle}
              </span>
            )}
          </div>
        </div>
      )
    },
    {
      header: 'Descripción',
      accessor: (project: Project) => (
        <p className="text-xs text-slate-500 font-medium max-w-xs truncate">
          {project.description || <span className="text-slate-300 italic">Sin descripción</span>}
        </p>
      )
    },
    {
      header: 'Presupuesto Total',
      accessor: (project: Project) => (
        <div className="flex items-center gap-1.5 text-slate-700 font-black text-sm">
          <DollarSign size={14} className="text-[#004C6C] opacity-70" />
          {formatCurrency(Number(project.total_budget) || 0)}
        </div>
      )
    },
    {
      header: 'Estado',
      accessor: (project: Project) => (
        <span
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${
            project.is_active
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
              : 'bg-slate-100 text-slate-500 border-slate-200'
          }`}
        >
          {project.is_active ? (
            <>
              <CheckCircle2 size={12} className="text-emerald-500" /> Activo
            </>
          ) : (
            <>
              <XCircle size={12} className="text-slate-400" /> Inactivo
            </>
          )}
        </span>
      )
    },
    {
      header: 'Acciones',
      accessor: (project: Project) => (
        <div className="flex items-center gap-2 justify-end" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => {
              setSelectedProject(project);
              setIsModalOpen(true);
            }}
            title="Editar Proyecto"
            className="p-3 text-slate-400 hover:text-[#EE9D4C] hover:bg-orange-50 rounded-2xl transition-all"
          >
            <Edit2 size={18} />
          </button>
          <button
            onClick={() => handleDeleteProject(project.id)}
            title="Eliminar Proyecto"
            className="p-3 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all"
          >
            <Trash2 size={18} />
          </button>
        </div>
      ),
      className: 'text-right'
    }
  ];

  return (
    <div className="max-w-7xl mx-auto p-8 space-y-10 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-4xl font-black text-[#004C6C] tracking-tight">Gestión de Proyectos</h1>
          <p className="text-slate-400 font-bold uppercase tracking-[0.2em]">
            Administra los proyectos, presupuestos y accesos
          </p>
        </div>

        <button
          onClick={() => {
            setSelectedProject(null);
            setIsModalOpen(true);
          }}
          className="flex items-center gap-3 px-8 py-4 bg-[#004C6C] text-white rounded-[24px] font-black text-sm uppercase tracking-widest hover:bg-[#003a53] shadow-xl shadow-blue-900/10 transition-all hover:scale-[1.02] active:scale-95 group"
        >
          <Plus size={20} className="transition-transform group-hover:rotate-90" />
          Nuevo Proyecto
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1: Total Proyectos */}
        <div className="bg-white rounded-[32px] p-6 border border-slate-100 shadow-sm flex items-center justify-between relative overflow-hidden group hover:shadow-md transition-all">
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">
              Total Proyectos
            </p>
            <p className="text-4xl font-black text-[#004C6C] tracking-tighter">
              {projects.length}
            </p>
          </div>
          <div className="h-14 w-14 bg-blue-50 rounded-[20px] flex items-center justify-center text-[#004C6C] border border-blue-100 group-hover:scale-110 transition-transform">
            <FolderKanban size={26} />
          </div>
        </div>

        {/* Card 2: Proyectos Activos */}
        <div className="bg-white rounded-[32px] p-6 border border-slate-100 shadow-sm flex items-center justify-between relative overflow-hidden group hover:shadow-md transition-all">
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">
              Proyectos Activos
            </p>
            <p className="text-4xl font-black text-emerald-600 tracking-tighter">
              {activeProjectsCount}
            </p>
          </div>
          <div className="h-14 w-14 bg-emerald-50 rounded-[20px] flex items-center justify-center text-emerald-600 border border-emerald-100 group-hover:scale-110 transition-transform">
            <Building2 size={26} />
          </div>
        </div>

        {/* Card 3: Presupuesto Acumulado */}
        <div className="bg-[#004C6C] rounded-[32px] p-6 flex items-center justify-between shadow-xl shadow-blue-900/10 relative overflow-hidden group hover:scale-[1.02] transition-all cursor-default">
          <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-white/5 rounded-full blur-3xl group-hover:bg-white/10 transition-all duration-500" />
          <div className="relative z-10">
            <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mb-1">
              Presupuesto Acumulado
            </p>
            <p className="text-2xl font-black text-white tracking-tight">
              {formatCurrency(totalBudget)}
            </p>
          </div>
          <div className="h-14 w-14 bg-white/10 rounded-[20px] flex items-center justify-center text-white backdrop-blur-md border border-white/10 relative z-10 group-hover:rotate-6 transition-transform">
            <DollarSign size={26} />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="group">
        <div className="relative h-full">
          <div className="absolute left-7 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#004C6C] transition-colors z-10">
            <Search size={22} />
          </div>
          <input
            type="text"
            placeholder="Buscar por nombre, código, subtítulo o descripción..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-[32px] pl-16 pr-8 py-5 text-slate-700 font-bold shadow-sm group-hover:shadow-md focus:shadow-xl focus:shadow-blue-900/5 focus:border-[#004C6C] transition-all outline-none text-base placeholder:text-slate-300"
          />
        </div>
      </div>

      {/* Error state alert */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-red-600 text-sm font-bold">
          {error}
        </div>
      )}

      {/* Table */}
      <DataTable
        columns={columns}
        data={filteredProjects}
        isLoading={isLoading}
        emptyMessage="No se encontraron proyectos"
        onRowClick={(project) => {
          setSelectedProject(project);
          setIsModalOpen(true);
        }}
      />

      {/* Modal */}
      <ProjectModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveProject}
        project={selectedProject}
      />
    </div>
  );
}
