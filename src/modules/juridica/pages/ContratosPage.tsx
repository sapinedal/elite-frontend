import { useState, useMemo, useEffect, useCallback } from 'react';
import { contractService } from '../services/contractService';
import { DriveExplorerModal } from '../components/DriveExplorerModal';
import { ContractModal } from '../components/ContractModal';
import { TowerModal } from '../components/TowerModal';
import { ContractTypeModal } from '../components/ContractTypeModal';
import { useProject } from '../../../context/ProjectContext';
import type { Contract, Tower, ContractType, CreateContractDTO, CreateTowerDTO, CreateContractTypeDTO } from '../types';
import {
  Building2,
  FileText,
  ExternalLink,
  Search,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Clock,
  TreePine,
  DollarSign,
  FolderOpen,
  Plus,
  Edit2,
  Trash2,
  Layers,
  Building,
  Tag
} from 'lucide-react';



export default function ContratosPage() {
  const { projects: contextProjects, activeProject, setProjectById } = useProject();

  const [contractsList, setContractsList] = useState<Contract[]>([]);
  const [towersList, setTowersList] = useState<Tower[]>([]);
  const [contractTypes, setContractTypes] = useState<ContractType[]>([]);

  const [selectedProjectId, setSelectedProjectId] = useState<number | string>(
    activeProject?.id || (contextProjects[0] ? contextProjects[0].id : 1)
  );
  const [selectedTowerId, setSelectedTowerId] = useState<number | string | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Modals state
  const [isContractModalOpen, setIsContractModalOpen] = useState(false);
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);

  const [isTowerModalOpen, setIsTowerModalOpen] = useState(false);
  const [isContractTypeModalOpen, setIsContractTypeModalOpen] = useState(false);

  const [isDriveModalOpen, setIsDriveModalOpen] = useState(false);
  const [activeDriveContract, setActiveDriveContract] = useState<{ name: string; folderId: string } | null>(null);

  // Sync selectedProjectId when activeProject in context changes
  useEffect(() => {
    if (activeProject) {
      setSelectedProjectId(activeProject.id);
    }
  }, [activeProject]);

  // Load towers, contract types, and contracts for the selected project
  const loadData = useCallback(async () => {
    try {
      if (selectedProjectId) {
        const [loadedContracts, loadedTowers, loadedTypes] = await Promise.all([
          contractService.getContracts({ project_id: selectedProjectId }),
          contractService.getTowers(selectedProjectId),
          contractService.getContractTypes()
        ]);

        if (Array.isArray(loadedTowers)) {
          setTowersList(loadedTowers);
        }

        if (Array.isArray(loadedContracts)) {
          setContractsList(loadedContracts);
        }

        if (Array.isArray(loadedTypes)) {
          setContractTypes(loadedTypes);
        }
      }
    } catch (error) {
      console.warn('Error al cargar datos desde la API:', error);
    }
  }, [selectedProjectId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handlers for Contract CRUD
  const handleSaveContract = async (data: CreateContractDTO) => {
    try {
      if (selectedContract) {
        await contractService.updateContract(selectedContract.id, {
          ...data,
          project_id: selectedProjectId ? Number(selectedProjectId) : null
        });
      } else {
        await contractService.createContract({
          ...data,
          project_id: selectedProjectId ? Number(selectedProjectId) : null
        });
      }
      loadData();
    } catch (err) {
      console.error('Error al guardar contrato:', err);
      throw err;
    }
  };

  const handleDeleteContract = async (id: number) => {
    if (!window.confirm('¿Estás seguro de eliminar este contrato?')) return;
    try {
      await contractService.deleteContract(id);
      loadData();
    } catch (err) {
      console.error('Error al eliminar contrato:', err);
      setContractsList((prev) => prev.filter((c) => c.id !== id));
    }
  };

  // Handlers for Tower Creation & Deletion
  const handleCreateTower = async (towerData: CreateTowerDTO) => {
    try {
      if (selectedProjectId) {
        await contractService.createTower(selectedProjectId, towerData);
        loadData();
      }
    } catch (err) {
      console.error('Error al crear torre:', err);
      const newTower: Tower = {
        id: Date.now(),
        project_id: Number(selectedProjectId),
        name: towerData.name,
        code: towerData.code
      };
      setTowersList((prev) => [...prev, newTower]);
    }
  };

  const handleDeleteTower = async (towerId: number) => {
    if (!window.confirm('¿Estás seguro de eliminar esta torre/etapa?')) return;
    try {
      await contractService.deleteTower(towerId);
      setTowersList((prev) => prev.filter((t) => t.id !== towerId));
      if (selectedTowerId === towerId) {
        setSelectedTowerId('all');
      }
      loadData();
    } catch (err) {
      console.error('Error al eliminar torre:', err);
      setTowersList((prev) => prev.filter((t) => t.id !== towerId));
      if (selectedTowerId === towerId) {
        setSelectedTowerId('all');
      }
    }
  };

  // Handlers for Contract Type CRUD
  const handleSaveContractType = async (typeData: CreateContractTypeDTO) => {
    try {
      const created = await contractService.createContractType(typeData);
      if (created) {
        setContractTypes((prev) => [...prev, created]);
      }
      loadData();
      return created;
    } catch (err) {
      console.error('Error al crear tipo de contrato:', err);
      const newType: ContractType = {
        id: Date.now(),
        name: typeData.name,
        description: typeData.description
      };
      setContractTypes((prev) => [...prev, newType]);
      return newType;
    }
  };

  const handleDeleteContractType = async (id: number) => {
    if (!window.confirm('¿Estás seguro de eliminar este tipo de contrato?')) return;
    try {
      await contractService.deleteContractType(id);
      setContractTypes((prev) => prev.filter((t) => t.id !== id));
      loadData();
    } catch (err) {
      console.error('Error al eliminar tipo de contrato:', err);
      setContractTypes((prev) => prev.filter((t) => t.id !== id));
    }
  };

  // Drive Explorer Modal Handler
  const handleOpenDriveExplorer = (contractorName: string, driveLink?: string) => {
    let folderId = '1YIUcRPuGpLlfvX_XSymzjekEy4jAqlwD';
    if (driveLink && driveLink.includes('/folders/')) {
      const parts = driveLink.split('/folders/');
      if (parts[1]) {
        folderId = parts[1].split('?')[0];
      }
    }

    setActiveDriveContract({
      name: contractorName,
      folderId
    });
    setIsDriveModalOpen(true);
  };

  // Filtered Contracts Logic
  const filteredContracts = useMemo(() => {
    return contractsList.filter((c) => {
      // Filter by tower if selected
      const matchesTower = selectedTowerId === 'all' || String(c.tower_id) === String(selectedTowerId) || (c.category && c.category.toLowerCase().includes(String(selectedTowerId).toLowerCase()));

      // Filter by search term
      const search = searchTerm.toLowerCase();
      const matchesSearch =
        c.contractor_name_raw.toLowerCase().includes(search) ||
        c.nro.toLowerCase().includes(search) ||
        (c.object || '').toLowerCase().includes(search) ||
        (c.type || '').toLowerCase().includes(search);

      return matchesTower && matchesSearch;
    });
  }, [contractsList, selectedTowerId, searchTerm]);

  // KPI Calculations
  const totalAmount = useMemo(() => {
    return contractsList.reduce((sum, c) => sum + (Number(c.amount) || 0), 0);
  }, [contractsList]);

  const alertsCount = useMemo(() => {
    return contractsList.filter((c) => c.status === 'Por Vencer').length;
  }, [contractsList]);

  const activeCount = useMemo(() => {
    return contractsList.filter((c) => c.status === 'Vigente').length;
  }, [contractsList]);

  const currentProjectName = contextProjects.find((p) => String(p.id) === String(selectedProjectId))?.name || activeProject?.name || 'Ciudadela San Miguel';

  return (
    <div className="max-w-[1600px] mx-auto flex flex-col gap-6 md:gap-8 py-4 md:py-6 px-4 animate-fade-in">

      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-gradient-to-r from-[#004C6C] via-[#005981] to-[#003850] p-6 md:p-8 rounded-[32px] text-white shadow-xl relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-white/5 rounded-full blur-3xl" />

        <div className="space-y-2 relative z-10">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-md border border-white/10">
              <ShieldCheck className="w-8 h-8 text-[#EE9D4C]" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-black tracking-tight">
                Control de Contratos
              </h1>
              <p className="text-xs font-bold text-blue-200 uppercase tracking-widest flex items-center gap-2 mt-0.5">
                <span>Inverconstrucción S.A.S.</span>
                <span>•</span>
                <span className="text-[#EE9D4C] font-black">{currentProjectName}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Header Right: Project Selector & Total Amount */}
        <div className="flex flex-wrap items-center gap-4 relative z-10">
          {/* Project Selector */}
          <div className="bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/15 flex items-center gap-3">
            <Building2 className="w-5 h-5 text-white/80" />
            <div className="flex flex-col">
              <span className="text-[9px] uppercase font-black text-white/50 tracking-wider">Proyecto Seleccionado</span>
              <select
                value={selectedProjectId}
                onChange={(e) => {
                  const val = e.target.value;
                  setSelectedProjectId(val);
                  setProjectById(val);
                }}
                className="bg-transparent text-xs font-black text-white outline-none cursor-pointer pr-2"
              >
                {contextProjects.map((p) => (
                  <option key={p.id} value={p.id} className="text-slate-800 font-bold">
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Total Amount Badge */}
          <div className="bg-white/10 backdrop-blur-md px-5 py-2.5 rounded-2xl border border-white/15 flex items-center gap-3">
            <DollarSign className="w-6 h-6 text-[#EE9D4C]" />
            <div>
              <p className="text-[10px] uppercase font-black text-white/50 tracking-wider">Valor Total Contratado</p>
              <p className="text-base font-black text-white">
                ${totalAmount.toLocaleString('es-CO')} COP
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Contratos */}
        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4 hover:shadow-md transition-all">
          <div className="p-3 bg-blue-50 text-[#004C6C] rounded-2xl border border-blue-100">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Total Contratos</p>
            <p className="text-2xl font-black text-[#004C6C]">{contractsList.length} Contratos</p>
            <p className="text-xs font-bold text-slate-500">${totalAmount.toLocaleString('es-CO')}</p>
          </div>
        </div>

        {/* Card 2: Torres Registradas */}
        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4 hover:shadow-md transition-all">
          <div className="p-3 bg-blue-50 text-[#004C6C] rounded-2xl border border-blue-100">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Torres / Etapas</p>
            <p className="text-2xl font-black text-[#004C6C]">{towersList.length} Configuradas</p>
            <p className="text-xs font-bold text-[#EE9D4C] truncate max-w-[200px]" title={towersList.map(t => t.name).join(', ')}>
              {towersList.length > 0
                ? (towersList.slice(0, 3).map(t => t.name).join(', ') + (towersList.length > 3 ? ` +${towersList.length - 3} más` : ''))
                : 'Sin torres registradas'}
            </p>
          </div>
        </div>

        {/* Card 3: Pólizas por Vencer */}
        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4 hover:shadow-md transition-all">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl border border-amber-100">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Pólizas por Vencer</p>
            <p className="text-2xl font-black text-amber-600">{alertsCount} Alertas Activas</p>
            <p className="text-xs font-bold text-amber-700">Atención requerida</p>
          </div>
        </div>

        {/* Card 4: Cobertura Vigente */}
        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4 hover:shadow-md transition-all">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl border border-emerald-100">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Pólizas Vigentes</p>
            <p className="text-2xl font-black text-emerald-700">{activeCount} de {contractsList.length}</p>
            <p className="text-xs font-bold text-emerald-600">
              {contractsList.length > 0 ? Math.round((activeCount / contractsList.length) * 100) : 100}% Cobertura
            </p>
          </div>
        </div>
      </div>

      {/* Control Bar: Dynamic Tower Tabs, Buttons & Search */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-slate-100 shadow-sm">

        {/* Dynamic Tower Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 lg:pb-0 scrollbar-none">
          <button
            onClick={() => setSelectedTowerId('all')}
            className={`px-4 py-2.5 rounded-2xl text-xs font-black transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${selectedTowerId === 'all'
                ? 'bg-[#004C6C] text-white shadow-md shadow-blue-900/10'
                : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
              }`}
          >
            <Building size={14} />
            Todas las Torres ({contractsList.length})
          </button>

          {towersList.map((tower) => {
            const count = contractsList.filter(
              (c) => String(c.tower_id) === String(tower.id) || (c.category && c.category.toLowerCase().includes(tower.name.toLowerCase()))
            ).length;

            return (
              <div key={tower.id} className="relative flex items-center group">
                <button
                  onClick={() => setSelectedTowerId(tower.id)}
                  className={`px-4 py-2.5 rounded-2xl text-xs font-black transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${selectedTowerId === tower.id
                      ? 'bg-[#004C6C] text-white shadow-md shadow-blue-900/10'
                      : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                    }`}
                >
                  {tower.name.toLowerCase().includes('urbanismo') ? (
                    <TreePine size={14} />
                  ) : (
                    <Building2 size={14} />
                  )}
                  {tower.name}
                  <span
                    className={`ml-1 px-2 py-0.5 rounded-full text-[10px] ${selectedTowerId === tower.id
                        ? 'bg-white/20 text-white'
                        : 'bg-slate-200 text-slate-600'
                      }`}
                  >
                    {count}
                  </span>
                </button>
              </div>
            );
          })}
        </div>

        {/* Action Buttons & Search */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Search Input */}
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por contratista, N° u objeto..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-800 font-bold focus:outline-none focus:border-[#004C6C] focus:bg-white transition-all placeholder:text-slate-300"
            />
          </div>

          {/* Botón Tipos de Contrato */}
          <button
            onClick={() => setIsContractTypeModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-amber-50 text-amber-700 border border-amber-100 rounded-2xl font-black text-xs uppercase tracking-wider hover:bg-amber-100 transition-all cursor-pointer"
            title="Administrar tipos de contrato"
          >
            <Tag size={16} />
            Tipos
          </button>

          {/* Botón Torres / Etapas */}
          <button
            onClick={() => setIsTowerModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-50 text-[#004C6C] border border-blue-100 rounded-2xl font-black text-xs uppercase tracking-wider hover:bg-blue-100 transition-all cursor-pointer"
            title="Crear o eliminar torres y etapas de este proyecto"
          >
            <Layers size={16} />
            Torres / Etapas
          </button>

          {/* Botón + Nuevo Contrato */}
          <button
            onClick={() => {
              setSelectedContract(null);
              setIsContractModalOpen(true);
            }}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#004C6C] text-white rounded-2xl font-black text-xs uppercase tracking-wider hover:bg-[#003a53] shadow-md shadow-blue-900/10 transition-all hover:scale-[1.02] active:scale-95 cursor-pointer"
          >
            <Plus size={16} />
            Nuevo Contrato
          </button>
        </div>
      </div>

      {/* Main Contracts Table */}
      <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden animate-fade-in">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                <th className="py-5 px-6">ID / N°</th>
                <th className="py-5 px-6">Contratista</th>
                <th className="py-5 px-6">Objeto / Especialidad</th>
                <th className="py-5 px-6">Valor Contrato</th>
                <th className="py-5 px-6">Póliza & Aseguradora</th>
                <th className="py-5 px-6">Estado / Vigencia</th>
                <th className="py-5 px-6 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-bold text-slate-700">
              {filteredContracts.length > 0 ? (
                filteredContracts.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/70 transition-colors group">

                    {/* ID / N° */}
                    <td className="py-5 px-6">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-50 text-[#004C6C] rounded-xl group-hover:bg-[#004C6C] group-hover:text-white transition-all">
                          <FileText className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="font-black text-[#004C6C] text-sm group-hover:text-[#004C6C]">
                            {c.nro}
                          </span>
                          <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">
                            {c.category || 'General'}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Contratista */}
                    <td className="py-5 px-6 font-black text-slate-800">
                      {c.contractor_name_raw}
                    </td>

                    {/* Objeto */}
                    <td className="py-5 px-6 text-slate-600 max-w-xs truncate">
                      <p className="font-semibold text-slate-700">{c.object}</p>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{c.type}</span>
                    </td>

                    {/* Valor Contrato */}
                    <td className="py-5 px-6 font-black text-slate-900 text-sm">
                      ${(Number(c.amount) || 0).toLocaleString('es-CO')} COP
                    </td>

                    {/* Póliza */}
                    <td className="py-5 px-6">
                      {c.policy ? (
                        <div>
                          <p className="font-black text-slate-800">{c.policy.policy_number}</p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{c.policy.insurance_company}</p>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic font-medium">Sin Póliza Registrada</span>
                      )}
                    </td>

                    {/* Estado */}
                    <td className="py-5 px-6">
                      {c.status === 'Por Vencer' ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-700 font-black text-[10px] uppercase tracking-wider rounded-full border border-amber-200">
                          <Clock className="w-3.5 h-3.5 text-amber-600" />
                          Alerta ({c.policy?.end_date || 'Próximo'})
                        </span>
                      ) : c.status === 'En Trámite' ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 text-slate-600 font-black text-[10px] uppercase tracking-wider rounded-full border border-slate-200">
                          En Trámite
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 font-black text-[10px] uppercase tracking-wider rounded-full border border-emerald-200">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          Vigente ({c.policy?.end_date || 'Vigente'})
                        </span>
                      )}
                    </td>

                    {/* Acciones */}
                    <td className="py-5 px-6 text-right">
                      <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                        {/* API Drive */}
                        <button
                          onClick={() => handleOpenDriveExplorer(c.contractor_name_raw, c.drive_link)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#004C6C] hover:bg-[#EE9D4C] text-white font-black rounded-xl text-[11px] transition-colors shadow-sm cursor-pointer"
                          title="Explorar archivos en Google Drive"
                        >
                          <FolderOpen className="w-3.5 h-3.5" />
                          Drive API
                        </button>

                        {/* Direct Link */}
                        <a
                          href={c.drive_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 text-slate-400 hover:text-[#004C6C] hover:bg-blue-50 rounded-xl transition-all"
                          title="Abrir enlace externo a Google Drive"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>

                        {/* Editar */}
                        <button
                          onClick={() => {
                            setSelectedContract(c);
                            setIsContractModalOpen(true);
                          }}
                          className="p-2 text-slate-400 hover:text-[#EE9D4C] hover:bg-orange-50 rounded-xl transition-all"
                          title="Editar Contrato"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>

                        {/* Eliminar */}
                        <button
                          onClick={() => handleDeleteContract(c.id)}
                          className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                          title="Eliminar Contrato"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-slate-400 font-bold italic">
                    No se encontraron contratos para el filtro seleccionado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Crear/Editar Contrato */}
      <ContractModal
        isOpen={isContractModalOpen}
        onClose={() => setIsContractModalOpen(false)}
        onSave={handleSaveContract}
        contract={selectedContract}
        projects={contextProjects}
        towers={towersList}
        contractTypes={contractTypes}
        selectedProjectId={selectedProjectId}
        onOpenCreateTypeModal={() => setIsContractTypeModalOpen(true)}
      />

      {/* Modal de Gestión de Torres (Crear y Eliminar) */}
      <TowerModal
        isOpen={isTowerModalOpen}
        onClose={() => setIsTowerModalOpen(false)}
        onSave={handleCreateTower}
        onDelete={handleDeleteTower}
        towersList={towersList}
        projectName={currentProjectName}
      />

      {/* Modal de Tipos de Contrato */}
      <ContractTypeModal
        isOpen={isContractTypeModalOpen}
        onClose={() => setIsContractTypeModalOpen(false)}
        onSave={handleSaveContractType}
        onDelete={handleDeleteContractType}
        typesList={contractTypes}
      />

      {/* Modal de Explorador Google Drive API */}
      <DriveExplorerModal
        isOpen={isDriveModalOpen}
        onClose={() => setIsDriveModalOpen(false)}
        folderId={activeDriveContract?.folderId}
        contractName={activeDriveContract?.name}
      />
    </div>
  );
}
