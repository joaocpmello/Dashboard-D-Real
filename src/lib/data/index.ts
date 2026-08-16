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

import { DEMO_MERCHANTS, DEMO_ORG, DEMO_USERS } from '@/mocks/demo-data';
import type { MerchantSummary, OrganizationSummary, UserSummary } from './types';

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
  if (!_organizationId) return null;
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
