import React from 'react';

export type UrgencyFilterType = 'all' | 'fixo' | 'novo' | 'normal' | 'urgente';

interface PriorityFilterProps {
  selectedUrgency: UrgencyFilterType;
  onSelectUrgency: (urgency: UrgencyFilterType) => void;
  counts: {
    all: number;
    fixo: number;
    novo: number;
    normal: number;
    urgente: number;
  };
}

export const PriorityFilter: React.FC<PriorityFilterProps> = ({
  selectedUrgency,
  onSelectUrgency,
  counts,
}) => {
  const allPriorities: Array<{
    id: UrgencyFilterType;
    letter: string;
    fullName: string;
    count: number;
    activeClasses: string;
    inactiveClasses: string;
    countActive: string;
    countInactive: string;
  }> = [
    {
      id: 'all',
      letter: 'T',
      fullName: 'Todas',
      count: counts.all,
      activeClasses: 'bg-slate-900 text-white shadow-xs ring-2 ring-slate-400/50',
      inactiveClasses: 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100',
      countActive: 'text-slate-300',
      countInactive: 'text-slate-400',
    },
    {
      id: 'fixo',
      letter: 'F',
      fullName: 'Fixo',
      count: counts.fixo,
      activeClasses: 'bg-indigo-600 text-white shadow-xs ring-2 ring-indigo-300/60',
      inactiveClasses: 'bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100',
      countActive: 'text-indigo-100',
      countInactive: 'text-indigo-600',
    },
    {
      id: 'novo',
      letter: 'N',
      fullName: 'Novo',
      count: counts.novo,
      activeClasses: 'bg-emerald-600 text-white shadow-xs ring-2 ring-emerald-300/60',
      inactiveClasses: 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100',
      countActive: 'text-emerald-100',
      countInactive: 'text-emerald-600',
    },
    {
      id: 'normal',
      letter: 'C',
      fullName: 'Cotação',
      count: counts.normal,
      activeClasses: 'bg-amber-400 text-amber-950 font-bold shadow-xs ring-2 ring-amber-300/60',
      inactiveClasses: 'bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100',
      countActive: 'text-amber-900',
      countInactive: 'text-amber-700',
    },
    {
      id: 'urgente',
      letter: 'U',
      fullName: 'Urgente',
      count: counts.urgente,
      activeClasses: 'bg-red-600 text-white shadow-xs ring-2 ring-red-300/60',
      inactiveClasses: 'bg-red-50 text-red-700 border border-red-200 hover:bg-red-100',
      countActive: 'text-red-100',
      countInactive: 'text-red-500',
    },
  ];

  return (
    <div id="priority-filter-section" className="px-4 sm:px-5 py-2.5 bg-slate-50/90 border-b border-slate-100">
      <div className="grid grid-cols-5 gap-1 sm:gap-2 w-full">
        {allPriorities.map((item) => {
          const isSelected = selectedUrgency === item.id;
          return (
            <button
              key={item.id}
              id={`filter-priority-${item.id}`}
              type="button"
              onClick={() => onSelectUrgency(item.id === 'all' ? 'all' : isSelected ? 'all' : item.id)}
              className={`w-full py-1.5 px-0.5 sm:px-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center justify-center gap-1 ${
                isSelected ? item.activeClasses : item.inactiveClasses
              }`}
              title={`${item.fullName} (${item.count})`}
            >
              <span className="font-bold text-xs sm:text-sm leading-none">{item.letter}</span>
              <span
                className={`text-[10px] sm:text-[11px] leading-none ${
                  isSelected ? item.countActive : item.countInactive
                }`}
              >
                ({item.count})
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
