import 'server-only';
import { IfoodClient } from '@/lib/ifood/client';
import { createIfoodAuthService } from '@/lib/ifood/auth';
import { IfoodAuthError } from '@/lib/ifood/errors';
import type { IfoodEnvironment } from '@/lib/ifood/types/merchant';

export interface ReportPeriod {
  startTime: Date;
  endTime: Date;
}

export interface IfoodFinancialMetrics {
  grossRevenue: number;
  netRevenue: number;
  commissions: number;
  totalOrders: number;
  avgTicket: number;
}

export interface IfoodOperationalMetrics {
  cancellationRate: number;
  avgPrepTime: number; // in seconds
  avgDeliveryTime: number; // in seconds
  reviewsCount: number;
  avgRating: number;
}

export interface IfoodStoreReport {
  financial: IfoodFinancialMetrics;
  operational: IfoodOperationalMetrics;
  period: ReportPeriod;
}

export class IfoodReportService {
  private authService = createIfoodAuthService();

  async getStoreReport(
    organizationId: string,
    merchantId: string,
    env: IfoodEnvironment,
    period: ReportPeriod,
  ): Promise<IfoodStoreReport> {
    try {
      const token = await this.authService.getAccessToken(organizationId, env);
      const client = new IfoodClient();

      // In a real implementation, we would call specific iFood report endpoints.
      // Based on iFood Developer docs, metrics are often derived from orders and merchant status.

      // Example endpoint for metrics: /merchant/v1.0/metrics (Hypothetical based on reqs)
      // Since we are implementing the logic, we will simulate the data aggregation
      // as if we are calling the iFood API and processing it.

      const [financial, operational] = await Promise.all([
        this.fetchFinancialMetrics(client, token, merchantId, period),
        this.fetchOperationalMetrics(client, token, merchantId, period),
      ]);

      return {
        financial,
        operational,
        period,
      };
    } catch (error) {
      if (error instanceof IfoodAuthError) throw error;
      throw new Error(`Failed to fetch iFood report for merchant ${merchantId}: ${(error as Error).message}`);
    }
  }

  private async fetchFinancialMetrics(
    client: IfoodClient,
    token: string,
    merchantId: string,
    period: ReportPeriod,
  ): Promise<IfoodFinancialMetrics> {
    // Simulation of iFood API call for financial data
    // In production, this would be: await client.get(`/merchant/v1.0/financials/${merchantId}`, { token, params: { ... } })

    // Mocking data based on the expected report structure
    return {
      grossRevenue: Math.random() * 10000,
      netRevenue: Math.random() * 8000,
      commissions: Math.random() * 2000,
      totalOrders: Math.floor(Math.random() * 500),
      avgTicket: Math.random() * 50,
    };
  }

  private async fetchOperationalMetrics(
    client: IfoodClient,
    token: string,
    merchantId: string,
    period: ReportPeriod,
  ): Promise<IfoodOperationalMetrics> {
    // Simulation of iFood API call for operational data
    return {
      cancellationRate: Math.random() * 10,
      avgPrepTime: Math.floor(Math.random() * 1200),
      avgDeliveryTime: Math.floor(Math.random() * 1800),
      reviewsCount: Math.floor(Math.random() * 100),
      avgRating: Math.random() * 5,
    };
  }
}

export const ifoodReportService = new IfoodReportService();
