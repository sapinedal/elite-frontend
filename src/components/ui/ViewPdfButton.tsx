import React, { useState } from 'react';
import { FileSearch, Loader2 } from 'lucide-react';
import { useNotification } from '../../context/NotificationContext';
import { getErrorMessage } from '../../lib/apiError';

export const isPdfFile = (fileName?: string | null) => (fileName ?? '').toLowerCase().endsWith('.pdf');

/**
 * Abre en una pestaña nueva, con el visor del navegador, la URL que entrega getUrl (firmada en línea).
 * La pestaña se abre en el mismo clic para que el navegador no la bloquee como ventana emergente.
 */
export const openInBrowserTab = async (getUrl: () => Promise<string>): Promise<void> => {
  const tab = window.open('', '_blank');
  try {
    const url = await getUrl();
    if (tab) {
      tab.opener = null;
      tab.location.href = url;
    } else if (!window.open(url, '_blank', 'noopener')) {
      throw new Error('El navegador bloqueó la pestaña nueva. Permite las ventanas emergentes de este sitio para ver los PDF.');
    }
  } catch (err) {
    tab?.close();
    throw err;
  }
};

interface ViewPdfButtonProps {
  /** Nombre del archivo: el botón solo aparece si es PDF */
  fileName?: string | null;
  /** Devuelve la URL para verlo en el navegador (el endpoint de descarga con inline=1) */
  getUrl: () => Promise<string>;
  size?: number;
  className?: string;
  title?: string;
  /** Texto junto al ícono (para botones grandes); sin él es solo ícono */
  label?: string;
}

/**
 * Botón "Ver" junto a "Descargar": abre el PDF en el navegador sin descargarlo.
 */
export const ViewPdfButton: React.FC<ViewPdfButtonProps> = ({
  fileName,
  getUrl,
  size = 15,
  className = 'p-2 rounded-xl text-[#004C6C] hover:bg-blue-50 shrink-0',
  title = 'Ver PDF',
  label,
}) => {
  const { showNotification } = useNotification();
  const [opening, setOpening] = useState(false);

  if (!isPdfFile(fileName)) return null;

  const handleClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setOpening(true);
    try {
      await openInBrowserTab(getUrl);
    } catch (err) {
      showNotification(getErrorMessage(err, 'Error al abrir el PDF.'), 'error');
    } finally {
      setOpening(false);
    }
  };

  return (
    <button type="button" onClick={handleClick} disabled={opening} className={`${className} disabled:opacity-50`} title={title} aria-label={title}>
      {opening ? <Loader2 size={size} className="animate-spin" /> : <FileSearch size={size} />}
      {label}
    </button>
  );
};
