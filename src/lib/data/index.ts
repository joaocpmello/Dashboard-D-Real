// Camada de dados para o front (Server Components).
//
// Estratégia:
//   - Tenta usar a API real (Prisma) se o Supabase estiver configurado.
//   - Caso contrário, cai para mocks realistas em src/mocks/demo-data.ts
//     sinalizando claramente que está em modo demo.
//
// IMPORTANTE:
//   - O modo demo é apenas para a apresentação enquanto o ambiente Supabase
//     real não está provisionado. Nunca use em produção: ela aparece como
//     "demo" no UI e não persiste nada.
//   - Nenhum segredo é exposto pelos mocks.
//
// A detecção de "modo demo" é feita por:
//   - Ausência de qualquer uma das variáveis de env obrigatórias (Supabase/DB), ou
//   - Flag explícita NEXT_PUBLIC_DEMO_MODE=true (público, apenas opt-in para
//     a apresentação — não concede privilégios).

import { DEMO_MERCHANTS, DEMO_ORG, DEMO_USERS, DEMO_ORDERS } from '@/mocks/demo-data';
import type { MerchantSummary, OrganizationSummary, UserSummary, OrderSummary, CategorySummary, ProductSummary } from './types';

const isUuid = (id: string) => /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(id);

function isDemoMode(): boolean {
  if (process.env.NEXT_PUBLIC_DEMO_MODE === 'true') return true;
  // Se não houver env do Supabase, automaticamente cai em demo.
  const hasSupabase =
    !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
    !!process.env.SUPABASE_SERVICE_ROLE_KEY &&
    !!process.env.DATABASE_URL;
  return !hasSupabase;
}

export const dataMode = {
  isDemo(): boolean {
    return isDemoMode();
  },
};

// ---- Merchants --------------------------------------------------------------

export async function listMerchants(_organizationId: string | null): Promise<MerchantSummary[]> {
  if (isDemoMode()) {
    return DEMO_MERCHANTS;
  }
  // Em produção real, chamaria o repositório com RLS. Mantemos a fronteira
  // clara para a próxima fase: substituir por merchantRepo.list(organizationId).
  const { merchantRepo } = await import('@/repositories/merchants');
  if (!_organizationId) return [];
  const rows = await merchantRepo.list(_organizationId);
  return rows.map((m) => ({
    id: m.id,
    organizationId: m.organizationId,
    ifoodMerchantId: m.ifoodMerchantId,
    name: m.name ?? m.ifoodMerchantId,
    corporateName: m.corporateName,
    city: null, // não persistido no MVP — exibir "—"
    status: m.status,
    lastSyncedAt: m.lastSyncedAt ? m.lastSyncedAt.toISOString() : null,
  }));
}

export async function getMerchant(
  id: string,
  organizationId: string | null,
): Promise<MerchantSummary | null> {
  const all = await listMerchants(organizationId);
  return all.find((m) => m.id === id) ?? null;
}

// ---- Organization -----------------------------------------------------------

export async function getCurrentOrganization(
  _organizationId: string | null,
): Promise<OrganizationSummary | null> {
  if (isDemoMode()) {
    return DEMO_ORG;
  }
  if (!_organizationId || !isUuid(_organizationId)) return null;
  const { prisma } = await import('@/lib/db/prisma');
  const org = await prisma.organization.findUnique({ where: { id: _organizationId } });
  if (!org) return null;
  return {
    id: org.id,
    name: org.name,
    document: org.document,
    createdAt: org.createdAt.toISOString(),
    ifoodConnected: true, // otimista — refinar com ifoodCredentials
    ifoodLastSyncAt: null,
  };
}

// ---- Users ------------------------------------------------------------------

export async function listUsers(_organizationId: string | null): Promise<UserSummary[]> {
  if (isDemoMode()) {
    return DEMO_USERS;
  }
  // Em produção, virá de um novo repositório users por OrganizationUser.
  return [];
}

export async function listCategories(organizationId: string | null): Promise<CategorySummary[]> {
  if (isDemoMode()) {
    return [
      { id: 'cat-1', name: 'Executivas', ifoodCategoryId: 'if-cat-1', active: true },
      { id: 'cat-2', name: 'Fit / Saudável', ifoodCategoryId: 'if-cat-2', active: true },
      { id: 'cat-3', name: 'Bebidas', ifoodCategoryId: 'if-cat-3', active: true },
    ];
  }
  if (!organizationId) return [];
  const { categoryRepo } = await import('@/repositories/categories');
  const rows = await categoryRepo.list(organizationId);
  return rows.map(c => ({
    id: c.id,
    name: c.name,
    ifoodCategoryId: c.ifoodCategoryId,
    active: c.active,
  }));
}

