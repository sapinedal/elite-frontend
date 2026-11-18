import React, { useMemo, useRef, useState } from 'react';
import type { InterventoriaHistoryPoint } from '../types';
import { formatDate, formatMoney, formatPct } from '../format';

interface AvanceHistoryChartProps {
  history: InterventoriaHistoryPoint[];
  /** Semana que se está viendo (se resalta) */
  selected?: number;
  onSelect?: (numero: number) => void;
}

const W = 640;
const H = 220;
const PAD = { top: 16, right: 56, bottom: 28, left: 40 };
const BRAND = '#004C6C';

/**
 * Avance según inversión, semana a semana: una sola serie (sin leyenda, el título la nombra), línea de 2px,
 * cuadrícula tenue, etiqueta directa solo en el último punto y tooltip con línea vertical al pasar el cursor.
 */
export const AvanceHistoryChart: React.FC<AvanceHistoryChartProps> = ({ history, selected, onSelect }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [hover, setHover] = useState<number | null>(null);

  const points = useMemo(
    () => history.filter((p): p is InterventoriaHistoryPoint & { avance_inversion: number } => p.avance_inversion != null),
    [history]
  );

  if (points.length < 2) {
    return <p className="text-xs font-bold text-slate-400 text-center py-10">Aún no hay suficientes informes para mostrar la evolución.</p>;
  }

  const minX = points[0].numero;
  const maxX = points[points.length - 1].numero;
  const x = (n: number) => PAD.left + ((n - minX) / Math.max(1, maxX - minX)) * (W - PAD.left - PAD.right);
  const y = (v: number) => PAD.top + (1 - v / 100) * (H - PAD.top - PAD.bottom);
  const path = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${x(p.numero).toFixed(1)},${y(p.avance_inversion).toFixed(1)}`).join(' ');
  const last = points[points.length - 1];
  const step = Math.max(1, Math.ceil((maxX - minX) / 8));
  const xTicks = points.filter((p) => (p.numero - minX) % step === 0 || p.numero === maxX).map((p) => p.numero);
  const hovered = hover != null ? points[hover] : null;

  const handleMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * W;
    let best = 0;
    points.forEach((p, i) => {
      if (Math.abs(x(p.numero) - px) < Math.abs(x(points[best].numero) - px)) best = i;
    });
    setHover(best);
  };

  return (
    <div className="space-y-3">
      <div className="relative">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${W} ${H}`}
          className="w-full h-auto select-none"
          role="img"
          aria-label={`Avance según inversión de la semana ${minX} a la ${maxX}: de ${formatPct(points[0].avance_inversion)} a ${formatPct(last.avance_inversion)}`}
          onMouseMove={handleMove}
          onMouseLeave={() => setHover(null)}
          onClick={() => hovered && onSelect?.(hovered.numero)}
          style={{ cursor: onSelect ? 'pointer' : 'default' }}
        >
          {[0, 25, 50, 75, 100].map((v) => (
            <g key={v}>
              <line x1={PAD.left} x2={W - PAD.right} y1={y(v)} y2={y(v)} stroke="#e2e8f0" strokeWidth={1} />
              <text x={PAD.left - 8} y={y(v) + 4} textAnchor="end" className="fill-slate-400" fontSize={11} fontWeight={600}>
                {v}%
              </text>
            </g>
          ))}
          {xTicks.map((n) => (
            <text key={n} x={x(n)} y={H - 8} textAnchor="middle" className="fill-slate-400" fontSize={11} fontWeight={600}>
              S{n}
            </text>
          ))}

          <path d={path} fill="none" stroke={BRAND} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />

          {selected != null && selected !== last.numero && points.some((p) => p.numero === selected) && (
            <circle
              cx={x(selected)}
              cy={y(points.find((p) => p.numero === selected)!.avance_inversion)}
              r={5}
              fill={BRAND}
              stroke="#fff"
              strokeWidth={2}
            />
          )}

          {/* Etiqueta directa solo en el último punto */}
          <circle cx={x(last.numero)} cy={y(last.avance_inversion)} r={5} fill={BRAND} stroke="#fff" strokeWidth={2} />
          <text x={x(last.numero) + 9} y={y(last.avance_inversion) + 4} className="fill-slate-700" fontSize={12} fontWeight={800}>
            {formatPct(last.avance_inversion)}
          </text>

          {hovered && (
            <g pointerEvents="none">
              <line x1={x(hovered.numero)} x2={x(hovered.numero)} y1={PAD.top} y2={H - PAD.bottom} stroke="#94a3b8" strokeWidth={1} strokeDasharray="3 3" />
              <circle cx={x(hovered.numero)} cy={y(hovered.avance_inversion)} r={5} fill={BRAND} stroke="#fff" strokeWidth={2} />
            </g>
          )}
        </svg>

        {hovered && (
          <div
            className="pointer-events-none absolute top-0 -translate-x-1/2 bg-white border border-slate-200 shadow-lg rounded-xl px-3 py-2 text-[11px] whitespace-nowrap"
            style={{ left: `${(x(hovered.numero) / W) * 100}%` }}
          >
            <p className="font-black text-slate-700">Semana {hovered.numero} · {formatDate(hovered.fecha)}</p>
            <p className="font-bold text-slate-600">Avance: {formatPct(hovered.avance_inversion)}</p>
            <p className="font-semibold text-slate-400">Ejecutado: {formatMoney(hovered.inversion_ejecutada)}</p>
            {onSelect && <p className="font-semibold text-slate-400">Clic para ver este informe</p>}
          </div>
        )}
      </div>

      {/* Vista en tabla (accesibilidad y consulta exacta) */}
      <details className="text-xs">
        <summary className="cursor-pointer font-bold text-[#004C6C] w-fit">Ver datos en tabla</summary>
        <div className="mt-2 max-h-60 overflow-y-auto border border-slate-100 rounded-2xl">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-slate-400 uppercase text-[10px] font-black tracking-wider sticky top-0">
              <tr>
                <th className="px-3 py-2">Semana</th>
                <th className="px-3 py-2">Fecha</th>
                <th className="px-3 py-2 text-right">Inversión ejecutada</th>
                <th className="px-3 py-2 text-right">Avance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {[...history].reverse().map((p) => (
                <tr key={p.numero} className={p.numero === selected ? 'bg-sky-50/60' : ''}>
                  <td className="px-3 py-1.5 font-bold text-slate-700">{p.numero}</td>
                  <td className="px-3 py-1.5 text-slate-500">{formatDate(p.fecha)}</td>
                  <td className="px-3 py-1.5 text-right text-slate-600">{formatMoney(p.inversion_ejecutada)}</td>
                  <td className="px-3 py-1.5 text-right font-bold text-slate-700">{formatPct(p.avance_inversion)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
};
