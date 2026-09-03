import React from 'react';
import { Search, X, ArrowUpDown } from 'lucide-react';
import { ProductStatus, SortField, SortDirection } from '../types';
import { capitalizeWords } from '../utils/text';

interface SearchAndFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  statusFilter: ProductStatus | 'all';
  onStatusFilterChange: (status: ProductStatus | 'all') => void;
  sortField: SortField;
  sortDirection: SortDirection;
  onSortChange: (field: SortField, dir: SortDirection) => void;
}

export const SearchAndFilters: React.FC<SearchAndFiltersProps> = ({
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  sortField,
  sortDirection,
  onSortChange,
}) => {
  return (
    <div id="search-filters-bar" className="px-5 py-3 bg-white border-b border-slate-100">
      <div className="w-full space-y-2.5">
        {/* Search input matching Professional Polish HTML */}
        <div className="relative">
          <input
            id="main-search-input"
            type="text"
            value={searchTerm}
            onChange={(e) => onSearchChange(capitalizeWords(e.target.value))}
            placeholder="Buscar produto ou marca..."
            autoCapitalize="words"
            autoComplete="off"
            className="w-full bg-slate-100 border-none rounded-xl py-2.5 pl-10 pr-9 text-sm text-slate-800 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500 focus:outline-hidden transition-all"
          />
          <div className="absolute left-3.5 top-3">
            <Search className="w-4 h-4 text-slate-400" />
          </div>
          {searchTerm && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-2.5 p-1 text-slate-400 hover:text-slate-600 rounded-full cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filters and Sorting Pills */}
        <div className="flex items-center justify-between gap-2 overflow-x-auto pb-0.5 no-scrollbar text-xs">
          {/* Status Pills */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => onStatusFilterChange('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                statusFilter === 'all'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Todos
            </button>
            <button
              type="button"
              onClick={() => onStatusFilterChange('em_falta')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                statusFilter === 'em_falta'
                  ? 'bg-red-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Esgotado
            </button>
            <button
              type="button"
              onClick={() => onStatusFilterChange('baixo_estoque')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                statusFilter === 'baixo_estoque'
                  ? 'bg-blue-500 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Estoque Baixo
            </button>
            <button
              type="button"
              onClick={() => onStatusFilterChange('comprado')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                statusFilter === 'comprado'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Comprados
            </button>
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-1 shrink-0 ml-auto">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
            <select
              id="sort-select"
              value={`${sortField}-${sortDirection}`}
              onChange={(e) => {
                const [f, d] = e.target.value.split('-') as [SortField, SortDirection];
                onSortChange(f, d);
              }}
              className="bg-slate-100 border-none text-slate-700 text-xs font-medium py-1.5 px-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden cursor-pointer"
            >
              <option value="name-asc">Nome (A - Z)</option>
              <option value="name-desc">Nome (Z - A)</option>
              <option value="quantity-asc">Menor Estoque</option>
              <option value="quantity-desc">Maior Estoque</option>
              <option value="date-desc">Mais Recentes</option>
              <option value="date-asc">Mais Antigos</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};
