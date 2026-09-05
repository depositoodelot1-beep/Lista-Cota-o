import React, { useState, useRef, useEffect } from 'react';
import { MoreVertical, Edit2, Trash2, CheckCircle2, Clock, AlertOctagon, User, Check, Barcode } from 'lucide-react';
import { Product, AppUser } from '../types';

interface ProductCardProps {
  product: Product;
  currentUser: AppUser;
  isSelected?: boolean;
  onToggleSelect?: (product: Product) => void;
  onEdit: (product: Product) => void;
  onDelete: (product: Product) => void;
  onToggleStatus: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  currentUser,
  isSelected = false,
  onToggleSelect,
  onEdit,
  onDelete,
  onToggleStatus,
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }
    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [menuOpen]);

  const canEdit = currentUser.role === 'admin' || product.responsibleId === currentUser.id;
  const canDelete = currentUser.role === 'admin';

  // Format date and time
  const formattedDate = (() => {
    try {
      const date = new Date(product.createdAt);
      const today = new Date();
      const isToday = date.toDateString() === today.toDateString();
      const timeStr = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      if (isToday) {
        return `Hoje às ${timeStr}`;
      }
      return `${date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })} às ${timeStr}`;
    } catch {
      return '';
    }
  })();

  const isOutOfStock = product.quantity === 0;
  const isBought = product.status === 'comprado';

  // Priority styling configuration per user request
  // Baixa = Azul, Normal = Verde, Alta = Amarelo, Urgente = Vermelho
  const priorityConfig = (() => {
    switch (product.urgency) {
      case 'baixa':
        return {
          label: 'Baixa',
          color: '#2563eb', // Blue
          badgeBg: 'bg-blue-50',
          badgeText: 'text-blue-700',
          badgeBorder: 'border-blue-200/60',
        };
      case 'alta':
        return {
          label: 'Alta',
          color: '#d97706', // Yellow / Amber
          badgeBg: 'bg-amber-50',
          badgeText: 'text-amber-700',
          badgeBorder: 'border-amber-200/70',
        };
      case 'urgente':
        return {
          label: 'Urgente',
          color: '#dc2626', // Red
          badgeBg: 'bg-red-50',
          badgeText: 'text-red-700',
          badgeBorder: 'border-red-200/60',
        };
      case 'media':
      default:
        return {
          label: 'Normal',
          color: '#16a34a', // Green
          badgeBg: 'bg-emerald-50',
          badgeText: 'text-emerald-700',
          badgeBorder: 'border-emerald-200/60',
        };
    }
  })();

  return (
    <div
      id={`product-card-${product.id}`}
      className={`bg-white px-3.5 py-3 rounded-2xl border shadow-2xs hover:shadow-xs transition-all flex items-center justify-between gap-3 relative ${
        isSelected
          ? 'border-blue-300 ring-1 ring-blue-300/50 bg-blue-50/15'
          : 'border-slate-100'
      } ${isBought ? 'opacity-60 bg-slate-50/70' : ''}`}
    >
      {/* Left section: Selection Checkbox + Circular Avatar + Product Info */}
      <div className="flex items-center gap-2.5 min-w-0 flex-1">
        {/* Selection Checkbox */}
        {onToggleSelect && (
          <button
            type="button"
            id={`product-select-${product.id}`}
            onClick={(e) => {
              e.stopPropagation();
              onToggleSelect(product);
            }}
            className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all cursor-pointer shrink-0 ${
              isSelected
                ? 'bg-blue-600 border-blue-600 text-white shadow-2xs'
                : 'border-slate-300 hover:border-blue-400 bg-white'
            }`}
            title={isSelected ? 'Desmarcar este item' : 'Selecionar este item'}
            aria-label={isSelected ? 'Desmarcar produto' : 'Selecionar produto'}
          >
            {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
          </button>
        )}

        {/* Circular Avatar showing who added */}
        <div
          className="w-9 h-9 rounded-full border border-slate-300/80 flex items-center justify-center font-medium text-sm text-slate-700 shrink-0 bg-white select-none shadow-2xs"
          title={`Cadastrado por: ${product.responsibleName}`}
        >
          {product.responsibleInitial || 'U'}
        </div>

        {/* Center content: Product name and (Priority + Quantity) */}
        <div className="min-w-0 flex-1">
          {/* Top Line: Product Name and optional brand */}
          <div className="flex items-center gap-2">
            <h3
              id={`product-name-${product.id}`}
              className={`font-bold text-slate-900 text-sm sm:text-base leading-tight truncate ${
                isBought ? 'line-through text-slate-400' : ''
              }`}
              title={`${product.name} ${product.brand ? `- ${product.brand}` : ''}`}
            >
              {product.name}
              {product.brand && (
                <span className="font-normal text-slate-400 text-xs ml-1.5">
                  - {product.brand}
                </span>
              )}
            </h3>

            {isBought && (
              <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200/60 px-1.5 py-0.5 rounded-sm shrink-0 uppercase tracking-wider">
                Comprado
              </span>
            )}
          </div>

          {/* Bottom Line: Priority pill + Quantity */}
          <div className="flex items-center gap-2 mt-1">
            {/* Priority Tag matching user image */}
            <span
              className={`inline-flex items-center text-[11px] font-semibold px-2 py-0.5 rounded-md border ${priorityConfig.badgeBg} ${priorityConfig.badgeText} ${priorityConfig.badgeBorder} shrink-0`}
              title={`Prioridade: ${priorityConfig.label}`}
            >
              {priorityConfig.label}
            </span>

            {/* Quantity in blue */}
            <span
              className="text-xs sm:text-sm font-bold text-blue-600 shrink-0"
              title={`Quantidade: ${product.quantity} ${product.unit || 'un'}`}
            >
              {product.quantity}
              {product.unit && product.unit !== 'unidade' && (
                <span className="text-[11px] font-normal text-blue-500 ml-1">
                  {product.unit}
                </span>
              )}
            </span>

            {product.barcode && (
              <span
                className="inline-flex items-center gap-1 text-[10px] font-mono text-slate-500 bg-slate-100/90 px-1.5 py-0.5 rounded truncate max-w-[110px]"
                title={`Código de barras: ${product.barcode}`}
              >
                <Barcode className="w-3 h-3 text-slate-400 shrink-0" />
                <span className="truncate">{product.barcode}</span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Right Section: 3-dots Action Menu */}
      <div className="relative shrink-0" ref={menuRef}>
        <button
          id={`btn-product-menu-${product.id}`}
          type="button"
          onClick={() => setMenuOpen(!menuOpen)}
          className="w-8 h-8 flex items-center justify-center hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
          aria-label="Opções do produto"
          title="Opções"
        >
          <MoreVertical className="w-4 h-4" />
        </button>

        {/* Dropdown Menu */}
        {menuOpen && (
          <div
            id={`dropdown-menu-${product.id}`}
            className="absolute right-0 top-full mt-1 w-48 bg-white rounded-xl shadow-xl border border-slate-100 py-1.5 z-30 animate-in fade-in zoom-in-95 duration-100"
          >
            {/* Quick toggle status */}
            <button
              type="button"
              onClick={() => {
                setMenuOpen(false);
                onToggleStatus(product);
              }}
              className="w-full px-3.5 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 transition-colors cursor-pointer"
            >
              <CheckCircle2
                className={`w-4 h-4 ${isBought ? 'text-amber-500' : 'text-emerald-500'}`}
              />
              {isBought ? 'Marcar como Pendente' : 'Marcar como Comprado'}
            </button>

            {/* Edit */}
            <button
              type="button"
              onClick={() => {
                setMenuOpen(false);
                onEdit(product);
              }}
              disabled={!canEdit}
              className={`w-full px-3.5 py-2 text-left text-xs font-semibold flex items-center gap-2.5 transition-colors cursor-pointer ${
                canEdit
                  ? 'text-slate-700 hover:bg-slate-50'
                  : 'text-slate-300 cursor-not-allowed'
              }`}
              title={canEdit ? 'Editar este produto' : 'Apenas o autor ou administrador pode editar'}
            >
              <Edit2 className="w-4 h-4 text-blue-500" />
              <span>Editar produto</span>
              {!canEdit && <span className="text-[10px] ml-auto text-slate-400">(Bloqueado)</span>}
            </button>

            {/* Delete - Admin only */}
            <button
              type="button"
              onClick={() => {
                setMenuOpen(false);
                onDelete(product);
              }}
              disabled={!canDelete}
              className={`w-full px-3.5 py-2 text-left text-xs font-semibold flex items-center gap-2.5 transition-colors border-t border-slate-100 cursor-pointer ${
                canDelete
                  ? 'text-red-600 hover:bg-red-50'
                  : 'text-slate-300 cursor-not-allowed'
              }`}
              title={canDelete ? 'Excluir produto' : 'Apenas administradores podem excluir'}
            >
              <Trash2 className={`w-4 h-4 ${canDelete ? 'text-red-500' : 'text-slate-300'}`} />
              <span>Excluir produto</span>
              {!canDelete && <span className="text-[10px] ml-auto text-slate-400">(Admin)</span>}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
