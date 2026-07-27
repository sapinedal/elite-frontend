import React from 'react';
import { Plus, Trash2, Table, X } from 'lucide-react';
import { Modal } from '../../../components/ui/Modal';

interface KPIDetailTableProps {
  data: {
    headers: string[];
    rows: string[][];
  } | null;
  onChange: (newData: { headers: string[]; rows: string[][] } | null) => void;
  defaultHeaders?: string[];
}

export const KPIDetailTable: React.FC<KPIDetailTableProps> = ({ data, onChange, defaultHeaders }) => {
  const [isRemoveModalOpen, setIsRemoveModalOpen] = React.useState(false);
  const isEnabled = !!data && Array.isArray(data.headers) && Array.isArray(data.rows);

  const handleInitialize = (preset?: 'dias' | 'estandar') => {
    let headers = defaultHeaders || ['Descripción', 'Valor', 'Observación'];
    if (preset === 'dias') {
      headers = ['DESCRIPCIÓN / CASO', 'FECHA INICIAL', 'FECHA CIERRE', 'DÍAS TRANSCURRIDOS', 'OBSERVACIONES'];
    } else if (preset === 'estandar') {
      headers = ['DESCRIPCIÓN', 'VALOR', 'OBSERVACIÓN'];
    }

    onChange({
      headers: headers,
      rows: [new Array(headers.length).fill('')]
    });
  };

  const handleRemove = () => {
    setIsRemoveModalOpen(true);
  };

  const confirmRemove = () => {
    onChange(null);
  };

  const handleUpdateHeader = (colIdx: number, value: string) => {
    if (!data) return;
    const newHeaders = [...data.headers];
    newHeaders[colIdx] = value;
    onChange({ ...data, headers: newHeaders });
  };

  const handleUpdateCell = (rowIdx: number, colIdx: number, value: string) => {
    if (!data) return;
    let newRows = data.rows.map((row, rIdx) =>
      rIdx === rowIdx ? row.map((cell, cIdx) => (cIdx === colIdx ? value : cell)) : row
    );

    // Auto-cálculo de días si existen columnas de fecha inicial, fecha cierre y días
    const headersLower = data.headers.map(h => h.toLowerCase());
    const startCol = headersLower.findIndex(h => h.includes('inicial') || h.includes('inicio') || h.includes('desde'));
    const endCol = headersLower.findIndex(h => h.includes('cierre') || h.includes('final') || h.includes('hasta'));
    const daysCol = headersLower.findIndex(h => h.includes('día') || h.includes('dia'));

    if (startCol !== -1 && endCol !== -1 && daysCol !== -1 && (colIdx === startCol || colIdx === endCol)) {
      const row = [...newRows[rowIdx]];
      const startDateStr = row[startCol];
      const endDateStr = row[endCol];
      if (startDateStr && endDateStr) {
        const start = new Date(startDateStr);
        const end = new Date(endDateStr);
        if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
          const diffTime = end.getTime() - start.getTime();
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          row[daysCol] = (diffDays >= 0 ? diffDays : 0).toString();
          newRows[rowIdx] = row;
        }
      }
    }

    onChange({ ...data, rows: newRows });
  };

  const handleAddColumn = () => {
    if (!data) return;
    const newHeaders = [...data.headers, `Columna ${data.headers.length + 1}`];
    const newRows = data.rows.map(row => [...row, '']);
    onChange({ headers: newHeaders, rows: newRows });
  };

  const handleDeleteColumn = (colIdx: number) => {
    if (!data || data.headers.length <= 1) return;
    const newHeaders = data.headers.filter((_, i) => i !== colIdx);
    const newRows = data.rows.map(row => row.filter((_, i) => i !== colIdx));
    onChange({ headers: newHeaders, rows: newRows });
  };

  const handleAddRow = () => {
    if (!data) return;
    const newRow = new Array(data.headers.length).fill('');
    onChange({ ...data, rows: [...data.rows, newRow] });
  };

  const handleDeleteRow = (rowIdx: number) => {
    if (!data || data.rows.length <= 1) {
      if (data && data.rows.length === 1) {
        const clearedRow = new Array(data.headers.length).fill('');
        onChange({ ...data, rows: [clearedRow] });
        return;
      }
    }
    if (!data) return;
    const newRows = data.rows.filter((_, i) => i !== rowIdx);
    onChange({ ...data, rows: newRows });
  };

  if (!isEnabled) {
    return (
      <div className="flex flex-wrap items-center gap-2 py-2">
        <button
          onClick={() => handleInitialize('dias')}
          className="flex items-center gap-2 text-xs font-bold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 py-2 px-3 rounded-xl transition-all"
        >
          <span>📅 Agregar Tabla para Cálculo de Días</span>
        </button>

        <button
          onClick={() => handleInitialize('estandar')}
          className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 py-2 px-3 rounded-xl transition-all"
        >
          <Table size={14} />
          <span>Agregar Tabla Estándar</span>
        </button>
      </div>
    );
  }

  return (
    <div className="mt-2 border border-slate-100 rounded-[24px] overflow-hidden bg-slate-50/30 animate-in fade-in slide-in-from-top-2 duration-300">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-100/50">
              {data.headers.map((header, colIdx) => (
                <th key={colIdx} className="p-4 border-b border-r border-slate-100 min-w-[150px]">
                  <div className="flex items-center gap-2 group/col">
                    <input
                      type="text"
                      value={header}
                      onChange={(e) => handleUpdateHeader(colIdx, e.target.value)}
                      className="bg-transparent border-none focus:ring-2 focus:ring-blue-100 rounded-lg px-2 py-1 text-[11px] font-black uppercase tracking-wider text-[#004C6C] w-full outline-none transition-all"
                    />
                    <button
                      onClick={() => handleDeleteColumn(colIdx)}
                      className="opacity-0 group-hover/col:opacity-100 text-slate-300 hover:text-red-500 transition-all p-1"
                      title="Eliminar columna"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </th>
              ))}
              <th className="p-4 border-b border-slate-100 w-12 text-center">
                <button
                  onClick={handleAddColumn}
                  className="p-2 hover:bg-white rounded-xl text-[#EE9D4C] shadow-sm transition-all hover:scale-110"
                  title="Agregar columna"
                >
                  <Plus size={16} />
                </button>
              </th>
            </tr>
          </thead>
          <tbody>
            {data.rows.map((row, rowIdx) => (
              <tr key={rowIdx} className="hover:bg-white/80 group/row transition-colors">
                {row.map((cell, colIdx) => {
                  const header = data.headers[colIdx].toLowerCase();
                  const isDateField = header.includes('fecha') || header.includes('cierre');

                  return (
                    <td key={colIdx} className="p-0 border-b border-r border-slate-100">
                      <input
                        type={isDateField ? 'date' : 'text'}
                        value={cell}
                        onChange={(e) => handleUpdateCell(rowIdx, colIdx, e.target.value)}
                        className="w-full p-4 text-sm font-medium text-slate-600 bg-transparent outline-none focus:bg-white focus:ring-inset focus:ring-1 focus:ring-blue-50 transition-all"
                      />
                    </td>
                  );
                })}

                <td className="p-2 border-b border-slate-100 text-center">
                  <button
                    onClick={() => handleDeleteRow(rowIdx)}
                    className="opacity-0 group-hover/row:opacity-100 p-1.5 text-slate-200 hover:text-red-400 transition-all hover:bg-red-50 rounded-lg"
                    title="Eliminar fila"
                  >
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="p-4 flex items-center justify-between bg-white/40 border-t border-slate-100">
        <button
          onClick={handleAddRow}
          className="flex items-center gap-2 text-[11px] font-black text-[#EE9D4C] hover:bg-[#EE9D4C] hover:text-white px-5 py-2.5 rounded-xl border-2 border-[#EE9D4C]/20 hover:border-[#EE9D4C] transition-all tracking-widest uppercase shadow-sm"
        >
          <Plus size={14} /> Agregar fila
        </button>

        <button
          onClick={handleRemove}
          className="flex items-center gap-2 text-[11px] font-black text-red-400 hover:text-red-600 hover:bg-red-50 px-5 py-2.5 rounded-xl transition-all tracking-widest uppercase"
        >
          <X size={14} /> Quitar tabla
        </button>
      </div>

      <Modal
        isOpen={isRemoveModalOpen}
        onClose={() => setIsRemoveModalOpen(false)}
        onConfirm={confirmRemove}
        title="¿Quitar tabla de detalle?"
        message="Se perderán permanentemente todos los datos y el desglose capturado en esta tabla para este indicador."
        confirmText="Sí, quitar tabla"
        cancelText="Mantener tabla"
        type="danger"
      />
    </div>
  );
};
