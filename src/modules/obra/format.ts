const money = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });
const percent = new Intl.NumberFormat('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const formatMoney = (value: number | null | undefined) => (value == null ? '—' : money.format(value));
export const formatPct = (value: number | null | undefined) => (value == null ? '—' : `${percent.format(value)}%`);

/** '2026-11-17' -> '17 nov 2026' (sin desfase de zona horaria) */
export const formatDate = (value: string | null | undefined) => {
  if (!value) return '—';
  const [y, m, d] = value.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' });
};
