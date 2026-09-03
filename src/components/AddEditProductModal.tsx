import React, { useState, useEffect } from 'react';
import { X, Check, UserPlus, Plus, Minus, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { Product, AppUser } from '../types';
import { capitalizeWords } from '../utils/text';

interface AddEditProductModalProps {
  isOpen: boolean;
  productToEdit?: Product | null;
  users: AppUser[];
  currentUser: AppUser;
  onClose: () => void;
  onSave: (data: Omit<Product, 'id'>, editId?: string) => Promise<void>;
  onOpenUserManager?: () => void;
}

export const AddEditProductModal: React.FC<AddEditProductModalProps> = ({
  isOpen,
  productToEdit,
  users,
  currentUser,
  onClose,
  onSave,
  onOpenUserManager,
}) => {
  const [name, setName] = useState('');
  const [brand, setBrand] = useState('');
  const [quantity, setQuantity] = useState<number | string>(1);
  const [unit, setUnit] = useState('unidade');
  const [responsibleId, setResponsibleId] = useState(currentUser.id);
  const [urgency, setUrgency] = useState<'baixa' | 'media' | 'alta' | 'urgente'>('media');
  const [notes, setNotes] = useState('');
  const [showMoreDetails, setShowMoreDetails] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Sync state when editing product opens
  useEffect(() => {
    if (productToEdit) {
      setName(productToEdit.name);
      setBrand(productToEdit.brand || '');
      setQuantity(productToEdit.quantity ?? 1);
      setUnit(productToEdit.unit || 'unidade');
      setResponsibleId(productToEdit.responsibleId || currentUser.id);
      setUrgency(productToEdit.urgency || 'media');
      setNotes(productToEdit.notes || '');
      if (productToEdit.brand || productToEdit.notes) {
        setShowMoreDetails(true);
      }
    } else {
      setName('');
      setBrand('');
      setQuantity(1);
      setUnit('unidade');
      setResponsibleId(currentUser.id);
      setUrgency('media'); // 'Normal' selected by default like in screenshot
      setNotes('');
      setShowMoreDetails(false);
    }
    setError(null);
  }, [productToEdit, currentUser, isOpen]);

  if (!isOpen) return null;

  const selectedResponsible = users.find((u) => u.id === responsibleId) || currentUser;
  const isSelf = selectedResponsible.id === currentUser.id;

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
      const productData: Omit<Product, 'id'> = {
        name: name.trim(),
        quantity: qtyNum,
        unit: unit || 'unidade',
        responsibleId: selectedResponsible.id,
        responsibleName: selectedResponsible.name,
        responsibleInitial: selectedResponsible.avatarInitial || selectedResponsible.name[0].toUpperCase(),
        responsibleColor: selectedResponsible.avatarColor || '#3b82f6',
        status: qtyNum === 0 ? 'em_falta' : 'baixo_estoque',
        urgency,
        createdAt: productToEdit ? productToEdit.createdAt : new Date().toISOString(),
      };

      if (brand.trim()) {
        productData.brand = brand.trim();
      }
      if (notes.trim()) {
        productData.notes = notes.trim();
      }

      await onSave(productData, productToEdit ? productToEdit.id : undefined);
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

            {/* Selected User Info Pill matching Screenshot */}
            <div className="mt-2 flex items-center gap-2 px-3 py-2 bg-slate-50/80 rounded-xl border border-slate-100">
              <div
                className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black text-white shrink-0"
                style={{ backgroundColor: selectedResponsible.avatarColor || '#2563eb' }}
              >
                {selectedResponsible.avatarInitial || selectedResponsible.name.charAt(0).toUpperCase()}
              </div>
              <span className="text-xs text-slate-500 font-medium">
                Responsável:{' '}
                <strong className="text-blue-600 font-semibold">
                  {isSelf ? 'Eu' : selectedResponsible.name}
                </strong>
              </span>
            </div>
          </div>

          {/* 2. NOME DO PRODUTO */}
          <div>
            <label
              htmlFor="input-modal-product-name"
              className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5"
            >
              2. NOME DO PRODUTO
            </label>
            <input
              id="input-modal-product-name"
              type="text"
              value={name}
              onChange={(e) => setName(capitalizeWords(e.target.value))}
              placeholder="Nome do produto"
              autoCapitalize="words"
              autoComplete="off"
              required
              autoFocus
              className="w-full px-4 py-3 bg-white border border-blue-200/90 rounded-2xl text-sm text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all shadow-2xs"
            />
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
              <div className="space-y-2 mt-2 pt-2 border-t border-slate-100 animate-in fade-in duration-150">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
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
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                    Observação
                  </label>
                  <input
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
                  : 'Adicionar à Lista'}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
