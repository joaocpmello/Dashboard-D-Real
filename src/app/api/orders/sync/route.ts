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
    const organizationId = session.organizationId;
    if (!organizationId) {
      return NextResponse.json({ error: 'Organização não definida' }, { status: 400 });
    }
    const body = await req.json();
    const { merchantId } = SyncSchema.parse(body);

    const service = new IfoodOrderService();
    const result = await service.syncOrders({
      organizationId,
      actorUserId: session.id,
      merchantId,
    });

    return NextResponse.json(result);
  } catch (err) {
    return toErrorResponse(err);
  }
}
