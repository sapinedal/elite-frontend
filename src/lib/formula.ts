/**
 * Motor de fórmulas tipo Excel compartido por indicadores y tablas de detalle.
 *
 * - Operadores: + - * / ^, paréntesis y comparaciones (=, <>, <, <=, >, >=).
 * - Funciones: SUMA/SUM, PROMEDIO/AVERAGE, MIN, MAX, CONTAR/COUNT, ABS, REDONDEAR/ROUND, SI/IF.
 * - Separador de argumentos: ";" o ",". Decimales con ".".
 * - Las variables se referencian por su nombre exacto (admite espacios, tildes y "/"),
 *   sin importar mayúsculas/tildes, o entre corchetes: [AVANCE REAL].
 * - En una tabla, el nombre de una columna dentro de una fórmula de columna es el valor
 *   de esa columna en la misma fila; dentro de un indicador es la lista de valores de la
 *   columna y debe usarse con una función de agregación: PROMEDIO(DÍAS).
 *
 * No usa eval: la expresión se parsea y evalúa de forma controlada.
 */

export type FormulaValue = number | number[];

export interface FormulaScope {
  /** Variables escalares (parámetros del indicador o celdas de la fila actual). */
  vars?: Record<string, number | null | undefined>;
  /** Columnas de la tabla de detalle como listas de números (solo para agregaciones). */
  columns?: Record<string, number[]>;
}

export interface DetailTable {
  headers: string[];
  rows: (string | null)[][];
  /** Fórmula por columna (sin "="). null/'' si la columna es de captura manual. */
  formulas?: (string | null)[];
}

export class FormulaError extends Error {}

const normalizeName = (s: string) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, ' ').trim().toUpperCase();

/** Convierte el texto de una celda en número: admite "60%", "$ 1.200,50", "1,5". */
export const parseCellNumber = (raw: unknown): number | null => {
  if (raw === null || raw === undefined) return null;
  if (typeof raw === 'number') return isFinite(raw) ? raw : null;
  let s = String(raw).replace(/[%$\s]/g, '');
  if (s === '' || s === '-') return null;
  if (s.includes(',') && s.includes('.')) {
    // El último separador es el decimal
    s = s.lastIndexOf(',') > s.lastIndexOf('.') ? s.replace(/\./g, '').replace(',', '.') : s.replace(/,/g, '');
  } else if (s.includes(',')) {
    s = s.replace(',', '.');
  }
  const n = Number(s);
  return isFinite(n) ? n : null;
};

// ─── Tokenizer ────────────────────────────────────────────────────────────────

type Token =
  | { t: 'num'; v: number }
  | { t: 'ref'; v: string } // nombre normalizado de variable/columna
  | { t: 'fn'; v: string }
  | { t: 'op'; v: string }
  | { t: '(' }
  | { t: ')' }
  | { t: 'sep' };

const FUNCTIONS = ['SUMA', 'SUM', 'PROMEDIO', 'AVERAGE', 'MIN', 'MAX', 'CONTAR', 'COUNT', 'ABS', 'REDONDEAR', 'ROUND', 'SI', 'IF'];

