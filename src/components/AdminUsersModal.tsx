import React, { useState } from 'react';
import {
  X,
  ShieldCheck,
  UserPlus,
  Lock,
  User,
  Key,
  CheckCircle,
  AlertCircle,
  Edit2,
  Trash2,
  Power,
  LogOut,
  Palette,
  Users,
  FileSpreadsheet,
  Package,
  Truck,
  ExternalLink,
} from 'lucide-react';
import { AppUser, UserRole } from '../types';
import { capitalizeWords } from '../utils/text';

interface AdminUsersModalProps {
  isOpen: boolean;
  currentUser: AppUser;
  users: AppUser[];
  supplierCount?: number;
  onOpenSheets?: () => void;
  onOpenCatalog?: () => void;
  onOpenSuppliers?: () => void;
  onClose: () => void;
  onLoginAsAdmin: (username: string, pass: string) => Promise<boolean>;
  onSwitchUser: (user: AppUser) => void;
  onLogoutAdmin: () => void;
  onAddUser: (userData: Omit<AppUser, 'id'>) => Promise<void>;
  onUpdateUser: (id: string, updates: Partial<AppUser>) => Promise<void>;
  onDeleteUser: (id: string) => Promise<void>;
  onToast: (title: string, description?: string, type?: 'success' | 'error' | 'info') => void;
}

const AVATAR_COLORS = [
  '#f59e0b', // Amber (A)
  '#ec4899', // Pink (E)
  '#3b82f6', // Blue (L)
  '#10b981', // Teal/Emerald (S)
  '#8b5cf6', // Violet
  '#ef4444', // Red
  '#06b6d4', // Cyan
  '#f97316', // Orange
];

