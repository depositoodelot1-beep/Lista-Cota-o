import React, { useState } from 'react';
import {
  X,
  Mail,
  Lock,
  Building2,
  ArrowRight,
  ShieldCheck,
  UserCheck,
  AlertCircle,
  Sparkles,
  Phone,
  Eye,
  EyeOff,
  Key,
} from 'lucide-react';
import { Supplier } from '../types';
import { auth } from '../firebase';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';

interface SupplierEmailLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  suppliers: Supplier[];
  onLoginSupplier: (supplier: Supplier) => void;
  onRegisterAndLoginSupplier: (supplierData: Omit<Supplier, 'id'>) => Promise<Supplier>;
  onToast: (title: string, description?: string, type?: 'success' | 'error' | 'info') => void;
}

export const SupplierEmailLoginModal: React.FC<SupplierEmailLoginModalProps> = ({
  isOpen,
  onClose,
  suppliers,
  onLoginSupplier,
  onRegisterAndLoginSupplier,
  onToast,
}) => {
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [companyNameInput, setCompanyNameInput] = useState('');
  const [phoneInput, setPhoneInput] = useState('');
  const [needsRegistration, setNeedsRegistration] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  // Search if email already matches a supplier
  const cleanEmail = emailInput.trim().toLowerCase();
  const matchedSupplier = cleanEmail
    ? suppliers.find((s) => s.email?.trim().toLowerCase() === cleanEmail)
    : null;

  const handleGoogleLogin = async () => {
    setErrorMsg(null);
    setIsLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      const googleEmail = user.email?.trim().toLowerCase();

      if (!googleEmail) {
        setErrorMsg('A conta Google não possui um e-mail válido.');
        setIsLoading(false);
        return;
      }

      const found = suppliers.find((s) => s.email?.trim().toLowerCase() === googleEmail);
      if (found) {
        onLoginSupplier(found);
        onToast('Acesso com Google!', `Bem-vindo de volta, ${found.name}.`, 'success');
        onClose();
      } else {
        const newSupplier = await onRegisterAndLoginSupplier({
          name: user.displayName || 'Fornecedor Google',
          email: googleEmail,
          phone: user.phoneNumber || '',
          contactPerson: user.displayName || 'Representante',
          category: 'Fornecedor',
          notes: 'Cadastrado via Google Sign-In',
          createdAt: new Date().toISOString(),
        });
        onLoginSupplier(newSupplier);
        onToast('Conta Cadastrada!', `Empresa ${newSupplier.name} conectada via Google.`, 'success');
        onClose();
      }
    } catch (err: any) {
      console.error('Google login error:', err);
      setErrorMsg(err?.message || 'Falha ao autenticar com Google. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!cleanEmail || !cleanEmail.includes('@')) {
      setErrorMsg('Por favor, informe um endereço de e-mail corporativo válido.');
      return;
    }

    if (!passwordInput.trim()) {
      setErrorMsg('Informe a senha de acesso criada pelo administrador da loja.');
      return;
    }

    setIsLoading(true);

    try {
      if (matchedSupplier) {
        // Verify administrator-created password
        if (!matchedSupplier.password) {
          setErrorMsg(
            `O fornecedor "${matchedSupplier.name}" ainda não possui uma senha configurada. Solicite ao administrador da loja a geração da senha na aba Fornecedores.`
          );
          setIsLoading(false);
          return;
        }

        if (passwordInput.trim() !== matchedSupplier.password.trim()) {
          setErrorMsg(
            `Senha incorreta para ${matchedSupplier.name}. Digite a senha gerada pelo administrador da loja.`
          );
          setIsLoading(false);
          return;
        }

        // Log in as this existing supplier
        onLoginSupplier(matchedSupplier);
        onToast('Acesso Concedido!', `Bem-vindo, ${matchedSupplier.name}. Acesso restrito à cotação de produtos.`, 'success');
        onClose();
      } else if (!needsRegistration) {
        // Email not found: prompt user
        setErrorMsg(
          'E-mail não localizado na lista de fornecedores. Verifique com o administrador da loja se seu cadastro e senha já foram realizados.'
        );
        setIsLoading(false);
        return;
      } else {
        // Register new supplier and log in
        if (!companyNameInput.trim()) {
          setErrorMsg('Informe o nome da sua empresa ou fornecedor.');
          setIsLoading(false);
          return;
        }

        const newSupplier = await onRegisterAndLoginSupplier({
          name: companyNameInput.trim(),
          email: cleanEmail,
          phone: phoneInput.trim() || '',
          password: passwordInput.trim(),
          contactPerson: 'Representante',
          category: 'Fornecedor',
          notes: 'Cadastrado pelo acesso com e-mail e senha',
          createdAt: new Date().toISOString(),
        });

        onLoginSupplier(newSupplier);
        onToast('Cadastro Concluído!', `Empresa ${newSupplier.name} conectada à cotação de produtos.`, 'success');
        onClose();
      }
    } catch (err: any) {
      console.error('Error logging in supplier by email and password:', err);
      setErrorMsg(err?.message || 'Falha ao autenticar fornecedor. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3.5 z-50">
      <div className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 flex flex-col max-h-[92vh]">
        {/* Header com destaque de segurança */}
        <div className="bg-slate-900 text-white p-5 relative shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 text-slate-400 hover:text-white p-1.5 rounded-full hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-emerald-600 flex items-center justify-center text-white shadow-md shrink-0">
              <Lock className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-950 text-emerald-400 border border-emerald-700/60 px-2 py-0.5 rounded-full">
                  Área do Fornecedor
                </span>
              </div>
              <h2 className="text-lg font-black text-white tracking-tight mt-1">
                Acesso à Cotação de Produtos
              </h2>
            </div>
          </div>

          <p className="text-xs text-slate-300 mt-2.5 leading-relaxed">
            Entre com seu <strong>e-mail cadastrado</strong> e a <strong>senha gerada pelo administrador</strong> para preencher e enviar seus preços com total sigilo.
          </p>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-4 text-slate-700">
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span className="leading-relaxed">{errorMsg}</span>
            </div>
          )}

          {/* Botão de Login com Google */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-white hover:bg-slate-50 text-slate-700 font-bold text-sm rounded-2xl border border-slate-300 shadow-xs transition-all cursor-pointer active:scale-98 disabled:opacity-50"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"/>
              <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.19v3.15C3.17 21.32 7.22 24 12 24z"/>
              <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.19C.43 8.1 0 9.8 0 12s.43 3.9 1.19 5.42l4.09-3.15z"/>
              <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.22 0 3.17 2.68 1.19 6.58l4.09 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
            </svg>
            <span>Entrar com o Google</span>
          </button>

          <div className="flex items-center my-2">
            <div className="flex-grow border-t border-slate-200"></div>
            <span className="px-3 text-xs text-slate-400 font-semibold uppercase">ou com senha</span>
            <div className="flex-grow border-t border-slate-200"></div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Input E-mail */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center justify-between">
                <span>E-mail do Fornecedor *</span>
                {matchedSupplier && (
                  <span className="text-emerald-600 text-[11px] font-extrabold flex items-center gap-1">
                    <UserCheck className="w-3.5 h-3.5" />
                    {matchedSupplier.name}
                  </span>
                )}
              </label>

              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={emailInput}
                  onChange={(e) => {
                    setEmailInput(e.target.value);
                    if (errorMsg) setErrorMsg(null);
                  }}
                  placeholder="exemplo: vendas@empresa.com.br"
                  required
                  autoFocus
                  className="w-full bg-slate-50 text-slate-900 font-bold text-sm pl-10 pr-4 py-3 rounded-2xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all shadow-2xs"
                />
              </div>
            </div>

            {/* Input Senha do Administrador */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Senha criada pelo Administrador *</span>
                </span>
                {matchedSupplier?.password && (
                  <span className="text-slate-400 text-[10px] font-semibold">
                    Senha configurada
                  </span>
                )}
              </label>

              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={passwordInput}
                  onChange={(e) => {
                    setPasswordInput(e.target.value);
                    if (errorMsg) setErrorMsg(null);
                  }}
                  placeholder="Digite sua senha de acesso"
                  required
                  className="w-full bg-slate-50 text-slate-900 font-bold text-sm pl-10 pr-10 py-3 rounded-2xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all shadow-2xs font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                  title={showPassword ? 'Ocultar senha' : 'Ver senha'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[11px] text-slate-500 mt-1 leading-tight">
                A senha é gerada pelo lojista na aba <strong>Fornecedores</strong>.
              </p>
            </div>

            {/* If email not recognized: request company name */}
            {needsRegistration && !matchedSupplier && (
              <div className="p-3.5 bg-amber-50/90 border border-amber-200 rounded-2xl space-y-3 animate-in fade-in">
                <div className="flex items-start gap-2">
                  <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-900 font-semibold leading-relaxed">
                    E-mail não localizado previamente. Preencha os dados da sua empresa para liberar seu acesso imediatamente:
                  </p>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Nome da Empresa / Fornecedor *
                  </label>
                  <div className="relative">
                    <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={companyNameInput}
                      onChange={(e) => setCompanyNameInput(e.target.value)}
                      placeholder="Ex: Bartofil, Thibabem, etc."
                      required
                      className="w-full bg-white text-slate-900 font-bold text-xs pl-9 pr-3 py-2 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Telefone / WhatsApp (Opcional)
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={phoneInput}
                      onChange={(e) => setPhoneInput(e.target.value)}
                      placeholder="(31) 99999-9999"
                      className="w-full bg-white text-slate-900 font-medium text-xs pl-9 pr-3 py-2 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Botão de envio */}
            <button
              type="submit"
              disabled={isLoading || !cleanEmail || !passwordInput}
              className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 disabled:opacity-50 text-white font-extrabold text-sm rounded-2xl flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
            >
              {isLoading ? (
                <span>Validando credenciais...</span>
              ) : matchedSupplier ? (
                <>
                  <span>Entrar como {matchedSupplier.name}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              ) : (
                <>
                  <span>Acessar Cotação de Produtos</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Aviso de Sigilo e Restrição de Dados */}
          <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-2xl flex items-start gap-2.5">
            <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div className="text-[11px] text-slate-600 leading-relaxed">
              <strong className="text-slate-800 block">Privacidade e Sigilo Garantidos:</strong>
              O fornecedor só visualiza e insere cotações para sua própria empresa. O estoque interno, as listas dos clientes e os preços dos concorrentes nunca são exibidos.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