const tokenize = (input: string, knownNames: string[]): Token[] => {
  // Nombres más largos primero para que "META VENTAS" gane sobre "META"
  const names = [...new Set(knownNames.map(normalizeName).filter(Boolean))].sort((a, b) => b.length - a.length);
  const src = input.trim().replace(/^=/, '');

  const tokens: Token[] = [];
  let i = 0;
  const isWordChar = (c: string | undefined) => !!c && /[\p{L}\p{N}_]/u.test(c);

  while (i < src.length) {
    const c = src[i];
    if (/\s/.test(c)) { i++; continue; }

    if (c === '[') {
      const end = src.indexOf(']', i);
      if (end === -1) throw new FormulaError('Falta cerrar el corchete "]"');
      tokens.push({ t: 'ref', v: normalizeName(src.slice(i + 1, end)) });
      i = end + 1;
      continue;
    }

    // Nombres conocidos (pueden contener espacios, tildes o "/")
    if (i === 0 || !isWordChar(src[i - 1])) {
      const rest = src.slice(i);
      let matched: string | null = null;
      let matchedLen = 0;
      for (const name of names) {
        // El fragmento puede tener espacios dobles o tildes distintas: se compara normalizado
        for (let len = Math.min(rest.length, name.length + 8); len >= name.length; len--) {
          if (normalizeName(rest.slice(0, len)) === name && !isWordChar(rest[len])) {
            matched = name; matchedLen = len; break;
          }
        }
        if (matched) break;
      }
      if (matched) {
        tokens.push({ t: 'ref', v: matched });
        i += matchedLen;
        continue;
      }
    }

    if (/[0-9.]/.test(c)) {
      const m = /^\d*\.?\d+(?:[eE][-+]?\d+)?/.exec(src.slice(i));
      if (!m) throw new FormulaError(`Número inválido cerca de "${src.slice(i, i + 8)}"`);
      i += m[0].length;
      let v = Number(m[0]);
      if (src[i] === '%') { v = v / 100; i++; }
      tokens.push({ t: 'num', v });
      continue;
    }

    if (isWordChar(c)) {
      const m = /^[\p{L}\p{N}_]+/u.exec(src.slice(i))!;
      const word = normalizeName(m[0]);
      let j = i + m[0].length;
      while (/\s/.test(src[j] || '')) j++;
      if (src[j] === '(' && FUNCTIONS.includes(word)) {
        tokens.push({ t: 'fn', v: word });
        i = j;
        continue;
      }
      throw new FormulaError(`"${m[0]}" no es una variable ni columna conocida`);
    }

    const two = src.slice(i, i + 2);
    if (two === '<=' || two === '>=' || two === '<>') { tokens.push({ t: 'op', v: two }); i += 2; continue; }
    if ('+-*/^<>='.includes(c)) { tokens.push({ t: 'op', v: c }); i++; continue; }
    if (c === '(') { tokens.push({ t: '(' }); i++; continue; }
    if (c === ')') { tokens.push({ t: ')' }); i++; continue; }
    if (c === ';' || c === ',') { tokens.push({ t: 'sep' }); i++; continue; }
    throw new FormulaError(`Carácter no permitido: "${c}"`);
  }
  return tokens;
};

// ─── Parser / evaluador (descenso recursivo) ────────────────────────────────────

