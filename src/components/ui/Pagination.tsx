import React, { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, ChevronDown, Check } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalItems: number;
  perPage: number;
  onPerPageChange?: (perPage: number) => void;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  totalItems,
  perPage,
  onPerPageChange
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const perPageOptions = [5, 10, 15, 20, 50];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 4) {
        pages.push(1, 2, 3, 4, 5, '...', totalPages);
      } else if (currentPage >= totalPages - 3) {
        pages.push(1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
      }
    }
    return pages;
  };

  const fromItem = totalItems === 0 ? 0 : (currentPage - 1) * perPage + 1;
  const toItem = Math.min(currentPage * perPage, totalItems);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 bg-white border border-slate-150 rounded-[24px] shadow-xs animate-fade-in select-none">
      
      {/* Sección Izquierda: Mostrando X-Y de Z */}
      <div className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">
        Mostrando <span className="text-[#004C6C] font-black">{fromItem}</span> - <span className="text-[#004C6C] font-black">{toItem}</span> de <span className="text-slate-700 font-black">{totalItems}</span> compromisos
      </div>

      {/* Sección Derecha: Selector de perPage y Navegación de páginas */}
      <div className="flex flex-wrap items-center gap-6">
        
        {/* Selector de Items por Página */}
        {onPerPageChange && (
          <div className="flex items-center gap-3 relative" ref={dropdownRef}>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Filas por pág.
            </span>
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 hover:bg-slate-100/70 border border-slate-200 rounded-xl text-xs font-black text-[#004C6C] transition-all cursor-pointer"
            >
              <span>{perPage}</span>
              <ChevronDown size={14} className={`transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {isDropdownOpen && (
              <div className="absolute bottom-full right-0 mb-2 z-50 w-24 bg-white border border-slate-100 rounded-xl shadow-2xl py-1.5 animate-in fade-in slide-in-from-bottom-2 duration-200">
                {perPageOptions.map((option) => (
                  <button
                    key={option}
                    onClick={() => {
                      onPerPageChange(option);
                      setIsDropdownOpen(false);
                    }}
                    className="w-full text-left px-3 py-1.5 text-xs font-bold flex items-center justify-between hover:bg-slate-50 transition-colors group cursor-pointer"
                  >
                    <span className={perPage === option ? 'text-[#004C6C] font-black' : 'text-slate-500'}>
                      {option}
                    </span>
                    {perPage === option && <Check size={12} className="text-[#EE9D4C] shrink-0" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Botones de Navegación de Páginas */}
        {totalPages > 1 && (
          <div className="flex items-center gap-1.5">
            {/* Botón Anterior */}
            <button
              onClick={() => currentPage > 1 && onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="p-2 bg-slate-50 hover:bg-slate-100 border border-slate-100 rounded-xl text-[#004C6C] disabled:opacity-40 disabled:hover:bg-slate-50 disabled:cursor-not-allowed transition-all cursor-pointer"
              title="Página Anterior"
            >
              <ChevronLeft size={16} />
            </button>

            {/* Números de Página */}
            <div className="flex items-center gap-1">
              {getPageNumbers().map((page, idx) => {
                if (page === '...') {
                  return (
                    <span key={`dots-${idx}`} className="px-2 text-slate-400 font-bold text-xs select-none">
                      ...
                    </span>
                  );
                }

                const pageNum = page as number;
                const isSelected = pageNum === currentPage;

                return (
                  <button
                    key={`page-${pageNum}`}
                    onClick={() => onPageChange(pageNum)}
                    className={`h-9 w-9 rounded-xl text-xs font-black transition-all flex items-center justify-center cursor-pointer ${
                      isSelected
                        ? 'bg-[#004C6C] text-white shadow-md shadow-blue-900/10'
                        : 'bg-white hover:bg-slate-50 text-slate-600 border border-slate-100'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>

            {/* Botón Siguiente */}
            <button
              onClick={() => currentPage < totalPages && onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="p-2 bg-slate-50 hover:bg-slate-100 border border-slate-100 rounded-xl text-[#004C6C] disabled:opacity-40 disabled:hover:bg-slate-50 disabled:cursor-not-allowed transition-all cursor-pointer"
              title="Página Siguiente"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
