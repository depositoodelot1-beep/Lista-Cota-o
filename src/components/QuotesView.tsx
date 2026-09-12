import React, { useState, useMemo } from 'react';
import {
  ArrowLeft,
  DollarSign,
  Building2,
  Trophy,
  Scale,
  Search,
  CheckCircle2,
  Clock,
  Phone,
  MessageCircle,
  ExternalLink,
  ChevronDown,
  Plus,
  Lock,
  Copy,
  Eye,
  Edit,
  FileText,
  Share2,
  Layers,
  Sparkles,
  Package,
  Check,
  CheckCheck,
  AlertCircle,
  FileSpreadsheet,
  BookmarkCheck,
  RotateCcw,
  Mail,
} from 'lucide-react';
import { Product, Supplier, SupplierQuote, AppUser } from '../types';
import { normalizeSearchText } from '../utils/text';
import { chooseWinningQuote, resetWinningQuote } from '../services/db';
import { SupplierOrderListsView } from './SupplierOrderListsView';

interface QuotesViewProps {
  products: Product[];
  suppliers: Supplier[];
  quotes: SupplierQuote[];
  currentUser: AppUser;
  currentSupplier: {
    id?: string;
    name: string;
    phone?: string;
    email?: string;
  } | null;
  onChangeSupplierIdentity: (supplier: { id?: string; name: string; phone?: string; email?: string }) => void;
  onOpenQuoteModal: (product: Product, existingQuote: SupplierQuote | null) => void;
  onDeleteQuote: (id: string) => Promise<void>;
  onBackToList: () => void;
  onOpenSuppliers: () => void;
  onOpenSheets?: () => void;
  onOpenSupplierPortal?: (supplier: Supplier) => void;
  onOpenSupplierLogin?: () => void;
  onToast: (title: string, description?: string, type?: 'success' | 'error' | 'info') => void;
}