const evaluateTokens = (tokens: Token[], resolve: (name: string) => FormulaValue): FormulaValue => {
  let pos = 0;
  const peek = () => tokens[pos];
  const next = () => tokens[pos++];
  const isOp = (v: string) => { const tk = peek(); return !!tk && tk.t === 'op' && tk.v === v; };
  const peekOp = () => { const tk = peek(); return tk?.t === 'op' ? tk.v : null; };
  const nextOp = () => { const tk = next(); return tk.t === 'op' ? tk.v : ''; };

  const scalar = (v: FormulaValue): number => {
    if (Array.isArray(v)) throw new FormulaError('Una columna completa debe usarse dentro de SUMA, PROMEDIO, MIN, MAX o CONTAR');
    return v;
  };

  const comparison = (): FormulaValue => {
    let left = additive();
    while (['=', '<>', '<', '<=', '>', '>='].includes(peekOp() ?? '')) {
      const op = nextOp();
      const a = scalar(left); const b = scalar(additive());
      left = Number(
        op === '=' ? a === b : op === '<>' ? a !== b : op === '<' ? a < b : op === '<=' ? a <= b : op === '>' ? a > b : a >= b
      );
    }
    return left;
  };

  const additive = (): FormulaValue => {
    let left = multiplicative();
    while (isOp('+') || isOp('-')) {
      const op = nextOp();
      const right = scalar(multiplicative());
      left = op === '+' ? scalar(left) + right : scalar(left) - right;
    }
    return left;
  };

  const multiplicative = (): FormulaValue => {
    let left = power();
    while (isOp('*') || isOp('/')) {
      const op = nextOp();
      const right = scalar(power());
      if (op === '/' && right === 0) throw new FormulaError('División por cero');
      left = op === '*' ? scalar(left) * right : scalar(left) / right;
    }
    return left;
  };

  const power = (): FormulaValue => {
    const base = unary();
    if (isOp('^')) { next(); return Math.pow(scalar(base), scalar(power())); }
    return base;
  };

  const unary = (): FormulaValue => {
    if (isOp('-')) { next(); return -scalar(unary()); }
    if (isOp('+')) { next(); return scalar(unary()); }
    return primary();
  };

  const callFunction = (name: string, args: FormulaValue[]): number => {
    const flat = () => args.flatMap(a => (Array.isArray(a) ? a : [a]));
    switch (name) {
      case 'SUMA': case 'SUM': return flat().reduce((s, n) => s + n, 0);
      case 'PROMEDIO': case 'AVERAGE': {
        const f = flat();
        if (f.length === 0) throw new FormulaError('PROMEDIO sin valores');
        return f.reduce((s, n) => s + n, 0) / f.length;
      }
      case 'MIN': { const f = flat(); if (!f.length) throw new FormulaError('MIN sin valores'); return Math.min(...f); }
      case 'MAX': { const f = flat(); if (!f.length) throw new FormulaError('MAX sin valores'); return Math.max(...f); }
      case 'CONTAR': case 'COUNT': return flat().length;
      case 'ABS': return Math.abs(scalar(args[0] ?? 0));
      case 'REDONDEAR': case 'ROUND': {
        const d = Math.pow(10, scalar(args[1] ?? 0));
        return Math.round(scalar(args[0] ?? 0) * d) / d;
      }
      case 'SI': case 'IF':
        if (args.length < 2) throw new FormulaError('SI requiere al menos condición y valor si verdadero');
        return scalar(args[0]) !== 0 ? scalar(args[1]) : scalar(args[2] ?? 0);
    }
    throw new FormulaError(`Función desconocida: ${name}`);
  };

  const primary = (): FormulaValue => {
    const tk = next();
    if (!tk) throw new FormulaError('La fórmula está incompleta');
    if (tk.t === 'num') return tk.v;
    if (tk.t === 'ref') return resolve(tk.v);
    if (tk.t === '(') {
      const v = comparison();
      if (next()?.t !== ')') throw new FormulaError('Falta cerrar un paréntesis');
      return v;
    }
    if (tk.t === 'fn') {
      next(); // "("
      const args: FormulaValue[] = [];
      if (peek()?.t !== ')') {
        args.push(comparison());
        while (peek()?.t === 'sep') { next(); args.push(comparison()); }
      }
      if (next()?.t !== ')') throw new FormulaError(`Falta cerrar el paréntesis de ${tk.v}`);
      return callFunction(tk.v, args);
    }
    throw new FormulaError('Sintaxis inválida');
  };

  const result = comparison();
  if (pos < tokens.length) throw new FormulaError('Sintaxis inválida: sobran elementos al final');
  return result;
};

/**
 * Evalúa una fórmula. Lanza FormulaError si es inválida o si falta algún valor.
 */
export const evaluateFormula = (formula: string, scope: FormulaScope = {}): number => {
  const vars = new Map<string, number | null | undefined>();
  Object.entries(scope.vars || {}).forEach(([k, v]) => vars.set(normalizeName(k), v));
  const cols = new Map<string, number[]>();
  Object.entries(scope.columns || {}).forEach(([k, v]) => cols.set(normalizeName(k), v));

  const tokens = tokenize(formula, [...vars.keys(), ...cols.keys()]);
  if (tokens.length === 0) throw new FormulaError('La fórmula está vacía');

  const value = evaluateTokens(tokens, name => {
    if (vars.has(name)) {
      const v = vars.get(name);
      if (v === null || v === undefined || !isFinite(v)) throw new FormulaError(`"${name}" no tiene valor`);
      return v;
    }
    if (cols.has(name)) return cols.get(name)!;
    throw new FormulaError(`"${name}" no es una variable ni columna conocida`);
  });
  if (Array.isArray(value)) throw new FormulaError('El resultado no puede ser una columna completa; usa SUMA, PROMEDIO, etc.');
  if (!isFinite(value)) throw new FormulaError('El resultado no es un número válido');
  return value;
};

