import React, { useState, useEffect, useMemo } from 'react';
import {
  subscribeToProducts,
  subscribeToUsers,
  initializeDefaultData,
  addProduct,
  updateProduct,
  deleteProduct,
  createUser,
  updateUser,
  deleteUser,
  DEFAULT_USERS,
} from './services/db';
import { Product, AppUser, ProductStatus, SortField, SortDirection, ProductUrgency, normalizeUrgency } from './types';
import { Header } from './components/Header';
import { ResponsibleFilter } from './components/ResponsibleFilter';
import { ProductCard } from './components/ProductCard';
import { AddEditProductModal } from './components/AddEditProductModal';
import { SheetsExportModal } from './components/SheetsExportModal';
import { AdminUsersModal } from './components/AdminUsersModal';
import { SearchAndFilters } from './components/SearchAndFilters';
import { PriorityFilter, UrgencyFilterType } from './components/PriorityFilter';
import { BottomNav } from './components/BottomNav';
import { ConfirmDialog } from './components/ConfirmDialog';
import { ToastContainer, ToastMessage } from './components/Toast';
import { ProductCatalogModal } from './components/ProductCatalogModal';
import { BarcodeScannerModal } from './components/BarcodeScannerModal';
import { ShoppingBag, Plus, RefreshCw, AlertCircle, CheckCheck, Package, CheckCircle2, ScanBarcode } from 'lucide-react';
import { normalizeSearchText } from './utils/text';