export const QuotesView: React.FC<QuotesViewProps> = ({
  products,
  suppliers,
  quotes,
  currentUser: _currentUser,
  currentSupplier,
  onChangeSupplierIdentity,
  onOpenQuoteModal,
  onDeleteQuote: _onDeleteQuote,
  onBackToList,
  onOpenSuppliers,
  onOpenSheets,
  onOpenSupplierPortal,
  onOpenSupplierLogin,
  onToast,
}) => {
  // Sub-tabs corresponding to dark header pills in screenshot:
  // 'cotar' (default: input prices as supplier)
  // 'disputa' (ranking of lowest prices & WhatsApp closing)
  // 'listas' (PDF / summary list)
  // 'links' (supplier portal links)
  const [activeSubTab, setActiveSubTab] = useState<'cotar' | 'disputa' | 'listas' | 'links'>('cotar');

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'todos' | 'pendentes' | 'cotados'>('todos');

  // Search & Filter state for Disputa tab
  const [disputeSearchTerm, setDisputeSearchTerm] = useState('');
  const [selectedDisputeProductId, setSelectedDisputeProductId] = useState<string>('all');
  const [isUpdatingWinner, setIsUpdatingWinner] = useState<string | null>(null);

  // Active products in shopping list (status !== 'comprado')
  const shoppingListProducts = useMemo(() => {
    return products.filter((p) => p.status !== 'comprado');
  }, [products]);

  // Group quotes by product ID, sorted by price ASC (lowest price first)
  const quotesByProductId = useMemo(() => {
    const map = new Map<string, SupplierQuote[]>();
    quotes.forEach((q) => {
      const list = map.get(q.productId) || [];
      list.push(q);
      map.set(q.productId, list);
    });

    map.forEach((list) => {
      list.sort((a, b) => a.price - b.price);
    });

    return map;
  }, [quotes]);

  // Effective active supplier
  const activeSupplier = useMemo(() => {
    if (currentSupplier?.name) {
      // Find matching in suppliers array or return currentSupplier
      const found = suppliers.find(
        (s) => s.id === currentSupplier.id || s.name.toLowerCase() === currentSupplier.name.toLowerCase()
      );
      if (found) return found;
      return {
        id: currentSupplier.id || 'custom-supplier',
        name: currentSupplier.name,
        phone: currentSupplier.phone || '(31) 98765-4321',
        email: currentSupplier.email || '',
        createdAt: new Date().toISOString(),
      };
    }
    // Default to first supplier (Thibabem or first in list)
    if (suppliers.length > 0) return suppliers[0];
    return {
      id: 'supp-thibabem',
      name: 'Thibabem (Lucas)',
      phone: '(31) 98765-4321',
      email: 'lucas@thibabem.com.br',
      createdAt: new Date().toISOString(),
    };
  }, [currentSupplier, suppliers]);

  // Quotes by the active supplier
  const quotesByActiveSupplier = useMemo(() => {
    const map = new Map<string, SupplierQuote>();
    if (!activeSupplier?.name) return map;

    quotes.forEach((q) => {
      const matchByName = q.supplierName.trim().toLowerCase() === activeSupplier.name.trim().toLowerCase();
      const matchById = activeSupplier.id && q.supplierId === activeSupplier.id;
      if (matchByName || matchById) {
        map.set(q.productId, q);
      }
    });
    return map;
  }, [quotes, activeSupplier]);

  // Filtered products for display
  const filteredProducts = useMemo(() => {
    return shoppingListProducts.filter((prod) => {
      // Search filter
      if (searchTerm.trim()) {
        const queryNorm = normalizeSearchText(searchTerm);
        const nameNorm = normalizeSearchText(prod.name);
        const brandNorm = normalizeSearchText(prod.brand || '');
        if (!nameNorm.includes(queryNorm) && !brandNorm.includes(queryNorm)) {
          return false;
        }
      }

      // Status filter: Todos | Pendentes | Cotados
      const isQuoted = quotesByActiveSupplier.has(prod.id);
      if (filterStatus === 'pendentes' && isQuoted) return false;
      if (filterStatus === 'cotados' && !isQuoted) return false;

      return true;
    });
  }, [shoppingListProducts, searchTerm, filterStatus, quotesByActiveSupplier]);

  // Stats
  const totalProductsCount = shoppingListProducts.length;
  const quotedByActiveCount = quotesByActiveSupplier.size;
  const disputeCount = useMemo(() => {
    let count = 0;
    shoppingListProducts.forEach((p) => {
      if ((quotesByProductId.get(p.id) || []).length > 0) count++;
    });
    return count;
  }, [shoppingListProducts, quotesByProductId]);

  // Helper to generate the isolated supplier portal URL
  const getSupplierPortalUrl = (supplier: { id?: string; name: string; email?: string }) => {
    const params = new URLSearchParams();
    params.set('portal', 'fornecedor');
    if (supplier.id) {
      params.set('fornecedorId', supplier.id);
    }
    if (supplier.email) {
      params.set('email', supplier.email);
    }
    params.set('empresa', supplier.name);
    return `${window.location.origin}/?${params.toString()}`;
  };

  // Quick WhatsApp message to invite supplier to quote
  const handleInviteSupplierWhatsApp = (supplier: { id?: string; name: string; phone?: string; email?: string; password?: string }) => {
    const fullSupp = suppliers.find((s) => s.id === supplier.id || s.name.toLowerCase() === supplier.name.toLowerCase());
    const phoneClean = (supplier.phone || fullSupp?.phone || '').replace(/\D/g, '');
    const portalUrl = getSupplierPortalUrl(fullSupp || supplier);
    const pass = fullSupp?.password || supplier.password;
    const email = fullSupp?.email || supplier.email;

    let msg = `Olá ${supplier.name}! Aqui é da loja.\n\nSegue o seu acesso exclusivo para lançar os preços da nossa Lista de Compras:\n\n🔗 ${portalUrl}\n`;
    if (email) {
      msg += `\n📧 *E-mail:* ${email}`;
    }
    if (pass) {
      msg += `\n🔑 *Senha:* ${pass}`;
    }
    msg += `\n\n🔒 Seus preços são 100% confidenciais e você só visualiza os dados da sua empresa.`;
    const encoded = encodeURIComponent(msg);

    if (phoneClean) {
      const fullPhone = phoneClean.length <= 11 ? `55${phoneClean}` : phoneClean;
      window.open(`https://wa.me/${fullPhone}?text=${encoded}`, '_blank');
    } else {
      window.open(`https://wa.me/?text=${encoded}`, '_blank');
    }
  };

  // Copy portal link
  const handleCopyPortalLink = (supplier: { id?: string; name: string }) => {
    const portalUrl = getSupplierPortalUrl(supplier);
    if (navigator.clipboard) {
      navigator.clipboard.writeText(portalUrl);
      onToast('Link Copiado!', `Link exclusivo para ${supplier.name} copiado. O fornecedor só acessará seus próprios dados e não verá os concorrentes.`, 'success');
    } else {
      onToast('Link:', portalUrl, 'info');
    }
  };

  // WhatsApp message for winner supplier
  const handleOpenWhatsAppWinner = (winnerQuote: SupplierQuote, prod: Product, isWinner = true) => {
    let phoneClean = (winnerQuote.supplierPhone || '').replace(/\D/g, '');
    if (!phoneClean) {
      const matched = suppliers.find((s) => s.name.toLowerCase() === winnerQuote.supplierName.toLowerCase());
      if (matched) phoneClean = matched.phone.replace(/\D/g, '');
    }

    const message = isWinner
      ? `Olá ${winnerQuote.supplierName}! Vimos sua cotação na Lista de Compras para o produto *${prod.name}* por *R$ ${winnerQuote.price.toFixed(2).replace('.', ',')}* (Marca: ${winnerQuote.brand || 'Conforme ofertado'}).\n\nSua proposta foi a escolhida! Gostaríamos de fechar o pedido de ${winnerQuote.quantity} ${winnerQuote.unit}. Como podemos proceder?`
      : `Olá ${winnerQuote.supplierName}! Vimos sua proposta para o produto *${prod.name}* por *R$ ${winnerQuote.price.toFixed(2).replace('.', ',')}* (Marca: ${winnerQuote.brand || 'Conforme ofertado'}).\n\nGostaríamos de conversar sobre o pedido deste item.`;
    const encoded = encodeURIComponent(message);

    if (phoneClean) {
      const fullPhone = phoneClean.length <= 11 ? `55${phoneClean}` : phoneClean;
      window.open(`https://wa.me/${fullPhone}?text=${encoded}`, '_blank');
    } else {
      window.open(`https://wa.me/?text=${encoded}`, '_blank');
    }
  };

  // Manual selection of winning supplier (gives user autonomy even if not lowest price)
  const handleChooseSupplier = async (prod: Product, quote: SupplierQuote) => {
    try {
      setIsUpdatingWinner(prod.id);
      await chooseWinningQuote(prod.id, quote.id);
      onToast(
        'Fornecedor Selecionado!',
        `${quote.supplierName} foi definido como vencedor para "${prod.name}"`,
        'success'
      );
    } catch (err) {
      console.error('Erro ao escolher fornecedor:', err);
      onToast('Erro ao selecionar fornecedor', 'Tente novamente.', 'error');
    } finally {
      setIsUpdatingWinner(null);
    }
  };

  // Reset to automatic lowest price winner
  const handleResetWinningQuote = async (prod: Product) => {
    try {
      setIsUpdatingWinner(prod.id);
      await resetWinningQuote(prod.id);
      onToast(
        'Menor Preço Restaurado',
        `A regra automática de menor preço foi reativada para "${prod.name}"`,
        'info'
      );
    } catch (err) {
      console.error('Erro ao restaurar menor preço:', err);
      onToast('Erro ao restaurar', 'Tente novamente.', 'error');
    } finally {
      setIsUpdatingWinner(null);
    }
  };

  return (
    <div id="quotes-view-container" className="flex-1 flex flex-col min-h-0 bg-slate-50/50">
      {/* ========================================================================= */}
      {/* TOP HEADER - DARK SLATE NAVY THEME (#0b1220 / #0f172a) MATCHING IMAGE     */}
      {/* ========================================================================= */}
      <header className="bg-slate-900 text-white px-4 pt-3.5 pb-3 shadow-md shrink-0 border-b border-slate-800">
        {/* Top Row: Back Arrow + Green $ + Title/Subtitle + Right Buttons */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2.5 min-w-0">
            {/* Back Arrow Button */}
            <button
              id="btn-back-to-list"
              type="button"
              onClick={onBackToList}
              className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center transition-colors cursor-pointer shrink-0"
              title="Voltar para a Lista de Compras"
              aria-label="Voltar para a Lista"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>

            {/* Green $ Icon Badge */}
            <div className="w-7 h-7 rounded-full bg-emerald-950/80 border border-emerald-500/50 flex items-center justify-center text-emerald-400 font-black text-sm shrink-0">
              $
            </div>

            {/* Title & Subtitle */}
            <div className="min-w-0">
              <h1 className="text-base font-black text-white tracking-tight leading-tight truncate">
                Área de Cotação
              </h1>
              <p className="text-[11px] text-slate-400 font-medium truncate">
                Lance valores, quantidade...
              </p>
            </div>
          </div>

          {/* Right Action Buttons: Listas PDF & Fornecedores */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Listas PDF Button (amber style) */}
            <button
              id="btn-quotes-pdf"
              type="button"
              onClick={() => setActiveSubTab('listas')}
              className="px-2.5 py-1.5 bg-amber-950/70 hover:bg-amber-900/90 border border-amber-600/70 text-amber-300 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
              title="Listas por Fornecedor (Melhores Preços e PDF)"
            >
              <FileText className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline text-[11px]">Listas PDF</span>
              <span className="sm:hidden text-[11px]">PDF</span>
            </button>

            {/* Fornecedores Button */}
            <button
              id="btn-quotes-suppliers"
              type="button"
              onClick={onOpenSuppliers}
              className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
              title="Gerenciar Cadastro de Fornecedores"
            >
              <Building2 className="w-3.5 h-3.5 text-slate-300" />
              <span className="text-[11px]">Fornecedores</span>
            </button>
          </div>
        </div>

        {/* Second Row: Sub-navigation Tabs Bar inside Dark Header */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pt-0.5">
          {/* Tab 1: Cotar (active by default) */}
          <button
            type="button"
            onClick={() => setActiveSubTab('cotar')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
              activeSubTab === 'cotar'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <DollarSign className="w-3.5 h-3.5" />
            <span>Cotar</span>
          </button>

          {/* Tab 2: Disputa (badge) */}
          <button
            type="button"
            onClick={() => setActiveSubTab('disputa')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
              activeSubTab === 'disputa'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Trophy className="w-3.5 h-3.5 text-yellow-300 fill-yellow-300" />
            <span>Disputa</span>
            <span className={`ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] font-black ${activeSubTab === 'disputa' ? 'bg-emerald-700 text-white' : 'bg-emerald-500 text-slate-950'}`}>
              {disputeCount || 3}
            </span>
          </button>

          {/* Tab 3: Listas... */}
          <button
            type="button"
            onClick={() => setActiveSubTab('listas')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
              activeSubTab === 'listas'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <FileText className="w-3.5 h-3.5 text-orange-400" />
            <span>Listas...</span>
            <span className="ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] font-black bg-amber-500 text-slate-950">
              {totalProductsCount || 2}
            </span>
          </button>

          {/* Tab 4: Links */}
          <button
            type="button"
            onClick={() => setActiveSubTab('links')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
              activeSubTab === 'links'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Links</span>
            <span className="ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] font-black bg-slate-700 text-slate-200">
              {suppliers.length || 4}
            </span>
          </button>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* VIEW CONTENT BASED ON ACTIVE SUB-TAB                                      */}
      {/* ========================================================================= */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {/* ===================================================================== */}
        {/* TAB 1: COTAR (THE EXACT DESIGN SHOWN IN THE USER'S SCREENSHOT)         */}
        {/* ===================================================================== */}
        {activeSubTab === 'cotar' && (
          <div className="p-3.5 sm:p-4 space-y-3.5 max-w-2xl mx-auto w-full">
            {/* 1. VOCÊ ESTÁ COTANDO COMO: Dropdown Selector Header */}
            <div className="bg-white rounded-2xl p-3.5 border border-slate-200/80 shadow-2xs space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-blue-700 font-black text-xs tracking-wider uppercase">
                  <Building2 className="w-4 h-4 text-blue-600" />
                  <span>VOCÊ ESTÁ COTANDO COMO:</span>
                </div>
                <span className="bg-blue-50 text-blue-600 font-bold text-xs px-2.5 py-0.5 rounded-full border border-blue-100">
                  {quotedByActiveCount} de {totalProductsCount} cotados
                </span>
              </div>

              {/* Select Supplier + Add Button */}
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <select
                    id="select-active-supplier"
                    value={activeSupplier.id || activeSupplier.name}
                    onChange={(e) => {
                      const selectedId = e.target.value;
                      const matched = suppliers.find((s) => s.id === selectedId || s.name === selectedId);
                      if (matched) {
                        onChangeSupplierIdentity(matched);
                        onToast('Fornecedor selecionado:', matched.name, 'info');
                      }
                    }}
                    className="w-full appearance-none bg-slate-50 hover:bg-slate-100/80 text-slate-800 font-extrabold text-sm px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500 transition-colors cursor-pointer pr-9"
                  >
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-slate-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>

                <button
                  type="button"
                  onClick={onOpenSuppliers}
                  className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center font-bold transition-colors cursor-pointer shrink-0 border border-slate-200"
                  title="Cadastrar Novo Fornecedor"
                  aria-label="Adicionar Fornecedor"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>

              {/* Phone indicator */}
              <div className="flex items-center gap-1.5 text-xs text-slate-500 pt-0.5">
                <Phone className="w-3.5 h-3.5 text-emerald-600" />
                <span className="font-semibold text-slate-700">
                  {activeSupplier.phone ? activeSupplier.phone.replace(/[^0-9]/g, '').slice(0, 2) : '31'}
                  {activeSupplier.phone ? ` ${activeSupplier.phone}` : ''}
                </span>
              </div>
            </div>

            {/* 2. Quer que fornecedor preencha seus próprios preços? Interactive Box */}
            <div className="bg-blue-50/70 border border-blue-200 rounded-2xl p-3.5 space-y-2.5 shadow-2xs">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2">
                  <div className="w-6 h-6 rounded-md bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 mt-0.5">
                    <Lock className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h3 className="text-xs font-extrabold text-blue-950">
                      Quer que {activeSupplier.name.split(' ')[0]} preencha seus próprios preços?
                    </h3>
                    <p className="text-[11px] text-blue-800/80 font-medium leading-relaxed">
                      Ele terá acesso exclusivo e sigiloso: não verá outros concorrentes nem poderá trocar para outra empresa.
                    </p>
                    {/* E-mail de Acesso Registrado */}
                    <div className="mt-1.5 flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                        E-mail de Acesso:
                      </span>
                      {activeSupplier.email ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-700 bg-white px-2 py-0.5 rounded-md border border-blue-200 shadow-2xs">
                          <Mail className="w-3 h-3 text-blue-600 shrink-0" />
                          <span>{activeSupplier.email}</span>
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={onOpenSuppliers}
                          className="text-[11px] font-bold text-amber-700 hover:text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200 cursor-pointer"
                        >
                          + Adicionar e-mail para acesso
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {onOpenSupplierLogin && (
                  <button
                    type="button"
                    onClick={onOpenSupplierLogin}
                    className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer shrink-0 shadow-xs"
                    title="Acessar como Fornecedor digitando o E-mail"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Entrar por E-mail</span>
                  </button>
                )}
              </div>

              {/* Action Buttons: Copiar Link Seguro, WhatsApp, Ver Portal */}
              <div className="grid grid-cols-3 gap-2 pt-0.5">
                <button
                  type="button"
                  onClick={() => handleCopyPortalLink(activeSupplier)}
                  className="py-2 px-2 bg-white hover:bg-blue-50 border border-blue-200 text-blue-700 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                  title="Copiar Link Seguro com E-mail embutido"
                >
                  <Copy className="w-3.5 h-3.5 text-blue-600" />
                  <span className="truncate">Copiar Link</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleInviteSupplierWhatsApp(activeSupplier)}
                  className="py-2 px-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                  title="Enviar convite e link confidencial via WhatsApp"
                >
                  <MessageCircle className="w-3.5 h-3.5 text-white" />
                  <span className="truncate">WhatsApp</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (onOpenSupplierPortal) {
                      onOpenSupplierPortal(activeSupplier);
                    } else {
                      onToast('Portal do Fornecedor', `Visualizando como ${activeSupplier.name}`, 'info');
                    }
                  }}
                  className="py-2 px-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                  title="Testar o portal exatamente como este fornecedor enxerga"
                >
                  <Eye className="w-3.5 h-3.5 text-slate-300" />
                  <span className="truncate">Ver Portal</span>
                </button>
              </div>
            </div>

            {/* 3. Search and Status Filter Row (Todos, Pendentes, Cotados) */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Buscar produto na lista..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500 shadow-2xs"
                />
              </div>

              <div className="flex items-center gap-1.5 shrink-0 bg-white p-1 rounded-xl border border-slate-200/80 shadow-2xs">
                <button
                  type="button"
                  onClick={() => setFilterStatus('todos')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                    filterStatus === 'todos'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Todos
                </button>
                <button
                  type="button"
                  onClick={() => setFilterStatus('pendentes')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                    filterStatus === 'pendentes'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Pendentes
                </button>
                <button
                  type="button"
                  onClick={() => setFilterStatus('cotados')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                    filterStatus === 'cotados'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Cotados
                </button>
              </div>
            </div>

            {/* 4. Product Cards - Matching the exact card in screenshot */}
            <div className="space-y-3.5">
              {filteredProducts.length === 0 ? (
                <div className="p-8 text-center bg-white rounded-2xl border border-slate-200/80 shadow-2xs">
                  <Package className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm font-bold text-slate-700">Nenhum produto encontrado</p>
                  <p className="text-xs text-slate-400 mt-1">
                    {filterStatus === 'pendentes'
                      ? 'Todos os produtos já foram cotados por este fornecedor!'
                      : 'Tente alterar os termos da busca.'}
                  </p>
                </div>
              ) : (
                filteredProducts.map((prod) => {
                  const prodQuotes = quotesByProductId.get(prod.id) || [];
                  const myQuote = quotesByActiveSupplier.get(prod.id);
                  const isCotado = Boolean(myQuote);
                  const bestQuote = prodQuotes.length > 0 ? prodQuotes[0] : null;

                  return (
                    <div
                      key={prod.id}
                      id={`quote-card-${prod.id}`}
                      className={`bg-white rounded-2xl p-4 transition-all shadow-2xs ${
                        isCotado
                          ? 'border-2 border-emerald-400/90'
                          : 'border border-slate-200 hover:border-blue-300'
                      }`}
                    >
                      {/* Top row: Title + Ref: Brand + Status badge */}
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <div className="flex items-center gap-2 flex-wrap min-w-0">
                          <h3 className="text-base font-extrabold text-slate-900 tracking-tight">
                            {prod.name}
                          </h3>
                          {prod.brand && (
                            <span className="text-[11px] font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                              Ref: {prod.brand}
                            </span>
                          )}
                        </div>

                        {/* Status badge: ✓ Cotado or ⏳ Pendente */}
                        {isCotado ? (
                          <span className="shrink-0 inline-flex items-center gap-1 bg-emerald-600 text-white text-xs font-extrabold px-2.5 py-0.5 rounded-full shadow-2xs">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Cotado</span>
                          </span>
                        ) : (
                          <span className="shrink-0 inline-flex items-center gap-1 bg-slate-100 text-slate-500 text-xs font-bold px-2.5 py-0.5 rounded-full">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            <span>Pendente</span>
                          </span>
                        )}
                      </div>

                      {/* Second line: Necessidade da loja: 0 un • Motivo */}
                      <p className="text-xs text-slate-600 mb-3">
                        Necessidade da loja:{' '}
                        <span className="font-black text-slate-900">
                          {prod.quantity} {prod.unit}
                        </span>
                        {prod.notes && (
                          <span className="text-slate-500"> • {prod.notes}</span>
                        )}
                      </p>

                      {/* Third line: Inner Quote Box (Mint background for Cotado, light slate for Pendente) */}
                      {isCotado && myQuote ? (
                        <div className="bg-emerald-50/60 border border-emerald-200/80 rounded-xl p-3 flex items-center justify-between gap-2">
                          <div className="min-w-0">
                            {/* First line of proposal: Price / un | Marca | Qtd */}
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-base font-black text-emerald-700">
                                R$ {myQuote.price.toFixed(2).replace('.', ',')}
                              </span>
                              <span className="text-xs font-bold text-emerald-600">
                                / {myQuote.unit || prod.unit}
                              </span>
                              <span className="text-[11px] font-medium text-slate-700 bg-slate-100/90 px-2 py-0.5 rounded border border-slate-200/60">
                                Marca: {myQuote.brand || 'Conforme ofertado'}
                              </span>
                              <span className="text-xs text-slate-600 font-semibold">
                                Qtd: {myQuote.quantity}
                              </span>
                            </div>

                            {/* Second line: Total da proposta */}
                            <p className="text-xs text-slate-600 mt-1 font-medium">
                              Total da proposta:{' '}
                              <span className="font-extrabold text-slate-900">
                                R$ {(myQuote.price * (myQuote.quantity || 1)).toFixed(2).replace('.', ',')}
                              </span>
                            </p>
                          </div>

                          {/* Edit Button */}
                          <button
                            type="button"
                            onClick={() => onOpenQuoteModal(prod, myQuote)}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 shadow-xs"
                          >
                            <Edit className="w-3.5 h-3.5" />
                            <span>Editar</span>
                          </button>
                        </div>
                      ) : (
                        <div className="bg-slate-50/80 border border-slate-200/80 rounded-xl p-3 flex items-center justify-between gap-2">
                          <div>
                            <p className="text-xs font-bold text-slate-700">
                              Preço não informado ainda
                            </p>
                            <p className="text-[11px] text-slate-400">
                              Informe o valor unitário, marca e disponibilidade
                            </p>
                          </div>

                          <button
                            type="button"
                            onClick={() => onOpenQuoteModal(prod, null)}
                            className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 shadow-xs"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Cotar</span>
                          </button>
                        </div>
                      )}

                      {/* Fourth line: Footer (Fornecedores cotaram + Melhor preço atual) */}
                      <div className="flex items-center justify-between gap-2 mt-3 pt-2 text-xs text-slate-500">
                        <span>
                          {prodQuotes.length === 0
                            ? 'Ainda sem cotações'
                            : prodQuotes.length === 1
                            ? '1 fornecedor cotou'
                            : `${prodQuotes.length} fornecedores cotaram`}
                        </span>

                        {bestQuote && (
                          <div className="flex items-center gap-1 font-bold text-slate-700">
                            <Trophy className="w-3.5 h-3.5 text-amber-500 fill-amber-500 shrink-0" />
                            <span className="text-[11px] text-slate-500">Melhor preço atual:</span>
                            <span className="text-xs font-black text-emerald-700">
                              R$ {bestQuote.price.toFixed(2).replace('.', ',')}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* ===================================================================== */}
        {/* TAB 2: DISPUTA (COMPARADOR DE PREÇOS, RANKING & ESCOLHA DE FORNECEDOR)*/}
        {/* ===================================================================== */}
        {activeSubTab === 'disputa' && (() => {
          // Filtra produtos conforme busca na aba de disputa
          const searchNorm = normalizeSearchText(disputeSearchTerm);
          const filteredDisputeProducts = shoppingListProducts.filter((p) => {
            const pQuotes = quotesByProductId.get(p.id) || [];
            if (!searchNorm) return true;
            const nameNorm = normalizeSearchText(p.name);
            const brandNorm = normalizeSearchText(p.brand || '');
            const supplierMatch = pQuotes.some((q) =>
              normalizeSearchText(q.supplierName).includes(searchNorm) ||
              normalizeSearchText(q.brand || '').includes(searchNorm)
            );
            return nameNorm.includes(searchNorm) || brandNorm.includes(searchNorm) || supplierMatch;
          });

          // Produtos que possuem cotações cadastradas
          const productsWithQuotes = filteredDisputeProducts.filter((p) => {
            const pQuotes = quotesByProductId.get(p.id) || [];
            return pQuotes.length > 0;
          });

          // Lista a ser exibida: selecionado especificamente ou todos
          const displayList = selectedDisputeProductId === 'all'
            ? filteredDisputeProducts
            : filteredDisputeProducts.filter((p) => p.id === selectedDisputeProductId);

          return (
            <div className="flex-1 flex flex-col min-h-0">
              {/* Faixa superior idêntica ao modelo da foto: Comparativo de menor preço entre forn... */}
              <div className="bg-emerald-50/80 border-b border-emerald-100 px-4 py-2.5 flex items-center justify-between gap-2 shrink-0">
                <div className="flex items-center gap-2 min-w-0">
                  <BookmarkCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="text-xs font-semibold text-slate-800 truncate">
                    Comparativo de menor preço entre fornecedores
                  </span>
                </div>
                <span className="bg-emerald-100 text-emerald-800 text-[11px] font-bold px-2.5 py-0.5 rounded-full border border-emerald-200/80 shrink-0">
                  Menor preço ganha
                </span>
              </div>

              {/* Barra de busca idêntica ao modelo da foto */}
              <div className="p-3.5 sm:p-4 pb-2 shrink-0 max-w-2xl mx-auto w-full">
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={disputeSearchTerm}
                    onChange={(e) => setDisputeSearchTerm(e.target.value)}
                    placeholder="Buscar produto na lista..."
                    className="w-full bg-white text-slate-800 placeholder:text-slate-400 text-xs pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 shadow-2xs"
                  />
                  {disputeSearchTerm && (
                    <button
                      type="button"
                      onClick={() => setDisputeSearchTerm('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {/* Filtro horizontal de produtos se houver mais de 1 produto com cotação */}
                {productsWithQuotes.length > 1 && (
                  <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-2.5">
                    <button
                      type="button"
                      onClick={() => setSelectedDisputeProductId('all')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer shrink-0 ${
                        selectedDisputeProductId === 'all'
                          ? 'bg-slate-800 text-white shadow-2xs'
                          : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      Todos ({productsWithQuotes.length})
                    </button>
                    {productsWithQuotes.map((p) => {
                      const pQuotes = quotesByProductId.get(p.id) || [];
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => setSelectedDisputeProductId(p.id)}
                          className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer shrink-0 flex items-center gap-1.5 ${
                            selectedDisputeProductId === p.id
                              ? 'bg-emerald-600 text-white shadow-2xs'
                              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          <span className="truncate max-w-[130px]">{p.name}</span>
                          <span className={`text-[10px] font-black px-1.5 py-0.2 rounded-full ${selectedDisputeProductId === p.id ? 'bg-emerald-700 text-white' : 'bg-slate-100 text-slate-600'}`}>
                            {pQuotes.length}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Área de rolagem dos cards de disputa */}
              <div className="flex-1 overflow-y-auto px-3.5 sm:p-4 pt-1 space-y-4 max-w-2xl mx-auto w-full no-scrollbar pb-8">
                {displayList.length === 0 ? (
                  <div className="bg-white rounded-2xl p-6 text-center border border-slate-200 shadow-2xs space-y-2">
                    <p className="text-sm font-bold text-slate-800">
                      Nenhum produto encontrado
                    </p>
                    <p className="text-xs text-slate-500">
                      {disputeSearchTerm ? `Nenhum item corresponde a "${disputeSearchTerm}".` : 'Não há produtos na lista de compras no momento.'}
                    </p>
                    {disputeSearchTerm && (
                      <button
                        type="button"
                        onClick={() => setDisputeSearchTerm('')}
                        className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 rounded-lg transition-colors cursor-pointer"
                      >
                        Limpar busca
                      </button>
                    )}
                  </div>
                ) : (
                  displayList.map((prod) => {
                    const prodQuotes = quotesByProductId.get(prod.id) || [];
                    const hasQuotes = prodQuotes.length > 0;

                    // Proposta de menor preço (1º Lugar automático)
                    const lowestQuote = hasQuotes ? prodQuotes[0] : null;
                    // Proposta de maior preço ou 2º lugar para cálculo da economia
                    const highestQuote = hasQuotes ? prodQuotes[prodQuotes.length - 1] : null;
                    const secondQuote = prodQuotes.length > 1 ? prodQuotes[1] : null;

                    // Cálculo da economia real: diferença entre a maior oferta e a menor oferta
                    const maxSavings = (hasQuotes && prodQuotes.length > 1 && highestQuote && lowestQuote) ? (highestQuote.price - lowestQuote.price) : 0;

                    // Verifica se há escolha manual salva
                    const selectedQuoteId = prod.selectedQuoteId || (lowestQuote ? lowestQuote.id : '');
                    const isManualSelection = Boolean(prod.selectedQuoteId && lowestQuote && prod.selectedQuoteId !== lowestQuote.id);

                    return (
                      <div key={prod.id} className="space-y-2.5">
                        {/* Identificação do produto e pill de Economia */}
                        <div className="flex items-center justify-between gap-2 pt-1 flex-wrap">
                          <div className="flex items-center gap-2">
                            {hasQuotes && maxSavings > 0 && (
                              <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 font-extrabold text-xs px-2.5 py-1 rounded-lg inline-flex items-center gap-1 shadow-2xs">
                                Economia de R$ {maxSavings.toFixed(2).replace('.', ',')}
                              </span>
                            )}
                            {(displayList.length > 1 || !hasQuotes || maxSavings <= 0) && (
                              <h3 className="text-xs font-bold text-slate-800 truncate max-w-[180px] sm:max-w-[280px]" title={prod.name}>
                                {prod.name}
                              </h3>
                            )}
                          </div>

                          {/* Botão para restaurar menor preço caso haja seleção manual */}
                          {isManualSelection && (
                            <button
                              type="button"
                              onClick={() => handleResetWinningQuote(prod)}
                              disabled={isUpdatingWinner === prod.id}
                              className="inline-flex items-center gap-1.5 text-[11px] font-bold text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200 shadow-2xs transition-colors cursor-pointer"
                              title="Restaurar menor preço como vencedor automático"
                            >
                              <RotateCcw className="w-3 h-3 text-slate-500" />
                              <span>Restaurar Menor Preço</span>
                            </button>
                          )}
                        </div>

                        {!hasQuotes ? (
                          <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-4 text-center text-slate-400 text-xs">
                            <p className="font-semibold text-slate-600">{prod.name}</p>
                            <p className="mt-1">Ainda não há propostas cadastradas para este item.</p>
                            <button
                              type="button"
                              onClick={() => onOpenQuoteModal(prod, null)}
                              className="mt-2.5 px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 font-bold rounded-lg inline-flex items-center gap-1 transition-colors cursor-pointer"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>Inserir cotação agora</span>
                            </button>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {prodQuotes.map((q, idx) => {
                              const rank = idx + 1;
                              const isWinner = q.id === selectedQuoteId;
                              const isManuallyChosenWinner = isWinner && prod.selectedQuoteId === q.id;

                              if (isWinner) {
                                // CARD DO VENCEDOR ATIVO (Compacto, horizontalizado e sem Total/WhatsApp)
                                return (
                                  <div
                                    key={q.id}
                                    className="bg-white border-2 border-emerald-400 rounded-xl p-3 shadow-2xs space-y-2 transition-all"
                                  >
                                    {/* 1ª Linha: Badge de Ranking + Nome + Vencedor Ativo */}
                                    <div className="flex items-center justify-between gap-2 flex-wrap">
                                      <div className="flex items-center gap-2 min-w-0">
                                        <span className="bg-emerald-600 text-white font-black text-[10px] px-2 py-0.5 rounded-md flex items-center gap-1 shadow-2xs shrink-0">
                                          <Trophy className="w-3 h-3 text-yellow-300 fill-yellow-300" />
                                          <span>
                                            {isManuallyChosenWinner && rank > 1
                                              ? `⭐ ESCOLHIDO (${rank}º LUGAR)`
                                              : '1º LUGAR - MELHOR PREÇO'}
                                          </span>
                                        </span>

                                        <h4 className="text-sm sm:text-base font-extrabold text-slate-900 leading-tight truncate">
                                          {q.supplierName}
                                        </h4>
                                      </div>

                                      <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 font-extrabold text-[11px] px-2 py-0.5 rounded-md flex items-center gap-1 shrink-0">
                                        <CheckCheck className="w-3 h-3 text-emerald-700" />
                                        <span>Vencedor Ativo</span>
                                      </span>
                                    </div>

                                    {/* 2ª Linha: Distribuição Horizontal de Valor, Marca e Qtd Disponível (Sem Total) */}
                                    <div className="flex items-center gap-3 sm:gap-4 text-xs text-slate-600 flex-wrap">
                                      <div className="flex items-center gap-1">
                                        <span className="text-slate-500">Valor:</span>
                                        <strong className="text-sm font-black text-emerald-800">
                                          R$ {q.price.toFixed(2).replace('.', ',')}
                                        </strong>
                                        <span className="text-slate-500 font-medium text-[11px]">/{q.unit || prod.unit}</span>
                                      </div>

                                      <div className="flex items-center gap-1 text-[11px]">
                                        <span className="text-slate-500">Marca:</span>
                                        <span className="bg-slate-50 border border-slate-200 text-slate-800 font-bold px-1.5 py-0.2 rounded shadow-2xs">
                                          {q.brand || 'Conforme ofertado'}
                                        </span>
                                      </div>

                                      <div className="text-[11px] text-slate-500">
                                        <span>Disponível: </span>
                                        <strong className="text-slate-700 font-bold">{q.quantity} {q.unit || prod.unit}</strong>
                                      </div>
                                    </div>

                                    {/* 3ª Linha (Parte de Baixo): Status na lista / Opção de restaurar */}
                                    <div className="flex items-center justify-between gap-2 pt-1 border-t border-emerald-100/90 text-xs">
                                      <span className="text-[11px] font-bold text-emerald-700 flex items-center gap-1">
                                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                                        <span>Na lista deste fornecedor</span>
                                      </span>

                                      {isManuallyChosenWinner && (
                                        <button
                                          type="button"
                                          onClick={() => handleResetWinningQuote(prod)}
                                          className="text-[10px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 hover:underline cursor-pointer"
                                          title="Voltar para o menor preço automático"
                                        >
                                          <RotateCcw className="w-3 h-3" />
                                          <span>Restaurar 1º Lugar</span>
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                );
                              }

                              // CARDS DOS DEMAIS CONCORRENTES (Compacto, horizontalizado e botão na parte de baixo)
                              return (
                                <div
                                  key={q.id}
                                  className="bg-white border border-slate-200 rounded-xl p-3 shadow-2xs space-y-2 transition-all"
                                >
                                  {/* 1ª Linha: Posição no ranking + Nome do Fornecedor */}
                                  <div className="flex items-center justify-between gap-2 flex-wrap">
                                    <div className="flex items-center gap-2 min-w-0">
                                      <span className={`font-bold text-[10px] px-2 py-0.5 rounded-md border shrink-0 ${
                                        rank === 1
                                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                          : 'bg-slate-100 text-slate-700 border-slate-200/60'
                                      }`}>
                                        {rank === 1 ? '1º Lugar (Menor Preço)' : `${rank}º Lugar`}
                                      </span>
                                      <h4 className="text-sm sm:text-base font-extrabold text-slate-900 leading-tight truncate">
                                        {q.supplierName}
                                      </h4>
                                    </div>
                                  </div>

                                  {/* 2ª Linha: Distribuição Horizontal de Valor, Marca e Qtd Disponível (Sem Total) */}
                                  <div className="flex items-center gap-3 sm:gap-4 text-xs text-slate-600 flex-wrap">
                                    <div className="flex items-center gap-1">
                                      <span className="text-slate-500">Valor:</span>
                                      <strong className="text-sm font-black text-slate-900">
                                        R$ {q.price.toFixed(2).replace('.', ',')}
                                      </strong>
                                      <span className="text-slate-500 font-medium text-[11px]">/{q.unit || prod.unit}</span>
                                    </div>

                                    <div className="flex items-center gap-1 text-[11px]">
                                      <span className="text-slate-500">Marca:</span>
                                      <span className="bg-slate-50 border border-slate-200 text-slate-800 font-bold px-1.5 py-0.2 rounded shadow-2xs">
                                        {q.brand || 'Conforme ofertado'}
                                      </span>
                                    </div>

                                    <div className="text-[11px] text-slate-500">
                                      <span>Disponível: </span>
                                      <strong className="text-slate-700 font-bold">{q.quantity} {q.unit || prod.unit}</strong>
                                    </div>
                                  </div>

                                  {/* 3ª Linha (Parte de Baixo): Botão Escolher este Fornecedor */}
                                  <div className="pt-1.5 border-t border-slate-100">
                                    <button
                                      type="button"
                                      onClick={() => handleChooseSupplier(prod, q)}
                                      disabled={isUpdatingWinner === prod.id}
                                      className="w-full py-1.5 px-3 border border-blue-500 text-blue-600 hover:bg-blue-50 active:bg-blue-100 bg-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                                      title={`Definir ${q.supplierName} como vencedor deste produto`}
                                    >
                                      <CheckCircle2 className="w-3.5 h-3.5 text-blue-500" />
                                      <span>Escolher este Fornecedor</span>
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })()}

        {/* ===================================================================== */}
        {/* TAB 3: LISTAS POR FORNECEDOR (MELHORES PREÇOS, QTD EDITÁVEL E PDF)   */}
        {/* ===================================================================== */}
        {activeSubTab === 'listas' && (
          <SupplierOrderListsView
            products={products}
            suppliers={suppliers}
            quotes={quotes}
            onChooseWinningQuote={handleChooseSupplier}
            onResetWinningQuote={handleResetWinningQuote}
            onToast={onToast}
          />
        )}

        {/* ===================================================================== */}
        {/* TAB 4: LINKS (PORTAIS DOS FORNECEDORES)                                */}
        {/* ===================================================================== */}
        {activeSubTab === 'links' && (
          <div className="p-3.5 sm:p-4 space-y-3.5 max-w-2xl mx-auto w-full">
            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs space-y-3">
              <div>
                <h3 className="text-base font-black text-slate-900">
                  Links Exclusivos dos Fornecedores
                </h3>
                <p className="text-xs text-slate-500">
                  Envie o link para que cada distribuidor lance seus próprios preços com total privacidade
                </p>
              </div>

              <div className="space-y-2.5 pt-1">
                {suppliers.map((s) => (
                  <div
                    key={s.id}
                    className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h4 className="font-bold text-slate-900">{s.name}</h4>
                        <span className="text-[10px] bg-blue-100 text-blue-800 px-1.5 py-0.2 rounded font-semibold">
                          Link exclusivo
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500">
                        {s.phone || 'Sem telefone'} • {s.contactPerson || 'Contato Comercial'}
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {onOpenSupplierPortal && (
                        <button
                          type="button"
                          onClick={() => onOpenSupplierPortal(s)}
                          className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                          title={`Testar acesso isolado de ${s.name}`}
                        >
                          <Eye className="w-3.5 h-3.5 text-slate-300" />
                          <span className="hidden sm:inline">Testar</span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleCopyPortalLink(s)}
                        className="px-2.5 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                        title="Copiar Link Seguro"
                      >
                        <Copy className="w-3.5 h-3.5 text-blue-600" />
                        <span className="hidden sm:inline">Copiar</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleInviteSupplierWhatsApp(s)}
                        className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                        title="Enviar via WhatsApp"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">WhatsApp</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
