import { NextRequest, NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth/session';
import { toErrorResponse } from '@/lib/auth/errors';
import { categoryRepo } from '@/repositories/categories';
import { productRepo } from '@/repositories/products';
import { z } from 'zod';

const QuerySchema = z.object({
  merchantId: z.string(),
  categoryId: z.string().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const session = await requireSession();
    const organizationId = session.organizationId;
    if (!organizationId) {
      return NextResponse.json({ error: 'Organização não definida' }, { status: 400 });
    }

    const { searchParams } = new URL(req.url);
    const query = QuerySchema.parse(Object.fromEntries(searchParams));

    const [categories, products] = await Promise.all([
      categoryRepo.findMany({
        organizationId,
        merchantId: query.merchantId,
      }),
      productRepo.findMany({
        organizationId,
        merchantId: query.merchantId,
        categoryId: query.categoryId,
      }),
    ]);

    return NextResponse.json({ categories, products });
  } catch (err) {
    return toErrorResponse(err);
  }
}
