export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server';
import { RBACService } from '@/lib/auth/rbac';
import { withTenantContext } from '@/lib/db/tenant';
import { prisma } from '@/lib/db/prisma';
import { toErrorResponse } from '@/lib/auth/errors';
import { parseISO, isValid } from 'date-fns';

export async function GET(req: NextRequest) {
  try {
    const session = await RBACService.requireRole('VIEWER');
    const { searchParams } = new URL(req.url);

    const startTimeStr = searchParams.get('startTime');
    const endTimeStr = searchParams.get('endTime');
    const merchantIds = searchParams.get('merchantIds')?.split(',').filter(Boolean);

    const startTime = startTimeStr ? parseISO(startTimeStr) : undefined;
    const endTime = endTimeStr ? parseISO(endTimeStr) : undefined;

    if ((startTimeStr && !isValid(startTime!)) || (endTimeStr && !isValid(endTime!))) {
      return toErrorResponse(new Error('Invalid date format. Use ISO 8601.'), 400);
    }

    return await withTenantContext(session.organizationId!, async (tx) => {
      const where: any = {
        organizationId: session.organizationId,
      };

      if (merchantIds && merchantIds.length > 0) {
        where.merchantId = { in: merchantIds };
      }
      if (startTime) {
        where.createdAt = { ...where.createdAt, gte: startTime };
      }
      if (endTime) {
        where.createdAt = { ...where.createdAt, lte: endTime };
      }

      // 1. Aggregate Global Stats
      const aggregate = await tx.order.aggregate({
        where,
        _sum: { total: true },
        _count: { _all: true },
      });

      const totalRevenue = Number(aggregate._sum?.total || 0);
      const totalOrders = (aggregate._count as any)?._all || 0;

      // 2. Calculate Cancellation Rate
      const cancelledCount = await tx.order.count({
        where: {
          ...where,
          status: 'CANCELLED',
        },
      });

      const cancellationRate = totalOrders > 0
        ? (cancelledCount / totalOrders) * 100
        : 0;

      // 3. Breakdown by Merchant
      const merchantBreakdown = await tx.order.groupBy({
        by: ['merchantId'],
        where,
        _sum: { total: true },
        _count: { _all: true },
      });

      // Fetch merchant names to enrich the breakdown
      const merchants = await tx.merchant.findMany({
        where: {
          organizationId: session.organizationId as string,
          ...(merchantIds && { id: { in: merchantIds } })
        },
        select: { id: true, name: true },
      });

      const merchantMap = new Map(merchants.map(m => [m.id, m.name]));

      const formattedBreakdown = merchantBreakdown.map(b => ({
        merchantId: b.merchantId,
        name: merchantMap.get(b.merchantId) || 'Unknown',
        revenue: Number(b._sum?.total || 0),
        orders: (b._count as any)?._all || 0,
        avgTicket: ((b._count as any)?._all || 0) > 0 ? Number(b._sum?.total || 0) / ((b._count as any)?._all || 0) : 0,
      }));

      return NextResponse.json({
        summary: {
          totalRevenue,
          totalOrders,
          avgTicket: totalOrders > 0 ? totalRevenue / totalOrders : 0,
          cancellationRate,
        },
        breakdown: formattedBreakdown,
      });
    });
  } catch (error: any) {
    return toErrorResponse(error, error.status || 500);
  }
}
