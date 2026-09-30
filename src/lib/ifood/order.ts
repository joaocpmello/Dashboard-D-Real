import 'server-only';
import { IfoodClient } from '@/lib/ifood/client';
import { IfoodTokenManager } from '@/lib/ifood/token-manager';
import { orderRepo } from '@/repositories/orders';
import { auditRepo } from '@/repositories/audit';
import { IfoodEnvironment } from '@prisma/client';
import type {
  IfoodOrderSummary,
  IfoodOrderDetail,
  IfoodOrderFilter,
} from '@/lib/ifood/types/order';

export class IfoodOrderService {
  private readonly client = new IfoodClient();

  async listOrders(input: {
    organizationId: string;
    actorUserId: string;
    merchantId: string;
    environment?: IfoodEnvironment;
    filter?: IfoodOrderFilter;
    page?: number;
    size?: number;
  }): Promise<{ orders: IfoodOrderSummary[] }> {
    const env = input.environment || 'production';
    const { accessToken } = await IfoodTokenManager.getAccessToken(input.organizationId, env);

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
      bearerToken: accessToken,
    });

    return { orders: remote };
  }

  async getOrderDetails(input: {
    organizationId: string;
    ifoodOrderId: string;
    environment?: IfoodEnvironment;
  }): Promise<IfoodOrderDetail> {
    const env = input.environment || 'production';
    const { accessToken } = await IfoodTokenManager.getAccessToken(input.organizationId, env);

    return this.client.request<IfoodOrderDetail>({
      path: `/order/v1.0/orders/${encodeURIComponent(input.ifoodOrderId)}`,
      bearerToken: accessToken,
    });
  }

  async syncOrders(input: {
    organizationId: string;
    actorUserId: string;
    merchantId: string;
    environment?: IfoodEnvironment;
  }): Promise<{ syncedCount: number }> {
    const env = input.environment || 'production';
    const { accessToken } = await IfoodTokenManager.getAccessToken(input.organizationId, env);

    let syncedCount = 0;
    let page = 1;
    let hasMore = true;

    while (hasMore) {
      const remote = await this.client.request<IfoodOrderSummary[]>({
        path: `/order/v1.0/orders`,
        query: {
          merchantId: input.merchantId,
          page,
          size: 100,
        },
        bearerToken: accessToken,
      });

      if (!remote || remote.length === 0) {
        hasMore = false;
        break;
      }

      for (const o of remote) {
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
      page++;
      if (remote.length < 100) hasMore = false;
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
