import 'server-only';
import { IfoodClient } from '@/lib/ifood/client';
import { IfoodTokenManager } from '@/lib/ifood/token-manager';
import { IfoodEnvironment } from '@prisma/client';

export interface IfoodFinancialEvent {
  id: string;
  type: string;
  value: number;
  createdAt: string;
  orderId?: string;
  details: any;
}

export interface IfoodFinancialSale {
  orderId: string;
  grossValue: number;
  netValue: number;
  commission: number;
  fees: number;
  createdAt: string;
}

export class IfoodFinancialService {
  private readonly client = new IfoodClient();

  /**
   * Fetches financial sales for a given period.
   * Used for both incremental sync and backfill.
   */
  async getSales(input: {
    organizationId: string;
    merchantId: string;
    environment?: IfoodEnvironment;
    from: string; // YYYY-MM-DD
    to: string;    // YYYY-MM-DD
  }): Promise<{ sales: IfoodFinancialSale[] }> {
    const env = input.environment || 'production';
    const { accessToken } = await IfoodTokenManager.getAccessToken(input.organizationId, env);

    const remote = await this.client.request<IfoodFinancialSale[]>({
      path: `/financial/v1.0/sales`,
      query: {
        merchantId: input.merchantId,
        from: input.from,
        to: input.to,
      },
      bearerToken: accessToken,
    });

    return { sales: remote };
  }

  async getSettlements(input: {
    organizationId: string;
    merchantId: string;
    environment?: IfoodEnvironment;
  }): Promise<any[]> {
    const env = input.environment || 'production';
    const { accessToken } = await IfoodTokenManager.getAccessToken(input.organizationId, env);

    return this.client.request<any[]>({
      path: `/financial/v1.0/settlements`,
      query: { merchantId: input.merchantId },
      bearerToken: accessToken,
    });
  }

  async getEvents(input: {
    organizationId: string;
    merchantId: string;
    environment?: IfoodEnvironment;
    since: string;
  }): Promise<{ events: IfoodFinancialEvent[] }> {
    const env = input.environment || 'production';
    const { accessToken } = await IfoodTokenManager.getAccessToken(input.organizationId, env);

    const remote = await this.client.request<IfoodFinancialEvent[]>({
      path: `/financial/v1.0/events`,
      query: {
        merchantId: input.merchantId,
        since,
      },
      bearerToken: accessToken,
    });

    return { events: remote };
  }
}
