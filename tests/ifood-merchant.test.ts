/**
 * Teste do IfoodMerchantService.listAndSync:
 * - chama IfoodClient com token correto
 * - upsert idempotente dos merchants no repositório
 * - grava audit log
 * - status individual é best-effort (falha não derruba sync)
 *
 * Mockamos IfoodClient, ifoodCredentialRepo, merchantRepo, auditRepo.
 */
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { randomBytes } from 'node:crypto';

describe('IfoodMerchantService.listAndSync', () => {
  beforeAll(() => {
    process.env.CREDENTIAL_ENCRYPTION_KEY ??= randomBytes(32).toString('base64');
    process.env.IFOOD_ENVIRONMENT = 'sandbox';
  });
  beforeEach(() => {
    // Reset de módulo garante que cada teste pega o `merchant.ts` "fresco",
    // reaplicando os `vi.doMock` abaixo.
    vi.resetModules();
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('sincroniza merchants do iFood e grava audit log', async () => {
    // Mock do IfoodAuthService — devolve um token fixo sem fazer fetch real.
    vi.doMock('@/lib/ifood/auth', () => ({
      IfoodAuthService: class {
        getAccessToken = vi.fn().mockResolvedValue('fake-token');
        invalidate = vi.fn();
        static clearAllCacheForTests = vi.fn();
      },
    }));

    // Mock do IfoodClient — devolve lista de merchants e falha no 2º status.
    const requestMock = vi
      .fn()
      .mockResolvedValueOnce([
        { id: 'm-1', name: 'Loja 1', corporateName: 'Loja 1 SA' },
        { id: 'm-2', name: 'Loja 2', corporateName: 'Loja 2 SA' },
      ])
      .mockResolvedValueOnce({
        merchantId: 'm-1',
        state: 'OK',
        items: [],
      })
      .mockRejectedValueOnce(new Error('status indisponível'));

    vi.doMock('@/lib/ifood/client', () => ({
      IfoodClient: class {
        request = requestMock;
        get baseUrl() {
          return 'https://merchant-api.ifood.com.br';
        }
      },
    }));

    const upsertFromIfood = vi.fn().mockImplementation(async (input) => ({
      id: `db-${input.ifoodMerchantId}`,
      organizationId: input.organizationId,
      ifoodMerchantId: input.ifoodMerchantId,
      name: input.name,
      status: input.status,
    }));
    vi.doMock('@/repositories/merchants', () => ({
      merchantRepo: {
        list: vi.fn(),
        count: vi.fn(),
        upsertFromIfood,
      },
    }));

    const auditLog = vi.fn().mockResolvedValue(undefined);
    vi.doMock('@/repositories/audit', () => ({
      auditRepo: { log: auditLog, listForOrganization: vi.fn() },
    }));

    const { IfoodMerchantService } = await import('@/lib/ifood/merchant');
    const svc = new IfoodMerchantService();
    const result = await svc.listAndSync({
      organizationId: 'org-1',
      actorUserId: 'user-1',
    });

    expect(requestMock).toHaveBeenCalled();
    expect(upsertFromIfood).toHaveBeenCalledTimes(2);
    expect(upsertFromIfood.mock.calls[0][0]).toMatchObject({
      organizationId: 'org-1',
      ifoodMerchantId: 'm-1',
      name: 'Loja 1',
      corporateName: 'Loja 1 SA',
      status: 'OK',
    });
    // 2º merchant teve status falho -> persiste null
    expect(upsertFromIfood.mock.calls[1][0]).toMatchObject({
      ifoodMerchantId: 'm-2',
      status: null,
    });

    expect(auditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        organizationId: 'org-1',
        userId: 'user-1',
        action: 'merchants.sync',
        entity: 'Merchant',
        metadata: expect.objectContaining({ environment: 'sandbox', count: 2 }),
      }),
    );

    expect(result.merchants).toHaveLength(2);
    expect(result.merchants.map((m) => m.ifoodMerchantId).sort()).toEqual(['m-1', 'm-2']);
  });

  it('resolve environment do override ou do env var', async () => {
    // Não precisa de mocks — `resolveEnvironment` é função pura.
    const { resolveEnvironment } = await import('@/lib/ifood/merchant');
    expect(resolveEnvironment('sandbox')).toBe('sandbox');
    expect(resolveEnvironment('production')).toBe('production');
    process.env.IFOOD_ENVIRONMENT = 'production';
    expect(resolveEnvironment(undefined)).toBe('production');
    process.env.IFOOD_ENVIRONMENT = 'sandbox';
    expect(resolveEnvironment(undefined)).toBe('sandbox');
  });
});
