export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server';
import { RBACService } from '@/lib/auth/rbac';
import { withTenantContext } from '@/lib/db/tenant';
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

      // 1. Fetch Detailed Orders for the export
      const orders = await tx.order.findMany({
        where,
        include: { merchant: true },
        orderBy: { createdAt: 'desc' },
      });

      // 2. Generate CSV content
      const headers = ['Order ID', 'Store', 'Date', 'Status', 'Total', 'Customer'];
      const rows = (orders as any[]).map(o => [
        o.ifoodOrderId,
        o.merchant?.name || 'N/A',
        o.createdAt.toISOString(),
        o.status,
        o.total.toString(),
        o.customerName || 'N/A',
      ]);

      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
      ].join('\\n');

      return new NextResponse(csvContent, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': 'attachment; filename=sales_report.csv',
        },
      });
    });
  } catch (error: any) {
    return toErrorResponse(error, error.status || 500);
  }
}
