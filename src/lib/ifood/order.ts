import 'server-only';
import { IfoodClient } from '@/lib/ifood/client';
import { IfoodAuthService } from '@/lib/ifood/auth';
import { ifoodCredentialRepo } from '@/repositories/ifood-credentials';
import { orderRepo } from '@/repositories/orders';
import { merchantRepo } from '@/repositories/merchants';
import { auditRepo } from '@/repositories/audit';
import { resolveEnvironment } from '@/lib/ifood/merchant';
import type {
  IfoodEnvironment,
  IfoodOrderSummary,
  IfoodOrderDetail,
  IfoodOrderFilter,
} from '@/lib/ifood/types/order';
import type { IfoodToken } from '@/lib/ifood/types/token';

// Token fetcher helper to avoid circular dependency with IfoodAuthService
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

  if (!res.ok) {
    throw new Error(`iFood Auth Error: ${res.status}`);
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

export class IfoodOrderService {
  private readonly client = new IfoodClient();
  private readonly auth = buildAuthService();

  async listOrders(input: {
    organizationId: string;
    actorUserId: string;
    merchantId: string;
    environment?: IfoodEnvironment;
    filter?: IfoodOrderFilter;
    page?: number;
    size?: number;
  }): Promise<{ orders: IfoodOrderSummary[] }> {
    const env = resolveEnvironment(input.environment);
    const token = await this.auth.getAccessToken(input.organizationId, env);

    // iFood Orders API usually requires merchantId in path or query
    const remote = await this.client.request<IfoodOrderSummary[]>({
      path: `/order/v1.0/orders`,
      query: {
        merchantId: input.merchantId,
        status: input.filter?.status,
        startTime: input.filter?.startTime,
        endTime: input.filter?.endTime,
        page: input.page ?? 1,
        size: input.size ?? 100,
      },
      bearerToken: token,
    });

    return { orders: remote };
  }

  async getOrderDetails(input: {
    organizationId: string;
    ifoodOrderId: string;
    environment?: IfoodEnvironment;
  }): Promise<IfoodOrderDetail> {
    const env = resolveEnvironment(input.environment);
    const token = await this.auth.getAccessToken(input.organizationId, env);

    return this.client.request<IfoodOrderDetail>({
      path: `/order/v1.0/orders/${encodeURIComponent(input.ifoodOrderId)}`,
      bearerToken: token,
    });
  }

  async syncOrders(input: {
    organizationId: string;
    actorUserId: string;
    merchantId: string;
    environment?: IfoodEnvironment;
  }): Promise<{ syncedCount: number }> {
    const env = resolveEnvironment(input.environment);
    const token = await this.auth.getAccessToken(input.organizationId, env);

    // 1. Fetch recent orders (e.g., last 24h)
    const remote = await this.client.request<IfoodOrderSummary[]>({
      path: `/order/v1.0/orders`,
      query: {
        merchantId: input.merchantId,
        size: 100,
      },
      bearerToken: token,
    });

    let syncedCount = 0;
    for (const o of remote) {
      // We assume the order repository handles idempotency (upsert)
      await orderRepo.upsertFromIfood({
        organizationId: input.organizationId,
        merchantId: input.merchantId,
        ifoodOrderId: o.id,
        status: o.status,
        total: o.totalValue,
        customerName: o.customer.name,
        customerPhone: o.customer.phone ?? null,
        customerAddress: `${o.address.street}, ${o.address.number} - ${o.address.neighborhood}, ${o.address.city}/${o.address.state}`,
        createdAt: new Date(o.createdAt),
      });
      syncedCount++;
    }

    await auditRepo.log({
      organizationId: input.organizationId,
      userId: input.actorUserId,
      action: 'orders.sync',
      entity: 'Order',
      metadata: { environment: env, count: syncedCount, merchantId: input.merchantId },
    });

    return { syncedCount };
  }
}