export default function App() {
  const [products, setProducts] = useState<Product[]>([]);
  const [users, setUsers] = useState<AppUser[]>(DEFAULT_USERS);
  const [loading, setLoading] = useState(true);

  // Active user in session (default to Eduardo or first employee)
  const [currentUser, setCurrentUser] = useState<AppUser>(() => {
    return DEFAULT_USERS[1] || DEFAULT_USERS[0];
  });

  // Filters and search
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedUrgency, setSelectedUrgency] = useState<UrgencyFilterType>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<ProductStatus | 'all'>('all');
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Barcode search on list state
  const [isListBarcodeScannerOpen, setIsListBarcodeScannerOpen] = useState(false);
  const [initialBarcodeForNew, setInitialBarcodeForNew] = useState<string>('');
  const [listBarcodeScanFeedback, setListBarcodeScanFeedback] = useState<{
    code: string;
    status: 'found_in_list' | 'found_in_db_bought' | 'not_found';
    product?: Product;
  } | null>(null);

  // Modals
  const [isAddEditOpen, setIsAddEditOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isSheetsOpen, setIsSheetsOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isCatalogOpen, setIsCatalogOpen] = useState(false);
  const [activeNavTab, setActiveNavTab] = useState<'list' | 'add' | 'sheets' | 'admin'>('list');

  // Multi-selection (Master Checkbox)
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);

  // Confirmation dialog
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  // Toasts
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (title: string, description?: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, title, description, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Initialize and subscribe to Firestore
  useEffect(() => {
    let unsubscribeProducts: () => void = () => {};
    let unsubscribeUsers: () => void = () => {};

    const startApp = async () => {
      try {
        await initializeDefaultData();

        unsubscribeUsers = subscribeToUsers((allUsers) => {
          setUsers(allUsers);
          // Keep current user updated or synced
          setCurrentUser((prev) => {
            const match = allUsers.find((u) => u.id === prev.id);
            return match || allUsers[0] || prev;
          });
        });

        unsubscribeProducts = subscribeToProducts((allProds) => {
          setProducts(allProds);
          setLoading(false);
        });
      } catch (err) {
        console.error('Initialization error:', err);
        setLoading(false);
      }
    };

    startApp();

    return () => {
      unsubscribeProducts();
      unsubscribeUsers();
    };
  }, []);

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    let result = [...products];

    // Exclusivamente produtos que estão na lista de compras ativa (não comprados)
    result = result.filter((p) => p.status !== 'comprado');

    // Filter by responsible
    if (selectedUserId) {
      result = result.filter((p) => p.responsibleId === selectedUserId);
    }

    // Filter by search (nome, marca ou responsável)
    if (searchTerm.trim()) {
      const term = normalizeSearchText(searchTerm);
      result = result.filter((p) => {
        const nameNorm = normalizeSearchText(p.name);
        const brandNorm = normalizeSearchText(p.brand || '');
        const barcodeNorm = p.barcode ? normalizeSearchText(p.barcode) : '';
        const respNorm = normalizeSearchText(p.responsibleName || '');
        return (
          nameNorm.includes(term) ||
          brandNorm.includes(term) ||
          barcodeNorm.includes(term) ||
          respNorm.includes(term)
        );
      });
    }

    // Filter by priority / urgency
    if (selectedUrgency !== 'all') {
      result = result.filter((p) => normalizeUrgency(p.urgency) === selectedUrgency);
    }

    // Sort
    result.sort((a, b) => {
      if (sortField === 'name') {
        const cmp = a.name.localeCompare(b.name, 'pt-BR');
        return sortDirection === 'asc' ? cmp : -cmp;
      }
      if (sortField === 'quantity') {
        return sortDirection === 'asc' ? a.quantity - b.quantity : b.quantity - a.quantity;
      }
      // date
      const timeA = new Date(a.createdAt).getTime();
      const timeB = new Date(b.createdAt).getTime();
      return sortDirection === 'asc' ? timeA - timeB : timeB - timeA;
    });

    return result;
  }, [products, selectedUserId, selectedUrgency, searchTerm, sortField, sortDirection]);

  // Contagem de itens por prioridade na lista ativa
  const urgencyCounts = useMemo(() => {
    const activeProducts = products.filter((p) => p.status !== 'comprado');
    const baseList = selectedUserId
      ? activeProducts.filter((p) => p.responsibleId === selectedUserId)
      : activeProducts;

    return {
      all: baseList.length,
      novo: baseList.filter((p) => normalizeUrgency(p.urgency) === 'novo').length,
      normal: baseList.filter((p) => normalizeUrgency(p.urgency) === 'normal').length,
      urgente: baseList.filter((p) => normalizeUrgency(p.urgency) === 'urgente').length,
    };
  }, [products, selectedUserId]);

  // Multi-selection (Master Checkbox) helpers
  const isAllSelected =
    filteredProducts.length > 0 &&
    filteredProducts.every((p) => selectedProductIds.includes(p.id));

  const isSomeSelected =
    filteredProducts.some((p) => selectedProductIds.includes(p.id)) && !isAllSelected;

  const handleToggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedProductIds([]);
    } else {
      setSelectedProductIds(filteredProducts.map((p) => p.id));
    }
  };

  const handleToggleSelectProduct = (product: Product) => {
    setSelectedProductIds((prev) =>
      prev.includes(product.id) ? prev.filter((id) => id !== product.id) : [...prev, product.id]
    );
  };

  const handleMarkSelectedAsBought = async () => {
    if (selectedProductIds.length === 0) return;
    const count = selectedProductIds.length;
    try {
      for (const id of selectedProductIds) {
        await updateProduct(id, {
          status: 'comprado',
        });
      }
      setSelectedProductIds([]);
      addToast(
        count === 1
          ? '1 item marcado como comprado e retirado da lista!'
          : `${count} itens marcados como comprados e retirados da lista!`
      );
    } catch (err: any) {
      addToast('Erro ao atualizar produtos', err?.message, 'error');
    }
  };

  const handleReincludeProduct = async (
    product: Product,
    quantity = 1,
    urgency: ProductUrgency = 'normal'
  ) => {
    try {
      await updateProduct(product.id, {
        status: quantity === 0 ? 'em_falta' : 'baixo_estoque',
        quantity,
        urgency,
      });
      addToast(`"${product.name}" reincluído na lista de compras!`);
    } catch (err: any) {
      addToast('Erro ao reincluir produto', err?.message, 'error');
    }
  };

  // Barcode detection on shopping list search
  const handleBarcodeDetectedInList = (code: string) => {
    const cleanCode = code.trim();
    if (!cleanCode) return;
    setSearchTerm(cleanCode);

    const cleanNorm = normalizeSearchText(cleanCode);
    const found = products.find(
      (p) =>
        (p.barcode && normalizeSearchText(p.barcode) === cleanNorm) ||
        normalizeSearchText(p.name).includes(cleanNorm)
    );

    if (found) {
      if (found.status !== 'comprado') {
        setListBarcodeScanFeedback({
          code: cleanCode,
          status: 'found_in_list',
          product: found,
        });
        addToast('Produto localizado na lista!', `"${found.name}" encontrado pelo código de barras.`);
      } else {
        setListBarcodeScanFeedback({
          code: cleanCode,
          status: 'found_in_db_bought',
          product: found,
        });
        addToast('Produto encontrado na base!', `"${found.name}" está no catálogo arquivado.`, 'info');
      }
    } else {
      setListBarcodeScanFeedback({
        code: cleanCode,
        status: 'not_found',
      });
      addToast('Código não cadastrado', `O código ${cleanCode} não foi encontrado na base de dados.`, 'info');
    }
  };

  const handleOpenAddWithBarcode = (barcode: string) => {
    setEditingProduct(null);
    setInitialBarcodeForNew(barcode);
    setIsAddEditOpen(true);
  };

  // Counts
  const outOfStockCount = useMemo(() => {
    return products.filter((p) => p.quantity === 0 || p.status === 'em_falta').length;
  }, [products]);

  const toBuyCount = useMemo(() => {
    return products.filter((p) => p.status !== 'comprado').length;
  }, [products]);

  // Handlers
  const handleSaveProduct = async (productData: Omit<Product, 'id'>, editId?: string) => {
    if (editId) {
      // Check permissions
      const prod = products.find((p) => p.id === editId);
      if (
        prod &&
        currentUser.role !== 'admin' &&
        prod.responsibleId !== currentUser.id &&
        prod.status !== 'comprado' &&
        editingProduct // only restrict if editing an existing active item directly
      ) {
        throw new Error('Você só pode editar produtos cadastrados por você mesmo.');
      }
      await updateProduct(editId, productData);
      addToast(
        prod?.status === 'comprado'
          ? `"${productData.name}" reincluído na lista de compras!`
          : 'Produto atualizado com sucesso!'
      );
    } else {
      await addProduct(productData);
      if (productData.status === 'comprado') {
        addToast(
          productData.barcode
            ? `"${productData.name}" cadastrado na base de dados com código ${productData.barcode}!`
            : `"${productData.name}" cadastrado na base de dados com sucesso!`
        );
      } else {
        addToast(
          productData.barcode
            ? `"${productData.name}" salvo na Lista de Compras e gravado na Base de Dados!`
            : `"${productData.name}" adicionado à lista e gravado na base!`
        );
      }
    }
  };

  const handleToggleProductStatus = async (product: Product) => {
    const nextStatus: ProductStatus = product.status === 'comprado' ? 'em_falta' : 'comprado';
    try {
      await updateProduct(product.id, {
        status: nextStatus,
        quantity: nextStatus === 'comprado' ? (product.quantity || 1) : 0,
      });
      setSelectedProductIds((prev) => prev.filter((id) => id !== product.id));
      addToast(
        nextStatus === 'comprado'
          ? `"${product.name}" marcado como comprado e retirado da lista!`
          : `"${product.name}" reincluído na lista de compras!`
      );
    } catch (err: any) {
      addToast('Erro ao atualizar status', err?.message, 'error');
    }
  };

  const handleDeleteProductRequest = (product: Product) => {
    if (currentUser.role !== 'admin') {
      addToast('Apenas administradores podem excluir produtos', 'Faça login na engrenagem no topo.', 'error');
      return;
    }

    setConfirmDialog({
      isOpen: true,
      title: 'Excluir Produto',
      message: `Tem certeza que deseja excluir "${product.name}" permanentemente da lista?`,
      onConfirm: async () => {
        try {
          await deleteProduct(product.id);
          addToast('Produto excluído com sucesso');
        } catch (err: any) {
          addToast('Erro ao excluir produto', err?.message, 'error');
        } finally {
          setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        }
      },
    });
  };

  const handleAdminLogin = async (username: string, pass: string): Promise<boolean> => {
    // Find admin user in database
    const adminUser = users.find(
      (u) => u.username.toLowerCase() === username.toLowerCase() && u.role === 'admin'
    );

    if (adminUser) {
      if (!adminUser.password || adminUser.password === pass) {
        setCurrentUser(adminUser);
        return true;
      }
    }
    // Fallback for default admin
    if (username.toLowerCase() === 'admin' && pass === '123') {
      const defaultAdmin = users.find((u) => u.role === 'admin') || DEFAULT_USERS[0];
      setCurrentUser(defaultAdmin);
      return true;
    }
    return false;
  };

  const handleLogoutAdmin = () => {
    // Revert to first active employee
    const employee = users.find((u) => u.role === 'employee' && u.active) || DEFAULT_USERS[1];
    setCurrentUser(employee);
  };

  const handleShareApp = async () => {
    const shareData = {
      title: 'Lista de Compras da Loja',
      text: `Confira a lista de compras e reposição da loja: ${toBuyCount} itens a repor.`,
      url: window.location.href,
    };
    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch {
        // Ignored or cancelled
      }
    } else {
      try {
        await navigator.clipboard.writeText(window.location.href);
        addToast('Link copiado!', 'O link do aplicativo foi copiado para a área de transferência.');
      } catch {
        addToast('Lista de compras', window.location.href, 'info');
      }
    }
  };

  return (
    <div
      id="app-root"
      className="min-h-screen bg-slate-300 flex items-center justify-center p-0 sm:p-4 lg:p-8 font-sans selection:bg-blue-500 selection:text-white"
    >
      {/* Toast notifications */}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />

      {/* Confirmation modal */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmLabel="Excluir"
        isDestructive={true}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog((prev) => ({ ...prev, isOpen: false }))}
      />

      {/* Main Container Wrapper: Device Frame + Desktop Sidebar */}
      <div className="w-full flex items-center justify-center">
        {/* Device Frame matching Professional Polish */}
        <div
          id="phone-device-container"
          className="w-full max-w-[430px] h-screen sm:h-[820px] max-h-screen sm:max-h-[92vh] bg-slate-200 sm:rounded-[40px] shadow-2xl sm:border-[10px] sm:border-slate-800 overflow-hidden flex flex-col relative shrink-0"
        >
          {/* Top Header */}
          <Header
            toBuyCount={toBuyCount}
            outOfStockCount={outOfStockCount}
            currentUser={currentUser}
            onOpenSheets={() => setIsSheetsOpen(true)}
            onOpenAdmin={() => setIsAdminOpen(true)}
            onOpenCatalog={() => setIsCatalogOpen(true)}
          />

          {/* Filtro de Busca na Lista de Compras com leitor de código de barras */}
          <SearchAndFilters
            searchTerm={searchTerm}
            onSearchChange={(val) => {
              setSearchTerm(val);
              if (listBarcodeScanFeedback) setListBarcodeScanFeedback(null);
            }}
            onOpenBarcodeScanner={() => setIsListBarcodeScannerOpen(true)}
            resultCount={filteredProducts.length}
            placeholder="Pesquisar produto, marca ou código de barras..."
          />

          {/* Banner de resultado da leitura de código de barras na lista */}
          {listBarcodeScanFeedback && (
            <div className="px-4 sm:px-5 py-2 bg-white border-b border-slate-100">
              {listBarcodeScanFeedback.status === 'found_in_list' && (
                <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-center justify-between gap-2 text-xs animate-in fade-in">
                  <div className="flex items-center gap-2 min-w-0">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <div className="min-w-0">
                      <p className="font-bold text-[11px] truncate">
                        Produto "{listBarcodeScanFeedback.product?.name}" localizado na lista!
                      </p>
                      <p className="text-[10px] text-emerald-700 truncate">
                        Código: {listBarcodeScanFeedback.code} • Quantidade: {listBarcodeScanFeedback.product?.quantity} {listBarcodeScanFeedback.product?.unit}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setListBarcodeScanFeedback(null)}
                    className="p-1 rounded-md text-emerald-700 hover:text-emerald-950 cursor-pointer"
                  >
                    ✕
                  </button>
                </div>
              )}

              {listBarcodeScanFeedback.status === 'found_in_db_bought' && (
                <div className="p-2.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 flex items-center justify-between gap-2 text-xs animate-in fade-in">
                  <div className="flex items-center gap-2 min-w-0">
                    <Package className="w-4 h-4 text-blue-600 shrink-0" />
                    <div className="min-w-0">
                      <p className="font-bold text-[11px] truncate">
                        Produto "{listBarcodeScanFeedback.product?.name}" encontrado na base de dados!
                      </p>
                      <p className="text-[10px] text-blue-700">
                        Este item está arquivado no catálogo. Deseja reincluir na lista?
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={async () => {
                        if (listBarcodeScanFeedback.product) {
                          await handleReincludeProduct(listBarcodeScanFeedback.product);
                          setListBarcodeScanFeedback(null);
                          setSearchTerm('');
                        }
                      }}
                      className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-bold transition-colors cursor-pointer"
                    >
                      Reincluir
                    </button>
                    <button
                      type="button"
                      onClick={() => setListBarcodeScanFeedback(null)}
                      className="p-1 rounded-md text-blue-700 hover:text-blue-950 cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              )}

              {listBarcodeScanFeedback.status === 'not_found' && (
                <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-950 flex items-center justify-between gap-2 text-xs animate-in fade-in">
                  <div className="flex items-center gap-2 min-w-0">
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                    <div className="min-w-0">
                      <p className="font-bold text-[11px] truncate">
                        Código {listBarcodeScanFeedback.code} não cadastrado na base.
                      </p>
                      <p className="text-[10px] text-amber-700">
                        Deseja cadastrar na lista e na base agora?
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        const code = listBarcodeScanFeedback.code;
                        setListBarcodeScanFeedback(null);
                        handleOpenAddWithBarcode(code);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-bold transition-colors cursor-pointer"
                    >
                      Cadastrar
                    </button>
                    <button
                      type="button"
                      onClick={() => setListBarcodeScanFeedback(null)}
                      className="p-1 rounded-md text-amber-700 hover:text-amber-950 cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Filtro por Prioridade */}
          <PriorityFilter
            selectedUrgency={selectedUrgency}
            onSelectUrgency={setSelectedUrgency}
            counts={urgencyCounts}
          />

          {/* Quem está adicionando? / Filtro horizontal por responsável */}
          <ResponsibleFilter
            users={users.filter((u) => u.active)}
            selectedUserId={selectedUserId}
            onSelectUser={setSelectedUserId}
            onQuickAddUser={() => setIsAdminOpen(true)}
            activeEmployeeId={currentUser.id}
            isAllSelected={isAllSelected}
            isSomeSelected={isSomeSelected}
            onToggleSelectAll={handleToggleSelectAll}
            selectedCount={selectedProductIds.length}
            onMarkSelectedAsBought={handleMarkSelectedAsBought}
            onClearSelection={() => setSelectedProductIds([])}
          />

          {/* Products List Area */}
          <main
            id="main-content"
            className="flex-1 overflow-y-auto px-5 py-3.5 space-y-3.5 no-scrollbar relative"
          >
            {loading ? (
              <div className="flex flex-col items-center justify-center py-24 text-slate-400 gap-3">
                <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
                <p className="text-xs font-medium">Sincronizando com Firebase...</p>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div
                id="empty-state"
                className="bg-white rounded-2xl p-6 text-center border border-slate-100 shadow-sm my-6"
              >
                <div className="w-14 h-14 rounded-full bg-blue-50 text-blue-600 mx-auto flex items-center justify-center mb-3">
                  <ShoppingBag className="w-7 h-7" />
                </div>
                <h3 className="text-base font-bold text-slate-800">
                  {searchTerm.trim() ? `"${searchTerm}" não está na lista` : 'Nenhum produto encontrado'}
                </h3>
                <p className="text-xs text-slate-500 max-w-xs mx-auto mt-1 mb-4">
                  {searchTerm.trim()
                    ? 'Este item não está na lista de compras atual ou já foi comprado.'
                    : selectedUserId || selectedUrgency !== 'all'
                    ? 'Nenhum item corresponde aos filtros selecionados.'
                    : 'Não há itens para comprar no momento.'}
                </p>
                {searchTerm.trim() ? (
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => setSearchTerm('')}
                      className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700 transition-colors cursor-pointer"
                    >
                      Limpar busca
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsCatalogOpen(true)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs font-bold transition-colors cursor-pointer border border-blue-200/80"
                    >
                      <Package className="w-4 h-4" />
                      <span>Ver na Base de Produtos</span>
                    </button>
                  </div>
                ) : selectedUserId || selectedUrgency !== 'all' ? (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedUserId(null);
                      setSelectedUrgency('all');
                    }}
                    className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-medium text-slate-700 transition-colors cursor-pointer"
                  >
                    Limpar Filtros
                  </button>
                ) : (
                  <div className="flex items-center justify-center gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={() => setIsCatalogOpen(true)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs font-bold transition-colors cursor-pointer border border-blue-200/80"
                      title="Ver todos os produtos e reincluir na lista"
                    >
                      <Package className="w-4 h-4" />
                      <span>Base de Produtos</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingProduct(null);
                        setIsAddEditOpen(true);
                      }}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-xs font-bold text-white shadow-xs transition-colors cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Cadastrar Novo</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-2.5 pb-2">
                {/* Ações em lote caso haja itens selecionados */}
                {selectedProductIds.length > 0 && (
                  <div
                    id="selection-batch-actions"
                    className="bg-emerald-50/90 border border-emerald-200/80 px-3.5 py-2 rounded-2xl flex items-center justify-between gap-2 text-xs shadow-2xs animate-in fade-in duration-200"
                  >
                    <span className="font-semibold text-emerald-900">
                      {selectedProductIds.length} {selectedProductIds.length === 1 ? 'item selecionado' : 'itens selecionados'}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        id="btn-batch-mark-bought"
                        type="button"
                        onClick={handleMarkSelectedAsBought}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-all cursor-pointer"
                        title="Marcar selecionados como comprados e arquivar da lista"
                      >
                        <CheckCheck className="w-3.5 h-3.5" />
                        <span>Comprado ({selectedProductIds.length})</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setSelectedProductIds([])}
                        className="px-1.5 py-1 text-slate-400 hover:text-slate-600 text-xs font-medium cursor-pointer"
                        title="Desmarcar todos"
                      >
                        Limpar
                      </button>
                    </div>
                  </div>
                )}

                {/* Products List */}
                <div id="products-list" className="space-y-3">
                  {filteredProducts.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      currentUser={currentUser}
                      isSelected={selectedProductIds.includes(product.id)}
                      onToggleSelect={handleToggleSelectProduct}
                      onEdit={(p) => {
                        setEditingProduct(p);
                        setIsAddEditOpen(true);
                      }}
                      onDelete={handleDeleteProductRequest}
                      onToggleStatus={handleToggleProductStatus}
                    />
                  ))}
                </div>
              </div>
            )}
          </main>

          {/* Floating Action Button (FAB) */}
          <div className="absolute bottom-20 right-5 z-20">
            <button
              id="btn-fab-add-product"
              type="button"
              onClick={() => {
                setEditingProduct(null);
                setIsAddEditOpen(true);
              }}
              className="w-13 h-13 bg-blue-600 hover:bg-blue-700 active:scale-95 rounded-full shadow-lg flex items-center justify-center text-white transition-all cursor-pointer"
              title="Adicionar Novo Produto"
              aria-label="Adicionar Novo Produto"
            >
              <Plus className="w-7 h-7" />
            </button>
          </div>

          {/* Bottom Navigation Bar */}
          <BottomNav
            activeTab={activeNavTab}
            onChangeTab={(tab) => {
              setActiveNavTab(tab);
              if (tab === 'list') {
                setSelectedUserId(null);
                setStatusFilter('all');
              } else if (tab === 'add') {
                setEditingProduct(null);
                setIsAddEditOpen(true);
              } else if (tab === 'sheets') {
                setIsSheetsOpen(true);
              } else if (tab === 'admin') {
                setIsAdminOpen(true);
              }
            }}
            currentUser={currentUser}
            totalProducts={toBuyCount}
          />
        </div>

        {/* Desktop Side Panel matching Professional Polish Design */}
        <div className="ml-8 w-[320px] hidden lg:block shrink-0">
          <div className="bg-white/60 backdrop-blur-md rounded-3xl p-6 border border-white/30 shadow-xl space-y-4">
            <h2 className="text-slate-800 font-bold text-lg mb-3">Status Administrativo</h2>

            <div className="space-y-4">
              {/* Usuário logado */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Usuário Logado</span>
                <span className="text-xs font-bold bg-green-100 text-green-700 px-2 py-1 rounded">
                  {currentUser.name}
                </span>
              </div>

              {/* Status do usuário */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Privilégio</span>
                <span className="text-xs font-semibold text-slate-700 capitalize">
                  {currentUser.role === 'admin' ? 'Administrador' : 'Funcionário'}
                </span>
              </div>

              {/* Card de Integração Google Sheets */}
              <div className="p-4 bg-white rounded-xl shadow-sm border border-slate-100">
                <p className="text-[10px] text-slate-400 uppercase font-bold mb-1 tracking-tight">
                  Integração
                </p>
                <p className="text-xs text-slate-800 mb-3 font-medium">
                  Sincronizado com Google Sheets
                </p>
                <button
                  type="button"
                  onClick={() => setIsSheetsOpen(true)}
                  className="w-full py-2 bg-slate-800 text-white text-xs rounded-lg font-medium hover:bg-slate-700 transition-colors cursor-pointer"
                >
                  Abrir Planilha
                </button>
              </div>

              {/* Backup Firebase */}
              <div className="pt-3 border-t border-slate-200">
                <p className="text-[10px] text-slate-400 font-bold uppercase mb-2">Backup Firebase</p>
                <div className="flex items-center gap-2 text-xs text-slate-600">
                  <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
                  <span>Persistência Ativa (Nuvem ON)</span>
                </div>
              </div>

              {/* Atalho de Administração */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setIsAdminOpen(true)}
                  className="w-full py-2 text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer text-center"
                >
                  {currentUser.role === 'admin'
                    ? 'Gerenciar Usuários & Cadastros'
                    : 'Acessar Área do Administrador'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add / Edit Product Modal */}
      <AddEditProductModal
        isOpen={isAddEditOpen}
        productToEdit={editingProduct}
        users={users}
        currentUser={currentUser}
        allProducts={products}
        initialBarcode={initialBarcodeForNew}
        onClose={() => {
          setIsAddEditOpen(false);
          setEditingProduct(null);
          setInitialBarcodeForNew('');
          setActiveNavTab('list');
        }}
        onSave={handleSaveProduct}
        onOpenUserManager={() => setIsAdminOpen(true)}
      />

      {/* Google Sheets Export & Supplier Modal */}
      <SheetsExportModal
        isOpen={isSheetsOpen}
        products={products}
        onClose={() => {
          setIsSheetsOpen(false);
          setActiveNavTab('list');
        }}
        onToast={addToast}
      />

      {/* Admin and User Management Modal */}
      <AdminUsersModal
        isOpen={isAdminOpen}
        currentUser={currentUser}
        users={users}
        onClose={() => {
          setIsAdminOpen(false);
          setActiveNavTab('list');
        }}
        onLoginAsAdmin={handleAdminLogin}
        onSwitchUser={setCurrentUser}
        onLogoutAdmin={handleLogoutAdmin}
        onAddUser={createUser}
        onUpdateUser={updateUser}
        onDeleteUser={deleteUser}
        onToast={addToast}
      />

      {/* Catalog of All Products Modal (Base de Produtos) */}
      <ProductCatalogModal
        isOpen={isCatalogOpen}
        onClose={() => setIsCatalogOpen(false)}
        products={products}
        currentUser={currentUser}
        onReincludeToShoppingList={handleReincludeProduct}
        onEditProduct={(p) => {
          setEditingProduct(p);
          setIsAddEditOpen(true);
        }}
        onDeleteProduct={handleDeleteProductRequest}
        onAddNewProduct={() => {
          setEditingProduct(null);
          setInitialBarcodeForNew('');
          setIsAddEditOpen(true);
        }}
        onAddNewProductWithBarcode={handleOpenAddWithBarcode}
      />

      {/* Leitor de código de barras para busca na lista de compras */}
      <BarcodeScannerModal
        isOpen={isListBarcodeScannerOpen}
        onClose={() => setIsListBarcodeScannerOpen(false)}
        onDetected={handleBarcodeDetectedInList}
      />
    </div>
  );
}
