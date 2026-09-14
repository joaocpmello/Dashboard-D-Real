import { IfoodClient } from './client';
import { IfoodAuthService } from './auth';
import { IfoodError } from './errors';

export interface IfoodPromotion {
  id: string;
  name: string;
  discountValue: number;
  discountType: 'percentage' | 'fixed';
  startDate: string;
  endDate: string;
  status: 'ACTIVE' | 'INACTIVE' | 'SCHEDULED';
}

export class IfoodPromotionService {
  private client: IfoodClient;
  private auth: IfoodAuthService;

  constructor(client: IfoodClient, auth: IfoodAuthService) {
    this.client = client;
    this.auth = auth;
  }

  async getActivePromotions(merchantId: string, organizationId: string, environment: 'sandbox' | 'production'): Promise<IfoodPromotion[]> {
    const token = await this.auth.getAccessToken(organizationId, environment);

    try {
      const response = await this.client.request<IfoodPromotion[]>({
        path: `/merchant/${merchantId}/promotions`,
        bearerToken: token,
      });

      return response.filter(p => p.status === 'ACTIVE');
    } catch (error) {
      throw error instanceof IfoodError ? error : new IfoodError(500, 'IFOOD_PROMOTIONS_ERROR', 'Erro ao buscar promoções do iFood');
    }
  }
}
