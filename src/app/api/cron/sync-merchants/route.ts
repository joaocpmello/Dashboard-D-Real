import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { IfoodMerchantService } from '@/lib/ifood/merchant';
import { toErrorResponse } from '@/lib/auth/errors';

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return toErrorResponse(new Error('Unauthorized'), 401);
    }

    const merchantService = new IfoodMerchantService();
    const orgs = await prisma.organization.findMany({ select: { id: true } });

    let totalProcessed = 0;
    let errors = [];

    for (const org of orgs) {
      try {
        const result = await merchantService.listAndSync({
          organizationId: org.id,
          actorUserId: 'system-cron',
        });
        totalProcessed += result.merchants.length;
      } catch (e: any) {
        errors.push({ orgId: org.id, error: e.message });
      }
    }

    return NextResponse.json({
      ok: true,
      totalProcessed,
      errors,
    });
  } catch (error: any) {
    return toErrorResponse(error, 500);
  }
}
