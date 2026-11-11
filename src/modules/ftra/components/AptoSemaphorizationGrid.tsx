import { useState, useMemo, useEffect, type CSSProperties } from 'react';
import { Building2, CheckCircle2, Clock, Loader2, CornerUpLeft, Circle, Eye } from 'lucide-react';
import { ftraRecordService } from '../services/ftraRecordService';
import { formatService } from '../services/formatService';
import { useProject } from '../../../context/ProjectContext';
import { CustomSelect } from '../../../components/ui/CustomSelect';
import { FTRA_STATUS_LABELS, type FtraFormat, type FtraTower, type FtraUnitStatus } from '../types';

/** aprobado = verde (Supervisor y Director lo recibieron) · proceso = gris (registrado, en revisión o devuelto) · falta = sin FTRA */
type UnitState = 'aprobado' | 'proceso' | 'falta';

interface Unit {
  number: string;
  floor: number;
  state: UnitState;
  approved: number;
  returned: boolean;
  info?: FtraUnitStatus;
}

const CELL: Record<UnitState, string> = {
  aprobado: 'bg-emerald-500 text-white border-emerald-500',
  proceso: 'bg-slate-300 text-slate-700 border-slate-300',
  falta: 'bg-white text-slate-400 border-slate-200 border-dashed',
};

const LEGEND: { key: UnitState; label: string; swatch: string }[] = [
  { key: 'aprobado', label: 'Aprobado', swatch: 'bg-emerald-500' },
  { key: 'proceso', label: 'Registrado / en revisión', swatch: 'bg-slate-300' },
  { key: 'falta', label: 'Sin FTRA', swatch: 'bg-white border border-dashed border-slate-300' },
];

interface AptoSemaphorizationGridProps {
  /** Formatos (tipos de FTRA) activos; si no se pasan se cargan aquí */
  formats?: FtraFormat[];
  /** Cambia para recargar el estado (p. ej. después de registrar o revisar un FTRA) */
  refreshKey?: unknown;
  /** Abre el detalle de un registro */
  onOpenRecord?: (recordId: number) => void;
}

/**
 * Matriz de la torre (pisos × apartamentos de Administración › Proyectos) filtrable por formato:
 * muestra qué apartamento o piso tiene pendiente cada tipo de FTRA.
 */
