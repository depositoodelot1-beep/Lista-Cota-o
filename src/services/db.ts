import {
  collection,
  doc,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  getDocs,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase';
import { Product, AppUser, Supplier } from '../types';

const PRODUCTS_COLLECTION = 'products';
const USERS_COLLECTION = 'app_users';
const SUPPLIERS_COLLECTION = 'suppliers';

export const DEFAULT_SUPPLIERS: Supplier[] = [
  {
    id: 'supp-tigre',
    name: 'Tigre Tubos e Conexões',
    phone: '(11) 98765-4321',
    email: 'vendas@tigre.com.br',
    contactPerson: 'Rogério (Representante Comercial)',
    category: 'Hidráulica',
    notes: 'Entrega todas as terças e quintas. Pedido mínimo R$ 400,00.',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'supp-amanco',
    name: 'Amanco Wavin Brasil',
    phone: '(11) 97654-3210',
    email: 'pedidos@amanco.com.br',
    contactPerson: 'Juliana Pedidos',
    category: 'Tubos e Conexões',
    notes: 'Faturamento em 28 dias para pedidos acima de R$ 800,00.',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'supp-distribuidora',
    name: 'Distribuidora Silva & Cia',
    phone: '(11) 99123-4567',
    email: 'contato@silvadistribuidora.com.br',
    contactPerson: 'Carlos Silva',
    category: 'Materiais Gerais',
    notes: 'Entrega expressa no mesmo dia para pedidos até às 11h.',
    createdAt: new Date().toISOString(),
  },
];


export const DEFAULT_USERS: AppUser[] = [
  {
    id: 'user-eduardo',
    username: 'eduardo',
    name: 'Eduardo',
    role: 'employee',
    password: '123',
    active: true,
    avatarColor: '#0284c7', // Sky / Blue like 'E' in image
    avatarInitial: 'E',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'user-admin',
    username: 'admin',
    name: 'Administrador (Gerente)',
    role: 'admin',
    password: '123',
    active: true,
    avatarColor: '#10b981', // Teal / Green like 'A' in image
    avatarInitial: 'A',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'user-carlos',
    username: 'carlos',
    name: 'Carlos M.',
    role: 'employee',
    password: '123',
    active: true,
    avatarColor: '#64748b', // Slate / Gray like 'C' in image
    avatarInitial: 'C',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'user-joao',
    username: 'joao',
    name: 'João Silva',
    role: 'employee',
    password: '123',
    active: true,
    avatarColor: '#8b5cf6', // Violet / Purple like 'J' in image
    avatarInitial: 'J',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'user-maria',
    username: 'maria',
    name: 'Maria Regina',
    role: 'employee',
    password: '123',
    active: true,
    avatarColor: '#f43f5e', // Rose / Pink like 'M' in image
    avatarInitial: 'M',
    createdAt: new Date().toISOString(),
  },
];

const DEFAULT_PRODUCTS: Omit<Product, 'id'>[] = [
  {
    name: 'Tê sold 20',
    brand: 'Tigre',
    quantity: 2,
    unit: 'un',
    responsibleId: 'user-eduardo',
    responsibleName: 'Eduardo',
    responsibleInitial: 'E',
    responsibleColor: '#ec4899',
    status: 'baixo_estoque',
    urgency: 'urgente',
    barcode: '7891234567890',
    notes: 'Restam apenas 2 peças na prateleira B3',
    createdAt: new Date().toISOString(),
  },
  {
    name: 'Luva soldável 25mm',
    brand: 'Amanco',
    quantity: 0,
    unit: 'un',
    responsibleId: 'user-lucas',
    responsibleName: 'Lucas',
    responsibleInitial: 'L',
    responsibleColor: '#3b82f6',
    status: 'em_falta',
    urgency: 'urgente',
    barcode: '7898901234567',
    notes: 'Acabou totalmente no balcão principal',
    createdAt: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    name: 'Fita veda rosca 18x25',
    brand: 'Tigre',
    quantity: 4,
    unit: 'un',
    responsibleId: 'user-sofia',
    responsibleName: 'Sofia',
    responsibleInitial: 'S',
    responsibleColor: '#10b981',
    status: 'baixo_estoque',
    urgency: 'normal',
    barcode: '7896543210987',
    notes: 'Pedir caixa fechada com 24 unidades',
    createdAt: new Date(Date.now() - 7200000).toISOString(),
  },
];

// Initialize users and sample products if empty
export async function initializeDefaultData(): Promise<void> {
  try {
    const usersSnapshot = await getDocs(collection(db, USERS_COLLECTION));
    if (usersSnapshot.empty) {
      for (const u of DEFAULT_USERS) {
        await setDoc(doc(db, USERS_COLLECTION, u.id), u);
      }
    }

    const prodSnapshot = await getDocs(collection(db, PRODUCTS_COLLECTION));
    if (prodSnapshot.empty) {
      for (const p of DEFAULT_PRODUCTS) {
        await addDoc(collection(db, PRODUCTS_COLLECTION), p);
      }
    }
  } catch (error) {
    console.warn('Could not initialize remote Firestore seed, will fallback to local storage if offline:', error);
  }
}

// Subscribe to products in real-time
export function subscribeToProducts(
  callback: (products: Product[]) => void,
  onError?: (error: Error) => void
) {
  try {
    const q = query(collection(db, PRODUCTS_COLLECTION), orderBy('createdAt', 'desc'));
    return onSnapshot(
      q,
      (snapshot) => {
        const items: Product[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          items.push({
            id: docSnap.id,
            name: data.name || '',
            brand: data.brand || '',
            quantity: Number(data.quantity ?? 0),
            unit: data.unit || 'un',
            responsibleId: data.responsibleId || '',
            responsibleName: data.responsibleName || 'Funcionário',
            responsibleInitial: data.responsibleInitial || 'F',
            responsibleColor: data.responsibleColor || '#3b82f6',
            status: data.status || (Number(data.quantity) === 0 ? 'em_falta' : 'baixo_estoque'),
            urgency: data.urgency || 'normal',
            barcode: data.barcode || '',
            notes: data.notes || '',
            imageUrl: data.imageUrl || '',
            createdAt: data.createdAt || new Date().toISOString(),
            updatedAt: data.updatedAt,
          });
        });
        callback(items);
      },
      (err) => {
        console.error('Firestore products subscription error:', err);
        if (onError) onError(err);
      }
    );
  } catch (error: any) {
    if (onError) onError(error);
    return () => {};
  }
}

