import React from 'react';
import { ShoppingBag, CircleDollarSign } from 'lucide-react';
import { AppUser } from '../types';

interface BottomNavProps {
  activeTab: 'list' | 'quotes' | 'add' | 'sheets' | 'admin';
  onChangeTab: (tab: 'list' | 'quotes' | 'add' | 'sheets' | 'admin') => void;
  currentUser: AppUser;
  totalProducts: number;
  totalQuotes?: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onChangeTab,
  currentUser: _currentUser,
  totalProducts,
  totalQuotes = 0,
}) => {
  return (
    <nav
      id="bottom-navigation-bar"
      className="bg-white border-t border-slate-200/80 px-8 py-2.5 flex justify-around items-center shrink-0 z-20 shadow-xs max-w-lg mx-auto w-full"
    >
      {/* Tab 1: Lista de Compras */}
      <button
        id="nav-tab-list"
        type="button"
        onClick={() => onChangeTab('list')}
        className={`flex flex-col items-center gap-1 transition-colors cursor-pointer py-1 px-6 rounded-xl ${
          activeTab === 'list' ? 'text-blue-600 font-bold' : 'text-slate-400 hover:text-slate-600'
        }`}
      >
        <div className="relative">
          <ShoppingBag className="w-5 h-5" />
          {totalProducts > 0 && (
            <span className="absolute -top-1.5 -right-2.5 bg-blue-600 text-white text-[9px] font-black px-1.5 py-0.2 rounded-full min-w-[16px] text-center shadow-xs">
              {totalProducts}
            </span>
          )}
        </div>
        <span className="text-[10px] font-black tracking-wider uppercase">LISTA</span>
      </button>

      {/* Tab 2: Cotações dos Fornecedores */}
      <button
        id="nav-tab-quotes"
        type="button"
        onClick={() => onChangeTab('quotes')}
        className={`flex flex-col items-center gap-1 transition-colors cursor-pointer py-1 px-6 rounded-xl ${
          activeTab === 'quotes' ? 'text-blue-600 font-bold' : 'text-slate-400 hover:text-slate-600'
        }`}
      >
        <div className="relative">
          <CircleDollarSign className="w-5 h-5" />
          {totalQuotes > 0 && (
            <span className="absolute -top-1.5 -right-2.5 bg-emerald-600 text-white text-[9px] font-black px-1.5 py-0.2 rounded-full min-w-[16px] text-center shadow-xs">
              {totalQuotes}
            </span>
          )}
        </div>
        <span className="text-[10px] font-black tracking-wider uppercase">COTAÇÕES</span>
      </button>
    </nav>
  );
};
