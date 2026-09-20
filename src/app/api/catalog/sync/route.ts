import { NextRequest, NextResponse } from 'next/server';
import { RBACService } from '@/lib/auth/rbac';
import { toErrorResponse } from '@/lib/auth/errors';
import { IfoodCatalogService } from '@/lib/ifood/catalog';
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

    const service = new IfoodCatalogService();
    const result = await service.syncCatalog({
      organizationId,
      merchantId,
      actorUserId: session.id,
    });

    return NextResponse.json(result);
  } catch (err) {
    return toErrorResponse(err);
  }
}
