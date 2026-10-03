import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { withTenantContext } from '@/lib/db/tenant';
import { encryptSecret } from '@/lib/crypto/secrets';
import { IfoodEnvironment } from '@prisma/client';
import { requireSession } from '@/lib/auth/session';

export async function POST(req: Request) {
  try {
    const session = await requireSession();
    const organizationId = session.organizationId;

    if (!organizationId) {
      return NextResponse.json({ error: 'Organization not found in session' }, { status: 400 });
    }

    const { environment = 'production' } = await req.json();

    if (!Object.values(IfoodEnvironment).includes(environment as IfoodEnvironment)) {
      return NextResponse.json({ error: 'Invalid environment' }, { status: 400 });
    }

    return await withTenantContext(organizationId, async (tx) => {
      const clientId = environment === 'sandbox'
        ? process.env.IFOOD_SANDBOX_CLIENT_ID
        : process.env.IFOOD_CLIENT_ID;

      const clientSecret = environment === 'sandbox'
        ? process.env.IFOOD_SANDBOX_CLIENT_SECRET
        : process.env.IFOOD_CLIENT_SECRET;

      if (!clientId || !clientSecret) {
        throw new Error(`Credentials for ${environment} environment are not configured on the server.`);
      }

      // Centralized flow: verify credentials by attempting to get a token
      const response = await fetch('https://merchant-api.ifood.com.br/authentication/v1.0/oauth/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json',
        },
        body: new URLSearchParams({
          grantType: 'client_credentials',
          clientId,
          clientSecret,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to verify iFood credentials');
      }

      const data = await response.json();

      // Persist as connected
      await tx.ifoodCredential.upsert({
        where: { organizationId_environment: { organizationId, environment: environment as IfoodEnvironment } },
        create: {
          organizationId,
          environment: environment as IfoodEnvironment,
          applicationType: 'CENTRALIZED',
          connectionStatus: 'CONNECTED',
          clientId,
          clientSecretCipher: encryptSecret(clientSecret).cipher,
          clientSecretKeyVersion: 1,
          accessTokenCipher: encryptSecret(data.accessToken).cipher,
          accessTokenKeyVersion: 1,
          accessTokenExpiresAt: new Date(Date.now() + data.expiresIn * 1000),
          authorizationCompletedAt: new Date(),
        },
        update: {
          connectionStatus: 'CONNECTED',
          clientId,
          clientSecretCipher: encryptSecret(clientSecret).cipher,
          clientSecretKeyVersion: 1,
          accessTokenCipher: encryptSecret(data.accessToken).cipher,
          accessTokenKeyVersion: 1,
          accessTokenExpiresAt: new Date(Date.now() + data.expiresIn * 1000),
          authorizationCompletedAt: new Date(),
        },
      });

      return NextResponse.json({ status: 'CONNECTED' });
    });
  } catch (error: any) {
    console.error('[IFOOD_CONNECT_ERROR]:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}