import { IfoodClient } from './client';
import { IfoodAuthService } from './auth';
import { IfoodError } from './errors';

export interface IfoodReview {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  customerName: string | null;
}

export interface IfoodReviewSummary {
  averageRating: number;
  totalReviews: number;
  distribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
}

export class IfoodReviewService {
  private client: IfoodClient;
  private auth: IfoodAuthService;

  constructor(client: IfoodClient, auth: IfoodAuthService) {
    this.client = client;
    this.auth = auth;
  }

  async getReviews(merchantId: string, organizationId: string, environment: 'sandbox' | 'production') {
    const token = await this.auth.getAccessToken(organizationId, environment);

    try {
      // Mocking the iFood review endpoint as it varies by API version
      // In real: GET /merchant/{merchantId}/reviews
      const response = await this.client.get(`/merchant/${merchantId}/reviews`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      return response.data;
    } catch (error) {
      throw error instanceof IfoodError ? error : new IfoodError('Erro ao buscar avaliações do iFood', 500);
    }
  }

  async getReviewSummary(merchantId: string, organizationId: string, environment: 'sandbox' | 'production') {
    const reviews = await this.getReviews(merchantId, organizationId, environment);

    const total = reviews.length;
    const sum = reviews.reduce((acc, r: IfoodReview) => acc + r.rating, 0);

    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    reviews.forEach((r: IfoodReview) => {
      distribution[r.rating]++;
    });

    return {
      averageRating: total > 0 ? sum / total : 0,
      totalReviews: total,
      distribution,
    };
  }
}
