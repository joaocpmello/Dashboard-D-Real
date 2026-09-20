import 'server-only';
import { IfoodAuthError } from '@/lib/ifood/errors';
import { IfoodClient } from '@/lib/ifood/client';
import type { IfoodToken, IfoodTokenResponse } from '@/lib/ifood/types/token';
import type { IfoodEnvironment } from '@/lib/ifood/types/merchant';
import { ifoodCredentialRepo } from '@/repositories/ifood-credentials';

// Margem de segurança — refresh antes da expiração.
const SAFETY_MARGIN_SEC = 5 * 60;

type CacheEntry = {
  token: string;
  expiresAt: number; // ms epoch
};

// Cache por (organizationId, environment) — em memória do processo.
const cache = new Map<string, CacheEntry>();

function keyOf(orgId: string, env: IfoodEnvironment) {
  return `${orgId}::${env}`;
}

// Helper interno para buscar token bruto da API do iFood
async function fetchAccessTokenFromIfood(
  clientId: string,
  clientSecret: string,
): Promise<IfoodTokenResponse> {
  const client = new IfoodClient();
  const url = `${client.baseUrl}/authentication/v1.0/oauth/token`;
  const body = new URLSearchParams({
    grantType: 'client_credentials',
    clientId,
    clientSecret,
  });

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json',
    },
    body,
    cache: 'no-store',
  });

  if (!res.ok) {
    throw new Error(`iFood Auth Error: ${res.status}`);
  }
  return res.json();
}

export class IfoodAuthService {
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

      // Se o erro for de descriptografia (AES), lançamos mensagem amigável
      if (err instanceof Error && (err.message.includes('CREDENTIAL_ENCRYPTION_KEY') || err.message.includes('authTag') || err.message.includes('Ciphertext verification failed'))) {
        throw new Error('As credenciais salvas no banco não puderam ser descriptografadas com a chave atual do servidor. Por favor, re-insira o Client ID e Client Secret no modal de conexão.');
      }

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

  invalidate(organizationId: string, env: IfoodEnvironment): void {
    cache.delete(keyOf(organizationId, env));
  }

  static clearAllCacheForTests(): void {
    cache.clear();
  }
}

/**
 * Factory para criar instâncias do IfoodAuthService com as dependências de repositório.
 */
export function createIfoodAuthService(): IfoodAuthService {
  return new IfoodAuthService(
    fetchAccessTokenFromIfood,
    async (organizationId, env) => {
      const c = await ifoodCredentialRepo.loadDecrypted(organizationId, env);
      return { clientId: c.clientId, clientSecret: c.clientSecret };
    },
    async (organizationId, env, token) => {
      await ifoodCredentialRepo.persistAccessToken(
        organizationId,
        env,
        token.token,
        token.expiresAt,
      );
    },
  );
}
