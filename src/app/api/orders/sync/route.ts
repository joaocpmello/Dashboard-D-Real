import { NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth/session';
import { IfoodOrderService } from '@/lib/ifood/order';
import { IfoodEnvironment } from '@prisma/client';

/**
 * Sync iFood orders for a merchant.
 * Supports both Centralized and Distributed flows via the TokenManager.
 */
export async function POST(req: Request) {
  try {
    const session = await requireSession();
    const organizationId = session.organizationId;

    if (!organizationId) {
      return NextResponse.json({ error: 'Organization not found in session' }, { status: 400 });
    }

    const { merchantId, environment = 'production' } = await req.json();

    if (!merchantId) {
      return NextResponse.json({ error: 'Missing merchantId' }, { status: 400 });
    }

    const service = new IfoodOrderService();
    const result = await service.syncOrders({
      organizationId,
      actorUserId: session.userId,
      merchantId,
      environment: environment as IfoodEnvironment,
    });

    return NextResponse.json({
      status: 'SUCCESS',
      syncedCount: result.syncedCount,
    });
  } catch (error: any) {
    console.error('[ORDERS_SYNC_ERROR]:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
