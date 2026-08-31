import { NextRequest, NextResponse } from 'next/server';
import { RBACService } from '@/lib/auth/rbac';
import { toErrorResponse } from '@/lib/auth/with-auth';
import { IfoodCatalogService } from '@/lib/ifood/catalog';
import { z } from 'zod';

const AvailabilityUpdateSchema = z.object({
  ifoodProductId: z.string(),
  active: z.boolean(),
});

export async function PATCH(req: NextRequest) {
  try {
    const session = await RBACService.requireRole('ADMIN');
    if (!session.organizationId) throw new Error('Organização não definida');

    const body = await req.json();
    const { ifoodProductId, active } = AvailabilityUpdateSchema.parse(body);

    const service = new IfoodCatalogService();
    await service.updateAvailability({
      organizationId: session.organizationId,
      ifoodProductId,
      active,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    return toErrorResponse(err);
  }
}
