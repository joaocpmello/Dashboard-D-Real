import { NextRequest, NextResponse } from 'next/server';
import { RBACService } from '@/lib/auth/rbac';
import { withTenantContext } from '@/lib/db/tenant';
import { prisma } from '@/lib/db/prisma';
import { toErrorResponse } from '@/lib/auth/errors';
import { ifoodReportService } from '@/lib/ifood/report';
import { IfoodEnvironment } from '@/lib/ifood/types/merchant';
import { parseISO, isValid } from 'date-fns';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await RBACService.requireRole('VIEWER');
    const merchantId = params.id;
    const { searchParams } = new URL(req.url);

    const startTimeStr = searchParams.get('startTime');
    const endTimeStr = searchParams.get('endTime');
    const env = (searchParams.get('env') as IfoodEnvironment) || 'production';

    if (!startTimeStr || !endTimeStr) {
      return toErrorResponse(new Error('Missing startTime or endTime parameters.'), 400);
    }

    const startTime = parseISO(startTimeStr);
    const endTime = parseISO(endTimeStr);

    if (!isValid(startTime) || !isValid(endTime)) {
      return toErrorResponse(new Error('Invalid date format. Use ISO 8601.'), 400);
    }

    return await withTenantContext(session.organizationId!, async (tx) => {
      // 1. Validate merchant ownership
      const merchant = await tx.merchant.findUnique({
        where: { id: merchantId },
      });

      if (!merchant || merchant.organizationId !== session.organizationId) {
        return toErrorResponse(new Error('Merchant not found or access denied.'), 403);
      }

      // 2. Fetch report from iFood Service
      const report = await ifoodReportService.getStoreReport(
        session.organizationId!,
        merchant.ifoodMerchantId,
        env,
        { startTime, endTime },
      );

      return NextResponse.json({
        merchant: {
          id: merchant.id,
          name: merchant.name,
          ifoodMerchantId: merchant.ifoodMerchantId,
        },
        report,
      });
    });
  } catch (error: any) {
    return toErrorResponse(error, error.status || 500);
  }
}
