import React, { useState, useMemo, useEffect } from 'react';
import {
  FileText,
  Printer,
  MessageCircle,
  Copy,
  Building2,
  Trophy,
  CheckCheck,
  Plus,
  Minus,
  RefreshCw,
  Search,
  ExternalLink,
  ChevronDown,
  X,
  AlertCircle,
  Package,
  RotateCcw
} from 'lucide-react';
import { Product, Supplier, SupplierQuote } from '../types';
import { normalizeSearchText } from '../utils/text';

interface SupplierOrderListsViewProps {
  products: Product[];
  suppliers: Supplier[];
  quotes: SupplierQuote[];
  onChooseWinningQuote?: (productId: string, quoteId: string) => Promise<void>;
  onResetWinningQuote?: (productId: string) => Promise<void>;
  onToast: (title: string, description?: string, type?: 'success' | 'error' | 'info') => void;
}

interface SupplierOrderItem {
  product: Product;
  quote: SupplierQuote;
  isLowestPrice: boolean;
  isManualChoice: boolean;
  rank: number;
  allQuotes: SupplierQuote[];
  orderQuantity: number;
}

export const SupplierOrderListsView: React.FC<SupplierOrderListsViewProps> = ({
  products,
  suppliers,
  quotes,
  onChooseWinningQuote,
  onResetWinningQuote,
  onToast,
}) => {
  // Quantidades editadas pelo usuário para cada fornecedor e produto
  // Chave: `${supplierKey}_${productId}`
  const [customQuantities, setCustomQuantities] = useState<Record<string, number>>(() => {
    try {
      const saved = localStorage.getItem('loja_pedidos_fornecedor_qtds');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Salvar quantidades no localStorage
  const updateOrderQuantity = (supplierKey: string, productId: string, newQty: number) => {
    const validQty = Math.max(0, isNaN(newQty) ? 0 : newQty);
    const key = `${supplierKey}_${productId}`;
    setCustomQuantities((prev) => {
      const updated = { ...prev, [key]: validQty };
      try {
        localStorage.setItem('loja_pedidos_fornecedor_qtds', JSON.stringify(updated));
      } catch (e) {
        console.error('Erro ao salvar quantidade:', e);
      }
      return updated;
    });
  };

  // Mapeamento de cotações ordenadas por preço para cada produto
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

  // Produtos que estão na lista de compras (status != 'comprado')
  const shoppingListProducts = useMemo(() => {
    return products.filter((p) => p.status !== 'comprado');
  }, [products]);

  // Agrupamento dos produtos por fornecedor vencedor (melhor preço ou escolha manual)
  const supplierOrdersMap = useMemo(() => {
    // Mapa de identificador do fornecedor -> lista de itens
    const map = new Map<string, SupplierOrderItem[]>();

    shoppingListProducts.forEach((prod) => {
      const prodQuotes = quotesByProductId.get(prod.id) || [];
      if (prodQuotes.length === 0) return;

      const lowestQuote = prodQuotes[0];
      // Se tiver escolha manual salva no produto, busca ela
      const chosenQuote = prod.selectedQuoteId
        ? prodQuotes.find((q) => q.id === prod.selectedQuoteId) || lowestQuote
        : lowestQuote;

      if (!chosenQuote) return;

      // Chave única para o fornecedor
      const supplierKey = chosenQuote.supplierId || chosenQuote.supplierName.trim().toLowerCase();

      // Determina a quantidade a comprar: pega do customQuantities ou padrão do produto
      const qtyKey = `${supplierKey}_${prod.id}`;
      const effectiveQty = customQuantities[qtyKey] !== undefined ? customQuantities[qtyKey] : prod.quantity || 1;

      const item: SupplierOrderItem = {
        product: prod,
        quote: chosenQuote,
        isLowestPrice: chosenQuote.id === lowestQuote.id,
        isManualChoice: Boolean(prod.selectedQuoteId && prod.selectedQuoteId === chosenQuote.id && prod.selectedQuoteId !== lowestQuote.id),
        rank: prodQuotes.findIndex((q) => q.id === chosenQuote.id) + 1,
        allQuotes: prodQuotes,
        orderQuantity: effectiveQty,
      };

      const existing = map.get(supplierKey) || [];
      existing.push(item);
      map.set(supplierKey, existing);
    });

    return map;
  }, [shoppingListProducts, quotesByProductId, customQuantities]);

  // Lista consolidada de fornecedores com contagem de produtos
  const suppliersWithOrders = useMemo(() => {
    // Lista de fornecedores conhecidos + fornecedores que aparecem nas cotações
    const list: Array<{
      key: string;
      id?: string;
      name: string;
      phone?: string;
      email?: string;
      itemCount: number;
    }> = [];

    const processedKeys = new Set<string>();

    // Primeiro os fornecedores cadastrados
    suppliers.forEach((s) => {
      const key = s.id || s.name.trim().toLowerCase();
      const items = supplierOrdersMap.get(key) || [];
      list.push({
        key,
        id: s.id,
        name: s.name,
        phone: s.phone,
        email: s.email,
        itemCount: items.length,
      });
      processedKeys.add(key);
    });

    // Depois qualquer fornecedor das cotações que não esteja no array principal
    supplierOrdersMap.forEach((items, key) => {
      if (!processedKeys.has(key) && items.length > 0) {
        const first = items[0].quote;
        list.push({
          key,
          id: first.supplierId,
          name: first.supplierName,
          phone: first.supplierPhone,
          email: first.supplierEmail,
          itemCount: items.length,
        });
        processedKeys.add(key);
      }
    });

    // Ordena: primeiro os que têm itens (maior número de itens primeiro)
    return list.sort((a, b) => b.itemCount - a.itemCount);
  }, [suppliers, supplierOrdersMap]);

  // Fornecedor selecionado atualmente
  const [selectedSupplierKey, setSelectedSupplierKey] = useState<string>(() => {
    // Escolhe o primeiro fornecedor que tenha itens
    const firstWithItems = suppliersWithOrders.find((s) => s.itemCount > 0);
    return firstWithItems ? firstWithItems.key : (suppliersWithOrders[0]?.key || '');
  });

  // Garante que se o fornecedor selecionado mudar ou não tiver mais itens, mantenha um válido
  useEffect(() => {
    if (!selectedSupplierKey && suppliersWithOrders.length > 0) {
      const firstWithItems = suppliersWithOrders.find((s) => s.itemCount > 0);
      setSelectedSupplierKey(firstWithItems ? firstWithItems.key : suppliersWithOrders[0].key);
    }
  }, [suppliersWithOrders, selectedSupplierKey]);

  // Dados do fornecedor selecionado
  const currentSupplierInfo = useMemo(() => {
    return suppliersWithOrders.find((s) => s.key === selectedSupplierKey) || suppliersWithOrders[0] || null;
  }, [suppliersWithOrders, selectedSupplierKey]);

  // Itens do fornecedor selecionado
  const currentItems = useMemo(() => {
    if (!currentSupplierInfo) return [];
    return supplierOrdersMap.get(currentSupplierInfo.key) || [];
  }, [supplierOrdersMap, currentSupplierInfo]);

  // Filtro de busca de produtos dentro da lista
  const [itemSearch, setItemSearch] = useState('');

  const filteredItems = useMemo(() => {
    if (!itemSearch.trim()) return currentItems;
    const norm = normalizeSearchText(itemSearch);
    return currentItems.filter(
      (item) =>
        normalizeSearchText(item.product.name).includes(norm) ||
        normalizeSearchText(item.quote.brand || '').includes(norm)
    );
  }, [currentItems, itemSearch]);

  // Total de itens ativos e valor estimado
  const activeItemsCount = currentItems.filter((i) => i.orderQuantity > 0).length;
  const estimatedTotal = useMemo(() => {
    return currentItems.reduce((acc, item) => acc + item.quote.price * item.orderQuantity, 0);
  }, [currentItems]);

  // Estado para visualização / impressão de PDF
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);

  // Copiar lista formatada (Nome do produto e quantidade)
  const handleCopyList = () => {
    if (!currentSupplierInfo || currentItems.length === 0) return;

    const validItems = currentItems.filter((i) => i.orderQuantity > 0);
    if (validItems.length === 0) {
      onToast('Nenhum item com quantidade', 'Adicione a quantidade de ao menos um produto.', 'error');
      return;
    }

    const lines = [
      `*LISTA DE COMPRAS / PEDIDO - ${currentSupplierInfo.name.toUpperCase()}*`,
      `Data: ${new Date().toLocaleDateString('pt-BR')}`,
      '',
      ...validItems.map((item, index) => {
        return `${index + 1}. ${item.product.name} - ${item.orderQuantity} ${item.product.unit || 'un'}`;
      }),
      '',
      `Total de itens: ${validItems.length}`,
    ];

    const text = lines.join('\n');
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      onToast('Lista copiada!', 'A lista com os produtos e quantidades foi copiada para a área de transferência.', 'success');
    } else {
      onToast('Lista:', text, 'info');
    }
  };

  // Enviar lista diretamente para o WhatsApp do fornecedor
  const handleWhatsAppSend = () => {
    if (!currentSupplierInfo || currentItems.length === 0) return;

    const validItems = currentItems.filter((i) => i.orderQuantity > 0);
    if (validItems.length === 0) {
      onToast('Nenhum item com quantidade', 'Adicione a quantidade de ao menos um produto.', 'error');
      return;
    }

    const lines = [
      `Olá ${currentSupplierInfo.name}! Segue a nossa lista com os produtos e quantidades para fechamento do pedido:`,
      '',
      `*PEDIDO DE COMPRA*`,
      `*Data:* ${new Date().toLocaleDateString('pt-BR')}`,
      '',
      ...validItems.map((item, index) => {
        return `*${index + 1}.* ${item.product.name} - *${item.orderQuantity} ${item.product.unit || 'un'}*`;
      }),
      '',
      `*Total de itens:* ${validItems.length}`,
      '',
      `Por favor, confirmar o recebimento e o prazo de entrega. Obrigado!`,
    ];

    const text = lines.join('\n');
    const phoneClean = (currentSupplierInfo.phone || '').replace(/\D/g, '');
    const encoded = encodeURIComponent(text);

    if (phoneClean) {
      const fullPhone = phoneClean.length <= 11 ? `55${phoneClean}` : phoneClean;
      window.open(`https://wa.me/${fullPhone}?text=${encoded}`, '_blank');
    } else {
      window.open(`https://wa.me/?text=${encoded}`, '_blank');
    }
  };

  // Disparar impressão do PDF
  const handlePrintPdf = () => {
    window.print();
  };

  // Produtos que estão sem cotação ou sem vencedor
  const productsWithoutQuotes = useMemo(() => {
    return shoppingListProducts.filter((p) => {
      const list = quotesByProductId.get(p.id) || [];
      return list.length === 0;
    });
  }, [shoppingListProducts, quotesByProductId]);

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-slate-50/60">
      {/* 1. Header Informativo das Listas por Fornecedor */}
      <div className="bg-white border-b border-slate-200 px-4 py-3 shrink-0">
        <div className="flex items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-blue-100 text-blue-800 p-1.5 rounded-lg">
                <FileText className="w-4 h-4 text-blue-700" />
              </span>
              <h2 className="text-sm sm:text-base font-extrabold text-slate-900">
                Listas de Pedidos por Fornecedor
              </h2>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Produtos onde cada fornecedor teve o melhor preço ou foi escolhido. Edite a quantidade antes de gerar o PDF.
            </p>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => setIsPdfModalOpen(true)}
              disabled={!currentSupplierInfo || currentItems.length === 0}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:pointer-events-none text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
              title="Visualizar e Imprimir a Lista em PDF"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Gerar PDF</span>
              <span className="sm:hidden">PDF</span>
            </button>
          </div>
        </div>

        {/* 2. Seletor Horizontal de Fornecedores com Badge de Itens Vencidos */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pt-3">
          {suppliersWithOrders.map((sup) => {
            const isSelected = sup.key === selectedSupplierKey;
            const hasItems = sup.itemCount > 0;

            return (
              <button
                key={sup.key}
                type="button"
                onClick={() => setSelectedSupplierKey(sup.key)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shrink-0 cursor-pointer border ${
                  isSelected
                    ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                    : hasItems
                    ? 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    : 'bg-slate-100 text-slate-400 border-slate-200 hover:bg-slate-200'
                }`}
              >
                <Building2 className={`w-3.5 h-3.5 ${isSelected ? 'text-blue-400' : 'text-slate-500'}`} />
                <span className="truncate max-w-[130px] sm:max-w-[180px]">{sup.name}</span>
                <span
                  className={`text-[10px] font-black px-1.5 py-0.2 rounded-full ${
                    isSelected
                      ? 'bg-blue-500 text-white'
                      : hasItems
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {sup.itemCount} {sup.itemCount === 1 ? 'item' : 'itens'}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Conteúdo do Fornecedor Selecionado */}
      <div className="flex-1 overflow-y-auto p-3.5 sm:p-4 space-y-3.5 max-w-3xl mx-auto w-full">
        {currentSupplierInfo ? (
          <>
            {/* Card de Resumo do Fornecedor Selecionado com Botões de Ação */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-base font-extrabold text-slate-900">
                      {currentSupplierInfo.name}
                    </h3>
                    <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-extrabold px-2 py-0.5 rounded-md flex items-center gap-1">
                      <Trophy className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                      <span>{currentItems.length} {currentItems.length === 1 ? 'produto ganho' : 'produtos ganhos'}</span>
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {currentSupplierInfo.phone || 'Sem telefone cadastrado'} {currentSupplierInfo.email ? `• ${currentSupplierInfo.email}` : ''}
                  </p>
                </div>

                {/* Botões de Ação: WhatsApp, PDF, Copiar */}
                <div className="flex items-center gap-1.5 flex-wrap shrink-0">
                  <button
                    type="button"
                    onClick={handleWhatsAppSend}
                    disabled={currentItems.length === 0}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                    title="Enviar lista via WhatsApp com nome do produto e quantidade"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>WhatsApp</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsPdfModalOpen(true)}
                    disabled={currentItems.length === 0}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                    title="Abrir Lista Pronta para Imprimir ou Salvar PDF"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>PDF</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleCopyList}
                    disabled={currentItems.length === 0}
                    className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                    title="Copiar texto simples da lista"
                  >
                    <Copy className="w-3.5 h-3.5 text-slate-600" />
                    <span className="hidden sm:inline">Copiar</span>
                  </button>
                </div>
              </div>

              {/* Informação sobre edição das quantidades */}
              <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-2.5 flex items-start gap-2 text-xs text-amber-900">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div className="leading-snug">
                  <span className="font-bold">Ajuste as quantidades desejadas abaixo:</span> você pode aumentar, diminuir ou zerar qualquer produto antes de gerar o PDF ou enviar por WhatsApp.
                </div>
              </div>

              {/* Campo de Busca de Produtos dentro da Lista */}
              {currentItems.length > 3 && (
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={itemSearch}
                    onChange={(e) => setItemSearch(e.target.value)}
                    placeholder="Filtrar produtos desta lista..."
                    className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                  {itemSearch && (
                    <button
                      type="button"
                      onClick={() => setItemSearch('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
                    >
                      ✕
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* 4. Lista dos Produtos do Fornecedor com Controle de Quantidade */}
            {filteredItems.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-2 shadow-2xs">
                <Package className="w-10 h-10 text-slate-300 mx-auto" />
                <p className="text-sm font-bold text-slate-800">
                  {itemSearch ? 'Nenhum produto corresponde à busca' : 'Nenhum produto vencedor para este fornecedor'}
                </p>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  {itemSearch
                    ? 'Tente outro termo de pesquisa.'
                    : 'Este fornecedor ainda não possui cotações vencedoras ou escolhidas na Lista de Compras.'}
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {filteredItems.map((item, index) => {
                  const prod = item.product;
                  const quote = item.quote;
                  const qty = item.orderQuantity;

                  return (
                    <div
                      key={prod.id}
                      className={`bg-white rounded-2xl border p-3.5 shadow-2xs transition-all ${
                        qty === 0
                          ? 'border-slate-200 opacity-60 bg-slate-50/50'
                          : 'border-slate-200/90 hover:border-blue-300'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          {/* Nome e numeração */}
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-700 text-[11px] font-black flex items-center justify-center shrink-0">
                              {index + 1}
                            </span>
                            <h4 className="text-sm font-extrabold text-slate-900 leading-snug">
                              {prod.name}
                            </h4>
                          </div>

                          {/* Preço cotado por este fornecedor e marca */}
                          <div className="flex items-center gap-2 mt-1 text-xs text-slate-600 flex-wrap">
                            <span className="font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                              Cotado: R$ {quote.price.toFixed(2).replace('.', ',')} /{quote.unit || prod.unit}
                            </span>

                            {quote.brand && (
                              <span className="text-slate-500 text-[11px]">
                                Marca: <strong className="text-slate-700">{quote.brand}</strong>
                              </span>
                            )}

                            {item.isManualChoice ? (
                              <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                                ⭐ Escolha Manual
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                                🥇 Menor Preço
                              </span>
                            )}
                          </div>

                          <div className="text-[11px] text-slate-400 mt-1">
                            Necessidade inicial da loja: {prod.quantity} {prod.unit}
                          </div>
                        </div>

                        {/* CONTROLE DE QUANTIDADE EDITÁVEL */}
                        <div className="shrink-0 flex flex-col items-end">
                          <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1">
                            Qtd a Comprar:
                          </label>
                          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 shadow-2xs">
                            <button
                              type="button"
                              onClick={() => updateOrderQuantity(currentSupplierInfo.key, prod.id, Math.max(0, qty - 1))}
                              className="w-7 h-7 rounded-lg bg-white hover:bg-slate-200 active:scale-95 text-slate-700 flex items-center justify-center font-bold text-sm shadow-2xs transition-transform cursor-pointer"
                              title="Diminuir quantidade"
                              aria-label="Diminuir"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>

                            <input
                              type="number"
                              min="0"
                              step="any"
                              value={qty === 0 ? '0' : qty}
                              onChange={(e) => {
                                const val = parseFloat(e.target.value);
                                updateOrderQuantity(currentSupplierInfo.key, prod.id, isNaN(val) ? 0 : val);
                              }}
                              className="w-14 text-center bg-white border border-slate-300 rounded-lg py-1 font-black text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500 shadow-inner"
                              title="Digite a quantidade exata"
                            />

                            <button
                              type="button"
                              onClick={() => updateOrderQuantity(currentSupplierInfo.key, prod.id, qty + 1)}
                              className="w-7 h-7 rounded-lg bg-white hover:bg-slate-200 active:scale-95 text-slate-700 flex items-center justify-center font-bold text-sm shadow-2xs transition-transform cursor-pointer"
                              title="Aumentar quantidade"
                              aria-label="Aumentar"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>

                            <span className="text-[11px] font-bold text-slate-600 px-1">
                              {prod.unit || 'un'}
                            </span>
                          </div>

                          {/* Subtotal estimado deste produto */}
                          <div className="text-[11px] font-bold text-slate-700 mt-1">
                            Subtotal: <span className="text-slate-900">R$ {(quote.price * qty).toFixed(2).replace('.', ',')}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-2">
            <p className="text-sm font-bold text-slate-800">Nenhum fornecedor selecionado</p>
          </div>
        )}

        {/* 5. Se houver produtos sem cotação, exibe aviso informativo */}
        {productsWithoutQuotes.length > 0 && (
          <div className="bg-slate-100/80 border border-slate-200 rounded-2xl p-3.5 text-xs text-slate-600 space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-slate-800">
              <AlertCircle className="w-4 h-4 text-amber-500" />
              <span>{productsWithoutQuotes.length} itens ainda não possuem nenhuma cotação cadastrada</span>
            </div>
            <p className="text-[11px] text-slate-500">
              Para que apareçam na lista de um fornecedor, insira a cotação na aba "Cotar" ou envie o link do portal para o distribuidor.
            </p>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* MODAL / TELA DE VISUALIZAÇÃO E IMPRESSÃO DO PDF (FORMATO A4 LIMPO)        */}
      {/* ========================================================================= */}
      {isPdfModalOpen && currentSupplierInfo && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 flex flex-col max-h-[90vh] overflow-hidden">
            {/* Barra de controle do modal (oculta na impressão) */}
            <div className="p-3.5 bg-slate-900 text-white flex items-center justify-between gap-3 shrink-0 print:hidden">
              <div className="flex items-center gap-2">
                <Printer className="w-4 h-4 text-blue-400" />
                <span className="font-extrabold text-sm">Visualização do Pedido em PDF</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePrintPdf}
                  className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Imprimir / Salvar PDF</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsPdfModalOpen(false)}
                  className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                  aria-label="Fechar"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* FOLHA DO DOCUMENTO PDF (Exatamente o que o usuário pediu: apenas Produto e Quantidade Editada) */}
            <div
              id="printable-supplier-order"
              className="p-6 sm:p-8 overflow-y-auto flex-1 bg-white text-slate-900 font-sans space-y-6"
            >
              {/* Cabeçalho do Pedido */}
              <div className="border-b-2 border-slate-900 pb-4 flex items-start justify-between gap-4">
                <div>
                  <h1 className="text-xl font-black uppercase tracking-tight text-slate-900">
                    Pedido de Compra
                  </h1>
                  <p className="text-xs font-bold text-slate-600 mt-0.5">
                    Lista de materiais com cotação aprovada
                  </p>
                </div>

                <div className="text-right text-xs space-y-0.5 text-slate-600">
                  <div>
                    <span className="font-bold">Data:</span> {new Date().toLocaleDateString('pt-BR')}
                  </div>
                  <div>
                    <span className="font-bold">Hora:</span>{' '}
                    {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>

              {/* Dados do Fornecedor */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                <div>
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                    Fornecedor:
                  </span>
                  <span className="text-base font-extrabold text-slate-900">
                    {currentSupplierInfo.name}
                  </span>
                </div>

                {currentSupplierInfo.phone && (
                  <div className="sm:text-right">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                      Contato / Telefone:
                    </span>
                    <span className="font-bold text-slate-800">
                      {currentSupplierInfo.phone}
                    </span>
                  </div>
                )}
              </div>

              {/* TABELA DE PRODUTOS E QUANTIDADES EDITADAS */}
              <div>
                <table className="w-full border-collapse text-left">
                  <thead>
                    <tr className="border-b-2 border-slate-800 text-xs font-black uppercase tracking-wider text-slate-800">
                      <th className="py-2 px-2 w-12 text-center">Item</th>
                      <th className="py-2 px-3">Nome do Produto</th>
                      <th className="py-2 px-3 text-right w-36">Quantidade</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-xs font-medium">
                    {currentItems
                      .filter((item) => item.orderQuantity > 0)
                      .map((item, idx) => (
                        <tr key={item.product.id} className="hover:bg-slate-50">
                          <td className="py-2.5 px-2 text-center font-bold text-slate-500">
                            {idx + 1}
                          </td>
                          <td className="py-2.5 px-3 font-bold text-slate-900 text-sm">
                            {item.product.name}
                          </td>
                          <td className="py-2.5 px-3 text-right font-black text-slate-900 text-sm">
                            {item.orderQuantity} {item.product.unit || 'un'}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>

                {/* Totalizador */}
                <div className="border-t-2 border-slate-800 mt-4 pt-3 flex items-center justify-between text-xs font-bold text-slate-800">
                  <span>
                    Total de Itens a Faturar:
                  </span>
                  <span className="text-base font-black text-slate-900">
                    {currentItems.filter((i) => i.orderQuantity > 0).length} {currentItems.filter((i) => i.orderQuantity > 0).length === 1 ? 'item' : 'itens'}
                  </span>
                </div>
              </div>

              {/* Rodapé institucional com aviso para o fornecedor */}
              <div className="border-t border-dashed border-slate-300 pt-4 text-[11px] text-slate-500 text-center space-y-1">
                <p className="font-semibold text-slate-700">
                  Favor conferir os itens e confirmar o faturamento e previsão de entrega.
                </p>
                <p>
                  Documento emitido via Sistema de Cotações e Lista de Compras.
                </p>
              </div>
            </div>

            {/* Rodapé do Modal */}
            <div className="p-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2 shrink-0 print:hidden">
              <button
                type="button"
                onClick={() => setIsPdfModalOpen(false)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                Fechar
              </button>
              <button
                type="button"
                onClick={handlePrintPdf}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
              >
                <Printer className="w-4 h-4" />
                <span>Imprimir / Salvar PDF</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
