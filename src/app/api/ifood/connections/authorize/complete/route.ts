import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { withTenantContext } from '@/lib/db/tenant';
import { decryptSecret, encryptSecret } from '@/lib/crypto/secrets';
import { requireSession } from '@/lib/auth/session';

/**
 * iFood Distributed Authorization Complete
 *
 * Exchanges the authorizationCode provided by the user for access and refresh tokens.
 */
export async function POST(req: Request) {
  try {
    const session = await requireSession();
    const organizationId = session.organizationId;

    if (!organizationId) {
      return NextResponse.json({ error: 'Organization not found in session' }, { status: 400 });
    }

    const { connectionId, authorizationCode } = await req.json();

    if (!connectionId || !authorizationCode) {
      return NextResponse.json({ error: 'Missing connectionId or authorizationCode' }, { status: 400 });
    }

    return await withTenantContext(organizationId, async (tx) => {
      // 1. Validate connection belongs to organization
      const connection = await tx.ifoodCredential.findFirst({
        where: {
          id: connectionId,
          organizationId,
        },
      });

      if (!connection) {
        return NextResponse.json({ error: 'Connection not found or unauthorized' }, { status: 403 });
      }

      if (connection.applicationType !== 'DISTRIBUTED') {
        return NextResponse.json({ error: 'Connection is not a Distributed flow' }, { status: 400 });
      }

      // 2. Retrieve and decrypt the PKCE verifier
      if (!connection.encryptedAuthorizationCodeVerifier || !connection.encryptedVerifierKeyVersion) {
        return NextResponse.json({ error: 'Authorization verifier not found' }, { status: 400 });
      }

      const verifier = decryptSecret(
        connection.encryptedAuthorizationCodeVerifier,
        connection.encryptedVerifierKeyVersion
      );

      // 3. Exchange code for tokens at iFood OAuth endpoint
      // Endpoint: POST https://merchant-api.ifood.com.br/authentication/v1.0/oauth/token
      const tokenResponse = await fetch('https://merchant-api.ifood.com.br/authentication/v1.0/oauth/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          client_id: process.env.IFOOD_CLIENT_ID || '',
          client_secret: process.env.IFOOD_CLIENT_SECRET || '',
          code: authorizationCode,
          code_verifier: verifier,
          redirect_uri: process.env.IFOOD_REDIRECT_URI || '',
        }),
      });

      if (!tokenResponse.ok) {
        const errorData = await tokenResponse.json().catch(() => ({}));
        console.error('[IFOOD_AUTH_COMPLETE_ERROR]:', errorData);
        return NextResponse.json(
          { error: 'Failed to exchange code for tokens. The code may have expired or is invalid.' },
          { status: tokenResponse.status }
        );
      }

      const data = await tokenResponse.json();
      const { accessToken, refreshToken, expiresIn } = data;

      // 4. Encrypt and persist tokens
      const encAccessToken = encryptSecret(accessToken);
      const encRefreshToken = encryptSecret(refreshToken);

      await tx.ifoodCredential.update({
        where: { id: connectionId },
        data: {
          accessTokenCipher: encAccessToken.cipher,
          accessTokenKeyVersion: encAccessToken.keyVersion,
          accessTokenExpiresAt: new Date(Date.now() + expiresIn * 1000),
          encryptedRefreshToken: encRefreshToken.cipher,
          encryptedRefreshTokenKeyVersion: encRefreshToken.keyVersion,
          connectionStatus: 'CONNECTED',
          authorizationCompletedAt: new Date(),
        },
      });

      // 5. Fetch authorized merchants associated with this token
      // GET /merchant/v1.0/merchants
      const merchantsRes = await fetch('https://merchant-api.ifood.com.br/merchant/v1.0/merchants', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (!merchantsRes.ok) {
        console.error('[IFOOD_MERCHANTS_FETCH_ERROR]:', merchantsRes.status);
        // We still mark as CONNECTED but warn about merchants
      }

      const merchantsData = await merchantsRes.json().catch(() => []);
      const authorizedMerchants = merchantsData.merchants || [];

      return NextResponse.json({
        status: 'CONNECTED',
        merchants: authorizedMerchants.map((m: any) => ({
          ifoodMerchantId: m.id,
          name: m.name,
          document: m.document,
        })),
      });
    });
  } catch (error: any) {
    console.error('[IFOOD_AUTH_COMPLETE_ERROR]:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
