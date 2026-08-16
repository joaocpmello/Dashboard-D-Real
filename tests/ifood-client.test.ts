/**
 * Testes do IfoodClient: tratamento de status HTTP, retries, timeout.
 * Não bate na internet — usa um fetcher mockado.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

type FetchResult = {
  status: number;
  body: unknown;
  headers?: Record<string, string>;
};

function buildFetchMock(plan: FetchResult[]): typeof fetch {
  let i = 0;
  return vi.fn(async () => {
    const r = plan[i++] ?? plan[plan.length - 1];
    if (!r) throw new Error('sem mais respostas no mock');
    return {
      ok: r.status >= 200 && r.status < 300,
      status: r.status,
      headers: new Headers(r.headers ?? {}),
      json: async () => r.body,
    } as Response;
  }) as unknown as typeof fetch;
}

describe('IfoodClient', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('GET injeta Authorization Bearer e parseia JSON', async () => {
    const fetcher = buildFetchMock([
      { status: 200, body: { ok: true } },
    ]);
    const { IfoodClient } = await import('@/lib/ifood/client');
    const client = new IfoodClient({ fetcher });
    const data = await client.request<{ ok: boolean }>({
      path: '/merchant/v1.0/merchants',
      bearerToken: 'tok',
    });
    expect(data.ok).toBe(true);
    expect(fetcher).toHaveBeenCalledTimes(1);
    const [url, init] = (fetcher as unknown as ReturnType<typeof vi.fn>).mock
      .calls[0] as [string, RequestInit];
    expect(url).toContain('merchant-api.ifood.com.br/merchant/v1.0/merchants');
    expect((init.headers as Record<string, string>).Authorization).toBe('Bearer tok');
  });

  it('mapeia 401 para IfoodAuthError sem tentar de novo', async () => {
    const fetcher = buildFetchMock([{ status: 401, body: { error: 'unauth' } }]);
    const { IfoodClient } = await import('@/lib/ifood/client');
    const { IfoodAuthError } = await import('@/lib/ifood/errors');
    const client = new IfoodClient({ fetcher });
    await expect(
      client.request({ path: '/x', bearerToken: 't' }),
    ).rejects.toBeInstanceOf(IfoodAuthError);
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it('faz retry em 429 respeitando Retry-After e depois desiste', async () => {
    const fetcher = buildFetchMock([
      { status: 429, body: {}, headers: { 'retry-after': '0' } },
      { status: 429, body: {}, headers: { 'retry-after': '0' } },
      { status: 429, body: {}, headers: { 'retry-after': '0' } },
    ]);
    const { IfoodClient } = await import('@/lib/ifood/client');
    const { IfoodRateLimitError } = await import('@/lib/ifood/errors');
    const client = new IfoodClient({ fetcher });
    await expect(
      client.request({ path: '/x', bearerToken: 't' }),
    ).rejects.toBeInstanceOf(IfoodRateLimitError);
    expect(fetcher).toHaveBeenCalledTimes(3); // 1 + 2 retries
  });

  it('faz retry em 5xx e recupera no próximo attempt', async () => {
    const fetcher = buildFetchMock([
      { status: 503, body: {} },
      { status: 503, body: {} },
      { status: 200, body: { recovered: true } },
    ]);
    const { IfoodClient } = await import('@/lib/ifood/client');
    const client = new IfoodClient({ fetcher });
    const out = await client.request<{ recovered: boolean }>({
      path: '/x',
      bearerToken: 't',
    });
    expect(out.recovered).toBe(true);
    expect(fetcher).toHaveBeenCalledTimes(3);
  });

  it('timeout/erro de rede vira IfoodError code IFOOD_NETWORK', async () => {
    const fetcher = vi.fn(async () => {
      throw new TypeError('aborted');
    }) as unknown as typeof fetch;
    const { IfoodClient } = await import('@/lib/ifood/client');
    const { IfoodError } = await import('@/lib/ifood/errors');
    const client = new IfoodClient({ fetcher });
    await expect(
      client.request({ path: '/x', bearerToken: 't' }),
    ).rejects.toMatchObject({ code: 'IFOOD_NETWORK' });
    // 1 + 2 retries = 3
    expect(fetcher).toHaveBeenCalledTimes(3);
  });

  it('mapeia 4xx não tratado para IfoodError code IFOOD_HTTP', async () => {
    const fetcher = buildFetchMock([{ status: 404, body: { msg: 'no' } }]);
    const { IfoodClient } = await import('@/lib/ifood/client');
    const { IfoodError } = await import('@/lib/ifood/errors');
    const client = new IfoodClient({ fetcher });
    await expect(
      client.request({ path: '/x', bearerToken: 't' }),
    ).rejects.toMatchObject({ status: 404, code: 'IFOOD_HTTP' });
  });
});
