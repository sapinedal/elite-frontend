import React from 'react';
import {
  FileText,
  FileSpreadsheet,
  FileCode,
  FileArchive,
  FileImage,
  FileVideo,
  FileAudio,
  Presentation,
  File as FileDefault,
} from 'lucide-react';

export interface FileIconConfig {
  icon: React.ReactNode;
  /** Ícono + fondo + borde del recuadro del tipo de archivo */
  colorClass: string;
  badgeBg: string;
  badgeText: string;
  /** Nombre del tipo para mostrar ("Hoja de cálculo", "PDF"…) */
  label: string;
  /** Color sólido del tipo (barra superior de las tarjetas) */
  accent: string;
}

type Kind = 'sheet' | 'doc' | 'slide' | 'pdf' | 'image' | 'archive' | 'video' | 'audio' | 'code' | 'other';

const KIND_BY_EXTENSION: Record<string, Kind> = {
  xls: 'sheet', xlsx: 'sheet', xlsm: 'sheet', ods: 'sheet', csv: 'sheet',
  doc: 'doc', docx: 'doc', docm: 'doc', odt: 'doc', rtf: 'doc', txt: 'doc',
  ppt: 'slide', pptx: 'slide', pptm: 'slide', odp: 'slide',
  pdf: 'pdf',
  png: 'image', jpg: 'image', jpeg: 'image', webp: 'image', gif: 'image', svg: 'image', heic: 'image',
  zip: 'archive', rar: 'archive', '7z': 'archive', tar: 'archive', gz: 'archive',
  mp4: 'video', mov: 'video', avi: 'video',
  mp3: 'audio', wav: 'audio',
  json: 'code', js: 'code', ts: 'code', html: 'code', css: 'code', sql: 'code', xml: 'code',
};

const CONFIG: Record<Kind, Omit<FileIconConfig, 'icon'> & { Icon: React.ElementType; iconClass: string }> = {
  sheet: { Icon: FileSpreadsheet, iconClass: 'text-emerald-600', colorClass: 'bg-emerald-50 border-emerald-100', badgeBg: 'bg-emerald-100', badgeText: 'text-emerald-700', label: 'Hoja de cálculo', accent: '#10B981' },
  doc: { Icon: FileText, iconClass: 'text-[#004C6C]', colorClass: 'bg-sky-50 border-sky-100', badgeBg: 'bg-sky-100', badgeText: 'text-[#004C6C]', label: 'Documento', accent: '#004C6C' },
  slide: { Icon: Presentation, iconClass: 'text-[#D97F2A]', colorClass: 'bg-orange-50 border-orange-100', badgeBg: 'bg-orange-100', badgeText: 'text-orange-700', label: 'Presentación', accent: '#EE9D4C' },
  pdf: { Icon: FileText, iconClass: 'text-rose-500', colorClass: 'bg-rose-50 border-rose-100', badgeBg: 'bg-rose-100', badgeText: 'text-rose-700', label: 'PDF', accent: '#F43F5E' },
  image: { Icon: FileImage, iconClass: 'text-violet-500', colorClass: 'bg-violet-50 border-violet-100', badgeBg: 'bg-violet-100', badgeText: 'text-violet-700', label: 'Imagen', accent: '#8B5CF6' },
  archive: { Icon: FileArchive, iconClass: 'text-amber-600', colorClass: 'bg-amber-50 border-amber-100', badgeBg: 'bg-amber-100', badgeText: 'text-amber-700', label: 'Comprimido', accent: '#D97706' },
  video: { Icon: FileVideo, iconClass: 'text-indigo-500', colorClass: 'bg-indigo-50 border-indigo-100', badgeBg: 'bg-indigo-100', badgeText: 'text-indigo-700', label: 'Video', accent: '#6366F1' },
  audio: { Icon: FileAudio, iconClass: 'text-pink-500', colorClass: 'bg-pink-50 border-pink-100', badgeBg: 'bg-pink-100', badgeText: 'text-pink-700', label: 'Audio', accent: '#EC4899' },
  code: { Icon: FileCode, iconClass: 'text-cyan-600', colorClass: 'bg-cyan-50 border-cyan-100', badgeBg: 'bg-cyan-100', badgeText: 'text-cyan-700', label: 'Código', accent: '#0891B2' },
  other: { Icon: FileDefault, iconClass: 'text-slate-400', colorClass: 'bg-slate-50 border-slate-200', badgeBg: 'bg-slate-100', badgeText: 'text-slate-600', label: 'Archivo', accent: '#94A3B8' },
};

export function getFileIconConfig(extension: string, sizeClass = 'w-6 h-6'): FileIconConfig {
  const { Icon, iconClass, ...rest } = CONFIG[KIND_BY_EXTENSION[extension.toLowerCase()] ?? 'other'];

  return { ...rest, icon: <Icon className={`${sizeClass} ${iconClass}`} /> };
}

/** Formatos que el navegador muestra directamente en la vista previa */
export const isBrowserPreviewable = (extension: string) =>
  ['pdf', 'png', 'jpg', 'jpeg', 'webp', 'gif', 'svg'].includes(extension.toLowerCase());
