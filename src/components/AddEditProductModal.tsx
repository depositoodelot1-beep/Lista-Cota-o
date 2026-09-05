import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  X,
  Check,
  UserPlus,
  Plus,
  Minus,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Package,
  CheckCircle2,
  Search,
  ScanBarcode,
  Barcode,
  Database,
  ListPlus,
  Sparkles,
} from 'lucide-react';
import { Product, AppUser } from '../types';
import { capitalizeWords, normalizeSearchText } from '../utils/text';
import { BarcodeScannerModal } from './BarcodeScannerModal';

interface AddEditProductModalProps {
  isOpen: boolean;
  productToEdit?: Product | null;
  users: AppUser[];
  currentUser: AppUser;
  onClose: () => void;
  onSave: (data: Omit<Product, 'id'>, editId?: string) => Promise<void>;
  onOpenUserManager?: () => void;
  allProducts?: Product[];
  initialBarcode?: string;
}

export const AddEditProductModal: React.FC<AddEditProductModalProps> = ({
  isOpen,
  productToEdit,
  users,
  currentUser,
  onClose,
  onSave,
  onOpenUserManager,
  allProducts = [],
  initialBarcode,
}) => {
  const [name, setName] = useState('');
  const [brand, setBrand] = useState('');
  const [quantity, setQuantity] = useState<number | string>(1);
  const [unit, setUnit] = useState('unidade');
  const [responsibleId, setResponsibleId] = useState(currentUser.id);
  const [urgency, setUrgency] = useState<'baixa' | 'media' | 'alta' | 'urgente'>('media');
  const [notes, setNotes] = useState('');
  const [barcode, setBarcode] = useState('');
  const [saveDestination, setSaveDestination] = useState<'both' | 'database_only'>('both');
  const [showMoreDetails, setShowMoreDetails] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Barcode scanner state
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [barcodeScanNotification, setBarcodeScanNotification] = useState<{
    type: 'found' | 'new';
    code: string;
    productName?: string;
  } | null>(null);

  // Suggestions state
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedDatabaseProduct, setSelectedDatabaseProduct] = useState<Product | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Sync state when editing product opens
  useEffect(() => {
    if (productToEdit) {
      setName(productToEdit.name);
      setBrand(productToEdit.brand || '');
      setQuantity(productToEdit.quantity ?? 1);
      setUnit(productToEdit.unit || 'unidade');
      setResponsibleId(productToEdit.responsibleId || currentUser.id);
      setUrgency(productToEdit.urgency || 'media');
      setBarcode(productToEdit.barcode || '');
      setNotes(productToEdit.notes || '');
      setSelectedDatabaseProduct(productToEdit);
      setSaveDestination('both');
      if (productToEdit.brand || productToEdit.notes || productToEdit.barcode) {
        setShowMoreDetails(true);
      }
    } else {
      setName('');
      setBrand('');
      setQuantity(1);
      setUnit('unidade');
      setResponsibleId(currentUser.id);
      setUrgency('media'); // 'Normal' selected by default like in screenshot
      setBarcode(initialBarcode || '');
      setNotes('');
      setSaveDestination('both');
      setShowMoreDetails(Boolean(initialBarcode));
      setSelectedDatabaseProduct(null);
      if (initialBarcode) {
        setBarcodeScanNotification({
          type: 'new',
          code: initialBarcode,
        });
      } else {
        setBarcodeScanNotification(null);
      }
    }
    setIsDropdownOpen(false);
    setError(null);
  }, [productToEdit, currentUser, isOpen, initialBarcode]);

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Filter products from database based on typed text
  const matchingProducts = useMemo(() => {
    if (!name.trim() || !allProducts || allProducts.length === 0) return [];
    const term = normalizeSearchText(name);
    if (term.length < 1) return [];

    const matches = allProducts.filter((p) => {
      // Don't suggest the exact same product currently being edited
      if (productToEdit && p.id === productToEdit.id) return false;
      const nameNorm = normalizeSearchText(p.name);
      const brandNorm = normalizeSearchText(p.brand || '');
      const barcodeNorm = p.barcode ? normalizeSearchText(p.barcode) : '';
      return nameNorm.includes(term) || brandNorm.includes(term) || barcodeNorm.includes(term);
    });

    // Sort: items that start with term first, then alphabetical
    matches.sort((a, b) => {
      const aStarts = normalizeSearchText(a.name).startsWith(term);
      const bStarts = normalizeSearchText(b.name).startsWith(term);
      if (aStarts && !bStarts) return -1;
      if (!aStarts && bStarts) return 1;
      return a.name.localeCompare(b.name, 'pt-BR');
    });

    return matches.slice(0, 6);
  }, [name, allProducts, productToEdit]);

  // Handle selecting a product from the database suggestions
  const handleSelectProduct = (prod: Product) => {
    setName(prod.name);
    if (prod.brand) setBrand(prod.brand);
    if (prod.unit) setUnit(prod.unit);
    if (prod.quantity !== undefined && Number(prod.quantity) > 0) {
      setQuantity(prod.quantity);
    } else {
      setQuantity(1);
    }
    if (prod.urgency) setUrgency(prod.urgency);
    if (prod.barcode) setBarcode(prod.barcode);
    if (prod.notes) setNotes(prod.notes);
    if (prod.brand || prod.notes || prod.barcode) {
      setShowMoreDetails(true);
    }
    setSelectedDatabaseProduct(prod);
    setIsDropdownOpen(false);
    setError(null);
  };

  const handleBarcodeDetected = (code: string) => {
    const cleanCode = code.trim();
    if (!cleanCode) return;

    setBarcode(cleanCode);

    // Search in allProducts by barcode or notes
    const foundByBarcode = allProducts.find(
      (p) =>
        (p.barcode && p.barcode.trim().toLowerCase() === cleanCode.toLowerCase()) ||
        (p.notes && p.notes.includes(cleanCode))
    );

    if (foundByBarcode) {
      handleSelectProduct(foundByBarcode);
      setBarcodeScanNotification({
        type: 'found',
        code: cleanCode,
        productName: foundByBarcode.name,
      });
    } else {
      const foundByName = allProducts.find(
        (p) => normalizeSearchText(p.name).includes(normalizeSearchText(cleanCode))
      );
      if (foundByName) {
        handleSelectProduct(foundByName);
        setBarcodeScanNotification({
          type: 'found',
          code: cleanCode,
          productName: foundByName.name,
        });
      } else {
        setSelectedDatabaseProduct(null);
        setSaveDestination('both');
        setBarcodeScanNotification({
          type: 'new',
          code: cleanCode,
        });
        setShowMoreDetails(true);
      }
    }
  };

  if (!isOpen) return null;

  const selectedResponsible = users.find((u) => u.id === responsibleId) || currentUser;

  const handleIncrement = () => {
    setQuantity((prev) => {
      const current = prev === '' ? 0 : Number(prev);
      return current + 1;
    });
  };

  const handleDecrement = () => {
    setQuantity((prev) => {
      const current = prev === '' ? 0 : Number(prev);
      return current > 0 ? current - 1 : 0;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Por favor, informe o nome do produto.');
      return;
    }

    const qtyNum = quantity === '' ? 1 : Number(quantity);
    if (isNaN(qtyNum) || qtyNum < 0) {
      setError('A quantidade deve ser um número válido (zero ou positivo).');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const isDatabaseOnly = !productToEdit && !selectedDatabaseProduct && saveDestination === 'database_only';

      const productData: Omit<Product, 'id'> = {
        name: name.trim(),
        quantity: isDatabaseOnly ? (qtyNum > 0 ? qtyNum : 1) : qtyNum,
        unit: unit || 'unidade',
        responsibleId: selectedResponsible.id,
        responsibleName: selectedResponsible.name,
        responsibleInitial: selectedResponsible.avatarInitial || selectedResponsible.name[0].toUpperCase(),
        responsibleColor: selectedResponsible.avatarColor || '#3b82f6',
        status: isDatabaseOnly ? 'comprado' : qtyNum === 0 ? 'em_falta' : 'baixo_estoque',
        urgency,
        createdAt: productToEdit ? productToEdit.createdAt : new Date().toISOString(),
      };

      if (brand.trim()) {
        productData.brand = brand.trim();
      }
      if (barcode.trim()) {
        productData.barcode = barcode.trim();
      }
      if (notes.trim()) {
        productData.notes = notes.trim();
      }

      await onSave(
        productData,
        productToEdit
          ? productToEdit.id
          : selectedDatabaseProduct
          ? selectedDatabaseProduct.id
          : undefined
      );
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Erro ao salvar o produto.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      id="product-form-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto"
    >
      <div
        id="product-form-card"
        className="w-full max-w-[400px] bg-white rounded-[32px] shadow-2xl border border-slate-100 p-6 my-auto animate-in zoom-in-95 duration-150 relative"
      >
        {/* Modal Header matching Screenshot */}
        <div className="flex items-start justify-between pb-3">
          <div>
            <h2 id="modal-product-title" className="text-xl font-extrabold text-slate-900 tracking-tight">
              {productToEdit ? 'Editar Produto' : 'Novo Produto'}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Preencha os dados do item para a lista
            </p>
          </div>
          <button
            id="btn-close-product-modal"
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Fechar modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div
            id="product-form-error"
            className="mt-2 p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2"
          >
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Form Body matching Screenshot */}
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          {/* 1. QUEM ESTÁ ADICIONANDO */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                1. QUEM ESTÁ ADICIONANDO
              </span>
              {onOpenUserManager && (
                <button
                  type="button"
                  onClick={onOpenUserManager}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:text-blue-700 cursor-pointer"
                >
                  <UserPlus className="w-3 h-3" />
                  <span>+ Novo Usuário</span>
                </button>
              )}
            </div>

            {/* Avatars Row matching Screenshot */}
            <div className="flex items-center gap-2.5 overflow-x-auto pb-1 no-scrollbar">
              {users
                .filter((u) => u.active)
                .map((u) => {
                  const isSelected = u.id === responsibleId;
                  const initial = u.avatarInitial || u.name.charAt(0).toUpperCase();
                  const color = u.avatarColor || '#3b82f6';

                  return (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => setResponsibleId(u.id)}
                      className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm transition-all shrink-0 cursor-pointer ${
                        isSelected
                          ? 'bg-blue-600 text-white shadow-sm scale-105'
                          : 'hover:scale-105 active:scale-95'
                      }`}
                      style={{
                        borderWidth: isSelected ? '0px' : '1.5px',
                        borderColor: isSelected ? 'transparent' : color,
                        color: isSelected ? '#ffffff' : color,
                        backgroundColor: isSelected ? '#2563eb' : `${color}15`,
                      }}
                      title={u.name}
                      aria-label={`Selecionar ${u.name}`}
                    >
                      {initial}
                    </button>
                  );
                })}

              {/* Add User Circle (+) */}
              <button
                type="button"
                onClick={() => {
                  if (onOpenUserManager) onOpenUserManager();
                }}
                className="w-9 h-9 rounded-full border border-dashed border-slate-300 hover:border-blue-500 text-slate-400 hover:text-blue-600 flex items-center justify-center transition-all shrink-0 cursor-pointer bg-white"
                title="Adicionar novo usuário"
                aria-label="Adicionar usuário"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* 2. NOME DO PRODUTO com busca em tempo real na base de dados e Leitor de Código de Barras */}
          <div className="relative" ref={dropdownRef}>
            <div className="flex items-center justify-between mb-1.5 gap-2">
              <label
                htmlFor="input-modal-product-name"
                className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider truncate"
              >
                2. NOME DO PRODUTO
              </label>

              <div className="flex items-center gap-1.5 shrink-0">
                {matchingProducts.length > 0 && !selectedDatabaseProduct && (
                  <span className="text-[10px] text-blue-600 font-semibold mr-0.5">
                    {matchingProducts.length} na base
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => setIsScannerOpen(true)}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-blue-50 hover:bg-blue-100 active:scale-95 text-blue-700 text-xs font-bold border border-blue-200/80 transition-all cursor-pointer shadow-2xs"
                  title="Abrir leitor de código de barras pela câmera ou leitor USB"
                >
                  <ScanBarcode className="w-3.5 h-3.5 text-blue-600" />
                  <span>Código de Barras</span>
                </button>
              </div>
            </div>

            <div className="relative">
              <input
                id="input-modal-product-name"
                type="text"
                value={name}
                onChange={(e) => {
                  const val = capitalizeWords(e.target.value);
                  setName(val);
                  setIsDropdownOpen(true);
                  if (
                    selectedDatabaseProduct &&
                    normalizeSearchText(selectedDatabaseProduct.name) !== normalizeSearchText(val)
                  ) {
                    setSelectedDatabaseProduct(null);
                  }
                }}
                onFocus={() => {
                  if (name.trim().length > 0) {
                    setIsDropdownOpen(true);
                  }
                }}
                placeholder="Nome do produto ou código de barras"
                autoCapitalize="words"
                autoComplete="off"
                required
                autoFocus
                className="w-full pl-4 pr-16 py-3 bg-white border border-blue-200/90 rounded-2xl text-sm text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all shadow-2xs"
              />

              <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setIsScannerOpen(true)}
                  className="p-1 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                  title="Escanear com a câmera"
                  aria-label="Abrir leitor de código de barras"
                >
                  <Barcode className="w-4 h-4" />
                </button>
                {selectedDatabaseProduct ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                ) : (
                  <Search className="w-4 h-4 text-slate-400" />
                )}
              </div>
            </div>

            {/* Feedback do leitor de código de barras */}
            {barcodeScanNotification && (
              <div
                className={`mt-2.5 p-3 rounded-2xl border text-xs animate-in fade-in duration-150 ${
                  barcodeScanNotification.type === 'found'
                    ? 'bg-emerald-50/90 border-emerald-200 text-emerald-900'
                    : 'bg-blue-50/90 border-blue-200 text-blue-950'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2 min-w-0">
                    {barcodeScanNotification.type === 'found' ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    ) : (
                      <ScanBarcode className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                    )}
                    <div className="min-w-0">
                      <p className="font-bold text-[11px] truncate">
                        {barcodeScanNotification.type === 'found'
                          ? `Produto encontrado pelo código ${barcodeScanNotification.code}!`
                          : `Código ${barcodeScanNotification.code} lido com sucesso!`}
                      </p>
                      <p
                        className={`text-[10px] mt-0.5 ${
                          barcodeScanNotification.type === 'found'
                            ? 'text-emerald-700'
                            : 'text-blue-700'
                        }`}
                      >
                        {barcodeScanNotification.type === 'found'
                          ? `"${barcodeScanNotification.productName}" foi selecionado da base.`
                          : 'Produto novo (não cadastrado). Você pode salvá-lo na Lista e na Base de Dados:'}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setBarcodeScanNotification(null)}
                    className="text-[10px] font-bold shrink-0 px-1.5 py-0.5 rounded-md opacity-70 hover:opacity-100 transition-opacity cursor-pointer"
                  >
                    ✕
                  </button>
                </div>

                {barcodeScanNotification.type === 'new' && (
                  <div className="mt-2.5 pt-2 border-t border-blue-200/70 grid grid-cols-2 gap-1.5">
                    <button
                      type="button"
                      onClick={() => setSaveDestination('both')}
                      className={`p-1.5 rounded-xl border text-left transition-all cursor-pointer ${
                        saveDestination === 'both'
                          ? 'bg-white border-blue-600 ring-1 ring-blue-500 shadow-2xs'
                          : 'bg-white/60 border-blue-200/60 hover:bg-white text-slate-600'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-slate-800 flex items-center gap-1">
                          <ListPlus className="w-3 h-3 text-blue-600" />
                          <span>Lista e Base</span>
                        </span>
                        {saveDestination === 'both' && <Check className="w-3 h-3 text-blue-600 stroke-[3]" />}
                      </div>
                      <p className="text-[9px] text-slate-500 mt-0.5 leading-tight">
                        Adiciona à lista e grava na base de dados
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSaveDestination('database_only')}
                      className={`p-1.5 rounded-xl border text-left transition-all cursor-pointer ${
                        saveDestination === 'database_only'
                          ? 'bg-white border-blue-600 ring-1 ring-blue-500 shadow-2xs'
                          : 'bg-white/60 border-blue-200/60 hover:bg-white text-slate-600'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-slate-800 flex items-center gap-1">
                          <Database className="w-3 h-3 text-emerald-600" />
                          <span>Só na Base</span>
                        </span>
                        {saveDestination === 'database_only' && <Check className="w-3 h-3 text-blue-600 stroke-[3]" />}
                      </div>
                      <p className="text-[9px] text-slate-500 mt-0.5 leading-tight">
                        Grava no catálogo sem entrar na lista agora
                      </p>
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Dropdown de sugestões da base de dados */}
            {isDropdownOpen && matchingProducts.length > 0 && (
              <div
                id="database-product-dropdown"
                className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-white rounded-2xl shadow-xl border border-blue-100 overflow-hidden divide-y divide-slate-100 animate-in fade-in zoom-in-95 duration-150"
              >
                <div className="px-3.5 py-1.5 bg-blue-50/70 flex items-center justify-between text-[11px] font-semibold text-blue-900 border-b border-blue-100">
                  <span className="flex items-center gap-1.5">
                    <Package className="w-3.5 h-3.5 text-blue-600" />
                    <span>Cadastrado na base ({matchingProducts.length})</span>
                  </span>
                  <span className="text-[10px] text-blue-600/80 font-normal">
                    Clique para selecionar
                  </span>
                </div>

                <div className="max-h-52 overflow-y-auto divide-y divide-slate-100">
                  {matchingProducts.map((prod) => {
                    const isAlreadyInList = prod.status !== 'comprado';
                    const isSelectedThis = selectedDatabaseProduct?.id === prod.id;

                    return (
                      <button
                        key={prod.id}
                        type="button"
                        onClick={() => handleSelectProduct(prod)}
                        className={`w-full px-3.5 py-2.5 flex items-center justify-between gap-3 text-left transition-colors cursor-pointer group ${
                          isSelectedThis
                            ? 'bg-blue-50/90 text-blue-900'
                            : 'hover:bg-blue-50/50 active:bg-blue-100/60'
                        }`}
                      >
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-bold text-slate-800 group-hover:text-blue-600 truncate flex items-center gap-1.5">
                            <span>{prod.name}</span>
                            {prod.brand && (
                              <span className="text-[10px] font-medium text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                                {prod.brand}
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-2">
                            <span>Unidade: {prod.unit || 'unidade'}</span>
                            <span>•</span>
                            <span className="capitalize">
                              Prioridade: {prod.urgency === 'urgente' ? 'Urgente' : prod.urgency === 'alta' ? 'Alta' : prod.urgency === 'baixa' ? 'Baixa' : 'Normal'}
                            </span>
                          </div>
                        </div>

                        <div className="shrink-0">
                          {isAlreadyInList ? (
                            <span className="inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                              Na lista
                            </span>
                          ) : (
                            <span className="inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                              Na base
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Feedback visual quando o produto foi selecionado da base */}
            {selectedDatabaseProduct && (
              <div className="mt-2 p-2.5 rounded-xl bg-blue-50/90 border border-blue-200/80 flex items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2 text-blue-900 min-w-0">
                  <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                  <div className="min-w-0">
                    <p className="font-medium text-[11px] truncate">
                      Item selecionado da base de dados:{' '}
                      <strong className="font-bold text-blue-700">{selectedDatabaseProduct.name}</strong>
                      {selectedDatabaseProduct.brand ? ` (${selectedDatabaseProduct.brand})` : ''}
                    </p>
                    <p className="text-[10px] text-blue-600/90 mt-0.5">
                      {selectedDatabaseProduct.status === 'comprado'
                        ? 'Item cadastrado anteriormente. Ao salvar, ele será reincluído na lista!'
                        : 'Este item já está na lista. Ao salvar, você atualizará os dados dele.'}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedDatabaseProduct(null)}
                  className="text-[11px] font-bold text-blue-600 hover:text-blue-800 shrink-0 px-2 py-1 rounded-md hover:bg-blue-100/80 transition-colors cursor-pointer"
                  title="Desvincular produto da base"
                >
                  Limpar
                </button>
              </div>
            )}
          </div>

          {/* 3. QUANTIDADE */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                3. QUANTIDADE
              </span>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="text-[10px] text-slate-500 font-medium bg-transparent border-none focus:outline-hidden cursor-pointer"
                title="Alterar unidade"
              >
                <option value="unidade">unidade(s)</option>
                <option value="caixa">caixa(s)</option>
                <option value="pacote">pacote(s)</option>
                <option value="kg">kg</option>
                <option value="litro">litro(s)</option>
                <option value="metro">metro(s)</option>
                <option value="par">par(es)</option>
              </select>
            </div>

            {/* Stepper Card matching Screenshot with Typable Number */}
            <div className="flex items-center justify-between p-3 bg-slate-50/80 rounded-2xl border border-slate-100">
              {/* Minus Button */}
              <button
                type="button"
                onClick={handleDecrement}
                disabled={quantity === '' || Number(quantity) <= 0}
                className="w-11 h-11 flex items-center justify-center text-slate-400 hover:text-slate-700 disabled:opacity-30 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer text-xl font-medium"
                aria-label="Diminuir quantidade"
              >
                <Minus className="w-5 h-5" />
              </button>

              {/* Number (editable input) and Unit in Center */}
              <div className="flex flex-col items-center justify-center">
                <input
                  id="input-product-quantity"
                  type="number"
                  min="0"
                  step="1"
                  value={quantity}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === '') {
                      setQuantity('');
                    } else {
                      const parsed = parseInt(val, 10);
                      if (!isNaN(parsed) && parsed >= 0) {
                        setQuantity(parsed);
                      }
                    }
                  }}
                  onFocus={(e) => e.target.select()}
                  onBlur={() => {
                    if (quantity === '' || Number(quantity) < 0) {
                      setQuantity(1);
                    }
                  }}
                  className="w-24 text-center text-3xl font-extrabold text-blue-600 leading-none bg-transparent hover:bg-blue-50/50 focus:bg-blue-50/80 focus:outline-hidden rounded-xl transition-all py-1 px-1 cursor-text select-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  aria-label="Quantidade do produto"
                  title="Clique para digitar o número diretamente"
                />
                <span className="text-[10px] text-slate-400 font-medium">
                  {unit}
                </span>
              </div>

              {/* Big Blue Plus Button */}
              <button
                type="button"
                onClick={handleIncrement}
                className="w-11 h-11 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-full flex items-center justify-center shadow-md shadow-blue-500/25 transition-all cursor-pointer text-lg font-bold"
                aria-label="Aumentar quantidade"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* 4. PRIORIDADE */}
          <div>
            <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              4. PRIORIDADE
            </span>

            {/* Priority Tabs with specific colors per user request */}
            <div className="grid grid-cols-4 gap-1 p-1 bg-slate-100/80 rounded-2xl">
              <button
                type="button"
                onClick={() => setUrgency('baixa')}
                className={`py-2 text-xs font-medium rounded-xl transition-all cursor-pointer ${
                  urgency === 'baixa'
                    ? 'bg-blue-600 text-white font-bold shadow-xs'
                    : 'text-slate-600 hover:text-blue-600 hover:bg-slate-200/60'
                }`}
              >
                Baixa
              </button>
              <button
                type="button"
                onClick={() => setUrgency('media')}
                className={`py-2 text-xs font-medium rounded-xl transition-all cursor-pointer ${
                  urgency === 'media'
                    ? 'bg-emerald-600 text-white font-bold shadow-xs'
                    : 'text-slate-600 hover:text-emerald-600 hover:bg-slate-200/60'
                }`}
              >
                Normal
              </button>
              <button
                type="button"
                onClick={() => setUrgency('alta')}
                className={`py-2 text-xs font-medium rounded-xl transition-all cursor-pointer ${
                  urgency === 'alta'
                    ? 'bg-amber-500 text-white font-bold shadow-xs'
                    : 'text-slate-600 hover:text-amber-600 hover:bg-slate-200/60'
                }`}
              >
                Alta
              </button>
              <button
                type="button"
                onClick={() => setUrgency('urgente')}
                className={`py-2 text-xs font-medium rounded-xl transition-all cursor-pointer ${
                  urgency === 'urgente'
                    ? 'bg-red-600 text-white font-bold shadow-xs'
                    : 'text-slate-600 hover:text-red-600 hover:bg-slate-200/60'
                }`}
              >
                Urgente
              </button>
            </div>
          </div>

          {/* Opcional: Detalhes extras (Marca, Observações) recolhível para manter o visual limpo */}
          <div className="pt-1">
            <button
              type="button"
              onClick={() => setShowMoreDetails(!showMoreDetails)}
              className="text-[11px] font-semibold text-slate-400 hover:text-slate-600 flex items-center gap-1 cursor-pointer transition-colors mx-auto py-0.5"
            >
              <span>{showMoreDetails ? 'Menos opções' : '+ Mais opções (Marca, Observação)'}</span>
              {showMoreDetails ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>

            {showMoreDetails && (
              <div className="space-y-2.5 mt-2 pt-2 border-t border-slate-100 animate-in fade-in duration-150">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label
                      htmlFor="input-modal-barcode"
                      className="block text-[10px] font-bold text-slate-500 uppercase"
                    >
                      Código de Barras (EAN / UPC)
                    </label>
                    <button
                      type="button"
                      onClick={() => setIsScannerOpen(true)}
                      className="text-[10px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
                    >
                      <ScanBarcode className="w-3 h-3" />
                      <span>Escanear câmera</span>
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      id="input-modal-barcode"
                      type="text"
                      value={barcode}
                      onChange={(e) => setBarcode(e.target.value)}
                      placeholder="Ex: 7891000100103"
                      className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-hidden focus:border-blue-500"
                    />
                    <Barcode className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="input-modal-brand"
                    className="block text-[10px] font-bold text-slate-500 uppercase mb-1"
                  >
                    Marca / Fabricante
                  </label>
                  <input
                    id="input-modal-brand"
                    type="text"
                    value={brand}
                    onChange={(e) => setBrand(capitalizeWords(e.target.value))}
                    placeholder="Ex: Tigre, Tramontina..."
                    autoCapitalize="words"
                    autoComplete="off"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-hidden focus:border-blue-500"
                  />
                </div>
                <div>
                  <label
                    htmlFor="input-modal-notes"
                    className="block text-[10px] font-bold text-slate-500 uppercase mb-1"
                  >
                    Observação
                  </label>
                  <input
                    id="input-modal-notes"
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Ex: Prateleira B, pedir pacote fechado..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-hidden focus:border-blue-500"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Onde Salvar este Produto (quando for novo ou editando destino) */}
          {!productToEdit && !selectedDatabaseProduct && (
            <div className="p-2.5 bg-slate-50/80 rounded-2xl border border-slate-200/90 space-y-1.5">
              <div className="flex items-center justify-between px-0.5">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <Database className="w-3 h-3 text-slate-400" />
                  <span>Onde salvar este produto:</span>
                </span>
                <span className="text-[10px] font-semibold text-blue-600">
                  {saveDestination === 'both' ? 'Lista + Base de Dados' : 'Apenas Base de Dados'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => setSaveDestination('both')}
                  className={`py-2 px-2.5 rounded-xl border text-center transition-all cursor-pointer text-xs font-bold flex items-center justify-center gap-1.5 ${
                    saveDestination === 'both'
                      ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <ListPlus className="w-3.5 h-3.5" />
                  <span>Lista e Base de Dados</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSaveDestination('database_only')}
                  className={`py-2 px-2.5 rounded-xl border text-center transition-all cursor-pointer text-xs font-bold flex items-center justify-center gap-1.5 ${
                    saveDestination === 'database_only'
                      ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <Database className="w-3.5 h-3.5" />
                  <span>Só na Base de Dados</span>
                </button>
              </div>
            </div>
          )}

          {/* Submit Button matching Screenshot */}
          <div className="pt-2">
            <button
              id="btn-save-product-modal"
              type="submit"
              disabled={isSaving || !name.trim()}
              className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 active:scale-98 disabled:opacity-50 text-white rounded-2xl font-bold text-sm shadow-lg shadow-blue-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>
                {isSaving
                  ? 'Salvando...'
                  : productToEdit
                  ? 'Salvar Alterações'
                  : selectedDatabaseProduct
                  ? selectedDatabaseProduct.status === 'comprado'
                    ? 'Reincluir na Lista de Compras'
                    : 'Atualizar na Lista e Base'
                  : saveDestination === 'database_only'
                  ? 'Salvar apenas na Base de Dados'
                  : 'Salvar na Lista e na Base de Dados'}
              </span>
            </button>
          </div>
        </form>
      </div>

      {/* Barcode Scanner Modal with Camera and Manual Input */}
      <BarcodeScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onDetected={handleBarcodeDetected}
      />
    </div>
  );
};
