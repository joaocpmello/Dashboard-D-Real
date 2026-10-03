import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { withTenantContext } from '@/lib/db/tenant';
import { encryptSecret } from '@/lib/crypto/secrets';
import { randomBytes } from 'node:crypto';
import { IfoodEnvironment } from '@prisma/client';
import { requireSession } from '@/lib/auth/session';

/**
 * iFood Distributed Authorization Start
 *
 * Generates a PKCE code_verifier, computes the challenge,
 * and requests a userCode from iFood to start the authorization flow.
 */
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
      // 1. Generate PKCE verifier (cryptographically secure random string)
      const verifier = randomBytes(32).toString('base64url');
      const { cipher, keyVersion } = encryptSecret(verifier);

      // Compute S256 Challenge for PKCE
      const challengeBuffer = require('node:crypto').createHash('sha256').update(verifier).digest();
      const codeChallenge = Buffer.from(challengeBuffer).toString('base64url');

      // 2. Check for existing pending connection to avoid duplicates
      const existing = await tx.ifoodCredential.findUnique({
        where: { organizationId_environment: { organizationId, environment: environment as IfoodEnvironment } },
      });

      // 3. Determine which credentials to use based on the environment
      const clientId = environment === 'sandbox'
        ? process.env.IFOOD_SANDBOX_CLIENT_ID
        : process.env.IFOOD_CLIENT_ID;

      const clientSecret = environment === 'sandbox'
        ? process.env.IFOOD_SANDBOX_CLIENT_SECRET
        : process.env.IFOOD_CLIENT_SECRET;

      if (!clientId || !clientSecret) {
        console.error(`[IFOOD_AUTH_MISSING_CREDS]: Missing credentials for environment: ${environment}`);
        throw new Error(`Credentials for ${environment} environment are not configured on the server.`);
      }

      // 1. Create the Basic Auth header
      const authHeader = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

      // 2. Create the body as a JSON object
      const body = {
        grantType: 'user_code',
        clientId: clientId,
        clientSecret: clientSecret,
        authorizationCodeVerifier: codeChallenge,
        codeChallengeMethod: 'S256'
      };

      console.log(`[IFOOD_AUTH_REQUEST_BODY] [${environment}]:`, JSON.stringify(body));

      const response = await fetch('https://merchant-api.ifood.com.br/authentication/v1.0/oauth/token', {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${authHeader}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[IFOOD_USERCODE_RAW_ERROR]:', {
          status: response.status,
          body: errorText
        });

        let errorMessage = `iFood Error (${response.status})`;
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.error || errorData.message || JSON.stringify(errorData);
        } catch (e) {
          errorMessage = errorText || 'Unknown iFood error';
        }

        throw new Error(errorMessage);
      }

      const data = await response.json();
      const userCode = data.userCode;
      const expiresAt = new Date(Date.now() + (data.expiresIn || 600) * 1000);

      const credential = await tx.ifoodCredential.upsert({
        where: { organizationId_environment: { organizationId, environment: environment as IfoodEnvironment } },
        create: {
          organizationId,
          environment: environment as IfoodEnvironment,
          applicationType: 'DISTRIBUTED',
          connectionStatus: 'CODE_GENERATED',
          clientId: process.env.IFOOD_CLIENT_ID || 'placeholder',
          clientSecretCipher: encryptSecret(process.env.IFOOD_CLIENT_SECRET || 'placeholder').cipher,
          clientSecretKeyVersion: 1,
          userCode,
          encryptedAuthorizationCodeVerifier: cipher,
          encryptedVerifierKeyVersion: keyVersion,
          authorizationStartedAt: new Date(),
        },
        update: {
          connectionStatus: 'CODE_GENERATED',
          userCode,
          encryptedAuthorizationCodeVerifier: cipher,
          encryptedVerifierKeyVersion: keyVersion,
          authorizationStartedAt: new Date(),
        },
      });

      return NextResponse.json({
        connectionId: credential.id,
        userCode,
        verificationUrl: 'https://partner.ifood.com.br/auth', // Official iFood Partner Portal
        verificationUrlComplete: `https://partner.ifood.com.br/auth?code=${userCode}`,
        expiresIn: 600,
        expiresAt,
      });
    });
  } catch (error: any) {
    console.error('[IFOOD_AUTH_START_ERROR]:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
