import { NextResponse } from 'next/server';
import { IfoodTokenManager } from '@/lib/ifood/token-manager';
import { withTenantContext } from '@/lib/db/tenant';
import { requireSession } from '@/lib/auth/session';
import { IfoodEnvironment } from '@prisma/client';

/**
 * List authorized merchants for a specific Distributed connection.
 */
export async function GET(
  req: Request,
  { params }: { params: { connectionId: string } }
) {
  try {
    const session = await requireSession();
    const organizationId = session.organizationId;
    const { connectionId } = params;

    if (!organizationId) {
      return NextResponse.json({ error: 'Organization not found in session' }, { status: 400 });
    }

    // 1. Get a valid token using the TokenManager
    // We use a default environment or extract from query params
    const { searchParams } = new URL(req.url);
    const environment = (searchParams.get('environment') as IfoodEnvironment) || 'production';

    const { accessToken } = await IfoodTokenManager.getAccessToken(
      organizationId,
      environment,
      connectionId
    );

    // 2. Call iFood to list merchants authorized for this token
    const response = await fetch('https://merchant-api.ifood.com.br/merchant/v1.0/merchants', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `iFood API error: ${response.statusText}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    const merchants = data.merchants || [];

    return NextResponse.json({
      merchants: merchants.map((m: any) => ({
        ifoodMerchantId: m.id,
        name: m.name,
        document: m.document,
      })),
    });
  } catch (error: any) {
    console.error('[IFOOD_LIST_MERCHANTS_ERROR]:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
