import React, { useState, useMemo } from 'react';
import {
  X,
  Truck,
  Plus,
  Search,
  Phone,
  Mail,
  User,
  Edit2,
  Trash2,
  ExternalLink,
  MessageCircle,
  Tag,
  FileText,
  Building2,
  ArrowLeft,
  CheckCircle2,
} from 'lucide-react';
import { Supplier } from '../types';
import { capitalizeWords, normalizeSearchText } from '../utils/text';

interface SuppliersModalProps {
  isOpen: boolean;
  suppliers: Supplier[];
  onClose: () => void;
  onAddSupplier: (supplier: Omit<Supplier, 'id'>) => Promise<void>;
  onUpdateSupplier: (id: string, updates: Partial<Supplier>) => Promise<void>;
  onDeleteSupplier: (id: string) => Promise<void>;
  onToast: (title: string, description?: string, type?: 'success' | 'error' | 'info') => void;
}

export const SuppliersModal: React.FC<SuppliersModalProps> = ({
  isOpen,
  suppliers,
  onClose,
  onAddSupplier,
  onUpdateSupplier,
  onDeleteSupplier,
  onToast,
}) => {
  const [view, setView] = useState<'list' | 'add' | 'edit'>('list');
  const [searchTerm, setSearchTerm] = useState('');
  const [editingSupplierId, setEditingSupplierId] = useState<string | null>(null);

  // Form states
  const [formName, setFormName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formContactPerson, setFormContactPerson] = useState('');
  const [formCategory, setFormCategory] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete confirmation state
  const [supplierToDelete, setSupplierToDelete] = useState<Supplier | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const resetForm = () => {
    setFormName('');
    setFormPhone('');
    setFormEmail('');
    setFormContactPerson('');
    setFormCategory('');
    setFormNotes('');
    setFormError(null);
    setEditingSupplierId(null);
  };

  const handleStartAdd = () => {
    resetForm();
    setView('add');
  };

  const handleStartEdit = (supp: Supplier) => {
    setEditingSupplierId(supp.id);
    setFormName(supp.name);
    setFormPhone(supp.phone);
    setFormEmail(supp.email);
    setFormContactPerson(supp.contactPerson || '');
    setFormCategory(supp.category || '');
    setFormNotes(supp.notes || '');
    setFormError(null);
    setView('edit');
  };

  const handleSaveSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const trimmedName = formName.trim();
    const trimmedPhone = formPhone.trim();
    const trimmedEmail = formEmail.trim();

    if (!trimmedName) {
      setFormError('Por favor, informe o nome do fornecedor ou empresa.');
      return;
    }

    if (!trimmedPhone && !trimmedEmail) {
      setFormError('Informe ao menos um telefone ou e-mail de contato.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (view === 'edit' && editingSupplierId) {
        await onUpdateSupplier(editingSupplierId, {
          name: capitalizeWords(trimmedName),
          phone: trimmedPhone,
          email: trimmedEmail.toLowerCase(),
          contactPerson: formContactPerson.trim() ? capitalizeWords(formContactPerson.trim()) : undefined,
          category: formCategory.trim() ? capitalizeWords(formCategory.trim()) : undefined,
          notes: formNotes.trim() || undefined,
        });
        onToast('Fornecedor atualizado', `Os dados de "${trimmedName}" foram salvos com sucesso.`);
      } else {
        await onAddSupplier({
          name: capitalizeWords(trimmedName),
          phone: trimmedPhone,
          email: trimmedEmail.toLowerCase(),
          contactPerson: formContactPerson.trim() ? capitalizeWords(formContactPerson.trim()) : undefined,
          category: formCategory.trim() ? capitalizeWords(formCategory.trim()) : undefined,
          notes: formNotes.trim() || undefined,
          createdAt: new Date().toISOString(),
        });
        onToast('Fornecedor cadastrado', `"${trimmedName}" foi adicionado à lista de fornecedores.`);
      }
      resetForm();
      setView('list');
    } catch (err: any) {
      setFormError(err?.message || 'Erro ao salvar fornecedor. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!supplierToDelete) return;
    setIsDeleting(true);
    try {
      await onDeleteSupplier(supplierToDelete.id);
      onToast('Fornecedor excluído', `"${supplierToDelete.name}" foi removido com sucesso.`);
      setSupplierToDelete(null);
      if (editingSupplierId === supplierToDelete.id) {
        resetForm();
        setView('list');
      }
    } catch (err: any) {
      onToast('Erro ao excluir', err?.message || 'Não foi possível excluir o fornecedor.', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  // Filtered suppliers
  const filteredSuppliers = useMemo(() => {
    if (!searchTerm.trim()) return suppliers;
    const term = normalizeSearchText(searchTerm);
    return suppliers.filter((s) => {
      const nameNorm = normalizeSearchText(s.name);
      const phoneNorm = normalizeSearchText(s.phone);
      const emailNorm = normalizeSearchText(s.email);
      const contactNorm = normalizeSearchText(s.contactPerson || '');
      const catNorm = normalizeSearchText(s.category || '');
      const notesNorm = normalizeSearchText(s.notes || '');
      return (
        nameNorm.includes(term) ||
        phoneNorm.includes(term) ||
        emailNorm.includes(term) ||
        contactNorm.includes(term) ||
        catNorm.includes(term) ||
        notesNorm.includes(term)
      );
    });
  }, [suppliers, searchTerm]);

  // Clean phone string for WhatsApp / tel links
  const getCleanPhone = (phone: string) => {
    return phone.replace(/\D/g, '');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        id="suppliers-modal-container"
        className="w-full max-w-[430px] h-[92vh] max-h-[750px] bg-slate-50 rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-150"
      >
        {/* Modal Header */}
        <div className="bg-white px-5 py-3.5 border-b border-slate-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            {view !== 'list' ? (
              <button
                type="button"
                onClick={() => {
                  resetForm();
                  setView('list');
                }}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
                title="Voltar para a lista"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            ) : (
              <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center shrink-0">
                <Truck className="w-5 h-5" />
              </div>
            )}
            <div>
              <h2 className="text-base font-bold text-slate-800 leading-tight">
                {view === 'list'
                  ? 'Fornecedores'
                  : view === 'add'
                  ? 'Novo Fornecedor'
                  : 'Editar Fornecedor'}
              </h2>
              <p className="text-[11px] text-slate-500">
                {view === 'list'
                  ? `${suppliers.length} cadastrado${suppliers.length === 1 ? '' : 's'}`
                  : 'Preencha os dados de contato'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {view === 'list' && (
              <button
                type="button"
                onClick={handleStartAdd}
                className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                title="Cadastrar novo fornecedor"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Novo</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer"
              aria-label="Fechar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* View 1: List of Suppliers */}
        {view === 'list' && (
          <div className="flex-1 flex flex-col min-h-0 bg-slate-50">
            {/* Search Bar */}
            <div className="p-3 bg-white border-b border-slate-100 shrink-0">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar por nome, telefone ou e-mail..."
                  className="w-full pl-9 pr-8 py-2 bg-slate-100 hover:bg-slate-100/80 focus:bg-white text-xs text-slate-800 placeholder-slate-400 rounded-xl border border-transparent focus:border-blue-500 focus:outline-none transition-colors"
                />
                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => setSearchTerm('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs p-0.5 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
              {filteredSuppliers.length === 0 ? (
                <div className="h-64 flex flex-col items-center justify-center text-center p-6 text-slate-400">
                  <div className="w-14 h-14 rounded-2xl bg-white border border-slate-200 flex items-center justify-center mb-3 shadow-2xs">
                    <Truck className="w-7 h-7 text-slate-300" />
                  </div>
                  <p className="text-sm font-semibold text-slate-700">
                    {searchTerm ? 'Nenhum fornecedor encontrado' : 'Nenhum fornecedor cadastrado'}
                  </p>
                  <p className="text-xs text-slate-500 mt-1 max-w-[240px]">
                    {searchTerm
                      ? `Não encontramos resultados para "${searchTerm}".`
                      : 'Cadastre seus fornecedores com nome, telefone e e-mail para ter os contatos sempre à mão.'}
                  </p>
                  {!searchTerm && (
                    <button
                      type="button"
                      onClick={handleStartAdd}
                      className="mt-4 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      Cadastrar Primeiro Fornecedor
                    </button>
                  )}
                </div>
              ) : (
                filteredSuppliers.map((supp) => {
                  const cleanPhone = getCleanPhone(supp.phone);
                  const isMobileWhatsApp = cleanPhone.length >= 10;
                  const initial = supp.name.charAt(0).toUpperCase() || 'F';

                  return (
                    <div
                      key={supp.id}
                      className="bg-white rounded-2xl p-3.5 border border-slate-200/80 shadow-2xs hover:border-slate-300 transition-all flex flex-col gap-2.5"
                    >
                      {/* Top Row: Initial avatar + Name & Category + Edit / Delete buttons */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white font-bold text-sm flex items-center justify-center shrink-0 shadow-2xs">
                            {initial}
                          </div>
                          <div className="min-w-0">
                            <h3 className="font-bold text-sm text-slate-800 truncate leading-tight">
                              {supp.name}
                            </h3>
                            <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                              {supp.category && (
                                <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-blue-700 bg-blue-50 border border-blue-200/80 px-1.5 py-0.2 rounded-md">
                                  <Tag className="w-2.5 h-2.5" />
                                  {supp.category}
                                </span>
                              )}
                              {supp.contactPerson && (
                                <span className="text-[11px] text-slate-500 truncate flex items-center gap-1">
                                  <User className="w-3 h-3 text-slate-400 shrink-0" />
                                  {supp.contactPerson}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleStartEdit(supp)}
                            className="w-7 h-7 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 flex items-center justify-center transition-colors cursor-pointer"
                            title="Editar fornecedor"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setSupplierToDelete(supp)}
                            className="w-7 h-7 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 flex items-center justify-center transition-colors cursor-pointer"
                            title="Excluir fornecedor"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Contact Info Pills: Phone & Email with direct interactive links */}
                      <div className="grid grid-cols-1 gap-1.5 pt-1 border-t border-slate-100 text-xs">
                        {supp.phone && (
                          <div className="flex items-center justify-between gap-2 bg-slate-50 px-2.5 py-1.5 rounded-xl border border-slate-100">
                            <div className="flex items-center gap-2 min-w-0">
                              <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span className="font-semibold text-slate-700 truncate text-[11px]">
                                {supp.phone}
                              </span>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              {/* Call link */}
                              <a
                                href={`tel:${cleanPhone}`}
                                className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-700 hover:text-blue-600 hover:border-blue-300 text-[10px] font-bold flex items-center gap-1 transition-colors"
                                title="Ligar para o telefone"
                              >
                                Ligar
                              </a>
                              {/* WhatsApp link if mobile/10+ digits */}
                              {isMobileWhatsApp && (
                                <a
                                  href={`https://wa.me/55${cleanPhone}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="px-2 py-0.5 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100 text-[10px] font-bold flex items-center gap-1 transition-colors"
                                  title="Chamar no WhatsApp"
                                >
                                  <MessageCircle className="w-3 h-3" />
                                  WhatsApp
                                </a>
                              )}
                            </div>
                          </div>
                        )}

                        {supp.email && (
                          <div className="flex items-center justify-between gap-2 bg-slate-50 px-2.5 py-1.5 rounded-xl border border-slate-100">
                            <div className="flex items-center gap-2 min-w-0">
                              <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span className="font-semibold text-slate-700 truncate text-[11px]">
                                {supp.email}
                              </span>
                            </div>
                            <a
                              href={`mailto:${supp.email}`}
                              className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-700 hover:text-blue-600 hover:border-blue-300 text-[10px] font-bold flex items-center gap-1 transition-colors shrink-0"
                              title="Enviar e-mail"
                            >
                              <ExternalLink className="w-2.5 h-2.5" />
                              E-mail
                            </a>
                          </div>
                        )}

                        {supp.notes && (
                          <div className="mt-0.5 text-[11px] text-slate-500 bg-amber-50/70 border border-amber-200/60 p-2 rounded-xl flex items-start gap-1.5">
                            <FileText className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                            <p className="line-clamp-2 leading-relaxed text-amber-900">
                              {supp.notes}
                            </p>
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

        {/* View 2: Add / Edit Form */}
        {(view === 'add' || view === 'edit') && (
          <form
            onSubmit={handleSaveSupplier}
            className="flex-1 overflow-y-auto p-4 flex flex-col justify-between bg-white"
          >
            <div className="space-y-3.5">
              {formError && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                  <p>{formError}</p>
                </div>
              )}

              {/* Nome do Fornecedor / Empresa */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nome do Fornecedor / Empresa <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="Ex: Tigre Tubos e Conexões"
                    className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 focus:outline-none transition-colors"
                  />
                </div>
              </div>

              {/* Telefone */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Telefone / WhatsApp <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    placeholder="Ex: (11) 98765-4321"
                    className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 focus:outline-none transition-colors"
                  />
                </div>
              </div>

              {/* E-mail */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  E-mail
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    placeholder="Ex: vendas@fornecedor.com.br"
                    className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 focus:outline-none transition-colors"
                  />
                </div>
              </div>

              {/* Contato / Vendedor */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Pessoa de Contato / Representante
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={formContactPerson}
                    onChange={(e) => setFormContactPerson(e.target.value)}
                    placeholder="Ex: Rogério Vendas"
                    className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 focus:outline-none transition-colors"
                  />
                </div>
              </div>

              {/* Categoria / Ramo */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Categoria / Segmento
                </label>
                <div className="relative">
                  <Tag className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    placeholder="Ex: Hidráulica, Elétrica, Tintas..."
                    className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 focus:outline-none transition-colors"
                  />
                </div>
              </div>

              {/* Observações */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Observações / Condições de Pedido
                </label>
                <textarea
                  rows={3}
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="Ex: Entrega todas as terças; pedido mínimo R$ 500; faturamento 28 dias..."
                  className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 focus:outline-none transition-colors resize-none"
                />
              </div>
            </div>

            {/* Form Action Buttons */}
            <div className="pt-4 border-t border-slate-100 flex items-center gap-2 mt-4">
              <button
                type="button"
                onClick={() => {
                  resetForm();
                  setView('list');
                }}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-bold transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer"
              >
                {isSubmitting ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{view === 'edit' ? 'Salvar Alterações' : 'Cadastrar Fornecedor'}</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* Delete Confirmation Modal Overlay */}
        {supplierToDelete && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-2xs flex items-center justify-center p-4 z-50 animate-in fade-in">
            <div className="bg-white rounded-2xl p-5 max-w-xs w-full shadow-2xl border border-slate-100 text-center animate-in zoom-in-95">
              <div className="w-11 h-11 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto mb-3">
                <Trash2 className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm text-slate-800">
                Excluir Fornecedor?
              </h3>
              <p className="text-xs text-slate-500 mt-1.5">
                Deseja realmente excluir <strong>"{supplierToDelete.name}"</strong>? Os dados de telefone e e-mail serão removidos.
              </p>
              <div className="flex items-center gap-2 mt-4">
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={() => setSupplierToDelete(null)}
                  className="flex-1 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={confirmDelete}
                  className="flex-1 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-colors cursor-pointer"
                >
                  {isDeleting ? 'Excluindo...' : 'Excluir'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
