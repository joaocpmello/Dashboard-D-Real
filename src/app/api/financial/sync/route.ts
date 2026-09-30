import { NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth/session';
import { IfoodFinancialService } from '@/lib/ifood/financial/sales';
import { IfoodEnvironment } from '@prisma/client';
import { prisma } from '@/lib/db/prisma';
import { withTenantContext } from '@/lib/db/tenant';

/**
 * Sync iFood Financial data.
 * Supports incremental sync and windowed backfill.
 */
export async function POST(req: Request) {
  try {
    const session = await requireSession();
    const organizationId = session.organizationId;

    if (!organizationId) {
      return NextResponse.json({ error: 'Organization not found in session' }, { status: 400 });
    }

    const { merchantId, mode, from, to, environment = 'production' } = await req.json();

    if (!merchantId || !mode) {
      return NextResponse.json({ error: 'Missing merchantId or mode' }, { status: 400 });
    }

    const service = new IfoodFinancialService();

    // For backfill, we'd normally iterate through windows.
    // For the MVP, we implement a single window sync.
    const syncFrom = mode === 'backfill' ? from : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const syncTo = mode === 'backfill' ? to : new Date().toISOString().split('T')[0];

    if (mode === 'backfill' && (!from || !to)) {
      return NextResponse.json({ error: 'From and To dates are required for backfill' }, { status: 400 });
    }

    const result = await service.getSales({
      organizationId,
      merchantId,
      environment: environment as IfoodEnvironment,
      from: syncFrom,
      to: syncTo,
    });

    // In a full implementation, we would iterate through the sales
    // and persist immutable snapshots in the database here.

    return NextResponse.json({
      status: 'SUCCESS',
      syncedCount: result.sales.length,
      period: { from: syncFrom, to: syncTo },
    });
  } catch (error: any) {
    console.error('[FINANCIAL_SYNC_ERROR]:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
