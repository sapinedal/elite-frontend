import type { ContractorOption, FacturaDocumentType } from '../types';

const PREFIXES: [RegExp, FacturaDocumentType][] = [
  [/^C-?C$/i, 'cuenta_cobro'],
  [/^NC$/i, 'nota_credito'],
  [/^FE?$/i, 'factura'],
];

const normalize = (text: string) =>
  text.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9 ]/gi, ' ').replace(/\s+/g, ' ').trim().toUpperCase();

// Palabras que no identifican al proveedor
const NOISE = new Set(['SAS', 'S', 'A', 'LTDA', 'SA', 'DE', 'Y', 'EL', 'LA', 'DEL']);

/**
 * Lee el nombre con el que Contabilidad nombra las facturas en la carpeta del mes:
 *   "FE 335 INVALGO SAS.pdf"        -> factura, 335, INVALGO SAS
 *   "C-C 15102026 D PROYECTOS.pdf"  -> cuenta de cobro, 15102026, D PROYECTOS
 * Si no reconoce el formato, deja el nombre como proveedor para que lo completen a mano.
 */
export function parseInvoiceFileName(fileName: string): { documentType: FacturaDocumentType; invoiceNumber: string; supplierName: string } {
  const base = fileName.replace(/\.[a-z0-9]{2,4}$/i, '').replace(/[_]+/g, ' ').trim();
  const match = base.match(/^([A-Za-z]{1,2}-?[A-Za-z]?)\s*[-.]?\s*(\d[\w-]*)\s+(.+)$/);
  const type = match && PREFIXES.find(([pattern]) => pattern.test(match[1]))?.[1];

  if (!match || !type) {
    return { documentType: 'factura', invoiceNumber: '', supplierName: base };
  }

  return { documentType: type, invoiceNumber: match[2], supplierName: match[3].replace(/\s+-\s+.*$/, '').trim() };
}

/**
 * Busca el proveedor del catálogo que mejor coincide con el nombre leído del archivo
 * (todas las palabras significativas del nombre del archivo deben estar en el del proveedor).
 */
export function matchContractor(supplierName: string, contractors: ContractorOption[]): ContractorOption | null {
  const words = normalize(supplierName).split(' ').filter((w) => w.length > 1 && !NOISE.has(w));
  if (!words.length) return null;

  const candidates = contractors.filter((c) => {
    const name = ` ${normalize(c.name)} `;
    return words.every((w) => name.includes(` ${w} `) || name.includes(` ${w}`));
  });

  // Con varias coincidencias se prefiere el nombre más corto (el más parecido)
  return candidates.sort((a, b) => a.name.length - b.name.length)[0] ?? null;
}
