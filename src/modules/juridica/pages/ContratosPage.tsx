import { useState, useMemo, useEffect } from 'react';
import { contractService } from '../services/contractService';
import { DriveExplorerModal } from '../components/DriveExplorerModal';
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
  FolderOpen
} from 'lucide-react';

interface Policy {
  policy_number: string;
  insurance_company: string;
  insured_value: number;
  end_date: string;
}

interface Contract {
  id: number;
  nro: string;
  contractor_name_raw: string;
  type: string;
  category: 'torre2' | 'urbanismo';
  object: string;
  amount: number;
  status: 'Vigente' | 'Por Vencer' | 'En Trámite';
  drive_link: string;
  policy?: Policy | null;
}

const initialContracts: Contract[] = [
  // Torre 2
  {
    id: 1,
    nro: '1 T2',
    contractor_name_raw: 'EMELECT GROUP S.A.S.',
    type: 'Mano de Obra',
    category: 'torre2',
    object: 'Redes Eléctricas e Iluminación Torre 2',
    amount: 320000000,
    status: 'Vigente',
    drive_link: 'https://drive.google.com/drive/folders/1YIUcRPuGpLlfvX_XSymzjekEy4jAqlwD',
    policy: {
      policy_number: 'Seguros del Estado 994821',
      insurance_company: 'Seguros del Estado',
      insured_value: 320000000,
      end_date: '30/Nov/2026',
    }
  },
  {
    id: 2,
    nro: '2 T2',
    contractor_name_raw: 'YANCELLY ASTRID MONSALVE YEPES',
    type: 'Mano de Obra',
    category: 'torre2',
    object: 'Mampostería, Estructura y Acabados Torre 2',
    amount: 485500000,
    status: 'Vigente',
    drive_link: 'https://drive.google.com/drive/folders/1YIUcRPuGpLlfvX_XSymzjekEy4jAqlwD',
    policy: {
      policy_number: 'Suramericana 4182910',
      insurance_company: 'Suramericana',
      insured_value: 485500000,
      end_date: '15/Ene/2027',
    }
  },
  {
    id: 3,
    nro: '3 T2',
    contractor_name_raw: 'IHC S.A.S',
    type: 'Suministro e Instalación',
    category: 'torre2',
    object: 'Redes Hidrosanitarias y Gas Torre 2',
    amount: 245000000,
    status: 'Vigente',
    drive_link: 'https://drive.google.com/drive/folders/1YIUcRPuGpLlfvX_XSymzjekEy4jAqlwD',
    policy: {
      policy_number: 'Seguros Mundial M-98214',
      insurance_company: 'Seguros Mundial',
      insured_value: 245000000,
      end_date: '28/Feb/2027',
    }
  },
  {
    id: 4,
    nro: '4 T2',
    contractor_name_raw: 'IASS S.A.S',
    type: 'Suministro e Instalación',
    category: 'torre2',
    object: 'Suministro e Instalación Subestación Eléctrica',
    amount: 189000000,
    status: 'Vigente',
    drive_link: 'https://drive.google.com/drive/folders/1YIUcRPuGpLlfvX_XSymzjekEy4jAqlwD',
    policy: {
      policy_number: 'Suramericana 439182',
      insurance_company: 'Suramericana',
      insured_value: 189000000,
      end_date: '10/Dic/2026',
    }
  },
  {
    id: 5,
    nro: '5 T2',
    contractor_name_raw: 'VENTANERÍA Y ALUMINIOS SAN MIGUEL',
    type: 'Suministro e Instalación',
    category: 'torre2',
    object: 'Suministro e Instalación Ventanería Torre 2',
    amount: 168000000,
    status: 'Por Vencer',
    drive_link: 'https://drive.google.com/drive/folders/1YIUcRPuGpLlfvX_XSymzjekEy4jAqlwD',
    policy: {
      policy_number: 'Seguros del Estado 881923',
      insurance_company: 'Seguros del Estado',
      insured_value: 168000000,
      end_date: '14/Ago/2026',
    }
  },
  {
    id: 6,
    nro: '6 a 16 T2',
    contractor_name_raw: 'Carpintería, Ascensores, Impermeabilización...',
    type: 'Acabados Varios',
    category: 'torre2',
    object: 'Acabados, Pintura, Puertas y Aparatos Sanitarios',
    amount: 890000000,
    status: 'Vigente',
    drive_link: 'https://drive.google.com/drive/folders/1YIUcRPuGpLlfvX_XSymzjekEy4jAqlwD',
    policy: {
      policy_number: 'Varios 992011',
      insurance_company: 'Aseguradoras Varias',
      insured_value: 890000000,
      end_date: '31/Mar/2027',
    }
  },

  // Urbanismo
  {
    id: 7,
    nro: '1 URB',
    contractor_name_raw: 'INNOVAGAS S.A.S',
    type: 'Redes Exteriores',
    category: 'urbanismo',
    object: 'Redes de Gas Urbanismo y Exteriores',
    amount: 150000000,
    status: 'En Trámite',
    drive_link: 'https://drive.google.com/drive/folders/1YIUcRPuGpLlfvX_XSymzjekEy4jAqlwD',
    policy: null
  },
  {
    id: 8,
    nro: '2 URB',
    contractor_name_raw: 'EQUIPOS Y VIAS',
    type: 'Obra Civil',
    category: 'urbanismo',
    object: 'Construcción de Vías y Andenes Urbanismo',
    amount: 448657205,
    status: 'Vigente',
    drive_link: 'https://drive.google.com/drive/folders/1YIUcRPuGpLlfvX_XSymzjekEy4jAqlwD',
    policy: {
      policy_number: 'Suramericana 4282970',
      insurance_company: 'Suramericana',
      insured_value: 448657205,
      end_date: '30/Abr/2027',
    }
  },
  {
    id: 9,
    nro: '3 URB',
    contractor_name_raw: 'HIDRODINAMICA Y ESTRUCTURAS S.A.S',
    type: 'Redes Hidrosanitarias',
    category: 'urbanismo',
    object: 'Redes de Acueducto y Alcantarillado',
    amount: 384000000,
    status: 'Vigente',
    drive_link: 'https://drive.google.com/drive/folders/1YIUcRPuGpLlfvX_XSymzjekEy4jAqlwD',
    policy: {
      policy_number: 'Seguros Mundial M-100266629',
      insurance_company: 'Seguros Mundial',
      insured_value: 384000000,
      end_date: '15/May/2027',
    }
  },
  {
    id: 10,
    nro: '4 URB',
    contractor_name_raw: 'AS INGENIERIA S.A.S',
    type: 'Obra Civil',
    category: 'urbanismo',
    object: 'Construcción Portería Principal',
    amount: 169243775,
    status: 'Vigente',
    drive_link: 'https://drive.google.com/drive/folders/1YIUcRPuGpLlfvX_XSymzjekEy4jAqlwD',
    policy: {
      policy_number: 'Suramericana 4363231',
      insurance_company: 'Suramericana',
      insured_value: 169243775,
      end_date: '20/Nov/2026',
    }
  },
  {
    id: 11,
    nro: '5 URB',
    contractor_name_raw: 'IASS S.A.S',
    type: 'Redes Eléctricas',
    category: 'urbanismo',
    object: 'Redes Eléctricas Exteriores Urbanismo',
    amount: 116194864,
    status: 'Vigente',
    drive_link: 'https://drive.google.com/drive/folders/1YIUcRPuGpLlfvX_XSymzjekEy4jAqlwD',
    policy: {
      policy_number: 'Seguros Mundial M-100249799',
      insurance_company: 'Seguros Mundial',
      insured_value: 116194864,
      end_date: '31/Dic/2026',
    }
  },
  {
    id: 12,
    nro: '6 URB',
    contractor_name_raw: 'IHC S.A.S',
    type: 'Red Contraincendio',
    category: 'urbanismo',
    object: 'Red Contraincendio Urbanismo',
    amount: 76941827,
    status: 'Vigente',
    drive_link: 'https://drive.google.com/drive/folders/1YIUcRPuGpLlfvX_XSymzjekEy4jAqlwD',
    policy: {
      policy_number: 'Suramericana 4371437',
      insurance_company: 'Suramericana',
      insured_value: 76941827,
      end_date: '30/Ene/2027',
    }
  },
  {
    id: 13,
    nro: '9 URB',
    contractor_name_raw: 'INDUCOVER',
    type: 'Impermeabilización',
    category: 'urbanismo',
    object: 'Impermeabilización Tanque de Agua',
    amount: 30488337,
    status: 'Vigente',
    drive_link: 'https://drive.google.com/drive/folders/1YIUcRPuGpLlfvX_XSymzjekEy4jAqlwD',
    policy: {
      policy_number: 'Garantía 5 Años - 88192',
      insurance_company: 'Seguros del Estado',
      insured_value: 30488337,
      end_date: '30/Jun/2031',
    }
  },
  {
    id: 14,
    nro: '10 URB',
    contractor_name_raw: 'CONSTRUCCIONES QUINTANA',
    type: 'Obra Civil',
    category: 'urbanismo',
    object: 'Muro de Contención M1 / M4',
    amount: 20724845,
    status: 'Vigente',
    drive_link: 'https://drive.google.com/drive/folders/1YIUcRPuGpLlfvX_XSymzjekEy4jAqlwD',
    policy: {
      policy_number: 'Suramericana 429108',
      insurance_company: 'Suramericana',
      insured_value: 20724845,
      end_date: '15/Dic/2026',
    }
  }
];

