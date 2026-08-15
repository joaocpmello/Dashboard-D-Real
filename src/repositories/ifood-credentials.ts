import 'server-only';
import { prisma } from '@/lib/db/prisma';
import { withTenantContext } from '@/lib/db/tenant';
import { decryptSecret, encryptSecret } from '@/lib/crypto/secrets';
import type { IfoodEnvironment } from '@/lib/ifood/types/merchant';

export const ifoodCredentialRepo = {
  // Lê credenciais descriptografadas dentro do contexto de tenant.
  // Chamado pelo IfoodAuthService — NUNCA expor isso via API HTTP.
  async loadDecrypted(organizationId: string, env: IfoodEnvironment) {
    return withTenantContext(organizationId, async (tx) => {
      const row = await tx.ifoodCredential.findUnique({
        where: { organizationId_environment: { organizationId, environment: env } },
      });
      if (!row) {
        throw new Error(`Credenciais iFood (${env}) não configuradas para esta organização`);
      }
      return {
        clientId: row.clientId,
        clientSecret: decryptSecret(row.clientSecretCipher, row.clientSecretKeyVersion),
        accessToken: row.accessTokenCipher
          ? decryptSecret(row.accessTokenCipher, row.accessTokenKeyVersion ?? 1)
          : null,
        accessTokenExpiresAt: row.accessTokenExpiresAt,
      };
    });
  },

  async persistAccessToken(
    organizationId: string,
    env: IfoodEnvironment,
    token: string,
    expiresAt: Date,
  ): Promise<void> {
    const enc = encryptSecret(token);
    await withTenantContext(organizationId, async (tx) => {
      await tx.ifoodCredential.update({
        where: { organizationId_environment: { organizationId, environment: env } },
        data: {
          accessTokenCipher: enc.cipher,
          accessTokenKeyVersion: enc.keyVersion,
          accessTokenExpiresAt: expiresAt,
        },
      });
    });
  },

  // Criar/atualizar credenciais — usado por endpoint interno após input do ADMIN.
  async upsert(input: {
    organizationId: string;
    environment: IfoodEnvironment;
    clientId: string;
    clientSecret: string;
  }) {
    const enc = encryptSecret(input.clientSecret);
    return withTenantContext(input.organizationId, (tx) =>
      tx.ifoodCredential.upsert({
        where: {
          organizationId_environment: {
            organizationId: input.organizationId,
            environment: input.environment,
          },
        },
        create: {
          organizationId: input.organizationId,
          environment: input.environment,
          clientId: input.clientId,
          clientSecretCipher: enc.cipher,
          clientSecretKeyVersion: enc.keyVersion,
        },
        update: {
          clientId: input.clientId,
          clientSecretCipher: enc.cipher,
          clientSecretKeyVersion: enc.keyVersion,
          // ao trocar credenciais, descarta token antigo.
          accessTokenCipher: null,
          accessTokenExpiresAt: null,
        },
      }),
    );
  },

  // Resposta ao cliente: SEMPRE sem o client_secret / tokens.
  async publicView(organizationId: string, env: IfoodEnvironment) {
    return withTenantContext(organizationId, async (tx) => {
      const row = await tx.ifoodCredential.findUnique({
        where: { organizationId_environment: { organizationId, environment: env } },
      });
      if (!row) return null;
      return {
        environment: row.environment,
        clientId: row.clientId,
        hasToken: !!row.accessTokenCipher,
        expiresAt: row.accessTokenExpiresAt,
        updatedAt: row.updatedAt,
      };
    });
  },
};
