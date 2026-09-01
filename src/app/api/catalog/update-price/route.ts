import { NextRequest, NextResponse } from 'next/server';
import { RBACService } from '@/lib/auth/rbac';
import { toErrorResponse } from '@/lib/auth/errors';
import { IfoodCatalogService } from '@/lib/ifood/catalog';
import { z } from 'zod';

const PriceUpdateSchema = z.object({
  ifoodProductId: z.string(),
  newPrice: z.number().positive(),
});

export async function PATCH(req: NextRequest) {
  try {
    const session = await RBACService.requireRole('ADMIN');
    if (!session.organizationId) throw new Error('Organização não definida');

    const body = await req.json();
    const { ifoodProductId, newPrice } = PriceUpdateSchema.parse(body);

    const service = new IfoodCatalogService();
    await service.updatePrice({
      organizationId: session.organizationId,
      ifoodProductId,
      newPrice,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    return toErrorResponse(err);
  }
}
