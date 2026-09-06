# Lista de Compras & Controle de Reposição

Aplicativo completo de lista de compras, catálogo de produtos, controle de reposição e gestão de fornecedores, construído com **React**, **TypeScript**, **Tailwind CSS v4** e **Firebase Firestore**.

---

## 🚀 Como Fazer Deploy na Vercel

### 1. Enviar para o GitHub
Se você exportou o projeto (via menu do AI Studio ou baixou o ZIP):
1. Crie um repositório no seu GitHub.
2. Faça commit e push de todos os arquivos do projeto para o repositório.

### 2. Importar na Vercel
1. Acesse [vercel.com](https://vercel.com) e faça login.
2. Clique em **Add New...** > **Project**.
3. Selecione o repositório do seu GitHub.
4. A Vercel detectará automaticamente as configurações graças ao arquivo `vercel.json`:
   - **Framework Preset**: `Vite`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`
5. *(Opcional)* Em **Environment Variables**, você pode adicionar variáveis se desejar sobrescrever as credenciais, mas o projeto já possui fallback automático para o arquivo `firebase-applet-config.json` incluso no repositório.
6. Clique em **Deploy**.

---

## 🛠️ Comandos Locais

```bash
# Instalar dependências
npm install

# Iniciar ambiente de desenvolvimento
npm run dev

# Gerar build de produção
npm run build

# Pré-visualizar o build localmente
npm run preview

# Verificar erros de tipagem
npm run lint
```
