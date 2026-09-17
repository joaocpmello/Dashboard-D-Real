import 'server-only';
import { withTenantContext } from '@/lib/db/tenant';
import type { Organization } from '@prisma/client';

const isUuid = (id: string) => /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(id);

export const merchantRepo = {
  async list(organizationId: string) {
    if (!isUuid(organizationId)) return [];

    return withTenantContext(organizationId, (tx) =>
      tx.merchant.findMany({
        where: { organizationId },
        orderBy: { createdAt: 'desc' },
      }),
    );
  },

  async count(organizationId: string) {
    if (!isUuid(organizationId)) return 0;

    return withTenantContext(organizationId, (tx) =>
      tx.merchant.count({ where: { organizationId } }),
    );
  },

  async upsertFromIfood(input: {
    organizationId: string;
    ifoodMerchantId: string;
    name: string | null;
    corporateName: string | null;
    status: string | null;
  }) {
    if (!isUuid(input.organizationId)) {
      throw new Error('Invalid organizationId format');
    }

    return withTenantContext(input.organizationId, async (tx) => {
      const existing = await tx.merchant.findUnique({
        where: {
          organizationId_ifoodMerchantId: {
            organizationId: input.organizationId,
            ifoodMerchantId: input.ifoodMerchantId,
          },
        },
      });

      if (!existing) {
        const org = (await tx.organization.findUnique({
          where: { id: input.organizationId },
        })) as any;

        if (!org) throw new Error('Organização não encontrada');

        const count = await tx.merchant.count({
          where: { organizationId: input.organizationId },
        });

        if (count >= org.maxMerchants) {
          throw new Error(`Limite de lojas atingido para o plano ${org.plan}.`);
        }
      }

      return tx.merchant.upsert({
        where: {
          organizationId_ifoodMerchantId: {
            organizationId: input.organizationId,
            ifoodMerchantId: input.ifoodMerchantId,
          },
        },
        create: {
          organizationId: input.organizationId,
          ifoodMerchantId: input.ifoodMerchantId,
          name: input.name,
          corporateName: input.corporateName,
          status: input.status,
          lastSyncedAt: new Date(),
        },
        update: {
          name: input.name,
          corporateName: input.corporateName,
          status: input.status,
          lastSyncedAt: new Date(),
        },
      });
    });
  },
};
