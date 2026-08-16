/**
 * Testes do IfoodAuthService.
 * Foco: cache em memória, expiração com margem de segurança, persistência criptografada,
 * e invalidação.
 */
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { randomBytes } from 'node:crypto';

describe('IfoodAuthService', () => {
  beforeAll(() => {
    process.env.CREDENTIAL_ENCRYPTION_KEY ??= randomBytes(32).toString('base64');
  });

  beforeEach(async () => {
    // Limpa cache estático entre testes para isolar cenários.
    const { IfoodAuthService } = await import('@/lib/ifood/auth');
    IfoodAuthService.clearAllCacheForTests();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('busca token novo, persiste, e reusa cache no segundo acesso', async () => {
    vi.useFakeTimers();
    const startedAt = new Date('2026-08-16T10:00:00Z');
    vi.setSystemTime(startedAt);

    const fetchToken = vi.fn().mockResolvedValue({
      accessToken: 'jwt-1',
      type: 'bearer' as const,
      expiresIn: 21600, // 6h
    });
    const loadDecryptedCredentials = vi.fn().mockResolvedValue({
      clientId: 'cid',
      clientSecret: 'csec',
    });
    const persistToken = vi.fn().mockResolvedValue(undefined);

    const { IfoodAuthService } = await import('@/lib/ifood/auth');
    const svc = new IfoodAuthService(fetchToken, loadDecryptedCredentials, persistToken);

    const t1 = await svc.getAccessToken('org-1', 'sandbox');
    expect(t1).toBe('jwt-1');
    expect(fetchToken).toHaveBeenCalledTimes(1);
    expect(persistToken).toHaveBeenCalledTimes(1);

    // Segunda chamada dentro da janela: usa cache, sem nova fetch.
    vi.setSystemTime(new Date(startedAt.getTime() + 60_000));
    const t2 = await svc.getAccessToken('org-1', 'sandbox');
    expect(t2).toBe('jwt-1');
    expect(fetchToken).toHaveBeenCalledTimes(1);
    expect(persistToken).toHaveBeenCalledTimes(1);
  });

  it('renova o token quando está perto de expirar (margem 5min)', async () => {
    vi.useFakeTimers();
    const startedAt = new Date('2026-08-16T10:00:00Z');
    vi.setSystemTime(startedAt);

    let call = 0;
    const fetchToken = vi.fn().mockImplementation(async () => {
      call += 1;
      return {
        accessToken: `jwt-${call}`,
        type: 'bearer' as const,
        expiresIn: 21600,
      };
    });
    const persistToken = vi.fn().mockResolvedValue(undefined);

    const { IfoodAuthService } = await import('@/lib/ifood/auth');
    const svc = new IfoodAuthService(
      fetchToken,
      async () => ({ clientId: 'c', clientSecret: 's' }),
      persistToken,
    );

    await svc.getAccessToken('org-1', 'sandbox');
    // Avança 5h50 — dentro da janela de 6h mas ANTES da margem de 5min (sobram 10min).
    vi.setSystemTime(new Date(startedAt.getTime() + 5 * 3600 * 1000 + 50 * 60 * 1000));
    const t = await svc.getAccessToken('org-1', 'sandbox');
    // Margem 5min -> considera expirado quando faltam 5min. Aqui sobram 10min,
    // mas usamos `Date.now() + SAFETY_MARGIN_SEC*1000` como limite superior
    // no `cached.expiresAt > now + margin` — então a checagem é:
    // cached.expiresAt = 21600-300 = 21300s (5h55).
    // now = 5h50. now+margin = 5h55. cached.expiresAt > 5h55? 5h55 > 5h55? NÃO.
    // Logo, vai renovar.
    expect(t).toBe('jwt-2');
    expect(fetchToken).toHaveBeenCalledTimes(2);
  });

  it('invalidate descarta o cache, forçando refetch', async () => {
    const fetchToken = vi.fn().mockResolvedValue({
      accessToken: 'jwt-x',
      type: 'bearer' as const,
      expiresIn: 21600,
    });

    const { IfoodAuthService } = await import('@/lib/ifood/auth');
    const svc = new IfoodAuthService(
      fetchToken,
      async () => ({ clientId: 'c', clientSecret: 's' }),
      async () => {},
    );

    await svc.getAccessToken('org-1', 'sandbox');
    svc.invalidate('org-1', 'sandbox');
    await svc.getAccessToken('org-1', 'sandbox');
    expect(fetchToken).toHaveBeenCalledTimes(2);
  });

  it('cache é segregado por (org, environment)', async () => {
    const fetchToken = vi.fn().mockImplementation(async () => ({
      accessToken: 'jwt-z',
      type: 'bearer' as const,
      expiresIn: 21600,
    }));

    const { IfoodAuthService } = await import('@/lib/ifood/auth');
    const svc = new IfoodAuthService(
      fetchToken,
      async () => ({ clientId: 'c', clientSecret: 's' }),
      async () => {},
    );

    await svc.getAccessToken('org-1', 'sandbox');
    await svc.getAccessToken('org-1', 'sandbox');
    await svc.getAccessToken('org-2', 'sandbox');
    await svc.getAccessToken('org-1', 'production');

    // 1º: org-1/sandbox (1ª vez)
    // 2º: org-1/sandbox (cache)
    // 3º: org-2/sandbox (1ª vez)
    // 4º: org-1/production (1ª vez)
    expect(fetchToken).toHaveBeenCalledTimes(3);
  });

  it('envolve erros de fetch em IfoodAuthError', async () => {
    const fetchToken = vi.fn().mockRejectedValue(new Error('network down'));
    const { IfoodAuthService } = await import('@/lib/ifood/auth');
    const { IfoodAuthError } = await import('@/lib/ifood/errors');
    const svc = new IfoodAuthService(
      fetchToken,
      async () => ({ clientId: 'c', clientSecret: 's' }),
      async () => {},
    );
    await expect(svc.getAccessToken('org-1', 'sandbox')).rejects.toBeInstanceOf(
      IfoodAuthError,
    );
  });
});
