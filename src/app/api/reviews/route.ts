import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/session';
import { toErrorResponse } from '@/lib/auth/errors';
import { IfoodClient } from '@/lib/ifood/client';
import { IfoodAuthService } from '@/lib/ifood/auth';
import { IfoodReviewService } from '@/lib/ifood/reviews';
import { getServerEnv } from '@/lib/env';
import { ifoodCredentialRepo } from '@/repositories/ifood-credentials';

export async function GET(request: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) return toErrorResponse(new Error('Unauthorized'), 401);

    const { searchParams } = new URL(request.url);
    const merchantId = searchParams.get('merchantId');
    if (!merchantId) return toErrorResponse(new Error('merchantId is required'), 400);

    const env = getServerEnv();
    const client = new IfoodClient();

    // Fixed IfoodAuthService instantiation with required dependencies
    const auth = new IfoodAuthService(
      async (clientId, clientSecret) => {
        const res = await client.request({
          method: 'POST',
          path: '/oauth/token',
          body: {
            client_id: clientId,
            client_secret: clientSecret,
            grant_type: 'client_credentials'
          },
          bearerToken: 'NONE', // OAuth token endpoint doesn't use Bearer
        });
        return res;
      },
      ifoodCredentialRepo.loadDecrypted,
      async (orgId, env, token) => {
        await ifoodCredentialRepo.persistAccessToken(orgId, env, token.token, token.expiresAt);
      }
    );

    const reviewService = new IfoodReviewService(client, auth);

    const iFoodEnv = (process.env.IFOOD_ENVIRONMENT as 'sandbox' | 'production') || 'sandbox';

    const [reviews, summary] = await Promise.all([
      reviewService.getReviews(merchantId, user.organizationId!, iFoodEnv),
      reviewService.getReviewSummary(merchantId, user.organizationId!, iFoodEnv),
    ]);

    return NextResponse.json({ reviews, summary });
  } catch (error: any) {
    return toErrorResponse(error, 500);
  }
}
