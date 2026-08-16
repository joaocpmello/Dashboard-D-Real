import 'server-only';
import { IfoodClient } from '@/lib/ifood/client';
import { IfoodAuthService } from '@/lib/ifood/auth';
import { ifoodCredentialRepo } from '@/repositories/ifood-credentials';
import { merchantRepo } from '@/repositories/merchants';
import { auditRepo } from '@/repositories/audit';
import { encryptSecret } from '@/lib/crypto/secrets';
import { IfoodError } from '@/lib/ifood/errors';
import type {
  IfoodEnvironment,
  IfoodMerchantDetails,
  IfoodMerchantStatusResponse,
  IfoodMerchantSummary,
} from '@/lib/ifood/types/merchant';
import type { IfoodToken } from '@/lib/ifood/types/token';

// Resolve o ambiente: se não informado, usa o configurado em IFOOD_ENVIRONMENT.
export function resolveEnvironment(override?: IfoodEnvironment): IfoodEnvironment {
  if (override) return override;
  const fromEnv = process.env.IFOOD_ENVIRONMENT?.trim().toLowerCase();
  return fromEnv === 'production' ? 'production' : 'sandbox';
}

// Token fetcher usado pelo IfoodAuthService. Centraliza a chamada HTTP
// para o endpoint oficial de OAuth.
async function fetchAccessTokenFromIfood(
  clientId: string,
  clientSecret: string,
): Promise<{ accessToken: string; type: 'bearer'; expiresIn: number }> {
  const url = `${new IfoodClient().baseUrl}/authentication/v1.0/oauth/token`;
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

  if (res.status === 401) {
    throw new IfoodError(401, 'IFOOD_AUTH', 'clientId/clientSecret inválidos');
  }
  if (!res.ok) {
    throw new IfoodError(res.status, 'IFOOD_HTTP', `iFood HTTP ${res.status}`);
  }
  return res.json();
}

function buildAuthService(): IfoodAuthService {
  return new IfoodAuthService(
    fetchAccessTokenFromIfood,
    async (organizationId, env) => {
      const c = await ifoodCredentialRepo.loadDecrypted(organizationId, env);
      return { clientId: c.clientId, clientSecret: c.clientSecret };
    },
    async (organizationId, env, token: IfoodToken) => {
      await ifoodCredentialRepo.persistAccessToken(
        organizationId,
        env,
        token.token,
        token.expiresAt,
      );
    },
  );
}

export class IfoodMerchantService {
  private readonly client = new IfoodClient();
  private readonly auth = buildAuthService();

  // Lista merchants do iFood e sincroniza com o banco (idempotente).
  async listAndSync(input: {
    organizationId: string;
    actorUserId: string;
    environment?: IfoodEnvironment;
    page?: number;
    size?: number;
  }): Promise<{ merchants: { id: string; ifoodMerchantId: string; name: string | null; status: string | null }[] }> {
    const env = resolveEnvironment(input.environment);
    const token = await this.auth.getAccessToken(input.organizationId, env);
    const remote = await this.client.request<IfoodMerchantSummary[]>({
      path: '/merchant/v1.0/merchants',
      query: { page: input.page ?? 1, size: input.size ?? 100 },
      bearerToken: token,
    });

    const persisted: {
      id: string;
      ifoodMerchantId: string;
      name: string | null;
      status: string | null;
    }[] = [];
    for (const m of remote) {
      const status = await this.fetchStatusSafe(input.organizationId, env, m.id, token);
      const row = await merchantRepo.upsertFromIfood({
        organizationId: input.organizationId,
        ifoodMerchantId: m.id,
        name: m.name,
        corporateName: m.corporateName,
        status,
      });
      persisted.push({
        id: row.id,
        ifoodMerchantId: row.ifoodMerchantId,
        name: row.name,
        status: row.status,
      });
    }

    await auditRepo.log({
      organizationId: input.organizationId,
      userId: input.actorUserId,
      action: 'merchants.sync',
      entity: 'Merchant',
      metadata: { environment: env, count: persisted.length },
    });

    return { merchants: persisted };
  }

  async getDetails(input: {
    organizationId: string;
    ifoodMerchantId: string;
    environment?: IfoodEnvironment;
  }): Promise<IfoodMerchantDetails> {
    const env = resolveEnvironment(input.environment);
    const token = await this.auth.getAccessToken(input.organizationId, env);
    return this.client.request<IfoodMerchantDetails>({
      path: `/merchant/v1.0/merchants/${encodeURIComponent(input.ifoodMerchantId)}`,
      bearerToken: token,
    });
  }

  async getStatus(input: {
    organizationId: string;
    ifoodMerchantId: string;
    environment?: IfoodEnvironment;
  }): Promise<IfoodMerchantStatusResponse> {
    const env = resolveEnvironment(input.environment);
    const token = await this.auth.getAccessToken(input.organizationId, env);
    return this.client.request<IfoodMerchantStatusResponse>({
      path: `/merchant/v1.0/merchants/${encodeURIComponent(input.ifoodMerchantId)}/status`,
      bearerToken: token,
    });
  }

  // Status é um best-effort: falhas individuais não devem abortar a sincronização.
  private async fetchStatusSafe(
    organizationId: string,
    env: IfoodEnvironment,
    ifoodMerchantId: string,
    token: string,
  ): Promise<string | null> {
    try {
      const status = await this.client.request<IfoodMerchantStatusResponse>({
        path: `/merchant/v1.0/merchants/${encodeURIComponent(ifoodMerchantId)}/status`,
        bearerToken: token,
      });
      return status.state ?? status.items?.[0]?.state ?? null;
    } catch {
      return null;
    }
  }
}

// Reaproveita a função interna para o endpoint de configuração de credenciais,
// que precisa do `encryptSecret` sem import cruzado.
export { encryptSecret };
