import { NextRequest, NextResponse } from 'next/server';
import { getOrderDetail } from '@/lib/data';
import { getSessionUser } from '@/lib/auth/session';
import { toErrorResponse } from '@/lib/auth/errors';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getSessionUser();
    if (!user) return toErrorResponse(new Error('Unauthorized'), 401);

    const { id } = params;
    const order = await getOrderDetail(id, user.organizationId);

    if (!order) {
      return toErrorResponse(new Error('Order not found'), 404);
    }

    return NextResponse.json(order);
  } catch (error: any) {
    return toErrorResponse(error, 500);
  }
}
