import { NextRequest, NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth/session';
import { toErrorResponse } from '@/lib/auth/errors';
import { productCostRepo } from '@/repositories/productCosts';
import { z } from 'zod';

const BodySchema = z.object({
  productId: z.string(),
  cost: z.number().min(0),
});

export async function PATCH(req: NextRequest) {
  try {
    const session = await requireSession();
    const organizationId = session.organizationId;
    if (!organizationId) {
      return NextResponse.json({ error: 'Organização não definida' }, { status: 400 });
    }

    const body = await req.json();
    const input = BodySchema.parse(body);

    const cost = await productCostRepo.upsert({
      organizationId,
      productId: input.productId,
      cost: input.cost,
    });

    return NextResponse.json(cost);
  } catch (err) {
    return toErrorResponse(err);
  }
}
