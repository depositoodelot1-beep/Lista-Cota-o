import React, { useState, useRef, useEffect } from 'react';
import { MoreVertical, Edit2, Trash2, CheckCircle2, Clock, AlertOctagon, User, Check, Barcode, ZoomIn, X, Camera } from 'lucide-react';
import { Product, AppUser, SupplierQuote, normalizeUrgency } from '../types';
import { updateProduct } from '../services/db';
import { compressProductImage } from '../utils/image';

interface ProductCardProps {
  product: Product;
  currentUser: AppUser;
  isSelected?: boolean;
  bestQuote?: SupplierQuote | null;
  onOpenQuote?: (product: Product) => void;
  onToggleSelect?: (product: Product) => void;
  onEdit: (product: Product) => void;
  onDelete: (product: Product) => void;
  onToggleStatus?: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  currentUser,
  isSelected = false,
  bestQuote,
  onOpenQuote,
  onToggleSelect,
  onEdit,
  onDelete,
  onToggleStatus,
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [isZoomOpen, setIsZoomOpen] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const cameraInputRef = useRef<HTMLInputElement>(null);
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

  const handleQuickPhotoCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploadingPhoto(true);
      const compressed = await compressProductImage(file, 800, 0.82);
      await updateProduct(product.id, { imageUrl: compressed });
    } catch (err) {
      console.error('Erro ao atualizar foto do produto:', err);
    } finally {
      setIsUploadingPhoto(false);
      e.target.value = '';
    }
  };

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
  // NOVO = Verde, NORMAL = Amarelo, URGENTE = Vermelho
  const priorityConfig = (() => {
    const urgency = normalizeUrgency(product.urgency);
    switch (urgency) {
      case 'novo':
        return {
          label: 'NOVO',
          color: '#059669', // Verde
          badgeBg: 'bg-emerald-50',
          badgeText: 'text-emerald-700',
          badgeBorder: 'border-emerald-200',
        };
      case 'urgente':
        return {
          label: 'URGENTE',
          color: '#dc2626', // Vermelho
          badgeBg: 'bg-red-50',
          badgeText: 'text-red-700',
          badgeBorder: 'border-red-200',
        };
      case 'normal':
      default:
        return {
          label: 'NORMAL',
          color: '#d97706', // Amarelo
          badgeBg: 'bg-amber-50',
          badgeText: 'text-amber-800',
          badgeBorder: 'border-amber-300',
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

        {/* Input oculto para captura direta da foto do produto pela câmera */}
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={handleQuickPhotoCapture}
        />

        {/* Área da Foto do Produto */}
        {product.imageUrl ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsZoomOpen(true);
            }}
            className="relative w-11 h-11 sm:w-12 sm:h-12 rounded-xl overflow-hidden border border-slate-200 bg-slate-50 shrink-0 shadow-2xs group cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500"
            title="Clique para ver a foto ampliada"
            aria-label={`Ver foto ampliada de ${product.name}`}
          >
            <img
              src={product.imageUrl}
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/25 flex items-center justify-center transition-colors">
              <ZoomIn className="w-3.5 h-3.5 text-white opacity-0 group-hover:opacity-100 drop-shadow-sm transition-opacity" />
            </div>
          </button>
        ) : (
          /* Placeholder de foto do produto (Permite tirar foto na hora clicando) */
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              cameraInputRef.current?.click();
            }}
            className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl border border-dashed border-slate-300 bg-slate-50 hover:bg-blue-50/70 hover:border-blue-400 flex flex-col items-center justify-center text-slate-400 hover:text-blue-600 transition-colors shrink-0 shadow-2xs cursor-pointer group"
            title="Tirar foto do produto com a câmera do celular"
            aria-label={`Adicionar foto de ${product.name}`}
          >
            {isUploadingPhoto ? (
              <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Camera className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition-colors" />
                <span className="text-[8px] font-semibold text-slate-400 group-hover:text-blue-600 leading-none mt-0.5">
                  Foto
                </span>
              </>
            )}
          </button>
        )}

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

          {/* Bottom Line: Priority pill + Responsible Initial na frente da Quantity */}
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            {/* Priority Tag matching user image */}
            <span
              className={`inline-flex items-center text-[11px] font-semibold px-2 py-0.5 rounded-md border ${priorityConfig.badgeBg} ${priorityConfig.badgeText} ${priorityConfig.badgeBorder} shrink-0`}
              title={`Prioridade: ${priorityConfig.label}`}
            >
              {priorityConfig.label}
            </span>

            {/* Informação com a letra de quem entrou o produto NA FRENTE do número da quantidade */}
            <div
              className="flex items-center gap-1.5 shrink-0"
              title={`Cadastrado por: ${product.responsibleName}`}
            >
              <span
                className="w-5 h-5 rounded-full border border-slate-300/90 bg-white flex items-center justify-center font-bold text-[10px] text-slate-700 select-none shrink-0 shadow-2xs"
                style={{
                  borderColor: product.responsibleColor ? `${product.responsibleColor}90` : '#cbd5e1',
                  color: product.responsibleColor || '#334155',
                }}
              >
                {product.responsibleInitial || 'U'}
              </span>

              {/* Quantity in blue */}
              <span
                className="text-xs sm:text-sm font-bold text-blue-600 shrink-0"
                title={`Quantidade: ${product.quantity} ${product.unit || 'un'}`}
              >
                {product.quantity}
                {product.unit && product.unit !== 'unidade' && (
                  <span className="text-[11px] font-normal text-blue-500 ml-0.5">
                    {product.unit}
                  </span>
                )}
              </span>
            </div>

            {product.barcode && (
              <span
                className="inline-flex items-center gap-1 text-[10px] font-mono text-slate-500 bg-slate-100/90 px-1.5 py-0.5 rounded truncate max-w-[110px]"
                title={`Código de barras: ${product.barcode}`}
              >
                <Barcode className="w-3 h-3 text-slate-400 shrink-0" />
                <span className="truncate">{product.barcode}</span>
              </span>
            )}

            {/* Cotação Vencedora / Melhor Preço se houver */}
            {bestQuote && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenQuote?.(product);
                }}
                className="inline-flex items-center gap-1 text-[10px] font-extrabold text-emerald-800 bg-emerald-100/80 hover:bg-emerald-200/80 border border-emerald-300 px-1.5 py-0.5 rounded transition-colors cursor-pointer"
                title={`Melhor oferta: R$ ${bestQuote.price.toFixed(2)} por ${bestQuote.supplierName} (marca: ${bestQuote.brand}) - Toque para ver ou cotar`}
              >
                <span className="text-[10px]">🏆</span>
                <span>R$ {bestQuote.price.toFixed(2).replace('.', ',')}</span>
                <span className="text-emerald-700 font-medium">({bestQuote.supplierName})</span>
              </button>
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

      {/* Modal de Zoom da Foto */}
      {isZoomOpen && product.imageUrl && (
        <div
          id={`photo-zoom-${product.id}`}
          className="fixed inset-0 z-60 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={(e) => {
            e.stopPropagation();
            setIsZoomOpen(false);
          }}
        >
          <div
            className="relative max-w-sm w-full bg-slate-900 rounded-3xl overflow-hidden p-3 shadow-2xl border border-slate-800 animate-in fade-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-2 py-1.5 text-white mb-2">
              <div className="min-w-0 pr-2">
                <h4 className="text-xs font-bold truncate">{product.name}</h4>
                {product.brand && <p className="text-[10px] text-slate-400">{product.brand}</p>}
              </div>
              <button
                type="button"
                onClick={() => setIsZoomOpen(false)}
                className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-white rounded-full hover:bg-white/10 cursor-pointer"
                title="Fechar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <img
              src={product.imageUrl}
              alt={product.name}
              className="w-full max-h-[65vh] object-contain rounded-2xl bg-black"
            />
          </div>
        </div>
      )}
    </div>
  );
};
