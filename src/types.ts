export type UserRole = 'admin' | 'employee';

export interface AppUser {
  id: string;
  username: string;
  name: string;
  role: UserRole;
  password?: string; // plain or hashed for simple demo store login
  active: boolean;
  avatarColor: string; // e.g. '#f59e0b', '#ec4899', '#3b82f6', '#10b981'
  avatarInitial: string;
  createdAt: string;
}

export type ProductStatus = 'em_falta' | 'baixo_estoque' | 'comprado';

export type ProductUrgency = 'fixo' | 'novo' | 'normal' | 'urgente';

export function normalizeUrgency(urgency?: string): ProductUrgency {
  if (urgency === 'fixo') return 'fixo';
  if (urgency === 'novo' || urgency === 'baixa') return 'novo';
  if (urgency === 'urgente' || urgency === 'alta') return 'urgente';
  return 'normal';
}

export interface ShoppingList {
  id: string;
  name: string;
  description?: string;
  supplierIds?: string[]; // IDs dos fornecedores associados a esta lista
  createdAt: string;
}

export interface Product {
  id: string;
  name: string;
  brand?: string;
  quantity: number;
  unit: string; // 'un', 'cx', 'pct', 'kg', 'lt'
  responsibleId: string;
  responsibleName: string;
  responsibleInitial: string;
  responsibleColor: string;
  status: ProductStatus;
  urgency: ProductUrgency | 'alta' | 'media' | 'baixa';
  barcode?: string;
  notes?: string;
  imageUrl?: string;
  selectedQuoteId?: string; // ID da cotação escolhida manualmente pelo usuário
  listId?: string; // ID da lista de compras a qual o produto pertence
  createdAt: string; // ISO string
  updatedAt?: string;
}

export type SortField = 'name' | 'quantity' | 'date';
export type SortDirection = 'asc' | 'desc';

export interface Supplier {
  id: string;
  name: string;
  phone: string;
  email: string;
  password?: string; // Senha de acesso gerada pelo administrador para o portal de cotações
  contactPerson?: string;
  category?: string;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface SupplierQuote {
  id: string;
  productId: string;
  productName: string;
  supplierId: string;
  supplierName: string;
  supplierPhone?: string;
  supplierEmail?: string;
  price: number; // Preço ofertado pelo fornecedor
  quantity: number; // Quantidade disponível ou pacote
  unit: string; // un, cx, pct, etc.
  brand: string; // Marca que o fornecedor vende
  notes?: string; // Prazo de entrega, faturamento, observações
  status?: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
  updatedAt?: string;
}

