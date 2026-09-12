import React from 'react';
import { Settings, Lock, LogOut } from 'lucide-react';
import { AppUser } from '../types';
import { User as FirebaseUser } from 'firebase/auth';

interface HeaderProps {
  toBuyCount: number;
  outOfStockCount: number;
  currentUser: AppUser;
  firebaseUser?: FirebaseUser | null;
  supplierCount?: number;
  onOpenSheets?: () => void;
  onOpenAdmin: () => void;
  onOpenCatalog?: () => void;
  onOpenSuppliers?: () => void;
  onOpenSupplierLogin?: () => void;
  onSignOut?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  firebaseUser,
  onOpenAdmin,
  onOpenSupplierLogin,
  onSignOut,
}) => {
  return (
    <header id="app-header" className="bg-white px-5 pt-5 pb-3 border-b border-slate-100 shadow-xs z-10">
      <div className="w-full">
        {/* Title and Action Buttons */}
        <div className="flex justify-between items-center mb-2">
          <h1 id="app-title" className="text-2xl font-bold text-slate-800 tracking-tight">
            Lista de Compras
          </h1>

          {/* Action icon buttons styled with Professional Polish slate-100 & rounded-xl */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Acesso Fornecedor por E-mail */}
            {onOpenSupplierLogin && (
              <button
                id="btn-header-supplier-login"
                type="button"
                onClick={onOpenSupplierLogin}
                className="h-8 px-2.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300/80 flex items-center gap-1.5 text-[11px] font-bold transition-colors cursor-pointer shadow-2xs"
                title="Acesso do Fornecedor por E-mail (Restrito à Cotação)"
                aria-label="Área do Fornecedor"
              >
                <Lock className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span className="hidden sm:inline">Área Fornecedor</span>
              </button>
            )}

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

            {/* Sign Out button */}
            {onSignOut && (
              <button
                id="btn-header-signout"
                type="button"
                onClick={onSignOut}
                className="w-8 h-8 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 flex items-center justify-center transition-colors cursor-pointer"
                title="Sair da Conta (Google)"
                aria-label="Sair"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
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

            <span className="text-[11px] text-slate-400 inline-flex items-center gap-1 font-medium">
              Por: <span className="text-blue-600 font-semibold">{currentUser.name}</span>
            </span>

            {firebaseUser?.email && (
              <span className="text-[11px] text-slate-400 hidden sm:inline-block">
                ({firebaseUser.email})
              </span>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
