import React from 'react';
import { Search, X, ScanBarcode } from 'lucide-react';
import { capitalizeWords } from '../utils/text';

interface SearchAndFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  onOpenBarcodeScanner?: () => void;
  placeholder?: string;
  resultCount?: number;
}

export const SearchAndFilters: React.FC<SearchAndFiltersProps> = ({
  searchTerm,
  onSearchChange,
  onOpenBarcodeScanner,
  placeholder = 'Pesquisar produto ou marca na lista...',
  resultCount,
}) => {
  return (
    <div id="search-filters-bar" className="px-4 sm:px-5 py-2.5 bg-white border-b border-slate-100 shrink-0">
      <div className="relative flex items-center">
        <input
          id="main-search-input"
          type="text"
          value={searchTerm}
          onChange={(e) => onSearchChange(capitalizeWords(e.target.value))}
          placeholder={placeholder}
          autoCapitalize="words"
          autoComplete="off"
          className="w-full bg-slate-100 hover:bg-slate-200/60 focus:bg-white border border-transparent focus:border-blue-400 rounded-xl py-2.5 pl-10 pr-20 text-sm text-slate-800 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500/20 focus:outline-hidden transition-all"
        />
        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
          <Search className="w-4 h-4" />
        </div>
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {searchTerm && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="p-1 text-slate-400 hover:text-slate-600 rounded-full cursor-pointer transition-colors"
              title="Limpar pesquisa"
              aria-label="Limpar pesquisa"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          {onOpenBarcodeScanner && (
            <button
              id="btn-search-barcode-list"
              type="button"
              onClick={onOpenBarcodeScanner}
              className="p-1.5 text-blue-600 hover:text-blue-700 hover:bg-blue-100/70 rounded-lg cursor-pointer transition-colors flex items-center justify-center"
              title="Buscar por código de barras na lista"
              aria-label="Buscar por código de barras na lista"
            >
              <ScanBarcode className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {searchTerm.trim() && resultCount !== undefined && (
        <div className="flex items-center justify-between mt-1.5 px-1">
          <span className="text-[11px] font-medium text-slate-500">
            {resultCount === 0
              ? 'Nenhum produto com esse nome na lista'
              : resultCount === 1
              ? '1 produto encontrado na lista'
              : `${resultCount} produtos encontrados na lista`}
          </span>
          <button
            type="button"
            onClick={() => onSearchChange('')}
            className="text-[11px] text-blue-600 hover:text-blue-700 font-semibold cursor-pointer"
          >
            Limpar
          </button>
        </div>
      )}
    </div>
  );
};


