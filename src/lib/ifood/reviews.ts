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
    [key: number]: number;
  };
}

export class IfoodReviewService {
  private client: IfoodClient;
  private auth: IfoodAuthService;

  constructor(client: IfoodClient, auth: IfoodAuthService) {
    this.client = client;
    this.auth = auth;
  }

  async getReviews(merchantId: string, organizationId: string, environment: 'sandbox' | 'production'): Promise<IfoodReview[]> {
    const token = await this.auth.getAccessToken(organizationId, environment);

    try {
      const response = await this.client.request<IfoodReview[]>({
        path: `/merchant/${merchantId}/reviews`,
        bearerToken: token,
      });

      return response;
    } catch (error) {
      throw error instanceof IfoodError ? error : new IfoodError(500, 'IFOOD_REVIEWS_ERROR', 'Erro ao buscar avaliações do iFood');
    }
  }

  async getReviewSummary(merchantId: string, organizationId: string, environment: 'sandbox' | 'production'): Promise<IfoodReviewSummary> {
    const reviews = await this.getReviews(merchantId, organizationId, environment);

    const total = reviews.length;
    const sum = reviews.reduce((acc, r) => acc + r.rating, 0);

    const distribution: { [key: number]: number } = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    reviews.forEach((r) => {
      const count = distribution[r.rating];
      if (count !== undefined) {
        distribution[r.rating] = count + 1;
      }
    });

    return {
      averageRating: total > 0 ? sum / total : 0,
      totalReviews: total,
      distribution,
    };
  }
}
