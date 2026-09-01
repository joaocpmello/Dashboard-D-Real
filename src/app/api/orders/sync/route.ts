import { NextRequest, NextResponse } from 'next/server';
import { RBACService } from '@/lib/auth/rbac';
import { toErrorResponse } from '@/lib/auth/errors';
import { IfoodOrderService } from '@/lib/ifood/order';
import { z } from 'zod';

const SyncSchema = z.object({
  merchantId: z.string(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await RBACService.requireRole('ADMIN');
    const body = await req.json();
    const { merchantId } = SyncSchema.parse(body);

    if (!session.organizationId) throw new Error('Organização não definida');

    const service = new IfoodOrderService();
    const result = await service.syncOrders({
      organizationId: session.organizationId,
      actorUserId: session.id,
      merchantId,
    });

    return NextResponse.json(result);
  } catch (err) {
    return toErrorResponse(err);
  }
}