/** Igual que evaluateFormula pero devuelve null en vez de lanzar error. */
export const tryEvaluateFormula = (formula: string, scope: FormulaScope = {}): number | null => {
  try { return evaluateFormula(formula, scope); } catch { return null; }
};

/** Valida la sintaxis de una fórmula contra los nombres disponibles. Devuelve el mensaje de error o null. */
export const validateFormula = (formula: string, varNames: string[] = [], columnNames: string[] = []): string | null => {
  try {
    evaluateFormula(formula, {
      vars: Object.fromEntries(varNames.map(n => [n, 1])),
      columns: Object.fromEntries(columnNames.map(n => [n, [1]])),
    });
    return null;
  } catch (e) {
    if (e instanceof FormulaError && e.message === 'División por cero') return null;
    return e instanceof Error ? e.message : 'Fórmula inválida';
  }
};

/** Indica si la fórmula hace referencia a alguna columna de la tabla. */
export const formulaUsesColumns = (formula: string | null | undefined, headers: string[]): boolean => {
  if (!formula) return false;
  try {
    const cols = new Set(headers.map(normalizeName));
    return tokenize(formula, headers).some(tk => tk.t === 'ref' && cols.has(tk.v));
  } catch {
    return false;
  }
};

// ─── Tablas de detalle ──────────────────────────────────────────────────────────

const formatResult = (n: number) => String(Math.round(n * 100) / 100);

/**
 * Normaliza una tabla: si alguna celda empieza por "=" y la columna no tiene fórmula,
 * esa fórmula pasa a ser la fórmula de la columna (como arrastrarla en Excel).
 */
export const normalizeDetailTable = <T extends DetailTable | null | undefined>(table: T): T => {
  if (!table || !Array.isArray(table.headers) || !Array.isArray(table.rows)) return table;
  const formulas = table.headers.map((_, c) => table.formulas?.[c] || null);
  table.rows.forEach(row => row.forEach((cell, c) => {
    if (!formulas[c] && typeof cell === 'string' && cell.trim().startsWith('=')) {
      formulas[c] = cell.trim().slice(1);
    }
  }));
  return { ...table, formulas } as T;
};

/**
 * Recalcula todas las columnas con fórmula, fila por fila, y escribe el resultado en las celdas
 * (así el PDF y los demás lectores ven el valor calculado). Las celdas cuyo cálculo no es
 * posible (p. ej. faltan datos) quedan vacías.
 */
export const applyDetailTableFormulas = <T extends DetailTable | null | undefined>(
  input: T,
  { promoteCellFormulas = true }: { promoteCellFormulas?: boolean } = {}
): T => {
  // Mientras el usuario escribe "=..." en una celda no se promueve (se haría a mitad de la fórmula)
  const table = promoteCellFormulas ? normalizeDetailTable(input) : input;
  if (!table || !table.formulas?.some(Boolean)) return table;
  const { headers, formulas } = table;
  const rows = table.rows.map(row => {
    const out = [...row];
    // Varias pasadas para permitir columnas calculadas que dependen de otras columnas calculadas
    for (let pass = 0; pass < headers.length; pass++) {
      let changed = false;
      formulas!.forEach((f, c) => {
        if (!f) return;
        const vars: Record<string, number | null> = {};
        headers.forEach((h, i) => { if (i !== c) vars[h] = parseCellNumber(out[i]); });
        const v = tryEvaluateFormula(f, { vars });
        const s = v === null ? '' : formatResult(v);
        if (out[c] !== s) { out[c] = s; changed = true; }
      });
      if (!changed) break;
    }
    return out;
  });
  return { ...table, rows } as T;
};

/** Columnas de la tabla como listas de números (ignora celdas vacías o no numéricas). */
export const detailTableColumns = (table: DetailTable | null | undefined): Record<string, number[]> => {
  if (!table?.headers) return {};
  return Object.fromEntries(table.headers.map((h, c) => [
    h,
    table.rows.map(r => parseCellNumber(r[c])).filter((n): n is number => n !== null),
  ]));
};
