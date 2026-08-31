import 'server-only';
import { IfoodAuthError, IfoodError, IfoodRateLimitError } from '@/lib/ifood/errors';

// ADR-0002: a documentação oficial não publica hosts distintos pra sandbox/produção.
// Mantemos UMA URL base e credenciais separadas por ambiente (selecionadas por
// IFOOD_ENVIRONMENT). Se o iFood publicar host de sandbox distinto, ajustar apenas aqui.
const IFOOD_BASE_URL = 'https://merchant-api.ifood.com.br';

const DEFAULT_TIMEOUT_MS = 15_000;
const MAX_RETRIES = 2;
const RETRY_STATUSES = new Set([429, 500, 502, 503, 504]);

type FetchLike = typeof fetch;

export type IfoodRequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  path: string;
  query?: Record<string, string | number | undefined>;
  body?: unknown;
  bearerToken: string; // já obtido pelo IfoodAuthService
  timeoutMs?: number;
  fetcher?: FetchLike;
};

export class IfoodClient {
  private readonly fetcher: FetchLike;

  constructor(opts?: { fetcher?: FetchLike }) {
    this.fetcher = opts?.fetcher ?? globalThis.fetch;
  }

  get baseUrl(): string {
    return IFOOD_BASE_URL;
  }

  async request<T>(opts: IfoodRequestOptions): Promise<T> {
    const url = this.buildUrl(opts.path, opts.query);
    const init: RequestInit = {
      method: opts.method ?? 'GET',
      headers: {
        Authorization: `Bearer ${opts.bearerToken}`,
        Accept: 'application/json',
        ...(opts.body ? { 'Content-Type': 'application/json' } : {}),
      },
      body: opts.body ? JSON.stringify(opts.body) : undefined,
      // Importante: NÃO cachear.
      cache: 'no-store',
    };

    let lastError: unknown = null;
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        const res = await this.fetcher(url, {
          ...init,
          signal: AbortSignal.timeout(opts.timeoutMs ?? DEFAULT_TIMEOUT_MS),
        });

        if (res.status === 401) {
          throw new IfoodAuthError();
        }
        if (res.status === 429) {
          if (attempt < MAX_RETRIES) {
            const wait = parseRetryAfter(res) ?? backoffMs(attempt);
            await sleep(wait);
            continue;
          }
          throw new IfoodRateLimitError(parseRetryAfter(res));
        }

        if (res.status >= 500 && res.status < 600 && attempt < MAX_RETRIES) {
          await sleep(backoffMs(attempt));
          continue;
        }

        if (!res.ok) {
          // Nunca logar body — pode conter dados sensíveis.
          throw new IfoodError(res.status, 'IFOOD_HTTP', `iFood HTTP ${res.status}`);
        }

        return (await res.json()) as T;
      } catch (err) {
        lastError = err;
        // Se já é um erro semântico do iFood, não tenta mais.
        if (err instanceof IfoodError) throw err;
        // Timeout / erro de rede: tenta de novo até MAX_RETRIES.
        if (attempt < MAX_RETRIES) {
          await sleep(backoffMs(attempt));
          continue;
        }
        throw new IfoodError(0, 'IFOOD_NETWORK', 'Falha de rede com iFood', err);
      }
    }
    // Nunca chega aqui por construção, mas o TS não sabe.
    throw new IfoodError(0, 'IFOOD_UNKNOWN', 'Falha desconhecida', lastError);
  }

  private buildUrl(path: string, query?: Record<string, string | number | undefined>): string {
    const url = new URL(path.startsWith('/') ? path : `/${path}`, IFOOD_BASE_URL);
    if (query) {
      for (const [k, v] of Object.entries(query)) {
        if (v !== undefined) url.searchParams.set(k, String(v));
      }
    }
    return url.toString();
  }
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function backoffMs(attempt: number) {
  // 200ms, 600ms (com jitter leve)
  const base = 200 * Math.pow(3, attempt);
  return base + Math.floor(Math.random() * 100);
}

function parseRetryAfter(res: Response): number | undefined {
  const h = res.headers.get('retry-after');
  if (!h) return undefined;
  const n = Number(h);
  if (!Number.isFinite(n)) return undefined;
  return n * 1000;
}