// Subscribe to users
export function subscribeToUsers(
  callback: (users: AppUser[]) => void,
  onError?: (error: Error) => void
) {
  try {
    return onSnapshot(
      collection(db, USERS_COLLECTION),
      (snapshot) => {
        const users: AppUser[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          users.push({
            id: docSnap.id,
            username: data.username || '',
            name: data.name || '',
            role: data.role || 'employee',
            password: data.password || '123',
            active: data.active !== false,
            avatarColor: data.avatarColor || '#3b82f6',
            avatarInitial: data.avatarInitial || data.name?.[0]?.toUpperCase() || 'U',
            createdAt: data.createdAt || new Date().toISOString(),
          });
        });
        if (users.length === 0) {
          callback(DEFAULT_USERS);
        } else {
          callback(users);
        }
      },
      (err) => {
        console.error('Firestore users subscription error:', err);
        if (onError) onError(err);
      }
    );
  } catch (error: any) {
    if (onError) onError(error);
    return () => {};
  }
}

// Helper to strip undefined values so Firestore never throws 'Unsupported field value: undefined'
function cleanFirestorePayload<T extends Record<string, any>>(obj: T): Record<string, any> {
  const clean: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      clean[key] = value;
    }
  }
  return clean;
}

// Product CRUD
export async function addProduct(product: Omit<Product, 'id'>): Promise<string> {
  const payload = cleanFirestorePayload({
    ...product,
    createdAt: new Date().toISOString(),
    serverTime: serverTimestamp(),
  });
  const docRef = await addDoc(collection(db, PRODUCTS_COLLECTION), payload);
  return docRef.id;
}

