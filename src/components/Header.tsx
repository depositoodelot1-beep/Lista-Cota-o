import React from 'react';
import { FileSpreadsheet, Settings, Package, Truck } from 'lucide-react';
import { AppUser } from '../types';

interface HeaderProps {
  toBuyCount: number;
  outOfStockCount: number;
  currentUser: AppUser;
  supplierCount?: number;
  onOpenSheets: () => void;
  onOpenAdmin: () => void;
  onOpenCatalog: () => void;
  onOpenSuppliers: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  toBuyCount,
  outOfStockCount,
  currentUser,
  supplierCount,
  onOpenSheets,
  onOpenAdmin,
  onOpenCatalog,
  onOpenSuppliers,
}) => {
  return (
    <header id="app-header" className="bg-white px-5 pt-5 pb-3 border-b border-slate-100 shadow-xs z-10">
      <div className="w-full">
        {/* Title and Item Count Pill directly matching Professional Polish Design */}
        <div className="flex justify-between items-center mb-2">
          <h1 id="app-title" className="text-2xl font-bold text-slate-800 tracking-tight">
            Lista de Compras
          </h1>
          <span
            id="stat-to-buy-pill"
            className="bg-blue-100 text-blue-600 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide shrink-0"
          >
            {toBuyCount} {toBuyCount === 1 ? 'ITEM' : 'ITENS'}
          </span>
        </div>

        {/* Sub-bar: Status Indicators & Quick Actions */}
        <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              id="cloud-status-badge"
              className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/80"
              title="Sincronização Firebase Ativa"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Nuvem ON
            </span>

            {outOfStockCount > 0 && (
              <span id="stat-out-of-stock" className="text-[11px] text-red-500 font-bold uppercase tracking-wider">
                {outOfStockCount} esgotado{outOfStockCount > 1 ? 's' : ''}
              </span>
            )}

            <span className="text-[11px] text-slate-400 inline-flex items-center gap-1 font-medium">
              Por: <span className="text-blue-600 font-semibold">{currentUser.name}</span>
            </span>
          </div>

          {/* Action icon buttons styled with Professional Polish slate-100 & rounded-xl */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Green Google Sheets button */}
            <button
              id="btn-header-sheets"
              type="button"
              onClick={onOpenSheets}
              className="w-8 h-8 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-600 border border-emerald-200/80 flex items-center justify-center transition-colors cursor-pointer"
              title="Exportar para Google Sheets"
              aria-label="Google Sheets"
            >
              <FileSpreadsheet className="w-4 h-4" />
            </button>

            {/* Catalog of all products button right near Settings */}
            <button
              id="btn-header-catalog"
              type="button"
              onClick={onOpenCatalog}
              className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 flex items-center justify-center transition-colors cursor-pointer"
              title="Base de Produtos (Catálogo Completo)"
              aria-label="Catálogo de Produtos"
            >
              <Package className="w-4 h-4" />
            </button>

            {/* Fornecedores button imitating the header icon buttons */}
            <button
              id="btn-header-suppliers"
              type="button"
              onClick={onOpenSuppliers}
              className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 flex items-center justify-center transition-colors cursor-pointer relative"
              title="Fornecedores (Contatos, Telefone e E-mail)"
              aria-label="Fornecedores"
            >
              <Truck className="w-4 h-4" />
              {typeof supplierCount === 'number' && supplierCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[14px] h-[14px] px-0.5 bg-blue-600 text-white text-[8px] font-bold rounded-full flex items-center justify-center border border-white">
                  {supplierCount > 9 ? '9+' : supplierCount}
                </span>
              )}
            </button>

            {/* Admin button */}
            <button
              id="btn-header-admin"
              type="button"
              onClick={onOpenAdmin}
              className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 flex items-center justify-center transition-colors cursor-pointer"
              title="Área do Administrador"
              aria-label="Administrador"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

