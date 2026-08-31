import 'server-only';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db/prisma';

const isUuid = (id: string) => /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(id);

// Executa uma função dentro de uma transação Prisma que ativa o tenant atual
// via SET LOCAL. RLS passa a filtrar pelas políticas definidas na migration.
//
// `organizationId = null` é reservado para SUPER_ADMIN em modo cross-tenant.
// Nesse caso, queries devem usar um client Prisma privilegiado (BYPASSRLS),
// NÃO este helper — ele exige organizationId.
export async function withTenantContext<T>(
  organizationId: string,
  fn: (tx: Prisma.TransactionClient) => Promise<T>,
): Promise<T> {
  if (!isUuid(organizationId)) {
    throw new Error(`Invalid organizationId format: ${organizationId}. Expected UUID.`);
  }

  return prisma.$transaction(async (tx) => {
    // uuid em string — SET LOCAL aceita string, depois cast no policy.
    await tx.$executeRawUnsafe(
      `SELECT set_config('app.current_org_id', $1, true)`,
      organizationId,
    );
    return fn(tx);
  });
}

// Helper para queries read-only que ainda assim precisam do contexto de tenant
// (defesa em profundidade via RLS).
export async function readWithTenant<T>(
  organizationId: string,
  fn: (tx: Prisma.TransactionClient) => Promise<T>,
): Promise<T> {
  return withTenantContext(organizationId, fn);
}