export async function updateProduct(id: string, updates: Partial<Product>): Promise<void> {
  const ref = doc(db, PRODUCTS_COLLECTION, id);
  const payload = cleanFirestorePayload({
    ...updates,
    updatedAt: new Date().toISOString(),
  });
  await updateDoc(ref, payload);
}

export async function deleteProduct(id: string): Promise<void> {
  const ref = doc(db, PRODUCTS_COLLECTION, id);
  await deleteDoc(ref);
}

// User Management CRUD
export async function createUser(user: Omit<AppUser, 'id'>): Promise<string> {
  const customId = `user-${Date.now()}`;
  const payload = cleanFirestorePayload({
    ...user,
    id: customId,
    createdAt: new Date().toISOString(),
  });
  await setDoc(doc(db, USERS_COLLECTION, customId), payload);
  return customId;
}

export async function updateUser(id: string, updates: Partial<AppUser>): Promise<void> {
  const ref = doc(db, USERS_COLLECTION, id);
  const payload = cleanFirestorePayload(updates);
  await updateDoc(ref, payload);
}

export async function deleteUser(id: string): Promise<void> {
  const ref = doc(db, USERS_COLLECTION, id);
  await deleteDoc(ref);
}

// ==================== SUPPLIERS (FORNECEDORES) ====================

// Subscribe to suppliers real-time
export function subscribeToSuppliers(
  callback: (suppliers: Supplier[]) => void,
  onError?: (error: Error) => void
) {
  try {
    const q = query(collection(db, SUPPLIERS_COLLECTION), orderBy('createdAt', 'desc'));
    return onSnapshot(
      q,
      async (snapshot) => {
        if (snapshot.empty) {
          // Initialize with default suppliers if collection is empty
          try {
            const batchPromises = DEFAULT_SUPPLIERS.map((supp) => {
              const { id, ...data } = supp;
              return setDoc(doc(db, SUPPLIERS_COLLECTION, id), cleanFirestorePayload({
                ...data,
                id,
                createdAt: new Date().toISOString(),
              }));
            });
            await Promise.all(batchPromises);
          } catch (seedErr) {
            console.warn('Could not seed initial suppliers:', seedErr);
            callback(DEFAULT_SUPPLIERS);
            return;
          }
        }

        const suppliers: Supplier[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          suppliers.push({
            id: docSnap.id,
            name: data.name || '',
            phone: data.phone || '',
            email: data.email || '',
            contactPerson: data.contactPerson || '',
            category: data.category || '',
            notes: data.notes || '',
            createdAt: data.createdAt || new Date().toISOString(),
            updatedAt: data.updatedAt,
          });
        });

        // Fallback if empty array
        if (suppliers.length === 0) {
          callback(DEFAULT_SUPPLIERS);
        } else {
          callback(suppliers);
        }
      },
      (err) => {
        console.error('Firestore suppliers subscription error:', err);
        if (onError) onError(err);
      }
    );
  } catch (error: any) {
    if (onError) onError(error);
    return () => {};
  }
}

export async function addSupplier(supplier: Omit<Supplier, 'id'>): Promise<string> {
  const payload = cleanFirestorePayload({
    ...supplier,
    createdAt: new Date().toISOString(),
    serverTime: serverTimestamp(),
  });
  const docRef = await addDoc(collection(db, SUPPLIERS_COLLECTION), payload);
  return docRef.id;
}

export async function updateSupplier(id: string, updates: Partial<Supplier>): Promise<void> {
  const ref = doc(db, SUPPLIERS_COLLECTION, id);
  const payload = cleanFirestorePayload({
    ...updates,
    updatedAt: new Date().toISOString(),
  });
  await updateDoc(ref, payload);
}

export async function deleteSupplier(id: string): Promise<void> {
  const ref = doc(db, SUPPLIERS_COLLECTION, id);
  await deleteDoc(ref);
}

