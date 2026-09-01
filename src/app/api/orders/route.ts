import { NextRequest, NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth/session';
import { toErrorResponse } from '@/lib/auth/errors';
import { orderRepo } from '@/repositories/orders';
import { z } from 'zod';

const QuerySchema = z.object({
  merchantId: z.string().optional(),
  status: z.string().optional(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  page: z.coerce.number().default(1),
  size: z.coerce.number().default(50),
});

export async function GET(req: NextRequest) {
  try {
    const session = await requireSession();
    if (!session.organizationId) throw new Error('Organização não definida');

    const { searchParams } = new URL(req.url);
    const query = QuerySchema.parse(Object.fromEntries(searchParams));

    const orders = await orderRepo.findMany({
      organizationId: session.organizationId,
      merchantId: query.merchantId,
      status: query.status as any,
      startTime: query.startTime ? new Date(query.startTime) : undefined,
      endTime: query.endTime ? new Date(query.endTime) : undefined,
      skip: (query.page - 1) * query.size,
      take: query.size,
    });

    return NextResponse.json({ orders });
  } catch (err) {
    return toErrorResponse(err);
  }
}
