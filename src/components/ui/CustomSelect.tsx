import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronDown, Check, Search, X } from 'lucide-react';

export interface Option {
  value: string | number;
  label: string;
  sublabel?: string;
  icon?: React.ReactNode;
}

export interface CustomSelectProps {
  options: Option[];
  value: string | number | null | undefined;
  onChange: (value: any) => void;
  placeholder?: string;
  label?: string;
  disabled?: boolean;
  className?: string;
  pyClass?: string;
  searchable?: boolean;
  searchPlaceholder?: string;
  clearable?: boolean;
  onClear?: () => void;
}

// Normalizador para ignorar tildes/acentos al buscar
const normalizeText = (text: string) =>
  text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

export const CustomSelect: React.FC<CustomSelectProps> = ({
  options,
  value,
  onChange,
  placeholder = 'Seleccionar...',
  label,
  disabled,
  className,
  pyClass,
  searchable = true,
  searchPlaceholder = 'Buscar...',
  clearable = false,
  onClear
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const selectedOption = useMemo(
    () => options.find(o => o.value === value || (value !== undefined && value !== null && String(o.value) === String(value))),
    [options, value]
  );

  // Filtrar opciones por búsqueda insensible a mayúsculas y acentos
  const filteredOptions = useMemo(() => {
    if (!searchQuery.trim()) return options;
    const normQuery = normalizeText(searchQuery);
    return options.filter(option => {
      const normLabel = normalizeText(option.label || '');
      const normSublabel = option.sublabel ? normalizeText(option.sublabel) : '';
      return normLabel.includes(normQuery) || normSublabel.includes(normQuery);
    });
  }, [options, searchQuery]);

  // Enfocar input de búsqueda automáticamente al abrir
  useEffect(() => {
    if (isOpen) {
      setSearchQuery('');
      setHighlightedIndex(0);
      if (searchable) {
        setTimeout(() => {
          searchInputRef.current?.focus();
        }, 30);
      }
    }
  }, [isOpen, searchable]);

  // Manejar clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Manejo de teclado (Flechas Arriba/Abajo, Enter, Escape)
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'Enter' || e.key === 'ArrowDown' || e.key === ' ') {
        e.preventDefault();
        if (!disabled) setIsOpen(true);
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex(prev => (prev < filteredOptions.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex(prev => (prev > 0 ? prev - 1 : Math.max(0, filteredOptions.length - 1)));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredOptions[highlightedIndex]) {
        onChange(filteredOptions[highlightedIndex].value);
        setIsOpen(false);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setIsOpen(false);
    }
  };

  // Scroll automático hacia el elemento resaltado
  useEffect(() => {
    if (isOpen && listRef.current) {
      const activeEl = listRef.current.children[highlightedIndex] as HTMLElement;
      if (activeEl) {
        activeEl.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [highlightedIndex, isOpen]);

  const defaultButtonStyles = `w-full bg-slate-50/50 border border-slate-200 rounded-2xl px-5 ${pyClass || 'py-2.5'} text-sm font-semibold text-left flex items-center justify-between transition-all hover:bg-white hover:border-[#004C6C]/30 ${isOpen ? 'ring-4 ring-blue-50 border-[#004C6C] bg-white' : ''} disabled:opacity-50 disabled:bg-slate-100/50 disabled:border-slate-100 disabled:cursor-not-allowed`;

  const handleSelect = (val: string | number) => {
    onChange(val);
    setIsOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onClear) {
      onClear();
    } else {
      onChange('');
    }
  };

  return (
    <div className={`space-y-2 relative ${isOpen ? 'z-50' : ''}`} ref={containerRef} onKeyDown={handleKeyDown}>
      {label && <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest ml-1">{label}</label>}
      
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={className || defaultButtonStyles}
      >
        <span className={className ? 'truncate' : (selectedOption ? 'text-slate-700 font-semibold' : 'text-slate-400 font-medium')}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <div className="flex items-center gap-1.5 shrink-0 ml-1.5">
          {clearable && selectedOption && !disabled && (
            <span
              onClick={handleClear}
              className="p-1 text-slate-300 hover:text-rose-500 hover:bg-slate-100 rounded-lg transition-all"
              title="Limpiar"
            >
              <X size={13} />
            </span>
          )}
          <ChevronDown
            size={className ? 12 : 18}
            className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''} ${className ? 'text-current opacity-70' : 'text-slate-400'}`}
          />
        </div>
      </button>

      {isOpen && !disabled && (
        <div className="absolute z-50 w-full min-w-[200px] mt-2 bg-white border border-slate-200/80 rounded-2xl shadow-2xl py-2 animate-in fade-in zoom-in-95 duration-150 overflow-hidden">
          {/* Barra de búsqueda integrada / Autocomplete */}
          {searchable && (
            <div className="px-3 pb-2 pt-1 border-b border-slate-100">
              <div className="relative flex items-center">
                <Search size={14} className="absolute left-3 text-slate-400 pointer-events-none" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setHighlightedIndex(0);
                  }}
                  placeholder={searchPlaceholder}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-7 py-1.5 text-xs font-semibold text-slate-700 placeholder:text-slate-400 focus:outline-none focus:border-[#004C6C] focus:bg-white transition-all"
                  onClick={(e) => e.stopPropagation()}
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      searchInputRef.current?.focus();
                    }}
                    className="absolute right-2 text-slate-300 hover:text-slate-500 p-0.5"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Lista de opciones filtradas */}
          <div ref={listRef} className="max-h-56 overflow-y-auto pt-1">
            {filteredOptions.length === 0 ? (
              <div className="px-4 py-6 text-center text-slate-400">
                <p className="text-xs font-semibold">No se encontraron resultados</p>
                <p className="text-[10px] text-slate-300 uppercase tracking-wider font-bold mt-0.5">Prueba con otro término</p>
              </div>
            ) : (
              filteredOptions.map((option, idx) => {
                const isSelected = option.value === value || (value !== undefined && value !== null && String(option.value) === String(value));
                const isHighlighted = idx === highlightedIndex;

                return (
                  <button
                    key={`${option.value}-${idx}`}
                    type="button"
                    onClick={() => handleSelect(option.value)}
                    onMouseEnter={() => setHighlightedIndex(idx)}
                    className={`w-full text-left px-4 py-2.5 text-xs font-semibold flex items-center justify-between transition-colors ${
                      isHighlighted ? 'bg-blue-50/70 text-[#004C6C]' : 'hover:bg-slate-50 text-slate-600'
                    } ${isSelected ? 'font-black text-[#004C6C] bg-blue-50/40' : ''}`}
                  >
                    <div className="flex flex-col min-w-0 pr-2">
                      <span className="truncate">{option.label}</span>
                      {option.sublabel && (
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider truncate">
                          {option.sublabel}
                        </span>
                      )}
                    </div>
                    {isSelected && <Check size={15} className="text-[#EE9D4C] shrink-0" />}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

