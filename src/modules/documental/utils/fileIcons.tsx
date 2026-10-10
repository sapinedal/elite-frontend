import React from 'react';
import {
  FileText,
  FileSpreadsheet,
  FileCode,
  FileArchive,
  FileImage,
  FileVideo,
  FileAudio,
  File as FileDefault,
} from 'lucide-react';

export interface FileIconConfig {
  icon: React.ReactNode;
  colorClass: string;
  badgeBg: string;
  badgeText: string;
}

export function getFileIconConfig(extension: string): FileIconConfig {
  const ext = extension.toLowerCase();

  switch (ext) {
    case 'pdf':
      return {
        icon: <FileText className="w-6 h-6 text-rose-500" />,
        colorClass: 'text-rose-500 bg-rose-50 border-rose-100',
        badgeBg: 'bg-rose-100',
        badgeText: 'text-rose-700',
      };
    case 'doc':
    case 'docx':
      return {
        icon: <FileText className="w-6 h-6 text-blue-500" />,
        colorClass: 'text-blue-500 bg-blue-50 border-blue-100',
        badgeBg: 'bg-blue-100',
        badgeText: 'text-blue-700',
      };
    case 'xls':
    case 'xlsx':
    case 'csv':
      return {
        icon: <FileSpreadsheet className="w-6 h-6 text-emerald-500" />,
        colorClass: 'text-emerald-500 bg-emerald-50 border-emerald-100',
        badgeBg: 'bg-emerald-100',
        badgeText: 'text-emerald-700',
      };
    case 'png':
    case 'jpg':
    case 'jpeg':
    case 'webp':
    case 'gif':
    case 'svg':
      return {
        icon: <FileImage className="w-6 h-6 text-purple-500" />,
        colorClass: 'text-purple-500 bg-purple-50 border-purple-100',
        badgeBg: 'bg-purple-100',
        badgeText: 'text-purple-700',
      };
    case 'zip':
    case 'rar':
    case '7z':
    case 'tar':
    case 'gz':
      return {
        icon: <FileArchive className="w-6 h-6 text-amber-500" />,
        colorClass: 'text-amber-500 bg-amber-50 border-amber-100',
        badgeBg: 'bg-amber-100',
        badgeText: 'text-amber-700',
      };
    case 'mp4':
    case 'mov':
    case 'avi':
      return {
        icon: <FileVideo className="w-6 h-6 text-indigo-500" />,
        colorClass: 'text-indigo-500 bg-indigo-50 border-indigo-100',
        badgeBg: 'bg-indigo-100',
        badgeText: 'text-indigo-700',
      };
    case 'mp3':
    case 'wav':
      return {
        icon: <FileAudio className="w-6 h-6 text-pink-500" />,
        colorClass: 'text-pink-500 bg-pink-50 border-pink-100',
        badgeBg: 'bg-pink-100',
        badgeText: 'text-pink-700',
      };
    case 'json':
    case 'js':
    case 'ts':
    case 'html':
    case 'css':
    case 'sql':
      return {
        icon: <FileCode className="w-6 h-6 text-cyan-500" />,
        colorClass: 'text-cyan-500 bg-cyan-50 border-cyan-100',
        badgeBg: 'bg-cyan-100',
        badgeText: 'text-cyan-700',
      };
    default:
      return {
        icon: <FileDefault className="w-6 h-6 text-slate-400" />,
        colorClass: 'text-slate-500 bg-slate-50 border-slate-200',
        badgeBg: 'bg-slate-100',
        badgeText: 'text-slate-700',
      };
  }
}