export default function ContratosPage() {
  const [contractsList, setContractsList] = useState<Contract[]>(initialContracts);
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'torre2' | 'urbanismo'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isDriveModalOpen, setIsDriveModalOpen] = useState(false);
  const [activeDriveContract, setActiveDriveContract] = useState<{ name: string; folderId: string } | null>(null);

  useEffect(() => {
    const loadContracts = async () => {
      try {
        const data = await contractService.getContracts();
        if (data && Array.isArray(data) && data.length > 0) {
          const mapped: Contract[] = data.map((c: any) => ({
            id: c.id,
            nro: c.nro,
            contractor_name_raw: c.contractor_name_raw || c.contractor?.name || 'Contratista Sin Nombre',
            type: c.type,
            category: c.category as 'torre2' | 'urbanismo',
            object: c.object || '',
            amount: Number(c.amount),
            status: (c.status || 'Vigente') as any,
            drive_link: c.drive_link || 'https://drive.google.com/drive/folders/1YIUcRPuGpLlfvX_XSymzjekEy4jAqlwD',
            policy: c.policies && c.policies.length > 0 ? {
              policy_number: c.policies[0].policy_number,
              insurance_company: c.policies[0].insurance_company,
              insured_value: Number(c.policies[0].insured_value),
              end_date: c.policies[0].end_date || '30/Nov/2026',
            } : null
          }));
          setContractsList(mapped);
        }
      } catch (error) {
        console.warn('Usando contratos locales de respaldo:', error);
      }
    };
    loadContracts();
  }, []);

  const handleOpenDriveExplorer = (contractorName: string) => {
    setActiveDriveContract({
      name: contractorName,
      folderId: '1YIUcRPuGpLlfvX_XSymzjekEy4jAqlwD'
    });
    setIsDriveModalOpen(true);
  };

  const filteredContracts = useMemo(() => {
    return contractsList.filter((contract) => {
      const matchesCategory = selectedCategory === 'all' || contract.category === selectedCategory;
      const matchesSearch = 
        contract.contractor_name_raw.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contract.nro.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contract.object.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [contractsList, selectedCategory, searchTerm]);

  const totalAmount = useMemo(() => {
    return contractsList.reduce((sum, c) => sum + c.amount, 0);
  }, [contractsList]);

  const totalTorre2 = useMemo(() => {
    return contractsList.filter(c => c.category === 'torre2').reduce((sum, c) => sum + c.amount, 0);
  }, [contractsList]);

  const totalUrbanismo = useMemo(() => {
    return contractsList.filter(c => c.category === 'urbanismo').reduce((sum, c) => sum + c.amount, 0);
  }, [contractsList]);

  return (
    <div className="max-w-[1600px] mx-auto flex flex-col gap-6 md:gap-8 py-4 md:py-6 px-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-[#004C6C] via-[#005981] to-[#003850] p-6 md:p-8 rounded-[32px] text-white shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/10 rounded-2xl backdrop-blur-md">
              <ShieldCheck className="w-7 h-7 text-[#EE9D4C]" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-black tracking-tight">Área Jurídica & Control de Contratos</h1>
              <p className="text-xs font-bold text-blue-200 uppercase tracking-widest">Inverconstrucción S.A.S. | Ciudadela San Miguel</p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/10 flex items-center gap-3">
            <DollarSign className="w-5 h-5 text-[#EE9D4C]" />
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-300">Valor Total Contratado</p>
              <p className="text-base font-black text-white">${totalAmount.toLocaleString('es-CO')} COP</p>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-blue-50 text-[#004C6C] rounded-2xl">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Contratos Torre 2</p>
            <p className="text-xl font-black text-[#004C6C]">16 Contratos</p>
            <p className="text-xs font-bold text-slate-500">${totalTorre2.toLocaleString('es-CO')}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
            <TreePine className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Contratos Urbanismo</p>
            <p className="text-xl font-black text-emerald-700">15 Contratos</p>
            <p className="text-xs font-bold text-slate-500">${totalUrbanismo.toLocaleString('es-CO')}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Pólizas por Vencer</p>
            <p className="text-xl font-black text-amber-600">1 Alerta Activa</p>
            <p className="text-xs font-semibold text-amber-700">Ventanería San Miguel</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Pólizas Vigentes</p>
            <p className="text-xl font-black text-indigo-900">30 de 31</p>
            <p className="text-xs font-semibold text-emerald-600">96.7% Cobertura</p>
          </div>
        </div>
      </div>

      {/* Control Bar: Category Tabs & Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-3xl border border-slate-100 shadow-sm">
        {/* Category Tabs */}
        <div className="flex items-center p-1 bg-slate-100 rounded-2xl w-full sm:w-auto">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`flex-1 sm:flex-initial px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
              selectedCategory === 'all'
                ? 'bg-[#004C6C] text-white shadow-md'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Todos ({initialContracts.length})
          </button>
          <button
            onClick={() => setSelectedCategory('torre2')}
            className={`flex-1 sm:flex-initial px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              selectedCategory === 'torre2'
                ? 'bg-[#004C6C] text-white shadow-md'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            Torre 2
          </button>
          <button
            onClick={() => setSelectedCategory('urbanismo')}
            className={`flex-1 sm:flex-initial px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              selectedCategory === 'urbanismo'
                ? 'bg-[#004C6C] text-white shadow-md'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <TreePine className="w-3.5 h-3.5" />
            Urbanismo
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por contratista, ID u objeto..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-800 font-semibold focus:outline-none focus:border-[#004C6C] focus:bg-white transition-all"
          />
        </div>
      </div>

      {/* Main Contracts Table */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-100 text-[11px] font-black text-slate-400 uppercase tracking-wider">
                <th className="py-4 px-6">ID / N°</th>
                <th className="py-4 px-6">Contratista</th>
                <th className="py-4 px-6">Objeto / Especialidad</th>
                <th className="py-4 px-6">Valor Contrato</th>
                <th className="py-4 px-6">Póliza & Aseguradora</th>
                <th className="py-4 px-6">Vigencia Póliza</th>
                <th className="py-4 px-6 text-center">Acción Drive</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredContracts.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-4 px-6 font-black text-[#004C6C]">
                    <div className="flex items-center gap-2">
                      <span className="p-1.5 bg-blue-50 text-[#004C6C] rounded-lg">
                        <FileText className="w-4 h-4" />
                      </span>
                      {c.nro}
                    </div>
                  </td>
                  <td className="py-4 px-6 font-bold text-slate-900">
                    {c.contractor_name_raw}
                  </td>
                  <td className="py-4 px-6 text-slate-600 max-w-xs truncate">
                    {c.object}
                  </td>
                  <td className="py-4 px-6 font-extrabold text-slate-900">
                    ${c.amount.toLocaleString('es-CO')} COP
                  </td>
                  <td className="py-4 px-6">
                    {c.policy ? (
                      <div>
                        <p className="font-bold text-slate-800">{c.policy.policy_number}</p>
                        <p className="text-[10px] text-slate-400 font-semibold">{c.policy.insurance_company}</p>
                      </div>
                    ) : (
                      <span className="text-slate-400 italic">Sin Póliza Registrada</span>
                    )}
                  </td>
                  <td className="py-4 px-6">
                    {c.status === 'Por Vencer' ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-700 font-bold text-[11px] rounded-full border border-amber-200">
                        <Clock className="w-3.5 h-3.5 text-amber-600" />
                        Alerta ({c.policy?.end_date})
                      </span>
                    ) : c.status === 'En Trámite' ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 text-slate-600 font-bold text-[11px] rounded-full border border-slate-200">
                        En Trámite de Firma
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 font-bold text-[11px] rounded-full border border-emerald-200">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        Vigente ({c.policy?.end_date})
                      </span>
                    )}
                  </td>
                  <td className="py-4 px-6 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => handleOpenDriveExplorer(c.contractor_name_raw)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#004C6C] hover:bg-[#EE9D4C] text-white font-bold rounded-xl text-xs transition-colors shadow-xs cursor-pointer"
                        title="Explorar archivos vía Google Drive API"
                      >
                        <FolderOpen className="w-3.5 h-3.5" />
                        API Drive
                      </button>
                      <a
                        href={c.drive_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors"
                        title="Abrir carpeta en Google Drive directamente"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

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
