import { Ratelimit } from '@upstash/ratelimit';
import { kv } from '@vercel/kv';

// Configurações de limites por endpoint.
// Identificador pode ser IP (público) ou userId (autenticado).
export const RATE_LIMIT_CONFIG: Record<string, { limit: number; window: number }> = {
  '/api/cadastro': { limit: 3, window: 3600 }, // 3 por hora por IP
  '/api/organizations': { limit: 100, window: 3600 }, // 100 por hora por usuário
  '/api/merchants/sync': { limit: 10, window: 3600 }, // 10 por hora por usuário
  '/api/reports/export': { limit: 5, window: 3600 }, // 5 por hora por usuário
};

// Cache de instâncias de Ratelimit para evitar recriação constante.
const ratelimiters = new Map<string, Ratelimit>();

export async function checkRateLimit(path: string, identifier: string) {
  const config = RATE_LIMIT_CONFIG[path];
  if (!config) return { success: true };

  const key = `rl:${path}:${identifier}`;
  let rl = ratelimiters.get(path);

  if (!rl) {
    rl = new Ratelimit({
      redis: kv,
      limiter: Ratelimit.fixedWindow(config.limit, `${config.window} s`),
      prefix: 'marmitaos:',
    });
    ratelimiters.set(path, rl);
  }

  const { success, limit, reset, remaining } = await rl.limit(key);

  return {
    success,
    limit,
    remaining,
    reset,
  };
}
