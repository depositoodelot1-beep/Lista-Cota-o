import React from 'react';
import { ShoppingBag } from 'lucide-react';
import { AppUser } from '../types';

interface BottomNavProps {
  activeTab: 'list' | 'add' | 'sheets' | 'admin';
  onChangeTab: (tab: 'list' | 'add' | 'sheets' | 'admin') => void;
  currentUser: AppUser;
  totalProducts: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onChangeTab,
  currentUser: _currentUser,
  totalProducts,
}) => {
  return (
    <nav
      id="bottom-navigation-bar"
      className="bg-white border-t border-slate-100 px-6 py-2.5 flex justify-center items-center shrink-0 z-20 shadow-xs"
    >
      {/* Tab Única: Lista */}
      <button
        id="nav-tab-list"
        type="button"
        onClick={() => onChangeTab('list')}
        className={`flex flex-col items-center gap-1 transition-colors cursor-pointer ${
          activeTab === 'list' ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'
        }`}
      >
        <div className="relative">
          <ShoppingBag className="w-5 h-5" />
          {totalProducts > 0 && (
            <span className="absolute -top-1 -right-2 bg-blue-600 text-white text-[8px] font-black px-1 rounded-full">
              {totalProducts}
            </span>
          )}
        </div>
        <span className="text-[10px] font-bold uppercase tracking-wider">Lista</span>
      </button>
    </nav>
  );
};