export async function listProducts(organizationId: string | null, categoryId?: string): Promise<ProductSummary[]> {
  if (isDemoMode()) {
    const allProducts: ProductSummary[] = [
      { id: 'p-1', categoryId: 'cat-1', name: 'Frango com Quiabo', description: 'Arroz, feijão e frango', price: 18.90, active: true },
      { id: 'p-2', categoryId: 'cat-1', name: 'Carne de Panela', description: 'Arroz, feijão e carne', price: 21.00, active: true },
      { id: 'p-3', categoryId: 'cat-2', name: 'Frango Grelhado Fit', description: 'Arroz integral e legumes', price: 22.50, active: true },
      { id: 'p-4', categoryId: 'cat-2', name: 'Peixe ao Forno', description: 'Purê de batata e peixe', price: 25.00, active: true },
      { id: 'p-5', categoryId: 'cat-3', name: 'Suco de Laranja', description: '300ml natural', price: 7.00, active: true },
      { id: 'p-6', categoryId: 'cat-3', name: 'Água Mineral', description: '500ml', price: 4.00, active: true },
    ];
    if (categoryId) return allProducts.filter(p => p.categoryId === categoryId);
    return allProducts;
  }
  if (!organizationId) return [];
  const { productRepo } = await import('@/repositories/products');
  const rows = await productRepo.list(organizationId, categoryId);

  // Fetch latest price for each product
  const results = await Promise.all(rows.map(async (p) => {
    const priceRow = await productRepo.getLatestPrice(p.id);
    return {
      id: p.id,
      categoryId: p.categoryId,
      name: p.name,
      description: p.description,
      price: Number(priceRow?.price ?? 0),
      active: p.active,
    };
  }));
  return results;
}

// ---- Orders --------------------------------------------------------------------

export async function listOrders(organizationId: string | null): Promise<OrderSummary[]> {
  if (isDemoMode()) {
    return DEMO_ORDERS;
  }
  if (!organizationId) return [];
  const { orderRepo } = await import('@/repositories/orders');
  const rows = await orderRepo.findMany({ organizationId });
  return rows.map((o) => ({
    id: o.id,
    organizationId: o.organizationId,
    merchantId: o.merchantId,
    ifoodOrderId: o.ifoodOrderId,
    status: o.status,
    total: Number(o.total),
    customerName: o.customerName,
    customerPhone: o.customerPhone,
    customerAddress: o.customerAddress,
    createdAt: o.createdAt.toISOString(),
  }));
}

export async function getOrderDetail(orderId: string, organizationId: string | null): Promise<OrderDetail | null> {
  if (isDemoMode()) {
    const order = DEMO_ORDERS.find(o => o.id === orderId);
    if (!order) return null;
    return {
      ...order,
      items: [
        { id: 'item-1', productName: 'Marmita Fit Frango', quantity: 1, unitPrice: 18.90, totalPrice: 18.90 },
        { id: 'item-2', productName: 'Suco Natural Laranja', quantity: 1, unitPrice: 7.00, totalPrice: 7.00 },
      ],
      statusHistory: [
        { status: 'PLACED', updatedAt: new Date(order.createdAt).toISOString() },
        { status: 'CONFIRMED', updatedAt: new Date(new Date(order.createdAt).getTime() + 1000 * 60 * 5).toISOString() },
        { status: order.status, updatedAt: new Date().toISOString() },
      ],
    };
  }
  if (!organizationId) return null;
  const { orderRepo } = await import('@/repositories/orders');
  const order = await orderRepo.findById(orderId, organizationId);
  if (!order) return null;
  return {
    id: order.id,
    organizationId: order.organizationId,
    merchantId: order.merchantId,
    ifoodOrderId: order.ifoodOrderId,
    status: order.status,
    total: Number(order.total),
    customerName: order.customerName,
    customerPhone: order.customerPhone,
    customerAddress: order.customerAddress,
    createdAt: order.createdAt.toISOString(),
    items: order.items.map(i => ({
      id: i.id,
      productName: i.productName,
      quantity: i.quantity,
      unitPrice: Number(i.unitPrice),
      totalPrice: Number(i.totalPrice),
    })),
    statusHistory: [], // Order status history not yet implemented in Prisma schema
  };
}
