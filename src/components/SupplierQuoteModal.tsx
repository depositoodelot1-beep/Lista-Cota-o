import React, { useState, useEffect } from 'react';
import { X, DollarSign, Package, Tag, Clock, CheckCircle2, MessageCircle, AlertCircle, Building2 } from 'lucide-react';
import { Product, Supplier, SupplierQuote } from '../types';

interface SupplierQuoteModalProps {
  isOpen: boolean;
  product: Product | null;
  existingQuote: SupplierQuote | null;
  suppliers: Supplier[];
  currentSupplier: {
    id?: string;
    name: string;
    phone?: string;
    email?: string;
  } | null;
  onClose: () => void;
  onSave: (quoteData: {
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
  onChangeSupplierIdentity: (supplier: { id?: string; name: string; phone?: string; email?: string }) => void;
}

export const SupplierQuoteModal: React.FC<SupplierQuoteModalProps> = ({
  isOpen,
  product,
  existingQuote,
  suppliers,
  currentSupplier,
  onClose,
  onSave,
  onChangeSupplierIdentity,
}) => {
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>('');
  const [customSupplierName, setCustomSupplierName] = useState('');
  const [supplierPhone, setSupplierPhone] = useState('');
  const [priceCents, setPriceCents] = useState<number>(0);
  const [quantityInput, setQuantityInput] = useState('');
  const [unit, setUnit] = useState('un');
  const [brand, setBrand] = useState('');
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Sync state when opening or product changes
  useEffect(() => {
    if (!isOpen || !product) return;

    // Reset error
    setErrorMsg('');

    // Prepopulate supplier identity
    if (existingQuote) {
      setSelectedSupplierId(existingQuote.supplierId || 'custom');
      setCustomSupplierName(existingQuote.supplierName || '');
      setSupplierPhone(existingQuote.supplierPhone || '');
      setPriceCents(existingQuote.price ? Math.round(existingQuote.price * 100) : 0);
      setQuantityInput(String(existingQuote.quantity || product.quantity || 1));
      setUnit(existingQuote.unit || product.unit || 'un');
      setBrand(existingQuote.brand || product.brand || '');
      setNotes(existingQuote.notes || '');
    } else {
      // Default to current selected supplier identity
      if (currentSupplier?.id) {
        setSelectedSupplierId(currentSupplier.id);
        setCustomSupplierName(currentSupplier.name);
        setSupplierPhone(currentSupplier.phone || '');
      } else if (currentSupplier?.name) {
        setSelectedSupplierId('custom');
        setCustomSupplierName(currentSupplier.name);
        setSupplierPhone(currentSupplier.phone || '');
      } else if (suppliers.length > 0) {
        setSelectedSupplierId(suppliers[0].id);
        setCustomSupplierName(suppliers[0].name);
        setSupplierPhone(suppliers[0].phone || '');
      } else {
        setSelectedSupplierId('custom');
        setCustomSupplierName('');
        setSupplierPhone('');
      }

      setPriceCents(0);
      setQuantityInput(String(product.quantity || 1));
      setUnit(product.unit || 'un');
      setBrand(product.brand || '');
      setNotes('');
    }
  }, [isOpen, product, existingQuote, currentSupplier, suppliers]);

  if (!isOpen || !product) return null;

  const handleSupplierSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setSelectedSupplierId(val);
    if (val === 'custom') {
      setCustomSupplierName('');
      setSupplierPhone('');
    } else {
      const match = suppliers.find((s) => s.id === val);
      if (match) {
        setCustomSupplierName(match.name);
        setSupplierPhone(match.phone || '');
        onChangeSupplierIdentity({
          id: match.id,
          name: match.name,
          phone: match.phone,
          email: match.email,
        });
      }
    }
  };

  const parsedPrice = priceCents / 100;
  const parsedQuantity = parseFloat(quantityInput);
  const calculatedTotal =
    !isNaN(parsedPrice) && !isNaN(parsedQuantity) && parsedPrice > 0 && parsedQuantity > 0
      ? parsedPrice * parsedQuantity
      : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const finalSupplierName =
      selectedSupplierId === 'custom'
        ? customSupplierName.trim()
        : suppliers.find((s) => s.id === selectedSupplierId)?.name || customSupplierName.trim();

    if (!finalSupplierName) {
      setErrorMsg('Por favor, selecione ou informe o nome do fornecedor/empresa.');
      return;
    }

    if (isNaN(parsedPrice) || parsedPrice <= 0) {
      setErrorMsg('Informe um valor/preço válido maior que zero.');
      return;
    }

    if (isNaN(parsedQuantity) || parsedQuantity <= 0) {
      setErrorMsg('Informe uma quantidade válida.');
      return;
    }

    setIsSaving(true);
    try {
      await onSave({
        productId: product.id,
        productName: product.name,
        supplierId: selectedSupplierId === 'custom' ? '' : selectedSupplierId,
        supplierName: finalSupplierName,
        supplierPhone: supplierPhone.trim(),
        supplierEmail: '',
        price: parsedPrice,
        quantity: parsedQuantity,
        unit: unit.trim() || product.unit || 'un',
        brand: brand.trim() || product.brand || 'Conforme ofertado',
        notes: notes.trim(),
      });

      // Update current supplier memory
      onChangeSupplierIdentity({
        id: selectedSupplierId === 'custom' ? undefined : selectedSupplierId,
        name: finalSupplierName,
        phone: supplierPhone.trim(),
      });

      onClose();
    } catch (err: any) {
      setErrorMsg(err?.message || 'Erro ao salvar cotação. Tente novamente.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      id="modal-supplier-quote"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn"
      onClick={onClose}
    >
      <div
        id="supplier-quote-modal-card"
        className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-xs">
              <DollarSign className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold leading-tight">
                {existingQuote ? 'Editar Cotação do Fornecedor' : 'Nova Cotação de Fornecedor'}
              </h2>
              <p className="text-xs text-blue-100 font-medium">
                Informe seu preço, quantidade e marca ofertada
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Product Target Banner */}
        <div className="bg-slate-50 border-b border-slate-200 px-6 py-3 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Produto Solicitado pela Loja:
            </span>
            <p className="text-sm font-bold text-slate-800 flex items-center gap-2">
              {product.name}
              {product.brand && (
                <span className="text-xs font-normal text-slate-500 bg-white px-2 py-0.5 rounded-full border border-slate-200">
                  Ref: {product.brand}
                </span>
              )}
            </p>
          </div>
          <div className="text-right">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Necessidade:
            </span>
            <p className="text-sm font-extrabold text-blue-600">
              {product.quantity} {product.unit}
            </p>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2.5 text-xs text-red-700 font-medium">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Supplier Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-blue-600" />
              Empresa / Fornecedor Cotando *
            </label>
            <div className="space-y-2">
              <select
                value={selectedSupplierId}
                onChange={handleSupplierSelectChange}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all cursor-pointer"
              >
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} {s.contactPerson ? `(${s.contactPerson})` : ''}
                  </option>
                ))}
                <option value="custom">+ Outro Fornecedor (Digitar nome)</option>
              </select>

              {selectedSupplierId === 'custom' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  <div>
                    <input
                      type="text"
                      placeholder="Nome da sua Empresa *"
                      value={customSupplierName}
                      onChange={(e) => setCustomSupplierName(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      placeholder="WhatsApp / Telefone"
                      value={supplierPhone}
                      onChange={(e) => setSupplierPhone(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Price and Quantity (2 columns) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Valor / Preço Unitário */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                Preço Unitário (R$) *
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">
                  R$
                </span>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="0,00"
                  value={(priceCents / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  onChange={(e) => {
                    const digits = e.target.value.replace(/\D/g, '');
                    const cents = digits === '' ? 0 : parseInt(digits, 10);
                    setPriceCents(cents);
                  }}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-base font-bold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
                  required
                />
              </div>
              <span className="text-[11px] text-slate-400 mt-1 block">
                Ex: 14,90 por {unit}
              </span>
            </div>

            {/* Quantidade que tem / vende */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Package className="w-3.5 h-3.5 text-blue-600" />
                Qtd Ofertada / Disponível *
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  min="0.01"
                  step="any"
                  placeholder="Qtd"
                  value={quantityInput}
                  onChange={(e) => setQuantityInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                  required
                />
                <select
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  className="w-24 px-2 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 uppercase focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                >
                  <option value="un">UN</option>
                  <option value="cx">CX</option>
                  <option value="pct">PCT</option>
                  <option value="kg">KG</option>
                  <option value="lt">LT</option>
                  <option value="mt">MT</option>
                  <option value="rolo">ROLO</option>
                </select>
              </div>
              <span className="text-[11px] text-slate-400 mt-1 block">
                Total da sua embalagem ou lote
              </span>
            </div>
          </div>

          {/* Marca do Produto que ele vende */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-indigo-600" />
              Marca do Produto (Opcional)
            </label>
            <input
              type="text"
              placeholder="Ex: Tigre, Amanco, Krona, Tramontina..."
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
            />
            <span className="text-[11px] text-slate-400 mt-1 block">
              Caso deseje especificar a marca que irá entregar com este preço
            </span>
          </div>

          {/* Calculated Total Highlight */}
          {calculatedTotal !== null && (
            <div className="p-3.5 bg-emerald-50/80 border border-emerald-200 rounded-xl flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">
                  Total da Proposta:
                </span>
                <p className="text-xs text-emerald-700">
                  {quantityInput} {unit} × R$ {(priceCents / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
              <span className="text-lg font-black text-emerald-700">
                R$ {calculatedTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          )}

          {/* Observações / Condições */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              Prazo de Entrega / Condições de Pagamento (Opcional)
            </label>
            <textarea
              rows={2}
              placeholder="Ex: Pronta entrega, faturamento em 28 dias, pedido mínimo R$ 300, frete grátis..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white resize-none"
            />
          </div>

          {/* Buttons */}
          <div className="pt-2 flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-4 border border-slate-200 text-slate-700 hover:bg-slate-100 rounded-xl text-sm font-bold transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex-1 py-3 px-4 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-xl text-sm font-bold shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Salvando...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{existingQuote ? 'Atualizar Cotação' : 'Salvar Cotação'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
