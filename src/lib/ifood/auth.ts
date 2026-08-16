import 'server-only';
import { IfoodAuthError } from '@/lib/ifood/errors';
import type { IfoodToken, IfoodTokenResponse } from '@/lib/ifood/types/token';
import type { IfoodEnvironment } from '@/lib/ifood/types/merchant';

// Margem de segurança — refresh antes da expiração.
const SAFETY_MARGIN_SEC = 5 * 60;

type CacheEntry = {
  token: string;
  expiresAt: number; // ms epoch
};

// Cache por (organizationId, environment) — em memória do processo.
// Não persiste plaintext; o token em banco é criptografado.
const cache = new Map<string, CacheEntry>();

function keyOf(orgId: string, env: IfoodEnvironment) {
  return `${orgId}::${env}`;
}

export class IfoodAuthService {
  // `getAccessToken` recebe um "fetcher de token" para manter este módulo
  // desacoplado do cliente HTTP e do repositório. Isso facilita testes.
  constructor(
    private readonly fetchToken: (clientId: string, clientSecret: string) => Promise<IfoodTokenResponse>,
    private readonly loadDecryptedCredentials: (organizationId: string, env: IfoodEnvironment) => Promise<{
      clientId: string;
      clientSecret: string;
    }>,
    private readonly persistToken: (organizationId: string, env: IfoodEnvironment, token: IfoodToken) => Promise<void>,
  ) {}

  async getAccessToken(
    organizationId: string,
    env: IfoodEnvironment,
  ): Promise<string> {
    const cacheKey = keyOf(organizationId, env);
    const cached = cache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now() + SAFETY_MARGIN_SEC * 1000) {
      return cached.token;
    }

    const creds = await this.loadDecryptedCredentials(organizationId, env);
    let response: IfoodTokenResponse;
    try {
      response = await this.fetchToken(creds.clientId, creds.clientSecret);
    } catch (err) {
      if (err instanceof IfoodAuthError) throw err;
      throw new IfoodAuthError('Falha ao obter token do iFood');
    }

    const token: IfoodToken = {
      token: response.accessToken,
      expiresAt: new Date(Date.now() + (response.expiresIn - SAFETY_MARGIN_SEC) * 1000),
    };

    cache.set(cacheKey, { token: token.token, expiresAt: token.expiresAt.getTime() });
    await this.persistToken(organizationId, env, token);
    return token.token;
  }

  // Invalida cache local (ex.: ao trocar credenciais).
  invalidate(organizationId: string, env: IfoodEnvironment): void {
    cache.delete(keyOf(organizationId, env));
  }

  // Limpa todo o cache em memória. Usado em testes; nunca chamar em produção
  // sem motivo — cada entrada é por (org, env) e tem TTL.
  static clearAllCacheForTests(): void {
    cache.clear();
  }
}
