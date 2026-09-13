import { NextRequest, NextResponse } from 'next/server';
import { RBACService } from '@/lib/auth/rbac';
import { toErrorResponse } from '@/lib/auth/errors';
import { IfoodCatalogService } from '@/lib/ifood/catalog';
import { z } from 'zod';

const AvailabilityUpdateSchema = z.object({
  ifoodProductId: z.string(),
  active: z.boolean(),
});

export async function PATCH(req: NextRequest) {
  try {
    const session = await RBACService.requireRole('ADMIN');
    const organizationId = session.organizationId;
    if (!organizationId) {
      return NextResponse.json({ error: 'Organização não definida' }, { status: 400 });
    }

    const body = await req.json();
    const { ifoodProductId, active } = AvailabilityUpdateSchema.parse(body);

    const service = new IfoodCatalogService();
    await service.updateAvailability({
      organizationId,
      ifoodProductId,
      active,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    return toErrorResponse(err);
  }
}
