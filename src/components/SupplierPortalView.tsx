import React, { useState, useMemo } from 'react';
import {
  Lock,
  Building2,
  DollarSign,
  CheckCircle2,
  Clock,
  Search,
  Package,
  MessageCircle,
  Save,
  Edit2,
  ArrowLeft,
  ShieldCheck,
  Check,
  Send,
  X,
  Phone,
  HelpCircle,
  Mail,
  LogOut,
  Camera,
} from 'lucide-react';
import { Product, Supplier, SupplierQuote } from '../types';
import { normalizeSearchText } from '../utils/text';

interface SupplierPortalViewProps {
  supplier: Supplier;
  products: Product[];
  supplierQuotes: SupplierQuote[];
  onSaveQuote: (quoteData: {
    productId: string;
    productName: string;
    supplierId: string;
    supplierName: string;
    supplierPhone?: string;
    supplierEmail?: string;
    price: number;
    quantity: number;
    unit: string;
    brand: string;
    notes?: string;
  }) => Promise<void>;
  onToast: (title: string, description?: string, type?: 'success' | 'error' | 'info') => void;
  isTestingMode?: boolean;
  onExitTestingMode?: () => void;
  onLogout?: () => void;
}

export const SupplierPortalView: React.FC<SupplierPortalViewProps> = ({
  supplier,
  products,
  supplierQuotes,
  onSaveQuote,
  onToast,
  isTestingMode = false,
  onExitTestingMode,
  onLogout,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'todos' | 'pendentes' | 'cotados'>('todos');

  // Currently editing product ID (for inline quick form)
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [viewingPhotoUrl, setViewingPhotoUrl] = useState<string | null>(null);

  // Form values for the actively edited item
  const [formPriceCents, setFormPriceCents] = useState<number>(0);
  const [formQuantity, setFormQuantity] = useState('');
  const [formUnit, setFormUnit] = useState('un');
  const [formBrand, setFormBrand] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);

  // Active products in the store's shopping list
  const activeProducts = useMemo(() => {
    return products.filter((p) => p.status !== 'comprado');
  }, [products]);

  // Map of quotes by product ID specifically for THIS supplier
  const quotesByProductId = useMemo(() => {
    const map = new Map<string, SupplierQuote>();
    supplierQuotes.forEach((q) => {
      if (
        (supplier.id && q.supplierId === supplier.id) ||
        q.supplierName.trim().toLowerCase() === supplier.name.trim().toLowerCase()
      ) {
        map.set(q.productId, q);
      }
    });
    return map;
  }, [supplierQuotes, supplier]);

  // Statistics
  const totalItemsCount = activeProducts.length;
  const quotedItemsCount = activeProducts.filter((p) => quotesByProductId.has(p.id)).length;
  const pendingItemsCount = Math.max(0, totalItemsCount - quotedItemsCount);
  const progressPercentage = totalItemsCount > 0 ? Math.round((quotedItemsCount / totalItemsCount) * 100) : 0;

  // Total proposal value
  const totalProposalValue = useMemo(() => {
    let total = 0;
    activeProducts.forEach((p) => {
      const q = quotesByProductId.get(p.id);
      if (q && q.price > 0) {
        total += q.price * (q.quantity || 1);
      }
    });
    return total;
  }, [activeProducts, quotesByProductId]);

  // Filtered products list
  const filteredProducts = useMemo(() => {
    const searchNorm = normalizeSearchText(searchTerm);

    return activeProducts.filter((p) => {
      const isQuoted = quotesByProductId.has(p.id);
      if (filterStatus === 'pendentes' && isQuoted) return false;
      if (filterStatus === 'cotados' && !isQuoted) return false;

      if (!searchNorm) return true;

      const nameNorm = normalizeSearchText(p.name);
      const brandNorm = normalizeSearchText(p.brand || '');
      const existingQuote = quotesByProductId.get(p.id);
      const quoteBrandNorm = existingQuote ? normalizeSearchText(existingQuote.brand || '') : '';

      return (
        nameNorm.includes(searchNorm) ||
        brandNorm.includes(searchNorm) ||
        quoteBrandNorm.includes(searchNorm)
      );
    });
  }, [activeProducts, quotesByProductId, searchTerm, filterStatus]);

  // Start editing a product quote
  const handleStartEdit = (product: Product) => {
    const existing = quotesByProductId.get(product.id);
    setEditingProductId(product.id);

    if (existing) {
      setFormPriceCents(existing.price ? Math.round(existing.price * 100) : 0);
      setFormQuantity(String(existing.quantity ?? 1));
      setFormUnit(existing.unit || product.unit || 'un');
      setFormBrand(existing.brand || product.brand || '');
      setFormNotes(existing.notes || '');
    } else {
      setFormPriceCents(0);
      setFormQuantity('1');
      setFormUnit(product.unit || 'un');
      setFormBrand(product.brand || '');
      setFormNotes('');
    }
  };

  // Cancel edit
  const handleCancelEdit = () => {
    setEditingProductId(null);
    setFormPriceCents(0);
    setFormQuantity('');
    setFormBrand('');
    setFormNotes('');
  };

  // Save the quote
  const handleSaveItem = async (product: Product) => {
    const priceNum = formPriceCents / 100;

    if (isNaN(priceNum) || priceNum <= 0) {
      onToast('Preço obrigatório', 'Informe um valor unitário maior que zero.', 'error');
      return;
    }

    const cleanQtyStr = formQuantity.toString().trim();
    const qtyNum = parseFloat(cleanQtyStr);
    if (!cleanQtyStr || isNaN(qtyNum) || qtyNum <= 0) {
      onToast('Quantidade obrigatória', 'Informe a quantidade disponível (maior que zero).', 'error');
      return;
    }

    try {
      setIsSaving(true);
      await onSaveQuote({
        productId: product.id,
        productName: product.name,
        supplierId: supplier.id,
        supplierName: supplier.name,
        supplierPhone: supplier.phone,
        supplierEmail: supplier.email,
        price: priceNum,
        quantity: qtyNum,
        unit: formUnit || product.unit || 'un',
        brand: formBrand.trim() || product.brand || 'Conforme ofertado',
        notes: formNotes.trim(),
      });

      onToast('Cotação enviada com sucesso!', `${product.name}: R$ ${priceNum.toFixed(2).replace('.', ',')}`, 'success');
      setEditingProductId(null);
    } catch (err: any) {
      console.error('Error saving quote in portal:', err);
      onToast('Erro ao salvar proposta', err?.message || 'Tente novamente.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // WhatsApp notification to the store
  const handleNotifyStoreWhatsApp = () => {
    const quotedItems = activeProducts
      .filter((p) => quotesByProductId.has(p.id))
      .map((p) => {
        const q = quotesByProductId.get(p.id)!;
        return `• *${p.name}*: R$ ${q.price.toFixed(2).replace('.', ',')} (${q.brand || 'Ofertado'}) - Qtd: ${q.quantity} ${q.unit}`;
      });

    const msg = `Olá! Aqui é da *${supplier.name}*.\n\nConcluímos o preenchimento dos nossos preços para a sua Lista de Compras!\n\n📋 *Resumo da Cotação:*\n• Itens respondidos: ${quotedItemsCount} de ${totalItemsCount}\n• Valor total da nossa proposta: *R$ ${totalProposalValue.toFixed(2).replace('.', ',')}*\n\n${quotedItems.slice(0, 8).join('\n')}${quotedItems.length > 8 ? `\n... e mais ${quotedItems.length - 8} itens.` : ''}\n\nEstamos à disposição para fechar o pedido e emitir o faturamento. Obrigado!`;

    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
  };

  return (
    <div id="supplier-portal-container" className="flex-1 flex flex-col min-h-0 bg-slate-100 overflow-hidden font-sans">
      {/* Test Mode Top Bar (Shown only if store manager is previewing) */}
      {isTestingMode && (
        <div className="bg-amber-500 text-slate-950 px-4 py-2 flex items-center justify-between text-xs font-black shrink-0 shadow-xs z-30">
          <div className="flex items-center gap-2 truncate">
            <ShieldCheck className="w-4 h-4 shrink-0 text-slate-950" />
            <span className="truncate">
              Modo de Teste: Visualizando como <u>{supplier.name}</u> (Preços de outros fornecedores bloqueados)
            </span>
          </div>
          {onExitTestingMode && (
            <button
              type="button"
              onClick={onExitTestingMode}
              className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-[11px] font-bold transition-colors cursor-pointer shrink-0 ml-2"
            >
              Voltar à Loja
            </button>
          )}
        </div>
      )}

      {/* Main Supplier Header */}
      <header className="bg-slate-900 text-white px-4 py-3.5 border-b border-slate-800 shrink-0 shadow-md">
        <div className="flex items-center justify-between gap-2 mb-2.5">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 border border-emerald-400/50 flex items-center justify-center text-white font-black text-sm shrink-0 shadow-xs">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h1 className="text-base font-black text-white tracking-tight leading-tight truncate">
                  {supplier.name}
                </h1>
                <span className="inline-flex items-center gap-1 bg-emerald-950/80 text-emerald-400 border border-emerald-600/50 text-[10px] font-black px-2 py-0.5 rounded-full">
                  <Lock className="w-3 h-3 text-emerald-400" />
                  <span>Acesso Exclusivo</span>
                </span>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-slate-300 font-medium truncate mt-0.5">
                {supplier.email && (
                  <span className="flex items-center gap-1 text-emerald-300 truncate">
                    <Mail className="w-3 h-3 text-emerald-400 shrink-0" />
                    <span className="truncate">{supplier.email}</span>
                  </span>
                )}
                <span className="text-slate-500">•</span>
                <span className="text-slate-400">Portal de Cotação</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => setShowHelpModal(true)}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              title="Como funciona a cotação confidencial?"
              aria-label="Ajuda"
            >
              <HelpCircle className="w-5 h-5" />
            </button>

            {onLogout && (
              <button
                type="button"
                onClick={onLogout}
                className="px-2.5 py-1.5 bg-slate-800 hover:bg-red-950/80 border border-slate-700 hover:border-red-700/80 text-slate-300 hover:text-red-200 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Sair do portal de cotações"
              >
                <LogOut className="w-3.5 h-3.5 text-red-400" />
                <span className="hidden sm:inline">Sair</span>
              </button>
            )}
          </div>
        </div>

        {/* Progress Bar & Counter */}
        <div className="bg-slate-800/80 rounded-xl p-2.5 border border-slate-700/60">
          <div className="flex items-center justify-between text-xs mb-1.5 font-bold">
            <span className="text-slate-300 flex items-center gap-1.5">
              <span>Seu Progresso:</span>
              <strong className="text-emerald-400 font-black">{quotedItemsCount} de {totalItemsCount} cotados</strong>
            </span>
            <span className="text-slate-400 font-extrabold">{progressPercentage}%</span>
          </div>
          <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 transition-all duration-300 rounded-full"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>
      </header>

      {/* Search and Status Filters */}
      <div className="p-3.5 pb-2 shrink-0 max-w-2xl mx-auto w-full space-y-2">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar produto ou marca..."
            className="w-full bg-white text-slate-800 placeholder:text-slate-400 text-xs pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 shadow-2xs"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
            >
              ✕
            </button>
          )}
        </div>

        {/* Filters Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => setFilterStatus('todos')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
              filterStatus === 'todos'
                ? 'bg-slate-900 text-white shadow-2xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            Todos ({totalItemsCount})
          </button>
          <button
            type="button"
            onClick={() => setFilterStatus('pendentes')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 flex items-center gap-1 ${
              filterStatus === 'pendentes'
                ? 'bg-amber-600 text-white shadow-2xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Pendentes ({pendingItemsCount})</span>
          </button>
          <button
            type="button"
            onClick={() => setFilterStatus('cotados')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 flex items-center gap-1 ${
              filterStatus === 'cotados'
                ? 'bg-emerald-600 text-white shadow-2xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Cotados ({quotedItemsCount})</span>
          </button>
        </div>
      </div>

      {/* Products Quotation List */}
      <div className="flex-1 overflow-y-auto px-3.5 pt-1 space-y-3 max-w-2xl mx-auto w-full pb-28 no-scrollbar">
        {filteredProducts.length === 0 ? (
          <div className="bg-white rounded-2xl p-6 text-center border border-slate-200 shadow-2xs space-y-2">
            <Package className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="text-sm font-bold text-slate-800">Nenhum produto encontrado</p>
            <p className="text-xs text-slate-500">
              {filterStatus === 'pendentes'
                ? 'Parabéns! Você já respondeu todos os produtos desta lista.'
                : 'Tente alterar os termos da busca.'}
            </p>
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 rounded-lg transition-colors cursor-pointer"
              >
                Limpar busca
              </button>
            )}
          </div>
        ) : (
          filteredProducts.map((product) => {
            const quote = quotesByProductId.get(product.id);
            const isQuoted = Boolean(quote);
            const isCurrentlyEditing = editingProductId === product.id;

            return (
              <div
                key={product.id}
                className={`bg-white rounded-2xl p-4 transition-all shadow-2xs border ${
                  isQuoted ? 'border-emerald-300/90' : 'border-slate-200'
                }`}
              >
                {/* Product Header: Image + Title + Requested Brand + Status */}
                <div className="flex items-start gap-3 mb-1.5">
                  {product.imageUrl ? (
                    <div
                      onClick={() => setViewingPhotoUrl(product.imageUrl || null)}
                      className="relative w-14 h-14 rounded-xl overflow-hidden border border-slate-200 bg-slate-50 shrink-0 shadow-2xs cursor-pointer group"
                      title="Clique para ampliar a foto"
                    >
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                      <div className="absolute inset-0 bg-slate-950/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                        <Camera className="w-4 h-4" />
                      </div>
                    </div>
                  ) : (
                    <div
                      className="w-14 h-14 rounded-xl border border-dashed border-slate-300 bg-slate-50 flex items-center justify-center text-slate-400 shrink-0 shadow-2xs"
                      title="Sem foto do produto"
                    >
                      <Camera className="w-5 h-5 text-slate-300" />
                    </div>
                  )}

                  <div className="flex-1 min-w-0 flex items-start justify-between gap-2">
                    <div>
                      <h3 className="text-base font-extrabold text-slate-900 tracking-tight leading-snug">
                        {product.name}
                      </h3>
                      <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500 flex-wrap">
                        {product.brand && (
                          <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-[11px] font-medium border border-slate-200/60">
                            Ref: {product.brand}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Status Badge */}
                    {isQuoted ? (
                      <span className="shrink-0 bg-emerald-100 text-emerald-800 border border-emerald-300 font-extrabold text-xs px-2.5 py-1 rounded-full flex items-center gap-1 shadow-2xs">
                        <Check className="w-3.5 h-3.5 text-emerald-700" />
                        <span>Cotado</span>
                      </span>
                    ) : (
                      <span className="shrink-0 bg-amber-50 text-amber-800 border border-amber-200 font-bold text-xs px-2.5 py-1 rounded-full flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-amber-600" />
                        <span>Aguardando</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Store Notes if available */}
                {product.notes && (
                  <p className="text-[11px] text-slate-500 bg-slate-50 p-2 rounded-lg mb-2.5 border border-slate-100">
                    <span className="font-semibold text-slate-700">Obs. da loja:</span> {product.notes}
                  </p>
                )}

                {/* Inline Form when editing this item */}
                {isCurrentlyEditing ? (
                  <div className="mt-2.5 p-3.5 bg-slate-50 rounded-xl border border-emerald-300 space-y-3 animate-in fade-in duration-200">
                    <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
                      <span className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                        <DollarSign className="w-4 h-4 text-emerald-600" />
                        <span>Preencher Proposta da {supplier.name}</span>
                      </span>
                      <button
                        type="button"
                        onClick={handleCancelEdit}
                        className="text-slate-400 hover:text-slate-600 text-xs font-bold cursor-pointer"
                      >
                        Cancelar
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2.5">
                      {/* Valor Unitário */}
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          Valor Unitário (R$) *
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">
                            R$
                          </span>
                          <input
                            type="text"
                            inputMode="numeric"
                            value={(formPriceCents / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            onChange={(e) => {
                              const digits = e.target.value.replace(/\D/g, '');
                              const cents = digits === '' ? 0 : parseInt(digits, 10);
                              setFormPriceCents(cents);
                            }}
                            placeholder="0,00"
                            className="w-full bg-white text-slate-900 font-black text-sm pl-8 pr-2.5 py-2 rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                            autoFocus
                          />
                        </div>
                      </div>

                      {/* Marca Ofertada */}
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          Marca que vende
                        </label>
                        <input
                          type="text"
                          value={formBrand}
                          onChange={(e) => setFormBrand(e.target.value)}
                          placeholder="Ex: Tigre, Krona... (opcional)"
                          className="w-full bg-white text-slate-900 text-xs px-2.5 py-2 rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>

                      {/* Quantidade Disponível */}
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          Qtd Disponível *
                        </label>
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            min="0.01"
                            step="any"
                            value={formQuantity}
                            onChange={(e) => setFormQuantity(e.target.value)}
                            className="w-full bg-white text-slate-900 font-bold text-xs px-2.5 py-2 rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                            required
                          />
                          <span className="text-xs font-bold text-slate-500 px-1 shrink-0">
                            {formUnit || product.unit}
                          </span>
                        </div>
                      </div>

                      {/* Observações / Prazo */}
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          Prazo / Obs.
                        </label>
                        <input
                          type="text"
                          value={formNotes}
                          onChange={(e) => setFormNotes(e.target.value)}
                          placeholder="Ex: Pronta entrega (opcional)"
                          className="w-full bg-white text-slate-900 text-xs px-2.5 py-2 rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>
                    </div>

                    {/* Action Buttons inside inline form */}
                    <div className="flex items-center justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={handleCancelEdit}
                        className="px-3 py-1.5 bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs font-bold rounded-lg cursor-pointer transition-colors"
                      >
                        Descartar
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSaveItem(product)}
                        disabled={isSaving}
                        className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-black rounded-lg flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                      >
                        <Save className="w-3.5 h-3.5" />
                        <span>{isSaving ? 'Salvando...' : 'Salvar Preço'}</span>
                      </button>
                    </div>
                  </div>
                ) : isQuoted && quote ? (
                  /* Display already quoted card info */
                  <div className="mt-2.5 p-3 bg-emerald-50/70 border border-emerald-200/80 rounded-xl flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-base font-black text-emerald-800">
                          R$ {quote.price.toFixed(2).replace('.', ',')}
                        </span>
                        <span className="text-xs font-bold text-emerald-700">
                          /{quote.unit || product.unit}
                        </span>
                        <span className="bg-white text-slate-800 border border-slate-200 text-[11px] font-bold px-2 py-0.5 rounded shadow-2xs">
                          Marca: {quote.brand || 'Conforme ofertado'}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-600 mt-1 flex items-center gap-3">
                        <span>Disponível: <strong className="text-slate-800">{quote.quantity} {quote.unit || product.unit}</strong></span>
                        <span>Total: <strong className="text-emerald-800 font-bold">R$ {(quote.price * (quote.quantity || 1)).toFixed(2).replace('.', ',')}</strong></span>
                      </div>
                      {quote.notes && (
                        <p className="text-[10px] text-slate-500 mt-0.5 italic truncate">
                          "{quote.notes}"
                        </p>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => handleStartEdit(product)}
                      className="px-3 py-1.5 bg-white border border-emerald-300 hover:bg-emerald-100/70 text-emerald-800 text-xs font-bold rounded-lg flex items-center gap-1 transition-colors cursor-pointer shrink-0 shadow-2xs"
                    >
                      <Edit2 className="w-3 h-3 text-emerald-600" />
                      <span>Alterar</span>
                    </button>
                  </div>
                ) : (
                  /* Display pending button to enter price */
                  <div className="mt-2.5 flex items-center justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => handleStartEdit(product)}
                      className="w-full sm:w-auto px-4 py-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-black rounded-xl flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                    >
                      <DollarSign className="w-4 h-4" />
                      <span>Lançar Preço</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Floating Bottom Bar: Summary & WhatsApp Confirmation */}
      <div className="fixed bottom-0 left-0 right-0 max-w-2xl mx-auto p-3.5 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-lg z-20">
        <div className="flex items-center justify-between gap-2">
          <div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
              Sua Proposta ({quotedItemsCount} itens)
            </span>
            <span className="text-base font-black text-emerald-700 leading-tight">
              R$ {totalProposalValue.toFixed(2).replace('.', ',')}
            </span>
          </div>

          <button
            type="button"
            onClick={handleNotifyStoreWhatsApp}
            disabled={quotedItemsCount === 0}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-black rounded-xl flex items-center gap-2 shadow-xs transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
          >
            <MessageCircle className="w-4 h-4" />
            <span>Avisar Loja no WhatsApp</span>
          </button>
        </div>
      </div>

      {/* Help Modal */}
      {showHelpModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Lock className="w-5 h-5 text-emerald-600" />
                <h3 className="text-sm font-black text-slate-900">Privacidade Garantida</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowHelpModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-xs text-slate-600 space-y-2.5 leading-relaxed">
              <p>
                Este portal foi gerado especialmente para a empresa <strong>{supplier.name}</strong> responder à solicitação de compras da loja.
              </p>
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-950 font-medium space-y-1.5">
                <p className="font-bold flex items-center gap-1 text-emerald-800">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  Regras de Segurança:
                </p>
                <p>• Você só visualiza e edita os preços da sua empresa.</p>
                <p>• Nenhum outro fornecedor (como Tambasa ou Bartofil) tem acesso aos seus dados.</p>
                <p>• Você não visualiza os preços dos outros concorrentes.</p>
              </div>
              <p className="text-[11px] text-slate-500">
                Ao preencher e salvar os valores, nossa equipe de compras receberá seus preços em tempo real para finalizar os pedidos.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowHelpModal(false)}
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl cursor-pointer"
            >
              Entendido
            </button>
          </div>
        </div>
      )}

      {/* Fullscreen Photo Modal */}
      {viewingPhotoUrl && (
        <div
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in"
          onClick={() => setViewingPhotoUrl(null)}
        >
          <div className="relative max-w-lg w-full bg-white rounded-3xl overflow-hidden shadow-2xl p-3" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => setViewingPhotoUrl(null)}
              className="absolute top-5 right-5 bg-slate-900/70 hover:bg-slate-900 text-white p-2 rounded-full transition-colors z-10 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <img
              src={viewingPhotoUrl}
              alt="Foto do produto"
              className="w-full h-auto max-h-[80vh] object-contain rounded-2xl"
            />
          </div>
        </div>
      )}
    </div>
  );
};
