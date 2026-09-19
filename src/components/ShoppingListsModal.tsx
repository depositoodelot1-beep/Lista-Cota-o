import React, { useState } from 'react';
import { ShoppingList, Supplier } from '../types';
import { ListPlus, List, Building2, Trash2, Edit3, X, Check, Plus, ShieldAlert } from 'lucide-react';

interface ShoppingListsModalProps {
  isOpen: boolean;
  onClose: () => void;
  shoppingLists: ShoppingList[];
  activeListId: string;
  onSelectList: (listId: string) => void;
  onAddList: (listData: Omit<ShoppingList, 'id' | 'createdAt'>) => Promise<string>;
  onUpdateList: (id: string, listData: Partial<ShoppingList>) => Promise<void>;
  onDeleteList: (id: string) => Promise<void>;
  suppliers: Supplier[];
  onToast: (title: string, description?: string, type?: 'success' | 'error' | 'info') => void;
}

export const ShoppingListsModal: React.FC<ShoppingListsModalProps> = ({
  isOpen,
  onClose,
  shoppingLists,
  activeListId,
  onSelectList,
  onAddList,
  onUpdateList,
  onDeleteList,
  suppliers,
  onToast,
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [editingListId, setEditingListId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedSupplierIds, setSelectedSupplierIds] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleStartCreate = () => {
    setIsCreating(true);
    setEditingListId(null);
    setName('');
    setDescription('');
    setSelectedSupplierIds([]);
  };

  const handleStartEdit = (list: ShoppingList) => {
    setEditingListId(list.id);
    setIsCreating(false);
    setName(list.name);
    setDescription(list.description || '');
    setSelectedSupplierIds(list.supplierIds || []);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      onToast('Nome obrigatório', 'Informe o nome da lista de compras.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingListId) {
        await onUpdateList(editingListId, {
          name: name.trim(),
          description: description.trim(),
          supplierIds: selectedSupplierIds,
        });
        onToast('Lista atualizada', 'As alterações foram salvas com sucesso.');
        setIsCreating(false);
        setEditingListId(null);
        setName('');
        setDescription('');
        setSelectedSupplierIds([]);
        onClose();
        return;
      } else {
        const newListId = await onAddList({
          name: name.trim(),
          description: description.trim(),
          supplierIds: selectedSupplierIds,
        });
        onSelectList(newListId);
        onToast('Lista criada', 'Nova lista de compras criada com sucesso.');
        setIsCreating(false);
        setEditingListId(null);
        setName('');
        setDescription('');
        setSelectedSupplierIds([]);
        onClose(); // Close modal so user sees the dropdown active with the new list
        return;
      }
      setIsCreating(false);
      setEditingListId(null);
      setName('');
      setDescription('');
      setSelectedSupplierIds([]);
    } catch (err: any) {
      onToast('Erro ao salvar', err?.message || 'Não foi possível salvar a lista.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleSupplier = (suppId: string) => {
    setSelectedSupplierIds((prev) =>
      prev.includes(suppId) ? prev.filter((id) => id !== suppId) : [...prev, suppId]
    );
  };

  const handleDelete = async (id: string, listName: string) => {
    if (shoppingLists.length <= 1) {
      onToast('Ação não permitida', 'Você precisa manter pelo menos uma lista de compras.', 'error');
      return;
    }
    if (confirm(`Deseja realmente excluir a lista "${listName}"?`)) {
      try {
        await onDeleteList(id);
        if (activeListId === id) {
          const remaining = shoppingLists.filter((l) => l.id !== id);
          if (remaining.length > 0) {
            onSelectList(remaining[0].id);
          }
        }
        onToast('Lista excluída', 'A lista foi removida com sucesso.');
      } catch (err: any) {
        onToast('Erro ao excluir', err?.message || 'Não foi possível excluir a lista.', 'error');
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold shadow-2xs">
              <List className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-900">Gerenciar Listas de Compras</h2>
              <p className="text-xs text-slate-500">Crie múltiplas listas e defina fornecedores específicos para cada uma</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {isCreating || editingListId ? (
            <form onSubmit={handleSave} className="bg-slate-50 border border-slate-200/80 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200/60 pb-3">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-700">
                  {editingListId ? 'Editar Lista de Compras' : 'Nova Lista de Compras'}
                </h3>
                <button
                  type="button"
                  onClick={() => {
                    setIsCreating(false);
                    setEditingListId(null);
                  }}
                  className="text-xs text-slate-500 hover:text-slate-800 font-bold"
                >
                  Cancelar
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Nome da Lista *</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex: Reposição Semanal, Hortifrúti, Limpeza..."
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    autoFocus
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Descrição (Opcional)</label>
                  <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Ex: Produtos para reposição rápida na ala principal"
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                    <span>Fornecedores Disponíveis para esta Lista</span>
                    <span className="text-[10px] text-slate-400 font-normal">Se nenhum for selecionado, todos os fornecedores serão permitidos</span>
                  </label>
                  <div className="max-h-40 overflow-y-auto space-y-1.5 p-2 bg-white border border-slate-200 rounded-xl">
                    {suppliers.map((supp) => {
                      const isSelected = selectedSupplierIds.includes(supp.id);
                      return (
                        <div
                          key={supp.id}
                          onClick={() => toggleSupplier(supp.id)}
                          className={`flex items-center justify-between p-2 rounded-lg text-xs cursor-pointer transition-colors ${
                            isSelected ? 'bg-blue-50 text-blue-900 font-bold border border-blue-200' : 'hover:bg-slate-50 text-slate-700'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <Building2 className={`w-3.5 h-3.5 ${isSelected ? 'text-blue-600' : 'text-slate-400'}`} />
                            <span>{supp.name}</span>
                          </div>
                          <div className={`w-4 h-4 rounded border flex items-center justify-center ${isSelected ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-300 bg-white'}`}>
                            {isSelected && <Check className="w-3 h-3" />}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsCreating(false);
                    setEditingListId(null);
                  }}
                  className="px-4 py-2.5 bg-white border border-slate-200 text-slate-700 text-xs font-bold rounded-xl hover:bg-slate-50 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-2"
                >
                  {isSubmitting ? 'Salvando...' : editingListId ? 'Salvar Alterações' : 'Criar Lista'}
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Listas Cadastradas ({shoppingLists.length})</span>
                <button
                  type="button"
                  onClick={handleStartCreate}
                  className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Nova Lista</span>
                </button>
              </div>

              <div className="space-y-2">
                {shoppingLists.map((list) => {
                  const isActive = list.id === activeListId;
                  const supCount = list.supplierIds?.length || 0;

                  return (
                    <div
                      key={list.id}
                      className={`p-4 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                        isActive
                          ? 'bg-blue-50/70 border-blue-300 shadow-xs'
                          : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-black text-slate-900 truncate">{list.name}</h4>
                          {isActive && (
                            <span className="text-[10px] font-black uppercase px-2 py-0.5 bg-blue-600 text-white rounded-full">
                              Ativa
                            </span>
                          )}
                        </div>
                        {list.description && <p className="text-xs text-slate-500 truncate mt-0.5">{list.description}</p>}
                        <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-1">
                          <span className="flex items-center gap-1">
                            <Building2 className="w-3 h-3" />
                            {supCount === 0 ? 'Todos os fornecedores' : `${supCount} fornecedor${supCount === 1 ? '' : 'es'} vinculado${supCount === 1 ? '' : 's'}`}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {!isActive && (
                          <button
                            type="button"
                            onClick={() => {
                              onSelectList(list.id);
                              onToast('Lista selecionada', `Trabalhando agora na lista "${list.name}".`);
                              onClose();
                            }}
                            className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
                          >
                            Selecionar
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleStartEdit(list)}
                          className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors cursor-pointer"
                          title="Editar lista"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        {shoppingLists.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleDelete(list.id, list.name)}
                            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                            title="Excluir lista"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <p className="text-[11px] text-slate-500">
            Cada lista possui seus próprios produtos e fornecedores selecionados.
          </p>
          <div className="flex items-center gap-2">
            {isCreating || editingListId ? (
              <button
                type="button"
                onClick={handleSave}
                disabled={isSubmitting}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md transition-colors cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? 'Salvando...' : editingListId ? 'Salvar Alterações' : 'Criar Lista'}
              </button>
            ) : (
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                Concluído
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
