import 'server-only';
import { prisma } from '@/lib/db/prisma';
import { withTenantContext } from '@/lib/db/tenant';
import { decryptSecret, encryptSecret } from '@/lib/crypto/secrets';
import type { IfoodEnvironment } from '@prisma/client';

/**
 * TokenManager handles the lifecycle of iFood access tokens for Distributed connections.
 * It ensures tokens are valid, handles automatic rotation via refresh_token,
 * and prevents race conditions using transactional locks.
 */
export class IfoodTokenManager {
  private static readonly SAFETY_MARGIN_SEC = 300; // 5 minutes

  /**
   * Retrieves a valid access token for a given credential.
   * If the token is expired or about to expire, it triggers a refresh.
   */
  static async getAccessToken(
    organizationId: string,
    environment: IfoodEnvironment,
    connectionId?: string
  ): Promise<{ accessToken: string; credentialId: string }> {

    // 1. Identify the credential to use
    const credential = await withTenantContext(organizationId, async (tx) => {
      return tx.ifoodCredential.findFirst({
        where: {
          organizationId,
          environment,
          ...(connectionId ? { id: connectionId } : { applicationType: 'DISTRIBUTED' }),
        },
      });
    });

    if (!credential) {
      throw new Error('No valid iFood connection found for this organization/environment');
    }

    // 2. Check if current token is still valid
    if (credential.accessTokenCipher && credential.accessTokenExpiresAt) {
      const isExpired = credential.accessTokenExpiresAt.getTime() < Date.now() + this.SAFETY_MARGIN_SEC * 1000;
      if (!isExpired) {
        return {
          accessToken: decryptSecret(credential.accessTokenCipher, credential.accessTokenKeyVersion ?? 1),
          credentialId: credential.id,
        };
      }
    }

    // 3. Token is expired or missing -> Perform Refresh
    // We use a transaction to act as a lock and prevent multiple simultaneous refreshes
    return await withTenantContext(organizationId, async (tx) => {
      // Re-fetch the latest state inside the transaction to avoid race conditions
      const latest = await tx.ifoodCredential.findUnique({
        where: { id: credential.id },
      });

      if (!latest) throw new Error('Credential disappeared during refresh');

      // Double-check expiration inside lock
      if (latest.accessTokenCipher && latest.accessTokenExpiresAt) {
        const isExpired = latest.accessTokenExpiresAt.getTime() < Date.now() + this.SAFETY_MARGIN_SEC * 1000;
        if (!isExpired) {
          return {
            accessToken: decryptSecret(latest.accessTokenCipher, latest.accessTokenKeyVersion ?? 1),
            credentialId: latest.id,
          };
        }
      }

      // 4. Perform the Refresh Flow
      if (!latest.encryptedRefreshToken) {
        throw new Error('No refresh token available. New authorization required.');
      }

      const refreshToken = decryptSecret(
        latest.encryptedRefreshToken,
        latest.encryptedRefreshTokenKeyVersion ?? 1
      );

      try {
        const res = await fetch('https://merchant-api.ifood.com.br/authentication/v1.0/oauth/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            grant_type: 'refresh_token',
            client_id: process.env.IFOOD_CLIENT_ID || '',
            client_secret: process.env.IFOOD_CLIENT_SECRET || '',
            refresh_token: refreshToken,
          }),
        });

        if (!res.ok) {
          const error = await res.json().catch(() => ({}));
          console.error('[IFOOD_TOKEN_REFRESH_ERROR]:', error);

          // If the refresh token is revoked or invalid, mark connection as EXPIRED
          await tx.ifoodCredential.update({
            where: { id: latest.id },
            data: { connectionStatus: 'EXPIRED' },
          });

          throw new Error('iFood refresh token is no longer valid. Please re-authorize.');
        }

        const data = await res.json();
        const { accessToken, refreshToken: newRefreshToken, expiresIn } = data;

        const encAccessToken = encryptSecret(accessToken);
        const encRefreshToken = encryptSecret(newRefreshToken);

        await tx.ifoodCredential.update({
          where: { id: latest.id },
          data: {
            accessTokenCipher: encAccessToken.cipher,
            accessTokenKeyVersion: encAccessToken.keyVersion,
            accessTokenExpiresAt: new Date(Date.now() + expiresIn * 1000),
            encryptedRefreshToken: encRefreshToken.cipher,
            encryptedRefreshTokenKeyVersion: encRefreshToken.keyVersion,
            connectionStatus: 'CONNECTED',
          },
        });

        return {
          accessToken,
          credentialId: latest.id,
        };
      } catch (err: any) {
        console.error('[IFOOD_TOKEN_MANAGER_EXCEPTION]:', err);
        throw err;
      }
    });
  }
}
