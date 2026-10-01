import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { withTenantContext } from '@/lib/db/tenant';
import { requireSession } from '@/lib/auth/session';

/**
 * Bind a specific iFood merchant to the organization.
 * Validates that the merchant is actually authorized via the connection.
 */
export async function POST(
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

    const { ifoodMerchantId, name, document } = await req.json();

    if (!ifoodMerchantId) {
      return NextResponse.json({ error: 'Missing ifoodMerchantId' }, { status: 400 });
    }

    return await withTenantContext(organizationId, async (tx) => {
      // 1. Verify that this connection exists and belongs to the organization
      const connection = await tx.ifoodCredential.findUnique({
        where: { id: connectionId },
      });

      if (!connection || connection.organizationId !== organizationId) {
        return NextResponse.json({ error: 'Invalid or unauthorized connection' }, { status: 403 });
      }

      // 2. Validate that the merchant is actually authorized for this connection
      // We do this by calling the iFood API again to verify the ID exists in the list
      // using the current valid token.
      const { IfoodTokenManager } = await import('@/lib/ifood/token-manager');
      const { accessToken } = await IfoodTokenManager.getAccessToken(
        organizationId,
        connection.environment
      );

      const merchantsRes = await fetch('https://merchant-api.ifood.com.br/merchant/v1.0/merchants', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (!merchantsRes.ok) {
        return NextResponse.json({ error: 'Failed to verify merchants with iFood' }, { status: 500 });
      }

      const merchantsData = await merchantsRes.json();
      const authorizedIds = (merchantsData.merchants || []).map((m: any) => m.id);

      if (!authorizedIds.includes(ifoodMerchantId)) {
        return NextResponse.json({ error: 'Merchant not authorized for this connection' }, { status: 403 });
      }

      // 3. Bind the merchant to the organization
      const merchant = await tx.merchant.upsert({
        where: {
          organizationId_ifoodMerchantId: {
            organizationId,
            ifoodMerchantId,
          },
        },
        create: {
          organizationId,
          ifoodMerchantId,
          name: name || 'Unknown Merchant',
          corporateName: document || '',
        },
        update: {
          name: name || 'Unknown Merchant',
          corporateName: document || '',
        },
      });

      return NextResponse.json({
        status: 'LINKED',
        merchant,
      });
    });
  } catch (error: any) {
    console.error('[IFOOD_BIND_MERCHANT_ERROR]:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
