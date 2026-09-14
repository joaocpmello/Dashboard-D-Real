import { NextRequest, NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth/session';
import { toErrorResponse } from '@/lib/auth/errors';
import { IfoodClient } from '@/lib/ifood/client';
import { IfoodAuthService } from '@/lib/ifood/auth';
import { IfoodPromotionService } from '@/lib/ifood/promotion';
import { getServerEnv } from '@/lib/env';
import { ifoodCredentialRepo } from '@/repositories/ifood-credentials';
import type { IfoodTokenResponse } from '@/lib/ifood/types/token';

export async function GET(request: NextRequest) {
  try {
    const session = await requireSession();
    const organizationId = session.organizationId;
    if (!organizationId) {
      return NextResponse.json({ error: 'Organização não definida' }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const merchantId = searchParams.get('merchantId');
    if (!merchantId) return toErrorResponse(new Error('merchantId is required'), 400);

    const env = getServerEnv();
    const client = new IfoodClient();

    const auth = new IfoodAuthService(
      async (clientId, clientSecret): Promise<IfoodTokenResponse> => {
        const res = await client.request<IfoodTokenResponse>({
          method: 'POST',
          path: '/oauth/token',
          body: {
            client_id: clientId,
            client_secret: clientSecret,
            grant_type: 'client_credentials',
          },
          bearerToken: 'NONE',
        });
        return res;
      },
      ifoodCredentialRepo.loadDecrypted,
      async (orgId, env, token) => {
        await ifoodCredentialRepo.persistAccessToken(orgId, env, token.token, token.expiresAt);
      }
    );

    const promotionService = new IfoodPromotionService(client, auth);
    const iFoodEnv = (process.env.IFOOD_ENVIRONMENT as 'sandbox' | 'production') || 'sandbox';

    const promotions = await promotionService.getActivePromotions(merchantId, organizationId, iFoodEnv);

    return NextResponse.json(promotions);
  } catch (error: any) {
    return toErrorResponse(error, 500);
  }
}
