/**
 * Las fichas de fases del detalle muestran solo 3 a la vez (como en cortes): la fase anterior, la actual y la
 * siguiente. Sin fase actual (todo aprobado) se ven las 3 últimas; sin empezar, las 3 primeras.
 * Devuelve cada fase con su posición real en el flujo (para "Fase N de M").
 */
export function progressWindow<T extends { state: string }>(steps: T[], size = 3): { step: T; index: number }[] {
  if (steps.length <= size) return steps.map((step, index) => ({ step, index }));

  // La fase en curso (o devuelta); si no hay, la primera que falta
  let current = steps.findIndex((s) => s.state === 'actual' || s.state === 'devuelto');
  if (current === -1) current = steps.findIndex((s) => s.state !== 'aprobado');
  const anchor = current === -1 ? steps.length - 1 : current;
  const start = Math.min(Math.max(anchor - 1, 0), steps.length - size);

  return steps.slice(start, start + size).map((step, offset) => ({ step, index: start + offset }));
}