export function AptoSemaphorizationGrid({ formats: formatsProp, refreshKey, onOpenRecord }: AptoSemaphorizationGridProps) {
  const [loadedFormats, setLoadedFormats] = useState<FtraFormat[]>([]);
  const formats = formatsProp ?? loadedFormats;
  const { activeProject, isLoading: isLoadingProjects } = useProject();
  const [towers, setTowers] = useState<FtraTower[]>([]);
  const [towerId, setTowerId] = useState('');
  const [formatId, setFormatId] = useState('');
  const [units, setUnits] = useState<FtraUnitStatus[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<UnitState | 'all'>('all');
  const [selectedNumber, setSelectedNumber] = useState<string | null>(null);

  useEffect(() => {
    if (isLoadingProjects) return;
    let cancelled = false;
    ftraRecordService.getTowers()
      .then(list => {
        if (cancelled) return;
        const withUnits = list.filter(t => (t.floors ?? 0) > 0 && (t.apartments_per_floor ?? 0) > 0);
        setTowers(withUnits);
        setTowerId(prev => (withUnits.some(t => t.id.toString() === prev) ? prev : withUnits[0]?.id.toString() ?? ''));
      })
      .catch(() => !cancelled && setTowers([]));
    return () => { cancelled = true; };
  }, [activeProject?.id, isLoadingProjects]);

  useEffect(() => {
    if (formatsProp) return;
    formatService.getFormats({ per_page: 100, is_active: 'true' })
      .then(r => setLoadedFormats(r.data))
      .catch(() => setLoadedFormats([]));
  }, [formatsProp]);

  useEffect(() => {
    if (!towerId) return;
    let cancelled = false;
    setLoading(true);
    ftraRecordService.getUnitsStatus(Number(towerId))
      .then(data => !cancelled && setUnits(data))
      .catch(() => !cancelled && setUnits([]))
      .finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
  }, [towerId, refreshKey]);

  const tower = towers.find(t => t.id.toString() === towerId);
  const perFloor = tower?.apartments_per_floor ?? 0;
  const formatsById = useMemo(() => new Map(formats.map(f => [f.id, f])), [formats]);
  const totalFormats = formats.length;

  const allUnits = useMemo<Unit[]>(() => {
    if (!tower?.floors || !perFloor) return [];
    const byNumber = new Map(units.map(u => [u.apartamento, u]));
    const list: Unit[] = [];
    for (let floor = tower.floors; floor >= 1; floor--) {
      for (let i = 1; i <= perFloor; i++) {
        const number = String(floor * 100 + i);
        const info = byNumber.get(number);
        const entries = (info?.formats ?? []).filter(f => !formatId || f.format_id.toString() === formatId);
        const approved = entries.filter(f => f.status === 'Aprobada').length;
        // Con un formato: verde si ese FTRA está aprobado. Con todos: verde solo si todos los formatos activos lo están.
        const needed = formatId ? 1 : Math.max(totalFormats, 1);
        const state: UnitState = entries.length === 0 ? 'falta' : approved >= needed ? 'aprobado' : 'proceso';
        list.push({ number, floor, state, approved, returned: entries.some(f => f.status === 'Devuelta'), info });
      }
    }
    return list;
  }, [tower, perFloor, units, formatId, totalFormats]);

  const stats = useMemo(() => {
    const count = (s: UnitState) => allUnits.filter(u => u.state === s).length;
    const total = allUnits.length;
    return { total, aprobado: count('aprobado'), proceso: count('proceso'), falta: count('falta'), pct: total ? Math.round((count('aprobado') / total) * 100) : 0 };
  }, [allUnits]);

  const floors = useMemo(() => {
    const map = new Map<number, Unit[]>();
    allUnits.forEach(u => map.set(u.floor, [...(map.get(u.floor) ?? []), u]));
    return [...map.entries()].sort((a, b) => b[0] - a[0]);
  }, [allUnits]);

  const selected = allUnits.find(u => u.number === selectedNumber) ?? null;

  if (!isLoadingProjects && towers.length === 0) {
    return (
      <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm p-6 flex items-start gap-3 text-sm font-bold text-slate-500">
        <Building2 size={18} className="text-[#004C6C] shrink-0" />
        <span>El proyecto no tiene torres con pisos y apartamentos configurados. Se configuran en Administración › Proyectos › Torres.</span>
      </div>
    );
  }

  // Hasta 5 columnas en mobile y 10 en escritorio; si hay más apartamentos por piso, la fila continúa debajo
  const gridStyle = {
    '--cols-mobile': `repeat(${Math.min(perFloor || 1, 5)}, minmax(0, 1fr))`,
    '--cols-desktop': `repeat(${Math.min(perFloor || 1, 10)}, minmax(0, 1fr))`,
  } as CSSProperties;

  const selectedFormat = formatId ? formatsById.get(Number(formatId)) : null;

  return (
    <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm p-4 sm:p-6 space-y-5">
      {/* Controles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[220px_1fr] gap-3">
        {towers.length > 1 ? (
          <CustomSelect
            label="Torre"
            placeholder="Selecciona la torre"
            options={towers.map(t => ({ value: t.id.toString(), label: t.name }))}
            value={towerId}
            onChange={v => { setTowerId(v); setSelectedNumber(null); }}
          />
        ) : (
          <div className="space-y-1">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Torre</span>
            <p className="px-5 py-2.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-black text-[#004C6C]">{tower?.name ?? '—'}</p>
          </div>
        )}
        <CustomSelect
          label="Tipo de FTRA (formato)"
          placeholder="Todos los formatos"
          clearable
          options={formats.map(f => ({ value: f.id.toString(), label: `[${f.code}] ${f.name}` }))}
          value={formatId}
          onChange={v => { setFormatId(v ?? ''); setSelectedNumber(null); }}
        />
      </div>

      {/* Avance y leyenda */}
      <div className="bg-slate-50 border border-slate-100 rounded-3xl p-4 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
          <p className="text-xs font-black text-[#004C6C]">
            {tower?.name} · {selectedFormat ? selectedFormat.name : `Todos los formatos (${totalFormats})`}
          </p>
          <p className="text-[11px] font-bold text-slate-500">
            {stats.aprobado} de {stats.total} apartamentos aprobados · {stats.pct}%
          </p>
        </div>
        <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
          <div className="h-full bg-emerald-500 rounded-full transition-all duration-500" style={{ width: `${stats.pct}%` }} />
        </div>
        <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-1 px-1">
          {[{ key: 'all' as const, label: 'Todos', swatch: '', count: stats.total }, ...LEGEND.map(l => ({ ...l, count: stats[l.key] }))].map(item => (
            <button
              key={item.key}
              onClick={() => setFilter(item.key)}
              className={`shrink-0 flex items-center gap-2 px-3 py-1.5 rounded-xl text-[11px] font-bold border transition-all cursor-pointer ${
                filter === item.key ? 'bg-[#004C6C] text-white border-[#004C6C]' : 'bg-white text-slate-600 border-slate-200'
              }`}
            >
              {item.swatch && <span className={`h-3 w-3 rounded ${item.swatch}`} />}
              {item.label} · {item.count}
            </button>
          ))}
        </div>
        {!formatId && (
          <p className="text-[10px] font-semibold text-slate-400">
            Con todos los formatos, un apartamento queda en verde cuando tiene aprobados los {totalFormats} tipos de FTRA. El número pequeño indica cuántos lleva.
          </p>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-10 text-xs font-bold text-slate-400">
          <Loader2 size={16} className="animate-spin" /> Cargando apartamentos...
        </div>
      ) : (
        <div className="space-y-2 max-h-[560px] overflow-y-auto pr-1 no-scrollbar">
          {floors.map(([floor, aptos]) => {
            const done = aptos.filter(a => a.state === 'aprobado').length;
            return (
              <div key={floor} className="flex items-start gap-2 sm:gap-3">
                <div className="w-11 sm:w-16 shrink-0 text-right pt-1.5">
                  <p className="text-[10px] sm:text-[11px] font-black text-slate-500 uppercase leading-none">P{floor}</p>
                  <p className={`text-[9px] font-bold mt-0.5 ${done === aptos.length ? 'text-emerald-600' : 'text-slate-400'}`}>{done}/{aptos.length}</p>
                </div>
                <div className="grid gap-1.5 sm:gap-2 flex-1 [grid-template-columns:var(--cols-mobile)] sm:[grid-template-columns:var(--cols-desktop)]" style={gridStyle}>
                  {aptos.map(apto => {
                    const dimmed = filter !== 'all' && apto.state !== filter;
                    return (
                      <button
                        key={apto.number}
                        onClick={() => setSelectedNumber(apto.number === selectedNumber ? null : apto.number)}
                        className={`relative py-2 rounded-xl text-[11px] sm:text-xs font-extrabold border text-center transition-all cursor-pointer ${CELL[apto.state]} ${dimmed ? 'opacity-20' : ''} ${selectedNumber === apto.number ? 'ring-2 ring-offset-1 ring-[#004C6C]' : ''}`}
                        title={apto.returned ? 'Tiene un FTRA devuelto' : undefined}
                      >
                        {apto.number}
                        {!formatId && totalFormats > 1 && apto.state === 'proceso' && (
                          <span className="block text-[8px] font-bold leading-none mt-0.5 opacity-70">{apto.approved}/{totalFormats}</span>
                        )}
                        {apto.returned && <span className="absolute top-1 right-1 h-1.5 w-1.5 rounded-full bg-rose-500" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Detalle del apartamento: estado de cada tipo de FTRA */}
      {selected && (
        <div className="p-5 bg-slate-50 rounded-3xl border border-slate-100 space-y-3 animate-fade-in">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-black text-[#004C6C]">Apartamento {selected.number} · Piso {selected.floor}</p>
            <button onClick={() => setSelectedNumber(null)} className="text-xs font-bold text-slate-400 hover:text-slate-700 px-3 py-1.5 bg-slate-50 rounded-lg border border-slate-200 cursor-pointer">
              Cerrar
            </button>
          </div>
          <ul className="divide-y divide-slate-100">
            {(selectedFormat ? [selectedFormat] : formats).map(format => {
              const entry = selected.info?.formats.find(f => f.format_id === format.id);
              const status = entry?.status;
              const Icon = status === 'Aprobada' ? CheckCircle2 : status === 'Devuelta' ? CornerUpLeft : status ? Clock : Circle;
              const color = status === 'Aprobada' ? 'text-emerald-600' : status === 'Devuelta' ? 'text-rose-600' : status ? 'text-slate-500' : 'text-slate-300';
              return (
                <li key={format.id} className="flex items-center justify-between gap-3 py-2.5">
                  <div className="flex items-start gap-2.5 min-w-0">
                    <Icon size={16} className={`shrink-0 mt-0.5 ${color}`} />
                    <div className="min-w-0">
                      <p className="text-xs font-black text-slate-700 truncate">[{format.code}] {format.name}</p>
                      <p className={`text-[11px] font-bold ${color}`}>
                        {status ? FTRA_STATUS_LABELS[status] : 'Falta registrar'}
                        {entry?.contractor && <span className="text-slate-400 font-semibold"> · {entry.contractor}</span>}
                      </p>
                    </div>
                  </div>
                  {entry && onOpenRecord && (
                    <button onClick={() => onOpenRecord(entry.record_id)} className="shrink-0 flex items-center gap-1 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-[#004C6C] bg-blue-50 rounded-lg cursor-pointer">
                      <Eye size={12} /> Ver
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
