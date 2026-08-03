import { useState, useMemo } from 'react';
import { Building2, CheckCircle2, Clock, Sparkles } from 'lucide-react';

interface Apartment {
  id: string;
  number: string;
  floor: number;
  status: 'recibido' | 'pendiente';
  ftra_code?: string;
  resident_name?: string;
}

export function AptoSemaphorizationGrid() {
  const [filterStatus, setFilterStatus] = useState<'all' | 'recibido' | 'pendiente'>('all');
  const [selectedApto, setSelectedApto] = useState<Apartment | null>(null);

  // Generar la matriz de 200 apartamentos (20 pisos x 10 aptos por piso)
  const apartments = useMemo(() => {
    const list: Apartment[] = [];
    // Pisos del 20 al 1
    for (let floor = 20; floor >= 1; floor--) {
      for (let apt = 1; apt <= 10; apt++) {
        const aptNumber = floor * 100 + apt;
        // Simular avance real de INVER (Apartamentos recibidos en los primeros pisos y torres)
        const isRecibido = apt <= 4 || (floor <= 3 && apt <= 8) || (floor >= 18 && apt <= 4);
        list.push({
          id: `apto-${aptNumber}`,
          number: `${aptNumber}`,
          floor,
          status: isRecibido ? 'recibido' : 'pendiente',
          ftra_code: isRecibido ? `FTRA-T2-${aptNumber}` : undefined,
          resident_name: isRecibido ? `Propietario Apto ${aptNumber}` : undefined,
        });
      }
    }
    return list;
  }, []);

  const stats = useMemo(() => {
    const recibidos = apartments.filter(a => a.status === 'recibido').length;
    const pendientes = apartments.filter(a => a.status === 'pendiente').length;
    const porcentaje = Math.round((recibidos / apartments.length) * 100);
    return { recibidos, pendientes, total: apartments.length, porcentaje };
  }, [apartments]);

  const filteredApartments = useMemo(() => {
    if (filterStatus === 'all') return apartments;
    return apartments.filter(a => a.status === filterStatus);
  }, [apartments, filterStatus]);

  // Agrupar por pisos para renderizar fila por fila (Piso 20 al Piso 1)
  const floorsGrouped = useMemo(() => {
    const floorsMap: { [key: number]: Apartment[] } = {};
    filteredApartments.forEach(apto => {
      if (!floorsMap[apto.floor]) floorsMap[apto.floor] = [];
      floorsMap[apto.floor].push(apto);
    });
    return Object.keys(floorsMap)
      .map(Number)
      .sort((a, b) => b - a) // Orden descendente (Piso 20 arriba)
      .map(floor => ({
        floor,
        aptos: floorsMap[floor]
      }));
  }, [filteredApartments]);

  return (
    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 space-y-6">
      {/* Grid Header & Progress KPI */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-50 text-[#004C6C] rounded-2xl">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-black text-[#004C6C] tracking-tight">Semaforización Torre 2 (200 Apartamentos)</h3>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Matriz de Avance Físico & Entregas por FTRA</p>
          </div>
        </div>

        {/* Status Counters & Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-emerald-50 px-4 py-2 rounded-2xl border border-emerald-100">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span className="text-xs font-black text-emerald-800">{stats.recibidos} Recibidos ({stats.porcentaje}%)</span>
          </div>

          <div className="flex items-center gap-2 bg-slate-100 px-4 py-2 rounded-2xl border border-slate-200">
            <Clock className="w-4 h-4 text-slate-500" />
            <span className="text-xs font-bold text-slate-600">{stats.pendientes} En Proceso</span>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center p-1 bg-slate-100 rounded-xl">
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                filterStatus === 'all' ? 'bg-[#004C6C] text-white shadow-xs' : 'text-slate-600'
              }`}
            >
              Todos
            </button>
            <button
              onClick={() => setFilterStatus('recibido')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                filterStatus === 'recibido' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600'
              }`}
            >
              Recibidos
            </button>
            <button
              onClick={() => setFilterStatus('pendiente')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                filterStatus === 'pendiente' ? 'bg-slate-600 text-white shadow-xs' : 'text-slate-600'
              }`}
            >
              En Proceso
            </button>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-xs font-bold">
          <span className="text-slate-500">Avance General de Entregas Torre 2</span>
          <span className="text-[#004C6C] font-black">{stats.porcentaje}% Completado</span>
        </div>
        <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden p-0.5">
          <div 
            className="h-full bg-gradient-to-r from-emerald-500 to-[#004C6C] rounded-full transition-all duration-500"
            style={{ width: `${stats.porcentaje}%` }}
          />
        </div>
      </div>

      {/* Apartment Matrix Grid */}
      <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 no-scrollbar">
        {floorsGrouped.map(({ floor, aptos }) => (
          <div key={`floor-${floor}`} className="flex items-center gap-3">
            <div className="w-16 shrink-0 text-right pr-2">
              <span className="text-[11px] font-black text-slate-400 uppercase">Piso {floor}</span>
            </div>
            <div className="grid grid-cols-5 sm:grid-cols-10 gap-2 flex-1">
              {aptos.map((apto) => (
                <button
                  key={apto.id}
                  onClick={() => setSelectedApto(apto)}
                  className={`p-2 rounded-xl text-xs font-extrabold transition-all border text-center flex flex-col items-center justify-center gap-0.5 cursor-pointer shadow-2xs hover:scale-105 ${
                    apto.status === 'recibido'
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                      : 'bg-slate-50 text-slate-400 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <span>{apto.number}</span>
                  {apto.status === 'recibido' && (
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  )}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Selected Apartment Modal/Card */}
      {selectedApto && (
        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between animate-fade-in">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl ${selectedApto.status === 'recibido' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'}`}>
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-black text-[#004C6C]">Apartamento {selectedApto.number} (Piso {selectedApto.floor})</p>
              <p className="text-xs text-slate-500 font-semibold">
                Estado: {selectedApto.status === 'recibido' ? '✅ Recibido a Satisfacción' : '⏳ En Proceso de Acabados / Inspección'}
              </p>
            </div>
          </div>
          <button
            onClick={() => setSelectedApto(null)}
            className="text-xs font-bold text-slate-400 hover:text-slate-700 px-3 py-1.5 bg-white rounded-lg border border-slate-200"
          >
            Cerrar
          </button>
        </div>
      )}
    </div>
  );
}
