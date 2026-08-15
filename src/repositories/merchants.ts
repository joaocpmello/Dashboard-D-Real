import 'server-only';
import { withTenantContext } from '@/lib/db/tenant';

export const merchantRepo = {
  list(organizationId: string) {
    return withTenantContext(organizationId, (tx) =>
      tx.merchant.findMany({
        where: { organizationId },
        orderBy: { createdAt: 'desc' },
      }),
    );
  },

  count(organizationId: string) {
    return withTenantContext(organizationId, (tx) =>
      tx.merchant.count({ where: { organizationId } }),
    );
  },

  upsertFromIfood(input: {
    organizationId: string;
    ifoodMerchantId: string;
    name: string | null;
    corporateName: string | null;
    status: string | null;
  }) {
    return withTenantContext(input.organizationId, (tx) =>
      tx.merchant.upsert({
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
      }),
    );
  },
};
