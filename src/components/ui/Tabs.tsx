import React from 'react';

export interface TabItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  count?: number;
  badge?: string;
}

export interface TabsProps {
  items: TabItem[];
  activeTab: string;
  onChange: (id: string) => void;
  centered?: boolean;
  className?: string;
}

export const Tabs: React.FC<TabsProps> = ({
  items,
  activeTab,
  onChange,
  centered = true,
  className = '',
}) => {
  return (
    <div className={`flex items-center w-full ${centered ? 'justify-center' : ''} ${className}`}>
      <div className="flex items-center p-1.5 bg-slate-100/90 border border-slate-200/60 rounded-2xl max-w-full overflow-x-auto no-scrollbar shadow-xs">
        {items.map((tab) => {
          const isActive = tab.id === activeTab;
          return (
            <button
              key={tab.id}
              onClick={() => onChange(tab.id)}
              className={`
                px-5 py-2.5 rounded-xl text-xs font-bold transition-all duration-300 flex items-center gap-2 whitespace-nowrap cursor-pointer select-none
                ${
                  isActive
                    ? 'bg-[#004C6C] text-white shadow-md shadow-blue-950/20 scale-[1.02]'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                }
              `}
            >
              {tab.icon && <span className={isActive ? 'text-white' : 'text-slate-500'}>{tab.icon}</span>}
              <span>{tab.label}</span>
              {typeof tab.count === 'number' && (
                <span
                  className={`
                    px-2 py-0.5 rounded-full text-[10px] font-black transition-colors
                    ${isActive ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'}
                  `}
                >
                  {tab.count}
                </span>
              )}
              {tab.badge && (
                <span
                  className={`
                    px-2 py-0.5 rounded-full text-[10px] font-black transition-colors
                    ${isActive ? 'bg-[#EE9D4C] text-white' : 'bg-amber-100 text-amber-800'}
                  `}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
