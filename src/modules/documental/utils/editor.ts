import type { EditorInfo } from '../types/documental.types';

/** Ruta de la página del editor (fuera del layout, a pantalla completa) */
export const editorUrl = (path: string) => `/documental/editor?path=${encodeURIComponent(path)}`;

/** Abre el archivo en el editor en una pestaña nueva, como Google Drive */
export const openInEditor = (path: string) => {
  window.open(editorUrl(path), '_blank', 'noopener');
};

export type EditorCapability = 'edit' | 'view' | null;

/** Qué se puede hacer con el archivo en el editor según su extensión (sin contar permisos de carpeta) */
export const editorCapability = (info: EditorInfo | null, extension: string): EditorCapability => {
  if (!info?.enabled) return null;
  const ext = extension.toLowerCase();
  if (info.editable.includes(ext)) return 'edit';
  if (info.viewable.includes(ext)) return 'view';
  return null;
};
