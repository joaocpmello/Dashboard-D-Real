export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth/session';
import { toErrorResponse } from '@/lib/auth/errors';
import { prisma } from '@/lib/db/prisma';
import { withTenantContext } from '@/lib/db/tenant';
import { z } from 'zod';

export async function GET(req: NextRequest) {
  try {
    const session = await requireSession();
    const organizationId = session.organizationId;
    if (!organizationId) {
      return NextResponse.json({ error: 'Organização não definida' }, { status: 400 });
    }

    return withTenantContext(organizationId, async (tx) => {
      const incidents: any[] = [];
      const now = new Date();
      const hour = now.getHours();
      const isPeakHour = (hour >= 11 && hour <= 14) || (hour >= 18 && hour <= 22);

      const merchants = await tx.merchant.findMany({
        where: { organizationId },
      });

      for (const merchant of merchants) {
        // 1. Check if CLOSED/PAUSED during peak hours
        const status = (merchant.status ?? '').toUpperCase();
        if (isPeakHour && (status === 'CLOSED' || status === 'PAUSED')) {
          incidents.push({
            type: 'CRITICAL',
            merchantId: merchant.id,
            merchantName: merchant.name || merchant.corporateName,
            message: `Loja ${merchant.name} está FECHADA durante horário de pico!`,
            category: 'operational',
            severity: '🔴',
          });
        }

        // 2. Check cancellation rate > 5% today
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);

        const ordersToday = await tx.order.findMany({
          where: {
            merchantId: merchant.id,
            createdAt: { gte: startOfDay },
          },
        });

        if (ordersToday.length > 0) {
          const cancelled = ordersToday.filter(o => o.status === 'CANCELLED').length;
          const rate = (cancelled / ordersToday.length) * 100;
          if (rate > 5) {
            incidents.push({
              type: 'WARNING',
              merchantId: merchant.id,
              merchantName: merchant.name || merchant.corporateName,
              message: `Taxa de cancelamento alta em ${merchant.name}: ${rate.toFixed(1)}%`,
              category: 'performance',
              severity: '🟡',
            });
          }
        }

        // 3. Connection failures
        if (status === 'ERROR') {
          incidents.push({
            type: 'CRITICAL',
            merchantId: merchant.id,
            merchantName: merchant.name || merchant.corporateName,
            message: `Falha de conexão detectada na loja ${merchant.name}.`,
            category: 'connection',
            severity: '🔴',
          });
        }
      }

      return NextResponse.json(incidents);
    });
  } catch (err) {
    return toErrorResponse(err);
  }
}