export const AdminUsersModal: React.FC<AdminUsersModalProps> = ({
  isOpen,
  currentUser,
  users,
  supplierCount,
  onOpenSheets,
  onOpenCatalog,
  onOpenSuppliers,
  onClose,
  onLoginAsAdmin,
  onSwitchUser,
  onLogoutAdmin,
  onAddUser,
  onUpdateUser,
  onDeleteUser,
  onToast,
}) => {
  const [tab, setTab] = useState<'users' | 'adduser' | 'login' | 'switch'>(
    currentUser.role === 'admin' ? 'users' : 'login'
  );

  // Admin login form state
  const [loginUsername, setLoginUsername] = useState('admin');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // User form state (add / edit)
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [formName, setFormName] = useState('');
  const [formUsername, setFormUsername] = useState('');
  const [formPassword, setFormPassword] = useState('123');
  const [formRole, setFormRole] = useState<UserRole>('employee');
  const [formColor, setFormColor] = useState('#3b82f6');
  const [formActive, setFormActive] = useState(true);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSavingUser, setIsSavingUser] = useState(false);

  if (!isOpen) return null;

  const isAdmin = currentUser.role === 'admin';

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setIsLoggingIn(true);
    try {
      const success = await onLoginAsAdmin(loginUsername.trim(), loginPassword);
      if (success) {
        setTab('users');
        setLoginPassword('');
        onToast('Autenticado como Administrador', 'Acesso liberado a todas as funções.');
      } else {
        setLoginError('Usuário ou senha de administrador incorretos.');
      }
    } catch {
      setLoginError('Erro ao validar credenciais de administrador.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleStartEditUser = (u: AppUser) => {
    setEditingUserId(u.id);
    setFormName(u.name);
    setFormUsername(u.username);
    setFormPassword(u.password || '');
    setFormRole(u.role);
    setFormColor(u.avatarColor);
    setFormActive(u.active);
    setTab('adduser');
  };

  const handleResetUserForm = () => {
    setEditingUserId(null);
    setFormName('');
    setFormUsername('');
    setFormPassword('123');
    setFormRole('employee');
    setFormColor('#3b82f6');
    setFormActive(true);
    setFormError(null);
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formUsername.trim()) {
      setFormError('Preencha o nome e o usuário.');
      return;
    }

    setIsSavingUser(true);
    setFormError(null);

    try {
      const initial = formName.trim().charAt(0).toUpperCase();

      if (editingUserId) {
        await onUpdateUser(editingUserId, {
          name: formName.trim(),
          username: formUsername.trim().toLowerCase(),
          password: formPassword || '123',
          role: formRole,
          active: formActive,
          avatarColor: formColor,
          avatarInitial: initial,
        });
        onToast('Usuário atualizado com sucesso!');
      } else {
        await onAddUser({
          name: formName.trim(),
          username: formUsername.trim().toLowerCase(),
          password: formPassword || '123',
          role: formRole,
          active: formActive,
          avatarColor: formColor,
          avatarInitial: initial,
          createdAt: new Date().toISOString(),
        });
        onToast('Novo usuário cadastrado com sucesso!');
      }

      handleResetUserForm();
      setTab('users');
    } catch (err: any) {
      setFormError(err?.message || 'Erro ao salvar usuário.');
    } finally {
      setIsSavingUser(false);
    }
  };

  const handleToggleStatus = async (user: AppUser) => {
    try {
      await onUpdateUser(user.id, { active: !user.active });
      onToast(
        user.active ? 'Usuário desativado' : 'Usuário ativado',
        `${user.name} agora está ${user.active ? 'inativo' : 'ativo'}`
      );
    } catch {
      onToast('Erro ao atualizar status do usuário', undefined, 'error');
    }
  };

  return (
    <div
      id="admin-users-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto"
    >
      <div
        id="admin-users-card"
        className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-100 p-6 my-8 animate-in zoom-in-95 duration-150"
      >
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
          <div className="flex items-center gap-3">
            <div
              className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${
                isAdmin ? 'bg-blue-50 text-blue-600 border border-blue-200' : 'bg-amber-50 text-amber-600 border border-amber-200'
              }`}
            >
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="modal-admin-title" className="text-xl font-bold text-slate-900">
                  {isAdmin ? 'Gerenciamento & Administração' : 'Área do Administrador'}
                </h2>
                {isAdmin && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700">
                    Sessão Admin Ativa
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500">
                {isAdmin
                  ? 'Controle de funcionários, senhas, catálogo, planilhas e fornecedores'
                  : 'Faça login com usuário de administrador para gerenciar a loja'}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0">
            {/* Exactly the 3 requested action buttons from header: Sheets, Catalog, Suppliers */}
            <div className="flex items-center gap-1.5 p-1 bg-slate-50 border border-slate-200/80 rounded-xl shadow-2xs">
              {/* Google Sheets button */}
              <button
                id="btn-admin-header-sheets"
                type="button"
                onClick={() => {
                  onClose();
                  onOpenSheets?.();
                }}
                className="w-8 h-8 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-600 border border-emerald-200/80 flex items-center justify-center transition-colors cursor-pointer"
                title="Exportar para Google Sheets"
                aria-label="Google Sheets"
              >
                <FileSpreadsheet className="w-4 h-4" />
              </button>

              {/* Product Catalog button */}
              <button
                id="btn-admin-header-catalog"
                type="button"
                onClick={() => {
                  onClose();
                  onOpenCatalog?.();
                }}
                className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 flex items-center justify-center transition-colors cursor-pointer"
                title="Base de Produtos (Catálogo Completo)"
                aria-label="Catálogo de Produtos"
              >
                <Package className="w-4 h-4" />
              </button>

              {/* Suppliers button */}
              <button
                id="btn-admin-header-suppliers"
                type="button"
                onClick={() => {
                  onClose();
                  onOpenSuppliers?.();
                }}
                className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 flex items-center justify-center transition-colors cursor-pointer relative"
                title="Fornecedores (Contatos, Telefones e Senhas)"
                aria-label="Fornecedores"
              >
                <Truck className="w-4 h-4" />
                {typeof supplierCount === 'number' && supplierCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[14px] h-[14px] px-0.5 bg-blue-600 text-white text-[8px] font-bold rounded-full flex items-center justify-center border border-white">
                    {supplierCount > 9 ? '9+' : supplierCount}
                  </span>
                )}
              </button>
            </div>

            <button
              id="btn-close-admin-modal"
              type="button"
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Quick Access Modules Cards */}
        <div className="mt-3.5 p-2.5 bg-slate-50/80 rounded-2xl border border-slate-200/80">
          <div className="flex items-center justify-between mb-2 px-1">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Abas e Módulos do Sistema
            </span>
            <span className="text-[10px] font-semibold text-slate-400">
              Clique nos ícones para navegar
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {/* Sheets Module */}
            <button
              id="btn-admin-card-sheets"
              type="button"
              onClick={() => {
                onClose();
                onOpenSheets?.();
              }}
              className="p-2 bg-white hover:bg-emerald-50/50 border border-slate-200 hover:border-emerald-300 rounded-xl flex items-center gap-2 transition-all text-left cursor-pointer group shadow-2xs"
            >
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-200/80 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <FileSpreadsheet className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="text-xs font-bold text-slate-800 block truncate group-hover:text-emerald-900">
                  Google Sheets
                </span>
                <span className="text-[10px] text-slate-400 hidden sm:block truncate">
                  Exportar e Sincronizar
                </span>
              </div>
            </button>

            {/* Catalog Module */}
            <button
              id="btn-admin-card-catalog"
              type="button"
              onClick={() => {
                onClose();
                onOpenCatalog?.();
              }}
              className="p-2 bg-white hover:bg-blue-50/50 border border-slate-200 hover:border-blue-300 rounded-xl flex items-center gap-2 transition-all text-left cursor-pointer group shadow-2xs"
            >
              <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 border border-slate-200 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <Package className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="text-xs font-bold text-slate-800 block truncate group-hover:text-blue-900">
                  Catálogo
                </span>
                <span className="text-[10px] text-slate-400 hidden sm:block truncate">
                  Base de Produtos
                </span>
              </div>
            </button>

            {/* Suppliers Module */}
            <button
              id="btn-admin-card-suppliers"
              type="button"
              onClick={() => {
                onClose();
                onOpenSuppliers?.();
              }}
              className="p-2 bg-white hover:bg-indigo-50/50 border border-slate-200 hover:border-indigo-300 rounded-xl flex items-center gap-2 transition-all text-left cursor-pointer group shadow-2xs"
            >
              <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 border border-slate-200 flex items-center justify-center shrink-0 relative group-hover:scale-105 transition-transform">
                <Truck className="w-4 h-4" />
                {typeof supplierCount === 'number' && supplierCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[14px] h-[14px] px-0.5 bg-blue-600 text-white text-[8px] font-bold rounded-full flex items-center justify-center border border-white">
                    {supplierCount > 9 ? '9+' : supplierCount}
                  </span>
                )}
              </div>
              <div className="min-w-0">
                <span className="text-xs font-bold text-slate-800 block truncate group-hover:text-indigo-900">
                  Fornecedores
                </span>
                <span className="text-[10px] text-slate-400 hidden sm:block truncate">
                  Contatos e Senhas
                </span>
              </div>
            </button>
          </div>
        </div>

        {/* Navigation Tabs inside modal - fixed without horizontal scroll */}
        <div className="mt-4 pb-2 border-b border-slate-100">
          {isAdmin ? (
            <div className="grid grid-cols-3 sm:flex sm:items-center gap-1.5 sm:gap-2">
              <button
                type="button"
                onClick={() => {
                  setTab('users');
                  handleResetUserForm();
                }}
                className={`px-2.5 sm:px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer text-center ${
                  tab === 'users' ? 'bg-blue-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <Users className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">Usuários ({users.length})</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  handleResetUserForm();
                  setTab('adduser');
                }}
                className={`px-2.5 sm:px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer text-center ${
                  tab === 'adduser' && !editingUserId
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <UserPlus className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">+ Novo</span>
              </button>
              <button
                type="button"
                onClick={() => setTab('switch')}
                className={`px-2.5 sm:px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer text-center ${
                  tab === 'switch' ? 'bg-blue-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <User className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">Trocar Ativo</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  onLogoutAdmin();
                  onToast('Sessão de Administrador encerrada', 'Retornando ao modo funcionário.');
                  onClose();
                }}
                className="col-span-3 sm:ml-auto px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 flex items-center justify-center sm:justify-start gap-1.5 cursor-pointer transition-colors"
                title="Sair do modo administrador"
              >
                <LogOut className="w-3.5 h-3.5 shrink-0" />
                <span>Sair do Admin</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setTab('login')}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  tab === 'login' ? 'bg-blue-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <Lock className="w-4 h-4 shrink-0" />
                <span>Login Admin</span>
              </button>
              <button
                type="button"
                onClick={() => setTab('switch')}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  tab === 'switch' ? 'bg-blue-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <User className="w-4 h-4 shrink-0" />
                <span>Trocar Funcionário</span>
              </button>
            </div>
          )}
        </div>

        {/* Tab 1: Admin Login */}
        {tab === 'login' && !isAdmin && (
          <form onSubmit={handleAdminLogin} className="mt-5 space-y-4 max-w-md mx-auto py-2">
            <div className="text-center mb-4">
              <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 mx-auto flex items-center justify-center mb-2">
                <Lock className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Acesso Restrito ao Administrador</h3>
              <p className="text-xs text-slate-500 mt-1">
                Apenas administradores podem excluir produtos, alterar responsáveis e cadastrar usuários.
              </p>
            </div>

            {loginError && (
              <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{loginError}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Usuário Admin
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="admin-login-username"
                  type="text"
                  value={loginUsername}
                  onChange={(e) => setLoginUsername(e.target.value)}
                  placeholder="admin"
                  required
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:border-blue-500 focus:outline-hidden"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Senha
              </label>
              <div className="relative">
                <Key className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="admin-login-password"
                  type="password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="Senha (padrão: 123)"
                  required
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:border-blue-500 focus:outline-hidden"
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-1.5">
                Dica inicial: usuário <b>admin</b> / senha <b>123</b>
              </p>
            </div>

            <button
              id="btn-admin-login-submit"
              type="submit"
              disabled={isLoggingIn}
              className="w-full bg-blue-600 hover:bg-blue-700 active:scale-98 text-white font-bold py-3 rounded-xl shadow-md shadow-blue-500/20 text-sm transition-all cursor-pointer disabled:opacity-50"
            >
              {isLoggingIn ? 'Autenticando...' : 'Entrar como Administrador'}
            </button>
          </form>
        )}

        {/* Tab 2: Users List (Admin only) */}
        {tab === 'users' && isAdmin && (
          <div className="mt-4 space-y-3">
            <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 rounded-2xl border border-slate-200/90 bg-white">
              {users.map((u) => {
                const isCurrent = currentUser.id === u.id;
                return (
                  <div
                    key={u.id}
                    className="p-3.5 flex items-center justify-between gap-3 hover:bg-slate-50/70 transition-colors"
                  >
                    {/* Avatar & User Details */}
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0"
                        style={{
                          borderColor: u.avatarColor,
                          borderWidth: '2px',
                          color: u.avatarColor,
                          backgroundColor: `${u.avatarColor}15`,
                        }}
                      >
                        {u.avatarInitial}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-bold text-slate-900 truncate">{u.name}</p>
                          {u.role === 'admin' ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700">
                              Admin
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-600">
                              Funcionário
                            </span>
                          )}
                          {isCurrent && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700">
                              Você
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400">
                          @{u.username} • Senha: {u.password ? '••••' : 'Sem senha'} •{' '}
                          <span className={u.active ? 'text-emerald-600 font-medium' : 'text-rose-500 font-medium'}>
                            {u.active ? 'Ativo' : 'Inativo'}
                          </span>
                        </p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      {/* Toggle status (Active / Inactive) */}
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(u)}
                        disabled={isCurrent && u.role === 'admin'}
                        className={`p-2 rounded-xl transition-colors cursor-pointer ${
                          u.active
                            ? 'text-emerald-600 hover:bg-emerald-50'
                            : 'text-slate-400 hover:bg-slate-100'
                        }`}
                        title={u.active ? 'Desativar usuário' : 'Ativar usuário'}
                      >
                        <Power className="w-4 h-4" />
                      </button>

                      {/* Edit user */}
                      <button
                        type="button"
                        onClick={() => handleStartEditUser(u)}
                        className="p-2 rounded-xl text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                        title="Editar usuário"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>

                      {/* Delete user */}
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm(`Deseja realmente remover o usuário "${u.name}"?`)) {
                            onDeleteUser(u.id);
                            onToast('Usuário removido', u.name);
                          }
                        }}
                        disabled={isCurrent}
                        className={`p-2 rounded-xl transition-colors cursor-pointer ${
                          isCurrent
                            ? 'text-slate-200 cursor-not-allowed'
                            : 'text-rose-600 hover:bg-rose-50'
                        }`}
                        title={isCurrent ? 'Não é possível remover a si mesmo' : 'Excluir usuário'}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab 3: Add / Edit User Form (Admin only) */}
        {tab === 'adduser' && isAdmin && (
          <form onSubmit={handleSaveUser} className="mt-4 space-y-4">
            <h3 className="text-sm font-bold text-slate-800">
              {editingUserId ? 'Editar Usuário' : 'Cadastrar Novo Usuário / Funcionário'}
            </h3>

            {formError && (
              <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Nome Completo <span className="text-rose-500">*</span>
                </label>
                <input
                  id="admin-form-name"
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(capitalizeWords(e.target.value))}
                  placeholder="Ex: Carlos Oliveira"
                  autoCapitalize="words"
                  autoComplete="off"
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:border-blue-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Usuário de Acesso <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={formUsername}
                  onChange={(e) => setFormUsername(e.target.value)}
                  placeholder="Ex: carlos"
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:border-blue-500 focus:outline-hidden"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Senha de Acesso
                </label>
                <input
                  type="text"
                  value={formPassword}
                  onChange={(e) => setFormPassword(e.target.value)}
                  placeholder="Ex: 123"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:border-blue-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Tipo de Conta (Papel)
                </label>
                <select
                  value={formRole}
                  onChange={(e) => setFormRole(e.target.value as UserRole)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:border-blue-500 focus:outline-hidden"
                >
                  <option value="employee">Funcionário (Adiciona e edita produtos)</option>
                  <option value="admin">Administrador (Acesso total)</option>
                </select>
              </div>
            </div>

            {/* Avatar Color Picker */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Cor do Avatar / Identificador
              </label>
              <div className="flex items-center gap-2">
                {AVATAR_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setFormColor(c)}
                    className={`w-7 h-7 rounded-full transition-transform cursor-pointer ${
                      formColor === c ? 'scale-125 ring-2 ring-slate-800 ring-offset-2' : 'hover:scale-110'
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>

            {/* Active Status toggle */}
            <div className="flex items-center gap-2 pt-1">
              <input
                id="user-active-toggle"
                type="checkbox"
                checked={formActive}
                onChange={(e) => setFormActive(e.target.checked)}
                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
              />
              <label htmlFor="user-active-toggle" className="text-xs font-semibold text-slate-700 cursor-pointer">
                Usuário ativo (pode adicionar e gerenciar produtos na loja)
              </label>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  handleResetUserForm();
                  setTab('users');
                }}
                className="px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSavingUser}
                className="bg-blue-600 hover:bg-blue-700 active:scale-98 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-sm transition-all cursor-pointer disabled:opacity-50"
              >
                {isSavingUser ? 'Salvando...' : editingUserId ? 'Salvar Usuário' : 'Cadastrar Usuário'}
              </button>
            </div>
          </form>
        )}

        {/* Tab 4: Switch Active User */}
        {tab === 'switch' && (
          <div className="mt-4 space-y-3">
            <p className="text-xs text-slate-500 mb-2">
              Selecione o funcionário atual para que novos produtos sejam automaticamente associados a você:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-72 overflow-y-auto">
              {users
                .filter((u) => u.active)
                .map((u) => {
                  const isCurrent = currentUser.id === u.id;
                  return (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => {
                        onSwitchUser(u);
                        onToast(`Conectado como ${u.name}`);
                        onClose();
                      }}
                      className={`p-3 rounded-2xl border text-left flex items-center gap-3 transition-all cursor-pointer ${
                        isCurrent
                          ? 'border-blue-500 bg-blue-50/50 shadow-xs'
                          : 'border-slate-200/80 bg-white hover:border-slate-300'
                      }`}
                    >
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0"
                        style={{
                          borderColor: u.avatarColor,
                          borderWidth: '2px',
                          color: u.avatarColor,
                          backgroundColor: `${u.avatarColor}15`,
                        }}
                      >
                        {u.avatarInitial}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-slate-900 truncate">{u.name}</p>
                        <p className="text-xs text-slate-400">
                          {u.role === 'admin' ? 'Administrador' : 'Funcionário'}
                        </p>
                      </div>
                      {isCurrent && <CheckCircle className="w-5 h-5 text-blue-600 shrink-0" />}
                    </button>
                  );
                })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
