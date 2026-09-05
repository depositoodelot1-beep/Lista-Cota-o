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

export type ProductUrgency = 'novo' | 'normal' | 'urgente';

export function normalizeUrgency(urgency?: string): ProductUrgency {
  if (urgency === 'novo' || urgency === 'baixa') return 'novo';
  if (urgency === 'urgente' || urgency === 'alta') return 'urgente';
  return 'normal';
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
  createdAt: string; // ISO string
  updatedAt?: string;
}

export type SortField = 'name' | 'quantity' | 'date';
export type SortDirection = 'asc' | 'desc';
