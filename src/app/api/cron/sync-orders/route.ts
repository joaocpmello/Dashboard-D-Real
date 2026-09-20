export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { IfoodOrderService } from '@/lib/ifood/order';
import { toErrorResponse } from '@/lib/auth/errors';

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return toErrorResponse(new Error('Unauthorized'), 401);
    }

    const orderService = new IfoodOrderService();
    const orgs = await prisma.organization.findMany({ select: { id: true } });

    let totalSynced = 0;
    let errors = [];

    for (const org of orgs) {
      try {
        const merchants = await prisma.merchant.findMany({
          where: { organizationId: org.id },
          select: { id: true },
        });

        for (const m of merchants) {
          const result = await orderService.syncOrders({
            organizationId: org.id,
            actorUserId: 'system-cron',
            merchantId: m.id,
          });
          totalSynced += result.syncedCount;
        }
      } catch (e: any) {
        errors.push({ orgId: org.id, error: e.message });
      }
    }

    return NextResponse.json({
      ok: true,
      totalSynced,
      errors,
    });
  } catch (error: any) {
    return toErrorResponse(error, 500);
  }
}
