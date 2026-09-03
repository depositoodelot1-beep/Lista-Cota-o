import React, { useState, useMemo } from 'react';
import {
  X,
  Search,
  Package,
  Plus,
  CheckCircle2,
  AlertOctagon,
  Clock,
  Edit2,
  Trash2,
  RefreshCw,
  ShoppingBag,
  ListPlus,
  Check,
  Filter,
} from 'lucide-react';
import { Product, AppUser } from '../types';
import { capitalizeWords } from '../utils/text';

interface ProductCatalogModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  currentUser: AppUser;
  onReincludeToShoppingList: (
    product: Product,
    quantity?: number,
    urgency?: 'alta' | 'media' | 'baixa' | 'urgente'
  ) => Promise<void>;
  onEditProduct: (product: Product) => void;
  onDeleteProduct: (product: Product) => void;
  onAddNewProduct: () => void;
}

export const ProductCatalogModal: React.FC<ProductCatalogModalProps> = ({
  isOpen,
  onClose,
  products,
  currentUser,
  onReincludeToShoppingList,
  onEditProduct,
  onDeleteProduct,
  onAddNewProduct,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [catalogFilter, setCatalogFilter] = useState<'all' | 'in_list' | 'bought'>('all');
  
  // State for customizing re-inclusion (quantity & urgency popup)
  const [reincludingProduct, setReincludingProduct] = useState<Product | null>(null);
  const [reincludeQty, setReincludeQty] = useState<number>(1);
  const [reincludeUrgency, setReincludeUrgency] = useState<'alta' | 'media' | 'baixa' | 'urgente'>('alta');
  const [submittingId, setSubmittingId] = useState<string | null>(null);

  // Filter products for catalog
  const filteredProducts = useMemo(() => {
    let list = [...products];

    // Search filter
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      list = list.filter(
        (p) =>
          (p.name && p.name.toLowerCase().includes(term)) ||
          (p.brand && p.brand.toLowerCase().includes(term)) ||
          (p.responsibleName && p.responsibleName.toLowerCase().includes(term)) ||
          (p.notes && p.notes.toLowerCase().includes(term))
      );
    }

    // Status category filter
    if (catalogFilter === 'in_list') {
      list = list.filter((p) => p.status !== 'comprado');
    } else if (catalogFilter === 'bought') {
      list = list.filter((p) => p.status === 'comprado');
    }

    // Sort alphabetically by name
    list.sort((a, b) => (a.name || '').localeCompare(b.name || '', 'pt-BR'));

    return list;
  }, [products, searchTerm, catalogFilter]);

  const totalCount = products.length;
  const inListCount = products.filter((p) => p.status !== 'comprado').length;
  const boughtCount = products.filter((p) => p.status === 'comprado').length;

  const handleStartReinclude = (product: Product) => {
    setReincludingProduct(product);
    setReincludeQty(product.quantity > 0 ? product.quantity : 1);
    setReincludeUrgency(product.urgency || 'alta');
  };

  const handleConfirmReinclude = async () => {
    if (!reincludingProduct) return;
    try {
      setSubmittingId(reincludingProduct.id);
      await onReincludeToShoppingList(reincludingProduct, reincludeQty, reincludeUrgency);
      setReincludingProduct(null);
    } finally {
      setSubmittingId(null);
    }
  };

  const handleQuickReinclude = async (product: Product) => {
    try {
      setSubmittingId(product.id);
      await onReincludeToShoppingList(
        product,
        product.quantity > 0 ? product.quantity : 1,
        product.urgency || 'alta'
      );
    } finally {
      setSubmittingId(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      id="product-catalog-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div className="bg-white rounded-3xl w-full max-w-xl max-h-[90vh] shadow-2xl flex flex-col overflow-hidden border border-slate-100">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-slate-800">
                  Base de Produtos
                </h2>
                <span className="text-[11px] font-bold bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full border border-blue-200/60">
                  {totalCount} {totalCount === 1 ? 'item' : 'itens'}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Catálogo geral para busca e reinclusão rápida na lista
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 rounded-full transition-colors cursor-pointer"
              title="Fechar catálogo"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="p-4 border-b border-slate-100 space-y-3 bg-white shrink-0">
          {/* Search Input */}
          <div className="relative">
            <input
              id="catalog-search-input"
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(capitalizeWords(e.target.value))}
              placeholder="Pesquisar produto ou marca na base..."
              autoCapitalize="words"
              autoComplete="off"
              className="w-full bg-slate-100 border-none rounded-xl py-2.5 pl-10 pr-9 text-sm text-slate-800 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500 focus:outline-hidden transition-all"
            />
            <div className="absolute left-3.5 top-3 text-slate-400">
              <Search className="w-4 h-4" />
            </div>
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-2.5 p-1 text-slate-400 hover:text-slate-600 rounded-full"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Filter Chips */}
          <div className="flex items-center justify-between gap-2 overflow-x-auto no-scrollbar">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setCatalogFilter('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  catalogFilter === 'all'
                    ? 'bg-slate-800 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Todos ({totalCount})
              </button>
              <button
                type="button"
                onClick={() => setCatalogFilter('in_list')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  catalogFilter === 'in_list'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Na Lista ({inListCount})
              </button>
              <button
                type="button"
                onClick={() => setCatalogFilter('bought')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  catalogFilter === 'bought'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Fora da Lista / Comprados ({boughtCount})
              </button>
            </div>

            {/* Quick Add New Product Button */}
            <button
              type="button"
              onClick={() => {
                onClose();
                onAddNewProduct();
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs font-bold transition-colors cursor-pointer shrink-0 border border-blue-200/80"
              title="Cadastrar novo produto na base"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Novo Produto</span>
            </button>
          </div>
        </div>

        {/* Product List Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
          {filteredProducts.length === 0 ? (
            <div className="text-center py-12 px-4">
              <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
                <Package className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-slate-700">Nenhum produto encontrado</h4>
              <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                {searchTerm
                  ? `Nenhum resultado corresponde a "${searchTerm}".`
                  : 'Nenhum item cadastrado nesta categoria.'}
              </p>
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="mt-3 px-3 py-1.5 text-xs text-blue-600 font-semibold hover:underline cursor-pointer"
                >
                  Limpar busca
                </button>
              )}
            </div>
          ) : (
            filteredProducts.map((product) => {
              const isInShoppingList = product.status !== 'comprado';
              const isSubmitting = submittingId === product.id;

              return (
                <div
                  key={product.id}
                  id={`catalog-item-${product.id}`}
                  className={`p-3 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    isInShoppingList
                      ? 'bg-blue-50/20 border-blue-100/80'
                      : 'bg-white border-slate-100 hover:border-slate-200 shadow-2xs'
                  }`}
                >
                  {/* Left info: Avatar + Title & Details */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="w-9 h-9 rounded-full border border-slate-300/80 flex items-center justify-center font-medium text-sm text-slate-700 shrink-0 bg-white select-none shadow-2xs"
                      title={`Cadastrado por: ${product.responsibleName}`}
                    >
                      {product.responsibleInitial || 'U'}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-bold text-slate-900 text-sm leading-tight truncate">
                          {product.name}
                        </h4>
                        {product.brand && (
                          <span className="text-xs text-slate-400 font-normal">
                            - {product.brand}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 mt-1 flex-wrap text-xs text-slate-500">
                        {/* Status Badge */}
                        {isInShoppingList ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-200/80 px-1.5 py-0.5 rounded-md">
                            Na Lista ({product.quantity} {product.unit || 'un'})
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-500 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded-md">
                            Fora da Lista (Comprado)
                          </span>
                        )}

                        {/* Urgency */}
                        <span className="text-[11px] text-slate-400">
                          Urgência: <span className="font-medium text-slate-600 capitalize">{product.urgency}</span>
                        </span>

                        {product.notes && (
                          <span className="text-[11px] text-slate-400 italic truncate max-w-[200px]">
                            • "{product.notes}"
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right actions: Re-include or In-list indicator */}
                  <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
                    {isInShoppingList ? (
                      <span
                        className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center shrink-0"
                        title="Já na Lista"
                      >
                        <Check className="w-4 h-4 text-emerald-600" />
                      </span>
                    ) : (
                      <div className="flex items-center gap-1">
                        {/* Quick 1-click reinclude */}
                        <button
                          type="button"
                          disabled={isSubmitting}
                          onClick={() => handleQuickReinclude(product)}
                          className="w-8 h-8 rounded-xl bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center shadow-xs transition-all cursor-pointer disabled:opacity-50 shrink-0"
                          title="Incluir na Lista de compras"
                        >
                          <Plus className="w-4 h-4" />
                        </button>

                        {/* Button to open custom re-include options (qty & urgency) */}
                        <button
                          type="button"
                          onClick={() => handleStartReinclude(product)}
                          className="w-8 h-8 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 flex items-center justify-center transition-colors cursor-pointer text-xs shrink-0"
                          title="Personalizar quantidade e urgência antes de incluir"
                        >
                          <Filter className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}

                    {/* Edit button */}
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onEditProduct(product);
                      }}
                      className="w-8 h-8 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 flex items-center justify-center transition-colors cursor-pointer shrink-0"
                      title="Editar detalhes do produto"
                    >
                      <Edit2 className="w-3.5 h-3.5 text-slate-500" />
                    </button>

                    {/* Delete button (Admin only) */}
                    {currentUser.role === 'admin' && (
                      <button
                        type="button"
                        onClick={() => onDeleteProduct(product)}
                        className="w-8 h-8 rounded-xl hover:bg-red-50 text-slate-400 hover:text-red-600 flex items-center justify-center transition-colors cursor-pointer shrink-0"
                        title="Excluir produto da base (Admin)"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-red-500" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-3.5 border-t border-slate-100 bg-slate-50/70 flex items-center justify-between text-xs text-slate-500 shrink-0">
          <span>
            Mostrando <b>{filteredProducts.length}</b> de <b>{totalCount}</b> produtos
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 font-semibold text-slate-700 transition-colors cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>

      {/* Popover / Dialog for customizing Quantity & Urgency when reincluding */}
      {reincludingProduct && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl p-5 max-w-sm w-full shadow-2xl border border-slate-100 space-y-4">
            <div>
              <h3 className="font-bold text-slate-800 text-sm sm:text-base">
                Incluir na Lista de Compras
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Defina a quantidade e a urgência para <b>{reincludingProduct.name}</b>
              </p>
            </div>

            {/* Quantity */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Quantidade Necessária ({reincludingProduct.unit || 'un'})
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setReincludeQty((q) => Math.max(0, q - 1))}
                  className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 font-bold text-slate-700 flex items-center justify-center cursor-pointer"
                >
                  -
                </button>
                <input
                  type="number"
                  min="0"
                  value={reincludeQty}
                  onChange={(e) => setReincludeQty(Math.max(0, Number(e.target.value)))}
                  className="w-20 text-center bg-slate-100 border-none rounded-xl py-2 font-bold text-sm text-slate-800 focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={() => setReincludeQty((q) => q + 1)}
                  className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 font-bold text-slate-700 flex items-center justify-center cursor-pointer"
                >
                  +
                </button>
                <span className="text-xs text-slate-500 ml-1">
                  {reincludeQty === 0 ? '(0 = Em falta total)' : 'unidades'}
                </span>
              </div>
            </div>

            {/* Urgency */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Nível de Urgência
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { key: 'baixa', label: 'Baixa', color: 'border-blue-300 text-blue-700 bg-blue-50' },
                  { key: 'media', label: 'Normal', color: 'border-emerald-300 text-emerald-700 bg-emerald-50' },
                  { key: 'alta', label: 'Alta', color: 'border-amber-300 text-amber-800 bg-amber-50' },
                  { key: 'urgente', label: 'Urgente', color: 'border-red-300 text-red-700 bg-red-50' },
                ].map((u) => (
                  <button
                    key={u.key}
                    type="button"
                    onClick={() => setReincludeUrgency(u.key as any)}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer text-center ${
                      reincludeUrgency === u.key
                        ? `${u.color} ring-2 ring-blue-500/20 shadow-2xs`
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {u.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setReincludingProduct(null)}
                className="px-4 py-2 rounded-xl text-xs font-medium text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={submittingId !== null}
                onClick={handleConfirmReinclude}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Confirmar e Incluir</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
