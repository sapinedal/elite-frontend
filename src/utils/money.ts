const COP = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });

/** Valor en pesos colombianos sin decimales: $ 1.234.567 */
export const formatMoney = (value: number | null | undefined) => (value === null || value === undefined ? '—' : COP.format(value));

/** Convierte lo que el usuario escribe ("1.234.567", "$ 1234567") en número; null si está vacío */
export const parseMoney = (value: string): number | null => {
  const digits = value.replace(/[^\d]/g, '');
  return digits ? Number(digits) : null;
};

/** Texto del campo de valor mientras se escribe: solo dígitos con separador de miles */
export const formatMoneyInput = (value: string) => {
  const amount = parseMoney(value);
  return amount === null ? '' : amount.toLocaleString('es-CO');
};
