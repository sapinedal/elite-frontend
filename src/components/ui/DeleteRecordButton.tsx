import React, { useState } from 'react';
import { Loader2, Trash2 } from 'lucide-react';
import { useConfirmReason } from '../../context/ConfirmContext';
import { useNotification } from '../../context/NotificationContext';
import { getErrorMessage } from '../../lib/apiError';

interface DeleteRecordButtonProps {
  /** Título del modal: "Eliminar corte CORTE 3" */
  title: string;
  /** Qué se reversa al eliminar */
  message?: React.ReactNode;
  /** Llama al backend con el motivo; si falla, el error se muestra como notificación */
  onDelete: (reason: string) => Promise<unknown>;
  /** Después de eliminar (cerrar el detalle, refrescar el listado...) */
  onDeleted?: () => void;
  successMessage?: string;
  label?: string;
  /** compact: solo el ícono (filas de facturas o documentos) */
  compact?: boolean;
  className?: string;
}

/**
 * Botón para eliminar un registro cargado por error (corte, factura, orden, entrada, anticipo, cuenta de cobro).
 * Pide confirmación con motivo obligatorio, que queda en el historial; el backend reversa lo que el registro generó.
 */
export const DeleteRecordButton: React.FC<DeleteRecordButtonProps> = ({
  title, message, onDelete, onDeleted, successMessage = 'Registro eliminado.', label = 'Eliminar', compact = false, className,
}) => {
  const confirmReason = useConfirmReason();
  const { showNotification } = useNotification();
  const [deleting, setDeleting] = useState(false);

  const handleClick = async () => {
    const reason = await confirmReason({ title, message, confirmText: 'Eliminar', tone: 'danger' });
    if (reason === null) return;
    setDeleting(true);
    try {
      await onDelete(reason);
      showNotification(successMessage, 'success');
      onDeleted?.();
    } catch (err) {
      showNotification(getErrorMessage(err, 'No se pudo eliminar el registro.'), 'error');
    } finally {
      setDeleting(false);
    }
  };

  const icon = deleting ? <Loader2 size={compact ? 16 : 14} className="animate-spin" /> : <Trash2 size={compact ? 16 : 14} />;

  return compact ? (
    <button type="button" onClick={handleClick} disabled={deleting} title={title}
      className={className ?? 'p-2.5 rounded-xl text-rose-500 hover:bg-rose-50 disabled:opacity-60'}>
      {icon}
    </button>
  ) : (
    <button type="button" onClick={handleClick} disabled={deleting} title={title}
      className={className ?? 'flex items-center gap-1.5 px-3 py-2.5 rounded-2xl text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 disabled:opacity-60'}>
      {icon} {label}
    </button>
  );
};
