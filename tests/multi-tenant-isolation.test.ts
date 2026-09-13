/**
 * Teste de isolamento multi-tenant.
 *
 * Usa sqlite em memória + Prisma com um provider fake? Não — Prisma não permite
 * trocar provider dinamicamente. Em vez disso, este teste valida que o helper
 * `withTenantContext` chama `set_config` com o organizationId correto e que
 * os repositórios delegam ao helper.
 *
 * Para teste ponta-a-ponta (com Postgres real + RLS), rodar contra o Supabase
 * local ou em CI: ver `tests/multi-tenant-isolation.integration.test.ts.skip`.
 */
import { describe, expect, it, vi } from 'vitest';

// Stub do Prisma que intercepta $transaction.
const $executeRawUnsafe = vi.fn().mockResolvedValue(0);
const findMany = vi.fn();
const count = vi.fn();

vi.mock('@/lib/db/prisma', () => ({
  prisma: {
    $transaction: async (fn: (tx: unknown) => unknown) =>
      fn({
        $executeRawUnsafe,
        merchant: { findMany, count },
      }),
  },
}));

import { withTenantContext } from '@/lib/db/tenant';

describe('withTenantContext', () => {
  const UUID_1 = '00000000-0000-0000-0000-000000000001';
  const UUID_2 = '00000000-0000-0000-0000-000000000002';
  const UUID_3 = '00000000-0000-0000-0000-000000000003';

  it('seta app.current_org_id com o organizationId recebido', async () => {
    await withTenantContext(UUID_1, async () => {
      // nada
    });
    expect($executeRawUnsafe).toHaveBeenCalledWith(
      'SELECT set_config(\'app.current_org_id\', $1, true)',
      UUID_1,
    );
  });

  it('encapsula queries dentro da transação', async () => {
    const tx = { merchant: { findMany, count }, $executeRawUnsafe };
    const seen: unknown[] = [];
    await withTenantContext(UUID_2, async (txClient) => {
      seen.push(txClient);
      await txClient.merchant.findMany({ where: { organizationId: UUID_2 } });
      await txClient.merchant.count({ where: { organizationId: UUID_2 } });
    });
    expect(seen).toHaveLength(1);
    expect(findMany).toHaveBeenCalled();
    expect(count).toHaveBeenCalled();
  });

  it('não vaza queries entre tenants (defesa em profundidade no repositório)', async () => {
    // O repositório SEMPRE passa organizationId no WHERE. Aqui verificamos
    // que ele recebe o organizationId certo no construtor e propaga.
    const { merchantRepo } = await import('@/repositories/merchants');
    await withTenantContext(UUID_3, async () => {
      await merchantRepo.list(UUID_3);
    });
    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { organizationId: UUID_3 },
      }),
    );
  });
});
