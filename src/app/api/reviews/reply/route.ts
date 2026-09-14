import { NextRequest, NextResponse } from 'next/server';
import { RBACService } from '@/lib/auth/rbac';
import { toErrorResponse } from '@/lib/auth/errors';
import { IfoodClient } from '@/lib/ifood/client';
import { IfoodAuthService } from '@/lib/ifood/auth';
import { IfoodReviewService } from '@/lib/ifood/reviews';
import { getServerEnv } from '@/lib/env';
import { ifoodCredentialRepo } from '@/repositories/ifood-credentials';
import type { IfoodTokenResponse } from '@/lib/ifood/types/token';
import { z } from 'zod';

const ReplySchema = z.object({
  merchantId: z.string(),
  reviewId: z.string(),
  text: z.string().min(1).max(1000),
});

export async function POST(request: NextRequest) {
  try {
    // Permissão: OPERATOR+
    const session = await RBACService.requireRole('OPERATOR');
    const organizationId = session.organizationId;
    if (!organizationId) {
      return NextResponse.json({ error: 'Organização não definida' }, { status: 400 });
    }

    const body = await request.json();
    const { merchantId, reviewId, text } = ReplySchema.parse(body);

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

    const reviewService = new IfoodReviewService(client, auth);
    const iFoodEnv = (process.env.IFOOD_ENVIRONMENT as 'sandbox' | 'production') || 'sandbox';

    await reviewService.replyToReview(merchantId, reviewId, organizationId, iFoodEnv, text);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return toErrorResponse(error, 500);
  }
}
